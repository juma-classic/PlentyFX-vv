/**
 * Raziel Bot Loader Service
 * Handles loading and configuring Raziel Over Under bot with signal parameters
 */

import { DigitDistributionSignal } from './digit-distribution-scanner.service';
import { HotColdZoneSignal } from './hot-cold-zone-scanner.service';
import { botLoadingDebugger } from '../utils/bot-loading-debugger';
import { stakeManager } from './stake-manager.service';

// Legacy signal interface for backward compatibility
interface LegacyRangingMarketSignal {
    market: string;
    marketName: string;
    currentPrice: number;
    recommendation: {
        action: 'OVER' | 'UNDER';
        barrier: number;
        confidence: number;
        reasoning: string;
    };
    confidence: number;
    fibonacciLevels?: Array<{
        level: number;
        price: number;
    }>;
    analysis?: {
        volatility?: number;
        trendStrength?: number;
        rangingScore?: number;
        fibonacciAlignment?: number;
    };
}

// Interface for bot object used in loading
interface BotObject {
    id: string;
    filePath: string;
    title: string;
    xmlContent: string;
    save_type: string;
}

// Interface for window global objects
interface WindowGlobals {
    load_modal?: {
        loadStrategyToBuilder?: (bot: BotObject) => Promise<void>;
    };
    load_modal_store?: {
        loadStrategyToBuilder?: (bot: BotObject) => Promise<void>;
    };
    dashboard_store?: {
        setActiveTab?: (tab: number) => void;
    };
    Blockly?: {
        getMainWorkspace?: () => BlocklyWorkspace;
        Xml?: {
            textToDom?: (content: string) => Document;
            domToWorkspace?: (dom: Document, workspace: BlocklyWorkspace) => void;
        };
    };
}

interface BlocklyWorkspace {
    clear?: () => void;
}

export interface CustomBotSettings {
    stake: number;
    martingale: number;
}

export interface RazielBotConfiguration {
    botFile: string;
    market: string;
    contractType: string;
    barrier?: number;
    stake: number;
    prediction: string;
    parameters: {
        [key: string]: unknown;
    };
}

class RazielBotLoaderService {
    private readonly RAZIEL_BOT_FILE = 'Raziel Over Under.xml'; // Changed back from CFX-EvenOdd.xml

    /**
     * Load Raziel Over Under bot with Distribution Deviation signal
     */
    public async loadRazielBotWithDistributionSignal(
        signal: DigitDistributionSignal,
        customSettings?: CustomBotSettings
    ): Promise<void> {
        console.log('🤖 Loading Raziel Over Under bot with Distribution Deviation signal...');

        // Start debugging session
        botLoadingDebugger.startDebugging();
        botLoadingDebugger.addStep('signal_analysis', 'success', 'Distribution Deviation signal received', {
            market: signal.market,
            confidence: signal.confidence,
            targetDigit: signal.targetDigit,
            action: signal.recommendation.action,
            barrier: signal.recommendation.barrier,
        });

        try {
            // Create bot configuration from signal
            botLoadingDebugger.addStep('config_creation', 'pending', 'Creating bot configuration');
            const botConfig = this.createBotConfigurationFromDistribution(signal, customSettings);
            botLoadingDebugger.addStep('config_creation', 'success', 'Bot configuration created', botConfig);

            // Load the bot XML
            botLoadingDebugger.addStep('xml_loading', 'pending', 'Loading bot XML file');
            const fileLoaded = await botLoadingDebugger.debugFileLoading(botConfig.botFile);
            if (!fileLoaded) {
                throw new Error(`Failed to load bot file: ${botConfig.botFile}`);
            }

            const botXML = await this.loadBotXML(botConfig.botFile);
            botLoadingDebugger.addStep('xml_loading', 'success', 'Bot XML loaded successfully');

            // Configure bot parameters
            botLoadingDebugger.addStep('xml_config', 'pending', 'Configuring bot parameters');
            botLoadingDebugger.debugXMLConfiguration(botXML, botConfig);
            const configuredXML = this.configureBotXML(botXML, botConfig);
            botLoadingDebugger.addStep('xml_config', 'success', 'Bot parameters configured');

            // Debug available loading methods
            botLoadingDebugger.debugBotLoadingMethods();

            // Load bot into Deriv Bot Builder
            botLoadingDebugger.addStep('bot_injection', 'pending', 'Injecting bot into Deriv Bot Builder');
            await this.loadBotIntoBuilder(configuredXML, botConfig);
            botLoadingDebugger.addStep('bot_injection', 'success', 'Bot injected successfully');

            // Complete debugging
            const debugInfo = botLoadingDebugger.completeDebugging(true);
            console.log('✅ Raziel Over Under bot loaded successfully with Distribution Deviation parameters');

            // Show debug summary in a notification
            this.showDebugSummary(debugInfo);
        } catch (error) {
            console.error('❌ Failed to load Raziel Over Under bot:', error);
            botLoadingDebugger.completeDebugging(false, (error as Error).message);
            throw error;
        }
    }

    /**
     * Load Raziel Over Under bot with Hot/Cold Zone signal
     */
    public async loadRazielBotWithHotColdSignal(
        signal: HotColdZoneSignal,
        customSettings?: CustomBotSettings
    ): Promise<void> {
        console.log('🤖 Loading Raziel Over Under bot with Hot/Cold Zone signal...');

        // Start debugging session
        botLoadingDebugger.startDebugging();
        botLoadingDebugger.addStep('signal_analysis', 'success', 'Hot/Cold Zone signal received', {
            market: signal.market,
            confidence: signal.confidence,
            targetDigit: signal.targetDigit,
            signalType: signal.signalType,
            action: signal.recommendation.action,
            barrier: signal.recommendation.barrier,
        });

        try {
            // Create bot configuration from signal
            botLoadingDebugger.addStep('config_creation', 'pending', 'Creating bot configuration');
            const botConfig = this.createBotConfigurationFromHotCold(signal, customSettings);
            botLoadingDebugger.addStep('config_creation', 'success', 'Bot configuration created', botConfig);

            // Load the bot XML
            botLoadingDebugger.addStep('xml_loading', 'pending', 'Loading bot XML file');
            const fileLoaded = await botLoadingDebugger.debugFileLoading(botConfig.botFile);
            if (!fileLoaded) {
                throw new Error(`Failed to load bot file: ${botConfig.botFile}`);
            }

            const botXML = await this.loadBotXML(botConfig.botFile);
            botLoadingDebugger.addStep('xml_loading', 'success', 'Bot XML loaded successfully');

            // Configure bot parameters
            botLoadingDebugger.addStep('xml_config', 'pending', 'Configuring bot parameters');
            botLoadingDebugger.debugXMLConfiguration(botXML, botConfig);
            const configuredXML = this.configureBotXML(botXML, botConfig);
            botLoadingDebugger.addStep('xml_config', 'success', 'Bot parameters configured');

            // Debug available loading methods
            botLoadingDebugger.debugBotLoadingMethods();

            // Load bot into Deriv Bot Builder
            botLoadingDebugger.addStep('bot_injection', 'pending', 'Injecting bot into Deriv Bot Builder');
            await this.loadBotIntoBuilder(configuredXML, botConfig);
            botLoadingDebugger.addStep('bot_injection', 'success', 'Bot injected successfully');

            // Complete debugging
            const debugInfo = botLoadingDebugger.completeDebugging(true);
            console.log('✅ Raziel Over Under bot loaded successfully with Hot/Cold Zone parameters');

            // Show debug summary in a notification
            this.showDebugSummary(debugInfo);
        } catch (error) {
            console.error('❌ Failed to load Raziel Over Under bot:', error);
            botLoadingDebugger.completeDebugging(false, (error as Error).message);
            throw error;
        }
    }

