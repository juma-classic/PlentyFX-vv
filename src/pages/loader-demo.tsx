import React, { useState } from 'react';
import { ModernLoadingSpinner, ModernPageLoader } from '@/components/loader';
import './loader-demo.scss';

const LoaderDemo: React.FC = () => {
    const [showPageLoader, setShowPageLoader] = useState(false);
    const [progress, setProgress] = useState(0);

    const startPageLoader = () => {
        setShowPageLoader(true);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setShowPageLoader(false), 1000);
                    return 100;
                }
                return prev + Math.random() * 15 + 5;
            });
        }, 300);
    };

    return (
        <div className='loader-demo'>
            <div className='loader-demo__header'>
                <h1>Modern Loader System Demo</h1>
                <p>Showcase of the new modern loading components</p>
            </div>

            <div className='loader-demo__grid'>
                {/* Spinner Variants */}
                <div className='loader-demo__section'>
                    <h2>Loading Spinners</h2>

                    <div className='loader-demo__group'>
                        <h3>Sizes</h3>
                        <div className='loader-demo__row'>
                            <div className='loader-demo__item'>
                                <ModernLoadingSpinner size='small' text='Small' />
                            </div>
                            <div className='loader-demo__item'>
                                <ModernLoadingSpinner size='medium' text='Medium' />
                            </div>
                            <div className='loader-demo__item'>
                                <ModernLoadingSpinner size='large' text='Large' />
                            </div>
                        </div>
                    </div>

                    <div className='loader-demo__group'>
                        <h3>Color Variants</h3>
                        <div className='loader-demo__row'>
                            <div className='loader-demo__item'>
                                <ModernLoadingSpinner variant='primary' text='Primary' />
                            </div>
                            <div className='loader-demo__item'>
                                <ModernLoadingSpinner variant='secondary' text='Secondary' />
                            </div>
                            <div className='loader-demo__item loader-demo__item--dark'>
                                <ModernLoadingSpinner variant='white' text='White' />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Usage Examples */}
                <div className='loader-demo__section'>
                    <h2>Usage Examples</h2>

                    <div className='loader-demo__group'>
                        <h3>Button Loading</h3>
                        <div className='loader-demo__row'>
                            <button className='loader-demo__button'>
                                <ModernLoadingSpinner size='small' variant='white' />
                                Loading...
                            </button>
                            <button className='loader-demo__button loader-demo__button--secondary'>
                                <ModernLoadingSpinner size='small' variant='primary' />
                                Processing
                            </button>
                        </div>
                    </div>

                    <div className='loader-demo__group'>
                        <h3>Card Loading</h3>
                        <div className='loader-demo__card'>
                            <ModernLoadingSpinner size='medium' text='Loading content...' />
                        </div>
                    </div>

                    <div className='loader-demo__group'>
                        <h3>Page Loader</h3>
                        <button className='loader-demo__button loader-demo__button--large' onClick={startPageLoader}>
                            Show Page Loader
                        </button>
                    </div>
                </div>
            </div>

            {/* Overlay Examples */}
            <div className='loader-demo__section'>
                <h2>Overlay Examples</h2>

                <div className='loader-demo__overlay-demo'>
                    <div className='loader-demo__content'>
                        <h3>Content Area</h3>
                        <p>This content would be behind the loading overlay.</p>
                    </div>
                    <div className='loading-overlay'>
                        <ModernLoadingSpinner size='large' variant='white' text='Loading overlay...' />
                    </div>
                </div>
            </div>

            {/* Page Loader */}
            <ModernPageLoader isLoading={showPageLoader} loadingText='Loading demo page' progress={progress} />
        </div>
    );
};

export default LoaderDemo;
