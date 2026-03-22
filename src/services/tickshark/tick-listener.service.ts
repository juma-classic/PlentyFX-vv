/**
 * TickShark Tick Listener Service
 * Real-time market data handling and latency measurement
 * 
 * CRITICAL: High-performance tick processing with latency optimization
 * - WebSocket tick data streaming
 * - Latency measurement and optimization
 * - Data validation and quality control
 * - Integration with existing tick infrastructure
 */

import { TickData } from '../../types/tickshark/analysis.types';
import { derivConnectionPool } from '../deriv-connection-pool.service';
import { unifiedTickData } from '../unified-tick-data.service';

export interface TickListenerConfig {
    // Symbols to monitor
    symbols: string[];
    
    // Performance Settings
    maxTicksPerSecond: number;
    bufferSize: number;
    processingBatchSize: number;
    
    // Quality Control
    enableQualityFilter: boolean;
    minQualityLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    maxLatencyThreshold: number;
    maxJitterThreshold: number;
    
    // Latency Optimization
    enableLatencyOptimization: boolean;
    latencyMeasurementInterval: number;
    connectionPoolOptimization: boolean;
    
    // Data Processing
    enableRealTimeProcessing: boolean;
    processingInterval: number;
    enableBatching: boolean;
    
    // Integration
    integrateWithUnifiedService: boolean;
    enableAnalysisEngine: boolean;
    enableSignalGeneration: boolean;
}

export interface TickStreamStatus {
    symbol: string;
    isActive: boolean;
    connectionId?: string;
    
    // Performance Metrics
    ticksReceived: number;
    ticksPerSecond: number;
    averageLatency: number;
    currentLatency: number;
    jitter: number;
    
    // Quality Metrics
    qualityScore: number;
    validTicks: number;
    invalidTicks: number;
    droppedTicks: number;
    
    // Connection Status
    connectionStatus: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'ERROR';
    lastTickTime: number;
    connectionUptime: number;
    
    // Error Tracking
    errorCount: number;
    lastError?: string;
    reconnectAttempts: number;
}

export interface TickProcessingStats {
    // Processing Performance
    totalTicksProcessed: number;
    ticksPerSecond: number;
    averageProcessingTime: number;
    
    // Latency Statistics
    averageLatency: number;
    minLatency: number;
    maxLatency: number;
    latencyStandardDeviation: number;
    
    // Quality Statistics
    averageQualityScore: number;
    highQualityTicks: number;
    mediumQualityTicks: number;
    lowQualityTicks: number;
    
    // Error Statistics
    totalErrors: number;
    connectionErrors: number;
    dataErrors: number;
    processingErrors: number;
    
    // Symbol Statistics
    symbolStats: Map<string, {
        ticksReceived: number;
        averageLatency: number;
        qualityScore: number;
        errorCount: number;
    }>;
}

class TickListenerService {
    private config: TickListenerConfig = {
        symbols: ['R_100', 'R_50', 'R_25', 'R_10'],
        
        maxTicksPerSecond: 1000,
        bufferSize: 10000,
        processingBatchSize: 100,
        
        enableQualityFilter: true,
        minQualityLevel: 'MEDIUM',
        maxLatencyThreshold: 100, // 100ms
        maxJitterThreshold: 50, // 50ms
        
        enableLatencyOptimization: true,
        latencyMeasurementInterval: 1000, // 1 second
        connectionPoolOptimization: true,
        
        enableRealTimeProcessing: true,
        processingInterval: 100, // 100ms
        enableBatching: true,
        
        integrateWithUnifiedService: true,
        enableAnalysisEngine: true,
        enableSignalGeneration: true,
    };

    private tickBuffer = new Map<string, TickData[]>();
    private streamStatus = new Map<string, TickStreamStatus>();
    private processingStats: TickProcessingStats = this.initializeStats();
    private isInitialized = false;
    private processingTimer?: NodeJS.Timeout;
    private latencyTimer?: NodeJS.Timeout;
    private subscribers = new Set<(tick: TickData) => void>();

