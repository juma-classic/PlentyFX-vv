import React from 'react';
import './LoadingSkeleton.scss';

export const LoadingSkeleton: React.FC = React.memo(() => {
    return (
        <div className="zeus-loading-skeleton">
            {/* Header Skeleton */}
            <div className="skeleton-header">
                <div className="skeleton-title"></div>
                <div className="skeleton-status">
                    <div className="skeleton-status-badge"></div>
                    <div className="skeleton-price"></div>
                </div>
            </div>

            {/* Controls Skeleton */}
            <div className="skeleton-controls">
                <div className="skeleton-control"></div>
                <div className="skeleton-control"></div>
                <div className="skeleton-button"></div>
                <div className="skeleton-button"></div>
            </div>

            {/* Digit Circles Skeleton */}
            <div className="skeleton-digit-dashboard">
                <div className="skeleton-section-title"></div>
                <div className="skeleton-digit-circles">
                    {Array.from({ length: 10 }).map((_, idx) => (
                        <div key={idx} className="skeleton-digit-circle">
                            <div className="skeleton-circle-inner"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Analysis Cards Skeleton */}
            <div className="skeleton-analysis-grid">
                {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="skeleton-analysis-card">
                        <div className="skeleton-card-title"></div>
                        <div className="skeleton-card-content">
                            <div className="skeleton-progress-bar"></div>
                            <div className="skeleton-badges">
                                {Array.from({ length: 5 }).map((_, badgeIdx) => (
                                    <div key={badgeIdx} className="skeleton-badge"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats Cards Skeleton */}
            <div className="skeleton-stats-section">
                <div className="skeleton-section-title"></div>
                <div className="skeleton-stats-grid">
                    {Array.from({ length: 10 }).map((_, idx) => (
                        <div key={idx} className="skeleton-stat-card">
                            <div className="skeleton-stat-digit"></div>
                            <div className="skeleton-stat-count"></div>
                            <div className="skeleton-stat-percentage"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';
