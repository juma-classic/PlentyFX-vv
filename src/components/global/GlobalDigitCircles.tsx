import React, { useEffect, useState, useRef, useCallback } from 'react';
import { derivConnectionPool, ConnectionType } from '@/services/deriv-connection-pool.service';
import { tickDataValidator } from '@/utils/tick-data-validator';
import { unifiedTickData } from '@/services/unified-tick-data.service';
import { derivAPIInitializer } from '@/services/deriv-api-initializer.service';
import './GlobalDigitCircles.scss';

interface DigitData {
    digit: number;
    count: number;
    percentage: number;
    lastSeen: number;
}

// Removed unused Position interface

const STORAGE_KEY = 'global-digit-circles-settings';

const DEFAULT_SETTINGS = {
    isVisible: true,
    isCollapsed: false,
    position: { x: window.innerWidth - 320, y: 60 }, // Moved 40% higher (100px - 40px = 60px)
    symbol: 'R_100',
    maxTicks: 1000, // Default to 1000 ticks for comprehensive analysis
};

// Organized market categories for better selection
const MARKET_CATEGORIES = {
    'Volatility Indices': [
        { value: 'R_10', label: 'Volatility 10 Index', description: 'Simulates a market with 10% volatility' },
        { value: 'R_25', label: 'Volatility 25 Index', description: 'Simulates a market with 25% volatility' },
        { value: 'R_50', label: 'Volatility 50 Index', description: 'Simulates a market with 50% volatility' },
        { value: 'R_75', label: 'Volatility 75 Index', description: 'Simulates a market with 75% volatility' },
        { value: 'R_100', label: 'Volatility 100 Index', description: 'Simulates a market with 100% volatility' },
    ],
    '1-Second Volatility': [
        { value: '1HZ10V', label: '1-Second Volatility 10', description: '1-second ticks, 10% volatility' },
        { value: '1HZ25V', label: '1-Second Volatility 25', description: '1-second ticks, 25% volatility' },
        { value: '1HZ50V', label: '1-Second Volatility 50', description: '1-second ticks, 50% volatility' },
        { value: '1HZ75V', label: '1-Second Volatility 75', description: '1-second ticks, 75% volatility' },
        { value: '1HZ100V', label: '1-Second Volatility 100', description: '1-second ticks, 100% volatility' },
    ],
    'Crash/Boom Indices': [
        { value: 'BOOM1000', label: 'Boom 1000 Index', description: 'Spikes approximately every 1000 ticks' },
        { value: 'BOOM500', label: 'Boom 500 Index', description: 'Spikes approximately every 500 ticks' },
        { value: 'CRASH1000', label: 'Crash 1000 Index', description: 'Drops approximately every 1000 ticks' },
        { value: 'CRASH500', label: 'Crash 500 Index', description: 'Drops approximately every 500 ticks' },
    ],
    'Jump Indices': [
        { value: 'JD10', label: 'Jump 10 Index', description: 'Jumps approximately every 10 ticks' },
        { value: 'JD25', label: 'Jump 25 Index', description: 'Jumps approximately every 25 ticks' },
        { value: 'JD50', label: 'Jump 50 Index', description: 'Jumps approximately every 50 ticks' },
        { value: 'JD75', label: 'Jump 75 Index', description: 'Jumps approximately every 75 ticks' },
        { value: 'JD100', label: 'Jump 100 Index', description: 'Jumps approximately every 100 ticks' },
    ],
    'Step Indices': [
        { value: 'STPIDX', label: 'Step Index', description: 'Changes in steps' },
        { value: 'WLDIDX', label: 'World Index', description: 'Global market simulation' },
    ],
};

// Flatten for easy access
const AVAILABLE_SYMBOLS = Object.values(MARKET_CATEGORIES).flat();

