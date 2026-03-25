import os
from dataclasses import dataclass


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
        return cls(
            url=os.environ["FEEDBACK_SERVICE_URL"].rstrip("/"),
            api_key=os.environ["FEEDBACK_API_KEY"],
            app_name=os.environ["FEEDBACK_APP_NAME"],
            microservice=os.environ["FEEDBACK_MICROSERVICE"],
            environment=os.getenv("FEEDBACK_ENV", "staging"),
            timeout=int(os.getenv("FEEDBACK_TIMEOUT", "5")),
        )
