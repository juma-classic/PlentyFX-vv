/**
 * Manual Profit Calculator for Zen Trading
 * Calculates profit/loss without relying on API responses
 * Reduces API calls and improves performance
 */

export interface ContractDetails {
    contractType: string;
    stake: number;
    entrySpot: number;
    exitSpot: number;
    duration: number;
    defaultDigit?: number;
    payout?: number;
}

export interface ProfitResult {
    profit: number;
    outcome: 'win' | 'loss';
    payout: number;
    buyPrice: number;
    roi: number;
}

/**
 * Calculate profit/loss for digit contracts manually
 */
export function calculateDigitProfit(details: ContractDetails): ProfitResult {
    const { contractType, stake, entrySpot, exitSpot, defaultDigit = 0 } = details;

    // Extract last digit from exit spot (Deriv method)
    // For price 123.458, the last digit is 8 (from the last decimal place)
    const exitDigit = Math.floor((exitSpot * 1000) % 10);

    let isWin = false;

    // Determine win/loss based on contract type
    switch (contractType) {
        case 'DIGITEVEN':
            isWin = exitDigit % 2 === 0;
            break;
        case 'DIGITODD':
            isWin = exitDigit % 2 === 1;
            break;
        case 'DIGITMATCH':
            isWin = exitDigit === defaultDigit;
            break;
        case 'DIGITDIFF':
            isWin = exitDigit !== defaultDigit;
            break;
        case 'DIGITOVER':
            isWin = exitDigit > defaultDigit;
            break;
        case 'DIGITUNDER':
            isWin = exitDigit < defaultDigit;
            break;
        default:
            console.warn(`Unknown digit contract type: ${contractType}`);
            isWin = false;
    }

    // Calculate payout (typically 1.9x for digit contracts)
    const payoutMultiplier = getPayoutMultiplier(contractType);
    const payout = isWin ? stake * payoutMultiplier : 0;
    const profit = payout - stake;
    const roi = (profit / stake) * 100;

    console.log(`📊 Manual Profit Calculation:`, {
        contractType,
        entrySpot,
        exitSpot,
        exitDigit,
        defaultDigit,
        isWin,
        stake,
        payout,
        profit: profit.toFixed(2),
        roi: roi.toFixed(1) + '%',
    });

    return {
        profit: Math.round(profit * 100) / 100, // Round to 2 decimal places
        outcome: isWin ? 'win' : 'loss',
        payout,
        buyPrice: stake,
        roi,
    };
}

/**
 * Calculate profit/loss for Rise/Fall contracts manually
 */
export function calculateRiseFallProfit(details: ContractDetails): ProfitResult {
    const { contractType, stake, entrySpot, exitSpot } = details;

    let isWin = false;

    switch (contractType) {
        case 'CALL': // Rise
            isWin = exitSpot > entrySpot;
            break;
        case 'PUT': // Fall
            isWin = exitSpot < entrySpot;
            break;
        default:
            console.warn(`Unknown Rise/Fall contract type: ${contractType}`);
            isWin = false;
    }

    // Calculate payout (typically 1.8-1.95x for Rise/Fall)
    const payoutMultiplier = getPayoutMultiplier(contractType);
    const payout = isWin ? stake * payoutMultiplier : 0;
    const profit = payout - stake;
    const roi = (profit / stake) * 100;

    console.log(`📈 Manual Rise/Fall Calculation:`, {
        contractType,
        entrySpot,
        exitSpot,
        direction: exitSpot > entrySpot ? 'Rise' : 'Fall',
        isWin,
        stake,
        payout,
        profit: profit.toFixed(2),
        roi: roi.toFixed(1) + '%',
    });

    return {
        profit: Math.round(profit * 100) / 100,
        outcome: isWin ? 'win' : 'loss',
        payout,
        buyPrice: stake,
        roi,
    };
}

/**
 * Get payout multiplier based on contract type
 * These are typical Deriv payout rates
 */
function getPayoutMultiplier(contractType: string): number {
    const multipliers: Record<string, number> = {
        // Digit contracts
        DIGITEVEN: 1.9,
        DIGITODD: 1.9,
        DIGITMATCH: 9.0, // Higher payout for exact match
        DIGITDIFF: 1.11, // Lower payout for differs
        DIGITOVER: 1.9,
        DIGITUNDER: 1.9,

        // Rise/Fall contracts
        CALL: 1.85,
        PUT: 1.85,
    };

    return multipliers[contractType] || 1.8; // Default fallback
}

/**
 * Main profit calculation function - determines contract type and calculates accordingly
 */
export function calculateProfit(details: ContractDetails): ProfitResult {
    const { contractType } = details;

    // Digit contracts
    if (contractType.startsWith('DIGIT')) {
        return calculateDigitProfit(details);
    }

    // Rise/Fall contracts
    if (contractType === 'CALL' || contractType === 'PUT') {
        return calculateRiseFallProfit(details);
    }

    // Fallback for unknown contract types
    console.warn(`Unknown contract type: ${contractType}, using basic calculation`);
    const profit = -details.stake; // Assume loss for unknown types
    return {
        profit,
        outcome: 'loss',
        payout: 0,
        buyPrice: details.stake,
        roi: -100,
    };
}

/**
 * Calculate Straddle6 profit (Over 6 + Under 6 simultaneously)
 */
export function calculateStraddleProfit(
    overDetails: ContractDetails,
    underDetails: ContractDetails
): {
    overResult: ProfitResult;
    underResult: ProfitResult;
    totalProfit: number;
    totalOutcome: 'win' | 'loss';
} {
    const overResult = calculateDigitProfit(overDetails);
    const underResult = calculateDigitProfit(underDetails);

    const totalProfit = overResult.profit + underResult.profit;
    const totalOutcome = totalProfit > 0 ? 'win' : 'loss';

    console.log(`🎯 Straddle6 Manual Calculation:`, {
        overProfit: overResult.profit.toFixed(2),
        underProfit: underResult.profit.toFixed(2),
        totalProfit: totalProfit.toFixed(2),
        totalOutcome,
    });

    return {
        overResult,
        underResult,
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalOutcome,
    };
}
