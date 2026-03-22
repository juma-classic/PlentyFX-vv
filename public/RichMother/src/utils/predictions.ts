export interface Tick {
  epoch: number;
  quote: number;
  symbol: string;
}

export interface EvenOddResult {
  prediction: 'EVEN' | 'ODD';
  confidence: number;
  evenCount: number;
  oddCount: number;
  total: number;
}

export interface OverUnderResult {
  prediction: 'OVER' | 'UNDER';
  digit: number;
  label: string;
  confidence: number;
  recommendedRuns: number;
  entryPattern: string;
  entryDigits: number[];
  waitForPattern: boolean;
}

export interface DigitMatchResult {
  prediction: number;
  confidence: number;
  frequency: Record<number, number>;
}

// Helper: Extract the 2nd decimal place digit from tick price
export const getLastDigit = (quote: number): number => {
  // Format with enough decimal places to ensure we have at least 2
  const str = quote.toFixed(5);
  const decimalIndex = str.indexOf('.');
  if (decimalIndex === -1) return 0;
  // Get the 2nd decimal place (index: decimalIndex + 2)
  const digit = str[decimalIndex + 2];
  return digit ? parseInt(digit, 10) : 0;
};

// Helper: Clamp confidence between 55-95%
const clampConfidence = (value: number): number => {
  return Math.max(55, Math.min(95, Math.round(value)));
};

// Helper: Calculate recommended runs based on confidence
const calculateRecommendedRuns = (confidence: number): number => {
  const normalized = (confidence - 55) / 40; // 0 to 1 scale
  if (normalized > 0.75) return Math.floor(Math.random() * 5) + 11; // 11-15
  if (normalized > 0.5) return Math.floor(Math.random() * 6) + 8; // 8-13
  return Math.floor(Math.random() * 6) + 5; // 5-10
};

// Even/Odd Analysis
export const analyzeEvenOdd = (ticks: Tick[]): EvenOddResult | null => {
  if (!ticks || ticks.length < 10) return null;
  
  const digits = ticks.slice(-30).map(t => getLastDigit(t.quote));
  const evenCount = digits.filter(d => d % 2 === 0).length;
  const oddCount = digits.length - evenCount;
  
  const prediction: 'EVEN' | 'ODD' = evenCount > oddCount ? 'EVEN' : 'ODD';
  const ratio = Math.max(evenCount, oddCount) / digits.length;
  const confidence = clampConfidence(ratio * 100);
  
  return {
    prediction,
    confidence,
    evenCount,
    oddCount,
    total: digits.length
  };
};

