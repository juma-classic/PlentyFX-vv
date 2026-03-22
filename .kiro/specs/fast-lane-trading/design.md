# Fast Lane Trading System - Design Document

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Fast Lane Page                          │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ TokenAuth     │  │ TradingConfig│  │ TradingEngine   │  │
│  │ Component     │  │ Component    │  │ Component       │  │
│  └───────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│          │                 │                    │           │
│          └─────────────────┼────────────────────┘           │
│                            │                                │
│  ┌─────────────────────────┼────────────────────────────┐  │
│  │         State Management (React Hooks)                │  │
│  └─────────────────────────┼────────────────────────────┘  │
│                            │                                │
├────────────────────────────┼────────────────────────────────┤
│                     Utility Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ FastLaneAPI  │  │ RateLimiter  │  │ RiskManager     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│         │                 │                    │           │
│         └─────────────────┼────────────────────┘           │
│                           │                                │
├───────────────────────────┼────────────────────────────────┤
│                    External Services                        │
│  ┌────────────────────────┼────────────────────────────┐  │
│  │         Deriv WebSocket API (wss://ws.derivws.com)  │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Fast Lane Page Component

**File:** `src/pages/fast-lane/fast-lane.tsx`

**Responsibilities:**

-   Main container for Fast Lane feature
-   Manage authentication state
-   Coordinate child components
-   Handle page-level state

**State:**

```typescript
interface FastLaneState {
    isAuthenticated: boolean;
    accountBalance: number;
    settings: TradingSettings;
    transactions: Transaction[];
    isTrading: boolean;
}
```

**Props:** None (root component)

**Children:**

-   TokenAuth
-   TradingConfig
-   TradingEngine
-   TransactionHistory
-   PerformanceMonitor

---

### 2. TokenAuth Component

**File:** `src/components/fast-lane/TokenAuth.tsx`

**Responsibilities:**

-   Collect API token from user
-   Validate token format
-   Test connection
-   Store token securely

**Props:**

```typescript
interface TokenAuthProps {
    onSuccess: () => void;
    onError?: (error: string) => void;
}
```

**State:**

```typescript
interface TokenAuthState {
    token: string;
    appId: string;
    loading: boolean;
    error: string;
}
```

**UI Elements:**

-   Token input field (required)
-   App ID input field (optional)
-   Test connection button
-   Submit button
-   Error message display
-   Help text with link to get token

---

### 3. TradingConfig Component

**File:** `src/components/fast-lane/TradingConfig.tsx`

**Responsibilities:**

-   Collect trading configuration
-   Validate inputs
-   Display current settings
-   Save/load presets

**Props:**

```typescript
interface TradingConfigProps {
    settings: TradingSettings;
    onSettingsChange: (settings: TradingSettings) => void;
    accountBalance: number;
}
```

**State:**

```typescript
interface TradingSettings {
    market: string;
    tradeType: TradeType;
    stake: number;
    duration: number;
    durationType: 't' | 's';
    barrier?: string;
    prediction?: number;
    stopLoss: number;
    takeProfit: number;
    maxConsecutiveLosses: number;
    dailyLossLimit: number;
    targetTrades: number;
    delayBetweenTrades: number;
    strategy: 'momentum' | 'mean-reversion' | 'pattern' | 'random';
}
```

**UI Sections:**

1. Market Selection
2. Trade Type & Parameters
3. Risk Management
4. Auto-Trading Settings
5. Strategy Selection

---

### 4. TradingEngine Component

**File:** `src/components/fast-lane/TradingEngine.tsx`

**Responsibilities:**

-   Display current tick
-   Execute manual trades
-   Run auto-trading
-   Show real-time statistics
-   Handle trade results

**Props:**

```typescript
interface TradingEngineProps {
    settings: TradingSettings;
    onTradeExecuted: (result: TradeResult) => void;
    onBalanceUpdate: (balance: number) => void;
}
```

**State:**

```typescript
interface TradingEngineState {
    currentTick: number;
    lastDigit: number;
    isAutoTrading: boolean;
    stats: TradingStats;
    lastTradeResult?: TradeResult;
}

interface TradingStats {
    totalTrades: number;
    wins: number;
    losses: number;
    totalProfit: number;
    winRate: number;
    currentStreak: number;
    consecutiveLosses: number;
}
```

**UI Elements:**

-   Large tick display
-   Last digit indicator
-   Trade Now button
-   Start/Stop Auto button
-   Emergency Stop button
-   Statistics panel
-   Trade execution feedback

---

### 5. TransactionHistory Component

**File:** `src/components/fast-lane/TransactionHistory.tsx`

**Responsibilities:**

-   Display trade history
-   Filter transactions
-   Export to CSV
-   Show summary statistics

**Props:**

```typescript
interface TransactionHistoryProps {
    transactions: Transaction[];
    onExport?: () => void;
}
```

**State:**

```typescript
interface Transaction {
    id: string;
    contractId: string;
    type: string;
    market: string;
    entryTick: number;
    exitTick: number;
    stake: number;
    profit: number;
    outcome: 'win' | 'loss';
    timestamp: number;
}
```

**UI Elements:**

-   Transaction list (scrollable)
-   Filter dropdown (all/wins/losses)
-   Export CSV button
-   Summary statistics card
-   Empty state

---

### 6. PerformanceMonitor Component

**File:** `src/components/fast-lane/PerformanceMonitor.tsx`

**Responsibilities:**

-   Display API metrics
-   Show rate limiter status
-   Monitor connection health
-   Display warnings

**Props:**

```typescript
interface PerformanceMonitorProps {
    collapsed?: boolean;
}
```

**State:**

```typescript
interface PerformanceMetrics {
    requestRate: number;
    queueLength: number;
    latency: number;
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    rateLimiterUtilization: number;
}
```

**UI Elements:**

-   Collapsible panel
-   Request rate gauge
-   Queue length indicator
-   Latency display
-   Connection status badge
-   Warning indicators

---

## Utility Design

### 1. FastLaneAPI Class

**File:** `src/utils/fast-lane-api.ts`

**Responsibilities:**

-   WebSocket connection management
-   API request/response handling
-   Auto-reconnection
-   Event emission

**Public Methods:**

```typescript
class FastLaneAPI {
    // Connection
    connect(): Promise<void>;
    disconnect(): void;
    isConnected(): boolean;

    // Authentication
    setAuthToken(token: string, appId?: string): void;
    authorize(): Promise<AuthResponse>;

    // Trading
    subscribeTicks(symbol: string, callback: (tick: TickData) => void): Promise<string>;
    unsubscribeTicks(subscriptionId: string): Promise<void>;
    buyContract(params: TradeParams): Promise<BuyResponse>;

    // Account
    getBalance(): Promise<number>;

    // Events
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
}
```

**Events:**

-   `connected` - WebSocket connected
-   `disconnected` - WebSocket disconnected
-   `reconnecting` - Attempting reconnection
-   `error` - Error occurred
-   `tick` - New tick received
-   `balance_update` - Balance changed

**Internal State:**

```typescript
interface APIState {
    ws: WebSocket | null;
    authToken: string;
    appId: string;
    requestId: number;
    callbacks: Map<number, Function>;
    subscriptions: Map<string, Function>;
    reconnectAttempts: number;
    isReconnecting: boolean;
}
```

---

### 2. RateLimiter Class

**File:** `src/utils/fast-lane-rate-limiter.ts`

**Responsibilities:**

-   Throttle API requests
-   Queue requests
-   Prevent rate limit violations

**Algorithm:** Token Bucket

**Configuration:**

```typescript
interface RateLimiterConfig {
    maxTokens: number; // 5 (burst capacity)
    refillRate: number; // 1 token/second
    maxQueueSize: number; // 100 requests
}
```

**Public Methods:**

```typescript
class RateLimiter {
    execute<T>(fn: () => Promise<T>): Promise<T>;
    getStatus(): RateLimiterStatus;
    reset(): void;
}

interface RateLimiterStatus {
    availableTokens: number;
    queueLength: number;
    utilizationPercent: number;
}
```

**Token Bucket Logic:**

1. Start with full bucket (5 tokens)
2. Each request consumes 1 token
3. Tokens refill at 1/second
4. If no tokens: queue request
5. Process queue as tokens become available

---

### 3. RiskManager Class

**File:** `src/utils/risk-manager.ts`

**Responsibilities:**

-   Enforce risk limits
-   Calculate position sizing
-   Track drawdown
-   Circuit breaker logic

**Public Methods:**

```typescript
class RiskManager {
    // Validation
    canTrade(stake: number, balance: number): boolean;
    checkStopLoss(currentLoss: number): boolean;
    checkTakeProfit(currentProfit: number): boolean;
    checkConsecutiveLosses(losses: number): boolean;
    checkDailyLimit(dailyLoss: number): boolean;

    // Calculation
    calculatePositionSize(balance: number, riskPercent: number): number;
    calculateMaxDrawdown(trades: Transaction[]): number;

    // State
    reset(): void;
    getMetrics(): RiskMetrics;
}

interface RiskMetrics {
    currentDrawdown: number;
    maxDrawdown: number;
    dailyLoss: number;
    consecutiveLosses: number;
    riskLevel: 'low' | 'medium' | 'high';
}
```

---

### 4. StrategyManager Class

**File:** `src/utils/strategy-manager.ts`

**Responsibilities:**

-   Execute trading strategies
-   Backtest strategies
-   Track performance

**Strategies:**

**Momentum Strategy:**

```typescript
// Follow the trend of last N digits
// If last 3 digits are even: bet even
// If last 3 digits are odd: bet odd
```

**Mean Reversion Strategy:**

```typescript
// Bet against streaks
// If last 5 digits are even: bet odd
// If last 5 digits are odd: bet even
```

**Pattern Recognition Strategy:**

```typescript
// Detect repeating patterns
// If pattern detected: bet on continuation
// If no pattern: bet on reversal
```

**Random Strategy:**

```typescript
// Random selection (for testing)
// 50/50 chance of even/odd
```

**Public Methods:**

```typescript
class StrategyManager {
    executeStrategy(strategy: Strategy, tickHistory: number[], settings: TradingSettings): TradeDecision;

    backtest(strategy: Strategy, historicalData: TickData[], settings: TradingSettings): BacktestResult;
}

interface TradeDecision {
    shouldTrade: boolean;
    tradeType: string;
    confidence: number;
    reason: string;
}
```

---

## Data Flow

### Manual Trade Flow

```
User clicks "Trade Now"
    ↓
TradingEngine validates settings
    ↓
TradingEngine calls FastLaneAPI.buyContract()
    ↓
FastLaneAPI passes through RateLimiter
    ↓
RateLimiter checks tokens
    ↓
If available: Execute immediately
If not: Queue request
    ↓
WebSocket sends buy request
    ↓
Deriv API processes trade
    ↓
WebSocket receives response
    ↓
FastLaneAPI emits 'trade_result' event
    ↓
TradingEngine updates state
    ↓
TransactionHistory adds new transaction
    ↓
User sees result notification
```

### Auto-Trading Flow

```
User clicks "Start Auto"
    ↓
TradingEngine starts tick subscription
    ↓
For each tick:
    ↓
    StrategyManager.executeStrategy()
        ↓
        Returns TradeDecision
        ↓
    RiskManager.canTrade()
        ↓
        Checks all risk limits
        ↓
    If approved:
        ↓
        Execute trade (same as manual flow)
        ↓
        Wait for configured delay
        ↓
    Update statistics
    ↓
Continue until stop condition
```

### Reconnection Flow

```
WebSocket connection lost
    ↓
FastLaneAPI detects disconnect
    ↓
Emit 'disconnected' event
    ↓
TradingEngine pauses auto-trading
    ↓
FastLaneAPI starts reconnection
    ↓
Attempt 1: Wait 1s
Attempt 2: Wait 2s
Attempt 3: Wait 4s
Attempt 4: Wait 8s
Attempt 5: Wait 16s
Max wait: 30s
    ↓
If successful:
    ↓
    Emit 'connected' event
    ↓
    TradingEngine resumes auto-trading
    ↓
If failed after 5 attempts:
    ↓
    Emit 'error' event
    ↓
    Show error to user
    ↓
    Require manual reconnection
```

---

## State Management

### Page-Level State (React useState)

```typescript
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [accountBalance, setAccountBalance] = useState(0);
const [settings, setSettings] = useState<TradingSettings>(defaultSettings);
const [transactions, setTransactions] = useState<Transaction[]>([]);
const [isTrading, setIsTrading] = useState(false);
```

### Component-Level State

Each component manages its own UI state (loading, errors, etc.)

### Persistent State (localStorage)

```typescript
// Stored in localStorage
{
    "fast_lane_token": "encrypted_token",
    "fast_lane_app_id": "1089",
    "fast_lane_settings": { /* TradingSettings */ },
    "fast_lane_transactions": [ /* Transaction[] */ ]
}
```

---

## Styling Design

### Theme Variables (Deriv Bot Builder)

```scss
// Colors
$primary-bg: #0e0e0e;
$secondary-bg: #1a1a1a;
$card-bg: #1a1a1a;
$border-color: #2a2a2a;
$accent-red: #ff444f;
$accent-gold: #ffd700;
$success-green: #4bb543;
$warning-orange: #ffa500;

// Typography
$font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
$font-size-base: 14px;
$font-size-large: 18px;
$font-size-xlarge: 24px;

// Spacing
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;

// Border Radius
$radius-sm: 4px;
$radius-md: 8px;
$radius-lg: 12px;

// Shadows
$shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
$shadow-md: 0 4px 8px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.2);
```

### Layout Structure

```scss
.fast-lane-page {
    display: grid;
    grid-template-columns: 350px 1fr 350px;
    gap: $spacing-md;
    padding: $spacing-lg;

    @media (max-width: 1200px) {
        grid-template-columns: 1fr 1fr;
    }

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
}
```

### Component Styling Pattern

```scss
.component-name {
    background: $card-bg;
    border-radius: $radius-md;
    padding: $spacing-lg;
    box-shadow: $shadow-md;

    &__header {
        margin-bottom: $spacing-md;
    }

    &__content {
        // Content styles
    }

    &--variant {
        // Variant styles
    }
}
```

---

## API Integration

### WebSocket Connection

```typescript
const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${appId}`;
const ws = new WebSocket(wsUrl);
```

### Authorization Request

```json
{
    "authorize": "YOUR_API_TOKEN",
    "req_id": 1
}
```

### Tick Subscription Request

```json
{
    "ticks": "R_50",
    "subscribe": 1,
    "req_id": 2
}
```

### Buy Contract Request

```json
{
    "buy": 1,
    "price": 1.0,
    "parameters": {
        "contract_type": "DIGITEVEN",
        "symbol": "R_50",
        "duration": 1,
        "duration_unit": "t",
        "basis": "stake",
        "amount": 1.0
    },
    "req_id": 3
}
```

### Response Handling

```typescript
ws.onmessage = event => {
    const data = JSON.parse(event.data);

    if (data.error) {
        handleError(data.error);
    } else if (data.tick) {
        handleTick(data.tick);
    } else if (data.buy) {
        handleBuyResponse(data.buy);
    }
};
```

---

## Error Handling

### Error Types

1. **Connection Errors** - WebSocket connection failed
2. **Authentication Errors** - Invalid token
3. **Validation Errors** - Invalid trade parameters
4. **API Errors** - Deriv API returned error
5. **Rate Limit Errors** - Too many requests
6. **Network Errors** - Network unavailable

### Error Handling Strategy

```typescript
try {
    await fastLaneAPI.buyContract(params);
} catch (error) {
    if (error.code === 'RateLimitExceeded') {
        // Queue request
        rateLimiter.execute(() => fastLaneAPI.buyContract(params));
    } else if (error.code === 'InsufficientBalance') {
        // Show balance error
        showError('Insufficient balance');
    } else if (error.code === 'ConnectionLost') {
        // Trigger reconnection
        fastLaneAPI.connect();
    } else {
        // Generic error
        showError(error.message);
    }
}
```

---

## Testing Strategy

### Unit Tests

-   RateLimiter: Token bucket logic
-   RiskManager: Risk calculations
-   StrategyManager: Strategy logic
-   FastLaneAPI: Request/response handling

### Component Tests

-   TokenAuth: Form validation, submission
-   TradingConfig: Input validation, state updates
-   TradingEngine: Trade execution, statistics
-   TransactionHistory: Filtering, export

### Integration Tests

-   Complete trading flow (auth → config → trade → result)
-   Auto-trading with multiple trades
-   Rate limiting under load
-   Reconnection after disconnect

### E2E Tests

-   User journey: First trade
-   User journey: Auto-trading session
-   User journey: Risk limit triggered
-   User journey: Network interruption

---

## Performance Optimization

### Code Splitting

```typescript
const FastLane = lazy(() => import('../fast-lane'));
```

### Memoization

```typescript
const memoizedStats = useMemo(() => calculateStats(transactions), [transactions]);
```

### Debouncing

```typescript
const debouncedUpdate = useMemo(() => debounce(updateSettings, 500), []);
```

### Virtual Scrolling

```typescript
// For transaction history with 1000+ items
<VirtualList
    items={transactions}
    itemHeight={60}
    renderItem={(transaction) => <TransactionRow {...transaction} />}
/>
```

---

## Security Considerations

### Token Storage

```typescript
// Encrypt token before storing
const encryptedToken = encrypt(token, userKey);
localStorage.setItem('fast_lane_token', encryptedToken);
```

### Input Sanitization

```typescript
const sanitizeInput = (input: string): string => {
    return input.replace(/[<>]/g, '');
};
```

### HTTPS Only

```typescript
if (window.location.protocol !== 'https:') {
    window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
}
```

### Rate Limiting

-   Prevents abuse
-   Protects API from overload
-   Ensures fair usage

---

## Deployment Checklist

-   [ ] All tests passing
-   [ ] No console errors
-   [ ] Rate limiter configured
-   [ ] Error logging enabled
-   [ ] Performance monitoring active
-   [ ] Documentation complete
-   [ ] Security audit passed
-   [ ] Browser compatibility verified
-   [ ] Mobile responsiveness tested
-   [ ] Accessibility compliance verified
