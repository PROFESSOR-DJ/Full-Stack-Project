import React, { useState, useEffect } from 'react';
import { adoptionAPI, profileAPI, vendorAdoptionAPI } from '../../../services/api';
import './AdoptionPage.css';

const AdoptionPage = ({ user }) => {
  const [selectedPet, setSelectedPet] = useState(null);
  const [showAdoptionForm, setShowAdoptionForm] = useState(false);
  const [adoptionData, setAdoptionData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    experience: '',
    experienceDetails: '',
    visitDate: '',
    visitTime: '',
    adoptionReason: '',
    otherPets: '',
    otherPetsDetails: ''
  });
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Fetch user profile data on component mount
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchKeyword);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  const fetchUserProfile = async () => {
    try {
      const data = await profileAPI.getProfile();
      if (data.hasProfile && data.profile) {
        setUserProfile(data.profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Default/mock pets (fallback until vendor posts load)
  const initialPets = [
    {
      id: 1,
      name: 'Buddy',
      type: 'Dog',
      breed: 'Golden Retriever',
      age: '2 years',
      gender: 'Male',
      size: 'Large',
      description: 'Friendly and energetic golden retriever looking for a loving home. Great with kids and other pets.',
      image: 'https://placehold.co/300x300/f59e0b/ffffff?text=Buddy',
      status: 'Available',
      shelter: 'Happy Paws Shelter'
    },
    {
      id: 2,
      name: 'Luna',
      type: 'Cat',
      breed: 'Siamese',
      age: '1.5 years',
      gender: 'Female',
      size: 'Small',
      description: 'Gentle and affectionate Siamese cat. Loves cuddles and quiet environments.',
      image: 'https://placehold.co/300x300/3b82f6/ffffff?text=Luna',
      status: 'Available',
      shelter: 'Cat Rescue Center'
    }
  ];

  const [petsList, setPetsList] = useState(initialPets);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petsError, setPetsError] = useState(null);

  // Fetch vendor-posted pets (adoption posts) and replace defaults if available
  useEffect(() => {
    let mounted = true;
    const fetchVendorPets = async () => {
      setPetsLoading(true);
      try {
        const resp = await vendorAdoptionAPI.getPets();
        if (!mounted) return;
        if (Array.isArray(resp) && resp.length) {
          const mapped = resp.map(p => {
            // normalize shelter/vendor info to a string for safe rendering
            let shelterStr = '';
            const s = p.shelter || p.vendorName || (p.vendor && (p.vendor.name || p.vendor.vendorName)) || null;
            if (!s) shelterStr = 'Vendor';
            else if (typeof s === 'string') shelterStr = s;
            else if (typeof s === 'object') {
              shelterStr = s.name || s.location || s.address || s.vendorName || 'Vendor';
            } else {
              shelterStr = String(s);
            }

            return {
              id: p._id || p.id || Math.random(),
              name: p.name || p.title || 'Unnamed Pet',
              type: p.type || p.animalType || 'Pet',
              breed: p.breed || p.breedName || '',
              age: p.age || p.ageInfo || '',
              gender: p.gender || '',
              size: p.size || '',
              description: p.description || p.details || '',
              image: Array.isArray(p.images) && p.images.length ? p.images[0] : p.image || 'https://placehold.co/300x300/9ca3af/ffffff?text=Pet',
              status: p.status || 'Available',
              shelter: shelterStr
            };
          });
          setPetsList(mapped);
        }
      } catch (err) {
        console.error('Error fetching vendor adoption pets:', err);
        if (mounted) setPetsError(err);
      } finally {
        if (mounted) setPetsLoading(false);
      }
    };

    fetchVendorPets();
    return () => { mounted = false; };
  }, []);

  // Filter pets based on search keyword
  const filteredPets = petsList.filter(pet => {
    if (!debouncedSearch) return true;

    const searchLower = debouncedSearch.toLowerCase();
    return (
      (pet.name && pet.name.toLowerCase().includes(searchLower)) ||
      (pet.type && pet.type.toLowerCase().includes(searchLower)) ||
      (pet.breed && pet.breed.toLowerCase().includes(searchLower)) ||
      (pet.age && pet.age.toLowerCase().includes(searchLower)) ||
      (pet.gender && pet.gender.toLowerCase().includes(searchLower)) ||
      (pet.size && pet.size.toLowerCase().includes(searchLower)) ||
      (pet.shelter && pet.shelter.toLowerCase().includes(searchLower)) ||
      (pet.description && pet.description.toLowerCase().includes(searchLower))
    );
  });

  const handleAdoptionSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Please login to submit an adoption application');
      return;
    }

    setLoading(true);

    try {
      const applicationPayload = {
        pet: {
          id: selectedPet.id.toString(),
          name: selectedPet.name,
          type: selectedPet.type,
          breed: selectedPet.breed,
          age: selectedPet.age,
          shelter: selectedPet.shelter
        },
        personalInfo: {
          fullName: adoptionData.fullName,
          email: adoptionData.email,
          phone: adoptionData.phone,
          address: adoptionData.address
        },
        experience: {
          level: adoptionData.experience,
          details: adoptionData.experienceDetails,
          otherPets: adoptionData.otherPets,
          otherPetsDetails: adoptionData.otherPetsDetails
        },
        visitSchedule: {
          date: adoptionData.visitDate,
          time: adoptionData.visitTime
        },
        adoptionReason: adoptionData.adoptionReason
      };

      await adoptionAPI.createApplication(applicationPayload);

      alert('Adoption application submitted successfully! We will contact you soon.');
      setShowAdoptionForm(false);
      setSelectedPet(null);
      setAdoptionData({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        experience: '',
        experienceDetails: '',
        visitDate: '',
        visitTime: '',
        adoptionReason: '',
        otherPets: '',
        otherPetsDetails: ''
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting application');
    }

    setLoading(false);
  };

  const handleMeetPet = (pet) => {
    if (!user) {
      alert('Please login to submit an adoption application');
      return;
    }

    // Auto-fill form with profile data
    setAdoptionData(prev => ({
      ...prev,
      fullName: userProfile?.name || '',
      email: user?.email || '',
      phone: userProfile?.mobileNumber || '',
      address: userProfile?.residentialAddress || ''
    }));

    setSelectedPet(pet);
    setShowAdoptionForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAdoptionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="adoption-page">
      <div className="adoption-header">
        <h1>Find Your New Best Friend</h1>
        <p>Give a loving home to pets in need of adoption</p>
      </div>

      {!user && (
        <div className="login-prompt">
          <p>Please <a href="#" onClick={() => window.location.reload()}>login</a> to submit adoption applications</p>
        </div>
      )}

      <div className="search-filter-section">
        <div className="search-bar-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search pets by name, breed, type, shelter..."
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
      </div>

      <div className="adoption-filters">
        <div className="filter-group">
          <label>Type:</label>
          <select>
            <option value="all">All Pets</option>
            <option value="dog">Dogs</option>
            <option value="cat">Cats</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Size:</label>
          <select>
            <option value="all">All Sizes</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Age:</label>
          <select>
            <option value="all">All Ages</option>
            <option value="puppy">Puppy/Kitten</option>
            <option value="young">Young</option>
            <option value="adult">Adult</option>
            <option value="senior">Senior</option>
          </select>
        </div>
      </div>

      <div className="pets-grid">
        {filteredPets.length === 0 ? (
          <div className="no-results">
            <p>No pets found matching "{debouncedSearch}"</p>
            <button onClick={() => setSearchKeyword('')}>Clear Search</button>
          </div>
        ) : (
          filteredPets.map(pet => (
            <div key={pet.id} className="pet-card">
              <div className="pet-image">
                <img src={pet.image} alt={pet.name} />
                <div className="pet-status">{pet.status}</div>
              </div>
              <div className="pet-info">
                <h3>{pet.name}</h3>
                <div className="pet-details">
                  <div className="detail-item">
                    <strong>Type:</strong> {pet.type}
                  </div>
                  <div className="detail-item">
                    <strong>Breed:</strong> {pet.breed}
                  </div>
                  <div className="detail-item">
                    <strong>Age:</strong> {pet.age}
                  </div>
                  <div className="detail-item">
                    <strong>Gender:</strong> {pet.gender}
                  </div>
                  <div className="detail-item">
                    <strong>Size:</strong> {pet.size}
                  </div>
                  <div className="detail-item">
                    <strong>Shelter:</strong> {pet.shelter}
                  </div>
                </div>
                <p className="pet-description">{pet.description}</p>
                <button
                  className="meet-pet-btn"
                  onClick={() => handleMeetPet(pet)}
                  disabled={!user}
                >
                  {user ? `Meet ${pet.name}` : 'Login to Adopt'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Adoption Form Modal */}
      {showAdoptionForm && selectedPet && (
        <div className="adoption-modal">
          <div className="adoption-form-container">
            <div className="adoption-header">
              <h2>Adopt {selectedPet.name}</h2>
              <button
                className="close-btn"
                onClick={() => setShowAdoptionForm(false)}
                disabled={loading}
              >
                ×
              </button>
            </div>

            <div className="pet-summary">
              <img src={selectedPet.image} alt={selectedPet.name} />
              <div className="pet-summary-info">
                <h3>{selectedPet.name}</h3>
                <p>{selectedPet.breed} • {selectedPet.age} • {selectedPet.gender}</p>
                <p><strong>Shelter:</strong> {selectedPet.shelter}</p>
              </div>
            </div>

            <form onSubmit={handleAdoptionSubmit} className="adoption-form">
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={adoptionData.fullName}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={adoptionData.phone}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={adoptionData.email}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Home Address *</label>
                  <textarea
                    name="address"
                    value={adoptionData.address}
                    onChange={handleInputChange}
                    rows="3"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Pet Experience</h3>
                <div className="form-group">
                  <label>Do you have experience with pets? *</label>
                  <select
                    name="experience"
                    value={adoptionData.experience}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select Experience</option>
                    <option value="first-time">First-time pet owner</option>
                    <option value="some-experience">Some experience</option>
                    <option value="experienced">Experienced pet owner</option>
                    <option value="professional">Professional experience</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tell us about your experience with pets</label>
                  <textarea
                    name="experienceDetails"
                    value={adoptionData.experienceDetails}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Please share your experience with pets, if any..."
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Schedule a Visit</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Preferred Visit Date *</label>
                    <input
                      type="date"
                      name="visitDate"
                      value={adoptionData.visitDate}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Preferred Time *</label>
                    <select
                      name="visitTime"
                      value={adoptionData.visitTime}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Time</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Additional Information</h3>
                <div className="form-group">
                  <label>Why do you want to adopt {selectedPet.name}?</label>
                  <textarea
                    name="adoptionReason"
                    value={adoptionData.adoptionReason}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Please tell us why you're interested in adopting this pet..."
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Do you have other pets at home?</label>
                  <select
                    name="otherPets"
                    value={adoptionData.otherPets}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="">Select Option</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                {adoptionData.otherPets === 'yes' && (
                  <div className="form-group">
                    <label>Please describe your other pets</label>
                    <textarea
                      name="otherPetsDetails"
                      value={adoptionData.otherPetsDetails}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="Types, breeds, ages of your other pets..."
                      disabled={loading}
                    />
                  </div>
                )}
              </div>

              <div className="form-agreement">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    required
                    disabled={loading}
                  />
                  I understand that this is an adoption application and approval is subject to shelter review and home visit
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    required
                    disabled={loading}
                  />
                  I agree to provide a loving and safe environment for the pet
                </label>
              </div>

              <button
                type="submit"
                className="submit-application-btn"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Adoption Application'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdoptionPage;