import type {
  Market,
  ContractType,
  ConfidenceLevel,
  PatelSignal,
  DigitStats,
  MarketAnalysis,
  SignalGeneratorConfig,
  EntryPattern,
  PatelMetrics,
} from '../types/patel-signals';

class PatelSignalGeneratorService {
  private static instance: PatelSignalGeneratorService;
  private tickData: Map<Market, number[]> = new Map();
  private signals: PatelSignal[] = [];
  private listeners: Set<(signals: PatelSignal[]) => void> = new Set();
  private tickIntervals: Map<Market, NodeJS.Timeout> = new Map();
  private signalInterval: NodeJS.Timeout | null = null;
  private config: SignalGeneratorConfig = {
    sensitivity: 'balanced',
    minConfidence: 50,
    enabledMarkets: ['R_10', 'R_15', 'R_25', 'R_50', 'R_90', 'R_100'],
    enabledTypes: ['MATCHES', 'DIFFERS', 'OVER', 'UNDER', 'EVEN', 'ODD'],
    maxSignalsPerHour: 20,
  };

  private constructor() {
    this.initialize();
  }

  static getInstance(): PatelSignalGeneratorService {
    if (!PatelSignalGeneratorService.instance) {
      PatelSignalGeneratorService.instance = new PatelSignalGeneratorService();
    }
    return PatelSignalGeneratorService.instance;
  }

  private initialize(): void {
    // Initialize tick data for each market
    this.config.enabledMarkets.forEach((market) => {
      this.tickData.set(market, []);
      this.startTickGeneration(market);
    });

    // Start signal generation every 5 seconds
    this.signalInterval = setInterval(() => {
      this.generateSignals();
    }, 5000);
  }

  private startTickGeneration(market: Market): void {
    const interval = setInterval(() => {
      const digit = Math.floor(Math.random() * 10);
      const ticks = this.tickData.get(market) || [];
      ticks.push(digit);
      
      // Keep last 100 ticks
      if (ticks.length > 100) {
        ticks.shift();
      }
      
      this.tickData.set(market, ticks);
    }, 1000);

    this.tickIntervals.set(market, interval);
  }

  private calculateDigitStats(ticks: number[]): DigitStats[] {
    const stats: DigitStats[] = [];

    for (let digit = 0; digit <= 9; digit++) {
      const occurrences = ticks.filter((t) => t === digit).length;
      const frequency = ticks.length > 0 ? (occurrences / ticks.length) * 100 : 0;
      
      // Calculate last seen
      let lastSeen = 0;
      for (let i = ticks.length - 1; i >= 0; i--) {
        if (ticks[i] === digit) break;
        lastSeen++;
      }

      // Calculate streak
      let streak = 0;
      for (let i = ticks.length - 1; i >= 0; i--) {
        if (ticks[i] === digit) {
          streak++;
        } else {
          break;
        }
      }

      // Calculate hot/cold score
      const expectedFreq = 10;
      const deviation = frequency - expectedFreq;
      const hotColdScore = Math.max(-100, Math.min(100, (deviation / expectedFreq) * 100));

      stats.push({
        digit,
        frequency,
        lastSeen,
        streak,
        hotColdScore,
      });
    }

    return stats;
  }

  private generateSignals(): void {
    const newSignals: PatelSignal[] = [];

    this.config.enabledMarkets.forEach((market) => {
      const ticks = this.tickData.get(market) || [];
      if (ticks.length < 20) return; // Need minimum data

      const digitStats = this.calculateDigitStats(ticks);
      const marketSignals = this.analyzePatterns(market, digitStats, ticks);
      newSignals.push(...marketSignals);
    });

    // Filter by confidence and limit
    this.signals = newSignals
      .filter((s) => s.confidencePercentage >= this.config.minConfidence)
      .sort((a, b) => b.confidencePercentage - a.confidencePercentage)
      .slice(0, this.config.maxSignalsPerHour);

    this.notifyListeners();
  }

