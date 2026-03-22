import React, { useEffect,useState } from 'react';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';
import './APIConnectionStatus.scss';

export const APIConnectionStatus: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [accountInfo, setAccountInfo] = useState<any>(null);
    const [showTokenInput, setShowTokenInput] = useState(false);
    const [tokenInput, setTokenInput] = useState('');

    useEffect(() => {
        checkConnection();

        const interval = setInterval(checkConnection, 5000);
        return () => clearInterval(interval);
    }, []);

    const checkConnection = async () => {
        try {
            const token = localStorage.getItem('authToken');

            if (api_base.api) {
                setIsConnected(true);

                if (token) {
                    setIsAuthorized(true);

                    // Get account info
                    const balance = await api_base.api.send({ balance: 1, subscribe: 1 });
                    const loginid = localStorage.getItem('active_loginid');

                    setAccountInfo({
                        loginid,
                        balance: balance?.balance?.balance,
                        currency: balance?.balance?.currency,
                    });
                } else {
                    setIsAuthorized(false);
                }
            } else {
                setIsConnected(false);
                setIsAuthorized(false);
            }
        } catch (error) {
            console.error('Connection check failed:', error);
            setIsConnected(false);
            setIsAuthorized(false);
        }
    };

    const handleSetToken = () => {
        if (tokenInput.trim()) {
            localStorage.setItem('authToken', tokenInput.trim());
            setTokenInput('');
            setShowTokenInput(false);
            window.location.reload();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('active_loginid');
        localStorage.removeItem('accountsList');
        localStorage.removeItem('clientAccounts');
        window.location.reload();
    };

    return (
        <div className='api-connection-status'>
            <div className='status-indicator'>
                <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
                <span className='status-text'>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>

            {isConnected && isAuthorized && accountInfo && (
                <div className='account-info'>
                    <span className='account-id'>{accountInfo.loginid}</span>
                    <span className='account-balance'>
                        {accountInfo.balance} {accountInfo.currency}
                    </span>
                    <button className='logout-btn' onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            )}

            {isConnected && !isAuthorized && (
                <div className='auth-required'>
                    <span className='auth-text'>Not Authorized</span>
                    <button className='auth-btn' onClick={() => setShowTokenInput(!showTokenInput)}>
                        Set Token
                    </button>
                </div>
            )}

            {showTokenInput && (
                <div className='token-input-container'>
                    <input
                        type='text'
                        placeholder='Paste your API token here'
                        value={tokenInput}
                        onChange={e => setTokenInput(e.target.value)}
                        className='token-input'
                    />
                    <button className='token-submit' onClick={handleSetToken}>
                        Connect
                    </button>
                    <button className='token-cancel' onClick={() => setShowTokenInput(false)}>
                        Cancel
                    </button>
                </div>
            )}

            {!isConnected && (
                <div className='connection-help'>
                    <span className='help-text'>API not connected</span>
                    <a
                        href='https://api.deriv.com/app-registration'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='help-link'
                    >
                        Get App ID
                    </a>
                </div>
            )}
        </div>
    );
};
