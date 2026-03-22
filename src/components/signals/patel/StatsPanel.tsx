import React from 'react';
import { ZapIcon, TargetIcon, TrendingUpIcon, ClockIcon } from './icons';

interface StatsPanelProps {
  activeSignals: number;
  highConfidence: number;
  marketsScanned: number;
  avgConfidence: number;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  activeSignals,
  highConfidence,
  marketsScanned,
  avgConfidence,
}) => {
  return (
    <div className="stats-panel">
      <div className="stats-panel__item">
        <span className="stats-panel__icon stats-panel__icon--primary">
          <ZapIcon size={24} />
        </span>
        <div className="stats-panel__content">
          <div className="stats-panel__value">{activeSignals}</div>
          <div className="stats-panel__label">Active Signals</div>
        </div>
      </div>

      <div className="stats-panel__item">
        <span className="stats-panel__icon stats-panel__icon--success">
          <TargetIcon size={24} />
        </span>
        <div className="stats-panel__content">
          <div className="stats-panel__value">{highConfidence}</div>
          <div className="stats-panel__label">High Confidence</div>
        </div>
      </div>

      <div className="stats-panel__item">
        <span className="stats-panel__icon stats-panel__icon--accent">
          <TrendingUpIcon size={24} />
        </span>
        <div className="stats-panel__content">
          <div className="stats-panel__value">{marketsScanned}</div>
          <div className="stats-panel__label">Markets Scanned</div>
        </div>
      </div>

      <div className="stats-panel__item">
        <span className="stats-panel__icon stats-panel__icon--warning">
          <ClockIcon size={24} />
        </span>
        <div className="stats-panel__content">
          <div className="stats-panel__value">{avgConfidence}%</div>
          <div className="stats-panel__label">Avg Confidence</div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
