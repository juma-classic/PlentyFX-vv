/**
 * Copy Trading Service
 * Manages copy trading functionality including trader management and trade execution
 */

import type {
    ApiTokenValidation,
    CopyTradeExecution,
    CopyTrader,
    CopyTradingNotification,
    CopyTradingSettings,
    CopyTradingStats,
    MasterTrade,
} from '@/types/copy-trading.types';

class CopyTradingService {
    private copyTraders: Map<string, CopyTrader> = new Map();
    private masterTrades: Map<string, MasterTrade> = new Map();
    private copyExecutions: Map<string, CopyTradeExecution> = new Map();
    private notifications: CopyTradingNotification[] = [];
    private settings: CopyTradingSettings;
    private isInitialized = false;

    constructor() {
        this.settings = this.getDefaultSettings();
        this.loadFromStorage();
    }

    /**
     * Initialize the copy trading service
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        console.log('🔄 Initializing Copy Trading Service...');

        // Load saved data
        this.loadFromStorage();

        // Validate all copy trader connections
        await this.validateAllConnections();

        this.isInitialized = true;
        console.log('✅ Copy Trading Service initialized');
    }

    /**
     * Add a new copy trader
     */
    async addCopyTrader(
        traderData: Omit<
            CopyTrader,
            | 'id'
            | 'createdAt'
            | 'totalTrades'
            | 'winningTrades'
            | 'totalProfit'
            | 'currentDrawdown'
            | 'connectionStatus'
        >
    ): Promise<{ success: boolean; trader?: CopyTrader; error?: string }> {
        try {
            console.log('👤 Adding new copy trader:', traderData.name);

            // Validate API token first
            const validation = await this.validateApiToken(traderData.apiToken);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.error || 'Invalid API token',
                };
            }

            // Check if trader already exists
            const existingTrader = Array.from(this.copyTraders.values()).find(
                trader => trader.apiToken === traderData.apiToken
            );
            if (existingTrader) {
                return {
                    success: false,
                    error: 'This API token is already registered',
                };
            }

            // Create new trader
            const trader: CopyTrader = {
                ...traderData,
                id: `trader-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                createdAt: Date.now(),
                totalTrades: 0,
                winningTrades: 0,
                totalProfit: 0,
                currentDrawdown: 0,
                connectionStatus: 'CONNECTED',
            };

            // Add to collection
            this.copyTraders.set(trader.id, trader);

            // Save to storage
            this.saveToStorage();

            // Send notification
            this.addNotification({
                type: 'NEW_TRADER',
                title: 'New Copy Trader Added',
                message: `${trader.name} has been added as a copy trader`,
                severity: 'SUCCESS',
                copyTraderId: trader.id,
            });

            console.log('✅ Copy trader added successfully:', trader.id);
            return { success: true, trader };
        } catch (error) {
            console.error('❌ Error adding copy trader:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Remove a copy trader
     */
    removeCopyTrader(traderId: string): boolean {
        const trader = this.copyTraders.get(traderId);
        if (!trader) return false;

        console.log('🗑️ Removing copy trader:', trader.name);

        // Remove trader
        this.copyTraders.delete(traderId);

        // Save to storage
        this.saveToStorage();

        // Send notification
        this.addNotification({
            type: 'NEW_TRADER',
            title: 'Copy Trader Removed',
            message: `${trader.name} has been removed from copy trading`,
            severity: 'INFO',
            copyTraderId: traderId,
        });

        return true;
    }

    /**
     * Update copy trader settings
     */
    updateCopyTrader(traderId: string, updates: Partial<CopyTrader>): boolean {
        const trader = this.copyTraders.get(traderId);
        if (!trader) return false;

        console.log('📝 Updating copy trader:', trader.name);

        // Update trader
        const updatedTrader = { ...trader, ...updates };
        this.copyTraders.set(traderId, updatedTrader);

        // Save to storage
        this.saveToStorage();

        return true;
    }

    /**
     * Execute a master trade for all active copy traders
     */
    async executeMasterTrade(
        tradeData: Omit<MasterTrade, 'id' | 'executedAt' | 'copyExecutions'>
    ): Promise<MasterTrade> {
        const masterTrade: MasterTrade = {
            ...tradeData,
            id: `master-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            executedAt: Date.now(),
            copyExecutions: [],
        };

