import React from 'react';
import { PasswordProtection } from './PasswordProtection';
import { usePasswordProtection } from '../../hooks/usePasswordProtection';
import { AUTH_CONFIG } from '../../config/auth.config';

interface ProtectedSignalSavvyProps {
    children: React.ReactNode;
}

export const ProtectedSignalSavvy: React.FC<ProtectedSignalSavvyProps> = ({ children }) => {
    const { isAuthenticated, isLoading, authenticate } = usePasswordProtection({
        correctPassword: AUTH_CONFIG.PREMIUM_SIGNALS_PASSWORD,
        storageKey: AUTH_CONFIG.SIGNAL_SAVVY_STORAGE_KEY,
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
            >
                <div style={{ color: 'white', fontSize: '1.5rem' }}>Loading Signal Savvy...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <PasswordProtection
                onAuthenticate={authenticate}
                title='📡 Signal Savvy - Premium Access'
                subtitle='Enter password to access premium signal analysis'
                placeholder='Enter premium password...'
                errorMessage='Incorrect password. Contact Zeus Trading Hub for access.'
            />
        );
    }

    return <>{children}</>;
};
