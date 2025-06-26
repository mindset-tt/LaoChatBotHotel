# services/cache.py
import json
import time
import hashlib
import threading
from typing import Any, Dict, Optional, List, Callable
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class InMemoryCache:
    """High-performance in-memory cache with TTL and LRU eviction"""
    
    def __init__(self, max_size: int = 1000, default_ttl: int = 3600):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.cache = {}
        self.access_times = {}
        self.expire_times = {}
        self.lock = threading.RLock()
        self.stats = {
            'hits': 0,
            'misses': 0,
            'evictions': 0,
            'sets': 0
        }
    
    def _generate_key(self, key: str, prefix: str = None) -> str:
        """Generate cache key with optional prefix"""
        if prefix:
            return f"{prefix}:{key}"
        return key
    
    def _is_expired(self, key: str) -> bool:
        """Check if cache entry is expired"""
        if key not in self.expire_times:
            return True
        return time.time() > self.expire_times[key]
    
    def _evict_expired(self):
        """Remove expired entries"""
        current_time = time.time()
        expired_keys = [
            key for key, expire_time in self.expire_times.items()
            if current_time > expire_time
        ]
        
        for key in expired_keys:
            self._remove_key(key)
    
    def _evict_lru(self):
        """Evict least recently used entries"""
        if len(self.cache) < self.max_size:
            return
        
        # Sort by access time and remove oldest
        lru_keys = sorted(self.access_times.items(), key=lambda x: x[1])
        keys_to_remove = [key for key, _ in lru_keys[:len(self.cache) - self.max_size + 1]]
        
        for key in keys_to_remove:
            self._remove_key(key)
            self.stats['evictions'] += 1
    
    def _remove_key(self, key: str):
        """Remove key from all cache structures"""
        self.cache.pop(key, None)
        self.access_times.pop(key, None)
        self.expire_times.pop(key, None)
    
    def get(self, key: str, prefix: str = None) -> Optional[Any]:
        """Get value from cache"""
        with self.lock:
            cache_key = self._generate_key(key, prefix)
            
            if cache_key not in self.cache:
                self.stats['misses'] += 1
                return None
            
            if self._is_expired(cache_key):
                self._remove_key(cache_key)
                self.stats['misses'] += 1
                return None
            
            # Update access time
            self.access_times[cache_key] = time.time()
            self.stats['hits'] += 1
            return self.cache[cache_key]
    
    def set(self, key: str, value: Any, ttl: int = None, prefix: str = None):
        """Set value in cache"""
        with self.lock:
            cache_key = self._generate_key(key, prefix)
            ttl = ttl or self.default_ttl
            
            # Clean up expired entries
            self._evict_expired()
            
            # Evict LRU if needed
            self._evict_lru()
            
            # Set new value
            self.cache[cache_key] = value
            self.access_times[cache_key] = time.time()
            self.expire_times[cache_key] = time.time() + ttl
            self.stats['sets'] += 1
    
    def delete(self, key: str, prefix: str = None) -> bool:
        """Delete key from cache"""
        with self.lock:
            cache_key = self._generate_key(key, prefix)
            if cache_key in self.cache:
                self._remove_key(cache_key)
                return True
            return False
    
    def clear(self, prefix: str = None):
        """Clear cache or prefix"""
        with self.lock:
            if prefix:
                prefix_pattern = f"{prefix}:"
                keys_to_remove = [
                    key for key in self.cache.keys()
                    if key.startswith(prefix_pattern)
                ]
                for key in keys_to_remove:
                    self._remove_key(key)
            else:
                self.cache.clear()
                self.access_times.clear()
                self.expire_times.clear()
    
    def get_stats(self) -> Dict:
        """Get cache statistics"""
        with self.lock:
            total_requests = self.stats['hits'] + self.stats['misses']
            hit_rate = (self.stats['hits'] / total_requests * 100) if total_requests > 0 else 0
            
            return {
                **self.stats,
                'total_requests': total_requests,
                'hit_rate': round(hit_rate, 2),
                'cache_size': len(self.cache),
                'max_size': self.max_size
            }

