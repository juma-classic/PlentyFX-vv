import React from 'react';

interface IconProps {
    className?: string;
    size?: number;
}

export const DiamondIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <path
            d='M12 2L2 9L12 22L22 9L12 2Z'
            fill='url(#diamond-gradient)'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <path d='M2 9H22' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
        <path
            d='M12 2L7 9L12 22'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <path
            d='M12 2L17 9L12 22'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <defs>
            <linearGradient id='diamond-gradient' x1='2' y1='2' x2='22' y2='22' gradientUnits='userSpaceOnUse'>
                <stop stopColor='#fbbf24' />
                <stop offset='1' stopColor='#f59e0b' />
            </linearGradient>
        </defs>
    </svg>
);

export const StopIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <rect x='4' y='4' width='16' height='16' rx='2' fill='currentColor' />
    </svg>
);

export const ResetIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <path
            d='M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C14.8273 3 17.35 4.30367 19 6.34267'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <path
            d='M19 3V6.34267H15.6573'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

export const TargetIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='2' />
        <circle cx='12' cy='12' r='6' stroke='currentColor' strokeWidth='2' />
        <circle cx='12' cy='12' r='2' fill='currentColor' />
    </svg>
);

export const TrendDownIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <path
            d='M22 17L13.5 8.5L8.5 13.5L2 7'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <path d='M16 17H22V11' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
);

export const DollarIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <path d='M12 2V22' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <path
            d='M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

export const ChartIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <path d='M3 3V21H21' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <path
            d='M7 16L12 11L16 15L21 10'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <circle cx='12' cy='12' r='3' stroke='currentColor' strokeWidth='2' />
        <path
            d='M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
        />
    </svg>
);

export const ShieldIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <path
            d='M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

export const BellIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <path
            d='M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <path
            d='M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

export const RobotIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <rect x='4' y='8' width='16' height='12' rx='2' stroke='currentColor' strokeWidth='2' />
        <path d='M12 4V8' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
        <circle cx='12' cy='4' r='1' fill='currentColor' />
        <circle cx='9' cy='13' r='1' fill='currentColor' />
        <circle cx='15' cy='13' r='1' fill='currentColor' />
        <path d='M9 17H15' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
        <path d='M4 12H2M22 12H20' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
    </svg>
);

export const BrainIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <path
            d='M12 4C10.5 4 9.5 5 9.5 6.5C8 6.5 7 7.5 7 9C5.5 9 4.5 10 4.5 11.5C4.5 13 5.5 14 7 14V18C7 19.1 7.9 20 9 20H15C16.1 20 17 19.1 17 18V14C18.5 14 19.5 13 19.5 11.5C19.5 10 18.5 9 17 9C17 7.5 16 6.5 14.5 6.5C14.5 5 13.5 4 12 4Z'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <path d='M9 14V16M15 14V16' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
    </svg>
);

export const SignalIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <path
            d='M16.24 7.76C17.1851 8.70509 17.8516 9.89456 18.1656 11.1945C18.4796 12.4945 18.4291 13.8539 17.9201 15.1247C17.4111 16.3955 16.5621 17.5279 15.4572 18.4003C14.3524 19.2727 13.0333 19.8545 11.6333 20.0874C10.2333 20.3203 8.80019 20.1965 7.46069 19.7271C6.12119 19.2577 4.91942 18.4583 3.96619 17.4051C3.01296 16.3518 2.34168 15.0781 2.01295 13.6961C1.68422 12.3141 1.70868 10.8701 2.08401 9.5'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <path d='M12 2V12L17 7' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <path d='M5 3L19 12L5 21V3Z' fill='currentColor' stroke='currentColor' strokeWidth='2' strokeLinejoin='round' />
    </svg>
);

export const LightningIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <path
            d='M13 2L3 14H12L11 22L21 10H12L13 2Z'
            fill='currentColor'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinejoin='round'
        />
    </svg>
);

export const ToolIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <path
            d='M14.7 6.3C15.1 5.9 15.1 5.3 14.7 4.9L13.1 3.3C12.7 2.9 12.1 2.9 11.7 3.3L10.3 4.7L13.3 7.7L14.7 6.3Z'
            fill='currentColor'
        />
        <path d='M12.6 8.4L9.6 5.4L3 12V15H6L12.6 8.4Z' fill='currentColor' />
        <path d='M14 18V20H20V18H14Z' fill='currentColor' />
        <path d='M3 18H12V20H3V18Z' fill='currentColor' />
    </svg>
);

export const TestTubeIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <path
            d='M14.5 2V2C15.3284 2 16 2.67157 16 3.5V3.5C16 4.32843 15.3284 5 14.5 5H9.5C8.67157 5 8 4.32843 8 3.5V3.5C8 2.67157 8.67157 2 9.5 2V2'
            stroke='currentColor'
            strokeWidth='2'
        />
        <path
            d='M9 5V14C9 17.866 12.134 21 16 21C17.933 21 19.683 20.183 20.95 18.85'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
        />
        <path d='M15 5V14' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
        <circle cx='16' cy='17' r='2' fill='currentColor' />
    </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <path
            d='M20 6L9 17L4 12'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

export const XIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className}
    >
        <path
            d='M18 6L6 18M6 6L18 18'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);
