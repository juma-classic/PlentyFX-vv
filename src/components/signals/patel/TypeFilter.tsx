import React from 'react';
import type { ContractType } from '../../../types/patel-signals';

interface TypeFilterProps {
  selected: Set<ContractType>;
  onToggle: (selected: Set<ContractType>) => void;
}

const TYPES: ContractType[] = ['MATCHES', 'DIFFERS', 'OVER', 'UNDER', 'EVEN', 'ODD'];

const TypeFilter: React.FC<TypeFilterProps> = ({ selected, onToggle }) => {
  const handleToggle = (type: ContractType) => {
    const newSelected = new Set(selected);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    onToggle(newSelected);
  };

  return (
    <div className="type-filter">
      <label className="type-filter__label">Contract Types:</label>
      <div className="type-filter__buttons">
        {TYPES.map((type) => (
          <button
            key={type}
            className={`type-filter__btn ${selected.has(type) ? 'type-filter__btn--active' : ''}`}
            onClick={() => handleToggle(type)}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TypeFilter;
