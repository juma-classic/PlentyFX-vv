/**
 * TickShark Session Controls Component
 * Session management interface with controls and statistics
 * 
 * CRITICAL: Session lifecycle management with safety
 * - Session start/stop/reset controls
 * - Real-time session statistics
 * - Session limits monitoring
 * - Cooldown status display
 */

import React, { useState, useEffect } from 'react';
import { sessionManagerService, SessionStats } from '../../services/tickshark/session-manager.service';
import './SessionControls.scss';

export interface SessionControlsProps {
    onSessionAction?: (action: string, data?: any) => void;
    onError?: (error: string) => void;
    compact?: boolean;
    showAdvanced?: boolean;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
    onSessionAction,
    onError,
    compact = false,
    showAdvanced = true,
}) => {
    const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
    const [showConfirmation, setShowConfirmation] = useState<string | null>(null);
    const [isPerformingAction, setIsPerformingAction] = useState(false);

    // Update session statistics
    useEffect(() => {
        const updateStats = () => {
            const stats = sessionManagerService.getSessionStats();
            setSessionStats(stats);
        };

        updateStats();
        const interval = setInterval(updateStats, 1000);
        return () => clearInterval(interval);
    }, []);

    // Handle session action
    const handleSessionAction = async (action: string, requiresConfirmation = true) => {
        if (requiresConfirmation && showConfirmation !== action) {
            setShowConfirmation(action);
            return;
        }

        setIsPerformingAction(true);
        setShowConfirmation(null);

        try {
            let success = false;

            switch (action) {
                case 'start_new_session':
                    success = await sessionManagerService.startNewSession();
                    break;

                case 'end_session':
                    success = await sessionManagerService.endSession('User initiated');
                    break;

                case 'reset_session':
                    success = await sessionManagerService.resetSession(true);
                    break;

                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            if (success) {
                onSessionAction?.(action);
                console.log(`🦈 Session action completed: ${action}`);
            } else {
                throw new Error(`Action failed: ${action}`);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Action failed';
            onError?.(errorMessage);
            console.error('🦈 Session action failed:', errorMessage);
        } finally {
            setIsPerformingAction(false);
        }
    };

    // Format duration
    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    // Get limit status color
    const getLimitColor = (percentage: number) => {
        if (percentage >= 90) return 'danger';
        if (percentage >= 70) return 'warning';
        if (percentage >= 50) return 'caution';
        return 'safe';
    };

    if (!sessionStats) {
        return (
            <div className="session-controls session-controls--loading">
                <div className="loading-spinner"></div>
                <p>Loading session data...</p>
            </div>
        );
    }

    return (
        <div className={`session-controls ${compact ? 'compact' : ''}`}>
            {/* Session Header */}
            <div className="session-controls__header">
                <h3 className="section-title">
                    <span className="section-icon">📊</span>
                    Session Management
                </h3>
                <div className="session-id">
                    <span className="session-label">Session ID:</span>
                    <span className="session-value">{sessionStats.current.id.split('-')[1]}</span>
                </div>
            </div>

            {/* Session Statistics */}
            <div className="session-controls__stats">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Duration</div>
                        <div className="stat-value">
                            {formatDuration(sessionStats.current.duration)}
                        </div>
                        <div className="stat-progress">
                            <div 
                                className={`progress-bar ${getLimitColor(sessionStats.limits.duration.percentage)}`}
                                style={{ width: `${Math.min(sessionStats.limits.duration.percentage, 100)}%` }}
                            ></div>
                        </div>
                        <div className="stat-limit">
                            {sessionStats.limits.duration.percentage.toFixed(1)}% of limit
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">Trades</div>
                        <div className="stat-value">
                            {sessionStats.current.trades.total}
                        </div>
                        <div className="stat-progress">
                            <div 
                                className={`progress-bar ${getLimitColor(sessionStats.limits.trades.percentage)}`}
                                style={{ width: `${Math.min(sessionStats.limits.trades.percentage, 100)}%` }}
                            ></div>
                        </div>
                        <div className="stat-limit">
                            {sessionStats.limits.trades.used} / {sessionStats.limits.trades.max}
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">Total Stake</div>
                        <div className="stat-value">
                            {formatCurrency(sessionStats.current.financial.totalStake)}
                        </div>
                        <div className="stat-progress">
                            <div 
                                className={`progress-bar ${getLimitColor(sessionStats.limits.stake.percentage)}`}
                                style={{ width: `${Math.min(sessionStats.limits.stake.percentage, 100)}%` }}
                            ></div>
                        </div>
                        <div className="stat-limit">
                            {sessionStats.limits.stake.percentage.toFixed(1)}% of limit
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">Net Profit</div>
                        <div className={`stat-value ${sessionStats.current.financial.netProfit >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(sessionStats.current.financial.netProfit)}
                        </div>
                        <div className="stat-progress">
                            <div 
                                className={`progress-bar ${getLimitColor(sessionStats.limits.loss.percentage)}`}
                                style={{ width: `${Math.min(sessionStats.limits.loss.percentage, 100)}%` }}
                            ></div>
                        </div>
                        <div className="stat-limit">
                            Win Rate: {sessionStats.current.financial.winRate.toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            {!compact && (
                <div className="session-controls__performance">
                    <h4 className="subsection-title">Performance Metrics</h4>
                    <div className="performance-grid">
                        <div className="performance-item">
                            <span className="performance-label">Signals Generated</span>
                            <span className="performance-value">{sessionStats.current.performance.signalsGenerated}</span>
                        </div>
                        <div className="performance-item">
                            <span className="performance-label">Intents Created</span>
                            <span className="performance-value">{sessionStats.current.performance.intentsCreated}</span>
                        </div>
                        <div className="performance-item">
                            <span className="performance-label">System Errors</span>
                            <span className="performance-value">{sessionStats.current.performance.errorCount}</span>
                        </div>
                        <div className="performance-item">
                            <span className="performance-label">Trading Mode</span>
                            <span className="performance-value mode-value">{sessionStats.current.mode.replace('_', ' ')}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Cooldown Status */}
            {(sessionStats.cooldowns.trade.active || sessionStats.cooldowns.session.active) && (
                <div className="session-controls__cooldowns">
                    <h4 className="subsection-title">Active Cooldowns</h4>
                    <div className="cooldown-list">
                        {sessionStats.cooldowns.trade.active && (
                            <div className="cooldown-item">
                                <span className="cooldown-icon">⏱️</span>
                                <span className="cooldown-label">Trade Cooldown</span>
                                <span className="cooldown-value">
                                    {formatDuration(sessionStats.cooldowns.trade.remaining)}
                                </span>
                            </div>
                        )}
                        {sessionStats.cooldowns.session.active && (
                            <div className="cooldown-item">
                                <span className="cooldown-icon">🕐</span>
                                <span className="cooldown-label">Session Cooldown</span>
                                <span className="cooldown-value">
                                    {formatDuration(sessionStats.cooldowns.session.remaining)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Session Actions */}
            <div className="session-controls__actions">
                <div className="action-grid">
                    <button
                        className="action-btn primary"
                        onClick={() => handleSessionAction('start_new_session')}
                        disabled={isPerformingAction || sessionStats.cooldowns.session.active}
                    >
                        <span className="btn-icon">🆕</span>
                        New Session
                    </button>

                    <button
                        className="action-btn secondary"
                        onClick={() => handleSessionAction('end_session')}
                        disabled={isPerformingAction || sessionStats.current.endTime !== undefined}
                    >
                        <span className="btn-icon">⏹️</span>
                        End Session
                    </button>

                    <button
                        className="action-btn warning"
                        onClick={() => handleSessionAction('reset_session')}
                        disabled={isPerformingAction}
                    >
                        <span className="btn-icon">🔄</span>
                        Reset Session
                    </button>
                </div>
            </div>

            {/* Advanced Controls */}
            {showAdvanced && !compact && (
                <div className="session-controls__advanced">
                    <h4 className="subsection-title">Advanced Controls</h4>
                    <div className="advanced-actions">
                        <button
                            className="action-btn secondary small"
                            onClick={() => {
                                const sessionData = sessionManagerService.exportSession();
                                if (sessionData) {
                                    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `tickshark-session-${sessionData.id}.json`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }
                            }}
                            disabled={isPerformingAction}
                        >
                            <span className="btn-icon">💾</span>
                            Export Session
                        </button>

                        <button
                            className="action-btn secondary small"
                            onClick={() => {
                                // This would open a file picker for import
                                console.log('Import session functionality would go here');
                            }}
                            disabled={isPerformingAction}
                        >
                            <span className="btn-icon">📁</span>
                            Import Session
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {showConfirmation && (
                <div className="session-controls__confirmation-overlay">
                    <div className="confirmation-dialog">
                        <div className="confirmation-header">
                            <h4>Confirm Action</h4>
                        </div>
                        
                        <div className="confirmation-content">
                            <p>Are you sure you want to perform this action?</p>
                            <p className="action-name">
                                <strong>{showConfirmation.replace('_', ' ').toUpperCase()}</strong>
                            </p>
                            {showConfirmation === 'reset_session' && (
                                <p className="warning-text">This will clear all current session data and start fresh.</p>
                            )}
                        </div>
                        
                        <div className="confirmation-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowConfirmation(null)}
                                disabled={isPerformingAction}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleSessionAction(showConfirmation, false)}
                                disabled={isPerformingAction}
                            >
                                {isPerformingAction ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Overlay */}
            {isPerformingAction && (
                <div className="session-controls__loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Processing action...</p>
                </div>
            )}
        </div>
    );
};

export default SessionControls;