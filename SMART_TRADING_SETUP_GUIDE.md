# Smart Trading Setup Guide

## Overview

The Smart Trading feature provides automated trading based on real-time market analysis. It connects to Deriv API to execute trades automatically when your defined conditions are met.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SMART TRADING SYSTEM                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐      ┌──────────────┐
│   Market     │    │   Smart      │      │   Deriv      │
│   Analyzer   │───▶│   Trading    │─────▶│   API        │
│              │    │   Executor   │      │              │
│ • Tick data  │    │ • Conditions │      │ • Execute    │
│ • Analysis   │    │ • Martingale │      │ • Track      │
│ • Signals    │    │ • History    │      │ • Results    │
└──────────────┘    └──────────────┘      └──────────────┘
```

---

## Components

### 1. Market Analyzer Service (`src/services/market-analyzer.service.ts`)
- Connects to Deriv WebSocket API
- Collects real-time tick data
- Analyzes patterns for:
  - Rise/Fall
  - Even/Odd
  - Over/Under
  - Matches/Differs
- Generates signals with confidence levels

### 2. Smart Trading Executor (`src/services/smart-trading-executor.service.ts`)
- Connects to Deriv API for trade execution
- Handles authentication
- Executes trades based on conditions
- Implements martingale logic
- Tracks trade history and statistics

### 3. Smart Trading Cards (`src/pages/strategy-orchestrator/SmartTradingCards.tsx`)
- User interface for setting up trading conditions
- Real-time display of probabilities
- Controls for stake, ticks, and martingale
- Start/Stop trading buttons

---

## Setup Instructions

### Step 1: Login to Deriv

The system needs a Deriv API token to execute trades. You have two options:

#### Option A: Login through Zeus Trading Hub
1. Click the "Login" button in the header
2. Login with your Deriv account
3. The system will automatically store your auth token

#### Option B: Manual Token Setup
1. Go to https://app.deriv.com/account/api-token
2. Create a new API token with these scopes:
   - ✅ Read
   - ✅ Trade
   - ✅ Payments
3. Copy the token
4. Open browser console (F12)
5. Run: `localStorage.setItem('speed_mode_token', 'YOUR_TOKEN_HERE')`

### Step 2: Configure App ID

The default App ID is `110800`. If you want to use your own:

1. Register your app at https://api.deriv.com/app-registration
2. Get your App ID
3. Open browser console (F12)
4. Run: `localStorage.setItem('speed_mode_app_id', 'YOUR_APP_ID')`

### Step 3: Navigate to Strategy Orchestrator

1. Go to the "Strategy Orchestrator" tab in the navigation menu
2. Scroll down to the "Smart Trading" section
3. You'll see two cards: "Over/Under" and "Even/Odd"

### Step 4: Configure Market Analyzer

Before trading, configure the market analyzer:

1. **Symbol**: Select which volatility index to trade (R_10, R_25, R_50, etc.)
2. **Tick Count**: Choose how many ticks to analyze (55, 120, or 255)
3. **Barrier**: For Over/Under, set the barrier digit (0-9)

Wait for the analyzer to collect enough ticks before starting trading.

### Step 5: Set Up Trading Conditions

#### For Over/Under:
1. Set the barrier (default: 5)
2. Configure trading condition:
   - Select "Over Prob" or "Under Prob"
   - Choose comparison operator (>, >=, <, <=, =)
   - Set threshold percentage (e.g., 55%)
   - Optional: Enable "last N ticks" condition
3. Set stake, ticks, and martingale multiplier
4. Click "Start Auto Trading"

#### For Even/Odd:
1. Configure trading condition:
   - Set how many last digits to check (e.g., 3)
   - Choose "Even" or "Odd"
2. Set stake, ticks, and martingale multiplier
3. Click "Start Auto Trading"

---

## How It Works

### Market Analysis Flow

1. **Connection**: Market Analyzer connects to Deriv WebSocket
2. **Data Collection**: Subscribes to tick history for selected symbol
3. **Analysis**: Analyzes last N ticks for patterns
4. **Signal Generation**: Calculates probabilities and generates signals
5. **Condition Check**: Smart Trading Cards check if conditions are met
6. **Trade Execution**: If conditions match, executor places trade

### Trade Execution Flow

1. **Condition Met**: Trading condition is satisfied
2. **Initialize**: Executor connects to Deriv API (if not already connected)
3. **Authorize**: Authenticates with stored token
4. **Calculate Stake**: Applies martingale if previous trade was a loss
5. **Get Proposal**: Requests trade proposal from Deriv
6. **Execute**: Buys the contract
7. **Wait for Result**: Monitors contract until settled
8. **Record**: Saves trade result to history
9. **Update Streak**: Updates win/loss streak for martingale

### Martingale Logic

The system implements martingale money management:

- **Base Stake**: Your configured stake amount
- **After Win**: Stake resets to base stake
- **After Loss**: Stake = Base Stake × (Multiplier ^ Streak)

Example with base stake $1 and multiplier 2:
- Trade 1: $1 (loss)
- Trade 2: $2 (loss)
- Trade 3: $4 (loss)
- Trade 4: $8 (win)
- Trade 5: $1 (reset)

---

## Contract Types

### Over/Under
- **DIGITOVER**: Last digit will be ≥ barrier
- **DIGITUNDER**: Last digit will be < barrier
- **Barrier**: Configurable (0-9), default is 5

### Even/Odd
- **DIGITEVEN**: Last digit will be even (0, 2, 4, 6, 8)
- **DIGITODD**: Last digit will be odd (1, 3, 5, 7, 9)

---

## API Integration Details

### WebSocket Connections

The system uses two WebSocket connections:

1. **Market Analyzer**: `wss://ws.derivws.com/websockets/v3?app_id=110800`
   - Purpose: Real-time tick data
   - No authentication required
   - Subscribes to tick history

2. **Trading Executor**: `wss://ws.binaryws.com/websockets/v3?app_id=110800`
   - Purpose: Trade execution
   - Requires authentication token
   - Executes buy contracts

### API Calls

#### Get Proposal
```json
{
  "proposal": 1,
  "amount": 1.0,
  "basis": "stake",
  "contract_type": "DIGITEVEN",
  "currency": "USD",
  "duration": 1,
  "duration_unit": "t",
  "symbol": "R_100"
}
```

#### Buy Contract
```json
{
  "buy": "proposal_id",
  "price": 1.0
}
```

#### Check Contract Status
```json
{
  "proposal_open_contract": 1,
  "contract_id": "contract_id"
}
```

---

## Safety Features

### Built-in Protections

1. **Single Trade Lock**: Only one trade can execute at a time
2. **Auto-Reconnect**: Automatically reconnects if connection drops
3. **Error Handling**: Graceful error handling with user notifications
4. **History Tracking**: All trades are logged for review
5. **Streak Reset**: Can manually reset martingale streak

### Risk Management

1. **Set Maximum Loss Streak**: Configure max martingale streak in strategy settings
2. **Monitor Balance**: Check account balance before trading
3. **Start Small**: Begin with small stakes to test the system
4. **Use Demo Account**: Test with virtual money first

---

## Monitoring & Statistics

### Real-Time Monitoring

The system provides real-time feedback:

- **Connection Status**: Green dot = connected, Red dot = disconnected
- **Ticks Collected**: Shows progress of data collection
- **Current Price**: Displays latest tick price
- **Probabilities**: Live probability bars for Over/Under and Even/Odd
- **Pattern Display**: Shows last 10 digits pattern for Even/Odd

### Trade Statistics

Access statistics via the executor:

```javascript
const stats = smartTradingExecutor.getStatistics();
// Returns:
// {
//   totalTrades: 50,
//   wins: 30,
//   losses: 20,
//   winRate: 60,
//   totalProfit: 15.50,
//   currentStreak: 3,
//   streakType: 'win'
// }
```

### Trade History

View recent trades:

```javascript
const history = smartTradingExecutor.getTradeHistory(10);
// Returns last 10 trades with details
```

---

## Troubleshooting

### "Failed to connect to Deriv API"

**Cause**: No auth token found or invalid token

**Solution**:
1. Make sure you're logged in to Deriv
2. Check if token exists: `localStorage.getItem('speed_mode_token')`
3. If not, follow Step 1 in Setup Instructions

### "Trade already in progress"

**Cause**: Previous trade hasn't completed yet

**Solution**: Wait for current trade to finish (usually 1-5 ticks)

### "WebSocket not ready"

**Cause**: Connection to Deriv API lost

**Solution**: 
1. Check internet connection
2. System will auto-reconnect
3. If persists, refresh the page

### No trades executing despite conditions being met

