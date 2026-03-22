import { makeAutoObservable } from 'mobx';
import { FastLaneStore } from '@/stores/fast-lane-store';
import type { BuyRequest, ProposalRequest, StrategyDecision } from '@/types/fast-lane.types';
import { FastLaneStateMachine } from './fast-lane-state-machine.service';
import { FastLaneWebSocketService } from './fast-lane-websocket.service';
import { masterTradeIntegrationService } from './master-trade-integration.service';

/**
 * Executor Service
 * Handles actual API calls for trading
 * Manages proposal -> buy flow
 */
export class FastLaneExecutor {
    private store: FastLaneStore;
    private wsService: FastLaneWebSocketService;
    private stateMachine: FastLaneStateMachine;
    private currentProposalId: string | null = null;

    constructor(store: FastLaneStore, wsService: FastLaneWebSocketService, stateMachine: FastLaneStateMachine) {
        this.store = store;
        this.wsService = wsService;
        this.stateMachine = stateMachine;
        makeAutoObservable(this);
    }

    /**
     * Execute a trade based on strategy decision
     */
    async executeTrade(decision: StrategyDecision): Promise<void> {
        try {
            this.store.addLog('info', `Executing trade: ${decision.contractType}`);

            // Step 1: Request proposal
            await this.requestProposal(decision);

            // Step 2: Wait for proposal response (handled by WebSocket service)
            // Step 3: Buy contract (triggered by proposal response)
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.store.addLog('error', `Trade execution failed: ${errorMsg}`);
            this.stateMachine.transitionTo('ERROR');
            throw error;
        }
    }

    /**
     * Request a proposal from Deriv API
     */
    private async requestProposal(decision: StrategyDecision): Promise<void> {
        const { config } = this.store;

        // Transition to REQUESTING_PROPOSAL state
        this.stateMachine.transitionTo('REQUESTING_PROPOSAL');

        // Build proposal request
        const proposalRequest: ProposalRequest = {
            proposal: 1,
            amount: config.stake,
            basis: 'stake',
            contract_type: decision.contractType,
            currency: 'USD',
            duration: config.duration,
            duration_unit: config.durationUnit,
            symbol: config.symbol,
        };

        // Add barrier if needed
        if (decision.barrier !== undefined) {
            proposalRequest.barrier = decision.barrier.toString();
        }

        // Add prediction if needed (for DIGITMATCH)
        if (decision.prediction !== undefined) {
            proposalRequest.barrier = decision.prediction.toString();
        }

        this.store.addLog('info', `Requesting proposal: ${JSON.stringify(proposalRequest)}`);

        // Send proposal request
        this.wsService.send(proposalRequest);
    }

    /**
     * Handle proposal response
     * Called by WebSocket service when proposal arrives
     */
    handleProposalResponse(proposal: any): void {
        // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            if (proposal.error) {
                this.store.addLog('error', `Proposal error: ${proposal.error.message}`);
                this.stateMachine.transitionTo('ERROR');
                return;
            }

            const proposalData = proposal.proposal;
            this.currentProposalId = proposalData.id;

            this.store.addLog(
                'info',
                `Proposal received: ID=${proposalData.id}, Payout=${proposalData.payout}, Ask Price=${proposalData.ask_price}`
            );

