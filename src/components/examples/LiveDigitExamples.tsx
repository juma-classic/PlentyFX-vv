/**
 * Live Digit Display Examples
 * Shows different ways to use the LiveDigitDisplay component
 */

import React from 'react';
import LiveDigitDisplay from '@/components/shared/LiveDigitDisplay';
import { ConnectionType } from '@/services/deriv-connection-pool.service';

export const LiveDigitExamples: React.FC = () => {
    return (
        <div className="live-digit-examples">
            <h2>Live Digit Display Examples</h2>
            
            {/* Grid Layout - Default */}
            <section className="example-section">
                <h3>Grid Layout (Default)</h3>
                <LiveDigitDisplay 
                    symbol="R_100"
                    layout="grid"
                    size="medium"
                    showStats={true}
                    showCurrentTick={true}
                    showHotDigits={true}
                />
            </section>

            {/* Horizontal Layout */}
            <section className="example-section">
                <h3>Horizontal Layout</h3>
                <LiveDigitDisplay 
                    symbol="R_50"
                    layout="horizontal"
                    size="small"
                    showStats={true}
                    showCurrentTick={false}
                />
            </section>

            {/* Compact Layout */}
            <section className="example-section">
                <h3>Compact Layout</h3>
                <LiveDigitDisplay 
                    symbol="1HZ100V"
                    layout="compact"
                    size="medium"
                    showStats={true}
                    connectionType={ConnectionType.FASTLANE}
                />
            </section>

            {/* Vertical Layout */}
            <section className="example-section">
                <h3>Vertical Layout</h3>
                <LiveDigitDisplay 
                    symbol="BOOM1000"
                    layout="vertical"
                    size="small"
                    showStats={false}
                    showCurrentTick={true}
                />
            </section>

            {/* Large Size with Debug */}
            <section className="example-section">
                <h3>Large Size with Debug</h3>
                <LiveDigitDisplay 
                    symbol="R_25"
                    layout="grid"
                    size="large"
                    showStats={true}
                    showCurrentTick={true}
                    showHotDigits={true}
                    enableDebug={true}
                />
            </section>
        </div>
    );
};

// Example of integrating into an existing component
export const ExampleIntegration: React.FC = () => {
    return (
        <div className="trading-dashboard">
            <div className="main-content">
                <h1>Trading Dashboard</h1>
                
                {/* Your existing content */}
                <div className="trading-controls">
                    {/* Trading controls here */}
                </div>
                
                {/* Add live digit analysis anywhere */}
                <div className="digit-analysis-section">
                    <LiveDigitDisplay 
                        symbol="R_100"
                        layout="grid"
                        size="medium"
                        showStats={true}
                        showCurrentTick={true}
                        className="custom-styling"
                    />
                </div>
                
                {/* More content */}
                <div className="other-content">
                    {/* Other components */}
                </div>
            </div>
            
            {/* Sidebar with compact display */}
            <div className="sidebar">
                <LiveDigitDisplay 
                    symbol="1HZ50V"
                    layout="compact"
                    size="small"
                    showStats={false}
                    connectionType={ConnectionType.FASTLANE}
                />
            </div>
        </div>
    );
};

export default LiveDigitExamples;