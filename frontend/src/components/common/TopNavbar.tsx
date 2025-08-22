import React, { useState, useEffect } from 'react';
import './TopNavbar.css';

interface TopNavbarProps {
  onLoginClick: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ onLoginClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`top-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-content">
        <div className="navbar-brand">
          <div className="brand-logo">
            <img 
              src="/flux.png" 
              alt="FluxTrader Logo" 
              className="logo-image"
            />
          </div>
          <span className="brand-text">FluxTrader</span>
        </div>
        
        <div className="navbar-links">
          <a href="#features" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>
            Features
          </a>
          <a href="#about" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>
            About Us
          </a>
        </div>
        
        <div className="navbar-actions">
          <button className="get-started-btn" onClick={() => scrollToSection('features')}>
            Get Started
          </button>
          <button className="login-btn" onClick={onLoginClick}>
            Login
          </button>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;
