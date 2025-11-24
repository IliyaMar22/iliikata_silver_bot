#!/bin/bash
set -e

APP="silver_trading_api:app"

# Railway sets PORT automatically - use it or default to 8000
PORT="${PORT:-8000}"
echo "🚀 Starting Iliicheto Silver Fetch on port $PORT"

if [ -d "/opt/venv" ]; then
  echo "Using Railway Python venv"
  exec /opt/venv/bin/uvicorn "$APP" --host 0.0.0.0 --port "$PORT" --workers 1
else
  echo "Using system Python"
  exec uvicorn "$APP" --host 0.0.0.0 --port "$PORT" --workers 1
fi


