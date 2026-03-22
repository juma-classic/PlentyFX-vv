/**
 * Tick Data Validator
 * Validates that tick data is authentic and matches real Deriv data
 */

interface TickValidationResult {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
    tickSample: any;
}

export class TickDataValidator {
    private static instance: TickDataValidator;
    private tickSamples: any[] = [];
    private validationResults: TickValidationResult[] = [];

    public static getInstance(): TickDataValidator {
        if (!TickDataValidator.instance) {
            TickDataValidator.instance = new TickDataValidator();
        }
        return TickDataValidator.instance;
    }

    /**
     * Validate incoming tick data
     */
    public validateTick(tickData: any, symbol: string): TickValidationResult {
        const issues: string[] = [];
        const recommendations: string[] = [];
        
        // Store sample for analysis
        this.tickSamples.push({
            timestamp: Date.now(),
            symbol,
            data: tickData,
            rawData: JSON.stringify(tickData)
        });

        // Keep only last 100 samples
        if (this.tickSamples.length > 100) {
            this.tickSamples = this.tickSamples.slice(-100);
        }

        // Validate tick structure
        if (!tickData) {
            issues.push('Tick data is null or undefined');
            recommendations.push('Check WebSocket connection status');
        }

        if (typeof tickData !== 'object') {
            issues.push('Tick data is not an object');
            recommendations.push('Verify API response format');
        }

        // Check for required fields
        const hasTickField = 'tick' in tickData;
        const hasQuoteField = tickData.tick && 'quote' in tickData.tick;
        const hasDirectQuote = 'quote' in tickData;

        if (!hasTickField && !hasDirectQuote) {
            issues.push('Missing tick or quote field in response');
            recommendations.push('Check API subscription format');
        }

        // Extract quote value
        let quote: number | null = null;
        if (hasQuoteField) {
            quote = parseFloat(tickData.tick.quote);
        } else if (hasDirectQuote) {
            quote = parseFloat(tickData.quote);
        }

        if (quote === null || isNaN(quote)) {
            issues.push('Quote value is not a valid number');
            recommendations.push('Check quote field extraction logic');
        }

        // Validate quote range for different symbols
        if (quote !== null) {
            const quoteValidation = this.validateQuoteRange(quote, symbol);
            issues.push(...quoteValidation.issues);
            recommendations.push(...quoteValidation.recommendations);
        }

        // Check for timestamp
        const hasTimestamp = (tickData.tick && 'epoch' in tickData.tick) || 'epoch' in tickData;
        if (!hasTimestamp) {
            issues.push('Missing timestamp (epoch) in tick data');
            recommendations.push('Verify tick data includes epoch timestamp');
        }

        // Validate last digit extraction
        if (quote !== null) {
            const lastDigitValidation = this.validateLastDigitExtraction(quote);
            issues.push(...lastDigitValidation.issues);
            recommendations.push(...lastDigitValidation.recommendations);
        }

        const result: TickValidationResult = {
            isValid: issues.length === 0,
            issues,
            recommendations,
            tickSample: {
                symbol,
                quote,
                lastDigit: quote !== null ? this.extractLastDigit(quote) : null,
                timestamp: Date.now(),
                rawData: tickData
            }
        };

        this.validationResults.push(result);
        
        // Keep only last 50 validation results
        if (this.validationResults.length > 50) {
            this.validationResults = this.validationResults.slice(-50);
        }

        return result;
    }

    /**
     * Validate quote range for specific symbols
     */
    private validateQuoteRange(quote: number, symbol: string): { issues: string[], recommendations: string[] } {
        const issues: string[] = [];
        const recommendations: string[] = [];

        // Define expected ranges for different symbols
        const expectedRanges: Record<string, { min: number, max: number }> = {
            'R_10': { min: 0, max: 10000 },
            'R_25': { min: 0, max: 10000 },
            'R_50': { min: 0, max: 10000 },
            'R_75': { min: 0, max: 10000 },
            'R_100': { min: 0, max: 10000 },
            '1HZ10V': { min: 0, max: 10000 },
            '1HZ25V': { min: 0, max: 10000 },
            '1HZ50V': { min: 0, max: 10000 },
            '1HZ75V': { min: 0, max: 10000 },
            '1HZ100V': { min: 0, max: 10000 },
            'BOOM1000': { min: 0, max: 100000 },
            'BOOM500': { min: 0, max: 100000 },
            'CRASH1000': { min: 0, max: 100000 },
            'CRASH500': { min: 0, max: 100000 }
        };

        const range = expectedRanges[symbol];
        if (range) {
            if (quote < range.min || quote > range.max) {
                issues.push(`Quote ${quote} is outside expected range [${range.min}, ${range.max}] for ${symbol}`);
                recommendations.push(`Verify ${symbol} is providing real market data`);
            }
        }

        // Check for suspicious patterns
        if (quote === 0) {
            issues.push('Quote value is exactly 0, which may indicate no data');
            recommendations.push('Check if market is open and data is flowing');
        }

        // Check decimal places (Deriv typically has 2-5 decimal places)
        const decimalPlaces = (quote.toString().split('.')[1] || '').length;
        if (decimalPlaces === 0) {
            issues.push('Quote has no decimal places, which is unusual for Deriv data');
            recommendations.push('Verify quote precision and data source');
        }

        return { issues, recommendations };
    }

