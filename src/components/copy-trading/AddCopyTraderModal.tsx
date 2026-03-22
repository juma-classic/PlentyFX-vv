import React, { useState } from 'react';
import { copyTradingService } from '@/services/copy-trading.service';
import type { CopyTrader } from '@/types/copy-trading.types';
import './AddCopyTraderModal.scss';

interface AddCopyTraderModalProps {
    onClose: () => void;
    onTraderAdded: () => void;
}

export const AddCopyTraderModal: React.FC<AddCopyTraderModalProps> = ({ onClose, onTraderAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        apiToken: '',
        appId: '',
        maxStakePerTrade: 100,
        maxDailyLoss: 500,
        maxConcurrentTrades: 5,
        stakeMultiplier: 1.0,
        allowedMarkets: [] as string[],
        allowedContractTypes: [] as string[],
        followSignals: true,
        followBots: true,
        followManualTrades: true,
        isActive: true,
    });

    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{
        isValid: boolean;
        accountInfo?: {
            loginId: string;
            currency: string;
            balance: number;
            country: string;
            email: string;
        };
        error?: string;
    } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const availableMarkets = [
        'R_10',
        'R_25',
        'R_50',
        'R_75',
        'R_100',
        '1HZ10V',
        '1HZ25V',
        '1HZ50V',
        '1HZ75V',
        '1HZ100V',
    ];

    const availableContractTypes = [
        'CALL',
        'PUT',
        'DIGITEVEN',
        'DIGITODD',
        'DIGITOVER',
        'DIGITUNDER',
        'ONETOUCH',
        'NOTOUCH',
        'RANGE',
        'UPORDOWN',
    ];

    const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear validation when API token changes
        if (field === 'apiToken' || field === 'appId') {
            setValidationResult(null);
        }
    };

    const handleValidateToken = async () => {
        if (!formData.apiToken.trim()) {
            setError('Please enter an API token');
            return;
        }

        setIsValidating(true);
        setError(null);

        try {
            const result = await copyTradingService.validateApiToken(
                formData.apiToken.trim(),
                formData.appId.trim() || undefined
            );

            setValidationResult(result);

            if (!result.isValid) {
                setError(result.error || 'Token validation failed');
            }
        } catch (error) {
            setError('Failed to validate token');
            console.error('Token validation error:', error);
        } finally {
            setIsValidating(false);
        }
    };

    const handleMarketToggle = (market: string) => {
        const newMarkets = formData.allowedMarkets.includes(market)
            ? formData.allowedMarkets.filter(m => m !== market)
            : [...formData.allowedMarkets, market];

        handleInputChange('allowedMarkets', newMarkets);
    };

    const handleContractTypeToggle = (contractType: string) => {
        const newTypes = formData.allowedContractTypes.includes(contractType)
            ? formData.allowedContractTypes.filter(t => t !== contractType)
            : [...formData.allowedContractTypes, contractType];

        handleInputChange('allowedContractTypes', newTypes);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validationResult?.isValid) {
            setError('Please validate the API token first');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const traderData: Omit<
                CopyTrader,
                | 'id'
                | 'createdAt'
                | 'totalTrades'
                | 'winningTrades'
                | 'totalProfit'
                | 'currentDrawdown'
                | 'connectionStatus'
            > = {
                name: formData.name.trim(),
                email: formData.email.trim() || undefined,
                apiToken: formData.apiToken.trim(),
                appId: formData.appId.trim() || undefined,
                isActive: formData.isActive,
                maxStakePerTrade: formData.maxStakePerTrade,
                maxDailyLoss: formData.maxDailyLoss,
                maxConcurrentTrades: formData.maxConcurrentTrades,
                allowedMarkets: formData.allowedMarkets,
                allowedContractTypes: formData.allowedContractTypes,
                stakeMultiplier: formData.stakeMultiplier,
                followSignals: formData.followSignals,
                followBots: formData.followBots,
                followManualTrades: formData.followManualTrades,
            };

            const result = await copyTradingService.addCopyTrader(traderData);

            if (result.success) {
                onTraderAdded();
            } else {
                setError(result.error || 'Failed to add copy trader');
            }
        } catch (error) {
            setError('Failed to add copy trader');
            console.error('Add trader error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='modal-overlay'>
            <div className='add-copy-trader-modal'>
                <div className='modal-header'>
                    <h2>👤 Add Copy Trader</h2>
                    <button className='close-btn' onClick={onClose}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className='modal-content'>
                    {/* Basic Information */}
                    <div className='form-section'>
                        <h3>📋 Basic Information</h3>

                        <div className='form-group'>
                            <label>Trader Name *</label>
                            <input
                                type='text'
                                value={formData.name}
                                onChange={e => handleInputChange('name', e.target.value)}
                                placeholder='Enter trader name'
                                required
                            />
                        </div>

                        <div className='form-group'>
                            <label>Email (Optional)</label>
                            <input
                                type='email'
                                value={formData.email}
                                onChange={e => handleInputChange('email', e.target.value)}
                                placeholder='trader@example.com'
                            />
                        </div>
                    </div>

                    {/* API Configuration */}
                    <div className='form-section'>
                        <h3>🔐 API Configuration</h3>

                        <div className='form-group'>
                            <label>Deriv API Token *</label>
                            <div className='token-input-group'>
                                <input
                                    type='password'
                                    value={formData.apiToken}
                                    onChange={e => handleInputChange('apiToken', e.target.value)}
                                    placeholder='Enter Deriv API token'
                                    required
                                />
                                <button
                                    type='button'
                                    className='validate-btn'
                                    onClick={handleValidateToken}
                                    disabled={isValidating || !formData.apiToken.trim()}
                                >
                                    {isValidating ? '⏳' : '🔍'} Validate
                                </button>
                            </div>

                            {validationResult && (
                                <div className={`validation-result ${validationResult.isValid ? 'success' : 'error'}`}>
                                    {validationResult.isValid ? (
                                        <div>
                                            <div className='validation-icon'>✅</div>
                                            <div className='validation-info'>
                                                <div>Token is valid!</div>
                                                {validationResult.accountInfo && (
                                                    <div className='account-info'>
                                                        <small>
                                                            Account: {validationResult.accountInfo.loginId} | Currency:{' '}
                                                            {validationResult.accountInfo.currency} | Balance: $
                                                            {validationResult.accountInfo.balance}
                                                        </small>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className='validation-icon'>❌</div>
                                            <div>Invalid token: {validationResult.error}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className='form-group'>
                            <label>App ID (Optional)</label>
                            <input
                                type='text'
                                value={formData.appId}
                                onChange={e => handleInputChange('appId', e.target.value)}
                                placeholder='Custom app ID (leave empty for default)'
                            />
                        </div>
                    </div>

                    {/* Risk Management */}
                    <div className='form-section'>
                        <h3>⚠️ Risk Management</h3>

                        <div className='form-row'>
                            <div className='form-group'>
                                <label>Stake Multiplier</label>
                                <input
                                    type='number'
                                    step='0.1'
                                    min='0.1'
                                    max='10'
                                    value={formData.stakeMultiplier}
                                    onChange={e => handleInputChange('stakeMultiplier', parseFloat(e.target.value))}
                                />
                                <small>Multiplier for your stake amounts (1.0 = same stake, 0.5 = half stake)</small>
                            </div>

                            <div className='form-group'>
                                <label>Max Stake Per Trade ($)</label>
                                <input
                                    type='number'
                                    min='0.35'
                                    step='0.01'
                                    value={formData.maxStakePerTrade}
                                    onChange={e => handleInputChange('maxStakePerTrade', parseFloat(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className='form-row'>
                            <div className='form-group'>
                                <label>Max Daily Loss ($)</label>
                                <input
                                    type='number'
                                    min='1'
                                    step='1'
                                    value={formData.maxDailyLoss}
                                    onChange={e => handleInputChange('maxDailyLoss', parseFloat(e.target.value))}
                                />
                            </div>

                            <div className='form-group'>
                                <label>Max Concurrent Trades</label>
                                <input
                                    type='number'
                                    min='1'
                                    max='20'
                                    value={formData.maxConcurrentTrades}
                                    onChange={e => handleInputChange('maxConcurrentTrades', parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Trading Preferences */}
                    <div className='form-section'>
                        <h3>🎯 Trading Preferences</h3>

                        <div className='checkbox-group'>
                            <label className='checkbox-label'>
                                <input
                                    type='checkbox'
                                    checked={formData.followSignals}
                                    onChange={e => handleInputChange('followSignals', e.target.checked)}
                                />
                                Follow Signal Trades
                            </label>

                            <label className='checkbox-label'>
                                <input
                                    type='checkbox'
                                    checked={formData.followBots}
                                    onChange={e => handleInputChange('followBots', e.target.checked)}
                                />
                                Follow Bot Trades
                            </label>

                            <label className='checkbox-label'>
                                <input
                                    type='checkbox'
                                    checked={formData.followManualTrades}
                                    onChange={e => handleInputChange('followManualTrades', e.target.checked)}
                                />
                                Follow Manual Trades
                            </label>
                        </div>
                    </div>

                    {/* Allowed Markets */}
                    <div className='form-section'>
                        <h3>📊 Allowed Markets (Leave empty for all)</h3>
                        <div className='selection-grid'>
                            {availableMarkets.map(market => (
                                <label key={market} className='selection-item'>
                                    <input
                                        type='checkbox'
                                        checked={formData.allowedMarkets.includes(market)}
                                        onChange={() => handleMarketToggle(market)}
                                    />
                                    {market}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Allowed Contract Types */}
                    <div className='form-section'>
                        <h3>📋 Allowed Contract Types (Leave empty for all)</h3>
                        <div className='selection-grid'>
                            {availableContractTypes.map(type => (
                                <label key={type} className='selection-item'>
                                    <input
                                        type='checkbox'
                                        checked={formData.allowedContractTypes.includes(type)}
                                        onChange={() => handleContractTypeToggle(type)}
                                    />
                                    {type}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className='error-message'>
                            <span className='error-icon'>❌</span>
                            {error}
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className='form-actions'>
                        <button type='button' className='btn btn-secondary' onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button
                            type='submit'
                            className='btn btn-primary'
                            disabled={isSubmitting || !validationResult?.isValid || !formData.name.trim()}
                        >
                            {isSubmitting ? '⏳ Adding...' : '✅ Add Copy Trader'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
