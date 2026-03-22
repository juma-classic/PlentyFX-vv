import React, { useRef,useState } from 'react';
import { animationController } from '../../utils/animation-controller';
import type { AlertType } from './FlashAlert';
import { FlashAlert } from './FlashAlert';
import './FlashAnimationDemo.scss';

export const FlashAnimationDemo: React.FC = () => {
    const [alerts, setAlerts] = useState<Array<{ id: number; type: AlertType; message: string }>>([]);
    const boxRef = useRef<HTMLDivElement>(null);

    const showAlert = (type: AlertType, message: string) => {
        const id = Date.now();
        setAlerts(prev => [...prev, { id, type, message }]);

        // Auto-remove after duration
        setTimeout(() => {
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        }, 2500);
    };

    const triggerFlash = (color: string) => {
        animationController.flash(color, 500, 'high');
    };

    const triggerShake = () => {
        if (boxRef.current) {
            animationController.shake(boxRef.current, 15, 500);
        }
    };

    const triggerConfetti = () => {
        animationController.confetti(3000);
    };

    const triggerGlow = () => {
        if (boxRef.current) {
            animationController.glow(boxRef.current, '#3b82f6', 1000);
        }
    };

    return (
        <div className='flash-animation-demo'>
            <div className='demo-header'>
                <h2>🎨 Flash Animations & Visual Feedback</h2>
                <p>Test all animation types and visual effects</p>
            </div>

            {/* Alert Triggers */}
            <div className='demo-section'>
                <h3>Flash Alerts</h3>
                <div className='button-grid'>
                    <button
                        className='demo-btn success'
                        onClick={() => showAlert('success', '✅ Trade executed successfully!')}
                    >
                        Success Alert
                    </button>
                    <button
                        className='demo-btn warning'
                        onClick={() => showAlert('warning', '⚠️ High risk detected - proceed with caution')}
                    >
                        Warning Alert
                    </button>
                    <button
                        className='demo-btn danger'
                        onClick={() => showAlert('danger', '❌ Trade failed - insufficient balance')}
                    >
                        Danger Alert
                    </button>
                    <button
                        className='demo-btn critical'
                        onClick={() => showAlert('critical', '🚨 CRITICAL: Stop loss triggered!')}
                    >
                        Critical Alert
                    </button>
                    <button
                        className='demo-btn info'
                        onClick={() => showAlert('info', 'ℹ️ New signal detected - 85% confidence')}
                    >
                        Info Alert
                    </button>
                </div>
            </div>

            {/* Flash Effects */}
            <div className='demo-section'>
                <h3>Full-Screen Flash</h3>
                <div className='button-grid'>
                    <button className='demo-btn' onClick={() => triggerFlash('rgba(16, 185, 129, 0.3)')}>
                        Green Flash
                    </button>
                    <button className='demo-btn' onClick={() => triggerFlash('rgba(239, 68, 68, 0.3)')}>
                        Red Flash
                    </button>
                    <button className='demo-btn' onClick={() => triggerFlash('rgba(59, 130, 246, 0.3)')}>
                        Blue Flash
                    </button>
                    <button className='demo-btn' onClick={() => triggerFlash('rgba(245, 158, 11, 0.3)')}>
                        Orange Flash
                    </button>
                </div>
            </div>

            {/* Element Animations */}
            <div className='demo-section'>
                <h3>Element Animations</h3>
                <div className='animation-target' ref={boxRef}>
                    <span className='target-icon'>🎯</span>
                    <span className='target-text'>Animation Target</span>
                </div>
                <div className='button-grid'>
                    <button className='demo-btn' onClick={triggerShake}>
                        Shake
                    </button>
                    <button className='demo-btn' onClick={triggerGlow}>
                        Glow
                    </button>
                    <button className='demo-btn' onClick={triggerConfetti}>
                        Confetti 🎉
                    </button>
                </div>
            </div>

            {/* Animation Queue Info */}
            <div className='demo-section'>
                <h3>Animation Queue</h3>
                <div className='queue-info'>
                    <div className='info-item'>
                        <span className='info-label'>Queue Length:</span>
                        <span className='info-value'>{animationController.getQueueLength()}</span>
                    </div>
                    <div className='info-item'>
                        <span className='info-label'>Currently Animating:</span>
                        <span className='info-value'>{animationController.isCurrentlyAnimating() ? 'Yes' : 'No'}</span>
                    </div>
                    <div className='info-item'>
                        <span className='info-label'>Supported:</span>
                        <span className='info-value'>{animationController.isSupported() ? 'Yes' : 'No'}</span>
                    </div>
                </div>
                <button className='demo-btn danger' onClick={() => animationController.clearAll()}>
                    Clear All Animations
                </button>
            </div>

            {/* Features List */}
            <div className='demo-section'>
                <h3>✨ Features</h3>
                <ul className='features-list'>
                    <li>✅ Full-screen flash animations</li>
                    <li>✅ Border pulse effects</li>
                    <li>✅ Shake animations for warnings</li>
                    <li>✅ Confetti for celebrations</li>
                    <li>✅ Glow effects for highlights</li>
                    <li>✅ Animation queue management</li>
                    <li>✅ Priority-based execution</li>
                    <li>✅ Prevents animation overlap</li>
                    <li>✅ 60fps smooth performance</li>
                    <li>✅ Mobile-optimized</li>
                </ul>
            </div>

            {/* Render Alerts */}
            {alerts.map(alert => (
                <FlashAlert
                    key={alert.id}
                    type={alert.type}
                    message={alert.message}
                    duration={2000}
                    showConfetti={alert.type === 'success'}
                    onComplete={() => console.log('Alert completed:', alert.message)}
                />
            ))}
        </div>
    );
};
