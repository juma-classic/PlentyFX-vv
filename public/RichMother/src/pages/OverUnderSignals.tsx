import { motion } from 'framer-motion';
import { TrendingUp, Wifi, WifiOff, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useDerivWebSocket } from '@/hooks/useDerivWebSocket';
import { useSignalCycle } from '@/hooks/useSignalCycle';
import { analyzeOverUnder, getLastDigit } from '@/utils/predictions';
import { TickChart } from '@/components/TickChart';
import { PredictionBadge } from '@/components/PredictionBadge';
import { SignalCountdown } from '@/components/SignalCountdown';
import { Button } from '@/components/ui/button';

const symbolNames: Record<string, string> = {
  R_10: 'Volatility 10',
  R_25: 'Volatility 25',
  R_50: 'Volatility 50',
  R_75: 'Volatility 75',
  R_100: 'Volatility 100',
  '1HZ10V': 'Volatility 10 (1s)',
  '1HZ25V': 'Volatility 25 (1s)',
  '1HZ50V': 'Volatility 50 (1s)',
  '1HZ100V': 'Volatility 100 (1s)'
};

interface SignalCardProps {
  symbol: string;
  ticks: { epoch: number; quote: number; symbol: string }[];
  isConnected: boolean;
}

const OverUnderCard = ({ symbol, ticks, isConnected }: SignalCardProps) => {
  const { phase, countdown, signalTicks, collectedCount, isReady } = useSignalCycle(ticks);
  const overUnderResult = useMemo(() => analyzeOverUnder(signalTicks), [signalTicks]);
  const showSignal = phase === 'signal' && isReady;

  // Live digit display
  const lastDigits = ticks.slice(-10).map(t => ({
    digit: getLastDigit(t.quote),
    epoch: t.epoch
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 space-y-4"
    >
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
        </div>
      </div>

      <SignalCountdown phase={phase} countdown={countdown} collectedCount={collectedCount} />
      <TickChart ticks={ticks} />

      {!showSignal ? (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <div className="w-16 h-16 rounded-full border-4 border-muted border-t-over animate-spin mb-3" />
          <span className="text-sm font-medium">Analyzing Over/Under patterns...</span>
          <span className="text-xs text-muted-foreground mt-1">Signal ready in {countdown}s</span>
        </div>
      ) : overUnderResult && (
        <div className="space-y-3">
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
          
          {/* Entry Pattern Recommendation */}
          <div className={`rounded-lg p-3 ${
            overUnderResult.waitForPattern 
              ? 'bg-amber-500/10 border border-amber-500/30' 
              : 'bg-even/10 border border-even/30'
          }`}>
            <div className="text-xs font-medium mb-1 text-muted-foreground">Entry Strategy</div>
            <div className={`text-sm font-semibold ${
              overUnderResult.waitForPattern ? 'text-amber-400' : 'text-even'
            }`}>
              {overUnderResult.entryPattern}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Entry digits: [{overUnderResult.entryDigits.join(', ')}]
            </div>
          </div>
          
          {/* Live digits */}
          <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground">Last 10 Digits (Live)</div>
            <div className="flex gap-1.5 justify-center">
              {lastDigits.map(({ digit, epoch }) => (
                <motion.div
                  key={epoch}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold ${
                    digit >= 5 
                      ? 'bg-over/20 text-over border border-over/30' 
                      : 'bg-under/20 text-under border border-under/30'
                  }`}
                >
                  {digit}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const OverUnderSignals = () => {
  const navigate = useNavigate();
  const { tickData, isConnected, symbols } = useDerivWebSocket();

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-over/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-under/5 rounded-full blur-3xl" />
      </div>

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 glass border-b border-border"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-over to-under flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Over/Under Signals</h1>
                <p className="text-xs text-muted-foreground">Predict high or low digits</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-even" />
                    <span className="text-sm text-even font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-destructive" />
                    <span className="text-sm text-destructive font-medium">Disconnected</span>
                  </>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {symbols.map((symbol, index) => (
            <motion.div
              key={symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <OverUnderCard
                symbol={symbol}
                ticks={tickData[symbol]?.ticks || []}
                isConnected={tickData[symbol]?.isConnected || false}
              />
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
};