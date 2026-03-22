/**
 * TickShark Integration Test Script
 * Comprehensive testing of all TickShark services and components
 */

import { modeManagerService } from '../services/tickshark/mode-manager.service';
import { analysisEngineService } from '../services/tickshark/analysis-engine.service';
import { signalGeneratorService } from '../services/tickshark/signal-generator.service';
import { sessionManagerService } from '../services/tickshark/session-manager.service';
import { TickData } from '../types/tickshark/analysis.types';

export class TickSharkTestSuite {
    private testResults: Array<{ test: string; status: 'PASS' | 'FAIL'; duration: number; details?: string }> = [];
    private performanceMonitor = new Map<string, number[]>();

    /**
     * Run complete test suite
     */
    async runAllTests(): Promise<void> {
        console.log('🦈 Starting TickShark Integration Test Suite...');
        console.log('================================================');

        try {
            // Phase 1: Service Tests
            await this.testServiceInitialization();
            await this.testModeManager();
            await this.testAnalysisEngine();
            await this.testSignalGenerator();
            await this.testSessionManager();

            // Phase 2: Integration Tests
            await this.testServiceIntegration();
            await this.testPerformance();
            await this.testErrorHandling();

            // Phase 3: Results
            this.displayResults();

        } catch (error) {
            console.error('🚨 Test suite failed:', error);
        }
    }

    /**
     * Test service initialization
     */
    private async testServiceInitialization(): Promise<void> {
        console.log('\n📋 Phase 1: Service Initialization Tests');
        console.log('----------------------------------------');

        // Test Mode Manager initialization
        await this.runTest('Mode Manager Initialization', async () => {
            await modeManagerService.initialize();
            const status = modeManagerService.getModeStatus();
            if (status.currentMode !== 'MANUAL_OBSERVATION') {
                throw new Error(`Expected MANUAL_OBSERVATION, got ${status.currentMode}`);
            }
        });

        // Test Analysis Engine initialization
        await this.runTest('Analysis Engine Initialization', async () => {
            await analysisEngineService.initialize();
            const config = analysisEngineService.getConfiguration();
            if (!config.enablePatternDetection) {
                throw new Error('Pattern detection should be enabled by default');
            }
        });

        // Test Session Manager
        await this.runTest('Session Manager Initialization', async () => {
            const stats = sessionManagerService.getSessionStats();
            if (!stats.current.id) {
                throw new Error('Session should be automatically created');
            }
        });
    }

    /**
     * Test Mode Manager functionality
     */
    private async testModeManager(): Promise<void> {
        console.log('\n🎛️ Phase 2: Mode Manager Tests');
        console.log('------------------------------');

        // Test mode switching
        await this.runTest('Mode Switching to Simulation', async () => {
            const result = await modeManagerService.switchMode('SIMULATION');
            if (!result) {
                throw new Error('Mode switch to SIMULATION failed');
            }
            
            const currentMode = modeManagerService.getCurrentMode();
            if (currentMode !== 'SIMULATION') {
                throw new Error(`Expected SIMULATION, got ${currentMode}`);
            }
        });

        // Test mode configuration
        await this.runTest('Mode Configuration Retrieval', async () => {
            const config = modeManagerService.getModeConfig('SIMULATION');
            if (!config.canExecuteTrades) {
                throw new Error('SIMULATION mode should allow trade execution');
            }
            if (config.maxStakePerTrade <= 0) {
                throw new Error('SIMULATION mode should have positive stake limits');
            }
        });

        // Test safety checks
        await this.runTest('Safety Check Validation', async () => {
            const status = modeManagerService.getModeStatus();
            if (!status.safetyEnabled) {
                throw new Error('Safety should be enabled by default');
            }
        });
    }

    /**
     * Test Analysis Engine functionality
     */
    private async testAnalysisEngine(): Promise<void> {
        console.log('\n📊 Phase 3: Analysis Engine Tests');
        console.log('----------------------------------');

        const sampleTicks = this.generateSampleTicks(50);

        // Test basic analysis
        await this.runTest('Basic Tick Analysis', async () => {
            const result = await analysisEngineService.analyzeTickData(sampleTicks);
            
            if (!result.id || !result.symbol) {
                throw new Error('Analysis result missing required fields');
            }
            
            if (result.dataPoints !== sampleTicks.length) {
                throw new Error(`Expected ${sampleTicks.length} data points, got ${result.dataPoints}`);
            }
            
            if (result.analysisLatency <= 0) {
                throw new Error('Analysis latency should be positive');
            }
        });

        // Test opportunity detection
        await this.runTest('Opportunity Detection', async () => {
            const volatileTicks = this.generateVolatileTicks(30);
            const result = await analysisEngineService.analyzeTickData(volatileTicks);
            
            // Should detect some opportunities with volatile data
            if (result.opportunities.length === 0) {
                console.warn('⚠️ No opportunities detected with volatile data (may be normal)');
            }
            
            // Validate opportunity structure
            for (const opp of result.opportunities) {
                if (!opp.id || !opp.type || opp.confidence < 0 || opp.confidence > 1) {
                    throw new Error('Invalid opportunity structure detected');
                }
            }
        });

        // Test performance
        await this.runTest('Analysis Performance', async () => {
            const startTime = performance.now();
            await analysisEngineService.analyzeTickData(sampleTicks);
            const duration = performance.now() - startTime;
            
            if (duration > 200) { // Allow 200ms for comprehensive analysis
                throw new Error(`Analysis too slow: ${duration.toFixed(2)}ms (expected < 200ms)`);
            }
            
            this.recordPerformance('analysis_duration', duration);
        });
    }

    /**
     * Test Signal Generator functionality
     */
    private async testSignalGenerator(): Promise<void> {
        console.log('\n📡 Phase 4: Signal Generator Tests');
        console.log('-----------------------------------');

        // Create analysis result with opportunities
        const sampleTicks = this.generateVolatileTicks(40);
        const analysisResult = await analysisEngineService.analyzeTickData(sampleTicks);

        // Test signal generation
        await this.runTest('Signal Generation', async () => {
            const signals = signalGeneratorService.generateSignals(analysisResult);
            
            // Validate signal structure
            for (const signal of signals) {
                if (!signal.id || !signal.type || !signal.symbol) {
                    throw new Error('Invalid signal structure');
                }
                
                if (signal.confidence < 0 || signal.confidence > 1) {
                    throw new Error(`Invalid confidence: ${signal.confidence}`);
                }
                
                if (signal.riskScore < 0 || signal.riskScore > 1) {
                    throw new Error(`Invalid risk score: ${signal.riskScore}`);
                }
                
                if (signal.recommendedStake <= 0) {
                    throw new Error('Recommended stake should be positive');
                }
            }
        });

        // Test signal filtering
        await this.runTest('Signal Filtering', async () => {
            // Update config to be more restrictive
            signalGeneratorService.updateConfiguration({
                minConfidence: 0.9,
                maxRiskScore: 0.3
            });
            
            const signals = signalGeneratorService.generateSignals(analysisResult);
            
            // All signals should meet the criteria
            for (const signal of signals) {
                if (signal.confidence < 0.9) {
                    throw new Error(`Signal confidence ${signal.confidence} below threshold 0.9`);
                }
                if (signal.riskScore > 0.3) {
                    throw new Error(`Signal risk ${signal.riskScore} above threshold 0.3`);
                }
            }
            
            // Reset config
            signalGeneratorService.updateConfiguration({
                minConfidence: 0.6,
                maxRiskScore: 0.7
            });
        });

        // Test signal statistics
        await this.runTest('Signal Statistics', async () => {
            const stats = signalGeneratorService.getStatistics();
            
            if (stats.totalSignalsGenerated < 0) {
                throw new Error('Signal statistics should be non-negative');
            }
        });
    }

