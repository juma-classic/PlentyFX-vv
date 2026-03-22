/**
 * Signal Bot Loader Service
 * Automatically selects and loads appropriate bots based on trading signals
 * Configures bot parameters to match signal recommendations
 */

import { DBOT_TABS } from '@/constants/bot-contents';
import type { RealSignal } from './advanced-algo-signal.service';
import { adaptiveRecoveryStrategy } from './adaptive-recovery-strategy.service';
import { stakeManager } from './stake-manager.service';

export interface BotConfiguration {
    botFile: string;
    botName: string;
    market: string;
    contractType: string;
    stake: number;
    martingale?: number; // Add martingale to interface
    prediction?: number;
    predictionBeforeLoss?: number;
    predictionAfterLoss?: number;
    signalType: string;
    confidence: number;
    barrier?: number;
    // Adaptive Recovery Configuration
    useAdaptiveRecovery?: boolean;
    recoveryBarrier?: number;
    recoveryPrediction?: number;
    recoveryReasoning?: string;
    recoveryStrategy?: {
        predictionBeforeLoss: number;
        predictionAfterLoss: number;
        strategy: string;
        reasoning: string;
        winProbabilities: { beforeLoss: number; afterLoss: number };
    };
}

export interface BotRecommendation {
    botFile: string;
    botName: string;
    description: string;
    suitability: number; // 0-100 score
    reason: string;
}

/**
 * XML Martingale Update Result
 */
export interface MartingaleUpdateResult {
    success: boolean;
    fieldsUpdated: number;
    updatedFields: string[];
    errors: string[];
    xmlContent?: string;
}

class SignalBotLoaderService {
    private readonly BOT_MAPPINGS = {
        // Even/Odd Bots - CFX Even/Odd as primary (from Free Bots)
        EVEN_ODD: [
            {
                file: 'CFX-EvenOdd.xml',
                name: 'CFX Even/Odd',
                description: 'Primary Even/Odd bot - Specialized trading bot from Free Bots',
                suitability: 98,
                minConfidence: 60,
                isPrimary: true,
            },
            {
                file: 'CFX-025-Enhanced.xml',
                name: 'CFX-025 Enhanced',
                description: 'Advanced Even/Odd bot with martingale and pattern recognition from Free Bots',
                suitability: 95,
                minConfidence: 70,
            },
            {
                file: 'Even Odd Ghost V1 by Dexter.xml',
                name: 'Even Odd Ghost V1 by Dexter',
                description: 'Ghost pattern Even/Odd bot by Dexter from Free Bots',
                suitability: 88,
                minConfidence: 75,
            },
            {
                file: 'CFX-025-Base.xml',
                name: 'CFX-025 Base',
                description: 'Reliable Even/Odd bot with basic martingale from Free Bots',
                suitability: 85,
                minConfidence: 60,
            },
        ],

        // Over/Under Bots - PATEL (with Entry) as primary
        OVER_UNDER: [
            {
                file: 'PATEL (with Entry).xml',
                name: 'PATEL (with Entry)',
                description: 'Primary Over/Under bot - Entry point detection with search number as entry digit',
                suitability: 98,
                minConfidence: 65,
                isPrimary: true,
            },
            {
                file: 'Elvis SpeedBot(With Entry).xml',
                name: 'Elvis SpeedBot (With Entry)',
                description: 'High-speed Over/Under bot with entry detection from Free Bots',
                suitability: 95,
                minConfidence: 65,
            },
            {
                file: 'Over_Under Ghost - by ElvisTrades.xml',
                name: 'Over/Under Ghost by Elvis',
                description: 'Advanced Over/Under bot with ghost patterns from Free Bots',
                suitability: 92,
                minConfidence: 70,
            },
            {
                file: 'Over_Under Ghost v2 - by Elvis Trades.xml',
                name: 'Over/Under Ghost V2 by PlentyFX',
                description: 'Enhanced Over/Under bot with improved patterns from Free Bots',
                suitability: 90,
                minConfidence: 75,
            },
            {
                file: 'Over2 Master.xml',
                name: 'Over2 Master',
                description: 'Master-level Over/Under trading bot from Free Bots',
                suitability: 88,
                minConfidence: 65,
            },
        ],

        // Rise/Fall Bots - CFX Rise/Fall as primary (from Free Bots)
        RISE_FALL: [
            {
                file: 'CFX-RiseFall.xml',
                name: 'CFX Rise/Fall',
                description: 'Primary Rise/Fall bot - Professional trading bot from Free Bots',
                suitability: 98,
                minConfidence: 65,
                isPrimary: true,
            },
            {
                file: 'Elvis SpeedBot(With Entry).xml',
                name: 'Elvis SpeedBot (With Entry)',
                description: 'High-speed Rise/Fall bot with entry detection from Free Bots',
                suitability: 88,
                minConfidence: 75,
            },
        ],

        // Matches Bots
        MATCHES: [
            {
                file: 'MatchesMaster.xml',
                name: 'MatchesMaster',
                description: 'Advanced digit matching bot with AI predictions',
                suitability: 95,
                minConfidence: 80,
            },
        ],

        // Multi-Strategy Bots
        MULTI_STRATEGY: [
            {
                file: 'Game Changer AI - etrades.xml',
                name: 'Game Changer AI - etrades',
                description: 'Advanced AI-powered multi-strategy bot with enhanced trading algorithms',
                suitability: 95,
                minConfidence: 70,
            },
            {
                file: 'Digit-Hunter-Pro.xml',
                name: 'Digit Hunter Pro',
                description: 'Professional multi-strategy digit hunting bot',
                suitability: 92,
                minConfidence: 70,
            },
            {
                file: 'MarketMakerPro-Enhanced.xml',
                name: 'MarketMaker Pro Enhanced',
                description: 'Enhanced market making bot with multiple strategies',
                suitability: 88,
                minConfidence: 65,
            },
            {
                file: 'Deriv Killer - Elvis Trades.xml',
                name: 'Deriv Killer by PlentyFX',
                description: 'High-performance multi-strategy bot',
                suitability: 85,
                minConfidence: 75,
            },
        ],
    };

