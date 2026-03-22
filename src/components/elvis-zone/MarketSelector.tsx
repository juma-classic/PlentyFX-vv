import React, { useState } from 'react';
import './MarketSelector.scss';

interface Market {
    id: string;
    name: string;
    type: string;
}

interface MarketSelectorProps {
    markets: Market[];
    selectedMarket: string;
    onMarketChange: (marketId: string) => void;
    isConnected?: boolean;
}

export const MarketSelector: React.FC<MarketSelectorProps> = ({ markets, selectedMarket, onMarketChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const selectedMarketData = markets.find(m => m.id === selectedMarket);

    const handleMarketSelect = (marketId: string) => {
        onMarketChange(marketId);
        setIsOpen(false);
    };

    return (
        <div className='market-selector'>
            <div className={`selector-button ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <div className='selected-market'>
                    <span className='market-name'>{selectedMarketData?.name || selectedMarket}</span>
                    <span className='market-type'>{selectedMarketData?.type}</span>
                </div>
                <div className='dropdown-arrow'>
                    <svg width='12' height='8' viewBox='0 0 12 8' fill='none'>
                        <path
                            d='M1 1L6 6L11 1'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className='dropdown-menu'>
                    <div className='dropdown-header'>Select Market</div>
                    <div className='market-list'>
                        {markets.map(market => (
                            <div
                                key={market.id}
                                className={`market-item ${market.id === selectedMarket ? 'selected' : ''}`}
                                onClick={() => handleMarketSelect(market.id)}
                            >
                                <div className='market-info'>
                                    <span className='market-name'>{market.name}</span>
                                    <span className='market-id'>{market.id}</span>
                                </div>
                                <span className='market-type-badge'>{market.type}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isOpen && <div className='dropdown-overlay' onClick={() => setIsOpen(false)} />}
        </div>
    );
};
