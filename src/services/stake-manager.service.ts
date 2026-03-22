/**
 * Global Stake Manager Service
 * Manages user-defined stake and martingale settings across the entire application
 */

export interface StakeSettings {
    stake: number;
    martingale: number;
    isCustom: boolean;
    timestamp: number;
}

class StakeManagerService {
    private static instance: StakeManagerService;
    private readonly STORAGE_KEY = 'zeus_trading_hub_stake_settings';
    private readonly DEFAULT_STAKE = 0.42;
    private readonly DEFAULT_MARTINGALE = 2.0;

    private currentSettings: StakeSettings;
    private listeners: Array<(settings: StakeSettings) => void> = [];

    private constructor() {
        this.currentSettings = this.loadSettings();
    }

    public static getInstance(): StakeManagerService {
        if (!StakeManagerService.instance) {
            StakeManagerService.instance = new StakeManagerService();
        }
        return StakeManagerService.instance;
    }

    /**
     * Load settings from localStorage or use defaults
     */
    private loadSettings(): StakeSettings {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Check if settings are less than 24 hours old
                const isValid = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
                if (isValid && parsed.stake && parsed.martingale) {
                    return parsed;
                }
            }
        } catch (error) {
            console.warn('Failed to load stake settings:', error);
        }

        return {
            stake: this.DEFAULT_STAKE,
            martingale: this.DEFAULT_MARTINGALE,
            isCustom: false,
            timestamp: Date.now(),
        };
    }

    /**
     * Save settings to localStorage
     */
    private saveSettings(): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentSettings));
        } catch (error) {
            console.warn('Failed to save stake settings:', error);
        }
    }

    /**
     * Get current stake value
     */
    public getStake(): number {
        return this.currentSettings.stake;
    }

    /**
     * Get current martingale multiplier
     */
    public getMartingale(): number {
        return this.currentSettings.martingale;
    }

    /**
     * Get all current settings
     */
    public getSettings(): StakeSettings {
        return { ...this.currentSettings };
    }

    /**
     * Update stake and martingale settings
     */
    public updateSettings(stake: number, martingale: number): void {
        this.currentSettings = {
            stake: Math.max(0.01, stake), // Minimum stake of 0.01
            martingale: Math.max(1.0, martingale), // Minimum martingale of 1.0
            isCustom: true,
            timestamp: Date.now(),
        };

        this.saveSettings();
        this.notifyListeners();

        console.log('💰 Stake settings updated:', {
            stake: this.currentSettings.stake,
            martingale: this.currentSettings.martingale,
        });
    }

    /**
     * Reset to default settings
     */
    public resetToDefaults(): void {
        this.currentSettings = {
            stake: this.DEFAULT_STAKE,
            martingale: this.DEFAULT_MARTINGALE,
            isCustom: false,
            timestamp: Date.now(),
        };

        this.saveSettings();
        this.notifyListeners();

        console.log('🔄 Stake settings reset to defaults');
    }

    /**
     * Check if user has custom settings
     */
    public hasCustomSettings(): boolean {
        return this.currentSettings.isCustom;
    }

    /**
     * Subscribe to settings changes
     */
    public subscribe(callback: (settings: StakeSettings) => void): () => void {
        this.listeners.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * Notify all listeners of settings changes
     */
    private notifyListeners(): void {
        this.listeners.forEach(callback => {
            try {
                callback(this.currentSettings);
            } catch (error) {
                console.warn('Error in stake settings listener:', error);
            }
        });
    }

    /**
     * Get formatted stake for display
     */
    public getFormattedStake(): string {
        return `$${this.currentSettings.stake.toFixed(2)}`;
    }

    /**
     * Get formatted martingale for display
     */
    public getFormattedMartingale(): string {
        return `${this.currentSettings.martingale.toFixed(1)}x`;
    }

    /**
     * Apply stake and martingale settings to bot XML
     * This method can be used by any bot loading function
     */
    public applySettingsToXML(xmlDoc: Document): {
        stakeUpdated: boolean;
        martingaleUpdated: boolean;
        fieldsUpdated: number;
        details: string[];
    } {
        const result = {
            stakeUpdated: false,
            martingaleUpdated: false,
            fieldsUpdated: 0,
            details: [] as string[],
        };

        console.log('🎯 [StakeManager] Applying settings to bot XML:', {
            stake: this.currentSettings.stake,
            martingale: this.currentSettings.martingale,
        });

        try {
            // Update stake fields
            const stakeFields = xmlDoc.querySelectorAll('field[name="NUM"]');
            stakeFields.forEach(field => {
                const parentBlock = field.closest('block');
                if (parentBlock && parentBlock.getAttribute('type') === 'math_number') {
                    const variableSet = field.closest('block[type="variables_set"]');
                    if (variableSet) {
                        const varField = variableSet.querySelector('field[name="VAR"]');
                        if (varField && varField.textContent?.toLowerCase().includes('stake')) {
                            const oldValue = field.textContent;
                            field.textContent = this.currentSettings.stake.toString();
                            result.stakeUpdated = true;
                            result.fieldsUpdated++;
                            result.details.push(`Stake: ${oldValue} → ${this.currentSettings.stake}`);
                            console.log(`💰 Updated stake to ${this.currentSettings.stake} (${varField.textContent})`);
                        }
                    }
                }
            });

            // Update martingale fields (PRECISE - only "Martangle", NOT "Martangle Level")
            const allVariableFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
            allVariableFields.forEach(varField => {
                const varName = varField.textContent?.toLowerCase();

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
                            numField.textContent = this.currentSettings.martingale.toString();
                            result.martingaleUpdated = true;
                            result.fieldsUpdated++;
                            result.details.push(`${varName}: ${oldValue} → ${this.currentSettings.martingale}`);
                            console.log(`🎯 Updated "${varName}" to ${this.currentSettings.martingale}`);
                        }
                    }
                }
            });

            // Targeted update for fields with value "2" that are specifically "Martangle"
            const suspiciousFields = xmlDoc.querySelectorAll('field[name="NUM"]');
            suspiciousFields.forEach(field => {
                const value = field.textContent;
                if (value === '2') {
                    const parentBlock = field.closest('block');
                    const blockContext = parentBlock?.textContent?.toLowerCase() || '';

                    if (blockContext.includes('martangle') && !blockContext.includes('level')) {
                        const oldValue = field.textContent;
                        field.textContent = this.currentSettings.martingale.toString();
                        result.martingaleUpdated = true;
                        result.fieldsUpdated++;
                        result.details.push(`Targeted Martangle: ${oldValue} → ${this.currentSettings.martingale}`);
                        console.log(`🎯 TARGETED: Updated "Martangle" field to ${this.currentSettings.martingale}`);
                    }
                }
            });

            console.log('✅ StakeManager XML Update Summary:', {
                fieldsUpdated: result.fieldsUpdated,
                stakeUpdated: result.stakeUpdated,
                martingaleUpdated: result.martingaleUpdated,
                details: result.details,
            });
        } catch (error) {
            console.error('❌ Error applying StakeManager settings to XML:', error);
        }

        return result;
    }
}

// Export singleton instance
export const stakeManager = StakeManagerService.getInstance();
