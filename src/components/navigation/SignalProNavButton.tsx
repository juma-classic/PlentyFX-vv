/**
 * Signal Pro Navigation Button
 * Premium navigation button for Signal Pro page
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SignalProNavButton.scss';

interface SignalProNavButtonProps {
    variant?: 'primary' | 'sidebar' | 'mobile';
    showBadge?: boolean;
    onClick?: () => void;
}

export const SignalProNavButton: React.FC<SignalProNavButtonProps> = ({
    variant = 'primary',
    showBadge = true,
    onClick,
}) => {
    const location = useLocation();
    const isActive = location.pathname === '/signal-pro';

    const handleClick = () => {
        onClick?.();
    };

    return (
        <Link 
            to="/signal-pro" 
            className={`signal-pro-nav-button ${variant} ${isActive ? 'active' : ''}`}
            onClick={handleClick}
        >
            <span className="nav-icon">🚀</span>
            <span className="nav-text">Signal Pro</span>
            
            {showBadge && (
                <span className="nav-badge">
                    {variant === 'mobile' ? 'AI' : 'AI-POWERED'}
                </span>
            )}
            
            {variant === 'primary' && (
                <span className="premium-indicator">✨</span>
            )}
        </Link>
    );
};