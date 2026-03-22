import React, { useEffect, useState } from 'react';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useStore } from '@/hooks/useStore';
import { derivAPIService } from '@/services/deriv-api.service';
import { digitDistributionScannerService } from '@/services/digit-distribution-scanner.service';
import { hotColdZoneScannerService } from '@/services/hot-cold-zone-scanner.service';
import { patternPredictor } from '@/services/pattern-predictor.service';
import { signalAnalysisService } from '@/services/signal-analysis.service';
import { SignalTradeResult, signalTradingService } from '@/services/signal-trading.service';
import { stakeManager } from '@/services/stake-manager.service';
import { aiSignalIntelligence } from '@/services/ai-signal-intelligence.service';
import patelSignalGenerator from '@/services/patel-signal-generator.service';
import { EntryAnalysis, EvenOddEntrySuggester } from '@/utils/evenodd-entry-suggester';
import { AutoTradeSettings } from './AutoTradeSettings';
import { ConnectionPoolStatus } from './ConnectionPoolStatus';
import { ConnectionStatus } from './ConnectionStatus';
import { DigitHackerSignals } from './DigitHackerSignals';
import { DynamicSignals } from './DynamicSignals';
import { EvenOddSignals } from './EvenOddSignals';
import { FlippingToolSignals } from './FlippingToolSignals';
import { PatternDisplay } from './PatternDisplay';
import { PerformanceDashboard } from './PerformanceDashboard';
import { RiseFallSignals } from './RiseFallSignals';
import { RiskManagementSettings } from './RiskManagementSettings';
import { StakeMartingaleModal } from './StakeMartingaleModal';
import './SignalsCenter.scss';
import './SignalsCenter-enhanced.scss';
import './SignalsCenter-visibility.scss';
import './FlippingToolSignals.scss';
import './EvenOddSignals.scss';
import './DynamicSignals.scss';
import './RiseFallSignals.scss';
import './ConnectionPoolStatus.scss';
import './DigitHackerSignals.scss';
import './SignalGeneratorToggles.scss';

interface DigitPercentageAnalysis {
    digit: number;
    percentage: number;
    frequency: number;
    isHot: boolean;
    isCold: boolean;
}

interface SignalsCenterSignal {
    id: string;
    timestamp: number;
    market: string;
    marketDisplay: string;
    type:
        | 'RISE'
        | 'FALL'
        | 'EVEN'
        | 'ODD'
        | 'OVER1'
        | 'OVER2'
        | 'OVER3'
        | 'OVER4'
        | 'OVER5'
        | 'UNDER1'
        | 'UNDER2'
        | 'UNDER3'
        | 'UNDER4'
        | 'UNDER5';
    entry: number;
    duration: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'CONSERVATIVE' | 'AGGRESSIVE';
    strategy: string;
    source: string;
    status: 'ACTIVE' | 'WON' | 'LOST' | 'EXPIRED' | 'TRADING';
    result?: number;
    entryDigit?: number;
    digitPattern?: number[];
    reason?: string;
    isTrading?: boolean;
    tradeResult?: SignalTradeResult;
    entryAnalysis?: EntryAnalysis;
    recentPattern?: ('EVEN' | 'ODD' | 'RISE' | 'FALL' | 'OVER' | 'UNDER')[];
    digitPercentages?: DigitPercentageAnalysis[];
    targetDigitsAnalysis?: {
        targetDigits: number[];
        combinedPercentage: number;
        individualPercentages: DigitPercentageAnalysis[];
        entryDigitPercentage?: number;
    };
    // Countdown validity feature
    validityDuration?: number; // Duration in seconds (30-50 based on signal strength)
    expiresAt?: number; // Timestamp when signal expires
    remainingTime?: number; // Remaining seconds (calculated in real-time)
    // AI Enhancement fields
    aiData?: {
        neuralScore: number;
        marketSentiment: {
            sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
            strength: number;
            volatility: number;
            trend: 'UP' | 'DOWN' | 'SIDEWAYS';
            momentum: number;
        };
        reasoning: string[];
        supportingPatterns: string[];
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
        expectedAccuracy: number;
        adaptiveWeight: number;
        multiTimeframeAnalysis?: {
            shortTerm: { trend: string; strength: number };
            mediumTerm: { trend: string; strength: number };
            longTerm: { trend: string; strength: number };
            consensus: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
            conflictLevel: number;
        };
    };
}

// Enhanced signal categorization
interface SignalCategory {
    category: 'EXACT_DIGIT' | 'RANGE_PREDICTION' | 'TREND' | 'PATTERN';
    displayType: string;
    icon: string;
    confidence: string;
    strategy: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const SignalsCenter: React.FC = () => {
    const { dashboard } = useStore();
    const { setActiveTab } = dashboard;

    // Default stake value for martingale reset
    const DEFAULT_STAKE = 1.0;

    // Load signals from localStorage on initial render
    const loadSignalsFromStorage = (): SignalsCenterSignal[] => {
        try {
            const saved = localStorage.getItem('signalsCenterSignals');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Filter out signals older than 1 hour
                const oneHourAgo = Date.now() - 60 * 60 * 1000;
                return parsed.filter((s: SignalsCenterSignal) => s.timestamp > oneHourAgo);
            }
        } catch (e) {
            console.warn('Failed to load signals from localStorage:', e);
        }
        return [];
    };

    const [signals, setSignals] = useState<SignalsCenterSignal[]>(loadSignalsFromStorage);
    const [flippingSignals, setFlippingSignals] = useState<SignalsCenterSignal[]>([]);
    const [evenOddSignals, setEvenOddSignals] = useState<SignalsCenterSignal[]>([]);
    const [dynamicSignals, setDynamicSignals] = useState<SignalsCenterSignal[]>([]);
    const [riseFallSignals, setRiseFallSignals] = useState<SignalsCenterSignal[]>([]);
    const [patternPredictorSignals, setPatternPredictorSignals] = useState<SignalsCenterSignal[]>([]);
    const [multiMarketSignals, setMultiMarketSignals] = useState<SignalsCenterSignal[]>([]);
    const [jumpSignals] = useState<SignalsCenterSignal[]>([]); // Removed jump signals as requested
    const [hotColdZoneSignals, setHotColdZoneSignals] = useState<SignalsCenterSignal[]>([]);
    const [digitDistributionSignals, setDigitDistributionSignals] = useState<SignalsCenterSignal[]>([]);
    const [digitHackerSignals, setDigitHackerSignals] = useState<SignalsCenterSignal[]>([]);
    const [aiSignals, setAiSignals] = useState<SignalsCenterSignal[]>([]);
    const [activeSource, setActiveSource] = useState<
        | 'all'
        | 'ai'
        | 'pattern'
        | 'technical'
        | 'flipping'
        | 'evenodd'
        | 'dynamic'
        | 'risefall'
        | 'patternpredictor'
        | 'multimarket'
        | 'exact_digit'
        | 'range_prediction'
        | 'hotcoldzone'
        | 'digitdistribution'
    >('all');
    const [filterMarket, setFilterMarket] = useState<string>('all');
    const [filterStrategy, setFilterStrategy] = useState<string>('all');
    const [filterTime, setFilterTime] = useState<'1m' | '2m' | '3m' | '5m' | '10m' | 'all'>('5m');
    const [showFilters, setShowFilters] = useState(false);
    const [showNotifications] = useState(true);

