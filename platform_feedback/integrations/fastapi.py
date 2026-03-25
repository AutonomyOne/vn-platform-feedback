import traceback

from fastapi import Request
from fastapi.responses import JSONResponse

from platform_feedback.client import FeedbackClient
from platform_feedback.payload import build_payload


class FastAPIIntegration:
    def __init__(self, app, config):
        self.app = app
        self.config = config
        self.client = FeedbackClient(config)

    def install(self):
        self._add_exception_handler()
        return self

    def _add_exception_handler(self):
        @self.app.exception_handler(Exception)
        async def _handler(request: Request, exc: Exception):
            payload = build_payload(
                self.config,
                submission_type="programmatic",
                feedback_type="bug",
                severity="high",
                title=f"{type(exc).__name__}: {str(exc)[:120]}",
                description=str(exc),
                page=str(request.url.path),
                error_message=str(exc),
                stack_trace=traceback.format_exc(),
                extra={
                    "method": request.method,
                    "url": str(request.url),
                },
            )
            self.client.send_async(payload)
            # Re-raise as 500 — do not swallow the error
            return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    def submit(self, **kwargs):
        """Manual submission from application code."""
        payload = build_payload(self.config, **kwargs)
        self.client.send_async(payload)
