/**
 * CopyCat Page
 * Token-based copy trading — replicate your trades to multiple client accounts.
 * Ported and adapted from binarytool.site copy trading implementation.
 */

import React, { useEffect, useRef, useState } from 'react';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import './CopyCatPage.scss';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TokenMeta {
    loginid?: string;
    currency?: string;
    balance?: number;
    authorized: boolean;
    loading: boolean;
    error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'copycat_tokens';
const STORAGE_COPY_ACTIVE = 'copycat_copy_active';
const STORAGE_DEMO_ACTIVE = 'copycat_demo_active';

function loadTokensFromStorage(): string[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(t => typeof t === 'string' && t.length > 0) : [];
    } catch {
        return [];
    }
}

function saveTokensToStorage(tokens: string[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

function formatBalance(currency: string, balance: number): string {
    return `${balance.toFixed(2)} ${currency}`;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

const Spinner = () => (
    <svg width='14' height='14' viewBox='0 0 50 50' aria-label='loading' role='img'>
        <circle
            cx='25'
            cy='25'
            r='20'
            fill='none'
            stroke='#888'
            strokeWidth='5'
            strokeLinecap='round'
            strokeDasharray='31.4 31.4'
        >
            <animateTransform
                attributeName='transform'
                type='rotate'
                from='0 25 25'
                to='360 25 25'
                dur='1s'
                repeatCount='indefinite'
            />
        </circle>
    </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const CopyCatPage: React.FC = () => {
    const [tokens, setTokens] = useState<string[]>([]);
    const [tokenMeta, setTokenMeta] = useState<Record<string, TokenMeta>>({});
    const [inputToken, setInputToken] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [showError, setShowError] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [isCopyActive, setIsCopyActive] = useState(() => localStorage.getItem(STORAGE_COPY_ACTIVE) === 'true');
    const [isDemoCopyActive, setIsDemoCopyActive] = useState(
        () => localStorage.getItem(STORAGE_DEMO_ACTIVE) === 'true'
    );
    const [isSyncing, setIsSyncing] = useState(false);
    const [fallingTokens, setFallingTokens] = useState<string[]>([]);
    const [tutorialOpen, setTutorialOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load tokens on mount
    useEffect(() => {
        const saved = loadTokensFromStorage();
        if (saved.length > 0) {
            setTokens(saved);
            authorizeTokens(saved);
        }
    }, []);

    // Debounced re-auth when token list changes
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (!tokens.length) return;
            const needsAuth = tokens.filter(t => !tokenMeta[t]?.authorized && !tokenMeta[t]?.error);
            if (needsAuth.length > 0) authorizeTokens(needsAuth);
        }, 500);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [tokens]);

    const showSuccessFor = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 10000);
    };

    const showErrorFor = (msg: string) => {
        setErrorMsg(msg);
        setShowError(true);
    };

    // ── Token Authorization ──────────────────────────────────────────────────
    // IMPORTANT: Each token is authorized on its OWN isolated WebSocket connection.
    // Never use api_base.api here — calling authorize() on the main connection
    // replaces the current session and logs the user out.

    const authorizeTokens = async (list: string[]) => {
        for (const token of list) {
            setTokenMeta(prev => ({
                ...prev,
                [token]: { ...prev[token], loading: true, authorized: false, error: undefined },
            }));

            // Create a fresh isolated connection for this token only
            const isolatedApi = generateDerivApiInstance();

            try {
                // Wait for socket to open
                await new Promise<void>((resolve, reject) => {
                    const conn = (isolatedApi as any).connection;
                    if (conn.readyState === WebSocket.OPEN) return resolve();
                    conn.addEventListener('open', () => resolve(), { once: true });
                    conn.addEventListener('error', () => reject(new Error('Connection failed')), { once: true });
                    setTimeout(() => reject(new Error('Connection timeout')), 10000);
                });

                const authResp = await isolatedApi.authorize(token);
                if ((authResp as any).error) throw new Error((authResp as any).error.message || 'Authorization failed');

                const authorize = (authResp as any).authorize;

                // Fetch balance on the same isolated connection
                let balance: number | undefined;
                let currency: string | undefined;
                try {
                    const balResp = await (isolatedApi as any).send({ balance: 1 });
                    balance = typeof balResp?.balance?.balance === 'number'
                        ? balResp.balance.balance
                        : parseFloat(balResp?.balance?.balance ?? '0');
                    currency = balResp?.balance?.currency || authorize?.currency;
                } catch {
                    currency = authorize?.currency;
                }

                setTokenMeta(prev => ({
                    ...prev,
                    [token]: {
                        loginid: authorize?.loginid,
                        currency,
                        balance,
                        authorized: true,
                        loading: false,
                    },
                }));
            } catch (e: any) {
                setTokenMeta(prev => ({
                    ...prev,
                    [token]: { ...prev[token], authorized: false, loading: false, error: e?.message || 'Auth error' },
                }));
            } finally {
                // Always disconnect the isolated connection — never leave it open
                try { (isolatedApi as any).disconnect(); } catch { /* ignore */ }
            }
        }
    };

    const retryAuth = (token: string) => {
        setTokenMeta(prev => ({
            ...prev,
            [token]: { ...prev[token], loading: true, authorized: false, error: undefined },
        }));
        authorizeTokens([token]);
    };

    // ── Add Token ────────────────────────────────────────────────────────────

    const addToken = async () => {
        const t = inputToken.trim();
        if (!t) return;

        const currentAccount = JSON.parse(localStorage.getItem('clientAccounts') ?? '{}');
        const accountId = Object.keys(currentAccount)[0];
        if (!accountId) {
            showErrorFor("You're not logged in. Please log in and try again.");
            return;
        }

        if (tokens.includes(t)) {
            showErrorFor('This token is already in your list.');
            return;
        }

        const updated = [t, ...tokens];
        setTokens(updated);
        saveTokensToStorage(updated);
        setInputToken('');
        authorizeTokens([t]);
    };

    // ── Remove Token ─────────────────────────────────────────────────────────

    const removeToken = (token: string) => {
        setFallingTokens(prev => [...prev, token]);
        saveTokensToStorage(tokens.filter(t => t !== token));
    };

    const onTokenFallEnd = (token: string) => {
        setTokens(prev => prev.filter(t => t !== token));
        setFallingTokens(prev => prev.filter(t => t !== token));
        setTokenMeta(prev => {
            const n = { ...prev };
            delete n[token];
            return n;
        });
    };

    // ── Sync ─────────────────────────────────────────────────────────────────

    const syncTokens = async () => {
        setIsSyncing(true);
        const saved = loadTokensFromStorage();
        const merged = Array.from(new Set([...saved, ...tokens])).filter(Boolean);
        setTokens(merged);
        if (merged.length) await authorizeTokens(merged);
        setIsSyncing(false);
    };

    // ── Copy Trading Toggle ───────────────────────────────────────────────────

    const toggleCopyTrading = () => {
        const next = !isCopyActive;
        setIsCopyActive(next);
        localStorage.setItem(STORAGE_COPY_ACTIVE, String(next));
        showSuccessFor(`Copy trading ${next ? 'started' : 'stopped'} for ${tokens.length} token(s).`);
    };

    const toggleDemoCopy = () => {
        const next = !isDemoCopyActive;
        setIsDemoCopyActive(next);
        localStorage.setItem(STORAGE_DEMO_ACTIVE, String(next));
        showSuccessFor(`Demo → Real copy trading ${next ? 'started' : 'stopped'}.`);
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className='copycat-page'>
            {/* Header */}
            <div className='copycat-page__header'>
                <div className='copycat-page__title'>
                    <span className='copycat-page__icon'>🐱</span>
                    <div>
                        <h1>CopyCat</h1>
                        <p>Replicate your trades to multiple client accounts in real time</p>
                    </div>
                </div>
                <button className='copycat-page__tutorial-btn' onClick={() => setTutorialOpen(true)}>
                    ▶ Tutorial
                </button>
            </div>

            {/* Error Banner */}
            {showError && (
                <div className='copycat-page__error-banner'>
                    <span>{errorMsg}</span>
                    <button onClick={() => setShowError(false)}>✕</button>
                </div>
            )}

            {/* Success Banner */}
            {successMsg && <div className='copycat-page__success-banner'>{successMsg}</div>}

            <div className='copycat-page__body'>
                {/* Left Panel */}
                <div className='copycat-page__panel'>
                    {/* Demo → Real */}
                    <div className='copycat-page__card'>
                        <h3>Demo → Real Copy Trading</h3>
                        <p className='copycat-page__card-desc'>
                            Mirror trades from your demo account to your real account automatically.
                        </p>
                        <button
                            className={`copycat-page__toggle-btn ${isDemoCopyActive ? 'active' : ''}`}
                            onClick={toggleDemoCopy}
                        >
                            {isDemoCopyActive ? '⏹ Stop Demo → Real' : '▶ Start Demo → Real'}
                        </button>
                    </div>

                    {/* Token Copy Trading */}
                    <div className='copycat-page__card'>
                        <h3>Token Replicator</h3>
                        <p className='copycat-page__card-desc'>
                            Add client API tokens below. When you trade, all added accounts will receive the same trade.
                        </p>

                        <div className='copycat-page__input-row'>
                            <input
                                type='text'
                                className='copycat-page__input'
                                value={inputToken}
                                onChange={e => setInputToken(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addToken()}
                                placeholder='Enter client API token'
                            />
                            <button className='copycat-page__btn' onClick={addToken}>
                                Add
                            </button>
                            <button className='copycat-page__btn secondary' onClick={syncTokens} disabled={isSyncing}>
                                {isSyncing ? 'Syncing…' : '🔄 Sync'}
                            </button>
                        </div>

                        <button
                            className={`copycat-page__toggle-btn ${isCopyActive ? 'active' : ''}`}
                            onClick={toggleCopyTrading}
                            disabled={tokens.length === 0}
                        >
                            {isCopyActive ? '⏹ Stop Copy Trading' : '▶ Start Copy Trading'}
                        </button>
                    </div>
                </div>

                {/* Right Panel — Token List */}
                <div className='copycat-page__panel'>
                    <div className='copycat-page__card copycat-page__card--tokens'>
                        <h3>
                            Replicated Accounts <span className='copycat-page__count'>{tokens.length}</span>
                        </h3>

                        {tokens.length === 0 ? (
                            <div className='copycat-page__empty'>
                                No tokens added yet. Add a client API token to get started.
                            </div>
                        ) : (
                            <ul className='copycat-page__token-list'>
                                {tokens.map((token, idx) => {
                                    const meta = tokenMeta[token];
                                    const isFalling = fallingTokens.includes(token);
                                    return (
                                        <li
                                            key={token}
                                            className={`copycat-page__token-item ${isFalling ? 'falling' : ''}`}
                                            onTransitionEnd={() => isFalling && onTokenFallEnd(token)}
                                        >
                                            <span className='copycat-page__token-index'>{idx + 1}.</span>
                                            <span className='copycat-page__token-value' title={token}>
                                                {token.slice(0, 8)}…{token.slice(-4)}
                                            </span>
                                            <span className='copycat-page__token-meta'>
                                                {meta?.authorized ? (
                                                    <>
                                                        <span className='copycat-page__badge success'>✓</span>
                                                        {meta.loginid && <span>{meta.loginid}</span>}
                                                        {meta.currency && meta.balance !== undefined && (
                                                            <span>{formatBalance(meta.currency, meta.balance)}</span>
                                                        )}
                                                    </>
                                                ) : meta?.error ? (
                                                    <>
                                                        <span className='copycat-page__badge error'>Auth failed</span>
                                                        <button
                                                            className='copycat-page__retry-btn'
                                                            onClick={() => retryAuth(token)}
                                                            disabled={meta.loading}
                                                        >
                                                            {meta.loading ? <Spinner /> : 'Retry'}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className='copycat-page__authorizing'>
                                                        <Spinner /> Authorizing…
                                                    </span>
                                                )}
                                            </span>
                                            <button
                                                className='copycat-page__remove-btn'
                                                onClick={() => removeToken(token)}
                                                title='Remove token'
                                            >
                                                🗑
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* Tutorial Modal */}
            {tutorialOpen && (
                <div className='copycat-page__modal-overlay' onClick={() => setTutorialOpen(false)}>
                    <div className='copycat-page__modal' onClick={e => e.stopPropagation()}>
                        <button className='copycat-page__modal-close' onClick={() => setTutorialOpen(false)}>
                            ✕
                        </button>
                        <h2>CopyCat Tutorial</h2>
                        <iframe
                            width='100%'
                            height='100%'
                            src='https://www.youtube.com/embed/gsWzKmslEnY'
                            title='CopyCat Tutorial'
                            frameBorder='0'
                            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                            allowFullScreen
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CopyCatPage;