    /**
     * Validate last digit extraction logic
     */
    private validateLastDigitExtraction(quote: number): { issues: string[], recommendations: string[] } {
        const issues: string[] = [];
        const recommendations: string[] = [];

        // Test different extraction methods
        const method1 = Math.floor((quote * 100) % 10); // Current method
        const method2 = Math.floor((quote * 1000) % 10); // Alternative method
        const method3 = parseInt(quote.toFixed(2).replace('.', '').slice(-1)); // String-based method

        // Check if methods give different results
        if (method1 !== method2 || method1 !== method3) {
            issues.push(`Last digit extraction methods disagree: ${method1} vs ${method2} vs ${method3}`);
            recommendations.push('Review last digit extraction logic for accuracy');
        }

        // Validate digit is in valid range
        if (method1 < 0 || method1 > 9 || !Number.isInteger(method1)) {
            issues.push(`Extracted digit ${method1} is not a valid single digit (0-9)`);
            recommendations.push('Fix last digit extraction to ensure valid range');
        }

        return { issues, recommendations };
    }

    /**
     * Extract last digit using the current method
     */
    private extractLastDigit(quote: number): number {
        return Math.floor((quote * 100) % 10);
    }

    /**
     * Get validation summary
     */
    public getValidationSummary(): {
        totalTicks: number;
        validTicks: number;
        invalidTicks: number;
        commonIssues: string[];
        recentSamples: any[];
    } {
        const totalTicks = this.validationResults.length;
        const validTicks = this.validationResults.filter(r => r.isValid).length;
        const invalidTicks = totalTicks - validTicks;

        // Count common issues
        const issueCount: Record<string, number> = {};
        this.validationResults.forEach(result => {
            result.issues.forEach(issue => {
                issueCount[issue] = (issueCount[issue] || 0) + 1;
            });
        });

        const commonIssues = Object.entries(issueCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([issue, count]) => `${issue} (${count} times)`);

        return {
            totalTicks,
            validTicks,
            invalidTicks,
            commonIssues,
            recentSamples: this.tickSamples.slice(-10)
        };
    }

    /**
     * Generate diagnostic report
     */
    public generateDiagnosticReport(): string {
        const summary = this.getValidationSummary();
        
        let report = '🔍 TICK DATA VALIDATION REPORT\n';
        report += '================================\n\n';
        
        report += `📊 SUMMARY:\n`;
        report += `- Total ticks analyzed: ${summary.totalTicks}\n`;
        report += `- Valid ticks: ${summary.validTicks} (${((summary.validTicks / summary.totalTicks) * 100).toFixed(1)}%)\n`;
        report += `- Invalid ticks: ${summary.invalidTicks} (${((summary.invalidTicks / summary.totalTicks) * 100).toFixed(1)}%)\n\n`;
        
        if (summary.commonIssues.length > 0) {
            report += `⚠️ COMMON ISSUES:\n`;
            summary.commonIssues.forEach(issue => {
                report += `- ${issue}\n`;
            });
            report += '\n';
        }
        
        if (summary.recentSamples.length > 0) {
            report += `📋 RECENT TICK SAMPLES:\n`;
            summary.recentSamples.slice(-5).forEach((sample, index) => {
                report += `${index + 1}. ${sample.symbol}: ${JSON.stringify(sample.data).substring(0, 100)}...\n`;
            });
        }
        
        return report;
    }

    /**
     * Clear validation history
     */
    public clearHistory(): void {
        this.tickSamples = [];
        this.validationResults = [];
    }
}

export const tickDataValidator = TickDataValidator.getInstance();