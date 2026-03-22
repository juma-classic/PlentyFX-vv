/**
 * Multi-Market Signals Component
 * Displays live signals for multiple markets simultaneously
 */

import React, { useCallback, useEffect, useState } from 'react';
import { alertManager } from '../../services/alert-manager.service';
import type { PredictionResult } from '../../services/pattern-predictor.service';
import { patternPredictor } from '../../services/pattern-predictor.service';
import { soundManager } from '../../utils/sound-manager';
import { AlertNotification } from './AlertNotification';
import { DynamicSignalCard } from './DynamicSignalCard';
import { PredictionDisplay } from './PredictionDisplay';
import './MultiMarketSignals.scss';

interface MarketData {
    symbol: string;
    displayName: string;
    currentPrice: number;
    tickHistory: number[];
    prediction: PredictionResult | null;
    isActive: boolean;
    lastUpdate: number;
    subscription?: any;
}

interface MultiMarketSignalsProps {
    isLiveMode?: boolean;
    maxMarkets?: number;
}

export const MultiMarketSignals: React.FC<MultiMarketSignalsProps> = ({ isLiveMode = false, maxMarkets = 6 }) => {
    const [markets, setMarkets] = useState<Map<string, MarketData>>(new Map());
    const [selectedMarkets, setSelectedMarkets] = useState<string[]>([
        'R_10',
        'R_25',
        'R_50',
        '1HZ10V',
        '1HZ25V',
        '1HZ50V',
    ]);
    const [globalStats, setGlobalStats] = useState({
        totalSignals: 0,
        activeSignals: 0,
        accuracy: 0,
        profitLoss: 0,
    });

    // Available markets - Only Volatility indices
    const availableMarkets = [
        { symbol: 'R_10', name: 'Volatility 10 Index', category: 'Volatility Indices' },
        { symbol: 'R_25', name: 'Volatility 25 Index', category: 'Volatility Indices' },
        { symbol: 'R_50', name: 'Volatility 50 Index', category: 'Volatility Indices' },
        { symbol: 'R_75', name: 'Volatility 75 Index', category: 'Volatility Indices' },
        { symbol: 'R_100', name: 'Volatility 100 Index', category: 'Volatility Indices' },
        { symbol: '1HZ10V', name: 'Volatility 10 (1s) Index', category: '1-Second Indices' },
        { symbol: '1HZ25V', name: 'Volatility 25 (1s) Index', category: '1-Second Indices' },
        { symbol: '1HZ50V', name: 'Volatility 50 (1s) Index', category: '1-Second Indices' },
        { symbol: '1HZ75V', name: 'Volatility 75 (1s) Index', category: '1-Second Indices' },
        { symbol: '1HZ100V', name: 'Volatility 100 (1s) Index', category: '1-Second Indices' },
    ];

    // Initialize market data
    const initializeMarket = useCallback(
        (symbol: string): MarketData => {
            const marketInfo = availableMarkets.find(m => m.symbol === symbol);
            return {
                symbol,
                displayName: marketInfo?.name || symbol,
                currentPrice: 1.0 + Math.random() * 0.1,
                tickHistory: [],
                prediction: null,
                isActive: false,
                lastUpdate: Date.now(),
            };
        },
        [availableMarkets]
    );

    // Subscribe to live tick data
    const subscribeToMarket = useCallback(
        (symbol: string) => {
            if (!api_base.api || !isLiveMode) return null;

            try {
                const subscription = api_base.api.subscribe({
                    ticks: symbol,
                });

                subscription.subscribe(
                    (response: any) => {
                        if (response.tick) {
                            const newTick = response.tick.quote;

                            setMarkets(prev => {
                                const updated = new Map(prev);
                                const market = updated.get(symbol);

                                if (market) {
                                    const newHistory = [...market.tickHistory.slice(-19), newTick];

                                    // Generate prediction if we have enough data
                                    let newPrediction = market.prediction;
                                    if (newHistory.length >= 5) {
                                        const tickData = newHistory.map((value, index) => ({
                                            value,
                                            timestamp: Date.now() - (newHistory.length - index - 1) * 2000,
                                        }));
                                        newPrediction = patternPredictor.predict(tickData);

                                        // Trigger alerts for high-confidence predictions
                                        if (newPrediction && newPrediction.confidence > 75) {
                                            alertManager.addAlert(
                                                'SUCCESS',
                                                'HIGH',
                                                `${symbol} Signal`,
                                                `${newPrediction.prediction} signal with ${newPrediction.confidence}% confidence`,
                                                5000
                                            );
                                            soundManager.play('signal');
                                        }
                                    }

                                    updated.set(symbol, {
                                        ...market,
                                        currentPrice: newTick,
                                        tickHistory: newHistory,
                                        prediction: newPrediction,
                                        isActive: true,
                                        lastUpdate: Date.now(),
                                    });
                                }

                                return updated;
                            });
                        }
                    },
                    (error: any) => {
                        console.error(`Tick subscription error for ${symbol}:`, error);
                        alertManager.addAlert(
                            'ERROR',
                            'MEDIUM',
                            'Connection Error',
                            `Failed to connect to ${symbol} data`,
                            3000
                        );
                    }
                );

                return subscription;
            } catch (error) {
                console.error(`Failed to subscribe to ${symbol}:`, error);
                return null;
            }
        },
        [isLiveMode]
    );

    // Simulate tick data for demo mode
    const simulateTickData = useCallback(() => {
        if (isLiveMode) return;

        const interval = setInterval(() => {
            setMarkets(prev => {
                const updated = new Map(prev);

                selectedMarkets.forEach(symbol => {
                    const market = updated.get(symbol);
                    if (market) {
                        const change = (Math.random() - 0.5) * 0.002;
                        const newTick = Math.max(0.1, market.currentPrice + change);
                        const newHistory = [...market.tickHistory.slice(-19), newTick];

                        // Generate prediction
                        let newPrediction = market.prediction;
                        if (newHistory.length >= 5) {
                            const tickData = newHistory.map((value, index) => ({
                                value,
                                timestamp: Date.now() - (newHistory.length - index - 1) * 2000,
                            }));
                            newPrediction = patternPredictor.predict(tickData);
                        }

                        updated.set(symbol, {
                            ...market,
                            currentPrice: newTick,
                            tickHistory: newHistory,
                            prediction: newPrediction,
                            isActive: true,
                            lastUpdate: Date.now(),
                        });
                    }
                });

                return updated;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [isLiveMode, selectedMarkets]);

    // Initialize markets
    useEffect(() => {
        const newMarkets = new Map<string, MarketData>();

        selectedMarkets.forEach(symbol => {
            const market = initializeMarket(symbol);

            if (isLiveMode) {
                const subscription = subscribeToMarket(symbol);
                market.subscription = subscription;
            }

            newMarkets.set(symbol, market);
        });

        setMarkets(newMarkets);

        // Start simulation for demo mode
        const cleanup = simulateTickData();

        return () => {
            // Cleanup subscriptions
            newMarkets.forEach(market => {
                if (market.subscription) {
                    market.subscription.unsubscribe();
                }
            });

            if (cleanup) cleanup();
        };
    }, [selectedMarkets, isLiveMode, initializeMarket, subscribeToMarket, simulateTickData]);

    // Update global stats
    useEffect(() => {
        const activeSignals = Array.from(markets.values()).filter(
            market => market.prediction && market.prediction.confidence > 60
        ).length;

        const totalSignals = Array.from(markets.values()).reduce((sum, market) => sum + (market.prediction ? 1 : 0), 0);

        const avgAccuracy =
            Array.from(markets.values()).reduce((sum, market) => sum + (market.prediction?.confidence || 0), 0) /
            Math.max(totalSignals, 1);

        setGlobalStats({
            totalSignals,
            activeSignals,
            accuracy: Math.round(avgAccuracy),
            profitLoss: Math.random() * 200 - 100, // Simulated P&L
        });
    }, [markets]);

    const handleMarketToggle = (symbol: string) => {
        setSelectedMarkets(prev => {
            if (prev.includes(symbol)) {
                return prev.filter(s => s !== symbol);
            } else if (prev.length < maxMarkets) {
                return [...prev, symbol];
            }
            return prev;
        });
    };

    const getMarketsByCategory = () => {
        const categories: Record<string, typeof availableMarkets> = {};
        availableMarkets.forEach(market => {
            if (!categories[market.category]) {
                categories[market.category] = [];
            }
            categories[market.category].push(market);
        });
        return categories;
    };

    return (
        <div className='multi-market-signals'>
            {/* Header */}
            <div className='multi-market-header'>
                <div className='header-left'>
                    <h2>📊 Volatility Multi-Market Signals</h2>
                    <div className='status-badges'>
                        <span className={`status-badge ${isLiveMode ? 'live' : 'demo'}`}>
                            {isLiveMode ? '🔴 LIVE' : '🟡 DEMO'}
                        </span>
                        <span className='market-count'>
                            {selectedMarkets.length}/{maxMarkets} Markets
                        </span>
                    </div>
                </div>

                <div className='global-stats'>
                    <div className='stat-item'>
                        <span className='stat-value'>{globalStats.activeSignals}</span>
                        <span className='stat-label'>Active Signals</span>
                    </div>
                    <div className='stat-item'>
                        <span className='stat-value'>{globalStats.accuracy}%</span>
                        <span className='stat-label'>Avg Accuracy</span>
                    </div>
                    <div className='stat-item'>
                        <span className={`stat-value ${globalStats.profitLoss >= 0 ? 'positive' : 'negative'}`}>
                            ${globalStats.profitLoss.toFixed(2)}
                        </span>
                        <span className='stat-label'>P&L</span>
                    </div>
                </div>
            </div>

            {/* Market Selection */}
            <div className='market-selection'>
                <h3>
                    Select Markets ({selectedMarkets.length}/{maxMarkets})
                </h3>
                <div className='market-categories'>
                    {Object.entries(getMarketsByCategory()).map(([category, categoryMarkets]) => (
                        <div key={category} className='market-category'>
                            <h4>{category}</h4>
                            <div className='market-options'>
                                {categoryMarkets.map(market => (
                                    <label key={market.symbol} className='market-option'>
                                        <input
                                            type='checkbox'
                                            checked={selectedMarkets.includes(market.symbol)}
                                            onChange={() => handleMarketToggle(market.symbol)}
                                            disabled={
                                                !selectedMarkets.includes(market.symbol) &&
                                                selectedMarkets.length >= maxMarkets
                                            }
                                        />
                                        <span className='market-name'>{market.name}</span>
                                        <span className='market-symbol'>{market.symbol}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Market Signals Grid */}
            <div className='market-signals-grid'>
                {selectedMarkets.map(symbol => {
                    const market = markets.get(symbol);
                    if (!market) return null;

                    return (
                        <div key={symbol} className='market-signal-card'>
                            <div className='market-header'>
                                <div className='market-info'>
                                    <h4>{market.displayName}</h4>
                                    <span className='market-symbol'>{symbol}</span>
                                </div>
                                <div className='market-status'>
                                    <span className={`status-dot ${market.isActive ? 'active' : 'inactive'}`}></span>
                                    <span className='current-price'>{market.currentPrice.toFixed(5)}</span>
                                </div>
                            </div>

                            <div className='signal-content'>
                                <DynamicSignalCard
                                    symbol={symbol}
                                    currentPrice={market.currentPrice}
                                    isActive={market.isActive}
                                    tickHistory={market.tickHistory}
                                />

                                {market.prediction && (
                                    <div className='prediction-section'>
                                        <PredictionDisplay prediction={market.prediction} compact={true} />
                                    </div>
                                )}
                            </div>

                            <div className='market-actions'>
                                <button
                                    className={`trade-button ${market.prediction?.prediction.toLowerCase()}`}
                                    disabled={!market.prediction || market.prediction.confidence < 60}
                                >
                                    {market.prediction
                                        ? `${market.prediction.prediction} (${market.prediction.confidence}%)`
                                        : 'No Signal'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Alert Notifications */}
            <AlertNotification />
        </div>
    );
};
