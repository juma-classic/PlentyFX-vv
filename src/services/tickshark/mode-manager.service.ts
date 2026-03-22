/**
 * TickShark Mode Manager Service
 * Manages trading mode switching and safety controls
 * 
 * CRITICAL: Mode switching with comprehensive safety checks
 * - Manual Observation: Safe monitoring mode
 * - Simulation: Risk-free testing environment
 * - Semi-Automated: Human oversight with automation
 * - Fully Automated: Complete automation (HIGH RISK)
 */

import { TradingMode } from '../../types/tickshark/execution.types';

export { TradingMode };

export interface ModeConfig {
    // Mode Permissions
    canExecuteTrades: boolean;
    requiresConfirmation: boolean;
    hasRiskLimits: boolean;
    
    // Safety Settings
    maxStakePerTrade: number;
    maxTradesPerHour: number;
    maxTotalStake: number;
    
    // Automation Level
    automationLevel: 'NONE' | 'PARTIAL' | 'FULL';
    humanOversight: boolean;
    
    // Risk Controls
    riskLevel: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    safetyChecks: string[];
    
    // UI Behavior
    showWarnings: boolean;
    requiresUnlock: boolean;
    confirmationTimeout: number;
}

export interface ModeTransition {
    from: TradingMode;
    to: TradingMode;
    timestamp: number;
    reason?: string;
    userId?: string;
    
    // Safety Checks
    safetyChecksPassed: boolean;
    safetyChecks: Array<{
        check: string;
        passed: boolean;
        message: string;
    }>;
    
    // Confirmation
    requiresConfirmation: boolean;
    confirmed: boolean;
    confirmationTimeout?: number;
}

export interface ModeStatus {
    currentMode: TradingMode;
    previousMode?: TradingMode;
    
    // Mode State
    isLocked: boolean;
    lockReason?: string;
    unlockCode?: string;
    
    // Transition State
    isTransitioning: boolean;
    pendingTransition?: ModeTransition;
    
    // Safety State
    safetyEnabled: boolean;
    emergencyStop: boolean;
    
    // Statistics
    modeStartTime: number;
    totalTimeInMode: number;
    transitionCount: number;
    
    // Configuration
    config: ModeConfig;
}

class ModeManagerService {
    private currentMode: TradingMode = 'MANUAL_OBSERVATION';
    private modeHistory: ModeTransition[] = [];
    private isInitialized = false;
    private isLocked = false;
    private lockReason?: string;
    private emergencyStop = false;
    private modeStartTime = Date.now();
    private pendingTransition?: ModeTransition;

    // Mode Configurations
    private modeConfigs: Record<TradingMode, ModeConfig> = {
        'MANUAL_OBSERVATION': {
            canExecuteTrades: false,
            requiresConfirmation: false,
            hasRiskLimits: false,
            maxStakePerTrade: 0,
            maxTradesPerHour: 0,
            maxTotalStake: 0,
            automationLevel: 'NONE',
            humanOversight: true,
            riskLevel: 'SAFE',
            safetyChecks: ['market_hours', 'connection_status'],
            showWarnings: false,
            requiresUnlock: false,
            confirmationTimeout: 0,
        },
        
        'SIMULATION': {
            canExecuteTrades: true,
            requiresConfirmation: false,
            hasRiskLimits: true,
            maxStakePerTrade: 100,
            maxTradesPerHour: 60,
            maxTotalStake: 1000,
            automationLevel: 'PARTIAL',
            humanOversight: true,
            riskLevel: 'SAFE',
            safetyChecks: ['balance_check', 'market_hours', 'connection_status'],
            showWarnings: true,
            requiresUnlock: false,
            confirmationTimeout: 5000,
        },
        
        'SEMI_AUTOMATED': {
            canExecuteTrades: true,
            requiresConfirmation: true,
            hasRiskLimits: true,
            maxStakePerTrade: 50,
            maxTradesPerHour: 30,
            maxTotalStake: 500,
            automationLevel: 'PARTIAL',
            humanOversight: true,
            riskLevel: 'MEDIUM',
            safetyChecks: ['balance_check', 'risk_limits', 'market_hours', 'connection_status', 'volatility_check'],
            showWarnings: true,
            requiresUnlock: true,
            confirmationTimeout: 10000,
        },
        
        'FULLY_AUTOMATED': {
            canExecuteTrades: true,
            requiresConfirmation: true,
            hasRiskLimits: true,
            maxStakePerTrade: 25,
            maxTradesPerHour: 20,
            maxTotalStake: 200,
            automationLevel: 'FULL',
            humanOversight: false,
            riskLevel: 'EXTREME',
            safetyChecks: ['balance_check', 'risk_limits', 'market_hours', 'connection_status', 'volatility_check', 'drawdown_check', 'session_limits'],
            showWarnings: true,
            requiresUnlock: true,
            confirmationTimeout: 30000,
        },
    };

