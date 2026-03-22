/**
 * Bulk Trading Service
 * Handles placing multiple contracts with rate limiting and error handling
 */

import { api_base } from '@/external/bot-skeleton/services/api/api-base';
import { derivAPIService } from './deriv-api.service';

export interface BulkTradeConfig {
    proposalId: string;
    price: number;
    count: number;
    delayMs?: number; // Delay between requests (default: 150ms)
}

export interface BulkTradeResult {
    success: boolean;
    contractId?: number;
    transactionId?: number;
    buyPrice?: number;
    error?: string;
    index: number;
}

export interface BulkTradeStats {
    total: number;
    successful: number;
    failed: number;
    results: BulkTradeResult[];
    totalCost: number;
    startTime: number;
    endTime: number;
    duration: number;
}

class BulkTradingService {
    private isTrading = false;
    private currentBalance = 0;

    /**
     * Check if user has sufficient balance for bulk trades
     */
    async checkBalance(requiredAmount: number): Promise<boolean> {
        try {
            // Get balance from api_base
            const balance = api_base.api?.account?.balance || 0;
            this.currentBalance = balance;
            
            if (balance < requiredAmount) {
                console.warn(`Insufficient balance: ${balance} < ${requiredAmount}`);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error checking balance:', error);
            return false;
        }
    }

    /**
     * Place multiple contracts with rate limiting
     */
    async placeBulkTrades(config: BulkTradeConfig): Promise<BulkTradeStats> {
        const { proposalId, price, count, delayMs = 150 } = config;
        const startTime = Date.now();
        const results: BulkTradeResult[] = [];
        let successful = 0;
        let failed = 0;
        let totalCost = 0;

        // Check if already trading
        if (this.isTrading) {
            throw new Error('Bulk trading already in progress');
        }

        // Check balance
        const totalRequired = price * count;
        const hasBalance = await this.checkBalance(totalRequired);
        if (!hasBalance) {
            throw new Error(`Insufficient balance. Required: ${totalRequired}`);
        }

        this.isTrading = true;

        try {
            for (let i = 0; i < count; i++) {
                try {
                    // Add delay to avoid rate limiting (except for first request)
                    if (i > 0) {
                        await this.delay(delayMs);
                    }

                    // Place the contract
                    const response = await derivAPIService.buyContract(proposalId, price);

                    if (response && response.buy) {
                        results.push({
                            success: true,
                            contractId: response.buy.contract_id,
                            transactionId: response.buy.transaction_id,
                            buyPrice: response.buy.buy_price,
                            index: i + 1,
                        });
                        successful++;
                        totalCost += response.buy.buy_price;
                    } else {
                        results.push({
                            success: false,
                            error: 'Invalid response from API',
                            index: i + 1,
                        });
                        failed++;
                    }
                } catch (error: any) {
                    results.push({
                        success: false,
                        error: error.message || 'Unknown error',
                        index: i + 1,
                    });
                    failed++;
                    console.error(`Contract ${i + 1} failed:`, error);
                }
            }
        } finally {
            this.isTrading = false;
        }

        const endTime = Date.now();

        return {
            total: count,
            successful,
            failed,
            results,
            totalCost,
            startTime,
            endTime,
            duration: endTime - startTime,
        };
    }

    /**
     * Place bulk trades with Promise.allSettled for parallel processing
     * Note: Use with caution due to rate limiting
     */
    async placeBulkTradesParallel(config: BulkTradeConfig): Promise<BulkTradeStats> {
        const { proposalId, price, count } = config;
        const startTime = Date.now();

        // Check balance
        const totalRequired = price * count;
        const hasBalance = await this.checkBalance(totalRequired);
        if (!hasBalance) {
            throw new Error(`Insufficient balance. Required: ${totalRequired}`);
        }

        // Create array of promises with staggered delays
        const promises = Array.from({ length: count }, (_, i) =>
            this.delay(i * 100).then(() => derivAPIService.buyContract(proposalId, price))
        );

        // Execute all promises
        const settledResults = await Promise.allSettled(promises);

        // Process results
        const results: BulkTradeResult[] = [];
        let successful = 0;
        let failed = 0;
        let totalCost = 0;

        settledResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value?.buy) {
                results.push({
                    success: true,
                    contractId: result.value.buy.contract_id,
                    transactionId: result.value.buy.transaction_id,
                    buyPrice: result.value.buy.buy_price,
                    index: index + 1,
                });
                successful++;
                totalCost += result.value.buy.buy_price;
            } else {
                results.push({
                    success: false,
                    error: result.status === 'rejected' ? result.reason?.message : 'Unknown error',
                    index: index + 1,
                });
                failed++;
            }
        });

        const endTime = Date.now();

        return {
            total: count,
            successful,
            failed,
            results,
            totalCost,
            startTime,
            endTime,
            duration: endTime - startTime,
        };
    }

    /**
     * Cancel ongoing bulk trading
     */
    cancelBulkTrading() {
        this.isTrading = false;
    }

    /**
     * Check if bulk trading is in progress
     */
    isBulkTrading(): boolean {
        return this.isTrading;
    }

    /**
     * Set current balance (should be updated from API)
     */
    setBalance(balance: number) {
        this.currentBalance = balance;
    }

    /**
     * Utility: Delay function
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get proposal for bulk trading
     */
    async getBulkProposal(params: {
        contract_type: string;
        symbol: string;
        duration: number;
        duration_unit: string;
        basis: string;
        amount: number;
        barrier?: string;
    }) {
        try {
            // This would call the actual proposal API
            // For now, returning a mock structure
            return {
                proposal_id: 'mock_proposal_id',
                ask_price: params.amount,
            };
        } catch (error) {
            console.error('Error getting proposal:', error);
            throw error;
        }
    }
}

export const bulkTradingService = new BulkTradingService();
