/* global Chart, RobustWebSocketManager */
let derivWs;
let robustWsManager;
let tickHistory = [];
// Load from localStorage or use defaults
let currentSymbol = localStorage.getItem('zeusSelectedMarket') || 'R_50';
let tickCount = parseInt(localStorage.getItem('zeusTickCount')) || 1000;
let decimalPlaces = 3;

let digitChart, evenOddChart, riseFallChart;

// Advanced Analysis
let advancedAnalysis = null;
let analysisResults = null;

// Technical Analysis
let technicalAnalysis = null;
let technicalResults = null;

// Tick log for robust synchronization and analysis
let tickLog = [];

// Enhanced Trading Modes with Dropdown Selection
let currentTradingMode = 'patel'; // Default mode
let selectedTradingStrategy = 'traditional'; // Default strategy for Patel mode
let selectedDigit = null; // Currently selected digit for fast trading

// Utility: Log a tick (history or live)
function logTick(epoch, quote, source) {
    tickLog.push({
        time: epoch,
        quote: quote,
        source: source,
        localTime: Date.now(),
    });
}

// Utility: Download tick log as CSV
function downloadTickLog() {
    if (tickLog.length === 0) return;
    const header = 'epoch,quote,source,localTime\n';
    const rows = tickLog.map(t => `${t.time},${t.quote},${t.source},${t.localTime}`);
    const csv = header + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tick_log.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- Data Synchronization & Integrity ---
// Detect missing epochs in tickHistory
function detectGaps() {
    if (tickHistory.length < 2) return [];
    let gaps = [];
    for (let i = 1; i < tickHistory.length; i++) {
        let expected = tickHistory[i - 1].time + 1;
        if (tickHistory[i].time !== expected) {
            gaps.push({ from: tickHistory[i - 1].time, to: tickHistory[i].time });
        }
    }
    return gaps;
}

// Fetch missing ticks from Deriv REST API and fill gaps
async function backfillGaps() {
    const gaps = detectGaps();
    let error = null;
    for (const gap of gaps) {
        const url = `https://api.deriv.com/api/ticks_history/${currentSymbol}?end=${gap.to}&start=${gap.from + 1}&style=ticks&count=${gap.to - gap.from - 1}`;
        try {
            const resp = await fetch(url);
            const json = await resp.json();
            if (json.history && Array.isArray(json.history.times)) {
                for (let i = 0; i < json.history.times.length; i++) {
                    tickHistory.push({
                        time: json.history.times[i],
                        quote: parseFloat(json.history.prices[i]),
                        originalQuote: json.history.prices[i],
                    });
                }
                tickHistory.sort((a, b) => a.time - b.time);
            }
        } catch (e) {
            error = e;
            console.warn('Backfill error:', e);
        }
    }
    updateUI();
    updateSyncStatus('backfill', error);
}

// Compare WebSocket tickHistory with REST API
async function compareWithRestApi() {
    const count = Math.min(100, tickHistory.length);
    const url = `https://api.deriv.com/api/ticks_history/${currentSymbol}?end=latest&count=${count}&style=ticks`;
    let restTicks = [];
    let error = null;
    try {
        const resp = await fetch(url);
        const json = await resp.json();
        if (json.history && Array.isArray(json.history.times)) {
            restTicks = json.history.times.map((t, i) => ({
                time: t,
                quote: parseFloat(json.history.prices[i]),
                originalQuote: json.history.prices[i],
            }));
        }
    } catch (e) {
        error = e;
        console.warn('REST API fetch error:', e);
    }
    let diffs = [];
    for (let i = 0; i < count; i++) {
        const wsTick = tickHistory[tickHistory.length - count + i];
        const restTick = restTicks[i];
        if (!wsTick || !restTick) continue;
        if (wsTick.time !== restTick.time || Math.abs(wsTick.quote - restTick.quote) > 1e-8) {
            diffs.push({ ws: wsTick, rest: restTick });
        }
    }
    showDiffResults(diffs);
    updateSyncStatus('compare', error, diffs.length);
}

// Automated periodic checks
let syncCheckIntervalMs = 2 * 60 * 1000; // 2 minutes
let syncCheckTimer = null;
function updateSyncStatus(type, error, diffCount) {
    const el = document.getElementById('sync-status');
    if (!el) return;
    let msg = '';
    if (type === 'backfill') {
        msg = error
            ? `Last gap backfill: <span style="color:red">Error</span>`
            : `Last gap backfill: <span style="color:green">OK</span>`;
    } else if (type === 'compare') {
        if (error) msg = `Last REST compare: <span style="color:red">Error</span>`;
        else if (diffCount) msg = `Last REST compare: <span style="color:orange">${diffCount} mismatches</span>`;
        else msg = `Last REST compare: <span style="color:green">No mismatches</span>`;
    }
    el.innerHTML = msg + ` <span style="color:#888;font-size:0.9em">(${new Date().toLocaleTimeString()})</span>`;
}

function startSyncAutomation() {
    // Clear existing interval to prevent duplicates
    stopSyncAutomation();

    syncCheckTimer = setInterval(async () => {
        await backfillGaps();
        await compareWithRestApi();
    }, syncCheckIntervalMs);
}

// Function to stop sync automation
function stopSyncAutomation() {
    if (syncCheckTimer) {
        clearInterval(syncCheckTimer);
        syncCheckTimer = null;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Start automated sync checks
    startSyncAutomation();
});

// Show visual diff results in UI
function showDiffResults(diffs) {
    const diffEl = document.getElementById('diff-results');
    if (!diffEl) return;
    if (!diffs.length) {
        diffEl.innerHTML = '<div style="color:green">No mismatches found!</div>';
        return;
    }
    let html = `<table style="width:100%;font-size:0.95em"><tr><th>Index</th><th>WS Time</th><th>WS Price</th><th>REST Time</th><th>REST Price</th></tr>`;
    diffs.forEach((d, i) => {
        html += `<tr style="background:${d.ws.time !== d.rest.time ? '#ffe0e0' : '#fffbe0'}"><td>${i + 1}</td><td>${d.ws.time}</td><td>${d.ws.quote}</td><td>${d.rest.time}</td><td>${d.rest.quote}</td></tr>`;
    });
    html += '</table>';
    diffEl.innerHTML = html;
}

// --- Periodic and manual resync logic ---
let resyncIntervalMs = 5 * 60 * 1000; // 5 minutes
let resyncTimer = null;
let lastResyncTime = null;

function resyncTicks() {
    tickHistory = [];
    startWebSocket();
    lastResyncTime = Date.now();
    updateResyncStatus();
}

function updateResyncStatus() {
    const statusEl = document.getElementById('resync-status');
    if (statusEl) {
        if (lastResyncTime) {
            const d = new Date(lastResyncTime);
            statusEl.textContent = `Last resync: ${d.toLocaleTimeString()}`;
        } else {
            statusEl.textContent = 'No resync yet';
        }
    }
}

function startPeriodicResync() {
    // Clear existing interval to prevent duplicates
    stopPeriodicResync();

    resyncTimer = setInterval(resyncTicks, resyncIntervalMs);
}

// Function to stop periodic resync
function stopPeriodicResync() {
    if (resyncTimer) {
        clearInterval(resyncTimer);
        resyncTimer = null;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const resyncBtn = document.getElementById('resync-ticks-btn');
    if (resyncBtn) {
        addTrackedEventListener(resyncBtn, 'click', resyncTicks);
    }
    const downloadBtn = document.getElementById('download-tick-log-btn');
    if (downloadBtn) {
        addTrackedEventListener(downloadBtn, 'click', downloadTickLog);
    }
    // Add a status indicator for resync
    updateResyncStatus();
    // Start periodic resync
    startPeriodicResync();
});

// Function to cleanup WebSocket connection
function cleanupWebSocket() {
    if (robustWsManager) {
        robustWsManager.disconnect();
        robustWsManager = null;
    }

    // Legacy cleanup for direct WebSocket (fallback)
    if (derivWs) {
        derivWs.onopen = null;
        derivWs.onmessage = null;
        derivWs.onerror = null;
        derivWs.onclose = null;

        if (derivWs.readyState === WebSocket.OPEN || derivWs.readyState === WebSocket.CONNECTING) {
            derivWs.close();
        }

        derivWs = null;
    }
}

// Function to start WebSocket with robust connection management
function startWebSocket() {
    // Cleanup existing connection first
    cleanupWebSocket();

    // Add debugging for RobustWebSocketManager availability
    console.log('🔍 Checking RobustWebSocketManager availability...');
    console.log('typeof RobustWebSocketManager:', typeof RobustWebSocketManager);
    
    // Initialize robust WebSocket manager
    if (typeof RobustWebSocketManager !== 'undefined') {
        console.log('🔧 Initializing Robust WebSocket Manager...');

        try {
            robustWsManager = new RobustWebSocketManager();
            console.log('✅ RobustWebSocketManager created successfully');

            // Add connection status indicator to page
            robustWsManager.addConnectionStatusIndicator();

            // Set up callbacks with enhanced error handling
            robustWsManager.setCallbacks({
                onConnected: () => {
                    console.log('✅ Robust WebSocket connected - requesting tick history');
                    updateConnectionStatusMessage('Connected - Loading data...');
                    requestTickHistory();
                },

                onDisconnected: event => {
                    console.warn('⚠️ Robust WebSocket disconnected:', event.code, event.reason);
                    updateConnectionStatusMessage('Disconnected - Reconnecting...');
                    // NOTE: Mock data fallback removed - This is a REAL MONEY trading platform
                    // The robust manager will automatically attempt to reconnect
                },

                onMessage: data => {
                    handleWebSocketMessage(data);
                },

                onError: error => {
                    console.error('❌ Robust WebSocket error:', error);

                    // Enhanced error logging for debugging
                    if (error.code) {
                        console.error(`Error Code: ${error.code}, Message: ${error.message}`);
                    }

                    // Update UI to show error state
                    updateErrorDisplay(error);
                    updateConnectionStatusMessage('Connection Error');
                },
            });

            // Connect using robust manager
            console.log('🔌 Attempting to connect...');
            updateConnectionStatusMessage('Connecting...');
            robustWsManager.connect();
        } catch (error) {
            console.error('❌ Failed to initialize RobustWebSocketManager:', error);
            updateConnectionStatusMessage('Initialization Error');
            startBasicWebSocket();
        }
    } else {
        console.warn('⚠️ RobustWebSocketManager not available, falling back to basic WebSocket');
        updateConnectionStatusMessage('Using fallback connection...');
        startBasicWebSocket();
    }
}

// Fallback basic WebSocket implementation
function startBasicWebSocket() {
    console.log('🔧 Starting basic WebSocket connection...');
    updateConnectionStatusMessage('Connecting (Basic)...');
    
    try {
        derivWs = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=110800');

        derivWs.onopen = function () {
            console.log('✅ Basic WebSocket connected');
            updateConnectionStatusMessage('Connected (Basic) - Loading data...');
            requestTickHistory();
        };

        derivWs.onmessage = function (event) {
            try {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            } catch (error) {
                console.error('❌ Error parsing WebSocket message:', error);
                updateConnectionStatusMessage('Message Parse Error');
            }
        };

        derivWs.onerror = function (error) {
            console.error('❌ Basic WebSocket error:', error);
            updateConnectionStatusMessage('WebSocket Error');
        };

        derivWs.onclose = function (event) {
            console.log('🔌 Basic WebSocket closed:', event.code, event.reason);
            updateConnectionStatusMessage('Disconnected - Reconnecting...');

            // Simple reconnection for basic WebSocket
            if (event.code !== 1000) {
                console.log('🔄 Attempting to reconnect in 5 seconds...');
                setTimeout(() => {
                    startBasicWebSocket();
                }, 5000);
            }
        };
    } catch (error) {
        console.error('❌ Failed to create basic WebSocket:', error);
        updateConnectionStatusMessage('Connection Failed');
    }
}

// Centralized message handler for both robust and basic WebSocket
function handleWebSocketMessage(data) {
    try {
        // Clear any previous error displays
        clearErrorDisplay();

        if (data.history) {
            tickHistory = data.history.prices.map((price, index) => {
                const epoch = data.history.times[index];
                const quote = parseFloat(price);
                logTick(epoch, quote, 'history');
                return { time: epoch, quote: quote, originalQuote: price };
            });
            detectDecimalPlaces();
            updateUI();
            console.log('📊 Loaded', tickHistory.length, 'historical ticks');

            // Update connection status to show data received
            updateConnectionStatusMessage(`Live Data (${tickHistory.length} ticks)`);
        } else if (data.tick) {
            let tickQuote = parseFloat(data.tick.quote);
            tickHistory.push({ time: data.tick.epoch, quote: tickQuote, originalQuote: data.tick.quote });
            logTick(data.tick.epoch, tickQuote, 'live');

            if (tickHistory.length > tickCount) tickHistory.shift();
            updateUI();

            // Update tick pointer visual feedback
            updateTickPointer();

            console.log('🎯 Live tick:', data.tick.epoch, tickQuote);

            // Update connection status with tick count
            updateConnectionStatusMessage(`Live Data (${tickHistory.length} ticks)`);
        } else if (data.error) {
            // Handle error responses that might slip through
            console.warn('⚠️ Error in message data:', data.error);
            updateErrorDisplay(data.error);
            updateConnectionStatusMessage('API Error - Check console');
        } else {
            // Log unhandled message types for debugging
            console.log('📨 Unhandled message type:', data.msg_type || 'unknown', data);
        }
    } catch (error) {
        console.error('❌ Error processing WebSocket message:', error);
        console.error('Raw data:', data);
        updateErrorDisplay({ message: 'Failed to process message data', code: 'PROCESSING_ERROR' });
        updateConnectionStatusMessage('Processing Error');
    }
}

// Function to update error display in UI
function updateErrorDisplay(error) {
    const errorContainer = document.getElementById('error-display');
    if (!errorContainer) {
        // Create error display if it doesn't exist
        const container = document.createElement('div');
        container.id = 'error-display';
        container.className = 'error-display';
        document.body.appendChild(container);
    }

    const errorEl = document.getElementById('error-display');
    const errorCode = error.code || 'UNKNOWN';
    const errorMessage = error.message || 'An unknown error occurred';

    errorEl.innerHTML = `
        <div class="error-content">
            <div class="error-icon">⚠️</div>
            <div class="error-details">
                <div class="error-title">Connection Issue</div>
                <div class="error-message">${errorMessage}</div>
                <div class="error-code">Error Code: ${errorCode}</div>
            </div>
            <button class="error-dismiss" onclick="clearErrorDisplay()">×</button>
        </div>
    `;

    errorEl.style.display = 'block';

    // Auto-hide after 10 seconds for non-critical errors
    if (errorCode !== 'CRITICAL') {
        setTimeout(() => {
            clearErrorDisplay();
        }, 10000);
    }
}

// Function to clear error display
function clearErrorDisplay() {
    const errorEl = document.getElementById('error-display');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

// Function to request tick history
function requestTickHistory() {
    const request = {
        ticks_history: currentSymbol,
        count: tickCount,
        end: 'latest',
        style: 'ticks',
        subscribe: 1,
    };

    // Send via robust manager if available, otherwise use basic WebSocket
    if (robustWsManager && robustWsManager.isConnected) {
        const success = robustWsManager.send(request);
        if (success) {
            console.log('📡 Tick history request sent via robust manager');

            // Set timeout to show helpful message if no data received
            setTimeout(() => {
                if (tickHistory.length === 0) {
                    console.warn('⏰ No tick data received after 10 seconds');
                    updateConnectionStatusMessage('Waiting for data from Deriv API...');
                }
            }, 10000); // 10 seconds
        } else {
            console.warn('⚠️ Failed to send request via robust manager');
        }
    } else if (derivWs && derivWs.readyState === WebSocket.OPEN) {
        derivWs.send(JSON.stringify(request));
        console.log('📡 Tick history request sent via basic WebSocket');

        // Set timeout to show helpful message if no data received
        setTimeout(() => {
            if (tickHistory.length === 0) {
                console.warn('⏰ No tick data received after 10 seconds');
                updateConnectionStatusMessage('Waiting for data from Deriv API...');
            }
        }, 10000); // 10 seconds
    } else {
        console.warn('⚠️ No active WebSocket connection to send request');
        updateConnectionStatusMessage('Connection failed - Click Reconnect');
    }
}

// Helper function to update connection status message
function updateConnectionStatusMessage(message) {
    const statusText = document.querySelector('#connection-status .status-text');
    if (statusText) {
        statusText.textContent = message;
    }
}

// Function to update symbol
function updateSymbol(newSymbol) {
    currentSymbol = newSymbol;
    tickHistory = [];
    startWebSocket();
}

// Function to update tick count
function updateTickCount(newTickCount) {
    tickCount = newTickCount;
    tickHistory = [];
    startWebSocket();
}

// Store event listener references for cleanup
let eventListeners = [];

// Helper function to add tracked event listeners
function addTrackedEventListener(element, event, handler) {
    if (element) {
        element.addEventListener(event, handler);
        eventListeners.push({ element, event, handler });
    }
}

// Function to remove all tracked event listeners
function removeAllEventListeners() {
    eventListeners.forEach(({ element, event, handler }) => {
        if (element) {
            element.removeEventListener(event, handler);
        }
    });
    eventListeners = [];
}

// Event handler functions (defined for easy cleanup)
function handleSymbolChange(event) {
    const newSymbol = event.target.value;
    localStorage.setItem('zeusSelectedMarket', newSymbol);
    console.log('💾 Saved market to localStorage:', newSymbol);
    updateSymbol(newSymbol);
}

function handleTickCountChange(event) {
    const newTickCount = parseInt(event.target.value, 10);
    if (newTickCount > 0) {
        localStorage.setItem('zeusTickCount', newTickCount.toString());
        console.log('💾 Saved tick count to localStorage:', newTickCount);
        updateTickCount(newTickCount);
    } else {
        console.warn('⚠️ Tick count must be greater than 0.');
    }
}

// Add event listeners for symbol and tick count inputs
const symbolSelect = document.getElementById('symbol-select');
const tickCountInput = document.getElementById('tick-count-input');

addTrackedEventListener(symbolSelect, 'change', handleSymbolChange);
addTrackedEventListener(tickCountInput, 'change', handleTickCountChange);

// Function to detect the number of decimal places dynamically
function detectDecimalPlaces() {
    if (tickHistory.length === 0) return;

    let decimalCounts = tickHistory.map(tick => {
        let decimalPart = tick.quote.toString().split('.')[1] || '';
        return decimalPart.length;
    });

    decimalPlaces = Math.max(...decimalCounts, 2);
}

// Function to extract the last digit
function getLastDigit(tick) {
    // Use original quote string if available, otherwise convert number to string
    let priceStr;
    if (typeof tick === 'object' && tick.originalQuote) {
        priceStr = tick.originalQuote;
    } else if (typeof tick === 'object' && tick.quote !== undefined) {
        priceStr = tick.quote.toString();
    } else {
        priceStr = tick.toString();
    }

    // Ensure priceStr is always a string
    if (typeof priceStr !== 'string') {
        priceStr = String(priceStr);
    }

    let priceParts = priceStr.split('.');
    let decimals = priceParts[1] || '';

    // Pad with zeros to match expected decimal places
    while (decimals.length < decimalPlaces) {
        decimals += '0';
    }

    // Get the last digit from the decimal part
    const lastDigit = Number(decimals.slice(-1));

    // Debug logging to track digit extraction
    if (Math.random() < 0.01) {
        // Log 1% of cases for debugging
        console.log(`🔍 Original: "${priceStr}" -> Decimals: "${decimals}" -> Last Digit: ${lastDigit}`);
    }

    return lastDigit;
}

// Function to update the UI
function updateUI() {
    // Price card removed - no need to update it
    updateDigitDisplay();
    updateCharts();
    updateLast50OE();
    updateLast50RF();
    updateAdvancedAnalysis();
    updateTechnicalAnalysis();
}

// Function to update tick pointer visual feedback (simplified)
function updateTickPointer() {
    // Simple visual feedback without bouncing animation
    console.log('🎯 Tick pointer updated');
}

// Bot functionality removed - digits are for analysis only

// PATEL Bot Loading Mode
let patelBotMode = true; // Default enabled

// Function to toggle PATEL bot loading mode
function togglePatelBotMode() {
    patelBotMode = !patelBotMode;
    
    const toggleBtn = document.getElementById('patel-bot-toggle');
    if (toggleBtn) {
        if (patelBotMode) {
            toggleBtn.textContent = 'PATEL: ON';
            toggleBtn.className = 'btn-compact btn-primary';
            toggleBtn.title = 'PATEL bot loading enabled - Click digits to load bot';
        } else {
            toggleBtn.textContent = 'PATEL: OFF';
            toggleBtn.className = 'btn-compact btn-secondary';
            toggleBtn.title = 'PATEL bot loading disabled - Analysis mode only';
        }
    }
    
    // Update digit display to show/hide bot indicators
    updateDigitDisplay();
    
    console.log(`🎯 PATEL Bot Mode: ${patelBotMode ? 'ENABLED' : 'DISABLED'}`);
}

// Function to handle digit circle click - FAST TRADING with selected mode
function handleDigitClick(digit) {
    console.log(`🎯 Digit ${digit} clicked - Fast trading with ${currentTradingMode} mode`);
    
    // Store selected digit for fast trading
    selectedDigit = digit;
    
    // Load bot based on current trading mode
    switch (currentTradingMode) {
        case 'patel':
            loadBotWithStrategy(digit, 'traditional');
            break;
        case 'matches':
            loadBotWithStrategy(digit, 'matches');
            break;
        case 'evenodd':
            loadBotWithStrategy(digit, 'enhanced_even_odd');
            break;
        default:
            loadBotWithStrategy(digit, 'traditional');
    }
}

// Function to toggle PATEL bot loading mode
function togglePatelBotMode() {
    patelBotMode = !patelBotMode;
    
    const toggleBtn = document.getElementById('patel-bot-toggle');
    if (toggleBtn) {
        if (patelBotMode) {
            toggleBtn.textContent = 'PATEL: ON';
            toggleBtn.className = 'btn-compact btn-primary';
            toggleBtn.title = 'PATEL bot loading enabled - Click digits to load bot';
        } else {
            toggleBtn.textContent = 'PATEL: OFF';
            toggleBtn.className = 'btn-compact btn-secondary';
            toggleBtn.title = 'PATEL bot loading disabled - Analysis mode only';
        }
    }
    
    // Update digit display to show/hide bot indicators
    updateDigitDisplay();
    
    console.log(`🎯 PATEL Bot Mode: ${patelBotMode ? 'ENABLED' : 'DISABLED'}`);
}
// Function to handle digit circle click - FAST TRADING with selected mode
function handleDigitClick(digit) {
    console.log(`🎯 Digit ${digit} clicked - Fast trading with ${currentTradingMode} mode`);
    
    // Store selected digit for fast trading
    selectedDigit = digit;
    
    // Load bot based on current trading mode
    switch (currentTradingMode) {
        case 'patel':
            loadBotWithStrategy(digit, 'traditional');
            break;
        case 'matches':
            loadBotWithStrategy(digit, 'matches');
            break;
        case 'evenodd':
            loadBotWithStrategy(digit, 'enhanced_even_odd');
            break;
        default:
            loadBotWithStrategy(digit, 'traditional');
    }
}
// Bot functionality removed - digits are for analysis only

// PATEL Bot Loading Mode
// Function to show PATEL bot loading feedback
function showPatelBotLoadingFeedback(digit, contractType, predictionBeforeLoss, predictionAfterLoss) {
    // Get current settings for display
    const settings = getPatelBotSettings();
    
    // Create feedback notification
    const feedback = document.createElement('div');
    feedback.className = 'patel-bot-feedback';
    feedback.innerHTML = `
        <div class="feedback-content">
            <div class="feedback-icon">🎯</div>
            <div class="feedback-text">
                <div class="feedback-title">Loading PATEL Bot</div>
                <div class="feedback-details">
                    <strong>Digit ${digit}</strong> | 
                    <strong>${contractType}</strong> Strategy
                </div>
                <div class="feedback-config">
                    Before Loss: <strong>${predictionBeforeLoss}</strong> | 
                    After Loss: <strong>${predictionAfterLoss}</strong>
                </div>
                <div class="feedback-settings">
                    Stake: <strong>$${settings.stake}</strong> | 
                    Martingale: <strong>${settings.martingale}x</strong> | 
                    Max Steps: <strong>${settings.maxMartingaleSteps}</strong>
                </div>
            </div>
            <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    // Add styles
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #8b1538 0%, #14b8a6 100%);
        color: white;
        padding: 1rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        max-width: 500px;
        animation: slideInRight 0.3s ease;
    `;

    // Add animation styles if not already added
    if (!document.getElementById('patel-feedback-styles')) {
        const style = document.createElement('style');
        style.id = 'patel-feedback-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .patel-bot-feedback .feedback-content {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
            }
            .patel-bot-feedback .feedback-icon {
                font-size: 2rem;
                flex-shrink: 0;
            }
            .patel-bot-feedback .feedback-text {
                flex: 1;
            }
            .patel-bot-feedback .feedback-title {
                font-weight: 600;
                margin-bottom: 0.5rem;
                font-size: 1rem;
            }
            .patel-bot-feedback .feedback-details {
                font-size: 0.875rem;
                opacity: 0.9;
                margin-bottom: 0.25rem;
            }
            .patel-bot-feedback .feedback-config {
                font-size: 0.75rem;
                opacity: 0.8;
                margin-bottom: 0.25rem;
            }
            .patel-bot-feedback .feedback-settings {
                font-size: 0.7rem;
                opacity: 0.7;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                padding-top: 0.25rem;
            }
            .patel-bot-feedback .feedback-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            .patel-bot-feedback .feedback-close:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(feedback);

    // Auto-remove after 6 seconds (longer to read more info)
    setTimeout(() => {
        if (feedback.parentElement) {
            feedback.remove();
        }
    }, 6000);
}

// Bot feedback functions removed - analysis tool only

// Function to update the digit display
function updateDigitDisplay() {
    const digitDisplayContainer = document.getElementById('digit-display-container');
    if (!digitDisplayContainer) {
        console.error('❌ digit-display-container not found!');
        return;
    }

    // Handle empty tickHistory case
    if (tickHistory.length === 0) {
        digitDisplayContainer.innerHTML = ''; // Clear existing content

        // Create digit circles with 0% for empty state
        for (let digit = 0; digit < 10; digit++) {
            const digitCircle = document.createElement('div');
            digitCircle.classList.add('digit-circle', 'ring-gray');

            const circleContent = document.createElement('div');
            circleContent.classList.add('circle-content');

            const digitNumber = document.createElement('div');
            digitNumber.classList.add('digit-number');
            digitNumber.textContent = digit;

            const digitPercentage = document.createElement('div');
            digitPercentage.classList.add('digit-percentage');
            digitPercentage.textContent = '0.0%';

            circleContent.appendChild(digitNumber);
            circleContent.appendChild(digitPercentage);
            digitCircle.appendChild(circleContent);
            digitDisplayContainer.appendChild(digitCircle);
        }

        console.log('✅ Created 10 digit circles (empty state)');
        return;
    }

    const digitCounts = new Array(10).fill(0);
    tickHistory.forEach(tick => {
        try {
            const lastDigit = getLastDigit(tick);
            if (lastDigit >= 0 && lastDigit <= 9) {
                digitCounts[lastDigit]++;
            }
        } catch (error) {
            console.warn('⚠️ Error processing tick for digit display:', error, 'Tick:', tick);
        }
    });

    const digitPercentages = digitCounts.map(count => (count / tickHistory.length) * 100);

    console.log('📊 Updating digit display with', tickHistory.length, 'ticks');
    
    // Debug: Log current hot digits
    if (analysisResults && analysisResults.hotCold && analysisResults.hotCold.hot) {
        const hotDigits = analysisResults.hotCold.hot.map(item => item.digit);
        console.log('🔥 Current hot digits:', hotDigits);
    } else {
        console.log('⚠️ No hot/cold analysis results available yet');
    }

    // Create array of indices sorted by percentage
    const sortedIndices = digitPercentages
        .map((percentage, index) => ({ percentage, index }))
        .sort((a, b) => b.percentage - a.percentage);

    // Get the digits for highest, second highest, second lowest, and lowest
    const highestDigit = sortedIndices[0].index;
    const secondHighestDigit = sortedIndices[1].index;
    const secondLowestDigit = sortedIndices[8].index;
    const lowestDigit = sortedIndices[9].index;

    const currentDigit =
        tickHistory.length > 0
            ? (() => {
                  try {
                      return getLastDigit(tickHistory[tickHistory.length - 1]);
                  } catch (error) {
                      console.warn('⚠️ Error getting current digit:', error);
                      return null;
                  }
              })()
            : null;
    console.log('🎯 Current digit:', currentDigit);

    digitDisplayContainer.innerHTML = ''; // Clear existing content

    digitPercentages.forEach((percentage, digit) => {
        const digitCircle = document.createElement('div');
        digitCircle.classList.add('digit-circle');

        // Apply colored borders based on ranking
        if (digit === highestDigit) {
            digitCircle.classList.add('ring-green');
        } else if (digit === secondHighestDigit) {
            digitCircle.classList.add('ring-blue');
        } else if (digit === secondLowestDigit) {
            digitCircle.classList.add('ring-yellow');
        } else if (digit === lowestDigit) {
            digitCircle.classList.add('ring-red');
        } else {
            digitCircle.classList.add('ring-gray');
        }

        // Check if this digit is hot (temperature >= 70)
        let isHotDigit = false;
        if (analysisResults && analysisResults.hotCold && analysisResults.hotCold.hot) {
            isHotDigit = analysisResults.hotCold.hot.some(hotItem => hotItem.digit === digit);
        }
        
        // Add hot digit styling
        if (isHotDigit) {
            digitCircle.classList.add('hot-digit');
        }

        // Add red tick pointer for current digit
        if (digit === currentDigit) {
            digitCircle.classList.add('current');
            const tickPointer = document.createElement('div');
            tickPointer.classList.add('tick-pointer');
            tickPointer.innerHTML = '▼';
            digitCircle.appendChild(tickPointer);
        }

        // Add click handler for PATEL bot loading
        digitCircle.style.cursor = 'pointer';
        digitCircle.addEventListener('click', () => handleDigitClick(digit, percentage, digitCounts[digit]));
        
        // Add visual indicator for bot loading capability (only if mode is enabled AND digit is hot)
        if (patelBotMode && isHotDigit) {
            console.log(`🔥 Showing indicator for hot digit ${digit} in ${currentTradingMode} mode`);
            const botIndicator = document.createElement('div');
                botIndicator.classList.add('bot-indicator');
                botIndicator.style.position = 'absolute';
                botIndicator.style.top = '-5px';
                botIndicator.style.right = '-5px';
                botIndicator.style.fontSize = '12px';
                botIndicator.style.zIndex = '10';
                botIndicator.style.background = 'rgba(139, 21, 56, 0.9)';
                botIndicator.style.color = 'white';
                botIndicator.style.borderRadius = '50%';
                botIndicator.style.width = '20px';
                botIndicator.style.height = '20px';
                botIndicator.style.display = 'flex';
                botIndicator.style.alignItems = 'center';
                botIndicator.style.justifyContent = 'center';
                botIndicator.style.fontWeight = 'bold';
                botIndicator.title = `Click to load bot for hot digit ${digit}`;
                
                // Mode-specific indicators
                if (currentTradingMode === 'evenodd') {
                    // Even/Odd Mode: Show E (green) for even digits, O (red) for odd digits
                    if (digit % 2 === 0) {
                        botIndicator.innerHTML = 'E'; // EVEN
                        botIndicator.style.background = 'rgba(16, 185, 129, 0.9)'; // Green for EVEN
                        botIndicator.title = `HOT EVEN Digit ${digit}: Click to load Even/Odd bot`;
                    } else {
                        botIndicator.innerHTML = 'O'; // ODD
                        botIndicator.style.background = 'rgba(239, 68, 68, 0.9)'; // Red for ODD
                        botIndicator.title = `HOT ODD Digit ${digit}: Click to load Even/Odd bot`;
                    }
                } else {
                    // Default mode (Patel/Matches): Show U/O for UNDER/OVER digits
                    if (digit >= 0 && digit <= 4) {
                        botIndicator.innerHTML = 'U'; // UNDER
                        botIndicator.style.background = 'rgba(239, 68, 68, 0.9)'; // Red for UNDER
                        botIndicator.title = `HOT UNDER Strategy: Click to load PATEL bot (Before: 8, After: 6)`;
                    } else {
                        botIndicator.innerHTML = 'O'; // OVER  
                        botIndicator.style.background = 'rgba(16, 185, 129, 0.9)'; // Green for OVER
                        botIndicator.title = `HOT OVER Strategy: Click to load PATEL bot (Before: 1, After: 2)`;
                    }
                }
                
                digitCircle.appendChild(botIndicator);
        }

        const circleContent = document.createElement('div');
        circleContent.classList.add('circle-content');

        const digitNumber = document.createElement('div');
        digitNumber.classList.add('digit-number');
        digitNumber.textContent = digit;

        const digitPercentage = document.createElement('div');
        digitPercentage.classList.add('digit-percentage');
        digitPercentage.textContent = `${percentage.toFixed(1)}%`;

        circleContent.appendChild(digitNumber);
        circleContent.appendChild(digitPercentage);
        digitCircle.appendChild(circleContent);

        // Add click functionality
        digitCircle.style.cursor = 'pointer';
        digitCircle.addEventListener('click', () => handleDigitClick(digit, percentage, digitCounts[digit]));

        digitDisplayContainer.appendChild(digitCircle);
    });

    console.log('✅ Created', digitPercentages.length, 'digit circles');
}

// Function to initialize charts
function initializeCharts() {
    const ctxDigit = document.getElementById('digit-chart').getContext('2d');
    digitChart = new Chart(ctxDigit, {
        type: 'bar',
        data: {
            labels: Array.from({ length: 10 }, (_, i) => i.toString()),
            datasets: [
                {
                    label: 'Digit Distribution (%)',
                    data: Array(10).fill(0),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: Array(10).fill('rgba(54, 162, 235, 1)'),
                    borderWidth: 2,
                    borderRadius: 10,
                    barPercentage: 0.8, // Bars span full width
                    categoryPercentage: 0.8, // No spacing between bars
                },
            ],
        },
        options: {
            indexAxis: 'x', // Vertical bars
            plugins: {
                legend: { display: false }, // Hide legend
                tooltip: { enabled: true }, // Enable tooltips
            },
            scales: {
                x: { display: true }, // Show x-axis
                y: { display: true }, // Show y-axis
            },
        },
    });

    const ctxEvenOdd = document.getElementById('even-odd-chart').getContext('2d');
    evenOddChart = new Chart(ctxEvenOdd, {
        type: 'bar',
        data: {
            labels: ['Even', 'Odd'],
            datasets: [
                {
                    label: 'Even/Odd Distribution',
                    data: [0, 0],
                    backgroundColor: ['#8BEDA6', '#FF7F7F'],
                    borderColor: ['#8BEDA6', '#FF7F7F'],
                    borderWidth: 1,
                    barPercentage: 0.9, // Bars span full width
                    categoryPercentage: 0.9, // No spacing between bars
                },
            ],
        },
        options: {
            indexAxis: 'y', // Horizontal bars
            plugins: {
                legend: { display: false }, // Hide legend
                tooltip: { enabled: true }, // Enable tooltips
            },
            scales: {
                x: { display: false }, // Hide x-axis
                y: { display: false }, // Hide y-axis
            },
        },
    });

    const ctxRiseFall = document.getElementById('rise-fall-chart').getContext('2d');
    riseFallChart = new Chart(ctxRiseFall, {
        type: 'bar',
        data: {
            labels: ['Rise', 'Fall'],
            datasets: [
                {
                    label: 'Rise/Fall Distribution',
                    data: [0, 0],
                    backgroundColor: ['#8BEDA6', '#FF7F7F'],
                    borderColor: ['#8BEDA6', '#FF7F7F'],
                    borderWidth: 1,
                    barPercentage: 0.9, // Bars span full width
                    categoryPercentage: 0.9, // No spacing between bars
                },
            ],
        },
        options: {
            indexAxis: 'y', // Horizontal bars
            plugins: {
                legend: { display: false }, // Hide legend
                tooltip: { enabled: true }, // Enable tooltips
            },
            scales: {
                x: { display: false }, // Hide x-axis
                y: { display: false }, // Hide y-axis
            },
        },
    });
}

// Function to update charts
function updateCharts() {
    // Handle empty tickHistory case
    if (tickHistory.length === 0) {
        // Set default values for empty state
        document.getElementById('digit-percentage').textContent = `Highest: 0.0%, Lowest: 0.0%`;
        document.getElementById('even-odd-percentage').textContent = `Even: 0.0%, Odd: 0.0%`;
        document.getElementById('rise-fall-percentage').textContent = `Rise: 0.0%, Fall: 0.0%`;

        // Update charts with empty data
        if (digitChart) {
            digitChart.data.datasets[0].data = new Array(10).fill(0);
            digitChart.data.datasets[0].borderColor = new Array(10).fill('rgba(54, 162, 235, 1)');
            digitChart.update();
        }

        if (evenOddChart) {
            evenOddChart.data.datasets[0].data = [0, 0];
            evenOddChart.update();
        }

        if (riseFallChart) {
            riseFallChart.data.datasets[0].data = [0, 0];
            riseFallChart.update();
        }

        return;
    }

    const digitCounts = new Array(10).fill(0);
    tickHistory.forEach(tick => {
        try {
            const lastDigit = getLastDigit(tick);
            if (lastDigit >= 0 && lastDigit <= 9) {
                digitCounts[lastDigit]++;
            }
        } catch (error) {
            console.warn('⚠️ Error processing tick for chart update:', error, 'Tick:', tick);
        }
    });
    const digitPercentages = digitCounts.map(count => (count / tickHistory.length) * 100);

    console.log('📊 Updating digit display with', tickHistory.length, 'ticks');

    // Find indices for max and min percentages
    const maxPercentageValue = Math.max(...digitPercentages);
    const minPercentageValue = Math.min(...digitPercentages);
    const maxIndex = digitPercentages.indexOf(maxPercentageValue);
    const minIndex = digitPercentages.indexOf(minPercentageValue);

    // Set border colors: green for max, red for min, default for others
    const borderColors = digitPercentages.map((_, idx) => {
        if (idx === maxIndex) return 'limegreen';
        if (idx === minIndex) return 'red';
        return 'rgba(54, 162, 235, 1)';
    });

    digitChart.data.datasets[0].data = digitPercentages;
    digitChart.data.datasets[0].borderColor = borderColors;
    digitChart.update();

    // Display highest and lowest percentages
    const maxPercentage = maxPercentageValue.toFixed(decimalPlaces);
    const minPercentage = minPercentageValue.toFixed(decimalPlaces);
    document.getElementById('digit-percentage').textContent = `Highest: ${maxPercentage}%, Lowest: ${minPercentage}%`;

    // Update even/odd chart
    const evenCount = digitCounts.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
    const oddCount = digitCounts.filter((_, i) => i % 2 !== 0).reduce((a, b) => a + b, 0);
    const evenPercentage = ((evenCount / tickHistory.length) * 100).toFixed(decimalPlaces);
    const oddPercentage = ((oddCount / tickHistory.length) * 100).toFixed(decimalPlaces);

    evenOddChart.data.datasets[0].data = [evenPercentage, oddPercentage];
    evenOddChart.update();

    // Display even and odd percentages
    document.getElementById('even-odd-percentage').textContent = `Even: ${evenPercentage}%, Odd: ${oddPercentage}%`;

    // Update rise/fall chart
    let riseCount = 0,
        fallCount = 0;
    for (let i = 1; i < tickHistory.length; i++) {
        if (tickHistory[i].quote > tickHistory[i - 1].quote) riseCount++;
        else if (tickHistory[i].quote < tickHistory[i - 1].quote) fallCount++;
    }
    const risePercentage = ((riseCount / (tickHistory.length - 1)) * 100).toFixed(decimalPlaces);
    const fallPercentage = ((fallCount / (tickHistory.length - 1)) * 100).toFixed(decimalPlaces);

    riseFallChart.data.datasets[0].data = [risePercentage, fallPercentage];
    riseFallChart.update();

    // Display rise and fall percentages
    document.getElementById('rise-fall-percentage').textContent = `Rise: ${risePercentage}%, Fall: ${fallPercentage}%`;
}

// Function to update the last 50 digits as "E" (Even) or "O" (Odd)
function updateLast50OE() {
    const last50OEContainer = document.getElementById('last-50-oe-container');
    if (!last50OEContainer) return;

    last50OEContainer.innerHTML = ''; // Clear existing content

    // Handle empty tickHistory case
    if (tickHistory.length === 0) {
        // Show placeholder message for empty state
        const placeholder = document.createElement('div');
        placeholder.classList.add('placeholder-message');
        placeholder.textContent = 'Waiting for tick data...';
        placeholder.style.cssText =
            'color: var(--text-secondary); font-style: italic; text-align: center; padding: 20px;';
        last50OEContainer.appendChild(placeholder);
        return;
    }

    const last50Digits = tickHistory
        .slice(-50)
        .map(tick => {
            try {
                return getLastDigit(tick);
            } catch (error) {
                console.warn('⚠️ Error processing tick for last 50 OE:', error, 'Tick:', tick);
                return null;
            }
        })
        .filter(digit => digit !== null);
    const oeValues = last50Digits.map(digit => ({
        value: digit % 2 === 0 ? 'E' : 'O',
        class: digit % 2 === 0 ? 'even' : 'odd',
    }));

    oeValues.forEach(({ value, class: oeClass }) => {
        const oeBox = document.createElement('div');
        oeBox.classList.add('oe-box', oeClass);
        oeBox.textContent = value;
        last50OEContainer.appendChild(oeBox);
    });
}

// Function to update the last 50 ticks as "R" (Rise) or "F" (Fall)
function updateLast50RF() {
    const last50RFContainer = document.getElementById('last-50-rf-container');
    if (!last50RFContainer) return;

    last50RFContainer.innerHTML = ''; // Clear existing content

    // Handle empty or insufficient tickHistory case
    if (tickHistory.length < 2) {
        // Show placeholder message for empty state
        const placeholder = document.createElement('div');
        placeholder.classList.add('placeholder-message');
        placeholder.textContent = 'Waiting for tick data...';
        placeholder.style.cssText =
            'color: var(--text-secondary); font-style: italic; text-align: center; padding: 20px;';
        last50RFContainer.appendChild(placeholder);
        return;
    }

    const last50 = tickHistory.slice(-50);
    const rfValues = [];

    for (let i = 1; i < last50.length; i++) {
        const current = last50[i].quote;
        const previous = last50[i - 1].quote;

        if (current > previous) {
            rfValues.push({ value: 'R', class: 'rise' });
        } else if (current < previous) {
            rfValues.push({ value: 'F', class: 'fall' });
        } else {
            rfValues.push({ value: '=', class: 'equal' });
        }
    }

    rfValues.forEach(({ value, class: rfClass }) => {
        const rfBox = document.createElement('div');
        rfBox.classList.add('rf-box', rfClass);
        rfBox.textContent = value;
        last50RFContainer.appendChild(rfBox);
    });
}

// Master cleanup function to cleanup all resources
function cleanupAllResources() {
    console.log('Cleaning up all resources...');

    // Cleanup WebSocket
    cleanupWebSocket();

    // Cleanup intervals
    stopSyncAutomation();
    stopPeriodicResync();

    // Cleanup event listeners
    removeAllEventListeners();

    // Cleanup charts
    if (digitChart) {
        digitChart.destroy();
        digitChart = null;
    }
    if (evenOddChart) {
        evenOddChart.destroy();
        evenOddChart = null;
    }
    if (riseFallChart) {
        riseFallChart.destroy();
        riseFallChart = null;
    }

    console.log('Cleanup completed');
}

// Add cleanup on page unload
window.addEventListener('beforeunload', function (event) {
    cleanupAllResources();
});

// Add cleanup on visibility change (when tab is hidden)
document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        // Optionally pause intervals when tab is hidden to save resources
        stopSyncAutomation();
        stopPeriodicResync();
    } else {
        // Resume when tab is visible again
        startSyncAutomation();
        startPeriodicResync();
    }
});