    /**
     * Initialize the tick listener service
     */
    async initialize(): Promise<void> {
        try {
            console.log('🦈 Initializing TickShark Tick Listener...');
            
            // Initialize buffers for configured symbols
            for (const symbol of this.config.symbols) {
                this.tickBuffer.set(symbol, []);
                this.streamStatus.set(symbol, this.createInitialStreamStatus(symbol));
            }
            
            // Start processing timer
            if (this.config.enableRealTimeProcessing) {
                this.startProcessingTimer();
            }
            
            // Start latency measurement
            if (this.config.enableLatencyOptimization) {
                this.startLatencyMeasurement();
            }
            
            // Initialize connections for each symbol
            await this.initializeSymbolStreams();
            
            this.isInitialized = true;
            console.log('🦈 TickShark Tick Listener initialized successfully');
            
        } catch (error) {
            console.error('🦈 TickShark Tick Listener initialization failed:', error);
            throw error;
        }
    }

    /**
     * Start listening to a specific symbol
     */
    async startSymbolStream(symbol: string): Promise<boolean> {
        try {
            console.log(`🦈 Starting tick stream for ${symbol}...`);
            
            // Initialize buffer if not exists
            if (!this.tickBuffer.has(symbol)) {
                this.tickBuffer.set(symbol, []);
                this.streamStatus.set(symbol, this.createInitialStreamStatus(symbol));
            }
            
            const status = this.streamStatus.get(symbol)!;
            status.connectionStatus = 'CONNECTING';
            
            // Get optimal connection for analysis
            const connection = derivConnectionPool.getOptimalAnalysisConnection();
            
            if (!connection) {
                throw new Error('No available connection for tick streaming');
            }
            
            // Subscribe to ticks using the existing unified service if configured
            if (this.config.integrateWithUnifiedService) {
                return await this.integrateWithUnifiedService(symbol);
            } else {
                return await this.createDirectTickStream(symbol, connection);
            }
            
        } catch (error) {
            console.error(`🦈 Failed to start tick stream for ${symbol}:`, error);
            const status = this.streamStatus.get(symbol);
            if (status) {
                status.connectionStatus = 'ERROR';
                status.lastError = error instanceof Error ? error.message : 'Unknown error';
                status.errorCount++;
            }
            return false;
        }
    }

    /**
     * Stop listening to a specific symbol
     */
    async stopSymbolStream(symbol: string): Promise<void> {
        try {
            console.log(`🦈 Stopping tick stream for ${symbol}...`);
            
            const status = this.streamStatus.get(symbol);
            if (status) {
                status.connectionStatus = 'DISCONNECTED';
                status.isActive = false;
            }
            
            // If using unified service, unsubscribe
            if (this.config.integrateWithUnifiedService) {
                // The unified service handles unsubscription
                console.log(`🦈 Unsubscribed from unified service for ${symbol}`);
            }
            
            // Clear buffer
            this.tickBuffer.set(symbol, []);
            
        } catch (error) {
            console.error(`🦈 Failed to stop tick stream for ${symbol}:`, error);
        }
    }

    /**
     * Subscribe to tick updates
     */
    subscribe(callback: (tick: TickData) => void): () => void {
        this.subscribers.add(callback);
        
        // Return unsubscribe function
        return () => {
            this.subscribers.delete(callback);
        };
    }

    /**
     * Get current stream status for all symbols
     */
    getStreamStatus(): Map<string, TickStreamStatus> {
        return new Map(this.streamStatus);
    }

    /**
     * Get processing statistics
     */
    getProcessingStats(): TickProcessingStats {
        return { ...this.processingStats };
    }

    /**
     * Get recent ticks for a symbol
     */
    getRecentTicks(symbol: string, count = 10): TickData[] {
        const buffer = this.tickBuffer.get(symbol);
        return buffer ? buffer.slice(-count) : [];
    }

