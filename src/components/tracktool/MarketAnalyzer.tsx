import React, { useEffect, useRef, useState } from 'react';
import './MarketAnalyzer.scss';

const MarketAnalyzer: React.FC = () => {
    const [selectedMarket, setSelectedMarket] = useState('R_50');
    const [evenCount, setEvenCount] = useState(0);
    const [oddCount, setOddCount] = useState(0);
    const [overCount, setOverCount] = useState(0);
    const [underCount, setUnderCount] = useState(0);
    const [titleText, setTitleText] = useState('');
    const [typingText, setTypingText] = useState('');
    
    const socketRef = useRef<WebSocket | null>(null);
    const evenOddDigitsRef = useRef<HTMLDivElement>(null);
    const overUnderDigitsRef = useRef<HTMLDivElement>(null);
    const startTimeRef = useRef(Date.now());

    const marketNames: { [key: string]: string } = {
        'R_10': 'Volatility 10 Index',
        'R_25': 'Volatility 25 Index',
        'R_50': 'Volatility 50 Index',
        'R_75': 'Volatility 75 Index',
        'R_100': 'Volatility 100 Index',
        'R_200': 'Volatility 200 Index',
        'R_300': 'Volatility 300 Index',
        'R_10_1s': 'Volatility 10 (1s) Index',
        'R_25_1s': 'Volatility 25 (1s) Index',
        'R_50_1s': 'Volatility 50 (1s) Index',
        'R_75_1s': 'Volatility 75 (1s) Index',
        'R_100_1s': 'Volatility 100 (1s) Index'
    };

    // Animated title effect
    useEffect(() => {
        const titleWords = ['', 'Market', 'Analyser'];
        let titleIndex = 0;

        const animateTitle = () => {
            if (titleIndex < titleWords.length) {
                setTitleText(prev => prev + titleWords[titleIndex] + ' ');
                titleIndex++;
                setTimeout(animateTitle, 500);
            } else {
                setTimeout(() => {
                    setTitleText('');
                    titleIndex = 0;
                    animateTitle();
                }, 2000);
            }
        };

        animateTitle();
    }, []);

    // Typing text effect
    useEffect(() => {
        const message = "Welcome to Support System";
        let typingIndex = 0;

        const typeMessage = () => {
            if (typingIndex < message.length) {
                setTypingText(prev => prev + message.charAt(typingIndex));
                typingIndex++;
                setTimeout(typeMessage, 100);
            } else {
                setTimeout(() => {
                    setTypingText('');
                    typingIndex = 0;
                    typeMessage();
                }, 2000);
            }
        };

        typeMessage();
    }, []);

    // WebSocket connection
    useEffect(() => {
        const appId = '63213';
        const ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${appId}`);

        ws.onopen = () => {
            console.log('Connected to WebSocket');
            ws.send(JSON.stringify({ ticks: selectedMarket }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.msg_type === 'tick') {
                updateData(data.tick.quote);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        socketRef.current = ws;

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, [selectedMarket]);

    const updateData = (tickPrice: number) => {
        const lastDigit = tickPrice.toString().slice(-1);
        const digit = parseInt(lastDigit);
        const currentTime = Date.now();

        // Update Even/Odd
        if (digit % 2 === 0) {
            setEvenCount(prev => prev + 1);
            addDigit(evenOddDigitsRef.current, 'E', 'even-digit');
        } else {
            setOddCount(prev => prev + 1);
            addDigit(evenOddDigitsRef.current, 'O', 'odd-digit');
        }

        // Update Over/Under
        if (digit >= 5) {
            setOverCount(prev => prev + 1);
            addDigit(overUnderDigitsRef.current, 'O', 'over-digit');
        } else {
            setUnderCount(prev => prev + 1);
            addDigit(overUnderDigitsRef.current, 'U', 'under-digit');
        }

        // Reset after 15 minutes
        if (currentTime - startTimeRef.current >= 15 * 60 * 1000) {
            setEvenCount(0);
            setOddCount(0);
            setOverCount(0);
            setUnderCount(0);
            startTimeRef.current = currentTime;
        }
    };

    const addDigit = (container: HTMLDivElement | null, label: string, className: string) => {
        if (!container) return;

        const digitElement = document.createElement('div');
        digitElement.textContent = label;
        digitElement.className = `digit ${className}`;
        container.appendChild(digitElement);

        if (container.children.length > 20) {
            container.removeChild(container.children[0]);
        }
    };

    const handleMarketChange = (market: string) => {
        setSelectedMarket(market);
        setEvenCount(0);
        setOddCount(0);
        setOverCount(0);
        setUnderCount(0);
        startTimeRef.current = Date.now();
    };

    return (
        <div className="market-analyzer">
            <div className="analyzer-container">
                <h1 className="shaking-title">{titleText}</h1>
                <p className="animated-text">{typingText}</p>

                <h2>Select Volatility Market</h2>
                <select 
                    id="volatilityMarket"
                    value={selectedMarket}
                    onChange={(e) => handleMarketChange(e.target.value)}
                >
                    {Object.entries(marketNames).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>

                <h2>Even Odd Analyser</h2>
                <div ref={evenOddDigitsRef} className="digit-display-container"></div>
                <table>
                    <thead>
                        <tr>
                            <th colSpan={3}>Even Odd Analyser</th>
                        </tr>
                        <tr>
                            <th>Market</th>
                            <th>Even</th>
                            <th>Odd</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{marketNames[selectedMarket]}</td>
                            <td>{evenCount}</td>
                            <td>{oddCount}</td>
                        </tr>
                    </tbody>
                </table>

                <h2>Over and Under Analyser</h2>
                <div ref={overUnderDigitsRef} className="digit-display-container"></div>
                <table>
                    <thead>
                        <tr>
                            <th colSpan={3}>Over and Under Analyser</th>
                        </tr>
                        <tr>
                            <th>Market</th>
                            <th>Over</th>
                            <th>Under</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{marketNames[selectedMarket]}</td>
                            <td>{overCount}</td>
                            <td>{underCount}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MarketAnalyzer;