// Restore saved settings from localStorage
if (symbolSelect) {
    symbolSelect.value = currentSymbol;
    console.log('✅ Restored market from localStorage:', currentSymbol);
}

if (tickCountInput) {
    tickCountInput.value = tickCount;
    console.log('✅ Restored tick count from localStorage:', tickCount);
}

// Initialize advanced analysis
function initializeAdvancedAnalysis() {
    if (typeof AdvancedDigitAnalysis !== 'undefined') {
        advancedAnalysis = new AdvancedDigitAnalysis();
        console.log('✅ Advanced Digit Analysis initialized');
    } else {
        console.warn('⚠️ Advanced Digit Analysis not loaded');
    }

    // Initialize technical analysis
    if (typeof TechnicalAnalysisService !== 'undefined') {
        technicalAnalysis = new TechnicalAnalysisService();
        console.log('✅ Technical Analysis Service initialized');
    } else {
        console.warn('⚠️ Technical Analysis Service not loaded');
    }
}

// Update advanced analysis
function updateAdvancedAnalysis() {
    if (!advancedAnalysis || tickHistory.length === 0) return;

    analysisResults = advancedAnalysis.updateAnalysis(tickHistory);
    updateAdvancedUI();
}

// Update technical analysis
function updateTechnicalAnalysis() {
    if (!technicalAnalysis || tickHistory.length === 0) return;

    technicalResults = technicalAnalysis.updateAnalysis(tickHistory);
    updateTechnicalUI();
}

