"""
Iliicheto Silver Fetch backend - FIXED
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from claude_summary import ClaudeSummaryService
from config import FRONTEND_BUILD_DIR, get_settings
from silver_data_sources import SilverMarketDataService
from silver_position_engine import SilverPositionEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("silver-fetch")

settings = get_settings()

app = FastAPI(
    title="Iliicheto Silver Fetch",
    version="0.1.0",
    default_response_class=JSONResponse,
)

# CORS
allowed_origins = ["*"]
if settings.environment == "production" and settings.frontend_url:
    allowed_origins = [settings.frontend_url]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
market_service = SilverMarketDataService()
engine = SilverPositionEngine(market_service)
claude = ClaudeSummaryService(settings.claude)


class MarketState:
    def __init__(self) -> None:
        self.positions: List[Dict[str, Any]] = []
        self.spot_prices: Dict[str, Any] = {}
        self.summary: Dict[str, Any] | None = None
        self.last_update: Optional[str] = None


state = MarketState()


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("Client connected (%s total)", len(self.active_connections))

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info("Client disconnected (%s total)", len(self.active_connections))

    async def broadcast(self, payload: Dict[str, Any]) -> None:
        dead: List[WebSocket] = []
        for connection in self.active_connections:
            try:
                await connection.send_json(payload)
            except Exception as exc:  # noqa: BLE001
                logger.error("WebSocket broadcast failure: %s", exc)
                dead.append(connection)
        for connection in dead:
            self.disconnect(connection)


manager = ConnectionManager()


async def refresh_state() -> None:
    logger.info("Refreshing silver market state...")
    positions_task = asyncio.create_task(engine.analyze_all())
    spot_task = asyncio.create_task(market_service.fetch_spot_prices())
    intraday_task = asyncio.create_task(market_service.get_intraday_snapshot())

    positions = await positions_task
    spot_prices = await spot_task
    intraday = await intraday_task
    spot_prices["intraday"] = intraday

    state.positions = positions
    state.spot_prices = spot_prices
    state.last_update = datetime.now(timezone.utc).isoformat()

    snapshot = {
        "spot": spot_prices,
        "best_signal": _best_position(positions),
        "timeframes": {p["timeframe"]: {"score": p["score"], "action": p["action"]} for p in positions},
        "timestamp": state.last_update,
    }

    # Try to get Claude summary, but don't block if it fails or times out
    try:
        state.summary = await asyncio.wait_for(claude.summarize(snapshot), timeout=30.0)
    except asyncio.TimeoutError:
        logger.warning("Claude summary timed out, using fallback")
        state.summary = {
            "status": "ok",
            "headline": "Market Summary",
            "body": "Silver market data is being analyzed. Summary will be available shortly.",
        }
    except Exception as exc:
        logger.error("Claude summary failed: %s", exc)
        state.summary = {
            "status": "ok",
            "headline": "Market Summary",
            "body": "Silver market data is being analyzed. Summary will be available shortly.",
        }
    
    logger.info("State refresh complete (%s positions)", len(positions))


async def refresh_loop() -> None:
    await refresh_state()
    await manager.broadcast(
        {
            "type": "update",
            "timestamp": state.last_update,
            "positions": state.positions,
            "current_price": state.spot_prices.get("average"),
            "spot_prices": state.spot_prices,
            "summary": state.summary,
            "fear_greed": _derive_sentiment(),
        }
    )
    while True:
        try:
            await refresh_state()
            await manager.broadcast(
                {
                    "type": "update",
                    "timestamp": state.last_update,
                    "positions": state.positions,
                    "current_price": state.spot_prices.get("average"),
                    "spot_prices": state.spot_prices,
                    "summary": state.summary,
                    "fear_greed": _derive_sentiment(),
                }
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Background refresh failed: %s", exc)
        await asyncio.sleep(settings.refresh_seconds)


def _best_position(positions: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not positions:
        return None
    return max(positions, key=lambda p: p.get("score", 0))


def _convert_numpy_types(obj: Any) -> Any:
    """Convert numpy types to Python native types for JSON serialization"""
    import numpy as np
    
    if isinstance(obj, dict):
        return {key: _convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [_convert_numpy_types(item) for item in obj]
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    else:
        return obj


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("Starting refresh loop...")
    # Start the refresh loop in background (non-blocking)
    # This allows the server to respond to requests immediately
    asyncio.create_task(refresh_loop())


@app.get("/")
async def root() -> Any:
    index_path = FRONTEND_BUILD_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {
        "message": "Iliicheto Silver Fetch API",
        "endpoints": [
            "/api/positions",
            "/api/current-price",
            "/api/fear-greed",
            "/api/summary",
            "/ws",
        ],
    }


@app.get("/api/positions")
async def get_positions() -> Any:
    return {
        "success": True,
        "timestamp": state.last_update,
        "positions": _convert_numpy_types(state.positions),
        "count": len(state.positions),
    }


@app.get("/api/current-price")
async def get_current_price() -> Any:
    return {
        "success": True,
        "timestamp": state.last_update,
        "prices": _convert_numpy_types(state.spot_prices),
    }


@app.get("/api/fear-greed")
async def get_fear_greed() -> Any:
    try:
        sentiment = _derive_sentiment()
        # Convert numpy types to native Python types
        sentiment = _convert_numpy_types(sentiment)
        return {
            "success": True,
            "timestamp": state.last_update or datetime.now(timezone.utc).isoformat(),
            "data": sentiment,
        }
    except Exception as exc:
        logger.error("Error in fear-greed endpoint: %s", exc, exc_info=True)
        return {
            "success": True,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {"value": 50, "classification": "Neutral", "is_extreme_fear": False, "is_extreme_greed": False},
        }


def _derive_sentiment() -> Dict[str, Any]:
    if not state.positions:
        return {"value": 50, "classification": "Neutral", "is_extreme_fear": False, "is_extreme_greed": False}
    base = next((p for p in state.positions if p["timeframe"] == "1h"), state.positions[0])
    value = base.get("fear_greed_value", 50)
    classification = base.get("fear_greed_classification", "Neutral")
    
    # Ensure value is a native Python type
    if hasattr(value, 'item'):  # numpy scalar
        value = value.item()
    
    return {
        "value": int(value) if isinstance(value, (int, float)) else 50,
        "classification": str(classification),
        "is_extreme_fear": bool(value <= 25),
        "is_extreme_greed": bool(value >= 75),
    }


@app.get("/api/summary")
async def get_summary() -> Any:
    return {
        "success": True,
        "timestamp": state.last_update,
        "summary": _convert_numpy_types(state.summary),
    }


@app.get("/api/health")
async def health() -> Any:
    return {
        "status": "healthy",
        "timestamp": state.last_update,
        "connections": len(manager.active_connections),
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


if FRONTEND_BUILD_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_BUILD_DIR / "static")), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str) -> Any:
        if full_path.startswith("api"):
            return JSONResponse({"detail": "Not found"}, status_code=404)
        index_path = FRONTEND_BUILD_DIR / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        return JSONResponse({"detail": "Frontend not built"}, status_code=503)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8342"))
    host = os.getenv("HOST", "0.0.0.0")

    logger.info(f"🚀 Starting Iliicheto Silver Fetch server on {host}:{port}")
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        reload=True,
    )
