# Design Document

## Overview

The Zeus Analysis Tool Enhancement transforms the existing digit tracking component into a comprehensive trading analysis platform. The design builds upon the current WebSocket-based real-time data architecture while adding probability-based predictions, trading integration, performance optimizations, and an intelligent alert system.

The enhancement maintains the existing component structure while introducing new modules for probability calculations, trade signal generation, caching mechanisms, and alert management. The design prioritizes performance, user experience, and seamless integration with the existing Bot Builder system.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Zeus Analysis Tool                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Data Layer │  │ Analysis     │  │  UI Layer    │      │
│  │              │  │ Engine       │  │              │      │
│  │ - WebSocket  │  │ - Probability│  │ - Components │      │
│  │ - Cache      │  │ - Patterns   │  │ - Alerts     │      │
│  │ - History    │  │ - Signals    │  │ - Charts     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  Trade Signal  │                        │
│                    │   Dispatcher   │                        │
│                    └───────┬────────┘                        │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Bot Builder   │
                    │   Integration   │
                    └─────────────────┘
```

### Component Structure

The enhanced Zeus Analysis Tool consists of the following major components:

1. **Data Management Layer**
   - WebSocket connection handler (existing)
   - Tick data cache with TTL
   - Historical data manager

2. **Analysis Engine**
   - Probability calculator
   - Pattern detector
   - Signal generator

3. **UI Components**
   - Probability prediction card
   - Recent ticks list
   - Trade action buttons
   - Alert notification panel
   - Loading skeleton

4. **Integration Layer**
   - Trade signal dispatcher
   - Bot Builder connector
   - Browser notification manager

## Components and Interfaces

### 1. Probability Calculator Module

**Interface:**
```typescript
interface ProbabilityPrediction {
  digit: number;
  probability: number;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
}

interface ProbabilityCalculator {
  calculateProbabilities(ticks: TickData[]): ProbabilityPrediction[];
  getMostLikely(): ProbabilityPrediction;
  getTopN(n: number): ProbabilityPrediction[];
}
```

**Implementation Strategy:**
- Analyze last 20 ticks for frequency patterns
- Calculate deviation from expected 10% distribution
- Apply mean reversion logic for underrepresented digits
- Assign confidence based on pattern strength

### 2. Recent Ticks Component

**Interface:**
```typescript
interface RecentTicksProps {
  ticks: TickData[];
  maxDisplay: number;
}

interface TickDisplayData extends TickData {
  direction: 'up' | 'down' | 'neutral';
  isLatest: boolean;
}
```

**Features:**
- Scrollable container with max-height
- Latest tick highlighted
- Direction indicators (arrows)
- Formatted timestamps

### 3. Trade Signal Generator

**Interface:**
```typescript
interface TradeSignal {
  type: 'DIGITOVER' | 'DIGITUNDER' | 'DIGITMATCH' | 'DIGITDIFF';
  market: string;
  prediction: number;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
  timestamp: number;
}

interface TradeSignalGenerator {
  createSignal(prediction: ProbabilityPrediction, market: string): TradeSignal;
  dispatchSignal(signal: TradeSignal): void;
}
```

### 4. Cache Manager

**Interface:**
```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttl?: number): void;
  clear(key?: string): void;
  isValid(key: string): boolean;
}
```

**Configuration:**
- Default TTL: 5 minutes (300,000ms)
- Cache keys: `ticks_${market}_${count}`
- Automatic cleanup on expiry

### 5. Alert System

**Interface:**
```typescript
interface Alert {
  id: string;
  type: 'high-confidence' | 'pattern-detected' | 'streak-broken';
  message: string;
  timestamp: number;
  digit?: number;
  priority: 'low' | 'medium' | 'high';
}

interface AlertSettings {
  highConfidenceThreshold: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  streakAlerts: boolean;
  patternAlerts: boolean;
}

