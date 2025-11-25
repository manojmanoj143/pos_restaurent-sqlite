// Updated src/components/Form/attendance.jsx - Integrated company leaves: fetch holidays if applyCompanyLeaves, display 'Company Leave' status on those days (no marking), added mark buttons for absent working days, effective working days = totalWorkingDays - company leaves count, daily rate = salary / totalWorkingDays, updated summary to use effective days, absent = effective - marked, added Company Leaves count in summary, adjusted dailySalary computation
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaClock, FaUserCheck, FaCalendarAlt, FaSearch, FaEdit, FaTrash } from 'react-icons/fa';

const Attendance = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [holidays, setHolidays] = useState([]); // NEW: Holidays for the month if applyCompanyLeaves
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('2025-11'); // Default to November 2025
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [currency, setCurrency] = useState('₹'); // Default to INR
  const [totalWorkingDays, setTotalWorkingDays] = useState(30); // NEW: From settings
  const [applyCompanyLeaves, setApplyCompanyLeaves] = useState(false); // NEW: From settings
  const [effectiveWorkingDays, setEffectiveWorkingDays] = useState(0); // NEW: total - company leaves
  const [companyLeaveCount, setCompanyLeaveCount] = useState(0); // NEW: Count of company leaves
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [dailyRate, setDailyRate] = useState(0); // NEW: salary / totalWorkingDays
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
      setTotalWorkingDays(settingsData.totalWorkingDays || 30); // NEW
      setApplyCompanyLeaves(settingsData.applyCompanyLeaves || false); // NEW
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
        let holidayData = [];
        let companyLeaveCount = 0;
        let eff = totalWorkingDays;
        if (applyCompanyLeaves) {
          const year = parseInt(selectedMonth.split('-')[0]);
          const mon = selectedMonth.split('-')[1];
          try {
            const res = await axios.get(`${baseUrl}/api/working-days?year=${year}&month=${mon}`);
            holidayData = res.data.holidays || [];
            companyLeaveCount = holidayData.length;
            eff = Math.max(0, totalWorkingDays - companyLeaveCount);
          } catch (e) {
            console.error('Failed to fetch holidays for effective days:', e);
          }
        }
        setHolidays(holidayData);
        setCompanyLeaveCount(companyLeaveCount);
        setEffectiveWorkingDays(eff);
        setDailyRate(selectedEmployee.salary / totalWorkingDays); // NEW: Set daily rate based on totalWorkingDays
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
  // Mark attendance (Full Day or Off Day)
  const markAttendance = async (employeeId, status, date) => {
    try {
      setMessage('');
      setError(null);
      const employee = selectedEmployee;
      if (!employee) return;
      const computedDailySalary = status === 'Full Day' ? dailyRate : status === 'Off Day' ? dailyRate * 0.5 : 0;
      const url = baseUrl ? `${baseUrl}/api/attendance` : '/api/attendance';
      const response = await axios.post(url, {
        employeeId,
        employeeName: employee.name,
        date,
        status,
        startTime: employee.startTime,
        endTime: employee.endTime,
        dailySalary: computedDailySalary
      });
      setMessage(`Attendance marked as ${status} successfully`);
      // Refresh current view
      await fetchAttendance(baseUrl, selectedMonth, selectedEmployee._id);
    } catch (err) {
      console.error('Failed to mark attendance:', err);
      setError(`Failed to mark attendance: ${err.response?.data?.error || err.message}`);
    }
  };
  // Edit attendance
  const editAttendance = () => {
    try {
      setMessage('');
      setError(null);
      const computedDailySalary = editStatus === 'Full Day' ? dailyRate : dailyRate * 0.5;
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
      statusStyle = { backgroundColor: '#bdc3c7', color: '#7f8c8d' }; // NEW: Gray for company leave
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
        <div>Loading Attendance Records...</div>
      </div>
    );
  }
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f9', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate('/admin')}
              style={{
                padding: '10px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaArrowLeft />
            </button>
            <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '2rem' }}>
              <FaClock style={{ marginRight: '10px' }} /> Employee Attendance
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaCalendarAlt style={{ fontSize: '1.2rem', color: '#3498db' }} />
              <input
                type="month"
                value={selectedMonth}
                onChange={handleMonthChange}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #bdc3c7',
                  borderRadius: '5px',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>
        </div>
        {/* Messages */}
        {error && (
          <div style={{ backgroundColor: '#ffebee', color: '#c0392b', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
            {error}
          </div>
        )}
        {message && (
          <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
            {message}
          </div>
        )}
        {selectedEmployee ? (
          /* Employee Monthly View: Day-wise full list including absent, holidays, with mark buttons for absent working days */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>Attendance for {selectedEmployee.name} - {selectedMonth}</h3>
              <button
                onClick={() => setSelectedEmployee(null)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Change Employee
              </button>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#3498db', color: 'white' }}>
                    <th style={{ padding: '15px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '15px', textAlign: 'right' }}>Daily Salary</th>
                    <th style={{ padding: '15px', textAlign: 'left' }}>Notes</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {monthDays.map((dayNum) => {
                    const date = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
                    const isHoliday = applyCompanyLeaves && isHolidayDate(date);
                    const record = attendanceRecords.find((r) => r.date === date);
                    let status, dailySalary, notes, actions;
                    if (isHoliday) {
                      // NEW: Company Leave - no marking allowed
                      status = 'Company Leave';
                      dailySalary = 0;
                      notes = 'Company Holiday';
                      actions = <td style={{ padding: '15px', textAlign: 'center' }}>-</td>;
                    } else if (record) {
                      // Existing record
                      status = record.status;
                      dailySalary = record.dailySalary;
                      notes = record.notes || '';
                      actions = (
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => {
                                setEditingRecord(record);
                                setEditStatus(record.status);
                                setEditNotes(record.notes || '');
                                setShowEditModal(true);
                              }}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#3498db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                              }}
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => deleteAttendance(record._id)}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                              }}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      );
                    } else {
                      // Absent working day - NEW: Add mark buttons
                      status = 'Absent';
                      dailySalary = 0;
                      notes = '';
                      actions = (
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => markAttendance(selectedEmployee._id, 'Full Day', date)}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#27ae60',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              Full Day
                            </button>
                            <button
                              onClick={() => markAttendance(selectedEmployee._id, 'Off Day', date)}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#f39c12',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              Off Day
                            </button>
                          </div>
                        </td>
                      );
                    }
                    return (
                      <tr key={date} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '15px' }}>{date}</td>
                        <td style={{ padding: '15px' }}>
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
                        <td style={{ padding: '15px', textAlign: 'right' }}>{currency}{dailySalary.toFixed(2)}</td>
                        <td style={{ padding: '15px' }}>{notes}</td>
                        {actions}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Monthly Summary for Employee - UPDATED: Effective working days, company leaves, adjusted absent */}
            <div style={{ marginTop: '20px', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              <h3 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '20px' }}>Monthly Summary for {selectedEmployee.name} ({selectedMonth})</h3>
              <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <h4>Working Days</h4>
                  <p style={{ fontSize: '1.5rem', color: '#3498db' }}>{effectiveWorkingDays}</p>
                </div>
                {applyCompanyLeaves && (
                  <div style={{ textAlign: 'center' }}>
                    <h4>Company Leaves</h4>
                    <p style={{ fontSize: '1.5rem', color: '#7f8c8d' }}>{companyLeaveCount}</p>
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <h4>Total Full Days</h4>
                  <p style={{ fontSize: '1.5rem', color: '#27ae60' }}>{fullCount}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h4>Total Off Days (50%)</h4>
                  <p style={{ fontSize: '1.5rem', color: '#f39c12' }}>{offCount}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h4>Total Absent</h4>
                  <p style={{ fontSize: '1.5rem', color: '#e74c3c' }}>{Math.max(0, absentCount)}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h4>Total Salary</h4>
                  <p style={{ fontSize: '1.5rem', color: '#27ae60' }}>
                    {currency}{totalSalary.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Employee Selection View */
          <div>
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#bdc3c7' }} />
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
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#3498db', color: 'white' }}>
                    <th style={{ padding: '15px', textAlign: 'left' }}>Employee Name</th>
                    <th style={{ padding: '15px', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '15px', textAlign: 'right' }}>Monthly Salary</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '15px' }}>{employee.name}</td>
                      <td style={{ padding: '15px' }}>{employee.email}</td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>{currency}{employee.salary.toFixed(2)}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedEmployee(employee)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
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
                <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
                  No employees found matching the search criteria.
                </div>
              )}
            </div>
          </div>
        )}
        {/* Edit Modal - UPDATED: Use dailyRate for computation */}
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
            <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '10px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
              <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Edit Attendance for {editingRecord.employeeName} on {editingRecord.date}</h3>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Status:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
                >
                  <option value="Full Day">Full Day</option>
                  <option value="Off Day">Off Day (50% Pay)</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Notes:</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes..."
                  style={{ width: '100%', padding: '8px', border: '1px solid #bdc3c7', borderRadius: '5px', minHeight: '80px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={editAttendance}
                  style={{ padding: '12px 24px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: '12px 24px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
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