import clsx from 'clsx';
import { api_base } from '@/external/bot-skeleton';
import { localize } from '@deriv-com/translations';
import { AccountSwitcher as UIAccountSwitcher } from '@deriv-com/ui';
import AccountSwitcherFooter from './account-swticher-footer';
import { TDemoAccounts } from './types';
import { AccountSwitcherDivider, convertCommaValue } from './utils';

const DemoAccounts = ({
    tabs_labels,
    modifiedVRTCRAccountList,
    switchAccount,
    isVirtual,
    activeLoginId,
    oAuthLogout,
    is_logging_out,
    currentViewTab,
}: TDemoAccounts) => {
    // Check if fake real mode is active
    const isFakeRealMode = localStorage.getItem('demo_icon_us_flag') === 'true';
    
    // In fake real mode, only show reset button when actively viewing demo (Demo icon in top bar)
    const isViewingDemo = isFakeRealMode && currentViewTab === 'demo';

    return (
        <>
            <UIAccountSwitcher.AccountsPanel
                isOpen
                title={localize('Deriv account')}
                className='account-switcher-panel'
                key={tabs_labels.demo.toLowerCase()}
            >
                {modifiedVRTCRAccountList &&
                    modifiedVRTCRAccountList.map(account => (
                        <span
                            className={clsx('account-switcher__item', {
                                'account-switcher__item--disabled': account.is_disabled,
                                'fake-demo-mode-account': isFakeRealMode && account.loginid === 'VRTC7528369', // Bold font for fake demo account
                            })}
                            key={account.loginid}
                        >
                            <UIAccountSwitcher.AccountsItem
                                account={account}
                                onSelectAccount={() => {
                                    if (!account.is_disabled) switchAccount(account.loginid);
                                }}
                                onResetBalance={
                                    // In fake real mode: Only show reset button when viewing demo (Demo icon in top bar)
                                    // In normal mode: Always show reset button for active demo account
                                    (isFakeRealMode ? isViewingDemo : isVirtual) &&
                                    activeLoginId === account.loginid &&
                                    convertCommaValue(account.balance) !== 10000
                                        ? () => {
                                              api_base?.api?.send({
                                                  topup_virtual: 1,
                                              });
                                          }
                                        : undefined
                                }
                            />
                        </span>
                    ))}
            </UIAccountSwitcher.AccountsPanel>
            <AccountSwitcherDivider />
            <AccountSwitcherFooter loginid={activeLoginId} oAuthLogout={oAuthLogout} is_logging_out={is_logging_out} />
        </>
    );
};

export default DemoAccounts;
