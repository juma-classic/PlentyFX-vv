import React, { useState, useEffect, useRef } from 'react';

const SmartAnalysisComponent = () => {
  // State management for all analysis tools
  const [activeCard, setActiveCard] = useState("AUTOLDP");
  const [isTradeActive, setIsTradeActive] = useState(false);
  const [currentTick, setCurrentTick] = useState("Updating...");
  const [allLastDigitList, setAllLastDigitList] = useState([]);
  const [showDigitAnalysis, setShowDigitAnalysis] = useState(true);
  const [activeSymbol, setActiveSymbol] = useState("R_100");
  const [overValue, setOverValue] = useState(4);
  const [underValue, setUnderValue] = useState(4);
  const [martingaleValue, setMartingaleValue] = useState(1.2);
  const [percentageValue, setPercentageValue] = useState(60);
  const [oneClickAmount, setOneClickAmount] = useState(0.5);
  const [oneClickDuration, setOneClickDuration] = useState(1);
  const [takeProfitValue, setTakeProfitValue] = useState(2);
  const [stopLossValue, setStopLossValue] = useState(2);
  const [enableSlTp, setEnableSlTp] = useState(false);
  const [enableMartingale, setEnableMartingale] = useState(true);
  const [tradeOption, setTradeOption] = useState("even");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showMoreSequences, setShowMoreSequences] = useState(false);
  const [showMoreRFSequences, setShowMoreRFSequences] = useState(false);

  // Calculate digit percentages from last 1000 ticks
  const calculateDigitPercentages = () => {
    if (allLastDigitList.length === 0) return Array(10).fill(10);
    
    const recentTicks = allLastDigitList.slice(-1000);
    const digitCounts = Array(10).fill(0);
    
    recentTicks.forEach(tick => {
      const lastDigit = parseInt(Number(tick).toFixed(2).slice(-1), 10);
      digitCounts[lastDigit]++;
    });
    
    return digitCounts.map(count => (count / recentTicks.length) * 100);
  };

  // Calculate even/odd percentages
  const calculateEvenOddPercentages = () => {
    if (allLastDigitList.length === 0) return { even: 50, odd: 50 };
    
    const recentTicks = allLastDigitList.slice(-1000);
    let evenCount = 0;
    
    recentTicks.forEach(tick => {
      const lastDigit = parseInt(Number(tick).toFixed(2).slice(-1), 10);
      if (lastDigit % 2 === 0) evenCount++;
    });
    
    const evenPercentage = (evenCount / recentTicks.length) * 100;
    return {
      even: evenPercentage,
      odd: 100 - evenPercentage
    };
  };

  // Calculate rise/fall percentages
  const calculateRiseFallPercentages = () => {
    if (allLastDigitList.length < 2) return { rise: 50, fall: 50 };
    
    const recentTicks = allLastDigitList.slice(-1000);
    let riseCount = 0;
    
    for (let i = 1; i < recentTicks.length; i++) {
      if (recentTicks[i] > recentTicks[i - 1]) riseCount++;
    }
    
    const risePercentage = (riseCount / (recentTicks.length - 1)) * 100;
    return {
      rise: risePercentage,
      fall: 100 - risePercentage
    };
  };

  const digitPercentages = calculateDigitPercentages();
  const evenOddPercentages = calculateEvenOddPercentages();
  const riseFallPercentages = calculateRiseFallPercentages();
  
  const minPercentage = Math.min(...digitPercentages);
  const maxPercentage = Math.max(...digitPercentages);
  const currentLastDigit = allLastDigitList.length > 0 
    ? parseInt(Number(allLastDigitList[allLastDigitList.length - 1]).toFixed(2).slice(-1), 10) 
    : -1;

  // Get current streak for even/odd
  const getCurrentEvenOddStreak = () => {
    if (allLastDigitList.length === 0) return "No data";
    
    const recentDigits = allLastDigitList.slice(-50).map(tick => 
      parseInt(Number(tick).toFixed(2).slice(-1), 10)
    );
    
    let streak = 1;
    const isEven = recentDigits[recentDigits.length - 1] % 2 === 0;
    
    for (let i = recentDigits.length - 2; i >= 0; i--) {
      if ((recentDigits[i] % 2 === 0) === isEven) {
        streak++;
      } else {
        break;
      }
    }
    
    return `${streak}x ${isEven ? "even" : "odd"}`;
  };

  // Get current streak for rise/fall
  const getCurrentRiseFallStreak = () => {
    if (allLastDigitList.length < 2) return "No data";
    
    const recentTicks = allLastDigitList.slice(-50);
    let streak = 1;
    const isRise = recentTicks[recentTicks.length - 1] > recentTicks[recentTicks.length - 2];
    
    for (let i = recentTicks.length - 2; i >= 1; i--) {
      if ((recentTicks[i] > recentTicks[i - 1]) === isRise) {
        streak++;
      } else {
        break;
      }
    }
    
    return `${streak}x ${isRise ? "rise" : "fall"}`;
  };

  // Handle trade execution
  const handleTrade = (tradeType) => {
    console.log(`Executing ${tradeType} trade with amount: ${oneClickAmount}`);
    // Add your trade execution logic here
  };

  // Toggle trade active state
  const toggleTradeActive = () => {
    setIsTradeActive(!isTradeActive);
  };

  // Simulate tick data (replace with real API integration)
  useEffect(() => {
    const interval = setInterval(() => {
      const newTick = Math.random() * 1000 + 9000; // Simulate volatility 100 index
      setCurrentTick(newTick.toFixed(2));
      setAllLastDigitList(prev => [...prev.slice(-999), newTick]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="smart-analysis-container">
      <div className="analysis-header">
        <h2>Smart Analysis Dashboard</h2>
        <div className="current-price">
          <h3>Current Price</h3>
          <h2>{currentTick}</h2>
        </div>
      </div>

      {/* Volatility 100 Index Analysis - Digit Circles */}
      <div className="digit-analysis-card">
        <div className="card-header">
          <h4>Volatility 100 Index - Digit Analysis</h4>
          <button 
            className="toggle-button"
            onClick={() => setShowDigitAnalysis(!showDigitAnalysis)}
          >
            {showDigitAnalysis ? "Hide" : "Show"}
          </button>
        </div>
        
        {showDigitAnalysis && (
          <div className="digit-circles-container">
            <div className="digit-percentages">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                <div 
                  key={digit}
                  className="digit-circle"
                  style={{
                    color: digit === currentLastDigit ? "#3498db" : 
                           digitPercentages[digit] === minPercentage ? "#e74c3c" : 
                           digitPercentages[digit] === maxPercentage ? "#2ecc71" : "#999",
                    border: `2px solid ${digit === currentLastDigit ? "#3498db" : "#444"}`
                  }}
                >
                  <div className="digit-number">{digit}</div>
                  <div className="digit-percentage">{digitPercentages[digit].toFixed(1)}%</div>
                </div>
              ))}
            </div>
            
            {/* Recent digits sequence */}
            <div className="recent-digits">
              <h4>Recent Last Digits</h4>
              <div className="digit-sequence">
                {allLastDigitList.slice(-10).map((tick, index) => {
                  const digit = parseInt(Number(tick).toFixed(2).slice(-1), 10);
                  return (
                    <div 
                      key={index}
                      className={`digit-box ${digit % 2 === 0 ? "even" : "odd"}`}
                    >
                      {digit}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Even/Odd Analysis */}
      <div className="even-odd-analysis-card">
        <div className="analysis-header">
          <h4>Even/Odd Analysis</h4>
          <div className="current-streak">
            <strong>Current Streak: </strong>{getCurrentEvenOddStreak()}
          </div>
        </div>
        
        <div className="percentages-container">
          <div className="percentage-item even">
            <strong>Even</strong>
            <span>{evenOddPercentages.even.toFixed(1)}%</span>
            <div className="percentage-bar even">
              <div 
                className="bar"
                style={{ width: `${evenOddPercentages.even}%` }}
              ></div>
            </div>
          </div>
          
          <div className="percentage-item odd">
            <strong>Odd</strong>
            <span>{evenOddPercentages.odd.toFixed(1)}%</span>
            <div className="percentage-bar odd">
              <div 
                className="bar"
                style={{ width: `${evenOddPercentages.odd}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Even/Odd Sequence */}
        <div className="sequence-container">
          <div className="sequence-display">
            {allLastDigitList.slice(showMoreSequences ? -50 : -8).map((tick, index) => {
              const digit = parseInt(Number(tick).toFixed(2).slice(-1), 10);
              return (
                <div 
                  key={index}
                  className={`digit-box ${digit % 2 === 0 ? "even" : "odd"}`}
                >
                  {digit % 2 === 0 ? "E" : "O"}
                </div>
              );
            })}
          </div>
          <button 
            className="more-button"
            onClick={() => setShowMoreSequences(!showMoreSequences)}
          >
            {showMoreSequences ? "LESS" : "MORE"}
          </button>
        </div>
      </div>

      {/* Rise/Fall Analysis */}
      <div className="rise-fall-analysis-card">
        <div className="analysis-header">
          <h4>Rise/Fall Analysis</h4>
          <div className="current-streak">
            <strong>Current Streak: </strong>{getCurrentRiseFallStreak()}
          </div>
        </div>
        
        <div className="percentages-container">
          <div className="percentage-item rise">
            <strong>Rise</strong>
            <span>{riseFallPercentages.rise.toFixed(1)}%</span>
            <div className="percentage-bar rise">
              <div 
                className="bar"
                style={{ width: `${riseFallPercentages.rise}%` }}
              ></div>
            </div>
          </div>
          
          <div className="percentage-item fall">
            <strong>Fall</strong>
            <span>{riseFallPercentages.fall.toFixed(1)}%</span>
            <div className="percentage-bar fall">
              <div 
                className="bar"
                style={{ width: `${riseFallPercentages.fall}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Rise/Fall Sequence */}
        <div className="sequence-container">
          <div className="sequence-display">
            {allLastDigitList.slice(showMoreRFSequences ? -50 : -8).map((tick, index) => {
              if (index === 0) return null;
              const prevTick = allLastDigitList[allLastDigitList.length - (showMoreRFSequences ? 50 : 8) + index - 1];
              const isRise = tick > prevTick;
              return (
                <div 
                  key={index}
                  className={`digit-box ${isRise ? "rise" : "fall"}`}
                >
                  {isRise ? "R" : "F"}
                </div>
              );
            })}
          </div>
          <button 
            className="more-button"
            onClick={() => setShowMoreRFSequences(!showMoreRFSequences)}
          >
            {showMoreRFSequences ? "LESS" : "MORE"}
          </button>
        </div>
      </div>

      {/* Turbo Speed AI Bot */}
      <div className="turbo-speed-ai-bot">
        <h3>Turbo Speed AI Bot</h3>
        
        <div className="bot-controls">
          <div className="trade-option-selector">
            <label>Trade Option:</label>
            <select 
              value={tradeOption} 
              onChange={(e) => setTradeOption(e.target.value)}
              disabled={isTradeActive}
            >
              <option value="even">Even</option>
              <option value="odd">Odd</option>
              <option value="over">Over</option>
              <option value="under">Under</option>
              <option value="matches">Matches</option>
              <option value="differs">Differs</option>
            </select>
          </div>

          <div className="amount-input">
            <label>Amount:</label>
            <input 
              type="number" 
              value={oneClickAmount}
              onChange={(e) => setOneClickAmount(parseFloat(e.target.value) || 0)}
              step="0.1"
              min="0.35"
              disabled={isTradeActive}
            />
          </div>

          <div className="duration-input">
            <label>Duration:</label>
            <input 
              type="number" 
              value={oneClickDuration}
              onChange={(e) => setOneClickDuration(parseInt(e.target.value) || 1)}
              min="1"
              max="10"
              disabled={isTradeActive}
            />
          </div>
        </div>

        <div className="bot-actions">
          <button 
            className={`trade-button ${isTradeActive ? "stop" : "start"}`}
            onClick={toggleTradeActive}
          >
            {isTradeActive ? "Stop Bot" : "Start Bot"}
          </button>
          
          <button 
            className="settings-button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            Settings
          </button>
        </div>

        {/* Settings Panel */}
        {isSettingsOpen && (
          <div className="settings-panel">
            <h4>Bot Settings</h4>
            
            <div className="setting-item">
              <label>
                <input 
                  type="checkbox"
                  checked={enableMartingale}
                  onChange={(e) => setEnableMartingale(e.target.checked)}
                />
                Enable Martingale
              </label>
            </div>

            {enableMartingale && (
              <div className="setting-item">
                <label>Martingale Multiplier:</label>
                <input 
                  type="number"
                  value={martingaleValue}
                  onChange={(e) => setMartingaleValue(parseFloat(e.target.value) || 1.2)}
                  step="0.1"
                  min="1.1"
                />
              </div>
            )}

            <div className="setting-item">
              <label>
                <input 
                  type="checkbox"
                  checked={enableSlTp}
                  onChange={(e) => setEnableSlTp(e.target.checked)}
                />
                Enable Take Profit / Stop Loss
              </label>
            </div>

            {enableSlTp && (
              <>
                <div className="setting-item">
                  <label>Take Profit:</label>
                  <input 
                    type="number"
                    value={takeProfitValue}
                    onChange={(e) => setTakeProfitValue(parseFloat(e.target.value) || 2)}
                    step="0.1"
                    min="0.1"
                  />
                </div>
                
                <div className="setting-item">
                  <label>Stop Loss:</label>
                  <input 
                    type="number"
                    value={stopLossValue}
                    onChange={(e) => setStopLossValue(parseFloat(e.target.value) || 2)}
                    step="0.1"
                    min="0.1"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .smart-analysis-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: Arial, sans-serif;
        }

        .analysis-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 15px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 12px;
        }

        .current-price {
          text-align: center;
        }

        .current-price h3 {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .current-price h2 {
          margin: 5px 0 0 0;
          color: #2c3e50;
          font-size: 24px;
          font-weight: bold;
        }

        .digit-analysis-card,
        .even-odd-analysis-card,
        .rise-fall-analysis-card,
        .turbo-speed-ai-bot {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 12px 0 rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .card-header h4 {
          margin: 0;
          color: #2c3e50;
          font-size: 18px;
        }

        .toggle-button {
          background: #3498db;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        .digit-percentages {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .digit-circle {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #f8f9fa;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .digit-number {
          font-size: 24px;
          margin-bottom: 5px;
        }

        .digit-percentage {
          font-size: 12px;
        }

        .recent-digits h4 {
          margin-bottom: 10px;
          color: #2c3e50;
        }

        .digit-sequence,
        .sequence-display {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .digit-box {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          font-weight: bold;
          font-size: 14px;
        }

        .digit-box.even {
          background: #2ecc71;
          color: white;
        }

        .digit-box.odd {
          background: #e74c3c;
          color: white;
        }

        .digit-box.rise {
          background: #2ecc71;
          color: white;
        }

        .digit-box.fall {
          background: #e74c3c;
          color: white;
        }

        .analysis-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .analysis-header h4 {
          margin: 0;
          color: #2c3e50;
        }

        .current-streak {
          color: #666;
          font-size: 14px;
        }

        .percentages-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .percentage-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .percentage-item strong {
          color: #2c3e50;
        }

        .percentage-item span {
          font-weight: bold;
          font-size: 18px;
        }

        .percentage-bar {
          height: 20px;
          background: #f1f2f6;
          border-radius: 10px;
          overflow: hidden;
        }

        .percentage-bar .bar {
          height: 100%;
          transition: width 0.3s ease;
        }

        .percentage-bar.even .bar {
          background: #2ecc71;
        }

        .percentage-bar.odd .bar {
          background: #e74c3c;
        }

        .percentage-bar.rise .bar {
          background: #2ecc71;
        }

        .percentage-bar.fall .bar {
          background: #e74c3c;
        }

        .sequence-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .more-button {
          align-self: flex-start;
          background: #3498db;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }

        .turbo-speed-ai-bot h3 {
          margin: 0 0 20px 0;
          color: #2c3e50;
          font-size: 20px;
        }

        .bot-controls {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .bot-controls label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #2c3e50;
        }

        .bot-controls select,
        .bot-controls input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .bot-actions {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }

        .trade-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .trade-button.start {
          background: #2ecc71;
          color: white;
        }

        .trade-button.stop {
          background: #e74c3c;
          color: white;
        }

        .settings-button {
          background: #3498db;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
        }

        .settings-panel {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .settings-panel h4 {
          margin: 0 0 15px 0;
          color: #2c3e50;
        }

        .setting-item {
          margin-bottom: 15px;
        }

        .setting-item label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          color: #2c3e50;
        }

        .setting-item input[type="checkbox"] {
          width: auto;
        }

        .setting-item input[type="number"] {
          width: 100px;
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-left: 10px;
        }

        @media (max-width: 768px) {
          .digit-percentages {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .bot-controls {
            grid-template-columns: 1fr;
          }
          
          .percentages-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SmartAnalysisComponent;