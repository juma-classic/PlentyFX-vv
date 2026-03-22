/**
 * FakeRealBalanceResetPanel
 * Appears when the user types "reset" + Enter in fake real mode.
 * Lets them enter a custom starting balance before confirming.
 */

import React, { useEffect, useRef, useState } from 'react';
import { fakeRealBalanceTracker } from '@/services/fake-real-balance-tracker.service';

export const FakeRealBalanceResetPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleOpen = () => {
            if (!fakeRealBalanceTracker.isFakeRealModeActive()) return;
            setInputValue('');
            setError('');
            setIsOpen(true);
        };

        window.addEventListener('fake-real-open-reset-panel', handleOpen);
        return () => window.removeEventListener('fake-real-open-reset-panel', handleOpen);
    }, []);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        const parsed = parseFloat(inputValue.replace(/,/g, ''));
        if (isNaN(parsed) || parsed < 0) {
            setError('Please enter a valid positive number.');
            return;
        }
        // Set the balance directly in localStorage then fire update event
        localStorage.setItem('fake_real_balance', parsed.toString());
        localStorage.removeItem('demo_balance_snapshot');
        window.dispatchEvent(new CustomEvent('fake-real-balance-updated'));
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleConfirm();
        if (e.key === 'Escape') setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className='frbrp-overlay' onClick={() => setIsOpen(false)}>
            <div className='frbrp-panel' onClick={e => e.stopPropagation()}>
                <div className='frbrp-panel-inner'>
                <div className='frbrp-header'>
                    <span className='frbrp-icon'>💰</span>
                    <h3>Set Balance</h3>
                    <button className='frbrp-close' onClick={() => setIsOpen(false)}>✕</button>
                </div>
                <div className='frbrp-divider' />
                <p className='frbrp-desc'>Enter the balance to load into your account.</p>
                <div className='frbrp-input-row'>
                    <span className='frbrp-currency'>USD</span>
                    <input
                        ref={inputRef}
                        type='number'
                        min='0'
                        step='0.01'
                        className='frbrp-input'
                        placeholder='e.g. 5000.00'
                        value={inputValue}
                        onChange={e => { setInputValue(e.target.value); setError(''); }}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                {error && <p className='frbrp-error'>{error}</p>}
                <div className='frbrp-actions'>
                    <button className='frbrp-btn frbrp-btn--cancel' onClick={() => setIsOpen(false)}>Cancel</button>
                    <button className='frbrp-btn frbrp-btn--confirm' onClick={handleConfirm}>Set Balance</button>
                </div>
                </div>
            </div>
        </div>
    );
};
