// Test script to verify the new recovery logic
const testCases = [
    // OVER signals - Forward recovery for barriers < 4
    { signal: 'OVER0', barrier: 0, expected: { recovery: 1, direction: 'forward' } },
    { signal: 'OVER1', barrier: 1, expected: { recovery: 2, direction: 'forward' } },
    { signal: 'OVER2', barrier: 2, expected: { recovery: 3, direction: 'forward' } },
    { signal: 'OVER3', barrier: 3, expected: { recovery: 4, direction: 'forward' } },
    
    // OVER signals - Backward recovery for barriers >= 4
    { signal: 'OVER4', barrier: 4, expected: { recovery: 3, direction: 'backward' } },
    { signal: 'OVER5', barrier: 5, expected: { recovery: 4, direction: 'backward' } },
    { signal: 'OVER6', barrier: 6, expected: { recovery: 5, direction: 'backward' } },
    
    // UNDER signals - Backward recovery for barriers <= 5
    { signal: 'UNDER0', barrier: 0, expected: { recovery: 1, direction: 'backward' } },
    { signal: 'UNDER1', barrier: 1, expected: { recovery: 2, direction: 'backward' } },
    { signal: 'UNDER5', barrier: 5, expected: { recovery: 6, direction: 'backward' } },
    
    // UNDER signals - Forward recovery for barriers > 5
    { signal: 'UNDER6', barrier: 6, expected: { recovery: 5, direction: 'forward' } },
    { signal: 'UNDER7', barrier: 7, expected: { recovery: 6, direction: 'forward' } },
    { signal: 'UNDER8', barrier: 8, expected: { recovery: 7, direction: 'forward' } },
];

console.log('🧪 Testing New Recovery Logic:');
console.log('=====================================');

testCases.forEach(test => {
    const { signal, barrier, expected } = test;
    const signalType = signal.includes('OVER') ? 'OVER' : 'UNDER';
    
    let actualRecovery;
    let actualDirection;
    
    if (signalType === 'OVER') {
        if (barrier < 4) {
            actualRecovery = Math.min(barrier + 1, 9);
            actualDirection = 'forward';
        } else {
            actualRecovery = Math.max(barrier - 1, 0);
            actualDirection = 'backward';
        }
    } else { // UNDER
        if (barrier > 5) {
            actualRecovery = Math.max(barrier - 1, 0);
            actualDirection = 'forward';
        } else {
            actualRecovery = Math.min(barrier + 1, 9);
            actualDirection = 'backward';
        }
    }
    
    const isCorrect = actualRecovery === expected.recovery && actualDirection === expected.direction;
    const status = isCorrect ? '✅' : '❌';
    
    console.log(`${status} ${signal}: ${barrier} → ${actualRecovery} (${actualDirection})`);
    
    if (!isCorrect) {
        console.log(`   Expected: ${expected.recovery} (${expected.direction})`);
        console.log(`   Actual: ${actualRecovery} (${actualDirection})`);
    }
});

console.log('=====================================');
console.log('🎯 Key Changes Summary:');
console.log('• OVER0-OVER3: Forward recovery (more aggressive)');
console.log('• OVER4+: Backward recovery (more conservative)');
console.log('• UNDER0-UNDER5: Backward recovery (more conservative)');
console.log('• UNDER6+: Forward recovery (more aggressive)');