  private analyzePatterns(market: Market, digitStats: DigitStats[], ticks: number[]): PatelSignal[] {
    const signals: PatelSignal[] = [];

    // Strategy 1: Hot Digit Pursuit
    const hotDigits = digitStats.filter((d) => d.hotColdScore > 30);
    hotDigits.forEach((stats) => {
      if (this.config.enabledTypes.includes('MATCHES')) {
        signals.push(this.createSignal(market, 'MATCHES', stats, 'Hot Digit Pursuit', ticks));
      }
    });

    // Strategy 2: Cold Digit Reversal
    const coldDigits = digitStats.filter((d) => d.hotColdScore < -30 && d.lastSeen > 15);
    coldDigits.forEach((stats) => {
      if (this.config.enabledTypes.includes('MATCHES')) {
        signals.push(this.createSignal(market, 'MATCHES', stats, 'Cold Digit Reversal', ticks));
      }
    });

    // Strategy 3: Streak Breaking
    const streakDigits = digitStats.filter((d) => d.streak >= 3);
    streakDigits.forEach((stats) => {
      if (this.config.enabledTypes.includes('DIFFERS')) {
        signals.push(this.createSignal(market, 'DIFFERS', stats, 'Streak Breaking', ticks));
      }
    });

    // Strategy 4: Zone Clustering (Low)
    const lowDigits = digitStats.filter((d) => d.digit <= 4);
    const lowFreq = lowDigits.reduce((sum, d) => sum + d.frequency, 0);
    if (lowFreq > 65 && this.config.enabledTypes.includes('UNDER')) {
      const bestLow = lowDigits.sort((a, b) => b.hotColdScore - a.hotColdScore)[0];
      signals.push(this.createSignal(market, 'UNDER', bestLow, 'Zone Clustering (Low)', ticks, 4));
    }

    // Strategy 5: Zone Clustering (High)
    const highDigits = digitStats.filter((d) => d.digit >= 5);
    const highFreq = highDigits.reduce((sum, d) => sum + d.frequency, 0);
    if (highFreq > 65 && this.config.enabledTypes.includes('OVER')) {
      const bestHigh = highDigits.sort((a, b) => b.hotColdScore - a.hotColdScore)[0];
      signals.push(this.createSignal(market, 'OVER', bestHigh, 'Zone Clustering (High)', ticks, 5));
    }

    // Strategy 6: Deviation Capture (Even/Odd)
    const evenDigits = digitStats.filter((d) => d.digit % 2 === 0);
    const oddDigits = digitStats.filter((d) => d.digit % 2 === 1);
    const evenFreq = evenDigits.reduce((sum, d) => sum + d.frequency, 0);
    const oddFreq = oddDigits.reduce((sum, d) => sum + d.frequency, 0);
    const deviation = Math.abs(evenFreq - oddFreq);

    if (deviation > 20) {
      if (evenFreq > oddFreq && this.config.enabledTypes.includes('EVEN')) {
        const bestEven = evenDigits.sort((a, b) => b.frequency - a.frequency)[0];
        signals.push(this.createSignal(market, 'EVEN', bestEven, 'Deviation Capture', ticks));
      } else if (oddFreq > evenFreq && this.config.enabledTypes.includes('ODD')) {
        const bestOdd = oddDigits.sort((a, b) => b.frequency - a.frequency)[0];
        signals.push(this.createSignal(market, 'ODD', bestOdd, 'Deviation Capture', ticks));
      }
    }

    return signals;
  }

