/**
 * Position Size Calculator Component
 * Calculates and displays optimal trade sizes using Kelly Criterion
 */

import React, { useState, useEffect } from 'react';
import { positionSizer, type PositionSizeConfig, type PositionSizeResult } from '../../services/position-sizer.service';
import './PositionSizeCalculator.scss';

interface PositionSizeCalculatorProps {
    confidence: number;
    winRate?: number;
    payoutRatio?: number;
    onSizeCalculated?: (result: PositionSizeResult) => void;
}

export const PositionSizeCalculator: React.FC<PositionSizeCalculatorProps> = ({
    confidence,
    winRate,
    payoutRatio,
    onSizeCalculated,
}) => {
    const [config, setConfig] = useState<PositionSizeConfig>(positionSizer.getConfig());
    const [result, setResult] = useState<PositionSizeResult | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const newResult = positionSizer.calculatePositionSize(confidence, winRate, payoutRatio);
        setResult(newResult);
        onSizeCalculated?.(newResult);
    }, [confidence, winRate, payoutRatio, config]);

    const handleConfigChange = (updates: Partial<PositionSizeConfig>) => {
        const newConfig = { ...config, ...updates };
        setConfig(newConfig);
        positionSizer.updateConfig(updates);
    };

    const getRiskColor = () => {
        if (!result) return 'medium';
        if (result.riskPercentage <= 1) return 'low';
        if (result.riskPercentage <= 2) return 'medium';
        return 'high';
    };

    if (!result) return null;

    return (
        <div className="position-size-calculator">
            {/* Header */}
            <div className="calculator-header">
                <h4>📊 Position Size</h4>
                <button
                    className="settings-button"
                    onClick={() => setShowSettings(!showSettings)}
                >
                    ⚙️
                </button>
            </div>

            {/* Main Result */}
            <div className="size-result">
                <div className="recommended-stake">
                    <span className="stake-label">Recommended:</span>
                    <span className="stake-value">${result.recommendedStake}</span>
                </div>
                <div className={`risk-indicator ${getRiskColor()}`}>
                    {result.riskPercentage.toFixed(2)}% Risk
                </div>
            </div>

            {/* Kelly Information */}
            {result.kellyPercentage !== undefined && (
                <div className="kelly-info">
                    <div className="kelly-percentage">
                        Kelly: {result.kellyPercentage.toFixed(2)}%
                    </div>
                    <div className="kelly-note">
                        Using {config.kellyFraction * 100}% Kelly for safety
                    </div>
                </div>
            )}

            {/* Reasoning */}
            <div className="reasoning">
                <p>{result.reasoning}</p>
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
                <div className="warnings">
                    {result.warnings.map((warning, index) => (
                        <div key={index} className="warning-item">
                            ⚠️ {warning}
                        </div>
                    ))}
                </div>
            )}

            {/* Settings Panel */}
            {showSettings && (
                <div className="settings-panel">
                    <h5>Configuration</h5>

                    {/* Account Balance */}
                    <div className="setting-item">
                        <label>
                            Account Balance: ${config.accountBalance}
                            <input
                                type="number"
                                min="1"
                                max="100000"
                                step="1"
                                value={config.accountBalance}
                                onChange={e => handleConfigChange({ accountBalance: Number(e.target.value) })}
                            />
                        </label>
                    </div>

                    {/* Max Risk Per Trade */}
                    <div className="setting-item">
                        <label>
                            Max Risk Per Trade: {config.maxRiskPerTrade}%
                            <input
                                type="range"
                                min="0.5"
                                max="10"
                                step="0.5"
                                value={config.maxRiskPerTrade}
                                onChange={e => handleConfigChange({ maxRiskPerTrade: Number(e.target.value) })}
                            />
                        </label>
                    </div>

                    {/* Min/Max Stake */}
                    <div className="setting-row">
                        <div className="setting-item">
                            <label>
                                Min Stake: ${config.minStake}
                                <input
                                    type="number"
                                    min="0.35"
                                    max="10"
                                    step="0.05"
                                    value={config.minStake}
                                    onChange={e => handleConfigChange({ minStake: Number(e.target.value) })}
                                />
                            </label>
                        </div>
                        <div className="setting-item">
                            <label>
                                Max Stake: ${config.maxStake}
                                <input
                                    type="number"
                                    min="1"
                                    max="1000"
                                    step="1"
                                    value={config.maxStake}
                                    onChange={e => handleConfigChange({ maxStake: Number(e.target.value) })}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Kelly Settings */}
                    <div className="setting-item">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={config.useKellyCriterion}
                                onChange={e => handleConfigChange({ useKellyCriterion: e.target.checked })}
                            />
                            Use Kelly Criterion
                        </label>
                    </div>

                    {config.useKellyCriterion && (
                        <div className="setting-item">
                            <label>
                                Kelly Fraction: {config.kellyFraction * 100}%
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.1"
                                    value={config.kellyFraction}
                                    onChange={e => handleConfigChange({ kellyFraction: Number(e.target.value) })}
                                />
                            </label>
                            <div className="setting-note">
                                Fraction of Kelly to use (0.5 = Half Kelly for safety)
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};