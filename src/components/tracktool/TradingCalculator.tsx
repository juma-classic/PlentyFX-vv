import React, { useState } from 'react';
import './TradingCalculator.scss';

const TradingCalculator: React.FC = () => {
    const [riskAmount, setRiskAmount] = useState<string>('');
    const [targetProfit, setTargetProfit] = useState<string>('');
    const [numberOfLosses, setNumberOfLosses] = useState<string>('');
    const [result, setResult] = useState<string>('');
    const [showResult, setShowResult] = useState(false);

    const calculateStrategy = () => {
        const risk = parseFloat(riskAmount);
        const profit = parseFloat(targetProfit);
        const losses = parseInt(numberOfLosses);

        if (isNaN(risk) || isNaN(profit) || isNaN(losses)) {
            alert('Please enter valid numbers for all fields.');
            return;
        }

        if (losses <= 0) {
            alert('Number of losses must be at least 1.');
            return;
        }

        const maxAffordableRisk = risk / losses;
        let recommendedTradeAmount: string;

        if (profit <= 0 || maxAffordableRisk <= 0) {
            recommendedTradeAmount = 'Achieving the target profit is not feasible with these parameters.';
        } else {
            const safeTradeAmount = Math.min((profit / (losses + 1)), maxAffordableRisk * 0.8);
            recommendedTradeAmount = `To achieve your target, consider trading around $${safeTradeAmount.toFixed(2)} per trade to stay within risk limits and aim for profitability.`;
        }

        setResult(recommendedTradeAmount);
        setShowResult(true);
    };

    return (
        <div className="trading-calculator">
            <div className="container">
                <h1>Trading Calculator</h1>
                
                <label htmlFor="riskAmount">Risk Amount ($)</label>
                <input
                    type="number"
                    id="riskAmount"
                    placeholder="Enter risk amount"
                    min="1"
                    value={riskAmount}
                    onChange={(e) => setRiskAmount(e.target.value)}
                    required
                />

                <label htmlFor="targetProfit">Target Profit ($)</label>
                <input
                    type="number"
                    id="targetProfit"
                    placeholder="Enter target profit"
                    min="1"
                    value={targetProfit}
                    onChange={(e) => setTargetProfit(e.target.value)}
                    required
                />

                <label htmlFor="numberOfLosses">Number of Losses</label>
                <input
                    type="number"
                    id="numberOfLosses"
                    placeholder="Enter number of losses"
                    min="0"
                    value={numberOfLosses}
                    onChange={(e) => setNumberOfLosses(e.target.value)}
                    required
                />

                <button onClick={calculateStrategy}>Calculate</button>

                {showResult && (
                    <div className="result">
                        {result}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TradingCalculator;
