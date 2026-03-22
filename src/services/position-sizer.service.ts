/**
 * Position Sizer Service
 * Calculates optimal trade sizes based on Kelly Criterion and risk management
 */

export interface PositionSizeConfig {
    accountBalance: number;
    maxRiskPerTrade: number; // Percentage (e.g., 2 = 2%)
    minStake: number;
    maxStake: number;
    useKellyCriterion: boolean;
    kellyFraction: number; // Fraction of Kelly to use (e.g., 0.5 = half Kelly)
}

export interface PositionSizeResult {
    recommendedStake: number;
    riskAmount: number;
    riskPercentage: number;
    kellyPercentage?: number;
    reasoning: string;
    warnings: string[];
}

class PositionSizerService {
    private config: PositionSizeConfig = {
        accountBalance: 100,
        maxRiskPerTrade: 2,
        minStake: 0.35,
        maxStake: 100,
        useKellyCriterion: true,
        kellyFraction: 0.5, // Half Kelly for safety
    };

    /**
     * Update configuration
     */
    public updateConfig(updates: Partial<PositionSizeConfig>): void {
        this.config = { ...this.config, ...updates };
        this.saveConfig();
    }

    /**
     * Get current configuration
     */
    public getConfig(): PositionSizeConfig {
        return { ...this.config };
    }

    /**
     * Calculate optimal position size
     */
    public calculatePositionSize(
        confidence: number,
        winRate?: number,
        payoutRatio?: number
    ): PositionSizeResult {
        const warnings: string[] = [];
        let recommendedStake: number;
        let kellyPercentage: number | undefined;

        // Use Kelly Criterion if enabled and we have win rate data
        if (this.config.useKellyCriterion && winRate !== undefined && payoutRatio !== undefined) {
            kellyPercentage = this.calculateKelly(winRate, payoutRatio);
            const kellyStake = this.config.accountBalance * (kellyPercentage / 100);
            const fractionalKelly = kellyStake * this.config.kellyFraction;

            recommendedStake = fractionalKelly;

            if (kellyPercentage < 0) {
                warnings.push('Kelly Criterion suggests no trade (negative edge)');
                recommendedStake = this.config.minStake;
            }
        } else {
            // Use confidence-based sizing
            recommendedStake = this.calculateConfidenceBasedSize(confidence);
        }

        // Apply risk limits
        const maxRiskAmount = (this.config.accountBalance * this.config.maxRiskPerTrade) / 100;
        if (recommendedStake > maxRiskAmount) {
            recommendedStake = maxRiskAmount;
            warnings.push(`Stake limited by max risk per trade (${this.config.maxRiskPerTrade}%)`);
        }

        // Apply min/max stake limits
        if (recommendedStake < this.config.minStake) {
            recommendedStake = this.config.minStake;
            warnings.push(`Stake increased to minimum (${this.config.minStake})`);
        }

        if (recommendedStake > this.config.maxStake) {
            recommendedStake = this.config.maxStake;
            warnings.push(`Stake limited to maximum (${this.config.maxStake})`);
        }

        // Round to 2 decimal places
        recommendedStake = Math.round(recommendedStake * 100) / 100;

        const riskAmount = recommendedStake;
        const riskPercentage = (riskAmount / this.config.accountBalance) * 100;

        // Generate reasoning
        const reasoning = this.generateReasoning(
            confidence,
            recommendedStake,
            riskPercentage,
            kellyPercentage
        );

        return {
            recommendedStake,
            riskAmount,
            riskPercentage,
            kellyPercentage,
            reasoning,
            warnings,
        };
    }

    /**
     * Calculate Kelly Criterion percentage
     * Formula: K% = W - [(1 - W) / R]
     * Where: W = win rate, R = win/loss ratio (payout ratio)
     */
    private calculateKelly(winRate: number, payoutRatio: number): number {
        // Convert win rate to decimal if it's a percentage
        const w = winRate > 1 ? winRate / 100 : winRate;

        // Kelly formula
        const kelly = w - (1 - w) / payoutRatio;

        // Convert to percentage
        return kelly * 100;
    }

