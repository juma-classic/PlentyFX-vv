import React, { useEffect, useState } from 'react';
import { LivePatternDisplay } from '../components/signals/LivePatternDisplay';
import { StreakCounter } from '../components/signals/StreakCounter';
import type { StreakMilestone } from '../hooks/useStreakCounter';
import './live-signals-demo.scss';

export const LiveSignalsDemo: React.FC = () => {
    const [pattern, setPattern] = useState<('EVEN' | 'ODD')[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [speed, setSpeed] = useState(1000);
    const [milestones, setMilestones] = useState<StreakMilestone[]>([]);

    // Simulate live tick data
    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            setPattern(prev => {
                const newTick: 'EVEN' | 'ODD' = Math.random() > 0.5 ? 'EVEN' : 'ODD';
                return [...prev, newTick].slice(-18) as ('EVEN' | 'ODD')[]; // Keep last 18
            });
        }, speed);

        return () => clearInterval(interval);
    }, [isRunning, speed]);

    const handleMilestone = (milestone: StreakMilestone) => {
        setMilestones(prev => [...prev, milestone].slice(-5));
        console.log('🎉 Milestone reached:', milestone);
    };

    const startDemo = () => {
        setIsRunning(true);
    };

    const stopDemo = () => {
        setIsRunning(false);
    };

    const resetDemo = () => {
        setPattern([]);
        setMilestones([]);
        setIsRunning(false);
    };

    const addManualTick = (type: 'EVEN' | 'ODD') => {
        setPattern(prev => [...prev, type].slice(-18));
    };

    return (
        <div className='live-signals-demo'>
            <div className='demo-header'>
                <h1>🚀 Live Signals Demo - Phase 1</h1>
                <p>See the new real-time pattern display and streak counter in action!</p>
            </div>

            {/* Controls */}
            <div className='demo-controls'>
                <div className='control-group'>
                    <h3>Simulation Controls</h3>
                    <div className='buttons'>
                        <button onClick={startDemo} disabled={isRunning} className='btn-start'>
                            ▶️ Start Auto-Ticks
                        </button>
                        <button onClick={stopDemo} disabled={!isRunning} className='btn-stop'>
                            ⏸️ Stop
                        </button>
                        <button onClick={resetDemo} className='btn-reset'>
                            🔄 Reset
                        </button>
                    </div>
                </div>

                <div className='control-group'>
                    <h3>Speed: {speed}ms</h3>
                    <input
                        type='range'
                        min='100'
                        max='2000'
                        step='100'
                        value={speed}
                        onChange={e => setSpeed(Number(e.target.value))}
                        className='speed-slider'
                    />
                </div>

                <div className='control-group'>
                    <h3>Manual Ticks</h3>
                    <div className='buttons'>
                        <button onClick={() => addManualTick('EVEN')} className='btn-even'>
                            Add EVEN
                        </button>
                        <button onClick={() => addManualTick('ODD')} className='btn-odd'>
                            Add ODD
                        </button>
                    </div>
                </div>
            </div>

            {/* Component Showcase */}
            <div className='demo-showcase'>
                <div className='showcase-section'>
                    <div className='section-header'>
                        <h2>1️⃣ Live Pattern Display</h2>
                        <p>Shows last 18 ticks with smooth animations</p>
                    </div>
                    <div className='component-wrapper'>
                        <LivePatternDisplay
                            pattern={pattern}
                            onPatternChange={p => console.log('Pattern changed:', p)}
                        />
                    </div>
                    <div className='feature-list'>
                        <h4>✨ Features you&apos;ll see:</h4>
                        <ul>
                            <li>
                                ✅ <strong>Green boxes</strong> = EVEN numbers
                            </li>
                            <li>
                                ✅ <strong>Red boxes</strong> = ODD numbers
                            </li>
                            <li>
                                ✅ <strong>Pulsing blue dot</strong> on latest tick
                            </li>
                            <li>
                                ✅ <strong>Glow effect</strong> when pattern changes
                            </li>
                            <li>
                                ✅ <strong>Pattern age</strong> (how long since first tick)
                            </li>
                            <li>
                                ✅ <strong>Smooth transitions</strong> between colors
                            </li>
                            <li>
                                ✅ <strong>2 rows of 9 boxes</strong> each
                            </li>
                        </ul>
                    </div>
                </div>

                <div className='showcase-section'>
                    <div className='section-header'>
                        <h2>2️⃣ Streak Counter</h2>
                        <p>Tracks consecutive patterns with smart alerts</p>
                    </div>
                    <div className='component-wrapper'>
                        <StreakCounter pattern={pattern} onMilestone={handleMilestone} />
                    </div>
                    <div className='feature-list'>
                        <h4>✨ Features you&apos;ll see:</h4>
                        <ul>
                            <li>
                                ✅ <strong>Big number</strong> = current streak count
                            </li>
                            <li>
                                ✅ <strong>Circular meter</strong> = probability of continuation
                            </li>
                            <li>
                                ✅ <strong>🔥 Fire icon</strong> = significant streak (5+)
                            </li>
                            <li>
                                ✅ <strong>φ Badge</strong> = Fibonacci number (5, 8, 13, etc.)
                            </li>
                            <li>
                                ✅ <strong>Color changes</strong>:
                                <ul>
                                    <li>Normal (1-4) = Gray border</li>
                                    <li>Warning (5-6) = Yellow border</li>
                                    <li>Danger (7-9) = Orange border</li>
                                    <li>Critical (10+) = Red pulsing border</li>
                                </ul>
                            </li>
                            <li>
                                ✅ <strong>Transition text</strong> = &quot;5 EVEN → 6 EVEN&quot;
                            </li>
                            <li>
                                ✅ <strong>Milestone history</strong> = Recent achievements
                            </li>
                            <li>
                                ✅ <strong>Bounce animation</strong> when count increases
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Milestone Log */}
                {milestones.length > 0 && (
                    <div className='showcase-section'>
                        <div className='section-header'>
                            <h2>🎉 Milestone Alerts</h2>
                            <p>Triggered at 5, 7, 10, 15, 20+ streaks</p>
                        </div>
                        <div className='milestone-log'>
                            {milestones.map((m, i) => (
                                <div key={i} className='milestone-item'>
                                    <span className='milestone-icon'>🎯</span>
                                    <span className='milestone-text'>
                                        <strong>{m.count}</strong> consecutive <strong>{m.type}</strong>
                                    </span>
                                    <span className='milestone-time'>{new Date(m.timestamp).toLocaleTimeString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className='demo-instructions'>
                <h3>📖 How to Use This Demo</h3>
                <ol>
                    <li>
                        <strong>Click &quot;Start Auto-Ticks&quot;</strong> to simulate live trading data
                    </li>
                    <li>
                        <strong>Watch the pattern boxes</strong> fill up with green (EVEN) and red (ODD)
                    </li>
                    <li>
                        <strong>See the streak counter</strong> update in real-time
                    </li>
                    <li>
                        <strong>Try manual ticks</strong> to create specific patterns (e.g., 10 EVENs in a row)
                    </li>
                    <li>
                        <strong>Adjust speed</strong> to see animations faster or slower
                    </li>
                    <li>
                        <strong>Look for special effects</strong>:
                        <ul>
                            <li>Glow when pattern changes</li>
                            <li>Pulse on latest tick</li>
                            <li>Fire icon on long streaks</li>
                            <li>Fibonacci badge (φ) on special numbers</li>
                            <li>Border color changes based on streak length</li>
                        </ul>
                    </li>
                </ol>
            </div>

            {/* Stats */}
            <div className='demo-stats'>
                <div className='stat-card'>
                    <div className='stat-value'>{pattern.length}</div>
                    <div className='stat-label'>Total Ticks</div>
                </div>
                <div className='stat-card'>
                    <div className='stat-value'>{pattern.filter(p => p === 'EVEN').length}</div>
                    <div className='stat-label'>EVEN Count</div>
                </div>
                <div className='stat-card'>
                    <div className='stat-value'>{pattern.filter(p => p === 'ODD').length}</div>
                    <div className='stat-label'>ODD Count</div>
                </div>
                <div className='stat-card'>
                    <div className='stat-value'>{milestones.length}</div>
                    <div className='stat-label'>Milestones</div>
                </div>
            </div>
        </div>
    );
};
