import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaCheckCircle, FaTimesCircle, FaExclamationCircle } from 'react-icons/fa';

interface Position {
  timeframe: string;
  timeframe_name: string;
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
  technical_indicators: any;
  support_levels: number[];
  resistance_levels: number[];
  reasons: string[];
  technical_details: string[];
}

interface PositionCardProps {
  position: Position;
}

const PositionCard: React.FC<PositionCardProps> = ({ position }) => {
  const [expanded, setExpanded] = useState(false);

  const getRecommendationBg = (rec: string) => {
    if (rec.includes('STRONG BUY')) return 'from-green-600 to-green-700';
    if (rec.includes('BUY')) return 'from-green-500 to-green-600';
    if (rec.includes('WEAK BUY')) return 'from-yellow-500 to-yellow-600';
    if (rec.includes('STRONG SELL')) return 'from-red-600 to-red-700';
    if (rec.includes('SELL')) return 'from-red-500 to-red-600';
    if (rec.includes('WEAK SELL')) return 'from-orange-500 to-orange-600';
    return 'from-gray-500 to-gray-600';
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 5) return 'text-green-300';
    if (score >= 2) return 'text-yellow-400';
    if (score <= -8) return 'text-red-400';
    if (score <= -5) return 'text-red-300';
    if (score <= -2) return 'text-orange-400';
    return 'text-gray-400';
  };

  return (
    <div className="bg-gray-800 bg-opacity-70 border border-gray-700 rounded-xl shadow-2xl overflow-hidden transform hover:scale-[1.01] transition-transform">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getRecommendationBg(position.recommendation)} p-6`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {position.timeframe_name} Timeframe
              <span className="ml-3 text-lg font-normal opacity-75">
                ({position.timeframe})
              </span>
            </h2>
            <p className="text-xl text-white opacity-90">
              {position.recommendation}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
              <div className="text-sm text-white opacity-75 mb-1">Score</div>
              <div className={`text-3xl font-bold ${getScoreColor(position.score)}`}>
                {position.score > 0 ? '+' : ''}{position.score}
              </div>
              <div className="text-xs text-white opacity-75">/ {position.max_score}</div>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
              <div className="text-sm text-white opacity-75 mb-1">Confidence</div>
              <div className="text-2xl font-bold text-white">
                {position.confidence}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Setup */}
      {position.action !== 'HOLD' && (
        <div className="bg-gray-900 bg-opacity-50 p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            🎯 Trade Setup
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Entry Price</div>
              <div className="text-2xl font-bold text-white">{formatPrice(position.entry)}</div>
            </div>
            
            <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Stop Loss</div>
              <div className="text-2xl font-bold text-red-300">{formatPrice(position.stop_loss)}</div>
              <div className="text-xs text-red-400 mt-1">{position.risk_pct.toFixed(2)}% risk</div>
            </div>
            
            <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Take Profit</div>
              <div className="text-2xl font-bold text-green-300">{formatPrice(position.take_profit_2)}</div>
              <div className="text-xs text-green-400 mt-1">{position.reward_pct.toFixed(2)}% gain</div>
            </div>
            
            <div className="bg-purple-900 bg-opacity-30 border border-purple-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">TP1 (33%)</div>
              <div className="text-lg font-bold text-white">{formatPrice(position.take_profit_1)}</div>
            </div>
            
            <div className="bg-purple-900 bg-opacity-30 border border-purple-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">TP2 (50%)</div>
              <div className="text-lg font-bold text-white">{formatPrice(position.take_profit_2)}</div>
            </div>
            
            <div className="bg-purple-900 bg-opacity-30 border border-purple-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">TP3 (100%)</div>
              <div className="text-lg font-bold text-white">{formatPrice(position.take_profit_3)}</div>
            </div>
          </div>
          
          <div className="mt-4 bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-lg p-4">
            <span className="text-yellow-300 font-semibold">Risk:Reward Ratio: </span>
            <span className="text-white text-xl font-bold">1:{position.risk_reward_ratio.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Technical Indicators */}
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          📊 Technical Indicators
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="bg-gray-900 bg-opacity-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">RSI</div>
            <div className="text-lg font-bold text-white">{position.technical_indicators.rsi.toFixed(2)}</div>
          </div>
          
          <div className="bg-gray-900 bg-opacity-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">MACD</div>
            <div className="text-lg font-bold text-white">{position.technical_indicators.macd.toFixed(2)}</div>
          </div>
          
          <div className="bg-gray-900 bg-opacity-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">ADX</div>
            <div className="text-lg font-bold text-white">{position.technical_indicators.adx.toFixed(2)}</div>
          </div>
          
          <div className="bg-gray-900 bg-opacity-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">EMA 12</div>
            <div className="text-lg font-bold text-white">{formatPrice(position.technical_indicators.ema_12)}</div>
          </div>
          
          <div className="bg-gray-900 bg-opacity-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">EMA 26</div>
            <div className="text-lg font-bold text-white">{formatPrice(position.technical_indicators.ema_26)}</div>
          </div>
          
          <div className="bg-gray-900 bg-opacity-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">SMA 50</div>
            <div className="text-lg font-bold text-white">{formatPrice(position.technical_indicators.sma_50)}</div>
          </div>
          
          <div className="bg-gray-900 bg-opacity-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Stochastic</div>
            <div className="text-lg font-bold text-white">{position.technical_indicators.stoch_k.toFixed(2)}</div>
          </div>
          
          <div className="bg-gray-900 bg-opacity-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Volume</div>
            <div className="text-lg font-bold text-white">{position.technical_indicators.volume_ratio.toFixed(2)}x</div>
          </div>
        </div>
      </div>

      {/* Support & Resistance */}
      {(position.support_levels.length > 0 || position.resistance_levels.length > 0) && (
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">🎯 Key Levels</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {position.support_levels.length > 0 && (
              <div>
                <div className="text-sm text-green-400 font-semibold mb-2">Support Levels</div>
                <div className="space-y-2">
                  {position.support_levels.slice(0, 3).map((level, idx) => (
                    <div key={idx} className="bg-green-900 bg-opacity-20 border border-green-700 rounded-lg p-2">
                      <span className="text-white font-bold">{formatPrice(level)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {position.resistance_levels.length > 0 && (
              <div>
                <div className="text-sm text-red-400 font-semibold mb-2">Resistance Levels</div>
                <div className="space-y-2">
                  {position.resistance_levels.slice(0, 3).map((level, idx) => (
                    <div key={idx} className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-2">
                      <span className="text-white font-bold">{formatPrice(level)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analysis & Reasoning */}
      <div className="p-6">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xl font-bold text-white mb-4 hover:text-blue-400 transition-colors"
        >
          <span className="flex items-center gap-2">
            💭 Analysis & Reasoning ({position.reasons.length} insights)
          </span>
          {expanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        
        {expanded && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-400 mb-3">Key Reasons</h4>
              <ul className="space-y-2">
                {position.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-300">
                    {reason.includes('✅') ? (
                      <FaCheckCircle className="text-green-400 mt-1 flex-shrink-0" />
                    ) : reason.includes('❌') ? (
                      <FaTimesCircle className="text-red-400 mt-1 flex-shrink-0" />
                    ) : (
                      <FaExclamationCircle className="text-yellow-400 mt-1 flex-shrink-0" />
                    )}
                    <span>{reason.replace(/✅|❌|⚠️/g, '').trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-purple-400 mb-3">Technical Details</h4>
              <ul className="space-y-2">
                {position.technical_details.map((detail, idx) => (
                  <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PositionCard;

