# Martingale Recovery Enhancement for OVER/UNDER Signals

## Overview
Enhance the martingale recovery logic for OVER/UNDER signals to be more strategic and aggressive, improving recovery rates by implementing forward progression instead of backward/safer recovery.

## User Stories

### US1: Strategic OVER Signal Recovery
**As a** trader using OVER signals  
**I want** the system to recover with OVER4 (forward/more aggressive) instead of OVER2 (backward/safer)  
**So that** I have better recovery potential when trading OVER signals

**Acceptance Criteria:**
- When an OVER signal loses, recovery should use OVER4 instead of OVER2
- OVER4 provides forward/more aggressive recovery strategy
- Recovery logic should be applied consistently across all OVER signal types

### US2: Strategic UNDER Signal Recovery  
**As a** trader using UNDER signals  
**I want** the system to recover with UNDER6 (forward/more aggressive) instead of UNDER8 (backward/safer)  
**So that** I have better recovery potential when trading UNDER signals

**Acceptance Criteria:**
- When an UNDER signal loses, recovery should use UNDER6 instead of UNDER8
- UNDER6 provides forward/more aggressive recovery strategy  
- Recovery logic should be applied consistently across all UNDER signal types

### US3: Maintain Current Logic for Other Signal Types
**As a** trader using EVEN/ODD and RISE/FALL signals  
**I want** the existing recovery logic to remain unchanged  
**So that** only OVER/UNDER signals are affected by the new recovery strategy

**Acceptance Criteria:**
- EVEN/ODD signals maintain current recovery logic
- RISE/FALL signals maintain current recovery logic
- No changes to recovery logic for non-OVER/UNDER signal types

## Technical Requirements

### TR1: Update Adaptive Recovery Strategy Service
- Modify `adaptive-recovery-strategy.service.ts` to implement new OVER/UNDER recovery logic
- Update `calculateRecoveryStrategy` method to handle OVER4/UNDER6 recovery
- Maintain backward compatibility with existing signal types

### TR2: Update Signal Bot Loader Service  
- Modify `signal-bot-loader.service.ts` to use new recovery strategy
- Ensure proper integration with adaptive recovery strategy service
- Update any direct references to recovery logic

### TR3: Update SignalsCenter Component
- Verify SignalsCenter component uses the updated recovery strategy
- Ensure proper error handling and logging for new recovery logic
- Test integration with existing martingale functionality

## Acceptance Criteria

### AC1: OVER Signal Recovery Logic
- OVER signals that lose should recover with OVER4 strategy
- Recovery should be one step forward (more aggressive) instead of backward
- System should log recovery strategy selection for debugging

### AC2: UNDER Signal Recovery Logic  
- UNDER signals that lose should recover with UNDER6 strategy
- Recovery should be one step forward (more aggressive) instead of backward
- System should log recovery strategy selection for debugging

### AC3: Backward Compatibility
- Existing EVEN/ODD recovery logic remains unchanged
- Existing RISE/FALL recovery logic remains unchanged
- No breaking changes to existing martingale functionality

### AC4: Testing and Validation
- Create test file to verify new recovery logic works correctly
- Validate that OVER signals recover with OVER4
- Validate that UNDER signals recover with UNDER6
- Ensure no syntax errors or compilation issues

## Implementation Notes

### Current Logic (to be changed):
- OVER3 loss → recover with OVER2 (backward/safer)
- UNDER5 loss → recover with UNDER8 (backward/safer)

### New Logic (desired):
- OVER3 loss → recover with OVER4 (forward/more aggressive)  
- UNDER5 loss → recover with UNDER6 (forward/more aggressive)

### Files to Modify:
1. `src/services/adaptive-recovery-strategy.service.ts` - Main recovery logic
2. `src/services/signal-bot-loader.service.ts` - Integration with recovery strategy
3. `src/components/signals/SignalsCenter.tsx` - Component integration (if needed)

## Definition of Done
- [ ] Recovery logic updated for OVER signals (OVER4 recovery)
- [ ] Recovery logic updated for UNDER signals (UNDER6 recovery)
- [ ] Other signal types maintain existing recovery logic
- [ ] No compilation errors or syntax issues
- [ ] Test file created and validates new logic
- [ ] Code changes committed and pushed to repository
- [ ] Documentation updated to reflect new recovery strategy

## Priority
**High** - This directly impacts trading strategy effectiveness and recovery rates for OVER/UNDER signals.