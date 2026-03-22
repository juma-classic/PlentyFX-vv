import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/hooks/useStore';
import { usePortfolio } from '@/hooks/useDerivAPI';
import type { BotStats } from '@/services/flipping-tool.service';
import { instantFillService } from '@/services/instant-fill.service';
import { multipleStakesService } from '@/services/multiple-stakes.service';
import { instantMatchesService } from '@/services/instant-matches.service';
import { derivAPIService } from '@/services/deriv-api.service';
import { signalTradingService } from '@/services/signal-trading.service';
import type { SignalTradeConfig } from '@/services/signal-trading.service';
import './TradingHub.scss';

type TabType = 'instant-fill' | 'multiple-stakes' | 'flipa-switcher' | 'instant-matches';
type StrategyType = 'Over' | 'Under' | 'Even' | 'Odd' | 'Matches' | 'Differs' | 'Rise' | 'Fall';

interface ActiveStrategy {
    id: number;
    type: StrategyType;
    stake: number;
    prediction: number;
}

export const TradingHub: React.FC = () => {
    
    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>('instant-fill');
    
    // Instant Fill state
    const [instantFillMode, setInstantFillMode] = useState<'even-odd' | 'over-under'>('even-odd');
    const [instantMarket, setInstantMarket] = useState<string>('1HZ10V');
    const [instantStrategy, setInstantStrategy] = useState<string>('Even');
    const [instantStake, setInstantStake] = useState<number>(10);
    const [instantDuration, setInstantDuration] = useState<number>(1);
    const [instantPrediction, setInstantPrediction] = useState<number>(1);
    const [instantBoth, setInstantBoth] = useState<boolean>(false);
    const [instantExecutionMode, setInstantExecutionMode] = useState<'turbo' | 'safe'>('safe');
    const [instantBulkCount, setInstantBulkCount] = useState<number>(10);
    const [analysisData, setAnalysisData] = useState<string[]>([
        'E', 'E', 'O', 'E', 'O', 'O', 'O', 'O', 'O', 'E', 'O', 'E', 'E', 'E', 'O', 'E', 'E',
        'E', 'O', 'O', 'O', 'E', 'O', 'O', 'O', 'O', 'O', 'E', 'O', 'O', 'E', 'O',
        'E', 'E', 'E', 'O', 'O', 'O', 'E', 'E', 'O', 'E', 'E', 'E', 'E', 'O', 'E', 'O'
    ]);
    
    // Instant Matches state
    const [instantMatchesMode, setInstantMatchesMode] = useState<'matches-analysis' | 'over-under'>('matches-analysis');
    const [matchesMarket, setMatchesMarket] = useState<string>('1HZ10V');
    const [matchesStrategy, setMatchesStrategy] = useState<string>('Matches');
    const [matchesStake, setMatchesStake] = useState<number>(10);
    const [matchesTakeProfit, setMatchesTakeProfit] = useState<number>(0);
    const [matchesDuration, setMatchesDuration] = useState<number>(1);
    const [matchesExecutionMode, setMatchesExecutionMode] = useState<'turbo' | 'safe'>('safe');
    const [matchesBulkCount, setMatchesBulkCount] = useState<number>(1);
    const [matchesAnalysisDigits, setMatchesAnalysisDigits] = useState<number[]>([2, 4, 6]);
    const [matchesAnalysisData, setMatchesAnalysisData] = useState<number[]>([
        9, 9, 4, 9, 2, 0, 9, 6, 7, 8, 6, 1, 9, 9, 6, 0, 4, 2, 9, 0,
        6, 7, 4, 1, 1, 0, 3, 6, 6, 4, 4, 8, 3, 2, 3, 1, 1, 8,
        4, 3, 8, 0, 0, 7, 4, 5, 4, 3, 3, 5, 5, 9, 9, 0, 3, 1, 1, 8
    ]);
    
    // Multiple Stakes state
    const [multipleStakesMode, setMultipleStakesMode] = useState<'multiple-stakes' | 'over-under'>('multiple-stakes');
    const [selectedPrediction, setSelectedPrediction] = useState<number>(2);
    const [digit2Stake, setDigit2Stake] = useState<number>(5);
    const [digit4Stake, setDigit4Stake] = useState<number>(5);
    const [digit6Stake, setDigit6Stake] = useState<number>(5);
    const [executionMode, setExecutionMode] = useState<'turbo' | 'safe'>('safe');
    const [multiMarket, setMultiMarket] = useState<string>('1HZ10V');
    const [multiStrategy, setMultiStrategy] = useState<string>('Over');
    const [multiTakeProfit, setMultiTakeProfit] = useState<number>(0);
    const [multiDuration, setMultiDuration] = useState<number>(1);
    const [multiBulkCount, setMultiBulkCount] = useState<number>(1);
    
    // Active strategies
    const [activeStrategies, setActiveStrategies] = useState<ActiveStrategy[]>([
        { id: 1, type: 'Over', stake: 100, prediction: 2 },
        { id: 2, type: 'Under', stake: 100, prediction: 7 },
    ]);
    
    // Configuration
    const [market, setMarket] = useState<string>('1HZ10V');
    const [defaultStake, setDefaultStake] = useState<number>(1);
    const [martingale, setMartingale] = useState<number>(1);
    const [ticks, setTicks] = useState<number>(1);
    const [defaultDigit, setDefaultDigit] = useState<number>(6);
    const [switchMarket, setSwitchMarket] = useState<boolean>(false);
    const [switchOnLoss, setSwitchOnLoss] = useState<boolean>(false);
    const [turboOff, setTurboOff] = useState<boolean>(true);
    const [rounds, setRounds] = useState<number>(100);
    const [takeProfit, setTakeProfit] = useState<number>(100);
    const [lossesToSwitch, setLossesToSwitch] = useState<number>(1);
    const [stopLoss, setStopLoss] = useState<number>(500);
    const [delayOff, setDelayOff] = useState<boolean>(true);
    
    // Market switching state
    const [currentStrategyIndex, setCurrentStrategyIndex] = useState<number>(0);
    const [consecutiveLosses, setConsecutiveLosses] = useState<number>(0);
    const strategyRotation: StrategyType[] = ['Even', 'Odd', 'Differs', 'Over', 'Under', 'Rise', 'Fall'];
    
    // Running state
    const [isRunning, setIsRunning] = useState<boolean>(false);
    
    // Bot statistics
    const [botStats, setBotStats] = useState<BotStats>({
        totalTrades: 0,
        wins: 0,
        losses: 0,
        totalProfit: 0,
        currentStreak: 0,
        isRunning: false,
    });

    // Statistics for each tab
    const [instantFillStats, setInstantFillStats] = useState({ totalPL: 0, totalRuns: 0, won: 0, lost: 0 });
    const [multipleStakesStats, setMultipleStakesStats] = useState({ totalPL: 0, totalRuns: 0, won: 0, lost: 0 });
    const [instantMatchesStats, setInstantMatchesStats] = useState({ totalPL: 0, totalRuns: 0, won: 0, lost: 0 });
    
    // Digit statistics for Multiple Stakes and Instant Matches
    const [digitStats, setDigitStats] = useState<Array<{ digit: number; percentage: number }>>([]);
    
    // Live cursor for digit tracking
    const [currentLastDigit, setCurrentLastDigit] = useState<number | null>(null);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    
    // Trading state
    const [isTrading, setIsTrading] = useState(false);
    const [tradeError, setTradeError] = useState<string | null>(null);
    
    // Get store and portfolio
    const { client } = useStore();
    const { fetchPortfolio } = usePortfolio();
    
    // Balance check helper
    const checkBalance = useCallback((requiredAmount: number): boolean => {
        if (!client?.all_accounts_balance || !client?.loginid) {
            setTradeError('Not connected to API');
            return false;
        }
        
        const activeLoginid = client.loginid;
        const balanceData = (client.all_accounts_balance as any)[activeLoginid];
        const balance = balanceData?.balance || 0;
        
        if (balance < requiredAmount) {
            setTradeError(`Insufficient balance. Required: $${requiredAmount}, Available: $${balance.toFixed(2)}`);
            return false;
        }
        
        return true;
    }, [client]);

    // INSTANT FILL HANDLERS - Now executes REAL trades via Deriv API
    const handleInstantFillTrade = useCallback(async (strategy: 'Even' | 'Odd') => {
        if (!checkBalance(instantStake)) return;
        
        setIsTrading(true);
        setTradeError(null);
        
        try {
            console.log('🎯 Executing REAL trade:', { market: instantMarket, strategy, stake: instantStake });
            
            // Map strategy to contract type
            const contractType = strategy === 'Even' ? 'DIGITEVEN' : 'DIGITODD';
            
            // Execute real trade via signal trading service
            const tradeConfig: SignalTradeConfig = {
                signalId: `instant-fill-${Date.now()}`,
                market: instantMarket,
                type: contractType,
                stake: instantStake,
                duration: instantDuration,
                durationUnit: 't', // ticks
                barrier: instantPrediction.toString(),
            };
            
            const result = await signalTradingService.executeSignalTrade(tradeConfig, (tradeResult) => {
                console.log('✅ Trade completed:', tradeResult);
                if (tradeResult.profit !== undefined) {
                    setInstantFillStats(prev => ({
                        totalPL: prev.totalPL + tradeResult.profit!,
                        totalRuns: prev.totalRuns + 1,
                        won: prev.won + (tradeResult.isWon ? 1 : 0),
                        lost: prev.lost + (tradeResult.isWon ? 0 : 1),
                    }));
                }
            });
            
            if (!result.success) {
                setTradeError(result.error || 'Trade execution failed');
            }
            
            fetchPortfolio();
        } catch (error: any) {
            setTradeError(error.message || 'Trade failed');
            console.error('Instant Fill trade failed:', error);
        } finally {
            setIsTrading(false);
        }
    }, [instantMarket, instantStake, instantDuration, instantPrediction, instantBoth, checkBalance, fetchPortfolio]);

    const handleBulkInstantFill = useCallback(async (strategy: 'Even' | 'Odd') => {
        if (!checkBalance(instantStake * instantBulkCount)) return;
        
        setIsTrading(true);
        setTradeError(null);
        
        try {
            console.log(`🎯 Executing ${instantBulkCount} REAL trades:`, { market: instantMarket, strategy, stake: instantStake });
            
            const contractType = strategy === 'Even' ? 'DIGITEVEN' : 'DIGITODD';
            
            // Execute multiple real trades
            for (let i = 0; i < instantBulkCount; i++) {
                const tradeConfig: SignalTradeConfig = {
                    signalId: `instant-fill-bulk-${Date.now()}-${i}`,
                    market: instantMarket,
                    type: contractType,
                    stake: instantStake,
                    duration: instantDuration,
                    durationUnit: 't',
                    barrier: instantPrediction.toString(),
                };
                
                const result = await signalTradingService.executeSignalTrade(tradeConfig, (tradeResult) => {
                    if (tradeResult.profit !== undefined) {
                        setInstantFillStats(prev => ({
                            totalPL: prev.totalPL + tradeResult.profit!,
                            totalRuns: prev.totalRuns + 1,
                            won: prev.won + (tradeResult.isWon ? 1 : 0),
                            lost: prev.lost + (tradeResult.isWon ? 0 : 1),
                        }));
                    }
                });
                
                if (!result.success) {
                    console.error(`Trade ${i + 1} failed:`, result.error);
                }
                
                // Small delay between trades
                if (i < instantBulkCount - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            fetchPortfolio();
        } catch (error: any) {
            setTradeError(error.message || 'Bulk trades failed');
            console.error('Bulk Instant Fill failed:', error);
        } finally {
            setIsTrading(false);
        }
    }, [instantMarket, instantStake, instantDuration, instantPrediction, instantBoth, instantBulkCount, checkBalance, fetchPortfolio]);

    // MULTIPLE STAKES HANDLERS - Now executes REAL trades
    const handleMultipleStakes = useCallback(async (strategy: 'Over' | 'Under') => {
        const totalStake = digit2Stake + digit4Stake + digit6Stake;
        if (!checkBalance(totalStake)) return;
        
        setIsTrading(true);
        setTradeError(null);
        
        try {
            console.log('🎯 Executing REAL multiple stakes:', { market: multiMarket, strategy });
            
            const contractType = strategy === 'Over' ? 'DIGITOVER' : 'DIGITUNDER';
            const digits = [
                { digit: 2, stake: digit2Stake },
                { digit: 4, stake: digit4Stake },
                { digit: 6, stake: digit6Stake },
            ];
            
            // Execute trade for each digit with stake > 0
            for (const { digit, stake } of digits) {
                if (stake > 0) {
                    const tradeConfig: SignalTradeConfig = {
                        signalId: `multiple-stakes-${Date.now()}-digit${digit}`,
                        market: multiMarket,
                        type: contractType,
                        stake,
                        duration: multiDuration,
                        durationUnit: 't',
                        barrier: digit.toString(),
                    };
                    
                    const result = await signalTradingService.executeSignalTrade(tradeConfig, (tradeResult) => {
                        if (tradeResult.profit !== undefined) {
                            setMultipleStakesStats(prev => ({
                                totalPL: prev.totalPL + tradeResult.profit!,
                                totalRuns: prev.totalRuns + 1,
                                won: prev.won + (tradeResult.isWon ? 1 : 0),
                                lost: prev.lost + (tradeResult.isWon ? 0 : 1),
                            }));
                        }
                    });
                    
                    if (!result.success) {
                        console.error(`Trade for digit ${digit} failed:`, result.error);
                    }
                    
                    // Small delay between trades
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            fetchPortfolio();
        } catch (error: any) {
            setTradeError(error.message || 'Multiple stakes failed');
            console.error('Multiple stakes failed:', error);
        } finally {
            setIsTrading(false);
        }
    }, [multiMarket, digit2Stake, digit4Stake, digit6Stake, multiTakeProfit, multiDuration, checkBalance, fetchPortfolio]);

    const handleBulkMultipleStakes = useCallback(async (strategy: 'Over' | 'Under') => {
        const totalStake = (digit2Stake + digit4Stake + digit6Stake) * multiBulkCount;
        if (!checkBalance(totalStake)) return;
        
        setIsTrading(true);
        setTradeError(null);
        
        try {
            for (let i = 0; i < multiBulkCount; i++) {
                await multipleStakesService.executeMultipleStakes({
                    market: multiMarket,
                    strategy,
                    digit2Stake,
                    digit4Stake,
                    digit6Stake,
                    takeProfit: multiTakeProfit,
                    duration: multiDuration,
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            const stats = multipleStakesService.getStats();
            setMultipleStakesStats(stats);
            fetchPortfolio();
        } catch (error: any) {
            setTradeError(error.message || 'Bulk multiple stakes failed');
            console.error('Bulk multiple stakes failed:', error);
        } finally {
            setIsTrading(false);
        }
    }, [multiMarket, digit2Stake, digit4Stake, digit6Stake, multiTakeProfit, multiDuration, multiBulkCount, checkBalance, fetchPortfolio]);

    // INSTANT MATCHES HANDLERS - Now executes REAL trades
    const handleMatchesTrade = useCallback(async (prediction?: number) => {
        if (!checkBalance(matchesStake)) return;
        
        setIsTrading(true);
        setTradeError(null);
        
        try {
            console.log('🎯 Executing REAL matches trade:', { market: matchesMarket, strategy: matchesStrategy, prediction });
            
            // Use prediction if provided, otherwise use first selected digit
            const targetDigit = prediction !== undefined ? prediction : matchesAnalysisDigits[0];
            
            const tradeConfig: SignalTradeConfig = {
                signalId: `instant-matches-${Date.now()}`,
                market: matchesMarket,
                type: matchesStrategy === 'Matches' ? 'DIGITMATCH' : 'DIGITDIFF',
                stake: matchesStake,
                duration: matchesDuration,
                durationUnit: 't',
                barrier: targetDigit?.toString(),
            };
            
            const result = await signalTradingService.executeSignalTrade(tradeConfig, (tradeResult) => {
                if (tradeResult.profit !== undefined) {
                    setInstantMatchesStats(prev => ({
                        totalPL: prev.totalPL + tradeResult.profit!,
                        totalRuns: prev.totalRuns + 1,
                        won: prev.won + (tradeResult.isWon ? 1 : 0),
                        lost: prev.lost + (tradeResult.isWon ? 0 : 1),
                    }));
                }
            });
            
            if (!result.success) {
                setTradeError(result.error || 'Trade execution failed');
            }
            
            fetchPortfolio();
        } catch (error: any) {
            setTradeError(error.message || 'Matches trade failed');
            console.error('Matches trade failed:', error);
        } finally {
            setIsTrading(false);
        }
    }, [matchesMarket, matchesStrategy, matchesStake, matchesTakeProfit, matchesDuration, matchesAnalysisDigits, checkBalance, fetchPortfolio]);

    const handleBulkMatches = useCallback(async (prediction?: number) => {
        if (!checkBalance(matchesStake * matchesBulkCount)) return;
        
        setIsTrading(true);
        setTradeError(null);
        
        try {
            await instantMatchesService.executeBulkTrades(
                {
                    market: matchesMarket,
                    strategy: matchesStrategy as any,
                    stake: matchesStake,
                    takeProfit: matchesTakeProfit,
                    duration: matchesDuration,
                    selectedDigits: matchesAnalysisDigits,
                },
                matchesBulkCount,
                prediction
            );
            
            const stats = instantMatchesService.getStats();
            setInstantMatchesStats(stats);
            fetchPortfolio();
        } catch (error: any) {
            setTradeError(error.message || 'Bulk matches failed');
            console.error('Bulk matches failed:', error);
        } finally {
            setIsTrading(false);
        }
    }, [matchesMarket, matchesStrategy, matchesStake, matchesTakeProfit, matchesDuration, matchesAnalysisDigits, matchesBulkCount, checkBalance, fetchPortfolio]);

    // RESET HANDLERS
    const handleResetInstantFill = useCallback(() => {
        instantFillService.resetStats();
        setInstantFillStats({ totalPL: 0, totalRuns: 0, won: 0, lost: 0 });
        setAnalysisData([]);
    }, []);

    const handleResetMultipleStakes = useCallback(() => {
        multipleStakesService.resetStats();
        setMultipleStakesStats({ totalPL: 0, totalRuns: 0, won: 0, lost: 0 });
        setDigitStats([]);
    }, []);

    const handleResetInstantMatches = useCallback(() => {
        instantMatchesService.resetStats();
        setInstantMatchesStats({ totalPL: 0, totalRuns: 0, won: 0, lost: 0 });
        setMatchesAnalysisData([]);
    }, []);

    const handleRun = () => {
        if (isRunning) {
            setIsRunning(false);
        } else {
            setIsRunning(true);
        }
    };

    const handleReset = () => {
        setActiveStrategies([]);
        setBotStats({
            totalTrades: 0,
            wins: 0,
            losses: 0,
            totalProfit: 0,
            currentStreak: 0,
            isRunning: false,
        });
    };

    // Subscribe to ticks for Instant Fill
    useEffect(() => {
        if (activeTab === 'instant-fill') {
            try {
                instantFillService.subscribeToTicks(instantMarket, () => {
                    const newData = instantFillService.getAnalysisData();
                    setAnalysisData(newData);
                });
            } catch (error) {
                console.error('Failed to subscribe to Instant Fill ticks:', error);
            }
            
            return () => {
                try {
                    instantFillService.unsubscribeFromTicks();
                } catch (error) {
                    console.error('Failed to unsubscribe from Instant Fill ticks:', error);
                }
            };
        }
    }, [activeTab, instantMarket]);

    // Subscribe to ticks for Multiple Stakes with live cursor
    useEffect(() => {
        let subscription: any;
        
        if (activeTab === 'multiple-stakes') {
            try {
                // Subscribe to ticks and track current digit
                derivAPIService.subscribeToTicks(multiMarket, (response: any) => {
                    try {
                        if (response && response.tick && response.tick.quote) {
                            const price = parseFloat(response.tick.quote);
                            const lastDigit = parseInt(price.toString().slice(-1));
                            
                            setCurrentPrice(price);
                            setCurrentLastDigit(lastDigit);
                        }
                    } catch (err) {
                        console.error('Error processing tick data:', err);
                    }
                });
                
                // Also subscribe for stats
                subscription = multipleStakesService.subscribeToTicks(multiMarket, (stats) => {
                    setDigitStats(stats);
                });
            } catch (error) {
                console.error('Failed to subscribe to Multiple Stakes ticks:', error);
            }
        } else {
            // Reset when not on Multiple Stakes tab
            setCurrentPrice(null);
            setCurrentLastDigit(null);
        }
        
        return () => {
            try {
                if (subscription && typeof subscription.unsubscribe === 'function') {
                    subscription.unsubscribe();
                }
            } catch (error) {
                console.error('Failed to unsubscribe from Multiple Stakes ticks:', error);
            }
        };
    }, [activeTab, multiMarket]);

    // Subscribe to ticks for Instant Matches
    useEffect(() => {
        let subscription: any;
        
        if (activeTab === 'instant-matches') {
            try {
                subscription = instantMatchesService.subscribeToTicks(matchesMarket, (data) => {
                    setDigitStats(data.stats);
                    setMatchesAnalysisData(data.analysisData);
                });
            } catch (error) {
                console.error('Failed to subscribe to Instant Matches ticks:', error);
            }
        }
        
        return () => {
            try {
                if (subscription && typeof subscription.unsubscribe === 'function') {
                    subscription.unsubscribe();
                }
            } catch (error) {
                console.error('Failed to unsubscribe from Instant Matches ticks:', error);
            }
        };
    }, [activeTab, matchesMarket]);

    // Poll for statistics updates
    useEffect(() => {
        const interval = setInterval(() => {
            try {
                if (activeTab === 'instant-fill') {
                    const stats = instantFillService.getStats();
                    setInstantFillStats(stats);
                } else if (activeTab === 'multiple-stakes') {
                    const stats = multipleStakesService.getStats();
                    setMultipleStakesStats(stats);
                } else if (activeTab === 'instant-matches') {
                    const stats = instantMatchesService.getStats();
                    setInstantMatchesStats(stats);
                }
            } catch (error) {
                console.error('Failed to update statistics:', error);
            }
        }, 2000);
        
        return () => clearInterval(interval);
    }, [activeTab]);

    // Fetch portfolio periodically
    useEffect(() => {
        const interval = setInterval(() => {
            try {
                fetchPortfolio();
            } catch (error) {
                console.error('Failed to fetch portfolio:', error);
            }
        }, 3000);
        
        return () => clearInterval(interval);
    }, [fetchPortfolio]);

    // Update digit stats display
    const getDigitPercentage = (digit: number): string => {
        const stat = digitStats.find(s => s.digit === digit);
        return stat ? `${stat.percentage.toFixed(1)}%` : '0.0%';
    };

    // Get active positions (for future use)
    // const activePositions = portfolio?.contracts || [];

    // Get account type (for future use)
    // const accountType = client?.loginid?.startsWith('VRT') ? 'DEMO' : 'REAL';
    // const isDemo = accountType === 'DEMO';

    return (
        <div className='trading-hub-container'>
            {/* Demo Mode Notice */}
            <div className='demo-mode-notice'>
                <span className='notice-icon'>🔄</span>
                <span className='notice-text'>
                    Trading Hub is in SIMULATION MODE - No real trades are executed. 
                    Trades are simulated for testing purposes only.
                </span>
            </div>

            {/* Tabs */}
            <div className='trading-tabs'>
                <button 
                    className={`tab-btn ${activeTab === 'instant-fill' ? 'active' : ''}`}
                    onClick={() => setActiveTab('instant-fill')}
                >
                    Instant Fill
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'multiple-stakes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('multiple-stakes')}
                >
                    Multiple Stakes
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'flipa-switcher' ? 'active' : ''}`}
                    onClick={() => setActiveTab('flipa-switcher')}
                >
                    Flipa Switcher
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'instant-matches' ? 'active' : ''}`}
                    onClick={() => setActiveTab('instant-matches')}
                >
                    Instant Matches
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'instant-fill' && (
                <>
                    {/* Mode Tabs */}
                    <div className='mode-tabs'>
                        <button 
                            className={`mode-tab ${instantFillMode === 'even-odd' ? 'active' : ''}`}
                            onClick={() => setInstantFillMode('even-odd')}
                        >
                            Even/Odd
                        </button>
                        <button 
                            className={`mode-tab ${instantFillMode === 'over-under' ? 'active' : ''}`}
                            onClick={() => setInstantFillMode('over-under')}
                        >
                            Over/Under
                        </button>
                    </div>

                    {/* Market Selector */}
                    <div className='market-selector-box'>
                        <select 
                            className='market-dropdown'
                            value={instantMarket}
                            onChange={(e) => setInstantMarket(e.target.value)}
                        >
                            <option value='1HZ10V'>Volatility 10(1s) index</option>
                            <option value='1HZ25V'>Volatility 25(1s) index</option>
                            <option value='1HZ50V'>Volatility 50(1s) index</option>
                            <option value='1HZ75V'>Volatility 75(1s) index</option>
                            <option value='1HZ100V'>Volatility 100(1s) index</option>
                        </select>
                    </div>

                    {/* Panel */}
                    <div className='instant-fill-panel'>
                        <div className='panel-header'>Panel</div>
                        
                        {/* Execution Mode */}
                        <div className='execution-mode'>
                            <label className='mode-label'>Execution Mode</label>
                            <div className='mode-buttons'>
                                <button 
                                    className={`mode-btn turbo ${instantExecutionMode === 'turbo' ? 'active' : ''}`}
                                    onClick={() => setInstantExecutionMode('turbo')}
                                >
                                    Turbo
                                </button>
                                <button 
                                    className={`mode-btn safe ${instantExecutionMode === 'safe' ? 'active' : ''}`}
                                    onClick={() => setInstantExecutionMode('safe')}
                                >
                                    Safe
                                </button>
                            </div>
                        </div>

                        {/* Configuration Row */}
                        <div className='instant-config-row'>
                            <div className='instant-config-item'>
                                <label>Market</label>
                                <select className='instant-select' value={instantMarket} onChange={(e) => setInstantMarket(e.target.value)}>
                                    <option value='1HZ10V'>Vol 10 (1s)</option>
                                    <option value='1HZ25V'>Vol 25 (1s)</option>
                                    <option value='1HZ50V'>Vol 50 (1s)</option>
                                    <option value='1HZ75V'>Vol 75 (1s)</option>
                                    <option value='1HZ100V'>Vol 100 (1s)</option>
                                </select>
                            </div>
                            <div className='instant-config-item'>
                                <label>Strategy</label>
                                <select className='instant-select' value={instantStrategy} onChange={(e) => setInstantStrategy(e.target.value)}>
                                    <option value='Even'>Even</option>
                                    <option value='Odd'>Odd</option>
                                </select>
                            </div>
                            <div className='instant-config-item'>
                                <label>Stake (USD)</label>
                                <input 
                                    type='number'
                                    className='instant-input' 
                                    value={instantStake} 
                                    onChange={(e) => setInstantStake(parseFloat(e.target.value))}
                                />
                            </div>
                            <div className='instant-config-item'>
                                <label>Duration (ticks)</label>
                                <select className='instant-select' value={instantDuration} onChange={(e) => setInstantDuration(parseInt(e.target.value))}>
                                    <option value='1'>1</option>
                                    <option value='2'>2</option>
                                    <option value='3'>3</option>
                                    <option value='5'>5</option>
                                    <option value='10'>10</option>
                                </select>
                            </div>
                            <div className='instant-config-item'>
                                <label>Prediction</label>
                                <input 
                                    type='number'
                                    className='instant-input' 
                                    value={instantPrediction} 
                                    onChange={(e) => setInstantPrediction(parseInt(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* Both Toggle */}
                        <div className='both-toggle'>
                            <label>Both</label>
                            <button 
                                className={`toggle-switch ${instantBoth ? 'on' : 'off'}`}
                                onClick={() => setInstantBoth(!instantBoth)}
                            >
                                {instantBoth ? 'ON' : 'OFF'}
                            </button>
                        </div>

                        {/* Positions Table */}
                        <div className='instant-positions-table'>
                            <div className='instant-table-header'>
                                <span>Type</span>
                                <span>Entry/Exit spot</span>
                                <span>Buy price and P/L</span>
                            </div>
                            <div className='instant-table-body'>
                                <div className='no-positions'>No positions</div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className='instant-action-buttons'>
                            <button 
                                className='instant-btn even-btn' 
                                onClick={() => handleInstantFillTrade('Even')}
                                disabled={isTrading}
                            >
                                {isTrading ? 'Trading...' : 'Even'}
                            </button>
                            <button 
                                className='instant-btn odd-btn'
                                onClick={() => handleInstantFillTrade('Odd')}
                                disabled={isTrading}
                            >
                                {isTrading ? 'Trading...' : 'Odd'}
                            </button>
                            <button 
                                className='instant-btn reset-btn'
                                onClick={handleResetInstantFill}
                                disabled={isTrading}
                            >
                                Reset
                            </button>
                        </div>

                        {/* Bulk Controls */}
                        <div className='instant-bulk-controls'>
                            <div className='bulk-count-selector'>
                                <label>Bulk Count</label>
                                <select className='bulk-select' value={instantBulkCount} onChange={(e) => setInstantBulkCount(parseInt(e.target.value))}>
                                    <option value='1'>1</option>
                                    <option value='5'>5</option>
                                    <option value='10'>10</option>
                                    <option value='20'>20</option>
                                    <option value='50'>50</option>
                                </select>
                            </div>
                        </div>

                        <div className='instant-bulk-buttons'>
                            <button 
                                className='bulk-btn bulk-even'
                                onClick={() => handleBulkInstantFill('Even')}
                                disabled={isTrading}
                            >
                                {isTrading ? 'Trading...' : 'Bulk Even'}
                            </button>
                            <button 
                                className='bulk-btn bulk-odd'
                                onClick={() => handleBulkInstantFill('Odd')}
                                disabled={isTrading}
                            >
                                {isTrading ? 'Trading...' : 'Bulk Odd'}
                            </button>
                            <button 
                                className='bulk-btn stop-bulk'
                                onClick={() => instantFillService.stop()}
                                disabled={!isTrading}
                            >
                                Stop Bulk
                            </button>
                        </div>

                        {/* Statistics */}
                        <div className='instant-stats'>
                            <div className='stat-box'>
                                <span className='stat-label'>TOTAL P/L</span>
                                <span className={`stat-value ${instantFillStats.totalPL >= 0 ? 'profit' : 'loss'}`}>
                                    {instantFillStats.totalPL >= 0 ? '+' : ''}${instantFillStats.totalPL.toFixed(2)} USD
                                </span>
                            </div>
                            <div className='stat-box'>
                                <span className='stat-label'>NO. OF RUNS</span>
                                <span className='stat-value'>{instantFillStats.totalRuns}</span>
                            </div>
                            <div className='stat-box'>
                                <span className='stat-label'>WON</span>
                                <span className='stat-value'>{instantFillStats.won}</span>
                            </div>
                            <div className='stat-box'>
                                <span className='stat-label'>LOST</span>
                                <span className='stat-value'>{instantFillStats.lost}</span>
                            </div>
                        </div>
                        
                        {/* Error Display */}
                        {tradeError && (
                            <div className='trade-error'>
                                ⚠️ {tradeError}
                            </div>
                        )}
                    </div>

                    {/* Analysis Chamber */}
                    <div className='analysis-chamber'>
                        <div className='chamber-header'>Analysis Chamber</div>
                        <div className='analysis-grid'>
                            {analysisData.map((item, index) => (
                                <div 
                                    key={index} 
                                    className={`analysis-item ${item === 'E' ? 'even' : 'odd'} ${index === 0 ? 'active' : ''}`}
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'multiple-stakes' && (
                <>
                    {/* Mode Tabs */}
                    <div className='mode-tabs'>
                        <button 
                            className={`mode-tab ${multipleStakesMode === 'multiple-stakes' ? 'active' : ''}`}
                            onClick={() => setMultipleStakesMode('multiple-stakes')}
                        >
                            Multiple Stakes
                        </button>
                        <button 
                            className={`mode-tab ${multipleStakesMode === 'over-under' ? 'active' : ''}`}
                            onClick={() => setMultipleStakesMode('over-under')}
                        >
                            Over/Under Analysis
                        </button>
                    </div>

                    {/* Market Selector */}
                    <div className='market-selector-box'>
                        <select 
                            className='market-dropdown'
                            value={multiMarket}
                            onChange={(e) => setMultiMarket(e.target.value)}
                        >
                            <option value='1HZ10V'>Volatility 10(1s) Index</option>
                            <option value='1HZ25V'>Volatility 25(1s) Index</option>
                            <option value='1HZ50V'>Volatility 50(1s) Index</option>
                            <option value='1HZ75V'>Volatility 75(1s) Index</option>
                            <option value='1HZ100V'>Volatility 100(1s) Index</option>
                        </select>
                    </div>

                    {/* Prediction Selector */}
                    <div className='prediction-section'>
                        <label className='section-label'>Prediction selector</label>
                        <div className='prediction-buttons'>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    className={`prediction-btn ${selectedPrediction === num ? 'active' : ''} ${num === 2 ? 'yellow' : num === 4 ? 'purple' : num === 6 ? 'green' : ''}`}
                                    onClick={() => setSelectedPrediction(num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stake Inputs */}
                    <div className='stake-inputs-row'>
                        <div className='stake-input-group'>
                            <label>Digit 2 Stake</label>
                            <input 
                                type='number'
                                className='stake-input-field'
                                value={digit2Stake}
                                onChange={(e) => setDigit2Stake(parseFloat(e.target.value))}
                            />
                        </div>
                        <div className='stake-input-group'>
                            <label>Digit 4 Stake</label>
                            <input 
                                type='number'
                                className='stake-input-field'
                                value={digit4Stake}
                                onChange={(e) => setDigit4Stake(parseFloat(e.target.value))}
                            />
                        </div>
                        <div className='stake-input-group'>
                            <label>Digit 6 Stake</label>
                            <input 
                                type='number'
                                className='stake-input-field'
                                value={digit6Stake}
                                onChange={(e) => setDigit6Stake(parseFloat(e.target.value))}
                            />
                        </div>
                    </div>

                    {/* Digit Stats Circles with Live Cursor */}
                    <div className='digit-stats-circles'>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                            <div 
                                key={digit} 
                                className={`digit-circle ${digit === currentLastDigit ? 'live-cursor' : ''} ${[2, 4, 6].includes(digit) ? 'selected' : ''}`}
                            >
                                <div className='digit-number'>{digit}</div>
                                <div className='digit-percentage'>
                                    {getDigitPercentage(digit)}
                                </div>
                                {digit === currentLastDigit && (
                                    <div className='cursor-indicator'>●</div>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    {/* Live Price Display */}
                    {currentPrice !== null && (
                        <div className='live-price-display'>
                            <span className='price-label'>Live Price:</span>
                            <span className='price-value'>{currentPrice.toFixed(2)}</span>
                            <span className='last-digit-label'>Last Digit:</span>
                            <span className='last-digit-value'>{currentLastDigit}</span>
                        </div>
                    )}

                    {/* Panel */}
                    <div className='multi-stakes-panel'>
                        <div className='panel-header'>Panel</div>
                        
                        {/* Execution Mode */}
                        <div className='execution-mode'>
                            <label className='mode-label'>Execution Mode</label>
                            <div className='mode-buttons'>
                                <button 
                                    className={`mode-btn turbo ${executionMode === 'turbo' ? 'active' : ''}`}
                                    onClick={() => setExecutionMode('turbo')}
                                >
                                    Turbo
                                </button>
                                <button 
                                    className={`mode-btn safe ${executionMode === 'safe' ? 'active' : ''}`}
                                    onClick={() => setExecutionMode('safe')}
                                >
                                    Safe
                                </button>
                            </div>
                            <div className='safe-mode-indicator'>
                                <span className='indicator-dot'></span>
                                <span>Safe mode</span>
                            </div>
                        </div>

                        {/* Configuration Row */}
                        <div className='multi-config-row'>
                            <div className='multi-config-item'>
                                <label>Market</label>
                                <select className='multi-select' value={multiMarket} onChange={(e) => setMultiMarket(e.target.value)}>
                                    <option value='1HZ10V'>Vol 10 (1s)</option>
                                    <option value='1HZ25V'>Vol 25 (1s)</option>
                                    <option value='1HZ50V'>Vol 50 (1s)</option>
                                    <option value='1HZ75V'>Vol 75 (1s)</option>
                                    <option value='1HZ100V'>Vol 100 (1s)</option>
                                </select>
                            </div>
                            <div className='multi-config-item'>
                                <label>Strategy</label>
                                <select className='multi-select' value={multiStrategy} onChange={(e) => setMultiStrategy(e.target.value)}>
                                    <option value='Over'>Over</option>
                                    <option value='Under'>Under</option>
                                </select>
                            </div>
                            <div className='multi-config-item'>
                                <label>Take Profit (USD)</label>
                                <select className='multi-select' value={multiTakeProfit} onChange={(e) => setMultiTakeProfit(parseInt(e.target.value))}>
                                    <option value='0'>0</option>
                                    <option value='10'>10</option>
                                    <option value='20'>20</option>
                                    <option value='50'>50</option>
                                    <option value='100'>100</option>
                                </select>
                            </div>
                            <div className='multi-config-item'>
                                <label>Duration (ticks)</label>
                                <select className='multi-select' value={multiDuration} onChange={(e) => setMultiDuration(parseInt(e.target.value))}>
                                    <option value='1'>1</option>
                                    <option value='2'>2</option>
                                    <option value='3'>3</option>
                                    <option value='5'>5</option>
                                    <option value='10'>10</option>
                                </select>
                            </div>
                        </div>

                        {/* Positions Table */}
                        <div className='multi-positions-table'>
                            <div className='multi-table-header'>
                                <span>Type</span>
                                <span>Entry/Exit spot</span>
                                <span>Buy price & P/L</span>
                            </div>
                            <div className='multi-table-body'>
                                <div className='no-positions'>No positions</div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className='action-buttons-row'>
                            <button 
                                className='action-btn over-btn'
                                onClick={() => handleMultipleStakes('Over')}
                                disabled={isTrading}
                            >
                                {isTrading ? 'Trading...' : 'Over'}
                            </button>
                            <button 
                                className='action-btn under-btn'
                                onClick={() => handleMultipleStakes('Under')}
                                disabled={isTrading}
                            >
                                {isTrading ? 'Trading...' : 'Under'}
                            </button>
                            <button 
                                className='action-btn reset-btn'
                                onClick={handleResetMultipleStakes}
                                disabled={isTrading}
                            >
                                Reset
                            </button>
                        </div>

                        {/* Bulk Controls */}
                        <div className='bulk-controls'>
                            <div className='bulk-count-selector'>
                                <label>Bulk Count</label>
                                <select className='bulk-select' value={multiBulkCount} onChange={(e) => setMultiBulkCount(parseInt(e.target.value))}>
                                    <option value='1'>1</option>
                                    <option value='5'>5</option>
                                    <option value='10'>10</option>
                                    <option value='20'>20</option>
                                    <option value='50'>50</option>
                                </select>
                            </div>
                        </div>

                        <div className='bulk-action-buttons'>
                            <button 
                                className='bulk-btn bulk-over'
                                onClick={() => handleBulkMultipleStakes('Over')}
                                disabled={isTrading}
                            >
                                {isTrading ? 'Trading...' : 'Bulk Over'}
                            </button>
                            <button 
                                className='bulk-btn bulk-under'
                                onClick={() => handleBulkMultipleStakes('Under')}
                                disabled={isTrading}
                            >
                                {isTrading ? 'Trading...' : 'Bulk Under'}
                            </button>
                            <button 
                                className='bulk-btn stop-bulk'
                                onClick={() => multipleStakesService.stop()}
                                disabled={!isTrading}
                            >
                                Stop Bulk
                            </button>
                        </div>
                    </div>

                    {/* Statistics Footer */}
                    <div className='stats-footer'>
                        <div className='stat-item'>
                            <span className='stat-label'>TOTAL P/L</span>
                            <span className={`stat-value ${multipleStakesStats.totalPL >= 0 ? 'profit' : 'loss'}`}>
                                {multipleStakesStats.totalPL >= 0 ? '+' : ''}${multipleStakesStats.totalPL.toFixed(2)} USD
                            </span>
                        </div>
                        <div className='stat-item'>
                            <span className='stat-label'>NO. OF RUNS</span>
                            <span className='stat-value'>{multipleStakesStats.totalRuns}</span>
                        </div>
                        <div className='stat-item'>
                            <span className='stat-label'>WON</span>
                            <span className='stat-value'>{multipleStakesStats.won}</span>
                        </div>
                        <div className='stat-item'>
                            <span className='stat-label'>LOST</span>
                            <span className='stat-value'>{multipleStakesStats.lost}</span>
                        </div>
                    </div>
                    
                    {tradeError && (
                        <div className='trade-error'>
                            ⚠️ {tradeError}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'instant-matches' && (
                <>
                    {/* Mode Tabs */}
                    <div className='mode-tabs'>
                        <button 
                            className={`mode-tab ${instantMatchesMode === 'matches-analysis' ? 'active' : ''}`}
                            onClick={() => setInstantMatchesMode('matches-analysis')}
                        >
                            Matches Analysis
                        </button>
                        <button 
                            className={`mode-tab ${instantMatchesMode === 'over-under' ? 'active' : ''}`}
                            onClick={() => setInstantMatchesMode('over-under')}
                        >
                            Over/Under Analysis
                        </button>
                    </div>

                    {/* Market Selector */}
                    <div className='market-selector-box'>
                        <select 
                            className='market-dropdown'
                            value={matchesMarket}
                            onChange={(e) => setMatchesMarket(e.target.value)}
                        >
                            <option value='1HZ10V'>Volatility 10(1s) index</option>
                            <option value='1HZ25V'>Volatility 25(1s) index</option>
                            <option value='1HZ50V'>Volatility 50(1s) index</option>
                            <option value='1HZ75V'>Volatility 75(1s) index</option>
                            <option value='1HZ100V'>Volatility 100(1s) index</option>
                        </select>
                    </div>

                    {/* Matches Analysis */}
                    <div className='matches-analysis-section'>
                        <label className='section-label'>Matches Analysis</label>
                        <div className='matches-buttons'>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    className={`matches-btn ${matchesAnalysisDigits.includes(num) ? 'active' : ''} ${num === 2 ? 'yellow' : num === 4 ? 'purple' : num === 6 ? 'green' : ''}`}
                                    onClick={() => {
                                        if (matchesAnalysisDigits.includes(num)) {
                                            setMatchesAnalysisDigits(matchesAnalysisDigits.filter(d => d !== num));
                                        } else {
                                            setMatchesAnalysisDigits([...matchesAnalysisDigits, num]);
                                        }
                                    }}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Digit Stats Circles */}
                    <div className='digit-stats-circles'>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                            <div key={digit} className={`digit-circle ${digit === 9 ? 'active' : ''}`}>
                                <div className='digit-number'>{digit}</div>
                                <div className='digit-percentage'>
                                    {getDigitPercentage(digit)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Panel */}
                    <div className='matches-panel'>
                        <div className='panel-header'>Panel</div>
                        
                        {/* Execution Mode */}
                        <div className='execution-mode'>
                            <label className='mode-label'>Execution Mode</label>
                            <div className='mode-buttons'>
                                <button 
                                    className={`mode-btn turbo ${matchesExecutionMode === 'turbo' ? 'active' : ''}`}
                                    onClick={() => setMatchesExecutionMode('turbo')}
                                >
                                    Turbo
                                </button>
                                <button 
                                    className={`mode-btn safe ${matchesExecutionMode === 'safe' ? 'active' : ''}`}
                                    onClick={() => setMatchesExecutionMode('safe')}
                                >
                                    Safe
                                </button>
                            </div>
                            <div className='safe-mode-indicator'>
                                <span className='indicator-dot'></span>
                                <span>Safe mode</span>
                            </div>
                        </div>

                        {/* Configuration Row */}
                        <div className='matches-config-row'>
                            <div className='matches-config-item'>
                                <label>Market</label>
                                <select className='matches-select' value={matchesMarket} onChange={(e) => setMatchesMarket(e.target.value)}>
                                    <option value='1HZ10V'>Vol 10 (1s)</option>
                                    <option value='1HZ25V'>Vol 25 (1s)</option>
                                    <option value='1HZ50V'>Vol 50 (1s)</option>
                                    <option value='1HZ75V'>Vol 75 (1s)</option>
                                    <option value='1HZ100V'>Vol 100 (1s)</option>
                                </select>
                            </div>
                            <div className='matches-config-item'>
                                <label>Strategy</label>
                                <select className='matches-select' value={matchesStrategy} onChange={(e) => setMatchesStrategy(e.target.value)}>
                                    <option value='Matches'>Matches</option>
                                    <option value='Differs'>Differs</option>
                                    <option value='Over'>Over</option>
                                    <option value='Under'>Under</option>
                                </select>
                            </div>
                            <div className='matches-config-item'>
                                <label>Stake (USD)</label>
                                <input 
                                    type='number'
                                    className='matches-input' 
                                    value={matchesStake} 
                                    onChange={(e) => setMatchesStake(parseFloat(e.target.value))}
                                />
                            </div>
                            <div className='matches-config-item'>
                                <label>Take Profit (USD)</label>
                                <select className='matches-select' value={matchesTakeProfit} onChange={(e) => setMatchesTakeProfit(parseInt(e.target.value))}>
                                    <option value='0'>0</option>
                                    <option value='10'>10</option>
                                    <option value='20'>20</option>
                                    <option value='50'>50</option>
                                    <option value='100'>100</option>
                                </select>
                            </div>
                            <div className='matches-config-item'>
                                <label>Duration (ticks)</label>
                                <select className='matches-select' value={matchesDuration} onChange={(e) => setMatchesDuration(parseInt(e.target.value))}>
                                    <option value='1'>1</option>
                                    <option value='2'>2</option>
                                    <option value='3'>3</option>
                                    <option value='5'>5</option>
                                    <option value='10'>10</option>
                                </select>
                            </div>
                        </div>

                        {/* Positions Table */}
                        <div className='matches-positions-table'>
                            <div className='matches-table-header'>
                                <span>Type</span>
                                <span>Entry/Exit spot</span>
                                <span>Buy price and P/L</span>
                            </div>
                            <div className='matches-table-body'>
                                <div className='no-positions'>No positions</div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className='matches-action-buttons'>
                            <button 
                                className='matches-btn-action matches-btn-primary'
                                onClick={() => handleMatchesTrade()}
                                disabled={isTrading}
                            >
                                {isTrading ? 'Trading...' : 'Matches'}
                            </button>
                            <button 
                                className='matches-btn-action over-btn-primary'
                                onClick={() => handleMatchesTrade()}
                                disabled={isTrading}
                            >
                                {isTrading ? 'Trading...' : 'Over'}
                            </button>
                            <button 
                                className='matches-btn-action reset-btn-primary'
                                onClick={handleResetInstantMatches}
                                disabled={isTrading}
                            >
                                Reset
                            </button>
                        </div>

                        {/* Bulk Controls */}
                        <div className='matches-bulk-controls'>
                            <div className='bulk-count-selector'>
                                <label>Bulk Count</label>
                                <select className='bulk-select' value={matchesBulkCount} onChange={(e) => setMatchesBulkCount(parseInt(e.target.value))}>
                                    <option value='1'>1</option>
                                    <option value='5'>5</option>
                                    <option value='10'>10</option>
                                    <option value='20'>20</option>
                                    <option value='50'>50</option>
                                </select>
                            </div>
                        </div>

                        <div className='matches-bulk-buttons'>
                            <button 
                                className='bulk-btn bulk-matches'
                                onClick={() => handleBulkMatches()}
                                disabled={isTrading}
                            >
                                {isTrading ? 'Trading...' : 'Bulk Matches'}
                            </button>
                            <button 
                                className='bulk-btn bulk-over'
                                onClick={() => handleBulkMatches()}
                                disabled={isTrading}
                            >
                                {isTrading ? 'Trading...' : 'Bulk Over'}
                            </button>
                            <button 
                                className='bulk-btn stop-bulk'
                                onClick={() => instantMatchesService.stop()}
                                disabled={!isTrading}
                            >
                                Stop Bulk
                            </button>
                        </div>

                        {/* Statistics */}
                        <div className='matches-stats'>
                            <div className='stat-box'>
                                <span className='stat-label'>TOTAL P/L</span>
                                <span className={`stat-value ${instantMatchesStats.totalPL >= 0 ? 'profit' : 'loss'}`}>
                                    {instantMatchesStats.totalPL >= 0 ? '+' : ''}${instantMatchesStats.totalPL.toFixed(2)} USD
                                </span>
                            </div>
                            <div className='stat-box'>
                                <span className='stat-label'>NO. OF RUNS</span>
                                <span className='stat-value'>{instantMatchesStats.totalRuns}</span>
                            </div>
                            <div className='stat-box'>
                                <span className='stat-label'>WON</span>
                                <span className='stat-value'>{instantMatchesStats.won}</span>
                            </div>
                            <div className='stat-box'>
                                <span className='stat-label'>LOST</span>
                                <span className='stat-value'>{instantMatchesStats.lost}</span>
                            </div>
                        </div>
                        
                        {tradeError && (
                            <div className='trade-error'>
                                ⚠️ {tradeError}
                            </div>
                        )}
                    </div>

                    {/* Analysis Chamber */}
                    <div className='analysis-chamber'>
                        <div className='chamber-header'>
                            Analysis Chamber
                            <span className='chamber-info'>(Latest on right →)</span>
                        </div>
                        <div className='matches-analysis-grid'>
                            {matchesAnalysisData.slice().reverse().map((digit, index) => {
                                const isHighlighted = matchesAnalysisDigits.includes(digit);
                                const actualIndex = matchesAnalysisData.length - 1 - index;
                                return (
                                    <div 
                                        key={actualIndex} 
                                        className={`matches-analysis-item ${isHighlighted ? 'highlighted' : ''} ${actualIndex === matchesAnalysisData.length - 1 ? 'latest' : ''} digit-${digit}`}
                                    >
                                        {digit}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'flipa-switcher' && (
                <>
                    {/* Strategy Switcher Header */}
                    <div className='strategy-header'>
                        <span className='header-icon'>🔄</span>
                        <span className='header-text'>Strategy Switcher | Market Flipa</span>
                        <span className='header-icon'>🔄</span>
                    </div>

                    {/* Trade Type Buttons */}
                    <div className='trade-type-row'>
                        <button 
                            className={`type-btn even ${activeStrategies.some(s => s.type === 'Even') ? 'active' : ''}`}
                            onClick={() => {
                                const strategyIndex = activeStrategies.findIndex(s => s.type === 'Even');
                                if (strategyIndex === -1 && activeStrategies.length < 2) {
                                    setActiveStrategies([...activeStrategies, { 
                                        id: activeStrategies.length + 1, 
                                        type: 'Even' as StrategyType, 
                                        stake: 100, 
                                        prediction: 0 
                                    }]);
                                }
                            }}
                        >
                            ✦ Even
                        </button>
                        <button 
                            className={`type-btn odd ${activeStrategies.some(s => s.type === 'Odd') ? 'active' : ''}`}
                            onClick={() => {
                                const strategyIndex = activeStrategies.findIndex(s => s.type === 'Odd');
                                if (strategyIndex === -1 && activeStrategies.length < 2) {
                                    setActiveStrategies([...activeStrategies, { 
                                        id: activeStrategies.length + 1, 
                                        type: 'Odd' as StrategyType, 
                                        stake: 100, 
                                        prediction: 1 
                                    }]);
                                }
                            }}
                        >
                            ✦ Odd
                        </button>
                        <button 
                            className={`type-btn matches ${activeStrategies.some(s => s.type === 'Matches') ? 'active' : ''}`}
                            onClick={() => {
                                const strategyIndex = activeStrategies.findIndex(s => s.type === 'Matches');
                                if (strategyIndex === -1 && activeStrategies.length < 2) {
                                    setActiveStrategies([...activeStrategies, { 
                                        id: activeStrategies.length + 1, 
                                        type: 'Matches' as StrategyType, 
                                        stake: 100, 
                                        prediction: 5 
                                    }]);
                                }
                            }}
                        >
                            ✦ Matches
                        </button>
                        <button 
                            className={`type-btn differs ${activeStrategies.some(s => s.type === 'Differs') ? 'active' : ''}`}
                            onClick={() => {
                                const strategyIndex = activeStrategies.findIndex(s => s.type === 'Differs');
                                if (strategyIndex === -1 && activeStrategies.length < 2) {
                                    setActiveStrategies([...activeStrategies, { 
                                        id: activeStrategies.length + 1, 
                                        type: 'Differs' as StrategyType, 
                                        stake: 100, 
                                        prediction: 5 
                                    }]);
                                }
                            }}
                        >
                            ✦ Differs
                        </button>
                        <button 
                            className={`type-btn over ${activeStrategies.some(s => s.type === 'Over') ? 'active' : ''}`}
                            onClick={() => {
                                const strategyIndex = activeStrategies.findIndex(s => s.type === 'Over');
                                if (strategyIndex === -1 && activeStrategies.length < 2) {
                                    setActiveStrategies([...activeStrategies, { 
                                        id: activeStrategies.length + 1, 
                                        type: 'Over', 
                                        stake: 100, 
                                        prediction: 2 
                                    }]);
                                }
                            }}
                        >
                            ✦ Over
                        </button>
                        <button 
                            className={`type-btn under ${activeStrategies.some(s => s.type === 'Under') ? 'active' : ''}`}
                            onClick={() => {
                                const strategyIndex = activeStrategies.findIndex(s => s.type === 'Under');
                                if (strategyIndex === -1 && activeStrategies.length < 2) {
                                    setActiveStrategies([...activeStrategies, { 
                                        id: activeStrategies.length + 1, 
                                        type: 'Under', 
                                        stake: 100, 
                                        prediction: 7 
                                    }]);
                                }
                            }}
                        >
                            ✦ Under
                        </button>
                        <button 
                            className={`type-btn rise ${activeStrategies.some(s => s.type === 'Rise') ? 'active' : ''}`}
                            onClick={() => {
                                const strategyIndex = activeStrategies.findIndex(s => s.type === 'Rise');
                                if (strategyIndex === -1 && activeStrategies.length < 2) {
                                    setActiveStrategies([...activeStrategies, { 
                                        id: activeStrategies.length + 1, 
                                        type: 'Rise' as StrategyType, 
                                        stake: 100, 
                                        prediction: 0 
                                    }]);
                                }
                            }}
                        >
                            ✦ Rise
                        </button>
                        <button 
                            className={`type-btn fall ${activeStrategies.some(s => s.type === 'Fall') ? 'active' : ''}`}
                            onClick={() => {
                                const strategyIndex = activeStrategies.findIndex(s => s.type === 'Fall');
                                if (strategyIndex === -1 && activeStrategies.length < 2) {
                                    setActiveStrategies([...activeStrategies, { 
                                        id: activeStrategies.length + 1, 
                                        type: 'Fall' as StrategyType, 
                                        stake: 100, 
                                        prediction: 0 
                                    }]);
                                }
                            }}
                        >
                            ✦ Fall
                        </button>
                    </div>

                    {/* Active Strategies */}
                    <div className='active-strategies-box'>
                        <div className='strategies-header'>
                            Active strategies (switch-on-loss : 1 loss)
                            {activeStrategies.length > 0 && (
                                <button 
                                    className='clear-strategies-btn'
                                    onClick={() => setActiveStrategies([])}
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                        <div className='strategies-list'>
                            {activeStrategies.length === 0 ? (
                                <div className='no-strategies'>
                                    Click trade type buttons above to add strategies (max 2)
                                </div>
                            ) : (
                                activeStrategies.map((strategy, index) => (
                                    <div key={strategy.id} className='strategy-item'>
                                        <span className='strategy-label'>
                                            #{strategy.id} — {strategy.type}
                                        </span>
                                        <div className='strategy-controls'>
                                            <span className='control-label'>Stake</span>
                                            <input 
                                                type='number' 
                                                className='control-input' 
                                                value={strategy.stake}
                                                onChange={(e) => {
                                                    const newStrategies = [...activeStrategies];
                                                    newStrategies[index].stake = parseFloat(e.target.value) || 0;
                                                    setActiveStrategies(newStrategies);
                                                }}
                                                min='0.35'
                                                step='0.01'
                                            />
                                            <span className='control-label'>Pred</span>
                                            <input 
                                                type='number' 
                                                className='control-input small' 
                                                value={strategy.prediction}
                                                onChange={(e) => {
                                                    const newStrategies = [...activeStrategies];
                                                    newStrategies[index].prediction = parseInt(e.target.value) || 0;
                                                    setActiveStrategies(newStrategies);
                                                }}
                                                min='0'
                                                max='9'
                                            />
                                            <button 
                                                className='remove-strategy-btn'
                                                onClick={() => {
                                                    setActiveStrategies(activeStrategies.filter((_, i) => i !== index));
                                                }}
                                                title='Remove strategy'
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main Configuration Panel */}
                    <div className='config-panel'>
                <div className='config-row'>
                    <div className='config-group'>
                        <label className='config-label'>Market</label>
                        <select 
                            className='config-input market-select'
                            value={market}
                            onChange={(e) => setMarket(e.target.value)}
                            disabled={isRunning}
                        >
                            <option value='1HZ10V'>Vol 10 (1s)</option>
                            <option value='1HZ25V'>Vol 25 (1s)</option>
                            <option value='1HZ50V'>Vol 50 (1s)</option>
                            <option value='1HZ75V'>Vol 75 (1s)</option>
                            <option value='1HZ100V'>Vol 100 (1s)</option>
                        </select>
                    </div>

                    <div className='config-group'>
                        <label className='config-label'>Default Stake</label>
                        <input 
                            type='number'
                            className='config-input'
                            value={defaultStake}
                            onChange={(e) => setDefaultStake(parseFloat(e.target.value))}
                            disabled={isRunning}
                        />
                    </div>

                    <div className='config-group'>
                        <label className='config-label'>Martingale ×</label>
                        <input 
                            type='number'
                            className='config-input'
                            value={martingale}
                            onChange={(e) => setMartingale(parseFloat(e.target.value))}
                            disabled={isRunning}
                        />
                    </div>
                </div>

                <div className='config-row'>
                    <div className='config-group'>
                        <label className='config-label'>Ticks</label>
                        <input 
                            type='number'
                            className='config-input'
                            value={ticks}
                            onChange={(e) => setTicks(parseInt(e.target.value))}
                            disabled={isRunning}
                        />
                    </div>

                    <div className='config-group'>
                        <label className='config-label'>Default Digit</label>
                        <input 
                            type='number'
                            className='config-input'
                            value={defaultDigit}
                            onChange={(e) => setDefaultDigit(parseInt(e.target.value))}
                            disabled={isRunning}
                        />
                    </div>

                    <div className='config-group toggle-group'>
                        <button 
                            className={`toggle-btn ${switchMarket ? 'active-green' : ''}`}
                            onClick={() => setSwitchMarket(!switchMarket)}
                            disabled={isRunning}
                            title='Enable market switching between Even, Odd, Differs, Over, Under, Rise, Fall on loss'
                        >
                            Switch Market: {switchMarket ? 'ON' : 'OFF'}
                        </button>
                        <button 
                            className={`toggle-btn ${switchOnLoss ? 'active-green' : ''}`}
                            onClick={() => setSwitchOnLoss(!switchOnLoss)}
                            disabled={isRunning}
                            title='Enable switching strategy on loss'
                        >
                            Switch on Loss: {switchOnLoss ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>

                <div className='config-row'>
                    <div className='config-group'>
                        <label className='config-label'>Losses to switch</label>
                        <input 
                            type='number'
                            className='config-input'
                            value={lossesToSwitch}
                            onChange={(e) => setLossesToSwitch(parseInt(e.target.value))}
                            disabled={isRunning}
                        />
                    </div>

                    <div className='config-group toggle-group'>
                        <button 
                            className={`toggle-btn ${turboOff ? 'active' : ''}`}
                            onClick={() => setTurboOff(!turboOff)}
                            disabled={isRunning}
                        >
                            Turbo: OFF
                        </button>
                    </div>

                    <div className='config-group'>
                        <label className='config-label'>Rounds</label>
                        <input 
                            type='number'
                            className='config-input'
                            value={rounds}
                            onChange={(e) => setRounds(parseInt(e.target.value))}
                            disabled={isRunning}
                        />
                    </div>

                    <div className='config-group'>
                        <label className='config-label'>Take Profit ($)</label>
                        <input 
                            type='number'
                            className='config-input'
                            value={takeProfit}
                            onChange={(e) => setTakeProfit(parseFloat(e.target.value))}
                            disabled={isRunning}
                        />
                    </div>
                </div>

                <div className='config-row'>
                    <div className='config-group'>
                        <label className='config-label'>Stop Loss ($)</label>
                        <input 
                            type='number'
                            className='config-input'
                            value={stopLoss}
                            onChange={(e) => setStopLoss(parseFloat(e.target.value))}
                            disabled={isRunning}
                        />
                    </div>

                    <div className='config-group toggle-group'>
                        <button 
                            className={`toggle-btn ${delayOff ? 'active' : ''}`}
                            onClick={() => setDelayOff(!delayOff)}
                            disabled={isRunning}
                        >
                            Delay: OFF
                        </button>
                    </div>

                    <div className='config-group run-group'>
                        <button 
                            className={`run-btn ${isRunning ? 'running' : ''}`}
                            onClick={handleRun}
                        >
                            {isRunning ? '■ Stop' : '▶ Run'}
                        </button>
                        {isRunning && <span className='status-indicator'>OFF</span>}
                    </div>
                </div>

                {/* Positions Table */}
                <div className='positions-table'>
                    <div className='table-header'>
                        <span>Type/Market</span>
                        <span>Entry/Exit spot</span>
                        <span>Buy price & P/L</span>
                    </div>
                    <div className='table-body'>
                        <div className='no-positions-text'>No positions</div>
                    </div>
                </div>

                {/* Reset Button */}
                <div className='reset-row'>
                    <button className='reset-btn' onClick={handleReset}>
                        Reset
                    </button>
                </div>
            </div>

            {/* History Section */}
            <div className='history-section'>
                <div className='history-header'>
                    <span>History cleared</span>
                </div>
                <div className='history-info'>
                    <span>⚠️ Irregular call</span>
                    <span>Vol Switch off</span>
                    <span>Mode: Switch on loss</span>
                    <span>Switch after: 1 loss</span>
                    <span>Default Digit: 6</span>
                    <span>Session P/L: +1.12</span>
                    <span>Min buy gate: 500ms</span>
                    <span>TP: 10.00</span>
                    <span>SL:</span>
                </div>
            </div>

                    {/* Statistics Footer */}
                    <div className='stats-footer'>
                        <div className='stat-item'>
                            <span className='stat-label'>TOTAL P/L</span>
                            <span className='stat-value profit'>+$0.00 USD</span>
                        </div>
                        <div className='stat-item'>
                            <span className='stat-label'>NO. OF RUNS</span>
                            <span className='stat-value'>{botStats.totalTrades}</span>
                        </div>
                        <div className='stat-item'>
                            <span className='stat-label'>WON</span>
                            <span className='stat-value'>{botStats.wins}</span>
                        </div>
                        <div className='stat-item'>
                            <span className='stat-label'>LOST</span>
                            <span className='stat-value'>{botStats.losses}</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TradingHub;
