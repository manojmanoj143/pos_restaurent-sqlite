// src/components/Form/salaryreceptlist.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaPrint, FaEye, FaTrashAlt, FaChevronLeft, FaChevronRight, FaFileInvoiceDollar, FaArrowLeft, FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const SalaryReceiptList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [slips, setSlips] = useState([]);
  const [filteredSlips, setFilteredSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [baseUrl, setBaseUrl] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [companyName, setCompanyName] = useState('My Company');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const itemsPerPage = 10;

  // Styles - Updated to match EmployeeList design
  const styles = {
    container: {
      height: '100vh',
      overflowY: 'auto',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative'
    },
    backButton: {
      position: 'fixed',
      top: '20px',
      left: '20px',
      backgroundColor: 'transparent',
      border: '2px solid #3498db',
      color: '#3498db',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 20px',
      borderRadius: '50px',
      fontSize: '16px',
      fontWeight: '600',
      boxShadow: '0 2px 10px rgba(52, 152, 219, 0.2)',
      zIndex: 1001,
      transition: 'all 0.3s ease'
    },
    mainCard: {
      maxWidth: '1250px',
      margin: '80px auto 20px',
      backgroundColor: '#ffffff',
      padding: '30px',
      borderRadius: '15px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      paddingBottom: '20px',
      borderBottom: '2px solid #3498db'
    },
    title: {
      textAlign: 'center',
      color: '#2c3e50',
      margin: 0,
      fontSize: '1.8rem',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px'
    },
    searchGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: '#f8f9fa',
      padding: '8px 12px',
      borderRadius: '10px',
      border: '1px solid #e9ecef'
    },
    searchInput: {
      flex: 1,
      padding: '5px 0',
      border: 'none',
      background: 'transparent',
      fontSize: '0.9rem',
      color: '#2c3e50',
      outline: 'none'
    },
    searchIcon: {
      color: '#7f8c8d',
      fontSize: '1rem'
    },
    tableContainer: {
      overflowX: 'auto',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      marginBottom: '20px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '1200px'
    },
    th: {
      padding: '15px 12px',
      border: 'none',
      textAlign: 'left',
      whiteSpace: 'nowrap',
      fontWeight: '600',
      fontSize: '0.95rem',
      background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
      color: '#ffffff'
    },
    td: {
      padding: '15px 12px',
      borderRight: '1px solid #e9ecef',
      whiteSpace: 'nowrap',
      color: '#2c3e50'
    },
    tdCenter: {
      textAlign: 'center'
    },
    actions: {
      display: 'flex',
      gap: '5px'
    },
    actionBtn: {
      padding: '6px 10px',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '0.85rem',
      transition: 'all 0.3s ease'
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      marginTop: '20px'
    },
    pageBtn: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      backgroundColor: 'white',
      borderRadius: '6px',
      cursor: 'pointer',
      color: '#374151'
    },
    pageActive: {
      backgroundColor: '#3498db',
      color: 'white',
      borderColor: '#3498db'
    },
    errorMsg: {
      background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
      color: '#c0392b',
      padding: '15px',
      borderRadius: '10px',
      marginBottom: '20px',
      textAlign: 'center',
      border: '1px solid #e74c3c',
      boxShadow: '0 2px 4px rgba(231, 76, 60, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px'
    },
    successMsg: {
      background: 'linear-gradient(135deg, #d4edda 0%, #c8e6c9 100%)',
      color: '#155724',
      padding: '15px',
      borderRadius: '10px',
      marginBottom: '20px',
      textAlign: 'center',
      border: '1px solid #28a745',
      boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px'
    },
    warningMsg: {
      background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
      color: '#856404',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '20px',
      textAlign: 'center',
      border: '1px solid #ffc107',
      boxShadow: '0 2px 4px rgba(255, 193, 7, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '15px'
    },
    warningButtons: {
      display: 'flex',
      gap: '10px'
    },
    warningYesBtn: {
      background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '600'
    },
    warningNoBtn: {
      background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '600'
    },
    loadingMsg: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      textAlign: 'center',
      color: '#3498db',
      fontSize: '18px'
    },
    noData: {
      textAlign: 'center',
      color: '#7f8c8d',
      fontSize: '1.2rem',
      marginTop: '50px',
      padding: '40px',
      background: '#f8f9fa',
      borderRadius: '10px',
      border: '2px dashed #bdc3c7'
    }
  };

  const formatCurrency = (val) => Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatDate = (dateStr) => new Date(dateStr || Date.now()).toLocaleDateString('en-IN');

  useEffect(() => {
    const init = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/network_info");
        const { config: appConfig } = response.data;
        if (appConfig.mode === "client") {
          setBaseUrl(`http://${appConfig.server_ip}:8000`);
        } else {
          setBaseUrl('');
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
        setBaseUrl(window.location.origin || '');
      }
      if (baseUrl !== undefined) {
        fetchCurrency();
        fetchCompanyName();
        fetchSlips();
      }
    };
    init();
  }, [baseUrl, location]);

  const fetchCurrency = async () => {
    try {
      const url = baseUrl ? `${baseUrl}/api/settings` : '/api/settings';
      const response = await axios.get(url);
      const settingsData = response.data;
      const currencyCode = settingsData.currency || 'INR';
      const currencySymbol = getCurrencySymbol(currencyCode);
      setCurrency(currencySymbol);
    } catch (err) {
      console.error('Error fetching currency settings:', err);
      setCurrency('₹');
    }
  };

  const getCurrencySymbol = (code) => {
    const symbols = {
      'USD': '$',
      'INR': '₹',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'AUD': 'A$',
      'CAD': 'C$',
      'AED': 'AED',
    };
    return symbols[code] || code;
  };

  const fetchCompanyName = async () => {
    try {
      const url = baseUrl ? `${baseUrl}/api/company-details` : '/api/company-details';
      const response = await axios.get(url);
      if (response.data.companyDetails?.length) {
        setCompanyName(response.data.companyDetails.slice(-1)[0].restaurantName);
      }
    } catch (err) {
      console.error('Error fetching company name:', err);
      setCompanyName('My Company');
    }
  };

  const fetchSlips = async () => {
    try {
      setLoading(true);
      setError('');
      const url = baseUrl ? `${baseUrl}/api/salary-slip` : '/api/salary-slip';
      const res = await axios.get(url);
      setSlips(res.data || []);
    } catch (e) {
      console.error("Fetch slips error:", e);
      setError("Failed to fetch salary receipts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = slips.filter(slip =>
      slip.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      slip.month?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSlips(filtered);
    setCurrentPage(1);
  }, [searchQuery, slips]);

  useEffect(() => {
    if (location.state?.fromSave) {
      setMessage("Salary slip saved successfully! Updated list below.");
      setError('');
      fetchSlips();
    }
  }, [location.state]);

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

  const actualDelete = async (id) => {
    try {
      const url = baseUrl ? `${baseUrl}/api/salary-slip/${id}` : `/api/salary-slip/${id}`;
      await axios.delete(url);
      await fetchSlips();
      setMessage('Salary receipt deleted successfully!');
      setError('');
    } catch (e) {
      setError("Delete failed. Please try again.");
      setMessage('');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handlePrint = async (id) => {
    try {
      const url = baseUrl ? `${baseUrl}/api/salary-slip/${id}` : `/api/salary-slip/${id}`;
      const res = await axios.get(url);
      const slip = res.data;
      const [y, m] = slip.month.split('-');
      const lastDayDate = new Date(parseInt(y), parseInt(m), 0);
      const totalWorkingDays = lastDayDate.getDate();
      const totalInWords = `${currency} ${slip.netPay.toFixed(2)} Only`;
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head><title>Salary Receipt - ${slip.employeeName} - ${slip.month}</title>
            <style>
              body { font-family: 'Times New Roman', serif; color: #000; padding: 20px; margin: 0; background: white; }
              .print-layout-container { display: block; color: #000; padding: 20px; }
              .print-header { text-align: center; margin-bottom: 20px; }
              .print-header h1 { font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; }
              .print-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 20px; }
              .print-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
              .print-row strong { font-weight: bold; }
              .print-section-header { font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #000; margin-top: 20px; margin-bottom: 10px; font-size: 14px; }
              .print-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
              .print-table th { text-align: left; border-bottom: 1px solid #000; padding: 5px 0; font-weight: bold; }
              .print-table td { padding: 5px 0; border-bottom: 1px solid #ddd; }
              .text-right { text-align: right; }
              .print-totals-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="print-layout-container">
              <div class="print-header">
                <h1>${companyName}</h1>
                <div style="font-size: 12px; letter-spacing: 1px;">SALARY SLIP FOR ${slip.month}</div>
                <div style="font-size: 12px; margin-top: 5px;">Sal Slip/${slip.employeeIdCode || slip.employeeId}/00007</div>
              </div>
              <div class="print-section-header">Employee & Payroll Details</div>
              <div class="print-grid-2">
                <div>
                  <div class="print-row"><strong>Employee:</strong> <span>${slip.employeeIdCode || slip.employeeId}</span></div>
                  <div class="print-row"><strong>Employee Name:</strong> <span>${slip.employeeName}</span></div>
                  <div class="print-row"><strong>Company:</strong> <span>${companyName}</span></div>
                  <div class="print-row"><strong>Designation:</strong> <span>${slip.designation || 'N/A'}</span></div>
                  <div class="print-row"><strong>Posting Date:</strong> <span>${slip.postingDate || 'N/A'}</span></div>
                  <div class="print-row"><strong>Status:</strong> <span>${slip.status || 'Submitted'}</span></div>
                  <div class="print-row"><strong>Currency:</strong> <span>${currency}</span></div>
                </div>
                <div>
                  <div class="print-row"><strong>Payroll Frequency:</strong> <span>${slip.payrollFrequency || 'Monthly'}</span></div>
                  <div class="print-row"><strong>Start Date:</strong> <span>${slip.startDate || 'N/A'}</span></div>
                  <div class="print-row"><strong>End Date:</strong> <span>${slip.endDate || 'N/A'}</span></div>
                  <div class="print-row"><strong>Salary Structure:</strong> <span>${slip.salaryStructure || 'N/A'}</span></div>
                  <div class="print-row"><strong>Mode Of Payment:</strong> <span>${slip.modeOfPayment || 'N/A'}</span></div>
                </div>
              </div>
              <div class="print-section-header">Payment Days</div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px;">
                <div><strong>Working Days:</strong> ${totalWorkingDays}</div>
                <div><strong>Unmarked days:</strong> 0</div>
                <div><strong>Leave Without Pay:</strong> ${slip.leaveWithoutPay || 0}</div>
                <div><strong>Absent Days:</strong> ${slip.absentCount || 0}</div>
                <div><strong>Payment Days:</strong> ${slip.paymentDays || 0}</div>
              </div>
              <div class="print-section-header">Earnings & Deductions</div>
              <div class="print-grid-2" style="gap: 10px;">
                <table class="print-table">
                  <thead><tr><th>Sr</th><th>Component</th><th class="text-right">Amount</th><th class="text-right">Year To Date</th><th>Tax Flex</th><th>Tax Add</th></tr></thead>
                  <tbody>
                    ${slip.earnings?.map((e, i) => `<tr><td>${i + 1}</td><td>${e.component}</td><td class="text-right">${currency} ${formatCurrency(e.amount)}</td><td class="text-right">${currency} 0.00</td><td>${currency} 0.00</td><td>${currency} 0.00</td></tr>`).join('') || '<tr><td colspan="6">No earnings</td></tr>'}
                  </tbody>
                </table>
                <table class="print-table">
                  <thead><tr><th>Sr</th><th>Component</th><th class="text-right">Amount</th><th class="text-right">Year To Date</th><th>Tax Flex</th><th>Tax Add</th></tr></thead>
                  <tbody>
                    ${slip.deductions?.map((d, i) => `<tr><td>${i + 1}</td><td>${d.component}</td><td class="text-right">${currency} ${formatCurrency(d.amount)}</td><td class="text-right">${currency} 0.00</td><td>${currency} 0.00</td><td>${currency} 0.00</td></tr>`).join('') || '<tr><td colspan="6">No deductions</td></tr>'}
                  </tbody>
                </table>
              </div>
              <div class="print-section-header">Totals & Tax</div>
              <div class="print-grid-2">
                <div>
                  <div class="print-totals-row"><strong>Gross Pay:</strong> <span>${currency} ${formatCurrency(slip.grossPay || slip.grossSalary)}</span></div>
                  <div class="print-totals-row"><strong>Gross Pay (Company Currency):</strong> <span>${currency} ${formatCurrency(slip.grossPay || slip.grossSalary)}</span></div>
                  <div class="print-totals-row"><strong>Gross Year To Date:</strong> <span>${currency} ${formatCurrency(slip.grossYearToDate || 0)}</span></div>
                  <div class="print-totals-row"><strong>Gross Year To Date (Company Currency):</strong> <span>${currency} 0.00</span></div>
                  <div class="print-totals-row" style="color: red;"><strong>Total Deduction:</strong> <span style="color: red;">${currency} ${formatCurrency(slip.totalDeductions || 0)}</span></div>
                  <div class="print-totals-row" style="color: red;"><strong>Total Deduction (Company Currency):</strong> <span style="color: red;">${currency} ${formatCurrency(slip.totalDeductions || 0)}</span></div>
                  <div class="print-totals-row" style="margin-top: 10px; font-size: 15px;"><strong>Net Pay:</strong> <span>${currency} ${formatCurrency(slip.netPay)}</span></div>
                  <div class="print-totals-row" style="font-size: 15px;"><strong>Net Pay (Company Currency):</strong> <span>${currency} ${formatCurrency(slip.netPay)}</span></div>
                  <div class="print-totals-row"><strong>Rounded Total (Company Currency):</strong> <span>${currency} ${Math.round(slip.netPay || 0).toFixed(2)}</span></div>
                  <div class="print-totals-row"><strong>Year To Date:</strong> <span>${currency} ${formatCurrency(slip.grossYearToDate || 0)}</span></div>
                  <div class="print-totals-row"><strong>Year To Date (Company Currency):</strong> <span>${currency} 0.00</span></div>
                  <div class="print-totals-row"><strong>Month To Date:</strong> <span>${currency} ${formatCurrency(slip.netPay)}</span></div>
                  <div class="print-totals-row"><strong>Month To Date (Company Currency):</strong> <span>${currency} 0.00</span></div>
                  <div style="margin-top: 15px; font-style: italic; font-size: 13px; font-weight: bold;">Total in words: <br />${totalInWords}</div>
                  <div style="margin-top: 5px; font-style: italic; font-size: 13px; font-weight: bold;">Total in words (Company Currency): <br />${totalInWords}</div>
                </div>
                
              </div>
              <div class="print-section-header">Bank Details</div>
              <div style="display: flex; gap: 50px;">
                <div><strong>Bank Name:</strong> ${slip.bankName || 'N/A'}</div>
                <div><strong>Bank Account No:</strong> ${slip.accountNumber || 'N/A'}</div>
              </div>
            </div>
            <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };</script>
          </body>
        </html>
      `);
      printWindow.document.close();
      setMessage('Print initiated successfully!');
      setError('');
    } catch (e) {
      setError("Print failed. Please try again.");
      setMessage('');
    }
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentSlips = filteredSlips.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredSlips.length / itemsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);

  const handleRowClick = (slipId) => {
    navigate(`/salary-slip?id=${slipId}`);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingMsg}>
          <FaFileInvoiceDollar style={{ fontSize: '48px', marginBottom: '20px', color: '#3498db' }} />
          <p>Loading salary receipts...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button
        onClick={() => navigate('/admin')}
        style={styles.backButton}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#3498db';
          e.target.style.color = '#ffffff';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = '#3498db';
          e.target.style.transform = 'scale(1)';
        }}
        disabled={loading}
      >
        <FaArrowLeft /> Back to Admin
      </button>
      <div style={styles.mainCard}>
        <div style={styles.header}>
          <div></div>
          <h2 style={styles.title}>
            <FaFileInvoiceDollar style={{ color: '#3498db', fontSize: '2rem' }} />
            Salary Receipt List ({filteredSlips.length})
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/salary-slip')}
              style={{
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '50px',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(52, 152, 219, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.3)';
              }}
              disabled={loading}
            >
              Add New Salary Slip
            </button>
          </div>
        </div>
        {error && (
          <div style={styles.errorMsg}>
            <FaTimes style={{ fontSize: '1.2rem' }} />
            {error}
          </div>
        )}
        {message && (
          <div style={styles.successMsg}>
            <FaCheck style={{ fontSize: '1.2rem', color: '#27ae60' }} />
            {message}
          </div>
        )}
        {confirmDelete && (
          <div style={styles.warningMsg}>
            <FaExclamationTriangle style={{ fontSize: '2rem', color: '#f39c12' }} />
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Are you sure you want to delete this salary receipt?</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.95rem' }}>This action cannot be undone.</p>
            <div style={styles.warningButtons}>
              <button
                style={styles.warningYesBtn}
                onClick={() => actualDelete(confirmDelete)}
              >
                Yes, Delete
              </button>
              <button
                style={styles.warningNoBtn}
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <div style={{
          background: '#ffffff',
          padding: '20px',
          borderRadius: '15px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
            gap: '10px',
            paddingBottom: '10px',
            borderBottom: '1px solid #3498db'
          }}>
            <FaSearch style={{ color: '#3498db', fontSize: '1.5rem' }} />
            <h4 style={{ margin: 0, color: '#2c3e50', fontWeight: '600' }}>Search Salary Receipts</h4>
          </div>
          <div style={styles.searchGroup}>
            <FaSearch style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by employee name or month..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Employee ID</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Month</th>
                <th style={styles.th}>Gross Pay</th>
                <th style={styles.th}>Net Pay</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Created Date</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentSlips.length > 0 ? (
                currentSlips.map((slip, index) => (
                  <tr
                    key={slip._id}
                    style={{
                      borderBottom: '1px solid #e9ecef',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff'
                    }}
                    onClick={() => handleRowClick(slip._id)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
                    }}
                  >
                    <td style={styles.td}>{slip.employeeIdCode || slip.employeeId}</td>
                    <td style={styles.td}>{slip.employeeName || 'N/A'}</td>
                    <td style={styles.td}>{slip.month || 'N/A'}</td>
                    <td style={styles.td}>{currency} {formatCurrency(slip.grossPay || slip.grossSalary)}</td>
                    <td style={styles.td}>{currency} {formatCurrency(slip.netPay)}</td>
                    <td style={{ ...styles.td, ...styles.tdCenter }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        backgroundColor: slip.status === 'Submitted' ? '#d4edda' : '#f8d7da',
                        color: slip.status === 'Submitted' ? '#155724' : '#721c24'
                      }}>
                        {slip.status || 'Submitted'}
                      </span>
                    </td>
                    <td style={styles.td}>{formatDate(slip.created_at)}</td>
                    <td style={{ ...styles.td, ...styles.tdCenter }}>
                      <div style={styles.actions}>
                        <button
                          style={{
                            ...styles.actionBtn,
                            background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                            boxShadow: '0 2px 4px rgba(52, 152, 219, 0.3)'
                          }}
                          onClick={(e) => { e.stopPropagation(); navigate(`/salary-slip?id=${slip._id}`); }}
                          title="View/Edit"
                        >
                          <FaEye />
                        </button>
                        <button
                          style={{
                            ...styles.actionBtn,
                            background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                            boxShadow: '0 2px 4px rgba(46, 204, 113, 0.3)'
                          }}
                          onClick={(e) => { e.stopPropagation(); handlePrint(slip._id); }}
                          title="Print"
                        >
                          <FaPrint />
                        </button>
                        <button
                          style={{
                            ...styles.actionBtn,
                            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                            boxShadow: '0 2px 4px rgba(231, 76, 60, 0.3)'
                          }}
                          onClick={(e) => { e.stopPropagation(); handleDelete(slip._id); }}
                          title="Delete"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ ...styles.td, textAlign: 'center' }}>
                    <div style={styles.noData}>
                      <FaFileInvoiceDollar style={{ fontSize: '4rem', marginBottom: '20px', color: '#3498db' }} />
                      No salary receipts found.
                      <button
                        onClick={fetchSlips}
                        style={{
                          color: '#3498db',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          fontWeight: '600',
                          textDecoration: 'underline',
                          marginLeft: '5px'
                        }}
                      >
                        Refresh
                      </button>.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredSlips.length > itemsPerPage && (
          <div style={styles.pagination}>
            <button
              style={{ ...styles.pageBtn, ...(currentPage === 1 ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <FaChevronLeft />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                style={{ ...styles.pageBtn, ...(currentPage === i + 1 ? styles.pageActive : {}) }}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              style={{ ...styles.pageBtn, ...(currentPage === totalPages ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <FaChevronRight />
            </button>
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>
          Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredSlips.length)} of {filteredSlips.length} receipts
        </div>
      </div>
    </div>
  );
};

export default SalaryReceiptList;