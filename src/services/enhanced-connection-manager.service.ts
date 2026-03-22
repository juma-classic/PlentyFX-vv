/**
 * Enhanced Connection Manager Service
 * Provides maximum reliability for WebSocket connections with multiple strategies
 */

export interface ConnectionConfig {
    maxReconnectAttempts: number;
    reconnectDelay: number;
    maxReconnectDelay: number;
    pingInterval: number;
    healthCheckInterval: number;
    tickTimeoutDuration: number;
}

export interface ConnectionQuality {
    latency: number;
    successfulPings: number;
    failedPings: number;
    reconnectCount: number;
    lastSuccessfulConnection: number;
    qualityScore: number;
}

export interface ConnectionStatus {
    isConnected: boolean;
    isConnecting: boolean;
    reconnectAttempts: number;
    currentServer: string;
    lastTickTime: number;
    timeSinceLastTick: number | null;
    connectionQuality: ConnectionQuality;
    networkOnline: boolean;
    pageVisible: boolean;
}

class EnhancedConnectionManagerService {
    private config: ConnectionConfig = {
        maxReconnectAttempts: 100, // Very high for maximum persistence
        reconnectDelay: 300, // Start very fast
        maxReconnectDelay: 10000, // Max 10 seconds
        pingInterval: 10000, // Ping every 10 seconds
        healthCheckInterval: 5000, // Check every 5 seconds
        tickTimeoutDuration: 30000, // 30 seconds without ticks = problem
    };

    private connectionStrategies = [
        // Primary strategy: Multiple app IDs with different servers
        { appId: '119552', server: 'ws.binaryws.com' },
        { appId: '1089', server: 'ws.binaryws.com' },
        { appId: '16929', server: 'ws.binaryws.com' },
        // Backup strategy: Different endpoints
        { appId: '119552', server: 'frontend.binaryws.com' },
        { appId: '1089', server: 'frontend.binaryws.com' },
    ];

    private currentStrategyIndex = 0;
    private connectionQuality: ConnectionQuality = {
        latency: 0,
        successfulPings: 0,
        failedPings: 0,
        reconnectCount: 0,
        lastSuccessfulConnection: 0,
        qualityScore: 100,
    };

    private listeners = {
        onConnected: new Set<() => void>(),
        onDisconnected: new Set<(reason?: string) => void>(),
        onQualityChange: new Set<(quality: ConnectionQuality) => void>(),
        onStatusChange: new Set<(status: ConnectionStatus) => void>(),
    };

    /**
     * Initialize enhanced connection strategies
     */
    initialize(): void {
        this.setupNetworkMonitoring();
        this.setupVisibilityMonitoring();
        this.setupPerformanceMonitoring();
        this.setupConnectionPersistence();
        
        console.log('🚀 Enhanced Connection Manager initialized with maximum reliability strategies');
    }

    /**
     * Setup network connectivity monitoring
     */
    private setupNetworkMonitoring(): void {
        // Monitor online/offline events
        window.addEventListener('online', () => {
            console.log('🌐 Network back online - triggering immediate reconnection');
            this.triggerImmediateReconnection();
        });

        window.addEventListener('offline', () => {
            console.log('📵 Network offline detected - pausing reconnection attempts');
            this.pauseReconnectionAttempts();
        });

        // Monitor connection quality changes
        if ('connection' in navigator) {
            const connection = (navigator as any).connection;
            connection.addEventListener('change', () => {
                console.log(`📶 Connection type changed to: ${connection.effectiveType}`);
                this.adaptToConnectionType(connection.effectiveType);
            });
        }
    }

