import React, { useEffect, useState } from 'react';
import './ModernPageLoader.scss';

interface ModernPageLoaderProps {
    isLoading: boolean;
    loadingText?: string;
    progress?: number;
    onComplete?: () => void;
}

const ModernPageLoader: React.FC<ModernPageLoaderProps> = ({
    isLoading,
    loadingText = 'Loading',
    progress,
    onComplete,
}) => {
    const [dots, setDots] = useState('');
    const [internalProgress, setInternalProgress] = useState(0);

    useEffect(() => {
        if (!isLoading) return;

        // Dots animation
        let dotCount = 0;
        const dotInterval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            setDots('.'.repeat(dotCount));
        }, 500);

        // Auto progress if no progress prop provided
        let progressInterval: NodeJS.Timeout;
        if (progress === undefined) {
            progressInterval = setInterval(() => {
                setInternalProgress(prev => {
                    if (prev >= 95) return prev;
                    return prev + Math.random() * 10 + 2;
                });
            }, 200);
        }

        return () => {
            clearInterval(dotInterval);
            if (progressInterval) clearInterval(progressInterval);
        };
    }, [isLoading, progress]);

    useEffect(() => {
        if (progress !== undefined) {
            setInternalProgress(progress);
        }
    }, [progress]);

    useEffect(() => {
        if (internalProgress >= 100 && onComplete) {
            const timer = setTimeout(onComplete, 500);
            return () => clearTimeout(timer);
        }
    }, [internalProgress, onComplete]);

    if (!isLoading) return null;

    const currentProgress = progress !== undefined ? progress : internalProgress;

    return (
        <div className='modern-page-loader'>
            <div className='modern-page-loader__background'>
                <div className='modern-page-loader__gradient'></div>

                {/* Animated background elements */}
                <div className='modern-page-loader__shapes'>
                    <div className='modern-page-loader__shape modern-page-loader__shape--1'></div>
                    <div className='modern-page-loader__shape modern-page-loader__shape--2'></div>
                    <div className='modern-page-loader__shape modern-page-loader__shape--3'></div>
                </div>
            </div>

            <div className='modern-page-loader__content'>
                {/* Logo */}
                <div className='modern-page-loader__logo'>
                    <div className='modern-page-loader__logo-ring'>
                        <div className='modern-page-loader__logo-inner'>
                            <span>TD</span>
                        </div>
                    </div>
                </div>

                {/* Loading text */}
                <div className='modern-page-loader__text'>
                    {loadingText}
                    {dots}
                </div>

                {/* Progress bar */}
                <div className='modern-page-loader__progress'>
                    <div className='modern-page-loader__progress-track'>
                        <div
                            className='modern-page-loader__progress-fill'
                            style={{ width: `${Math.min(currentProgress, 100)}%` }}
                        >
                            <div className='modern-page-loader__progress-glow'></div>
                        </div>
                    </div>
                    <div className='modern-page-loader__progress-text'>
                        {Math.round(Math.min(currentProgress, 100))}%
                    </div>
                </div>

                {/* Pulse indicator */}
                <div className='modern-page-loader__pulse'>
                    <div className='modern-page-loader__pulse-dot'></div>
                </div>
            </div>
        </div>
    );
};

export default ModernPageLoader;