    /**
     * Load and configure Raziel Over Under bot with signal parameters
     */
    public async loadRazielBotWithSignal(
        signal: LegacyRangingMarketSignal,
        customSettings?: CustomBotSettings
    ): Promise<void> {
        console.log('🤖 Loading Raziel Over Under bot with Fibonacci signal...');

        try {
            // Create bot configuration from signal
            const botConfig = this.createBotConfiguration(signal, customSettings);

            // Load the bot XML
            const botXML = await this.loadBotXML(botConfig.botFile);

            // Configure bot parameters
            const configuredXML = this.configureBotXML(botXML, botConfig);

            // Load bot into Deriv Bot Builder
            await this.loadBotIntoBuilder(configuredXML, botConfig);

            console.log('✅ Raziel Over Under bot loaded successfully with Fibonacci parameters');
        } catch (error) {
            console.error('❌ Failed to load Raziel Over Under bot:', error);
            throw error;
        }
    }

    /**
     * Create bot configuration from Fibonacci signal
     */
    private createBotConfiguration(
        signal: LegacyRangingMarketSignal,
        customSettings?: CustomBotSettings
    ): RazielBotConfiguration {
        const contractType = signal.recommendation.action === 'OVER' ? 'DIGITOVER' : 'DIGITUNDER';

        // Use custom settings if provided, otherwise use defaults based on signal type
        let predictionBeforeLoss: number;
        let predictionAfterLoss: number;
        let stake: number;
        let martingale: number;

        if (customSettings) {
            // Use custom settings for stake and martingale, but always use signal-based predictions
            stake = customSettings.stake;
            martingale = customSettings.martingale;

            // Always use signal-based predictions regardless of custom settings
            if (signal.recommendation.action === 'OVER') {
                predictionBeforeLoss = 2;
                predictionAfterLoss = 3;
            } else {
                // UNDER
                predictionBeforeLoss = 7;
                predictionAfterLoss = 6;
            }
        } else {
            // Use default settings based on signal type
            if (signal.recommendation.action === 'OVER') {
                predictionBeforeLoss = 2;
                predictionAfterLoss = 3;
            } else {
                // UNDER
                predictionBeforeLoss = 7;
                predictionAfterLoss = 6;
            }
            stake = 1; // Default stake
            martingale = 2.2; // Default martingale
        }

        return {
            botFile: this.RAZIEL_BOT_FILE,
            market: signal.market,
            contractType: contractType,
            barrier: signal.recommendation.barrier,
            stake: stake,
            prediction: signal.recommendation.action,
            parameters: {
                // Raziel Over Under specific parameters
                initialStake: stake,
                martingaleSplit: martingale,
                predictionBeforeLoss: predictionBeforeLoss,
                predictionAfterLoss: predictionAfterLoss,

                // Fibonacci-specific parameters
                fibonacciLevel:
                    signal.fibonacciLevels?.find(
                        l =>
                            Math.abs(l.price - signal.currentPrice) ===
                            Math.min(
                                ...(signal.fibonacciLevels || []).map(fl => Math.abs(fl.price - signal.currentPrice))
                            )
                    )?.level || 0.5,

                confidence: signal.confidence,
                reasoning: signal.recommendation.reasoning,

                // Market analysis parameters
                volatility: signal.analysis?.volatility,
                trendStrength: signal.analysis?.trendStrength,
                rangingScore: signal.analysis?.rangingScore,
                fibonacciAlignment: signal.analysis?.fibonacciAlignment,
            },
        };
    }

    /**
     * Create bot configuration from Distribution Deviation signal
     */
    private createBotConfigurationFromDistribution(
        signal: DigitDistributionSignal,
        customSettings?: CustomBotSettings
    ): RazielBotConfiguration {
        const contractType = signal.recommendation.action === 'OVER' ? 'DIGITOVER' : 'DIGITUNDER';

        // Use stake manager settings first, then custom settings if provided
        const stakeSettings = stakeManager.getSettings();
        let predictionBeforeLoss: number;
        let predictionAfterLoss: number;
        let stake: number;
        let martingale: number;

        // Always use stake manager for stake and martingale
        stake = customSettings?.stake || stakeSettings.stake;
        martingale = customSettings?.martingale || stakeSettings.martingale;

        console.log('💰 Using stake settings:', {
            stake,
            martingale,
            source: customSettings ? 'custom + stake manager' : 'stake manager',
        });

        // Check if this is a long press enhanced signal
        if ((signal as any).longPressMode && (signal as any).enhancedPredictions) {
            predictionBeforeLoss = (signal as any).enhancedPredictions.beforeLoss;
            predictionAfterLoss = (signal as any).enhancedPredictions.afterLoss;
            console.log('🔥 Distribution: Using long press enhanced predictions:', {
                predictionBeforeLoss,
                predictionAfterLoss,
            });
        } else {
            // Use default signal-based predictions
            if (signal.recommendation.action === 'OVER') {
                predictionBeforeLoss = 2;
                predictionAfterLoss = 3;
            } else {
                // UNDER
                predictionBeforeLoss = 7;
                predictionAfterLoss = 6;
            }
        }

        return {
            botFile: this.RAZIEL_BOT_FILE,
            market: signal.market,
            contractType: contractType,
            barrier: signal.recommendation.barrier,
            stake: stake,
            prediction: signal.recommendation.action,
            parameters: {
                // Raziel Over Under specific parameters
                initialStake: stake,
                martingaleSplit: martingale,
                predictionBeforeLoss: predictionBeforeLoss,
                predictionAfterLoss: predictionAfterLoss,

                // Distribution Deviation specific parameters
                targetDigit: signal.targetDigit,
                signalType: signal.signalType,
                confidence: signal.confidence,
                reasoning: signal.recommendation.reasoning,

                // Distribution analysis parameters
                totalDeviation: signal.analysis.totalDeviation,
                maxDeviation: signal.analysis.maxDeviation,
                distributionBalance: signal.analysis.distributionBalance,
                correctionPotential: signal.analysis.correctionPotential,
                probabilityEdge: signal.analysis.probabilityEdge,
                deviatedDigits: signal.analysis.deviatedDigits.map(d => d.digit),
                underrepresentedDigits: signal.analysis.underrepresentedDigits.map(d => d.digit),
                overrepresentedDigits: signal.analysis.overrepresentedDigits.map(d => d.digit),
            },
        };
    }

