import React, { useState, useEffect } from 'react';
import {
    strategyOrchestrator,
    Strategy,
    Signal,
    OrchestratorState,
    ActiveSymbol,
} from '@/services/strategy-orchestrator.service';
import SmartTradingCards from './SmartTradingCards';
import MarketRotationCard from './MarketRotationCard';
import {
    GearIcon,
    ClockIcon,
    CheckIcon,
    CrossIcon,
    ChartIcon,
    CogwheelIcon,
    BoltIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    TargetIcon,
    SpinnerIcon,
} from './MechanicalIcons';
import './StrategyOrchestrator.scss';

// Fallback symbols if API is unavailable
const FALLBACK_SYMBOLS = [
    'R_10',
    'R_25',
    'R_50',
    'R_75',
    'R_100',
    '1HZ10V',
    '1HZ25V',
    '1HZ50V',
    '1HZ75V',
    '1HZ100V',
    '1HZ150V',
    '1HZ200V',
    '1HZ300V',
];

const StrategyOrchestrator: React.FC = () => {
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [orchestratorState, setOrchestratorState] = useState<OrchestratorState | null>(null);
    const [recentSignals, setRecentSignals] = useState<Signal[]>([]);
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
    const [performanceSummary, setPerformanceSummary] = useState<any>(null);

    // Market Analyzer state
    const [analyzerStatus, setAnalyzerStatus] = useState<any>(null);
    const [currentPrice, setCurrentPrice] = useState<string>('');
    const [selectedSymbol, setSelectedSymbol] = useState<string>('R_10');
    const [tickCount, setTickCount] = useState<number>(120);
    const [barrier, setBarrier] = useState<number>(5);
    const [availableSymbols, setAvailableSymbols] = useState<ActiveSymbol[]>([]);
    const [symbolsLoading, setSymbolsLoading] = useState<boolean>(false);

    useEffect(() => {
        // Load initial data
        loadData();
        loadAnalyzerStatus();

        // Fetch active symbols from Deriv API
        setSymbolsLoading(true);
        strategyOrchestrator.fetchActiveSymbols().finally(() => setSymbolsLoading(false));

        // Set up event listeners
        strategyOrchestrator.on('strategy:activated', loadData);
        strategyOrchestrator.on('strategy:deactivated', loadData);
        strategyOrchestrator.on('strategy:started', loadData);
        strategyOrchestrator.on('strategy:stopped', loadData);
        strategyOrchestrator.on('performance:updated', loadData);
        strategyOrchestrator.on('signal:added', handleSignalAdded);
        strategyOrchestrator.on('orchestrator:started', loadData);
        strategyOrchestrator.on('orchestrator:stopped', loadData);
        strategyOrchestrator.on('analyzer:status', handleAnalyzerStatus);
        strategyOrchestrator.on('analyzer:price', handlePriceUpdate);
        strategyOrchestrator.on('symbols:loaded', handleSymbolsLoaded);

        // Poll analyzer status
        const statusInterval = setInterval(loadAnalyzerStatus, 2000);

        return () => {
            strategyOrchestrator.off('strategy:activated', loadData);
            strategyOrchestrator.off('strategy:deactivated', loadData);
            strategyOrchestrator.off('strategy:started', loadData);
            strategyOrchestrator.off('strategy:stopped', loadData);
            strategyOrchestrator.off('performance:updated', loadData);
            strategyOrchestrator.off('signal:added', handleSignalAdded);
            strategyOrchestrator.off('orchestrator:started', loadData);
            strategyOrchestrator.off('orchestrator:stopped', loadData);
            strategyOrchestrator.off('analyzer:status', handleAnalyzerStatus);
            strategyOrchestrator.off('analyzer:price', handlePriceUpdate);
            strategyOrchestrator.off('symbols:loaded', handleSymbolsLoaded);
            clearInterval(statusInterval);
        };
    }, []);

    const loadData = () => {
        setStrategies(strategyOrchestrator.getStrategies());
        setOrchestratorState(strategyOrchestrator.getState());
        setPerformanceSummary(strategyOrchestrator.getPerformanceSummary());
    };

    const loadAnalyzerStatus = () => {
        const status = strategyOrchestrator.getAnalyzerStatus();
        setAnalyzerStatus(status);
    };

    const handleSignalAdded = (signal: Signal) => {
        setRecentSignals(prev => [signal, ...prev].slice(0, 10));
    };

    const handleAnalyzerStatus = (status: any) => {
        setAnalyzerStatus(status);
    };

    const handlePriceUpdate = (data: any) => {
        setCurrentPrice(data.price);
    };

    const handleSymbolsLoaded = (symbols: ActiveSymbol[]) => {
        setAvailableSymbols(symbols);
        setSymbolsLoading(false);
    };

    const handleSymbolChange = (symbol: string) => {
        setSelectedSymbol(symbol);
        strategyOrchestrator.updateAnalyzerSymbol(symbol);
    };

    const handleTickCountChange = (count: number) => {
        setTickCount(count);
        strategyOrchestrator.updateAnalyzerTickCount(count);
    };

    const handleBarrierChange = (newBarrier: number) => {
        setBarrier(newBarrier);
        strategyOrchestrator.updateAnalyzerBarrier(newBarrier);
    };

    const handleStartOrchestrator = () => {
        strategyOrchestrator.start();
    };

    const handleStopOrchestrator = () => {
        strategyOrchestrator.stop();
    };

    const handleActivateStrategy = (strategyId: string) => {
        strategyOrchestrator.activateStrategy(strategyId);
    };

    const handleDeactivateStrategy = (strategyId: string) => {
        strategyOrchestrator.deactivateStrategy(strategyId);
    };

    const handleStartStrategy = (strategyId: string) => {
        strategyOrchestrator.startStrategy(strategyId);
    };

    const handleStopStrategy = (strategyId: string) => {
        strategyOrchestrator.stopStrategy(strategyId);
    };

    const handleLoadBot = (strategy: Strategy) => {
        // Emit event to load bot in Bot Builder
        window.dispatchEvent(
            new CustomEvent('load.bot.file', {
                detail: { botFile: strategy.botFile, strategy },
            })
        );
    };

    const getRiskLevelColor = (level: string) => {
        switch (level) {
            case 'low':
                return '#10b981';
            case 'medium':
                return '#f59e0b';
            case 'high':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const getStrategyTypeIcon = (type: string) => {
        switch (type) {
            case 'rise-fall':
                return <ArrowUpIcon size={20} />;
            case 'even-odd':
                return <TargetIcon size={20} />;
            case 'over-under':
                return <TargetIcon size={20} />;
            case 'matches-differs':
                return <ChartIcon size={20} />;
            case 'accumulator':
                return <ChartIcon size={20} />;
            case 'martingale':
                return <CogwheelIcon size={20} />;
            default:
                return <GearIcon size={20} />;
        }
    };

    return (
        <div className='strategy-orchestrator'>
            {/* Header */}
            <div className='orchestrator-header'>
                <div className='header-content'>
                    <h1 className='header-title'>
                        <CogwheelIcon size={32} className='title-icon' />
                        Strategy Orchestrator
                    </h1>
                    <p className='header-subtitle'>Intelligent coordination of trading strategies and signals</p>
                </div>

                <div className='header-controls'>
                    {orchestratorState?.isActive ? (
                        <button className='control-btn stop-btn' onClick={handleStopOrchestrator}>
                            <CrossIcon size={18} className='btn-icon' />
                            Stop Orchestrator
                        </button>
                    ) : (
                        <button className='control-btn start-btn' onClick={handleStartOrchestrator}>
                            <BoltIcon size={18} className='btn-icon' />
                            Start Orchestrator
                        </button>
                    )}
                </div>
            </div>

            {/* Performance Summary */}
            {performanceSummary && (
                <div className='performance-summary'>
                    <div className='summary-card'>
                        <CogwheelIcon size={24} className='card-icon' />
                        <div className='card-content'>
                            <div className='card-label'>Total Profit</div>
                            <div
                                className={`card-value ${performanceSummary.totalProfit >= 0 ? 'positive' : 'negative'}`}
                            >
                                ${performanceSummary.totalProfit.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className='summary-card'>
                        <ChartIcon size={24} className='card-icon' />
                        <div className='card-content'>
                            <div className='card-label'>Total Trades</div>
                            <div className='card-value'>{performanceSummary.totalTrades}</div>
                        </div>
                    </div>

                    <div className='summary-card'>
                        <TargetIcon size={24} className='card-icon' />
                        <div className='card-content'>
                            <div className='card-label'>Win Rate</div>
                            <div className='card-value'>{performanceSummary.overallWinRate.toFixed(1)}%</div>
                        </div>
                    </div>

                    <div className='summary-card'>
                        <BoltIcon size={24} className='card-icon' />
                        <div className='card-content'>
                            <div className='card-label'>Active Strategies</div>
                            <div className='card-value'>{orchestratorState?.activeStrategies.length || 0}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Market Analyzer Section */}
            <div className='market-analyzer-section'>
                <div className='section-header'>
                    <h2 className='section-title'>
                        <SpinnerIcon size={24} className='title-icon' />
                        Market Analyzer
                    </h2>
                    <div className='analyzer-status'>
                        {analyzerStatus?.connected ? (
                            <span className='status-indicator connected'>
                                <CheckIcon size={16} className='status-icon' />
                                Connected
                            </span>
                        ) : (
                            <span className='status-indicator disconnected'>
                                <CrossIcon size={16} className='status-icon' />
                                Disconnected
                            </span>
                        )}
                    </div>
                </div>

                <div className='analyzer-controls'>
                    <div className='control-group'>
                        <label className='control-label'>Symbol</label>
                        <select
                            className='control-select'
                            value={selectedSymbol}
                            onChange={e => handleSymbolChange(e.target.value)}
                            disabled={symbolsLoading}
                        >
                            {symbolsLoading && <option value=''>Loading symbols...</option>}
                            {availableSymbols.length > 0
                                ? availableSymbols.map(s => (
                                      <option key={s.symbol} value={s.symbol}>
                                          {s.display_name || s.symbol}
                                      </option>
                                  ))
                                : FALLBACK_SYMBOLS.map(symbol => (
                                      <option key={symbol} value={symbol}>
                                          {symbol}
                                      </option>
                                  ))}
                        </select>
                    </div>

                    <div className='control-group'>
                        <label className='control-label'>Tick Count</label>
                        <select
                            className='control-select'
                            value={tickCount}
                            onChange={e => handleTickCountChange(Number(e.target.value))}
                        >
                            <option value={55}>55 ticks</option>
                            <option value={120}>120 ticks</option>
                            <option value={255}>255 ticks</option>
                        </select>
                    </div>

                    <div className='control-group'>
                        <label className='control-label'>Over/Under Barrier</label>
                        <select
                            className='control-select'
                            value={barrier}
                            onChange={e => handleBarrierChange(Number(e.target.value))}
                        >
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <option key={num} value={num}>
                                    {num}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='control-group'>
                        <label className='control-label'>Current Price</label>
                        <div className='price-display'>{currentPrice || analyzerStatus?.symbol || '--'}</div>
                    </div>

                    <div className='control-group'>
                        <label className='control-label'>Ticks Collected</label>
                        <div className='ticks-display'>
                            {analyzerStatus?.ticksCollected || 0} / {analyzerStatus?.tickCount || 0}
                        </div>
                    </div>
                </div>

                <div className='analyzer-info'>
                    <div className='info-item'>
                        <GearIcon size={18} className='info-icon' />
                        <span className='info-text'>
                            The market analyzer continuously monitors tick data and generates trading signals based on
                            real-time analysis.
                        </span>
                    </div>
                </div>
            </div>

            {/* Smart Trading Cards */}
            <div className='smart-trading-section'>
                <div className='section-header'>
                    <h2 className='section-title'>
                        <TargetIcon size={24} className='title-icon' />
                        Smart Trading
                    </h2>
                </div>
                <SmartTradingCards />
            </div>

            {/* Market Rotation Card */}
            <div className='market-rotation-section'>
                <MarketRotationCard />
            </div>

            {/* Main Content */}
            <div className='orchestrator-content'>
                {/* Strategies List */}
                <div className='strategies-section'>
                    <div className='section-header'>
                        <h2 className='section-title'>
                            <GearIcon size={24} className='title-icon' />
                            Available Strategies
                        </h2>
                        <span className='strategy-count'>{strategies.length} strategies</span>
                    </div>

                    <div className='strategies-grid'>
                        {strategies.map(strategy => (
                            <div
                                key={strategy.id}
                                className={`strategy-card ${strategy.isActive ? 'active' : ''} ${strategy.isRunning ? 'running' : ''}`}
                                onClick={() => setSelectedStrategy(strategy)}
                            >
                                <div className='card-header'>
                                    <div className='strategy-info'>
                                        <span className='strategy-icon'>{getStrategyTypeIcon(strategy.type)}</span>
                                        <div className='strategy-details'>
                                            <h3 className='strategy-name'>{strategy.name}</h3>
                                            <span className='strategy-type'>{strategy.type}</span>
                                        </div>
                                    </div>

                                    <div className='strategy-status'>
                                        {strategy.isRunning && <span className='status-badge running'>Running</span>}
                                        {strategy.isActive && !strategy.isRunning && (
                                            <span className='status-badge active'>Active</span>
                                        )}
                                        {!strategy.isActive && <span className='status-badge inactive'>Inactive</span>}
                                    </div>
                                </div>

                                <div className='card-stats'>
                                    <div className='stat-item'>
                                        <span className='stat-label'>Win Rate</span>
                                        <span className='stat-value'>{strategy.performance.winRate.toFixed(1)}%</span>
                                    </div>
                                    <div className='stat-item'>
                                        <span className='stat-label'>Trades</span>
                                        <span className='stat-value'>{strategy.performance.totalTrades}</span>
                                    </div>
                                    <div className='stat-item'>
                                        <span className='stat-label'>Profit</span>
                                        <span
                                            className={`stat-value ${strategy.performance.profit >= 0 ? 'positive' : 'negative'}`}
                                        >
                                            ${strategy.performance.profit.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className='card-settings'>
                                    <div className='setting-item'>
                                        <span className='setting-label'>Stake:</span>
                                        <span className='setting-value'>${strategy.settings.initialStake}</span>
                                    </div>
                                    <div className='setting-item'>
                                        <span className='setting-label'>Risk:</span>
                                        <span
                                            className='setting-value risk-badge'
                                            style={{ color: getRiskLevelColor(strategy.settings.riskLevel) }}
                                        >
                                            {strategy.settings.riskLevel}
                                        </span>
                                    </div>
                                    <div className='setting-item'>
                                        <span className='setting-label'>Min Confidence:</span>
                                        <span className='setting-value'>{strategy.settings.minConfidence}%</span>
                                    </div>
                                </div>

                                <div className='card-actions'>
                                    {!strategy.isActive ? (
                                        <button
                                            className='action-btn activate-btn'
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleActivateStrategy(strategy.id);
                                            }}
                                        >
                                            Activate
                                        </button>
                                    ) : (
                                        <>
                                            {!strategy.isRunning ? (
                                                <button
                                                    className='action-btn start-btn'
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleStartStrategy(strategy.id);
                                                    }}
                                                >
                                                    Start
                                                </button>
                                            ) : (
                                                <button
                                                    className='action-btn stop-btn'
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleStopStrategy(strategy.id);
                                                    }}
                                                >
                                                    Stop
                                                </button>
                                            )}
                                            <button
                                                className='action-btn deactivate-btn'
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleDeactivateStrategy(strategy.id);
                                                }}
                                            >
                                                Deactivate
                                            </button>
                                        </>
                                    )}
                                    <button
                                        className='action-btn load-btn'
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleLoadBot(strategy);
                                        }}
                                    >
                                        Load Bot
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Signals */}
                <div className='signals-section'>
                    <div className='section-header'>
                        <h2 className='section-title'>
                            <SpinnerIcon size={24} className='title-icon' />
                            Recent Signals
                        </h2>
                    </div>

                    <div className='signals-list'>
                        {recentSignals.length === 0 ? (
                            <div className='empty-state'>
                                <ClockIcon size={48} className='empty-icon' />
                                <p>No signals received yet</p>
                                <p className='empty-hint'>Signals will appear here when the orchestrator is active</p>
                            </div>
                        ) : (
                            recentSignals.map(signal => (
                                <div key={signal.id} className='signal-item'>
                                    <div className='signal-source'>{signal.source}</div>
                                    <div className='signal-symbol'>{signal.symbol}</div>
                                    <div className={`signal-prediction ${signal.prediction.toLowerCase()}`}>
                                        {signal.prediction}
                                    </div>
                                    <div className='signal-confidence'>
                                        <div className='confidence-bar'>
                                            <div
                                                className='confidence-fill'
                                                style={{ width: `${signal.confidence}%` }}
                                            />
                                        </div>
                                        <span className='confidence-value'>{signal.confidence}%</span>
                                    </div>
                                    <div className='signal-time'>{new Date(signal.timestamp).toLocaleTimeString()}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Strategy Details Modal */}
            {selectedStrategy && (
                <div className='strategy-modal-overlay' onClick={() => setSelectedStrategy(null)}>
                    <div className='strategy-modal' onClick={e => e.stopPropagation()}>
                        <div className='modal-header'>
                            <h2>{selectedStrategy.name}</h2>
                            <button className='close-btn' onClick={() => setSelectedStrategy(null)}>
                                ×
                            </button>
                        </div>

                        <div className='modal-content'>
                            <div className='detail-section'>
                                <h3>Performance</h3>
                                <div className='detail-grid'>
                                    <div className='detail-item'>
                                        <span className='detail-label'>Total Trades:</span>
                                        <span className='detail-value'>{selectedStrategy.performance.totalTrades}</span>
                                    </div>
                                    <div className='detail-item'>
                                        <span className='detail-label'>Wins:</span>
                                        <span className='detail-value positive'>
                                            {selectedStrategy.performance.wins}
                                        </span>
                                    </div>
                                    <div className='detail-item'>
                                        <span className='detail-label'>Losses:</span>
                                        <span className='detail-value negative'>
                                            {selectedStrategy.performance.losses}
                                        </span>
                                    </div>
                                    <div className='detail-item'>
                                        <span className='detail-label'>Win Rate:</span>
                                        <span className='detail-value'>
                                            {selectedStrategy.performance.winRate.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className='detail-item'>
                                        <span className='detail-label'>Total Profit:</span>
                                        <span
                                            className={`detail-value ${selectedStrategy.performance.profit >= 0 ? 'positive' : 'negative'}`}
                                        >
                                            ${selectedStrategy.performance.profit.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className='detail-section'>
                                <h3>Settings</h3>
                                <div className='detail-grid'>
                                    <div className='detail-item'>
                                        <span className='detail-label'>Initial Stake:</span>
                                        <span className='detail-value'>${selectedStrategy.settings.initialStake}</span>
                                    </div>
                                    <div className='detail-item'>
                                        <span className='detail-label'>Martingale Multiplier:</span>
                                        <span className='detail-value'>
                                            {selectedStrategy.settings.martingaleMultiplier}x
                                        </span>
                                    </div>
                                    <div className='detail-item'>
                                        <span className='detail-label'>Max Loss Streak:</span>
                                        <span className='detail-value'>{selectedStrategy.settings.maxLossStreak}</span>
                                    </div>
                                    <div className='detail-item'>
                                        <span className='detail-label'>Min Confidence:</span>
                                        <span className='detail-value'>{selectedStrategy.settings.minConfidence}%</span>
                                    </div>
                                    <div className='detail-item'>
                                        <span className='detail-label'>Auto Start:</span>
                                        <span className='detail-value'>
                                            {selectedStrategy.settings.autoStart ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div className='detail-item'>
                                        <span className='detail-label'>Risk Level:</span>
                                        <span
                                            className='detail-value'
                                            style={{ color: getRiskLevelColor(selectedStrategy.settings.riskLevel) }}
                                        >
                                            {selectedStrategy.settings.riskLevel}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className='detail-section'>
                                <h3>Bot Information</h3>
                                <div className='detail-grid'>
                                    <div className='detail-item'>
                                        <span className='detail-label'>Bot File:</span>
                                        <span className='detail-value'>{selectedStrategy.botFile}</span>
                                    </div>
                                    <div className='detail-item'>
                                        <span className='detail-label'>Strategy Type:</span>
                                        <span className='detail-value'>{selectedStrategy.type}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StrategyOrchestrator;