    /**
     * Get bot recommendations based on signal
     */
    public getBotRecommendations(signal: RealSignal): BotRecommendation[] {
        const recommendations: BotRecommendation[] = [];

        // Get bots for specific signal type
        let botCategory = '';
        if (signal.signalType === 'EVEN_ODD') {
            botCategory = 'EVEN_ODD';
        } else if (signal.signalType === 'OVER_UNDER') {
            botCategory = 'OVER_UNDER';
        } else if (signal.signalType === 'RISE_FALL') {
            botCategory = 'RISE_FALL';
        }

        if (botCategory && this.BOT_MAPPINGS[botCategory as keyof typeof this.BOT_MAPPINGS]) {
            const categoryBots = this.BOT_MAPPINGS[botCategory as keyof typeof this.BOT_MAPPINGS];

            categoryBots.forEach(bot => {
                if (signal.confidence >= bot.minConfidence) {
                    recommendations.push({
                        botFile: bot.file,
                        botName: bot.name,
                        description: bot.description,
                        suitability: this.calculateSuitability(bot, signal),
                        reason: this.generateRecommendationReason(bot, signal),
                    });
                }
            });
        }

        // Add multi-strategy bots as fallback
        this.BOT_MAPPINGS.MULTI_STRATEGY.forEach(bot => {
            if (signal.confidence >= bot.minConfidence) {
                recommendations.push({
                    botFile: bot.file,
                    botName: bot.name,
                    description: bot.description,
                    suitability: this.calculateSuitability(bot, signal) - 10, // Lower priority
                    reason: `Multi-strategy bot suitable for ${signal.signalType} signals`,
                });
            }
        });

        // Sort by suitability score
        return recommendations.sort((a, b) => b.suitability - a.suitability);
    }

    /**
     * Get the best bot for a signal
     */
    public getBestBot(signal: RealSignal): BotRecommendation | null {
        const recommendations = this.getBotRecommendations(signal);
        return recommendations.length > 0 ? recommendations[0] : null;
    }

