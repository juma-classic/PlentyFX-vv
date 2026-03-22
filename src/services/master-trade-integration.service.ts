/**
 * Master Trade Integration Service
 * Integrates copy trading with all trading functions in the platform
 */

import type { MasterTrade } from '@/types/copy-trading.types';
import { copyTradingService } from './copy-trading.service';

export interface TradeExecutionData {
    source: 'SIGNAL' | 'BOT' | 'MANUAL' | 'ZEN' | 'FAST_LANE' | 'SPEED_BOT' | 'FLIPPING_TOOL';
    market: string;
    contractType: string;
    stake: number;
    duration: number;
    durationUnit: 't' | 'm' | 'h' | 'd';
    barrier?: string;
    strategy?: string;
    confidence?: string;
    signalId?: string;
    botName?: string;
    contractId?: string;
    metadata?: Record<string, any>;
}

class MasterTradeIntegrationService {
    private isEnabled = true;
    private debugMode = false;

    /**
     * Initialize the integration service
     */
    async initialize(): Promise<void> {
        console.log('🔗 Initializing Master Trade Integration Service...');

        // Initialize copy trading service
        await copyTradingService.initialize();

        console.log('✅ Master Trade Integration Service initialized');
    }

    /**
     * Execute a master trade and trigger copy trading
     */
    async executeMasterTrade(tradeData: TradeExecutionData): Promise<MasterTrade> {
        if (this.debugMode) {
            console.log('🎯 Master Trade Execution:', tradeData);
        }

        // Create master trade record
        const masterTrade: MasterTrade = {
            id: `master-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            source: tradeData.source,
            market: tradeData.market,
            contractType: tradeData.contractType,
            stake: tradeData.stake,
            duration: tradeData.duration,
            durationUnit: tradeData.durationUnit,
            barrier: tradeData.barrier,
            executedAt: Date.now(),
            contractId: tradeData.contractId,
            shouldCopy: this.shouldCopyTrade(tradeData),
            copyExecutions: [],
            strategy: tradeData.strategy,
            confidence: tradeData.confidence,
            signalId: tradeData.signalId,
            botName: tradeData.botName,
        };

        console.log('📋 Master Trade Created:', {
            id: masterTrade.id,
            source: masterTrade.source,
            market: masterTrade.market,
            contractType: masterTrade.contractType,
            stake: masterTrade.stake,
            shouldCopy: masterTrade.shouldCopy,
        });

        // Execute copy trading if enabled
        if (this.isEnabled && masterTrade.shouldCopy) {
            try {
                const executedMasterTrade = await copyTradingService.executeMasterTrade(masterTrade);
                console.log(`✅ Copy trading executed for ${executedMasterTrade.copyExecutions.length} traders`);
                return executedMasterTrade;
            } catch (error) {
                console.error('❌ Copy trading execution failed:', error);
                // Return master trade even if copy trading fails
                return masterTrade;
            }
        }

        return masterTrade;
    }

    /**
     * Determine if a trade should be copied
     */
    private shouldCopyTrade(tradeData: TradeExecutionData): boolean {
        // Don't copy if integration is disabled
        if (!this.isEnabled) return false;

        // Don't copy test trades or demo trades
        if (tradeData.metadata?.isTest || tradeData.metadata?.isDemo) {
            return false;
        }

        // Copy all real trades by default
        return true;
    }

    /**
     * Hook for signal trades
     */
    async onSignalTrade(signalTradeData: {
        signalId: string;
        market: string;
        contractType: string;
        stake: number;
        duration: number;
        durationUnit: 't' | 'm' | 'h' | 'd';
        barrier?: string;
        strategy?: string;
        confidence?: string;
        contractId?: string;
    }): Promise<MasterTrade> {
        return this.executeMasterTrade({
            source: 'SIGNAL',
            market: signalTradeData.market,
            contractType: signalTradeData.contractType,
            stake: signalTradeData.stake,
            duration: signalTradeData.duration,
            durationUnit: signalTradeData.durationUnit,
            barrier: signalTradeData.barrier,
            strategy: signalTradeData.strategy,
            confidence: signalTradeData.confidence,
            signalId: signalTradeData.signalId,
            contractId: signalTradeData.contractId,
        });
    }

    /**
     * Hook for bot trades
     */
    async onBotTrade(botTradeData: {
        botName: string;
        market: string;
        contractType: string;
        stake: number;
        duration: number;
        durationUnit: 't' | 'm' | 'h' | 'd';
        barrier?: string;
        contractId?: string;
    }): Promise<MasterTrade> {
        return this.executeMasterTrade({
            source: 'BOT',
            market: botTradeData.market,
            contractType: botTradeData.contractType,
            stake: botTradeData.stake,
            duration: botTradeData.duration,
            durationUnit: botTradeData.durationUnit,
            barrier: botTradeData.barrier,
            botName: botTradeData.botName,
            contractId: botTradeData.contractId,
        });
    }

    /**
     * Hook for manual trades
     */
    async onManualTrade(manualTradeData: {
        market: string;
        contractType: string;
        stake: number;
        duration: number;
        durationUnit: 't' | 'm' | 'h' | 'd';
        barrier?: string;
        contractId?: string;
    }): Promise<MasterTrade> {
        return this.executeMasterTrade({
            source: 'MANUAL',
            market: manualTradeData.market,
            contractType: manualTradeData.contractType,
            stake: manualTradeData.stake,
            duration: manualTradeData.duration,
            durationUnit: manualTradeData.durationUnit,
            barrier: manualTradeData.barrier,
            contractId: manualTradeData.contractId,
        });
    }

    /**
     * Hook for Zen mode trades
     */
    async onZenTrade(zenTradeData: {
        market: string;
        contractType: string;
        stake: number;
        duration: number;
        durationUnit: 't' | 'm' | 'h' | 'd';
        barrier?: string;
        strategy?: string;
        contractId?: string;
    }): Promise<MasterTrade> {
        return this.executeMasterTrade({
            source: 'ZEN',
            market: zenTradeData.market,
            contractType: zenTradeData.contractType,
            stake: zenTradeData.stake,
            duration: zenTradeData.duration,
            durationUnit: zenTradeData.durationUnit,
            barrier: zenTradeData.barrier,
            strategy: zenTradeData.strategy,
            contractId: zenTradeData.contractId,
        });
    }

    /**
     * Hook for Fast Lane trades
     */
    async onFastLaneTrade(fastLaneTradeData: {
        market: string;
        contractType: string;
        stake: number;
        duration: number;
        durationUnit: 't' | 'm' | 'h' | 'd';
        barrier?: string;
        contractId?: string;
    }): Promise<MasterTrade> {
        return this.executeMasterTrade({
            source: 'FAST_LANE',
            market: fastLaneTradeData.market,
            contractType: fastLaneTradeData.contractType,
            stake: fastLaneTradeData.stake,
            duration: fastLaneTradeData.duration,
            durationUnit: fastLaneTradeData.durationUnit,
            barrier: fastLaneTradeData.barrier,
            contractId: fastLaneTradeData.contractId,
        });
    }

    /**
     * Hook for Speed Bot trades
     */
    async onSpeedBotTrade(speedBotTradeData: {
        market: string;
        contractType: string;
        stake: number;
        duration: number;
        durationUnit: 't' | 'm' | 'h' | 'd';
        barrier?: string;
        contractId?: string;
    }): Promise<MasterTrade> {
        return this.executeMasterTrade({
            source: 'SPEED_BOT',
            market: speedBotTradeData.market,
            contractType: speedBotTradeData.contractType,
            stake: speedBotTradeData.stake,
            duration: speedBotTradeData.duration,
            durationUnit: speedBotTradeData.durationUnit,
            barrier: speedBotTradeData.barrier,
            botName: 'Speed Bot',
            contractId: speedBotTradeData.contractId,
        });
    }

    /**
     * Hook for Flipping Tool trades
     */
    async onFlippingToolTrade(flippingToolTradeData: {
        market: string;
        contractType: string;
        stake: number;
        duration: number;
        durationUnit: 't' | 'm' | 'h' | 'd';
        barrier?: string;
        contractId?: string;
    }): Promise<MasterTrade> {
        return this.executeMasterTrade({
            source: 'FLIPPING_TOOL',
            market: flippingToolTradeData.market,
            contractType: flippingToolTradeData.contractType,
            stake: flippingToolTradeData.stake,
            duration: flippingToolTradeData.duration,
            durationUnit: flippingToolTradeData.durationUnit,
            barrier: flippingToolTradeData.barrier,
            botName: 'Flipping Tool',
            contractId: flippingToolTradeData.contractId,
        });
    }

    /**
     * Enable/disable copy trading integration
     */
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        console.log(`🔗 Master Trade Integration ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }

    /**
     * Enable/disable debug mode
     */
    setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
        console.log(`🐛 Master Trade Integration Debug Mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }

    /**
     * Get integration status
     */
    getStatus(): { enabled: boolean; debugMode: boolean } {
        return {
            enabled: this.isEnabled,
            debugMode: this.debugMode,
        };
    }
}

// Export singleton instance
export const masterTradeIntegrationService = new MasterTradeIntegrationService();
