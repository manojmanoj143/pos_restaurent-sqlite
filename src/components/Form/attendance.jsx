// Updated src/components/Form/attendance.jsx - Notes now display auto-generated details from EmployeeList marking (status + times). Existing records editable. Full Day/Off Day marking exclusive to EmployeeList. Logic preserved.
// DESIGN UPDATE: Applied EmployeeList-style background gradient, fixed back button ("Back to Admin"), and main container styling for consistency. Messages updated to match alert styles. No functional changes.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaClock, FaUserCheck, FaCalendarAlt, FaSearch, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

const Attendance = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [holidays, setHolidays] = useState([]); // Holidays for the month if applyCompanyLeaves
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('2025-11'); // Default to November 2025
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [currency, setCurrency] = useState('₹'); // Default to INR
  const [totalWorkingDays, setTotalWorkingDays] = useState(30); // From settings
  const [applyCompanyLeaves, setApplyCompanyLeaves] = useState(false); // From settings
  const [effectiveWorkingDays, setEffectiveWorkingDays] = useState(0); // totalWorkingDays - company leaves (or daysInMonth if false)
  const [companyLeaveCount, setCompanyLeaveCount] = useState(0); // Count of company leaves
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [dailyRate, setDailyRate] = useState(0); // salary / effectiveWorkingDays (updated to use effective)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('Full Day');
  const [editNotes, setEditNotes] = useState('');

  // Fetch base URL and settings (including new fields)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/network_info");
        const { config: appConfig } = response.data;
        if (appConfig.mode === "client") {
          const currentBaseUrl = `http://${appConfig.server_ip}:8000`;
          setBaseUrl(currentBaseUrl);
          await fetchSettings(currentBaseUrl);
          await fetchEmployees(currentBaseUrl);
        } else {
          setBaseUrl('');
          await fetchSettings('');
          await fetchEmployees('');
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
        setBaseUrl('');
        setError('Failed to load configuration');
      }
    };
    fetchConfig();
  }, []);

  // Fetch settings (renamed from fetchCurrency, now includes totalWorkingDays and applyCompanyLeaves)
  const fetchSettings = async (currentBaseUrl) => {
    try {
      const url = currentBaseUrl ? `${currentBaseUrl}/api/settings` : '/api/settings';
      const response = await axios.get(url);
      const settingsData = response.data;
      const currencyCode = settingsData.currency || 'INR';
      const currencySymbol = getCurrencySymbol(currencyCode);
      setCurrency(currencySymbol);
      setTotalWorkingDays(settingsData.totalWorkingDays || 30); // From settings (default 30 for compatibility)
      setApplyCompanyLeaves(settingsData.applyCompanyLeaves || false); // From settings
    } catch (err) {
      console.error('Error fetching settings:', err);
      setCurrency('₹');
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

  // Fetch employees list from /api/add-employee
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

  // Fetch attendance records for month and employeeId
  const fetchAttendance = async (currentBaseUrl, month, employeeId = null) => {
    try {
      let url = currentBaseUrl ? `${currentBaseUrl}/api/attendance?month=${month}` : `/api/attendance?month=${month}`;
      if (employeeId) {
        url += `&employeeId=${employeeId}`;
      }
      const response = await axios.get(url);
      setAttendanceRecords(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
      setError('Failed to load attendance records');
    }
  };

  // Load data for selected employee/month: attendance + holidays (if apply) + compute effective
  useEffect(() => {
    const loadData = async () => {
      if (selectedEmployee) {
        setLoading(true);
        await fetchAttendance(baseUrl, selectedMonth, selectedEmployee._id);
        // UPDATED: Compute daysInMonth
        const year = parseInt(selectedMonth.split('-')[0]);
        const mon = parseInt(selectedMonth.split('-')[1]);
        const daysInMonth = new Date(year, mon, 0).getDate();
        let holidayData = [];
        let companyLeaveCountLocal = 0;
        let eff = applyCompanyLeaves ? totalWorkingDays : daysInMonth; // FIXED: Match SalarySlip logic - use daysInMonth if false
        if (applyCompanyLeaves) {
          try {
            const res = await axios.get(`${baseUrl}/api/working-days?year=${year}&month=${mon}`);
            holidayData = res.data.holidays || [];
            companyLeaveCountLocal = holidayData.length;
            eff = Math.max(0, totalWorkingDays - companyLeaveCountLocal);
          } catch (e) {
            console.error('Failed to fetch holidays for effective days:', e);
          }
        } else {
          // If not applying leaves, no holidays, company leaves = 0
          companyLeaveCountLocal = 0;
        }
        setHolidays(holidayData);
        setCompanyLeaveCount(companyLeaveCountLocal);
        setEffectiveWorkingDays(eff);
        // UPDATED: Use effectiveWorkingDays for dailyRate (salary / eff)
        const dailyRateLocal = eff > 0 ? selectedEmployee.salary / eff : 0;
        setDailyRate(dailyRateLocal);
        setLoading(false);
      } else {
        setAttendanceRecords([]);
        setHolidays([]);
        setCompanyLeaveCount(0);
        setEffectiveWorkingDays(0);
        setDailyRate(0);
      }
    };
    loadData();
  }, [selectedMonth, selectedEmployee, baseUrl, totalWorkingDays, applyCompanyLeaves]);

  // Edit attendance
  const editAttendance = () => {
    try {
      setMessage('');
      setError(null);
      // UPDATED: Use dailyRate for computation
      const computedDailySalary = editStatus === 'Full Day' ? dailyRate : editStatus === 'Off Day' ? dailyRate * 0.5 : 0;
      const url = baseUrl ? `${baseUrl}/api/attendance` : '/api/attendance';
      axios
        .put(url, {
          _id: editingRecord._id,
          status: editStatus,
          dailySalary: computedDailySalary,
          notes: editNotes
        })
        .then(() => {
          setMessage('Attendance updated successfully');
          setShowEditModal(false);
          setEditingRecord(null);
          // Refresh current view
          fetchAttendance(baseUrl, selectedMonth, selectedEmployee._id);
        })
        .catch((err) => {
          setError(`Failed to update attendance: ${err.response?.data?.error || err.message}`);
        });
    } catch (err) {
      setError(`Failed to update attendance: ${err.message}`);
    }
  };

  // Delete attendance
  const deleteAttendance = async (recordId) => {
    try {
      const url = baseUrl ? `${baseUrl}/api/attendance` : '/api/attendance';
      await axios.delete(url, { data: { _id: recordId } });
      setMessage('Attendance deleted successfully');
      // Refresh current view
      await fetchAttendance(baseUrl, selectedMonth, selectedEmployee._id);
    } catch (err) {
      setError(`Failed to delete attendance: ${err.response?.data?.error || err.message}`);
    }
  };

  // Handle month change
  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter((emp) =>
    emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate days in month
  const year = parseInt(selectedMonth.split('-')[0]);
  const monthIndex = parseInt(selectedMonth.split('-')[1]) - 1;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthDays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    monthDays.push(d);
  }

  // Check if date is holiday
  const isHolidayDate = (date) => holidays.some(h => h.date === date);

  // Get status style
  const getStatusStyle = (status) => {
    let statusStyle = {};
    if (status === 'Full Day') {
      statusStyle = { backgroundColor: '#d4edda', color: '#155724' };
    } else if (status === 'Off Day') {
      statusStyle = { backgroundColor: '#fff3cd', color: '#856404' };
    } else if (status === 'Company Leave') {
      statusStyle = { backgroundColor: '#bdc3c7', color: '#7f8c8d' }; // Gray for company leave
    } else {
      statusStyle = { backgroundColor: '#ffebee', color: '#c0392b' };
    }
    return statusStyle;
  };

  // Summary calculations - UPDATED: Use effectiveWorkingDays, marked = full + off, absent = effective - marked
  const fullCount = attendanceRecords.filter((r) => r.status === 'Full Day').length;
  const offCount = attendanceRecords.filter((r) => r.status === 'Off Day').length;
  const markedCount = fullCount + offCount;
  const absentCount = effectiveWorkingDays - markedCount;
  const totalSalary = attendanceRecords.reduce((sum, rec) => sum + (rec.dailySalary || 0), 0);

  if (loading && !selectedEmployee) {
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
          <FaClock style={{ fontSize: '48px', marginBottom: '20px', color: '#3498db' }} />
          <p>Loading attendance records...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Fixed Back Button in Top-Left Corner - Styled like EmployeeList */}
      <button
        onClick={() => navigate('/admin')}
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
        <FaArrowLeft /> Back to Admin
      </button>

      {/* Main Container - Styled like EmployeeList */}
      <div style={{
        maxWidth: '1250px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header with Title - Styled like EmployeeList Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #3498db'
        }}>
          <div></div> {/* Empty left for balance */}
          <h2 style={{
            textAlign: 'center',
            color: '#2c3e50',
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <FaClock style={{ color: '#3498db', fontSize: '2rem' }} />
            Employee Attendance
          </h2>
          <div></div> {/* Empty right for balance */}
        </div>

        {/* Error and Message - Styled like EmployeeList Alerts */}
        {error && (
          <div style={{
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
          }}>
            <FaTimes style={{ fontSize: '1.2rem' }} />
            {error}
          </div>
        )}
        {message && (
          <div style={{
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
          }}>
            <FaClock style={{ fontSize: '1.2rem', color: '#27ae60' }} />
            {message}
          </div>
        )}

        {/* Month Selector - Styled consistently */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '10px'
        }}>
          <FaCalendarAlt style={{ fontSize: '1.2rem', color: '#3498db' }} />
          <input
            type="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            style={{
              padding: '10px 15px',
              border: '2px solid #3498db',
              borderRadius: '10px',
              fontSize: '1rem',
              background: '#f8f9fa',
              color: '#2c3e50',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2980b9'}
            onBlur={(e) => e.target.style.borderColor = '#3498db'}
          />
        </div>

        {selectedEmployee ? (
          /* Employee Monthly View: Day-wise full list including absent, holidays, with edit/delete for existing records only. No marking buttons. */
          <div>
            {/* Subheader for Selected Employee - Styled like EmployeeList */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              backgroundColor: 'white',
              padding: '15px',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{ margin: 0, color: '#2c3e50', fontWeight: '600' }}>
                Attendance for {selectedEmployee.name} - {selectedMonth}
              </h3>
              <button
                onClick={() => setSelectedEmployee(null)}
                style={{
                  background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(149, 165, 166, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 4px 8px rgba(149, 165, 166, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 2px 4px rgba(149, 165, 166, 0.3)';
                }}
              >
                Change Employee
              </button>
            </div>
            <div style={{
              overflowX: 'auto',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              backgroundColor: 'white'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', color: 'white' }}>
                    <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Date</th>
                    <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', fontWeight: '600', fontSize: '0.95rem' }}>Status</th>
                    <th style={{ padding: '15px 12px', border: 'none', textAlign: 'right', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Daily Salary</th>
                    <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', minWidth: '200px', fontWeight: '600', fontSize: '0.95rem' }}>Notes</th>
                    <th style={{ padding: '15px 12px', border: 'none', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {monthDays.map((dayNum) => {
                    const date = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
                    const isHoliday = applyCompanyLeaves && isHolidayDate(date);
                    const record = attendanceRecords.find((r) => r.date === date);
                    let status, dailySalary, notes, actions;
                    if (isHoliday) {
                      // Company Leave - no marking allowed
                      status = 'Company Leave';
                      dailySalary = 0;
                      notes = 'Company Holiday';
                      actions = <td style={{ padding: '15px 12px', textAlign: 'center', borderRight: '1px solid #e9ecef' }}>-</td>;
                    } else if (record) {
                      // Existing record - show edit/delete; notes now includes auto-generated details from marking
                      status = record.status;
                      dailySalary = record.dailySalary;
                      notes = record.notes || '';
                      actions = (
                        <td style={{ padding: '15px 12px', textAlign: 'center', borderRight: '1px solid #e9ecef' }}>
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <button
                              onClick={() => {
                                setEditingRecord(record);
                                setEditStatus(record.status);
                                setEditNotes(record.notes || '');
                                setShowEditModal(true);
                              }}
                              style={{
                                padding: '6px 10px',
                                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 4px rgba(52, 152, 219, 0.3)'
                              }}
                              onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.4)';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 4px rgba(52, 152, 219, 0.3)';
                              }}
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => deleteAttendance(record._id)}
                              style={{
                                padding: '6px 10px',
                                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 4px rgba(231, 76, 60, 0.3)'
                              }}
                              onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 8px rgba(231, 76, 60, 0.4)';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 4px rgba(231, 76, 60, 0.3)';
                              }}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      );
                    } else {
                      // Absent working day - Show only text, no buttons
                      status = 'Absent';
                      dailySalary = 0;
                      notes = '';
                      actions = <td style={{ padding: '15px 12px', textAlign: 'center', borderRight: '1px solid #e9ecef' }}>-</td>;
                    }
                    return (
                      <tr key={date} style={{ borderBottom: '1px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
                        <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', color: '#2c3e50' }}>{date}</td>
                        <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef' }}>
                          <span
                            style={{
                              padding: '5px 10px',
                              borderRadius: '15px',
                              fontWeight: 'bold',
                              ...getStatusStyle(status)
                            }}
                          >
                            {status}
                          </span>
                        </td>
                        <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', textAlign: 'right', color: '#2c3e50' }}>{currency}{dailySalary.toFixed(2)}</td>
                        <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', color: '#2c3e50' }}>{notes}</td>
                        {actions}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Monthly Summary for Employee - Styled like EmployeeList Card */}
            <div style={{
              marginTop: '20px',
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '20px', fontWeight: '600' }}>Monthly Summary for {selectedEmployee.name} ({selectedMonth})</h3>
              <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ color: '#2c3e50', marginBottom: '5px' }}>Working Days</h4>
                  <p style={{ fontSize: '1.5rem', color: '#3498db', margin: 0 }}>{effectiveWorkingDays}</p>
                </div>
                {applyCompanyLeaves && (
                  <div style={{ textAlign: 'center' }}>
                    <h4 style={{ color: '#2c3e50', marginBottom: '5px' }}>Company Leaves</h4>
                    <p style={{ fontSize: '1.5rem', color: '#7f8c8d', margin: 0 }}>{companyLeaveCount}</p>
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ color: '#2c3e50', marginBottom: '5px' }}>Total Full Days</h4>
                  <p style={{ fontSize: '1.5rem', color: '#27ae60', margin: 0 }}>{fullCount}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ color: '#2c3e50', marginBottom: '5px' }}>Total Off Days (50%)</h4>
                  <p style={{ fontSize: '1.5rem', color: '#f39c12', margin: 0 }}>{offCount}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ color: '#2c3e50', marginBottom: '5px' }}>Total Absent</h4>
                  <p style={{ fontSize: '1.5rem', color: '#e74c3c', margin: 0 }}>{Math.max(0, absentCount)}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ color: '#2c3e50', marginBottom: '5px' }}>Total Salary</h4>
                  <p style={{ fontSize: '1.5rem', color: '#27ae60', margin: 0 }}>
                    {currency}{totalSalary.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Employee Selection View - Styled like EmployeeList Table */
          <div>
            {/* Search Section - Styled like EmployeeList Filter */}
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
                <h4 style={{ margin: 0, color: '#2c3e50', fontWeight: '600' }}>Search Employees</h4>
              </div>
              <div style={{
                position: 'relative',
                maxWidth: '400px',
                margin: '0 auto'
              }}>
                <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#7f8c8d', fontSize: '1rem' }} />
                <input
                  type="text"
                  placeholder="Search employees by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 10px 10px 35px',
                    border: '1px solid #bdc3c7',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    background: '#f8f9fa'
                  }}
                />
              </div>
            </div>
            <div style={{
              overflowX: 'auto',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              backgroundColor: 'white'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', color: 'white' }}>
                    <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', fontWeight: '600', fontSize: '0.95rem' }}>Employee Name</th>
                    <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', minWidth: '200px', fontWeight: '600', fontSize: '0.95rem' }}>Email</th>
                    <th style={{ padding: '15px 12px', border: 'none', textAlign: 'right', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Monthly Salary</th>
                    <th style={{ padding: '15px 12px', border: 'none', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee._id} style={{ borderBottom: '1px solid #e9ecef', cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: '#f8f9fa' }}>
                      <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', color: '#2c3e50' }}>{employee.name}</td>
                      <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', color: '#2c3e50' }}>{employee.email}</td>
                      <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', textAlign: 'right', color: '#2c3e50' }}>{currency}{employee.salary.toFixed(2)}</td>
                      <td style={{ padding: '15px 12px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedEmployee(employee)}
                          style={{
                            padding: '10px 20px',
                            background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '25px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 4px rgba(52, 152, 219, 0.3)'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(52, 152, 219, 0.3)';
                          }}
                        >
                          View Monthly Attendance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEmployees.length === 0 && (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#7f8c8d',
                  fontSize: '1.2rem',
                  background: '#f8f9fa',
                  borderRadius: '10px',
                  border: '2px dashed #bdc3c7'
                }}>
                  <FaUserCheck style={{ fontSize: '4rem', marginBottom: '20px', color: '#3498db' }} />
                  No employees found matching the search criteria.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Modal - Styled like EmployeeList Modal */}
        {showEditModal && editingRecord && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowEditModal(false);
            }}
          >
            <div style={{
              backgroundColor: '#ffffff',
              padding: '30px',
              borderRadius: '15px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
              textAlign: 'center',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{
                color: '#2c3e50',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                margin: '0 auto'
              }}>
                <FaEdit style={{ color: '#3498db', fontSize: '1.5rem' }} />
                Edit Attendance for {editingRecord.employeeName} on {editingRecord.date}
              </h3>
              <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>Status:</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #3498db',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      outline: 'none',
                      background: '#f8f9fa',
                      color: '#2c3e50'
                    }}
                  >
                    <option value="Full Day">Full Day</option>
                    <option value="Off Day">Off Day (50% Pay)</option>
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>Notes:</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add notes..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #3498db',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      outline: 'none',
                      background: '#f8f9fa',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={editAttendance}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)',
                    transition: 'all 0.3s ease',
                    minWidth: '140px'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 12px rgba(52, 152, 219, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.3)';
                  }}
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 8px rgba(149, 165, 166, 0.3)',
                    transition: 'all 0.3s ease',
                    minWidth: '140px'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 12px rgba(149, 165, 166, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 8px rgba(149, 165, 166, 0.3)';
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;