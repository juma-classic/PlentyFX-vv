import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DigitHackerNavButton.scss';

export const DigitHackerNavButton: React.FC = () => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/digit-hacker');
    };

    return (
        <button className='digit-hacker-nav-button' onClick={handleClick} title='Digit Hacker AI'>
            <div className='button-content'>
                <span className='icon'>🎯</span>
                <span className='label'>Digit Hacker AI</span>
                <span className='badge'>NEW</span>
            </div>
            <div className='button-description'>AI-Powered Predictions</div>
        </button>
    );
};
