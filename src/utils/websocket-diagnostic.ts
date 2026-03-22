/**
 * WebSocket Diagnostic Tool
 * Tests direct connection to Deriv WebSocket API to verify data authenticity
 */

interface DiagnosticResult {
    success: boolean;
    message: string;
    data?: any;
    timestamp: number;
}

export class WebSocketDiagnostic {
    private ws: WebSocket | null = null;
    private results: DiagnosticResult[] = [];
    private isRunning: boolean = false;

    /**
     * Test direct WebSocket connection to Deriv API
     */
    public async testDirectConnection(appId: string = '110800', symbol: string = 'R_100'): Promise<DiagnosticResult[]> {
        this.results = [];
        this.isRunning = true;

        return new Promise((resolve) => {
            console.log(`🔍 Starting WebSocket diagnostic for ${symbol} with App ID ${appId}...`);
            
            // Connect directly to Deriv WebSocket
            const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${appId}`;
            this.ws = new WebSocket(wsUrl);

            let tickCount = 0;
            const maxTicks = 10; // Collect 10 ticks for analysis
            const timeout = setTimeout(() => {
                this.addResult(false, 'Timeout: No ticks received within 30 seconds');
                this.cleanup();
                resolve(this.results);
            }, 30000);

            this.ws.onopen = () => {
                this.addResult(true, `Connected to Deriv WebSocket: ${wsUrl}`);
                
                // Subscribe to ticks
                const subscribeMessage = {
                    ticks: symbol,
                    subscribe: 1
                };
                
                this.ws?.send(JSON.stringify(subscribeMessage));
                this.addResult(true, `Subscribed to ${symbol} ticks`);
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.tick) {
                        tickCount++;
                        const quote = parseFloat(data.tick.quote);
                        const lastDigit = this.extractLastDigit(quote);
                        
                        this.addResult(true, `Tick ${tickCount}: ${quote} → Digit: ${lastDigit}`, {
                            tick: data.tick,
                            quote,
                            lastDigit,
                            epoch: data.tick.epoch,
                            symbol: data.tick.symbol
                        });

                        if (tickCount >= maxTicks) {
                            clearTimeout(timeout);
                            this.addResult(true, `Diagnostic complete: Collected ${tickCount} authentic ticks`);
                            this.cleanup();
                            resolve(this.results);
                        }
                    } else if (data.error) {
                        this.addResult(false, `WebSocket error: ${data.error.message}`, data.error);
                    } else {
                        this.addResult(true, 'Received non-tick message', data);
                    }
                } catch (error) {
                    this.addResult(false, `Failed to parse WebSocket message: ${error}`, event.data);
                }
            };

            this.ws.onerror = (error) => {
                this.addResult(false, `WebSocket connection error: ${error}`);
                clearTimeout(timeout);
                this.cleanup();
                resolve(this.results);
            };

            this.ws.onclose = (event) => {
                this.addResult(false, `WebSocket closed: Code ${event.code}, Reason: ${event.reason}`);
                clearTimeout(timeout);
                resolve(this.results);
            };
        });
    }

    /**
     * Extract last digit from quote (multiple methods for comparison)
     */
    private extractLastDigit(quote: number): { method1: number, method2: number, method3: number, recommended: number } {
        // Method 1: Current implementation
        const method1 = Math.floor((quote * 100) % 10);
        
        // Method 2: Alternative precision
        const method2 = Math.floor((quote * 1000) % 10);
        
        // Method 3: String-based (most reliable for decimal precision)
        const quoteStr = quote.toFixed(5);
        const digitsOnly = quoteStr.replace('.', '');
        const method3 = parseInt(digitsOnly.slice(-1));
        
        // Recommended method (string-based for accuracy)
        const recommended = method3;
        
        return { method1, method2, method3, recommended };
    }

    /**
     * Add diagnostic result
     */
    private addResult(success: boolean, message: string, data?: any): void {
        const result: DiagnosticResult = {
            success,
            message,
            data,
            timestamp: Date.now()
        };
        
        this.results.push(result);
        console.log(`${success ? '✅' : '❌'} ${message}`, data || '');
    }

    /**
     * Cleanup WebSocket connection
     */
    private cleanup(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isRunning = false;
    }

    /**
     * Generate diagnostic report
     */
    public generateReport(): string {
        let report = '🔍 WEBSOCKET DIAGNOSTIC REPORT\n';
        report += '=====================================\n\n';
        
        const successCount = this.results.filter(r => r.success).length;
        const totalCount = this.results.length;
        
        report += `📊 SUMMARY:\n`;
        report += `- Total operations: ${totalCount}\n`;
        report += `- Successful: ${successCount} (${((successCount / totalCount) * 100).toFixed(1)}%)\n`;
        report += `- Failed: ${totalCount - successCount} (${(((totalCount - successCount) / totalCount) * 100).toFixed(1)}%)\n\n`;
        
        report += `📋 DETAILED LOG:\n`;
        this.results.forEach((result, index) => {
            const status = result.success ? '✅' : '❌';
            const time = new Date(result.timestamp).toLocaleTimeString();
            report += `${index + 1}. [${time}] ${status} ${result.message}\n`;
            
            if (result.data && result.data.quote) {
                const digits = this.extractLastDigit(result.data.quote);
                report += `   Quote: ${result.data.quote} | Digits: M1=${digits.method1}, M2=${digits.method2}, M3=${digits.method3}\n`;
            }
        });
        
        return report;
    }

    /**
     * Get results
     */
    public getResults(): DiagnosticResult[] {
        return [...this.results];
    }

    /**
     * Check if diagnostic is running
     */
    public isRunningDiagnostic(): boolean {
        return this.isRunning;
    }
}

// Create singleton instance
export const webSocketDiagnostic = new WebSocketDiagnostic();
