import React, { useState, useEffect } from 'react';
import { daycareAPI } from '../../../services/api';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './CustomerDashboard.css';

const CustomerDashboard = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState({
        totalBookings: 0,
        bookingsLastWeek: 0,
        totalAmountSpent: 0,
        amountSpentLastWeek: 0
    });

    useEffect(() => {
        if (user) {
            fetchBookings();
        }
    }, [user]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const data = await daycareAPI.getBookings();
            setBookings(Array.isArray(data) ? data : []);
            calculateStats(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (bookingsData) => {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const totalBookings = bookingsData.length;
        const bookingsLastWeek = bookingsData.filter(
            booking => new Date(booking.createdAt) >= oneWeekAgo
        ).length;

        const totalAmountSpent = bookingsData.reduce(
            (sum, booking) => sum + (booking.totalAmount || 0), 0
        );

        const amountSpentLastWeek = bookingsData
            .filter(booking => new Date(booking.createdAt) >= oneWeekAgo)
            .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

        setStats({
            totalBookings,
            bookingsLastWeek,
            totalAmountSpent,
            amountSpentLastWeek
        });
    };

    // Prepare data for amount spent across daycare centers (Pie Chart)
    const getAmountByDaycareData = () => {
        const daycareMap = {};

        bookings.forEach(booking => {
            const centerName = booking.daycareCenter?.name || 'Unknown Center';
            if (!daycareMap[centerName]) {
                daycareMap[centerName] = 0;
            }
            daycareMap[centerName] += booking.totalAmount || 0;
        });

        return Object.keys(daycareMap).map(name => ({
            name,
            value: daycareMap[name]
        }));
    };

    // Prepare data for number of bookings across daycare centers (Bar Chart)
    const getBookingsByDaycareData = () => {
        const daycareMap = {};

        bookings.forEach(booking => {
            const centerName = booking.daycareCenter?.name || 'Unknown Center';
            if (!daycareMap[centerName]) {
                daycareMap[centerName] = 0;
            }
            daycareMap[centerName]++;
        });

        return Object.keys(daycareMap).map(name => ({
            name,
            bookings: daycareMap[name]
        }));
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

    if (!user) {
        return (
            <div className="customer-dashboard">
                <div className="error-message">
                    <h3>Access Denied</h3>
                    <p>You must be logged in to view this dashboard.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="customer-dashboard">
            <div className="dashboard-header">
                <h1>My Dashboard</h1>
                <p>Overview of your daycare bookings and spending</p>
            </div>

            {loading ? (
                <div className="loading-spinner">Loading dashboard...</div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="dashboard-stats">
                        <div className="stat-card total">
                            <div className="stat-icon">📊</div>
                            <div className="stat-content">
                                <h3>Total Bookings</h3>
                                <div className="stat-value">{stats.totalBookings}</div>
                                <div className="stat-label">All Time</div>
                            </div>
                        </div>

                        <div className="stat-card weekly">
                            <div className="stat-icon">📅</div>
                            <div className="stat-content">
                                <h3>Bookings Last Week</h3>
                                <div className="stat-value">{stats.bookingsLastWeek}</div>
                                <div className="stat-label">Last 7 Days</div>
                            </div>
                        </div>

                        <div className="stat-card amount">
                            <div className="stat-icon">💰</div>
                            <div className="stat-content">
                                <h3>Total Amount Spent</h3>
                                <div className="stat-value">₹{stats.totalAmountSpent.toLocaleString()}</div>
                                <div className="stat-label">All Time</div>
                            </div>
                        </div>

                        <div className="stat-card weekly-amount">
                            <div className="stat-icon">💵</div>
                            <div className="stat-content">
                                <h3>Amount Spent Last Week</h3>
                                <div className="stat-value">₹{stats.amountSpentLastWeek.toLocaleString()}</div>
                                <div className="stat-label">Last 7 Days</div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    {bookings.length > 0 ? (
                        <div className="charts-section">
                            <h2>Booking Analytics</h2>
                            <div className="charts-grid">
                                {/* Amount Spent by Daycare Center - Pie Chart */}
                                <div className="chart-container">
                                    <h3>Amount Spent Across Daycare Centers</h3>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <PieChart>
                                            <Pie
                                                data={getAmountByDaycareData()}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, value }) => `${name}: ₹${value}`}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {getAmountByDaycareData().map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `₹${value}`} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Number of Bookings by Daycare Center - Bar Chart */}
                                <div className="chart-container">
                                    <h3>Number of Bookings Across Daycare Centers</h3>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <BarChart data={getBookingsByDaycareData()}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="bookings" fill="#3b82f6" name="Number of Bookings" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="no-data">
                            <div className="no-data-icon">📋</div>
                            <h3>No Bookings Yet</h3>
                            <p>You haven't made any daycare bookings yet. Start booking to see your analytics!</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CustomerDashboard;
