/**
 * Signal Trading Service
 * Handles automated trading from signals with tracking
 */

import { api_base } from '@/external/bot-skeleton/services/api/api-base';
import { derivAPIService } from './deriv-api.service';
import { masterTradeIntegrationService } from './master-trade-integration.service';

export interface SignalTradeConfig {
    signalId: string;
    market: string;
    type: string;
    stake: number;
    duration: number;
    durationUnit: 't' | 'm' | 'h';
    barrier?: string;
    // Advanced options
    numberOfRuns?: number;
    takeProfit?: number;
    stopLoss?: number;
    useMartingale?: boolean;
    martingaleMultiplier?: number;
}

export interface SignalTradeResult {
    success: boolean;
    contractId?: number;
    transactionId?: number;
    buyPrice?: number;
    profit?: number;
    isWon?: boolean;
    error?: string;
    signalId: string;
    timestamp: number;
    // Additional trade details
    market?: string;
    type?: string;
    contractType?: string;
    stake?: number;
    duration?: number;
    durationUnit?: string;
}

export interface SignalTradeStats {
    totalTrades: number;
    wins: number;
    losses: number;
    totalProfit: number;
    winRate: number;
    averageProfit: number;
    bestTrade: number;
    worstTrade: number;
    todayTrades: number;
    todayProfit: number;
    lastHourTrades: number;
}

export interface RiskManagementConfig {
    maxTradesPerHour: number;
    maxTradesPerDay: number;
    maxDailyLoss: number;
    maxDailyProfit: number;
    stopOnLossStreak: number;
    enabled: boolean;
}

export interface AutoTradeConfig {
    enabled: boolean;
    minConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
    allowedMarkets: string[];
    allowedTypes: string[];
    stake: number;
    // Smart auto-trade settings
    smartMode: boolean;
    adaptiveStake: boolean;
    minStake: number;
    maxStake: number;
    stopOnLossStreak: number;
    increaseOnWinStreak: boolean;
    pauseDuringLosses: boolean;
    pauseAfterLosses: number; // Number of losses before pausing
    // Advanced trading options
    numberOfRuns: number;
    takeProfit: number;
    stopLoss: number;
    useMartingale: boolean;
    martingaleMultiplier: number;
    // Duration settings
    tradeDuration: number;
    quickTradeMode: boolean;
}

export interface ProfitGoal {
    daily: number;
    weekly: number;
    monthly: number;
}

export interface StreakInfo {
    current: number;
    type: 'win' | 'loss' | 'none';
    best: number;
    worst: number;
}

class SignalTradingService {
    private tradeHistory: SignalTradeResult[] = [];
    private activeContracts = new Map<number, SignalTradeConfig>();
    private onTradeUpdate: ((result: SignalTradeResult) => void) | null = null;
    private onTradeComplete: ((result: SignalTradeResult) => void) | null = null;

    // Risk Management
    private riskConfig: RiskManagementConfig = {
        maxTradesPerHour: 10,
        maxTradesPerDay: 50,
        maxDailyLoss: 100,
        maxDailyProfit: 500,
        stopOnLossStreak: 5,
        enabled: true,
    };

    // Auto-Trade
    private autoTradeConfig: AutoTradeConfig = {
        enabled: false,
        minConfidence: 'HIGH',
        allowedMarkets: ['R_50', 'R_100', '1HZ100V'],
        allowedTypes: ['RISE', 'FALL'],
        stake: 1, // Will be synced with StakeManager on initialization
        smartMode: false,
        adaptiveStake: true,
        minStake: 0.35,
        maxStake: 10,
        stopOnLossStreak: 5,
        increaseOnWinStreak: true,
        pauseDuringLosses: true,
        pauseAfterLosses: 3,
        numberOfRuns: 1,
        takeProfit: 0,
        stopLoss: 0,
        useMartingale: false,
        martingaleMultiplier: 2,
        tradeDuration: 5,
        quickTradeMode: false,
    };

    private lossStreak: number = 0;
    private winStreak: number = 0;
    private bestWinStreak: number = 0;
    private worstLossStreak: number = 0;

    constructor() {
        // Initialize sync with StakeManager
        this.syncWithStakeManager().catch(console.warn);

        // Subscribe to StakeManager changes for real-time sync
        this.subscribeToStakeManagerChanges();
    }

    /**
     * Subscribe to StakeManager changes for real-time sync
     */
    private async subscribeToStakeManagerChanges(): Promise<void> {
        try {
            const { stakeManager } = await import('@/services/stake-manager.service');

            stakeManager.subscribe(settings => {
                // Update auto-trade config when StakeManager changes
                this.autoTradeConfig.stake = settings.stake;
                this.autoTradeConfig.martingaleMultiplier = settings.martingale;

                console.log('🔄 Auto-trade config updated from StakeManager:', {
                    stake: settings.stake,
                    martingale: settings.martingale,
                    timestamp: settings.timestamp,
                });
            });
        } catch (error) {
            console.warn('⚠️ Failed to subscribe to StakeManager changes:', error);
        }
    }

    // Profit Goals
    private profitGoals: ProfitGoal = {
        daily: 10,
        weekly: 50,
        monthly: 200,
    };

    // Smart auto-trade learning
    private performanceByType: Map<string, { wins: number; losses: number; totalProfit: number }> = new Map();
    private performanceByMarket: Map<string, { wins: number; losses: number; totalProfit: number }> = new Map();
    private isPaused: boolean = false;

