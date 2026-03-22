/**
 * Bot Loading Tester
 * Comprehensive testing utility for debugging bot loading process
 */

import { razielBotLoaderService } from '../services/raziel-bot-loader.service';
import { botLoadingDebugger } from './bot-loading-debugger';

export interface TestSignal {
    market: string;
    marketName: string;
    confidence: number;
    targetDigit: number;
    recommendation: {
        action: 'OVER' | 'UNDER';
        barrier: number;
        confidence: number;
        reasoning: string;
    };
    signalType?: string;
    analysis?: any;
}

class BotLoadingTester {
    /**
     * Test bot loading with a sample signal
     */
    public async testBotLoading(): Promise<void> {
        console.group('🧪 Bot Loading Test Suite');

        try {
            // Test 1: File accessibility
            await this.testFileAccessibility();

            // Test 2: XML parsing
            await this.testXMLParsing();

            // Test 3: Configuration
            await this.testConfiguration();

            // Test 4: Loading methods
            await this.testLoadingMethods();

            // Test 5: Full integration test
            await this.testFullIntegration();

            console.log('✅ All bot loading tests completed');
        } catch (error) {
            console.error('❌ Bot loading test failed:', error);
        } finally {
            console.groupEnd();
        }
    }

    /**
     * Test file accessibility
     */
    private async testFileAccessibility(): Promise<void> {
        console.log('🔍 Testing file accessibility...');

        const botFiles = [
            'CFX-EvenOdd.xml', // Primary Raziel bot
            'Raziel Over Under.xml',
            'Game Changer AI - etrades.xml',
            'Random LDP Differ - Elvis Trades.xml',
            'CFX-RiseFall.xml',
        ];

        for (const file of botFiles) {
            try {
                const response = await fetch(`/${file}`);
                if (response.ok) {
                    const content = await response.text();
                    console.log(`✅ ${file}: Accessible (${content.length} bytes)`);
                } else {
                    console.warn(`⚠️ ${file}: Not accessible (${response.status})`);
                }
            } catch (error) {
                console.error(`❌ ${file}: Error - ${(error as Error).message}`);
            }
        }
    }

