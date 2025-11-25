// src/components/EmployeeList.jsx (No major changes needed; kept as provided with minor cleanup for consistency)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUserTie, FaArrowLeft, FaEdit, FaTrash, FaPlus, FaTimes, FaClock } from 'react-icons/fa';

const EmployeeList = () => {
  const navigate = useNavigate();
  const [employeesList, setEmployeesList] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Full Day'); // New: Status selection
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [currency, setCurrency] = useState('$'); // Default currency symbol

  // Fetch baseUrl on component mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/network_info");
        const { config: appConfig } = response.data;
        if (appConfig.mode === "client") {
          setBaseUrl(`http://${appConfig.server_ip}:8000`);
        } else {
          setBaseUrl(''); // Relative URLs for server mode
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
        // Fallback to current origin for robustness
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
      const currencyCode = settingsData.currency || 'USD'; // Fallback to USD if not set
      const currencySymbol = getCurrencySymbol(currencyCode);
      setCurrency(currencySymbol);
    } catch (err) {
      console.error('Error fetching currency settings:', err);
      // Fallback to default
      setCurrency('$');
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
      'AED': 'AED', // Added for AED
      // Add more as needed
    };
    return symbols[code] || code; // Fallback to code itself if symbol not found
  };

  // Fetch employees when baseUrl is set
  useEffect(() => {
    if (baseUrl !== undefined) {
      fetchEmployees();
    }
  }, [baseUrl]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const url = baseUrl ? `${baseUrl}/api/add-employee` : '/api/add-employee';
      const response = await axios.get(url);
      setEmployeesList(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to fetch employees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle click on employee row to open attendance modal
  const handleEmployeeClick = (emp) => {
    setSelectedEmployee(emp);
    setAttendanceDate(new Date().toISOString().split('T')[0]);
    setStartTime(emp.startTime || '');
    setEndTime(emp.endTime || '');
    setSelectedStatus('Full Day'); // Default to Full Day
    setShowAttendanceModal(true);
  };

  // Mark attendance for selected employee
  const markTodayAttendance = async () => {
    if (!selectedEmployee) return;
    try {
      setLoading(true);
      const url = baseUrl ? `${baseUrl}/api/attendance` : '/api/attendance';
      const dailySalary = selectedEmployee.salary / 30; // Full daily salary (assume 30 working days)
      const computedDailySalary = selectedStatus === 'Full Day' ? dailySalary : dailySalary * 0.5; // 50% for Off Day
      const response = await axios.post(url, {
        employeeId: selectedEmployee._id,
        employeeName: selectedEmployee.name,
        date: attendanceDate,
        status: selectedStatus,
        startTime: startTime,
        endTime: endTime,
        dailySalary: computedDailySalary
      });
      setMessage(`Attendance marked as ${selectedStatus} for ${attendanceDate}!`);
      setShowAttendanceModal(false);
      setSelectedEmployee(null);
      fetchEmployees(); // Refresh list if needed
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark attendance.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (emp) => {
    navigate('/add-employee', { state: { editingEmployee: emp } });
  };

  const handleDeleteEmployee = (id) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEmployee = async () => {
    try {
      setLoading(true);
      const url = baseUrl ? `${baseUrl}/api/add-employee/${deletingId}` : `/api/add-employee/${deletingId}`;
      await axios.delete(url);
      await fetchEmployees();
      setMessage('Employee deleted successfully!');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete employee.');
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(false);
      setLoading(false);
    }
  };

  const closeDeleteConfirm = (e) => {
    if (e.target === e.currentTarget) {
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  const addNewEmployee = () => {
    navigate('/add-employee');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f9' }}>
        <p>Loading employees...</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', backgroundColor: '#f4f6f9', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        {/* Header with Back and Add New Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <button
            onClick={() => navigate('/admin')}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: '#3498db',
              fontSize: '1rem',
              padding: '5px',
              borderRadius: '5px',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#e6f3fa')}
            onMouseOut={(e) => (e.target.style.backgroundColor = 'transparent')}
            disabled={loading}
          >
            <FaArrowLeft /> Back to Admin
          </button>
          <h2 style={{ textAlign: 'center', color: '#2c3e50', margin: 0, fontSize: '1.8rem', fontWeight: '600' }}>
            <FaUserTie style={{ marginRight: '10px', color: '#3498db' }} />
            Employee List ({employeesList.length})
          </h2>
          <button
            onClick={addNewEmployee}
            style={{
              backgroundColor: '#27ae60',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '10px 15px',
              borderRadius: '5px',
              fontSize: '1rem',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#229954')}
            onMouseOut={(e) => (e.target.style.backgroundColor = '#27ae60')}
            disabled={loading}
          >
            <FaPlus /> Add New Employee
          </button>
        </div>
        {/* Error and Message */}
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c0392b',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            border: '1px solid #e74c3c'
          }}>
            {error}
          </div>
        )}
        {message && (
          <div style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            border: '1px solid #28a745'
          }}>
            {message}
          </div>
        )}
        {/* Employees Table */}
        {employeesList.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef' }}>
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', whiteSpace: 'nowrap' }}>Employee ID</th>
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', whiteSpace: 'nowrap' }}>Phone Number</th>
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', minWidth: '200px' }}>Email</th>
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', minWidth: '200px' }}>Address</th>
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', whiteSpace: 'nowrap' }}>Type</th>
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', whiteSpace: 'nowrap' }}>Salary</th>
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', whiteSpace: 'nowrap' }}>Schedule</th>
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employeesList.map((emp, index) => (
                  <tr
                    key={emp._id || index}
                    style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}
                    onClick={() => handleEmployeeClick(emp)}
                  >
                    <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{emp.employeeId}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{emp.name}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>{emp.phoneNumber}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{emp.email}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{emp.address}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>{emp.employeeType}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>
                      {currency}{emp.salary}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>
                      {emp.startTime} - {emp.endTime}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditEmployee(emp); }}
                        style={{
                          marginRight: '3px',
                          padding: '4px 8px',
                          background: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                        disabled={loading}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp._id); }}
                        style={{
                          padding: '4px 8px',
                          background: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                        disabled={loading}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#6c757d', fontSize: '1.2rem', marginTop: '50px' }}>
            No employees found. <button onClick={addNewEmployee} style={{ color: '#3498db', background: 'none', border: 'none', cursor: 'pointer' }}>Add the first employee</button>.
          </p>
        )}
      </div>
      {/* Attendance Modal (Updated: Added status select for Full Day/Off Day; computes salary accordingly) */}
      {showAttendanceModal && selectedEmployee && (
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
          onClick={(e) => { if (e.target === e.currentTarget) setShowAttendanceModal(false); }}
        >
          <div style={{
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>
              <FaClock style={{ marginRight: '10px', color: '#3498db' }} />
              Mark Attendance for {selectedEmployee.name}
            </h3>
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date:</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
                >
                  <option value="Full Day">Full Day</option>
                  <option value="Off Day">Off Day (50% Pay)</option>
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Start Time:</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>End Time:</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={markTodayAttendance}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                {loading ? 'Saving...' : 'Save Attendance'}
              </button>
              <button
                onClick={() => setShowAttendanceModal(false)}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
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
          onClick={closeDeleteConfirm}
        >
          <div style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#2c3e50' }}>Confirm Delete</h3>
            <p style={{ color: '#34495e', marginBottom: '20px' }}>Are you sure you want to delete this employee? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={confirmDeleteEmployee}
                style={{ padding: '10px 20px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={closeDeleteConfirm}
                style={{ padding: '10px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;