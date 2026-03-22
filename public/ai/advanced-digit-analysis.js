/**
 * Advanced Digit Analysis Service
 * Provides comprehensive statistical analysis for digit distribution
 */

class AdvancedDigitAnalysis {
    constructor() {
        this.digitHistory = [];
        this.streakData = {
            current: { digit: null, count: 0 },
            longest: { digit: null, count: 0 },
            all: []
        };
        this.hotColdData = {
            hot: [],
            cold: [],
            temperatures: new Array(10).fill(0)
        };
        this.patterns = {
            pairs: new Map(),
            sequences: [],
            clusters: new Map()
        };
        this.statistics = {
            standardDeviation: 0,
            chiSquare: 0,
            confidenceIntervals: new Array(10).fill({ lower: 0, upper: 0 }),
            expectedFrequency: 0.1 // 10% for each digit
        };
    }

    /**
     * Update analysis with new tick data
     */
    updateAnalysis(tickHistory) {
        this.digitHistory = tickHistory.map(tick => this.getLastDigit(tick.quote));
        
        this.analyzeStreaks();
        this.analyzeHotCold();
        this.analyzePatterns();
        this.calculateStatistics();
        
        return this.getAnalysisResults();
    }

    /**
     * Extract last digit from price
     */
    getLastDigit(price) {
        const priceStr = price.toString();
        const parts = priceStr.split('.');
        const decimals = parts[1] || '';
        return parseInt(decimals.slice(-1)) || 0;
    }

    /**
     * Analyze digit streaks (consecutive same digits)
     */
    analyzeStreaks() {
        if (this.digitHistory.length === 0) return;

        const streaks = [];
        let currentStreak = { digit: this.digitHistory[0], count: 1, startIndex: 0 };
        
        for (let i = 1; i < this.digitHistory.length; i++) {
            if (this.digitHistory[i] === currentStreak.digit) {
                currentStreak.count++;
            } else {
                if (currentStreak.count >= 2) {
                    streaks.push({ ...currentStreak, endIndex: i - 1 });
                }
                currentStreak = { digit: this.digitHistory[i], count: 1, startIndex: i };
            }
        }
        
        // Add final streak if applicable
        if (currentStreak.count >= 2) {
            streaks.push({ ...currentStreak, endIndex: this.digitHistory.length - 1 });
        }

        this.streakData.all = streaks;
        this.streakData.current = currentStreak;
        this.streakData.longest = streaks.reduce((longest, streak) => 
            streak.count > longest.count ? streak : longest, 
            { digit: null, count: 0 }
        );
    }

    /**
     * Analyze hot/cold digits with temperature indicators
     */
    analyzeHotCold() {
        const digitCounts = new Array(10).fill(0);
        const recentWindow = Math.min(100, this.digitHistory.length); // Last 100 digits
        const recentDigits = this.digitHistory.slice(-recentWindow);
        
        // Count recent occurrences
        recentDigits.forEach(digit => digitCounts[digit]++);
        
        // Calculate temperatures (0-100 scale)
        const maxCount = Math.max(...digitCounts);
        const minCount = Math.min(...digitCounts);
        const range = maxCount - minCount || 1;
        
        this.hotColdData.temperatures = digitCounts.map(count => 
            Math.round(((count - minCount) / range) * 100)
        );
        
        // Classify hot (>70), warm (40-70), cool (20-40), cold (<20)
        this.hotColdData.hot = [];
        this.hotColdData.cold = [];
        
        this.hotColdData.temperatures.forEach((temp, digit) => {
            if (temp >= 70) this.hotColdData.hot.push({ digit, temperature: temp });
            if (temp <= 20) this.hotColdData.cold.push({ digit, temperature: temp });
        });
        
        // Sort by temperature
        this.hotColdData.hot.sort((a, b) => b.temperature - a.temperature);
        this.hotColdData.cold.sort((a, b) => a.temperature - b.temperature);
    }