    /**
     * Load bot automatically based on signal with specific assignments
     */
    public async loadBotFromSignal(signal: RealSignal, autoLoad: boolean = true): Promise<boolean> {
        const bestBot = this.getBestBot(signal);

        if (!bestBot) {
            console.warn('❌ No suitable bot found for signal:', signal);
            return false;
        }

        console.log('🤖 Loading bot for signal:', {
            signal: signal.prediction,
            market: signal.market,
            confidence: signal.confidence,
            selectedBot: bestBot.botName,
        });

        // Calculate adaptive recovery strategy
        const recoveryConfig = adaptiveRecoveryStrategy.getRecoveryConfigForBot(signal);

        console.log('🎯 Adaptive Recovery Strategy:', {
            original: signal.prediction,
            recovery: recoveryConfig.recoveryPrediction,
            adaptive: recoveryConfig.useAdaptiveRecovery,
            reasoning: recoveryConfig.recoveryReasoning,
        });

        // Create bot configuration
        const config: BotConfiguration = {
            botFile: bestBot.botFile,
            botName: bestBot.botName,
            market: signal.market,
            contractType: this.getContractType(signal),
            stake: signal.recommendedStake,
            prediction: signal.targetDigit,
            signalType: signal.prediction,
            confidence: signal.confidence,
            // Add adaptive recovery configuration
            useAdaptiveRecovery: recoveryConfig.useAdaptiveRecovery,
            recoveryBarrier: recoveryConfig.recoveryBarrier,
            recoveryPrediction: recoveryConfig.recoveryPrediction,
            recoveryReasoning: recoveryConfig.recoveryReasoning,
        };

        if (autoLoad) {
            // Dispatch event to load bot
            this.dispatchBotLoadEvent(config);
            return true;
        }

        return false;
    }

