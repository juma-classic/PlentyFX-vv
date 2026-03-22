/**
 * TickShark Simulation Types
 * Type definitions for simulation and backtesting environments
 */

import { TickData, AnalysisResult } from './analysis.types';
import { TradeIntent } from './execution.types';

export type SimulationMode = 'LIVE_SIMULATION' | 'HISTORICAL_REPLAY' | 'SYNTHETIC_DATA' | 'HYBRID';

export type DataSourceType = 'LIVE_TICKS' | 'HISTORICAL_FILE' | 'SYNTHETIC_GENERATOR' | 'MIXED';

export interface SimulationConfig {
    // Simulation Mode
    mode: SimulationMode;
    duration: number; // Simulation duration in ms
    
    // Data Source Configuration
    dataSource: {
        type: DataSourceType;
        symbol: string;
        timeRange: [number, number];
        tickRate: number;
        filePath?: string;
    };
    
    // Execution Simulation
    executionSimulation: {
        latencyRange: [number, number];
        slippageRange: [number, number];
        rejectionRate: number;
        partialFillRate: number;
        networkJitter: number;
    };
    
    // Market Simulation
    marketSimulation: {
        spreadRange: [number, number];
        volatilityFactor: number;
        gapProbability: number;
        liquidityFactor: number;
        marketHours: boolean;
    };
    
    // Performance Settings
    performance: {
        maxTicksPerSecond: number;
        bufferSize: number;
        memoryLimit: number;
        enableOptimizations: boolean;
    };
    
    // Logging and Output
    logging: {
        enableDetailedLogging: boolean;
        logLevel: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
        outputPath?: string;
        saveResults: boolean;
    };
}

export interface SimulationState {
    id: string;
    startTime: number;
    currentTime: number;
    endTime?: number;
    
    // Status
    status: 'INITIALIZING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
    progress: number; // 0-1 scale
    
    // Data Processing
    ticksProcessed: number;
    analysesCompleted: number;
    tradesExecuted: number;
    
    // Performance Metrics
    processingRate: number; // ticks per second
    memoryUsage: number;
    cpuUsage: number;
    
    // Simulation Results
    results?: SimulationResult;
    
    // Error Handling
    errors: string[];
    warnings: string[];
}

export interface SimulationResult {
    id: string;
    config: SimulationConfig;
    
    // Execution Summary
    duration: number;
    ticksProcessed: number;
    analysesCompleted: number;
    tradesExecuted: number;
    
    // Trading Performance
    tradingResults: {
        totalTrades: number;
        successfulTrades: number;
        failedTrades: number;
        totalStake: number;
        totalPayout: number;
        netProfit: number;
        winRate: number;
        maxDrawdown: number;
        sharpeRatio: number;
    };
    
    // Analysis Performance
    analysisResults: {
        opportunitiesDetected: number;
        opportunitiesActioned: number;
        averageLatency: number;
        predictionAccuracy: number;
        falsePositiveRate: number;
    };
    
    // System Performance
    systemPerformance: {
        averageProcessingTime: number;
        maxMemoryUsage: number;
        averageCpuUsage: number;
        errorCount: number;
        warningCount: number;
    };
    
    // Detailed Data
    tickData: TickData[];
    analysisData: AnalysisResult[];
    tradeData: TradeIntent[];
    
    // Metadata
    timestamp: number;
    version: string;
    notes?: string;
}

export interface BacktestConfig {
    // Strategy Configuration
    strategy: {
        name: string;
        version: string;
        parameters: Record<string, any>;
    };
    
    // Data Configuration
    dataConfig: {
        symbol: string;
        timeRange: [number, number];
        resolution: 'TICK' | '1S' | '5S' | '1M' | '5M';
        dataSource: string;
    };
    
    // Risk Management
    riskManagement: {
        maxStakePerTrade: number;
        maxTotalStake: number;
        maxDrawdown: number;
        stopLossThreshold: number;
        takeProfitThreshold: number;
    };
    
    // Execution Settings
    execution: {
        slippageModel: 'NONE' | 'LINEAR' | 'SQUARE_ROOT' | 'CUSTOM';
        latencyModel: 'NONE' | 'FIXED' | 'VARIABLE' | 'REALISTIC';
        commissionRate: number;
        minTradeInterval: number;
    };
    
    // Analysis Settings
    analysis: {
        enableWalkForward: boolean;
        walkForwardPeriod: number;
        enableMonteCarlo: boolean;
        monteCarloRuns: number;
        confidenceLevel: number;
    };
    
    // Output Settings
    output: {
        generateReport: boolean;
        saveTradeLog: boolean;
        saveAnalysisLog: boolean;
        exportFormat: 'JSON' | 'CSV' | 'EXCEL';
    };
}

export interface BacktestResult {
    id: string;
    config: BacktestConfig;
    
    // Performance Metrics
    performance: {
        totalReturn: number;
        annualizedReturn: number;
        volatility: number;
        sharpeRatio: number;
        sortinoRatio: number;
        maxDrawdown: number;
        calmarRatio: number;
        winRate: number;
        profitFactor: number;
        averageWin: number;
        averageLoss: number;
        largestWin: number;
        largestLoss: number;
    };
    
    // Trade Statistics
    tradeStats: {
        totalTrades: number;
        winningTrades: number;
        losingTrades: number;
        consecutiveWins: number;
        consecutiveLosses: number;
        averageTradeLength: number;
        tradesPerDay: number;
    };
    
    // Risk Metrics
    riskMetrics: {
        valueAtRisk: number;
        conditionalVaR: number;
        beta: number;
        alpha: number;
        informationRatio: number;
        trackingError: number;
    };
    
    // Statistical Analysis
    statistics: {
        correlation: number;
        skewness: number;
        kurtosis: number;
        jarqueBera: number;
        normalityTest: boolean;
        stationarityTest: boolean;
    };
    
    // Walk-Forward Analysis
    walkForward?: {
        periods: number;
        averageReturn: number;
        consistency: number;
        degradation: number;
    };
    
    // Monte Carlo Analysis
    monteCarlo?: {
        runs: number;
        confidenceInterval: [number, number];
        probabilityOfProfit: number;
        expectedReturn: number;
        worstCase: number;
        bestCase: number;
    };
    
    // Detailed Results
    trades: TradeIntent[];
    equity: number[];
    drawdown: number[];
    
    // Metadata
    timestamp: number;
    duration: number;
    version: string;
}

export interface ReplaySession {
    id: string;
    name: string;
    description?: string;
    
    // Session Data
    originalSession: string;
    tickData: TickData[];
    analysisData: AnalysisResult[];
    tradeData: TradeIntent[];
    
    // Replay Configuration
    replayConfig: {
        speed: number; // Replay speed multiplier
        startTime: number;
        endTime: number;
        enablePause: boolean;
        enableSeeking: boolean;
    };
    
    // Replay State
    replayState: {
        currentTime: number;
        isPlaying: boolean;
        isPaused: boolean;
        progress: number; // 0-1 scale
    };
    
    // Metadata
    createdAt: number;
    lastAccessed: number;
    tags: string[];
    notes?: string;
}