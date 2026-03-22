import React, { useEffect, useState } from 'react';
import './speed-bot.scss';

interface SpeedBotProps {
    onExecute?: (params: any) => void;
}

interface TradePosition {
    id: number;
    symbol: string;
    type: string;
    entrySpot: number;
    exitSpot?: number;
    buyPrice: number;
    profit?: number;
    isCompleted: boolean;
    timestamp: number;
}

// Map market names to symbols
const marketSymbolMap: Record<string, string> = {
    R10: 'R_10',
    R25: 'R_25',
    R50: 'R_50',
    R75: 'R_75',
    R100: 'R_100',
};

declare global {
    interface Window {
        startSpeedBotTrading: (params: any) => void;
        stopSpeedBotTrading: () => void;
    }
}

export const SpeedBot: React.FC<SpeedBotProps> = ({ onExecute }) => {
    const [market, setMarket] = useState<string>('R50');
    const [stake, setStake] = useState<number>(10);
    const [martingale, setMartingale] = useState<string>('1.25');
    const [strategy, setStrategy] = useState<string>('Over');
    const [prediction, setPrediction] = useState<string>('2');
    const [ticks, setTicks] = useState<string>('1');
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [totalPL, setTotalPL] = useState<number>(0);
    const [runs, setRuns] = useState<number>(0);
    const [wins, setWins] = useState<number>(0);
    const [losses, setLosses] = useState<number>(0);
    const [positions, setPositions] = useState<TradePosition[]>([]);
    const [currentStake, setCurrentStake] = useState<number>(10);

    // Listen for trade updates from the SpeedBot API
    useEffect(() => {
        const handleTradeUpdate = (event: MessageEvent) => {
            try {
                if (typeof event.data === 'string') {
                    const data = JSON.parse(event.data);

                    if (data.trade_update) {
                        const update = data.trade_update;

                        // Create a new position
                        const newPosition: TradePosition = {
                            id: Date.now(),
                            symbol: update.symbol,
                            type: update.result === 'win' ? 'CALL' : 'PUT',
                            entrySpot: update.entry_spot,
                            exitSpot: update.exit_spot,
                            buyPrice: update.stake,
                            profit: update.result === 'win' ? update.profit : -update.stake,
                            isCompleted: true,
                            timestamp: Date.now(),
                        };

                        // Update positions
                        setPositions(prev => [newPosition, ...prev].slice(0, 50));

                        // Update stats
                        if (update.result === 'win') {
                            setWins(prev => prev + 1);
                            setTotalPL(prev => prev + update.profit);
                            setCurrentStake(stake); // Reset stake on win
                        } else {
                            setLosses(prev => prev + 1);
                            setTotalPL(prev => prev - update.stake);
                            setCurrentStake(prev => prev * parseFloat(martingale)); // Apply martingale
                        }

                        setRuns(prev => prev + 1);
                    }
                }
            } catch (error) {
                console.error('Error processing trade update:', error);
            }
        };

        window.addEventListener('message', handleTradeUpdate);

        return () => {
            window.removeEventListener('message', handleTradeUpdate);
        };
    }, [stake, martingale]);

    const handleMarketChange = (value: string) => {
        setMarket(value);
    };

    const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStake = Number(e.target.value);
        setStake(newStake);
        setCurrentStake(newStake);
    };

    const handleMartingaleChange = (value: string) => {
        setMartingale(value);
    };

    const handleStrategyChange = (value: string) => {
        setStrategy(value);
    };

    const handlePredictionChange = (value: string) => {
        setPrediction(value);
    };

    const handleTicksChange = (value: string) => {
        setTicks(value);
    };

    const toggleRun = () => {
        const newRunningState = !isRunning;
        setIsRunning(newRunningState);

        const symbol = marketSymbolMap[market] || 'R_50';
        const martingaleFactor = parseFloat(martingale);
        const tradeParams = {
            market: symbol,
            stake,
            martingale: martingaleFactor,
            strategy,
            prediction,
            ticks,
        };

        if (newRunningState) {
            // Initialize with current stake
            setCurrentStake(stake);

            // Start trading using SpeedBot API
            if (window.startSpeedBotTrading) {
                window.startSpeedBotTrading(tradeParams);
                console.log(`Started SpeedBot trading with params:`, tradeParams);
            } else {
                console.error('SpeedBot API not loaded');
            }
        } else {
            // Stop trading
            if (window.stopSpeedBotTrading) {
                window.stopSpeedBotTrading();
                console.log('Stopped SpeedBot trading');
            } else {
                console.error('SpeedBot API not loaded');
            }
        }

        if (onExecute) {
            onExecute({
                ...tradeParams,
                isRunning: newRunningState,
            });
        }
    };

    const handleReset = () => {
        if (isRunning) {
            toggleRun(); // Stop trading first
        }

        // Reset all stats
        setTotalPL(0);
        setRuns(0);
        setWins(0);
        setLosses(0);
        setPositions([]);
        setCurrentStake(stake);
    };

    return (
        <div className='speed-bot-container'>
            {/* Top Control Bar */}
            <div className='speed-bot-header'>
                <div className='control-bar'>
                    <button className='btn-primary'>Stake Now</button>
                    <button className='btn-success'>Multiple Stake</button>
                    <button className='btn-secondary'>Max Stake(s)</button>
                    <button className='btn-secondary'>Repeat Martingle</button>
                </div>
            </div>

            <div className='speed-bot-main'>
                {/* Market Selection */}
                <div className='market-selection'>
                    <select
                        className='market-dropdown'
                        value={market}
                        onChange={e => handleMarketChange(e.target.value)}
                    >
                        <option value='R10'>Volatility 10(1s) Index</option>
                        <option value='R25'>Volatility 25(1s) Index</option>
                        <option value='R50'>Volatility 50(1s) Index</option>
                        <option value='R75'>Volatility 75(1s) Index</option>
                        <option value='R100'>Volatility 100(1s) Index</option>
                    </select>
                    <select className='strategies-dropdown'>
                        <option>Strategies</option>
                    </select>
                </div>

                {/* Martingale Indicators */}
                <div className='martingale-section'>
                    <span className='martingale-label'>Martingale:</span>
                    <div className='martingale-indicators'>
                        <span className='indicator yellow'>1</span>
                        <span className='indicator purple'>2</span>
                        <span className='indicator green'>3</span>
                        <span className='indicator'>4</span>
                        <span className='indicator'>5</span>
                        <span className='indicator'>6</span>
                    </div>
                </div>

                {/* Digit Stake Buttons */}
                <div className='digit-stakes'>
                    <button className='digit-stake-btn'>Digit Stake</button>
                    <button className='digit-stake-btn'>Digit Stake</button>
                    <button className='digit-stake-btn'>Digit Stake</button>
                </div>

                {/* Digit Selector */}
                <div className='digit-selector'>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                        <div
                            key={digit}
                            className={`digit-circle ${prediction === digit.toString() ? 'active' : ''}`}
                            onClick={() => handlePredictionChange(digit.toString())}
                        >
                            {digit}
                        </div>
                    ))}
                </div>

                {/* Main Panel */}
                <div className='main-panel'>
                    <div className='panel-header'>
                        <h3>Panel</h3>
                    </div>

                    <div className='panel-controls'>
                        <button className={`start-stop-btn ${isRunning ? 'running' : ''}`} onClick={toggleRun}>
                            {isRunning ? 'STOP' : 'START'}
                        </button>
                        <p className='stake-info'>Stake amount from three stake</p>
                    </div>

                    <div className='control-buttons'>
                        <button className='btn-teal'>Set Wt Tgt</button>
                        <button className='btn-teal'>Strategy</button>
                        <button className='btn-blue'>Take Profit ({stake})</button>
                        <button className='btn-blue'>Duration (ticks)</button>
                    </div>

                    {/* Trade History */}
                    <div className='trade-history'>
                        <div className='history-header'>
                            <span>Time</span>
                            <span>Deriv/Bot app</span>
                            <span>Requirements</span>
                        </div>
                        <div className='history-list'>{/* History content would go here */}</div>
                    </div>
                </div>

                {/* Control Panel */}
                <div className='control-panel'>
                    <div className='control-section'>
                        <label>Market</label>
                        <div className='control-button-container'>
                            <select value={market} onChange={e => handleMarketChange(e.target.value)}>
                                <option value='R10'>R10</option>
                                <option value='R25'>R25</option>
                                <option value='R50'>R50</option>
                                <option value='R75'>R75</option>
                                <option value='R100'>R100</option>
                            </select>
                        </div>
                    </div>

                    <div className='control-section'>
                        <label>Stake</label>
                        <div className='control-input-container'>
                            <input type='number' value={stake} onChange={handleStakeChange} className='control-input' />
                        </div>
                    </div>

                    <div className='control-section'>
                        <label>Martingale</label>
                        <div className='control-button-container'>
                            <select value={martingale} onChange={e => handleMartingaleChange(e.target.value)}>
                                <option value='1.0'>1.0</option>
                                <option value='1.25'>1.25</option>
                                <option value='1.5'>1.5</option>
                                <option value='2.0'>2.0</option>
                                <option value='3.0'>3.0</option>
                            </select>
                        </div>
                    </div>

                    <div className='control-section'>
                        <label>Strategy</label>
                        <div className='control-button-container'>
                            <select value={strategy} onChange={e => handleStrategyChange(e.target.value)}>
                                <option value='Over'>Over</option>
                                <option value='Under'>Under</option>
                                <option value='Even'>Even</option>
                                <option value='Odd'>Odd</option>
                            </select>
                        </div>
                    </div>

                    <div className='control-section'>
                        <label>Prediction</label>
                        <div className='control-button-container'>
                            <select value={prediction} onChange={e => handlePredictionChange(e.target.value)}>
                                <option value='1'>1</option>
                                <option value='2'>2</option>
                                <option value='3'>3</option>
                                <option value='4'>4</option>
                                <option value='5'>5</option>
                            </select>
                        </div>
                    </div>

                    <div className='control-section'>
                        <label>Ticks</label>
                        <div className='control-button-container'>
                            <select value={ticks} onChange={e => handleTicksChange(e.target.value)}>
                                <option value='1'>1</option>
                                <option value='2'>2</option>
                                <option value='3'>3</option>
                                <option value='5'>5</option>
                                <option value='10'>10</option>
                            </select>
                        </div>
                    </div>

                    <div className='control-section'>
                        <label>Run</label>
                        <div className='control-button-container'>
                            <button className={`run-button ${isRunning ? 'running' : ''}`} onClick={toggleRun}>
                                {isRunning ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className='trade-info'>
                    <div className='trade-info-left'>
                        <span>Type/Market</span>
                        {positions.length === 0 && <span className='no-positions'>No positions</span>}
                    </div>
                    <div className='trade-info-right'>
                        <span>Entry/Exit spot</span>
                        <span>Buy price & P/L</span>
                    </div>
                </div>

                <div className='trade-display-area'>
                    {positions.map(position => (
                        <div key={position.id} className='position-item'>
                            <div className='position-left'>
                                <div className='position-type'>{position.type}</div>
                                <div className='position-market'>{position.symbol}</div>
                            </div>
                            <div className='position-middle'>
                                <div className='position-entry'>{position.entrySpot.toFixed(4)}</div>
                                <div className='position-exit'>
                                    {position.exitSpot ? position.exitSpot.toFixed(4) : '-'}
                                </div>
                            </div>
                            <div className='position-right'>
                                <div className='position-buy'>${position.buyPrice.toFixed(2)}</div>
                                <div
                                    className={`position-pl ${position.profit && position.profit >= 0 ? 'positive' : 'negative'}`}
                                >
                                    {position.profit
                                        ? (position.profit >= 0 ? '+' : '') + position.profit.toFixed(2)
                                        : '-'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className='reset-container'>
                    <button className='reset-button' onClick={handleReset}>
                        Reset
                    </button>
                </div>
            </div>

            <div className='speed-bot-footer'>
                <div className='stats-info'>
                    <span>
                        Losses: {losses} Next stake: ${currentStake.toFixed(2)} Session P/L: {totalPL >= 0 ? '+' : ''}
                        {totalPL.toFixed(2)}
                    </span>
                </div>
                <div className='stats-container'>
                    <div className='stat-item'>
                        <span>TOTAL P/L</span>
                        <span className={`stat-value ${totalPL >= 0 ? 'positive' : 'negative'}`}>
                            {totalPL >= 0 ? '+' : ''}
                            {totalPL.toFixed(2)} USD
                        </span>
                    </div>
                    <div className='stat-item'>
                        <span>NO. OF RUNS</span>
                        <span className='stat-value'>{runs}</span>
                    </div>
                    <div className='stat-item'>
                        <span>WON</span>
                        <span className='stat-value'>{wins}</span>
                    </div>
                    <div className='stat-item'>
                        <span>LOST</span>
                        <span className='stat-value'>{losses}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpeedBot;