interface AlertManager {
  checkForAlerts(ticks: TickData[], prediction: ProbabilityPrediction): Alert[];
  addAlert(alert: Alert): void;
  clearAlerts(): void;
  playSound(): void;
  showNotification(alert: Alert): void;
}
```

## Data Models

### Enhanced TickData

The existing `TickData` interface remains unchanged:
```typescript
interface TickData {
  epoch: number;
  quote: number;
  lastDigit: number;
  source: 'historical' | 'live';
  localTime: string;
}
```

### New Data Models

**ProbabilityState:**
```typescript
interface ProbabilityState {
  predictions: ProbabilityPrediction[];
  mostLikely: ProbabilityPrediction;
  lastCalculated: number;
  isStale: boolean;
}
```

**TradeIntegrationState:**
```typescript
interface TradeIntegrationState {
  isTrading: boolean;
  lastSignal: TradeSignal | null;
  signalHistory: TradeSignal[];
}
```

**PerformanceMetrics:**
```typescript
interface PerformanceMetrics {
  renderTime: number;
  calculationTime: number;
  cacheHitRate: number;
  memoryUsage: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Complete probability distribution
*For any* tick dataset with at least 10 ticks, calculating probabilities should return predictions for all 10 digits (0-9)
**Validates: Requirements 1.1**

### Property 2: Last 20 ticks analysis window
*For any* tick dataset, the probability calculator should only consider the last 20 ticks when determining frequency patterns
**Validates: Requirements 1.2**

### Property 3: Prediction display completeness
*For any* probability prediction result, the rendered output should contain both the predicted digit and its probability percentage
**Validates: Requirements 1.3**

### Property 4: Confidence level indication
*For any* probability prediction, the rendered output should include exactly one confidence level (low, medium, or high)
**Validates: Requirements 1.4**

### Property 5: Top predictions ordering
*For any* calculated probability distribution, the top 5 predictions should be sorted in descending order by probability
**Validates: Requirements 1.5**

### Property 6: Recent tick ordering
*For any* new tick added to the system, it should appear at index 0 (top) of the recent ticks list
**Validates: Requirements 2.1**

### Property 7: Tick display completeness
*For any* tick in the recent ticks list, the rendered output should include timestamp, quote price, last digit, and direction indicator
**Validates: Requirements 2.2**

### Property 8: Price increase direction indicator
*For any* two consecutive ticks where the second tick's price is higher, an upward arrow indicator should be displayed
**Validates: Requirements 2.5**

### Property 9: Price decrease direction indicator
*For any* two consecutive ticks where the second tick's price is lower, a downward arrow indicator should be displayed
**Validates: Requirements 2.6**

### Property 10: Trade buttons for top predictions
*For any* set of top 5 probability predictions, exactly 5 "Trade Now" buttons should be rendered
**Validates: Requirements 3.1**

### Property 11: Digit to trade type mapping
*For any* predicted digit, digits 0-4 should map to DIGITUNDER and digits 5-9 should map to DIGITOVER
**Validates: Requirements 3.2**

### Property 12: Trade signal completeness
*For any* created trade signal, it should include market symbol, trade type, prediction value, confidence level, and reasoning
**Validates: Requirements 3.3**

### Property 13: Trade signal event dispatch
*For any* created trade signal, a custom event with name 'zeus.trade.signal' should be dispatched to the window object
**Validates: Requirements 3.4**

### Property 14: Cache TTL enforcement
*For any* cached tick data, subsequent requests within 5 minutes should return the cached data without making new API calls
**Validates: Requirements 4.2**

### Property 15: High confidence alert creation
*For any* prediction with probability exceeding the configured threshold, a high-confidence alert should be created
**Validates: Requirements 5.1**

### Property 16: Pattern detection alert
*For any* sequence of ticks where the last 5 consecutive ticks have the same last digit, a pattern-detected alert should be created
**Validates: Requirements 5.2**

### Property 17: Alert display completeness
*For any* created alert, it should be displayed in the notification panel with both timestamp and message fields
**Validates: Requirements 5.3**

### Property 18: Alert sound playback
*For any* new alert when sound is enabled, an audio notification should be triggered
**Validates: Requirements 5.4**

### Property 19: Browser notification dispatch
*For any* new alert when browser notifications are enabled, the Notification API should be called with the alert message
**Validates: Requirements 5.5**

### Property 20: Alert list size limit
*For any* number of alerts created, the displayed alert list should never exceed 10 items
**Validates: Requirements 5.6**

### Property 21: Bot strategy configuration completeness
*For any* created bot strategy, the configuration should include trade type, market, prediction, stake, and duration parameters
**Validates: Requirements 6.2**

### Property 22: Bot strategy martingale settings
*For any* created bot strategy, the configuration should include martingale, stopLoss, and takeProfit fields
**Validates: Requirements 6.3**

### Property 23: Bot strategy event dispatch
*For any* created bot strategy, a custom event with name 'create.bot.strategy' should be dispatched with the strategy configuration
**Validates: Requirements 6.4**

### Property 24: API error handling
*For any* API call that throws an error, the component should render an error message without throwing an unhandled exception
**Validates: Requirements 7.1**

### Property 25: Trade signal error notification
*For any* trade signal creation that fails, an error notification should be displayed
**Validates: Requirements 7.3**

### Property 26: Notification permission graceful degradation
*For any* scenario where browser notification permission is denied, the system should continue creating in-app alerts without errors
**Validates: Requirements 7.4**

### Property 27: Cache corruption recovery
*For any* cached data that fails validation, the cache should be cleared and a fresh data fetch should be initiated
**Validates: Requirements 7.5**

### Property 28: Confidence level color coding
*For any* displayed confidence level, high should use green styling, medium should use yellow, and low should use red
**Validates: Requirements 8.2**

### Property 29: Alternating row styling
*For any* list of recent ticks, odd and even rows should have different CSS classes for alternating styling
**Validates: Requirements 8.4**

## Error Handling

### Error Categories

1. **Network Errors**
   - WebSocket connection failures
   - API timeout errors
   - Data fetch failures

2. **Data Validation Errors**
   - Insufficient tick data
   - Corrupted cache data
   - Invalid tick format

3. **Integration Errors**
   - Trade signal dispatch failures
   - Bot Builder connection errors
   - Browser notification permission denied

4. **Performance Errors**
   - Calculation timeout
   - Memory limit exceeded
   - Render performance degradation

### Error Handling Strategy

**Network Errors:**
```typescript
try {
  await fetchTickData(market, count);
} catch (error) {
  setError({
    type: 'network',
    message: 'Failed to fetch tick data. Please check your connection.',
    action: 'retry'
  });
  // Attempt to use cached data if available
  const cached = getCachedData(market);
  if (cached) {
    setTicks(cached);
    showNotification('Using cached data', 'warning');
  }
}
```

**Data Validation:**
```typescript
const validateTickData = (ticks: TickData[]): boolean => {
  if (!Array.isArray(ticks)) return false;
  if (ticks.length < 10) {
    showNotification('Insufficient data. Need at least 10 ticks.', 'info');
    return false;
  }
  return ticks.every(tick => 
    typeof tick.epoch === 'number' &&
    typeof tick.quote === 'number' &&
    typeof tick.lastDigit === 'number'
  );
};
```

**Integration Errors:**
```typescript
const dispatchTradeSignal = (signal: TradeSignal): void => {
  try {
    const event = new CustomEvent('zeus.trade.signal', { detail: signal });
    window.dispatchEvent(event);
    showNotification('Trade signal sent successfully', 'success');
  } catch (error) {
    console.error('Failed to dispatch trade signal:', error);
    showNotification('Failed to send trade signal. Please try again.', 'error');
    // Log error for debugging
    logError('trade_signal_dispatch', error);
  }
};
```

**Cache Corruption:**
```typescript
const getCachedData = (key: string): TickData[] | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    if (!validateTickData(parsed.data)) {
      throw new Error('Invalid cached data');
    }
    
    return parsed.data;
  } catch (error) {
    console.warn('Cache corrupted, clearing:', error);
    localStorage.removeItem(key);
    return null;
  }
};
```

## Testing Strategy

### Unit Testing

**Test Framework:** Jest with React Testing Library

**Unit Test Coverage:**

1. **Probability Calculator Tests**
   - Test probability calculation with various tick datasets
   - Test confidence level assignment logic
   - Test edge cases (empty data, single digit dominance)

2. **Trade Signal Generator Tests**
   - Test digit to trade type mapping
   - Test signal object structure
   - Test event dispatching

3. **Cache Manager Tests**
   - Test cache set/get operations
   - Test TTL expiration
   - Test cache invalidation

4. **Alert Manager Tests**
   - Test alert creation conditions
   - Test alert list size limiting
   - Test notification dispatching

5. **Component Rendering Tests**
   - Test loading skeleton display
   - Test error message rendering
   - Test conditional UI elements

**Example Unit Test:**
```typescript
describe('ProbabilityCalculator', () => {
  it('should return predictions for all 10 digits', () => {
    const ticks = generateRandomTicks(20);
    const predictions = calculateProbabilities(ticks);
    
    expect(predictions).toHaveLength(10);
    expect(predictions.map(p => p.digit)).toEqual([0,1,2,3,4,5,6,7,8,9]);
  });
  
  it('should sort predictions by probability descending', () => {
    const ticks = generateRandomTicks(20);
    const topPredictions = getTopN(5);
    
    for (let i = 0; i < topPredictions.length - 1; i++) {
      expect(topPredictions[i].probability).toBeGreaterThanOrEqual(
        topPredictions[i + 1].probability
      );
    }
  });
});
```

### Property-Based Testing

**Test Framework:** fast-check (JavaScript property-based testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Custom generators for tick data, predictions, and signals
- Shrinking enabled for minimal failing examples

**Property Test Implementation:**

Each property-based test will be tagged with a comment referencing the design document property:

```typescript
/**
 * Feature: zeus-analysis-enhancement, Property 1: Complete probability distribution
 * Validates: Requirements 1.1
 */
test('probability calculation returns all 10 digits', () => {
  fc.assert(
    fc.property(
      fc.array(tickDataGenerator(), { minLength: 10, maxLength: 100 }),
      (ticks) => {
        const predictions = calculateProbabilities(ticks);
        const digits = predictions.map(p => p.digit).sort();
        return JSON.stringify(digits) === JSON.stringify([0,1,2,3,4,5,6,7,8,9]);
      }
    ),
    { numRuns: 100 }
  );
});

/**
 * Feature: zeus-analysis-enhancement, Property 11: Digit to trade type mapping
 * Validates: Requirements 3.2
 */
test('digits 0-4 map to DIGITUNDER, 5-9 map to DIGITOVER', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 9 }),
      (digit) => {
        const tradeType = getTradeType(digit);
        if (digit <= 4) {
          return tradeType === 'DIGITUNDER';
        } else {
          return tradeType === 'DIGITOVER';
        }
      }
    ),
    { numRuns: 100 }
  );
});

/**
 * Feature: zeus-analysis-enhancement, Property 16: Pattern detection alert
 * Validates: Requirements 5.2
 */
test('5 consecutive same digits trigger pattern alert', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 9 }),
      fc.array(tickDataGenerator(), { minLength: 10, maxLength: 50 }),
      (digit, baseTicks) => {
        // Create 5 consecutive ticks with same last digit
        const patternTicks = Array(5).fill(null).map((_, i) => ({
          epoch: Date.now() + i,
          quote: digit + (i * 10),
          lastDigit: digit,
          source: 'live' as const,
          localTime: new Date().toISOString()
        }));
        
        const allTicks = [...baseTicks, ...patternTicks];
        const alerts = checkForAlerts(allTicks);
        
        return alerts.some(alert => alert.type === 'pattern-detected');
      }
    ),
    { numRuns: 100 }
  );
});
```

**Custom Generators:**

```typescript
// Tick data generator
const tickDataGenerator = (): fc.Arbitrary<TickData> => {
  return fc.record({
    epoch: fc.integer({ min: 1600000000, max: 1700000000 }),
    quote: fc.double({ min: 100, max: 1000, noNaN: true }),
    lastDigit: fc.integer({ min: 0, max: 9 }),
    source: fc.constantFrom('historical' as const, 'live' as const),
    localTime: fc.date().map(d => d.toISOString())
  });
};

// Probability prediction generator
const predictionGenerator = (): fc.Arbitrary<ProbabilityPrediction> => {
  return fc.record({
    digit: fc.integer({ min: 0, max: 9 }),
    probability: fc.double({ min: 0.05, max: 0.25 }),
    confidence: fc.constantFrom('low' as const, 'medium' as const, 'high' as const),
    reasoning: fc.string()
  });
};
```

### Integration Testing

**Integration Test Scenarios:**

1. **End-to-End Probability Flow**
   - Fetch tick data → Calculate probabilities → Display predictions → Create trade signal

2. **Alert System Integration**
   - Detect pattern → Create alert → Display notification → Play sound

3. **Cache Integration**
   - Fetch data → Cache → Retrieve from cache → Validate TTL

4. **Bot Builder Integration**
   - Create prediction → Generate strategy → Dispatch event → Verify Bot Builder receives signal

### Performance Testing

**Performance Benchmarks:**

1. **Probability Calculation:** < 100ms for 1000 ticks
2. **Component Render:** < 50ms initial render
3. **Cache Operations:** < 10ms for get/set
4. **Memory Usage:** < 50MB total component memory

**Performance Test Implementation:**
```typescript
describe('Performance', () => {
  it('should calculate probabilities in under 100ms', () => {
    const ticks = generateRandomTicks(1000);
    const start = performance.now();
    calculateProbabilities(ticks);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
});
```

## Implementation Notes

### React.memo Optimization

Wrap expensive components with React.memo to prevent unnecessary re-renders:

```typescript
const DigitCircle = React.memo(({ digit, count, percentage }: DigitCircleProps) => {
  return (
    <div className="digit-circle">
      <div className="digit-number">{digit}</div>
      <div className="digit-count">{count}</div>
      <div className="digit-percentage">{percentage}%</div>
    </div>
  );
});

const ProbabilityCard = React.memo(({ prediction }: ProbabilityCardProps) => {
  return (
    <div className="probability-card">
      {/* Card content */}
    </div>
  );
});
```

### Loading Skeleton

Display skeleton while data loads:

```typescript
if (isLoading || ticks.length === 0) {
  return <LoadingSkeleton />;
}
```

### Browser Notification Permission

Request permission on first alert:

```typescript
const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};
```

### Event-Driven Architecture

Use custom events for loose coupling:

```typescript
// Dispatch trade signal
window.dispatchEvent(new CustomEvent('zeus.trade.signal', {
  detail: tradeSignal
}));

// Listen in Bot Builder
window.addEventListener('zeus.trade.signal', (event) => {
  const signal = event.detail;
  populateBotConfig(signal);
});
```

## Dependencies

### New Dependencies Required

```json
{
  "fast-check": "^3.15.0",
  "react-window": "^1.8.10",
  "lodash.debounce": "^4.0.8"
}
```

### Existing Dependencies Used

- React 18+
- TypeScript 5+
- SCSS for styling
- Jest for unit testing
- React Testing Library

## Migration Strategy

### Phase 1: Core Probability Engine (Week 1)
- Implement probability calculator
- Add prediction UI components
- Implement basic caching

### Phase 2: Enhanced UX (Week 2)
- Add recent ticks scrollable list
- Implement loading skeleton
- Add React.memo optimizations

### Phase 3: Trading Integration (Week 3)
- Add Trade Now buttons
- Implement trade signal generator
- Connect to Bot Builder

### Phase 4: Alert System (Week 4)
- Implement alert detection logic
- Add notification panel UI
- Implement sound and browser notifications

### Phase 5: Testing & Polish (Week 5)
- Write property-based tests
- Performance optimization
- Bug fixes and refinements

## Security Considerations

1. **Input Validation:** Validate all tick data before processing
2. **Cache Security:** Use sessionStorage instead of localStorage for sensitive data
3. **Event Sanitization:** Sanitize all data in custom events
4. **XSS Prevention:** Escape all user-generated content in notifications
5. **Rate Limiting:** Limit trade signal generation to prevent spam

## Accessibility

1. **Keyboard Navigation:** All interactive elements accessible via keyboard
2. **Screen Reader Support:** ARIA labels for all dynamic content
3. **Color Contrast:** Ensure WCAG AA compliance for all text
4. **Focus Management:** Proper focus indicators and management
5. **Reduced Motion:** Respect prefers-reduced-motion media query
