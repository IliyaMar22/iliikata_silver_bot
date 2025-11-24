import React from 'react';
import { FaSmile, FaFrown, FaMeh, FaGrin, FaSadTear } from 'react-icons/fa';

interface FearGreedData {
  value: number;
  classification: string;
  is_extreme_fear: boolean;
  is_extreme_greed: boolean;
}

interface FearGreedWidgetProps {
  data: FearGreedData;
}

const FearGreedWidget: React.FC<FearGreedWidgetProps> = ({ data }) => {
  const getColor = () => {
    if (data.value < 25) return 'from-red-600 to-red-700';
    if (data.value < 45) return 'from-orange-500 to-orange-600';
    if (data.value < 55) return 'from-yellow-500 to-yellow-600';
    if (data.value < 75) return 'from-green-500 to-green-600';
    return 'from-green-600 to-green-700';
  };

  const getIcon = () => {
    if (data.value < 25) return <FaSadTear className="text-6xl" />;
    if (data.value < 45) return <FaFrown className="text-6xl" />;
    if (data.value < 55) return <FaMeh className="text-6xl" />;
    if (data.value < 75) return <FaSmile className="text-6xl" />;
    return <FaGrin className="text-6xl" />;
  };

  const getRecommendation = () => {
    if (data.is_extreme_fear) {
      return {
        title: 'Extreme Fear = BUY OPPORTUNITY!',
        message: '💡 When others are fearful, be greedy. Historically, extreme fear marks great buying opportunities.',
        color: 'text-green-400',
      };
    }
    if (data.is_extreme_greed) {
      return {
        title: 'Extreme Greed = TAKE PROFITS!',
        message: '⚠️ When others are greedy, be fearful. Consider taking some profits off the table.',
        color: 'text-red-400',
      };
    }
    if (data.value < 50) {
      return {
        title: 'Cautious Market',
        message: '📊 Market showing some fear. Good time for cautious accumulation.',
        color: 'text-yellow-400',
      };
    }
    return {
      title: 'Optimistic Market',
      message: '📈 Market showing confidence. Watch for potential reversal signs.',
      color: 'text-blue-400',
    };
  };

  const recommendation = getRecommendation();

  return (
    <div className={`bg-gradient-to-r ${getColor()} rounded-xl p-6 shadow-2xl`}>
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Icon */}
        <div className="text-white opacity-90">
          {getIcon()}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="text-white text-sm font-medium mb-1 opacity-75">
            Silver Momentum & Sentiment
          </div>
          <div className="text-white text-5xl font-bold mb-2">
            {data.value}
            <span className="text-2xl ml-3 opacity-75">/ 100</span>
          </div>
          <div className="text-white text-2xl font-semibold mb-3">
            {data.classification}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white bg-opacity-20 rounded-full h-3 mb-4">
            <div
              className="bg-white h-3 rounded-full transition-all duration-500"
              style={{ width: `${data.value}%` }}
            ></div>
          </div>

          {/* Recommendation */}
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <div className={`font-bold text-lg mb-2 ${recommendation.color}`}>
              {recommendation.title}
            </div>
            <p className="text-white text-sm opacity-90">
              {recommendation.message}
            </p>
          </div>
        </div>

        {/* Visual Gauge */}
        <div className="hidden lg:block">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="white"
                strokeWidth="8"
                opacity="0.2"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40 * (data.value / 100)} ${2 * Math.PI * 40}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-white">{data.value}</div>
                <div className="text-xs text-white opacity-75">Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FearGreedWidget;

