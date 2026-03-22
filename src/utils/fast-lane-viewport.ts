/**
 * Fast Lane Viewport Utility
 * Manages full viewport width for Fast Lane components
 */

export class FastLaneViewportManager {
    private static instance: FastLaneViewportManager;
    private isActive = false;

    static getInstance(): FastLaneViewportManager {
        if (!FastLaneViewportManager.instance) {
            FastLaneViewportManager.instance = new FastLaneViewportManager();
        }
        return FastLaneViewportManager.instance;
    }

    /**
     * Enable full viewport width for Fast Lane
     */
    enableFullViewport(): void {
        if (this.isActive) return;

        this.isActive = true;
        
        // Add classes to html and body
        document.documentElement.classList.add('fast-lane-active');
        document.body.classList.add('fast-lane-active');

        // Apply inline styles for immediate effect
        const style = document.createElement('style');
        style.id = 'fast-lane-viewport-styles';
        style.textContent = `
            /* Remove all height constraints and allow natural scrolling */
            html.fast-lane-active,
            body.fast-lane-active {
                width: 100vw !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow-x: hidden !important;
                overflow-y: visible !important;
                height: auto !important;
            }
            
            /* Main layout - remove height constraints */
            .main--fast-lane {
                width: 100vw !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                height: auto !important;
                min-height: 0 !important;
            }
            
            /* Container - allow natural height */
            .main--fast-lane .main__container {
                width: 100vw !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                height: auto !important;
                min-height: 0 !important;
            }
            
            /* Fast Lane components - natural height */
            .fast-lane-tab-content,
            .fast-lane-container,
            .fast-lane-wrapper,
            .speed-bot-container,
            .fast-lane-dashboard {
                width: 100vw !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                height: auto !important;
                min-height: 0 !important;
            }
        `;
        
        document.head.appendChild(style);
        
        console.log('✅ Fast Lane full viewport mode enabled');
    }

    /**
     * Disable full viewport width (restore normal layout)
     */
    disableFullViewport(): void {
        if (!this.isActive) return;

        this.isActive = false;
        
        // Remove classes
        document.documentElement.classList.remove('fast-lane-active');
        document.body.classList.remove('fast-lane-active');

        // Remove inline styles
        const style = document.getElementById('fast-lane-viewport-styles');
        if (style) {
            style.remove();
        }
        
        console.log('✅ Fast Lane full viewport mode disabled');
    }

    /**
     * Check if full viewport mode is active
     */
    isFullViewportActive(): boolean {
        return this.isActive;
    }

    /**
     * Toggle full viewport mode
     */
    toggleFullViewport(): void {
        if (this.isActive) {
            this.disableFullViewport();
        } else {
            this.enableFullViewport();
        }
    }
}

// Export singleton instance
export const fastLaneViewport = FastLaneViewportManager.getInstance();

// Auto-enable when Fast Lane tab is detected
export const initializeFastLaneViewport = (): void => {
    // Watch for Fast Lane tab activation
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target as HTMLElement;
                
                // Check if main container has fast-lane class
                if (target.classList.contains('main--fast-lane')) {
                    fastLaneViewport.enableFullViewport();
                } else if (target.classList.contains('main') && !target.classList.contains('main--fast-lane')) {
                    fastLaneViewport.disableFullViewport();
                }
            }
        });
    });

    // Start observing
    const mainContainer = document.querySelector('.main');
    if (mainContainer) {
        observer.observe(mainContainer, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    // Also watch for tab changes
    const tabsContainer = document.querySelector('.dc-tabs');
    if (tabsContainer) {
        observer.observe(tabsContainer, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    }
};