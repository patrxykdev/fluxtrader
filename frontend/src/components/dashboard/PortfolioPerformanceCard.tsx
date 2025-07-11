// frontend/src/components/dashboard/PortfolioPerformanceCard.tsx
import React from 'react';

const PortfolioPerformanceCard: React.FC = () => {
  return (
    <div className="dashboard-card portfolio-performance-card">
      <div className="card-header">
        <h3>Portfolio Performance</h3>
        <div className="time-range-selector">
          <button>1D</button>
          <button>7D</button>
          <button>1M</button>
          <button className="active">YTD</button>
          <button>ALL</button>
        </div>
      </div>
      <div className="chart-placeholder">
        {/* Placeholder SVG to mimic the look */}
        <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
          <path d="M 0 120 L 50 100 L 100 130 L 150 90 L 200 110 L 250 80 C 275 60, 300 60, 325 80 L 350 120 L 400 90 L 450 140 L 500 110" fill="rgba(13, 110, 253, 0.1)" stroke="#0D6EFD" strokeWidth="2"/>
        </svg>
      </div>
    </div>
  );
};

export default PortfolioPerformanceCard;