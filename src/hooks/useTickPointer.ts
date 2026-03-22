import { useState, useEffect, useCallback } from 'react';
import { tickPointerService, TickData, DigitStats } from '@/services/tick-pointer.service';

export const useTickPointer = (symbol: string, enabled: boolean = true) => {
    const [currentTick, setCurrentTick] = useState<TickData | null>(null);
    const [tickHistory, setTickHistory] = useState<TickData[]>([]);
    const [digitStats, setDigitStats] = useState<DigitStats[]>([]);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled || !symbol) {
            return;
        }

        let mounted = true;

        const subscribe = async () => {
            try {
                await tickPointerService.subscribeTo(symbol, tick => {
                    if (mounted) {
                        setCurrentTick(tick);
                        setTickHistory(tickPointerService.getTickHistory(50));
                        setDigitStats(tickPointerService.getDigitStats());
                    }
                });
                if (mounted) {
                    setIsSubscribed(true);
                    setError(null);
                }
            } catch (err: any) {
                if (mounted) {
                    setError(err.message || 'Failed to subscribe to ticks');
                    setIsSubscribed(false);
                }
            }
        };

        subscribe();

        return () => {
            mounted = false;
            tickPointerService.unsubscribe();
            setIsSubscribed(false);
        };
    }, [symbol, enabled]);

    const getLastDigits = useCallback((count: number) => {
        return tickPointerService.getLastDigits(count);
    }, []);

    const getHotDigits = useCallback((topN: number = 3) => {
        return tickPointerService.getHotDigits(topN);
    }, []);

    const getColdDigits = useCallback((topN: number = 3) => {
        return tickPointerService.getColdDigits(topN);
    }, []);

    const isHotDigit = useCallback((digit: number, withinLast: number = 10) => {
        return tickPointerService.isHotDigit(digit, withinLast);
    }, []);

    const isColdDigit = useCallback((digit: number, withinLast: number = 20) => {
        return tickPointerService.isColdDigit(digit, withinLast);
    }, []);

    return {
        currentTick,
        tickHistory,
        digitStats,
        isSubscribed,
        error,
        getLastDigits,
        getHotDigits,
        getColdDigits,
        isHotDigit,
        isColdDigit,
        totalTicks: tickPointerService.getTotalTicks(),
    };
};
