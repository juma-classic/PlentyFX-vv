// Performance monitoring utilities
export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: Map<string, number> = new Map();

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    // Mark the start of a performance measurement
    mark(name: string): void {
        if ('performance' in window && performance.mark) {
            performance.mark(`${name}-start`);
        }
        this.metrics.set(`${name}-start`, Date.now());
    }

    // Measure the time since mark was called
    measure(name: string): number {
        const startTime = this.metrics.get(`${name}-start`);
        if (!startTime) {
            console.warn(`No start mark found for ${name}`);
            return 0;
        }

        const duration = Date.now() - startTime;
        
        if ('performance' in window && performance.mark && performance.measure) {
            performance.mark(`${name}-end`);
            performance.measure(name, `${name}-start`, `${name}-end`);
        }

        this.metrics.set(name, duration);
        return duration;
    }

    // Get Core Web Vitals
    getCoreWebVitals(): Promise<{
        fcp?: number;
        lcp?: number;
        fid?: number;
        cls?: number;
    }> {
        return new Promise((resolve) => {
            const vitals: any = {};

            // First Contentful Paint
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (entry.name === 'first-contentful-paint') {
                                vitals.fcp = entry.startTime;
                            }
                        }
                    });
                    observer.observe({ entryTypes: ['paint'] });
                } catch (e) {
                    console.warn('Performance Observer not supported');
                }
            }

            // Fallback to basic timing
            setTimeout(() => {
                if (performance.timing) {
                    const timing = performance.timing;
                    vitals.loadTime = timing.loadEventEnd - timing.navigationStart;
                    vitals.domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
                }
                resolve(vitals);
            }, 1000);
        });
    }

    // Log performance metrics
    logMetrics(): void {
        console.group('🚀 Performance Metrics');
        this.metrics.forEach((value, key) => {
            if (!key.endsWith('-start')) {
                console.log(`${key}: ${value}ms`);
            }
        });
        console.groupEnd();
    }

    // Get resource loading times
    getResourceTimings(): PerformanceResourceTiming[] {
        if ('performance' in window && performance.getEntriesByType) {
            return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        }
        return [];
    }

    // Analyze slow resources
    analyzeSlowResources(threshold: number = 1000): void {
        const resources = this.getResourceTimings();
        const slowResources = resources.filter(resource => resource.duration > threshold);
        
        if (slowResources.length > 0) {
            console.group('⚠️ Slow Resources (>' + threshold + 'ms)');
            slowResources.forEach(resource => {
                console.log(`${resource.name}: ${Math.round(resource.duration)}ms`);
            });
            console.groupEnd();
        }
    }
}

// Initialize performance monitoring
export const performanceMonitor = PerformanceMonitor.getInstance();

// Auto-monitor app initialization
if (typeof window !== 'undefined') {
    performanceMonitor.mark('app-init');
    
    window.addEventListener('load', () => {
        performanceMonitor.measure('app-init');
        
        // Log metrics after page load
        setTimeout(() => {
            performanceMonitor.logMetrics();
            performanceMonitor.analyzeSlowResources();
        }, 2000);
    });
}