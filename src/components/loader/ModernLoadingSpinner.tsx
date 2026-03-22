import React from 'react';
import './ModernLoadingSpinner.scss';

interface ModernLoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    variant?: 'primary' | 'secondary' | 'white';
    text?: string;
    className?: string;
}

const ModernLoadingSpinner: React.FC<ModernLoadingSpinnerProps> = ({
    size = 'medium',
    variant = 'primary',
    text,
    className = '',
}) => {
    return (
        <div className={`modern-spinner ${size} ${variant} ${className}`}>
            <div className='modern-spinner__container'>
                <div className='modern-spinner__ring'>
                    <div className='modern-spinner__segment'></div>
                    <div className='modern-spinner__segment'></div>
                    <div className='modern-spinner__segment'></div>
                    <div className='modern-spinner__segment'></div>
                </div>
                <div className='modern-spinner__inner-ring'></div>
            </div>
            {text && <div className='modern-spinner__text'>{text}</div>}
        </div>
    );
};

export default ModernLoadingSpinner;