    /**
     * Auto-load bot with specific assignments based on signal type
     * OVER_UNDER -> PATEL (with Entry) - Entry point detection with proper barrier configuration
     * EVEN_ODD -> CFX Even/Odd (from Free Bots)
     * RISE_FALL -> CFX Rise/Fall (from Free Bots)
     */
    public async autoLoadBotForSignal(signal: RealSignal): Promise<boolean> {
        let selectedBotFile = '';
        let botName = '';

        // Specific bot assignments using exact XML files from Free Bots section
        switch (signal.signalType) {
            case 'OVER_UNDER':
                selectedBotFile = 'PATEL (with Entry).xml';
                botName = 'PATEL (with Entry)';
                break;
            case 'EVEN_ODD':
                selectedBotFile = 'CFX-EvenOdd.xml';
                botName = 'CFX Even/Odd';
                break;
            case 'RISE_FALL':
                selectedBotFile = 'CFX-RiseFall.xml';
                botName = 'CFX Rise/Fall';
                break;
            default:
                console.warn('❌ Unknown signal type:', signal.signalType);
                return false;
        }

        // Calculate adaptive recovery strategy for OVER/UNDER signals
        let recoveryStrategy: any = null;
        if (signal.signalType === 'OVER_UNDER') {
            recoveryStrategy = adaptiveRecoveryStrategy.generateComprehensiveConfig(
                signal.prediction,
                signal.confidence,
                signal.strength
            );
        }

        console.log('🚀 Enhanced Auto-loading with Adaptive Recovery:', {
            signalType: signal.signalType,
            prediction: signal.prediction,
            recoveryStrategy: recoveryStrategy
                ? {
                      predictionBeforeLoss: recoveryStrategy.predictionBeforeLoss,
                      predictionAfterLoss: recoveryStrategy.predictionAfterLoss,
                      winProbabilities: recoveryStrategy.winProbabilities,
                  }
                : null,
            selectedBot: botName,
            market: signal.market,
            confidence: signal.confidence,
        });

        // Create enhanced bot configuration with proper OVER/UNDER handling and adaptive recovery
        const config: BotConfiguration = {
            botFile: selectedBotFile,
            botName: botName,
            market: signal.market,
            contractType: this.getContractType(signal),
            stake: signal.recommendedStake,
            prediction: signal.targetDigit,
            signalType: signal.prediction,
            confidence: signal.confidence,
        };

        // Add adaptive recovery strategy if available
        if (recoveryStrategy && recoveryStrategy.isValid) {
            config.recoveryStrategy = {
                predictionBeforeLoss: recoveryStrategy.predictionBeforeLoss,
                predictionAfterLoss: recoveryStrategy.predictionAfterLoss,
                strategy: recoveryStrategy.strategy,
                reasoning: recoveryStrategy.reasoning,
                winProbabilities: recoveryStrategy.winProbabilities,
            };

            // Set the prediction values for bot configuration
            config.predictionBeforeLoss = recoveryStrategy.predictionBeforeLoss;
            config.predictionAfterLoss = recoveryStrategy.predictionAfterLoss;

            console.log(`🧠 Adaptive Recovery Applied:`, {
                signal: signal.prediction,
                predictionBeforeLoss: recoveryStrategy.predictionBeforeLoss,
                predictionAfterLoss: recoveryStrategy.predictionAfterLoss,
                winProbBeforeLoss: `${recoveryStrategy.winProbabilities.beforeLoss}%`,
                winProbAfterLoss: `${recoveryStrategy.winProbabilities.afterLoss}%`,
                reasoning: recoveryStrategy.reasoning,
            });
        }

        // Add barrier information if available
        if (signal.barrierSuggestions && signal.barrierSuggestions.length > 0) {
            const optimalBarrier = signal.barrierSuggestions.find(b => b.type === 'OPTIMAL');
            if (optimalBarrier) {
                (config as any).suggestedBarrier = optimalBarrier.level;
                (config as any).barrierConfidence = optimalBarrier.confidence;
            }
        }

        // For OVER/UNDER signals, extract the barrier value from the prediction
        if (signal.signalType === 'OVER_UNDER') {
            const barrierMatch = signal.prediction.match(/(?:OVER|UNDER)\s*(\d+)/i);
            if (barrierMatch) {
                (config as any).barrier = parseInt(barrierMatch[1]);
                console.log(`🎯 Extracted barrier: ${barrierMatch[1]} from prediction: ${signal.prediction}`);
            } else {
                // Fallback: try to extract from targetDigit or use default barrier
                if (signal.prediction.includes('OVER')) {
                    (config as any).barrier = signal.targetDigit || 5; // Default OVER5
                } else if (signal.prediction.includes('UNDER')) {
                    (config as any).barrier = signal.targetDigit || 5; // Default UNDER5
                }
                console.log(`🎯 Using fallback barrier: ${(config as any).barrier} for ${signal.prediction}`);
            }
        }

        // Dispatch enhanced bot load event
        this.dispatchEnhancedBotLoadEvent(config, signal);

        return true;
    }

    /**
     * Load specific bot with signal configuration
     */
    public async loadSpecificBot(botFile: string, signal: RealSignal): Promise<boolean> {
        console.log('🎯 Loading specific bot:', botFile, 'for signal:', signal.prediction);

        const config: BotConfiguration = {
            botFile,
            botName: this.getBotNameFromFile(botFile),
            market: signal.market,
            contractType: this.getContractType(signal),
            stake: signal.recommendedStake,
            prediction: signal.targetDigit,
            signalType: signal.prediction,
            confidence: signal.confidence,
        };

        this.dispatchBotLoadEvent(config);
        return true;
    }

