import React from 'react';
import { PasswordProtection } from './PasswordProtection';
import { usePasswordProtection } from '../../hooks/usePasswordProtection';
import { AUTH_CONFIG } from '../../config/auth.config';

interface ProtectedPatelSignalCenterProps {
    children: React.ReactNode;
}

export const ProtectedPatelSignalCenter: React.FC<ProtectedPatelSignalCenterProps> = ({ children }) => {
    const { isAuthenticated, isLoading, authenticate } = usePasswordProtection({
        correctPassword: AUTH_CONFIG.PREMIUM_SIGNALS_PASSWORD,
        storageKey: 'patel_signal_center_access_granted',
        sessionTimeout: AUTH_CONFIG.SESSION_TIMEOUT,
    });

    if (isLoading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                }}
            >
                <div style={{ color: 'white', fontSize: '1.5rem' }}>Loading Patel Signal Center...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <PasswordProtection
                onAuthenticate={authenticate}
                title='🟣 Patel Signal Center - Premium Access'
                subtitle='Enter password to access advanced statistical trading engine'
                placeholder='Enter premium password...'
                errorMessage='Incorrect password. Contact Elvis Trades for access.'
            />
        );
    }

    return <>{children}</>;
};
