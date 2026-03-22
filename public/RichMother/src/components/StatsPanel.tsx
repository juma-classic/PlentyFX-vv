import { motion, AnimatePresence } from 'framer-motion';
import { Tick, getLastDigit } from '@/utils/predictions';

interface StatsPanelProps {
  ticks: Tick[];
  evenCount: number;
  oddCount: number;
  total: number;
  liveTicks?: Tick[]; // Live ticks for animated digit display
}

export const StatsPanel = ({ ticks, evenCount, oddCount, total, liveTicks }: StatsPanelProps) => {
  // Use liveTicks for animated display, fallback to signal ticks
  const displayTicks = liveTicks || ticks;
  const lastDigits = displayTicks.slice(-10).map(t => ({
    digit: getLastDigit(t.quote),
    epoch: t.epoch
  }));
  
  const evenPercentage = total > 0 ? Math.round((evenCount / total) * 100) : 50;
  const oddPercentage = total > 0 ? Math.round((oddCount / total) * 100) : 50;

  return (
    <div className="space-y-3">
      {/* Even/Odd Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-even font-medium">Even {evenPercentage}%</span>
          <span className="text-odd font-medium">Odd {oddPercentage}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden flex">
          <motion.div
            className="bg-even h-full"
            initial={{ width: '50%' }}
            animate={{ width: `${evenPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="bg-odd h-full"
            initial={{ width: '50%' }}
            animate={{ width: `${oddPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted/50 rounded-lg p-2">
          <div className="text-lg font-bold text-even">{evenCount}</div>
          <div className="text-xs text-muted-foreground">Even</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-2">
          <div className="text-lg font-bold text-odd">{oddCount}</div>
          <div className="text-xs text-muted-foreground">Odd</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-2">
          <div className="text-lg font-bold text-foreground">{total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
      </div>

      {/* Last Digits - Live Animated */}
      <div className="space-y-1.5">
        <div className="text-xs text-muted-foreground">Last 10 Digits (Live)</div>
        <div className="flex gap-1.5 justify-center overflow-hidden">
          <AnimatePresence mode="popLayout">
            {lastDigits.map(({ digit, epoch }) => (
              <motion.div
                key={epoch}
                initial={{ scale: 0, opacity: 0, x: 20 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0.5, opacity: 0, x: -20 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold ${
                  digit % 2 === 0 
                    ? 'bg-even/20 text-even border border-even/30' 
                    : 'bg-odd/20 text-odd border border-odd/30'
                }`}
              >
                {digit}
              </motion.div>
            ))}
          </AnimatePresence>
          {lastDigits.length === 0 && (
            <span className="text-muted-foreground text-xs">Waiting...</span>
          )}
        </div>
      </div>
    </div>
  );
};