    /**
     * Create bot configuration from Hot/Cold Zone signal
     */
    private createBotConfigurationFromHotCold(
        signal: HotColdZoneSignal,
        customSettings?: CustomBotSettings
    ): RazielBotConfiguration {
        const contractType = signal.recommendation.action === 'OVER' ? 'DIGITOVER' : 'DIGITUNDER';

        // Use stake manager settings first, then custom settings if provided
        const stakeSettings = stakeManager.getSettings();
        let predictionBeforeLoss: number;
        let predictionAfterLoss: number;
        let stake: number;
        let martingale: number;

        // Always use stake manager for stake and martingale
        stake = customSettings?.stake || stakeSettings.stake;
        martingale = customSettings?.martingale || stakeSettings.martingale;

        console.log('💰 Using stake settings:', {
            stake,
            martingale,
            source: customSettings ? 'custom + stake manager' : 'stake manager',
        });

        // Check if this is a long press enhanced signal
        if ((signal as any).longPressMode && (signal as any).enhancedPredictions) {
            predictionBeforeLoss = (signal as any).enhancedPredictions.beforeLoss;
            predictionAfterLoss = (signal as any).enhancedPredictions.afterLoss;
            console.log('🔥 Hot/Cold: Using long press enhanced predictions:', {
                predictionBeforeLoss,
                predictionAfterLoss,
            });
        } else {
            // Use default signal-based predictions
            if (signal.recommendation.action === 'OVER') {
                predictionBeforeLoss = 2;
                predictionAfterLoss = 3;
            } else {
                // UNDER
                predictionBeforeLoss = 7;
                predictionAfterLoss = 6;
            }
        }

        return {
            botFile: this.RAZIEL_BOT_FILE,
            market: signal.market,
            contractType: contractType,
            barrier: signal.recommendation.barrier,
            stake: stake,
            prediction: signal.recommendation.action,
            parameters: {
                // Raziel Over Under specific parameters
                initialStake: stake,
                martingaleSplit: martingale,
                predictionBeforeLoss: predictionBeforeLoss,
                predictionAfterLoss: predictionAfterLoss,

                // Hot/Cold Zone specific parameters
                targetDigit: signal.targetDigit,
                signalType: signal.signalType,
                confidence: signal.confidence,
                reasoning: signal.recommendation.reasoning,

                // Zone analysis parameters
                hotDigits: signal.analysis.hotDigits.map(d => d.digit),
                coldDigits: signal.analysis.coldDigits.map(d => d.digit),
                distributionDeviation: signal.analysis.distributionDeviation,
                meanReversionPotential: signal.analysis.meanReversionPotential,
                momentumStrength: signal.analysis.momentumStrength,
            },
        };
    }

