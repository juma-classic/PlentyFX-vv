// ======================================
// STATE MANAGEMENT
// ======================================
const state = {
    timeframe: '5m',
    chartType: 'candlestick',
    symbol: 'volatility-75',
    price: 50234.56,
    change: 342.18,
    changePercent: 0.68,
    chart: null,
    series: null,
    dataArray: [],
    updateInterval: null
};

// ======================================
// SYMBOL NAME MAPPING
// ======================================
const symbolNames = {
    'volatility-10': 'Volatility 10 Index',
    'volatility-10-1s': 'Volatility 10 (1s) Index',
    'volatility-25': 'Volatility 25 Index',
    'volatility-25-1s': 'Volatility 25 (1s) Index',
    'volatility-50': 'Volatility 50 Index',
    'volatility-50-1s': 'Volatility 50 (1s) Index',
    'volatility-75': 'Volatility 75 Index',
    'volatility-75-1s': 'Volatility 75 (1s) Index',
    'volatility-100': 'Volatility 100 Index',
    'volatility-100-1s': 'Volatility 100 (1s) Index',
    'volatility-150': 'Volatility 150 Index',
    'volatility-150-1s': 'Volatility 150 (1s) Index',
    'volatility-200': 'Volatility 200 Index',
    'volatility-200-1s': 'Volatility 200 (1s) Index',
    'volatility-250': 'Volatility 250 Index',
    'volatility-250-1s': 'Volatility 250 (1s) Index'
};

// ======================================
// CHART INITIALIZATION
// ======================================
function generateMockData() {
    const data = [];
    let time = Math.floor(Date.now() / 1000) - 1000 * 300;
    let price = state.price;

    for (let i = 0; i < 300; i++) {
        const change = (Math.random() - 0.5) * 200;
        const open = price;
        price += change;
        const close = price;
        const high = Math.max(open, close) + Math.random() * 100;
        const low = Math.min(open, close) - Math.random() * 100;

        data.push({
            time: time + i * 60,
            open: open,
            high: high,
            low: low,
            close: close
        });
    }
    return data;
}

function initChart() {
    const chartContainer = document.getElementById('chart');
    
    // Remove existing chart if any
    if (state.chart) {
        state.chart.remove();
    }

    // Get container dimensions
    const width = chartContainer.clientWidth || 800;
    const height = chartContainer.clientHeight || 500;

    // Create new chart
    state.chart = LightweightCharts.createChart(chartContainer, {
        layout: {
            background: { type: LightweightCharts.ColorType.Solid, color: '#0b1217' },
            textColor: '#d1d5db',
        },
        grid: {
            vertLines: { color: '#1f2937', visible: true },
            horzLines: { color: '#1f2937', visible: true },
        },
        width: width,
        height: height,
        timeScale: {
            borderColor: '#374151',
            timeVisible: true,
            secondsVisible: false,
        },
        rightPriceScale: {
            borderColor: '#374151',
            visible: true,
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
            vertLine: {
                color: '#6b7280',
                labelBackgroundColor: '#374151',
                width: 1,
                style: LightweightCharts.LineStyle.Solid,
            },
            horzLine: {
                color: '#6b7280',
                labelBackgroundColor: '#374151',
                width: 1,
                style: LightweightCharts.LineStyle.Solid,
            },
        },
    });

    // Generate data
    const data = generateMockData();
    state.dataArray = data;

    // Add series based on chart type
    if (state.chartType === 'candlestick') {
        state.series = state.chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });
        state.series.setData(data);
        console.log('Candlestick data loaded:', data.length, 'candles');
    } else if (state.chartType === 'line') {
        state.series = state.chart.addLineSeries({
            color: '#22c55e',
            lineWidth: 2,
        });
        state.series.setData(data.map(d => ({ time: d.time, value: d.close })));
    } else if (state.chartType === 'area') {
        state.series = state.chart.addAreaSeries({
            lineColor: '#22c55e',
            topColor: 'rgba(34, 197, 94, 0.2)',
            bottomColor: 'rgba(34, 197, 94, 0)',
            lineWidth: 2,
        });
        state.series.setData(data.map(d => ({ time: d.time, value: d.close })));
    }

    // Fit content and ensure proper visibility
    state.chart.timeScale().fitContent();
    state.chart.timeScale().scrollToPosition(0, false);

    // Start live updates
    startLiveUpdates();
}

