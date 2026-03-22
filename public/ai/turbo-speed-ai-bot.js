/**
 * Turbo Speed AI Bot - Ultra-Fast Trading with Existing Session
 * Uses existing Smart Analysis API connection for authentication
 * Executes trades on EVERY tick movement (ultra-fast mode)
 */

class TurboSpeedAIBot {
    constructor() {
        this.appId = '82255'; // Your App ID for Turbo Speed AI Bot
        this.smartAPI = null; // Will use existing Smart Analysis API connection
        this.isActive = false;
        this.callbacks = {};
        this.requestId = 1000; // Start from 1000 to avoid conflicts
        this.pendingTrades = new Map();
        this.tradeHistory = [];
        this.totalProfit = 0;
        
        // Bot settings - Ultra-fast mode
        this.settings = {
            strategy: 'even', // even, odd, over, under, matches, differs
            stake: 0.5,
            duration: 1,
            enableMartingale: true,
            martingaleMultiplier: 1.2,
            enableTakeProfit: false,
            takeProfitAmount: 2,
            enableStopLoss: false,
            stopLossAmount: 2,
            maxConsecutiveLosses: 5,
            ultraFastMode: true, // Trade on EVERY tick movement
            tradeFrequency: 1 // 1 = every tick, 3 = every 3 ticks (like main system)
        };
        
        // Trading state
        this.consecutiveLosses = 0;
        this.currentStake = this.settings.stake;
        this.lastTickData = null;
        this.tickCounter = 0;
        this.analysisData = {
            digitPercentages: Array(10).fill(10),
            evenOddRatio: { even: 50, odd: 50 },
            riseFallRatio: { rise: 50, fall: 50 },
            recentDigits: []
        };
        
        console.log(`🤖 Turbo Speed AI Bot initialized - ULTRA-FAST MODE (every tick)`);
    }

    /**
     * Set callbacks for bot events
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Update bot settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.currentStake = this.settings.stake;
        console.log('⚙️ Bot settings updated:', this.settings);
    }

    /**
     * Update bot configuration (alias for updateSettings for compatibility)
     */
    updateConfig(newConfig) {
        this.updateSettings(newConfig);
    }

    /**
     * Update analysis data for AI decisions
     */
    updateAnalysisData(data) {
        this.analysisData = { ...this.analysisData, ...data };
    }

    /**
     * Connect using existing Smart Analysis API (no separate login needed)
     */
    async connect(smartAnalysisAPI = null) {
        if (smartAnalysisAPI) {
            this.smartAPI = smartAnalysisAPI;
            console.log('✅ AI Bot connected using existing Smart Analysis API session');
            return Promise.resolve();
        }

        // Try to get global Smart Analysis API
        if (window.smartAPI && window.smartAPI.isInitialized) {
            this.smartAPI = window.smartAPI;
            console.log('✅ AI Bot connected using global Smart Analysis API session');
            return Promise.resolve();
        }

        // Fallback: Create minimal connection for trading only
        console.log('⚠️ No existing Smart Analysis API found, creating minimal trading connection...');
        return this.createMinimalConnection();
    }

