import { render, screen, waitFor } from '@testing-library/react';
import { LivePatternDisplay } from '../LivePatternDisplay';

describe('LivePatternDisplay', () => {
    it('renders 18 pattern boxes correctly', () => {
        const pattern = Array(18).fill('EVEN');
        render(<LivePatternDisplay pattern={pattern} />);

        const boxes = document.querySelectorAll('.pattern-box');
        expect(boxes).toHaveLength(18);
    });

    it('displays correct colors for EVEN (green) and ODD (red)', () => {
        const pattern = ['EVEN', 'ODD', 'EVEN', 'ODD'];
        render(<LivePatternDisplay pattern={pattern} />);

        const boxes = document.querySelectorAll('.pattern-box');
        expect(boxes[0]).toHaveClass('green');
        expect(boxes[1]).toHaveClass('red');
        expect(boxes[2]).toHaveClass('green');
        expect(boxes[3]).toHaveClass('red');
    });

    it('marks the latest box with latest class', () => {
        const pattern = ['EVEN', 'ODD', 'EVEN'];
        render(<LivePatternDisplay pattern={pattern} />);

        const boxes = document.querySelectorAll('.pattern-box');
        expect(boxes[2]).toHaveClass('latest');
        expect(boxes[0]).not.toHaveClass('latest');
        expect(boxes[1]).not.toHaveClass('latest');
    });

    it('shows empty state when no pattern data', () => {
        render(<LivePatternDisplay pattern={[]} />);
        expect(screen.getByText(/waiting for tick data/i)).toBeInTheDocument();
    });

    it('displays correct labels (E for EVEN, O for ODD)', () => {
        const pattern = ['EVEN', 'ODD'];
        render(<LivePatternDisplay pattern={pattern} />);

        const boxes = document.querySelectorAll('.pattern-box');
        expect(boxes[0]).toHaveTextContent('E');
        expect(boxes[1]).toHaveTextContent('O');
    });

    it('displays OVER/UNDER patterns correctly', () => {
        const pattern = ['OVER', 'UNDER'];
        render(<LivePatternDisplay pattern={pattern} />);

        const boxes = document.querySelectorAll('.pattern-box');
        expect(boxes[0]).toHaveClass('green');
        expect(boxes[0]).toHaveTextContent('O');
        expect(boxes[1]).toHaveClass('red');
        expect(boxes[1]).toHaveTextContent('U');
    });

    it('displays RISE/FALL patterns correctly', () => {
        const pattern = ['RISE', 'FALL'];
        render(<LivePatternDisplay pattern={pattern} />);

        const boxes = document.querySelectorAll('.pattern-box');
        expect(boxes[0]).toHaveClass('green');
        expect(boxes[0]).toHaveTextContent('R');
        expect(boxes[1]).toHaveClass('red');
        expect(boxes[1]).toHaveTextContent('F');
    });

    it('splits pattern into rows of 9', () => {
        const pattern = Array(18).fill('EVEN');
        render(<LivePatternDisplay pattern={pattern} />);

        const rows = document.querySelectorAll('.pattern-row');
        expect(rows).toHaveLength(2);
        expect(rows[0].querySelectorAll('.pattern-box')).toHaveLength(9);
        expect(rows[1].querySelectorAll('.pattern-box')).toHaveLength(9);
    });

    it('calls onPatternChange when pattern updates', () => {
        const onPatternChange = jest.fn();
        const pattern = ['EVEN', 'ODD'];

        const { rerender } = render(<LivePatternDisplay pattern={pattern} onPatternChange={onPatternChange} />);

        expect(onPatternChange).toHaveBeenCalledWith(pattern);

        const newPattern = ['EVEN', 'ODD', 'EVEN'];
        rerender(<LivePatternDisplay pattern={newPattern} onPatternChange={onPatternChange} />);

        expect(onPatternChange).toHaveBeenCalledWith(newPattern);
    });

    it('displays pattern age', async () => {
        render(<LivePatternDisplay pattern={['EVEN']} />);

        await waitFor(
            () => {
                expect(screen.getByText(/ago/i)).toBeInTheDocument();
            },
            { timeout: 2000 }
        );
    });

    it('handles rapid pattern updates', () => {
        const { rerender } = render(<LivePatternDisplay pattern={['EVEN']} />);

        // Simulate rapid updates
        for (let i = 0; i < 10; i++) {
            const pattern = Array(i + 1).fill(i % 2 === 0 ? 'EVEN' : 'ODD');
            rerender(<LivePatternDisplay pattern={pattern} />);
        }

        const boxes = document.querySelectorAll('.pattern-box');
        expect(boxes).toHaveLength(10);
    });
});
