/**
 * Raziel Entry Point Bot Loader Service
 * Handles automatic loading and configuration of the Raziel Over Under Entry Point bot
 * when a digit is clicked in the Zeus AI analysis tool
 */

import { DBOT_TABS } from '../constants/bot-contents';

interface WindowGlobals {
    dashboard_store?: {
        setActiveTab: (tabIndex: number) => void;
    };
    load_modal?: {
        loadStrategyToBuilder: (strategy: any) => Promise<void>;
    };
    Blockly?: any;
}

export class RazielEntryPointBotLoaderService {
    private static instance: RazielEntryPointBotLoaderService;

    public static getInstance(): RazielEntryPointBotLoaderService {
        if (!RazielEntryPointBotLoaderService.instance) {
            RazielEntryPointBotLoaderService.instance = new RazielEntryPointBotLoaderService();
        }
        return RazielEntryPointBotLoaderService.instance;
    }

    /**
     * Load and configure the Raziel Entry Point bot with the specified digit
     */
    public async loadBotWithEntryPoint(entryDigit: number): Promise<void> {
        try {
            console.log(`🎯 Loading Raziel Entry Point bot with entry digit: ${entryDigit}`);

            // Step 1: Fetch the bot XML
            const botXml = await this.fetchBotXml();
            if (!botXml) {
                throw new Error('Failed to fetch Raziel Entry Point bot XML');
            }

            // Step 2: Configure the bot with the entry point digit
            const configuredXml = this.configureBotWithEntryPoint(botXml, entryDigit);

            // Step 3: Switch to Bot Builder tab
            await this.switchToBotBuilder();

            // Step 4: Load the configured bot into the workspace
            await this.loadBotIntoWorkspace(configuredXml, entryDigit);

            console.log(`✅ Raziel Entry Point bot loaded and configured with digit ${entryDigit}`);

            // Step 5: Show success notification
            this.showSuccessNotification(entryDigit);
        } catch (error) {
            console.error('❌ Error loading Raziel Entry Point bot:', error);
            this.showErrorNotification(error.message);
        }
    }

