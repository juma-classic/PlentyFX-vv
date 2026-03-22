import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { FakeRealModeIndicator } from '@/components/fake-real-account-toggle/FakeRealModeIndicator';
import { standalone_routes } from '@/components/shared';
import Button from '@/components/shared_ui/button';
import Modal from '@/components/shared_ui/modal'; // Import the modal component
import useActiveAccount from '@/hooks/api/account/useActiveAccount';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { StandaloneCircleUserRegularIcon } from '@deriv/quill-icons/Standalone';
import { Localize, useTranslations } from '@deriv-com/translations';
import { Header, useDevice, Wrapper } from '@deriv-com/ui';
import { Tooltip } from '@deriv-com/ui';
import { AppLogo } from '../app-logo';
import AccountsInfoLoader from './account-info-loader';
import AccountSwitcher from './account-switcher';
import MobileMenu from './mobile-menu';
import './header.scss';

const THEMES = [
    { label: 'Light', value: 'theme--light' },
    { label: 'Dark', value: 'theme--dark' },
    { label: 'Ocean', value: 'theme--ocean' },
    { label: 'Sunset', value: 'theme--sunset' },
    { label: 'Pink', value: 'theme--pink' },
];

const AppHeader = observer(() => {
    // Theme dropdown state
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('site_theme') || 'theme--light';
    });

    // Update body class on theme change
    useEffect(() => {
        document.body.classList.remove(...THEMES.map(t => t.value));
        document.body.classList.add(theme);
        localStorage.setItem('site_theme', theme);
    }, [theme]);
    const { isDesktop } = useDevice();
    const { isAuthorizing, activeLoginid } = useApiBase();
    const { client } = useStore() ?? {};

    const { data: activeAccount } = useActiveAccount({ allBalanceData: client?.all_accounts_balance });
    const { accounts } = client ?? {};
    const has_wallet = Object.keys(accounts ?? {}).some(id => accounts?.[id].account_category === 'wallet');

    const { localize } = useTranslations();

    // const { isOAuth2Enabled } = useOauth2();

    const [isToggled, setIsToggled] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stake, setStake] = useState('');
    const [martingale, setMartingale] = useState('');

    const handleToggle = () => {
        if (!isToggled) {
            setIsModalOpen(true); // Open modal when toggled on
        } else {
            setIsToggled(false); // Turn off toggle
        }
    };

    const handleProceed = () => {
        if (stake.trim() && martingale.trim()) {
            setIsToggled(true); // Enable toggle only if inputs are valid
            setIsModalOpen(false); // Close modal
        } else {
            alert('Please enter valid Stake and Martingale values.');
        }
    };

    const renderAccountSection = () => {
        if (isAuthorizing) {
            return <AccountsInfoLoader isLoggedIn isMobile={!isDesktop} speed={3} />;
        } else if (activeLoginid) {
            return (
                <>
                    {isDesktop && (
                        <Tooltip
                            as='a'
                            href={standalone_routes.personal_details}
                            tooltipContent={localize('Manage account settings')}
                            tooltipPosition='bottom'
                            className='app-header__account-settings'
                        >
                            <StandaloneCircleUserRegularIcon className='app-header__profile_icon' />
                        </Tooltip>
                    )}
                    <AccountSwitcher activeAccount={activeAccount} />
                    {isDesktop &&
                        (has_wallet ? (
                            <Button
                                className='manage-funds-button'
                                has_effect
                                text={localize('Manage funds')}
                                onClick={() => window.location.assign(standalone_routes.wallets_transfer)}
                                primary
                            />
                        ) : (
                            <Button
                                primary
                                onClick={() => {
                                    window.location.assign(standalone_routes.cashier_deposit);
                                }}
                                className='deposit-button'
                            >
                                {localize('Deposit')}
                            </Button>
                        ))}
                </>
            );
        } else {
            return (
                <div className='auth-actions'>
                    <Button
                        tertiary
                        onClick={() => {
                            window.location.replace(
                                'https://oauth.deriv.com/oauth2/authorize?app_id=110800&l=EN&brand=plenty-fx'
                            );
                        }}
                    >
                        <Localize i18n_default_text='Log in' />
                    </Button>
                    <Button
                        primary
                        onClick={() => {
                            window.open(standalone_routes.signup);
                        }}
                    >
                        <Localize i18n_default_text='Sign up' />
                    </Button>
                </div>
            );
        }
    };

    return (
        <Header
            className={clsx('app-header', {
                'app-header--desktop': isDesktop,
                'app-header--mobile': !isDesktop,
            })}
        >
            <Wrapper variant='left'>
                <AppLogo />
                <MobileMenu />
                <FakeRealModeIndicator />
            </Wrapper>
            <Wrapper variant='right'>{renderAccountSection()}</Wrapper>

            {isModalOpen && (
                <Modal
                    is_open={isModalOpen}
                    toggleModal={() => setIsModalOpen(false)}
                    title='Select Stake and Martingale'
                >
                    <div className='modal-content'>
                        <label>
                            Stake:
                            <input
                                type='number'
                                value={stake}
                                onChange={e => setStake(e.target.value)}
                                placeholder='Enter stake'
                            />
                        </label>
                        <label>
                            Martingale:
                            <input
                                type='number'
                                value={martingale}
                                onChange={e => setMartingale(e.target.value)}
                                placeholder='Enter martingale'
                            />
                        </label>
                        <button onClick={handleProceed} className='proceed-button'>
                            Proceed
                        </button>
                    </div>
                </Modal>
            )}
        </Header>
    );
});

export default AppHeader;

