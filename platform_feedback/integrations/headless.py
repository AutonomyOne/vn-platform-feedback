import traceback

from platform_feedback.client import FeedbackClient
from platform_feedback.payload import build_payload


class HeadlessIntegration:
    """
    Fallback for non-web contexts: Celery workers, cron jobs, CLI scripts.
    No automatic exception capture — call submit_error() manually.
    """

    def __init__(self, config):
        self.config = config
        self.client = FeedbackClient(config)

    def install(self):
        return self

    def submit_error(self, exc: Exception, context: dict = None):
        payload = build_payload(
            self.config,
            submission_type="programmatic",
            feedback_type="bug",
            severity="high",
            title=f"{type(exc).__name__}: {str(exc)[:120]}",
            description=str(exc),
            error_message=str(exc),
            stack_trace=traceback.format_exc(),
            extra=context or {},
        )
        self.client.send(payload)

    def submit(self, **kwargs):
        payload = build_payload(self.config, **kwargs)
        self.client.send(payload)
