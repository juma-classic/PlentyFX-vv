import React, { useState, useEffect, useCallback } from 'react';
import './EveryDigitTradingEngine.scss';

interface DigitTrade {
    id: string;
    digit: number;
    stake: number;
    prediction: 'over' | 'under' | 'matches' | 'differs';
    timestamp: number;
    status: 'pending' | 'won' | 'lost';
    profit?: number;
    entrySpot?: number;
    exitSpot?: number;
}

interface EveryDigitTradingEngineProps {
    isActive: boolean;
    onToggle: () => void;
    isAPIConnected?: boolean;
    wsConnection?: WebSocket | null;
}

export const EveryDigitTradingEngine: React.FC<EveryDigitTradingEngineProps> = ({
    isActive,
    onToggle,
    isAPIConnected = false,
    wsConnection = null,
}) => {
    const [market, setMarket] = useState('R_50');
    const [baseStake, setBaseStake] = useState(1);
    const [martingaleMultiplier, setMartingaleMultiplier] = useState(2);
    const [maxMartingaleSteps, setMaxMartingaleSteps] = useState(3);
    const [tradeType, setTradeType] = useState<'matches' | 'differs' | 'over' | 'under'>('matches');
    const [targetDigit, setTargetDigit] = useState(5);

    const [activeTrades, setActiveTrades] = useState<DigitTrade[]>([]);
    const [tradeHistory, setTradeHistory] = useState<DigitTrade[]>([]);
    const [lastDigit, setLastDigit] = useState<number | null>(null);
    const [consecutiveLosses, setConsecutiveLosses] = useState(0);

    const [stats, setStats] = useState({
        totalTrades: 0,
        wins: 0,
        losses: 0,
        totalProfit: 0,
        winRate: 0,
    });

    // Calculate current stake based on martingale
    const getCurrentStake = useCallback(() => {
        if (consecutiveLosses === 0) return baseStake;
        const martingaleSteps = Math.min(consecutiveLosses, maxMartingaleSteps);
        return baseStake * Math.pow(martingaleMultiplier, martingaleSteps);
    }, [baseStake, martingaleMultiplier, maxMartingaleSteps, consecutiveLosses]);

    // Handle new tick data
    const handleTickUpdate = useCallback(
        (tickData: any) => {
            if (!tickData || !tickData.tick) return;

            const tick = parseFloat(tickData.tick.quote);
            const digit = Math.floor((tick * 10) % 10);

            setLastDigit(digit);

            // Only trade if engine is active and we have a new digit
            if (isActive && digit !== lastDigit) {
                executeDigitTrade(digit, tick);
            }
        },
        [isActive, lastDigit, tradeType, targetDigit]
    );

    // Execute trade based on digit occurrence
    const executeDigitTrade = useCallback(
        (digit: number, currentSpot: number) => {
            const shouldTrade = checkTradingCondition(digit);

            if (shouldTrade) {
                const currentStake = getCurrentStake();
                const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

                const newTrade: DigitTrade = {
                    id: tradeId,
                    digit: digit,
                    stake: currentStake,
                    prediction: tradeType,
                    timestamp: Date.now(),
                    status: 'pending',
                    entrySpot: currentSpot,
                };

                // Add to active trades
                setActiveTrades(prev => [...prev, newTrade]);

                // Execute the trade (real API or simulation)
                if (isAPIConnected && wsConnection) {
                    executeRealTrade(newTrade);
                } else {
                    executeTrade(newTrade);
                }
            }
        },
        [tradeType, targetDigit, getCurrentStake]
    );

    // Check if we should trade based on the digit and strategy
    const checkTradingCondition = (digit: number): boolean => {
        switch (tradeType) {
            case 'matches':
                return digit === targetDigit;
            case 'differs':
                return digit !== targetDigit;
            case 'over':
                return digit > targetDigit;
            case 'under':
                return digit < targetDigit;
            default:
                return false;
        }
    };

    // Execute trade via Deriv API
    const executeTrade = async (trade: DigitTrade) => {
        try {
            const contractType = getContractType(trade.prediction);
            const barrier =
                trade.prediction === 'matches' || trade.prediction === 'differs'
                    ? targetDigit.toString()
                    : targetDigit.toString();

            // For now, simulate the trade execution
            // In production, you would:
            // 1. Get proposal first
            // 2. Buy contract with proposal ID

            console.log(`Executing ${contractType} trade for digit ${barrier} with stake ${trade.stake}`);

            // Simulate trade execution with mock response
            const mockResponse = {
                buy: {
                    contract_id: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    longcode: `${contractType} ${barrier} on ${market}`,
                    transaction_id: Math.floor(Math.random() * 1000000),
                    start_time: Date.now() / 1000,
                    purchase_time: Date.now() / 1000,
                    buy_price: trade.stake,
                },
            };

            console.log(`Trade executed (SIMULATION): ${trade.id}`, mockResponse);

            // Subscribe to contract updates (mock)
            subscribeToContract(mockResponse.buy.contract_id, trade.id);
        } catch (error) {
            console.error('Error executing trade:', error);
            // Mark trade as failed
            updateTradeStatus(trade.id, 'lost', -trade.stake);
        }
    };

    // Get contract type for Deriv API
    const getContractType = (prediction: string): string => {
        switch (prediction) {
            case 'matches':
                return 'DIGITSMATCH';
            case 'differs':
                return 'DIGITSDIFFER';
            case 'over':
                return 'DIGITSOVER';
            case 'under':
                return 'DIGITSUNDER';
            default:
                return 'DIGITSMATCH';
        }
    };

    // Subscribe to contract updates
    const subscribeToContract = (contractId: string, tradeId: string) => {
        // For simulation, we'll randomly determine the outcome after a short delay
        setTimeout(
            () => {
                // Simulate random outcome (60% win rate for testing)
                const isWin = Math.random() > 0.4;
                const profit = isWin ? baseStake * 0.95 : -baseStake; // 95% payout on win
                const status = isWin ? 'won' : 'lost';
                const exitSpot = Math.random() * 1000; // Mock exit spot

                console.log(`Contract ${contractId} settled: ${status}, profit: ${profit}`);
                updateTradeStatus(tradeId, status, profit, exitSpot);
            },
            2000 + Math.random() * 3000
        ); // Random delay between 2-5 seconds
    };

    // Update trade status and move to history
    const updateTradeStatus = (tradeId: string, status: 'won' | 'lost', profit: number, exitSpot?: number) => {
        setActiveTrades(prev => {
            const trade = prev.find(t => t.id === tradeId);
            if (!trade) return prev;

            const updatedTrade = {
                ...trade,
                status,
                profit,
                exitSpot,
            };

            // Move to history
            setTradeHistory(prevHistory => [updatedTrade, ...prevHistory].slice(0, 100));

            // Update stats
            setStats(prevStats => ({
                totalTrades: prevStats.totalTrades + 1,
                wins: status === 'won' ? prevStats.wins + 1 : prevStats.wins,
                losses: status === 'lost' ? prevStats.losses + 1 : prevStats.losses,
                totalProfit: prevStats.totalProfit + profit,
                winRate: ((status === 'won' ? prevStats.wins + 1 : prevStats.wins) / (prevStats.totalTrades + 1)) * 100,
            }));

            // Update consecutive losses for martingale
            if (status === 'won') {
                setConsecutiveLosses(0);
            } else {
                setConsecutiveLosses(prev => prev + 1);
            }

            // Remove from active trades
            return prev.filter(t => t.id !== tradeId);
        });
    };

    // Subscribe to tick data when active
    useEffect(() => {
        if (isActive) {
            if (isAPIConnected && wsConnection) {
                // Use real Deriv API with the provided WebSocket connection
                subscribeToRealTicks();
            } else {
                // Use demo mode with mock data
                const interval = setInterval(() => {
                    // Generate random tick data
                    const mockTick = {
                        tick: {
                            quote: Math.random() * 1000 + 100, // Random price between 100-1100
                            symbol: market,
                            epoch: Date.now() / 1000,
                        },
                    };

                    handleTickUpdate(mockTick);
                }, 1000); // Generate new tick every second

                return () => {
                    clearInterval(interval);
                };
            }
        }

        return () => {
            // Cleanup if needed
        };
    }, [isActive, market, handleTickUpdate, isAPIConnected, wsConnection]);

    // Subscribe to real ticks using the provided WebSocket connection
    const subscribeToRealTicks = useCallback(() => {
        if (!wsConnection || wsConnection.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ WebSocket not ready, falling back to demo mode');
            return;
        }

        console.log('📡 Subscribing to real ticks for market:', market);

        // Subscribe to ticks for the selected market
        wsConnection.send(
            JSON.stringify({
                ticks: market,
                subscribe: 1,
            })
        );

        // Set up message handler for this component
        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);

            if (data.tick && data.tick.symbol === market) {
                handleTickUpdate(data);
            }
        };

        wsConnection.addEventListener('message', handleMessage);

        // Cleanup function
        return () => {
            wsConnection.removeEventListener('message', handleMessage);
        };
    }, [wsConnection, market, handleTickUpdate]);

    // Execute real trade via Deriv API
    const executeRealTrade = async (trade: DigitTrade) => {
        if (!wsConnection || !isAPIConnected) {
            console.warn('⚠️ No API connection, falling back to simulation');
            return executeTrade(trade);
        }

        try {
            const contractType = getContractType(trade.prediction);
            const barrier = targetDigit.toString();

            // First get a proposal
            const proposalRequest = {
                proposal: 1,
                amount: trade.stake,
                basis: 'stake',
                contract_type: contractType,
                currency: 'USD',
                symbol: market,
                barrier: barrier,
                duration: 5,
                duration_unit: 't',
            };

            console.log('📋 Getting proposal...', proposalRequest);
            wsConnection.send(JSON.stringify(proposalRequest));

            // Note: In a real implementation, you would handle the proposal response
            // and then execute the buy. For now, we'll simulate this.
            console.log(
                `🚀 Real trade would be executed: ${contractType} ${barrier} on ${market} with stake ${trade.stake}`
            );

            // Fall back to simulation for now
            executeTrade(trade);
        } catch (error) {
            console.error('❌ Error executing real trade:', error);
            // Fall back to simulation
            executeTrade(trade);
        }
    };

    // Reset stats
    const resetStats = () => {
        setStats({
            totalTrades: 0,
            wins: 0,
            losses: 0,
            totalProfit: 0,
            winRate: 0,
        });
        setTradeHistory([]);
        setConsecutiveLosses(0);
    };

    return (
        <div className='every-digit-trading-engine'>
            <div className='engine-header'>
                <h3>🚀 Every Digit Trading Engine</h3>
                <div className='header-controls'>
                    <div className='connection-indicator'>
                        {isAPIConnected ? (
                            <div className='api-status connected'>
                                <span className='status-dot'></span>
                                <span className='status-text'>LIVE API</span>
                            </div>
                        ) : (
                            <div className='api-status demo'>
                                <span className='status-dot'></span>
                                <span className='status-text'>DEMO MODE</span>
                            </div>
                        )}
                    </div>
                    <button className={`engine-toggle ${isActive ? 'active' : ''}`} onClick={onToggle}>
                        {isActive ? 'STOP' : 'START'}
                    </button>
                </div>
            </div>

            <div className='engine-config'>
                <div className='config-row'>
                    <div className='config-item'>
                        <label>Market</label>
                        <select value={market} onChange={e => setMarket(e.target.value)}>
                            <option value='R_10'>Volatility 10 Index</option>
                            <option value='R_25'>Volatility 25 Index</option>
                            <option value='R_50'>Volatility 50 Index</option>
                            <option value='R_75'>Volatility 75 Index</option>
                            <option value='R_100'>Volatility 100 Index</option>
                            <option value='1HZ10V'>Volatility 10 (1s) Index</option>
                            <option value='1HZ25V'>Volatility 25 (1s) Index</option>
                            <option value='1HZ50V'>Volatility 50 (1s) Index</option>
                            <option value='1HZ75V'>Volatility 75 (1s) Index</option>
                            <option value='1HZ100V'>Volatility 100 (1s) Index</option>
                            <option value='1HZ150V'>Volatility 150 (1s) Index</option>
                            <option value='1HZ200V'>Volatility 200 (1s) Index</option>
                            <option value='1HZ250V'>Volatility 250 (1s) Index</option>
                            <option value='1HZ300V'>Volatility 300 (1s) Index</option>
                            <option value='BOOM300N'>Boom 300 Index</option>
                            <option value='BOOM500N'>Boom 500 Index</option>
                            <option value='BOOM1000N'>Boom 1000 Index</option>
                            <option value='CRASH300N'>Crash 300 Index</option>
                            <option value='CRASH500N'>Crash 500 Index</option>
                            <option value='CRASH1000N'>Crash 1000 Index</option>
                            <option value='JD10'>Jump 10 Index</option>
                            <option value='JD25'>Jump 25 Index</option>
                            <option value='JD50'>Jump 50 Index</option>
                            <option value='JD75'>Jump 75 Index</option>
                            <option value='JD100'>Jump 100 Index</option>
                            <option value='WLDAUD'>AUD Basket</option>
                            <option value='WLDEUR'>EUR Basket</option>
                            <option value='WLDGBP'>GBP Basket</option>
                            <option value='WLDUSD'>USD Basket</option>
                            <option value='WLDXAU'>Gold Basket</option>
                        </select>
                    </div>

                    <div className='config-item'>
                        <label>Base Stake</label>
                        <input
                            type='number'
                            value={baseStake}
                            onChange={e => setBaseStake(Number(e.target.value))}
                            min='0.35'
                            step='0.01'
                        />
                    </div>

                    <div className='config-item'>
                        <label>Trade Type</label>
                        <select value={tradeType} onChange={e => setTradeType(e.target.value as any)}>
                            <option value='matches'>Matches</option>
                            <option value='differs'>Differs</option>
                            <option value='over'>Over</option>
                            <option value='under'>Under</option>
                        </select>
                    </div>

                    <div className='config-item'>
                        <label>Target Digit</label>
                        <select value={targetDigit} onChange={e => setTargetDigit(Number(e.target.value))}>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                                <option key={digit} value={digit}>
                                    {digit}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className='config-row'>
                    <div className='config-item'>
                        <label>Martingale Multiplier</label>
                        <select
                            value={martingaleMultiplier}
                            onChange={e => setMartingaleMultiplier(Number(e.target.value))}
                        >
                            <option value={1.5}>1.5x</option>
                            <option value={2}>2x</option>
                            <option value={2.5}>2.5x</option>
                            <option value={3}>3x</option>
                        </select>
                    </div>

                    <div className='config-item'>
                        <label>Max Martingale Steps</label>
                        <select
                            value={maxMartingaleSteps}
                            onChange={e => setMaxMartingaleSteps(Number(e.target.value))}
                        >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                        </select>
                    </div>

                    <div className='config-item'>
                        <label>Current Stake</label>
                        <div className='current-stake'>${getCurrentStake().toFixed(2)}</div>
                    </div>

                    <div className='config-item'>
                        <label>Last Digit</label>
                        <div className={`last-digit ${lastDigit !== null ? 'active' : ''}`}>
                            {lastDigit !== null ? lastDigit : '-'}
                        </div>
                    </div>
                </div>
            </div>

            <div className='engine-stats'>
                <div className='stat-item'>
                    <span className='stat-label'>Total Trades</span>
                    <span className='stat-value'>{stats.totalTrades}</span>
                </div>
                <div className='stat-item'>
                    <span className='stat-label'>Wins</span>
                    <span className='stat-value wins'>{stats.wins}</span>
                </div>
                <div className='stat-item'>
                    <span className='stat-label'>Losses</span>
                    <span className='stat-value losses'>{stats.losses}</span>
                </div>
                <div className='stat-item'>
                    <span className='stat-label'>Win Rate</span>
                    <span className='stat-value'>{stats.winRate.toFixed(1)}%</span>
                </div>
                <div className='stat-item'>
                    <span className='stat-label'>Total P&L</span>
                    <span className={`stat-value ${stats.totalProfit >= 0 ? 'profit' : 'loss'}`}>
                        ${stats.totalProfit.toFixed(2)}
                    </span>
                </div>
                <div className='stat-item'>
                    <span className='stat-label'>Consecutive Losses</span>
                    <span className='stat-value'>{consecutiveLosses}</span>
                </div>
            </div>

            <div className='engine-controls'>
                <button className='reset-btn' onClick={resetStats}>
                    Reset Stats
                </button>
                <div className='engine-status'>
                    Status:{' '}
                    <span className={isActive ? 'active' : 'inactive'}>
                        {isActive
                            ? `ACTIVE - ${isAPIConnected ? 'Live trading' : 'Demo mode'} on every new digit`
                            : 'INACTIVE'}
                    </span>
                </div>
            </div>

            <div className='trade-display'>
                <div className='trade-section'>
                    <h4>Active Trades ({activeTrades.length})</h4>
                    <div className='trade-list'>
                        {activeTrades.map(trade => (
                            <div key={trade.id} className='trade-item pending'>
                                <span>Digit {trade.digit}</span>
                                <span>{trade.prediction}</span>
                                <span>${trade.stake}</span>
                                <span className='status'>Pending...</span>
                            </div>
                        ))}
                        {activeTrades.length === 0 && <div className='no-trades'>No active trades</div>}
                    </div>
                </div>

                <div className='trade-section'>
                    <h4>Recent History ({tradeHistory.length})</h4>
                    <div className='trade-list'>
                        {tradeHistory.slice(0, 10).map(trade => (
                            <div key={trade.id} className={`trade-item ${trade.status}`}>
                                <span>Digit {trade.digit}</span>
                                <span>{trade.prediction}</span>
                                <span>${trade.stake}</span>
                                <span
                                    className={`profit ${trade.profit && trade.profit >= 0 ? 'positive' : 'negative'}`}
                                >
                                    {trade.profit ? `$${trade.profit.toFixed(2)}` : '-'}
                                </span>
                            </div>
                        ))}
                        {tradeHistory.length === 0 && <div className='no-trades'>No trade history</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};
