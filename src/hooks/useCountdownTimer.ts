import { useCallback,useEffect, useState } from 'react';

export interface CountdownState {
    ticksRemaining: number;
    isActive: boolean;
    isExpired: boolean;
    progress: number; // 0-100
}

export interface CountdownCallbacks {
    onTick?: (ticksRemaining: number) => void;
    onExpire?: () => void;
    onWarning?: (ticksRemaining: number) => void; // Triggers at 3, 2, 1
}

export const useCountdownTimer = (initialTicks: number, callbacks?: CountdownCallbacks) => {
    const [state, setState] = useState<CountdownState>({
        ticksRemaining: initialTicks,
        isActive: false,
        isExpired: false,
        progress: 100,
    });

    const [lastWarning, setLastWarning] = useState<number>(0);

    // Start countdown
    const start = useCallback(() => {
        setState(prev => ({
            ...prev,
            isActive: true,
            isExpired: false,
            ticksRemaining: initialTicks,
            progress: 100,
        }));
        setLastWarning(0);
    }, [initialTicks]);

    // Pause countdown
    const pause = useCallback(() => {
        setState(prev => ({
            ...prev,
            isActive: false,
        }));
    }, []);

    // Resume countdown
    const resume = useCallback(() => {
        setState(prev => ({
            ...prev,
            isActive: true,
        }));
    }, []);

    // Cancel countdown
    const cancel = useCallback(() => {
        setState({
            ticksRemaining: initialTicks,
            isActive: false,
            isExpired: false,
            progress: 100,
        });
        setLastWarning(0);
    }, [initialTicks]);

    // Reset countdown
    const reset = useCallback(() => {
        setState({
            ticksRemaining: initialTicks,
            isActive: false,
            isExpired: false,
            progress: 100,
        });
        setLastWarning(0);
    }, [initialTicks]);

    // Countdown logic
    useEffect(() => {
        if (!state.isActive || state.isExpired) return;

        const timer = setTimeout(() => {
            setState(prev => {
                const newTicksRemaining = prev.ticksRemaining - 1;
                const newProgress = (newTicksRemaining / initialTicks) * 100;

                // Check if expired
                if (newTicksRemaining <= 0) {
                    if (callbacks?.onExpire) {
                        callbacks.onExpire();
                    }
                    return {
                        ticksRemaining: 0,
                        isActive: false,
                        isExpired: true,
                        progress: 0,
                    };
                }

                // Trigger tick callback
                if (callbacks?.onTick) {
                    callbacks.onTick(newTicksRemaining);
                }

                // Trigger warning callback at 3, 2, 1
                if (callbacks?.onWarning && newTicksRemaining <= 3 && newTicksRemaining !== lastWarning) {
                    callbacks.onWarning(newTicksRemaining);
                    setLastWarning(newTicksRemaining);
                }

                return {
                    ...prev,
                    ticksRemaining: newTicksRemaining,
                    progress: newProgress,
                };
            });
        }, 1000); // 1 second per tick

        return () => clearTimeout(timer);
    }, [state.isActive, state.isExpired, state.ticksRemaining, initialTicks, callbacks, lastWarning]);

    return {
        ...state,
        start,
        pause,
        resume,
        cancel,
        reset,
    };
};