// Update advanced UI elements
function updateAdvancedUI() {
    if (!analysisResults) return;

    updateStreakDisplay();
    updateHotColdDisplay();
    updatePatternDisplay();
    updateStatisticsDisplay();
}

// Update streak display
function updateStreakDisplay() {
    const streakContainer = document.getElementById('streak-display');
    if (!streakContainer) return;

    const { current, longest, all } = analysisResults.streaks;

    streakContainer.innerHTML = `
        <div class="streak-info">
            <div class="streak-item">
                <span class="streak-label">Current Streak:</span>
                <span class="streak-value ${current.count >= 3 ? 'streak-hot' : ''}">${current.digit !== null ? `${current.digit} (${current.count}x)` : 'None'}</span>
            </div>
            <div class="streak-item">
                <span class="streak-label">Longest Streak:</span>
                <span class="streak-value streak-record">${longest.digit !== null ? `${longest.digit} (${longest.count}x)` : 'None'}</span>
            </div>
            <div class="streak-item">
                <span class="streak-label">Total Streaks:</span>
                <span class="streak-value">${all.length}</span>
            </div>
        </div>
    `;
}

// Update hot/cold display
function updateHotColdDisplay() {
    const hotColdContainer = document.getElementById('hot-cold-display');
    if (!hotColdContainer) return;

    const { hot, cold, temperatures } = analysisResults.hotCold;

    let hotColdHTML = '<div class="temperature-grid">';

    temperatures.forEach((temp, digit) => {
        const color = advancedAnalysis.getTemperatureColor(temp);
        const label = advancedAnalysis.getTemperatureLabel(temp);

        hotColdHTML += `
            <div class="temp-digit" style="border-color: ${color}">
                <div class="temp-digit-number">${digit}</div>
                <div class="temp-bar">
                    <div class="temp-fill" style="width: ${temp}%; background: ${color}"></div>
                </div>
                <div class="temp-label">${label}</div>
                <div class="temp-value">${temp}°</div>
            </div>
        `;
    });

    hotColdHTML += '</div>';

    // Add hot/cold summary
    hotColdHTML += `
        <div class="hot-cold-summary">
            <div class="hot-digits">
                <h4>🔥 Hot Digits</h4>
                ${hot.map(item => `<span class="hot-digit">${item.digit} (${item.temperature}°)</span>`).join('')}
            </div>
            <div class="cold-digits">
                <h4>🧊 Cold Digits</h4>
                ${cold.map(item => `<span class="cold-digit">${item.digit} (${item.temperature}°)</span>`).join('')}
            </div>
        </div>
    `;

    hotColdContainer.innerHTML = hotColdHTML;
}

