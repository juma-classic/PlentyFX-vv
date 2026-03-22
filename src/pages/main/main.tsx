import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import AnalysisTool from '@/components/analysis-tool/AnalysisTool';
import ChunkLoader from '@/components/loader/chunk-loader';
import DesktopWrapper from '@/components/shared_ui/desktop-wrapper';
import Dialog from '@/components/shared_ui/dialog';
import MobileWrapper from '@/components/shared_ui/mobile-wrapper';
import Tabs from '@/components/shared_ui/tabs/tabs';
import { ProtectedSignalsCenter } from '@/components/signals/ProtectedSignalsCenter';
import { AutoBotLoaderPanel } from '@/components/signals/AutoBotLoaderPanel';
import TradingViewModal from '@/components/trading-view-chart/trading-view-modal';
import { DBOT_TABS } from '@/constants/bot-contents';
import { api_base, updateWorkspaceName } from '@/external/bot-skeleton';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { Localize, localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import { BotLoadingErrorHandler, withBotLoadingErrorHandling } from '@/utils/bot-loading-error-handler';
import { isPremiumUser } from '@/utils/premium-check';
import RunPanel from '../../components/run-panel';
import ChartModal from '../chart/chart-modal';
import Dashboard from '../dashboard';
import RunStrategy from '../dashboard/run-strategy';

const Chart = lazy(() => import('../chart'));
const Tutorial = lazy(() => import('../tutorials'));

// TrackTool Components
import SignalsScanner from '@/components/tracktool/SignalsScanner';
import MarketAnalyzer from '@/components/tracktool/MarketAnalyzer';
import TradingCalculator from '@/components/tracktool/TradingCalculator';

// More Options Dropdown
import { MoreOptionsDropdown } from '@/components/navigation/MoreOptionsDropdown';

// DCircles Component
import { DCircles } from '@/components/dcircles/DCircles';

// DTrader Component
import DTraderIframe from '@/components/dtrader/DTraderIframe';

// Strategy Orchestrator
import StrategyOrchestrator from '@/pages/strategy-orchestrator/StrategyOrchestrator';

// Copy Trading Component
import { CopyTrader } from '@/components/copy-trading';

// CopyCat Page
import CopyCatPage from '@/pages/copycat/CopyCatPage';

// Quick Strategy Component
import QuickStrategy from '@/components/quick-strategy/QuickStrategy';

const DashboardIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' fill='currentColor' />
        <path d='M4 4h6v8H4V4zm10 0h6v4h-6V4zM4 15h6v4H4v-4zm10-3h6v8h-6v-8z' fill='currentColor' opacity='0.6' />
        <circle cx='7' cy='8' r='1.5' fill='#ffd700' />
        <circle cx='17' cy='6' r='1.5' fill='#ffd700' />
        <circle cx='7' cy='17' r='1.5' fill='#ffd700' />
        <circle cx='17' cy='15' r='1.5' fill='#ffd700' />
    </svg>
);

const BotBuilderIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        {/* Main robot head/body */}
        <rect
            x='8'
            y='6'
            width='8'
            height='9'
            rx='1.5'
            stroke='currentColor'
            strokeWidth='1.5'
            fill='none'
            opacity='0.9'
        />

        {/* Master builder helmet/crown */}
        <path
            d='M7 6 L8 4 L10 3 L12 2.5 L14 3 L16 4 L17 6'
            stroke='#FFD700'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            fill='none'
        />

        {/* Central gear - large (animated) */}
        <g className='bot-builder-gear-main'>
            <circle cx='12' cy='10' r='2.5' stroke='currentColor' strokeWidth='1.2' fill='none' />
            <circle cx='12' cy='10' r='1' fill='#FFD700' />
            {/* Gear teeth */}
            <line x1='12' y1='7.5' x2='12' y2='6.5' stroke='currentColor' strokeWidth='1' />
            <line x1='12' y1='12.5' x2='12' y2='13.5' stroke='currentColor' strokeWidth='1' />
            <line x1='14.5' y1='10' x2='15.5' y2='10' stroke='currentColor' strokeWidth='1' />
            <line x1='9.5' y1='10' x2='8.5' y2='10' stroke='currentColor' strokeWidth='1' />
            <line x1='13.8' y1='8.2' x2='14.5' y2='7.5' stroke='currentColor' strokeWidth='1' />
            <line x1='10.2' y1='11.8' x2='9.5' y2='12.5' stroke='currentColor' strokeWidth='1' />
            <line x1='13.8' y1='11.8' x2='14.5' y2='12.5' stroke='currentColor' strokeWidth='1' />
            <line x1='10.2' y1='8.2' x2='9.5' y2='7.5' stroke='currentColor' strokeWidth='1' />
        </g>

        {/* Small gear left (animated reverse) */}
        <g className='bot-builder-gear-left'>
            <circle cx='9' cy='13' r='1.2' stroke='currentColor' strokeWidth='0.8' fill='none' />
            <circle cx='9' cy='13' r='0.4' fill='#FFD700' />
            <line x1='9' y1='11.8' x2='9' y2='11.2' stroke='currentColor' strokeWidth='0.6' />
            <line x1='9' y1='14.2' x2='9' y2='14.8' stroke='currentColor' strokeWidth='0.6' />
            <line x1='10.2' y1='13' x2='10.8' y2='13' stroke='currentColor' strokeWidth='0.6' />
            <line x1='7.8' y1='13' x2='7.2' y2='13' stroke='currentColor' strokeWidth='0.6' />
        </g>

        {/* Small gear right (animated reverse) */}
        <g className='bot-builder-gear-right'>
            <circle cx='15' cy='13' r='1.2' stroke='currentColor' strokeWidth='0.8' fill='none' />
            <circle cx='15' cy='13' r='0.4' fill='#FFD700' />
            <line x1='15' y1='11.8' x2='15' y2='11.2' stroke='currentColor' strokeWidth='0.6' />
            <line x1='15' y1='14.2' x2='15' y2='14.8' stroke='currentColor' strokeWidth='0.6' />
            <line x1='16.2' y1='13' x2='16.8' y2='13' stroke='currentColor' strokeWidth='0.6' />
            <line x1='13.8' y1='13' x2='13.2' y2='13' stroke='currentColor' strokeWidth='0.6' />
        </g>

        {/* Mechanical arms */}
        <path
            d='M8 11 L5 13 L4 15'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <path
            d='M16 11 L19 13 L20 15'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
        />

        {/* Arm joints */}
        <circle cx='5' cy='13' r='0.8' fill='#FFD700' />
        <circle cx='19' cy='13' r='0.8' fill='#FFD700' />

        {/* Tool/wrench in left hand */}
        <path d='M3 15 L4 16 L5 15' stroke='#FFD700' strokeWidth='1.2' strokeLinecap='round' strokeLinejoin='round' />

        {/* Hammer in right hand */}
        <rect x='19' y='15' width='2' height='1' fill='#FFD700' />
        <line x1='20' y1='16' x2='20' y2='18' stroke='currentColor' strokeWidth='1.2' />

        {/* Base/legs */}
        <path d='M10 15 L9 18 L8 20' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
        <path d='M14 15 L15 18 L16 20' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />

        {/* Feet */}
        <circle cx='8' cy='20' r='1' fill='#FFD700' />
        <circle cx='16' cy='20' r='1' fill='#FFD700' />

        {/* Master builder badge */}
        <circle cx='12' cy='5' r='1' fill='#FFD700' opacity='0.8' />

        <style>{`
            @keyframes rotateGearMain {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            @keyframes rotateGearReverse {
                from { transform: rotate(0deg); }
                to { transform: rotate(-360deg); }
            }
            .bot-builder-gear-main {
                transform-origin: 12px 10px;
                animation: rotateGearMain 4s linear infinite;
            }
            .bot-builder-gear-left {
                transform-origin: 9px 13px;
                animation: rotateGearReverse 3s linear infinite;
            }
            .bot-builder-gear-right {
                transform-origin: 15px 13px;
                animation: rotateGearReverse 3s linear infinite;
            }
        `}</style>
    </svg>
);

const QuickStrategyIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <defs>
            <style>
                {`
                    @keyframes quickPulse {
                        0%, 100% { opacity: 0.8; transform: scale(1); }
                        50% { opacity: 1; transform: scale(1.1); }
                    }
                    @keyframes strategyFlow {
                        0% { stroke-dashoffset: 20; }
                        100% { stroke-dashoffset: 0; }
                    }
                    @keyframes sparkle {
                        0%, 100% { opacity: 0.3; transform: rotate(0deg) scale(1); }
                        50% { opacity: 1; transform: rotate(180deg) scale(1.2); }
                    }
                    .quick-strategy-lightning { animation: quickPulse 1.5s ease-in-out infinite; }
                    .quick-strategy-flow { animation: strategyFlow 2s linear infinite; }
                    .quick-strategy-sparkle { animation: sparkle 2.5s ease-in-out infinite; }
                `}
            </style>
        </defs>

        {/* Lightning bolt for "Quick" */}
        <g className='quick-strategy-lightning'>
            <path
                d='M13 2L8 12h3l-1 8 5-10h-3l1-8z'
                fill='#FFD700'
                stroke='currentColor'
                strokeWidth='1'
                strokeLinejoin='round'
            />
        </g>

        {/* Strategy blocks/components */}
        <rect x='2' y='4' width='4' height='3' rx='0.5' fill='#4ECDC4' opacity='0.8' />
        <rect x='2' y='9' width='4' height='3' rx='0.5' fill='#45B7D1' opacity='0.8' />
        <rect x='2' y='14' width='4' height='3' rx='0.5' fill='#96CEB4' opacity='0.8' />

        <rect x='18' y='4' width='4' height='3' rx='0.5' fill='#FFEAA7' opacity='0.8' />
        <rect x='18' y='9' width='4' height='3' rx='0.5' fill='#DDA0DD' opacity='0.8' />
        <rect x='18' y='14' width='4' height='3' rx='0.5' fill='#98D8C8' opacity='0.8' />

        {/* Connecting flow lines */}
        <g className='quick-strategy-flow'>
            <path
                d='M6 5.5 Q10 5.5 10 8 Q10 10.5 6 10.5'
                stroke='#FFD700'
                strokeWidth='2'
                fill='none'
                strokeDasharray='4 2'
                strokeLinecap='round'
            />
            <path
                d='M6 15.5 Q10 15.5 10 13 Q10 10.5 14 10.5 Q18 10.5 18 13'
                stroke='#FFD700'
                strokeWidth='2'
                fill='none'
                strokeDasharray='4 2'
                strokeLinecap='round'
            />
        </g>

        {/* Speed indicators */}
        <g className='quick-strategy-sparkle'>
            <circle cx='4' cy='2' r='1' fill='#FFD700' opacity='0.6' />
            <circle cx='20' cy='2' r='1' fill='#FFD700' opacity='0.6' />
            <circle cx='4' cy='19' r='1' fill='#FFD700' opacity='0.6' />
            <circle cx='20' cy='19' r='1' fill='#FFD700' opacity='0.6' />
        </g>

        {/* Central "Q" for Quick */}
        <circle cx='12' cy='12' r='3' fill='var(--brand-red-coral)' opacity='0.9' />
        <text x='12' y='16' fontSize='4' fill='white' textAnchor='middle' fontWeight='bold'>
            Q
        </text>
    </svg>
);

const ChartsIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <defs>
            <style>
                {`
                    @keyframes candlePulse1 {
                        0%, 100% { opacity: 0.8; transform: scaleY(1); }
                        50% { opacity: 1; transform: scaleY(1.1); }
                    }
                    @keyframes candlePulse2 {
                        0%, 100% { opacity: 0.8; transform: scaleY(1); }
                        50% { opacity: 1; transform: scaleY(1.15); }
                    }
                    @keyframes candlePulse3 {
                        0%, 100% { opacity: 0.8; transform: scaleY(1); }
                        50% { opacity: 1; transform: scaleY(1.08); }
                    }
                    @keyframes trendGlow {
                        0%, 100% { opacity: 0.6; }
                        50% { opacity: 1; }
                    }
                    @keyframes volumePulse {
                        0%, 100% { opacity: 0.5; transform: scaleY(1); }
                        50% { opacity: 0.8; transform: scaleY(1.2); }
                    }
                    .candle1 { animation: candlePulse1 2s ease-in-out infinite; transform-origin: center; }
                    .candle2 { animation: candlePulse2 2.3s ease-in-out infinite 0.3s; transform-origin: center; }
                    .candle3 { animation: candlePulse3 2.1s ease-in-out infinite 0.6s; transform-origin: center; }
                    .candle4 { animation: candlePulse1 2.4s ease-in-out infinite 0.9s; transform-origin: center; }
                    .candle5 { animation: candlePulse2 2.2s ease-in-out infinite 1.2s; transform-origin: center; }
                    .trend-line { animation: trendGlow 3s ease-in-out infinite; }
                    .volume-bar { animation: volumePulse 2s ease-in-out infinite; transform-origin: bottom; }
                `}
            </style>
        </defs>

        {/* Chart axes */}
        <path d='M3 3v18h18' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' opacity='0.4' />

        {/* Candlestick 1 - Bullish (Green) */}
        <g className='candle1'>
            <line x1='5' y1='6' x2='5' y2='14' stroke='#00ff88' strokeWidth='1' />
            <rect x='4' y='8' width='2' height='4' fill='#00ff88' stroke='#00ff88' strokeWidth='0.5' />
        </g>

        {/* Candlestick 2 - Bearish (Red) */}
        <g className='candle2'>
            <line x1='8' y1='8' x2='8' y2='16' stroke='#ff4444' strokeWidth='1' />
            <rect x='7' y='10' width='2' height='5' fill='#ff4444' stroke='#ff4444' strokeWidth='0.5' />
        </g>

        {/* Candlestick 3 - Bullish (Green) */}
        <g className='candle3'>
            <line x1='11' y1='9' x2='11' y2='15' stroke='#00ff88' strokeWidth='1' />
            <rect x='10' y='10' width='2' height='3' fill='#00ff88' stroke='#00ff88' strokeWidth='0.5' />
        </g>

        {/* Candlestick 4 - Bullish (Green) */}
        <g className='candle4'>
            <line x1='14' y1='5' x2='14' y2='12' stroke='#00ff88' strokeWidth='1' />
            <rect x='13' y='6' width='2' height='4' fill='#00ff88' stroke='#00ff88' strokeWidth='0.5' />
        </g>

        {/* Candlestick 5 - Bearish (Red) */}
        <g className='candle5'>
            <line x1='17' y1='7' x2='17' y2='13' stroke='#ff4444' strokeWidth='1' />
            <rect x='16' y='8' width='2' height='3' fill='#ff4444' stroke='#ff4444' strokeWidth='0.5' />
        </g>

        {/* Trend line weaving through candles */}
        <path
            className='trend-line'
            d='M4 12 L7 14 L10 11 L13 9 L16 10 L19 7'
            stroke='#ffd700'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            fill='none'
        />

        {/* Volume bars at bottom */}
        <g className='volume-bar'>
            <rect x='4' y='19' width='1.5' height='2' fill='#00bcd4' opacity='0.6' />
            <rect x='7' y='18' width='1.5' height='3' fill='#00bcd4' opacity='0.6' />
            <rect x='10' y='19.5' width='1.5' height='1.5' fill='#00bcd4' opacity='0.6' />
            <rect x='13' y='17' width='1.5' height='4' fill='#00bcd4' opacity='0.6' />
            <rect x='16' y='18.5' width='1.5' height='2.5' fill='#00bcd4' opacity='0.6' />
        </g>
    </svg>
);

const TutorialsIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect x='3' y='4' width='18' height='16' rx='2' stroke='currentColor' strokeWidth='2' fill='none' />
        <path d='M10 9l6 3-6 3V9z' fill='#ffd700' />
        <circle cx='10' cy='9' r='1' fill='currentColor' opacity='0.6' />
        <circle cx='16' cy='12' r='1' fill='currentColor' opacity='0.6' />
        <circle cx='10' cy='15' r='1' fill='currentColor' opacity='0.6' />
        <path d='M3 7h18M7 4v3M17 4v3' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' opacity='0.5' />
    </svg>
);

const AnalysisToolIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect x='5' y='7' width='4' height='10' rx='1' stroke='currentColor' strokeWidth='2' fill='none' />
        <rect x='11' y='4' width='4' height='13' rx='1' stroke='currentColor' strokeWidth='2' fill='none' />
        <rect x='17' y='9' width='4' height='8' rx='1' stroke='currentColor' strokeWidth='2' fill='none' />
        <path d='M7 3v4M13 2v2M19 7v2' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' opacity='0.5' />
        <path d='M7 17v2M13 17v2M19 17v2' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' opacity='0.5' />
        <circle cx='7' cy='12' r='1.5' fill='#ffd700' />
        <circle cx='13' cy='10' r='1.5' fill='#ffd700' />
        <circle cx='19' cy='13' r='1.5' fill='#ffd700' />
    </svg>
);

const SignalsIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M4 4l4 4-4 4' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <path
            d='M4 16l4 4-4 4'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            opacity='0.5'
        />
        <rect x='10' y='5' width='10' height='3' rx='1' fill='#ffd700' />
        <rect x='10' y='11' width='7' height='3' rx='1' fill='currentColor' opacity='0.6' />
        <rect x='10' y='17' width='10' height='3' rx='1' fill='#ffd700' />
        <circle cx='20' cy='6.5' r='1.5' fill='currentColor' />
        <circle cx='20' cy='18.5' r='1.5' fill='currentColor' />
    </svg>
);

const FreeBotsIcon = () => (
    <svg
        fill='var(--text-general)'
        width='20px'
        height='20px'
        viewBox='0 0 24 24'
        xmlns='http://www.w3.org/2000/svg'
        data-name='Layer 1'
    >
        <path d='M10,13H4a1,1,0,0,0-1,1v6a1,1,0,0,0,1,1h6a1,1,0,0,0,1-1V14A1,1,0,0,0,10,13ZM9,19H5V15H9ZM20,3H14a1,1,0,0,0-1,1v6a1,1,0,0,0,1,1h6a1,1,0,0,0,1-1V4A1,1,0,0,0,20,3ZM19,9H15V5h4Zm1,7H18V14a1,1,0,0,0-2,0v2H14a1,1,0,0,0,0,2h2v2a1,1,0,0,0,2,0V18h2a1,1,0,0,0,0-2ZM10,3H4A1,1,0,0,0,3,4v6a1,1,0,0,0,1,1h6a1,1,0,0,0,1-1V4A1,1,0,0,0,10,3ZM9,9H5V5H9Z' />
    </svg>
);

const PremiumBotsIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        {/* Crown base */}
        <path d='M4 20h16v-2H4v2z' fill='#ffd700' />
        {/* Crown body */}
        <path d='M20 8l-4 4-4-6-4 6-4-4v8h16V8z' fill='#ffd700' opacity='0.9' />
        {/* Crown points */}
        <circle cx='4' cy='8' r='1.5' fill='#ffd700' />
        <circle cx='12' cy='2' r='1.5' fill='#ffd700' />
        <circle cx='20' cy='8' r='1.5' fill='#ffd700' />
        <circle cx='8' cy='12' r='1.5' fill='#ffd700' />
        <circle cx='16' cy='12' r='1.5' fill='#ffd700' />
        {/* Jewels */}
        <circle cx='12' cy='14' r='1' fill='#ff0000' opacity='0.8' />
        <circle cx='9' cy='16' r='0.8' fill='#00ff00' opacity='0.8' />
        <circle cx='15' cy='16' r='0.8' fill='#0000ff' opacity='0.8' />
    </svg>
);

const StrategyOrchestratorIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        {/* Conductor's baton */}
        <path d='M4 20L20 4' stroke='#00BFFF' strokeWidth='2' strokeLinecap='round' />
        <circle cx='20' cy='4' r='2' fill='#00BFFF' />

        {/* Musical notes representing strategies */}
        <circle cx='8' cy='8' r='1.5' fill='#10b981' />
        <path d='M8 8V4' stroke='#10b981' strokeWidth='1.5' />

        <circle cx='12' cy='12' r='1.5' fill='#8b5cf6' />
        <path d='M12 12V8' stroke='#8b5cf6' strokeWidth='1.5' />

        <circle cx='16' cy='16' r='1.5' fill='#f59e0b' />
        <path d='M16 16V12' stroke='#f59e0b' strokeWidth='1.5' />

        {/* Connection lines showing orchestration */}
        <path d='M8 8L12 12L16 16' stroke='#00BFFF' strokeWidth='1' strokeDasharray='2 2' opacity='0.5' />
    </svg>
);

const TrackSignalsIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        {/* Radar/Scanner circle */}
        <circle cx='12' cy='12' r='9' stroke='#00ff00' strokeWidth='1.5' fill='none' opacity='0.3' />
        <circle cx='12' cy='12' r='6' stroke='#00ff00' strokeWidth='1.5' fill='none' opacity='0.5' />
        <circle cx='12' cy='12' r='3' stroke='#00ff00' strokeWidth='2' fill='none' opacity='0.8' />

        {/* Scanning beam */}
        <path d='M12 12L20 8' stroke='#00ff00' strokeWidth='2' strokeLinecap='round' opacity='0.9' />

        {/* Signal dots */}
        <circle cx='16' cy='8' r='1.5' fill='#00ff00' />
        <circle cx='8' cy='16' r='1.5' fill='#ffff00' />
        <circle cx='16' cy='16' r='1.5' fill='#ff0000' />

        {/* Center core */}
        <circle cx='12' cy='12' r='1.5' fill='#00ff00' />

        {/* Corner indicators */}
        <path
            d='M4 4L6 6M20 4L18 6M4 20L6 18M20 20L18 18'
            stroke='#00ff00'
            strokeWidth='1.5'
            strokeLinecap='round'
            opacity='0.6'
        />
    </svg>
);

const TrackAnalyzerIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        {/* Chart bars */}
        <rect x='4' y='14' width='3' height='6' rx='0.5' fill='#3b82f6' opacity='0.8' />
        <rect x='9' y='10' width='3' height='10' rx='0.5' fill='#10b981' opacity='0.8' />
        <rect x='14' y='6' width='3' height='14' rx='0.5' fill='#f59e0b' opacity='0.8' />
        <rect x='19' y='12' width='3' height='8' rx='0.5' fill='#ef4444' opacity='0.8' />

        {/* Trend line */}
        <path
            d='M5.5 16L10.5 12L15.5 8L20.5 14'
            stroke='#00ffff'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            opacity='0.7'
        />

        {/* Data points */}
        <circle cx='5.5' cy='16' r='1.5' fill='#00ffff' />
        <circle cx='10.5' cy='12' r='1.5' fill='#00ffff' />
        <circle cx='15.5' cy='8' r='1.5' fill='#00ffff' />
        <circle cx='20.5' cy='14' r='1.5' fill='#00ffff' />

        {/* Grid lines */}
        <path d='M3 8H22M3 12H22M3 16H22' stroke='currentColor' strokeWidth='0.5' opacity='0.2' />
    </svg>
);

const TrackCalculatorIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        {/* Calculator body */}
        <rect x='5' y='3' width='14' height='18' rx='2' stroke='currentColor' strokeWidth='2' fill='none' />

        {/* Display screen */}
        <rect x='7' y='5' width='10' height='3' rx='0.5' fill='#10b981' opacity='0.8' />

        {/* Calculator buttons */}
        <circle cx='8.5' cy='11' r='1' fill='#3b82f6' opacity='0.7' />
        <circle cx='12' cy='11' r='1' fill='#3b82f6' opacity='0.7' />
        <circle cx='15.5' cy='11' r='1' fill='#3b82f6' opacity='0.7' />

        <circle cx='8.5' cy='14' r='1' fill='#3b82f6' opacity='0.7' />
        <circle cx='12' cy='14' r='1' fill='#3b82f6' opacity='0.7' />
        <circle cx='15.5' cy='14' r='1' fill='#3b82f6' opacity='0.7' />

        <circle cx='8.5' cy='17' r='1' fill='#3b82f6' opacity='0.7' />
        <circle cx='12' cy='17' r='1' fill='#3b82f6' opacity='0.7' />
        <circle cx='15.5' cy='17' r='1' fill='#f59e0b' opacity='0.9' />

        {/* Dollar sign on display */}
        <text x='12' y='7.5' fontSize='2' fill='#000' textAnchor='middle' fontWeight='bold'>
            $
        </text>

        {/* Sparkle effect */}
        <circle cx='17' cy='6' r='0.8' fill='#ffd700' opacity='0.8' />
        <circle cx='19' cy='8' r='0.6' fill='#ffd700' opacity='0.6' />
    </svg>
);

const DTraderIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        {/* Trading chart candlesticks */}
        <rect x='4' y='8' width='2' height='8' rx='0.5' fill='#10b981' opacity='0.8' />
        <rect x='9' y='6' width='2' height='10' rx='0.5' fill='#ef4444' opacity='0.8' />
        <rect x='14' y='10' width='2' height='6' rx='0.5' fill='#10b981' opacity='0.8' />
        <rect x='19' y='4' width='2' height='12' rx='0.5' fill='#10b981' opacity='0.8' />

        {/* Trend line */}
        <path
            d='M3 18L7 14L12 16L17 12L21 8'
            stroke='#FFD700'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            opacity='0.9'
        />

        {/* Data points on trend */}
        <circle cx='7' cy='14' r='1.5' fill='#FFD700' />
        <circle cx='12' cy='16' r='1.5' fill='#FFD700' />
        <circle cx='17' cy='12' r='1.5' fill='#FFD700' />
        <circle cx='21' cy='8' r='1.5' fill='#FFD700' />

        {/* Grid */}
        <path d='M2 20H22M2 15H22M2 10H22M2 5H22' stroke='currentColor' strokeWidth='0.5' opacity='0.2' />
    </svg>
);

const CopyTradingIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        {/* Two overlapping documents representing copy */}
        <rect
            x='6'
            y='4'
            width='12'
            height='14'
            rx='2'
            stroke='currentColor'
            strokeWidth='1.5'
            fill='none'
            opacity='0.4'
        />
        <rect x='8' y='6' width='12' height='14' rx='2' stroke='currentColor' strokeWidth='1.5' fill='none' />

        {/* Trading arrows */}
        <path d='M11 10L13 12L11 14' stroke='#10b981' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M17 10L15 12L17 14' stroke='#ef4444' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />

        {/* Connection dots */}
        <circle cx='13' cy='12' r='1.5' fill='#FFD700' />
        <circle cx='15' cy='12' r='1.5' fill='#FFD700' />

        {/* Copy indicator */}
        <path d='M10 16H16' stroke='#3b82f6' strokeWidth='1.5' strokeLinecap='round' opacity='0.7' />
    </svg>
);

const HacksAnalysisIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        {/* Terminal/Code background */}
        <rect
            x='2'
            y='3'
            width='20'
            height='18'
            rx='2'
            stroke='currentColor'
            strokeWidth='1.5'
            fill='none'
            opacity='0.3'
        />

        {/* Terminal prompt lines */}
        <path d='M5 7L8 10L5 13' stroke='#10b981' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M10 13H15' stroke='#10b981' strokeWidth='2' strokeLinecap='round' />

        {/* Binary code */}
        <text x='6' y='18' fontSize='3' fill='#3b82f6' fontFamily='monospace'>
            101
        </text>
        <text x='14' y='18' fontSize='3' fill='#3b82f6' fontFamily='monospace'>
            010
        </text>

        {/* Hacker symbol */}
        <circle cx='19' cy='6' r='2.5' fill='#ef4444' opacity='0.9' />
        <text x='19' y='7.5' fontSize='2.5' fill='#fff' textAnchor='middle' fontWeight='bold'>
            H
        </text>

        {/* Analysis dots */}
        <circle cx='5' cy='7' r='0.8' fill='#ffd700' />
        <circle cx='8' cy='10' r='0.8' fill='#ffd700' />
        <circle cx='5' cy='13' r='0.8' fill='#ffd700' />
    </svg>
);

