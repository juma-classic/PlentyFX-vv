/**
 * TickShark Signal Generator Service
 * Converts analysis results into actionable trading signals
 * 
 * CRITICAL: Signal generation with confidence scoring and filtering
 * - Analysis result processing
 * - Signal strength calculation
 * - Risk-based filtering
 * - Intent creation preparation
 */

import { AnalysisResult, ArbitrageOpportunity } from '../../types/tickshark/analysis.types';
import { TradingMode, IntentType } from '../../types/tickshark/execution.types';

export interface AnalysisSignal {
    id: string;
    timestamp: number;
    
    // Signal Source
    analysisId: string;
    opportunityId?: string;
    
    // Signal Properties
    type: IntentType;
    symbol: string;
    confidence: number; // 0-1 scale
    strength: number; // 0-1 scale
    
    // Trading Parameters
    recommendedStake: number;
    recommendedDuration: number;
    barrier?: number;
    prediction?: number;
    
    // Risk Assessment
    riskScore: number; // 0-1 scale
    riskFactors: string[];
    
    // Timing
    validFrom: number;
    validUntil: number;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    
    // Market Context
    currentPrice: number;
    expectedPrice: number;
    priceTarget?: number;
    stopLoss?: number;
    
    // Validation
    isValid: boolean;
    validationScore: number;
    
    // Metadata
    source: 'LATENCY_ARBITRAGE' | 'SPREAD_ARBITRAGE' | 'PATTERN_DETECTION' | 'ML_MODEL';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    tags: string[];
    notes?: string;
}

export interface SignalConfig {
    // Signal Generation
    minConfidence: number;
    minStrength: number;
    maxRiskScore: number;
    
    // Signal Types
    enableRiseFall: boolean;
    enableHigherLower: boolean;
    enableMatchesDiffers: boolean;
    enableEvenOdd: boolean;
    enableOverUnder: boolean;
    
    // Risk Management
    maxStakePerSignal: number;
    riskAdjustment: number; // 0-2 scale (0.5 = conservative, 1.0 = normal, 2.0 = aggressive)
    
    // Timing Controls
    minSignalInterval: number; // Minimum time between signals
    maxSignalAge: number; // Maximum signal validity period
    
    // Filtering
    enableQualityFilter: boolean;
    enableDuplicateFilter: boolean;
    enableRiskFilter: boolean;
    
    // Advanced Features
    enableSignalCombination: boolean;
    enableAdaptiveLearning: boolean;
    enablePerformanceTracking: boolean;
}

export interface SignalStatistics {
    // Generation Stats
    totalSignalsGenerated: number;
    signalsPerHour: number;
    averageConfidence: number;
    averageStrength: number;
    
    // Signal Types
    riseFallSignals: number;
    higherLowerSignals: number;
    matchesDiffersSignals: number;
    evenOddSignals: number;
    overUnderSignals: number;
    
    // Performance Metrics
    signalsActioned: number;
    successfulSignals: number;
    failedSignals: number;
    successRate: number;
    
    // Risk Metrics
    averageRiskScore: number;
    highRiskSignals: number;
    riskViolations: number;
    
    // Quality Metrics
    averageValidationScore: number;
    filteredSignals: number;
    duplicateSignals: number;
}

class SignalGeneratorService {
    private config: SignalConfig = {
        // Signal Generation
        minConfidence: 0.6,
        minStrength: 0.5,
        maxRiskScore: 0.7,
        
        // Signal Types
        enableRiseFall: true,
        enableHigherLower: true,
        enableMatchesDiffers: true,
        enableEvenOdd: true,
        enableOverUnder: true,
        
        // Risk Management
        maxStakePerSignal: 50,
        riskAdjustment: 1.0,
        
        // Timing Controls
        minSignalInterval: 5000, // 5 seconds
        maxSignalAge: 30000, // 30 seconds
        
        // Filtering
        enableQualityFilter: true,
        enableDuplicateFilter: true,
        enableRiskFilter: true,
        
        // Advanced Features
        enableSignalCombination: false,
        enableAdaptiveLearning: false,
        enablePerformanceTracking: true,
    };

    private recentSignals: AnalysisSignal[] = [];
    private statistics: SignalStatistics = this.initializeStatistics();
    private lastSignalTime = 0;
    private signalHistory: AnalysisSignal[] = [];