    /**
     * Update configuration
     */
    updateConfiguration(newConfig: Partial<TickListenerConfig>): void {
        this.config = { ...this.config, ...newConfig };
        console.log('🦈 Tick listener configuration updated');
    }

    /**
     * Get current configuration
     */
    getConfiguration(): TickListenerConfig {
        return { ...this.config };
    }

    /**
     * Cleanup and shutdown
     */
    async shutdown(): Promise<void> {
        console.log('🦈 Shutting down TickShark Tick Listener...');
        
        // Stop all streams
        for (const symbol of this.config.symbols) {
            await this.stopSymbolStream(symbol);
        }
        
        // Clear timers
        if (this.processingTimer) {
            clearInterval(this.processingTimer);
        }
        
        if (this.latencyTimer) {
            clearInterval(this.latencyTimer);
        }
        
        // Clear data
        this.tickBuffer.clear();
        this.streamStatus.clear();
        this.subscribers.clear();
        
        this.isInitialized = false;
        console.log('🦈 TickShark Tick Listener shutdown complete');
    }

    /**
     * Private implementation methods
     */
    private async initializeSymbolStreams(): Promise<void> {
        const initPromises = this.config.symbols.map(symbol => 
            this.startSymbolStream(symbol).catch(error => {
                console.warn(`🦈 Failed to initialize stream for ${symbol}:`, error);
                return false;
            })
        );
        
        const results = await Promise.all(initPromises);
        const successCount = results.filter(Boolean).length;
        
        console.log(`🦈 Initialized ${successCount}/${this.config.symbols.length} symbol streams`);
    }

    private async integrateWithUnifiedService(symbol: string): Promise<boolean> {
        try {
            // Initialize tick stream with the unified service
            const result = await unifiedTickData.initializeTickStream(
                symbol,
                50, // Historical count for TickShark buffer
                (tickData: any) => {
                    // Convert unified tick data to TickShark format
                    const tickSharkTick = this.convertToTickSharkFormat(tickData, symbol);
                    if (tickSharkTick) {
                        this.processTick(tickSharkTick);
                    }
                }
            );
            
            if (result.success) {
                // Process historical ticks if available
                if (result.historicalTicks && result.historicalTicks.length > 0) {
                    result.historicalTicks.forEach(tickData => {
                        const tickSharkTick = this.convertToTickSharkFormat(tickData, symbol);
                        if (tickSharkTick) {
                            this.processTick(tickSharkTick);
                        }
                    });
                }
                
                // Update status
                const status = this.streamStatus.get(symbol)!;
                status.connectionStatus = 'CONNECTED';
                status.isActive = true;
                status.connectionId = 'unified-service';
                
                console.log(`🦈 Integrated with unified service for ${symbol}`);
                return true;
            } else {
                throw new Error('Failed to initialize unified tick stream');
            }
            
        } catch (error) {
            console.error(`🦈 Failed to integrate with unified service for ${symbol}:`, error);
            return false;
        }
    }

    private async createDirectTickStream(symbol: string, connection: any): Promise<boolean> {
        try {
            // Create direct WebSocket subscription
            const subscriptionId = await connection.subscribe({
                ticks: symbol,
                subscribe: 1
            });
            
            // Set up tick handler
            connection.onMessage((message: any) => {
                if (message.msg_type === 'tick' && message.tick?.symbol === symbol) {
                    const tickSharkTick = this.convertDerivTickToTickSharkFormat(message.tick, symbol);
                    if (tickSharkTick) {
                        this.processTick(tickSharkTick);
                    }
                }
            });
            
            // Update status
            const status = this.streamStatus.get(symbol)!;
            status.connectionStatus = 'CONNECTED';
            status.isActive = true;
            status.connectionId = subscriptionId;
            
            console.log(`🦈 Direct tick stream created for ${symbol}`);
            return true;
            
        } catch (error) {
            console.error(`🦈 Failed to create direct tick stream for ${symbol}:`, error);
            return false;
        }
    }

