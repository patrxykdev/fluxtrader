// frontend/src/components/backtester/tickerData.ts

export interface TickerOption {
  symbol: string;
  name: string;
  category: string;
  description?: string;
}

export const tickerOptions: TickerOption[] = [
  // Popular Tech Stocks
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'Technology', description: 'Consumer electronics and software' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'Technology', description: 'Software and cloud services' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'Technology', description: 'Internet services and advertising' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'Technology', description: 'E-commerce and cloud computing' },
  { symbol: 'TSLA', name: 'Tesla Inc.', category: 'Technology', description: 'Electric vehicles and clean energy' },
  { symbol: 'META', name: 'Meta Platforms Inc.', category: 'Technology', description: 'Social media and virtual reality' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'Technology', description: 'Graphics processing and AI' },
  { symbol: 'NFLX', name: 'Netflix Inc.', category: 'Technology', description: 'Streaming entertainment' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', category: 'Technology', description: 'Semiconductor manufacturing' },
  { symbol: 'CRM', name: 'Salesforce Inc.', category: 'Technology', description: 'Customer relationship management' },

  // Financial Stocks
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', category: 'Financial', description: 'Banking and financial services' },
  { symbol: 'BAC', name: 'Bank of America Corp.', category: 'Financial', description: 'Banking and financial services' },
  { symbol: 'WFC', name: 'Wells Fargo & Co.', category: 'Financial', description: 'Banking and financial services' },
  { symbol: 'GS', name: 'Goldman Sachs Group Inc.', category: 'Financial', description: 'Investment banking' },
  { symbol: 'MS', name: 'Morgan Stanley', category: 'Financial', description: 'Investment banking and wealth management' },

  // Healthcare Stocks
  { symbol: 'JNJ', name: 'Johnson & Johnson', category: 'Healthcare', description: 'Pharmaceuticals and medical devices' },
  { symbol: 'PFE', name: 'Pfizer Inc.', category: 'Healthcare', description: 'Pharmaceuticals' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', category: 'Healthcare', description: 'Health insurance and services' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', category: 'Healthcare', description: 'Biopharmaceuticals' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific', category: 'Healthcare', description: 'Life sciences and diagnostics' },

  // Consumer Stocks
  { symbol: 'KO', name: 'The Coca-Cola Company', category: 'Consumer', description: 'Beverages' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', category: 'Consumer', description: 'Consumer goods' },
  { symbol: 'WMT', name: 'Walmart Inc.', category: 'Consumer', description: 'Retail and e-commerce' },
  { symbol: 'HD', name: 'The Home Depot Inc.', category: 'Consumer', description: 'Home improvement retail' },
  { symbol: 'DIS', name: 'The Walt Disney Company', category: 'Consumer', description: 'Entertainment and media' },

  // Energy Stocks
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', category: 'Energy', description: 'Oil and gas' },
  { symbol: 'CVX', name: 'Chevron Corporation', category: 'Energy', description: 'Oil and gas' },
  { symbol: 'COP', name: 'ConocoPhillips', category: 'Energy', description: 'Oil and gas exploration' },

  // Industrial Stocks
  { symbol: 'BA', name: 'Boeing Company', category: 'Industrial', description: 'Aerospace and defense' },
  { symbol: 'CAT', name: 'Caterpillar Inc.', category: 'Industrial', description: 'Construction and mining equipment' },
  { symbol: 'GE', name: 'General Electric Company', category: 'Industrial', description: 'Industrial conglomerate' },

  // Popular ETFs
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', category: 'ETF', description: 'S&P 500 index fund' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', category: 'ETF', description: 'NASDAQ-100 index fund' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', category: 'ETF', description: 'Small-cap stocks' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', category: 'ETF', description: 'Total US stock market' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', category: 'ETF', description: 'S&P 500 index fund' },
  { symbol: 'ARKK', name: 'ARK Innovation ETF', category: 'ETF', description: 'Innovation and technology' },

  // Cryptocurrency
  { symbol: 'BTCUSD', name: 'Bitcoin', category: 'Cryptocurrency', description: 'Digital currency' },
  { symbol: 'ETHUSD', name: 'Ethereum', category: 'Cryptocurrency', description: 'Smart contract platform' },
  { symbol: 'SOLUSD', name: 'Solana', category: 'Cryptocurrency', description: 'Blockchain platform' },
  { symbol: 'ADAUSD', name: 'Cardano', category: 'Cryptocurrency', description: 'Blockchain platform' },
  { symbol: 'DOTUSD', name: 'Polkadot', category: 'Cryptocurrency', description: 'Blockchain interoperability' },

  // Additional Popular Stocks
  { symbol: 'BRK-B', name: 'Berkshire Hathaway Inc.', category: 'Financial', description: 'Conglomerate and insurance' },
  { symbol: 'V', name: 'Visa Inc.', category: 'Financial', description: 'Payment processing' },
  { symbol: 'MA', name: 'Mastercard Inc.', category: 'Financial', description: 'Payment processing' },
  { symbol: 'ADBE', name: 'Adobe Inc.', category: 'Technology', description: 'Creative software' },
  { symbol: 'INTC', name: 'Intel Corporation', category: 'Technology', description: 'Semiconductor manufacturing' },
  { symbol: 'ORCL', name: 'Oracle Corporation', category: 'Technology', description: 'Database and cloud services' },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.', category: 'Technology', description: 'Networking equipment' },
  { symbol: 'IBM', name: 'International Business Machines', category: 'Technology', description: 'Technology and consulting' },
  { symbol: 'VZ', name: 'Verizon Communications Inc.', category: 'Technology', description: 'Telecommunications' },
  { symbol: 'T', name: 'AT&T Inc.', category: 'Technology', description: 'Telecommunications' },
];

export const categories = [
  'Technology',
  'Financial', 
  'Healthcare',
  'Consumer',
  'Energy',
  'Industrial',
  'ETF',
  'Cryptocurrency'
];

export const getTickersByCategory = (category: string) => {
  return tickerOptions.filter(ticker => ticker.category === category);
};

export const searchTickers = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return tickerOptions.filter(ticker => 
    ticker.symbol.toLowerCase().includes(lowerQuery) ||
    ticker.name.toLowerCase().includes(lowerQuery) ||
    ticker.description?.toLowerCase().includes(lowerQuery)
  );
}; 