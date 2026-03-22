import React from 'react';
import { ProtectedPatelSignals } from '../components/auth/ProtectedPatelSignals';
import { PatelSignalsErrorBoundary } from '../components/auth/PatelSignalsErrorBoundary';
import PatelSignals from '../components/signals/patel/PatelSignals';
import './patel-signals-page.scss';

const PatelSignalsPage: React.FC = () => {
    return (
        <div className='patel-signals-page'>
            <PatelSignalsErrorBoundary>
                <ProtectedPatelSignals>
                    <PatelSignals />
                </ProtectedPatelSignals>
            </PatelSignalsErrorBoundary>
        </div>
    );
};

export default PatelSignalsPage;
