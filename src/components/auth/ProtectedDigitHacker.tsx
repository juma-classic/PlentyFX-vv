import React from 'react';
import { PasswordProtection } from './PasswordProtection';
import { usePasswordProtection } from '../../hooks/usePasswordProtection';
import { AUTH_CONFIG } from '../../config/auth.config';

interface ProtectedDigitHackerProps {
    children: React.ReactNode;
}

export const ProtectedDigitHacker: React.FC<ProtectedDigitHackerProps> = ({ children }) => {
    const { isAuthenticated, isLoading, authenticate } = usePasswordProtection({
        correctPassword: AUTH_CONFIG.PREMIUM_SIGNALS_PASSWORD,
        storageKey: 'digit_hacker_access_granted',
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
                    background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                }}
            >
                <div style={{ color: 'white', fontSize: '1.5rem' }}>Loading Digit Hacker AI...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <PasswordProtection
                onAuthenticate={authenticate}
                title='🎯 Digit Hacker AI - Premium Access'
                subtitle='Enter password to access AI-powered digit prediction system'
                placeholder='Enter premium password...'
                errorMessage='Incorrect password. Contact Zeus Trading Hub for access.'
            />
        );
    }

    return <>{children}</>;
};
