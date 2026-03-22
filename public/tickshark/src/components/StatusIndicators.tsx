import React from 'react';
import { TradeLockControls } from '../hooks/useTradeLock';
import { WebSocketState } from '../hooks/useWebSocket';
import './StatusIndicators.scss';

interface StatusIndicatorsProps {
  isDebouncing: boolean;
  tradeLock: TradeLockControls;
  webSocketState: WebSocketState;
}

export const StatusIndicators: React.FC<StatusIndicatorsProps> = ({
  isDebouncing,
  tradeLock,
  webSocketState,
}) => {
  const getDebounceStatus = () => ({
    active: isDebouncing,
    label: isDebouncing ? 'Debouncing...' : 'Stable',
    className: isDebouncing ? 'status-indicators__item--warning' : 'status-indicators__item--success',
  });

  const getTradeLockStatus = () => ({
    active: tradeLock.isLocked,
    label: tradeLock.isLocked ? `Locked: ${tradeLock.lockState.lockReason}` : 'Unlocked',
    className: tradeLock.isLocked ? 'status-indicators__item--error' : 'status-indicators__item--success',
  });

  const getWebSocketStatus = () => ({
    active: webSocketState.isConnected,
    label: webSocketState.isConnected ? 'Connected' : 'Disconnected',
    className: webSocketState.isConnected ? 'status-indicators__item--success' : 'status-indicators__item--error',
    error: webSocketState.error,
  });

  const debounceStatus = getDebounceStatus();
  const lockStatus = getTradeLockStatus();
  const wsStatus = getWebSocketStatus();

  return (
    <div className="status-indicators">
      <h3>System Status</h3>
      
      <div className="status-indicators__grid">
        <div className={`status-indicators__item ${debounceStatus.className}`}>
          <div className="status-indicators__indicator">
            {debounceStatus.active ? '🟡' : '🟢'}
          </div>
          <div className="status-indicators__content">
            <div className="status-indicators__label">Input Debounce</div>
            <div className="status-indicators__value">{debounceStatus.label}</div>
          </div>
        </div>

        <div className={`status-indicators__item ${lockStatus.className}`}>
          <div className="status-indicators__indicator">
            {lockStatus.active ? '🔒' : '🔓'}
          </div>
          <div className="status-indicators__content">
            <div className="status-indicators__label">Trade Lock</div>
            <div className="status-indicators__value">{lockStatus.label}</div>
          </div>
        </div>

        <div className={`status-indicators__item ${wsStatus.className}`}>
          <div className="status-indicators__indicator">
            {wsStatus.active ? '🟢' : '🔴'}
          </div>
          <div className="status-indicators__content">
            <div className="status-indicators__label">WebSocket</div>
            <div className="status-indicators__value">{wsStatus.label}</div>
            {wsStatus.error && (
              <div className="status-indicators__error">{wsStatus.error}</div>
            )}
          </div>
        </div>
      </div>

      <div className="status-indicators__safety-summary">
        <h4>Safety Status</h4>
        <ul>
          <li className={isDebouncing ? 'status-indicators__safety--blocked' : 'status-indicators__safety--ok'}>
            Cursor Movement: {isDebouncing ? 'Blocked (debouncing)' : 'Stable'}
          </li>
          <li className={tradeLock.isLocked ? 'status-indicators__safety--blocked' : 'status-indicators__safety--ok'}>
            Trade Execution: {tradeLock.isLocked ? 'Locked' : 'Available'}
          </li>
          <li className="status-indicators__safety--ok">
            Double Execution: Protected by Intent ID
          </li>
        </ul>
      </div>
    </div>
  );
};