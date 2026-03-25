import platform
import uuid
from datetime import datetime, timezone
from typing import Optional


def build_payload(
    config,
    *,
    submission_type: str = "programmatic",
    feedback_type: str = "bug",
    severity: str = "high",
    title: str,
    description: str,
    page: Optional[str] = None,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    user_role: Optional[str] = None,
    session_id: Optional[str] = None,
    sentry_event_id: Optional[str] = None,
    error_message: Optional[str] = None,
    stack_trace: Optional[str] = None,
    screenshot_url: Optional[str] = None,
    extra: Optional[dict] = None,
) -> dict:
    return {
        # Submission metadata
        "submission_type": submission_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_id": session_id or str(uuid.uuid4()),

        # App context
        "app_name": config.app_name,
        "microservice": config.microservice,
        "environment": config.environment,

        # Report
        "type": feedback_type,
        "severity": severity,
        "title": title,
        "description": description,

        # User context
        "user_id": user_id or "system",
        "user_email": user_email,
        "user_role": user_role,

        # Location
        "page": page,

        # Device
        "os": platform.system(),

        # Error linkage
        "sentry_event_id": sentry_event_id,
        "error_message": error_message,
        "stack_trace": stack_trace,

        # Attachments
        "screenshot_url": screenshot_url,

        # Extras (framework-specific context)
        **(extra or {}),
    }