    /**
     * Execute multiple runs with advanced options
     */
    async executeMultipleRuns(
        config: SignalTradeConfig,
        callback?: (result: SignalTradeResult, runNumber: number, totalRuns: number) => void
    ): Promise<{ results: SignalTradeResult[]; totalProfit: number; wins: number; losses: number }> {
        const numberOfRuns = config.numberOfRuns || 1;
        const takeProfit = config.takeProfit || 0;
        const stopLoss = config.stopLoss || 0;
        const useMartingale = config.useMartingale || false;
        const martingaleMultiplier = config.martingaleMultiplier || 2;

        const results: SignalTradeResult[] = [];
        let totalProfit = 0;
        let wins = 0;
        let losses = 0;
        // VALIDATE STAKE BEFORE STARTING
        let currentStake = this.validateStake(config.stake, 'executeMultipleRuns');

        console.log(`🔄 Starting ${numberOfRuns} runs with:`, {
            initialStake: config.stake,
            takeProfit,
            stopLoss,
            useMartingale,
        });

        for (let i = 0; i < numberOfRuns; i++) {
            const runNumber = i + 1;
            console.log(`\n📍 Run ${runNumber}/${numberOfRuns} - Stake: $${currentStake.toFixed(2)}`);

            // Execute single trade
            const result = await this.executeSignalTrade({ ...config, stake: currentStake }, singleResult => {
                if (callback) callback(singleResult, runNumber, numberOfRuns);
            });

            results.push(result);

            // Update totals
            if (result.profit !== undefined) {
                totalProfit += result.profit;
                if (result.isWon) {
                    wins++;
                    // Reset stake on win if using martingale
                    if (useMartingale) {
                        currentStake = this.validateStake(config.stake, 'martingale-reset');
                        console.log('✅ Win! Resetting stake to:', currentStake);
                    }
                } else {
                    losses++;
                    // Double stake on loss if using martingale
                    if (useMartingale) {
                        currentStake = this.validateStake(currentStake * martingaleMultiplier, 'martingale-increase');
                        console.log('❌ Loss! Increasing stake to:', currentStake);
                    }
                }
            }

            console.log(
                `💰 Run ${runNumber} result: ${result.profit?.toFixed(2) || 'Pending'} | Total: ${totalProfit.toFixed(2)}`
            );

            // Check take profit
            if (takeProfit > 0 && totalProfit >= takeProfit) {
                console.log(`🎯 Take profit reached! ${totalProfit.toFixed(2)} >= ${takeProfit}`);
                break;
            }

            // Check stop loss
            if (stopLoss > 0 && totalProfit <= -stopLoss) {
                console.log(`🛑 Stop loss reached! ${totalProfit.toFixed(2)} <= -${stopLoss}`);
                break;
            }

            // Wait a bit between runs
            if (i < numberOfRuns - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`\n✅ Completed ${results.length} runs:`, {
            totalProfit: totalProfit.toFixed(2),
            wins,
            losses,
            winRate: results.length > 0 ? ((wins / results.length) * 100).toFixed(1) + '%' : '0%',
        });

        return { results, totalProfit, wins, losses };
    }

    /**
     * Execute trade from signal
     */
    async executeSignalTrade(
        config: SignalTradeConfig,
        callback?: (result: SignalTradeResult) => void
    ): Promise<SignalTradeResult> {
        try {
            // STRICT VALIDATION: Ensure stake is valid
            if (!config.stake || config.stake <= 0 || isNaN(config.stake)) {
                const errorResult: SignalTradeResult = {
                    success: false,
                    error: `Invalid stake amount: ${config.stake}. Must be greater than 0.`,
                    signalId: config.signalId,
                    timestamp: Date.now(),
                };
                console.error('❌ Invalid stake:', config.stake);
                alert(`Invalid stake amount: ${config.stake}. Please set a valid stake amount.`);
                return errorResult;
            }

            // Ensure stake meets minimum requirement
            if (config.stake < 0.35) {
                const errorResult: SignalTradeResult = {
                    success: false,
                    error: `Stake too low: ${config.stake}. Minimum is $0.35.`,
                    signalId: config.signalId,
                    timestamp: Date.now(),
                };
                console.error('❌ Stake below minimum:', config.stake);
                alert(`Stake too low: $${config.stake}. Minimum stake is $0.35.`);
                return errorResult;
            }

            console.log('🎯 Starting signal trade execution:', config);
            console.log('💰 Validated stake:', config.stake);

            // Check if API is available
            if (!api_base.api) {
                const errorResult: SignalTradeResult = {
                    success: false,
                    error: 'API not connected. Please wait for connection or refresh the page.',
                    signalId: config.signalId,
                    timestamp: Date.now(),
                };
                console.error('❌ API not connected');
                this.addToHistory(errorResult);
                if (callback) callback(errorResult);
                alert('API not connected. Please refresh the page and try again.');
                return errorResult;
            }

            // Check if authenticated
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                const errorResult: SignalTradeResult = {
                    success: false,
                    error: 'Not authenticated. Please login first.',
                    signalId: config.signalId,
                    timestamp: Date.now(),
                };
                console.error('❌ Not authenticated');
                this.addToHistory(errorResult);
                if (callback) callback(errorResult);
                alert('Please login with your Deriv account first.');
                return errorResult;
            }

            console.log('✅ API connected and authenticated');

            // Get contract type from signal type
            const contractType = this.getContractType(config.type);
            console.log('📋 Contract type:', contractType);

            // Get barrier for OVER/UNDER contracts
            const barrier = config.barrier || this.getBarrier(config.type);
            if (barrier) {
                console.log('🎲 Using barrier:', barrier, 'for type:', config.type);
            }

            // Final stake validation before API call
            const validatedStake = this.validateStake(config.stake, 'pre-proposal');
            console.log('💰 Final validated stake:', validatedStake);

            // Get proposal
            console.log('📝 Getting proposal...');
            const proposal = await this.getProposal({
                contractType,
                symbol: config.market,
                stake: validatedStake,
                duration: config.duration,
                durationUnit: config.durationUnit,
                barrier,
            });

            if (!proposal || !proposal.proposal) {
                const error = proposal?.error as { message?: string } | undefined;
                const errorMsg = error?.message || 'Failed to get proposal';
                const errorResult: SignalTradeResult = {
                    success: false,
                    error: errorMsg,
                    signalId: config.signalId,
                    timestamp: Date.now(),
                };
                console.error('❌ Proposal failed:', errorMsg);
                console.error('📋 Proposal request details:', {
                    contractType,
                    symbol: config.market,
                    stake: validatedStake,
                    duration: config.duration,
                    durationUnit: config.durationUnit,
                    barrier,
                });
                this.addToHistory(errorResult);
                if (callback) callback(errorResult);

                // More helpful error message
                let userMessage = `Trade failed: ${errorMsg}`;
                if (errorMsg.includes('stake') || errorMsg.includes('amount')) {
                    userMessage += `\n\nStake used: $${validatedStake}\nPlease check your stake settings.`;
                }
                alert(userMessage);
                return errorResult;
            }

            const proposalData = proposal.proposal as { id?: string } | undefined;
            console.log('✅ Proposal received:', proposalData?.id);

            // Buy contract
            console.log('💰 Buying contract...');
            const buyResponse = await derivAPIService.buyContract(proposalData?.id || '', config.stake);

            if (!buyResponse || !buyResponse.buy) {
                const errorMsg = 'Failed to buy contract';
                const errorResult: SignalTradeResult = {
                    success: false,
                    error: errorMsg,
                    signalId: config.signalId,
                    timestamp: Date.now(),
                };
                console.error('❌ Buy failed:', errorMsg);
                this.addToHistory(errorResult);
                if (callback) callback(errorResult);
                alert(`Trade failed: ${errorMsg}`);
                return errorResult;
            }

            console.log('✅ Contract purchased:', buyResponse.buy.contract_id);
            console.log('📝 This trade will appear in Transactions tab');

            // Store active contract
            if (buyResponse.buy?.contract_id) {
                this.activeContracts.set(buyResponse.buy.contract_id, config);

                // Add metadata to identify this as a signal trade
                if (typeof window !== 'undefined') {
                    const signalTrades = JSON.parse(localStorage.getItem('signal_trades') || '{}');
                    signalTrades[buyResponse.buy.contract_id] = {
                        signalId: config.signalId,
                        timestamp: Date.now(),
                        market: config.market,
                        type: config.type,
                    };
                    localStorage.setItem('signal_trades', JSON.stringify(signalTrades));
                }

                // 🔗 COPY TRADING INTEGRATION: Execute copy trades for clients
                try {
                    console.log('🔗 Triggering copy trading for signal trade...');
                    await masterTradeIntegrationService.onSignalTrade({
                        signalId: config.signalId,
                        market: config.market,
                        contractType: config.type,
                        stake: config.stake,
                        duration: config.duration,
                        durationUnit: config.durationUnit,
                        barrier: config.barrier,
                        contractId: buyResponse.buy.contract_id,
                    });
                    console.log('✅ Copy trading executed successfully');
                } catch (copyError) {
                    console.error('❌ Copy trading failed:', copyError);
                    // Don't fail the main trade if copy trading fails
                }

                // Monitor contract
                this.monitorContract(buyResponse.buy.contract_id, config.signalId, callback);
            }

            const result: SignalTradeResult = {
                success: true,
                contractId: buyResponse.buy?.contract_id,
                transactionId: buyResponse.buy?.transaction_id,
                buyPrice: buyResponse.buy?.buy_price,
                signalId: config.signalId,
                timestamp: Date.now(),
                market: config.market,
                type: config.type,
                contractType,
                stake: config.stake,
                duration: config.duration,
                durationUnit: config.durationUnit,
            };

            console.log('✅ Signal trade executed successfully:', result);
            console.log('⏳ Monitoring contract for result...');

            // Add to history immediately with pending status so it shows up
            this.addToHistory(result);

            return result;
        } catch (error) {
            const errorMsg = (error as Error).message;
            const errorResult: SignalTradeResult = {
                success: false,
                error: errorMsg,
                signalId: config.signalId,
                timestamp: Date.now(),
            };
            console.error('❌ Trade execution error:', errorMsg, error);
            this.addToHistory(errorResult);
            if (callback) callback(errorResult);
            alert(`Trade failed: ${errorMsg}`);
            return errorResult;
        }
    }

