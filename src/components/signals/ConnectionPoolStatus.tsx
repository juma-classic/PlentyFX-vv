/**
 * Connection Pool Status Component
 * Shows the status and distribution of multiple App IDs
 */

import React, { useState, useEffect } from 'react';
import { derivConnectionPool } from '@/services/deriv-connection-pool.service';
import './ConnectionPoolStatus.scss';

interface ConnectionPoolStatusProps {
    compact?: boolean;
}

export const ConnectionPoolStatus: React.FC<ConnectionPoolStatusProps> = ({ compact = false }) => {
    const [poolStats, setPoolStats] = useState<any>(null);
    const [healthStatus, setHealthStatus] = useState<any>(null);
    const [isExpanded, setIsExpanded] = useState(!compact);

    useEffect(() => {
        const updateStats = () => {
            setPoolStats(derivConnectionPool.getConnectionStats());
            setHealthStatus(derivConnectionPool.getHealthStatus());
        };

        // Initial update
        updateStats();

        // Update every 2 seconds
        const interval = setInterval(updateStats, 2000);

        return () => clearInterval(interval);
    }, []);

    if (!poolStats || !healthStatus) {
        return (
            <div className='connection-pool-status loading'>
                <div className='loading-spinner'></div>
                <span>Loading connection pool...</span>
            </div>
        );
    }

    const getConnectionIcon = (type: string) => {
        switch (type) {
            case 'core':
                return '🏛️';
            case 'analysis':
                return '📊';
            case 'signals':
                return '📡';
            case 'fastlane':
                return '⚡';
            default:
                return '🔗';
        }
    };

    const getLoadColor = (percentage: number) => {
        if (percentage < 50) return 'low';
        if (percentage < 80) return 'medium';
        return 'high';
    };

    if (compact) {
        return (
            <div className='connection-pool-status compact'>
                <div className='compact-header' onClick={() => setIsExpanded(!isExpanded)}>
                    <div className='status-summary'>
                        <span className='pool-icon'>🔗</span>
                        <span className='connection-count'>
                            {healthStatus.activeConnections}/{healthStatus.totalConnections}
                        </span>
                        <span className='subscription-count'>{healthStatus.totalSubscriptions} subs</span>
                    </div>
                    <button className='expand-button'>{isExpanded ? '▲' : '▼'}</button>
                </div>

                {isExpanded && (
                    <div className='compact-details'>
                        {Object.entries(poolStats).map(([type, stats]: [string, any]) => (
                            <div key={type} className='compact-connection'>
                                <span className='connection-icon'>{getConnectionIcon(type)}</span>
                                <span className='connection-type'>{type.toUpperCase()}</span>
                                <span className='app-id'>{stats.appId}</span>
                                <div className={`status-dot ${stats.isConnected ? 'connected' : 'disconnected'}`}></div>
                                <span className='load-info'>
                                    {stats.subscriptions}/{stats.maxSubscriptions}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className='connection-pool-status'>
            <div className='pool-header'>
                <h3>🔗 Connection Pool Status</h3>
                <div className='pool-summary'>
                    <span className='summary-item'>
                        <span className='label'>Active:</span>
                        <span className='value'>
                            {healthStatus.activeConnections}/{healthStatus.totalConnections}
                        </span>
                    </span>
                    <span className='summary-item'>
                        <span className='label'>Subscriptions:</span>
                        <span className='value'>{healthStatus.totalSubscriptions}</span>
                    </span>
                </div>
            </div>

            <div className='connections-grid'>
                {Object.entries(poolStats).map(([type, stats]: [string, any]) => (
                    <div key={type} className={`connection-card ${stats.isConnected ? 'connected' : 'disconnected'}`}>
                        <div className='card-header'>
                            <div className='connection-info'>
                                <span className='connection-icon'>{getConnectionIcon(type)}</span>
                                <div className='connection-details'>
                                    <span className='connection-type'>{type.toUpperCase()}</span>
                                    <span className='app-id'>App ID: {stats.appId}</span>
                                </div>
                            </div>
                            <div className={`status-indicator ${stats.isConnected ? 'connected' : 'disconnected'}`}>
                                <span className='status-dot'></span>
                                <span className='status-text'>{stats.isConnected ? 'Connected' : 'Disconnected'}</span>
                            </div>
                        </div>

                        <div className='card-content'>
                            <div className='description'>{stats.description}</div>

                            <div className='load-info'>
                                <div className='load-header'>
                                    <span>
                                        Load: {stats.subscriptions}/{stats.maxSubscriptions}
                                    </span>
                                    <span className={`load-percentage ${getLoadColor(stats.loadPercentage)}`}>
                                        {stats.loadPercentage}%
                                    </span>
                                </div>
                                <div className='load-bar'>
                                    <div
                                        className={`load-fill ${getLoadColor(stats.loadPercentage)}`}
                                        style={{ width: `${stats.loadPercentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className='features-list'>
                                <span className='features-label'>Features:</span>
                                <div className='features'>
                                    {stats.features.map((feature: string, index: number) => (
                                        <span key={index} className='feature-tag'>
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {stats.connectionStats && (
                                <div className='connection-stats'>
                                    <div className='stat-item'>
                                        <span className='stat-label'>Retries:</span>
                                        <span className='stat-value'>{stats.connectionStats.retryCount}</span>
                                    </div>
                                    {stats.connectionStats.lastPingTime > 0 && (
                                        <div className='stat-item'>
                                            <span className='stat-label'>Last Ping:</span>
                                            <span className='stat-value'>
                                                {Math.round((Date.now() - stats.connectionStats.lastPingTime) / 1000)}s
                                                ago
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className='pool-actions'>
                <button className='reconnect-button' onClick={() => derivConnectionPool.forceReconnectAll()}>
                    🔄 Reconnect
                </button>
                <button
                    className='settings-button'
                    onClick={() => {
                        // TODO: Implement settings functionality
                        console.log('Settings button clicked');
                    }}
                >
                    ⚙️ Settings
                </button>
            </div>
        </div>
    );
};
