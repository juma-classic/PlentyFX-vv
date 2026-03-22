# Martingale Recovery Enhancement - Technical Design

## Architecture Overview

The martingale recovery enhancement will modify the existing adaptive recovery strategy to implement more aggressive recovery logic for OVER/UNDER signals while maintaining backward compatibility for other signal types.

## Component Design

### 1. Adaptive Recovery Strategy Service (`adaptive-recovery-strategy.service.ts`)

**Current Implementation:**
```typescript
// Current logic (backward/safer recovery)
OVER3 loss → OVER2 recovery
UNDER5 loss → UNDER8 recovery
```

**New Implementation:**
```typescript
// New logic (forward/more aggressive recovery)
OVER3 loss → OVER4 recovery  
UNDER5 loss → UNDER6 recovery
```

**Method Modifications:**

#### `calculateRecoveryStrategy(signal, lossCount)`
- **Input**: Signal object with type (OVER1-5, UNDER1-5, EVEN, ODD, RISE, FALL)
- **Output**: Recovery strategy object with new signal type and parameters
- **Logic**: 
  - If signal type starts with "OVER" → return OVER4 recovery
  - If signal type starts with "UNDER" → return UNDER6 recovery
  - Otherwise → maintain existing recovery logic

#### `getRecoverySignalType(originalSignalType)`
- **Purpose**: Determine the appropriate recovery signal type
- **Implementation**:
  ```typescript
  if (originalSignalType.startsWith('OVER')) {
    return 'OVER4';
  }
  if (originalSignalType.startsWith('UNDER')) {
    return 'UNDER6';
  }
  // Maintain existing logic for other types
  return getExistingRecoveryLogic(originalSignalType);
  ```

### 2. Signal Bot Loader Service (`signal-bot-loader.service.ts`)

**Integration Points:**
- Ensure proper integration with updated adaptive recovery strategy
- Update any hardcoded recovery logic references
- Maintain compatibility with existing bot loading mechanisms

**Method Updates:**
- `loadRecoveryBot()` - Use new recovery strategy service
- `executeRecoveryTrade()` - Apply new OVER4/UNDER6 logic
- `handleRecoveryResult()` - Log new recovery strategy results

### 3. SignalsCenter Component (`SignalsCenter.tsx`)

**Integration Requirements:**
- Verify component uses updated recovery strategy service
- Ensure proper error handling for new recovery logic
- Update logging to reflect new recovery strategies

**UI Considerations:**
- Display recovery strategy information to user
- Show OVER4/UNDER6 recovery signals clearly
- Maintain existing martingale UI functionality

## Data Flow

```
1. Signal Loss Detected
   ↓
2. Adaptive Recovery Strategy Service
   ├── Check signal type
   ├── If OVER* → Return OVER4 recovery
   ├── If UNDER* → Return UNDER6 recovery
   └── Else → Use existing logic
   ↓
3. Signal Bot Loader Service
   ├── Load appropriate recovery bot
   ├── Execute recovery trade
   └── Monitor results
   ↓
4. SignalsCenter Component
   ├── Display recovery status
   ├── Update UI with recovery signal
   └── Log recovery results
```

## Implementation Strategy

### Phase 1: Service Layer Updates
1. Update `adaptive-recovery-strategy.service.ts`
   - Modify `calculateRecoveryStrategy` method
   - Add new recovery logic for OVER/UNDER signals
   - Maintain backward compatibility

2. Update `signal-bot-loader.service.ts`
   - Integrate with updated recovery strategy
   - Update recovery bot loading logic
   - Add proper error handling

### Phase 2: Component Integration
1. Verify `SignalsCenter.tsx` integration
   - Ensure component uses updated services
   - Update logging and error handling
   - Test UI functionality

### Phase 3: Testing and Validation
1. Create test file (`test-recovery-logic.js`)
   - Test OVER signal recovery (should use OVER4)
   - Test UNDER signal recovery (should use UNDER6)
   - Test other signal types (should use existing logic)
   - Validate no compilation errors

## Risk Mitigation

### Backward Compatibility
- Maintain existing recovery logic for EVEN/ODD/RISE/FALL signals
- Use feature flags if needed for gradual rollout
- Comprehensive testing before deployment

### Error Handling
- Graceful fallback to existing recovery logic if new logic fails
- Proper logging for debugging recovery strategy selection
- User notification of recovery strategy changes

### Performance Considerations
- Minimal performance impact (logic change only)
- No additional API calls or database queries
- Efficient signal type checking

## Testing Strategy

### Unit Tests
- Test recovery strategy calculation for each signal type
- Verify OVER signals return OVER4 recovery
- Verify UNDER signals return UNDER6 recovery
- Verify other signals maintain existing logic

### Integration Tests
- Test end-to-end recovery flow
- Verify service integration works correctly
- Test UI updates reflect new recovery strategies

### Manual Testing
- Test actual trading scenarios with recovery
- Verify recovery signals are generated correctly
- Confirm user experience is improved

## Correctness Properties

### Property 1: OVER Signal Recovery Consistency
**Property**: All OVER signal types (OVER1, OVER2, OVER3, OVER4, OVER5) should recover with OVER4
**Test**: For each OVER signal type, verify recovery strategy returns OVER4

### Property 2: UNDER Signal Recovery Consistency  
**Property**: All UNDER signal types (UNDER1, UNDER2, UNDER3, UNDER4, UNDER5) should recover with UNDER6
**Test**: For each UNDER signal type, verify recovery strategy returns UNDER6

### Property 3: Non-OVER/UNDER Signal Preservation
**Property**: EVEN, ODD, RISE, FALL signals should maintain existing recovery logic
**Test**: Verify these signal types return same recovery strategy as before changes

### Property 4: Recovery Strategy Determinism
**Property**: Same input signal should always produce same recovery strategy
**Test**: Multiple calls with same signal should return identical recovery strategy

## Deployment Plan

1. **Development**: Implement changes in development environment
2. **Testing**: Run comprehensive test suite
3. **Staging**: Deploy to staging for integration testing
4. **Production**: Deploy with monitoring and rollback plan

## Success Metrics

- OVER signals consistently recover with OVER4 (100% success rate)
- UNDER signals consistently recover with UNDER6 (100% success rate)
- No regression in existing signal type recovery logic
- Zero compilation errors or runtime exceptions
- Improved recovery success rates in trading scenarios