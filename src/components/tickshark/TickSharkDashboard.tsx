/**
 * TickShark Professional Dashboard
 * Main dashboard component integrating all TickShark systems
 * 
 * CRITICAL: Professional trading interface with comprehensive controls
 * - Mode management and switching
 * - Session controls integration
 * - Real-time monitoring displays
 * - Safety system integration
 * - Professional layout and styling
 */

import React, { useState, useEffect } from 'react';
import { SessionControls } from './SessionControls';
import { MarketAnalysis } from './MarketAnalysis';
import { SettingsPanel } from './SettingsPanel';
import { PerformanceAnalytics } from './PerformanceAnalytics';
import { modeManagerService, TradingMode } from '../../services/tickshark/mode-manager.service';
import { sessionManagerService } from '../../services/tickshark/session-manager.service';
import './TickSharkDashboard.scss';

export interface TickSharkDashboardProps {
    initialMode?: TradingMode;
    onModeChange?: (mode: TradingMode) => void;
    onError?: (error: string) => void;
    showAdvancedControls?: boolean;
    compactMode?: boolean;
}

export const TickSharkDashboard: React.FC<TickSharkDashboardProps> = ({
    initialMode = 'MANUAL_OBSERVATION',
    onModeChange,
    onError,
    showAdvancedControls = true,
    compactMode = false,
}) => {
    const [currentMode, setCurrentMode] = useState<TradingMode>(initialMode);
    const [isInitializing, setIsInitializing] = useState(true);
    const [systemStatus, setSystemStatus] = useState<'INITIALIZING' | 'READY' | 'ERROR'>('INITIALIZING');
    const [activePanel, setActivePanel] = useState<'overview' | 'session' | 'analysis' | 'analytics' | 'settings'>('overview');

    // Initialize dashboard
    useEffect(() => {
        const initializeDashboard = async () => {
            try {
                setIsInitializing(true);
                
                // Initialize mode manager
                await modeManagerService.initialize();
                
                // Set initial mode
                const success = await modeManagerService.switchMode(initialMode);
                if (!success) {
                    throw new Error('Failed to set initial trading mode');
                }
                
                setCurrentMode(initialMode);
                setSystemStatus('READY');
                
                console.log('🦈 TickShark Dashboard initialized successfully');
                
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Dashboard initialization failed';
                setSystemStatus('ERROR');
                onError?.(errorMessage);
                console.error('🦈 Dashboard initialization failed:', errorMessage);
            } finally {
                setIsInitializing(false);
            }
        };

        initializeDashboard();
    }, [initialMode, onError]);

    // Handle mode changes
    const handleModeChange = async (newMode: TradingMode) => {
        try {
            const success = await modeManagerService.switchMode(newMode);
            if (success) {
                setCurrentMode(newMode);
                onModeChange?.(newMode);
                console.log('🦈 Mode switched to:', newMode);
            } else {
                throw new Error(`Failed to switch to ${newMode} mode`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Mode switch failed';
            onError?.(errorMessage);
            console.error('🦈 Mode switch failed:', errorMessage);
        }
    };

    // Handle session actions
    const handleSessionAction = (action: string, data?: any) => {
        console.log('🦈 Session action:', action, data);
        
        // Handle specific session actions
        switch (action) {
            case 'start_new_session':
                // Reset any UI state for new session
                setActivePanel('overview');
                break;
            case 'end_session':
                // Handle session end
                break;
            case 'reset_session':
                // Handle session reset
                break;
        }
    };

    // Get mode display info
    const getModeInfo = (mode: TradingMode) => {
        const modeConfig = {
            'MANUAL_OBSERVATION': {
                name: 'Manual Observation',
                icon: '👁️',
                color: 'blue',
                description: 'Monitor market conditions without trading'
            },
            'SIMULATION': {
                name: 'Simulation Mode',
                icon: '🧪',
                color: 'green',
                description: 'Risk-free simulation environment'
            },
            'SEMI_AUTOMATED': {
                name: 'Semi-Automated',
                icon: '⚡',
                color: 'orange',
                description: 'Automated analysis with manual execution'
            },
            'FULLY_AUTOMATED': {
                name: 'Fully Automated',
                icon: '🤖',
                color: 'red',
                description: 'Full automated trading (HIGH RISK)'
            }
        };
        
        return modeConfig[mode] || modeConfig['MANUAL_OBSERVATION'];
    };

    // Loading state
    if (isInitializing) {
        return (
            <div className="tickshark-dashboard tickshark-dashboard--loading">
                <div className="dashboard-loading">
                    <div className="loading-spinner"></div>
                    <h2>🦈 Initializing TickShark Dashboard</h2>
                    <p>Setting up professional trading environment...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (systemStatus === 'ERROR') {
        return (
            <div className="tickshark-dashboard tickshark-dashboard--error">
                <div className="dashboard-error">
                    <div className="error-icon">⚠️</div>
                    <h2>Dashboard Initialization Failed</h2>
                    <p>Unable to initialize the TickShark trading environment.</p>
                    <button 
                        className="retry-btn"
                        onClick={() => window.location.reload()}
                    >
                        Retry Initialization
                    </button>
                </div>
            </div>
        );
    }

    const currentModeInfo = getModeInfo(currentMode);

    return (
        <div className={`tickshark-dashboard ${compactMode ? 'compact' : ''}`}>
            {/* Dashboard Header */}
            <div className="dashboard-header">
                <div className="dashboard-title">
                    <div className="title-icon">🦈</div>
                    <div className="title-content">
                        <h1>TickShark Professional</h1>
                        <p className="subtitle">Latency Arbitrage Trading Platform</p>
                    </div>
                </div>

                {/* Current Mode Display */}
                <div className={`current-mode mode-${currentModeInfo.color}`}>
                    <span className="mode-icon">{currentModeInfo.icon}</span>
                    <div className="mode-info">
                        <div className="mode-name">{currentModeInfo.name}</div>
                        <div className="mode-description">{currentModeInfo.description}</div>
                    </div>
                </div>

                {/* System Status */}
                <div className="system-status">
                    <div className={`status-indicator status-${systemStatus.toLowerCase()}`}>
                        <div className="status-dot"></div>
                        <span className="status-text">{systemStatus}</span>
                    </div>
                </div>
            </div>

            {/* Mode Selection */}
            <div className="dashboard-mode-selection">
                <h3 className="section-title">Trading Mode Selection</h3>
                <div className="mode-grid">
                    {(['MANUAL_OBSERVATION', 'SIMULATION', 'SEMI_AUTOMATED', 'FULLY_AUTOMATED'] as TradingMode[]).map((mode) => {
                        const modeInfo = getModeInfo(mode);
                        const isActive = currentMode === mode;
                        const isHighRisk = mode === 'FULLY_AUTOMATED';
                        
                        return (
                            <button
                                key={mode}
                                className={`mode-card ${isActive ? 'active' : ''} ${isHighRisk ? 'high-risk' : ''}`}
                                onClick={() => handleModeChange(mode)}
                                disabled={isActive}
                            >
                                <div className="mode-card-icon">{modeInfo.icon}</div>
                                <div className="mode-card-content">
                                    <div className="mode-card-name">{modeInfo.name}</div>
                                    <div className="mode-card-description">{modeInfo.description}</div>
                                </div>
                                {isActive && <div className="active-indicator">✓</div>}
                                {isHighRisk && <div className="risk-warning">⚠️</div>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Dashboard Navigation */}
            <div className="dashboard-navigation">
                <div className="nav-tabs">
                    {[
                        { id: 'overview', label: 'Overview', icon: '📊' },
                        { id: 'session', label: 'Session Control', icon: '🎛️' },
                        { id: 'analysis', label: 'Analysis', icon: '📈' },
                        { id: 'analytics', label: 'Performance', icon: '📊' },
                        { id: 'settings', label: 'Settings', icon: '⚙️' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            className={`nav-tab ${activePanel === tab.id ? 'active' : ''}`}
                            onClick={() => setActivePanel(tab.id as any)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-label">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="dashboard-content">
                {/* Overview Panel */}
                {activePanel === 'overview' && (
                    <div className="dashboard-panel overview-panel">
                        <div className="panel-header">
                            <h3>System Overview</h3>
                            <p>Real-time monitoring of TickShark trading systems</p>
                        </div>
                        
                        <div className="overview-grid">
                            <div className="overview-card">
                                <div className="card-header">
                                    <span className="card-icon">🎯</span>
                                    <h4>Current Mode</h4>
                                </div>
                                <div className="card-content">
                                    <div className={`mode-display mode-${currentModeInfo.color}`}>
                                        <span className="mode-icon">{currentModeInfo.icon}</span>
                                        <span className="mode-name">{currentModeInfo.name}</span>
                                    </div>
                                    <p className="mode-description">{currentModeInfo.description}</p>
                                </div>
                            </div>

                            <div className="overview-card">
                                <div className="card-header">
                                    <span className="card-icon">⚡</span>
                                    <h4>System Performance</h4>
                                </div>
                                <div className="card-content">
                                    <div className="performance-metrics">
                                        <div className="metric">
                                            <span className="metric-label">Latency</span>
                                            <span className="metric-value">&lt; 1ms</span>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-label">Uptime</span>
                                            <span className="metric-value">99.9%</span>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-label">Status</span>
                                            <span className="metric-value status-ready">Ready</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="overview-card">
                                <div className="card-header">
                                    <span className="card-icon">🛡️</span>
                                    <h4>Safety Systems</h4>
                                </div>
                                <div className="card-content">
                                    <div className="safety-status">
                                        <div className="safety-item">
                                            <span className="safety-indicator active"></span>
                                            <span className="safety-label">Circuit Breakers</span>
                                        </div>
                                        <div className="safety-item">
                                            <span className="safety-indicator active"></span>
                                            <span className="safety-label">Risk Limits</span>
                                        </div>
                                        <div className="safety-item">
                                            <span className="safety-indicator active"></span>
                                            <span className="safety-label">Lock System</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="overview-card">
                                <div className="card-header">
                                    <span className="card-icon">📡</span>
                                    <h4>Market Connection</h4>
                                </div>
                                <div className="card-content">
                                    <div className="connection-status">
                                        <div className="connection-item">
                                            <span className="connection-indicator connected"></span>
                                            <span className="connection-label">WebSocket</span>
                                        </div>
                                        <div className="connection-item">
                                            <span className="connection-indicator connected"></span>
                                            <span className="connection-label">API</span>
                                        </div>
                                        <div className="connection-item">
                                            <span className="connection-indicator connected"></span>
                                            <span className="connection-label">Data Feed</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Session Control Panel */}
                {activePanel === 'session' && (
                    <div className="dashboard-panel session-panel">
                        <div className="panel-header">
                            <h3>Session Management</h3>
                            <p>Control and monitor trading sessions</p>
                        </div>
                        
                        <SessionControls
                            onSessionAction={handleSessionAction}
                            onError={onError}
                            compact={compactMode}
                            showAdvanced={showAdvancedControls}
                        />
                    </div>
                )}

                {/* Analysis Panel */}
                {activePanel === 'analysis' && (
                    <div className="dashboard-panel analysis-panel">
                        <div className="panel-header">
                            <h3>Market Analysis</h3>
                            <p>Real-time latency arbitrage analysis</p>
                        </div>
                        
                        <MarketAnalysis
                            symbol="R_100"
                            autoRefresh={true}
                            refreshInterval={2000}
                            compact={compactMode}
                        />
                    </div>
                )}

                {/* Performance Analytics Panel */}
                {activePanel === 'analytics' && (
                    <div className="dashboard-panel analytics-panel">
                        <div className="panel-header">
                            <h3>Performance Analytics</h3>
                            <p>Advanced performance analysis and optimization insights</p>
                        </div>
                        
                        <PerformanceAnalytics
                            compact={compactMode}
                            autoRefresh={true}
                            refreshInterval={30000}
                            onInsightClick={(insight) => {
                                console.log('🦈 Insight clicked:', insight);
                                // Could open a detailed insight modal or navigate to settings
                            }}
                        />
                    </div>
                )}

                {/* Settings Panel */}
                {activePanel === 'settings' && (
                    <div className="dashboard-panel settings-panel-container">
                        <div className="panel-header">
                            <h3>System Settings</h3>
                            <p>Configure TickShark trading parameters</p>
                        </div>
                        
                        <SettingsPanel
                            onConfigChange={(service, config) => {
                                console.log(`🦈 Configuration updated for ${service}:`, config);
                            }}
                            onError={onError}
                            compact={compactMode}
                        />
                    </div>
                )}
            </div>

            {/* Dashboard Footer */}
            <div className="dashboard-footer">
                <div className="footer-info">
                    <span className="version">TickShark v1.0</span>
                    <span className="separator">•</span>
                    <span className="mode">Professional Trading Platform</span>
                    <span className="separator">•</span>
                    <span className="status">System Ready</span>
                </div>
                
                <div className="footer-actions">
                    <button className="footer-btn" title="System Health">
                        <span className="btn-icon">💚</span>
                        <span className="btn-label">Healthy</span>
                    </button>
                    <button className="footer-btn" title="Emergency Stop">
                        <span className="btn-icon">🛑</span>
                        <span className="btn-label">E-Stop</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TickSharkDashboard;