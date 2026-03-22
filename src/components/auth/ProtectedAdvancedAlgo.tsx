import React from 'react';
import { usePasswordProtection } from '@/hooks/usePasswordProtection';
import { PasswordProtection } from './PasswordProtection';

const AdvancedAlgo = React.lazy(() => import('@/pages/advanced-algo'));

export const ProtectedAdvancedAlgo: React.FC = () => {
    const { isAuthenticated, authenticate } = usePasswordProtection();

    if (!isAuthenticated) {
        return (
            <PasswordProtection
                onAuthenticate={authenticate}
                title='Advanced Algo Access'
                subtitle='Enter password to access Advanced AI Trading Algorithms'
            />
        );
    }

    return (
        <React.Suspense fallback={<div>Loading Advanced Algo...</div>}>
            <AdvancedAlgo />
        </React.Suspense>
    );
};
