import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import './DigitStakePanel.scss';

interface TradeConfig {
    stake: number;
    duration: number;
    strategy: 'single' | 'multiple' | 'martingale';
    direction: 'over' | 'under';
    targetDigit: number;
    bulkCount: number;
    symbol: string;
    winTarget: number;
    takeProfit: number;
}

export const DigitStakePanel = observer(() => {
    const [isRunning, setIsRunning] = useState(false);
    const [config, setConfig] = useState<TradeConfig>({
        stake: 0.35,
        duration: 5,
        strategy: 'single',
        direction: 'over',
        targetDigit: 3,
        bulkCount: 5,
        symbol: '1HZ100V',
        winTarget: 10,
        takeProfit: 0.35,
    });
    const [stats, setStats] = useState({
        wins: 0,
        losses: 0,
        draws: 0,
        totalProfit: 0,
    });

    const handleStakeNow = async () => {
        // TODO: Check API connection
        // if (!deriv_api.isConnected) {
        //     alert('Please connect to Deriv API first');
        //     return;
        // }

        try {
            // Execute single trade
            await executeTrade(config);
        } catch (error) {
            console.error('Trade execution failed:', error);
        }
    };

    const handleMultipleStake = async () => {
        // TODO: Check API connection
        // if (!deriv_api.isConnected) {
        //     alert('Please connect to Deriv API first');
        //     return;
        // }

        setIsRunning(true);
        for (let i = 0; i < config.bulkCount; i++) {
            if (!isRunning) break;
            await executeTrade(config);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setIsRunning(false);
    };

    const handleMaxStake = () => {
        // TODO: Set to maximum available balance
        // const maxStake = deriv_api.balance * 0.1; // 10% of balance as max
        const maxStake = 10; // Placeholder
        setConfig({ ...config, stake: maxStake });
    };

    const handleRepeatMartingale = async () => {
        // TODO: Check API connection
        // if (!deriv_api.isConnected) {
        //     alert('Please connect to Deriv API first');
        //     return;
        // }

        setIsRunning(true);
        let currentStake = config.stake;
        let consecutiveLosses = 0;

        while (isRunning && consecutiveLosses < 5) {
            const result = await executeTrade({ ...config, stake: currentStake });

            if (result.profit > 0) {
                currentStake = config.stake; // Reset to base stake
                consecutiveLosses = 0;
            } else {
                currentStake *= 2; // Double stake after loss
                consecutiveLosses++;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setIsRunning(false);
    };

    const handleStart = () => {
        setIsRunning(!isRunning);
    };

    const handleBulkOver = async () => {
        setConfig({ ...config, direction: 'over' });
        await handleMultipleStake();
    };

    const handleBulkUnder = async () => {
        setConfig({ ...config, direction: 'under' });
        await handleMultipleStake();
    };

    const handleTrackBulk = () => {
        // Open tracking modal/panel
        console.log('Track bulk trades:', stats);
    };

    const executeTrade = async (tradeConfig: TradeConfig): Promise<{ profit: number }> => {
        // Placeholder for actual trade execution
        // This would integrate with Deriv API
        console.log('Executing trade:', tradeConfig);

        // Simulate trade result
        const isWin = Math.random() > 0.5;
        const profit = isWin ? tradeConfig.stake * 0.95 : -tradeConfig.stake;

        setStats(prev => ({
            wins: prev.wins + (isWin ? 1 : 0),
            losses: prev.losses + (isWin ? 0 : 1),
            draws: prev.draws,
            totalProfit: prev.totalProfit + profit,
        }));

        return { profit };
    };

    return (
        <div className='digit-stake-panel'>
            <div className='panel-header'>
                <button className='btn-primary' onClick={handleStakeNow}>
                    Stake Now
                </button>
                <button className='btn-secondary' onClick={handleMultipleStake}>
                    Multiple Stake
                </button>
                <button className='btn-secondary' onClick={handleMaxStake}>
                    Max Stake(s)
                </button>
                <button className='btn-warning' onClick={handleRepeatMartingale}>
                    Repeat Martingle
                </button>
            </div>

            <div className='panel-body'>
                <div className='digit-display'>
                    <div className='digit-label'>Digit Stake</div>
                    <div className='digit-circles'>
                        {[1, 2, 3, 4, 5, 6].map(num => (
                            <div
                                key={num}
                                className={`digit-circle ${num === 3 ? 'active' : ''}`}
                                onClick={() => setConfig({ ...config, targetDigit: num })}
                            >
                                {num}
                            </div>
                        ))}
                    </div>
                </div>

                <div className='trade-controls'>
                    <button className={`btn-start ${isRunning ? 'running' : ''}`} onClick={handleStart}>
                        {isRunning ? 'STOP' : 'START'}
                    </button>

                    <div className='control-row'>
                        <div className='control-group'>
                            <label>Set W Tgt</label>
                            <input
                                type='number'
                                value={config.stake}
                                onChange={e => setConfig({ ...config, stake: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className='control-group'>
                            <label>Strategy</label>
                            <select
                                value={config.strategy}
                                onChange={e =>
                                    setConfig({
                                        ...config,
                                        strategy: e.target.value as 'single' | 'multiple' | 'martingale',
                                    })
                                }
                            >
                                <option value='single'>Single</option>
                                <option value='multiple'>Multiple</option>
                                <option value='martingale'>Martingale</option>
                            </select>
                        </div>
                        <div className='control-group'>
                            <label>Take Profit (0.35)</label>
                            <input
                                type='number'
                                step='0.01'
                                value={config.stake}
                                onChange={e => setConfig({ ...config, stake: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className='control-group'>
                            <label>Duration (ticks)</label>
                            <input
                                type='number'
                                value={config.duration}
                                onChange={e => setConfig({ ...config, duration: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className='action-buttons'>
                        <button className='btn-over' onClick={handleBulkOver}>
                            Over
                        </button>
                        <button className='btn-under' onClick={handleBulkUnder}>
                            Under
                        </button>
                        <button className='btn-reset'>Reset</button>
                    </div>
                </div>

                <div className='bulk-controls'>
                    <div className='bulk-count'>
                        <label>Bulk Count:</label>
                        <input
                            type='number'
                            value={config.bulkCount}
                            onChange={e => setConfig({ ...config, bulkCount: parseInt(e.target.value) })}
                        />
                    </div>
                    <div className='bulk-buttons'>
                        <button className='btn-bulk-over' onClick={handleBulkOver}>
                            Bulk Over (5)
                        </button>
                        <button className='btn-bulk-under' onClick={handleBulkUnder}>
                            Bulk Under (5)
                        </button>
                        <button className='btn-track' onClick={handleTrackBulk}>
                            Track Bulk
                        </button>
                    </div>
                    <button className='btn-run'>Run</button>
                </div>

                <div className='stats-footer'>
                    <div className='stat'>Total PL: ${stats.totalProfit.toFixed(2)}</div>
                    <div className='stat'>W: {stats.wins}</div>
                    <div className='stat'>D: 0</div>
                    <div className='stat'>L: {stats.losses}</div>
                </div>
            </div>
        </div>
    );
});