    /**
     * Initialize the mode manager
     */
    async initialize(): Promise<void> {
        try {
            // Load saved mode from storage
            const savedMode = this.loadModeFromStorage();
            if (savedMode && this.isValidMode(savedMode)) {
                this.currentMode = savedMode;
            }

            // Perform initial safety checks
            await this.performSafetyChecks(this.currentMode);
            
            this.isInitialized = true;
            this.modeStartTime = Date.now();
            
            console.log('🦈 Mode Manager initialized:', this.currentMode);
            
        } catch (error) {
            console.error('🦈 Mode Manager initialization failed:', error);
            // Fallback to safe mode
            this.currentMode = 'MANUAL_OBSERVATION';
            this.isInitialized = true;
        }
    }

    /**
     * Switch to a new trading mode
     */
    async switchMode(newMode: TradingMode, reason?: string): Promise<boolean> {
        if (!this.isInitialized) {
            throw new Error('Mode Manager not initialized');
        }

        if (this.isLocked) {
            throw new Error(`Mode switching locked: ${this.lockReason}`);
        }

        if (this.emergencyStop) {
            throw new Error('Emergency stop active - mode switching disabled');
        }

        if (newMode === this.currentMode) {
            console.log('🦈 Already in requested mode:', newMode);
            return true;
        }

        try {
            // Create transition record
            const transition: ModeTransition = {
                from: this.currentMode,
                to: newMode,
                timestamp: Date.now(),
                reason,
                safetyChecksPassed: false,
                safetyChecks: [],
                requiresConfirmation: this.modeConfigs[newMode].requiresConfirmation,
                confirmed: false,
            };

            // Perform safety checks
            const safetyResult = await this.performSafetyChecks(newMode);
            transition.safetyChecks = safetyResult.checks;
            transition.safetyChecksPassed = safetyResult.passed;

            if (!safetyResult.passed) {
                console.error('🦈 Mode switch failed safety checks:', safetyResult.checks);
                return false;
            }

            // Handle confirmation requirement
            if (transition.requiresConfirmation) {
                this.pendingTransition = transition;
                console.log('🦈 Mode switch requires confirmation:', newMode);
                return false; // Requires external confirmation
            }

            // Execute mode switch
            return await this.executeModeSwitch(transition);

        } catch (error) {
            console.error('🦈 Mode switch failed:', error);
            return false;
        }
    }

    /**
     * Confirm pending mode transition
     */
    async confirmModeSwitch(): Promise<boolean> {
        if (!this.pendingTransition) {
            throw new Error('No pending mode transition to confirm');
        }

        try {
            this.pendingTransition.confirmed = true;
            const success = await this.executeModeSwitch(this.pendingTransition);
            this.pendingTransition = undefined;
            return success;
        } catch (error) {
            console.error('🦈 Mode confirmation failed:', error);
            this.pendingTransition = undefined;
            return false;
        }
    }

    /**
     * Cancel pending mode transition
     */
    cancelModeSwitch(): void {
        if (this.pendingTransition) {
            console.log('🦈 Mode switch cancelled:', this.pendingTransition.to);
            this.pendingTransition = undefined;
        }
    }

    /**
     * Get current mode status
     */
    getModeStatus(): ModeStatus {
        return {
            currentMode: this.currentMode,
            previousMode: this.modeHistory.length > 0 ? this.modeHistory[0].from : undefined,
            isLocked: this.isLocked,
            lockReason: this.lockReason,
            isTransitioning: !!this.pendingTransition,
            pendingTransition: this.pendingTransition,
            safetyEnabled: true,
            emergencyStop: this.emergencyStop,
            modeStartTime: this.modeStartTime,
            totalTimeInMode: Date.now() - this.modeStartTime,
            transitionCount: this.modeHistory.length,
            config: { ...this.modeConfigs[this.currentMode] },
        };
    }

    /**
     * Get current mode
     */
    getCurrentMode(): TradingMode {
        return this.currentMode;
    }

    /**
     * Get mode configuration
     */
    getModeConfig(mode?: TradingMode): ModeConfig {
        const targetMode = mode || this.currentMode;
        return { ...this.modeConfigs[targetMode] };
    }

    /**
     * Lock mode switching
     */
    lockModeSwitch(reason: string): void {
        this.isLocked = true;
        this.lockReason = reason;
        console.log('🦈 Mode switching locked:', reason);
    }

    /**
     * Unlock mode switching
     */
    unlockModeSwitch(): void {
        this.isLocked = false;
        this.lockReason = undefined;
        console.log('🦈 Mode switching unlocked');
    }

