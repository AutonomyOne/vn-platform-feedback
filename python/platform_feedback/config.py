import os
from dataclasses import dataclass
from urllib.parse import urlparse


@dataclass
class FeedbackConfig:
    url: str
    api_key: str
    app_name: str
    microservice: str
    environment: str
    timeout: int = 5

    @classmethod
    def from_env(cls) -> "FeedbackConfig":
        missing = []
        for var in ("FEEDBACK_SERVICE_URL", "FEEDBACK_API_KEY",
                    "FEEDBACK_APP_NAME", "FEEDBACK_MICROSERVICE"):
            if not os.getenv(var):
                missing.append(var)
        if missing:
            raise EnvironmentError(
                f"platform-feedback: missing required env vars: {', '.join(missing)}"
            )
        raw_url = os.environ["FEEDBACK_SERVICE_URL"].rstrip("/")
        parsed = urlparse(raw_url)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError(
                f"platform-feedback: FEEDBACK_SERVICE_URL is not a valid URL: '{raw_url}'"
            )

        return cls(
            url=raw_url,
            api_key=os.environ["FEEDBACK_API_KEY"],
            app_name=os.environ["FEEDBACK_APP_NAME"],
            microservice=os.environ["FEEDBACK_MICROSERVICE"],
            environment=os.getenv("FEEDBACK_ENV", "staging"),
            timeout=int(os.getenv("FEEDBACK_TIMEOUT", "5")),
        )
