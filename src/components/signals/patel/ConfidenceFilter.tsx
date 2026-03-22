import React from 'react';
import type { ConfidenceLevel } from '../../../types/patel-signals';

interface ConfidenceFilterProps {
  selected: Set<ConfidenceLevel>;
  onToggle: (selected: Set<ConfidenceLevel>) => void;
}

const LEVELS: ConfidenceLevel[] = ['HIGH', 'MEDIUM', 'LOW'];

const ConfidenceFilter: React.FC<ConfidenceFilterProps> = ({ selected, onToggle }) => {
  const handleToggle = (level: ConfidenceLevel) => {
    const newSelected = new Set(selected);
    if (newSelected.has(level)) {
      newSelected.delete(level);
    } else {
      newSelected.add(level);
    }
    onToggle(newSelected);
  };

  return (
    <div className="confidence-filter">
      <label className="confidence-filter__label">Confidence:</label>
      <div className="confidence-filter__buttons">
        {LEVELS.map((level) => (
          <button
            key={level}
            className={`confidence-filter__btn confidence-filter__btn--${level.toLowerCase()} ${
              selected.has(level) ? 'confidence-filter__btn--active' : ''
            }`}
            onClick={() => handleToggle(level)}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ConfidenceFilter;
