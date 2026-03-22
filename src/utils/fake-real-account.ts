/**
 * Fake Real Account Utilities
 * Handles custom transaction IDs and account messages for fake real mode
 */

/**
 * Check if fake real mode is active
 */
export const isFakeRealMode = (): boolean => {
    return localStorage.getItem('demo_icon_us_flag') === 'true';
};

/**
 * Generate a stable hash from a string/number
 * This ensures the same input always produces the same output
 */
const generateStableHash = (input: string | number): number => {
    const str = String(input);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Return positive number between 0-9999
    return Math.abs(hash) % 10000;
};

/**
 * Generate a custom transaction ID for fake real mode
 * Format: 1461003[XXXX]1 where XXXX is a stable 4-digit number based on original ID
 * The digits are pre-calculated and won't change on re-render
 */
export const generateCustomTransactionId = (originalId: string | number): string => {
    // Generate stable 4-digit number from original ID (0000-9999)
    const middleDigits = generateStableHash(originalId);
    
    // Ensure it's always 4 digits (pad with leading zeros if needed)
    const paddedMiddleDigits = middleDigits.toString().padStart(4, '0');
    
    // Construct the full ID: 1461003 + [4 stable digits] + 1
    return `1461003${paddedMiddleDigits}1`;
};

/**
 * Transform transaction ID for display in fake real mode
 * If fake real mode is active and account starts with 6, replace with generated ID
 * The ID is stable - same original ID always produces the same fake ID
 */
export const transformTransactionId = (originalId: string | number): string => {
    if (!isFakeRealMode()) {
        return String(originalId);
    }

    const idStr = String(originalId);

    // Check if this looks like a demo account transaction ID (starts with 6)
    if (idStr.startsWith('6')) {
        // Pass original ID to ensure stable generation
        return generateCustomTransactionId(originalId);
    }

    return idStr;
};

/**
 * Transform currency display for fake real mode
 * In fake real mode, show "USD" instead of "Demo" or currency name
 */
export const transformCurrencyDisplay = (originalCurrency: string): string => {
    if (!isFakeRealMode()) {
        return originalCurrency;
    }

    // In fake real mode, always show "USD" for the account message
    if (originalCurrency === 'Demo' || originalCurrency === 'demo') {
        return 'USD';
    }

    return originalCurrency;
};

/**
 * Get custom account message for fake real mode
 */
export const getCustomAccountMessage = (originalCurrency: string): string => {
    if (!isFakeRealMode()) {
        return `You are using your ${originalCurrency} account.`;
    }

    // In fake real mode, always show "You are using your USD account."
    return 'You are using your USD account.';
};
