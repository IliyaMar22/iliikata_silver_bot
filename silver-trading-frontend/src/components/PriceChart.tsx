import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface Position {
  timeframe_name: string;
  entry: number | null;
  stop_loss: number | null;
  take_profit_2: number | null;
  support_levels: number[];
  resistance_levels: number[];
  chart_data: {
    timestamps: string[];
    close: number[];
    ema_12: number[];
    ema_26: number[];
    sma_50: number[];
    bb_upper: number[];
    bb_lower: number[];
  };
}

interface PriceChartProps {
  position: Position;
}

const PriceChart: React.FC<PriceChartProps> = ({ position }) => {
  // Prepare data for chart
  const chartData = position.chart_data.timestamps.map((timestamp, idx) => ({
    time: new Date(timestamp).toLocaleTimeString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    price: position.chart_data.close[idx],
    ema12: position.chart_data.ema_12[idx],
    ema26: position.chart_data.ema_26[idx],
    sma50: position.chart_data.sma_50[idx],
    bbUpper: position.chart_data.bb_upper[idx],
    bbLower: position.chart_data.bb_lower[idx],
  }));

  // Format price for display
  const formatPrice = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-gray-800 bg-opacity-70 border border-gray-700 rounded-xl p-6 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        📈 {position.timeframe_name} Price Chart
      </h3>
      
      <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#9CA3AF"
              tickFormatter={formatPrice}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F3F4F6',
              }}
              formatter={(value: any) => [formatPrice(value), '']}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            
            {/* Bollinger Bands */}
            <Line
              type="monotone"
              dataKey="bbUpper"
              stroke="#10B981"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="BB Upper"
              strokeOpacity={0.5}
            />
            <Line
              type="monotone"
              dataKey="bbLower"
              stroke="#EF4444"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="BB Lower"
              strokeOpacity={0.5}
            />
            
            {/* Moving Averages */}
            <Line
              type="monotone"
              dataKey="ema12"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              name="EMA 12"
            />
            <Line
              type="monotone"
              dataKey="ema26"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              name="EMA 26"
            />
            <Line
              type="monotone"
              dataKey="sma50"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
              name="SMA 50"
            />
            
            {/* Price */}
            <Line
              type="monotone"
              dataKey="price"
              stroke="#FFFFFF"
              strokeWidth={3}
              dot={false}
              name="Price"
            />
            
            {/* Entry/Exit Lines */}
            {position.entry && (
              <ReferenceLine
                y={position.entry}
                stroke="#10B981"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: 'Entry', position: 'right', fill: '#10B981' }}
              />
            )}
            {position.stop_loss && (
              <ReferenceLine
                y={position.stop_loss}
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: 'Stop Loss', position: 'right', fill: '#EF4444' }}
              />
            )}
            {position.take_profit_2 && (
              <ReferenceLine
                y={position.take_profit_2}
                stroke="#10B981"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: 'TP', position: 'right', fill: '#10B981' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Chart Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-1 bg-white"></div>
          <span className="text-gray-300">Price</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-1 bg-blue-500"></div>
          <span className="text-gray-300">EMA 12</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-1 bg-red-500"></div>
          <span className="text-gray-300">EMA 26</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-1 bg-yellow-500"></div>
          <span className="text-gray-300">SMA 50</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-1 bg-green-500 opacity-50" style={{ borderTop: '1px dashed' }}></div>
          <span className="text-gray-300">BB Bands</span>
        </div>
      </div>
    </div>
  );
};

export default PriceChart;

