"""Settings read from environment variables (and a local .env file)."""

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _int(name: str, default: int) -> int:
    value = os.getenv(name)
    return int(value) if value else default


def _list(name: str, default: str) -> list[str]:
    raw = os.getenv(name, default)
    return [item.strip().rstrip("/") for item in raw.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    groq_api_key: str = field(default_factory=lambda: os.getenv("GROQ_API_KEY", ""))
    # Groq retires models from time to time. Check console.groq.com/docs/models
    # and change GROQ_MODEL in .env if this one stops working.
    groq_model: str = field(default_factory=lambda: os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"))
    # Only sent to reasoning models (gpt-oss). "low" keeps answers fast.
    reasoning_effort: str = field(default_factory=lambda: os.getenv("GROQ_REASONING_EFFORT", "low"))

    allowed_origins: list[str] = field(
        default_factory=lambda: _list("ALLOWED_ORIGINS", "http://localhost:3000")
    )

    # Abuse protection
    rate_limit_per_hour: int = field(default_factory=lambda: _int("RATE_LIMIT_PER_HOUR", 30))
    max_message_chars: int = field(default_factory=lambda: _int("MAX_MESSAGE_CHARS", 500))
    max_history_messages: int = field(default_factory=lambda: _int("MAX_HISTORY_MESSAGES", 12))
    max_output_tokens: int = field(default_factory=lambda: _int("MAX_OUTPUT_TOKENS", 700))

    profile_path: Path = BASE_DIR / "data" / "profile.json"


settings = Settings()
