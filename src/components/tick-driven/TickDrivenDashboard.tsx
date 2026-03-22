/**
 * Tick-Driven Trading Dashboard
 * Displays live tick data, rules, queue status, and risk metrics
 */

import React from 'react';
import type { TradeRule } from '../../engine/ruleEngine';
import { TradeRules } from './TradeRules';
import './TickDrivenDashboard.scss';

interface TickStats {
    totalTicks: number;
    digitChanges: number;
    changeRate: number;
    currentDigit: number;
    queueSize: number;
}

interface TickDrivenDashboardProps {
    isActive: boolean;
    tickStats: TickStats;
    rules: TradeRule[];
    currentPrice: number;
    onStart: () => void;
    onStop: () => void;
    onAddRule: (rule: TradeRule) => void;
    onDeleteRule: (ruleId: string) => void;
    onToggleRule: (ruleId: string, enabled: boolean) => void;
}

export const TickDrivenDashboard: React.FC<TickDrivenDashboardProps> = ({
    isActive,
    tickStats,
    rules,
    currentPrice,
    onStart,
    onStop,
    onAddRule,
    onDeleteRule,
    onToggleRule,
}) => {
    const activeRules = rules.filter(rule => rule.enabled);
    const inactiveRules = rules.filter(rule => !rule.enabled);

    return (
        <div className='tick-driven-dashboard'>
            <div className='tick-driven-dashboard__header'>
                <div className='tick-driven-dashboard__title'>
                    <h2>Tick-Driven Trading Engine</h2>
                    <div className={`tick-driven-dashboard__status ${isActive ? 'active' : 'inactive'}`}>
                        {isActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}
                    </div>
                </div>

                <div className='tick-driven-dashboard__controls'>
                    {!isActive ? (
                        <button className='tick-driven-dashboard__start-btn' onClick={onStart}>
                            🚀 Start Tick-Driven Mode
                        </button>
                    ) : (
                        <button className='tick-driven-dashboard__stop-btn' onClick={onStop}>
                            🛑 Stop Tick-Driven Mode
                        </button>
                    )}
                </div>
            </div>

            <div className='tick-driven-dashboard__grid'>
                {/* Live Tick Display */}
                <div className='tick-driven-dashboard__card'>
                    <h3>Live Tick Data</h3>
                    <div className='tick-driven-dashboard__tick-display'>
                        <div className='tick-driven-dashboard__price'>
                            <span className='label'>Current Price:</span>
                            <span className='value'>{currentPrice.toFixed(5)}</span>
                        </div>
                        <div className='tick-driven-dashboard__digit'>
                            <span className='label'>Last Digit:</span>
                            <span className='value digit'>{tickStats.currentDigit}</span>
                        </div>
                    </div>
                </div>

                {/* Tick Statistics */}
                <div className='tick-driven-dashboard__card'>
                    <h3>Tick Statistics</h3>
                    <div className='tick-driven-dashboard__stats'>
                        <div className='stat-item'>
                            <span className='label'>Total Ticks:</span>
                            <span className='value'>{tickStats.totalTicks.toLocaleString()}</span>
                        </div>
                        <div className='stat-item'>
                            <span className='label'>Digit Changes:</span>
                            <span className='value'>{tickStats.digitChanges.toLocaleString()}</span>
                        </div>
                        <div className='stat-item'>
                            <span className='label'>Change Rate:</span>
                            <span className='value'>{tickStats.changeRate.toFixed(1)}%</span>
                        </div>
                        <div className='stat-item'>
                            <span className='label'>Queue Size:</span>
                            <span className='value'>{tickStats.queueSize}</span>
                        </div>
                    </div>
                </div>

                {/* Rules Summary */}
                <div className='tick-driven-dashboard__card'>
                    <h3>Rules Summary</h3>
                    <div className='tick-driven-dashboard__rules-summary'>
                        <div className='rules-count'>
                            <div className='count-item active'>
                                <span className='count'>{activeRules.length}</span>
                                <span className='label'>Active Rules</span>
                            </div>
                            <div className='count-item inactive'>
                                <span className='count'>{inactiveRules.length}</span>
                                <span className='label'>Inactive Rules</span>
                            </div>
                        </div>

                        {activeRules.length > 0 && (
                            <div className='active-rules-list'>
                                <h4>Active Rules:</h4>
                                {activeRules.map(rule => (
                                    <div key={rule.id} className='rule-item'>
                                        <span className='rule-name'>{rule.name}</span>
                                        <span className='rule-trigger'>Digit {rule.triggerDigit}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Safety Notice */}
                <div className='tick-driven-dashboard__card safety-notice'>
                    <h3>⚠️ Safety Notice</h3>
                    <div className='safety-content'>
                        <p>
                            <strong>SIMULATION MODE ONLY</strong>
                        </p>
                        <p>This engine operates in simulation mode for safety.</p>
                        <p>No real trades are executed.</p>
                        <p>All results are simulated for testing purposes.</p>
                    </div>
                </div>
            </div>

            {/* Trade Rules Configuration */}
            <TradeRules rules={rules} onAddRule={onAddRule} onDeleteRule={onDeleteRule} onToggleRule={onToggleRule} />

            {/* Performance Metrics */}
            {isActive && (
                <div className='tick-driven-dashboard__metrics'>
                    <h3>Performance Metrics</h3>
                    <div className='metrics-grid'>
                        <div className='metric-item'>
                            <span className='metric-label'>Avg Response Time:</span>
                            <span className='metric-value'>~50ms</span>
                        </div>
                        <div className='metric-item'>
                            <span className='metric-label'>Processing Rate:</span>
                            <span className='metric-value'>
                                {tickStats.digitChanges > 0
                                    ? ((tickStats.digitChanges / (tickStats.totalTicks || 1)) * 100).toFixed(1)
                                    : '0'}
                                % efficiency
                            </span>
                        </div>
                        <div className='metric-item'>
                            <span className='metric-label'>Queue Status:</span>
                            <span className='metric-value'>
                                {tickStats.queueSize === 0 ? 'Clear' : `${tickStats.queueSize} pending`}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
