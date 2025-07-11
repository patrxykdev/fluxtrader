// frontend/src/components/dashboard/ActiveStrategiesCard.tsx
import React from 'react';
import { activeStrategiesData } from './data';

const ActiveStrategiesCard: React.FC = () => {
  return (
    <div className="dashboard-card active-strategies-card">
      <div className="card-header">
        <h3>Active Strategies</h3>
      </div>
      <ul className="strategies-list">
        {activeStrategiesData.map((strategy, index) => (
          <li key={index} className="strategy-item">
            <div className="strategy-info">
              <span className={`status-dot ${strategy.status.toLowerCase()}`}></span>
              <div>
                <span className="strategy-name">{strategy.name}</span>
                <span className="strategy-status">{strategy.status}</span>
              </div>
            </div>
            <span className={`strategy-pnl ${strategy.pnl.startsWith('+') ? 'positive' : 'negative'}`}>
              {strategy.pnl}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActiveStrategiesCard;