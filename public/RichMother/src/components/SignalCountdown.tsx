import { motion } from 'framer-motion';
import { Clock, Radio, Loader2 } from 'lucide-react';

interface SignalCountdownProps {
  phase: 'collecting' | 'signal';
  countdown: number;
  collectedCount: number;
}

export const SignalCountdown = ({ phase, countdown, collectedCount }: SignalCountdownProps) => {
  const isCollecting = phase === 'collecting';
  const progress = isCollecting 
    ? ((30 - countdown) / 30) * 100 
    : ((10 - countdown) / 10) * 100;

  return (
    <div className="space-y-3">
      {/* Phase Badge */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          isCollecting 
            ? 'bg-blue-500/20 text-blue-400' 
            : 'bg-even/20 text-even'
        }`}>
          {isCollecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Scanning Market</span>
            </>
          ) : (
            <>
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Signal Active</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-mono text-lg font-bold text-foreground">
            {countdown}s
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${
            isCollecting 
              ? 'bg-gradient-to-r from-blue-500 to-primary' 
              : 'bg-gradient-to-r from-even to-emerald-400'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Status Text */}
      <p className="text-xs text-muted-foreground text-center">
        {isCollecting ? (
          <>Collecting ticks... <span className="font-mono text-foreground">{collectedCount}</span> collected</>
        ) : (
          <>Next scan in <span className="font-mono text-foreground">{countdown}</span> seconds</>
        )}
      </p>
    </div>
  );
};
