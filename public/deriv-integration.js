/**
 * Deriv Integration Script
 *
 * This script connects the Deriv Run button to the Zen Trading Controller
 * Inject this script into the Deriv page to enable zen page trading control
 */

(function () {
    'use strict';

    console.log('🎯 Deriv-Zen Integration Script Loading...');

    // Configuration
    const ZEN_PAGE_URL = 'http://localhost:3000/zen'; // Update this to your zen page URL
    const CHECK_INTERVAL = 1000; // Check every 1 second
    const MAX_RETRIES = 30; // Try for 30 seconds

    let retryCount = 0;
    let zenController = null;
    let originalRunButton = null;
    let statusInterval = null;

    /**
     * Check if zen trading controller is available
     */
    function checkZenController() {
        // Check if zen page is open in another tab/window
        if (window.zenTradingController && window.zenTradingController.isAvailable()) {
            zenController = window.zenTradingController;
            console.log('✅ Zen Trading Controller found!');
            return true;
        }

        // Try to access from parent window (if in iframe)
        if (window.parent && window.parent.zenTradingController && window.parent.zenTradingController.isAvailable()) {
            zenController = window.parent.zenTradingController;
            console.log('✅ Zen Trading Controller found in parent window!');
            return true;
        }

        return false;
    }

    /**
     * Find and hijack the Deriv Run button
     */
    function hijackRunButton() {
        // Look for common Deriv run button selectors
        const selectors = [
            'button[data-testid="run-button"]',
            'button:contains("Run")',
            '.run-button',
            '[class*="run"]',
            'button[class*="run"]',
        ];

        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button && button.textContent.toLowerCase().includes('run')) {
                originalRunButton = button;
                console.log('🎯 Found Deriv Run button:', button);
                return button;
            }
        }

        // Fallback: look for any button with "Run" text
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
            if (button.textContent.toLowerCase().trim() === 'run') {
                originalRunButton = button;
                console.log('🎯 Found Deriv Run button (fallback):', button);
                return button;
            }
        }

        return null;
    }

    /**
     * Create zen status indicator
     */
    function createStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'zen-status-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #1a1f2e;
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            z-index: 10000;
            border: 1px solid #2d3748;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            min-width: 200px;
        `;

        document.body.appendChild(indicator);
        return indicator;
    }

    /**
     * Update status indicator
     */
    function updateStatusIndicator(indicator) {
        if (!zenController) {
            indicator.innerHTML = `
                <div style="color: #f56565;">❌ Zen Controller Not Found</div>
                <div style="font-size: 10px; color: #a0aec0; margin-top: 4px;">
                    Open zen page: <a href="${ZEN_PAGE_URL}" target="_blank" style="color: #4299e1;">Click here</a>
                </div>
            `;
            return;
        }

        const status = zenController.getStatus();
        const settings = status.settings;

        indicator.innerHTML = `
            <div style="color: #48bb78;">✅ Zen Controller Connected</div>
            <div style="font-size: 10px; color: #a0aec0; margin-top: 4px;">
                Status: ${status.isRunning ? '🟢 Running' : '⚪ Ready'} | 
                Trades: ${status.transactions} | 
                Mode: ${status.mode}
            </div>
            ${
                settings
                    ? `
                <div style="font-size: 9px; color: #718096; margin-top: 2px;">
                    ${settings.market} | ${settings.tradeType} | $${settings.stake} | ${settings.duration}t
                </div>
            `
                    : ''
            }
        `;
    }

    /**
     * Handle run button click
     */
    async function handleRunClick(event) {
        event.preventDefault();
        event.stopPropagation();

        if (!zenController) {
            alert('❌ Zen Trading Controller not available!\n\nPlease open the zen page first.');
            return;
        }

        const status = zenController.getStatus();

        if (status.isRunning) {
            // Stop trading
            const success = await zenController.stopTrading();
            if (success) {
                console.log('🛑 Zen trading stopped via Deriv button');
            } else {
                alert('❌ Failed to stop zen trading');
            }
        } else {
            // Start trading
            const success = await zenController.startTrading();
            if (success) {
                console.log('🚀 Zen trading started via Deriv button');
            } else {
                alert('❌ Failed to start zen trading');
            }
        }
    }

    /**
     * Initialize the integration
     */
    function initialize() {
        console.log('🎯 Initializing Deriv-Zen Integration...');

        // Create status indicator
        const statusIndicator = createStatusIndicator();

        // Start checking for zen controller
        const checkInterval = setInterval(() => {
            retryCount++;

            if (checkZenController()) {
                clearInterval(checkInterval);

                // Find and hijack run button
                const runButton = hijackRunButton();
                if (runButton) {
                    // Remove original click handlers
                    const newButton = runButton.cloneNode(true);
                    runButton.parentNode.replaceChild(newButton, runButton);

                    // Add our handler
                    newButton.addEventListener('click', handleRunClick);

                    // Update button appearance
                    newButton.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
                    newButton.style.border = '1px solid #48bb78';
                    newButton.title = 'Run Zen Trading (Connected to Zen Page)';

                    console.log('✅ Deriv Run button hijacked successfully!');

                    // Start status updates
                    statusInterval = setInterval(() => {
                        updateStatusIndicator(statusIndicator);

                        // Update button text based on zen status
                        const status = zenController.getStatus();
                        newButton.textContent = status.isRunning ? 'Stop' : 'Run';
                        newButton.style.background = status.isRunning
                            ? 'linear-gradient(135deg, #f56565, #e53e3e)'
                            : 'linear-gradient(135deg, #48bb78, #38a169)';
                    }, 1000);
                } else {
                    console.warn('⚠️ Could not find Deriv Run button');
                }
            } else if (retryCount >= MAX_RETRIES) {
                clearInterval(checkInterval);
                console.warn('⚠️ Zen Trading Controller not found after 30 seconds');
            }

            updateStatusIndicator(statusIndicator);
        }, CHECK_INTERVAL);
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    console.log('🎯 Deriv-Zen Integration Script Loaded');
})();
