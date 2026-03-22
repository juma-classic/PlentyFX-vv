import { useCallback, useEffect, useState } from 'react';

export interface StreakData {
    type: string;
    count: number;
    probability: number;
    isFibonacci: boolean;
    isSignificant: boolean;
}

export interface StreakMilestone {
    count: number;
    type: string;
    timestamp: number;
}

const FIBONACCI_NUMBERS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

export const useStreakCounter = (pattern: string[], onMilestone?: (milestone: StreakMilestone) => void) => {
    const [currentStreak, setCurrentStreak] = useState<StreakData>({
        type: '',
        count: 0,
        probability: 50,
        isFibonacci: false,
        isSignificant: false,
    });

    const [previousStreak, setPreviousStreak] = useState<StreakData | null>(null);
    const [streakHistory, setStreakHistory] = useState<StreakMilestone[]>([]);
    const [, setLastMilestone] = useState<number>(0);

    // Calculate probability of streak continuing
    const calculateProbability = useCallback((count: number): number => {
        // Base probability is 50%
        // Decreases as streak gets longer (gambler's fallacy consideration)
        // But in reality, each event is independent
        const baseProbability = 50;
        const adjustment = Math.min(count * 2, 30); // Max 30% adjustment
        return Math.max(20, baseProbability - adjustment);
    }, []);

    // Check if number is Fibonacci
    const isFibonacciNumber = useCallback((num: number): boolean => {
        return FIBONACCI_NUMBERS.includes(num);
    }, []);

    // Detect and update streak
    useEffect(() => {
        if (pattern.length === 0) {
            setCurrentStreak({
                type: '',
                count: 0,
                probability: 50,
                isFibonacci: false,
                isSignificant: false,
            });
            return;
        }

        const latestItem = pattern[pattern.length - 1];
        let streakCount = 1;
        const streakType = latestItem;

        // Count backwards to find streak length
        for (let i = pattern.length - 2; i >= 0; i--) {
            if (pattern[i] === latestItem) {
                streakCount++;
            } else {
                break;
            }
        }

        const probability = calculateProbability(streakCount);
        const isFib = isFibonacciNumber(streakCount);
        const isSignificant = streakCount >= 5;

        const newStreak: StreakData = {
            type: streakType,
            count: streakCount,
            probability,
            isFibonacci: isFib,
            isSignificant,
        };

        setCurrentStreak(prevStreak => {
            // Check for milestone (5, 7, 10, 15, 20, etc.)
            const milestones = [5, 7, 10, 15, 20, 25, 30];
            if (milestones.includes(streakCount)) {
                setLastMilestone(prevMilestone => {
                    if (streakCount > prevMilestone) {
                        const milestone: StreakMilestone = {
                            count: streakCount,
                            type: streakType,
                            timestamp: Date.now(),
                        };

                        setStreakHistory(prev => [...prev, milestone].slice(-10)); // Keep last 10

                        if (onMilestone) {
                            onMilestone(milestone);
                        }
                        return streakCount;
                    }
                    return prevMilestone;
                });
            }

            // Reset milestone counter if streak breaks
            if (prevStreak.type !== '' && prevStreak.type !== streakType) {
                setLastMilestone(0);
                setPreviousStreak(prevStreak);
            }

            return newStreak;
        });
    }, [pattern, calculateProbability, isFibonacciNumber, onMilestone]);

    // Get streak description
    const getStreakDescription = useCallback((): string => {
        if (currentStreak.count === 0) return 'No streak';
        if (currentStreak.count === 1) return `1 ${currentStreak.type}`;
        return `${currentStreak.count} consecutive ${currentStreak.type}`;
    }, [currentStreak]);

    // Get streak transition description
    const getStreakTransition = useCallback((): string | null => {
        if (!previousStreak || previousStreak.count < 3) return null;
        return `${previousStreak.count} ${previousStreak.type} → ${currentStreak.count} ${currentStreak.type}`;
    }, [previousStreak, currentStreak]);

    // Get color based on streak length
    const getStreakColor = useCallback((): string => {
        if (currentStreak.count < 5) return 'normal';
        if (currentStreak.count < 7) return 'warning';
        if (currentStreak.count < 10) return 'danger';
        return 'critical';
    }, [currentStreak.count]);

    return {
        currentStreak,
        previousStreak,
        streakHistory,
        getStreakDescription,
        getStreakTransition,
        getStreakColor,
    };
};
