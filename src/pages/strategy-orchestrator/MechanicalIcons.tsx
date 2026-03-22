import React from 'react';
import './MechanicalIcons.scss';

interface IconProps {
    className?: string;
    size?: number;
}

export const GearIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        className={`mechanical-icon gear-icon ${className}`}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
    >
        <g className="gear-rotate">
            <path
                className="gear-outer"
                d="M50,10 L55,20 L65,18 L68,28 L78,30 L78,40 L88,45 L85,55 L90,65 L80,70 L78,80 L68,78 L65,88 L55,85 L50,95 L45,85 L35,88 L32,78 L22,80 L20,70 L10,65 L15,55 L12,45 L22,40 L22,30 L32,28 L35,18 L45,20 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            />
            <circle className="gear-center" cx="50" cy="50" r="15" fill="currentColor" />
            <circle className="gear-hole" cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        </g>
    </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        className={`mechanical-icon clock-icon ${className}`}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle className="clock-face" cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle className="clock-center" cx="50" cy="50" r="3" fill="currentColor" />
        <line className="clock-hand-hour" x1="50" y1="50" x2="50" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <line className="clock-hand-minute" x1="50" y1="50" x2="50" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line className="clock-hand-second" x1="50" y1="50" x2="50" y2="15" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
            <line
                key={i}
                x1={50 + 35 * Math.cos((angle - 90) * Math.PI / 180)}
                y1={50 + 35 * Math.sin((angle - 90) * Math.PI / 180)}
                x2={50 + 40 * Math.cos((angle - 90) * Math.PI / 180)}
                y2={50 + 40 * Math.sin((angle - 90) * Math.PI / 180)}
                stroke="currentColor"
                strokeWidth={angle % 90 === 0 ? "2" : "1"}
            />
        ))}
    </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        className={`mechanical-icon check-icon ${className}`}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle className="check-circle" cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="3" />
        <path
            className="check-mark"
            d="M30,50 L45,65 L70,35"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <g className="check-gears">
            <circle className="check-gear-1" cx="25" cy="25" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle className="check-gear-2" cx="75" cy="75" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </g>
    </svg>
);

export const CrossIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        className={`mechanical-icon cross-icon ${className}`}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle className="cross-circle" cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="3" />
        <line
            className="cross-line-1"
            x1="35"
            y1="35"
            x2="65"
            y2="65"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
        />
        <line
            className="cross-line-2"
            x1="65"
            y1="35"
            x2="35"
            y2="65"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
        />
    </svg>
);

export const ChartIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        className={`mechanical-icon chart-icon ${className}`}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
    >
        <line x1="10" y1="90" x2="90" y2="90" stroke="currentColor" strokeWidth="2" />
        <line x1="10" y1="10" x2="10" y2="90" stroke="currentColor" strokeWidth="2" />
        <polyline
            className="chart-line"
            points="10,70 25,60 40,65 55,45 70,50 85,30"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle className="chart-dot-1" cx="25" cy="60" r="3" fill="currentColor" />
        <circle className="chart-dot-2" cx="40" cy="65" r="3" fill="currentColor" />
        <circle className="chart-dot-3" cx="55" cy="45" r="3" fill="currentColor" />
        <circle className="chart-dot-4" cx="70" cy="50" r="3" fill="currentColor" />
        <circle className="chart-dot-5" cx="85" cy="30" r="3" fill="currentColor" />
    </svg>
);

export const CogwheelIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        className={`mechanical-icon cogwheel-icon ${className}`}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
    >
        <g className="cogwheel-rotate">
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="3" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <rect
                    key={i}
                    x="48"
                    y="15"
                    width="4"
                    height="10"
                    fill="currentColor"
                    transform={`rotate(${angle} 50 50)`}
                />
            ))}
            <circle cx="50" cy="50" r="12" fill="currentColor" />
            <circle cx="50" cy="50" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
        </g>
    </svg>
);

export const BoltIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        className={`mechanical-icon bolt-icon ${className}`}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            className="bolt-flash"
            d="M55,10 L30,50 L45,50 L35,90 L70,45 L55,45 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
        />
    </svg>
);

export const ArrowUpIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        className={`mechanical-icon arrow-up-icon ${className}`}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            className="arrow-up-path"
            d="M50,20 L50,80 M50,20 L30,40 M50,20 L70,40"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle className="arrow-up-dot" cx="50" cy="80" r="5" fill="currentColor" />
    </svg>
);

export const ArrowDownIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        className={`mechanical-icon arrow-down-icon ${className}`}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            className="arrow-down-path"
            d="M50,20 L50,80 M50,80 L30,60 M50,80 L70,60"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle className="arrow-down-dot" cx="50" cy="20" r="5" fill="currentColor" />
    </svg>
);

export const TargetIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        className={`mechanical-icon target-icon ${className}`}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle className="target-ring-1" cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle className="target-ring-2" cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle className="target-ring-3" cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle className="target-center" cx="50" cy="50" r="8" fill="currentColor" />
        <line className="target-crosshair-h" x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1" />
        <line className="target-crosshair-v" x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="1" />
    </svg>
);

export const SpinnerIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
    <svg
        className={`mechanical-icon spinner-icon ${className}`}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
    >
        <g className="spinner-rotate">
            <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="164.93 54.98" strokeLinecap="round" />
        </g>
    </svg>
);
