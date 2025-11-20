import React, { useState, useEffect } from 'react';
import { vendorAccessoriesAPI } from '../../../services/api';
import '../VendorDaycarePage/VendorDaycarePage.css';

const CATEGORIES = ['Food', 'Toys', 'Grooming', 'Accessories', 'Healthcare', 'Bedding', 'Clothing'];
const PET_TYPES = ['Dog', 'Cat', 'Bird', 'All Pets'];

const VendorAccessoriesPage = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    petType: '',
    description: '',
    price: '',
    discountPrice: '',
    stock: '',
    brand: '',
    weight: '',
    tags: '',
    freeShipping: false,
    deliveryTime: '3-5 business days',
    isFeatured: false,
    images: []
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const data = await vendorAccessoriesAPI.getMyProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
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

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Product name must be at least 3 characters';
    }
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.petType) newErrors.petType = 'Pet type is required';
    if (!formData.description || formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    if (formData.discountPrice && formData.discountPrice >= formData.price) {
      newErrors.discountPrice = 'Discount price must be less than regular price';
    }
    if (!formData.stock || formData.stock < 0) {
      newErrors.stock = 'Stock must be 0 or greater';
    }
    if (!formData.brand) newErrors.brand = 'Brand is required';

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
        category: formData.category,
        petType: formData.petType,
        description: formData.description,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
        stock: Number(formData.stock),
        brand: formData.brand,
        weight: formData.weight || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
        shippingInfo: {
          freeShipping: formData.freeShipping,
          deliveryTime: formData.deliveryTime
        },
        isFeatured: formData.isFeatured,
        images: formData.images
      };

      if (editingProduct) {
        await vendorAccessoriesAPI.updateProduct(editingProduct._id, submitData);
        alert('Product updated successfully!');
      } else {
        await vendorAccessoriesAPI.createProduct(submitData);
        alert('Product created successfully!');
      }

      setShowModal(false);
      resetForm();
      await fetchMyProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      petType: product.petType,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice || '',
      stock: product.stock,
      brand: product.brand,
      weight: product.weight || '',
      tags: (product.tags || []).join(', '),
      freeShipping: product.shippingInfo?.freeShipping || false,
      deliveryTime: product.shippingInfo?.deliveryTime || '3-5 business days',
      isFeatured: product.isFeatured || false,
      images: product.images || []
    });
    
    if (product.images && product.images.length > 0) {
      setImagePreview(product.images[0]);
    } else {
      setImagePreview(null);
    }
    
    setShowModal(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      setLoading(true);
      await vendorAccessoriesAPI.deleteProduct(productId);
      alert('Product deleted successfully!');
      await fetchMyProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(error.response?.data?.message || 'Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      petType: '',
      description: '',
      price: '',
      discountPrice: '',
      stock: '',
      brand: '',
      weight: '',
      tags: '',
      freeShipping: false,
      deliveryTime: '3-5 business days',
      isFeatured: false,
      images: []
    });
    setEditingProduct(null);
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
        <h1>Manage Accessory Products</h1>
        <p>Create and manage your pet accessory inventory</p>
      </div>

      <div className="action-section">
        <h2>My Products ({products.length})</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          disabled={loading}
        >
          + Add New Product
        </button>
      </div>

      {loading && products.length === 0 ? (
        <div className="loading-spinner">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="no-centers">
          <div className="no-centers-icon">🛍️</div>
          <h3>No Products Yet</h3>
          <p>Start by adding your first product</p>
        </div>
      ) : (
        <div className="centers-grid">
          {products.map(product => (
            <div key={product._id} className="center-card">
              <div className="center-card-header">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
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
                  <h3>{product.name}</h3>
                  <p className="center-location">
                    {product.category} - {product.petType}
                  </p>
                </div>
              </div>
              <div className="center-card-body">
                <div className="center-info-row">
                  <span className="info-label">Brand:</span>
                  <span className="info-value">{product.brand}</span>
                </div>
                <div className="center-info-row">
                  <span className="info-label">Price:</span>
                  <span className="info-value price">
                    ₹{product.price}
                    {product.discountPrice && (
                      <span style={{ textDecoration: 'line-through', marginLeft: '0.5rem', color: '#6b7280' }}>
                        ₹{product.discountPrice}
                      </span>
                    )}
                  </span>
                </div>
                <div className="center-info-row">
                  <span className="info-label">Stock:</span>
                  <span className="info-value">{product.stock} units</span>
                </div>
                {product.weight && (
                  <div className="center-info-row">
                    <span className="info-label">Weight:</span>
                    <span className="info-value">{product.weight}</span>
                  </div>
                )}
                <div className="center-info-row">
                  <span className="info-label">Shipping:</span>
                  <span className="info-value">
                    {product.shippingInfo?.freeShipping ? '✓ Free Shipping' : 'Standard'}
                    {' • '}
                    {product.shippingInfo?.deliveryTime || '3-5 days'}
                  </span>
                </div>
                {product.isFeatured && (
                  <div className="center-info-row">
                    <span className="info-value" style={{ color: '#f59e0b', fontWeight: 600 }}>
                      ⭐ Featured Product
                    </span>
                  </div>
                )}
                {product.tags && product.tags.length > 0 && (
                  <div className="center-info-row">
                    <span className="info-label">Tags:</span>
                    <div className="service-tags">
                      {product.tags.map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="center-description">
                  {product.description}
                </div>
                <div className="center-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleEdit(product)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(product._id)}
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
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
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
                <h3>Product Image</h3>
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
                <h3>Product Information</h3>
                <div className="form-group">
                  <label>Product Name *</label>
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
                    <label>Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={errors.category ? 'error' : ''}
                      disabled={loading}
                    >
                      <option value="">Select Category</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {errors.category && <span className="error-text">{errors.category}</span>}
                  </div>
                  <div className="form-group">
                    <label>Pet Type *</label>
                    <select
                      name="petType"
                      value={formData.petType}
                      onChange={handleInputChange}
                      className={errors.petType ? 'error' : ''}
                      disabled={loading}
                    >
                      <option value="">Select Pet Type</option>
                      {PET_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errors.petType && <span className="error-text">{errors.petType}</span>}
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

                <div className="form-row">
                  <div className="form-group">
                    <label>Brand *</label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className={errors.brand ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.brand && <span className="error-text">{errors.brand}</span>}
                  </div>
                  <div className="form-group">
                    <label>Weight</label>
                    <input
                      type="text"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="e.g., 500g, 1kg"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Pricing & Stock</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className={errors.price ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.price && <span className="error-text">{errors.price}</span>}
                  </div>
                  <div className="form-group">
                    <label>Discount Price (₹)</label>
                    <input
                      type="number"
                      name="discountPrice"
                      value={formData.discountPrice}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className={errors.discountPrice ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.discountPrice && <span className="error-text">{errors.discountPrice}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className={errors.stock ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.stock && <span className="error-text">{errors.stock}</span>}
                </div>
              </div>

              <div className="form-section">
                <h3>Shipping & Additional Info</h3>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="freeShipping"
                      checked={formData.freeShipping}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                    Free Shipping
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                    Featured Product
                  </label>
                </div>

                <div className="form-group">
                  <label>Delivery Time</label>
                  <input
                    type="text"
                    name="deliveryTime"
                    value={formData.deliveryTime}
                    onChange={handleInputChange}
                    placeholder="e.g., 3-5 business days"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Tags (comma-separated)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="e.g., organic, premium, bestseller"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={loading || uploadingImage}
                >
                  {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
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

export default VendorAccessoriesPage;