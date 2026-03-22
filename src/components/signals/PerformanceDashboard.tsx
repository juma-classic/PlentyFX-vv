import React, { useEffect, useState } from 'react';
import { SignalTradeStats, signalTradingService } from '@/services/signal-trading.service';
import './PerformanceDashboard.scss';

export const PerformanceDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [stats, setStats] = useState<SignalTradeStats>(signalTradingService.getStats());
    const [allTrades, setAllTrades] = useState(signalTradingService.getAllTrades());
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setStats(signalTradingService.getStats());
            setAllTrades(signalTradingService.getAllTrades());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleExport = () => {
        signalTradingService.downloadHistory();
    };

    const handleReset = () => {
        const confirmed = window.confirm(
            '⚠️ Are you sure you want to reset all trade history?\n\nThis will:\n- Clear all trade records\n- Reset statistics to zero\n- Reset win/loss streaks\n- Cannot be undone!\n\nExport your history first if you want to keep a backup.'
        );

        if (confirmed) {
            signalTradingService.clearHistory();
            // Force update
            setStats(signalTradingService.getStats());
            setAllTrades(signalTradingService.getAllTrades());
            alert('✅ Trade history has been reset!');
        }
    };

    const handleRefreshPending = async () => {
        setIsRefreshing(true);
        try {
            await signalTradingService.refreshAllPendingTrades();
            // Force update
            setStats(signalTradingService.getStats());
            setAllTrades(signalTradingService.getAllTrades());
        } catch (error) {
            console.error('Error refreshing trades:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Show most recent trades first (reverse chronological order)
    const recentTrades = [...allTrades].reverse().slice(0, 10);
    const pendingCount = allTrades.filter(t => t.profit === undefined).length;

    return (
        <div className='performance-dashboard-overlay'>
            <div className='performance-dashboard'>
                <div className='dashboard-header'>
                    <h2>📊 Performance Analytics</h2>
                    <button className='close-btn' onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className='dashboard-content'>
                    {/* Overall Stats */}
                    <div className='stats-section'>
                        <h3>Overall Performance</h3>
                        <div className='stats-grid'>
                            <div className='stat-card'>
                                <div className='stat-label'>Total Trades</div>
                                <div className='stat-value'>{stats.totalTrades}</div>
                            </div>
                            <div className='stat-card'>
                                <div className='stat-label'>Win Rate</div>
                                <div className='stat-value success'>{stats.winRate.toFixed(1)}%</div>
                            </div>
                            <div className='stat-card'>
                                <div className='stat-label'>Total Profit</div>
                                <div className={`stat-value ${stats.totalProfit >= 0 ? 'success' : 'danger'}`}>
                                    {stats.totalProfit >= 0 ? '+' : ''}
                                    {stats.totalProfit.toFixed(2)} USD
                                </div>
                            </div>
                            <div className='stat-card'>
                                <div className='stat-label'>Avg Profit</div>
                                <div className={`stat-value ${stats.averageProfit >= 0 ? 'success' : 'danger'}`}>
                                    {stats.averageProfit >= 0 ? '+' : ''}
                                    {stats.averageProfit.toFixed(2)} USD
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Today's Stats */}
                    <div className='stats-section'>
                        <h3>Today&apos;s Performance</h3>
                        <div className='stats-grid'>
                            <div className='stat-card'>
                                <div className='stat-label'>Trades Today</div>
                                <div className='stat-value'>{stats.todayTrades}</div>
                            </div>
                            <div className='stat-card'>
                                <div className='stat-label'>Today&apos;s Profit</div>
                                <div className={`stat-value ${stats.todayProfit >= 0 ? 'success' : 'danger'}`}>
                                    {stats.todayProfit >= 0 ? '+' : ''}
                                    {stats.todayProfit.toFixed(2)} USD
                                </div>
                            </div>
                            <div className='stat-card'>
                                <div className='stat-label'>Last Hour</div>
                                <div className='stat-value'>{stats.lastHourTrades} trades</div>
                            </div>
                            <div className='stat-card'>
                                <div className='stat-label'>Best Trade</div>
                                <div className='stat-value success'>+{stats.bestTrade.toFixed(2)} USD</div>
                            </div>
                        </div>
                    </div>

                    {/* Win/Loss Breakdown */}
                    <div className='stats-section'>
                        <h3>Win/Loss Breakdown</h3>
                        <div className='breakdown-grid'>
                            <div className='breakdown-item'>
                                <div className='breakdown-label'>Wins</div>
                                <div className='breakdown-bar'>
                                    <div className='breakdown-fill success' style={{ width: `${stats.winRate}%` }} />
                                </div>
                                <div className='breakdown-value'>{stats.wins}</div>
                            </div>
                            <div className='breakdown-item'>
                                <div className='breakdown-label'>Losses</div>
                                <div className='breakdown-bar'>
                                    <div
                                        className='breakdown-fill danger'
                                        style={{
                                            width: `${stats.totalTrades > 0 ? (stats.losses / stats.totalTrades) * 100 : 0}%`,
                                        }}
                                    />
                                </div>
                                <div className='breakdown-value'>{stats.losses}</div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Trades */}
                    <div className='stats-section'>
                        <div className='section-header'>
                            <h3>Recent Trades</h3>
                            {pendingCount > 0 && (
                                <button className='refresh-btn' onClick={handleRefreshPending} disabled={isRefreshing}>
                                    {isRefreshing ? '🔄 Refreshing...' : `🔄 Refresh ${pendingCount} Pending`}
                                </button>
                            )}
                        </div>
                        <div className='trades-list'>
                            {recentTrades.length === 0 ? (
                                <div className='no-trades'>No trades yet</div>
                            ) : (
                                <div className='trades-table'>
                                    <div className='trades-header'>
                                        <div className='th-time'>Time</div>
                                        <div className='th-market'>Market</div>
                                        <div className='th-type'>Type</div>
                                        <div className='th-stake'>Stake</div>
                                        <div className='th-profit'>Profit</div>
                                        <div className='th-status'>Status</div>
                                    </div>
                                    {recentTrades.map((trade, idx) => {
                                        const isPending = trade.profit === undefined;
                                        const isWon = trade.isWon === true;
                                        const isLost = trade.isWon === false;

                                        return (
                                            <div
                                                key={idx}
                                                className={`trade-row ${isPending ? 'pending' : isWon ? 'won' : 'lost'}`}
                                            >
                                                <div className='td-time'>
                                                    {new Date(trade.timestamp).toLocaleTimeString()}
                                                </div>
                                                <div className='td-market'>{trade.market || 'N/A'}</div>
                                                <div className='td-type'>
                                                    <span className='type-badge'>{trade.type || 'N/A'}</span>
                                                </div>
                                                <div className='td-stake'>${trade.stake?.toFixed(2) || '0.00'}</div>
                                                <div
                                                    className={`td-profit ${isWon ? 'success' : isLost ? 'danger' : ''}`}
                                                >
                                                    {isPending
                                                        ? '⏳ Pending'
                                                        : `${trade.profit! >= 0 ? '+' : ''}$${Math.abs(trade.profit!).toFixed(2)}`}
                                                </div>
                                                <div className='td-status'>
                                                    {isPending ? (
                                                        <span className='status-badge pending'>Pending</span>
                                                    ) : isWon ? (
                                                        <span className='status-badge won'>✅ Won</span>
                                                    ) : (
                                                        <span className='status-badge lost'>❌ Lost</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Export and Reset Buttons */}
                    <div className='dashboard-actions'>
                        <button className='reset-btn' onClick={handleReset}>
                            🗑️ Reset History
                        </button>
                        <button className='export-btn' onClick={handleExport}>
                            📥 Export History (CSV)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
