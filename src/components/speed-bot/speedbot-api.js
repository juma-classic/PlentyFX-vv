// SpeedBot API for live trading
(function () {
    // WebSocket connection
    let ws = null;
    let isTrading = false;
    let tickData = {};
    let tradeParams = {};
    let currentStake = 0;
    let lastResult = null;

    // Get API configuration from environment or use default
    const getApiConfig = () => {
        const appId = window.DERIV_APP_ID || '119552';
        return `wss://ws.derivws.com/websockets/v3?app_id=${appId}`;
    };

    // Initialize WebSocket connection
    function initWebSocket() {
        if (ws) {
            return;
        }

        ws = new WebSocket(getApiConfig());

        ws.onopen = function () {
            console.log('WebSocket connection established');
        };

        ws.onmessage = function (event) {
            const data = JSON.parse(event.data);

            // Handle tick data
            if (data.tick) {
                const symbol = data.tick.symbol;
                tickData[symbol] = {
                    quote: data.tick.quote,
                    timestamp: new Date().getTime(),
                };

                // Process trade if trading is active
                if (isTrading && symbol === tradeParams.market) {
                    processTrade(symbol, data.tick.quote);
                }
            }
        };

        ws.onerror = function (error) {
            console.error('WebSocket error:', error);
        };

        ws.onclose = function () {
            console.log('WebSocket connection closed');
            ws = null;
        };
    }

    // Subscribe to tick data for a symbol
    function subscribeToTicks(symbol) {
        if (!ws) {
            initWebSocket();
        }

        ws.send(
            JSON.stringify({
                ticks: symbol,
                subscribe: 1,
            })
        );
    }

    // Process a trade based on strategy
    function processTrade(symbol, quote) {
        // Generate a random result (win/loss) for demo purposes
        // In a real implementation, this would use actual market data and strategy
        const result = Math.random() > 0.5 ? 'win' : 'loss';
        const entrySpot = quote;
        const exitSpot = quote + (result === 'win' ? 0.1 : -0.1);
        const profit = result === 'win' ? currentStake * 0.95 : 0;

        // Apply martingale strategy if needed
        if (lastResult === 'loss' && result === 'loss') {
            currentStake = currentStake * tradeParams.martingale;
        } else if (result === 'win') {
            currentStake = tradeParams.stake;
        }

        lastResult = result;

        // Send trade update
        const tradeUpdate = {
            trade_update: {
                result,
                profit,
                symbol,
                entry_spot: entrySpot,
                exit_spot: exitSpot,
                stake: currentStake,
            },
        };

        window.postMessage(JSON.stringify(tradeUpdate), '*');

        // Schedule next trade if still trading
        if (isTrading) {
            setTimeout(() => {
                if (isTrading) {
                    processTrade(symbol, tickData[symbol]?.quote || quote);
                }
            }, 2000); // Trade every 2 seconds
        }
    }

    // Start trading
    function startSpeedBotTrading(params) {
        if (isTrading) {
            return;
        }

        tradeParams = params;
        currentStake = params.stake;
        lastResult = null;
        isTrading = true;

        // Initialize WebSocket if needed
        if (!ws) {
            initWebSocket();
        }

        // Subscribe to ticks for the selected market
        subscribeToTicks(params.market);

        // Start processing trades
        if (tickData[params.market]) {
            processTrade(params.market, tickData[params.market].quote);
        } else {
            // Wait for first tick
            setTimeout(() => {
                if (isTrading && tickData[params.market]) {
                    processTrade(params.market, tickData[params.market].quote);
                }
            }, 1000);
        }

        console.log('SpeedBot trading started with params:', params);
    }

    // Stop trading
    function stopSpeedBotTrading() {
        isTrading = false;
        console.log('SpeedBot trading stopped');
    }

    // Expose functions to window
    window.startSpeedBotTrading = startSpeedBotTrading;
    window.stopSpeedBotTrading = stopSpeedBotTrading;

    // Initialize on load
    initWebSocket();

    console.log('SpeedBot API loaded');
})();

