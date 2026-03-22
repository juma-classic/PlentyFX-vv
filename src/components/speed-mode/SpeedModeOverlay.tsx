import React from 'react';
import './SpeedModeOverlay.scss';

/**
 * SpeedModeOverlay - DISABLED
 *
 * Speed Mode has been moved to a dedicated page.
 * Navigate to the "Speed Mode" tab in the main navigation to use Speed Mode.
 *
 * This component is kept for backwards compatibility but returns null.
 */
export const SpeedModeOverlay: React.FC = () => {
    // Speed Mode is now a dedicated page - this overlay is disabled
    // Navigate to the Speed Mode tab to use Speed Mode
    return null;

    /* DISABLED - Speed Mode moved to dedicated page
    const [isSpeedMode, setIsSpeedMode] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [showConfig, setShowConfig] = useState(true);
    const [showTokenSetup, setShowTokenSetup] = useState(false);
    const [hasToken, setHasToken] = useState(false);
    const [accountBalance, setAccountBalance] = useState(10000);
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

    useEffect(() => {
        // Check if we're on the Bot Builder tab
        const checkBotBuilder = () => {
            const botBuilderTab = document.getElementById('id-bot-builder');
            setIsVisible(!!botBuilderTab);
        };

        checkBotBuilder();

        // Listen for tab changes
        const interval = setInterval(checkBotBuilder, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Check if token is available
        const checkToken = () => {
            const token = derivAPI.getAuthToken();
            setHasToken(!!token);
            if (!token) {
                console.warn('⚠️ No API token found. User needs to set one manually.');
            }
        };

        checkToken();
    }, []);

    useEffect(() => {
        // Get account balance when component mounts and token is available
        const fetchBalance = async () => {
            if (!hasToken) {
                return;
            }

            try {
                await derivAPI.connect();
                const accountInfo = await derivAPI.authorize();
                setAccountBalance(accountInfo.balance);
                console.log('✅ Account balance fetched:', accountInfo.balance);
            } catch (error) {
                console.error('Failed to fetch balance:', error);
                // If authorization fails, might need new token
                if (error instanceof Error && error.message.includes('token')) {
                    setHasToken(false);
                    setShowTokenSetup(true);
                }
            }
        };

        if (isVisible && hasToken) {
            fetchBalance();
        }
    }, [isVisible, hasToken]);

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

    if (!isVisible) {
        return null;
    }

    return (
        <div className='speed-mode-overlay'>
            <div className='speed-mode-container'>
                <SpeedModeToggle isSpeedMode={isSpeedMode} onToggle={setIsSpeedMode} disabled={!hasToken} />

                {isSpeedMode && (
                    <div className='speed-mode-panel'>
                        {!hasToken || showTokenSetup ? (
                            <TokenSetup onTokenSet={handleTokenSet} onCancel={() => setShowTokenSetup(false)} />
                        ) : (
                            <>
                                <div className='panel-header'>
                                    <button className='config-toggle-btn' onClick={() => setShowConfig(!showConfig)}>
                                        {showConfig ? '📊 Hide Config' : '⚙️ Show Config'}
                                    </button>
                                    <button className='token-manage-btn' onClick={() => setShowTokenSetup(true)}>
                                        🔑 Change Token
                                    </button>
                                </div>

                                {showConfig && (
                                    <SpeedModeConfig settings={settings} onSettingsChange={setSettings} accountBalance={accountBalance} />
                                )}

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
                                    onStop={() => setIsSpeedMode(false)}
                                    onTradeExecuted={handleTradeExecuted}
                                />
                            </>
                        )}
                    </div>
                )}

                {!hasToken && !isSpeedMode && (
                    <div className='token-warning'>
                        <span className='warning-icon'>⚠️</span>
                        <span className='warning-text'>API token required. Enable Speed Mode to set up.</span>
                    </div>
                )}
            </div>
        </div>
    );
    */
};
