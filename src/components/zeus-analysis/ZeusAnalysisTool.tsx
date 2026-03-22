import React, { useCallback, useEffect, useRef, useState } from 'react';
import { patelBotLoaderService } from '../../services/patel-bot-loader.service';
import { Alert, AlertManager, checkForAlerts, DEFAULT_ALERT_SETTINGS } from '../../utils/alert-manager';
import { logError } from '../../utils/error-logger';
import { DEFAULT_NOTIFICATION_SETTINGS, NotificationManager } from '../../utils/notification-manager';
import { PredictionStrategy, predictNextDigit, STRATEGY_INFO } from '../../utils/prediction-algorithms';
import { getTopN } from '../../utils/probability-calculator';
import { AlertNotificationPanel } from './AlertNotificationPanel';
import { DigitCircle } from './DigitCircle';
import { LoadingSkeleton } from './LoadingSkeleton';

import { ProbabilityPredictionCard } from './ProbabilityPredictionCard';
import { RecentTicksList } from './RecentTicksList';
import './ZeusAnalysisTool.scss';
import './ProbabilityPredictionCard.scss';
import './RecentTicksList.scss';
import './LoadingSkeleton.scss';
import './AlertNotificationPanel.scss';

interface TickData {
    epoch: number;
    quote: number;
    lastDigit: number;
    source: 'historical' | 'live';
    localTime: string;
}

interface DigitStats {
    count: number;
    percentage: number;
    recent15: number[];
}

interface AnalysisResult {
    percentage: number;
    count: number;
    streak: number;
    sequence: string[];
}

interface PredictionTracker {
    predictedDigit: number;
    predictionTime: number;
    matched: boolean;
    matchedAtRun?: number;
    matchedAtTime?: number;
    strategy: string;
    confidence: string;
}

interface TimedSignal {
    id: string;
    timestamp: number;
    predictedDigit: number;
    strategy: string;
    confidence: string;
    nextSignalIn: number;
}

const MARKETS = [
    { value: 'R_10', label: 'Volatility 10' },
    { value: 'R_25', label: 'Volatility 25' },
    { value: 'R_50', label: 'Volatility 50' },
    { value: 'R_75', label: 'Volatility 75' },
    { value: 'R_100', label: 'Volatility 100' },
    { value: '1HZ10V', label: 'Volatility 10 (1s)' },
    { value: '1HZ15V', label: 'Volatility 15 (1s)' },
    { value: '1HZ25V', label: 'Volatility 25 (1s)' },
    { value: '1HZ30V', label: 'Volatility 30 (1s)' },
    { value: '1HZ50V', label: 'Volatility 50 (1s)' },
    { value: '1HZ75V', label: 'Volatility 75 (1s)' },
    { value: '1HZ90V', label: 'Volatility 90 (1s)' },
    { value: '1HZ100V', label: 'Volatility 100 (1s)' },
];

interface ZeusAnalysisToolProps {
    onNavigateToFreeBots?: () => void;
}

