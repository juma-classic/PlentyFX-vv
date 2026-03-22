import React from 'react';
import type { ConfidenceLevel } from '../../../types/patel-signals';

interface ConfidenceMeterProps {
  percentage: number;
  level: ConfidenceLevel;
  variant?: 'horizontal' | 'circular';
  size?: number;
}

const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  percentage,
  level,
  variant = 'horizontal',
  size = 60,
}) => {
  const getColor = () => {
    switch (level) {
      case 'HIGH': return '#22c55e';
      case 'MEDIUM': return '#eab308';
      case 'LOW': return '#ef4444';
    }
  };

  if (variant === 'circular') {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="confidence-meter confidence-meter--circular" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="4"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="confidence-meter__label" style={{ fontSize: size / 3.5 }}>
          {percentage}%
        </div>
      </div>
    );
  }

  return (
    <div className="confidence-meter confidence-meter--horizontal">
      <div className="confidence-meter__bar">
        <div
          className="confidence-meter__fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: getColor(),
          }}
        />
      </div>
      <div className="confidence-meter__label">{percentage}%</div>
    </div>
  );
};

export default ConfidenceMeter;
