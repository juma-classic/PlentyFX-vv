import React, { useEffect, useState } from 'react';
import { copyTradingService } from '@/services/copy-trading.service';
import type { CopyTrader, CopyTradingNotification, CopyTradingStats } from '@/types/copy-trading.types';
import { AddCopyTraderModal } from './AddCopyTraderModal';
import { CopyTraderCard } from './CopyTraderCard';
import { CopyTradingSettings } from './CopyTradingSettings';
import { CopyTradingStats as StatsComponent } from './CopyTradingStats';
import './CopyTradingDashboard.scss';

// Professional SVG Icons
const DashboardIcon = () => '📋';

const UsersIcon = () => (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path
            d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <circle cx='9' cy='7' r='4' stroke='currentColor' strokeWidth='2' fill='none' />
        <path
            d='M22 21v-2a4 4 0 0 0-3-3.87'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <path
            d='M16 3.13a4 4 0 0 1 0 7.75'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <circle cx='9' cy='7' r='1.5' fill='#28a745' />
        <circle cx='18' cy='6' r='1' fill='#28a745' />
    </svg>
);

const StatsIcon = () => (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M3 3v18h18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
        <path
            d='M7 14l3-3 3 3 5-7'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <circle cx='7' cy='14' r='1.5' fill='#007bff' />
        <circle cx='10' cy='11' r='1.5' fill='#007bff' />
        <circle cx='13' cy='14' r='1.5' fill='#007bff' />
        <circle cx='18' cy='7' r='1.5' fill='#007bff' />
    </svg>
);

const NotificationIcon = () => (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path
            d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <path
            d='M13.73 21a2 2 0 0 1-3.46 0'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <circle cx='18' cy='6' r='3' fill='#dc3545' />
    </svg>
);

const UserAddIcon = () => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path
            d='M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <circle cx='8.5' cy='7' r='4' stroke='currentColor' strokeWidth='2' fill='none' />
        <line x1='20' y1='8' x2='20' y2='14' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
        <line x1='17' y1='11' x2='23' y2='11' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
    </svg>
);

const SettingsIcon = () => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <circle cx='12' cy='12' r='3' stroke='currentColor' strokeWidth='2' fill='none' />
        <path
            d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

