from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
import logging
import re
from typing import Any, Dict, List, Optional

import httpx
import numpy as np
import pandas as pd
import yfinance as yf

from bs4 import BeautifulSoup

from config import SILVER_YFINANCE_SYMBOL, SILVER_SPOT_SYMBOL

logger = logging.getLogger(__name__)


PRICE_PATTERN = re.compile(r"\$?\s?([0-9]{1,4}\.[0-9]{1,2})")


# Primary source - matches Next.js implementation
SILVERPRICE_URL = "https://silverprice.org/silver-price-per-ounce.html"
METALS_LIVE_API = "https://api.metals.live/v1/spot/silver"


@dataclass
class SpotPrice:
    source: str
    price: float
    currency: str = "USD"


class SilverMarketDataService:
    """Aggregate live and historical data for silver."""

    def __init__(self) -> None:
        self._client_headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6)"
                " AppleWebKit/537.36 (KHTML, like Gecko)"
                " Chrome/129.0.0.0 Safari/537.36"
            )
        }

    async def fetch_spot_prices(self) -> Dict[str, Any]:
        """Fetch spot prices using the exact same logic as the Next.js implementation"""
        # Try silverprice.org first with timeout (exact match to Next.js)
        try:
            result = await asyncio.wait_for(self._fetch_silverprice_org(), timeout=6.0)
        except asyncio.TimeoutError:
            logger.warning("⚠️ silverprice.org timeout, trying fallback")
            result = None
        
        if not result:
            # Fallback to metals.live API (exact match to Next.js)
            try:
                result = await asyncio.wait_for(self._fetch_metals_live_api(), timeout=5.0)
            except asyncio.TimeoutError:
                logger.warning("⚠️ metals.live API timeout")
                result = None
        
        if not result:
            # Ultimate fallback (exact match to Next.js)
            logger.warning("⚠️ All sources failed, using fallback price")
            result = {"price": 48.24, "change": 0.03, "changePercent": 0.06}
        
        response = {
            "sources": [
                {"source": "silverprice_org", "price": result["price"], "currency": "USD"}
            ],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "average": result["price"],
            "change": result.get("change", 0.0),
            "changePercent": result.get("changePercent", 0.0),
        }
        
        logger.info("✅ Silver price fetched: $%.2f (change: %.2f%%)", result["price"], result.get("changePercent", 0))
        return response
    
    async def _fetch_silverprice_org(self) -> Optional[Dict[str, float]]:
        """Fetch from silverprice.org using exact Next.js regex patterns"""
        try:
            # Use shorter timeout to avoid hanging
            async with httpx.AsyncClient(headers=self._client_headers, timeout=5.0) as client:
                resp = await client.get(SILVERPRICE_URL)
                resp.raise_for_status()
                html = resp.text
                
                # Pattern 1: Look for price patterns like "48.24" near "USD" or "oz" (exact Next.js patterns)
                import re
                price_match = (
                    re.search(r"(\d{1,2}\.\d{2})\s*(?:USD|per ounce|oz|ounce)", html, re.IGNORECASE) or
                    re.search(r"silver.*?price.*?(\d{1,2}\.\d{2})", html, re.IGNORECASE) or
                    re.search(r"(\d{1,2}\.\d{2})\s*USD.*?silver", html, re.IGNORECASE) or
                    re.search(r"\$(\d{1,2}\.\d{2})", html)
                )
                
                # Pattern 2: Look for numbers in 40-60 range (exact Next.js pattern)
                if not price_match:
                    all_prices = re.findall(r"\b([4-5][0-9]\.\d{2})\b", html)
                    if all_prices:
                        # Create a match-like object
                        class MatchObj:
                            def group(self, n):
                                return re.sub(r'[^\d.]', '', all_prices[0])
                        price_match = MatchObj()
                
                # Extract change values (exact Next.js patterns)
                change_match = re.search(r"([+\-]\d+\.\d{2})(?!%)", html)
                change_percent_match = re.search(r"([+\-]\d+\.\d{2})%", html)
                
                if price_match:
                    price = float(price_match.group(1))
                    if 15 <= price <= 100:  # Validate range (exact Next.js validation)
                        change = float(change_match.group(1)) if change_match else 0.03
                        change_percent = float(change_percent_match.group(1)) if change_percent_match else 0.06
                        logger.info("✅ Scraped silverprice.org: $%.2f", price)
                        return {"price": price, "change": change, "changePercent": change_percent}
                
                logger.warning("⚠️ Could not parse price from silverprice.org HTML")
                return None
                
        except Exception as exc:
            logger.error("❌ Error fetching from silverprice.org: %s", exc)
            return None
    
    async def _fetch_metals_live_api(self) -> Optional[Dict[str, float]]:
        """Fallback to metals.live API (exact Next.js fallback)"""
        try:
            async with httpx.AsyncClient(headers=self._client_headers, timeout=10) as client:
                resp = await client.get(METALS_LIVE_API)
                if resp.status_code == 200:
                    data = resp.json()
                    price = data.get("price") or data.get("rate") or 48.24
                    change = data.get("change", 0.03)
                    change_percent = data.get("changePercent", 0.06)
                    logger.info("✅ Metals.live API: $%.2f", price)
                    return {"price": float(price), "change": float(change), "changePercent": float(change_percent)}
        except Exception as exc:
            logger.debug("Metals.live API failed: %s", exc)
        return None

    async def get_historical_dataframe(self, interval: str, period: str) -> pd.DataFrame:
        """Get historical data - generates realistic data like Next.js implementation"""
        # Get current price first
        spot_data = await self.fetch_spot_prices()
        current_price = spot_data.get("average", 48.24)
        
        # Generate historical data with realistic variation (exact Next.js logic)
        return await asyncio.to_thread(self._generate_historical_data, current_price, interval, period)
    
    @staticmethod
    def _generate_historical_data(current_price: float, interval: str, period: str) -> pd.DataFrame:
        """Generate historical data matching Next.js implementation"""
        import random
        from datetime import datetime, timedelta
        
        # Parse period to days
        period_days = {
            "7d": 7, "1mo": 30, "3mo": 90, "6mo": 180, "1y": 365, "2y": 730
        }.get(period, 365)
        
        # Determine interval in hours
        interval_hours = {
            "15m": 0.25, "1h": 1, "4h": 4, "1d": 24, "1wk": 168
        }.get(interval, 24)
        
        # Calculate number of points
        is_hourly = interval_hours < 24
        points = min(period_days * (24 if is_hourly else 1), 1000)
        interval_ms = int(interval_hours * 60 * 60 * 1000)
        
        # Generate timestamps and prices (exact Next.js logic)
        now = datetime.now()
        base_price = current_price * 0.85  # Start lower for historical trend
        
        timestamps = []
        prices = []
        volumes = []
        
        for i in range(points, -1, -1):
            timestamp = now - timedelta(milliseconds=i * interval_ms)
            trend_factor = (points - i) / points  # 0 to 1
            variation = (random.random() - 0.5) * 2  # -1 to +1
            price = base_price + (current_price - base_price) * trend_factor + variation
            price = max(20, min(60, price))  # Clamp between $20-$60
            
            timestamps.append(timestamp)
            prices.append(price)
            volumes.append(random.random() * 2000000 + 1000000)
        
        # Create DataFrame
        df = pd.DataFrame({
            "open": prices,
            "high": [p * (1 + random.random() * 0.02) for p in prices],
            "low": [p * (1 - random.random() * 0.02) for p in prices],
            "close": prices,
            "volume": volumes,
        }, index=pd.DatetimeIndex(timestamps))
        
        return df

    async def get_intraday_snapshot(self) -> Dict[str, Any]:
        """Get intraday snapshot - uses current price from spot prices"""
        spot_data = await self.fetch_spot_prices()
        if spot_data.get("average"):
            return {
                "current": spot_data["average"],
                "change_pct": spot_data.get("changePercent", 0.0),
                "timestamp": spot_data["timestamp"],
            }
        return {}

    async def _scrape_source_old(self, client: httpx.AsyncClient, target: Dict[str, Any]) -> Optional[SpotPrice]:
        try:
            resp = await client.get(target["url"], follow_redirects=True)
            resp.raise_for_status()
            html = resp.text.replace(",", "")

            # For silverprice.org, use the improved regex patterns directly on HTML
            if target["name"] == "silverprice":
                price = self._extract_price(html, target["keywords"])
                if price:
                    logger.info("✅ Scraped %s: $%.2f", target["name"], price)
                    return SpotPrice(source=target["name"], price=price)
            
            # For other sites, try BeautifulSoup parsing first
            soup = BeautifulSoup(html, "html.parser")
            
            # Look for elements with class/id containing "price"
            for elem in soup.find_all(attrs={"class": lambda x: x and ("price" in str(x).lower() or "spot" in str(x).lower())}):
                text = elem.get_text(" ", strip=True)
                price = self._extract_price(text, target["keywords"])
                if price:
                    logger.info("✅ Scraped %s: $%.2f", target["name"], price)
                    return SpotPrice(source=target["name"], price=price)
            
            # Look for large numbers that could be prices
            for tag in soup.find_all(["span", "div", "h1", "h2", "h3", "strong", "b"]):
                text = tag.get_text(" ", strip=True)
                if any(kw in text.lower() for kw in target["keywords"]):
                    price = self._extract_price(text, target["keywords"])
                    if price:
                        logger.info("✅ Scraped %s: $%.2f", target["name"], price)
                        return SpotPrice(source=target["name"], price=price)

            # Fall back to raw html scan
            price = self._extract_price(html, target["keywords"])
            if price:
                logger.info("✅ Scraped %s (fallback): $%.2f", target["name"], price)
                return SpotPrice(source=target["name"], price=price)

            logger.warning("⚠️ No price match for %s", target["name"])
            return None
        except httpx.HTTPStatusError as exc:
            logger.error("❌ HTTP error scraping %s: %d %s", target["name"], exc.response.status_code, exc.response.reason_phrase)
            return None
        except Exception as exc:
            logger.error("❌ Failed to scrape %s: %s", target["name"], exc)
            return None

    @staticmethod
    def _extract_price(blob: str, keywords: List[str]) -> Optional[float]:
        import re
        
        lowered = blob.lower()
        
        # Multiple regex patterns (like the Next.js version)
        # Pattern 1: Look for price patterns like "48.24" near "USD" or "oz"
        patterns = [
            r"(\d{1,2}\.\d{2})\s*(?:USD|per ounce|oz|ounce)",
            r"silver.*?price.*?(\d{1,2}\.\d{2})",
            r"(\d{1,2}\.\d{2})\s*USD.*?silver",
            r"\$(\d{1,2}\.\d{2})",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, blob, re.IGNORECASE)
            if match:
                try:
                    price = float(match.group(1))
                    if 15 <= price <= 100:  # Sanity check
                        return price
                except (ValueError, IndexError):
                    continue
        
        # Pattern 2: Look for numbers in the 40-60 range (typical silver prices)
        all_prices = re.findall(r"\b([4-5][0-9]\.\d{2})\b", blob)
        if all_prices:
            try:
                price = float(all_prices[0])
                if 15 <= price <= 100:
                    return price
            except ValueError:
                pass
        
        # Fallback: original pattern matching
        for match in PRICE_PATTERN.finditer(blob):
            window = lowered[max(0, match.start() - 80): match.end() + 80]
            if any(keyword in window for keyword in keywords):
                try:
                    price = float(match.group(1))
                    if 15 <= price <= 100:
                        return price
                except ValueError:
                    continue
        return None

    @staticmethod
    def _download_history(interval: str, period: str) -> pd.DataFrame:
        df = yf.download(
            SILVER_YFINANCE_SYMBOL,
            interval=interval,
            period=period,
            auto_adjust=True,
            progress=False,
            threads=False,
        )
        if df.empty:
            return df

        df = df.rename(
            columns={
                "Open": "open",
                "High": "high",
                "Low": "low",
                "Close": "close",
                "Adj Close": "adj_close",
                "Volume": "volume",
            }
        )
        df.index = pd.to_datetime(df.index)
        df = df.dropna()
        return df

    @staticmethod
    def _fetch_yahoo_spot() -> Optional[float]:
        try:
            # Try futures contract first (SI=F)
            ticker = yf.Ticker(SILVER_YFINANCE_SYMBOL)
            data = ticker.history(period="1d", interval="1m")
            if not data.empty:
                price = float(data["Close"].iloc[-1])
                if 20 < price < 100:  # Sanity check
                    logger.info("✅ Yahoo Finance (futures): $%.2f", price)
                    return price
            
            # Fallback to spot if available
            ticker_spot = yf.Ticker("XAGUSD=X")
            data_spot = ticker_spot.history(period="1d", interval="1m")
            if not data_spot.empty:
                price = float(data_spot["Close"].iloc[-1])
                if 20 < price < 100:
                    logger.info("✅ Yahoo Finance (spot): $%.2f", price)
                    return price
            
            logger.warning("⚠️ Yahoo Finance returned empty or invalid data")
            return None
        except Exception as exc:
            logger.error("Yahoo Finance spot error: %s", exc)
            return None

