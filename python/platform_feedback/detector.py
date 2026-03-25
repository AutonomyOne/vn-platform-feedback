import sys


def detect_framework() -> str:
    """
    Inspect sys.modules to determine which web framework is active.
    Order matters — FastAPI extends Starlette, so check FastAPI first.
    """
    modules = sys.modules

    if "fastapi" in modules:
        return "fastapi"

    if "starlette" in modules:
        return "starlette"

    if "flask" in modules:
        return "flask"

    if "django" in modules:
        return "django"

    if "streamlit" in modules:
        return "streamlit"

    return "headless"