    /**
     * Load bot XML file
     */
    private async loadBotXML(botFile: string): Promise<string> {
        try {
            const response = await fetch(`/${botFile}`);
            if (!response.ok) {
                throw new Error(`Failed to load bot file: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`Failed to load ${botFile}:`, error);
            throw error;
        }
    }

    /**
     * Configure bot XML with signal parameters
     */
    private configureBotXML(xmlContent: string, config: RazielBotConfiguration): string {
        let configuredXML = xmlContent;

        try {
            console.log('🔧 Configuring Raziel Over Under bot XML with parameters:', {
                stake: config.stake,
                martingale: config.parameters.martingaleSplit,
                contractType: config.contractType,
                market: config.market,
                predictionBeforeLoss: config.parameters.predictionBeforeLoss,
                predictionAfterLoss: config.parameters.predictionAfterLoss,
            });

            // Parse XML to modify parameters
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

            // Check for parsing errors
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error(`XML parsing failed: ${parseError.textContent}`);
            }

            // Apply stake manager settings to XML first
            console.log('💰 Applying stake manager settings to XML...');
            const stakeManagerResult = stakeManager.applySettingsToXML(xmlDoc);
            console.log('✅ Stake manager application result:', stakeManagerResult);

            // Track configuration success
            const configResults = {
                market: false,
                contractType: false,
                initialStake: false,
                martingaleSplit: false,
                predictionBeforeLoss: false,
                predictionAfterLoss: false,
                purchaseType: false,
            };

            // Update market symbol (SYMBOL_LIST field)
            const symbolField = xmlDoc.querySelector('field[name="SYMBOL_LIST"]');
            if (symbolField) {
                symbolField.textContent = config.market;
                configResults.market = true;
                console.log(`✅ Updated market symbol to: ${config.market}`);
            } else {
                console.warn('❌ Could not find SYMBOL_LIST field');
            }

            // Update contract type (TYPE_LIST field)
            const contractField = xmlDoc.querySelector('field[name="TYPE_LIST"]');
            if (contractField) {
                contractField.textContent = config.contractType;
                configResults.contractType = true;
                console.log(`✅ Updated contract type to: ${config.contractType}`);
            } else {
                console.warn('❌ Could not find TYPE_LIST field');
            }

            // Update initial stake - Raziel Over Under uses specific block IDs
            const initialStakeBlock = xmlDoc.querySelector('block[id="TDv/W;dNI84TFbp}8X8="] field[name="NUM"]');
            if (initialStakeBlock) {
                initialStakeBlock.textContent = config.stake.toString();
                configResults.initialStake = true;
                console.log(`✅ Updated initial stake (Stake variable) to: ${config.stake}`);
            } else {
                console.warn('❌ Could not find initial stake block');
                // Try alternative method
                this.updateStakeWithFallback(xmlDoc, config.stake);
            }

            // Update initial stake variable (initalStake) - CRITICAL: Both stakes must match!
            const initalStakeBlock = xmlDoc.querySelector('block[id="9Z%4%dmqCp;/sSt8wGv#"] field[name="NUM"]');
            if (initalStakeBlock) {
                initalStakeBlock.textContent = config.stake.toString();
                console.log(`✅ Updated initalStake variable to: ${config.stake}`);
            } else {
                console.warn('❌ Could not find initalStake variable block');
            }

            // Update martingale split - Raziel Over Under uses specific block ID
            const martingaleBlock = xmlDoc.querySelector('block[id="Ib,Krc`nUJzn1KMo9)`A"] field[name="NUM"]');
            if (martingaleBlock) {
                const martingaleValue =
                    typeof config.parameters.martingaleSplit === 'number' ? config.parameters.martingaleSplit : 2.2;
                martingaleBlock.textContent = martingaleValue.toString();
                configResults.martingaleSplit = true;
                console.log(`✅ Updated martingale split to: ${martingaleValue}`);
            } else {
                console.warn('❌ Could not find martingale split block');
                // Try fallback method
                const martingaleValue =
                    typeof config.parameters.martingaleSplit === 'number' ? config.parameters.martingaleSplit : 2.2;
                this.updateMartingaleWithFallback(xmlDoc, martingaleValue);
            }

            // Update prediction before loss
            const predictionBeforeLossBlock = xmlDoc.querySelector(
                'block[id="~]Q~lGg)3FCGB95VKA`b"] field[name="NUM"]'
            );
            if (predictionBeforeLossBlock) {
                const predictionValue =
                    typeof config.parameters.predictionBeforeLoss === 'number'
                        ? config.parameters.predictionBeforeLoss
                        : 2;
                predictionBeforeLossBlock.textContent = predictionValue.toString();
                configResults.predictionBeforeLoss = true;
                console.log(`✅ Updated prediction before loss to: ${predictionValue}`);
            } else {
                console.warn('❌ Could not find prediction before loss block');
            }

            // Update prediction after loss
            const predictionAfterLossBlock = xmlDoc.querySelector('block[id="(6)D~Nlfu/PCG*s5!9Qy"] field[name="NUM"]');
            if (predictionAfterLossBlock) {
                const predictionValue =
                    typeof config.parameters.predictionAfterLoss === 'number'
                        ? config.parameters.predictionAfterLoss
                        : 3;
                predictionAfterLossBlock.textContent = predictionValue.toString();
                configResults.predictionAfterLoss = true;
                console.log(`✅ Updated prediction after loss to: ${predictionValue}`);
            } else {
                console.warn('❌ Could not find prediction after loss block');
            }

            // Update purchase type in before_purchase block
            const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
            purchaseFields.forEach(field => {
                field.textContent = config.contractType;
                configResults.purchaseType = true;
                console.log(`✅ Updated purchase type to: ${config.contractType}`);
            });

            // Serialize back to string
            const serializer = new XMLSerializer();
            configuredXML = serializer.serializeToString(xmlDoc);

            // Log configuration results
            const successCount = Object.values(configResults).filter(Boolean).length;
            const totalCount = Object.keys(configResults).length;

            console.log(
                `🔧 Raziel Over Under Configuration Results: ${successCount}/${totalCount} successful`,
                configResults
            );

            if (successCount < totalCount) {
                console.warn('⚠️ Some XML configurations failed - using string replacement fallback');
                configuredXML = this.configureXMLWithStringReplacement(configuredXML, config);
            } else {
                console.log('✅ Raziel Over Under XML configuration completed successfully');
            }

            // Validate the configuration
            this.validateXMLConfiguration(configuredXML, config);
        } catch (error) {
            console.warn('Failed to parse/modify Raziel Over Under XML, using string replacement fallback:', error);
            // Fall back to string replacement if XML parsing fails
            configuredXML = this.configureXMLWithStringReplacement(xmlContent, config);
        }

        return configuredXML;
    }

