import { useState, useEffect, useCallback, useRef } from 'react';
import { Tick } from '@/utils/predictions';

const COLLECTION_TIME = 30; // 30 seconds to collect ticks
const SIGNAL_TIME = 20; // 20 seconds to show signal

type CyclePhase = 'collecting' | 'signal';

interface SignalCycleState {
  phase: CyclePhase;
  countdown: number;
  signalTicks: Tick[];
}

export const useSignalCycle = (ticks: Tick[]) => {
  const [state, setState] = useState<SignalCycleState>({
    phase: 'collecting',
    countdown: COLLECTION_TIME,
    signalTicks: [],
  });
  
  const cycleStartRef = useRef<number>(Date.now());
  const ticksAtSignalRef = useRef<Tick[]>([]);

  const startNewCycle = useCallback(() => {
    cycleStartRef.current = Date.now();
    setState({
      phase: 'collecting',
      countdown: COLLECTION_TIME,
      signalTicks: [],
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - cycleStartRef.current) / 1000);
      
      if (state.phase === 'collecting') {
        const remaining = COLLECTION_TIME - elapsed;
        
        if (remaining <= 0) {
          // Transition to signal phase - capture current ticks
          ticksAtSignalRef.current = [...ticks].slice(-30);
          cycleStartRef.current = Date.now();
          setState({
            phase: 'signal',
            countdown: SIGNAL_TIME,
            signalTicks: ticksAtSignalRef.current,
          });
        } else {
          setState(prev => ({
            ...prev,
            countdown: remaining,
          }));
        }
      } else {
        // Signal phase
        const remaining = SIGNAL_TIME - elapsed;
        
        if (remaining <= 0) {
          // Start new collection cycle
          startNewCycle();
        } else {
          setState(prev => ({
            ...prev,
            countdown: remaining,
          }));
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [state.phase, ticks, startNewCycle]);

  return {
    phase: state.phase,
    countdown: state.countdown,
    signalTicks: state.phase === 'signal' ? state.signalTicks : ticks.slice(-30),
    collectedCount: ticks.length,
    isReady: state.phase === 'signal' && state.signalTicks.length >= 30,
  };
};
