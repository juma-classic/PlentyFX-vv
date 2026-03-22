import React, { useRef, useState } from 'react';
import { derivAPI, TradeConfig, TradeResult } from '../../utils/deriv-trading-api';
import './SpeedTradingEngine.scss';

interface SpeedTradingEngineProps {
    market: string;
    strategy: 'momentum' | 'reversal' | 'scalping' | 'zeus_ai';
    tradeType: 'DIGITEVEN' | 'DIGITODD' | 'DIGITMATCH' | 'DIGITDIFF' | 'DIGITOVER' | 'DIGITUNDER';
    stake: number;
    targetRuns: number;
    duration: number;
    durationType: 't' | 'm';
    stopLoss: number;
    takeProfit: number;
    barrier?: number;
    onStop: () => void;
    onTradeExecuted?: (result: TradeResult) => void;
}

interface TickData {
    epoch: number;
    quote: number;
    lastDigit: number;
}

export const SpeedTradingEngine: React.FC<SpeedTradingEngineProps> = ({
    market,
    tradeType,
    stake,
    targetRuns,
    duration,
    durationType,
    stopLoss,
    takeProfit,
    barrier,
    onStop,
    onTradeExecuted,
}) => {
    const [isRunning, setIsRunning] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isTrading, setIsTrading] = useState(false);
    const [isAutoTrading, setIsAutoTrading] = useState(false);
    const [currentTick, setCurrentTick] = useState<TickData | null>(null);
    const [stats, setStats] = useState({
        runs: 0,
        wins: 0,
        losses: 0,
        profit: 0,
    });
    const [lastTradeResult, setLastTradeResult] = useState<TradeResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const autoTradeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connectWebSocket = () => {
        // Use the same app ID as the trading API
        const appId = derivAPI.getAppId();
        const wsUrl = `wss://ws.binaryws.com/websockets/v3?app_id=${appId}`;
        console.log(`🔌 Connecting tick stream with App ID: ${appId}`);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('✅ Speed Trading WebSocket connected');
            setIsRunning(true);

            // Subscribe to live ticks
            const subscribeMessage = {
                ticks: market,
                subscribe: 1,
            };
            console.log('📡 Subscribing to ticks:', subscribeMessage);
            ws.send(JSON.stringify(subscribeMessage));
        };

        ws.onmessage = event => {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 Received message:', data);

                if (data.error) {
                    console.error('❌ API Error:', data.error);
                    setError(data.error.message);
                    return;
                }

                if (data.tick) {
                    console.log('📊 Tick received:', data.tick.quote, 'Digit:', data.tick.quote.toString().slice(-1));

                    const newTick: TickData = {
                        epoch: data.tick.epoch,
                        quote: data.tick.quote,
                        lastDigit: parseInt(data.tick.quote.toString().slice(-1)),
                    };

                    setCurrentTick(newTick);
                }
            } catch (error) {
                console.error('Error processing tick:', error);
            }
        };

        ws.onerror = error => {
            console.error('❌ WebSocket error:', error);
            setError('WebSocket connection error');
            setIsRunning(false);
        };

        ws.onclose = event => {
            console.log('🔌 WebSocket closed. Code:', event.code, 'Reason:', event.reason || 'No reason provided');
            setIsRunning(false);

            // If closed unexpectedly, show error
            if (event.code !== 1000) {
                setError(`Connection closed unexpectedly (code: ${event.code})`);
            }
        };
    };

    const executeManualTrade = async () => {
        if (!currentTick) {
            setError('No tick data available');
            return;
        }

        if (isTrading) {
            console.log('⚠️ Already processing a trade, please wait...');
            return;
        }

        // Check risk management
        if (stats.profit <= -stopLoss || stats.profit >= takeProfit) {
            setError('Risk management limit reached');
            return;
        }

        console.log('✅ Executing manual trade...');
        setIsTrading(true);
        setError(null);

        try {
            // Build trade config
            const tradeConfig: TradeConfig = {
                market,
                tradeType,
                stake,
                duration,
                durationType,
                prediction: barrier, // Add barrier for Over/Under/Match/Diff
            };

            console.log('🚀 Executing manual trade:', tradeConfig);

            // Clear previous result
            setLastTradeResult(null);

            // Execute real trade via Deriv API
            const result = await derivAPI.executeTrade(tradeConfig);

            console.log('📊 Trade result received:', result);
            setLastTradeResult(result);

            if (result.success) {
                const profit = result.profit || 0;
                const outcome = profit > 0 ? 'win' : 'loss';

                // Calculate new stats
                const newStats = {
                    runs: stats.runs + 1,
                    wins: outcome === 'win' ? stats.wins + 1 : stats.wins,
                    losses: outcome === 'loss' ? stats.losses + 1 : stats.losses,
                    profit: stats.profit + profit,
                };

                // Update stats
                setStats(newStats);

                // Notify parent
                if (onTradeExecuted) {
                    onTradeExecuted(result);
                }

                console.log(`✅ Trade ${outcome}: Profit ${profit.toFixed(2)}`);
                console.log(`📊 Stats: ${newStats.runs}/${targetRuns} runs, Profit: $${newStats.profit.toFixed(2)}`);

                // Check if should continue auto-trading
                if (isAutoTrading) {
                    if (newStats.runs >= targetRuns) {
                        console.log('🎯 Target runs reached, stopping auto-trading');
                        setIsAutoTrading(false);
                    } else if (newStats.profit <= -stopLoss || newStats.profit >= takeProfit) {
                        console.log('🛑 Risk limit reached, stopping auto-trading');
                        setIsAutoTrading(false);
                    } else {
                        console.log(`⏭️ Scheduling next trade... (${newStats.runs}/${targetRuns})`);
                        // Schedule next trade after 2 seconds
                        autoTradeTimeoutRef.current = setTimeout(() => {
                            executeManualTrade();
                        }, 2000);
                    }
                }
            } else {
                console.error('❌ Trade failed:', result.error);
                setError(result.error || 'Trade execution failed');
                setIsAutoTrading(false); // Stop auto-trading on error
            }
        } catch (error) {
            console.error('Error executing trade:', error);
            setError(error instanceof Error ? error.message : 'Unknown error');
            setIsAutoTrading(false); // Stop auto-trading on error
        } finally {
            setIsTrading(false);
        }
    };

    const startAutoTrading = () => {
        if (!currentTick) {
            setError('Waiting for tick data...');
            return;
        }

        console.log('🤖 Starting auto-trading mode');
        setIsAutoTrading(true);
        setError(null);
        executeManualTrade();
    };

    const stopAutoTrading = () => {
        console.log('🛑 Stopping auto-trading');
        setIsAutoTrading(false);
        if (autoTradeTimeoutRef.current) {
            clearTimeout(autoTradeTimeoutRef.current);
            autoTradeTimeoutRef.current = null;
        }
    };

    const stopTrading = () => {
        stopAutoTrading();
        if (wsRef.current) {
            wsRef.current.close();
        }
        setIsRunning(false);
        onStop();
    };

    const startTrading = async () => {
        setIsConnecting(true);
        setError(null);

        try {
            console.log('🚀 Starting Speed Trading...');

            // Check if already connected
            if (!derivAPI.isReady()) {
                console.log('🔌 Connecting to Deriv API...');
                await derivAPI.connect();
                console.log('✅ Connected to Deriv API');

                // Authorize with token
                const accountInfo = await derivAPI.authorize();
                console.log('✅ Authorized:', accountInfo);
            } else {
                console.log('✅ Already connected to Deriv API');
            }

            // Connect to tick stream and start trading
            connectWebSocket();
            setIsConnecting(false);
        } catch (error) {
            console.error('Failed to start trading:', error);
            setError(error instanceof Error ? error.message : 'Failed to connect');
            setIsConnecting(false);
        }
    };

    return (
        <div className='speed-trading-engine'>
            <div className='engine-header'>
                <h3>⚡ Speed Trading Engine</h3>
                <div className='engine-status'>
                    <span
                        className={`status-dot ${isRunning ? 'running' : isConnecting ? 'connecting' : 'stopped'}`}
                    ></span>
                    <span className='status-text'>
                        {isRunning ? 'Running' : isConnecting ? 'Connecting...' : 'Stopped'}
                    </span>
                </div>
            </div>

            {error && (
                <div className='error-banner'>
                    <span className='error-icon'>⚠️</span>
                    <span className='error-text'>{error}</span>
                </div>
            )}

            <div className='engine-stats'>
                <div className='stat-card'>
                    <span className='stat-label'>Runs</span>
                    <span className='stat-value'>{stats.runs}</span>
                </div>
                <div className='stat-card'>
                    <span className='stat-label'>Wins</span>
                    <span className='stat-value wins'>{stats.wins}</span>
                </div>
                <div className='stat-card'>
                    <span className='stat-label'>Losses</span>
                    <span className='stat-value losses'>{stats.losses}</span>
                </div>
                <div className='stat-card'>
                    <span className='stat-label'>Profit</span>
                    <span className={`stat-value ${stats.profit >= 0 ? 'profit' : 'loss'}`}>
                        ${stats.profit.toFixed(2)}
                    </span>
                </div>
            </div>

            {currentTick && (
                <div className='current-tick'>
                    <span className='tick-label'>Current Tick:</span>
                    <span className='tick-value'>{currentTick.quote.toFixed(2)}</span>
                    <span className='tick-digit'>Digit: {currentTick.lastDigit}</span>
                </div>
            )}

            {isTrading && (
                <div className='trade-waiting'>
                    <span className='waiting-icon'>⏳</span>
                    <span className='waiting-text'>Executing trade and waiting for result...</span>
                </div>
            )}

            {lastTradeResult && (
                <div className={`last-trade ${lastTradeResult.success ? 'success' : 'failed'}`}>
                    <div className='trade-header'>
                        <span className='trade-icon'>{lastTradeResult.success ? '✅' : '❌'}</span>
                        <span className='trade-title'>Last Trade</span>
                    </div>
                    {lastTradeResult.success ? (
                        <div className='trade-details'>
                            <div className='trade-detail'>
                                <span>Contract ID:</span>
                                <span>{lastTradeResult.contractId?.slice(0, 12)}...</span>
                            </div>
                            <div className='trade-detail'>
                                <span>Buy Price:</span>
                                <span>${lastTradeResult.buyPrice?.toFixed(2)}</span>
                            </div>
                            <div className='trade-detail'>
                                <span>Payout:</span>
                                <span>${lastTradeResult.payout?.toFixed(2)}</span>
                            </div>
                            <div className='trade-detail profit-detail'>
                                <span>Profit:</span>
                                <span className={lastTradeResult.profit! >= 0 ? 'profit' : 'loss'}>
                                    ${lastTradeResult.profit?.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className='trade-error'>{lastTradeResult.error}</div>
                    )}
                </div>
            )}

            <div className='engine-controls'>
                {!isRunning ? (
                    <button className='btn-start' onClick={startTrading} disabled={isConnecting}>
                        {isConnecting ? '⏳ Connecting...' : '🚀 Start Tick Stream'}
                    </button>
                ) : (
                    <>
                        {!isAutoTrading ? (
                            <>
                                <button
                                    className='btn-trade'
                                    onClick={executeManualTrade}
                                    disabled={isTrading || !currentTick}
                                >
                                    {isTrading ? '⏳ Trading...' : '💰 Trade Now'}
                                </button>
                                <button
                                    className='btn-auto'
                                    onClick={startAutoTrading}
                                    disabled={isTrading || !currentTick}
                                >
                                    🤖 Auto Trade
                                </button>
                            </>
                        ) : (
                            <button className='btn-stop-auto' onClick={stopAutoTrading}>
                                ⏸️ Stop Auto Trading
                            </button>
                        )}
                        <button className='btn-stop' onClick={stopTrading}>
                            🛑 Stop All
                        </button>
                    </>
                )}
            </div>

            {isAutoTrading && (
                <div className='auto-trading-status'>
                    <span className='status-icon'>🤖</span>
                    <span className='status-text'>
                        Auto-trading: {stats.runs} / {targetRuns} runs
                    </span>
                </div>
            )}
        </div>
    );
};
