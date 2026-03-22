import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TradingInterface } from '../components/TradingInterface';

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  readyState: WebSocket.OPEN,
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

describe('TradingInterface Integration Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should prevent execution during cursor movement', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TradingInterface />);

    // Verify simulation mode warning is shown
    expect(screen.getByText(/SIMULATION MODE/)).toBeInTheDocument();

    // Rapidly click different digits (simulating cursor movement)
    const digit1 = screen.getByRole('button', { name: '1' });
    const digit2 = screen.getByRole('button', { name: '2' });
    const digit3 = screen.getByRole('button', { name: '3' });

    await user.click(digit1);
    await user.click(digit2);
    await user.click(digit3);

    // Confirm button should be disabled during debounce
    const confirmButton = screen.getByRole('button', { name: /Confirm Trade/ });
    expect(confirmButton).toBeDisabled();

    // Fast forward but not enough to complete debounce
    jest.advanceTimersByTime(200);
    expect(confirmButton).toBeDisabled();

    // Complete debounce
    jest.advanceTimersByTime(300);
    await waitFor(() => {
      expect(confirmButton).not.toBeDisabled();
    });
  });

  it('should show debouncing status during rapid input', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TradingInterface />);

    // Check initial status
    expect(screen.getByText('Stable')).toBeInTheDocument();

    // Rapid digit selection
    const digit5 = screen.getByRole('button', { name: '5' });
    await user.click(digit5);

    // Should show debouncing
    expect(screen.getByText('Debouncing...')).toBeInTheDocument();

    // Complete debounce
    jest.advanceTimersByTime(500);
    await waitFor(() => {
      expect(screen.getByText('Stable')).toBeInTheDocument();
    });
  });

  it('should prevent double execution with trade lock', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TradingInterface />);

    // Select digit and stake
    const digit7 = screen.getByRole('button', { name: '7' });
    await user.click(digit7);

    // Wait for debounce
    jest.advanceTimersByTime(500);

    // Confirm trade
    const confirmButton = screen.getByRole('button', { name: /Confirm Trade/ });
    await waitFor(() => {
      expect(confirmButton).not.toBeDisabled();
    });

    await user.click(confirmButton);

    // Should show executing state
    expect(screen.getByText(/executing/i)).toBeInTheDocument();

    // Trade lock should be active
    expect(screen.getByText(/Locked:/)).toBeInTheDocument();

    // Confirm button should be disabled during execution
    expect(confirmButton).toBeDisabled();

    // Complete execution
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.getByText('Unlocked')).toBeInTheDocument();
    });
  });

  it('should show trade intent details', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TradingInterface />);

    // Select digit
    const digit9 = screen.getByRole('button', { name: '9' });
    await user.click(digit9);

    // Change stake
    const stakeInput = screen.getByLabelText('USD');
    await user.clear(stakeInput);
    await user.type(stakeInput, '50');

    // Wait for debounce
    jest.advanceTimersByTime(500);

    // Should show trade intent details
    await waitFor(() => {
      expect(screen.getByText('Trade Intent')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument(); // Selected digit
      expect(screen.getByText('$50')).toBeInTheDocument(); // Stake amount
    });
  });

  it('should handle stake input validation', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TradingInterface />);

    const stakeInput = screen.getByLabelText('USD');

    // Test minimum stake
    await user.clear(stakeInput);
    await user.type(stakeInput, '0.1');
    
    // Should not update to invalid value
    expect(stakeInput).toHaveValue(1); // Should remain at default

    // Test valid stake
    await user.clear(stakeInput);
    await user.type(stakeInput, '25.50');
    expect(stakeInput).toHaveValue(25.5);
  });

  it('should switch between trading modes', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TradingInterface />);

    // Should start in manual mode
    const manualRadio = screen.getByLabelText('Manual Intent Mode');
    const autoRadio = screen.getByLabelText('Tick-Based Auto-Analysis');
    
    expect(manualRadio).toBeChecked();
    expect(autoRadio).not.toBeChecked();

    // Switch to auto-analysis mode
    await user.click(autoRadio);
    
    expect(autoRadio).toBeChecked();
    expect(manualRadio).not.toBeChecked();

    // Should show analysis-specific content
    expect(screen.getByText('Analysis Signals')).toBeInTheDocument();
  });

  it('should cancel trade intent', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TradingInterface />);

    // Create trade intent
    const digit4 = screen.getByRole('button', { name: '4' });
    await user.click(digit4);

    jest.advanceTimersByTime(500);

    // Should show trade intent
    await waitFor(() => {
      expect(screen.getByText('Trade Intent')).toBeInTheDocument();
    });

    // Cancel intent
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    // Intent should be cleared
    expect(screen.queryByText('Trade Intent')).not.toBeInTheDocument();
  });

  it('should show safety warnings and notes', () => {
    render(<TradingInterface />);

    // Should show simulation warning
    expect(screen.getByText(/SIMULATION MODE.*No Real Trades/)).toBeInTheDocument();

    // Should show safety note
    expect(screen.getByText(/Cursor movement alone cannot trigger execution/)).toBeInTheDocument();

    // Should show safety status
    expect(screen.getByText('Safety Status')).toBeInTheDocument();
    expect(screen.getByText(/Double Execution.*Protected by Intent ID/)).toBeInTheDocument();
  });

  it('should handle quick stake buttons', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TradingInterface />);

    // Click $25 quick stake button
    const quickStake25 = screen.getByRole('button', { name: '$25' });
    await user.click(quickStake25);

    // Should update stake input
    const stakeInput = screen.getByLabelText('USD');
    expect(stakeInput).toHaveValue(25);

    // Button should show as active
    expect(quickStake25).toHaveClass('stake-input__quick-button--active');
  });
});