// frontend/src/components/builder/StrategyBuilder.tsx
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import './StrategyBuilder.css';

const StrategyBuilder: React.FC = () => {
  return (
    <div className="builder-wrapper">
      <header className="builder-header">
        <Link to="/dashboard" className="back-to-dashboard-button">
          ← Back to Dashboard
        </Link>
      </header>
      <main className="builder-content">
        <h1>Create your strategy</h1>
        <p>This is where the visual strategy builder will go.</p>
      </main>
    </div>
  );
};

export default StrategyBuilder;