    private convertToTickSharkFormat(unifiedTick: any, symbol: string): TickData | null {
        try {
            const receiveTime = Date.now();
            const processTime = receiveTime;
            
            // Extract tick data from unified format
            const bid = unifiedTick.bid || unifiedTick.quote;
            const ask = unifiedTick.ask || (bid + (unifiedTick.spread || 0.001));
            
            if (!bid || bid <= 0) {
                return null;
            }
            
            const tick: TickData = {
                symbol,
                timestamp: unifiedTick.epoch * 1000 || receiveTime,
                bid,
                ask,
                spread: ask - bid,
                volume: unifiedTick.volume,
                
                receiveTime,
                processTime,
                latency: receiveTime - (unifiedTick.epoch * 1000 || receiveTime),
                
                quality: this.assessTickQuality(bid, ask, receiveTime),
                source: 'unified-service',
                
                sequenceNumber: this.processingStats.totalTicksProcessed + 1,
                isValid: true,
            };
            
            return tick;
            
        } catch (error) {
            console.error('🦈 Failed to convert unified tick to TickShark format:', error);
            return null;
        }
    }

    private convertDerivTickToTickSharkFormat(derivTick: any, symbol: string): TickData | null {
        try {
            const receiveTime = Date.now();
            const processTime = receiveTime;
            
            const bid = derivTick.bid || derivTick.quote;
            const ask = derivTick.ask || (bid + 0.001); // Default spread if not provided
            
            if (!bid || bid <= 0) {
                return null;
            }
            
            const tick: TickData = {
                symbol,
                timestamp: derivTick.epoch * 1000,
                bid,
                ask,
                spread: ask - bid,
                volume: derivTick.volume,
                
                receiveTime,
                processTime,
                latency: receiveTime - (derivTick.epoch * 1000),
                
                quality: this.assessTickQuality(bid, ask, receiveTime),
                source: 'deriv-api',
                
                sequenceNumber: this.processingStats.totalTicksProcessed + 1,
                isValid: true,
            };
            
            return tick;
            
        } catch (error) {
            console.error('🦈 Failed to convert Deriv tick to TickShark format:', error);
            return null;
        }
    }

    private processTick(tick: TickData): void {
        try {
            // Validate tick
            if (!this.validateTick(tick)) {
                return;
            }
            
            // Apply quality filter
            if (this.config.enableQualityFilter && !this.passesQualityFilter(tick)) {
                return;
            }
            
            // Add to buffer
            this.addToBuffer(tick);
            
            // Update statistics
            this.updateProcessingStats(tick);
            
            // Update stream status
            this.updateStreamStatus(tick);
            
            // Notify subscribers
            this.notifySubscribers(tick);
            
            // Trigger analysis if enabled
            if (this.config.enableAnalysisEngine) {
                this.triggerAnalysis(tick);
            }
            
        } catch (error) {
            console.error('🦈 Failed to process tick:', error);
            this.processingStats.processingErrors++;
        }
    }

    private validateTick(tick: TickData): boolean {
        // Basic validation
        if (!tick.symbol || !tick.timestamp || tick.bid <= 0) {
            return false;
        }
        
        // Latency validation
        if (tick.latency > this.config.maxLatencyThreshold) {
            return false;
        }
        
        // Spread validation
        if (tick.spread < 0 || tick.spread > tick.bid * 0.1) {
            return false;
        }
        
        return true;
    }

    private passesQualityFilter(tick: TickData): boolean {
        const qualityLevels = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        const minLevel = qualityLevels[this.config.minQualityLevel];
        const tickLevel = qualityLevels[tick.quality];
        
        return tickLevel >= minLevel;
    }

