// src/components/Form/salaryslip.jsx (full detailed, no lines missing, with updates for loading from ID, edit mode, prevent re-fetch, navigate after new save, currency in words, all prefill, updated design to match EmployeeList: gradient background, fixed back button, card layout, error/success messages instead of alerts)
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FaCalendarAlt, FaUser, FaSave, FaPrint, FaFileInvoiceDollar, FaArrowLeft, FaTimes, FaCheck } from 'react-icons/fa';

// Field Component for Screen View
const Field = ({ label, value }) => (
  <div className="field-wrapper" style={{ marginBottom: '12px' }}>
    <label className="field-label" style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</label>
    <div className="field-value" style={{
      padding: '8px 12px',
      backgroundColor: '#f3f4f6',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '13px',
      color: '#111827',
      fontWeight: '600',
      minHeight: '20px'
    }}>
      {value || '-'}
    </div>
  </div>
);

const SalarySlip = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const slipId = searchParams.get('id');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('Details');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalWorkingDays, setTotalWorkingDays] = useState(30);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [companyName, setCompanyName] = useState('My Company');
  const [currency, setCurrency] = useState('₹');
  const [designation, setDesignation] = useState('');
  const [modeOfPayment, setModeOfPayment] = useState('Bank Transfer');
  const [letterHead, setLetterHead] = useState('Kyle');
  const [postingDate, setPostingDate] = useState('');
  const [salaryStructure, setSalaryStructure] = useState('Kyle New');
  const [payrollFrequency, setPayrollFrequency] = useState('Monthly');
  const [status, setStatus] = useState('Submitted');
  const [netPay, setNetPay] = useState(0);
  const [totalInWords, setTotalInWords] = useState('');
  const [grossPay, setGrossPay] = useState(0);
  const [grossYearToDate, setGrossYearToDate] = useState(0);
  const [monthToDate, setMonthToDate] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0.00);
  const [earnings, setEarnings] = useState([]);
  const [leaveWithoutPay, setLeaveWithoutPay] = useState(0);
  const [preventAttendanceFetch, setPreventAttendanceFetch] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Styles - Updated to match EmployeeList design
  const styles = {
    container: {
      minHeight: '100vh',
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
    controlPanel: {
      backgroundColor: '#ffffff',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      marginBottom: '30px',
      border: '1px solid #e5e7eb'
    },
    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    inputGroup: {
      marginBottom: '15px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#4b5563',
      marginBottom: '8px'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: 'white',
      boxSizing: 'border-box'
    },
    buttonPrimary: {
      background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      width: '100%',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)'
    },
    buttonSecondary: {
      background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      width: '100%',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 8px rgba(149, 165, 166, 0.3)'
    },
    salarySlipPaper: {
      backgroundColor: 'white',
      maxWidth: '1000px',
      margin: '0 auto',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
      color: '#111827',
      padding: '40px',
      borderRadius: '8px'
    },
    tabHeader: {
      display: 'flex',
      borderBottom: '1px solid #e5e7eb',
      marginBottom: '30px',
      gap: '30px'
    },
    tabItem: (isActive) => ({
      padding: '10px 0',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      color: isActive ? '#3498db' : '#6b7280',
      borderBottom: isActive ? '2px solid #3498db' : '2px solid transparent',
      transition: 'all 0.2s',
      textTransform: 'uppercase'
    }),
    gridTwo: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '30px',
      marginBottom: '20px'
    },
    paymentDaysGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '15px',
      padding: '20px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      textAlign: 'center',
      border: '1px solid #e5e7eb'
    },
    pdBox: {},
    pdLabel: {
      fontSize: '11px',
      textTransform: 'uppercase',
      color: '#6b7280',
      fontWeight: '700',
      marginBottom: '5px'
    },
    pdValue: {
      fontSize: '18px',
      fontWeight: '800',
      color: '#111827'
    },
    financialsContainer: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '30px'
    },
    finHeader: {
      fontSize: '13px',
      fontWeight: '700',
      textTransform: 'uppercase',
      color: '#374151',
      borderBottom: '2px solid #e5e7eb',
      paddingBottom: '10px',
      marginBottom: '10px'
    },
    finTable: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '13px'
    },
    finRow: {
      borderBottom: '1px solid #f3f4f6'
    },
    finCell: {
      padding: '10px 0',
      color: '#4b5563'
    },
    finCellRight: {
      padding: '10px 0',
      textAlign: 'right',
      fontWeight: '600',
      color: '#111827'
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderTop: '1px solid #e5e7eb',
      fontWeight: '700',
      fontSize: '14px',
      color: '#111827'
    },
    netPaySection: {
      marginTop: '20px',
      padding: '20px',
      backgroundColor: '#eff6ff',
      borderRadius: '8px',
      border: '1px solid #dbeafe'
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
    loadingMsg: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      textAlign: 'center',
      color: '#3498db',
      fontSize: '18px'
    }
  };

  const formatCurrency = (val) => Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Proper number to words conversion for currency
  const numberToWords = (num) => {
    const a = [
      '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
    ];
    const b = [
      '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
    ];

    const inWords = (n) => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
      if (n < 1000) return inWords(Math.floor(n / 100)) + ' hundred' + (n % 100 ? ' and ' + inWords(n % 100) : '');
      if (n < 1000000) return inWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
      if (n < 1000000000) return inWords(Math.floor(n / 1000000)) + ' million' + (n % 1000000 ? ' ' + inWords(n % 1000000) : '');
      return '';
    };

    const [integerPart, decimalPart = '00'] = num.toFixed(2).split('.');
    const integerWords = inWords(Number(integerPart)).replace(/\b(\w+)\s+(hundred|thousand|million)\b/g, '$1 $2').trim();
    const decimalWords = inWords(Number(decimalPart)).trim();

    let currencyName = '';
    switch (currency) {
      case '₹': currencyName = 'Rupees'; break;
      case '$': currencyName = 'Dollars'; break;
      case '€': currencyName = 'Euros'; break;
      case '£': currencyName = 'Pounds'; break;
      case '¥': currencyName = 'Yen'; break;
      case 'A$': currencyName = 'Australian Dollars'; break;
      case 'C$': currencyName = 'Canadian Dollars'; break;
      case 'AED': currencyName = 'Dirhams'; break;
      default: currencyName = `${currency} Units`;
    }

    let decimalName = '';
    switch (currency) {
      case '₹': decimalName = 'Paise'; break;
      case '$':
      case '€':
      case '£':
      case 'A$':
      case 'C$':
      case 'AED': decimalName = 'Cents'; break;
      default: decimalName = 'Cents';
    }

    let words = `${integerWords.charAt(0).toUpperCase() + integerWords.slice(1)} ${currencyName}`;
    if (Number(decimalPart) > 0) {
      words += ` and ${decimalWords} ${decimalName}`;
    }
    words += ' Only';
    return words;
  };

  useEffect(() => {
    const fetchConfig = async () => {
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
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (baseUrl !== undefined) {
      fetchCurrency();
      fetchCompanyName();
      fetchEmployees();
    }
  }, [baseUrl]);

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

  const fetchEmployees = async () => {
    try {
      const url = baseUrl ? `${baseUrl}/api/add-employee` : '/api/add-employee';
      const response = await axios.get(url);
      setEmployees(response.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to fetch employees. Please try again.');
    }
  };

  useEffect(() => {
    if (selectedMonth) {
      const [y, m] = selectedMonth.split('-');
      const lastDayDate = new Date(parseInt(y), parseInt(m), 0);
      setStartDate(`${y}-${m}-01`);
      setEndDate(lastDayDate.toISOString().slice(0, 10));
      setTotalWorkingDays(lastDayDate.getDate());
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedEmployee && selectedMonth && !preventAttendanceFetch) fetchAttendance();
  }, [selectedEmployee, selectedMonth, totalWorkingDays, baseUrl]);

  const fetchAttendance = async () => {
    try {
      const url = baseUrl ? `${baseUrl}/api/attendance?month=${selectedMonth}&employeeId=${selectedEmployee._id}` : `/api/attendance?month=${selectedMonth}&employeeId=${selectedEmployee._id}`;
      const res = await axios.get(url);
      const records = res.data.records || res.data;
      const lwp = records.filter(r => ['Leave Without Pay', 'On Leave'].includes(r.status)).length;
      const absent = records.filter(r => r.status === 'Absent').length;
      const paidDays = totalWorkingDays - lwp - absent;
      setLeaveWithoutPay(lwp);
      const currentGross = earnings.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      setGrossPay(currentGross);
      const dailyRate = totalWorkingDays > 0 ? currentGross / totalWorkingDays : 0;
      const deductionAmount = lwp * dailyRate;
      setTotalDeductions(deductionAmount);
      const net = Math.max(0, currentGross - deductionAmount);
      setNetPay(net);
      setTotalInWords(numberToWords(net));
      setAttendanceSummary({
        fullCount: records.filter(r => ['Full Day', 'Present'].includes(r.status)).length,
        offCount: records.filter(r => ['Off Day', 'WeeklyOff'].includes(r.status)).length,
        leaveWithoutPay: lwp,
        absentCount: absent,
        paymentDays: paidDays,
        dailyRate: dailyRate
      });
      try {
        const yUrl = baseUrl ? `${baseUrl}/api/salary-slip/year-to-date?employeeId=${selectedEmployee._id}&month=${selectedMonth}` : `/api/salary-slip/year-to-date?employeeId=${selectedEmployee._id}&month=${selectedMonth}`;
        const yRes = await axios.get(yUrl);
        setGrossYearToDate(Number(yRes.data.gross_year_to_date || 0));
        setMonthToDate(net);
      } catch { setGrossYearToDate(0); setMonthToDate(0); }
    } catch (e) {
      console.error("Attendance fetch error", e);
      setError('Failed to fetch attendance data.');
    }
  };

  useEffect(() => {
    const loadSlip = async () => {
      if (slipId && employees.length > 0) {
        try {
          const url = baseUrl ? `${baseUrl}/api/salary-slip/${slipId}` : `/api/salary-slip/${slipId}`;
          const res = await axios.get(url);
          const slip = res.data;
          const emp = employees.find(e => e._id === slip.employeeId);
          if (!emp) return;
          setPreventAttendanceFetch(true);
          setSelectedEmployee(emp);
          setSelectedMonth(slip.month);
          setDesignation(slip.designation || '');
          setPostingDate(slip.postingDate || '');
          setModeOfPayment(slip.modeOfPayment || 'Bank Transfer');
          setLetterHead(slip.letterHead || 'Kyle');
          setSalaryStructure(slip.salaryStructure || 'Kyle New');
          setPayrollFrequency(slip.payrollFrequency || 'Monthly');
          setStatus(slip.status || 'Submitted');
          setStartDate(slip.startDate || '');
          setEndDate(slip.endDate || '');
          setEarnings(slip.earnings || []);
          setTotalDeductions(slip.totalDeductions || 0);
          setLeaveWithoutPay(slip.leaveWithoutPay || 0);
          setGrossPay(slip.grossPay || slip.grossSalary || 0);
          setNetPay(slip.netPay || 0);
          setGrossYearToDate(slip.grossYearToDate || 0);
          setMonthToDate(slip.netPay || 0);
          setTotalInWords(numberToWords(slip.netPay || 0));
          setAttendanceSummary({
            fullCount: slip.fullCount || 0,
            offCount: slip.offCount || 0,
            leaveWithoutPay: slip.leaveWithoutPay || 0,
            absentCount: slip.absentCount || 0,
            paymentDays: slip.paymentDays || 0,
            dailyRate: slip.dailyRate || 0
          });
          const [y, m] = slip.month.split('-');
          const lastDayDate = new Date(parseInt(y), parseInt(m), 0);
          setTotalWorkingDays(lastDayDate.getDate());
        } catch (e) {
          console.error("Load slip error", e);
          setError("Failed to load salary slip. Please try again.");
        }
      }
    };
    loadSlip();
  }, [slipId, employees, baseUrl]);

  const handleEmployeeSelect = (e) => {
    const emp = employees.find(x => x._id === e.target.value);
    setSelectedEmployee(emp);
    if (emp && !slipId) {
      setDesignation(emp.employeeDesignation || 'Employee');
      setPostingDate(emp.dateOfJoining || '');
      setEarnings([
        { component: 'Basic', amount: Number(emp.basicSalary) || 0 },
        { component: 'House Rent Allowance', amount: Number(emp.hra) || 0 },
        { component: 'Commuting Expenses', amount: Number(emp.ta) || 0 },
        ...(Number(emp.oa) > 0 ? [{ component: 'Other Allowances', amount: Number(emp.oa) }] : [])
      ]);
    }
  };

  const handleSave = async () => {
    if (!selectedEmployee || !attendanceSummary) {
      setError('Please select an employee and fetch attendance.');
      setMessage('');
      return;
    }
    try {
      setError('');
      setMessage('');
      const payload = {
        employeeId: selectedEmployee._id,
        month: selectedMonth,
        grossSalary: grossPay,
        totalSalary: grossPay,
        netPay: netPay,
        grossPay: grossPay,
        grossYearToDate: grossYearToDate,
        totalDeductions: totalDeductions,
        fullCount: attendanceSummary.fullCount,
        offCount: attendanceSummary.offCount,
        leaveWithoutPay: leaveWithoutPay,
        absentCount: attendanceSummary.absentCount,
        paymentDays: attendanceSummary.paymentDays,
        dailyRate: attendanceSummary.dailyRate,
        designation, postingDate, payrollFrequency,
        startDate, endDate, salaryStructure,
        modeOfPayment, letterHead, status,
        earnings,
        deductions: [{ component: 'Leave Without Pay', amount: totalDeductions }]
      };
      let url, method;
      if (slipId) {
        url = baseUrl ? `${baseUrl}/api/salary-slip/${slipId}` : `/api/salary-slip/${slipId}`;
        method = 'put';
        await axios({ method: method.toLowerCase(), url, data: payload });
        setMessage("Salary Slip Updated Successfully!");
      } else {
        url = baseUrl ? `${baseUrl}/api/salary-slip` : `/api/salary-slip`;
        method = 'post';
        await axios.post(url, payload);
        setMessage("Salary Slip Saved Successfully!");
        navigate('/salary-receipt-list', { state: { fromSave: true } });
      }
    } catch (err) {
      setError("Error saving: " + (err.response?.data?.error || err.message));
      setMessage('');
    }
  };

  const handlePrint = () => window.print();

  const tabs = ['Details', 'Payment Days', 'Earnings & Deductions', 'Net Pay Info', 'Bank Details'];

  if (!employees.length) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingMsg}>
          <FaFileInvoiceDollar style={{ fontSize: '48px', marginBottom: '20px', color: '#3498db' }} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button
        onClick={() => navigate('/salary-receipt-list')}
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
      >
        <FaArrowLeft /> Back to Salary Receipts
      </button>
      <div style={styles.mainCard}>
        <div style={styles.header}>
          <div></div>
          <h2 style={styles.title}>
            <FaFileInvoiceDollar style={{ color: '#3498db', fontSize: '2rem' }} />
            {slipId ? 'Edit' : 'New'} Salary Slip
          </h2>
          <div></div>
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
        <div style={styles.controlPanel}>
          <div style={styles.headerRow}></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '20px', alignItems: 'end' }}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Month</label>
              <input
                type="month"
                style={styles.input}
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                disabled={!!slipId}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Employee</label>
              <select
                style={styles.select}
                value={selectedEmployee?._id || ''}
                onChange={handleEmployeeSelect}
                disabled={!!slipId}
              >
                <option value="">-- Select --</option>
                {employees.map(e => (
                  <option key={e._id} value={e._id}>
                    {e.name} ({e.employeeId})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', height: '100%' }}>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <button style={styles.buttonPrimary} onClick={handleSave}>
                  <FaSave /> {slipId ? 'Update' : 'Save'} Record
                </button>
              </div>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <button style={styles.buttonSecondary} onClick={handlePrint}>
                  <FaPrint /> Print Slip
                </button>
              </div>
            </div>
          </div>
        </div>
        {selectedEmployee && attendanceSummary && (
          <div style={styles.salarySlipPaper}>
            <style>{`
              @media print {
                  .print-hidden, .controlPanel { display: none !important; }
                  body, .salary-slip-container {
                      background: white !important; margin: 0 !important; size: A4;
                      width: 100% !important; max-width: 100% !important; box-shadow: none !important;
                  }
                  .tab-content { display: none !important; }
                  .print-layout-container {
                      display: block !important;
                      font-family: 'Times New Roman', serif;
                      color: #000;
                      padding: 20px;
                  }
                  .print-header { text-align: center; margin-bottom: 20px; }
                  .print-header h1 { font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; }
                  .print-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 20px; }
                  .print-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
                  .print-row strong { font-weight: bold; }
                  .print-section-header {
                      font-weight: bold;
                      text-transform: uppercase;
                      border-bottom: 2px solid #000;
                      margin-top: 20px;
                      margin-bottom: 10px;
                      font-size: 14px;
                  }
                  .print-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
                  .print-table th { text-align: left; border-bottom: 1px solid #000; padding: 5px 0; font-weight: bold; }
                  .print-table td { padding: 5px 0; border-bottom: 1px solid #ddd; }
                  .text-right { text-align: right; }
                  .print-totals-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
              }
            `}</style>
            <div className="tab-header-row print-hidden" style={styles.tabHeader}>
              {tabs.map(tab => (
                <div
                  key={tab}
                  style={styles.tabItem(activeTab === tab)}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </div>
              ))}
            </div>
            <div className="tab-content" style={activeTab === 'Details' ? {} : { display: 'none' }}>
              <div style={styles.gridTwo}>
                <div>
                  <Field label="Employee" value={`${selectedEmployee.employeeId}: ${selectedEmployee.name}`} />
                  <Field label="Company" value={companyName} />
                  <Field label="Designation" value={designation} />
                  <Field label="Posting Date" value={postingDate} />
                  <Field label="Letter Head" value={letterHead} />
                </div>
                <div>
                  <Field label="Payroll Frequency" value={payrollFrequency} />
                  <Field label="Start Date" value={startDate} />
                  <Field label="End Date" value={endDate} />
                  <Field label="Salary Structure" value={salaryStructure} />
                  <Field label="Mode Of Payment" value={modeOfPayment} />
                </div>
              </div>
            </div>
            <div className="tab-content" style={activeTab === 'Payment Days' ? {} : { display: 'none' }}>
              <div style={styles.paymentDaysGrid}>
                <div style={styles.pdBox}>
                  <div style={styles.pdLabel}>Working Days</div>
                  <div style={styles.pdValue}>{totalWorkingDays}</div>
                </div>
                <div style={styles.pdBox}>
                  <div style={styles.pdLabel}>Leave Without Pay</div>
                  <div style={{ ...styles.pdValue, color: '#dc2626' }}>{leaveWithoutPay}</div>
                </div>
                <div style={styles.pdBox}>
                  <div style={styles.pdLabel}>Absent Days</div>
                  <div style={{ ...styles.pdValue, color: '#dc2626' }}>{attendanceSummary.absentCount}</div>
                </div>
                <div style={styles.pdBox}>
                  <div style={styles.pdLabel}>Payment Days</div>
                  <div style={{ ...styles.pdValue, color: '#059669' }}>{attendanceSummary.paymentDays}</div>
                </div>
              </div>
            </div>
            <div className="tab-content" style={activeTab === 'Earnings & Deductions' ? {} : { display: 'none' }}>
              <div style={styles.financialsContainer}>
                <div>
                  <div style={styles.finHeader}>Earnings</div>
                  <table style={styles.finTable}>
                    <tbody>
                      {earnings.map((item, i) => (
                        <tr key={i} style={styles.finRow}>
                          <td style={styles.finCell}>{item.component}</td>
                          <td style={styles.finCellRight}>{currency} {formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <div style={styles.finHeader}>Deductions</div>
                  <table style={styles.finTable}>
                    <tbody>
                      {totalDeductions > 0 ? (
                        <tr style={styles.finRow}>
                          <td style={{ ...styles.finCell, color: '#dc2626' }}>Leave Without Pay</td>
                          <td style={{ ...styles.finCellRight, color: '#dc2626' }}>{currency} {formatCurrency(totalDeductions)}</td>
                        </tr>
                      ) : (
                        <tr><td colSpan="2">No Deductions</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="tab-content" style={activeTab === 'Net Pay Info' ? {} : { display: 'none' }}>
              <div style={styles.gridTwo}>
                <div>
                  <div style={styles.totalRow}>
                    <span>Gross Pay</span>
                    <span>{currency} {formatCurrency(grossPay)}</span>
                  </div>
                  <div style={styles.totalRow}>
                    <span>Gross YTD</span>
                    <span>{currency} {formatCurrency(grossYearToDate)}</span>
                  </div>
                  <div style={styles.totalRow}>
                    <span style={{ color: '#dc2626' }}>Total Deduction</span>
                    <span style={{ color: '#dc2626' }}>{currency} {formatCurrency(totalDeductions)}</span>
                  </div>
                </div>
                <div style={styles.netPaySection}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', textAlign: 'center' }}>Net Pay</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', textAlign: 'center', margin: '10px 0' }}>
                    {currency} {formatCurrency(netPay)}
                  </div>
                  <div style={{ fontStyle: 'italic', textAlign: 'center', color: '#6b7280' }}>{totalInWords}</div>
                </div>
              </div>
            </div>
            <div className="tab-content" style={activeTab === 'Bank Details' ? {} : { display: 'none' }}>
              <div style={styles.gridTwo}>
                <Field label="Bank Name" value={selectedEmployee.bankName} />
                <Field label="Bank Account No" value={selectedEmployee.accountNumber} />
              </div>
            </div>
            <div className="print-layout-container" style={{ display: 'none' }}>
              <div className="print-header">
                <h1>{companyName}</h1>
                <div style={{ fontSize: '12px', letterSpacing: '1px' }}>SALARY SLIP FOR {selectedMonth}</div>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>Sal Slip/{selectedEmployee.employeeId}/00007</div>
              </div>
              <div className="print-section-header">Employee & Payroll Details</div>
              <div className="print-grid-2">
                <div>
                  <div className="print-row"><strong>Employee:</strong> <span>{selectedEmployee.employeeId}</span></div>
                  <div className="print-row"><strong>Employee Name:</strong> <span>{selectedEmployee.name}</span></div>
                  <div className="print-row"><strong>Company:</strong> <span>{companyName}</span></div>
                  <div className="print-row"><strong>Designation:</strong> <span>{designation}</span></div>
                  <div className="print-row"><strong>Posting Date:</strong> <span>{postingDate}</span></div>
                  <div className="print-row"><strong>Status:</strong> <span>{status}</span></div>
                  <div className="print-row"><strong>Currency:</strong> <span>{currency}</span></div>
                </div>
                <div>
                  <div className="print-row"><strong>Payroll Frequency:</strong> <span>{payrollFrequency}</span></div>
                  <div className="print-row"><strong>Start Date:</strong> <span>{startDate}</span></div>
                  <div className="print-row"><strong>End Date:</strong> <span>{endDate}</span></div>
                  <div className="print-row"><strong>Salary Structure:</strong> <span>{salaryStructure}</span></div>
                  <div className="print-row"><strong>Mode Of Payment:</strong> <span>{modeOfPayment}</span></div>
                </div>
              </div>
              <div className="print-section-header">Payment Days</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '13px' }}>
                <div><strong>Working Days:</strong> {totalWorkingDays}</div>
                <div><strong>Unmarked days:</strong> 0</div>
                <div><strong>Leave Without Pay:</strong> {leaveWithoutPay}</div>
                <div><strong>Absent Days:</strong> {attendanceSummary.absentCount}</div>
                <div><strong>Payment Days:</strong> {attendanceSummary.paymentDays}</div>
              </div>
              <div className="print-section-header">Earnings & Deductions</div>
              <div className="print-grid-2" style={{ gap: '10px' }}>
                <table className="print-table">
                  <thead><tr><th>Sr</th><th>Component</th><th className="text-right">Amount</th><th className="text-right">Year To Date</th><th>Tax Flex</th><th>Tax Add</th></tr></thead>
                  <tbody>
                    {earnings.map((e, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{e.component}</td>
                        <td className="text-right">{currency} {formatCurrency(e.amount)}</td>
                        <td className="text-right">{currency} 0.00</td>
                        <td>{currency} 0.00</td>
                        <td>{currency} 0.00</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table className="print-table">
                  <thead><tr><th>Sr</th><th>Component</th><th className="text-right">Amount</th><th className="text-right">Year To Date</th><th>Tax Flex</th><th>Tax Add</th></tr></thead>
                  <tbody>
                    {totalDeductions > 0 ? (
                      <tr>
                        <td>1</td>
                        <td>Leave Without Pay</td>
                        <td className="text-right">{currency} {formatCurrency(totalDeductions)}</td>
                        <td className="text-right">{currency} 0.00</td>
                        <td>{currency} 0.00</td>
                        <td>{currency} 0.00</td>
                      </tr>
                    ) : (
                      <tr><td colSpan="6">No Deductions</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="print-section-header">Totals</div>
              <div className="print-grid-2">
                <div>
                  <div className="print-totals-row"><strong>Gross Pay:</strong> <span>{currency} {formatCurrency(grossPay)}</span></div>
                  <div className="print-totals-row"><strong>Gross Pay (Company Currency):</strong> <span>{currency} {formatCurrency(grossPay)}</span></div>
                  <div className="print-totals-row"><strong>Gross Year To Date:</strong> <span>{currency} {formatCurrency(grossYearToDate)}</span></div>
                  <div className="print-totals-row"><strong>Gross Year To Date (Company Currency):</strong> <span>{currency} 0.00</span></div>
                  <div className="print-totals-row" style={{ color: 'red' }}><strong>Total Deduction:</strong> <span style={{ color: 'red' }}>{currency} {formatCurrency(totalDeductions)}</span></div>
                  <div className="print-totals-row" style={{ color: 'red' }}><strong>Total Deduction (Company Currency):</strong> <span style={{ color: 'red' }}>{currency} {formatCurrency(totalDeductions)}</span></div>
                  <div className="print-totals-row" style={{ marginTop: '10px', fontSize: '15px' }}><strong>Net Pay:</strong> <span>{currency} {formatCurrency(netPay)}</span></div>
                  <div className="print-totals-row" style={{ fontSize: '15px' }}><strong>Net Pay (Company Currency):</strong> <span>{currency} {formatCurrency(netPay)}</span></div>
                  <div className="print-totals-row"><strong>Rounded Total (Company Currency):</strong> <span>{currency} {Math.round(netPay).toFixed(2)}</span></div>
                  <div className="print-totals-row"><strong>Year To Date:</strong> <span>{currency} {formatCurrency(grossYearToDate)}</span></div>
                  <div className="print-totals-row"><strong>Year To Date (Company Currency):</strong> <span>{currency} 0.00</span></div>
                  <div className="print-totals-row"><strong>Month To Date:</strong> <span>{currency} {formatCurrency(monthToDate)}</span></div>
                  <div className="print-totals-row"><strong>Month To Date (Company Currency):</strong> <span>{currency} 0.00</span></div>
                  <div style={{ marginTop: '15px', fontStyle: 'italic', fontSize: '13px', fontWeight: 'bold' }}>Total in words: <br />{totalInWords}</div>
                  <div style={{ marginTop: '5px', fontStyle: 'italic', fontSize: '13px', fontWeight: 'bold' }}>Total in words (Company Currency): <br />{totalInWords}</div>
                </div>
              </div>
              <div className="print-section-header">Bank Details</div>
              <div style={{ display: 'flex', gap: '50px' }}>
                <div><strong>Bank Name:</strong> {selectedEmployee.bankName}</div>
                <div><strong>Bank Account No:</strong> {selectedEmployee.accountNumber}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalarySlip;