/**
 * Deriv Connection Pool Service
 * Manages multiple App IDs for different features with load balancing
 */

import { RobustDerivConnectionService } from './robust-deriv-connection.service';

export enum ConnectionType {
    CORE = 'core', // Default App ID - unchanged for core features
    ANALYSIS = 'analysis', // Analysis tools, charts, indicators
    SIGNALS = 'signals', // Signal generation, pattern analysis
    FASTLANE = 'fastlane', // Fast lane trading, high-frequency operations
}

interface AppIdConfig {
    appId: string;
    type: ConnectionType;
    description: string;
    features: string[];
    maxConcurrentSubscriptions: number;
}

class DerivConnectionPoolService {
    private connections: Map<ConnectionType, RobustDerivConnectionService> = new Map();
    private subscriptionCounts: Map<ConnectionType, number> = new Map();
    private roundRobinIndex: number = 0;

    // App ID Configuration - TEMPORARY: Use single App ID to resolve connection issues
    private readonly appIdConfigs: AppIdConfig[] = [
        {
            appId: '117918', // Your default App ID - UNCHANGED
            type: ConnectionType.CORE,
            description: 'All Trading Features (Consolidated)',
            features: ['Bot Builder', 'Trading', 'Analysis', 'Signals', 'Fast Lane'],
            maxConcurrentSubscriptions: 100,
        },
        // Temporarily disabled other App IDs to resolve connection timeouts
        // {
        //     appId: '117918', // Analysis tools
        //     type: ConnectionType.ANALYSIS,
        //     description: 'Analysis & Chart Tools',
        //     features: ['Live Tick Patterns', 'Streak Analysis', 'Chart Analysis', 'Market Data'],
        //     maxConcurrentSubscriptions: 30
        // },
        // {
        //     appId: '80437',  // Signals
        //     type: ConnectionType.SIGNALS,
        //     description: 'Signal Generation',
        //     features: ['Signal Pro', 'Multi-Market Signals', 'Pattern Recognition', 'AI Predictions'],
        //     maxConcurrentSubscriptions: 40
        // },
        // {
        //     appId: '72079',  // Fast lane
        //     type: ConnectionType.FASTLANE,
        //     description: 'Fast Lane Trading',
        //     features: ['1-Second Trading', 'High-Frequency Signals', 'Speed Mode', 'Quick Execution'],
        //     maxConcurrentSubscriptions: 25
        // }
    ];

    constructor() {
        this.initializeConnections();
    }

    /**
     * Initialize all connection pools
     */
    private initializeConnections(): void {
        console.log('🔧 Initializing Deriv Connection Pool...');

        this.appIdConfigs.forEach(config => {
            console.log(`📡 Setting up ${config.type} connection (App ID: ${config.appId})`);

            const connection = new RobustDerivConnectionService({
                appId: config.appId,
                maxRetries: Infinity,
                retryDelay: 2000,
                heartbeatInterval: 30000,
                connectionTimeout: 10000,
            });

            this.connections.set(config.type, connection);
            this.subscriptionCounts.set(config.type, 0);

            // Log connection status
            connection.onConnectionChange(connected => {
                const status = connected ? '🟢 CONNECTED' : '🔴 DISCONNECTED';
                console.log(`${status} ${config.type.toUpperCase()} (${config.appId}): ${config.description}`);
            });
        });

        console.log('✅ Connection Pool initialized with single App ID (110800) for all features');
        console.log('📊 This temporary fix consolidates all connections to resolve timeout issues');
        this.logConnectionDistribution();
    }

    /**
     * Get connection for specific feature type
     */
    public getConnection(type: ConnectionType): RobustDerivConnectionService {
        // With single App ID configuration, all types use the same connection
        const connection = this.connections.get(ConnectionType.CORE) || this.connections.get(type);
        if (!connection) {
            throw new Error(`No connection available for type: ${type}`);
        }
        return connection;
    }

    /**
     * Get optimal connection with load balancing for analysis features
     */
    public getOptimalAnalysisConnection(): RobustDerivConnectionService {
        const analysisTypes = [ConnectionType.ANALYSIS, ConnectionType.SIGNALS];

        // Find connection with lowest load
        let optimalType = ConnectionType.ANALYSIS;
        let lowestLoad = this.subscriptionCounts.get(ConnectionType.ANALYSIS) || 0;

        for (const type of analysisTypes) {
            const load = this.subscriptionCounts.get(type) || 0;
            const maxLoad = this.getMaxSubscriptions(type);

            if (load < maxLoad && load < lowestLoad) {
                optimalType = type;
                lowestLoad = load;
            }
        }

        console.log(`🎯 Selected ${optimalType} connection for analysis (load: ${lowestLoad})`);
        return this.getConnection(optimalType);
    }