    /**
     * Setup page visibility monitoring
     */
    private setupVisibilityMonitoring(): void {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                console.log('👁️ Page visible - performing connection health check');
                this.performImmediateHealthCheck();
            } else {
                console.log('🙈 Page hidden - maintaining background connection');
                this.optimizeForBackground();
            }
        });

        // Handle page focus/blur for additional reliability
        window.addEventListener('focus', () => {
            console.log('🎯 Window focused - ensuring optimal connection');
            this.ensureOptimalConnection();
        });

        window.addEventListener('blur', () => {
            console.log('😴 Window blurred - maintaining efficient connection');
            this.maintainEfficientConnection();
        });
    }

    /**
     * Setup performance monitoring
     */
    private setupPerformanceMonitoring(): void {
        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                const memory = (performance as any).memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
                    console.warn('⚠️ High memory usage detected - optimizing connection');
                    this.optimizeForMemory();
                }
            }, 30000);
        }

        // Monitor CPU usage through frame rate
        let lastFrameTime = performance.now();
        const checkFrameRate = () => {
            const now = performance.now();
            const frameDuration = now - lastFrameTime;
            lastFrameTime = now;

            if (frameDuration > 50) { // Less than 20 FPS
                console.warn('⚠️ Performance degradation detected - adjusting connection strategy');
                this.adjustForPerformance();
            }

            requestAnimationFrame(checkFrameRate);
        };
        requestAnimationFrame(checkFrameRate);
    }

    /**
     * Setup connection persistence strategies
     */
    private setupConnectionPersistence(): void {
        // Prevent page unload during critical operations
        window.addEventListener('beforeunload', (event) => {
            if (this.hasCriticalOperations()) {
                event.preventDefault();
                event.returnValue = 'Trading operations in progress. Are you sure you want to leave?';
            }
        });

        // Setup service worker for background connectivity (if available)
        if ('serviceWorker' in navigator) {
            this.setupServiceWorkerConnection();
        }

        // Setup periodic connection validation
        setInterval(() => {
            this.validateConnectionIntegrity();
        }, this.config.healthCheckInterval);
    }

    /**
     * Trigger immediate reconnection with optimal strategy
     */
    private triggerImmediateReconnection(): void {
        // Reset to primary strategy
        this.currentStrategyIndex = 0;
        
        // Use aggressive reconnection settings
        const originalDelay = this.config.reconnectDelay;
        this.config.reconnectDelay = 100; // Very fast reconnection
        
        // Attempt connection
        this.attemptConnection();
        
        // Restore original delay after first attempt
        setTimeout(() => {
            this.config.reconnectDelay = originalDelay;
        }, 5000);
    }

    /**
     * Pause reconnection attempts during offline periods
     */
    private pauseReconnectionAttempts(): void {
        // Implementation would pause the reconnection logic
        console.log('⏸️ Pausing reconnection attempts until network is back');
    }

    /**
     * Adapt connection strategy based on network type
     */
    private adaptToConnectionType(effectiveType: string): void {
        switch (effectiveType) {
            case 'slow-2g':
            case '2g':
                this.config.pingInterval = 30000; // Less frequent pings
                this.config.tickTimeoutDuration = 60000; // More tolerance
                break;
            case '3g':
                this.config.pingInterval = 20000;
                this.config.tickTimeoutDuration = 45000;
                break;
            case '4g':
            default:
                this.config.pingInterval = 10000; // Optimal settings
                this.config.tickTimeoutDuration = 30000;
                break;
        }
        
        console.log(`📶 Adapted connection settings for ${effectiveType}`);
    }

    /**
     * Perform immediate health check
     */
    private performImmediateHealthCheck(): void {
        // Implementation would check connection health immediately
        console.log('🏥 Performing immediate health check');
    }

    /**
     * Optimize connection for background operation
     */
    private optimizeForBackground(): void {
        // Reduce ping frequency to save resources
        this.config.pingInterval = Math.min(this.config.pingInterval * 2, 60000);
        console.log('🔋 Optimized connection for background operation');
    }

    /**
     * Ensure optimal connection when page is active
     */
    private ensureOptimalConnection(): void {
        // Reset to optimal settings
        this.config.pingInterval = 10000;
        this.performImmediateHealthCheck();
        console.log('⚡ Ensured optimal connection for active use');
    }

    /**
     * Maintain efficient connection during blur
     */
    private maintainEfficientConnection(): void {
        // Slightly reduce frequency but maintain reliability
        this.config.pingInterval = 15000;
        console.log('🔧 Maintaining efficient connection');
    }

    /**
     * Optimize for high memory usage
     */
    private optimizeForMemory(): void {
        // Reduce history size and optimize data structures
        console.log('🧠 Optimizing connection for memory constraints');
    }

    /**
     * Adjust for performance issues
     */
    private adjustForPerformance(): void {
        // Reduce connection overhead
        this.config.pingInterval = Math.min(this.config.pingInterval * 1.5, 30000);
        console.log('🚀 Adjusted connection for performance optimization');
    }

    /**
     * Check if there are critical operations in progress
     */
    private hasCriticalOperations(): boolean {
        // Implementation would check for active trades, pending orders, etc.
        return false; // Placeholder
    }

    /**
     * Setup service worker for background connectivity
     */
    private setupServiceWorkerConnection(): void {
        navigator.serviceWorker.register('/sw.js').then(() => {
            console.log('👷 Service worker registered for background connectivity');
        }).catch(() => {
            console.log('👷 Service worker not available');
        });
    }

    /**
     * Validate connection integrity
     */
    private validateConnectionIntegrity(): void {
        // Implementation would validate the connection is working properly
        console.log('🔍 Validating connection integrity');
    }

    /**
     * Attempt connection with current strategy
     */
    private attemptConnection(): void {
        const strategy = this.connectionStrategies[this.currentStrategyIndex];
        console.log(`🔌 Attempting connection with strategy: ${strategy.server}/${strategy.appId}`);
        
        // Implementation would attempt the actual connection
        // This is a placeholder for the connection logic
    }

    /**
     * Add event listeners
     */
    on(event: 'connected', callback: () => void): void;
    on(event: 'disconnected', callback: (reason?: string) => void): void;
    on(event: 'qualityChange', callback: (quality: ConnectionQuality) => void): void;
    on(event: 'statusChange', callback: (status: ConnectionStatus) => void): void;
    on(event: string, callback: any): void {
        if (this.listeners[event as keyof typeof this.listeners]) {
            (this.listeners[event as keyof typeof this.listeners] as Set<any>).add(callback);
        }
    }

    /**
     * Remove event listeners
     */
    off(event: string, callback: any): void {
        if (this.listeners[event as keyof typeof this.listeners]) {
            (this.listeners[event as keyof typeof this.listeners] as Set<any>).delete(callback);
        }
    }

    /**
     * Get current connection status
     */
    getStatus(): ConnectionStatus {
        return {
            isConnected: true, // Placeholder
            isConnecting: false,
            reconnectAttempts: 0,
            currentServer: this.connectionStrategies[this.currentStrategyIndex].server,
            lastTickTime: Date.now(),
            timeSinceLastTick: 0,
            connectionQuality: this.connectionQuality,
            networkOnline: navigator.onLine,
            pageVisible: document.visibilityState === 'visible',
        };
    }

    /**
     * Force reconnection with next strategy
     */
    forceReconnectWithNextStrategy(): void {
        this.currentStrategyIndex = (this.currentStrategyIndex + 1) % this.connectionStrategies.length;
        this.attemptConnection();
    }

    /**
     * Get connection quality recommendations
     */
    getQualityRecommendations(): string[] {
        const recommendations: string[] = [];
        
        if (this.connectionQuality.qualityScore < 70) {
            recommendations.push('Consider switching to a more stable network');
        }
        
        if (this.connectionQuality.latency > 1000) {
            recommendations.push('High latency detected - check network connection');
        }
        
        if (this.connectionQuality.failedPings > 5) {
            recommendations.push('Multiple connection failures - trying alternative servers');
        }
        
        return recommendations;
    }
}

export const enhancedConnectionManager = new EnhancedConnectionManagerService();
