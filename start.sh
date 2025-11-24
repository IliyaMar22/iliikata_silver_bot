#!/bin/bash
set -e

APP="silver_trading_api:app"

if [ -d "/opt/venv" ]; then
  echo "🚀 Starting API with Railway Python"
  exec /opt/venv/bin/uvicorn "$APP" --host 0.0.0.0 --port "${PORT:-8000}"
else
  echo "🚀 Starting API with system Python"
  exec uvicorn "$APP" --host 0.0.0.0 --port "${PORT:-8000}"
fi


