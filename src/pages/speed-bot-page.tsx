import React, { useState } from 'react';
import { EveryDigitTradingEngine } from '../components/speed-bot/EveryDigitTradingEngine';
import { DerivAPIConnection } from '../components/speed-bot/DerivAPIConnection';
import SpeedBot from '../components/speed-bot/speed-bot';
import './speed-bot-page.scss';

const SpeedBotPage: React.FC = () => {
    const [activeEngine, setActiveEngine] = useState<'classic' | 'every-digit'>('every-digit');
    const [isEveryDigitActive, setIsEveryDigitActive] = useState(false);
    const [isAPIConnected, setIsAPIConnected] = useState(false);
    const [apiConnection, setApiConnection] = useState<WebSocket | null>(null);

    const handleEveryDigitToggle = () => {
        setIsEveryDigitActive(!isEveryDigitActive);
    };

    const handleAPIConnectionChange = (connected: boolean, wsConnection?: WebSocket) => {
        setIsAPIConnected(connected);
        setApiConnection(wsConnection || null);
    };

    return (
        <div className='speed-bot-page'>
            <div className='page-header'>
                <h1>🚀 Speed Bot Trading Center</h1>
                <p>Advanced high-frequency trading engines for maximum profit potential</p>
            </div>

            <div className='engine-selector'>
                <button
                    className={`engine-btn ${activeEngine === 'every-digit' ? 'active' : ''}`}
                    onClick={() => setActiveEngine('every-digit')}
                >
                    <span className='engine-icon'>⚡</span>
                    <span className='engine-name'>Every Digit Engine</span>
                    <span className='engine-desc'>Trades on every new digit occurrence</span>
                </button>

                <button
                    className={`engine-btn ${activeEngine === 'classic' ? 'active' : ''}`}
                    onClick={() => setActiveEngine('classic')}
                >
                    <span className='engine-icon'>🎯</span>
                    <span className='engine-name'>Classic Speed Bot</span>
                    <span className='engine-desc'>Traditional strategy-based trading</span>
                </button>
            </div>

            <div className='engine-container'>
                {activeEngine === 'every-digit' && (
                    <div className='engine-wrapper'>
                        <div className='engine-info'>
                            <h3>⚡ Every Digit Trading Engine</h3>
                            <p>
                                This advanced engine monitors every tick and automatically executes trades whenever a
                                new digit appears. It uses sophisticated martingale management and can trade on matches,
                                differs, over, or under conditions.
                            </p>
                            <div className='features'>
                                <div className='feature'>
                                    <span className='feature-icon'>🎯</span>
                                    <span>Instant digit detection</span>
                                </div>
                                <div className='feature'>
                                    <span className='feature-icon'>📈</span>
                                    <span>Smart martingale system</span>
                                </div>
                                <div className='feature'>
                                    <span className='feature-icon'>⚡</span>
                                    <span>Ultra-fast execution</span>
                                </div>
                                <div className='feature'>
                                    <span className='feature-icon'>📊</span>
                                    <span>Real-time statistics</span>
                                </div>
                            </div>
                        </div>

                        <DerivAPIConnection onConnectionChange={handleAPIConnectionChange} />

                        <EveryDigitTradingEngine
                            isActive={isEveryDigitActive}
                            onToggle={handleEveryDigitToggle}
                            isAPIConnected={isAPIConnected}
                            wsConnection={apiConnection}
                        />
                    </div>
                )}

                {activeEngine === 'classic' && (
                    <div className='engine-wrapper'>
                        <div className='engine-info'>
                            <h3>🎯 Classic Speed Bot</h3>
                            <p>
                                The original Speed Bot with manual controls and strategy selection. Perfect for traders
                                who want more control over their trading decisions and prefer to execute trades based on
                                specific strategies.
                            </p>
                            <div className='features'>
                                <div className='feature'>
                                    <span className='feature-icon'>🎮</span>
                                    <span>Manual control</span>
                                </div>
                                <div className='feature'>
                                    <span className='feature-icon'>🧠</span>
                                    <span>Strategy selection</span>
                                </div>
                                <div className='feature'>
                                    <span className='feature-icon'>📋</span>
                                    <span>Trade history</span>
                                </div>
                                <div className='feature'>
                                    <span className='feature-icon'>⚙️</span>
                                    <span>Customizable settings</span>
                                </div>
                            </div>
                        </div>

                        <SpeedBot />
                    </div>
                )}
            </div>

            <div className='page-footer'>
                <div className='warning-notice'>
                    <h4>⚠️ Risk Warning</h4>
                    <p>
                        Speed Bot trading involves high-frequency automated trading which can result in rapid losses.
                        Please ensure you understand the risks and only trade with money you can afford to lose. Always
                        test strategies with small amounts first.
                    </p>
                </div>

                <div className='tips'>
                    <h4>💡 Trading Tips</h4>
                    <ul>
                        <li>Start with small stakes to test the engine</li>
                        <li>Monitor your consecutive losses carefully</li>
                        <li>Set reasonable martingale limits</li>
                        <li>Use the reset function to clear statistics</li>
                        <li>Keep an eye on your account balance</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SpeedBotPage;