    /**
     * Validate that XML configuration was applied correctly
     */
    private validateXMLConfiguration(xmlContent: string, config: RazielBotConfiguration): void {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

            // Check stake values
            const stakeFields = xmlDoc.querySelectorAll('field[name="NUM"]');
            let stakeFound = false;
            let martingaleFound = false;

            stakeFields.forEach((field, index) => {
                const value = field.textContent;
                if (value === config.stake.toString()) {
                    stakeFound = true;
                    console.log(`✅ Stake validation: Found ${value} at position ${index}`);
                }
                if (value === config.parameters.martingaleSplit?.toString()) {
                    martingaleFound = true;
                    console.log(`✅ Martingale validation: Found ${value} at position ${index}`);
                }
            });

            if (!stakeFound) {
                console.warn(`❌ Stake validation failed: ${config.stake} not found in XML`);
            }
            if (!martingaleFound) {
                console.warn(`❌ Martingale validation failed: ${config.parameters.martingaleSplit} not found in XML`);
            }

            console.log('🔍 XML Validation Summary:', {
                stakeConfigured: stakeFound,
                martingaleConfigured: martingaleFound,
                expectedStake: config.stake,
                expectedMartingale: config.parameters.martingaleSplit,
            });
        } catch (error) {
            console.warn('XML validation failed:', error);
        }
    }

    /**
     * Fallback method to configure XML using string replacement
     */
    private configureXMLWithStringReplacement(xmlContent: string, config: RazielBotConfiguration): string {
        let configuredXML = xmlContent;

        try {
            console.log('🔄 Using string replacement fallback for XML configuration');

            // Replace market symbol
            configuredXML = configuredXML.replace(
                /<field name="SYMBOL_LIST">[^<]*<\/field>/,
                `<field name="SYMBOL_LIST">${config.market}</field>`
            );

            // Replace stake values - target the specific blocks
            // Update initial stake (first occurrence with value 2)
            configuredXML = configuredXML.replace(
                /(<block type="math_number" id="TDv\/W;dNI84TFbp}8X8=">[\s]*<field name="NUM">)2(<\/field>)/,
                `$1${config.stake}$2`
            );

            // Update initial stake variable (second occurrence with value 2) - CRITICAL: Both stakes must match!
            configuredXML = configuredXML.replace(
                /(<block type="math_number" id="9Z%4%dmqCp;\/sSt8wGv#">[\s]*<field name="NUM">)2(<\/field>)/,
                `$1${config.stake}$2`
            );

            // Update martingale split value
            const martingaleValue =
                typeof config.parameters.martingaleSplit === 'number' ? config.parameters.martingaleSplit : 2.2;
            configuredXML = configuredXML.replace(
                /(<block type="math_number" id="Ib,Krc`nUJzn1KMo9\)`A">[\s]*<field name="NUM">)2(<\/field>)/,
                `$1${martingaleValue}$2`
            );

            // Update prediction before loss
            const predictionBeforeLoss =
                typeof config.parameters.predictionBeforeLoss === 'number' ? config.parameters.predictionBeforeLoss : 2;
            configuredXML = configuredXML.replace(
                /(<block type="math_number" id="~\]Q~lGg\)3FCGB95VKA`b">[\s]*<field name="NUM">)2(<\/field>)/,
                `$1${predictionBeforeLoss}$2`
            );

            // Update prediction after loss
            const predictionAfterLoss =
                typeof config.parameters.predictionAfterLoss === 'number' ? config.parameters.predictionAfterLoss : 3;
            configuredXML = configuredXML.replace(
                /(<block type="math_number" id="\(6\)D~Nlfu\/PCG\*s5!9Qy">[\s]*<field name="NUM">)3(<\/field>)/,
                `$1${predictionAfterLoss}$2`
            );

            console.log('✅ String replacement configuration completed with values:', {
                stake: config.stake,
                initalStake: config.stake, // Both stakes now match
                martingale: martingaleValue,
                predictionBeforeLoss,
                predictionAfterLoss,
            });
        } catch (error) {
            console.warn('String replacement also failed:', error);
        }

        return configuredXML;
    }

    /**
     * Load configured bot into Deriv Bot Builder - USING RELIABLE LOAD MODAL METHOD
     */
    private async loadBotIntoBuilder(xmlContent: string, config: RazielBotConfiguration): Promise<void> {
        try {
            console.log('🤖 Loading Raziel Over Under bot into Deriv Bot Builder...');

            // Validate XML content
            if (!xmlContent || xmlContent.trim().length === 0) {
                throw new Error('XML content is empty or invalid');
            }

            // Method 1: Use load_modal.loadStrategyToBuilder (most reliable - used successfully elsewhere)
            if (window.load_modal && typeof window.load_modal.loadStrategyToBuilder === 'function') {
                console.log('📤 Loading bot via load_modal.loadStrategyToBuilder...');

                const botObject = {
                    id: `raziel-over-under-${Date.now()}`,
                    name: `Raziel Over Under - ${config.market} - ${config.contractType}`,
                    xml: xmlContent,
                    save_type: 'LOCAL',
                    timestamp: Date.now(),
                };

                await window.load_modal.loadStrategyToBuilder(botObject);
                console.log('✅ Bot loaded successfully via load_modal');
                this.showBotLoadedNotification();

                // Show user-friendly success message
                this.showSuccessNotification('Raziel Over Under bot loaded successfully into Bot Builder!');
                return;
            }

            // Method 2: Direct Blockly workspace injection (fallback)
            const blocklySuccess = await this.loadViaBlocklyWorkspace(xmlContent);
            if (blocklySuccess) {
                console.log('✅ Bot loaded successfully via Blockly workspace');
                this.showBotLoadedNotification();
                return;
            }

            // Method 3: File input simulation (fallback)
            const fileInputSuccess = await this.loadViaFileInputSimulation(xmlContent);
            if (fileInputSuccess) {
                console.log('✅ Bot loaded successfully via file input simulation');
                this.showBotLoadedNotification();
                return;
            }

            // Method 4: Download fallback if all methods fail
            console.warn('⚠️ All injection methods failed, falling back to download');
            this.createDownloadFallback(xmlContent, config);
            console.log('⚠️ Bot configured but requires manual import');
        } catch (error) {
            console.error('❌ Failed to load bot into builder:', error);
            this.createDownloadFallback(xmlContent, config);
            throw error;
        }
    }

    /**
     * Load bot from Free Bots section
     */
    private async loadBotFromFreeBots(xmlContent: string, config: RazielBotConfiguration): Promise<boolean> {
        try {
            console.log('🎯 Attempting to load via Free Bots section...');

            // Navigate to Free Bots tab (index 7)
            const switchTabEvent = new CustomEvent('switch.tab', {
                detail: { tab: 7 }, // FREE_BOTS is at index 7
                bubbles: true,
                cancelable: true,
            });
            window.dispatchEvent(switchTabEvent);

            // Also try direct dashboard store access if available
            if (typeof window !== 'undefined') {
                const windowGlobals = window as unknown as WindowGlobals;
                if (windowGlobals.dashboard_store?.setActiveTab) {
                    windowGlobals.dashboard_store.setActiveTab(7); // FREE_BOTS tab
                    console.log('✅ Switched to Free Bots tab via dashboard store');
                }
            }

            // Wait a moment for tab to load
            await new Promise(resolve => setTimeout(resolve, 500));

            // Try to find and load the Raziel Over Under bot
            const success = await this.loadSpecificBotFromFreeBots(xmlContent, config);
            return success;
        } catch (error) {
            console.warn('❌ Failed to load from Free Bots section:', error);
            return false;
        }
    }

    /**
     * Load specific bot from Free Bots section
     */
    private async loadSpecificBotFromFreeBots(xmlContent: string, config: RazielBotConfiguration): Promise<boolean> {
        try {
            // Create a bot object that matches the expected format
            const botObject: BotObject = {
                id: 'raziel-over-under-hot-cold-zone',
                filePath: config.botFile,
                title: 'Raziel Over Under (Hot/Cold Zone Configured)',
                xmlContent: xmlContent,
                save_type: 'LOCAL',
            };

            // Method 1: Use load modal if available
            if (typeof window !== 'undefined') {
                const windowGlobals = window as unknown as WindowGlobals;
                if (windowGlobals.load_modal?.loadStrategyToBuilder) {
                    console.log('📤 Loading Raziel Over Under Bot via load modal...');
                    await windowGlobals.load_modal.loadStrategyToBuilder(botObject);
                    console.log('✅ Raziel Over Under bot loaded successfully via load modal');
                    return true;
                }
            }

            // Method 2: Try load_modal_store
            if (typeof window !== 'undefined') {
                const windowGlobals = window as unknown as WindowGlobals;
                if (windowGlobals.load_modal_store?.loadStrategyToBuilder) {
                    console.log('📤 Loading via load modal store...');
                    await windowGlobals.load_modal_store.loadStrategyToBuilder(botObject);
                    console.log('✅ Bot loaded via load modal store');
                    return true;
                }
            }

            // Method 3: Dispatch event to load the bot
            const loadBotEvent = new CustomEvent('load.bot.from.freebots', {
                detail: {
                    bot: botObject,
                    source: 'raziel-hot-cold-zone-scanner',
                },
                bubbles: true,
                cancelable: true,
            });
            window.dispatchEvent(loadBotEvent);

            console.log('✅ Raziel Over Under bot loading event dispatched');
            return true;
        } catch (error) {
            console.warn('❌ Failed to load specific bot from Free Bots:', error);
            return false;
        }
    }

    /**
     * Fallback: Load directly to Bot Builder
     */
    private async loadDirectlyToBotBuilder(xmlContent: string): Promise<boolean> {
        try {
            console.log('🔄 Attempting direct Bot Builder loading...');

            // Navigate to Bot Builder tab (index 1)
            if (typeof window !== 'undefined') {
                const windowGlobals = window as unknown as WindowGlobals;
                if (windowGlobals.dashboard_store?.setActiveTab) {
                    windowGlobals.dashboard_store.setActiveTab(1); // BOT_BUILDER tab
                    console.log('✅ Switched to Bot Builder tab');
                }
            }

            // Wait for tab to load
            await new Promise(resolve => setTimeout(resolve, 500));

            // Try to load into Blockly workspace
            const blocklySuccess = this.loadIntoBlockly(xmlContent);
            if (blocklySuccess) {
                console.log('✅ Bot loaded directly to Bot Builder via Blockly');
                return true;
            }

            // Try alternative loading methods
            const alternativeSuccess = await this.tryAlternativeLoadingMethods(xmlContent);
            if (alternativeSuccess) {
                console.log('✅ Bot loaded via alternative method');
                return true;
            }

            console.log('⚠️ Direct Bot Builder loading partially successful');
            return false;
        } catch (error) {
            console.warn('❌ Failed to load directly to Bot Builder:', error);
            return false;
        }
    }

    /**
     * Load bot directly into Blockly workspace
     */
    private loadIntoBlockly(xmlContent: string): boolean {
        try {
            if (typeof window !== 'undefined') {
                const windowGlobals = window as unknown as WindowGlobals;
                const blockly = windowGlobals.Blockly;

                if (blockly?.getMainWorkspace) {
                    const workspace = blockly.getMainWorkspace();
                    if (workspace?.clear && blockly.Xml?.textToDom && blockly.Xml?.domToWorkspace) {
                        // Clear existing workspace
                        workspace.clear();

                        // Parse and load XML
                        const domXml = blockly.Xml.textToDom(xmlContent);
                        blockly.Xml.domToWorkspace(domXml, workspace);

                        console.log('✅ Bot loaded into Blockly workspace successfully');
                        return true;
                    } else {
                        console.warn('❌ Blockly workspace methods not available');
                        return false;
                    }
                } else {
                    console.warn('❌ Blockly getMainWorkspace not available');
                    return false;
                }
            } else {
                console.warn('❌ Window object not available');
                return false;
            }
        } catch (error) {
            console.warn('❌ Failed to load into Blockly:', error);
            return false;
        }
    }

    /**
     * Show notification that bot was loaded - DISABLED TO PREVENT DELAYS
     */
    private showBotLoadedNotification(): void {
        // Notification disabled to prevent trading delays
        return;
    }

    /**
     * Validate XML structure before loading
     */
    private async validateXMLBeforeLoading(xmlContent: string): Promise<void> {
        try {
            // Basic validation
            if (!xmlContent.includes('<xml')) {
                throw new Error('Invalid XML: Missing root XML element');
            }

            if (!xmlContent.includes('</xml>')) {
                throw new Error('Invalid XML: Missing closing XML tag');
            }

            // Parse XML to check for errors
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error(`XML parsing failed: ${parseError.textContent}`);
            }

            // Check for required elements
            const requiredElements = [
                'block[type="trade_definition"]',
                'field[name="SYMBOL_LIST"]',
                'field[name="TYPE_LIST"]',
            ];

            for (const selector of requiredElements) {
                if (!xmlDoc.querySelector(selector)) {
                    console.warn(`⚠️ Missing required element: ${selector}`);
                }
            }

            console.log('✅ XML validation passed');
        } catch (error) {
            console.error('❌ XML validation failed:', error);
            throw error;
        }
    }

    /**
     * Try alternative loading methods
     */
    private async tryAlternativeLoadingMethods(xmlContent: string): Promise<boolean> {
        try {
            console.log('🔄 Trying alternative loading methods...');

            // Method 1: Try to find and click import button
            const importButton = document.querySelector('input[type="file"][accept=".xml"]') as HTMLInputElement;
            if (importButton) {
                // Create a blob from XML content
                const blob = new Blob([xmlContent], { type: 'text/xml' });
                const file = new File([blob], 'raziel-over-under.xml', { type: 'text/xml' });

                // Create a DataTransfer object and add the file
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                importButton.files = dataTransfer.files;

                // Trigger change event
                const changeEvent = new Event('change', { bubbles: true });
                importButton.dispatchEvent(changeEvent);

                console.log('✅ XML file simulated via file input');
                return true;
            }

            // Method 2: Try to find workspace and inject XML directly
            const workspace = document.querySelector('.blocklyWorkspace, #blocklyDiv, [class*="workspace"]');
            if (workspace) {
                // Dispatch a custom event with XML content
                const injectEvent = new CustomEvent('inject.xml.content', {
                    detail: { xmlContent },
                    bubbles: true,
                });
                workspace.dispatchEvent(injectEvent);
                console.log('✅ XML injection event dispatched');
                return true;
            }

            console.log('⚠️ No alternative loading methods available');
            return false;
        } catch (error) {
            console.warn('❌ Alternative loading methods failed:', error);
            return false;
        }
    }

    /**
     * Dispatch bot loading events
     */
    private dispatchBotLoadingEvents(xmlContent: string, config: RazielBotConfiguration): void {
        try {
            // Dispatch multiple events for different listeners
            const events = [
                'load.raziel.bot',
                'load.fibonacci.bot',
                'load.hot.cold.bot',
                'bot.load.request',
                'xml.import.request',
            ];

            events.forEach(eventName => {
                const event = new CustomEvent(eventName, {
                    detail: {
                        xmlContent: xmlContent,
                        botName: 'Raziel Over Under',
                        market: config.market,
                        contractType: config.contractType,
                        barrier: config.barrier,
                        stake: config.stake,
                        prediction: config.prediction,
                        parameters: config.parameters,
                        source: 'raziel-bot-loader',
                        timestamp: Date.now(),
                    },
                    bubbles: true,
                    cancelable: true,
                });
                window.dispatchEvent(event);
            });

            console.log('✅ Bot loading events dispatched');
        } catch (error) {
            console.warn('❌ Failed to dispatch bot loading events:', error);
        }
    }

    /**
     * Show manual loading instructions
     */
    private showManualLoadingInstructions(xmlContent: string): void {
        try {
            // Create a downloadable XML file
            const blob = new Blob([xmlContent], { type: 'text/xml' });
            const url = URL.createObjectURL(blob);

            // Create notification with download link
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                z-index: 10002;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                max-width: 400px;
                text-align: center;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            `;

            notification.innerHTML = `
                <div style="font-weight: 700; margin-bottom: 12px; font-size: 16px;">
                    🤖 Raziel Bot Ready
                </div>
                <div style="margin-bottom: 16px; line-height: 1.4; opacity: 0.9;">
                    The bot has been configured with your signal parameters. 
                    Click below to download and manually import it.
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <a href="${url}" download="raziel-over-under-configured.xml" 
                       style="background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; 
                              border-radius: 6px; text-decoration: none; font-weight: 600;
                              border: 1px solid rgba(255,255,255,0.3);">
                        📥 Download Bot
                    </a>
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="background: rgba(255,255,255,0.1); color: white; padding: 8px 16px; 
                                   border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); 
                                   cursor: pointer; font-weight: 600;">
                        ✕ Close
                    </button>
                </div>
            `;

            document.body.appendChild(notification);

            // Auto-remove after 30 seconds
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
                URL.revokeObjectURL(url);
            }, 30000);

            console.log('✅ Manual loading instructions displayed');
        } catch (error) {
            console.warn('❌ Failed to show manual loading instructions:', error);
        }
    }

    /**
     * Show bot loading error
     */
    private showBotLoadingError(error: Error): void {
        try {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                color: white;
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                z-index: 10001;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 13px;
                font-weight: 600;
                max-width: 350px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            `;

            notification.innerHTML = `
                <div style="font-weight: 700; margin-bottom: 6px;">❌ Bot Loading Failed</div>
                <div style="font-size: 11px; opacity: 0.9; line-height: 1.3; margin-bottom: 8px;">
                    ${error.message || 'Unknown error occurred during bot loading'}
                </div>
                <div style="font-size: 10px; opacity: 0.7;">
                    Please try refreshing the page or contact support if the issue persists.
                </div>
            `;

            document.body.appendChild(notification);

            // Auto-remove after 8 seconds
            setTimeout(() => notification.remove(), 8000);
        } catch (err) {
            console.warn('❌ Failed to show error notification:', err);
        }
    }

    /**
     * Show debug summary notification
     */
    private showDebugSummary(debugInfo: any): void {
        const { success, totalDuration, steps } = debugInfo;
        const successCount = steps.filter((s: any) => s.status === 'success').length;
        const errorCount = steps.filter((s: any) => s.status === 'error').length;
        const warningCount = steps.filter((s: any) => s.status === 'warning').length;

        // Create debug notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${success ? '#10b981' : '#ef4444'};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 10002;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 400px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;

        notification.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                <span>${success ? '✅' : '❌'}</span>
                <span>Bot Loading ${success ? 'Complete' : 'Failed'}</span>
            </div>
            <div style="font-size: 12px; opacity: 0.9; line-height: 1.4;">
                <div>Duration: ${totalDuration}ms</div>
                <div>Steps: ${successCount} success, ${warningCount} warnings, ${errorCount} errors</div>
                ${!success ? `<div style="margin-top: 4px; color: #fecaca;">Check console for details</div>` : ''}
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    /**
     * Automatically start the bot after loading
     */
    private async autoStartBot(): Promise<void> {
        try {
            console.log('🚀 Auto-starting Raziel Over Under bot...');

            // Wait a moment for bot to fully load
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Method 1: Try to find and click the Run button
            const runButton = document.querySelector('button[data-testid="run-button"]') as HTMLButtonElement;
            if (runButton && !runButton.disabled) {
                runButton.click();
                console.log('✅ Bot auto-started via Run button');
                this.showAutoStartSuccess();
                return;
            }

            // Method 2: Try alternative Run button selectors
            const alternativeRunButtons = [
                'button[class*="run"]:not([disabled])',
                'button[class*="start"]:not([disabled])',
                '.run-panel button:not([disabled])',
                '.bot-controls button[class*="run"]:not([disabled])',
                'button:not([disabled])',
            ];

            for (const selector of alternativeRunButtons) {
                const buttons = document.querySelectorAll(selector) as NodeListOf<HTMLButtonElement>;
                for (const button of buttons) {
                    const buttonText = button.textContent?.toLowerCase() || '';
                    if (buttonText.includes('run') || buttonText.includes('start')) {
                        button.click();
                        console.log(`✅ Bot auto-started via selector: ${selector}`);
                        this.showAutoStartSuccess();
                        return;
                    }
                }
            }

            // Method 3: Dispatch run events
            const runEvents = ['bot.run', 'bot.start', 'run.bot', 'start.trading', 'execute.bot'];

            runEvents.forEach(eventName => {
                const runEvent = new CustomEvent(eventName, {
                    detail: { source: 'raziel-auto-start', timestamp: Date.now() },
                    bubbles: true,
                    cancelable: true,
                });
                window.dispatchEvent(runEvent);
            });

            // Method 4: Try keyboard shortcuts
            const shortcuts = [
                { key: 'F2', code: 'F2', keyCode: 113 }, // Common Run shortcut
                { key: 'F5', code: 'F5', keyCode: 116 }, // Alternative Run shortcut
                { key: 'Enter', code: 'Enter', keyCode: 13, ctrlKey: true }, // Ctrl+Enter
            ];

            shortcuts.forEach(shortcut => {
                const keyEvent = new KeyboardEvent('keydown', {
                    key: shortcut.key,
                    code: shortcut.code,
                    keyCode: shortcut.keyCode,
                    which: shortcut.keyCode,
                    ctrlKey: shortcut.ctrlKey || false,
                    bubbles: true,
                });
                document.dispatchEvent(keyEvent);
            });

            console.log('🔄 Auto-start attempted via multiple methods');
            this.showAutoStartAttempted();
        } catch (error) {
            console.warn('❌ Auto-start failed, manual start required:', error);
            this.showAutoStartFailed();
        }
    }

    /**
     * Show auto-start success notification
     */
    private showAutoStartSuccess(): void {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            font-weight: 600;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        notification.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 4px;">🚀 Bot Started!</div>
            <div style="font-size: 11px; opacity: 0.9;">Raziel Over Under bot is now running</div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    /**
     * Show auto-start attempted notification
     */
    private showAutoStartAttempted(): void {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            font-weight: 600;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        notification.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 4px;">⚡ Auto-Start Attempted</div>
            <div style="font-size: 11px; opacity: 0.9;">Please manually click Run if needed</div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }

    /**
     * Show auto-start failed notification
     */
    private showAutoStartFailed(): void {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            font-weight: 600;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        notification.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 4px;">⚠️ Manual Start Required</div>
            <div style="font-size: 11px; opacity: 0.9;">Please click the Run button to start trading</div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 6000);
    }

    /**
     * Get available Raziel bot variants
     */
    public getAvailableRazielBots(): string[] {
        return [
            'Raziel Over Under.xml', // Primary bot for Raziel button
            'CFX-EvenOdd.xml',
            'CFX-RiseFall.xml',
            'Raziel-Over-Under-Enhanced.xml',
            'Raziel-Over-Under-Base.xml',
            'Raziel-Over-Under-Step1.xml',
            'Raziel-Over-Under-Step2.xml',
            'Raziel-Over-Under-Step3.xml',
            'Raziel-Over-Under-Step4.xml',
        ];
    }

    /**
     * Load bot via Blockly workspace (most reliable method)
     */
    private async loadViaBlocklyWorkspace(xmlContent: string): Promise<boolean> {
        try {
            console.log('🎯 Loading via Blockly workspace...');

            if (typeof window !== 'undefined') {
                const windowGlobals = window as unknown as WindowGlobals;
                const blockly = windowGlobals.Blockly;

                if (blockly?.getMainWorkspace) {
                    const workspace = blockly.getMainWorkspace();
                    if (workspace?.clear && blockly.Xml?.textToDom && blockly.Xml?.domToWorkspace) {
                        // Clear existing workspace
                        workspace.clear();

                        // Parse and load XML
                        const domXml = blockly.Xml.textToDom(xmlContent);
                        blockly.Xml.domToWorkspace(domXml, workspace);

                        console.log('✅ Bot loaded into Blockly workspace successfully');
                        return true;
                    }
                }
            }

            console.warn('❌ Blockly workspace not available');
            return false;
        } catch (error) {
            console.warn('❌ Failed to load via Blockly workspace:', error);
            return false;
        }
    }

    /**
     * Load bot via file input simulation (fallback method)
     */
    private async loadViaFileInputSimulation(xmlContent: string): Promise<boolean> {
        try {
            console.log('📁 Loading via file input simulation...');

            // Find file input element
            const fileInput = document.querySelector('input[type="file"][accept=".xml"]') as HTMLInputElement;
            if (!fileInput) {
                console.warn('❌ File input not found');
                return false;
            }

            // Create a blob from XML content
            const blob = new Blob([xmlContent], { type: 'text/xml' });
            const file = new File([blob], 'raziel-over-under.xml', { type: 'text/xml' });

            // Create a DataTransfer object and add the file
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;

            // Trigger change event
            const changeEvent = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(changeEvent);

            console.log('✅ Bot loaded via file input simulation');
            return true;
        } catch (error) {
            console.warn('❌ Failed to load via file input simulation:', error);
            return false;
        }
    }

    /**
     * Show user-friendly success notification
     */
    private showSuccessNotification(message: string): void {
        try {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(16, 185, 129, 0.4);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                max-width: 350px;
                animation: slideInRight 0.3s ease-out;
            `;

            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="font-size: 18px;">✅</div>
                    <div>${message}</div>
                </div>
            `;

            // Add animation keyframes
            if (!document.querySelector('#bot-loader-animations')) {
                const style = document.createElement('style');
                style.id = 'bot-loader-animations';
                style.textContent = `
                    @keyframes slideInRight {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(notification);

            // Auto-remove after 4 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideInRight 0.3s ease-out reverse';
                    setTimeout(() => notification.remove(), 300);
                }
            }, 4000);
        } catch (error) {
            console.warn('Failed to show success notification:', error);
        }
    }

    /**
     * Create download fallback when all loading methods fail
     */
    private createDownloadFallback(xmlContent: string, config: RazielBotConfiguration): void {
        try {
            console.log('💾 Creating download fallback...');

            // Create a downloadable XML file
            const blob = new Blob([xmlContent], { type: 'text/xml' });
            const url = URL.createObjectURL(blob);

            // Create notification with download link
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                z-index: 10002;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                max-width: 400px;
                text-align: center;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            `;

            notification.innerHTML = `
                <div style="font-weight: 700; margin-bottom: 12px; font-size: 16px;">
                    🤖 Raziel Bot Ready
                </div>
                <div style="margin-bottom: 16px; line-height: 1.4; opacity: 0.9;">
                    The bot has been configured with your signal parameters. 
                    Click below to download and manually import it.
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <a href="${url}" download="raziel-over-under-configured.xml" 
                       style="background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; 
                              border-radius: 6px; text-decoration: none; font-weight: 600;
                              border: 1px solid rgba(255,255,255,0.3);">
                        📥 Download Bot
                    </a>
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="background: rgba(255,255,255,0.1); color: white; padding: 8px 16px; 
                                   border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); 
                                   cursor: pointer; font-weight: 600;">
                        ✕ Close
                    </button>
                </div>
            `;

            document.body.appendChild(notification);

            // Auto-remove after 30 seconds
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
                URL.revokeObjectURL(url);
            }, 30000);

            console.log('✅ Download fallback created successfully');
        } catch (error) {
            console.warn('❌ Failed to create download fallback:', error);
        }
    }

    /**
     * Fallback method to update stake using alternative selectors
     */
    private updateStakeWithFallback(xmlDoc: Document, stake: number): void {
        // Try to find stake blocks by variable name
        const stakeVariableBlocks = xmlDoc.querySelectorAll('field[name="VAR"]');

        stakeVariableBlocks.forEach(varField => {
            if (varField.textContent === 'Stake' || varField.getAttribute('id') === 'y)BE|l7At6oT)ur0Dsw?') {
                const block = varField.closest('block');
                const numField = block?.querySelector(
                    'value[name="VALUE"] block[type="math_number"] field[name="NUM"]'
                );
                if (numField) {
                    numField.textContent = stake.toString();
                    console.log(`✅ Updated stake via fallback method: ${stake}`);
                }
            }
        });
    }

    /**
     * Fallback method to update martingale using alternative selectors
     */
    private updateMartingaleWithFallback(xmlDoc: Document, martingale: number): void {
        // Try to find martingale blocks by variable name
        const martingaleVariableBlocks = xmlDoc.querySelectorAll('field[name="VAR"]');

        martingaleVariableBlocks.forEach(varField => {
            if (varField.textContent === 'Martingale split' || varField.getAttribute('id') === '.5ELQ4[J.e4czk,qPqKM') {
                const block = varField.closest('block');
                const numField = block?.querySelector(
                    'value[name="VALUE"] block[type="math_number"] field[name="NUM"]'
                );
                if (numField) {
                    const martingaleValue = typeof martingale === 'number' ? martingale : 2.2;
                    numField.textContent = martingaleValue.toString();
                    console.log(`✅ Updated martingale via fallback method: ${martingaleValue}`);
                }
            }
        });
    }
}

export const razielBotLoaderService = new RazielBotLoaderService();
