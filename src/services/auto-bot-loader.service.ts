/**
 * Auto Bot Loader Service
 * Automatically loads and configures bots when signals arrive
 * Integrates with all signal sources: Patel, Advanced Algo, AI Intelligence
 */

import { advancedAlgoSignalService, type RealSignal } from './advanced-algo-signal.service';
import patelSignalGeneratorService from './patel-signal-generator.service';
import { signalBotLoader } from './signal-bot-loader.service';
import { patelBotLoaderService } from './patel-bot-loader.service';
import type { PatelSignal } from '../types/patel-signals';

export interface AutoLoadConfig {
    enabled: boolean;
    minConfidence: number; // Minimum signal confidence to auto-load (0-100)
    signalSources: {
        advancedAlgo: boolean;
        patelSignals: boolean;
        aiIntelligence: boolean;
        vipSignals: boolean; // Premium VIP signals
    };
    botPreferences: {
        evenOdd: 'CFX-EvenOdd' | 'CFX-025' | 'EvenOddGhost';
        overUnder: 'PATEL' | 'Raziel' | 'GameChanger';
        riseFall: 'CFX-RiseFall' | 'GameChanger' | 'DigitHunter';
    };
    autoRun: boolean; // Automatically start bot after loading
    autoRunDelay: number; // Delay in seconds before auto-run
    notifications: boolean; // Show success notifications
    maxAutoLoadsPerHour: number; // Safety limit

    // Win/Loss Management
    winLossManagement: {
        enabled: boolean;
        stopAfterWins: number; // Stop after X consecutive wins
        stopAfterLosses: number; // Stop after X consecutive losses
        resetOnOpposite: boolean; // Reset counter when win/loss changes
    };

    // Risk Management
    riskManagement: {
        dailyProfitLimit: number; // Stop when daily profit reaches this
        dailyLossLimit: number; // Stop when daily loss reaches this
        maxDrawdown: number; // Maximum drawdown percentage
        cooldownAfterLoss: number; // Minutes to wait after loss
    };

    // Stake Management
    stakeManagement: {
        autoScaling: boolean;
        baseStake: number;
        martingaleEnabled: boolean;
        martingaleMultiplier: number; // Multiplier after loss
        maxMartingaleSteps: number; // Maximum martingale steps
        takeProfitLevel: number; // Take profit after X% gain
        stopLossLevel: number; // Stop loss after X% loss
    };

    // Notifications
    notificationSettings: {
        browser: boolean;
        telegram: boolean;
        telegramBotToken?: string;
        telegramChatId?: string;
        mobile: boolean; // Push notifications
        sounds: boolean;
    };

    // Premium Features
    premiumFeatures: {
        priorityLoading: boolean;
        advancedBacktesting: boolean;
        customStrategies: boolean;
        vipAccess: boolean;
    };

    // Market Switching
    marketSwitching: {
        enabled: boolean;
        mode: 'manual' | 'automatic'; // Manual selection or automatic based on performance
        switchAfterLosses: number; // Switch market after X consecutive losses
        availableMarkets: string[]; // List of markets to rotate through
        currentMarket: string; // Currently selected market
        marketRotation: 'sequential' | 'performance' | 'random'; // How to select next market
        performanceWindow: number; // Number of trades to consider for performance-based selection
        excludePoorPerformers: boolean; // Exclude markets with low win rate
        minWinRateThreshold: number; // Minimum win rate % to keep market in rotation
    };
}

export interface AutoLoadStats {
    totalAutoLoads: number;
    autoLoadsThisHour: number;
    autoLoadsToday: number;
    successRate: number;
    lastAutoLoadTime: number;
    signalSourceStats: {
        advancedAlgo: number;
        patelSignals: number;
        aiIntelligence: number;
        vipSignals: number;
    };

    // Win/Loss Tracking
    winLossStats: {
        currentWinStreak: number;
        currentLossStreak: number;
        totalWins: number;
        totalLosses: number;
        dailyWins: number;
        dailyLosses: number;
        dailyProfit: number;
        dailyLoss: number;
        maxWinStreak: number;
        maxLossStreak: number;
    };

    // Performance Metrics
    performance: {
        profitLoss: number;
        winRate: number;
        averageWin: number;
        averageLoss: number;
        sharpeRatio: number;
        maxDrawdown: number;
        currentDrawdown: number;
    };

    // Session Stats
    session: {
        startTime: number;
        tradesCount: number;
        profitLoss: number;
        bestTrade: number;
        worstTrade: number;
    };

    // Market Performance Tracking
    marketPerformance: {
        [market: string]: {
            trades: number;
            wins: number;
            losses: number;
            winRate: number;
            profitLoss: number;
            consecutiveLosses: number;
            lastTradeTime: number;
        };
    };
}

export interface AutoLoadEvent {
    id: string;
    timestamp: number;
    signalId: string;
    signalSource: 'ADVANCED_ALGO' | 'PATEL_SIGNALS' | 'AI_INTELLIGENCE' | 'VIP_SIGNALS';
    botLoaded: string;
    confidence: number;
    success: boolean;
    error?: string;

    // Trade Results
    tradeResult?: {
        outcome: 'WIN' | 'LOSS' | 'PENDING';
        profit: number;
        stake: number;
        payout: number;
        duration: number;
    };

    // Risk Management
    riskData?: {
        stakeUsed: number;
        martingaleStep: number;
        accountBalance: number;
        drawdown: number;
    };
}

class AutoBotLoaderService {
    private static instance: AutoBotLoaderService;