    /**
     * Subscribe to ticks with automatic connection selection
     */
    public async subscribeToTicks(
        symbol: string,
        callback: (tickData: unknown) => void,
        preferredType?: ConnectionType
    ): Promise<() => void> {
        // Determine which connection to use
        let connectionType: ConnectionType;

        if (preferredType) {
            connectionType = preferredType;
        } else {
            // Auto-select based on symbol and feature
            connectionType = this.selectConnectionForSymbol(symbol);
        }

        const connection = this.getConnection(connectionType);

        // Increment subscription count
        const currentCount = this.subscriptionCounts.get(connectionType) || 0;
        this.subscriptionCounts.set(connectionType, currentCount + 1);

        console.log(
            `📡 Subscribing to ${symbol} via ${connectionType.toUpperCase()} (${this.getAppId(connectionType)})`
        );
        console.log(`📊 ${connectionType} load: ${currentCount + 1}/${this.getMaxSubscriptions(connectionType)}`);

        try {
            const unsubscribe = await connection.subscribeToTicks(symbol, callback);

            // Return wrapped unsubscribe function that decrements count
            return () => {
                const count = this.subscriptionCounts.get(connectionType) || 0;
                this.subscriptionCounts.set(connectionType, Math.max(0, count - 1));
                console.log(`🔇 Unsubscribed from ${symbol} (${connectionType} load: ${count - 1})`);
                unsubscribe();
            };
        } catch (error) {
            // Decrement count on error
            const count = this.subscriptionCounts.get(connectionType) || 0;
            this.subscriptionCounts.set(connectionType, Math.max(0, count - 1));
            throw error;
        }
    }

    /**
     * Smart connection selection based on symbol and usage pattern
     */
    private selectConnectionForSymbol(symbol: string): ConnectionType {
        // 1-second indices use FASTLANE
        if (symbol.startsWith('1HZ')) {
            return ConnectionType.FASTLANE;
        }

        // Round-robin between ANALYSIS and SIGNALS for regular symbols
        const analysisTypes = [ConnectionType.ANALYSIS, ConnectionType.SIGNALS];
        const selectedType = analysisTypes[this.roundRobinIndex % analysisTypes.length];
        this.roundRobinIndex++;

        return selectedType;
    }

    /**
     * Get App ID for connection type
     */
    public getAppId(type: ConnectionType): string {
        const config = this.appIdConfigs.find(c => c.type === type);
        return config?.appId || '110800';
    }

    /**
     * Get max subscriptions for connection type
     */
    private getMaxSubscriptions(type: ConnectionType): number {
        const config = this.appIdConfigs.find(c => c.type === type);
        return config?.maxConcurrentSubscriptions || 50;
    }

    /**
     * Get connection statistics
     */
    public getConnectionStats() {
        const stats: Record<string, any> = {};

        this.appIdConfigs.forEach(config => {
            const connection = this.connections.get(config.type);
            const subscriptionCount = this.subscriptionCounts.get(config.type) || 0;

            stats[config.type] = {
                appId: config.appId,
                description: config.description,
                features: config.features,
                isConnected: connection?.isConnectionActive() || false,
                subscriptions: subscriptionCount,
                maxSubscriptions: config.maxConcurrentSubscriptions,
                loadPercentage: Math.round((subscriptionCount / config.maxConcurrentSubscriptions) * 100),
                connectionStats: connection?.getConnectionStats(),
            };
        });

        return stats;
    }

    /**
     * Force reconnect all connections
     */
    public async forceReconnectAll(): Promise<void> {
        console.log('🔄 Force reconnecting all connections...');

        const reconnectPromises = Array.from(this.connections.values()).map(connection => connection.forceReconnect());

        await Promise.allSettled(reconnectPromises);
        console.log('✅ All connections reconnected');
    }

    /**
     * Get connection health status
     */
    public getHealthStatus() {
        const health = {
            totalConnections: this.connections.size,
            activeConnections: 0,
            totalSubscriptions: 0,
            connectionDetails: {} as Record<string, any>,
        };

        this.appIdConfigs.forEach(config => {
            const connection = this.connections.get(config.type);
            const isActive = connection?.isConnectionActive() || false;
            const subscriptions = this.subscriptionCounts.get(config.type) || 0;

            if (isActive) health.activeConnections++;
            health.totalSubscriptions += subscriptions;

            health.connectionDetails[config.type] = {
                appId: config.appId,
                active: isActive,
                subscriptions,
                maxSubscriptions: config.maxConcurrentSubscriptions,
            };
        });

        return health;
    }

    /**
     * Log connection distribution
     */
    private logConnectionDistribution(): void {
        console.log('\n📋 CONNECTION DISTRIBUTION:');
        console.log('┌─────────────┬──────────┬─────────────────────────────────┐');
        console.log('│ Type        │ App ID   │ Features                        │');
        console.log('├─────────────┼──────────┼─────────────────────────────────┤');

        this.appIdConfigs.forEach(config => {
            const type = config.type.padEnd(11);
            const appId = config.appId.padEnd(8);
            const features = config.features.join(', ').substring(0, 31);
            console.log(`│ ${type} │ ${appId} │ ${features.padEnd(31)} │`);
        });

        console.log('└─────────────┴──────────┴─────────────────────────────────┘\n');
    }

    /**
     * Monitor and log connection status periodically
     */
    public startHealthMonitoring(): void {
        setInterval(() => {
            const health = this.getHealthStatus();
            console.log(
                `💓 Health: ${health.activeConnections}/${health.totalConnections} connections active, ${health.totalSubscriptions} total subscriptions`
            );
        }, 60000); // Every minute
    }

    /**
     * Cleanup all connections
     */
    public destroy(): void {
        console.log('🧹 Destroying connection pool...');
        this.connections.forEach(connection => connection.destroy());
        this.connections.clear();
        this.subscriptionCounts.clear();
    }
}

// Create singleton instance
export const derivConnectionPool = new DerivConnectionPoolService();

// Start health monitoring
derivConnectionPool.startHealthMonitoring();

