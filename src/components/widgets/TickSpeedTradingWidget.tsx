import React, { useEffect, useRef } from 'react';
import './TickSpeedTradingWidget.scss';

interface TickSpeedTradingWidgetProps {
    className?: string;
    mode?: 'demo' | 'real';
    apiToken?: string;
    onTradeExecuted?: (trade: any) => void;
    onConnectionChange?: (connected: boolean) => void;
}

export const TickSpeedTradingWidget: React.FC<TickSpeedTradingWidgetProps> = ({
    className = '',
    mode = 'demo',
    apiToken = '',
    onTradeExecuted,
    onConnectionChange,
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;

            const { type, data } = event.data;

            switch (type) {
                case 'TRADE_EXECUTED':
                    onTradeExecuted?.(data);
                    break;
                case 'CONNECTION_CHANGED':
                    onConnectionChange?.(data.connected);
                    break;
                case 'REAL_TRADE_EXECUTED':
                    // Handle real money trades with extra logging
                    console.log('💰 REAL TRADE EXECUTED:', data);
                    onTradeExecuted?.(data);
                    break;
                case 'RISK_LIMIT_REACHED':
                    // Handle risk limit events
                    console.warn('🚫 RISK LIMIT REACHED:', data);
                    window.dispatchEvent(new CustomEvent('riskLimitReached', { detail: data }));
                    break;
                case 'EMERGENCY_STOP_ACTIVATED':
                    console.warn('🚨 EMERGENCY STOP ACTIVATED');
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onTradeExecuted, onConnectionChange]);

    // Send configuration to widget when props change
    useEffect(() => {
        if (iframeRef.current?.contentWindow) {
            const config = {
                mode,
                apiToken,
                timestamp: Date.now(),
            };

            iframeRef.current.contentWindow.postMessage(
                {
                    type: 'UPDATE_CONFIG',
                    data: config,
                },
                window.location.origin
            );
        }
    }, [mode, apiToken]);

    return (
        <div className={`tick-speed-widget-container ${className} ${mode}-mode`}>
            <iframe
                ref={iframeRef}
                src='/tick-speed-trading-widget.html'
                title='Tick Speed Trading Widget'
                className='tick-speed-iframe'
                sandbox='allow-scripts allow-same-origin'
            />

            {/* Real mode indicator */}
            {mode === 'real' && (
                <div className='real-mode-indicator'>
                    <span className='real-mode-badge'>💰 REAL MONEY MODE</span>
                    <span className='real-mode-warning'>Live trading with real funds</span>
                </div>
            )}
        </div>
    );
};