    private config: AutoLoadConfig = {
        enabled: false,
        minConfidence: 65,
        signalSources: {
            advancedAlgo: true,
            patelSignals: true,
            aiIntelligence: true,
            vipSignals: false,
        },
        botPreferences: {
            evenOdd: 'CFX-EvenOdd',
            overUnder: 'PATEL',
            riseFall: 'CFX-RiseFall',
        },
        autoRun: false,
        autoRunDelay: 3,
        notifications: true,
        maxAutoLoadsPerHour: 20,

        // Win/Loss Management
        winLossManagement: {
            enabled: true,
            stopAfterWins: 4,
            stopAfterLosses: 4,
            resetOnOpposite: true,
        },

        // Risk Management
        riskManagement: {
            dailyProfitLimit: 1000,
            dailyLossLimit: 500,
            maxDrawdown: 20,
            cooldownAfterLoss: 5,
        },

        // Stake Management
        stakeManagement: {
            autoScaling: false,
            baseStake: 1,
            martingaleEnabled: false,
            martingaleMultiplier: 2,
            maxMartingaleSteps: 3,
            takeProfitLevel: 50,
            stopLossLevel: 30,
        },

        // Notifications
        notificationSettings: {
            browser: true,
            telegram: false,
            mobile: false,
            sounds: true,
        },

        // Premium Features
        premiumFeatures: {
            priorityLoading: false,
            advancedBacktesting: false,
            customStrategies: false,
            vipAccess: false,
        },

        // Market Switching
        marketSwitching: {
            enabled: false,
            mode: 'automatic',
            switchAfterLosses: 3,
            availableMarkets: [
                // Standard Volatility Indices
                'R_10', 'R_25', 'R_50', 'R_75', 'R_100',
                // 1-Second Volatility Indices (1HZ)
                '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V',
                '1HZ150V', '1HZ200V', '1HZ250V', '1HZ300V',
            ],
            currentMarket: 'R_10',
            marketRotation: 'performance',
            performanceWindow: 10,
            excludePoorPerformers: true,
            minWinRateThreshold: 40,
        },
    };

    private stats: AutoLoadStats = {
        totalAutoLoads: 0,
        autoLoadsThisHour: 0,
        autoLoadsToday: 0,
        successRate: 0,
        lastAutoLoadTime: 0,
        signalSourceStats: {
            advancedAlgo: 0,
            patelSignals: 0,
            aiIntelligence: 0,
            vipSignals: 0,
        },

        // Win/Loss Tracking
        winLossStats: {
            currentWinStreak: 0,
            currentLossStreak: 0,
            totalWins: 0,
            totalLosses: 0,
            dailyWins: 0,
            dailyLosses: 0,
            dailyProfit: 0,
            dailyLoss: 0,
            maxWinStreak: 0,
            maxLossStreak: 0,
        },

        // Performance Metrics
        performance: {
            profitLoss: 0,
            winRate: 0,
            averageWin: 0,
            averageLoss: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            currentDrawdown: 0,
        },

        // Session Stats
        session: {
            startTime: Date.now(),
            tradesCount: 0,
            profitLoss: 0,
            bestTrade: 0,
            worstTrade: 0,
        },

        // Market Performance Tracking
        marketPerformance: {},
    };

    private events: AutoLoadEvent[] = [];
    private listeners: Array<(event: AutoLoadEvent) => void> = [];
    private subscriptions: Array<() => void> = [];
    private hourlyResetInterval: NodeJS.Timeout | null = null;

    private constructor() {
        this.loadConfig();
        this.initializeHourlyReset();
        this.initializeContractMonitoring();
    }

    public static getInstance(): AutoBotLoaderService {
        if (!AutoBotLoaderService.instance) {
            AutoBotLoaderService.instance = new AutoBotLoaderService();
        }
        return AutoBotLoaderService.instance;
    }

    /**
     * Start auto bot loading
     */
    public start(): void {
        if (this.config.enabled) {
            console.log('⚠️ Auto bot loader is already running');
            return;
        }

        this.config.enabled = true;
        this.saveConfig();

        console.log('🤖 Starting Auto Bot Loader...');
        console.log('📋 Configuration:', this.config);

        // Subscribe to all enabled signal sources
        this.subscribeToSignalSources();

        console.log('✅ Auto Bot Loader started successfully');
        this.showNotification('🤖 Auto Bot Loader Started', 'Bots will now load automatically when signals arrive');
    }

    /**
     * Stop auto bot loading
     */
    public stop(): void {
        this.config.enabled = false;
        this.saveConfig();

        // Unsubscribe from all signal sources
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions = [];

        console.log('🛑 Auto Bot Loader stopped');
        this.showNotification('🛑 Auto Bot Loader Stopped', 'Automatic bot loading is now disabled');
    }

    /**
     * Subscribe to all enabled signal sources
     */
    private subscribeToSignalSources(): void {
        // Subscribe to Advanced Algorithm signals
        if (this.config.signalSources.advancedAlgo) {
            const unsubscribeAdvanced = advancedAlgoSignalService.onSignal((signal: RealSignal) => {
                this.handleAdvancedAlgoSignal(signal);
            });
            this.subscriptions.push(unsubscribeAdvanced);
            console.log('📡 Subscribed to Advanced Algorithm signals');
        }

        // Subscribe to Patel signals
        if (this.config.signalSources.patelSignals) {
            const unsubscribePatel = patelSignalGeneratorService.subscribe((signals: PatelSignal[]) => {
                signals.forEach(signal => this.handlePatelSignal(signal));
            });
            this.subscriptions.push(unsubscribePatel);
            console.log('📡 Subscribed to Patel signals');
        }

        // Note: AI Intelligence signals are typically used by other services
        // We can add direct subscription if needed
    }

