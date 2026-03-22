/**
 * Account Switching Service
 * Handles automatic switching between Deriv accounts based on trading conditions
 */

import { api_base } from '@/external/bot-skeleton/services/api/api-base';

export interface AccountInfo {
    loginid: string;
    token: string;
    currency: string;
    balance: number;
    is_virtual: boolean;
    display_name: string;
}

export interface AccountSwitchConfig {
    enabled: boolean;
    lossesToSwitch: number;
    switchBetweenAccountTypes: boolean; // Switch between demo/real
    availableAccounts: string[]; // List of loginids to switch between
    cooldownMinutes: number; // Minimum time between switches
    maxSwitchesPerSession: number;
}

export interface AccountSwitchEvent {
    from: string;
    to: string;
    reason: string;
    timestamp: number;
    consecutiveLosses: number;
}

class AccountSwitchingService {
    private config: AccountSwitchConfig | null = null;
    private consecutiveLosses = 0;
    private lastSwitchTime = 0;
    private switchesThisSession = 0;
    private switchHistory: AccountSwitchEvent[] = [];
    private callbacks: {
        onAccountSwitch?: (event: AccountSwitchEvent) => void;
        onSwitchFailed?: (error: string) => void;
    } = {};

    /**
     * Initialize the account switching service
     */
    initialize(config: AccountSwitchConfig) {
        this.config = config;
        this.consecutiveLosses = 0;
        this.lastSwitchTime = 0;
        this.switchesThisSession = 0;
        this.switchHistory = [];

        console.log('🔄 Account Switching Service initialized:', config);
    }

    /**
     * Set callback functions
     */
    setCallbacks(callbacks: {
        onAccountSwitch?: (event: AccountSwitchEvent) => void;
        onSwitchFailed?: (error: string) => void;
    }) {
        this.callbacks = callbacks;
    }

    /**
     * Record a trade result and check if account switch is needed
     */
    recordTradeResult(isWin: boolean) {
        if (!this.config?.enabled) return;

        if (isWin) {
            this.consecutiveLosses = 0;
            console.log('✅ Trade won - Resetting consecutive losses counter');
        } else {
            this.consecutiveLosses++;
            console.log(`❌ Trade lost - Consecutive losses: ${this.consecutiveLosses}/${this.config.lossesToSwitch}`);

            // Check if we should switch accounts
            if (this.consecutiveLosses >= this.config.lossesToSwitch) {
                this.attemptAccountSwitch();
            }
        }
    }

    /**
     * Attempt to switch to a different account
     */
    private async attemptAccountSwitch() {
        if (!this.config) return;

        // Check cooldown period
        if (this.isInCooldown()) {
            console.log('🕒 Account switch on cooldown, skipping...');
            return;
        }

        // Check max switches limit
        if (this.hasReachedMaxSwitches()) {
            console.log('🚫 Max account switches reached for this session');
            return;
        }

        try {
            const currentAccount = this.getCurrentAccount();
            const nextAccount = await this.selectNextAccount(currentAccount);

            if (!nextAccount) {
                console.log('❌ No suitable account found for switching');
                this.callbacks.onSwitchFailed?.('No suitable account available');
                return;
            }

            await this.performAccountSwitch(currentAccount, nextAccount);
        } catch (error) {
            console.error('❌ Account switch failed:', error);
            this.callbacks.onSwitchFailed?.(error instanceof Error ? error.message : 'Unknown error');
        }
    }

    /**
     * Get current account information
     */
    private getCurrentAccount(): AccountInfo {
        const activeLoginId = localStorage.getItem('active_loginid') || '';
        const authToken = localStorage.getItem('authToken') || '';

        return {
            loginid: activeLoginId,
            token: authToken,
            currency: 'USD', // Will be updated with real data
            balance: 0, // Will be updated with real data
            is_virtual: activeLoginId.includes('VRT'),
            display_name: activeLoginId.includes('VRT') ? 'Demo' : 'Real',
        };
    }

    /**
     * Select the next account to switch to
     */
    private async selectNextAccount(currentAccount: AccountInfo): Promise<AccountInfo | null> {
        if (!this.config) return null;

        const availableAccounts = Object.keys(JSON.parse(localStorage.getItem('accountsList') || '{}'));

        if (availableAccounts.length <= 1) {
            console.log('❌ Only one account available, cannot switch');
            return null;
        }

        // If switchBetweenAccountTypes is enabled, prefer switching between demo/real
        if (this.config.switchBetweenAccountTypes) {
            const targetType = currentAccount.is_virtual ? 'real' : 'demo';
            const targetAccounts = availableAccounts.filter(loginid => {
                const isVirtual = loginid.includes('VRT');
                return targetType === 'demo' ? isVirtual : !isVirtual;
            });

            if (targetAccounts.length > 0) {
                const targetLoginId = targetAccounts[0];
                const accountsList = JSON.parse(localStorage.getItem('accountsList') || '{}');
                return {
                    loginid: targetLoginId,
                    token: accountsList[targetLoginId],
                    currency: 'USD',
                    balance: 0,
                    is_virtual: targetLoginId.includes('VRT'),
                    display_name: targetLoginId.includes('VRT') ? 'Demo' : 'Real',
                };
            }
        }

        // If specific accounts are configured, use those
        if (this.config.availableAccounts.length > 0) {
            const accountsList = JSON.parse(localStorage.getItem('accountsList') || '{}');
            const configuredAccounts = this.config.availableAccounts.filter(
                loginid => loginid !== currentAccount.loginid && accountsList[loginid]
            );

            if (configuredAccounts.length > 0) {
                const targetLoginId = configuredAccounts[0];
                return {
                    loginid: targetLoginId,
                    token: accountsList[targetLoginId],
                    currency: 'USD',
                    balance: 0,
                    is_virtual: targetLoginId.includes('VRT'),
                    display_name: targetLoginId.includes('VRT') ? 'Demo' : 'Real',
                };
            }
        }

        // Default: switch to any other available account
        const otherAccounts = availableAccounts.filter(loginid => loginid !== currentAccount.loginid);
        if (otherAccounts.length > 0) {
            const targetLoginId = otherAccounts[0];
            const accountsList = JSON.parse(localStorage.getItem('accountsList') || '{}');
            return {
                loginid: targetLoginId,
                token: accountsList[targetLoginId],
                currency: 'USD',
                balance: 0,
                is_virtual: targetLoginId.includes('VRT'),
                display_name: targetLoginId.includes('VRT') ? 'Demo' : 'Real',
            };
        }

        return null;
    }

    /**
     * Perform the actual account switch
     */
    private async performAccountSwitch(fromAccount: AccountInfo, toAccount: AccountInfo) {
        console.log(`🔄 Switching accounts: ${fromAccount.loginid} → ${toAccount.loginid}`);

        try {
            // Update localStorage with new account
            localStorage.setItem('authToken', toAccount.token);
            localStorage.setItem('active_loginid', toAccount.loginid);

            // Reinitialize API connection
            await api_base?.init(true);

            // Update URL parameters
            const searchParams = new URLSearchParams(window.location.search);
            
            // Check if fake real mode is active
            const isFakeRealMode = localStorage.getItem('demo_icon_us_flag') === 'true';
            
            // Set account parameter based on fake real mode
            let accountParam: string;
            if (toAccount.is_virtual && isFakeRealMode) {
                // In fake real mode, show USD for demo accounts
                accountParam = 'USD';
            } else {
                // Normal mode: show 'demo' for virtual, currency for real
                accountParam = toAccount.is_virtual ? 'demo' : toAccount.currency;
            }
            
            searchParams.set('account', accountParam);
            window.history.pushState({}, '', `${window.location.pathname}?${searchParams.toString()}`);

            // Reset consecutive losses after successful switch
            this.consecutiveLosses = 0;
            this.lastSwitchTime = Date.now();
            this.switchesThisSession++;

            // Record switch event
            const switchEvent: AccountSwitchEvent = {
                from: fromAccount.loginid,
                to: toAccount.loginid,
                reason: `Consecutive losses (${this.consecutiveLosses})`,
                timestamp: Date.now(),
                consecutiveLosses: this.consecutiveLosses,
            };

            this.switchHistory.push(switchEvent);

            // Notify callback
            this.callbacks.onAccountSwitch?.(switchEvent);

            console.log('✅ Account switch completed successfully:', {
                from: fromAccount.display_name,
                to: toAccount.display_name,
                switchesThisSession: this.switchesThisSession,
            });

            // Show user notification
            this.showSwitchNotification(fromAccount, toAccount);
        } catch (error) {
            console.error('❌ Failed to switch accounts:', error);
            throw error;
        }
    }

    /**
     * Show notification to user about account switch
     */
    private showSwitchNotification(fromAccount: AccountInfo, toAccount: AccountInfo) {
        // Create a temporary notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 600;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">🔄</span>
                <div>
                    <div style="font-weight: 700;">Account Switched</div>
                    <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
                        ${fromAccount.display_name} → ${toAccount.display_name}
                    </div>
                </div>
            </div>
        `;

        // Add animation keyframes
        if (!document.getElementById('account-switch-styles')) {
            const style = document.createElement('style');
            style.id = 'account-switch-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    /**
     * Check if we're in cooldown period
     */
    private isInCooldown(): boolean {
        if (!this.config?.cooldownMinutes) return false;
        const cooldownMs = this.config.cooldownMinutes * 60 * 1000;
        return Date.now() - this.lastSwitchTime < cooldownMs;
    }

    /**
     * Check if max switches limit reached
     */
    private hasReachedMaxSwitches(): boolean {
        if (!this.config?.maxSwitchesPerSession) return false;
        return this.switchesThisSession >= this.config.maxSwitchesPerSession;
    }

    /**
     * Get switch statistics
     */
    getStats() {
        return {
            consecutiveLosses: this.consecutiveLosses,
            switchesThisSession: this.switchesThisSession,
            lastSwitchTime: this.lastSwitchTime,
            switchHistory: [...this.switchHistory],
            isInCooldown: this.isInCooldown(),
            hasReachedMaxSwitches: this.hasReachedMaxSwitches(),
        };
    }

    /**
     * Reset the service state
     */
    reset() {
        this.consecutiveLosses = 0;
        this.lastSwitchTime = 0;
        this.switchesThisSession = 0;
        this.switchHistory = [];
        console.log('🔄 Account switching service reset');
    }

    /**
     * Get available accounts for switching
     */
    getAvailableAccounts(): AccountInfo[] {
        const accountsList = JSON.parse(localStorage.getItem('accountsList') || '{}');
        return Object.keys(accountsList).map(loginid => ({
            loginid,
            token: accountsList[loginid],
            currency: 'USD',
            balance: 0,
            is_virtual: loginid.includes('VRT'),
            display_name: loginid.includes('VRT') ? 'Demo' : 'Real',
        }));
    }
}

export const accountSwitchingService = new AccountSwitchingService();
