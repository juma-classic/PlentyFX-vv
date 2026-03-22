import React from 'react';
import type { MarketAnalysis } from '../../../types/patel-signals';

interface DigitHeatmapProps {
  analysis: MarketAnalysis;
}

const DigitHeatmap: React.FC<DigitHeatmapProps> = ({ analysis }) => {
  const getHeatClass = (score: number): string => {
    if (score > 50) return 'heat-hot';
    if (score > 20) return 'heat-warm';
    if (score > -20) return 'heat-neutral';
    if (score > -50) return 'heat-cool';
    return 'heat-cold';
  };

  const getHeatLabel = (score: number): string => {
    if (score > 50) return 'Hot';
    if (score > 20) return 'Warm';
    if (score > -20) return 'Neutral';
    if (score > -50) return 'Cool';
    return 'Cold';
  };

  return (
    <div className="digit-heatmap glass-card">
      <div className="digit-heatmap__header">
        <h3>Digit Heatmap</h3>
        <span className="digit-heatmap__subtitle">{analysis.tickCount} ticks analyzed</span>
      </div>

      <div className="digit-heatmap__grid">
        {analysis.digits.map((stat) => (
          <div
            key={stat.digit}
            className={`digit-heatmap__cell digit-heatmap__cell--${getHeatClass(stat.hotColdScore)}`}
            title={`Digit ${stat.digit}: ${Math.round(stat.frequency)}% frequency, ${getHeatLabel(stat.hotColdScore)} (${Math.round(stat.hotColdScore)})`}
          >
            <div className="digit-heatmap__digit">{stat.digit}</div>
            <div className="digit-heatmap__freq">{Math.round(stat.frequency)}%</div>
            {stat.streak > 0 && (
              <div className="digit-heatmap__streak">{stat.streak}x</div>
            )}
          </div>
        ))}
      </div>

      <div className="digit-heatmap__legend">
        <div className="digit-heatmap__legend-item">
          <div className="digit-heatmap__legend-color digit-heatmap__legend-color--hot"></div>
          <span>Hot (&gt;50)</span>
        </div>
        <div className="digit-heatmap__legend-item">
          <div className="digit-heatmap__legend-color digit-heatmap__legend-color--warm"></div>
          <span>Warm (20-50)</span>
        </div>
        <div className="digit-heatmap__legend-item">
          <div className="digit-heatmap__legend-color digit-heatmap__legend-color--neutral"></div>
          <span>Neutral (-20 to 20)</span>
        </div>
        <div className="digit-heatmap__legend-item">
          <div className="digit-heatmap__legend-color digit-heatmap__legend-color--cool"></div>
          <span>Cool (-50 to -20)</span>
        </div>
        <div className="digit-heatmap__legend-item">
          <div className="digit-heatmap__legend-color digit-heatmap__legend-color--cold"></div>
          <span>Cold (&lt;-50)</span>
        </div>
      </div>
    </div>
  );
};

export default DigitHeatmap;
