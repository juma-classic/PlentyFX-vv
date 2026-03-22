import React, { useEffect, useState } from 'react';
import { TickSpeedTradingWidget } from '@/components/widgets/TickSpeedTradingWidget';
import { RealWorldTickSpeedIntegrationService } from '@/services/tick-speed-integration.service';
import './tick-speed-trading.scss';

interface TradingStatus {
    isActive: boolean;
    isConnected: boolean;
    mode: 'demo' | 'real';
    balance: number;
    dailyPnL: number;
    totalPnL: number;
    activeTrades: number;
    winRate: number;
    riskStatus: string;
    tradesExecuted: number;
    consecutiveLosses: number;
}

import React, { useEffect, useState } from 'react';
import { TickSpeedTradingWidget } from '@/components/widgets/TickSpeedTradingWidget';
import { RealWorldTickSpeedIntegrationService } from '@/services/tick-speed-integration.service';
import './tick-speed-trading.scss';

interface TradingStatus {
    isActive: boolean;
    isConnected: boolean;
    mode: 'demo' | 'real';
    balance: number;
    dailyPnL: number;
    totalPnL: number;
    activeTrades: number;
    winRate: number;
    riskStatus: string;
    tradesExecuted: number;
    consecutiveLosses: number;
}

export const TickSpeedTradingPage: React.FC = () => {
    const [status, setStatus] = useState<TradingStatus | null>(null);
    const [isRealMode, setIsRealMode] = useState(false);
    const [apiToken, setApiToken] = useState('');
    const [showRiskWarning, setShowRiskWarning] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState('widget');
    const integrationService = RealWorldTickSpeedIntegrationService.getInstance();

    useEffect(() => {
        // Subscribe to status updates
        integrationService.on('STATUS_UPDATE', setStatus);
        integrationService.on('TRADE_EXECUTED', handleTradeExecuted);
        integrationService.on('RISK_LIMIT_REACHED', handleRiskLimit);

        return () => {
            integrationService.off('STATUS_UPDATE', setStatus);
            integrationService.off('TRADE_EXECUTED', handleTradeExecuted);
            integrationService.off('RISK_LIMIT_REACHED', handleRiskLimit);
        };
    }, []);

    const handleTradeExecuted = (trade: any) => {
        console.log('Trade executed:', trade);

        // Show notification for real trades
        if (trade.mode === 'real') {
            const notification = new Notification('Real Trade Executed', {
                body: `${trade.type} ${trade.prediction} - Stake: ${trade.stake}`,
                icon: '/favicon-pink.svg',
            });

            setTimeout(() => notification.close(), 5000);
        }
    };

    const handleConnectionChange = (connected: boolean) => {
        console.log('Connection status changed:', connected);

        if (connected && isRealMode) {
            setShowRiskWarning(true);
        }
    };

    const handleRiskLimit = (data: any) => {
        alert(`⚠️ RISK LIMIT REACHED: ${data.reason}\n\nTrading has been automatically stopped for your safety.`);
    };

    const handleModeChange = (mode: 'demo' | 'real') => {
        setIsRealMode(mode === 'real');

        if (mode === 'real') {
            const confirmed = confirm(
                '⚠️ WARNING: Real Money Trading Mode\n\n' +
                    'You are switching to REAL MONEY trading mode.\n' +
                    'This will use your actual Deriv account balance.\n' +
                    'You can lose real money.\n\n' +
                    'Built-in safety features:\n' +
                    '• Daily loss limits\n' +
                    '• Maximum stake limits\n' +
                    '• Consecutive loss protection\n' +
                    '• Emergency stop functionality\n\n' +
                    'Are you sure you want to continue?'
            );

            if (!confirmed) {
                setIsRealMode(false);
                return;
            }

            // Request notification permission
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    };

    const handleEmergencyStop = async () => {
        const confirmed = confirm(
            '🚨 EMERGENCY STOP\n\n' + 'This will immediately halt all trading activity.\n' + 'Are you sure?'
        );

        if (confirmed) {
            try {
                await integrationService.emergencyStop();
                alert('✅ Emergency stop completed successfully.');
            } catch (error) {
                alert(`❌ Emergency stop failed: ${error.message}`);
            }
        }
    };

    const renderSubTabContent = () => {
        switch (activeSubTab) {
            case 'widget':
                return (
                    <TickSpeedTradingWidget
                        onTradeExecuted={handleTradeExecuted}
                        onConnectionChange={handleConnectionChange}
                        className='fullscreen'
                        mode={isRealMode ? 'real' : 'demo'}
                        apiToken={apiToken}
                    />
                );
            case 'analytics':
                return (
                    <div className='analytics-panel'>
                        <h2>📊 Trading Analytics</h2>
                        <p>Advanced analytics and performance metrics coming soon...</p>
                        {status && (
                            <div className='analytics-grid'>
                                <div className='metric-card'>
                                    <h3>Performance Overview</h3>
                                    <div className='metrics'>
                                        <div className='metric'>
                                            <span>Win Rate:</span>
                                            <span className='value'>{status.winRate.toFixed(1)}%</span>
                                        </div>
                                        <div className='metric'>
                                            <span>Total Trades:</span>
                                            <span className='value'>{status.tradesExecuted}</span>
                                        </div>
                                        <div className='metric'>
                                            <span>Active Trades:</span>
                                            <span className='value'>{status.activeTrades}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'settings':
                return (
                    <div className='settings-panel'>
                        <h2>⚙️ Trading Settings</h2>
                        <div className='settings-grid'>
                            <div className='setting-group'>
                                <h3>Risk Management</h3>
                                <div className='setting-item'>
                                    <label>Max Daily Loss:</label>
                                    <input type='number' defaultValue='500' />
                                </div>
                                <div className='setting-item'>
                                    <label>Max Stake:</label>
                                    <input type='number' defaultValue='100' />
                                </div>
                                <div className='setting-item'>
                                    <label>Max Consecutive Losses:</label>
                                    <input type='number' defaultValue='5' />
                                </div>
                            </div>
                            <div className='setting-group'>
                                <h3>Trading Parameters</h3>
                                <div className='setting-item'>
                                    <label>Default Strategy:</label>
                                    <select>
                                        <option value='storm_shadow'>Storm Shadow</option>
                                        <option value='digit_hunter'>Digit Hunter</option>
                                        <option value='pattern_master'>Pattern Master</option>
                                    </select>
                                </div>
                                <div className='setting-item'>
                                    <label>Auto-restart on Loss:</label>
                                    <input type='checkbox' />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'history':
                return (
                    <div className='history-panel'>
                        <h2>📈 Trading History</h2>
                        <p>Detailed trading history and logs coming soon...</p>
                        <div className='history-placeholder'>
                            <div className='history-item'>
                                <span className='time'>12:34:56</span>
                                <span className='action'>Trade Executed</span>
                                <span className='result win'>+$2.50</span>
                            </div>
                            <div className='history-item'>
                                <span className='time'>12:33:45</span>
                                <span className='action'>Bot Started</span>
                                <span className='result'>-</span>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className='tick-speed-trading-page'>
            <div className='page-header'>
                <h1>⚡ Tick Speed Trading</h1>
                <p>Production-ready tick-level trading system with real API integration</p>

                {/* Real-world controls */}
                <div className='real-world-controls'>
                    <div className='mode-selector'>
                        <label>
                            <input
                                type='radio'
                                name='mode'
                                value='demo'
                                checked={!isRealMode}
                                onChange={() => handleModeChange('demo')}
                            />
                            🎮 Demo Mode (Safe)
                        </label>
                        <label>
                            <input
                                type='radio'
                                name='mode'
                                value='real'
                                checked={isRealMode}
                                onChange={() => handleModeChange('real')}
                            />
                            💰 Real Money Mode
                        </label>
                    </div>

                    {isRealMode && (
                        <div className='api-token-input'>
                            <input
                                type='password'
                                placeholder='Enter your Deriv API token'
                                value={apiToken}
                                onChange={e => setApiToken(e.target.value)}
                                className='api-token-field'
                            />
                            <small>
                                Get your API token from{' '}
                                <a
                                    href='https://app.deriv.com/account/api-token'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    Deriv API Token page
                                </a>
                            </small>
                        </div>
                    )}

                    <button
                        className='emergency-stop-btn'
                        onClick={handleEmergencyStop}
                        title='Emergency Stop - Immediately halt all trading'
                    >
                        🚨 Emergency Stop
                    </button>
                </div>
            </div>

            {/* Status Dashboard */}
            {status && (
                <div className='status-dashboard'>
                    <div className='status-card'>
                        <h3>Trading Status</h3>
                        <div className='status-grid'>
                            <div className='status-item'>
                                <span>Mode:</span>
                                <span className={`mode-badge ${status.mode}`}>
                                    {status.mode === 'real' ? '💰 REAL' : '🎮 DEMO'}
                                </span>
                            </div>
                            <div className='status-item'>
                                <span>Status:</span>
                                <span className={`status-badge ${status.isActive ? 'active' : 'inactive'}`}>
                                    {status.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                            <div className='status-item'>
                                <span>Connection:</span>
                                <span
                                    className={`connection-badge ${status.isConnected ? 'connected' : 'disconnected'}`}
                                >
                                    {status.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                                </span>
                            </div>
                            <div className='status-item'>
                                <span>Risk Status:</span>
                                <span className='risk-status'>{status.riskStatus}</span>
                            </div>
                        </div>
                    </div>

                    <div className='status-card'>
                        <h3>Performance</h3>
                        <div className='performance-grid'>
                            <div className='perf-item'>
                                <span>Balance:</span>
                                <span className='balance'>${status.balance.toFixed(2)}</span>
                            </div>
                            <div className='perf-item'>
                                <span>Daily P&L:</span>
                                <span className={`pnl ${status.dailyPnL >= 0 ? 'profit' : 'loss'}`}>
                                    ${status.dailyPnL.toFixed(2)}
                                </span>
                            </div>
                            <div className='perf-item'>
                                <span>Total P&L:</span>
                                <span className={`pnl ${status.totalPnL >= 0 ? 'profit' : 'loss'}`}>
                                    ${status.totalPnL.toFixed(2)}
                                </span>
                            </div>
                            <div className='perf-item'>
                                <span>Win Rate:</span>
                                <span className='win-rate'>{status.winRate.toFixed(1)}%</span>
                            </div>
                            <div className='perf-item'>
                                <span>Trades:</span>
                                <span className='trades'>{status.tradesExecuted}</span>
                            </div>
                            <div className='perf-item'>
                                <span>Active:</span>
                                <span className='active-trades'>{status.activeTrades}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Second Navigation Menu */}
            <div className='tick-speed-sub-navigation'>
                <div className='sub-nav-container'>
                    <button
                        className={`sub-nav-btn ${activeSubTab === 'widget' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('widget')}
                    >
                        <span className='sub-nav-icon'>⚡</span>
                        <span className='sub-nav-text'>Trading Widget</span>
                    </button>
                    <button
                        className={`sub-nav-btn ${activeSubTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('analytics')}
                    >
                        <span className='sub-nav-icon'>📊</span>
                        <span className='sub-nav-text'>Analytics</span>
                    </button>
                    <button
                        className={`sub-nav-btn ${activeSubTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('settings')}
                    >
                        <span className='sub-nav-icon'>⚙️</span>
                        <span className='sub-nav-text'>Settings</span>
                    </button>
                    <button
                        className={`sub-nav-btn ${activeSubTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('history')}
                    >
                        <span className='sub-nav-icon'>📈</span>
                        <span className='sub-nav-text'>History</span>
                    </button>
                </div>
            </div>

            {/* Risk Warning Modal */}
            {showRiskWarning && isRealMode && (
                <div className='risk-warning-modal'>
                    <div className='modal-content'>
                        <h2>⚠️ REAL MONEY TRADING ACTIVE</h2>
                        <p>
                            You are now connected to your real Deriv account. All trades will use real money and can
                            result in real losses.
                        </p>
                        <div className='safety-features'>
                            <h3>Active Safety Features:</h3>
                            <ul>
                                <li>✅ Daily loss limits</li>
                                <li>✅ Maximum stake protection</li>
                                <li>✅ Consecutive loss monitoring</li>
                                <li>✅ Emergency stop functionality</li>
                                <li>✅ Real-time risk assessment</li>
                            </ul>
                        </div>
                        <button className='acknowledge-btn' onClick={() => setShowRiskWarning(false)}>
                            I Understand the Risks
                        </button>
                    </div>
                </div>
            )}

            <div className='page-content'>{renderSubTabContent()}</div>
        </div>
    );
};

export default TickSpeedTradingPage;
