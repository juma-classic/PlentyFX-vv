import React, { useState } from 'react';
import type { CopyTrader } from '@/types/copy-trading.types';
import './CopyTraderCard.scss';

interface CopyTraderCardProps {
    trader: CopyTrader;
    stats?: {
        totalTrades: number;
        winRate: number;
        totalProfit: number;
        averageStake: number;
        lastTradeTime: number;
    };
    onRemove: () => void;
    onToggle: (isActive: boolean) => void;
    onEdit: (updates: Partial<CopyTrader>) => void;
}

export const CopyTraderCard: React.FC<CopyTraderCardProps> = ({ trader, stats, onRemove, onToggle, onEdit }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: trader.name,
        maxStakePerTrade: trader.maxStakePerTrade,
        maxDailyLoss: trader.maxDailyLoss,
        stakeMultiplier: trader.stakeMultiplier,
    });

    const getStatusColor = (status: CopyTrader['connectionStatus']) => {
        switch (status) {
            case 'CONNECTED':
                return 'green';
            case 'DISCONNECTED':
                return 'orange';
            case 'ERROR':
                return 'red';
            case 'SUSPENDED':
                return 'gray';
            default:
                return 'gray';
        }
    };

    const getStatusIcon = (status: CopyTrader['connectionStatus']) => {
        switch (status) {
            case 'CONNECTED':
                return '🟢';
            case 'DISCONNECTED':
                return '🟡';
            case 'ERROR':
                return '🔴';
            case 'SUSPENDED':
                return '⏸️';
            default:
                return '⚪';
        }
    };

    const handleSaveEdit = () => {
        onEdit(editData);
        setIsEditing(false);
    };

    const formatLastActivity = (timestamp?: number) => {
        if (!timestamp) return 'Never';

        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className={`copy-trader-card ${trader.isActive ? 'active' : 'inactive'}`}>
            {/* Card Header */}
            <div className='card-header'>
                <div className='trader-info'>
                    <div className='trader-name'>
                        <span className='name'>{trader.name}</span>
                        <span className={`status-indicator ${getStatusColor(trader.connectionStatus)}`}>
                            {getStatusIcon(trader.connectionStatus)} {trader.connectionStatus}
                        </span>
                    </div>
                    {trader.email && <div className='trader-email'>{trader.email}</div>}
                </div>

                <div className='card-actions'>
                    <button
                        className={`toggle-btn ${trader.isActive ? 'active' : 'inactive'}`}
                        onClick={() => onToggle(!trader.isActive)}
                        title={trader.isActive ? 'Pause copy trading' : 'Resume copy trading'}
                    >
                        {trader.isActive ? '⏸️' : '▶️'}
                    </button>

                    <button className='details-btn' onClick={() => setShowDetails(!showDetails)} title='Show details'>
                        {showDetails ? '🔼' : '🔽'}
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className='quick-stats'>
                <div className='stat'>
                    <span className='stat-label'>Trades</span>
                    <span className='stat-value'>{stats?.totalTrades || 0}</span>
                </div>
                <div className='stat'>
                    <span className='stat-label'>Win Rate</span>
                    <span className='stat-value'>{stats?.winRate.toFixed(1) || '0.0'}%</span>
                </div>
                <div className='stat'>
                    <span className='stat-label'>Profit</span>
                    <span className={`stat-value ${(stats?.totalProfit || 0) >= 0 ? 'positive' : 'negative'}`}>
                        ${(stats?.totalProfit || 0).toFixed(2)}
                    </span>
                </div>
                <div className='stat'>
                    <span className='stat-label'>Multiplier</span>
                    <span className='stat-value'>{trader.stakeMultiplier}x</span>
                </div>
            </div>

            {/* Detailed Information */}
            {showDetails && (
                <div className='card-details'>
                    {/* Connection Info */}
                    <div className='detail-section'>
                        <h4>🔗 Connection</h4>
                        <div className='detail-grid'>
                            <div className='detail-item'>
                                <span className='label'>API Token:</span>
                                <span className='value'>***{trader.apiToken.slice(-6)}</span>
                            </div>
                            <div className='detail-item'>
                                <span className='label'>Last Activity:</span>
                                <span className='value'>{formatLastActivity(trader.lastActivity)}</span>
                            </div>
                            {trader.lastError && (
                                <div className='detail-item error'>
                                    <span className='label'>Last Error:</span>
                                    <span className='value'>{trader.lastError}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Risk Settings */}
                    <div className='detail-section'>
                        <div className='section-header'>
                            <h4>⚠️ Risk Management</h4>
                            <button className='edit-btn' onClick={() => setIsEditing(!isEditing)}>
                                {isEditing ? '❌' : '✏️'}
                            </button>
                        </div>

                        {isEditing ? (
                            <div className='edit-form'>
                                <div className='form-row'>
                                    <label>Name:</label>
                                    <input
                                        type='text'
                                        value={editData.name}
                                        onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className='form-row'>
                                    <label>Stake Multiplier:</label>
                                    <input
                                        type='number'
                                        step='0.1'
                                        min='0.1'
                                        max='10'
                                        value={editData.stakeMultiplier}
                                        onChange={e =>
                                            setEditData(prev => ({
                                                ...prev,
                                                stakeMultiplier: parseFloat(e.target.value),
                                            }))
                                        }
                                    />
                                </div>
                                <div className='form-row'>
                                    <label>Max Stake Per Trade:</label>
                                    <input
                                        type='number'
                                        min='0.35'
                                        step='0.01'
                                        value={editData.maxStakePerTrade}
                                        onChange={e =>
                                            setEditData(prev => ({
                                                ...prev,
                                                maxStakePerTrade: parseFloat(e.target.value),
                                            }))
                                        }
                                    />
                                </div>
                                <div className='form-row'>
                                    <label>Max Daily Loss:</label>
                                    <input
                                        type='number'
                                        min='1'
                                        step='1'
                                        value={editData.maxDailyLoss}
                                        onChange={e =>
                                            setEditData(prev => ({ ...prev, maxDailyLoss: parseFloat(e.target.value) }))
                                        }
                                    />
                                </div>
                                <div className='form-actions'>
                                    <button className='save-btn' onClick={handleSaveEdit}>
                                        💾 Save
                                    </button>
                                    <button className='cancel-btn' onClick={() => setIsEditing(false)}>
                                        ❌ Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className='detail-grid'>
                                <div className='detail-item'>
                                    <span className='label'>Stake Multiplier:</span>
                                    <span className='value'>{trader.stakeMultiplier}x</span>
                                </div>
                                <div className='detail-item'>
                                    <span className='label'>Max Stake Per Trade:</span>
                                    <span className='value'>${trader.maxStakePerTrade}</span>
                                </div>
                                <div className='detail-item'>
                                    <span className='label'>Max Daily Loss:</span>
                                    <span className='value'>${trader.maxDailyLoss}</span>
                                </div>
                                <div className='detail-item'>
                                    <span className='label'>Max Concurrent Trades:</span>
                                    <span className='value'>{trader.maxConcurrentTrades}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Trading Preferences */}
                    <div className='detail-section'>
                        <h4>🎯 Trading Preferences</h4>
                        <div className='preferences-grid'>
                            <div className={`preference-item ${trader.followSignals ? 'enabled' : 'disabled'}`}>
                                <span className='icon'>{trader.followSignals ? '✅' : '❌'}</span>
                                <span className='label'>Follow Signals</span>
                            </div>
                            <div className={`preference-item ${trader.followBots ? 'enabled' : 'disabled'}`}>
                                <span className='icon'>{trader.followBots ? '✅' : '❌'}</span>
                                <span className='label'>Follow Bots</span>
                            </div>
                            <div className={`preference-item ${trader.followManualTrades ? 'enabled' : 'disabled'}`}>
                                <span className='icon'>{trader.followManualTrades ? '✅' : '❌'}</span>
                                <span className='label'>Follow Manual</span>
                            </div>
                        </div>
                    </div>

                    {/* Performance Stats */}
                    {stats && (
                        <div className='detail-section'>
                            <h4>📊 Performance</h4>
                            <div className='detail-grid'>
                                <div className='detail-item'>
                                    <span className='label'>Total Trades:</span>
                                    <span className='value'>{stats.totalTrades}</span>
                                </div>
                                <div className='detail-item'>
                                    <span className='label'>Win Rate:</span>
                                    <span className='value'>{stats.winRate.toFixed(1)}%</span>
                                </div>
                                <div className='detail-item'>
                                    <span className='label'>Total Profit:</span>
                                    <span className={`value ${stats.totalProfit >= 0 ? 'positive' : 'negative'}`}>
                                        ${stats.totalProfit.toFixed(2)}
                                    </span>
                                </div>
                                <div className='detail-item'>
                                    <span className='label'>Average Stake:</span>
                                    <span className='value'>${stats.averageStake.toFixed(2)}</span>
                                </div>
                                <div className='detail-item'>
                                    <span className='label'>Last Trade:</span>
                                    <span className='value'>{formatLastActivity(stats.lastTradeTime)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Allowed Markets & Contract Types */}
                    {(trader.allowedMarkets.length > 0 || trader.allowedContractTypes.length > 0) && (
                        <div className='detail-section'>
                            <h4>🎯 Restrictions</h4>
                            {trader.allowedMarkets.length > 0 && (
                                <div className='restriction-group'>
                                    <span className='restriction-label'>Allowed Markets:</span>
                                    <div className='restriction-tags'>
                                        {trader.allowedMarkets.map(market => (
                                            <span key={market} className='restriction-tag'>
                                                {market}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {trader.allowedContractTypes.length > 0 && (
                                <div className='restriction-group'>
                                    <span className='restriction-label'>Allowed Contract Types:</span>
                                    <div className='restriction-tags'>
                                        {trader.allowedContractTypes.map(type => (
                                            <span key={type} className='restriction-tag'>
                                                {type}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className='detail-actions'>
                        <button className='remove-btn' onClick={onRemove}>
                            🗑️ Remove Trader
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
