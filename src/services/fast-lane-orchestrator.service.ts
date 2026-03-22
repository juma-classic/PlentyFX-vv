import { makeAutoObservable, reaction } from 'mobx';
import { FastLaneStore } from '@/stores/fast-lane-store';
import type { TickData } from '@/types/fast-lane.types';
import { FastLaneExecutor } from './fast-lane-executor.service';
import { FastLaneRiskManager } from './fast-lane-risk-manager.service';
import { FastLaneStateMachine, fastLaneStateMachine } from './fast-lane-state-machine.service';
import { FastLaneStrategy } from './fast-lane-strategy.service';
import { FastLaneWebSocketService } from './fast-lane-websocket.service';

/**
 * Orchestrator Service
 * Main controller that coordinates all Fast Lane services
 * Implements the complete trading loop
 */
export class FastLaneOrchestrator {
    private store: FastLaneStore;
    private wsService: FastLaneWebSocketService;
    private stateMachine: FastLaneStateMachine;
    private riskManager: FastLaneRiskManager;
    private strategy: FastLaneStrategy;
    private executor: FastLaneExecutor;

    private isInitialized = false;
    private disposers: Array<() => void> = [];

    constructor() {
        // Initialize all services
        this.store = new FastLaneStore();
        this.wsService = new FastLaneWebSocketService(this.store);
        this.stateMachine = fastLaneStateMachine;
        this.riskManager = new FastLaneRiskManager(this.store);
        this.strategy = new FastLaneStrategy();
        this.executor = new FastLaneExecutor(this.store, this.wsService, this.stateMachine);

        makeAutoObservable(this);
    }

    /**
     * Initialize the orchestrator
     */
    async initialize(apiToken: string): Promise<void> {
        if (this.isInitialized) {
            this.store.addLog('warning', 'Already initialized');
            return;
        }

        try {
            this.store.addLog('info', 'Initializing Fast Lane...');

            // Connect WebSocket
            await this.wsService.connect(apiToken);

            // Setup tick reaction
            this.setupTickReaction();

            this.isInitialized = true;
            this.store.addLog('success', 'Fast Lane initialized successfully');
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.store.addLog('error', `Initialization failed: ${errorMsg}`);
            throw error;
        }
    }

    /**
     * Setup tick reaction for automated trading
     */
    private setupTickReaction(): void {
        // React to tick updates when auto-trading is enabled
        const disposer = reaction(
            () => this.store.lastTick,
            tick => {
                if (tick && this.store.config.autoTrade) {
                    this.evaluateAndTrade(tick);
                }
            }
        );

        this.disposers.push(disposer);
    }

    /**
     * Handle tick update from WebSocket
     */
    private handleTickUpdate(data: any): void {
        // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!data.tick) return;

        const tick: TickData = {
            epoch: data.tick.epoch,
            quote: data.tick.quote,
            symbol: data.tick.symbol,
        };

        this.store.setLastTick(tick);
    }

    /**
     * Evaluate tick and execute trade if conditions are met
     */
    private async evaluateAndTrade(tick: TickData): Promise<void> {
        try {
            // Only trade in IDLE state
            if (this.store.currentState !== 'IDLE') {
                return;
            }

            // Check risk limits
            const riskDecision = this.riskManager.canExecuteTrade();
            if (!riskDecision.allowed) {
                this.store.addLog('warning', `Trade blocked: ${riskDecision.reason}`);
                return;
            }

            // Evaluate strategy
            const strategyDecision = this.strategy.evaluateTick(tick, this.store.config.strategy);
            if (!strategyDecision.shouldTrade) {
                // Don't log every non-trade decision (too noisy)
                return;
            }

            this.store.addLog('info', `Strategy signal: ${strategyDecision.reason}`);

            // Execute trade
            await this.executor.executeTrade(strategyDecision);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.store.addLog('error', `Trade evaluation failed: ${errorMsg}`);
        }
    }

    /**
     * Start trading
     */
    async startTrading(): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('Orchestrator not initialized');
        }

        if (this.store.config.autoTrade) {
            this.store.addLog('warning', 'Trading already active');
            return;
        }

        this.store.addLog('info', 'Starting automated trading...');
        this.store.setAutoTrade(true);

        // Subscribe to ticks
        await this.wsService.subscribeTicks(this.store.config.symbol);

        this.store.addLog('success', 'Automated trading started');
    }

    /**
     * Stop trading
     */
    stopTrading(): void {
        if (!this.store.config.autoTrade) {
            this.store.addLog('warning', 'Trading not active');
            return;
        }

        this.store.addLog('info', 'Stopping automated trading...');
        this.store.setAutoTrade(false);

        // Disconnect will handle unsubscription
        // this.wsService.unsubscribeFromTicks();

        this.store.addLog('success', 'Automated trading stopped');
    }

    /**
     * Manual trade execution
     */
    async executeManualtrade(): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('Orchestrator not initialized');
        }

        const tick = this.store.lastTick;
        if (!tick) {
            throw new Error('No tick data available');
        }

        await this.evaluateAndTrade(tick);
    }

    /**
     * Shutdown orchestrator
     */
    async shutdown(): Promise<void> {
        this.store.addLog('info', 'Shutting down Fast Lane...');

        // Stop trading
        if (this.store.config.autoTrade) {
            this.stopTrading();
        }

        // Dispose reactions
        this.disposers.forEach(dispose => dispose());
        this.disposers = [];

        // Disconnect WebSocket
        this.wsService.disconnect();

        this.isInitialized = false;
        this.store.addLog('success', 'Fast Lane shutdown complete');
    }

    /**
     * Get all services (for advanced usage)
     */
    getServices() {
        return {
            store: this.store,
            wsService: this.wsService,
            stateMachine: this.stateMachine,
            riskManager: this.riskManager,
            strategy: this.strategy,
            executor: this.executor,
        };
    }

    /**
     * Get store (most common usage)
     */
    getStore(): FastLaneStore {
        return this.store;
    }

    /**
     * Check if initialized
     */
    isReady(): boolean {
        return this.isInitialized;
    }
}

// Singleton instance
let orchestratorInstance: FastLaneOrchestrator | null = null;

/**
 * Get or create orchestrator instance
 */
export function getFastLaneOrchestrator(): FastLaneOrchestrator {
    if (!orchestratorInstance) {
        orchestratorInstance = new FastLaneOrchestrator();
    }
    return orchestratorInstance;
}

/**
 * Reset orchestrator instance (for testing)
 */
export function resetFastLaneOrchestrator(): void {
    if (orchestratorInstance) {
        orchestratorInstance.shutdown();
        orchestratorInstance = null;
    }
}
