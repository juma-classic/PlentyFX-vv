import { useEffect, useState } from 'react';
import { lazy, Suspense, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { CurrencyIcon } from '@/components/currency/currency-icon';
import { addComma, getDecimalPlaces } from '@/components/shared';
import Popover from '@/components/shared_ui/popover';
import { api_base } from '@/external/bot-skeleton';
import { useOauth2 } from '@/hooks/auth/useOauth2';
import { useApiBase } from '@/hooks/useApiBase';
import { useFakeRealBalanceSync } from '@/hooks/useFakeRealBalanceSync';
import { useStore } from '@/hooks/useStore';
import { fakeAccountService } from '@/services/fake-account.service';
import { fakeRealBalanceTracker } from '@/services/fake-real-balance-tracker.service';
import { waitForDomElement } from '@/utils/dom-observer';
import { localize } from '@deriv-com/translations';
import { AccountSwitcher as UIAccountSwitcher, Loader, useDevice } from '@deriv-com/ui';
import DemoAccounts from './common/demo-accounts';
import RealAccounts from './common/real-accounts';
import { TAccountSwitcher, TAccountSwitcherProps, TModifiedAccount } from './common/types';
import { LOW_RISK_COUNTRIES } from './utils';
import './account-switcher.scss';

const AccountInfoWallets = lazy(() => import('./wallets/account-info-wallets'));

const tabs_labels = {
    demo: localize('Demo'),
    real: localize('Real'),
};

const RenderAccountItems = ({
    isVirtual,
    modifiedCRAccountList,
    modifiedMFAccountList,
    modifiedVRTCRAccountList,
    switchAccount,
    activeLoginId,
    client,
    currentViewTab,
}: TAccountSwitcherProps) => {
    const { oAuthLogout } = useOauth2({ handleLogout: async () => client.logout(), client });
    const is_low_risk_country = LOW_RISK_COUNTRIES().includes(client.account_settings?.country_code ?? '');
    const is_virtual = !!isVirtual;

    useEffect(() => {
        // Update the max-height from the accordion content set from deriv-com/ui
        const parent_container = document.getElementsByClassName('account-switcher-panel')?.[0] as HTMLDivElement;
        if (!isVirtual && parent_container) {
            parent_container.style.maxHeight = '70vh';
            waitForDomElement('.deriv-accordion__content', parent_container)?.then((accordionElement: unknown) => {
                const element = accordionElement as HTMLDivElement;
                if (element) {
                    element.style.maxHeight = '70vh';
                }
            });
        }
    }, [isVirtual]);

    if (is_virtual) {
        return (
            <>
                <DemoAccounts
                    modifiedVRTCRAccountList={modifiedVRTCRAccountList as TModifiedAccount[]}
                    switchAccount={switchAccount}
                    activeLoginId={activeLoginId}
                    isVirtual={is_virtual}
                    tabs_labels={tabs_labels}
                    oAuthLogout={oAuthLogout}
                    is_logging_out={client.is_logging_out}
                    currentViewTab={currentViewTab}
                />
            </>
        );
    } else {
        return (
            <RealAccounts
                modifiedCRAccountList={modifiedCRAccountList as TModifiedAccount[]}
                modifiedMFAccountList={modifiedMFAccountList as TModifiedAccount[]}
                switchAccount={switchAccount}
                isVirtual={is_virtual}
                tabs_labels={tabs_labels}
                is_low_risk_country={is_low_risk_country}
                oAuthLogout={oAuthLogout}
                loginid={activeLoginId}
                is_logging_out={client.is_logging_out}
            />
        );
    }
};

const AccountSwitcher = observer(({ activeAccount }: TAccountSwitcher) => {
    const { isDesktop } = useDevice();
    const { accountList } = useApiBase();
    const { ui, run_panel, client } = useStore();
    const { accounts } = client;
    const { toggleAccountsDialog, is_accounts_switcher_on, account_switcher_disabled_message } = ui;
    const { is_stop_button_visible } = run_panel;
    const has_wallet = Object.keys(accounts).some(id => accounts[id].account_category === 'wallet');

    // Auto-sync fake real balance with demo trading
    const { currentFakeBalance } = useFakeRealBalanceSync();
    
    // Check if fake real mode is active (declare early so it can be used in useMemo)
    const isFakeRealMode = fakeAccountService.isFakeRealModeActive() && Boolean(activeAccount?.is_virtual);
    
    // Track which tab should be active (0 = Real, 1 = Demo)
    const [activeTabIndex, setActiveTabIndex] = useState<number>(
        isFakeRealMode ? 0 : (activeAccount?.is_virtual ? 1 : 0)
    );

    // Track which tab is currently being viewed (for pause/resume tracking)
    const [currentViewTab, setCurrentViewTab] = useState<'real' | 'demo'>(
        isFakeRealMode ? 'real' : (activeAccount?.is_virtual ? 'demo' : 'real')
    );
    
    // Force re-render when fake balance updates
    const [, setBalanceUpdateTrigger] = useState(0);
    useEffect(() => {
        const handleBalanceUpdate = () => {
            setBalanceUpdateTrigger(prev => prev + 1);
        };
        window.addEventListener('fake-real-balance-updated', handleBalanceUpdate);
        return () => window.removeEventListener('fake-real-balance-updated', handleBalanceUpdate);
    }, []);

    // Update active tab when fake real mode or account changes
    useEffect(() => {
        if (isFakeRealMode) {
            setActiveTabIndex(0); // Force Real tab in fake real mode
        } else {
            setActiveTabIndex(activeAccount?.is_virtual ? 1 : 0); // Normal behavior
        }
    }, [isFakeRealMode, activeAccount?.is_virtual]);

    // Pause/resume balance tracking based on current tab view
    useEffect(() => {
        if (!isFakeRealMode) return;

        if (currentViewTab === 'demo') {
            fakeRealBalanceTracker.pauseTracking();
        } else {
            fakeRealBalanceTracker.resumeTracking();
        }
    }, [currentViewTab, isFakeRealMode]);

    // Listen for tab clicks to detect when user switches between Real and Demo tabs
    useEffect(() => {
        if (!isFakeRealMode) return;

        const handleTabClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const tabButton = target.closest('[role="tab"]');
            
            if (tabButton) {
                const tabText = tabButton.textContent?.trim().toLowerCase();
                
                if (tabText === 'real') {
                    setCurrentViewTab('real');
                    console.log('📊 Switched to Real tab - tracking RESUMED');
                } else if (tabText === 'demo') {
                    setCurrentViewTab('demo');
                    console.log('📊 Switched to Demo tab - tracking PAUSED');
                }
            }
        };

        document.addEventListener('click', handleTabClick);
        return () => document.removeEventListener('click', handleTabClick);
    }, [isFakeRealMode]);

    const modifiedAccountList = useMemo(() => {
        return accountList?.map(account => {
            // Use fake account service to check if this is a fake account
            const isFakeAccount = fakeAccountService.isFakeAccount(account?.loginid || '');

            // Use static balance for fake accounts, API balance for real accounts
            let balance;
            if (isFakeAccount) {
                // Static fake balances - no API calls
                balance = fakeAccountService.getFakeAccountBalance(account?.loginid || '');
                fakeAccountService.logFakeAccountInteraction('balance_fetch', account?.loginid || '', { balance });
            } else {
                // Real API balance
                balance = addComma(
                    client.all_accounts_balance?.accounts?.[account?.loginid]?.balance?.toFixed(
                        getDecimalPlaces(account.currency)
                    ) ?? '0'
                );
            }

            return {
                ...account,
                balance,
                currencyLabel: account?.is_virtual
                    ? tabs_labels.demo
                    : (client.website_status?.currencies_config?.[account?.currency]?.name ?? account?.currency),
                icon: (
                    <CurrencyIcon
                        currency={account?.currency?.toLowerCase()}
                        isVirtual={Boolean(account?.is_virtual)}
                    />
                ),
                isVirtual: Boolean(account?.is_virtual),
                isActive: account?.loginid === activeAccount?.loginid,
            };
        });
    }, [
        accountList,
        client.all_accounts_balance?.accounts,
        client.website_status?.currencies_config,
        activeAccount?.loginid,
        activeAccount?.is_virtual, // Add dependency for fake mode detection
    ]);
    const modifiedCRAccountList = useMemo(() => {
        return modifiedAccountList?.filter(account => account?.loginid?.includes('CR')) ?? [];
    }, [modifiedAccountList]);

    const modifiedMFAccountList = useMemo(() => {
        return modifiedAccountList?.filter(account => account?.loginid?.includes('MF')) ?? [];
    }, [modifiedAccountList]);

    const modifiedVRTCRAccountList = useMemo(() => {
        const vrtAccounts = modifiedAccountList?.filter(account => account?.loginid?.includes('VRT')) ?? [];
        
        // In fake real mode, ensure demo accounts keep their Demo icon
        if (isFakeRealMode) {
            return vrtAccounts.map(account => ({
                ...account,
                icon: <CurrencyIcon currency='virtual' isVirtual={true} />, // Force Demo icon
                isVirtual: true, // Ensure it's marked as virtual
                is_virtual: 1, // Ensure backend flag is set
            }));
        }
        
        return vrtAccounts;
    }, [modifiedAccountList, isFakeRealMode]);

    const switchAccount = async (loginId: number) => {
        // In fake real mode, handle demo account clicks specially
        const isDemo = loginId.toString().startsWith('VRT');
        if (isFakeRealMode && isDemo) {
            console.log('✅ Switching to Demo view - showing demo balance and icon');
            setCurrentViewTab('demo');
            toggleAccountsDialog(); // Close dropdown
            return;
        }

        // In fake real mode, clicking fake USD account switches to Real view
        if (isFakeRealMode && loginId.toString() === 'CR7125309') {
            console.log('✅ Switching to Real view - showing fake real balance and USD flag');
            setCurrentViewTab('real');
            toggleAccountsDialog(); // Close dropdown
            return;
        }

        if (loginId.toString() === activeAccount?.loginid) {
            // Already on this account, just close the dropdown
            toggleAccountsDialog();
            return;
        }

        // Use fake account service to check if switching should be blocked
        if (fakeAccountService.shouldBlockAccountSwitch(loginId.toString())) {
            fakeAccountService.logFakeAccountInteraction('switch_blocked', loginId.toString());
            toggleAccountsDialog(); // Close dropdown
            return;
        }

        const account_list = JSON.parse(localStorage.getItem('accountsList') ?? '{}');
        const token = account_list[loginId];
        if (!token) return;
        localStorage.setItem('authToken', token);
        localStorage.setItem('active_loginid', loginId.toString());
        await api_base?.init(true);
        const search_params = new URLSearchParams(window.location.search);
        const selected_account = modifiedAccountList.find(acc => acc.loginid === loginId.toString());
        if (!selected_account) return;
        const account_param = selected_account.is_virtual ? 'demo' : selected_account.currency;
        search_params.set('account', account_param);
        window.history.pushState({}, '', `${window.location.pathname}?${search_params.toString()}`);
    };

    // Initialize fake real balance when mode is activated
    useEffect(() => {
        if (isFakeRealMode) {
            fakeRealBalanceTracker.initializeBalance();
        }
    }, [isFakeRealMode]);

    // In fake real mode: Add fake USD account to Real tab with tracked balance
    const realTabAccounts = isFakeRealMode
        ? [
              // Fake US Dollar account with tracked balance
              {
                  loginid: 'CR7125309',
                  balance: currentFakeBalance, // Use live-tracked balance
                  currency: 'USD',
                  currencyLabel: 'US Dollar',
                  icon: <CurrencyIcon currency='usd' isVirtual={false} />,
                  isVirtual: false,
                  is_virtual: 0,
                  isActive: false, // Not active since we're trading on demo
                  is_disabled: 0,
                  excluded_until: '',
                  landing_company_name: 'svg',
                  account_type: 'standard',
                  account_category: 'trading',
                  broker: 'CR',
                  currency_type: 'fiat',
                  created_at: Date.now(),
                  email: '',
                  linked_to: [],
                  residence: '',
                  session_duration_limit: 0,
                  trading: {},
              },
              // Keep other real accounts EXCEPT USD (to avoid duplicates)
              ...modifiedCRAccountList.filter(account => account.currency !== 'USD'),
          ]
        : modifiedCRAccountList;

    // Demo tab stays as demo accounts (no swapping)
    const demoTabAccounts = modifiedVRTCRAccountList;

    // Keep MF accounts in Real tab only (don't swap them)
    const realTabMFAccounts = modifiedMFAccountList;

    // In fake real mode, override top display based on current tab view
    // Real tab: Show US flag with fake real balance
    // Demo tab: Show Demo icon with actual demo balance
    const displayActiveAccount = useMemo(() => {
        if (isFakeRealMode && activeAccount?.is_virtual) {
            // If viewing Demo tab, show actual demo account with Demo icon
            if (currentViewTab === 'demo') {
                // Get the actual demo balance from the account
                const demoBalance = client.all_accounts_balance?.accounts?.[activeAccount.loginid]?.balance;
                const formattedDemoBalance = demoBalance 
                    ? addComma(demoBalance.toFixed(getDecimalPlaces(activeAccount.currency)))
                    : activeAccount.balance;

                return {
                    ...activeAccount,
                    is_virtual: 1, // Set to 1 (number) to show Demo icon
                    isVirtual: true,
                    currency: activeAccount.currency, // Keep USD for the label
                    balance: formattedDemoBalance, // Show actual demo balance with commas
                    loginid: activeAccount.loginid,
                    icon: <CurrencyIcon currency='virtual' isVirtual={true} />, // Force Demo icon
                };
            }
            
            // If viewing Real tab, show fake USD account
            return {
                ...activeAccount,
                is_virtual: 0, // Set to 0 (number) to show US flag
                isVirtual: false,
                currency: 'USD',
                balance: currentFakeBalance, // Show fake real balance
                loginid: activeAccount.loginid,
                icon: <CurrencyIcon currency='usd' isVirtual={false} />, // Force US flag
            };
        }
        return activeAccount;
    }, [isFakeRealMode, activeAccount, currentFakeBalance, currentViewTab, client.all_accounts_balance]);

    return (
        displayActiveAccount &&
        (has_wallet ? (
            <Suspense fallback={<Loader />}>
                <AccountInfoWallets is_dialog_on={is_accounts_switcher_on} toggleDialog={toggleAccountsDialog} />
            </Suspense>
        ) : (
            <Popover
                className='run-panel__info'
                classNameBubble='run-panel__info--bubble'
                alignment='bottom'
                message={account_switcher_disabled_message}
                zIndex='5'
            >
                <UIAccountSwitcher
                    activeAccount={displayActiveAccount}
                    isDisabled={is_stop_button_visible}
                    tabsLabels={tabs_labels}
                    modalContentStyle={{
                        content: {
                            top: isDesktop ? '30%' : '50%',
                            borderRadius: '10px',
                        },
                    }}
                >
                    <UIAccountSwitcher.Tab title={tabs_labels.real}>
                        <RenderAccountItems
                            modifiedCRAccountList={realTabAccounts as TModifiedAccount[]}
                            modifiedMFAccountList={realTabMFAccounts as TModifiedAccount[]}
                            modifiedVRTCRAccountList={[] as TModifiedAccount[]}
                            switchAccount={switchAccount}
                            isVirtual={false}
                            activeLoginId={activeAccount?.loginid}
                            client={client}
                            currentViewTab={currentViewTab}
                        />
                    </UIAccountSwitcher.Tab>
                    <UIAccountSwitcher.Tab title={tabs_labels.demo}>
                        <RenderAccountItems
                            modifiedCRAccountList={[] as TModifiedAccount[]}
                            modifiedMFAccountList={[] as TModifiedAccount[]}
                            modifiedVRTCRAccountList={demoTabAccounts as TModifiedAccount[]}
                            switchAccount={switchAccount}
                            isVirtual={true}
                            activeLoginId={activeAccount?.loginid}
                            client={client}
                            currentViewTab={currentViewTab}
                        />
                    </UIAccountSwitcher.Tab>
                </UIAccountSwitcher>
            </Popover>
        ))
    );
});

export default AccountSwitcher;
