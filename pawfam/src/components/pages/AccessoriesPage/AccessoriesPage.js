import React, { useState } from 'react';
import { useCart } from '../../../context/CartContext';
import { productsAPI, vendorAccessoriesAPI, profileAPI } from '../../../services/api';
import './AccessoriesPage.css';

// India states list
const INDIAN_STATES = [
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CG', name: 'Chhattisgarh' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OR', name: 'Odisha' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TG', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UT', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' },
  { code: 'DL', name: 'Delhi' }
];

const AccessoriesPage = ({ user }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD for min date
  const TIME_MIN = '17:00';
  const TIME_MAX = '19:00';
  
  const [checkoutData, setCheckoutData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    upiId: '',
    deliveryDate: today,
    deliveryTime: '17:30',
    extras: { giftWrap: false, includeReceipt: false },
    priorityDelivery: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    getCartItemsCount,
    clearCart
  } = useCart();

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchKeyword);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  const [productsList, setProductsList] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);

  // Fetch vendor accessory posts and use them to populate the products list
  React.useEffect(() => {
    let mounted = true;
    const fetchVendorProducts = async () => {
      setProductsLoading(true);
      try {
        const resp = await vendorAccessoriesAPI.getProducts();
        // Expect resp to be an array; map defensively
        if (!mounted) return;
        if (Array.isArray(resp)) {
          const mapped = resp.map(p => ({
            id: p._id || p.id || Math.random(),
            name: p.name || p.title || 'Untitled Product',
            category: p.category || 'accessories',
            price: Number(p.price || p.cost || 0),
            rating: Number(p.rating || 0),
            image: Array.isArray(p.images) && p.images.length ? p.images[0] : p.image || 'https://placehold.co/300x300/9ca3af/ffffff?text=Product',
            description: p.description || p.details || ''
          }));
          setProductsList(mapped);
        } else {
          // if response is not an array, clear list to avoid showing stale mock data
          setProductsList([]);
        }
      } catch (err) {
        console.error('Error fetching vendor accessories:', err);
        if (mounted) setProductsError(err);
      } finally {
        if (mounted) setProductsLoading(false);
      }
    };

    fetchVendorProducts();
    return () => { mounted = false; };
  }, []);

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'food', name: 'Pet Food' },
    { id: 'grooming', name: 'Grooming' },
    { id: 'accessories', name: 'Accessories' },
    { id: 'toys', name: 'Toys' }
  ];

  const filteredProducts = productsList
    .filter(product => {
      // Filter by category
      const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory;

      // Filter by search keyword
      if (!debouncedSearch) return categoryMatch;

      const searchLower = debouncedSearch.toLowerCase();
      const searchMatch = (
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower)
      );

      return categoryMatch && searchMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        default: return a.name.localeCompare(b.name);
      }
    });

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Please login to complete your order');
      return;
    }

    // final client-side validation before submitting
    const newErrors = {};
    const validateField = (name, value) => {
      if (!value || !value.toString().trim()) return `${name} is required`;
      return '';
    };

    // Basic required fields
    ['fullName', 'email', 'address', 'city', 'state', 'zipCode', 'deliveryDate', 'deliveryTime'].forEach(field => {
      const val = checkoutData[field];
      if (!val || (typeof val === 'string' && !val.toString().trim())) {
        newErrors[field] = `${field} is required`;
      }
    });
    
    // Payment fields required only when card is selected
    if (checkoutData.paymentMethod === 'card') {
      ['cardNumber', 'expiryDate', 'cvv'].forEach(field => {
        const val = checkoutData[field];
        if (!val || (typeof val === 'string' && !val.toString().trim())) {
          newErrors[field] = `${field} is required`;
        }
      });
    }

    // field-specific validations (reuse same rules as backend)
    const alphaSpace = /^[A-Za-z\s]+$/;
    if (checkoutData.fullName && !alphaSpace.test(checkoutData.fullName)) newErrors.fullName = 'Full Name must contain only letters and spaces';
    if (checkoutData.city && !alphaSpace.test(checkoutData.city)) newErrors.city = 'City must contain only letters and spaces';
    if (checkoutData.state && !alphaSpace.test(checkoutData.state)) newErrors.state = 'State must contain only letters and spaces';
  if (checkoutData.zipCode && !/^\d{6}$/.test(checkoutData.zipCode)) newErrors.zipCode = 'ZIP Code must be exactly 6 digits';

  const cardDigits = checkoutData.cardNumber ? checkoutData.cardNumber.replace(/\D/g, '') : '';
  if (cardDigits && !/^\d{14,16}$/.test(cardDigits)) newErrors.cardNumber = 'Card Number must be 14 to 16 digits';

    if (checkoutData.expiryDate && !/^\d{2}\/\d{2}$/.test(checkoutData.expiryDate)) newErrors.expiryDate = 'Expiry Date must be in MM/YY format';
    else if (checkoutData.expiryDate) {
      // additional month validation
      const [mm] = checkoutData.expiryDate.split('/');
      const monthNum = parseInt(mm, 10);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) newErrors.expiryDate = 'Expiry month must be between 01 and 12';
    }

    if (checkoutData.cvv && !/^\d{3}$/.test(checkoutData.cvv)) newErrors.cvv = 'CVV must be exactly 3 digits';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      // Don't submit if validation errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      // sanitize card and cvv to digits-only before sending to backend
      const sanitizedCard = checkoutData.cardNumber ? checkoutData.cardNumber.replace(/\D/g, '') : '';
      const sanitizedCvv = checkoutData.cvv ? checkoutData.cvv.replace(/\D/g, '') : '';

      const orderPayload = {
        items: cartItems.map(item => ({
          productId: item.id.toString(),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        shippingAddress: {
          fullName: checkoutData.fullName,
          email: checkoutData.email,
          address: checkoutData.address,
          city: checkoutData.city,
          state: checkoutData.state,
          zipCode: checkoutData.zipCode
        },
        deliveryPreferences: {
          date: checkoutData.deliveryDate,
          time: checkoutData.deliveryTime,
          extras: checkoutData.extras,
          priorityDelivery: checkoutData.priorityDelivery
        },
        paymentInfo: checkoutData.paymentMethod === 'card' ? {
          method: 'card',
          cardNumber: sanitizedCard,
          expiryDate: checkoutData.expiryDate,
          cvv: sanitizedCvv
        } : checkoutData.paymentMethod === 'upi' ? {
          method: 'upi',
          upiId: checkoutData.upiId
        } : { method: checkoutData.paymentMethod },
        totalAmount: Number(getCartTotal())
      };

      // Mask sensitive info in logs: only show last 4 digits of card if present
      try {
        const masked = { ...orderPayload };
        if (masked.paymentInfo && masked.paymentInfo.cardNumber) {
          const digits = masked.paymentInfo.cardNumber.toString();
          const last4 = digits.slice(-4);
          masked.paymentInfo.cardNumber = '****' + last4;
          // never log CVV
          if (masked.paymentInfo.cvv) masked.paymentInfo.cvv = '***';
        }
        console.log('Order payload (masked):', masked);
      } catch (e) {
        console.log('Order payload prepared');
      }

      await productsAPI.createOrder(orderPayload);

      alert('Order placed successfully! Thank you for your purchase.');
      setShowCheckout(false);
      clearCart();
      setCheckoutData({
        fullName: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        paymentMethod: 'card',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        deliveryDate: today,
        deliveryTime: '17:30',
        extras: { giftWrap: false, includeReceipt: false },
        priorityDelivery: false
      });
    } catch (error) {
      console.error('Order submission error:', error);
      // If the API returned validation errors (express-validator) or mongoose errors, map them to the form
      const resp = error.response?.data;
  console.error('API response body:', resp);
      if (resp) {
        // Show a quick alert with API validation messages for easier debugging in dev
        if (Array.isArray(resp.errors) && resp.errors.length) {
          try {
            const msgs = resp.errors.map(e => e.msg || JSON.stringify(e)).join('\n');
            alert(`Server validation errors:\n${msgs}`);
          } catch (e) {
            alert('Server returned validation errors');
          }
        } else if (resp.message) {
          alert(resp.message);
        } else {
          try { alert(JSON.stringify(resp)); } catch (e) { /* ignore */ }
        }
        // express-validator returns { errors: [ { msg, param, ... } ] }
        if (Array.isArray(resp.errors)) {
          const apiErrors = {};
          resp.errors.forEach(errItem => {
            // errItem.param may be 'shippingAddress.fullName' or 'paymentInfo.cardNumber'
            const parts = errItem.param ? errItem.param.split('.') : [];
            const key = parts.length ? parts[parts.length - 1] : errItem.param;
            if (key) apiErrors[key] = errItem.msg;
          });
          setErrors(prev => ({ ...prev, ...apiErrors }));
          // focus the first error (optional)
          const firstKey = Object.keys(apiErrors)[0];
          if (firstKey) {
            const el = document.querySelector(`[name="${firstKey}"]`);
            if (el) el.focus();
          }
        } else if (resp.message) {
          alert(resp.message);
        } else {
          alert('Error placing order');
        }
      } else {
        // No response -> network error
        alert('Network error: could not reach the server. Please make sure the backend is running.');
      }
    }

    setLoading(false);
  };

  // Open checkout and prefill from profile/user when possible
  const openCheckout = async () => {
    // If not logged in, prompt
    if (!user) {
      alert('Please login to continue to checkout');
      return;
    }

    // Start with defaults but prefill known user/profile fields
    const prefill = {
      fullName: user?.username || '',
      email: user?.email || '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      paymentMethod: 'card',
      cardNumber: '', // never prefill sensitive fields
      expiryDate: '',
      cvv: '',
      upiId: '',
      deliveryDate: checkoutData.deliveryDate || today,
      deliveryTime: checkoutData.deliveryTime || '17:30',
      extras: checkoutData.extras || { giftWrap: false, includeReceipt: false },
      priorityDelivery: checkoutData.priorityDelivery || false
    };

    // Try to fetch profile details (non-sensitive) to fill address fields; fail silently
    try {
      const profileResp = await profileAPI.getProfile();
      // profileResp may have { profile } or direct fields depending on API design
      const profile = profileResp?.profile || profileResp || {};
      if (profile) {
        if (profile.name) prefill.fullName = profile.name;
        // Prefer residentialAddress (user profile) and fall back to communicationAddress (vendor shape)
        if (profile.residentialAddress) prefill.address = profile.residentialAddress;
        else if (profile.communicationAddress) prefill.address = profile.communicationAddress;
        if (profile.city) prefill.city = profile.city;
        if (profile.state) prefill.state = profile.state || prefill.state;
        if (profile.zipCode) prefill.zipCode = profile.zipCode;
        if (profile.email) prefill.email = profile.email;
      }
    } catch (err) {
      // ignore profile fetch errors; we'll still open the checkout with user info
      console.debug('Could not fetch profile to prefill checkout:', err?.message || err);
    }

    // Apply prefill and open modal
    setCheckoutData(prev => ({ ...prev, ...prefill }));
    setShowCart(false);
    setShowCheckout(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle checkbox inputs differently
    if (name.startsWith('extras.')) {
      const key = name.split('.')[1];
      setCheckoutData(prev => ({
        ...prev,
        extras: { ...prev.extras, [key]: checked }
      }));
      return;
    }

    if (type === 'checkbox' && name === 'priorityDelivery') {
      setCheckoutData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }

    // For all other inputs
    setCheckoutData(prev => ({
      ...prev,
      [name]: value
    }));

    // immediate/inline validation for better UX
    setErrors(prev => {
      const next = { ...prev };
      // validation rules
      const alphaSpace = /^[A-Za-z\s]+$/;
      if (name === 'fullName') {
        if (!value || !value.toString().trim()) next.fullName = 'Full Name is required';
        else if (!alphaSpace.test(value)) next.fullName = 'Full Name must contain only letters and spaces';
        else delete next.fullName;
      }

      if (name === 'city') {
        if (!value || !value.toString().trim()) next.city = 'City is required';
        else if (!alphaSpace.test(value)) next.city = 'City must contain only letters and spaces';
        else delete next.city;
      }

      if (name === 'state') {
        if (!value || !value.toString().trim()) next.state = 'State is required';
        else if (!alphaSpace.test(value)) next.state = 'State must contain only letters and spaces';
        else delete next.state;
      }

      if (name === 'zipCode') {
        if (!value || !value.toString().trim()) next.zipCode = 'ZIP Code is required';
        else if (!/^\d{6}$/.test(value)) next.zipCode = 'ZIP Code must be exactly 6 digits';
        else delete next.zipCode;
      }

      if (name === 'cardNumber') {
        const digits = value.replace(/\D/g, '');
        if (!digits) next.cardNumber = 'Card Number is required';
        else if (!/^\d{14,16}$/.test(digits)) next.cardNumber = 'Card Number must be 14 to 16 digits';
        else delete next.cardNumber;
      }

      if (name === 'expiryDate') {
        if (!value || !value.toString().trim()) next.expiryDate = 'Expiry Date is required';
        else if (!/^\d{2}\/\d{2}$/.test(value)) next.expiryDate = 'Expiry Date must be in MM/YY format';
        else {
          const [mm] = value.split('/');
          const monthNum = parseInt(mm, 10);
          if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) next.expiryDate = 'Expiry month must be between 01 and 12';
          else delete next.expiryDate;
        }
      }

      if (name === 'cvv') {
        const digits = value.replace(/\D/g, '');
        if (!digits) next.cvv = 'CVV is required';
        else if (!/^\d{3}$/.test(digits)) next.cvv = 'CVV must be exactly 3 digits';
        else delete next.cvv;
      }

      if (name === 'upiId') {
        if (!value || !value.toString().trim()) next.upiId = 'UPI ID is required';
        else if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z]{2,64}$/.test(value)) {
          next.upiId = 'Invalid UPI ID format. Example: username@bank';
        } else delete next.upiId;
      }

      return next;
    });
  };

  return (
    <div className="accessories-page">
      <div className="accessories-header">
        <h1>Pet Accessories & Products</h1>
        <p>Everything your pet needs in one place</p>
      </div>

      {!user && (
        <div className="login-prompt">
          <p>Please <button className="link-like" onClick={() => window.location.reload()}>login</button> to purchase products</p>
        </div>
      )}

      <div className="search-bar-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search products by name, description, category..."
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

      <div className="accessories-controls">
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        <button
          className="cart-toggle"
          onClick={() => setShowCart(true)}
          disabled={!user}
        >
          🛒 Cart ({getCartItemsCount()})
        </button>
      </div>

      {productsLoading ? (
        <div className="loading-spinner">Loading products...</div>
      ) : (
        <div className="products-grid">
          {filteredProducts.length === 0 ? (
            <div className="no-results">
              <p>No products found {debouncedSearch && `matching "${debouncedSearch}"`}</p>
              {debouncedSearch && <button onClick={() => setSearchKeyword('')}>Clear Search</button>}
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  <img 
                    src={
                      Array.isArray(product.images) && product.images.length > 0 
                        ? product.images[0] 
                        : product.image || `https://placehold.co/300x200/3b82f6/ffffff?text=${encodeURIComponent(product.name)}`
                    } 
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = `https://placehold.co/300x200/3b82f6/ffffff?text=${encodeURIComponent(product.name)}`;
                    }}
                  />
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-description">{product.description || 'No description provided.'}</p>

                  {/* Show rating with default fallback to 4.5 if not provided or falsy */}
                  <div className="product-rating">
                    ⭐ {typeof product.rating === 'number' && !Number.isNaN(product.rating) && product.rating > 0 ? product.rating : 4.5}
                  </div>

                  {/* Price / discount display */}
                  <div className="product-price">
                    {product.discountPrice && Number(product.discountPrice) > 0 ? (
                      <>
                        <span className="discounted">₹{Number(product.discountPrice).toFixed(2)}</span>
                        <small className="original">₹{Number(product.price).toFixed(2)}</small>
                      </>
                    ) : (
                      <span>₹{Number(product.price || 0).toFixed(2)}</span>
                    )}
                  </div>

                  {/* Additional product details (show only when present) */}
                  <div className="product-meta">
                    {product.brand && <div><strong>Brand:</strong> {product.brand}</div>}
                    {product.petType && <div><strong>Pet Type:</strong> {product.petType}</div>}
                    {typeof product.stock !== 'undefined' && <div><strong>Stock:</strong> {product.stock}</div>}
                    {product.weight && <div><strong>Weight:</strong> {product.weight}</div>}
                    {product.dimensions && product.dimensions.unit && <div><strong>Dimensions unit:</strong> {product.dimensions.unit}</div>}
                    {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                      <div className="tag-list"><strong>Tags:</strong> {product.tags.join(', ')}</div>
                    )}
                    {product.shippingInfo && (
                      <div className="shipping-info">
                        <strong>Shipping:</strong> {product.shippingInfo.freeShipping ? 'Free' : 'Paid'} • {product.shippingInfo.deliveryTime || ''}
                      </div>
                    )}
                  </div>

                  <div className="product-actions">
                    <button
                      className="add-to-cart-btn"
                      onClick={() => addToCart(product)}
                      disabled={!user}
                    >
                      {user ? 'Add to Cart' : 'Login to Purchase'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Shopping Cart Sidebar */}
      {showCart && (
        <div className="cart-sidebar">
          <div className="cart-header">
            <h3>Shopping Cart</h3>
            <button
              className="close-cart"
              onClick={() => setShowCart(false)}
              disabled={loading}
            >
              ×
            </button>
          </div>
          <div className="cart-items">
            {cartItems.length === 0 ? (
              <p className="empty-cart">Your cart is empty</p>
            ) : (
              cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} />
                  <div className="cart-item-details">
                    <h4>{item.name}</h4>
                    <p>₹{item.price}</p>
                    <div className="quantity-controls">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={loading}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={loading}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    className="remove-item"
                    onClick={() => removeFromCart(item.id)}
                    disabled={loading}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
          {cartItems.length > 0 && (
            <div className="cart-footer">
              <div className="cart-total">
                Total: ₹{getCartTotal().toFixed(2)}
              </div>
              <button
                className="checkout-btn"
                onClick={openCheckout}
                disabled={loading}
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="checkout-modal">
          <div className="checkout-form-container">
            <div className="checkout-header">
              <h2>Checkout</h2>
            </div>
            <form onSubmit={handleCheckoutSubmit} className="checkout-form">
              {/* Inner-close button inside the form (won't submit because type="button") */}
              <button
                type="button"
                className="form-close-button"
                onClick={() => setShowCheckout(false)}
                aria-label="Close checkout"
                disabled={loading}
              >
                ×
              </button>
              <div className="form-section">
                <h3>Shipping Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={checkoutData.fullName}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                    {errors.fullName && <div className="form-error">{errors.fullName}</div>}
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={checkoutData.email}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                    {errors.email && <div className="form-error">{errors.email}</div>}
                  </div>
                </div>
                <div className="form-group">
                  <label>Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={checkoutData.address}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                  {errors.address && <div className="form-error">{errors.address}</div>}
                </div>
                <div className="address-details">
                  <div className="form-row">
                    <div className="form-group">
                      <label>State *</label>
                      <select 
                        name="state" 
                        value={checkoutData.state} 
                        onChange={handleInputChange} 
                        required 
                        disabled={loading}
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(s => (
                          <option key={s.code} value={s.code}>{s.name}</option>
                        ))}
                      </select>
                      {errors.state && <div className="form-error">{errors.state}</div>}
                    </div>
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        name="city"
                        value={checkoutData.city}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                      {errors.city && <div className="form-error">{errors.city}</div>}
                    </div>
                  </div>
                  <div className="form-group zip-code">
                    <label>ZIP Code *</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={checkoutData.zipCode}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                    {errors.zipCode && <div className="form-error">{errors.zipCode}</div>}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Delivery Preferences</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Preferred delivery date *</label>
                    <input 
                      type="date" 
                      name="deliveryDate" 
                      value={checkoutData.deliveryDate} 
                      min={today}
                      onChange={handleInputChange} 
                      required 
                      disabled={loading} 
                    />
                    {errors.deliveryDate && <div className="form-error">{errors.deliveryDate}</div>}
                  </div>
                  <div className="form-group">
                    <label>Preferred delivery time (evening only) *</label>
                    <input 
                      type="time" 
                      name="deliveryTime" 
                      value={checkoutData.deliveryTime} 
                      min={TIME_MIN} 
                      max={TIME_MAX}
                      onChange={handleInputChange} 
                      required 
                      disabled={loading} 
                    />
                    {errors.deliveryTime && <div className="form-error">{errors.deliveryTime}</div>}
                  </div>
                </div>
                <fieldset>
                  <legend>Extras</legend>
                  <label>
                    <input 
                      type="checkbox" 
                      name="extras.giftWrap" 
                      checked={checkoutData.extras.giftWrap} 
                      onChange={handleInputChange} 
                    /> 
                    Gift wrap
                  </label>
                  <label style={{ marginLeft: '1rem' }}>
                    <input 
                      type="checkbox" 
                      name="extras.includeReceipt" 
                      checked={checkoutData.extras.includeReceipt} 
                      onChange={handleInputChange} 
                    /> 
                    Include receipt
                  </label>
                </fieldset>
                <label className="switch" style={{ marginTop: '0.75rem' }}>
                  Priority delivery
                  <input 
                    type="checkbox" 
                    name="priorityDelivery" 
                    checked={checkoutData.priorityDelivery} 
                    onChange={handleInputChange} 
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="form-section">
                <h3>Payment Information</h3>
                <div className="payment-method-section">
                  <h4>Preferred payment method *</h4>
                  <div className="payment-options">
                    <label className="payment-option">
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="card" 
                        checked={checkoutData.paymentMethod === 'card'} 
                        onChange={handleInputChange} 
                      /> 
                      <span className="payment-label">Credit/Debit Card</span>
                    </label>
                    <label className="payment-option">
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="upi" 
                        checked={checkoutData.paymentMethod === 'upi'} 
                        onChange={handleInputChange} 
                      /> 
                      <span className="payment-label">UPI</span>
                    </label>
                    <label className="payment-option">
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="cod" 
                        checked={checkoutData.paymentMethod === 'cod'} 
                        onChange={handleInputChange} 
                      /> 
                      <span className="payment-label">Cash on Delivery</span>
                    </label>
                  </div>
                  {checkoutData.paymentMethod === 'upi' && (
                    <div className="form-group upi-input">
                      <label>UPI ID *</label>
                      <input
                        type="text"
                        name="upiId"
                        value={checkoutData.upiId || ''}
                        onChange={handleInputChange}
                        placeholder="username@bank"
                        required
                        disabled={loading}
                      />
                      {errors.upiId && <div className="form-error">{errors.upiId}</div>}
                    </div>
                  )}
                </div>
                {checkoutData.paymentMethod === 'card' && (
                  <>
                    <div className="form-group">
                      <label>Card Number *</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={checkoutData.cardNumber}
                        onChange={handleInputChange}
                        placeholder="1234 5678 9012 3456"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        maxLength={19}
                        required
                        disabled={loading}
                      />
                      {errors.cardNumber && <div className="form-error">{errors.cardNumber}</div>}
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Expiry Date *</label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={checkoutData.expiryDate}
                          onChange={handleInputChange}
                          placeholder="MM/YY"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          maxLength={5}
                          required
                          disabled={loading}
                        />
                        {errors.expiryDate && <div className="form-error">{errors.expiryDate}</div>}
                      </div>
                      <div className="form-group">
                        <label>CVV *</label>
                        <input
                          type="password"
                          name="cvv"
                          value={checkoutData.cvv}
                          onChange={handleInputChange}
                          placeholder="123"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          maxLength={3}
                          required
                          disabled={loading}
                        />
                        {errors.cvv && <div className="form-error">{errors.cvv}</div>}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="order-summary">
                <h3>Order Summary</h3>
                {cartItems.map(item => (
                  <div key={item.id} className="order-item">
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="order-total">
                  <strong>Total: ₹{getCartTotal().toFixed(2)}</strong>
                </div>
              </div>

              <button
                type="submit"
                className="place-order-btn"
                disabled={loading}
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessoriesPage;