import React, { useState } from 'react';
import { DynamicSignalCard } from '../components/signals/DynamicSignalCard';
import './dynamic-signals-demo.scss';

interface TradeLog {
    market: string;
    type: string;
    confidence: number;
    stake: number;
    prediction: string;
    timestamp: string;
    id: number;
}

export const DynamicSignalsDemo: React.FC = () => {
    const [tradeLog, setTradeLog] = useState<TradeLog[]>([]);

    const handleTradeSignal = (signal: Omit<TradeLog, 'timestamp' | 'id'>) => {
        console.log('Trade Signal:', signal);
        setTradeLog(prev => [
            {
                ...signal,
                timestamp: new Date().toLocaleTimeString(),
                id: Date.now(),
            },
            ...prev.slice(0, 9), // Keep last 10
        ]);
    };

    return (
        <div className='dynamic-signals-demo'>
            <div className='demo-header'>
                <h1>🚀 Dynamic Live Signals</h1>
                <p className='demo-subtitle'>Real-time pattern analysis with predictive insights</p>
            </div>

            <div className='demo-features'>
                <div className='feature-badge'>✓ Pattern boxes update on each tick</div>
                <div className='feature-badge'>✓ OVER/UNDER counts update live</div>
                <div className='feature-badge'>✓ Latest box pulse animation</div>
                <div className='feature-badge'>✓ Predictive next digit highlight</div>
                <div className='feature-badge'>✓ Auto-suggest trades</div>
                <div className='feature-badge'>✓ Pattern strength meter</div>
                <div className='feature-badge'>✓ Historical comparison overlay</div>
            </div>

            <div className='demo-grid'>
                {/* OVER/UNDER Signal Card */}
                <DynamicSignalCard
                    market='R_10'
                    marketLabel='Volatility 10 Index - OVER/UNDER'
                    signalType='OVER_UNDER'
                    onTradeSignal={handleTradeSignal}
                />

                {/* EVEN/ODD Signal Card */}
                <DynamicSignalCard
                    market='R_25'
                    marketLabel='Volatility 25 Index - EVEN/ODD'
                    signalType='EVEN_ODD'
                    onTradeSignal={handleTradeSignal}
                />

                {/* RISE/FALL Signal Card */}
                <DynamicSignalCard
                    market='R_50'
                    marketLabel='Volatility 50 Index - RISE/FALL'
                    signalType='RISE_FALL'
                    onTradeSignal={handleTradeSignal}
                />
            </div>

            {/* Trade Log */}
            {tradeLog.length > 0 && (
                <div className='trade-log'>
                    <h2>📊 Trade Log</h2>
                    <div className='log-list'>
                        {tradeLog.map(trade => (
                            <div key={trade.id} className='log-item'>
                                <span className='log-time'>{trade.timestamp}</span>
                                <span className='log-market'>{trade.market}</span>
                                <span className={`log-type ${trade.type.toLowerCase()}`}>{trade.type}</span>
                                <span className='log-confidence'>{trade.confidence}%</span>
                                <span className='log-stake'>${trade.stake}</span>
                                <span className='log-prediction'>{trade.prediction}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
