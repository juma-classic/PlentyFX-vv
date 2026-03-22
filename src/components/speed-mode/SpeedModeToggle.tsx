import React from 'react';
import './SpeedModeToggle.scss';

interface SpeedModeToggleProps {
    isSpeedMode: boolean;
    onToggle: (enabled: boolean) => void;
    disabled?: boolean;
}

export const SpeedModeToggle: React.FC<SpeedModeToggleProps> = ({ isSpeedMode, onToggle, disabled = false }) => {
    return (
        <div className='speed-mode-toggle-container'>
            <div className='speed-mode-toggle'>
                <div className='toggle-label'>
                    <span className='label-icon'>⚡</span>
                    <span className='label-text'>Speed Mode</span>
                    <span className='label-badge'>BETA</span>
                </div>

                <button
                    className={`toggle-switch ${isSpeedMode ? 'active' : ''}`}
                    onClick={() => onToggle(!isSpeedMode)}
                    disabled={disabled}
                    aria-label={isSpeedMode ? 'Disable Speed Mode' : 'Enable Speed Mode'}
                >
                    <span className='toggle-slider'></span>
                </button>
            </div>

            <div className='speed-mode-description'>
                {isSpeedMode ? (
                    <p className='description-active'>
                        <span className='status-icon'>🚀</span>
                        Speed Mode Active - Trading on every tick (1-2 seconds)
                    </p>
                ) : (
                    <p className='description-inactive'>
                        <span className='status-icon'>🤖</span>
                        Normal Mode - Using Blockly bot logic
                    </p>
                )}
            </div>
        </div>
    );
};
