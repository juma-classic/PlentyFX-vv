import { useCallback,useEffect, useState } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - No types available for this package
import DerivAPIBasic from '@deriv/deriv-api/dist/DerivAPIBasic';

interface LiveTickData {
    tick: number;
    digit: number;
    timestamp: number;
    quote: number;
}

export interface PatternAlert {
    type: 'STREAK' | 'ALTERNATING' | 'FIBONACCI' | 'HIGH_PROBABILITY';
    message: string;
    confidence: number;
    action: 'ENTER_NOW' | 'WAIT' | 'CAUTION';
}

export const useLiveTickData = (market: string, enabled: boolean = true) => {
    const [ticks, setTicks] = useState<LiveTickData[]>([]);
    const [currentPattern, setCurrentPattern] = useState<string[]>([]);
    const [alerts, setAlerts] = useState<PatternAlert[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    // Analyze pattern and generate alerts
    const analyzePattern = useCallback((tickData: LiveTickData[]) => {
        if (tickData.length < 5) return;

        const recentDigits = tickData.slice(-18).map(t => t.digit);
        const lastDigit = recentDigits[recentDigits.length - 1];

        // Detect streaks
        let streakCount = 1;
        const streakType = lastDigit % 2 === 0 ? 'EVEN' : 'ODD';
        for (let i = recentDigits.length - 2; i >= 0; i--) {
            if ((recentDigits[i] % 2 === 0) === (lastDigit % 2 === 0)) {
                streakCount++;
            } else {
                break;
            }
        }

        // Generate alerts based on patterns
        const newAlerts: PatternAlert[] = [];

        // Streak alert
        if (streakCount >= 5) {
            newAlerts.push({
                type: 'STREAK',
                message: `${streakCount} consecutive ${streakType} - Consider opposite!`,
                confidence: Math.min(95, 50 + streakCount * 5),
                action: streakCount >= 7 ? 'ENTER_NOW' : 'WAIT',
            });
        }

        // Alternating pattern
        const isAlternating = recentDigits.slice(-6).every((d, i, arr) => {
            if (i === 0) return true;
            return d % 2 !== arr[i - 1] % 2;
        });

        if (isAlternating) {
            newAlerts.push({
                type: 'ALTERNATING',
                message: 'Perfect alternating pattern detected!',
                confidence: 85,
                action: 'ENTER_NOW',
            });
        }

        // High probability based on distribution
        const evenCount = recentDigits.filter(d => d % 2 === 0).length;
        const oddCount = recentDigits.length - evenCount;
        const imbalance = Math.abs(evenCount - oddCount);

        if (imbalance >= 8) {
            const minority = evenCount < oddCount ? 'EVEN' : 'ODD';
            newAlerts.push({
                type: 'HIGH_PROBABILITY',
                message: `Strong imbalance: ${evenCount}E vs ${oddCount}O - ${minority} likely`,
                confidence: Math.min(90, 60 + imbalance * 3),
                action: imbalance >= 10 ? 'ENTER_NOW' : 'WAIT',
            });
        }

        setAlerts(newAlerts);
    }, []);

    useEffect(() => {
        if (!enabled) return;

        const connection = new DerivAPIBasic({ app_id: 1089 });
        let subscriptionId: string | null = null;

        const connectAndSubscribe = async () => {
            try {
                const tickStream = await connection.subscribe({
                    ticks: market,
                    subscribe: 1,
                });

                setIsConnected(true);

                tickStream.subscribe((response: { tick?: { id: number; quote: number; epoch: number } }) => {
                    if (response.tick) {
                        const newTick: LiveTickData = {
                            tick: response.tick.id,
                            digit: parseInt(response.tick.quote.toString().slice(-1)),
                            timestamp: response.tick.epoch * 1000,
                            quote: response.tick.quote,
                        };

                        setTicks(prev => {
                            const updated = [...prev, newTick].slice(-50); // Keep last 50 ticks
                            analyzePattern(updated);
                            return updated;
                        });

                        setCurrentPattern(prev => {
                            const pattern = [...prev, newTick.digit % 2 === 0 ? 'E' : 'O'].slice(-18);
                            return pattern;
                        });
                    }
                });

                subscriptionId = tickStream.subscription?.id || null;
            } catch (error) {
                console.error('WebSocket connection error:', error);
                setIsConnected(false);
            }
        };

        connectAndSubscribe();

        return () => {
            if (subscriptionId) {
                connection.unsubscribe(subscriptionId);
            }
            connection.disconnect();
            setIsConnected(false);
        };
    }, [market, enabled, analyzePattern]);

    return {
        ticks,
        currentPattern,
        alerts,
        isConnected,
        latestTick: ticks[ticks.length - 1],
    };
};