// Update pattern display
function updatePatternDisplay() {
    const patternContainer = document.getElementById('pattern-display');
    if (!patternContainer) return;

    const { topPairs, sequences, clusters } = analysisResults.patterns;

    let patternHTML = `
        <div class="pattern-section">
            <h4>🔗 Top Digit Pairs</h4>
            <div class="pairs-list">
                ${topPairs
                    .map(
                        ([pair, count]) => `
                    <div class="pair-item">
                        <span class="pair-digits">${pair}</span>
                        <span class="pair-count">${count}x</span>
                    </div>
                `
                    )
                    .join('')}
            </div>
        </div>
        
        <div class="pattern-section">
            <h4>📈 Recent Sequences</h4>
            <div class="sequences-list">
                ${sequences
                    .slice(-5)
                    .map(
                        seq => `
                    <div class="sequence-item ${seq.type}">
                        <span class="sequence-type">${seq.type}</span>
                        <span class="sequence-digits">${seq.sequence.join(' → ')}</span>
                    </div>
                `
                    )
                    .join('')}
            </div>
        </div>
        
        <div class="pattern-section">
            <h4>🎯 Top Clusters</h4>
            <div class="clusters-list">
                ${clusters
                    .map(
                        cluster => `
                    <div class="cluster-item">
                        <span class="cluster-digit">${cluster.digit}</span>
                        <span class="cluster-density">${(cluster.density * 100).toFixed(1)}%</span>
                        <span class="cluster-count">${cluster.count}x in window</span>
                    </div>
                `
                    )
                    .join('')}
            </div>
        </div>
    `;

    patternContainer.innerHTML = patternHTML;
}

