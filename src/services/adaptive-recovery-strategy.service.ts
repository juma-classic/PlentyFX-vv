/**
 * Adaptive Recovery Strategy Service
 * Calculates prediction before/after loss values based on signal barriers
 * Implements progressive recovery strategy for OVER/UNDER signals
 */

export interface AdaptiveRecoveryConfig {
    predictionBeforeLoss: number;
    predictionAfterLoss: number;
    strategy: 'CONSERVATIVE_TO_AGGRESSIVE' | 'AGGRESSIVE_TO_CONSERVATIVE';
    reasoning: string;
}

export interface SignalBarrierInfo {
    signalType: 'OVER' | 'UNDER';
    barrier: number;
    contractType: 'DIGITOVER' | 'DIGITUNDER';
}

class AdaptiveRecoveryStrategyService {
    /**
     * Calculate adaptive recovery configuration for OVER/UNDER signals
     * Handles barrier adjustment scenarios (e.g., OVER4 with entry digit 4)
     */
    public calculateRecoveryStrategy(
        signalPrediction: string,
        barrier: number,
        strategy: 'CONSERVATIVE_TO_AGGRESSIVE' | 'AGGRESSIVE_TO_CONSERVATIVE' = 'CONSERVATIVE_TO_AGGRESSIVE',
        entryDigit?: number,
        originalBarrier?: number
    ): AdaptiveRecoveryConfig {
        const signalType = signalPrediction.includes('OVER') ? 'OVER' : 'UNDER';

        let predictionBeforeLoss: number;
        let predictionAfterLoss: number;
        let reasoning: string;

        // Check if this is a barrier-adjusted scenario (entry digit equals original barrier)
        const isBarrierAdjusted = originalBarrier !== undefined && entryDigit === originalBarrier;

        if (strategy === 'CONSERVATIVE_TO_AGGRESSIVE') {
            // Start conservative (at barrier), then get aggressive (step away from barrier)
            if (signalType === 'OVER') {
                predictionBeforeLoss = barrier; // Conservative: exactly at adjusted barrier

                if (isBarrierAdjusted) {
                    // For barrier-adjusted OVER signals, step down for recovery (more conservative)
                    predictionAfterLoss = Math.max(barrier - 1, 0);
                    reasoning = `OVER${originalBarrier}→OVER${barrier} (entry digit ${entryDigit}): Start at ${barrier} (60%), recover at ${predictionAfterLoss} (70%)`;
                } else {
                    // Normal OVER signals: Forward recovery for barriers < 4, backward for barriers >= 4
                    if (barrier < 4) {
                        // OVER0, OVER1, OVER2, OVER3 → step forward (more aggressive)
                        predictionAfterLoss = Math.min(barrier + 1, 9);
                        reasoning = `OVER${barrier}: Start at barrier ${barrier}, forward recovery to ${predictionAfterLoss} after loss (more aggressive)`;
                    } else {
                        // OVER4, OVER5, OVER6, OVER7, OVER8, OVER9 → step backward (more conservative)
                        predictionAfterLoss = Math.max(barrier - 1, 0);
                        reasoning = `OVER${barrier}: Start at barrier ${barrier}, backward recovery to ${predictionAfterLoss} after loss (more conservative)`;
                    }
                }
            } else {
                predictionBeforeLoss = barrier; // Conservative: exactly at adjusted barrier

                if (isBarrierAdjusted) {
                    // For barrier-adjusted UNDER signals, step up for recovery (more conservative)
                    predictionAfterLoss = Math.min(barrier + 1, 9);
                    reasoning = `UNDER${originalBarrier}→UNDER${barrier} (entry digit ${entryDigit}): Start at ${barrier}, recover at ${predictionAfterLoss}`;
                } else {
                    // Normal UNDER signals: Forward recovery for barriers > 5, backward for barriers <= 5
                    if (barrier > 5) {
                        // UNDER6, UNDER7, UNDER8, UNDER9 → step forward (more aggressive)
                        predictionAfterLoss = Math.max(barrier - 1, 0);
                        reasoning = `UNDER${barrier}: Start at barrier ${barrier}, forward recovery to ${predictionAfterLoss} after loss (more aggressive)`;
                    } else {
                        // UNDER0, UNDER1, UNDER2, UNDER3, UNDER4, UNDER5 → step backward (more conservative)
                        predictionAfterLoss = Math.min(barrier + 1, 9);
                        reasoning = `UNDER${barrier}: Start at barrier ${barrier}, backward recovery to ${predictionAfterLoss} after loss (more conservative)`;
                    }
                }
            }
        } else {
            // Start aggressive (step away from barrier), then get conservative (at barrier)
            if (signalType === 'OVER') {
                if (isBarrierAdjusted) {
                    // For barrier-adjusted OVER signals, start more conservative, fallback to barrier
                    predictionBeforeLoss = Math.max(barrier - 1, 0);
                    predictionAfterLoss = barrier;
                    reasoning = `OVER${originalBarrier}→OVER${barrier} (entry digit ${entryDigit}): Start conservative at ${predictionBeforeLoss}, fallback to ${barrier}`;
                } else {
                    // Normal OVER signals: Forward recovery for barriers < 4, backward for barriers >= 4
                    if (barrier < 4) {
                        predictionBeforeLoss = Math.min(barrier + 1, 9); // Start aggressive (forward)
                        predictionAfterLoss = barrier; // Fallback to barrier
                        reasoning = `OVER${barrier}: Start forward at ${predictionBeforeLoss}, fallback to barrier ${barrier}`;
                    } else {
                        predictionBeforeLoss = Math.max(barrier - 1, 0); // Start aggressive (backward)
                        predictionAfterLoss = barrier; // Fallback to barrier
                        reasoning = `OVER${barrier}: Start backward at ${predictionBeforeLoss}, fallback to barrier ${barrier}`;
                    }
                }
            } else {
                if (isBarrierAdjusted) {
                    // For barrier-adjusted UNDER signals, start more conservative, fallback to barrier
                    predictionBeforeLoss = Math.min(barrier + 1, 9);
                    predictionAfterLoss = barrier;
                    reasoning = `UNDER${originalBarrier}→UNDER${barrier} (entry digit ${entryDigit}): Start conservative at ${predictionBeforeLoss}, fallback to ${barrier}`;
                } else {
                    // Normal UNDER signals: Forward recovery for barriers > 5, backward for barriers <= 5
                    if (barrier > 5) {
                        predictionBeforeLoss = Math.max(barrier - 1, 0); // Start aggressive (forward)
                        predictionAfterLoss = barrier; // Fallback to barrier
                        reasoning = `UNDER${barrier}: Start forward at ${predictionBeforeLoss}, fallback to barrier ${barrier}`;
                    } else {
                        predictionBeforeLoss = Math.min(barrier + 1, 9); // Start aggressive (backward)
                        predictionAfterLoss = barrier; // Fallback to barrier
                        reasoning = `UNDER${barrier}: Start backward at ${predictionBeforeLoss}, fallback to barrier ${barrier}`;
                    }
                }
            }
        }

        return {
            predictionBeforeLoss,
            predictionAfterLoss,
            strategy,
            reasoning,
        };
    }

    /**
     * Get optimal strategy based on signal confidence and market conditions
     */
    public getOptimalStrategy(
        confidence: number,
        signalStrength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG',
        marketVolatility: number = 0.5
    ): 'CONSERVATIVE_TO_AGGRESSIVE' | 'AGGRESSIVE_TO_CONSERVATIVE' {
        // High confidence signals: Start conservative, escalate if needed
        if (confidence >= 80 || signalStrength === 'VERY_STRONG') {
            return 'CONSERVATIVE_TO_AGGRESSIVE';
        }

        // Medium confidence with high volatility: Start aggressive, fallback if needed
        if (confidence >= 65 && marketVolatility > 0.7) {
            return 'AGGRESSIVE_TO_CONSERVATIVE';
        }

        // Default: Conservative to aggressive approach
        return 'CONSERVATIVE_TO_AGGRESSIVE';
    }

    /**
     * Calculate prediction values for specific signal examples
     */
    public getSignalPredictions(signalPrediction: string): AdaptiveRecoveryConfig | null {
        // Extract barrier from signal prediction (e.g., "OVER3" -> 3, "UNDER5" -> 5)
        const barrierMatch = signalPrediction.match(/(?:OVER|UNDER)\s*(\d+)/i);
        if (!barrierMatch) {
            console.warn('Could not extract barrier from signal:', signalPrediction);
            return null;
        }

        const barrier = parseInt(barrierMatch[1]);

        // Use conservative to aggressive strategy by default
        return this.calculateRecoveryStrategy(signalPrediction, barrier, 'CONSERVATIVE_TO_AGGRESSIVE');
    }

    /**
     * Validate prediction values are within valid digit range (0-9)
     */
    public validatePredictions(config: AdaptiveRecoveryConfig): boolean {
        const { predictionBeforeLoss, predictionAfterLoss } = config;

        const isValid =
            predictionBeforeLoss >= 0 &&
            predictionBeforeLoss <= 9 &&
            predictionAfterLoss >= 0 &&
            predictionAfterLoss <= 9;

        if (!isValid) {
            console.error('Invalid prediction values:', config);
        }

        return isValid;
    }

