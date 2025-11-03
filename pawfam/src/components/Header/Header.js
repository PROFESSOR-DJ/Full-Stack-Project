import React, { useState } from 'react';
import './Header.css';

const Header = ({ onNavigate, isLoggedIn, onLogout, user }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAuthMenu, setShowAuthMenu] = useState(false);

  return (
    <header className="header">
      <nav className="header-nav container">
        <div className="logo-container" onClick={() => onNavigate('landing')}>
          <span className="logo-text">PawFam</span>
        </div>
        <div className="mobile-menu-btn">
          <button onClick={() => setMenuOpen(!menuOpen)} className="menu-toggle">
            <svg xmlns="http://www.w3.org/2000/svg" className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
        <div className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
          {/* Customer Navigation */}
          {(!isLoggedIn || user?.role === 'customer') && (
            <>
              <a href="#" className="nav-link" onClick={() => onNavigate('services')}>Centers</a>
              <a href="#" className="nav-link" onClick={() => onNavigate('accessories')}>Accessories</a>
              <a href="#" className="nav-link" onClick={() => onNavigate('adoption')}>Adoption</a>
            </>
          )}

          {/* Vendor Navigation */}
          {isLoggedIn && user?.role === 'vendor' && (
            <>
              <a href="#" className="nav-link" onClick={() => onNavigate('vendor-dashboard')}>Dashboard</a>
              <a href="#" className="nav-link" onClick={() => onNavigate('vendor-daycare')}>Daycare</a>
              <a href="#" className="nav-link" onClick={() => onNavigate('vendor-adoption')}>Adoption</a>
              <a href="#" className="nav-link" onClick={() => onNavigate('vendor-accessories')}>Accessories</a>
              <a href="#" className="nav-link" onClick={() => onNavigate('vendor-profile')}>Profile</a>
            </>
          )}

          {/* Customer-specific links when logged in */}
          {isLoggedIn && user?.role === 'customer' && (
            <>
              <a href="#" className="nav-link" onClick={() => onNavigate('dashboard')}>Dashboard</a>
              <a href="#" className="nav-link" onClick={() => onNavigate('bookings')}>Bookings</a>
              <a href="#" className="nav-link" onClick={() => onNavigate('profile')}>Profile</a>
            </>
          )}

          {/* Auth section */}
          {isLoggedIn ? (
            <div className="user-menu">
              <span className="user-greeting">
                Hello, {user?.username}
                {user?.role && <span className="user-role"> ({user.role})</span>}
              </span>
              <button onClick={onLogout} className="btn btn-red">Logout</button>
            </div>
          ) : (
            <div className="auth-menu-container">
              <button
                onClick={() => setShowAuthMenu(!showAuthMenu)}
                className="btn btn-primary"
              >
                Login / Sign Up
              </button>
              {showAuthMenu && (
                <div className="auth-dropdown">
                  <div className="auth-section">
                    <h4>Customer</h4>
                    <button onClick={() => { onNavigate('login'); setShowAuthMenu(false); }} className="dropdown-btn">
                      Customer Login
                    </button>
                    <button onClick={() => { onNavigate('signup'); setShowAuthMenu(false); }} className="dropdown-btn">
                      Customer Sign Up
                    </button>
                  </div>
                  <div className="auth-section">
                    <h4>Vendor</h4>
                    <button onClick={() => { onNavigate('vendor-login'); setShowAuthMenu(false); }} className="dropdown-btn">
                      Vendor Login
                    </button>
                    <button onClick={() => { onNavigate('vendor-signup'); setShowAuthMenu(false); }} className="dropdown-btn">
                      Vendor Sign Up
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;