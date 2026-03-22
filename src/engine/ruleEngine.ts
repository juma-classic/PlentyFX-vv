/**
 * Tick-to-Trade Decision Engine
 * Processes digit changes and generates trade intents based on user rules
 * Supports multiple rules and complex trigger conditions
 */

import type { DigitChangeEvent } from './tickState';

export interface TradeRule {
    id: string;
    name: string;
    enabled: boolean;
    triggerDigit: number;
    tradesPerTick: number;
    contractType: string;
    stake: number;
    conditions?: {
        minInterval?: number; // Minimum ms between triggers
        maxPerMinute?: number; // Max trades per minute for this rule
        digitSequence?: number[]; // Sequence of digits to match
        priceRange?: { min: number; max: number }; // Price range filter
    };
}

export interface TradeIntent {
    id: string;
    ruleId: string;
    digit: number;
    timestamp: number;
    contractType: string;
    stake: number;
    price: number;
    metadata: {
        ruleName: string;
        digitChangeCount: number;
        tickCount: number;
    };
}

export class RuleEngine {
    private rules: Map<string, TradeRule> = new Map();
    private ruleStats: Map<
        string,
        {
            lastTriggered: number;
            triggersToday: number;
            tradesGenerated: number;
        }
    > = new Map();

    /**
     * Add or update a trading rule
     */
    public addRule(rule: TradeRule): void {
        console.log('📋 Adding trade rule:', rule);
        this.rules.set(rule.id, rule);

        if (!this.ruleStats.has(rule.id)) {
            this.ruleStats.set(rule.id, {
                lastTriggered: 0,
                triggersToday: 0,
                tradesGenerated: 0,
            });
        }
    }

    /**
     * Remove a trading rule
     */
    public removeRule(ruleId: string): void {
        console.log('🗑️ Removing trade rule:', ruleId);
        this.rules.delete(ruleId);
        this.ruleStats.delete(ruleId);
    }

    /**
     * Enable/disable a rule
     */
    public toggleRule(ruleId: string, enabled: boolean): void {
        const rule = this.rules.get(ruleId);
        if (rule) {
            rule.enabled = enabled;
            console.log(`🔄 Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    /**
     * Process digit change and generate trade intents
     */
    public processDigitChange(event: DigitChangeEvent): TradeIntent[] {
        const intents: TradeIntent[] = [];
        const now = Date.now();

        console.log('🎯 Processing digit change for rules:', {
            digit: event.currentDigit,
            activeRules: Array.from(this.rules.values()).filter(r => r.enabled).length,
        });

        // Check each active rule
        for (const rule of this.rules.values()) {
            if (!rule.enabled) {
                continue;
            }

            // Check if rule should trigger
            if (this.shouldTriggerRule(rule, event, now)) {
                const ruleIntents = this.generateTradeIntents(rule, event);
                intents.push(...ruleIntents);

                // Update rule stats
                const stats = this.ruleStats.get(rule.id)!;
                stats.lastTriggered = now;
                stats.triggersToday++;
                stats.tradesGenerated += ruleIntents.length;

                console.log('✅ Rule triggered:', {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    tradesGenerated: ruleIntents.length,
                    totalIntents: intents.length,
                });
            }
        }

        return intents;
    }

    /**
     * Check if a rule should trigger based on conditions
     */
    private shouldTriggerRule(rule: TradeRule, event: DigitChangeEvent, now: number): boolean {
        // Basic digit match
        if (event.currentDigit !== rule.triggerDigit) {
            return false;
        }

        const stats = this.ruleStats.get(rule.id)!;

        // Check minimum interval
        if (rule.conditions?.minInterval) {
            const timeSinceLastTrigger = now - stats.lastTriggered;
            if (timeSinceLastTrigger < rule.conditions.minInterval) {
                console.log('⏰ Rule blocked by min interval:', {
                    ruleId: rule.id,
                    timeSince: timeSinceLastTrigger,
                    required: rule.conditions.minInterval,
                });
                return false;
            }
        }

        // Check max per minute
        if (rule.conditions?.maxPerMinute) {
            const oneMinuteAgo = now - 60000;
            if (stats.lastTriggered > oneMinuteAgo && stats.triggersToday >= rule.conditions.maxPerMinute) {
                console.log('🚫 Rule blocked by max per minute:', {
                    ruleId: rule.id,
                    triggersToday: stats.triggersToday,
                    maxAllowed: rule.conditions.maxPerMinute,
                });
                return false;
            }
        }

        // Check price range
        if (rule.conditions?.priceRange) {
            const { min, max } = rule.conditions.priceRange;
            if (event.price < min || event.price > max) {
                console.log('💰 Rule blocked by price range:', {
                    ruleId: rule.id,
                    price: event.price,
                    range: rule.conditions.priceRange,
                });
                return false;
            }
        }

        return true;
    }

    /**
     * Generate trade intents for a triggered rule
     */
    private generateTradeIntents(rule: TradeRule, event: DigitChangeEvent): TradeIntent[] {
        const intents: TradeIntent[] = [];

        for (let i = 0; i < rule.tradesPerTick; i++) {
            const intent: TradeIntent = {
                id: `${rule.id}_${event.timestamp}_${i}`,
                ruleId: rule.id,
                digit: event.currentDigit,
                timestamp: event.timestamp + i, // Slight offset for multiple trades
                contractType: rule.contractType,
                stake: rule.stake,
                price: event.price,
                metadata: {
                    ruleName: rule.name,
                    digitChangeCount: event.digitChangeCount,
                    tickCount: event.tickCount,
                },
            };

            intents.push(intent);
        }

        return intents;
    }

    /**
     * Get all rules
     */
    public getRules(): TradeRule[] {
        return Array.from(this.rules.values());
    }

    /**
     * Get rule by ID
     */
    public getRule(ruleId: string): TradeRule | undefined {
        return this.rules.get(ruleId);
    }

    /**
     * Get rule statistics
     */
    public getRuleStats(): Map<
        string,
        {
            lastTriggered: number;
            triggersToday: number;
            tradesGenerated: number;
            rule: TradeRule;
        }
    > {
        const stats = new Map();

        for (const [ruleId, ruleStat] of this.ruleStats.entries()) {
            const rule = this.rules.get(ruleId);
            if (rule) {
                stats.set(ruleId, {
                    ...ruleStat,
                    rule,
                });
            }
        }

        return stats;
    }

    /**
     * Reset daily statistics
     */
    public resetDailyStats(): void {
        console.log('🔄 Resetting daily rule statistics');
        for (const stats of this.ruleStats.values()) {
            stats.triggersToday = 0;
            stats.tradesGenerated = 0;
        }
    }

    /**
     * Clear all rules
     */
    public clearRules(): void {
        console.log('🗑️ Clearing all rules');
        this.rules.clear();
        this.ruleStats.clear();
    }
}
