import React from 'react';
import { PasswordProtection } from './PasswordProtection';
import { usePasswordProtection } from '../../hooks/usePasswordProtection';
import { AUTH_CONFIG } from '../../config/auth.config';

interface ProtectedPatelSignalsProps {
    children: React.ReactNode;
}

export const ProtectedPatelSignals: React.FC<ProtectedPatelSignalsProps> = ({ children }) => {
    const { isAuthenticated, isLoading, authenticate } = usePasswordProtection({
        correctPassword: AUTH_CONFIG.PREMIUM_SIGNALS_PASSWORD,
        storageKey: AUTH_CONFIG.PATEL_SIGNALS_STORAGE_KEY,
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
                <div style={{ color: 'white', fontSize: '1.5rem' }}>Loading Patel Signals...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <PasswordProtection
                onAuthenticate={authenticate}
                title='🎯 Patel Signals - Premium Access'
                subtitle='Enter password to access Patel Signal Suite'
                placeholder='Enter premium password...'
                errorMessage='Incorrect password. Contact PlentyFX for access.'
            />
        );
    }

    return <>{children}</>;
};