    /**
     * Test XML parsing
     */
    private async testXMLParsing(): Promise<void> {
        console.log('🔍 Testing XML parsing...');

        try {
            const response = await fetch('/CFX-EvenOdd.xml');
            const xmlContent = await response.text();

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                console.error('❌ CFX-EvenOdd XML parsing failed:', parseError.textContent);
                return;
            }

            console.log('✅ CFX-EvenOdd XML parsing successful');

            // Test specific block searches for CFX-EvenOdd
            const testBlocks = [
                { selector: 'field[name="SYMBOL_LIST"]', name: 'Market Symbol' },
                { selector: 'field[name="TYPE_LIST"]', name: 'Contract Type' },
                { selector: 'block[id="initial_stake_value"]', name: 'Initial Stake Block' },
                { selector: 'block[id="multiplier_value"]', name: 'Martingale Multiplier Block' },
                { selector: 'block[id="purchase_1"]', name: 'Purchase Block' },
            ];

            testBlocks.forEach(({ selector, name }) => {
                const element = xmlDoc.querySelector(selector);
                if (element) {
                    console.log(`✅ ${name}: Found`);
                } else {
                    console.warn(`⚠️ ${name}: Not found`);
                }
            });
        } catch (error) {
            console.error('❌ CFX-EvenOdd XML parsing test failed:', error);
        }
    }

    /**
     * Test configuration
     */
    private async testConfiguration(): Promise<void> {
        console.log('🔍 Testing CFX-EvenOdd configuration...');

        const testConfig = {
            botFile: 'CFX-EvenOdd.xml',
            market: 'R_50',
            contractType: 'DIGITEVEN',
            barrier: 0, // Even/Odd doesn't use barriers
            stake: 5,
            prediction: 'UNDER' as const,
            parameters: {
                initialStake: 5,
                martingaleMultiplier: 2.5,
                confidence: 75,
            },
        };

        try {
            const response = await fetch('/CFX-EvenOdd.xml');
            const xmlContent = await response.text();

            // Test XML configuration (without actually modifying)
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

            // Test market symbol update
            const symbolField = xmlDoc.querySelector('field[name="SYMBOL_LIST"]');
            if (symbolField) {
                const originalValue = symbolField.textContent;
                symbolField.textContent = testConfig.market;
                console.log(`✅ Market symbol: ${originalValue} → ${testConfig.market}`);
            }

            // Test contract type update
            const contractField = xmlDoc.querySelector('field[name="TYPE_LIST"]');
            if (contractField) {
                const originalValue = contractField.textContent;
                contractField.textContent = testConfig.contractType;
                console.log(`✅ Contract type: ${originalValue} → ${testConfig.contractType}`);
            }

            // Test initial stake update
            const stakeBlock = xmlDoc.querySelector('block[id="initial_stake_value"] field[name="NUM"]');
            if (stakeBlock) {
                const originalValue = stakeBlock.textContent;
                stakeBlock.textContent = testConfig.stake.toString();
                console.log(`✅ Initial stake: ${originalValue} → ${testConfig.stake}`);
            }

            // Test martingale multiplier update
            const martingaleBlock = xmlDoc.querySelector('block[id="multiplier_value"] field[name="NUM"]');
            if (martingaleBlock) {
                const originalValue = martingaleBlock.textContent;
                martingaleBlock.textContent = testConfig.parameters.martingaleMultiplier.toString();
                console.log(
                    `✅ Martingale multiplier: ${originalValue} → ${testConfig.parameters.martingaleMultiplier}`
                );
            }

            console.log('✅ CFX-EvenOdd configuration test completed');
        } catch (error) {
            console.error('❌ CFX-EvenOdd configuration test failed:', error);
        }
    }

    /**
     * Test loading methods
     */
    private async testLoadingMethods(): Promise<void> {
        console.log('🔍 Testing loading methods...');

        const methods = [];

        if (typeof window !== 'undefined') {
            const windowGlobals = window as any;

            // Test load_modal
            if (windowGlobals.load_modal?.loadStrategyToBuilder) {
                methods.push('load_modal.loadStrategyToBuilder');
                console.log('✅ load_modal.loadStrategyToBuilder: Available');
            } else {
                console.warn('⚠️ load_modal.loadStrategyToBuilder: Not available');
            }

            // Test load_modal_store
            if (windowGlobals.load_modal_store?.loadStrategyToBuilder) {
                methods.push('load_modal_store.loadStrategyToBuilder');
                console.log('✅ load_modal_store.loadStrategyToBuilder: Available');
            } else {
                console.warn('⚠️ load_modal_store.loadStrategyToBuilder: Not available');
            }

            // Test dashboard_store
            if (windowGlobals.dashboard_store?.setActiveTab) {
                methods.push('dashboard_store.setActiveTab');
                console.log('✅ dashboard_store.setActiveTab: Available');
            } else {
                console.warn('⚠️ dashboard_store.setActiveTab: Not available');
            }

            // Test Blockly
            if (windowGlobals.Blockly?.getMainWorkspace) {
                methods.push('Blockly.getMainWorkspace');
                console.log('✅ Blockly.getMainWorkspace: Available');
            } else {
                console.warn('⚠️ Blockly.getMainWorkspace: Not available');
            }
        }

        console.log(`📊 Total available methods: ${methods.length}`);
    }

    /**
     * Test full integration
     */
    private async testFullIntegration(): Promise<void> {
        console.log('🔍 Testing full integration...');

        // Create a test signal
        const testSignal: TestSignal = {
            market: 'R_50',
            marketName: 'Volatility 50',
            confidence: 75,
            targetDigit: 2,
            recommendation: {
                action: 'OVER',
                barrier: 2,
                confidence: 75,
                reasoning: 'Test signal for debugging',
            },
            signalType: 'HOT_ZONE',
            analysis: {
                hotDigits: [],
                coldDigits: [],
                distributionDeviation: 0.3,
                meanReversionPotential: 0.7,
                momentumStrength: 0.6,
            },
        };

        const customSettings = {
            stake: 5,
            martingale: 2.5,
        };

        try {
            console.log('🚀 Starting full integration test...');

            // This would normally load the bot, but we'll just test the configuration
            // await razielBotLoaderService.loadRazielBotWithHotColdSignal(testSignal as any, customSettings);

            console.log('✅ Full integration test setup completed');
            console.log('ℹ️ To run actual bot loading, uncomment the service call above');
        } catch (error) {
            console.error('❌ Full integration test failed:', error);
        }
    }

    /**
     * Run quick diagnostic
     */
    public runQuickDiagnostic(): void {
        console.group('⚡ Quick CFX-EvenOdd Bot Loading Diagnostic');

        // Check file accessibility
        fetch('/CFX-EvenOdd.xml')
            .then(response => {
                if (response.ok) {
                    console.log('✅ CFX-EvenOdd bot file accessible');
                    return response.text();
                } else {
                    console.error('❌ CFX-EvenOdd bot file not accessible');
                    throw new Error(`HTTP ${response.status}`);
                }
            })
            .then(content => {
                console.log(`✅ CFX-EvenOdd bot file loaded (${content.length} bytes)`);

                // Test XML parsing
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(content, 'text/xml');
                const parseError = xmlDoc.querySelector('parsererror');

                if (parseError) {
                    console.error('❌ CFX-EvenOdd XML parsing failed');
                } else {
                    console.log('✅ CFX-EvenOdd XML parsing successful');

                    // Test key blocks
                    const keyBlocks = [
                        'field[name="SYMBOL_LIST"]',
                        'field[name="TYPE_LIST"]',
                        'block[id="initial_stake_value"]',
                        'block[id="multiplier_value"]',
                    ];

                    keyBlocks.forEach(selector => {
                        const element = xmlDoc.querySelector(selector);
                        console.log(`${element ? '✅' : '❌'} ${selector}: ${element ? 'Found' : 'Not found'}`);
                    });
                }
            })
            .catch(error => {
                console.error('❌ CFX-EvenOdd diagnostic failed:', error);
            })
            .finally(() => {
                console.groupEnd();
            });
    }
}

export const botLoadingTester = new BotLoadingTester();

// Make it available globally for console testing
if (typeof window !== 'undefined') {
    (window as any).botLoadingTester = botLoadingTester;
    (window as any).botLoadingDebugger = botLoadingDebugger;
}
