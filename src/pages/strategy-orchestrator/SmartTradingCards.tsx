import React, { useState, useEffect, useRef, useCallback } from 'react';
import { marketAnalyzer, AnalysisResult } from '@/services/market-analyzer.service';
import { smartTradingExecutor, SmartTradeConfig, TradeHistory } from '@/services/smart-trading-executor.service';
import { autoTradingMonitor, MonitorCondition } from '@/services/auto-trading-monitor.service';
import {
    CheckIcon,
    CrossIcon,
    ClockIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ChartIcon,
    CogwheelIcon,
    BoltIcon,
} from './MechanicalIcons';
import './SmartTradingCards.scss';

interface TradingCondition {
    enabled: boolean;
    lastNTicks: number;
    targetValue: string;
    comparison: string;
    threshold: number;
}

interface TradingSettings {
    stake: number;
    ticks: number;
    martingale: number;
}

const SmartTradingCards: React.FC = () => {
    // Load settings from localStorage
    const loadSettings = () => {
        try {
            const saved = localStorage.getItem('smart_trading_settings');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        return null;
    };

    const savedSettings = loadSettings();

    // Over/Under state
    const [overUnderBarrier, setOverUnderBarrier] = useState(savedSettings?.overUnderBarrier ?? 5);
    const [overProb, setOverProb] = useState(0);
    const [underProb, setUnderProb] = useState(0);
    const [overUnderCondition, setOverUnderCondition] = useState<TradingCondition>(
        savedSettings?.overUnderCondition ?? {
            enabled: false,
            lastNTicks: 3,
            targetValue: 'Over',
            comparison: '>',
            threshold: 55,
        }
    );
    const [overUnderSettings, setOverUnderSettings] = useState<TradingSettings>(
        savedSettings?.overUnderSettings ?? {
            stake: 0.5,
            ticks: 1,
            martingale: 1,
        }
    );
    const [overUnderActive, setOverUnderActive] = useState(savedSettings?.overUnderActive ?? false);
    const [overUnderAutoMode, setOverUnderAutoMode] = useState<'auto-stop' | 'auto-continue' | null>(
        savedSettings?.overUnderAutoMode ?? null
    );
    const [overUnderBotRunning, setOverUnderBotRunning] = useState(false);
    const [overUnderBotLoading, setOverUnderBotLoading] = useState(false);

    // Refs — keep latest values accessible inside event callbacks without stale closures
    const overUnderActiveRef = useRef(false);
    const overUnderBotRunningRef = useRef(false);
    const overUnderBotLoadingRef = useRef(false);
    const overUnderConditionRef = useRef(overUnderCondition);
    const overUnderSettingsRef = useRef(overUnderSettings);
    const overUnderBarrierRef = useRef(overUnderBarrier);

    // Even/Odd state
    const [evenProb, setEvenProb] = useState(0);
    const [oddProb, setOddProb] = useState(0);
    const [lastDigitsPattern, setLastDigitsPattern] = useState<string[]>([]);
    const [currentStreak, setCurrentStreak] = useState({ count: 0, type: '' });
    const [evenOddCondition, setEvenOddCondition] = useState<TradingCondition>(
        savedSettings?.evenOddCondition ?? {
            enabled: false,
            lastNTicks: 3,
            targetValue: 'Even',
            comparison: '>=',
            threshold: 55,
        }
    );
    const [evenOddSettings, setEvenOddSettings] = useState<TradingSettings>(
        savedSettings?.evenOddSettings ?? {
            stake: 0.5,
            ticks: 1,
            martingale: 1,
        }
    );
    const [evenOddActive, setEvenOddActive] = useState(savedSettings?.evenOddActive ?? false);
    const [evenOddAutoMode, setEvenOddAutoMode] = useState<'auto-stop' | 'auto-continue' | null>(
        savedSettings?.evenOddAutoMode ?? null
    );

    // Refs for even/odd
    const evenOddActiveRef = useRef(false);
    const evenOddConditionRef = useRef(evenOddCondition);
    const evenOddSettingsRef = useRef(evenOddSettings);
    const lastDigitsPatternRef = useRef<string[]>([]);

    // Recent trades state
    const [recentTrades, setRecentTrades] = useState<TradeHistory[]>([]);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        const settings = {
            overUnderBarrier,
            overUnderCondition,
            overUnderSettings,
            overUnderActive,
            overUnderAutoMode,
            evenOddCondition,
            evenOddSettings,
            evenOddActive,
            evenOddAutoMode,
        };
        localStorage.setItem('smart_trading_settings', JSON.stringify(settings));
    }, [
        overUnderBarrier,
        overUnderCondition,
        overUnderSettings,
        overUnderActive,
        overUnderAutoMode,
        evenOddCondition,
        evenOddSettings,
        evenOddActive,
        evenOddAutoMode,
    ]);
    // Keep monitor in sync when condition settings change while active
    useEffect(() => {
        if (overUnderActiveRef.current) {
            autoTradingMonitor.updateCondition({
                type: 'over-under',
                targetValue: overUnderCondition.targetValue,
                comparison: overUnderCondition.comparison,
                threshold: overUnderCondition.threshold,
            });
        }
    }, [overUnderCondition]);

    useEffect(() => {
        if (evenOddActiveRef.current) {
            autoTradingMonitor.updateCondition({
                type: 'even-odd',
                targetValue: evenOddCondition.targetValue,
                comparison: evenOddCondition.comparison,
                threshold: evenOddCondition.threshold,
                lastNTicks: evenOddCondition.lastNTicks,
            });
        }
    }, [evenOddCondition]);

    // Sync refs whenever state changes so callbacks always read fresh values
    useEffect(() => {
        overUnderActiveRef.current = overUnderActive;
    }, [overUnderActive]);
    useEffect(() => {
        overUnderConditionRef.current = overUnderCondition;
    }, [overUnderCondition]);
    useEffect(() => {
        overUnderSettingsRef.current = overUnderSettings;
    }, [overUnderSettings]);
    useEffect(() => {
        overUnderBarrierRef.current = overUnderBarrier;
    }, [overUnderBarrier]);
    useEffect(() => {
        evenOddActiveRef.current = evenOddActive;
    }, [evenOddActive]);
    useEffect(() => {
        evenOddConditionRef.current = evenOddCondition;
    }, [evenOddCondition]);
    useEffect(() => {
        evenOddSettingsRef.current = evenOddSettings;
    }, [evenOddSettings]);
    useEffect(() => {
        lastDigitsPatternRef.current = lastDigitsPattern;
    }, [lastDigitsPattern]);

    useEffect(() => {
        // Listen to market analyzer analysis results
        const handleAnalysis = (result: AnalysisResult) => {
            if (result.strategyType === 'over-under') {
                setOverProb(parseFloat(result.data.overProbability));
                setUnderProb(parseFloat(result.data.underProbability));
                if (overUnderActiveRef.current) {
                    checkOverUnderCondition(result);
                }
            } else if (result.strategyType === 'even-odd') {
                setEvenProb(parseFloat(result.data.evenProbability));
                setOddProb(parseFloat(result.data.oddProbability));
                const pattern = result.data.evenOddPattern || [];
                setLastDigitsPattern(pattern);
                lastDigitsPatternRef.current = pattern;
                setCurrentStreak({
                    count: result.data.streak || 0,
                    type: result.data.streakType || '',
                });

                if (evenOddActiveRef.current) {
                    checkEvenOddCondition(result);
                }
            }
        };

        // Listen to trade execution events
        const handleTradeExecuted = () => {
            setRecentTrades(smartTradingExecutor.getTradeHistory(5));
        };

        // Listen to monitor bot events to sync running state
        const handleBotStopped = () => {
            overUnderBotRunningRef.current = false;
            setOverUnderBotRunning(false);
            setOverUnderBotLoading(false);
            overUnderBotLoadingRef.current = false;
        };
        const handleBotStarted = () => {
            overUnderBotRunningRef.current = true;
            setOverUnderBotRunning(true);
        };

        marketAnalyzer.on('analysis', handleAnalysis);
        smartTradingExecutor.on('trade-executed', handleTradeExecuted);
        autoTradingMonitor.on('bot:stopped', handleBotStopped);
        autoTradingMonitor.on('bot:started', handleBotStarted);

        setRecentTrades(smartTradingExecutor.getTradeHistory(5));

        return () => {
            marketAnalyzer.off('analysis', handleAnalysis);
            smartTradingExecutor.off('trade-executed', handleTradeExecuted);
            autoTradingMonitor.off('bot:stopped', handleBotStopped);
            autoTradingMonitor.off('bot:started', handleBotStarted);
        };
    }, []); // stable — all state accessed via refs

    // ── Condition helpers (use refs — no stale closure risk) ─────────────────

    const compare = (value: number, op: string, threshold: number): boolean => {
        switch (op) {
            case '>':
                return value > threshold;
            case '>=':
                return value >= threshold;
            case '<':
                return value < threshold;
            case '<=':
                return value <= threshold;
            case '=':
                return Math.abs(value - threshold) < 0.1;
            default:
                return false;
        }
    };

    const checkOverUnderCondition = (result: AnalysisResult) => {
        const condition = overUnderConditionRef.current;
        const settings = overUnderSettingsRef.current;
        const barrier = overUnderBarrierRef.current;

        const overProb = parseFloat(result.data.overProbability);
        const underProb = parseFloat(result.data.underProbability);
        const prob = condition.targetValue === 'Over' ? overProb : underProb;
        const conditionMet = compare(prob, condition.comparison, condition.threshold);

        console.log(
            `[O/U CONDITION] ${condition.targetValue} prob=${prob.toFixed(2)}% ${condition.comparison} ${condition.threshold}% → ${conditionMet ? 'MET ✓' : 'NOT met ✗'}`
        );

        if (!conditionMet) {
            // Stop bot if it's running — check both React ref AND actual bot state
            const actuallyRunning = overUnderBotRunningRef.current || autoTradingMonitor.getBotRunning();
            if (actuallyRunning) {
                console.log('[O/U] Conditions failed — stopping bot');
                setOverUnderAutoMode('auto-stop');
                setOverUnderBotRunning(false);
                setOverUnderBotLoading(false);
                overUnderBotRunningRef.current = false;
                overUnderBotLoadingRef.current = false;
                autoTradingMonitor.stopBot();
            }
            return;
        }

        // Conditions met — start bot if not already running or loading
        if (!overUnderBotRunningRef.current && !overUnderBotLoadingRef.current) {
            console.log('[O/U] Conditions met — loading bot');
            setOverUnderAutoMode('auto-continue');
            setOverUnderBotLoading(true);
            overUnderBotLoadingRef.current = true;

            window.dispatchEvent(
                new CustomEvent('load.bot.file', {
                    detail: {
                        botFile: 'Raziel Over Under.xml',
                        source: 'smart-trading-over-under-condition',
                        autoRun: true,
                        silent: true,
                    },
                })
            );

            // Configure workspace and start after load
            setTimeout(() => {
                try {
                    const workspace = (window as any).Blockly?.derivWorkspace;
                    if (!workspace) {
                        console.error('[O/U] Blockly workspace not found');
                        setOverUnderBotLoading(false);
                        overUnderBotLoadingRef.current = false;
                        return;
                    }

                    const allBlocks = workspace.getAllBlocks();
                    const symbol = marketAnalyzer.getStatus().symbol;

                    const marketBlock = allBlocks.find((b: any) => b.type === 'trade_definition_market');
                    if (marketBlock) marketBlock.setFieldValue(symbol, 'SYMBOL_LIST');

                    const stakeBlock = allBlocks.find((b: any) => b.type === 'trade_definition_tradeoptions');
                    if (stakeBlock) {
                        const numberBlock = stakeBlock.getInput('AMOUNT')?.connection?.targetBlock();
                        if (numberBlock) numberBlock.setFieldValue(settings.stake.toString(), 'NUM');
                    }

                    allBlocks
                        .filter(
                            (b: any) =>
                                b.type === 'trade_definition_tradetype' || b.type === 'trade_definition_contracttype'
                        )
                        .forEach((b: any) => {
                            ['PREDICTION_BEFORE_LOSS', 'PREDICTION_AFTER_LOSS', 'BARRIER', 'PREDICTION'].forEach(
                                field => {
                                    if (b.getField(field)) b.setFieldValue(barrier.toString(), field);
                                }
                            );
                        });

                    console.log('[O/U] Bot configured — starting');
                    autoTradingMonitor.startBot();
                    setOverUnderBotRunning(true);
                    setOverUnderBotLoading(false);
                    overUnderBotRunningRef.current = true;
                    overUnderBotLoadingRef.current = false;
                } catch (err) {
                    console.error('[O/U] Config error:', err);
                    setOverUnderBotLoading(false);
                    overUnderBotLoadingRef.current = false;
                }
            }, 2000);
        }
    };

    const checkEvenOddCondition = (result: AnalysisResult) => {
        const condition = evenOddConditionRef.current;
        const settings = evenOddSettingsRef.current;
        const pattern = lastDigitsPatternRef.current;

        const evenProb = parseFloat(result.data.evenProbability);
        const oddProb = parseFloat(result.data.oddProbability);
        const prob = condition.targetValue === 'Even' ? evenProb : oddProb;
        const probMet = compare(prob, condition.comparison, condition.threshold);

        // Pattern check: last N digits all match target
        const last = pattern.slice(-condition.lastNTicks);
        const target = condition.targetValue === 'Even' ? 'E' : 'O';
        const patternMet = last.length === condition.lastNTicks && last.every(p => p === target);

        const conditionMet = probMet && patternMet;

        console.log(
            `[E/O CONDITION] prob=${prob.toFixed(2)}% patternMet=${patternMet} → ${conditionMet ? 'MET ✓' : 'NOT met ✗'}`
        );

        if (!conditionMet) {
            // Stop bot if running
            if (autoTradingMonitor.getBotState() === 'running') {
                console.log('[E/O] Conditions failed — stopping bot');
                autoTradingMonitor.stopBot();
            }
            return;
        }

        // Fire a trade only when conditions are freshly met
        if (autoTradingMonitor.getBotState() === 'stopped') {
            executeTrade('even-odd', condition.targetValue, settings);
        }
    };

    const executeTrade = async (type: string, prediction: string, settings: TradingSettings) => {
        console.log(`[EXECUTE] ${type} trade:`, {
            prediction,
            stake: settings.stake,
            ticks: settings.ticks,
            martingale: settings.martingale,
        });

        const tradeConfig: SmartTradeConfig = {
            type: type as 'over-under' | 'even-odd',
            prediction,
            settings: {
                ...settings,
                barrier: overUnderBarrier,
            },
            symbol: marketAnalyzer.getStatus().symbol,
        };

        const result = await smartTradingExecutor.executeTrade(tradeConfig);

        if (result.success) {
            console.log('[SUCCESS] Trade executed, contract:', result.contractId);
        } else {
            console.error('[ERROR] Trade failed:', result.error);
        }
    };

    const toggleOverUnderTrading = async () => {
        if (!overUnderActive) {
            const activeLoginId = localStorage.getItem('active_loginid');
            if (!activeLoginId) {
                alert('Please login to Deriv first.');
                return;
            }
            const initialized = await smartTradingExecutor.initialize();
            if (!initialized) {
                alert('Failed to connect to Deriv API. Please make sure you are logged in.');
                return;
            }
            setOverUnderActive(true);
            overUnderActiveRef.current = true;
            setOverUnderAutoMode('auto-stop');

            // Pass condition directly — no localStorage dependency
            const condition: MonitorCondition = {
                type: 'over-under',
                targetValue: overUnderConditionRef.current.targetValue,
                comparison: overUnderConditionRef.current.comparison,
                threshold: overUnderConditionRef.current.threshold,
            };
            console.log('[START] Over/Under Auto Trading — condition:', condition);
            autoTradingMonitor.startMonitoring(condition);
        }
    };

    const handleOverUnderManualStop = () => {
        setOverUnderActive(false);
        overUnderActiveRef.current = false;
        setOverUnderAutoMode(null);
        setOverUnderBotRunning(false);
        setOverUnderBotLoading(false);
        overUnderBotRunningRef.current = false;
        overUnderBotLoadingRef.current = false;
        autoTradingMonitor.stopBot();
        autoTradingMonitor.stopMonitoring();
        console.log('[MANUAL STOP] Over/Under Auto Trading stopped');
    };

    const toggleEvenOddTrading = async () => {
        if (!evenOddActive) {
            const activeLoginId = localStorage.getItem('active_loginid');
            if (!activeLoginId) {
                alert('Please login to Deriv first.');
                return;
            }
            const initialized = await smartTradingExecutor.initialize();
            if (!initialized) {
                alert('Failed to connect to Deriv API. Please make sure you are logged in.');
                return;
            }
            setEvenOddActive(true);
            evenOddActiveRef.current = true;

            const condition: MonitorCondition = {
                type: 'even-odd',
                targetValue: evenOddConditionRef.current.targetValue,
                comparison: evenOddConditionRef.current.comparison,
                threshold: evenOddConditionRef.current.threshold,
                lastNTicks: evenOddConditionRef.current.lastNTicks,
            };
            console.log('[START] Even/Odd Auto Trading — condition:', condition);
            autoTradingMonitor.startMonitoring(condition);
        } else {
            setEvenOddActive(false);
            evenOddActiveRef.current = false;
            autoTradingMonitor.stopBot();
            autoTradingMonitor.stopMonitoring();
            console.log('[STOP] Even/Odd Auto Trading stopped');
        }
    };

    return (
        <div className='smart-trading-cards'>
            {/* Over/Under Card */}
            <div className='trading-card'>
                <div className='card-header'>
                    <h3 className='card-title'>Over/Under</h3>
                </div>

                <div className='card-body'>
                    {/* Barrier Control */}
                    <div className='barrier-control'>
                        <label className='control-label'>
                            <strong>Barrier:</strong>
                            <input
                                type='number'
                                min='0'
                                max='9'
                                value={overUnderBarrier}
                                onChange={e => {
                                    const value = parseInt(e.target.value);
                                    setOverUnderBarrier(value);
                                    marketAnalyzer.updateBarrier(value);
                                }}
                                className='barrier-input'
                            />
                        </label>
                        <p className='barrier-description'>
                            Under: 0-{overUnderBarrier - 1}, Equals: {overUnderBarrier}, Over: {overUnderBarrier + 1}-9
                        </p>
                    </div>

                    {/* Probability Display */}
                    <div className='probability-display'>
                        <div className='prob-item'>
                            <span className='prob-label'>Over</span>
                            <div className='prob-bar over'>
                                <div className='prob-fill' style={{ width: `${overProb}%` }}>
                                    <span className='prob-value'>{overProb.toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>
                        <div className='prob-item'>
                            <span className='prob-label'>Under</span>
                            <div className='prob-bar under'>
                                <div className='prob-fill' style={{ width: `${underProb}%` }}>
                                    <span className='prob-value'>{underProb.toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trading Condition */}
                    <div className='trading-condition'>
                        <h4 className='condition-title'>Trading Condition</h4>

                        <div className='condition-row'>
                            <span className='condition-label'>If</span>
                            <select
                                className='condition-select'
                                value={overUnderCondition.targetValue}
                                onChange={e =>
                                    setOverUnderCondition({ ...overUnderCondition, targetValue: e.target.value })
                                }
                            >
                                <option value='Over'>Over Prob</option>
                                <option value='Under'>Under Prob</option>
                            </select>
                            <select
                                className='condition-select small'
                                value={overUnderCondition.comparison}
                                onChange={e =>
                                    setOverUnderCondition({ ...overUnderCondition, comparison: e.target.value })
                                }
                            >
                                <option value='>'>&gt;</option>
                                <option value='>='>&gt;=</option>
                                <option value='<'>&lt;</option>
                                <option value='<='>&lt;=</option>
                                <option value='='>=</option>
                            </select>
                            <input
                                type='number'
                                className='condition-input'
                                value={overUnderCondition.threshold}
                                onChange={e =>
                                    setOverUnderCondition({
                                        ...overUnderCondition,
                                        threshold: parseFloat(e.target.value),
                                    })
                                }
                            />
                            <span className='condition-unit'>%</span>
                        </div>
                    </div>

                    {/* Trading Settings */}
                    <div className='trading-settings'>
                        <div className='setting-group'>
                            <label className='setting-label'>Stake</label>
                            <input
                                type='number'
                                step='0.1'
                                min='0.1'
                                value={overUnderSettings.stake}
                                onChange={e =>
                                    setOverUnderSettings({ ...overUnderSettings, stake: parseFloat(e.target.value) })
                                }
                                className='setting-input'
                            />
                        </div>
                        <div className='setting-group'>
                            <label className='setting-label'>Ticks</label>
                            <input
                                type='number'
                                min='1'
                                value={overUnderSettings.ticks}
                                onChange={e =>
                                    setOverUnderSettings({ ...overUnderSettings, ticks: parseInt(e.target.value) })
                                }
                                className='setting-input'
                            />
                        </div>
                        <div className='setting-group'>
                            <label className='setting-label'>Martingale</label>
                            <input
                                type='number'
                                step='0.1'
                                min='1'
                                value={overUnderSettings.martingale}
                                onChange={e =>
                                    setOverUnderSettings({
                                        ...overUnderSettings,
                                        martingale: parseFloat(e.target.value),
                                    })
                                }
                                className='setting-input'
                            />
                        </div>
                    </div>

                    {/* Control Buttons */}
                    {!overUnderActive ? (
                        <button className='start-trading-btn' onClick={toggleOverUnderTrading}>
                            Start Auto Trading
                        </button>
                    ) : (
                        <>
                            <div className='status-indicator'>
                                <span className='status-label'>Status:</span>
                                <span className={`status-value ${overUnderBotRunning ? 'running' : 'paused'}`}>
                                    {overUnderBotRunning ? '🟢 Bot Running' : '🟡 Bot Paused'}
                                </span>
                                <span className='mode-label'>Mode:</span>
                                <span className='mode-value'>
                                    {overUnderAutoMode === 'auto-stop' ? '🔄 Auto Stop' : '▶️ Auto Continue'}
                                </span>
                            </div>
                            <div className='trading-controls'>
                                <button
                                    className={`control-btn ${overUnderAutoMode === 'auto-stop' ? 'active' : ''}`}
                                    onClick={() => {
                                        setOverUnderAutoMode('auto-stop');
                                        if (overUnderBotRunningRef.current) {
                                            setOverUnderBotRunning(false);
                                            overUnderBotRunningRef.current = false;
                                            autoTradingMonitor.stopBot();
                                        }
                                    }}
                                    title='Automatically pause when conditions are bad'
                                >
                                    🔄 Auto Stop
                                </button>
                                <button
                                    className={`control-btn ${overUnderAutoMode === 'auto-continue' ? 'active' : ''}`}
                                    onClick={() => {
                                        setOverUnderAutoMode('auto-continue');
                                        console.log('[MANUAL] Switched to Auto Continue mode');
                                    }}
                                    title='Keep running regardless of conditions'
                                >
                                    ▶️ Auto Continue
                                </button>
                                <button
                                    className='control-btn stop'
                                    onClick={handleOverUnderManualStop}
                                    title='Stop everything and exit auto trading'
                                >
                                    ⏹️ Manual Stop
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Even/Odd Card */}
            <div className='trading-card'>
                <div className='card-header'>
                    <h3 className='card-title'>Even/Odd</h3>
                    <div className='status-indicator'></div>
                </div>

                <div className='card-body'>
                    {/* Last Digits Pattern */}
                    <div className='digits-pattern'>
                        <h4 className='pattern-title'>Last Digits Pattern</h4>
                        <div className='pattern-display'>
                            {lastDigitsPattern.map((digit, index) => (
                                <span key={index} className={`digit-badge ${digit === 'E' ? 'even' : 'odd'}`}>
                                    {digit}
                                </span>
                            ))}
                        </div>
                        <p className='pattern-description'>Recent digit pattern (E=Even, O=Odd)</p>
                        <p className='streak-info'>
                            Current streak:{' '}
                            <strong>
                                {currentStreak.count} {currentStreak.type}
                            </strong>
                        </p>
                    </div>

                    {/* Trading Condition */}
                    <div className='trading-condition'>
                        <h4 className='condition-title'>Trading Condition</h4>

                        <div className='condition-row'>
                            <span className='condition-label'>Check if the last</span>
                            <input
                                type='number'
                                className='condition-input small'
                                value={evenOddCondition.lastNTicks}
                                onChange={e =>
                                    setEvenOddCondition({ ...evenOddCondition, lastNTicks: parseInt(e.target.value) })
                                }
                            />
                            <span className='condition-label'>digits are</span>
                        </div>

                        <div className='condition-row'>
                            <select
                                className='condition-select'
                                value={evenOddCondition.targetValue}
                                onChange={e =>
                                    setEvenOddCondition({ ...evenOddCondition, targetValue: e.target.value })
                                }
                            >
                                <option value='Even'>Even</option>
                                <option value='Odd'>Odd</option>
                            </select>
                        </div>

                        <div className='condition-row'>
                            <span className='condition-label'>Then</span>
                            <select className='condition-select'>
                                <option value='Buy Even'>Buy Even</option>
                                <option value='Buy Odd'>Buy Odd</option>
                            </select>
                        </div>
                    </div>

                    {/* Trading Settings */}
                    <div className='trading-settings'>
                        <div className='setting-group'>
                            <label className='setting-label'>Stake</label>
                            <input
                                type='number'
                                step='0.1'
                                min='0.1'
                                value={evenOddSettings.stake}
                                onChange={e =>
                                    setEvenOddSettings({ ...evenOddSettings, stake: parseFloat(e.target.value) })
                                }
                                className='setting-input'
                            />
                        </div>
                        <div className='setting-group'>
                            <label className='setting-label'>Ticks</label>
                            <input
                                type='number'
                                min='1'
                                value={evenOddSettings.ticks}
                                onChange={e =>
                                    setEvenOddSettings({ ...evenOddSettings, ticks: parseInt(e.target.value) })
                                }
                                className='setting-input'
                            />
                        </div>
                        <div className='setting-group'>
                            <label className='setting-label'>Martingale</label>
                            <input
                                type='number'
                                step='0.1'
                                min='1'
                                value={evenOddSettings.martingale}
                                onChange={e =>
                                    setEvenOddSettings({ ...evenOddSettings, martingale: parseFloat(e.target.value) })
                                }
                                className='setting-input'
                            />
                        </div>
                    </div>

                    {/* Start Button */}
                    <button
                        className={`start-trading-btn ${evenOddActive ? 'active' : ''}`}
                        onClick={toggleEvenOddTrading}
                    >
                        {evenOddActive ? 'Stop Auto Trading' : 'Start Auto Trading'}
                    </button>
                </div>
            </div>

            {/* Recent Trades Section */}
            {recentTrades.length > 0 && (
                <div className='recent-trades-section'>
                    <h3 className='recent-trades-title'>
                        <ChartIcon size={20} />
                        Recent Trades
                        <span className='recent-trades-subtitle'>(View all in Transactions drawer)</span>
                    </h3>
                    <div className='recent-trades-list'>
                        {recentTrades.map((trade, index) => (
                            <div key={trade.id} className={`trade-item ${trade.result}`}>
                                <div className='trade-info'>
                                    <div className='trade-type-wrapper'>
                                        {trade.result === 'win' ? (
                                            <CheckIcon size={16} className='trade-icon win' />
                                        ) : (
                                            <CrossIcon size={16} className='trade-icon loss' />
                                        )}
                                        <span className='trade-type'>{trade.prediction}</span>
                                    </div>
                                    <div className='trade-time-wrapper'>
                                        <ClockIcon size={14} className='trade-clock' />
                                        <span className='trade-time'>
                                            {new Date(trade.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                                <div className='trade-result'>
                                    <div className='trade-profit-wrapper'>
                                        {trade.result === 'win' ? (
                                            <ArrowUpIcon size={16} className='profit-arrow' />
                                        ) : (
                                            <ArrowDownIcon size={16} className='profit-arrow' />
                                        )}
                                        <span className={`trade-profit ${trade.result}`}>
                                            {trade.result === 'win' ? '+' : ''}
                                            {trade.profit.toFixed(2)}
                                        </span>
                                    </div>
                                    <span className='trade-stake'>Stake: ${trade.stake.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className='trades-stats'>
                        <div className='stat-item'>
                            <CogwheelIcon size={18} className='stat-icon' />
                            <span className='stat-label'>Total Trades:</span>
                            <span className='stat-value'>{smartTradingExecutor.getStatistics().totalTrades}</span>
                        </div>
                        <div className='stat-item'>
                            <BoltIcon size={18} className='stat-icon' />
                            <span className='stat-label'>Win Rate:</span>
                            <span className='stat-value'>
                                {smartTradingExecutor.getStatistics().winRate.toFixed(1)}%
                            </span>
                        </div>
                        <div className='stat-item'>
                            {smartTradingExecutor.getStatistics().totalProfit >= 0 ? (
                                <ArrowUpIcon size={18} className='stat-icon positive' />
                            ) : (
                                <ArrowDownIcon size={18} className='stat-icon negative' />
                            )}
                            <span className='stat-label'>Total Profit:</span>
                            <span
                                className={`stat-value ${smartTradingExecutor.getStatistics().totalProfit >= 0 ? 'positive' : 'negative'}`}
                            >
                                ${smartTradingExecutor.getStatistics().totalProfit.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartTradingCards;
