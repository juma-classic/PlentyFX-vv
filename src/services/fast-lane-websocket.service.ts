/**
 * Fast Lane WebSocket Service
 * Manages Deriv API WebSocket connections for tick-based trading
 */

import { FastLaneStore } from '@/stores/fast-lane-store';
import {
    BalanceData,
    ContractData,
    ProposalResponse,
    TickData,
    TradingMode,
    TradingState,
} from '@/types/fast-lane.types';
import { fastLaneStateMachine } from './fast-lane-state-machine.service';

export class FastLaneWebSocketService {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000;
    private pingInterval: NodeJS.Timeout | null = null;
    private subscriptions: Map<string, string> = new Map(); // subscription_id -> type
    private store: FastLaneStore;
    // private messageHandlers: Map<string, (data: any) => void> = new Map(); // eslint-disable-line @typescript-eslint/no-explicit-any

    constructor(store: FastLaneStore) {
        this.store = store;
    }

    /**
     * Connect to Deriv WebSocket
     */
    async connect(apiToken: string): Promise<boolean> {
        try {
            // Determine endpoint based on mode
            const endpoint =
                this.store.mode === TradingMode.DEMO
                    ? 'wss://ws.derivws.com/websockets/v3?app_id=1089'
                    : 'wss://ws.derivws.com/websockets/v3?app_id=1089';

            this.store.addLog('info', `Connecting to ${this.store.mode.toUpperCase()} server...`);

            this.ws = new WebSocket(endpoint);

            return new Promise((resolve, reject) => {
                if (!this.ws) {
                    reject(new Error('WebSocket not initialized'));
                    return;
                }

                this.ws.onopen = () => {
                    this.store.addLog('success', 'WebSocket connected');
                    fastLaneStateMachine.transition(TradingState.CONNECTED);
                    this.reconnectAttempts = 0;
                    this.startPing();

                    // Authorize
                    this.authorize(apiToken).then(resolve).catch(reject);
                };

                this.ws.onmessage = event => {
                    this.handleMessage(event.data);
                };

                this.ws.onerror = error => {
                    this.store.addError('WS_ERROR', 'WebSocket error occurred');
                    console.error('WebSocket error:', error);
                };

                this.ws.onclose = () => {
                    this.store.addLog('warning', 'WebSocket closed');
                    fastLaneStateMachine.transition(TradingState.DISCONNECTED);
                    this.stopPing();
                    this.attemptReconnect(apiToken);
                };
            });
        } catch (error) {
            this.store.addError('CONNECT_ERROR', error instanceof Error ? error.message : 'Connection failed');
            return false;
        }
    }

    /**
     * Authorize with API token
     */
    private async authorize(apiToken: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            const authRequest = {
                authorize: apiToken,
            };

            // Store callback for response
            const messageHandler = (event: MessageEvent) => {
                const data = JSON.parse(event.data);

                if (data.msg_type === 'authorize') {
                    if (data.error) {
                        this.store.addError('AUTH_ERROR', data.error.message);
                        this.ws?.removeEventListener('message', messageHandler);
                        reject(new Error(data.error.message));
                    } else {
                        this.store.addLog('success', `Authorized as: ${data.authorize.loginid}`);
                        this.store.setApiToken(apiToken);
                        fastLaneStateMachine.transition(TradingState.AUTHORIZED);
                        this.ws?.removeEventListener('message', messageHandler);

                        // Get balance
                        this.getBalance();

                        resolve(true);
                    }
                }
            };

            this.ws.addEventListener('message', messageHandler);
            this.send(authRequest);
        });
    }

    /**
     * Subscribe to tick stream
     */
    async subscribeTicks(symbol: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            const ticksRequest = {
                ticks: symbol,
                subscribe: 1,
            };

            const messageHandler = (event: MessageEvent) => {
                const data = JSON.parse(event.data);

                if (data.msg_type === 'tick') {
                    // Store subscription ID
                    if (data.subscription) {
                        this.subscriptions.set(data.subscription.id, 'ticks');
                    }

                    this.store.addLog('success', `Subscribed to ${symbol} ticks`);
                    fastLaneStateMachine.transition(TradingState.SUBSCRIBED);
                    this.ws?.removeEventListener('message', messageHandler);
                    resolve(true);
                } else if (data.error) {
                    this.store.addError('SUBSCRIBE_ERROR', data.error.message);
                    this.ws?.removeEventListener('message', messageHandler);
                    reject(new Error(data.error.message));
                }
            };

            this.ws.addEventListener('message', messageHandler);
            this.send(ticksRequest);
        });
    }

    /**
     * Get balance
     */
    private getBalance(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const balanceRequest = {
            balance: 1,
            subscribe: 1,
        };

        this.send(balanceRequest);
    }

    /**
     * Handle incoming messages
     */
    private handleMessage(data: string): void {
        try {
            const message = JSON.parse(data);

            // Handle different message types
            switch (message.msg_type) {
                case 'tick':
                    this.handleTick(message);
                    break;
                case 'balance':
                    this.handleBalance(message);
                    break;
                case 'proposal':
                    this.handleProposal(message);
                    break;
                case 'buy':
                    this.handleBuy(message);
                    break;
                case 'proposal_open_contract':
                    this.handleContractUpdate(message);
                    break;
                default:
                    // Log other messages for debugging
                    console.log('[FastLane WS]', message.msg_type, message);
            }
        } catch (error) {
            this.store.addError('PARSE_ERROR', 'Failed to parse message');
        }
    }

    /**
     * Handle tick data
     */
    private handleTick(message: Record<string, any>): void {
        // eslint-disable-line @typescript-eslint/no-explicit-any
        const tick: TickData = {
            epoch: message.tick.epoch,
            quote: message.tick.quote,
            symbol: message.tick.symbol,
        };

        this.store.updateTick(tick);

        // Transition to IDLE if subscribed
        if (this.store.state === TradingState.SUBSCRIBED) {
            fastLaneStateMachine.transition(TradingState.IDLE);
        }
    }

    /**
     * Handle balance update
     */
    private handleBalance(message: Record<string, any>): void {
        // eslint-disable-line @typescript-eslint/no-explicit-any
        const balance: BalanceData = {
            balance: parseFloat(message.balance.balance),
            currency: message.balance.currency,
            loginid: message.balance.loginid,
        };

        this.store.updateBalance(balance);
    }

    /**
     * Handle proposal response
     */
    private handleProposal(message: Record<string, any>): void {
        // eslint-disable-line @typescript-eslint/no-explicit-any
        if (message.error) {
            this.store.addError('PROPOSAL_ERROR', message.error.message);
            fastLaneStateMachine.transition(TradingState.IDLE);
            return;
        }

        const proposal: ProposalResponse = {
            id: message.proposal.id,
            ask_price: parseFloat(message.proposal.ask_price),
            payout: parseFloat(message.proposal.payout),
            spot: parseFloat(message.proposal.spot),
        };

        this.store.setProposal(proposal);
    }

    /**
     * Handle buy response
     */
    private handleBuy(message: Record<string, any>): void {
        // eslint-disable-line @typescript-eslint/no-explicit-any
        if (message.error) {
            this.store.addError('BUY_ERROR', message.error.message);
            fastLaneStateMachine.transition(TradingState.IDLE);
            return;
        }

        const contract: ContractData = {
            contract_id: message.buy.contract_id,
            buy_price: parseFloat(message.buy.buy_price),
            payout: parseFloat(message.buy.payout),
            status: 'open',
        };

        this.store.setActiveTrade(contract);
        fastLaneStateMachine.transition(TradingState.TRADE_ACTIVE);
    }

    /**
     * Handle contract update
     */
    private handleContractUpdate(message: Record<string, any>): void {
        // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!this.store.activeTrade) return;

        const contract = message.proposal_open_contract;

        this.store.setActiveTrade({
            ...this.store.activeTrade,
            current_spot: parseFloat(contract.current_spot),
            profit: parseFloat(contract.profit),
            status: contract.status,
        });

        // Check if contract is settled
        if (contract.is_sold || contract.status !== 'open') {
            fastLaneStateMachine.transition(TradingState.IDLE);
        }
    }

    /**
     * Send message
     */
    private send(data: Record<string, unknown>): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    /**
     * Start ping interval
     */
    private startPing(): void {
        this.pingInterval = setInterval(() => {
            this.send({ ping: 1 });
        }, 30000); // Ping every 30 seconds
    }

    /**
     * Stop ping interval
     */
    private stopPing(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    /**
     * Attempt reconnection
     */
    private attemptReconnect(apiToken: string): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.store.addError('RECONNECT_FAILED', 'Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        this.store.addLog(
            'warning',
            `Reconnecting... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );

        setTimeout(() => {
            this.connect(apiToken);
        }, this.reconnectDelay);
    }

    /**
     * Disconnect
     */
    disconnect(): void {
        if (this.ws) {
            this.stopPing();
            this.ws.close();
            this.ws = null;
        }

        fastLaneStateMachine.transition(TradingState.DISCONNECTED);
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}

// Export service class only - no singleton needed here