const AppWrapper = observer(() => {
    const { connectionStatus } = useApiBase();
    const { dashboard, load_modal, run_panel, summary_card } = useStore();
    const { active_tab, setActiveTab } = dashboard;
    const { onEntered } = load_modal;
    const { is_dialog_open, dialog_options, onCancelButtonClick, onCloseDialog, onOkButtonClick, stopBot } = run_panel;
    const { cancel_button_text, ok_button_text, title, message } = dialog_options as { [key: string]: string };
    const { clear } = summary_card;
    const { is_drawer_open } = run_panel;
    const { is_chart_modal_visible } = dashboard;
    const { isDesktop } = useDevice();

    type BotType = {
        title: string;
        image: string;
        filePath: string;
        xmlContent: string;
    };
    const [bots, setBots] = useState<BotType[]>([]);
    const [premiumBots, setPremiumBots] = useState<BotType[]>([]);
    const [isPremium, setIsPremium] = useState(false);
    const [analysisToolUrl, setAnalysisToolUrl] = useState('ai');
    const [moreOptionsContent, setMoreOptionsContent] = useState<
        'scanner' | 'analyzer' | 'calculator' | 'copytrading' | 'hacksanalysis' | 'quickstrategy' | 'copycat' | null
    >(null);

    useEffect(() => {
        if (connectionStatus !== CONNECTION_STATUS.OPENED) {
            const is_bot_running = document.getElementById('db-animation__stop-button') !== null;
            if (is_bot_running) {
                clear();
                stopBot();
                api_base.setIsRunning(false);
            }
        }
    }, [clear, connectionStatus, stopBot]);

    useEffect(() => {
        const fetchBots = async () => {
            const botFiles = [
                'States Digit Switcher.xml',
                'Profit Pilot.xml',
                'BramEvenOdd.xml',
                'PATEL (with Entry).xml',
                'Auto differ recovery over under.xml',
                'dollar_flipper.xml',
                'UnderoverAutoswitch.xml',
                '_Over 1 under 8 Recovery Even & Odd 2026 💵💯 (5).xml',
                '$Dollar printer .xml',
                'AUTO C4 VOLT 🇬🇧 2 🇬🇧 AI PREMIUM ROBOT  (2) (1).xml',
                'Auto Zeus Bot.xml',
                'Flipping-Tool-2026 - Rich Trader (1).xml',
                'ZEUS AI PRO v1.xml',
                'Zeus Digit Switcher.xml',
                'Zeus Over.xml',
                'Over 3 Delirium by Rich Trader.xml',
                'Over-Killer by Zeus.xml',
                'Over-Pro by Zeus.xml',
                'Random LDP Differ - Rich Trader.xml',
                'Raziel Over Under.xml',
                'Speed Auto Bot🦷.xml',
                'Under 8 promax by Zeus.xml',
                'Under Killer 2026.xml',
                'Scaling Over Bot.xml',
                'Scaling Under Bot.xml',
            ];
            const botPromises = botFiles.map(async file => {
                try {
                    const response = await fetch(file);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
                    }
                    const text = await response.text();
                    const parser = new DOMParser();
                    const xml = parser.parseFromString(text, 'application/xml');
                    return {
                        title: file.split('/').pop(),
                        image: xml.getElementsByTagName('image')[0]?.textContent || 'default_image_path',
                        filePath: file,
                        xmlContent: text,
                    };
                } catch (error) {
                    console.error(error);
                    return null;
                }
            });
            const bots = (await Promise.all(botPromises)).filter(Boolean);
            setBots(bots);
        };
        fetchBots();
    }, []);

    // Check premium status and fetch premium bots
    useEffect(() => {
        const checkPremiumAndFetchBots = async () => {
            const premiumStatus = isPremiumUser();
            setIsPremium(premiumStatus);

            if (premiumStatus) {
                const premiumBotFiles = [
                    'Prime Time.xml',
                    'Tick Hunter Bot.xml',
                    'Auto Rich.xml',
                    'AlphaEdge.xml',
                    'Premium Zeus Master.xml',
                    'Premium CFX Elite.xml',
                    'Premium Martingale Pro.xml',
                    'Premium Signal Hunter.xml',
                    'Premium Profit Maximizer.xml',
                    'BOMB.xml',
                    'States digit switcher version 2💵 (1).xml',
                    'D strike 2.xml',
                    'Magic Recovery.xml',
                ];

                const premiumBotPromises = premiumBotFiles.map(async file => {
                    try {
                        const response = await fetch(file);
                        if (!response.ok) {
                            throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
                        }
                        const text = await response.text();
                        const parser = new DOMParser();
                        const xml = parser.parseFromString(text, 'application/xml');
                        return {
                            title: file.split('/').pop(),
                            image: xml.getElementsByTagName('image')[0]?.textContent || 'default_image_path',
                            filePath: file,
                            xmlContent: text,
                        };
                    } catch (error) {
                        console.error(error);
                        return null;
                    }
                });

                const premiumBotsData = (await Promise.all(premiumBotPromises)).filter(Boolean);
                setPremiumBots(premiumBotsData);
            }
        };

        checkPremiumAndFetchBots();
    }, []);

    const handleBotClick = useCallback(
        withBotLoadingErrorHandling(async bot => {
            // Validate bot object first
            const validation = BotLoadingErrorHandler.validateBotObject(bot);
            if (!validation.isValid) {
                const errorMessage = `Bot validation failed: ${validation.errors.join(', ')}`;
                console.error('❌', errorMessage);
                throw new Error(errorMessage);
            }

            console.log('🤖 Loading bot:', bot.title);

            setActiveTab(DBOT_TABS.BOT_BUILDER);

            // Validate load_modal exists and has the required method
            if (!load_modal) {
                throw new Error('load_modal is not available');
            }

            if (typeof load_modal.loadStrategyToBuilder !== 'function') {
                throw new Error('loadStrategyToBuilder is not defined on load_modal');
            }

            // Prepare strategy object with all required properties
            const strategyToLoad = {
                id: bot.filePath || `bot_${Date.now()}`, // Fallback ID if filePath is missing
                name: bot.title,
                xml: bot.xmlContent,
                save_type: 'LOCAL',
            };

            console.log('📋 Strategy to load:', {
                id: strategyToLoad.id,
                name: strategyToLoad.name,
                xmlLength: strategyToLoad.xml.length,
                save_type: strategyToLoad.save_type,
            });

            // Load the strategy with error handling
            await load_modal.loadStrategyToBuilder(strategyToLoad);

            console.log('✅ Bot loaded successfully');

            // Update workspace name if function exists
            if (typeof updateWorkspaceName === 'function') {
                updateWorkspaceName();
            } else {
                console.warn('⚠️ updateWorkspaceName function not available');
            }
        }, 'handleBotClick'),
        [setActiveTab, load_modal]
    );

    const handleOpen = useCallback(async () => {
        await load_modal.loadFileFromRecent();
        setActiveTab(DBOT_TABS.BOT_BUILDER);
    }, [load_modal, setActiveTab]);

    const toggleAnalysisTool = (url: string) => setAnalysisToolUrl(url);

    // Listen for CFX bot load events from signals
    useEffect(() => {
        const handleCFXBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signalType, market, prediction } = customEvent.detail;
            console.log('📥 Received CFX bot load request:', { botFile, signalType, market, prediction });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found bot, configuring with signal parameters...');

                // Parse and configure the XML with signal parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update contract type based on signal type
                let contractType = '';
                if (signalType === 'EVEN') {
                    contractType = 'DIGITEVEN';
                } else if (signalType === 'ODD') {
                    contractType = 'DIGITODD';
                } else if (signalType === 'RISE') {
                    contractType = 'CALL';
                } else if (signalType === 'FALL') {
                    contractType = 'PUT';
                }

                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                // Also update PURCHASE_LIST fields (in purchase blocks)
                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Update prediction digit for OVER/UNDER signals
                if (prediction !== undefined) {
                    const predictionFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                    // Find the prediction field (it's in a math_number_positive block)
                    predictionFields.forEach(field => {
                        const parent = field.parentElement;
                        if (parent && parent.getAttribute('type') === 'math_number_positive') {
                            field.textContent = prediction.toString();
                            console.log(`🎯 Prediction digit set to: ${prediction}`);
                        }
                    });
                }

                // Update stake using StakeManager (overrides XML defaults)
                const { stakeManager } = await import('@/services/stake-manager.service');
                const currentStake = stakeManager.getStake();

                const stakeFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                let stakeUpdatesCount = 0;

                stakeFields.forEach(field => {
                    // Look for stake-related NUM fields in CFX bots
                    const parentBlock = field.closest('block');
                    if (parentBlock && parentBlock.getAttribute('type') === 'math_number') {
                        // Check if this is the initial stake field by looking at the block ID
                        const blockId = parentBlock.getAttribute('id');
                        if (blockId === 'initial_stake_value') {
                            field.textContent = currentStake.toString();
                            stakeUpdatesCount++;
                            console.log(`💰 Updated initial stake to ${currentStake} (from StakeManager)`);
                        }
                    }
                });

                console.log(`💰 Total CFX stake fields updated: ${stakeUpdatesCount}`);

                // Auto-set entry point based on current market data
                // await setAutoEntryPoint(xmlDoc, market, signalType); // TODO: Implement this function

                // Serialize back to XML
                const serializer = new XMLSerializer();
                const configuredXml = serializer.serializeToString(xmlDoc);

                // Create a configured bot object
                const configuredBot = {
                    ...bot,
                    xmlContent: configuredXml,
                };

                console.log('✅ Bot configured, loading into workspace...');
                await handleBotClick(configuredBot);

                // Auto-run the bot after loading (with a small delay to ensure it's fully loaded)
                setTimeout(() => {
                    console.log('🚀 Auto-running bot after configuration...');
                    try {
                        // Trigger the run button click programmatically
                        const runButton = document.getElementById('db-animation__run-button');
                        if (runButton) {
                            runButton.click();
                            console.log('✅ Bot auto-started successfully');
                        } else {
                            console.warn('⚠️ Run button not found, trying alternative method...');
                            // Alternative method: dispatch run button event
                            const runEvent = new CustomEvent('bot.auto.run');
                            window.dispatchEvent(runEvent);
                        }
                    } catch (error) {
                        console.error('❌ Failed to auto-run bot:', error);
                    }
                }, 2000); // 2 second delay to ensure bot is fully loaded
            } else {
                console.error('❌ Bot not found:', botFile);
            }
        };

        window.addEventListener('load.cfx.bot', handleCFXBotLoad);
        return () => {
            window.removeEventListener('load.cfx.bot', handleCFXBotLoad);
        };
    }, [bots, handleBotClick]);

    // Listen for MatchesMaster bot auto-open events from Zeus Analysis
    useEffect(() => {
        const handleMatchesMasterOpen = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { predictedDigit, market } = customEvent.detail;
            console.log('📥 Received MatchesMaster auto-open request:', { predictedDigit, market });

            // Find the MatchesMaster bot in the bots array
            const matchesMasterBot = bots.find(b => b.filePath === 'MatchesMaster.xml');
            if (matchesMasterBot) {
                console.log('✅ Found MatchesMaster bot, configuring with Zeus prediction...');

                // Parse and configure the XML with Zeus parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(matchesMasterBot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update target digit in the Target Digit variable initialization
                const targetDigitFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                targetDigitFields.forEach(field => {
                    if (field.textContent === 'Target Digit') {
                        // Find the NUM field in the same block
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = predictedDigit.toString();
                                console.log(`🎯 Target digit set to: ${predictedDigit}`);
                            }
                        }
                    }
                });

                // Serialize back to XML
                const serializer = new XMLSerializer();
                const configuredXml = serializer.serializeToString(xmlDoc);

                // Create a configured bot object
                const configuredBot = {
                    ...matchesMasterBot,
                    xmlContent: configuredXml,
                    title: `MatchesMaster - Digit ${predictedDigit}`,
                };

                console.log('✅ MatchesMaster configured, loading into workspace...');
                await handleBotClick(configuredBot);
            } else {
                console.error('❌ MatchesMaster bot not found');
            }
        };

        window.addEventListener('open.matchesmaster.bot', handleMatchesMasterOpen);
        return () => {
            window.removeEventListener('open.matchesmaster.bot', handleMatchesMasterOpen);
        };
    }, [bots, handleBotClick]);

    // Listen for generic signal bot load events from Advanced Algo
    useEffect(() => {
        const handleSignalBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, botName, market, contractType, stake, prediction, signalType, confidence } =
                customEvent.detail;
            console.log('📥 Received generic signal bot load request:', {
                botFile,
                botName,
                market,
                contractType,
                stake,
                prediction,
                signalType,
                confidence,
            });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found bot, configuring with signal parameters...');

                // Parse and configure the XML with signal parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update contract type based on signal type
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                // Also update PURCHASE_LIST fields (in purchase blocks)
                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Update prediction digit for OVER/UNDER signals
                if (prediction !== undefined) {
                    const predictionFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                    // Find the prediction field (it's in a math_number_positive block)
                    predictionFields.forEach(field => {
                        const parent = field.parentElement;
                        if (parent && parent.getAttribute('type') === 'math_number_positive') {
                            field.textContent = prediction.toString();
                            console.log(`🎯 Prediction digit set to: ${prediction}`);
                        }
                    });
                }

                // Update stake using StakeManager (overrides XML defaults)
                const { stakeManager } = await import('@/services/stake-manager.service');
                const currentStake = stakeManager.getStake();

                const stakeFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                let stakeUpdatesCount = 0;

                stakeFields.forEach(field => {
                    // Look for stake-related NUM fields
                    const parentBlock = field.closest('block');
                    if (parentBlock && parentBlock.getAttribute('type') === 'math_number') {
                        // Check if this is the initial stake field by looking at the block ID
                        const blockId = parentBlock.getAttribute('id');
                        if (blockId === 'initial_stake_value' || blockId?.includes('stake')) {
                            field.textContent = currentStake.toString();
                            stakeUpdatesCount++;
                            console.log(`💰 Updated stake to ${currentStake} (from StakeManager)`);
                        }
                    }
                });

                console.log(`💰 Total stake fields updated: ${stakeUpdatesCount}`);

                // Serialize back to XML
                const serializer = new XMLSerializer();
                const configuredXml = serializer.serializeToString(xmlDoc);

                // Create a configured bot object
                const configuredBot = {
                    ...bot,
                    xmlContent: configuredXml,
                    title: `${botName} - ${signalType} (${confidence}%)`,
                };

                console.log('✅ Generic bot configured, loading into workspace...');
                await handleBotClick(configuredBot);
            } else {
                console.error('❌ Bot not found:', botFile);
            }
        };

        window.addEventListener('load.signal.bot', handleSignalBotLoad);
        return () => {
            window.removeEventListener('load.signal.bot', handleSignalBotLoad);
        };
    }, [bots, handleBotClick]);

    // Listen for enhanced CFX bot loading events from Advanced Algorithm
    useEffect(() => {
        const handleEnhancedCFXBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signal, autoLoaded } = customEvent.detail;
            console.log('🚀 Received enhanced CFX bot load request:', { botFile, signal, autoLoaded });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found CFX bot, loading directly into Bot Builder...');

                // Switch to Bot Builder tab first
                setActiveTab(DBOT_TABS.BOT_BUILDER);

                // Load the bot directly
                await handleBotClick(bot);

                console.log('✅ Enhanced CFX bot loaded successfully');

                // Auto-run the bot if autoLoaded is true
                if (autoLoaded) {
                    setTimeout(() => {
                        console.log('🚀 Auto-running enhanced CFX bot...');
                        try {
                            const runButton = document.getElementById('db-animation__run-button');
                            if (runButton) {
                                runButton.click();
                                console.log('✅ Enhanced CFX bot auto-started successfully');
                            } else {
                                console.warn('⚠️ Run button not found for enhanced CFX bot');
                            }
                        } catch (error) {
                            console.error('❌ Failed to auto-run enhanced CFX bot:', error);
                        }
                    }, 2000);
                }
            } else {
                console.error('❌ CFX Bot not found:', botFile);
            }
        };

        window.addEventListener('load.cfx.bot.enhanced', handleEnhancedCFXBotLoad);
        return () => {
            window.removeEventListener('load.cfx.bot.enhanced', handleEnhancedCFXBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for enhanced Elvis bot loading events from Advanced Algorithm
    useEffect(() => {
        const handleEnhancedElvisBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signal, autoLoaded } = customEvent.detail;
            console.log('🚀 Received enhanced Elvis bot load request:', { botFile, signal, autoLoaded });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found Elvis bot, loading directly into Bot Builder...');

                // Switch to Bot Builder tab first
                setActiveTab(DBOT_TABS.BOT_BUILDER);

                // Load the bot directly
                await handleBotClick(bot);

                console.log('✅ Enhanced Elvis bot loaded successfully');

                // Auto-run the Elvis bot if autoLoaded is true
                if (autoLoaded) {
                    setTimeout(() => {
                        console.log('🚀 Auto-running enhanced Elvis bot...');
                        try {
                            const runButton = document.getElementById('db-animation__run-button');
                            if (runButton) {
                                runButton.click();
                                console.log('✅ Enhanced Elvis bot auto-started successfully');
                            } else {
                                console.warn('⚠️ Run button not found for enhanced Elvis bot');
                            }
                        } catch (error) {
                            console.error('❌ Failed to auto-run enhanced Elvis bot:', error);
                        }
                    }, 2000);
                }
            } else {
                console.error('❌ Elvis Bot not found:', botFile);
            }
        };

        window.addEventListener('load.elvis.bot.enhanced', handleEnhancedElvisBotLoad);
        return () => {
            window.removeEventListener('load.elvis.bot.enhanced', handleEnhancedElvisBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for enhanced signal bot loading events from Advanced Algorithm
    useEffect(() => {
        const handleEnhancedSignalBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signal, autoLoaded } = customEvent.detail;
            console.log('🚀 Received enhanced signal bot load request:', { botFile, signal, autoLoaded });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found signal bot, loading directly into Bot Builder...');

                // Switch to Bot Builder tab first
                setActiveTab(DBOT_TABS.BOT_BUILDER);

                // Load the bot directly
                await handleBotClick(bot);

                console.log('✅ Enhanced signal bot loaded successfully');

                // Auto-run the signal bot if autoLoaded is true
                if (autoLoaded) {
                    setTimeout(() => {
                        console.log('🚀 Auto-running enhanced signal bot...');
                        try {
                            const runButton = document.getElementById('db-animation__run-button');
                            if (runButton) {
                                runButton.click();
                                console.log('✅ Enhanced signal bot auto-started successfully');
                            } else {
                                console.warn('⚠️ Run button not found for enhanced signal bot');
                            }
                        } catch (error) {
                            console.error('❌ Failed to auto-run enhanced signal bot:', error);
                        }
                    }, 2000);
                }
            } else {
                console.error('❌ Signal Bot not found:', botFile);
            }
        };

        window.addEventListener('load.signal.bot.enhanced', handleEnhancedSignalBotLoad);
        return () => {
            window.removeEventListener('load.signal.bot.enhanced', handleEnhancedSignalBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for generic bot file loading events (from Strategy Orchestrator, etc.)
    useEffect(() => {
        const handleBotFileLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, source, autoRun, silent } = customEvent.detail;
            console.log('[LOAD] Received bot file load request:', { botFile, source, autoRun, silent });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('[SUCCESS] Found bot, loading into Bot Builder...');

                // Only switch to Bot Builder tab if NOT in silent mode
                if (!silent) {
                    setActiveTab(DBOT_TABS.BOT_BUILDER);
                    console.log('[INFO] Switched to Bot Builder tab');
                } else {
                    console.log('[INFO] Silent mode - staying on current page');
                }

                // Load the bot directly
                await handleBotClick(bot);

                console.log('[SUCCESS] Bot loaded successfully');

                // Auto-run the bot if autoRun flag is true
                if (autoRun) {
                    setTimeout(() => {
                        console.log('[AUTORUN] Auto-running bot...');
                        try {
                            const runButton = document.getElementById('db-animation__run-button');
                            if (runButton) {
                                runButton.click();
                                console.log('[SUCCESS] Bot auto-started successfully');
                            } else {
                                console.warn('[WARN] Run button not found for auto-run');
                            }
                        } catch (error) {
                            console.error('[ERROR] Failed to auto-run bot:', error);
                        }
                    }, 1500); // Wait 1.5s for bot to fully load before clicking run
                }
            } else {
                console.error('[ERROR] Bot not found:', botFile);
                console.log(
                    '[INFO] Available bots:',
                    bots.map(b => b.filePath)
                );
            }
        };

        window.addEventListener('load.bot.file', handleBotFileLoad);
        return () => {
            window.removeEventListener('load.bot.file', handleBotFileLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for enhanced PATEL bot loading events from Advanced Algorithm
    useEffect(() => {
        const handleEnhancedPatelBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signal, autoLoaded, barrier, recoveryStrategy } = customEvent.detail;

            console.log('🎯 Received enhanced PATEL bot load request:', {
                botFile,
                signal: signal.prediction,
                barrier,
                recoveryStrategy: recoveryStrategy
                    ? {
                          predictionBeforeLoss: recoveryStrategy.predictionBeforeLoss,
                          predictionAfterLoss: recoveryStrategy.predictionAfterLoss,
                          strategy: recoveryStrategy.strategy,
                      }
                    : null,
                market: signal.market,
                confidence: signal.confidence,
                autoLoaded,
            });

            // Find the PATEL bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found PATEL bot, configuring with adaptive recovery logic...');

                // Parse and configure the XML with proper OVER/UNDER handling
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = signal.market;
                    console.log(`📊 Market set to: ${signal.market}`);
                });

                // Update contract type based on signal type
                const contractType = signal.prediction.includes('OVER') ? 'DIGITOVER' : 'DIGITUNDER';
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                // Also update PURCHASE_LIST fields (in purchase blocks)
                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Set the barrier value
                if (barrier) {
                    const barrierFields = xmlDoc.querySelectorAll('field[name="BARRIER"]');
                    barrierFields.forEach(field => {
                        field.textContent = barrier.toString();
                        console.log(`🎯 Barrier set to: ${barrier}`);
                    });
                }

                // Configure Adaptive Recovery Strategy - Prediction Before/After Loss
                if (recoveryStrategy) {
                    console.log('🧠 Configuring Adaptive Recovery Strategy...');

                    // Find and update prediction before loss
                    const variableFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                    variableFields.forEach(field => {
                        const varName = field.textContent;
                        const block = field.closest('block[type="variables_set"]');

                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');

                            if (varName === 'Prediction Before Loss' || varName === 'Initial Prediction') {
                                if (numField) {
                                    numField.textContent = recoveryStrategy.predictionBeforeLoss.toString();
                                    console.log(
                                        `🎯 Prediction Before Loss set to: ${recoveryStrategy.predictionBeforeLoss}`
                                    );
                                }
                            } else if (varName === 'Prediction After Loss' || varName === 'Recovery Prediction') {
                                if (numField) {
                                    numField.textContent = recoveryStrategy.predictionAfterLoss.toString();
                                    console.log(
                                        `🔄 Prediction After Loss set to: ${recoveryStrategy.predictionAfterLoss}`
                                    );
                                }
                            }
                        }
                    });

                    // Also look for direct prediction fields in the bot logic
                    const predictionFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                    predictionFields.forEach(field => {
                        const parentBlock = field.closest('block');
                        if (parentBlock) {
                            const blockType = parentBlock.getAttribute('type');
                            const blockId = parentBlock.getAttribute('id');

                            // Look for prediction-related blocks
                            if (blockId && (blockId.includes('prediction') || blockId.includes('digit'))) {
                                // This might be a prediction field - we'll set it to the before loss value
                                field.textContent = recoveryStrategy.predictionBeforeLoss.toString();
                                console.log(
                                    `🎯 Prediction field set to: ${recoveryStrategy.predictionBeforeLoss} (before loss)`
                                );
                            }
                        }
                    });

                    console.log(`✅ Adaptive Recovery configured:`, {
                        predictionBeforeLoss: recoveryStrategy.predictionBeforeLoss,
                        predictionAfterLoss: recoveryStrategy.predictionAfterLoss,
                        winProbBeforeLoss: `${recoveryStrategy.winProbabilities.beforeLoss}%`,
                        winProbAfterLoss: `${recoveryStrategy.winProbabilities.afterLoss}%`,
                        strategy: recoveryStrategy.strategy,
                    });
                }

                // For PATEL bot, we should NOT set hardcoded prediction digits
                // Instead, let the bot use its entry point detection logic
                console.log('ℹ️ PATEL bot will use entry point detection with adaptive recovery');

                // Update Search Number (entry point digit) if provided
                if (signal.entryDigit) {
                    const variableFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                    variableFields.forEach(field => {
                        if (field.textContent === 'Search Number') {
                            const block = field.closest('block[type="variables_set"]');
                            if (block) {
                                const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                                if (numField) {
                                    numField.textContent = signal.entryDigit.toString();
                                    console.log(`🔍 Search Number set to: ${signal.entryDigit}`);
                                }
                            }
                        }
                    });
                }

                // Serialize back to XML
                const serializer = new XMLSerializer();
                const configuredXml = serializer.serializeToString(xmlDoc);

                // Create a configured bot object
                const configuredBot = {
                    ...bot,
                    xmlContent: configuredXml,
                    title: `${bot.title} - ${signal.prediction} (${signal.confidence}%)`,
                };

                console.log('✅ PATEL bot configured with proper OVER/UNDER logic, loading into workspace...');

                // Switch to Bot Builder tab first
                setActiveTab(DBOT_TABS.BOT_BUILDER);

                // Small delay to ensure tab switch completes
                setTimeout(async () => {
                    try {
                        // Validate bot configuration before loading
                        if (!configuredBot) {
                            console.error('❌ Configured bot is undefined');
                            return;
                        }

                        if (!configuredBot.xmlContent) {
                            console.error('❌ Configured bot XML content is missing');
                            return;
                        }

                        console.log('🚀 Loading configured PATEL bot...');
                        await handleBotClick(configuredBot);
                        console.log('✅ Enhanced PATEL bot loaded successfully');
                    } catch (error) {
                        console.error('❌ Error loading enhanced PATEL bot:', error);

                        // Provide specific guidance for PATEL bot loading issues
                        console.error('💡 PATEL bot loading failed. Troubleshooting steps:');
                        console.error('   1. Check if Bot Builder tab is accessible');
                        console.error('   2. Verify PATEL bot XML file exists in public folder');
                        console.error('   3. Try loading a different bot first to test the system');
                        console.error('   4. Refresh the page and try again');

                        // Attempt recovery by switching to bot builder tab
                        try {
                            console.log('🔄 Attempting recovery by switching to Bot Builder...');
                            setActiveTab(DBOT_TABS.BOT_BUILDER);
                        } catch (recoveryError) {
                            console.error('❌ Recovery attempt failed:', recoveryError);
                        }
                    }
                }, 300);
            } else {
                console.error('❌ PATEL bot not found:', botFile);
            }
        };

        window.addEventListener('load.patel.bot.enhanced', handleEnhancedPatelBotLoad);
        return () => {
            window.removeEventListener('load.patel.bot.enhanced', handleEnhancedPatelBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for Raziel Over Under bot loading events from Zeus AI
    useEffect(() => {
        const handleRazielBotLoad = async (event: Event) => {
            let eventData;

            // Handle both CustomEvent and MessageEvent
            if (event instanceof MessageEvent) {
                // Handle postMessage from AI tool iframe
                if (event.data.type === 'LOAD_RAZIEL_BOT') {
                    eventData = event.data.data;
                } else {
                    return; // Not our message
                }
            } else {
                // Handle CustomEvent
                const customEvent = event as CustomEvent;
                eventData = customEvent.detail;
            }

            const {
                botFile,
                botName,
                market,
                contractType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
            } = eventData;

            console.log('🎯 Received Raziel Over Under bot load request:', {
                botFile,
                botName,
                market,
                contractType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
            });

            // Find the Raziel Over Under bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found Raziel Over Under bot, configuring with Zeus parameters...');

                // Parse and configure the XML with Zeus parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update contract type (TYPE_LIST and PURCHASE_LIST)
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Update prediction before loss
                const predictionBeforeLossFields = xmlDoc.querySelectorAll(
                    'block[type="variables_set"] field[name="VAR"]'
                );
                predictionBeforeLossFields.forEach(field => {
                    if (field.textContent === 'Prediction before loss') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = predictionBeforeLoss.toString();
                                console.log(`🎯 Prediction before loss set to: ${predictionBeforeLoss}`);
                            }
                        }
                    }
                });

                // Update prediction after loss
                predictionBeforeLossFields.forEach(field => {
                    if (field.textContent === 'prediction after l oss') {
                        // Note: there's a space in the XML
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = predictionAfterLoss.toString();
                                console.log(`🎯 Prediction after loss set to: ${predictionAfterLoss}`);
                            }
                        }
                    }
                });

                // Update entry point digit
                predictionBeforeLossFields.forEach(field => {
                    if (field.textContent === 'Entry Point Digit') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = entryPointDigit.toString();
                                console.log(`🎯 Entry Point Digit set to: ${entryPointDigit}`);
                            }
                        }
                    }
                });

                // Update stake using StakeManager
                const { stakeManager } = await import('@/services/stake-manager.service');
                const currentStake = stakeManager.getStake();

                const stakeFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                let stakeUpdatesCount = 0;

                stakeFields.forEach(field => {
                    const parentBlock = field.closest('block');
                    if (parentBlock && parentBlock.getAttribute('type') === 'math_number') {
                        // Look for stake-related fields
                        const prevSibling = field.parentElement?.previousElementSibling;
                        if (prevSibling && prevSibling.textContent === 'Stake') {
                            field.textContent = currentStake.toString();
                            stakeUpdatesCount++;
                            console.log(`💰 Updated stake to ${currentStake} (from StakeManager)`);
                        }
                        if (prevSibling && prevSibling.textContent === 'initalStake') {
                            field.textContent = currentStake.toString();
                            stakeUpdatesCount++;
                            console.log(`💰 Updated initial stake to ${currentStake} (from StakeManager)`);
                        }
                    }
                });

                console.log(`💰 Total Raziel stake fields updated: ${stakeUpdatesCount}`);

                // Serialize back to XML
                const serializer = new XMLSerializer();
                const configuredXml = serializer.serializeToString(xmlDoc);

                // Create a configured bot object
                const configuredBot = {
                    ...bot,
                    xmlContent: configuredXml,
                    title: `${botName} (${strategy} ${selectedDigit} | Entry: ${entryPointDigit})`,
                };

                console.log('✅ Raziel Over Under bot configured, loading into workspace...');

                // Switch to Bot Builder tab first
                setActiveTab(DBOT_TABS.BOT_BUILDER);

                // Load the bot
                await handleBotClick(configuredBot);

                // Auto-run the bot after loading (with a small delay to ensure it's fully loaded)
                setTimeout(() => {
                    console.log('🚀 Auto-running Raziel Over Under bot after configuration...');
                    try {
                        const runButton = document.getElementById('db-animation__run-button');
                        if (runButton) {
                            runButton.click();
                            console.log('✅ Raziel Over Under bot auto-started successfully');
                        } else {
                            console.warn('⚠️ Run button not found, trying alternative method...');
                        }
                    } catch (error) {
                        console.error('❌ Failed to auto-run Raziel Over Under bot:', error);
                    }
                }, 2000); // 2 second delay to ensure bot is fully loaded
            } else {
                console.error('❌ Raziel Over Under bot not found:', botFile);
            }
        };

        window.addEventListener('LOAD_RAZIEL_BOT', handleRazielBotLoad);
        window.addEventListener('message', handleRazielBotLoad);
        return () => {
            window.removeEventListener('LOAD_RAZIEL_BOT', handleRazielBotLoad);
            window.removeEventListener('message', handleRazielBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for PATEL bot loading events from Zeus AI
    useEffect(() => {
        const handlePatelBotLoad = async (event: Event) => {
            let eventData;

            // Handle both CustomEvent and MessageEvent
            if (event instanceof MessageEvent) {
                // Handle postMessage from AI tool iframe
                if (event.data.type === 'LOAD_PATEL_BOT') {
                    eventData = event.data.data;
                } else {
                    return; // Not our message
                }
            } else {
                // Handle CustomEvent
                const customEvent = event as CustomEvent;
                eventData = customEvent.detail;
            }

            const {
                botFile,
                botName,
                market,
                contractType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
            } = eventData;

            console.log('🎯 Received PATEL bot load request:', {
                botFile,
                botName,
                market,
                contractType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
            });

            // Find the PATEL bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found PATEL bot, configuring with digit parameters...');

                // Parse and configure the XML with digit parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update contract type (TYPE_LIST and PURCHASE_LIST)
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Update prediction before loss (exact variable name from PATEL bot)
                const variableFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                variableFields.forEach(field => {
                    if (field.textContent === 'prediction before loss') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = predictionBeforeLoss.toString();
                                console.log(`🎯 Prediction before loss set to: ${predictionBeforeLoss}`);
                            }
                        }
                    }
                });

                // Update prediction after loss (exact variable name from PATEL bot)
                variableFields.forEach(field => {
                    if (field.textContent === 'prediction after loss') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = predictionAfterLoss.toString();
                                console.log(`🎯 Prediction after loss set to: ${predictionAfterLoss}`);
                            }
                        }
                    }
                });

                // Update Search Number (entry point digit - exact variable name from PATEL bot)
                variableFields.forEach(field => {
                    if (field.textContent === 'Search Number') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = entryPointDigit.toString();
                                console.log(`🎯 Search Number (Entry Point) set to: ${entryPointDigit}`);
                            }
                        }
                    }
                });

                // Serialize the updated XML
                const serializer = new XMLSerializer();
                const updatedXmlContent = serializer.serializeToString(xmlDoc);

                // Update the bot object with new XML content
                const updatedBot = {
                    ...bot,
                    xmlContent: updatedXmlContent,
                    displayName: botName,
                };

                console.log('✅ PATEL bot configured, loading into workspace...');

                // Switch to Bot Builder tab first
                setActiveTab(1); // BOT_BUILDER is at index 1

                // Load the bot with a slight delay to ensure tab switch completes
                setTimeout(async () => {
                    try {
                        await handleBotClick(updatedBot);
                        console.log('✅ PATEL bot loaded successfully');
                    } catch (error) {
                        console.error('❌ Error loading PATEL bot:', error);
                    }
                }, 300);
            } else {
                console.error('❌ PATEL bot not found:', botFile);
            }
        };

        window.addEventListener('LOAD_PATEL_BOT', handlePatelBotLoad);
        window.addEventListener('message', handlePatelBotLoad);
        return () => {
            window.removeEventListener('LOAD_PATEL_BOT', handlePatelBotLoad);
            window.removeEventListener('message', handlePatelBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for MATCHES bot load events from AI Analysis Tool
    useEffect(() => {
        const handleMatchesBotLoad = async (event: Event) => {
            let eventData: any;

            // Handle both CustomEvent and MessageEvent
            if (event instanceof MessageEvent) {
                // Handle postMessage from AI tool iframe
                if (event.data.type === 'LOAD_MATCHES_BOT') {
                    eventData = event.data.data;
                } else {
                    return; // Not our message
                }
            } else {
                // Handle CustomEvent
                const customEvent = event as CustomEvent;
                eventData = customEvent.detail;
            }

            const {
                botFile,
                botName,
                market,
                contractType,
                tradeType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
                targetDigit,
            } = eventData;

            console.log('🎲 Received MATCHES bot load request:', {
                botFile,
                botName,
                market,
                contractType,
                tradeType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
                targetDigit,
            });

            // Find the MATCHES bot XML file (we'll use PATEL as template and modify it)
            const templateBot = bots.find(b => b.filePath === 'PATEL (with Entry).xml');
            if (templateBot) {
                console.log('✅ Found PATEL template, configuring for MATCHES mode...');

                // Parse and configure the XML for MATCHES mode
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(templateBot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update trade type to "matches"
                const tradeTypeFields = xmlDoc.querySelectorAll('field[name="TRADETYPE_LIST"]');
                tradeTypeFields.forEach(field => {
                    field.textContent = 'matches';
                    console.log(`🎲 Trade type set to: matches`);
                });

                // Update contract type to DIGITMATCHES
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = 'DIGITMATCHES';
                    console.log(`📝 Contract type set to: DIGITMATCHES`);
                });

                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = 'DIGITMATCHES';
                    console.log(`💰 Purchase type set to: DIGITMATCHES`);
                });

                // Update prediction before loss (should equal target digit)
                const variableFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                variableFields.forEach(field => {
                    if (field.textContent === 'prediction before loss') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = targetDigit.toString();
                                console.log(`🎯 Prediction before loss set to: ${targetDigit}`);
                            }
                        }
                    }
                });

                // Update prediction after loss (should equal target digit)
                variableFields.forEach(field => {
                    if (field.textContent === 'prediction after loss') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = targetDigit.toString();
                                console.log(`🎯 Prediction after loss set to: ${targetDigit}`);
                            }
                        }
                    }
                });

                // Update search number (entry point digit - same as target for matches)
                variableFields.forEach(field => {
                    if (field.textContent === 'Search Number') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = targetDigit.toString();
                                console.log(`🎯 Entry Point Digit set to: ${targetDigit}`);
                            }
                        }
                    }
                });

                // Serialize the updated XML
                const serializer = new XMLSerializer();
                const updatedXmlContent = serializer.serializeToString(xmlDoc);

                // Create a new bot object for MATCHES mode
                const matchesBot = {
                    ...templateBot,
                    xmlContent: updatedXmlContent,
                    displayName: botName,
                    filePath: 'MATCHES (with Entry).xml', // Use MATCHES file path
                };

                console.log('✅ MATCHES bot configured, loading into workspace...');

                // Switch to Bot Builder tab first
                setActiveTab(1); // BOT_BUILDER is at index 1

                // Load the bot with a slight delay to ensure tab switch completes
                setTimeout(async () => {
                    try {
                        await handleBotClick(matchesBot);
                        console.log('✅ MATCHES bot loaded successfully');
                    } catch (error) {
                        console.error('❌ Error loading MATCHES bot:', error);
                    }
                }, 300);
            } else {
                console.error('❌ PATEL template bot not found for MATCHES configuration');
            }
        };

        window.addEventListener('LOAD_MATCHES_BOT', handleMatchesBotLoad);
        window.addEventListener('message', handleMatchesBotLoad);
        return () => {
            window.removeEventListener('LOAD_MATCHES_BOT', handleMatchesBotLoad);
            window.removeEventListener('message', handleMatchesBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for EVEN/ODD bot loading events from Zeus AI
    useEffect(() => {
        const handleEvenOddBotLoad = async (event: Event) => {
            let eventData: any;

            // Handle both CustomEvent and MessageEvent
            if (event instanceof MessageEvent) {
                // Handle postMessage from AI tool iframe
                if (event.data.type === 'LOAD_EVEN_ODD_BOT') {
                    eventData = event.data.data;
                } else {
                    return; // Not our message
                }
            } else {
                // Handle CustomEvent
                const customEvent = event as CustomEvent;
                eventData = customEvent.detail;
            }

            const {
                botFile,
                botName,
                market,
                contractType,
                tradeType,
                selectedDigit,
                entryPointDigit,
                evenOddType,
                strategy,
                stake,
                martingale,
                maxMartingaleSteps,
            } = eventData;

            console.log('⚪⚫ Received EVEN/ODD bot load request:', {
                botFile,
                botName,
                market,
                contractType,
                tradeType,
                selectedDigit,
                entryPointDigit,
                evenOddType,
                strategy,
            });

            // Find the CFX-EvenOdd bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found CFX-EvenOdd bot, configuring with parameters...');

                // Parse and configure the XML with even/odd parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update trade type to "digits"
                const tradeTypeFields = xmlDoc.querySelectorAll('field[name="TRADETYPE_LIST"]');
                tradeTypeFields.forEach(field => {
                    field.textContent = 'digits';
                    console.log(`⚪⚫ Trade type set to: digits`);
                });

                // Update contract type (DIGITEVEN or DIGITODD)
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Update stake amount if available
                const stakeFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                stakeFields.forEach(field => {
                    if (field.textContent === 'stake' || field.textContent === 'initial_stake') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField && stake) {
                                numField.textContent = stake.toString();
                                console.log(`💰 Stake set to: ${stake}`);
                            }
                        }
                    }
                });

                // Serialize the updated XML
                const serializer = new XMLSerializer();
                const updatedXmlContent = serializer.serializeToString(xmlDoc);

                // Update the bot object with new XML content
                const updatedBot = {
                    ...bot,
                    xmlContent: updatedXmlContent,
                    displayName: botName,
                };

                console.log('✅ EVEN/ODD bot configured, loading into workspace...');

                // Switch to Bot Builder tab first
                setActiveTab(1); // BOT_BUILDER is at index 1

                // Load the bot with a slight delay to ensure tab switch completes
                setTimeout(async () => {
                    try {
                        await handleBotClick(updatedBot);
                        console.log('✅ EVEN/ODD bot loaded successfully');
                    } catch (error) {
                        console.error('❌ Error loading EVEN/ODD bot:', error);
                    }
                }, 300);
            } else {
                console.error('❌ CFX-EvenOdd bot not found:', botFile);
            }
        };

        window.addEventListener('LOAD_EVEN_ODD_BOT', handleEvenOddBotLoad);
        window.addEventListener('message', handleEvenOddBotLoad);
        return () => {
            window.removeEventListener('LOAD_EVEN_ODD_BOT', handleEvenOddBotLoad);
            window.removeEventListener('message', handleEvenOddBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for auto load bot events from Advanced Algorithm
    useEffect(() => {
        const handleAutoLoadBot = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signal, autoLoaded } = customEvent.detail;
            console.log('🤖 Received auto load bot request:', { botFile, signal, autoLoaded });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found auto-load bot, loading directly into Bot Builder...');

                // Switch to Bot Builder tab first
                setActiveTab(DBOT_TABS.BOT_BUILDER);

                // Small delay to ensure tab switch completes
                setTimeout(async () => {
                    await handleBotClick(bot);
                    console.log('✅ Auto-load bot loaded successfully');
                }, 100);
            } else {
                console.error('❌ Auto-load Bot not found:', botFile);
            }
        };

        window.addEventListener('auto.load.bot', handleAutoLoadBot);
        return () => {
            window.removeEventListener('auto.load.bot', handleAutoLoadBot);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for Fibonacci bot loading events from Raziel Bot Loader
    useEffect(() => {
        const handleFibonacciBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { xmlContent, botName, market, parameters } = customEvent.detail;
            console.log('🎯 Received Fibonacci bot load request:', { botName, market, parameters });

            try {
                // Create a bot object with the configured XML
                const fibonacciBot = {
                    id: 'raziel-over-under-fibonacci',
                    filePath: 'Raziel Over Under.xml',
                    title: botName || 'Raziel Over Under (Fibonacci Configured)',
                    xmlContent: xmlContent,
                    save_type: 'LOCAL',
                };

                console.log('✅ Loading Fibonacci-configured Raziel Over Under bot...');

                // Switch to Bot Builder tab first
                setActiveTab(DBOT_TABS.BOT_BUILDER);

                // Small delay to ensure tab switch completes
                setTimeout(async () => {
                    await handleBotClick(fibonacciBot);
                    console.log('✅ Fibonacci Raziel Over Under bot loaded successfully');
                }, 300);
            } catch (error) {
                console.error('❌ Failed to load Fibonacci bot:', error);
            }
        };

        // Listen for both events
        window.addEventListener('load.fibonacci.bot', handleFibonacciBotLoad);
        window.addEventListener('load.bot.from.freebots', handleFibonacciBotLoad);

        return () => {
            window.removeEventListener('load.fibonacci.bot', handleFibonacciBotLoad);
            window.removeEventListener('load.bot.from.freebots', handleFibonacciBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for tab switching events from components
    useEffect(() => {
        const handleTabSwitch = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { tab } = customEvent.detail;
            console.log('📋 Received tab switch request to tab:', tab);

            if (typeof tab === 'number') {
                setActiveTab(tab);
            }
        };

        // Test the CFX bot loading functionality
        const testCFXBotLoading = () => {
            console.log('🧪 Testing CFX bot loading functionality...');

            const mockSignal = {
                market: '1HZ100V',
                marketName: 'Volatility 100 (1s) Index',
                currentPrice: 1234.56789,
                confidence: 85.2,
                recommendation: {
                    action: 'OVER',
                    barrier: 3,
                    reasoning: 'Strong Fibonacci support at 61.8% level with ranging market conditions.',
                },
                analysis: {
                    volatility: 0.65,
                    trendStrength: 0.25,
                    rangingScore: 0.82,
                    fibonacciAlignment: 0.91,
                },
                fibonacciLevels: [
                    { level: 0.236, price: 1230.12345, type: 'support' },
                    { level: 0.618, price: 1234.56789, type: 'resistance' },
                ],
            };

            // Simulate the CFX bot loading
            const loadEvent = new CustomEvent('load.fibonacci.bot', {
                detail: {
                    xmlContent: '<xml>test</xml>',
                    botName: 'CFX-025 Fibonacci Test',
                    market: mockSignal.market,
                    parameters: mockSignal,
                },
            });

            window.dispatchEvent(loadEvent);
            console.log('✅ CFX bot loading test event dispatched');
        };

        // Add test function to window for debugging
        if (typeof window !== 'undefined') {
            (window as any).testCFXBotLoading = testCFXBotLoading;
        }

        window.addEventListener('switch.tab', handleTabSwitch);
        return () => {
            window.removeEventListener('switch.tab', handleTabSwitch);
        };
    }, [setActiveTab]);

    // Listen for token requests from Copy Trading iframe
    useEffect(() => {
        const handleTokenRequest = (event: MessageEvent) => {
            // Security check - only respond to messages from same origin
            if (event.origin !== window.location.origin) return;

            if (event.data.type === 'REQUEST_TOKEN') {
                console.log('📤 Copy Trading iframe requesting token...');

                // Get token from localStorage (same as DTrader)
                const authToken = localStorage.getItem('authToken');
                const activeLoginId = localStorage.getItem('active_loginid');

                if (authToken && activeLoginId) {
                    console.log('✅ Sending token to Copy Trading iframe');

                    // Find the Copy Trading iframe
                    const copyTradingIframe = document.querySelector(
                        'iframe[src="/ai/copy-trading.html"]'
                    ) as HTMLIFrameElement;

                    if (copyTradingIframe && copyTradingIframe.contentWindow) {
                        copyTradingIframe.contentWindow.postMessage(
                            {
                                type: 'INJECT_TOKEN',
                                token: authToken,
                                loginId: activeLoginId,
                            },
                            window.location.origin
                        );
                    }
                } else {
                    console.warn('⚠️ No auth token found to send to Copy Trading iframe');
                }
            }
        };

        window.addEventListener('message', handleTokenRequest);
        return () => {
            window.removeEventListener('message', handleTokenRequest);
        };
    }, []);

    const showRunPanel = true; // Always show run panel on all tabs

    return (
        <>
            <div className='main'>
                <div className='main__container'>
                    <Tabs
                        active_index={active_tab}
                        className='main__tabs dc-tabs--enhanced'
                        onTabItemChange={onEntered}
                        onTabItemClick={setActiveTab}
                        top
                    >
                        {/* DASHBOARD TAB */}
                        <div
                            label={
                                <>
                                    <DashboardIcon />
                                    <Localize i18n_default_text='Dashboard' />
                                </>
                            }
                            id='id-dbot-dashboard'
                        >
                            <Dashboard handleTabChange={setActiveTab} />
                            <button onClick={handleOpen}>Load Bot</button>
                        </div>
                        {/* BOT BUILDER TAB */}
                        <div
                            label={
                                <>
                                    <BotBuilderIcon />
                                    <Localize i18n_default_text='Bot Builder' />
                                </>
                            }
                            id='id-bot-builder'
                        />
                        {/* DCIRCLES TAB */}
                        <div
                            label={
                                <>
                                    <span style={{ fontSize: '20px' }}>⭕</span>
                                    <Localize i18n_default_text='DCircles' />
                                </>
                            }
                            id='id-dcircles'
                        >
                            <DCircles />
                        </div>
                        {/* HACKS ANALYSIS TAB - Moved to More Options */}

                        {/* MORE OPTIONS TAB - Consolidates Scanner, Analyzer, Calculator, Copy Trading, HacksAnalysis */}
                        <div
                            label={
                                <>
                                    <svg
                                        width='24'
                                        height='24'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        {/* Large central gear */}
                                        <g className='more-options-gear-center'>
                                            <circle
                                                cx='12'
                                                cy='12'
                                                r='4'
                                                stroke='currentColor'
                                                strokeWidth='1.5'
                                                fill='none'
                                            />
                                            <circle cx='12' cy='12' r='1.5' fill='#FFD700' />
                                            {/* Gear teeth - 8 teeth */}
                                            <line
                                                x1='12'
                                                y1='8'
                                                x2='12'
                                                y2='6.5'
                                                stroke='currentColor'
                                                strokeWidth='1.2'
                                            />
                                            <line
                                                x1='12'
                                                y1='16'
                                                x2='12'
                                                y2='17.5'
                                                stroke='currentColor'
                                                strokeWidth='1.2'
                                            />
                                            <line
                                                x1='16'
                                                y1='12'
                                                x2='17.5'
                                                y2='12'
                                                stroke='currentColor'
                                                strokeWidth='1.2'
                                            />
                                            <line
                                                x1='8'
                                                y1='12'
                                                x2='6.5'
                                                y2='12'
                                                stroke='currentColor'
                                                strokeWidth='1.2'
                                            />
                                            <line
                                                x1='14.8'
                                                y1='9.2'
                                                x2='16'
                                                y2='8'
                                                stroke='currentColor'
                                                strokeWidth='1.2'
                                            />
                                            <line
                                                x1='9.2'
                                                y1='14.8'
                                                x2='8'
                                                y2='16'
                                                stroke='currentColor'
                                                strokeWidth='1.2'
                                            />
                                            <line
                                                x1='14.8'
                                                y1='14.8'
                                                x2='16'
                                                y2='16'
                                                stroke='currentColor'
                                                strokeWidth='1.2'
                                            />
                                            <line
                                                x1='9.2'
                                                y1='9.2'
                                                x2='8'
                                                y2='8'
                                                stroke='currentColor'
                                                strokeWidth='1.2'
                                            />
                                        </g>

                                        {/* Top-right small gear */}
                                        <g className='more-options-gear-top-right'>
                                            <circle
                                                cx='18'
                                                cy='6'
                                                r='2.2'
                                                stroke='currentColor'
                                                strokeWidth='1'
                                                fill='none'
                                            />
                                            <circle cx='18' cy='6' r='0.8' fill='#FFD700' />
                                            <line
                                                x1='18'
                                                y1='3.8'
                                                x2='18'
                                                y2='3'
                                                stroke='currentColor'
                                                strokeWidth='0.8'
                                            />
                                            <line
                                                x1='18'
                                                y1='8.2'
                                                x2='18'
                                                y2='9'
                                                stroke='currentColor'
                                                strokeWidth='0.8'
                                            />
                                            <line
                                                x1='20.2'
                                                y1='6'
                                                x2='21'
                                                y2='6'
                                                stroke='currentColor'
                                                strokeWidth='0.8'
                                            />
                                            <line
                                                x1='15.8'
                                                y1='6'
                                                x2='15'
                                                y2='6'
                                                stroke='currentColor'
                                                strokeWidth='0.8'
                                            />
                                            <line
                                                x1='19.5'
                                                y1='4.5'
                                                x2='20.1'
                                                y2='3.9'
                                                stroke='currentColor'
                                                strokeWidth='0.8'
                                            />
                                            <line
                                                x1='16.5'
                                                y1='7.5'
                                                x2='15.9'
                                                y2='8.1'
                                                stroke='currentColor'
                                                strokeWidth='0.8'
                                            />
                                        </g>

                                        {/* Bottom-left small gear */}
                                        <g className='more-options-gear-bottom-left'>
                                            <circle
                                                cx='6'
                                                cy='18'
                                                r='2.2'
                                                stroke='currentColor'
                                                strokeWidth='1'
                                                fill='none'
                                            />
                                            <circle cx='6' cy='18' r='0.8' fill='#FFD700' />
                                            <line
                                                x1='6'
                                                y1='15.8'
                                                x2='6'
                                                y2='15'
                                                stroke='currentColor'
                                                strokeWidth='0.8'
                                            />
                                            <line
                                                x1='6'
                                                y1='20.2'
                                                x2='6'
                                                y2='21'
                                                stroke='currentColor'
                                                strokeWidth='0.8'
                                            />
                                            <line
                                                x1='8.2'
                                                y1='18'
                                                x2='9'
                                                y2='18'
                                                stroke='currentColor'
                                                strokeWidth='0.8'
                                            />
                                            <line
                                                x1='3.8'
                                                y1='18'
                                                x2='3'
                                                y2='18'
                                                stroke='currentColor'
                                                strokeWidth='0.8'
                                            />
                                            <line
                                                x1='7.5'
                                                y1='16.5'
                                                x2='8.1'
                                                y2='15.9'
                                                stroke='currentColor'
                                                strokeWidth='0.8'
                                            />
                                            <line
                                                x1='4.5'
                                                y1='19.5'
                                                x2='3.9'
                                                y2='20.1'
                                                stroke='currentColor'
                                                strokeWidth='0.8'
                                            />
                                        </g>

                                        {/* Top-left tiny gear */}
                                        <g className='more-options-gear-top-left'>
                                            <circle
                                                cx='5'
                                                cy='5'
                                                r='1.5'
                                                stroke='currentColor'
                                                strokeWidth='0.8'
                                                fill='none'
                                            />
                                            <circle cx='5' cy='5' r='0.5' fill='#FFD700' />
                                            <line
                                                x1='5'
                                                y1='3.5'
                                                x2='5'
                                                y2='3'
                                                stroke='currentColor'
                                                strokeWidth='0.6'
                                            />
                                            <line
                                                x1='5'
                                                y1='6.5'
                                                x2='5'
                                                y2='7'
                                                stroke='currentColor'
                                                strokeWidth='0.6'
                                            />
                                            <line
                                                x1='6.5'
                                                y1='5'
                                                x2='7'
                                                y2='5'
                                                stroke='currentColor'
                                                strokeWidth='0.6'
                                            />
                                            <line
                                                x1='3.5'
                                                y1='5'
                                                x2='3'
                                                y2='5'
                                                stroke='currentColor'
                                                strokeWidth='0.6'
                                            />
                                        </g>

                                        {/* Bottom-right tiny gear */}
                                        <g className='more-options-gear-bottom-right'>
                                            <circle
                                                cx='19'
                                                cy='19'
                                                r='1.5'
                                                stroke='currentColor'
                                                strokeWidth='0.8'
                                                fill='none'
                                            />
                                            <circle cx='19' cy='19' r='0.5' fill='#FFD700' />
                                            <line
                                                x1='19'
                                                y1='17.5'
                                                x2='19'
                                                y2='17'
                                                stroke='currentColor'
                                                strokeWidth='0.6'
                                            />
                                            <line
                                                x1='19'
                                                y1='20.5'
                                                x2='19'
                                                y2='21'
                                                stroke='currentColor'
                                                strokeWidth='0.6'
                                            />
                                            <line
                                                x1='20.5'
                                                y1='19'
                                                x2='21'
                                                y2='19'
                                                stroke='currentColor'
                                                strokeWidth='0.6'
                                            />
                                            <line
                                                x1='17.5'
                                                y1='19'
                                                x2='17'
                                                y2='19'
                                                stroke='currentColor'
                                                strokeWidth='0.6'
                                            />
                                        </g>

                                        {/* Connecting chains/belts */}
                                        <path
                                            d='M14.5 10.5 L16.5 7.5'
                                            stroke='currentColor'
                                            strokeWidth='0.5'
                                            opacity='0.4'
                                            strokeDasharray='1,1'
                                        />
                                        <path
                                            d='M9.5 13.5 L7.5 16.5'
                                            stroke='currentColor'
                                            strokeWidth='0.5'
                                            opacity='0.4'
                                            strokeDasharray='1,1'
                                        />

                                        <style>{`
                                            @keyframes rotateClockwise {
                                                from { transform: rotate(0deg); }
                                                to { transform: rotate(360deg); }
                                            }
                                            @keyframes rotateCounterClockwise {
                                                from { transform: rotate(0deg); }
                                                to { transform: rotate(-360deg); }
                                            }
                                            .more-options-gear-center {
                                                transform-origin: 12px 12px;
                                                animation: rotateClockwise 6s linear infinite;
                                            }
                                            .more-options-gear-top-right {
                                                transform-origin: 18px 6px;
                                                animation: rotateCounterClockwise 4s linear infinite;
                                            }
                                            .more-options-gear-bottom-left {
                                                transform-origin: 6px 18px;
                                                animation: rotateCounterClockwise 4s linear infinite;
                                            }
                                            .more-options-gear-top-left {
                                                transform-origin: 5px 5px;
                                                animation: rotateClockwise 3s linear infinite;
                                            }
                                            .more-options-gear-bottom-right {
                                                transform-origin: 19px 19px;
                                                animation: rotateClockwise 3s linear infinite;
                                            }
                                        `}</style>
                                    </svg>
                                    <Localize i18n_default_text='More Options' />
                                </>
                            }
                            id='id-more-options'
                        >
                            {/* More Options Selection Interface - Professional Design */}
                            <div
                                style={{
                                    padding: '3rem 2rem',
                                    width: '100%',
                                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                    minHeight: '100vh',
                                }}
                            >
                                <div
                                    style={{
                                        maxWidth: '1400px',
                                        margin: '0 auto',
                                    }}
                                >
                                    {/* Header Section */}
                                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                                        <h1
                                            style={{
                                                fontSize: '3rem',
                                                fontWeight: '700',
                                                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                marginBottom: '1rem',
                                            }}
                                        >
                                            Trading Tools Suite
                                        </h1>
                                        <p
                                            style={{
                                                fontSize: '1.2rem',
                                                color: '#64748b',
                                                maxWidth: '600px',
                                                margin: '0 auto',
                                                lineHeight: '1.6',
                                            }}
                                        >
                                            Professional trading tools designed to enhance your trading experience with
                                            advanced analytics, automation, and market insights.
                                        </p>
                                    </div>

                                    {/* Professional Tools Grid */}
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                                            gap: '1rem',
                                            marginBottom: '3rem',
                                        }}
                                    >
                                        {/* Scanner Tool Card */}
                                        <div
                                            onClick={() => setMoreOptionsContent('scanner')}
                                            style={{
                                                background:
                                                    moreOptionsContent === 'scanner'
                                                        ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                                                        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                                border: `2px solid ${moreOptionsContent === 'scanner' ? '#3b82f6' : '#e2e8f0'}`,
                                                borderRadius: '12px',
                                                padding: '1rem 1.5rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                boxShadow:
                                                    moreOptionsContent === 'scanner'
                                                        ? '0 8px 25px -5px rgba(59, 130, 246, 0.3)'
                                                        : '0 4px 15px -3px rgba(0, 0, 0, 0.1)',
                                                transform:
                                                    moreOptionsContent === 'scanner'
                                                        ? 'translateY(-2px)'
                                                        : 'translateY(0)',
                                            }}
                                            onMouseEnter={e => {
                                                if (moreOptionsContent !== 'scanner') {
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                    e.currentTarget.style.boxShadow =
                                                        '0 8px 25px -5px rgba(0, 0, 0, 0.15)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (moreOptionsContent !== 'scanner') {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow =
                                                        '0 4px 15px -3px rgba(0, 0, 0, 0.1)';
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div
                                                    style={{
                                                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                                        borderRadius: '8px',
                                                        padding: '0.5rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: '40px',
                                                        height: '40px',
                                                    }}
                                                >
                                                    <div style={{ color: '#ffffff', transform: 'scale(0.7)' }}>
                                                        <TrackSignalsIcon />
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3
                                                        style={{
                                                            fontSize: '1.1rem',
                                                            fontWeight: '600',
                                                            color:
                                                                moreOptionsContent === 'scanner'
                                                                    ? '#ffffff'
                                                                    : '#1e293b',
                                                            margin: '0 0 0.25rem 0',
                                                        }}
                                                    >
                                                        Scanner
                                                    </h3>
                                                    <p
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            color:
                                                                moreOptionsContent === 'scanner'
                                                                    ? 'rgba(255, 255, 255, 0.8)'
                                                                    : '#64748b',
                                                            lineHeight: '1.4',
                                                            margin: 0,
                                                        }}
                                                    >
                                                        Advanced market scanning tool to identify trading opportunities
                                                        in real-time.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Analyzer Tool Card */}
                                        <div
                                            onClick={() => setMoreOptionsContent('analyzer')}
                                            style={{
                                                background:
                                                    moreOptionsContent === 'analyzer'
                                                        ? 'linear-gradient(135deg, #10b981 0%, #047857 100%)'
                                                        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                                border: `2px solid ${moreOptionsContent === 'analyzer' ? '#10b981' : '#e2e8f0'}`,
                                                borderRadius: '12px',
                                                padding: '1rem 1.5rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                boxShadow:
                                                    moreOptionsContent === 'analyzer'
                                                        ? '0 8px 25px -5px rgba(16, 185, 129, 0.3)'
                                                        : '0 4px 15px -3px rgba(0, 0, 0, 0.1)',
                                                transform:
                                                    moreOptionsContent === 'analyzer'
                                                        ? 'translateY(-2px)'
                                                        : 'translateY(0)',
                                            }}
                                            onMouseEnter={e => {
                                                if (moreOptionsContent !== 'analyzer') {
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                    e.currentTarget.style.boxShadow =
                                                        '0 8px 25px -5px rgba(0, 0, 0, 0.15)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (moreOptionsContent !== 'analyzer') {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow =
                                                        '0 4px 15px -3px rgba(0, 0, 0, 0.1)';
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div
                                                    style={{
                                                        background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                                                        borderRadius: '8px',
                                                        padding: '0.5rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: '40px',
                                                        height: '40px',
                                                    }}
                                                >
                                                    <div style={{ color: '#ffffff', transform: 'scale(0.7)' }}>
                                                        <TrackAnalyzerIcon />
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3
                                                        style={{
                                                            fontSize: '1.1rem',
                                                            fontWeight: '600',
                                                            color:
                                                                moreOptionsContent === 'analyzer'
                                                                    ? '#ffffff'
                                                                    : '#1e293b',
                                                            margin: '0 0 0.25rem 0',
                                                        }}
                                                    >
                                                        Analyzer
                                                    </h3>
                                                    <p
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            color:
                                                                moreOptionsContent === 'analyzer'
                                                                    ? 'rgba(255, 255, 255, 0.8)'
                                                                    : '#64748b',
                                                            lineHeight: '1.4',
                                                            margin: 0,
                                                        }}
                                                    >
                                                        Comprehensive market analysis with technical indicators and
                                                        predictive insights.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Calculator Tool Card */}
                                        <div
                                            onClick={() => setMoreOptionsContent('calculator')}
                                            style={{
                                                background:
                                                    moreOptionsContent === 'calculator'
                                                        ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                                                        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                                border: `2px solid ${moreOptionsContent === 'calculator' ? '#8b5cf6' : '#e2e8f0'}`,
                                                borderRadius: '12px',
                                                padding: '1rem 1.5rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                boxShadow:
                                                    moreOptionsContent === 'calculator'
                                                        ? '0 8px 25px -5px rgba(139, 92, 246, 0.3)'
                                                        : '0 4px 15px -3px rgba(0, 0, 0, 0.1)',
                                                transform:
                                                    moreOptionsContent === 'calculator'
                                                        ? 'translateY(-2px)'
                                                        : 'translateY(0)',
                                            }}
                                            onMouseEnter={e => {
                                                if (moreOptionsContent !== 'calculator') {
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                    e.currentTarget.style.boxShadow =
                                                        '0 8px 25px -5px rgba(0, 0, 0, 0.15)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (moreOptionsContent !== 'calculator') {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow =
                                                        '0 4px 15px -3px rgba(0, 0, 0, 0.1)';
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div
                                                    style={{
                                                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                                        borderRadius: '8px',
                                                        padding: '0.5rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: '40px',
                                                        height: '40px',
                                                    }}
                                                >
                                                    <div style={{ color: '#ffffff', transform: 'scale(0.7)' }}>
                                                        <TrackCalculatorIcon />
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3
                                                        style={{
                                                            fontSize: '1.1rem',
                                                            fontWeight: '600',
                                                            color:
                                                                moreOptionsContent === 'calculator'
                                                                    ? '#ffffff'
                                                                    : '#1e293b',
                                                            margin: '0 0 0.25rem 0',
                                                        }}
                                                    >
                                                        Calculator
                                                    </h3>
                                                    <p
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            color:
                                                                moreOptionsContent === 'calculator'
                                                                    ? 'rgba(255, 255, 255, 0.8)'
                                                                    : '#64748b',
                                                            lineHeight: '1.4',
                                                            margin: 0,
                                                        }}
                                                    >
                                                        Advanced trading calculator for position sizing and risk
                                                        management.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Copy Trading Tool Card */}
                                        <div
                                            onClick={() => setMoreOptionsContent('copytrading')}
                                            style={{
                                                background:
                                                    moreOptionsContent === 'copytrading'
                                                        ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                                                        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                                border: `2px solid ${moreOptionsContent === 'copytrading' ? '#f97316' : '#e2e8f0'}`,
                                                borderRadius: '12px',
                                                padding: '1rem 1.5rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                boxShadow:
                                                    moreOptionsContent === 'copytrading'
                                                        ? '0 8px 25px -5px rgba(249, 115, 22, 0.3)'
                                                        : '0 4px 15px -3px rgba(0, 0, 0, 0.1)',
                                                transform:
                                                    moreOptionsContent === 'copytrading'
                                                        ? 'translateY(-2px)'
                                                        : 'translateY(0)',
                                            }}
                                            onMouseEnter={e => {
                                                if (moreOptionsContent !== 'copytrading') {
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                    e.currentTarget.style.boxShadow =
                                                        '0 8px 25px -5px rgba(0, 0, 0, 0.15)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (moreOptionsContent !== 'copytrading') {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow =
                                                        '0 4px 15px -3px rgba(0, 0, 0, 0.1)';
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div
                                                    style={{
                                                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                                        borderRadius: '8px',
                                                        padding: '0.5rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: '40px',
                                                        height: '40px',
                                                    }}
                                                >
                                                    <div style={{ color: '#ffffff', transform: 'scale(0.7)' }}>
                                                        <CopyTradingIcon />
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3
                                                        style={{
                                                            fontSize: '1.1rem',
                                                            fontWeight: '600',
                                                            color:
                                                                moreOptionsContent === 'copytrading'
                                                                    ? '#ffffff'
                                                                    : '#1e293b',
                                                            margin: '0 0 0.25rem 0',
                                                        }}
                                                    >
                                                        Copy Trading
                                                    </h3>
                                                    <p
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            color:
                                                                moreOptionsContent === 'copytrading'
                                                                    ? 'rgba(255, 255, 255, 0.8)'
                                                                    : '#64748b',
                                                            lineHeight: '1.4',
                                                            margin: 0,
                                                        }}
                                                    >
                                                        Automated copy trading system to replicate successful traders'
                                                        strategies.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* CopyCat Tool Card */}
                                        <div
                                            onClick={() => setMoreOptionsContent('copycat')}
                                            style={{
                                                background:
                                                    moreOptionsContent === 'copycat'
                                                        ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                                                        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                                border: `2px solid ${moreOptionsContent === 'copycat' ? '#8b5cf6' : '#e2e8f0'}`,
                                                borderRadius: '12px',
                                                padding: '1rem 1.5rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                boxShadow:
                                                    moreOptionsContent === 'copycat'
                                                        ? '0 8px 25px -5px rgba(139, 92, 246, 0.3)'
                                                        : '0 4px 15px -3px rgba(0, 0, 0, 0.1)',
                                                transform:
                                                    moreOptionsContent === 'copycat'
                                                        ? 'translateY(-2px)'
                                                        : 'translateY(0)',
                                            }}
                                            onMouseEnter={e => {
                                                if (moreOptionsContent !== 'copycat') {
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                    e.currentTarget.style.boxShadow =
                                                        '0 8px 25px -5px rgba(0, 0, 0, 0.15)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (moreOptionsContent !== 'copycat') {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow =
                                                        '0 4px 15px -3px rgba(0, 0, 0, 0.1)';
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div
                                                    style={{
                                                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                                        borderRadius: '8px',
                                                        padding: '0.5rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: '40px',
                                                        height: '40px',
                                                    }}
                                                >
                                                    <svg viewBox='0 0 24 24' style={{ width: '22px', height: '22px' }} xmlns='http://www.w3.org/2000/svg'>
                                                        <style>{`
                                                            @keyframes spin-card-main { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                                                            @keyframes spin-card-small { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
                                                            @keyframes spin-card-tiny { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                                                            .card-gear-main { transform-origin: 12px 12px; animation: spin-card-main 3s linear infinite; }
                                                            .card-gear-small { transform-origin: 19.5px 4.5px; animation: spin-card-small 1.8s linear infinite; }
                                                            .card-gear-tiny { transform-origin: 4.5px 19.5px; animation: spin-card-tiny 2.4s linear infinite; }
                                                        `}</style>
                                                        <g className='card-gear-main'>
                                                            <circle cx='12' cy='12' r='2.5' fill='none' stroke='white' strokeWidth='1.2' />
                                                            <path d='M12 6.5v1.2M12 16.3v1.2M6.5 12H7.7M16.3 12h1.2M8.2 8.2l0.85 0.85M14.95 14.95l0.85 0.85M8.2 15.8l0.85-0.85M14.95 9.05l0.85-0.85' stroke='white' strokeWidth='1.2' strokeLinecap='round' />
                                                            <circle cx='12' cy='12' r='4.5' fill='none' stroke='white' strokeWidth='0.6' strokeDasharray='1.5 1' />
                                                        </g>
                                                        <g className='card-gear-small'>
                                                            <circle cx='19.5' cy='4.5' r='1.4' fill='none' stroke='white' strokeWidth='1' />
                                                            <path d='M19.5 2.5v0.7M19.5 5.8v0.7M17.5 4.5h0.7M20.8 4.5h0.7M18.2 3.2l0.5 0.5M20.3 5.3l0.5 0.5M18.2 5.8l0.5-0.5M20.3 3.7l0.5-0.5' stroke='white' strokeWidth='0.9' strokeLinecap='round' />
                                                        </g>
                                                        <g className='card-gear-tiny'>
                                                            <circle cx='4.5' cy='19.5' r='1.4' fill='none' stroke='white' strokeWidth='1' />
                                                            <path d='M4.5 17.5v0.7M4.5 20.8v0.7M2.5 19.5h0.7M5.8 19.5h0.7M3.2 18.2l0.5 0.5M5.3 20.3l0.5 0.5M3.2 20.8l0.5-0.5M5.3 18.7l0.5-0.5' stroke='white' strokeWidth='0.9' strokeLinecap='round' />
                                                        </g>
                                                        <line x1='16' y1='8' x2='18.2' y2='5.8' stroke='white' strokeWidth='0.6' strokeDasharray='1 0.8' opacity='0.6' />
                                                        <line x1='8' y1='16' x2='5.8' y2='18.2' stroke='white' strokeWidth='0.6' strokeDasharray='1 0.8' opacity='0.6' />
                                                    </svg>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3
                                                        style={{
                                                            fontSize: '1.1rem',
                                                            fontWeight: '600',
                                                            color:
                                                                moreOptionsContent === 'copycat'
                                                                    ? '#ffffff'
                                                                    : '#1e293b',
                                                            margin: '0 0 0.25rem 0',
                                                        }}
                                                    >
                                                        Copy Trading
                                                    </h3>
                                                    <p
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            color:
                                                                moreOptionsContent === 'copycat'
                                                                    ? 'rgba(255, 255, 255, 0.8)'
                                                                    : '#64748b',
                                                            lineHeight: '1.4',
                                                            margin: 0,
                                                        }}
                                                    >
                                                        Replicate your trades to multiple client accounts using API
                                                        tokens.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* HacksAnalysis Tool Card */}{' '}
                                        <div
                                            onClick={() => setMoreOptionsContent('hacksanalysis')}
                                            style={{
                                                background:
                                                    moreOptionsContent === 'hacksanalysis'
                                                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                                        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                                border: `2px solid ${moreOptionsContent === 'hacksanalysis' ? '#ef4444' : '#e2e8f0'}`,
                                                borderRadius: '12px',
                                                padding: '1rem 1.5rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                boxShadow:
                                                    moreOptionsContent === 'hacksanalysis'
                                                        ? '0 8px 25px -5px rgba(239, 68, 68, 0.3)'
                                                        : '0 4px 15px -3px rgba(0, 0, 0, 0.1)',
                                                transform:
                                                    moreOptionsContent === 'hacksanalysis'
                                                        ? 'translateY(-2px)'
                                                        : 'translateY(0)',
                                            }}
                                            onMouseEnter={e => {
                                                if (moreOptionsContent !== 'hacksanalysis') {
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                    e.currentTarget.style.boxShadow =
                                                        '0 8px 25px -5px rgba(0, 0, 0, 0.15)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (moreOptionsContent !== 'hacksanalysis') {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow =
                                                        '0 4px 15px -3px rgba(0, 0, 0, 0.1)';
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div
                                                    style={{
                                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                        borderRadius: '8px',
                                                        padding: '0.5rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: '40px',
                                                        height: '40px',
                                                    }}
                                                >
                                                    <div style={{ color: '#ffffff', transform: 'scale(0.7)' }}>
                                                        <HacksAnalysisIcon />
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3
                                                        style={{
                                                            fontSize: '1.1rem',
                                                            fontWeight: '600',
                                                            color:
                                                                moreOptionsContent === 'hacksanalysis'
                                                                    ? '#ffffff'
                                                                    : '#1e293b',
                                                            margin: '0 0 0.25rem 0',
                                                        }}
                                                    >
                                                        HacksAnalysis
                                                    </h3>
                                                    <p
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            color:
                                                                moreOptionsContent === 'hacksanalysis'
                                                                    ? 'rgba(255, 255, 255, 0.8)'
                                                                    : '#64748b',
                                                            lineHeight: '1.4',
                                                            margin: 0,
                                                        }}
                                                    >
                                                        Advanced trading hacks and analysis tools for market
                                                        exploitation.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Quick Strategy Tool Card */}
                                        <div
                                            onClick={() => setMoreOptionsContent('quickstrategy')}
                                            style={{
                                                background:
                                                    moreOptionsContent === 'quickstrategy'
                                                        ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
                                                        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                                border: `2px solid ${moreOptionsContent === 'quickstrategy' ? '#06b6d4' : '#e2e8f0'}`,
                                                borderRadius: '12px',
                                                padding: '1rem 1.5rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                boxShadow:
                                                    moreOptionsContent === 'quickstrategy'
                                                        ? '0 8px 25px -5px rgba(6, 182, 212, 0.3)'
                                                        : '0 4px 15px -3px rgba(0, 0, 0, 0.1)',
                                                transform:
                                                    moreOptionsContent === 'quickstrategy'
                                                        ? 'translateY(-2px)'
                                                        : 'translateY(0)',
                                            }}
                                            onMouseEnter={e => {
                                                if (moreOptionsContent !== 'quickstrategy') {
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                    e.currentTarget.style.boxShadow =
                                                        '0 8px 25px -5px rgba(0, 0, 0, 0.15)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (moreOptionsContent !== 'quickstrategy') {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow =
                                                        '0 4px 15px -3px rgba(0, 0, 0, 0.1)';
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div
                                                    style={{
                                                        background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                                                        borderRadius: '8px',
                                                        padding: '0.5rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: '40px',
                                                        height: '40px',
                                                    }}
                                                >
                                                    <div style={{ color: '#ffffff', transform: 'scale(0.7)' }}>
                                                        <QuickStrategyIcon />
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3
                                                        style={{
                                                            fontSize: '1.1rem',
                                                            fontWeight: '600',
                                                            color:
                                                                moreOptionsContent === 'quickstrategy'
                                                                    ? '#ffffff'
                                                                    : '#1e293b',
                                                            margin: '0 0 0.25rem 0',
                                                        }}
                                                    >
                                                        Quick Strategy
                                                    </h3>
                                                    <p
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            color:
                                                                moreOptionsContent === 'quickstrategy'
                                                                    ? 'rgba(255, 255, 255, 0.8)'
                                                                    : '#64748b',
                                                            lineHeight: '1.4',
                                                            margin: 0,
                                                        }}
                                                    >
                                                        Rapid strategy deployment tool for quick market entry with
                                                        pre-configured setups.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Render selected content */}
                                    <div style={{ marginTop: '2rem' }}>
                                        {moreOptionsContent === 'scanner' && <SignalsScanner />}
                                        {moreOptionsContent === 'analyzer' && <MarketAnalyzer />}
                                        {moreOptionsContent === 'calculator' && <TradingCalculator />}
                                        {moreOptionsContent === 'copycat' && (
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: 'calc(100vh - 300px)',
                                                    minHeight: '500px',
                                                    overflow: 'auto',
                                                    background: '#f8f9fa',
                                                    borderRadius: '12px',
                                                }}
                                            >
                                                <CopyCatPage />
                                            </div>
                                        )}
                                        {moreOptionsContent === 'copytrading' && (
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: 'calc(100vh - 300px)',
                                                    minHeight: '500px',
                                                    overflow: 'auto',
                                                    background: '#f8f9fa',
                                                    borderRadius: '12px',
                                                    padding: '1rem',
                                                }}
                                            >
                                                <CopyTrader />
                                            </div>
                                        )}
                                        {moreOptionsContent === 'hacksanalysis' && (
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: 'calc(100vh - 300px)',
                                                    minHeight: '500px',
                                                    overflow: 'hidden',
                                                    background: '#fff',
                                                    borderRadius: '12px',
                                                }}
                                            >
                                                <iframe
                                                    src='/www.osamtradinghub.com/alltools-ten.vercel.app/index.html'
                                                    title='HacksAnalysis - Advanced Trading Tools'
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        border: 'none',
                                                        display: 'block',
                                                    }}
                                                    allow='clipboard-write'
                                                    sandbox='allow-same-origin allow-scripts allow-forms allow-popups allow-modals'
                                                />
                                            </div>
                                        )}
                                        {moreOptionsContent === 'quickstrategy' && (
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: 'calc(100vh - 300px)',
                                                    minHeight: '500px',
                                                    overflow: 'auto',
                                                    background: '#f8f9fa',
                                                    borderRadius: '12px',
                                                    padding: '1rem',
                                                }}
                                            >
                                                <QuickStrategy />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CHARTS TAB */}
                        <div
                            label={
                                <>
                                    <ChartsIcon />
                                    <Localize i18n_default_text='Charts' />
                                </>
                            }
                            id='id-charts'
                        >
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading chart...')} />}>
                                <Chart show_digits_stats={false} />
                            </Suspense>
                        </div>
                        {/* TUTORIALS TAB */}
                        <div
                            label={
                                <>
                                    <TutorialsIcon />
                                    <Localize i18n_default_text='Tutorials' />
                                </>
                            }
                            id='id-tutorials'
                        >
                            <Suspense
                                fallback={<ChunkLoader message={localize('Please wait, loading tutorials...')} />}
                            >
                                <Tutorial handleTabChange={setActiveTab} />
                            </Suspense>
                        </div>
                        {/* ANALYSIS TOOL TAB */}
                        <div
                            label={
                                <>
                                    <AnalysisToolIcon />
                                    <Localize i18n_default_text='Analysis Tool' />
                                </>
                            }
                            id='id-analysis-tool'
                        >
                            <div
                                className={classNames('dashboard__chart-wrapper', {
                                    'dashboard__chart-wrapper--expanded': is_drawer_open && isDesktop,
                                    'dashboard__chart-wrapper--modal': is_chart_modal_visible && isDesktop,
                                })}
                                style={{
                                    height: 'calc(100vh - 120px)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    position: 'fixed',
                                    top: '120px',
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '4px',
                                        padding: '8px 16px',
                                        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
                                        backdropFilter: 'blur(20px)',
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
                                        boxShadow:
                                            '0 4px 32px rgba(0, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                    }}
                                >
                                    {/* Animated background grid */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundImage: `
                                                linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
                                                linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
                                            `,
                                            backgroundSize: '20px 20px',
                                            animation: 'gridMove 20s linear infinite',
                                            pointerEvents: 'none',
                                        }}
                                    />

                                    {/* Holographic scan line */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: '-100%',
                                            width: '100%',
                                            height: '100%',
                                            background:
                                                'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent)',
                                            animation: 'scanLine 3s ease-in-out infinite',
                                            pointerEvents: 'none',
                                        }}
                                    />

                                    <button
                                        onClick={() => toggleAnalysisTool('internal')}
                                        style={{
                                            flex: 1,
                                            position: 'relative',
                                            background:
                                                analysisToolUrl === 'internal'
                                                    ? 'linear-gradient(135deg, #00ffff 0%, #0080ff 50%, #8000ff 100%)'
                                                    : 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 128, 255, 0.05) 100%)',
                                            color: analysisToolUrl === 'internal' ? '#000000' : '#00ffff',
                                            padding: '8px 16px',
                                            border:
                                                analysisToolUrl === 'internal'
                                                    ? '1px solid #00ffff'
                                                    : '1px solid rgba(0, 255, 255, 0.3)',
                                            borderRadius: '0',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            letterSpacing: '1px',
                                            textTransform: 'uppercase',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow:
                                                analysisToolUrl === 'internal'
                                                    ? '0 0 20px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                                                    : '0 0 10px rgba(0, 255, 255, 0.2)',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                                        }}
                                        onMouseEnter={e => {
                                            if (analysisToolUrl !== 'internal') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(0, 128, 255, 0.1) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.4)';
                                                e.currentTarget.style.color = '#ffffff';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (analysisToolUrl !== 'internal') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 128, 255, 0.05) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.2)';
                                                e.currentTarget.style.color = '#00ffff';
                                            }
                                        }}
                                    >
                                        {/* Button glow effect */}
                                        {analysisToolUrl === 'internal' && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background:
                                                        'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                                                    animation: 'shimmer 2s infinite',
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        )}
                                        <span style={{ position: 'relative', zIndex: 1 }}>◉ ADVANCED</span>
                                    </button>

                                    <button
                                        onClick={() => toggleAnalysisTool('ai')}
                                        style={{
                                            flex: 1,
                                            position: 'relative',
                                            background:
                                                analysisToolUrl === 'ai'
                                                    ? 'linear-gradient(135deg, #ff0080 0%, #ff8000 50%, #ffff00 100%)'
                                                    : 'linear-gradient(135deg, rgba(255, 0, 128, 0.1) 0%, rgba(255, 128, 0, 0.05) 100%)',
                                            color: analysisToolUrl === 'ai' ? '#000000' : '#ff0080',
                                            padding: '8px 16px',
                                            border:
                                                analysisToolUrl === 'ai'
                                                    ? '1px solid #ff0080'
                                                    : '1px solid rgba(255, 0, 128, 0.3)',
                                            borderRadius: '0',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            letterSpacing: '1px',
                                            textTransform: 'uppercase',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow:
                                                analysisToolUrl === 'ai'
                                                    ? '0 0 20px rgba(255, 0, 128, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                                                    : '0 0 10px rgba(255, 0, 128, 0.2)',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                                        }}
                                        onMouseEnter={e => {
                                            if (analysisToolUrl !== 'ai') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(255, 0, 128, 0.2) 0%, rgba(255, 128, 0, 0.1) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 0, 128, 0.4)';
                                                e.currentTarget.style.color = '#ffffff';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (analysisToolUrl !== 'ai') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(255, 0, 128, 0.1) 0%, rgba(255, 128, 0, 0.05) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 0, 128, 0.2)';
                                                e.currentTarget.style.color = '#ff0080';
                                            }
                                        }}
                                    >
                                        {/* Button glow effect */}
                                        {analysisToolUrl === 'ai' && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background:
                                                        'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                                                    animation: 'shimmer 2s infinite',
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        )}
                                        <span style={{ position: 'relative', zIndex: 1 }}>⚡ ZEUS AI</span>
                                    </button>

                                    <button
                                        onClick={() => toggleAnalysisTool('ldpanalyzer')}
                                        style={{
                                            flex: 1,
                                            position: 'relative',
                                            background:
                                                analysisToolUrl === 'ldpanalyzer'
                                                    ? 'linear-gradient(135deg, #00ff00 0%, #80ff00 50%, #ffff00 100%)'
                                                    : 'linear-gradient(135deg, rgba(0, 255, 0, 0.1) 0%, rgba(128, 255, 0, 0.05) 100%)',
                                            color: analysisToolUrl === 'ldpanalyzer' ? '#000000' : '#00ff00',
                                            padding: '8px 16px',
                                            border:
                                                analysisToolUrl === 'ldpanalyzer'
                                                    ? '1px solid #00ff00'
                                                    : '1px solid rgba(0, 255, 0, 0.3)',
                                            borderRadius: '0',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            letterSpacing: '1px',
                                            textTransform: 'uppercase',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow:
                                                analysisToolUrl === 'ldpanalyzer'
                                                    ? '0 0 20px rgba(0, 255, 0, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                                                    : '0 0 10px rgba(0, 255, 0, 0.2)',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                                        }}
                                        onMouseEnter={e => {
                                            if (analysisToolUrl !== 'ldpanalyzer') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(0, 255, 0, 0.2) 0%, rgba(128, 255, 0, 0.1) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.4)';
                                                e.currentTarget.style.color = '#ffffff';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (analysisToolUrl !== 'ldpanalyzer') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(0, 255, 0, 0.1) 0%, rgba(128, 255, 0, 0.05) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.2)';
                                                e.currentTarget.style.color = '#00ff00';
                                            }
                                        }}
                                    >
                                        {/* Button glow effect */}
                                        {analysisToolUrl === 'ldpanalyzer' && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background:
                                                        'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                                                    animation: 'shimmer 2s infinite',
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        )}
                                        <span style={{ position: 'relative', zIndex: 1 }}>▲ LDP SCAN</span>
                                    </button>

                                    {/* Add CSS animations */}
                                    <style>
                                        {`
                                            @keyframes gridMove {
                                                0% { transform: translate(0, 0); }
                                                100% { transform: translate(20px, 20px); }
                                            }
                                            
                                            @keyframes scanLine {
                                                0% { left: -100%; }
                                                50% { left: 100%; }
                                                100% { left: -100%; }
                                            }
                                            
                                            @keyframes shimmer {
                                                0% { transform: translateX(-100%); }
                                                100% { transform: translateX(100%); }
                                            }
                                            
                                            @keyframes pulse {
                                                0%, 100% { opacity: 1; }
                                                50% { opacity: 0.7; }
                                            }
                                        `}
                                    </style>
                                </div>
                                <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                                    {analysisToolUrl === 'internal' ? (
                                        <div style={{ height: '100%', overflowY: 'auto', padding: '0' }}>
                                            <AnalysisTool />
                                        </div>
                                    ) : analysisToolUrl === 'ai' ? (
                                        <iframe
                                            src={analysisToolUrl}
                                            width='100%'
                                            style={{
                                                border: 'none',
                                                display: 'block',
                                                height: '100%',
                                                background: '#f8fafc',
                                            }}
                                            scrolling='yes'
                                        />
                                    ) : analysisToolUrl === 'ldpanalyzer' ? (
                                        <div
                                            style={{
                                                height: '100%',
                                                background:
                                                    'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#00ff00',
                                                fontFamily: 'monospace',
                                                position: 'relative',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {/* Animated background grid */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    backgroundImage: `
                                                        linear-gradient(rgba(0, 255, 0, 0.03) 1px, transparent 1px),
                                                        linear-gradient(90deg, rgba(0, 255, 0, 0.03) 1px, transparent 1px)
                                                    `,
                                                    backgroundSize: '30px 30px',
                                                    animation: 'gridMove 25s linear infinite',
                                                    pointerEvents: 'none',
                                                }}
                                            />

                                            {/* Scanning lines */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '20%',
                                                    left: 0,
                                                    right: 0,
                                                    height: '2px',
                                                    background:
                                                        'linear-gradient(90deg, transparent, #00ff00, transparent)',
                                                    animation: 'scanVertical 4s ease-in-out infinite',
                                                    boxShadow: '0 0 10px #00ff00',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '60%',
                                                    left: 0,
                                                    right: 0,
                                                    height: '2px',
                                                    background:
                                                        'linear-gradient(90deg, transparent, #00ff00, transparent)',
                                                    animation: 'scanVertical 4s ease-in-out infinite 2s',
                                                    boxShadow: '0 0 10px #00ff00',
                                                }}
                                            />

                                            {/* Central content */}
                                            <div
                                                style={{
                                                    textAlign: 'center',
                                                    zIndex: 10,
                                                    background: 'rgba(0, 0, 0, 0.8)',
                                                    padding: '40px',
                                                    borderRadius: '0',
                                                    border: '2px solid #00ff00',
                                                    clipPath:
                                                        'polygon(20px 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%)',
                                                    boxShadow:
                                                        '0 0 30px rgba(0, 255, 0, 0.3), inset 0 0 30px rgba(0, 255, 0, 0.1)',
                                                    animation: 'pulse 3s ease-in-out infinite',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: '48px',
                                                        marginBottom: '20px',
                                                        animation: 'rotate 10s linear infinite',
                                                    }}
                                                >
                                                    ▲
                                                </div>
                                                <h2
                                                    style={{
                                                        fontSize: '24px',
                                                        fontWeight: 'bold',
                                                        marginBottom: '16px',
                                                        letterSpacing: '3px',
                                                        textTransform: 'uppercase',
                                                        textShadow: '0 0 10px #00ff00',
                                                    }}
                                                >
                                                    LDP SCANNER
                                                </h2>
                                                <p
                                                    style={{
                                                        fontSize: '14px',
                                                        opacity: 0.8,
                                                        marginBottom: '24px',
                                                        letterSpacing: '1px',
                                                    }}
                                                >
                                                    LAST DIGIT PREDICTION ANALYSIS SYSTEM
                                                </p>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        gap: '20px',
                                                        marginBottom: '20px',
                                                    }}
                                                >
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                                            STATUS
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#00ff00' }}>ONLINE</div>
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                                            ACCURACY
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#00ff00' }}>87.3%</div>
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                                            SCANS
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#00ff00' }}>1,247</div>
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: '12px',
                                                        opacity: 0.6,
                                                        animation: 'blink 2s infinite',
                                                    }}
                                                >
                                                    [ INITIALIZING QUANTUM ANALYSIS ENGINE... ]
                                                </div>
                                            </div>

                                            {/* Corner decorations */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '20px',
                                                    left: '20px',
                                                    width: '40px',
                                                    height: '40px',
                                                    border: '2px solid #00ff00',
                                                    borderRight: 'none',
                                                    borderBottom: 'none',
                                                    animation: 'pulse 2s infinite',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '20px',
                                                    right: '20px',
                                                    width: '40px',
                                                    height: '40px',
                                                    border: '2px solid #00ff00',
                                                    borderLeft: 'none',
                                                    borderBottom: 'none',
                                                    animation: 'pulse 2s infinite 0.5s',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    bottom: '20px',
                                                    left: '20px',
                                                    width: '40px',
                                                    height: '40px',
                                                    border: '2px solid #00ff00',
                                                    borderRight: 'none',
                                                    borderTop: 'none',
                                                    animation: 'pulse 2s infinite 1s',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    bottom: '20px',
                                                    right: '20px',
                                                    width: '40px',
                                                    height: '40px',
                                                    border: '2px solid #00ff00',
                                                    borderLeft: 'none',
                                                    borderTop: 'none',
                                                    animation: 'pulse 2s infinite 1.5s',
                                                }}
                                            />

                                            {/* Additional CSS for LDP Scanner */}
                                            <style>
                                                {`
                                                    @keyframes scanVertical {
                                                        0% { top: 0%; opacity: 0; }
                                                        50% { opacity: 1; }
                                                        100% { top: 100%; opacity: 0; }
                                                    }
                                                    
                                                    @keyframes rotate {
                                                        0% { transform: rotate(0deg); }
                                                        100% { transform: rotate(360deg); }
                                                    }
                                                    
                                                    @keyframes blink {
                                                        0%, 50% { opacity: 0.6; }
                                                        51%, 100% { opacity: 0.2; }
                                                    }
                                                `}
                                            </style>
                                        </div>
                                    ) : (
                                        <iframe
                                            src={analysisToolUrl}
                                            width='100%'
                                            style={{
                                                border: 'none',
                                                display: 'block',
                                                height: '100%',
                                                background: '#f8fafc',
                                            }}
                                            scrolling='yes'
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* ZEUS ANALYSIS TAB - MOVED TO ANALYSIS TOOL */}
                        {/* SIGNALS TAB */}
                        <div
                            label={
                                <>
                                    <SignalsIcon />
                                    <Localize i18n_default_text='Signals' />
                                    <span className='tab-badge'>10</span>
                                </>
                            }
                            id='id-signals'
                        >
                            <ProtectedSignalsCenter />
                        </div>
                        {/* FREE BOTS TAB */}
                        <div
                            label={
                                <>
                                    <FreeBotsIcon />
                                    <Localize i18n_default_text='Free Bots' />
                                </>
                            }
                            id='id-free-bots'
                        >
                            <div
                                className='free-bots-container'
                                style={{
                                    background: '#f5f7fa',
                                    width: '100%',
                                    height: '100%',
                                    padding: '2rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflowY: 'auto',
                                    overflowX: 'hidden',
                                }}
                            >
                                <h2
                                    style={{
                                        color: '#2c3e50',
                                        fontSize: '2rem',
                                        fontWeight: '700',
                                        marginBottom: '2rem',
                                        textAlign: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    🤖 Free Trading Bots
                                </h2>
                                <div
                                    className='free-bots-scroll-container'
                                    style={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        overflowX: 'hidden',
                                    }}
                                >
                                    <ul
                                        className='free-bots__list'
                                        style={{
                                            listStyle: 'none',
                                            padding: 0,
                                            margin: 0,
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                            gap: '1.5rem',
                                            width: '100%',
                                            gridAutoRows: 'min-content',
                                            paddingBottom: '2rem',
                                        }}
                                    >
                                        {bots.length === 0 ? (
                                            <li
                                                style={{
                                                    textAlign: 'center',
                                                    padding: '3rem',
                                                    color: '#6c757d',
                                                    fontSize: '1.1rem',
                                                    gridColumn: '1 / -1',
                                                }}
                                            >
                                                <Localize i18n_default_text='No free bots available.' />
                                            </li>
                                        ) : (
                                            bots.map((bot, index) => (
                                                <li
                                                    key={index}
                                                    className='free-bot-item'
                                                    style={{
                                                        background: '#ffffff',
                                                        borderRadius: '20px',
                                                        padding: '2rem',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '1.5rem',
                                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                                                        transition: 'all 0.3s ease',
                                                        border: 'none',
                                                    }}
                                                >
                                                    <h3
                                                        style={{
                                                            margin: 0,
                                                            color: '#2c3e50',
                                                            fontSize: '1.25rem',
                                                            fontWeight: '700',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px',
                                                        }}
                                                    >
                                                        {bot.title?.replace('.xml', '') || 'Untitled Bot'}
                                                    </h3>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            color: '#7f8c8d',
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '1.2rem' }}>⭐</span>
                                                        <span style={{ fontSize: '1.2rem' }}>⭐</span>
                                                        <span style={{ fontSize: '1.2rem' }}>⭐</span>
                                                        <span style={{ fontSize: '1.2rem' }}>⭐</span>
                                                        <span style={{ fontSize: '1.2rem' }}>⭐</span>
                                                    </div>
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            color: '#7f8c8d',
                                                            fontSize: '0.95rem',
                                                            lineHeight: '1.6',
                                                        }}
                                                    >
                                                        Advanced trading bot. Features automated trading, risk
                                                        management, and profit optimization.
                                                    </p>
                                                    <button
                                                        style={{
                                                            width: '100%',
                                                            padding: '1rem',
                                                            background:
                                                                'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                                            border: 'none',
                                                            borderRadius: '50px',
                                                            color: '#ffffff',
                                                            fontSize: '1rem',
                                                            fontWeight: '600',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '1px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease',
                                                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                                        }}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                            e.currentTarget.style.boxShadow =
                                                                '0 6px 20px rgba(102, 126, 234, 0.6)';
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow =
                                                                '0 4px 15px rgba(102, 126, 234, 0.4)';
                                                        }}
                                                        onClick={() => handleBotClick(bot)}
                                                    >
                                                        Load Free Bot
                                                    </button>
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                    <style>
                                        {`
                                    /* Responsive adjustments */
                                    @media (max-width: 768px) {
                                        .free-bots__list {
                                            grid-template-columns: 1fr !important;
                                            padding: 1rem !important;
                                        }
                                        .free-bot-item h3 {
                                            font-size: 0.95rem !important;
                                            white-space: normal !important;
                                        }
                                        .free-bot-item p {
                                            font-size: 0.8rem !important;
                                        }
                                    }

                                    /* Extra small screens */
                                    @media (max-width: 480px) {
                                        .free-bots__list {
                                            padding: 0.75rem !important;
                                            gap: 0.5rem !important;
                                        }
                                        .free-bot-item {
                                            padding: 0.75rem !important;
                                        }
                                    }
                                `}
                                    </style>
                                </div>
                            </div>
                        </div>

                        {/* STRATEGY ORCHESTRATOR TAB */}
                        <div
                            label={
                                <>
                                    <StrategyOrchestratorIcon />
                                    <Localize i18n_default_text='Strategy Orchestrator' />
                                </>
                            }
                            id='id-strategy-orchestrator'
                        >
                            <StrategyOrchestrator />
                        </div>

                        {/* PREMIUM BOTS TAB - Only visible for whitelisted users */}
                        {isPremium && (
                            <div
                                label={
                                    <>
                                        <PremiumBotsIcon />
                                        <Localize i18n_default_text='Premium Bots' />
                                        <span className='tab-badge' style={{ background: '#ffd700', color: '#1a1a2e' }}>
                                            👑
                                        </span>
                                    </>
                                }
                                id='id-premium-bots'
                            >
                                <div
                                    className='premium-bots-container'
                                    style={{
                                        background: '#f5f7fa',
                                        width: '100%',
                                        height: '100%',
                                        padding: '2rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflowY: 'auto',
                                        overflowX: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '1rem',
                                            marginBottom: '2rem',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <h2
                                            style={{
                                                color: '#2c3e50',
                                                fontSize: '2rem',
                                                fontWeight: '700',
                                                margin: 0,
                                                textAlign: 'center',
                                            }}
                                        >
                                            👑 Premium Trading Bots
                                        </h2>
                                    </div>
                                    <div
                                        className='premium-bots-scroll-container'
                                        style={{
                                            flex: 1,
                                            overflowY: 'auto',
                                            overflowX: 'hidden',
                                        }}
                                    >
                                        <ul
                                            className='premium-bots__list'
                                            style={{
                                                listStyle: 'none',
                                                padding: 0,
                                                margin: 0,
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                                gap: '1.5rem',
                                                width: '100%',
                                                gridAutoRows: 'min-content',
                                                paddingBottom: '2rem',
                                            }}
                                        >
                                            {premiumBots.length === 0 ? (
                                                <li
                                                    style={{
                                                        textAlign: 'center',
                                                        padding: '3rem',
                                                        color: '#ffd700',
                                                        fontSize: '1.1rem',
                                                        gridColumn: '1 / -1',
                                                    }}
                                                >
                                                    <Localize i18n_default_text='No premium bots available.' />
                                                </li>
                                            ) : (
                                                premiumBots.map((bot, index) => (
                                                    <li
                                                        key={index}
                                                        className='premium-bot-item'
                                                        style={{
                                                            background: '#ffffff',
                                                            borderRadius: '20px',
                                                            padding: '2rem',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '1.5rem',
                                                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                                                            transition: 'all 0.3s ease',
                                                            border: 'none',
                                                        }}
                                                    >
                                                        <h3
                                                            style={{
                                                                margin: 0,
                                                                color: '#2c3e50',
                                                                fontSize: '1.25rem',
                                                                fontWeight: '700',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.5px',
                                                            }}
                                                        >
                                                            {bot.title?.replace('.xml', '') || 'Untitled Premium Bot'}
                                                        </h3>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                                color: '#7f8c8d',
                                                            }}
                                                        >
                                                            <span style={{ fontSize: '1.2rem' }}>⭐</span>
                                                            <span style={{ fontSize: '1.2rem' }}>⭐</span>
                                                            <span style={{ fontSize: '1.2rem' }}>⭐</span>
                                                            <span style={{ fontSize: '1.2rem' }}>⭐</span>
                                                            <span style={{ fontSize: '1.2rem' }}>⭐</span>
                                                        </div>
                                                        <p
                                                            style={{
                                                                margin: 0,
                                                                color: '#7f8c8d',
                                                                fontSize: '0.95rem',
                                                                lineHeight: '1.6',
                                                            }}
                                                        >
                                                            Advanced trading bot: AUTO MAX WITH S.L. Features automated
                                                            trading, risk management, and profit optimization.
                                                        </p>
                                                        <button
                                                            style={{
                                                                width: '100%',
                                                                padding: '1rem',
                                                                background:
                                                                    'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                                                border: 'none',
                                                                borderRadius: '50px',
                                                                color: '#ffffff',
                                                                fontSize: '1rem',
                                                                fontWeight: '600',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '1px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.3s ease',
                                                                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                                            }}
                                                            onMouseEnter={e => {
                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                                e.currentTarget.style.boxShadow =
                                                                    '0 6px 20px rgba(102, 126, 234, 0.6)';
                                                            }}
                                                            onMouseLeave={e => {
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow =
                                                                    '0 4px 15px rgba(102, 126, 234, 0.4)';
                                                            }}
                                                            onClick={() => handleBotClick(bot)}
                                                        >
                                                            Load Premium Bot
                                                        </button>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                        <style>
                                            {`
                                            /* Responsive adjustments for premium bots */
                                            @media (max-width: 768px) {
                                                .premium-bots__list {
                                                    grid-template-columns: 1fr !important;
                                                    padding: 1rem !important;
                                                }
                                                .premium-bot-item h3 {
                                                    font-size: 0.95rem !important;
                                                    white-space: normal !important;
                                                }
                                                .premium-bot-item p {
                                                    font-size: 0.8rem !important;
                                                }
                                            }

                                            /* Extra small screens */
                                            @media (max-width: 480px) {
                                                .premium-bots__list {
                                                    padding: 0.75rem !important;
                                                    gap: 0.5rem !important;
                                                }
                                                .premium-bot-item {
                                                    padding: 0.75rem !important;
                                                }
                                            }
                                        `}
                                        </style>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TRACK SCANNER, ANALYZER, CALCULATOR, COPY TRADING - Moved to More Options */}

                        {/* DTRADER TAB */}
                        <div
                            label={
                                <>
                                    <DTraderIcon />
                                    <Localize i18n_default_text='DTrader' />
                                </>
                            }
                            id='id-dtrader'
                        >
                            <DTraderIframe />
                        </div>

                        {/* COPY TRADING TAB */}
                        <div
                            label={
                                <>
                                    <svg
                                        viewBox='0 0 24 24'
                                        style={{ width: '22px', height: '22px', flexShrink: 0 }}
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <style>{`
                                            @keyframes spin-gear-main { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                                            @keyframes spin-gear-small { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
                                            @keyframes spin-gear-tiny { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                                            .gear-main { transform-origin: 12px 12px; animation: spin-gear-main 3s linear infinite; }
                                            .gear-small { transform-origin: 19.5px 4.5px; animation: spin-gear-small 1.8s linear infinite; }
                                            .gear-tiny { transform-origin: 4.5px 19.5px; animation: spin-gear-tiny 2.4s linear infinite; }
                                        `}</style>
                                        <g className='gear-main'>
                                            <circle cx='12' cy='12' r='2.5' fill='none' stroke='currentColor' strokeWidth='1.2' />
                                            <path d='M12 6.5v1.2M12 16.3v1.2M6.5 12H7.7M16.3 12h1.2M8.2 8.2l0.85 0.85M14.95 14.95l0.85 0.85M8.2 15.8l0.85-0.85M14.95 9.05l0.85-0.85' stroke='currentColor' strokeWidth='1.2' strokeLinecap='round' />
                                            <circle cx='12' cy='12' r='4.5' fill='none' stroke='currentColor' strokeWidth='0.6' strokeDasharray='1.5 1' />
                                        </g>
                                        <g className='gear-small'>
                                            <circle cx='19.5' cy='4.5' r='1.4' fill='none' stroke='currentColor' strokeWidth='1' />
                                            <path d='M19.5 2.5v0.7M19.5 5.8v0.7M17.5 4.5h0.7M20.8 4.5h0.7M18.2 3.2l0.5 0.5M20.3 5.3l0.5 0.5M18.2 5.8l0.5-0.5M20.3 3.7l0.5-0.5' stroke='currentColor' strokeWidth='0.9' strokeLinecap='round' />
                                        </g>
                                        <g className='gear-tiny'>
                                            <circle cx='4.5' cy='19.5' r='1.4' fill='none' stroke='currentColor' strokeWidth='1' />
                                            <path d='M4.5 17.5v0.7M4.5 20.8v0.7M2.5 19.5h0.7M5.8 19.5h0.7M3.2 18.2l0.5 0.5M5.3 20.3l0.5 0.5M3.2 20.8l0.5-0.5M5.3 18.7l0.5-0.5' stroke='currentColor' strokeWidth='0.9' strokeLinecap='round' />
                                        </g>
                                        <line x1='16' y1='8' x2='18.2' y2='5.8' stroke='currentColor' strokeWidth='0.6' strokeDasharray='1 0.8' opacity='0.6' />
                                        <line x1='8' y1='16' x2='5.8' y2='18.2' stroke='currentColor' strokeWidth='0.6' strokeDasharray='1 0.8' opacity='0.6' />
                                    </svg>
                                    <Localize i18n_default_text='CopyTrading' />
                                </>
                            }
                            id='id-copycat'
                        >
                            <CopyCatPage />
                        </div>

                        {/* ELVIS ZONE TAB - MOVED TO ANALYSIS TOOL */}

                        {/* TICKSHARK TAB - MOVED TO ANALYSIS TOOL */}
                    </Tabs>
                </div>
            </div>
            <DesktopWrapper>
                <div className='main__run-strategy-wrapper'>
                    <RunStrategy />
                    {showRunPanel && <RunPanel />}
                </div>
                <ChartModal />
                <TradingViewModal />
            </DesktopWrapper>
            <MobileWrapper>
                <RunPanel />
            </MobileWrapper>
            <Dialog
                cancel_button_text={cancel_button_text || localize('Cancel')}
                confirm_button_text={ok_button_text || localize('Ok')}
                has_close_icon
                is_visible={is_dialog_open}
                onCancel={onCancelButtonClick}
                onClose={onCloseDialog}
                onConfirm={onOkButtonClick || onCloseDialog}
                title={title}
            >
                {message}
            </Dialog>
        </>
    );
});

export default AppWrapper;
