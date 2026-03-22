# Deriv Trading Interface - Safe Execution

A React + SCSS web application for Deriv third-party trading with **STRICT execution safety** and analysis-first design.

## 🔒 CORE SAFETY PRINCIPLE

**Cursor movement NEVER directly triggers trade execution.** All trade execution is debounced, gated, locked, and test-proven.

## 🛡️ Safety Mechanisms

### 1. Debounce Enforcement
- **Configurable debounce (300-600ms)** prevents rapid cursor movements from triggering actions
- Trade intent stabilizes ONLY after cursor movement stops
- No trade logic runs while cursor is moving
- Only the last stable cursor state is valid

### 2. Trade Intent Layer
- **Pending Intent**: Created by cursor movement (UI only)
- **Confirmed Intent**: Requires manual confirmation
- **Executed Intent**: Tracked by UUID to prevent duplicates
- Each intent has a unique `intentId` that prevents duplicate execution

### 3. Execution Gating
Trades execute ONLY when:
- ✅ `confirmedIntent` exists
- ✅ `tradeLock` is false
- ✅ Intent hasn't been executed before
- ❌ No execution from raw UI or tick events

### 4. Trade Lock Protection
- **Zeus Trading Hub trade lock** prevents double execution
- Lock immediately when execution starts
- Unlock only after WebSocket response OR safety timeout (≥1000ms)
- All execution attempts while locked are rejected

### 5. Simulation Mode
- **Default to SIMULATION MODE** with clear UI warning
- Real execution must be explicitly enabled
- Educational/testing environment by default

## 🏗️ Architecture

### Core Hooks

#### `useDebounce<T>(value: T, delay: number)`
- Generic debounce hook that delays value updates
- Returns `[debouncedValue, isDebouncing]`
- Prevents rapid cursor movements from triggering actions

#### `useTradeLock(safetyTimeoutMs: number)`
- Trade lock management with automatic safety timeout
- Returns `{ lock, unlock, isLocked, lockState }`
- Prevents double execution and ensures only one trade at a time

#### `useTradeIntent()`
- Manages trade intent flow: pending → confirmed → executed
- Tracks executed intents by UUID to prevent duplicates
- Returns intent controls and state

#### `useWebSocket(appId: string)`
- WebSocket connection for Deriv API (read-only by default)
- Provides live tick data for analysis
- Isolated from execution logic

### Components

- **TradingInterface**: Main container with safety orchestration
- **DigitSelector**: Digit selection (cursor movement → pending intent only)
- **StakeInput**: Stake amount with validation and quick buttons
- **ExecutionPanel**: Manual confirmation and execution controls
- **StatusIndicators**: Real-time safety status display
- **AnalysisPanel**: Market analysis and trading mode selection

## 🧪 Testing

Comprehensive unit tests prove safety mechanisms:

```bash
npm test
```

### Test Coverage
- ✅ Cursor movement cannot trigger execution
- ✅ Debounce prevents multiple intent confirmations
- ✅ Trade lock prevents double execution
- ✅ Same intentId cannot execute twice
- ✅ Rapid cursor movement simulation
- ✅ Integration tests for complete safety flow

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## 🎯 Trading Modes

### Manual Intent Mode
- User controls digit selection and stake via cursor
- Manual confirmation required for execution
- Full control over trade timing

### Tick-Based Auto-Analysis Mode
- System analyzes tick patterns automatically
- Generates analysis signals (Matches/Differs probabilities)
- **Signals do NOT auto-execute** - manual confirmation still required
- Analysis-first approach for educational purposes

## ⚙️ Configuration

```typescript
interface TradingConfig {
  debounceMs: number;           // 300-600ms recommended
  safetyTimeoutMs: number;      // ≥1000ms for trade lock
  maxTradesPerIntent: number;   // Default: 1
  delayBetweenTradesMs: number; // For multi-trade (if enabled)
  simulationMode: boolean;      // Default: true
}
```

## 🔍 Safety Status Indicators

The interface provides real-time visibility into safety mechanisms:

- **🟡 Debouncing**: Input is stabilizing, execution blocked
- **🟢 Stable**: Input stable, execution available
- **🔒 Locked**: Trade execution in progress
- **🔓 Unlocked**: Ready for new trade
- **🟢 Connected**: WebSocket active for live data
- **🔴 Disconnected**: WebSocket connection issues

## 🚨 Safety Guarantees

1. **No Accidental Execution**: Cursor movement alone cannot place trades
2. **Debounce Protection**: Rapid movements are filtered out
3. **Single Execution**: Each intent can only execute once
4. **Lock Protection**: No double execution during processing
5. **Simulation First**: Safe testing environment by default
6. **Manual Confirmation**: All trades require explicit user confirmation

## 📝 License

This project is built for educational and demonstration purposes, showcasing safe trading interface design patterns.

---

**⚠️ IMPORTANT**: This is a demonstration of safe trading interface patterns. Always test thoroughly and follow proper risk management when dealing with real trading systems.