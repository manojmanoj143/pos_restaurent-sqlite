import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Chart from 'chart.js/auto';
import './PosBalance.css';

function PosBalance() {
    const navigate = useNavigate();
    const [balanceData, setBalanceData] = useState({
        dineIn: { totalOrders: 0, totalRevenue: 0 },
        onlineDelivery: { totalOrders: 0, totalRevenue: 0 },
        takeAway: { totalOrders: 0, totalRevenue: 0 },
    });
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [hourlyBreakdown, setHourlyBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [filterOrderType, setFilterOrderType] = useState('');
    const [filterPaymentMode, setFilterPaymentMode] = useState('');
    const [showList, setShowList] = useState(false);
    const [chartInstance, setChartInstance] = useState(null);

    useEffect(() => {
        fetchSalesData();
    }, [fromDate, toDate, filterOrderType, filterPaymentMode]);

    useEffect(() => {
        if (hourlyBreakdown.length > 0) {
            renderChart();
        }
    }, [hourlyBreakdown]);

    const fetchSalesData = async () => {
        setLoading(true);
        let url = 'http://localhost:8000/api/sales';
        const params = new URLSearchParams();
        if (fromDate) params.append('fromDate', fromDate.toISOString().split('T')[0]);
        if (toDate) params.append('toDate', toDate.toISOString().split('T')[0]);
        if (filterOrderType) params.append('orderType', filterOrderType);
        if (filterPaymentMode) params.append('paymentMode', filterPaymentMode);
        if (params.toString()) url += `?${params.toString()}`;

        try {
            const response = await axios.get(url);
            const cleanedData = cleanData(response.data);
            processSalesData(cleanedData);
            setLoading(false);
        } catch (err) {
            setError('Error fetching sales data: ' + err.message);
            setLoading(false);
        }
    };

    const normalizeOrderType = (orderType) => {
        if (!orderType) return 'N/A';
        const normalized = orderType.trim().toLowerCase();
        const orderTypeMap = {
            'dine in': 'Dine In',
            'dine-in': 'Dine In',
            takeaway: 'Takeaway',
            'take away': 'Takeaway',
            'take-away': 'Takeaway',
            'online delivery': 'Online Delivery',
            delivery: 'Online Delivery',
        };
        return orderTypeMap[normalized] || 'N/A';
    };

    const normalizePaymentMode = (paymentMode) => {
        if (!paymentMode) return 'N/A';
        const normalized = paymentMode.trim().toLowerCase();
        const paymentModeMap = {
            cash: 'Cash',
            card: 'Card',
            upi: 'UPI',
        };
        return paymentModeMap[normalized] || 'N/A';
    };

    const cleanData = (data) => {
        if (!Array.isArray(data)) return [];
        const validOrderTypes = ['Dine In', 'Takeaway', 'Online Delivery'];
        const validPaymentModes = ['Cash', 'Card', 'UPI'];
        return data
            .filter((sale) => {
                const isValid =
                    sale.items &&
                    sale.items.length > 0 &&
                    !isNaN(sale.grand_total) &&
                    sale.grand_total !== null &&
                    !isNaN(sale.total) &&
                    sale.total !== null &&
                    sale.invoice_no &&
                    sale.date;
                const normalizedOrderType = normalizeOrderType(sale.orderType);
                const normalizedPaymentMode = normalizePaymentMode(
                    sale.payments?.[0]?.mode_of_payment
                );
                if (isValid && !validOrderTypes.includes(normalizedOrderType)) {
                    console.warn(
                        `Invalid orderType found: ${sale.orderType} (normalized: ${normalizedOrderType}) for invoice ${sale.invoice_no}`
                    );
                }
                if (isValid && !validPaymentModes.includes(normalizedPaymentMode)) {
                    console.warn(
                        `Invalid paymentMode found: ${sale.payments?.[0]?.mode_of_payment} (normalized: ${normalizedPaymentMode}) for invoice ${sale.invoice_no}`
                    );
                }
                return isValid;
            })
            .map((sale) => ({
                ...sale,
                orderType: normalizeOrderType(sale.orderType),
                paymentMode: normalizePaymentMode(sale.payments?.[0]?.mode_of_payment),
                date: sale.date,
            }));
    };

    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        return parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : null;
    };

    const isDateInRange = (saleDate, from, to) => {
        const saleDateObj = parseDate(saleDate);
        if (!saleDateObj) return false;
        const fromDateObj = from ? new Date(from) : null;
        const toDateObj = to ? new Date(to) : null;

        if (!fromDateObj && !toDateObj) return true;
        if (fromDateObj && !toDateObj) return saleDateObj >= fromDateObj;
        if (!fromDateObj && toDateObj) return saleDateObj <= toDateObj;
        return saleDateObj >= fromDateObj && saleDateObj <= toDateObj;
    };

    const processSalesData = (salesData) => {
        const dineIn = { totalOrders: 0, totalRevenue: 0 };
        const onlineDelivery = { totalOrders: 0, totalRevenue: 0 };
        const takeAway = { totalOrders: 0, totalRevenue: 0 };
        const hourlyData = {};
        let totalRev = 0;

        const filteredData = salesData.filter((sale) => {
            const dateMatch = isDateInRange(sale.date, fromDate, toDate);
            const orderTypeMatch = filterOrderType
                ? sale.orderType === filterOrderType
                : true;
            const paymentModeMatch = filterPaymentMode
                ? sale.paymentMode === filterPaymentMode
                : true;
            return dateMatch && orderTypeMatch && paymentModeMatch;
        });

        filteredData.forEach((sale) => {
            const grandTotal = parseFloat(sale.grand_total) || 0;
            const orderType = sale.orderType;

            if (orderType === 'Dine In') {
                dineIn.totalOrders += 1;
                dineIn.totalRevenue += grandTotal;
            } else if (orderType === 'Online Delivery') {
                onlineDelivery.totalOrders += 1;
                onlineDelivery.totalRevenue += grandTotal;
            } else if (orderType === 'Takeaway') {
                takeAway.totalOrders += 1;
                takeAway.totalRevenue += grandTotal;
            }

            totalRev += grandTotal;

            const time = sale.time || '00:00:00';
            const hour = parseInt(time.split(':')[0], 10);
            const hourKey = `${hour.toString().padStart(2, '0')}-${(hour + 1)
                .toString()
                .padStart(2, '0')}`;
            if (!hourlyData[hourKey]) {
                hourlyData[hourKey] = { totalOrders: 0, totalRevenue: 0, paymentMode: sale.paymentMode };
            }
            hourlyData[hourKey].totalOrders += 1;
            hourlyData[hourKey].totalRevenue += grandTotal;
        });

        const fullHourlyBreakdown = [];
        for (let i = 0; i < 24; i++) {
            const hourKey = `${i.toString().padStart(2, '0')}-${(i + 1)
                .toString()
                .padStart(2, '0')}`;
            fullHourlyBreakdown.push({
                timeSlot: hourKey,
                totalOrders: hourlyData[hourKey]?.totalOrders || 0,
                totalRevenue: hourlyData[hourKey]?.totalRevenue || 0,
                paymentMode: hourlyData[hourKey]?.paymentMode || 'All',
            });
        }

        setBalanceData({ dineIn, onlineDelivery, takeAway });
        setTotalRevenue(totalRev);
        setHourlyBreakdown(fullHourlyBreakdown);
    };

    const renderChart = () => {
        const ctx = document.getElementById('salesChart').getContext('2d');
        if (chartInstance) {
            chartInstance.destroy();
        }
        const newChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: hourlyBreakdown.map((hour) => hour.timeSlot),
                datasets: [
                    {
                        label: 'Total Orders',
                        data: hourlyBreakdown.map((hour) => hour.totalOrders),
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Total Revenue (₹)',
                        data: hourlyBreakdown.map((hour) => hour.totalRevenue),
                        type: 'line',
                        fill: false,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        tension: 0.4,
                        yAxisID: 'y1',
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 14,
                                weight: 'bold',
                            },
                            color: '#333',
                        },
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 14 },
                        bodyFont: { size: 12 },
                        padding: 10,
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time Slot (Hours)',
                            font: {
                                size: 16,
                                weight: 'bold',
                            },
                            color: '#333',
                        },
                        grid: {
                            display: false,
                        },
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Total Orders',
                            font: {
                                size: 16,
                                weight: 'bold',
                            },
                            color: '#333',
                        },
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                        },
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Revenue (₹)',
                            font: {
                                size: 16,
                                weight: 'bold',
                            },
                            color: '#333',
                        },
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuad',
                },
            },
        });
        setChartInstance(newChart);
    };

    const handleBackToFirstTab = () => {
        navigate('/home');
    };

    const handleResetFilters = () => {
        setFromDate(null);
        setToDate(null);
        setFilterOrderType('');
        setFilterPaymentMode('');
    };

    const toggleList = () => {
        setShowList(!showList);
    };

    if (loading) {
        return (
            <div className="pos-balance-container">
                <div className="text-center mt-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pos-balance-container">
                <div className="alert alert-danger m-4" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="pos-balance-container">
            <div className="button-group">
                <button
                    className="back-button"
                    onClick={handleBackToFirstTab}
                    aria-label="Back to Dining Options"
                    title="Back to Home"
                >
                    <i className="bi bi-arrow-left-circle"></i>
                </button>
            </div>

            <div className="container-fluid content-wrapper px-0">
                <div className="row g-4">
                    <div className="col-lg-3 col-md-12 filter-container">
                        <div className="balance-card filter-card rounded-3 shadow-sm">
                            <div className="card-header p-3">
                                <h2 className="card-title mb-0">Filters</h2>
                                <span className="card-icon">🔍</span>
                            </div>
                            <div className="card-body p-3">
                                <div className="mb-3">
                                    <label className="fw-bold mb-1">From Date:</label>
                                    <DatePicker
                                        selected={fromDate}
                                        onChange={(date) => setFromDate(date)}
                                        dateFormat="yyyy-MM-dd"
                                        className="form-control shadow-sm"
                                        placeholderText="Select start date"
                                        wrapperClassName="w-100"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="fw-bold mb-1">To Date:</label>
                                    <DatePicker
                                        selected={toDate}
                                        onChange={(date) => setToDate(date)}
                                        dateFormat="yyyy-MM-dd"
                                        className="form-control shadow-sm"
                                        placeholderText="Select end date"
                                        minDate={fromDate}
                                        wrapperClassName="w-100"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="fw-bold mb-1">Order Type:</label>
                                    <select
                                        value={filterOrderType}
                                        onChange={(e) => setFilterOrderType(e.target.value)}
                                        className="form-select shadow-sm"
                                    >
                                        <option value="">All Order Types</option>
                                        <option value="Dine In">Dine In</option>
                                        <option value="Takeaway">Takeaway</option>
                                        <option value="Online Delivery">Online Delivery</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="fw-bold mb-1">Payment Mode:</label>
                                    <select
                                        value={filterPaymentMode}
                                        onChange={(e) => setFilterPaymentMode(e.target.value)}
                                        className="form-select shadow-sm"
                                    >
                                        <option value="">All Payment Modes</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="UPI">UPI</option>
                                    </select>
                                </div>
                                <button
                                    className="btn btn-outline-secondary w-100 shadow-sm"
                                    onClick={handleResetFilters}
                                >
                                    Reset Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-9 col-md-12">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h1 className="title">POS Balance Overview</h1>
                            <div className="d-flex align-items-center">
                                <div className="total-revenue me-3">
                                    <span className="fw-bold">Total Revenue: </span>
                                    <span className="balance-value">₹{totalRevenue.toFixed(2)}</span>
                                </div>
                                <button
                                    className="btn btn-primary list-button shadow-sm"
                                    onClick={toggleList}
                                >
                                    {showList ? 'Hide List' : 'Show List'}
                                </button>
                            </div>
                        </div>

                        <div className="row g-4">
                            <div className="col-md-4">
                                <div className="balance-card dinein rounded-3 shadow-sm">
                                    <div className="card-header p-3">
                                        <h2 className="card-title mb-0">Dine In</h2>
                                        <span className="card-icon">🍽️</span>
                                    </div>
                                    <div className="card-body p-3">
                                        <p className="balance-item d-flex justify-content-between">
                                            <span className="balance-label">Total Orders:</span>
                                            <span className="balance-value">{balanceData.dineIn.totalOrders}</span>
                                        </p>
                                        <p className="balance-item d-flex justify-content-between">
                                            <span className="balance-label">Total Revenue:</span>
                                            <span className="balance-value">₹{balanceData.dineIn.totalRevenue.toFixed(2)}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="balance-card delivery rounded-3 shadow-sm">
                                    <div className="card-header p-3">
                                        <h2 className="card-title mb-0">Online Delivery</h2>
                                        <span className="card-icon">🚚</span>
                                    </div>
                                    <div className="card-body p-3">
                                        <p className="balance-item d-flex justify-content-between">
                                            <span className="balance-label">Total Orders:</span>
                                            <span className="balance-value">{balanceData.onlineDelivery.totalOrders}</span>
                                        </p>
                                        <p className="balance-item d-flex justify-content-between">
                                            <span className="balance-label">Total Revenue:</span>
                                            <span className="balance-value">₹{balanceData.onlineDelivery.totalRevenue.toFixed(2)}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="balance-card takeaway rounded-3 shadow-sm">
                                    <div className="card-header p-3">
                                        <h2 className="card-title mb-0">Take Away</h2>
                                        <span className="card-icon">🍔</span>
                                    </div>
                                    <div className="card-body p-3">
                                        <p className="balance-item d-flex justify-content-between">
                                            <span className="balance-label">Total Orders:</span>
                                            <span className="balance-value">{balanceData.takeAway.totalOrders}</span>
                                        </p>
                                        <p className="balance-item d-flex justify-content-between">
                                            <span className="balance-label">Total Revenue:</span>
                                            <span className="balance-value">₹{balanceData.takeAway.totalRevenue.toFixed(2)}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sales-graph mt-5 p-4 rounded-3 shadow-sm">
                            <h2 className="graph-title mb-4">Sales Overview</h2>
                            <div className="chart-container">
                                <canvas id="salesChart"></canvas>
                            </div>
                        </div>

                        {showList && (
                            <div className="hourly-breakdown mt-5 p-4 rounded-3 shadow-sm">
                                <h2 className="hourly-title mb-4">Hourly Order Breakdown</h2>
                                <div className="table-responsive">
                                    <table className="hourly-table table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Time Slot</th>
                                                <th>Total Orders</th>
                                                <th>Total Revenue</th>
                                                <th>Payment Mode</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hourlyBreakdown.map((hour) => (
                                                <tr key={hour.timeSlot}>
                                                    <td>{hour.timeSlot}</td>
                                                    <td>{hour.totalOrders}</td>
                                                    <td>₹{hour.totalRevenue.toFixed(2)}</td>
                                                    <td>{hour.paymentMode}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PosBalance;