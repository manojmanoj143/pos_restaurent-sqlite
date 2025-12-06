// EmployeeList.jsx - Updated: In attendance modal, pre-populate startTime/endTime with special timing if date matches employee's specialTimings
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUserTie, FaArrowLeft, FaEdit, FaTrash, FaPlus, FaTimes, FaClock, FaSearch, FaFilter } from 'react-icons/fa';
const EmployeeList = () => {
  const navigate = useNavigate();
  const [employeesList, setEmployeesList] = useState([]);
  const [employeeDesignations, setEmployeeDesignations] = useState([]); // New: Fetch designations for dropdown filter
  const [employeeTypes, setEmployeeTypes] = useState([]); // New: Fetch types for dropdown filter
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Full Day');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [currency, setCurrency] = useState('$');
  // Updated: Filter states - designation and type now use dropdown selections
  const [filters, setFilters] = useState({
    name: '',
    designation: '', // Will be exact match from dropdown
    type: '', // Will be exact match from dropdown
    phone: '',
    salary: ''
  });
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
      const currencyCode = settingsData.currency || 'USD';
      const currencySymbol = getCurrencySymbol(currencyCode);
      setCurrency(currencySymbol);
    } catch (err) {
      console.error('Error fetching currency settings:', err);
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
      'AED': 'AED',
    };
    return symbols[code] || code;
  };
  // Fetch employees, designations, and types when baseUrl is set
  useEffect(() => {
    if (baseUrl !== undefined) {
      fetchEmployees();
      fetchEmployeeDesignations(); // New: Fetch for dropdown filter
      fetchEmployeeTypes(); // New: Fetch for dropdown filter
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
  // New: Fetch employee designations for dropdown filter
  const fetchEmployeeDesignations = async () => {
    try {
      const url = baseUrl ? `${baseUrl}/api/employee-designations` : '/api/employee-designations';
      const response = await axios.get(url);
      setEmployeeDesignations(response.data);
    } catch (err) {
      console.error('Error fetching employee designations:', err);
      setError('Failed to fetch designations for filter. Please try again.');
    }
  };
  // New: Fetch employee types for dropdown filter
  const fetchEmployeeTypes = async () => {
    try {
      const url = baseUrl ? `${baseUrl}/api/employee-types` : '/api/employee-types';
      const response = await axios.get(url);
      setEmployeeTypes(response.data);
    } catch (err) {
      console.error('Error fetching employee types:', err);
      setError('Failed to fetch types for filter. Please try again.');
    }
  };
  // Updated: Filter employees based on filter states - exact match for dropdown fields
  const filteredEmployees = employeesList.filter((emp) =>
    emp.name.toLowerCase().includes(filters.name.toLowerCase()) &&
    (filters.designation === '' || emp.employeeDesignation === filters.designation) && // Exact match for dropdown
    (filters.type === '' || emp.employeeType === filters.type) && // Exact match for dropdown
    emp.phoneNumber.includes(filters.phone) &&
    String(emp.salary).includes(filters.salary)
  );
  // Updated: Handle filter changes - for dropdowns, set exact value
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };
  // New: Clear all filters
  const clearFilters = () => {
    setFilters({
      name: '',
      designation: '',
      type: '',
      phone: '',
      salary: ''
    });
  };
  // UPDATED: Handle click on employee row to open attendance modal - Pre-populate times with special if date matches
  const handleEmployeeClick = (emp) => {
    setSelectedEmployee(emp);
    const dateStr = new Date().toISOString().split('T')[0];
    setAttendanceDate(dateStr);
    // Check for special timing on this date
    const special = emp.specialTimings?.find(s => s.date === dateStr);
    if (special) {
      setStartTime(special.startTime);
      setEndTime(special.endTime);
    } else {
      setStartTime(emp.startTime || '');
      setEndTime(emp.endTime || '');
    }
    setSelectedStatus('Full Day');
    setShowAttendanceModal(true);
  };
  // Mark attendance for selected employee - UPDATED: Auto-set notes to include status and times
  const markTodayAttendance = async () => {
    if (!selectedEmployee) return;
    try {
      setLoading(true);
      const url = baseUrl ? `${baseUrl}/api/attendance` : '/api/attendance';
      const dailySalary = selectedEmployee.salary / 30; // Full daily salary (assume 30 working days)
      const computedDailySalary = selectedStatus === 'Full Day' ? dailySalary : dailySalary * 0.5; // 50% for Off Day
      // UPDATED: Auto-generate notes with status and times
      const notes = `${selectedStatus} from ${startTime || 'N/A'} to ${endTime || 'N/A'}`;
      const response = await axios.post(url, {
        employeeId: selectedEmployee._id,
        employeeName: selectedEmployee.name,
        date: attendanceDate,
        status: selectedStatus,
        startTime: startTime,
        endTime: endTime,
        dailySalary: computedDailySalary,
        notes: notes // Set notes here for display in Attendance page
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
          <p>Loading employees...</p>
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
      {/* Fixed Back Button in Top-Left Corner - Styled like SalesPage */}
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
        disabled={loading}
      >
        <FaArrowLeft /> Back to Admin
      </button>
      {/* Main Container - Like SalesPage Card */}
      <div style={{
        maxWidth: '1250px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header with Title and Add New Button */}
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
            <FaUserTie style={{ color: '#3498db', fontSize: '2rem' }} />
            Employee List ({filteredEmployees.length})
          </h2>
          <button
            onClick={addNewEmployee}
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
            <FaPlus /> Add New Employee
          </button>
        </div>
        {/* Error and Message - Styled like SalesPage Alerts */}
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
        {/* Filter Section - Styled like SalesPage Filter Group - Updated with dropdowns for designation and type */}
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
            <FaFilter style={{ color: '#3498db', fontSize: '1.5rem' }} />
            <h4 style={{ margin: 0, color: '#2c3e50', fontWeight: '600' }}>Filter Employees</h4>
            <button
              onClick={clearFilters}
              style={{
                marginLeft: 'auto',
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
              Clear Filters
            </button>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '15px'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '0.95rem',
                color: '#2c3e50'
              }}>Name</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f8f9fa',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #e9ecef'
              }}>
                <FaSearch style={{ color: '#7f8c8d', fontSize: '1rem' }} />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '0.9rem',
                    color: '#2c3e50',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '0.95rem',
                color: '#2c3e50'
              }}>Designation</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f8f9fa',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #e9ecef'
              }}>
                <FaSearch style={{ color: '#7f8c8d', fontSize: '1rem' }} />
                <select
                  value={filters.designation}
                  onChange={(e) => handleFilterChange('designation', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '0.9rem',
                    color: '#2c3e50',
                    outline: 'none'
                  }}
                >
                  <option value="">All Designations</option>
                  {employeeDesignations.map((des) => (
                    <option key={des.id} value={des.name}>{des.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '0.95rem',
                color: '#2c3e50'
              }}>Type</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f8f9fa',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #e9ecef'
              }}>
                <FaSearch style={{ color: '#7f8c8d', fontSize: '1rem' }} />
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '0.9rem',
                    color: '#2c3e50',
                    outline: 'none'
                  }}
                >
                  <option value="">All Types</option>
                  {employeeTypes.map((typ) => (
                    <option key={typ.id} value={typ.name}>{typ.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '0.95rem',
                color: '#2c3e50'
              }}>Phone Number</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f8f9fa',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #e9ecef'
              }}>
                <FaSearch style={{ color: '#7f8c8d', fontSize: '1rem' }} />
                <input
                  type="text"
                  placeholder="Search by phone..."
                  value={filters.phone}
                  onChange={(e) => handleFilterChange('phone', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '0.9rem',
                    color: '#2c3e50',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '0.95rem',
                color: '#2c3e50'
              }}>Salary</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f8f9fa',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #e9ecef'
              }}>
                <FaSearch style={{ color: '#7f8c8d', fontSize: '1rem' }} />
                <input
                  type="text"
                  placeholder="Search by salary..."
                  value={filters.salary}
                  onChange={(e) => handleFilterChange('salary', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '0.9rem',
                    color: '#2c3e50',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Employees Table - Styled like SalesPage Table */}
        {filteredEmployees.length > 0 ? (
          <div style={{
            overflowX: 'auto',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '1100px'
            }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  color: '#ffffff'
                }}>
                  <th style={{
                    padding: '15px 12px',
                    border: 'none',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    fontWeight: '600',
                    fontSize: '0.95rem'
                  }}>Employee ID</th>
                  <th style={{
                    padding: '15px 12px',
                    border: 'none',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '0.95rem'
                  }}>Name</th>
                  <th style={{
                    padding: '15px 12px',
                    border: 'none',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    fontWeight: '600',
                    fontSize: '0.95rem'
                  }}>Phone Number</th>
                  <th style={{
                    padding: '15px 12px',
                    border: 'none',
                    textAlign: 'left',
                    minWidth: '200px',
                    fontWeight: '600',
                    fontSize: '0.95rem'
                  }}>Email</th>
                  <th style={{
                    padding: '15px 12px',
                    border: 'none',
                    textAlign: 'left',
                    minWidth: '200px',
                    fontWeight: '600',
                    fontSize: '0.95rem'
                  }}>Address</th>
                  <th style={{
                    padding: '15px 12px',
                    border: 'none',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    fontWeight: '600',
                    fontSize: '0.95rem'
                  }}>Designation</th>
                  <th style={{
                    padding: '15px 12px',
                    border: 'none',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    fontWeight: '600',
                    fontSize: '0.95rem'
                  }}>Type</th>
                  <th style={{
                    padding: '15px 12px',
                    border: 'none',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    fontWeight: '600',
                    fontSize: '0.95rem'
                  }}>Salary</th>
                  <th style={{
                    padding: '15px 12px',
                    border: 'none',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    fontWeight: '600',
                    fontSize: '0.95rem'
                  }}>Schedule</th>
                  <th style={{
                    padding: '15px 12px',
                    border: 'none',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    fontWeight: '600',
                    fontSize: '0.95rem'
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, index) => (
                  <tr
                    key={emp._id || index}
                    style={{
                      borderBottom: '1px solid #e9ecef',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff'
                    }}
                    onClick={() => handleEmployeeClick(emp)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
                    }}
                  >
                    <td style={{
                      padding: '15px 12px',
                      borderRight: '1px solid #e9ecef',
                      fontWeight: '600',
                      color: '#2c3e50',
                      whiteSpace: 'nowrap'
                    }}>{emp.employeeId}</td>
                    <td style={{
                      padding: '15px 12px',
                      borderRight: '1px solid #e9ecef',
                      color: '#2c3e50'
                    }}>{emp.name}</td>
                    <td style={{
                      padding: '15px 12px',
                      borderRight: '1px solid #e9ecef',
                      whiteSpace: 'nowrap',
                      color: '#2c3e50'
                    }}>{emp.phoneNumber}</td>
                    <td style={{
                      padding: '15px 12px',
                      borderRight: '1px solid #e9ecef',
                      color: '#2c3e50'
                    }}>{emp.email}</td>
                    <td style={{
                      padding: '15px 12px',
                      borderRight: '1px solid #e9ecef',
                      color: '#2c3e50'
                    }}>{emp.address}</td>
                    <td style={{
                      padding: '15px 12px',
                      borderRight: '1px solid #e9ecef',
                      whiteSpace: 'nowrap',
                      color: '#3498db',
                      fontWeight: '500'
                    }}>{emp.employeeDesignation}</td>
                    <td style={{
                      padding: '15px 12px',
                      borderRight: '1px solid #e9ecef',
                      whiteSpace: 'nowrap',
                      color: '#27ae60',
                      fontWeight: '500'
                    }}>{emp.employeeType}</td>
                    <td style={{
                      padding: '15px 12px',
                      borderRight: '1px solid #e9ecef',
                      whiteSpace: 'nowrap',
                      color: '#e67e22',
                      fontWeight: '600'
                    }}>
                      {currency}{emp.salary}
                    </td>
                    <td style={{
                      padding: '15px 12px',
                      borderRight: '1px solid #e9ecef',
                      whiteSpace: 'nowrap',
                      color: '#2c3e50'
                    }}>
                      {emp.startTime} - {emp.endTime}
                    </td>
                    <td style={{ padding: '15px 12px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditEmployee(emp); }}
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
                          disabled={loading}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp._id); }}
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
                          disabled={loading}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            color: '#7f8c8d',
            fontSize: '1.2rem',
            marginTop: '50px',
            padding: '40px',
            background: '#f8f9fa',
            borderRadius: '10px',
            border: '2px dashed #bdc3c7'
          }}>
            <FaUserTie style={{ fontSize: '4rem', marginBottom: '20px', color: '#3498db' }} />
            No employees found.
            <button
              onClick={addNewEmployee}
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
              Add the first employee
            </button>.
          </div>
        )}
      </div>
      {/* UPDATED: Attendance Modal - Now pre-populates with special times if date matches */}
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
              <FaClock style={{ color: '#3498db', fontSize: '1.5rem' }} />
              Mark Attendance for {selectedEmployee.name}
            </h3>
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>Date:</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => {
                    setAttendanceDate(e.target.value);
                    // UPDATED: On date change, check for special timing and update times
                    const newDateStr = e.target.value;
                    const special = selectedEmployee.specialTimings?.find(s => s.date === newDateStr);
                    if (special) {
                      setStartTime(special.startTime);
                      setEndTime(special.endTime);
                    } else {
                      setStartTime(selectedEmployee.startTime || '');
                      setEndTime(selectedEmployee.endTime || '');
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #3498db',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    background: '#f8f9fa'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                  onBlur={(e) => e.target.style.borderColor = '#3498db'}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>Status:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
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
                }}>Start Time:</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #3498db',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    outline: 'none',
                    background: '#f8f9fa'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                  onBlur={(e) => e.target.style.borderColor = '#3498db'}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>End Time:</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #3498db',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    outline: 'none',
                    background: '#f8f9fa'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                  onBlur={(e) => e.target.style.borderColor = '#3498db'}
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
                onClick={markTodayAttendance}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 8px rgba(39, 174, 96, 0.3)',
                  transition: 'all 0.3s ease',
                  minWidth: '140px'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 12px rgba(39, 174, 96, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 8px rgba(39, 174, 96, 0.3)';
                }}
              >
                {loading ? 'Saving...' : 'Save Attendance'}
              </button>
              <button
                onClick={() => setShowAttendanceModal(false)}
                disabled={loading}
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
      {/* Delete Confirmation Modal - Styled like SalesPage */}
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
            backgroundColor: '#ffffff',
            padding: '30px',
            borderRadius: '15px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
            textAlign: 'center',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{
              color: '#e74c3c',
              marginBottom: '15px',
              fontSize: '1.5rem'
            }}>
              <FaTrash style={{ fontSize: '1.5rem', marginRight: '10px' }} />
              Confirm Delete
            </h3>
            <p style={{
              color: '#2c3e50',
              marginBottom: '25px',
              fontSize: '1.1rem',
              lineHeight: '1.5'
            }}>Are you sure you want to delete this employee? This action cannot be undone.</p>
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={confirmDeleteEmployee}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 8px rgba(231, 76, 60, 0.3)',
                  transition: 'all 0.3s ease',
                  minWidth: '120px'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 12px rgba(231, 76, 60, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 8px rgba(231, 76, 60, 0.3)';
                }}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={closeDeleteConfirm}
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
                  minWidth: '120px'
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