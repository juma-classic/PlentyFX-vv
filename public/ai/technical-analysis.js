/**
 * Technical Analysis Service for Zeus Analysis Tool
 * Advanced market microstructure and pattern analysis
 */

class TechnicalAnalysisService {
    constructor() {
        this.tickVelocityData = [];
        this.priceMovements = [];
        this.volatilityRegime = { current: 'NORMAL', trend: 'STABLE', index: 0 };
        this.transitionMatrix = Array(10).fill().map(() => Array(10).fill(0));
        this.fractals = [];
        this.anomalies = [];
        this.lastUpdateTime = 0;
        
        // Performance tracking
        this.performanceMetrics = {
            processingTime: [],
            accuracy: 0,
            lastCalculation: 0
        };
    }

    /**
     * Main analysis update function
     */
    updateAnalysis(tickHistory) {
        const startTime = performance.now();
        
        if (tickHistory.length < 10) return null;
        
        const results = {
            tickVelocity: this.analyzeTickVelocity(tickHistory),
            priceMovement: this.analyzePriceMovement(tickHistory),
            volatilityRegime: this.analyzeVolatilityRegime(tickHistory),
            transitionMatrix: this.buildTransitionMatrix(tickHistory),
            fractals: this.detectFractals(tickHistory),
            anomalies: this.detectAnomalies(tickHistory),
            timestamp: Date.now()
        };
        
        // Track performance
        const processingTime = performance.now() - startTime;
        this.performanceMetrics.processingTime.push(processingTime);
        this.performanceMetrics.lastCalculation = processingTime;
        
        // Keep only last 100 measurements
        if (this.performanceMetrics.processingTime.length > 100) {
            this.performanceMetrics.processingTime.shift();
        }
        
        return results;
    }

    /**
     * Tick Velocity Metrics - Analyze tick arrival patterns
     */
    analyzeTickVelocity(tickHistory) {
        const intervals = [];
        const volumes = [];
        
        for (let i = 1; i < tickHistory.length; i++) {
            const interval = tickHistory[i].time - tickHistory[i-1].time;
            intervals.push(interval);
            
            // Calculate price change magnitude as proxy for volume
            const priceChange = Math.abs(tickHistory[i].quote - tickHistory[i-1].quote);
            volumes.push(priceChange);
        }
        
        if (intervals.length === 0) return null;
        
        const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
        const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        
        // Calculate tick velocity metrics
        const ticksPerSecond = 1000 / avgInterval;
        const velocityIndex = stdDev / avgInterval; // Coefficient of variation
        const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
        
        // Classify velocity regime
        let velocityRegime = 'NORMAL';
        if (ticksPerSecond > 2) velocityRegime = 'HIGH';
        else if (ticksPerSecond < 0.5) velocityRegime = 'LOW';
        
        // Calculate acceleration (change in velocity)
        const recentIntervals = intervals.slice(-10);
        const recentAvg = recentIntervals.reduce((sum, int) => sum + int, 0) / recentIntervals.length;
        const acceleration = (avgInterval - recentAvg) / avgInterval;
        
        return {
            averageInterval: Math.round(avgInterval),
            ticksPerSecond: parseFloat(ticksPerSecond.toFixed(2)),
            velocityIndex: parseFloat(velocityIndex.toFixed(3)),
            velocityRegime: velocityRegime,
            acceleration: parseFloat(acceleration.toFixed(3)),
            averageVolume: parseFloat(avgVolume.toFixed(5)),
            consistency: parseFloat((1 - velocityIndex).toFixed(3)), // Higher = more consistent
            lastInterval: intervals[intervals.length - 1]
        };
    }

