/**
 * TickShark Settings Panel Component
 * Comprehensive configuration management for the TickShark platform
 * 
 * CRITICAL: Configuration interface with real-time updates
 * - Service configuration management
 * - Risk parameter controls
 * - Performance tuning options
 * - Safety threshold settings
 */

import React, { useState, useEffect } from 'react';
import { modeManagerService } from '../../services/tickshark/mode-manager.service';
import { analysisEngineService } from '../../services/tickshark/analysis-engine.service';
import { signalGeneratorService } from '../../services/tickshark/signal-generator.service';
import { sessionManagerService } from '../../services/tickshark/session-manager.service';
import { AnalysisConfig } from '../../types/tickshark/analysis.types';
import './SettingsPanel.scss';

export interface SettingsPanelProps {
    onConfigChange?: (service: string, config: any) => void;
    onError?: (error: string) => void;
    compact?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    onConfigChange,
    onError,
    compact = false,
}) => {
    const [activeSection, setActiveSection] = useState<'analysis' | 'signals' | 'session' | 'modes' | 'performance'>('analysis');
    const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig | null>(null);
    const [signalConfig, setSignalConfig] = useState<any>(null);
    const [sessionConfig, setSessionConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Load configurations on mount
    useEffect(() => {
        loadConfigurations();
    }, []);

    const loadConfigurations = async () => {
        try {
            setIsLoading(true);
            
            const analysis = analysisEngineService.getConfiguration();
            const signals = signalGeneratorService.getConfiguration();
            const session = sessionManagerService.getConfig();
            
            setAnalysisConfig(analysis);
            setSignalConfig(signals);
            setSessionConfig(session);
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load configurations';
            onError?.(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const saveConfiguration = async (service: 'analysis' | 'signals' | 'session', config: any) => {
        try {
            switch (service) {
                case 'analysis':
                    analysisEngineService.updateConfiguration(config);
                    setAnalysisConfig({ ...analysisConfig, ...config });
                    break;
                case 'signals':
                    signalGeneratorService.updateConfiguration(config);
                    setSignalConfig({ ...signalConfig, ...config });
                    break;
                case 'session':
                    sessionManagerService.updateConfig(config);
                    setSessionConfig({ ...sessionConfig, ...config });
                    break;
            }
            
            onConfigChange?.(service, config);
            setHasUnsavedChanges(false);
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to save configuration';
            onError?.(errorMessage);
        }
    };

    const resetToDefaults = async (service: 'analysis' | 'signals' | 'session') => {
        if (!confirm(`Reset ${service} configuration to defaults? This cannot be undone.`)) {
            return;
        }

        try {
            // Reset to default configurations
            switch (service) {
                case 'analysis':
                    const defaultAnalysis: Partial<AnalysisConfig> = {
                        minConfidence: 0.6,
                        minStrength: 0.5,
                        maxRiskScore: 0.7,
                        latencyThreshold: 50,
                        minLatencyAdvantage: 10,
                        minProfitThreshold: 0.01,
                        maxRiskThreshold: 0.3,
                        confidenceThreshold: 0.7,
                    };
                    await saveConfiguration('analysis', defaultAnalysis);
                    break;
                    
                case 'signals':
                    const defaultSignals = {
                        minConfidence: 0.6,
                        minStrength: 0.5,
                        maxRiskScore: 0.7,
                        maxStakePerSignal: 50,
                        riskAdjustment: 1.0,
                        minSignalInterval: 5000,
                        maxSignalAge: 30000,
                    };
                    await saveConfiguration('signals', defaultSignals);
                    break;
                    
                case 'session':
                    const defaultSession = {
                        maxDuration: 8 * 60 * 60 * 1000,
                        maxTrades: 100,
                        maxStake: 1000,
                        maxLoss: 200,
                        tradeCooldown: 5000,
                        sessionCooldown: 60000,
                    };
                    await saveConfiguration('session', defaultSession);
                    break;
            }
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to reset configuration';
            onError?.(errorMessage);
        }
    };

    const handleConfigChange = (service: 'analysis' | 'signals' | 'session', key: string, value: any) => {
        setHasUnsavedChanges(true);
        
        switch (service) {
            case 'analysis':
                setAnalysisConfig(prev => prev ? { ...prev, [key]: value } : null);
                break;
            case 'signals':
                setSignalConfig(prev => prev ? { ...prev, [key]: value } : null);
                break;
            case 'session':
                setSessionConfig(prev => prev ? { ...prev, [key]: value } : null);
                break;
        }
    };

    if (isLoading) {
        return (
            <div className={`settings-panel ${compact ? 'compact' : ''} loading-state`}>
                <div className="loading-display">
                    <div className="loading-spinner"></div>
                    <div className="loading-message">Loading configuration settings...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`settings-panel ${compact ? 'compact' : ''}`}>
            {/* Settings Header */}
            <div className="settings-header">
                <h3 className="section-title">
                    <span className="title-icon">⚙️</span>
                    TickShark Configuration
                </h3>
                
                {hasUnsavedChanges && (
                    <div className="unsaved-indicator">
                        <span className="indicator-icon">⚠️</span>
                        <span className="indicator-text">Unsaved Changes</span>
                    </div>
                )}
            </div>

            {/* Settings Navigation */}
            <div className="settings-navigation">
                <div className="nav-tabs">
                    {[
                        { id: 'analysis', label: 'Analysis Engine', icon: '🔍' },
                        { id: 'signals', label: 'Signal Generator', icon: '📡' },
                        { id: 'session', label: 'Session Management', icon: '📊' },
                        { id: 'modes', label: 'Trading Modes', icon: '🎛️' },
                        { id: 'performance', label: 'Performance', icon: '⚡' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            className={`nav-tab ${activeSection === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(tab.id as any)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-label">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Settings Content */}
            <div className="settings-content">
                {/* Analysis Engine Settings */}
                {activeSection === 'analysis' && analysisConfig && (
                    <div className="settings-section">
                        <div className="section-header">
                            <h4>Analysis Engine Configuration</h4>
                            <p>Configure latency arbitrage detection and market analysis parameters</p>
                        </div>

                        <div className="settings-groups">
                            {/* Latency Detection Settings */}
                            <div className="settings-group">
                                <h5 className="group-title">Latency Detection</h5>
                                
                                <div className="setting-item">
                                    <label className="setting-label">
                                        Latency Threshold (ms)
                                        <span className="setting-description">Maximum acceptable latency for arbitrage</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={analysisConfig.latencyThreshold}
                                        onChange={(e) => handleConfigChange('analysis', 'latencyThreshold', Number(e.target.value))}
                                        min="1"
                                        max="1000"
                                    />
                                </div>

                                <div className="setting-item">
                                    <label className="setting-label">
                                        Minimum Latency Advantage (ms)
                                        <span className="setting-description">Required latency advantage for opportunities</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={analysisConfig.minLatencyAdvantage}
                                        onChange={(e) => handleConfigChange('analysis', 'minLatencyAdvantage', Number(e.target.value))}
                                        min="1"
                                        max="100"
                                    />
                                </div>
                            </div>

                            {/* Arbitrage Detection Settings */}
                            <div className="settings-group">
                                <h5 className="group-title">Arbitrage Detection</h5>
                                
                                <div className="setting-item">
                                    <label className="setting-label">
                                        Minimum Profit Threshold (%)
                                        <span className="setting-description">Minimum expected profit for opportunities</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={analysisConfig.minProfitThreshold * 100}
                                        onChange={(e) => handleConfigChange('analysis', 'minProfitThreshold', Number(e.target.value) / 100)}
                                        min="0.1"
                                        max="10"
                                        step="0.1"
                                    />
                                </div>

                                <div className="setting-item">
                                    <label className="setting-label">
                                        Maximum Risk Threshold (%)
                                        <span className="setting-description">Maximum acceptable risk for opportunities</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={analysisConfig.maxRiskThreshold * 100}
                                        onChange={(e) => handleConfigChange('analysis', 'maxRiskThreshold', Number(e.target.value) / 100)}
                                        min="1"
                                        max="100"
                                        step="1"
                                    />
                                </div>

                                <div className="setting-item">
                                    <label className="setting-label">
                                        Confidence Threshold (%)
                                        <span className="setting-description">Minimum confidence for valid opportunities</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={analysisConfig.confidenceThreshold * 100}
                                        onChange={(e) => handleConfigChange('analysis', 'confidenceThreshold', Number(e.target.value) / 100)}
                                        min="10"
                                        max="100"
                                        step="5"
                                    />
                                </div>
                            </div>

                            {/* Performance Settings */}
                            <div className="settings-group">
                                <h5 className="group-title">Performance Settings</h5>
                                
                                <div className="setting-item">
                                    <label className="setting-label">
                                        Tick Buffer Size
                                        <span className="setting-description">Number of ticks to keep in memory</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={analysisConfig.tickBufferSize}
                                        onChange={(e) => handleConfigChange('analysis', 'tickBufferSize', Number(e.target.value))}
                                        min="10"
                                        max="1000"
                                    />
                                </div>

                                <div className="setting-item">
                                    <label className="setting-label">
                                        Analysis Interval (ms)
                                        <span className="setting-description">How often to run analysis</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={analysisConfig.analysisInterval}
                                        onChange={(e) => handleConfigChange('analysis', 'analysisInterval', Number(e.target.value))}
                                        min="100"
                                        max="10000"
                                        step="100"
                                    />
                                </div>

                                <div className="setting-item checkbox-item">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            className="setting-checkbox"
                                            checked={analysisConfig.enableCaching}
                                            onChange={(e) => handleConfigChange('analysis', 'enableCaching', e.target.checked)}
                                        />
                                        <span className="checkbox-text">Enable Result Caching</span>
                                        <span className="setting-description">Cache analysis results for better performance</span>
                                    </label>
                                </div>

                                <div className="setting-item checkbox-item">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            className="setting-checkbox"
                                            checked={analysisConfig.enablePatternDetection}
                                            onChange={(e) => handleConfigChange('analysis', 'enablePatternDetection', e.target.checked)}
                                        />
                                        <span className="checkbox-text">Enable Pattern Detection</span>
                                        <span className="setting-description">Advanced pattern recognition algorithms</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="section-actions">
                            <button
                                className="action-btn secondary"
                                onClick={() => resetToDefaults('analysis')}
                            >
                                Reset to Defaults
                            </button>
                            <button
                                className="action-btn primary"
                                onClick={() => saveConfiguration('analysis', analysisConfig)}
                                disabled={!hasUnsavedChanges}
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                )}

                {/* Signal Generator Settings */}
                {activeSection === 'signals' && signalConfig && (
                    <div className="settings-section">
                        <div className="section-header">
                            <h4>Signal Generator Configuration</h4>
                            <p>Configure trading signal generation and filtering parameters</p>
                        </div>

                        <div className="settings-groups">
                            {/* Signal Generation Settings */}
                            <div className="settings-group">
                                <h5 className="group-title">Signal Generation</h5>
                                
                                <div className="setting-item">
                                    <label className="setting-label">
                                        Minimum Confidence (%)
                                        <span className="setting-description">Minimum confidence for signal generation</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={signalConfig.minConfidence * 100}
                                        onChange={(e) => handleConfigChange('signals', 'minConfidence', Number(e.target.value) / 100)}
                                        min="10"
                                        max="100"
                                        step="5"
                                    />
                                </div>

                                <div className="setting-item">
                                    <label className="setting-label">
                                        Minimum Strength (%)
                                        <span className="setting-description">Minimum signal strength threshold</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={signalConfig.minStrength * 100}
                                        onChange={(e) => handleConfigChange('signals', 'minStrength', Number(e.target.value) / 100)}
                                        min="10"
                                        max="100"
                                        step="5"
                                    />
                                </div>

                                <div className="setting-item">
                                    <label className="setting-label">
                                        Maximum Risk Score (%)
                                        <span className="setting-description">Maximum acceptable risk for signals</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={signalConfig.maxRiskScore * 100}
                                        onChange={(e) => handleConfigChange('signals', 'maxRiskScore', Number(e.target.value) / 100)}
                                        min="1"
                                        max="100"
                                        step="1"
                                    />
                                </div>
                            </div>

                            {/* Risk Management Settings */}
                            <div className="settings-group">
                                <h5 className="group-title">Risk Management</h5>
                                
                                <div className="setting-item">
                                    <label className="setting-label">
                                        Maximum Stake per Signal ($)
                                        <span className="setting-description">Maximum recommended stake amount</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={signalConfig.maxStakePerSignal}
                                        onChange={(e) => handleConfigChange('signals', 'maxStakePerSignal', Number(e.target.value))}
                                        min="1"
                                        max="1000"
                                    />
                                </div>

                                <div className="setting-item">
                                    <label className="setting-label">
                                        Risk Adjustment Factor
                                        <span className="setting-description">Risk multiplier (0.5=conservative, 2.0=aggressive)</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={signalConfig.riskAdjustment}
                                        onChange={(e) => handleConfigChange('signals', 'riskAdjustment', Number(e.target.value))}
                                        min="0.1"
                                        max="3.0"
                                        step="0.1"
                                    />
                                </div>
                            </div>

                            {/* Signal Types Settings */}
                            <div className="settings-group">
                                <h5 className="group-title">Signal Types</h5>
                                
                                <div className="setting-item checkbox-item">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            className="setting-checkbox"
                                            checked={signalConfig.enableRiseFall}
                                            onChange={(e) => handleConfigChange('signals', 'enableRiseFall', e.target.checked)}
                                        />
                                        <span className="checkbox-text">Rise/Fall Signals</span>
                                        <span className="setting-description">Enable directional price movement signals</span>
                                    </label>
                                </div>

                                <div className="setting-item checkbox-item">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            className="setting-checkbox"
                                            checked={signalConfig.enableHigherLower}
                                            onChange={(e) => handleConfigChange('signals', 'enableHigherLower', e.target.checked)}
                                        />
                                        <span className="checkbox-text">Higher/Lower Signals</span>
                                        <span className="setting-description">Enable barrier-based signals</span>
                                    </label>
                                </div>

                                <div className="setting-item checkbox-item">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            className="setting-checkbox"
                                            checked={signalConfig.enableEvenOdd}
                                            onChange={(e) => handleConfigChange('signals', 'enableEvenOdd', e.target.checked)}
                                        />
                                        <span className="checkbox-text">Even/Odd Signals</span>
                                        <span className="setting-description">Enable digit-based even/odd signals</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="section-actions">
                            <button
                                className="action-btn secondary"
                                onClick={() => resetToDefaults('signals')}
                            >
                                Reset to Defaults
                            </button>
                            <button
                                className="action-btn primary"
                                onClick={() => saveConfiguration('signals', signalConfig)}
                                disabled={!hasUnsavedChanges}
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                )}

                {/* Session Management Settings */}
                {activeSection === 'session' && sessionConfig && (
                    <div className="settings-section">
                        <div className="section-header">
                            <h4>Session Management Configuration</h4>
                            <p>Configure session limits, cooldowns, and safety parameters</p>
                        </div>

                        <div className="settings-groups">
                            {/* Session Limits */}
                            <div className="settings-group">
                                <h5 className="group-title">Session Limits</h5>
                                
                                <div className="setting-item">
                                    <label className="setting-label">
                                        Maximum Session Duration (hours)
                                        <span className="setting-description">Maximum time for a single session</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={sessionConfig.maxDuration / (60 * 60 * 1000)}
                                        onChange={(e) => handleConfigChange('session', 'maxDuration', Number(e.target.value) * 60 * 60 * 1000)}
                                        min="0.5"
                                        max="24"
                                        step="0.5"
                                    />
                                </div>

                                <div className="setting-item">
                                    <label className="setting-label">
                                        Maximum Trades per Session
                                        <span className="setting-description">Maximum number of trades allowed</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={sessionConfig.maxTrades}
                                        onChange={(e) => handleConfigChange('session', 'maxTrades', Number(e.target.value))}
                                        min="1"
                                        max="1000"
                                    />
                                </div>

                                <div className="setting-item">
                                    <label className="setting-label">
                                        Maximum Total Stake ($)
                                        <span className="setting-description">Maximum total stake per session</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={sessionConfig.maxStake}
                                        onChange={(e) => handleConfigChange('session', 'maxStake', Number(e.target.value))}
                                        min="10"
                                        max="10000"
                                    />
                                </div>

                                <div className="setting-item">
                                    <label className="setting-label">
                                        Maximum Loss per Session ($)
                                        <span className="setting-description">Maximum acceptable loss</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={sessionConfig.maxLoss}
                                        onChange={(e) => handleConfigChange('session', 'maxLoss', Number(e.target.value))}
                                        min="1"
                                        max="5000"
                                    />
                                </div>
                            </div>

                            {/* Cooldown Settings */}
                            <div className="settings-group">
                                <h5 className="group-title">Cooldown Settings</h5>
                                
                                <div className="setting-item">
                                    <label className="setting-label">
                                        Trade Cooldown (seconds)
                                        <span className="setting-description">Minimum time between trades</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={sessionConfig.tradeCooldown / 1000}
                                        onChange={(e) => handleConfigChange('session', 'tradeCooldown', Number(e.target.value) * 1000)}
                                        min="1"
                                        max="300"
                                    />
                                </div>

                                <div className="setting-item">
                                    <label className="setting-label">
                                        Session Cooldown (minutes)
                                        <span className="setting-description">Minimum time between sessions</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={sessionConfig.sessionCooldown / (60 * 1000)}
                                        onChange={(e) => handleConfigChange('session', 'sessionCooldown', Number(e.target.value) * 60 * 1000)}
                                        min="0.5"
                                        max="60"
                                        step="0.5"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="section-actions">
                            <button
                                className="action-btn secondary"
                                onClick={() => resetToDefaults('session')}
                            >
                                Reset to Defaults
                            </button>
                            <button
                                className="action-btn primary"
                                onClick={() => saveConfiguration('session', sessionConfig)}
                                disabled={!hasUnsavedChanges}
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                )}

                {/* Trading Modes Settings */}
                {activeSection === 'modes' && (
                    <div className="settings-section">
                        <div className="section-header">
                            <h4>Trading Modes Configuration</h4>
                            <p>Configure safety settings and parameters for each trading mode</p>
                        </div>

                        <div className="mode-configurations">
                            <div className="mode-config-card">
                                <div className="mode-header">
                                    <span className="mode-icon">👁️</span>
                                    <h5>Manual Observation</h5>
                                    <span className="mode-risk safe">SAFE</span>
                                </div>
                                <div className="mode-description">
                                    Monitor market conditions without executing trades. Perfect for learning and analysis.
                                </div>
                                <div className="mode-settings">
                                    <div className="mode-setting">
                                        <span className="setting-name">Trade Execution:</span>
                                        <span className="setting-value disabled">Disabled</span>
                                    </div>
                                    <div className="mode-setting">
                                        <span className="setting-name">Risk Level:</span>
                                        <span className="setting-value safe">None</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mode-config-card">
                                <div className="mode-header">
                                    <span className="mode-icon">🧪</span>
                                    <h5>Simulation Mode</h5>
                                    <span className="mode-risk safe">SAFE</span>
                                </div>
                                <div className="mode-description">
                                    Risk-free simulation environment for testing strategies and algorithms.
                                </div>
                                <div className="mode-settings">
                                    <div className="mode-setting">
                                        <span className="setting-name">Max Stake per Trade:</span>
                                        <span className="setting-value">$100</span>
                                    </div>
                                    <div className="mode-setting">
                                        <span className="setting-name">Max Trades per Hour:</span>
                                        <span className="setting-value">60</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mode-config-card">
                                <div className="mode-header">
                                    <span className="mode-icon">⚡</span>
                                    <h5>Semi-Automated</h5>
                                    <span className="mode-risk medium">MEDIUM</span>
                                </div>
                                <div className="mode-description">
                                    Automated analysis with manual trade confirmation. Balanced approach with human oversight.
                                </div>
                                <div className="mode-settings">
                                    <div className="mode-setting">
                                        <span className="setting-name">Max Stake per Trade:</span>
                                        <span className="setting-value">$50</span>
                                    </div>
                                    <div className="mode-setting">
                                        <span className="setting-name">Requires Confirmation:</span>
                                        <span className="setting-value enabled">Yes</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mode-config-card high-risk">
                                <div className="mode-header">
                                    <span className="mode-icon">🤖</span>
                                    <h5>Fully Automated</h5>
                                    <span className="mode-risk high">HIGH RISK</span>
                                </div>
                                <div className="mode-description">
                                    Complete automation with no human intervention. Use with extreme caution.
                                </div>
                                <div className="mode-settings">
                                    <div className="mode-setting">
                                        <span className="setting-name">Max Stake per Trade:</span>
                                        <span className="setting-value">$25</span>
                                    </div>
                                    <div className="mode-setting">
                                        <span className="setting-name">Safety Checks:</span>
                                        <span className="setting-value enabled">Enhanced</span>
                                    </div>
                                </div>
                                <div className="mode-warning">
                                    ⚠️ This mode can execute trades automatically. Use only with proper risk management.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Performance Settings */}
                {activeSection === 'performance' && (
                    <div className="settings-section">
                        <div className="section-header">
                            <h4>Performance Configuration</h4>
                            <p>Optimize system performance and resource usage</p>
                        </div>

                        <div className="performance-metrics">
                            <div className="metric-card">
                                <div className="metric-header">
                                    <span className="metric-icon">⚡</span>
                                    <h5>Analysis Performance</h5>
                                </div>
                                <div className="metric-value">
                                    <span className="value">45ms</span>
                                    <span className="label">Average Analysis Time</span>
                                </div>
                                <div className="metric-status good">Excellent</div>
                            </div>

                            <div className="metric-card">
                                <div className="metric-header">
                                    <span className="metric-icon">💾</span>
                                    <h5>Memory Usage</h5>
                                </div>
                                <div className="metric-value">
                                    <span className="value">156MB</span>
                                    <span className="label">Current Usage</span>
                                </div>
                                <div className="metric-status good">Normal</div>
                            </div>

                            <div className="metric-card">
                                <div className="metric-header">
                                    <span className="metric-icon">🔄</span>
                                    <h5>Update Frequency</h5>
                                </div>
                                <div className="metric-value">
                                    <span className="value">2.0s</span>
                                    <span className="label">Refresh Interval</span>
                                </div>
                                <div className="metric-status good">Optimal</div>
                            </div>
                        </div>

                        <div className="performance-controls">
                            <div className="control-group">
                                <h5>Performance Optimization</h5>
                                
                                <div className="setting-item checkbox-item">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            className="setting-checkbox"
                                            defaultChecked={true}
                                        />
                                        <span className="checkbox-text">Enable Performance Monitoring</span>
                                        <span className="setting-description">Track system performance metrics</span>
                                    </label>
                                </div>

                                <div className="setting-item checkbox-item">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            className="setting-checkbox"
                                            defaultChecked={true}
                                        />
                                        <span className="checkbox-text">Optimize Memory Usage</span>
                                        <span className="setting-description">Automatically manage memory allocation</span>
                                    </label>
                                </div>

                                <div className="setting-item checkbox-item">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            className="setting-checkbox"
                                            defaultChecked={false}
                                        />
                                        <span className="checkbox-text">Debug Mode</span>
                                        <span className="setting-description">Enable detailed logging (impacts performance)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPanel;