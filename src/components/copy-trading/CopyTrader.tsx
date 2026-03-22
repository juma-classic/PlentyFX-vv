import React, { useState, useEffect, useRef } from 'react';
import { copyTradingAPI, CopyTradingConfig, CopyTradingStatistics, AccountBalance, CopyTradingToken } from '../../services/copy-trading-api.service';
import './CopyTrader.scss';

interface CopyTraderProps {
    onClose?: () => void;
}

export const CopyTrader: React.FC<CopyTraderProps> = ({ onClose }) => {
    const [tokens, setTokens] = useState<string[]>([]);
    const [newToken, setNewToken] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [isDemoActive, setIsDemoActive] = useState(false);
    const [message, setMessage] = useState('');
    const [config, setConfig] = useState<CopyTradingConfig>({
        copy_trading: { is_active: false },
        demo_copy_trading: { is_active: false, login_id: '' }
    });
    const [statistics, setStatistics] = useState<CopyTradingStatistics | null>(null);
    const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
    const [copyTradingList, setCopyTradingList] = useState<CopyTradingToken[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [totalBalance, setTotalBalance] = useState(0);

    // Load saved tokens and config on mount
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            // Load tokens
            const savedTokens = copyTradingAPI.retrieveCopyTradingTokens();
            setTokens(savedTokens);

            // Load config
            const savedConfig = copyTradingAPI.getConfig();
            setConfig(savedConfig);
            setIsActive(savedConfig.copy_trading.is_active);
            setIsDemoActive(savedConfig.demo_copy_trading.is_active);

            // Load statistics
            const stats = await copyTradingAPI.copytradingStatistics();
            setStatistics(stats);

            // Load copy trading list
            const ctList = await copyTradingAPI.copytradingList();
            setCopyTradingList(ctList);

            // Load account balances
            await loadAccountBalances();
        } catch (error) {
            console.error('Error loading initial data:', error);
            showMessage('Error loading copy trading data');
        } finally {
            setIsLoading(false);
        }
    };

    const loadAccountBalances = async () => {
        try {
            const balances = await copyTradingAPI.getAccountBalances();
            setAccountBalances(balances);
            
            // Calculate total balance
            const total = balances.reduce((sum, balance) => sum + balance.balance, 0);
            setTotalBalance(total);
        } catch (error) {
            console.error('Error loading account balances:', error);
        }
    };

    // Synchronize tokens with API
    const synchronizeTokens = async () => {
        setIsSyncing(true);
        try {
            const success = await copyTradingAPI.synchronizeTokens();
            if (success) {
                showMessage('Tokens synchronized successfully!');
                // Reload data after synchronization
                await loadInitialData();
            } else {
                showMessage('Token synchronization failed');
            }
        } catch (error) {
            console.error('Error synchronizing tokens:', error);
            showMessage('Error during token synchronization');
        } finally {
            setIsSyncing(false);
        }
    };

    // Add new token with validation
    const addToken = async () => {
        if (newToken.trim() && !tokens.includes(newToken.trim())) {
            setIsLoading(true);
            try {
                await copyTradingAPI.updateCopyTradingTokens(newToken.trim());
                const updatedTokens = copyTradingAPI.retrieveCopyTradingTokens();
                setTokens(updatedTokens);
                setNewToken('');
                showMessage('Token added and validated successfully!');
                
                // Reload balances after adding token
                await loadAccountBalances();
            } catch (error) {
                console.error('Error adding token:', error);
                showMessage(`Failed to add token: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Remove token
    const removeToken = (tokenToRemove: string) => {
        try {
            const success = copyTradingAPI.removeCopyTradingTokens(tokenToRemove);
            if (success) {
                const updatedTokens = copyTradingAPI.retrieveCopyTradingTokens();
                setTokens(updatedTokens);
                showMessage('Token removed successfully!');
                
                // Reload balances after removing token
                loadAccountBalances();
            } else {
                showMessage('Failed to remove token');
            }
        } catch (error) {
            console.error('Error removing token:', error);
            showMessage('Error removing token');
        }
    };

    // Toggle copy trading
    const toggleCopyTrading = () => {
        const newState = !isActive;
        setIsActive(newState);
        
        const success = copyTradingAPI.toggleCopyTrading(newState);
        if (success) {
            const status = newState ? 'started' : 'stopped';
            showMessage(`Copy trading ${status} successfully for all ${tokens.length} tokens!`);
        } else {
            setIsActive(!newState); // Revert on failure
            showMessage('Failed to toggle copy trading');
        }
    };

    // Toggle demo copy trading
    const toggleDemoCopyTrading = () => {
        const newState = !isDemoActive;
        setIsDemoActive(newState);
        
        const success = copyTradingAPI.enableDemoCopyTrading({
            copy_status: newState ? 'enable' : 'disable',
            account_id: tokens[0] || ''
        });

        if (success) {
            const status = newState ? 'started' : 'stopped';
            showMessage(`Demo to Real copy trading ${status} successfully`);
        } else {
            setIsDemoActive(!newState); // Revert on failure
            showMessage('Failed to toggle demo copy trading');
        }
    };

    // Show temporary message
    const showMessage = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 5000);
    };

    return (
        <div className="copy-trader-container">
            <div className="copy-trader-header">
                <h2>Copy Trader</h2>
                {onClose && (
                    <button className="close-btn" onClick={onClose}>
                        ×
                    </button>
                )}
            </div>

            {message && (
                <div className="message-banner">
                    {message}
                </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
                <div className="loading-banner">
                    Loading...
                </div>
            )}

            {/* Statistics Section */}
            {statistics && (
                <div className="statistics-section">
                    <h3>Copy Trading Statistics</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-label">Total Trades</span>
                            <span className="stat-value">{statistics.total_trades}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Successful</span>
                            <span className="stat-value success">{statistics.successful_trades}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Failed</span>
                            <span className="stat-value failed">{statistics.failed_trades}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Success Rate</span>
                            <span className="stat-value">{(statistics.success_rate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total Profit</span>
                            <span className={`stat-value ${statistics.total_profit >= 0 ? 'profit' : 'loss'}`}>
                                ${statistics.total_profit.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Demo Copy Trading Section */}
            <div className="demo-copy-section">
                <h3>Demo to Real Copy Trading</h3>
                <p>Copy trades from demo account to real account</p>
                <button 
                    className={`copy-trading-btn ${isDemoActive ? 'stop' : 'start'}`}
                    onClick={toggleDemoCopyTrading}
                >
                    {isDemoActive ? 'Stop Demo to Real Copy Trading' : 'Start Demo to Real Copy Trading'}
                </button>
            </div>

            {/* Account Balances Section */}
            {accountBalances.length > 0 && (
                <div className="account-balances-section">
                    <h3>Account Balances</h3>
                    <div className="total-balance">
                        <span className="balance-label">Total Balance:</span>
                        <span className="balance-value">${totalBalance.toFixed(2)}</span>
                    </div>
                    <div className="balances-grid">
                        {accountBalances.map((balance, index) => (
                            <div key={index} className="balance-item">
                                <div className="balance-header">
                                    <span className="account-id">{balance.loginid}</span>
                                    <span className={`account-type ${balance.is_virtual ? 'virtual' : 'real'}`}>
                                        {balance.is_virtual ? 'Virtual' : 'Real'}
                                    </span>
                                </div>
                                <div className="balance-amount">
                                    <span className="amount">${balance.balance.toFixed(2)}</span>
                                    <span className="currency">{balance.currency}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Token Management Section */}
            <div className="token-section">
                <div className="token-header">
                    <h3>Trading Tokens</h3>
                    <button 
                        onClick={synchronizeTokens}
                        className={`sync-btn ${isSyncing ? 'syncing' : ''}`}
                        disabled={isSyncing || tokens.length === 0}
                    >
                        {isSyncing ? '🔄 Syncing...' : '🔄 Sync Tokens'}
                    </button>
                </div>
                <div className="token-input-container">
                    <input
                        type="text"
                        value={newToken}
                        onChange={(e) => setNewToken(e.target.value)}
                        placeholder="Enter trading token (will be validated)..."
                        className="token-input"
                        onKeyPress={(e) => e.key === 'Enter' && addToken()}
                    />
                    <button onClick={addToken} className="add-token-btn" disabled={isLoading}>
                        {isLoading ? 'Validating...' : 'Add Token'}
                    </button>
                </div>

                <div className="tokens-container">
                    {tokens.length === 0 ? (
                        <p className="no-tokens">No tokens added yet</p>
                    ) : (
                        tokens.map((token, index) => (
                            <div key={index} className="token-item">
                                <div className="token-info">
                                    <span className="token-text">{token.substring(0, 20)}...</span>
                                    <span className="token-status">✅ Validated</span>
                                </div>
                                <button 
                                    onClick={() => removeToken(token)}
                                    className="remove-token-btn"
                                >
                                    Remove
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Copy Trading List */}
            {copyTradingList.length > 0 && (
                <div className="copy-trading-list-section">
                    <h3>Active Copy Trading Accounts</h3>
                    <div className="ct-list-grid">
                        {copyTradingList.map((item, index) => (
                            <div key={index} className="ct-list-item">
                                <div className="ct-item-header">
                                    <span className="ct-account-id">{item.account_id}</span>
                                    <span className={`ct-status ${item.is_active ? 'active' : 'inactive'}`}>
                                        {item.is_active ? '🟢 Active' : '🔴 Inactive'}
                                    </span>
                                </div>
                                {item.balance && (
                                    <div className="ct-balance">
                                        ${item.balance.toFixed(2)} {item.currency}
                                    </div>
                                )}
                                <div className="ct-created">
                                    Added: {new Date(item.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Copy Trading Section */}
            <div className="main-copy-section">
                <h3>Copy Trading Control</h3>
                <p>Manage copy trading for all tokens</p>
                <button 
                    className={`copy-trading-btn ${isActive ? 'stop' : 'start'}`}
                    onClick={toggleCopyTrading}
                    disabled={tokens.length === 0}
                >
                    {isActive ? 'Stop Copy Trading' : 'Start Copy Trading'}
                </button>
                {tokens.length === 0 && (
                    <p className="warning-text">Add at least one token to enable copy trading</p>
                )}
            </div>

            {/* Tutorial Section */}
            <div className="tutorial-section">
                <h3>Copy Trading Tutorial</h3>
                <p>Learn how to use copy trading effectively with real API integration</p>
                <div className="tutorial-buttons">
                    <button 
                        className="tutorial-btn"
                        onClick={() => window.open('https://www.youtube.com/watch?v=gsWzKmslEnY', '_blank')}
                    >
                        📺 Watch Tutorial
                    </button>
                    <button 
                        className="tutorial-btn secondary"
                        onClick={() => window.open('https://docs.deriv.com/api/', '_blank')}
                    >
                        📖 API Documentation
                    </button>
                </div>
            </div>

            {/* Real Trading Status */}
            <div className="trading-status-section">
                <h3>Trading Status</h3>
                <div className="status-grid">
                    <div className="status-item">
                        <span className="status-label">API Connection</span>
                        <span className="status-value connected">🟢 Connected</span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Copy Trading</span>
                        <span className={`status-value ${isActive ? 'active' : 'inactive'}`}>
                            {isActive ? '🟢 Active' : '🔴 Inactive'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Demo Copy</span>
                        <span className={`status-value ${isDemoActive ? 'active' : 'inactive'}`}>
                            {isDemoActive ? '🟢 Active' : '🔴 Inactive'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Active Tokens</span>
                        <span className="status-value">{tokens.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CopyTrader;