    /**
     * Calculate bot suitability score
     */
    private calculateSuitability(bot: any, signal: RealSignal): number {
        let score = bot.suitability;

        // Adjust based on confidence
        if (signal.confidence >= 85) score += 5;
        else if (signal.confidence >= 75) score += 2;
        else if (signal.confidence < 65) score -= 5;

        // Adjust based on strength
        if (signal.strength === 'VERY_STRONG') score += 5;
        else if (signal.strength === 'STRONG') score += 3;
        else if (signal.strength === 'WEAK') score -= 3;

        // Adjust based on risk level
        if (signal.riskLevel === 'LOW') score += 2;
        else if (signal.riskLevel === 'HIGH') score -= 2;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Generate recommendation reason
     */
    private generateRecommendationReason(bot: any, signal: RealSignal): string {
        const reasons = [];

        if (signal.confidence >= bot.minConfidence) {
            reasons.push(`Confidence ${signal.confidence}% meets requirement`);
        }

        if (signal.strength === 'VERY_STRONG' || signal.strength === 'STRONG') {
            reasons.push(`Strong signal pattern detected`);
        }

        if (signal.riskLevel === 'LOW') {
            reasons.push(`Low risk signal`);
        }

        reasons.push(bot.description);

        return reasons.join(' • ');
    }

    /**
     * Get contract type from signal with proper OVER/UNDER barrier handling
     */
    private getContractType(signal: RealSignal): string {
        // Handle OVER/UNDER signals with barrier numbers (e.g., OVER5, UNDER3)
        if (signal.prediction.startsWith('OVER')) {
            return 'DIGITOVER';
        } else if (signal.prediction.startsWith('UNDER')) {
            return 'DIGITUNDER';
        }

        // Handle basic predictions
        const contractMap: Record<string, string> = {
            EVEN: 'DIGITEVEN',
            ODD: 'DIGITODD',
            RISE: 'CALL',
            FALL: 'PUT',
        };

        return contractMap[signal.prediction] || 'DIGITEVEN';
    }

    /**
     * Get bot name from file path
     */
    private getBotNameFromFile(filePath: string): string {
        const fileName = filePath.split('/').pop() || filePath;
        return fileName.replace('.xml', '').replace(/[-_]/g, ' ');
    }

    /**
     * Dispatch bot load event
     */
    private dispatchBotLoadEvent(config: BotConfiguration): void {
        // For CFX bots, use the existing CFX bot loader
        if (config.botFile.includes('CFX')) {
            const event = new CustomEvent('load.cfx.bot', {
                detail: {
                    botFile: config.botFile,
                    signalType: config.signalType,
                    market: config.market,
                    prediction: config.prediction,
                },
            });
            window.dispatchEvent(event);
        }
        // For PATEL bot, use specific PATEL loader with entry point
        else if (config.botFile.includes('PATEL')) {
            const event = new CustomEvent('load.patel.bot', {
                detail: {
                    botFile: config.botFile,
                    signalType: config.signalType,
                    market: config.market,
                    prediction: config.prediction,
                    searchNumber: config.prediction, // Entry digit becomes search number
                    entryPoint: config.prediction,
                },
            });
            window.dispatchEvent(event);
        }
        // For MatchesMaster, use the existing MatchesMaster loader
        else if (config.botFile === 'MatchesMaster.xml') {
            const event = new CustomEvent('open.matchesmaster.bot', {
                detail: {
                    predictedDigit: config.prediction || 5,
                    market: config.market,
                },
            });
            window.dispatchEvent(event);
        }
        // For other bots, create a generic bot load event
        else {
            const event = new CustomEvent('load.signal.bot', {
                detail: config,
            });
            window.dispatchEvent(event);
        }

        console.log('📡 Bot load event dispatched:', config);
    }

    /**
     * Dispatch enhanced bot load event with signal data
     */
    private dispatchEnhancedBotLoadEvent(config: BotConfiguration, signal: RealSignal): void {
        // Extract barrier value from OVER/UNDER signals
        let barrier: number | undefined;
        if (signal.signalType === 'OVER_UNDER') {
            const barrierMatch = signal.prediction.match(/(?:OVER|UNDER)\s*(\d+)/i);
            if (barrierMatch) {
                barrier = parseInt(barrierMatch[1]);
                console.log(`🎯 Extracted barrier: ${barrier} from prediction: ${signal.prediction}`);
            }
        }

        // Enhanced event with full signal data and adaptive recovery
        const enhancedDetail = {
            ...config,
            barrier, // Add barrier for OVER/UNDER signals
            // Adaptive Recovery Configuration
            adaptiveRecovery: {
                enabled: config.useAdaptiveRecovery,
                originalBarrier: barrier,
                recoveryBarrier: config.recoveryBarrier,
                recoveryPrediction: config.recoveryPrediction,
                reasoning: config.recoveryReasoning,
            },
            signal: {
                id: signal.id,
                market: signal.market,
                marketLabel: signal.marketLabel,
                signalType: signal.signalType,
                prediction: signal.prediction,
                confidence: signal.confidence,
                strength: signal.strength,
                entryPrice: signal.entryPrice,
                targetDigit: signal.targetDigit,
                entryDigit: signal.entryDigit, // Add entryDigit for PATEL bot
                reasoning: signal.reasoning,
                supportingFactors: signal.supportingFactors,
                riskLevel: signal.riskLevel,
                recommendedStake: signal.recommendedStake,
                barrierSuggestions: signal.barrierSuggestions,
                patternData: signal.patternData,
            },
            autoLoaded: true,
            timestamp: Date.now(),
        };

        // Dispatch specific events based on bot type
        if (config.botFile.includes('CFX')) {
            const event = new CustomEvent('load.cfx.bot.enhanced', {
                detail: enhancedDetail,
            });
            window.dispatchEvent(event);
        } else if (config.botFile.includes('Elvis')) {
            const event = new CustomEvent('load.elvis.bot.enhanced', {
                detail: enhancedDetail,
            });
            window.dispatchEvent(event);
        } else if (config.botFile.includes('PATEL')) {
            // PATEL bot with entry point and adaptive recovery strategy
            const patelDetail = {
                ...enhancedDetail,
                searchNumber: signal.entryDigit || signal.targetDigit, // Entry digit becomes search number
                entryPoint: signal.entryDigit || signal.targetDigit,
                recoveryStrategy: config.recoveryStrategy, // Pass recovery strategy
            };
            const event = new CustomEvent('load.patel.bot.enhanced', {
                detail: patelDetail,
            });
            window.dispatchEvent(event);
        } else {
            const event = new CustomEvent('load.signal.bot.enhanced', {
                detail: enhancedDetail,
            });
            window.dispatchEvent(event);
        }

        // Also dispatch generic auto-load event
        const autoLoadEvent = new CustomEvent('auto.load.bot', {
            detail: enhancedDetail,
        });
        window.dispatchEvent(autoLoadEvent);

        console.log('🚀 Enhanced bot load event dispatched:', enhancedDetail);
    }

    /**
     * Switch to bot builder tab
     */
    public switchToBotBuilder(): void {
        // Dispatch event to switch to bot builder tab
        const event = new CustomEvent('switch.tab', {
            detail: { tab: DBOT_TABS.BOT_BUILDER },
        });
        window.dispatchEvent(event);
    }

    /**
     * Get available bots for signal type
     */
    public getAvailableBotsForSignalType(signalType: string): string[] {
        let botCategory = '';

        if (signalType === 'EVEN_ODD') {
            botCategory = 'EVEN_ODD';
        } else if (signalType === 'OVER_UNDER') {
            botCategory = 'OVER_UNDER';
        } else if (signalType === 'RISE_FALL') {
            botCategory = 'RISE_FALL';
        }

        const bots: string[] = [];

        if (botCategory && this.BOT_MAPPINGS[botCategory as keyof typeof this.BOT_MAPPINGS]) {
            this.BOT_MAPPINGS[botCategory as keyof typeof this.BOT_MAPPINGS].forEach(bot => {
                bots.push(bot.file);
            });
        }

        // Add multi-strategy bots
        this.BOT_MAPPINGS.MULTI_STRATEGY.forEach(bot => {
            bots.push(bot.file);
        });

        return bots;
    }

    /**
     * Create bot configuration from signal
     */
    public createBotConfiguration(signal: RealSignal, botFile?: string): BotConfiguration {
        const selectedBot = botFile || this.getBestBot(signal)?.botFile || 'CFX-025-Enhanced.xml';

        return {
            botFile: selectedBot,
            botName: this.getBotNameFromFile(selectedBot),
            market: signal.market,
            contractType: this.getContractType(signal),
            stake: signal.recommendedStake,
            martingale: stakeManager.getMartingale(), // Add martingale from StakeManager
            prediction: signal.targetDigit,
            signalType: signal.prediction,
            confidence: signal.confidence,
        };
    }

    /**
     * Update martingale fields in bot XML - CENTRALIZED METHOD
     * This is the main method that should be used by all bot loading functions
     */
    public updateMartingaleInXML(xmlDoc: Document, targetMartingale?: number): MartingaleUpdateResult {
        const martingaleValue = targetMartingale || stakeManager.getMartingale();
        const result: MartingaleUpdateResult = {
            success: false,
            fieldsUpdated: 0,
            updatedFields: [],
            errors: [],
        };

        console.log(`🎯 [SignalBotLoader] Updating martingale to: ${martingaleValue}`);

        try {
            // Method 1: Update by specific block ID
            const martingaleBlock = xmlDoc.querySelector('block[id="multiplier_value"] field[name="NUM"]');
            if (martingaleBlock) {
                const oldValue = martingaleBlock.textContent;
                martingaleBlock.textContent = martingaleValue.toString();
                result.fieldsUpdated++;
                result.updatedFields.push(`Block ID "multiplier_value": ${oldValue} → ${martingaleValue}`);
                console.log(`🎯 Updated Martingale Multiplier (Block ID) from ${oldValue} to ${martingaleValue}`);
            }

            // Method 2: Update by variable names (PRECISE - only "Martangle", NOT "Martangle Level")
            const allVariableFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
            console.log(`🔍 Found ${allVariableFields.length} variable fields to check`);

            allVariableFields.forEach((varField, index) => {
                const varName = varField.textContent?.toLowerCase();
                console.log(`🔍 Variable ${index}: "${varName}"`);

                // PRECISE MATCHING: Only "martangle" or "martingale", NOT "level"
                if (
                    varName &&
                    (varName.includes('martingale') || varName.includes('martangle')) &&
                    !varName.includes('level') && // EXCLUDE "Martangle Level"
                    !varName.includes('multiplier')
                ) {
                    const block = varField.closest('block[type="variables_set"]');
                    if (block) {
                        const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                        if (numField) {
                            const oldValue = numField.textContent;
                            numField.textContent = martingaleValue.toString();
                            result.fieldsUpdated++;
                            result.updatedFields.push(`Variable "${varName}": ${oldValue} → ${martingaleValue}`);
                            console.log(
                                `🎯 Updated "${varName}" from ${oldValue} to ${martingaleValue} (StakeManager)`
                            );
                        }
                    }
                }
            });

            // Method 3: TARGETED - Only update field with value "2" that is specifically "Martangle"
            console.log('🔍 TARGETED: Looking for "Martangle" field with value "2"...');
            const suspiciousFields = xmlDoc.querySelectorAll('field[name="NUM"]');
            suspiciousFields.forEach((field, index) => {
                const value = field.textContent;
                if (value === '2') {
                    const parentBlock = field.closest('block');
                    const blockContext = parentBlock?.textContent?.toLowerCase() || '';

                    // Only update if it's specifically "Martangle" (not "Martangle Level")
                    if (blockContext.includes('martangle') && !blockContext.includes('level')) {
                        const oldValue = field.textContent;
                        field.textContent = martingaleValue.toString();
                        result.fieldsUpdated++;
                        result.updatedFields.push(`Targeted "Martangle" field: ${oldValue} → ${martingaleValue}`);
                        console.log(`🎯 TARGETED: Updated "Martangle" field from "${oldValue}" to ${martingaleValue}`);
                    }
                }
            });

            result.success = result.fieldsUpdated > 0;

            if (result.success) {
                console.log(
                    `✅ Martingale Update Summary: ${result.fieldsUpdated} fields updated to ${martingaleValue}x`
                );
                console.log(`🎉 SUCCESS: Martingale ${martingaleValue}x applied to bot XML!`);
            } else {
                result.errors.push('No martingale fields found or updated in bot XML');
                console.warn('⚠️ No martingale fields found or updated in bot XML');
            }
        } catch (error) {
            result.errors.push(`Error updating martingale: ${error}`);
            console.error('❌ Error updating martingale in XML:', error);
        }

        return result;
    }

    /**
     * Update stake fields in bot XML - CENTRALIZED METHOD
     */
    public updateStakeInXML(xmlDoc: Document, targetStake?: number): MartingaleUpdateResult {
        const stakeValue = targetStake || stakeManager.getStake();
        const result: MartingaleUpdateResult = {
            success: false,
            fieldsUpdated: 0,
            updatedFields: [],
            errors: [],
        };

        console.log(`💰 [SignalBotLoader] Updating stake to: ${stakeValue}`);

        try {
            // Update stake fields
            const stakeFields = xmlDoc.querySelectorAll('field[name="NUM"]');
            stakeFields.forEach((field, index) => {
                // Look for stake-related NUM fields
                const parentBlock = field.closest('block');
                if (parentBlock && parentBlock.getAttribute('type') === 'math_number') {
                    // Check if this is a stake-related field by looking at surrounding context
                    const variableSet = field.closest('block[type="variables_set"]');
                    if (variableSet) {
                        const varField = variableSet.querySelector('field[name="VAR"]');
                        if (varField && varField.textContent?.toLowerCase().includes('stake')) {
                            const oldValue = field.textContent;
                            field.textContent = stakeValue.toString();
                            result.fieldsUpdated++;
                            result.updatedFields.push(`Stake "${varField.textContent}": ${oldValue} → ${stakeValue}`);
                            console.log(
                                `💰 Updated stake to ${stakeValue} (${varField.textContent}) from StakeManager`
                            );
                        }
                    }
                }
            });

            result.success = result.fieldsUpdated > 0;

            if (result.success) {
                console.log(`✅ Stake Update Summary: ${result.fieldsUpdated} fields updated to ${stakeValue}`);
            } else {
                result.errors.push('No stake fields found or updated in bot XML');
                console.warn('⚠️ No stake fields found or updated in bot XML');
            }
        } catch (error) {
            result.errors.push(`Error updating stake: ${error}`);
            console.error('❌ Error updating stake in XML:', error);
        }

        return result;
    }

    /**
     * Apply StakeManager settings to bot XML - COMPREHENSIVE METHOD
     * This method updates both stake and martingale using StakeManager values
     */
    public applyStakeManagerSettings(xmlDoc: Document): {
        fieldsUpdated: number;
        stakeUpdated: boolean;
        martingaleUpdated: boolean;
        details: string[];
    } {
        console.log('🎯 [SignalBotLoader] Applying StakeManager settings to bot XML...');

        const stakeResult = this.updateStakeInXML(xmlDoc);
        const martingaleResult = this.updateMartingaleInXML(xmlDoc);

        // Combine results into expected format
        const combinedResult = {
            fieldsUpdated: stakeResult.fieldsUpdated + martingaleResult.fieldsUpdated,
            stakeUpdated: stakeResult.success,
            martingaleUpdated: martingaleResult.success,
            details: [...stakeResult.updatedFields, ...martingaleResult.updatedFields],
        };

        console.log('📊 StakeManager Application Summary:', {
            stake: {
                value: stakeManager.getStake(),
                fieldsUpdated: stakeResult.fieldsUpdated,
                success: stakeResult.success,
            },
            martingale: {
                value: stakeManager.getMartingale(),
                fieldsUpdated: martingaleResult.fieldsUpdated,
                success: martingaleResult.success,
            },
            combined: combinedResult,
        });

        return combinedResult;
    }

    /**
     * Get current StakeManager values
     */
    public getStakeManagerValues(): { stake: number; martingale: number; isCustom: boolean } {
        return {
            stake: stakeManager.getStake(),
            martingale: stakeManager.getMartingale(),
            isCustom: stakeManager.hasCustomSettings(),
        };
    }
}

export const signalBotLoader = new SignalBotLoaderService();
