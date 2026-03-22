import React, { useState } from 'react';
import { DigitHackerSignals } from '@/components/signals/DigitHackerSignals';
import { ProtectedDigitHacker } from '@/components/auth/ProtectedDigitHacker';
import './digit-hacker-page.scss';

type SignalFilter = 'ALL' | 'EVEN_ODD' | 'DIGIT_MATCHES' | 'OVER_UNDER';

export const DigitHackerPage: React.FC = () => {
    const [activeFilter, setActiveFilter] = useState<SignalFilter>('ALL');

    return (
        <ProtectedDigitHacker>
            <div className='digit-hacker-page'>
                <div className='page-header-fixed'>
                    <div className='header-content'>
                        <h1 className='page-title'>
                            <span className='title-icon'>🎯</span>
                            Digit Hacker AI
                            <span className='new-badge'>NEW</span>
                        </h1>
                        <p className='page-description'>
                            AI-powered trading signals with three prediction types: EVEN/ODD, Digit Matches, and
                            OVER/UNDER analysis
                        </p>
                    </div>
                </div>

                <div className='page-content-scrollable'>
                    <div className='info-cards'>
                        <button
                            className={`info-card clickable ${activeFilter === 'EVEN_ODD' ? 'active' : ''}`}
                            onClick={() => setActiveFilter(activeFilter === 'EVEN_ODD' ? 'ALL' : 'EVEN_ODD')}
                        >
                            <div className='card-icon'>🎲</div>
                            <h3>EVEN/ODD</h3>
                            <p>Analyzes last 30 ticks to predict majority pattern with &gt;55% confidence</p>
                            {activeFilter === 'EVEN_ODD' && <div className='active-indicator'>✓ Active Filter</div>}
                        </button>
                        <button
                            className={`info-card clickable ${activeFilter === 'DIGIT_MATCHES' ? 'active' : ''}`}
                            onClick={() => setActiveFilter(activeFilter === 'DIGIT_MATCHES' ? 'ALL' : 'DIGIT_MATCHES')}
                        >
                            <div className='card-icon'>🎯</div>
                            <h3>Digit Matches</h3>
                            <p>Identifies most frequent digit (0-9) with &gt;20% confidence above random</p>
                            {activeFilter === 'DIGIT_MATCHES' && (
                                <div className='active-indicator'>✓ Active Filter</div>
                            )}
                        </button>
                        <button
                            className={`info-card clickable ${activeFilter === 'OVER_UNDER' ? 'active' : ''}`}
                            onClick={() => setActiveFilter(activeFilter === 'OVER_UNDER' ? 'ALL' : 'OVER_UNDER')}
                        >
                            <div className='card-icon'>📊</div>
                            <h3>OVER/UNDER</h3>
                            <p>Predicts digit ranges with &gt;58% or &lt;42% ratio for optimal entry</p>
                            {activeFilter === 'OVER_UNDER' && <div className='active-indicator'>✓ Active Filter</div>}
                        </button>
                    </div>

                    <div className='signals-container'>
                        <DigitHackerSignals activeFilter={activeFilter} />
                    </div>

                    <div className='how-it-works'>
                        <h2>How It Works</h2>
                        <div className='steps'>
                            <div className='step'>
                                <div className='step-number'>1</div>
                                <div className='step-content'>
                                    <h4>Real-Time Analysis</h4>
                                    <p>AI analyzes 30 ticks from 10 volatility markets simultaneously</p>
                                </div>
                            </div>
                            <div className='step'>
                                <div className='step-number'>2</div>
                                <div className='step-content'>
                                    <h4>Signal Generation</h4>
                                    <p>Generates signals when confidence thresholds are met</p>
                                </div>
                            </div>
                            <div className='step'>
                                <div className='step-number'>3</div>
                                <div className='step-content'>
                                    <h4>Countdown Timer</h4>
                                    <p>10-second countdown before optimal entry point</p>
                                </div>
                            </div>
                            <div className='step'>
                                <div className='step-number'>4</div>
                                <div className='step-content'>
                                    <h4>Trade Execution</h4>
                                    <p>Execute trade within 60-second validity window</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedDigitHacker>
    );
};
