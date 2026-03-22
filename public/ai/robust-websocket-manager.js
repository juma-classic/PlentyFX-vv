/**
 * Enhanced Robust WebSocket Manager for Deriv API
 * Handles automatic reconnection, connection monitoring, and error recovery
 * Optimized for maximum uptime and reliability
 */

class RobustWebSocketManager {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 50; // Increased from 10 to 50
        this.reconnectDelay = 500; // Start with 500ms for faster recovery
        this.maxReconnectDelay = 15000; // Reduced from 30s to 15s
        this.heartbeatInterval = null;
        this.heartbeatTimeout = null;
        this.connectionTimeout = null;
        this.lastPingTime = 0;
        this.pingInterval = 15000; // Reduced from 30s to 15s for more frequent checks
        this.pongTimeout = 5000; // Reduced from 10s to 5s for faster detection
        
        // Enhanced connection monitoring
        this.connectionHealthCheck = null;
        this.healthCheckInterval = 10000; // Check every 10 seconds
        this.networkChangeListener = null;
        this.visibilityChangeListener = null;
        this.beforeUnloadListener = null;
        
        // Callbacks
        this.onConnectedCallback = null;
        this.onDisconnectedCallback = null;
        this.onMessageCallback = null;
        this.onErrorCallback = null;
        
        // Connection monitoring
        this.lastTickTime = 0;
        this.tickTimeoutDuration = 45000; // Reduced from 60s to 45s
        this.tickTimeoutId = null;
        
        // Use your main App ID for consistency
        this.appIds = ['119552']; // Your main App ID
        this.currentAppIdIndex = 0;
        this.wsUrls = this.appIds.map(id => `wss://ws.binaryws.com/websockets/v3?app_id=${id}`);
        
        // Connection quality tracking
        this.connectionQuality = {
            latency: 0,
            successfulPings: 0,
            failedPings: 0,
            reconnectCount: 0,
            lastSuccessfulConnection: 0
        };
        
        console.log('🔧 Enhanced RobustWebSocketManager initialized with multiple failover strategies');
        
