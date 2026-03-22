import React, { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { useTradeLock } from '../hooks/useTradeLock';
import { useTradeIntent } from '../hooks/useTradeIntent';
import { useWebSocket } from '../hooks/useWebSocket';
import { TradingConfig, TradingMode, AnalysisSignal } from '../types/trading';
import { DigitSelector } from './DigitSelector';
import { StakeInput } from './StakeInput';
import { ExecutionPanel } from './ExecutionPanel';
import { StatusIndicators } from './StatusIndicators';
import { AnalysisPanel } from './AnalysisPanel';
import './TradingInterface.scss';

const DEFAULT_CONFIG: TradingConfig = {
  debounceMs: 400,
  safetyTimeoutMs: 5000,
  maxTradesPerIntent: 1,
  delayBetweenTradesMs: 1000,
  simulationMode: true,
};

export const TradingInterface: React.FC = () => {
  // Core state
  const [selectedDigit, setSelectedDigit] = useState<number | null>(null);
  const [stake, setStake] = useState<number>(1);
  const [tradingMode, setTradingMode] = useState<TradingMode>('manual');
  const [config, setConfig] = useState<TradingConfig>(DEFAULT_CONFIG);
  const [analysisSignals, setAnalysisSignals] = useState<AnalysisSignal[]>([]);

  // Safety hooks
  const [debouncedDigit, isDigitDebouncing] = useDebounce(selectedDigit, config.debounceMs);
  const [debouncedStake, isStakeDebouncing] = useDebounce(stake, config.debounceMs);
  const tradeLock = useTradeLock(config.safetyTimeoutMs);
  const tradeIntent = useTradeIntent();
  const webSocket = useWebSocket();

  // Derived state
  const isDebouncing = isDigitDebouncing || isStakeDebouncing;
  const canConfirm = !isDebouncing && !tradeLock.isLocked && debouncedDigit !== null && debouncedStake > 0;

  // Update pending intent when debounced values change (cursor movement effect)
  useEffect(() => {
    if (!isDebouncing) {
      tradeIntent.updatePendingIntent(debouncedDigit, debouncedStake);
    }
  }, [debouncedDigit, debouncedStake, isDebouncing, tradeIntent]);

  // Cursor movement handlers - UI ONLY, NO EXECUTION
  const handleDigitSelect = useCallback((digit: number | null) => {
    setSelectedDigit(digit);
  }, []);

  const handleStakeChange = useCallback((newStake: number) => {
    setStake(Math.max(0.35, Math.min(50000, newStake)));
  }, []);

  // Manual confirmation - ONLY way to confirm intent
  const handleConfirmTrade = useCallback(() => {
    if (!canConfirm) {
      console.warn('Cannot confirm trade: conditions not met');
      return;
    }
    
    tradeIntent.confirmIntent();
  }, [canConfirm, tradeIntent]);

  // Execute confirmed trade - GATED execution
  const executeConfirmedTrade = useCallback(async () => {
    const { confirmedIntent } = tradeIntent;
    
    if (!confirmedIntent) {
      console.warn('No confirmed intent to execute');
      return;
    }

    if (tradeLock.isLocked) {
      console.warn('Trade execution blocked: lock active');
      return;
    }

    if (tradeIntent.isIntentExecuted(confirmedIntent.intentId)) {
      console.warn('Trade execution blocked: intent already executed');
      return;
    }

    // Lock execution
    tradeLock.lock(`Executing trade ${confirmedIntent.intentId}`);

    try {
      // Simulate trade execution
      console.log('Executing trade:', {
        intentId: confirmedIntent.intentId,
        digit: confirmedIntent.selectedDigit,
        stake: confirmedIntent.stake,
        simulationMode: config.simulationMode,
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mark as executed
      tradeIntent.markExecuted(confirmedIntent.intentId);
      
      console.log('Trade executed successfully');
    } catch (error) {
      console.error('Trade execution failed:', error);
    } finally {
      // Always unlock
      tradeLock.unlock();
    }
  }, [tradeIntent, tradeLock, config.simulationMode]);

  // Auto-execute when confirmed intent is available
  useEffect(() => {
    if (tradeIntent.confirmedIntent && !tradeLock.isLocked) {
      executeConfirmedTrade();
    }
  }, [tradeIntent.confirmedIntent, tradeLock.isLocked, executeConfirmedTrade]);

  // WebSocket connection management
  useEffect(() => {
    webSocket.connect();
    webSocket.subscribe('R_50'); // Volatility 50 Index
    
    return () => {
      webSocket.disconnect();
    };
  }, [webSocket]);

  // Analysis signal generation (auto-analysis mode)
  useEffect(() => {
    if (tradingMode === 'auto-analysis' && webSocket.state.lastTick) {
      // Simple pattern analysis - generates signals but does NOT auto-execute
      const lastDigit = webSocket.state.lastTick.tick % 10;
      
      // Generate analysis signal (example logic)
      const signal: AnalysisSignal = {
        type: Math.random() > 0.5 ? 'matches' : 'differs',
        confidence: Math.random() * 0.4 + 0.6, // 60-100%
        timestamp: Date.now(),
        tickPattern: [lastDigit],
      };
      
      setAnalysisSignals(prev => [...prev.slice(-9), signal]);
    }
  }, [tradingMode, webSocket.state.lastTick]);

  return (
    <div className="trading-interface">
      <div className="trading-interface__header">
        <h1>Deriv Trading Interface</h1>
        {config.simulationMode && (
          <div className="simulation-warning">
            ⚠️ SIMULATION MODE - No Real Trades
          </div>
        )}
      </div>

      <div className="trading-interface__content">
        <div className="trading-interface__left">
          <DigitSelector
            selectedDigit={selectedDigit}
            onDigitSelect={handleDigitSelect}
            disabled={tradeLock.isLocked}
          />
          
          <StakeInput
            stake={stake}
            onStakeChange={handleStakeChange}
            disabled={tradeLock.isLocked}
          />
          
          <ExecutionPanel
            canConfirm={canConfirm}
            onConfirm={handleConfirmTrade}
            onCancel={tradeIntent.cancelIntent}
            pendingIntent={tradeIntent.pendingIntent}
            confirmedIntent={tradeIntent.confirmedIntent}
          />
        </div>

        <div className="trading-interface__right">
          <StatusIndicators
            isDebouncing={isDebouncing}
            tradeLock={tradeLock}
            webSocketState={webSocket.state}
          />
          
          <AnalysisPanel
            mode={tradingMode}
            onModeChange={setTradingMode}
            signals={analysisSignals}
            lastTick={webSocket.state.lastTick}
          />
        </div>
      </div>
    </div>
  );
};