export const ZeusAnalysisTool: React.FC<ZeusAnalysisToolProps> = ({ onNavigateToFreeBots }) => {
    const [selectedMarket, setSelectedMarket] = useState('R_50');
    const [ticks, setTicks] = useState<TickData[]>([]);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [selectedOverUnder, setSelectedOverUnder] = useState(5);
    const [selectedMatches, setSelectedMatches] = useState(5);
    const [timeRange, setTimeRange] = useState<10 | 50 | 100>(50);
    const [syncStatus, setSyncStatus] = useState('Initializing...');
    const [isLoading, setIsLoading] = useState(true);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [predictionStrategy, setPredictionStrategy] = useState<PredictionStrategy>('ensemble');

    // Auto-reconnection states
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [maxReconnectAttempts] = useState(10);
    const [reconnectDelay, setReconnectDelay] = useState(1000); // Start with 1 second
    const [connectionHealth, setConnectionHealth] = useState<'healthy' | 'stale' | 'failed'>('healthy');

    // Prediction tracking states
    const [predictionTrackers, setPredictionTrackers] = useState<PredictionTracker[]>([]);
    const [currentTracker, setCurrentTracker] = useState<PredictionTracker | null>(null);

    // Timed signals states
    const [timedSignals, setTimedSignals] = useState<TimedSignal[]>([]);
    const [nextSignalCountdown, setNextSignalCountdown] = useState<number>(60);
    const [isSignalActive, setIsSignalActive] = useState<boolean>(false);
    const [signalInterval, setSignalInterval] = useState<number>(60); // 60 seconds default

    // Settings panel state
    const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState<boolean>(false);

    // Constant for tick count
    const tickCount = 1000;

    const wsRef = useRef<WebSocket | null>(null);
    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const alertManagerRef = useRef<AlertManager>(new AlertManager(DEFAULT_ALERT_SETTINGS));
    const notificationManagerRef = useRef<NotificationManager>(new NotificationManager(DEFAULT_NOTIFICATION_SETTINGS));
    const signalCountdownRef = useRef<NodeJS.Timeout | null>(null);
    const predictionCheckRef = useRef<NodeJS.Timeout | null>(null);

    // Extract last digit from price
    const getLastDigit = (price: number): number => {
        const priceStr = price.toString();
        const lastChar = priceStr[priceStr.length - 1];
        return parseInt(lastChar, 10);
    };

    // Auto-reconnection function with exponential backoff and better stale detection
    const scheduleReconnect = useCallback(() => {
        if (reconnectAttempts >= maxReconnectAttempts) {
            console.log('❌ Max reconnection attempts reached');
            setSyncStatus('Connection Failed - Max Retries Reached');
            setIsReconnecting(false);
            return;
        }

        setIsReconnecting(true);
        setSyncStatus(`Reconnecting... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);

        const delay = Math.min(reconnectDelay * Math.pow(1.5, reconnectAttempts), 15000); // More gradual backoff, max 15 seconds
        console.log(`🔄 Scheduling reconnection in ${delay}ms (attempt ${reconnectAttempts + 1})`);

        reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectWebSocket();
        }, delay);
    }, [reconnectAttempts, maxReconnectAttempts, reconnectDelay]);

    // Reset reconnection state on successful connection
    const resetReconnectionState = useCallback(() => {
        setReconnectAttempts(0);
        setIsReconnecting(false);
        setReconnectDelay(1000);
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    }, []);

    // Heartbeat to detect connection issues with enhanced stale detection
    const startHeartbeat = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
        }

        let lastPongTime = Date.now();
        let missedPongs = 0;
        const maxMissedPongs = 3;

        heartbeatIntervalRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                const now = Date.now();

                // Check if connection appears stale (no activity for 60 seconds)
                if (lastSync && now - lastSync.getTime() > 60000) {
                    console.warn('⚠️ Connection appears stale, reconnecting...');
                    wsRef.current.close();
                    scheduleReconnect();
                    return;
                }

                // Send ping and track response
                try {
                    wsRef.current.send(
                        JSON.stringify({
                            ping: 1,
                            req_id: `ping_${now}`,
                        })
                    );

                    // Check if we've missed too many pongs
                    if (now - lastPongTime > 90000) {
                        // 90 seconds without pong
                        missedPongs++;
                        console.warn(`⚠️ Missed pong ${missedPongs}/${maxMissedPongs}`);

                        if (missedPongs >= maxMissedPongs) {
                            console.warn('⚠️ Connection failed');
                            wsRef.current.close();
                            scheduleReconnect();
                            return;
                        }
                    }
                } catch (error) {
                    console.error('❌ Failed to send ping:', error);
                    wsRef.current.close();
                    scheduleReconnect();
                }
            } else if (wsRef.current?.readyState === WebSocket.CLOSED) {
                console.log('💔 Heartbeat detected closed connection, attempting reconnect');
                scheduleReconnect();
            }
        }, 30000); // Check every 30 seconds

        // Reset pong tracking when we receive any message
        const originalOnMessage = wsRef.current?.onmessage;
        if (wsRef.current) {
            wsRef.current.onmessage = event => {
                lastPongTime = Date.now();
                missedPongs = 0;
                if (originalOnMessage) {
                    originalOnMessage.call(wsRef.current, event);
                }
            };
        }
    }, [scheduleReconnect, lastSync]);

    // Connection health monitor - runs independently to detect stale connections
    useEffect(() => {
        const healthCheckInterval = setInterval(() => {
            if (!isConnected || !lastSync) {
                setConnectionHealth('failed');
                return;
            }

            const now = Date.now();
            const timeSinceLastSync = now - lastSync.getTime();

            if (timeSinceLastSync > 120000) {
                // 2 minutes without data
                console.warn('⚠️ Connection health: STALE (no data for 2+ minutes)');
                setConnectionHealth('stale');

                // Force reconnection for stale connections
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    console.log('🔄 Forcing reconnection due to stale connection');
                    wsRef.current.close();
                }
            } else if (timeSinceLastSync > 60000) {
                // 1 minute without data
                console.warn('⚠️ Connection health: DEGRADED (no data for 1+ minute)');
                setConnectionHealth('stale');
            } else {
                setConnectionHealth('healthy');
            }
        }, 30000); // Check every 30 seconds

        return () => clearInterval(healthCheckInterval);
    }, [isConnected, lastSync]);

    // Connect to Deriv WebSocket with enhanced error handling
    const connectWebSocket = useCallback(() => {
        // Clear any existing reconnection timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.close();
        }

        setIsLoading(true);
        setError(null);

        try {
            const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=110800');
            wsRef.current = ws;

            // Set connection timeout - reduced for faster detection
            const connectionTimeout = setTimeout(() => {
                if (ws.readyState === WebSocket.CONNECTING) {
                    console.log('⏰ Connection timeout, closing and retrying');
                    ws.close();
                    scheduleReconnect();
                }
            }, 8000); // Reduced to 8 seconds

            ws.onopen = () => {
                clearTimeout(connectionTimeout);
                console.log('✅ WebSocket connected successfully');
                setIsConnected(true);
                setSyncStatus('Connected');
                resetReconnectionState();
                startHeartbeat();

                // Request historical ticks with live subscription
                ws.send(
                    JSON.stringify({
                        ticks_history: selectedMarket,
                        count: tickCount,
                        end: 'latest',
                        style: 'ticks',
                        subscribe: 1, // Subscribe to live tick updates
                    })
                );
                console.log('📡 Subscribed to live ticks for', selectedMarket);

                // Subscribe to live ticks
                ws.send(
                    JSON.stringify({
                        ticks: selectedMarket,
                        subscribe: 1,
                    })
                );
            };

            ws.onmessage = event => {
                try {
                    const data = JSON.parse(event.data);

                    // Handle pong responses
                    if (data.pong) {
                        console.log('🏓 Pong received, connection alive');
                        return;
                    }

                    if (data.error) {
                        const errorMessage = `API Error: ${data.error.message}`;
                        logError('ZeusAnalysisTool', errorMessage, 'high', {
                            errorCode: data.error.code,
                            market: selectedMarket,
                        });
                        setError(errorMessage);
                        setSyncStatus('API Error');
                        setIsLoading(false);
                        return;
                    }

                    // Update last sync time for any valid message
                    setLastSync(new Date());

                    if (data.history) {
                        // Historical ticks
                        const historicalTicks: TickData[] = data.history.times.map((epoch: number, idx: number) => {
                            const quote = data.history.prices[idx];
                            return {
                                epoch,
                                quote,
                                lastDigit: getLastDigit(quote),
                                source: 'historical' as const,
                                localTime: new Date(epoch * 1000).toISOString(),
                            };
                        });
                        setTicks(historicalTicks);
                        setLastSync(new Date());
                        setSyncStatus('Synced');
                        setIsLoading(false);
                    } else if (data.tick) {
                        // Live tick
                        const newTick: TickData = {
                            epoch: data.tick.epoch,
                            quote: data.tick.quote,
                            lastDigit: getLastDigit(data.tick.quote),
                            source: 'live',
                            localTime: new Date(data.tick.epoch * 1000).toISOString(),
                        };
                        console.log('📊 New tick received:', newTick.lastDigit, 'Quote:', newTick.quote);
                        setTicks(prev => {
                            const updatedTicks = [...prev, newTick];

                            // Check for alerts with updated ticks
                            if (updatedTicks.length >= 10) {
                                try {
                                    const predictions = getTopN(updatedTicks, 5);
                                    const currentAlertSettings = alertManagerRef.current.getSettings();
                                    const newAlerts = checkForAlerts(updatedTicks, predictions, currentAlertSettings);

                                    if (newAlerts.length > 0) {
                                        alertManagerRef.current.addAlerts(newAlerts);
                                        setAlerts(alertManagerRef.current.getAlerts());

                                        // Handle notifications for each new alert
                                        newAlerts.forEach(alert => {
                                            notificationManagerRef.current.handleAlert(alert);
                                        });
                                    }
                                } catch (error) {
                                    logError(
                                        'ZeusAnalysisTool',
                                        error instanceof Error ? error : new Error('Failed to check for alerts'),
                                        'medium',
                                        {
                                            tickCount: updatedTicks.length,
                                        }
                                    );
                                    console.error('Failed to check for alerts:', error);
                                }
                            }

                            // Check prediction tracking
                            if (currentTracker && !currentTracker.matched) {
                                if (newTick.lastDigit === currentTracker.predictedDigit) {
                                    const runNumber = updatedTicks.length;
                                    const updatedTracker = {
                                        ...currentTracker,
                                        matched: true,
                                        matchedAtRun: runNumber,
                                        matchedAtTime: newTick.epoch,
                                    };

                                    setCurrentTracker(updatedTracker);
                                    setPredictionTrackers(prev => [...prev, updatedTracker]);

                                    console.log(
                                        `🎯 PREDICTION MATCHED! Digit ${currentTracker.predictedDigit} appeared at run ${runNumber}`
                                    );

                                    // Show notification
                                    if (notificationManagerRef.current) {
                                        const matchAlert: Alert = {
                                            id: `match-${Date.now()}`,
                                            type: 'high-confidence',
                                            message: `Prediction Matched! Digit ${currentTracker.predictedDigit} appeared at run ${runNumber}`,
                                            timestamp: Date.now(),
                                            digit: currentTracker.predictedDigit,
                                            priority: 'medium',
                                        };
                                        notificationManagerRef.current.handleAlert(matchAlert);
                                    }
                                }
                            }

                            return updatedTicks;
                        });
                        setCurrentPrice(data.tick.quote);
                        setLastSync(new Date());
                    }
                } catch (error) {
                    logError(
                        'ZeusAnalysisTool',
                        error instanceof Error ? error : new Error('Failed to parse WebSocket message'),
                        'medium',
                        {
                            market: selectedMarket,
                            rawData: event.data,
                        }
                    );
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            ws.onerror = error => {
                clearTimeout(connectionTimeout);
                console.error('❌ WebSocket error:', error);
                logError(
                    'ZeusAnalysisTool',
                    error instanceof Error ? error : new Error('WebSocket connection error'),
                    'high',
                    {
                        market: selectedMarket,
                        tickCount,
                        readyState: ws.readyState,
                        reconnectAttempts,
                    }
                );
                setIsConnected(false);
                setSyncStatus('Connection Error');
                setIsLoading(false);

                // Don't immediately reconnect on error, let onclose handle it
            };

            ws.onclose = event => {
                clearTimeout(connectionTimeout);
                console.log('🔌 WebSocket closed:', event.code, event.reason);
                logError('ZeusAnalysisTool', `WebSocket connection closed: ${event.code} - ${event.reason}`, 'medium', {
                    market: selectedMarket,
                    tickCount,
                    wasClean: event.wasClean,
                    code: event.code,
                    reason: event.reason,
                });

                setIsConnected(false);
                setIsLoading(false);

                // Stop heartbeat
                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current);
                    heartbeatIntervalRef.current = null;
                }

                // Only attempt reconnection if it wasn't a clean close and we're not already reconnecting
                if (!event.wasClean && !isReconnecting && reconnectAttempts < maxReconnectAttempts) {
                    console.log('🔄 Connection lost unexpectedly, scheduling reconnection');
                    scheduleReconnect();
                } else if (event.wasClean) {
                    setSyncStatus('Disconnected');
                    resetReconnectionState();
                }
            };
        } catch (error) {
            console.error('❌ Failed to create WebSocket:', error);
            setError('Failed to create WebSocket connection');
            setIsLoading(false);
            scheduleReconnect();
        }
    }, [
        selectedMarket,
        scheduleReconnect,
        resetReconnectionState,
        startHeartbeat,
        isReconnecting,
        reconnectAttempts,
        maxReconnectAttempts,
    ]);

    // Initialize connection with enhanced cleanup
    useEffect(() => {
        connectWebSocket();

        // Reduced auto-refresh interval since we have better reconnection logic
        syncIntervalRef.current = setInterval(
            () => {
                console.log('🔄 Scheduled refresh...');
                // Only refresh if not currently reconnecting
                if (!isReconnecting && isConnected) {
                    connectWebSocket();
                }
            },
            5 * 60 * 1000 // 5 minutes instead of 2
        );

        return () => {
            // Cleanup all intervals and timeouts
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
            }
            if (statusIntervalRef.current) {
                clearInterval(statusIntervalRef.current);
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
            if (signalCountdownRef.current) {
                clearInterval(signalCountdownRef.current);
            }
            if (predictionCheckRef.current) {
                clearInterval(predictionCheckRef.current);
            }
            // Cleanup notification manager
            notificationManagerRef.current.cleanup();
        };
    }, [connectWebSocket, isReconnecting, isConnected]);

    // Update sync status every second
    useEffect(() => {
        statusIntervalRef.current = setInterval(() => {
            if (lastSync) {
                const secondsAgo = Math.floor((Date.now() - lastSync.getTime()) / 1000);
                setSyncStatus(`Synced ${secondsAgo}s ago`);
            }
        }, 1000);

        return () => {
            if (statusIntervalRef.current) {
                clearInterval(statusIntervalRef.current);
            }
        };
    }, [lastSync]);

    // Generate timed signal
    const generateTimedSignal = useCallback(() => {
        if (ticks.length < 10) return;

        const prediction = predictNextDigit(ticks, predictionStrategy);
        const newSignal: TimedSignal = {
            id: `signal-${Date.now()}`,
            timestamp: Date.now(),
            predictedDigit: prediction.digit,
            strategy: predictionStrategy,
            confidence: prediction.confidence,
            nextSignalIn: signalInterval,
        };

        setTimedSignals(prev => [newSignal, ...prev.slice(0, 9)]); // Keep last 10 signals

        // Start tracking this prediction
        const tracker: PredictionTracker = {
            predictedDigit: prediction.digit,
            predictionTime: Date.now(),
            matched: false,
            strategy: predictionStrategy,
            confidence: prediction.confidence,
        };

        setCurrentTracker(tracker);
        console.log(`📡 New timed signal generated: Digit ${prediction.digit} (${prediction.confidence})`);
    }, [ticks, predictionStrategy, signalInterval]);

    // Handle digit circle click - COMPLETELY DISABLED: No functionality when clicking digits
    const handleDigitClick = useCallback(async (digit: number) => {
        // Completely disabled - no action when clicking digits in PATEL mode
        return;
    }, []);

    // Timed Signal Countdown System
    useEffect(() => {
        if (isSignalActive) {
            signalCountdownRef.current = setInterval(() => {
                setNextSignalCountdown(prev => {
                    if (prev <= 1) {
                        // Generate new signal
                        generateTimedSignal();
                        return signalInterval;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (signalCountdownRef.current) {
                clearInterval(signalCountdownRef.current);
            }
        }

        return () => {
            if (signalCountdownRef.current) {
                clearInterval(signalCountdownRef.current);
            }
        };
    }, [isSignalActive, signalInterval, generateTimedSignal]);

    // Start/Stop timed signals
    const toggleTimedSignals = () => {
        setIsSignalActive(prev => {
            if (!prev) {
                // Starting signals
                setNextSignalCountdown(signalInterval);
                generateTimedSignal();
            }
            return !prev;
        });
    };

    // Calculate digit statistics
    const digitStats: Record<number, DigitStats> = {};
    for (let i = 0; i < 10; i++) {
        const count = ticks.filter(t => t.lastDigit === i).length;
        const recent15 = ticks
            .slice(-15)
            .filter(t => t.lastDigit === i)
            .map(() => 1);
        digitStats[i] = {
            count,
            percentage: ticks.length > 0 ? (count / ticks.length) * 100 : 0,
            recent15,
        };
    }

    // Sort digits by frequency
    const sortedDigits = Object.entries(digitStats)
        .map(([digit, stats]) => ({ digit: parseInt(digit), ...stats }))
        .sort((a, b) => b.count - a.count);

    const currentDigit = ticks.length > 0 ? ticks[ticks.length - 1].lastDigit : null;

    // Over/Under Analysis
    const overUnderAnalysis = (): AnalysisResult => {
        const over = ticks.filter(t => t.lastDigit > selectedOverUnder);
        const under = ticks.filter(t => t.lastDigit < selectedOverUnder);
        const sequence = ticks
            .slice(-10)
            .map(t => (t.lastDigit > selectedOverUnder ? 'O' : t.lastDigit < selectedOverUnder ? 'U' : '='));

        let streak = 0;
        for (let i = ticks.length - 1; i >= 0; i--) {
            const current = ticks[i].lastDigit > selectedOverUnder ? 'O' : 'U';
            const last = ticks[ticks.length - 1].lastDigit > selectedOverUnder ? 'O' : 'U';
            if (current === last) streak++;
            else break;
        }

        return {
            percentage: ticks.length > 0 ? (over.length / (over.length + under.length)) * 100 : 0,
            count: over.length,
            streak,
            sequence,
        };
    };

    // Matches/Differs Analysis
    const matchesDiffersAnalysis = (): AnalysisResult => {
        const matches = ticks.filter(t => t.lastDigit === selectedMatches);
        const sequence = ticks.slice(-10).map(t => (t.lastDigit === selectedMatches ? 'M' : 'D'));

        let streak = 0;
        for (let i = ticks.length - 1; i >= 0; i--) {
            const current = ticks[i].lastDigit === selectedMatches ? 'M' : 'D';
            const last = ticks[ticks.length - 1].lastDigit === selectedMatches ? 'M' : 'D';
            if (current === last) streak++;
            else break;
        }

        return {
            percentage: ticks.length > 0 ? (matches.length / ticks.length) * 100 : 0,
            count: matches.length,
            streak,
            sequence,
        };
    };

    // Even/Odd Analysis
    const evenOddAnalysis = (): AnalysisResult => {
        const even = ticks.filter(t => t.lastDigit % 2 === 0);
        const sequence = ticks.slice(-10).map(t => (t.lastDigit % 2 === 0 ? 'E' : 'O'));

        let streak = 0;
        for (let i = ticks.length - 1; i >= 0; i--) {
            const current = ticks[i].lastDigit % 2 === 0 ? 'E' : 'O';
            const last = ticks[ticks.length - 1].lastDigit % 2 === 0 ? 'E' : 'O';
            if (current === last) streak++;
            else break;
        }

        return {
            percentage: ticks.length > 0 ? (even.length / ticks.length) * 100 : 0,
            count: even.length,
            streak,
            sequence,
        };
    };

    // Rise/Fall Analysis
    const riseFallAnalysis = (): AnalysisResult => {
        let rise = 0;
        let fall = 0;
        const sequence: string[] = [];

        for (let i = 1; i < ticks.length; i++) {
            if (ticks[i].quote > ticks[i - 1].quote) {
                rise++;
                if (i >= ticks.length - 10) sequence.push('R');
            } else if (ticks[i].quote < ticks[i - 1].quote) {
                fall++;
                if (i >= ticks.length - 10) sequence.push('F');
            } else {
                if (i >= ticks.length - 10) sequence.push('=');
            }
        }

        let streak = 0;
        for (let i = ticks.length - 1; i > 0; i--) {
            const current = ticks[i].quote > ticks[i - 1].quote ? 'R' : 'F';
            const last = ticks[ticks.length - 1].quote > ticks[ticks.length - 2].quote ? 'R' : 'F';
            if (current === last) streak++;
            else break;
        }

        return {
            percentage: ticks.length > 1 ? (rise / (rise + fall)) * 100 : 0,
            count: rise,
            streak,
            sequence,
        };
    };

    // AI Prediction using selected strategy (recalculates when ticks or strategy changes)
    const prediction = React.useMemo(() => {
        const result = predictNextDigit(ticks, predictionStrategy);
        console.log('🎯 Prediction updated:', result.digit, 'Strategy:', predictionStrategy, 'Ticks:', ticks.length);
        return result;
    }, [ticks, predictionStrategy]);

    // Time-based analysis
    const timeBasedAnalysis = () => {
        const recentTicks = ticks.slice(-timeRange);
        const digitCounts: Record<number, number> = {};
        for (let i = 0; i < 10; i++) {
            digitCounts[i] = recentTicks.filter(t => t.lastDigit === i).length;
        }
        return digitCounts;
    };

    // Trend indicators
    const trendIndicators = () => {
        if (ticks.length < 50) return {};

        const first25 = ticks.slice(-50, -25);
        const last25 = ticks.slice(-25);
        const trends: Record<number, { change: number; direction: string }> = {};

        for (let i = 0; i < 10; i++) {
            const first25Count = first25.filter(t => t.lastDigit === i).length;
            const last25Count = last25.filter(t => t.lastDigit === i).length;
            const change = ((last25Count - first25Count) / (first25Count || 1)) * 100;

            trends[i] = {
                change,
                direction: change > 5 ? '📈' : change < -5 ? '📉' : '➡️',
            };
        }

        return trends;
    };

    // Export CSV
    const exportCSV = () => {
        const csv = [
            'Epoch,Quote,Last Digit,Source,Local Time',
            ...ticks.map(t => `${t.epoch},${t.quote},${t.lastDigit},${t.source},${t.localTime}`),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zeus-analysis-${selectedMarket}-${Date.now()}.csv`;
        a.click();
    };

    const overUnder = overUnderAnalysis();
    const matchesDiffers = matchesDiffersAnalysis();
    const evenOdd = evenOddAnalysis();
    const riseFall = riseFallAnalysis();
    const timeBased = timeBasedAnalysis();
    const trends = trendIndicators();

    // Handle alert dismissal
    const handleDismissAlert = (alertId: string) => {
        alertManagerRef.current.removeAlert(alertId);
        setAlerts(alertManagerRef.current.getAlerts());
    };

    // Navigate to Free Bots tab and auto-open MatchesMaster
    const openFreeBots = () => {
        if (onNavigateToFreeBots) {
            onNavigateToFreeBots();
        } else {
            // Fallback: Dispatch custom event to switch to Free Bots tab
            const event = new CustomEvent('switch.tab', {
                detail: { tabIndex: 8 }, // DBOT_TABS.FREE_BOTS = 8
                bubbles: true,
                cancelable: true,
            });
            window.dispatchEvent(event);
        }

        // Dispatch event to auto-open MatchesMaster bot after a short delay
        setTimeout(() => {
            const openBotEvent = new CustomEvent('open.matchesmaster.bot', {
                detail: {
                    predictedDigit: prediction.digit,
                    market: selectedMarket,
                },
                bubbles: true,
                cancelable: true,
            });
            window.dispatchEvent(openBotEvent);
            console.log('🤖 Opening MatchesMaster bot with digit:', prediction.digit);
        }, 300); // Small delay to ensure tab has switched

        console.log('🤖 Opening Free Bots tab');
    };

    // Show error message if there's an error
    if (error && !isReconnecting) {
        return (
            <div className='zeus-analysis-tool'>
                <div className='zeus-error-message'>
                    <div className='error-icon'>⚠️</div>
                    <h3>Connection Error</h3>
                    <p>{error}</p>
                    {reconnectAttempts > 0 && (
                        <p className='reconnect-info'>
                            Reconnection attempts: {reconnectAttempts}/{maxReconnectAttempts}
                        </p>
                    )}
                    <div className='error-actions'>
                        <button
                            className='btn-primary'
                            onClick={() => {
                                setError(null);
                                setIsLoading(true);
                                resetReconnectionState();
                                connectWebSocket();
                            }}
                            disabled={isReconnecting}
                        >
                            {isReconnecting ? 'Reconnecting...' : 'Retry Connection'}
                        </button>
                        {reconnectAttempts >= maxReconnectAttempts && (
                            <button
                                className='btn-secondary'
                                onClick={() => {
                                    setError(null);
                                    setIsLoading(true);
                                    setReconnectAttempts(0);
                                    setIsReconnecting(false);
                                    connectWebSocket();
                                }}
                            >
                                Force Reconnect
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Show loading skeleton during initial data fetch
    if (isLoading || ticks.length === 0) {
        return <LoadingSkeleton />;
    }

    // Show insufficient data message
    if (ticks.length < 10) {
        return (
            <div className='zeus-analysis-tool'>
                <div className='zeus-info-message'>
                    <div className='info-icon'>ℹ️</div>
                    <h3>Insufficient Data</h3>
                    <p>Need at least 10 ticks to perform analysis. Currently have {ticks.length} ticks.</p>
                    <p>Please wait for more data to be collected...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='zeus-analysis-tool' role='main' aria-label='Matches Analysis Tool'>
            {/* Skip Link for Keyboard Users */}
            <a href='#main-content' className='skip-link'>
                Skip to main content
            </a>

            {/* Alert Notification Panel */}
            <AlertNotificationPanel alerts={alerts} onDismiss={handleDismissAlert} />

            {/* Screen Reader Live Region for Dynamic Updates */}
            <div className='sr-only' role='status' aria-live='polite' aria-atomic='true' aria-relevant='additions text'>
                {alerts.length > 0 && `New alert: ${alerts[0].message}`}
            </div>

            {/* Compact Header - One Liner */}
            <div className='zeus-compact-header' role='region' aria-label='Analysis controls' id='main-content'>
                <span className='zeus-title'>🎯 Matches</span>
                <select
                    id='market-select'
                    value={selectedMarket}
                    onChange={e => setSelectedMarket(e.target.value)}
                    aria-label='Select market'
                    className='compact-select'
                >
                    {MARKETS.map(m => (
                        <option key={m.value} value={m.value}>
                            {m.label}
                        </option>
                    ))}
                </select>
                <select
                    id='strategy-select'
                    value={predictionStrategy}
                    onChange={e => setPredictionStrategy(e.target.value as PredictionStrategy)}
                    aria-label='Select prediction strategy'
                    className='compact-select strategy-select'
                    title={STRATEGY_INFO[predictionStrategy].description}
                >
                    {(Object.keys(STRATEGY_INFO) as PredictionStrategy[]).map(strategy => (
                        <option key={strategy} value={strategy}>
                            {STRATEGY_INFO[strategy].icon} {STRATEGY_INFO[strategy].label}
                        </option>
                    ))}
                </select>
                <span
                    className={`status-dot ${
                        isConnected && connectionHealth === 'healthy'
                            ? 'connected'
                            : isReconnecting
                              ? 'reconnecting'
                              : connectionHealth === 'stale'
                                ? 'stale'
                                : 'disconnected'
                    }`}
                    title={`${syncStatus} - Health: ${connectionHealth}`}
                >
                    {isConnected && connectionHealth === 'healthy'
                        ? '🟢'
                        : isReconnecting
                          ? '🟡'
                          : connectionHealth === 'stale'
                            ? '🟠'
                            : '🔴'}
                </span>
                {currentPrice && <span className='compact-price'>{currentPrice.toFixed(2)}</span>}
                <button
                    className='compact-btn'
                    onClick={() => {
                        resetReconnectionState();
                        connectWebSocket();
                    }}
                    title={isReconnecting ? 'Reconnecting...' : 'Reconnect'}
                    disabled={isReconnecting}
                >
                    {isReconnecting ? '🔄' : '🔌'}
                </button>
                <button className='compact-btn' onClick={exportCSV} title='Export CSV'>
                    📥
                </button>
            </div>

            {/* Timed Signals Control Panel */}
            <section className='timed-signals-panel' aria-labelledby='timed-signals-heading'>
                <div className='signals-header'>
                    <h2 id='timed-signals-heading'>⏰ Timed Signals</h2>
                    <div className='signals-controls'>
                        <select
                            value={signalInterval}
                            onChange={e => setSignalInterval(Number(e.target.value))}
                            className='interval-select'
                            disabled={isSignalActive}
                        >
                            <option value={30}>30 seconds</option>
                            <option value={60}>1 minute</option>
                            <option value={120}>2 minutes</option>
                            <option value={300}>5 minutes</option>
                        </select>
                        <button
                            className={`signal-toggle-btn ${isSignalActive ? 'active' : ''}`}
                            onClick={toggleTimedSignals}
                        >
                            {isSignalActive ? '⏹️ Stop Signals' : '▶️ Start Signals'}
                        </button>
                        {isSignalActive && (
                            <div className='countdown-display'>
                                Next signal in: <span className='countdown-number'>{nextSignalCountdown}s</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Timed Signals */}
                {timedSignals.length > 0 && (
                    <div className='recent-signals'>
                        <h3>📊 Recent Signals</h3>
                        <div className='signals-grid'>
                            {timedSignals.slice(0, 5).map(signal => (
                                <div key={signal.id} className='signal-card'>
                                    <div className='signal-digit'>{signal.predictedDigit}</div>
                                    <div className='signal-confidence'>{signal.confidence}</div>
                                    <div className='signal-time'>{new Date(signal.timestamp).toLocaleTimeString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* Prediction Tracking Panel */}
            <section className='prediction-tracking-panel' aria-labelledby='prediction-tracking-heading'>
                <h2 id='prediction-tracking-heading'>🎯 Prediction Tracking</h2>

                {/* Current Prediction Being Tracked */}
                {currentTracker && (
                    <div className='current-tracker'>
                        <h3>Current Prediction</h3>
                        <div className={`tracker-card ${currentTracker.matched ? 'matched' : 'waiting'}`}>
                            <div className='tracker-digit'>{currentTracker.predictedDigit}</div>
                            <div className='tracker-info'>
                                <div className='tracker-strategy'>{currentTracker.strategy}</div>
                                <div className='tracker-confidence'>{currentTracker.confidence}</div>
                                <div className='tracker-status'>
                                    {currentTracker.matched ? (
                                        <span className='status-matched'>
                                            ✅ Matched at run #{currentTracker.matchedAtRun}
                                        </span>
                                    ) : (
                                        <span className='status-waiting'>⏳ Waiting for match...</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Prediction History */}
                {predictionTrackers.length > 0 && (
                    <div className='prediction-history'>
                        <h3>📈 Prediction History</h3>
                        <div className='history-stats'>
                            <div className='stat-card'>
                                <div className='stat-number'>{predictionTrackers.filter(p => p.matched).length}</div>
                                <div className='stat-label'>Matched</div>
                            </div>
                            <div className='stat-card'>
                                <div className='stat-number'>{predictionTrackers.length}</div>
                                <div className='stat-label'>Total</div>
                            </div>
                            <div className='stat-card'>
                                <div className='stat-number'>
                                    {predictionTrackers.length > 0
                                        ? (
                                              (predictionTrackers.filter(p => p.matched).length /
                                                  predictionTrackers.length) *
                                              100
                                          ).toFixed(1)
                                        : 0}
                                    %
                                </div>
                                <div className='stat-label'>Success Rate</div>
                            </div>
                        </div>

                        <div className='history-list'>
                            {predictionTrackers
                                .slice(-10)
                                .reverse()
                                .map((tracker, index) => (
                                    <div
                                        key={index}
                                        className={`history-item ${tracker.matched ? 'matched' : 'missed'}`}
                                    >
                                        <div className='history-digit'>{tracker.predictedDigit}</div>
                                        <div className='history-details'>
                                            <div className='history-time'>
                                                {new Date(tracker.predictionTime).toLocaleTimeString()}
                                            </div>
                                            <div className='history-result'>
                                                {tracker.matched ? (
                                                    <span className='result-matched'>
                                                        ✅ Run #{tracker.matchedAtRun}
                                                    </span>
                                                ) : (
                                                    <span className='result-missed'>❌ No match</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </section>

            {/* Digit Analysis Dashboard */}
            <section className='digit-dashboard' aria-labelledby='digit-distribution-heading'>
                <h2 id='digit-distribution-heading'>🎯 Digit Distribution</h2>
                <div className='digit-circles' role='list' aria-label='Digit frequency distribution'>
                    {sortedDigits.map((stat, idx) => {
                        const isHighest = idx === 0;
                        const isSecondHighest = idx === 1;
                        const isSecondLowest = idx === sortedDigits.length - 2;
                        const isLowest = idx === sortedDigits.length - 1;
                        const isCurrent = stat.digit === currentDigit;

                        // Temperature-based hot digit logic (>15% = hot)
                        const isHotDigit = stat.percentage > 15;

                        let ringClass = 'ring-gray';
                        let frequencyLabel = '';
                        if (isHighest) {
                            ringClass = 'ring-green';
                            frequencyLabel = 'Highest frequency';
                        } else if (isSecondHighest) {
                            ringClass = 'ring-blue';
                            frequencyLabel = 'Second highest frequency';
                        } else if (isSecondLowest) {
                            ringClass = 'ring-yellow';
                            frequencyLabel = 'Second lowest frequency';
                        } else if (isLowest) {
                            ringClass = 'ring-red';
                            frequencyLabel = 'Lowest frequency';
                        } else {
                            frequencyLabel = 'Medium frequency';
                        }

                        return (
                            <DigitCircle
                                key={stat.digit}
                                digit={stat.digit}
                                count={stat.count}
                                percentage={stat.percentage}
                                ringClass={ringClass}
                                isCurrent={isCurrent}
                                isClickable={false}
                                ariaLabel={`Digit ${stat.digit}: ${stat.percentage.toFixed(1)}% occurrence, ${stat.count} times. ${frequencyLabel}${isCurrent ? '. Current digit' : ''}`}
                                showBullseye={isHotDigit} // Only hot digits (>15%) get bullseye
                            />
                        );
                    })}
                </div>
            </section>

            {/* Analysis Sections */}
            <div className='analysis-grid' role='region' aria-label='Analysis sections'>
                {/* Over/Under */}
                <section className='analysis-card' aria-labelledby='over-under-heading'>
                    <h3 id='over-under-heading'>⬆️⬇️ Over/Under Analysis</h3>
                    <div className='digit-selector' role='group' aria-label='Select digit for over/under analysis'>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                            <button
                                key={d}
                                className={`digit-btn ${selectedOverUnder === d ? 'active' : ''}`}
                                onClick={() => setSelectedOverUnder(d)}
                                aria-label={`Select digit ${d} for over/under analysis`}
                                aria-pressed={selectedOverUnder === d}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                    <div className='progress-dual'>
                        <div className='progress-bar-over' style={{ width: `${overUnder.percentage}%` }}>
                            Over: {overUnder.percentage.toFixed(1)}%
                        </div>
                        <div className='progress-bar-under' style={{ width: `${100 - overUnder.percentage}%` }}>
                            Under: {(100 - overUnder.percentage).toFixed(1)}%
                        </div>
                    </div>
                    <div className='sequence'>
                        {overUnder.sequence.map((s, i) => (
                            <span key={i} className={`badge badge-${s === 'O' ? 'over' : 'under'}`}>
                                {s}
                            </span>
                        ))}
                    </div>
                    <p>Streak: {overUnder.streak}</p>
                </section>

                {/* Matches/Differs */}
                <section className='analysis-card' aria-labelledby='matches-differs-heading'>
                    <h3 id='matches-differs-heading'>🎯 Matches/Differs Analysis</h3>
                    <div className='digit-selector' role='group' aria-label='Select digit for matches/differs analysis'>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                            <button
                                key={d}
                                className={`digit-btn ${selectedMatches === d ? 'active' : ''}`}
                                onClick={() => setSelectedMatches(d)}
                                aria-label={`Select digit ${d} for matches/differs analysis`}
                                aria-pressed={selectedMatches === d}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                    <div className='progress-dual'>
                        <div className='progress-bar-matches' style={{ width: `${matchesDiffers.percentage}%` }}>
                            Matches: {matchesDiffers.percentage.toFixed(1)}%
                        </div>
                        <div className='progress-bar-differs' style={{ width: `${100 - matchesDiffers.percentage}%` }}>
                            Differs: {(100 - matchesDiffers.percentage).toFixed(1)}%
                        </div>
                    </div>
                    <div className='sequence'>
                        {matchesDiffers.sequence.map((s, i) => (
                            <span key={i} className={`badge badge-${s === 'M' ? 'matches' : 'differs'}`}>
                                {s}
                            </span>
                        ))}
                    </div>
                    <p>Streak: {matchesDiffers.streak}</p>
                </section>

                {/* Even/Odd */}
                <section className='analysis-card' aria-labelledby='even-odd-heading'>
                    <h3 id='even-odd-heading'>⚪⚫ Even/Odd Analysis</h3>
                    <div
                        className='progress-dual'
                        role='progressbar'
                        aria-label='Even/Odd distribution'
                        aria-valuenow={evenOdd.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuetext={`Even: ${evenOdd.percentage.toFixed(1)}%, Odd: ${(100 - evenOdd.percentage).toFixed(1)}%`}
                    >
                        <div className='progress-bar-even' style={{ width: `${evenOdd.percentage}%` }}>
                            Even: {evenOdd.percentage.toFixed(1)}%
                        </div>
                        <div className='progress-bar-odd' style={{ width: `${100 - evenOdd.percentage}%` }}>
                            Odd: {(100 - evenOdd.percentage).toFixed(1)}%
                        </div>
                    </div>
                    <div className='sequence'>
                        {evenOdd.sequence.map((s, i) => (
                            <span key={i} className={`badge badge-${s === 'E' ? 'even' : 'odd'}`}>
                                {s}
                            </span>
                        ))}
                    </div>
                    <p>Streak: {evenOdd.streak}</p>
                </section>

                {/* Rise/Fall */}
                <div className='analysis-card'>
                    <h3>📈📉 Rise/Fall Analysis</h3>
                    <div className='progress-dual'>
                        <div className='progress-bar-rise' style={{ width: `${riseFall.percentage}%` }}>
                            Rise: {riseFall.percentage.toFixed(1)}%
                        </div>
                        <div className='progress-bar-fall' style={{ width: `${100 - riseFall.percentage}%` }}>
                            Fall: {(100 - riseFall.percentage).toFixed(1)}%
                        </div>
                    </div>
                    <div className='sequence'>
                        {riseFall.sequence.map((s, i) => (
                            <span key={i} className={`badge badge-${s === 'R' ? 'rise' : 'fall'}`}>
                                {s}
                            </span>
                        ))}
                    </div>
                    <p>Streak: {riseFall.streak}</p>
                </div>
            </div>

            {/* AI Prediction */}
            <div className='prediction-card'>
                <h2>🤖 AI Next Digit Prediction</h2>
                <div className='prediction-content'>
                    <div className={`prediction-badge confidence-${prediction.confidence.toLowerCase()}`}>
                        <div className='predicted-digit'>{prediction.digit}</div>
                        <div className='confidence-level'>{prediction.confidence}</div>
                    </div>
                    <div className='prediction-reason'>
                        <p>{prediction.reason}</p>
                    </div>
                </div>
                <button className='free-bots-btn' onClick={openFreeBots} title='Open Free Bots section'>
                    🤖 Get MatchesMaster Bot
                </button>
            </div>

            {/* Probability Predictions */}
            <ProbabilityPredictionCard predictions={getTopN(ticks, 5)} market={selectedMarket} />

            {/* Recent Ticks List */}
            <RecentTicksList ticks={ticks} maxDisplay={10} />

            {/* Time-Based Analysis */}
            <div className='time-analysis-card'>
                <h2>⏱️ Time-Based Analysis</h2>
                <div className='time-controls'>
                    <button className={`time-btn ${timeRange === 10 ? 'active' : ''}`} onClick={() => setTimeRange(10)}>
                        Last 10
                    </button>
                    <button className={`time-btn ${timeRange === 50 ? 'active' : ''}`} onClick={() => setTimeRange(50)}>
                        Last 50
                    </button>
                    <button
                        className={`time-btn ${timeRange === 100 ? 'active' : ''}`}
                        onClick={() => setTimeRange(100)}
                    >
                        Last 100
                    </button>
                </div>
                <div className='time-grid'>
                    {Object.entries(timeBased).map(([digit, count]) => (
                        <div key={digit} className='time-card'>
                            <div className='time-digit'>{digit}</div>
                            <div className='time-count'>{count}</div>
                            <div className='time-percentage'>{((count / timeRange) * 100).toFixed(1)}%</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trend Indicators */}
            {Object.keys(trends).length > 0 && (
                <div className='trend-card'>
                    <h2>📊 Digit Trend Indicators (First 25 vs Last 25)</h2>
                    <div className='trend-grid'>
                        {Object.entries(trends).map(([digit, trend]) => (
                            <div
                                key={digit}
                                className={`trend-item ${trend.change > 5 ? 'rising' : trend.change < -5 ? 'falling' : 'stable'}`}
                            >
                                <div className='trend-digit'>{digit}</div>
                                <div className='trend-direction'>{trend.direction}</div>
                                <div className='trend-change'>{trend.change.toFixed(1)}%</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

