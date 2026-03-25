import traceback
import logging

from platform_feedback.client import FeedbackClient
from platform_feedback.payload import build_payload

logger = logging.getLogger("platform_feedback")


class DjangoFeedbackMiddleware:
    """
    Django middleware. Add to MIDDLEWARE in settings.py:

        MIDDLEWARE = [
            ...
            'platform_feedback.integrations.django.DjangoFeedbackMiddleware',
        ]
    """

    _client = None
    _config = None

    def __init__(self, get_response):
        self.get_response = get_response
        if DjangoFeedbackMiddleware._client is None:
            raise RuntimeError(
                "platform-feedback: init_feedback() must be called before "
                "DjangoFeedbackMiddleware is loaded. Call it in your "
                "Django AppConfig.ready() method."
            )

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        if self._client is None:
            return None
        payload = build_payload(
            self._config,
            submission_type="programmatic",
            feedback_type="bug",
            severity="high",
            title=f"{type(exception).__name__}: {str(exception)[:120]}",
            description=str(exception),
            page=request.path,
            error_message=str(exception),
            stack_trace=traceback.format_exc(),
            extra={
                "method": request.method,
                "url": request.build_absolute_uri(),
            },
        )
        self._client.send(payload)
        return None  # let Django handle the response


class DjangoIntegration:
    def __init__(self, config):
        self.config = config
        self.client = FeedbackClient(config)

    def install(self):
        # Wire client into middleware class
        DjangoFeedbackMiddleware._client = self.client
        DjangoFeedbackMiddleware._config = self.config
        return self
