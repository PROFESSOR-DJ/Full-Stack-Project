import React, { useState, useEffect } from 'react';
import { daycareAPI, productsAPI, adoptionAPI } from '../../../services/api';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './CustomerDashboard.css';

const CustomerDashboard = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [orders, setOrders] = useState([]);
    const [applications, setApplications] = useState([]);
    const [stats, setStats] = useState({
        totalBookings: 0,
        bookingsLastWeek: 0,
        totalOrders: 0,
        ordersLastWeek: 0,
        totalApplications: 0,
        applicationsLastWeek: 0,
        totalActivities: 0,
        activitiesLastWeek: 0,
        totalAmountSpent: 0,
        amountSpentLastWeek: 0
    });

    useEffect(() => {
        if (user) {
            fetchAllHistory();
        }
    }, [user]);

    const fetchAllHistory = async () => {
        try {
            setLoading(true);

            // Fetch daycare bookings, product orders, and adoption applications in parallel
            const [bookingsResp, ordersResp, appsResp] = await Promise.all([
                daycareAPI.getBookings(),
                productsAPI.getOrders(),
                adoptionAPI.getApplications()
            ]);

            // helper to extract an array from various possible API response shapes
            const extractArray = (resp) => {
                if (!resp) return [];
                if (Array.isArray(resp)) return resp;
                if (typeof resp === 'object') {
                    // common array property names
                    const keys = ['data', 'results', 'items', 'applications', 'orders', 'bookings', 'docs'];
                    for (const k of keys) {
                        if (Array.isArray(resp[k])) return resp[k];
                    }
                    // fallback: try to find any array-valued property
                    for (const k of Object.keys(resp)) {
                        if (Array.isArray(resp[k])) return resp[k];
                    }
                }
                return [];
            };

            const daycareList = extractArray(bookingsResp);
            const ordersList = extractArray(ordersResp);
            const appsList = extractArray(appsResp);

            setBookings(daycareList);
            setOrders(ordersList);
            setApplications(appsList);

            // calculate combined stats across all sources
            calculateStats(daycareList, ordersList, appsList);

            // we only need the raw lists for charts and stats

        } catch (error) {
            console.error('Error fetching history data:', error);
            setBookings([]);
            setOrders([]);
            setApplications([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (bookingsData, ordersData, appsData) => {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const totalBookings = bookingsData.length;
        const bookingsLastWeek = bookingsData.filter(
            booking => new Date(booking.createdAt) >= oneWeekAgo
        ).length;

        const totalOrders = ordersData.length;
        const ordersLastWeek = ordersData.filter(
            order => new Date(order.createdAt || order.orderDate || order.date) >= oneWeekAgo
        ).length;

        const totalApplications = appsData.length;
        const applicationsLastWeek = appsData.filter(
            app => new Date(app.createdAt || app.appliedAt || app.date) >= oneWeekAgo
        ).length;

        const totalActivities = totalBookings + totalOrders + totalApplications;
        const activitiesLastWeek = bookingsLastWeek + ordersLastWeek + applicationsLastWeek;

        const bookingsAmount = bookingsData.reduce((sum, b) => sum + (b.totalAmount || b.amount || 0), 0);
        const ordersAmount = ordersData.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
        const totalAmountSpent = bookingsAmount + ordersAmount;

        const bookingsAmountLastWeek = bookingsData
            .filter(b => new Date(b.createdAt) >= oneWeekAgo)
            .reduce((sum, b) => sum + (b.totalAmount || b.amount || 0), 0);
        const ordersAmountLastWeek = ordersData
            .filter(o => new Date(o.createdAt || o.orderDate || o.date) >= oneWeekAgo)
            .reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
        const amountSpentLastWeek = bookingsAmountLastWeek + ordersAmountLastWeek;

        setStats({
            totalBookings,
            bookingsLastWeek,
            totalOrders,
            ordersLastWeek,
            totalApplications,
            applicationsLastWeek,
            totalActivities,
            activitiesLastWeek,
            totalAmountSpent,
            amountSpentLastWeek
        });
    };

    // Activity distribution for a pie chart (by type)
    const getActivityTypeData = () => {
        return [
            { name: 'Daycare Bookings', value: bookings.length },
            { name: 'Product Orders', value: orders.length },
            { name: 'Adoption Applications', value: applications.length }
        ];
    };

    // Amount spent on orders grouped by vendor (or product vendor name)
    const getAmountByOrdersVendorData = () => {
        const vendorMap = {};
        orders.forEach(order => {
            const items = Array.isArray(order.items) ? order.items : (order.products || []);
            items.forEach(it => {
                const vendorName = it.vendor?.name || it.seller || it.vendorName || 'Unknown Vendor';
                const qty = Number(it.quantity || it.qty || 1);
                const price = Number(it.price || it.unitPrice || it.cost || 0);
                const amt = price * qty;
                vendorMap[vendorName] = (vendorMap[vendorName] || 0) + amt;
            });
        });
        return Object.keys(vendorMap).map(name => ({ name, value: vendorMap[name] }));
    };
    // Number of orders per vendor (count each order once per vendor present in order)
    const getOrdersByVendorData = () => {
        const vendorCount = {};
        orders.forEach(order => {
            const items = Array.isArray(order.items) ? order.items : (order.products || []);
            const vendorsInOrder = new Set(items.map(it => it.vendor?.name || it.seller || it.vendorName || 'Unknown Vendor'));
            vendorsInOrder.forEach(v => { vendorCount[v] = (vendorCount[v] || 0) + 1; });
        });
        return Object.keys(vendorCount).map(name => ({ name, orders: vendorCount[name] }));
    };
    // Number of orders per vendor (count each order once per vendor present in order)

    // Number of adoption applications per shelter
    const getApplicationsByShelterData = () => {
        const map = {};
        applications.forEach(app => {
            const shelterName = (app.pet && (typeof app.pet === 'string' ? app.pet : app.pet.shelter)) || app.shelter || app.pet?.shelter || 'Unknown Shelter';
            const sName = typeof shelterName === 'object' ? (shelterName.name || shelterName.location || JSON.stringify(shelterName)) : (shelterName || 'Unknown Shelter');
            map[sName] = (map[sName] || 0) + 1;
        });
        return Object.keys(map).map(name => ({ name, applications: map[name] }));
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
                <p>Overview of your activity: daycare bookings, product orders and adoption applications</p>
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
                        <div className="stat-card orders">
                            <div className="stat-icon">🛒</div>
                            <div className="stat-content">
                                <h3>Total Orders</h3>
                                <div className="stat-value">{stats.totalOrders}</div>
                                <div className="stat-label">All Time</div>
                            </div>
                        </div>

                        <div className="stat-card applications">
                            <div className="stat-icon">🐾</div>
                            <div className="stat-content">
                                <h3>Adoption Applications</h3>
                                <div className="stat-value">{stats.totalApplications}</div>
                                <div className="stat-label">All Time</div>
                            </div>
                        </div>

                        <div className="stat-card activities">
                            <div className="stat-icon">📚</div>
                            <div className="stat-content">
                                <h3>Total Activities</h3>
                                <div className="stat-value">{stats.totalActivities}</div>
                                <div className="stat-label">All Types</div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    {(bookings.length || orders.length || applications.length) ? (
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

                                {/* Activity type distribution - Pie Chart */}
                                <div className="chart-container">
                                    <h3>Activity Distribution</h3>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <PieChart>
                                            <Pie
                                                data={getActivityTypeData()}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, value }) => `${name}: ${value}`}
                                                outerRadius={100}
                                                dataKey="value"
                                            >
                                                {getActivityTypeData().map((entry, index) => (
                                                    <Cell key={`cell-act-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Orders: Amount spent by vendor - Pie */}
                                <div className="chart-container">
                                    <h3>Amount Spent on Orders (by Vendor)</h3>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <PieChart>
                                            <Pie
                                                data={getAmountByOrdersVendorData()}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, value }) => `${name}: ₹${value}`}
                                                outerRadius={100}
                                                dataKey="value"
                                            >
                                                {getAmountByOrdersVendorData().map((entry, index) => (
                                                        // use green from the activity COLORS palette for orders
                                                        <Cell key={`cell-ordamt-${index}`} fill={COLORS[1]} />
                                                    ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `₹${value}`} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Orders: Number of orders by vendor - Bar */}
                                <div className="chart-container">
                                    <h3>Number of Orders (by Vendor)</h3>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <BarChart data={getOrdersByVendorData()}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="orders" fill={COLORS[1]} name="Number of Orders" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Adoption: Number of applications by shelter - Bar */}
                                <div className="chart-container">
                                    <h3>Number of Adoption Applications (by Shelter)</h3>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <BarChart data={getApplicationsByShelterData()}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            // use yellow from the activity COLORS palette for adoption application counts
                                            <Bar dataKey="applications" fill={COLORS[2]} name="Applications" />
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

                    {/* History removed as requested */}
                </>
            )}
        </div>
    );
};

export default CustomerDashboard;
