import React, { useState } from 'react';
import './TokenSetup.scss';

interface TokenSetupProps {
    onTokenSet: (token: string, appId?: string) => void;
    onCancel: () => void;
}

export const TokenSetup: React.FC<TokenSetupProps> = ({ onTokenSet, onCancel }) => {
    const [token, setToken] = useState('');
    const [appId, setAppId] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);
    const [useCustomAppId, setUseCustomAppId] = useState(false);
    const [currentAppId, setCurrentAppId] = useState('');

    // Get current app ID on mount
    React.useEffect(() => {
        const configAppId = localStorage.getItem('config.app_id') || '119552';
        setCurrentAppId(configAppId);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (token.trim()) {
            onTokenSet(token.trim(), useCustomAppId && appId.trim() ? appId.trim() : undefined);
        }
    };

    return (
        <div className='token-setup'>
            <div className='token-setup-header'>
                <h3>🔑 API Token Required</h3>
                <p>Speed Mode needs your Deriv API token to execute real trades.</p>
            </div>

            <form onSubmit={handleSubmit} className='token-form'>
                <div className='form-group'>
                    <label htmlFor='api-token'>Deriv API Token</label>
                    <input
                        id='api-token'
                        type='text'
                        className='token-input'
                        placeholder='Enter your Deriv API token'
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        autoFocus
                    />
                    <span className='input-hint'>Your token will be stored securely in your browser</span>
                </div>

                <div className='form-group'>
                    <label className='checkbox-label'>
                        <input
                            type='checkbox'
                            checked={useCustomAppId}
                            onChange={e => setUseCustomAppId(e.target.checked)}
                        />
                        <span>Use custom App ID (optional)</span>
                    </label>
                    {!useCustomAppId && currentAppId && (
                        <span className='input-hint'>Currently using App ID: {currentAppId}</span>
                    )}
                </div>

                {useCustomAppId && (
                    <div className='form-group'>
                        <label htmlFor='app-id'>Your App ID</label>
                        <input
                            id='app-id'
                            type='text'
                            className='token-input'
                            placeholder='Enter your Deriv App ID (e.g., 12345)'
                            value={appId}
                            onChange={e => setAppId(e.target.value)}
                        />
                        <span className='input-hint'>
                            Get your App ID from:{' '}
                            <a href='https://api.deriv.com/app-registration' target='_blank' rel='noopener noreferrer'>
                                api.deriv.com/app-registration
                            </a>
                        </span>
                    </div>
                )}

                <div className='form-actions'>
                    <button
                        type='submit'
                        className='btn-submit'
                        disabled={!token.trim() || (useCustomAppId && !appId.trim())}
                    >
                        ✅ Set Token
                    </button>
                    <button type='button' className='btn-cancel' onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </form>

            <div className='instructions-section'>
                <button className='instructions-toggle' onClick={() => setShowInstructions(!showInstructions)}>
                    {showInstructions ? '▼' : '▶'} How to get your API token
                </button>

                {showInstructions && (
                    <div className='instructions-content'>
                        <h4>📋 Step-by-Step Instructions:</h4>

                        <div className='instruction-step'>
                            <span className='step-number'>1</span>
                            <div className='step-content'>
                                <strong>Go to Deriv API Token Page</strong>
                                <p>
                                    Visit:{' '}
                                    <a
                                        href='https://app.deriv.com/account/api-token'
                                        target='_blank'
                                        rel='noopener noreferrer'
                                    >
                                        https://app.deriv.com/account/api-token
                                    </a>
                                </p>
                            </div>
                        </div>

                        <div className='instruction-step'>
                            <span className='step-number'>2</span>
                            <div className='step-content'>
                                <strong>Create New Token</strong>
                                <p>Click &quot;Create new token&quot; button</p>
                            </div>
                        </div>

                        <div className='instruction-step'>
                            <span className='step-number'>3</span>
                            <div className='step-content'>
                                <strong>Set Token Name</strong>
                                <p>Enter a name like &quot;Speed Mode Trading&quot;</p>
                            </div>
                        </div>

                        <div className='instruction-step'>
                            <span className='step-number'>4</span>
                            <div className='step-content'>
                                <strong>Select Scopes</strong>
                                <p>Enable these permissions:</p>
                                <ul>
                                    <li>✅ Read</li>
                                    <li>✅ Trade</li>
                                    <li>✅ Payments</li>
                                    <li>✅ Trading information</li>
                                </ul>
                            </div>
                        </div>

                        <div className='instruction-step'>
                            <span className='step-number'>5</span>
                            <div className='step-content'>
                                <strong>Copy Token</strong>
                                <p>Copy the generated token and paste it above</p>
                            </div>
                        </div>

                        <div className='security-note'>
                            <span className='note-icon'>🔒</span>
                            <div className='note-content'>
                                <strong>Security Note:</strong>
                                <p>
                                    Your token is stored locally in your browser and never sent to any third-party
                                    servers. It&apos;s only used to communicate directly with Deriv&apos;s API.
                                </p>
                            </div>
                        </div>

                        <div className='demo-note'>
                            <span className='note-icon'>💡</span>
                            <div className='note-content'>
                                <strong>Testing Tip:</strong>
                                <p>
                                    For testing, create a token for your <strong>demo account</strong> first. Demo
                                    accounts start with &quot;VRT&quot; in the login ID.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

