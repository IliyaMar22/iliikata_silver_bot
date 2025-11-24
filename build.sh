#!/bin/bash
set -euo pipefail

echo "🚂 Railway build for Iliicheto Silver Fetch"
echo "==========================================="

export PATH="/nix/var/nix/profiles/default/bin:$PATH"
if [ -d "$HOME/.nix-profile/bin" ]; then
  export PATH="$HOME/.nix-profile/bin:$PATH"
fi

if [ -d "/opt/venv" ]; then
  echo "Using Railway Python venv"
  /opt/venv/bin/pip install --upgrade pip
  /opt/venv/bin/pip install -r requirements.txt
else
  python3 -m pip install --upgrade pip
  python3 -m pip install -r requirements.txt
fi

echo ""
echo "📦 Installing frontend dependencies"
cd silver-trading-frontend
npm install
echo "🏗️ Building React app"
npm run build
cd ..

echo ""
echo "🔍 Verifying frontend build"
if [ -d "silver-trading-frontend/build" ]; then
    echo "✅ Frontend build directory exists"
    if [ -f "silver-trading-frontend/build/index.html" ]; then
        echo "✅ Frontend index.html exists"
    else
        echo "❌ Frontend index.html NOT found!"
    fi
    if [ -d "silver-trading-frontend/build/static" ]; then
        echo "✅ Frontend static directory exists"
    else
        echo "❌ Frontend static directory NOT found!"
    fi
else
    echo "❌ Frontend build directory NOT found!"
fi

echo "✅ Build finished"


