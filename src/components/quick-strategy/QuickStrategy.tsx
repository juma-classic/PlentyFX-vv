import React, { useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { quickStrategyService, QUICK_STRATEGIES, QuickStrategyFormData } from '@/services/quick-strategy.service';
import './QuickStrategy.scss';

// Strategy Card Component
const StrategyCard: React.FC<{
    strategyKey: keyof typeof QUICK_STRATEGIES;
    strategy: typeof QUICK_STRATEGIES[keyof typeof QUICK_STRATEGIES];
    isSelected: boolean;
    onSelect: (key: keyof typeof QUICK_STRATEGIES) => void;
}> = ({ strategyKey, strategy, isSelected, onSelect }) => (
    <div 
        className={`strategy-card ${isSelected ? 'strategy-card--selected' : ''}`}
        onClick={() => onSelect(strategyKey)}
    >
        <div className="strategy-card__header">
            <h3 className="strategy-card__title">{strategy.label}</h3>
            {isSelected && <div className="strategy-card__selected-indicator">✓</div>}
        </div>
        <p className="strategy-card__description">{strategy.description}</p>
    </div>
);

// Form Field Component
const FormField: React.FC<{
    label: string;
    type: 'number' | 'select';
    value: string | number;
    onChange: (value: any) => void;
    options?: { value: string; label: string }[];
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
}> = ({ label, type, value, onChange, options, min, max, step, disabled }) => (
    <div className="form-field">
        <label className="form-field__label">{label}</label>
        {type === 'select' ? (
            <select 
                className="form-field__select"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            >
                {options?.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        ) : (
            <input
                className="form-field__input"
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
            />
        )}
    </div>
);

const QuickStrategy: React.FC = observer(() => {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'select' | 'configure'>('select');

    const {
        selected_strategy,
        form_data,
        current_strategy_config,
        is_valid_form,
        setSelectedStrategy,
        setValue,
        executeStrategy
    } = quickStrategyService;

    // Market options (matching Korean site configuration)
    const marketOptions = [
        { value: '1HZ100V', label: 'Volatility 100 (1s) Index' },  // Korean site default
        { value: '1HZ75V', label: 'Volatility 75 (1s) Index' },
        { value: '1HZ50V', label: 'Volatility 50 (1s) Index' },
        { value: '1HZ25V', label: 'Volatility 25 (1s) Index' },
        { value: '1HZ10V', label: 'Volatility 10 (1s) Index' },
        { value: 'R_100', label: 'Volatility 100 Index' },
        { value: 'R_75', label: 'Volatility 75 Index' },
        { value: 'R_50', label: 'Volatility 50 Index' },
        { value: 'R_25', label: 'Volatility 25 Index' },
        { value: 'R_10', label: 'Volatility 10 Index' }
    ];

    // Trade type options (updated for digit strategies)
    const tradeTypeOptions = [
        { value: 'callput', label: 'Rise/Fall' },
        { value: 'higherlower', label: 'Higher/Lower' },
        { value: 'touchnotouch', label: 'Touch/No Touch' },
        { value: 'endsinout', label: 'Ends In/Out' },
        { value: 'staysinout', label: 'Stays In/Out' },
        { value: 'overunder', label: 'Over/Under' },
        { value: 'evenodd', label: 'Even/Odd' },
        { value: 'matchesdiffers', label: 'Matches/Differs' }
    ];

    // Duration type options
    const durationTypeOptions = [
        { value: 't', label: 'Ticks' },
        { value: 's', label: 'Seconds' },
        { value: 'm', label: 'Minutes' },
        { value: 'h', label: 'Hours' },
        { value: 'd', label: 'Days' }
    ];

    const handleStrategySelect = useCallback((strategyKey: keyof typeof QUICK_STRATEGIES) => {
        setSelectedStrategy(strategyKey);
        setActiveTab('configure');
    }, [setSelectedStrategy]);

    const handleRunStrategy = useCallback(async () => {
        if (!is_valid_form) return;
        
        setIsLoading(true);
        try {
            const success = await executeStrategy(true); // Auto-run the strategy
            if (success) {
                console.log('Quick Strategy executed successfully');
            } else {
                console.error('Failed to execute Quick Strategy');
            }
        } catch (error) {
            console.error('Error executing Quick Strategy:', error);
        } finally {
            setIsLoading(false);
        }
    }, [is_valid_form, executeStrategy]);

    const handleCreateStrategy = useCallback(async () => {
        if (!is_valid_form) return;
        
        setIsLoading(true);
        try {
            const success = await executeStrategy(false); // Just create, don't auto-run
            if (success) {
                console.log('Quick Strategy created successfully');
            } else {
                console.error('Failed to create Quick Strategy');
            }
        } catch (error) {
            console.error('Error creating Quick Strategy:', error);
        } finally {
            setIsLoading(false);
        }
    }, [is_valid_form, executeStrategy]);

    return (
        <div className="quick-strategy">
            <div className="quick-strategy__header">
                <h1 className="quick-strategy__title">Quick Strategy</h1>
                <p className="quick-strategy__subtitle">
                    Choose from pre-built strategies that are 18-72x faster than building from scratch
                </p>
            </div>

            <div className="quick-strategy__tabs">
                <button 
                    className={`quick-strategy__tab ${activeTab === 'select' ? 'quick-strategy__tab--active' : ''}`}
                    onClick={() => setActiveTab('select')}
                >
                    Select Strategy
                </button>
                <button 
                    className={`quick-strategy__tab ${activeTab === 'configure' ? 'quick-strategy__tab--active' : ''}`}
                    onClick={() => setActiveTab('configure')}
                    disabled={!selected_strategy}
                >
                    Configure & Run
                </button>
            </div>

            <div className="quick-strategy__content">
                {activeTab === 'select' && (
                    <div className="quick-strategy__selection">
                        <h2 className="quick-strategy__section-title">Choose Your Strategy</h2>
                        <div className="strategy-cards">
                            {Object.entries(QUICK_STRATEGIES).map(([key, strategy]) => (
                                <StrategyCard
                                    key={key}
                                    strategyKey={key as keyof typeof QUICK_STRATEGIES}
                                    strategy={strategy}
                                    isSelected={selected_strategy === key}
                                    onSelect={handleStrategySelect}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'configure' && selected_strategy && (
                    <div className="quick-strategy__configuration">
                        <div className="quick-strategy__strategy-info">
                            <h2 className="quick-strategy__section-title">
                                Configure {current_strategy_config.label} Strategy
                            </h2>
                            <p className="quick-strategy__strategy-description">
                                {current_strategy_config.description}
                            </p>
                        </div>

                        <div className="quick-strategy__form">
                            <div className="form-section">
                                <h3 className="form-section__title">Market Settings</h3>
                                <div className="form-row">
                                    <FormField
                                        label="Market"
                                        type="select"
                                        value={form_data.symbol}
                                        onChange={(value) => setValue('symbol', value)}
                                        options={marketOptions}
                                        disabled={isLoading}
                                    />
                                    <FormField
                                        label="Trade Type"
                                        type="select"
                                        value={form_data.tradetype}
                                        onChange={(value) => setValue('tradetype', value)}
                                        options={tradeTypeOptions}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="form-section">
                                <h3 className="form-section__title">Duration Settings</h3>
                                <div className="form-row">
                                    <FormField
                                        label="Duration Type"
                                        type="select"
                                        value={form_data.durationtype}
                                        onChange={(value) => setValue('durationtype', value)}
                                        options={durationTypeOptions}
                                        disabled={isLoading}
                                    />
                                    <FormField
                                        label="Duration"
                                        type="number"
                                        value={form_data.duration}
                                        onChange={(value) => setValue('duration', value)}
                                        min={1}
                                        step={1}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="form-section">
                                <h3 className="form-section__title">Strategy Parameters</h3>
                                <div className="form-row">
                                    <FormField
                                        label="Initial Stake"
                                        type="number"
                                        value={form_data.stake}
                                        onChange={(value) => setValue('stake', value)}
                                        min={0.35}
                                        step={0.01}
                                        disabled={isLoading}
                                    />
                                    <FormField
                                        label="Size/Multiplier"
                                        type="number"
                                        value={form_data.size}
                                        onChange={(value) => setValue('size', value)}
                                        min={1}
                                        step={0.1}
                                        disabled={isLoading}
                                    />
                                </div>
                                {selected_strategy === 'OVER_UNDER' && (
                                    <div className="form-row">
                                        <FormField
                                            label="Prediction Digit (0-9)"
                                            type="number"
                                            value={form_data.prediction || 5}
                                            onChange={(value) => setValue('prediction', value)}
                                            min={0}
                                            max={9}
                                            step={1}
                                            disabled={isLoading}
                                        />
                                    </div>
                                )}
                                <div className="form-row">
                                    <FormField
                                        label="Take Profit"
                                        type="number"
                                        value={form_data.profit}
                                        onChange={(value) => setValue('profit', value)}
                                        min={1}
                                        step={1}
                                        disabled={isLoading}
                                    />
                                    <FormField
                                        label="Stop Loss"
                                        type="number"
                                        value={form_data.loss}
                                        onChange={(value) => setValue('loss', value)}
                                        min={1}
                                        step={1}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="quick-strategy__actions">
                                <button
                                    className="quick-strategy__button quick-strategy__button--secondary"
                                    onClick={handleCreateStrategy}
                                    disabled={!is_valid_form || isLoading}
                                >
                                    {isLoading ? 'Creating...' : 'Create Strategy'}
                                </button>
                                <button
                                    className="quick-strategy__button quick-strategy__button--primary"
                                    onClick={handleRunStrategy}
                                    disabled={!is_valid_form || isLoading}
                                >
                                    {isLoading ? 'Running...' : 'Run Strategy'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

export default QuickStrategy;