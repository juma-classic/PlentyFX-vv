/**
 * Signal Savvy Integration Page
 * Embeds the Signal Savvy application as an iframe
 * Protected with password authentication
 */

import React from 'react';
import { ProtectedSignalSavvy } from '../components/auth/ProtectedSignalSavvy';
import './signal-savvy-page.scss';

export const SignalSavvyPage: React.FC = () => {
    return (
        <ProtectedSignalSavvy>
            <div className='signal-savvy-page'>
                <div className='signal-savvy-page__header'>
                    <h1>📡 Signal Savvy</h1>
                    <p>Advanced Signal Generation & Analysis Platform</p>
                </div>

                <div className='signal-savvy-page__container'>
                    <iframe
                        src='/signals/signal-savvy/index.html'
                        title='Signal Savvy Application'
                        className='signal-savvy-page__iframe'
                        allow='clipboard-write'
                        sandbox='allow-same-origin allow-scripts allow-forms allow-popups allow-modals'
                    />
                </div>
            </div>
        </ProtectedSignalSavvy>
    );
};

export default SignalSavvyPage;
