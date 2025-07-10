// frontend/src/components/RegisterForm.tsx
import React, { useState } from 'react';
import api from '../api';
import { AxiosError } from 'axios';
import './AuthForm.css';

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    try {
      await api.post('/api/register/', formData);
      // Registration was successful
      setIsSuccess(true);
      setMessage('Registration successful! You can now log in using the button at the top of the page.');
    } catch (error) {
        const err = error as AxiosError<{ [key: string]: string[] }>;
        // Handle validation errors from the backend (e.g., username taken)
        if (err.response) {
          const errorMessages = Object.values(err.response.data).flat().join(' ');
          setMessage(`Error: ${errorMessages}`);
        } else {
          setMessage('An unknown error occurred. Please try again.');
        }
    }
  };

  // If registration is successful, we show a success message instead of the form.
  if (isSuccess) {
    return (
      <div className="auth-card">
        <h2>Success!</h2>
        <p className="form-success-message">{message}</p>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h2>Create Your Account</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="reg-username">Username</label>
          <input id="reg-username" className="form-input" type="text" name="username" placeholder="Choose a username" onChange={(e) => setFormData({...formData, username: e.target.value})} required />
        </div>
        <div className="form-group">
          <label htmlFor="reg-email">Email Address</label>
          <input id="reg-email" className="form-input" type="email" name="email" placeholder="you@example.com" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
        </div>
        <div className="form-group">
          <label htmlFor="reg-password">Password</label>
          <input id="reg-password" className="form-input" type="password" name="password" placeholder="Create a strong password" onChange={(e) => setFormData({...formData, password: e.target.value})} required />
        </div>
        {message && <p className="form-error-message">{message}</p>}
        <button className="form-button" type="submit">Create Account</button>
      </form>
      {/* The toggle text is removed */}
    </div>
  );
};

export default RegisterForm;