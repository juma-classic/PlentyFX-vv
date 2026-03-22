/**
 * Multi-Trade Queue System
 * Implements asynchronous FIFO queue for trade intents
 * Prevents race conditions and ensures sequential processing
 */

import type { TradeIntent } from './ruleEngine';

export interface QueueStats {
    totalQueued: number;
    totalProcessed: number;
    currentQueueSize: number;
    processingRate: number; // trades per second
    averageProcessingTime: number;
    isProcessing: boolean;
}

export interface ProcessedTrade {
    intent: TradeIntent;
    result: 'success' | 'error' | 'skipped';
    processingTime: number;
    timestamp: number;
    error?: string;
}

export class TradeQueue {
    private queue: TradeIntent[] = [];
    private isProcessing = false;
    private stats: QueueStats = {
        totalQueued: 0,
        totalProcessed: 0,
        currentQueueSize: 0,
        processingRate: 0,
        averageProcessingTime: 0,
        isProcessing: false,
    };

    private processingTimes: number[] = [];
    private lastProcessingTime = Date.now();
    private processedTrades: ProcessedTrade[] = [];
    private maxHistorySize = 1000;

    private processor: ((intent: TradeIntent) => Promise<void>) | null = null;

    /**
     * Set the trade processor function
     */
    public setProcessor(processor: (intent: TradeIntent) => Promise<void>): void {
        this.processor = processor;
        console.log('🔧 Trade processor set');
    }

    /**
     * Add trade intent to queue
     */
    public enqueue(intent: TradeIntent): void {
        this.queue.push(intent);
        this.stats.totalQueued++;
        this.stats.currentQueueSize = this.queue.length;

        console.log('📥 Trade intent queued:', {
            id: intent.id,
            ruleId: intent.ruleId,
            queueSize: this.queue.length,
        });

        // Start processing if not already running
        if (!this.isProcessing) {
            this.startProcessing();
        }
    }

    /**
     * Add multiple trade intents to queue
     */
    public enqueueBatch(intents: TradeIntent[]): void {
        if (intents.length === 0) {
            return;
        }

        this.queue.push(...intents);
        this.stats.totalQueued += intents.length;
        this.stats.currentQueueSize = this.queue.length;

        console.log('📥 Batch queued:', {
            count: intents.length,
            queueSize: this.queue.length,
        });

        // Start processing if not already running
        if (!this.isProcessing) {
            this.startProcessing();
        }
    }

    /**
     * Start processing queue
     */
    private async startProcessing(): Promise<void> {
        if (this.isProcessing || !this.processor) {
            return;
        }

        this.isProcessing = true;
        this.stats.isProcessing = true;
        console.log('🚀 Starting trade queue processing');

        while (this.queue.length > 0) {
            const intent = this.queue.shift()!;
            await this.processIntent(intent);

            this.stats.currentQueueSize = this.queue.length;

            // Small delay to prevent overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        this.isProcessing = false;
        this.stats.isProcessing = false;
        console.log('✅ Trade queue processing completed');
    }

    /**
     * Process a single trade intent
     */
    private async processIntent(intent: TradeIntent): Promise<void> {
        const startTime = performance.now();

        try {
            console.log('⚡ Processing trade intent:', {
                id: intent.id,
                ruleId: intent.ruleId,
                contractType: intent.contractType,
                stake: intent.stake,
            });

            if (!this.processor) {
                throw new Error('No processor set');
            }

            await this.processor(intent);

            const processingTime = performance.now() - startTime;
            this.recordProcessedTrade(intent, 'success', processingTime);

            console.log('✅ Trade intent processed successfully:', {
                id: intent.id,
                processingTime: processingTime.toFixed(2) + 'ms',
            });
        } catch (error) {
            const processingTime = performance.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            this.recordProcessedTrade(intent, 'error', processingTime, errorMessage);

            console.error('❌ Trade intent processing failed:', {
                id: intent.id,
                error: errorMessage,
                processingTime: processingTime.toFixed(2) + 'ms',
            });
        }
    }

    /**
     * Record processed trade for statistics
     */
    private recordProcessedTrade(
        intent: TradeIntent,
        result: 'success' | 'error' | 'skipped',
        processingTime: number,
        error?: string
    ): void {
        const processedTrade: ProcessedTrade = {
            intent,
            result,
            processingTime,
            timestamp: Date.now(),
            error,
        };

        this.processedTrades.push(processedTrade);

        // Keep history size manageable
        if (this.processedTrades.length > this.maxHistorySize) {
            this.processedTrades.shift();
        }

        // Update statistics
        this.stats.totalProcessed++;
        this.processingTimes.push(processingTime);

        // Keep only recent processing times for rate calculation
        if (this.processingTimes.length > 100) {
            this.processingTimes.shift();
        }

        // Calculate average processing time
        this.stats.averageProcessingTime =
            this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;

        // Calculate processing rate (trades per second)
        const now = Date.now();
        const timeDiff = (now - this.lastProcessingTime) / 1000;
        if (timeDiff > 0) {
            this.stats.processingRate = 1 / timeDiff;
        }
        this.lastProcessingTime = now;
    }

    /**
     * Get current queue statistics
     */
    public getStats(): QueueStats {
        return { ...this.stats };
    }

    /**
     * Get processed trades history
     */
    public getProcessedTrades(limit?: number): ProcessedTrade[] {
        if (limit) {
            return this.processedTrades.slice(-limit);
        }
        return [...this.processedTrades];
    }

    /**
     * Clear the queue (emergency stop)
     */
    public clearQueue(): void {
        const clearedCount = this.queue.length;
        this.queue = [];
        this.stats.currentQueueSize = 0;

        console.log('🗑️ Queue cleared:', {
            clearedTrades: clearedCount,
        });
    }

    /**
     * Pause processing (finish current trade but don't start new ones)
     */
    public pause(): void {
        console.log('⏸️ Queue processing paused');
        // The processing loop will naturally stop when isProcessing is checked
    }

    /**
     * Resume processing
     */
    public resume(): void {
        console.log('▶️ Queue processing resumed');
        if (this.queue.length > 0 && !this.isProcessing) {
            this.startProcessing();
        }
    }

    /**
     * Get queue status
     */
    public getStatus(): {
        queueSize: number;
        isProcessing: boolean;
        totalProcessed: number;
        successRate: number;
    } {
        const recentTrades = this.processedTrades.slice(-100);
        const successCount = recentTrades.filter(t => t.result === 'success').length;
        const successRate = recentTrades.length > 0 ? (successCount / recentTrades.length) * 100 : 0;

        return {
            queueSize: this.queue.length,
            isProcessing: this.isProcessing,
            totalProcessed: this.stats.totalProcessed,
            successRate,
        };
    }

    /**
     * Reset statistics
     */
    public resetStats(): void {
        console.log('🔄 Resetting queue statistics');
        this.stats = {
            totalQueued: 0,
            totalProcessed: 0,
            currentQueueSize: this.queue.length,
            processingRate: 0,
            averageProcessingTime: 0,
            isProcessing: this.isProcessing,
        };
        this.processingTimes = [];
        this.processedTrades = [];
    }
}
