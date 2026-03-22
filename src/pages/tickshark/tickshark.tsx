/**
 * TickShark Trading Interface Page
 * Professional latency arbitrage trading platform
 */

import React, { useState } from 'react';
import { Localize } from '@deriv-com/translations';
import TickSharkDashboard from '../../components/tickshark/TickSharkDashboard';
import { TradingMode } from '../../services/tickshark/mode-manager.service';
import './tickshark.scss';

export const TickSharkPage: React.FC = () => {
    const [showPreview, setShowPreview] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleModeChange = (mode: TradingMode) => {
        console.log('🦈 Mode changed to:', mode);
    };

    const handleError = (errorMessage: string) => {
        setError(errorMessage);
        console.error('🦈 TickShark error:', errorMessage);
        
        // Auto-clear error after 5 seconds
        setTimeout(() => setError(null), 5000);
    };

    // Show preview interface if requested
    if (showPreview) {
        return (
            <div className='tickshark-page'>
                <div className='tickshark-header'>
                    <div className='tickshark-logo'>
                        <svg width='32' height='32' viewBox='0 0 24 24' fill='none'>
                            <path
                                d='M12 2L2 7L12 12L22 7L12 2Z'
                                fill='currentColor'
                                opacity='0.3'
                            />
                            <path
                                d='M2 17L12 22L22 17'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                            <path
                                d='M2 12L12 17L22 12'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                        </svg>
                        <h1>TickShark Preview</h1>
                    </div>
                    <button 
                        className='switch-mode-btn'
                        onClick={() => setShowPreview(false)}
                    >
                        <Localize i18n_default_text='Switch to Professional Dashboard' />
                    </button>
                </div>

                <div className='preview-notice'>
                    <div className='notice-card'>
                        <h3>🦈 TickShark Professional Dashboard Available!</h3>
                        <p>
                            <Localize i18n_default_text='The full TickShark professional trading platform is now available with advanced features including:' />
                        </p>
                        <ul>
                            <li>Real-time latency arbitrage analysis</li>
                            <li>Professional mode switching system</li>
                            <li>Advanced safety controls and circuit breakers</li>
                            <li>Comprehensive simulation environment</li>
                            <li>Enterprise-grade execution control</li>
                        </ul>
                        <button 
                            className='launch-dashboard-btn'
                            onClick={() => setShowPreview(false)}
                        >
                            🚀 Launch Professional Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main TickShark Professional Dashboard
    return (
        <div className='tickshark-professional-page'>
            {/* Error Display */}
            {error && (
                <div className='error-banner'>
                    <div className='error-content'>
                        <span className='error-icon'>⚠️</span>
                        <span className='error-message'>{error}</span>
                        <button 
                            className='error-close'
                            onClick={() => setError(null)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Professional Dashboard */}
            <TickSharkDashboard
                initialMode='MANUAL_OBSERVATION'
                onModeChange={handleModeChange}
                onError={handleError}
                showAdvancedControls={true}
            />

            {/* Footer with Preview Option */}
            <div className='tickshark-footer'>
                <button 
                    className='preview-mode-btn'
                    onClick={() => setShowPreview(true)}
                    title='Switch to preview interface'
                >
                    <span className='btn-icon'>👁️</span>
                    <Localize i18n_default_text='Preview Mode' />
                </button>
                
                <div className='footer-info'>
                    <span className='version-info'>TickShark v1.0 - Professional Latency Arbitrage Platform</span>
                </div>
            </div>
        </div>
    );
};

export default TickSharkPage;