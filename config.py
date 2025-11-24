from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
import os

from dotenv import load_dotenv

load_dotenv()


SILVER_YFINANCE_SYMBOL = os.getenv("SILVER_YFINANCE_SYMBOL", "SI=F")
SILVER_SPOT_SYMBOL = os.getenv("SILVER_SPOT_SYMBOL", "XAGUSD=X")

FRONTEND_DIR = Path(__file__).parent / "silver-trading-frontend"
FRONTEND_BUILD_DIR = FRONTEND_DIR / "build"


TIMEFRAME_CONFIG = {
    "15m": {"interval": "15m", "period": "7d", "label": "Scalping"},
    "1h": {"interval": "1h", "period": "1mo", "label": "Intraday"},
    "4h": {"interval": "4h", "period": "3mo", "label": "Swing"},
    "1d": {"interval": "1d", "period": "6mo", "label": "Position"},
    "1w": {"interval": "1wk", "period": "2y", "label": "Macro"},
}


@dataclass
class ClaudeSettings:
    api_key: str | None = os.getenv("CLAUDE_API_KEY")
    # Anthropic Claude API model names require date suffix
    # Available models: claude-3-5-sonnet-20241022, claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307
    # Note: Your API key works with claude-3-haiku-20240307. Update if you have access to other models.
    model: str = os.getenv("CLAUDE_MODEL", "claude-3-haiku-20240307")
    temperature: float = float(os.getenv("CLAUDE_TEMPERATURE", "0.2"))
    max_tokens: int = int(os.getenv("CLAUDE_MAX_TOKENS", "200"))


@dataclass
class AppSettings:
    refresh_seconds: int = int(os.getenv("REFRESH_SECONDS", "60"))
    frontend_url: str | None = os.getenv("FRONTEND_URL")
    environment: str = os.getenv("ENVIRONMENT", "development")
    claude: ClaudeSettings = ClaudeSettings()


@lru_cache
def get_settings() -> AppSettings:
    return AppSettings()