    /**
     * Price Movement Momentum - Detect momentum shifts
     */
    analyzePriceMovement(tickHistory) {
        if (tickHistory.length < 20) return null;
        
        const movements = [];
        const magnitudes = [];
        let bullishMomentum = 0;
        let bearishMomentum = 0;
        
        // Calculate price movements
        for (let i = 1; i < tickHistory.length; i++) {
            const change = tickHistory[i].quote - tickHistory[i-1].quote;
            const magnitude = Math.abs(change);
            const direction = change > 0 ? 1 : change < 0 ? -1 : 0;
            
            movements.push({
                change: change,
                magnitude: magnitude,
                direction: direction,
                timestamp: tickHistory[i].time,
                index: i
            });
            
            magnitudes.push(magnitude);
            
            // Accumulate momentum
            if (direction === 1) bullishMomentum += magnitude;
            else if (direction === -1) bearishMomentum += magnitude;
        }
        
        // Calculate momentum indicators
        const totalMomentum = bullishMomentum + bearishMomentum;
        const momentumRatio = totalMomentum > 0 ? (bullishMomentum - bearishMomentum) / totalMomentum : 0;
        
        // Calculate moving averages for trend detection
        const shortMA = this.calculateMovingAverage(tickHistory.slice(-10).map(t => t.quote));
        const longMA = this.calculateMovingAverage(tickHistory.slice(-20).map(t => t.quote));
        
        // Detect momentum shifts (reversals)
        const reversals = this.detectMomentumReversals(movements);
        
        // Calculate volatility
        const avgMagnitude = magnitudes.reduce((sum, m) => sum + m, 0) / magnitudes.length;
        const volatility = Math.sqrt(magnitudes.reduce((sum, m) => sum + Math.pow(m - avgMagnitude, 2), 0) / magnitudes.length);
        
        // Determine current trend
        let trend = 'SIDEWAYS';
        const trendStrength = Math.abs(momentumRatio);
        
        if (trendStrength > 0.1) {
            trend = momentumRatio > 0 ? 'BULLISH' : 'BEARISH';
        }
        
        // Calculate momentum strength (0-100)
        const momentumStrength = Math.min(100, trendStrength * 500);
        
        return {
            trend: trend,
            momentumRatio: parseFloat(momentumRatio.toFixed(3)),
            momentumStrength: parseFloat(momentumStrength.toFixed(1)),
            bullishMomentum: parseFloat(bullishMomentum.toFixed(5)),
            bearishMomentum: parseFloat(bearishMomentum.toFixed(5)),
            volatility: parseFloat(volatility.toFixed(5)),
            averageMagnitude: parseFloat(avgMagnitude.toFixed(5)),
            reversals: reversals.length,
            shortMA: parseFloat(shortMA.toFixed(5)),
            longMA: parseFloat(longMA.toFixed(5)),
            trendDirection: shortMA > longMA ? '↗️' : shortMA < longMA ? '↘️' : '→',
            lastMovement: movements[movements.length - 1]
        };
    }

    /**
     * Volatility Regime Detection
     */
    analyzeVolatilityRegime(tickHistory) {
        if (tickHistory.length < 50) return null;
        
        // Calculate returns
        const returns = [];
        for (let i = 1; i < tickHistory.length; i++) {
            const return_ = Math.log(tickHistory[i].quote / tickHistory[i-1].quote);
            returns.push(return_);
        }
        
        // Calculate rolling volatility (20-period)
        const volatilities = [];
        const windowSize = 20;
        
        for (let i = windowSize; i < returns.length; i++) {
            const window = returns.slice(i - windowSize, i);
            const mean = window.reduce((sum, r) => sum + r, 0) / window.length;
            const variance = window.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / window.length;
            const volatility = Math.sqrt(variance) * Math.sqrt(252 * 24 * 60 * 60); // Annualized
            volatilities.push(volatility);
        }
        
        if (volatilities.length === 0) return null;
        
        const currentVolatility = volatilities[volatilities.length - 1];
        const avgVolatility = volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length;
        
        // Calculate clustering index (GARCH-like)
        const clusteringIndex = this.calculateVolatilityClustering(volatilities);
        
        // Determine regime
        let regime = 'NORMAL';
        let regimeColor = '#3b82f6';
        
        if (currentVolatility > avgVolatility * 1.5) {
            regime = 'HIGH';
            regimeColor = '#ef4444';
        } else if (currentVolatility < avgVolatility * 0.7) {
            regime = 'LOW';
            regimeColor = '#10b981';
        }
        
        // Calculate trend in volatility
        const recentVol = volatilities.slice(-5);
        const olderVol = volatilities.slice(-10, -5);
        const recentAvg = recentVol.reduce((sum, v) => sum + v, 0) / recentVol.length;
        const olderAvg = olderVol.reduce((sum, v) => sum + v, 0) / olderVol.length;
        
        let trend = 'STABLE';
        let trendIcon = '→';
        
        if (recentAvg > olderAvg * 1.1) {
            trend = 'INCREASING';
            trendIcon = '↗️';
        } else if (recentAvg < olderAvg * 0.9) {
            trend = 'DECREASING';
            trendIcon = '↘️';
        }
        
        return {
            regime: regime,
            regimeColor: regimeColor,
            currentVolatility: parseFloat(currentVolatility.toFixed(4)),
            averageVolatility: parseFloat(avgVolatility.toFixed(4)),
            clusteringIndex: parseFloat(clusteringIndex.toFixed(2)),
            trend: trend,
            trendIcon: trendIcon,
            volatilityRatio: parseFloat((currentVolatility / avgVolatility).toFixed(2)),
            percentile: this.calculatePercentile(currentVolatility, volatilities)
        };
    }

