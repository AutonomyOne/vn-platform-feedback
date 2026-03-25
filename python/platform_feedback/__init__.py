"""
platform-feedback Python SDK
Single import, zero config beyond env vars.

Usage:
    from platform_feedback import init_feedback
    init_feedback(app)   # FastAPI, Flask, Starlette
    init_feedback()      # Django, Streamlit, Headless
"""

from platform_feedback.client import FeedbackClient
from platform_feedback.config import FeedbackConfig
from platform_feedback.detector import detect_framework

__version__ = "0.2.0"
__all__ = ["init_feedback", "FeedbackClient"]


def init_feedback(app=None):
    """
    Auto-detect framework and install feedback integration.
    Call once at application startup.
    """
    config = FeedbackConfig.from_env()
    framework = detect_framework()

    if framework == "fastapi":
        from platform_feedback.integrations.fastapi import FastAPIIntegration

        return FastAPIIntegration(app, config).install()

    elif framework == "starlette":
        from platform_feedback.integrations.starlette import StarletteIntegration

        return StarletteIntegration(app, config).install()

    elif framework == "django":
        from platform_feedback.integrations.django import DjangoIntegration

        return DjangoIntegration(config).install()

    elif framework == "flask":
        from platform_feedback.integrations.flask import FlaskIntegration

        return FlaskIntegration(app, config).install()

    elif framework == "streamlit":
        from platform_feedback.integrations.streamlit import StreamlitIntegration

        return StreamlitIntegration(config).install()

    else:
        from platform_feedback.integrations.headless import HeadlessIntegration

        return HeadlessIntegration(config).install()
