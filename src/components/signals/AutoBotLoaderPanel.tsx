import React, { useEffect, useState } from 'react';
import {
    autoBotLoaderService,
    type AutoLoadConfig,
    type AutoLoadStats,
    type AutoLoadEvent,
} from '@/services/auto-bot-loader.service';
import {
    DiamondIcon,
    StopIcon,
    ResetIcon,
    TargetIcon,
    TrendDownIcon,
    DollarIcon,
    ChartIcon,
    SettingsIcon,
    ShieldIcon,
    BellIcon,
    RobotIcon,
    BrainIcon,
    SignalIcon,
    PlayIcon,
    LightningIcon,
    ToolIcon,
    TestTubeIcon,
    CheckIcon,
    XIcon,
} from './PremiumIcons';
import './AutoBotLoaderPanel.scss';

interface AutoBotLoaderPanelProps {
    className?: string;
}

export const AutoBotLoaderPanel: React.FC<AutoBotLoaderPanelProps> = ({ className }) => {
    const [config, setConfig] = useState<AutoLoadConfig>(autoBotLoaderService.getConfig());
    const [stats, setStats] = useState<AutoLoadStats>(autoBotLoaderService.getStats());
    const [events, setEvents] = useState<AutoLoadEvent[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'risk' | 'notifications' | 'markets' | 'premium'>(
        'overview'
    );

    useEffect(() => {
        // Subscribe to auto-load events
        const unsubscribe = autoBotLoaderService.onAutoLoad(event => {
            setEvents(prev => [event, ...prev].slice(0, 10));
        });

        // Update stats periodically
        const statsInterval = setInterval(() => {
            setStats(autoBotLoaderService.getStats());
        }, 2000);

        // Load initial events
        setEvents(autoBotLoaderService.getEvents().slice(0, 10));

        return () => {
            unsubscribe();
            clearInterval(statsInterval);
        };
    }, []);

    const handleToggleAutoLoader = () => {
        if (config.enabled) {
            autoBotLoaderService.stop();
        } else {
            autoBotLoaderService.start();
        }
        setConfig(autoBotLoaderService.getConfig());
    };

    const handleConfigChange = (updates: Partial<AutoLoadConfig>) => {
        const newConfig = { ...config, ...updates };
        setConfig(newConfig);
        autoBotLoaderService.updateConfig(updates);
    };

    const handleResetLogs = () => {
        if (confirm('Are you sure you want to reset all logs and counters? This action cannot be undone.')) {
            autoBotLoaderService.resetAll();
            setStats(autoBotLoaderService.getStats());
            setEvents([]);
        }
    };

    const handleStopBot = () => {
        autoBotLoaderService.stopBot();
    };

    const handleTestTelegram = async () => {
        const success = await autoBotLoaderService.testTelegramConnection();
        alert(success ? 'Telegram connection successful!' : 'Telegram connection failed. Check your settings.');
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const getEventIcon = (source: string) => {
        switch (source) {
            case 'ADVANCED_ALGO':
                return <RobotIcon size={16} />;
            case 'PATEL_SIGNALS':
                return <TargetIcon size={16} />;
            case 'AI_INTELLIGENCE':
                return <BrainIcon size={16} />;
            case 'VIP_SIGNALS':
                return <DiamondIcon size={16} />;
            default:
                return <SignalIcon size={16} />;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatMarketName = (market: string): string => {
        // Standard volatility indices
        if (market.startsWith('R_')) {
            return `Volatility ${market.replace('R_', '')} Index`;
        }
        // 1-Second volatility indices
        if (market.startsWith('1HZ')) {
            const volatility = market.replace('1HZ', '').replace('V', '');
            return `Volatility ${volatility} (1s) Index`;
        }
        return market;
    };

    return (
        <div className={`auto-bot-loader-panel patel-premium-panel ${className || ''}`}>
            <div className='auto-bot-loader-panel__header'>
                <div className='auto-bot-loader-panel__title'>
                    <span className='auto-bot-loader-panel__icon'>
                        <DiamondIcon size={24} />
                    </span>
                    <h3>Patel Premium</h3>
                    <div className={`auto-bot-loader-panel__status ${config.enabled ? 'active' : 'inactive'}`}>
                        {config.enabled ? 'ACTIVE' : 'INACTIVE'}
                    </div>
                </div>
                <button className='auto-bot-loader-panel__toggle' onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? '▼' : '▶'}
                </button>
            </div>

            <div className='auto-bot-loader-panel__main'>
                {/* Main Controls */}
                <div className='auto-bot-loader-panel__controls'>
                    <button
                        className={`auto-bot-loader-panel__power-btn ${config.enabled ? 'active' : ''}`}
                        onClick={handleToggleAutoLoader}
                    >
                        {config.enabled ? (
                            <>
                                <StopIcon size={18} /> Stop Premium Bot
                            </>
                        ) : (
                            <>
                                <PlayIcon size={18} /> Start Premium Bot
                            </>
                        )}
                    </button>

                    <button
                        className='auto-bot-loader-panel__stop-bot-btn'
                        onClick={handleStopBot}
                        title='Stop the currently running bot'
                    >
                        <StopIcon size={18} /> Stop Bot
                    </button>

                    <button
                        className='auto-bot-loader-panel__reset-btn'
                        onClick={handleResetLogs}
                        title='Reset all logs and counters'
                    >
                        <ResetIcon size={18} /> Reset Logs
                    </button>
                </div>

                {/* Win/Loss Display */}
                <div className='auto-bot-loader-panel__win-loss-display'>
                    <div className='win-loss-card'>
                        <div className='win-loss-header'>
                            <span className='icon'>
                                <TargetIcon size={20} />
                            </span>
                            <span className='label'>Win Streak</span>
                        </div>
                        <div className='win-loss-value win'>{stats.winLossStats.currentWinStreak}</div>
                        <div className='win-loss-limit'>Stop at: {config.winLossManagement.stopAfterWins}</div>
                    </div>

                    <div className='win-loss-card'>
                        <div className='win-loss-header'>
                            <span className='icon'>
                                <TrendDownIcon size={20} />
                            </span>
                            <span className='label'>Loss Streak</span>
                        </div>
                        <div className='win-loss-value loss'>{stats.winLossStats.currentLossStreak}</div>
                        <div className='win-loss-limit'>Stop at: {config.winLossManagement.stopAfterLosses}</div>
                    </div>

                    <div className='win-loss-card'>
                        <div className='win-loss-header'>
                            <span className='icon'>
                                <DollarIcon size={20} />
                            </span>
                            <span className='label'>Daily P&L</span>
                        </div>
                        <div className={`win-loss-value ${stats.performance.profitLoss >= 0 ? 'win' : 'loss'}`}>
                            {formatCurrency(stats.performance.profitLoss)}
                        </div>
                        <div className='win-loss-limit'>Win Rate: {stats.performance.winRate.toFixed(1)}%</div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className='auto-bot-loader-panel__quick-stats'>
                    <div className='stat'>
                        <span className='label'>Today:</span>
                        <span className='value'>{stats.autoLoadsToday}</span>
                    </div>
                    <div className='stat'>
                        <span className='label'>This Hour:</span>
                        <span className='value'>
                            {stats.autoLoadsThisHour}/{config.maxAutoLoadsPerHour}
                        </span>
                    </div>
                    <div className='stat'>
                        <span className='label'>Success Rate:</span>
                        <span className='value'>{stats.successRate.toFixed(1)}%</span>
                    </div>
                    <div className='stat'>
                        <span className='label'>Total Trades:</span>
                        <span className='value'>{stats.winLossStats.totalWins + stats.winLossStats.totalLosses}</span>
                    </div>
                </div>

                {isExpanded && (
                    <div className='auto-bot-loader-panel__expanded'>
                        {/* Tab Navigation */}
                        <div className='premium-tabs'>
                            <button
                                className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                <ChartIcon size={16} /> Overview
                            </button>
                            <button
                                className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
                                onClick={() => setActiveTab('settings')}
                            >
                                <SettingsIcon size={16} /> Settings
                            </button>
                            <button
                                className={`tab ${activeTab === 'risk' ? 'active' : ''}`}
                                onClick={() => setActiveTab('risk')}
                            >
                                <ShieldIcon size={16} /> Risk
                            </button>
                            <button
                                className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
                                onClick={() => setActiveTab('notifications')}
                            >
                                <BellIcon size={16} /> Alerts
                            </button>
                            <button
                                className={`tab ${activeTab === 'markets' ? 'active' : ''}`}
                                onClick={() => setActiveTab('markets')}
                            >
                                <ChartIcon size={16} /> Markets
                            </button>
                            <button
                                className={`tab ${activeTab === 'premium' ? 'active' : ''}`}
                                onClick={() => setActiveTab('premium')}
                            >
                                <DiamondIcon size={16} /> Premium
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className='premium-tab-content'>
                            {activeTab === 'overview' && (
                                <div className='tab-panel'>
                                    <h4>
                                        <ChartIcon size={20} /> Performance Overview
                                    </h4>

                                    <div className='performance-grid'>
                                        <div className='perf-card'>
                                            <div className='perf-label'>Total Wins</div>
                                            <div className='perf-value win'>{stats.winLossStats.totalWins}</div>
                                        </div>
                                        <div className='perf-card'>
                                            <div className='perf-label'>Total Losses</div>
                                            <div className='perf-value loss'>{stats.winLossStats.totalLosses}</div>
                                        </div>
                                        <div className='perf-card'>
                                            <div className='perf-label'>Max Win Streak</div>
                                            <div className='perf-value'>{stats.winLossStats.maxWinStreak}</div>
                                        </div>
                                        <div className='perf-card'>
                                            <div className='perf-label'>Max Loss Streak</div>
                                            <div className='perf-value'>{stats.winLossStats.maxLossStreak}</div>
                                        </div>
                                        <div className='perf-card'>
                                            <div className='perf-label'>Average Win</div>
                                            <div className='perf-value win'>
                                                {formatCurrency(stats.performance.averageWin)}
                                            </div>
                                        </div>
                                        <div className='perf-card'>
                                            <div className='perf-label'>Average Loss</div>
                                            <div className='perf-value loss'>
                                                {formatCurrency(stats.performance.averageLoss)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className='auto-bot-loader-panel__recent-events'>
                                        <h4>Recent Activity</h4>
                                        <div className='events-list'>
                                            {events.length === 0 ? (
                                                <div className='no-events'>No activity yet</div>
                                            ) : (
                                                events.map(event => (
                                                    <div
                                                        key={event.id}
                                                        className={`event-item ${event.success ? 'success' : 'error'}`}
                                                    >
                                                        <div className='event-header'>
                                                            <span className='event-icon'>
                                                                {getEventIcon(event.signalSource)}
                                                            </span>
                                                            <span className='event-bot'>{event.botLoaded}</span>
                                                            <span className='event-confidence'>
                                                                {event.confidence}%
                                                            </span>
                                                            <span className='event-time'>
                                                                {formatTime(event.timestamp)}
                                                            </span>
                                                            <span
                                                                className={`event-status ${event.success ? 'success' : 'error'}`}
                                                            >
                                                                {event.success ? (
                                                                    <CheckIcon size={16} />
                                                                ) : (
                                                                    <XIcon size={16} />
                                                                )}
                                                            </span>
                                                        </div>
                                                        {event.tradeResult && (
                                                            <div
                                                                className={`trade-result ${event.tradeResult.outcome.toLowerCase()}`}
                                                            >
                                                                {event.tradeResult.outcome}:{' '}
                                                                {formatCurrency(event.tradeResult.profit)}
                                                            </div>
                                                        )}
                                                        {event.error && (
                                                            <div className='event-error'>{event.error}</div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className='tab-panel'>
                                    <h4>
                                        <SettingsIcon size={20} /> Basic Settings
                                    </h4>

                                    <div className='setting-group'>
                                        <label>
                                            <span>Minimum Confidence:</span>
                                            <input
                                                type='range'
                                                min='50'
                                                max='95'
                                                value={config.minConfidence}
                                                onChange={e =>
                                                    handleConfigChange({ minConfidence: parseInt(e.target.value) })
                                                }
                                            />
                                            <span className='value'>{config.minConfidence}%</span>
                                        </label>
                                    </div>

                                    <div className='setting-group'>
                                        <label>
                                            <span>Max Auto-Loads/Hour:</span>
                                            <input
                                                type='range'
                                                min='5'
                                                max='50'
                                                value={config.maxAutoLoadsPerHour}
                                                onChange={e =>
                                                    handleConfigChange({
                                                        maxAutoLoadsPerHour: parseInt(e.target.value),
                                                    })
                                                }
                                            />
                                            <span className='value'>{config.maxAutoLoadsPerHour}</span>
                                        </label>
                                    </div>

                                    <div className='setting-group'>
                                        <label className='checkbox-label'>
                                            <input
                                                type='checkbox'
                                                checked={config.autoRun}
                                                onChange={e => handleConfigChange({ autoRun: e.target.checked })}
                                            />
                                            <span>Auto-run bots after loading</span>
                                        </label>
                                    </div>

                                    {config.autoRun && (
                                        <div className='setting-group'>
                                            <label>
                                                <span>Auto-run Delay:</span>
                                                <input
                                                    type='range'
                                                    min='1'
                                                    max='10'
                                                    value={config.autoRunDelay}
                                                    onChange={e =>
                                                        handleConfigChange({ autoRunDelay: parseInt(e.target.value) })
                                                    }
                                                />
                                                <span className='value'>{config.autoRunDelay}s</span>
                                            </label>
                                        </div>
                                    )}

                                    <div className='auto-bot-loader-panel__signal-sources'>
                                        <h4>Signal Sources</h4>
                                        <div className='source-toggles'>
                                            <label className='checkbox-label'>
                                                <input
                                                    type='checkbox'
                                                    checked={config.signalSources.advancedAlgo}
                                                    onChange={e =>
                                                        handleConfigChange({
                                                            signalSources: {
                                                                ...config.signalSources,
                                                                advancedAlgo: e.target.checked,
                                                            },
                                                        })
                                                    }
                                                />
                                                <span>
                                                    <RobotIcon size={16} /> Advanced Algorithm
                                                </span>
                                            </label>
                                            <label className='checkbox-label'>
                                                <input
                                                    type='checkbox'
                                                    checked={config.signalSources.patelSignals}
                                                    onChange={e =>
                                                        handleConfigChange({
                                                            signalSources: {
                                                                ...config.signalSources,
                                                                patelSignals: e.target.checked,
                                                            },
                                                        })
                                                    }
                                                />
                                                <span>
                                                    <TargetIcon size={16} /> Patel Signals
                                                </span>
                                            </label>
                                            <label className='checkbox-label'>
                                                <input
                                                    type='checkbox'
                                                    checked={config.signalSources.aiIntelligence}
                                                    onChange={e =>
                                                        handleConfigChange({
                                                            signalSources: {
                                                                ...config.signalSources,
                                                                aiIntelligence: e.target.checked,
                                                            },
                                                        })
                                                    }
                                                />
                                                <span>
                                                    <BrainIcon size={16} /> AI Intelligence
                                                </span>
                                            </label>
                                            <label className='checkbox-label'>
                                                <input
                                                    type='checkbox'
                                                    checked={config.signalSources.vipSignals}
                                                    onChange={e =>
                                                        handleConfigChange({
                                                            signalSources: {
                                                                ...config.signalSources,
                                                                vipSignals: e.target.checked,
                                                            },
                                                        })
                                                    }
                                                />
                                                <span>
                                                    <DiamondIcon size={16} /> VIP Signals
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className='auto-bot-loader-panel__bot-preferences'>
                                        <h4>Bot Preferences</h4>
                                        <div className='preference-group'>
                                            <label>
                                                <span>Even/Odd:</span>
                                                <select
                                                    value={config.botPreferences.evenOdd}
                                                    onChange={e =>
                                                        handleConfigChange({
                                                            botPreferences: {
                                                                ...config.botPreferences,
                                                                evenOdd: e.target.value as any,
                                                            },
                                                        })
                                                    }
                                                >
                                                    <option value='CFX-EvenOdd'>CFX Even/Odd</option>
                                                    <option value='CFX-025'>CFX-025</option>
                                                    <option value='EvenOddGhost'>Even Odd Ghost</option>
                                                </select>
                                            </label>
                                        </div>
                                        <div className='preference-group'>
                                            <label>
                                                <span>Over/Under:</span>
                                                <select
                                                    value={config.botPreferences.overUnder}
                                                    onChange={e =>
                                                        handleConfigChange({
                                                            botPreferences: {
                                                                ...config.botPreferences,
                                                                overUnder: e.target.value as any,
                                                            },
                                                        })
                                                    }
                                                >
                                                    <option value='PATEL'>PATEL (with Entry)</option>
                                                    <option value='Raziel'>Raziel Over Under</option>
                                                    <option value='GameChanger'>Game Changer AI</option>
                                                </select>
                                            </label>
                                        </div>
                                        <div className='preference-group'>
                                            <label>
                                                <span>Rise/Fall:</span>
                                                <select
                                                    value={config.botPreferences.riseFall}
                                                    onChange={e =>
                                                        handleConfigChange({
                                                            botPreferences: {
                                                                ...config.botPreferences,
                                                                riseFall: e.target.value as any,
                                                            },
                                                        })
                                                    }
                                                >
                                                    <option value='CFX-RiseFall'>CFX Rise/Fall</option>
                                                    <option value='GameChanger'>Game Changer AI</option>
                                                    <option value='DigitHunter'>Digit Hunter Pro</option>
                                                </select>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'risk' && (
                                <div className='tab-panel'>
                                    <h4>
                                        <ShieldIcon size={20} /> Risk Management
                                    </h4>

                                    <div className='risk-section'>
                                        <h5>Win/Loss Management</h5>
                                        <div className='setting-group'>
                                            <label className='checkbox-label'>
                                                <input
                                                    type='checkbox'
                                                    checked={config.winLossManagement.enabled}
                                                    onChange={e =>
                                                        handleConfigChange({
                                                            winLossManagement: {
                                                                ...config.winLossManagement,
                                                                enabled: e.target.checked,
                                                            },
                                                        })
                                                    }
                                                />
                                                <span>Enable Win/Loss Management</span>
                                            </label>
                                        </div>

                                        {config.winLossManagement.enabled && (
                                            <>
                                                <div className='setting-group'>
                                                    <label>
                                                        <span>Stop after wins:</span>
                                                        <input
                                                            type='range'
                                                            min='2'
                                                            max='20'
                                                            value={config.winLossManagement.stopAfterWins}
                                                            onChange={e =>
                                                                handleConfigChange({
                                                                    winLossManagement: {
                                                                        ...config.winLossManagement,
                                                                        stopAfterWins: parseInt(e.target.value),
                                                                    },
                                                                })
                                                            }
                                                        />
                                                        <span className='value'>
                                                            {config.winLossManagement.stopAfterWins}
                                                        </span>
                                                    </label>
                                                </div>

                                                <div className='setting-group'>
                                                    <label>
                                                        <span>Stop after losses:</span>
                                                        <input
                                                            type='range'
                                                            min='2'
                                                            max='20'
                                                            value={config.winLossManagement.stopAfterLosses}
                                                            onChange={e =>
                                                                handleConfigChange({
                                                                    winLossManagement: {
                                                                        ...config.winLossManagement,
                                                                        stopAfterLosses: parseInt(e.target.value),
                                                                    },
                                                                })
                                                            }
                                                        />
                                                        <span className='value'>
                                                            {config.winLossManagement.stopAfterLosses}
                                                        </span>
                                                    </label>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className='risk-section'>
                                        <h5>Daily Limits</h5>
                                        <div className='setting-group'>
                                            <label>
                                                <span>Daily Profit Limit:</span>
                                                <input
                                                    type='number'
                                                    min='10'
                                                    max='10000'
                                                    step='10'
                                                    value={config.riskManagement.dailyProfitLimit}
                                                    onChange={e =>
                                                        handleConfigChange({
                                                            riskManagement: {
                                                                ...config.riskManagement,
                                                                dailyProfitLimit: parseFloat(e.target.value),
                                                            },
                                                        })
                                                    }
                                                />
                                                <span className='currency'>$</span>
                                            </label>
                                        </div>

                                        <div className='setting-group'>
                                            <label>
                                                <span>Daily Loss Limit:</span>
                                                <input
                                                    type='number'
                                                    min='10'
                                                    max='5000'
                                                    step='10'
                                                    value={config.riskManagement.dailyLossLimit}
                                                    onChange={e =>
                                                        handleConfigChange({
                                                            riskManagement: {
                                                                ...config.riskManagement,
                                                                dailyLossLimit: parseFloat(e.target.value),
                                                            },
                                                        })
                                                    }
                                                />
                                                <span className='currency'>$</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className='risk-section'>
                                        <h5>Stake Management</h5>
                                        <div className='setting-group'>
                                            <label className='checkbox-label'>
                                                <input
                                                    type='checkbox'
                                                    checked={config.stakeManagement.autoScaling}
                                                    onChange={e =>
                                                        handleConfigChange({
                                                            stakeManagement: {
                                                                ...config.stakeManagement,
                                                                autoScaling: e.target.checked,
                                                            },
                                                        })
                                                    }
                                                />
                                                <span>Auto-scaling stake based on wins/losses</span>
                                            </label>
                                        </div>

                                        <div className='setting-group'>
                                            <label className='checkbox-label'>
                                                <input
                                                    type='checkbox'
                                                    checked={config.stakeManagement.martingaleEnabled}
                                                    onChange={e =>
                                                        handleConfigChange({
                                                            stakeManagement: {
                                                                ...config.stakeManagement,
                                                                martingaleEnabled: e.target.checked,
                                                            },
                                                        })
                                                    }
                                                />
                                                <span>Enable Martingale progression</span>
                                            </label>
                                        </div>

                                        {config.stakeManagement.martingaleEnabled && (
                                            <>
                                                <div className='setting-group'>
                                                    <label>
                                                        <span>Martingale Multiplier:</span>
                                                        <input
                                                            type='range'
                                                            min='1.5'
                                                            max='5'
                                                            step='0.1'
                                                            value={config.stakeManagement.martingaleMultiplier}
                                                            onChange={e =>
                                                                handleConfigChange({
                                                                    stakeManagement: {
                                                                        ...config.stakeManagement,
                                                                        martingaleMultiplier: parseFloat(
                                                                            e.target.value
                                                                        ),
                                                                    },
                                                                })
                                                            }
                                                        />
                                                        <span className='value'>
                                                            {config.stakeManagement.martingaleMultiplier}x
                                                        </span>
                                                    </label>
                                                </div>

                                                <div className='setting-group'>
                                                    <label>
                                                        <span>Max Martingale Steps:</span>
                                                        <input
                                                            type='range'
                                                            min='1'
                                                            max='10'
                                                            value={config.stakeManagement.maxMartingaleSteps}
                                                            onChange={e =>
                                                                handleConfigChange({
                                                                    stakeManagement: {
                                                                        ...config.stakeManagement,
                                                                        maxMartingaleSteps: parseInt(e.target.value),
                                                                    },
                                                                })
                                                            }
                                                        />
                                                        <span className='value'>
                                                            {config.stakeManagement.maxMartingaleSteps}
                                                        </span>
                                                    </label>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className='tab-panel'>
                                    <h4>
                                        <BellIcon size={20} /> Notification Settings
                                    </h4>

                                    <div className='notification-section'>
                                        <h5>Notification Types</h5>
                                        <div className='setting-group'>
                                            <label className='checkbox-label'>
                                                <input
                                                    type='checkbox'
                                                    checked={config.notificationSettings.browser}
                                                    onChange={e =>
                                                        handleConfigChange({
                                                            notificationSettings: {
                                                                ...config.notificationSettings,
                                                                browser: e.target.checked,
                                                            },
                                                        })
                                                    }
                                                />
                                                <span>🌐 Browser notifications</span>
                                            </label>
                                        </div>

                                        <div className='setting-group'>
                                            <label className='checkbox-label'>
                                                <input
                                                    type='checkbox'
                                                    checked={config.notificationSettings.sounds}
                                                    onChange={e =>
                                                        handleConfigChange({
                                                            notificationSettings: {
                                                                ...config.notificationSettings,
                                                                sounds: e.target.checked,
                                                            },
                                                        })
                                                    }
                                                />
                                                <span>🔊 Sound alerts</span>
                                            </label>
                                        </div>

                                        <div className='setting-group'>
                                            <label className='checkbox-label'>
                                                <input
                                                    type='checkbox'
                                                    checked={config.notificationSettings.mobile}
                                                    onChange={e =>
                                                        handleConfigChange({
                                                            notificationSettings: {
                                                                ...config.notificationSettings,
                                                                mobile: e.target.checked,
                                                            },
                                                        })
                                                    }
                                                />
                                                <span>📱 Mobile push notifications</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className='notification-section'>
                                        <h5>Telegram Integration</h5>
                                        <div className='setting-group'>
                                            <label className='checkbox-label'>
                                                <input
                                                    type='checkbox'
                                                    checked={config.notificationSettings.telegram}
                                                    onChange={e =>
                                                        handleConfigChange({
                                                            notificationSettings: {
                                                                ...config.notificationSettings,
                                                                telegram: e.target.checked,
                                                            },
                                                        })
                                                    }
                                                />
                                                <span>📱 Telegram notifications</span>
                                            </label>
                                        </div>

                                        {config.notificationSettings.telegram && (
                                            <>
                                                <div className='setting-group'>
                                                    <label>
                                                        <span>Bot Token:</span>
                                                        <input
                                                            type='text'
                                                            placeholder='Enter Telegram bot token'
                                                            value={config.notificationSettings.telegramBotToken || ''}
                                                            onChange={e =>
                                                                handleConfigChange({
                                                                    notificationSettings: {
                                                                        ...config.notificationSettings,
                                                                        telegramBotToken: e.target.value,
                                                                    },
                                                                })
                                                            }
                                                        />
                                                    </label>
                                                </div>

                                                <div className='setting-group'>
                                                    <label>
                                                        <span>Chat ID:</span>
                                                        <input
                                                            type='text'
                                                            placeholder='Enter chat ID'
                                                            value={config.notificationSettings.telegramChatId || ''}
                                                            onChange={e =>
                                                                handleConfigChange({
                                                                    notificationSettings: {
                                                                        ...config.notificationSettings,
                                                                        telegramChatId: e.target.value,
                                                                    },
                                                                })
                                                            }
                                                        />
                                                    </label>
                                                </div>

                                                <button
                                                    className='test-telegram-btn'
                                                    onClick={handleTestTelegram}
                                                    disabled={
                                                        !config.notificationSettings.telegramBotToken ||
                                                        !config.notificationSettings.telegramChatId
                                                    }
                                                >
                                                    <TestTubeIcon size={16} /> Test Telegram Connection
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'markets' && (
                                <div className='tab-panel'>
                                    <h4>
                                        <ChartIcon size={20} /> Market Switching
                                    </h4>

                                    <div className='setting-group'>
                                        <label className='checkbox-label'>
                                            <input
                                                type='checkbox'
                                                checked={config.marketSwitching.enabled}
                                                onChange={e =>
                                                    handleConfigChange({
                                                        marketSwitching: {
                                                            ...config.marketSwitching,
                                                            enabled: e.target.checked,
                                                        },
                                                    })
                                                }
                                            />
                                            <span>Enable Market Switching</span>
                                        </label>
                                    </div>

                                    {config.marketSwitching.enabled && (
                                        <>
                                            <div className='setting-group'>
                                                <label>
                                                    <span>Mode:</span>
                                                    <select
                                                        value={config.marketSwitching.mode}
                                                        onChange={e =>
                                                            handleConfigChange({
                                                                marketSwitching: {
                                                                    ...config.marketSwitching,
                                                                    mode: e.target.value as 'manual' | 'automatic',
                                                                },
                                                            })
                                                        }
                                                    >
                                                        <option value='manual'>Manual Selection</option>
                                                        <option value='automatic'>Automatic (Performance-Based)</option>
                                                    </select>
                                                </label>
                                            </div>

                                            <div className='setting-group'>
                                                <label>
                                                    <span>Current Market:</span>
                                                    <select
                                                        value={config.marketSwitching.currentMarket}
                                                        onChange={e =>
                                                            handleConfigChange({
                                                                marketSwitching: {
                                                                    ...config.marketSwitching,
                                                                    currentMarket: e.target.value,
                                                                },
                                                            })
                                                        }
                                                    >
                                                        {config.marketSwitching.availableMarkets.map(market => (
                                                            <option key={market} value={market}>
                                                                {formatMarketName(market)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                            </div>

                                            <div className='setting-group'>
                                                <label>
                                                    <span>Switch After Losses:</span>
                                                    <input
                                                        type='range'
                                                        min='2'
                                                        max='10'
                                                        value={config.marketSwitching.switchAfterLosses}
                                                        onChange={e =>
                                                            handleConfigChange({
                                                                marketSwitching: {
                                                                    ...config.marketSwitching,
                                                                    switchAfterLosses: parseInt(e.target.value),
                                                                },
                                                            })
                                                        }
                                                    />
                                                    <span className='value'>{config.marketSwitching.switchAfterLosses}</span>
                                                </label>
                                            </div>

                                            <div className='setting-group'>
                                                <label>
                                                    <span>Market Rotation Strategy:</span>
                                                    <select
                                                        value={config.marketSwitching.marketRotation}
                                                        onChange={e =>
                                                            handleConfigChange({
                                                                marketSwitching: {
                                                                    ...config.marketSwitching,
                                                                    marketRotation: e.target.value as any,
                                                                },
                                                            })
                                                        }
                                                    >
                                                        <option value='sequential'>Sequential (Round Robin)</option>
                                                        <option value='performance'>Performance-Based (Best Win Rate)</option>
                                                        <option value='random'>Random Selection</option>
                                                    </select>
                                                </label>
                                            </div>

                                            <div className='setting-group'>
                                                <label className='checkbox-label'>
                                                    <input
                                                        type='checkbox'
                                                        checked={config.marketSwitching.excludePoorPerformers}
                                                        onChange={e =>
                                                            handleConfigChange({
                                                                marketSwitching: {
                                                                    ...config.marketSwitching,
                                                                    excludePoorPerformers: e.target.checked,
                                                                },
                                                            })
                                                        }
                                                    />
                                                    <span>Exclude Poor Performing Markets</span>
                                                </label>
                                            </div>

                                            {config.marketSwitching.excludePoorPerformers && (
                                                <div className='setting-group'>
                                                    <label>
                                                        <span>Minimum Win Rate Threshold:</span>
                                                        <input
                                                            type='range'
                                                            min='20'
                                                            max='60'
                                                            value={config.marketSwitching.minWinRateThreshold}
                                                            onChange={e =>
                                                                handleConfigChange({
                                                                    marketSwitching: {
                                                                        ...config.marketSwitching,
                                                                        minWinRateThreshold: parseInt(e.target.value),
                                                                    },
                                                                })
                                                            }
                                                        />
                                                        <span className='value'>{config.marketSwitching.minWinRateThreshold}%</span>
                                                    </label>
                                                </div>
                                            )}

                                            <div className='auto-bot-loader-panel__market-performance'>
                                                <h4>Market Performance</h4>
                                                <div className='market-stats'>
                                                    {Object.entries(stats.marketPerformance || {}).map(([market, perf]: [string, any]) => (
                                                        <div key={market} className='market-stat-card'>
                                                            <div className='market-name'>{formatMarketName(market)}</div>
                                                            <div className='market-metrics'>
                                                                <div className='metric'>
                                                                    <span className='label'>Trades:</span>
                                                                    <span className='value'>{perf.trades}</span>
                                                                </div>
                                                                <div className='metric'>
                                                                    <span className='label'>Win Rate:</span>
                                                                    <span className={`value ${perf.winRate >= 50 ? 'win' : 'loss'}`}>
                                                                        {perf.winRate.toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                                <div className='metric'>
                                                                    <span className='label'>P/L:</span>
                                                                    <span className={`value ${perf.profitLoss >= 0 ? 'win' : 'loss'}`}>
                                                                        {formatCurrency(perf.profitLoss)}
                                                                    </span>
                                                                </div>
                                                                <div className='metric'>
                                                                    <span className='label'>Loss Streak:</span>
                                                                    <span className='value'>{perf.consecutiveLosses}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {Object.keys(stats.marketPerformance || {}).length === 0 && (
                                                        <div className='no-data'>No market performance data yet</div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {activeTab === 'premium' && (
                                <div className='tab-panel'>
                                    <h4>
                                        <DiamondIcon size={20} /> Premium Features
                                    </h4>

                                    <div className='premium-section'>
                                        <div className='premium-feature'>
                                            <div className='feature-header'>
                                                <span className='feature-icon'>
                                                    <LightningIcon size={18} />
                                                </span>
                                                <span className='feature-title'>Priority Bot Loading</span>
                                                <label className='toggle-switch'>
                                                    <input
                                                        type='checkbox'
                                                        checked={config.premiumFeatures.priorityLoading}
                                                        onChange={e =>
                                                            handleConfigChange({
                                                                premiumFeatures: {
                                                                    ...config.premiumFeatures,
                                                                    priorityLoading: e.target.checked,
                                                                },
                                                            })
                                                        }
                                                    />
                                                    <span className='slider'></span>
                                                </label>
                                            </div>
                                            <p className='feature-description'>
                                                Load bots faster than standard users with priority queue access
                                            </p>
                                        </div>

                                        <div className='premium-feature'>
                                            <div className='feature-header'>
                                                <span className='feature-icon'>
                                                    <ChartIcon size={18} />
                                                </span>
                                                <span className='feature-title'>Advanced Backtesting</span>
                                                <label className='toggle-switch'>
                                                    <input
                                                        type='checkbox'
                                                        checked={config.premiumFeatures.advancedBacktesting}
                                                        onChange={e =>
                                                            handleConfigChange({
                                                                premiumFeatures: {
                                                                    ...config.premiumFeatures,
                                                                    advancedBacktesting: e.target.checked,
                                                                },
                                                            })
                                                        }
                                                    />
                                                    <span className='slider'></span>
                                                </label>
                                            </div>
                                            <p className='feature-description'>
                                                Access historical data analysis and strategy optimization tools
                                            </p>
                                        </div>

                                        <div className='premium-feature'>
                                            <div className='feature-header'>
                                                <span className='feature-icon'>
                                                    <ToolIcon size={18} />
                                                </span>
                                                <span className='feature-title'>Custom Strategy Builder</span>
                                                <label className='toggle-switch'>
                                                    <input
                                                        type='checkbox'
                                                        checked={config.premiumFeatures.customStrategies}
                                                        onChange={e =>
                                                            handleConfigChange({
                                                                premiumFeatures: {
                                                                    ...config.premiumFeatures,
                                                                    customStrategies: e.target.checked,
                                                                },
                                                            })
                                                        }
                                                    />
                                                    <span className='slider'></span>
                                                </label>
                                            </div>
                                            <p className='feature-description'>
                                                Create and customize your own trading strategies with visual builder
                                            </p>
                                        </div>

                                        <div className='premium-feature'>
                                            <div className='feature-header'>
                                                <span className='feature-icon'>
                                                    <DiamondIcon size={18} />
                                                </span>
                                                <span className='feature-title'>VIP Signal Access</span>
                                                <label className='toggle-switch'>
                                                    <input
                                                        type='checkbox'
                                                        checked={config.premiumFeatures.vipAccess}
                                                        onChange={e =>
                                                            handleConfigChange({
                                                                premiumFeatures: {
                                                                    ...config.premiumFeatures,
                                                                    vipAccess: e.target.checked,
                                                                },
                                                            })
                                                        }
                                                    />
                                                    <span className='slider'></span>
                                                </label>
                                            </div>
                                            <p className='feature-description'>
                                                Exclusive access to premium signals with higher accuracy rates
                                            </p>
                                        </div>
                                    </div>

                                    <div className='premium-stats'>
                                        <h5>Premium Benefits Active</h5>
                                        <div className='benefit-list'>
                                            {config.premiumFeatures.priorityLoading && (
                                                <div className='benefit'>
                                                    <LightningIcon size={16} /> Priority Loading
                                                </div>
                                            )}
                                            {config.premiumFeatures.advancedBacktesting && (
                                                <div className='benefit'>
                                                    <ChartIcon size={16} /> Advanced Analytics
                                                </div>
                                            )}
                                            {config.premiumFeatures.customStrategies && (
                                                <div className='benefit'>
                                                    <ToolIcon size={16} /> Custom Strategies
                                                </div>
                                            )}
                                            {config.premiumFeatures.vipAccess && (
                                                <div className='benefit'>
                                                    <DiamondIcon size={16} /> VIP Signals
                                                </div>
                                            )}
                                            {!Object.values(config.premiumFeatures).some(Boolean) && (
                                                <div className='no-benefits'>No premium features enabled</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
