import React from 'react';
import { usePasswordProtection } from '@/hooks/usePasswordProtection';
import { PasswordProtection } from './PasswordProtection';

const FastLane = React.lazy(() => import('@/pages/fast-lane'));

export const ProtectedFastLane: React.FC = () => {
    const { isAuthenticated, authenticate } = usePasswordProtection();

    if (!isAuthenticated) {
        return (
            <PasswordProtection
                onAuthenticate={authenticate}
                title='Fast Lane Access'
                subtitle='Enter password to access Fast Lane Trading Interface'
            />
        );
    }

    return (
        <React.Suspense fallback={<div>Loading Fast Lane...</div>}>
            <FastLane />
        </React.Suspense>
    );
};
