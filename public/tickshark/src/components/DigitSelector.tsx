import React from 'react';
import './DigitSelector.scss';

interface DigitSelectorProps {
  selectedDigit: number | null;
  onDigitSelect: (digit: number | null) => void;
  disabled?: boolean;
}

export const DigitSelector: React.FC<DigitSelectorProps> = ({
  selectedDigit,
  onDigitSelect,
  disabled = false,
}) => {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const handleDigitClick = (digit: number) => {
    if (disabled) return;
    onDigitSelect(selectedDigit === digit ? null : digit);
  };

  return (
    <div className="digit-selector">
      <h3>Select Digit</h3>
      <div className="digit-selector__grid">
        {digits.map((digit) => (
          <button
            key={digit}
            className={`digit-selector__button ${
              selectedDigit === digit ? 'digit-selector__button--selected' : ''
            } ${disabled ? 'digit-selector__button--disabled' : ''}`}
            onClick={() => handleDigitClick(digit)}
            disabled={disabled}
            type="button"
          >
            {digit}
          </button>
        ))}
      </div>
      {selectedDigit !== null && (
        <div className="digit-selector__selection">
          Selected: <strong>{selectedDigit}</strong>
        </div>
      )}
    </div>
  );
};