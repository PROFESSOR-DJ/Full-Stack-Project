import React, { useState, useEffect } from 'react';
import { daycareAPI, productsAPI, adoptionAPI } from '../../../services/api';
import './BookingsPage.css';

const BookingsPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('daycare');
  const [daycareBookings, setDaycareBookings] = useState([]);
  const [productOrders, setProductOrders] = useState([]);
  const [adoptionApplications, setAdoptionApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [accessoriesSortBy, setAccessoriesSortBy] = useState('createdAt-desc');

  // Edit modal state for daycare
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editFormData, setEditFormData] = useState({
    petName: '',
    petType: '',
    petAge: '',
    email: '',
    mobileNumber: '',
    startDate: '',
    endDate: '',
    specialInstructions: ''
  });

  // Edit modal state for accessories (shipping address)
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [addressErrors, setAddressErrors] = useState({});

  // Edit modal state for adoption applications
  const [showAdoptionModal, setShowAdoptionModal] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [adoptionFormData, setAdoptionFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    experienceLevel: '',
    experienceDetails: '',
    otherPets: '',
    otherPetsDetails: '',
    visitDate: '',
    visitTime: '',
    adoptionReason: ''
  });

  useEffect(() => {
    if (user) {
      fetchAllBookings();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'daycare') {
      const delayDebounce = setTimeout(() => {
        handleDaycareSearch();
      }, 500);
      return () => clearTimeout(delayDebounce);
    }
  }, [searchKeyword, user]);

  const handleDaycareSearch = async () => {
    try {
      setIsSearching(true);
      const daycareData = await daycareAPI.getBookings(searchKeyword);
      const sortedData = sortBookings(Array.isArray(daycareData) ? daycareData : [], sortBy);
      setDaycareBookings(sortedData);
    } catch (error) {
      console.error('Error searching daycare bookings:', error);
      setDaycareBookings([]);
    } finally {
      setIsSearching(false);
    }
  };

  const sortBookings = (bookings, sortOption) => {
    const sorted = [...bookings];
    switch (sortOption) {
      case 'totalAmount-asc':
        return sorted.sort((a, b) => a.totalAmount - b.totalAmount);
      case 'totalAmount-desc':
        return sorted.sort((a, b) => b.totalAmount - a.totalAmount);
      case 'createdAt-asc':
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'createdAt-desc':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      default:
        return sorted;
    }
  };

  const handleSortChange = (e) => {
    const newSortBy = e.target.value;
    setSortBy(newSortBy);
    const sortedData = sortBookings(daycareBookings, newSortBy);
    setDaycareBookings(sortedData);
  };

  const handleAccessoriesSortChange = (e) => {
    const newSortBy = e.target.value;
    setAccessoriesSortBy(newSortBy);
    const sortedData = sortBookings(productOrders, newSortBy);
    setProductOrders(sortedData);
  };

  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  const clearSearch = () => {
    setSearchKeyword('');
  };

  const fetchAllBookings = async () => {
    try {
      setLoading(true);

      try {
        const daycareData = await daycareAPI.getBookings(searchKeyword);
        setDaycareBookings(Array.isArray(daycareData) ? daycareData : []);
      } catch (error) {
        console.error('Error fetching daycare bookings:', error);
        setDaycareBookings([]);
      }

      try {
        const productsData = await productsAPI.getOrders();
        const sortedProducts = sortBookings(Array.isArray(productsData) ? productsData : [], accessoriesSortBy);
        setProductOrders(sortedProducts);
      } catch (error) {
        console.error('Error fetching product orders:', error);
        setProductOrders([]);
      }

      try {
        const adoptionData = await adoptionAPI.getApplications();
        setAdoptionApplications(adoptionData.applications || []);
      } catch (error) {
        console.error('Error fetching adoption applications:', error);
        setAdoptionApplications([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== DAYCARE FUNCTIONS ====================

  const handleRevokeBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setLoading(true);
      await daycareAPI.cancelBooking(bookingId);
      alert('Booking cancelled successfully!');
      await fetchAllBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setEditFormData({
      petName: booking.petName,
      petType: booking.petType,
      petAge: booking.petAge,
      email: booking.email || '',
      mobileNumber: booking.mobileNumber || '',
      startDate: new Date(booking.startDate).toISOString().split('T')[0],
      endDate: new Date(booking.endDate).toISOString().split('T')[0],
      specialInstructions: booking.specialInstructions || ''
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await daycareAPI.updateBooking(editingBooking._id, editFormData);
      alert('Booking updated successfully!');
      setShowEditModal(false);
      setEditingBooking(null);
      await fetchAllBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert(error.response?.data?.message || 'Failed to update booking');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      // Simply delete the booking - no need to cancel first
      await daycareAPI.deleteBooking(bookingId);
      alert('Booking deleted successfully!');
      await fetchAllBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert(error.response?.data?.message || 'Failed to delete booking');
    } finally {
      setLoading(false);
    }
  };

  // ==================== ACCESSORIES/PRODUCTS FUNCTIONS ====================

  const handleEditOrderAddress = (order) => {
    setEditingOrder(order);
    setAddressFormData({
      fullName: order.shippingAddress?.fullName || '',
      email: order.shippingAddress?.email || '',
      address: order.shippingAddress?.address || '',
      city: order.shippingAddress?.city || '',
      state: order.shippingAddress?.state || '',
      zipCode: order.shippingAddress?.zipCode || ''
    });
    setShowAddressModal(true);
  };

  const handleAddressFormChange = (e) => {
    const { name, value } = e.target;
    setAddressFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // clear or set inline validation for ZIP as user types
    if (name === 'zipCode') {
      setAddressErrors(prev => {
        const next = { ...prev };
        if (!value || !/^\d{6}$/.test(value)) next.zipCode = 'ZIP Code must be exactly 6 digits';
        else delete next.zipCode;
        return next;
      });
    }
  };

  const handleAddressFormSubmit = async (e) => {
    e.preventDefault();
    // client-side validation: ZIP code must be numeric and exactly 6 digits
    if (!addressFormData.zipCode || !/^\d{6}$/.test(addressFormData.zipCode)) {
      setAddressErrors({ zipCode: 'ZIP Code must be exactly 6 digits' });
      return;
    }

    try {
      setLoading(true);
      await productsAPI.updateOrderAddress(editingOrder._id, addressFormData);
      alert('Delivery address updated successfully!');
      setShowAddressModal(false);
      setEditingOrder(null);
      await fetchAllBookings();
    } catch (error) {
      console.error('Error updating address:', error);
      const resp = error.response?.data;
      if (resp) {
        if (Array.isArray(resp.errors)) {
          const apiErrors = {};
          resp.errors.forEach(err => {
            const parts = err.param ? err.param.split('.') : [];
            const key = parts.length ? parts[parts.length - 1] : err.param;
            if (key) apiErrors[key] = err.msg;
          });
          setAddressErrors(prev => ({ ...prev, ...apiErrors }));
        }
        alert(resp.message || 'Failed to update delivery address');
      } else {
        alert('Failed to update delivery address');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setLoading(true);
      await productsAPI.cancelOrder(orderId);
      alert('Order cancelled successfully!');
      await fetchAllBookings();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await productsAPI.deleteOrder(orderId);
      alert('Order deleted successfully!');
      await fetchAllBookings();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert(error.response?.data?.message || 'Failed to delete order');
    } finally {
      setLoading(false);
    }
  };

  // ==================== ADOPTION FUNCTIONS ====================

  const handleEditAdoption = (application) => {
    setEditingApplication(application);
    setAdoptionFormData({
      fullName: application.personalInfo?.fullName || '',
      email: application.personalInfo?.email || '',
      phone: application.personalInfo?.phone || '',
      address: application.personalInfo?.address || '',
      experienceLevel: application.experience?.level || '',
      experienceDetails: application.experience?.details || '',
      otherPets: application.experience?.otherPets || '',
      otherPetsDetails: application.experience?.otherPetsDetails || '',
      visitDate: new Date(application.visitSchedule?.date).toISOString().split('T')[0] || '',
      visitTime: application.visitSchedule?.time || '',
      adoptionReason: application.adoptionReason || ''
    });
    setShowAdoptionModal(true);
  };

  const handleAdoptionFormChange = (e) => {
    const { name, value } = e.target;
    setAdoptionFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdoptionFormSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const updateData = {
        personalInfo: {
          fullName: adoptionFormData.fullName,
          email: adoptionFormData.email,
          phone: adoptionFormData.phone,
          address: adoptionFormData.address
        },
        experience: {
          level: adoptionFormData.experienceLevel,
          details: adoptionFormData.experienceDetails,
          otherPets: adoptionFormData.otherPets,
          otherPetsDetails: adoptionFormData.otherPetsDetails
        },
        visitSchedule: {
          date: adoptionFormData.visitDate,
          time: adoptionFormData.visitTime
        },
        adoptionReason: adoptionFormData.adoptionReason
      };

      await adoptionAPI.updateApplication(editingApplication._id, updateData);
      alert('Adoption application updated successfully!');
      setShowAdoptionModal(false);
      setEditingApplication(null);
      await fetchAllBookings();
    } catch (error) {
      console.error('Error updating adoption application:', error);
      alert(error.response?.data?.message || 'Failed to update application');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAdoption = async (applicationId) => {
    if (!window.confirm('Are you sure you want to revoke this adoption application?')) {
      return;
    }

    try {
      setLoading(true);
      await adoptionAPI.revokeApplication(applicationId);
      alert('Adoption application revoked successfully!');
      await fetchAllBookings();
    } catch (error) {
      console.error('Error revoking adoption application:', error);
      alert(error.response?.data?.message || 'Failed to revoke application');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdoption = async (applicationId) => {
    if (!window.confirm('Are you sure you want to delete this adoption application? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await adoptionAPI.deleteApplication(applicationId);
      alert('Adoption application deleted successfully!');
      await fetchAllBookings();
    } catch (error) {
      console.error('Error deleting adoption application:', error);
      alert(error.response?.data?.message || 'Failed to delete application');
    } finally {
      setLoading(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      processing: 'status-processing',
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      completed: 'status-completed',
      cancelled: 'status-cancelled',
      rejected: 'status-cancelled',
      approved: 'status-approved',
      under_review: 'status-review',
      scheduled: 'status-scheduled'
    };
    return statusMap[status] || 'status-pending';
  };

  if (!user) {
    return (
      <div className="bookings-page">
        <div className="bookings-container">
          <div className="no-bookings">
            <h2>Please Login</h2>
            <p>You need to be logged in to view your bookings.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bookings-page">
      <div className="bookings-container">
        <div className="bookings-header-section">
          <h1 className="bookings-title">My Bookings</h1>
          <button
            className="refresh-btn"
            onClick={fetchAllBookings}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="bookings-tabs">
          <button
            className={`tab-btn ${activeTab === 'daycare' ? 'active' : ''}`}
            onClick={() => setActiveTab('daycare')}
          >
            Daycare Bookings
            <span className="tab-count">{daycareBookings.length}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'accessories' ? 'active' : ''}`}
            onClick={() => setActiveTab('accessories')}
          >
            Accessories Orders
            <span className="tab-count">{productOrders.length}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'adoption' ? 'active' : ''}`}
            onClick={() => setActiveTab('adoption')}
          >
            Adoption Applications
            <span className="tab-count">{adoptionApplications.length}</span>
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading bookings...</div>
        ) : (
          <div className="bookings-content">
            {/* DAYCARE TAB */}
            {activeTab === 'daycare' && (
              <div className="bookings-list">
                <div className="search-bar-container">
                  <div className="search-sort-container">
                    <div className="search-input-wrapper">
                      <input
                        type="text"
                        className="search-input"
                        placeholder="Search by pet name, type, center, location, status..."
                        value={searchKeyword}
                        onChange={handleSearchChange}
                      />
                      {searchKeyword && (
                        <button
                          className="clear-search-btn"
                          onClick={clearSearch}
                          title="Clear search"
                        >
                          ✕
                        </button>
                      )}
                      {isSearching && (
                        <span className="search-loading">🔍</span>
                      )}
                    </div>

                    <div className="sort-controls">
                      <label className="sort-label">Sort by:</label>
                      <select
                        className="sort-select"
                        value={sortBy}
                        onChange={handleSortChange}
                      >
                        <option value="createdAt-desc">Newest First</option>
                        <option value="createdAt-asc">Oldest First</option>
                        <option value="totalAmount-desc">Amount: High to Low</option>
                        <option value="totalAmount-asc">Amount: Low to High</option>
                      </select>
                    </div>
                  </div>

                  {searchKeyword && (
                    <div className="search-results-info">
                      Found {daycareBookings.length} result{daycareBookings.length !== 1 ? 's' : ''}
                      {searchKeyword && ` for "${searchKeyword}"`}
                    </div>
                  )}
                </div>

                {daycareBookings.length === 0 ? (
                  <div className="no-bookings">
                    <div className="no-bookings-icon">📅</div>
                    {searchKeyword ? (
                      <>
                        <h3>No Results Found</h3>
                        <p>No daycare bookings match your search "{searchKeyword}".</p>
                        <button className="clear-search-btn-inline" onClick={clearSearch}>
                          Clear Search
                        </button>
                      </>
                    ) : (
                      <>
                        <h3>No Daycare Bookings Yet</h3>
                        <p>You haven't made any daycare bookings yet.</p>
                        <p>Visit the Centers page to book a daycare service for your pet.</p>
                      </>
                    )}
                  </div>
                ) : (
                  daycareBookings.map((booking) => (
                    <div key={booking._id} className="booking-card">
                      <div className="booking-header">
                        <h3>{booking.daycareCenter?.name || 'Daycare Center'}</h3>
                        <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="booking-details">
                        <div className="detail-row">
                          <span className="detail-label">Pet Name:</span>
                          <span className="detail-value">{booking.petName}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Pet Type:</span>
                          <span className="detail-value">{booking.petType}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Email:</span>
                          <span className="detail-value">{booking.email || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Mobile:</span>
                          <span className="detail-value">{booking.mobileNumber || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Location:</span>
                          <span className="detail-value">{booking.daycareCenter?.location || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Start Date:</span>
                          <span className="detail-value">{formatDate(booking.startDate)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">End Date:</span>
                          <span className="detail-value">{formatDate(booking.endDate)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Total Amount:</span>
                          <span className="detail-value amount">₹{booking.totalAmount}</span>
                        </div>
                        {booking.specialInstructions && (
                          <div className="detail-row">
                            <span className="detail-label">Special Instructions:</span>
                            <span className="detail-value">{booking.specialInstructions}</span>
                          </div>
                        )}
                        <div className="detail-row">
                          <span className="detail-label">Booked On:</span>
                          <span className="detail-value">{formatDate(booking.createdAt)}</span>
                        </div>
                      </div>

                      <div className="booking-actions">
                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                          <>
                            <button
                              className="btn btn-primary btn-small"
                              onClick={() => handleEditBooking(booking)}
                              disabled={loading}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-secondary btn-small"
                              onClick={() => handleRevokeBooking(booking._id)}
                              disabled={loading}
                            >
                              Revoke
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleDeleteBooking(booking._id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ACCESSORIES TAB */}
            {activeTab === 'accessories' && (
              <div className="bookings-list">
                {productOrders.length > 0 && (
                  <div className="search-bar-container">
                    <div className="sort-controls">
                      <label className="sort-label">Sort by:</label>
                      <select
                        className="sort-select"
                        value={accessoriesSortBy}
                        onChange={handleAccessoriesSortChange}
                      >
                        <option value="createdAt-desc">Newest First</option>
                        <option value="createdAt-asc">Oldest First</option>
                        <option value="totalAmount-desc">Amount: High to Low</option>
                        <option value="totalAmount-asc">Amount: Low to High</option>
                      </select>
                    </div>
                  </div>
                )}

                {productOrders.length === 0 ? (
                  <div className="no-bookings">
                    <div className="no-bookings-icon">🛍️</div>
                    <h3>No Accessory Orders Yet</h3>
                    <p>You haven't placed any accessory orders yet.</p>
                  </div>
                ) : (
                  productOrders.map((order) => (
                    <div key={order._id} className="booking-card">
                      <div className="booking-header">
                        <h3>Order #{order._id.slice(-8).toUpperCase()}</h3>
                        <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="booking-details">
                        <div className="order-items">
                          <h4>Items:</h4>
                          {order.items?.map((item, index) => (
                            <div key={index} className="order-item">
                              <div className="order-item-info">
                                <span className="item-name">{item.name}</span>
                                <span className="item-quantity">Qty: {item.quantity}</span>
                              </div>
                              <span className="item-price">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Shipping Address:</span>
                          <span className="detail-value">
                            {order.shippingAddress?.fullName}<br />
                            {order.shippingAddress?.address}, {order.shippingAddress?.city}<br />
                            {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Total Amount:</span>
                          <span className="detail-value amount">₹{order.totalAmount}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Ordered On:</span>
                          <span className="detail-value">{formatDate(order.createdAt)}</span>
                        </div>
                      </div>

                      <div className="booking-actions">
                        {order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'shipped' && (
                          <>
                            <button
                              className="btn btn-primary btn-small"
                              onClick={() => handleEditOrderAddress(order)}
                              disabled={loading}
                            >
                              Edit Address
                            </button>
                            <button
                              className="btn btn-secondary btn-small"
                              onClick={() => handleCancelOrder(order._id)}
                              disabled={loading}
                            >
                              Cancel Order
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleDeleteOrder(order._id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ADOPTION TAB */}
            {activeTab === 'adoption' && (
              <div className="bookings-list">
                {adoptionApplications.length === 0 ? (
                  <div className="no-bookings">
                    <div className="no-bookings-icon">🐾</div>
                    <h3>No Adoption Applications Yet</h3>
                    <p>You haven't submitted any adoption applications yet.</p>
                  </div>
                ) : (
                  adoptionApplications.map((application) => (
                    <div key={application._id} className="booking-card">
                      <div className="booking-header">
                        <h3>{application.pet?.name || 'Pet Adoption'}</h3>
                        <span className={`status-badge ${getStatusBadgeClass(application.status)}`}>
                          {application.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="booking-details">
                        <div className="detail-row">
                          <span className="detail-label">Pet Type:</span>
                          <span className="detail-value">{application.pet?.type}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Breed:</span>
                          <span className="detail-value">{application.pet?.breed}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Age:</span>
                          <span className="detail-value">{application.pet?.age}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Shelter:</span>
                          <span className="detail-value">{application.pet?.shelter}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Contact Name:</span>
                          <span className="detail-value">{application.personalInfo?.fullName}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Email:</span>
                          <span className="detail-value">{application.personalInfo?.email}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Phone:</span>
                          <span className="detail-value">{application.personalInfo?.phone}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Experience Level:</span>
                          <span className="detail-value">{application.experience?.level}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Visit Scheduled:</span>
                          <span className="detail-value">
                            {formatDate(application.visitSchedule?.date)} at {application.visitSchedule?.time}
                          </span>
                        </div>
                        {application.adoptionReason && (
                          <div className="detail-row">
                            <span className="detail-label">Adoption Reason:</span>
                            <span className="detail-value">{application.adoptionReason}</span>
                          </div>
                        )}
                        <div className="detail-row">
                          <span className="detail-label">Applied On:</span>
                          <span className="detail-value">{formatDate(application.createdAt)}</span>
                        </div>
                      </div>

                      {/* Action Buttons for Adoption */}
                      <div className="booking-actions">
                        {application.status !== 'approved' && application.status !== 'rejected' && (
                          <>
                            <button
                              className="btn btn-primary btn-small"
                              onClick={() => handleEditAdoption(application)}
                              disabled={loading}
                            >
                              Edit Details
                            </button>
                            <button
                              className="btn btn-secondary btn-small"
                              onClick={() => handleRevokeAdoption(application._id)}
                              disabled={loading}
                            >
                              Revoke
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleDeleteAdoption(application._id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Daycare Edit Modal */}
        {showEditModal && editingBooking && (
          <div className="modal-overlay">
            <div className="edit-modal">
              <div className="modal-header">
                <h2>Edit Booking</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBooking(null);
                  }}
                  disabled={loading}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleEditFormSubmit} className="edit-form">
                <div className="form-group">
                  <label>Pet Name *</label>
                  <input
                    type="text"
                    name="petName"
                    value={editFormData.petName}
                    onChange={handleEditFormChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Pet Type *</label>
                    <select
                      name="petType"
                      value={editFormData.petType}
                      onChange={handleEditFormChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Type</option>
                      <option value="Dog">Dog</option>
                      <option value="Cat">Cat</option>
                      <option value="Bird">Bird</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Pet Age *</label>
                    <input
                      type="number"
                      name="petAge"
                      value={editFormData.petAge}
                      onChange={handleEditFormChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditFormChange}
                      required
                      disabled={loading}
                      placeholder="Enter email address"
                      pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                    />
                  </div>

                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={editFormData.mobileNumber}
                      onChange={handleEditFormChange}
                      required
                      disabled={loading}
                      placeholder="Enter 10-digit mobile number"
                      pattern="[6-9]\d{9}"
                      maxLength="10"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={editFormData.startDate}
                      onChange={handleEditFormChange}
                      required
                      disabled={loading}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date *</label>
                    <input
                      type="date"
                      name="endDate"
                      value={editFormData.endDate}
                      onChange={handleEditFormChange}
                      required
                      disabled={loading}
                      min={editFormData.startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Special Instructions</label>
                  <textarea
                    name="specialInstructions"
                    value={editFormData.specialInstructions}
                    onChange={handleEditFormChange}
                    rows="3"
                    disabled={loading}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Booking'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingBooking(null);
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

        {/* Accessories Address Edit Modal */}
        {showAddressModal && editingOrder && (
          <div className="modal-overlay">
            <div className="edit-modal">
              <div className="modal-header">
                <h2>Edit Delivery Address</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowAddressModal(false);
                    setEditingOrder(null);
                  }}
                  disabled={loading}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleAddressFormSubmit} className="edit-form">
                <h3>Shipping Information</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={addressFormData.fullName}
                      onChange={handleAddressFormChange}
                      required
                      disabled={loading}
                      placeholder="Enter full name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={addressFormData.email}
                      onChange={handleAddressFormChange}
                      required
                      disabled={loading}
                      placeholder="Enter email"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={addressFormData.address}
                    onChange={handleAddressFormChange}
                    required
                    disabled={loading}
                    placeholder="Enter street address"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      name="city"
                      value={addressFormData.city}
                      onChange={handleAddressFormChange}
                      required
                      disabled={loading}
                      placeholder="Enter city"
                    />
                  </div>

                  <div className="form-group">
                    <label>State *</label>
                    <input
                      type="text"
                      name="state"
                      value={addressFormData.state}
                      onChange={handleAddressFormChange}
                      required
                      disabled={loading}
                      placeholder="Enter state"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>ZIP Code *</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={addressFormData.zipCode}
                    onChange={handleAddressFormChange}
                    required
                    disabled={loading}
                    placeholder="Enter ZIP code"
                    maxLength="6"
                  />
                  {addressErrors.zipCode && <div className="form-error">{addressErrors.zipCode}</div>}
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Address'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddressModal(false);
                      setEditingOrder(null);
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

        {/* Adoption Edit Modal */}
        {showAdoptionModal && editingApplication && (
          <div className="modal-overlay">
            <div className="edit-modal large">
              <div className="modal-header">
                <h2>Edit Adoption Application</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowAdoptionModal(false);
                    setEditingApplication(null);
                  }}
                  disabled={loading}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleAdoptionFormSubmit} className="edit-form">
                <h3>Personal Information</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={adoptionFormData.fullName}
                      onChange={handleAdoptionFormChange}
                      required
                      disabled={loading}
                      placeholder="Enter full name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={adoptionFormData.phone}
                      onChange={handleAdoptionFormChange}
                      required
                      disabled={loading}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={adoptionFormData.email}
                    onChange={handleAdoptionFormChange}
                    required
                    disabled={loading}
                    placeholder="Enter email"
                  />
                </div>

                <div className="form-group">
                  <label>Home Address *</label>
                  <textarea
                    name="address"
                    value={adoptionFormData.address}
                    onChange={handleAdoptionFormChange}
                    rows="3"
                    required
                    disabled={loading}
                    placeholder="Enter complete home address"
                  />
                </div>

                <h3>Pet Experience</h3>

                <div className="form-group">
                  <label>Experience Level *</label>
                  <select
                    name="experienceLevel"
                    value={adoptionFormData.experienceLevel}
                    onChange={handleAdoptionFormChange}
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
                  <label>Experience Details</label>
                  <textarea
                    name="experienceDetails"
                    value={adoptionFormData.experienceDetails}
                    onChange={handleAdoptionFormChange}
                    rows="3"
                    disabled={loading}
                    placeholder="Tell us about your experience with pets..."
                  />
                </div>

                <div className="form-group">
                  <label>Do you have other pets? *</label>
                  <select
                    name="otherPets"
                    value={adoptionFormData.otherPets}
                    onChange={handleAdoptionFormChange}
                    disabled={loading}
                  >
                    <option value="">Select Option</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                {adoptionFormData.otherPets === 'yes' && (
                  <div className="form-group">
                    <label>Please describe your other pets</label>
                    <textarea
                      name="otherPetsDetails"
                      value={adoptionFormData.otherPetsDetails}
                      onChange={handleAdoptionFormChange}
                      rows="2"
                      disabled={loading}
                      placeholder="Types, breeds, ages of your other pets..."
                    />
                  </div>
                )}

                <h3>Visit Schedule</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label>Preferred Visit Date *</label>
                    <input
                      type="date"
                      name="visitDate"
                      value={adoptionFormData.visitDate}
                      onChange={handleAdoptionFormChange}
                      required
                      disabled={loading}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="form-group">
                    <label>Preferred Time *</label>
                    <select
                      name="visitTime"
                      value={adoptionFormData.visitTime}
                      onChange={handleAdoptionFormChange}
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

                <h3>Additional Information</h3>

                <div className="form-group">
                  <label>Why do you want to adopt this pet?</label>
                  <textarea
                    name="adoptionReason"
                    value={adoptionFormData.adoptionReason}
                    onChange={handleAdoptionFormChange}
                    rows="3"
                    disabled={loading}
                    placeholder="Please tell us why you're interested in adopting..."
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Application'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAdoptionModal(false);
                      setEditingApplication(null);
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
    </div>
  );
};

export default BookingsPage;