    // Signal Generator Toggles - Control which generators are active
    const [enabledGenerators, setEnabledGenerators] = useState({
        flipping: false, // Disabled by default (high API load)
        evenOdd: true,
        dynamic: true,
        riseFall: true,
        digitHacker: true,
        hotCold: true,
        patelDistribution: true,
        aiIntelligence: true, // New AI Intelligence generator
    });
    const [latestSignal, setLatestSignal] = useState<SignalsCenterSignal | null>(null);
    const [, setTradeStats] = useState(signalTradingService.getStats());
    const [showDashboard, setShowDashboard] = useState(false);
    const [showRiskSettings, setShowRiskSettings] = useState(false);
    const [showAutoTradeSettings, setShowAutoTradeSettings] = useState(false);
    const [isMyTradesExpanded, setIsMyTradesExpanded] = useState(true);
    const [autoTradeEnabled, setAutoTradeEnabled] = useState(signalTradingService.getAutoTradeConfig().enabled);
    const [, forceUpdate] = useState({});
    const [tradeRuns, setTradeRuns] = useState<Record<string, number>>({});
    const [martingalePredictions, setMartingalePredictions] = useState<Record<string, string>>({});
    const [autoLoopRuns, setAutoLoopRuns] = useState<Record<string, number>>({});
    const [isAutoLooping, setIsAutoLooping] = useState<Record<string, boolean>>({});
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true);
    const [useMartingale, setUseMartingale] = useState<Record<string, boolean>>({});
    const [martingaleMultiplier, setMartingaleMultiplier] = useState<Record<string, number>>({});
    const [tickDuration, setTickDuration] = useState<Record<string, number>>({});
    const [loadingSignals] = useState<Set<string>>(new Set());
    const [loadedSignals] = useState<Set<string>>(new Set());

    const [showConnectionPool, setShowConnectionPool] = useState(false);
    const [showStakeModal, setShowStakeModal] = useState(false);

    // Pattern analysis visibility state - hidden by default
    const [showPatternAnalysis, setShowPatternAnalysis] = useState(false);

    // Risk mode state: 'normal' | 'lessRisky' | 'over3under6' - Load from localStorage
    const loadRiskMode = (): 'normal' | 'lessRisky' | 'over3under6' => {
        try {
            const saved = localStorage.getItem('signalsCenterRiskMode');
            if (saved && ['normal', 'lessRisky', 'over3under6'].includes(saved)) {
                return saved as 'normal' | 'lessRisky' | 'over3under6';
            }
        } catch (e) {
            console.warn('Failed to load risk mode from localStorage:', e);
        }
        return 'normal';
    };
    const [riskMode, setRiskMode] = useState<'normal' | 'lessRisky' | 'over3under6'>(loadRiskMode);

    // Real data connection state - CRITICAL for production safety
    const [isConnectedToRealData, setIsConnectedToRealData] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [tickCount, setTickCount] = useState(0);
    const [lastTickTime, setLastTickTime] = useState<number | null>(null);
    const [currentMarketData, setCurrentMarketData] = useState<{ market: string; price: number } | null>(null);

    // Calculate validity duration based on signal strength (30-50 seconds)
    const calculateValidityDuration = (
        signal: Omit<SignalsCenterSignal, 'validityDuration' | 'expiresAt' | 'remainingTime'>
    ): number => {
        let baseDuration = 40; // Default 40 seconds

        // Adjust based on confidence level
        switch (signal.confidence) {
            case 'HIGH':
                baseDuration = 50; // High confidence gets 50 seconds
                break;
            case 'MEDIUM':
                baseDuration = 40; // Medium confidence gets 40 seconds
                break;
            case 'LOW':
            case 'CONSERVATIVE':
            case 'AGGRESSIVE':
                baseDuration = 30; // Low confidence gets 30 seconds
                break;
        }

        // Adjust based on signal type (some types are more time-sensitive)
        if (signal.type.startsWith('OVER') || signal.type.startsWith('UNDER')) {
            // Digit signals with entry points get extra time for precision
            if (signal.entryDigit !== undefined) {
                baseDuration += 5; // +5 seconds for hot digit signals
            }
        }

        // Adjust based on strategy
        if (signal.strategy.includes('Hot Digits')) {
            baseDuration += 3; // Hot digit strategies get extra time
        } else if (signal.strategy.includes('Pattern')) {
            baseDuration -= 2; // Pattern signals are more time-sensitive
        }

        // Ensure duration stays within 30-50 second range
        return Math.max(30, Math.min(50, baseDuration));
    };

    // Enhanced signal categorization function
    const getSignalCategory = (signal: SignalsCenterSignal): SignalCategory => {
        const isOverUnderSignal = signal.type.startsWith('OVER') || signal.type.startsWith('UNDER');

        if (isOverUnderSignal) {
            if (signal.entryDigit !== undefined) {
                return {
                    category: 'EXACT_DIGIT',
                    displayType: `EXACT ${signal.entryDigit}`,
                    icon: '🎯',
                    confidence: 'PRECISION',
                    strategy: 'Hot Digit Targeting',
                    riskLevel: 'LOW',
                };
            } else {
                return {
                    category: 'RANGE_PREDICTION',
                    displayType: signal.type,
                    icon: '📊',
                    confidence: 'PROBABILITY',
                    strategy: 'Range Analysis',
                    riskLevel: 'MEDIUM',
                };
            }
        } else if (signal.type === 'EVEN' || signal.type === 'ODD') {
            return {
                category: 'PATTERN',
                displayType: signal.type,
                icon: '🎲',
                confidence: signal.confidence,
                strategy: 'Pattern Recognition',
                riskLevel: 'MEDIUM',
            };
        } else if (signal.type === 'RISE' || signal.type === 'FALL') {
            return {
                category: 'TREND',
                displayType: signal.type,
                icon: signal.type === 'RISE' ? '📈' : '📉',
                confidence: signal.confidence,
                strategy: 'Trend Following',
                riskLevel: 'HIGH',
            };
        }

        // Default fallback
        return {
            category: 'PATTERN',
            displayType: signal.type,
            icon: '📊',
            confidence: signal.confidence,
            strategy: signal.strategy,
            riskLevel: 'MEDIUM',
        };
    };

    // Transform signal type based on risk mode
    // Less Risky: OVER* → OVER2, UNDER* → UNDER7 (70% win probability)
    // Over3/Under6: OVER* → OVER3, UNDER* → UNDER6
    // IMPORTANT: Preserves original entry digit (hot digit) while only changing prediction barrier
    const transformSignalForRiskMode = (signal: SignalsCenterSignal): SignalsCenterSignal => {
        if (riskMode === 'normal') return signal;

        const isOver = signal.type.startsWith('OVER');
        const isUnder = signal.type.startsWith('UNDER');

        if (!isOver && !isUnder) return signal;

        let newType: SignalsCenterSignal['type'];
        // PRESERVE original entry digit - don't change it!
        const preservedEntryDigit = signal.entryDigit;

        if (riskMode === 'lessRisky') {
            // Less Risky: OVER2 (digits 3-9 win = 70%) and UNDER7 (digits 0-6 win = 70%)
            // Keep original hot entry digit, only change prediction barrier
            if (isOver) {
                newType = 'OVER2';
            } else {
                newType = 'UNDER7' as SignalsCenterSignal['type'];
            }
        } else {
            // Over3/Under6: OVER3 (digits 4-9 win = 60%) and UNDER6 (digits 0-5 win = 60%)
            // Keep original hot entry digit, only change prediction barrier
            if (isOver) {
                newType = 'OVER3';
            } else {
                newType = 'UNDER6' as SignalsCenterSignal['type'];
            }
        }

        return {
            ...signal,
            type: newType,
            entryDigit: preservedEntryDigit, // Keep original hot entry digit
            reason: `${signal.reason || ''} [Risk Mode: ${riskMode === 'lessRisky' ? 'Less Risky (OVER2/UNDER7)' : 'Over3/Under6'} - Entry Digit: ${preservedEntryDigit}]`.trim(),
        };
    };

    // Request notification permission
    useEffect(() => {
        signalTradingService.requestNotificationPermission();
    }, []);

    // Save signals to localStorage whenever they change
    useEffect(() => {
        try {
            // Only save the last 50 signals to avoid localStorage limits
            const signalsToSave = signals.slice(0, 50);
            localStorage.setItem('signalsCenterSignals', JSON.stringify(signalsToSave));
        } catch (e) {
            console.warn('Failed to save signals to localStorage:', e);
        }
    }, [signals]);

    // Save risk mode to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('signalsCenterRiskMode', riskMode);
            console.log('💾 Risk mode saved:', riskMode);
        } catch (e) {
            console.warn('Failed to save risk mode to localStorage:', e);
        }
    }, [riskMode]);

    // Update trades list when new trades complete
    useEffect(() => {
        const updateInterval = setInterval(() => {
            forceUpdate({});
        }, 1000);

        return () => clearInterval(updateInterval);
    }, []);

    // Countdown timer for signal validity
    useEffect(() => {
        const countdownInterval = setInterval(() => {
            const now = Date.now();

            setSignals(prev =>
                prev.map(signal => {
                    if (signal.status !== 'ACTIVE' || !signal.expiresAt) {
                        return signal;
                    }

                    const remainingMs = signal.expiresAt - now;
                    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

                    // If signal has expired, mark it as expired
                    if (remainingSeconds <= 0) {
                        console.log(`⏰ Signal ${signal.id} expired after ${signal.validityDuration}s`);
                        return {
                            ...signal,
                            status: 'EXPIRED' as const,
                            remainingTime: 0,
                        };
                    }

                    // Update remaining time
                    return {
                        ...signal,
                        remainingTime: remainingSeconds,
                    };
                })
            );
        }, 1000); // Update every second

        return () => clearInterval(countdownInterval);
    }, []);

    // Auto-trade logic
    useEffect(() => {
        if (!autoTradeEnabled) return;

        const checkAutoTrade = () => {
            console.log('🤖 Auto-trade checking', signals.length, 'signals...');

            signals.forEach(signal => {
                if (signal.isTrading) {
                    console.log('⏭️ Skipping signal (already trading):', signal.id);
                    return;
                }

                // Check if signal has expired
                if (signal.status === 'EXPIRED') {
                    console.log('⏰ Skipping signal (expired):', signal.id);
                    return;
                }

                // Check countdown validity for active signals
                if (signal.status === 'ACTIVE' && signal.remainingTime !== undefined && signal.remainingTime <= 0) {
                    console.log('⏰ Skipping signal (countdown expired):', signal.id);
                    return;
                }

                const shouldTrade = signalTradingService.shouldAutoTrade(signal);
                console.log('🔍 Signal', signal.id, '- Should trade:', shouldTrade, {
                    market: signal.market,
                    type: signal.type,
                    confidence: signal.confidence,
                    status: signal.status,
                    remainingTime: signal.remainingTime,
                });

                if (shouldTrade) {
                    console.log('✅ Auto-trading signal:', signal.id, `(${signal.remainingTime}s remaining)`);
                    handleAutoTrade(signal);
                }
            });
        };

        const interval = setInterval(checkAutoTrade, 2000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [signals, autoTradeEnabled]);

    // Handle auto-trade (uses optimal stake from service and multiple runs)
    const handleAutoTrade = async (signal: SignalsCenterSignal) => {
        console.log('🤖 Auto-trading signal:', signal.id);

        // Get auto-trade config
        const autoTradeConfig = signalTradingService.getAutoTradeConfig();
        const numberOfRuns = autoTradeConfig.numberOfRuns || 1;

        // Get current stake from StakeManager (centralized)
        const { stakeManager } = await import('@/services/stake-manager.service');
        let currentStake = stakeManager.getStake();
        const currentMartingale = stakeManager.getMartingale();

        console.log('💰 Using centralized stake settings:', {
            stake: currentStake,
            martingale: currentMartingale,
            source: 'StakeManager',
        });
        console.log('🔄 Number of runs:', numberOfRuns);

        // Update signal status
        setSignals(prev => prev.map(s => (s.id === signal.id ? { ...s, isTrading: true, status: 'TRADING' } : s)));

        // Get duration from auto-trade settings (overrides signal duration)
        const duration = signalTradingService.getTradeDuration();
        const durationUnit = 't'; // Always use ticks for auto-trade

        console.log(`⏱️ Using configured duration: ${duration} ticks`);

        // Get barrier for digit contracts
        let barrier: string | undefined;
        if (signal.entryDigit !== undefined) {
            barrier = signal.entryDigit.toString();
        }

        // Execute multiple runs
        let totalProfit = 0;
        let successfulRuns = 0;
        let failedRuns = 0;
        const maxTrades = numberOfRuns;

        for (let run = 1; run <= maxTrades; run++) {
            console.log(`🤖 Auto-trade run ${run}/${maxTrades}`);

            const result = await signalTradingService.executeSignalTrade(
                {
                    signalId: `${signal.id}-auto-run${run}`,
                    market: signal.market,
                    type: signal.type,
                    stake: currentStake, // Use StakeManager stake
                    duration,
                    durationUnit: durationUnit as 't' | 'm' | 'h',
                    barrier,
                },
                tradeResult => {
                    console.log(`✅ Auto-trade run ${run} completed:`, tradeResult.profit);
                    totalProfit += tradeResult.profit || 0;
                    if (tradeResult.isWon) {
                        successfulRuns++;
                    } else {
                        failedRuns++;
                    }
                    setTradeStats(signalTradingService.getStats());
                }
            );

            if (!result.success) {
                console.error(`❌ Auto-trade run ${run} failed`);
                failedRuns++;
            }

            // Check if we should stop early (take profit/stop loss)
            if (autoTradeConfig.takeProfit > 0 && totalProfit >= autoTradeConfig.takeProfit) {
                console.log(`🎯 Take profit reached after ${run} runs`);
                break;
            }
            if (autoTradeConfig.stopLoss > 0 && totalProfit <= -autoTradeConfig.stopLoss) {
                console.log(`🛑 Stop loss reached after ${run} runs`);
                break;
            }

            // Small delay between runs (except for last run)
            if (run < maxTrades) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Update signal with final results
        console.log(`🏁 Auto-trade completed. Total profit: ${totalProfit.toFixed(2)}`);
        setSignals(prev =>
            prev.map(s =>
                s.id === signal.id
                    ? {
                          ...s,
                          isTrading: false,
                          status: successfulRuns > failedRuns ? 'WON' : 'LOST',
                          result: totalProfit,
                      }
                    : s
            )
        );
    };

    // Market display mapping
    const getMarketDisplay = (market: string): string => {
        const marketMap: Record<string, string> = {
            '1HZ10V': 'Volatility 10 (1s)',
            '1HZ25V': 'Volatility 25 (1s)',
            '1HZ50V': 'Volatility 50 (1s)',
            '1HZ75V': 'Volatility 75 (1s)',
            '1HZ100V': 'Volatility 100 (1s)',
            R_10: 'Volatility 10',
            R_25: 'Volatility 25',
            R_50: 'Volatility 50',
            R_75: 'Volatility 75',
            R_100: 'Volatility 100',
        };
        return marketMap[market] || market;
    };

    // Subscribe to tick data and generate real signals - NO DEMO DATA
    useEffect(() => {
        const selectedMarket = 'R_50'; // Use R_50 for better compatibility
        let unsubscribeFunc: (() => void) | undefined;
        let realTickCount = 0;
        const currentRealMarket = selectedMarket;
        let lastRealPrice = 0;

        // CRITICAL: Only generate signals from REAL Deriv data
        const subscribeToTicks = async () => {
            try {
                setConnectionError(null);
                console.log('📡 Connecting to Deriv WebSocket for real tick data...');

                const unsub = await derivAPIService.subscribeToTicks(selectedMarket, tickData => {
                    // Only process REAL tick data from Deriv
                    if (tickData?.tick?.quote && tickData?.tick?.epoch) {
                        realTickCount++;
                        lastRealPrice = tickData.tick.quote;

                        // Add REAL tick to analysis service
                        signalAnalysisService.addTick({
                            quote: tickData.tick.quote,
                            epoch: tickData.tick.epoch,
                        });

                        // Update connection state
                        setIsConnectedToRealData(true);
                        setTickCount(realTickCount);
                        setLastTickTime(Date.now());
                        setCurrentMarketData({
                            market: selectedMarket,
                            price: tickData.tick.quote,
                        });

                        // Generate signal after receiving enough real ticks (minimum 20)
                        if (realTickCount >= 20 && realTickCount % 10 === 0) {
                            generateSignalFromRealData(selectedMarket, tickData.tick.quote);
                        }
                    }
                });
                unsubscribeFunc = unsub;
                console.log('✅ Connected to Deriv WebSocket - receiving REAL tick data');
            } catch (error) {
                console.error('❌ Failed to subscribe to real ticks:', error);
                setIsConnectedToRealData(false);
                setConnectionError('Failed to connect to Deriv. Please check your connection and try again.');
                // DO NOT generate demo ticks - this is a real money trading platform
            }
        };

        // Generate signal from REAL data using Patel Algorithm Service
        const generateSignalFromRealData = (market: string, currentPrice: number) => {
            try {
                // Get recent ticks for Patel analysis
                const recentTicks = (
                    signalAnalysisService as unknown as {
                        getRecentTicks: (count: number) => Array<{ quote: number }>;
                    }
                ).getRecentTicks(100);

                if (!recentTicks || recentTicks.length < 20) {
                    console.log('🎯 Patel Algorithm: Not enough tick data for analysis');
                    return;
                }

                // Extract last digits from quotes for Patel analysis
                const lastDigits = recentTicks.map((t: { quote: number }) => {
                    return Math.abs(Math.floor(t.quote * 100)) % 10;
                });

                console.log('🎯 Patel Algorithm: Analyzing', lastDigits.length, 'digits');

                // Use Patel Signal Generator Service
                const patelSignals = patelSignalGenerator.getSignals();

                // Convert Patel signals to SignalsCenter format
                patelSignals.forEach(patelSignal => {
                    // Determine entry digit based on signal type and your custom logic
                    let entryDigit: number | undefined;

                    if (patelSignal.type === 'OVER') {
                        // For OVER signals: use highest % digit from 0-4 range
                        const lowDigits = [0, 1, 2, 3, 4];
                        const digitFreqs = lowDigits.map(digit => {
                            const count = lastDigits.filter(d => d === digit).length;
                            return { digit, frequency: (count / lastDigits.length) * 100 };
                        });
                        entryDigit = digitFreqs.sort((a, b) => b.frequency - a.frequency)[0]?.digit;
                    } else if (patelSignal.type === 'UNDER') {
                        // For UNDER signals: use highest % digit from 5-9 range
                        const highDigits = [5, 6, 7, 8, 9];
                        const digitFreqs = highDigits.map(digit => {
                            const count = lastDigits.filter(d => d === digit).length;
                            return { digit, frequency: (count / lastDigits.length) * 100 };
                        });
                        entryDigit = digitFreqs.sort((a, b) => b.frequency - a.frequency)[0]?.digit;
                    } else {
                        // For other signal types, use suggested entry digit from Patel
                        entryDigit = patelSignal.suggestedEntryDigit;
                    }

                    const signal: SignalsCenterSignal = {
                        id: `patel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        timestamp: Date.now(),
                        market: market,
                        marketDisplay: getMarketDisplay(market),
                        type: patelSignal.type as SignalsCenterSignal['type'],
                        entry: currentPrice,
                        duration: patelSignal.duration,
                        confidence: patelSignal.confidence as SignalsCenterSignal['confidence'],
                        strategy: `Patel ${patelSignal.strategy}`,
                        source: 'pattern',
                        status: 'ACTIVE',
                        entryDigit: entryDigit,
                        reason: patelSignal.reasoning,
                    };

                    // Add countdown validity
                    const validityDuration = calculateValidityDuration(signal);
                    const expiresAt = Date.now() + validityDuration * 1000;

                    const signalWithCountdown: SignalsCenterSignal = {
                        ...signal,
                        validityDuration,
                        expiresAt,
                        remainingTime: validityDuration,
                    };

                    // Apply risk mode transformation
                    const transformedSignal = transformSignalForRiskMode(signalWithCountdown);

                    console.log('🎯 Patel Signal Generated:', {
                        type: transformedSignal.type,
                        confidence: transformedSignal.confidence,
                        strategy: transformedSignal.strategy,
                        entryDigit: transformedSignal.entryDigit,
                        reason: transformedSignal.reason,
                    });

                    setSignals(prev => [transformedSignal, ...prev].slice(0, 50));
                    setLatestSignal(transformedSignal);
                });
            } catch (error) {
                console.error('❌ Patel signal generation failed:', error);
            }
        };

        // Calculate digit statistics using Patel's algorithm
        const calculatePatelDigitStats = (digits: number[]) => {
            const stats = [];

            for (let digit = 0; digit <= 9; digit++) {
                const occurrences = digits.filter(d => d === digit).length;
                const frequency = digits.length > 0 ? (occurrences / digits.length) * 100 : 0;

                // Calculate last seen
                let lastSeen = 0;
                for (let i = digits.length - 1; i >= 0; i--) {
                    if (digits[i] === digit) break;
                    lastSeen++;
                }

                // Calculate streak
                let streak = 0;
                for (let i = digits.length - 1; i >= 0; i--) {
                    if (digits[i] === digit) {
                        streak++;
                    } else {
                        break;
                    }
                }

                // Calculate hot/cold score (Patel's key metric)
                const expectedFreq = 10;
                const deviation = frequency - expectedFreq;
                const hotColdScore = Math.max(-100, Math.min(100, (deviation / expectedFreq) * 100));

                stats.push({
                    digit,
                    frequency,
                    lastSeen,
                    streak,
                    hotColdScore,
                });
            }

            return stats;
        };

        // Analyze patterns using Patel's strategies
        const analyzePatelPatterns = (
            market: string,
            digitStats: any[],
            digits: number[],
            currentPrice: number
        ): SignalsCenterSignal[] => {
            const signals: SignalsCenterSignal[] = [];

            // Strategy 1: Zone Clustering (OVER signals) - Your custom logic
            const highDigits = digitStats.filter(d => d.digit >= 5); // Digits 5-9
            const highFreq = highDigits.reduce((sum, d) => sum + d.frequency, 0);

            if (highFreq > 60) {
                // High zone is dominant
                // Find digit with highest percentage in 0-4 range for OVER entry
                const lowDigits = digitStats.filter(d => d.digit <= 4);
                const bestLowDigit = lowDigits.sort((a, b) => b.frequency - a.frequency)[0];

                if (bestLowDigit && bestLowDigit.frequency > 8) {
                    // Above average
                    const confidence = Math.min(95, 50 + (highFreq - 50) * 0.8 + bestLowDigit.hotColdScore * 0.3);

                    signals.push({
                        id: `patel-over-${Date.now()}`,
                        timestamp: Date.now(),
                        market: market,
                        marketDisplay: getMarketDisplay(market),
                        type: 'OVER4' as SignalsCenterSignal['type'], // Default OVER barrier
                        entry: currentPrice,
                        duration: '5 ticks',
                        confidence: confidence >= 75 ? 'HIGH' : confidence >= 55 ? 'MEDIUM' : 'LOW',
                        strategy: 'Patel Zone Clustering (High)',
                        source: 'pattern',
                        status: 'ACTIVE',
                        entryDigit: bestLowDigit.digit, // Entry digit from 0-4 with highest %
                        reason: `High zone (5-9) dominant at ${highFreq.toFixed(1)}%. Entry digit ${bestLowDigit.digit} has ${bestLowDigit.frequency.toFixed(1)}% frequency (Hot Score: ${bestLowDigit.hotColdScore.toFixed(1)})`,
                    });
                }
            }

            // Strategy 2: Zone Clustering (UNDER signals) - Your custom logic
            const lowDigits = digitStats.filter(d => d.digit <= 4); // Digits 0-4
            const lowFreq = lowDigits.reduce((sum, d) => sum + d.frequency, 0);

            if (lowFreq > 60) {
                // Low zone is dominant
                // Find digit with highest percentage in 5-9 range for UNDER entry
                const highDigitsForUnder = digitStats.filter(d => d.digit >= 5);
                const bestHighDigit = highDigitsForUnder.sort((a, b) => b.frequency - a.frequency)[0];

                if (bestHighDigit && bestHighDigit.frequency > 8) {
                    // Above average
                    const confidence = Math.min(95, 50 + (lowFreq - 50) * 0.8 + bestHighDigit.hotColdScore * 0.3);

                    signals.push({
                        id: `patel-under-${Date.now()}`,
                        timestamp: Date.now(),
                        market: market,
                        marketDisplay: getMarketDisplay(market),
                        type: 'UNDER5' as SignalsCenterSignal['type'], // Default UNDER barrier
                        entry: currentPrice,
                        duration: '5 ticks',
                        confidence: confidence >= 75 ? 'HIGH' : confidence >= 55 ? 'MEDIUM' : 'LOW',
                        strategy: 'Patel Zone Clustering (Low)',
                        source: 'pattern',
                        status: 'ACTIVE',
                        entryDigit: bestHighDigit.digit, // Entry digit from 5-9 with highest %
                        reason: `Low zone (0-4) dominant at ${lowFreq.toFixed(1)}%. Entry digit ${bestHighDigit.digit} has ${bestHighDigit.frequency.toFixed(1)}% frequency (Hot Score: ${bestHighDigit.hotColdScore.toFixed(1)})`,
                    });
                }
            }

            // Strategy 3: Hot Digit Pursuit (Patel's original)
            const hotDigits = digitStats.filter(d => d.hotColdScore > 25);
            hotDigits.forEach(stats => {
                const confidence = Math.min(95, 55 + stats.hotColdScore * 0.4 + stats.streak * 3);

                if (confidence >= 50) {
                    signals.push({
                        id: `patel-hot-${Date.now()}-${stats.digit}`,
                        timestamp: Date.now(),
                        market: market,
                        marketDisplay: getMarketDisplay(market),
                        type: 'EVEN', // Will be determined by digit
                        entry: currentPrice,
                        duration: '5 ticks',
                        confidence: confidence >= 75 ? 'HIGH' : confidence >= 55 ? 'MEDIUM' : 'LOW',
                        strategy: 'Patel Hot Digit Pursuit',
                        source: 'pattern',
                        status: 'ACTIVE',
                        entryDigit: stats.digit,
                        reason: `Digit ${stats.digit} is trending hot with ${stats.frequency.toFixed(1)}% frequency (Hot Score: ${stats.hotColdScore.toFixed(1)})`,
                    });
                }
            });

            // Strategy 4: Cold Digit Reversal (Patel's original)
            const coldDigits = digitStats.filter(d => d.hotColdScore < -25 && d.lastSeen > 10);
            coldDigits.forEach(stats => {
                const confidence = Math.min(95, 50 + stats.lastSeen * 1.2 + Math.abs(stats.hotColdScore) * 0.2);

                if (confidence >= 50) {
                    signals.push({
                        id: `patel-cold-${Date.now()}-${stats.digit}`,
                        timestamp: Date.now(),
                        market: market,
                        marketDisplay: getMarketDisplay(market),
                        type: 'EVEN', // Will be determined by digit
                        entry: currentPrice,
                        duration: '5 ticks',
                        confidence: confidence >= 75 ? 'HIGH' : confidence >= 55 ? 'MEDIUM' : 'LOW',
                        strategy: 'Patel Cold Digit Reversal',
                        source: 'pattern',
                        status: 'ACTIVE',
                        entryDigit: stats.digit,
                        reason: `Digit ${stats.digit} is overdue (${stats.lastSeen} ticks) with cold score of ${stats.hotColdScore.toFixed(1)}`,
                    });
                }
            });

            // Strategy 5: Even/Odd Deviation (Patel's original)
            const evenDigits = digitStats.filter(d => d.digit % 2 === 0);
            const oddDigits = digitStats.filter(d => d.digit % 2 === 1);
            const evenFreq = evenDigits.reduce((sum, d) => sum + d.frequency, 0);
            const oddFreq = oddDigits.reduce((sum, d) => sum + d.frequency, 0);
            const deviation = Math.abs(evenFreq - oddFreq);

            if (deviation > 15) {
                if (evenFreq > oddFreq) {
                    const bestEven = evenDigits.sort((a, b) => b.frequency - a.frequency)[0];
                    const confidence = Math.min(95, 55 + deviation * 0.8 + bestEven.hotColdScore * 0.2);

                    signals.push({
                        id: `patel-even-${Date.now()}`,
                        timestamp: Date.now(),
                        market: market,
                        marketDisplay: getMarketDisplay(market),
                        type: 'EVEN',
                        entry: currentPrice,
                        duration: '5 ticks',
                        confidence: confidence >= 75 ? 'HIGH' : confidence >= 55 ? 'MEDIUM' : 'LOW',
                        strategy: 'Patel Even/Odd Deviation',
                        source: 'pattern',
                        status: 'ACTIVE',
                        entryDigit: bestEven.digit,
                        reason: `Even digits dominating at ${evenFreq.toFixed(1)}% vs ${oddFreq.toFixed(1)}% odd. Best even: ${bestEven.digit} (${bestEven.frequency.toFixed(1)}%)`,
                    });
                } else {
                    const bestOdd = oddDigits.sort((a, b) => b.frequency - a.frequency)[0];
                    const confidence = Math.min(95, 55 + deviation * 0.8 + bestOdd.hotColdScore * 0.2);

                    signals.push({
                        id: `patel-odd-${Date.now()}`,
                        timestamp: Date.now(),
                        market: market,
                        marketDisplay: getMarketDisplay(market),
                        type: 'ODD',
                        entry: currentPrice,
                        duration: '5 ticks',
                        confidence: confidence >= 75 ? 'HIGH' : confidence >= 55 ? 'MEDIUM' : 'LOW',
                        strategy: 'Patel Even/Odd Deviation',
                        source: 'pattern',
                        status: 'ACTIVE',
                        entryDigit: bestOdd.digit,
                        reason: `Odd digits dominating at ${oddFreq.toFixed(1)}% vs ${evenFreq.toFixed(1)}% even. Best odd: ${bestOdd.digit} (${bestOdd.frequency.toFixed(1)}%)`,
                    });
                }
            }

            console.log('🎯 Patel Analysis Complete:', {
                totalSignals: signals.length,
                highZoneFreq: highDigits.reduce((sum, d) => sum + d.frequency, 0).toFixed(1) + '%',
                lowZoneFreq: lowDigits.reduce((sum, d) => sum + d.frequency, 0).toFixed(1) + '%',
                evenFreq: evenFreq.toFixed(1) + '%',
                oddFreq: oddFreq.toFixed(1) + '%',
                deviation: deviation.toFixed(1) + '%',
            });

            return signals;
        };

        // Start subscription to REAL data
        subscribeToTicks();

        // Periodic signal generation using Patel algorithm (only if connected to real data)
        const signalInterval = setInterval(() => {
            if (realTickCount >= 20 && lastRealPrice > 0) {
                generateSignalFromRealData(currentRealMarket, lastRealPrice);
            }
        }, 15000);

        // Connection health check
        const healthCheckInterval = setInterval(() => {
            const now = Date.now();
            // If no tick received in 30 seconds, mark as disconnected
            if (lastTickTime && now - lastTickTime > 30000) {
                setIsConnectedToRealData(false);
                setConnectionError('Connection stale - no data received in 30 seconds');
            }
        }, 10000);

        return () => {
            if (unsubscribeFunc) {
                try {
                    unsubscribeFunc();
                } catch (error) {
                    console.error('Error unsubscribing:', error);
                }
            }
            clearInterval(signalInterval);
            clearInterval(healthCheckInterval);
        };
    }, [showNotifications, lastTickTime]);

    // Pattern Predictor Signal Generation - Uses REAL tick data only
    useEffect(() => {
        if (!isConnectedToRealData || tickCount < 15) return;

        const generatePatternPredictorSignal = () => {
            try {
                // Get recent ticks from the analysis service
                const recentTicks = (
                    signalAnalysisService as unknown as {
                        getRecentTicks: (count: number) => Array<{ quote: number; epoch: number }>;
                    }
                ).getRecentTicks(20);

                if (!recentTicks || recentTicks.length < 10) return;

                // Convert to pattern predictor format
                const tickData = recentTicks.map((t, idx) => ({
                    value: t.quote,
                    timestamp: t.epoch * 1000 || Date.now() - (recentTicks.length - idx) * 2000,
                }));

                // Get prediction from pattern predictor
                const prediction = patternPredictor.predict(tickData);

                // Only create signal if confidence is high enough and action is TRADE
                if (prediction.confidence >= 60 && prediction.recommendedAction === 'TRADE') {
                    const currentPrice = recentTicks[recentTicks.length - 1].quote;
                    const market = currentMarketData?.market || 'R_50';

                    const newSignal: SignalsCenterSignal = {
                        id: `pattern-pred-${Date.now()}`,
                        timestamp: Date.now(),
                        market: market,
                        marketDisplay: getMarketDisplay(market),
                        type:
                            prediction.prediction === 'RISE'
                                ? 'RISE'
                                : prediction.prediction === 'FALL'
                                  ? 'FALL'
                                  : 'RISE',
                        entry: currentPrice,
                        duration: '5 ticks',
                        confidence:
                            prediction.confidence >= 70 ? 'HIGH' : prediction.confidence >= 55 ? 'MEDIUM' : 'LOW',
                        strategy: `Pattern: ${prediction.patternType}`,
                        source: 'patternpredictor',
                        status: 'ACTIVE',
                        reason: prediction.reasoning,
                    };

                    // Add countdown validity
                    const validityDuration = calculateValidityDuration(newSignal);
                    const expiresAt = Date.now() + validityDuration * 1000;

                    const signalWithCountdown: SignalsCenterSignal = {
                        ...newSignal,
                        validityDuration,
                        expiresAt,
                        remainingTime: validityDuration,
                    };

                    // Only add if prediction is not UNCERTAIN
                    if (prediction.prediction !== 'UNCERTAIN') {
                        setPatternPredictorSignals(prev => [signalWithCountdown, ...prev].slice(0, 20));
                        console.log(
                            '🔮 Pattern Predictor Signal:',
                            prediction.prediction,
                            `(${prediction.confidence}%)`
                        );
                    }
                }
            } catch (error) {
                console.warn('Pattern predictor signal generation failed:', error);
            }
        };

        // Generate pattern predictor signals every 20 seconds
        const patternInterval = setInterval(generatePatternPredictorSignal, 20000);

        // Initial generation
        generatePatternPredictorSignal();

        return () => clearInterval(patternInterval);
    }, [isConnectedToRealData, tickCount, currentMarketData]);

    // Multi-Market Automatic Scanning - Generates signals from pattern analysis
    useEffect(() => {
        if (!isConnectedToRealData || tickCount < 15) return;

        const generateMultiMarketSignal = () => {
            try {
                const recentTicks = (
                    signalAnalysisService as unknown as {
                        getRecentTicks: (count: number) => Array<{ quote: number; epoch: number }>;
                    }
                ).getRecentTicks(20);

                if (!recentTicks || recentTicks.length < 10) return;

                const tickData = recentTicks.map((t, idx) => ({
                    value: t.quote,
                    timestamp: t.epoch * 1000 || Date.now() - (recentTicks.length - idx) * 2000,
                }));

                const prediction = patternPredictor.predict(tickData);

                if (
                    prediction.confidence >= 65 &&
                    prediction.recommendedAction === 'TRADE' &&
                    prediction.prediction !== 'UNCERTAIN'
                ) {
                    const currentPrice = recentTicks[recentTicks.length - 1].quote;
                    const market = currentMarketData?.market || 'R_50';

                    const newSignal: SignalsCenterSignal = {
                        id: `multimarket-${Date.now()}`,
                        timestamp: Date.now(),
                        market: market,
                        marketDisplay: getMarketDisplay(market),
                        type: prediction.prediction === 'RISE' ? 'RISE' : 'FALL',
                        entry: currentPrice,
                        duration: '5 ticks',
                        confidence: prediction.confidence >= 70 ? 'HIGH' : 'MEDIUM',
                        strategy: `Multi-Market Scan: ${prediction.patternType}`,
                        source: 'multimarket',
                        status: 'ACTIVE',
                        reason: prediction.reasoning,
                    };

                    // Add countdown validity
                    const validityDuration = calculateValidityDuration(newSignal);
                    const expiresAt = Date.now() + validityDuration * 1000;

                    const signalWithCountdown: SignalsCenterSignal = {
                        ...newSignal,
                        validityDuration,
                        expiresAt,
                        remainingTime: validityDuration,
                    };

                    setMultiMarketSignals(prev => [signalWithCountdown, ...prev].slice(0, 15));
                    console.log('🌍 Multi-Market Signal:', prediction.prediction, `(${prediction.confidence}%)`);
                }
            } catch (error) {
                console.warn('Multi-market signal generation failed:', error);
            }
        };

        const multiMarketInterval = setInterval(generateMultiMarketSignal, 25000);
        generateMultiMarketSignal();

        return () => clearInterval(multiMarketInterval);
    }, [isConnectedToRealData, tickCount, currentMarketData]);

    // Jump signals removed as requested by user

    // Hot/Cold Zone Signal Generation - Superior accuracy (70-85%)
    useEffect(() => {
        if (!isConnectedToRealData || tickCount < 20 || !enabledGenerators.hotCold) return;

        const generateHotColdZoneSignal = async () => {
            try {
                console.log('🔥❄️ Generating Hot/Cold Zone signal...');

                const hotColdSignal = await hotColdZoneScannerService.scanForHotColdZones();

                if (hotColdSignal) {
                    const newSignal: SignalsCenterSignal = {
                        id: `hotcold-${Date.now()}`,
                        timestamp: Date.now(),
                        market: hotColdSignal.market,
                        marketDisplay: hotColdSignal.marketName,
                        type:
                            hotColdSignal.recommendation.action === 'OVER'
                                ? (`OVER${hotColdSignal.recommendation.barrier}` as SignalsCenterSignal['type'])
                                : (`UNDER${hotColdSignal.recommendation.barrier}` as SignalsCenterSignal['type']),
                        entry: hotColdSignal.currentPrice,
                        duration: '5 ticks',
                        confidence:
                            hotColdSignal.confidence >= 80 ? 'HIGH' : hotColdSignal.confidence >= 60 ? 'MEDIUM' : 'LOW',
                        strategy: `Raziel: ${hotColdSignal.signalType}`,
                        source: 'hotcoldzone',
                        status: 'ACTIVE',
                        entryDigit: hotColdSignal.targetDigit,
                        reason: hotColdSignal.recommendation.reasoning,
                    };

                    // Add countdown validity
                    const validityDuration = calculateValidityDuration(newSignal);
                    const expiresAt = Date.now() + validityDuration * 1000;

                    const signalWithCountdown: SignalsCenterSignal = {
                        ...newSignal,
                        validityDuration,
                        expiresAt,
                        remainingTime: validityDuration,
                    };

                    setHotColdZoneSignals(prev => [signalWithCountdown, ...prev].slice(0, 10));
                    console.log(
                        '🎯 Hot/Cold Zone Signal:',
                        hotColdSignal.signalType,
                        `(${hotColdSignal.confidence.toFixed(1)}%)`
                    );
                }
            } catch (error) {
                console.warn('Hot/Cold Zone signal generation failed:', error);
            }
        };

        // Generate Hot/Cold Zone signals every 30 seconds
        const hotColdInterval = setInterval(generateHotColdZoneSignal, 30000);

        // Initial generation after 5 seconds
        setTimeout(generateHotColdZoneSignal, 5000);

        return () => clearInterval(hotColdInterval);
    }, [isConnectedToRealData, tickCount, enabledGenerators.hotCold]);

    // Digit Distribution Signal Generation - Superior statistical analysis
    useEffect(() => {
        if (!isConnectedToRealData || tickCount < 20 || !enabledGenerators.patelDistribution) return;

        const generateDigitDistributionSignal = async () => {
            try {
                console.log('📊 Generating Digit Distribution signal...');

                const distributionSignal = await digitDistributionScannerService.scanForDistributionDeviations();

                if (distributionSignal) {
                    const newSignal: SignalsCenterSignal = {
                        id: `distribution-${Date.now()}`,
                        timestamp: Date.now(),
                        market: distributionSignal.market,
                        marketDisplay: distributionSignal.marketName,
                        type:
                            distributionSignal.recommendation.action === 'OVER'
                                ? (`OVER${distributionSignal.recommendation.barrier}` as SignalsCenterSignal['type'])
                                : (`UNDER${distributionSignal.recommendation.barrier}` as SignalsCenterSignal['type']),
                        entry: distributionSignal.currentPrice,
                        duration: '5 ticks',
                        confidence:
                            distributionSignal.confidence >= 80
                                ? 'HIGH'
                                : distributionSignal.confidence >= 60
                                  ? 'MEDIUM'
                                  : 'LOW',
                        strategy: `Patel: ${distributionSignal.signalType}`,
                        source: 'digitdistribution',
                        status: 'ACTIVE',
                        entryDigit: distributionSignal.targetDigit,
                        reason: distributionSignal.recommendation.reasoning,
                    };

                    // Add countdown validity
                    const validityDuration = calculateValidityDuration(newSignal);
                    const expiresAt = Date.now() + validityDuration * 1000;

                    const signalWithCountdown: SignalsCenterSignal = {
                        ...newSignal,
                        validityDuration,
                        expiresAt,
                        remainingTime: validityDuration,
                    };

                    setDigitDistributionSignals(prev => [signalWithCountdown, ...prev].slice(0, 10));
                    console.log(
                        '🎯 Digit Distribution Signal:',
                        distributionSignal.signalType,
                        `(${distributionSignal.confidence.toFixed(1)}%)`
                    );
                }
            } catch (error) {
                console.warn('Digit Distribution signal generation failed:', error);
            }
        };

        // Generate Digit Distribution signals every 35 seconds (offset from Hot/Cold)
        const distributionInterval = setInterval(generateDigitDistributionSignal, 35000);

        // Initial generation after 10 seconds
        setTimeout(generateDigitDistributionSignal, 10000);

        return () => clearInterval(distributionInterval);
    }, [isConnectedToRealData, tickCount, enabledGenerators.patelDistribution]);

    // AI Signal Intelligence Generation - Neural network-based analysis
    useEffect(() => {
        if (!isConnectedToRealData || tickCount < 30 || !enabledGenerators.aiIntelligence) return;

        const generateAISignal = async () => {
            try {
                console.log('🧠 Generating AI Intelligence signal...');

                // Get recent tick data for AI analysis
                const recentTicks = (
                    signalAnalysisService as unknown as {
                        getRecentTicks: (count: number) => Array<{ quote: number }>;
                    }
                ).getRecentTicks(100);

                if (recentTicks && recentTicks.length >= 30) {
                    const quotes = recentTicks.map((t: { quote: number }) => t.quote);
                    const aiPrediction = aiSignalIntelligence.generateAISignal('R_50', quotes);

                    if (aiPrediction) {
                        console.log('🧠 AI Signal Generated:', {
                            type: aiPrediction.signalType,
                            confidence: aiPrediction.confidence.toFixed(1) + '%',
                            neuralScore: (aiPrediction.neuralScore * 100).toFixed(1) + '%',
                            riskLevel: aiPrediction.riskLevel,
                            sentiment: aiPrediction.marketSentiment.sentiment,
                        });

                        const newSignal: SignalsCenterSignal = {
                            id: `ai-intelligence-${Date.now()}`,
                            timestamp: Date.now(),
                            market: 'R_50',
                            marketDisplay: 'Volatility 50',
                            type: aiPrediction.signalType,
                            entry: quotes[quotes.length - 1],
                            duration: '5 ticks',
                            confidence:
                                aiPrediction.confidence >= 75
                                    ? 'HIGH'
                                    : aiPrediction.confidence >= 55
                                      ? 'MEDIUM'
                                      : 'LOW',
                            strategy: `AI Neural Network (Score: ${(aiPrediction.neuralScore * 100).toFixed(1)}%)`,
                            source: 'ai',
                            status: 'ACTIVE',
                            reason: `AI Analysis: ${aiPrediction.reasoning.join(' | ')}. Risk: ${aiPrediction.riskLevel}. Sentiment: ${aiPrediction.marketSentiment.sentiment} (${aiPrediction.marketSentiment.strength.toFixed(1)}%)`,
                        };

                        // Add AI-specific metadata
                        if (aiPrediction.supportingPatterns.length > 0) {
                            newSignal.reason += ` | Patterns: ${aiPrediction.supportingPatterns.join(', ')}`;
                        }

                        // Add countdown validity
                        const validityDuration = calculateValidityDuration(newSignal);
                        const expiresAt = Date.now() + validityDuration * 1000;

                        const signalWithCountdown: SignalsCenterSignal = {
                            ...newSignal,
                            validityDuration,
                            expiresAt,
                            remainingTime: validityDuration,
                        };

                        // Apply risk mode transformation
                        const transformedSignal = transformSignalForRiskMode(signalWithCountdown);

                        setAiSignals(prev => [transformedSignal, ...prev].slice(0, 10));
                        setLatestSignal(transformedSignal);

                        console.log('🧠 AI Intelligence Signal added:', {
                            id: transformedSignal.id,
                            type: transformedSignal.type,
                            confidence: transformedSignal.confidence,
                            validFor: `${validityDuration}s`,
                        });
                    }
                }
            } catch (error) {
                console.warn('AI Intelligence signal generation failed:', error);
            }
        };

        // Generate AI signals every 25 seconds (offset from other generators)
        const aiInterval = setInterval(generateAISignal, 25000);

        // Initial generation after 15 seconds
        setTimeout(generateAISignal, 15000);

        return () => clearInterval(aiInterval);
    }, [isConnectedToRealData, tickCount, enabledGenerators.aiIntelligence]);

    // Combine all signals
    const allSignals = [
        ...signals,
        ...flippingSignals,
        ...evenOddSignals,
        ...dynamicSignals,
        ...riseFallSignals,
        ...patternPredictorSignals,
        ...multiMarketSignals,
        ...jumpSignals,
        ...hotColdZoneSignals,
        ...digitDistributionSignals,
        ...digitHackerSignals,
        ...aiSignals,
    ];

    // Filter signals with enhanced categorization (MOVED BEFORE useEffect that uses it)
    const filteredSignals = allSignals.filter(signal => {
        // Enhanced source filtering with new categories
        if (activeSource !== 'all') {
            if (activeSource === 'exact_digit') {
                const category = getSignalCategory(signal);
                if (category.category !== 'EXACT_DIGIT') return false;
            } else if (activeSource === 'range_prediction') {
                const category = getSignalCategory(signal);
                if (category.category !== 'RANGE_PREDICTION') return false;
            } else if (activeSource === 'hotcoldzone') {
                if (signal.source !== 'hotcoldzone') return false;
            } else if (activeSource === 'digitdistribution') {
                if (signal.source !== 'digitdistribution') return false;
            } else if (signal.source !== activeSource) {
                return false;
            }
        }

        if (filterMarket !== 'all' && signal.market !== filterMarket) return false;
        if (filterStrategy !== 'all' && signal.strategy !== filterStrategy) return false;

        if (filterTime !== 'all') {
            const now = Date.now();
            const timeLimits: Record<string, number> = {
                '1m': 1 * 60 * 1000,
                '2m': 2 * 60 * 1000,
                '3m': 3 * 60 * 1000,
                '5m': 5 * 60 * 1000,
                '10m': 10 * 60 * 1000,
            };
            const timeLimit = timeLimits[filterTime];
            if (timeLimit && now - signal.timestamp > timeLimit) return false;
        }

        return true;
    });

    // Debug log for signal counts - ENHANCED with detailed breakdown
    useEffect(() => {
        console.log('🔍 SIGNAL DEBUG - Complete Breakdown:', {
            totalSignals: allSignals.length,
            breakdown: {
                main: signals.length,
                flipping: flippingSignals.length,
                evenOdd: evenOddSignals.length,
                dynamic: dynamicSignals.length,
                riseFall: riseFallSignals.length,
                patternPredictor: patternPredictorSignals.length,
                multiMarket: multiMarketSignals.length,
                jump: jumpSignals.length,
                hotCold: hotColdZoneSignals.length,
                digitDistribution: digitDistributionSignals.length,
                digitHacker: digitHackerSignals.length,
                ai: aiSignals.length,
            },
            filtered: filteredSignals.length,
            activeSource,
            riskMode,
            isConnected: isConnectedToRealData,
            connectionError: connectionError || 'None',
            tickCount,
            lastTickTime: lastTickTime ? new Date(lastTickTime).toLocaleTimeString() : 'Never',
        });
    }, [
        allSignals.length,
        signals.length,
        flippingSignals.length,
        evenOddSignals.length,
        dynamicSignals.length,
        riseFallSignals.length,
        patternPredictorSignals.length,
        multiMarketSignals.length,
        jumpSignals.length,
        hotColdZoneSignals.length,
        digitDistributionSignals.length,
        filteredSignals.length,
        activeSource,
        riskMode,
        isConnectedToRealData,
        connectionError,
        tickCount,
        lastTickTime,
    ]);

    // Debug log for filtering
    useEffect(() => {
        if (allSignals.length > 0) {
            console.log('🔍 Signal Filtering Debug:', {
                totalSignals: allSignals.length,
                filteredSignals: filteredSignals.length,
                activeSource,
                filterMarket,
                filterStrategy,
                filterTime,
                signalsBySource: {
                    evenodd: allSignals.filter(s => s.source === 'evenodd').length,
                    risefall: allSignals.filter(s => s.source === 'risefall').length,
                    ai: allSignals.filter(s => s.source === 'ai').length,
                    pattern: allSignals.filter(s => s.source === 'pattern').length,
                    technical: allSignals.filter(s => s.source === 'technical').length,
                },
            });
        }
    }, [allSignals.length, filteredSignals.length, activeSource, filterMarket, filterStrategy, filterTime]);

    // Execute single trade batch
    const executeTradeBatch = async (signal: SignalsCenterSignal, batchNumber: number, totalBatches: number) => {
        // Get current stake from StakeManager (centralized)
        const { stakeManager } = await import('@/services/stake-manager.service');
        let currentStake = stakeManager.getStake();
        const currentMartingale = stakeManager.getMartingale();

        const numberOfRuns = tradeRuns[signal.id] || 1;
        const selectedPrediction = martingalePredictions[signal.id] || signal.type;
        const enableMartingale = useMartingale[signal.id] || false;
        const multiplier = martingaleMultiplier[signal.id] || currentMartingale; // Use StakeManager martingale as default
        const ticks = tickDuration[signal.id] || 5;
        const maxTrades = autoLoopRuns[signal.id] || 1;

        console.log(`🔄 Batch ${batchNumber}/${totalBatches} - Executing ${numberOfRuns} run(s)...`);
        console.log(`⚙️ Settings: Ticks=${ticks}, Martingale=${enableMartingale ? `ON (${multiplier}x)` : 'OFF'}`);

        // Use custom tick duration
        const duration = ticks;
        const durationUnit = 't';

        // Get barrier for digit contracts
        let barrier: string | undefined;
        if (signal.entryDigit !== undefined) {
            barrier = signal.entryDigit.toString();
        }

        let totalProfit = 0;
        let successfulRuns = 0;
        let failedRuns = 0;
        let currentAutoStake = currentStake; // Start with StakeManager stake

        for (let run = 1; run <= maxTrades; run++) {
            const tradeWon = false;
            console.log(`📍 Trade ${run}/${maxTrades} - Stake: $${currentStake.toFixed(2)}`);

            const result = await signalTradingService.executeSignalTrade(
                {
                    signalId: `${signal.id}-batch${batchNumber}-run${run}`,
                    market: signal.market,
                    type: selectedPrediction as SignalsCenterSignal['type'],
                    stake: currentStake,
                    duration,
                    durationUnit: durationUnit as 't' | 'm' | 'h',
                    barrier,
                },
                tradeResult => {
                    totalProfit += tradeResult.profit || 0;
                    if (tradeResult.isWon) {
                        successfulRuns++;
                        // Reset stake on win if martingale is enabled
                        if (enableMartingale) {
                            currentStake = DEFAULT_STAKE;
                            console.log(`✅ Win! Stake reset to $${currentStake.toFixed(2)}`);
                        }
                    } else {
                        failedRuns++;
                        // Increase stake on loss if martingale is enabled
                        if (enableMartingale) {
                            currentStake = currentStake * multiplier;
                            console.log(`❌ Loss! Stake increased to $${currentStake.toFixed(2)}`);
                        }
                    }
                    setTradeStats(signalTradingService.getStats());
                }
            );

            if (!result.success) {
                failedRuns++;
                // Increase stake on failed trade if martingale is enabled

                if (enableMartingale) {
                    currentStake = currentStake * multiplier;
                }

                // Stop on win when martingale is enabled

                if (enableMartingale && tradeWon) {
                    console.log(`✅ Win! Stopping martingale sequence.`);

                    break;
                }
            }

            if (run < maxTrades) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return { totalProfit, successfulRuns, failedRuns };
    };

    // Handle auto-loop trading
    const handleAutoLoopTrade = async (signal: SignalsCenterSignal) => {
        console.log('🔁 Auto-Loop Trade started for signal:', signal.id);

        if (signal.isTrading || isAutoLooping[signal.id]) {
            console.log('⚠️ Signal already trading, ignoring click');
            return;
        }

        const loopCount = autoLoopRuns[signal.id] || 1;
        if (loopCount <= 1) {
            // If loop count is 1 or less, just do regular trade
            return handleTradeSignal(signal);
        }

        // Mark as auto-looping
        setIsAutoLooping(prev => ({ ...prev, [signal.id]: true }));
        setSignals(prev => prev.map(s => (s.id === signal.id ? { ...s, isTrading: true, status: 'TRADING' } : s)));

        let grandTotalProfit = 0;
        let grandTotalWins = 0;
        let grandTotalLosses = 0;

        for (let batch = 1; batch <= loopCount; batch++) {
            // Check if user stopped the loop
            if (!isAutoLooping[signal.id]) {
                console.log('🛑 Auto-loop stopped by user');
                break;
            }

            console.log(`\n🔄 === BATCH ${batch}/${loopCount} ===`);
            const batchResult = await executeTradeBatch(signal, batch, loopCount);

            grandTotalProfit += batchResult.totalProfit;
            grandTotalWins += batchResult.successfulRuns;
            grandTotalLosses += batchResult.failedRuns;

            console.log(`✅ Batch ${batch} complete. Profit: ${batchResult.totalProfit.toFixed(2)}`);
            console.log(`📊 Grand Total: ${grandTotalProfit.toFixed(2)} (${grandTotalWins}W/${grandTotalLosses}L)`);

            // Delay between batches (except for last batch)
            if (batch < loopCount) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Update signal with final results
        console.log(`\n🏁 Auto-loop completed. Grand Total: ${grandTotalProfit.toFixed(2)}`);
        setIsAutoLooping(prev => ({ ...prev, [signal.id]: false }));
        setSignals(prev =>
            prev.map(s =>
                s.id === signal.id
                    ? {
                          ...s,
                          isTrading: false,
                          status: grandTotalWins > grandTotalLosses ? 'WON' : 'LOST',
                          result: grandTotalProfit,
                      }
                    : s
            )
        );
    };

    // Stop auto-loop
    const stopAutoLoop = (signalId: string) => {
        console.log('🛑 Stopping auto-loop for signal:', signalId);
        setIsAutoLooping(prev => ({ ...prev, [signalId]: false }));
    };

    // Handle stake modal confirmation
    const handleStakeModalConfirm = (stake: number, martingale: number) => {
        console.log('💰 Stake settings updated:', { stake, martingale });
        // Settings are already saved by StakeManager in the modal
        // This callback can be used for additional actions if needed
    };

    // Load CFX Even Odd Bot for EVEN/ODD signals
    const loadCFXEvenOddBot = async (signal: SignalsCenterSignal) => {
        try {
            console.log('🎲 Loading CFX Even Odd Bot for', signal.type);
            console.log('📋 Signal details:', {
                type: signal.type,
                market: signal.market,
                marketDisplay: signal.marketDisplay,
            });

            // Verify market value
            if (!signal.market) {
                throw new Error('Signal market is not defined');
            }

            // Fetch CFX Even Odd Bot XML
            const response = await fetch('/CFX-EvenOdd.xml');
            if (!response.ok) {
                throw new Error(`Failed to fetch CFX Even Odd Bot: ${response.statusText}`);
            }

            let botXml = await response.text();

            // Parse and configure XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(botXml, 'text/xml');

            // Update market (SYMBOL_LIST) - This sets the exact volatility from the signal
            const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
            console.log('🔍 Found', symbolFields.length, 'SYMBOL_LIST fields');

            if (symbolFields.length === 0) {
                console.warn('⚠️ No SYMBOL_LIST fields found in XML template');
            }

            symbolFields.forEach((field, index) => {
                const oldValue = field.textContent;
                field.textContent = signal.market;
                console.log(`📊 Market Field ${index}: "${oldValue}" → "${signal.market}" (${signal.marketDisplay})`);
            });

            // Determine contract type (DIGITEVEN or DIGITODD)
            const contractType = signal.type === 'EVEN' ? 'DIGITEVEN' : 'DIGITODD';

            // Update TYPE_LIST (contract type in trade definition)
            const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
            console.log('🔍 Found', typeFields.length, 'TYPE_LIST fields');
            typeFields.forEach((field, index) => {
                console.log(`📝 Field ${index} before:`, field.textContent);
                field.textContent = contractType;
                console.log(`📝 Field ${index} after:`, field.textContent);
            });

            // Update PURCHASE_LIST (contract type in purchase block)
            const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
            purchaseFields.forEach(field => {
                field.textContent = contractType;
                console.log('💰 Set purchase type to:', contractType);
            });

            // Apply StakeManager settings using centralized service
            const { stakeManager } = await import('@/services/stake-manager.service');
            const { signalBotLoader } = await import('@/services/signal-bot-loader.service');

            console.log('💰 Applying StakeManager settings using centralized service:', {
                stake: stakeManager.getStake(),
                martingale: stakeManager.getMartingale(),
                isCustom: stakeManager.hasCustomSettings(),
            });

            // Use centralized service to apply both stake and martingale settings
            const updateResult = signalBotLoader.applyStakeManagerSettings(xmlDoc);

            console.log('✅ Centralized StakeManager Update Results (CFX Even Odd):', {
                fieldsUpdated: updateResult.fieldsUpdated,
                stakeUpdated: updateResult.stakeUpdated,
                martingaleUpdated: updateResult.martingaleUpdated,
                details: updateResult.details,
            });

            if (!updateResult.martingaleUpdated) {
                console.warn('⚠️ Martingale was not updated by centralized service');
                console.warn('⚠️ Bot will use default martingale value');
            } else {
                console.log(`🎉 SUCCESS: Martingale ${stakeManager.getMartingale()}x applied via centralized service!`);
            }

            // Serialize back to XML
            const serializer = new XMLSerializer();
            botXml = serializer.serializeToString(xmlDoc);

            // Switch to Bot Builder tab
            setActiveTab(DBOT_TABS.BOT_BUILDER);

            // Wait for tab to load
            await new Promise(resolve => setTimeout(resolve, 500));

            // Load the bot
            if (window.load_modal && typeof window.load_modal.loadStrategyToBuilder === 'function') {
                console.log('📤 Loading CFX Even Odd Bot to builder...');
                console.log('🎯 Configuration Summary:');
                console.log(`   Market: ${signal.market} (${signal.marketDisplay})`);
                console.log(`   Type: ${signal.type} (${contractType})`);
                console.log(`   Stake: ${stakeManager.getStake()} (from StakeManager)`);
                console.log(`   Martingale: ${stakeManager.getMartingale()}x (from StakeManager)`);

                await window.load_modal.loadStrategyToBuilder({
                    id: `cfx-evenodd-${signal.id}`,
                    name: `CFX Even Odd - ${signal.marketDisplay} - ${signal.type}`,
                    xml: botXml,
                    save_type: 'LOCAL',
                    timestamp: Date.now(),
                });

                console.log('✅ CFX Even Odd Bot loaded successfully!');
                console.log(`✅ Bot is now configured for ${signal.marketDisplay}`);

                // Auto-run the bot after loading (run immediately)
                setTimeout(() => {
                    console.log('🚀 AUTO-RUN: Starting CFX Even Odd Bot after configuration...');
                    console.log('🎯 AUTO-RUN: Looking for run button...');
                    try {
                        // Trigger the run button click programmatically
                        const runButton = document.getElementById('db-animation__run-button');
                        if (runButton) {
                            console.log('✅ AUTO-RUN: Run button found, clicking now...');
                            runButton.click();
                            console.log('🎉 AUTO-RUN: CFX Even Odd Bot auto-started successfully!');

                            // Show a brief success notification
                            console.log(
                                `🎯 AUTO-RUN COMPLETE: ${signal.type} bot is now running for ${signal.marketDisplay}`
                            );
                        } else {
                            console.warn('⚠️ AUTO-RUN: Run button not found, trying alternative method...');
                            // Alternative method: dispatch run button event
                            const runEvent = new CustomEvent('bot.auto.run');
                            window.dispatchEvent(runEvent);
                            console.log('🔄 AUTO-RUN: Dispatched alternative run event');
                        }
                    } catch (error) {
                        console.error('❌ AUTO-RUN ERROR: Failed to auto-run CFX Even Odd Bot:', error);
                    }
                }, 0); // Run immediately
            } else {
                throw new Error('Bot loader not available');
            }
        } catch (error) {
            console.error('❌ Failed to load CFX Even Odd Bot:', error);
            alert(`Failed to load bot: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Load CFX Rise Fall Bot for RISE/FALL signals
    const loadCFXRiseFallBot = async (signal: SignalsCenterSignal) => {
        try {
            console.log('🚀 Loading CFX Rise Fall Bot for', signal.type);
            console.log('📋 Signal details:', {
                type: signal.type,
                market: signal.market,
                marketDisplay: signal.marketDisplay,
            });

            // Verify market value
            if (!signal.market) {
                throw new Error('Signal market is not defined');
            }

            // Fetch CFX Rise Fall Bot XML
            const response = await fetch('/CFX-RiseFall.xml');
            if (!response.ok) {
                throw new Error(`Failed to fetch CFX Rise Fall Bot: ${response.statusText}`);
            }

            let botXml = await response.text();

            // Parse and configure XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(botXml, 'text/xml');

            // Update market (SYMBOL_LIST) - This sets the exact volatility from the signal
            const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
            console.log('🔍 Found', symbolFields.length, 'SYMBOL_LIST fields');

            if (symbolFields.length === 0) {
                console.warn('⚠️ No SYMBOL_LIST fields found in XML template');
            }

            symbolFields.forEach((field, index) => {
                const oldValue = field.textContent;
                field.textContent = signal.market;
                console.log(`📊 Market Field ${index}: "${oldValue}" → "${signal.market}" (${signal.marketDisplay})`);
            });

            // Determine contract type (CALL or PUT)
            const contractType = signal.type === 'RISE' ? 'CALL' : 'PUT';

            // Update TYPE_LIST (contract type in trade definition)
            const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
            console.log('🔍 Found', typeFields.length, 'TYPE_LIST fields');
            typeFields.forEach((field, index) => {
                console.log(`📝 Field ${index} before:`, field.textContent);
                field.textContent = contractType;
                console.log(`📝 Field ${index} after:`, field.textContent);
            });

            // Update PURCHASE_LIST (contract type in purchase block)
            const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
            purchaseFields.forEach(field => {
                field.textContent = contractType;
                console.log('💰 Set purchase type to:', contractType);
            });

            // Apply StakeManager settings using centralized service
            const { stakeManager } = await import('@/services/stake-manager.service');
            const { signalBotLoader } = await import('@/services/signal-bot-loader.service');

            console.log('💰 Applying StakeManager settings using centralized service:', {
                stake: stakeManager.getStake(),
                martingale: stakeManager.getMartingale(),
                isCustom: stakeManager.hasCustomSettings(),
            });

            // Use centralized service to apply both stake and martingale settings
            const updateResult = signalBotLoader.applyStakeManagerSettings(xmlDoc);

            console.log('✅ Centralized StakeManager Update Results (CFX Rise Fall):', {
                fieldsUpdated: updateResult.fieldsUpdated,
                stakeUpdated: updateResult.stakeUpdated,
                martingaleUpdated: updateResult.martingaleUpdated,
                details: updateResult.details,
            });

            if (!updateResult.martingaleUpdated) {
                console.warn('⚠️ Martingale was not updated by centralized service');
                console.warn('⚠️ Bot will use default martingale value');
            } else {
                console.log(`🎉 SUCCESS: Martingale ${stakeManager.getMartingale()}x applied via centralized service!`);
            }

            // Serialize back to XML
            const serializer = new XMLSerializer();
            botXml = serializer.serializeToString(xmlDoc);

            // Switch to Bot Builder tab
            setActiveTab(DBOT_TABS.BOT_BUILDER);

            // Wait for tab to load
            await new Promise(resolve => setTimeout(resolve, 500));

            // Load the bot
            if (window.load_modal && typeof window.load_modal.loadStrategyToBuilder === 'function') {
                console.log('📤 Loading CFX Rise Fall Bot to builder...');
                console.log('🎯 Configuration Summary:');
                console.log(`   Market: ${signal.market} (${signal.marketDisplay})`);
                console.log(`   Type: ${signal.type} (${contractType})`);
                console.log(`   Stake: ${stakeManager.getStake()} (from StakeManager)`);
                console.log(`   Martingale: ${stakeManager.getMartingale()}x (from StakeManager)`);

                await window.load_modal.loadStrategyToBuilder({
                    id: `cfx-risefall-${signal.id}`,
                    name: `CFX Rise Fall - ${signal.marketDisplay} - ${signal.type}`,
                    xml: botXml,
                    save_type: 'LOCAL',
                    timestamp: Date.now(),
                });

                console.log('✅ CFX Rise Fall Bot loaded successfully!');
                console.log(`✅ Bot is now configured for ${signal.marketDisplay}`);

                // Auto-run the bot after loading (with a small delay to ensure it's fully loaded)
                setTimeout(() => {
                    console.log('🚀 AUTO-RUN: Starting CFX Rise Fall Bot after configuration...');
                    console.log('🎯 AUTO-RUN: Looking for run button...');
                    try {
                        // Trigger the run button click programmatically
                        const runButton = document.getElementById('db-animation__run-button');
                        if (runButton) {
                            console.log('✅ AUTO-RUN: Run button found, clicking now...');
                            runButton.click();
                            console.log('🎉 AUTO-RUN: CFX Rise Fall Bot auto-started successfully!');

                            // Show a brief success notification
                            console.log(
                                `🎯 AUTO-RUN COMPLETE: ${signal.type} bot is now running for ${signal.marketDisplay}`
                            );
                        } else {
                            console.warn('⚠️ AUTO-RUN: Run button not found, trying alternative method...');
                            // Alternative method: dispatch run button event
                            const runEvent = new CustomEvent('bot.auto.run');
                            window.dispatchEvent(runEvent);
                            console.log('🔄 AUTO-RUN: Dispatched alternative run event');
                        }
                    } catch (error) {
                        console.error('❌ AUTO-RUN ERROR: Failed to auto-run CFX Rise Fall Bot:', error);
                    }
                }, 0); // Run immediately
            } else {
                throw new Error('Bot loader not available');
            }
        } catch (error) {
            console.error('❌ Failed to load CFX Rise Fall Bot:', error);
            alert(`Failed to load bot: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Load PATEL (with Entry) Bot for OVER/UNDER signals
    const loadPatelBot = async (signal: SignalsCenterSignal) => {
        try {
            console.log('🎯 Loading PATEL (with Entry) Bot for', signal.type);
            console.log('📋 Signal details:', {
                type: signal.type,
                market: signal.market,
                marketDisplay: signal.marketDisplay,
                entryDigit: signal.entryDigit,
                searchNumber: signal.entryDigit, // Entry digit becomes search number
            });

            // Verify market value
            if (!signal.market) {
                throw new Error('Signal market is not defined');
            }

            // Calculate adaptive recovery strategy for OVER/UNDER signals
            let recoveryStrategy: any = null;
            if (signal.type.startsWith('OVER') || signal.type.startsWith('UNDER')) {
                try {
                    const { adaptiveRecoveryStrategy } = await import('@/services/adaptive-recovery-strategy.service');

                    // Determine if barrier was adjusted and get the values
                    const extractedDigit = parseInt(signal.type.replace(/[^0-9]/g, ''));
                    const isBarrierAdjusted = !isNaN(extractedDigit) && signal.entryDigit === extractedDigit;

                    let finalSignalType = signal.type;
                    let originalBarrier = extractedDigit;

                    if (isBarrierAdjusted && signal.entryDigit !== undefined) {
                        // Calculate the adjusted signal type for recovery strategy
                        if (signal.type.startsWith('OVER')) {
                            const adjustedBarrier = Math.max(1, extractedDigit - 1);
                            finalSignalType = `OVER${adjustedBarrier}` as SignalsCenterSignal['type'];
                        } else if (signal.type.startsWith('UNDER')) {
                            const adjustedBarrier = Math.min(9, extractedDigit + 1);
                            finalSignalType = `UNDER${adjustedBarrier}` as SignalsCenterSignal['type'];
                        }
                    }

                    recoveryStrategy = adaptiveRecoveryStrategy.generateComprehensiveConfig(
                        finalSignalType, // e.g., "OVER3" (adjusted from OVER4)
                        85, // High confidence for signal-generated trades
                        'STRONG',
                        signal.entryDigit, // Entry digit (e.g., 4)
                        isBarrierAdjusted ? originalBarrier : undefined // Original barrier (e.g., 4)
                    );

                    if (recoveryStrategy && recoveryStrategy.isValid) {
                        console.log('🧠 Adaptive Recovery Strategy Applied:', {
                            originalSignal: signal.type,
                            adjustedSignal: finalSignalType,
                            entryDigit: signal.entryDigit,
                            isBarrierAdjusted,
                            predictionBeforeLoss: recoveryStrategy.predictionBeforeLoss,
                            predictionAfterLoss: recoveryStrategy.predictionAfterLoss,
                            winProbBeforeLoss: `${recoveryStrategy.winProbabilities.beforeLoss}%`,
                            winProbAfterLoss: `${recoveryStrategy.winProbabilities.afterLoss}%`,
                            reasoning: recoveryStrategy.reasoning,
                        });
                    } else {
                        console.warn('⚠️ Could not generate valid adaptive recovery strategy');
                    }
                } catch (error) {
                    console.error('❌ Error calculating adaptive recovery strategy:', error);
                }
            }

            // Fetch PATEL (with Entry) Bot XML
            const response = await fetch('/PATEL (with Entry).xml');
            if (!response.ok) {
                throw new Error(`Failed to fetch PATEL Bot: ${response.statusText}`);
            }

            let botXml = await response.text();

            // Parse and configure XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(botXml, 'text/xml');

            // Update market (SYMBOL_LIST) - This sets the exact volatility from the signal
            const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
            console.log('🔍 Found', symbolFields.length, 'SYMBOL_LIST fields');

            if (symbolFields.length === 0) {
                console.warn('⚠️ No SYMBOL_LIST fields found in XML template');
            }

            symbolFields.forEach((field, index) => {
                const oldValue = field.textContent;
                field.textContent = signal.market;
                console.log(`📊 Market Field ${index}: "${oldValue}" → "${signal.market}" (${signal.marketDisplay})`);
            });

            // Determine contract type (DIGITOVER or DIGITUNDER)
            const contractType = signal.type.startsWith('OVER') ? 'DIGITOVER' : 'DIGITUNDER';

            // Update TYPE_LIST (contract type in trade definition)
            const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
            console.log('🔍 Found', typeFields.length, 'TYPE_LIST fields');
            typeFields.forEach((field, index) => {
                console.log(`📝 Field ${index} before:`, field.textContent);
                field.textContent = contractType;
                console.log(`📝 Field ${index} after:`, field.textContent);
            });

            // Update PURCHASE_LIST (contract type in purchase block)
            const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
            purchaseFields.forEach(field => {
                field.textContent = contractType;
                console.log('💰 Set purchase type to:', contractType);
            });

            // PATEL Bot specific: Set search number to entry digit
            // In PATEL bot, the search number is the entry point (hot digit)
            if (signal.entryDigit !== undefined) {
                console.log('🎯 PATEL Bot: Setting search number to entry digit:', signal.entryDigit);

                // Find and update search number fields in PATEL bot
                const searchNumberFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                searchNumberFields.forEach(field => {
                    const parentBlock = field.closest('block');
                    if (parentBlock) {
                        // Look for variable assignments that might be search number
                        const variableSet = field.closest('block[type="variables_set"]');
                        if (variableSet) {
                            const varField = variableSet.querySelector('field[name="VAR"]');
                            if (
                                varField &&
                                varField.textContent?.toLowerCase().includes('search') &&
                                signal.entryDigit !== undefined
                            ) {
                                field.textContent = signal.entryDigit.toString();
                                console.log(
                                    `🔍 Updated search number to ${signal.entryDigit} (${varField.textContent})`
                                );
                            }
                        }
                    }
                });
            }

            // Handle prediction digit setting based on signal type and entry point
            let predictionDigit: number | undefined;

            // For DIGITOVER/DIGITUNDER contracts, use barrier from signal type
            // But automatically adjust if entry digit equals barrier to prevent automatic loss
            const extractedDigit = parseInt(signal.type.replace(/[^0-9]/g, ''));

            // Smart barrier adjustment when entry digit equals barrier
            if (!isNaN(extractedDigit) && signal.entryDigit !== undefined) {
                const entryDigit = signal.entryDigit; // Safe access after undefined check
                if (signal.type.startsWith('OVER') && entryDigit === extractedDigit) {
                    // For OVER signals: if entry digit = barrier, reduce barrier by 1
                    const adjustedBarrier = Math.max(1, extractedDigit - 1);
                    console.log(
                        '🔧 SMART ADJUSTMENT: OVER signal barrier adjusted from',
                        extractedDigit,
                        'to',
                        adjustedBarrier,
                        'because hot digit',
                        entryDigit,
                        'equals original barrier'
                    );
                    predictionDigit = adjustedBarrier;
                } else if (signal.type.startsWith('UNDER') && entryDigit === extractedDigit) {
                    // For UNDER signals: if entry digit = barrier, increase barrier by 1
                    const adjustedBarrier = Math.min(9, extractedDigit + 1);
                    console.log(
                        '🔧 SMART ADJUSTMENT: UNDER signal barrier adjusted from',
                        extractedDigit,
                        'to',
                        adjustedBarrier,
                        'because hot digit',
                        entryDigit,
                        'equals original barrier'
                    );
                    predictionDigit = adjustedBarrier;
                } else {
                    // No adjustment needed - entry digit is safe
                    predictionDigit = extractedDigit;
                }
            } else {
                // No entry digit or invalid extraction - use original barrier
                predictionDigit = extractedDigit;
            }

            if (!isNaN(predictionDigit)) {
                if (signal.type.startsWith('OVER')) {
                    console.log(
                        '📈 OVER contract: Barrier set to',
                        predictionDigit,
                        '- Predicting digits >',
                        predictionDigit,
                        '(digits',
                        predictionDigit + 1 + '-9)'
                    );
                    if (signal.entryDigit !== undefined) {
                        const isInWinningRange = signal.entryDigit > predictionDigit;
                        console.log(
                            '🎯 Hot entry digit:',
                            signal.entryDigit,
                            isInWinningRange ? '✅ (in winning range)' : '❌ (NOT in winning range)'
                        );
                    }
                } else if (signal.type.startsWith('UNDER')) {
                    console.log(
                        '📉 UNDER contract: Barrier set to',
                        predictionDigit,
                        '- Predicting digits <',
                        predictionDigit,
                        '(digits 0-' + (predictionDigit - 1) + ')'
                    );
                    if (signal.entryDigit !== undefined) {
                        const isInWinningRange = signal.entryDigit < predictionDigit;
                        console.log(
                            '🎯 Hot entry digit:',
                            signal.entryDigit,
                            isInWinningRange ? '✅ (in winning range)' : '❌ (NOT in winning range)'
                        );
                    }
                }

                console.log('🎯 Setting barrier for', signal.type, 'to:', predictionDigit);
                console.log('📊 Contract type:', contractType);

                // Log the distinction between barrier and entry digit
                if (signal.entryDigit !== undefined && signal.entryDigit !== predictionDigit) {
                    console.log('📋 PATEL Bot Signal Analysis:');
                    console.log('   - Signal Type:', signal.type);
                    console.log('   - Barrier (threshold):', predictionDigit);
                    console.log('   - Search Number (Entry Digit):', signal.entryDigit);
                    console.log(
                        '   - Strategy: Use',
                        contractType,
                        'with barrier',
                        predictionDigit,
                        'and search for entry digit',
                        signal.entryDigit
                    );
                }
            } else {
                console.log('ℹ️ No prediction digit found - PATEL bot will use default or prompt user');
            }

            if (predictionDigit !== undefined) {
                const predictionValues = xmlDoc.querySelectorAll('value[name="PREDICTION"]');
                console.log('🔍 Found', predictionValues.length, 'PREDICTION value elements');
                console.log('🎯 Setting PREDICTION to:', predictionDigit);

                let predictionUpdated = false;
                predictionValues.forEach((predictionValue, index) => {
                    // Find the shadow block with math_number_positive
                    const shadowBlock = predictionValue.querySelector('shadow[type="math_number_positive"]');
                    if (shadowBlock) {
                        const numField = shadowBlock.querySelector('field[name="NUM"]');
                        if (numField) {
                            const oldValue = numField.textContent;
                            numField.textContent = predictionDigit.toString();
                            predictionUpdated = true;
                            console.log(`✅ PREDICTION ${index}: "${oldValue}" → "${predictionDigit}"`);
                        }
                    }
                });

                if (!predictionUpdated && predictionValues.length > 0) {
                    console.warn('⚠️ PREDICTION field found but could not update');
                }
            } else {
                console.log('ℹ️ No prediction digit to set - PATEL Bot will use default behavior');
            }

            // Apply Adaptive Recovery Strategy for OVER/UNDER signals
            if (recoveryStrategy && recoveryStrategy.isValid) {
                console.log('🧠 Applying Adaptive Recovery Strategy to PATEL Bot XML...');
                console.log('🎯 Target values:', {
                    predictionBeforeLoss: recoveryStrategy.predictionBeforeLoss,
                    predictionAfterLoss: recoveryStrategy.predictionAfterLoss,
                    signalType: signal.type,
                });

                // Find and update "Prediction Before Loss" variable
                const variableFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                console.log('🔍 Found', variableFields.length, 'variable fields in XML');

                let predictionBeforeLossUpdated = false;
                let predictionAfterLossUpdated = false;

                variableFields.forEach((field, index) => {
                    const varName = field.textContent;
                    console.log(`🔍 Variable ${index}: "${varName}"`);
                    const block = field.closest('block[type="variables_set"]');

                    if (block) {
                        const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                        const currentValue = numField?.textContent;
                        console.log(`   Current value: ${currentValue}`);

                        if (varName === 'Prediction Before Loss' || varName === 'prediction before loss') {
                            if (numField) {
                                console.log(
                                    `   🎯 UPDATING: "${varName}" from ${currentValue} to ${recoveryStrategy.predictionBeforeLoss}`
                                );
                                numField.textContent = recoveryStrategy.predictionBeforeLoss.toString();
                                predictionBeforeLossUpdated = true;
                                console.log(
                                    `✅ Prediction Before Loss set to: ${recoveryStrategy.predictionBeforeLoss}`
                                );
                            }
                        } else if (
                            varName === 'Prediction After Loss' ||
                            varName === 'prediction after loss' ||
                            varName === 'prediction after l oss'
                        ) {
                            if (numField) {
                                console.log(
                                    `   🔄 UPDATING: "${varName}" from ${currentValue} to ${recoveryStrategy.predictionAfterLoss}`
                                );
                                numField.textContent = recoveryStrategy.predictionAfterLoss.toString();
                                predictionAfterLossUpdated = true;
                                console.log(`✅ Prediction After Loss set to: ${recoveryStrategy.predictionAfterLoss}`);
                            }
                        }
                    }
                });

                console.log('🔍 First pass results:', {
                    predictionBeforeLossUpdated,
                    predictionAfterLossUpdated,
                });

                // If variables not found, try to find them in other locations
                if (!predictionBeforeLossUpdated || !predictionAfterLossUpdated) {
                    console.log('🔍 Searching for prediction variables in alternative locations...');

                    // Search in all NUM fields for prediction-related variables
                    const allNumFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                    console.log('🔍 Found', allNumFields.length, 'NUM fields total');

                    allNumFields.forEach((field, index) => {
                        const parentBlock = field.closest('block');
                        if (parentBlock) {
                            const blockId = parentBlock.getAttribute('id');
                            const currentValue = field.textContent;

                            // Look for blocks that might contain prediction variables
                            if (
                                blockId &&
                                (blockId.includes('prediction') ||
                                    blockId.includes('before') ||
                                    blockId.includes('after'))
                            ) {
                                console.log(
                                    `🔍 Found potential prediction field ${index}: blockId="${blockId}", value="${currentValue}"`
                                );

                                if (blockId.includes('before') && !predictionBeforeLossUpdated) {
                                    console.log(
                                        `   🎯 UPDATING via blockId: from ${currentValue} to ${recoveryStrategy.predictionBeforeLoss}`
                                    );
                                    field.textContent = recoveryStrategy.predictionBeforeLoss.toString();
                                    predictionBeforeLossUpdated = true;
                                    console.log(
                                        `✅ Prediction Before Loss set via block ID: ${recoveryStrategy.predictionBeforeLoss}`
                                    );
                                } else if (blockId.includes('after') && !predictionAfterLossUpdated) {
                                    console.log(
                                        `   🔄 UPDATING via blockId: from ${currentValue} to ${recoveryStrategy.predictionAfterLoss}`
                                    );
                                    field.textContent = recoveryStrategy.predictionAfterLoss.toString();
                                    predictionAfterLossUpdated = true;
                                    console.log(
                                        `✅ Prediction After Loss set via block ID: ${recoveryStrategy.predictionAfterLoss}`
                                    );
                                }
                            }
                        }
                    });
                }

                console.log('✅ Adaptive Recovery Strategy Application Summary:', {
                    signalType: signal.type,
                    predictionBeforeLoss: recoveryStrategy.predictionBeforeLoss,
                    predictionAfterLoss: recoveryStrategy.predictionAfterLoss,
                    beforeLossUpdated: predictionBeforeLossUpdated,
                    afterLossUpdated: predictionAfterLossUpdated,
                    winProbBeforeLoss: `${recoveryStrategy.winProbabilities.beforeLoss}%`,
                    winProbAfterLoss: `${recoveryStrategy.winProbabilities.afterLoss}%`,
                });

                if (!predictionBeforeLossUpdated || !predictionAfterLossUpdated) {
                    console.warn('⚠️ Some adaptive recovery values could not be set in XML');
                    console.warn('   This might be due to different variable names in the PATEL bot XML');
                    console.warn('   The bot will use default values for missing fields');

                    // Let's try a more direct approach - find the exact field IDs from the XML
                    console.log('🔍 Attempting direct field ID updates...');

                    // Based on the XML structure, try to find the specific field IDs
                    const beforeLossField =
                        xmlDoc.querySelector('field[name="NUM"][id="ds#,)MD-cK$O6Oiu=p8o"]') ||
                        xmlDoc.querySelector('block[id="ds#,)MD-cK$O6Oiu=p8o"] field[name="NUM"]');
                    const afterLossField =
                        xmlDoc.querySelector('field[name="NUM"][id="#~Ah/G7=NM2HbHHG]P8N"]') ||
                        xmlDoc.querySelector('block[id="#~Ah/G7=NM2HbHHG]P8N"] field[name="NUM"]');

                    if (beforeLossField && !predictionBeforeLossUpdated) {
                        console.log('🎯 Found prediction before loss field by ID, updating...');
                        beforeLossField.textContent = recoveryStrategy.predictionBeforeLoss.toString();
                        predictionBeforeLossUpdated = true;
                        console.log(
                            `✅ Prediction Before Loss set via direct ID: ${recoveryStrategy.predictionBeforeLoss}`
                        );
                    }

                    if (afterLossField && !predictionAfterLossUpdated) {
                        console.log('🔄 Found prediction after loss field by ID, updating...');
                        afterLossField.textContent = recoveryStrategy.predictionAfterLoss.toString();
                        predictionAfterLossUpdated = true;
                        console.log(
                            `✅ Prediction After Loss set via direct ID: ${recoveryStrategy.predictionAfterLoss}`
                        );
                    }
                }
            }

            // Apply StakeManager settings using centralized service
            const { stakeManager } = await import('@/services/stake-manager.service');
            const { signalBotLoader } = await import('@/services/signal-bot-loader.service');

            console.log('💰 Applying StakeManager settings using centralized service:', {
                stake: stakeManager.getStake(),
                martingale: stakeManager.getMartingale(),
                isCustom: stakeManager.hasCustomSettings(),
            });

            // Use centralized service to apply both stake and martingale settings
            const updateResult = signalBotLoader.applyStakeManagerSettings(xmlDoc);

            console.log('✅ Centralized StakeManager Update Results:', {
                fieldsUpdated: updateResult.fieldsUpdated,
                stakeUpdated: updateResult.stakeUpdated,
                martingaleUpdated: updateResult.martingaleUpdated,
                details: updateResult.details,
            });

            if (!updateResult.martingaleUpdated) {
                console.warn('⚠️ Martingale was not updated by centralized service');
                console.warn('⚠️ Bot will use default martingale value');
            } else {
                console.log(`🎉 SUCCESS: Martingale ${stakeManager.getMartingale()}x applied via centralized service!`);
            }

            // Serialize back to XML
            const serializer = new XMLSerializer();
            botXml = serializer.serializeToString(xmlDoc);

            // Switch to Bot Builder tab
            setActiveTab(DBOT_TABS.BOT_BUILDER);

            // Wait for tab to load
            await new Promise(resolve => setTimeout(resolve, 500));

            // Load the bot
            if (window.load_modal && typeof window.load_modal.loadStrategyToBuilder === 'function') {
                console.log('📤 Loading PATEL (with Entry) Bot to builder...');
                console.log('🎯 Configuration Summary:');
                console.log(`   Market: ${signal.market} (${signal.marketDisplay})`);
                console.log(`   Type: ${signal.type} (${contractType})`);
                console.log(`   Entry Digit (Search Number): ${signal.entryDigit}`);
                console.log(`   Stake: ${stakeManager.getStake()} (from StakeManager)`);
                console.log(`   Martingale: ${stakeManager.getMartingale()}x (from StakeManager)`);

                await window.load_modal.loadStrategyToBuilder({
                    id: `patel-${signal.id}`,
                    name: `PATEL - ${signal.marketDisplay} - ${signal.type} Entry:${signal.entryDigit}`,
                    xml: botXml,
                    save_type: 'LOCAL',
                    timestamp: Date.now(),
                });

                console.log('✅ PATEL (with Entry) Bot loaded successfully!');
                console.log(`✅ Bot is now configured for ${signal.marketDisplay}`);
                console.log(`🎯 Search number set to entry digit: ${signal.entryDigit}`);

                // Auto-run the bot after loading (run immediately)
                setTimeout(() => {
                    console.log('🚀 AUTO-RUN: Starting PATEL Bot after configuration...');
                    console.log('🎯 AUTO-RUN: Looking for run button...');
                    try {
                        // Trigger the run button click programmatically
                        const runButton = document.getElementById('db-animation__run-button');
                        if (runButton) {
                            console.log('✅ AUTO-RUN: Run button found, clicking now...');
                            runButton.click();
                            console.log('🎉 AUTO-RUN: PATEL Bot auto-started successfully!');

                            // Show a brief success notification
                            console.log(
                                `🎯 AUTO-RUN COMPLETE: ${signal.type} PATEL bot is now running for ${signal.marketDisplay}`
                            );
                        } else {
                            console.warn('⚠️ AUTO-RUN: Run button not found, trying alternative method...');
                            // Alternative method: dispatch run button event
                            const runEvent = new CustomEvent('bot.auto.run');
                            window.dispatchEvent(runEvent);
                            console.log('🔄 AUTO-RUN: Dispatched alternative run event');
                        }
                    } catch (error) {
                        console.error('❌ AUTO-RUN ERROR: Failed to auto-run PATEL Bot:', error);
                    }
                }, 0); // Run immediately

                // Optional: Show a success notification
                // You can uncomment this if you want a visual confirmation
                // alert(`✅ PATEL Bot loaded!\n\nMarket: ${signal.marketDisplay}\nType: ${signal.type}\nEntry: ${signal.entryDigit}`);
            } else {
                throw new Error('Bot loader not available');
            }
        } catch (error) {
            console.error('❌ Failed to load PATEL Bot:', error);
            alert(`Failed to load PATEL bot: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Handle signal card click
    const handleCardClick = async (signal: SignalsCenterSignal, event: React.MouseEvent) => {
        // Don't trigger if clicking on interactive elements
        const target = event.target as HTMLElement;
        if (
            target.tagName === 'BUTTON' ||
            target.tagName === 'INPUT' ||
            target.tagName === 'SELECT' ||
            target.closest('button') ||
            target.closest('input') ||
            target.closest('select') ||
            target.closest('.trade-controls')
        ) {
            return;
        }

        // Check countdown validity for active signals
        if (signal.status === 'ACTIVE') {
            if (signal.remainingTime !== undefined && signal.remainingTime <= 0) {
                console.log('⏰ Signal expired, cannot trade:', signal.id);
                alert('⏰ This signal has expired and is no longer valid for trading.');
                return;
            }
        }

        if (signal.status === 'EXPIRED') {
            console.log('⏰ Signal is expired:', signal.id);
            alert('⏰ This signal has expired and is no longer valid for trading.');
            return;
        }

        // Handle active signals
        if (signal.status === 'ACTIVE' && !signal.isTrading && !isAutoLooping[signal.id]) {
            // Check signal type and load appropriate bot
            const isOverUnderSignal = signal.type.startsWith('OVER') || signal.type.startsWith('UNDER');
            const isEvenOddSignal = signal.type === 'EVEN' || signal.type === 'ODD';
            const isRiseFallSignal = signal.type === 'RISE' || signal.type === 'FALL';

            if (isOverUnderSignal) {
                if (signal.entryDigit !== undefined) {
                    // Auto-load PATEL (with Entry) Bot for OVER/UNDER signals WITH entry point
                    console.log('🎯 Auto-loading PATEL (with Entry) Bot for signal with entry point:', signal.type);
                    console.log('📋 Signal details for PATEL Bot:', {
                        id: signal.id,
                        type: signal.type,
                        market: signal.market,
                        marketDisplay: signal.marketDisplay,
                        entryDigit: signal.entryDigit,
                        searchNumber: signal.entryDigit, // Entry digit becomes search number in PATEL
                        status: signal.status,
                    });
                    await loadPatelBot(signal);
                } else {
                    // Auto-load PATEL (with Entry) Bot for OVER/UNDER signals WITHOUT entry point
                    console.log('🎯 Auto-loading PATEL (with Entry) Bot for signal without entry point:', signal.type);
                    console.log('📋 Signal details (no entry point):', {
                        id: signal.id,
                        type: signal.type,
                        market: signal.market,
                        marketDisplay: signal.marketDisplay,
                        entryDigit: 'undefined (will use bot default)',
                        status: signal.status,
                    });
                    await loadPatelBot(signal);
                }
            } else if (isEvenOddSignal) {
                // Auto-load CFX Even Odd Bot for EVEN/ODD signals
                console.log('🎲 Auto-loading CFX Even Odd Bot for signal:', signal.type);
                console.log('📋 Signal details for CFX Even Odd Bot:', {
                    id: signal.id,
                    type: signal.type,
                    market: signal.market,
                    marketDisplay: signal.marketDisplay,
                    status: signal.status,
                });
                await loadCFXEvenOddBot(signal);
            } else if (isRiseFallSignal) {
                // Auto-load CFX Rise Fall Bot for RISE/FALL signals
                console.log('🚀 Auto-loading CFX Rise Fall Bot for signal:', signal.type);
                console.log('📋 Signal details for CFX Rise Fall Bot:', {
                    id: signal.id,
                    type: signal.type,
                    market: signal.market,
                    marketDisplay: signal.marketDisplay,
                    status: signal.status,
                });
                await loadCFXRiseFallBot(signal);
            } else {
                // Open Free Bots tab for other signals
                console.log('🎯 Opening Free Bots tab for signal:', signal.type);
                setActiveTab(DBOT_TABS.FREE_BOTS);
            }
        }
    };

    // Handle trade from signal with multiple runs
    const handleTradeSignal = async (signal: SignalsCenterSignal) => {
        console.log('🎯 Trade Now clicked for signal:', signal.id);

        if (signal.isTrading) {
            console.log('⚠️ Signal already trading, ignoring click');
            return;
        }

        // Get current stake from StakeManager (centralized)
        const { stakeManager } = await import('@/services/stake-manager.service');
        let currentStake = stakeManager.getStake();
        const currentMartingale = stakeManager.getMartingale();

        // Get settings for this signal - Use Auto-Loop as max trades
        const maxTrades = autoLoopRuns[signal.id] || 1;
        const selectedPrediction = martingalePredictions[signal.id] || signal.type;
        const enableMartingale = useMartingale[signal.id] || false;
        const multiplier = martingaleMultiplier[signal.id] || currentMartingale; // Use StakeManager martingale as default
        const ticks = tickDuration[signal.id] || 5;

        console.log('📊 Signal details:', {
            market: signal.market,
            type: signal.type,
            selectedPrediction: selectedPrediction,
            ticks: ticks,
            stake: currentStake, // Now from StakeManager
            maxTrades: maxTrades,
            martingale: enableMartingale ? `${multiplier}x` : 'OFF',
            source: 'StakeManager (centralized)',
        });

        // Update signal status
        setSignals(prev => prev.map(s => (s.id === signal.id ? { ...s, isTrading: true, status: 'TRADING' } : s)));

        // Use custom tick duration
        const duration = ticks;
        const durationUnit = 't';

        console.log('⏱️ Duration:', duration, 'ticks');

        // Get barrier for digit contracts
        let barrier: string | undefined;
        if (signal.entryDigit !== undefined) {
            barrier = signal.entryDigit.toString();
            console.log('🎲 Digit contract barrier:', barrier);
        }

        // Execute trades with martingale - stop on win if martingale enabled
        console.log(`🚀 Starting martingale trading (max ${maxTrades} trades)...`);
        let totalProfit = 0;
        let successfulRuns = 0;
        let failedRuns = 0;
        let currentTradeStake = currentStake; // Start with StakeManager stake

        for (let run = 1; run <= maxTrades; run++) {
            let tradeWon = false;
            console.log(`📍 Trade ${run}/${maxTrades} - Stake: $${currentStake.toFixed(2)}`);

            const result = await signalTradingService.executeSignalTrade(
                {
                    signalId: `${signal.id}-run${run}`,
                    market: signal.market,
                    type: selectedPrediction as SignalsCenterSignal['type'],
                    stake: currentStake,
                    duration,
                    durationUnit: durationUnit as 't' | 'm' | 'h',
                    barrier,
                },
                tradeResult => {
                    console.log(`✅ Trade ${run} completed:`, tradeResult.profit);
                    totalProfit += tradeResult.profit || 0;
                    tradeWon = tradeResult.isWon || false;
                    if (tradeResult.isWon) {
                        successfulRuns++;
                        // Reset stake on win if martingale is enabled
                        if (enableMartingale) {
                            currentStake = DEFAULT_STAKE;
                            console.log(`✅ Win! Stake reset to $${currentStake.toFixed(2)}`);
                        }
                    } else {
                        failedRuns++;
                        // Increase stake on loss if martingale is enabled
                        if (enableMartingale) {
                            currentStake = currentStake * multiplier;
                            console.log(`❌ Loss! Stake increased to $${currentStake.toFixed(2)}`);
                        }
                    }

                    // Update stats after each run
                    setTradeStats(signalTradingService.getStats());
                }
            );

            if (!result.success) {
                console.error(`❌ Trade ${run} failed`);
                failedRuns++;
                // Increase stake on failed trade if martingale is enabled

                if (enableMartingale) {
                    currentStake = currentStake * multiplier;
                }

                // Stop on win when martingale is enabled

                if (enableMartingale && tradeWon) {
                    console.log(`✅ Win! Stopping martingale sequence.`);

                    break;
                }
            }

            // Small delay between runs (except for last run)
            if (run < maxTrades) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Update signal with final results
        console.log(`🏁 All runs completed. Total profit: ${totalProfit.toFixed(2)}`);
        setSignals(prev =>
            prev.map(s =>
                s.id === signal.id
                    ? {
                          ...s,
                          isTrading: false,
                          status: successfulRuns > failedRuns ? 'WON' : 'LOST',
                          result: totalProfit,
                      }
                    : s
            )
        );
    };

    // Statistics
    const stats = {
        total: filteredSignals.length,
        active: filteredSignals.filter(s => s.status === 'ACTIVE').length,
        won: filteredSignals.filter(s => s.status === 'WON').length,
        lost: filteredSignals.filter(s => s.status === 'LOST').length,
        winRate:
            filteredSignals.filter(s => s.status !== 'ACTIVE').length > 0
                ? (filteredSignals.filter(s => s.status === 'WON').length /
                      filteredSignals.filter(s => s.status !== 'ACTIVE').length) *
                  100
                : 0,
    };

    return (
        <div className='signals-center-container'>
            {/* Notification */}
            {latestSignal && showNotifications && (
                <div className='signal-notification'>
                    <div className='notification-content'>
                        <span className='notification-icon'>🔔</span>
                        <div className='notification-details'>
                            <strong>New Signal!</strong>
                            <span>
                                {latestSignal.marketDisplay} - {latestSignal.type} - {latestSignal.confidence}{' '}
                                Confidence
                            </span>
                        </div>
                        <button className='notification-close' onClick={() => setLatestSignal(null)}>
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Compact Header Bar */}
            <div className='signals-header-bar'>
                <div className='header-bar-left'>
                    <h2>📡 Signals Center</h2>
                    <ConnectionStatus />
                    <ConnectionPoolStatus compact={true} />
                </div>
                <button
                    className='collapse-toggle-btn'
                    onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                    title={isHeaderCollapsed ? 'Show controls' : 'Hide controls'}
                >
                    {isHeaderCollapsed ? '▼ Show Controls' : '▲ Hide Controls'}
                </button>
            </div>

            {/* Always Visible Signal Type Buttons */}
            <div className='quick-signal-types'>
                <button
                    className={activeSource === 'evenodd' ? 'active' : ''}
                    onClick={() => setActiveSource('evenodd')}
                    title='Show EVEN/ODD signals'
                >
                    🎲 EVEN/ODD Signals
                </button>
                <button
                    className={activeSource === 'risefall' ? 'active' : ''}
                    onClick={() => setActiveSource('risefall')}
                    title='Show RISE/FALL signals'
                >
                    📊 RISE/FALL Signals
                </button>
                <button
                    className={activeSource === 'all' ? 'active' : ''}
                    onClick={() => setActiveSource('all')}
                    title='Show all signal types'
                >
                    🌐 All Signals
                </button>
            </div>

            {/* Collapsible Header Content */}
            {!isHeaderCollapsed && (
                <>
                    <div className='signals-header'>
                        <div className='header-controls'>
                            <button
                                className={`control-btn ${autoTradeEnabled ? 'active' : ''}`}
                                onClick={() => setShowAutoTradeSettings(true)}
                                title='Configure auto-trade settings'
                            >
                                🤖 Auto-Trade {autoTradeEnabled && '(ON)'}
                            </button>
                            <button
                                className='control-btn'
                                onClick={() => setShowRiskSettings(true)}
                                title='Configure risk management'
                            >
                                ⚠️ Risk
                            </button>
                            <button
                                className='control-btn'
                                onClick={() => setShowDashboard(true)}
                                title='View performance analytics'
                            >
                                📊 Analytics
                            </button>
                            <button
                                className='control-btn'
                                onClick={() => setShowConnectionPool(true)}
                                title='View connection pool status'
                            >
                                🔗 Connections
                            </button>
                            <button
                                className='control-btn stake-settings-btn'
                                onClick={() => setShowStakeModal(true)}
                                title={`Configure stake and martingale settings (Current: $${stakeManager.getFormattedStake()}, ${stakeManager.getFormattedMartingale()})`}
                            >
                                💰 Stake Settings
                            </button>
                            <button
                                className='control-btn debug-btn'
                                onClick={() => {
                                    console.log('🧪 Debug: Manual signal generation test');
                                    console.log('Current signal counts:', {
                                        evenOdd: evenOddSignals.length,
                                        riseFall: riseFallSignals.length,
                                        total: allSignals.length,
                                    });
                                }}
                                title='Debug signal generation'
                            >
                                🧪 Debug Signals
                            </button>
                            <button
                                className={`control-btn risk-mode-btn ${riskMode === 'lessRisky' ? 'active less-risky' : ''}`}
                                onClick={() => setRiskMode(riskMode === 'lessRisky' ? 'normal' : 'lessRisky')}
                                title='Less Risky Mode: All OVER signals → OVER2, All UNDER signals → UNDER7 (70% win probability)'
                            >
                                🛡️ Less Risky {riskMode === 'lessRisky' && '(ON)'}
                            </button>
                            <button
                                className={`control-btn risk-mode-btn ${riskMode === 'over3under6' ? 'active over3under6' : ''}`}
                                onClick={() => setRiskMode(riskMode === 'over3under6' ? 'normal' : 'over3under6')}
                                title='Over3/Under6 Mode: All OVER signals → OVER3, All UNDER signals → UNDER6 (60% win probability)'
                            >
                                🎯 Over3 & Under6 {riskMode === 'over3under6' && '(ON)'}
                            </button>
                        </div>

                        {/* Signal Generator Toggles */}
                        <div className='generator-toggles'>
                            <div className='toggles-header'>
                                <span>🎛️ Signal Generators</span>
                                <span className='toggles-hint'>(Turn off to reduce API load)</span>
                            </div>
                            <div className='toggles-grid'>
                                <button
                                    className={`toggle-btn ${enabledGenerators.evenOdd ? 'active' : 'inactive'}`}
                                    onClick={() => setEnabledGenerators(prev => ({ ...prev, evenOdd: !prev.evenOdd }))}
                                    title='Toggle Even/Odd signal generator'
                                >
                                    🎲 Even/Odd {enabledGenerators.evenOdd && '✓'}
                                </button>
                                <button
                                    className={`toggle-btn ${enabledGenerators.riseFall ? 'active' : 'inactive'}`}
                                    onClick={() =>
                                        setEnabledGenerators(prev => ({ ...prev, riseFall: !prev.riseFall }))
                                    }
                                    title='Toggle Rise/Fall signal generator'
                                >
                                    📈 Rise/Fall {enabledGenerators.riseFall && '✓'}
                                </button>
                                <button
                                    className={`toggle-btn ${enabledGenerators.dynamic ? 'active' : 'inactive'}`}
                                    onClick={() => setEnabledGenerators(prev => ({ ...prev, dynamic: !prev.dynamic }))}
                                    title='Toggle Dynamic AI signal generator'
                                >
                                    🤖 Dynamic {enabledGenerators.dynamic && '✓'}
                                </button>
                                <button
                                    className={`toggle-btn ${enabledGenerators.digitHacker ? 'active' : 'inactive'}`}
                                    onClick={() =>
                                        setEnabledGenerators(prev => ({ ...prev, digitHacker: !prev.digitHacker }))
                                    }
                                    title='Toggle Digit Hacker signal generator'
                                >
                                    🎯 Digit Hacker {enabledGenerators.digitHacker && '✓'}
                                </button>
                                <button
                                    className={`toggle-btn ${enabledGenerators.hotCold ? 'active' : 'inactive'}`}
                                    onClick={() => setEnabledGenerators(prev => ({ ...prev, hotCold: !prev.hotCold }))}
                                    title='Toggle Hot/Cold Zone signal generator'
                                >
                                    🔥 Hot/Cold {enabledGenerators.hotCold && '✓'}
                                </button>
                                <button
                                    className={`toggle-btn ${enabledGenerators.flipping ? 'active' : 'inactive'}`}
                                    onClick={() =>
                                        setEnabledGenerators(prev => ({ ...prev, flipping: !prev.flipping }))
                                    }
                                    title='Toggle Flipping Tool signal generator (High API load)'
                                >
                                    🔄 Flipping {enabledGenerators.flipping && '✓'}
                                </button>
                                <button
                                    className={`toggle-btn ${enabledGenerators.patelDistribution ? 'active' : 'inactive'}`}
                                    onClick={() =>
                                        setEnabledGenerators(prev => ({
                                            ...prev,
                                            patelDistribution: !prev.patelDistribution,
                                        }))
                                    }
                                    title='Toggle Patel Distribution signal generator'
                                >
                                    📊 Patel {enabledGenerators.patelDistribution && '✓'}
                                </button>
                                <button
                                    className={`toggle-btn ${enabledGenerators.aiIntelligence ? 'active' : 'inactive'}`}
                                    onClick={() =>
                                        setEnabledGenerators(prev => ({
                                            ...prev,
                                            aiIntelligence: !prev.aiIntelligence,
                                        }))
                                    }
                                    title='Toggle AI Signal Intelligence generator (Neural network-based analysis)'
                                >
                                    🧠 AI Intelligence {enabledGenerators.aiIntelligence && '✓'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Signal Sources */}
                    <div className='signal-sources'>
                        <button
                            className={activeSource === 'all' ? 'active' : ''}
                            onClick={() => setActiveSource('all')}
                        >
                            🌐 All Sources
                        </button>
                        <button className={activeSource === 'ai' ? 'active' : ''} onClick={() => setActiveSource('ai')}>
                            🤖 AI Signals
                        </button>
                        <button
                            className={activeSource === 'pattern' ? 'active' : ''}
                            onClick={() => setActiveSource('pattern')}
                        >
                            🔍 Pattern Signals
                        </button>
                        <button
                            className={activeSource === 'technical' ? 'active' : ''}
                            onClick={() => setActiveSource('technical')}
                        >
                            📊 Technical Signals
                        </button>
                        <button
                            className={activeSource === 'flipping' ? 'active' : ''}
                            onClick={() => setActiveSource('flipping')}
                        >
                            🔄 Flipping Tool Signals
                        </button>
                        <button
                            className={activeSource === 'evenodd' ? 'active' : ''}
                            onClick={() => setActiveSource('evenodd')}
                        >
                            🎲 EVEN/ODD Signals
                        </button>
                        <button
                            className={activeSource === 'dynamic' ? 'active' : ''}
                            onClick={() => setActiveSource('dynamic')}
                        >
                            🧲 Dynamic Signals
                        </button>
                        <button
                            className={activeSource === 'risefall' ? 'active' : ''}
                            onClick={() => setActiveSource('risefall')}
                        >
                            📊 RISE/FALL Signals
                        </button>
                        <button
                            className={activeSource === 'patternpredictor' ? 'active' : ''}
                            onClick={() => setActiveSource('patternpredictor')}
                        >
                            🔮 Pattern Predictor
                        </button>
                        <button
                            className={activeSource === 'exact_digit' ? 'active' : ''}
                            onClick={() => setActiveSource('exact_digit')}
                        >
                            🎯 Exact Digits
                        </button>
                        <button
                            className={activeSource === 'range_prediction' ? 'active' : ''}
                            onClick={() => setActiveSource('range_prediction')}
                        >
                            📊 Range Predictions
                        </button>
                        <button
                            className={activeSource === 'hotcoldzone' ? 'active' : ''}
                            onClick={() => setActiveSource('hotcoldzone')}
                        >
                            🔥❄️ Raziel (Hot/Cold)
                        </button>
                        <button
                            className={activeSource === 'digitdistribution' ? 'active' : ''}
                            onClick={() => setActiveSource('digitdistribution')}
                        >
                            📊 Patel (Distribution)
                        </button>
                    </div>

                    {/* Filters Toggle Button */}
                    <div className='filters-toggle-container'>
                        <button
                            className='filters-toggle-btn'
                            onClick={() => setShowFilters(!showFilters)}
                            title={showFilters ? 'Hide Filters' : 'Show Filters'}
                        >
                            {showFilters ? '🔼 Hide Filters' : '� Show Filters'}
                        </button>
                    </div>

                    {/* Filters - Collapsible */}
                    {showFilters && (
                        <div className='signal-filters'>
                            <div className='filter-group'>
                                <label>Market:</label>
                                <select value={filterMarket} onChange={e => setFilterMarket(e.target.value)}>
                                    <option value='all'>🌐 All Markets</option>
                                    <optgroup label='⚡ 1-Second Indices'>
                                        <option value='1HZ10V'>� Volatility 10 (1s)</option>
                                        <option value='1HZ25V'>📊 Volatility 25 (1s)</option>
                                        <option value='1HZ50V'>📊 Volatility 50 (1s)</option>
                                        <option value='1HZ75V'>📊 Volatility 75 (1s)</option>
                                        <option value='1HZ100V'>📊 Volatility 100 (1s)</option>
                                    </optgroup>
                                    <optgroup label='📈 Standard Indices'>
                                        <option value='R_10'>📉 Volatility 10</option>
                                        <option value='R_25'>� Volatility 25</option>
                                        <option value='R_50'>� Volatility 50</option>
                                        <option value='R_75'>📉 Volatility 75</option>
                                        <option value='R_100'>� Volatility 100</option>
                                    </optgroup>
                                </select>
                            </div>

                            <div className='filter-group'>
                                <label>Strategy:</label>
                                <select value={filterStrategy} onChange={e => setFilterStrategy(e.target.value)}>
                                    <option value='all'>All Strategies</option>
                                    <option value='Trend Following'>📈 Trend Following</option>
                                    <option value='Mean Reversion'>🔄 Mean Reversion</option>
                                    <option value='Pattern Recognition'>🎯 Pattern Recognition</option>
                                    <option value='Hot Digits'>🔥 Hot Digits</option>
                                    <option value='Cold Digits'>❄️ Cold Digits</option>
                                    <option value='Martingale'>💰 Martingale</option>
                                    <option value='Anti-Martingale'>💎 Anti-Martingale</option>
                                    <option value='Fibonacci'>🌀 Fibonacci</option>
                                    <option value='Breakout'>⚡ Breakout</option>
                                    <option value='Support/Resistance'>🎚️ Support/Resistance</option>
                                </select>
                            </div>

                            <div className='filter-group'>
                                <label>Time:</label>
                                <div className='time-buttons'>
                                    <button
                                        className={filterTime === '1m' ? 'active' : ''}
                                        onClick={() => setFilterTime('1m')}
                                    >
                                        1M
                                    </button>
                                    <button
                                        className={filterTime === '2m' ? 'active' : ''}
                                        onClick={() => setFilterTime('2m')}
                                    >
                                        2M
                                    </button>
                                    <button
                                        className={filterTime === '3m' ? 'active' : ''}
                                        onClick={() => setFilterTime('3m')}
                                    >
                                        3M
                                    </button>
                                    <button
                                        className={filterTime === '5m' ? 'active' : ''}
                                        onClick={() => setFilterTime('5m')}
                                    >
                                        5M
                                    </button>
                                    <button
                                        className={filterTime === '10m' ? 'active' : ''}
                                        onClick={() => setFilterTime('10m')}
                                    >
                                        10M
                                    </button>
                                    <button
                                        className={filterTime === 'all' ? 'active' : ''}
                                        onClick={() => setFilterTime('all')}
                                    >
                                        All
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Hidden Signal Scanners */}
            <div style={{ display: 'none' }}>
                {enabledGenerators.flipping && (
                    <FlippingToolSignals
                        onSignalsUpdate={newSignals => {
                            setFlippingSignals(newSignals as SignalsCenterSignal[]);
                        }}
                    />
                )}
                {enabledGenerators.evenOdd && (
                    <EvenOddSignals
                        onSignalsUpdate={newSignals => {
                            console.log(`📥 SignalsCenter: Received ${newSignals.length} EvenOdd signals`);
                            console.log(
                                '🎲 EvenOdd signals:',
                                newSignals.map(s => `${s.type} (${s.confidence})`)
                            );
                            setEvenOddSignals(newSignals as SignalsCenterSignal[]);
                        }}
                    />
                )}
                {enabledGenerators.dynamic && (
                    <DynamicSignals
                        onSignalsUpdate={newSignals => {
                            setDynamicSignals(newSignals as SignalsCenterSignal[]);
                        }}
                    />
                )}
                {enabledGenerators.riseFall && (
                    <RiseFallSignals
                        onSignalsUpdate={newSignals => {
                            console.log(`📥 SignalsCenter: Received ${newSignals.length} RiseFall signals`);
                            console.log(
                                '📊 RiseFall signals:',
                                newSignals.map(s => `${s.type} (${s.confidence})`)
                            );
                            setRiseFallSignals(newSignals as SignalsCenterSignal[]);
                        }}
                    />
                )}
                {enabledGenerators.digitHacker && (
                    <DigitHackerSignals
                        onSignalsUpdate={newSignals => {
                            console.log(`📥 SignalsCenter: Received ${newSignals.length} DigitHacker signals`);
                            console.log(
                                '🎯 DigitHacker signals:',
                                newSignals.map(s => `${s.type} (${s.confidence}%)`)
                            );
                            setDigitHackerSignals(newSignals as unknown as SignalsCenterSignal[]);
                        }}
                    />
                )}
            </div>

            {/* Signals List */}
            <div className='signals-list'>
                {/* Risk Mode Banner */}
                {riskMode !== 'normal' && (
                    <div className={`risk-mode-banner ${riskMode}`}>
                        <div className='banner-icon'>{riskMode === 'lessRisky' ? '🛡️' : '🎯'}</div>
                        <div className='banner-text'>
                            <strong>
                                {riskMode === 'lessRisky' ? 'Less Risky Mode Active' : 'Over3/Under6 Mode Active'}
                            </strong>
                            <span>
                                {riskMode === 'lessRisky'
                                    ? 'All OVER signals → OVER2, All UNDER signals → UNDER7 (70% win probability)'
                                    : 'All OVER signals → OVER3, All UNDER signals → UNDER6 (60% win probability)'}
                            </span>
                        </div>
                        <button
                            className='banner-close'
                            onClick={() => setRiskMode('normal')}
                            title='Disable risk mode'
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Connection Status Banner */}
                {!isConnectedToRealData && (
                    <div className='connection-status-banner disconnected'>
                        <div className='status-icon'>⚠️</div>
                        <div className='status-text'>
                            <strong>Waiting for Signals from Elvis&apos; Algo</strong>
                            <span>
                                {connectionError ||
                                    'Connecting to Deriv WebSocket... Signals will appear once Elvis&apos; Algo analyzes real tick data.'}
                            </span>
                            {tickCount > 0 && <span className='tick-info'>Ticks received: {tickCount}</span>}
                        </div>
                    </div>
                )}

                {/* Connected Status - Removed for cleaner UI */}

                {filteredSignals.length === 0 ? (
                    <div className='no-signals'>
                        <span className='no-signals-icon'>{isConnectedToRealData ? '📭' : '⏳'}</span>
                        <p>
                            {isConnectedToRealData
                                ? 'No signals match your filters'
                                : 'Waiting for signals from Elvis&apos; Algo...'}
                        </p>
                        {!isConnectedToRealData && (
                            <p className='waiting-hint'>
                                Elvis&apos; Algo generates signals from REAL Deriv tick data only. No simulated data.
                            </p>
                        )}
                    </div>
                ) : (
                    filteredSignals.map(originalSignal => {
                        // Apply risk mode transformation
                        const signal = transformSignalForRiskMode(originalSignal);
                        return (
                            <div
                                key={signal.id}
                                className={`signal-card ${signal.status.toLowerCase()} ${loadingSignals.has(signal.id) ? 'loading' : ''} ${loadedSignals.has(signal.id) ? 'loaded' : ''}`}
                                onClick={e => handleCardClick(signal, e)}
                                role='button'
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        handleCardClick(signal, e as any);
                                    }
                                }}
                                title={
                                    signal.status === 'ACTIVE' && !signal.isTrading && !isAutoLooping[signal.id]
                                        ? 'Click to load bot with pre-filled parameters'
                                        : undefined
                                }
                            >
                                {/* Loading overlay */}
                                {loadingSignals.has(signal.id) && (
                                    <div className='card-loading-overlay'>
                                        <div className='spinner-circle'></div>
                                        <span>Loading bot...</span>
                                    </div>
                                )}

                                {/* Loaded indicator */}
                                {loadedSignals.has(signal.id) && (
                                    <div className='card-loaded-badge'>
                                        <span>✓ Loaded</span>
                                    </div>
                                )}

                                {/* Bot info banner - Show on all active signals */}
                                {signal.status === 'ACTIVE' && !signal.isTrading && !isAutoLooping[signal.id] && (
                                    <div className='bot-info-banner'>
                                        <div className='banner-content'>
                                            <span className='bot-icon'>⚡</span>
                                            <div className='banner-info'>
                                                <span className='banner-title'>
                                                    {signal.type} • {signal.marketDisplay}
                                                    {signal.entryDigit !== undefined &&
                                                        ` • Entry: ${signal.entryDigit}`}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            className='load-bot-button'
                                            onClick={e => {
                                                e.stopPropagation();
                                                const isOverUnder =
                                                    signal.type.startsWith('OVER') || signal.type.startsWith('UNDER');
                                                const isRiseFall = signal.type === 'RISE' || signal.type === 'FALL';
                                                const isEvenOdd = signal.type === 'EVEN' || signal.type === 'ODD';

                                                if (isOverUnder) {
                                                    loadPatelBot(signal);
                                                } else if (isRiseFall) {
                                                    loadCFXRiseFallBot(signal);
                                                } else if (isEvenOdd) {
                                                    loadCFXEvenOddBot(signal);
                                                }
                                            }}
                                            title={
                                                signal.type.startsWith('OVER') || signal.type.startsWith('UNDER')
                                                    ? `Load PATEL (with Entry) Bot for ${signal.type}`
                                                    : signal.type === 'RISE' || signal.type === 'FALL'
                                                      ? `Load CFX Rise Fall Bot for ${signal.type}`
                                                      : `Load CFX Even Odd Bot for ${signal.type}`
                                            }
                                        >
                                            <span>
                                                {signal.type.startsWith('OVER') || signal.type.startsWith('UNDER')
                                                    ? '⚡'
                                                    : signal.type === 'RISE' || signal.type === 'FALL'
                                                      ? '🚀'
                                                      : '🎲'}
                                            </span>
                                            <span>Load Bot</span>
                                        </button>
                                    </div>
                                )}

                                <div className='signal-header'>
                                    <div className='signal-market'>
                                        <span className='market-name'>{signal.marketDisplay}</span>
                                        <span className={`confidence-badge ${signal.confidence.toLowerCase()}`}>
                                            {signal.confidence}
                                        </span>
                                    </div>
                                    <div className='signal-time-section'>
                                        <div className='signal-time'>
                                            {new Date(signal.timestamp).toLocaleTimeString()}
                                        </div>
                                        {/* Countdown Validity Display */}
                                        {signal.status === 'ACTIVE' && signal.remainingTime !== undefined && (
                                            <div
                                                className={`countdown-validity ${signal.remainingTime <= 10 ? 'urgent' : signal.remainingTime <= 20 ? 'warning' : 'normal'}`}
                                            >
                                                <span className='countdown-icon'>⏱️</span>
                                                <span className='countdown-time'>{signal.remainingTime}s</span>
                                                <span className='countdown-label'>valid</span>
                                            </div>
                                        )}
                                        {signal.status === 'EXPIRED' && (
                                            <div className='countdown-validity expired'>
                                                <span className='countdown-icon'>⏰</span>
                                                <span className='countdown-label'>EXPIRED</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className='signal-body'>
                                    <div className='signal-type'>
                                        {(() => {
                                            const category = getSignalCategory(signal);
                                            return (
                                                <div
                                                    className={`enhanced-signal-type ${category.category.toLowerCase()}`}
                                                >
                                                    <span className={`type-badge ${signal.type.toLowerCase()}`}>
                                                        <span className='type-icon'>{category.icon}</span>
                                                        <span className='type-text'>{category.displayType}</span>
                                                        {/* Glowing Entry Point beside Target Digit */}
                                                        {signal.entryDigit !== undefined && (
                                                            <span className='entry-point-glow'>
                                                                <span className='entry-point-label'>Entry:</span>
                                                                <span className='entry-point-digit'>
                                                                    {signal.entryDigit}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span
                                                        className={`category-badge ${category.category.toLowerCase()}`}
                                                    >
                                                        {category.confidence}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                        <span className='duration'>{signal.duration}</span>
                                    </div>

                                    {/* Enhanced Entry Point Display */}
                                    {(() => {
                                        const isOverUnder =
                                            signal.type.startsWith('OVER') || signal.type.startsWith('UNDER');

                                        if (isOverUnder) {
                                            if (signal.entryDigit !== undefined) {
                                                // Hot Digit Signal - the entry digit is the frequently appearing digit
                                                // NOT the barrier (barrier is extracted from signal type like OVER5 -> 5)
                                                const barrier = parseInt(signal.type.replace(/[^0-9]/g, ''));
                                                const isOver = signal.type.startsWith('OVER');

                                                return (
                                                    <div className='exact-digit-section'>
                                                        <div className='exact-digit-header'>
                                                            <span className='exact-icon'>🎯</span>
                                                            <span className='exact-label'>TARGET DIGIT</span>
                                                        </div>
                                                        <div className='exact-digit-display'>
                                                            <span className='target-digit'>{signal.entryDigit}</span>
                                                            <span className='exact-description'>
                                                                Frequently appearing digit{' '}
                                                                {isOver ? `(> ${barrier})` : `(< ${barrier})`}
                                                            </span>
                                                        </div>
                                                        <div className='barrier-info'>
                                                            <span className='barrier-label'>Barrier:</span>
                                                            <span className='barrier-value'>{barrier}</span>
                                                            <span className='barrier-explanation'>
                                                                {isOver
                                                                    ? `Win if last digit > ${barrier} (${barrier + 1}-9)`
                                                                    : `Win if last digit < ${barrier} (0-${barrier - 1})`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                // Range Prediction Signal
                                                const threshold = parseInt(signal.type.replace(/[^0-9]/g, ''));
                                                const isOver = signal.type.startsWith('OVER');
                                                const rangeDigits = isOver
                                                    ? Array.from({ length: 9 - threshold }, (_, i) => threshold + 1 + i)
                                                    : Array.from({ length: threshold }, (_, i) => i);

                                                return (
                                                    <div className='range-prediction-section'>
                                                        <div className='range-header'>
                                                            <span className='range-icon'>📊</span>
                                                            <span className='range-label'>RANGE TARGET</span>
                                                        </div>
                                                        <div className='range-display'>
                                                            <span className='range-type'>{signal.type}</span>
                                                            <div className='range-digits'>
                                                                <span className='range-description'>
                                                                    Digits: {rangeDigits.join(', ')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        } else if (signal.entryDigit !== undefined) {
                                            // Other signals with entry digit
                                            return (
                                                <div className='entry-digit-section'>
                                                    <span className='entry-label'>Entry Digit:</span>
                                                    <span className='entry-digit-highlight'>{signal.entryDigit}</span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {signal.digitPattern && signal.digitPattern.length > 0 && (
                                        <div className='digit-pattern-section'>
                                            <span className='pattern-label'>Recent Pattern:</span>
                                            <div className='digit-pattern'>
                                                {signal.digitPattern.map((digit, idx) => (
                                                    <span key={idx} className='pattern-digit'>
                                                        {digit}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {signal.reason && (
                                        <div className='signal-reason'>
                                            <span className='reason-icon'>💡</span>
                                            <span className='reason-text'>{signal.reason}</span>
                                        </div>
                                    )}

                                    {/* Digit Percentage Analysis for OVER/UNDER signals */}
                                    {signal.targetDigitsAnalysis &&
                                        (signal.type.startsWith('OVER') || signal.type.startsWith('UNDER')) && (
                                            <div className='digit-percentage-analysis'>
                                                <div className='analysis-header'>
                                                    <span className='analysis-icon'>📊</span>
                                                    <span className='analysis-title'>Digit Analysis</span>
                                                </div>

                                                {/* Entry Digit Percentage (for exact digit signals) */}
                                                {signal.entryDigit !== undefined &&
                                                    signal.targetDigitsAnalysis.entryDigitPercentage !== undefined && (
                                                        <div className='entry-digit-analysis'>
                                                            <div className='entry-digit-stat'>
                                                                <span className='stat-label'>
                                                                    🎯 Entry Digit {signal.entryDigit}:
                                                                </span>
                                                                <span
                                                                    className={`stat-value ${signal.targetDigitsAnalysis.entryDigitPercentage > 15 ? 'hot' : signal.targetDigitsAnalysis.entryDigitPercentage < 5 ? 'cold' : 'normal'}`}
                                                                >
                                                                    {signal.targetDigitsAnalysis.entryDigitPercentage}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                {/* Target Digits Combined Percentage */}
                                                <div className='target-digits-analysis'>
                                                    <div className='combined-percentage'>
                                                        <span className='stat-label'>
                                                            📈 Target Range (
                                                            {signal.targetDigitsAnalysis.targetDigits.join(', ')}):
                                                        </span>
                                                        <span
                                                            className={`stat-value combined ${signal.targetDigitsAnalysis.combinedPercentage > 60 ? 'high' : signal.targetDigitsAnalysis.combinedPercentage > 40 ? 'medium' : 'low'}`}
                                                        >
                                                            {signal.targetDigitsAnalysis.combinedPercentage}%
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Individual Target Digit Percentages */}
                                                <div className='individual-percentages'>
                                                    <div className='percentages-grid'>
                                                        {signal.targetDigitsAnalysis.individualPercentages.map(
                                                            digitData => (
                                                                <div
                                                                    key={digitData.digit}
                                                                    className={`digit-percentage-item ${digitData.isHot ? 'hot' : digitData.isCold ? 'cold' : 'normal'}`}
                                                                >
                                                                    <span className='digit-number'>
                                                                        {digitData.digit}
                                                                    </span>
                                                                    <span className='digit-percent'>
                                                                        {digitData.percentage}%
                                                                    </span>
                                                                    {digitData.isHot && (
                                                                        <span className='hot-indicator'>🔥</span>
                                                                    )}
                                                                    {digitData.isCold && (
                                                                        <span className='cold-indicator'>❄️</span>
                                                                    )}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Analysis Summary */}
                                                <div className='analysis-summary'>
                                                    <span className='summary-text'>
                                                        {signal.targetDigitsAnalysis.combinedPercentage > 60
                                                            ? '🟢 Strong signal - High target frequency'
                                                            : signal.targetDigitsAnalysis.combinedPercentage > 40
                                                              ? '🟡 Moderate signal - Average frequency'
                                                              : '🔴 Weak signal - Low frequency'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                    {/* Pattern Display for EVEN/ODD, RISE/FALL, and OVER/UNDER signals - Hidden by default */}
                                    {signal.recentPattern && signal.recentPattern.length > 0 && (
                                        <div className='pattern-analysis-section'>
                                            <button
                                                className='pattern-toggle-btn'
                                                onClick={() => setShowPatternAnalysis(!showPatternAnalysis)}
                                            >
                                                {showPatternAnalysis ? '▼' : '▶'} Pattern Analysis
                                            </button>
                                            {showPatternAnalysis && (
                                                <PatternDisplay
                                                    pattern={signal.recentPattern}
                                                    type={
                                                        signal.type === 'EVEN' || signal.type === 'ODD'
                                                            ? 'evenodd'
                                                            : signal.type === 'RISE' || signal.type === 'FALL'
                                                              ? 'risefall'
                                                              : 'overunder'
                                                    }
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* Entry Suggestion for EVEN/ODD signals */}
                                    {(signal.type === 'EVEN' || signal.type === 'ODD') &&
                                        signal.entryAnalysis &&
                                        (() => {
                                            const entry = signal.entryAnalysis;
                                            console.log('🔍 Displaying Entry Suggestion for:', signal.id, entry);
                                            return (
                                                <div
                                                    className={`entry-suggestion ${entry.confidence.toLowerCase()}-confidence ${entry.suggestedEntry === 'WAIT' ? 'wait-signal' : ''}`}
                                                >
                                                    <div className='suggestion-header'>
                                                        <span className='suggestion-icon'>
                                                            {entry.suggestedEntry === 'WAIT' ? '⏸️' : '🎯'}
                                                        </span>
                                                        <span className='suggestion-text'>
                                                            {entry.suggestedEntry === 'WAIT'
                                                                ? 'WAIT'
                                                                : `TRADE ${entry.suggestedEntry}`}
                                                        </span>
                                                        <span
                                                            className={`confidence-badge ${entry.confidence.toLowerCase()}`}
                                                        >
                                                            {entry.confidence}
                                                        </span>
                                                    </div>
                                                    <div className='suggestion-reason'>{entry.reason}</div>
                                                    {entry.suggestedEntry !== 'WAIT' && (
                                                        <div className='suggestion-timing'>
                                                            {entry.timing === 'ENTER_NOW' && '⚡ Enter Now'}
                                                            {entry.timing === 'WAIT_1_TICK' && '⏱️ Wait 1 Tick'}
                                                            {entry.timing === 'WAIT_2_TICKS' && '⏱️ Wait 2 Ticks'}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                    <div className='signal-details'>
                                        <div className='detail-item'>
                                            <span className='detail-label'>Strategy:</span>
                                            <span className='detail-value'>{signal.strategy}</span>
                                        </div>
                                        <div className='detail-item'>
                                            <span className='detail-label'>Source:</span>
                                            <span className='detail-value'>
                                                {signal.source === 'ai' && '🤖 AI'}
                                                {signal.source === 'pattern' && '🔍 Pattern'}
                                                {signal.source === 'technical' && '📊 Technical'}
                                                {signal.source === 'flipping' && '🔄 Flipping Tool'}
                                                {signal.source === 'evenodd' && '🎲 EVEN/ODD'}
                                                {signal.source === 'dynamic' && '🧲 Dynamic AI'}
                                                {signal.source === 'risefall' && '📊 RISE/FALL'}
                                                {signal.source === 'multimarket' && '🌍 Multi-Market'}
                                                {signal.source === 'patternpredictor' && '🔮 Pattern Predictor'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className='signal-footer'>
                                    <div className='footer-left'>
                                        <span className={`status-badge ${signal.status.toLowerCase()}`}>
                                            {signal.status}
                                        </span>
                                        {signal.result !== undefined && (
                                            <span className={`result ${signal.result >= 0 ? 'profit' : 'loss'}`}>
                                                {signal.result >= 0 ? '+' : ''}
                                                {signal.result.toFixed(2)} USD
                                            </span>
                                        )}
                                    </div>
                                    {signal.status === 'ACTIVE' && !signal.isTrading && !isAutoLooping[signal.id] && (
                                        <div className='trade-controls'>
                                            <div className='martingale-control'>
                                                <label>Prediction:</label>
                                                <select
                                                    value={martingalePredictions[signal.id] || signal.type}
                                                    onChange={e => {
                                                        setMartingalePredictions(prev => ({
                                                            ...prev,
                                                            [signal.id]: e.target.value,
                                                        }));
                                                    }}
                                                    onClick={e => e.stopPropagation()}
                                                    title='Select prediction for martingale strategy'
                                                >
                                                    <optgroup label='Rise/Fall'>
                                                        <option value='RISE'>📈 RISE</option>
                                                        <option value='FALL'>📉 FALL</option>
                                                    </optgroup>
                                                    <optgroup label='Even/Odd'>
                                                        <option value='EVEN'>⚪ EVEN</option>
                                                        <option value='ODD'>⚫ ODD</option>
                                                    </optgroup>
                                                    <optgroup label='Over'>
                                                        <option value='OVER1'>⬆️ OVER 1</option>
                                                        <option value='OVER2'>⬆️ OVER 2</option>
                                                        <option value='OVER3'>⬆️ OVER 3</option>
                                                        <option value='OVER4'>⬆️ OVER 4</option>
                                                        <option value='OVER5'>⬆️ OVER 5</option>
                                                    </optgroup>
                                                    <optgroup label='Under'>
                                                        <option value='UNDER1'>⬇️ UNDER 1</option>
                                                        <option value='UNDER2'>⬇️ UNDER 2</option>
                                                        <option value='UNDER3'>⬇️ UNDER 3</option>
                                                        <option value='UNDER4'>⬇️ UNDER 4</option>
                                                        <option value='UNDER5'>⬇️ UNDER 5</option>
                                                    </optgroup>
                                                </select>
                                            </div>
                                            <div className='runs-control'>
                                                <label>Runs:</label>
                                                <input
                                                    type='number'
                                                    min='1'
                                                    max='10'
                                                    value={tradeRuns[signal.id] || 1}
                                                    onChange={e => {
                                                        const value = parseInt(e.target.value);
                                                        setTradeRuns(prev => ({
                                                            ...prev,
                                                            [signal.id]:
                                                                isNaN(value) || value < 1 ? 1 : Math.min(value, 10),
                                                        }));
                                                    }}
                                                    onClick={e => e.stopPropagation()}
                                                    title='Number of times to execute this trade (1-10)'
                                                />
                                            </div>
                                            <div className='auto-loop-control'>
                                                <label>Auto-Loop:</label>
                                                <input
                                                    type='number'
                                                    min='1'
                                                    max='100'
                                                    value={autoLoopRuns[signal.id] || 1}
                                                    onChange={e => {
                                                        const value = parseInt(e.target.value);
                                                        setAutoLoopRuns(prev => ({
                                                            ...prev,
                                                            [signal.id]:
                                                                isNaN(value) || value < 1 ? 1 : Math.min(value, 100),
                                                        }));
                                                    }}
                                                    onClick={e => e.stopPropagation()}
                                                    title='Number of times to repeat the batch automatically (1-100)'
                                                />
                                            </div>
                                            <div className='tick-duration-control'>
                                                <label>Ticks:</label>
                                                <input
                                                    type='number'
                                                    min='1'
                                                    max='10'
                                                    value={tickDuration[signal.id] || 5}
                                                    onChange={e => {
                                                        const value = parseInt(e.target.value);
                                                        setTickDuration(prev => ({
                                                            ...prev,
                                                            [signal.id]:
                                                                isNaN(value) || value < 1 ? 5 : Math.min(value, 10),
                                                        }));
                                                    }}
                                                    onClick={e => e.stopPropagation()}
                                                    title='Number of ticks for each trade (1-10)'
                                                />
                                            </div>
                                            <div className='martingale-control-section'>
                                                <label className='martingale-checkbox'>
                                                    <input
                                                        type='checkbox'
                                                        checked={useMartingale[signal.id] || false}
                                                        onChange={e => {
                                                            setUseMartingale(prev => ({
                                                                ...prev,
                                                                [signal.id]: e.target.checked,
                                                            }));
                                                        }}
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                    <span>Martingale</span>
                                                </label>
                                                {useMartingale[signal.id] && (
                                                    <input
                                                        type='number'
                                                        min='1.1'
                                                        max='5'
                                                        step='0.1'
                                                        value={martingaleMultiplier[signal.id] || 2}
                                                        onChange={e => {
                                                            const value = parseFloat(e.target.value);
                                                            setMartingaleMultiplier(prev => ({
                                                                ...prev,
                                                                [signal.id]:
                                                                    isNaN(value) || value < 1.1
                                                                        ? 2
                                                                        : Math.min(value, 5),
                                                            }));
                                                        }}
                                                        onClick={e => e.stopPropagation()}
                                                        title='Martingale multiplier (1.1-5x)'
                                                        className='martingale-multiplier-input'
                                                    />
                                                )}
                                            </div>
                                            <button
                                                className='trade-now-btn'
                                                onClick={() => {
                                                    const loopCount = autoLoopRuns[signal.id] || 1;
                                                    if (loopCount > 1) {
                                                        handleAutoLoopTrade(signal);
                                                    } else {
                                                        handleTradeSignal(signal);
                                                    }
                                                }}
                                                title={`Execute ${tradeRuns[signal.id] || 1} run(s) per batch, ${autoLoopRuns[signal.id] || 1} batch(es) total`}
                                            >
                                                {(autoLoopRuns[signal.id] || 1) > 1 ? '🔁' : '🎯'} Trade Now{' '}
                                                {(tradeRuns[signal.id] || 1) > 1 && `(${tradeRuns[signal.id]}x)`}
                                                {(autoLoopRuns[signal.id] || 1) > 1 &&
                                                    ` ×${autoLoopRuns[signal.id]} loops`}
                                            </button>
                                        </div>
                                    )}
                                    {(signal.isTrading || isAutoLooping[signal.id]) && (
                                        <div className='trading-controls'>
                                            <span className='trading-indicator'>
                                                {isAutoLooping[signal.id] ? '🔁 Auto-Looping...' : '⏳ Trading...'}
                                            </span>
                                            {isAutoLooping[signal.id] && (
                                                <button
                                                    className='stop-loop-btn'
                                                    onClick={() => stopAutoLoop(signal.id)}
                                                    title='Stop the auto-loop after current batch completes'
                                                >
                                                    🛑 Stop Loop
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* My Trades Section */}
            <div className='my-trades-section'>
                <div className='my-trades-header' onClick={() => setIsMyTradesExpanded(!isMyTradesExpanded)}>
                    <h3>📝 My Signal Trades</h3>
                    <div className='header-actions'>
                        {isMyTradesExpanded && (
                            <button
                                className='view-all-btn'
                                onClick={e => {
                                    e.stopPropagation();
                                    setShowDashboard(true);
                                }}
                            >
                                View All
                            </button>
                        )}
                        <button className='toggle-btn'>{isMyTradesExpanded ? '▼' : '▶'}</button>
                    </div>
                </div>
                {isMyTradesExpanded && (
                    <div className='my-trades-list'>
                        {signalTradingService.getHistory().length === 0 ? (
                            <div className='no-trades-message'>
                                <span className='no-trades-icon'>📭</span>
                                <p>No trades yet. Click &quot;Trade Now&quot; on a signal to start!</p>
                            </div>
                        ) : (
                            signalTradingService
                                .getHistory()
                                .slice(0, 5)
                                .map((trade, idx) => (
                                    <div key={idx} className='trade-item'>
                                        <div className='trade-time'>
                                            {new Date(trade.timestamp).toLocaleTimeString()}
                                        </div>
                                        <div className='trade-contract'>
                                            {trade.contractId ? `#${trade.contractId}` : 'Pending'}
                                        </div>
                                        <div className='trade-signal'>Signal: {trade.signalId.slice(0, 12)}...</div>
                                        <div
                                            className={`trade-result ${trade.isWon ? 'success' : trade.profit !== undefined ? 'danger' : 'pending'}`}
                                        >
                                            {trade.profit !== undefined
                                                ? `${trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)} USD`
                                                : trade.error
                                                  ? 'Failed'
                                                  : 'Pending'}
                                        </div>
                                        <div className='trade-status'>
                                            {trade.isWon ? '✅' : trade.profit !== undefined ? '❌' : '⏳'}
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                )}
            </div>

            {/* Statistics Footer */}
            <div className='signals-footer'>
                <div className='footer-stat'>
                    <span className='footer-label'>Total Signals:</span>
                    <span className='footer-value'>{stats.total}</span>
                </div>
                <div className='footer-stat'>
                    <span className='footer-label'>Won:</span>
                    <span className='footer-value success'>{stats.won}</span>
                </div>
                <div className='footer-stat'>
                    <span className='footer-label'>Lost:</span>
                    <span className='footer-value danger'>{stats.lost}</span>
                </div>
                <div className='footer-stat'>
                    <span className='footer-label'>Win Rate:</span>
                    <span className='footer-value'>{stats.winRate.toFixed(1)}%</span>
                </div>
            </div>

            {/* Modal Components */}
            {showDashboard && <PerformanceDashboard onClose={() => setShowDashboard(false)} />}

            {showRiskSettings && <RiskManagementSettings onClose={() => setShowRiskSettings(false)} />}

            {showAutoTradeSettings && (
                <AutoTradeSettings
                    onClose={() => {
                        setShowAutoTradeSettings(false);
                        setAutoTradeEnabled(signalTradingService.getAutoTradeConfig().enabled);
                    }}
                />
            )}

            {showConnectionPool && (
                <div className='modal-overlay' onClick={() => setShowConnectionPool(false)}>
                    <div className='modal-content' onClick={e => e.stopPropagation()}>
                        <div className='modal-header'>
                            <h2>🔗 Connection Pool Status</h2>
                            <button className='modal-close' onClick={() => setShowConnectionPool(false)}>
                                ×
                            </button>
                        </div>
                        <ConnectionPoolStatus compact={false} />
                    </div>
                </div>
            )}
            {/* Stake & Martingale Settings Modal */}
            <StakeMartingaleModal
                isOpen={showStakeModal}
                onClose={() => setShowStakeModal(false)}
                onConfirm={handleStakeModalConfirm}
            />
        </div>
    );
};

export default SignalsCenter;
