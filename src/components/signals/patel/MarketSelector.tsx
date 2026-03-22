import React from 'react';
import type { Market } from '../../../types/patel-signals';

interface MarketSelectorProps {
  selected: Market | 'ALL';
  onSelect: (market: Market | 'ALL') => void;
}

const MARKETS: Array<{ value: Market | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'ALL' },
  { value: 'R_10', label: 'R_10 (1s)' },
  { value: 'R_15', label: 'R_15 (1s)' },
  { value: 'R_25', label: 'R_25 (1s)' },
  { value: 'R_50', label: 'R_50 (1s)' },
  { value: 'R_90', label: 'R_90 (1s)' },
  { value: 'R_100', label: 'R_100 (1s)' },
];

const MarketSelector: React.FC<MarketSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div className="market-selector">
      <label className="market-selector__label">Market:</label>
      <div className="market-selector__buttons">
        {MARKETS.map((market) => (
          <button
            key={market.value}
            className={`market-selector__btn ${selected === market.value ? 'market-selector__btn--active' : ''}`}
            onClick={() => onSelect(market.value)}
          >
            {market.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MarketSelector;
