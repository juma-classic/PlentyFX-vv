import React, { useState } from 'react';
import { SpeedModeConfig, SpeedModeSettings } from '@/components/speed-mode/SpeedModeConfig';
import { SpeedTradingEngine } from '@/components/speed-mode/SpeedTradingEngine';
import { TokenSetup } from '@/components/speed-mode/TokenSetup';
// import { TransactionsPanel } from '@/components/speed-mode/TransactionsPanel';
import { derivAPI, TradeResult } from '@/utils/deriv-trading-api';
import './speed-mode.scss';

// interface Transaction {
//     id: string;
//     type: string;
//     entrySpot: number;
//     exitSpot: number;
//     buyPrice: number;
//     profit: number;
//     timestamp: number;
//     outcome: 'win' | 'loss';
// }

const SpeedMode: React.FC = () => {
    const [hasToken, setHasToken] = useState(() => !!derivAPI.getAuthToken());
    const [showTokenSetup, setShowTokenSetup] = useState(!hasToken);
    const [showConfig, setShowConfig] = useState(true);
    const [accountBalance, setAccountBalance] = useState(10000);
    // const [isTrading, setIsTrading] = useState(false);
    // const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [settings, setSettings] = useState<SpeedModeSettings>({
        market: 'R_50',
        strategy: 'momentum',
        tradeType: 'DIGITEVEN',
        stake: 1,
        targetRuns: 10,
        stopLoss: 50,
        takeProfit: 100,
        duration: 1,
        durationType: 't',
    });

    React.useEffect(() => {
        // Get account balance when component mounts
        const fetchBalance = async () => {
            if (!hasToken) return;

            try {
                await derivAPI.connect();
                const accountInfo = await derivAPI.authorize();
                setAccountBalance(accountInfo.balance);
                console.log('✅ Account balance fetched:', accountInfo.balance);
            } catch (error) {
                console.error('Failed to fetch balance:', error);
            }
        };

        fetchBalance();
    }, [hasToken]);

    const handleTokenSet = (token: string, appId?: string) => {
        derivAPI.setAuthToken(token, appId);
        setHasToken(true);
        setShowTokenSetup(false);
        console.log('✅ Token set successfully');
        if (appId) {
            console.log(`✅ Using custom App ID: ${appId}`);
        }
    };

    const handleTradeExecuted = (result: TradeResult) => {
        // Update balance after trade
        if (result.success && result.profit !== undefined) {
            setAccountBalance(prev => prev + (result.profit || 0));
        }

        // Show notification
        if (result.success) {
            const profit = result.profit || 0;
            const message = profit > 0 ? `✅ Won $${profit.toFixed(2)}` : `❌ Lost $${Math.abs(profit).toFixed(2)}`;
            showNotification(message, profit > 0 ? 'success' : 'error');
        }
    };

    const showNotification = (message: string, type: 'success' | 'error') => {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `speed-mode-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)'};
            color: white;
            border-radius: 12px;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };

    return (
        <div className='speed-mode-page'>
            <div className='speed-mode-header'>
                <h1 className='page-title'>
                    <span className='title-icon'>⚡</span>
                    Speed Mode Trading
                    <span className='beta-badge'>BETA</span>
                </h1>
                <p className='page-description'>
                    High-frequency automated trading on every tick. Execute trades in 1-2 seconds with advanced
                    strategies.
                </p>
            </div>

            {!hasToken || showTokenSetup ? (
                <div className='token-setup-container'>
                    <TokenSetup onTokenSet={handleTokenSet} onCancel={() => setShowTokenSetup(false)} />
                </div>
            ) : (
                <div className='speed-mode-content'>
                    <div className='controls-bar'>
                        <button className='config-toggle-btn' onClick={() => setShowConfig(!showConfig)}>
                            {showConfig ? '📊 Hide Config' : '⚙️ Show Config'}
                        </button>
                        <button className='token-manage-btn' onClick={() => setShowTokenSetup(true)}>
                            🔑 Change Token
                        </button>
                    </div>

                    {showConfig && (
                        <div className='config-section'>
                            <SpeedModeConfig
                                settings={settings}
                                onSettingsChange={setSettings}
                                accountBalance={accountBalance}
                            />
                        </div>
                    )}

                    <div className='trading-section'>
                        <SpeedTradingEngine
                            market={settings.market}
                            strategy={settings.strategy}
                            tradeType={settings.tradeType}
                            stake={settings.stake}
                            targetRuns={settings.targetRuns}
                            duration={settings.duration}
                            durationType={settings.durationType}
                            stopLoss={settings.stopLoss}
                            takeProfit={settings.takeProfit}
                            barrier={settings.barrier}
                            onStop={() => console.log('Trading stopped')}
                            onTradeExecuted={handleTradeExecuted}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpeedMode;