    /**
     * Handle Advanced Algorithm signal
     */
    private async handleAdvancedAlgoSignal(signal: RealSignal): Promise<void> {
        if (!this.shouldAutoLoad(signal.confidence, 'ADVANCED_ALGO')) {
            return;
        }

        console.log('🚨 Auto-loading bot for Advanced Algorithm signal:', signal);

        try {
            const botLoaded = await this.loadBotForSignal(signal);

            this.recordAutoLoadEvent({
                signalId: signal.id,
                signalSource: 'ADVANCED_ALGO',
                botLoaded,
                confidence: signal.confidence,
                success: true,
            });

            this.stats.signalSourceStats.advancedAlgo++;

            if (this.config.autoRun) {
                setTimeout(() => this.autoRunBot(), this.config.autoRunDelay * 1000);
            }
        } catch (error) {
            console.error('❌ Failed to auto-load bot for Advanced Algorithm signal:', error);

            this.recordAutoLoadEvent({
                signalId: signal.id,
                signalSource: 'ADVANCED_ALGO',
                botLoaded: 'FAILED',
                confidence: signal.confidence,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    /**
     * Handle Patel signal
     */
    private async handlePatelSignal(signal: PatelSignal): Promise<void> {
        if (!this.shouldAutoLoad(signal.confidencePercentage, 'PATEL_SIGNALS')) {
            return;
        }

        console.log('🎯 Auto-loading bot for Patel signal:', signal);

        try {
            const botLoaded = await this.loadPatelBot(signal);

            this.recordAutoLoadEvent({
                signalId: signal.id,
                signalSource: 'PATEL_SIGNALS',
                botLoaded,
                confidence: signal.confidencePercentage,
                success: true,
            });

            this.stats.signalSourceStats.patelSignals++;

            if (this.config.autoRun) {
                setTimeout(() => this.autoRunBot(), this.config.autoRunDelay * 1000);
            }
        } catch (error) {
            console.error('❌ Failed to auto-load bot for Patel signal:', error);

            this.recordAutoLoadEvent({
                signalId: signal.id,
                signalSource: 'PATEL_SIGNALS',
                botLoaded: 'FAILED',
                confidence: signal.confidencePercentage,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    /**
     * Load bot for Advanced Algorithm signal
     */
    private async loadBotForSignal(signal: RealSignal): Promise<string> {
        // Determine bot type based on signal
        if (signal.signalType === 'EVEN_ODD') {
            return await this.loadEvenOddBot(signal);
        } else if (signal.signalType === 'OVER_UNDER') {
            return await this.loadOverUnderBot(signal);
        } else if (signal.signalType === 'RISE_FALL') {
            return await this.loadRiseFallBot(signal);
        }

        throw new Error(`Unsupported signal type: ${signal.signalType}`);
    }

    /**
     * Load Even/Odd bot
     */
    private async loadEvenOddBot(signal: RealSignal): Promise<string> {
        const botName = this.config.botPreferences.evenOdd;

        // Use signal bot loader service for automatic bot selection and loading
        await signalBotLoader.autoLoadBotForSignal(signal);

        this.showNotification(
            '🎲 Even/Odd Bot Loaded',
            `${botName} loaded for ${signal.marketLabel} - ${signal.prediction} (${signal.confidence}% confidence)`
        );

        return botName;
    }

    /**
     * Load Over/Under bot
     */
    private async loadOverUnderBot(signal: RealSignal): Promise<string> {
        const botPreference = this.config.botPreferences.overUnder;

        if (botPreference === 'PATEL' && signal.entryDigit) {
            // Use Patel bot loader for entry digit signals
            await patelBotLoaderService.loadPatelBotForDigit(signal.entryDigit, signal.market);

            this.showNotification(
                '🎯 PATEL Bot Loaded',
                `PATEL bot loaded for digit ${signal.entryDigit} on ${signal.marketLabel} (${signal.confidence}% confidence)`
            );

            return 'PATEL';
        } else if (botPreference === 'Raziel') {
            // Use signal bot loader for Raziel as well
            await signalBotLoader.autoLoadBotForSignal(signal);

            this.showNotification(
                '⚡ Raziel Bot Loaded',
                `Raziel Over Under bot loaded for ${signal.marketLabel} - ${signal.prediction} (${signal.confidence}% confidence)`
            );

            return 'Raziel';
        } else {
            // Use signal bot loader service
            await signalBotLoader.autoLoadBotForSignal(signal);

            this.showNotification(
                '🔢 Over/Under Bot Loaded',
                `Bot loaded for ${signal.marketLabel} - ${signal.prediction} (${signal.confidence}% confidence)`
            );

            return 'Auto-Selected';
        }
    }

    /**
     * Load Rise/Fall bot
     */
    private async loadRiseFallBot(signal: RealSignal): Promise<string> {
        const botName = this.config.botPreferences.riseFall;

        // Use signal bot loader service
        await signalBotLoader.autoLoadBotForSignal(signal);

        this.showNotification(
            '📈 Rise/Fall Bot Loaded',
            `${botName} loaded for ${signal.marketLabel} - ${signal.prediction} (${signal.confidence}% confidence)`
        );

        return botName;
    }

    /**
     * Load Patel bot for Patel signal
     */
    private async loadPatelBot(signal: PatelSignal): Promise<string> {
        await patelBotLoaderService.loadPatelBotForDigit(signal.suggestedEntryDigit, signal.market);

        this.showNotification(
            '🎯 PATEL Bot Auto-Loaded',
            `PATEL bot loaded for digit ${signal.suggestedEntryDigit} on ${signal.market} (${signal.confidencePercentage}% confidence)`
        );

        return 'PATEL';
    }

    /**
     * Check if signal should trigger auto-load
     */
    private shouldAutoLoad(confidence: number, source: string): boolean {
        if (!this.config.enabled) {
            return false;
        }

        if (confidence < this.config.minConfidence) {
            console.log(`⚠️ Signal confidence ${confidence}% below threshold ${this.config.minConfidence}%`);
            return false;
        }

        if (this.stats.autoLoadsThisHour >= this.config.maxAutoLoadsPerHour) {
            console.log(`⚠️ Hourly auto-load limit reached (${this.config.maxAutoLoadsPerHour})`);
            return false;
        }

        // Check win/loss management
        if (this.config.winLossManagement.enabled) {
            if (this.stats.winLossStats.currentWinStreak >= this.config.winLossManagement.stopAfterWins) {
                console.log(`🎯 Stopping bot after ${this.config.winLossManagement.stopAfterWins} consecutive wins`);
                this.stopRunningBot();
                this.stop();
                this.sendNotification(
                    '🎯 Win Limit Reached',
                    `Bot stopped after ${this.config.winLossManagement.stopAfterWins} consecutive wins`
                );
                return false;
            }

            if (this.stats.winLossStats.currentLossStreak >= this.config.winLossManagement.stopAfterLosses) {
                console.log(
                    `🛑 Stopping bot after ${this.config.winLossManagement.stopAfterLosses} consecutive losses`
                );
                this.stopRunningBot();
                this.stop();
                this.sendNotification(
                    '🛑 Loss Limit Reached',
                    `Bot stopped after ${this.config.winLossManagement.stopAfterLosses} consecutive losses`
                );
                return false;
            }
        }

        // Check daily profit/loss limits
        if (this.stats.winLossStats.dailyProfit >= this.config.riskManagement.dailyProfitLimit) {
            console.log(`💰 Daily profit limit reached: $${this.stats.winLossStats.dailyProfit}`);
            this.stopRunningBot();
            this.stop();
            this.sendNotification(
                '💰 Daily Profit Target',
                `Bot stopped - reached daily profit limit of $${this.config.riskManagement.dailyProfitLimit}`
            );
            return false;
        }

        if (this.stats.winLossStats.dailyLoss >= this.config.riskManagement.dailyLossLimit) {
            console.log(`📉 Daily loss limit reached: $${this.stats.winLossStats.dailyLoss}`);
            this.stopRunningBot();
            this.stop();
            this.sendNotification(
                '📉 Daily Loss Limit',
                `Bot stopped - reached daily loss limit of $${this.config.riskManagement.dailyLossLimit}`
            );
            return false;
        }

        return true;
    }

    /**
     * Auto-run the bot after loading
     */
    private autoRunBot(): void {
        try {
            // Find and click the run button
            const runButton = document.querySelector(
                '[data-testid="dt_run_button"], .run-button, button[class*="run"]'
            ) as HTMLButtonElement;

            if (runButton && !runButton.disabled) {
                runButton.click();
                console.log('▶️ Auto-started bot');
                this.showNotification('▶️ Bot Started', 'Bot is now running automatically');
            } else {
                console.warn('⚠️ Run button not found or disabled');
            }
        } catch (error) {
            console.error('❌ Failed to auto-run bot:', error);
        }
    }

    /**
     * Stop the currently running bot by clicking the stop button
     */
    private stopRunningBot(): void {
        try {
            // Primary selector: The actual stop button ID used in the trade animation
            const stopButton = document.getElementById('db-animation__stop-button') as HTMLButtonElement;

            if (stopButton && !stopButton.disabled) {
                stopButton.click();
                console.log('🛑 Stopped running bot');
                this.showNotification('🛑 Bot Stopped', 'Running bot has been stopped');
                return;
            }

            // Fallback: Try alternative selectors
            const alternativeStopSelectors = [
                '[data-testid="dt_stop_button"]',
                '.animation__stop-button',
                'button[class*="stop-button"]',
                'button[id*="stop"]',
            ];

            for (const selector of alternativeStopSelectors) {
                const button = document.querySelector(selector) as HTMLButtonElement;
                if (button && !button.disabled) {
                    button.click();
                    console.log('🛑 Stopped running bot (alternative selector)');
                    this.showNotification('🛑 Bot Stopped', 'Running bot has been stopped');
                    return;
                }
            }

            // Last resort: Find any button with "Stop" text
            const allButtons = document.querySelectorAll('button');
            for (const button of allButtons) {
                const buttonText = button.textContent?.trim() || '';

                if (buttonText === 'Stop' && !button.disabled) {
                    button.click();
                    console.log('🛑 Stopped running bot (text match)');
                    this.showNotification('🛑 Bot Stopped', 'Running bot has been stopped');
                    return;
                }
            }

            console.warn('⚠️ Stop button not found or disabled - bot may not be running');
            this.showNotification('⚠️ No Running Bot', 'No active bot found to stop');
        } catch (error) {
            console.error('❌ Failed to stop bot:', error);
            this.showNotification('❌ Stop Error', 'Failed to stop the running bot');
        }
    }

    /**
     * Market Switching Methods
     */

    /**
     * Initialize market performance tracking for a market
     */
    private initializeMarketPerformance(market: string): void {
        if (!this.stats.marketPerformance[market]) {
            this.stats.marketPerformance[market] = {
                trades: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                profitLoss: 0,
                consecutiveLosses: 0,
                lastTradeTime: 0,
            };
        }
    }

    /**
     * Update market performance after a trade
     */
    private updateMarketPerformance(market: string, outcome: 'WIN' | 'LOSS', profit: number): void {
        this.initializeMarketPerformance(market);
        const perf = this.stats.marketPerformance[market];

        perf.trades++;
        perf.lastTradeTime = Date.now();
        perf.profitLoss += profit;

        if (outcome === 'WIN') {
            perf.wins++;
            perf.consecutiveLosses = 0;
        } else {
            perf.losses++;
            perf.consecutiveLosses++;
        }

        perf.winRate = perf.trades > 0 ? (perf.wins / perf.trades) * 100 : 0;

        console.log(`📊 Market ${market} Performance:`, {
            trades: perf.trades,
            winRate: perf.winRate.toFixed(1) + '%',
            profitLoss: perf.profitLoss.toFixed(2),
            consecutiveLosses: perf.consecutiveLosses,
        });
    }

    /**
     * Check if market should be switched based on consecutive losses
     */
    private shouldSwitchMarket(currentMarket: string): boolean {
        if (!this.config.marketSwitching.enabled) {
            return false;
        }

        const perf = this.stats.marketPerformance[currentMarket];
        if (!perf) {
            return false;
        }

        const shouldSwitch = perf.consecutiveLosses >= this.config.marketSwitching.switchAfterLosses;

        if (shouldSwitch) {
            console.log(
                `🔄 Market switch triggered: ${currentMarket} has ${perf.consecutiveLosses} consecutive losses`
            );
        }

        return shouldSwitch;
    }

    /**
     * Get next market based on rotation strategy
     */
    private getNextMarket(): string {
        const { availableMarkets, currentMarket, marketRotation, performanceWindow, excludePoorPerformers, minWinRateThreshold } = this.config.marketSwitching;

        // Filter out poor performers if enabled
        let eligibleMarkets = [...availableMarkets];
        
        if (excludePoorPerformers) {
            eligibleMarkets = eligibleMarkets.filter(market => {
                const perf = this.stats.marketPerformance[market];
                if (!perf || perf.trades < performanceWindow) {
                    return true; // Include markets with insufficient data
                }
                return perf.winRate >= minWinRateThreshold;
            });

            // If all markets are filtered out, use all available markets
            if (eligibleMarkets.length === 0) {
                eligibleMarkets = [...availableMarkets];
                console.log('⚠️ All markets filtered out, using all available markets');
            }
        }

        let nextMarket: string;

        switch (marketRotation) {
            case 'sequential':
                // Rotate to next market in the list
                const currentIndex = eligibleMarkets.indexOf(currentMarket);
                const nextIndex = (currentIndex + 1) % eligibleMarkets.length;
                nextMarket = eligibleMarkets[nextIndex];
                break;

            case 'performance':
                // Select market with best win rate
                nextMarket = this.getBestPerformingMarket(eligibleMarkets);
                break;

            case 'random':
                // Random selection from eligible markets
                const randomIndex = Math.floor(Math.random() * eligibleMarkets.length);
                nextMarket = eligibleMarkets[randomIndex];
                break;

            default:
                nextMarket = eligibleMarkets[0];
        }

        console.log(`🔄 Market switching: ${currentMarket} → ${nextMarket} (${marketRotation} strategy)`);
        return nextMarket;
    }

    /**
     * Get best performing market from eligible markets
     */
    private getBestPerformingMarket(eligibleMarkets: string[]): string {
        let bestMarket = eligibleMarkets[0];
        let bestScore = -Infinity;

        for (const market of eligibleMarkets) {
            const perf = this.stats.marketPerformance[market];
            
            if (!perf || perf.trades === 0) {
                // Give new markets a chance with a neutral score
                const score = 50;
                if (score > bestScore) {
                    bestScore = score;
                    bestMarket = market;
                }
                continue;
            }

            // Calculate score based on win rate and profit/loss
            const winRateScore = perf.winRate;
            const profitScore = perf.profitLoss > 0 ? 10 : -10;
            const recentActivityBonus = Date.now() - perf.lastTradeTime < 3600000 ? 5 : 0; // Bonus if traded in last hour
            
            const totalScore = winRateScore + profitScore + recentActivityBonus;

            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestMarket = market;
            }
        }

        console.log(`🏆 Best performing market: ${bestMarket} (score: ${bestScore.toFixed(2)})`);
        return bestMarket;
    }

    /**
     * Switch to a new market
     */
    public switchMarket(newMarket?: string): void {
        const oldMarket = this.config.marketSwitching.currentMarket;
        const targetMarket = newMarket || this.getNextMarket();

        this.config.marketSwitching.currentMarket = targetMarket;
        this.saveConfig();

        this.sendNotification(
            '🔄 Market Switched',
            `Changed from ${oldMarket} to ${targetMarket}`,
            'info'
        );

        console.log(`✅ Market switched: ${oldMarket} → ${targetMarket}`);
    }

    /**
     * Manually set current market
     */
    public setCurrentMarket(market: string): void {
        if (!this.config.marketSwitching.availableMarkets.includes(market)) {
            console.warn(`⚠️ Market ${market} not in available markets list`);
            return;
        }

        this.config.marketSwitching.currentMarket = market;
        this.config.marketSwitching.mode = 'manual';
        this.saveConfig();

        this.sendNotification('📍 Market Set', `Manually set to ${market}`, 'info');
        console.log(`📍 Market manually set to: ${market}`);
    }

    /**
     * Get current market
     */
    public getCurrentMarket(): string {
        return this.config.marketSwitching.currentMarket;
    }

    /**
     * Get market performance stats
     */
    public getMarketPerformance(market?: string): any {
        if (market) {
            return this.stats.marketPerformance[market] || null;
        }
        return this.stats.marketPerformance;
    }

    /**
     * Reset market performance stats
     */
    public resetMarketPerformance(market?: string): void {
        if (market) {
            delete this.stats.marketPerformance[market];
            console.log(`🔄 Reset performance stats for ${market}`);
        } else {
            this.stats.marketPerformance = {};
            console.log('🔄 Reset all market performance stats');
        }
    }

    /**
     * Record auto-load event
     */
    private recordAutoLoadEvent(eventData: Omit<AutoLoadEvent, 'id' | 'timestamp'>): void {
        const event: AutoLoadEvent = {
            id: `autoload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            ...eventData,
        };

        this.events.unshift(event);
        this.events = this.events.slice(0, 100); // Keep last 100 events

        // Update stats
        this.stats.totalAutoLoads++;
        this.stats.autoLoadsThisHour++;
        this.stats.autoLoadsToday++;
        this.stats.lastAutoLoadTime = event.timestamp;

        // Calculate success rate
        const recentEvents = this.events.slice(0, 20);
        const successCount = recentEvents.filter(e => e.success).length;
        this.stats.successRate = recentEvents.length > 0 ? (successCount / recentEvents.length) * 100 : 0;

        // Notify listeners
        this.listeners.forEach(listener => listener(event));

        console.log('📊 Auto-load event recorded:', event);
    }

    /**
     * Show notification
     */
    private showNotification(title: string, message: string): void {
        if (!this.config.notifications) {
            return;
        }

        this.sendNotification(title, message);
    }

    /**
     * Send notification through multiple channels
     */
    private async sendNotification(
        title: string,
        message: string,
        type: 'info' | 'success' | 'warning' | 'error' = 'info'
    ): Promise<void> {
        // Browser notification
        if (this.config.notificationSettings.browser) {
            this.showBrowserNotification(title, message, type);
        }

        // Telegram notification
        if (this.config.notificationSettings.telegram && this.config.notificationSettings.telegramBotToken) {
            await this.sendTelegramNotification(title, message);
        }

        // Mobile push notification
        if (this.config.notificationSettings.mobile) {
            await this.sendMobileNotification(title, message);
        }

        // Sound notification
        if (this.config.notificationSettings.sounds) {
            this.playNotificationSound(type);
        }
    }

    /**
     * Show browser notification
     */
    private showBrowserNotification(
        title: string,
        message: string,
        type: 'info' | 'success' | 'warning' | 'error'
    ): void {
        try {
            const colors = {
                info: { bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', shadow: 'rgba(59, 130, 246, 0.4)' },
                success: { bg: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16, 185, 129, 0.4)' },
                warning: { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245, 158, 11, 0.4)' },
                error: { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', shadow: 'rgba(239, 68, 68, 0.4)' },
            };

            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${colors[type].bg};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 8px 32px ${colors[type].shadow};
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                max-width: 350px;
                animation: slideInRight 0.3s ease-out;
                cursor: pointer;
            `;

            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <div style="font-weight: 600;">${title}</div>
                    <div style="margin-left: auto; opacity: 0.7; font-size: 12px;">×</div>
                </div>
                <div style="font-size: 13px; opacity: 0.9;">${message}</div>
            `;

            // Click to dismiss
            notification.addEventListener('click', () => {
                notification.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            });

            document.body.appendChild(notification);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideInRight 0.3s ease-out reverse';
                    setTimeout(() => notification.remove(), 300);
                }
            }, 5000);
        } catch (error) {
            console.warn('Failed to show browser notification:', error);
        }
    }

    /**
     * Send Telegram notification
     */
    private async sendTelegramNotification(title: string, message: string): Promise<void> {
        try {
            const { telegramBotToken, telegramChatId } = this.config.notificationSettings;
            if (!telegramBotToken || !telegramChatId) {
                return;
            }

            const text = `🤖 *${title}*\n\n${message}\n\n_Patel Premium Bot - ${new Date().toLocaleString()}_`;

            const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: telegramChatId,
                    text,
                    parse_mode: 'Markdown',
                }),
            });

            if (!response.ok) {
                throw new Error(`Telegram API error: ${response.status}`);
            }

            console.log('📱 Telegram notification sent successfully');
        } catch (error) {
            console.error('❌ Failed to send Telegram notification:', error);
        }
    }

    /**
     * Send mobile push notification
     */
    private async sendMobileNotification(title: string, message: string): Promise<void> {
        try {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification(title, {
                    body: message,
                    icon: '/favicon-pink.svg',
                    badge: '/favicon-pink.svg',
                    tag: 'patel-premium',
                    requireInteraction: true,
                } as NotificationOptions);
                console.log('📱 Mobile push notification sent');
            }
        } catch (error) {
            console.error('❌ Failed to send mobile notification:', error);
        }
    }

    /**
     * Play notification sound
     */
    private playNotificationSound(type: 'info' | 'success' | 'warning' | 'error'): void {
        try {
            const frequencies = {
                info: [800, 600],
                success: [600, 800, 1000],
                warning: [400, 400, 400],
                error: [300, 200, 100],
            };

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

            const freqs = frequencies[type];
            freqs.forEach((freq, index) => {
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
            });

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + freqs.length * 0.1);
        } catch (error) {
            console.warn('Failed to play notification sound:', error);
        }
    }

    /**
     * Record trade result and update win/loss stats
     */
    public recordTradeResult(eventId: string, outcome: 'WIN' | 'LOSS', profit: number, stake: number): void {
        const event = this.events.find(e => e.id === eventId);
        if (!event) {
            console.warn('Event not found for trade result:', eventId);
            return;
        }

        // Update event with trade result
        event.tradeResult = {
            outcome,
            profit,
            stake,
            payout: outcome === 'WIN' ? stake + profit : 0,
            duration: Date.now() - event.timestamp,
        };

        // Get the current market and update market performance
        const currentMarket = this.config.marketSwitching.currentMarket;
        this.updateMarketPerformance(currentMarket, outcome, profit);

        // Update win/loss stats
        if (outcome === 'WIN') {
            this.stats.winLossStats.totalWins++;
            this.stats.winLossStats.dailyWins++;
            this.stats.winLossStats.dailyProfit += profit;
            this.stats.winLossStats.currentWinStreak++;
            this.stats.winLossStats.currentLossStreak = 0;
            this.stats.winLossStats.maxWinStreak = Math.max(
                this.stats.winLossStats.maxWinStreak,
                this.stats.winLossStats.currentWinStreak
            );

            this.sendNotification(
                '🎯 Trade Won!',
                `Profit: $${profit.toFixed(2)} | Win Streak: ${this.stats.winLossStats.currentWinStreak}`,
                'success'
            );
        } else {
            this.stats.winLossStats.totalLosses++;
            this.stats.winLossStats.dailyLosses++;
            this.stats.winLossStats.dailyLoss += Math.abs(profit);
            this.stats.winLossStats.currentLossStreak++;
            this.stats.winLossStats.currentWinStreak = 0;
            this.stats.winLossStats.maxLossStreak = Math.max(
                this.stats.winLossStats.maxLossStreak,
                this.stats.winLossStats.currentLossStreak
            );

            this.sendNotification(
                '📉 Trade Lost',
                `Loss: $${Math.abs(profit).toFixed(2)} | Loss Streak: ${this.stats.winLossStats.currentLossStreak}`,
                'error'
            );
        }

        // Update performance metrics
        this.updatePerformanceMetrics();

        console.log(
            `📊 Trade result recorded: ${outcome} | Profit: $${profit} | Win Streak: ${this.stats.winLossStats.currentWinStreak} | Loss Streak: ${this.stats.winLossStats.currentLossStreak}`
        );
    }

    /**
     * Update performance metrics
     */
    private updatePerformanceMetrics(): void {
        const totalTrades = this.stats.winLossStats.totalWins + this.stats.winLossStats.totalLosses;

        if (totalTrades > 0) {
            this.stats.performance.winRate = (this.stats.winLossStats.totalWins / totalTrades) * 100;
            this.stats.performance.profitLoss = this.stats.winLossStats.dailyProfit - this.stats.winLossStats.dailyLoss;
        }

        // Calculate average win/loss
        if (this.stats.winLossStats.totalWins > 0) {
            this.stats.performance.averageWin = this.stats.winLossStats.dailyProfit / this.stats.winLossStats.totalWins;
        }

        if (this.stats.winLossStats.totalLosses > 0) {
            this.stats.performance.averageLoss =
                this.stats.winLossStats.dailyLoss / this.stats.winLossStats.totalLosses;
        }

        // Update session stats
        this.stats.session.tradesCount = totalTrades;
        this.stats.session.profitLoss = this.stats.performance.profitLoss;
    }

    /**
     * Reset all logs and counters
     */
    public resetLogs(): void {
        this.events = [];
        this.stats.winLossStats = {
            currentWinStreak: 0,
            currentLossStreak: 0,
            totalWins: 0,
            totalLosses: 0,
            dailyWins: 0,
            dailyLosses: 0,
            dailyProfit: 0,
            dailyLoss: 0,
            maxWinStreak: 0,
            maxLossStreak: 0,
        };

        this.stats.performance = {
            profitLoss: 0,
            winRate: 0,
            averageWin: 0,
            averageLoss: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            currentDrawdown: 0,
        };

        this.stats.session = {
            startTime: Date.now(),
            tradesCount: 0,
            profitLoss: 0,
            bestTrade: 0,
            worstTrade: 0,
        };

        this.stats.totalAutoLoads = 0;
        this.stats.autoLoadsToday = 0;
        this.stats.signalSourceStats = {
            advancedAlgo: 0,
            patelSignals: 0,
            aiIntelligence: 0,
            vipSignals: 0,
        };

        console.log('🗑️ All logs and counters reset');
        this.sendNotification('🔄 Reset Complete', 'All logs and counters have been reset', 'info');
    }

    /**
     * Initialize hourly reset
     */
    private initializeHourlyReset(): void {
        this.hourlyResetInterval = setInterval(
            () => {
                this.stats.autoLoadsThisHour = 0;
                console.log('🔄 Hourly auto-load counter reset');
            },
            60 * 60 * 1000
        ); // Every hour
    }

    /**
     * Load configuration
     */
    private loadConfig(): void {
        try {
            const saved = localStorage.getItem('autoBotLoaderConfig');
            if (saved) {
                this.config = { ...this.config, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('Failed to load auto bot loader config:', error);
        }
    }

    /**
     * Save configuration
     */
    private saveConfig(): void {
        try {
            localStorage.setItem('autoBotLoaderConfig', JSON.stringify(this.config));
        } catch (error) {
            console.warn('Failed to save auto bot loader config:', error);
        }
    }

    // Public API methods
    public isEnabled(): boolean {
        return this.config.enabled;
    }

    public getConfig(): AutoLoadConfig {
        return { ...this.config };
    }

    public stopBot(): void {
        this.stopRunningBot();
    }

    public updateConfig(updates: Partial<AutoLoadConfig>): void {
        this.config = { ...this.config, ...updates };
        this.saveConfig();
        console.log('⚙️ Auto bot loader config updated:', updates);
    }

    public getStats(): AutoLoadStats {
        return { ...this.stats };
    }

    public getEvents(): AutoLoadEvent[] {
        return [...this.events];
    }

    public onAutoLoad(listener: (event: AutoLoadEvent) => void): () => void {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    public clearEvents(): void {
        this.events = [];
        console.log('🗑️ Auto-load events cleared');
    }

    public resetAll(): void {
        this.resetLogs();
    }

    public getWinLossStats() {
        return { ...this.stats.winLossStats };
    }

    public getPerformanceStats() {
        return { ...this.stats.performance };
    }

    public getSessionStats() {
        return { ...this.stats.session };
    }

    public updateTelegramSettings(botToken: string, chatId: string): void {
        this.config.notificationSettings.telegramBotToken = botToken;
        this.config.notificationSettings.telegramChatId = chatId;
        this.config.notificationSettings.telegram = true;
        this.saveConfig();
        console.log('📱 Telegram settings updated');
    }

    public testTelegramConnection(): Promise<boolean> {
        return this.sendTelegramNotification('🧪 Test Connection', 'Telegram integration is working correctly!')
            .then(() => true)
            .catch(() => false);
    }

    /**
     * Initialize contract monitoring to track wins/losses
     */
    private initializeContractMonitoring(): void {
        // Check if window is available
        if (typeof window === 'undefined') {
            console.warn('⚠️ Window not available for contract monitoring');
            return;
        }

        // Monitor contract updates
        const checkInterval = setInterval(() => {
            if (!this.config.enabled || !this.config.winLossManagement.enabled) {
                return;
            }

            // Get current contract info from summary card store
            try {
                const rootStore = (window as any).Blockly?.derivWorkspace?.store?.root_store;
                const summaryCard = rootStore?.summary_card;
                const transactionsStore = rootStore?.transactions;

                if (!summaryCard || !summaryCard.contract_info) {
                    return;
                }

                // Update stats from transactions store
                if (transactionsStore && transactionsStore.statistics) {
                    const txStats = transactionsStore.statistics;

                    // Update total trades count from actual transactions
                    this.stats.winLossStats.totalWins = txStats.won_contracts;
                    this.stats.winLossStats.totalLosses = txStats.lost_contracts;
                    this.stats.performance.profitLoss = txStats.total_profit;

                    // Calculate win rate
                    const totalTrades = txStats.won_contracts + txStats.lost_contracts;
                    if (totalTrades > 0) {
                        this.stats.performance.winRate = (txStats.won_contracts / totalTrades) * 100;
                    }
                }

                const contract = summaryCard.contract_info;

                // Check if contract is completed (sold)
                if (contract.is_sold && !contract._processed_by_auto_loader) {
                    // Mark as processed to avoid duplicate processing
                    contract._processed_by_auto_loader = true;

                    const profit = contract.profit || 0;
                    const outcome = profit > 0 ? 'WIN' : 'LOSS';

                    console.log(`📊 Contract completed: ${outcome} | Profit: ${profit}`);

                    // Update win/loss stats
                    if (outcome === 'WIN') {
                        this.stats.winLossStats.currentWinStreak++;
                        this.stats.winLossStats.currentLossStreak = 0;
                        this.stats.winLossStats.dailyWins++;
                        this.stats.winLossStats.dailyProfit += Math.abs(profit);

                        if (this.stats.winLossStats.currentWinStreak > this.stats.winLossStats.maxWinStreak) {
                            this.stats.winLossStats.maxWinStreak = this.stats.winLossStats.currentWinStreak;
                        }

                        this.sendNotification(
                            '🎯 Trade Won',
                            `Profit: ${profit.toFixed(2)} | Win Streak: ${this.stats.winLossStats.currentWinStreak}`,
                            'success'
                        );
                    } else {
                        this.stats.winLossStats.currentLossStreak++;
                        this.stats.winLossStats.currentWinStreak = 0;
                        this.stats.winLossStats.dailyLosses++;
                        this.stats.winLossStats.dailyLoss += Math.abs(profit);

                        if (this.stats.winLossStats.currentLossStreak > this.stats.winLossStats.maxLossStreak) {
                            this.stats.winLossStats.maxLossStreak = this.stats.winLossStats.currentLossStreak;
                        }

                        this.sendNotification(
                            '📉 Trade Lost',
                            `Loss: ${Math.abs(profit).toFixed(2)} | Loss Streak: ${this.stats.winLossStats.currentLossStreak}`,
                            'error'
                        );
                    }

                    // Update performance metrics
                    this.updatePerformanceMetrics();

                    // Check if we should stop due to win/loss limits
                    if (this.stats.winLossStats.currentWinStreak >= this.config.winLossManagement.stopAfterWins) {
                        console.log(
                            `🎯 Stopping bot after ${this.config.winLossManagement.stopAfterWins} consecutive wins`
                        );
                        this.stopRunningBot();
                        this.stop();
                        this.sendNotification(
                            '🎯 Win Limit Reached',
                            `Bot stopped after ${this.config.winLossManagement.stopAfterWins} consecutive wins. Total profit: ${this.stats.winLossStats.dailyProfit.toFixed(2)}`,
                            'success'
                        );
                    }

                    if (this.stats.winLossStats.currentLossStreak >= this.config.winLossManagement.stopAfterLosses) {
                        console.log(
                            `🛑 Stopping bot after ${this.config.winLossManagement.stopAfterLosses} consecutive losses`
                        );
                        this.stopRunningBot();
                        this.stop();
                        this.sendNotification(
                            '🛑 Loss Limit Reached',
                            `Bot stopped after ${this.config.winLossManagement.stopAfterLosses} consecutive losses. Total loss: ${this.stats.winLossStats.dailyLoss.toFixed(2)}`,
                            'error'
                        );
                    }

                    // Check daily profit/loss limits
                    if (this.stats.winLossStats.dailyProfit >= this.config.riskManagement.dailyProfitLimit) {
                        console.log(`💰 Daily profit limit reached: ${this.stats.winLossStats.dailyProfit}`);
                        this.stopRunningBot();
                        this.stop();
                        this.sendNotification(
                            '💰 Daily Profit Target',
                            `Bot stopped - reached daily profit limit of ${this.config.riskManagement.dailyProfitLimit}`,
                            'success'
                        );
                    }

                    if (this.stats.winLossStats.dailyLoss >= this.config.riskManagement.dailyLossLimit) {
                        console.log(`📉 Daily loss limit reached: ${this.stats.winLossStats.dailyLoss}`);
                        this.stopRunningBot();
                        this.stop();
                        this.sendNotification(
                            '📉 Daily Loss Limit',
                            `Bot stopped - reached daily loss limit of ${this.config.riskManagement.dailyLossLimit}`,
                            'error'
                        );
                    }
                }
            } catch (error) {
                // Silently fail - store might not be available yet
            }
        }, 1000); // Check every second

        // Store interval for cleanup
        (this as any)._contractMonitorInterval = checkInterval;

        console.log('👁️ Contract monitoring initialized');
    }

    public destroy(): void {
        this.stop();
        if (this.hourlyResetInterval) {
            clearInterval(this.hourlyResetInterval);
        }
        if ((this as any)._contractMonitorInterval) {
            clearInterval((this as any)._contractMonitorInterval);
        }
        this.listeners = [];
        this.events = [];
    }
}

// Export singleton instance
export const autoBotLoaderService = AutoBotLoaderService.getInstance();
