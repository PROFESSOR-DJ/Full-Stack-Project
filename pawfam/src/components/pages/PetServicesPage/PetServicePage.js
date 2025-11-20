import React, { useState, useEffect } from 'react';
import { daycareAPI, petsAPI, profileAPI, vendorDaycareAPI } from '../../../services/api';
import './PetServicePage.css';

const PetServicesPage = ({ user }) => {
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [bookingData, setBookingData] = useState({
    petName: '',
    petType: '',
    petAge: '',
    email: '',
    mobileNumber: '',
    startDate: '',
    endDate: '',
    specialInstructions: ''
  });
  const [loading, setLoading] = useState(false);
  const [userPets, setUserPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [bookingMode, setBookingMode] = useState(null);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  const [daycareCenters, setDaycareCenters] = useState([]);
  const [centersLoading, setCentersLoading] = useState(true);

  useEffect(() => {
    fetchDaycareCenters();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserPets();
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchKeyword);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  const fetchDaycareCenters = async () => {
    try {
      setCentersLoading(true);
      const data = await vendorDaycareAPI.getCenters();
      setDaycareCenters(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching daycare centers:', error);
      setDaycareCenters([]);
    } finally {
      setCentersLoading(false);
    }
  };

  const fetchUserPets = async () => {
    try {
      setPetsLoading(true);
      const data = await petsAPI.getPets();
      setUserPets(data.pets || []);
    } catch (error) {
      console.error('Error fetching pets:', error);
      setUserPets([]);
    } finally {
      setPetsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const data = await profileAPI.getProfile();
      if (data.hasProfile && data.profile) {
        setUserProfile(data.profile);
        setBookingData(prev => ({
          ...prev,
          email: user?.email || '',
          mobileNumber: data.profile.mobileNumber || ''
        }));
      } else {
        setBookingData(prev => ({
          ...prev,
          email: user?.email || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setBookingData(prev => ({
        ...prev,
        email: user?.email || ''
      }));
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobileNumber = (mobile) => {
    const mobileRegex = /^(\+91|91)?[6-9]\d{9}$/;
    return mobileRegex.test(mobile.replace(/\s/g, ''));
  };

  const handleMobileNumberChange = (e) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, '').slice(0, 10);
    setBookingData({ ...bookingData, mobileNumber: numericValue });
    if (validationErrors.mobileNumber) {
      setValidationErrors({ ...validationErrors, mobileNumber: '' });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!bookingData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(bookingData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!bookingData.mobileNumber) {
      errors.mobileNumber = 'Mobile number is required';
    } else if (!validateMobileNumber(bookingData.mobileNumber)) {
      errors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePetSelection = (petId) => {
    const selectedPet = userPets.find(pet => pet.id === petId);

    if (selectedPet) {
      setSelectedPetId(petId);
      setBookingData({
        ...bookingData,
        petName: selectedPet.name,
        petType: selectedPet.category,
        petAge: selectedPet.age.toString()
      });
    }
  };

  const handleModeSelection = (mode) => {
    setBookingMode(mode);
    if (mode === 'manual') {
      setBookingData({
        petName: '',
        petType: '',
        petAge: '',
        email: bookingData.email,
        mobileNumber: bookingData.mobileNumber,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        specialInstructions: bookingData.specialInstructions
      });
      setSelectedPetId('');
    }
    setValidationErrors({});
  };

  const resetBookingModal = () => {
    setSelectedCenter(null);
    setBookingMode(null);
    setSelectedPetId('');
    setValidationErrors({});
    const emailToKeep = user?.email || '';
    const mobileToKeep = userProfile?.mobileNumber || '';
    setBookingData({
      petName: '',
      petType: '',
      petAge: '',
      email: emailToKeep,
      mobileNumber: mobileToKeep,
      startDate: '',
      endDate: '',
      specialInstructions: ''
    });
  };

  const filteredCenters = daycareCenters.filter(center => {
    if (!debouncedSearch) return true;

    const searchLower = debouncedSearch.toLowerCase();
    return (
      center.name.toLowerCase().includes(searchLower) ||
      center.location.toLowerCase().includes(searchLower) ||
      center.city?.toLowerCase().includes(searchLower) ||
      center.description?.toLowerCase().includes(searchLower) ||
      center.services?.some(service => service.toLowerCase().includes(searchLower))
    );
  });

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Please login to book a daycare service');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const start = new Date(bookingData.startDate);
      const end = new Date(bookingData.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const totalAmount = days * selectedCenter.pricePerDay;

      const bookingPayload = {
        daycareCenterId: selectedCenter._id,
        daycareCenter: {
          name: selectedCenter.name,
          location: selectedCenter.location,
          pricePerDay: selectedCenter.pricePerDay
        },
        petName: bookingData.petName,
        petType: bookingData.petType,
        petAge: bookingData.petAge,
        email: bookingData.email,
        mobileNumber: bookingData.mobileNumber,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        specialInstructions: bookingData.specialInstructions,
        totalAmount: totalAmount
      };

      await daycareAPI.createBooking(bookingPayload);

      alert('Daycare booking created successfully!');
      resetBookingModal();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating booking');
    }

    setLoading(false);
  };

  return (
    <div className="services-page">
      <div className="services-header">
        <h1>Pet Daycare Centers</h1>
        <p>Find the perfect daycare for your furry friends</p>
      </div>

      {!user && (
        <div className="login-prompt">
          <p>Please <a href="#" onClick={() => window.location.reload()}>login</a> to book daycare services</p>
        </div>
      )}

      <div className="search-bar-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search daycare centers by name, location, services..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        {searchKeyword && (
          <button
            className="clear-search-btn"
            onClick={() => setSearchKeyword('')}
            title="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {centersLoading ? (
        <div className="loading-spinner">Loading daycare centers...</div>
      ) : (
        <div className="centers-grid">
          {filteredCenters.length === 0 ? (
            <div className="no-results">
              <p>No daycare centers found {debouncedSearch && `matching "${debouncedSearch}"`}</p>
              {debouncedSearch && <button onClick={() => setSearchKeyword('')}>Clear Search</button>}
            </div>
          ) : (
            filteredCenters.map(center => (
              <div key={center._id} className="center-card">
                <div className="center-image">
                  <img 
                    src={center.images && center.images.length > 0 
                      ? center.images[0] 
                      : `https://placehold.co/300x200/3b82f6/ffffff?text=${encodeURIComponent(center.name)}`
                    } 
                    alt={center.name}
                    onError={(e) => {
                      e.target.src = `https://placehold.co/300x200/3b82f6/ffffff?text=${encodeURIComponent(center.name)}`;
                    }}
                  />
                </div>
                <div className="center-info">
                  <h3>{center.name}</h3>
                  <p className="center-location">📍 {center.location}, {center.city}</p>
                  <div className="center-rating">
                    <span className="rating">⭐ {center.rating || 4.5}</span>
                    <span className="price">₹{center.pricePerDay}/day</span>
                  </div>
                  {center.services && center.services.length > 0 && (
                    <div className="center-services">
                      <strong>Services:</strong>
                      <div className="service-tags">
                        {center.services.map((service, idx) => (
                          <span key={idx} className="service-tag">{service}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {center.description && (
                    <p className="center-description">{center.description.substring(0, 100)}...</p>
                  )}
                  <div className="center-details">
                    <p><strong>Capacity:</strong> {center.capacity} pets</p>
                    <p><strong>Hours:</strong> {center.operatingHours?.openTime} - {center.operatingHours?.closeTime}</p>
                  </div>
                  <button
                    className="book-btn"
                    onClick={() => setSelectedCenter(center)}
                    disabled={!user}
                  >
                    {user ? 'Book Now' : 'Login to Book'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Booking Modal - Keep existing modal code */}
      {selectedCenter && (
        <div className="booking-modal">
          <div className="booking-form-container">
            <div className="booking-header">
              <h2>Book {selectedCenter.name}</h2>
              <button
                className="close-btn"
                onClick={resetBookingModal}
                disabled={loading}
              >
                ×
              </button>
            </div>

            {!bookingMode && (
              <div className="mode-selection">
                <h3>Choose Booking Method</h3>
                <div className="mode-buttons">
                  {userPets.length > 0 ? (
                    <>
                      <button
                        type="button"
                        className="mode-btn existing-pet-btn"
                        onClick={() => handleModeSelection('existing')}
                        disabled={petsLoading}
                      >
                        <span className="mode-icon">🐾</span>
                        <span className="mode-title">Choose from My Pets</span>
                        <span className="mode-desc">Select from {userPets.length} registered pet(s)</span>
                      </button>
                      <button
                        type="button"
                        className="mode-btn manual-btn"
                        onClick={() => handleModeSelection('manual')}
                      >
                        <span className="mode-icon">✏️</span>
                        <span className="mode-title">Enter Details Manually</span>
                        <span className="mode-desc">Fill in pet information</span>
                      </button>
                    </>
                  ) : (
                    <div className="no-pets-message">
                      <p>You don't have any registered pets yet.</p>
                      <button
                        type="button"
                        className="mode-btn manual-btn full-width"
                        onClick={() => handleModeSelection('manual')}
                      >
                        <span className="mode-icon">✏️</span>
                        <span className="mode-title">Enter Pet Details</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {bookingMode === 'existing' && !selectedPetId && (
              <div className="pet-selection">
                <div className="selection-header">
                  <h3>Select Your Pet</h3>
                  <button
                    type="button"
                    className="back-btn"
                    onClick={() => setBookingMode(null)}
                  >
                    ← Back
                  </button>
                </div>
                <div className="pets-list">
                  {userPets.map((pet) => (
                    <div
                      key={pet.id}
                      className="pet-option"
                      onClick={() => handlePetSelection(pet.id)}
                    >
                      <div className="pet-option-header">
                        <h4>{pet.name}</h4>
                        <span className="pet-badge">{pet.category}</span>
                      </div>
                      <div className="pet-option-details">
                        <p><strong>Breed:</strong> {pet.breed}</p>
                        <p><strong>Age:</strong> {pet.age} {pet.age === 1 ? 'year' : 'years'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {((bookingMode === 'existing' && selectedPetId) || bookingMode === 'manual') && (
              <div className="booking-form-wrapper">
                <div className="selection-header">
                  <h3>{bookingMode === 'existing' ? 'Complete Booking' : 'Enter Pet Details'}</h3>
                  <button
                    type="button"
                    className="back-btn"
                    onClick={() => {
                      if (bookingMode === 'existing') {
                        setSelectedPetId('');
                        setBookingData({
                          ...bookingData,
                          petName: '',
                          petType: '',
                          petAge: ''
                        });
                      } else {
                        setBookingMode(null);
                      }
                      setValidationErrors({});
                    }}
                    disabled={loading}
                  >
                    ← Back
                  </button>
                </div>
                <form onSubmit={handleBookingSubmit} className="booking-form">
                  <div className="form-group">
                    <label>Pet Name *</label>
                    <input
                      type="text"
                      value={bookingData.petName}
                      onChange={(e) => setBookingData({ ...bookingData, petName: e.target.value })}
                      required
                      disabled={loading || bookingMode === 'existing'}
                      className={bookingMode === 'existing' ? 'auto-filled' : ''}
                      placeholder="Enter pet's name"
                    />
                    {bookingMode === 'existing' && (
                      <small className="help-text">Auto-filled from your registered pet</small>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Pet Type *</label>
                      <select
                        value={bookingData.petType}
                        onChange={(e) => setBookingData({ ...bookingData, petType: e.target.value })}
                        required
                        disabled={loading || bookingMode === 'existing'}
                        className={bookingMode === 'existing' ? 'auto-filled' : ''}
                      >
                        <option value="">Select Pet Type</option>
                        <option value="Dog">Dog</option>
                        <option value="Cat">Cat</option>
                      </select>
                      {bookingMode === 'existing' && (
                        <small className="help-text">Auto-filled</small>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Pet Age *</label>
                      <input
                        type="number"
                        value={bookingData.petAge}
                        onChange={(e) => setBookingData({ ...bookingData, petAge: e.target.value })}
                        required
                        disabled={loading || bookingMode === 'existing'}
                        className={bookingMode === 'existing' ? 'auto-filled' : ''}
                        placeholder="Enter pet's age"
                      />
                      {bookingMode === 'existing' && (
                        <small className="help-text">Auto-filled</small>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        value={bookingData.email}
                        onChange={(e) => {
                          setBookingData({ ...bookingData, email: e.target.value });
                          if (validationErrors.email) {
                            setValidationErrors({ ...validationErrors, email: '' });
                          }
                        }}
                        required
                        disabled={loading}
                        placeholder="Enter your email"
                        className={validationErrors.email ? 'input-error' : ''}
                      />
                      {validationErrors.email && (
                        <small className="error-text">{validationErrors.email}</small>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Mobile Number *</label>
                      <input
                        type="tel"
                        value={bookingData.mobileNumber}
                        onChange={handleMobileNumberChange}
                        required
                        disabled={loading}
                        placeholder="Enter 10-digit mobile number"
                        className={validationErrors.mobileNumber ? 'input-error' : ''}
                        maxLength="10"
                      />
                      {validationErrors.mobileNumber && (
                        <small className="error-text">{validationErrors.mobileNumber}</small>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date *</label>
                      <input
                        type="date"
                        value={bookingData.startDate}
                        onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
                        required
                        disabled={loading}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="form-group">
                      <label>End Date *</label>
                      <input
                        type="date"
                        value={bookingData.endDate}
                        onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
                        required
                        disabled={loading}
                        min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Special Instructions</label>
                    <textarea
                      value={bookingData.specialInstructions}
                      onChange={(e) => setBookingData({ ...bookingData, specialInstructions: e.target.value })}
                      rows="3"
                      placeholder="Any special care instructions..."
                      disabled={loading}
                    />
                  </div>

                  <div className="booking-summary">
                    <h4>Booking Summary</h4>
                    <p>Center: {selectedCenter.name}</p>
                    <p>Price: ₹{selectedCenter.pricePerDay} per day</p>
                    {bookingData.startDate && bookingData.endDate && (
                      <p>
                        Total: ₹{Math.ceil(
                          (new Date(bookingData.endDate) - new Date(bookingData.startDate)) /
                          (1000 * 60 * 60 * 24)
                        ) * selectedCenter.pricePerDay}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="submit-booking-btn"
                    disabled={loading}
                  >
                    {loading ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PetServicesPage;