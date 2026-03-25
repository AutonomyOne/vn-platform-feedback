from unittest.mock import MagicMock

import pytest

from platform_feedback.client import FeedbackClient
from platform_feedback.config import FeedbackConfig
from platform_feedback.integrations.django import DjangoFeedbackMiddleware, DjangoIntegration


@pytest.fixture(autouse=True)
def reset_middleware():
    """Reset class-level state before each test."""
    DjangoFeedbackMiddleware._client = None
    DjangoFeedbackMiddleware._config = None
    yield
    DjangoFeedbackMiddleware._client = None
    DjangoFeedbackMiddleware._config = None


@pytest.fixture
def config():
    return FeedbackConfig(
        url="https://feedback.example.com",
        api_key="test-key",
        app_name="vetceedr",
        microservice="backend",
        environment="staging",
    )


class TestMiddlewareWithoutInit:
    def test_raises_if_init_not_called(self):
        with pytest.raises(RuntimeError, match="init_feedback\\(\\) must be called"):
            DjangoFeedbackMiddleware(get_response=lambda r: r)


class TestMiddlewareWithInit:
    def test_no_error_after_install(self, config):
        DjangoIntegration(config).install()
        middleware = DjangoFeedbackMiddleware(get_response=lambda r: r)
        assert middleware is not None

    def test_install_wires_client_and_config(self, config):
        DjangoIntegration(config).install()
        assert DjangoFeedbackMiddleware._client is not None
        assert DjangoFeedbackMiddleware._config is config

    def test_process_exception_sends_payload(self, config):
        integration = DjangoIntegration(config)
        integration.install()

        middleware = DjangoFeedbackMiddleware(get_response=lambda r: r)
        middleware._client = MagicMock(spec=FeedbackClient)

        request = MagicMock()
        request.path = "/api/test"
        request.method = "POST"
        request.build_absolute_uri.return_value = "https://app.example.com/api/test"

        exc = ValueError("something broke")
        result = middleware.process_exception(request, exc)

        assert result is None  # let Django handle it
        middleware._client.send.assert_called_once()
        payload = middleware._client.send.call_args[0][0]
        assert payload["title"].startswith("ValueError:")
        assert payload["page"] == "/api/test"
        assert payload["severity"] == "high"