    /**
     * Test Session Manager functionality
     */
    private async testSessionManager(): Promise<void> {
        console.log('\n📈 Phase 5: Session Manager Tests');
        console.log('----------------------------------');

        // Test session statistics
        await this.runTest('Session Statistics', async () => {
            const stats = sessionManagerService.getSessionStats();
            
            if (!stats.current.id) {
                throw new Error('Current session should have an ID');
            }
            
            if (stats.current.startTime <= 0) {
                throw new Error('Session start time should be positive');
            }
            
            if (stats.limits.duration.max <= 0) {
                throw new Error('Duration limit should be positive');
            }
        });

        // Test trade recording
        await this.runTest('Trade Recording', async () => {
            const mockIntent = {
                id: 'test-intent-' + Date.now(),
                type: 'RISE_FALL' as const,
                status: 'COMPLETED' as const,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                parameters: {
                    symbol: 'R_100',
                    contractType: 'RISE_FALL' as const,
                    stake: 10,
                    duration: 60
                },
                confidence: 0.8,
                riskScore: 0.3,
                validationChecks: [],
                metadata: {
                    source: 'MANUAL' as const,
                    priority: 'MEDIUM' as const,
                    tags: []
                }
            };
            
            const statsBefore = sessionManagerService.getSessionStats();
            sessionManagerService.recordTrade(mockIntent, 'WIN');
            const statsAfter = sessionManagerService.getSessionStats();
            
            if (statsAfter.current.trades.total !== statsBefore.current.trades.total + 1) {
                throw new Error('Trade count should increase by 1');
            }
            
            if (statsAfter.current.trades.successful !== statsBefore.current.trades.successful + 1) {
                throw new Error('Successful trade count should increase by 1');
            }
        });

        // Test session limits
        await this.runTest('Session Limits Check', async () => {
            const limits = sessionManagerService.checkLimits();
            
            if (typeof limits.exceeded !== 'boolean') {
                throw new Error('Limits check should return boolean exceeded status');
            }
            
            if (!Array.isArray(limits.limits)) {
                throw new Error('Limits check should return array of limit descriptions');
            }
        });
    }

    /**
     * Test service integration
     */
    private async testServiceIntegration(): Promise<void> {
        console.log('\n🔗 Phase 6: Service Integration Tests');
        console.log('-------------------------------------');

        // Test full pipeline
        await this.runTest('Full Analysis Pipeline', async () => {
            // Generate sample data
            const ticks = this.generateSampleTicks(50);
            
            // Run analysis
            const analysisResult = await analysisEngineService.analyzeTickData(ticks);
            
            // Generate signals
            const signals = signalGeneratorService.generateSignals(analysisResult);
            
            // Validate signals were generated
            if (signals.length > 0) {
                console.log(`📊 Generated ${signals.length} signals from analysis`);
            }
            
            // Record analysis in session
            sessionManagerService.recordSignal({
                id: 'test-signal-' + Date.now(),
                timestamp: Date.now(),
                analysisId: analysisResult.id,
                type: 'RISE_FALL',
                symbol: analysisResult.symbol,
                confidence: 0.8,
                strength: 0.7,
                recommendedStake: 10,
                recommendedDuration: 60,
                riskScore: 0.3,
                riskFactors: [],
                validFrom: Date.now(),
                validUntil: Date.now() + 30000,
                urgency: 'MEDIUM',
                currentPrice: 1000,
                expectedPrice: 1001,
                isValid: true,
                validationScore: 0.8,
                source: 'LATENCY_ARBITRAGE',
                priority: 'MEDIUM',
                tags: []
            });
            
            // Verify session updated
            const stats = sessionManagerService.getSessionStats();
            if (stats.current.performance.signalsGenerated === 0) {
                throw new Error('Signal should be recorded in session');
            }
        });

        // Test mode-dependent behavior
        await this.runTest('Mode-Dependent Signal Generation', async () => {
            // Switch to different modes and test signal generation
            await modeManagerService.switchMode('MANUAL_OBSERVATION');
            
            const ticks = this.generateSampleTicks(30);
            const analysis = await analysisEngineService.analyzeTickData(ticks);
            const signalsManual = signalGeneratorService.generateSignals(analysis, 'MANUAL_OBSERVATION');
            
            await modeManagerService.switchMode('FULLY_AUTOMATED');
            const signalsAuto = signalGeneratorService.generateSignals(analysis, 'FULLY_AUTOMATED');
            
            // Auto mode should generally be more conservative (higher risk scores)
            // This is a soft check since it depends on the specific analysis
            console.log(`📊 Manual mode signals: ${signalsManual.length}, Auto mode signals: ${signalsAuto.length}`);
            
            // Validate that both signal arrays are properly structured
            [...signalsManual, ...signalsAuto].forEach(signal => {
                if (!signal.id || !signal.type) {
                    throw new Error('Invalid signal structure in mode-dependent test');
                }
            });
        });
    }

