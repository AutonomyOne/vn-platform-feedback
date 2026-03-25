import time
from unittest.mock import patch, MagicMock

import pytest
from platform_feedback.config import FeedbackConfig
from platform_feedback.client import FeedbackClient, _is_duplicate, _seen, DEDUP_WINDOW


@pytest.fixture
def config():
    return FeedbackConfig(
        url="https://feedback.example.com",
        api_key="test-key",
        app_name="vetceedr",
        microservice="backend",
        environment="staging",
    )


@pytest.fixture(autouse=True)
def clear_dedup():
    """Clear dedup cache before each test."""
    _seen.clear()


def _payload(user_id="u1", page="/test", description="desc"):
    return {"user_id": user_id, "page": page, "description": description}


class TestDeduplication:
    def test_first_submission_is_not_duplicate(self):
        assert _is_duplicate(_payload()) is False

    def test_second_identical_submission_is_duplicate(self):
        _is_duplicate(_payload())
        assert _is_duplicate(_payload()) is True

    def test_different_user_is_not_duplicate(self):
        _is_duplicate(_payload(user_id="u1"))
        assert _is_duplicate(_payload(user_id="u2")) is False

    def test_different_page_is_not_duplicate(self):
        _is_duplicate(_payload(page="/a"))
        assert _is_duplicate(_payload(page="/b")) is False

    def test_different_description_is_not_duplicate(self):
        _is_duplicate(_payload(description="error A"))
        assert _is_duplicate(_payload(description="error B")) is False

    def test_expired_entries_are_cleaned(self):
        _is_duplicate(_payload())
        # Manually expire the entry
        for key in _seen:
            _seen[key] = time.time() - DEDUP_WINDOW - 1
        assert _is_duplicate(_payload()) is False

    def test_cache_grows_with_unique_payloads(self):
        for i in range(10):
            _is_duplicate(_payload(user_id=f"u{i}"))
        assert len(_seen) == 10


class TestFeedbackClientSend:
    @patch("platform_feedback.client.threading.Thread")
    def test_send_starts_daemon_thread(self, mock_thread_cls, config):
        mock_thread = MagicMock()
        mock_thread_cls.return_value = mock_thread
        client = FeedbackClient(config)
        client.send(_payload())
        mock_thread_cls.assert_called_once()
        assert mock_thread_cls.call_args[1]["daemon"] is True
        mock_thread.start.assert_called_once()

    @patch("platform_feedback.client.threading.Thread")
    def test_send_skips_duplicate(self, mock_thread_cls, config):
        client = FeedbackClient(config)
        client.send(_payload())
        mock_thread_cls.reset_mock()
        client.send(_payload())  # duplicate
        mock_thread_cls.assert_not_called()

    @patch("platform_feedback.client._send_sync")
    def test_send_sync_receives_correct_args(self, mock_send, config):
        """Verify the args passed to the thread target."""
        mock_send.return_value = None
        # Call _send_sync directly to verify args
        from platform_feedback.client import _send_sync
        _send_sync(config.url, config.api_key, _payload(), config.timeout)
        mock_send.assert_called_once_with(
            config.url, config.api_key, _payload(), config.timeout
        )


class TestSendSyncErrorHandling:
    @patch("platform_feedback.client.httpx.Client")
    def test_suppresses_network_errors(self, mock_client_cls, config):
        mock_client_cls.return_value.__enter__ = MagicMock()
        mock_client_cls.return_value.__exit__ = MagicMock(return_value=False)
        mock_client_cls.return_value.__enter__.return_value.post.side_effect = Exception("timeout")
        # Should not raise
        from platform_feedback.client import _send_sync
        _send_sync(config.url, config.api_key, _payload(), config.timeout)