    /**
     * Generate trading signals from analysis results
     */
    generateSignals(analysisResult: AnalysisResult, tradingMode?: TradingMode): AnalysisSignal[] {
        try {
            const signals: AnalysisSignal[] = [];
            
            // Validate analysis result
            if (!analysisResult.isValid || analysisResult.opportunities.length === 0) {
                return signals;
            }
            
            // Check signal interval
            if (Date.now() - this.lastSignalTime < this.config.minSignalInterval) {
                return signals;
            }
            
            // Process each opportunity
            for (const opportunity of analysisResult.opportunities) {
                const signal = this.createSignalFromOpportunity(analysisResult, opportunity, tradingMode);
                if (signal && this.validateSignal(signal)) {
                    signals.push(signal);
                }
            }
            
            // Apply filters
            const filteredSignals = this.applySignalFilters(signals);
            
            // Update tracking
            this.updateSignalTracking(filteredSignals);
            
            // Update statistics
            this.updateStatistics(signals, filteredSignals);
            
            this.lastSignalTime = Date.now();
            
            return filteredSignals;
            
        } catch (error) {
            console.error('🦈 Signal generation failed:', error);
            return [];
        }
    }

    /**
     * Get signal statistics
     */
    getStatistics(): SignalStatistics {
        return { ...this.statistics };
    }

    /**
     * Update signal configuration
     */
    updateConfiguration(newConfig: Partial<SignalConfig>): void {
        this.config = { ...this.config, ...newConfig };
        console.log('🦈 Signal generator configuration updated');
    }

    /**
     * Get current configuration
     */
    getConfiguration(): SignalConfig {
        return { ...this.config };
    }

    /**
     * Get recent signals
     */
    getRecentSignals(limit = 10): AnalysisSignal[] {
        return this.recentSignals.slice(0, limit);
    }

    /**
     * Clear signal history
     */
    clearHistory(): void {
        this.recentSignals = [];
        this.signalHistory = [];
        console.log('🦈 Signal history cleared');
    }

