import React from 'react';
import { ZeusAnalysisTool } from '@/components/zeus-analysis/ZeusAnalysisTool';
import { usePasswordProtection } from '@/hooks/usePasswordProtection';
import { PasswordProtection } from './PasswordProtection';

interface ProtectedZeusAnalysisProps {
    onNavigateToFreeBots: () => void;
}

export const ProtectedZeusAnalysis: React.FC<ProtectedZeusAnalysisProps> = ({ onNavigateToFreeBots }) => {
    const { isAuthenticated, authenticate } = usePasswordProtection();

    if (!isAuthenticated) {
        return (
            <PasswordProtection
                onAuthenticate={authenticate}
                title='Zeus Analysis Access'
                subtitle='Enter password to access Zeus AI Analysis Tool'
            />
        );
    }

    return <ZeusAnalysisTool onNavigateToFreeBots={onNavigateToFreeBots} />;
};
