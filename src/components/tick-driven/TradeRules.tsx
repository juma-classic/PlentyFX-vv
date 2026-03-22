/**
 * Manual Trade Rule Configuration Component
 * Allows users to create and manage trading rules for tick-driven execution
 */

import React, { useState } from 'react';
import type { TradeRule } from '../../engine/ruleEngine';
import './TradeRules.scss';

interface TradeRulesProps {
    rules: TradeRule[];
    onAddRule: (rule: TradeRule) => void;
    onDeleteRule: (ruleId: string) => void;
    onToggleRule: (ruleId: string, enabled: boolean) => void;
}

export const TradeRules: React.FC<TradeRulesProps> = ({ rules, onAddRule, onDeleteRule, onToggleRule }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newRule, setNewRule] = useState<Partial<TradeRule>>({
        name: '',
        triggerDigit: 0,
        tradesPerTick: 1,
        contractType: 'DIGITEVEN',
        stake: 0.35,
        enabled: true,
        conditions: {
            minInterval: 1000,
            maxPerMinute: 10,
        },
    });

    const contractTypes = [
        { value: 'DIGITEVEN', label: 'Even' },
        { value: 'DIGITODD', label: 'Odd' },
        { value: 'DIGITOVER', label: 'Over' },
        { value: 'DIGITUNDER', label: 'Under' },
        { value: 'DIGITMATCHES', label: 'Matches' },
        { value: 'DIGITDIFFERS', label: 'Differs' },
        { value: 'CALL', label: 'Rise' },
        { value: 'PUT', label: 'Fall' },
    ];

    const handleAddRule = () => {
        if (!newRule.name || newRule.triggerDigit === undefined) {
            alert('Please fill in all required fields');
            return;
        }

        const rule: TradeRule = {
            id: `rule_${Date.now()}`,
            name: newRule.name!,
            enabled: newRule.enabled ?? true,
            triggerDigit: newRule.triggerDigit!,
            tradesPerTick: newRule.tradesPerTick ?? 1,
            contractType: newRule.contractType ?? 'DIGITEVEN',
            stake: newRule.stake ?? 0.35,
            conditions: newRule.conditions,
        };

        onAddRule(rule);
        setNewRule({
            name: '',
            triggerDigit: 0,
            tradesPerTick: 1,
            contractType: 'DIGITEVEN',
            stake: 0.35,
            enabled: true,
            conditions: {
                minInterval: 1000,
                maxPerMinute: 10,
            },
        });
        setShowAddForm(false);
    };

    return (
        <div className='trade-rules'>
            <div className='trade-rules__header'>
                <h3>Trading Rules</h3>
                <button className='trade-rules__add-btn' onClick={() => setShowAddForm(!showAddForm)}>
                    {showAddForm ? 'Cancel' : 'Add Rule'}
                </button>
            </div>

            {showAddForm && (
                <div className='trade-rules__form'>
                    <h4>Create New Rule</h4>

                    <div className='trade-rules__form-row'>
                        <div className='trade-rules__form-group'>
                            <label>Rule Name *</label>
                            <input
                                type='text'
                                value={newRule.name || ''}
                                onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                                placeholder='e.g., Digit 6 Even Strategy'
                            />
                        </div>

                        <div className='trade-rules__form-group'>
                            <label>Trigger Digit *</label>
                            <select
                                value={newRule.triggerDigit ?? 0}
                                onChange={e => setNewRule({ ...newRule, triggerDigit: parseInt(e.target.value) })}
                            >
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                                    <option key={digit} value={digit}>
                                        {digit}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className='trade-rules__form-row'>
                        <div className='trade-rules__form-group'>
                            <label>Trades per Tick</label>
                            <input
                                type='number'
                                min='1'
                                max='10'
                                value={newRule.tradesPerTick ?? 1}
                                onChange={e => setNewRule({ ...newRule, tradesPerTick: parseInt(e.target.value) })}
                            />
                        </div>

                        <div className='trade-rules__form-group'>
                            <label>Contract Type</label>
                            <select
                                value={newRule.contractType ?? 'DIGITEVEN'}
                                onChange={e => setNewRule({ ...newRule, contractType: e.target.value })}
                            >
                                {contractTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className='trade-rules__form-row'>
                        <div className='trade-rules__form-group'>
                            <label>Stake Amount</label>
                            <input
                                type='number'
                                min='0.35'
                                step='0.01'
                                value={newRule.stake ?? 0.35}
                                onChange={e => setNewRule({ ...newRule, stake: parseFloat(e.target.value) })}
                            />
                        </div>

                        <div className='trade-rules__form-group'>
                            <label>Min Interval (ms)</label>
                            <input
                                type='number'
                                min='0'
                                value={newRule.conditions?.minInterval ?? 1000}
                                onChange={e =>
                                    setNewRule({
                                        ...newRule,
                                        conditions: {
                                            ...newRule.conditions,
                                            minInterval: parseInt(e.target.value),
                                        },
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div className='trade-rules__form-actions'>
                        <button className='trade-rules__save-btn' onClick={handleAddRule}>
                            Save Rule
                        </button>
                        <button className='trade-rules__cancel-btn' onClick={() => setShowAddForm(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className='trade-rules__list'>
                {rules.length === 0 ? (
                    <div className='trade-rules__empty'>No trading rules configured. Add a rule to get started.</div>
                ) : (
                    rules.map(rule => (
                        <div key={rule.id} className={`trade-rules__item ${rule.enabled ? 'enabled' : 'disabled'}`}>
                            <div className='trade-rules__item-header'>
                                <div className='trade-rules__item-info'>
                                    <h4>{rule.name}</h4>
                                    <span className='trade-rules__item-details'>
                                        Digit {rule.triggerDigit} → {rule.tradesPerTick} × {rule.contractType} @ $
                                        {rule.stake}
                                    </span>
                                </div>

                                <div className='trade-rules__item-actions'>
                                    <button
                                        className={`trade-rules__toggle ${rule.enabled ? 'enabled' : 'disabled'}`}
                                        onClick={() => onToggleRule(rule.id, !rule.enabled)}
                                    >
                                        {rule.enabled ? 'ON' : 'OFF'}
                                    </button>

                                    <button className='trade-rules__delete' onClick={() => onDeleteRule(rule.id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {rule.conditions && (
                                <div className='trade-rules__item-conditions'>
                                    <span>Conditions:</span>
                                    {rule.conditions.minInterval && (
                                        <span>Min Interval: {rule.conditions.minInterval}ms</span>
                                    )}
                                    {rule.conditions.maxPerMinute && (
                                        <span>Max/Min: {rule.conditions.maxPerMinute}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