    /**
     * Validate and fix stake amount
     */
    private validateStake(stake: number, context: string = 'trade'): number {
        if (!stake || stake <= 0 || isNaN(stake)) {
            console.error(`❌ Invalid stake in ${context}:`, stake, '- Using $1.00');
            alert(`❌ Invalid stake detected: ${stake}. Using $1.00 instead. Please check your auto-trade settings.`);
            return 1;
        }
        if (stake < 0.35) {
            console.error(`❌ Stake below minimum in ${context}:`, stake, '- Using $0.35');
            alert(`❌ Stake too low: ${stake}. Using minimum $0.35 instead.`);
            return 0.35;
        }
        return Number(stake.toFixed(2));
    }

    /**
     * Get contract type from signal type
     */
    private getContractType(signalType: string): string {
        const typeMap: Record<string, string> = {
            RISE: 'CALL',
            FALL: 'PUT',
            EVEN: 'DIGITEVEN',
            ODD: 'DIGITODD',
            OVER1: 'DIGITOVER',
            OVER2: 'DIGITOVER',
            OVER3: 'DIGITOVER',
            OVER4: 'DIGITOVER',
            OVER5: 'DIGITOVER',
            OVER6: 'DIGITOVER',
            OVER7: 'DIGITOVER',
            OVER8: 'DIGITOVER',
            UNDER1: 'DIGITUNDER',
            UNDER2: 'DIGITUNDER',
            UNDER3: 'DIGITUNDER',
            UNDER4: 'DIGITUNDER',
            UNDER5: 'DIGITUNDER',
            UNDER6: 'DIGITUNDER',
            UNDER7: 'DIGITUNDER',
            UNDER8: 'DIGITUNDER',
        };
        return typeMap[signalType] || 'CALL';
    }

