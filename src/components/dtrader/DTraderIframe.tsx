import React, { useState, useEffect } from 'react';
import './DTraderIframe.scss';

interface DTraderIframeProps {
    className?: string;
}

const DTraderIframe: React.FC<DTraderIframeProps> = ({ className = '' }) => {
    const [dtraderUrl, setDtraderUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleGoBack = () => {
        // Find and click the Dashboard tab
        const dashboardTab = document.querySelector('.dc-tabs__item[data-testid="dt_id-dashboard"]');
        if (dashboardTab) {
            (dashboardTab as HTMLElement).click();
            return;
        }

        // Alternative: Try finding by text content
        const allTabs = document.querySelectorAll('.dc-tabs__item');
        allTabs.forEach(tab => {
            if (tab.textContent?.includes('Dashboard')) {
                (tab as HTMLElement).click();
            }
        });
    };

    useEffect(() => {
        try {
            // Get authentication data from localStorage
            const authToken = localStorage.getItem('authToken');
            const activeLoginId = localStorage.getItem('active_loginid');

            if (!authToken || !activeLoginId) {
                // If not logged in, show DTrader without auto-login
                setDtraderUrl('https://deriv-dtrader.vercel.app/dtrader');
                setIsLoading(false);
                return;
            }

            // Get account details
            const clientAccountsStr = localStorage.getItem('client.accounts');
            let currency = 'USD';

            if (clientAccountsStr) {
                try {
                    const clientAccounts = JSON.parse(clientAccountsStr);
                    const accountData = clientAccounts[activeLoginId];
                    currency = accountData?.currency || 'USD';
                } catch (e) {
                    console.warn('Failed to parse client accounts:', e);
                }
            }

            // Build DTrader URL with parameters
            const params = new URLSearchParams({
                acct1: activeLoginId,
                token1: authToken,
                cur1: currency,
                lang: 'EN',
                app_id: '110800', // Your Zeus Trading Hub app ID
            });

            const url = `https://deriv-dtrader.vercel.app/dtrader?${params.toString()}`;
            setDtraderUrl(url);
            setIsLoading(false);
        } catch (err) {
            console.error('Error building DTrader URL:', err);
            setError('Failed to load DTrader');
            setIsLoading(false);
        }
    }, []);

    if (isLoading) {
        return (
            <div className={`dtrader-loading ${className}`}>
                <div className='dtrader-loading__spinner'>
                    <div className='spinner'></div>
                </div>
                <p className='dtrader-loading__text'>⚡ Loading DTrader...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`dtrader-error ${className}`}>
                <div className='dtrader-error__icon'>⚠️</div>
                <h3 className='dtrader-error__title'>Failed to Load DTrader</h3>
                <p className='dtrader-error__message'>{error}</p>
                <button className='dtrader-error__button' onClick={() => window.location.reload()}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className={`dtrader-container ${className}`}>
            <button className='dtrader-back-button' onClick={handleGoBack} title='Back to Dashboard'>
                <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                    <path
                        d='M19 12H5M5 12L12 19M5 12L12 5'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    />
                </svg>
                <span>Back to Dashboard</span>
            </button>
            <iframe
                src={dtraderUrl}
                title='Deriv DTrader'
                className='dtrader-iframe'
                allow='clipboard-write'
                sandbox='allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals'
            />
        </div>
    );
};

export default DTraderIframe;

