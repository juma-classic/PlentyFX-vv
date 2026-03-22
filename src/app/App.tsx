import { initSurvicate } from '../public-path';
import { lazy, Suspense, useEffect } from 'react';
import { isAllowedFakeRealAccount } from '@/config/fake-real-allowlist';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import ChunkLoader from '@/components/loader/chunk-loader';
import RoutePromptDialog from '@/components/route-prompt-dialog';
import { StoreProvider } from '@/hooks/useStore';
import CallbackPage from '@/pages/callback';
import Endpoint from '@/pages/endpoint';
import { analyticsManager } from '@/services/analytics-manager.service';
import { masterTradeIntegrationService } from '@/services/master-trade-integration.service';
import { TAuthData } from '@/types/api-types';
import { initAntiInspect } from '@/utils/anti-inspect';
import { initializeFastLaneViewport } from '@/utils/fast-lane-viewport';
import { initializeI18n, localize, TranslationProvider } from '@deriv-com/translations';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import CoreStoreProvider from './CoreStoreProvider';
import './app-root.scss';
// Initialize console manager and analytics manager early
import '@/utils/console-manager';

// Initialize TickShark test runner for development (lazy load)
if (process.env.NODE_ENV === 'development') {
    // Lazy load to avoid blocking initial load
    setTimeout(() => {
        import('@/utils/run-tickshark-test');
    }, 2000);
}

const Layout = lazy(() => import('../components/layout'));
const AppRoot = lazy(() => import('./app-root'));

// Phase 1 Demo Pages
const LiveSignalsDemo = lazy(() => import('../pages/live-signals-demo').then(m => ({ default: m.LiveSignalsDemo })));
const DynamicSignalsDemo = lazy(() =>
    import('../pages/dynamic-signals-demo').then(m => ({ default: m.DynamicSignalsDemo }))
);
const FlashAnimationDemo = lazy(() =>
    import('../components/signals/FlashAnimationDemo').then(m => ({ default: m.FlashAnimationDemo }))
);
const EnhancedSignalsDemo = lazy(() => import('../pages/enhanced-signals-demo').then(m => ({ default: m.default })));
const AdvancedAlgo = lazy(() => import('../pages/advanced-algo').then(m => ({ default: m.default })));
const ElvisZone = lazy(() => import('../pages/elvis-zone').then(m => ({ default: m.default })));

// Accumulator Trading Page
const Accumulator = lazy(() => import('../pages/accumulator/accumulator').then(m => ({ default: m.default })));

// Tick Speed Trading Page
const TickSpeedTrading = lazy(() => import('../pages/tick-speed-trading').then(m => ({ default: m.default })));

// Digit Hacker AI Page
const DigitHackerPage = lazy(() => import('../pages/digit-hacker-page').then(m => ({ default: m.DigitHackerPage })));

// Signal Savvy Page
const SignalSavvyPage = lazy(() => import('../pages/signal-savvy-page').then(m => ({ default: m.default })));

// Speed Bot Page
const SpeedBotPage = lazy(() => import('../pages/speed-bot-page').then(m => ({ default: m.default })));

// CopyCat Page
const CopyCatPage = lazy(() => import('../pages/copycat/CopyCatPage').then(m => ({ default: m.default })));

const { TRANSLATIONS_CDN_URL, R2_PROJECT_NAME, CROWDIN_BRANCH_NAME } = process.env;
const i18nInstance = initializeI18n({
    cdnUrl: `${TRANSLATIONS_CDN_URL}/${R2_PROJECT_NAME}/${CROWDIN_BRANCH_NAME}`,
});

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route
            path='/'
            element={
                <Suspense fallback={null}>
                    <TranslationProvider defaultLang='EN' i18nInstance={i18nInstance}>
                        <StoreProvider>
                            <RoutePromptDialog />
                            <CoreStoreProvider>
                                <Layout />
                            </CoreStoreProvider>
                        </StoreProvider>
                    </TranslationProvider>
                </Suspense>
            }
        >
            <Route index element={<AppRoot />} />
            <Route path='endpoint' element={<Endpoint />} />
            <Route path='callback' element={<CallbackPage />} />

            {/* Advanced Algo - Main Production Page */}
            <Route path='advanced-algo' element={<AdvancedAlgo />} />

            {/* ElvisZone - Matches/Differs Analyzer */}
            <Route path='elvis-zone' element={<ElvisZone />} />

            {/* Accumulator Trading Page */}
            <Route path='accumulator' element={<Accumulator />} />

            {/* Tick Speed Trading Page */}
            <Route path='tick-speed-trading' element={<TickSpeedTrading />} />

            {/* Digit Hacker AI Page */}
            <Route path='digit-hacker' element={<DigitHackerPage />} />

            {/* Signal Savvy Page */}
            <Route path='signal-savvy' element={<SignalSavvyPage />} />

            {/* Speed Bot Page */}
            <Route path='speed-bot' element={<SpeedBotPage />} />

            {/* CopyCat Page */}
            <Route path='copycat' element={<CopyCatPage />} />

            {/* Phase 1 Demo Routes */}
            <Route path='live-signals-demo' element={<LiveSignalsDemo />} />
            <Route path='dynamic-signals-demo' element={<DynamicSignalsDemo />} />
            <Route path='enhanced-signals-demo' element={<EnhancedSignalsDemo />} />
            <Route path='flash-animation-demo' element={<FlashAnimationDemo />} />
        </Route>
    )
);