    /**
     * Get barrier for OVER/UNDER contracts
     */
    private getBarrier(signalType: string): string | undefined {
        const barrierMap: Record<string, string> = {
            OVER1: '1',
            OVER2: '2',
            OVER3: '3',
            OVER4: '4',
            OVER5: '5',
            OVER6: '6',
            OVER7: '7',
            OVER8: '8',
            UNDER1: '1',
            UNDER2: '2',
            UNDER3: '3',
            UNDER4: '4',
            UNDER5: '5',
            UNDER6: '6',
            UNDER7: '7',
            UNDER8: '8',
        };
        return barrierMap[signalType];
    }

    /**
     * Get proposal
     */
    private async getProposal(params: {
        contractType: string;
        symbol: string;
        stake: number;
        duration: number;
        durationUnit: string;
        barrier?: string;
    }): Promise<Record<string, unknown> | null> {
        const proposal: Record<string, unknown> = {
            proposal: 1,
            amount: params.stake,
            basis: 'stake',
            contract_type: params.contractType,
            currency: 'USD',
            duration: params.duration,
            duration_unit: params.durationUnit,
            symbol: params.symbol,
        };

        // Add barrier for digit contracts
        if (params.barrier) {
            proposal.barrier = params.barrier;
        }

        try {
            return await api_base.api?.send(proposal);
        } catch (error) {
            console.error('Error getting proposal:', error);
            return null;
        }
    }

    /**
     * Monitor contract
     */
    private async monitorContract(
        contractId: number,
        signalId: string,
        callback?: (result: SignalTradeResult) => void
    ): Promise<void> {
        try {
            console.log('👀 Starting to monitor contract:', contractId);

            const proposalOpenContract = {
                proposal_open_contract: 1,
                contract_id: contractId,
                subscribe: 1,
            };

            const response = await api_base.api?.send(proposalOpenContract);
            const subscription = response?.subscription as { id?: string } | undefined;
            console.log('📡 Subscription response:', subscription?.id);

            if (subscription?.id) {
                const messageSubscription = api_base.api?.onMessage().subscribe((message: Record<string, unknown>) => {
                    if (message.proposal_open_contract) {
                        const contract = message.proposal_open_contract as Record<string, unknown>;
                        if (Number(contract.contract_id) === contractId) {
                            this.handleContractUpdate(contract, signalId, callback);
                        }
                    }
                });

                api_base.pushSubscription({
                    id: subscription.id,
                    unsubscribe: () => {
                        console.log('🔌 Unsubscribing from contract:', contractId);
                        messageSubscription?.unsubscribe();
                    },
                });

                console.log('✅ Successfully subscribed to contract updates');
            } else {
                console.error('❌ Failed to subscribe to contract updates');
            }

            // FALLBACK: Poll contract status every 2 seconds as backup
            // This ensures we get updates even if WebSocket subscription fails
            const pollInterval = setInterval(async () => {
                try {
                    // Check if contract is still active
                    if (!this.activeContracts.has(contractId)) {
                        console.log('⏹️ Contract no longer active, stopping polling:', contractId);
                        clearInterval(pollInterval);
                        return;
                    }

                    console.log('🔄 Polling contract status:', contractId);
                    const statusResponse = await api_base.api?.send({
                        proposal_open_contract: 1,
                        contract_id: contractId,
                    });

                    if (statusResponse?.proposal_open_contract) {
                        const contract = statusResponse.proposal_open_contract as Record<string, unknown>;
                        this.handleContractUpdate(contract, signalId, callback);

                        // Stop polling if contract is sold
                        if (contract.is_sold || contract.status === 'sold') {
                            console.log('✅ Contract completed via polling, stopping:', contractId);
                            clearInterval(pollInterval);
                        }
                    }
                } catch (error) {
                    console.error('❌ Error polling contract:', error);
                }
            }, 2000); // Poll every 2 seconds

            // Stop polling after 5 minutes (max contract duration)
            setTimeout(
                () => {
                    clearInterval(pollInterval);
                    console.log('⏱️ Polling timeout reached for contract:', contractId);
                },
                5 * 60 * 1000
            );
        } catch (error) {
            console.error('❌ Error monitoring contract:', error);
        }
    }

