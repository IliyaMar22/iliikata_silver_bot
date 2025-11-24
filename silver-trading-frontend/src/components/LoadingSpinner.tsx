import React from 'react';
import { FaCoins } from 'react-icons/fa';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <FaCoins className="text-4xl text-slate-400 animate-pulse" />
        </div>
      </div>
      
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Loading Silver Analysis...</h2>
        <p className="text-gray-400">Fetching real-time data from multiple sources</p>
        
        <div className="mt-4 flex gap-2 justify-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;

