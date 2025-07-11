// frontend/src/components/HomePage.tsx
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import Modal from '../Modal' // Import the Modal component
import './HomePage.css';

// The complete feature data array
const features = [
  {
    title: "No-Code Strategy Builder",
    description: "Visually design, build, and connect your trading algorithms. No programming experience required. If you can create a flowchart, you can build a bot.",
    icon: ( 
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    )
  },
  {
    title: "High-Speed Backtesting",
    description: "Validate your strategies against years of historical market data in seconds. Understand your potential performance and refine your approach with confidence.",
    icon: ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> )
  },
  {
    title: "Secure Exchange Integration",
    description: "Connect securely to your favorite exchanges like Binance, Coinbase, and Kraken via API. Your funds never leave your exchange account.",
    icon: ( 
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

// The complete pricing plan data array
const pricingPlans = [
  {
    planName: "Free",
    price: "£0",
    description: "Perfect for getting started and exploring the platform.",
    features: ["Limited Indicators", "Basic back testing timeframes: 1H/4H/1D only", "3 Backtests a day", "Limited to top 10 assets (BTC, ETH, etc.)"],
    recommended: false,
  },
  {
    planName: "Advanced",
    price: "£29.99",
    description: "For the serious trader ready to deploy multiple strategies.",
    features: ["Access to Unlimited Indicators", "Backtesting for all time frames", "100+ Assets including crypto"],
    recommended: true,
  },
  {
    planName: "Professional",
    price: "£44.99",
    description: "Unlock the full power of FluxTrader with unlimited potential.",
    features: ["Unlimited Strategies", "High-Frequency Backtesting", "Priority Support", "API Access"],
    recommended: false,
  }
];

const HomePage: React.FC = () => {
  // THE FIX: The state variables are now correctly defined inside the component
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="homepage-container">
      {/* 1. Top Header with Login Button */}
      <header className="page-header">
        <h1 className="page-title">Flux Trader</h1>
        <p className="hero-motto">Beat the market before it drowns you.</p>
        <div className="motto-line"></div>
        <button className="login-button" onClick={() => setIsLoginModalOpen(true)}>Login</button>
      </header>

      {/* Features Section */}
      <section className="features-container">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="feature-icon-container">{feature.icon}</div>
            <div className="feature-text">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          </div>
        ))}
      </section>
      
       <section className="dive-in-prompt">
        <h2>Ready to Dive In?</h2>
      </section>
      
      {/* Wave Transition */}
      <section className="wave-transition-section">
        <div className="wave-container">
          <svg className="waves" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
            <defs>
              <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
            </defs>
            <g className="parallax">
              <use xlinkHref="#gentle-wave" x="48" y="0" fill="rgba(13, 110, 253, 0.7)" />
              <use xlinkHref="#gentle-wave" x="48" y="3" fill="rgba(13, 110, 253, 0.5)" />
              <use xlinkHref="#gentle-wave" x="48" y="5" fill="rgba(13, 110, 253, 0.3)" />
              <use xlinkHref="#gentle-wave" x="48" y="7" fill="#0D6EFD" />
            </g>
          </svg>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="pricing-header">
          <h2>Choose Your Plan</h2>
          <p>Start for free and scale as you grow. Cancel anytime.</p>
        </div>
        <div className="pricing-cards-container">
          {pricingPlans.map((plan, index) => (
            <div key={index} className={`pricing-card ${plan.recommended ? 'recommended' : ''}`}>
              <div className="plan-name">{plan.planName}</div>
              <div className="plan-price">{plan.price}<span>/ month</span></div>
              <p className="plan-description">{plan.description}</p>
              <ul className="plan-features">
                {plan.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
              <button className="plan-button" onClick={() => setIsRegisterModalOpen(true)}>
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className="page-footer">
        <p>© 2025 Flux Trader Inc. All rights reserved.</p>
      </footer>

      {/* MODALS: These will now work correctly */}
      <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)}>
        <RegisterForm />
      </Modal>
      <Modal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)}>
        <LoginForm />
      </Modal>
    </div>
  );
};

export default HomePage;