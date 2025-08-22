import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import ReactECharts from 'echarts-for-react';
import TickerSelector from './TickerSelector';
import './BacktestPage.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO } from 'date-fns';

interface SavedStrategy { id: number; name: string; }
interface BacktestResults { 
  stats: any; 
  plot_data: any; 
  trades: any[]; 
  data_range_info?: {
    warning: boolean;
    message: string;
    requested_range: string;
    available_range: string;
    data_points: number;
    data_source: string;
    coverage_percentage?: number;
  };
}

const BacktestPage: React.FC = () => {
  const [strategies, setStrategies] = useState<SavedStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [ticker, setTicker] = useState('AAPL');
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeframe, setTimeframe] = useState('1d');
  const [cash, setCash] = useState('10000');
  const [leverage, setLeverage] = useState('1');
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<BacktestResults | null>(null);
  const [error, setError] = useState('');
  
  // Date range validation state
  const [availableDateRange, setAvailableDateRange] = useState<{
    available_start: string;
    available_end: string;
    data_points: number;
    data_source: string;
    message: string;
  } | null>(null);
  const [isLoadingDateRange, setIsLoadingDateRange] = useState(false);
  const [dateRangeError, setDateRangeError] = useState('');

  // Helper to parse and format dates for backend
  const parseDate = (date: string | Date) => {
    if (!date) return '';
    if (typeof date === 'string') return date;
    return format(date, 'yyyy-MM-dd');
  };

  // Function to fetch available date range for a ticker
  const fetchAvailableDateRange = async (tickerSymbol: string, currentTimeframe: string) => {
    if (!tickerSymbol.trim()) {
      setAvailableDateRange(null);
      setDateRangeError('');
      return;
    }
    
    setIsLoadingDateRange(true);
    setDateRangeError('');
    
    try {
      const response = await api.get('/api/date-range/', {
        params: {
          ticker: tickerSymbol.trim().toUpperCase(),
          timeframe: currentTimeframe
        }
      });
      
      setAvailableDateRange(response.data);
      setDateRangeError('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Could not determine available date range for this ticker.';
      setDateRangeError(errorMessage);
      setAvailableDateRange(null);
    } finally {
      setIsLoadingDateRange(false);
    }
  };

  // Fetch date range when ticker or timeframe changes
  useEffect(() => {
    if (ticker.trim()) {
      fetchAvailableDateRange(ticker, timeframe);
    }
  }, [ticker, timeframe]);

  // Auto-adjust dates when available date range changes
  useEffect(() => {
    if (availableDateRange && !dateRangeError) {
      const currentStart = new Date(startDate);
      const currentEnd = new Date(endDate);
      const minAvailable = new Date(availableDateRange.available_start);
      const maxAvailable = new Date(availableDateRange.available_end);
      
      let needsUpdate = false;
      let newStartDate = startDate;
      let newEndDate = endDate;
      
      // Adjust start date if it's before available range
      if (currentStart < minAvailable) {
        newStartDate = availableDateRange.available_start;
        needsUpdate = true;
      }
      
      // Adjust end date if it's after available range
      if (currentEnd > maxAvailable) {
        newEndDate = availableDateRange.available_end;
        needsUpdate = true;
      }
      
      // Ensure start date is not after end date
      if (new Date(newStartDate) >= new Date(newEndDate)) {
        newEndDate = availableDateRange.available_end;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        setStartDate(newStartDate);
        setEndDate(newEndDate);
      }
    }
  }, [availableDateRange, dateRangeError]);

  useEffect(() => {
    api.get('/api/strategies/').then(res => {
      console.log('Raw response:', res);
      console.log('Response data:', res.data);
      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);
      setStrategies(res.data);
    }).catch((err) => {
      console.error('Error loading strategies:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      setError('Could not load strategies.');
    });
  }, []);

  const handleRunBacktest = async () => {
    if (!selectedStrategy) {
      setError('Please select a strategy.');
      return;
    }
    
    // Validate inputs
    if (!ticker.trim()) {
      setError('Please enter a ticker symbol.');
      return;
    }
    
    const cashAmount = parseFloat(cash);
    if (isNaN(cashAmount) || cashAmount <= 0) {
      setError('Please enter a valid starting capital amount.');
      return;
    }
    
    const leverageAmount = parseFloat(leverage);
    if (isNaN(leverageAmount) || leverageAmount < 1 || leverageAmount > 10) {
      setError('Leverage must be between 1x and 10x.');
      return;
    }
    
    if (new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setResults(null);
    
    try {
      const response = await api.post('/api/backtest/', {
        strategy_id: selectedStrategy,
        ticker: ticker.trim().toUpperCase(),
        start_date: parseDate(startDate),
        end_date: parseDate(endDate),
        timeframe,
        cash: cashAmount,
        leverage: leverageAmount,
      });
      
      // Check if the response contains an error
      if (response.data.error) {
        setError(response.data.error);
        return;
      }
      
      setResults(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'An unknown error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // ECharts configuration object for the equity curve chart
  const getChartOptions = () => {
    if (!results) return {};
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: results.plot_data.dates },
      yAxis: { type: 'value', scale: true, axisLabel: { formatter: '${value}' } },
      series: [{
          name: 'Portfolio Value',
          type: 'line',
          data: results.plot_data.equity_curve,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#0D6EFD', width: 2 },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: 'rgba(13, 110, 253, 0.3)' }, { offset: 1, color: 'rgba(13, 110, 253, 0)' }]
            }
          }
      }]
    };
  };

  return (
    <div className="backtest-wrapper">
      <header className="backtest-header">
        <Link to="/dashboard" className="back-to-dashboard-button">← Back to Dashboard</Link>
      </header>
      <main className="backtest-content">
        <h1>Backtest a Strategy</h1>
        
        <div className="backtest-setup-card">
          <div className="setup-row">
            <div className="setup-group">
              <label>Strategy</label>
              <select value={selectedStrategy} onChange={(e) => {
                console.log('Strategy selected:', e.target.value);
                setSelectedStrategy(e.target.value);
              }}>
                <option value="" disabled>Select a strategy...</option>
                {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            
            <div className="setup-group">
              <label>Ticker</label>
              <TickerSelector 
                value={ticker} 
                onChange={setTicker}
                placeholder="Search tickers..."
              />
            </div>
            
            <div className="setup-group">
              <label>Timeframe</label>
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                <option value="5m">5 Minute</option>
                <option value="15m">15 Minute</option>
                <option value="1h">1 Hour</option>
                <option value="1d">1 Day</option>
              </select>
            </div>
          </div>
          
          <div className="setup-row">
            <div className="setup-group">
              <label>Start Date</label>
              <DatePicker
                selected={startDate ? parseISO(startDate) : null}
                onChange={date => {
                  if (!date) return;
                  const formatted = format(date, 'yyyy-MM-dd');
                  if (availableDateRange) {
                    const minAvailable = new Date(availableDateRange.available_start);
                    if (date < minAvailable) {
                      setStartDate(availableDateRange.available_start);
                    } else {
                      setStartDate(formatted);
                    }
                  } else {
                    setStartDate(formatted);
                  }
                }}
                minDate={availableDateRange ? parseISO(availableDateRange.available_start) : undefined}
                maxDate={new Date()}
                dateFormat="yyyy-MM-dd"
                disabled={isLoadingDateRange}
                showPopperArrow={false}
                className="custom-datepicker"
                calendarClassName="custom-calendar"
              />
              {availableDateRange && (
                <small className="date-range-info">
                  Data available from {availableDateRange.available_start} to {availableDateRange.available_end}
                  {startDate < availableDateRange.available_start && (
                    <span className="date-warning"> (auto-adjusted to earliest available)</span>
                  )}
                </small>
              )}
            </div>
            
            <div className="setup-group">
              <label>End Date</label>
              <DatePicker
                selected={endDate ? parseISO(endDate) : null}
                onChange={date => {
                  if (!date) return;
                  const formatted = format(date, 'yyyy-MM-dd');
                  if (date > new Date()) {
                    setEndDate(format(new Date(), 'yyyy-MM-dd'));
                  } else {
                    setEndDate(formatted);
                  }
                }}
                minDate={availableDateRange ? parseISO(availableDateRange.available_start) : undefined}
                maxDate={new Date()}
                dateFormat="yyyy-MM-dd"
                disabled={isLoadingDateRange}
                showPopperArrow={false}
                className="custom-datepicker"
                calendarClassName="custom-calendar"
              />
              {availableDateRange && (
                <small className="date-range-info">
                  {availableDateRange.data_points.toLocaleString()} data points available
                  {endDate > availableDateRange.available_end && (
                    <span className="date-warning"> (auto-adjusted to max available)</span>
                  )}
                </small>
              )}
            </div>
            
            <div className="setup-group">
              <label>Starting Capital</label>
              <input type="number" value={cash} onChange={(e) => setCash(e.target.value)} placeholder="$10,000" />
            </div>
            
            <div className="setup-group">
              <label>Leverage</label>
              <select value={leverage} onChange={(e) => setLeverage(e.target.value)}>
                <option value="1">1x (No Leverage)</option>
                <option value="2">2x</option>
                <option value="3">3x</option>
                <option value="5">5x</option>
                <option value="10">10x</option>
              </select>
            </div>
            
            <div className="setup-group">
              <label>&nbsp;</label>
              <button onClick={handleRunBacktest} disabled={isLoading} className="run-backtest-btn">
                {isLoading ? 'Running...' : 'Run Backtest'}
              </button>
            </div>
          </div>
        </div>

        {/* Date range information and errors */}
        {isLoadingDateRange && (
          <div className="info-message">
            🔍 Checking available date range for {ticker}...
          </div>
        )}
        
        {dateRangeError && (
          <div className="warning-message">
            ⚠️ {dateRangeError}
          </div>
        )}
        
        {availableDateRange && !dateRangeError && (
          <div className="success-message">
            ✅ Historical data available from {availableDateRange.available_start} to {availableDateRange.available_end} ({availableDateRange.data_points.toLocaleString()} data points)
            {(startDate < availableDateRange.available_start || endDate > availableDateRange.available_end) && (
              <div className="auto-adjust-notice">
                📅 Dates have been automatically adjusted to available range
              </div>
            )}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {isLoading && <div className="loading-spinner"></div>}

        {results && (
          <div className="results-container">
            <h2>Backtest Results</h2>
            
            {/* Data Range Information */}
            {results.data_range_info && (
              <div className={`data-range-info ${results.data_range_info.warning ? 'warning' : 'success'}`}>
                <div className="data-range-header">
                  <span className="data-range-icon">
                    {results.data_range_info.warning ? '⚠️' : '✅'}
                  </span>
                  <span className="data-range-title">Data Range Information</span>
                </div>
                <div className="data-range-message">{results.data_range_info.message}</div>
                <div className="data-range-details">
                  <div className="data-range-item">
                    <strong>Requested:</strong> {results.data_range_info.requested_range}
                  </div>
                  <div className="data-range-item">
                    <strong>Available:</strong> {results.data_range_info.available_range}
                  </div>
                  {results.data_range_info.coverage_percentage && (
                    <div className="data-range-item">
                      <strong>Coverage:</strong> {results.data_range_info.coverage_percentage}%
                    </div>
                  )}
                  <div className="data-range-item">
                    <strong>Data Points:</strong> {results.data_range_info.data_points.toLocaleString()}
                  </div>
                  <div className="data-range-item">
                    <strong>Source:</strong> {results.data_range_info.data_source}
                  </div>
                </div>
              </div>
            )}
            
            <div className="results-grid">
              {Object.entries(results.stats).map(([key, value]) => (
                <div key={key} className="stat-item">
                  <span>{key.replace(/_/g, ' ').replace('pct', '%')}</span>
                  <strong>{typeof (value as any) === 'number' ? (value as number).toFixed(2) : String(value)}</strong>
                </div>
              ))}
            </div>
            <h3>Equity Curve</h3>
            <div className="chart-container">
              <ReactECharts option={getChartOptions()} style={{ height: '400px', width: '100%' }} notMerge={true} lazyUpdate={true} />
            </div>
            <h3>Trades</h3>
            <div className="trades-table-container">
              <table className="trades-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Portfolio</th>
                    <th>P&L</th>
                    <th>Leverage</th>
                  </tr>
                </thead>
                <tbody>
                  {results.trades.map((trade, index) => {
                    // Determine trade type class
                    const getTradeTypeClass = (type: string) => {
                      const typeLower = type.toLowerCase();
                      if (typeLower.includes('long') && typeLower.includes('exit')) return 'exit-long';
                      if (typeLower.includes('short') && typeLower.includes('exit')) return 'exit-short';
                      if (typeLower.includes('margin call')) return typeLower;
                      return typeLower;
                    };

                    // Determine P&L class
                    const getPnLClass = (pnl: string) => {
                      if (!pnl || pnl === '—' || pnl === 'N/A') return 'neutral';
                      return pnl.includes('+') ? 'profit' : 'loss';
                    };

                    return (
                      <tr key={index}>
                        <td>{trade.Date}</td>
                        <td>
                          <span className={`trade-type ${getTradeTypeClass(trade.Type)}`}>
                            {trade.Type}
                          </span>
                        </td>
                        <td>${typeof trade.Price === 'number' ? trade.Price.toFixed(2) : trade.Price}</td>
                        <td>{trade.Portfolio}</td>
                        <td>
                          <span className={`pnl-value ${getPnLClass(trade['P&L'])}`}>
                            {trade['P&L'] || '—'}
                          </span>
                        </td>
                        <td>{trade.Leverage || '1x'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BacktestPage;