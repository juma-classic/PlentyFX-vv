import React, { useState, useEffect } from 'react';
import patelSignalGenerator from '../../../services/patel-signal-generator.service';
import type { Market } from '../../../types/patel-signals';
import { ActivityIcon } from './icons';

interface LiveTickDisplayProps {
  market: Market;
}

const LiveTickDisplay: React.FC<LiveTickDisplayProps> = ({ market }) => {
  const [currentDigit, setCurrentDigit] = useState<number | null>(null);
  const [recentTicks, setRecentTicks] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const analysis = patelSignalGenerator.getMarketAnalysis(market);
      if (analysis && analysis.tickCount > 0) {
        // Get the last digit from the analysis
        const lastDigit = Math.floor(Math.random() * 10); // Simulated
        setCurrentDigit(lastDigit);
        setRecentTicks((prev) => {
          const updated = [...prev, lastDigit];
          return updated.slice(-20);
        });
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [market]);

  return (
    <div className="live-tick-display glass-card">
      <div className="live-tick-display__header">
        <span className="live-tick-display__icon pulsing">
          <ActivityIcon size={20} />
        </span>
        <h3>Live Tick Stream - {market}</h3>
      </div>
      
      <div className="live-tick-display__current">
        <div className={`live-tick-display__digit ${isAnimating ? 'scale-pulse' : ''}`}>
          {currentDigit !== null ? currentDigit : '-'}
        </div>
      </div>

      <div className="live-tick-display__recent">
        <div className="live-tick-display__recent-label">Recent 20 ticks:</div>
        <div className="live-tick-display__recent-ticks">
          {recentTicks.map((tick, index) => (
            <span key={index} className="live-tick-display__recent-tick">
              {tick}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveTickDisplay;
