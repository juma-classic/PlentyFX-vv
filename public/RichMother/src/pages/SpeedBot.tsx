import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Home, Zap, Play, Pause, RotateCcw, TrendingUp, TrendingDown, Hash, ChevronDown, Settings, Target, Layers, Shuffle, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useDerivWebSocket } from '@/hooks/useDerivWebSocket';

interface Trade {
  id: string;
  symbol: string;
  digit: number;
  prediction: 'even' | 'odd' | 'over' | 'under' | 'match' | 'differs';
  barrier?: number;
  targetDigit?: number;
  timestamp: number;
  result?: 'win' | 'loss';
  nextDigit?: number;
  stake: number;
  payout?: number;
  profit?: number;
}

const symbolNames: Record<string, string> = {
  'R_10': 'V10',
  'R_25': 'V25',
  'R_50': 'V50',
  'R_75': 'V75',
  'R_100': 'V100',
  '1HZ10V': 'V10 (1s)',
  '1HZ25V': 'V25 (1s)',
  '1HZ50V': 'V50 (1s)',
  '1HZ75V': 'V75 (1s)',
  '1HZ100V': 'V100 (1s)',
};

type TradeType = 'even' | 'odd' | 'over' | 'under' | 'differs' | 'match';
type TradeMode = 'even-odd' | 'over-under' | 'digit-match';
type EvenOddDirection = 'even' | 'odd';
type OverUnderDirection = 'over' | 'under' | 'both';

export const SpeedBot = () => {
  const navigate = useNavigate();
  const { tickData, isConnected } = useDerivWebSocket();
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('1HZ100V');
  const [tradeMode, setTradeMode] = useState<TradeMode>('even-odd');
  const [evenOddDirection, setEvenOddDirection] = useState<EvenOddDirection>('even');
  const [overUnderDirection, setOverUnderDirection] = useState<OverUnderDirection>('over');
  const [barrier, setBarrier] = useState<number>(4);
  const [targetDigit, setTargetDigit] = useState<number>(5);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [lastProcessedEpoch, setLastProcessedEpoch] = useState<number>(0);
  
  // Stake & Martingale settings
  const [baseStake, setBaseStake] = useState<number>(1);
  const [currentStake, setCurrentStake] = useState<number>(1);
  const [martingaleEnabled, setMartingaleEnabled] = useState<boolean>(false);
  const [martingaleMultiplier, setMartingaleMultiplier] = useState<number>(2);
  const [maxMartingaleSteps, setMaxMartingaleSteps] = useState<number>(5);
  const [consecutiveLosses, setConsecutiveLosses] = useState<number>(0);

  // Sample size for digit analysis (adjustable)
  const [sampleSize, setSampleSize] = useState<number>(1000);

  // Strategy settings
  const [strategyOpen, setStrategyOpen] = useState<boolean>(false);
  const [useEntryPattern, setUseEntryPattern] = useState<boolean>(false);
  const [entryPattern, setEntryPattern] = useState<string>('OOOEOEO');
  const [useEntryPoints, setUseEntryPoints] = useState<boolean>(false);
  const [entryPoints, setEntryPoints] = useState<string>('012');
  const [patternIndex, setPatternIndex] = useState<number>(0);

  // Stop conditions
  const [stopOnWins, setStopOnWins] = useState<boolean>(false);
  const [stopWinsCount, setStopWinsCount] = useState<number>(5);
  const [stopOnLosses, setStopOnLosses] = useState<boolean>(false);
  const [stopLossesCount, setStopLossesCount] = useState<number>(3);

  // Trade type switcher - now supports multiple selections
  const [activeTradeTypes, setActiveTradeTypes] = useState<TradeType[]>(['over']);
  
  // Switch on loss feature
  const [switchOnLoss, setSwitchOnLoss] = useState<boolean>(false);
  const [originalTradeTypes, setOriginalTradeTypes] = useState<TradeType[]>(['over']);
  const [recoveryTradeType, setRecoveryTradeType] = useState<TradeType>('even');
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const allTradeTypes: TradeType[] = ['over', 'under', 'even', 'odd', 'differs', 'match'];
  
  // Simultaneous trades
  const [simultaneousTrades, setSimultaneousTrades] = useState<number>(1);
  
  // Toggle a trade type in the multi-select
  const toggleTradeType = (type: TradeType) => {
    setActiveTradeTypes(prev => {
      if (prev.includes(type)) {
        // Don't allow removing if it's the only one
        if (prev.length === 1) return prev;
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
    // Update original types if not recovering
    if (!isRecovering) {
      setOriginalTradeTypes(prev => {
        if (prev.includes(type)) {
          if (prev.length === 1) return prev;
          return prev.filter(t => t !== type);
        }
        return [...prev, type];
      });
    }
  };

  const currentTicks = tickData[selectedSymbol]?.ticks || [];
  const latestTick = currentTicks[currentTicks.length - 1];
  // Extract 2nd decimal place digit
  const currentDigit = latestTick ? (() => {
    const str = latestTick.quote.toFixed(5);
    const decimalIndex = str.indexOf('.');
    return decimalIndex !== -1 ? parseInt(str[decimalIndex + 2] || '0', 10) : 0;
  })() : null;
  
  // Calculate digit statistics from recent ticks
  const digitStats = useMemo(() => {
    const ticks = currentTicks.slice(-sampleSize);
    const counts = Array(10).fill(0);
    ticks.forEach(tick => {
      // Extract 2nd decimal place digit
      const str = tick.quote.toFixed(5);
      const decimalIndex = str.indexOf('.');
      const digit = decimalIndex !== -1 ? parseInt(str[decimalIndex + 2] || '0', 10) : 0;
      counts[digit]++;
    });
    const total = ticks.length || 1;
    return counts.map((count, digit) => ({
      digit,
      count,
      percentage: ((count / total) * 100).toFixed(1)
    }));
  }, [currentTicks, sampleSize]);
  
  // Exact Deriv payout rates (actual platform values)
  const getPayoutRate = useCallback((prediction: string, barrierValue?: number): number => {
    // Even/Odd: 50% win probability = ~95% payout
    if (prediction === 'even' || prediction === 'odd') return 0.952;
    
    // Matches: 10% win probability = ~900% payout  
    if (prediction === 'match') return 9.30;
    
    // Differs: 90% win probability = ~10.5% payout
    if (prediction === 'differs') return 0.105;
    
    const b = barrierValue ?? barrier;
    
    // Over payouts (exact Deriv rates based on probability)
    // Over 0: wins 90% (digits 1-9) = 10.5% payout
    // Over 9: wins 0% (impossible) - not tradeable, but included for consistency
    const overPayouts: Record<number, number> = {
      0: 0.105,  // 90% win rate
      1: 0.236,  // 80% win rate
      2: 0.394,  // 70% win rate
      3: 0.588,  // 60% win rate
      4: 0.847,  // 50% win rate
      5: 1.212,  // 40% win rate
      6: 1.766,  // 30% win rate
      7: 2.649,  // 20% win rate
      8: 4.720,  // 10% win rate
      9: 9.30    // Not tradeable (0% win)
    };
    
    // Under payouts (exact Deriv rates based on probability)
    // Under 0: wins 0% (impossible) - not tradeable
    // Under 9: wins 90% (digits 0-8) = 10.5% payout
    const underPayouts: Record<number, number> = {
      0: 9.30,   // Not tradeable (0% win)
      1: 4.720,  // 10% win rate
      2: 2.649,  // 20% win rate
      3: 1.766,  // 30% win rate
      4: 1.212,  // 40% win rate
      5: 0.847,  // 50% win rate
      6: 0.588,  // 60% win rate
      7: 0.394,  // 70% win rate
      8: 0.236,  // 80% win rate
      9: 0.105   // 90% win rate
    };
    
    if (prediction === 'over') return overPayouts[b] ?? 0.952;
    if (prediction === 'under') return underPayouts[b] ?? 0.952;
    return 0.952;
  }, [barrier]);

  // Check if we should enter a trade based on strategy
  const shouldEnterTrade = useCallback((digit: number): boolean => {
    // Check entry points first
    if (useEntryPoints && entryPoints.trim()) {
      const points = entryPoints.split(',').flatMap(p => p.trim().split('').map(Number));
      if (!points.includes(digit)) {
        return false;
      }
    }
    
    // Check entry pattern
    if (useEntryPattern && entryPattern.trim()) {
      const patterns = entryPattern.split(',').map(p => p.trim().toUpperCase());
      // Build the recent pattern from trades
      const recentResults = trades.slice(0, patterns[0]?.length || 7)
        .filter(t => t.result)
        .map(t => t.result === 'win' ? 'O' : 'E')
        .reverse()
        .join('');
      
      // Check if any pattern matches
      const patternMatches = patterns.some(p => recentResults.endsWith(p) || recentResults.length < p.length);
      if (!patternMatches && recentResults.length >= (patterns[0]?.length || 1)) {
        return false;
      }
    }
    
    return true;
  }, [useEntryPattern, entryPattern, useEntryPoints, entryPoints, trades]);

  // Get the 2nd decimal place digit from a quote
  const getLastDigit = useCallback((quote: number): number => {
    const str = quote.toFixed(5);
    const decimalIndex = str.indexOf('.');
    return decimalIndex !== -1 ? parseInt(str[decimalIndex + 2] || '0', 10) : 0;
  }, []);

  // Use ref to track consecutive losses to avoid closure issues
  const consecutiveLossesRef = React.useRef(consecutiveLosses);
  consecutiveLossesRef.current = consecutiveLosses;

  // Process new ticks and create trades
  useEffect(() => {
    if (!isRunning || !latestTick || latestTick.epoch === lastProcessedEpoch) return;

    const digit = getLastDigit(latestTick.quote);
    
    // First resolve any pending trades and calculate new consecutive losses
    setTrades(prev => {
      let newConsecutiveLosses = consecutiveLossesRef.current;
      let sessionWins = prev.filter(t => t.result === 'win').length;
      let sessionLosses = prev.filter(t => t.result === 'loss').length;
      
      const updated = prev.map(trade => {
        if (!trade.result && trade.symbol === selectedSymbol) {
          // Resolve the trade
          let isWin = false;
          if (trade.prediction === 'even') isWin = digit % 2 === 0;
          else if (trade.prediction === 'odd') isWin = digit % 2 !== 0;
          else if (trade.prediction === 'over') isWin = digit > (trade.barrier ?? barrier);
          else if (trade.prediction === 'under') isWin = digit < (trade.barrier ?? barrier);
          else if (trade.prediction === 'match') isWin = digit === trade.targetDigit;
          else if (trade.prediction === 'differs') isWin = digit !== trade.targetDigit;
          
          const payoutRate = getPayoutRate(trade.prediction, trade.barrier);
          const profit = isWin ? trade.stake * payoutRate : -trade.stake;
          
          // Update consecutive losses based on this trade
          if (isWin) {
            newConsecutiveLosses = 0;
            sessionWins++;
            // If recovering and we win, revert to original trade types
            if (switchOnLoss && isRecovering) {
              setTimeout(() => {
                setActiveTradeTypes(originalTradeTypes);
                setIsRecovering(false);
              }, 0);
            }
          } else {
            newConsecutiveLosses++;
            sessionLosses++;
            // If switch on loss is enabled, switch to the user-selected recovery trade type
            if (switchOnLoss && !isRecovering) {
              setTimeout(() => {
                setActiveTradeTypes([recoveryTradeType]);
                setIsRecovering(true);
              }, 0);
            }
          }
          
          return { ...trade, result: isWin ? 'win' : 'loss', nextDigit: digit, profit } as Trade;
        }
        return trade;
      });

      // Check stop conditions
      if (stopOnWins && sessionWins >= stopWinsCount) {
        setTimeout(() => setIsRunning(false), 0);
        return updated;
      }
      if (stopOnLosses && sessionLosses >= stopLossesCount) {
        setTimeout(() => setIsRunning(false), 0);
        return updated;
      }
      
      // Reset if exceeded max steps
      if (martingaleEnabled && newConsecutiveLosses > maxMartingaleSteps) {
        newConsecutiveLosses = 0;
      }

      // Check if we should enter based on strategy
      if (!shouldEnterTrade(digit)) {
        setTimeout(() => {
          setConsecutiveLosses(newConsecutiveLosses);
          setCurrentStake(martingaleEnabled ? baseStake * Math.pow(martingaleMultiplier, newConsecutiveLosses) : baseStake);
        }, 0);
        return updated;
      }

      // Create new trade(s)
      const newTrades: Trade[] = [];
      const timestamp = Date.now();
      
      // Calculate stake with martingale using the updated consecutive losses
      let tradeStake = baseStake;
      if (martingaleEnabled && newConsecutiveLosses > 0) {
        tradeStake = baseStake * Math.pow(martingaleMultiplier, newConsecutiveLosses);
      }

      // Create trades for all active trade types (multi-select support)
      // Also create multiple simultaneous trades per trade type
      for (let tradeNum = 0; tradeNum < simultaneousTrades; tradeNum++) {
        activeTradeTypes.forEach((tradeType, index) => {
          if (tradeType === 'even' || tradeType === 'odd') {
            newTrades.push({
              id: `${timestamp}-${index}-${tradeNum}-${Math.random()}`,
              symbol: selectedSymbol,
              digit,
              prediction: tradeType,
              timestamp,
              stake: tradeStake,
            });
          } else if (tradeType === 'over' || tradeType === 'under') {
            newTrades.push({
              id: `${timestamp}-${index}-${tradeNum}-${Math.random()}`,
              symbol: selectedSymbol,
              digit,
              prediction: tradeType,
              barrier,
              timestamp,
              stake: tradeStake,
            });
          } else if (tradeType === 'differs') {
            newTrades.push({
              id: `${timestamp}-${index}-${tradeNum}-${Math.random()}`,
              symbol: selectedSymbol,
              digit,
              prediction: 'differs',
              targetDigit: barrier,
              timestamp,
              stake: tradeStake,
            });
          } else if (tradeType === 'match') {
            newTrades.push({
              id: `${timestamp}-${index}-${tradeNum}-${Math.random()}`,
              symbol: selectedSymbol,
              digit,
              prediction: 'match',
              targetDigit: barrier,
              timestamp,
              stake: tradeStake,
            });
          }
        });
      }

      // Update state after processing
      setTimeout(() => {
        setConsecutiveLosses(newConsecutiveLosses);
        setCurrentStake(martingaleEnabled ? baseStake * Math.pow(martingaleMultiplier, newConsecutiveLosses) : baseStake);
      }, 0);

      return [...newTrades, ...updated].slice(0, 100); // Keep last 100 trades
    });
    
    setLastProcessedEpoch(latestTick.epoch);
  }, [latestTick, isRunning, selectedSymbol, lastProcessedEpoch, getLastDigit, activeTradeTypes, barrier, targetDigit, baseStake, martingaleEnabled, martingaleMultiplier, maxMartingaleSteps, getPayoutRate, shouldEnterTrade, stopOnWins, stopWinsCount, stopOnLosses, stopLossesCount, switchOnLoss, isRecovering, originalTradeTypes, recoveryTradeType, simultaneousTrades]);

  // Stats
  const stats = useMemo(() => {
    const resolved = trades.filter(t => t.result);
    const wins = resolved.filter(t => t.result === 'win').length;
    const losses = resolved.filter(t => t.result === 'loss').length;
    const winRate = resolved.length > 0 ? (wins / resolved.length * 100).toFixed(1) : '0.0';
    const totalProfit = resolved.reduce((sum, t) => sum + (t.profit || 0), 0);
    return { wins, losses, total: resolved.length, winRate, totalProfit };
  }, [trades]);

  const resetStats = () => {
    setTrades([]);
    setLastProcessedEpoch(0);
    setConsecutiveLosses(0);
    setCurrentStake(baseStake);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 glass border-b border-border"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Speed Bot</h1>
                <p className="text-xs text-muted-foreground">Every Digit Trading Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-6">
        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          {/* Symbol Selection */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Select Market</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(symbolNames).map(([symbol, name]) => (
                <Button
                  key={symbol}
                  variant={selectedSymbol === symbol ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSymbol(symbol)}
                  className="text-xs"
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>

          {/* Trade Type Switcher */}
          {/* Trade Type Multi-Select */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Trade Types (select multiple)</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeTradeTypes.includes('over') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleTradeType('over')}
                className="min-w-[80px]"
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                OVER
                {activeTradeTypes.includes('over') && <CheckSquare className="w-3 h-3 ml-1" />}
              </Button>
              <Button
                variant={activeTradeTypes.includes('under') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleTradeType('under')}
                className="min-w-[80px]"
              >
                <TrendingDown className="w-4 h-4 mr-1" />
                UNDER
                {activeTradeTypes.includes('under') && <CheckSquare className="w-3 h-3 ml-1" />}
              </Button>
              <Button
                variant={activeTradeTypes.includes('even') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleTradeType('even')}
                className="min-w-[80px]"
              >
                <Activity className="w-4 h-4 mr-1" />
                EVEN
                {activeTradeTypes.includes('even') && <CheckSquare className="w-3 h-3 ml-1" />}
              </Button>
              <Button
                variant={activeTradeTypes.includes('odd') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleTradeType('odd')}
                className="min-w-[80px]"
              >
                <Activity className="w-4 h-4 mr-1" />
                ODD
                {activeTradeTypes.includes('odd') && <CheckSquare className="w-3 h-3 ml-1" />}
              </Button>
              <Button
                variant={activeTradeTypes.includes('differs') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleTradeType('differs')}
                className="min-w-[80px]"
              >
                <Shuffle className="w-4 h-4 mr-1" />
                DIFFERS
                {activeTradeTypes.includes('differs') && <CheckSquare className="w-3 h-3 ml-1" />}
              </Button>
              <Button
                variant={activeTradeTypes.includes('match') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleTradeType('match')}
                className="min-w-[80px]"
              >
                <Hash className="w-4 h-4 mr-1" />
                MATCHES
                {activeTradeTypes.includes('match') && <CheckSquare className="w-3 h-3 ml-1" />}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
              <p className="text-xs text-muted-foreground">
                Active: {activeTradeTypes.map(t => t.toUpperCase()).join(' + ')}
                {isRecovering && <span className="text-yellow-500 ml-2">(Recovering with {recoveryTradeType.toUpperCase()})</span>}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="switchOnLoss"
                    checked={switchOnLoss}
                    onCheckedChange={(checked) => {
                      setSwitchOnLoss(checked);
                      if (checked) {
                        setOriginalTradeTypes([...activeTradeTypes]);
                      } else {
                        setIsRecovering(false);
                      }
                    }}
                  />
                  <Label htmlFor="switchOnLoss" className="text-xs text-muted-foreground">Switch on Loss</Label>
                </div>
                {switchOnLoss && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        Recovery: {recoveryTradeType.toUpperCase()}
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-background border border-border">
                      {allTradeTypes.map(type => (
                        <DropdownMenuItem 
                          key={type} 
                          onClick={() => setRecoveryTradeType(type)}
                          className={recoveryTradeType === type ? 'bg-primary/20' : ''}
                        >
                          {type.toUpperCase()}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>

          {/* Barrier Selection for Over/Under/Differs/Matches */}
          {(activeTradeTypes.includes('over') || activeTradeTypes.includes('under') || activeTradeTypes.includes('differs') || activeTradeTypes.includes('match')) && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Barrier / Target Digit
              </p>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                  <Button
                    key={d}
                    variant={barrier === d ? 'default' : 'outline'}
                    size="sm"
                    className="w-10 h-10 p-0"
                    onClick={() => setBarrier(d)}
                  >
                    {d}
                  </Button>
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                {activeTradeTypes.includes('over') && (
                  <p>• OVER {barrier}: Wins if next digit {'>'} {barrier} — Payout: <span className="text-green-500 font-mono">{(getPayoutRate('over', barrier) * 100).toFixed(1)}%</span></p>
                )}
                {activeTradeTypes.includes('under') && (
                  <p>• UNDER {barrier}: Wins if next digit {'<'} {barrier} — Payout: <span className="text-green-500 font-mono">{(getPayoutRate('under', barrier) * 100).toFixed(1)}%</span></p>
                )}
                {activeTradeTypes.includes('differs') && (
                  <p>• DIFFERS {barrier}: Wins if next digit ≠ {barrier} — Payout: <span className="text-green-500 font-mono">{(getPayoutRate('differs') * 100).toFixed(1)}%</span></p>
                )}
                {activeTradeTypes.includes('match') && (
                  <p>• MATCHES {barrier}: Wins if next digit = {barrier} — Payout: <span className="text-green-500 font-mono">{(getPayoutRate('match') * 100).toFixed(1)}%</span></p>
                )}
              </div>
              
              {/* Simultaneous Trades */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Simultaneous Trades</Label>
                    <p className="text-xs text-muted-foreground">Place multiple identical trades per tick</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setSimultaneousTrades(Math.max(1, simultaneousTrades - 1))}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-mono font-bold">{simultaneousTrades}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setSimultaneousTrades(Math.min(10, simultaneousTrades + 1))}
                    >
                      +
                    </Button>
                  </div>
                </div>
                {simultaneousTrades > 1 && (
                  <p className="text-xs text-yellow-500 mt-2">
                    ⚠️ {simultaneousTrades} trades × {activeTradeTypes.length} type(s) = {simultaneousTrades * activeTradeTypes.length} trades per tick @ ${currentStake.toFixed(2)} each = ${(simultaneousTrades * activeTradeTypes.length * currentStake).toFixed(2)} total stake
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Strategy Dropdown */}
          <Collapsible open={strategyOpen} onOpenChange={setStrategyOpen} className="mb-4">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>Strategy</span>
                  {(useEntryPattern || useEntryPoints) && (
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${strategyOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 p-4 bg-muted/30 rounded-lg space-y-4">
              {/* Entry Pattern */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="useEntryPattern" 
                    checked={useEntryPattern} 
                    onCheckedChange={(checked) => setUseEntryPattern(checked as boolean)} 
                  />
                  <Label htmlFor="useEntryPattern" className="text-sm font-medium">Use Entry Pattern</Label>
                </div>
                {useEntryPattern && (
                  <div className="ml-6 space-y-1">
                    <Label className="text-xs text-muted-foreground">Entry Patterns</Label>
                    <Input
                      value={entryPattern}
                      onChange={(e) => setEntryPattern(e.target.value)}
                      placeholder="OOOEOEO"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">O = Win, E = Loss. Separated by comma (e.g., OOEE,EEOO)</p>
                  </div>
                )}
              </div>

              {/* Entry Points */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="useEntryPoints" 
                    checked={useEntryPoints} 
                    onCheckedChange={(checked) => setUseEntryPoints(checked as boolean)} 
                  />
                  <Label htmlFor="useEntryPoints" className="text-sm font-medium">Use Entry Points</Label>
                </div>
                {useEntryPoints && (
                  <div className="ml-6 space-y-1">
                    <Label className="text-xs text-muted-foreground">Entry Points</Label>
                    <Input
                      value={entryPoints}
                      onChange={(e) => setEntryPoints(e.target.value)}
                      placeholder="012"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">Only trade when digit is one of these (e.g., 012 or 7,1,7,0)</p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Stop Conditions */}
          <div className="mb-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Stop Conditions</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="stopOnWins" 
                    checked={stopOnWins} 
                    onCheckedChange={(checked) => setStopOnWins(checked as boolean)} 
                  />
                  <Label htmlFor="stopOnWins" className="text-sm">Stop on Wins</Label>
                </div>
                {stopOnWins && (
                  <Input
                    type="number"
                    min="1"
                    value={stopWinsCount}
                    onChange={(e) => setStopWinsCount(parseInt(e.target.value) || 5)}
                    className="w-24"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="stopOnLosses" 
                    checked={stopOnLosses} 
                    onCheckedChange={(checked) => setStopOnLosses(checked as boolean)} 
                  />
                  <Label htmlFor="stopOnLosses" className="text-sm">Stop on Losses</Label>
                </div>
                {stopOnLosses && (
                  <Input
                    type="number"
                    min="1"
                    value={stopLossesCount}
                    onChange={(e) => setStopLossesCount(parseInt(e.target.value) || 3)}
                    className="w-24"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Stake & Martingale Settings */}
          <div className="mb-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Stake Settings</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Base Stake ($)</Label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={baseStake}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 1;
                    setBaseStake(val);
                    if (!martingaleEnabled) setCurrentStake(val);
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Current Stake</Label>
                <div className="mt-1 h-10 flex items-center px-3 bg-muted rounded-md text-foreground font-mono">
                  ${currentStake.toFixed(2)}
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="martingale"
                    checked={martingaleEnabled}
                    onCheckedChange={(checked) => {
                      setMartingaleEnabled(checked);
                      if (!checked) {
                        setCurrentStake(baseStake);
                        setConsecutiveLosses(0);
                      }
                    }}
                  />
                  <Label htmlFor="martingale" className="text-sm">Martingale</Label>
                </div>
              </div>
              {martingaleEnabled && (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground">Multiplier</Label>
                    <Input
                      type="number"
                      min="1.5"
                      max="5"
                      step="0.5"
                      value={martingaleMultiplier}
                      onChange={(e) => setMartingaleMultiplier(parseFloat(e.target.value) || 2)}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </div>
            {martingaleEnabled && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Max Steps</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={maxMartingaleSteps}
                    onChange={(e) => setMaxMartingaleSteps(parseInt(e.target.value) || 5)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Consecutive Losses</Label>
                  <div className="mt-1 h-10 flex items-center px-3 bg-muted rounded-md text-foreground font-mono">
                    {consecutiveLosses} / {maxMartingaleSteps}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Start/Stop Controls */}
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              onClick={() => setIsRunning(!isRunning)}
              className={isRunning 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
              }
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Stop Bot
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start Bot
                </>
              )}
            </Button>
            <Button variant="outline" onClick={resetStats}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Stats
            </Button>
            
            {tradeMode === 'over-under' && overUnderDirection === 'both' && (
              <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 px-3 py-1">
                Dual Trading Active
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Stats - Collapsible */}
        <Collapsible defaultOpen={false} className="mb-6">
          <CollapsibleTrigger className="flex items-center justify-between w-full glass rounded-xl p-3 mb-2 hover:bg-muted/50 transition-colors">
            <span className="text-sm font-medium text-muted-foreground">Trading Statistics</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-xl p-4 text-center"
              >
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Trades</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-xl p-4 text-center"
              >
                <p className="text-2xl font-bold text-green-500">{stats.wins}</p>
                <p className="text-xs text-muted-foreground">Wins</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-xl p-4 text-center"
              >
                <p className="text-2xl font-bold text-red-500">{stats.losses}</p>
                <p className="text-xs text-muted-foreground">Losses</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="glass rounded-xl p-4 text-center"
              >
                <p className={`text-2xl font-bold ${parseFloat(stats.winRate) >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.winRate}%
                </p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="glass rounded-xl p-4 text-center"
              >
                <p className={`text-2xl font-bold font-mono ${stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Total P/L ($)</p>
              </motion.div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Digit Analysis Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Digit Analysis (Last {Math.min(currentTicks.length, sampleSize)} of {sampleSize} Ticks)
            </h3>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Sample Size:</Label>
              <Input
                type="number"
                min="10"
                max="10000"
                step="100"
                value={sampleSize}
                onChange={(e) => setSampleSize(parseInt(e.target.value) || 1000)}
                className="w-24 h-8 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {digitStats.map(({ digit, count, percentage }) => {
              const isEven = digit % 2 === 0;
              const isHot = parseFloat(percentage) > 12;
              const isCold = parseFloat(percentage) < 8;
              const isCurrent = currentDigit === digit;
              return (
                <motion.div
                  key={digit}
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className={`relative p-3 rounded-lg text-center transition-all ${
                    isCurrent
                      ? 'bg-primary/30 border-2 border-primary shadow-lg shadow-primary/20'
                      : isHot 
                        ? 'bg-green-500/20 border border-green-500/40' 
                        : isCold 
                          ? 'bg-red-500/20 border border-red-500/40'
                          : 'bg-muted/50 border border-muted'
                  }`}
                >
                  {isCurrent && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold"
                    >
                      NOW
                    </motion.div>
                  )}
                  <p className={`text-xl font-bold ${isEven ? 'text-even' : 'text-odd'}`}>
                    {digit}
                  </p>
                  <p className={`text-sm font-semibold ${
                    isHot ? 'text-green-500' : isCold ? 'text-red-500' : 'text-foreground'
                  }`}>
                    {percentage}%
                  </p>
                  <p className="text-xs text-muted-foreground">{count}</p>
                </motion.div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-primary/50 border border-primary"></span> Current
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500/30"></span> Hot (&gt;12%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-500/30"></span> Cold (&lt;8%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-even/30"></span> Even
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-odd/30"></span> Odd
            </span>
          </div>
        </motion.div>

        {/* Current Digit Display */}
        {latestTick && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 mb-6 text-center"
          >
            <p className="text-sm text-muted-foreground mb-2">Current Price</p>
            <p className="text-4xl font-mono font-bold text-foreground mb-2">
              {latestTick.quote.toFixed(4)}
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Last Digit:</span>
              <span className="text-3xl font-bold text-primary">
                {getLastDigit(latestTick.quote)}
              </span>
            </div>
          </motion.div>
        )}

        {/* Trade History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Trade History</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {trades.map((trade) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-bold text-foreground">
                      {trade.digit}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {trade.prediction.toUpperCase()}
                      {(trade.prediction === 'over' || trade.prediction === 'under' || trade.prediction === 'differs') && ` ${trade.barrier ?? trade.targetDigit}`}
                      {trade.prediction === 'match' && ` → ${trade.targetDigit}`}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(trade.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {trade.result ? (
                      <>
                        <span className="text-sm text-muted-foreground">
                          Next: {trade.nextDigit}
                        </span>
                        <span
                          className={`font-mono font-bold text-sm px-2 py-1 rounded ${
                            trade.result === 'win' 
                              ? 'bg-green-500/20 text-green-500' 
                              : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {trade.profit !== undefined 
                            ? (trade.profit >= 0 ? '+' : '') + trade.profit.toFixed(2)
                            : trade.result === 'win' ? '+' + (trade.stake * 0.95).toFixed(2) : '-' + trade.stake.toFixed(2)
                          }
                        </span>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                        PENDING (${trade.stake.toFixed(2)})
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {trades.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {isRunning ? 'Waiting for first tick...' : 'Start the bot to begin trading'}
              </p>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};
