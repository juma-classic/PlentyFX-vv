/**
 * Fast PATEL Bot Loader Hook
 * Provides easy integration for digit click handlers
 */

import { useState, useCallback } from 'react';
import { patelBotLoaderService } from '../services/patel-bot-loader.service';

interface UseFastPatelBotLoaderOptions {
    market?: string;
    onLoadStart?: (digit: number) => void;
    onLoadComplete?: (digit: number, loadTime: number) => void;
    onLoadError?: (digit: number, error: Error) => void;
}

interface UseFastPatelBotLoaderReturn {
    loadPatelBot: (digit: number) => Promise<void>;
    isLoading: boolean;
    loadingDigit: number | null;
    lastLoadTime: number | null;
    loadCount: number;
}

export const useFastPatelBotLoader = (options: UseFastPatelBotLoaderOptions = {}): UseFastPatelBotLoaderReturn => {
    const {
        market = 'R_50',
        onLoadStart,
        onLoadComplete,
        onLoadError
    } = options;

    const [isLoading, setIsLoading] = useState(false);
    const [loadingDigit, setLoadingDigit] = useState<number | null>(null);
    const [lastLoadTime, setLastLoadTime] = useState<number | null>(null);
    const [loadCount, setLoadCount] = useState(0);

    const loadPatelBot = useCallback(async (digit: number) => {
        if (isLoading) {
            console.log(`🔄 PATEL bot already loading for digit ${loadingDigit}...`);
            return;
        }

        try {
            setIsLoading(true);
            setLoadingDigit(digit);
            onLoadStart?.(digit);

            const startTime = performance.now();
            
            console.log(`🎯 Loading PATEL bot for digit ${digit}...`);
            console.log(`📊 Configuration: ${digit >= 0 && digit <= 4 ? 'Before Loss: 8, After Loss: 6' : 'Before Loss: 1, After Loss: 3'}`);

            await patelBotLoaderService.loadPatelBotForDigit(digit, market);

            const loadTime = performance.now() - startTime;
            setLastLoadTime(loadTime);
            setLoadCount(prev => prev + 1);

            console.log(`✅ PATEL bot loaded successfully for digit ${digit} in ${loadTime.toFixed(0)}ms`);
            onLoadComplete?.(digit, loadTime);

        } catch (error) {
            console.error(`❌ Failed to load PATEL bot for digit ${digit}:`, error);
            onLoadError?.(digit, error as Error);
        } finally {
            setIsLoading(false);
            setLoadingDigit(null);
        }
    }, [isLoading, loadingDigit, market, onLoadStart, onLoadComplete, onLoadError]);

    return {
        loadPatelBot,
        isLoading,
        loadingDigit,
        lastLoadTime,
        loadCount
    };
};

export default useFastPatelBotLoader;