import React from 'react';
import './SpeedModeConfig.scss';

export interface SpeedModeSettings {
    market: string;
    strategy: 'momentum' | 'reversal' | 'scalping' | 'zeus_ai';
    tradeType: 'DIGITEVEN' | 'DIGITODD' | 'DIGITMATCH' | 'DIGITDIFF' | 'DIGITOVER' | 'DIGITUNDER';
    stake: number;
    targetRuns: number;
    stopLoss: number;
    takeProfit: number;
    duration: number;
    durationType: 't' | 'm';
    barrier?: number; // For DIGITMATCH, DIGITDIFF, DIGITOVER, DIGITUNDER
}

interface SpeedModeConfigProps {
    settings: SpeedModeSettings;
    onSettingsChange: (settings: SpeedModeSettings) => void;
    accountBalance: number;
}

const MARKETS = [
    { value: 'R_10', label: 'Volatility 10 Index' },
    { value: 'R_25', label: 'Volatility 25 Index' },
    { value: 'R_50', label: 'Volatility 50 Index' },
    { value: 'R_75', label: 'Volatility 75 Index' },
    { value: 'R_100', label: 'Volatility 100 Index' },
    { value: '1HZ10V', label: 'Volatility 10 (1s) Index' },
    { value: '1HZ25V', label: 'Volatility 25 (1s) Index' },
    { value: '1HZ50V', label: 'Volatility 50 (1s) Index' },
];

const STRATEGIES = [
    { value: 'momentum', label: '📈 Momentum', description: 'Follow the trend direction' },
    { value: 'reversal', label: '🔄 Reversal', description: 'Trade against the trend' },
    { value: 'scalping', label: '⚡ Scalping', description: 'Quick digit-based trades' },
    { value: 'zeus_ai', label: '🧠 Zeus AI', description: 'AI-powered predictions' },
];

const TRADE_TYPES = [
    { value: 'DIGITEVEN', label: 'Even/Odd - Even', needsBarrier: false },
    { value: 'DIGITODD', label: 'Even/Odd - Odd', needsBarrier: false },
    { value: 'DIGITOVER', label: 'Over - Last digit over', needsBarrier: true },
    { value: 'DIGITUNDER', label: 'Under - Last digit under', needsBarrier: true },
    { value: 'DIGITMATCH', label: 'Matches - Specific Digit', needsBarrier: true },
    { value: 'DIGITDIFF', label: 'Differs - Not Specific Digit', needsBarrier: true },
];