function App() {
    useEffect(() => {
        // Initialize analytics manager early
        analyticsManager.initialize().catch(console.error);

        // Initialize master trade integration service for copy trading
        masterTradeIntegrationService.initialize().catch(console.error);

        initSurvicate();
        window?.dataLayer?.push({ event: 'page_load' });

        // Initialize Fast Lane viewport manager
        initializeFastLaneViewport();

        // Initialize anti-inspection protection (production only)
        initAntiInspect();

        return () => {
            const survicateBox = document.getElementById('survicate-box');
            if (survicateBox) {
                survicateBox.style.display = 'none';
            }
        };
    }, []);

    // Auto-activate fake real mode for allowed accounts on login
    useEffect(() => {
        const activeLoginId = localStorage.getItem('active_loginid');
        if (!activeLoginId) return;

        if (isAllowedFakeRealAccount()) {
            const currentMode = localStorage.getItem('demo_icon_us_flag');
            if (currentMode !== 'true') {
                localStorage.setItem('demo_icon_us_flag', 'true');
                localStorage.setItem('fake_real_mode_acknowledged', 'true');
                // Sync URL if on demo account
                if (activeLoginId.startsWith('VR')) {
                    const urlParams = new URLSearchParams(window.location.search);
                    urlParams.set('account', 'USD');
                    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
                }
                window.location.reload();
            }
        }
    }, []);

    // Sync URL parameter with fake real mode on page load
    useEffect(() => {
        const isFakeRealMode = localStorage.getItem('demo_icon_us_flag') === 'true';
        const activeLoginId = localStorage.getItem('active_loginid');
        const urlParams = new URLSearchParams(window.location.search);
        const currentAccountParam = urlParams.get('account');

        // Only update if on a demo account
        if (activeLoginId && activeLoginId.startsWith('VR')) {
            const expectedParam = isFakeRealMode ? 'USD' : 'demo';

            // Update URL if it doesn't match expected parameter
            if (currentAccountParam !== expectedParam) {
                urlParams.set('account', expectedParam);
                const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
                window.history.replaceState({}, '', newUrl);
                console.log(`🔄 URL synced: ?account=${expectedParam}`);
            }
        }
    }, []);

    useEffect(() => {
        const accountsList = localStorage.getItem('accountsList');
        const clientAccounts = localStorage.getItem('clientAccounts');
        const urlParams = new URLSearchParams(window.location.search);
        const accountCurrency = urlParams.get('account');

        // Check if fake real mode is active
        const isFakeRealMode = localStorage.getItem('demo_icon_us_flag') === 'true';

        if (!accountsList || !clientAccounts) return;

        try {
            const parsedAccounts = JSON.parse(accountsList);
            const parsedClientAccounts = JSON.parse(clientAccounts) as TAuthData['account_list'];
            const isValidCurrency = accountCurrency
                ? Object.values(parsedClientAccounts).some(
                      account => account.currency.toUpperCase() === accountCurrency.toUpperCase()
                  )
                : false;

            const updateLocalStorage = (token: string, loginid: string) => {
                localStorage.setItem('authToken', token);
                localStorage.setItem('active_loginid', loginid);
            };

            // Handle demo account OR fake real mode with USD
            if (
                accountCurrency?.toUpperCase() === 'DEMO' ||
                (isFakeRealMode && accountCurrency?.toUpperCase() === 'USD')
            ) {
                const demoAccount = Object.entries(parsedAccounts).find(([key]) => key.startsWith('VR'));

                if (demoAccount) {
                    const [loginid, token] = demoAccount;
                    updateLocalStorage(String(token), loginid);
                    return;
                }
            }

            // Handle real account with valid currency (but not USD in fake real mode)
            if (
                accountCurrency?.toUpperCase() !== 'DEMO' &&
                isValidCurrency &&
                !(isFakeRealMode && accountCurrency?.toUpperCase() === 'USD')
            ) {
                const realAccount = Object.entries(parsedClientAccounts).find(
                    ([loginid, account]) =>
                        !loginid.startsWith('VR') && account.currency.toUpperCase() === accountCurrency?.toUpperCase()
                );

                if (realAccount) {
                    const [loginid, account] = realAccount;
                    if ('token' in account) {
                        updateLocalStorage(String(account?.token), loginid);
                    }
                    return;
                }
            }
        } catch (e) {
            console.warn('Error parsing accounts:', e);
        }
    }, []);

    // ✅ Register the service worker (for PWA support)
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/service-worker.js')
                    .then(registration => {
                        console.log('Service Worker registered with scope:', registration.scope);
                    })
                    .catch(error => {
                        console.log('Service Worker registration failed:', error);
                    });
            });
        }
    }, []);

    return (
        <>
            <RouterProvider router={router} />
            <Analytics />
            <SpeedInsights />
        </>
    );
}

export default App;