export const GlobalDigitCircles: React.FC = () => {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [digitData, setDigitData] = useState<DigitData[]>([]);
    const [currentTick, setCurrentTick] = useState<number | null>(null);
    const [tickHistory, setTickHistory] = useState<number[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    // Removed unused tickPointer state
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastTickTime, setLastTickTime] = useState<number>(0);
    const [ticksPerSecond, setTicksPerSecond] = useState<number>(0);
    const [debugMode, setDebugMode] = useState(false);
    const [validationSummary, setValidationSummary] = useState<any>(null);
    const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
    const [historicalDataLoaded, setHistoricalDataLoaded] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Load settings from localStorage
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem(STORAGE_KEY);
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                setSettings({ ...DEFAULT_SETTINGS, ...parsed });
            }
        } catch (error) {
            console.warn('Failed to load global digit circles settings:', error);
        }

        // Listen for toggle events
        const handleToggle = () => {
            try {
                const savedSettings = localStorage.getItem(STORAGE_KEY);
                if (savedSettings) {
                    const parsed = JSON.parse(savedSettings);
                    setSettings(prev => ({ ...prev, isVisible: parsed.isVisible }));
                }
            } catch (error) {
                console.warn('Failed to handle toggle event:', error);
            }
        };

        window.addEventListener('digit-circles-toggle', handleToggle);
        return () => {
            window.removeEventListener('digit-circles-toggle', handleToggle);
        };
    }, []);

    // Save settings to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save global digit circles settings:', error);
        }
    }, [settings]);

    // Initialize digit data
    useEffect(() => {
        const initialData: DigitData[] = Array.from({ length: 10 }, (_, i) => ({
            digit: i,
            count: 0,
            percentage: 0,
            lastSeen: 0,
        }));
        setDigitData(initialData);
    }, []);

    // Initialize unified tick stream
    useEffect(() => {
        if (settings.isVisible) {
            initializeUnifiedTickStream();
        } else {
            cleanup();
        }
        return () => cleanup();
    }, [settings.symbol, settings.isVisible]);

    // Animate tick pointer - visual feedback handled by CSS classes
    useEffect(() => {
        if (currentTick !== null) {
            // Visual feedback is handled by CSS classes instead of setTickPointer
            console.log(`🎯 Current tick pointer: ${currentTick}`);

            // Add visual animation class temporarily
            const digitElement = document.querySelector(`.digit-item:nth-child(${currentTick + 1})`);
            if (digitElement) {
                digitElement.classList.add('tick-animation');
                setTimeout(() => {
                    digitElement.classList.remove('tick-animation');
                }, 1000);
            }
        }
    }, [currentTick]);

    const initializeUnifiedTickStream = async () => {
        if (historicalDataLoaded) return;

        setIsLoadingHistorical(true);
        console.log(`🚀 Initializing unified tick stream for ${settings.symbol}...`);

        try {
            cleanup(); // Clean up any existing subscriptions

            // Ensure API is initialized first
            console.log('⏳ Ensuring Deriv API is ready...');
            await derivAPIInitializer.waitForReady(20000);
            console.log('✅ Deriv API confirmed ready');

            const result = await unifiedTickData.initializeTickStream(
                settings.symbol,
                1000, // Load 1000 historical ticks
                tickData => {
                    // Handle live tick data with unified format
                    const validation = tickDataValidator.validateTick(
                        { tick: { quote: tickData.quote, epoch: tickData.epoch } },
                        settings.symbol
                    );

                    // Update validation summary periodically
                    if (Math.random() < 0.1) {
                        setValidationSummary(tickDataValidator.getValidationSummary());
                    }

                    // Log validation issues in debug mode
                    if (debugMode && !validation.isValid) {
                        console.warn('🚨 Live tick validation failed:', validation.issues);
                        console.log('💡 Recommendations:', validation.recommendations);
                    }

                    const currentTime = Date.now();

                    // Calculate ticks per second
                    if (lastTickTime > 0) {
                        const timeDiff = (currentTime - lastTickTime) / 1000;
                        if (timeDiff > 0) {
                            setTicksPerSecond(prev => {
                                const newRate = 1 / timeDiff;
                                return prev === 0 ? newRate : prev * 0.9 + newRate * 0.1;
                            });
                        }
                    }
                    setLastTickTime(currentTime);

                    setCurrentTick(tickData.lastDigit);
                    updateDigitData(tickData.lastDigit);
                    updateTickHistory(tickData.lastDigit);

                    // Enhanced logging with validation status
                    const validationStatus = validation.isValid ? '✅' : '⚠️';
                    console.log(
                        `${validationStatus} Live: ${tickData.quote} → Digit: ${tickData.lastDigit} (${settings.symbol})`
                    );

                    if (debugMode) {
                        console.log('🔍 Live tick debug:', {
                            quote: tickData.quote,
                            lastDigit: tickData.lastDigit,
                            epoch: tickData.epoch,
                            validation: validation.isValid ? 'PASS' : 'FAIL',
                        });
                    }
                },
                ConnectionType.SIGNALS
            );

            if (result.success && result.historicalTicks.length > 0) {
                console.log(`✅ Loaded ${result.historicalTicks.length} historical ticks via unified service`);

                // Process historical ticks
                const historicalDigits = result.historicalTicks.map(tick => tick.lastDigit);
                setTickHistory(historicalDigits);

                // Update digit data with historical analysis
                const newDigitData = Array.from({ length: 10 }, (_, i) => ({
                    digit: i,
                    count: historicalDigits.filter(d => d === i).length,
                    percentage: 0,
                    lastSeen: Date.now(),
                }));

                // Calculate percentages
                const totalCount = newDigitData.reduce((sum, item) => sum + item.count, 0);
                newDigitData.forEach(item => {
                    item.percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
                });

                setDigitData(newDigitData);
                setHistoricalDataLoaded(true);
                setIsConnected(true);

                // Store the unsubscribe function
                unsubscribeRef.current = result.liveSubscription || (() => {});

                console.log(`📈 Unified stream complete: ${totalCount} historical + live ticks`);
                console.log(
                    '📊 Digit distribution:',
                    newDigitData.map(d => `${d.digit}: ${d.percentage.toFixed(1)}%`).join(', ')
                );
            } else {
                console.warn(`⚠️ Failed to initialize unified stream: ${result.error}`);
                setIsConnected(false);
            }
        } catch (error) {
            console.error('❌ Error initializing unified tick stream:', error);
            setIsConnected(false);

            // Show user-friendly error message
            if (error instanceof Error) {
                if (error.message.includes('timeout') || error.message.includes('API not available')) {
                    console.error(
                        '🔧 API Connection Issue: Please check your internet connection and try refreshing the page'
                    );
                } else if (error.message.includes('token') || error.message.includes('permission')) {
                    console.error('🔑 Authentication Issue: Please check your Deriv API token configuration');
                } else {
                    console.error('⚠️ Connection Error:', error.message);
                }
            }
        } finally {
            setIsLoadingHistorical(false);
        }
    };

    const updateDigitData = (digit: number) => {
        setDigitData(prevData => {
            const newData = [...prevData];
            newData[digit] = {
                ...newData[digit],
                count: newData[digit].count + 1,
                lastSeen: Date.now(),
            };

            // Recalculate percentages
            const totalCount = newData.reduce((sum, item) => sum + item.count, 0);
            newData.forEach(item => {
                item.percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
            });

            return newData;
        });
    };

    const updateTickHistory = (digit: number) => {
        setTickHistory(prev => {
            const newHistory = [...prev, digit];
            // Enforce 1000 tick maximum for comprehensive historical analysis
            const maxTicks = Math.min(1000, settings.maxTicks);
            return newHistory.slice(-maxTicks);
        });
    };

    const cleanup = () => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }
        unifiedTickData.cleanupSubscription(settings.symbol);
        setIsConnected(false);
    };

    const updateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
        setSettings(prev => ({
            ...prev,
            [key]: value,
        }));
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
            setIsDragging(true);
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                setDragOffset({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                });
            }
        }
    };

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (isDragging) {
                const newX = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x));
                const newY = Math.max(0, Math.min(window.innerHeight - 280, e.clientY - dragOffset.y));

                updateSetting('position', { x: newX, y: newY });
            }
        },
        [isDragging, dragOffset, updateSetting]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showDropdown && containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    const getDigitColor = (digit: number): string => {
        const colors = [
            '#ef4444',
            '#f97316',
            '#eab308',
            '#22c55e',
            '#06b6d4',
            '#3b82f6',
            '#8b5cf6',
            '#ec4899',
            '#f43f5e',
            '#10b981',
        ];
        return colors[digit];
    };

    const isHotDigit = (digit: number): boolean => {
        const digitInfo = digitData[digit];
        return digitInfo.percentage > 15;
    };

    const resetData = () => {
        setDigitData(
            Array.from({ length: 10 }, (_, i) => ({
                digit: i,
                count: 0,
                percentage: 0,
                lastSeen: 0,
            }))
        );
        setTickHistory([]);
        setCurrentTick(null);
        setTicksPerSecond(0);
        setLastTickTime(0);
        setHistoricalDataLoaded(false);
        console.log('🔄 Digit analysis data reset - will reinitialize unified stream');
    };

    const getCurrentMarketInfo = () => {
        const currentMarket = AVAILABLE_SYMBOLS.find(s => s.value === settings.symbol);
        return currentMarket || { value: settings.symbol, label: settings.symbol, description: 'Unknown market' };
    };

    if (!settings.isVisible) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className={`global-digit-circles grid-layout ${settings.isCollapsed ? 'global-digit-circles--collapsed' : ''} ${isDragging ? 'dragging' : ''}`}
            style={{
                left: settings.position.x,
                top: settings.position.y,
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Header */}
            <div className='global-digit-circles__header drag-handle'>
                <div className='title'>
                    <span className='icon'>🎯</span>
                    {!settings.isCollapsed && <span>Digit Analysis</span>}
                </div>
                <div className='controls'>
                    <div className='market-selector'>
                        <button
                            className='market-btn'
                            onClick={() => setShowDropdown(!showDropdown)}
                            title={`Current: ${getCurrentMarketInfo().label}`}
                        >
                            📊
                        </button>
                        {showDropdown && (
                            <div className='market-dropdown'>
                                {/* Search input */}
                                <div className='search-container'>
                                    <input
                                        type='text'
                                        placeholder='Search markets...'
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className='market-search'
                                        autoFocus
                                    />
                                </div>

                                {/* Market categories */}
                                <div className='market-categories'>
                                    {Object.entries(MARKET_CATEGORIES).map(([category, symbols]) => {
                                        const filteredSymbols = symbols.filter(
                                            symbol =>
                                                symbol.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                symbol.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                symbol.description.toLowerCase().includes(searchTerm.toLowerCase())
                                        );

                                        if (filteredSymbols.length === 0) return null;

                                        return (
                                            <div key={category} className='market-category'>
                                                <div className='category-header'>{category}</div>
                                                {filteredSymbols.map(symbol => (
                                                    <button
                                                        key={symbol.value}
                                                        className={`market-option ${settings.symbol === symbol.value ? 'active' : ''}`}
                                                        onClick={() => {
                                                            updateSetting('symbol', symbol.value);
                                                            setShowDropdown(false);
                                                            setSearchTerm('');
                                                        }}
                                                        title={symbol.description}
                                                    >
                                                        <div className='option-main'>
                                                            <span className='symbol'>{symbol.value}</span>
                                                            <span className='label'>{symbol.label}</span>
                                                        </div>
                                                        <div className='option-description'>{symbol.description}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    {!settings.isCollapsed && (
                        <>
                            <button
                                className={`debug-btn ${debugMode ? 'active' : ''}`}
                                onClick={() => setDebugMode(!debugMode)}
                                title={debugMode ? 'Disable debug mode' : 'Enable debug mode'}
                            >
                                🐛
                            </button>
                            <button
                                className='reload-historical-btn'
                                onClick={async () => {
                                    setHistoricalDataLoaded(false);
                                    await initializeUnifiedTickStream();
                                }}
                                disabled={isLoadingHistorical}
                                title='Reload unified tick stream (1000 historical + live)'
                            >
                                {isLoadingHistorical ? '⏳' : '📊'}
                            </button>
                            <button className='reset-btn' onClick={resetData} title='Reset all data'>
                                🔄
                            </button>
                        </>
                    )}
                    <button
                        className='collapse-btn'
                        onClick={() => updateSetting('isCollapsed', !settings.isCollapsed)}
                        title={settings.isCollapsed ? 'Expand digit analysis' : 'Collapse digit analysis'}
                    >
                        {settings.isCollapsed ? '🔍' : '📊'}
                    </button>
                    <button
                        className='hide-btn'
                        onClick={() => updateSetting('isVisible', false)}
                        title='Hide digit analysis'
                    >
                        ✕
                    </button>
                    <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
                        <span className='dot'></span>
                        {!settings.isCollapsed && <span>{isConnected ? 'LIVE' : 'OFF'}</span>}
                    </div>
                </div>
            </div>

            {/* Collapsible Content */}
            {!settings.isCollapsed && (
                <>
                    {/* Grid Display */}
                    <div className='global-digit-circles__display'>
                        <div className='digit-grid'>
                            {digitData.map((data, index) => (
                                <div
                                    key={index}
                                    className={`digit-item ${isHotDigit(index) ? 'hot' : ''} ${currentTick === index ? 'current' : ''}`}
                                    style={{
                                        borderColor: getDigitColor(index),
                                        backgroundColor:
                                            currentTick === index ? getDigitColor(index) + '20' : 'transparent',
                                    }}
                                >
                                    <div className='digit-circle' style={{ borderColor: getDigitColor(index) }}>
                                        <span className='digit-number'>{index}</span>
                                        {currentTick === index && <div className='current-indicator'>▼</div>}
                                    </div>
                                    <div className='digit-percentage' style={{ color: getDigitColor(index) }}>
                                        {data.percentage.toFixed(1)}%
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Current tick display */}
                        <div className='current-tick-display'>
                            <div className='current-tick-info'>
                                <span className='label'>Last Digit:</span>
                                <span
                                    className='value'
                                    style={{ color: currentTick !== null ? getDigitColor(currentTick) : '#8b92a7' }}
                                >
                                    {currentTick ?? '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Stats */}
                    <div className='global-digit-circles__stats'>
                        <div className='stat'>
                            <span className='label'>Market:</span>
                            <span className='value'>{settings.symbol}</span>
                        </div>
                        <div className='stat'>
                            <span className='label'>Ticks:</span>
                            <span className='value'>
                                {isLoadingHistorical ? 'Loading...' : `${tickHistory.length}/${settings.maxTicks}`}
                                {historicalDataLoaded && !isLoadingHistorical && (
                                    <span className='historical-indicator'>📊</span>
                                )}
                            </span>
                        </div>
                        <div className='stat'>
                            <span className='label'>Rate:</span>
                            <span className='value'>{ticksPerSecond.toFixed(1)}/s</span>
                        </div>
                        <div className='stat'>
                            <span className='label'>Hot Digits:</span>
                            <span className='value'>{digitData.filter(d => d.percentage > 15).length}</span>
                        </div>
                        {validationSummary && (
                            <div className='stat'>
                                <span className='label'>Data Quality:</span>
                                <span
                                    className={`value ${validationSummary.validTicks === validationSummary.totalTicks ? 'valid' : 'invalid'}`}
                                >
                                    {validationSummary.totalTicks > 0
                                        ? `${Math.round((validationSummary.validTicks / validationSummary.totalTicks) * 100)}%`
                                        : 'N/A'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Debug Information */}
                    {debugMode && validationSummary && (
                        <div className='global-digit-circles__debug'>
                            <div className='debug-header'>🐛 Debug Information</div>
                            <div className='debug-stats'>
                                <div className='debug-stat'>
                                    <span>Valid Ticks:</span>
                                    <span>
                                        {validationSummary.validTicks}/{validationSummary.totalTicks}
                                    </span>
                                </div>
                                {validationSummary.commonIssues.length > 0 && (
                                    <div className='debug-issues'>
                                        <div className='issues-header'>Common Issues:</div>
                                        {validationSummary.commonIssues
                                            .slice(0, 3)
                                            .map((issue: string, index: number) => (
                                                <div key={index} className='issue-item'>
                                                    {issue}
                                                </div>
                                            ))}
                                    </div>
                                )}
                                <div className='debug-buttons'>
                                    <button
                                        className='debug-report-btn'
                                        onClick={() => {
                                            const report = tickDataValidator.generateDiagnosticReport();
                                            console.log(report);
                                            alert('Diagnostic report generated in console');
                                        }}
                                    >
                                        Validation Report
                                    </button>
                                    <button
                                        className='debug-test-btn'
                                        onClick={async () => {
                                            const { webSocketDiagnostic } = await import(
                                                '@/utils/websocket-diagnostic'
                                            );
                                            console.log('🔍 Running WebSocket diagnostic...');
                                            const results = await webSocketDiagnostic.testDirectConnection(
                                                derivConnectionPool.getAppId(ConnectionType.SIGNALS),
                                                settings.symbol
                                            );
                                            const report = webSocketDiagnostic.generateReport();
                                            console.log(report);
                                            alert(
                                                `WebSocket test complete! Check console for detailed report.\n\nQuick Summary: ${results.filter(r => r.success).length}/${results.length} operations successful`
                                            );
                                        }}
                                    >
                                        Test WebSocket
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Collapsed Mini Display */}
            {settings.isCollapsed && (
                <div className='global-digit-circles__mini'>
                    <div className='mini-display'>
                        <div className='current-digit'>
                            <span
                                className='digit-value'
                                style={{ color: currentTick !== null ? getDigitColor(currentTick) : '#8b92a7' }}
                            >
                                {currentTick ?? '-'}
                            </span>
                        </div>
                        <div className='mini-info'>
                            <div className='market-name'>{settings.symbol}</div>
                            <div className='tick-count'>{tickHistory.length}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
