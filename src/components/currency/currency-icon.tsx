import { lazy, Suspense, useEffect, useState } from 'react';
import { isAllowedFakeRealAccount } from '@/config/fake-real-allowlist';

const CURRENCY_ICONS = {
    aud: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyAudIcon }))),
    bch: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyBchIcon }))),
    btc: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyBtcIcon }))),
    busd: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyBusdIcon }))),
    dai: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyDaiIcon }))),
    eth: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyEthIcon }))),
    eur: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyEurIcon }))),
    'eur-check': lazy(() =>
        import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyEurIcon }))
    ),
    eurs: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyEursIcon }))),
    eusdt: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyUsdtIcon }))),
    gbp: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyGbpIcon }))),
    idk: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyIdkIcon }))),
    ltc: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyLtcIcon }))),
    pax: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyPaxIcon }))),
    tusd: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyTusdIcon }))),
    tusdt: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyUsdtIcon }))),
    unknown: lazy(() =>
        import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyPlaceholderIcon }))
    ),
    usd: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyUsdIcon }))),
    usdc: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyUsdcIcon }))),
    usdk: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyUsdkIcon }))),
    ust: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyUsdtIcon }))),
    virtual: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyDemoIcon }))),
    xrp: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyXrpIcon }))),
    algo: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyAlgoIcon }))),
    avax: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyAvaxIcon }))),
    bat: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyBatIcon }))),
    bnb: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyBnbIcon }))),
    dash: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyDashIcon }))),
    doge: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyDogeIcon }))),
    dot: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyDotIcon }))),
    eos: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyEosIcon }))),
    etc: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyEtcIcon }))),
    fil: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyFilIcon }))),
    iota: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyIotaIcon }))),
    link: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyLinkIcon }))),
    matic: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyMaticIcon }))),
    mkr: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyMkrIcon }))),
    mcd: lazy(() =>
        import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyMultiCollateralDaiIcon }))
    ),
    neo: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyNeoIcon }))),
    none: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyNoneIcon }))),
    omg: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyOmgIcon }))),
    p2p: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyP2PIcon }))),
    scd: lazy(() =>
        import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencySingleCollateralDaiIcon }))
    ),
    sol: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencySolIcon }))),
    terra: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyTerraIcon }))),
    trx: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyTrxIcon }))),
    uni: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyUniIcon }))),
    xlm: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyXlmIcon }))),
    xmr: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyXmrIcon }))),
    xtz: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyXtzIcon }))),
    zec: lazy(() => import('@deriv/quill-icons/Currencies').then(module => ({ default: module.CurrencyZecIcon }))),
};

export const CurrencyIcon = ({ currency, isVirtual }: { currency?: string; isVirtual?: boolean }) => {
    const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [pressProgress, setPressProgress] = useState(0);
    const progressInterval = useState<ReturnType<typeof setInterval> | null>(null);

    // Check if fake real mode is active
    const isFakeRealMode = localStorage.getItem('demo_icon_us_flag') === 'true';
    const activeLoginId = localStorage.getItem('active_loginid');

    const shouldShowDemoIcon = currency === 'virtual' || (isVirtual && !isFakeRealMode);
    const shouldShowUSDIcon = isVirtual && isFakeRealMode && currency !== 'virtual' && activeLoginId?.includes('VRT');

    const Icon = shouldShowDemoIcon
        ? CURRENCY_ICONS.virtual
        : shouldShowUSDIcon
          ? CURRENCY_ICONS.usd
          : CURRENCY_ICONS[currency?.toLowerCase() as keyof typeof CURRENCY_ICONS] || CURRENCY_ICONS.unknown;

    const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isVirtual || !isFakeRealMode) return;
        if (!isAllowedFakeRealAccount()) return;

        e.stopPropagation();

        // Start progress tracking
        let elapsed = 0;
        const interval = setInterval(() => {
            elapsed += 100;
            setPressProgress(Math.min((elapsed / 10000) * 100, 100));
        }, 100);
        progressInterval[1](interval);

        // Set 10-second timer to exit fake real mode
        const timer = setTimeout(() => {
            clearInterval(interval);
            setPressProgress(0);
            localStorage.setItem('demo_icon_us_flag', 'false');
            if (activeLoginId?.startsWith('VR')) {
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('account', 'demo');
                window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
            }
            window.location.reload();
        }, 10000);

        setPressTimer(timer);
    };

    const handlePressEnd = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            setPressTimer(null);
        }
        if (progressInterval[0]) {
            clearInterval(progressInterval[0]);
            progressInterval[1](null);
        }
        setPressProgress(0);
    };

    return (
        <Suspense fallback={null}>
            <div
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                style={{
                    cursor: isFakeRealMode && isVirtual ? 'pointer' : 'default',
                    position: 'relative',
                    display: 'inline-flex',
                    userSelect: 'none',
                }}
                title={isFakeRealMode && isVirtual ? 'Hold 10s to exit mode' : undefined}
            >
                <Icon iconSize='sm' />
                {pressProgress > 0 && (
                    <div style={{
                        position: 'absolute',
                        bottom: -3,
                        left: 0,
                        height: 2,
                        width: `${pressProgress}%`,
                        background: '#ef4444',
                        borderRadius: 2,
                        transition: 'width 0.1s linear',
                    }} />
                )}
            </div>
        </Suspense>
    );
};