// Helper: Generate entry pattern recommendation
const generateEntryPattern = (
  prediction: 'OVER' | 'UNDER', 
  digits: number[], 
  digitCounts: Record<number, number>
): { entryPattern: string; entryDigits: number[]; waitForPattern: boolean } => {
  const lastFive = digits.slice(-5);
  const OVER_RANGE = [5, 6, 7, 8, 9];
  const UNDER_RANGE = [0, 1, 2, 3, 4];
  
  if (prediction === 'OVER') {
    // For OVER: Wait for 2-3 consecutive UNDER digits before entering
    const consecutiveUnder = lastFive.filter(d => UNDER_RANGE.includes(d)).length;
    const bestEntryDigits = UNDER_RANGE
      .map(d => ({ digit: d, count: digitCounts[d] || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(d => d.digit);
    
    if (consecutiveUnder >= 2) {
      return {
        entryPattern: `Enter NOW! ${consecutiveUnder} low digits in a row`,
        entryDigits: bestEntryDigits,
        waitForPattern: false
      };
    }
    return {
      entryPattern: `Wait for 2+ digits from [${bestEntryDigits.join(', ')}]`,
      entryDigits: bestEntryDigits,
      waitForPattern: true
    };
  } else {
    // For UNDER: Wait for 2-3 consecutive OVER digits before entering
    const consecutiveOver = lastFive.filter(d => OVER_RANGE.includes(d)).length;
    const bestEntryDigits = OVER_RANGE
      .map(d => ({ digit: d, count: digitCounts[d] || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(d => d.digit);
    
    if (consecutiveOver >= 2) {
      return {
        entryPattern: `Enter NOW! ${consecutiveOver} high digits in a row`,
        entryDigits: bestEntryDigits,
        waitForPattern: false
      };
    }
    return {
      entryPattern: `Wait for 2+ digits from [${bestEntryDigits.join(', ')}]`,
      entryDigits: bestEntryDigits,
      waitForPattern: true
    };
  }
};

// Over/Under Analysis
export const analyzeOverUnder = (ticks: Tick[]): OverUnderResult | null => {
  if (!ticks || ticks.length < 10) return null;
  
  const digits = ticks.slice(-30).map(t => getLastDigit(t.quote));
  const OVER_RANGE = [5, 6, 7, 8, 9];
  const UNDER_RANGE = [0, 1, 2, 3, 4];
  
  const overCount = digits.filter(d => OVER_RANGE.includes(d)).length;
  const underCount = digits.filter(d => UNDER_RANGE.includes(d)).length;
  
  // Count specific digits for recommendations
  const digitCounts: Record<number, number> = {};
  digits.forEach(d => {
    digitCounts[d] = (digitCounts[d] || 0) + 1;
  });
  
  const totalRelevant = overCount + underCount;
  if (totalRelevant === 0) {
    const prediction: 'OVER' | 'UNDER' = Math.random() > 0.5 ? 'OVER' : 'UNDER';
    const digit = prediction === 'OVER' ? 6 : 3;
    const { entryPattern, entryDigits, waitForPattern } = generateEntryPattern(prediction, digits, digitCounts);
    return {
      prediction,
      digit,
      label: `${prediction} ${digit}`,
      confidence: 55,
      recommendedRuns: 5,
      entryPattern,
      entryDigits,
      waitForPattern
    };
  }
  
  const overRatio = overCount / totalRelevant;
  let prediction: 'OVER' | 'UNDER';
  let digit: number;
  
  if (overRatio > 0.55) {
    prediction = 'OVER';
    // Find most frequent OVER digit
    const overDigits = OVER_RANGE.map(d => ({ digit: d, count: digitCounts[d] || 0 }));
    overDigits.sort((a, b) => b.count - a.count);
    digit = overDigits[0].digit;
  } else if (overRatio < 0.45) {
    prediction = 'UNDER';
    // Find most frequent UNDER digit
    const underDigits = UNDER_RANGE.map(d => ({ digit: d, count: digitCounts[d] || 0 }));
    underDigits.sort((a, b) => b.count - a.count);
    digit = underDigits[0].digit;
  } else {
    // Neutral - pick based on slight lean
    prediction = overRatio >= 0.5 ? 'OVER' : 'UNDER';
    digit = prediction === 'OVER' ? 5 : 4;
  }
  
  const difference = Math.abs(overCount - underCount);
  const confidenceRaw = 50 + (difference / digits.length) * 50;
  const confidence = clampConfidence(confidenceRaw);
  const recommendedRuns = calculateRecommendedRuns(confidence);
  const { entryPattern, entryDigits, waitForPattern } = generateEntryPattern(prediction, digits, digitCounts);
  
  return {
    prediction,
    digit,
    label: `${prediction} ${digit}`,
    confidence,
    recommendedRuns,
    entryPattern,
    entryDigits,
    waitForPattern
  };
};

// Digit Match Analysis
export const analyzeDigitMatch = (ticks: Tick[]): DigitMatchResult | null => {
  if (!ticks || ticks.length < 10) return null;
  
  const digits = ticks.slice(-30).map(t => getLastDigit(t.quote));
  const frequency: Record<number, number> = {};
  
  digits.forEach(d => {
    frequency[d] = (frequency[d] || 0) + 1;
  });
  
  let maxCount = 0;
  let prediction = 0;
  
  Object.entries(frequency).forEach(([digit, count]) => {
    if (count > maxCount) {
      maxCount = count;
      prediction = parseInt(digit, 10);
    }
  });
  
  const confidenceRaw = (maxCount / digits.length) * 100;
  const confidence = clampConfidence(confidenceRaw);
  
  return {
    prediction,
    confidence,
    frequency
  };
};
