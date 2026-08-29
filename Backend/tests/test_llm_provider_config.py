"""
Tests proving LLM provider selection is isolated: choosing one provider
must never require, read, or initialize the other provider's credentials
or client. Each scenario runs in a fresh subprocess (module-level code in
llm_utils.py only runs once per Python process, so re-importing it in the
same process would not re-test the startup validation).
"""
import os
import subprocess
import sys
import tempfile

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _run_import(env_overrides: dict, target: str = "utils.llm_utils"):
    """Run `import <target>` in a fresh subprocess with a controlled env
    and return the completed process (never prints any env value itself).

    The subprocess's working directory is a fresh, empty temp directory
    (with PYTHONPATH pointed at Backend/ instead) rather than Backend/
    itself - `dotenv.load_dotenv()` in llm_utils.py would otherwise pick up
    real credentials from a local Backend/.env and silently defeat the
    "missing key" scenarios this test exercises.
    """
    env = os.environ.copy()
    # Start from a clean slate for the two provider credentials so a value
    # set in the outer test environment can't accidentally satisfy a
    # provider the scenario is supposed to be missing.
    env.pop("GOOGLE_API_KEY", None)
    env.pop("GROQ_API_KEY", None)
    env.pop("LLM_PROVIDER", None)
    env["PYTHONPATH"] = BACKEND_DIR
    env.update(env_overrides)
    with tempfile.TemporaryDirectory() as empty_cwd:
        return subprocess.run(
            [sys.executable, "-c", f"import {target}"],
            cwd=empty_cwd,
            env=env,
            capture_output=True,
            text=True,
            timeout=60,
        )


def test_gemini_only_config_starts_without_groq_key():
    """LLM_PROVIDER=gemini with only GOOGLE_API_KEY set must import cleanly -
    GROQ_API_KEY must never be required."""
    result = _run_import({"LLM_PROVIDER": "gemini", "GOOGLE_API_KEY": "test-gemini-key"})
    assert result.returncode == 0, result.stderr
    assert "GROQ_API_KEY" not in result.stderr


def test_groq_only_config_starts_without_google_key():
    """LLM_PROVIDER=groq with only GROQ_API_KEY set must import cleanly -
    GOOGLE_API_KEY must never be required."""
    result = _run_import({"LLM_PROVIDER": "groq", "GROQ_API_KEY": "test-groq-key"})
    assert result.returncode == 0, result.stderr
    assert "GOOGLE_API_KEY" not in result.stderr


def test_gemini_provider_missing_google_key_fails_clearly():
    """LLM_PROVIDER=gemini with no GOOGLE_API_KEY must fail with a clear,
    provider-specific error - and must not fail on GROQ_API_KEY instead."""
    result = _run_import({"LLM_PROVIDER": "gemini"})
    assert result.returncode != 0
    assert "GOOGLE_API_KEY" in result.stderr
    assert "GROQ_API_KEY" not in result.stderr


def test_groq_provider_missing_groq_key_fails_clearly():
    """LLM_PROVIDER=groq with no GROQ_API_KEY must fail with a clear,
    provider-specific error - and must not fail on GOOGLE_API_KEY instead."""
    result = _run_import({"LLM_PROVIDER": "groq"})
    assert result.returncode != 0
    assert "GROQ_API_KEY" in result.stderr
    assert "GOOGLE_API_KEY" not in result.stderr


def test_unsupported_provider_fails_clearly():
    """An unrecognized LLM_PROVIDER value must fail with a clear
    configuration error rather than defaulting silently or crashing with an
    unrelated traceback."""
    result = _run_import({"LLM_PROVIDER": "not-a-real-provider", "GOOGLE_API_KEY": "x", "GROQ_API_KEY": "x"})
    assert result.returncode != 0
    assert "Unsupported LLM_PROVIDER" in result.stderr
    assert "not-a-real-provider" in result.stderr


def test_default_provider_is_gemini_when_unset():
    """With LLM_PROVIDER unset entirely, the module must default to Gemini
    and therefore only require GOOGLE_API_KEY."""
    result = _run_import({"GOOGLE_API_KEY": "test-gemini-key"})
    assert result.returncode == 0, result.stderr


def test_app_starts_with_gemini_only_configuration():
    """The full FastAPI app must import/start with a Gemini-only
    configuration (no GROQ_API_KEY in the environment at all)."""
    result = _run_import(
        {
            "LLM_PROVIDER": "gemini",
            "GOOGLE_API_KEY": "test-gemini-key",
            "JWT_SECRET_KEY": "test-secret",
        },
        target="app",
    )
    assert result.returncode == 0, result.stderr


def test_app_starts_with_groq_only_configuration():
    """The full FastAPI app must import/start with a Groq-only
    configuration (no GOOGLE_API_KEY in the environment at all)."""
    result = _run_import(
        {
            "LLM_PROVIDER": "groq",
            "GROQ_API_KEY": "test-groq-key",
            "JWT_SECRET_KEY": "test-secret",
        },
        target="app",
    )
    assert result.returncode == 0, result.stderr
