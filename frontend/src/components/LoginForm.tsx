// frontend/src/components/LoginForm.tsx
import React, { useState } from 'react';
import api from '../api';
import { AxiosError } from 'axios';
import './AuthForm.css';

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    try {
      // The login endpoint is /api/token/
      const response = await api.post('/api/token/', formData);
      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      // Login was successful, so we reload the page to show the Profile view
      window.location.reload();
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>;
      // Handle common authentication errors from the backend
      if (err.response && err.response.data?.detail) {
        setMessage(`Error: ${err.response.data.detail}`);
      } else {
        setMessage('An unknown error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="auth-card">
      <h2>Login to Flux Trader</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login-username">Username</label>
          <input 
            id="login-username" 
            className="form-input" 
            type="text" 
            name="username" 
            placeholder="Your username"
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <input 
            id="login-password" 
            className="form-input" 
            type="password" 
            name="password" 
            placeholder="Your password"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required 
          />
        </div>
        {message && <p className="form-error-message">{message}</p>}
        <button className="form-button" type="submit">Login</button>
      </form>
      {/* The toggle text is removed */}
    </div>
  );
};

export default LoginForm;