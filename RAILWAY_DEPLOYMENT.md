# 🚂 Railway Deployment Guide

## ✅ Pre-Deployment Checklist

### Mobile Responsiveness
- ✅ Viewport meta tag configured
- ✅ Responsive breakpoints (sm, md, lg) added to all components
- ✅ Flexible layouts for mobile, tablet, and desktop
- ✅ Touch-friendly button sizes
- ✅ Optimized spacing for small screens

### Backend Configuration
- ✅ Non-blocking refresh loop (server responds immediately)
- ✅ Claude API timeout handling (30s timeout with fallback)
- ✅ Numpy serialization fixes
- ✅ Error handling for all endpoints
- ✅ CORS configured for production

### Railway Configuration
- ✅ `railway.json` configured with Nixpacks
- ✅ `build.sh` script ready
- ✅ `start.sh` script ready (uses Railway PORT env var)
- ✅ `nixpacks.toml` for Python/Node.js versions

## 📋 Environment Variables for Railway

Set these in Railway dashboard:

```
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-3-haiku-20240307
CLAUDE_MAX_TOKENS=200
CLAUDE_TEMPERATURE=0.2
ENVIRONMENT=production
PORT=8000  # Railway will set this automatically
```

## 🚀 Deployment Steps

1. **Push to GitHub** (if not already done):
   ```bash
   git push -u origin main
   ```

2. **Connect to Railway**:
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `iliya_markovski_silver_price_check`

3. **Configure Environment Variables**:
   - Go to Variables tab
   - Add all variables from above

4. **Deploy**:
   - Railway will automatically detect the project
   - It will run `build.sh` to build
   - Then run `start.sh` to start the server

## 📱 Mobile Responsiveness Features

### Breakpoints Used:
- `sm:` - 640px+ (small tablets)
- `md:` - 768px+ (tablets)
- `lg:` - 1024px+ (desktops)

### Components Optimized:
- **Header**: Stacks vertically on mobile, horizontal on desktop
- **Dashboard**: 1 column on mobile, 2 on tablet, 4 on desktop
- **ClaudeSummary**: Full width on mobile, side-by-side on desktop
- **Charts**: Responsive containers that adapt to screen size
- **Position Cards**: Full width on mobile, optimized spacing

## 🔧 Build Process

Railway will:
1. Install Python dependencies from `requirements.txt`
2. Install Node.js dependencies in `silver-trading-frontend/`
3. Build React app (`npm run build`)
4. Start FastAPI server with uvicorn
5. Serve frontend from `/static` directory

## 🌐 Production URLs

- Frontend and backend are served from the same domain
- API endpoints: `/api/*`
- WebSocket: `/ws`
- Static files: `/static/*`

## 📝 Notes

- The app uses relative URLs in production (same domain)
- WebSocket automatically uses `wss://` in production
- All API calls are same-origin (no CORS issues)
- Mobile users get optimized layouts automatically

## 🐛 Troubleshooting

If deployment fails:
1. Check Railway logs for build errors
2. Verify all environment variables are set
3. Ensure `build.sh` and `start.sh` are executable
4. Check that `PORT` environment variable is set by Railway

