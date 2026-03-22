import React, { useEffect,useState } from 'react';
import { api_base } from '@/external/bot-skeleton';

export const ConnectionStatus: React.FC = () => {
    const [status, setStatus] = useState({
        apiConnected: false,
        authenticated: false,
        balance: null as number | null,
        currency: null as string | null,
        loginId: null as string | null,
    });

    useEffect(() => {
        const checkStatus = async () => {
            const authToken = localStorage.getItem('authToken');
            const loginId = localStorage.getItem('active_loginid');
            const apiConnected = !!api_base.api;

            setStatus(prev => ({
                ...prev,
                apiConnected,
                authenticated: !!authToken,
                loginId,
            }));

            if (apiConnected && authToken) {
                try {
                    const balanceResponse = await api_base.api?.send({ balance: 1 });
                    if (balanceResponse?.balance) {
                        setStatus(prev => ({
                            ...prev,
                            balance: balanceResponse.balance.balance,
                            currency: balanceResponse.balance.currency,
                        }));
                    }
                } catch (error) {
                    console.error('Failed to get balance:', error);
                }
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 5000);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = () => {
        if (!status.apiConnected) return '#f44336'; // Red
        if (!status.authenticated) return '#ff9800'; // Orange
        return '#4caf50'; // Green
    };

    const getStatusText = () => {
        if (!status.apiConnected) return 'API Disconnected';
        if (!status.authenticated) return 'Not Logged In';
        return 'Ready to Trade';
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                fontSize: '0.85rem',
            }}
        >
            <div
                style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: getStatusColor(),
                    boxShadow: `0 0 8px ${getStatusColor()}`,
                    animation: 'pulse 2s ease-in-out infinite',
                }}
            />
            <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>{getStatusText()}</span>
            {status.authenticated && status.balance !== null && (
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', marginLeft: '0.5rem' }}>
                    {status.balance} {status.currency}
                </span>
            )}
            {!status.authenticated && (
                <button
                    onClick={() => {
                        const token = prompt('Enter your Deriv API token:');
                        if (token) {
                            localStorage.setItem('authToken', token);
                            const loginId = prompt('Enter your login ID (e.g., VRTC12345):');
                            if (loginId) {
                                localStorage.setItem('active_loginid', loginId);
                            }
                            window.location.reload();
                        }
                    }}
                    style={{
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(33, 150, 243, 0.2)',
                        border: '1px solid rgba(33, 150, 243, 0.4)',
                        borderRadius: '4px',
                        color: '#2196f3',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        marginLeft: '0.5rem',
                    }}
                >
                    Set Token
                </button>
            )}
        </div>
    );
};