    /**
     * Get explanation for the recovery strategy
     */
    public getStrategyExplanation(config: AdaptiveRecoveryConfig): string {
        const { predictionBeforeLoss, predictionAfterLoss, strategy } = config;

        if (strategy === 'CONSERVATIVE_TO_AGGRESSIVE') {
            return `Start with conservative prediction ${predictionBeforeLoss}, then escalate to aggressive ${predictionAfterLoss} after loss. This maximizes initial win probability while providing recovery potential.`;
        } else {
            return `Start with aggressive prediction ${predictionBeforeLoss}, then fallback to conservative ${predictionAfterLoss} after loss. This maximizes profit potential while providing safety net.`;
        }
    }

    /**
     * Calculate win probabilities for each prediction
     */
    public calculateWinProbabilities(
        signalPrediction: string,
        predictionBeforeLoss: number,
        predictionAfterLoss: number
    ): { beforeLoss: number; afterLoss: number } {
        const signalType = signalPrediction.includes('OVER') ? 'OVER' : 'UNDER';

        let beforeLossProb: number;
        let afterLossProb: number;

        if (signalType === 'OVER') {
            // OVER signals: win when digit > prediction
            beforeLossProb = (9 - predictionBeforeLoss) / 10;
            afterLossProb = (9 - predictionAfterLoss) / 10;
        } else {
            // UNDER signals: win when digit < prediction
            beforeLossProb = predictionBeforeLoss / 10;
            afterLossProb = predictionAfterLoss / 10;
        }

        return {
            beforeLoss: Math.round(beforeLossProb * 100),
            afterLoss: Math.round(afterLossProb * 100),
        };
    }

    /**
     * Generate comprehensive recovery configuration with all details
     * Supports barrier adjustment scenarios
     */
    public generateComprehensiveConfig(
        signalPrediction: string,
        confidence: number = 75,
        signalStrength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG' = 'MODERATE',
        entryDigit?: number,
        originalBarrier?: number
    ):
        | (AdaptiveRecoveryConfig & {
              winProbabilities: { beforeLoss: number; afterLoss: number };
              explanation: string;
              isValid: boolean;
          })
        | null {
        // Extract barrier from signal prediction (e.g., "OVER3" -> 3, "UNDER5" -> 5)
        const barrierMatch = signalPrediction.match(/(?:OVER|UNDER)\s*(\d+)/i);
        if (!barrierMatch) {
            console.warn('Could not extract barrier from signal:', signalPrediction);
            return null;
        }

        const barrier = parseInt(barrierMatch[1]);
        const strategy = this.getOptimalStrategy(confidence, signalStrength);

        const baseConfig = this.calculateRecoveryStrategy(
            signalPrediction,
            barrier,
            strategy,
            entryDigit,
            originalBarrier
        );

        const winProbabilities = this.calculateWinProbabilities(
            signalPrediction,
            baseConfig.predictionBeforeLoss,
            baseConfig.predictionAfterLoss
        );

        const explanation = this.getStrategyExplanation(baseConfig);
        const isValid = this.validatePredictions(baseConfig);

        return {
            ...baseConfig,
            winProbabilities,
            explanation,
            isValid,
        };
    }

    /**
     * Get recovery configuration for bot loading
     */
    public getRecoveryConfigForBot(signal: any): {
        useAdaptiveRecovery: boolean;
        recoveryBarrier?: number;
        recoveryPrediction?: number;
        recoveryReasoning?: string;
    } {
        // Check if signal supports adaptive recovery (OVER/UNDER signals)
        if (!signal.prediction || !signal.prediction.match(/(?:OVER|UNDER)\s*(\d+)/i)) {
            return {
                useAdaptiveRecovery: false,
                recoveryReasoning: 'Adaptive recovery not applicable for this signal type',
            };
        }

        const comprehensiveConfig = this.generateComprehensiveConfig(
            signal.prediction,
            signal.confidence,
            signal.strength
        );

        if (!comprehensiveConfig || !comprehensiveConfig.isValid) {
            return {
                useAdaptiveRecovery: false,
                recoveryReasoning: 'Could not generate valid recovery configuration',
            };
        }

        // Extract barrier from signal
        const barrierMatch = signal.prediction.match(/(?:OVER|UNDER)\s*(\d+)/i);
        const barrier = barrierMatch ? parseInt(barrierMatch[1]) : undefined;

        return {
            useAdaptiveRecovery: true,
            recoveryBarrier: barrier,
            recoveryPrediction: comprehensiveConfig.predictionAfterLoss,
            recoveryReasoning: comprehensiveConfig.reasoning,
        };
    }
}

export const adaptiveRecoveryStrategy = new AdaptiveRecoveryStrategyService();
