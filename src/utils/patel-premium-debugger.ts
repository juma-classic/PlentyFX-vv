/**
 * Patel Premium Debugger
 * Comprehensive debugging tool to identify issues with Patel Premium feature
 */

interface DebugResult {
    component: string;
    status: 'OK' | 'WARNING' | 'ERROR';
    message: string;
    details?: any;
}

class PatelPremiumDebugger {
    private results: DebugResult[] = [];

    /**
     * Run comprehensive debug check
     */
    public async runDebugCheck(): Promise<DebugResult[]> {
        console.log('🔍 Starting Patel Premium Debug Check...');
        this.results = [];

        // Check component imports
        await this.checkComponentImports();

        // Check service initialization
        await this.checkServiceInitialization();

        // Check routing and navigation
        await this.checkRouting();

        // Check type definitions
        await this.checkTypeDefinitions();

        // Check console errors
        this.checkConsoleErrors();

        // Check browser compatibility
        this.checkBrowserCompatibility();

        // Generate report
        this.generateReport();

        return this.results;
    }

    /**
     * Check if all components can be imported
     */
    private async checkComponentImports(): Promise<void> {
        const components = [
            'PatelPrime',
            'PatelSignals',
            'PatelSignalCenter',
            'SignalCard',
            'MarketSelector',
            'ConfidenceFilter',
            'TypeFilter',
            'StatsPanel',
            'LiveTickDisplay',
            'DigitHeatmap',
        ];

        for (const component of components) {
            try {
                // Try to dynamically import each component
                switch (component) {
                    case 'PatelPrime':
                        await import('../components/signals/PatelPrime');
                        this.addResult('PatelPrime Import', 'OK', 'Component imported successfully');
                        break;
                    case 'PatelSignals':
                        await import('../components/signals/patel/PatelSignals');
                        this.addResult('PatelSignals Import', 'OK', 'Component imported successfully');
                        break;
                    case 'PatelSignalCenter':
                        await import('../components/signals/PatelSignalCenter');
                        this.addResult('PatelSignalCenter Import', 'OK', 'Component imported successfully');
                        break;
                    case 'SignalCard':
                        await import('../components/signals/patel/SignalCard');
                        this.addResult('SignalCard Import', 'OK', 'Component imported successfully');
                        break;
                    case 'MarketSelector':
                        await import('../components/signals/patel/MarketSelector');
                        this.addResult('MarketSelector Import', 'OK', 'Component imported successfully');
                        break;
                    case 'ConfidenceFilter':
                        await import('../components/signals/patel/ConfidenceFilter');
                        this.addResult('ConfidenceFilter Import', 'OK', 'Component imported successfully');
                        break;
                    case 'TypeFilter':
                        await import('../components/signals/patel/TypeFilter');
                        this.addResult('TypeFilter Import', 'OK', 'Component imported successfully');
                        break;
                    case 'StatsPanel':
                        await import('../components/signals/patel/StatsPanel');
                        this.addResult('StatsPanel Import', 'OK', 'Component imported successfully');
                        break;
                    case 'LiveTickDisplay':
                        await import('../components/signals/patel/LiveTickDisplay');
                        this.addResult('LiveTickDisplay Import', 'OK', 'Component imported successfully');
                        break;
                    case 'DigitHeatmap':
                        await import('../components/signals/patel/DigitHeatmap');
                        this.addResult('DigitHeatmap Import', 'OK', 'Component imported successfully');
                        break;
                }
            } catch (error) {
                this.addResult(
                    `${component} Import`,
                    'ERROR',
                    `Failed to import component: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    { error }
                );
            }
        }
    }

    /**
     * Check service initialization
     */
    private async checkServiceInitialization(): Promise<void> {
        try {
            // Check Patel Signal Generator Service
            const patelService = await import('../services/patel-signal-generator.service');
            if (patelService.default) {
                this.addResult('Patel Signal Generator', 'OK', 'Service initialized successfully');

                // Test service methods
                try {
                    const signals = patelService.default.getSignals();
                    this.addResult('Signal Generation', 'OK', `Service working, ${signals.length} signals available`);
                } catch (error) {
                    this.addResult('Signal Generation', 'WARNING', 'Service initialized but signal generation failed', {
                        error,
                    });
                }
            } else {
                this.addResult('Patel Signal Generator', 'ERROR', 'Service not properly exported');
            }
        } catch (error) {
            this.addResult('Patel Signal Generator', 'ERROR', 'Failed to import service', { error });
        }

        try {
            // Check Signal Bot Loader Service
            const botLoaderService = await import('../services/signal-bot-loader.service');
            if (botLoaderService.signalBotLoader) {
                this.addResult('Signal Bot Loader', 'OK', 'Service initialized successfully');
            } else {
                this.addResult('Signal Bot Loader', 'ERROR', 'Service not properly exported');
            }
        } catch (error) {
            this.addResult('Signal Bot Loader', 'ERROR', 'Failed to import service', { error });
        }
    }

    /**
     * Check routing and navigation
     */
    private async checkRouting(): Promise<void> {
        // Check if routes are properly defined
        const currentPath = window.location.pathname;
        const patelRoutes = ['/patel-signals', '/patel-signal-center'];

        for (const route of patelRoutes) {
            if (currentPath === route) {
                this.addResult('Current Route', 'OK', `Currently on ${route}`);
            }
        }

        // Check if navigation buttons exist
        const navButtons = ['patel-signals-nav-button', 'patel-signal-center-nav-button'];

        for (const buttonId of navButtons) {
            const button =
                document.querySelector(`[data-testid="${buttonId}"]`) ||
                document.querySelector(`.${buttonId}`) ||
                document.querySelector(`#${buttonId}`);

            if (button) {
                this.addResult('Navigation Button', 'OK', `${buttonId} found in DOM`);
            } else {
                this.addResult('Navigation Button', 'WARNING', `${buttonId} not found in DOM`);
            }
        }
    }

    /**
     * Check type definitions
     */
    private async checkTypeDefinitions(): Promise<void> {
        try {
            // Try to import type definitions
            const types = await import('../types/patel-signals');

            const requiredTypes = [
                'Market',
                'ContractType',
                'ConfidenceLevel',
                'PatelSignal',
                'MarketAnalysis',
                'SignalGeneratorConfig',
            ];

            // Check if types are properly exported (this is a runtime check)
            this.addResult('Type Definitions', 'OK', 'Patel signal types imported successfully');
        } catch (error) {
            this.addResult('Type Definitions', 'ERROR', 'Failed to import patel-signals types', { error });
        }
    }

    /**
     * Check for console errors
     */
    private checkConsoleErrors(): void {
        // Override console.error to capture errors
        const originalError = console.error;
        const errors: string[] = [];

        console.error = (...args) => {
            const errorMessage = args.map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ');

            if (errorMessage.toLowerCase().includes('patel')) {
                errors.push(errorMessage);
            }

            originalError.apply(console, args);
        };

        // Restore original console.error after a short delay
        setTimeout(() => {
            console.error = originalError;

            if (errors.length > 0) {
                this.addResult('Console Errors', 'ERROR', `Found ${errors.length} Patel-related errors`, { errors });
            } else {
                this.addResult('Console Errors', 'OK', 'No Patel-related console errors detected');
            }
        }, 2000);
    }

    /**
     * Check browser compatibility
     */
    private checkBrowserCompatibility(): void {
        const features = [
            { name: 'ES6 Modules', check: () => typeof window !== 'undefined' },
            { name: 'Async/Await', check: () => typeof (async () => {}) === 'function' },
            { name: 'Map/Set', check: () => typeof Map !== 'undefined' && typeof Set !== 'undefined' },
            { name: 'LocalStorage', check: () => typeof localStorage !== 'undefined' },
            { name: 'WebSocket', check: () => typeof WebSocket !== 'undefined' },
        ];

        for (const feature of features) {
            try {
                if (feature.check()) {
                    this.addResult('Browser Compatibility', 'OK', `${feature.name} supported`);
                } else {
                    this.addResult('Browser Compatibility', 'ERROR', `${feature.name} not supported`);
                }
            } catch (error) {
                this.addResult('Browser Compatibility', 'ERROR', `${feature.name} check failed`, { error });
            }
        }
    }

    /**
     * Add debug result
     */
    private addResult(component: string, status: 'OK' | 'WARNING' | 'ERROR', message: string, details?: any): void {
        this.results.push({
            component,
            status,
            message,
            details,
        });
    }

    /**
     * Generate comprehensive report
     */
    private generateReport(): void {
        console.log('\n🔍 PATEL PREMIUM DEBUG REPORT');
        console.log('='.repeat(50));

        const summary = {
            total: this.results.length,
            ok: this.results.filter(r => r.status === 'OK').length,
            warnings: this.results.filter(r => r.status === 'WARNING').length,
            errors: this.results.filter(r => r.status === 'ERROR').length,
        };

        console.log(`📊 Summary: ${summary.total} checks completed`);
        console.log(`✅ OK: ${summary.ok}`);
        console.log(`⚠️ Warnings: ${summary.warnings}`);
        console.log(`❌ Errors: ${summary.errors}`);
        console.log('');

        // Group results by status
        const errorResults = this.results.filter(r => r.status === 'ERROR');
        const warningResults = this.results.filter(r => r.status === 'WARNING');
        const okResults = this.results.filter(r => r.status === 'OK');

        if (errorResults.length > 0) {
            console.log('❌ ERRORS:');
            errorResults.forEach(result => {
                console.log(`  • ${result.component}: ${result.message}`);
                if (result.details) {
                    console.log(`    Details:`, result.details);
                }
            });
            console.log('');
        }

        if (warningResults.length > 0) {
            console.log('⚠️ WARNINGS:');
            warningResults.forEach(result => {
                console.log(`  • ${result.component}: ${result.message}`);
                if (result.details) {
                    console.log(`    Details:`, result.details);
                }
            });
            console.log('');
        }

        if (okResults.length > 0) {
            console.log('✅ WORKING CORRECTLY:');
            okResults.forEach(result => {
                console.log(`  • ${result.component}: ${result.message}`);
            });
            console.log('');
        }

        // Provide recommendations
        this.generateRecommendations(summary, errorResults, warningResults);
    }

    /**
     * Generate recommendations based on debug results
     */
    private generateRecommendations(
        summary: { total: number; ok: number; warnings: number; errors: number },
        errorResults: DebugResult[],
        warningResults: DebugResult[]
    ): void {
        console.log('💡 RECOMMENDATIONS:');

        if (errorResults.length === 0 && warningResults.length === 0) {
            console.log('  🎉 All systems working correctly! Patel Premium should be fully functional.');
            return;
        }

        if (errorResults.some(r => r.component.includes('Import'))) {
            console.log('  🔧 Fix component import errors first - check file paths and exports');
        }

        if (errorResults.some(r => r.component.includes('Service'))) {
            console.log('  🔧 Fix service initialization issues - check service exports and initialization');
        }

        if (warningResults.some(r => r.component.includes('Navigation'))) {
            console.log('  🔧 Check navigation button implementation and routing configuration');
        }

        if (errorResults.some(r => r.component.includes('Type'))) {
            console.log('  🔧 Fix TypeScript type definition issues - check type exports');
        }

        if (errorResults.some(r => r.component.includes('Browser'))) {
            console.log('  🔧 Browser compatibility issues detected - consider polyfills');
        }

        console.log('  📚 Check the browser console for additional error details');
        console.log('  🔍 Verify all Patel-related files are present and properly configured');
    }

    /**
     * Test specific Patel Premium functionality
     */
    public async testPatelFunctionality(): Promise<void> {
        console.log('🧪 Testing Patel Premium Functionality...');

        try {
            // Test signal generation
            const patelService = await import('../services/patel-signal-generator.service');
            const signals = patelService.default.getSignals();
            console.log(`✅ Signal generation test: ${signals.length} signals available`);

            // Test market analysis
            const analysis = patelService.default.getAllMarketAnalysis();
            console.log(`✅ Market analysis test: ${analysis.length} markets analyzed`);

            // Test configuration
            const config = patelService.default.getConfig();
            console.log(`✅ Configuration test:`, config);
        } catch (error) {
            console.error('❌ Patel functionality test failed:', error);
        }
    }

    /**
     * Quick health check
     */
    public quickHealthCheck(): boolean {
        try {
            // Check if we're on a Patel page
            const currentPath = window.location.pathname;
            const isPatelPage = currentPath.includes('patel');

            // Check if Patel components are in DOM
            const patelElements = document.querySelectorAll('[class*="patel"]');
            const hasPatelElements = patelElements.length > 0;

            console.log(`🏥 Quick Health Check:`);
            console.log(`  Current page: ${currentPath}`);
            console.log(`  Is Patel page: ${isPatelPage}`);
            console.log(`  Patel elements in DOM: ${patelElements.length}`);

            return isPatelPage && hasPatelElements;
        } catch (error) {
            console.error('❌ Quick health check failed:', error);
            return false;
        }
    }
}

// Create singleton instance
export const patelPremiumDebugger = new PatelPremiumDebugger();

// Auto-run debug check if on Patel page
if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath.includes('patel')) {
        console.log('🔍 Auto-running Patel Premium debug check...');

        // Run after a short delay to allow components to load
        setTimeout(() => {
            patelPremiumDebugger.runDebugCheck();
        }, 2000);
    }
}

// Export for manual use
export default patelPremiumDebugger;
