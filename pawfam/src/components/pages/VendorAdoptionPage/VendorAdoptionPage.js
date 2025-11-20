import React, { useState, useEffect } from 'react';
import { vendorAdoptionAPI } from '../../../services/api';
import '../VendorDaycarePage/VendorDaycarePage.css';

const PET_TYPES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];
const PET_SIZES = ['Small', 'Medium', 'Large'];
const PET_GENDERS = ['Male', 'Female'];
const TEMPERAMENTS = ['Friendly', 'Playful', 'Calm', 'Energetic', 'Shy', 'Protective', 'Social', 'Independent'];

const VendorAdoptionPage = ({ user }) => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    breed: '',
    age: '',
    gender: '',
    size: '',
    color: '',
    description: '',
    temperament: [],
    vaccinated: false,
    neutered: false,
    healthConditions: '',
    shelterName: '',
    shelterLocation: '',
    shelterAddress: '',
    shelterPhone: '',
    shelterEmail: '',
    adoptionFee: '',
    specialNeeds: '',
    goodWithKids: true,
    goodWithDogs: true,
    goodWithCats: true,
    images: []
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchMyPets();
  }, []);

  const fetchMyPets = async () => {
    try {
      setLoading(true);
      const data = await vendorAdoptionAPI.getMyPets();
      setPets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching pets:', error);
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTemperamentChange = (temperament) => {
    setFormData(prev => ({
      ...prev,
      temperament: prev.temperament.includes(temperament)
        ? prev.temperament.filter(t => t !== temperament)
        : [...prev.temperament, temperament]
    }));
  };

  // Image upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);

    const reader = new FileReader();
    
    reader.onloadend = () => {
      const base64String = reader.result;
      setImagePreview(base64String);
      setFormData(prev => ({
        ...prev,
        images: [base64String]
      }));
      setUploadingImage(false);
    };

    reader.onerror = () => {
      alert('Error reading file');
      setUploadingImage(false);
    };

    reader.readAsDataURL(file);
  };

  // Remove image
  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      images: []
    }));
    const fileInput = document.getElementById('imageUpload');
    if (fileInput) fileInput.value = '';
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Pet name must be at least 2 characters';
    }
    if (!formData.type) newErrors.type = 'Pet type is required';
    if (!formData.breed) newErrors.breed = 'Breed is required';
    if (!formData.age) newErrors.age = 'Age is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.size) newErrors.size = 'Size is required';
    if (!formData.color) newErrors.color = 'Color is required';
    if (!formData.description || formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    if (!formData.shelterName) newErrors.shelterName = 'Shelter name is required';
    if (!formData.shelterLocation) newErrors.shelterLocation = 'Shelter location is required';
    if (!formData.shelterAddress) newErrors.shelterAddress = 'Shelter address is required';
    if (!/^[6-9]\d{9}$/.test(formData.shelterPhone)) {
      newErrors.shelterPhone = 'Phone must be 10 digits starting with 6-9';
    }
    if (!formData.shelterEmail || !/\S+@\S+\.\S+/.test(formData.shelterEmail)) {
      newErrors.shelterEmail = 'Valid email is required';
    }
    if (!formData.adoptionFee || formData.adoptionFee < 0) {
      newErrors.adoptionFee = 'Adoption fee must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const submitData = {
        name: formData.name,
        type: formData.type,
        breed: formData.breed,
        age: formData.age,
        gender: formData.gender,
        size: formData.size,
        color: formData.color,
        description: formData.description,
        temperament: formData.temperament,
        healthStatus: {
          vaccinated: formData.vaccinated,
          neutered: formData.neutered,
          healthConditions: formData.healthConditions || 'Healthy'
        },
        shelter: {
          name: formData.shelterName,
          location: formData.shelterLocation,
          address: formData.shelterAddress,
          phone: formData.shelterPhone,
          email: formData.shelterEmail
        },
        adoptionFee: formData.adoptionFee,
        specialNeeds: formData.specialNeeds || 'None',
        goodWith: {
          kids: formData.goodWithKids,
          dogs: formData.goodWithDogs,
          cats: formData.goodWithCats
        },
        images: formData.images
      };

      if (editingPet) {
        await vendorAdoptionAPI.updatePet(editingPet._id, submitData);
        alert('Pet updated successfully!');
      } else {
        await vendorAdoptionAPI.createPet(submitData);
        alert('Pet added successfully!');
      }

      setShowModal(false);
      resetForm();
      await fetchMyPets();
    } catch (error) {
      console.error('Error saving pet:', error);
      alert(error.response?.data?.message || 'Failed to save pet');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      age: pet.age,
      gender: pet.gender,
      size: pet.size,
      color: pet.color,
      description: pet.description,
      temperament: pet.temperament || [],
      vaccinated: pet.healthStatus?.vaccinated || false,
      neutered: pet.healthStatus?.neutered || false,
      healthConditions: pet.healthStatus?.healthConditions || '',
      shelterName: pet.shelter?.name || '',
      shelterLocation: pet.shelter?.location || '',
      shelterAddress: pet.shelter?.address || '',
      shelterPhone: pet.shelter?.phone || '',
      shelterEmail: pet.shelter?.email || '',
      adoptionFee: pet.adoptionFee || 0,
      specialNeeds: pet.specialNeeds || '',
      goodWithKids: pet.goodWith?.kids ?? true,
      goodWithDogs: pet.goodWith?.dogs ?? true,
      goodWithCats: pet.goodWith?.cats ?? true,
      images: pet.images || []
    });
    
    if (pet.images && pet.images.length > 0) {
      setImagePreview(pet.images[0]);
    } else {
      setImagePreview(null);
    }
    
    setShowModal(true);
  };

  const handleDelete = async (petId) => {
    if (!window.confirm('Are you sure you want to delete this pet listing?')) return;

    try {
      setLoading(true);
      await vendorAdoptionAPI.deletePet(petId);
      alert('Pet deleted successfully!');
      await fetchMyPets();
    } catch (error) {
      console.error('Error deleting pet:', error);
      alert(error.response?.data?.message || 'Failed to delete pet');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      breed: '',
      age: '',
      gender: '',
      size: '',
      color: '',
      description: '',
      temperament: [],
      vaccinated: false,
      neutered: false,
      healthConditions: '',
      shelterName: '',
      shelterLocation: '',
      shelterAddress: '',
      shelterPhone: '',
      shelterEmail: '',
      adoptionFee: '',
      specialNeeds: '',
      goodWithKids: true,
      goodWithDogs: true,
      goodWithCats: true,
      images: []
    });
    setEditingPet(null);
    setErrors({});
    setImagePreview(null);
    const fileInput = document.getElementById('imageUpload');
    if (fileInput) fileInput.value = '';
  };

  if (user?.role !== 'vendor') {
    return (
      <div className="vendor-daycare-page">
        <div className="error-message">
          Access denied. Vendor role required.
        </div>
      </div>
    );
  }

  return (
    <div className="vendor-daycare-page">
      <div className="page-header">
        <h1>Manage Adoption Listings</h1>
        <p>Create and manage pets available for adoption</p>
      </div>

      <div className="action-section">
        <h2>My Pets ({pets.length})</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          disabled={loading}
        >
          + Add New Pet
        </button>
      </div>

      {loading && pets.length === 0 ? (
        <div className="loading-spinner">Loading pets...</div>
      ) : pets.length === 0 ? (
        <div className="no-centers">
          <div className="no-centers-icon">🐾</div>
          <h3>No Pets Yet</h3>
          <p>Start by adding your first pet for adoption</p>
        </div>
      ) : (
        <div className="centers-grid">
          {pets.map(pet => (
            <div key={pet._id} className="center-card">
              <div className="center-card-header">
                {pet.images && pet.images.length > 0 ? (
                  <img 
                    src={pet.images[0]} 
                    alt={pet.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className="no-image-placeholder">
                    No Image
                  </div>
                )}
                <div className="center-header-info">
                  <h3>{pet.name}</h3>
                  <p className="center-location">📍 {pet.shelter?.location}</p>
                </div>
              </div>
              <div className="center-card-body">
                <div className="center-info-row">
                  <span className="info-label">Type:</span>
                  <span className="info-value">{pet.type} - {pet.breed}</span>
                </div>
                <div className="center-info-row">
                  <span className="info-label">Age:</span>
                  <span className="info-value">{pet.age}</span>
                </div>
                <div className="center-info-row">
                  <span className="info-label">Gender:</span>
                  <span className="info-value">{pet.gender}</span>
                </div>
                <div className="center-info-row">
                  <span className="info-label">Size:</span>
                  <span className="info-value">{pet.size}</span>
                </div>
                <div className="center-info-row">
                  <span className="info-label">Adoption Fee:</span>
                  <span className="info-value price">₹{pet.adoptionFee}</span>
                </div>
                <div className="center-info-row">
                  <span className="info-label">Health:</span>
                  <span className="info-value">
                    {pet.healthStatus?.vaccinated ? '✓ Vaccinated ' : ''}
                    {pet.healthStatus?.neutered ? '✓ Neutered' : ''}
                  </span>
                </div>
                {pet.temperament && pet.temperament.length > 0 && (
                  <div className="center-info-row">
                    <span className="info-label">Temperament:</span>
                    <div className="service-tags">
                      {pet.temperament.map((temp, idx) => (
                        <span key={idx} className="tag">{temp}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="center-description">
                  {pet.description}
                </div>
                <div className="center-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleEdit(pet)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(pet._id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingPet ? 'Edit Pet' : 'Add New Pet'}</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                disabled={loading}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Image Upload Section */}
              <div className="form-section">
                <h3>Pet Image</h3>
                <div className="form-group">
                  <label>Upload Image (Max 5MB)</label>
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={loading || uploadingImage}
                    style={{ marginBottom: '1rem' }}
                  />
                  
                  {uploadingImage && (
                    <p style={{ color: '#3b82f6', fontSize: '0.875rem' }}>
                      Uploading image...
                    </p>
                  )}
                  
                  {imagePreview && (
                    <div style={{ position: 'relative', marginTop: '1rem' }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: '100%',
                          maxHeight: '300px',
                          objectFit: 'cover',
                          borderRadius: '0.5rem',
                          border: '2px solid #e5e7eb'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={loading}
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          cursor: 'pointer',
                          fontSize: '1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-section">
                <h3>Pet Information</h3>
                <div className="form-group">
                  <label>Pet Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Type *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className={errors.type ? 'error' : ''}
                      disabled={loading}
                    >
                      <option value="">Select Type</option>
                      {PET_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errors.type && <span className="error-text">{errors.type}</span>}
                  </div>
                  <div className="form-group">
                    <label>Breed *</label>
                    <input
                      type="text"
                      name="breed"
                      value={formData.breed}
                      onChange={handleInputChange}
                      className={errors.breed ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.breed && <span className="error-text">{errors.breed}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Age *</label>
                    <input
                      type="text"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="e.g., 2 years, 6 months"
                      className={errors.age ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.age && <span className="error-text">{errors.age}</span>}
                  </div>
                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className={errors.gender ? 'error' : ''}
                      disabled={loading}
                    >
                      <option value="">Select Gender</option>
                      {PET_GENDERS.map(gender => (
                        <option key={gender} value={gender}>{gender}</option>
                      ))}
                    </select>
                    {errors.gender && <span className="error-text">{errors.gender}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Size *</label>
                    <select
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      className={errors.size ? 'error' : ''}
                      disabled={loading}
                    >
                      <option value="">Select Size</option>
                      {PET_SIZES.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    {errors.size && <span className="error-text">{errors.size}</span>}
                  </div>
                  <div className="form-group">
                    <label>Color *</label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className={errors.color ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.color && <span className="error-text">{errors.color}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className={errors.description ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.description && <span className="error-text">{errors.description}</span>}
                </div>

                <div className="form-group">
                  <label>Temperament</label>
                  <div className="checkbox-group">
                    {TEMPERAMENTS.map(temp => (
                      <label key={temp} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.temperament.includes(temp)}
                          onChange={() => handleTemperamentChange(temp)}
                          disabled={loading}
                        />
                        {temp}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Health Information</h3>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="vaccinated"
                      checked={formData.vaccinated}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                    Vaccinated
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="neutered"
                      checked={formData.neutered}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                    Neutered/Spayed
                  </label>
                </div>

                <div className="form-group">
                  <label>Health Conditions</label>
                  <input
                    type="text"
                    name="healthConditions"
                    value={formData.healthConditions}
                    onChange={handleInputChange}
                    placeholder="Enter any health conditions or 'Healthy'"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Special Needs</label>
                  <input
                    type="text"
                    name="specialNeeds"
                    value={formData.specialNeeds}
                    onChange={handleInputChange}
                    placeholder="Enter special needs or 'None'"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Good With</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="goodWithKids"
                        checked={formData.goodWithKids}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                      Kids
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="goodWithDogs"
                        checked={formData.goodWithDogs}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                      Dogs
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="goodWithCats"
                        checked={formData.goodWithCats}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                      Cats
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Shelter Information</h3>
                <div className="form-group">
                  <label>Shelter Name *</label>
                  <input
                    type="text"
                    name="shelterName"
                    value={formData.shelterName}
                    onChange={handleInputChange}
                    className={errors.shelterName ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.shelterName && <span className="error-text">{errors.shelterName}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Location *</label>
                    <input
                      type="text"
                      name="shelterLocation"
                      value={formData.shelterLocation}
                      onChange={handleInputChange}
                      className={errors.shelterLocation ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.shelterLocation && <span className="error-text">{errors.shelterLocation}</span>}
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      name="shelterPhone"
                      value={formData.shelterPhone}
                      onChange={handleInputChange}
                      maxLength="10"
                      className={errors.shelterPhone ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.shelterPhone && <span className="error-text">{errors.shelterPhone}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Address *</label>
                  <textarea
                    name="shelterAddress"
                    value={formData.shelterAddress}
                    onChange={handleInputChange}
                    rows="2"
                    className={errors.shelterAddress ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.shelterAddress && <span className="error-text">{errors.shelterAddress}</span>}
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="shelterEmail"
                    value={formData.shelterEmail}
                    onChange={handleInputChange}
                    className={errors.shelterEmail ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.shelterEmail && <span className="error-text">{errors.shelterEmail}</span>}
                </div>

                <div className="form-group">
                  <label>Adoption Fee (₹) *</label>
                  <input
                    type="number"
                    name="adoptionFee"
                    value={formData.adoptionFee}
                    onChange={handleInputChange}
                    min="0"
                    className={errors.adoptionFee ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.adoptionFee && <span className="error-text">{errors.adoptionFee}</span>}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={loading || uploadingImage}
                >
                  {loading ? 'Saving...' : (editingPet ? 'Update Pet' : 'Add Pet')}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorAdoptionPage;