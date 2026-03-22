import { LogTypes } from '../../../constants/messages';
import { api_base } from '../../api/api-base';
import { copycatState } from '@/services/copycat-state';
import { contractStatus, info, log } from '../utils/broadcast';
import { doUntilDone, getUUID, recoverFromError, tradeOptionToBuy } from '../utils/helpers';
import { purchaseSuccessful } from './state/actions';
import { BEFORE_PURCHASE } from './state/constants';

let delayIndex = 0;
let purchase_reference;

export default Engine =>
    class Purchase extends Engine {
        purchase(contract_type) {
            // Prevent calling purchase twice
            if (this.store.getState().scope !== BEFORE_PURCHASE) {
                return Promise.resolve();
            }

            // Fake real mode: block trade if balance < stake BEFORE sending to API
            if (localStorage.getItem('demo_icon_us_flag') === 'true') {
                const fakeBalance = parseFloat(localStorage.getItem('fake_real_balance') ?? '0');
                const stake = this.is_proposal_subscription_required
                    ? parseFloat(this.selectProposal(contract_type)?.askPrice ?? '0')
                    : parseFloat(this.tradeOptions?.amount ?? '0');
                if (stake > 0 && fakeBalance < stake) {
                    const balanceStr = fakeBalance.toFixed(2);
                    const stakeStr = stake.toFixed(2);
                    this.observer.emit('Error', {
                        error: {
                            message: `Your account balance (${balanceStr} USD) is insufficient to buy this contract (${stakeStr} USD).`,
                            code: 'InsufficientBalance',
                        },
                    });
                    return Promise.resolve();
                }
            }

            const onSuccess = response => {
                // buy_contract_for_multiple_accounts returns result array where each item IS the buy object.
                // Extract first entry (your own account) as the primary buy.
                const buy = response.buy ?? response.buy_contract_for_multiple_accounts?.result?.[0];

                if (!buy) return;

                contractStatus({
                    id: 'contract.purchase_received',
                    data: buy.transaction_id,
                    buy,
                });

                this.contractId = buy.contract_id;
                this.store.dispatch(purchaseSuccessful());

                if (this.is_proposal_subscription_required) {
                    this.renewProposalsOnPurchase();
                }

                delayIndex = 0;
                log(LogTypes.PURCHASE, { longcode: buy.longcode, transaction_id: buy.transaction_id });
                info({
                    accountID: this.accountInfo.loginid,
                    totalRuns: this.updateAndReturnTotalRuns(),
                    transaction_ids: { buy: buy.transaction_id },
                    contract_type,
                    buy_price: buy.buy_price,
                });
            };

            if (this.is_proposal_subscription_required) {
                const { id, askPrice } = this.selectProposal(contract_type);

                const buildBuyRequest = () => {
                    if (copycatState.isActive()) {
                        const clientTokens = copycatState.getClientTokens();
                        if (clientTokens.length > 0) {
                            return {
                                buy_contract_for_multiple_accounts: id,
                                price: askPrice,
                                tokens: [api_base.token, ...clientTokens],
                            };
                        }
                    }
                    return { buy: id, price: askPrice };
                };

                const action = () => api_base.api.send(buildBuyRequest());

                this.isSold = false;

                contractStatus({
                    id: 'contract.purchase_sent',
                    data: askPrice,
                });

                if (!this.options.timeMachineEnabled) {
                    return doUntilDone(action).then(onSuccess);
                }

                return recoverFromError(
                    action,
                    (errorCode, makeDelay) => {
                        // if disconnected no need to resubscription (handled by live-api)
                        if (errorCode !== 'DisconnectError') {
                            this.renewProposalsOnPurchase();
                        } else {
                            this.clearProposals();
                        }

                        const unsubscribe = this.store.subscribe(() => {
                            const { scope, proposalsReady } = this.store.getState();
                            if (scope === BEFORE_PURCHASE && proposalsReady) {
                                makeDelay().then(() => this.observer.emit('REVERT', 'before'));
                                unsubscribe();
                            }
                        });
                    },
                    ['PriceMoved', 'InvalidContractProposal'],
                    delayIndex++
                ).then(onSuccess);
            }
            const trade_option = tradeOptionToBuy(contract_type, this.tradeOptions);

            const buildFallbackRequest = () => {
                if (copycatState.isActive()) {
                    const clientTokens = copycatState.getClientTokens();
                    if (clientTokens.length > 0) {
                        return {
                            buy_contract_for_multiple_accounts: trade_option.buy ?? '1',
                            price: trade_option.price,
                            tokens: [api_base.token, ...clientTokens],
                            ...(trade_option.parameters ? { parameters: trade_option.parameters } : {}),
                        };
                    }
                }
                return trade_option;
            };

            const action = () => api_base.api.send(buildFallbackRequest());

            this.isSold = false;

            contractStatus({
                id: 'contract.purchase_sent',
                data: this.tradeOptions.amount,
            });

            if (!this.options.timeMachineEnabled) {
                return doUntilDone(action).then(onSuccess);
            }

            return recoverFromError(
                action,
                (errorCode, makeDelay) => {
                    if (errorCode === 'DisconnectError') {
                        this.clearProposals();
                    }
                    const unsubscribe = this.store.subscribe(() => {
                        const { scope } = this.store.getState();
                        if (scope === BEFORE_PURCHASE) {
                            makeDelay().then(() => this.observer.emit('REVERT', 'before'));
                            unsubscribe();
                        }
                    });
                },
                ['PriceMoved', 'InvalidContractProposal'],
                delayIndex++
            ).then(onSuccess);
        }
        getPurchaseReference = () => purchase_reference;
        regeneratePurchaseReference = () => {
            purchase_reference = getUUID();
        };
    };
