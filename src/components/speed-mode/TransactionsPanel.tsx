import React from 'react';
import './TransactionsPanel.scss';

interface Transaction {
    id: string;
    type: string;
    entrySpot: number;
    exitSpot: number;
    buyPrice: number;
    profit: number;
    timestamp: number;
    outcome: 'win' | 'loss';
}

interface TransactionsPanelProps {
    transactions: Transaction[];
    isRunning: boolean;
    totalStake: number;
    totalPayout: number;
    totalRuns: number;
    contractsWon: number;
    contractsLost: number;
    totalProfit: number;
    onReset: () => void;
}

export const TransactionsPanel: React.FC<TransactionsPanelProps> = ({
    transactions,
    isRunning,
    totalStake,
    totalPayout,
    totalRuns,
    contractsWon,
    contractsLost,
    totalProfit,
    onReset,
}) => {
    const downloadTransactions = () => {
        const csv = [
            ['Type', 'Entry Spot', 'Exit Spot', 'Buy Price', 'P/L', 'Timestamp'].join(','),
            ...transactions.map(t =>
                [t.type, t.entrySpot, t.exitSpot, t.buyPrice, t.profit, new Date(t.timestamp).toISOString()].join(',')
            ),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `speed-mode-transactions-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className='transactions-panel'>
            <div className='panel-header'>
                <div className='status-bar'>
                    <span className={`status-indicator ${isRunning ? 'running' : 'stopped'}`}>
                        {isRunning ? 'Bot is running' : 'Bot is not running'}
                    </span>
                </div>

                <h3 className='panel-title'>Transactions</h3>

                <div className='panel-actions'>
                    <button
                        className='btn-download'
                        onClick={downloadTransactions}
                        disabled={transactions.length === 0}
                    >
                        Download
                    </button>
                    <button className='btn-detail' disabled>
                        View Detail
                    </button>
                </div>
            </div>

            <div className='transactions-list'>
                {transactions.length === 0 ? (
                    <div className='empty-state'>
                        <div className='empty-icon'>📦</div>
                        <p className='empty-title'>There are no transactions to display</p>
                        <p className='empty-subtitle'>Here are the possible reasons:</p>
                        <ul className='empty-reasons'>
                            <li>The bot is not running</li>
                            <li>The stats are cleared</li>
                        </ul>
                    </div>
                ) : (
                    <>
                        <div className='list-header'>
                            <span className='col-type'>Type</span>
                            <span className='col-spot'>Entry/Exit spot</span>
                            <span className='col-price'>Buy price and P/L</span>
                        </div>
                        <div className='list-body'>
                            {transactions.map(transaction => (
                                <div key={transaction.id} className='transaction-row'>
                                    <div className='col-type'>
                                        <div className='trade-icon'>
                                            <span className='icon-chart'>📊</span>
                                            <span className='icon-candles'>🕯️</span>
                                        </div>
                                    </div>
                                    <div className='col-spot'>
                                        <div className='spot-entry'>
                                            <span className='spot-dot entry'>⭕</span>
                                            <span className='spot-value'>{transaction.entrySpot.toFixed(4)}</span>
                                        </div>
                                        <div className='spot-exit'>
                                            <span className='spot-dot exit'>⭕</span>
                                            <span className='spot-value'>{transaction.exitSpot.toFixed(4)}</span>
                                        </div>
                                    </div>
                                    <div className='col-price'>
                                        <div className='buy-price'>{transaction.buyPrice.toFixed(2)} USD</div>
                                        <div className={`profit ${transaction.outcome}`}>
                                            {transaction.profit >= 0 ? '+' : ''}
                                            {transaction.profit.toFixed(2)} USD
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className='panel-footer'>
                <div className='stats-grid'>
                    <div className='stat-item'>
                        <span className='stat-label'>Total stake</span>
                        <span className='stat-value'>{totalStake.toFixed(2)} USD</span>
                    </div>
                    <div className='stat-item'>
                        <span className='stat-label'>Total payout</span>
                        <span className='stat-value'>{totalPayout.toFixed(2)} USD</span>
                    </div>
                    <div className='stat-item'>
                        <span className='stat-label'>No. of runs</span>
                        <span className='stat-value'>{totalRuns}</span>
                    </div>
                    <div className='stat-item'>
                        <span className='stat-label'>Contracts lost</span>
                        <span className='stat-value'>{contractsLost}</span>
                    </div>
                    <div className='stat-item'>
                        <span className='stat-label'>Contracts won</span>
                        <span className='stat-value'>{contractsWon}</span>
                    </div>
                    <div className='stat-item highlight'>
                        <span className='stat-label'>Total profit/loss</span>
                        <span className={`stat-value ${totalProfit >= 0 ? 'profit' : 'loss'}`}>
                            {totalProfit >= 0 ? '+' : ''}
                            {totalProfit.toFixed(2)} USD
                        </span>
                    </div>
                </div>

                <button className='btn-reset' onClick={onReset}>
                    Reset
                </button>
            </div>
        </div>
    );
};
