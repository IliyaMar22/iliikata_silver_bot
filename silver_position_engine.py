from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from ta.momentum import RSIIndicator, StochasticOscillator
from ta.trend import EMAIndicator, SMAIndicator, MACD, ADXIndicator
from ta.volatility import BollingerBands, AverageTrueRange

from config import TIMEFRAME_CONFIG
from silver_data_sources import SilverMarketDataService
from technical_levels import LevelSet, build_trade_plan, classify_trend, detect_levels


@dataclass
class Position:
    timeframe: str
    timeframe_name: str
    timestamp: datetime
    payload: Dict[str, Any]


class SilverPositionEngine:
    def __init__(self, market_service: SilverMarketDataService) -> None:
        self.market_service = market_service

    async def analyze_all(self) -> List[Dict[str, Any]]:
        tasks = [
            self._analyze_timeframe(tf, cfg)
            for tf, cfg in TIMEFRAME_CONFIG.items()
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        payloads: List[Dict[str, Any]] = []
        for result in results:
            if isinstance(result, dict):
                payloads.append(result)
        return payloads

    async def _analyze_timeframe(self, timeframe: str, cfg: Dict[str, str]) -> Optional[Dict[str, Any]]:
        df = await self.market_service.get_historical_dataframe(
            interval=cfg["interval"],
            period=cfg["period"],
        )
        if df.empty or len(df) < 60:
            return None

        indicators = self._compute_indicators(df.copy())
        current_price = float(indicators["close"].iloc[-1])

        levels = detect_levels(indicators)
        trade = build_trade_plan(current_price, levels)
        score, recommendation, action, confidence, reasons = self._score(indicators, trade, timeframe)
        risk_pct, reward_pct = self._risk_reward_pct(current_price, trade)

        chart_data = self._chart_payload(indicators)

        payload = {
            "timeframe": timeframe,
            "timeframe_name": cfg["label"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "current_price": current_price,
            "recommendation": recommendation,
            "action": action,
            "confidence": confidence,
            "score": score,
            "max_score": 20,
            "entry": round(trade["entry"], 3) if trade["entry"] else None,
            "stop_loss": round(trade["stop_loss"], 3) if trade["stop_loss"] else None,
            "take_profit_1": round(trade["take_profit_1"], 3) if trade["take_profit_1"] else None,
            "take_profit_2": round(trade["take_profit_2"], 3) if trade["take_profit_2"] else None,
            "take_profit_3": round(levels.resistances[2], 3) if len(levels.resistances) > 2 else None,
            "risk_pct": risk_pct,
            "reward_pct": reward_pct,
            "risk_reward_ratio": trade["risk_reward_ratio"] or 0,
            "technical_indicators": self._indicator_snapshot(indicators),
            "support_levels": levels.supports,
            "resistance_levels": levels.resistances,
            "reasons": reasons,
            "technical_details": self._technical_details(indicators),
            "fear_greed_value": min(100, max(0, round(indicators["rsi"].iloc[-1], 2))),
            "fear_greed_classification": self._classify_sentiment(indicators["rsi"].iloc[-1]),
            "chart_data": chart_data,
        }
        return payload

    @staticmethod
    def _compute_indicators(df: pd.DataFrame) -> pd.DataFrame:
        close = df["close"]
        high = df["high"]
        low = df["low"]
        volume = df["volume"].replace(0, np.nan).fillna(method="ffill")

        df["ema_12"] = EMAIndicator(close=close, window=12).ema_indicator()
        df["ema_26"] = EMAIndicator(close=close, window=26).ema_indicator()
        df["sma_50"] = SMAIndicator(close=close, window=50).sma_indicator()
        df["sma_200"] = SMAIndicator(close=close, window=200).sma_indicator()

        macd = MACD(close=close, window_fast=12, window_slow=26, window_sign=9)
        df["macd"] = macd.macd()
        df["macd_signal"] = macd.macd_signal()

        rsi = RSIIndicator(close=close, window=14)
        df["rsi"] = rsi.rsi()

        stoch = StochasticOscillator(high=high, low=low, close=close, window=14, smooth_window=3)
        df["stoch_k"] = stoch.stoch()

        adx = ADXIndicator(high=high, low=low, close=close, window=14)
        df["adx"] = adx.adx()

        bb = BollingerBands(close=close, window=20, window_dev=2)
        df["bb_upper"] = bb.bollinger_hband()
        df["bb_lower"] = bb.bollinger_lband()
        df["bb_middle"] = bb.bollinger_mavg()

        atr = AverageTrueRange(high=high, low=low, close=close, window=14)
        df["atr"] = atr.average_true_range()

        df["volume_ratio"] = volume / volume.rolling(window=20).mean()
        df = df.dropna()
        return df

    def _score(
        self,
        df: pd.DataFrame,
        trade: Dict[str, Any],
        timeframe: str,
    ) -> tuple[int, str, str, str, List[str]]:
        rsi = df["rsi"].iloc[-1]
        macd = df["macd"].iloc[-1]
        macd_signal = df["macd_signal"].iloc[-1]
        adx = df["adx"].iloc[-1]
        ema_fast = df["ema_12"].iloc[-1]
        ema_slow = df["ema_26"].iloc[-1]
        sma_50 = df["sma_50"].iloc[-1]
        close = df["close"].iloc[-1]
        bb_upper = df["bb_upper"].iloc[-1]
        bb_lower = df["bb_lower"].iloc[-1]

        score = 0
        reasons: List[str] = []

        if ema_fast > ema_slow:
            score += 3
            reasons.append("✅ Fast EMA trending above slow EMA.")
        else:
            score -= 3
            reasons.append("❌ Fast EMA below slow EMA.")

        if close > sma_50:
            score += 2
            reasons.append("✅ Price trading above 50 SMA.")
        else:
            score -= 2
            reasons.append("❌ Price below 50 SMA.")

        if macd > macd_signal:
            score += 2
            reasons.append("✅ MACD line above signal line.")
        else:
            score -= 2
            reasons.append("❌ MACD line below signal line.")

        if 40 <= rsi <= 60:
            reasons.append("⚠️ RSI in neutral zone.")
        elif rsi > 60:
            score += 2
            reasons.append("✅ RSI momentum bullish.")
        else:
            score -= 2
            reasons.append("❌ RSI momentum bearish.")

        if adx > 25:
            score += 1
            reasons.append("✅ Trend strength (ADX) above 25.")

        if bb_lower < close < bb_upper:
            reasons.append("✅ Price inside Bollinger bands.")
        else:
            score -= 1
            reasons.append("⚠️ Price outside Bollinger bands.")

        if trade["risk_reward_ratio"] and trade["risk_reward_ratio"] >= 1.5:
            score += 2
            reasons.append("✅ Attractive risk-reward profile.")
        else:
            score -= 1
            reasons.append("⚠️ Risk-reward below ideal threshold.")

        recommendation, action, confidence = self._recommendation_from_score(score, timeframe)
        return score, recommendation, action, confidence, reasons

    @staticmethod
    def _recommendation_from_score(score: int, timeframe: str) -> tuple[str, str, str]:
        if score >= 8:
            return "🟢 STRONG BUY", "BUY", "High"
        if score >= 5:
            return "🟢 BUY", "BUY", "Medium"
        if score >= 2:
            return "🟡 WEAK BUY", "BUY", "Medium"
        if -2 <= score <= 1:
            return "⚪ HOLD / WAIT", "HOLD", "Balanced"
        if score <= -8:
            return "🔴 STRONG SELL", "SELL", "High"
        if score <= -5:
            return "🔴 SELL", "SELL", "Medium"
        return "🟠 WEAK SELL", "SELL", "Medium"

    @staticmethod
    def _risk_reward_pct(
        current_price: float,
        trade: Dict[str, Optional[float]],
    ) -> tuple[float, float]:
        risk_pct = 0.0
        reward_pct = 0.0
        if trade["stop_loss"]:
            risk_pct = ((current_price - trade["stop_loss"]) / current_price) * 100
        if trade["take_profit_2"]:
            reward_pct = ((trade["take_profit_2"] - current_price) / current_price) * 100
        return round(risk_pct, 2), round(reward_pct, 2)

    @staticmethod
    def _indicator_snapshot(df: pd.DataFrame) -> Dict[str, float]:
        latest = df.iloc[-1]
        return {
            "ema_12": float(latest["ema_12"]),
            "ema_26": float(latest["ema_26"]),
            "sma_50": float(latest["sma_50"]),
            "sma_200": float(latest.get("sma_200")),
            "rsi": float(latest["rsi"]),
            "macd": float(latest["macd"]),
            "macd_signal": float(latest["macd_signal"]),
            "stoch_k": float(latest["stoch_k"]),
            "bb_upper": float(latest["bb_upper"]),
            "bb_middle": float(latest["bb_middle"]),
            "bb_lower": float(latest["bb_lower"]),
            "atr": float(latest["atr"]),
            "trend": 1 if classify_trend(df) == "bullish" else -1,
            "adx": float(latest["adx"]),
            "volume_ratio": float(latest["volume_ratio"]),
        }

    @staticmethod
    def _technical_details(df: pd.DataFrame) -> List[str]:
        latest = df.iloc[-1]
        prev = df.iloc[-2]
        return [
            f"EMA12/EMA26 spread: {latest['ema_12'] - latest['ema_26']:.3f}",
            f"RSI last two candles: {prev['rsi']:.1f} → {latest['rsi']:.1f}",
            f"MACD histogram: {(latest['macd'] - latest['macd_signal']):.3f}",
            f"ATR (volatility): {latest['atr']:.3f}",
            f"Volume ratio vs 20 SMA: {latest['volume_ratio']:.2f}x",
        ]

    @staticmethod
    def _chart_payload(df: pd.DataFrame, limit: int = 150) -> Dict[str, List[Any]]:
        tail = df.iloc[-limit:]
        timestamps = [idx.isoformat() for idx in tail.index]
        return {
            "timestamps": timestamps,
            "close": tail["close"].round(3).tolist(),
            "high": tail["high"].round(3).tolist(),
            "low": tail["low"].round(3).tolist(),
            "volume": tail["volume"].round(3).tolist(),
            "ema_12": tail["ema_12"].round(3).tolist(),
            "ema_26": tail["ema_26"].round(3).tolist(),
            "sma_50": tail["sma_50"].round(3).tolist(),
            "bb_upper": tail["bb_upper"].round(3).tolist(),
            "bb_lower": tail["bb_lower"].round(3).tolist(),
        }

    @staticmethod
    def _classify_sentiment(rsi: float) -> str:
        if rsi >= 70:
            return "Extreme Greed"
        if rsi >= 60:
            return "Greed"
        if rsi <= 30:
            return "Extreme Fear"
        if rsi <= 40:
            return "Fear"
        return "Neutral"


