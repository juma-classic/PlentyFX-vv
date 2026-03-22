import React from 'react';
import { PasswordProtection } from '@/components/auth/PasswordProtection';
import { AUTH_CONFIG } from '@/config/auth.config';
import { usePasswordProtection } from '@/hooks/usePasswordProtection';
import SignalsCenter from './SignalsCenter';

export const ProtectedSignalsCenter: React.FC = () => {
    const { isAuthenticated, isLoading, authenticate } = usePasswordProtection({
        correctPassword: AUTH_CONFIG.SIGNALS_PASSWORD,
        storageKey: AUTH_CONFIG.SIGNALS_STORAGE_KEY,
        sessionTimeout: AUTH_CONFIG.SESSION_TIMEOUT,
    });

    // Show loading state
    if (isLoading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    color: '#14b8a6',
                    fontSize: '1.2rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                        style={{
                            width: '20px',
                            height: '20px',
                            border: '2px solid transparent',
                            borderTop: '2px solid currentColor',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                        }}
                    ></div>
                    Loading Signals Center...
                </div>
            </div>
        );
    }

    // Show password protection if not authenticated
    if (!isAuthenticated) {
        return (
            <PasswordProtection
                onAuthenticate={authenticate}
                title='🔐 Signals Center Access'
                subtitle='This section requires premium access credentials'
                placeholder='Enter access password...'
                errorMessage={`Invalid password. ${AUTH_CONFIG.CONTACT_INFO}.`}
            />
        );
    }

    // Show the actual signals center if authenticated
    return <SignalsCenter />;
};
