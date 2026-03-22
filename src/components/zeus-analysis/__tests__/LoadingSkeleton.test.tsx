import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSkeleton } from '../LoadingSkeleton';

describe('LoadingSkeleton', () => {
    it('should render the loading skeleton component', () => {
        const { container } = render(<LoadingSkeleton />);
        
        // Check that the main container exists
        const skeletonContainer = container.querySelector('.zeus-loading-skeleton');
        expect(skeletonContainer).toBeInTheDocument();
    });

    it('should render skeleton header elements', () => {
        const { container } = render(<LoadingSkeleton />);
        
        // Check for header skeleton elements
        expect(container.querySelector('.skeleton-header')).toBeInTheDocument();
        expect(container.querySelector('.skeleton-title')).toBeInTheDocument();
        expect(container.querySelector('.skeleton-status')).toBeInTheDocument();
    });

    it('should render skeleton controls', () => {
        const { container } = render(<LoadingSkeleton />);
        
        // Check for controls skeleton
        expect(container.querySelector('.skeleton-controls')).toBeInTheDocument();
        expect(container.querySelectorAll('.skeleton-control')).toHaveLength(2);
        expect(container.querySelectorAll('.skeleton-button')).toHaveLength(2);
    });

    it('should render 10 digit circle skeletons', () => {
        const { container } = render(<LoadingSkeleton />);
        
        // Check for digit circles
        const digitCircles = container.querySelectorAll('.skeleton-digit-circle');
        expect(digitCircles).toHaveLength(10);
    });

    it('should render 4 analysis card skeletons', () => {
        const { container } = render(<LoadingSkeleton />);
        
        // Check for analysis cards
        const analysisCards = container.querySelectorAll('.skeleton-analysis-card');
        expect(analysisCards).toHaveLength(4);
    });

    it('should render stats section with 10 stat cards', () => {
        const { container } = render(<LoadingSkeleton />);
        
        // Check for stats section
        expect(container.querySelector('.skeleton-stats-section')).toBeInTheDocument();
        const statCards = container.querySelectorAll('.skeleton-stat-card');
        expect(statCards).toHaveLength(10);
    });

    it('should have proper CSS classes for animations', () => {
        const { container } = render(<LoadingSkeleton />);
        
        // Check that skeleton elements have the proper structure for animations
        const title = container.querySelector('.skeleton-title');
        expect(title).toHaveClass('skeleton-title');
        
        const digitCircle = container.querySelector('.skeleton-digit-circle');
        expect(digitCircle).toBeInTheDocument();
        
        const circleInner = container.querySelector('.skeleton-circle-inner');
        expect(circleInner).toBeInTheDocument();
    });
});