class CacheService:
    """Advanced caching service with multiple cache types and strategies"""
    
    def __init__(self):
        self.memory_cache = InMemoryCache(max_size=2000, default_ttl=3600)
        self.query_cache = InMemoryCache(max_size=500, default_ttl=300)  # 5 minutes for queries
        self.ml_cache = InMemoryCache(max_size=100, default_ttl=1800)    # 30 minutes for ML results
        self.session_cache = InMemoryCache(max_size=1000, default_ttl=7200)  # 2 hours for sessions
    
    def cache_chatbot_response(self, user_input: str, response: str, 
                              source: str, ttl: int = 1800):
        """Cache chatbot response"""
        # Create hash of user input for consistent caching
        input_hash = hashlib.md5(user_input.lower().encode()).hexdigest()
        cache_data = {
            'response': response,
            'source': source,
            'timestamp': datetime.now().isoformat()
        }
        self.memory_cache.set(input_hash, cache_data, ttl=ttl, prefix='chatbot')
    
    def get_cached_chatbot_response(self, user_input: str) -> Optional[Dict]:
        """Get cached chatbot response"""
        input_hash = hashlib.md5(user_input.lower().encode()).hexdigest()
        return self.memory_cache.get(input_hash, prefix='chatbot')
    
    def cache_room_availability(self, check_in: str, check_out: str, 
                               available_rooms: List[Dict], ttl: int = 300):
        """Cache room availability results"""
        cache_key = f"{check_in}_{check_out}"
        self.query_cache.set(cache_key, available_rooms, ttl=ttl, prefix='rooms')
    
    def get_cached_room_availability(self, check_in: str, check_out: str) -> Optional[List[Dict]]:
        """Get cached room availability"""
        cache_key = f"{check_in}_{check_out}"
        return self.query_cache.get(cache_key, prefix='rooms')
    
    def cache_ml_embedding(self, text: str, embedding: List[float], ttl: int = 3600):
        """Cache ML model embeddings"""
        text_hash = hashlib.md5(text.encode()).hexdigest()
        self.ml_cache.set(text_hash, embedding, ttl=ttl, prefix='embedding')
    
    def get_cached_ml_embedding(self, text: str) -> Optional[List[float]]:
        """Get cached ML embedding"""
        text_hash = hashlib.md5(text.encode()).hexdigest()
        return self.ml_cache.get(text_hash, prefix='embedding')
    
    def cache_user_session(self, session_id: str, session_data: Dict, ttl: int = 7200):
        """Cache user session data"""
        self.session_cache.set(session_id, session_data, ttl=ttl, prefix='session')
    
    def get_cached_user_session(self, session_id: str) -> Optional[Dict]:
        """Get cached user session"""
        return self.session_cache.get(session_id, prefix='session')
    
    def cache_analytics_result(self, query_type: str, params: Dict, 
                              result: Dict, ttl: int = 600):
        """Cache analytics query results"""
        # Create cache key from query type and parameters
        params_str = json.dumps(params, sort_keys=True)
        cache_key = hashlib.md5(f"{query_type}_{params_str}".encode()).hexdigest()
        self.query_cache.set(cache_key, result, ttl=ttl, prefix='analytics')
    
    def get_cached_analytics_result(self, query_type: str, params: Dict) -> Optional[Dict]:
        """Get cached analytics result"""
        params_str = json.dumps(params, sort_keys=True)
        cache_key = hashlib.md5(f"{query_type}_{params_str}".encode()).hexdigest()
        return self.query_cache.get(cache_key, prefix='analytics')
    
    def warm_up_cache(self):
        """Pre-populate cache with frequently accessed data"""
        try:
            # This would typically load frequently accessed data
            logger.info("Cache warm-up initiated")
            
            # Example: Cache common room types, frequently asked questions, etc.
            common_queries = [
                "ລາຄາຫ້ອງເທົ່າໃດ",  # "How much is the room?"
                "ມີຫ້ອງວ່າງບໍ",      # "Do you have available rooms?"
                "ຈອງຫ້ອງແນວໃດ",     # "How to book a room?"
            ]
            
            # Pre-warm with common queries (would need actual responses)
            for query in common_queries:
                # This would cache actual common responses
                pass
                
            logger.info("Cache warm-up completed")
            
        except Exception as e:
            logger.error(f"Cache warm-up failed: {str(e)}")
    
    def get_cache_statistics(self) -> Dict:
        """Get comprehensive cache statistics"""
        return {
            'memory_cache': self.memory_cache.get_stats(),
            'query_cache': self.query_cache.get_stats(),
            'ml_cache': self.ml_cache.get_stats(),
            'session_cache': self.session_cache.get_stats(),
            'total_memory_usage': self._estimate_memory_usage()
        }
    
    def _estimate_memory_usage(self) -> str:
        """Estimate total memory usage of caches"""
        try:
            import sys
            total_size = 0
            
            for cache in [self.memory_cache, self.query_cache, self.ml_cache, self.session_cache]:
                for value in cache.cache.values():
                    total_size += sys.getsizeof(value)
            
            # Convert to human readable format
            for unit in ['B', 'KB', 'MB', 'GB']:
                if total_size < 1024.0:
                    return f"{total_size:.1f} {unit}"
                total_size /= 1024.0
            
            return f"{total_size:.1f} TB"
            
        except Exception:
            return "Unknown"
    
    def clear_all_caches(self):
        """Clear all caches"""
        self.memory_cache.clear()
        self.query_cache.clear()
        self.ml_cache.clear()
        self.session_cache.clear()
        logger.info("All caches cleared")
    
    def clear_expired_entries(self):
        """Manually trigger cleanup of expired entries"""
        for cache in [self.memory_cache, self.query_cache, self.ml_cache, self.session_cache]:
            cache._evict_expired()

# Decorator for caching function results
def cache_result(cache_service: CacheService, ttl: int = 3600, prefix: str = 'func'):
    """Decorator to cache function results"""
    def decorator(func: Callable):
        def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            key_data = f"{func.__name__}_{str(args)}_{str(sorted(kwargs.items()))}"
            cache_key = hashlib.md5(key_data.encode()).hexdigest()
            
            # Try to get from cache
            cached_result = cache_service.memory_cache.get(cache_key, prefix=prefix)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache_service.memory_cache.set(cache_key, result, ttl=ttl, prefix=prefix)
            return result
        
        return wrapper
    return decorator

# Global cache service instance
cache_service = CacheService()
