// TripReport.jsx - Full Updated Code: Enhanced with dynamic currency fetching (like ActiveOrders), overall totals (Total Grand Total, Total Collected, Total Pending) displayed in the Selected Delivery Person section.
// All previous features preserved: payment amounts for Cash/Card/UPI, balance calculation, Pending Grand Total (sum of outstanding balances), Mark Delivered with full payment check,
// inputs disabled for delivered orders, popup with details, dynamic VAT, etc. FIXED: Currency symbol now dynamic (fetched from /api/settings), timestamps use correct date format,
// deliveryPersonName preserved and displayed, balance/payment calculations use preserved exclTotal/taxTotal from sales data, full details in popup including addons/combos/ingredients.
// FIXED: Totals now correctly multiplied by quantity in calculations (was missing * qty, causing undercalculation). ADDED: Fallback calculation for exclTotal/taxTotal using item.amount and current vatRate if not preserved in backend (fixes 0.00 totals issue).
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { FaArrowLeft } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import './TripReport.css';

function TripReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [deliveryPerson, setDeliveryPerson] = useState('');
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [tripReports, setTripReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [warningMessage, setWarningMessage] = useState('');
  const [warningType, setWarningType] = useState('warning');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [vatRate, setVatRate] = useState(0.10); // UPDATED: Dynamic VAT rate like in FrontPage
  const [currency, setCurrency] = useState("INR"); // NEW: Dynamic currency like in ActiveOrders
  const dropdownRef = useRef(null);
  const baseUrl = window.location.hostname === 'localhost' ? '' : `http://${window.location.hostname}:8000`;

  // NEW: Helper to get currency symbol (from ActiveOrders)
  const getCurrencySymbol = (currCode) => {
    const symbols = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'AED': 'د.إ',
      // Add more as needed
    };
    return symbols[currCode?.toUpperCase()] || '₹'; // Default to ₹ (INR) if not found
  };

  // UPDATED: Fetch VAT rate dynamically like in ActiveOrders
  useEffect(() => {
    const fetchVat = async () => {
      try {
        const apiPath = baseUrl ? `${baseUrl}/api/get-vat` : '/api/get-vat';
        const response = await axios.get(apiPath);
        setVatRate(response.data.vat / 100 || 0.10);
      } catch (error) {
        console.error('Failed to fetch VAT:', error);
      }
    };
    fetchVat();
  }, [baseUrl]);

  // NEW: Fetch currency from settings (like in ActiveOrders)
  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const apiPath = baseUrl ? `${baseUrl}/api/settings` : '/api/settings';
        const response = await axios.get(apiPath);
        const { currency: fetchedCurrency = "INR" } = response.data;
        setCurrency(fetchedCurrency.toUpperCase()); // Ensure uppercase like INR, AED
        console.log("Fetched currency:", fetchedCurrency); // Debug
      } catch (error) {
        console.error("Failed to fetch currency settings:", error);
        setCurrency("INR"); // Fallback to INR
      }
    };
    fetchCurrency();
  }, [baseUrl]);

  // Generate short UUID suffix for invoice number
  const generateShortUUID = () => {
    return uuidv4().slice(0, 8);
  };

  // Fetch employees on component mount
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${baseUrl}/api/employees`);
      const data = Array.isArray(response.data) ? response.data : [];
      setEmployees(data);
      setFilteredEmployees(data.filter((emp) => emp.role.toLowerCase() === 'delivery boy'));
    } catch (err) {
      setError(`Failed to fetch employees: ${err.message}`);
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Fetch trip reports (now sales) for the selected employee from sales collection via backend
  // FIXED: Sanitize to preserve exclTotal/taxTotal from backend for accurate calculations, use report.timestamp for display if available
  // FIXED: Add fallback calculation for exclTotal/taxTotal if not present (using item.amount and current vatRate)
  // FIXED: Ensure calculations multiply by quantity
  const fetchTripReports = async (employeeId, date, billNo, custName) => {
    if (!employeeId || !date) return;
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${baseUrl}/api/tripreports/${employeeId}`);
      const data = Array.isArray(response.data) ? response.data : [];
      const sanitizedReports = data.map((report) => {
        let paymentAmounts = { Cash: 0, Card: 0, UPI: 0 };
        let tenderedAmount = report.tenderedAmount || '';
        let changeAmount = report.change || 0;
        let cardDetails = report.cardDetails || '';
        let upiDetails = report.upiDetails || '';
        let paymentMethods = [];
        if (Array.isArray(report.payments)) {
          report.payments.forEach((p) => {
            const method = p.mode_of_payment;
            if (['Cash', 'Card', 'UPI'].includes(method)) {
              paymentAmounts[method] = Number(p.amount) || 0;
              if (method === 'Cash') {
                tenderedAmount = p.tenderedAmount || '';
                changeAmount = Number(p.change) || 0;
              } else if (method === 'Card') {
                cardDetails = p.cardNumber || p.cardDetails || '';
              } else if (method === 'UPI') {
                upiDetails = p.upiId || p.upiDetails || '';
              }
              if (Number(p.amount) > 0) paymentMethods.push(method);
            }
          });
        }
        // FIXED: Preserve exclTotal and taxTotal from cartItems for accurate subtotal/vat/grand total
        // ADDED: Fallback if exclTotal/taxTotal == 0 but amount > 0: calculate using vatRate (per unit)
        const sanitizedCartItems = Array.isArray(report.cartItems)
          ? report.cartItems.map((item) => {
              let exclTotal = Number(item.excl_amount) || Number(item.exclTotal) || 0;
              let taxTotal = Number(item.tax_amount) || Number(item.taxTotal) || 0;
              const qty = Number(item.quantity) || 1;
              const amount = Number(item.amount) || 0;
              if ((exclTotal + taxTotal) === 0 && amount > 0) {
                const unitIncl = amount / qty;
                exclTotal = unitIncl / (1 + vatRate);
                taxTotal = unitIncl - exclTotal;
              }
              return {
                ...item,
                id: item.id || uuidv4(),
                item_name: item.item_name || item.name || 'Unknown',
                name: item.name || item.item_name || 'Unknown',
                quantity: qty,
                basePrice: Number(item.basePrice) || (amount / qty) || 0,
                totalPrice: amount || ( (exclTotal + taxTotal) * qty ) || 0,
                // FIXED: Preserve from backend (excl_amount, tax_amount) like in ActiveOrders, with fallback set above
                exclTotal,
                taxTotal,
                taxBreakdown: item.tax_breakdown || item.taxBreakdown || {},
                selectedSize: item.selectedSize || 'M',
                icePreference: item.icePreference || 'without_ice',
                icePrice: Number(item.icePrice) || 0,
                isSpicy: item.isSpicy || false,
                spicyPrice: Number(item.spicyPrice) || 0,
                kitchen: item.kitchen || 'Main Kitchen',
                addonQuantities: item.addonQuantities || {},
                addonVariants: item.addonVariants || {},
                addonPrices: item.addonPrices || {},
                comboQuantities: item.comboQuantities || {},
                comboVariants: item.comboVariants || {},
                comboPrices: item.comboPrices || {},
                addons: Array.isArray(item.addons) ? item.addons : [], // Ensure addons array
                selectedCombos: Array.isArray(item.selectedCombos) ? item.selectedCombos : [], // Ensure selectedCombos array
                ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
                requiredKitchens: Array.isArray(item.requiredKitchens) ? item.requiredKitchens : [],
                kitchenStatuses: item.kitchenStatuses || {},
              };
            })
          : [];
        return {
          ...report,
          orderNo: report.orderNo || report.invoice_no || 'N/A', // Fallback to invoice_no
          tripId: report._id || uuidv4(), // Ensure tripId for frontend
          status: report.status || 'Pending', // UPDATED: Include status for filtering/delivered check
          chairsBooked: Array.isArray(report.chairsBooked) ? report.chairsBooked : [],
          cartItems: sanitizedCartItems, // Use sanitized cartItems with preserved/fallback totals
          pickedUpTime: report.pickedUpTime || null,
          paymentMethods, // Derived from payments
          paymentAmounts, // NEW: Payment amounts per method
          tenderedAmount, // NEW: For cash tendered
          change: changeAmount, // NEW: For cash change
          cardDetails, // From payments
          upiDetails, // From payments
          email: report.email || 'N/A',
          customerName: report.customer || 'N/A', // UPDATED: From sales.customer
          timestamp: report.timestamp || report.date, // FIXED: Use timestamp if available, fallback to date
          // UPDATED: Ensure deliveryPersonName is always present
          deliveryPersonName: report.deliveryPersonName || selectedEmployee?.name || 'Unknown',
        };
      });
      console.log('Sanitized reports:', sanitizedReports); // Debug log
      setTripReports(sanitizedReports);
      filterReportsByDate(sanitizedReports, date, billNo, custName);
    } catch (err) {
      setError(`Failed to fetch trip reports: ${err.message}`);
      setTripReports([]);
      setFilteredReports([]);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Filter reports by date (string match on report.date === date), bill number (orderNo), and customer name
  // FIXED: Use report.timestamp or report.date for filtering if needed
  const filterReportsByDate = (reports, date, billNo, custName) => {
    console.log('Filtering reports by date:', date, 'billNo:', billNo, 'custName:', custName); // Debug log
    if (!date) {
      setFilteredReports([]);
      return;
    }
    let filtered = reports.filter((report) => {
      // UPDATED: String match on report.date === date (both YYYY-MM-DD)
      return report.date === date;
    });
    if (billNo) {
      filtered = filtered.filter((report) => report.orderNo.toLowerCase().includes(billNo.toLowerCase()));
    }
    if (custName) {
      filtered = filtered.filter((report) =>
        report.customerName && report.customerName.toLowerCase().includes(custName.toLowerCase())
      );
    }
    console.log('Filtered reports:', filtered); // Debug log
    setFilteredReports(filtered);
  };

  // UPDATED: Helper to calculate subtotal (sum of exclTotal * quantity, like in ActiveOrders)
  const calculateSubtotal = (cartItems) => {
    if (!Array.isArray(cartItems)) return 0;
    return cartItems.reduce((sum, item) => sum + ((Number(item.exclTotal) || 0) * (Number(item.quantity) || 1)), 0);
  };

  // UPDATED: Helper to calculate total VAT (sum of taxTotal * quantity)
  const calculateTotalVat = (cartItems) => {
    if (!Array.isArray(cartItems)) return 0;
    return cartItems.reduce((sum, item) => sum + ((Number(item.taxTotal) || 0) * (Number(item.quantity) || 1)), 0);
  };

  // FIXED: Calculate grand total using preserved exclTotal + taxTotal * quantity (no recalculation)
  const calculateGrandTotal = (cartItems) => {
    if (!Array.isArray(cartItems)) return 0;
    const subtotal = calculateSubtotal(cartItems);
    const vat = calculateTotalVat(cartItems);
    let total = (subtotal + vat).toFixed(2);
    // ADDED: Fallback if still 0: sum item.amount (line totals)
    if (parseFloat(total) === 0) {
      total = cartItems.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2);
    }
    return total;
  };

  // NEW: Helper to calculate total paid
  const calculateTotalPaid = (paymentAmounts) => {
    return Object.values(paymentAmounts).reduce((sum, amt) => sum + (Number(amt) || 0), 0);
  };

  // NEW: Helper to get balance
  const getBalance = (report) => {
    const grandTotal = parseFloat(calculateGrandTotal(report.cartItems));
    const totalPaid = calculateTotalPaid(report.paymentAmounts);
    return Math.max(0, grandTotal - totalPaid).toFixed(2);
  };

  // UPDATED: Mark order as delivered - Requires full payment, constructs payments array with amounts/details
  // One-time only: Only allow if status !== 'Delivered'
  const markAsDelivered = async (report) => {
    if (report.status === 'Delivered') {
      setWarningMessage('Order is already delivered.');
      setWarningType('warning');
      return;
    }
    const grandTotalNum = parseFloat(calculateGrandTotal(report.cartItems));
    const totalPaid = calculateTotalPaid(report.paymentAmounts);
    if (totalPaid < grandTotalNum - 0.01) { // Tolerance for floating point
      setWarningMessage(`Insufficient payment. Total Paid: ${getCurrencySymbol(currency)}${totalPaid.toFixed(2)}, Required: ${getCurrencySymbol(currency)}${grandTotalNum.toFixed(2)}`);
      setWarningType('warning');
      return;
    }
    try {
      const payments = [];
      ['Cash', 'Card', 'UPI'].forEach((method) => {
        const amount = Number(report.paymentAmounts[method]) || 0;
        if (amount > 0) {
          let payObj = {
            mode_of_payment: method,
            amount: amount,
          };
          if (method === 'Cash') {
            const tendered = parseFloat(report.tenderedAmount) || amount;
            payObj.tenderedAmount = tendered;
            payObj.change = Math.max(0, tendered - amount);
          } else if (method === 'Card' && report.cardDetails) {
            payObj.cardNumber = report.cardDetails;
          } else if (method === 'UPI' && report.upiDetails) {
            payObj.upiId = report.upiDetails;
          }
          payments.push(payObj);
        }
      });
      if (payments.length === 0) {
        setWarningMessage('No payment entered.');
        setWarningType('warning');
        return;
      }
      const payload = {
        orderNo: report.orderNo,
        status: 'Delivered',
        payments: payments,
      };
      await axios.post(`${baseUrl}/api/sales/deliver-order`, payload);
      setWarningMessage('Order marked as delivered successfully with payment details.');
      setWarningType('success');
      // Refresh reports
      if (selectedEmployee && selectedDate) {
        fetchTripReports(selectedEmployee.employeeId, selectedDate, billNumber, customerName);
      }
    } catch (err) {
      setError(`Failed to mark as delivered: ${err.message}`);
      setWarningType('warning');
    }
  };

  // NEW: Handle payment amount change
  const handlePaymentAmountChange = (reportId, method, value) => {
    const report = filteredReports.find((r) => r.tripId === reportId);
    if (report?.status === 'Delivered') {
      setWarningMessage('Cannot edit payments for delivered order.');
      setWarningType('warning');
      return;
    }
    const numValue = value === '' ? 0 : parseFloat(value);
    setFilteredReports((prevReports) =>
      prevReports.map((r) => {
        if (r.tripId === reportId) {
          const newAmounts = { ...r.paymentAmounts, [method]: numValue };
          let newTendered = r.tenderedAmount;
          let newChange = r.change;
          let newCardDetails = r.cardDetails;
          let newUpiDetails = r.upiDetails;
          if (numValue === 0) {
            if (method === 'Cash') newTendered = '';
            if (method === 'Card') newCardDetails = '';
            if (method === 'UPI') newUpiDetails = '';
          }
          return {
            ...r,
            paymentAmounts: newAmounts,
            ...(method === 'Cash' ? { tenderedAmount: newTendered, change: newChange } : {}),
            ...(method === 'Card' ? { cardDetails: newCardDetails } : {}),
            ...(method === 'UPI' ? { upiDetails: newUpiDetails } : {}),
          };
        }
        return r;
      })
    );
  };

  // NEW: Handle tendered amount change for cash
  const handleTenderedChange = (reportId, value) => {
    const report = filteredReports.find((r) => r.tripId === reportId);
    if (report?.status === 'Delivered') {
      setWarningMessage('Cannot edit details for delivered order.');
      setWarningType('warning');
      return;
    }
    const cashAmt = Number(report.paymentAmounts.Cash) || 0;
    const tendered = value === '' ? 0 : parseFloat(value);
    const ch = Math.max(0, tendered - cashAmt);
    setFilteredReports((prevReports) =>
      prevReports.map((r) =>
        r.tripId === reportId ? { ...r, tenderedAmount: value, change: ch } : r
      )
    );
  };

  // UPDATED: Handle payment details input (card/upi) - One-time only if not Delivered
  const handlePaymentDetailsInput = (reportId, field, value) => {
    const report = filteredReports.find((r) => r.tripId === reportId);
    if (report?.status === 'Delivered') {
      setWarningMessage('Cannot edit details for delivered order.');
      setWarningType('warning');
      return;
    }
    setFilteredReports((prevReports) =>
      prevReports.map((report) => {
        if (report.tripId === reportId) {
          return {
            ...report,
            [field]: value,
          };
        }
        return report;
      })
    );
  };

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Prefill from URL params
  useEffect(() => {
    const empId = searchParams.get('employeeId');
    const date = searchParams.get('date');
    if (empId && date && employees.length > 0) {
      const emp = employees.find((e) => e.employeeId === empId);
      if (emp) {
        setSelectedEmployee(emp);
        setDeliveryPerson(emp.name);
        setSearchTerm(emp.name);
        setSelectedDate(date);
        fetchTripReports(empId, date, '', '');
        setWarningMessage(`Loaded trip report for ${emp.name} on ${date}`);
        setWarningType('success');
      }
    }
  }, [searchParams, employees]);

  // Handle search input change for delivery person
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setDeliveryPerson(value);
    setShowDropdown(true);
    const filtered = employees
      .filter((emp) => emp.role.toLowerCase() === 'delivery boy')
      .filter((emp) => emp.name.toLowerCase().includes(value.toLowerCase()));
    setFilteredEmployees(filtered);
    if (!value) {
      setSelectedEmployee(null);
      setTripReports([]);
      setFilteredReports([]);
    }
  };

  // Handle employee selection from dropdown
  const handleSelectEmployee = (employee) => {
    setSearchTerm(employee.name);
    setDeliveryPerson(employee.name);
    setSelectedEmployee(employee);
    setShowDropdown(false);
    setWarningMessage('');
    if (selectedDate) {
      fetchTripReports(employee.employeeId, selectedDate, billNumber, customerName);
    }
  };

  // Handle date change
  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setWarningMessage('');
    if (selectedEmployee && date) {
      fetchTripReports(selectedEmployee.employeeId, date, billNumber, customerName);
    }
  };

  // Handle bill number change
  const handleBillNumberChange = (e) => {
    const billNo = e.target.value;
    setBillNumber(billNo);
    setWarningMessage('');
    if (selectedEmployee && selectedDate) {
      fetchTripReports(selectedEmployee.employeeId, selectedDate, billNo, customerName);
    }
  };

  // Handle customer name change
  const handleCustomerNameChange = (e) => {
    const custName = e.target.value;
    setCustomerName(custName);
    setWarningMessage('');
    if (selectedEmployee && selectedDate) {
      fetchTripReports(selectedEmployee.employeeId, selectedDate, billNumber, custName);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setWarningMessage('');
    if (!selectedEmployee) {
      setWarningMessage('Please select delivery person');
      setWarningType('warning');
      return;
    }
    if (!selectedDate) {
      setWarningMessage('Please select a date');
      setWarningType('warning');
      return;
    }
    fetchTripReports(selectedEmployee.employeeId, selectedDate, billNumber, customerName);
    setWarningMessage(
      `Delivery Person Selected: ${selectedEmployee.name} for date ${selectedDate}${
        billNumber ? `, Bill No: ${billNumber}` : ''
      }${customerName ? `, Customer: ${customerName}` : ''}`
    );
    setWarningType('success');
  };

  // Navigate back to home
  const handleBack = () => {
    navigate('/home');
  };

  // Show order details popup
  const handleShowDetails = (report) => {
    setSelectedReport(report);
    setShowPopup(true);
  };

  // Close popup
  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedReport(null);
  };

  // Handle warning message OK button
  const handleWarningOk = () => {
    setWarningMessage('');
    setWarningType('warning');
  };

  // Handle warning message Cancel button
  const handleWarningCancel = () => {
    setWarningMessage('');
    setWarningType('warning');
  };

  // FIXED: Updated to use timestamp if available, format correctly
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  // FIXED: Use preserved totals for order total display
  const formatPrice = (price) => {
    const symbol = getCurrencySymbol(currency);
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice === 0) return `${symbol}0.00`;
    return `${symbol}${numPrice.toFixed(2)}`;
  };

  // UPDATED: Calculate pending grand total as sum of balances for undelivered orders only
  const calculatePendingGrandTotal = () => {
    return filteredReports
      .filter((report) => report.status !== 'Delivered')
      .reduce((sum, report) => {
        const gt = parseFloat(calculateGrandTotal(report.cartItems));
        const paid = calculateTotalPaid(report.paymentAmounts);
        return sum + Math.max(0, gt - paid);
      }, 0)
      .toFixed(2);
  };

  // NEW: Calculate overall grand total (sum of all grand totals for filtered reports)
  const calculateOverallGrandTotal = () => {
    return filteredReports.reduce((sum, report) => {
      return sum + parseFloat(calculateGrandTotal(report.cartItems));
    }, 0).toFixed(2);
  };

  // NEW: Calculate total collected (sum of all paid amounts for filtered reports)
  const calculateTotalCollected = () => {
    return filteredReports.reduce((sum, report) => {
      return sum + calculateTotalPaid(report.paymentAmounts);
    }, 0).toFixed(2);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // NEW: Render addons in popup (like in ActiveOrders)
  const renderAddonsInPopup = (addons) => {
    if (!addons || addons.length === 0) return null;
    return (
      <ul className="list-unstyled ms-3 mt-1">
        {addons.map((addon, aIdx) => (
          <li key={aIdx} className="text-muted small">
            + {addon.addon_name || addon.name1} {addon.size ? `(${addon.size})` : ''} x{addon.addon_quantity} - {formatPrice((addon.addon_price * addon.addon_quantity) || 0)}
          </li>
        ))}
      </ul>
    );
  };

  // NEW: Render combos in popup (like in ActiveOrders)
  const renderCombosInPopup = (selectedCombos) => {
    if (!selectedCombos || selectedCombos.length === 0) return null;
    return (
      <ul className="list-unstyled ms-3 mt-1">
        {selectedCombos.map((combo, cIdx) => (
          <li key={cIdx} className="text-info small">
            + {combo.name1} {combo.size ? `(${combo.size})` : ''} x{combo.combo_quantity} - {formatPrice((combo.combo_price * combo.combo_quantity) || 0)}
          </li>
        ))}
      </ul>
    );
  };

  // NEW: Render ingredients in popup
  const renderIngredientsInPopup = (ingredients) => {
    if (!ingredients || ingredients.length === 0) return null;
    return (
      <ul className="list-unstyled ms-3 mt-1">
        {ingredients.map((ing, idx) => (
          <li key={idx} className="text-muted small">
            - {ing.name}: {ing.custom_weight || ing.weight || "N/A"}g ({formatPrice(ing.calculated_price || ing.base_price || 0)})
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="trip-main">
      {warningMessage && (
        <div
          className={`trip-main-alert alert-${warningType === 'success' ? 'success' : 'warning'} position-fixed top-50 start-50 translate-middle shadow z-3 p-4 rounded-3 text-center`}
          style={{ minWidth: '400px', maxWidth: '600px' }}
        >
          {warningMessage}
          <div className="d-flex justify-content-center gap-2 mt-3">
            <button className="btn btn-success" onClick={handleWarningOk}>
              OK
            </button>
            <button className="btn btn-danger" onClick={handleWarningCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {loading && (
        <div className="trip-main-loading text-center text-muted fs-5 my-3">
          Loading...
        </div>
      )}
      {error && (
        <div className="trip-main-error alert alert-danger my-3 text-center">
          {error}
        </div>
      )}
      <div className="trip-main-header d-flex align-items-center mb-4">
        <FaArrowLeft
          className="trip-main-back-button fs-3 me-3"
          onClick={handleBack}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && handleBack()}
        />
        <h1 className="trip-main-title h3 mb-0">Delivery Person Trip Report</h1>
      </div>
      <div className="trip-main-content-wrapper">
        <div className="trip-main-card p-4 mb-4 shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label htmlFor="deliveryPerson" className="trip-main-form-label fw-bold">
                  Delivery Person
                </label>
                <div className="position-relative" ref={dropdownRef}>
                  <input
                    type="text"
                    className="trip-main-form-control"
                    id="deliveryPerson"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Type to search delivery person"
                    required
                  />
                  {showDropdown && filteredEmployees.length > 0 && (
                    <ul className="trip-main-dropdown-menu show w-100 mt-1">
                      {filteredEmployees.map((employee) => (
                        <li
                          key={employee.employeeId}
                          className="trip-main-dropdown-item"
                          onClick={() => handleSelectEmployee(employee)}
                        >
                          {employee.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="col-md-3">
                <label htmlFor="dateFilter" className="trip-main-form-label fw-bold">
                  Filter by Date
                </label>
                <input
                  type="date"
                  className="trip-main-form-control"
                  id="dateFilter"
                  value={selectedDate}
                  onChange={handleDateChange}
                  required
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="billNumber" className="trip-main-form-label fw-bold">
                  Bill Number
                </label>
                <input
                  type="text"
                  className="trip-main-form-control"
                  id="billNumber"
                  value={billNumber}
                  onChange={handleBillNumberChange}
                  placeholder="Enter bill number"
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="customerName" className="trip-main-form-label fw-bold">
                  Customer Name
                </label>
                <input
                  type="text"
                  className="trip-main-form-control"
                  id="customerName"
                  value={customerName}
                  onChange={handleCustomerNameChange}
                  placeholder="Enter customer name"
                />
              </div>
            </div>
            <div className="row g-3 mt-3">
              <div className="col-12">
                <button type="submit" className="trip-main-btn-primary w-100">
                  Submit
                </button>
              </div>
            </div>
          </form>
        </div>
        {selectedEmployee && (
          <div className="trip-main-card p-4 mb-4 shadow-sm">
            <h3 className="h5">Selected Delivery Person</h3>
            <p>
              <strong>Name:</strong> {selectedEmployee.name}
            </p>
            <p>
              <strong>Delivery Person Name in Reports:</strong> {selectedEmployee.name}
            </p>{/* UPDATED: Show delivery person name */}
            {/* UPDATED: Overall totals (Total Grand Total, Total Collected, Total Pending) shown here for visibility at the top, with dynamic currency */}
            {filteredReports.length > 0 && (
              <div className="mt-3">
                <p>
                  <strong>Total Grand Total:</strong> {formatPrice(calculateOverallGrandTotal())}
                </p>
                <p>
                  <strong>Total Collected:</strong> {formatPrice(calculateTotalCollected())}
                </p>
                <p>
                  <strong>Total Pending:</strong> {formatPrice(calculatePendingGrandTotal())}
                </p>
              </div>
            )}
          </div>
        )}
        {selectedEmployee && filteredReports.length > 0 && (
          <div className="trip-main-card p-4 shadow-sm">
            <h2 className="h4 mb-3">Assigned Delivery Orders</h2>
            <div className="table-responsive">
              <table className="trip-main-table table table-striped table-bordered">
                <thead className="trip-main-table-primary">
                  <tr>
                    <th>Order No</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Delivery Person Name</th>{/* UPDATED: Show delivery person name */}
                    <th>Grand Total ({getCurrencySymbol(currency)})</th> {/* FIXED: Dynamic currency */}
                    <th>Balance ({getCurrencySymbol(currency)})</th> {/* NEW: Balance column, dynamic currency */}
                    <th>Payment Method</th>
                    <th>Actions</th>
                    <th>Status</th>{/* UPDATED: Status column instead of Delivered */}
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.tripId}>
                      <td>{report.orderNo}</td>
                      <td>{formatTimestamp(report.timestamp)}</td>{/* FIXED: Use timestamp */}
                      <td>{report.customerName || 'N/A'}</td>
                      <td>{report.email || 'N/A'}</td>
                      <td>{report.deliveryPersonName || 'Unknown'}</td>{/* UPDATED: Display delivery person name */}
                      <td>{formatPrice(calculateGrandTotal(report.cartItems))}</td> {/* FIXED: Use formatPrice with dynamic currency */}
                      <td>{formatPrice(getBalance(report))}</td> {/* NEW: Balance with formatPrice */}
                      <td>
                        {report.status === 'Delivered' ? (
                          <div className="d-flex flex-column gap-1 small">
                            {Object.entries(report.paymentAmounts)
                              .filter(([, amt]) => Number(amt) > 0)
                              .map(([method, amt]) => (
                                <div key={method}>
                                  <strong>{method}:</strong> {formatPrice(amt.toFixed(2))}
                                  {method === 'Cash' && report.tenderedAmount && (
                                    <span>
                                      {' '}
                                      (Tendered: {formatPrice(report.tenderedAmount)}, Change: {formatPrice(report.change.toFixed(2))})
                                    </span>
                                  )}
                                  {method === 'Card' && report.cardDetails && (
                                    <span> (****{report.cardDetails.slice(-4)})</span>
                                  )}
                                  {method === 'UPI' && report.upiDetails && (
                                    <span> ({report.upiDetails.split('@')[0]})</span>
                                  )}
                                </div>
                              ))}
                            <div className="mt-1">
                              <strong>Total Paid: {formatPrice(calculateTotalPaid(report.paymentAmounts).toFixed(2))}</strong>
                            </div>
                            <div>
                              <strong>Balance: {formatPrice(0.00)}</strong>
                            </div>
                          </div>
                        ) : (
                          <div className="d-flex flex-column gap-2">
                            <div className="d-flex align-items-center gap-2">
                              <label className="form-label small mb-0">Cash:</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                style={{ width: '80px' }}
                                value={report.paymentAmounts.Cash || ''}
                                onChange={(e) => handlePaymentAmountChange(report.tripId, 'Cash', e.target.value)}
                                min="0"
                                step="0.01"
                              />
                            </div>
                            {Number(report.paymentAmounts.Cash) > 0 && (
                              <div className="d-flex align-items-center gap-2 ps-3">
                                <label className="form-label small mb-0">Tendered:</label>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  style={{ width: '80px' }}
                                  value={report.tenderedAmount || ''}
                                  onChange={(e) => handleTenderedChange(report.tripId, e.target.value)}
                                  min={report.paymentAmounts.Cash || 0}
                                  step="0.01"
                                />
                                <small className="text-success">Change: {formatPrice(report.change.toFixed(2))}</small>
                              </div>
                            )}
                            <div className="d-flex align-items-center gap-2">
                              <label className="form-label small mb-0">Card:</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                style={{ width: '80px' }}
                                value={report.paymentAmounts.Card || ''}
                                onChange={(e) => handlePaymentAmountChange(report.tripId, 'Card', e.target.value)}
                                min="0"
                                step="0.01"
                              />
                            </div>
                            {Number(report.paymentAmounts.Card) > 0 && (
                              <div className="ps-3">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="Card Number"
                                  value={report.cardDetails || ''}
                                  onChange={(e) =>
                                    handlePaymentDetailsInput(report.tripId, 'cardDetails', e.target.value)
                                  }
                                />
                              </div>
                            )}
                            <div className="d-flex align-items-center gap-2">
                              <label className="form-label small mb-0">UPI:</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                style={{ width: '80px' }}
                                value={report.paymentAmounts.UPI || ''}
                                onChange={(e) => handlePaymentAmountChange(report.tripId, 'UPI', e.target.value)}
                                min="0"
                                step="0.01"
                              />
                            </div>
                            {Number(report.paymentAmounts.UPI) > 0 && (
                              <div className="ps-3">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="UPI ID"
                                  value={report.upiDetails || ''}
                                  onChange={(e) =>
                                    handlePaymentDetailsInput(report.tripId, 'upiDetails', e.target.value)
                                  }
                                />
                              </div>
                            )}
                            <hr className="my-2" />
                            <div className="text-end">
                              <strong>Total Paid: {formatPrice(calculateTotalPaid(report.paymentAmounts).toFixed(2))}</strong>
                            </div>
                            <div className="text-end">
                              <strong
                                className={getBalance(report) > 0 ? 'text-warning' : 'text-success'}
                              >
                                Balance: {formatPrice(getBalance(report))}
                              </strong>
                            </div>
                          </div>
                        )}
                      </td>
                      <td>
                        <button className="trip-main-btn-action-details btn-sm me-2" onClick={() => handleShowDetails(report)}>
                          Details
                        </button>
                      </td>
                      <td>
                        {report.status === 'Delivered' ? (
                          <span className="badge bg-success">Delivered</span>
                        ) : (
                          <button className="btn btn-success btn-sm" onClick={() => markAsDelivered(report)}>
                            Mark Delivered
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* UPDATED: Footer now uses Pending Grand Total (sum of balances) with dynamic currency */}
            <div className="mt-3 text-end">
              <h5 className="text-success">Total Pending Orders: {formatPrice(calculatePendingGrandTotal())}</h5>
            </div>
          </div>
        )}
        {selectedEmployee && filteredReports.length === 0 && !loading && (
          <div className="trip-main-no-orders text-center my-4 text-muted">
            <p>
              No delivery orders assigned to {selectedEmployee.name} for the selected date
              {billNumber ? ` and bill number ${billNumber}` : ''}
              {customerName ? ` and customer ${customerName}` : ''}.
            </p>
          </div>
        )}
        {showPopup && selectedReport && (
          <div className="trip-main-modal modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="trip-main-modal-content modal-content">
                <div className="trip-main-modal-header modal-header">
                  <h5 className="modal-title">Order Details</h5>
                  <button type="button" className="btn-close" onClick={handleClosePopup}></button>
                </div>
                <div className="trip-main-modal-body modal-body">
                  <p>
                    <strong>Order No:</strong> {selectedReport.orderNo}
                  </p>
                  <p>
                    <strong>Date:</strong> {formatTimestamp(selectedReport.timestamp)}
                  </p>{/* FIXED: Use timestamp */}
                  <p>
                    <strong>Customer:</strong> {selectedReport.customerName || 'N/A'}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedReport.email || 'N/A'}
                  </p>
                  <p>
                    <strong>Delivery Person Name:</strong> {selectedReport.deliveryPersonName || 'Unknown'}
                  </p>{/* UPDATED: Show delivery person name */}
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={selectedReport.status === 'Delivered' ? 'badge bg-success' : 'badge bg-warning'}>
                      {selectedReport.status}
                    </span>
                  </p>
                  <p>
                    <strong>Grand Total:</strong> {formatPrice(calculateGrandTotal(selectedReport.cartItems))}
                  </p>
                  {/* NEW: Show subtotal, VAT, total paid, balance in popup with dynamic currency */}
                  <p>
                    <strong>Subtotal:</strong> {formatPrice(calculateSubtotal(selectedReport.cartItems))}
                  </p>
                  <p>
                    <strong>VAT ({(vatRate * 100).toFixed(0)}%):</strong> {formatPrice(calculateTotalVat(selectedReport.cartItems))}
                  </p>
                  <p>
                    <strong>Total Paid:</strong> {formatPrice(calculateTotalPaid(selectedReport.paymentAmounts).toFixed(2))}
                  </p>
                  <p>
                    <strong>Balance:</strong>{' '}
                    <span className={getBalance(selectedReport) > 0 ? 'text-warning' : 'text-success'}>
                      {formatPrice(getBalance(selectedReport))}
                    </span>
                  </p>
                  {/* NEW: Detailed payments */}
                  {Object.entries(selectedReport.paymentAmounts).some(([, amt]) => Number(amt) > 0) && (
                    <>
                      <h6>Payments:</h6>
                      <ul className="list-unstyled">
                        {Object.entries(selectedReport.paymentAmounts)
                          .filter(([, amt]) => Number(amt) > 0)
                          .map(([method, amt]) => (
                            <li key={method} className="mb-1">
                              <strong>{method}:</strong> {formatPrice(amt.toFixed(2))}
                              {method === 'Cash' && selectedReport.tenderedAmount && (
                                <span>
                                  {' '}
                                  (Tendered: {formatPrice(selectedReport.tenderedAmount)}, Change: {formatPrice(selectedReport.change.toFixed(2))})
                                </span>
                              )}
                              {method === 'Card' && selectedReport.cardDetails && (
                                <span> (Card: ****{selectedReport.cardDetails.slice(-4)})</span>
                              )}
                              {method === 'UPI' && selectedReport.upiDetails && (
                                <span> (UPI: {selectedReport.upiDetails})</span>
                              )}
                            </li>
                          ))}
                      </ul>
                    </>
                  )}
                  {/* UPDATED: Enhanced Items list with addons, combos, ingredients, preserved prices */}
                  <h6>Items:</h6>
                  <ul className="list-unstyled">
                    {selectedReport.cartItems.map((item, idx) => (
                      <li key={idx} className="mb-3">
                        <strong>
                          {item.name} x{item.quantity} - {formatPrice((item.exclTotal + item.taxTotal) * item.quantity)}
                        </strong>
                        <div>Subtotal: {formatPrice(item.exclTotal * item.quantity)}, VAT: {formatPrice(item.taxTotal * item.quantity)}</div>
                        {/* Addons */}
                        {renderAddonsInPopup(item.addons)}
                        {/* Combos */}
                        {renderCombosInPopup(item.selectedCombos)}
                        {/* Ingredients */}
                        {renderIngredientsInPopup(item.ingredients)}
                        {/* Ice/Spicy if applicable */}
                        {item.icePreference === 'with_ice' && item.icePrice > 0 && (
                          <div className="text-muted small ms-3">
                            + Ice x{item.quantity} - {formatPrice((item.icePrice * item.quantity))}
                          </div>
                        )}
                        {item.isSpicy && item.spicyPrice > 0 && (
                          <div className="text-danger small ms-3">
                            + Spicy x{item.quantity} - {formatPrice((item.spicyPrice * item.quantity))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={handleClosePopup}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TripReport;