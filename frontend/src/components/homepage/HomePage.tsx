// frontend/src/components/HomePage.tsx
import React, { useState, useEffect, useRef } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import Modal from '../Modal' // Import the Modal component
import TopNavbar from '../common/TopNavbar';
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

  // Refs for scroll animations on feature cards
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Intersection Observer for fade-in animations on feature cards
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-visible');
        }
      });
    }, observerOptions);

    // Observe all feature cards
    featureRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="homepage-container">
      {/* Persistent Top Navbar */}
      <TopNavbar onLoginClick={() => setIsLoginModalOpen(true)} />
      
      {/* Enhanced Hero Section */}
      <section className="hero-section">
        {/* Background gradient overlay */}
        <div className="hero-background">
          <div className="gradient-overlay"></div>
        </div>
        
        {/* Hero content */}
        <div className="hero-content">
          {/* Announcement banner */}
          <div className="announcement-banner">
            <span>🚀 Introducing live trading soon</span>
            <a href="#features" className="read-more-link">Read more →</a>
          </div>
          
          {/* Main heading */}
          <h1 className="hero-title">
            Beat the market before it <span className="highlight">drowns</span> you
          </h1>
          
          {/* Description */}
          <p className="hero-description">
            Flux Trader empowers you to build, test, and deploy sophisticated trading strategies without writing a single line of code. Create, backtest, and optimize your algorithms with our intuitive no-code platform.
          </p>
          
          {/* Call to action buttons */}
          <div className="hero-actions">
            <button className="cta-primary" onClick={() => {
              const pricingSection = document.getElementById('pricing');
              if (pricingSection) {
                pricingSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}>
              Get started
            </button>
            <a href="#features" className="cta-secondary">
              Learn more →
            </a>
          </div>
        </div>
        
        {/* Floating elements for visual interest */}
        <div className="floating-elements">
          <div className="floating-card floating-card-1">
            <div className="card-icon">📈</div>
            <div className="card-text">Real-time Analytics</div>
          </div>
          <div className="floating-card floating-card-2">
            <div className="card-icon">⚡</div>
            <div className="card-text">Lightning Fast</div>
          </div>
          <div className="floating-card floating-card-3">
            <div className="card-icon">🔒</div>
            <div className="card-text">Bank-grade Security</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-container">
        <div className="section-header">
          <h2>Why Choose Flux Trader?</h2>
          <p>Built by traders, for traders. Experience the future of algorithmic trading.</p>
        </div>
        
        {features.map((feature, index) => (
          <div 
            key={index} 
            ref={(el) => {
              featureRefs.current[index] = el;
            }}
            className="feature-card fade-in-element"
          >
            <div className="feature-icon-container">{feature.icon}</div>
            <div className="feature-text">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          </div>
        ))}
      </section>

      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="section-header">
          <h2>About Flux Trader</h2>
          <p>We're revolutionizing algorithmic trading by making it accessible to everyone</p>
        </div>
        
        <div className="about-content">
          <div className="about-text">
            <h3>Our Mission</h3>
            <p>
              Flux Trader was born from a simple belief: sophisticated trading strategies shouldn't require a computer science degree. 
              We've built a platform that bridges the gap between complex algorithmic trading and intuitive, visual strategy building.
            </p>
            
            <h3>What We Do</h3>
            <p>
              Our no-code platform empowers traders of all skill levels to create, test, and deploy automated trading strategies. 
              From simple moving average crossovers to complex multi-timeframe algorithms, Flux Trader handles the complexity while you focus on strategy.
            </p>
          </div>
          
          <div className="about-stats">
            <div className="stat-card">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">$50M+</div>
              <div className="stat-label">Trading Volume</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">20K+</div>
              <div className="stat-label">Profitable Strategies</div>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Dive In Section */}
      <section className="dive-in-section">
        <div className="dive-in-content">
          <h2 className="dive-in-title">Ready to dive in?</h2>
        </div>
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
      <section id="pricing" className="pricing-section">
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