    /**
     * Fetch the Raziel Over Under Entry Point bot XML
     */
    private async fetchBotXml(): Promise<string | null> {
        try {
            const response = await fetch('/Raziel Over Under Entry Point.xml');
            if (!response.ok) {
                throw new Error(`Failed to fetch bot: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            console.error('Error fetching bot XML:', error);
            return null;
        }
    }

    /**
     * Configure the bot XML with the specified entry point digit
     */
    private configureBotWithEntryPoint(xmlContent: string, entryDigit: number): string {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

            // Find and update the Entry Point Digit variable
            const variables = xmlDoc.getElementsByTagName('variable');
            for (let i = 0; i < variables.length; i++) {
                const variable = variables[i];
                if (variable.getAttribute('id') === 'entryPoint' || variable.textContent === 'Entry Point Digit') {
                    // This variable will be set in the initialization block
                    console.log('✅ Found Entry Point Digit variable');
                    break;
                }
            }

            // Find initialization blocks and set the entry point digit
            const blocks = xmlDoc.getElementsByTagName('block');
            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i];

                // Look for variable set blocks in initialization
                if (block.getAttribute('type') === 'variables_set') {
                    const field = block.querySelector('field[name="VAR"]');
                    if (field && field.getAttribute('id') === 'entryPoint') {
                        // Find or create the value block for this variable
                        let valueBlock = block.querySelector('value[name="VALUE"]');
                        if (!valueBlock) {
                            valueBlock = xmlDoc.createElement('value');
                            valueBlock.setAttribute('name', 'VALUE');
                            block.appendChild(valueBlock);
                        }

                        // Clear existing content and add new number block
                        valueBlock.innerHTML = '';
                        const numberBlock = xmlDoc.createElement('block');
                        numberBlock.setAttribute('type', 'math_number');
                        numberBlock.setAttribute('id', `entry_digit_${Date.now()}`);

                        const numberField = xmlDoc.createElement('field');
                        numberField.setAttribute('name', 'NUM');
                        numberField.textContent = entryDigit.toString();

                        numberBlock.appendChild(numberField);
                        valueBlock.appendChild(numberBlock);

                        console.log(`✅ Set entry point digit to ${entryDigit}`);
                        break;
                    }
                }
            }

            // Return the modified XML
            const serializer = new XMLSerializer();
            return serializer.serializeToString(xmlDoc);
        } catch (error) {
            console.error('Error configuring bot XML:', error);
            return xmlContent; // Return original if configuration fails
        }
    }

    /**
     * Switch to the Bot Builder tab
     */
    private async switchToBotBuilder(): Promise<void> {
        try {
            // Method 1: Use dashboard store if available
            const windowGlobals = window as unknown as WindowGlobals;
            if (windowGlobals.dashboard_store?.setActiveTab) {
                windowGlobals.dashboard_store.setActiveTab(DBOT_TABS.BOT_BUILDER);
                console.log('✅ Switched to Bot Builder tab via dashboard store');
                return;
            }

            // Method 2: Dispatch custom event
            const switchTabEvent = new CustomEvent('switch.tab', {
                detail: { tab: DBOT_TABS.BOT_BUILDER },
                bubbles: true,
                cancelable: true,
            });
            document.dispatchEvent(switchTabEvent);
            console.log('✅ Dispatched switch tab event for Bot Builder');

            // Small delay to ensure tab switch completes
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Error switching to Bot Builder tab:', error);
        }
    }

    /**
     * Load the configured bot into the Blockly workspace
     */
    private async loadBotIntoWorkspace(xmlContent: string, entryDigit: number): Promise<void> {
        try {
            const windowGlobals = window as unknown as WindowGlobals;

            // Method 1: Use load_modal if available
            if (windowGlobals.load_modal?.loadStrategyToBuilder) {
                const strategy = {
                    id: `raziel-entry-point-${entryDigit}-${Date.now()}`,
                    name: `Raziel Entry Point Bot (Digit ${entryDigit})`,
                    xml: xmlContent,
                    save_type: 'LOCAL',
                };

                await windowGlobals.load_modal.loadStrategyToBuilder(strategy);
                console.log('✅ Bot loaded via load_modal');
                return;
            }

            // Method 2: Direct Blockly workspace loading
            if (windowGlobals.Blockly) {
                const workspace = windowGlobals.Blockly.getMainWorkspace();
                if (workspace) {
                    // Clear existing workspace
                    workspace.clear();

                    // Parse and load the XML
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
                    windowGlobals.Blockly.Xml.domToWorkspace(xmlDoc.documentElement, workspace);

                    console.log('✅ Bot loaded directly into Blockly workspace');
                    return;
                }
            }

            throw new Error('No available method to load bot into workspace');
        } catch (error) {
            console.error('Error loading bot into workspace:', error);
            throw error;
        }
    }

    /**
     * Show success notification
     */
    private showSuccessNotification(entryDigit: number): void {
        try {
            // Create and show a success notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                max-width: 400px;
                animation: slideInRight 0.3s ease-out;
            `;

            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 20px;">🎯</div>
                    <div>
                        <div style="font-weight: 600; margin-bottom: 4px;">Bot Loaded Successfully!</div>
                        <div style="opacity: 0.9; font-size: 13px;">
                            Raziel Entry Point bot configured with digit ${entryDigit}
                        </div>
                    </div>
                </div>
            `;

            // Add animation keyframes
            if (!document.getElementById('raziel-bot-animations')) {
                const style = document.createElement('style');
                style.id = 'raziel-bot-animations';
                style.textContent = `
                    @keyframes slideInRight {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes slideOutRight {
                        from { transform: translateX(0); opacity: 1; }
                        to { transform: translateX(100%); opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(notification);

            // Auto-remove after 4 seconds
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 4000);
        } catch (error) {
            console.error('Error showing success notification:', error);
        }
    }

    /**
     * Show error notification
     */
    private showErrorNotification(message: string): void {
        try {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(239, 68, 68, 0.3);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                max-width: 400px;
                animation: slideInRight 0.3s ease-out;
            `;

            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 20px;">❌</div>
                    <div>
                        <div style="font-weight: 600; margin-bottom: 4px;">Error Loading Bot</div>
                        <div style="opacity: 0.9; font-size: 13px;">${message}</div>
                    </div>
                </div>
            `;

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
        } catch (error) {
            console.error('Error showing error notification:', error);
        }
    }
}

// Export singleton instance
export const razielEntryPointBotLoader = RazielEntryPointBotLoaderService.getInstance();