export const CopyTradingDashboard: React.FC = () => {
    const [copyTraders, setCopyTraders] = useState<CopyTrader[]>([]);
    const [stats, setStats] = useState<CopyTradingStats | null>(null);
    const [notifications, setNotifications] = useState<CopyTradingNotification[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'traders' | 'stats' | 'notifications' | 'settings'>('traders');

    // Initialize copy trading service
    useEffect(() => {
        const initializeService = async () => {
            try {
                await copyTradingService.initialize();
                loadData();
            } catch (error) {
                console.error('Failed to initialize copy trading service:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeService();
    }, []);

    // Load data from service
    const loadData = () => {
        setCopyTraders(copyTradingService.getCopyTraders());
        setStats(copyTradingService.getStats());
        setNotifications(copyTradingService.getNotifications());
    };

    // Refresh data periodically
    useEffect(() => {
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAddTrader = () => {
        setShowAddModal(true);
    };

    const handleTraderAdded = () => {
        loadData();
        setShowAddModal(false);
    };

    const handleRemoveTrader = (traderId: string) => {
        if (window.confirm('Are you sure you want to remove this copy trader?')) {
            copyTradingService.removeCopyTrader(traderId);
            loadData();
        }
    };

    const handleToggleTrader = (traderId: string, isActive: boolean) => {
        copyTradingService.updateCopyTrader(traderId, { isActive });
        loadData();
    };

    if (isLoading) {
        return (
            <div className='copy-trading-dashboard loading'>
                <div className='loading-spinner'>
                    <span>🔄</span>
                    <p>Initializing Copy Trading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='copy-trading-dashboard'>
            {/* Header */}
            <div className='dashboard-header'>
                <div className='header-content'>
                    <h1>
                        <DashboardIcon /> Copy Trading Dashboard
                    </h1>
                    <p>Manage copy traders and monitor trade executions</p>
                </div>
                <div className='header-actions'>
                    <button className='btn btn-primary' onClick={handleAddTrader}>
                        <UserAddIcon /> Add Copy Trader
                    </button>
                    <button className='btn btn-secondary' onClick={() => setShowSettings(true)}>
                        <SettingsIcon /> Settings
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            {stats && (
                <div className='quick-stats'>
                    <div className='stat-card'>
                        <div className='stat-icon'>
                            <UsersIcon />
                        </div>
                        <div className='stat-content'>
                            <div className='stat-value'>{stats.totalCopyTraders}</div>
                            <div className='stat-label'>Total Traders</div>
                        </div>
                    </div>
                    <div className='stat-card'>
                        <div className='stat-icon'>
                            <UsersIcon />
                        </div>
                        <div className='stat-content'>
                            <div className='stat-value'>{stats.activeCopyTraders}</div>
                            <div className='stat-label'>Active Traders</div>
                        </div>
                    </div>
                    <div className='stat-card'>
                        <div className='stat-icon'>
                            <StatsIcon />
                        </div>
                        <div className='stat-content'>
                            <div className='stat-value'>{stats.totalCopyTrades}</div>
                            <div className='stat-label'>Total Trades</div>
                        </div>
                    </div>
                    <div className='stat-card'>
                        <div className='stat-icon'>
                            <StatsIcon />
                        </div>
                        <div className='stat-content'>
                            <div className='stat-value'>${stats.totalCopyProfit.toFixed(2)}</div>
                            <div className='stat-label'>Total Profit</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className='dashboard-tabs'>
                <button
                    className={`tab ${activeTab === 'traders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('traders')}
                >
                    <UsersIcon /> Copy Traders ({copyTraders.length})
                </button>
                <button
                    className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stats')}
                >
                    <StatsIcon /> Statistics
                </button>
                <button
                    className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notifications')}
                >
                    <NotificationIcon /> Notifications ({notifications.filter(n => !n.isRead).length})
                </button>
            </div>

            {/* Tab Content */}
            <div className='tab-content'>
                {activeTab === 'traders' && (
                    <div className='traders-tab'>
                        {copyTraders.length === 0 ? (
                            <div className='empty-state'>
                                <div className='empty-icon'>
                                    <UsersIcon />
                                </div>
                                <h3>No Copy Traders Yet</h3>
                                <p>Add copy traders to start replicating your trades automatically</p>
                                <button className='btn btn-primary' onClick={handleAddTrader}>
                                    <UserAddIcon /> Add Your First Copy Trader
                                </button>
                            </div>
                        ) : (
                            <div className='traders-grid'>
                                {copyTraders.map(trader => (
                                    <CopyTraderCard
                                        key={trader.id}
                                        trader={trader}
                                        stats={stats?.traderStats[trader.id]}
                                        onRemove={() => handleRemoveTrader(trader.id)}
                                        onToggle={isActive => handleToggleTrader(trader.id, isActive)}
                                        onEdit={updates => {
                                            copyTradingService.updateCopyTrader(trader.id, updates);
                                            loadData();
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'stats' && stats && <StatsComponent stats={stats} />}

                {activeTab === 'notifications' && (
                    <div className='notifications-tab'>
                        {notifications.length === 0 ? (
                            <div className='empty-state'>
                                <div className='empty-icon'>
                                    <NotificationIcon />
                                </div>
                                <h3>No Notifications</h3>
                                <p>Copy trading notifications will appear here</p>
                            </div>
                        ) : (
                            <div className='notifications-list'>
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`notification-item ${notification.severity.toLowerCase()} ${notification.isRead ? 'read' : 'unread'}`}
                                    >
                                        <div className='notification-icon'>
                                            {notification.type === 'NEW_TRADER' && '👤'}
                                            {notification.type === 'TRADE_EXECUTED' && '🚀'}
                                            {notification.type === 'TRADE_RESULT' && '📊'}
                                            {notification.type === 'ERROR' && '❌'}
                                            {notification.type === 'RISK_WARNING' && '⚠️'}
                                        </div>
                                        <div className='notification-content'>
                                            <div className='notification-title'>{notification.title}</div>
                                            <div className='notification-message'>{notification.message}</div>
                                            <div className='notification-time'>
                                                {new Date(notification.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showAddModal && (
                <AddCopyTraderModal onClose={() => setShowAddModal(false)} onTraderAdded={handleTraderAdded} />
            )}

            {showSettings && (
                <CopyTradingSettings onClose={() => setShowSettings(false)} onSettingsUpdated={loadData} />
            )}
        </div>
    );
};
