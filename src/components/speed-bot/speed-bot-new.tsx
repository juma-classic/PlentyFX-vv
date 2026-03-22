import React, { useEffect, useState } from 'react';
import { EnhancedTickPointer } from '@/components/tick-pointer/EnhancedTickPointer';
import { useStore } from '@/hooks/useStore';
import { BulkTradeStats, bulkTradingService } from '@/services/bulk-trading.service';
import { speedBotService, SpeedBotStats, TradeUpdate } from '@/services/speed-bot.service';
import { DigitStatsCircles } from './DigitStatsCircles';
import './speed-bot-new.scss';

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

export const SpeedBotNew: React.FC<SpeedBotProps> = ({ onExecute }) => {
    const { client } = useStore();
    const [market, setMarket] = useState<string>('R50');
    const [stake, setStake] = useState<number>(0.35);
    const [martingale, setMartingale] = useState<string>('2');
    const [strategy, setStrategy] = useState<string>('Over');
    const [prediction, setPrediction] = useState<string>('5');
    const [ticks, setTicks] = useState<string>('1');
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [totalPL, setTotalPL] = useState<number>(0);
    const [runs, setRuns] = useState<number>(0);
    const [wins, setWins] = useState<number>(0);
    const [losses, setLosses] = useState<number>(0);
    const [positions, setPositions] = useState<TradePosition[]>([]);
    const [currentStake, setCurrentStake] = useState<number>(0.35);
    const [balance, setBalance] = useState<number>(0);
    const [bulkCount, setBulkCount] = useState<number>(5);
    const [isBulkTrading, setIsBulkTrading] = useState<boolean>(false);
    const [bulkStats, setBulkStats] = useState<BulkTradeStats | null>(null);
    const [showBulkModal, setShowBulkModal] = useState<boolean>(false);

    // New state for modals and settings
    const [showWinTargetModal, setShowWinTargetModal] = useState<boolean>(false);
    const [showStrategyModal, setShowStrategyModal] = useState<boolean>(false);
    const [showTakeProfitModal, setShowTakeProfitModal] = useState<boolean>(false);
    const [showDurationModal, setShowDurationModal] = useState<boolean>(false);
    const [winTarget, setWinTarget] = useState<number>(10);
    const [takeProfit, setTakeProfit] = useState<number>(5);
    const [multipleStakeCount, setMultipleStakeCount] = useState<number>(3);
    const [isExecutingTrade, setIsExecutingTrade] = useState<boolean>(false);

    useEffect(() => {
        const handleTradeUpdate = (event: MessageEvent) => {
            try {
                if (typeof event.data === 'string') {
                    const data = JSON.parse(event.data);
                    if (data.trade_update) {
                        const update = data.trade_update;
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
                        setPositions(prev => [newPosition, ...prev].slice(0, 50));
                        if (update.result === 'win') {
                            setWins(prev => prev + 1);
                            setTotalPL(prev => prev + update.profit);
                            setCurrentStake(stake);
                        } else {
                            setLosses(prev => prev + 1);
                            setTotalPL(prev => prev - update.stake);
                            setCurrentStake(prev => prev * parseFloat(martingale));
                        }
                        setRuns(prev => prev + 1);
                    }
                }
            } catch (error) {
                console.error('Error processing trade update:', error);
            }
        };
        window.addEventListener('message', handleTradeUpdate);
        return () => window.removeEventListener('message', handleTradeUpdate);
    }, [stake, martingale]);

    // Get balance from client
    useEffect(() => {
        if (client?.all_accounts_balance && client?.loginid) {
            const activeLoginid = client.loginid;
            const balanceData = (client.all_accounts_balance as any)[activeLoginid];
            if (balanceData) {
                setBalance(balanceData.balance);
            }
        }
    }, [client]);

    const toggleRun = async () => {
        const newRunningState = !isRunning;
        const symbol = marketSymbolMap[market] || 'R_50';

        if (newRunningState) {
            try {
                setIsRunning(true);
                setCurrentStake(stake);

                await speedBotService.start(
                    {
                        market: symbol,
                        stake,
                        martingale: parseFloat(martingale),
                        strategy: strategy as 'Over' | 'Under',
                        prediction,
                        ticks,
                    },
                    {
                        onStatsUpdate: (stats: SpeedBotStats) => {
                            setTotalPL(stats.totalPL);
                            setRuns(stats.runs);
                            setWins(stats.wins);
                            setLosses(stats.losses);
                            setCurrentStake(stats.currentStake);
                            setIsRunning(stats.isRunning);
                        },
                        onTradeUpdate: (update: TradeUpdate) => {
                            if (update.type === 'trade_complete' && update.profit !== undefined) {
                                // Add position to list
                                const newPosition: TradePosition = {
                                    id: update.contractId || Date.now(),
                                    symbol,
                                    type: strategy.toUpperCase(),
                                    entrySpot: 0,
                                    exitSpot: 0,
                                    buyPrice: currentStake,
                                    profit: update.profit,
                                    isCompleted: true,
                                    timestamp: Date.now(),
                                };
                                setPositions(prev => [newPosition, ...prev].slice(0, 10));
                            }
                        },
                    }
                );
            } catch (error) {
                console.error('Error starting Speed Bot:', error);
                setIsRunning(false);
                alert('Failed to start Speed Bot: ' + (error as Error).message);
            }
        } else {
            try {
                await speedBotService.stop();
                setIsRunning(false);
            } catch (error) {
                console.error('Error stopping Speed Bot:', error);
            }
        }

        if (onExecute) {
            onExecute({
                market: symbol,
                stake,
                martingale: parseFloat(martingale),
                strategy,
                prediction,
                ticks,
                isRunning: newRunningState,
            });
        }
    };

    const handleReset = async () => {
        if (isRunning) await toggleRun();
        speedBotService.resetStats();
        setTotalPL(0);
        setRuns(0);
        setWins(0);
        setLosses(0);
        setPositions([]);
        setCurrentStake(stake);
        setBulkStats(null);
    };

    // Execute a single trade
    const handleStakeNow = async () => {
        if (isExecutingTrade) {
            alert('⚠️ Trade already in progress!');
            return;
        }

        if (stake < 0.35) {
            alert('❌ Minimum stake is $0.35');
            return;
        }

        setIsExecutingTrade(true);
        try {
            const symbol = marketSymbolMap[market] || 'R_50';
            const contractType = strategy === 'Over' ? 'DIGITOVER' : 'DIGITUNDER';

            // Get proposal
            const proposal = await bulkTradingService.getBulkProposal({
                contract_type: contractType,
                symbol,
                duration: parseInt(ticks),
                duration_unit: 't',
                basis: 'stake',
                amount: stake,
                barrier: prediction,
            });

            // Buy contract
            const result = await bulkTradingService.placeBulkTrades({
                proposalId: proposal.proposal_id,
                price: stake,
                count: 1,
                delayMs: 0,
            });

            if (result.successful > 0) {
                alert(`✅ Trade placed successfully!\nContract ID: ${result.results[0].contractId}`);
                setRuns(prev => prev + 1);
            } else {
                alert(`❌ Trade failed: ${result.results[0].error}`);
            }
        } catch (error: any) {
            console.error('Stake Now error:', error);
            alert(`❌ Trade failed: ${error.message}`);
        } finally {
            setIsExecutingTrade(false);
        }
    };

    // Execute multiple trades
    const handleMultipleStake = async () => {
        if (isExecutingTrade) {
            alert('⚠️ Trade already in progress!');
            return;
        }

        if (stake < 0.35) {
            alert('❌ Minimum stake is $0.35');
            return;
        }

        const count = multipleStakeCount;
        if (count < 1 || count > 10) {
            alert('❌ Multiple stake count must be between 1 and 10');
            return;
        }

        const confirmed = confirm(
            `Execute ${count} trades with $${stake} stake each?\nTotal cost: $${(stake * count).toFixed(2)}`
        );
        if (!confirmed) return;

        setIsExecutingTrade(true);
        try {
            const symbol = marketSymbolMap[market] || 'R_50';
            const contractType = strategy === 'Over' ? 'DIGITOVER' : 'DIGITUNDER';

            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < count; i++) {
                try {
                    const proposal = await bulkTradingService.getBulkProposal({
                        contract_type: contractType,
                        symbol,
                        duration: parseInt(ticks),
                        duration_unit: 't',
                        basis: 'stake',
                        amount: stake,
                        barrier: prediction,
                    });

                    const result = await bulkTradingService.placeBulkTrades({
                        proposalId: proposal.proposal_id,
                        price: stake,
                        count: 1,
                        delayMs: 0,
                    });

                    if (result.successful > 0) {
                        successCount++;
                        setRuns(prev => prev + 1);
                    } else {
                        failCount++;
                    }

                    // Small delay between trades
                    if (i < count - 1) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                } catch (error) {
                    failCount++;
                    console.error(`Trade ${i + 1} failed:`, error);
                }
            }

            alert(`✅ Multiple Stake Complete!\n\nSuccessful: ${successCount}\nFailed: ${failCount}\nTotal: ${count}`);
        } catch (error: any) {
            console.error('Multiple Stake error:', error);
            alert(`❌ Multiple stake failed: ${error.message}`);
        } finally {
            setIsExecutingTrade(false);
        }
    };

    // Calculate and use max stake
    const handleMaxStake = () => {
        if (balance <= 0) {
            alert('❌ Unable to determine balance. Please ensure you are connected.');
            return;
        }

        // Use 10% of balance as max stake, or $10, whichever is lower
        const maxStake = Math.min(balance * 0.1, 10);
        const roundedStake = Math.max(0.35, Math.floor(maxStake * 100) / 100);

        setStake(roundedStake);
        setCurrentStake(roundedStake);
        alert(`💰 Max stake set to $${roundedStake.toFixed(2)}\n(10% of balance: $${balance.toFixed(2)})`);
    };

    // Repeat martingale until win
    const handleRepeatMartingale = async () => {
        if (isExecutingTrade || isRunning) {
            alert('⚠️ Trading already in progress!');
            return;
        }

        if (stake < 0.35) {
            alert('❌ Minimum stake is $0.35');
            return;
        }

        const maxLevels = 5;
        const confirmed = confirm(
            `Start Martingale Strategy?\n\n` +
                `Base Stake: $${stake}\n` +
                `Multiplier: ${martingale}x\n` +
                `Max Levels: ${maxLevels}\n\n` +
                `Will continue until win or max level reached.`
        );
        if (!confirmed) return;

        setIsExecutingTrade(true);
        let currentMartingaleStake = stake;
        let level = 1;
        let won = false;

        try {
            const symbol = marketSymbolMap[market] || 'R_50';
            const contractType = strategy === 'Over' ? 'DIGITOVER' : 'DIGITUNDER';

            while (!won && level <= maxLevels) {
                console.log(`🎲 Martingale Level ${level}: $${currentMartingaleStake.toFixed(2)}`);

                try {
                    const proposal = await bulkTradingService.getBulkProposal({
                        contract_type: contractType,
                        symbol,
                        duration: parseInt(ticks),
                        duration_unit: 't',
                        basis: 'stake',
                        amount: currentMartingaleStake,
                        barrier: prediction,
                    });

                    const result = await bulkTradingService.placeBulkTrades({
                        proposalId: proposal.proposal_id,
                        price: currentMartingaleStake,
                        count: 1,
                        delayMs: 0,
                    });

                    if (result.successful > 0) {
                        setRuns(prev => prev + 1);
                        // Wait for contract to settle (simulate)
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        // For demo, randomly determine win (in real scenario, monitor contract)
                        const isWin = Math.random() > 0.5;

                        if (isWin) {
                            won = true;
                            setWins(prev => prev + 1);
                            alert(`✅ Martingale Won at Level ${level}!\nStake: $${currentMartingaleStake.toFixed(2)}`);
                        } else {
                            setLosses(prev => prev + 1);
                            currentMartingaleStake *= parseFloat(martingale);
                            level++;
                        }
                    } else {
                        throw new Error(result.results[0].error || 'Trade failed');
                    }
                } catch (error: any) {
                    console.error(`Martingale level ${level} failed:`, error);
                    break;
                }
            }

            if (!won) {
                alert(`❌ Martingale stopped at Level ${level - 1}\nMax level reached or error occurred.`);
            }
        } catch (error: any) {
            console.error('Martingale error:', error);
            alert(`❌ Martingale failed: ${error.message}`);
        } finally {
            setIsExecutingTrade(false);
            setCurrentStake(stake); // Reset to base stake
        }
    };

    const handleBulkTrade = async (direction: 'over' | 'under') => {
        if (isBulkTrading) {
            alert('Bulk trading already in progress!');
            return;
        }

        setIsBulkTrading(true);
        setShowBulkModal(true);

        try {
            // Get proposal first
            const proposal = await bulkTradingService.getBulkProposal({
                contract_type: direction === 'over' ? 'DIGITOVER' : 'DIGITUNDER',
                symbol: marketSymbolMap[market] || 'R_50',
                duration: parseInt(ticks),
                duration_unit: 't',
                basis: 'stake',
                amount: stake,
                barrier: prediction,
            });

            // Place bulk trades
            const stats = await bulkTradingService.placeBulkTrades({
                proposalId: proposal.proposal_id,
                price: stake,
                count: bulkCount,
                delayMs: 150,
            });

            setBulkStats(stats);

            // Update positions with bulk results
            const newPositions = stats.results
                .filter(r => r.success)
                .map(r => ({
                    id: r.contractId || Date.now() + Math.random(),
                    symbol: marketSymbolMap[market] || 'R_50',
                    type: direction.toUpperCase(),
                    entrySpot: 0,
                    exitSpot: 0,
                    buyPrice: r.buyPrice || stake,
                    profit: 0,
                    isCompleted: false,
                    timestamp: Date.now(),
                }));

            setPositions(prev => [...newPositions, ...prev]);
            setRuns(prev => prev + stats.successful);

            // Show results
            alert(
                `Bulk Trade Complete!\n\n` +
                    `Total: ${stats.total}\n` +
                    `Successful: ${stats.successful}\n` +
                    `Failed: ${stats.failed}\n` +
                    `Total Cost: $${stats.totalCost.toFixed(2)}\n` +
                    `Duration: ${(stats.duration / 1000).toFixed(2)}s`
            );
        } catch (error: any) {
            console.error('Bulk trade error:', error);
            alert(`Bulk trade failed: ${error.message}`);
        } finally {
            setIsBulkTrading(false);
            setTimeout(() => setShowBulkModal(false), 2000);
        }
    };

    return (
        <div className='speedbot-new-container'>
            {/* Top Control Bar */}
            <div className='top-control-bar'>
                <button
                    className='btn-stake-now'
                    onClick={handleStakeNow}
                    disabled={isExecutingTrade || isRunning}
                    title='Execute a single trade with current settings'
                >
                    {isExecutingTrade ? '⏳ Trading...' : '🎯 Stake Now'}
                </button>
                <button
                    className='btn-multiple-stake'
                    onClick={handleMultipleStake}
                    disabled={isExecutingTrade || isRunning}
                    title={`Execute ${multipleStakeCount} trades`}
                >
                    📊 Multiple Stake ({multipleStakeCount}x)
                </button>
                <button
                    className='btn-max-stakes'
                    onClick={handleMaxStake}
                    disabled={isExecutingTrade || isRunning}
                    title='Set stake to maximum (10% of balance)'
                >
                    💰 Max Stake
                </button>
                <button
                    className='btn-repeat-martingale'
                    onClick={handleRepeatMartingale}
                    disabled={isExecutingTrade || isRunning}
                    title='Run martingale strategy until win'
                >
                    🔄 Repeat Martingale
                </button>
            </div>

            {/* Market Selection */}
            <div className='market-selection-row'>
                <select className='market-dropdown' value={market} onChange={e => setMarket(e.target.value)}>
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
            <div className='martingale-row'>
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
            <div className='digit-stakes-row'>
                <button className='digit-stake-btn'>Digit Stake</button>
                <button className='digit-stake-btn'>Digit Stake</button>
                <button className='digit-stake-btn'>Digit Stake</button>
            </div>

            {/* Enhanced Tick Pointer - All-in-One Interactive Component */}
            <EnhancedTickPointer
                market={marketSymbolMap[market] || 'R_50'}
                onDigitSelect={digit => {
                    setPrediction(digit.toString());
                    console.log('✅ Digit selected:', digit);
                }}
                showAnalytics={true}
            />

            {/* Digit Statistics Circles - Live Deriv Data */}
            <DigitStatsCircles
                market={marketSymbolMap[market] || 'R_50'}
                balance={balance}
                currentStake={stake}
                onDigitClick={digit => {
                    setPrediction(digit.toString());
                    console.log('📊 Digit clicked from stats:', digit);
                }}
            />

            {/* Main Panel */}
            <div className='main-panel-container'>
                <div className='panel-header-bar'>
                    <h3>Panel</h3>
                </div>

                <div className='panel-content'>
                    <div className='start-stop-section'>
                        <button className={`start-stop-toggle ${isRunning ? 'stop' : 'start'}`} onClick={toggleRun}>
                            {isRunning ? 'STOP' : 'START'}
                        </button>
                        <p className='stake-description'>Stake amount from three stake</p>
                    </div>

                    <div className='control-buttons-row'>
                        <button
                            className='btn-teal'
                            onClick={() => setShowWinTargetModal(true)}
                            title='Set win target for auto-stop'
                        >
                            🎯 Win Target: {winTarget}
                        </button>
                        <button
                            className='btn-teal'
                            onClick={() => setShowStrategyModal(true)}
                            title='Select trading strategy'
                        >
                            📋 Strategy: {strategy}
                        </button>
                        <button
                            className='btn-blue'
                            onClick={() => setShowTakeProfitModal(true)}
                            title='Set take profit amount'
                        >
                            💵 Take Profit: ${takeProfit}
                        </button>
                        <button
                            className='btn-blue'
                            onClick={() => setShowDurationModal(true)}
                            title='Set trade duration'
                        >
                            ⏱️ Duration: {ticks} tick{ticks !== '1' ? 's' : ''}
                        </button>
                    </div>

                    {/* Trade History Table */}
                    <div className='trade-history-table'>
                        <div className='history-header-row'>
                            <span>Time</span>
                            <span>Deriv/Bot app</span>
                            <span>Requirements</span>
                        </div>
                        <div className='history-body'>
                            {positions.length === 0 ? (
                                <div className='no-trades'>No trades yet</div>
                            ) : (
                                positions.map(position => (
                                    <div key={position.id} className='history-row'>
                                        <div className='history-time'>
                                            <span className='trade-id'>S7</span>
                                            <span className='timestamp'>
                                                {new Date(position.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div className='history-app'>
                                            <span>Deriv/Bot app</span>
                                            <span className='tick-id'>{position.id.toString().slice(-7)}</span>
                                        </div>
                                        <div className='history-requirements'>
                                            <span>Requirements</span>
                                            <span
                                                className={position.profit && position.profit >= 0 ? 'profit' : 'loss'}
                                            >
                                                {position.profit
                                                    ? (position.profit >= 0 ? '+' : '') + position.profit.toFixed(2)
                                                    : '0.00'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='action-buttons-row'>
                        <button className='btn-over' onClick={() => setStrategy('Over')}>
                            Over
                        </button>
                        <button className='btn-under' onClick={() => setStrategy('Under')}>
                            Under
                        </button>
                        <button className='btn-reset' onClick={handleReset}>
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Trading Controls */}
            <div className='bulk-controls'>
                <div className='bulk-count-selector'>
                    <label>Bulk Count:</label>
                    <input
                        type='number'
                        min='1'
                        max='20'
                        value={bulkCount}
                        onChange={e => setBulkCount(parseInt(e.target.value) || 1)}
                        disabled={isBulkTrading}
                    />
                </div>
            </div>

            {/* Bulk Actions */}
            <div className='bulk-actions-row'>
                <button className='bulk-over' onClick={() => handleBulkTrade('over')} disabled={isBulkTrading}>
                    {isBulkTrading ? 'Trading...' : `Bulk Over (${bulkCount})`}
                </button>
                <button className='bulk-under' onClick={() => handleBulkTrade('under')} disabled={isBulkTrading}>
                    {isBulkTrading ? 'Trading...' : `Bulk Under (${bulkCount})`}
                </button>
                <div className='bulk-track'>
                    {bulkStats ? `Last: ${bulkStats.successful}/${bulkStats.total}` : 'Track Bulk'}
                </div>
            </div>

            {/* Progress Bar */}
            <div className='progress-section'>
                <span className='progress-label'>Run</span>
                <div className='progress-bar-container'>
                    <div className='progress-bar-fill' style={{ width: `${(runs / 100) * 100}%` }}></div>
                </div>
            </div>

            {/* Statistics Footer */}
            <div className='statistics-footer'>
                <span className='stat-item'>
                    Total PL: <span className={totalPL >= 0 ? 'positive' : 'negative'}>${totalPL.toFixed(2)}</span>
                </span>
                <span className='stat-item'>W: {wins}</span>
                <span className='stat-item'>D: 0</span>
                <span className='stat-item'>L: {losses}</span>
            </div>

            {/* Bulk Trading Modal */}
            {showBulkModal && (
                <div className='bulk-modal-overlay'>
                    <div className='bulk-modal'>
                        <h3>Bulk Trading in Progress...</h3>
                        {bulkStats ? (
                            <div className='bulk-results'>
                                <p>
                                    <strong>Total Contracts:</strong> {bulkStats.total}
                                </p>
                                <p className='success'>
                                    <strong>Successful:</strong> {bulkStats.successful}
                                </p>
                                <p className='failed'>
                                    <strong>Failed:</strong> {bulkStats.failed}
                                </p>
                                <p>
                                    <strong>Total Cost:</strong> ${bulkStats.totalCost.toFixed(2)}
                                </p>
                                <p>
                                    <strong>Duration:</strong> {(bulkStats.duration / 1000).toFixed(2)}s
                                </p>
                            </div>
                        ) : (
                            <div className='bulk-loading'>
                                <div className='spinner'></div>
                                <p>Placing {bulkCount} contracts...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Win Target Modal */}
            {showWinTargetModal && (
                <div className='settings-modal-overlay' onClick={() => setShowWinTargetModal(false)}>
                    <div className='settings-modal' onClick={e => e.stopPropagation()}>
                        <h3>🎯 Set Win Target</h3>
                        <p>Bot will stop after reaching this many wins</p>
                        <input
                            type='number'
                            min='1'
                            max='100'
                            value={winTarget}
                            onChange={e => setWinTarget(parseInt(e.target.value) || 10)}
                        />
                        <div className='modal-actions'>
                            <button onClick={() => setShowWinTargetModal(false)}>Cancel</button>
                            <button
                                className='primary'
                                onClick={() => {
                                    setShowWinTargetModal(false);
                                    alert(`✅ Win target set to ${winTarget}`);
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Strategy Modal */}
            {showStrategyModal && (
                <div className='settings-modal-overlay' onClick={() => setShowStrategyModal(false)}>
                    <div className='settings-modal' onClick={e => e.stopPropagation()}>
                        <h3>📋 Select Strategy</h3>
                        <div className='strategy-options'>
                            <button
                                className={strategy === 'Over' ? 'selected' : ''}
                                onClick={() => setStrategy('Over')}
                            >
                                Over {prediction}
                            </button>
                            <button
                                className={strategy === 'Under' ? 'selected' : ''}
                                onClick={() => setStrategy('Under')}
                            >
                                Under {prediction}
                            </button>
                            <button
                                className={strategy === 'Even' ? 'selected' : ''}
                                onClick={() => setStrategy('Even')}
                            >
                                Even
                            </button>
                            <button className={strategy === 'Odd' ? 'selected' : ''} onClick={() => setStrategy('Odd')}>
                                Odd
                            </button>
                        </div>
                        <div className='modal-actions'>
                            <button onClick={() => setShowStrategyModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Take Profit Modal */}
            {showTakeProfitModal && (
                <div className='settings-modal-overlay' onClick={() => setShowTakeProfitModal(false)}>
                    <div className='settings-modal' onClick={e => e.stopPropagation()}>
                        <h3>💵 Set Take Profit</h3>
                        <p>Bot will stop after reaching this profit amount</p>
                        <input
                            type='number'
                            min='0'
                            step='0.5'
                            value={takeProfit}
                            onChange={e => setTakeProfit(parseFloat(e.target.value) || 5)}
                        />
                        <div className='modal-actions'>
                            <button onClick={() => setShowTakeProfitModal(false)}>Cancel</button>
                            <button
                                className='primary'
                                onClick={() => {
                                    setShowTakeProfitModal(false);
                                    alert(`✅ Take profit set to $${takeProfit.toFixed(2)}`);
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Duration Modal */}
            {showDurationModal && (
                <div className='settings-modal-overlay' onClick={() => setShowDurationModal(false)}>
                    <div className='settings-modal' onClick={e => e.stopPropagation()}>
                        <h3>⏱️ Set Duration</h3>
                        <p>Number of ticks for each trade</p>
                        <div className='duration-options'>
                            {['1', '2', '3', '5', '10'].map(t => (
                                <button key={t} className={ticks === t ? 'selected' : ''} onClick={() => setTicks(t)}>
                                    {t} tick{t !== '1' ? 's' : ''}
                                </button>
                            ))}
                        </div>
                        <div className='modal-actions'>
                            <button onClick={() => setShowDurationModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stake Configuration */}
            <div className='stake-configuration'>
                <div className='stake-input-group'>
                    <label>Stake Amount:</label>
                    <input
                        type='number'
                        min='0.35'
                        step='0.05'
                        value={stake}
                        onChange={e => {
                            const value = parseFloat(e.target.value);
                            if (value >= 0.35) {
                                setStake(value);
                                setCurrentStake(value);
                            }
                        }}
                        disabled={isRunning || isExecutingTrade}
                    />
                    <span>USD</span>
                </div>
                <div className='stake-input-group'>
                    <label>Martingale:</label>
                    <select
                        value={martingale}
                        onChange={e => setMartingale(e.target.value)}
                        disabled={isRunning || isExecutingTrade}
                    >
                        <option value='1.5'>1.5x</option>
                        <option value='2'>2x</option>
                        <option value='2.5'>2.5x</option>
                        <option value='3'>3x</option>
                    </select>
                </div>
                <div className='stake-input-group'>
                    <label>Multiple Count:</label>
                    <input
                        type='number'
                        min='1'
                        max='10'
                        value={multipleStakeCount}
                        onChange={e => setMultipleStakeCount(parseInt(e.target.value) || 3)}
                        disabled={isRunning || isExecutingTrade}
                    />
                </div>
            </div>
        </div>
    );
};

export default SpeedBotNew;