    /**
     * Handle contract update
     */
    private handleContractUpdate(
        contract: Record<string, unknown>,
        signalId: string,
        callback?: (result: SignalTradeResult) => void
    ): void {
        const contractId = Number(contract.contract_id);
        const status = contract.status as string;
        const isSold = contract.is_sold === 1 || contract.is_sold === true || status === 'sold';

        // Log all updates for debugging
        console.log('📊 Contract update:', {
            id: contractId,
            status,
            is_sold: contract.is_sold,
            profit: contract.profit,
            isSold,
        });

        if (isSold) {
            const profit = Number(contract.profit) || 0;
            const isWon = profit > 0;

            // Get the original trade config
            const config = this.activeContracts.get(contractId);

            // Find and update the existing trade in history
            const existingTradeIndex = this.tradeHistory.findIndex(t => t.contractId === contractId);

            if (existingTradeIndex !== -1) {
                // Update existing trade with result
                const updatedTrade = {
                    ...this.tradeHistory[existingTradeIndex],
                    profit,
                    isWon,
                    timestamp: Date.now(), // Update to completion time
                };
                this.tradeHistory[existingTradeIndex] = updatedTrade;
                console.log('✅ Updated existing trade in history:', {
                    contractId,
                    profit: profit.toFixed(2),
                    isWon,
                });
            } else {
                // Add new trade if not found (shouldn't happen but just in case)
                const result: SignalTradeResult = {
                    success: true,
                    contractId,
                    profit,
                    isWon,
                    signalId,
                    timestamp: Date.now(),
                    market: config?.market,
                    type: config?.type,
                    contractType: config ? this.getContractType(config.type) : undefined,
                    stake: config?.stake,
                    duration: config?.duration,
                    durationUnit: config?.durationUnit,
                };
                this.addToHistory(result);
                console.log('✅ Added completed trade to history:', result);
            }

            // Update streaks
            if (isWon) {
                this.lossStreak = 0;
                this.winStreak++;
                if (this.winStreak > this.bestWinStreak) {
                    this.bestWinStreak = this.winStreak;
                }
            } else {
                this.winStreak = 0;
                this.lossStreak++;
                if (this.lossStreak > this.worstLossStreak) {
                    this.worstLossStreak = this.lossStreak;
                }
            }

            // Update performance tracking for smart auto-trade
            if (config) {
                this.updatePerformanceTracking(config.type, config.market, isWon, profit);
            }

            // Check if should pause auto-trade
            if (this.autoTradeConfig.pauseDuringLosses && this.lossStreak >= this.autoTradeConfig.pauseAfterLosses) {
                this.isPaused = true;
                console.log(`⏸️ Auto-trade paused after ${this.lossStreak} consecutive losses`);
            }

            const resultMessage = isWon ? '🎉 Signal Trade Won!' : '😔 Signal Trade Lost';
            console.log(resultMessage, `Profit: ${profit >= 0 ? '+' : ''}${profit.toFixed(2)} USD`);
            console.log(`📊 Streaks - Win: ${this.winStreak}, Loss: ${this.lossStreak}`);

            // Show notification
            const notificationResult: SignalTradeResult = {
                success: true,
                contractId,
                profit,
                isWon,
                signalId,
                timestamp: Date.now(),
            };
            this.showNotification(notificationResult);

            if (callback) callback(notificationResult);
            if (this.onTradeUpdate) this.onTradeUpdate(notificationResult);
            if (this.onTradeComplete) this.onTradeComplete(notificationResult);

            // Remove from active contracts
            this.activeContracts.delete(contractId);
            console.log('🗑️ Removed contract from active list:', contractId);

            // Unsubscribe
            const contractSubscription = contract.subscription as { id?: string } | undefined;
            if (contractSubscription?.id) {
                derivAPIService.unsubscribe(contractSubscription.id);
            }
        } else {
            // Contract still open
            console.log('⏳ Contract still open:', contractId, 'Status:', status);
        }
    }

