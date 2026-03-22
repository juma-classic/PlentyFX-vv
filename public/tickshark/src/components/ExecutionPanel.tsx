import React from 'react';
import { TradeIntent } from '../hooks/useTradeIntent';
import './ExecutionPanel.scss';

interface ExecutionPanelProps {
  canConfirm: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  pendingIntent: TradeIntent | null;
  confirmedIntent: TradeIntent | null;
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  canConfirm,
  onConfirm,
  onCancel,
  pendingIntent,
  confirmedIntent,
}) => {
  const getIntentStatus = () => {
    if (confirmedIntent) {
      return {
        status: 'confirmed',
        message: 'Trade confirmed - executing...',
        className: 'execution-panel__status--confirmed',
      };
    }
    
    if (pendingIntent) {
      return {
        status: 'pending',
        message: 'Trade intent pending - click confirm to execute',
        className: 'execution-panel__status--pending',
      };
    }
    
    return {
      status: 'none',
      message: 'No trade intent',
      className: 'execution-panel__status--none',
    };
  };

  const intentStatus = getIntentStatus();

  return (
    <div className="execution-panel">
      <h3>Trade Execution</h3>
      
      <div className={`execution-panel__status ${intentStatus.className}`}>
        <div className="execution-panel__status-indicator">
          {intentStatus.status === 'confirmed' && '🔄'}
          {intentStatus.status === 'pending' && '⏳'}
          {intentStatus.status === 'none' && '⭕'}
        </div>
        <span>{intentStatus.message}</span>
      </div>

      {pendingIntent && (
        <div className="execution-panel__intent-details">
          <h4>Trade Intent</h4>
          <div className="execution-panel__detail">
            <span>Digit:</span>
            <strong>{pendingIntent.selectedDigit}</strong>
          </div>
          <div className="execution-panel__detail">
            <span>Stake:</span>
            <strong>${pendingIntent.stake}</strong>
          </div>
          <div className="execution-panel__detail">
            <span>Intent ID:</span>
            <code>{pendingIntent.intentId.slice(0, 8)}...</code>
          </div>
        </div>
      )}

      <div className="execution-panel__actions">
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canConfirm}
          className={`execution-panel__confirm ${
            !canConfirm ? 'execution-panel__confirm--disabled' : ''
          }`}
        >
          {confirmedIntent ? 'Executing...' : 'Confirm Trade'}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          disabled={!pendingIntent && !confirmedIntent}
          className="execution-panel__cancel"
        >
          Cancel
        </button>
      </div>

      <div className="execution-panel__safety-note">
        <small>
          ⚠️ Trades execute only after manual confirmation.
          Cursor movement alone cannot trigger execution.
        </small>
      </div>
    </div>
  );
};