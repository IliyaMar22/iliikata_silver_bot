from __future__ import annotations

import json
import logging
from typing import Any, Dict

from anthropic import AsyncAnthropic, APIError

from config import ClaudeSettings

logger = logging.getLogger(__name__)


class ClaudeSummaryService:
    def __init__(self, settings: ClaudeSettings) -> None:
        self.settings = settings
        self.client = AsyncAnthropic(api_key=settings.api_key) if settings.api_key else None

    async def summarize(self, market_snapshot: Dict[str, Any]) -> Dict[str, Any]:
        if not self.client:
            return {
                "status": "placeholder",
                "headline": "Claude summary unavailable",
                "body": (
                    "Set CLAUDE_API_KEY to unlock real-time AI commentary. "
                    "The rest of the dashboard continues to refresh normally."
                ),
            }

        content = self._build_prompt(market_snapshot)
        try:
            response = await self.client.messages.create(
                model=self.settings.model,
                max_tokens=self.settings.max_tokens,
                temperature=self.settings.temperature,
                system=(
                    "You are a meticulous commodities strategist. "
                    "Summaries must stay factual, reference price levels explicitly, "
                    "and highlight support/resistance confluence and actionable trade plans."
                ),
                messages=[
                    {
                        "role": "user",
                        "content": content,
                    }
                ],
            )
            text = response.content[0].text if response.content else "No response from Claude."
            # Extract first 2-3 sentences
            sentences = text.strip().split('. ')
            summary_text = '. '.join(sentences[:3])
            if len(sentences) > 3:
                summary_text += '.'
            
            return {
                "status": "ok",
                "headline": "Market Summary",
                "body": summary_text,
            }
        except APIError as exc:
            logger.error("Claude API error: %s", exc)
            return {
                "status": "error",
                "headline": "Claude error",
                "body": f"Claude could not generate a summary: {exc}",
            }

    @staticmethod
    def _build_prompt(snapshot: Dict[str, Any]) -> str:
        compact = json.dumps(snapshot, default=str)
        return (
            "Using the JSON snapshot below, write a brief 2-3 sentence summary about the silver market.\n"
            "First sentence: Current price and short-term trend.\n"
            "Second sentence: Key support/resistance levels and what they mean.\n"
            "Third sentence (optional): One actionable insight or risk to watch.\n"
            "Keep it concise and factual. No fluff.\n"
            f"Snapshot:\n{compact}"
        )

