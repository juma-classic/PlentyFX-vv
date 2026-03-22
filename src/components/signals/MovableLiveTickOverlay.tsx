/**
 * Movable Live Tick Overlay Component
 * A draggable overlay that shows live tick movement without blocking UI elements
 */

import React, { useState, useRef, useEffect } from 'react';
import { derivConnectionPool, ConnectionType } from '../../services/deriv-connection-pool.service';
import './MovableLiveTickOverlay.scss';

interface TickData {
    quote: number;
    epoch: number;
    digit: number;
    direction?: 'RISE' | 'FALL';
}

interface MovableLiveTickOverlayProps {
    market: string;
    marketLabel: string;
    isVisible: boolean;
    onClose: () => void;
}

export const MovableLiveTickOverlay: React.FC<MovableLiveTickOverlayProps> = ({
    market,
    marketLabel,
    isVisible,
    onClose,
}) => {
    const [liveTicks, setLiveTicks] = useState<TickData[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStats, setConnectionStats] = useState<any>(null);
    const [position, setPosition] = useState({ x: 20, y: 200 }); // Default position (lower on screen)
    const [isDragging, setIsDragging] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    
    const overlayRef = useRef<HTMLDivElement>(null);

    // Load saved position from localStorage
    useEffect(() => {
        const savedPosition = localStorage.getItem(`liveTickOverlay_${market}_position`);
        if (savedPosition) {
            setPosition(JSON.parse(savedPosition));
        }
    }, [market]);

    // Save position to localStorage
    const savePosition = (newPosition: { x: number; y: number }) => {
        localStorage.setItem(`liveTickOverlay_${market}_position`, JSON.stringify(newPosition));
    };

    // Live tick subscription
    useEffect(() => {
        if (!isVisible) return;

        let unsubscribe: (() => void) | undefined;
        const statsInterval = setInterval(() => {
            const poolStats = derivConnectionPool.getConnectionStats();
            setConnectionStats(poolStats.analysis?.connectionStats || null);
        }, 1000);

        const subscribeToTicks = async () => {
            try {
                console.log(`🔄 Subscribing to ${market} ticks for movable overlay...`);

                const unsub = await derivConnectionPool.subscribeToTicks(market, (tickData: any) => {
                    if (tickData?.tick?.quote && tickData?.tick?.epoch) {
                        const newTick: TickData = {
                            quote: tickData.tick.quote,
                            epoch: tickData.tick.epoch,
                            digit: Math.floor((tickData.tick.quote * 100) % 10),
                        };

                        setLiveTicks(prevTicks => {
                            const updatedTicks = [...prevTicks, newTick];

                            // Add direction based on previous tick
                            if (updatedTicks.length > 1) {
                                const current = updatedTicks[updatedTicks.length - 1];
                                const previous = updatedTicks[updatedTicks.length - 2];
                                if (current && previous) {
                                    current.direction = current.quote > previous.quote ? 'RISE' : 'FALL';
                                }
                            }

                            // Keep only the last 15 ticks for performance
                            return updatedTicks.slice(-15);
                        });
                    }
                });

                unsubscribe = unsub;
                console.log(`✅ Successfully subscribed to ${market} for movable overlay`);
            } catch (error) {
                console.error(`❌ Failed to subscribe to ${market} for movable overlay:`, error);
            }
        };

        // Monitor connection status
        const analysisConnection = derivConnectionPool.getConnection(ConnectionType.ANALYSIS);
        const connectionUnsubscribe = analysisConnection.onConnectionChange(connected => {
            setIsConnected(connected);
            if (connected) {
                subscribeToTicks();
            } else {
                setLiveTicks([]);
            }
        });

        // Initial subscription attempt
        if (analysisConnection.isConnectionActive()) {
            subscribeToTicks();
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
            connectionUnsubscribe();
            clearInterval(statsInterval);
        };
    }, [market, isVisible]);

    // Mouse drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
            setIsDragging(true);
            const rect = overlayRef.current?.getBoundingClientRect();
            if (rect) {
                setDragOffset({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                });
            }
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            const newPosition = {
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y,
            };
            
            // Keep overlay within viewport bounds
            const maxX = window.innerWidth - 320; // Overlay width
            const maxY = window.innerHeight - 200; // Overlay height
            
            newPosition.x = Math.max(0, Math.min(newPosition.x, maxX));
            newPosition.y = Math.max(0, Math.min(newPosition.y, maxY));
            
            setPosition(newPosition);
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
            savePosition(position);
        }
    };

    // Global mouse event listeners
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragOffset, position]);

    if (!isVisible) return null;

    return (
        <div
            ref={overlayRef}
            className={`movable-live-tick-overlay ${isDragging ? 'dragging' : ''} ${isMinimized ? 'minimized' : ''}`}
            style={{
                left: position.x,
                top: position.y,
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Header with drag handle and controls */}
            <div className='overlay-header drag-handle'>
                <div className='header-left'>
                    <span className='drag-icon'>⋮⋮</span>
                    <h4>📊 {marketLabel}</h4>
                    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        <span className='status-dot'></span>
                        <span className='status-text'>
                            {isConnected ? 'Live' : 'Reconnecting...'}
                            {connectionStats && connectionStats.retryCount > 0 && ` (${connectionStats.retryCount})`}
                        </span>
                    </div>
                </div>
                
                <div className='header-controls'>
                    <button
                        className='minimize-btn'
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMinimized(!isMinimized);
                        }}
                        title={isMinimized ? 'Expand' : 'Minimize'}
                    >
                        {isMinimized ? '□' : '−'}
                    </button>
                    <button
                        className='close-btn'
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        title='Close'
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Content (hidden when minimized) */}
            {!isMinimized && (
                <div className='overlay-content'>
                    {liveTicks.length > 0 ? (
                        <div className='tick-movement-content'>
                            {/* Direction Row */}
                            <div className='movement-row'>
                                <span className='row-label'>Direction:</span>
                                <div className='movement-ticks'>
                                    {liveTicks.slice(-8).map((tick, index) => (
                                        <div
                                            key={`dir-${index}`}
                                            className={`movement-tick ${tick.direction?.toLowerCase() || 'neutral'}`}
                                        >
                                            {tick.direction === 'RISE' ? '↗' : tick.direction === 'FALL' ? '↘' : '—'}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Digits Row */}
                            <div className='movement-row'>
                                <span className='row-label'>Last Digit:</span>
                                <div className='movement-ticks'>
                                    {liveTicks.slice(-8).map((tick, index) => (
                                        <div
                                            key={`digit-${index}`}
                                            className={`movement-tick digit ${tick.digit % 2 === 0 ? 'even' : 'odd'}`}
                                        >
                                            {tick.digit}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Price Row */}
                            <div className='movement-row'>
                                <span className='row-label'>Price:</span>
                                <div className='movement-ticks'>
                                    {liveTicks.slice(-8).map((tick, index) => (
                                        <div
                                            key={`price-${index}`}
                                            className={`movement-tick price ${index === liveTicks.slice(-8).length - 1 ? 'latest' : ''}`}
                                            title={`${tick.quote.toFixed(5)} at ${new Date(tick.epoch * 1000).toLocaleTimeString()}`}
                                        >
                                            {tick.quote.toFixed(2)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className='tick-movement-loading'>
                            <div className='loading-spinner'></div>
                            <span>Waiting for live tick data...</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};