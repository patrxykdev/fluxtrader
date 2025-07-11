// frontend/src/components/dashboard/RecentTradesCard.tsx
import React from 'react';
import { recentTradesData } from './data';

const RecentTradesCard: React.FC = () => {
  return (
    <div className="dashboard-card recent-trades-card">
      <div className="card-header">
        <h3>Recent Trades</h3>
      </div>
      <table className="trades-table">
        <thead>
          <tr>
            <th>ASSET</th>
            <th>TYPE</th>
            <th>AMOUNT</th>
            <th>PRICE</th>
            <th>DATE</th>
          </tr>
        </thead>
        <tbody>
          {recentTradesData.map((trade, index) => (
            <tr key={index}>
              <td>{trade.asset}</td>
              <td><span className={`trade-type ${trade.type.toLowerCase()}`}>{trade.type}</span></td>
              <td>{trade.amount}</td>
              <td>{trade.price}</td>
              <td>{trade.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentTradesCard;