/**
 * Patel Signal Center Page
 * Advanced Statistical Trading Signal Engine
 */

import React from 'react';
import { ProtectedPatelSignalCenter } from '../components/auth/ProtectedPatelSignalCenter';
import { PatelSignalCenterErrorBoundary } from '../components/auth/PatelSignalCenterErrorBoundary';
import { PatelSignalCenter } from '../components/signals/PatelSignalCenter';
import './patel-signal-center-page.scss';

export const PatelSignalCenterPage: React.FC = () => {
    return (
        <div className='patel-signal-center-page'>
            <PatelSignalCenterErrorBoundary>
                <ProtectedPatelSignalCenter>
                    <PatelSignalCenter />
                </ProtectedPatelSignalCenter>
            </PatelSignalCenterErrorBoundary>
        </div>
    );
};

export default PatelSignalCenterPage;
