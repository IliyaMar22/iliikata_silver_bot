# 🪙 Iliicheto Silver Fetch

Real-time precious metals workstation that mirrors the UX of the BTC Fetch dashboard while focusing entirely on silver. The backend aggregates live quotes from **SilverPrice.org**, **APMEX**, **Bullion.com**, and `yfinance`, computes technical levels reminiscent of TradingView, and streams actionable trade plans to the React frontend. A dedicated Claude panel creates a natural-language market brief every refresh cycle so you always have a readable summary next to the raw data.

## ✨ Feature Highlights

- **Multi-source spot aggregation** – scrape the requested dealer sites, merge them with `XAGUSD=X`/`SI=F` data, and expose spreads + confidence.
- **TradingView-style analytics** – EMA/SMA stack, RSI, MACD, stochastic, ATR, Bollinger Bands, and automatic support/resistance detection with entry/exit levels.
- **Claude-powered overview** – huge hero card on the dashboard renders the latest narrative from Anthropic’s API (configurable model + temperature).
- **WebSocket updates** – backend refresh loop pushes fresh silver state + Claude summary every minute without reloading the page.
- **Railway-ready** – `build.sh`, `start.sh`, `nixpacks.toml`, and `railway.json` mirror the BTC project for one-click deployment.

## 🏗️ Project Structure

```
iliicheto-silver-fetch/
├── silver_trading_api.py          # FastAPI app + websocket loop
├── silver_data_sources.py         # Scrapers + Yahoo Finance utilities
├── silver_position_engine.py      # Indicator + trade-plan engine
├── technical_levels.py            # S/R helpers and swing labeling
├── claude_summary.py              # Async Claude wrapper
├── config.py                      # App/config models and defaults
├── requirements.txt               # Python dependencies
├── build.sh / start.sh            # Railway scripts
├── nixpacks.toml / railway.json   # Railway configuration
└── silver-trading-frontend/       # React UI cloned from BTC Fetch
```

## ⚙️ Configuration

Environment variables (create `.env` locally or configure on Railway):

| Name | Description | Default |
|------|-------------|---------|
| `CLAUDE_API_KEY` | Anthropic API key for summaries. Required for production summaries. | _none_ |
| `CLAUDE_MODEL` | Claude model id. | `claude-3-5-sonnet-20240620` |
| `REFRESH_SECONDS` | Background refresh cadence. | `60` |
| `FRONTEND_URL` | Allowed origin for CORS in production. | `http://localhost:4173` |

## 🚀 Local Development

```bash
# Backend
cd iliicheto-silver-fetch
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn silver_trading_api:app --reload --port 8123

# Frontend
cd silver-trading-frontend
npm install
PORT=3124 npm start
```

Frontend loads data from `http://localhost:8123` and the websocket from `ws://localhost:8123/ws`.

## 🧠 Claude Summary Box

`silver_trading_api.py` injects the latest market snapshot into `claude_summary.ClaudeSummaryService`. If the API key is missing or Anthropic errors, the backend gracefully returns a placeholder message and the UI displays the issue inside the hero card.

## 📦 Railway Deployment

1. Push this folder to GitHub.
2. Create a new Railway project from the repo.
3. Set `CLAUDE_API_KEY` (and optional overrides) under project variables.
4. Railway runs `build.sh` → installs Python deps + builds `silver-trading-frontend`.
5. `start.sh` launches FastAPI with the built React assets served statically.

## 🛡️ Disclaimer

The signals and summaries are educational examples, not financial advice. Always double-check levels with your own tooling before trading physical silver or derivatives.

# Trigger redeploy Tue Nov 25 18:23:06 EET 2025
