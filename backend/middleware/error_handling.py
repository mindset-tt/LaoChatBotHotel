# middleware/error_handling.py
import logging
import traceback
import time
import uuid
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime

logger = logging.getLogger(__name__)
security_logger = logging.getLogger("security")
performance_logger = logging.getLogger("performance")

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            # Generate unique request ID
            request_id = str(uuid.uuid4())
            
            # Log the error with context
            logger.error(
                f"Unhandled error in request {request_id}: {str(e)}",
                extra={
                    "request_id": request_id,
                    "path": request.url.path,
                    "method": request.method,
                    "client": request.client.host if request.client else "unknown"
                },
                exc_info=True
            )
            
            # Return a generic error response
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal server error",
                    "message": "An unexpected error occurred. Please try again later.",
                    "timestamp": datetime.utcnow().isoformat(),
                    "request_id": request_id
                }
            )

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        start_time = time.time()
        start_datetime = datetime.utcnow()
        
        # Log request start
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params),
                "client_ip": request.client.host if request.client else "unknown",
                "user_agent": request.headers.get("user-agent", "unknown")
            }
        )
        
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log successful response
            performance_logger.info(
                f"Request completed: {request.method} {request.url.path} - {response.status_code}",
                extra={
                    "request_id": request_id,
                    "status_code": response.status_code,
                    "duration_ms": round(duration * 1000, 2),
                    "response_size": response.headers.get("content-length", "unknown")
                }
            )
            
            # Add performance headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time"] = f"{duration:.3f}s"
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            
            # Log failed request
            logger.error(
                f"Request failed: {request.method} {request.url.path}",
                extra={
                    "request_id": request_id,
                    "duration_ms": round(duration * 1000, 2),
                    "error": str(e)
                },
                exc_info=True
            )
            raise

class SecurityMiddleware(BaseHTTPMiddleware):
    """Security-focused middleware for monitoring and protection"""
    
    def __init__(self, app, max_request_size: int = 10 * 1024 * 1024):  # 10MB default
        super().__init__(app)
        self.max_request_size = max_request_size
        self.suspicious_patterns = [
            "script>", "javascript:", "eval(", "union select",
            "../", "passwd", "shadow", "etc/", "cmd.exe"
        ]
    
    async def dispatch(self, request: Request, call_next):
        # Check request size
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_request_size:
            security_logger.warning(
                f"Large request blocked: {content_length} bytes from {request.client.host}",
                extra={"client_ip": request.client.host, "size": content_length}
            )
            return JSONResponse(
                status_code=413,
                content={"error": "Request too large"}
            )
        
        # Check for suspicious patterns in URL
        url_str = str(request.url).lower()
        for pattern in self.suspicious_patterns:
            if pattern in url_str:
                security_logger.warning(
                    f"Suspicious request blocked: {pattern} in URL",
                    extra={
                        "client_ip": request.client.host,
                        "pattern": pattern,
                        "url": str(request.url)
                    }
                )
                return JSONResponse(
                    status_code=400,
                    content={"error": "Invalid request"}
                )
        
        # Add security headers to response
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        
        return response