    /**
     * Create minimal connection for trading (fallback)
     */
    async createMinimalConnection() {
        return new Promise((resolve, reject) => {
            const wsUrl = `wss://ws.binaryws.com/websockets/v3?app_id=${this.appId}`;
            console.log(`🔌 Creating minimal AI Bot connection: ${wsUrl}`);
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('✅ AI Bot minimal connection established');
                resolve();
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleDirectMessage(data);
                } catch (error) {
                    console.error('❌ AI Bot message parsing error:', error);
                }
            };

            this.ws.onclose = () => {
                console.warn('🔌 AI Bot connection closed');
                if (this.callbacks.onError) {
                    this.callbacks.onError('Connection lost');
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ AI Bot connection error:', error);
                reject(error);
            };
        });
    }

    /**
     * Handle direct WebSocket messages (fallback mode)
     */
    handleDirectMessage(data) {
        // Handle buy response
        if (data.buy) {
            this.handleTradeExecution(data);
            return;
        }

        // Handle proposal response
        if (data.proposal) {
            this.handleProposal(data);
            return;
        }

        // Handle contract settlement
        if (data.proposal_open_contract) {
            const contract = data.proposal_open_contract;
            if (contract.is_settled) {
                this.handleTradeResult(contract);
            }
            return;
        }

        // Handle errors
        if (data.error) {
            console.error('❌ AI Bot API Error:', data.error);
            if (this.callbacks.onError) {
                this.callbacks.onError(data.error.message || 'Trading error');
            }
        }
    }

    /**
     * Process tick data for ultra-fast trading decisions
     */
    processTick(tickData) {
        if (!this.isActive) return;

        this.tickCounter++;
        this.lastTickData = tickData;

        // Extract last digit using same method as Smart Analysis
        const quote = typeof tickData === 'object' ? tickData.quote : tickData;
        const lastDigit = this.getLastDigit(quote);
        
        // Update recent digits for analysis
        this.analysisData.recentDigits.push(lastDigit);
        if (this.analysisData.recentDigits.length > 100) {
            this.analysisData.recentDigits.shift();
        }

        // ULTRA-FAST MODE: Trade on every tick (vs every 3 ticks in main system)
        if (this.settings.ultraFastMode || this.tickCounter % this.settings.tradeFrequency === 0) {
            const decision = this.makeAIDecision(quote, lastDigit);
            
            if (decision.shouldTrade) {
                console.log(`⚡ ULTRA-FAST TRADE: Tick ${this.tickCounter} - ${decision.strategy.toUpperCase()} (confidence: ${(decision.confidence * 100).toFixed(1)}%)`);
                this.placeTrade(decision.strategy, decision.market);
            }
        }
    }

    /**
     * Extract last digit using same method as Smart Analysis
     */
    getLastDigit(tick) {
        let priceStr = tick.toString();
        let priceParts = priceStr.split('.');
        let decimals = priceParts[1] || '';

        if (decimals.length === 0) {
            const integerPart = priceParts[0];
            return Number(integerPart.charAt(integerPart.length - 1));
        }
        
        const lastDigit = Number(decimals.charAt(decimals.length - 1));
        return lastDigit;
    }

    /**
     * Enhanced AI decision making for ultra-fast trading
     */
    makeAIDecision(quote, lastDigit) {
        const recentDigits = this.analysisData.recentDigits.slice(-20);
        if (recentDigits.length < 5) { // Reduced minimum for ultra-fast mode
            return { shouldTrade: false };
        }

        // Ultra-fast pattern analysis
        const evenCount = recentDigits.filter(d => d % 2 === 0).length;
        const evenPercentage = (evenCount / recentDigits.length) * 100;
        
        // Count digit frequencies
        const digitCounts = Array(10).fill(0);
        recentDigits.forEach(digit => digitCounts[digit]++);
        
        // Find patterns in last 5 ticks for ultra-fast decisions
        const last5 = recentDigits.slice(-5);
        const last5Even = last5.filter(d => d % 2 === 0).length;
        const last5Odd = last5.length - last5Even;

        let strategy = this.settings.strategy;
        let confidence = 0.5;

        // Ultra-fast Even/Odd Analysis (more aggressive)
        if (last5Even >= 4) {
            strategy = 'odd'; // Expect change
            confidence = 0.75;
        } else if (last5Odd >= 4) {
            strategy = 'even'; // Expect change
            confidence = 0.75;
        } else if (evenPercentage > 65) {
            strategy = 'odd';
            confidence = 0.7;
        } else if (evenPercentage < 35) {
            strategy = 'even';
            confidence = 0.7;
        }

        // Over/Under Analysis based on recent trend
        const recentAverage = recentDigits.slice(-10).reduce((sum, digit) => sum + digit, 0) / Math.min(recentDigits.length, 10);
        if (recentAverage > 6.5) {
            strategy = 'under';
            confidence = Math.max(confidence, 0.65);
        } else if (recentAverage < 3.5) {
            strategy = 'over';
            confidence = Math.max(confidence, 0.65);
        }

        // Hot/Cold digit analysis for Matches/Differs
        const maxCount = Math.max(...digitCounts);
        const minCount = Math.min(...digitCounts);
        const hotDigits = digitCounts.map((count, digit) => count === maxCount ? digit : -1).filter(d => d !== -1);
        const coldDigits = digitCounts.map((count, digit) => count === minCount ? digit : -1).filter(d => d !== -1);

        if (hotDigits.includes(lastDigit) && maxCount > 3) {
            strategy = 'matches';
            confidence = Math.max(confidence, 0.6);
        } else if (coldDigits.includes(lastDigit)) {
            strategy = 'differs';
            confidence = Math.max(confidence, 0.6);
        }

        // Ultra-fast mode: Lower confidence threshold for more frequent trading
        const shouldTrade = confidence > 0.55 && Math.random() < (confidence * 0.9);

        return {
            shouldTrade,
            strategy,
            confidence,
            market: 'R_100'
        };
    }

    /**
     * Place trade using existing API connection or direct WebSocket
     */
    async placeTrade(strategy, market = 'R_100') {
        if (!this.isActive) return;

        try {
            // Check stop conditions
            if (this.settings.enableStopLoss && this.totalProfit <= -this.settings.stopLossAmount) {
                console.log('🛑 Stop loss reached, stopping ultra-fast bot');
                this.stop();
                return;
            }

            if (this.settings.enableTakeProfit && this.totalProfit >= this.settings.takeProfitAmount) {
                console.log('🎯 Take profit reached, stopping ultra-fast bot');
                this.stop();
                return;
            }

            const requestId = this.requestId++;
            const tradeInfo = {
                strategy,
                market,
                stake: this.currentStake,
                duration: this.settings.duration,
                timestamp: Date.now()
            };

            this.pendingTrades.set(requestId, tradeInfo);

            // Create proposal request
            let proposalRequest = {
                proposal: 1,
                amount: this.currentStake,
                basis: 'stake',
                contract_type: this.getContractType(strategy),
                currency: 'USD',
                symbol: market,
                duration: this.settings.duration,
                duration_unit: 't',
                req_id: requestId
            };

            // Add barrier for over/under trades
            if (strategy === 'over' || strategy === 'under') {
                proposalRequest.barrier = '5';
            }

            // Add prediction digit for matches/differs
            if (strategy === 'matches' || strategy === 'differs') {
                const predictedDigit = this.predictNextDigit();
                proposalRequest.barrier = predictedDigit.toString();
            }

            console.log(`⚡ ULTRA-FAST ${strategy.toUpperCase()} trade on ${market} - Stake: ${this.currentStake}`);
            
            // Send via Smart Analysis API if available, otherwise direct WebSocket
            if (this.smartAPI && this.smartAPI.wsManager && this.smartAPI.wsManager.isConnected) {
                this.smartAPI.wsManager.send(proposalRequest);
            } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(proposalRequest));
            } else {
                throw new Error('No active connection available for trading');
            }

        } catch (error) {
            console.error('❌ Error placing ultra-fast trade:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(`Failed to place trade: ${error.message}`);
            }
        }
    }

    /**
     * Get contract type based on strategy
     */
    getContractType(strategy) {
        const contractTypes = {
            'even': 'DIGITEVEN',
            'odd': 'DIGITODD',
            'over': 'DIGITOVER',
            'under': 'DIGITUNDER',
            'matches': 'DIGITMATCH',
            'differs': 'DIGITDIFF'
        };
        return contractTypes[strategy] || 'DIGITEVEN';
    }

    /**
     * Predict next digit for matches/differs
     */
    predictNextDigit() {
        const recentDigits = this.analysisData.recentDigits.slice(-10);
        if (recentDigits.length === 0) return 5;

        // Predict based on least frequent digit in recent history
        const digitCounts = Array(10).fill(0);
        recentDigits.forEach(digit => digitCounts[digit]++);
        
        const minCount = Math.min(...digitCounts);
        const coldDigits = digitCounts.map((count, digit) => count === minCount ? digit : -1).filter(d => d !== -1);
        
        return coldDigits[Math.floor(Math.random() * coldDigits.length)] || 5;
    }

    /**
     * Handle trade execution response
     */
    handleTradeExecution(data) {
        const contractId = data.buy.contract_id;
        const requestId = data.req_id;
        
        if (this.pendingTrades.has(requestId)) {
            const tradeInfo = this.pendingTrades.get(requestId);
            tradeInfo.contractId = contractId;
            tradeInfo.buyPrice = data.buy.buy_price;
            
            console.log(`🚀 Ultra-fast trade executed: ${contractId} for ${data.buy.buy_price}`);
            
            if (this.callbacks.onTradeExecuted) {
                this.callbacks.onTradeExecuted({
                    contractId,
                    strategy: tradeInfo.strategy,
                    stake: tradeInfo.stake,
                    duration: tradeInfo.duration,
                    market: tradeInfo.market,
                    buyPrice: data.buy.buy_price
                });
            }
            
            // Subscribe to contract updates
            this.subscribeToContract(contractId);
        }
    }

    /**
     * Handle proposal response
     */
    handleProposal(data) {
        const requestId = data.req_id;
        if (this.pendingTrades.has(requestId)) {
            const tradeInfo = this.pendingTrades.get(requestId);
            tradeInfo.proposalId = data.proposal.id;
            tradeInfo.payout = data.proposal.payout;
            
            // Execute trade immediately
            this.executeTrade(requestId);
        }
    }

    /**
     * Execute trade after proposal
     */
    executeTrade(requestId) {
        const tradeInfo = this.pendingTrades.get(requestId);
        if (!tradeInfo || !tradeInfo.proposalId) return;

        const buyRequest = {
            buy: tradeInfo.proposalId,
            price: tradeInfo.stake,
            req_id: requestId
        };

        // Send via appropriate connection
        if (this.smartAPI && this.smartAPI.wsManager && this.smartAPI.wsManager.isConnected) {
            this.smartAPI.wsManager.send(buyRequest);
        } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(buyRequest));
        }
    }

    /**
     * Subscribe to contract updates
     */
    subscribeToContract(contractId) {
        const subscribeRequest = {
            proposal_open_contract: 1,
            contract_id: contractId,
            subscribe: 1
        };

        // Send via appropriate connection
        if (this.smartAPI && this.smartAPI.wsManager && this.smartAPI.wsManager.isConnected) {
            this.smartAPI.wsManager.send(subscribeRequest);
        } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(subscribeRequest));
        }
    }

    /**
     * Handle trade result
     */
    handleTradeResult(contract) {
        const profit = parseFloat(contract.profit || 0);
        const isWin = profit > 0;
        
        this.totalProfit += profit;
        
        // Update martingale state
        if (isWin) {
            this.consecutiveLosses = 0;
            this.currentStake = this.settings.stake;
        } else {
            this.consecutiveLosses++;
            
            if (this.settings.enableMartingale && this.consecutiveLosses < this.settings.maxConsecutiveLosses) {
                this.currentStake = this.currentStake * this.settings.martingaleMultiplier;
            } else {
                this.currentStake = this.settings.stake;
            }
        }

        // Add to history
        const tradeResult = {
            contractId: contract.contract_id,
            profit,
            isWin,
            timestamp: Date.now(),
            stake: parseFloat(contract.buy_price || 0),
            payout: parseFloat(contract.payout || 0)
        };
        
        this.tradeHistory.push(tradeResult);
        if (this.tradeHistory.length > 100) {
            this.tradeHistory.shift();
        }

        console.log(`⚡ Ultra-fast trade ${isWin ? 'WON' : 'LOST'}: ${profit.toFixed(2)} | Total: ${this.totalProfit.toFixed(2)}`);

        if (this.callbacks.onTradeResult) {
            this.callbacks.onTradeResult(tradeResult);
        }

        // Clean up
        for (const [requestId, tradeInfo] of this.pendingTrades.entries()) {
            if (tradeInfo.contractId === contract.contract_id) {
                this.pendingTrades.delete(requestId);
                break;
            }
        }
    }

    /**
     * Start ultra-fast AI bot (no separate login needed)
     */
    async start() {
        if (this.isActive) return;

        try {
            // Connect using existing session or create minimal connection
            await this.connect();

            this.isActive = true;
            this.consecutiveLosses = 0;
            this.currentStake = this.settings.stake;
            this.tickCounter = 0;
            
            console.log('⚡ Turbo Speed AI Bot started - ULTRA-FAST MODE (every tick)');
            
            if (this.callbacks.onStatusChange) {
                this.callbacks.onStatusChange(true);
            }

        } catch (error) {
            console.error('❌ Failed to start ultra-fast AI bot:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(`Failed to start bot: ${error.message}`);
            }
        }
    }

    /**
     * Stop the ultra-fast AI bot
     */
    stop() {
        this.isActive = false;
        console.log('🛑 Turbo Speed AI Bot stopped');
        
        if (this.callbacks.onStatusChange) {
            this.callbacks.onStatusChange(false);
        }
    }

    /**
     * Get bot statistics
     */
    getStats() {
        const winCount = this.tradeHistory.filter(trade => trade.isWin).length;
        const lossCount = this.tradeHistory.length - winCount;
        const winRate = this.tradeHistory.length > 0 ? (winCount / this.tradeHistory.length) * 100 : 0;

        return {
            isActive: this.isActive,
            totalTrades: this.tradeHistory.length,
            winCount,
            lossCount,
            winRate: winRate.toFixed(1),
            totalProfit: this.totalProfit.toFixed(2),
            consecutiveLosses: this.consecutiveLosses,
            currentStake: this.currentStake,
            tickCounter: this.tickCounter,
            ultraFastMode: this.settings.ultraFastMode,
            settings: this.settings
        };
    }

    /**
     * Disconnect and cleanup
     */
    disconnect() {
        this.stop();
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        this.pendingTrades.clear();
    }
}

// Make available globally
window.TurboSpeedAIBot = TurboSpeedAIBot;

// Make available globally
window.TurboSpeedAIBot = TurboSpeedAIBot;

console.log('✅ Turbo Speed AI Bot loaded with App ID 82255');