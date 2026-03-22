export type ContractType = 'MATCHES' | 'DIFFERS' | 'OVER' | 'UNDER' | 'EVEN' | 'ODD';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type Market = 'R_10' | 'R_15' | 'R_25' | 'R_50' | 'R_90' | 'R_100';

export interface EntryPattern {
  type: 'single' | 'sequence' | 'range';
  digits: number[];
  description: string;
  probability: number;
}

export interface PatelMetrics {
  digitFrequency: number;
  lastSeenTicks: number;
  streakLength: number;
  deviation: number;
  hotColdScore: number; // -100 (cold) to +100 (hot)
}

export interface PatelSignal {
  id: string;
  timestamp: number;
  market: Market;
  type: ContractType;
  digit: number;
  barrier?: number;
  confidence: ConfidenceLevel;
  confidencePercentage: number;
  reasoning: string;
  recommendedStake: number;
  recommendedRuns: number;
  duration: string;
  validityDuration: number;
  expiresAt: number;
  strategy: string;
  source: 'PATEL_ENGINE';
  patelMetrics: PatelMetrics;
  entryPatterns: EntryPattern[];
  suggestedEntryDigit: number;
  alternativeDigits: number[];
}

export interface DigitStats {
  digit: number;
  frequency: number;
  lastSeen: number;
  streak: number;
  hotColdScore: number;
}

export interface MarketAnalysis {
  market: Market;
  digits: DigitStats[];
  lastUpdate: number;
  tickCount: number;
}

export interface SignalGeneratorConfig {
  sensitivity: 'conservative' | 'balanced' | 'aggressive';
  minConfidence: number;
  enabledMarkets: Market[];
  enabledTypes: ContractType[];
  maxSignalsPerHour: number;
}