        console.log('🚀 Executing master trade:', masterTrade.id, {
            source: masterTrade.source,
            market: masterTrade.market,
            contractType: masterTrade.contractType,
            stake: masterTrade.stake,
        });

        // Store master trade
        this.masterTrades.set(masterTrade.id, masterTrade);

        // Execute copy trades if enabled
        if (masterTrade.shouldCopy && this.settings.isEnabled) {
            await this.executeCopyTrades(masterTrade);
        }

        return masterTrade;
    }

    /**
     * Execute copy trades for a master trade
     */
    private async executeCopyTrades(masterTrade: MasterTrade): Promise<void> {
        const activeCopyTraders = Array.from(this.copyTraders.values()).filter(
            trader => trader.isActive && trader.connectionStatus === 'CONNECTED'
        );

        console.log(`📋 Executing copy trades for ${activeCopyTraders.length} traders`);

        // Add execution delay if configured
        if (this.settings.executionDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, this.settings.executionDelay));
        }

        // Execute trades for each copy trader
        const copyPromises = activeCopyTraders.map(trader => this.executeCopyTradeForTrader(masterTrade, trader));

        const results = await Promise.allSettled(copyPromises);

        // Log results
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log(`✅ Copy trade execution complete: ${successful} successful, ${failed} failed`);
    }

    /**
     * Execute copy trade for a specific trader
     */
    private async executeCopyTradeForTrader(masterTrade: MasterTrade, trader: CopyTrader): Promise<CopyTradeExecution> {
        const copyExecution: CopyTradeExecution = {
            id: `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            masterTradeId: masterTrade.id,
            copyTraderId: trader.id,
            market: masterTrade.market,
            contractType: masterTrade.contractType,
            stake: this.calculateCopyStake(masterTrade.stake, trader),
            duration: masterTrade.duration,
            durationUnit: masterTrade.durationUnit,
            barrier: masterTrade.barrier,
            executedAt: Date.now(),
            status: 'PENDING',
            retryCount: 0,
            maxRetries: this.settings.retryAttempts,
        };

        try {
            // Validate trade before execution
            const validation = this.validateCopyTrade(copyExecution, trader);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            console.log(`💼 Executing copy trade for ${trader.name}:`, {
                market: copyExecution.market,
                contractType: copyExecution.contractType,
                stake: copyExecution.stake,
            });

            // Execute the trade using trader's API token
            const result = await this.executeCopyTradeAPI(copyExecution, trader);

            if (result.success) {
                copyExecution.status = 'ACTIVE';
                copyExecution.contractId = result.contractId;
                copyExecution.buyPrice = result.buyPrice;

                // Update trader stats
                this.updateTraderStats(trader.id, 'TRADE_EXECUTED', copyExecution.stake);

                console.log(`✅ Copy trade executed successfully for ${trader.name}`);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error(`❌ Copy trade failed for ${trader.name}:`, error);

            copyExecution.status = 'ERROR';
            copyExecution.error = error instanceof Error ? error.message : 'Unknown error';

            // Update trader connection status if API error
            if (copyExecution.error.includes('Invalid token') || copyExecution.error.includes('Unauthorized')) {
                this.updateCopyTrader(trader.id, { connectionStatus: 'ERROR', lastError: copyExecution.error });
            }

            // Send error notification
            this.addNotification({
                type: 'ERROR',
                title: 'Copy Trade Failed',
                message: `Copy trade failed for ${trader.name}: ${copyExecution.error}`,
                severity: 'ERROR',
                copyTraderId: trader.id,
                tradeId: copyExecution.id,
            });
        }

        // Store copy execution
        this.copyExecutions.set(copyExecution.id, copyExecution);
        masterTrade.copyExecutions.push(copyExecution);

        return copyExecution;
    }

    /**
     * Calculate copy trade stake based on trader's multiplier and limits
     */
    private calculateCopyStake(masterStake: number, trader: CopyTrader): number {
        let copyStake = masterStake * trader.stakeMultiplier;

        // Apply trader's maximum stake limit
        if (copyStake > trader.maxStakePerTrade) {
            copyStake = trader.maxStakePerTrade;
        }

        // Apply global maximum stake limit
        if (copyStake > this.settings.globalMaxStakePerTrade) {
            copyStake = this.settings.globalMaxStakePerTrade;
        }

        // Ensure minimum stake (0.35 for most Deriv contracts)
        if (copyStake < 0.35) {
            copyStake = 0.35;
        }

        return Math.round(copyStake * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Validate copy trade before execution
     */
    private validateCopyTrade(
        copyExecution: CopyTradeExecution,
        trader: CopyTrader
    ): { isValid: boolean; error?: string } {
        // Check if trader allows this market
        if (trader.allowedMarkets.length > 0 && !trader.allowedMarkets.includes(copyExecution.market)) {
            return { isValid: false, error: `Market ${copyExecution.market} not allowed for this trader` };
        }

        // Check if trader allows this contract type
        if (
            trader.allowedContractTypes.length > 0 &&
            !trader.allowedContractTypes.includes(copyExecution.contractType)
        ) {
            return { isValid: false, error: `Contract type ${copyExecution.contractType} not allowed for this trader` };
        }

        // Check daily loss limit
        const todayLoss = this.getTodayLoss(trader.id);
        if (todayLoss >= trader.maxDailyLoss) {
            return { isValid: false, error: 'Daily loss limit reached' };
        }

        // Check concurrent trades limit
        const activeTrades = this.getActiveCopyTrades(trader.id);
        if (activeTrades >= trader.maxConcurrentTrades) {
            return { isValid: false, error: 'Maximum concurrent trades limit reached' };
        }

        return { isValid: true };
    }

    /**
     * Execute copy trade via Deriv API
     */
    private async executeCopyTradeAPI(
        copyExecution: CopyTradeExecution,
        trader: CopyTrader
    ): Promise<{ success: boolean; contractId?: string; buyPrice?: number; error?: string }> {
        try {
            // Create a temporary API connection for this trader
            const traderAPI = await this.createTraderAPIConnection(trader);

            // Prepare buy request
            const buyRequest = {
                buy: 1,
                price: copyExecution.stake,
                parameters: {
                    contract_type: copyExecution.contractType,
                    symbol: copyExecution.market,
                    duration: copyExecution.duration,
                    duration_unit: copyExecution.durationUnit,
                    ...(copyExecution.barrier && { barrier: copyExecution.barrier }),
                },
            };

            console.log('📡 Sending buy request for copy trade:', buyRequest);

            // Execute trade
            const response = await traderAPI.send(buyRequest);

            if (response.error) {
                throw new Error(response.error.message || 'API error');
            }

            return {
                success: true,
                contractId: response.buy?.contract_id,
                buyPrice: response.buy?.buy_price,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown API error',
            };
        }
    }

    /**
     * Create API connection for a specific trader
     */
    private async createTraderAPIConnection(trader: CopyTrader): Promise<{
        send: (request: Record<string, unknown>) => Promise<Record<string, unknown>>;
    }> {
        // This would create a separate WebSocket connection using the trader's API token
        // For now, we'll simulate this - in production, you'd need to implement proper API connection management

        // Placeholder implementation
        return {
            send: async (request: Record<string, unknown>) => {
                // Simulate API call with trader's token
                console.log(`🔗 API call for trader ${trader.name} with token: ${trader.apiToken.substring(0, 10)}...`);

                // Simulate response (replace with actual Deriv API call)
                return {
                    buy: {
                        contract_id: `CT${Date.now()}`,
                        buy_price: request.price,
                    },
                };
            },
        };
    }

    /**
     * Validate API token
     */
    async validateApiToken(token: string): Promise<ApiTokenValidation> {
        try {
            console.log('🔐 Validating API token...');

            // Create temporary connection to validate token
            // This is a placeholder - implement actual Deriv API validation

            // Simulate validation
            if (token.length < 10) {
                return {
                    isValid: false,
                    error: 'API token is too short',
                };
            }

            // Simulate successful validation
            return {
                isValid: true,
                accountInfo: {
                    loginId: 'CR1234567',
                    currency: 'USD',
                    balance: 1000,
                    country: 'US',
                    email: 'user@example.com',
                },
                permissions: {
                    read: true,
                    trade: true,
                    payments: false,
                    admin: false,
                },
            };
        } catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Validation failed',
            };
        }
    }

    /**
     * Validate all copy trader connections
     */
    private async validateAllConnections(): Promise<void> {
        console.log('🔍 Validating all copy trader connections...');

        const traders = Array.from(this.copyTraders.values());
        const validationPromises = traders.map(async trader => {
            const validation = await this.validateApiToken(trader.apiToken);

            if (!validation.isValid) {
                this.updateCopyTrader(trader.id, {
                    connectionStatus: 'ERROR',
                    lastError: validation.error,
                });
            } else {
                this.updateCopyTrader(trader.id, {
                    connectionStatus: 'CONNECTED',
                    lastError: undefined,
                    lastActivity: Date.now(),
                });
            }
        });

        await Promise.allSettled(validationPromises);
        console.log('✅ Connection validation complete');
    }

    /**
     * Get copy trading statistics
     */
    getStats(): CopyTradingStats {
        const traders = Array.from(this.copyTraders.values());
        const executions = Array.from(this.copyExecutions.values());

        const stats: CopyTradingStats = {
            totalCopyTraders: traders.length,
            activeCopyTraders: traders.filter(t => t.isActive && t.connectionStatus === 'CONNECTED').length,
            totalCopyTrades: executions.length,
            successfulCopyTrades: executions.filter(e => e.status === 'WON').length,
            totalCopyProfit: executions.reduce((sum, e) => sum + (e.profit || 0), 0),
            averageExecutionTime: 0, // Calculate based on execution times
            traderStats: {},
        };

        // Calculate trader-specific stats
        traders.forEach(trader => {
            const traderExecutions = executions.filter(e => e.copyTraderId === trader.id);
            stats.traderStats[trader.id] = {
                totalTrades: traderExecutions.length,
                winRate:
                    traderExecutions.length > 0
                        ? (traderExecutions.filter(e => e.status === 'WON').length / traderExecutions.length) * 100
                        : 0,
                totalProfit: traderExecutions.reduce((sum, e) => sum + (e.profit || 0), 0),
                averageStake:
                    traderExecutions.length > 0
                        ? traderExecutions.reduce((sum, e) => sum + e.stake, 0) / traderExecutions.length
                        : 0,
                lastTradeTime: trader.lastTradeTime || 0,
            };
        });

        return stats;
    }

    /**
     * Helper methods
     */
    private getTodayLoss(traderId: string): number {
        const today = new Date().toDateString();
        const executions = Array.from(this.copyExecutions.values()).filter(
            e =>
                e.copyTraderId === traderId &&
                new Date(e.executedAt).toDateString() === today &&
                e.profit !== undefined &&
                e.profit < 0
        );
        return Math.abs(executions.reduce((sum, e) => sum + (e.profit || 0), 0));
    }

    private getActiveCopyTrades(traderId: string): number {
        return Array.from(this.copyExecutions.values()).filter(
            e => e.copyTraderId === traderId && e.status === 'ACTIVE'
        ).length;
    }

    private updateTraderStats(
        traderId: string,
        action: 'TRADE_EXECUTED' | 'TRADE_WON' | 'TRADE_LOST',
        amount?: number
    ): void {
        const trader = this.copyTraders.get(traderId);
        if (!trader) return;

        const updates: Partial<CopyTrader> = { lastTradeTime: Date.now() };

        switch (action) {
            case 'TRADE_EXECUTED':
                updates.totalTrades = trader.totalTrades + 1;
                break;
            case 'TRADE_WON':
                updates.winningTrades = trader.winningTrades + 1;
                if (amount) updates.totalProfit = trader.totalProfit + amount;
                break;
            case 'TRADE_LOST':
                if (amount) updates.totalProfit = trader.totalProfit - amount;
                break;
        }

        this.updateCopyTrader(traderId, updates);
    }

    private addNotification(notification: Omit<CopyTradingNotification, 'id' | 'timestamp' | 'isRead'>): void {
        const newNotification: CopyTradingNotification = {
            ...notification,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            isRead: false,
        };

        this.notifications.unshift(newNotification);

        // Keep only last 100 notifications
        if (this.notifications.length > 100) {
            this.notifications = this.notifications.slice(0, 100);
        }

        console.log('🔔 Copy trading notification:', newNotification.title);
    }

    /**
     * Storage methods
     */
    private saveToStorage(): void {
        try {
            const data = {
                copyTraders: Array.from(this.copyTraders.entries()),
                masterTrades: Array.from(this.masterTrades.entries()),
                copyExecutions: Array.from(this.copyExecutions.entries()),
                notifications: this.notifications,
                settings: this.settings,
            };
            localStorage.setItem('copyTradingData', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save copy trading data:', error);
        }
    }

    private loadFromStorage(): void {
        try {
            const saved = localStorage.getItem('copyTradingData');
            if (saved) {
                const data = JSON.parse(saved);

                this.copyTraders = new Map(data.copyTraders || []);
                this.masterTrades = new Map(data.masterTrades || []);
                this.copyExecutions = new Map(data.copyExecutions || []);
                this.notifications = data.notifications || [];
                this.settings = { ...this.getDefaultSettings(), ...data.settings };
            }
        } catch (error) {
            console.error('Failed to load copy trading data:', error);
        }
    }

    private getDefaultSettings(): CopyTradingSettings {
        return {
            isEnabled: true,
            maxCopyTraders: 50,
            defaultStakeMultiplier: 1.0,
            defaultMaxStakePerTrade: 100,
            defaultMaxDailyLoss: 500,
            defaultMaxConcurrentTrades: 5,
            globalMaxStakePerTrade: 1000,
            globalMaxDailyLoss: 5000,
            requireConfirmationForHighRisk: true,
            executionDelay: 1000,
            maxExecutionTime: 30000,
            retryAttempts: 3,
            notifyOnNewCopyTrader: true,
            notifyOnCopyTradeExecution: true,
            notifyOnCopyTradeResult: true,
            notifyOnErrors: true,
        };
    }

    /**
     * Public getters
     */
    getCopyTraders(): CopyTrader[] {
        return Array.from(this.copyTraders.values());
    }

    getCopyTrader(id: string): CopyTrader | undefined {
        return this.copyTraders.get(id);
    }

    getMasterTrades(): MasterTrade[] {
        return Array.from(this.masterTrades.values());
    }

    getCopyExecutions(): CopyTradeExecution[] {
        return Array.from(this.copyExecutions.values());
    }

    getNotifications(): CopyTradingNotification[] {
        return this.notifications;
    }

    getSettings(): CopyTradingSettings {
        return { ...this.settings };
    }

    updateSettings(updates: Partial<CopyTradingSettings>): void {
        this.settings = { ...this.settings, ...updates };
        this.saveToStorage();
    }
}

// Export singleton instance
export const copyTradingService = new CopyTradingService();
