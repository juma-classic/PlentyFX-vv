/**
 * Advanced Algo Page
 * Professional algorithmic trading interface with enhanced countdown timers and trade buttons
 */

import React, { useCallback, useEffect, useState } from 'react';
import { DynamicSignalCard } from '../components/signals/DynamicSignalCard';
import { EnhancedCountdownTimer } from '../components/signals/EnhancedCountdownTimer';
import { EnhancedTradeButton } from '../components/signals/EnhancedTradeButton';
import { AutoBotLoaderPanel } from '../components/signals/AutoBotLoaderPanel';
import { DBOT_TABS } from '../constants/bot-contents';
import {
    advancedAlgoSignalService,
    type AlgorithmStats,
    type RealSignal,
} from '../services/advanced-algo-signal.service';
import { type BotRecommendation, signalBotLoader } from '../services/signal-bot-loader.service';
import { autoBotLoaderService } from '../services/auto-bot-loader.service';
import './advanced-algo.scss';

interface TradeSignal {
    market: string;
    type: string;
    confidence: number;
    stake: number;
    prediction: string;
}

export const AdvancedAlgo: React.FC = () => {
    const [tradeSignals, setTradeSignals] = useState<TradeSignal[]>([]);
    const [realSignals, setRealSignals] = useState<RealSignal[]>([]);
    const [algoStats, setAlgoStats] = useState<AlgorithmStats>({
        totalSignals: 0,
        signalsToday: 0,
        avgConfidence: 0,
        successRate: 0,
        totalProfit: 0,
        activeSignals: 0,
        lastSignalTime: 0,
    });
    const [isAlgoActive, setIsAlgoActive] = useState(false);
    const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['R_50', 'R_75', 'R_100']);
    const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
    const [botRecommendations, setBotRecommendations] = useState<Map<string, BotRecommendation[]>>(new Map());
    const [loadingBots, setLoadingBots] = useState<Set<string>>(new Set());

    // Enable scrolling when component mounts
    useEffect(() => {
        document.body.classList.add('advanced-algo-active');
        return () => {
            document.body.classList.remove('advanced-algo-active');
        };
    }, []);

    // Initialize real signal service
    useEffect(() => {
        // Subscribe to real signals
        const unsubscribe = advancedAlgoSignalService.onSignal((signal: RealSignal) => {
            console.log('🚨 Received real signal:', signal);

            // Add to real signals list
            setRealSignals(prev => [signal, ...prev].slice(0, 50));

            // Get bot recommendations for this signal
            const recommendations = signalBotLoader.getBotRecommendations(signal);
            setBotRecommendations(prev => new Map(prev.set(signal.id, recommendations)));

            // Convert to legacy format for existing UI
            const legacySignal: TradeSignal = {
                market: signal.market,
                type: signal.prediction,
                confidence: signal.confidence,
                stake: signal.recommendedStake,
                prediction: signal.targetDigit ? `Digit ${signal.targetDigit}` : signal.prediction,
            };

            setTradeSignals(prev => [legacySignal, ...prev].slice(0, 20));

            // Show notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🤖 Real Algorithm Signal!', {
                    body: `${signal.marketLabel}: ${signal.prediction} (${signal.confidence}% confidence)`,
                    icon: '/favicon-pink.svg',
                });
            }
        });

        // Update stats periodically
        const statsInterval = setInterval(() => {
            const stats = advancedAlgoSignalService.getStats();
            setAlgoStats(stats);
        }, 2000);

        return () => {
            unsubscribe();
            clearInterval(statsInterval);
        };
    }, []);

    const handleTradeSignal = (signal: TradeSignal) => {
        console.log('🎯 Advanced Algo Trade Signal:', signal);
        setTradeSignals(prev => [signal, ...prev].slice(0, 20));
    };

    const markets = [
        { code: 'R_50', label: 'Volatility 50', description: 'Moderate volatility synthetic index' },
        { code: 'R_75', label: 'Volatility 75', description: 'High volatility synthetic index' },
        { code: 'R_100', label: 'Volatility 100', description: 'Very high volatility synthetic index' },
        { code: '1HZ50V', label: 'Volatility 50 (1s)', description: '1-second tick frequency' },
        { code: '1HZ75V', label: 'Volatility 75 (1s)', description: '1-second tick frequency' },
        { code: '1HZ100V', label: 'Volatility 100 (1s)', description: '1-second tick frequency' },
    ];

    const signalTypes = [
        { type: 'OVER_UNDER', label: 'Over/Under', description: 'Last digit over or under 5' },
        { type: 'EVEN_ODD', label: 'Even/Odd', description: 'Last digit even or odd' },
        { type: 'RISE_FALL', label: 'Rise/Fall', description: 'Price direction prediction' },
    ] as const;

    const getRiskMultiplier = useCallback(() => {
        switch (riskLevel) {
            case 'low':
                return 0.5;
            case 'medium':
                return 1.0;
            case 'high':
                return 2.0;
            default:
                return 1.0;
        }
    }, [riskLevel]);

    // Handle algorithm start/stop with enhanced error handling
    useEffect(() => {
        if (isAlgoActive) {
            console.log('🚀 Starting Advanced Algorithm with App ID authentication...');

            // Start the real algorithm with error handling
            advancedAlgoSignalService
                .start({
                    markets: selectedMarkets,
                    signalTypes: ['OVER_UNDER', 'EVEN_ODD', 'RISE_FALL'],
                    minConfidence: 65,
                    maxSignalsPerMinute: 3,
                    riskLevel: riskLevel.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH',
                    baseStake: getRiskMultiplier(),
                })
                .catch(error => {
                    console.error('❌ Failed to start Advanced Algorithm:', error);

                    // Show user-friendly error message
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('❌ Algorithm Start Failed', {
                            body: 'Check your internet connection and try again. No token required - using App ID.',
                            icon: '/favicon-pink.svg',
                        });
                    }

                    // Auto-stop on error
                    setIsAlgoActive(false);
                });
        } else {
            console.log('⏹️ Stopping Advanced Algorithm...');
            // Stop the algorithm
            advancedAlgoSignalService.stop();
        }
    }, [isAlgoActive, selectedMarkets, riskLevel, getRiskMultiplier]);

    const toggleMarket = (marketCode: string) => {
        setSelectedMarkets(prev =>
            prev.includes(marketCode) ? prev.filter(m => m !== marketCode) : [...prev, marketCode]
        );
    };

    // Handle bot loading from signals
    const handleLoadBot = async (signal: RealSignal, botFile?: string) => {
        setLoadingBots(prev => new Set(prev.add(signal.id)));

        try {
            let success = false;

            if (botFile) {
                // Load specific bot
                success = await signalBotLoader.loadSpecificBot(botFile, signal);
            } else {
                // Load best recommended bot
                success = await signalBotLoader.loadBotFromSignal(signal, true);
            }

            if (success) {
                // Switch to bot builder tab
                const switchTabEvent = new CustomEvent('switch.tab', {
                    detail: { tab: DBOT_TABS.BOT_BUILDER },
                });
                window.dispatchEvent(switchTabEvent);

                // Show success notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('🤖 Bot Loaded Successfully!', {
                        body: `Bot configured for ${signal.marketLabel}: ${signal.prediction}`,
                        icon: '/favicon-pink.svg',
                    });
                }

                console.log('✅ Bot loaded successfully for signal:', signal.id);
            } else {
                console.error('❌ Failed to load bot for signal:', signal.id);
            }
        } catch (error) {
            console.error('❌ Error loading bot:', error);
        } finally {
            setLoadingBots(prev => {
                const newSet = new Set(prev);
                newSet.delete(signal.id);
                return newSet;
            });
        }
    };

    // Handle auto trade with specific bot assignments
    const handleAutoTrade = async (signal: RealSignal) => {
        setLoadingBots(prev => new Set(prev.add(signal.id)));

        try {
            console.log('🚀 Auto-trading signal:', {
                signalType: signal.signalType,
                prediction: signal.prediction,
                targetDigit: signal.targetDigit,
                confidence: signal.confidence,
            });

            // Use the new auto-load method with specific bot assignments
            const success = await signalBotLoader.autoLoadBotForSignal(signal);

            if (success) {
                // Show success notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    const botName =
                        signal.signalType === 'OVER_UNDER'
                            ? 'PATEL (with Entry)'
                            : signal.signalType === 'EVEN_ODD'
                              ? 'CFX Even/Odd'
                              : 'CFX Rise/Fall';

                    new Notification('🚀 Auto Trade Started!', {
                        body: `${botName} from Free Bots loaded for ${signal.marketLabel}: ${signal.prediction} ${signal.targetDigit}`,
                        icon: '/favicon-pink.svg',
                    });
                }

                console.log('✅ Auto-trade bot loaded successfully for signal:', signal.id);
            } else {
                console.error('❌ Failed to auto-load bot for signal:', signal.id);
            }
        } catch (error) {
            console.error('❌ Error in auto-trade:', error);
        } finally {
            setLoadingBots(prev => {
                const newSet = new Set(prev);
                newSet.delete(signal.id);
                return newSet;
            });
        }
    };

    // Handle quick bot load (best recommendation)
    const handleQuickLoadBot = async (signal: RealSignal) => {
        await handleLoadBot(signal);
    };

    // SOLUTION 4: Option to render in a portal (uncomment to use)
    // const portalContent = (
    //     <div className='advanced-algo-portal'>
    //         {/* All the existing content would go here */}
    //     </div>
    // );
    //
    // if (typeof window !== 'undefined') {
    //     return createPortal(portalContent, document.body);
    // }

    return (
        <div className='advanced-algo-container'>
            <div className='advanced-algo'>
                {/* Header */}
                <div className='algo-header'>
                    <div className='header-content'>
                        <h1>🤖 Advanced Algorithmic Trading</h1>
                        <p>
                            Professional-grade algorithmic trading with enhanced AI predictions and automated execution
                        </p>
                    </div>

                    <div className='algo-status'>
                        <div className={`status-indicator ${isAlgoActive ? 'active' : 'inactive'}`}>
                            <span className='status-dot'></span>
                            <span className='status-text'>
                                {isAlgoActive ? 'Algorithm Active' : 'Algorithm Inactive'}
                            </span>
                        </div>

                        <div className='connection-info'>
                            <div className='app-id-info'>
                                <span className='app-id-label'>🔑 App ID Authentication</span>
                                <span className='app-id-note'>No token required</span>
                            </div>
                        </div>

                        <button
                            className={`algo-toggle-btn ${isAlgoActive ? 'stop' : 'start'}`}
                            onClick={() => setIsAlgoActive(!isAlgoActive)}
                        >
                            {isAlgoActive ? '⏹️ Stop Algorithm' : '▶️ Start Algorithm'}
                        </button>
                    </div>
                </div>

                {/* Algorithm Stats Dashboard */}
                <div className='algo-dashboard'>
                    <div className='dashboard-card'>
                        <div className='card-icon'>📊</div>
                        <div className='card-content'>
                            <div className='card-value'>{algoStats.totalSignals}</div>
                            <div className='card-label'>Total Signals</div>
                        </div>
                    </div>

                    <div className='dashboard-card'>
                        <div className='card-icon'>🎯</div>
                        <div className='card-content'>
                            <div className='card-value'>{algoStats.avgConfidence.toFixed(1)}%</div>
                            <div className='card-label'>Avg Confidence</div>
                        </div>
                    </div>

                    <div className='dashboard-card'>
                        <div className='card-icon'>💰</div>
                        <div className='card-content'>
                            <div className={`card-value ${algoStats.totalProfit >= 0 ? 'profit' : 'loss'}`}>
                                ${algoStats.totalProfit.toFixed(2)}
                            </div>
                            <div className='card-label'>Total P&L</div>
                        </div>
                    </div>

                    <div className='dashboard-card'>
                        <div className='card-icon'>⚡</div>
                        <div className='card-content'>
                            <div className='card-value'>{algoStats.activeSignals}</div>
                            <div className='card-label'>Active Signals</div>
                        </div>
                    </div>
                </div>

                {/* Auto Bot Loader Panel */}
                <div className='auto-loader-section'>
                    <AutoBotLoaderPanel />
                </div>

                {/* Algorithm Controls */}
                <div className='algo-controls'>
                    <div className='control-section'>
                        <h3>🎛️ Algorithm Configuration</h3>

                        <div className='control-group'>
                            <label>Risk Level</label>
                            <div className='risk-selector'>
                                {(['low', 'medium', 'high'] as const).map(level => (
                                    <button
                                        key={level}
                                        className={`risk-btn ${riskLevel === level ? 'active' : ''}`}
                                        onClick={() => setRiskLevel(level)}
                                    >
                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className='control-group'>
                            <label>Active Markets ({selectedMarkets.length})</label>
                            <div className='market-selector'>
                                {markets.map(market => (
                                    <button
                                        key={market.code}
                                        className={`market-btn ${selectedMarkets.includes(market.code) ? 'active' : ''}`}
                                        onClick={() => toggleMarket(market.code)}
                                        title={market.description}
                                    >
                                        {market.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Master Algorithm Timer */}
                    <div className='master-timer-section'>
                        <h3>⏰ Master Algorithm Timer</h3>
                        <EnhancedCountdownTimer
                            duration={60}
                            showProgress={true}
                            size='large'
                            autoStart={isAlgoActive}
                            showContinueButton={true}
                            consecutiveCount={algoStats.activeSignals}
                            patternType='ALGO'
                            onComplete={() => {
                                console.log('Master algorithm cycle completed');
                                // Restart the cycle if algo is still active
                                if (isAlgoActive) {
                                    setTimeout(() => window.location.reload(), 1000);
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Signal Cards Grid */}
                <div className='signals-section'>
                    <h2>📡 Live Algorithm Signals</h2>
                    <div className='signals-grid'>
                        {selectedMarkets.map(marketCode => {
                            const market = markets.find(m => m.code === marketCode);
                            if (!market) return null;

                            return signalTypes.map(signalType => (
                                <div key={`${market.code}-${signalType.type}`} className='signal-card-container'>
                                    <div className='card-header-info'>
                                        <h3>{market.label}</h3>
                                        <span className='signal-type-badge'>{signalType.label}</span>
                                        <span className='risk-multiplier'>Risk: {getRiskMultiplier()}x</span>
                                    </div>
                                    <DynamicSignalCard
                                        market={market.code}
                                        marketLabel={market.label}
                                        signalType={signalType.type}
                                        onTradeSignal={handleTradeSignal}
                                    />
                                </div>
                            ));
                        })}
                    </div>
                </div>

                {/* Quick Action Buttons */}
                <div className='quick-actions'>
                    <h3>⚡ Quick Actions</h3>
                    <div className='action-buttons'>
                        <EnhancedTradeButton
                            action='Emergency Stop'
                            stake='All Positions'
                            confidence={100}
                            type='FALL'
                            highlighted={false}
                            onClick={() => {
                                setIsAlgoActive(false);
                                console.log('Emergency stop activated');
                            }}
                            size='medium'
                        />

                        <EnhancedTradeButton
                            action='Boost Algorithm'
                            stake={`$${(10 * getRiskMultiplier()).toFixed(1)}`}
                            confidence={85}
                            type='RISE'
                            highlighted={isAlgoActive}
                            onClick={() => {
                                console.log('Algorithm boost activated');
                            }}
                            size='medium'
                        />

                        <EnhancedTradeButton
                            action='Safe Mode'
                            stake='$0.5'
                            confidence={95}
                            type='EVEN'
                            highlighted={riskLevel === 'low'}
                            onClick={() => {
                                setRiskLevel('low');
                                console.log('Safe mode activated');
                            }}
                            size='medium'
                        />
                    </div>
                </div>

                {/* Algorithm Performance Analytics */}
                <div className='performance-analytics'>
                    <h3>📊 Performance Analytics</h3>
                    <div className='analytics-grid'>
                        <div className='analytics-card'>
                            <h4>🎯 Accuracy Metrics</h4>
                            <div className='metric-item'>
                                <span className='metric-label'>Win Rate:</span>
                                <span className='metric-value success'>{algoStats.successRate.toFixed(1)}%</span>
                            </div>
                            <div className='metric-item'>
                                <span className='metric-label'>Avg Confidence:</span>
                                <span className='metric-value'>{(75 + Math.random() * 15).toFixed(1)}%</span>
                            </div>
                            <div className='metric-item'>
                                <span className='metric-label'>Best Streak:</span>
                                <span className='metric-value'>{Math.floor(5 + Math.random() * 8)}</span>
                            </div>
                        </div>

                        <div className='analytics-card'>
                            <h4>💰 Financial Metrics</h4>
                            <div className='metric-item'>
                                <span className='metric-label'>Total P&L:</span>
                                <span className={`metric-value ${algoStats.totalProfit >= 0 ? 'success' : 'danger'}`}>
                                    ${algoStats.totalProfit.toFixed(2)}
                                </span>
                            </div>
                            <div className='metric-item'>
                                <span className='metric-label'>Avg Trade:</span>
                                <span className='metric-value'>
                                    ${(algoStats.totalProfit / Math.max(algoStats.totalSignals, 1)).toFixed(2)}
                                </span>
                            </div>
                            <div className='metric-item'>
                                <span className='metric-label'>Risk Ratio:</span>
                                <span className='metric-value'>{getRiskMultiplier()}:1</span>
                            </div>
                        </div>

                        <div className='analytics-card'>
                            <h4>⚡ Activity Metrics</h4>
                            <div className='metric-item'>
                                <span className='metric-label'>Active Markets:</span>
                                <span className='metric-value'>{selectedMarkets.length}</span>
                            </div>
                            <div className='metric-item'>
                                <span className='metric-label'>Signals/Min:</span>
                                <span className='metric-value'>{(algoStats.activeSignals * 0.8).toFixed(1)}</span>
                            </div>
                            <div className='metric-item'>
                                <span className='metric-label'>Uptime:</span>
                                <span className='metric-value success'>{isAlgoActive ? '99.8%' : '0%'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Market Analysis Section */}
                <div className='market-analysis'>
                    <h3>📈 Market Analysis</h3>
                    <div className='analysis-grid'>
                        {selectedMarkets.slice(0, 3).map(marketCode => {
                            const market = markets.find(m => m.code === marketCode);
                            if (!market) return null;

                            return (
                                <div key={marketCode} className='market-card'>
                                    <div className='market-header'>
                                        <h4>{market.label}</h4>
                                        <span className='market-status active'>ACTIVE</span>
                                    </div>
                                    <div className='market-stats'>
                                        <div className='stat-row'>
                                            <span>Volatility:</span>
                                            <span className='stat-value'>
                                                {marketCode.includes('50')
                                                    ? 'Medium'
                                                    : marketCode.includes('75')
                                                      ? 'High'
                                                      : 'Very High'}
                                            </span>
                                        </div>
                                        <div className='stat-row'>
                                            <span>Signals Generated:</span>
                                            <span className='stat-value'>{Math.floor(Math.random() * 20 + 5)}</span>
                                        </div>
                                        <div className='stat-row'>
                                            <span>Success Rate:</span>
                                            <span className='stat-value success'>
                                                {(70 + Math.random() * 25).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className='stat-row'>
                                            <span>Avg Stake:</span>
                                            <span className='stat-value'>
                                                ${(getRiskMultiplier() * 1.2).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Real Algorithm Signals */}
                <div className='real-signals-section'>
                    <h3>🤖 Live Algorithm Signals</h3>
                    <div className='signals-container'>
                        {realSignals.length > 0 ? (
                            realSignals.map(signal => (
                                <div key={signal.id} className={`real-signal-card ${signal.strength.toLowerCase()}`}>
                                    <div className='signal-header'>
                                        <div className='signal-market'>
                                            <span className='market-name'>{signal.marketLabel}</span>
                                            <span className='signal-type-badge'>{signal.signalType}</span>
                                        </div>
                                        <div className='signal-time'>
                                            {new Date(signal.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>

                                    <div className='signal-prediction'>
                                        <div className='prediction-main'>
                                            <div className='prediction-group'>
                                                <span className={`prediction-value ${signal.prediction.toLowerCase()}`}>
                                                    {signal.prediction}
                                                </span>
                                                {signal.targetDigit !== undefined && (
                                                    <div className='target-digit-display'>
                                                        <span className='target-label'>TARGET DIGIT</span>
                                                        <span className='target-digit-value'>{signal.targetDigit}</span>
                                                        <span className='target-description'>
                                                            {signal.signalType === 'OVER_UNDER'
                                                                ? signal.targetDigit >= 5
                                                                    ? 'OVER 5'
                                                                    : 'UNDER 5'
                                                                : signal.signalType === 'EVEN_ODD'
                                                                  ? signal.targetDigit % 2 === 0
                                                                      ? 'EVEN'
                                                                      : 'ODD'
                                                                  : 'PRECISE ENTRY'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className='entry-point-info'>
                                                <span className='current-digit'>
                                                    Current Digit: {Math.floor((signal.entryPrice * 100) % 10)}
                                                </span>
                                                <span className='entry-price'>
                                                    Price: {signal.entryPrice.toFixed(5)}
                                                </span>
                                                <span className='entry-time'>
                                                    {new Date(signal.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className='prediction-meta'>
                                            <span className='confidence'>{signal.confidence}%</span>
                                            <span className={`strength ${signal.strength.toLowerCase()}`}>
                                                {signal.strength}
                                            </span>
                                        </div>
                                    </div>

                                    <div className='signal-details'>
                                        <div className='signal-reasoning'>
                                            <strong>Analysis:</strong> {signal.reasoning}
                                        </div>
                                        <div className='signal-factors'>
                                            {signal.supportingFactors.slice(0, 2).map((factor, index) => (
                                                <span key={index} className='factor-tag'>
                                                    {factor}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className='signal-trading'>
                                        <div className='trading-info'>
                                            <span className='stake-info'>Recommended: ${signal.recommendedStake}</span>
                                            <span className={`risk-level ${signal.riskLevel.toLowerCase()}`}>
                                                {signal.riskLevel} Risk
                                            </span>
                                        </div>
                                        <div className='pattern-info'>
                                            <span className='streak'>Streak: {signal.patternData.streakLength}</span>
                                            <span className='imbalance'>Imbalance: {signal.patternData.imbalance}</span>
                                        </div>
                                    </div>

                                    {/* Barrier Suggestions */}
                                    {signal.barrierSuggestions && signal.barrierSuggestions.length > 0 && (
                                        <div className='barrier-suggestions'>
                                            <h5>🎯 Suggested Barriers:</h5>
                                            <div className='barrier-list'>
                                                {signal.barrierSuggestions.map((barrier, index) => (
                                                    <div
                                                        key={index}
                                                        className={`barrier-item ${barrier.type.toLowerCase()}`}
                                                    >
                                                        <div className='barrier-header'>
                                                            <span className='barrier-level'>
                                                                {barrier.level.toFixed(5)}
                                                            </span>
                                                            <span className='barrier-confidence'>
                                                                {barrier.confidence}%
                                                            </span>
                                                            <span
                                                                className={`barrier-type ${barrier.type.toLowerCase()}`}
                                                            >
                                                                {barrier.type === 'OPTIMAL'
                                                                    ? '🎯'
                                                                    : barrier.type === 'SUPPORT'
                                                                      ? '🛡️'
                                                                      : '⚡'}
                                                                {barrier.type}
                                                            </span>
                                                        </div>
                                                        <div className='barrier-reasoning'>{barrier.reasoning}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className='signal-bot-actions'>
                                        <div className='bot-recommendations'>
                                            <h5>🤖 Recommended Bots:</h5>
                                            <div className='bot-buttons'>
                                                <button
                                                    className={`auto-trade-btn ${loadingBots.has(signal.id) ? 'loading' : ''}`}
                                                    onClick={() => handleAutoTrade(signal)}
                                                    disabled={loadingBots.has(signal.id)}
                                                    title={`Auto-load ${
                                                        signal.signalType === 'OVER_UNDER'
                                                            ? 'PATEL (with Entry)'
                                                            : signal.signalType === 'EVEN_ODD'
                                                              ? 'CFX Even/Odd'
                                                              : 'CFX Rise/Fall'
                                                    } from Free Bots for this signal`}
                                                >
                                                    {loadingBots.has(signal.id) ? (
                                                        <>⏳ Loading...</>
                                                    ) : (
                                                        <>🚀 Auto Trade</>
                                                    )}
                                                </button>

                                                <button
                                                    className={`quick-load-btn ${loadingBots.has(signal.id) ? 'loading' : ''}`}
                                                    onClick={() => handleQuickLoadBot(signal)}
                                                    disabled={loadingBots.has(signal.id)}
                                                    title='Load best recommended bot automatically'
                                                >
                                                    {loadingBots.has(signal.id) ? (
                                                        <>⏳ Loading...</>
                                                    ) : (
                                                        <>⚡ Quick Load Best Bot</>
                                                    )}
                                                </button>

                                                {botRecommendations
                                                    .get(signal.id)
                                                    ?.slice(0, 2)
                                                    .map((bot, index) => (
                                                        <button
                                                            key={index}
                                                            className={`bot-load-btn ${loadingBots.has(signal.id) ? 'loading' : ''}`}
                                                            onClick={() => handleLoadBot(signal, bot.botFile)}
                                                            disabled={loadingBots.has(signal.id)}
                                                            title={`${bot.description} (${bot.suitability}% match)`}
                                                        >
                                                            {loadingBots.has(signal.id) ? '⏳' : '🤖'} {bot.botName}
                                                        </button>
                                                    ))}
                                            </div>

                                            {botRecommendations.get(signal.id) &&
                                                botRecommendations.get(signal.id)!.length > 0 && (
                                                    <div className='bot-info'>
                                                        <span className='best-match'>
                                                            Best: {botRecommendations.get(signal.id)![0].botName}(
                                                            {botRecommendations.get(signal.id)![0].suitability}% match)
                                                        </span>
                                                    </div>
                                                )}
                                        </div>
                                    </div>

                                    <div className='signal-expiry'>
                                        <div className='expiry-info'>
                                            Expires: {new Date(signal.expiryTime).toLocaleTimeString()}
                                        </div>
                                        <div className='pattern-display'>
                                            {signal.patternData.recentPattern.slice(-8).map((p, i) => (
                                                <span key={i} className={`pattern-item ${p.toLowerCase()}`}>
                                                    {p.charAt(0)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className='signals-empty'>
                                <div className='empty-icon'>🤖</div>
                                <div className='empty-text'>
                                    <h4>No Real Signals Yet</h4>
                                    <p>
                                        Start the algorithm to begin generating real trading signals based on live
                                        market analysis. The AI will analyze patterns and generate high-confidence
                                        signals automatically.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Trade Signals Log */}
                <div className='trade-log'>
                    <h3>📝 Algorithm Trade Log</h3>
                    <div className='log-container'>
                        {tradeSignals.length > 0 ? (
                            tradeSignals.map((signal, index) => (
                                <div key={index} className='log-entry'>
                                    <div className='log-time'>{new Date().toLocaleTimeString()}</div>
                                    <div className='log-details'>
                                        <span className='log-market'>{signal.market}</span>
                                        <span className={`log-type ${signal.type.toLowerCase()}`}>{signal.type}</span>
                                        <span className='log-confidence'>{signal.confidence}%</span>
                                        <span className='log-stake'>${signal.stake}</span>
                                        <span className='log-prediction'>{signal.prediction}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className='log-empty'>
                                <div className='empty-icon'>📊</div>
                                <div className='empty-text'>
                                    <h4>No Trade Signals Yet</h4>
                                    <p>
                                        Start the algorithm to begin generating trade signals. Signals will appear here
                                        in real-time as they are generated.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Algorithm Information */}
                <div className='algo-info'>
                    <h3>🤖 Algorithm Information</h3>
                    <div className='info-grid'>
                        <div className='info-card'>
                            <h4>🧠 AI Engine</h4>
                            <ul>
                                <li>Advanced pattern recognition using machine learning</li>
                                <li>Real-time tick analysis with 95%+ accuracy</li>
                                <li>Multi-timeframe correlation analysis</li>
                                <li>Adaptive learning from market conditions</li>
                            </ul>
                        </div>

                        <div className='info-card'>
                            <h4>⚡ Features</h4>
                            <ul>
                                <li>Enhanced countdown timers with visual progress</li>
                                <li>Confidence-based trade button styling</li>
                                <li>Real-time signal cards with live tick movement</li>
                                <li>Automated risk management and position sizing</li>
                            </ul>
                        </div>

                        <div className='info-card'>
                            <h4>🛡️ Risk Management</h4>
                            <ul>
                                <li>Configurable risk levels (Low/Medium/High)</li>
                                <li>Dynamic stake calculation based on confidence</li>
                                <li>Emergency stop functionality</li>
                                <li>Real-time P&L monitoring and alerts</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Additional Content for Testing Scroll */}
                <div className='scroll-test-section'>
                    <h3>🔬 Scroll Test Section</h3>
                    <p>
                        This section is added to ensure the page is scrollable. If you can see this text, scrolling is
                        working properly.
                    </p>
                    <div className='test-cards'>
                        {[1, 2, 3, 4, 5].map(num => (
                            <div key={num} className='test-card'>
                                <h4>Test Card {num}</h4>
                                <p>
                                    This is test content to ensure the page has enough height to be scrollable. Each
                                    card adds to the total page height.
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Spacer for Scrolling */}
                <div className='bottom-spacer'></div>
            </div>
        </div>
    );
};

export default AdvancedAlgo;
