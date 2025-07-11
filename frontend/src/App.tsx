// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/homepage/HomePage';
import Dashboard from './components/dashboard/Dashboard';
import StrategyBuilder from './components/builder/StrategyBuilder'; // Import the new page
import './App.css'; 
import type { JSX } from 'react';

// A helper component to protect routes that require a login
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    // If no token, redirect to the login page
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const token = localStorage.getItem('accessToken');

  return (
    <BrowserRouter>
      <div className="main-app">
        <Routes>
          {/* If logged in, the root path '/' redirects to the dashboard */}
          {/* If not logged in, the root path '/' shows the HomePage */}
          <Route path="/" element={token ? <Navigate to="/dashboard" /> : <HomePage />} />
          
          {/* Dashboard and Builder pages are protected */}
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/builder" 
            element={<ProtectedRoute><StrategyBuilder /></ProtectedRoute>} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;