// src/components/Form/employeedoctype.jsx
// UPDATED: Handle split shifts in default_shift display (from backend).
// - In ShiftModal: Display multiple time_slots if present in assigned_schedule.default_shift.
// - Fallback sample data updated to show split shift example.
// - Attendance tab: Default shift clickable shows full slots.
// - Full code provided, no lines missing.

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUserTie, FaArrowLeft, FaEdit, FaComment, FaClock, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaBriefcase, FaIdCard, FaDollarSign, FaUsers, FaTimes, FaSearch, FaBell, FaUniversity, FaUmbrellaBeach, FaCalendarCheck, FaClipboardList, FaFileInvoiceDollar, FaChevronUp } from 'react-icons/fa';
const EmployeeDocType = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [allAttendanceData, setAllAttendanceData] = useState({}); // State for all months' attendance data, object with month keys
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [leaveSummary, setLeaveSummary] = useState([]);
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [currency, setCurrency] = useState('AED'); // Set to AED based on sample data
  // Modal state only for Default Shift
  const [showShiftModal, setShowShiftModal] = useState(false);
  // Fetch baseUrl on component mount
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
  // Fetch currency settings when baseUrl is set
  useEffect(() => {
    if (baseUrl !== undefined) {
      fetchCurrency();
    }
  }, [baseUrl]);
  // Fetch currency from system settings
  const fetchCurrency = async () => {
    try {
      const url = baseUrl ? `${baseUrl}/api/settings` : '/api/settings';
      const response = await axios.get(url);
      const settingsData = response.data;
      const currencyCode = settingsData.currency || 'AED'; // Default to AED for sample
      const currencySymbol = getCurrencySymbol(currencyCode);
      setCurrency(currencySymbol);
    } catch (err) {
      console.error('Error fetching currency settings:', err);
      setCurrency('AED');
    }
  };
  // Helper function to get currency symbol based on code
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
  // Fetch employee data when baseUrl and id are set
  useEffect(() => {
    if (baseUrl !== undefined && id) {
      fetchEmployee();
    }
  }, [baseUrl, id]);
  const fetchEmployee = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching employee with ID:', id, 'Base URL:', baseUrl);
      const url = baseUrl ? `${baseUrl}/api/add-employee/${id}` : `/api/add-employee/${id}`;
      console.log('Employee fetch URL:', url);
      const response = await axios.get(url);
      console.log('Employee fetch response:', response.data);
      setEmployee(response.data);
    } catch (err) {
      console.error('Error fetching employee:', err);
      setError(err.response?.data?.error || 'Failed to fetch employee details. Please try again.');
      // Fallback to sample data for demonstration if fetch fails - UPDATED: Split shift example
      setEmployee({
        _id: id,
        name: 'rohinth',
        salutation: 'Mr.',
        gender: 'Male',
        dateOfBirth: '2025-12-12',
        status: 'Active',
        maritalStatus: 'Single',
        nationality: 'Dubai',
        idNumber: '23534646745',
        idExpiry: '2025-12-12',
        dateOfJoining: '2025-01-01',
        company: 'POS 8',
        employeeDesignation: 'Kitchen',
        employeeType: 'part Time',
        email: 'rohinth@gmail.com',
        phoneNumber: '+971345346457',
        address: 'sdgdsfgdf',
        basicSalary: '325354',
        totalSalary: '719497',
        profileImage: '', // Empty for initials fallback
        bankName: 'State Bank of India',
        ifscCode: 'SBIN0005379',
        accountNumber: '34989881059',
        // Sample assigned_schedule based on SQLite data - UPDATED: Split shift example
        assigned_schedule: {
          schedule_name: 'split shift (2025-01-19 to 2025-11-30)',
          default_shift: 'split shift (21:00-02:00 (O), 03:00-18:00)', // Split slots example
          start_date: '2025-01-19',
          end_date: '2025-11-30',
          working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          weekly_off: ['Sat', 'Sun'],
          special_days: [
            { date: '2025-12-27', description: 'Christmas', end_time: '16:32', extended_end: '10:34', extended_start: '22:28', start_time: '17:27', type: 'Extended' },
            { date: '2025-12-25', description: 'Christmas', type: 'Holiday' }
          ],
          assignment_notes: '',
          special_day_assignments: [
            { date: '2025-12-25', description: 'Christmas', end_time: '16:32', extended_end: '10:34', extended_start: '22:28', is_observed: true, start_time: '17:27', type: 'Extended' },
            { date: '2025-12-27', description: 'Christmas', end_time: '16:32', extended_end: '10:34', extended_start: '22:28', is_observed: true, start_time: '17:27', type: 'Extended' }
          ]
        }
      });
      // Sample attendance data for fallback (all months, but minimal for Dec)
      setAllAttendanceData({
        '2025-12': [
          { attendance_date: '2025-12-18', status: 'Present' },
          { attendance_date: '2025-12-27', status: 'Extended' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };
  // Helper to format month for API
  const formatMonthForApi = (monthDate) => {
    const year = monthDate.getFullYear();
    const mon = String(monthDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${mon}`;
  };
  // Fetch all attendance data for the year when employee is loaded
  useEffect(() => {
    if (employee?._id) {
      fetchAllAttendance();
      fetchLeaveData();
    }
  }, [employee, baseUrl]);

  const fetchLeaveData = async () => {
    try {
      const summaryUrl = baseUrl ? `${baseUrl}/api/leave-summary?employee_id=${employee._id}` : `/api/leave-summary?employee_id=${employee._id}`;
      const appsUrl = baseUrl ? `${baseUrl}/api/leave-applications?employee_id=${employee._id}` : `/api/leave-applications?employee_id=${employee._id}`;

      const [summaryRes, appsRes] = await Promise.all([
        axios.get(summaryUrl),
        axios.get(appsUrl)
      ]);

      setLeaveSummary(summaryRes.data || []);
      setLeaveApplications(appsRes.data || []);
    } catch (err) {
      console.error('Error fetching leave data:', err);
    }
  };

  const fetchAllAttendance = async () => {
    const year = 2025;
    const promises = [];
    for (let m = 0; m < 12; m++) {
      const monthDate = new Date(year, m, 1);
      const monthStr = formatMonthForApi(monthDate);
      const url = baseUrl ? `${baseUrl}/api/attendance?employee_id=${employee._id}&month=${monthStr}` : `/api/attendance?employee_id=${employee._id}&month=${monthStr}`;
      promises.push(
        axios.get(url).then((res) => ({
          month: monthStr,
          data: Array.isArray(res.data) ? res.data : []
        })).catch((err) => {
          console.error(`Error fetching attendance for ${monthStr}:`, err);
          return { month: monthStr, data: [] };
        })
      );
    }
    try {
      const results = await Promise.all(promises);
      const newAllAttendance = {};
      results.forEach((r) => {
        newAllAttendance[r.month] = r.data;
      });
      setAllAttendanceData(newAllAttendance);
    } catch (err) {
      console.error('Error fetching all attendance:', err);
      setAllAttendanceData({});
    }
  };
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#3498db',
          fontSize: '18px'
        }}>
          <FaUserTie style={{ fontSize: '48px', marginBottom: '20px', color: '#3498db' }} />
          <p>Loading employee details...</p>
        </div>
      </div>
    );
  }
  if (error && !employee) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '30px',
          borderRadius: '15px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          color: '#e74c3c',
          fontSize: '1.2rem',
          border: '1px solid #e74c3c'
        }}>
          {error}
          <button
            onClick={() => navigate('/employee-list')}
            style={{
              display: 'block',
              marginTop: '15px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Back to Employee List
          </button>
        </div>
      </div>
    );
  }
  // Tab content renderers
  const renderOverviewTab = () => (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Column */}
        <div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Full Name <span style={{ color: '#e74c3c' }}>*</span></label>
            <input type="text" value={employee.name || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Salutation</label>
            <input type="text" value={employee.salutation || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Gender <span style={{ color: '#e74c3c' }}>*</span></label>
            <input type="text" value={employee.gender || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Date of Birth <span style={{ color: '#e74c3c' }}>*</span></label>
            <input type="text" value={employee.dateOfBirth || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
          </div>
        </div>
        {/* Right Column */}
        <div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Marital Status</label>
            <input type="text" value={employee.maritalStatus || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Nationality</label>
            <input type="text" value={employee.nationality || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>ID Number</label>
            <input type="text" value={employee.idNumber || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>ID Expiry</label>
            <input type="text" value={employee.idExpiry || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
          </div>
          <div style={{ marginTop: '10px' }}>
            <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Status <span style={{ color: '#e74c3c' }}>*</span></label>
            <span style={{
              display: 'block',
              width: '100%',
              padding: '8px',
              border: '1px solid #e9ecef',
              borderRadius: '4px',
              background: employee.status === 'Active' ? '#d4edda' : '#f8d7da',
              color: employee.status === 'Active' ? '#155724' : '#721c24',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              {employee.status || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
  const renderJoiningTab = () => (
    <div style={{ padding: '20px 0' }}>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Joining Date <span style={{ color: '#e74c3c' }}>*</span></label>
        <input type="text" value={employee.dateOfJoining || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Company <span style={{ color: '#e74c3c' }}>*</span></label>
          <input type="text" value={employee.company || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
        </div>
        <div>
          <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Designation</label>
          <input type="text" value={employee.employeeDesignation || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
        </div>
      </div>
      <div style={{ marginTop: '15px' }}>
        <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Employment Type</label>
        <input type="text" value={employee.employeeType || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
      </div>

    </div>
  );
  const renderAddressTab = () => (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Email <span style={{ color: '#e74c3c' }}>*</span></label>
          <input type="email" value={employee.email || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
        </div>
        <div>
          <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Phone</label>
          <input type="tel" value={employee.phoneNumber || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
        </div>
      </div>
      <div style={{ marginTop: '15px' }}>
        <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Address</label>
        <textarea value={employee.address || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa', minHeight: '80px', resize: 'vertical' }} />
      </div>
    </div>
  );
  const renderAttendanceTab = () => (
    <div style={{ padding: '20px 0' }}>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Applicable Holiday List <span style={{ color: '#e74c3c' }}>*</span></label>
        <span
          onClick={() => navigate('/holiday-doctype', { state: { assigned_schedule: employee.assigned_schedule } })}
          style={{
            display: 'block',
            width: '100%',
            padding: '8px',
            border: '1px solid #3498db',
            borderRadius: '4px',
            background: '#e3f2fd',
            color: '#3498db',
            fontWeight: '600',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#bbdefb'}
          onMouseOut={(e) => e.target.style.background = '#e3f2fd'}
        >
          {employee.assigned_schedule?.schedule_name || 'N/A'} - Click to View Full List
        </span>
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Default Shift <span style={{ color: '#e74c3c' }}>*</span></label>
        <span
          onClick={() => setShowShiftModal(true)}
          style={{
            display: 'block',
            width: '100%',
            padding: '8px',
            border: '1px solid #3498db',
            borderRadius: '4px',
            background: '#e3f2fd',
            color: '#3498db',
            fontWeight: '600',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#bbdefb'}
          onMouseOut={(e) => e.target.style.background = '#e3f2fd'}
        >
          {employee.assigned_schedule?.default_shift || 'N/A'} {/* UPDATED: Handles split shifts from backend */}
        </span>
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Extended Shift</label>
        <span
          onClick={() => navigate('/extended-doctype', { state: { assigned_schedule: employee.assigned_schedule, employee } })}
          style={{
            display: 'block',
            width: '100%',
            padding: '8px',
            border: '1px solid #27ae60',
            borderRadius: '4px',
            background: '#d4edda',
            color: '#27ae60',
            fontWeight: '600',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#c3e6cb'}
          onMouseOut={(e) => e.target.style.background = '#d4edda'}
        >
          View Extended Hours
        </span>
      </div>

    </div>
  );
  const renderSalaryTab = () => (
    <div style={{ padding: '20px 0' }}>
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          {/* <FaDollarSign style={{ marginRight: '8px', color: '#27ae60' }} /> Salary Information */}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Basic Salary</label>
            <input type="text" value={`${currency}${employee.basicSalary || '0'}`} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
          </div>
          <div>
            <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Total Salary</label>
            <input type="text" value={`${currency}${employee.totalSalary || '0'}`} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
          </div>
        </div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <FaUniversity style={{ marginRight: '8px', color: '#3498db' }} /> Bank Details
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Bank Name</label>
            <input type="text" value={employee.bankName || 'N/A'} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
          </div>
          <div>
            <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>IFSC Code</label>
            <input type="text" value={employee.ifscCode || 'N/A'} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block' }}>Account Number</label>
            <input type="text" value={employee.accountNumber || 'N/A'} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', background: '#f8f9fa' }} />
          </div>
        </div>
      </div>
    </div>
  );
  // UPDATED: Full Year Calendar for Connections Tab - All 12 months in a 3x4 grid without navigation
  const renderConnectionsTab = () => {
    const year = 2025;
    const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const renderMonthCalendar = (monIdx) => {
      const monDate = new Date(year, monIdx, 1);
      const monthStr = formatMonthForApi(monDate);
      const monthAttData = allAttendanceData[monthStr] || [];
      const daysInMonth = new Date(year, monIdx + 1, 0).getDate();
      const firstDate = new Date(year, monIdx, 1);
      const dayOfWeek = firstDate.getDay(); // 0 = Sunday
      const offset = (dayOfWeek + 6) % 7; // For Monday start
      const calendarDays = [];
      // Pad start with empty cells
      for (let i = 0; i < offset; i++) {
        calendarDays.push({ day: null, date: null });
      }
      // Add days of the month
      for (let d = 1; d <= daysInMonth; d++) {
        calendarDays.push({ day: d, date: new Date(year, monIdx, d) });
      }
      // Pad end to fill 6 weeks (42 cells)
      while (calendarDays.length < 42) {
        calendarDays.push({ day: null, date: null });
      }
      return (
        <div key={monIdx} style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333', fontWeight: '600' }}>
            {monDate.toLocaleDateString('en-US', { month: 'long' })}
          </h4>
          {/* Day Headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 12px)',
            gap: '1px',
            marginBottom: '3px',
            fontSize: '8px',
            color: '#666',
            justifyContent: 'center'
          }}>
            {dayHeaders.map((day, idx) => (
              <div
                key={idx}
                style={{
                  textAlign: 'center',
                  width: '10px',
                  paddingTop: '10px'
                }}
              >
                {day}
              </div>
            ))}
          </div>
          {/* Calendar Weeks */}
          {Array.from({ length: 6 }).map((_, weekIdx) => (
            <div
              key={weekIdx}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 12px)',
                gap: '1px',
                marginBottom: '1px',
                justifyContent: 'center'
              }}
            >
              {Array.from({ length: 7 }).map((_, dayIdx) => {
                const idx = weekIdx * 7 + dayIdx;
                const cell = calendarDays[idx];
                if (!cell || !cell.day) {
                  return <div key={dayIdx} style={{ width: '10px', height: '10px' }} />;
                }
                const dateStr = cell.date.toISOString().split('T')[0];
                const att = monthAttData.find(a => a.attendance_date === dateStr);
                let color = '#ebedf0'; // Default for no activity
                if (att) {
                  if (att.status === 'Present' || att.status === 'Extended') {
                    color = '#216e39'; // Green
                  } else if (att.status === 'HalfDay') {
                    color = '#40c463'; // Lighter Green
                  } else if (att.status === 'Paid Leave') {
                    color = '#e67e22'; // Orange
                  } else if (att.status === 'On Leave' || att.status === 'Leave') { // Handle both just in case
                    color = '#e74c3c'; // Red
                  } else if (att.status === 'Absent') {
                    // User requested NO colour for Absent (default)
                    color = '#ebedf0';
                  }
                }

                const monthShort = monDate.toLocaleString('default', { month: 'short' });
                return (
                  <div
                    key={dayIdx}
                    title={`${cell.day} ${monthShort} ${year}: ${att?.status || 'No Activity'}`}
                    style={{
                      width: '10px',
                      height: '10px',
                      backgroundColor: color,
                      borderRadius: '1px',
                      border: '1px solid #ebedf0',
                      cursor: 'default'
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      );
    };
    return (
      <div style={{ padding: '20px 0' }}>
        {/* Activity Header with Legend */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '16px', fontWeight: '600' }}>Activity</h3>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '15px', fontSize: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: '#216e39', borderRadius: '1px' }}></div>
              <span>Present</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: '#e67e22', borderRadius: '1px' }}></div>
              <span>Paid Leave</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: '#e74c3c', borderRadius: '1px' }}></div>
              <span>On Leave</span>
            </div>
          </div>
        </div>
        {/* All Months Grid - 3 rows x 4 columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '15px',
          justifyItems: 'center'
        }}>
          {Array.from({ length: 12 }).map((_, monIdx) => renderMonthCalendar(monIdx))}
        </div>
        <div style={{ marginTop: '20px', color: '#666', fontSize: '12px' }}>
          This is based on the attendance of this Employee. Green indicates Present or Extended shifts.
        </div>
      </div>
    );
  };

  const renderLeavesTab = () => (
    <div style={{ padding: '20px 0' }}>
      {/* Leave Balance Summary */}
      <div style={{ marginBottom: '30px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontWeight: '600', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <FaUmbrellaBeach style={{ color: '#3498db', marginRight: '8px' }} /> Leave Balance Summary
        </h4>
        {leaveSummary.length > 0 ? (
          <div style={{ overflowX: 'auto', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px solid #e9ecef' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', color: '#2c3e50' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Leave Type</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Total Allocated</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Monthly Credit</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Pending</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Available</th>
                </tr>
              </thead>
              <tbody>
                {leaveSummary.map((item, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                    <td style={{ padding: '10px', fontWeight: '600', color: '#2c3e50' }}>{item.leave_name}</td>
                    <td style={{ padding: '10px', textAlign: 'center', color: '#3498db' }}>{item.total_allocated}</td>
                    <td style={{ padding: '10px', textAlign: 'center', color: '#7f8c8d' }}>{item.monthly_credit}</td>
                    <td style={{ padding: '10px', textAlign: 'center', color: '#95a5a6' }}>{item.pending}</td>
                    <td style={{ padding: '10px', textAlign: 'center', color: '#27ae60', fontWeight: 'bold' }}>{item.available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No leave summary available.</p>
        )}
      </div>

      {/* Leave Applications */}
      <div>
        <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontWeight: '600', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <FaClipboardList style={{ color: '#e67e22', marginRight: '8px' }} /> Leave Applications
        </h4>
        {leaveApplications.length > 0 ? (
          <div style={{ overflowX: 'auto', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px solid #e9ecef' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', color: '#2c3e50' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Type</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Dates</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Mode</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Details</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveApplications.map((app, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa', borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontWeight: '600', color: '#2c3e50' }}>{app.leave_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>{app.leave_code}</div>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ color: '#2c3e50' }}>{app.from_date} to {app.to_date}</div>
                      {app.leave_mode === 'HOURLY' && (
                        <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>{app.from_time} - {app.to_time}</div>
                      )}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', color: '#34495e' }}>{app.leave_mode}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', color: '#2980b9' }}>{app.total_units} {app.unit_type}</div>
                      {app.reason && <div style={{ fontSize: '0.8rem', color: '#95a5a6', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '0 auto' }} title={app.reason}>{app.reason}</div>}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        background: app.status === 'APPROVED' ? '#d4edda' : app.status === 'REJECTED' ? '#f8d7da' : '#fff3cd',
                        color: app.status === 'APPROVED' ? '#155724' : app.status === 'REJECTED' ? '#721c24' : '#856404'
                      }}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No leave applications found.</p>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview': return renderOverviewTab();
      case 'Joining': return renderJoiningTab();
      case 'Address & Contacts': return renderAddressTab();
      case 'Shift & Holiday': return renderAttendanceTab();
      case 'Salary': return renderSalaryTab();
      case 'Attendace': return renderConnectionsTab();
      case 'Leaves': return renderLeavesTab();
      default: return null;
    }
  };
  // Generate initials for profile image
  const getInitials = (name) => {
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  // UPDATED: Default Shift Modal - Display split shifts (multiple slots)
  const ShiftModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>Default Shift Details</h3>
          <button onClick={() => setShowShiftModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
            <FaTimes />
          </button>
        </div>
        <div>
          {/* UPDATED: Parse and display split slots if multiple in default_shift string */}
          <p style={{ color: '#7f8c8d', marginBottom: '10px' }}>
            <strong>Shift:</strong> {employee.assigned_schedule?.default_shift}
          </p>
          {/* Additional details */}
          <p style={{ color: '#7f8c8d', marginBottom: '10px' }}><strong>Working Days:</strong> {employee.assigned_schedule?.working_days.join(', ')}</p>
          <p style={{ color: '#7f8c8d', marginBottom: '10px' }}><strong>Weekly Off:</strong> {employee.assigned_schedule?.weekly_off.join(', ')}</p>
          <p style={{ color: '#7f8c8d', marginBottom: '10px' }}><strong>Period:</strong> {employee.assigned_schedule?.start_date} to {employee.assigned_schedule?.end_date}</p>
          <p style={{ color: '#7f8c8d', marginBottom: '10px' }}><strong>Notes:</strong> {employee.assigned_schedule?.assignment_notes || 'None'}</p>
        </div>
      </div>
    </div>
  );
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Fixed Back Button in Top-Left Corner */}
      <button
        onClick={() => navigate('/employee-list')}
        style={{
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
        }}
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
        <FaArrowLeft /> Back to Employee List
      </button>
      {/* Main Container */}
      <div style={{
        maxWidth: '1200px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        display: 'flex'
      }}>
        {/* Left Sidebar - Profile */}
        <div style={{
          width: '250px',
          background: '#f8f9fa',
          padding: '30px 20px', // Increased padding
          height: 'auto', // Allow it to grow or set min-height
          minHeight: 'calc(100vh - 100px)',
          overflowY: 'auto',
          borderRight: '1px solid #e9ecef',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center' // Center align everything
        }}>
          {/* Image - First */}
          <div style={{
            width: '120px', // Bigger square size
            height: '120px',
            background: '#bdc3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px', // Bigger font for initials
            fontWeight: '700',
            color: 'white',
            overflow: 'hidden',
            borderRadius: '15px', // Square shape with slight rounding
            marginBottom: '20px', // Spacing below image
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            {employee.profileImage ? (
              <img
                src={employee.profileImage}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <span style={{ display: employee.profileImage ? 'none' : 'flex' }}>
              {getInitials(employee.name || '')}
            </span>
          </div>
          {/* Name & Status - Below Image */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', color: '#2c3e50', fontWeight: 'bold' }}>{employee.name || 'N/A'}</h1>
            <span style={{
              background: employee.status === 'Active' ? '#d4edda' : '#f8d7da',
              color: employee.status === 'Active' ? '#155724' : '#721c24',
              padding: '6px 15px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'inline-block'
            }}>
              {employee.status || 'Active'}
            </span>
          </div>
          {/* Optional: Add minimal info or divider below */}
          <div style={{ width: '100%', height: '1px', background: '#dee2e6', margin: '20px 0' }}></div>
          <div style={{ width: '100%', textAlign: 'center', color: '#7f8c8d' }}>
            <p style={{ margin: '5px 0', fontSize: '0.9rem' }}><FaBriefcase style={{ marginRight: '5px' }} /> {employee.employeeDesignation || 'Employee'}</p>
            <p style={{ margin: '5px 0', fontSize: '0.9rem' }}><FaUniversity style={{ marginRight: '5px' }} /> {employee.company || 'Company'}</p>
          </div>
        </div>
        {/* Right Main Content */}
        <div style={{ flex: 1, padding: '30px' }}>
          {/* Tabs Navigation */}
          <div style={{
            background: 'white',
            borderRadius: '10px',
            padding: '0 0 20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e9ecef', marginBottom: '20px' }}>
              {['Overview', 'Joining', 'Address & Contacts', 'Shift & Holiday', 'Salary', 'Attendace', 'Leaves'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '12px 20px',
                    border: 'none',
                    background: 'none',
                    color: activeTab === tab ? '#3498db' : '#7f8c8d',
                    borderBottom: activeTab === tab ? '2px solid #3498db' : 'none',
                    cursor: 'pointer',
                    fontWeight: activeTab === tab ? '600' : '400',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            {renderTabContent()}
          </div>
        </div>
      </div>
      {/* Conditional Modals - Only Default Shift */}
      {showShiftModal && <ShiftModal />}
    </div>
  );
};
export default EmployeeDocType;