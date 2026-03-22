import React, { useCallback,useEffect, useRef, useState } from 'react';
import { AnalyticsPanel } from '@/components/elvis-zone/AnalyticsPanel';
import { DigitFrequencyChart } from '@/components/elvis-zone/DigitFrequencyChart';
import { MarketSelector } from '@/components/elvis-zone/MarketSelector';
import { SimulationPanel } from '@/components/elvis-zone/SimulationPanel';
import { StreakHeatmap } from '@/components/elvis-zone/StreakHeatmap';
import { TickTable } from '@/components/elvis-zone/TickTable';
import { ConnectionType,derivConnectionPool } from '@/services/deriv-connection-pool.service';
import './elvis-zone.scss';

interface TickData {
    quote: number;
    epoch: number;
    lastDigit: number;
    timestamp: string;
}

interface DigitFrequency {
    digit: number;
    count: number;
    percentage: number;
}

interface StreakData {
    digit: number;
    count: number;
    isActive: boolean;
}

const ElvisZone: React.FC = () => {
    // State management
    const [ticks, setTicks] = useState<TickData[]>([]);
    const [selectedSymbol, setSelectedSymbol] = useState('R_50');
    const [isConnected, setIsConnected] = useState(false);
    const [digitFrequencies, setDigitFrequencies] = useState<DigitFrequency[]>([]);
    const [currentStreak, setCurrentStreak] = useState<StreakData>({ digit: -1, count: 0, isActive: false });
    const [streakHistory, setStreakHistory] = useState<StreakData[]>([]);
    const [simulationMode, setSimulationMode] = useState(false);
    const [matchesProbability, setMatchesProbability] = useState(0);
    const [differsProbability, setDiffersProbability] = useState(0);

    // Refs
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const tickBufferSize = 50;

    // Available markets - All Volatility Markets
    const availableMarkets = [
        // Standard Volatility Indices
        { id: 'R_10', name: 'Volatility 10 Index', type: 'Volatility' },
        { id: 'R_25', name: 'Volatility 25 Index', type: 'Volatility' },
        { id: 'R_50', name: 'Volatility 50 Index', type: 'Volatility' },
        { id: 'R_75', name: 'Volatility 75 Index', type: 'Volatility' },
        { id: 'R_100', name: 'Volatility 100 Index', type: 'Volatility' },

        // 1-Second Volatility Indices
        { id: '1HZ10V', name: 'Volatility 10 (1s) Index', type: '1-Second' },
        { id: '1HZ25V', name: 'Volatility 25 (1s) Index', type: '1-Second' },
        { id: '1HZ50V', name: 'Volatility 50 (1s) Index', type: '1-Second' },
        { id: '1HZ75V', name: 'Volatility 75 (1s) Index', type: '1-Second' },
        { id: '1HZ100V', name: 'Volatility 100 (1s) Index', type: '1-Second' },
        { id: '1HZ150V', name: 'Volatility 150 (1s) Index', type: '1-Second' },
        { id: '1HZ200V', name: 'Volatility 200 (1s) Index', type: '1-Second' },
        { id: '1HZ250V', name: 'Volatility 250 (1s) Index', type: '1-Second' },
        { id: '1HZ300V', name: 'Volatility 300 (1s) Index', type: '1-Second' },

        // Crash/Boom Indices
        { id: 'BOOM300N', name: 'Boom 300 Index', type: 'Crash/Boom' },
        { id: 'BOOM500N', name: 'Boom 500 Index', type: 'Crash/Boom' },
        { id: 'BOOM1000N', name: 'Boom 1000 Index', type: 'Crash/Boom' },
        { id: 'CRASH300N', name: 'Crash 300 Index', type: 'Crash/Boom' },
        { id: 'CRASH500N', name: 'Crash 500 Index', type: 'Crash/Boom' },
        { id: 'CRASH1000N', name: 'Crash 1000 Index', type: 'Crash/Boom' },

        // Jump Indices
        { id: 'JD10', name: 'Jump 10 Index', type: 'Jump' },
        { id: 'JD25', name: 'Jump 25 Index', type: 'Jump' },
        { id: 'JD50', name: 'Jump 50 Index', type: 'Jump' },
        { id: 'JD75', name: 'Jump 75 Index', type: 'Jump' },
        { id: 'JD100', name: 'Jump 100 Index', type: 'Jump' },

        // Step Indices
        { id: 'STPIDX', name: 'Step Index', type: 'Step' },

        // Bear/Bull Market Indices
        { id: 'RDBEAR', name: 'Bear Market Index', type: 'Bear/Bull' },
        { id: 'RDBULL', name: 'Bull Market Index', type: 'Bear/Bull' },
    ];

    // Extract digit from 4th decimal place
    const extractLastDigit = (quote: number): number => {
        const quoteStr = quote.toFixed(5);
        const digitsOnly = quoteStr.replace('.', '');

        // Get the 4th decimal place (index 4 in the digits string)
        // Examples:
        // 136.08830 → "13608830" → digitsOnly[4] = "8"
        // 136.10680 → "13610680" → digitsOnly[4] = "6"
        // 136.11780 → "13611780" → digitsOnly[4] = "7"

        if (digitsOnly.length > 4) {
            return parseInt(digitsOnly[4]);
        }

        console.warn('⚠️ [ElvisZone] Quote too short for 4th decimal extraction:', quote);
        return 0;
    };

    // Calculate digit frequencies
    const calculateDigitFrequencies = (tickData: TickData[]): DigitFrequency[] => {
        const frequencies = Array.from({ length: 10 }, (_, i) => ({
            digit: i,
            count: 0,
            percentage: 0,
        }));

        tickData.forEach(tick => {
            frequencies[tick.lastDigit].count++;
        });

        const total = tickData.length;
        frequencies.forEach(freq => {
            freq.percentage = total > 0 ? (freq.count / total) * 100 : 0;
        });

        return frequencies;
    };

    // Calculate probabilities
    const calculateProbabilities = (frequencies: DigitFrequency[], lastDigit: number) => {
        if (frequencies.length === 0 || lastDigit === -1) {
            setMatchesProbability(10); // Default 10% for each digit
            setDiffersProbability(90);
            return;
        }

        const lastDigitFreq = frequencies[lastDigit];
        const matchesProb = lastDigitFreq ? lastDigitFreq.percentage : 10;
        const differsProb = 100 - matchesProb;

        setMatchesProbability(matchesProb);
        setDiffersProbability(differsProb);
    };

    // Update streak tracking
    const updateStreakTracking = (newTick: TickData) => {
        setCurrentStreak(prev => {
            if (prev.digit === newTick.lastDigit) {
                // Continue current streak
                return {
                    digit: newTick.lastDigit,
                    count: prev.count + 1,
                    isActive: true,
                };
            } else {
                // End current streak and start new one
                if (prev.count > 1) {
                    setStreakHistory(history => [
                        { ...prev, isActive: false },
                        ...history.slice(0, 19), // Keep last 20 streaks
                    ]);
                }

                return {
                    digit: newTick.lastDigit,
                    count: 1,
                    isActive: true,
                };
            }
        });
    };

    // Handle new tick data
    const handleNewTick = useCallback(
        (tickData: { tick?: { quote: string; epoch: number }; quote?: string; epoch?: number }) => {
            try {
                const quote = parseFloat(tickData.tick?.quote || tickData.quote);
                const epoch = tickData.tick?.epoch || tickData.epoch || Math.floor(Date.now() / 1000);

                if (isNaN(quote) || quote <= 0) return;

                const lastDigit = extractLastDigit(quote);
                const timestamp = new Date(epoch * 1000).toLocaleTimeString();

                const newTick: TickData = {
                    quote,
                    epoch,
                    lastDigit,
                    timestamp,
                };

                // Update ticks buffer (keep last 50)
                setTicks(prevTicks => {
                    const updatedTicks = [newTick, ...prevTicks].slice(0, tickBufferSize);

                    // Calculate frequencies
                    const frequencies = calculateDigitFrequencies(updatedTicks);
                    setDigitFrequencies(frequencies);

                    // Calculate probabilities
                    calculateProbabilities(frequencies, lastDigit);

                    return updatedTicks;
                });

                // Update streak tracking
                updateStreakTracking(newTick);

                console.log(`📊 [ElvisZone] New tick: ${quote} → Digit: ${lastDigit}`);
            } catch (error) {
                console.error('❌ [ElvisZone] Error processing tick:', error);
            }
        },
        [extractLastDigit, calculateDigitFrequencies, calculateProbabilities, updateStreakTracking, tickBufferSize]
    );

    // Subscribe to market data
    const subscribeToMarket = useCallback(
        async (symbol: string) => {
            try {
                // Cleanup existing subscription
                if (unsubscribeRef.current) {
                    unsubscribeRef.current();
                    unsubscribeRef.current = null;
                }

                console.log(`🔌 [ElvisZone] Subscribing to ${symbol}...`);

                const unsubscribe = await derivConnectionPool.subscribeToTicks(
                    symbol,
                    handleNewTick,
                    ConnectionType.ANALYSIS
                );

                unsubscribeRef.current = unsubscribe;
                setIsConnected(true);

                console.log(`✅ [ElvisZone] Connected to ${symbol}`);
            } catch (error) {
                console.error(`❌ [ElvisZone] Failed to subscribe to ${symbol}:`, error);
                setIsConnected(false);
            }
        },
        [handleNewTick]
    );

    // Handle market change
    const handleMarketChange = (symbol: string) => {
        setSelectedSymbol(symbol);
        setTicks([]); // Clear existing data
        setDigitFrequencies([]);
        setCurrentStreak({ digit: -1, count: 0, isActive: false });
        setStreakHistory([]);
        subscribeToMarket(symbol);
    };

    // Initialize connection
    useEffect(() => {
        subscribeToMarket(selectedSymbol);

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [selectedSymbol, subscribeToMarket]);

    return (
        <div className='elvis-zone'>
            {/* Header */}
            <div className='elvis-zone__header'>
                <div className='header-content'>
                    <h1 className='title'>🎯 ElvisZone - Deriv Matches/Differs Analyzer</h1>
                    <div className='subtitle'>Advanced last-digit pattern analysis for educational purposes only</div>
                </div>

                <div className='header-controls'>
                    <MarketSelector
                        markets={availableMarkets}
                        selectedMarket={selectedSymbol}
                        onMarketChange={handleMarketChange}
                        isConnected={isConnected}
                    />

                    <div className='connection-status'>
                        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                            <span className='status-dot'></span>
                            <span className='status-text'>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Safety Warning */}
            <div className='safety-warning'>
                ⚠️ <strong>Educational Purpose Only</strong> - This tool is for analysis and learning. No real trading
                actions are performed. Always trade responsibly.
            </div>

            {/* Main Content */}
            <div className='elvis-zone__content'>
                {/* Left Panel - Analytics */}
                <div className='left-panel'>
                    <AnalyticsPanel
                        digitFrequencies={digitFrequencies}
                        matchesProbability={matchesProbability}
                        differsProbability={differsProbability}
                        currentStreak={currentStreak}
                        totalTicks={ticks.length}
                        lastTick={ticks[0]}
                    />

                    <SimulationPanel
                        enabled={simulationMode}
                        onToggle={setSimulationMode}
                        matchesProbability={matchesProbability}
                        differsProbability={differsProbability}
                        lastDigit={ticks[0]?.lastDigit}
                    />
                </div>

                {/* Center Panel - Visualizations */}
                <div className='center-panel'>
                    <div className='chart-container'>
                        <DigitFrequencyChart frequencies={digitFrequencies} currentDigit={ticks[0]?.lastDigit} />
                    </div>

                    <div className='heatmap-container'>
                        <StreakHeatmap
                            currentStreak={currentStreak}
                            streakHistory={streakHistory}
                            digitFrequencies={digitFrequencies}
                        />
                    </div>
                </div>

                {/* Right Panel - Tick Data */}
                <div className='right-panel'>
                    <TickTable ticks={ticks} maxRows={tickBufferSize} highlightDigit={ticks[0]?.lastDigit} />
                </div>
            </div>
        </div>
    );
};

export default ElvisZone;
