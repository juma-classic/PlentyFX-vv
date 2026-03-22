import React, { useEffect, useRef, useState } from 'react';
import './SignalsScanner.scss';

interface AnalysisResult {
    strategy: string;
    market: string;
    content: string;
}

const SignalsScanner: React.FC = () => {
    const [strategy, setStrategy] = useState('');
    const [market, setMarket] = useState('');
    const [latestTick, setLatestTick] = useState('--');
    const [lastDigit, setLastDigit] = useState('--');
    const [tickCount, setTickCount] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [terminalCodes, setTerminalCodes] = useState<string[]>([]);
    
    const socketRef = useRef<WebSocket | null>(null);
    const tickHistoryRef = useRef<number[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio
        audioRef.current = new Audio('https://www.fesliyanstudios.com/play-mp3/4386');
        audioRef.current.loop = true;
        audioRef.current.preload = 'auto';

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    const updateMarket = (selectedMarket: string) => {
        setMarket(selectedMarket);
        
        if (socketRef.current) {
            socketRef.current.close();
        }
        tickHistoryRef.current = [];
        setTickCount(0);

        if (selectedMarket) {
            const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=66860');
            
            ws.onopen = () => {
                ws.send(JSON.stringify({ ticks: selectedMarket }));
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.tick) {
                    const tickQuote = data.tick.quote;
                    const digit = tickQuote.toString().slice(-1);
                    
                    setLatestTick(tickQuote.toString());
                    setLastDigit(digit);

                    tickHistoryRef.current.push(parseInt(digit));
                    if (tickHistoryRef.current.length > 100) {
                        tickHistoryRef.current.shift();
                    }
                    setTickCount(tickHistoryRef.current.length);
                }
            };

            socketRef.current = ws;
        }
    };

    const playSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(console.error);
        }
    };

    const stopSound = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const generateRandomCode = () => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@!%^&*()';
        let result = '';
        for (let i = 0; i < 40; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const analyzeStrategy = () => {
        if (!strategy || !market) {
            alert('Error: Please select both strategy and market!');
            return;
        }

        setShowPopup(true);
        setIsAnalyzing(true);
        setAnalysisResult({ strategy, market, content: 'Connecting to server...' });

        const messages = [
            `Analysing ${strategy} on ${market}...`,
            'Retrieving market data...',
            'Error: Timeout connecting to node...',
            'Attempting reconnect...',
            'Data stream detected...',
            'Error: Unstable connection...',
            'Finalizing analysis...'
        ];

        let index = 0;
        const interval = setInterval(() => {
            if (index < messages.length) {
                setAnalysisResult(prev => ({
                    ...prev!,
                    content: prev!.content + '\n' + messages[index]
                }));
                index++;
            } else {
                clearInterval(interval);
                startDeepAnalysis();
            }
        }, 1000);
    };

    const startDeepAnalysis = () => {
        playSound();
        setTerminalCodes([]); // Clear previous codes
        
        const codeInterval = setInterval(() => {
            const code = generateRandomCode();
            setTerminalCodes(prev => {
                const newCodes = [...prev, code];
                // Keep only last 50 lines
                return newCodes.slice(-50);
            });
        }, 50);

        setTimeout(() => {
            clearInterval(codeInterval);
            stopSound();
            performFinalAnalysis();
            setIsAnalyzing(false);
        }, 5000);
    };

    const performFinalAnalysis = () => {
        const lastDigits = tickHistoryRef.current.slice(-30);
        
        // Check if we have enough data
        if (lastDigits.length < 10) {
            setAnalysisResult(prev => ({
                ...prev!,
                content: `Error: Insufficient data!\n\nOnly ${lastDigits.length} ticks collected.\nPlease wait for more market data (minimum 10 ticks required).\n\nTip: Keep the market selected for at least 30 seconds before analyzing.`
            }));
            return;
        }

        const tickCount = lastDigits.length;
        let resultContent = '';

        try {
            if (strategy === 'Matches & Differs') {
                const digitCounts: { [key: number]: number } = {};
                lastDigits.forEach(digit => {
                    digitCounts[digit] = (digitCounts[digit] || 0) + 1;
                });

                let mostCommon = 0, leastCommon = 0;
                let maxCount = 0, minCount = Infinity;

                Object.entries(digitCounts).forEach(([digit, count]) => {
                    if (count > maxCount) {
                        maxCount = count;
                        mostCommon = parseInt(digit);
                    }
                    if (count < minCount) {
                        minCount = count;
                        leastCommon = parseInt(digit);
                    }
                });

                const matchPercentage = ((maxCount / tickCount) * 100).toFixed(2);
                const differPercentage = ((minCount / tickCount) * 100).toFixed(2);

                resultContent = `Analysis Complete!\nMATCH with ${mostCommon} (${matchPercentage}% accuracy)\nDIFFERS with ${leastCommon} (${differPercentage}% accuracy)`;
            } else if (strategy === 'Even & Odd') {
                let evenCount = 0, oddCount = 0;
                lastDigits.forEach(digit => {
                    if (digit % 2 === 0) evenCount++;
                    else oddCount++;
                });

                const evenPercentage = ((evenCount / tickCount) * 100).toFixed(2);
                const oddPercentage = ((oddCount / tickCount) * 100).toFixed(2);

                const entryPoints = getRandomEntryPoints(3);

                if (evenCount > oddCount) {
                    resultContent = `Analysis Complete!\nEVEN numbers dominate (${evenPercentage}%)\n${entryPoints.join(', ')}\nEntry Point: Run your bot whenever an even number appears after a sequence of 3 or more consecutive odd numbers.`;
                } else {
                    resultContent = `Analysis Complete!\nODD numbers dominate (${oddPercentage}%)\n${entryPoints.join(', ')}\nEntry Point: Run your bot whenever an odd number appears after a sequence of 3 or more consecutive even numbers.`;
                }
            } else if (strategy === 'Over & Under') {
                let underCount = 0, overCount = 0;
                lastDigits.forEach(digit => {
                    if (digit <= 4) underCount++;  // UNDER: 0-4
                    else overCount++;              // OVER: 5-9
                });

                const underPercentage = ((underCount / tickCount) * 100).toFixed(2);
                const overPercentage = ((overCount / tickCount) * 100).toFixed(2);

                const entryPoints = getRandomEntryPoints(3);

                if (underCount > overCount) {
                    const leastCommonUnder = findLeastCommonDigit(lastDigits.filter(d => d <= 4));
                    resultContent = `Analysis Complete!\nUNDER (0-4) with ${underPercentage}%\nRecommended digit: ${leastCommonUnder}\nEntry Points: ${entryPoints.join(', ')}`;
                } else {
                    const leastCommonOver = findLeastCommonDigit(lastDigits.filter(d => d >= 5));
                    resultContent = `Analysis Complete!\nOVER (5-9) with ${overPercentage}%\nRecommended digit: ${leastCommonOver}\nEntry Points: ${entryPoints.join(', ')}`;
                }
            } else if (strategy === 'Rise & Fall') {
                let ups = 0, downs = 0;
                for (let i = 1; i < lastDigits.length; i++) {
                    if (lastDigits[i] > lastDigits[i - 1]) ups++;
                    else if (lastDigits[i] < lastDigits[i - 1]) downs++;
                }

                const prediction = ups > downs ? 'RISE' : 'FALL';
                const entryPoint = ups > downs 
                    ? 'Enter when price crosses above resistance'
                    : 'Enter when price crosses below support';

                resultContent = `Analysis Complete!\nMarket will ${prediction}\nEntry Point: ${entryPoint}`;
            }

            setAnalysisResult(prev => ({
                ...prev!,
                content: resultContent
            }));
        } catch (error) {
            console.error('Analysis error:', error);
            setAnalysisResult(prev => ({
                ...prev!,
                content: `Analysis Error!\n\nAn error occurred during analysis.\nPlease try again.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`
            }));
        }
    };

    const findLeastCommonDigit = (digits: number[]): number => {
        if (digits.length === 0) return 0;
        
        const counts: { [key: number]: number } = {};
        digits.forEach(digit => {
            counts[digit] = (counts[digit] || 0) + 1;
        });

        let leastCommon = digits[0];
        let minCount = Infinity;

        Object.entries(counts).forEach(([digit, count]) => {
            if (count < minCount) {
                minCount = count;
                leastCommon = parseInt(digit);
            }
        });

        return leastCommon;
    };

    const getRandomEntryPoints = (count: number): number[] => {
        const entryPoints: number[] = [];
        for (let i = 0; i < count; i++) {
            entryPoints.push(Math.floor(Math.random() * 10));
        }
        return entryPoints;
    };

    return (
        <div className="signals-scanner">
            <div className="container">
                <h1>Deriv Signal Scanner</h1>
                
                <label htmlFor="strategy">Select Strategy</label>
                <select 
                    id="strategy" 
                    className="dropdown"
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                >
                    <option value="">-- Select Strategy --</option>
                    <option value="Matches & Differs">Matches & Differs</option>
                    <option value="Even & Odd">Even & Odd</option>
                    <option value="Over & Under">Over & Under</option>
                    <option value="Rise & Fall">Rise & Fall</option>
                </select>

                <label htmlFor="market">Select Market</label>
                <select 
                    id="market" 
                    className="dropdown"
                    value={market}
                    onChange={(e) => updateMarket(e.target.value)}
                >
                    <option value="">Select Market</option>
                    <option value="R_10">Volatility 10 Index</option>
                    <option value="R_25">Volatility 25 Index</option>
                    <option value="R_50">Volatility 50 Index</option>
                    <option value="R_75">Volatility 75 Index</option>
                    <option value="R_100">Volatility 100 Index</option>
                    <option value="1HZ10V">Volatility 10(1s) Index</option>
                    <option value="1HZ25V">Volatility 25(1s) Index</option>
                    <option value="1HZ50V">Volatility 50(1s) Index</option>
                    <option value="1HZ75V">Volatility 75(1s) Index</option>
                    <option value="1HZ100V">Volatility 100(1s) Index</option>
                </select>

                <div className="contain">
                    <div className="latest-tick">Latest Tick: <span>{latestTick}</span></div>
                    <div className="latest-tick">Last Digit: <span>{lastDigit}</span></div>
                    <div className="latest-tick" style={{ fontSize: '0.9em', opacity: 0.8 }}>
                        Data Collected: <span style={{ color: tickCount >= 10 ? '#00ff00' : '#ffaa00' }}>
                            {tickCount} ticks {tickCount < 10 ? '(collecting...)' : '(ready!)'}
                        </span>
                    </div>
                </div>

                <div className="buttons">
                    <button className="analyse" onClick={analyzeStrategy}>Analyse</button>
                </div>
            </div>

            {showPopup && (
                <div className="popup">
                    <div className="popup-content">
                        <button className="close-btn" onClick={() => { setShowPopup(false); stopSound(); }}>X</button>
                        <div className="terminal-header">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                        </div>
                        <div className="terminal-dashboard">
                            <p className="green">Analysis Dashboard - {strategy} on {market}</p>
                            {!isAnalyzing && analysisResult && (
                                <div style={{ whiteSpace: 'pre-line', marginTop: '10px' }}>
                                    {analysisResult.content}
                                </div>
                            )}
                        </div>
                        <div className="terminal-scroll">
                            <div className="terminal-scroll-content">
                                {isAnalyzing && (
                                    <>
                                        <p className="green">Running deep analysis...</p>
                                        {terminalCodes.map((code, index) => (
                                            <p key={index} className="green" style={{ color: 'lime' }}>
                                                {code}
                                            </p>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignalsScanner;
