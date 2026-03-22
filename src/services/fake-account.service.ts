/**
 * Fake Account Service
 * Manages fake USDT and LTC accounts in fake real mode
 * Ensures no API calls are made for fake accounts
 */

export class FakeAccountService {
    private static instance: FakeAccountService;

    // Fake account configurations
    private readonly FAKE_ACCOUNTS = {
        CR8485805: {
            loginid: 'CR8485805',
            currency: 'USDT',
            currencyLabel: 'Tether TRC20',
            balance: '0.00',
            currency_type: 'crypto',
        },
        CR8485795: {
            loginid: 'CR8485795',
            currency: 'LTC',
            currencyLabel: 'Litecoin',
            balance: '0.00000000',
            currency_type: 'crypto',
        },
    };

    public static getInstance(): FakeAccountService {
        if (!FakeAccountService.instance) {
            FakeAccountService.instance = new FakeAccountService();
        }
        return FakeAccountService.instance;
    }

    /**
     * Check if fake real mode is active
     */
    public isFakeRealModeActive(): boolean {
        return localStorage.getItem('demo_icon_us_flag') === 'true';
    }

    /**
     * Check if a loginid belongs to a fake account
     */
    public isFakeAccount(loginid: string): boolean {
        return this.isFakeRealModeActive() && loginid in this.FAKE_ACCOUNTS;
    }

    /**
     * Get fake account configuration
     */
    public getFakeAccount(loginid: string) {
        return this.FAKE_ACCOUNTS[loginid as keyof typeof this.FAKE_ACCOUNTS];
    }

    /**
     * Get balance for fake account (static, no API call)
     */
    public getFakeAccountBalance(loginid: string): string {
        const account = this.getFakeAccount(loginid);
        return account?.balance || '0.00';
    }

    /**
     * Check if account switching should be blocked (fake accounts)
     */
    public shouldBlockAccountSwitch(loginid: string): boolean {
        return this.isFakeAccount(loginid);
    }

    /**
     * Get all fake account loginids
     */
    public getFakeAccountIds(): string[] {
        return Object.keys(this.FAKE_ACCOUNTS);
    }

    /**
     * Log fake account interaction (for debugging)
     */
    public logFakeAccountInteraction(action: string, loginid: string, details?: any): void {
        if (this.isFakeAccount(loginid)) {
            console.log(`🎭 Fake Account [${action}]:`, {
                loginid,
                currency: this.getFakeAccount(loginid)?.currency,
                details,
            });
        }
    }

    /**
     * Prevent API calls for fake accounts
     */
    public shouldSkipApiCall(loginid: string, apiCall: string): boolean {
        if (this.isFakeAccount(loginid)) {
            console.log(`🚫 Blocking API call for fake account:`, {
                loginid,
                apiCall,
                reason: 'Fake account - using static data',
            });
            return true;
        }
        return false;
    }
}

// Export singleton instance
export const fakeAccountService = FakeAccountService.getInstance();
