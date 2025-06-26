# services/metrics.py
import time
import threading
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class MetricPoint:
    timestamp: datetime
    value: float
    labels: Dict[str, str] = None

class MetricsCollector:
    """Thread-safe metrics collection system"""
    
    def __init__(self, max_points: int = 1000):
        self._metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=max_points))
        self._counters: Dict[str, float] = defaultdict(float)
        self._gauges: Dict[str, float] = defaultdict(float)
        self._histograms: Dict[str, List[float]] = defaultdict(list)
        self._lock = threading.RLock()
        
        # Performance tracking
        self.request_count = 0
        self.request_duration_sum = 0.0
        self.active_requests = 0
        self.error_count = 0
        
    def increment_counter(self, name: str, value: float = 1.0, labels: Dict[str, str] = None):
        """Increment a counter metric"""
        with self._lock:
            metric_key = self._build_key(name, labels)
            self._counters[metric_key] += value
            self._add_point(metric_key, self._counters[metric_key], labels)
    
    def set_gauge(self, name: str, value: float, labels: Dict[str, str] = None):
        """Set a gauge metric"""
        with self._lock:
            metric_key = self._build_key(name, labels)
            self._gauges[metric_key] = value
            self._add_point(metric_key, value, labels)
    
    def record_histogram(self, name: str, value: float, labels: Dict[str, str] = None):
        """Record a histogram value"""
        with self._lock:
            metric_key = self._build_key(name, labels)
            self._histograms[metric_key].append(value)
            # Keep only recent values
            if len(self._histograms[metric_key]) > 100:
                self._histograms[metric_key] = self._histograms[metric_key][-100:]
            self._add_point(metric_key, value, labels)
    
    def _build_key(self, name: str, labels: Dict[str, str] = None) -> str:
        """Build metric key with labels"""
        if not labels:
            return name
        label_str = ",".join(f"{k}={v}" for k, v in sorted(labels.items()))
        return f"{name}{{{label_str}}}"
    
    def _add_point(self, metric_key: str, value: float, labels: Dict[str, str] = None):
        """Add a metric point"""
        point = MetricPoint(
            timestamp=datetime.utcnow(),
            value=value,
            labels=labels or {}
        )
        self._metrics[metric_key].append(point)
    
    def get_metrics(self, name: str = None, since: datetime = None) -> Dict:
        """Get metrics data"""
        with self._lock:
            result = {}
            
            for metric_key, points in self._metrics.items():
                if name and not metric_key.startswith(name):
                    continue
                
                filtered_points = list(points)
                if since:
                    filtered_points = [p for p in points if p.timestamp >= since]
                
                if filtered_points:
                    result[metric_key] = {
                        "points": len(filtered_points),
                        "latest_value": filtered_points[-1].value,
                        "latest_timestamp": filtered_points[-1].timestamp.isoformat(),
                        "values": [p.value for p in filtered_points[-10:]]  # Last 10 values
                    }
            
            return result
    
    def get_summary(self) -> Dict:
        """Get metrics summary"""
        with self._lock:
            return {
                "counters": dict(self._counters),
                "gauges": dict(self._gauges),
                "histogram_stats": {
                    name: {
                        "count": len(values),
                        "avg": sum(values) / len(values) if values else 0,
                        "min": min(values) if values else 0,
                        "max": max(values) if values else 0
                    }
                    for name, values in self._histograms.items()
                },
                "performance": {
                    "total_requests": self.request_count,
                    "active_requests": self.active_requests,
                    "error_count": self.error_count,
                    "avg_response_time": (
                        self.request_duration_sum / self.request_count 
                        if self.request_count > 0 else 0
                    )
                }
            }
    
    def track_request_start(self):
        """Track request start"""
        with self._lock:
            self.active_requests += 1
            self.request_count += 1
    
    def track_request_end(self, duration: float, success: bool = True):
        """Track request completion"""
        with self._lock:
            self.active_requests = max(0, self.active_requests - 1)
            self.request_duration_sum += duration
            if not success:
                self.error_count += 1
            
            # Record metrics
            self.record_histogram("request_duration_seconds", duration)
            self.set_gauge("active_requests", self.active_requests)
            self.increment_counter("requests_total", labels={"status": "success" if success else "error"})

# Global metrics collector
metrics = MetricsCollector()

class RequestTimer:
    """Context manager for timing requests"""
    
    def __init__(self, operation: str = "request"):
        self.operation = operation
        self.start_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        metrics.track_request_start()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        success = exc_type is None
        metrics.track_request_end(duration, success)
        metrics.record_histogram(f"{self.operation}_duration", duration)
