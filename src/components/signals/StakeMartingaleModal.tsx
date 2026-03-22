import React, { useEffect, useState } from 'react';
import { stakeManager } from '@/services/stake-manager.service';
import './StakeMartingaleModal.scss';

interface StakeMartingaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (stake: number, martingale: number) => void;
    title?: string;
}

export const StakeMartingaleModal: React.FC<StakeMartingaleModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Select Stake and Martingale',
}) => {
    const [stake, setStake] = useState<string>('');
    const [martingale, setMartingale] = useState<string>('');
    const [errors, setErrors] = useState<{ stake?: string; martingale?: string }>({});

    // Load current settings when modal opens
    useEffect(() => {
        if (isOpen) {
            const settings = stakeManager.getSettings();
            setStake(settings.stake.toString());
            setMartingale(settings.martingale.toString());
            setErrors({});
        }
    }, [isOpen]);

    const validateInputs = (): boolean => {
        const newErrors: { stake?: string; martingale?: string } = {};

        const stakeNum = parseFloat(stake);
        const martingaleNum = parseFloat(martingale);

        if (!stake || isNaN(stakeNum) || stakeNum < 0.01) {
            newErrors.stake = 'Stake must be at least $0.01';
        } else if (stakeNum > 10000) {
            newErrors.stake = 'Stake cannot exceed $10,000';
        }

        if (!martingale || isNaN(martingaleNum) || martingaleNum < 1.0) {
            newErrors.martingale = 'Martingale must be at least 1.0';
        } else if (martingaleNum > 10) {
            newErrors.martingale = 'Martingale cannot exceed 10.0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleProceed = () => {
        if (validateInputs()) {
            const stakeNum = parseFloat(stake);
            const martingaleNum = parseFloat(martingale);

            // Update global settings
            stakeManager.updateSettings(stakeNum, martingaleNum);

            // Call the confirmation callback
            onConfirm(stakeNum, martingaleNum);

            // Close modal
            onClose();
        }
    };

    const handleStakeChange = (value: string) => {
        // Allow only numbers and decimal point
        const sanitized = value.replace(/[^0-9.]/g, '');
        // Prevent multiple decimal points
        const parts = sanitized.split('.');
        if (parts.length > 2) {
            return;
        }
        setStake(sanitized);

        // Clear error when user starts typing
        if (errors.stake) {
            setErrors(prev => ({ ...prev, stake: undefined }));
        }
    };

    const handleMartingaleChange = (value: string) => {
        // Allow only numbers and decimal point
        const sanitized = value.replace(/[^0-9.]/g, '');
        // Prevent multiple decimal points
        const parts = sanitized.split('.');
        if (parts.length > 2) {
            return;
        }
        setMartingale(sanitized);

        // Clear error when user starts typing
        if (errors.martingale) {
            setErrors(prev => ({ ...prev, martingale: undefined }));
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleProceed();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className='stake-martingale-modal-overlay' onClick={onClose}>
            <div
                className='stake-martingale-modal'
                onClick={e => e.stopPropagation()}
                onKeyDown={handleKeyPress}
                tabIndex={-1}
            >
                {/* Header */}
                <div className='stake-martingale-modal__header'>
                    <h2 className='stake-martingale-modal__title'>{title}</h2>
                    <button className='stake-martingale-modal__close' onClick={onClose} aria-label='Close modal'>
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className='stake-martingale-modal__content'>
                    {/* Stake Input */}
                    <div className='stake-martingale-modal__field'>
                        <label className='stake-martingale-modal__label'>Stake:</label>
                        <div className='stake-martingale-modal__input-wrapper'>
                            <input
                                type='text'
                                className={`stake-martingale-modal__input ${errors.stake ? 'error' : ''}`}
                                placeholder='Enter stake'
                                value={stake}
                                onChange={e => handleStakeChange(e.target.value)}
                                autoFocus
                            />
                            <span className='stake-martingale-modal__currency'>$</span>
                        </div>
                        {errors.stake && <span className='stake-martingale-modal__error'>{errors.stake}</span>}
                    </div>

                    {/* Martingale Input */}
                    <div className='stake-martingale-modal__field'>
                        <label className='stake-martingale-modal__label'>Martingale:</label>
                        <div className='stake-martingale-modal__input-wrapper'>
                            <input
                                type='text'
                                className={`stake-martingale-modal__input ${errors.martingale ? 'error' : ''}`}
                                placeholder='Enter martingale'
                                value={martingale}
                                onChange={e => handleMartingaleChange(e.target.value)}
                            />
                            <span className='stake-martingale-modal__multiplier'>×</span>
                        </div>
                        {errors.martingale && (
                            <span className='stake-martingale-modal__error'>{errors.martingale}</span>
                        )}
                    </div>

                    {/* Info Text */}
                    <div className='stake-martingale-modal__info'>
                        <p>These settings will be applied to all future bot loads and saved for 24 hours.</p>
                        <p>
                            Current: <strong>${stakeManager.getFormattedStake()}</strong> stake,{' '}
                            <strong>{stakeManager.getFormattedMartingale()}</strong> martingale
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className='stake-martingale-modal__footer'>
                    <button
                        className='stake-martingale-modal__button stake-martingale-modal__button--secondary'
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className='stake-martingale-modal__button stake-martingale-modal__button--primary'
                        onClick={handleProceed}
                        disabled={!stake || !martingale}
                    >
                        Proceed
                    </button>
                </div>
            </div>
        </div>
    );
};