    /**
     * Transition Probability Matrix
     */
    buildTransitionMatrix(tickHistory) {
        const digits = tickHistory.map(tick => this.getLastDigit(tick.quote));
        
        if (digits.length < 2) return null;
        
        // Initialize matrix
        const matrix = Array(10).fill().map(() => Array(10).fill(0));
        const stateCounts = new Array(10).fill(0);
        
        // Count transitions
        for (let i = 0; i < digits.length - 1; i++) {
            const currentDigit = digits[i];
            const nextDigit = digits[i + 1];
            
            matrix[currentDigit][nextDigit]++;
            stateCounts[currentDigit]++;
        }
        
        // Convert to probabilities
        const probabilityMatrix = Array(10).fill().map(() => Array(10).fill(0));
        for (let i = 0; i < 10; i++) {
            if (stateCounts[i] > 0) {
                for (let j = 0; j < 10; j++) {
                    probabilityMatrix[i][j] = matrix[i][j] / stateCounts[i];
                }
            }
        }
        
        // Get current digit and predictions
        const currentDigit = digits[digits.length - 1];
        const nextDigitProbabilities = probabilityMatrix[currentDigit];
        
        // Find most likely next digits
        const predictions = nextDigitProbabilities
            .map((prob, digit) => ({ digit, probability: prob }))
            .sort((a, b) => b.probability - a.probability)
            .slice(0, 3);
        
        // Calculate entropy of current state
        const entropy = -nextDigitProbabilities.reduce((sum, p) => 
            p > 0 ? sum + p * Math.log2(p) : sum, 0
        );
        
        return {
            matrix: probabilityMatrix,
            currentDigit: currentDigit,
            nextDigitProbabilities: nextDigitProbabilities.map(p => parseFloat((p * 100).toFixed(1))),
            topPredictions: predictions.map(p => ({
                digit: p.digit,
                probability: parseFloat((p.probability * 100).toFixed(1))
            })),
            entropy: parseFloat(entropy.toFixed(2)),
            predictability: parseFloat(((Math.log2(10) - entropy) / Math.log2(10) * 100).toFixed(1)),
            totalTransitions: digits.length - 1
        };
    }

