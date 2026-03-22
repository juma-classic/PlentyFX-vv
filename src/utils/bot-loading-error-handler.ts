/**
 * Bot Loading Error Handler Utility
 * Provides comprehensive error handling and recovery for bot loading operations
 */

export interface BotLoadingError {
    type: 'XML_PARSE_ERROR' | 'BOT_NOT_FOUND' | 'CONFIGURATION_ERROR' | 'RECOVERY_STRATEGY_ERROR';
    message: string;
    details?: any;
    recoveryAction?: string;
}

export interface BotLoadingResult {
    success: boolean;
    error?: BotLoadingError;
    warnings?: string[];
    botConfiguration?: any;
}

export class BotLoadingErrorHandler {
    /**
     * Validate bot object before loading
     */
    public static validateBotObject(bot: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        let isValid = true;

        if (!bot) {
            errors.push('Bot object is null or undefined');
            isValid = false;
        }

        if (!bot.title) {
            errors.push('Bot title is missing');
            isValid = false;
        }

        if (!bot.xmlContent) {
            errors.push('Bot XML content is missing');
            isValid = false;
        }

        if (!bot.filePath) {
            errors.push('Bot file path is missing');
            isValid = false;
        }

        return { isValid, errors };
    }

    /**
     * Handle XML parsing errors during bot configuration
     */
    public handleXMLParseError(error: Error, botFile: string): BotLoadingError {
        return {
            type: 'XML_PARSE_ERROR',
            message: `Failed to parse XML for bot: ${botFile}`,
            details: error.message,
            recoveryAction: 'Check bot XML file format and try again',
        };
    }

    /**
     * Handle bot not found errors
     */
    public handleBotNotFoundError(botFile: string): BotLoadingError {
        return {
            type: 'BOT_NOT_FOUND',
            message: `Bot file not found: ${botFile}`,
            details: { requestedBot: botFile },
            recoveryAction: 'Verify bot file exists in the bots array',
        };
    }

    /**
     * Handle configuration errors during bot setup
     */
    public handleConfigurationError(error: Error, config: any): BotLoadingError {
        return {
            type: 'CONFIGURATION_ERROR',
            message: `Failed to configure bot with provided settings`,
            details: { error: error.message, config },
            recoveryAction: 'Check signal data and bot configuration parameters',
        };
    }

    /**
     * Handle recovery strategy calculation errors
     */
    public handleRecoveryStrategyError(error: Error, signal: any): BotLoadingError {
        return {
            type: 'RECOVERY_STRATEGY_ERROR',
            message: `Failed to calculate adaptive recovery strategy`,
            details: { error: error.message, signal: signal.prediction },
            recoveryAction: 'Use fallback prediction values or disable adaptive recovery',
        };
    }

    /**
     * Validate bot configuration before loading
     */
    public validateBotConfiguration(config: any): { isValid: boolean; warnings: string[] } {
        const warnings: string[] = [];
        let isValid = true;

        // Check required fields
        if (!config.botFile) {
            warnings.push('Bot file not specified');
            isValid = false;
        }

        if (!config.market) {
            warnings.push('Market not specified');
            isValid = false;
        }

        if (!config.contractType) {
            warnings.push('Contract type not specified');
            isValid = false;
        }

        // Check prediction values for adaptive recovery
        if (config.recoveryStrategy) {
            const { predictionBeforeLoss, predictionAfterLoss } = config.recoveryStrategy;

            if (predictionBeforeLoss < 0 || predictionBeforeLoss > 9) {
                warnings.push(`Invalid prediction before loss: ${predictionBeforeLoss} (must be 0-9)`);
                isValid = false;
            }

            if (predictionAfterLoss < 0 || predictionAfterLoss > 9) {
                warnings.push(`Invalid prediction after loss: ${predictionAfterLoss} (must be 0-9)`);
                isValid = false;
            }
        }

        // Check stake value
        if (config.stake && (config.stake <= 0 || config.stake > 1000)) {
            warnings.push(`Unusual stake value: ${config.stake}`);
        }

        return { isValid, warnings };
    }

    /**
     * Create a comprehensive bot loading result
     */
    public createResult(
        success: boolean,
        error?: BotLoadingError,
        warnings?: string[],
        botConfiguration?: any
    ): BotLoadingResult {
        return {
            success,
            error,
            warnings,
            botConfiguration,
        };
    }

