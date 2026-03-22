import React, { useEffect, useState, useRef } from 'react';
import './ModernLoader.scss';

interface ModernLoaderProps {
    onFinish: () => void;
}

const ModernLoader: React.FC<ModernLoaderProps> = ({ onFinish }) => {
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState('Initializing');
    const [dots, setDots] = useState('');
    const [tradingTip, setTradingTip] = useState('');
    const [lightningActive, setLightningActive] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Trading tips and motivational quotes
    const tradingTips = [
        'Building wealth through smart trading',
        'Your trusted partner in market success',
        'Professional trading strategies for everyone',
        'Precision trading, consistent results',
        'Quality execution in every trade',
        'Navigate markets with confidence',
        'Fast execution, reliable returns',
        'Growing your portfolio steadily',
        'Zeus Trading Hub - Your path to financial freedom',
        'Elevate your trading experience',
    ];

    // Lightning-themed background animation with blue tech lines
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Detect mobile device
        const isMobile = window.innerWidth <= 768;
        
        // Blue tech lines moving from right to left
        const techLineCount = isMobile ? 15 : 30;
        const techLines: Array<{
            x: number;
            y: number;
            length: number;
            speed: number;
            opacity: number;
            thickness: number;
            color: string;
        }> = [];

        const blueShades = ['#00BFFF', '#1E90FF', '#4169E1', '#0080FF', '#00CED1', '#5F9EA0'];
        
        for (let i = 0; i < techLineCount; i++) {
            techLines.push({
                x: Math.random() * canvas.width + canvas.width,
                y: Math.random() * canvas.height,
                length: Math.random() * 150 + 50,
                speed: Math.random() * 3 + 2,
                opacity: Math.random() * 0.6 + 0.3,
                thickness: Math.random() * 2 + 1,
                color: blueShades[Math.floor(Math.random() * blueShades.length)],
            });
        }

        // Lightning bolts
        const lightningBolts: Array<{
            x: number;
            y: number;
            segments: Array<{ x: number; y: number }>;
            opacity: number;
            lifetime: number;
        }> = [];

        // Electric particles
        const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            opacity: number;
            color: string;
        }> = [];

        const particleCount = isMobile ? 30 : 60;
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.2,
                color: blueShades[Math.floor(Math.random() * blueShades.length)],
            });
        }

        // Grid lines for tech effect
        const gridSpacing = isMobile ? 50 : 40;
        const gridOpacity = 0.1;

        const draw = () => {
            // Dark blue gradient background
            const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            bgGradient.addColorStop(0, 'rgba(5, 10, 30, 0.98)');
            bgGradient.addColorStop(0.5, 'rgba(10, 15, 40, 0.98)');
            bgGradient.addColorStop(1, 'rgba(15, 20, 50, 0.98)');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw tech grid
            ctx.globalAlpha = gridOpacity;
            ctx.strokeStyle = '#00BFFF';
            ctx.lineWidth = 0.5;

            // Vertical grid lines
            for (let x = 0; x < canvas.width; x += gridSpacing) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }

            // Horizontal grid lines
            for (let y = 0; y < canvas.height; y += gridSpacing) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            ctx.globalAlpha = 1;

            // Draw blue tech lines moving from right to left
            techLines.forEach(line => {
                ctx.globalAlpha = line.opacity;
                ctx.strokeStyle = line.color;
                ctx.lineWidth = line.thickness;
                ctx.shadowBlur = 15;
                ctx.shadowColor = line.color;

                // Draw horizontal line
                ctx.beginPath();
                ctx.moveTo(line.x, line.y);
                ctx.lineTo(line.x - line.length, line.y);
                ctx.stroke();

                // Draw arrow head at the front
                const arrowSize = 5;
                ctx.fillStyle = line.color;
                ctx.beginPath();
                ctx.moveTo(line.x - line.length, line.y);
                ctx.lineTo(line.x - line.length + arrowSize, line.y - arrowSize);
                ctx.lineTo(line.x - line.length + arrowSize, line.y + arrowSize);
                ctx.closePath();
                ctx.fill();

                // Move line from right to left
                line.x -= line.speed;

                // Reset when off screen
                if (line.x - line.length < 0) {
                    line.x = canvas.width + line.length;
                    line.y = Math.random() * canvas.height;
                    line.color = blueShades[Math.floor(Math.random() * blueShades.length)];
                }
            });

            ctx.shadowBlur = 0;

            // Draw electric particles
            particles.forEach(particle => {
                ctx.globalAlpha = particle.opacity;
                ctx.fillStyle = particle.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = particle.color;

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();

                // Move particles
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Bounce off edges
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

                // Keep particles in bounds
                particle.x = Math.max(0, Math.min(canvas.width, particle.x));
                particle.y = Math.max(0, Math.min(canvas.height, particle.y));
            });

            ctx.shadowBlur = 0;

            // Randomly spawn lightning bolts
            if (Math.random() < 0.02) {
                const startX = Math.random() * canvas.width;
                const startY = 0;
                const segments: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
                
                let currentX = startX;
                let currentY = startY;
                const segmentCount = 8 + Math.floor(Math.random() * 5);

                for (let i = 0; i < segmentCount; i++) {
                    currentX += (Math.random() - 0.5) * 60;
                    currentY += canvas.height / segmentCount + Math.random() * 20;
                    segments.push({ x: currentX, y: currentY });
                }

                lightningBolts.push({
                    x: startX,
                    y: startY,
                    segments,
                    opacity: 1,
                    lifetime: 15,
                });
            }

            // Draw and update lightning bolts
            lightningBolts.forEach((bolt, index) => {
                ctx.globalAlpha = bolt.opacity;
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 3;
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#00BFFF';

                ctx.beginPath();
                bolt.segments.forEach((segment, i) => {
                    if (i === 0) {
                        ctx.moveTo(segment.x, segment.y);
                    } else {
                        ctx.lineTo(segment.x, segment.y);
                    }
                });
                ctx.stroke();

                // Draw glow
                ctx.lineWidth = 6;
                ctx.globalAlpha = bolt.opacity * 0.3;
                ctx.strokeStyle = '#00BFFF';
                ctx.beginPath();
                bolt.segments.forEach((segment, i) => {
                    if (i === 0) {
                        ctx.moveTo(segment.x, segment.y);
                    } else {
                        ctx.lineTo(segment.x, segment.y);
                    }
                });
                ctx.stroke();

                // Update lifetime
                bolt.lifetime--;
                bolt.opacity = bolt.lifetime / 15;

                // Remove dead bolts
                if (bolt.lifetime <= 0) {
                    lightningBolts.splice(index, 1);
                }
            });

            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        };

        const interval = setInterval(draw, 33);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Select random tip
        const randomTip = tradingTips[Math.floor(Math.random() * tradingTips.length)];
        setTradingTip(randomTip);

        // Multi-phase loading system
        const loadingPhases = [
            { duration: 1000, text: 'Initializing Platform', progress: 15 },
            { duration: 800, text: 'Loading Market Data', progress: 30 },
            { duration: 1200, text: 'Connecting to Markets', progress: 50 },
            { duration: 900, text: 'Activating Trading Signals', progress: 70 },
            { duration: 700, text: 'Loading Strategies', progress: 85 },
            { duration: 600, text: 'Preparing Dashboard', progress: 95 },
            { duration: 500, text: 'Welcome to Zeus Trading Hub', progress: 100 },
        ];

        let currentPhase = 0;

        const executePhase = () => {
            if (currentPhase < loadingPhases.length) {
                const phase = loadingPhases[currentPhase];
                setLoadingText(phase.text);

                // Smooth progress animation
                const startProgress = progress;
                const targetProgress = phase.progress;
                const duration = phase.duration;
                const startTime = Date.now();

                const animateProgress = () => {
                    const elapsed = Date.now() - startTime;
                    const progressRatio = Math.min(elapsed / duration, 1);
                    const easeOutQuart = 1 - Math.pow(1 - progressRatio, 4);
                    const currentProgress = startProgress + (targetProgress - startProgress) * easeOutQuart;

                    setProgress(currentProgress);

                    if (progressRatio < 1) {
                        requestAnimationFrame(animateProgress);
                    } else {
                        currentPhase++;
                        if (currentPhase < loadingPhases.length) {
                            setTimeout(executePhase, 100);
                        } else {
                            setTimeout(onFinish, 800);
                        }
                    }
                };

                requestAnimationFrame(animateProgress);
            }
        };

        executePhase();

        // Dots animation
        let dotCount = 0;
        const dotInterval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            setDots('.'.repeat(dotCount));
        }, 400);

        // Lightning strike effect
        const lightningInterval = setInterval(() => {
            setLightningActive(true);
            setTimeout(() => setLightningActive(false), 200);
        }, 2000);

        return () => {
            clearInterval(dotInterval);
            clearInterval(lightningInterval);
        };
    }, [onFinish]);

    return (
        <div className='modern-loader zeus-loader'>
            {/* Matrix-style falling money and code background */}
            <canvas ref={canvasRef} className='zeus-loader__matrix-canvas' />

            {/* Lightning flash overlay */}
            <div className={`zeus-loader__lightning-flash ${lightningActive ? 'active' : ''}`} />

            {/* Dark storm clouds background */}
            <div className='zeus-loader__storm-bg'>
                <div className='zeus-loader__cloud zeus-loader__cloud--1' />
                <div className='zeus-loader__cloud zeus-loader__cloud--2' />
                <div className='zeus-loader__cloud zeus-loader__cloud--3' />
            </div>

            {/* Main content */}
            <div className='zeus-loader__content'>
                {/* Zeus Trading Hub Logo - Animated Globe */}
                <div className='zeus-loader__logo-container'>
                    <svg 
                        className='zeus-loader__logo globe-logo'
                        viewBox="0 0 200 200"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Definitions for gradients and effects */}
                        <defs>
                            <linearGradient id="globeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#00BFFF" stopOpacity="0.8" />
                                <stop offset="50%" stopColor="#0080FF" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="#0050CC" stopOpacity="0.8" />
                            </linearGradient>
                            <linearGradient id="orbitGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#00BFFF" stopOpacity="0.2" />
                                <stop offset="50%" stopColor="#00BFFF" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#00BFFF" stopOpacity="0.2" />
                            </linearGradient>
                            <linearGradient id="orbitGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#FF4444" stopOpacity="0.2" />
                                <stop offset="50%" stopColor="#FF4444" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#FF4444" stopOpacity="0.2" />
                            </linearGradient>
                            <radialGradient id="glowGradient">
                                <stop offset="0%" stopColor="#00BFFF" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#00BFFF" stopOpacity="0" />
                            </radialGradient>
                        </defs>

                        {/* Outer glow */}
                        <circle cx="100" cy="100" r="70" fill="url(#glowGradient)" className="globe-glow" />

                        {/* Main globe sphere */}
                        <circle cx="100" cy="100" r="45" fill="url(#globeGradient)" stroke="#00BFFF" strokeWidth="1" opacity="0.9" />

                        {/* Globe latitude lines */}
                        <ellipse cx="100" cy="100" rx="45" ry="10" fill="none" stroke="#00BFFF" strokeWidth="0.5" opacity="0.4" />
                        <ellipse cx="100" cy="100" rx="45" ry="20" fill="none" stroke="#00BFFF" strokeWidth="0.5" opacity="0.3" />
                        <ellipse cx="100" cy="100" rx="45" ry="30" fill="none" stroke="#00BFFF" strokeWidth="0.5" opacity="0.3" />

                        {/* Globe longitude lines */}
                        <ellipse cx="100" cy="100" rx="10" ry="45" fill="none" stroke="#00BFFF" strokeWidth="0.5" opacity="0.4" />
                        <ellipse cx="100" cy="100" rx="20" ry="45" fill="none" stroke="#00BFFF" strokeWidth="0.5" opacity="0.3" />
                        <ellipse cx="100" cy="100" rx="30" ry="45" fill="none" stroke="#00BFFF" strokeWidth="0.5" opacity="0.3" />
                        
                        {/* Central meridian */}
                        <line x1="100" y1="55" x2="100" y2="145" stroke="#00BFFF" strokeWidth="0.5" opacity="0.5" />
                        
                        {/* Equator */}
                        <line x1="55" y1="100" x2="145" y2="100" stroke="#00BFFF" strokeWidth="0.5" opacity="0.5" />

                        {/* Continents (simplified) */}
                        <path d="M 85 85 Q 90 80, 95 85 L 100 90 L 95 95 Z" fill="#00BFFF" opacity="0.6" />
                        <path d="M 105 95 Q 110 90, 115 95 L 120 100 L 115 105 Z" fill="#00BFFF" opacity="0.6" />
                        <path d="M 90 110 Q 95 105, 100 110 L 105 115 L 100 120 Z" fill="#00BFFF" opacity="0.6" />

                        {/* Orbit 1 - Horizontal (Cyan) */}
                        <g className="orbit-1">
                            <ellipse cx="100" cy="100" rx="65" ry="15" fill="none" stroke="url(#orbitGradient1)" strokeWidth="2" opacity="0.6" />
                            {/* Orbit particle 1 */}
                            <circle cx="165" cy="100" r="3" fill="#00BFFF" className="orbit-particle-1">
                                <animateMotion
                                    dur="4s"
                                    repeatCount="indefinite"
                                    path="M 0,0 m -65,0 a 65,15 0 1,0 130,0 a 65,15 0 1,0 -130,0"
                                />
                            </circle>
                        </g>

                        {/* Orbit 2 - Tilted (Red) */}
                        <g className="orbit-2" transform="rotate(60 100 100)">
                            <ellipse cx="100" cy="100" rx="65" ry="15" fill="none" stroke="url(#orbitGradient2)" strokeWidth="2" opacity="0.6" />
                            {/* Orbit particle 2 */}
                            <circle cx="165" cy="100" r="3" fill="#FF4444" className="orbit-particle-2">
                                <animateMotion
                                    dur="3s"
                                    repeatCount="indefinite"
                                    path="M 0,0 m -65,0 a 65,15 0 1,0 130,0 a 65,15 0 1,0 -130,0"
                                />
                            </circle>
                        </g>

                        {/* Center core glow */}
                        <circle cx="100" cy="100" r="8" fill="#00BFFF" opacity="0.8" className="core-pulse" />
                        <circle cx="100" cy="100" r="5" fill="#FFFFFF" opacity="0.9" />
                    </svg>
                    <div className='zeus-loader__logo-glow' />
                    <div className='zeus-loader__logo-glow zeus-loader__logo-glow--secondary' />
                </div>

                {/* Zeus Lightning Bolt Icon */}
                <div className='zeus-loader__lightning-container' style={{ display: 'none' }}>
                    {/* Animated lightning bolt with intricate parts */}
                    <svg
                        className='zeus-loader__lightning-bolt'
                        viewBox='0 0 200 300'
                        xmlns='http://www.w3.org/2000/svg'
                    >
                        <defs>
                            <linearGradient id='lightningGradient' x1='0%' y1='0%' x2='0%' y2='100%'>
                                <stop offset='0%' stopColor='#FFD700' />
                                <stop offset='50%' stopColor='#FFA500' />
                                <stop offset='100%' stopColor='#FF6B00' />
                            </linearGradient>
                            <filter id='glow'>
                                <feGaussianBlur stdDeviation='4' result='coloredBlur' />
                                <feMerge>
                                    <feMergeNode in='coloredBlur' />
                                    <feMergeNode in='SourceGraphic' />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Main lightning bolt */}
                        <path
                            className='zeus-loader__bolt-main'
                            d='M100 10 L80 100 L120 100 L90 180 L130 120 L100 120 L110 60 Z'
                            fill='url(#lightningGradient)'
                            filter='url(#glow)'
                        />

                        {/* Electric arcs - animated parts */}
                        <path
                            className='zeus-loader__bolt-arc zeus-loader__bolt-arc--1'
                            d='M85 50 Q70 60 75 80'
                            stroke='#4169E1'
                            strokeWidth='2'
                            fill='none'
                            opacity='0.8'
                        />
                        <path
                            className='zeus-loader__bolt-arc zeus-loader__bolt-arc--2'
                            d='M115 70 Q130 80 125 100'
                            stroke='#00BFFF'
                            strokeWidth='2'
                            fill='none'
                            opacity='0.8'
                        />
                        <path
                            className='zeus-loader__bolt-arc zeus-loader__bolt-arc--3'
                            d='M95 130 Q80 140 85 160'
                            stroke='#FFD700'
                            strokeWidth='2'
                            fill='none'
                            opacity='0.8'
                        />

                        {/* Energy particles */}
                        {[...Array(8)].map((_, i) => (
                            <circle
                                key={i}
                                className='zeus-loader__energy-particle'
                                cx={100 + Math.cos((i * Math.PI) / 4) * 40}
                                cy={100 + Math.sin((i * Math.PI) / 4) * 40}
                                r='3'
                                fill='#FFD700'
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
                        ))}

                        {/* Rotating energy ring */}
                        <circle
                            className='zeus-loader__energy-ring'
                            cx='100'
                            cy='100'
                            r='60'
                            fill='none'
                            stroke='#4169E1'
                            strokeWidth='2'
                            strokeDasharray='10 5'
                            opacity='0.5'
                        />
                    </svg>

                    {/* Pulsing glow effect */}
                    <div className='zeus-loader__lightning-glow' />
                    <div className='zeus-loader__lightning-glow zeus-loader__lightning-glow--secondary' />
                </div>

                {/* Brand name */}
                <h1 className='zeus-loader__brand'>
                    <span className='zeus-loader__brand-zeus'>ZEUS</span>
                    <span className='zeus-loader__brand-trading'>TRADING HUB</span>
                </h1>

                <p className='zeus-loader__tagline'>Professional Trading Platform</p>

                {/* Loading text */}
                <div className='zeus-loader__text-container'>
                    <div className='zeus-loader__text'>
                        {loadingText}
                        {dots}
                    </div>
                </div>

                {/* Progress bar with electric effect */}
                <div className='zeus-loader__progress-container'>
                    <div className='zeus-loader__progress-label'>
                        <span>Power Level</span>
                        <span className='zeus-loader__progress-percentage'>{Math.round(Math.min(progress, 100))}%</span>
                    </div>
                    <div className='zeus-loader__progress-bar'>
                        <div className='zeus-loader__progress-fill' style={{ width: `${Math.min(progress, 100)}%` }}>
                            <div className='zeus-loader__progress-lightning' />
                        </div>
                    </div>
                </div>

                {/* Trading Tip */}
                <div className='zeus-loader__trading-tip'>
                    <div className='zeus-loader__tip-icon'>
                        <svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                            <defs>
                                <linearGradient id='iconGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
                                    <stop offset='0%' stopColor='#FFD700' />
                                    <stop offset='100%' stopColor='#FFA500' />
                                </linearGradient>
                            </defs>
                            {/* Mechanical gear icon */}
                            <circle cx='12' cy='12' r='3' fill='url(#iconGradient)' />
                            <path
                                d='M12 1L13.5 4.5L17 3L16 6.5L19.5 7.5L17.5 10.5L21 12L17.5 13.5L19.5 16.5L16 17.5L17 21L13.5 19.5L12 23L10.5 19.5L7 21L8 17.5L4.5 16.5L6.5 13.5L3 12L6.5 10.5L4.5 7.5L8 6.5L7 3L10.5 4.5L12 1Z'
                                fill='url(#iconGradient)'
                                opacity='0.6'
                            />
                            {/* Inner mechanical details */}
                            <circle cx='12' cy='12' r='5' fill='none' stroke='#FFD700' strokeWidth='0.5' />
                            <circle cx='12' cy='12' r='7' fill='none' stroke='#FFA500' strokeWidth='0.3' />
                        </svg>
                    </div>
                    <p className='zeus-loader__tip-text'>{tradingTip}</p>
                </div>
            </div>
        </div>
    );
};

export default ModernLoader;
