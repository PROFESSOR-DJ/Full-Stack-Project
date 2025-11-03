import React, { useState, useEffect } from 'react';
import { daycareAPI, productsAPI, adoptionAPI, vendorDaycareAPI, vendorAccessoriesAPI, vendorAdoptionAPI } from '../../../services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './VendorDashboard.css';

const VendorDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState({
    daycare: [],
    adoption: [],
    accessories: []
  });
  const [stats, setStats] = useState({
    totalRequests: 0,
    daycareRequests: 0,
    adoptionRequests: 0,
    accessoriesRequests: 0,
    pendingRequests: 0,
    completedRequests: 0
  });
  const [filter, setFilter] = useState('all'); // all, daycare, adoption, accessories
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch vendor-specific data for all services in parallel
      const [daycareData, adoptionData, productsData] = await Promise.all([
        vendorDaycareAPI.getBookings().catch(() => []),
        // vendor adoption applications
        vendorAdoptionAPI.getApplications().catch(() => []),
        // vendor product orders
        vendorAccessoriesAPI.getOrders().catch(() => [])
      ]);

      setRequests({
        daycare: Array.isArray(daycareData) ? daycareData : [],
        adoption: Array.isArray(adoptionData) ? adoptionData : (adoptionData.applications || []),
        accessories: Array.isArray(productsData) ? productsData : []
      });

      // Normalize responses to arrays and calculate stats
      const daycareArray = Array.isArray(daycareData) ? daycareData : [];
      const adoptionArray = Array.isArray(adoptionData) ? adoptionData : (adoptionData.applications || []);
      const accessoriesArray = Array.isArray(productsData) ? productsData : [];

      const totalDaycare = daycareArray.length;
      const totalAdoption = adoptionArray.length;
      const totalAccessories = accessoriesArray.length;
      const total = totalDaycare + totalAdoption + totalAccessories;

      const allRequests = [
        ...daycareArray,
        ...adoptionArray,
        ...accessoriesArray
      ];

      const pending = allRequests.filter(r => 
        r.status === 'pending' || r.status === 'under_review'
      ).length;

      const completed = allRequests.filter(r => 
        r.status === 'completed' || r.status === 'delivered' || r.status === 'approved'
      ).length;

      setStats({
        totalRequests: total,
        daycareRequests: totalDaycare,
        adoptionRequests: totalAdoption,
        accessoriesRequests: totalAccessories,
        pendingRequests: pending,
        completedRequests: completed
      });
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert('Failed to fetch requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest || !newStatus) return;

    try {
      setLoading(true);
      
      // Call appropriate API based on request type
      if (selectedRequest.type === 'daycare') {
        await daycareAPI.updateBookingStatus(selectedRequest._id, newStatus);
      } else if (selectedRequest.type === 'adoption') {
        await adoptionAPI.updateApplicationStatus(selectedRequest._id, newStatus);
      } else if (selectedRequest.type === 'accessories') {
        await productsAPI.updateOrderStatus(selectedRequest._id, newStatus);
      }
      
      alert('Status updated successfully!');
      setShowStatusModal(false);
      setSelectedRequest(null);
      await fetchAllRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (request, type) => {
    setSelectedRequest({ ...request, type });
    setNewStatus(request.status);
    setShowStatusModal(true);
  };

  // Filter requests based on selected filters
  const getFilteredRequests = () => {
    let allRequests = [];

    if (filter === 'all' || filter === 'daycare') {
      allRequests = [
        ...allRequests,
        ...requests.daycare.map(r => ({ ...r, type: 'daycare' }))
      ];
    }

    if (filter === 'all' || filter === 'adoption') {
      allRequests = [
        ...allRequests,
        ...requests.adoption.map(r => ({ ...r, type: 'adoption' }))
      ];
    }

    if (filter === 'all' || filter === 'accessories') {
      allRequests = [
        ...allRequests,
        ...requests.accessories.map(r => ({ ...r, type: 'accessories' }))
      ];
    }

    if (statusFilter !== 'all') {
      allRequests = allRequests.filter(r => r.status === statusFilter);
    }

    return allRequests.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  };

  // Chart data preparation
  const getOverallChartData = () => {
    return [
      { name: 'Daycare', value: stats.daycareRequests, color: '#10b981' },
      { name: 'Adoption', value: stats.adoptionRequests, color: '#f59e0b' },
      { name: 'Accessories', value: stats.accessoriesRequests, color: '#8b5cf6' }
    ];
  };

  const getStatusChartData = (type) => {
    let data = [];
    if (type === 'daycare') data = requests.daycare;
    else if (type === 'adoption') data = requests.adoption;
    else if (type === 'accessories') data = requests.accessories;

    const statusCounts = {};
    data.forEach(item => {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    });

    return Object.keys(statusCounts).map(status => ({
      name: status.replace('_', ' '),
      value: statusCounts[status]
    }));
  };

  const getTrendChartData = (type) => {
    let data = [];
    if (type === 'daycare') data = requests.daycare;
    else if (type === 'adoption') data = requests.adoption;
    else if (type === 'accessories') data = requests.accessories;

    // Group by month
    const monthCounts = {};
    data.forEach(item => {
      const date = new Date(item.createdAt);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
    });

    return Object.keys(monthCounts).map(month => ({
      month,
      requests: monthCounts[month]
    }));
  };

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
      under_review: 'status-under_review',
      scheduled: 'status-scheduled'
    };
    return statusMap[status] || 'status-pending';
  };

  const COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#ef4444'];

  const filteredRequests = getFilteredRequests();

  if (!user || user.role !== 'vendor') {
    return (
      <div className="vendor-dashboard">
        <div className="error-message">
          <h3>Access Denied</h3>
          <p>You must be logged in as a vendor to view this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vendor-dashboard">
      <div className="dashboard-header">
        <h1>Vendor Dashboard</h1>
        <p>Manage and track all your service requests</p>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Requests</h3>
          <div className="stat-value">{stats.totalRequests}</div>
          <div className="stat-label">All Services</div>
        </div>
        <div className="stat-card daycare">
          <h3>Daycare Requests</h3>
          <div className="stat-value">{stats.daycareRequests}</div>
          <div className="stat-label">Booking Requests</div>
        </div>
        <div className="stat-card adoption">
          <h3>Adoption Requests</h3>
          <div className="stat-value">{stats.adoptionRequests}</div>
          <div className="stat-label">Applications</div>
        </div>
        <div className="stat-card accessories">
          <h3>Product Orders</h3>
          <div className="stat-value">{stats.accessoriesRequests}</div>
          <div className="stat-label">Accessories</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <h2>Analytics & Insights</h2>
        <div className="charts-grid">
          {/* Overall Distribution */}
          <div className="chart-container">
            <h3>Request Distribution by Service</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getOverallChartData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getOverallChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Daycare Status */}
          <div className="chart-container">
            <h3>Daycare Requests by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getStatusChartData('daycare')}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Adoption Status */}
          <div className="chart-container">
            <h3>Adoption Applications by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getStatusChartData('adoption')}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Accessories Trend */}
          <div className="chart-container">
            <h3>Product Orders Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getTrendChartData('accessories')}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="requests" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Requests Section */}
      <div className="requests-section">
        <div className="requests-header">
          <h2>All Requests</h2>
          <div className="filter-controls">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Services</option>
              <option value="daycare">Daycare</option>
              <option value="adoption">Adoption</option>
              <option value="accessories">Accessories</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="approved">Approved</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
            </select>
            <button
              className="refresh-btn"
              onClick={fetchAllRequests}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="no-requests">
            <div className="no-requests-icon">📋</div>
            <h3>No Requests Found</h3>
            <p>There are no requests matching your current filters.</p>
          </div>
        ) : (
          <div className="requests-list">
            {filteredRequests.map((request) => (
              <div key={`${request.type}-${request._id}`} className="request-card">
                <div className="request-header">
                  <span className={`request-type-badge ${request.type}`}>
                    {request.type}
                  </span>
                  <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="request-details">
                  {request.type === 'daycare' && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Pet Name:</span>
                        <span className="detail-value">{request.petName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Pet Type:</span>
                        <span className="detail-value">{request.petType}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{request.email}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Mobile:</span>
                        <span className="detail-value">{request.mobileNumber}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Duration:</span>
                        <span className="detail-value">
                          {formatDate(request.startDate)} - {formatDate(request.endDate)}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Total Amount:</span>
                        <span className="detail-value amount">₹{request.totalAmount}</span>
                      </div>
                    </>
                  )}

                  {request.type === 'adoption' && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Pet Name:</span>
                        <span className="detail-value">{request.pet?.name}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Pet Type:</span>
                        <span className="detail-value">{request.pet?.type} - {request.pet?.breed}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Applicant:</span>
                        <span className="detail-value">{request.personalInfo?.fullName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{request.personalInfo?.email}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{request.personalInfo?.phone}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Visit Scheduled:</span>
                        <span className="detail-value">
                          {formatDate(request.visitSchedule?.date)} at {request.visitSchedule?.time}
                        </span>
                      </div>
                    </>
                  )}

                  {request.type === 'accessories' && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Order ID:</span>
                        <span className="detail-value">#{request._id.slice(-8).toUpperCase()}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Customer:</span>
                        <span className="detail-value">{request.shippingAddress?.fullName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Items:</span>
                        <span className="detail-value">
                          {request.items?.length} item(s)
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Shipping Address:</span>
                        <span className="detail-value">
                          {request.shippingAddress?.address}, {request.shippingAddress?.city}, {request.shippingAddress?.state} - {request.shippingAddress?.zipCode}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Total Amount:</span>
                        <span className="detail-value amount">₹{request.totalAmount}</span>
                      </div>
                    </>
                  )}

                  <div className="detail-row">
                    <span className="detail-label">Request Date:</span>
                    <span className="detail-value">{formatDate(request.createdAt)}</span>
                  </div>
                </div>

                <div className="request-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => openStatusModal(request, request.type)}
                    disabled={loading}
                  >
                    Update Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Update Status</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedRequest(null);
                }}
                disabled={loading}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Select New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={loading}
                >
                  {selectedRequest.type === 'daycare' && (
                    <>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </>
                  )}
                  {selectedRequest.type === 'adoption' && (
                    <>
                      <option value="pending">Pending</option>
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="scheduled">Scheduled</option>
                    </>
                  )}
                  {selectedRequest.type === 'accessories' && (
                    <>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-success"
                onClick={handleStatusUpdate}
                disabled={loading || newStatus === selectedRequest.status}
              >
                {loading ? 'Updating...' : 'Update Status'}
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedRequest(null);
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;