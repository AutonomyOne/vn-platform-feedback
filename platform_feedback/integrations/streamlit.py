import platform as _platform
import uuid

import streamlit as st

from platform_feedback.client import FeedbackClient
from platform_feedback.payload import build_payload

TYPE_OPTIONS = ["bug", "cosmetic", "suggestion"]
SEVERITY_OPTIONS = ["critical", "high", "low"]
TYPE_EMOJI = {"bug": "🐛 Bug", "cosmetic": "🎨 Cosmetic", "suggestion": "💡 Suggestion"}
SEV_EMOJI = {"critical": "🔴 Critical", "high": "🟠 High", "low": "🟡 Low"}


def _session_id() -> str:
    if "_pf_session" not in st.session_state:
        st.session_state["_pf_session"] = str(uuid.uuid4())
    return st.session_state["_pf_session"]


class StreamlitIntegration:
    def __init__(self, config):
        self.config = config
        self.client = FeedbackClient(config)

    def install(self):
        return self

    def render_sidebar(
        self,
        user_id: str = "anonymous",
        user_email: str = None,
        user_role: str = None,
        current_page: str = "unknown",
    ):
        """
        Call once in your Streamlit app to render the feedback button + form in sidebar.

        Example:
            integration = init_feedback()
            integration.render_sidebar(
                user_id=st.session_state.get("user_id"),
                current_page="Patient Records"
            )
        """
        with st.sidebar:
            st.divider()
            if st.button("🐛 Report Feedback"):
                st.session_state["_pf_open"] = not st.session_state.get("_pf_open", False)

            if st.session_state.get("_pf_open", False):
                self._render_form(user_id, user_email, user_role, current_page)

    def _render_form(self, user_id, user_email, user_role, current_page):
        st.markdown("### Submit Feedback")

        hp = st.text_input("", key="_pf_hp", label_visibility="collapsed")
        col1, col2 = st.columns(2)
        with col1:
            fb_type = st.selectbox("Type", TYPE_OPTIONS, format_func=lambda x: TYPE_EMOJI[x], key="_pf_type")
        with col2:
            severity = st.selectbox("Severity", SEVERITY_OPTIONS, format_func=lambda x: SEV_EMOJI[x], key="_pf_sev")

        title = st.text_input("Title", max_chars=120, key="_pf_title")
        description = st.text_area("Description", height=100, key="_pf_desc")
        screenshot = st.file_uploader("Screenshot (optional)", type=["png", "jpg"], key="_pf_ss")

        if st.button("Submit", type="primary", key="_pf_submit"):
            if hp:
                st.success("Received.")
                return
            if not title.strip() or not description.strip():
                st.warning("Title and description required.")
                return

            screenshot_url = None
            if screenshot:
                screenshot_url = self._upload_screenshot(screenshot)

            payload = build_payload(
                self.config,
                submission_type="user",
                feedback_type=fb_type,
                severity=severity,
                title=title.strip()[:120],
                description=description.strip()[:5000],
                page=current_page,
                user_id=user_id,
                user_email=user_email,
                user_role=user_role,
                session_id=_session_id(),
                screenshot_url=screenshot_url,
                extra={"os": _platform.system()},
            )
            self.client.send(payload)
            st.success("✅ Submitted. Thank you.")
            st.session_state["_pf_open"] = False

    def _upload_screenshot(self, file) -> str | None:
        import logging

        import requests

        _logger = logging.getLogger("platform_feedback")
        MAX_SIZE = 5 * 1024 * 1024  # 5 MB

        data = file.getvalue()
        if len(data) > MAX_SIZE:
            st.warning("Screenshot too large (max 5 MB). Skipping upload.")
            return None

        content_type = getattr(file, "type", None) or "image/png"
        if not content_type.startswith("image/"):
            st.warning("Only image files are allowed for screenshots.")
            return None

        try:
            res = requests.post(
                f"{self.config.url}/upload-url",
                json={"filename": file.name},
                headers={"X-Api-Key": self.config.api_key},
                timeout=10,
            )
            urls = res.json()
            requests.put(urls["upload_url"], data=data, headers={"Content-Type": content_type}, timeout=30)
            return urls["public_url"]
        except Exception as e:
            _logger.debug(f"platform-feedback: screenshot upload failed: {e}")
            st.warning("Screenshot upload failed. Feedback will be submitted without it.")
            return None

    def submit_error(self, exc: Exception, page: str = None):
        """Programmatic submission from a Streamlit exception handler."""
        import traceback

        payload = build_payload(
            self.config,
            submission_type="programmatic",
            feedback_type="bug",
            severity="high",
            title=f"{type(exc).__name__}: {str(exc)[:120]}",
            description=str(exc),
            page=page,
            error_message=str(exc),
            stack_trace=traceback.format_exc(),
        )
        self.client.send(payload)