    /**
     * Analyze patterns (pairs, sequences, clusters)
     */
    analyzePatterns() {
        this.analyzePairs();
        this.analyzeSequences();
        this.analyzeClusters();
    }

    /**
     * Analyze digit pairs
     */
    analyzePairs() {
        this.patterns.pairs.clear();
        
        for (let i = 0; i < this.digitHistory.length - 1; i++) {
            const pair = `${this.digitHistory[i]}-${this.digitHistory[i + 1]}`;
            this.patterns.pairs.set(pair, (this.patterns.pairs.get(pair) || 0) + 1);
        }
        
        // Convert to sorted array
        this.patterns.pairs = new Map([...this.patterns.pairs.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10) // Top 10 pairs
        );
    }

    /**
     * Analyze digit sequences
     */
    analyzeSequences() {
        this.patterns.sequences = [];
        
        // Look for ascending/descending sequences of 3+ digits
        for (let i = 0; i < this.digitHistory.length - 2; i++) {
            const seq = [this.digitHistory[i], this.digitHistory[i + 1], this.digitHistory[i + 2]];
            
            // Check for ascending sequence
            if (seq[0] < seq[1] && seq[1] < seq[2]) {
                this.patterns.sequences.push({
                    type: 'ascending',
                    sequence: seq,
                    startIndex: i,
                    length: 3
                });
            }
            
            // Check for descending sequence
            if (seq[0] > seq[1] && seq[1] > seq[2]) {
                this.patterns.sequences.push({
                    type: 'descending',
                    sequence: seq,
                    startIndex: i,
                    length: 3
                });
            }
        }
    }

    /**
     * Analyze digit clusters (groups of similar digits in close proximity)
     */
    analyzeClusters() {
        this.patterns.clusters.clear();
        const windowSize = 10; // Look at 10-digit windows
        
        for (let i = 0; i <= this.digitHistory.length - windowSize; i++) {
            const window = this.digitHistory.slice(i, i + windowSize);
            const digitCounts = new Array(10).fill(0);
            
            window.forEach(digit => digitCounts[digit]++);
            
            // Find digits that appear 3+ times in this window
            digitCounts.forEach((count, digit) => {
                if (count >= 3) {
                    const key = `${digit}-cluster`;
                    if (!this.patterns.clusters.has(key)) {
                        this.patterns.clusters.set(key, []);
                    }
                    this.patterns.clusters.get(key).push({
                        startIndex: i,
                        endIndex: i + windowSize - 1,
                        count: count,
                        density: count / windowSize
                    });
                }
            });
        }
    }

    /**
     * Calculate advanced statistics
     */
    calculateStatistics() {
        if (this.digitHistory.length === 0) return;
        
        this.calculateStandardDeviation();
        this.calculateChiSquare();
        this.calculateConfidenceIntervals();
    }

    /**
     * Calculate standard deviation of digit frequencies
     */
    calculateStandardDeviation() {
        const digitCounts = new Array(10).fill(0);
        this.digitHistory.forEach(digit => digitCounts[digit]++);
        
        const frequencies = digitCounts.map(count => count / this.digitHistory.length);
        const mean = frequencies.reduce((sum, freq) => sum + freq, 0) / 10;
        
        const variance = frequencies.reduce((sum, freq) => sum + Math.pow(freq - mean, 2), 0) / 10;
        this.statistics.standardDeviation = Math.sqrt(variance);
    }

    /**
     * Calculate Chi-square test for randomness
     */
    calculateChiSquare() {
        const digitCounts = new Array(10).fill(0);
        this.digitHistory.forEach(digit => digitCounts[digit]++);
        
        const expected = this.digitHistory.length / 10;
        
        this.statistics.chiSquare = digitCounts.reduce((sum, observed) => {
            return sum + Math.pow(observed - expected, 2) / expected;
        }, 0);
    }

