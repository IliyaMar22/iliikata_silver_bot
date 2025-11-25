import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import FearGreedWidget from './components/FearGreedWidget';
import PositionCard from './components/PositionCard';
import PriceChart from './components/PriceChart';
import LoadingSpinner from './components/LoadingSpinner';
import ClaudeSummary from './components/ClaudeSummary';
import { API_BASE_URL, WS_URL } from './config';

interface Position {
  timeframe: string;
  timeframe_name: string;
  timestamp: string;
  current_price: number;
  recommendation: string;
  action: string;
  confidence: string;
  score: number;
  max_score: number;
  entry: number | null;
  stop_loss: number | null;
  take_profit_1: number | null;
  take_profit_2: number | null;
  take_profit_3: number | null;
  risk_pct: number;
  reward_pct: number;
  risk_reward_ratio: number;
  technical_indicators: {
    ema_12: number;
    ema_26: number;
    sma_50: number;
    sma_200: number | null;
    rsi: number;
    macd: number;
    macd_signal: number;
    stoch_k: number;
    bb_upper: number;
    bb_middle: number;
    bb_lower: number;
    atr: number;
    trend: number;
    adx: number;
    volume_ratio: number;
  };
  support_levels: number[];
  resistance_levels: number[];
  reasons: string[];
  technical_details: string[];
  fear_greed_value: number;
  fear_greed_classification: string;
  chart_data: {
    timestamps: string[];
    close: number[];
    high: number[];
    low: number[];
    volume: number[];
    ema_12: number[];
    ema_26: number[];
    sma_50: number[];
    bb_upper: number[];
    bb_lower: number[];
  };
}

interface FearGreedData {
  value: number;
  classification: string;
  is_extreme_fear: boolean;
  is_extreme_greed: boolean;
}

interface ClaudeSummaryData {
  headline: string;
  body: string;
  status: string;
}

interface SpotPrices {
  average?: number;
  spread_pct?: number;
  sources?: { source: string; price: number; currency: string }[];
  intraday?: { current: number; change_pct: number; timestamp: string };
}

function App() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [summary, setSummary] = useState<ClaudeSummaryData | null>(null);
  const [spotPrices, setSpotPrices] = useState<SpotPrices | null>(null);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const resolvedBaseUrl =
        API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8342');
      // Test connection first
      const baseUrl = resolvedBaseUrl;
      console.log('🔍 Testing connection to:', baseUrl);
      try {
        const healthCheck = await axios.get(`${baseUrl}/api/health`, { timeout: 10000 });
        console.log('✅ Backend health check:', healthCheck.data);
      } catch (healthErr: any) {
        console.error('❌ Health check failed:', healthErr);
        throw new Error(`Cannot connect to backend at ${baseUrl}. Error: ${healthErr.message}`);
      }
      const [positionsResponse, fgResponse, summaryResponse, spotResponse] = await Promise.all([
        axios.get(`${baseUrl}/api/positions`, { timeout: 15000 }),
        axios.get(`${baseUrl}/api/fear-greed`, { timeout: 15000 }),
        axios.get(`${baseUrl}/api/summary`, { timeout: 15000 }),
        axios.get(`${baseUrl}/api/current-price`, { timeout: 15000 }),
      ]);

      if (positionsResponse.data.success) {
        const fetchedPositions = positionsResponse.data.positions;
        setPositions(fetchedPositions);
        if (fetchedPositions.length > 0) {
          setCurrentPrice(fetchedPositions[0].current_price);
        }
      }

      if (fgResponse.data.success) {
        setFearGreed(fgResponse.data.data);
      }

      if (summaryResponse.data.success) {
        setSummary(summaryResponse.data.summary);
      }

      if (spotResponse.data.success) {
        setSpotPrices(spotResponse.data.prices);
        if (spotResponse.data.prices?.average) {
          setCurrentPrice(spotResponse.data.prices.average);
        }
      }

      setLastUpdate(new Date());
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch data';
      console.error('API Base URL:', API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : ''));
      console.error('Full error:', err);
      setError(`Network Error: ${errorMsg}. Check if backend is running on ${API_BASE_URL}`);
      setLoading(false);
    }
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    fetchInitialData();

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'update') {
          console.log('Received WebSocket update');
          setPositions(data.positions);
          setCurrentPrice(data.current_price);
          if (data.summary) {
            setSummary(data.summary);
          }
          if (data.spot_prices) {
            setSpotPrices(data.spot_prices);
          }
          
          if (data.fear_greed) {
            setFearGreed({
              value: data.fear_greed.value,
              classification: data.fear_greed.classification,
              is_extreme_fear: data.fear_greed.value < 25,
              is_extreme_greed: data.fear_greed.value > 75,
            });
          }
          
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        fetchInitialData();
      }, 5000);
    };

    return () => {
      ws.close();
    };
  }, [fetchInitialData]);

  // Manual refresh
  const handleRefresh = () => {
    fetchInitialData();
  };

  if (loading && positions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && positions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-300 mb-4">Error</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Header
        currentPrice={currentPrice}
        wsConnected={wsConnected}
        lastUpdate={lastUpdate}
        onRefresh={handleRefresh}
      />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Fear & Greed Widget */}
        {fearGreed && (
          <div className="mb-6">
            <FearGreedWidget data={fearGreed} />
          </div>
        )}

        <ClaudeSummary summary={summary} spotPrices={spotPrices} />

        {/* Dashboard Summary */}
        <Dashboard positions={positions} />

        {/* Position Cards */}
        <div className="space-y-6 mt-6">
          {positions.map((position) => (
            <div key={position.timeframe} className="animate-fade-in">
              <PositionCard position={position} />
              
              {/* Price Chart for this timeframe */}
              <div className="mt-4">
                <PriceChart position={position} />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-400 text-sm pb-8">
          <p>⚠️ This is for educational purposes only. Not financial advice.</p>
          <p className="mt-2">© 2025 Iliicheto Silver Fetch | Real-time Analysis</p>
        </footer>
      </main>
    </div>
  );
}

export default App;

