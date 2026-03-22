import React, { useState, useRef, useEffect } from 'react';
import { Localize } from '@deriv-com/translations';
import './MoreOptionsDropdown.scss';

interface MoreOption {
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
}

interface MoreOptionsDropdownProps {
    options: MoreOption[];
}

const MoreOptionsIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <circle cx='12' cy='5' r='2' fill='currentColor' />
        <circle cx='12' cy='12' r='2' fill='currentColor' />
        <circle cx='12' cy='19' r='2' fill='currentColor' />
    </svg>
);

export const MoreOptionsDropdown: React.FC<MoreOptionsDropdownProps> = ({ options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className='more-options-dropdown' ref={dropdownRef}>
            <button
                className='more-options-dropdown__trigger'
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup='true'
            >
                <MoreOptionsIcon />
                <Localize i18n_default_text='More Options' />
            </button>

            {isOpen && (
                <div className='more-options-dropdown__menu'>
                    {options.map((option) => (
                        <button
                            key={option.id}
                            className='more-options-dropdown__item'
                            onClick={() => {
                                option.onClick();
                                setIsOpen(false);
                            }}
                        >
                            <span className='more-options-dropdown__item-icon'>{option.icon}</span>
                            <span className='more-options-dropdown__item-label'>{option.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