    /**
     * Fractal Detection - Support/Resistance Levels
     */
    detectFractals(tickHistory) {
        if (tickHistory.length < 10) return [];
        
        const fractals = [];
        const windowSize = 5;
        const prices = tickHistory.map(t => t.quote);
        
        for (let i = windowSize; i < prices.length - windowSize; i++) {
            const window = prices.slice(i - windowSize, i + windowSize + 1);
            const centerPrice = window[windowSize];
            const centerIndex = i;
            
            // Check for resistance (local maximum)
            const isResistance = window.every((price, idx) => 
                idx === windowSize || price <= centerPrice
            );
            
            // Check for support (local minimum)
            const isSupport = window.every((price, idx) => 
                idx === windowSize || price >= centerPrice
            );
            
            if (isResistance || isSupport) {
                const strength = this.calculateFractalStrength(window, windowSize);
                const age = tickHistory.length - centerIndex;
                
                fractals.push({
                    index: centerIndex,
                    price: centerPrice,
                    type: isResistance ? 'resistance' : 'support',
                    strength: parseFloat(strength.toFixed(3)),
                    age: age,
                    timestamp: tickHistory[centerIndex].time,
                    relevance: this.calculateFractalRelevance(centerPrice, prices.slice(-20), strength)
                });
            }
        }
        
        // Sort by relevance and return top fractals
        return fractals
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, 10);
    }

    /**
     * Anomaly Detection
     */
    detectAnomalies(tickHistory) {
        if (tickHistory.length < 50) return [];
        
        const anomalies = [];
        const digits = tickHistory.map(tick => this.getLastDigit(tick.quote));
        const prices = tickHistory.map(tick => tick.quote);
        
        // 1. Digit frequency anomalies
        const digitAnomalies = this.detectDigitAnomalies(digits);
        anomalies.push(...digitAnomalies);
        
        // 2. Price movement anomalies
        const priceAnomalies = this.detectPriceAnomalies(prices);
        anomalies.push(...priceAnomalies);
        
        // 3. Pattern anomalies
        const patternAnomalies = this.detectPatternAnomalies(digits);
        anomalies.push(...patternAnomalies);
        
        // Sort by severity and return recent anomalies
        return anomalies
            .filter(a => a.age < 100) // Only recent anomalies
            .sort((a, b) => b.severity - a.severity)
            .slice(0, 5);
    }

    // Helper Methods

    getLastDigit(price) {
        const priceStr = price.toString();
        const parts = priceStr.split('.');
        const decimals = parts[1] || '';
        return parseInt(decimals.slice(-1)) || 0;
    }

    calculateMovingAverage(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    detectMomentumReversals(movements) {
        const reversals = [];
        const lookback = 5;
        
        for (let i = lookback; i < movements.length - lookback; i++) {
            const before = movements.slice(i - lookback, i);
            const after = movements.slice(i, i + lookback);
            
            const beforeMomentum = before.reduce((sum, m) => sum + m.direction, 0);
            const afterMomentum = after.reduce((sum, m) => sum + m.direction, 0);
            
            // Detect significant momentum change
            if (Math.abs(beforeMomentum - afterMomentum) >= 6) {
                reversals.push({
                    index: i,
                    type: afterMomentum > beforeMomentum ? 'bullish_reversal' : 'bearish_reversal',
                    strength: Math.abs(beforeMomentum - afterMomentum),
                    timestamp: movements[i].timestamp
                });
            }
        }
        
        return reversals;
    }

    calculateVolatilityClustering(volatilities) {
        if (volatilities.length < 10) return 0;
        
        // Calculate autocorrelation of squared volatilities
        const squaredVols = volatilities.map(v => v * v);
        const mean = squaredVols.reduce((sum, v) => sum + v, 0) / squaredVols.length;
        
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < squaredVols.length - 1; i++) {
            numerator += (squaredVols[i] - mean) * (squaredVols[i + 1] - mean);
            denominator += Math.pow(squaredVols[i] - mean, 2);
        }
        
        return denominator > 0 ? numerator / denominator : 0;
    }

    calculatePercentile(value, array) {
        const sorted = [...array].sort((a, b) => a - b);
        const index = sorted.findIndex(v => v >= value);
        return index === -1 ? 100 : Math.round((index / sorted.length) * 100);
    }

    calculateFractalStrength(window, centerIndex) {
        const centerPrice = window[centerIndex];
        let strength = 0;
        
        for (let i = 0; i < window.length; i++) {
            if (i !== centerIndex) {
                strength += Math.abs(centerPrice - window[i]);
            }
        }
        
        return strength / (window.length - 1);
    }

    calculateFractalRelevance(price, recentPrices, strength) {
        const currentPrice = recentPrices[recentPrices.length - 1];
        const distance = Math.abs(price - currentPrice);
        const maxDistance = Math.max(...recentPrices) - Math.min(...recentPrices);
        
        // Closer fractals with higher strength are more relevant
        const distanceScore = maxDistance > 0 ? 1 - (distance / maxDistance) : 1;
        const strengthScore = Math.min(1, strength * 1000);
        
        return (distanceScore * 0.7 + strengthScore * 0.3) * 100;
    }

    detectDigitAnomalies(digits) {
        const anomalies = [];
        const windowSize = 20;
        
        if (digits.length < windowSize) return anomalies;
        
        // Check recent digit frequencies
        const recentDigits = digits.slice(-windowSize);
        const digitCounts = new Array(10).fill(0);
        recentDigits.forEach(d => digitCounts[d]++);
        
        // Expected frequency is 10% for each digit
        const expectedCount = windowSize * 0.1;
        const threshold = 3; // 3-sigma threshold
        
        digitCounts.forEach((count, digit) => {
            const zScore = Math.abs(count - expectedCount) / Math.sqrt(expectedCount * 0.9);
            
            if (zScore > threshold) {
                anomalies.push({
                    type: 'digit_frequency',
                    digit: digit,
                    count: count,
                    expected: expectedCount,
                    zScore: parseFloat(zScore.toFixed(2)),
                    severity: Math.min(100, zScore * 10),
                    age: 0,
                    description: `Digit ${digit} appeared ${count} times in last ${windowSize} ticks (expected: ${expectedCount.toFixed(1)})`
                });
            }
        });
        
        return anomalies;
    }

    detectPriceAnomalies(prices) {
        const anomalies = [];
        
        if (prices.length < 20) return anomalies;
        
        // Calculate price changes
        const changes = [];
        for (let i = 1; i < prices.length; i++) {
            changes.push(prices[i] - prices[i - 1]);
        }
        
        // Calculate statistics
        const mean = changes.reduce((sum, c) => sum + c, 0) / changes.length;
        const variance = changes.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / changes.length;
        const stdDev = Math.sqrt(variance);
        
        // Check recent changes for outliers
        const recentChanges = changes.slice(-10);
        recentChanges.forEach((change, index) => {
            const zScore = Math.abs((change - mean) / stdDev);
            
            if (zScore > 3) {
                anomalies.push({
                    type: 'price_movement',
                    change: parseFloat(change.toFixed(5)),
                    zScore: parseFloat(zScore.toFixed(2)),
                    severity: Math.min(100, zScore * 15),
                    age: recentChanges.length - index - 1,
                    description: `Unusual price movement: ${change > 0 ? '+' : ''}${change.toFixed(5)} (${zScore.toFixed(1)}σ)`
                });
            }
        });
        
        return anomalies;
    }

    detectPatternAnomalies(digits) {
        const anomalies = [];
        
        if (digits.length < 10) return anomalies;
        
        // Check for unusual streaks
        let currentStreak = 1;
        let currentDigit = digits[digits.length - 1];
        
        for (let i = digits.length - 2; i >= 0 && digits[i] === currentDigit; i--) {
            currentStreak++;
        }
        
        // Streaks of 5+ are unusual (probability ≈ 0.001%)
        if (currentStreak >= 5) {
            const probability = Math.pow(0.1, currentStreak) * 100;
            anomalies.push({
                type: 'streak',
                digit: currentDigit,
                length: currentStreak,
                probability: parseFloat(probability.toFixed(6)),
                severity: Math.min(100, currentStreak * 20),
                age: 0,
                description: `Unusual streak: digit ${currentDigit} repeated ${currentStreak} times (probability: ${probability.toFixed(4)}%)`
            });
        }
        
        return anomalies;
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        const avgProcessingTime = this.performanceMetrics.processingTime.length > 0 
            ? this.performanceMetrics.processingTime.reduce((sum, t) => sum + t, 0) / this.performanceMetrics.processingTime.length
            : 0;
        
        return {
            averageProcessingTime: parseFloat(avgProcessingTime.toFixed(2)),
            lastProcessingTime: this.performanceMetrics.lastCalculation,
            calculationsPerformed: this.performanceMetrics.processingTime.length,
            systemHealth: avgProcessingTime < 10 ? 'EXCELLENT' : avgProcessingTime < 50 ? 'GOOD' : 'SLOW'
        };
    }
}

// Export for use in main application
window.TechnicalAnalysisService = TechnicalAnalysisService;