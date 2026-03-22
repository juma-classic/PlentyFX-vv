# Unified Bot Architecture Complete

## Overview

Both Patel and Raziel services now use the same bot file (`Raziel Over Under.xml`) with different parameter configurations. This creates a unified, consistent architecture while maintaining the unique characteristics of each service.

## ✅ **Changes Made**

### **1. Patel Bot Loader Service - Complete Rewrite**

-   **Old**: Used `PATEL (with Entry).xml` with event dispatching
-   **New**: Uses `Raziel Over Under.xml` with direct XML parameter injection

**Key Changes**:

-   Changed bot file from `PATEL (with Entry).xml` → `Raziel Over Under.xml`
-   Added stake manager integration for consistent settings
-   Implemented direct XML configuration (same as Raziel)
-   Added multiple bot loading methods (Blockly, file input, custom events)
-   Updated notification styling to match Patel branding (purple)

### **2. Raziel Bot Loader Service - Enhanced**

-   **Already Used**: `Raziel Over Under.xml` ✅
-   **Enhanced**: Now uses stake manager for consistent settings
-   **Improved**: Better XML parameter injection with stake manager integration

## 🤖 **Bot File Usage**

### **Both Services Now Use:**

-   **Bot File**: `public/Raziel Over Under.xml`
-   **Stake Manager**: Automatic integration for user settings
-   **XML Configuration**: Direct parameter injection using specific block IDs

### **Parameter Differences:**

| Service    | Prediction Logic        | Contract Type        | Use Case                                       |
| ---------- | ----------------------- | -------------------- | ---------------------------------------------- |
| **Raziel** | Before: 2/7, After: 3/6 | DIGITOVER/DIGITUNDER | Hot/Cold Zone & Distribution Deviation signals |
| **Patel**  | Before: 8/1, After: 6/3 | DIGITOVER            | Digit-specific configurations (0-4 vs 5-9)     |

## 🔧 **Technical Implementation**

### **Unified XML Configuration Process:**

1. **Load** `Raziel Over Under.xml` from public directory
2. **Parse** XML using DOMParser
3. **Apply** stake manager settings (stake & martingale)
4. **Configure** service-specific parameters:
    - Market symbol
    - Contract type
    - Prediction before/after loss values
5. **Inject** into Deriv Bot Builder using multiple methods

### **Stake Manager Integration:**

```typescript
// Both services now use this pattern
const stakeSettings = stakeManager.getSettings();
stake = customSettings?.stake || stakeSettings.stake;
martingale = customSettings?.martingale || stakeSettings.martingale;

// Apply to XML
const stakeManagerResult = stakeManager.applySettingsToXML(xmlDoc);
```

### **Block ID Targeting:**

Both services use the same XML block IDs for parameter injection:

-   **Initial Stake**: `block[id="TDv/W;dNI84TFbp}8X8="] field[name="NUM"]`
-   **Martingale**: `block[id="Ib,Krc\`nUJzn1KMo9)\`A"] field[name="NUM"]`
-   **Prediction Before Loss**: `block[id="~]Q~lGg)3FCGB95VKA\`b"] field[name="NUM"]`
-   **Prediction After Loss**: `block[id="(6)D~Nlfu/PCG*s5!9Qy"] field[name="NUM"]`

## 📊 **Benefits of Unified Architecture**

### **1. Consistency**

-   Same bot structure ensures predictable behavior
-   Unified parameter injection methodology
-   Consistent stake/martingale handling

### **2. Maintainability**

-   Single bot file to maintain and update
-   Shared XML configuration logic
-   Centralized stake management

### **3. Reliability**

-   Proven bot structure (Raziel Over Under is well-tested)
-   Multiple loading methods for better compatibility
-   Comprehensive error handling

### **4. User Experience**

-   Consistent behavior across services
-   Unified settings management
-   Same loading mechanisms

## 🎯 **Service-Specific Configurations**

### **Raziel Service:**

```typescript
// Hot/Cold Zone & Distribution Deviation signals
predictionBeforeLoss = signal.recommendation.action === 'OVER' ? 2 : 7;
predictionAfterLoss = signal.recommendation.action === 'OVER' ? 3 : 6;
contractType = signal.recommendation.action === 'OVER' ? 'DIGITOVER' : 'DIGITUNDER';
```

### **Patel Service:**

```typescript
// Digit-based strategy (0-4 vs 5-9)
if (digit >= 0 && digit <= 4) {
    predictionBeforeLoss = 8; // LOW_DIGITS strategy
    predictionAfterLoss = 6;
} else {
    predictionBeforeLoss = 1; // HIGH_DIGITS strategy
    predictionAfterLoss = 3;
}
contractType = 'DIGITOVER'; // Patel typically uses OVER
```

## 🚀 **Loading Methods**

Both services now use the same three loading methods:

1. **Blockly Workspace**: Direct workspace injection
2. **File Input Simulation**: Simulates file upload
3. **Custom Event**: Dispatches injection event

This ensures maximum compatibility across different Deriv Bot Builder versions and configurations.

## 📝 **Files Modified**

-   ✅ `src/services/patel-bot-loader.service.ts` - Complete rewrite
-   ✅ `src/services/raziel-bot-loader.service.ts` - Enhanced with stake manager
-   ✅ Both services now use unified architecture

## 🎉 **Result**

-   **Patel** and **Raziel** services now both use `Raziel Over Under.xml`
-   **Consistent** parameter injection and bot loading
-   **Unified** stake and martingale management
-   **Reliable** multi-method bot loading
-   **Maintainable** single-bot architecture

Users will experience consistent behavior and settings management across both services while maintaining the unique strategic differences that make each service valuable.