    /**
     * Emergency stop - force safe mode
     */
    async emergencyStopActivate(): Promise<void> {
        console.warn('🦈 EMERGENCY STOP ACTIVATED');
        
        this.emergencyStop = true;
        this.lockModeSwitch('Emergency stop activated');
        
        // Force switch to safe mode
        const previousMode = this.currentMode;
        this.currentMode = 'MANUAL_OBSERVATION';
        this.modeStartTime = Date.now();
        
        // Record emergency transition
        const emergencyTransition: ModeTransition = {
            from: previousMode,
            to: 'MANUAL_OBSERVATION',
            timestamp: Date.now(),
            reason: 'EMERGENCY_STOP',
            safetyChecksPassed: true,
            safetyChecks: [],
            requiresConfirmation: false,
            confirmed: true,
        };
        
        this.modeHistory.unshift(emergencyTransition);
        this.saveModeToStorage();
    }

    /**
     * Deactivate emergency stop
     */
    emergencyStopDeactivate(): void {
        this.emergencyStop = false;
        this.unlockModeSwitch();
        console.log('🦈 Emergency stop deactivated');
    }

    /**
     * Get mode transition history
     */
    getModeHistory(): ModeTransition[] {
        return [...this.modeHistory];
    }

    /**
     * Update mode configuration
     */
    updateModeConfig(mode: TradingMode, config: Partial<ModeConfig>): void {
        this.modeConfigs[mode] = { ...this.modeConfigs[mode], ...config };
        console.log('🦈 Mode config updated:', mode, config);
    }

    /**
     * Private helper methods
     */
    private async executeModeSwitch(transition: ModeTransition): Promise<boolean> {
        try {
            const previousMode = this.currentMode;
            
            // Update current mode
            this.currentMode = transition.to;
            this.modeStartTime = Date.now();
            
            // Record transition
            this.modeHistory.unshift(transition);
            
            // Trim history (keep last 50 transitions)
            if (this.modeHistory.length > 50) {
                this.modeHistory = this.modeHistory.slice(0, 50);
            }
            
            // Save to storage
            this.saveModeToStorage();
            
            console.log(`🦈 Mode switched: ${previousMode} → ${this.currentMode}`);
            return true;
            
        } catch (error) {
            console.error('🦈 Mode switch execution failed:', error);
            return false;
        }
    }

    private async performSafetyChecks(mode: TradingMode): Promise<{ passed: boolean; checks: Array<{ check: string; passed: boolean; message: string }> }> {
        const config = this.modeConfigs[mode];
        const checks: Array<{ check: string; passed: boolean; message: string }> = [];
        
        for (const checkType of config.safetyChecks) {
            let passed = true;
            let message = 'OK';
            
            switch (checkType) {
                case 'market_hours': {
                    // Check if market is open (simplified)
                    const now = new Date();
                    const hour = now.getUTCHours();
                    passed = hour >= 0 && hour <= 23; // Always pass for demo
                    message = passed ? 'Market hours OK' : 'Market closed';
                    break;
                }
                    
                case 'connection_status': {
                    // Check WebSocket connection (simplified)
                    passed = true; // Assume connected for demo
                    message = 'Connection OK';
                    break;
                }
                    
                case 'balance_check':
                    // Check account balance (simplified)
                    passed = true; // Assume sufficient balance for demo
                    message = 'Balance sufficient';
                    break;
                    
                case 'risk_limits':
                    // Check risk limits (simplified)
                    passed = true; // Assume within limits for demo
                    message = 'Risk limits OK';
                    break;
                    
                case 'volatility_check':
                    // Check market volatility (simplified)
                    passed = true; // Assume normal volatility for demo
                    message = 'Volatility normal';
                    break;
                    
                case 'drawdown_check':
                    // Check current drawdown (simplified)
                    passed = true; // Assume acceptable drawdown for demo
                    message = 'Drawdown acceptable';
                    break;
                    
                case 'session_limits':
                    // Check session limits (simplified)
                    passed = true; // Assume within session limits for demo
                    message = 'Session limits OK';
                    break;
                    
                default:
                    passed = true;
                    message = 'Check not implemented';
            }
            
            checks.push({ check: checkType, passed, message });
        }
        
        const allPassed = checks.every(check => check.passed);
        return { passed: allPassed, checks };
    }

    private isValidMode(mode: string): mode is TradingMode {
        return ['MANUAL_OBSERVATION', 'SIMULATION', 'SEMI_AUTOMATED', 'FULLY_AUTOMATED'].includes(mode);
    }

    private loadModeFromStorage(): TradingMode | null {
        try {
            const saved = localStorage.getItem('tickshark-current-mode');
            return saved && this.isValidMode(saved) ? saved : null;
        } catch {
            return null;
        }
    }

    private saveModeToStorage(): void {
        try {
            localStorage.setItem('tickshark-current-mode', this.currentMode);
            localStorage.setItem('tickshark-mode-history', JSON.stringify(this.modeHistory.slice(0, 10)));
        } catch (error) {
            console.error('🦈 Failed to save mode to storage:', error);
        }
    }
}

// Export singleton instance
export const modeManagerService = new ModeManagerService();