    private assessTickQuality(bid: number, ask: number, receiveTime: number): 'HIGH' | 'MEDIUM' | 'LOW' {
        let qualityScore = 1.0;
        
        // Assess based on spread
        const spread = ask - bid;
        const spreadRatio = spread / bid;
        
        if (spreadRatio < 0.001) qualityScore += 0.3; // Very tight spread
        else if (spreadRatio > 0.01) qualityScore -= 0.3; // Wide spread
        
        // Assess based on latency (simplified)
        const estimatedLatency = Date.now() - receiveTime;
        if (estimatedLatency < 50) qualityScore += 0.2;
        else if (estimatedLatency > 200) qualityScore -= 0.2;
        
        // Determine quality level
        if (qualityScore >= 1.2) return 'HIGH';
        if (qualityScore >= 0.8) return 'MEDIUM';
        return 'LOW';
    }

    private addToBuffer(tick: TickData): void {
        const buffer = this.tickBuffer.get(tick.symbol);
        if (!buffer) return;
        
        buffer.push(tick);
        
        // Trim buffer if too large
        if (buffer.length > this.config.bufferSize) {
            buffer.splice(0, buffer.length - this.config.bufferSize);
        }
    }

    private updateProcessingStats(tick: TickData): void {
        this.processingStats.totalTicksProcessed++;
        
        // Update latency stats
        this.processingStats.averageLatency = (this.processingStats.averageLatency + tick.latency) / 2;
        this.processingStats.minLatency = Math.min(this.processingStats.minLatency || tick.latency, tick.latency);
        this.processingStats.maxLatency = Math.max(this.processingStats.maxLatency, tick.latency);
        
        // Update quality stats
        switch (tick.quality) {
            case 'HIGH': this.processingStats.highQualityTicks++; break;
            case 'MEDIUM': this.processingStats.mediumQualityTicks++; break;
            case 'LOW': this.processingStats.lowQualityTicks++; break;
        }
        
        // Update symbol stats
        if (!this.processingStats.symbolStats.has(tick.symbol)) {
            this.processingStats.symbolStats.set(tick.symbol, {
                ticksReceived: 0,
                averageLatency: 0,
                qualityScore: 0,
                errorCount: 0,
            });
        }
        
        const symbolStats = this.processingStats.symbolStats.get(tick.symbol)!;
        symbolStats.ticksReceived++;
        symbolStats.averageLatency = (symbolStats.averageLatency + tick.latency) / 2;
        
        // Calculate ticks per second
        const now = Date.now();
        const timeWindow = 1000; // 1 second
        const recentTicks = this.getRecentTicksInWindow(tick.symbol, now - timeWindow, now);
        this.processingStats.ticksPerSecond = recentTicks.length;
    }

    private updateStreamStatus(tick: TickData): void {
        const status = this.streamStatus.get(tick.symbol);
        if (!status) return;
        
        status.ticksReceived++;
        status.lastTickTime = tick.timestamp;
        status.currentLatency = tick.latency;
        status.averageLatency = (status.averageLatency + tick.latency) / 2;
        
        // Calculate jitter (latency variance)
        const latencyDiff = Math.abs(tick.latency - status.averageLatency);
        status.jitter = (status.jitter + latencyDiff) / 2;
        
        // Update quality score
        const qualityValue = tick.quality === 'HIGH' ? 1 : tick.quality === 'MEDIUM' ? 0.7 : 0.4;
        status.qualityScore = (status.qualityScore + qualityValue) / 2;
        
        // Calculate ticks per second for this symbol
        const now = Date.now();
        const timeWindow = 1000;
        const recentTicks = this.getRecentTicksInWindow(tick.symbol, now - timeWindow, now);
        status.ticksPerSecond = recentTicks.length;
        
        // Update valid/invalid counts
        if (tick.isValid) {
            status.validTicks++;
        } else {
            status.invalidTicks++;
        }
    }

    private notifySubscribers(tick: TickData): void {
        for (const callback of this.subscribers) {
            try {
                callback(tick);
            } catch (error) {
                console.error('🦈 Subscriber callback error:', error);
            }
        }
    }

