// src/components/Form/SalarySlip.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaFileInvoiceDollar, FaUser, FaCalendarAlt, FaSave, FaPrint, FaInfoCircle, FaTable, FaPlus, FaTrash, FaUniversity, FaMoneyBillWave, FaCalculator } from 'react-icons/fa';
import jsPDF from 'jspdf'; // Assume installed: npm install jspdf
import 'jspdf-autotable'; // Assume installed: npm install jspdf-autotable

const SalarySlip = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('2025-11'); // Default to November 2025
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [companyName, setCompanyName] = useState('My Company'); // Fetched from company details
  const [currency, setCurrency] = useState('AED'); // Updated default to AED
  const [totalWorkingDays, setTotalWorkingDays] = useState(30);
  const [applyCompanyLeaves, setApplyCompanyLeaves] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [effectiveWorkingDays, setEffectiveWorkingDays] = useState(0);
  const [companyLeaveCount, setCompanyLeaveCount] = useState(0);
  const [dailyRate, setDailyRate] = useState(0);
  const [activeTab, setActiveTab] = useState('summary'); // Tabs: 'summary', 'details', 'payment-days', 'earnings-deductions', 'bank-details', 'net-pay'
  const [leaveWithoutPay, setLeaveWithoutPay] = useState(0);
  // New states for Net Pay tab
  const [netPay, setNetPay] = useState(0);
  const [yearToDate, setYearToDate] = useState(0);
  const [monthToDate, setMonthToDate] = useState(0);
  const [totalInWords, setTotalInWords] = useState('');
  // New states for Earnings (Deductions removed)
  const [earnings, setEarnings] = useState([
    { component: 'Basic', amount: 6000.00 },
    { component: 'House Rent Allowance', amount: 4200.00 },
    { component: 'Commuting Expenses', amount: 1800.00 }
  ]);
  const [grossPay, setGrossPay] = useState(12000.00);
  const [grossYearToDate, setGrossYearToDate] = useState(106285.71);
  const totalDeductions = 0.00; // Fixed to 0 since deductions removed

  // Fetch base URL, settings, and company name
  useEffect(() => {
    const fetchConfig = async () => {
      let currentBaseUrl = "";
      try {
        const response = await axios.get("http://localhost:8000/api/network_info");
        const { config: appConfig } = response.data;
        if (appConfig.mode === "client") {
          currentBaseUrl = `http://${appConfig.server_ip}:8000`;
          setBaseUrl(currentBaseUrl);
        } else {
          setBaseUrl("");
        }
        // Fetch settings with baseUrl
        await fetchSettings(currentBaseUrl);
        // Fetch company name with baseUrl
        await fetchCompanyName(currentBaseUrl);
        // Fetch employees with baseUrl
        await fetchEmployees(currentBaseUrl);
      } catch (error) {
        console.error("Failed to fetch config:", error);
        setBaseUrl('');
        setError('Failed to load configuration');
        // Fallback fetches
        await fetchSettings('');
        await fetchCompanyName('');
        await fetchEmployees('');
      }
    };
    fetchConfig();
  }, []);

  // Fetch company name from company details
  const fetchCompanyName = async (currentBaseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/company-details`);
      if (response.data.companyDetails && response.data.companyDetails.length > 0) {
        const latestDetails = response.data.companyDetails[response.data.companyDetails.length - 1];
        setCompanyName(latestDetails.restaurantName || 'My Company');
      } else {
        setCompanyName('My Company');
      }
    } catch (err) {
      console.error('Failed to fetch company name:', err);
      setCompanyName('My Company');
    }
  };

  const fetchSettings = async (currentBaseUrl) => {
    try {
      const url = currentBaseUrl ? `${currentBaseUrl}/api/settings` : '/api/settings';
      const response = await axios.get(url);
      const settingsData = response.data;
      const currencyCode = settingsData.currency || 'AED'; // Updated default to AED
      const currencySymbol = getCurrencySymbol(currencyCode);
      setCurrency(currencySymbol);
      setTotalWorkingDays(settingsData.totalWorkingDays || 30);
      setApplyCompanyLeaves(settingsData.applyCompanyLeaves || false);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setCurrency('AED'); // Updated default
      setTotalWorkingDays(30);
      setApplyCompanyLeaves(false);
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

  // Fetch employees
  const fetchEmployees = async (currentBaseUrl) => {
    try {
      const url = currentBaseUrl ? `${currentBaseUrl}/api/add-employee` : '/api/add-employee';
      const response = await axios.get(url);
      setEmployees(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      setError('Failed to load employees');
      setLoading(false);
    }
  };

  // Fetch attendance summary for selected employee and month
  const fetchAttendanceSummary = async (currentBaseUrl, month, employeeId) => {
    try {
      let url = currentBaseUrl ? `${currentBaseUrl}/api/attendance?month=${month}` : `/api/attendance?month=${month}`;
      url += `&employeeId=${employeeId}`;
      const response = await axios.get(url);
      const records = response.data;
      const fullCount = records.filter((r) => r.status === 'Full Day').length;
      const offCount = records.filter((r) => r.status === 'Off Day').length;
      const leaveWithoutPayCount = records.filter((r) => r.status === 'Leave Without Pay').length;
      const absentCount = records.filter((r) => r.status === 'Absent').length;
      let eff = totalWorkingDays;
      let holidayData = [];
      let companyLeaveCountLocal = 0;
      if (applyCompanyLeaves) {
        const year = parseInt(month.split('-')[0]);
        const mon = month.split('-')[1];
        try {
          const res = await axios.get(`${currentBaseUrl}/api/working-days?year=${year}&month=${mon}`);
          holidayData = res.data.holidays || [];
          companyLeaveCountLocal = holidayData.length;
          eff = Math.max(0, totalWorkingDays - companyLeaveCountLocal);
        } catch (e) {
          console.error('Failed to fetch holidays:', e);
        }
      }
      setHolidays(holidayData);
      setCompanyLeaveCount(companyLeaveCountLocal);
      setEffectiveWorkingDays(eff);
      setLeaveWithoutPay(leaveWithoutPayCount);
      const dailyRateLocal = selectedEmployee ? selectedEmployee.salary / totalWorkingDays : 0;
      setDailyRate(dailyRateLocal);
      const totalSalary = records.reduce((sum, rec) => sum + (rec.dailySalary || 0), 0);
      const paymentDays = fullCount + offCount;
      const grossSalary = selectedEmployee ? selectedEmployee.salary : 0;
      const deductions = totalDeductions; // Fixed 0
      const netPayLocal = totalSalary - deductions;
      setAttendanceSummary({
        fullCount,
        offCount,
        leaveWithoutPay: leaveWithoutPayCount,
        absentCount,
        paymentDays,
        totalSalary,
        grossSalary,
        deductions,
        netPay: netPayLocal,
        dailyRate: dailyRateLocal
      });
      // Update net pay states
      setNetPay(netPayLocal);
      setMonthToDate(netPayLocal); // Month to date is current net pay
      // Fetch year to date and total in words from backend (new API call)
      try {
        const ytdResponse = await axios.get(`${currentBaseUrl || ''}/api/salary-slip/year-to-date?employeeId=${employeeId}&month=${month}`);
        const { year_to_date, total_in_words, gross_year_to_date } = ytdResponse.data;
        setYearToDate(year_to_date);
        setTotalInWords(total_in_words);
        setGrossYearToDate(gross_year_to_date);
      } catch (ytdErr) {
        console.error('Failed to fetch YTD data:', ytdErr);
        // Fallback to 0 or hardcoded if needed
        setYearToDate(0);
        setTotalInWords('');
        setGrossYearToDate(0);
      }
    } catch (err) {
      console.error('Failed to fetch attendance summary:', err);
      setError('Failed to load attendance summary');
    }
  };

  // Load summary when employee or month changes
  useEffect(() => {
    if (selectedEmployee) {
      setLoading(true);
      fetchAttendanceSummary(baseUrl, selectedMonth, selectedEmployee._id);
      // Update grossPay to employee's salary
      setGrossPay(selectedEmployee.salary || 0);
      setLoading(false);
    } else {
      setAttendanceSummary(null);
    }
  }, [selectedEmployee, selectedMonth, baseUrl]);

  // Handle month change
  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  // Handle employee selection
  const handleEmployeeSelect = (e) => {
    const empId = e.target.value;
    const emp = employees.find(e => e._id === empId);
    setSelectedEmployee(emp);
    setError('');
  };

  // Earnings handlers (Deductions removed)
  const updateEarningsAmount = (index, value) => {
    const newEarnings = [...earnings];
    newEarnings[index].amount = parseFloat(value) || 0;
    setEarnings(newEarnings);
    updateTotals();
  };

  const addEarningsRow = () => {
    setEarnings([...earnings, { component: '', amount: 0 }]);
  };

  const deleteEarningsRow = (index) => {
    const newEarnings = earnings.filter((_, i) => i !== index);
    setEarnings(newEarnings);
    updateTotals();
  };

  const updateEarningsComponent = (index, value) => {
    const newEarnings = [...earnings];
    newEarnings[index].component = value;
    setEarnings(newEarnings);
  };

  const updateTotals = () => {
    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    setGrossPay(selectedEmployee ? selectedEmployee.salary : totalEarnings); // Prioritize employee's salary for gross pay
  };

  // Save salary slip
  const saveSalarySlip = async () => {
    if (!selectedEmployee || !attendanceSummary) {
      setError('Please select an employee and load summary first.');
      return;
    }
    try {
      const url = baseUrl ? `${baseUrl}/api/salary-slip` : '/api/salary-slip';
      const response = await axios.post(url, {
        employeeId: selectedEmployee._id,
        month: selectedMonth,
        employeeName: selectedEmployee.name,
        employeeType: selectedEmployee.employeeType,
        employeeIdCode: selectedEmployee.employeeId,
        ...attendanceSummary,
        earnings, // Add earnings array
        grossPay,
        grossYearToDate,
        totalDeductions, // Fixed 0
        netPay, // Current net pay
        yearToDate, // YTD net pay
        monthToDate, // MTD net pay
        totalInWords, // In words
        // Add bank details
        bankName: selectedEmployee.bankName || '',
        accountNumber: selectedEmployee.accountNumber || '',
        ifscCode: selectedEmployee.ifscCode || '',
        accountHolderName: selectedEmployee.accountHolderName || ''
      });
      setMessage('Salary slip saved successfully!');
      setError('');
    } catch (err) {
      setError('Failed to save salary slip.');
    }
  };

  // Function to get month abbreviation
  const getMonthAbbr = (monthStr) => {
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthIndex = parseInt(monthStr.split('-')[1]) - 1;
    return monthNames[monthIndex] || '';
  };

  // Generate PDF (updated: removed deductions table, updated final box with month abbr)
  const generatePDF = () => {
    if (!selectedEmployee || !attendanceSummary) return;
    const monthAbbr = getMonthAbbr(selectedMonth);
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Salary Slip', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Company: ${companyName}`, 20, 30);
    doc.text(`Employee: ${selectedEmployee.name}`, 20, 40);
    doc.text(`Month: ${selectedMonth}`, 20, 50);
    doc.text(`Employee ID: ${selectedEmployee.employeeId}`, 20, 60);
    doc.text(`Designation: ${selectedEmployee.employeeType}`, 20, 70);
    let startY = 80;
    // Bank Details Table
    doc.autoTable({
      startY,
      head: [['Bank Details', 'Value']],
      body: [
        ['Bank Name', selectedEmployee.bankName || 'N/A'],
        ['Account Holder Name', selectedEmployee.accountHolderName || 'N/A'],
        ['Account Number', selectedEmployee.accountNumber || 'N/A'],
        ['IFSC Code', selectedEmployee.ifscCode || 'N/A']
      ],
      theme: 'grid',
      margin: { left: 20, right: 20 }
    });
    startY = doc.lastAutoTable.finalY + 10;
    // Earnings Table
    doc.autoTable({
      startY,
      head: [['Earnings Component', 'Amount']],
      body: earnings.map(e => [e.component, `${currency}${e.amount.toFixed(2)}`]),
      theme: 'striped',
      margin: { left: 20, right: 20 }
    });
    startY = doc.lastAutoTable.finalY + 10;
    // Totals including new fields (removed Total Deductions row)
    doc.autoTable({
      startY,
      head: [['Totals', 'Amount']],
      body: [
        ['Gross Pay', `${currency}${grossPay.toFixed(2)}`],
        ['Gross Year To Date', `${currency}${grossYearToDate.toFixed(2)}`],
        ['Net Pay', `${currency}${netPay.toFixed(2)}`],
        ['Year To Date', `${currency}${yearToDate.toFixed(2)}`],
        ['Month To Date', `${currency}${monthToDate.toFixed(2)}`]
      ],
      theme: 'grid',
      margin: { left: 20, right: 20 }
    });
    startY = doc.lastAutoTable.finalY + 10;
    // Total in Words
    doc.text(`Total in Words: ${totalInWords}`, 20, startY);
    startY += 10;
    // Final Summary Box for Total Salary and Month Salary (with month abbr)
    doc.setFillColor(39, 174, 96); // Green background
    doc.rect(20, startY, 170, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`Total Salary: ${currency}${grossPay.toFixed(2)} | ${monthAbbr} Month Salary: ${currency}${monthToDate.toFixed(2)}`, 25, startY + 12);
    doc.save(`SalarySlip_${selectedEmployee.name}_${selectedMonth}.pdf`);
  };

  if (loading && employees.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'rgb(52, 152, 219)' }}>
        <div style={{ color: 'white', fontSize: '1.2rem' }}>Loading...</div>
      </div>
    );
  }

  const employeeDetails = selectedEmployee ? {
    employeeId: selectedEmployee.employeeId,
    employeeName: selectedEmployee.name,
    company: companyName, // Use fetched company name
    designation: selectedEmployee.employeeType,
    postingDate: selectedEmployee.created_at ? new Date(selectedEmployee.created_at).toLocaleDateString() : '2025-11-01', // Use created_at as proxy for posting date
    status: 'Submitted',
    currency: currency
  } : null;

  // Enhanced input style for neater appearance
  const inputStyle = {
    padding: '10px 12px', // Increased padding
    border: '2px solid #bdc3c7', // Thicker border
    borderRadius: '6px', // Slightly larger radius
    fontSize: '1rem', // Larger font
    transition: 'border-color 0.3s ease', // Smooth transition
    outline: 'none',
    width: '100%', // Full width where applicable
    boxSizing: 'border-box'
  };

  const readonlyInputStyle = {
    ...inputStyle,
    backgroundColor: '#f8f9fa',
    color: '#495057',
    cursor: 'not-allowed'
  };

  const amountInputStyle = {
    ...inputStyle,
    width: '150px', // Increased width for amount fields
    textAlign: 'right'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'rgb(52, 152, 219)', padding: '20px' }}> {/* Updated background to requested color */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}> {/* Increased width for tables */}
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate('/admin')}
              style={{
                padding: '12px', // Increased padding
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            >
              <FaArrowLeft />
            </button>
            <h1 style={{ margin: 0, color: 'white', fontSize: '2.2rem' }}> {/* White text for contrast */}
              <FaFileInvoiceDollar style={{ marginRight: '10px' }} /> Salary Slip
            </h1>
          </div>
        </div>
        {/* Selection */}
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: '20px' }}> {/* Semi-transparent white for better design */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ minWidth: '250px' }}> {/* Increased min-width */}
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>Select Employee:</label>
              <select
                value={selectedEmployee?._id || ''}
                onChange={handleEmployeeSelect}
                style={inputStyle}
              >
                <option value="">Choose Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>Month:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaCalendarAlt style={{ color: 'rgb(52, 152, 219)' }} />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Error and Message */}
        {error && (
          <div style={{ backgroundColor: '#ffebee', color: '#c0392b', padding: '15px', borderRadius: '8px', marginBottom: '15px', borderLeft: '4px solid #c0392b' }}>
            {error}
          </div>
        )}
        {message && (
          <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '15px', borderRadius: '8px', marginBottom: '15px', borderLeft: '4px solid #155724' }}>
            {message}
          </div>
        )}
        {/* Salary Slip Display */}
        {selectedEmployee && attendanceSummary ? (
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}> {/* Semi-transparent white */}
            {/* Tabs - Removed deductions references */}
            <div style={{ display: 'flex', marginBottom: '25px', borderBottom: '2px solid #dee2e6', overflowX: 'auto' }}>
              <button
                onClick={() => setActiveTab('summary')}
                style={{
                  padding: '12px 20px', // Increased padding
                  backgroundColor: activeTab === 'summary' ? 'rgb(52, 152, 219)' : 'transparent',
                  color: activeTab === 'summary' ? 'white' : '#2c3e50',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'summary' ? 'bold' : 'normal',
                  borderRadius: '6px 6px 0 0',
                  transition: 'background-color 0.3s ease',
                  marginRight: '2px'
                }}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('details')}
                style={{
                  padding: '12px 20px',
                  backgroundColor: activeTab === 'details' ? 'rgb(52, 152, 219)' : 'transparent',
                  color: activeTab === 'details' ? 'white' : '#2c3e50',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'details' ? 'bold' : 'normal',
                  borderRadius: '6px 6px 0 0',
                  transition: 'background-color 0.3s ease',
                  marginRight: '2px'
                }}
              >
                <FaInfoCircle style={{ marginRight: '5px' }} /> Employee Details
              </button>
              <button
                onClick={() => setActiveTab('payment-days')}
                style={{
                  padding: '12px 20px',
                  backgroundColor: activeTab === 'payment-days' ? 'rgb(52, 152, 219)' : 'transparent',
                  color: activeTab === 'payment-days' ? 'white' : '#2c3e50',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'payment-days' ? 'bold' : 'normal',
                  borderRadius: '6px 6px 0 0',
                  transition: 'background-color 0.3s ease',
                  marginRight: '2px'
                }}
              >
                <FaTable style={{ marginRight: '5px' }} /> Payment Days
              </button>
              <button
                onClick={() => setActiveTab('earnings-deductions')}
                style={{
                  padding: '12px 20px',
                  backgroundColor: activeTab === 'earnings-deductions' ? 'rgb(52, 152, 219)' : 'transparent',
                  color: activeTab === 'earnings-deductions' ? 'white' : '#2c3e50',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'earnings-deductions' ? 'bold' : 'normal',
                  borderRadius: '6px 6px 0 0',
                  transition: 'background-color 0.3s ease',
                  marginRight: '2px'
                }}
              >
                Earnings
              </button>
              <button
                onClick={() => setActiveTab('bank-details')}
                style={{
                  padding: '12px 20px',
                  backgroundColor: activeTab === 'bank-details' ? 'rgb(52, 152, 219)' : 'transparent',
                  color: activeTab === 'bank-details' ? 'white' : '#2c3e50',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'bank-details' ? 'bold' : 'normal',
                  borderRadius: '6px 6px 0 0',
                  transition: 'background-color 0.3s ease',
                  marginRight: '2px'
                }}
              >
                <FaUniversity style={{ marginRight: '5px' }} /> Bank Details
              </button>
              <button
                onClick={() => setActiveTab('net-pay')}
                style={{
                  padding: '12px 20px',
                  backgroundColor: activeTab === 'net-pay' ? 'rgb(52, 152, 219)' : 'transparent',
                  color: activeTab === 'net-pay' ? 'white' : '#2c3e50',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'net-pay' ? 'bold' : 'normal',
                  borderRadius: '6px 6px 0 0',
                  transition: 'background-color 0.3s ease'
                }}
              >
                <FaMoneyBillWave style={{ marginRight: '5px' }} /> Net Pay
              </button>
            </div>
            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                  <h2 style={{ color: '#2c3e50', marginBottom: '8px' }}>Salary Slip</h2>
                  <p style={{ fontSize: '1.3rem', color: 'rgb(52, 152, 219)' }}>
                    {selectedEmployee.name} - {selectedMonth}
                  </p>
                </div>
                {/* Employee Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                    <h3 style={{ color: '#2c3e50', marginBottom: '12px' }}><FaUser /> Employee Details</h3>
                    <p><strong>ID:</strong> {selectedEmployee.employeeId}</p>
                    <p><strong>Type:</strong> {selectedEmployee.employeeType}</p>
                    <p><strong>Email:</strong> {selectedEmployee.email}</p>
                    <p><strong>Phone:</strong> {selectedEmployee.phoneNumber}</p>
                    <p><strong>Gross Salary (Monthly):</strong> {currency}{attendanceSummary.grossSalary.toFixed(2)}</p>
                  </div>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                    <h3 style={{ color: '#2c3e50', marginBottom: '12px' }}>Attendance Summary</h3>
                    <p><strong>Effective Working Days:</strong> {effectiveWorkingDays}</p>
                    {applyCompanyLeaves && <p><strong>Company Leaves:</strong> {companyLeaveCount}</p>}
                    <p><strong>Full Days:</strong> {attendanceSummary.fullCount}</p>
                    <p><strong>Off Days:</strong> {attendanceSummary.offCount}</p>
                    <p><strong>Leave Without Pay:</strong> {attendanceSummary.leaveWithoutPay}</p>
                    <p><strong>Absent:</strong> {attendanceSummary.absentCount}</p>
                    <p><strong>Payment Days:</strong> {attendanceSummary.paymentDays}</p>
                  </div>
                </div>
                {/* Net Pay - Moved up for emphasis */}
                <div style={{ textAlign: 'center', marginBottom: '25px', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ color: '#27ae60', fontSize: '1.8rem' }}>
                    Net Payable: {currency}{netPay.toFixed(2)}
                  </h3>
                  <p style={{ fontSize: '1.1rem', color: '#7f8c8d' }}>
                    Gross Year To Date: {currency}{grossYearToDate.toFixed(2)}
                  </p>
                </div>
              </>
            )}
            {/* Details Tab */}
            {activeTab === 'details' && employeeDetails && (
              <div>
                <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Employee Information</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #dee2e6' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '1rem', width: '30%', backgroundColor: '#e9ecef' }}>Employee ID</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '1rem' }}>{employeeDetails.employeeId}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '1rem', backgroundColor: '#e9ecef' }}>Employee Name</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '1rem' }}>{employeeDetails.employeeName}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '1rem', backgroundColor: '#e9ecef' }}>Company</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '1rem' }}>{employeeDetails.company}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '1rem', backgroundColor: '#e9ecef' }}>Designation</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '1rem' }}>{employeeDetails.designation}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '1rem', backgroundColor: '#e9ecef' }}>Posting Date</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '1rem' }}>{employeeDetails.postingDate}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '1rem', backgroundColor: '#e9ecef' }}>Status</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '1rem' }}>{employeeDetails.status}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '1rem', backgroundColor: '#e9ecef' }}>Currency</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '1rem' }}>{employeeDetails.currency}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Payment Days Tab */}
            {activeTab === 'payment-days' && (
              <div>
                <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Payment Days Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                    <h4 style={{ color: '#34495e', marginBottom: '15px' }}>Working Days Overview</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '1rem' }}>Total Working Days:</label>
                        <input
                          type="number"
                          value={totalWorkingDays}
                          readOnly
                          style={readonlyInputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '1rem' }}>Company Leaves:</label>
                        <input
                          type="number"
                          value={companyLeaveCount}
                          readOnly
                          style={readonlyInputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '1rem' }}>Effective Working Days:</label>
                        <input
                          type="number"
                          value={effectiveWorkingDays}
                          readOnly
                          style={readonlyInputStyle}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                    <h4 style={{ color: '#34495e', marginBottom: '15px' }}>Attendance Breakdown</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '1rem' }}>Full Days:</label>
                        <input
                          type="number"
                          value={attendanceSummary.fullCount}
                          readOnly
                          style={readonlyInputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '1rem' }}>Off Days:</label>
                        <input
                          type="number"
                          value={attendanceSummary.offCount}
                          readOnly
                          style={readonlyInputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '1rem' }}>Leave Without Pay:</label>
                        <input
                          type="number"
                          value={attendanceSummary.leaveWithoutPay}
                          readOnly
                          style={readonlyInputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '1rem' }}>Absent Days:</label>
                        <input
                          type="number"
                          value={attendanceSummary.absentCount}
                          readOnly
                          style={readonlyInputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', backgroundColor: '#e9ecef', padding: '10px', borderRadius: '6px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '1rem' }}>Payment Days:</label>
                        <input
                          type="number"
                          value={attendanceSummary.paymentDays}
                          readOnly
                          style={{ ...readonlyInputStyle, backgroundColor: 'white', fontWeight: 'bold' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Earnings Tab (Deductions removed) */}
            {activeTab === 'earnings-deductions' && (
              <div>
                <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Earnings</h3>
                {/* Earnings Editable Table */}
                <div style={{ marginBottom: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ color: '#34495e', margin: 0, fontSize: '1.2rem' }}>Earnings</h4>
                    <button
                      onClick={addEarningsRow}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '1rem',
                        transition: 'background-color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#2ecc71'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#27ae60'}
                    >
                      <FaPlus /> Add Row
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #dee2e6' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#e9ecef' }}>
                          <th style={{ padding: '10px', border: '1px solid #dee2e6', fontSize: '1rem' }}>Component</th>
                          <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6', fontSize: '1rem' }}>Amount ({currency})</th>
                          <th style={{ padding: '10px', border: '1px solid #dee2e6', fontSize: '1rem', width: '100px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earnings.map((earning, index) => (
                          <tr key={index}>
                            <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                              <input
                                type="text"
                                value={earning.component}
                                onChange={(e) => updateEarningsComponent(index, e.target.value)}
                                style={inputStyle}
                                onFocus={(e) => e.target.style.borderColor = 'rgb(52, 152, 219)'}
                                onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
                              />
                            </td>
                            <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6' }}>
                              <input
                                type="number"
                                value={earning.amount}
                                onChange={(e) => updateEarningsAmount(index, e.target.value)}
                                step="0.01"
                                style={amountInputStyle}
                                onFocus={(e) => e.target.style.borderColor = 'rgb(52, 152, 219)'}
                                onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
                              />
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                              <button
                                onClick={() => deleteEarningsRow(index)}
                                style={{
                                  backgroundColor: '#e74c3c',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '6px 8px',
                                  cursor: 'pointer',
                                  fontSize: '1rem',
                                  transition: 'background-color 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#c0392b'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#e74c3c'}
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '1.1rem' }}>Gross Pay (Employee Monthly Salary)</td>
                          <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '1.1rem' }}>{currency}{grossPay.toFixed(2)}</td>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6' }}></td>
                        </tr>
                        <tr style={{ backgroundColor: '#d4edda' }}>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '1.1rem' }}>Gross Year To Date ({currency})</td>
                          <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '1.1rem' }}>{currency}{grossYearToDate.toFixed(2)}</td>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6' }}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Totals Section (Deductions removed) */}
                <div style={{ marginBottom: '25px', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                  <h4 style={{ color: '#34495e', marginBottom: '15px', fontSize: '1.2rem' }}>Totals</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontWeight: 'bold', fontSize: '1rem' }}>Gross Pay (Employee Monthly Salary) ({currency})</label>
                      <input
                        type="number"
                        value={grossPay}
                        readOnly
                        style={readonlyInputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontWeight: 'bold', fontSize: '1rem' }}>Gross Year To Date ({currency})</label>
                      <input
                        type="number"
                        value={grossYearToDate}
                        readOnly
                        style={readonlyInputStyle}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Bank Details Tab */}
            {activeTab === 'bank-details' && selectedEmployee && (
              <div>
                <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}><FaUniversity style={{ marginRight: '5px' }} /> Bank Details</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #dee2e6' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '1rem', width: '30%', backgroundColor: '#e9ecef' }}>Bank Name</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '1rem' }}>{selectedEmployee.bankName || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '1rem', backgroundColor: '#e9ecef' }}>Account Holder Name</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '1rem' }}>{selectedEmployee.accountHolderName || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '1rem', backgroundColor: '#e9ecef' }}>Bank Account No</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '1rem' }}>{selectedEmployee.accountNumber || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '1rem', backgroundColor: '#e9ecef' }}>IFSC Code</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '1rem' }}>{selectedEmployee.ifscCode || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* New Net Pay Tab */}
            {activeTab === 'net-pay' && (
              <div>
                <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}><FaCalculator style={{ marginRight: '5px' }} /> Net Pay Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                    <h4 style={{ color: '#34495e', marginBottom: '15px' }}>Net Pay Summary</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '1rem' }}>Net Pay ({currency})</label>
                        <input
                          type="number"
                          value={netPay}
                          readOnly
                          style={readonlyInputStyle}
                        />
                        <small style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>net_pay</small>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '1rem' }}>Year To Date ({currency})</label>
                        <input
                          type="number"
                          value={yearToDate}
                          readOnly
                          style={readonlyInputStyle}
                        />
                        <small style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Total salary booked for this employee from the beginning of the year (payroll period or fiscal year) up to the current salary slip's end date.</small>
                        <small style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>year_to_date</small>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '1rem' }}>Month To Date ({currency})</label>
                        <input
                          type="number"
                          value={monthToDate}
                          readOnly
                          style={readonlyInputStyle}
                        />
                        <small style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Total salary booked for this employee from the beginning of the month up to the current salary slip's end date.</small>
                        <small style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>month_to_date</small>
                      </div>
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                    <h4 style={{ color: '#34495e', marginBottom: '15px' }}>Total in Words</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', backgroundColor: '#e9ecef', padding: '15px', borderRadius: '6px' }}>
                      <label style={{ fontWeight: 'bold', fontSize: '1rem' }}>Total in Words ({currency})</label>
                      <textarea
                        value={totalInWords}
                        readOnly
                        style={{ ...readonlyInputStyle, minHeight: '60px', fontSize: '0.95rem', resize: 'none' }}
                      />
                      <small style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>AED Ten Thousand, Eight Hundred And Thirty Eight and Seventy One Fils only. (Example)</small>
                      <small style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>total_in_words</small>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Actions */}
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '25px' }}>
              <button
                onClick={saveSalarySlip}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '1.1rem',
                  transition: 'background-color 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2ecc71'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#27ae60'}
              >
                <FaSave /> Save Slip
              </button>
              <button
                onClick={generatePDF}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'rgb(52, 152, 219)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '1.1rem',
                  transition: 'background-color 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgb(41, 128, 185)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgb(52, 152, 219)'}
              >
                <FaPrint /> Generate PDF
              </button>
            </div>
          </div>
        ) : selectedEmployee ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}> {/* Styled loading */}
            Loading salary slip...
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px', color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            <FaFileInvoiceDollar style={{ fontSize: '4rem', marginBottom: '15px' }} />
            <p style={{ fontSize: '1.2rem' }}>Select an employee and month to generate salary slip.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalarySlip;