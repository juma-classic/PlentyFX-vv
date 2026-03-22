/**
 * Signal Savvy Navigation Button
 * Navigation button for Signal Savvy page
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SignalSavvyNavButton.scss';

interface SignalSavvyNavButtonProps {
    variant?: 'primary' | 'sidebar' | 'mobile' | 'header';
    showBadge?: boolean;
}

export const SignalSavvyNavButton: React.FC<SignalSavvyNavButtonProps> = ({
    variant = 'primary',
    showBadge = true,
}) => {
    const location = useLocation();
    const isActive = location.pathname === '/signal-savvy';

    const handleClick = () => {
        console.log('📡 Navigating to Signal Savvy');
    };

    return (
        <Link
            to='/signal-savvy'
            className={`signal-savvy-nav-button ${variant} ${isActive ? 'active' : ''}`}
            onClick={handleClick}
        >
            <span className='signal-savvy-nav-button__icon'>📡</span>
            <span className='signal-savvy-nav-button__text'>Signal Savvy</span>
            {showBadge && <span className='signal-savvy-nav-button__badge'>PRO</span>}
        </Link>
    );
};
