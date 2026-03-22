import React, { useCallback, useEffect, useState } from 'react';
import './SimulationPanel.scss';

interface StrategyConfig {
    stake: number;
    enableMartingale: boolean;
    martingaleMultiplier: number;
    martingaleMaxSteps: number;
    prediction?: number;
    barrier?: number;
}

interface TradingConfig {
    // Global settings
    globalStake: number;
    globalMartingale: boolean;
    globalMartingaleMultiplier: number;
    globalMartingaleMaxSteps: number;

    // Strategy-specific configurations
    strategies: {
        [key: string]: StrategyConfig;
    };

    // Configuration mode
    useGlobalConfig: boolean;

    // Simple config properties for backward compatibility
    stake: number;
    enableMartingale: boolean;
    martingaleMultiplier: number;
    martingaleMaxSteps: number;
    prediction: number;
    barrier: number;
}

interface SpeedOption {
    value: number;
    label: string;
    description: string;
}

interface SimulationPanelProps {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    matchesProbability: number;
    differsProbability: number;
    lastDigit?: number;
}

interface Signal {
    id: string;
    type: 'MATCHES' | 'DIFFERS';
    probability: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    timestamp: string;
    reason: string;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
    enabled,
    onToggle,
    matchesProbability,
    differsProbability,
    lastDigit,
}) => {
    const [signals, setSignals] = useState<Signal[]>([]);
    const [autoGenerate, setAutoGenerate] = useState(false);
    const [threshold, setThreshold] = useState(15);

    // Speed options for signal generation
    const speedOptions: SpeedOption[] = [
        { value: 100, label: 'Ultra Fast', description: '100ms intervals' },
        { value: 500, label: 'Very Fast', description: '500ms intervals' },
        { value: 1000, label: 'Fast', description: '1000ms intervals' },
        { value: 2000, label: 'Normal', description: '2000ms intervals' },
        { value: 5000, label: 'Slow', description: '5000ms intervals' },
    ];

    const [selectedSpeed, setSelectedSpeed] = useState<number>(1000); // Default to Fast

    // Trading configuration state
    const [tradingConfig, setTradingConfig] = useState<TradingConfig>({
        globalStake: 0.35,
        globalMartingale: true,
        globalMartingaleMultiplier: 2,
        globalMartingaleMaxSteps: 3,
        useGlobalConfig: true,
        // Simple config properties for backward compatibility
        stake: 0.35,
        enableMartingale: true,
        martingaleMultiplier: 2,
        martingaleMaxSteps: 3,
        prediction: 5,
        barrier: 5,
        strategies: {
            DIGITEVEN: { stake: 0.35, enableMartingale: true, martingaleMultiplier: 2, martingaleMaxSteps: 3 },
            DIGITODD: { stake: 0.35, enableMartingale: true, martingaleMultiplier: 2, martingaleMaxSteps: 3 },
            DIGITOVER: {
                stake: 0.35,
                enableMartingale: true,
                martingaleMultiplier: 2,
                martingaleMaxSteps: 3,
                barrier: 5,
            },
            DIGITUNDER: {
                stake: 0.35,
                enableMartingale: true,
                martingaleMultiplier: 2,
                martingaleMaxSteps: 3,
                barrier: 4,
            },
            DIGITMATCHES: {
                stake: 0.35,
                enableMartingale: true,
                martingaleMultiplier: 2,
                martingaleMaxSteps: 3,
                prediction: 5,
            },
            DIGITDIFFERS: {
                stake: 0.35,
                enableMartingale: true,
                martingaleMultiplier: 2,
                martingaleMaxSteps: 3,
                prediction: 5,
            },
            CALL: { stake: 0.35, enableMartingale: true, martingaleMultiplier: 2, martingaleMaxSteps: 3 },
            PUT: { stake: 0.35, enableMartingale: true, martingaleMultiplier: 2, martingaleMaxSteps: 3 },
        },
    });

    const [showTradingConfig, setShowTradingConfig] = useState(false);

    // Generate signal based on probabilities
    const generateSignal = useCallback((): Signal | null => {
        if (lastDigit === undefined) return null;

        const timestamp = new Date().toLocaleTimeString();
        const id = `signal_${Date.now()}`;

        // Determine signal type based on probabilities
        let type: 'MATCHES' | 'DIFFERS';
        let probability: number;
        let reason: string;

        if (matchesProbability > differsProbability && matchesProbability > threshold) {
            type = 'MATCHES';
            probability = matchesProbability;
            reason = `Digit ${lastDigit} showing high frequency (${matchesProbability.toFixed(1)}%)`;
        } else if (differsProbability > matchesProbability && differsProbability > 100 - threshold) {
            type = 'DIFFERS';
            probability = differsProbability;
            reason = `Digit ${lastDigit} likely to change (${differsProbability.toFixed(1)}% differs probability)`;
        } else {
            // Generate based on patterns or randomness
            if (Math.random() > 0.5) {
                type = 'MATCHES';
                probability = matchesProbability;
                reason = `Pattern analysis suggests repeat of digit ${lastDigit}`;
            } else {
                type = 'DIFFERS';
                probability = differsProbability;
                reason = `Statistical variance suggests digit change`;
            }
        }

        // Determine confidence level
        let confidence: 'HIGH' | 'MEDIUM' | 'LOW';
        if (probability > 20) confidence = 'HIGH';
        else if (probability > 12) confidence = 'MEDIUM';
        else confidence = 'LOW';

        return {
            id,
            type,
            probability,
            confidence,
            timestamp,
            reason,
        };
    }, [lastDigit, matchesProbability, differsProbability, threshold]);

    // Manual signal generation
    const handleGenerateSignal = () => {
        const signal = generateSignal();
        if (signal) {
            setSignals(prev => [signal, ...prev.slice(0, 9)]); // Keep last 10 signals
        }
    };

    // Auto-generate signals
    useEffect(() => {
        if (!enabled || !autoGenerate || lastDigit === undefined) return;

        const interval = setInterval(() => {
            // Only generate if probabilities are significant
            if (Math.max(matchesProbability, differsProbability) > threshold) {
                const signal = generateSignal();
                if (signal) {
                    setSignals(prev => [signal, ...prev.slice(0, 9)]);
                }
            }
        }, selectedSpeed); // Use selected speed interval

        return () => clearInterval(interval);
    }, [
        enabled,
        autoGenerate,
        matchesProbability,
        differsProbability,
        lastDigit,
        threshold,
        generateSignal,
        selectedSpeed,
    ]);

    // Clear signals
    const handleClearSignals = () => {
        setSignals([]);
    };

    const getSignalColor = (type: 'MATCHES' | 'DIFFERS'): string => {
        return type === 'MATCHES' ? '#10b981' : '#ef4444';
    };

    const getConfidenceColor = (confidence: 'HIGH' | 'MEDIUM' | 'LOW'): string => {
        switch (confidence) {
            case 'HIGH':
                return '#10b981';
            case 'MEDIUM':
                return '#f59e0b';
            case 'LOW':
                return '#6b7280';
        }
    };

    // Handle trading config changes
    const handleTradingConfigChange = (key: string, value: number | boolean) => {
        setTradingConfig(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    // Get configuration for a specific strategy
    const getStrategyConfig = (strategyId: string): StrategyConfig => {
        if (tradingConfig.useGlobalConfig) {
            return {
                stake: tradingConfig.globalStake,
                enableMartingale: tradingConfig.globalMartingale,
                martingaleMultiplier: tradingConfig.globalMartingaleMultiplier,
                martingaleMaxSteps: tradingConfig.globalMartingaleMaxSteps,
                barrier: tradingConfig.strategies[strategyId]?.barrier || 5,
                prediction: tradingConfig.strategies[strategyId]?.prediction || 5,
            };
        }
        return tradingConfig.strategies[strategyId];
    };

    // Calculate current martingale stake for a strategy
    const getCurrentMartingaleStake = (strategyIdOrStep: string | number, step: number = 0): number => {
        // Handle both strategy ID and direct step calculation
        if (typeof strategyIdOrStep === 'number') {
            // Direct step calculation for preview
            const stepValue = strategyIdOrStep;
            if (!tradingConfig.enableMartingale || stepValue === 0) {
                return tradingConfig.stake;
            }
            return (
                tradingConfig.stake *
                Math.pow(tradingConfig.martingaleMultiplier, Math.min(stepValue, tradingConfig.martingaleMaxSteps))
            );
        }

        // Strategy-based calculation
        const config = getStrategyConfig(strategyIdOrStep);
        if (!config.enableMartingale || step === 0) {
            return config.stake;
        }
        return config.stake * Math.pow(config.martingaleMultiplier, Math.min(step, config.martingaleMaxSteps));
    };

    // Get current speed option details
    const getCurrentSpeedOption = (): SpeedOption => {
        return speedOptions.find(option => option.value === selectedSpeed) || speedOptions[2]; // Default to Fast
    };

    return (
        <div className='simulation-panel'>
            <div className='panel-header'>
                <h3>🎮 Simulation Mode</h3>
                <div className='toggle-switch'>
                    <input
                        type='checkbox'
                        id='simulation-toggle'
                        checked={enabled}
                        onChange={e => onToggle(e.target.checked)}
                    />
                    <label htmlFor='simulation-toggle' className='toggle-label'>
                        <span className='toggle-slider'></span>
                    </label>
                </div>
            </div>

            {enabled && (
                <>
                    {/* Trading Configuration */}
                    <div className='trading-config-section'>
                        <div className='config-header'>
                            <h4>⚙️ Trading Configuration</h4>
                            <button
                                onClick={() => setShowTradingConfig(!showTradingConfig)}
                                className={`config-toggle ${showTradingConfig ? 'active' : ''}`}
                            >
                                {showTradingConfig ? '▼' : '▶'} Configure
                            </button>
                        </div>

                        {showTradingConfig && (
                            <div className='config-panel'>
                                {/* Stake Configuration */}
                                <div className='config-group'>
                                    <label className='config-label'>💰 Stake Amount</label>
                                    <div className='input-group'>
                                        <span className='input-prefix'>$</span>
                                        <input
                                            type='number'
                                            min='0.35'
                                            max='100'
                                            step='0.01'
                                            value={tradingConfig.stake}
                                            onChange={e =>
                                                handleTradingConfigChange('stake', parseFloat(e.target.value) || 0.35)
                                            }
                                            className='config-input'
                                        />
                                    </div>
                                </div>

                                {/* Martingale Configuration */}
                                <div className='config-group'>
                                    <div className='config-toggle-group'>
                                        <label className='config-label'>📈 Martingale System</label>
                                        <div className='toggle-switch small'>
                                            <input
                                                type='checkbox'
                                                id='martingale-toggle'
                                                checked={tradingConfig.enableMartingale}
                                                onChange={e =>
                                                    handleTradingConfigChange('enableMartingale', e.target.checked)
                                                }
                                            />
                                            <label htmlFor='martingale-toggle' className='toggle-label'>
                                                <span className='toggle-slider'></span>
                                            </label>
                                        </div>
                                    </div>

                                    {tradingConfig.enableMartingale && (
                                        <div className='martingale-settings'>
                                            <div className='setting-row'>
                                                <label>Multiplier: {tradingConfig.martingaleMultiplier}x</label>
                                                <input
                                                    type='range'
                                                    min='1.5'
                                                    max='5'
                                                    step='0.1'
                                                    value={tradingConfig.martingaleMultiplier}
                                                    onChange={e =>
                                                        handleTradingConfigChange(
                                                            'martingaleMultiplier',
                                                            parseFloat(e.target.value)
                                                        )
                                                    }
                                                    className='range-slider'
                                                />
                                            </div>
                                            <div className='setting-row'>
                                                <label>Max Steps: {tradingConfig.martingaleMaxSteps}</label>
                                                <input
                                                    type='range'
                                                    min='1'
                                                    max='7'
                                                    value={tradingConfig.martingaleMaxSteps}
                                                    onChange={e =>
                                                        handleTradingConfigChange(
                                                            'martingaleMaxSteps',
                                                            parseInt(e.target.value)
                                                        )
                                                    }
                                                    className='range-slider'
                                                />
                                            </div>

                                            {/* Martingale Preview */}
                                            <div className='martingale-preview'>
                                                <div className='preview-title'>Stake Progression:</div>
                                                <div className='stake-progression'>
                                                    {Array.from(
                                                        { length: tradingConfig.martingaleMaxSteps + 1 },
                                                        (_, i) => (
                                                            <span key={i} className='stake-step'>
                                                                Step {i}: ${getCurrentMartingaleStake(i).toFixed(2)}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Prediction & Barrier Configuration */}
                                <div className='config-group'>
                                    <div className='prediction-barrier-row'>
                                        <div className='prediction-config'>
                                            <label className='config-label'>🎯 Prediction Digit</label>
                                            <select
                                                value={tradingConfig.prediction}
                                                onChange={e =>
                                                    handleTradingConfigChange('prediction', parseInt(e.target.value))
                                                }
                                                className='config-select'
                                            >
                                                {Array.from({ length: 10 }, (_, i) => (
                                                    <option key={i} value={i}>
                                                        {i}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className='barrier-config'>
                                            <label className='config-label'>🚧 Barrier</label>
                                            <select
                                                value={tradingConfig.barrier}
                                                onChange={e =>
                                                    handleTradingConfigChange('barrier', parseInt(e.target.value))
                                                }
                                                className='config-select'
                                            >
                                                {Array.from({ length: 10 }, (_, i) => (
                                                    <option key={i} value={i}>
                                                        {i}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Configuration Summary */}
                                <div className='config-summary'>
                                    <div className='summary-title'>📊 Current Configuration</div>
                                    <div className='summary-items'>
                                        <div className='summary-item'>
                                            <span>Base Stake:</span>
                                            <span className='value'>${tradingConfig.stake.toFixed(2)}</span>
                                        </div>
                                        <div className='summary-item'>
                                            <span>Martingale:</span>
                                            <span
                                                className={`value ${tradingConfig.enableMartingale ? 'enabled' : 'disabled'}`}
                                            >
                                                {tradingConfig.enableMartingale ? 'ON' : 'OFF'}
                                            </span>
                                        </div>
                                        <div className='summary-item'>
                                            <span>Prediction:</span>
                                            <span className='value'>{tradingConfig.prediction}</span>
                                        </div>
                                        <div className='summary-item'>
                                            <span>Barrier:</span>
                                            <span className='value'>{tradingConfig.barrier}</span>
                                        </div>
                                        {tradingConfig.enableMartingale && (
                                            <div className='summary-item'>
                                                <span>Max Risk:</span>
                                                <span className='value risk'>
                                                    $
                                                    {getCurrentMartingaleStake(
                                                        tradingConfig.martingaleMaxSteps
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        <div className='summary-item'>
                                            <span>Speed:</span>
                                            <span className='value'>{getCurrentSpeedOption().label}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className='simulation-controls'>
                        <div className='control-group'>
                            <label className='control-label'>Signal Threshold: {threshold}%</label>
                            <input
                                type='range'
                                min='10'
                                max='25'
                                value={threshold}
                                onChange={e => setThreshold(Number(e.target.value))}
                                className='threshold-slider'
                            />
                        </div>

                        {/* Speed Selection */}
                        <div className='control-group'>
                            <label className='control-label'>
                                ⚡ Generation Speed: {getCurrentSpeedOption().label}
                            </label>
                            <div className='speed-selector'>
                                {speedOptions.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setSelectedSpeed(option.value)}
                                        className={`speed-option ${selectedSpeed === option.value ? 'active' : ''}`}
                                        title={option.description}
                                    >
                                        <span className='speed-label'>{option.label}</span>
                                        <span className='speed-time'>{option.value}ms</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className='control-buttons'>
                            <button
                                onClick={handleGenerateSignal}
                                className='generate-btn'
                                disabled={lastDigit === undefined}
                            >
                                Generate Signal
                            </button>

                            <div className='auto-toggle'>
                                <input
                                    type='checkbox'
                                    id='auto-generate'
                                    checked={autoGenerate}
                                    onChange={e => setAutoGenerate(e.target.checked)}
                                />
                                <label htmlFor='auto-generate'>Auto</label>
                            </div>
                        </div>

                        {/* Speed Indicator */}
                        {autoGenerate && (
                            <div className='speed-indicator'>
                                <div className='indicator-icon'>⚡</div>
                                <div className='indicator-text'>
                                    Auto-generating at <strong>{getCurrentSpeedOption().label}</strong> speed
                                    <br />
                                    <span className='indicator-detail'>
                                        Next signal in ~{(selectedSpeed / 1000).toFixed(1)}s
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Current Probabilities */}
                    <div className='probability-display'>
                        <div className='prob-item matches'>
                            <span className='prob-label'>MATCHES</span>
                            <span className='prob-value'>{matchesProbability.toFixed(1)}%</span>
                        </div>
                        <div className='prob-item differs'>
                            <span className='prob-label'>DIFFERS</span>
                            <span className='prob-value'>{differsProbability.toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Signals List */}
                    <div className='signals-section'>
                        <div className='signals-header'>
                            <h4>Generated Signals</h4>
                            {signals.length > 0 && (
                                <button onClick={handleClearSignals} className='clear-btn'>
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className='signals-list'>
                            {signals.length === 0 ? (
                                <div className='empty-signals'>
                                    <div className='empty-icon'>🎯</div>
                                    <div className='empty-text'>No signals generated yet</div>
                                </div>
                            ) : (
                                signals.map(signal => (
                                    <div key={signal.id} className={`signal-item ${signal.type.toLowerCase()}`}>
                                        <div className='signal-header'>
                                            <div className='signal-type'>
                                                <span
                                                    className='type-badge'
                                                    style={{
                                                        backgroundColor: getSignalColor(signal.type) + '20',
                                                        color: getSignalColor(signal.type),
                                                        borderColor: getSignalColor(signal.type) + '40',
                                                    }}
                                                >
                                                    {signal.type}
                                                </span>
                                                <span
                                                    className='confidence-badge'
                                                    style={{ color: getConfidenceColor(signal.confidence) }}
                                                >
                                                    {signal.confidence}
                                                </span>
                                            </div>
                                            <span className='signal-time'>{signal.timestamp}</span>
                                        </div>

                                        <div className='signal-details'>
                                            <div className='signal-probability'>
                                                {signal.probability.toFixed(1)}% probability
                                            </div>
                                            <div className='signal-reason'>{signal.reason}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className='simulation-disclaimer'>
                        <div className='disclaimer-icon'>⚠️</div>
                        <div className='disclaimer-text'>
                            <strong>Educational Only:</strong> These are simulated signals based on probability
                            analysis. Not financial advice.
                        </div>
                    </div>
                </>
            )}

            {!enabled && (
                <div className='simulation-disabled'>
                    <div className='disabled-icon'>🎮</div>
                    <div className='disabled-text'>
                        Enable simulation mode to generate MATCHES/DIFFERS signals based on probability analysis.
                    </div>
                </div>
            )}
        </div>
    );
};
