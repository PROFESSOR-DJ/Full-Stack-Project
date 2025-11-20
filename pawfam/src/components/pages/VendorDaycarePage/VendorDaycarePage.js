import React, { useState, useEffect } from 'react';
import { vendorDaycareAPI } from '../../../services/api';
import './VendorDaycarePage.css';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
];

const SERVICES = ['Day Care', 'Overnight Stay', 'Grooming', 'Training', 'Vet Services', 'Pet Taxi'];
const PET_TYPES = ['Dog', 'Cat', 'Bird', 'Other'];

const VendorDaycarePage = ({ user }) => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    pricePerDay: '',
    services: [],
    petTypes: [],
    facilities: '',
    capacity: '',
    description: '',
    operatingHours: {
      openTime: '',
      closeTime: ''
    },
    images: []
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchMyCenters();
  }, []);

  const fetchMyCenters = async () => {
    try {
      setLoading(true);
      const data = await vendorDaycareAPI.getMyCenters();
      setCenters(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching centers:', error);
      setCenters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  // NEW: Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
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

  // NEW: Remove image
  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      images: []
    }));
    // Clear file input
    const fileInput = document.getElementById('imageUpload');
    if (fileInput) fileInput.value = '';
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Center name must be at least 3 characters';
    }
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!/^\d{6}$/.test(formData.zipCode)) {
      newErrors.zipCode = 'ZIP Code must be 6 digits';
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits starting with 6-9';
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.pricePerDay || formData.pricePerDay < 0) {
      newErrors.pricePerDay = 'Price must be greater than 0';
    }
    if (!formData.capacity || formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }
    if (!formData.description || formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    if (!formData.operatingHours.openTime) {
      newErrors.openTime = 'Opening time is required';
    }
    if (!formData.operatingHours.closeTime) {
      newErrors.closeTime = 'Closing time is required';
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
        ...formData,
        facilities: formData.facilities.split(',').map(f => f.trim()).filter(f => f)
      };

      if (editingCenter) {
        await vendorDaycareAPI.updateCenter(editingCenter._id, submitData);
        alert('Daycare center updated successfully!');
      } else {
        await vendorDaycareAPI.createCenter(submitData);
        alert('Daycare center created successfully!');
      }

      setShowModal(false);
      resetForm();
      await fetchMyCenters();
    } catch (error) {
      console.error('Error saving center:', error);
      alert(error.response?.data?.message || 'Failed to save center');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (center) => {
    setEditingCenter(center);
    setFormData({
      name: center.name,
      location: center.location,
      address: center.address,
      city: center.city,
      state: center.state,
      zipCode: center.zipCode,
      phone: center.phone,
      email: center.email,
      pricePerDay: center.pricePerDay,
      services: center.services || [],
      petTypes: center.petTypes || [],
      facilities: (center.facilities || []).join(', '),
      capacity: center.capacity,
      description: center.description,
      operatingHours: center.operatingHours || { openTime: '', closeTime: '' },
      images: center.images || []
    });
    
    // Set image preview if center has images
    if (center.images && center.images.length > 0) {
      setImagePreview(center.images[0]);
    } else {
      setImagePreview(null);
    }
    
    setShowModal(true);
  };

  const handleDelete = async (centerId) => {
    if (!window.confirm('Are you sure you want to delete this center?')) return;

    try {
      setLoading(true);
      await vendorDaycareAPI.deleteCenter(centerId);
      alert('Center deleted successfully!');
      await fetchMyCenters();
    } catch (error) {
      console.error('Error deleting center:', error);
      alert(error.response?.data?.message || 'Failed to delete center');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      pricePerDay: '',
      services: [],
      petTypes: [],
      facilities: '',
      capacity: '',
      description: '',
      operatingHours: { openTime: '', closeTime: '' },
      images: []
    });
    setEditingCenter(null);
    setErrors({});
    setImagePreview(null);
    // Clear file input
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
        <h1>Manage Daycare Centers</h1>
        <p>Create and manage your daycare center listings</p>
      </div>

      <div className="action-section">
        <h2>My Centers ({centers.length})</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          disabled={loading}
        >
          + Add New Center
        </button>
      </div>

      {loading && centers.length === 0 ? (
        <div className="loading-spinner">Loading centers...</div>
      ) : centers.length === 0 ? (
        <div className="no-centers">
          <div className="no-centers-icon">🏢</div>
          <h3>No Centers Yet</h3>
          <p>Start by creating your first daycare center listing</p>
        </div>
      ) : (
        <div className="centers-grid">
          

          {centers.map(center => (
            <div key={center._id} className="center-card">
              <div className="center-card-header">
                {center.images && center.images.length > 0 ? (
                  <img 
                    src={center.images[0]} 
                    alt={center.name}
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
                  <h3>{center.name}</h3>
                  <p className="center-location">📍 {center.location}</p>
                </div>
              </div>
              <div className="center-card-body">
                <div className="center-info-row">
                  <span className="info-label">Price per Day:</span>
                  <span className="info-value price">₹{center.pricePerDay}</span>
                </div>
                <div className="center-info-row">
                  <span className="info-label">Capacity:</span>
                  <span className="info-value">{center.capacity} pets</span>
                </div>
                <div className="center-info-row">
                  <span className="info-label">Hours:</span>
                  <span className="info-value">
                    {center.operatingHours.openTime} - {center.operatingHours.closeTime}
                  </span>
                </div>
                {center.services && center.services.length > 0 && (
                  <div className="center-info-row">
                    <span className="info-label">Services:</span>
                    <div className="service-tags">
                      {center.services.map((service, idx) => (
                        <span key={idx} className="tag">{service}</span>
                      ))}
                    </div>
                  </div>
                )}
                {center.petTypes && center.petTypes.length > 0 && (
                  <div className="center-info-row">
                    <span className="info-label">Pet Types:</span>
                    <div className="pet-type-tags">
                      {center.petTypes.map((type, idx) => (
                        <span key={idx} className="tag">{type}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="center-description">
                  {center.description}
                </div>
                <div className="center-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleEdit(center)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(center._id)}
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
              <h2>{editingCenter ? 'Edit Center' : 'Add New Center'}</h2>
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
              {/* NEW: Image Upload Section */}
              <div className="form-section">
                <h3>Center Image</h3>
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
                <h3>Basic Information</h3>
                <div className="form-group">
                  <label>Center Name *</label>
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
                    <label>Location (Area) *</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className={errors.location ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.location && <span className="error-text">{errors.location}</span>}
                  </div>
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={errors.city ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.city && <span className="error-text">{errors.city}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Full Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={errors.address ? 'error' : ''}
                    rows="2"
                    disabled={loading}
                  />
                  {errors.address && <span className="error-text">{errors.address}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>State *</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={errors.state ? 'error' : ''}
                      disabled={loading}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    {errors.state && <span className="error-text">{errors.state}</span>}
                  </div>
                  <div className="form-group">
                    <label>ZIP Code *</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      maxLength="6"
                      className={errors.zipCode ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.zipCode && <span className="error-text">{errors.zipCode}</span>}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Contact Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      maxLength="10"
                      className={errors.phone ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={errors.email ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Center Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price per Day (₹) *</label>
                    <input
                      type="number"
                      name="pricePerDay"
                      value={formData.pricePerDay}
                      onChange={handleInputChange}
                      min="0"
                      className={errors.pricePerDay ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.pricePerDay && <span className="error-text">{errors.pricePerDay}</span>}
                  </div>
                  <div className="form-group">
                    <label>Capacity *</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      min="1"
                      className={errors.capacity ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.capacity && <span className="error-text">{errors.capacity}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Opening Time *</label>
                    <input
                      type="time"
                      name="operatingHours.openTime"
                      value={formData.operatingHours.openTime}
                      onChange={handleInputChange}
                      className={errors.openTime ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.openTime && <span className="error-text">{errors.openTime}</span>}
                  </div>
                  <div className="form-group">
                    <label>Closing Time *</label>
                    <input
                      type="time"
                      name="operatingHours.closeTime"
                      value={formData.operatingHours.closeTime}
                      onChange={handleInputChange}
                      className={errors.closeTime ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.closeTime && <span className="error-text">{errors.closeTime}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Services Offered</label>
                  <div className="checkbox-group">
                    {SERVICES.map(service => (
                      <label key={service} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.services.includes(service)}
                          onChange={() => handleCheckboxChange('services', service)}
                          disabled={loading}
                        />
                        {service}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Pet Types Accepted</label>
                  <div className="checkbox-group">
                    {PET_TYPES.map(type => (
                      <label key={type} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.petTypes.includes(type)}
                          onChange={() => handleCheckboxChange('petTypes', type)}
                          disabled={loading}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Facilities (comma-separated)</label>
                  <input
                    type="text"
                    name="facilities"
                    value={formData.facilities}
                    onChange={handleInputChange}
                    placeholder="e.g., Air Conditioning, Play Area, CCTV"
                    disabled={loading}
                  />
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
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={loading || uploadingImage}
                >
                  {loading ? 'Saving...' : (editingCenter ? 'Update Center' : 'Create Center')}
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

export default VendorDaycarePage;