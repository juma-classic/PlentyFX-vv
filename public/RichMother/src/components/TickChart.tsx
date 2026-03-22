import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Tick } from '@/utils/predictions';

interface TickChartProps {
  ticks: Tick[];
}

export const TickChart = ({ ticks }: TickChartProps) => {
  const chartData = useMemo(() => {
    return ticks.slice(-20).map((tick, index) => ({
      index,
      quote: tick.quote,
      time: new Date(tick.epoch * 1000).toLocaleTimeString()
    }));
  }, [ticks]);

  if (chartData.length < 2) {
    return (
      <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
        Waiting for data...
      </div>
    );
  }

  const minValue = Math.min(...chartData.map(d => d.quote));
  const maxValue = Math.max(...chartData.map(d => d.quote));
  const padding = (maxValue - minValue) * 0.1 || 0.01;

  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(217, 91%, 60%)" />
              <stop offset="100%" stopColor="hsl(270, 60%, 60%)" />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="index" 
            hide 
          />
          <YAxis 
            domain={[minValue - padding, maxValue + padding]} 
            hide 
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(220, 18%, 10%)',
              border: '1px solid hsl(220, 15%, 25%)',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            labelFormatter={() => ''}
            formatter={(value: number) => [value.toFixed(4), 'Price']}
          />
          <Line
            type="monotone"
            dataKey="quote"
            stroke="url(#chartGradient)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'hsl(217, 91%, 60%)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
