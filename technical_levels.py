from __future__ import annotations

from dataclasses import dataclass
import numpy as np
import pandas as pd


@dataclass
class LevelSet:
    supports: list[float]
    resistances: list[float]


def detect_levels(df: pd.DataFrame, lookback: int = 35, limit: int = 4) -> LevelSet:
    highs = df["high"]
    lows = df["low"]
    supports: list[float] = []
    resistances: list[float] = []

    for i in range(lookback, len(df) - lookback):
        window_high = highs[i - lookback : i + lookback]
        window_low = lows[i - lookback : i + lookback]

        pivot_high = window_high.max()
        pivot_low = window_low.min()

        if highs[i] == pivot_high and _is_unique_level(pivot_high, resistances):
            resistances.append(float(pivot_high))

        if lows[i] == pivot_low and _is_unique_level(pivot_low, supports):
            supports.append(float(pivot_low))

        if len(supports) >= limit and len(resistances) >= limit:
            break

    supports = sorted(supports)[-limit:]
    resistances = sorted(resistances)[:limit]
    return LevelSet(supports=supports, resistances=resistances)


def _is_unique_level(value: float, levels: list[float], tolerance: float = 0.2) -> bool:
    return all(abs(level - value) > tolerance for level in levels)


def classify_trend(df: pd.DataFrame) -> str:
    close = df["close"]
    ema_fast = close.ewm(span=21).mean()
    ema_slow = close.ewm(span=55).mean()

    if ema_fast.iloc[-1] > ema_slow.iloc[-1] * 1.002:
        return "bullish"
    if ema_fast.iloc[-1] < ema_slow.iloc[-1] * 0.998:
        return "bearish"
    return "neutral"


def build_trade_plan(current_price: float, levels: LevelSet) -> dict[str, float | None]:
    entry = current_price

    stop_loss = None
    if levels.supports:
        stop_loss = levels.supports[0]

    take_profit_1 = None
    take_profit_2 = None
    if levels.resistances:
        take_profit_1 = levels.resistances[0]
    if len(levels.resistances) > 1:
        take_profit_2 = levels.resistances[1]

    rr = None
    if stop_loss and take_profit_1:
        risk = current_price - stop_loss
        reward = take_profit_1 - current_price
        if risk:
            rr = reward / risk

    return {
        "entry": entry,
        "stop_loss": stop_loss,
        "take_profit_1": take_profit_1,
        "take_profit_2": take_profit_2,
        "risk_reward_ratio": rr,
    }