        // Initialize enhanced monitoring
        this.initializeEnhancedMonitoring();
    }

    /**
     * Initialize enhanced monitoring for better connection reliability
     */
    initializeEnhancedMonitoring() {
        // Monitor network connectivity changes
        this.networkChangeListener = () => {
            console.log('🌐 Network connectivity changed');
            if (navigator.onLine) {
                console.log('📶 Network back online - attempting reconnection');
                if (!this.isConnected && !this.isConnecting) {
                    setTimeout(() => this.connect(), 1000);
                }
            } else {
                console.log('📵 Network offline detected');
                this.updateConnectionStatus('offline');
            }
        };
        
        window.addEventListener('online', this.networkChangeListener);
        window.addEventListener('offline', this.networkChangeListener);
        
        // Monitor page visibility changes
        this.visibilityChangeListener = () => {
            if (document.visibilityState === 'visible') {
                console.log('👁️ Page became visible - checking connection');
                this.performHealthCheck();
                
                // If disconnected while hidden, try to reconnect
                if (!this.isConnected && !this.isConnecting) {
                    setTimeout(() => this.connect(), 500);
                }
            } else {
                console.log('🙈 Page hidden - maintaining connection');
            }
        };
        
        document.addEventListener('visibilitychange', this.visibilityChangeListener);
        
        // Handle page unload gracefully
        this.beforeUnloadListener = () => {
            console.log('🚪 Page unloading - closing connection gracefully');
            if (this.ws) {
                this.ws.close(1000, 'Page unload');
            }
        };
        
        window.addEventListener('beforeunload', this.beforeUnloadListener);
        
        // Start periodic health checks
        this.startHealthCheck();
    }

    /**
     * Start periodic connection health checks
     */
    startHealthCheck() {
        this.connectionHealthCheck = setInterval(() => {
            this.performHealthCheck();
        }, this.healthCheckInterval);
    }

    /**
     * Perform connection health check
     */
    performHealthCheck() {
        if (!this.isConnected) {
            console.log('🏥 Health check: Not connected - attempting reconnection');
            if (!this.isConnecting) {
                this.connect();
            }
            return;
        }
        
        // Check if we've received recent data
        const timeSinceLastTick = Date.now() - this.lastTickTime;
        if (this.lastTickTime > 0 && timeSinceLastTick > this.tickTimeoutDuration) {
            console.warn('🏥 Health check: No recent ticks - connection may be stale');
            this.forceReconnect();
            return;
        }
        
        // Check connection quality
        const pingSuccessRate = this.connectionQuality.successfulPings / 
            (this.connectionQuality.successfulPings + this.connectionQuality.failedPings);
        
        if (this.connectionQuality.failedPings > 5 && pingSuccessRate < 0.7) {
            console.warn('🏥 Health check: Poor connection quality - reconnecting');
            this.forceReconnect();
            return;
        }
        
        console.log('🏥 Health check: Connection healthy ✅');
    }

    /**
     * Stop health check
     */
    stopHealthCheck() {
        if (this.connectionHealthCheck) {
            clearInterval(this.connectionHealthCheck);
            this.connectionHealthCheck = null;
        }
    }

    /**
     * Set callback functions
     */
    setCallbacks({ onConnected, onDisconnected, onMessage, onError }) {
        this.onConnectedCallback = onConnected;
        this.onDisconnectedCallback = onDisconnected;
        this.onMessageCallback = onMessage;
        this.onErrorCallback = onError;
    }

    /**
     * Connect to WebSocket with failover support
     */
    connect() {
        if (this.isConnecting || this.isConnected) {
            console.log('🔄 Already connecting or connected');
            return;
        }

        this.isConnecting = true;
        const currentUrl = this.wsUrls[this.currentAppIdIndex];
        console.log(`🔌 Attempting to connect to ${currentUrl}... (attempt ${this.reconnectAttempts + 1})`);

        try {
            this.ws = new WebSocket(currentUrl);
            
            // Set connection timeout
            this.connectionTimeout = setTimeout(() => {
                if (!this.isConnected) {
                    console.warn('⏰ Connection timeout - trying next server');
                    this.tryNextServer();
                }
            }, 8000); // Reduced from 10s to 8s for faster failover

            this.ws.onopen = () => {
                console.log(`✅ WebSocket connected successfully to ${currentUrl}`);
                this.handleConnectionSuccess();
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event);
            };

            this.ws.onerror = (error) => {
                console.error(`❌ WebSocket error on ${currentUrl}:`, error);
                this.handleError(error);
            };

            this.ws.onclose = (event) => {
                console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason}`);
                this.handleDisconnection(event);
            };

        } catch (error) {
            console.error('❌ Failed to create WebSocket:', error);
            this.tryNextServer();
        }
    }

    /**
     * Try connecting to the next server in the list
     */
    tryNextServer() {
        clearTimeout(this.connectionTimeout);
        this.isConnecting = false;
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        // Move to next app ID
        this.currentAppIdIndex = (this.currentAppIdIndex + 1) % this.wsUrls.length;
        
        // If we've tried all servers, increase reconnect attempts
        if (this.currentAppIdIndex === 0) {
            this.reconnectAttempts++;
        }
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached on all servers');
            this.updateConnectionStatus('failed');
            return;
        }
        
        // Try next server with minimal delay
        setTimeout(() => {
            this.connect();
        }, 1000);
    }

    /**
     * Handle successful connection
     */
    handleConnectionSuccess() {
        clearTimeout(this.connectionTimeout);
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 500; // Reset delay
        this.connectionQuality.lastSuccessfulConnection = Date.now();
        this.connectionQuality.reconnectCount++;
        
        // Reset app ID index to primary server for next time
        this.currentAppIdIndex = 0;
        
        this.startHeartbeat();
        this.startTickTimeout();
        
        if (this.onConnectedCallback) {
            this.onConnectedCallback();
        }
        
        this.updateConnectionStatus('connected');
        
        // Send initial ping to establish baseline
        setTimeout(() => {
            this.sendPing();
        }, 1000);
        
        console.log('🎉 Connection established and monitoring started');
    }

    /**
     * Handle connection failure
     */
    handleConnectionFailure() {
        clearTimeout(this.connectionTimeout);
        this.isConnecting = false;
        this.isConnected = false;
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        this.scheduleReconnect();
    }

    /**
     * Handle disconnection
     */
    handleDisconnection(event) {
        this.isConnected = false;
        this.isConnecting = false;
        
        this.stopHeartbeat();
        this.stopTickTimeout();
        
        if (this.onDisconnectedCallback) {
            this.onDisconnectedCallback(event);
        }
        
        this.updateConnectionStatus('disconnected');
        
        // Don't reconnect if it was a normal closure
        if (event.code !== 1000) {
            this.scheduleReconnect();
        }
    }

    /**
     * Handle WebSocket message
     */
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            // Handle pong response
            if (data.msg_type === 'ping') {
                this.handlePong();
                return;
            }
            
            // Check for API errors first
            if (data.error) {
                this.handleApiError(data);
                return;
            }
            
            // Update last tick time for live ticks
            if (data.tick) {
                this.lastTickTime = Date.now();
                this.resetTickTimeout();
            }
            
            // Update last tick time for historical data
            if (data.history) {
                this.lastTickTime = Date.now();
                this.resetTickTimeout();
            }
            
            // Call the message callback for successful responses
            if (this.onMessageCallback) {
                this.onMessageCallback(data);
            }
            
        } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
            console.error('Raw message:', event.data);
            this.handleError(error);
        }
    }

    /**
     * Handle WebSocket error
     */
    handleError(error) {
        console.error('❌ WebSocket error occurred:', error);
        
        if (this.onErrorCallback) {
            this.onErrorCallback(error);
        }
        
        this.updateConnectionStatus('error');
        
        // Schedule reconnection for connection errors
        if (!this.isConnected) {
            this.scheduleReconnect();
        }
    }

    /**
     * Handle API-specific errors from Deriv WebSocket
     */
    handleApiError(data) {
        console.warn('🚨 API Error received:', data.error);
        
        const errorCode = data.error?.code;
        const errorMessage = data.error?.message;
        
        // Log the specific error for debugging
        console.warn(`API Error - Code: ${errorCode}, Message: ${errorMessage}`);
        
        // Handle specific error types
        switch (errorCode) {
            case 'WrongResponse':
                console.warn('⚠️ WrongResponse error - server processing issue');
                // Don't reconnect immediately for server-side errors
                setTimeout(() => {
                    if (!this.isConnected) {
                        this.scheduleReconnect();
                    }
                }, 5000); // Wait 5 seconds before retry
                break;
                
            case 'InvalidToken':
            case 'AuthorizationRequired':
                console.error('🔐 Authentication error - not retrying');
                // Don't retry for auth errors
                this.updateConnectionStatus('failed');
                break;
                
            case 'RateLimit':
                console.warn('⏱️ Rate limit exceeded - backing off');
                // Increase delay for rate limiting
                this.reconnectDelay = Math.min(this.reconnectDelay * 3, this.maxReconnectDelay);
                this.scheduleReconnect();
                break;
                
            default:
                console.warn('❓ Unknown API error - will retry');
                // For unknown errors, try reconnecting with normal delay
                this.scheduleReconnect();
                break;
        }
        
        // Call error callback if provided
        if (this.onErrorCallback) {
            this.onErrorCallback(data.error);
        }
    }

    /**
     * Schedule reconnection
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            this.updateConnectionStatus('failed');
            return;
        }

        this.reconnectAttempts++;
        
        console.log(`⏳ Scheduling reconnect in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);
        
        // Exponential backoff with jitter
        this.reconnectDelay = Math.min(
            this.reconnectDelay * 2 + Math.random() * 1000,
            this.maxReconnectDelay
        );
        
        this.updateConnectionStatus('reconnecting');
    }

    /**
     * Start heartbeat mechanism
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.sendPing();
        }, this.pingInterval);
    }

    /**
     * Stop heartbeat mechanism
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
        }
    }

    /**
     * Send ping to server with enhanced monitoring
     */
    sendPing() {
        if (!this.isConnected || !this.ws) return;
        
        try {
            this.lastPingTime = Date.now();
            this.ws.send(JSON.stringify({ ping: 1 }));
            
            // Set timeout for pong response
            this.heartbeatTimeout = setTimeout(() => {
                console.warn('⏰ Ping timeout - no pong received');
                this.connectionQuality.failedPings++;
                
                // If we have too many failed pings, force reconnect
                if (this.connectionQuality.failedPings >= 3) {
                    console.warn('💔 Multiple ping failures - forcing reconnection');
                    this.forceReconnect();
                } else {
                    // Try another ping
                    setTimeout(() => this.sendPing(), 2000);
                }
            }, this.pongTimeout);
            
        } catch (error) {
            console.error('❌ Failed to send ping:', error);
            this.connectionQuality.failedPings++;
            this.handleConnectionFailure();
        }
    }

    /**
     * Handle pong response with quality tracking
     */
    handlePong() {
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
        }
        
        const latency = Date.now() - this.lastPingTime;
        this.connectionQuality.latency = latency;
        this.connectionQuality.successfulPings++;
        
        // Reset failed pings counter on successful pong
        this.connectionQuality.failedPings = 0;
        
        console.log(`🏓 Pong received (latency: ${latency}ms) - Connection quality: ${this.getConnectionQualityScore()}%`);
    }

    /**
     * Calculate connection quality score
     */
    getConnectionQualityScore() {
        const totalPings = this.connectionQuality.successfulPings + this.connectionQuality.failedPings;
        if (totalPings === 0) return 100;
        
        const successRate = (this.connectionQuality.successfulPings / totalPings) * 100;
        const latencyScore = Math.max(0, 100 - (this.connectionQuality.latency / 10)); // Penalize high latency
        
        return Math.round((successRate + latencyScore) / 2);
    }

    /**
     * Start tick timeout monitoring
     */
    startTickTimeout() {
        this.resetTickTimeout();
    }

    /**
     * Reset tick timeout
     */
    resetTickTimeout() {
        if (this.tickTimeoutId) {
            clearTimeout(this.tickTimeoutId);
        }
        
        this.tickTimeoutId = setTimeout(() => {
            console.warn('⏰ No ticks received for 60 seconds - reconnecting');
            this.handleConnectionFailure();
        }, this.tickTimeoutDuration);
    }

    /**
     * Stop tick timeout monitoring
     */
    stopTickTimeout() {
        if (this.tickTimeoutId) {
            clearTimeout(this.tickTimeoutId);
            this.tickTimeoutId = null;
        }
    }

    /**
     * Send message to WebSocket
     */
    send(message) {
        if (!this.isConnected || !this.ws) {
            console.warn('⚠️ Cannot send message - not connected');
            return false;
        }
        
        try {
            const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
            this.ws.send(messageStr);
            return true;
        } catch (error) {
            console.error('❌ Failed to send message:', error);
            this.handleError(error);
            return false;
        }
    }

    /**
     * Disconnect WebSocket and clean up all resources
     */
    disconnect() {
        console.log('🔌 Disconnecting WebSocket...');
        
        this.stopHeartbeat();
        this.stopTickTimeout();
        this.stopHealthCheck();
        
        // Clean up event listeners
        if (this.networkChangeListener) {
            window.removeEventListener('online', this.networkChangeListener);
            window.removeEventListener('offline', this.networkChangeListener);
        }
        
        if (this.visibilityChangeListener) {
            document.removeEventListener('visibilitychange', this.visibilityChangeListener);
        }
        
        if (this.beforeUnloadListener) {
            window.removeEventListener('beforeunload', this.beforeUnloadListener);
        }
        
        if (this.ws) {
            this.ws.close(1000, 'Normal closure');
            this.ws = null;
        }
        
        this.isConnected = false;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        this.updateConnectionStatus('disconnected');
    }

    /**
     * Force reconnection
     */
    forceReconnect() {
        console.log('🔄 Forcing reconnection...');
        this.disconnect();
        setTimeout(() => {
            this.connect();
        }, 1000);
    }

    /**
     * Get detailed connection status and quality metrics
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
            reconnectAttempts: this.reconnectAttempts,
            currentServer: this.wsUrls[this.currentAppIdIndex],
            lastTickTime: this.lastTickTime,
            timeSinceLastTick: this.lastTickTime ? Date.now() - this.lastTickTime : null,
            connectionQuality: {
                ...this.connectionQuality,
                qualityScore: this.getConnectionQualityScore()
            },
            networkOnline: navigator.onLine,
            pageVisible: document.visibilityState === 'visible'
        };
    }

    /**
     * Update connection status in UI with enhanced information
     */
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;
        
        const statusDot = statusElement.querySelector('.status-dot');
        const statusText = statusElement.querySelector('.status-text');
        
        if (!statusDot || !statusText) return;
        
        // Remove all status classes
        statusDot.className = 'status-dot';
        
        const qualityScore = this.getConnectionQualityScore();
        const serverIndex = this.currentAppIdIndex + 1;
        
        switch (status) {
            case 'connected':
                statusDot.classList.add('status-connected');
                statusText.textContent = `Connected (${qualityScore}% quality)`;
                statusText.title = `Server ${serverIndex}, Latency: ${this.connectionQuality.latency}ms`;
                break;
            case 'connecting':
                statusDot.classList.add('status-connecting');
                statusText.textContent = `Connecting to server ${serverIndex}...`;
                break;
            case 'reconnecting':
                statusDot.classList.add('status-connecting');
                statusText.textContent = `Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`;
                break;
            case 'disconnected':
                statusDot.classList.add('status-disconnected');
                statusText.textContent = 'Disconnected';
                break;
            case 'offline':
                statusDot.classList.add('status-offline');
                statusText.textContent = 'Network Offline';
                break;
            case 'error':
                statusDot.classList.add('status-error');
                statusText.textContent = 'Connection Error';
                break;
            case 'failed':
                statusDot.classList.add('status-failed');
                statusText.textContent = 'Connection Failed - Check Network';
                break;
            default:
                statusDot.classList.add('status-unknown');
                statusText.textContent = 'Unknown';
        }
    }

    /**
     * Add connection status indicator to page with enhanced styling
     */
    addConnectionStatusIndicator() {
        // Check if already exists
        if (document.getElementById('connection-status')) return;
        
        const statusHTML = `
            <div id="connection-status" class="connection-status enhanced">
                <span class="status-dot status-connecting"></span>
                <span class="status-text">Initializing...</span>
            </div>
        `;
        
        // Add enhanced CSS for better status display
        const statusCSS = `
            <style>
                .connection-status.enhanced {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                
                .connection-status.enhanced:hover {
                    background: rgba(255, 255, 255, 0.15);
                    transform: translateY(-1px);
                }
                
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                    position: relative;
                }
                
                .status-dot::after {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    border-radius: 50%;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .status-connected {
                    background: #10b981;
                    box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
                }
                
                .status-connected::after {
                    background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%);
                    opacity: 1;
                    animation: pulse-green 2s infinite;
                }
                
                .status-connecting {
                    background: #f59e0b;
                    animation: pulse-orange 1.5s infinite;
                }
                
                .status-disconnected {
                    background: #ef4444;
                }
                
                .status-offline {
                    background: #6b7280;
                }
                
                .status-error {
                    background: #dc2626;
                    animation: pulse-red 1s infinite;
                }
                
                .status-failed {
                    background: #991b1b;
                }
                
                @keyframes pulse-green {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                @keyframes pulse-orange {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.1); }
                }
                
                @keyframes pulse-red {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
                
                .status-text {
                    color: rgba(255, 255, 255, 0.9);
                    white-space: nowrap;
                    cursor: help;
                }
            </style>
        `;
        
        // Add CSS to head
        document.head.insertAdjacentHTML('beforeend', statusCSS);
        
        // Add to header if it exists
        const header = document.querySelector('.header, .header-compact');
        if (header) {
            const container = header.querySelector('.container');
            if (container) {
                container.insertAdjacentHTML('beforeend', statusHTML);
            }
        }
    }

    // NOTE: Mock data generation removed - This is a REAL MONEY trading platform
    // All data must come from live Deriv WebSocket API only
}

// Export for use in main application
window.RobustWebSocketManager = RobustWebSocketManager;
