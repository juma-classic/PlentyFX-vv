/**
 * Follow Signal Button Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FollowSignalButton } from '../FollowSignalButton';
import type { PredictionResult } from '../../../services/pattern-predictor.service';

describe('FollowSignalButton', () => {
    const mockPrediction: PredictionResult = {
        prediction: 'RISE',
        confidence: 75,
        patternType: 'STRONG_STREAK',
        reasoning: 'Strong streak detected - reversal expected.',
        supportingFactors: ['Factor 1'],
        riskLevel: 'LOW',
        recommendedAction: 'TRADE',
    };

    const defaultProps = {
        prediction: mockPrediction,
        signalType: 'RISE' as const,
        amount: 1,
        duration: 5,
    };

    it('renders button with signal type', () => {
        render(<FollowSignalButton {...defaultProps} />);
        expect(screen.getByText(/Follow Signal: RISE/i)).toBeInTheDocument();
    });

    it('displays confidence badge', () => {
        render(<FollowSignalButton {...defaultProps} />);
        expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('shows confirmation modal on click', () => {
        render(<FollowSignalButton {...defaultProps} />);
        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(screen.getByText('Confirm Trade')).toBeInTheDocument();
    });

    it('displays trade details in modal', () => {
        render(<FollowSignalButton {...defaultProps} />);
        fireEvent.click(screen.getByRole('button'));

        expect(screen.getByText('RISE')).toBeInTheDocument();
        expect(screen.getByText('$1')).toBeInTheDocument();
        expect(screen.getByText('5 ticks')).toBeInTheDocument();
    });

    it('shows risk level in modal', () => {
        render(<FollowSignalButton {...defaultProps} />);
        fireEvent.click(screen.getByRole('button'));

        expect(screen.getByText('LOW')).toBeInTheDocument();
    });

    it('displays prediction reasoning in modal', () => {
        render(<FollowSignalButton {...defaultProps} />);
        fireEvent.click(screen.getByRole('button'));

        expect(screen.getByText(/Strong streak detected/i)).toBeInTheDocument();
    });

    it('closes modal on cancel', () => {
        render(<FollowSignalButton {...defaultProps} />);
        fireEvent.click(screen.getByRole('button'));

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(screen.queryByText('Confirm Trade')).not.toBeInTheDocument();
    });

    it('closes modal on overlay click', () => {
        const { container } = render(<FollowSignalButton {...defaultProps} />);
        fireEvent.click(screen.getByRole('button'));

        const overlay = container.querySelector('.modal-overlay');
        fireEvent.click(overlay!);

        expect(screen.queryByText('Confirm Trade')).not.toBeInTheDocument();
    });

    it('executes trade on confirm', async () => {
        const onExecute = jest.fn();
        render(<FollowSignalButton {...defaultProps} onExecute={onExecute} />);

        fireEvent.click(screen.getByRole('button'));
        const confirmButton = screen.getByText('Execute Trade');
        fireEvent.click(confirmButton);

        expect(screen.getByText('Executing...')).toBeInTheDocument();

        await waitFor(
            () => {
                expect(screen.getByText(/Trade Executed/i)).toBeInTheDocument();
            },
            { timeout: 2000 }
        );

        expect(onExecute).toHaveBeenCalledWith(true);
    });

    it('shows success state after execution', async () => {
        render(<FollowSignalButton {...defaultProps} />);

        fireEvent.click(screen.getByRole('button'));
        fireEvent.click(screen.getByText('Execute Trade'));

        await waitFor(
            () => {
                expect(screen.getByText(/Trade Executed/i)).toBeInTheDocument();
            },
            { timeout: 2000 }
        );
    });

    it('applies high-confidence class for 70%+ confidence', () => {
        const { container } = render(<FollowSignalButton {...defaultProps} />);
        const button = container.querySelector('.follow-signal-button');
        expect(button).toHaveClass('high-confidence');
    });

    it('does not apply high-confidence class for lower confidence', () => {
        const lowConfPrediction = { ...mockPrediction, confidence: 60 };
        const { container } = render(
            <FollowSignalButton {...defaultProps} prediction={lowConfPrediction} />
        );
        const button = container.querySelector('.follow-signal-button');
        expect(button).not.toHaveClass('high-confidence');
    });

    it('disables button when disabled prop is true', () => {
        render(<FollowSignalButton {...defaultProps} disabled />);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });

    it('does not show modal when disabled', () => {
        render(<FollowSignalButton {...defaultProps} disabled />);
        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(screen.queryByText('Confirm Trade')).not.toBeInTheDocument();
    });

    it('shows different signal types correctly', () => {
        const { rerender } = render(<FollowSignalButton {...defaultProps} signalType="FALL" />);
        expect(screen.getByText(/Follow Signal: FALL/i)).toBeInTheDocument();

        rerender(<FollowSignalButton {...defaultProps} signalType="EVEN" />);
        expect(screen.getByText(/Follow Signal: EVEN/i)).toBeInTheDocument();
    });

    it('displays custom amount and duration', () => {
        render(<FollowSignalButton {...defaultProps} amount={5} duration={10} />);
        fireEvent.click(screen.getByRole('button'));

        expect(screen.getByText('$5')).toBeInTheDocument();
        expect(screen.getByText('10 ticks')).toBeInTheDocument();
    });
});
