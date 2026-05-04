# lambda/shared/logger.py
import logging
import json
import os
import traceback
from datetime import datetime, timezone
 
class StructuredLogger:
    """
    Centralized structured logger for all Ferrari Lambda services.
    Outputs JSON logs compatible with CloudWatch Logs Insights.
    """
 
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.environment = os.environ.get('ENVIRONMENT', 'dev')
        self.version = os.environ.get('SERVICE_VERSION', '1.0.0')
 
        # Configure Python root logger
        self._logger = logging.getLogger(service_name)
        self._logger.setLevel(logging.DEBUG)
 
        # Prevent duplicate handlers on Lambda warm starts
        if not self._logger.handlers:
            handler = logging.StreamHandler()
            handler.setFormatter(logging.Formatter('%(message)s'))
            self._logger.addHandler(handler)
 
    def _build_entry(self, level: str, message: str,
                     extra: dict = None, error: Exception = None) -> str:
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": level,
            "service": self.service_name,
            "environment": self.environment,
            "version": self.version,
            "message": message,
        }
        if extra:
            entry.update(extra)
        if error:
            entry["error"] = {
                "type": type(error).__name__,
                "message": str(error),
                "traceback": traceback.format_exc()
            }
        return json.dumps(entry, default=str)
 
    def info(self, message: str, **kwargs):
        self._logger.info(self._build_entry("INFO", message, kwargs))
 
    def warning(self, message: str, **kwargs):
        self._logger.warning(self._build_entry("WARNING", message, kwargs))
 
    def error(self, message: str, error: Exception = None, **kwargs):
        self._logger.error(self._build_entry("ERROR", message, kwargs, error))
 
    def debug(self, message: str, **kwargs):
        self._logger.debug(self._build_entry("DEBUG", message, kwargs))
 
    def critical(self, message: str, error: Exception = None, **kwargs):
        self._logger.critical(self._build_entry("CRITICAL", message, kwargs, error))
 
 
# Factory function — use this in every Lambda
def get_logger(service_name: str) -> StructuredLogger:
    return StructuredLogger(service_name)

