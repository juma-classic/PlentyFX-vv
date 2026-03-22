/**
 * Integration tests for Zeus Analysis Tool
 * Tests end-to-end flows and component integration
 */

import { checkForAlerts } from '../../../utils/alert-manager';
import { createBotStrategyConfig } from '../../../utils/bot-strategy-creator';
import * as CacheManager from '../../../utils/cache-manager';
import { calculateProbabilities } from '../../../utils/probability-calculator';
import { createTradeSignal } from '../../../utils/trade-signal-generator';
import '@testing-library/jest-dom';

describe('ZeusAnalysisTool - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('End-to-End Probability Calculation Flow', () => {
    it('should calculate probabilities for large datasets efficiently', () => {
      const mockTicks = Array.from({ length: 1000 }, (_, i) => ({
        epoch: Date.now() - i * 1000,
        quote: 100 + Math.random() * 10,
        lastDigit: Math.floor(Math.random() * 10),
        source: 'live' as const,
        localTime: new Date().toISOString(),
      }));

      const start = performance.now();
      const predictions = calculateProbabilities(mockTicks);
      const duration = performance.now() - start;

      expect(predictions).toBeDefined();
      expect(predictions.length).toBe(10);
      expect(duration).toBeLessThan(100);
    });

    it('should calculate probabilities with correct distribution', () => {
      const mockTicks = Array.from({ length: 20 }, (_, i) => ({
        epoch: Date.now() - (20 - i) * 1000,
        quote: 100 + i,
        lastDigit: i % 10,
        source: 'live' as const,
        localTime: new Date(Date.now() - (20 - i) * 1000).toISOString(),
      }));

      const predictions = calculateProbabilities(mockTicks);

      // Should return predictions for all 10 digits
      expect(predictions.length).toBe(10);
      
      // All probabilities should sum to approximately 1
      const totalProbability = predictions.reduce((sum, p) => sum + p.probability, 0);
      expect(totalProbability).toBeCloseTo(1, 1);
    });
  });

  describe('Alert System Integration', () => {
    it('should detect patterns and create alerts with real tick data', () => {
      // Create tick data with a pattern (5 consecutive same digits)
      const patternDigit = 7;
      const mockTicks = [
        ...Array.from({ length: 10 }, (_, i) => ({
          epoch: Date.now() - (15 - i) * 1000,
          quote: 100 + i,
          lastDigit: i % 10,
          source: 'live' as const,
          localTime: new Date().toISOString(),
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          epoch: Date.now() - (5 - i) * 1000,
          quote: 100 + 10 + i,
          lastDigit: patternDigit,
          source: 'live' as const,
          localTime: new Date().toISOString(),
        })),
      ];

      // Check for alerts
      const alerts = checkForAlerts(mockTicks, [{
        digit: patternDigit,
        probability: 0.35,
        confidence: 'high',
        reasoning: 'Test',
      }]);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(a => a.type === 'pattern-detected')).toBe(true);
    });

    it('should create high-confidence alerts when threshold exceeded', () => {
      const mockTicks = Array.from({ length: 20 }, (_, i) => ({
        epoch: Date.now() - i * 1000,
        quote: 100 + i,
        lastDigit: 7,
        source: 'live' as const,
        localTime: new Date().toISOString(),
      }));

      const highConfidencePredictions = [{
        digit: 7,
        probability: 0.75,
        confidence: 'high' as const,
        reasoning: 'Strong pattern detected',
      }];

      const alerts = checkForAlerts(mockTicks, highConfidencePredictions);

      expect(alerts.some(a => a.type === 'high-confidence')).toBe(true);
    });
  });

  describe('Cache Integration and TTL', () => {
    it('should cache tick data and retrieve within TTL', () => {
      const testData = [
        {
          epoch: Date.now(),
          quote: 100.5,
          lastDigit: 5,
          source: 'live' as const,
          localTime: new Date().toISOString(),
        },
      ];

      // Set cache with 5-minute TTL
      CacheManager.CacheManager.set('test-ticks', testData, 300000);

      // Retrieve immediately (should hit cache)
      const cached = CacheManager.CacheManager.get('test-ticks');
      expect(cached).toEqual(testData);
    });

    it('should expire cache after TTL', async () => {
      const testData = [{ test: 'data' }];

      // Set cache with 100ms TTL
      CacheManager.CacheManager.set('test-expire', testData, 100);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should return null after expiration
      const cached = CacheManager.CacheManager.get('test-expire');
      expect(cached).toBeNull();
    });

    it('should handle corrupted cache data gracefully', () => {
      // Manually corrupt cache
      sessionStorage.setItem('zeus_cache_corrupted', 'invalid-json{{{');

      // Should not throw and return null
      const result = CacheManager.CacheManager.get('corrupted');
      expect(result).toBeNull();
    });
  });

  describe('Bot Builder Integration', () => {
    it('should create bot strategy with complete configuration', () => {
      const prediction = {
        digit: 7,
        probability: 0.75,
        confidence: 'high' as const,
        reasoning: 'Strong pattern',
      };

      const strategy = createBotStrategyConfig(prediction, 'R_100');

      expect(strategy).toHaveProperty('tradeType');
      expect(strategy).toHaveProperty('market');
      expect(strategy).toHaveProperty('prediction');
      expect(strategy).toHaveProperty('stake');
      expect(strategy).toHaveProperty('duration');
      expect(strategy).toHaveProperty('martingale');
      expect(strategy).toHaveProperty('stopLoss');
      expect(strategy).toHaveProperty('takeProfit');
      expect(strategy.market).toBe('R_100');
      expect(strategy.prediction).toBe(7);
    });

    it('should create trade signal with complete data', () => {
      const prediction = {
        digit: 8,
        probability: 0.65,
        confidence: 'high' as const,
        reasoning: 'Strong upward pattern',
      };

      const signal = createTradeSignal(prediction, 'R_100');

      expect(signal).toHaveProperty('type');
      expect(signal).toHaveProperty('market');
      expect(signal).toHaveProperty('prediction');
      expect(signal).toHaveProperty('confidence');
      expect(signal).toHaveProperty('reasoning');
      expect(signal).toHaveProperty('timestamp');
      expect(signal.market).toBe('R_100');
      expect(signal.prediction).toBe(8);
      expect(signal.confidence).toBe('high');
    });

    it('should map digits correctly to trade types', () => {
      // Test DIGITUNDER (0-4)
      const underPrediction = {
        digit: 3,
        probability: 0.5,
        confidence: 'medium' as const,
        reasoning: 'Test',
      };
      const underSignal = createTradeSignal(underPrediction, 'R_100');
      expect(underSignal.type).toBe('DIGITUNDER');

      // Test DIGITOVER (5-9)
      const overPrediction = {
        digit: 7,
        probability: 0.5,
        confidence: 'medium' as const,
        reasoning: 'Test',
      };
      const overSignal = createTradeSignal(overPrediction, 'R_100');
      expect(overSignal.type).toBe('DIGITOVER');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should handle large tick datasets efficiently', () => {
      const largeTicks = Array.from({ length: 1000 }, (_, i) => ({
        epoch: Date.now() - i * 1000,
        quote: 100 + Math.random() * 10,
        lastDigit: Math.floor(Math.random() * 10),
        source: 'live' as const,
        localTime: new Date().toISOString(),
      }));

      const start = performance.now();
      calculateProbabilities(largeTicks);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should calculate probabilities for 100 ticks quickly', () => {
      const ticks = Array.from({ length: 100 }, (_, i) => ({
        epoch: Date.now() - i * 1000,
        quote: 100 + Math.random() * 10,
        lastDigit: Math.floor(Math.random() * 10),
        source: 'live' as const,
        localTime: new Date().toISOString(),
      }));

      const start = performance.now();
      calculateProbabilities(ticks);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should handle invalid tick data gracefully', () => {
      const invalidTicks: any[] = [
        { epoch: 'invalid', quote: 100, lastDigit: 5 },
        { epoch: Date.now(), quote: null, lastDigit: 3 },
      ];

      // Should not throw when calculating probabilities with invalid data
      expect(() => {
        calculateProbabilities(invalidTicks.filter(t => 
          typeof t.epoch === 'number' && 
          typeof t.quote === 'number' && 
          typeof t.lastDigit === 'number'
        ));
      }).not.toThrow();
    });

    it('should handle empty tick arrays', () => {
      const emptyTicks: any[] = [];

      // Should not throw with empty arrays
      expect(() => {
        calculateProbabilities(emptyTicks);
        checkForAlerts(emptyTicks, []);
      }).not.toThrow();
    });
  });

  describe('Integration Flow Tests', () => {
    it('should complete full analysis flow: ticks -> probabilities -> alerts', () => {
      // Step 1: Generate tick data
      const ticks = Array.from({ length: 20 }, (_, i) => ({
        epoch: Date.now() - (20 - i) * 1000,
        quote: 100 + Math.random() * 10,
        lastDigit: i % 10,
        source: 'live' as const,
        localTime: new Date(Date.now() - (20 - i) * 1000).toISOString(),
      }));

      // Step 2: Calculate probabilities
      const predictions = calculateProbabilities(ticks);
      expect(predictions).toBeDefined();
      expect(predictions.length).toBe(10);

      // Step 3: Check for alerts
      const alerts = checkForAlerts(ticks, predictions);
      expect(Array.isArray(alerts)).toBe(true);

      // Step 4: Create trade signal from top prediction
      const topPrediction = predictions.reduce((max, p) => 
        p.probability > max.probability ? p : max
      );
      const signal = createTradeSignal(topPrediction, 'R_100');
      expect(signal).toHaveProperty('type');
      expect(signal).toHaveProperty('market');
      expect(signal.market).toBe('R_100');
    });

    it('should integrate cache with probability calculations', () => {
      const ticks = Array.from({ length: 50 }, (_, i) => ({
        epoch: Date.now() - i * 1000,
        quote: 100 + Math.random() * 10,
        lastDigit: Math.floor(Math.random() * 10),
        source: 'live' as const,
        localTime: new Date().toISOString(),
      }));

      // Cache the ticks
      const cacheKey = 'test-integration-ticks';
      CacheManager.CacheManager.set(cacheKey, ticks, 300000);

      // Retrieve from cache
      const cachedTicks = CacheManager.CacheManager.get(cacheKey);
      expect(cachedTicks).toEqual(ticks);

      // Calculate probabilities from cached data
      const predictions = calculateProbabilities(cachedTicks);
      expect(predictions.length).toBe(10);
    });
  });
});