**Possible Causes**:
1. Auto trading not started (click "Start Auto Trading")
2. Conditions not actually met (check probability values)
3. Not enough ticks collected yet
4. API connection issue

**Solution**: Check each item above and verify in console logs

### Martingale stake too high

**Cause**: Long loss streak with high multiplier

**Solution**:
1. Click "Stop Auto Trading"
2. Reset streak: `smartTradingExecutor.resetStreak()`
3. Lower martingale multiplier
4. Restart trading

---

## Advanced Usage

### Custom Conditions

You can create complex trading conditions:

```typescript
// Example: Trade OVER only if:
// - Over probability > 60%
// - Last 3 ticks were all OVER
// - Current streak < 5

if (overProb > 60 && 
    last3TicksPattern.every(d => d >= barrier) &&
    currentStreak < 5) {
    executeTrade('over-under', 'OVER', settings);
}
```

### Event Listeners

Listen to trade events:

```typescript
smartTradingExecutor.on('trade-executed', (data) => {
    console.log('Trade result:', data.trade);
    console.log('Current streak:', data.streak);
});

smartTradingExecutor.on('trade-error', (data) => {
    console.error('Trade failed:', data.error);
});
```

### Manual Trade Execution

Execute trades programmatically:

```typescript
const result = await smartTradingExecutor.executeTrade({
    type: 'even-odd',
    prediction: 'EVEN',
    settings: {
        stake: 1.0,
        ticks: 1,
        martingale: 2.0
    },
    symbol: 'R_100'
});
```

---

## Best Practices

### 1. Start with Demo Account
- Test the system with virtual money first
- Understand how conditions work
- Verify martingale calculations

### 2. Conservative Settings
- Start with low stakes ($0.35 - $1)
- Use moderate martingale multipliers (1.5 - 2.0)
- Set reasonable confidence thresholds (55-60%)

### 3. Monitor Performance
- Check win rate regularly
- Adjust conditions based on results
- Don't chase losses with high martingale

### 4. Diversify Strategies
- Don't rely on single strategy
- Test different symbols
- Vary tick counts and barriers

### 5. Set Limits
- Define daily loss limit
- Set profit targets
- Take breaks between sessions

---

## API Rate Limits

Deriv API has rate limits:

- **Proposals**: 5 per second
- **Buys**: 5 per second
- **Contract Status**: 10 per second

The executor handles rate limiting automatically with request queuing.

---

## Support & Resources

### Official Documentation
- Deriv API Docs: https://api.deriv.com/
- WebSocket API: https://api.deriv.com/api-explorer
- App Registration: https://api.deriv.com/app-registration

### Code References
- Market Analyzer: `src/services/market-analyzer.service.ts`
- Trading Executor: `src/services/smart-trading-executor.service.ts`
- Smart Trading Cards: `src/pages/strategy-orchestrator/SmartTradingCards.tsx`
- Deriv API Wrapper: `src/utils/deriv-trading-api.ts`

### Console Commands

Useful commands for debugging:

```javascript
// Check if executor is ready
smartTradingExecutor.isReady()

// Get current balance
await smartTradingExecutor.getBalance()

// View statistics
smartTradingExecutor.getStatistics()

// View trade history
smartTradingExecutor.getTradeHistory(20)

// Reset streak
smartTradingExecutor.resetStreak()

// Clear history
smartTradingExecutor.clearHistory()

// Check market analyzer status
marketAnalyzer.getStatus()

// Get tick history
marketAnalyzer.getTickHistory()
```

---

## Disclaimer

⚠️ **Trading involves risk. This is an automated trading system that can result in financial loss. Use at your own risk.**

- Start with demo accounts
- Never trade more than you can afford to lose
- Past performance doesn't guarantee future results
- Monitor your trades actively
- Understand the risks of martingale strategies

---

## Summary

The Smart Trading feature is now fully functional and connected to Deriv API. To use it:

1. ✅ Login to Deriv (get auth token)
2. ✅ Navigate to Strategy Orchestrator
3. ✅ Configure Market Analyzer (symbol, ticks, barrier)
4. ✅ Set up trading conditions
5. ✅ Configure stake and martingale
6. ✅ Click "Start Auto Trading"
7. ✅ Monitor trades and adjust as needed

The system will automatically:
- Analyze market data in real-time
- Check if conditions are met
- Execute trades when conditions match
- Apply martingale on losses
- Track results and statistics
- Handle reconnections and errors

Happy trading! 🚀
