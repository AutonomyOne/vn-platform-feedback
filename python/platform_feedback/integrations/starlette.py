import traceback
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from platform_feedback.client import FeedbackClient
from platform_feedback.payload import build_payload


class _FeedbackMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, config):
        super().__init__(app)
        self.config = config
        self.client = FeedbackClient(config)

    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as exc:
            payload = build_payload(
                self.config,
                submission_type="programmatic",
                feedback_type="bug",
                severity="high",
                title=f"{type(exc).__name__}: {str(exc)[:120]}",
                description=str(exc),
                page=request.url.path,
                error_message=str(exc),
                stack_trace=traceback.format_exc(),
            )
            self.client.send_async(payload)
            return JSONResponse(status_code=500, content={"detail": "Internal server error"})


class StarletteIntegration:
    def __init__(self, app, config):
        self.app = app
        self.config = config

    def install(self):
        self.app.add_middleware(_FeedbackMiddleware, config=self.config)
        return self