// Update statistics display
function updateStatisticsDisplay() {
    const statsContainer = document.getElementById('statistics-display');
    if (!statsContainer) return;

    const { standardDeviation, chiSquare, chiSquarePValue, confidenceIntervals, randomnessScore } =
        analysisResults.statistics;

    let statsHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-label">Standard Deviation</div>
                <div class="stat-value">${standardDeviation.toFixed(4)}</div>
                <div class="stat-desc">Lower = more uniform</div>
            </div>
            
            <div class="stat-item">
                <div class="stat-label">Chi-Square Test</div>
                <div class="stat-value">${chiSquare.toFixed(2)}</div>
                <div class="stat-desc">p-value: ${chiSquarePValue}</div>
            </div>
            
            <div class="stat-item">
                <div class="stat-label">Randomness Score</div>
                <div class="stat-value ${randomnessScore >= 70 ? 'good' : randomnessScore >= 40 ? 'fair' : 'poor'}">${randomnessScore.toFixed(0)}%</div>
                <div class="stat-desc">${randomnessScore >= 70 ? 'Good' : randomnessScore >= 40 ? 'Fair' : 'Poor'} randomness</div>
            </div>
        </div>
        
        <div class="confidence-intervals">
            <h4>📊 Confidence Intervals (95%)</h4>
            <div class="ci-grid">
                ${confidenceIntervals
                    .map(
                        (ci, digit) => `
                    <div class="ci-item ${ci.actual < ci.lower || ci.actual > ci.upper ? 'ci-outlier' : ''}">
                        <div class="ci-digit">${digit}</div>
                        <div class="ci-bar">
                            <div class="ci-expected" style="left: ${ci.expected * 100}%"></div>
                            <div class="ci-range" style="left: ${ci.lower * 100}%; width: ${(ci.upper - ci.lower) * 100}%"></div>
                            <div class="ci-actual" style="left: ${ci.actual * 100}%"></div>
                        </div>
                        <div class="ci-values">
                            <span>Actual: ${(ci.actual * 100).toFixed(1)}%</span>
                            <span>Expected: ${(ci.expected * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                `
                    )
                    .join('')}
            </div>
        </div>
    `;

    statsContainer.innerHTML = statsHTML;
}

// Update technical analysis UI
function updateTechnicalUI() {
    if (!technicalResults) return;

    updateTickVelocityDisplay();
    updatePriceMovementDisplay();
    updateVolatilityRegimeDisplay();
    updateTransitionMatrixDisplay();
    updateFractalsDisplay();
    updateAnomaliesDisplay();
    updateTechnicalOverview();
}

// Update technical overview tab
function updateTechnicalOverview() {
    if (!technicalResults) return;

    // Update quick stats
    const velocityEl = document.getElementById('overview-velocity');
    const trendEl = document.getElementById('overview-trend');
    const volatilityEl = document.getElementById('overview-volatility');
    const regimeEl = document.getElementById('overview-regime');

    if (velocityEl && technicalResults.tickVelocity) {
        velocityEl.textContent = technicalResults.tickVelocity.ticksPerSecond;
    }

    if (trendEl && technicalResults.priceMovement) {
        const trend = technicalResults.priceMovement.trend;
        trendEl.textContent = trend === 'BULLISH' ? '↗️' : trend === 'BEARISH' ? '↘️' : '→';
        trendEl.style.color =
            trend === 'BULLISH' ? 'var(--success)' : trend === 'BEARISH' ? 'var(--error)' : 'var(--text-secondary)';
    }

    if (volatilityEl && technicalResults.volatilityRegime) {
        volatilityEl.textContent = technicalResults.volatilityRegime.volatilityRatio + 'x';
        volatilityEl.style.color = technicalResults.volatilityRegime.regimeColor;
    }

    if (regimeEl && technicalResults.volatilityRegime) {
        regimeEl.textContent = technicalResults.volatilityRegime.regime;
        regimeEl.style.color = technicalResults.volatilityRegime.regimeColor;
    }

    // Update summary
    const summaryEl = document.getElementById('technical-overview-summary');
    if (summaryEl) {
        let summary = 'Market Analysis: ';

        if (technicalResults.tickVelocity) {
            summary += `Tick velocity is ${technicalResults.tickVelocity.velocityRegime.toLowerCase()}. `;
        }

        if (technicalResults.priceMovement) {
            summary += `Price momentum shows ${technicalResults.priceMovement.trend.toLowerCase()} trend with ${technicalResults.priceMovement.momentumStrength.toFixed(0)}% strength. `;
        }

        if (technicalResults.volatilityRegime) {
            summary += `Volatility regime is ${technicalResults.volatilityRegime.regime.toLowerCase()} and ${technicalResults.volatilityRegime.trend.toLowerCase()}. `;
        }

        if (technicalResults.anomalies && technicalResults.anomalies.length > 0) {
            summary += `${technicalResults.anomalies.length} anomalies detected.`;
        } else {
            summary += 'No significant anomalies detected.';
        }

        summaryEl.textContent = summary;
    }
}

// Update tick velocity display
function updateTickVelocityDisplay() {
    const container = document.getElementById('tick-velocity-display');
    if (!container || !technicalResults.tickVelocity) return;

    const tv = technicalResults.tickVelocity;

    container.innerHTML = `
        <div class="technical-metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Tick Velocity</div>
                <div class="metric-value">${tv.ticksPerSecond} TPS</div>
                <div class="metric-sublabel">Regime: ${tv.velocityRegime}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Consistency</div>
                <div class="metric-value">${(tv.consistency * 100).toFixed(1)}%</div>
                <div class="metric-sublabel">Index: ${tv.velocityIndex}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Acceleration</div>
                <div class="metric-value ${tv.acceleration > 0 ? 'positive' : tv.acceleration < 0 ? 'negative' : 'neutral'}">
                    ${tv.acceleration > 0 ? '+' : ''}${(tv.acceleration * 100).toFixed(1)}%
                </div>
                <div class="metric-sublabel">Change in velocity</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Avg Interval</div>
                <div class="metric-value">${tv.averageInterval}ms</div>
                <div class="metric-sublabel">Between ticks</div>
            </div>
        </div>
    `;
}

// Update price movement display
function updatePriceMovementDisplay() {
    const container = document.getElementById('price-movement-display');
    if (!container || !technicalResults.priceMovement) return;

    const pm = technicalResults.priceMovement;

    container.innerHTML = `
        <div class="momentum-header">
            <div class="trend-indicator ${pm.trend.toLowerCase()}">
                <span class="trend-icon">${pm.trendDirection}</span>
                <span class="trend-label">${pm.trend}</span>
                <span class="trend-strength">${pm.momentumStrength.toFixed(0)}%</span>
            </div>
        </div>
        <div class="momentum-details">
            <div class="momentum-bar">
                <div class="momentum-fill bullish" style="width: ${Math.max(0, pm.momentumRatio * 100 + 50)}%"></div>
                <div class="momentum-fill bearish" style="width: ${Math.max(0, -pm.momentumRatio * 100 + 50)}%"></div>
                <div class="momentum-center"></div>
            </div>
            <div class="momentum-stats">
                <div class="stat-item">
                    <span class="stat-label">Bullish:</span>
                    <span class="stat-value positive">${pm.bullishMomentum.toFixed(4)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Bearish:</span>
                    <span class="stat-value negative">${pm.bearishMomentum.toFixed(4)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Volatility:</span>
                    <span class="stat-value">${pm.volatility.toFixed(4)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Reversals:</span>
                    <span class="stat-value">${pm.reversals}</span>
                </div>
            </div>
        </div>
    `;
}

// Update volatility regime display
function updateVolatilityRegimeDisplay() {
    const container = document.getElementById('volatility-regime-display');
    if (!container || !technicalResults.volatilityRegime) return;

    const vr = technicalResults.volatilityRegime;

    container.innerHTML = `
        <div class="regime-header">
            <div class="regime-badge" style="background-color: ${vr.regimeColor}">
                ${vr.regime} VOLATILITY
            </div>
            <div class="regime-trend">
                <span class="trend-icon">${vr.trendIcon}</span>
                <span class="trend-text">${vr.trend}</span>
            </div>
        </div>
        <div class="regime-metrics">
            <div class="regime-metric">
                <div class="metric-label">Clustering Index</div>
                <div class="metric-value">${vr.clusteringIndex}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(100, Math.abs(vr.clusteringIndex) * 100)}%"></div>
                </div>
            </div>
            <div class="regime-metric">
                <div class="metric-label">Current vs Average</div>
                <div class="metric-value">${vr.volatilityRatio}x</div>
                <div class="metric-sublabel">${vr.percentile}th percentile</div>
            </div>
        </div>
    `;
}

// Update transition matrix display
function updateTransitionMatrixDisplay() {
    const container = document.getElementById('transition-matrix-display');
    if (!container || !technicalResults.transitionMatrix) return;

    const tm = technicalResults.transitionMatrix;

    let matrixHTML = `
        <div class="current-digit-display">
            <div class="current-digit-label">Current Digit:</div>
            <div class="current-digit-value">${tm.currentDigit}</div>
            <div class="current-digit-arrow">→</div>
            <div class="predictability-badge">${tm.predictability}% Predictable</div>
        </div>
        
        <div class="probability-section">
            <div class="probability-header">
                <div class="probability-title">Next Digit Probabilities</div>
                <div class="predictability-badge">Entropy: ${tm.entropy}</div>
            </div>
            <div class="probability-grid">
    `;

    tm.nextDigitProbabilities.forEach((prob, digit) => {
        const isTop = tm.topPredictions.some(p => p.digit === digit);
        const rank = tm.topPredictions.findIndex(p => p.digit === digit);
        const rankText = rank !== -1 ? `#${rank + 1}` : '';

        matrixHTML += `
            <div class="probability-item ${isTop ? 'top-prediction' : ''}">
                <div class="digit">${digit}</div>
                <div class="probability">${prob}%</div>
                <div class="prob-bar">
                    <div class="prob-fill" style="width: ${Math.max(5, prob * 7)}%"></div>
                </div>
                ${rankText ? `<div class="prob-rank">${rankText}</div>` : '<div class="prob-rank"></div>'}
            </div>
        `;
    });

    matrixHTML += `
            </div>
        </div>
        
        <div class="predictions-summary">
            <h4>🏆 Top Predictions</h4>
            <div class="predictions-list">
    `;

    tm.topPredictions.forEach((pred, index) => {
        const medals = ['🥇', '🥈', '🥉'];
        const medal = medals[index] || '🏅';

        matrixHTML += `
            <div class="prediction-item rank-${index + 1}">
                <span class="rank">${medal}</span>
                <span class="pred-digit">${pred.digit}</span>
                <span class="pred-prob">${pred.probability}%</span>
            </div>
        `;
    });

    matrixHTML += `
            </div>
            <div class="visual-separator"></div>
            <div style="text-align: center; font-size: 0.875rem; color: var(--text-secondary);">
                Based on ${tm.totalTransitions} historical transitions
            </div>
        </div>
    `;

    container.innerHTML = matrixHTML;
}

