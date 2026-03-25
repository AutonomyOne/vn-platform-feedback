import asyncio
import hashlib
import logging
import threading
import time

import httpx

logger = logging.getLogger("platform_feedback")

# Session-scoped deduplication
_seen: dict[str, float] = {}
DEDUP_WINDOW = 300  # seconds


def _is_duplicate(payload: dict) -> bool:
    key = hashlib.sha256(
        f"{payload.get('user_id')}:{payload.get('page')}:{payload.get('description')}".encode()
    ).hexdigest()
    now = time.time()
    expired = [k for k, v in _seen.items() if now - v > DEDUP_WINDOW]
    for k in expired:
        del _seen[k]
    if key in _seen:
        return True
    _seen[key] = now
    return False


def _send_sync(url: str, api_key: str, payload: dict, timeout: int):
    """Synchronous send — runs in a background thread."""
    try:
        with httpx.Client(timeout=timeout) as client:
            client.post(
                f"{url}/feedback",
                json=payload,
                headers={"X-Api-Key": api_key, "Content-Type": "application/json"},
            )
    except Exception as e:
        logger.debug(f"platform-feedback: send failed (non-critical): {e}")


async def _send_async(url: str, api_key: str, payload: dict, timeout: int):
    """Async send — for use inside async frameworks."""
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            await client.post(
                f"{url}/feedback",
                json=payload,
                headers={"X-Api-Key": api_key, "Content-Type": "application/json"},
            )
    except Exception as e:
        logger.debug(f"platform-feedback: send failed (non-critical): {e}")


class FeedbackClient:
    """
    Thin client. Used by all integrations and available for manual submission.
    All sends are fire-and-forget — errors are suppressed silently.
    """

    def __init__(self, config):
        self.config = config

    def send(self, payload: dict):
        """Fire-and-forget in a background thread (sync contexts)."""
        if _is_duplicate(payload):
            return
        t = threading.Thread(
            target=_send_sync,
            args=(self.config.url, self.config.api_key, payload, self.config.timeout),
            daemon=True,
        )
        t.start()

    def send_async(self, payload: dict):
        """Schedule async send without awaiting (async contexts)."""
        if _is_duplicate(payload):
            return
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(_send_async(self.config.url, self.config.api_key, payload, self.config.timeout))
            else:
                self.send(payload)  # fallback to thread
        except RuntimeError:
            self.send(payload)
