export interface TradingConfig {
  debounceMs: number;
  safetyTimeoutMs: number;
  maxTradesPerIntent: number;
  delayBetweenTradesMs: number;
  simulationMode: boolean;
}

export interface AnalysisSignal {
  type: 'matches' | 'differs';
  confidence: number;
  timestamp: number;
  tickPattern: number[];
}

export interface ExecutionResult {
  success: boolean;
  tradeId?: string;
  error?: string;
  timestamp: number;
}

export type TradingMode = 'manual' | 'auto-analysis';

export interface AppState {
  tradingMode: TradingMode;
  config: TradingConfig;
  analysisSignals: AnalysisSignal[];
}