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

echo "✅ Build finished"