    /**
     * Test performance characteristics
     */
    private async testPerformance(): Promise<void> {
        console.log('\n⚡ Phase 7: Performance Tests');
        console.log('-----------------------------');

        // Test analysis performance with varying data sizes
        await this.runTest('Analysis Performance Scaling', async () => {
            const sizes = [10, 25, 50, 100];
            
            for (const size of sizes) {
                const ticks = this.generateSampleTicks(size);
                const startTime = performance.now();
                await analysisEngineService.analyzeTickData(ticks);
                const duration = performance.now() - startTime;
                
                this.recordPerformance(`analysis_${size}_ticks`, duration);
                
                // Performance should scale reasonably
                if (duration > size * 5) { // 5ms per tick is generous
                    throw new Error(`Analysis too slow for ${size} ticks: ${duration.toFixed(2)}ms`);
                }
            }
        });

        // Test memory usage
        await this.runTest('Memory Usage Stability', async () => {
            const initialMemory = this.getMemoryUsage();
            
            // Run many analysis cycles
            for (let i = 0; i < 50; i++) {
                const ticks = this.generateSampleTicks(30);
                await analysisEngineService.analyzeTickData(ticks);
                signalGeneratorService.generateSignals(await analysisEngineService.analyzeTickData(ticks));
            }
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = this.getMemoryUsage();
            const memoryIncrease = finalMemory - initialMemory;
            
            this.recordPerformance('memory_increase_mb', memoryIncrease);
            
            // Memory increase should be reasonable (< 20MB for 50 cycles)
            if (memoryIncrease > 20) {
                console.warn(`⚠️ High memory increase: ${memoryIncrease.toFixed(2)}MB`);
            }
        });
    }

    /**
     * Test error handling
     */
    private async testErrorHandling(): Promise<void> {
        console.log('\n🚨 Phase 8: Error Handling Tests');
        console.log('---------------------------------');

        // Test invalid data handling
        await this.runTest('Invalid Data Handling', async () => {
            try {
                await analysisEngineService.analyzeTickData([]);
                throw new Error('Should have thrown error for empty data');
            } catch (error) {
                if (error instanceof Error && error.message.includes('Should have thrown')) {
                    throw error;
                }
                // Expected error - test passes
            }
        });

        // Test invalid mode switching
        await this.runTest('Invalid Mode Handling', async () => {
            try {
                await modeManagerService.switchMode('INVALID_MODE' as any);
                throw new Error('Should have thrown error for invalid mode');
            } catch (error) {
                if (error instanceof Error && error.message.includes('Should have thrown')) {
                    throw error;
                }
                // Expected error - test passes
            }
        });

        // Test service recovery
        await this.runTest('Service Recovery', async () => {
            // Clear analysis cache to test recovery
            analysisEngineService.clearCache();
            
            // Should still work after cache clear
            const ticks = this.generateSampleTicks(20);
            const result = await analysisEngineService.analyzeTickData(ticks);
            
            if (!result.isValid) {
                throw new Error('Analysis should recover after cache clear');
            }
        });
    }

    /**
     * Run individual test with error handling
     */
    private async runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
        const startTime = performance.now();
        
