// EmployeeList.jsx - Updated: Enhanced Schedule & Other section in details modal to fetch shift timing from active schedule assignment
// Also ensures special days display from assignments in modal. Table columns for shiftTiming and specialDays are optional via column management.
// UPDATED: Removed salutation and dateOfBirth from default columns; they are available in possibleColumns for optional addition.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUserTie, FaArrowLeft, FaEdit, FaTrash, FaPlus, FaTimes, FaClock, FaSearch, FaFilter, FaEye, FaCalendarCheck, FaGift } from 'react-icons/fa';
const EmployeeList = () => {
  const navigate = useNavigate();
  const [employeesList, setEmployeesList] = useState([]);
  const [employeeDesignations, setEmployeeDesignations] = useState([]); // New: Fetch designations for dropdown filter
  const [employeeTypes, setEmployeeTypes] = useState([]); // New: Fetch types for dropdown filter
  // NEW: Schedule Data States
  const [assignments, setAssignments] = useState([]);
  const [scheduleRules, setScheduleRules] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailsEmployee, setDetailsEmployee] = useState(null);
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
  // NEW: Column management states
  const [columnOrder, setColumnOrder] = useState([
    { key: "employeeId", label: "Employee ID", align: "left" },
    { key: "name", label: "Full Name", align: "left" },
    // REMOVED: salutation and dateOfBirth from default - now optional via add columns
    { key: "phoneNumber", label: "Phone", align: "left" },
    { key: "email", label: "Email", align: "left" },
    { key: "employeeDesignation", label: "Designation", align: "left" },
    { key: "employeeType", label: "Type", align: "left" },
    { key: "shiftTiming", label: "Shift Timing", align: "left" }, // NEW: Default column
    { key: "status", label: "Status", align: "center" },
    { key: "actions", label: "Actions", align: "center" },
  ]);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [selectedFieldToAdd, setSelectedFieldToAdd] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(0);
  // NEW: All possible columns (excluding actions) - Added specialDays
  const possibleColumns = [
    { key: "employeeId", label: "Employee ID", align: "left" },
    { key: "profile", label: "Profile", align: "center" },
    { key: "name", label: "Full Name", align: "left" },
    { key: "salutation", label: "Salutation", align: "left" }, // Now optional
    { key: "gender", label: "Gender", align: "left" },
    { key: "dateOfBirth", label: "DOB", align: "left" }, // Now optional
    { key: "phoneNumber", label: "Phone", align: "left" },
    { key: "email", label: "Email", align: "left" },
    { key: "address", label: "Address", align: "left" },
    { key: "nationality", label: "Nationality", align: "left" },
    { key: "maritalStatus", label: "Marital Status", align: "left" },
    { key: "employeeDesignation", label: "Designation", align: "left" },
    { key: "employeeType", label: "Type", align: "left" },
    { key: "status", label: "Status", align: "center" },
    { key: "company", label: "Company", align: "left" },
    { key: "dateOfJoining", label: "Joined", align: "left" },
    { key: "idNumber", label: "ID Number", align: "left" },
    { key: "idExpiry", label: "ID Expiry", align: "left" },
    { key: "bankName", label: "Bank Name", align: "left" },
    { key: "accountHolderName", label: "Acc Holder", align: "left" },
    { key: "accountNumber", label: "Acc Number", align: "left" },
    { key: "ifscCode", label: "IFSC", align: "left" },
    { key: "basicSalary", label: "Basic Salary", align: "right" },
    { key: "hra", label: "HRA", align: "right" },
    { key: "ta", label: "TA", align: "right" },
    { key: "oa", label: "OA", align: "right" },
    { key: "totalSalary", label: "Total Salary", align: "right" },
    { key: "startTime", label: "Start Time", align: "left" },
    { key: "endTime", label: "End Time", align: "left" },
    { key: "specialTimings", label: "Special Timings", align: "center" },
    { key: "education", label: "Education", align: "left" },
    { key: "previousExperience", label: "Experience", align: "left" },
    { key: "skills", label: "Skills", align: "left" },
    { key: "healthInfo", label: "Health Info", align: "left" },
    { key: "familyDetails", label: "Family Details", align: "left" },
    { key: "username", label: "Username", align: "left" },
    { key: "shiftTiming", label: "Shift Timing", align: "left" },
    { key: "specialDays", label: "Special Days", align: "left" }, // NEW: Added for schedule assignments special days
    { key: "created_at", label: "Created At", align: "left" },
  ];
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
      fetchScheduleData(); // NEW: Fetch schedule data
    }
  }, [baseUrl]);
  // NEW: Fetch Schedule Data (Assignments, Rules, Shifts)
  const fetchScheduleData = async () => {
    try {
      const [assignRes, rulesRes, shiftsRes] = await Promise.all([
        axios.get(baseUrl ? `${baseUrl}/api/schedule-assignments` : '/api/schedule-assignments'),
        axios.get(baseUrl ? `${baseUrl}/api/schedule-rules` : '/api/schedule-rules'),
        axios.get(baseUrl ? `${baseUrl}/api/schedules` : '/api/schedules')
      ]);
      setAssignments(assignRes.data || []);
      setScheduleRules(rulesRes.data || []);
      setShifts(shiftsRes.data || []);
    } catch (err) {
      console.error("Error fetching schedule data:", err);
    }
  };
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const url = baseUrl ? `${baseUrl}/api/add-employee` : '/api/add-employee';
      const response = await axios.get(url);
      console.log("FETCHED EMPLOYEES:", response.data);
      if (Array.isArray(response.data)) {
        // Ensure we filter out any potential drafts if backend sends them, though backend is now fixed.
        // Also ensures consistent ID handling.
        const validEmployees = response.data.map(emp => ({
          ...emp,
          id: emp._id || emp.id // Ensure ID is accessible
        })).filter(emp => !emp.isDraft);
        setEmployeesList(validEmployees);
      } else {
        console.error("Unexpected API response format:", response.data);
        setEmployeesList([]);
      }
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
    String(emp.totalSalary).includes(filters.salary)
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
      const dailySalary = selectedEmployee.totalSalary / 30; // Full daily salary (assume 30 working days)
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
  const handleViewDetails = (emp) => {
    setDetailsEmployee(emp);
    setShowDetailsModal(true);
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
  // NEW: Column management functions
  const addColumn = () => {
    const fieldKey = selectedFieldToAdd;
    if (!fieldKey) return;
    const field = possibleColumns.find(p => p.key === fieldKey);
    if (!field || columnOrder.some(c => c.key === field.key)) return;
    const pos = parseInt(selectedPosition);
    const newOrder = [...columnOrder];
    newOrder.splice(pos, 0, field);
    setColumnOrder(newOrder);
    setSelectedFieldToAdd('');
    setSelectedPosition(0);
  };
  const removeColumn = (index) => {
    const newOrder = [...columnOrder];
    const removed = newOrder.splice(index, 1)[0];
    // If actions removed, add it back at the end
    if (removed && removed.key === "actions") {
      newOrder.push(removed);
    }
    setColumnOrder(newOrder);
  };
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", index);
    e.target.style.backgroundColor = 'rgba(52, 152, 219, 0.2)';
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.target.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
  };
  const handleDragLeave = (e) => {
    e.target.style.backgroundColor = '';
  };
  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    const newOrder = [...columnOrder];
    const [draggedColumn] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);
    setColumnOrder(newOrder);
    // Reset styles
    document.querySelectorAll('table th').forEach(th => {
      th.style.backgroundColor = '';
    });
  };
  const handleDragEnd = (e) => {
    document.querySelectorAll('table th').forEach(th => {
      th.style.backgroundColor = '';
    });
  };
  const thStyle = {
    padding: '15px 12px',
    border: 'none',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    fontWeight: '600',
    fontSize: '0.95rem'
  };
  const tdStyle = {
    padding: '15px 12px',
    borderRight: '1px solid #e9ecef',
    whiteSpace: 'nowrap',
    color: '#2c3e50'
  };
  const tdStyleCenter = {
    ...tdStyle,
    textAlign: 'center'
  };
  const actionBtnStyle = {
    padding: '6px 10px',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'all 0.3s ease'
  };
  // Helper to get cell content based on column key - UPDATED: Added specialDays case
  const getCellContent = (emp, col) => {
    // Helper to find active assignment for this employee
    const getActiveAssignment = (empId) => {
      return assignments.find(a => String(a.employee_id) === String(empId) && a.is_active);
    };
    switch (col.key) {
      case 'profile':
        return (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            overflow: 'hidden',
            margin: '0 auto',
            border: '2px solid #ecf0f1'
          }}>
            {emp.profileImage ? (
              <img src={emp.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#bdc3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px' }}>
                {emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
        );
      case 'status':
        return (
          <span style={{
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: '600',
            backgroundColor: emp.status === 'Active' ? '#d4edda' : '#f8d7da',
            color: emp.status === 'Active' ? '#155724' : '#721c24'
          }}>
            {emp.status || 'Active'}
          </span>
        );
      case 'employeeDesignation':
        return <span style={{ color: '#3498db', fontWeight: '500' }}>{emp.employeeDesignation}</span>;
      case 'employeeType':
        return <span style={{ color: '#27ae60', fontWeight: '500' }}>{emp.employeeType}</span>;
      case 'totalSalary':
        return <span style={{ color: '#e67e22', fontWeight: '600' }}>{currency}{emp.totalSalary}</span>;
      case 'basicSalary':
      case 'hra':
      case 'ta':
      case 'oa':
        return `${currency}${emp[col.key]}`;
      case 'specialTimings':
        return emp.specialTimings ? emp.specialTimings.length : 0;
      case 'shiftTiming':
        // Match employee to active assignment -> rule -> shift
        const assignForShift = getActiveAssignment(emp._id);
        if (!assignForShift) return <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>Unassigned</span>;
        const rule = scheduleRules.find(r => String(r._id) === String(assignForShift.schedule_id));
        if (!rule) return <span style={{ color: '#e74c3c' }}>Rule Missing</span>;
        const shift = shifts.find(s => String(s._id) === String(rule.shift_id));
        if (!shift) return <span style={{ color: '#e74c3c' }}>Shift Missing</span>;
        return (
          <div>
            <div style={{ fontWeight: '600', color: '#2c3e50' }}>{shift.start_time} - {shift.end_time}</div>
            <div style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>{rule.schedule_name}</div>
          </div>
        );
      case 'specialDays': // NEW: Display special day assignments from active schedule assignment
        const assign = getActiveAssignment(emp._id);
        if (!assign || !assign.special_day_assignments || assign.special_day_assignments.length === 0) {
          return <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>None</span>;
        }
        return (
          <div style={{ maxHeight: '80px', overflowY: 'auto', fontSize: '0.8rem' }}>
            {assign.special_day_assignments.slice(0, 3).map((sd, idx) => (
              <div key={idx} style={{
                marginBottom: '4px',
                padding: '4px 6px',
                background: '#f0f8ff',
                borderRadius: '4px',
                borderLeft: `3px solid ${sd.type === 'Holiday' ? '#e74c3c' : sd.type === 'Half-Day' ? '#f39c12' : '#9b59b6'}`
              }}>
                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                  {sd.date} <span style={{ fontWeight: 'normal', color: '#7f8c8d' }}>({sd.type})</span>
                </div>
                <div style={{ color: '#34495e', fontSize: '0.75rem' }}>{sd.description}</div>
                {sd.type === 'Half-Day' && <div style={{ fontSize: '0.7rem', color: '#f39c12' }}><FaClock /> {sd.start_time} - {sd.end_time}</div>}
                {sd.type === 'Extended' && <div style={{ fontSize: '0.7rem', color: '#9b59b6' }}><FaClock /> {sd.extended_start} - {sd.extended_end}</div>}
              </div>
            ))}
            {assign.special_day_assignments.length > 3 && (
              <div style={{ fontSize: '0.7rem', color: '#7f8c8d', textAlign: 'center', marginTop: '4px' }}>
                +{assign.special_day_assignments.length - 3} more
              </div>
            )}
          </div>
        );
      case 'created_at':
        return emp.created_at ? new Date(emp.created_at).toLocaleString() : '';
      case 'actions':
        return (
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleViewDetails(emp); }}
              style={{
                padding: '6px 10px',
                background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(46, 204, 113, 0.3)'
              }}
              title="View Details"
            >
              <FaEye />
            </button>
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
              title="Edit"
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
              title="Delete"
            >
              <FaTrash />
            </button>
          </div>
        );
      default:
        return emp[col.key] || 'N/A';
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
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header with Title and Buttons */}
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
          <div style={{ display: 'flex', gap: '10px' }}>
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
            <button
              onClick={() => navigate('/schedule-assign-employee')}
              style={{
                background: 'linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)',
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
                boxShadow: '0 4px 8px rgba(142, 68, 173, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(142, 68, 173, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(142, 68, 173, 0.3)';
              }}
            >
              <FaCalendarCheck /> Assign Schedule
            </button>
            <button
              onClick={() => setShowColumnModal(true)}
              style={{
                background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
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
                boxShadow: '0 4px 8px rgba(149, 165, 166, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(149, 165, 166, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(149, 165, 166, 0.3)';
              }}
              disabled={loading}
            >
              Manage Columns
            </button>
          </div>
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
        {/* Employees Table - Dynamic based on columnOrder */}
        {filteredEmployees.length > 0 ? (
          <div style={{
            overflowX: 'auto',
            borderRadius: '10px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            marginBottom: '20px'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '1200px' // Adjusted for dynamic columns
            }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  color: '#ffffff'
                }}>
                  {columnOrder.map((col, index) => (
                    <th
                      key={col.key}
                      style={{ ...thStyle, textAlign: col.align }}
                      draggable={col.key !== "actions"}
                      onDragStart={(e) => col.key !== "actions" && handleDragStart(e, index)}
                      onDragOver={(e) => col.key !== "actions" && handleDragOver(e)}
                      onDragLeave={(e) => col.key !== "actions" && handleDragLeave(e)}
                      onDrop={(e) => col.key !== "actions" && handleDrop(e, index)}
                      onDragEnd={(e) => col.key !== "actions" && handleDragEnd(e)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (col.key !== "actions") removeColumn(index);
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
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
                    {columnOrder.map((col) => {
                      const baseCellStyle = { ...tdStyle, textAlign: col.align };
                      if (col.key === 'address') {
                        baseCellStyle.minWidth = '200px';
                        baseCellStyle.whiteSpace = 'normal';
                      }
                      if (col.key === 'specialDays') {
                        baseCellStyle.minWidth = '250px';
                        baseCellStyle.whiteSpace = 'normal';
                      }
                      const content = getCellContent(emp, col);
                      return (
                        <td key={col.key} style={baseCellStyle}>
                          {content}
                        </td>
                      );
                    })}
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
      {/* Employee Details Modal - UPDATED: Added Special Days section and Shift Timing from active assignment */}
      {showDetailsModal && detailsEmployee && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1050,
            backdropFilter: 'blur(3px)'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDetailsModal(false); }}
        >
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '15px',
            width: '90%',
            maxWidth: '900px',
            maxHeight: '90vh',
            boxShadow: '0 15px 30px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.3s'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '30px 20px',
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.8rem',
                  cursor: 'pointer',
                  opacity: 0.8,
                  zIndex: 1
                }}
              >
                <FaTimes />
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                {detailsEmployee.profileImage ? (
                  <img src={detailsEmployee.profileImage} alt="Profile" style={{ width: '150px', height: '150px', borderRadius: '50%', border: '5px solid white', objectFit: 'cover', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }} />
                ) : (
                  <div style={{ width: '150px', height: '150px', borderRadius: '50%', border: '5px solid white', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                    <FaUserTie style={{ fontSize: '70px', color: 'white' }} />
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>{detailsEmployee.name}</h2>
                  <p style={{ margin: '5px 0 0', opacity: 0.9, fontSize: '1.1rem' }}>{detailsEmployee.employeeId} | {detailsEmployee.employeeDesignation}</p>
                </div>
              </div>
            </div>
            {/* Modal Body */}
            <div style={{ padding: '25px', overflowY: 'auto', flex: 1, backgroundColor: '#f8f9fa' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                {/* Basic Info Card */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <h4 style={{ color: '#3498db', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginBottom: '15px', marginTop: 0 }}>
                    <FaUserTie style={{ marginRight: '8px' }} /> Basic Information
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div><strong>Phone:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.phoneNumber}</p></div>
                    <div><strong>Email:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.email}</p></div>
                    <div><strong>Gender:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.gender || 'N/A'}</p></div>
                    <div><strong>Status:</strong> <span style={{ padding: '3px 8px', borderRadius: '12px', background: detailsEmployee.status === 'Active' ? '#d4edda' : '#f8d7da', color: detailsEmployee.status === 'Active' ? '#155724' : '#721c24', fontSize: '0.85rem' }}>{detailsEmployee.status}</span></div>
                    <div><strong>Date of Birth:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.dateOfBirth || 'N/A'}</p></div>
                    <div><strong>Joining Date:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.dateOfJoining || 'N/A'}</p></div>
                    <div><strong>Company:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.company}</p></div>
                    <div><strong>Type:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.employeeType}</p></div>
                  </div>
                </div>
                {/* Personal & Address */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <h4 style={{ color: '#3498db', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginBottom: '15px', marginTop: 0 }}>
                    <FaUserTie style={{ marginRight: '8px' }} /> Personal Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div><strong>Salutation:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.salutation || 'N/A'}</p></div>
                    <div><strong>Marital Status:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.maritalStatus || 'N/A'}</p></div>
                    <div><strong>Nationality:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.nationality || 'N/A'}</p></div>
                    <div><strong>ID Number:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.idNumber || 'N/A'}</p></div>
                    <div><strong>ID Expiry:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.idExpiry || 'N/A'}</p></div>
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <strong>Address:</strong>
                    <p style={{ margin: '5px 0', whiteSpace: 'pre-wrap' }}>{detailsEmployee.address}</p>
                  </div>
                </div>
                {/* Financial Info */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <h4 style={{ color: '#27ae60', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginBottom: '15px', marginTop: 0 }}>
                    <FaUserTie style={{ marginRight: '8px' }} /> Financial Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: '#f8fff9', padding: '10px', borderRadius: '8px' }}>
                    <div><strong>Basic Salary:</strong> <p style={{ margin: '5px 0', fontWeight: 'bold' }}>{currency}{detailsEmployee.basicSalary || '0'}</p></div>
                    <div><strong>HRA:</strong> <p style={{ margin: '5px 0' }}>{currency}{detailsEmployee.hra || '0'}</p></div>
                    <div><strong>TA:</strong> <p style={{ margin: '5px 0' }}>{currency}{detailsEmployee.ta || '0'}</p></div>
                    <div><strong>OA:</strong> <p style={{ margin: '5px 0' }}>{currency}{detailsEmployee.oa || '0'}</p></div>
                    <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #ccc', paddingTop: '5px', marginTop: '5px' }}>
                      <strong>Total Salary:</strong> <span style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '1.1rem' }}>{currency}{detailsEmployee.totalSalary || '0'}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div><strong>Bank Name:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.bankName || 'N/A'}</p></div>
                      <div><strong>IFSC Code:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.ifscCode || 'N/A'}</p></div>
                      <div style={{ gridColumn: 'span 2' }}><strong>Account Number:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.accountNumber || 'N/A'}</p></div>
                      <div style={{ gridColumn: 'span 2' }}><strong>Account Holder:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.accountHolderName || 'N/A'}</p></div>
                    </div>
                  </div>
                </div>
                {/* Schedule & Others - UPDATED: Fetch Shift Timing from active assignment, Special Days from assignments */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <h4 style={{ color: '#e67e22', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginBottom: '15px', marginTop: 0 }}>
                    <FaClock style={{ marginRight: '8px' }} /> Schedule & Other
                  </h4>
                  {/* UPDATED: Shift Timing from active schedule assignment */}
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Shift Timing:</strong>
                    <p style={{ margin: '5px 0' }}>
                      {(() => {
                        const assign = assignments.find(a => String(a.employee_id) === String(detailsEmployee._id) && a.is_active);
                        if (!assign) return 'No assigned schedule';
                        const rule = scheduleRules.find(r => String(r._id) === String(assign.schedule_id));
                        if (!rule) return 'Schedule rule missing';
                        const shift = shifts.find(s => String(s._id) === String(rule.shift_id));
                        if (!shift) return 'Shift missing';
                        return (
                          <div>
                            <div style={{ fontWeight: '600', color: '#2c3e50' }}>{shift.start_time} - {shift.end_time}</div>
                            <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>{rule.schedule_name}</div>
                          </div>
                        );
                      })()}
                    </p>
                  </div>
                  {detailsEmployee.specialTimings && detailsEmployee.specialTimings.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <strong>Special Timings:</strong>
                      <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                        {detailsEmployee.specialTimings.map((st, idx) => (
                          <li key={idx} style={{ fontSize: '0.9rem' }}>{st.date}: {st.startTime} - {st.endTime} ({st.status})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* NEW: Special Days from Schedule Assignments */}
                  {(() => {
                    const assign = assignments.find(a => String(a.employee_id) === String(detailsEmployee._id) && a.is_active);
                    if (assign && assign.special_day_assignments && assign.special_day_assignments.length > 0) {
                      return (
                        <div style={{ marginBottom: '15px' }}>
                          <strong>Special Days & Exceptions:</strong>
                          <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                            {assign.special_day_assignments.map((sd, idx) => (
                              <li key={idx} style={{ fontSize: '0.9rem', marginBottom: '5px' }}>
                                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                  {sd.date} <span style={{ fontWeight: 'normal', color: '#7f8c8d' }}>({sd.type})</span>
                                </div>
                                <div style={{ color: '#34495e' }}>{sd.description}</div>
                                {sd.type === 'Half-Day' && <div style={{ fontSize: '0.8rem', color: '#f39c12' }}><FaClock style={{ fontSize: '0.7rem' }} /> {sd.start_time} - {sd.end_time}</div>}
                                {sd.type === 'Extended' && <div style={{ fontSize: '0.8rem', color: '#9b59b6' }}><FaClock style={{ fontSize: '0.7rem' }} /> {sd.extended_start} - {sd.extended_end}</div>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                    <div><strong>Education:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.education || 'N/A'}</p></div>
                    <div><strong>Experience:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.previousExperience || 'N/A'}</p></div>
                    <div><strong>Skills:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.skills || 'N/A'}</p></div>
                  </div>
                </div>
                {/* System Credentials */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', gridColumn: '1 / -1' }}>
                  <h4 style={{ color: '#8e44ad', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginBottom: '15px', marginTop: 0 }}>
                    <FaUserTie style={{ marginRight: '8px' }} /> System Credentials
                  </h4>
                  <div style={{ display: 'flex', gap: '30px' }}>
                    <div><strong>Username:</strong> <p style={{ margin: '5px 0' }}>{detailsEmployee.username}</p></div>
                    {/* Password hidden for security */}
                  </div>
                </div>
              </div>
            </div>
            {/* Modal Footer */}
            <div style={{ padding: '20px', background: '#f1f2f6', borderTop: '1px solid #dfe6e9', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEditEmployee(detailsEmployee);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FaEdit /> Edit Details
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
      {/* NEW: Column Management Modal */}
      {showColumnModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1050,
            backdropFilter: 'blur(3px)'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowColumnModal(false); }}
        >
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '15px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            boxShadow: '0 15px 30px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>Manage Table Columns</h4>
              <button
                onClick={() => setShowColumnModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  opacity: 0.8
                }}
              >
                <FaTimes />
              </button>
            </div>
            {/* Modal Body */}
            <div style={{ padding: '25px', overflowY: 'auto', flex: 1, backgroundColor: '#f8f9fa' }}>
              {/* Add New Column Section */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h5 style={{ color: '#3498db', marginBottom: '15px', fontWeight: '600' }}>Add New Column</h5>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Select Field to Add</label>
                  <select
                    value={selectedFieldToAdd}
                    onChange={(e) => setSelectedFieldToAdd(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #3498db',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      background: '#f8f9fa',
                      color: '#2c3e50'
                    }}
                  >
                    <option value="">Choose a field...</option>
                    {possibleColumns
                      .filter((p) => !columnOrder.some((c) => c.key === p.key))
                      .map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Insert Position</label>
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #3498db',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      background: '#f8f9fa',
                      color: '#2c3e50'
                    }}
                  >
                    {Array.from({ length: columnOrder.length + 1 }, (_, i) => (
                      <option key={i} value={i}>
                        {i === columnOrder.length ? 'At the end' : `Before "${columnOrder[i].label}"`}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={addColumn}
                  disabled={!selectedFieldToAdd}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Add Column
                </button>
              </div>
              {/* Current Columns Section */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h5 style={{ color: '#3498db', marginBottom: '15px', fontWeight: '600' }}>Current Columns (Double-click headers in table to remove)</h5>
                {columnOrder.map((col, index) => (
                  <div
                    key={col.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                      padding: '10px',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      backgroundColor: '#f8f9fa'
                    }}
                  >
                    <span style={{ fontWeight: '500', color: '#2c3e50' }}>{col.label} ({col.align})</span>
                    <button
                      onClick={() => removeColumn(index)}
                      style={{
                        padding: '6px 12px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {/* Modal Footer */}
            <div style={{ padding: '20px', background: '#f1f2f6', borderTop: '1px solid #dfe6e9', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowColumnModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default EmployeeList;