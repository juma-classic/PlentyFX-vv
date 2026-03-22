import { useState, useCallback } from 'react';
import { bulkTradingService, BulkTradeStats } from '@/services/bulk-trading.service';

export const useBulkTrading = () => {
    const [isBulkTrading, setIsBulkTrading] = useState(false);
    const [bulkStats, setBulkStats] = useState<BulkTradeStats | null>(null);
    const [error, setError] = useState<string | null>(null);

    const placeBulkTrades = useCallback(
        async (config: {
            proposalId: string;
            price: number;
            count: number;
            delayMs?: number;
        }) => {
            setIsBulkTrading(true);
            setError(null);

            try {
                const stats = await bulkTradingService.placeBulkTrades(config);
                setBulkStats(stats);
                return stats;
            } catch (err: any) {
                setError(err.message || 'Bulk trading failed');
                throw err;
            } finally {
                setIsBulkTrading(false);
            }
        },
        []
    );

    const placeBulkTradesParallel = useCallback(
        async (config: {
            proposalId: string;
            price: number;
            count: number;
        }) => {
            setIsBulkTrading(true);
            setError(null);

            try {
                const stats = await bulkTradingService.placeBulkTradesParallel(config);
                setBulkStats(stats);
                return stats;
            } catch (err: any) {
                setError(err.message || 'Bulk trading failed');
                throw err;
            } finally {
                setIsBulkTrading(false);
            }
        },
        []
    );

    const cancelBulkTrading = useCallback(() => {
        bulkTradingService.cancelBulkTrading();
        setIsBulkTrading(false);
    }, []);

    const resetStats = useCallback(() => {
        setBulkStats(null);
        setError(null);
    }, []);

    return {
        isBulkTrading,
        bulkStats,
        error,
        placeBulkTrades,
        placeBulkTradesParallel,
        cancelBulkTrading,
        resetStats,
    };
};
