# 🚀 Bitcoin Trading System - Frontend

A modern, responsive, real-time Bitcoin trading analysis dashboard built with React, TypeScript, and TailwindCSS.

## ✨ Features

- 📊 **Real-Time Updates** - WebSocket connection for live data
- 📈 **Interactive Charts** - Beautiful price charts with indicators
- 🎯 **Multi-Timeframe Analysis** - 5 timeframes (15m, 1h, 4h, 1d, 1w)
- 😱 **Fear & Greed Index** - Market sentiment analysis
- 📱 **Fully Responsive** - Works on mobile, tablet, and desktop
- 🎨 **Modern UI** - Gradient backgrounds, smooth animations
- ⚡ **Fast Performance** - Optimized rendering and data handling

## 🛠️ Technologies

- **React 18** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS
- **Recharts** - Chart library
- **Axios** - HTTP client
- **WebSocket** - Real-time communication

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 🚀 Quick Start

1. Make sure the backend API is running on `http://localhost:8000`
2. Run `npm start`
3. Open `http://localhost:3000` in your browser

## 📱 Components

### Dashboard
- Summary cards showing buy/sell/hold signals
- Best signal indicator
- Timeframes overview grid

### PositionCard
- Detailed position analysis for each timeframe
- Trade setup (entry, stop loss, take profit)
- Technical indicators
- Support/resistance levels
- Expandable reasoning section

### PriceChart
- Interactive price chart with multiple indicators
- EMA, SMA, Bollinger Bands
- Entry/exit markers
- Responsive tooltips

### FearGreedWidget
- Current market sentiment (0-100)
- Visual gauge with color coding
- Buy/sell recommendations

### Header
- Current Bitcoin price
- WebSocket connection status
- Last update timestamp
- Manual refresh button

## ⚙️ Configuration

Edit `src/App.tsx` to change:

```typescript
// Backend API URL
const API_BASE_URL = 'http://localhost:8000';

// WebSocket URL
const WS_URL = 'ws://localhost:8000/ws';
```

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      'btc-orange': '#F7931A',
      // Add your custom colors
    },
  },
}
```

### Update Interval

The frontend automatically receives updates from the backend WebSocket every 60 seconds. To change this, modify the backend API.

## 📊 Data Flow

```
Backend API → WebSocket → React State → Components → UI Update
```

1. Initial data loaded via REST API
2. WebSocket connection established
3. Updates received every 60 seconds
4. State updated, components re-render
5. Smooth animations on changes

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

### WebSocket Not Connecting

- Ensure backend is running on port 8000
- Check CORS settings in backend
- Clear browser cache

### Charts Not Rendering

- Check browser console for errors
- Ensure data is being received
- Verify Recharts is installed: `npm install recharts`

## 📝 Available Scripts

- `npm start` - Run development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (not recommended)

## 🚀 Production Build

```bash
# Build optimized production bundle
npm run build

# Serve production build
npm install -g serve
serve -s build
```

## 📄 License

This project is for educational purposes only. Not financial advice.

## 🤝 Contributing

This is a personal project, but feel free to fork and customize!

---

**Made with ❤️ for Bitcoin traders**

