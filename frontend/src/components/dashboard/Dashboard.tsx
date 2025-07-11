// frontend/src/components/dashboard/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import api from '../../api'; // Make sure the path is correct
import StatCard from './StatCard';
import PortfolioPerformanceCard from './PortfolioPerformanceCard';
import ActiveStrategiesCard from './ActiveStrategiesCard';
import RecentTradesCard from './RecentTradesCard.tsx';
import { statCardsData } from './data';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    api.get('/api/profile/')
      .then(response => setUsername(response.data.username))
      .catch(error => console.error("Failed to fetch profile", error));
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.reload();
  };

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-header">
        <div className="header-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12.6111L8 16.6111L13.5 6.61111L17.5 13.1111L20 10.6111" stroke="#0D6EFD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <h1>Flux Trader</h1>
        </div>
        <div className="header-user">
          {/* Placeholder for notification icon */}
          <div className="notification-icon">
            <svg width="24" height="24" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#6C757D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#6C757D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 5.5V5.5C19.8284 5.5 20.5 6.17157 20.5 7C20.5 7.82843 19.8284 8.5 19 8.5" stroke="#dc3545" strokeWidth="2" strokeLinecap="round"/></svg>
            <div className="notification-badge">3</div>
          </div>
          <div className="user-profile">
            <div className="user-avatar-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="user-details">
              <span className="user-name">{username || 'Loading...'}</span>
              <span className="user-role">Trader</span>
            </div>
          </div>
           <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-message">
          <h2>Welcome back, {username || 'User'}!</h2>
          <p>Here's a snapshot of your trading portfolio.</p>
        </div>

        <div className="dashboard-grid">
          {statCardsData.map((card, index) => (
            <StatCard key={index} {...card} />
          ))}
          <PortfolioPerformanceCard />
          <ActiveStrategiesCard />
          <RecentTradesCard />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;