// Update fractals display
function updateFractalsDisplay() {
    const container = document.getElementById('fractals-display');
    if (!container || !technicalResults.fractals) return;

    const fractals = technicalResults.fractals.slice(0, 6); // Show top 6

    let fractalsHTML = `
        <div class="fractals-header">
            <h4>🔍 Support/Resistance Levels</h4>
            <div class="fractals-count">${fractals.length} levels detected</div>
        </div>
        <div class="fractals-grid">
    `;

    fractals.forEach(fractal => {
        const typeIcon = fractal.type === 'resistance' ? '🔴' : '🟢';
        const ageText = fractal.age === 1 ? '1 tick ago' : `${fractal.age} ticks ago`;
        const strengthPercentage = Math.min(100, fractal.strength * 1000);

        fractalsHTML += `
            <div class="fractal-card ${fractal.type}">
                <div class="fractal-header">
                    <div class="fractal-type ${fractal.type}">
                        <span class="fractal-icon">${typeIcon}</span>
                        <span>${fractal.type}</span>
                    </div>
                    <div class="fractal-relevance-badge">${fractal.relevance.toFixed(0)}%</div>
                </div>
                <div class="fractal-price">${fractal.price.toFixed(5)}</div>
                <div class="fractal-metrics">
                    <div class="fractal-metric">
                        <div class="fractal-metric-label">Strength</div>
                        <div class="fractal-metric-value">${fractal.strength.toFixed(3)}</div>
                    </div>
                    <div class="fractal-metric">
                        <div class="fractal-metric-label">Age</div>
                        <div class="fractal-metric-value">${fractal.age}</div>
                    </div>
                </div>
                <div class="fractal-strength-bar">
                    <div class="fractal-strength-fill" style="width: ${strengthPercentage}%"></div>
                </div>
            </div>
        `;
    });

    fractalsHTML += '</div>';
    container.innerHTML = fractalsHTML;
}

// Update anomalies display
function updateAnomaliesDisplay() {
    const container = document.getElementById('anomalies-display');
    if (!container) return;

    const anomalies = technicalResults.anomalies || [];

    if (anomalies.length === 0) {
        container.innerHTML = `
            <div class="no-anomalies">
                <div class="status-icon">✅</div>
                <div class="status-text">No anomalies detected</div>
                <div class="status-subtext">Market behavior is within normal parameters</div>
            </div>
        `;
        return;
    }

    let anomaliesHTML = `
        <div class="anomalies-header">
            <h4>🚨 Anomaly Alerts</h4>
            <div class="anomalies-count">${anomalies.length} detected</div>
        </div>
        <div class="anomalies-list">
    `;

    anomalies.forEach(anomaly => {
        const severityClass = anomaly.severity > 80 ? 'critical' : anomaly.severity > 50 ? 'high' : 'medium';
        const typeIcon =
            {
                digit_frequency: '🔢',
                price_movement: '📈',
                streak: '🔥',
                pattern: '🧩',
            }[anomaly.type] || '⚠️';

        anomaliesHTML += `
            <div class="anomaly-item ${severityClass}">
                <div class="anomaly-icon">${typeIcon}</div>
                <div class="anomaly-details">
                    <div class="anomaly-description">${anomaly.description}</div>
                    <div class="anomaly-meta">
                        <span class="anomaly-type">${anomaly.type.replace('_', ' ').toUpperCase()}</span>
                        ${anomaly.zScore ? `<span class="z-score">${anomaly.zScore}σ</span>` : ''}
                        <span class="anomaly-age">${anomaly.age === 0 ? 'Just now' : `${anomaly.age} ticks ago`}</span>
                    </div>
                </div>
                <div class="anomaly-severity">
                    <div class="severity-score ${severityClass}">${anomaly.severity.toFixed(0)}</div>
                    <div class="severity-bar">
                        <div class="severity-fill ${severityClass}" style="width: ${anomaly.severity}%"></div>
                    </div>
                </div>
            </div>
        `;
    });

    anomaliesHTML += '</div>';
    container.innerHTML = anomaliesHTML;
}

// Start WebSocket on page load
startWebSocket();
initializeCharts();
initializeAdvancedAnalysis();

// Initialize UI with empty state
updateUI();
console.log('🔮 Metatron Analysis Tool initialized with empty state');

// Add digit click handlers after DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeDigitClickHandlers();
    
    // Initialize Modes system
    if (typeof currentTradingMode === 'undefined') {
        window.currentTradingMode = 'patel';
        window.selectedTradingStrategy = 'traditional';
        window.selectedDigit = null;
    }
    
    // Initialize Modes button display on page load
    setTimeout(() => {
        const updateModesBtn = window.updateModesButtonDisplay;
        if (typeof updateModesBtn === 'function') {
            updateModesBtn();
        }
    }, 100);
    
    console.log('✅ Enhanced Trading Strategies with Modes initialized');
});

// Function to initialize digit click handlers
function initializeDigitClickHandlers() {
    console.log('🎯 Initializing digit click handlers...');

    // Add click handlers to existing digit circles
    const digitContainer = document.getElementById('digit-display-container');
    if (digitContainer) {
        // Use event delegation to handle clicks on digit circles
        digitContainer.addEventListener('click', function (event) {
            const digitCircle = event.target.closest('.digit-circle');
            if (digitCircle) {
                // Extract digit from the circle
                const digitElement = digitCircle.querySelector('.digit-number');
                if (digitElement) {
                    const digit = parseInt(digitElement.textContent);
                    if (!isNaN(digit) && digit >= 0 && digit <= 9) {
                        handleDigitClick(digit);
                    }
                }
            }
        });

        // Add cursor pointer style to digit circles
        const style = document.createElement('style');
        style.textContent = `
            .digit-circle {
                cursor: pointer !important;
                transition: transform 0.2s ease, box-shadow 0.2s ease !important;
            }
            .digit-circle:hover {
                transform: scale(1.05) !important;
                box-shadow: 0 4px 12px rgba(139, 21, 56, 0.3) !important;
            }
            .digit-circle:active {
                transform: scale(0.95) !important;
            }
        `;
        document.head.appendChild(style);

        console.log('✅ Digit click handlers initialized');
    } else {
        console.warn('⚠️ Digit display container not found');
    }
}

// ===================================
// ENHANCED FEATURES
// ===================================

// Keyboard Shortcuts
document.addEventListener('keydown', e => {
    // Ignore if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    switch (e.key.toLowerCase()) {
        case 't':
            e.preventDefault();
            document.getElementById('theme-toggle')?.click();
            break;
        case 'e':
            e.preventDefault();
            downloadTickLog();
            console.log('📥 Exported via keyboard shortcut');
            break;
    }
});

// Connection status removed for cleaner UI

// Animated price updates
let lastPrice = 0;
function updatePriceDisplay(newPrice) {
    const priceEl = document.querySelector('.price-number');
    const changeEl = document.getElementById('price-change');

    if (priceEl) {
        priceEl.textContent = newPrice.toFixed(5);

        // Calculate change
        if (lastPrice > 0) {
            const change = ((newPrice - lastPrice) / lastPrice) * 100;
            if (changeEl) {
                changeEl.querySelector('span').textContent = Math.abs(change).toFixed(2) + '%';
                if (change > 0) {
                    changeEl.classList.add('up');
                    changeEl.classList.remove('down');
                } else if (change < 0) {
                    changeEl.classList.add('down');
                    changeEl.classList.remove('up');
                }
            }
        }
        lastPrice = newPrice;
    }

    // Update last update time
    const lastUpdateEl = document.getElementById('last-update');
    if (lastUpdateEl) {
        lastUpdateEl.textContent = 'Last update: ' + new Date().toLocaleTimeString();
    }
}

// Auto-refresh every 30 seconds (only if using basic WebSocket)
setInterval(() => {
    // Only refresh if using basic WebSocket (robust manager handles reconnection automatically)
    if (!robustWsManager && derivWs && derivWs.readyState !== WebSocket.OPEN) {
        console.log('🔄 Auto-refreshing basic WebSocket connection...');
        startWebSocket();
    } else if (robustWsManager) {
        const status = robustWsManager.getStatus();
        console.log('📊 Connection status:', status);

        // Force reconnect if no ticks received for too long
        if (status.timeSinceLastTick && status.timeSinceLastTick > 120000) {
            // 2 minutes
            console.log('🔄 Forcing reconnection due to stale data...');
            robustWsManager.forceReconnect();
        }
    }
}, 30000); // 30 seconds

// Enhanced export button
const exportBtn = document.getElementById('export-btn');
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        // Show export options
        const options = confirm('Export as CSV? (Cancel for PDF)');
        if (options) {
            downloadTickLog();
        } else {
            exportAsPDF();
        }
    });
}

// Manual reconnect button
const reconnectBtn = document.getElementById('reconnect-btn');
if (reconnectBtn) {
    reconnectBtn.addEventListener('click', () => {
        console.log('🔄 Manual reconnection requested...');

        if (robustWsManager) {
            robustWsManager.forceReconnect();

            // Visual feedback
            reconnectBtn.classList.add('spinning');
            setTimeout(() => {
                reconnectBtn.classList.remove('spinning');
            }, 2000);
        } else {
            startWebSocket();
        }
    });
}

// Export as PDF function
async function exportAsPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        pdf.setFontSize(20);
        pdf.text('Metatron Analysis Report', 20, 20);

        pdf.setFontSize(12);
        pdf.text(`Market: ${currentSymbol}`, 20, 35);
        pdf.text(`Tick Count: ${tickHistory.length}`, 20, 45);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 55);

        pdf.save(`metatron-analysis-${currentSymbol}-${Date.now()}.pdf`);
        console.log('📄 PDF exported successfully');
    } catch (error) {
        console.error('PDF export failed:', error);
        alert('PDF export requires jsPDF library');
    }
}

// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('zeusTheme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('zeusTheme', newTheme);

        console.log(`🎨 Theme switched to: ${newTheme}`);
    });
}

console.log('✨ Metatron Analysis Tool Enhanced - Loaded');
console.log('⌨️ Keyboard Shortcuts: T (Theme) | E (Export) | ? (Help)');
console.log('🔄 Auto-refresh enabled (every 30 seconds)');

// Global diagnostic functions for troubleshooting
window.diagnoseConnection = function() {
    console.log('🔍 Running connection diagnostics...');
    
    if (robustWsManager) {
        return robustWsManager.getConnectionDiagnostics();
    } else {
        console.warn('⚠️ RobustWebSocketManager not available');
        return {
            error: 'No connection manager available',
            basicWebSocket: derivWs ? {
                readyState: derivWs.readyState,
                url: derivWs.url
            } : 'No WebSocket'
        };
    }
};

window.forceReconnect = function() {
    console.log('🔄 Forcing reconnection...');
    
    if (robustWsManager) {
        robustWsManager.forceReconnect();
    } else {
        console.log('🔄 Restarting WebSocket connection...');
        startWebSocket();
    }
};

window.testConnection = function() {
    console.log('🧪 Testing connection...');
    
    if (robustWsManager) {
        return robustWsManager.diagnoseAndRecover();
    } else {
        console.warn('⚠️ Advanced diagnostics not available');
        return false;
    }
};

// Function to toggle Modes dropdown
function toggleModesDropdown() {
    const dropdown = document.getElementById('modes-dropdown');
    const isOpen = dropdown && dropdown.style.display === 'block';
    
    // Close all dropdowns first
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.style.display = 'none';
    });
    
    // Toggle this dropdown
    if (dropdown && !isOpen) {
        dropdown.style.display = 'block';
        
        // Close dropdown when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!e.target.closest('.dropdown-container')) {
                    dropdown.style.display = 'none';
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 0);
    }
}

// Function to select trading mode
function selectTradingMode(mode) {
    currentTradingMode = mode;
    
    // Close dropdown
    const dropdown = document.getElementById('modes-dropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    
    // Update button display
    updateModesButtonDisplay();
    
    // Handle mode-specific logic
    switch (mode) {
        case 'patel':
            console.log('🎯 Patel Mode activated - Traditional over/under trading');
            selectedTradingStrategy = 'traditional';
            break;
        case 'matches':
            console.log('🎯 Matches Mode activated - Digit matching predictions');
            selectedTradingStrategy = 'matches';
            break;
        case 'evenodd':
            console.log('⚪⚫ Even Odd Mode activated - Even/odd predictions');
            selectedTradingStrategy = 'enhanced_even_odd';
            break;
    }
    
    // Update digit display to reflect new mode
    updateDigitDisplay();
}

// Function to update Modes button display
function updateModesButtonDisplay() {
    const modesBtn = document.getElementById('modes-btn');
    if (!modesBtn) return;
    
    const modeIcons = {
        'patel': '🎯',
        'matches': '🔍',
        'evenodd': '⚪⚫'
    };
    
    const modeNames = {
        'patel': 'Patel',
        'matches': 'Matches',
        'evenodd': 'Even Odd'
    };
    
    const icon = modeIcons[currentTradingMode] || '🎯';
    const name = modeNames[currentTradingMode] || 'Patel';
    
    modesBtn.innerHTML = `
        ${icon} ${name}
        <svg width="12" height="12" viewBox="0 0 12 12" style="margin-left: 8px;">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    modesBtn.title = `${name} mode active - Click digits for ${name.toLowerCase()} trading`;
}

// Function to load bot with specific strategy
function loadBotWithStrategy(digit, strategy) {
    console.log(`🤖 Loading bot for digit ${digit} with ${strategy} strategy`);
    
    // Get current settings
    const settings = getPatelBotSettings();
    
    // Determine contract type and predictions based on digit and strategy
    let contractType, predictionBeforeLoss, predictionAfterLoss, botName;
    
    switch (strategy) {
        case 'traditional':
            // Traditional Patel strategy
            if (digit >= 0 && digit <= 4) {
                contractType = 'DIGITUNDER';
                predictionBeforeLoss = settings.underPredictionBefore || 8;
                predictionAfterLoss = settings.underPredictionAfter || 6;
                botName = `PATEL UNDER - Digit ${digit}`;
            } else {
                contractType = 'DIGITOVER';
                predictionBeforeLoss = settings.overPredictionBefore || 1;
                predictionAfterLoss = settings.overPredictionAfter || 2;
                botName = `PATEL OVER - Digit ${digit}`;
            }
            break;
            
        case 'matches':
            // Matches strategy - predict exact digit
            contractType = 'DIGITMATCH';
            predictionBeforeLoss = 10; // Standard for matches
            predictionAfterLoss = 15;
            botName = `MATCHES - Digit ${digit}`;
            break;
            
        case 'enhanced_even_odd':
            // Even/Odd strategy
            contractType = digit % 2 === 0 ? 'DIGITEVEN' : 'DIGITODD';
            predictionBeforeLoss = 5;
            predictionAfterLoss = 8;
            botName = `EVEN/ODD - ${digit % 2 === 0 ? 'Even' : 'Odd'}`;
            break;
            
        default:
            console.warn('⚠️ Unknown strategy:', strategy);
            return;
    }
    
    // Create bot configuration
    const botConfig = {
        botFile: strategy === 'matches' ? 'MATCHES (with Entry).xml' : 'PATEL (with Entry).xml',
        botName: botName,
        market: currentSymbol || 'R_50',
        contractType: contractType,
        predictionBeforeLoss: predictionBeforeLoss,
        predictionAfterLoss: predictionAfterLoss,
        selectedDigit: digit,
        entryPointDigit: digit,
        strategy: strategy.toUpperCase(),
        stake: settings.stake || 1,
        martingale: settings.martingale || 2,
        maxMartingaleSteps: settings.maxMartingaleSteps || 3,
        riskLimitsEnabled: settings.enableRiskLimits || false
    };
    
    // AUTO-LOAD MODES: Direct Bot Builder integration for all modes
    if (strategy === 'traditional') {
        // PATEL MODE: Auto-load PATEL bot
        console.log('⚡ FAST PATEL MODE: Loading bot directly into Bot Builder');
        
        const botLoadEvent = {
            type: 'LOAD_PATEL_BOT',
            data: {
                botFile: 'PATEL (with Entry).xml',
                botName: botConfig.botName,
                market: botConfig.market,
                contractType: botConfig.contractType,
                predictionBeforeLoss: botConfig.predictionBeforeLoss,
                predictionAfterLoss: botConfig.predictionAfterLoss,
                selectedDigit: botConfig.selectedDigit,
                entryPointDigit: botConfig.entryPointDigit,
                strategy: botConfig.strategy,
                stake: botConfig.stake,
                martingale: botConfig.martingale,
                maxMartingaleSteps: botConfig.maxMartingaleSteps
            }
        };
        
        // Send to main application
        if (window.parent && window.parent !== window) {
            window.parent.postMessage(botLoadEvent, '*');
            console.log('✅ PATEL bot load request sent to main application');
        }
        
        // Show fast loading feedback
        showFastPatelLoadingFeedback(digit, botConfig.contractType);
        
        console.log('⚡ FAST PATEL MODE: Bot loading initiated - switching to Bot Builder');
        return;
        
    } else if (strategy === 'matches') {
        // MATCHES MODE: Auto-load MATCHES bot
        console.log('⚡ FAST MATCHES MODE: Loading bot directly into Bot Builder');
        
        const botLoadEvent = {
            type: 'LOAD_MATCHES_BOT',
            data: {
                botFile: 'MATCHES (with Entry).xml',
                botName: `MATCHES Bot - Digit ${digit}`,
                market: botConfig.market,
                contractType: 'DIGITMATCHES',
                tradeType: 'matches',
                predictionBeforeLoss: digit, // For matches, prediction equals target digit
                predictionAfterLoss: digit,
                selectedDigit: digit,
                entryPointDigit: digit,
                targetDigit: digit,
                strategy: 'MATCHES',
                stake: botConfig.stake,
                martingale: botConfig.martingale,
                maxMartingaleSteps: botConfig.maxMartingaleSteps
            }
        };
        
        // Send to main application
        if (window.parent && window.parent !== window) {
            window.parent.postMessage(botLoadEvent, '*');
            console.log('✅ MATCHES bot load request sent to main application');
        }
        
        // Show fast loading feedback
        showFastMatchesLoadingFeedback(digit);
        
        console.log('⚡ FAST MATCHES MODE: Bot loading initiated - switching to Bot Builder');
        return;
        
    } else if (strategy === 'enhanced_even_odd') {
        // EVEN/ODD MODE: Auto-load Even/Odd bot
        console.log('⚡ FAST EVEN/ODD MODE: Loading bot directly into Bot Builder');
        
        const isEven = digit % 2 === 0;
        const botLoadEvent = {
            type: 'LOAD_EVEN_ODD_BOT',
            data: {
                botFile: 'CFX-EvenOdd.xml',
                botName: `Even/Odd Bot - ${isEven ? 'Even' : 'Odd'} (Digit ${digit})`,
                market: botConfig.market,
                contractType: isEven ? 'DIGITEVEN' : 'DIGITODD',
                tradeType: 'digits',
                selectedDigit: digit,
                entryPointDigit: digit,
                evenOddType: isEven ? 'EVEN' : 'ODD',
                strategy: 'EVEN_ODD',
                stake: botConfig.stake,
                martingale: botConfig.martingale,
                maxMartingaleSteps: botConfig.maxMartingaleSteps
            }
        };
        
        // Send to main application
        if (window.parent && window.parent !== window) {
            window.parent.postMessage(botLoadEvent, '*');
            console.log('✅ EVEN/ODD bot load request sent to main application');
        }
        
        // Show fast loading feedback
        showFastEvenOddLoadingFeedback(digit, isEven);
        
        console.log('⚡ FAST EVEN/ODD MODE: Bot loading initiated - switching to Bot Builder');
        return;
    }
    
    // For other strategies, send to parent window (main application)
    if (window.parent && window.parent !== window) {
        window.parent.postMessage(
            {
                type: 'LOAD_BOT_WITH_STRATEGY',
                data: botConfig,
            },
            '*'
        );
        
        console.log('✅ Bot load request sent to parent window:', botConfig);
        
        // Show user feedback only for non-Patel strategies
        showBotLoadingFeedback(digit, strategy, contractType);
    } else {
        console.warn('⚠️ Not running in iframe - cannot send bot load request');
        // Show configuration for testing
        alert(
            `Bot Configuration:\n` +
            `Strategy: ${strategy}\n` +
            `Digit: ${digit}\n` +
            `Contract Type: ${contractType}\n` +
            `Bot Name: ${botName}\n` +
            `Market: ${currentSymbol || 'R_50'}`
        );
    }
}

// Function to show fast MATCHES bot loading feedback
function showFastMatchesLoadingFeedback(digit) {
    const feedback = document.createElement('div');
    feedback.className = 'fast-matches-loading-feedback';
    feedback.innerHTML = `
        <div class="feedback-content">
            <div class="feedback-icon">🎲</div>
            <div class="feedback-text">
                <div class="feedback-title">Loading MATCHES Bot</div>
                <div class="feedback-details">
                    <strong>Target Digit ${digit}</strong> | 
                    <strong>DIGITMATCHES</strong>
                </div>
                <div class="feedback-status">
                    Switching to Bot Builder...
                </div>
            </div>
            <div class="feedback-spinner">🔄</div>
        </div>
    `;

    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 1rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 3000);
}

// Function to show fast EVEN/ODD bot loading feedback
function showFastEvenOddLoadingFeedback(digit, isEven) {
    const feedback = document.createElement('div');
    feedback.className = 'fast-evenodd-loading-feedback';
    feedback.innerHTML = `
        <div class="feedback-content">
            <div class="feedback-icon">${isEven ? '⚪' : '⚫'}</div>
            <div class="feedback-text">
                <div class="feedback-title">Loading Even/Odd Bot</div>
                <div class="feedback-details">
                    <strong>Digit ${digit} (${isEven ? 'Even' : 'Odd'})</strong> | 
                    <strong>DIGIT${isEven ? 'EVEN' : 'ODD'}</strong>
                </div>
                <div class="feedback-status">
                    Switching to Bot Builder...
                </div>
            </div>
            <div class="feedback-spinner">🔄</div>
        </div>
    `;

    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, ${isEven ? '#10b981 0%, #059669 100%' : '#ef4444 0%, #dc2626 100%'});
        color: white;
        padding: 1rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(${isEven ? '16, 185, 129' : '239, 68, 68'}, 0.3);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 3000);
}

// Function to show fast PATEL bot loading feedback
function showFastPatelLoadingFeedback(digit, contractType) {
    // Create feedback notification
    const feedback = document.createElement('div');
    feedback.className = 'fast-patel-loading-feedback';
    feedback.innerHTML = `
        <div class="feedback-content">
            <div class="feedback-icon">⚡</div>
            <div class="feedback-text">
                <div class="feedback-title">Loading PATEL Bot</div>
                <div class="feedback-details">
                    <strong>Digit ${digit}</strong> | 
                    <strong>${contractType}</strong>
                </div>
                <div class="feedback-status">
                    Switching to Bot Builder...
                </div>
            </div>
            <div class="feedback-spinner">🔄</div>
        </div>
    `;

    // Add styles
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 1rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    // Add animation styles if not already added
    if (!document.getElementById('fast-patel-feedback-styles')) {
        const style = document.createElement('style');
        style.id = 'fast-patel-feedback-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .fast-patel-loading-feedback .feedback-content {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            .fast-patel-loading-feedback .feedback-icon {
                font-size: 2rem;
                flex-shrink: 0;
            }
            .fast-patel-loading-feedback .feedback-text {
                flex: 1;
            }
            .fast-patel-loading-feedback .feedback-title {
                font-weight: 600;
                margin-bottom: 0.5rem;
                font-size: 1rem;
            }
            .fast-patel-loading-feedback .feedback-details {
                font-size: 0.875rem;
                opacity: 0.9;
                margin-bottom: 0.25rem;
            }
            .fast-patel-loading-feedback .feedback-status {
                font-size: 0.75rem;
                opacity: 0.8;
                font-style: italic;
            }
            .fast-patel-loading-feedback .feedback-spinner {
                font-size: 1.5rem;
                animation: spin 1s linear infinite;
                flex-shrink: 0;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(feedback);

    // Auto-remove after 3 seconds (bot should be loaded by then)
    setTimeout(() => {
        if (feedback.parentElement) {
            feedback.remove();
        }
    }, 3000);
}

// Function to show bot loading feedback
function showBotLoadingFeedback(digit, strategy, contractType) {
    // Create feedback notification
    const feedback = document.createElement('div');
    feedback.className = 'bot-loading-feedback';
    feedback.innerHTML = `
        <div class="feedback-content">
            <div class="feedback-icon">🤖</div>
            <div class="feedback-text">
                <div class="feedback-title">Loading ${strategy.toUpperCase()} Bot</div>
                <div class="feedback-details">
                    <strong>Digit ${digit}</strong> | 
                    <strong>${contractType}</strong>
                </div>
                <div class="feedback-strategy">
                    Strategy: <strong>${strategy}</strong>
                </div>
            </div>
            <button class="feedback-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    // Add styles
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
        color: white;
        padding: 1rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(feedback);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (feedback.parentElement) {
            feedback.remove();
        }
    }, 4000);
}

// Function to get PATEL bot settings (fallback if not defined elsewhere)
function getPatelBotSettings() {
    return {
        stake: 1,
        martingale: 2,
        maxMartingaleSteps: 3,
        enableRiskLimits: false,
        underPredictionBefore: 8,
        underPredictionAfter: 6,
        overPredictionBefore: 1,
        overPredictionAfter: 2,
        showRiskWarnings: true,
        autoApplyGlobal: false,
        overrideAdvanced: false
    };
}

// Make functions globally available for debugging
window.loadBotWithStrategy = loadBotWithStrategy;
window.toggleModesDropdown = toggleModesDropdown;
window.selectTradingMode = selectTradingMode;
window.updateModesButtonDisplay = updateModesButtonDisplay;

// Initialize modes system on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize with default mode
    updateModesButtonDisplay();
    
    // Add keyboard shortcut for modes (M key)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'm' || e.key === 'M') {
            if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
                toggleModesDropdown();
                e.preventDefault();
            }
        }
    });
});

// Add diagnostic info to console on load
setTimeout(() => {
    console.log('🔍 Connection Status on Load:');
    if (typeof window.diagnoseConnection === 'function') {
        window.diagnoseConnection();
    }
}, 3000);

