import React from 'react';
import { FaArrowUp, FaArrowDown, FaMinus, FaClock, FaChartLine } from 'react-icons/fa';

interface Position {
  timeframe: string;
  timeframe_name: string;
  action: string;
  score: number;
  confidence: string;
  recommendation: string;
}

interface DashboardProps {
  positions: Position[];
}

const Dashboard: React.FC<DashboardProps> = ({ positions }) => {
  if (positions.length === 0) {
    return (
      <div className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded-xl p-6 text-center text-gray-400 mb-6">
        Waiting for the first batch of silver signals…
      </div>
    );
  }
  // Calculate summary stats
  const buySignals = positions.filter(p => p.action === 'BUY').length;
  const sellSignals = positions.filter(p => p.action === 'SELL').length;
  const holdSignals = positions.filter(p => p.action === 'HOLD').length;
  
  const bestSignal = positions.reduce((best, current) => {
    return Math.abs(current.score) > Math.abs(best.score) ? current : best;
  }, positions[0]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY':
        return <FaArrowUp className="text-green-400" />;
      case 'SELL':
        return <FaArrowDown className="text-red-400" />;
      default:
        return <FaMinus className="text-yellow-400" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY':
        return 'from-green-900 to-green-800 border-green-600';
      case 'SELL':
        return 'from-red-900 to-red-800 border-red-600';
      default:
        return 'from-yellow-900 to-yellow-800 border-yellow-600';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      {/* Best Signal */}
      <div className={`bg-gradient-to-br ${getActionColor(bestSignal.action)} bg-opacity-50 border rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform`}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-gray-300 text-sm font-medium">🎯 Best Signal</div>
          {getActionIcon(bestSignal.action)}
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {bestSignal.timeframe_name}
        </div>
        <div className="text-lg text-gray-300">
          {bestSignal.action} • Score: {bestSignal.score}
        </div>
        <div className="mt-2 text-xs text-gray-400">
          Confidence: {bestSignal.confidence}
        </div>
      </div>

      {/* Buy Signals */}
      <div className="bg-gradient-to-br from-green-900 to-green-800 bg-opacity-30 border border-green-700 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="text-gray-300 text-sm font-medium">🟢 Buy Signals</div>
          <FaArrowUp className="text-2xl text-green-400" />
        </div>
        <div className="text-4xl font-bold text-white mb-1">
          {buySignals}
        </div>
        <div className="text-sm text-gray-300">
          out of {positions.length} timeframes
        </div>
      </div>

      {/* Sell Signals */}
      <div className="bg-gradient-to-br from-red-900 to-red-800 bg-opacity-30 border border-red-700 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="text-gray-300 text-sm font-medium">🔴 Sell Signals</div>
          <FaArrowDown className="text-2xl text-red-400" />
        </div>
        <div className="text-4xl font-bold text-white mb-1">
          {sellSignals}
        </div>
        <div className="text-sm text-gray-300">
          out of {positions.length} timeframes
        </div>
      </div>

      {/* Hold Signals */}
      <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 bg-opacity-30 border border-yellow-700 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="text-gray-300 text-sm font-medium">⚪ Hold Signals</div>
          <FaMinus className="text-2xl text-yellow-400" />
        </div>
        <div className="text-4xl font-bold text-white mb-1">
          {holdSignals}
        </div>
        <div className="text-sm text-gray-300">
          out of {positions.length} timeframes
        </div>
      </div>

      {/* Timeframes Grid */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <FaClock className="text-xl text-blue-400" />
          <h3 className="text-xl font-bold text-white">All Timeframes Overview</h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {positions.map((pos) => (
            <div
              key={pos.timeframe}
              className="bg-gray-900 bg-opacity-50 border border-gray-600 rounded-lg p-4 hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">
                  {pos.timeframe_name}
                </span>
                {getActionIcon(pos.action)}
              </div>
              <div className="text-lg font-bold text-white mb-1">
                {pos.action}
              </div>
              <div className="text-xs text-gray-400">
                Score: {pos.score > 0 ? '+' : ''}{pos.score}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

