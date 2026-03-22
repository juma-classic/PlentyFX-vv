/**
 * Fast Lane State Machine Service
 * Manages state transitions for tick-based trading system
 */

import { fastLaneStore } from '@/stores/fast-lane-store';
import { TradingState } from '@/types/fast-lane.types';

export class FastLaneStateMachine {
    private static instance: FastLaneStateMachine;

    private constructor() {}

    public static getInstance(): FastLaneStateMachine {
        if (!FastLaneStateMachine.instance) {
            FastLaneStateMachine.instance = new FastLaneStateMachine();
        }
        return FastLaneStateMachine.instance;
    }

    /**
     * Transition to a new state with validation
     */
    transition(newState: TradingState): boolean {
        const currentState = fastLaneStore.state;

        // Validate transition
        if (!this.isValidTransition(currentState, newState)) {
            fastLaneStore.addLog('error', `Invalid transition: ${currentState} -> ${newState}`);
            return false;
        }

        // Execute transition
        fastLaneStore.setState(newState);
        this.onStateEnter(newState);

        return true;
    }

    /**
     * Check if transition is valid
     */
    private isValidTransition(from: TradingState, to: TradingState): boolean {
        const validTransitions: Record<TradingState, TradingState[]> = {
            [TradingState.DISCONNECTED]: [TradingState.CONNECTED, TradingState.ERROR],
            [TradingState.CONNECTED]: [TradingState.AUTHORIZED, TradingState.DISCONNECTED, TradingState.ERROR],
            [TradingState.AUTHORIZED]: [TradingState.SUBSCRIBED, TradingState.DISCONNECTED, TradingState.ERROR],
            [TradingState.SUBSCRIBED]: [TradingState.IDLE, TradingState.DISCONNECTED, TradingState.ERROR],
            [TradingState.IDLE]: [TradingState.REQUESTING_PROPOSAL, TradingState.DISCONNECTED, TradingState.ERROR],
            [TradingState.REQUESTING_PROPOSAL]: [TradingState.BUYING, TradingState.IDLE, TradingState.ERROR],
            [TradingState.BUYING]: [TradingState.TRADE_ACTIVE, TradingState.IDLE, TradingState.ERROR],
            [TradingState.TRADE_ACTIVE]: [TradingState.IDLE, TradingState.ERROR],
            [TradingState.ERROR]: [TradingState.DISCONNECTED, TradingState.IDLE],
        };

        return validTransitions[from]?.includes(to) || false;
    }

    /**
     * Handle state entry actions
     */
    private onStateEnter(state: TradingState): void {
        switch (state) {
            case TradingState.DISCONNECTED:
                this.onDisconnected();
                break;
            case TradingState.CONNECTED:
                this.onConnected();
                break;
            case TradingState.AUTHORIZED:
                this.onAuthorized();
                break;
            case TradingState.SUBSCRIBED:
                this.onSubscribed();
                break;
            case TradingState.IDLE:
                this.onIdle();
                break;
            case TradingState.REQUESTING_PROPOSAL:
                this.onRequestingProposal();
                break;
            case TradingState.BUYING:
                this.onBuying();
                break;
            case TradingState.TRADE_ACTIVE:
                this.onTradeActive();
                break;
            case TradingState.ERROR:
                this.onError();
                break;
        }
    }

    // State entry handlers
    private onDisconnected(): void {
        fastLaneStore.addLog('info', '🔴 Disconnected from server');
        fastLaneStore.setConnected(false);
        fastLaneStore.setAuthorized(false);
    }

    private onConnected(): void {
        fastLaneStore.addLog('success', '🟢 Connected to server');
        fastLaneStore.setConnected(true);
    }

    private onAuthorized(): void {
        fastLaneStore.addLog('success', '✅ Authorized successfully');
        fastLaneStore.setAuthorized(true);
    }

    private onSubscribed(): void {
        fastLaneStore.addLog('success', '📡 Subscribed to tick stream');
    }

    private onIdle(): void {
        fastLaneStore.addLog('info', '⏸️ Ready to trade');
        // Clear proposal and active trade
        fastLaneStore.setProposal(null);
        fastLaneStore.setActiveTrade(null);
    }

    private onRequestingProposal(): void {
        fastLaneStore.addLog('info', '📋 Requesting proposal...');
    }

    private onBuying(): void {
        fastLaneStore.addLog('info', '💰 Executing purchase...');
    }

    private onTradeActive(): void {
        fastLaneStore.addLog('success', '📈 Trade active - monitoring...');
    }

    private onError(): void {
        fastLaneStore.addLog('error', '❌ Error state - attempting recovery');
    }

    /**
     * Get current state
     */
    getCurrentState(): TradingState {
        return fastLaneStore.state;
    }

    /**
     * Check if can transition to state
     */
    canTransitionTo(state: TradingState): boolean {
        return this.isValidTransition(fastLaneStore.state, state);
    }

    /**
     * Force transition (use with caution)
     */
    forceTransition(state: TradingState): void {
        fastLaneStore.addLog('warning', `Force transition to: ${state}`);
        fastLaneStore.setState(state);
        this.onStateEnter(state);
    }

    /**
     * Reset to initial state
     */
    reset(): void {
        this.forceTransition(TradingState.DISCONNECTED);
        fastLaneStore.reset();
    }
}

export const fastLaneStateMachine = FastLaneStateMachine.getInstance();