    private async triggerAnalysis(tick: TickData): Promise<void> {
        try {
            // Get recent ticks for analysis
            const recentTicks = this.getRecentTicks(tick.symbol, 20);
            
            if (recentTicks.length >= 10) {
                // Import analysis engine dynamically to avoid circular dependencies
                const { analysisEngineService } = await import('./analysis-engine.service');
                
                // Trigger analysis
                const analysisResult = await analysisEngineService.analyzeTickData(recentTicks);
                
                // Generate signals if enabled
                if (this.config.enableSignalGeneration && analysisResult.opportunities.length > 0) {
                    const { signalGeneratorService } = await import('./signal-generator.service');
                    const signals = signalGeneratorService.generateSignals(analysisResult);
                    
                    if (signals.length > 0) {
                        console.log(`🦈 Generated ${signals.length} signals from ${tick.symbol} analysis`);
                    }
                }
            }
            
        } catch (error) {
            console.error('🦈 Analysis trigger failed:', error);
        }
    }

    private getRecentTicksInWindow(symbol: string, startTime: number, endTime: number): TickData[] {
        const buffer = this.tickBuffer.get(symbol);
        if (!buffer) return [];
        
        return buffer.filter(tick => tick.timestamp >= startTime && tick.timestamp <= endTime);
    }

    private startProcessingTimer(): void {
        this.processingTimer = setInterval(() => {
            this.processBufferedTicks();
        }, this.config.processingInterval);
    }

    private startLatencyMeasurement(): void {
        this.latencyTimer = setInterval(() => {
            this.measureAndOptimizeLatency();
        }, this.config.latencyMeasurementInterval);
    }

    private processBufferedTicks(): void {
        if (!this.config.enableBatching) return;
        
        // Process ticks in batches for better performance
        for (const [symbol, buffer] of this.tickBuffer) {
            if (buffer.length >= this.config.processingBatchSize) {
                const batch = buffer.splice(0, this.config.processingBatchSize);
                this.processBatch(symbol, batch);
            }
        }
    }

    private processBatch(symbol: string, ticks: TickData[]): void {
        // Batch processing logic
        console.log(`🦈 Processing batch of ${ticks.length} ticks for ${symbol}`);
        
        // This could trigger batch analysis or other optimizations
        // For now, individual tick processing handles everything
    }

    private measureAndOptimizeLatency(): void {
        // Measure current latency performance
        for (const [symbol, status] of this.streamStatus) {
            if (status.isActive && status.jitter > this.config.maxJitterThreshold) {
                console.warn(`🦈 High jitter detected for ${symbol}: ${status.jitter.toFixed(2)}ms`);
                
                // Could trigger connection optimization here
                if (this.config.connectionPoolOptimization) {
                    this.optimizeConnection(symbol);
                }
            }
        }
    }

    private optimizeConnection(symbol: string): void {
        // Connection optimization logic
        console.log(`🦈 Optimizing connection for ${symbol}...`);
        
        // This could involve switching to a better connection from the pool
        // For now, just log the optimization attempt
    }

    private createInitialStreamStatus(symbol: string): TickStreamStatus {
        return {
            symbol,
            isActive: false,
            ticksReceived: 0,
            ticksPerSecond: 0,
            averageLatency: 0,
            currentLatency: 0,
            jitter: 0,
            qualityScore: 0,
            validTicks: 0,
            invalidTicks: 0,
            droppedTicks: 0,
            connectionStatus: 'DISCONNECTED',
            lastTickTime: 0,
            connectionUptime: 0,
            errorCount: 0,
            reconnectAttempts: 0,
        };
    }

    private initializeStats(): TickProcessingStats {
        return {
            totalTicksProcessed: 0,
            ticksPerSecond: 0,
            averageProcessingTime: 0,
            
            averageLatency: 0,
            minLatency: 0,
            maxLatency: 0,
            latencyStandardDeviation: 0,
            
            averageQualityScore: 0,
            highQualityTicks: 0,
            mediumQualityTicks: 0,
            lowQualityTicks: 0,
            
            totalErrors: 0,
            connectionErrors: 0,
            dataErrors: 0,
            processingErrors: 0,
            
            symbolStats: new Map(),
        };
    }
}

// Export singleton instance
export const tickListenerService = new TickListenerService();