export const SpeedModeConfig: React.FC<SpeedModeConfigProps> = ({ settings, onSettingsChange, accountBalance }) => {
    const updateSetting = (key: keyof SpeedModeSettings, value: string | number) => {
        onSettingsChange({
            ...settings,
            [key]: value,
        });
    };

    const maxStake = Math.min(accountBalance * 0.1, 100); // Max 10% of balance or $100

    return (
        <div className='speed-mode-config'>
            <h3 className='config-title'>⚙️ Speed Trading Configuration</h3>

            <div className='config-grid'>
                {/* Market Selection */}
                <div className='config-group'>
                    <label className='config-label'>Market</label>
                    <select
                        className='config-select'
                        value={settings.market}
                        onChange={e => updateSetting('market', e.target.value)}
                    >
                        {MARKETS.map(market => (
                            <option key={market.value} value={market.value}>
                                {market.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Strategy Selection */}
                <div className='config-group'>
                    <label className='config-label'>Strategy</label>
                    <select
                        className='config-select'
                        value={settings.strategy}
                        onChange={e => updateSetting('strategy', e.target.value)}
                    >
                        {STRATEGIES.map(strategy => (
                            <option key={strategy.value} value={strategy.value}>
                                {strategy.label}
                            </option>
                        ))}
                    </select>
                    <span className='config-description'>
                        {STRATEGIES.find(s => s.value === settings.strategy)?.description}
                    </span>
                </div>

                {/* Trade Type */}
                <div className='config-group'>
                    <label className='config-label'>Trade Type</label>
                    <select
                        className='config-select'
                        value={settings.tradeType}
                        onChange={e => updateSetting('tradeType', e.target.value)}
                    >
                        {TRADE_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Barrier (for Over/Under/Match/Diff) */}
                {TRADE_TYPES.find(t => t.value === settings.tradeType)?.needsBarrier && (
                    <div className='config-group'>
                        <label className='config-label'>
                            {settings.tradeType === 'DIGITOVER' || settings.tradeType === 'DIGITUNDER'
                                ? 'Barrier (0-9)'
                                : 'Target Digit (0-9)'}
                        </label>
                        <input
                            type='number'
                            className='config-input'
                            value={settings.barrier ?? 5}
                            onChange={e => updateSetting('barrier', Math.min(Math.max(Number(e.target.value), 0), 9))}
                            min='0'
                            max='9'
                            step='1'
                        />
                        <span className='config-description'>
                            {settings.tradeType === 'DIGITOVER' && `Win if last digit > ${settings.barrier ?? 5}`}
                            {settings.tradeType === 'DIGITUNDER' && `Win if last digit < ${settings.barrier ?? 5}`}
                            {settings.tradeType === 'DIGITMATCH' && `Win if last digit = ${settings.barrier ?? 5}`}
                            {settings.tradeType === 'DIGITDIFF' && `Win if last digit ≠ ${settings.barrier ?? 5}`}
                        </span>
                    </div>
                )}

                {/* Stake Amount */}
                <div className='config-group'>
                    <label className='config-label'>Stake Amount (Max: ${maxStake.toFixed(2)})</label>
                    <input
                        type='number'
                        className='config-input'
                        value={settings.stake}
                        onChange={e => updateSetting('stake', Math.min(Number(e.target.value), maxStake))}
                        min='0.35'
                        max={maxStake}
                        step='0.01'
                    />
                </div>

                {/* Target Runs */}
                <div className='config-group'>
                    <label className='config-label'>Target Runs</label>
                    <input
                        type='number'
                        className='config-input'
                        value={settings.targetRuns}
                        onChange={e => updateSetting('targetRuns', Number(e.target.value))}
                        min='1'
                        max='100'
                    />
                </div>

                {/* Duration */}
                <div className='config-group'>
                    <label className='config-label'>Contract Duration</label>
                    <div className='duration-group'>
                        <input
                            type='number'
                            className='config-input duration-input'
                            value={settings.duration}
                            onChange={e => updateSetting('duration', Number(e.target.value))}
                            min='1'
                            max={settings.durationType === 't' ? 10 : 60}
                        />
                        <select
                            className='config-select duration-select'
                            value={settings.durationType}
                            onChange={e => updateSetting('durationType', e.target.value)}
                        >
                            <option value='t'>Ticks</option>
                            <option value='m'>Minutes</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Risk Management */}
            <div className='risk-management'>
                <h4 className='risk-title'>🛡️ Risk Management</h4>
                <div className='risk-grid'>
                    <div className='config-group'>
                        <label className='config-label'>Stop Loss ($)</label>
                        <input
                            type='number'
                            className='config-input'
                            value={settings.stopLoss}
                            onChange={e => updateSetting('stopLoss', Number(e.target.value))}
                            min='0'
                            max={accountBalance * 0.5}
                        />
                    </div>
                    <div className='config-group'>
                        <label className='config-label'>Take Profit ($)</label>
                        <input
                            type='number'
                            className='config-input'
                            value={settings.takeProfit}
                            onChange={e => updateSetting('takeProfit', Number(e.target.value))}
                            min='0'
                        />
                    </div>
                </div>
            </div>

            {/* Account Info */}
            <div className='account-info'>
                <div className='balance-display'>
                    <span className='balance-label'>Account Balance:</span>
                    <span className='balance-value'>${accountBalance.toFixed(2)}</span>
                </div>
                <div className='risk-warning'>
                    ⚠️ Speed trading involves high risk. Only trade with money you can afford to lose.
                </div>
            </div>
        </div>
    );
};
