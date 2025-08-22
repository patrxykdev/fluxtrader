// frontend/src/components/backtester/TickerSelector.tsx
import React, { useState, useRef, useEffect } from 'react';
import { tickerOptions, categories, searchTickers } from './tickerData';
import type { TickerOption } from './tickerData';
import './TickerSelector.css';

interface TickerSelectorProps {
  value: string;
  onChange: (ticker: string) => void;
  placeholder?: string;
}

const TickerSelector: React.FC<TickerSelectorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Search tickers..." 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current ticker info
  const currentTicker = tickerOptions.find(t => t.symbol === value);

  // Filter tickers based on search and category
  const filteredTickers = selectedCategory === 'All' 
    ? searchTickers(searchQuery)
    : searchTickers(searchQuery).filter(ticker => ticker.category === selectedCategory);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTickerSelect = (ticker: TickerOption) => {
    onChange(ticker.symbol);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className="ticker-selector" ref={dropdownRef}>
      <div className="ticker-input-container">
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={value || placeholder}
          className="ticker-input"
        />
        <button 
          type="button"
          className="ticker-dropdown-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          ▼
        </button>
      </div>

      {isOpen && (
        <div className="ticker-dropdown">
          {/* Category Filter */}
          <div className="category-filter">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="All">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Search Results */}
          <div className="ticker-results">
            {filteredTickers.length === 0 ? (
              <div className="no-results">
                No tickers found for "{searchQuery}"
              </div>
            ) : (
              filteredTickers.map(ticker => (
                <div
                  key={ticker.symbol}
                  className={`ticker-option ${value === ticker.symbol ? 'selected' : ''}`}
                  onClick={() => handleTickerSelect(ticker)}
                >
                  <div className="ticker-symbol">{ticker.symbol}</div>
                  <div className="ticker-info">
                    <div className="ticker-name">{ticker.name}</div>
                    <div className="ticker-category">{ticker.category}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Popular Tickers */}
          {!searchQuery && selectedCategory === 'All' && (
            <div className="popular-tickers">
              <div className="popular-header">Popular Tickers</div>
              <div className="popular-grid">
                {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'SPY', 'QQQ', 'BTCUSD'].map(symbol => {
                  const ticker = tickerOptions.find(t => t.symbol === symbol);
                  if (!ticker) return null;
                  return (
                    <button
                      key={symbol}
                      className={`popular-ticker ${value === symbol ? 'selected' : ''}`}
                      onClick={() => handleTickerSelect(ticker)}
                    >
                      {symbol}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TickerSelector; 