    /**
     * Calculate confidence intervals for each digit
     */
    calculateConfidenceIntervals() {
        const digitCounts = new Array(10).fill(0);
        this.digitHistory.forEach(digit => digitCounts[digit]++);
        
        const n = this.digitHistory.length;
        const z = 1.96; // 95% confidence level
        
        this.statistics.confidenceIntervals = digitCounts.map(count => {
            const p = count / n;
            const margin = z * Math.sqrt((p * (1 - p)) / n);
            
            return {
                lower: Math.max(0, p - margin),
                upper: Math.min(1, p + margin),
                actual: p,
                expected: 0.1
            };
        });
    }

    /**
     * Get comprehensive analysis results
     */
    getAnalysisResults() {
        return {
            streaks: {
                current: this.streakData.current,
                longest: this.streakData.longest,
                all: this.streakData.all,
                count: this.streakData.all.length
            },
            hotCold: {
                hot: this.hotColdData.hot,
                cold: this.hotColdData.cold,
                temperatures: this.hotColdData.temperatures
            },
            patterns: {
                topPairs: Array.from(this.patterns.pairs.entries()).slice(0, 5),
                sequences: this.patterns.sequences.slice(-10), // Last 10 sequences
                clusters: this.getTopClusters()
            },
            statistics: {
                standardDeviation: this.statistics.standardDeviation,
                chiSquare: this.statistics.chiSquare,
                chiSquarePValue: this.getChiSquarePValue(),
                confidenceIntervals: this.statistics.confidenceIntervals,
                randomnessScore: this.getRandomnessScore()
            }
        };
    }

    /**
     * Get top clusters by density
     */
    getTopClusters() {
        const allClusters = [];
        
        for (const [digit, clusters] of this.patterns.clusters.entries()) {
            const digitNum = parseInt(digit.split('-')[0]);
            clusters.forEach(cluster => {
                allClusters.push({
                    digit: digitNum,
                    ...cluster
                });
            });
        }
        
        return allClusters
            .sort((a, b) => b.density - a.density)
            .slice(0, 5);
    }

    /**
     * Calculate Chi-square p-value (approximation)
     */
    getChiSquarePValue() {
        const chiSquare = this.statistics.chiSquare;
        const df = 9; // degrees of freedom (10 digits - 1)
        
        // Simplified p-value calculation
        if (chiSquare < 14.684) return "> 0.10"; // Not significant
        if (chiSquare < 16.919) return "0.05 - 0.10";
        if (chiSquare < 21.666) return "0.01 - 0.05";
        return "< 0.01"; // Highly significant
    }

    /**
     * Calculate overall randomness score (0-100)
     */
    getRandomnessScore() {
        const chiSquareScore = Math.max(0, 100 - (this.statistics.chiSquare * 2));
        const stdDevScore = Math.max(0, 100 - (this.statistics.standardDeviation * 1000));
        const streakPenalty = Math.max(0, this.streakData.longest.count - 2) * 5;
        
        return Math.max(0, Math.min(100, (chiSquareScore + stdDevScore) / 2 - streakPenalty));
    }

    /**
     * Get temperature color for digit
     */
    getTemperatureColor(temperature) {
        if (temperature >= 80) return '#ff4444'; // Hot red
        if (temperature >= 60) return '#ff8800'; // Warm orange
        if (temperature >= 40) return '#ffcc00'; // Neutral yellow
        if (temperature >= 20) return '#00ccff'; // Cool blue
        return '#0088ff'; // Cold blue
    }

    /**
     * Get temperature label
     */
    getTemperatureLabel(temperature) {
        if (temperature >= 80) return 'Hot';
        if (temperature >= 60) return 'Warm';
        if (temperature >= 40) return 'Neutral';
        if (temperature >= 20) return 'Cool';
        return 'Cold';
    }
}

// Export for use in main application
window.AdvancedDigitAnalysis = AdvancedDigitAnalysis;