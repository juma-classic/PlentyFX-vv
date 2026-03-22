import React, { useEffect, useState } from 'react';
import './TradersDenLoader.scss';

interface TradersDenLoaderProps {
    onLoadComplete?: () => void;
    duration?: number;
}

export const TradersDenLoader: React.FC<TradersDenLoaderProps> = ({ onLoadComplete, duration = 1500 }) => {
    const [progress, setProgress] = useState(0);
    const [statusIndex, setStatusIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const statuses = [
        'Initializing Trading Core...',
        'Synchronizing Market Algorithms...',
        'Calibrating Trading Mechanisms...',
        'Access Granted. Welcome to Zeus Trading Hub.',
    ];



    // Progress and Status Updates - Optimized for faster loading
    useEffect(() => {
        const statusInterval = duration / statuses.length;
        const progressInterval = 30; // Update every 30ms for smooth animation
        const progressIncrement = 100 / (duration / progressInterval);

        const progressTimer = setInterval(() => {
            setProgress(prev => {
                const next = prev + progressIncrement;
                return next >= 100 ? 100 : next;
            });
        }, progressInterval);

        const statusTimer = setInterval(() => {
            setStatusIndex(prev => {
                if (prev < statuses.length - 1) {
                    return prev + 1;
                }
                return prev;
            });
        }, statusInterval);

        const completeTimer = setTimeout(() => {
            setIsComplete(true);
            setTimeout(() => {
                if (onLoadComplete) {
                    onLoadComplete();
                }
            }, 300); // Reduced fade out time
        }, duration);

        return () => {
            clearInterval(progressTimer);
            clearInterval(statusTimer);
            clearTimeout(completeTimer);
        };
    }, [duration, onLoadComplete, statuses.length]);

    return (
        <div className={`plenty-fx-loader ${isComplete ? 'fade-out' : ''}`}>
            {/* Particle Background */}
            <div className='particle-background'>
                {[...Array(30)].map((_, i) => (
                    <div key={i} className='particle' style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${3 + Math.random() * 4}s`
                    }}></div>
                ))}
            </div>

            <div className='loading-container'>
                {/* Mechanical Hebrew Sun Loader */}
                <div className='mechanical-sun-container'>
                    {/* Outer rotating ring with notches */}
                    <div className='outer-ring'>
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className='ring-notch' style={{
                                transform: `rotate(${i * 30}deg) translateY(-140px)`
                            }}></div>
                        ))}
                    </div>

                    {/* Middle gear ring */}
                    <div className='middle-gear'>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className='gear-tooth' style={{
                                transform: `rotate(${i * 45}deg) translateY(-110px)`
                            }}></div>
                        ))}
                    </div>

                    {/* Star of David - Two overlapping triangles */}
                    <div className='star-of-david'>
                        {/* Upward triangle */}
                        <div className='triangle triangle-up'>
                            <div className='triangle-side side-1'></div>
                            <div className='triangle-side side-2'></div>
                            <div className='triangle-side side-3'></div>
                        </div>
                        
                        {/* Downward triangle */}
                        <div className='triangle triangle-down'>
                            <div className='triangle-side side-1'></div>
                            <div className='triangle-side side-2'></div>
                            <div className='triangle-side side-3'></div>
                        </div>

                        {/* Center hexagon with gears */}
                        <div className='center-hexagon'>
                            <div className='hexagon-inner'>
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className='hex-gear' style={{
                                        transform: `rotate(${i * 60}deg) translateY(-25px)`
                                    }}></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Inner rotating core */}
                    <div className='inner-core'>
                        <div className='core-ring'></div>
                        <div className='core-center'>
                            <div className='progress-circle' style={{
                                background: `conic-gradient(#2563eb ${progress * 3.6}deg, transparent ${progress * 3.6}deg)`
                            }}></div>
                        </div>
                    </div>

                    {/* Orbiting elements */}
                    <div className='orbit-container'>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className='orbit-element' style={{
                                animationDelay: `${i * 0.8}s`
                            }}></div>
                        ))}
                    </div>
                </div>

                {/* App Logo/Name */}
                <div className='logo-section'>
                    <h1 className='logo-title'>
                        <span className='logo-mozaic'>THE ESTATE</span>
                        <span className='logo-trading'>TRADERS</span>
                    </h1>
                    <p className='logo-subtitle'>Professional Trading Platform</p>
                </div>

                {/* Progress Bar and Status */}
                <div className='progress-section'>
                    <div className='progress-bar-container'>
                        <div className='progress-bar-fill' style={{ width: `${progress}%` }}></div>
                        <div className='progress-glow' style={{ left: `${progress}%` }}></div>
                    </div>
                    <p className='loading-status'>{statuses[statusIndex]}</p>
                    <div className='progress-percentage'>{Math.floor(progress)}%</div>
                </div>
            </div>
        </div>
    );
};

export default TradersDenLoader;
