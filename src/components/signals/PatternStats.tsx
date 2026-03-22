import React, { useEffect, useState } from 'react';
import { PatternAnalysis } from '@/utils/pattern-analyzer';
import './PatternStats.scss';

interface PatternStatsProps {
    analysis: PatternAnalysis;
    type: 'evenodd' | 'risefall' | 'overunder';
}

export const PatternStats: React.FC<PatternStatsProps> = ({ analysis, type }) => {
    const [shouldAlert, setShouldAlert] = useState(false);
    const [hasPlayedSound, setHasPlayedSound] = useState(false);

    // Trigger alert animation for high-confidence signals
    useEffect(() => {
        if (analysis.confidenceLevel === 'VERY_HIGH' || analysis.confidenceLevel === 'HIGH') {
            setShouldAlert(true);

            // Play sound notification for very high confidence
            if (analysis.confidenceLevel === 'VERY_HIGH' && !hasPlayedSound) {
                playNotificationSound();
                setHasPlayedSound(true);
            }

            // Reset alert after animation
            const timer = setTimeout(() => setShouldAlert(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [analysis.confidenceLevel, hasPlayedSound]);

    // Reset sound flag when confidence drops
    useEffect(() => {
        if (analysis.confidenceLevel !== 'VERY_HIGH') {
            setHasPlayedSound(false);
        }
    }, [analysis.confidenceLevel]);

    const playNotificationSound = () => {
        try {
            // Create a simple beep sound
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Could not play notification sound:', error);
        }
    };

    const getActionClass = () => {
        switch (analysis.suggestedAction) {
            case 'ENTER_NOW':
                return 'enter-now';
            case 'HIGH_RISK':
                return 'high-risk';
            case 'EXTREME_CAUTION':
                return 'extreme-caution';
            default:
                return 'wait';
        }
    };

    const getConfidenceClass = () => {
        switch (analysis.confidenceLevel) {
            case 'VERY_HIGH':
                return 'very-high';
            case 'HIGH':
                return 'high';
            case 'MEDIUM':
                return 'medium';
            default:
                return 'low';
        }
    };

    const getTypeLabels = () => {
        switch (type) {
            case 'evenodd':
                return { primary: 'EVEN', secondary: 'ODD' };
            case 'risefall':
                return { primary: 'RISE', secondary: 'FALL' };
            default:
                return { primary: 'OVER', secondary: 'UNDER' };
        }
    };

    const labels = getTypeLabels();

    return (
        <div className={`pattern-stats ${shouldAlert ? 'alert-active' : ''}`}>
            {/* Streak Info */}
            <div className='stat-row streak-info'>
                <div className='stat-icon'>🔥</div>
                <div className='stat-content'>
                    <div className='stat-label'>Current Streak</div>
                    <div className='stat-value'>
                        {analysis.streakCount} consecutive {analysis.streakType}
                        {analysis.fibonacciSignal && <span className='fibonacci-badge'>📐 Fibonacci!</span>}
                    </div>
                </div>
            </div>

            {/* Pattern Detection */}
            {(analysis.isAlternating || analysis.hasTripleStreak || analysis.hasDoubleStreak) && (
                <div className='stat-row pattern-detection'>
                    <div className='stat-icon'>🎯</div>
                    <div className='stat-content'>
                        <div className='stat-label'>Pattern Detected</div>
                        <div className='stat-value'>
                            {analysis.isAlternating && `Alternating (${analysis.alternatingLength} cycles)`}
                            {analysis.hasTripleStreak && 'Triple Streak Pattern'}
                            {analysis.hasDoubleStreak && !analysis.hasTripleStreak && 'Double Streak Pattern'}
                        </div>
                    </div>
                </div>
            )}

            {/* Distribution */}
            <div className='stat-row distribution'>
                <div className='stat-icon'>📊</div>
                <div className='stat-content'>
                    <div className='stat-label'>Distribution</div>
                    <div className='distribution-bars'>
                        <div className='distribution-bar'>
                            <span className='bar-label'>{labels.primary}</span>
                            <div className='bar-container'>
                                <div
                                    className='bar-fill primary'
                                    style={{ width: `${analysis.distribution.primary}%` }}
                                >
                                    {analysis.distribution.primary}%
                                </div>
                            </div>
                        </div>
                        <div className='distribution-bar'>
                            <span className='bar-label'>{labels.secondary}</span>
                            <div className='bar-container'>
                                <div
                                    className='bar-fill secondary'
                                    style={{ width: `${analysis.distribution.secondary}%` }}
                                >
                                    {analysis.distribution.secondary}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Win Probability */}
            <div className='stat-row win-probability'>
                <div className='stat-icon'>💎</div>
                <div className='stat-content'>
                    <div className='stat-label'>Win Probability</div>
                    <div className={`stat-value probability ${getConfidenceClass()}`}>
                        {analysis.winProbability}%
                        <span className='confidence-badge'>{analysis.confidenceLevel.replace('_', ' ')}</span>
                    </div>
                </div>
            </div>

            {/* Suggested Action */}
            <div className={`stat-row suggested-action ${getActionClass()}`}>
                <div className='action-header'>
                    <div className='action-icon'>
                        {analysis.suggestedAction === 'ENTER_NOW' && '⚡'}
                        {analysis.suggestedAction === 'HIGH_RISK' && '⚠️'}
                        {analysis.suggestedAction === 'WAIT' && '⏸️'}
                        {analysis.suggestedAction === 'EXTREME_CAUTION' && '🛑'}
                    </div>
                    <div className='action-text'>{analysis.suggestedAction.replace('_', ' ')}</div>
                </div>
                <div className='action-reason'>{analysis.actionReason}</div>
            </div>
        </div>
    );
};
