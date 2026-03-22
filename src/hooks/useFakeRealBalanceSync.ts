import { useEffect, useRef } from 'react';
import { useStore } from '@/hooks/useStore';
import { fakeRealBalanceTracker } from '@/services/fake-real-balance-tracker.service';

/**
 * Hook to automatically sync fake real balance with demo account balance changes
 * Monitors demo account balance and updates the fake real USD balance accordingly
 */
export const useFakeRealBalanceSync = () => {
    const { client } = useStore();
    const previousBalanceRef = useRef<number | null>(null);
    const isFakeRealMode = fakeRealBalanceTracker.isFakeRealModeActive();

    useEffect(() => {
        // Safety checks
        if (!isFakeRealMode || !client?.loginid || !client?.all_accounts_balance) return;

        // Only track if on demo account
        const isDemo = client.loginid.startsWith('VRT');
        if (!isDemo) return;

        // Get current demo balance
        const currentBalance = client.all_accounts_balance?.accounts?.[client.loginid]?.balance;
        
        if (currentBalance === undefined || currentBalance === null) return;

        // Initialize snapshot on first run
        if (previousBalanceRef.current === null) {
            previousBalanceRef.current = currentBalance;
            fakeRealBalanceTracker.snapshotDemoBalance(currentBalance);
            console.log('📸 Initial demo balance snapshot:', currentBalance);
            return;
        }

        // Check if balance changed
        if (currentBalance !== previousBalanceRef.current) {
            const change = currentBalance - previousBalanceRef.current;
            
            // Detect if this is a reset operation (balance jumped to 10,000)
            const isReset = currentBalance === 10000 && Math.abs(change) > 1000;
            
            if (isReset) {
                console.log('🔄 Demo balance reset detected - NOT updating fake real balance');
                // Update snapshot but don't update fake real balance
                previousBalanceRef.current = currentBalance;
                fakeRealBalanceTracker.snapshotDemoBalance(currentBalance);
                return;
            }
            
            console.log('💰 Demo balance changed:', {
                from: previousBalanceRef.current,
                to: currentBalance,
                change: change,
            });

            // Update fake real balance
            fakeRealBalanceTracker.updateBalanceFromDemo(currentBalance);
            
            // Update reference
            previousBalanceRef.current = currentBalance;

            // Force re-render of account switcher by triggering a small state update
            // This ensures the UI shows the new balance immediately
            window.dispatchEvent(new CustomEvent('fake-real-balance-updated'));
        }
    }, [client?.all_accounts_balance, client?.loginid, isFakeRealMode, client]);

    return {
        isFakeRealMode,
        currentFakeBalance: fakeRealBalanceTracker.getFormattedBalance(),
    };
};