// ======================================
// LIVE DATA UPDATES
// ======================================
function startLiveUpdates() {
    // Clear existing interval
    if (state.updateInterval) {
        clearInterval(state.updateInterval);
    }

    // Update every second
    state.updateInterval = setInterval(() => {
        if (!state.series || !state.dataArray.length) return;

        const lastCandle = state.dataArray[state.dataArray.length - 1];
        const change = (Math.random() - 0.5) * 100;
        const newClose = lastCandle.close + change;
        const newHigh = Math.max(lastCandle.high, newClose);
        const newLow = Math.min(lastCandle.low, newClose);

        const updatedCandle = {
            time: lastCandle.time,
            open: lastCandle.open,
            high: newHigh,
            low: newLow,
            close: newClose
        };

        state.dataArray[state.dataArray.length - 1] = updatedCandle;

        if (state.chartType === 'candlestick') {
            state.series.update(updatedCandle);
        } else {
            state.series.update({ time: updatedCandle.time, value: updatedCandle.close });
        }

        // Update price display
        updatePriceDisplay(newClose);
    }, 1000);
}

// ======================================
// UPDATE PRICE DISPLAY
// ======================================
function updatePriceDisplay(newPrice) {
    const oldPrice = state.price;
    state.price = newPrice;
    state.change = newPrice - oldPrice;
    state.changePercent = (state.change / oldPrice) * 100;

    const priceValue = document.getElementById('priceValue');
    const changeText = document.getElementById('changeText');
    const priceChange = document.getElementById('priceChange');
    const changeIcon = document.getElementById('changeIcon');
    const highValue = document.getElementById('highValue');
    const lowValue = document.getElementById('lowValue');

    priceValue.textContent = `$${newPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const isPositive = state.change >= 0;
    changeText.textContent = `${isPositive ? '+' : ''}${state.change.toFixed(2)} (${state.changePercent.toFixed(2)}%)`;
    
    if (isPositive) {
        priceChange.classList.add('positive');
        priceChange.classList.remove('negative');
        changeIcon.innerHTML = '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>';
    } else {
        priceChange.classList.add('negative');
        priceChange.classList.remove('positive');
        changeIcon.innerHTML = '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline>';
    }

    highValue.textContent = `$${(newPrice * 1.05).toFixed(2)}`;
    lowValue.textContent = `$${(newPrice * 0.95).toFixed(2)}`;
}

// ======================================
// SYMBOL CHANGE HANDLER
// ======================================
function handleSymbolChange(newSymbol) {
    state.symbol = newSymbol;
    const symbolName = symbolNames[newSymbol] || 'Volatility 75 Index';
    document.getElementById('symbolName').textContent = symbolName;
    
    // Regenerate chart data with new symbol
    initChart();
}

// ======================================
// CHART TYPE CHANGE HANDLER
// ======================================
function handleChartTypeChange(newType) {
    state.chartType = newType;
    
    // Update button states
    document.querySelectorAll('.chart-type-buttons .btn').forEach(btn => {
        btn.classList.remove('btn-active');
    });
    document.getElementById(`${newType}Btn`).classList.add('btn-active');
    
    // Reinitialize chart
    initChart();
}

// ======================================
// TIMEFRAME CHANGE HANDLER
// ======================================
function handleTimeframeChange(newTimeframe) {
    state.timeframe = newTimeframe;
    
    // Update button states
    document.querySelectorAll('.timeframe-buttons .btn-sm').forEach(btn => {
        btn.classList.remove('btn-active');
        if (btn.getAttribute('data-timeframe') === newTimeframe) {
            btn.classList.add('btn-active');
        }
    });
    
    // Update select value
    document.getElementById('timeframeSelect').value = newTimeframe;
    
    // In a real implementation, this would fetch new data based on timeframe
    console.log(`Timeframe changed to: ${newTimeframe}`);
}

// ======================================
// WINDOW RESIZE HANDLER
// ======================================
function handleResize() {
    if (state.chart) {
        const chartContainer = document.getElementById('chart');
        state.chart.applyOptions({
            width: chartContainer.clientWidth,
        });
    }
}

// ======================================
// EVENT LISTENERS
// ======================================
function setupEventListeners() {
    // Symbol select
    document.getElementById('symbolSelect').addEventListener('change', (e) => {
        handleSymbolChange(e.target.value);
    });

    // Chart type buttons
    document.getElementById('candlestickBtn').addEventListener('click', () => {
        handleChartTypeChange('candlestick');
    });
    document.getElementById('lineBtn').addEventListener('click', () => {
        handleChartTypeChange('line');
    });
    document.getElementById('areaBtn').addEventListener('click', () => {
        handleChartTypeChange('area');
    });

    // Timeframe buttons
    document.querySelectorAll('.timeframe-buttons .btn-sm').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const timeframe = e.target.getAttribute('data-timeframe');
            handleTimeframeChange(timeframe);
        });
    });

    // Mobile timeframe select
    document.getElementById('timeframeSelect').addEventListener('change', (e) => {
        handleTimeframeChange(e.target.value);
    });

    // Window resize
    window.addEventListener('resize', handleResize);
}

// ======================================
// INITIALIZATION
// ======================================
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    setupEventListeners();
    updatePriceDisplay(state.price);
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (state.updateInterval) {
        clearInterval(state.updateInterval);
    }
    if (state.chart) {
        state.chart.remove();
    }
});
