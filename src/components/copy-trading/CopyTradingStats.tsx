import React from 'react';
import type { CopyTradingStats } from '@/types/copy-trading.types';
import './CopyTradingStats.scss';

interface CopyTradingStatsProps {
    stats: CopyTradingStats;
}

export const CopyTradingStats: React.FC<CopyTradingStatsProps> = ({ stats }) => {
    const winRate = stats.totalCopyTrades > 0 ? (stats.successfulCopyTrades / stats.totalCopyTrades) * 100 : 0;

    const topTraders = Object.entries(stats.traderStats)
        .sort(([, a], [, b]) => b.totalProfit - a.totalProfit)
        .slice(0, 5);

    return (
        <div className='copy-trading-stats'>
            {/* Overview Stats */}
            <div className='stats-overview'>
                <div className='stats-grid'>
                    <div className='stat-card'>
                        <div className='stat-header'>
                            <span className='stat-icon'>👥</span>
                            <span className='stat-title'>Total Traders</span>
                        </div>
                        <div className='stat-value'>{stats.totalCopyTraders}</div>
                        <div className='stat-subtitle'>{stats.activeCopyTraders} active</div>
                    </div>

                    <div className='stat-card'>
                        <div className='stat-header'>
                            <span className='stat-icon'>📊</span>
                            <span className='stat-title'>Total Trades</span>
                        </div>
                        <div className='stat-value'>{stats.totalCopyTrades}</div>
                        <div className='stat-subtitle'>{stats.successfulCopyTrades} successful</div>
                    </div>

                    <div className='stat-card'>
                        <div className='stat-header'>
                            <span className='stat-icon'>🎯</span>
                            <span className='stat-title'>Win Rate</span>
                        </div>
                        <div className='stat-value'>{winRate.toFixed(1)}%</div>
                        <div className='stat-subtitle'>Overall performance</div>
                    </div>

                    <div className='stat-card'>
                        <div className='stat-header'>
                            <span className='stat-icon'>💰</span>
                            <span className='stat-title'>Total Profit</span>
                        </div>
                        <div className={`stat-value ${stats.totalCopyProfit >= 0 ? 'positive' : 'negative'}`}>
                            ${stats.totalCopyProfit.toFixed(2)}
                        </div>
                        <div className='stat-subtitle'>Combined profit</div>
                    </div>

                    <div className='stat-card'>
                        <div className='stat-header'>
                            <span className='stat-icon'>⚡</span>
                            <span className='stat-title'>Avg Execution</span>
                        </div>
                        <div className='stat-value'>{stats.averageExecutionTime.toFixed(0)}ms</div>
                        <div className='stat-subtitle'>Execution time</div>
                    </div>
                </div>
            </div>

            {/* Top Performers */}
            {topTraders.length > 0 && (
                <div className='top-performers'>
                    <h3>🏆 Top Performing Traders</h3>
                    <div className='performers-list'>
                        {topTraders.map(([traderId, traderStats], index) => (
                            <div key={traderId} className='performer-card'>
                                <div className='performer-rank'>
                                    <span className='rank-number'>#{index + 1}</span>
                                    {index === 0 && <span className='crown'>👑</span>}
                                </div>

                                <div className='performer-info'>
                                    <div className='performer-id'>Trader {traderId.slice(-6)}</div>
                                    <div className='performer-stats'>
                                        <span className='trades'>{traderStats.totalTrades} trades</span>
                                        <span className='win-rate'>{traderStats.winRate.toFixed(1)}% win rate</span>
                                    </div>
                                </div>

                                <div className='performer-profit'>
                                    <div
                                        className={`profit-value ${traderStats.totalProfit >= 0 ? 'positive' : 'negative'}`}
                                    >
                                        ${traderStats.totalProfit.toFixed(2)}
                                    </div>
                                    <div className='avg-stake'>Avg: ${traderStats.averageStake.toFixed(2)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Performance Chart Placeholder */}
            <div className='performance-chart'>
                <h3>📈 Performance Overview</h3>
                <div className='chart-placeholder'>
                    <div className='chart-info'>
                        <span className='chart-icon'>📊</span>
                        <div className='chart-text'>
                            <h4>Performance Chart</h4>
                            <p>Detailed performance charts will be available in future updates</p>
                        </div>
                    </div>

                    {/* Simple performance indicators */}
                    <div className='performance-indicators'>
                        <div className='indicator'>
                            <span className='indicator-label'>Success Rate</span>
                            <div className='indicator-bar'>
                                <div className='indicator-fill success' style={{ width: `${winRate}%` }}></div>
                            </div>
                            <span className='indicator-value'>{winRate.toFixed(1)}%</span>
                        </div>

                        <div className='indicator'>
                            <span className='indicator-label'>Active Traders</span>
                            <div className='indicator-bar'>
                                <div
                                    className='indicator-fill active'
                                    style={{
                                        width: `${stats.totalCopyTraders > 0 ? (stats.activeCopyTraders / stats.totalCopyTraders) * 100 : 0}%`,
                                    }}
                                ></div>
                            </div>
                            <span className='indicator-value'>
                                {stats.totalCopyTraders > 0
                                    ? ((stats.activeCopyTraders / stats.totalCopyTraders) * 100).toFixed(1)
                                    : 0}
                                %
                            </span>
                        </div>

                        <div className='indicator'>
                            <span className='indicator-label'>Profitability</span>
                            <div className='indicator-bar'>
                                <div
                                    className={`indicator-fill ${stats.totalCopyProfit >= 0 ? 'profit' : 'loss'}`}
                                    style={{ width: '75%' }}
                                ></div>
                            </div>
                            <span className='indicator-value'>
                                {stats.totalCopyProfit >= 0 ? 'Profitable' : 'Loss'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className='recent-activity'>
                <h3>🕒 Recent Activity Summary</h3>
                <div className='activity-grid'>
                    <div className='activity-item'>
                        <span className='activity-icon'>🆕</span>
                        <div className='activity-content'>
                            <div className='activity-title'>New Traders</div>
                            <div className='activity-value'>
                                {
                                    Object.values(stats.traderStats).filter(
                                        s => Date.now() - s.lastTradeTime < 24 * 60 * 60 * 1000
                                    ).length
                                }
                            </div>
                            <div className='activity-subtitle'>Last 24 hours</div>
                        </div>
                    </div>

                    <div className='activity-item'>
                        <span className='activity-icon'>📈</span>
                        <div className='activity-content'>
                            <div className='activity-title'>Recent Trades</div>
                            <div className='activity-value'>
                                {Object.values(stats.traderStats).reduce(
                                    (sum, s) =>
                                        sum + (Date.now() - s.lastTradeTime < 24 * 60 * 60 * 1000 ? s.totalTrades : 0),
                                    0
                                )}
                            </div>
                            <div className='activity-subtitle'>Last 24 hours</div>
                        </div>
                    </div>

                    <div className='activity-item'>
                        <span className='activity-icon'>💎</span>
                        <div className='activity-content'>
                            <div className='activity-title'>Best Performer</div>
                            <div className='activity-value'>
                                {topTraders.length > 0 ? `${topTraders[0][1].winRate.toFixed(1)}%` : 'N/A'}
                            </div>
                            <div className='activity-subtitle'>Win rate</div>
                        </div>
                    </div>

                    <div className='activity-item'>
                        <span className='activity-icon'>⚡</span>
                        <div className='activity-content'>
                            <div className='activity-title'>Execution Speed</div>
                            <div className='activity-value'>
                                {stats.averageExecutionTime < 1000
                                    ? 'Fast'
                                    : stats.averageExecutionTime < 3000
                                      ? 'Good'
                                      : 'Slow'}
                            </div>
                            <div className='activity-subtitle'>{stats.averageExecutionTime.toFixed(0)}ms avg</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