            // Auto-buy if enabled
            if (this.store.config.autoBuy) {
                this.buyContract(proposalData.id, proposalData.ask_price);
            } else {
                // Wait for manual confirmation
                this.store.addLog('info', 'Waiting for manual buy confirmation');
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.store.addLog('error', `Proposal handling failed: ${errorMsg}`);
            this.stateMachine.transitionTo('ERROR');
        }
    }

    /**
     * Buy a contract
     */
    async buyContract(proposalId: string, price: number): Promise<void> {
        try {
            // Transition to BUYING state
            this.stateMachine.transitionTo('BUYING');

            const buyRequest: BuyRequest = {
                buy: proposalId,
                price,
            };

            this.store.addLog('info', `Buying contract: ID=${proposalId}, Price=${price}`);

            // Send buy request
            this.wsService.send(buyRequest);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.store.addLog('error', `Buy failed: ${errorMsg}`);
            this.stateMachine.transitionTo('ERROR');
            throw error;
        }
    }

    /**
     * Handle buy response
     * Called by WebSocket service when buy confirmation arrives
     */
    handleBuyResponse(buy: any): void {
        // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            if (buy.error) {
                this.store.addLog('error', `Buy error: ${buy.error.message}`);
                this.stateMachine.transitionTo('ERROR');
                return;
            }

            const buyData = buy.buy;
            const contractId = buyData.contract_id;

            this.store.addLog('success', `Contract purchased: ID=${contractId}, Buy Price=${buyData.buy_price}`);

            // 🔗 COPY TRADING INTEGRATION: Execute copy trades for clients
            try {
                console.log('🔗 Triggering copy trading for Fast Lane trade...');
                await masterTradeIntegrationService.onFastLaneTrade({
                    market: this.store.config.symbol,
                    contractType: buyData.contract_type,
                    stake: buyData.buy_price,
                    duration: this.store.config.duration,
                    durationUnit: this.store.config.durationUnit,
                    contractId: contractId,
                });
                console.log('✅ Copy trading executed successfully');
            } catch (copyError) {
                console.error('❌ Copy trading failed:', copyError);
                // Don't fail the main trade if copy trading fails
            }

            // Transition to TRADE_ACTIVE
            this.stateMachine.transitionTo('TRADE_ACTIVE');

            // Subscribe to contract updates
            this.subscribeToContract(contractId);

            // Add to trade history
            this.store.addTrade({
                id: contractId,
                timestamp: Date.now(),
                contractType: buyData.contract_type,
                stake: buyData.buy_price,
                payout: buyData.payout,
                status: 'active',
            });
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.store.addLog('error', `Buy response handling failed: ${errorMsg}`);
            this.stateMachine.transitionTo('ERROR');
        }
    }

    /**
     * Subscribe to contract updates
     */
    private subscribeToContract(contractId: string): void {
        this.wsService.send({
            proposal_open_contract: 1,
            contract_id: contractId,
            subscribe: 1,
        });

        this.store.addLog('info', `Subscribed to contract updates: ${contractId}`);
    }

    /**
     * Handle contract update
     * Called by WebSocket service when contract status changes
     */
    handleContractUpdate(contract: any): void {
        // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const contractData = contract.proposal_open_contract;

            if (!contractData) {
                return;
            }

            const contractId = contractData.contract_id;
            const status = contractData.status;
            const profit = contractData.profit;

            this.store.addLog('info', `Contract update: ID=${contractId}, Status=${status}, Profit=${profit}`);

            // Update trade in history
            this.store.updateTrade(contractId, {
                status: status === 'sold' ? 'closed' : 'active',
                profit: profit || 0,
                exitTime: status === 'sold' ? Date.now() : undefined,
            });

            // If contract is settled, return to IDLE
            if (status === 'sold' || status === 'lost' || status === 'won') {
                this.store.addLog(profit >= 0 ? 'success' : 'error', `Contract settled: Profit=${profit}`);

                // Unsubscribe from contract updates
                this.wsService.send({
                    forget: contractData.id,
                });

                // Return to IDLE state
                this.stateMachine.transitionTo('IDLE');
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.store.addLog('error', `Contract update handling failed: ${errorMsg}`);
        }
    }

    /**
     * Cancel current proposal
     */
    cancelProposal(): void {
        if (this.currentProposalId) {
            this.wsService.send({
                forget: this.currentProposalId,
            });
            this.currentProposalId = null;
            this.store.addLog('info', 'Proposal cancelled');
        }
    }

    /**
     * Get current proposal ID
     */
    getCurrentProposalId(): string | null {
        return this.currentProposalId;
    }
}
