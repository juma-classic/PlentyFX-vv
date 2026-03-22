import React, { useState, useCallback } from 'react';
import './StakeInput.scss';

interface StakeInputProps {
  stake: number;
  onStakeChange: (stake: number) => void;
  disabled?: boolean;
}

export const StakeInput: React.FC<StakeInputProps> = ({
  stake,
  onStakeChange,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(stake.toString());

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0.35) {
      onStakeChange(numValue);
    }
  }, [onStakeChange]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setInputValue(value.toString());
    onStakeChange(value);
  }, [onStakeChange]);

  const quickStakes = [1, 5, 10, 25, 50, 100];

  const handleQuickStake = useCallback((amount: number) => {
    if (disabled) return;
    setInputValue(amount.toString());
    onStakeChange(amount);
  }, [onStakeChange, disabled]);

  return (
    <div className="stake-input">
      <h3>Stake Amount</h3>
      
      <div className="stake-input__field">
        <label htmlFor="stake-input">USD</label>
        <input
          id="stake-input"
          type="number"
          min="0.35"
          max="50000"
          step="0.01"
          value={inputValue}
          onChange={handleInputChange}
          disabled={disabled}
          className={disabled ? 'stake-input__input--disabled' : ''}
        />
      </div>

      <div className="stake-input__slider">
        <input
          type="range"
          min="0.35"
          max="1000"
          step="0.35"
          value={stake}
          onChange={handleSliderChange}
          disabled={disabled}
          className={disabled ? 'stake-input__range--disabled' : ''}
        />
        <div className="stake-input__range-labels">
          <span>$0.35</span>
          <span>$1000</span>
        </div>
      </div>

      <div className="stake-input__quick">
        <span>Quick amounts:</span>
        <div className="stake-input__quick-buttons">
          {quickStakes.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handleQuickStake(amount)}
              disabled={disabled}
              className={`stake-input__quick-button ${
                stake === amount ? 'stake-input__quick-button--active' : ''
              } ${disabled ? 'stake-input__quick-button--disabled' : ''}`}
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};