    /**
     * Log bot loading errors with appropriate formatting
     */
    public logError(error: BotLoadingError): void {
        console.error(`❌ Bot Loading Error [${error.type}]:`, error.message);
        if (error.details) {
            console.error('📋 Details:', error.details);
        }
        if (error.recoveryAction) {
            console.info('💡 Recovery Action:', error.recoveryAction);
        }
    }

    /**
     * Log bot loading warnings
     */
    public logWarnings(warnings: string[]): void {
        warnings.forEach(warning => {
            console.warn('⚠️ Bot Loading Warning:', warning);
        });
    }

    /**
     * Attempt to recover from bot loading errors
     */
    public attemptRecovery(error: BotLoadingError, originalConfig: any): any {
        switch (error.type) {
            case 'RECOVERY_STRATEGY_ERROR':
                // Fallback to basic prediction values
                return {
                    ...originalConfig,
                    predictionBeforeLoss: originalConfig.barrier || 5,
                    predictionAfterLoss: originalConfig.barrier ? originalConfig.barrier + 1 : 6,
                    recoveryStrategy: null,
                };

            case 'CONFIGURATION_ERROR':
                // Use minimal safe configuration
                return {
                    botFile: originalConfig.botFile || 'PATEL (with Entry).xml',
                    botName: originalConfig.botName || 'PATEL (with Entry)',
                    market: originalConfig.market || 'R_50',
                    contractType: originalConfig.contractType || 'DIGITOVER',
                    stake: originalConfig.stake || 1.0,
                    confidence: originalConfig.confidence || 70,
                };

            default:
                return originalConfig;
        }
    }

    /**
     * Get user-friendly error message
     */
    public getUserFriendlyMessage(error: BotLoadingError): string {
        switch (error.type) {
            case 'XML_PARSE_ERROR':
                return 'There was an issue with the bot file format. Please try a different bot.';

            case 'BOT_NOT_FOUND':
                return 'The requested bot could not be found. Please select a different bot.';

            case 'CONFIGURATION_ERROR':
                return 'There was an issue configuring the bot. Please check your signal settings.';

            case 'RECOVERY_STRATEGY_ERROR':
                return 'Could not calculate optimal prediction strategy. Using fallback values.';

            default:
                return 'An unexpected error occurred while loading the bot.';
        }
    }
}

export const botLoadingErrorHandler = new BotLoadingErrorHandler();

/**
 * Higher-order function to wrap bot loading operations with error handling
 */
export function withBotLoadingErrorHandling<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    operationName: string = 'Bot Loading Operation'
): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
        try {
            console.log(`🔄 Starting ${operationName}...`);
            const result = await fn(...args);
            console.log(`✅ ${operationName} completed successfully`);
            return result;
        } catch (error) {
            console.error(`❌ ${operationName} failed:`, error);

            // Create appropriate error based on error type
            let botError: BotLoadingError;

            if (error instanceof Error) {
                if (error.message.includes('XML') || error.message.includes('parse')) {
                    botError = botLoadingErrorHandler.handleXMLParseError(error, 'unknown');
                } else if (error.message.includes('not found')) {
                    botError = botLoadingErrorHandler.handleBotNotFoundError('unknown');
                } else if (error.message.includes('configuration') || error.message.includes('config')) {
                    botError = botLoadingErrorHandler.handleConfigurationError(error, {});
                } else if (error.message.includes('recovery') || error.message.includes('strategy')) {
                    botError = botLoadingErrorHandler.handleRecoveryStrategyError(error, {});
                } else {
                    botError = {
                        type: 'CONFIGURATION_ERROR',
                        message: error.message,
                        details: error.stack,
                        recoveryAction: 'Check console for detailed error information',
                    };
                }
            } else {
                botError = {
                    type: 'CONFIGURATION_ERROR',
                    message: 'Unknown error occurred during bot loading',
                    details: error,
                    recoveryAction: 'Try reloading the page or selecting a different bot',
                };
            }

            // Log the structured error
            botLoadingErrorHandler.logError(botError);

            // Re-throw the original error to maintain existing error handling
            throw error;
        }
    };
}
