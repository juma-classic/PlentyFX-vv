/**
 * PATEL Bot Loader Service - UPDATED TO USE RAZIEL OVER UNDER
 * Loads the Raziel Over Under.xml bot with Patel-specific parameters
 */

import { stakeManager } from './stake-manager.service';

class PatelBotLoaderService {
    private readonly PATEL_BOT_FILE = 'Raziel Over Under.xml'; // Now uses same bot as Raziel
    private isLoading = false;

    /**
     * Load Raziel Over Under.xml bot with Patel digit-specific configuration
     * This will actually load the bot into Bot Builder with Patel parameters
     */
    async loadPatelBotForDigit(digit: number, market: string = 'R_50'): Promise<void> {
        if (this.isLoading) {
            console.log('🔄 PATEL bot loading already in progress...');
            return;
        }

        this.isLoading = true;
        const startTime = performance.now();

        try {
            console.log(`🎯 Loading PATEL bot (Raziel Over Under) for digit ${digit}...`);

            // Get stake manager settings
            const stakeSettings = stakeManager.getSettings();

            // Use same prediction logic as Raziel: 2/7 → 3/6
            let predictionBeforeLoss: number;
            let predictionAfterLoss: number;

            // Determine OVER or UNDER based on digit (same logic for all digits)
            // For consistency with Raziel, we'll use OVER for most cases
            const useOver = true; // Patel typically uses OVER predictions

            if (useOver) {
                predictionBeforeLoss = 2; // OVER 2
                predictionAfterLoss = 3; // OVER 3
            } else {
                predictionBeforeLoss = 7; // UNDER 7
                predictionAfterLoss = 6; // UNDER 6
            }

            console.log(
                `📊 Patel Digit ${digit}: Using same parameters as Raziel - Before: ${predictionBeforeLoss}, After: ${predictionAfterLoss}`
            );

            // Load and configure the Raziel Over Under bot with Patel parameters
            const botXML = await this.loadBotXML();
            const configuredXML = this.configureBotXMLForPatel(botXML, {
                digit,
                market,
                predictionBeforeLoss,
                predictionAfterLoss,
                stake: stakeSettings.stake,
                martingale: stakeSettings.martingale,
                contractType: useOver ? 'DIGITOVER' : 'DIGITUNDER',
            });

            // Load bot into Deriv Bot Builder
            await this.loadBotIntoBuilder(configuredXML, digit);

            const loadTime = performance.now() - startTime;
            console.log(`✅ PATEL bot (Raziel Over Under) loaded for digit ${digit} in ${loadTime.toFixed(0)}ms`);

            // Show success notification
            setTimeout(() => this.showPatelNotification(digit, predictionBeforeLoss, predictionAfterLoss), 100);
        } catch (error) {
            console.error('❌ Failed to load PATEL bot (Raziel Over Under):', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Load bot XML from public directory
     */
    private async loadBotXML(): Promise<string> {
        try {
            const response = await fetch(`/${this.PATEL_BOT_FILE}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${this.PATEL_BOT_FILE}: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`❌ Error loading ${this.PATEL_BOT_FILE}:`, error);
            throw error;
        }
    }

    /**
     * Configure Raziel Over Under bot XML with Patel-specific parameters
     * Now uses same parameters as Raziel: 2/7 → 3/6
     */
    private configureBotXMLForPatel(
        xmlContent: string,
        config: {
            digit: number;
            market: string;
            predictionBeforeLoss: number;
            predictionAfterLoss: number;
            stake: number;
            martingale: number;
            contractType: string;
        }
    ): string {
        try {
            console.log('🔧 Configuring Raziel Over Under bot XML with Patel parameters:', config);

            // Parse XML to modify parameters
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

            // Check for parsing errors
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error(`XML parsing failed: ${parseError.textContent}`);
            }

            // Apply stake manager settings first
            console.log('💰 Applying stake manager settings to XML...');
            const stakeManagerResult = stakeManager.applySettingsToXML(xmlDoc);
            console.log('✅ Stake manager application result:', stakeManagerResult);

            // Update market symbol (SYMBOL_LIST field)
            const symbolField = xmlDoc.querySelector('field[name="SYMBOL_LIST"]');
            if (symbolField) {
                symbolField.textContent = config.market;
                console.log(`✅ Updated market symbol to: ${config.market}`);
            }

            // Update contract type based on configuration
            const contractField = xmlDoc.querySelector('field[name="TYPE_LIST"]');
            if (contractField) {
                contractField.textContent = config.contractType;
                console.log(`✅ Updated contract type to: ${config.contractType}`);
            }

            // Update prediction before loss - Raziel Over Under uses specific block ID
            const predictionBeforeLossBlock = xmlDoc.querySelector(
                'block[id="~]Q~lGg)3FCGB95VKA`b"] field[name="NUM"]'
            );
            if (predictionBeforeLossBlock) {
                predictionBeforeLossBlock.textContent = config.predictionBeforeLoss.toString();
                console.log(`✅ Updated prediction before loss to: ${config.predictionBeforeLoss}`);
            }

            // Update prediction after loss
            const predictionAfterLossBlock = xmlDoc.querySelector('block[id="(6)D~Nlfu/PCG*s5!9Qy"] field[name="NUM"]');
            if (predictionAfterLossBlock) {
                predictionAfterLossBlock.textContent = config.predictionAfterLoss.toString();
                console.log(`✅ Updated prediction after loss to: ${config.predictionAfterLoss}`);
            }

            // Serialize back to string
            const serializer = new XMLSerializer();
            return serializer.serializeToString(xmlDoc);
        } catch (error) {
            console.error('❌ Error configuring Patel bot XML:', error);
            throw error;
        }
    }

    /**
     * Load bot into Deriv Bot Builder - USING RELIABLE LOAD MODAL METHOD
     */
    private async loadBotIntoBuilder(xmlContent: string, digit: number): Promise<void> {
        try {
            console.log(`🤖 Loading Patel bot (Raziel Over Under) for digit ${digit} into Deriv Bot Builder...`);

            // Validate XML content
            if (!xmlContent || xmlContent.trim().length === 0) {
                throw new Error('XML content is empty or invalid');
            }

            // Method 1: Use load_modal.loadStrategyToBuilder (most reliable - used successfully elsewhere)
            if (window.load_modal && typeof window.load_modal.loadStrategyToBuilder === 'function') {
                console.log('📤 Loading Patel bot via load_modal.loadStrategyToBuilder...');

                const botObject = {
                    id: `patel-digit-${digit}-${Date.now()}`,
                    name: `Patel Signals - Digit ${digit} - Raziel Over Under`,
                    xml: xmlContent,
                    save_type: 'LOCAL',
                    timestamp: Date.now(),
                };

                await window.load_modal.loadStrategyToBuilder(botObject);
                console.log('✅ Patel bot loaded successfully via load_modal');

                // Show user-friendly success message
                this.showSuccessNotification(
                    `Patel Signals bot for digit ${digit} loaded successfully into Bot Builder!`
                );
                return;
            }

            // Method 2: Try Blockly workspace (fallback)
            await this.loadViaBlockly(xmlContent);
            console.log('✅ Patel bot loaded successfully via Blockly workspace');
            return;
        } catch (error) {
            console.error('❌ Failed to load Patel bot into builder:', error);

            // Fallback: Create download if all methods fail
            this.createDownloadFallback(xmlContent, digit);
            throw error;
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
                background: linear-gradient(135deg, #8b5cf6, #a855f7);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                max-width: 350px;
                animation: slideInRight 0.3s ease-out;
            `;

            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="font-size: 18px;">🎯</div>
                    <div>${message}</div>
                </div>
            `;

            // Add animation keyframes if not already present
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
     * Create download fallback when injection fails
     */
    private createDownloadFallback(xmlContent: string, digit: number): void {
        try {
            console.log('💾 Creating download fallback for Patel bot...');

            const blob = new Blob([xmlContent], { type: 'text/xml' });
            const url = URL.createObjectURL(blob);
            const filename = `patel-digit-${digit}-raziel-over-under.xml`;

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log(`📥 Patel bot XML downloaded as: ${filename}`);
        } catch (error) {
            console.error('❌ Failed to create download fallback:', error);
        }
    }

    /**
     * Load via Blockly workspace
     */
    private async loadViaBlockly(xmlContent: string): Promise<void> {
        const blockly = (window as any).Blockly;
        if (blockly?.getMainWorkspace) {
            const workspace = blockly.getMainWorkspace();
            if (workspace?.clear && blockly.Xml?.textToDom && blockly.Xml?.domToWorkspace) {
                workspace.clear();
                const domXml = blockly.Xml.textToDom(xmlContent);
                blockly.Xml.domToWorkspace(domXml, workspace);
                console.log('✅ Bot loaded via Blockly workspace');
                return;
            }
        }
        throw new Error('Blockly method not available');
    }

    /**
     * Success notification for PATEL bot using Raziel Over Under
     * Now shows same parameters as Raziel: 2/7 → 3/6
     */
    private showPatelNotification(digit: number, predictionBeforeLoss: number, predictionAfterLoss: number): void {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #8b5cf6, #a855f7);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            max-width: 320px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            animation: slideInRight 0.3s ease-out;
        `;

        const configDisplay = `Before: ${predictionBeforeLoss}, After: ${predictionAfterLoss}`;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 24px;">🟣</div>
                <div>
                    <div style="font-weight: 600; margin-bottom: 4px;">
                        PATEL Bot Loaded!
                    </div>
                    <div style="font-size: 12px; opacity: 0.9;">
                        Digit ${digit} • Same as Raziel
                    </div>
                    <div style="font-size: 11px; opacity: 0.7; margin-top: 2px;">
                        Using Raziel Over Under • Config: ${configDisplay}
                    </div>
                </div>
            </div>
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Export singleton instance
export const patelBotLoaderService = new PatelBotLoaderService();
