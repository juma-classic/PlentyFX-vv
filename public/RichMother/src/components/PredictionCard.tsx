import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Hash } from 'lucide-react';
import { Tick, analyzeEvenOdd, analyzeOverUnder, analyzeDigitMatch } from '@/utils/predictions';
import { TickChart } from './TickChart';
import { StatsPanel } from './StatsPanel';
import { PredictionBadge } from './PredictionBadge';
import { SignalCountdown } from './SignalCountdown';
import { useSignalCycle } from '@/hooks/useSignalCycle';

interface PredictionCardProps {
  symbol: string;
  ticks: Tick[];
  isConnected: boolean;
}

const symbolNames: Record<string, string> = {
  R_10: 'Volatility 10',
  R_25: 'Volatility 25',
  R_50: 'Volatility 50',
  R_75: 'Volatility 75',
  R_100: 'Volatility 100'
};

export const PredictionCard = ({ symbol, ticks, isConnected }: PredictionCardProps) => {
  const { phase, countdown, signalTicks, collectedCount, isReady } = useSignalCycle(ticks);
  
  const evenOddResult = useMemo(() => analyzeEvenOdd(signalTicks), [signalTicks]);
  const overUnderResult = useMemo(() => analyzeOverUnder(signalTicks), [signalTicks]);
  const digitMatchResult = useMemo(() => analyzeDigitMatch(signalTicks), [signalTicks]);

  const showSignal = phase === 'signal' && isReady;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {symbolNames[symbol] || symbol}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">{symbol}</span>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-even animate-pulse' : 'bg-destructive'}`} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-foreground">
            {ticks.length > 0 ? ticks[ticks.length - 1].quote.toFixed(4) : '-.----'}
          </div>
          <div className="text-xs text-muted-foreground">
            {ticks.length} ticks
          </div>
        </div>
      </div>

      {/* Signal Countdown */}
      <SignalCountdown 
        phase={phase} 
        countdown={countdown} 
        collectedCount={collectedCount} 
      />

      {/* Chart */}
      <TickChart ticks={ticks} />

      {/* Predictions */}
      {!showSignal ? (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin mb-3" />
          <span className="text-sm font-medium">Analyzing market patterns...</span>
          <span className="text-xs text-muted-foreground mt-1">Signal ready in {countdown}s</span>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Even/Odd */}
          {evenOddResult && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Activity className="w-3 h-3" />
                <span>Even/Odd Prediction</span>
              </div>
              <PredictionBadge
                type={evenOddResult.prediction === 'EVEN' ? 'even' : 'odd'}
                label={evenOddResult.prediction}
                confidence={evenOddResult.confidence}
                isPulsing={evenOddResult.confidence > 75}
              />
            </div>
          )}

          {/* Over/Under */}
          {overUnderResult && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>Over/Under Signal</span>
              </div>
              <PredictionBadge
                type={overUnderResult.prediction === 'OVER' ? 'over' : 'under'}
                label={overUnderResult.label}
                confidence={overUnderResult.confidence}
                sublabel={`Recommended: ${overUnderResult.recommendedRuns} runs`}
                isPulsing={overUnderResult.confidence > 75}
              />
            </div>
          )}

          {/* Digit Match */}
          {digitMatchResult && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Hash className="w-3 h-3" />
                <span>Digit Match</span>
              </div>
              <PredictionBadge
                type="match"
                label={`MATCHES ${digitMatchResult.prediction}`}
                confidence={digitMatchResult.confidence}
                isPulsing={digitMatchResult.confidence > 75}
              />
            </div>
          )}
        </div>
      )}

      {/* Stats Panel */}
      {showSignal && evenOddResult && (
        <StatsPanel
          ticks={signalTicks}
          evenCount={evenOddResult.evenCount}
          oddCount={evenOddResult.oddCount}
          total={evenOddResult.total}
          liveTicks={ticks}
        />
      )}
    </motion.div>
  );
};
