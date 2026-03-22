import React from 'react';
import { TradingMode, AnalysisSignal } from '../types/trading';
import { TickData } from '../hooks/useWebSocket';
import './AnalysisPanel.scss';

interface AnalysisPanelProps {
  mode: TradingMode;
  onModeChange: (mode: TradingMode) => void;
  signals: AnalysisSignal[];
  lastTick: TickData | null;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  mode,
  onModeChange,
  signals,
  lastTick,
}) => {
  const getLastDigit = () => {
    if (!lastTick) return null;
    return lastTick.tick % 10;
  };

  const getRecentSignals = () => {
    return signals.slice(-5).reverse();
  };

  const getSignalStats = () => {
    if (signals.length === 0) return { matches: 0, differs: 0, avgConfidence: 0 };
    
    const matches = signals.filter(s => s.type === 'matches').length;
    const differs = signals.filter(s => s.type === 'differs').length;
    const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
    
    return { matches, differs, avgConfidence };
  };

  const stats = getSignalStats();
  const lastDigit = getLastDigit();

  return (
    <div className="analysis-panel">
      <h3>Market Analysis</h3>
      
      <div className="analysis-panel__mode-selector">
        <label>
          <input
            type="radio"
            name="trading-mode"
            value="manual"
            checked={mode === 'manual'}
            onChange={() => onModeChange('manual')}
          />
          Manual Intent Mode
        </label>
        <label>
          <input
            type="radio"
            name="trading-mode"
            value="auto-analysis"
            checked={mode === 'auto-analysis'}
            onChange={() => onModeChange('auto-analysis')}
          />
          Tick-Based Auto-Analysis
        </label>
      </div>

      <div className="analysis-panel__current-tick">
        <h4>Current Market Data</h4>
        {lastTick ? (
          <div className="analysis-panel__tick-info">
            <div className="analysis-panel__tick-detail">
              <span>Symbol:</span>
              <strong>{lastTick.symbol}</strong>
            </div>
            <div className="analysis-panel__tick-detail">
              <span>Tick:</span>
              <strong>{lastTick.tick.toFixed(5)}</strong>
            </div>
            <div className="analysis-panel__tick-detail">
              <span>Last Digit:</span>
              <strong className="analysis-panel__last-digit">{lastDigit}</strong>
            </div>
            <div className="analysis-panel__tick-detail">
              <span>Time:</span>
              <small>{new Date(lastTick.epoch * 1000).toLocaleTimeString()}</small>
            </div>
          </div>
        ) : (
          <div className="analysis-panel__no-data">No tick data available</div>
        )}
      </div>

      {mode === 'auto-analysis' && (
        <div className="analysis-panel__auto-analysis">
          <h4>Analysis Signals</h4>
          <div className="analysis-panel__stats">
            <div className="analysis-panel__stat">
              <span>Matches:</span>
              <strong>{stats.matches}</strong>
            </div>
            <div className="analysis-panel__stat">
              <span>Differs:</span>
              <strong>{stats.differs}</strong>
            </div>
            <div className="analysis-panel__stat">
              <span>Avg Confidence:</span>
              <strong>{(stats.avgConfidence * 100).toFixed(1)}%</strong>
            </div>
          </div>

          <div className="analysis-panel__recent-signals">
            <h5>Recent Signals</h5>
            {getRecentSignals().length > 0 ? (
              <div className="analysis-panel__signals-list">
                {getRecentSignals().map((signal, index) => (
                  <div
                    key={`${signal.timestamp}-${index}`}
                    className={`analysis-panel__signal analysis-panel__signal--${signal.type}`}
                  >
                    <div className="analysis-panel__signal-type">
                      {signal.type.toUpperCase()}
                    </div>
                    <div className="analysis-panel__signal-confidence">
                      {(signal.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="analysis-panel__signal-time">
                      {new Date(signal.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="analysis-panel__no-signals">
                No analysis signals yet
              </div>
            )}
          </div>

          <div className="analysis-panel__auto-note">
            <small>
              ⚠️ Auto-analysis generates signals only.
              Manual confirmation is still required for trade execution.
            </small>
          </div>
        </div>
      )}

      {mode === 'manual' && (
        <div className="analysis-panel__manual-mode">
          <div className="analysis-panel__manual-note">
            <p>Manual mode: Use cursor to select digit and stake.</p>
            <p>Click "Confirm Trade" to execute after debounce stabilizes.</p>
          </div>
        </div>
      )}
    </div>
  );
};