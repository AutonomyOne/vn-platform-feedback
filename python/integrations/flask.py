import traceback
from flask import request as flask_request, jsonify

from platform_feedback.client import FeedbackClient
from platform_feedback.payload import build_payload


class FlaskIntegration:
    def __init__(self, app, config):
        self.app = app
        self.config = config
        self.client = FeedbackClient(config)

    def install(self):
        client = self.client
        config = self.config

        @self.app.errorhandler(Exception)
        def _handler(exc):
            payload = build_payload(
                config,
                submission_type="programmatic",
                feedback_type="bug",
                severity="high",
                title=f"{type(exc).__name__}: {str(exc)[:120]}",
                description=str(exc),
                page=flask_request.path,
                error_message=str(exc),
                stack_trace=traceback.format_exc(),
                extra={
                    "method": flask_request.method,
                    "url": flask_request.url,
                },
            )
            client.send(payload)
            return jsonify({"detail": "Internal server error"}), 500

        return self
