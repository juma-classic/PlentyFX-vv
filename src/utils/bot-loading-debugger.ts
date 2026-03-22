/**
 * Bot Loading Debugger
 * Comprehensive debugging system for the Raziel bot loading process
 */

export interface BotLoadingStep {
    step: string;
    status: 'pending' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: number;
    data?: any;
}

export interface BotLoadingDebugInfo {
    steps: BotLoadingStep[];
    startTime: number;
    endTime?: number;
    totalDuration?: number;
    success: boolean;
    errorDetails?: string;
}

class BotLoadingDebugger {
    private debugInfo: BotLoadingDebugInfo;
    private isDebugging: boolean = false;

    constructor() {
        this.debugInfo = {
            steps: [],
            startTime: 0,
            success: false,
        };
    }

    /**
     * Start debugging session
     */
    public startDebugging(): void {
        this.isDebugging = true;
        this.debugInfo = {
            steps: [],
            startTime: Date.now(),
            success: false,
        };

        this.addStep('initialization', 'success', 'Bot loading debugger initialized');
        console.log('🔍 Bot Loading Debugger: Session started');
    }

    /**
     * Add a debugging step
     */
    public addStep(
        step: string,
        status: 'pending' | 'success' | 'warning' | 'error',
        message: string,
        data?: any
    ): void {
        if (!this.isDebugging) return;

        const stepInfo: BotLoadingStep = {
            step,
            status,
            message,
            timestamp: Date.now(),
            data,
        };

        this.debugInfo.steps.push(stepInfo);

        // Console logging with appropriate emoji
        const emoji = {
            pending: '⏳',
            success: '✅',
            warning: '⚠️',
            error: '❌',
        }[status];

        console.log(`${emoji} Bot Loading: [${step.toUpperCase()}] ${message}`, data || '');
    }

    /**
     * Complete debugging session
     */
    public completeDebugging(success: boolean, errorDetails?: string): BotLoadingDebugInfo {
        if (!this.isDebugging) return this.debugInfo;

        this.debugInfo.endTime = Date.now();
        this.debugInfo.totalDuration = this.debugInfo.endTime - this.debugInfo.startTime;
        this.debugInfo.success = success;
        this.debugInfo.errorDetails = errorDetails;

        this.addStep(
            'completion',
            success ? 'success' : 'error',
            success ? 'Bot loading completed successfully' : `Bot loading failed: ${errorDetails}`,
            { duration: this.debugInfo.totalDuration }
        );

        this.isDebugging = false;

        // Generate summary report
        this.generateSummaryReport();

        return this.debugInfo;
    }