    /**
     * Private signal generation methods
     */
    private createSignalFromOpportunity(
        analysisResult: AnalysisResult, 
        opportunity: ArbitrageOpportunity, 
        tradingMode?: TradingMode
    ): AnalysisSignal | null {
        try {
            // Determine signal type based on opportunity
            const signalType = this.determineSignalType(opportunity, analysisResult);
            if (!signalType || !this.isSignalTypeEnabled(signalType)) {
                return null;
            }
            
            // Calculate signal strength
            const strength = this.calculateSignalStrength(opportunity, analysisResult);
            
            // Calculate confidence (combination of opportunity confidence and analysis confidence)
            const confidence = Math.min(1, (opportunity.confidence + analysisResult.confidence) / 2);
            
            // Check minimum thresholds
            if (confidence < this.config.minConfidence || strength < this.config.minStrength) {
                return null;
            }
            
            // Calculate risk score
            const riskScore = this.calculateSignalRiskScore(opportunity, analysisResult, tradingMode);
            
            // Check risk threshold
            if (riskScore > this.config.maxRiskScore) {
                return null;
            }
            
            // Calculate recommended parameters
            const { stake, duration, barrier, prediction } = this.calculateTradingParameters(
                opportunity, analysisResult, riskScore, tradingMode
            );
            
            // Determine timing
            const validFrom = Date.now();
            const validUntil = Math.min(
                validFrom + this.config.maxSignalAge,
                opportunity.windowEnd
            );
            
            // Create signal
            const signal: AnalysisSignal = {
                id: `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
                
                analysisId: analysisResult.id,
                opportunityId: opportunity.id,
                
                type: signalType,
                symbol: analysisResult.symbol,
                confidence,
                strength,
                
                recommendedStake: stake,
                recommendedDuration: duration,
                barrier,
                prediction,
                
                riskScore,
                riskFactors: this.identifySignalRiskFactors(opportunity, analysisResult),
                
                validFrom,
                validUntil,
                urgency: this.determineUrgency(opportunity, strength, confidence),
                
                currentPrice: opportunity.currentPrice,
                expectedPrice: opportunity.predictedPrice,
                priceTarget: this.calculatePriceTarget(opportunity, signalType),
                stopLoss: this.calculateStopLoss(opportunity, riskScore),
                
                isValid: true,
                validationScore: confidence,
                
                source: this.mapOpportunityTypeToSource(opportunity.type),
                priority: opportunity.priority,
                tags: this.generateSignalTags(opportunity, analysisResult),
                notes: this.generateSignalNotes(opportunity, analysisResult),
            };
            
            return signal;
            
        } catch (error) {
            console.error('🦈 Failed to create signal from opportunity:', error);
            return null;
        }
    }

    private determineSignalType(opportunity: ArbitrageOpportunity, analysisResult: AnalysisResult): IntentType | null {
        // Determine the best signal type based on opportunity characteristics
        const priceChange = opportunity.predictedPrice - opportunity.currentPrice;
        const priceChangePercent = priceChange / opportunity.currentPrice;
        
        // For latency arbitrage, use direction-based signals
        if (opportunity.type === 'LATENCY_ARBITRAGE') {
            if (Math.abs(priceChangePercent) > 0.001) {
                return 'RISE_FALL'; // Clear directional movement
            } else {
                return 'HIGHER_LOWER'; // Smaller movements
            }
        }
        
        // For spread arbitrage, use range-based signals
        if (opportunity.type === 'SPREAD_ARBITRAGE') {
            return 'HIGHER_LOWER';
        }
        
        // For price discrepancy, use pattern-based signals
        if (opportunity.type === 'PRICE_DISCREPANCY') {
            const currentDigit = Math.floor((opportunity.currentPrice * 10000) % 10);
            if (currentDigit % 2 === 0) {
                return 'EVEN_ODD';
            } else {
                return 'MATCHES_DIFFERS';
            }
        }
        
        // Default to RISE_FALL
        return 'RISE_FALL';
    }

    private isSignalTypeEnabled(signalType: IntentType): boolean {
        switch (signalType) {
            case 'RISE_FALL': return this.config.enableRiseFall;
            case 'HIGHER_LOWER': return this.config.enableHigherLower;
            case 'MATCHES_DIFFERS': return this.config.enableMatchesDiffers;
            case 'EVEN_ODD': return this.config.enableEvenOdd;
            case 'OVER_UNDER': return this.config.enableOverUnder;
            default: return false;
        }
    }

    private calculateSignalStrength(opportunity: ArbitrageOpportunity, analysisResult: AnalysisResult): number {
        // Combine multiple factors to determine signal strength
        const opportunityStrength = opportunity.confidence * (1 - opportunity.riskScore);
        const marketStrength = analysisResult.marketCondition.stability * analysisResult.marketCondition.predictability;
        const latencyStrength = analysisResult.latencyMetrics.stability * analysisResult.latencyMetrics.reliability;
        
        return Math.min(1, (opportunityStrength * 0.5 + marketStrength * 0.3 + latencyStrength * 0.2));
    }

    private calculateSignalRiskScore(
        opportunity: ArbitrageOpportunity, 
        analysisResult: AnalysisResult, 
        tradingMode?: TradingMode
    ): number {
        let baseRisk = opportunity.riskScore;
        
        // Adjust for market conditions
        const marketRisk = analysisResult.overallRisk;
        
        // Adjust for trading mode
        let modeRiskMultiplier = 1.0;
        if (tradingMode === 'FULLY_AUTOMATED') {
            modeRiskMultiplier = 1.2; // Higher risk in full auto
        } else if (tradingMode === 'MANUAL_OBSERVATION') {
            modeRiskMultiplier = 0.8; // Lower risk in manual mode
        }
        
        // Apply risk adjustment from config
        const adjustedRisk = baseRisk * this.config.riskAdjustment * modeRiskMultiplier;
        
        // Combine with market risk
        return Math.min(1, (adjustedRisk + marketRisk) / 2);
    }

    private calculateTradingParameters(
        opportunity: ArbitrageOpportunity, 
        analysisResult: AnalysisResult, 
        riskScore: number,
        tradingMode?: TradingMode
    ): { stake: number; duration: number; barrier?: number; prediction?: number } {
        // Calculate stake based on risk and confidence
        const baseStake = this.config.maxStakePerSignal;
        const riskAdjustedStake = baseStake * (1 - riskScore) * opportunity.confidence;
        const stake = Math.max(1, Math.min(baseStake, riskAdjustedStake));
        
        // Calculate duration based on opportunity window
        const opportunityDuration = opportunity.windowEnd - opportunity.windowStart;
        const duration = Math.max(1, Math.min(300, Math.floor(opportunityDuration / 1000))); // 1-300 seconds
        
        // Calculate barrier for barrier options
        let barrier: number | undefined;
        if (['HIGHER_LOWER', 'OVER_UNDER'].includes(opportunity.type as any)) {
            barrier = opportunity.currentPrice + (opportunity.priceDeviation * 0.5);
        }
        
        // Calculate prediction for digit options
        let prediction: number | undefined;
        if (['MATCHES_DIFFERS', 'EVEN_ODD'].includes(opportunity.type as any)) {
            const currentDigit = Math.floor((opportunity.currentPrice * 10000) % 10);
            prediction = currentDigit;
        }
        
        return { stake, duration, barrier, prediction };
    }

    private determineUrgency(opportunity: ArbitrageOpportunity, strength: number, confidence: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
        const urgencyScore = (strength + confidence + (1 - opportunity.riskScore)) / 3;
        
        if (urgencyScore > 0.8) return 'CRITICAL';
        if (urgencyScore > 0.6) return 'HIGH';
        if (urgencyScore > 0.4) return 'MEDIUM';
        return 'LOW';
    }

    private calculatePriceTarget(opportunity: ArbitrageOpportunity, signalType: IntentType): number | undefined {
        if (['RISE_FALL', 'HIGHER_LOWER'].includes(signalType)) {
            return opportunity.predictedPrice;
        }
        return undefined;
    }

    private calculateStopLoss(opportunity: ArbitrageOpportunity, riskScore: number): number | undefined {
        // Calculate stop loss based on risk score and price deviation
        const stopLossDistance = opportunity.priceDeviation * riskScore * 2;
        const direction = opportunity.predictedPrice > opportunity.currentPrice ? -1 : 1;
        return opportunity.currentPrice + (stopLossDistance * direction);
    }

    private identifySignalRiskFactors(opportunity: ArbitrageOpportunity, analysisResult: AnalysisResult): string[] {
        const factors: string[] = [];
        
        if (opportunity.riskScore > 0.7) factors.push('HIGH_OPPORTUNITY_RISK');
        if (analysisResult.overallRisk > 0.7) factors.push('HIGH_MARKET_RISK');
        if (analysisResult.latencyMetrics.jitter > 20) factors.push('HIGH_LATENCY_JITTER');
        if (analysisResult.marketCondition.volatility > 0.02) factors.push('HIGH_VOLATILITY');
        if (analysisResult.marketCondition.liquidity < 1000) factors.push('LOW_LIQUIDITY');
        if (opportunity.duration < 3000) factors.push('SHORT_WINDOW');
        
        return factors;
    }

    private mapOpportunityTypeToSource(opportunityType: string): 'LATENCY_ARBITRAGE' | 'SPREAD_ARBITRAGE' | 'PATTERN_DETECTION' | 'ML_MODEL' {
        switch (opportunityType) {
            case 'LATENCY_ARBITRAGE': return 'LATENCY_ARBITRAGE';
            case 'SPREAD_ARBITRAGE': return 'SPREAD_ARBITRAGE';
            case 'PRICE_DISCREPANCY': return 'PATTERN_DETECTION';
            default: return 'PATTERN_DETECTION';
        }
    }

    private generateSignalTags(opportunity: ArbitrageOpportunity, analysisResult: AnalysisResult): string[] {
        const tags: string[] = [];
        
        tags.push(opportunity.type.toLowerCase());
        tags.push(opportunity.priority.toLowerCase());
        tags.push(`confidence_${Math.floor(opportunity.confidence * 10)}`);
        tags.push(`risk_${Math.floor(opportunity.riskScore * 10)}`);
        
        if (analysisResult.marketCondition.volatility > 0.02) tags.push('high_volatility');
        if (analysisResult.latencyMetrics.networkLatency < 50) tags.push('low_latency');
        
        return tags;
    }

    private generateSignalNotes(opportunity: ArbitrageOpportunity, analysisResult: AnalysisResult): string {
        const notes: string[] = [];
        
        notes.push(`${opportunity.type} opportunity detected`);
        notes.push(`Expected profit: ${(opportunity.expectedProfit * 100).toFixed(2)}%`);
        notes.push(`Confidence: ${(opportunity.confidence * 100).toFixed(1)}%`);
        notes.push(`Risk score: ${(opportunity.riskScore * 100).toFixed(1)}%`);
        
        if (opportunity.latencyAdvantage > 0) {
            notes.push(`Latency advantage: ${opportunity.latencyAdvantage.toFixed(1)}ms`);
        }
        
        return notes.join(' | ');
    }

    private validateSignal(signal: AnalysisSignal): boolean {
        // Basic validation
        if (!signal.id || !signal.symbol || signal.confidence <= 0) {
            return false;
        }
        
        // Timing validation
        if (signal.validUntil <= signal.validFrom) {
            return false;
        }
        
        // Parameter validation
        if (signal.recommendedStake <= 0 || signal.recommendedDuration <= 0) {
            return false;
        }
        
        // Risk validation
        if (this.config.enableRiskFilter && signal.riskScore > this.config.maxRiskScore) {
            return false;
        }
        
        return true;
    }

    private applySignalFilters(signals: AnalysisSignal[]): AnalysisSignal[] {
        let filtered = [...signals];
        
        // Quality filter
        if (this.config.enableQualityFilter) {
            filtered = filtered.filter(signal => 
                signal.confidence >= this.config.minConfidence &&
                signal.strength >= this.config.minStrength
            );
        }
        
        // Duplicate filter
        if (this.config.enableDuplicateFilter) {
            filtered = this.removeDuplicateSignals(filtered);
        }
        
        // Risk filter
        if (this.config.enableRiskFilter) {
            filtered = filtered.filter(signal => signal.riskScore <= this.config.maxRiskScore);
        }
        
        return filtered;
    }

    private removeDuplicateSignals(signals: AnalysisSignal[]): AnalysisSignal[] {
        const unique = new Map<string, AnalysisSignal>();
        
        for (const signal of signals) {
            const key = `${signal.symbol}-${signal.type}-${Math.floor(signal.currentPrice * 1000)}`;
            
            if (!unique.has(key) || signal.confidence > unique.get(key)!.confidence) {
                unique.set(key, signal);
            }
        }
        
        return Array.from(unique.values());
    }

    private updateSignalTracking(signals: AnalysisSignal[]): void {
        // Add to recent signals
        this.recentSignals.unshift(...signals);
        
        // Trim recent signals (keep last 50)
        if (this.recentSignals.length > 50) {
            this.recentSignals = this.recentSignals.slice(0, 50);
        }
        
        // Add to history
        this.signalHistory.unshift(...signals);
        
        // Trim history (keep last 1000)
        if (this.signalHistory.length > 1000) {
            this.signalHistory = this.signalHistory.slice(0, 1000);
        }
        
        // Remove expired signals
        const now = Date.now();
        this.recentSignals = this.recentSignals.filter(signal => signal.validUntil > now);
    }

    private updateStatistics(allSignals: AnalysisSignal[], filteredSignals: AnalysisSignal[]): void {
        this.statistics.totalSignalsGenerated += allSignals.length;
        
        if (filteredSignals.length > 0) {
            this.statistics.averageConfidence = (this.statistics.averageConfidence + 
                filteredSignals.reduce((sum, s) => sum + s.confidence, 0) / filteredSignals.length) / 2;
            
            this.statistics.averageStrength = (this.statistics.averageStrength + 
                filteredSignals.reduce((sum, s) => sum + s.strength, 0) / filteredSignals.length) / 2;
            
            this.statistics.averageRiskScore = (this.statistics.averageRiskScore + 
                filteredSignals.reduce((sum, s) => sum + s.riskScore, 0) / filteredSignals.length) / 2;
        }
        
        // Count signal types
        for (const signal of filteredSignals) {
            switch (signal.type) {
                case 'RISE_FALL': this.statistics.riseFallSignals++; break;
                case 'HIGHER_LOWER': this.statistics.higherLowerSignals++; break;
                case 'MATCHES_DIFFERS': this.statistics.matchesDiffersSignals++; break;
                case 'EVEN_ODD': this.statistics.evenOddSignals++; break;
                case 'OVER_UNDER': this.statistics.overUnderSignals++; break;
            }
        }
        
        this.statistics.filteredSignals += (allSignals.length - filteredSignals.length);
        
        // Calculate signals per hour
        const hoursRunning = (Date.now() - (this.statistics.totalSignalsGenerated > 0 ? 
            this.signalHistory[this.signalHistory.length - 1]?.timestamp || Date.now() : Date.now())) / (1000 * 60 * 60);
        this.statistics.signalsPerHour = hoursRunning > 0 ? this.statistics.totalSignalsGenerated / hoursRunning : 0;
    }

    private initializeStatistics(): SignalStatistics {
        return {
            totalSignalsGenerated: 0,
            signalsPerHour: 0,
            averageConfidence: 0,
            averageStrength: 0,
            
            riseFallSignals: 0,
            higherLowerSignals: 0,
            matchesDiffersSignals: 0,
            evenOddSignals: 0,
            overUnderSignals: 0,
            
            signalsActioned: 0,
            successfulSignals: 0,
            failedSignals: 0,
            successRate: 0,
            
            averageRiskScore: 0,
            highRiskSignals: 0,
            riskViolations: 0,
            
            averageValidationScore: 0,
            filteredSignals: 0,
            duplicateSignals: 0,
        };
    }
}

// Export singleton instance
export const signalGeneratorService = new SignalGeneratorService();