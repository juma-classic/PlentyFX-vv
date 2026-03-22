import React from 'react';
import { FakeRealBalanceResetPanel } from './FakeRealBalanceResetPanel';
import './FakeRealModeIndicator.scss';

export const FakeRealModeIndicator: React.FC = () => {
    // Indicator itself stays hidden to maintain believability,
    // but we mount the reset panel here so it can respond to the reset event.
    return <FakeRealBalanceResetPanel />;
};
