import os

import pytest

from platform_feedback.config import FeedbackConfig

VALID_ENV = {
    "FEEDBACK_SERVICE_URL": "https://feedback.example.com/",
    "FEEDBACK_API_KEY": "test-key-123",
    "FEEDBACK_APP_NAME": "vetceedr",
    "FEEDBACK_MICROSERVICE": "backend",
}


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    """Remove all FEEDBACK_* vars before each test."""
    for key in list(os.environ):
        if key.startswith("FEEDBACK_"):
            monkeypatch.delenv(key, raising=False)


def _set_env(monkeypatch, overrides=None):
    env = {**VALID_ENV, **(overrides or {})}
    for k, v in env.items():
        monkeypatch.setenv(k, v)


class TestFromEnv:
    def test_loads_all_vars(self, monkeypatch):
        _set_env(monkeypatch)
        cfg = FeedbackConfig.from_env()
        assert cfg.url == "https://feedback.example.com"
        assert cfg.api_key == "test-key-123"
        assert cfg.app_name == "vetceedr"
        assert cfg.microservice == "backend"

    def test_strips_trailing_slash(self, monkeypatch):
        _set_env(monkeypatch, {"FEEDBACK_SERVICE_URL": "https://feedback.example.com///"})
        cfg = FeedbackConfig.from_env()
        assert not cfg.url.endswith("/")

    def test_defaults_env_to_staging(self, monkeypatch):
        _set_env(monkeypatch)
        cfg = FeedbackConfig.from_env()
        assert cfg.environment == "staging"

    def test_reads_env_override(self, monkeypatch):
        _set_env(monkeypatch, {"FEEDBACK_ENV": "production"})
        cfg = FeedbackConfig.from_env()
        assert cfg.environment == "production"

    def test_defaults_timeout_to_5(self, monkeypatch):
        _set_env(monkeypatch)
        cfg = FeedbackConfig.from_env()
        assert cfg.timeout == 5

    def test_reads_timeout_override(self, monkeypatch):
        _set_env(monkeypatch, {"FEEDBACK_TIMEOUT": "10"})
        cfg = FeedbackConfig.from_env()
        assert cfg.timeout == 10


class TestMissingVars:
    @pytest.mark.parametrize(
        "missing_var",
        [
            "FEEDBACK_SERVICE_URL",
            "FEEDBACK_API_KEY",
            "FEEDBACK_APP_NAME",
            "FEEDBACK_MICROSERVICE",
        ],
    )
    def test_raises_on_missing_required_var(self, monkeypatch, missing_var):
        _set_env(monkeypatch)
        monkeypatch.delenv(missing_var)
        with pytest.raises(EnvironmentError, match=missing_var):
            FeedbackConfig.from_env()

    def test_raises_with_all_missing_vars_listed(self, monkeypatch):
        with pytest.raises(EnvironmentError, match="FEEDBACK_SERVICE_URL") as exc_info:
            FeedbackConfig.from_env()
        msg = str(exc_info.value)
        assert "FEEDBACK_API_KEY" in msg
        assert "FEEDBACK_APP_NAME" in msg
        assert "FEEDBACK_MICROSERVICE" in msg


class TestUrlValidation:
    def test_rejects_malformed_url(self, monkeypatch):
        _set_env(monkeypatch, {"FEEDBACK_SERVICE_URL": "not-a-url"})
        with pytest.raises(ValueError, match="not a valid URL"):
            FeedbackConfig.from_env()

    def test_rejects_url_without_scheme(self, monkeypatch):
        _set_env(monkeypatch, {"FEEDBACK_SERVICE_URL": "feedback.example.com"})
        with pytest.raises(ValueError, match="not a valid URL"):
            FeedbackConfig.from_env()

    def test_accepts_valid_https_url(self, monkeypatch):
        _set_env(monkeypatch, {"FEEDBACK_SERVICE_URL": "https://feedback.example.com"})
        cfg = FeedbackConfig.from_env()
        assert cfg.url == "https://feedback.example.com"

    def test_accepts_valid_http_url(self, monkeypatch):
        _set_env(monkeypatch, {"FEEDBACK_SERVICE_URL": "http://localhost:8000"})
        cfg = FeedbackConfig.from_env()
        assert cfg.url == "http://localhost:8000"
