import platform
from datetime import datetime

import pytest

from platform_feedback.config import FeedbackConfig
from platform_feedback.payload import build_payload


@pytest.fixture
def config():
    return FeedbackConfig(
        url="https://feedback.example.com",
        api_key="test-key",
        app_name="vetceedr",
        microservice="backend",
        environment="staging",
    )


class TestPayloadStructure:
    def test_contains_all_required_keys(self, config):
        payload = build_payload(config, title="Test", description="Desc")
        expected_keys = {
            "submission_type",
            "timestamp",
            "session_id",
            "app_name",
            "microservice",
            "environment",
            "type",
            "severity",
            "title",
            "description",
            "user_id",
            "user_email",
            "user_role",
            "page",
            "os",
            "sentry_event_id",
            "error_message",
            "stack_trace",
            "screenshot_url",
        }
        assert expected_keys.issubset(payload.keys())

    def test_app_context_from_config(self, config):
        payload = build_payload(config, title="Test", description="Desc")
        assert payload["app_name"] == "vetceedr"
        assert payload["microservice"] == "backend"
        assert payload["environment"] == "staging"

    def test_timestamp_is_iso_format(self, config):
        payload = build_payload(config, title="Test", description="Desc")
        # Should parse without error
        dt = datetime.fromisoformat(payload["timestamp"])
        assert dt.tzinfo is not None  # timezone-aware

    def test_os_is_detected(self, config):
        payload = build_payload(config, title="Test", description="Desc")
        assert payload["os"] == platform.system()


class TestDefaults:
    def test_default_submission_type(self, config):
        payload = build_payload(config, title="Test", description="Desc")
        assert payload["submission_type"] == "programmatic"

    def test_default_feedback_type(self, config):
        payload = build_payload(config, title="Test", description="Desc")
        assert payload["type"] == "bug"

    def test_default_severity(self, config):
        payload = build_payload(config, title="Test", description="Desc")
        assert payload["severity"] == "high"

    def test_default_user_id(self, config):
        payload = build_payload(config, title="Test", description="Desc")
        assert payload["user_id"] == "system"

    def test_generates_session_id(self, config):
        payload = build_payload(config, title="Test", description="Desc")
        assert payload["session_id"] is not None
        assert len(payload["session_id"]) > 0


class TestOverrides:
    def test_submission_type_override(self, config):
        payload = build_payload(config, title="T", description="D", submission_type="user")
        assert payload["submission_type"] == "user"

    def test_feedback_type_override(self, config):
        payload = build_payload(config, title="T", description="D", feedback_type="cosmetic")
        assert payload["type"] == "cosmetic"

    def test_severity_override(self, config):
        payload = build_payload(config, title="T", description="D", severity="critical")
        assert payload["severity"] == "critical"

    def test_user_context(self, config):
        payload = build_payload(
            config,
            title="T",
            description="D",
            user_id="u1",
            user_email="u@test.com",
            user_role="vet",
        )
        assert payload["user_id"] == "u1"
        assert payload["user_email"] == "u@test.com"
        assert payload["user_role"] == "vet"

    def test_session_id_override(self, config):
        payload = build_payload(config, title="T", description="D", session_id="my-session")
        assert payload["session_id"] == "my-session"

    def test_error_fields(self, config):
        payload = build_payload(
            config,
            title="T",
            description="D",
            error_message="boom",
            stack_trace="Traceback...",
            sentry_event_id="abc123",
        )
        assert payload["error_message"] == "boom"
        assert payload["stack_trace"] == "Traceback..."
        assert payload["sentry_event_id"] == "abc123"

    def test_screenshot_url(self, config):
        payload = build_payload(
            config,
            title="T",
            description="D",
            screenshot_url="https://cdn.example.com/shot.png",
        )
        assert payload["screenshot_url"] == "https://cdn.example.com/shot.png"


class TestExtraFields:
    def test_extra_merged_into_payload(self, config):
        payload = build_payload(
            config,
            title="T",
            description="D",
            extra={"method": "POST", "url": "/api/test"},
        )
        assert payload["method"] == "POST"
        assert payload["url"] == "/api/test"

    def test_none_extra_is_safe(self, config):
        payload = build_payload(config, title="T", description="D", extra=None)
        assert "title" in payload  # no crash