  private createSignal(
    market: Market,
    type: ContractType,
    stats: DigitStats,
    strategy: string,
    ticks: number[],
    barrier?: number
  ): PatelSignal {
    const confidence = this.calculateConfidence(type, stats, strategy);
    const confidenceLevel = this.getConfidenceLevel(confidence);
    const patelMetrics = this.createPatelMetrics(stats, ticks);
    const entryPatterns = this.generateEntryPatterns(type, stats, ticks);
    const { suggestedEntryDigit, alternativeDigits } = this.getSuggestedDigits(type, stats, ticks);

    const validity = confidenceLevel === 'HIGH' ? 120 : confidenceLevel === 'MEDIUM' ? 90 : 60;
    const stake = confidenceLevel === 'HIGH' ? 10 : confidenceLevel === 'MEDIUM' ? 5 : 2;
    const runs = confidenceLevel === 'HIGH' ? 3 : confidenceLevel === 'MEDIUM' ? 4 : 5;

    return {
      id: `patel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      market,
      type,
      digit: stats.digit,
      barrier,
      confidence: confidenceLevel,
      confidencePercentage: Math.round(confidence),
      reasoning: this.generateReasoning(type, stats, strategy),
      recommendedStake: stake,
      recommendedRuns: runs,
      duration: '5 ticks',
      validityDuration: validity,
      expiresAt: Date.now() + validity * 1000,
      strategy,
      source: 'PATEL_ENGINE',
      patelMetrics,
      entryPatterns,
      suggestedEntryDigit,
      alternativeDigits,
    };
  }

  private calculateConfidence(type: ContractType, stats: DigitStats, strategy: string): number {
    let base = 50;

    if (strategy === 'Hot Digit Pursuit') {
      base += stats.hotColdScore * 0.3 + stats.streak * 5;
    } else if (strategy === 'Cold Digit Reversal') {
      base += stats.lastSeen * 1.5 + Math.abs(stats.hotColdScore) * 0.2;
    } else if (strategy === 'Streak Breaking') {
      base += stats.streak * 10 + Math.abs(stats.hotColdScore) * 0.1;
    } else if (strategy.includes('Zone Clustering')) {
      base += stats.frequency * 0.8 + stats.hotColdScore * 0.2;
    } else if (strategy === 'Deviation Capture') {
      base += stats.frequency * 0.6 + stats.hotColdScore * 0.3;
    }

    // Apply sensitivity multiplier
    const multiplier = this.config.sensitivity === 'conservative' ? 0.8 : 
                      this.config.sensitivity === 'aggressive' ? 1.2 : 1.0;
    
    return Math.min(95, Math.max(30, base * multiplier));
  }

  private getConfidenceLevel(confidence: number): ConfidenceLevel {
    if (confidence >= 75) return 'HIGH';
    if (confidence >= 55) return 'MEDIUM';
    return 'LOW';
  }

  private createPatelMetrics(stats: DigitStats, ticks: number[]): PatelMetrics {
    const evenCount = ticks.filter((t) => t % 2 === 0).length;
    const oddCount = ticks.length - evenCount;
    const deviation = Math.abs(evenCount - oddCount);

    return {
      digitFrequency: Math.round(stats.frequency),
      lastSeenTicks: stats.lastSeen,
      streakLength: stats.streak,
      deviation,
      hotColdScore: Math.round(stats.hotColdScore),
    };
  }

  private generateEntryPatterns(type: ContractType, stats: DigitStats, ticks: number[]): EntryPattern[] {
    const patterns: EntryPattern[] = [];
    const allStats = this.calculateDigitStats(ticks);

    if (type === 'MATCHES' || type === 'DIFFERS') {
      patterns.push({
        type: 'single',
        digits: [stats.digit],
        description: `Primary target: Digit ${stats.digit}`,
        probability: Math.min(95, 60 + stats.hotColdScore * 0.3),
      });

      const related = allStats
        .filter((d) => Math.abs(d.hotColdScore - stats.hotColdScore) < 20 && d.digit !== stats.digit)
        .slice(0, 2);
      
      if (related.length > 0) {
        patterns.push({
          type: 'sequence',
          digits: [stats.digit, ...related.map((r) => r.digit)],
          description: `Pattern sequence: ${[stats.digit, ...related.map((r) => r.digit)].join(' → ')}`,
          probability: Math.min(85, 50 + stats.frequency * 0.5),
        });
      }
    } else if (type === 'OVER') {
      const topHigh = allStats.filter((d) => d.digit >= 5).sort((a, b) => b.frequency - a.frequency).slice(0, 3);
      patterns.push({
        type: 'range',
        digits: topHigh.map((d) => d.digit),
        description: `High zone targets: ${topHigh.map((d) => d.digit).join(', ')}`,
        probability: Math.min(90, 65 + stats.hotColdScore * 0.2),
      });
    } else if (type === 'UNDER') {
      const topLow = allStats.filter((d) => d.digit < 5).sort((a, b) => b.frequency - a.frequency).slice(0, 3);
      patterns.push({
        type: 'range',
        digits: topLow.map((d) => d.digit),
        description: `Low zone targets: ${topLow.map((d) => d.digit).join(', ')}`,
        probability: Math.min(90, 65 + stats.hotColdScore * 0.2),
      });
    } else if (type === 'EVEN') {
      const topEven = allStats.filter((d) => d.digit % 2 === 0).sort((a, b) => b.frequency - a.frequency).slice(0, 3);
      patterns.push({
        type: 'range',
        digits: topEven.map((d) => d.digit),
        description: `Even targets: ${topEven.map((d) => d.digit).join(', ')}`,
        probability: Math.min(88, 60 + stats.frequency * 0.4),
      });
    } else if (type === 'ODD') {
      const topOdd = allStats.filter((d) => d.digit % 2 === 1).sort((a, b) => b.frequency - a.frequency).slice(0, 3);
      patterns.push({
        type: 'range',
        digits: topOdd.map((d) => d.digit),
        description: `Odd targets: ${topOdd.map((d) => d.digit).join(', ')}`,
        probability: Math.min(88, 60 + stats.frequency * 0.4),
      });
    }

    return patterns;
  }

  private getSuggestedDigits(type: ContractType, stats: DigitStats, ticks: number[]): { suggestedEntryDigit: number; alternativeDigits: number[] } {
    const allStats = this.calculateDigitStats(ticks);
    
    let candidates = allStats;
    if (type === 'OVER') {
      candidates = allStats.filter((d) => d.digit >= 5);
    } else if (type === 'UNDER') {
      candidates = allStats.filter((d) => d.digit < 5);
    } else if (type === 'EVEN') {
      candidates = allStats.filter((d) => d.digit % 2 === 0);
    } else if (type === 'ODD') {
      candidates = allStats.filter((d) => d.digit % 2 === 1);
    }

    const sorted = candidates.sort((a, b) => b.frequency - a.frequency);
    
    return {
      suggestedEntryDigit: sorted[0]?.digit ?? stats.digit,
      alternativeDigits: sorted.slice(1, 3).map((d) => d.digit),
    };
  }

  private generateReasoning(type: ContractType, stats: DigitStats, strategy: string): string {
    if (strategy === 'Hot Digit Pursuit') {
      return `Digit ${stats.digit} is trending hot with ${Math.round(stats.frequency)}% frequency (${stats.hotColdScore > 0 ? '+' : ''}${Math.round(stats.hotColdScore)} score)`;
    } else if (strategy === 'Cold Digit Reversal') {
      return `Digit ${stats.digit} is overdue (${stats.lastSeen} ticks) with cold score of ${Math.round(stats.hotColdScore)}`;
    } else if (strategy === 'Streak Breaking') {
      return `Digit ${stats.digit} has ${stats.streak}-tick streak, reversal likely`;
    } else if (strategy === 'Zone Clustering (Low)') {
      return `Low digits (0-4) dominating at ${Math.round(stats.frequency)}% frequency`;
    } else if (strategy === 'Zone Clustering (High)') {
      return `High digits (5-9) dominating at ${Math.round(stats.frequency)}% frequency`;
    } else if (strategy === 'Deviation Capture') {
      return `${type} digits showing ${Math.round(stats.frequency)}% frequency with strong deviation`;
    }
    return `Pattern detected for digit ${stats.digit}`;
  }

  // Public API
  subscribe(listener: (signals: PatelSignal[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.signals); // Initial call
    return () => this.listeners.delete(listener);
  }

  getSignals(): PatelSignal[] {
    return [...this.signals];
  }

  getMarketAnalysis(market: Market): MarketAnalysis | null {
    const ticks = this.tickData.get(market);
    if (!ticks) return null;

    return {
      market,
      digits: this.calculateDigitStats(ticks),
      lastUpdate: Date.now(),
      tickCount: ticks.length,
    };
  }

  getAllMarketAnalysis(): MarketAnalysis[] {
    return this.config.enabledMarkets
      .map((market) => this.getMarketAnalysis(market))
      .filter((a): a is MarketAnalysis => a !== null);
  }

  setConfig(config: Partial<SignalGeneratorConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart if markets changed
    if (config.enabledMarkets) {
      this.tickIntervals.forEach((interval) => clearInterval(interval));
      this.tickIntervals.clear();
      this.tickData.clear();
      
      config.enabledMarkets.forEach((market) => {
        this.tickData.set(market, []);
        this.startTickGeneration(market);
      });
    }
  }

  getConfig(): SignalGeneratorConfig {
    return { ...this.config };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.signals));
  }

  destroy(): void {
    this.tickIntervals.forEach((interval) => clearInterval(interval));
    if (this.signalInterval) clearInterval(this.signalInterval);
    this.listeners.clear();
  }
}

export default PatelSignalGeneratorService.getInstance();
