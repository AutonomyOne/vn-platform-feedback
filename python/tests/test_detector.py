import sys
from unittest.mock import patch

from platform_feedback.detector import detect_framework


class TestDetectFramework:
    def test_detects_fastapi(self):
        with patch.dict(sys.modules, {"fastapi": True}):
            assert detect_framework() == "fastapi"

    def test_detects_starlette(self):
        with patch.dict(sys.modules, {"starlette": True}):
            assert detect_framework() == "starlette"

    def test_fastapi_takes_priority_over_starlette(self):
        with patch.dict(sys.modules, {"fastapi": True, "starlette": True}):
            assert detect_framework() == "fastapi"

    def test_detects_flask(self):
        with patch.dict(sys.modules, {"flask": True}):
            assert detect_framework() == "flask"

    def test_detects_django(self):
        with patch.dict(sys.modules, {"django": True}):
            assert detect_framework() == "django"

    def test_detects_streamlit(self):
        with patch.dict(sys.modules, {"streamlit": True}):
            assert detect_framework() == "streamlit"

    def test_defaults_to_headless(self):
        # Ensure none of the frameworks are loaded
        mods = {
            k: v for k, v in sys.modules.items() if k not in ("fastapi", "starlette", "flask", "django", "streamlit")
        }
        with patch.dict(sys.modules, mods, clear=True):
            assert detect_framework() == "headless"
