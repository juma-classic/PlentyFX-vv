/**
 * TickShark Test Runner
 * Simple browser console test execution
 */

import { runTickSharkTests } from './tickshark-test';

// Make test runner available globally for console execution
declare global {
    interface Window {
        runTickSharkTests: () => Promise<void>;
        testTickShark: () => Promise<void>;
    }
}

// Browser-friendly test runner
export const testTickShark = async (): Promise<void> => {
    console.log('🦈 TickShark Integration Test Runner');
    console.log('====================================');
    console.log('Starting comprehensive integration tests...\n');
    
    try {
        await runTickSharkTests();
    } catch (error) {
        console.error('🚨 Test execution failed:', error);
    }
};

// Make functions available globally
if (typeof window !== 'undefined') {
    window.runTickSharkTests = runTickSharkTests;
    window.testTickShark = testTickShark;
    
    console.log('🦈 TickShark test functions loaded!');
    console.log('Run tests with: testTickShark() or runTickSharkTests()');
}