    /**
     * Generate summary report
     */
    private generateSummaryReport(): void {
        const { steps, totalDuration, success } = this.debugInfo;

        console.group('🔍 Bot Loading Debug Summary');
        console.log(`📊 Total Duration: ${totalDuration}ms`);
        console.log(`🎯 Success: ${success ? 'YES' : 'NO'}`);
        console.log(`📝 Total Steps: ${steps.length}`);

        // Count step statuses
        const statusCounts = steps.reduce(
            (acc, step) => {
                acc[step.status] = (acc[step.status] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        console.log('📈 Step Status Breakdown:', statusCounts);

        // Show failed steps
        const failedSteps = steps.filter(step => step.status === 'error');
        if (failedSteps.length > 0) {
            console.log('❌ Failed Steps:');
            failedSteps.forEach(step => {
                console.log(`  - ${step.step}: ${step.message}`);
            });
        }

        // Show warnings
        const warningSteps = steps.filter(step => step.status === 'warning');
        if (warningSteps.length > 0) {
            console.log('⚠️ Warning Steps:');
            warningSteps.forEach(step => {
                console.log(`  - ${step.step}: ${step.message}`);
            });
        }

        console.groupEnd();
    }

    /**
     * Get current debug info
     */
    public getDebugInfo(): BotLoadingDebugInfo {
        return { ...this.debugInfo };
    }

    /**
     * Export debug info as JSON
     */
    public exportDebugInfo(): string {
        return JSON.stringify(this.debugInfo, null, 2);
    }

    /**
     * Debug XML configuration process
     */
    public debugXMLConfiguration(xmlContent: string, config: any): void {
        this.addStep('xml_parsing', 'pending', 'Starting XML configuration');

        try {
            // Check if XML is valid
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                this.addStep('xml_parsing', 'error', 'XML parsing failed', { error: parseError.textContent });
                return;
            }

            this.addStep('xml_parsing', 'success', 'XML parsed successfully');

            // Debug specific block searches
            this.debugBlockSearch(xmlDoc, 'SYMBOL_LIST', config.market);
            this.debugBlockSearch(xmlDoc, 'TYPE_LIST', config.contractType);
            this.debugStakeBlocks(xmlDoc, config.stake);
            this.debugMartingaleBlocks(xmlDoc, config.parameters.martingaleSplit);
            this.debugPredictionBlocks(xmlDoc, config.parameters);
        } catch (error) {
            this.addStep('xml_parsing', 'error', 'XML configuration failed', { error: (error as Error).message });
        }
    }

    /**
     * Debug block search
     */
    private debugBlockSearch(xmlDoc: Document, fieldName: string, expectedValue: any): void {
        const field = xmlDoc.querySelector(`field[name="${fieldName}"]`);

        if (field) {
            const currentValue = field.textContent;
            this.addStep(
                `field_${fieldName.toLowerCase()}`,
                currentValue === expectedValue ? 'success' : 'warning',
                `Field ${fieldName}: ${currentValue} ${currentValue === expectedValue ? '(matches expected)' : `(expected: ${expectedValue})`}`,
                { field: fieldName, current: currentValue, expected: expectedValue }
            );
        } else {
            this.addStep(`field_${fieldName.toLowerCase()}`, 'error', `Field ${fieldName} not found in XML`, {
                field: fieldName,
                expected: expectedValue,
            });
        }
    }

    /**
     * Debug stake blocks
     */
    private debugStakeBlocks(xmlDoc: Document, expectedStake: number): void {
        // Check main stake blocks
        const stakeBlocks = [
            { id: '*k=Zh]oy^xkO%$_J}wmI', name: 'Main Stake Variable' },
            { id: 'a+aI}xH)h$*P-GA=;IJi', name: 'Initial Stake Variable' },
        ];

        stakeBlocks.forEach(({ id, name }) => {
            const block = xmlDoc.querySelector(
                `block[id="${id}"] value[name="VALUE"] block[type="math_number"] field[name="NUM"]`
            );

            if (block) {
                const currentValue = parseFloat(block.textContent || '0');
                this.addStep(
                    `stake_${id}`,
                    currentValue === expectedStake ? 'success' : 'warning',
                    `${name}: ${currentValue} ${currentValue === expectedStake ? '(correct)' : `(expected: ${expectedStake})`}`,
                    { blockId: id, current: currentValue, expected: expectedStake }
                );
            } else {
                this.addStep(`stake_${id}`, 'error', `${name} block not found`, {
                    blockId: id,
                    expected: expectedStake,
                });
            }
        });
    }

    /**
     * Debug martingale blocks
     */
    private debugMartingaleBlocks(xmlDoc: Document, expectedMartingale: number): void {
        const martingaleBlock = xmlDoc.querySelector(
            'block[id="}RkgwZuqtMN[-O}zHU%8"] value[name="VALUE"] block[type="math_number"] field[name="NUM"]'
        );

        if (martingaleBlock) {
            const currentValue = parseFloat(martingaleBlock.textContent || '0');
            this.addStep(
                'martingale_split',
                currentValue === expectedMartingale ? 'success' : 'warning',
                `Martingale Split: ${currentValue} ${currentValue === expectedMartingale ? '(correct)' : `(expected: ${expectedMartingale})`}`,
                { current: currentValue, expected: expectedMartingale }
            );
        } else {
            this.addStep('martingale_split', 'error', 'Martingale Split block not found', {
                expected: expectedMartingale,
            });
        }
    }

    /**
     * Debug prediction blocks
     */
    private debugPredictionBlocks(xmlDoc: Document, parameters: any): void {
        const predictionBlocks = [
            {
                id: 'BHc;XLk9Thj3Y+V_Rr?.',
                name: 'Prediction Before Loss',
                expected: parameters.predictionBeforeLoss,
            },
            {
                id: 'f3;H/aBLd5p3snIQqEfg',
                name: 'Prediction After Loss',
                expected: parameters.predictionAfterLoss,
            },
        ];

        predictionBlocks.forEach(({ id, name, expected }) => {
            const block = xmlDoc.querySelector(
                `block[id="${id}"] value[name="VALUE"] block[type="math_number"] field[name="NUM"]`
            );

            if (block) {
                const currentValue = parseFloat(block.textContent || '0');
                this.addStep(
                    `prediction_${id}`,
                    currentValue === expected ? 'success' : 'warning',
                    `${name}: ${currentValue} ${currentValue === expected ? '(correct)' : `(expected: ${expected})`}`,
                    { blockId: id, current: currentValue, expected }
                );
            } else {
                this.addStep(`prediction_${id}`, 'error', `${name} block not found`, { blockId: id, expected });
            }
        });
    }

    /**
     * Debug bot loading methods
     */
    public debugBotLoadingMethods(): void {
        this.addStep('method_check', 'pending', 'Checking available bot loading methods');

        const methods = [];

        // Check window globals
        if (typeof window !== 'undefined') {
            const windowGlobals = window as any;

            if (windowGlobals.load_modal?.loadStrategyToBuilder) {
                methods.push('load_modal.loadStrategyToBuilder');
            }

            if (windowGlobals.load_modal_store?.loadStrategyToBuilder) {
                methods.push('load_modal_store.loadStrategyToBuilder');
            }

            if (windowGlobals.dashboard_store?.setActiveTab) {
                methods.push('dashboard_store.setActiveTab');
            }

            if (windowGlobals.Blockly?.getMainWorkspace) {
                methods.push('Blockly.getMainWorkspace');
            }
        }

        this.addStep(
            'method_check',
            methods.length > 0 ? 'success' : 'warning',
            `Found ${methods.length} available loading methods`,
            { methods }
        );
    }

    /**
     * Debug file loading
     */
    public async debugFileLoading(botFile: string): Promise<boolean> {
        this.addStep('file_loading', 'pending', `Loading bot file: ${botFile}`);

        try {
            const response = await fetch(`/${botFile}`);

            if (!response.ok) {
                this.addStep('file_loading', 'error', `Failed to load ${botFile}: ${response.statusText}`, {
                    status: response.status,
                    statusText: response.statusText,
                });
                return false;
            }

            const content = await response.text();
            const contentLength = content.length;

            this.addStep('file_loading', 'success', `Successfully loaded ${botFile}`, {
                contentLength,
                contentPreview: content.substring(0, 200) + '...',
            });

            return true;
        } catch (error) {
            this.addStep('file_loading', 'error', `File loading error: ${(error as Error).message}`, {
                error: (error as Error).message,
            });
            return false;
        }
    }
}

export const botLoadingDebugger = new BotLoadingDebugger();