    /**
     * Calculate position size based on confidence
     */
    private calculateConfidenceBasedSize(confidence: number): number {
        // Scale stake based on confidence
        // 50% confidence = min stake
        // 95% confidence = max risk amount

        const normalizedConfidence = Math.max(0, Math.min(100, confidence));

        // Map confidence (50-95) to stake multiplier (0.2-1.0)
        const minConfidence = 50;
        const maxConfidence = 95;
        const minMultiplier = 0.2;
        const maxMultiplier = 1.0;

        let multiplier: number;
        if (normalizedConfidence < minConfidence) {
            multiplier = minMultiplier;
        } else if (normalizedConfidence > maxConfidence) {
            multiplier = maxMultiplier;
        } else {
            const range = maxConfidence - minConfidence;
            const position = normalizedConfidence - minConfidence;
            multiplier = minMultiplier + (position / range) * (maxMultiplier - minMultiplier);
        }

        const maxRiskAmount = (this.config.accountBalance * this.config.maxRiskPerTrade) / 100;
        return maxRiskAmount * multiplier;
    }

    /**
     * Generate reasoning text
     */
    private generateReasoning(
        confidence: number,
        stake: number,
        riskPercentage: number,
        kellyPercentage?: number
    ): string {
        let reasoning = `Recommended stake: $${stake} (${riskPercentage.toFixed(2)}% of balance). `;

        if (kellyPercentage !== undefined) {
            reasoning += `Kelly Criterion: ${kellyPercentage.toFixed(2)}% (using ${this.config.kellyFraction * 100}% Kelly). `;
        } else {
            reasoning += `Based on ${confidence}% confidence. `;
        }

        if (riskPercentage <= 1) {
            reasoning += 'Conservative risk level.';
        } else if (riskPercentage <= 2) {
            reasoning += 'Moderate risk level.';
        } else {
            reasoning += 'Aggressive risk level.';
        }

        return reasoning;
    }

    /**
     * Calculate position size for multiple trades
     */
    public calculateBatchPositionSizes(
        trades: Array<{ confidence: number; winRate?: number; payoutRatio?: number }>
    ): PositionSizeResult[] {
        return trades.map(trade =>
            this.calculatePositionSize(trade.confidence, trade.winRate, trade.payoutRatio)
        );
    }

    /**
     * Get risk summary for account
     */
    public getRiskSummary(currentExposure: number): {
        accountBalance: number;
        currentExposure: number;
        exposurePercentage: number;
        remainingCapacity: number;
        maxRiskPerTrade: number;
        status: 'SAFE' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    } {
        const exposurePercentage = (currentExposure / this.config.accountBalance) * 100;

        let status: 'SAFE' | 'MODERATE' | 'HIGH' | 'CRITICAL';
        if (exposurePercentage < 5) status = 'SAFE';
        else if (exposurePercentage < 10) status = 'MODERATE';
        else if (exposurePercentage < 20) status = 'HIGH';
        else status = 'CRITICAL';

        return {
            accountBalance: this.config.accountBalance,
            currentExposure,
            exposurePercentage,
            remainingCapacity: this.config.accountBalance - currentExposure,
            maxRiskPerTrade: this.config.maxRiskPerTrade,
            status,
        };
    }

    /**
     * Save configuration to localStorage
     */
    private saveConfig(): void {
        try {
            localStorage.setItem('positionSizeConfig', JSON.stringify(this.config));
        } catch (e) {
            console.warn('Failed to save position size config:', e);
        }
    }

    /**
     * Load configuration from localStorage
     */
    public loadConfig(): void {
        try {
            const stored = localStorage.getItem('positionSizeConfig');
            if (stored) {
                this.config = { ...this.config, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.warn('Failed to load position size config:', e);
        }
    }
}

export const positionSizer = new PositionSizerService();