        try {
            await testFn();
            const duration = performance.now() - startTime;
            this.testResults.push({ test: testName, status: 'PASS', duration });
            console.log(`✅ ${testName} (${duration.toFixed(2)}ms)`);
        } catch (error) {
            const duration = performance.now() - startTime;
            const details = error instanceof Error ? error.message : String(error);
            this.testResults.push({ test: testName, status: 'FAIL', duration, details });
            console.log(`❌ ${testName} (${duration.toFixed(2)}ms): ${details}`);
        }
    }

    /**
     * Display test results summary
     */
    private displayResults(): void {
        console.log('\n🏆 Test Results Summary');
        console.log('=======================');
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const total = this.testResults.length;
        
        console.log(`📊 Tests: ${passed}/${total} passed (${((passed/total)*100).toFixed(1)}%)`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`   • ${r.test}: ${r.details}`));
        }
        
        // Performance summary
        console.log('\n⚡ Performance Summary:');
        for (const [metric, values] of this.performanceMonitor) {
            const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            console.log(`   • ${metric}: avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms`);
        }
        
        console.log('\n🦈 TickShark Integration Test Complete!');
    }

    /**
     * Generate sample tick data
     */
    private generateSampleTicks(count: number): TickData[] {
        const ticks: TickData[] = [];
        let basePrice = 1000.0;
        
        for (let i = 0; i < count; i++) {
            const timestamp = Date.now() - (count - i) * 1000;
            const priceChange = (Math.random() - 0.5) * 0.001; // Small price changes
            basePrice += priceChange;
            
            ticks.push({
                symbol: 'R_100',
                timestamp,
                bid: basePrice - 0.0005,
                ask: basePrice + 0.0005,
                spread: 0.001,
                volume: Math.floor(Math.random() * 1000) + 100,
                receiveTime: timestamp,
                processTime: timestamp + Math.random() * 5,
                latency: Math.random() * 30 + 10,
                quality: Math.random() > 0.1 ? 'HIGH' : 'MEDIUM',
                source: 'TEST_GENERATOR',
                sequenceNumber: i,
                isValid: true,
            });
        }
        
        return ticks;
    }

    /**
     * Generate volatile tick data for opportunity testing
     */
    private generateVolatileTicks(count: number): TickData[] {
        const ticks: TickData[] = [];
        let basePrice = 1000.0;
        
        for (let i = 0; i < count; i++) {
            const timestamp = Date.now() - (count - i) * 1000;
            const priceChange = (Math.random() - 0.5) * 0.01; // Larger price changes
            basePrice += priceChange;
            
            // Add some latency variation for arbitrage opportunities
            const latency = Math.random() * 100 + 5;
            
            ticks.push({
                symbol: 'R_100',
                timestamp,
                bid: basePrice - 0.002,
                ask: basePrice + 0.002,
                spread: 0.004,
                volume: Math.floor(Math.random() * 2000) + 500,
                receiveTime: timestamp,
                processTime: timestamp + Math.random() * 10,
                latency,
                quality: latency < 50 ? 'HIGH' : 'MEDIUM',
                source: 'TEST_GENERATOR',
                sequenceNumber: i,
                isValid: true,
            });
        }
        
        return ticks;
    }

    /**
     * Record performance metric
     */
    private recordPerformance(metric: string, value: number): void {
        if (!this.performanceMonitor.has(metric)) {
            this.performanceMonitor.set(metric, []);
        }
        this.performanceMonitor.get(metric)!.push(value);
    }

    /**
     * Get current memory usage in MB
     */
    private getMemoryUsage(): number {
        // Check if performance.memory is available (Chrome/Edge)
        const perfMemory = (performance as any).memory;
        if (perfMemory && perfMemory.usedJSHeapSize) {
            return perfMemory.usedJSHeapSize / 1024 / 1024;
        }
        return 0;
    }
}

// Export test runner function
export async function runTickSharkTests(): Promise<void> {
    const testSuite = new TickSharkTestSuite();
    await testSuite.runAllTests();
}

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined' && (window as any).runTickSharkTests) {
    (window as any).runTickSharkTests = runTickSharkTests;
}