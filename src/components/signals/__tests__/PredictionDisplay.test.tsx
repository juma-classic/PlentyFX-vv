/**
 * Prediction Display Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import type { PredictionResult } from '../../../services/pattern-predictor.service';
import { PredictionDisplay } from '../PredictionDisplay';

describe('PredictionDisplay', () => {
    const mockPrediction: PredictionResult = {
        prediction: 'RISE',
        confidence: 75,
        patternType: 'STRONG_STREAK',
        reasoning: 'Strong streak detected - reversal expected.',
        supportingFactors: ['Strong FALL streak of 6 - reversal likely', 'Low volatility increases predictability'],
        riskLevel: 'LOW',
        recommendedAction: 'TRADE',
    };

    it('renders prediction outcome', () => {
        render(<PredictionDisplay prediction={mockPrediction} />);
        expect(screen.getByText('RISE')).toBeInTheDocument();
    });

    it('displays confidence percentage', () => {
        render(<PredictionDisplay prediction={mockPrediction} />);
        expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('shows pattern type', () => {
        const { container } = render(<PredictionDisplay prediction={mockPrediction} />);
        const patternValue = container.querySelector('.pattern-value');
        expect(patternValue).toHaveTextContent('STRONG STREAK');
    });

    it('displays reasoning', () => {
        render(<PredictionDisplay prediction={mockPrediction} />);
        expect(screen.getByText(/Strong streak detected/i)).toBeInTheDocument();
    });

    it('shows supporting factors', () => {
        render(<PredictionDisplay prediction={mockPrediction} />);
        expect(screen.getByText(/Strong FALL streak of 6/i)).toBeInTheDocument();
        expect(screen.getByText(/Low volatility/i)).toBeInTheDocument();
    });

    it('displays risk level', () => {
        render(<PredictionDisplay prediction={mockPrediction} />);
        expect(screen.getByText('LOW')).toBeInTheDocument();
    });

    it('shows recommended action', () => {
        render(<PredictionDisplay prediction={mockPrediction} />);
        expect(screen.getByText('TRADE')).toBeInTheDocument();
    });

    it('renders in compact mode', () => {
        const { container } = render(<PredictionDisplay prediction={mockPrediction} compact />);
        expect(container.querySelector('.prediction-display.compact')).toBeInTheDocument();
    });

    it('applies correct confidence color class for high confidence', () => {
        const { container } = render(<PredictionDisplay prediction={mockPrediction} />);
        const confidenceMeter = container.querySelector('.confidence-meter');
        expect(confidenceMeter).toHaveClass('high');
    });

    it('applies correct confidence color class for medium confidence', () => {
        const mediumPrediction = { ...mockPrediction, confidence: 60 };
        const { container } = render(<PredictionDisplay prediction={mediumPrediction} />);
        const confidenceMeter = container.querySelector('.confidence-meter');
        expect(confidenceMeter).toHaveClass('medium');
    });

    it('applies correct confidence color class for low confidence', () => {
        const lowPrediction = { ...mockPrediction, confidence: 45 };
        const { container } = render(<PredictionDisplay prediction={lowPrediction} />);
        const confidenceMeter = container.querySelector('.confidence-meter');
        expect(confidenceMeter).toHaveClass('low');
    });

    it('shows FALL prediction with correct icon', () => {
        const fallPrediction = { ...mockPrediction, prediction: 'FALL' as const };
        render(<PredictionDisplay prediction={fallPrediction} />);
        expect(screen.getByText('FALL')).toBeInTheDocument();
    });

    it('shows UNCERTAIN prediction', () => {
        const uncertainPrediction = { ...mockPrediction, prediction: 'UNCERTAIN' as const };
        render(<PredictionDisplay prediction={uncertainPrediction} />);
        expect(screen.getByText('UNCERTAIN')).toBeInTheDocument();
    });

    it('displays HIGH risk level with danger styling', () => {
        const highRiskPrediction = { ...mockPrediction, riskLevel: 'HIGH' as const };
        const { container } = render(<PredictionDisplay prediction={highRiskPrediction} />);
        const riskBadge = container.querySelector('.risk-badge');
        expect(riskBadge).toHaveClass('danger');
    });

    it('displays AVOID action with danger styling', () => {
        const avoidPrediction = { ...mockPrediction, recommendedAction: 'AVOID' as const };
        const { container } = render(<PredictionDisplay prediction={avoidPrediction} />);
        const actionBadge = container.querySelector('.action-badge');
        expect(actionBadge).toHaveClass('danger');
    });
});
