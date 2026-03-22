import { useEffect, useState } from 'react';
import { stakeManager, StakeSettings } from '@/services/stake-manager.service';

/**
 * React hook for using StakeManager in components
 * Provides reactive access to stake settings with automatic updates
 */
export const useStakeManager = () => {
    const [settings, setSettings] = useState<StakeSettings>(stakeManager.getSettings());

    useEffect(() => {
        // Subscribe to settings changes
        const unsubscribe = stakeManager.subscribe(newSettings => {
            setSettings(newSettings);
        });

        // Cleanup subscription on unmount
        return unsubscribe;
    }, []);

    return {
        // Current settings
        stake: settings.stake,
        martingale: settings.martingale,
        isCustom: settings.isCustom,
        settings,

        // Formatted values for display
        formattedStake: stakeManager.getFormattedStake(),
        formattedMartingale: stakeManager.getFormattedMartingale(),

        // Actions
        updateSettings: (stake: number, martingale: number) => {
            stakeManager.updateSettings(stake, martingale);
        },
        resetToDefaults: () => {
            stakeManager.resetToDefaults();
        },

        // Utility methods
        hasCustomSettings: () => stakeManager.hasCustomSettings(),
        getStake: () => stakeManager.getStake(),
        getMartingale: () => stakeManager.getMartingale(),
    };
};
