/**
 * Auto Trade Panel Component
 * Controls and monitors automatic trade execution
 */

import React, { useEffect, useState } from 'react';
import { type AutoTradeConfig, autoTrader, type AutoTradeStats } from '../../services/auto-trader.service';
import './AutoTradePanel.scss';

export const AutoTradePanel: React.FC = () => {
    const [config, setConfig] = useState<AutoTradeConfig>(autoTrader.getConfig());
    const [stats, setStats] = useState<AutoTradeStats>(autoTrader.getStats());
    const [isEnabled, setIsEnabled] = useState(autoTrader.isEnabled());

    useEffect(() => {
        // Update stats every second only when enabled
        if (!isEnabled) return;

        const interval = setInterval(() => {
            setStats(prevStats => {
                const newStats = autoTrader.getStats();
                // Only update if stats actually changed
                if (JSON.stringify(prevStats) !== JSON.stringify(newStats)) {
                    return newStats;
                }
                return prevStats;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isEnabled]);

    const handleToggle = () => {
        if (isEnabled) {
            autoTrader.disable();
            setIsEnabled(false);
        } else {
            autoTrader.enable();
            setIsEnabled(true);
        }
    };

    const handleConfigChange = (updates: Partial<AutoTradeConfig>) => {
        const newConfig = { ...config, ...updates };
        setConfig(newConfig);
        autoTrader.updateConfig(updates);
    };

    const handleResetStats = () => {
        if (confirm('Reset all statistics?')) {
            autoTrader.resetStats();
            setStats(autoTrader.getStats());
        }
    };

    return (
        <div className='auto-trade-panel'>
            {/* Header */}
            <div className='panel-header'>
                <div className='header-content'>
                    <h3>🤖 Auto Trading</h3>
                    <span className={`status-badge ${isEnabled ? 'active' : 'inactive'}`}>
                        {isEnabled ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                </div>
                <button className={`toggle-button ${isEnabled ? 'enabled' : 'disabled'}`} onClick={handleToggle}>
                    {isEnabled ? 'Disable' : 'Enable'}
                </button>
            </div>

            {/* Statistics */}
            <div className='stats-grid'>
                <div className='stat-card'>
                    <div className='stat-value'>{stats.totalTrades}</div>
                    <div className='stat-label'>Total Trades</div>
                </div>
                <div className='stat-card'>
                    <div className='stat-value'>{stats.tradesThisHour}</div>
                    <div className='stat-label'>This Hour</div>
                </div>
                <div className='stat-card'>
                    <div className='stat-value'>{stats.tradesToday}</div>
                    <div className='stat-label'>Today</div>
                </div>
                <div className='stat-card'>
                    <div className='stat-value'>{stats.activeTrades}</div>
                    <div className='stat-label'>Active</div>
                </div>
            </div>

            {/* Configuration */}
            <div className='config-section'>
                <h4>Configuration</h4>

                {/* Confidence Threshold */}
                <div className='config-item'>
                    <label>
                        Min Confidence: {config.minConfidence}%
                        <input
                            type='range'
                            min='50'
                            max='95'
                            value={config.minConfidence}
                            onChange={e => handleConfigChange({ minConfidence: Number(e.target.value) })}
                        />
                    </label>
                </div>

                {/* Trade Amount */}
                <div className='config-item'>
                    <label>
                        Trade Amount: ${config.tradeAmount}
                        <input
                            type='number'
                            min='0.35'
                            max='100'
                            step='0.5'
                            value={config.tradeAmount}
                            onChange={e => handleConfigChange({ tradeAmount: Number(e.target.value) })}
                        />
                    </label>
                </div>

                {/* Max Trades Per Hour */}
                <div className='config-item'>
                    <label>
                        Max Trades/Hour: {config.maxTradesPerHour}
                        <input
                            type='range'
                            min='1'
                            max='30'
                            value={config.maxTradesPerHour}
                            onChange={e => handleConfigChange({ maxTradesPerHour: Number(e.target.value) })}
                        />
                    </label>
                </div>

                {/* Max Daily Trades */}
                <div className='config-item'>
                    <label>
                        Max Daily Trades: {config.maxDailyTrades}
                        <input
                            type='range'
                            min='10'
                            max='200'
                            value={config.maxDailyTrades}
                            onChange={e => handleConfigChange({ maxDailyTrades: Number(e.target.value) })}
                        />
                    </label>
                </div>

                {/* Max Concurrent Trades */}
                <div className='config-item'>
                    <label>
                        Max Concurrent: {config.maxConcurrentTrades}
                        <input
                            type='range'
                            min='1'
                            max='10'
                            value={config.maxConcurrentTrades}
                            onChange={e => handleConfigChange({ maxConcurrentTrades: Number(e.target.value) })}
                        />
                    </label>
                </div>

                {/* Toggles */}
                <div className='config-toggles'>
                    <label className='toggle-label'>
                        <input
                            type='checkbox'
                            checked={config.onlyHighProbability}
                            onChange={e => handleConfigChange({ onlyHighProbability: e.target.checked })}
                        />
                        <span>Only High Probability (70%+)</span>
                    </label>

                    <label className='toggle-label'>
                        <input
                            type='checkbox'
                            checked={config.respectEntryPoints}
                            onChange={e => handleConfigChange({ respectEntryPoints: e.target.checked })}
                        />
                        <span>Respect Entry Points</span>
                    </label>
                </div>
            </div>

            {/* Actions */}
            <div className='panel-actions'>
                <button className='reset-button' onClick={handleResetStats}>
                    Reset Statistics
                </button>
            </div>

            {/* Warning */}
            {isEnabled && (
                <div className='warning-banner'>⚠️ Auto-trading is active. Monitor your account regularly.</div>
            )}
        </div>
    );
};
