import React, { useState, useEffect } from 'react';
import patelSignalGenerator from '../../../services/patel-signal-generator.service';
import type { PatelSignal, Market, ConfidenceLevel, ContractType } from '../../../types/patel-signals';
import StatsPanel from './StatsPanel';
import MarketSelector from './MarketSelector';
import ConfidenceFilter from './ConfidenceFilter';
import TypeFilter from './TypeFilter';
import LiveTickDisplay from './LiveTickDisplay';
import DigitHeatmap from './DigitHeatmap';
import SignalCard from './SignalCard';
import { RefreshIcon, SettingsIcon, PatelSignalsIcon } from './icons';
import './PatelSignals.scss';

const PatelSignals: React.FC = () => {
  const [signals, setSignals] = useState<PatelSignal[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | 'ALL'>('ALL');
  const [selectedConfidence, setSelectedConfidence] = useState<Set<ConfidenceLevel>>(
    new Set(['HIGH', 'MEDIUM', 'LOW'])
  );
  const [selectedTypes, setSelectedTypes] = useState<Set<ContractType>>(
    new Set(['MATCHES', 'DIFFERS', 'OVER', 'UNDER', 'EVEN', 'ODD'])
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = patelSignalGenerator.subscribe((newSignals) => {
      setSignals(newSignals);
    });

    return () => unsubscribe();
  }, []);

  const filteredSignals = signals.filter((signal) => {
    if (selectedMarket !== 'ALL' && signal.market !== selectedMarket) return false;
    if (!selectedConfidence.has(signal.confidence)) return false;
    if (!selectedTypes.has(signal.type)) return false;
    return true;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const highConfidenceCount = signals.filter((s) => s.confidence === 'HIGH').length;
  const avgConfidence = signals.length > 0
    ? Math.round(signals.reduce((sum, s) => sum + s.confidencePercentage, 0) / signals.length)
    : 0;

  const marketAnalysis = selectedMarket !== 'ALL'
    ? patelSignalGenerator.getMarketAnalysis(selectedMarket)
    : null;

  return (
    <div className="patel-signals">
      {/* Header */}
      <div className="patel-signals__header">
        <div className="patel-signals__header-left">
          <div className="patel-signals__logo">
            <div className="patel-signals__logo-icon">
              <PatelSignalsIcon size={24} />
            </div>
            <div className="patel-signals__logo-text">
              <h1>Patel Signal Generator</h1>
              <p>Real-time Trading Intelligence</p>
            </div>
          </div>
        </div>
        <div className="patel-signals__header-right">
          <button
            className={`patel-signals__btn patel-signals__btn--icon ${isRefreshing ? 'rotating' : ''}`}
            onClick={handleRefresh}
            title="Refresh"
          >
            <RefreshIcon size={20} />
          </button>
          <button className="patel-signals__btn patel-signals__btn--icon" title="Settings">
            <SettingsIcon size={20} />
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      <StatsPanel
        activeSignals={signals.length}
        highConfidence={highConfidenceCount}
        marketsScanned={patelSignalGenerator.getAllMarketAnalysis().length}
        avgConfidence={avgConfidence}
      />

      {/* Filters */}
      <div className="patel-signals__filters">
        <MarketSelector selected={selectedMarket} onSelect={setSelectedMarket} />
        <div className="patel-signals__filters-row">
          <ConfidenceFilter selected={selectedConfidence} onToggle={setSelectedConfidence} />
          <TypeFilter selected={selectedTypes} onToggle={setSelectedTypes} />
        </div>
      </div>

      {/* Main Content */}
      <div className="patel-signals__content">
        {/* Left Column */}
        <div className="patel-signals__left">
          {selectedMarket !== 'ALL' && marketAnalysis && (
            <>
              <LiveTickDisplay market={selectedMarket} />
              <DigitHeatmap analysis={marketAnalysis} />
            </>
          )}
          {selectedMarket === 'ALL' && (
            <div className="patel-signals__all-markets-message">
              <p>Select a specific market to view live tick data and heatmap</p>
            </div>
          )}
        </div>

        {/* Right Column - Signal Cards */}
        <div className="patel-signals__right">
          {filteredSignals.length === 0 ? (
            <div className="patel-signals__no-signals">
              <p>No signals match your current filters</p>
              <p className="patel-signals__no-signals-hint">
                Try adjusting your market, confidence, or type filters
              </p>
            </div>
          ) : (
            <div className="patel-signals__grid">
              {filteredSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatelSignals;
