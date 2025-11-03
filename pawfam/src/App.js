import React, { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import Modal from './components/Modal/Modal';
import Header from './components/Header/Header';
import LandingPage from './components/pages/LandingPage/LandingPage';
import LoginPage from './components/pages/LoginPage/LoginPage';
import SignUpPage from './components/pages/SignUpPage/SignUpPage';
import VendorLoginPage from './components/pages/VendorLoginPage/VendorLoginPage';
import VendorSignUpPage from './components/pages/VendorSignUpPage/VendorSignUpPage';
import ForgotPasswordPage from './components/pages/ForgotPasswordPage/ForgotPasswordPage';
import PetServicesPage from './components/pages/PetServicesPage/PetServicePage';
import VendorDashboard from './components/pages/VendorDashboard/VendorDashboard';
import VendorDaycarePage from './components/pages/VendorDaycarePage/VendorDaycarePage';
import VendorAdoptionPage from './components/pages/VendorAdoptionPage/VendorAdoptionPage';
import VendorAccessoriesPage from './components/pages/VendorAccessoriesPage/VendorAccessoriesPage';
import AccessoriesPage from './components/pages/AccessoriesPage/AccessoriesPage';
import AdoptionPage from './components/pages/AdoptionPage/AdoptionPage';
import ProfilePage from './components/pages/ProfilePage/ProfilePage';
import VendorProfilePage from './components/pages/VendorProfilePage/VendorProfilePage';
import BookingsPage from './components/pages/BookingsPage/BookingsPage';
import CustomerDashboard from './components/pages/CustomerDashboard/CustomerDashboard';
import { authAPI } from './services/api';
import './App.css';

const App = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const data = await authAPI.getCurrentUser();
          setIsLoggedIn(true);
          setUser(data.user); // Changed from response.data.user to data.user
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const showModal = (title, message) => {
    setModalContent({ title, message });
    setIsModalOpen(true);
  };

  // FIXED: handleLogin now receives the response data from LoginPage
  // It does NOT make another API call
  const handleLogin = (data) => {
    // data already contains token and user from the LoginPage API call
    setIsLoggedIn(true);
    setUser(data.user);
    setCurrentPage('landing');
    showModal('Login Successful', `Welcome back, ${data.user.username}!`);
  };

  // FIXED: handleSignup now receives the response data from SignUpPage
  // It does NOT make another API call
  const handleSignup = (data) => {
    // data already contains token and user from the SignUpPage API call
    setIsLoggedIn(true);
    setUser(data.user);
    setCurrentPage('landing');
    showModal('Signup Successful', `Welcome to PawFam, ${data.user.username}!`);
  };

  // Handle vendor login
  const handleVendorLogin = (data) => {
    setIsLoggedIn(true);
    setUser(data.user);
    setCurrentPage('vendor-dashboard'); // Changed from 'landing'
    showModal('Vendor Login Successful', `Welcome back, ${data.user.username}!`);
  };

  // Handle vendor signup
  const handleVendorSignup = (data) => {
    setIsLoggedIn(true);
    setUser(data.user);
    setCurrentPage('vendor-dashboard'); // Changed from 'landing'
    showModal('Vendor Account Created', `Welcome to PawFam, ${data.user.username}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setCurrentPage('landing');
    showModal('Logged Out', 'You have been successfully logged out.');
  };

  const renderPage = () => {
    if (loading) {
      return <div className="loading">Loading...</div>;
    }

    switch (currentPage) {
      case 'login':
        return <LoginPage onNavigate={setCurrentPage} onLogin={handleLogin} />;
      case 'bookings':
        return <BookingsPage user={user} />;
      case 'dashboard':
        return <CustomerDashboard user={user} />;
      case 'signup':
        return <SignUpPage onNavigate={setCurrentPage} onSignup={handleSignup} />;
      case 'vendor-login':
        return <VendorLoginPage onNavigate={setCurrentPage} onLogin={handleVendorLogin} />;
      case 'vendor-signup':
        return <VendorSignUpPage onNavigate={setCurrentPage} onSignup={handleVendorSignup} />;
      case 'forgot':
        return <ForgotPasswordPage onNavigate={setCurrentPage} />;
      case 'profile':
        return <ProfilePage user={user} />;
      case 'vendor-dashboard':
        return <VendorDashboard user={user} />;
      case 'vendor-daycare':
        return <VendorDaycarePage user={user} />;
      case 'vendor-adoption':
        return <VendorAdoptionPage user={user} />;
      case 'vendor-accessories':
        return <VendorAccessoriesPage user={user} />;
      case 'vendor-profile':
        return <VendorProfilePage user={user} />;
      case 'services':
        return <PetServicesPage user={user} />;
      case 'accessories':
        return <AccessoriesPage user={user} />;
      case 'adoption':
        return <AdoptionPage user={user} />;
      case 'landing':
      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <CartProvider>
      <div className="app">
        {currentPage !== 'login' &&
          currentPage !== 'signup' &&
          currentPage !== 'vendor-login' &&
          currentPage !== 'vendor-signup' &&
          currentPage !== 'forgot' && (
            <Header
              onNavigate={setCurrentPage}
              isLoggedIn={isLoggedIn}
              onLogout={handleLogout}
              user={user}
            />
          )}
        <main>
          {renderPage()}
        </main>
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalContent.title}
          message={modalContent.message}
        />
      </div>
    </CartProvider>
  );
};

export default App;