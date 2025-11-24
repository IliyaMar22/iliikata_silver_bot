import React from 'react';
import { FaCoins, FaSync, FaCircle } from 'react-icons/fa';

interface HeaderProps {
  currentPrice: number;
  wsConnected: boolean;
  lastUpdate: Date;
  onRefresh: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPrice, wsConnected, lastUpdate, onRefresh }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <header className="bg-gray-900 bg-opacity-90 border-b border-gray-700 sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-slate-500 to-gray-400 p-3 rounded-lg">
              <FaCoins className="text-3xl text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Iliicheto Silver Fetch
              </h1>
              <p className="text-sm text-gray-400">Claude-Assisted Silver Desk</p>
            </div>
          </div>

          {/* Price & Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {/* Current Price */}
            <div className="bg-blue-900 bg-opacity-50 px-4 sm:px-6 py-2 sm:py-3 rounded-lg border border-blue-600 w-full sm:w-auto">
              <div className="text-xs text-gray-400 mb-1">Current Price</div>
              <div className="text-xl sm:text-2xl font-bold text-white">{formatPrice(currentPrice)}</div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              {/* WebSocket Status */}
              <div className="flex items-center gap-2">
                <FaCircle
                  className={`text-xs ${wsConnected ? 'text-green-500' : 'text-red-500'} animate-pulse`}
                />
                <span className="text-sm text-gray-300">
                  {wsConnected ? 'Live' : 'Reconnecting...'}
                </span>
              </div>

              {/* Last Update */}
              <div className="text-sm text-gray-400">
                Updated: {formatTime(lastUpdate)}
              </div>

              {/* Refresh Button */}
              <button
                onClick={onRefresh}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                title="Refresh data"
              >
                <FaSync className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