    /**
     * Show browser notification
     */
    private showNotification(result: SignalTradeResult): void {
        if ('Notification' in window && Notification.permission === 'granted') {
            const title = result.isWon ? '🎉 Trade Won!' : '😔 Trade Lost';
            const body = `Profit: ${result.profit?.toFixed(2)} USD`;
            new Notification(title, { body, icon: '/favicon-pink.svg' });
        }
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission(): Promise<boolean> {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }

    /**
     * Add to history
     */
    private addToHistory(result: SignalTradeResult): void {
        this.tradeHistory.push(result);
        // Keep last 100 trades
        if (this.tradeHistory.length > 100) {
            this.tradeHistory.shift();
        }
    }

    /**
     * Get statistics
     */
    getStats(): SignalTradeStats {
        // Only count trades that have completed (have profit data)
        const completedTrades = this.tradeHistory.filter(t => t.profit !== undefined && t.success);
        const wins = completedTrades.filter(t => t.isWon === true).length;
        const losses = completedTrades.filter(t => t.isWon === false).length;
        const totalProfit = completedTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
        const winRate = completedTrades.length > 0 ? (wins / completedTrades.length) * 100 : 0;
        const averageProfit = completedTrades.length > 0 ? totalProfit / completedTrades.length : 0;
        const profits = completedTrades.map(t => t.profit || 0);
        const bestTrade = profits.length > 0 ? Math.max(...profits) : 0;
        const worstTrade = profits.length > 0 ? Math.min(...profits) : 0;

        // Today's stats
        const todayStart = new Date().setHours(0, 0, 0, 0);
        const todayTrades = completedTrades.filter(t => t.timestamp > todayStart);
        const todayProfit = todayTrades.reduce((sum, t) => sum + (t.profit || 0), 0);

        // Last hour stats - count ALL trades (including pending)
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const lastHourTrades = this.tradeHistory.filter(t => t.timestamp > oneHourAgo).length;

        console.log('📊 Stats calculated:', {
            total: completedTrades.length,
            wins,
            losses,
            totalProfit: totalProfit.toFixed(2),
            winRate: winRate.toFixed(1) + '%',
            lastHour: lastHourTrades,
        });

        return {
            totalTrades: completedTrades.length,
            wins,
            losses,
            totalProfit,
            winRate,
            averageProfit,
            bestTrade,
            worstTrade,
            todayTrades: todayTrades.length,
            todayProfit,
            lastHourTrades,
        };
    }

    /**
     * Get trade history
     */
    getHistory(): SignalTradeResult[] {
        // Return only completed trades (with profit data)
        return this.tradeHistory.filter(t => t.profit !== undefined && t.success);
    }

    /**
     * Get all trades including pending
     */
    getAllTrades(): SignalTradeResult[] {
        return [...this.tradeHistory];
    }

    /**
     * Get active contracts count
     */
    getActiveCount(): number {
        return this.activeContracts.size;
    }

    /**
     * Set trade update callback
     */
    setTradeUpdateCallback(callback: (result: SignalTradeResult) => void): void {
        this.onTradeUpdate = callback;
    }

    /**
     * Clear history
     */
    clearHistory(): void {
        this.tradeHistory = [];
        this.lossStreak = 0;
    }

    /**
     * Check if trading is allowed based on risk management
     */
    canTrade(): { allowed: boolean; reason?: string } {
        if (!this.riskConfig.enabled) {
            return { allowed: true };
        }

        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const todayStart = new Date().setHours(0, 0, 0, 0);

        // Check trades per hour
        const lastHourTrades = this.tradeHistory.filter(t => t.timestamp > oneHourAgo).length;
        if (lastHourTrades >= this.riskConfig.maxTradesPerHour) {
            return { allowed: false, reason: `Max trades per hour reached (${this.riskConfig.maxTradesPerHour})` };
        }

        // Check trades per day
        const todayTrades = this.tradeHistory.filter(t => t.timestamp > todayStart).length;
        if (todayTrades >= this.riskConfig.maxTradesPerDay) {
            return { allowed: false, reason: `Max trades per day reached (${this.riskConfig.maxTradesPerDay})` };
        }

        // Check daily loss limit
        const todayProfit = this.tradeHistory
            .filter(t => t.timestamp > todayStart && t.profit !== undefined)
            .reduce((sum, t) => sum + (t.profit || 0), 0);

        if (todayProfit <= -this.riskConfig.maxDailyLoss) {
            return { allowed: false, reason: `Daily loss limit reached (${this.riskConfig.maxDailyLoss})` };
        }

        // Check daily profit limit (stop when target reached)
        if (todayProfit >= this.riskConfig.maxDailyProfit) {
            return { allowed: false, reason: `Daily profit target reached (${this.riskConfig.maxDailyProfit})` };
        }

        // Check loss streak
        if (this.lossStreak >= this.riskConfig.stopOnLossStreak) {
            return { allowed: false, reason: `Loss streak limit reached (${this.riskConfig.stopOnLossStreak})` };
        }

        return { allowed: true };
    }

    /**
     * Update risk management config
     */
    setRiskConfig(config: Partial<RiskManagementConfig>): void {
        this.riskConfig = { ...this.riskConfig, ...config };
        console.log('Risk config updated:', this.riskConfig);
    }

    /**
     * Get risk management config
     */
    getRiskConfig(): RiskManagementConfig {
        return { ...this.riskConfig };
    }

    /**
     * Update auto-trade config
     */
    setAutoTradeConfig(config: Partial<AutoTradeConfig>): void {
        this.autoTradeConfig = { ...this.autoTradeConfig, ...config };
        console.log('Auto-trade config updated:', this.autoTradeConfig);
    }

    /**
     * Get auto-trade config
     */
    getAutoTradeConfig(): AutoTradeConfig {
        return { ...this.autoTradeConfig };
    }

    /**
     * Check if signal should be auto-traded
     */
    shouldAutoTrade(signal: { confidence: string; market: string; type: string; status: string }): boolean {
        if (!this.autoTradeConfig.enabled) return false;
        if (this.isPaused) {
            console.log('⏸️ Auto-trade is paused');
            return false;
        }
        if (signal.status !== 'ACTIVE') return false;

        // Check confidence
        const confidenceLevels = { LOW: 1, MEDIUM: 2, HIGH: 3 };
        const minLevel = confidenceLevels[this.autoTradeConfig.minConfidence];
        const signalLevel = confidenceLevels[signal.confidence as keyof typeof confidenceLevels];
        if (signalLevel < minLevel) return false;

        // Check market
        if (!this.autoTradeConfig.allowedMarkets.includes(signal.market)) return false;

        // Check type
        if (!this.autoTradeConfig.allowedTypes.includes(signal.type)) return false;

        // Smart mode filtering
        if (this.autoTradeConfig.smartMode) {
            if (!this.shouldTradeBasedOnPerformance(signal.type, signal.market)) {
                console.log('🧠 Smart mode blocked trade:', signal.type, signal.market);
                return false;
            }
        }

        // Check risk management
        const canTrade = this.canTrade();
        if (!canTrade.allowed) {
            console.log('Auto-trade blocked:', canTrade.reason);
            return false;
        }

        return true;
    }

    /**
     * Smart mode: Check if should trade based on historical performance
     */
    private shouldTradeBasedOnPerformance(type: string, market: string): boolean {
        const typePerf = this.performanceByType.get(type);
        const marketPerf = this.performanceByMarket.get(market);

        // Need at least 5 trades to make a decision
        const minTrades = 5;

        // Check type performance
        if (typePerf) {
            const totalTrades = typePerf.wins + typePerf.losses;
            if (totalTrades >= minTrades) {
                const winRate = typePerf.wins / totalTrades;
                // Don't trade if win rate is below 40%
                if (winRate < 0.4) {
                    console.log(`🧠 Type ${type} has low win rate: ${(winRate * 100).toFixed(1)}%`);
                    return false;
                }
            }
        }

        // Check market performance
        if (marketPerf) {
            const totalTrades = marketPerf.wins + marketPerf.losses;
            if (totalTrades >= minTrades) {
                const winRate = marketPerf.wins / totalTrades;
                // Don't trade if win rate is below 40%
                if (winRate < 0.4) {
                    console.log(`🧠 Market ${market} has low win rate: ${(winRate * 100).toFixed(1)}%`);
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Sync auto-trade config with StakeManager settings
     */
    async syncWithStakeManager(): Promise<void> {
        try {
            const { stakeManager } = await import('@/services/stake-manager.service');
            const currentStake = stakeManager.getStake();
            const currentMartingale = stakeManager.getMartingale();

            // Update auto-trade config with StakeManager values
            this.autoTradeConfig.stake = currentStake;
            this.autoTradeConfig.martingaleMultiplier = currentMartingale;

            console.log('🔄 Auto-trade config synced with StakeManager:', {
                stake: currentStake,
                martingale: currentMartingale,
                source: 'StakeManager',
            });
        } catch (error) {
            console.warn('⚠️ Failed to sync with StakeManager:', error);
        }
    }

    /**
     * Get optimal stake - now uses StakeManager as base
     */
    async getOptimalStake(): Promise<number> {
        // Sync with StakeManager first
        await this.syncWithStakeManager();

        // Get base stake from StakeManager (via auto-trade config)
        let baseStake = this.autoTradeConfig.stake;

        // STRICT VALIDATION: Ensure base stake is valid
        if (!baseStake || baseStake <= 0 || isNaN(baseStake)) {
            console.error('❌ Invalid base stake:', baseStake, '- Using minimum $0.35');
            baseStake = 0.35;
        }

        if (!this.autoTradeConfig.adaptiveStake) {
            return Math.max(0.35, Number(baseStake.toFixed(2)));
        }

        let stake = baseStake;

        // Increase stake on win streak
        if (this.autoTradeConfig.increaseOnWinStreak && this.winStreak >= 3) {
            const multiplier = 1 + this.winStreak * 0.1; // 10% increase per win
            stake = stake * Math.min(multiplier, 2); // Max 2x
            console.log(`📈 Increasing stake due to ${this.winStreak} win streak: ${stake.toFixed(2)}`);
        }

        // Decrease stake on loss streak
        if (this.lossStreak >= 2) {
            const multiplier = 1 - this.lossStreak * 0.15; // 15% decrease per loss
            stake = stake * Math.max(multiplier, 0.5); // Min 0.5x
            console.log(`📉 Decreasing stake due to ${this.lossStreak} loss streak: ${stake.toFixed(2)}`);
        }

        // Clamp to min/max with strict validation
        const minStake = Math.max(0.35, this.autoTradeConfig.minStake || 0.35);
        const maxStake = Math.max(minStake, this.autoTradeConfig.maxStake || 10);
        stake = Math.max(minStake, Math.min(stake, maxStake));

        // Final validation
        const finalStake = Number(stake.toFixed(2));
        if (finalStake < 0.35) {
            console.error('❌ Calculated stake below minimum:', finalStake, '- Using $0.35');
            return 0.35;
        }

        return finalStake;
    }

    /**
     * Update performance tracking
     */
    private updatePerformanceTracking(type: string, market: string, isWon: boolean, profit: number): void {
        // Update type performance
        const typePerf = this.performanceByType.get(type) || { wins: 0, losses: 0, totalProfit: 0 };
        if (isWon) {
            typePerf.wins++;
        } else {
            typePerf.losses++;
        }
        typePerf.totalProfit += profit;
        this.performanceByType.set(type, typePerf);

        // Update market performance
        const marketPerf = this.performanceByMarket.get(market) || { wins: 0, losses: 0, totalProfit: 0 };
        if (isWon) {
            marketPerf.wins++;
        } else {
            marketPerf.losses++;
        }
        marketPerf.totalProfit += profit;
        this.performanceByMarket.set(market, marketPerf);
    }

    /**
     * Set trade complete callback
     */
    setTradeCompleteCallback(callback: (result: SignalTradeResult) => void): void {
        this.onTradeComplete = callback;
    }

    /**
     * Export trade history as CSV
     */
    exportHistory(): string {
        const headers = [
            'Timestamp',
            'Market',
            'Signal Type',
            'Contract Type',
            'Stake',
            'Duration',
            'Profit',
            'Result',
            'Contract ID',
            'Signal ID',
            'Error',
        ];
        const rows = this.tradeHistory.map(t => [
            new Date(t.timestamp).toISOString(),
            t.market || 'N/A',
            t.type || 'N/A',
            t.contractType || 'N/A',
            t.stake?.toFixed(2) || 'N/A',
            t.duration ? `${t.duration}${t.durationUnit}` : 'N/A',
            t.profit?.toFixed(2) || 'N/A',
            t.isWon ? 'WIN' : t.profit !== undefined ? 'LOSS' : 'PENDING',
            t.contractId || 'N/A',
            t.signalId,
            t.error || '',
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        return csv;
    }

    /**
     * Download trade history
     */
    downloadHistory(): void {
        const csv = this.exportHistory();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `signal-trades-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Manually check contract status (for debugging stuck contracts)
     */
    async checkContractStatus(contractId: number): Promise<void> {
        try {
            console.log('🔍 Manually checking contract status:', contractId);
            const response = await api_base.api?.send({
                proposal_open_contract: 1,
                contract_id: contractId,
            });

            if (response?.proposal_open_contract) {
                console.log('📊 Contract status:', response.proposal_open_contract);
                const contract = response.proposal_open_contract as Record<string, unknown>;

                // Find the signal ID for this contract
                const config = this.activeContracts.get(contractId);
                if (config) {
                    this.handleContractUpdate(contract, config.signalId);
                }
            }
        } catch (error) {
            console.error('❌ Error checking contract status:', error);
        }
    }

    /**
     * Get active contracts for debugging
     */
    getActiveContracts(): Map<number, SignalTradeConfig> {
        return new Map(this.activeContracts);
    }

    /**
     * Manually refresh all pending trades
     * Call this if trades are stuck on pending
     */
    async refreshAllPendingTrades(): Promise<void> {
        console.log('🔄 Refreshing all pending trades...');

        // Get all pending trades (those without profit data)
        const pendingTrades = this.tradeHistory.filter(t => t.profit === undefined && t.contractId);

        console.log(`Found ${pendingTrades.length} pending trades to refresh`);

        for (const trade of pendingTrades) {
            if (trade.contractId) {
                try {
                    console.log('🔍 Checking contract:', trade.contractId);
                    const response = await api_base.api?.send({
                        proposal_open_contract: 1,
                        contract_id: trade.contractId,
                    });

                    if (response?.proposal_open_contract) {
                        const contract = response.proposal_open_contract as Record<string, unknown>;
                        const config = this.activeContracts.get(trade.contractId);
                        if (config) {
                            this.handleContractUpdate(contract, trade.signalId);
                        }
                    }

                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    console.error('❌ Error refreshing contract:', trade.contractId, error);
                }
            }
        }

        console.log('✅ Finished refreshing pending trades');
    }

    /**
     * Get current streak information
     */
    getStreakInfo(): StreakInfo {
        return {
            current: this.winStreak > 0 ? this.winStreak : this.lossStreak,
            type: this.winStreak > 0 ? 'win' : this.lossStreak > 0 ? 'loss' : 'none',
            best: this.bestWinStreak,
            worst: this.worstLossStreak,
        };
    }

    /**
     * Set profit goals
     */
    setProfitGoals(goals: Partial<ProfitGoal>): void {
        this.profitGoals = { ...this.profitGoals, ...goals };
        console.log('🎯 Profit goals updated:', this.profitGoals);
    }

    /**
     * Get profit goals
     */
    getProfitGoals(): ProfitGoal {
        return { ...this.profitGoals };
    }

    /**
     * Get profit goal progress
     */
    getProfitGoalProgress(): {
        daily: { current: number; goal: number; percentage: number; achieved: boolean };
        weekly: { current: number; goal: number; percentage: number; achieved: boolean };
        monthly: { current: number; goal: number; percentage: number; achieved: boolean };
    } {
        const now = Date.now();
        const todayStart = new Date().setHours(0, 0, 0, 0);
        const weekStart = now - 7 * 24 * 60 * 60 * 1000;
        const monthStart = now - 30 * 24 * 60 * 60 * 1000;

        const completedTrades = this.tradeHistory.filter(t => t.profit !== undefined);

        const dailyProfit = completedTrades
            .filter(t => t.timestamp > todayStart)
            .reduce((sum, t) => sum + (t.profit || 0), 0);

        const weeklyProfit = completedTrades
            .filter(t => t.timestamp > weekStart)
            .reduce((sum, t) => sum + (t.profit || 0), 0);

        const monthlyProfit = completedTrades
            .filter(t => t.timestamp > monthStart)
            .reduce((sum, t) => sum + (t.profit || 0), 0);

        return {
            daily: {
                current: dailyProfit,
                goal: this.profitGoals.daily,
                percentage: (dailyProfit / this.profitGoals.daily) * 100,
                achieved: dailyProfit >= this.profitGoals.daily,
            },
            weekly: {
                current: weeklyProfit,
                goal: this.profitGoals.weekly,
                percentage: (weeklyProfit / this.profitGoals.weekly) * 100,
                achieved: weeklyProfit >= this.profitGoals.weekly,
            },
            monthly: {
                current: monthlyProfit,
                goal: this.profitGoals.monthly,
                percentage: (monthlyProfit / this.profitGoals.monthly) * 100,
                achieved: monthlyProfit >= this.profitGoals.monthly,
            },
        };
    }

    /**
     * Resume auto-trade if paused
     */
    resumeAutoTrade(): void {
        this.isPaused = false;
        console.log('▶️ Auto-trade resumed');
    }

    /**
     * Check if auto-trade is paused
     */
    isAutoTradePaused(): boolean {
        return this.isPaused;
    }

    /**
     * Get performance by type
     */
    getPerformanceByType(): Map<string, { wins: number; losses: number; totalProfit: number; winRate: number }> {
        const result = new Map();
        this.performanceByType.forEach((perf, type) => {
            const total = perf.wins + perf.losses;
            result.set(type, {
                ...perf,
                winRate: total > 0 ? (perf.wins / total) * 100 : 0,
            });
        });
        return result;
    }

    /**
     * Get performance by market
     */
    getPerformanceByMarket(): Map<string, { wins: number; losses: number; totalProfit: number; winRate: number }> {
        const result = new Map();
        this.performanceByMarket.forEach((perf, market) => {
            const total = perf.wins + perf.losses;
            result.set(market, {
                ...perf,
                winRate: total > 0 ? (perf.wins / total) * 100 : 0,
            });
        });
        return result;
    }

    /**
     * Get trade duration based on settings
     */
    getTradeDuration(): number {
        if (this.autoTradeConfig.quickTradeMode) {
            return 1; // 1 tick for quick trade mode
        }
        return this.autoTradeConfig.tradeDuration || 5;
    }
}

export const signalTradingService = new SignalTradingService();
