// AddEmployee.jsx - Full completed detailed React component
// Updated: Matched background gradient and fixed back button style from EmployeeList.jsx
// Background: linear-gradient(135deg, #ffffff 0%, #3498db 100%)
// Fixed back button: transparent bg, 2px solid #3498db, hover effects, positioned top-left
// Main container: maxWidth 750px (form-specific), margin 80px auto 20px, white bg, padding 30px, borderRadius 15px, boxShadow
// Removed 100vh height/center flex; added padding 20px to outer div
// Header: Kept flex layout with dummy left for balance (matches EmployeeList header structure)
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaUserTie, FaArrowLeft, FaSave, FaPlus, FaTimes, FaEdit, FaTrash, FaClock } from 'react-icons/fa';

const AddEmployee = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    gender: '',
    dateOfBirth: '',
    email: '',
    address: '',
    employeeDesignation: '',
    employeeType: '',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    salary: '',
    username: '',
    password: '',
    startTime: '',
    endTime: '',
  });
  // State for phone number country code
  const [selectedISDCode, setSelectedISDCode] = useState("+971");
  const [showISDCodeDropdown, setShowISDCodeDropdown] = useState(false);
  // ISD Codes array
  const isdCodes = [
    { code: "+91", country: "India" },
    { code: "+1", country: "USA" },
    { code: "+44", country: "UK" },
    { code: "+971", country: "UAE" },
    { code: "+61", country: "Australia" },
  ];
  // Digit lengths per country for dynamic validation
  const digitLengths = {
    '+91': 10, // India
    '+1': 10, // USA/Canada
    '+44': 10, // UK
    '+971': 9, // UAE
    '+61': 9, // Australia
  };
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'salary', 'schedule', 'credentials'
  const [employeeDesignations, setEmployeeDesignations] = useState([]); // Separate state for designations
  const [employeeTypes, setEmployeeTypes] = useState([]); // Separate state for types
  const [companyDetails, setCompanyDetails] = useState(null);
  const [showCreateDesignation, setShowCreateDesignation] = useState(false);
  const [showCreateEmployeeType, setShowCreateEmployeeType] = useState(false);
  const [showDesignationsModal, setShowDesignationsModal] = useState(false);
  const [showEmployeeTypesModal, setShowEmployeeTypesModal] = useState(false);
  const [deletingDesignation, setDeletingDesignation] = useState(null);
  const [deletingEmployeeType, setDeletingEmployeeType] = useState(null);
  const [editingDesignationId, setEditingDesignationId] = useState(null);
  const [editingEmployeeTypeId, setEditingEmployeeTypeId] = useState(null);
  const [editDesignationName, setEditDesignationName] = useState('');
  const [editEmployeeTypeName, setEditEmployeeTypeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  // New states for centered notification modal
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState(''); // 'success' or 'error'
  const [notificationMessage, setNotificationMessage] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newDesignationName, setNewDesignationName] = useState('');
  const [newEmployeeTypeName, setNewEmployeeTypeName] = useState('');
  // Helper function to convert time to minutes
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  // Computed isCompanyOvernight based on companyDetails
  const isCompanyOvernight = companyDetails && timeToMinutes(companyDetails.closingTime) < timeToMinutes(companyDetails.openingTime);
  // Fetch baseUrl on component mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/network_info");
        const { config: appConfig } = response.data;
        if (appConfig.mode === "client") {
          setBaseUrl(`http://${appConfig.server_ip}:8000`);
        } else {
          // FIXED: In server mode, still use localhost:8000 since frontend is separate (on 3000)
          setBaseUrl(`http://localhost:8000`);
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
        // FIXED: Default to localhost:8000 to avoid 404 on relative calls
        setBaseUrl(`http://localhost:8000`);
      }
    };
    fetchConfig();
  }, []);
  // Handle editing from navigation state
  useEffect(() => {
    if (location.state?.editingEmployee) {
      const emp = location.state.editingEmployee;
      setEditingId(emp._id);
      setFormData({
        ...emp,
        password: '',
      });
      // If editing, parse phone number to extract ISD code and digits
      if (emp.phoneNumber) {
        const fullPhone = emp.phoneNumber;
        const isdMatch = isdCodes.find(c => fullPhone.startsWith(c.code));
        if (isdMatch) {
          setSelectedISDCode(isdMatch.code);
          setFormData(prev => ({ ...prev, phoneNumber: fullPhone.slice(isdMatch.code.length) }));
        }
      }
    }
  }, [location.state]);
  // Fetch designations, types, and company details when baseUrl is set
  useEffect(() => {
    if (baseUrl && baseUrl !== '') {
      fetchEmployeeDesignations();
      fetchEmployeeTypes();
      fetchCompanyDetails();
    }
  }, [baseUrl]);
  const fetchEmployeeDesignations = async () => {
    try {
      const url = `${baseUrl}/api/employee-designations`;
      const response = await axios.get(url);
      setEmployeeDesignations(response.data); // Only designations here
    } catch (err) {
      console.error('Error fetching employee designations:', err);
      setError('Failed to fetch employee designations. Please try again.');
    }
  };
  const fetchEmployeeTypes = async () => {
    try {
      const url = `${baseUrl}/api/employee-types`;
      const response = await axios.get(url);
      setEmployeeTypes(response.data); // Only types here - separate fetch
    } catch (err) {
      console.error('Error fetching employee types:', err);
      setError('Failed to fetch employee types. Please try again.');
    }
  };
  const fetchCompanyDetails = async () => {
    try {
      const url = `${baseUrl}/api/company-details`;
      const response = await axios.get(url);
      if (response.data.companyDetails && response.data.companyDetails.length > 0) {
        const latestDetails = response.data.companyDetails[response.data.companyDetails.length - 1];
        setCompanyDetails(latestDetails);
      }
    } catch (err) {
      console.error('Error fetching company details:', err);
      setError('Failed to fetch company details for schedule. Please ensure company details are set.');
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };
  // Handler for ISD Code selection
  const handleISDCodeSelect = (code) => {
    setSelectedISDCode(code);
    setShowISDCodeDropdown(false);
  };
  // Phone number change with dynamic limit
  const handlePhoneNumberChange = (e) => {
    const v = e.target.value.replace(/\D/g, "");
    const maxDigits = digitLengths[selectedISDCode] || 10;
    if (v.length <= maxDigits) {
      setFormData(prev => ({ ...prev, phoneNumber: v }));
    }
  };
  // Dynamic max digits based on selected ISD code
  const getMaxDigits = () => digitLengths[selectedISDCode] || 10;
  const handleDesignationChange = (e) => {
    const value = e.target.value;
    if (value === 'create_new') {
      setShowCreateDesignation(true);
    } else {
      setFormData(prev => ({ ...prev, employeeDesignation: value }));
      setShowCreateDesignation(false);
      setNewDesignationName('');
    }
  };
  const handleEmployeeTypeChange = (e) => {
    const value = e.target.value;
    if (value === 'create_new') {
      setShowCreateEmployeeType(true);
    } else {
      setFormData(prev => ({ ...prev, employeeType: value }));
      setShowCreateEmployeeType(false);
      setNewEmployeeTypeName('');
    }
  };
  const handleCreateNewDesignation = async () => {
    if (!newDesignationName.trim()) {
      setError('Please enter a designation name.');
      return;
    }
    try {
      setLoading(true);
      const url = `${baseUrl}/api/employee-designations`;
      const response = await axios.post(url, { name: newDesignationName.trim() });
      const newDesignation = response.data;
      setEmployeeDesignations(prev => [...prev, newDesignation]); // Add to designations only
      setFormData(prev => ({ ...prev, employeeDesignation: newDesignation.name }));
      setShowCreateDesignation(false);
      setNewDesignationName('');
      setMessage('New employee designation created successfully!');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create designation.');
    } finally {
      setLoading(false);
    }
  };
  const handleCreateNewEmployeeType = async () => {
    if (!newEmployeeTypeName.trim()) {
      setError('Please enter an employee type name.');
      return;
    }
    try {
      setLoading(true);
      const url = `${baseUrl}/api/employee-types`;
      const response = await axios.post(url, { name: newEmployeeTypeName.trim() });
      const newEmployeeType = response.data;
      setEmployeeTypes(prev => [...prev, newEmployeeType]); // Add to types only
      setFormData(prev => ({ ...prev, employeeType: newEmployeeType.name }));
      setShowCreateEmployeeType(false);
      setNewEmployeeTypeName('');
      setMessage('New employee type created successfully!');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create employee type.');
    } finally {
      setLoading(false);
    }
  };
  const openDesignationsModal = () => setShowDesignationsModal(true);
  const openEmployeeTypesModal = () => setShowEmployeeTypesModal(true);
  const handleEditDesignation = (designation) => {
    setEditingDesignationId(designation.id);
    setEditDesignationName(designation.name);
  };
  const handleEditEmployeeType = (employeeType) => {
    setEditingEmployeeTypeId(employeeType.id);
    setEditEmployeeTypeName(employeeType.name);
  };
  const handleUpdateDesignation = async () => {
    if (!editDesignationName.trim()) {
      setError('Please enter a designation name.');
      return;
    }
    try {
      setLoading(true);
      const url = `${baseUrl}/api/employee-designations/${editingDesignationId}`;
      await axios.put(url, { name: editDesignationName.trim() });
      setEmployeeDesignations(prev => prev.map(t => t.id === editingDesignationId ? { ...t, name: editDesignationName.trim() } : t)); // Update designations only
      setEditingDesignationId(null);
      setEditDesignationName('');
      setMessage('Employee designation updated successfully!');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update designation.');
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateEmployeeType = async () => {
    if (!editEmployeeTypeName.trim()) {
      setError('Please enter an employee type name.');
      return;
    }
    try {
      setLoading(true);
      const url = `${baseUrl}/api/employee-types/${editingEmployeeTypeId}`;
      await axios.put(url, { name: editEmployeeTypeName.trim() });
      setEmployeeTypes(prev => prev.map(t => t.id === editingEmployeeTypeId ? { ...t, name: editEmployeeTypeName.trim() } : t)); // Update types only
      setEditingEmployeeTypeId(null);
      setEditEmployeeTypeName('');
      setMessage('Employee type updated successfully!');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update employee type.');
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteDesignation = (designationId) => {
    setDeletingDesignation(designationId);
    // FIXED: Don't close modal immediately; confirm first
    if (window.confirm('Are you sure you want to delete this designation?')) {
      confirmDeleteDesignation(designationId);
    }
  };
  const handleDeleteEmployeeType = (employeeTypeId) => {
    setDeletingEmployeeType(employeeTypeId);
    // FIXED: Don't close modal immediately; confirm first
    if (window.confirm('Are you sure you want to delete this employee type?')) {
      confirmDeleteEmployeeType(employeeTypeId);
    }
  };
  const confirmDeleteDesignation = async (designationId) => {
    try {
      const url = `${baseUrl}/api/employee-designations/${designationId}`;
      await axios.delete(url);
      setEmployeeDesignations(prev => prev.filter(t => t.id !== designationId)); // Remove from designations only
      setMessage('Employee designation deleted successfully!');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete designation.');
    } finally {
      setDeletingDesignation(null);
      setLoading(false);
    }
  };
  const confirmDeleteEmployeeType = async (employeeTypeId) => {
    try {
      const url = `${baseUrl}/api/employee-types/${employeeTypeId}`;
      await axios.delete(url);
      setEmployeeTypes(prev => prev.filter(t => t.id !== employeeTypeId)); // Remove from types only
      setMessage('Employee type deleted successfully!');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete employee type.');
    } finally {
      setDeletingEmployeeType(null);
      setLoading(false);
    }
  };
  // Validation with dynamic exact length per country and improved time validation for overnight shifts
  // Bank details are optional - no validation required for them during creation/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!baseUrl || baseUrl === '') {
      setError('Server configuration not available. Please check your connection.');
      return;
    }
    if (!formData.name || !formData.phoneNumber || !formData.email || !formData.address ||
        !formData.employeeDesignation || !formData.employeeType || !formData.salary || !formData.username || (!formData.password && !editingId) ||
        !formData.startTime || !formData.endTime) {
      setError('Please fill in all required fields.');
      return;
    }
    const phoneMaxDigits = getMaxDigits();
    if (formData.phoneNumber.length !== phoneMaxDigits) {
      setError(`Phone number must be exactly ${phoneMaxDigits} digits for ${isdCodes.find(c => c.code === selectedISDCode)?.country || 'this country'}.`);
      return;
    }
    if (formData.salary && (isNaN(formData.salary) || parseFloat(formData.salary) < 0)) {
      setError('Salary must be a valid positive number.');
      return;
    }
    if (companyDetails && formData.startTime && formData.endTime) {
      const openingTime = companyDetails.openingTime;
      const closingTime = companyDetails.closingTime;
      const start = formData.startTime;
      const end = formData.endTime;
      const sMin = timeToMinutes(start);
      const eMin = timeToMinutes(end);
      const oMin = timeToMinutes(openingTime);
      const cMin = timeToMinutes(closingTime);
      const overnight = cMin < oMin;
      let valid = false;
      if (overnight) {
        if (eMin > sMin) {
          // No midnight span: evening or morning shift
          if (sMin >= oMin || (sMin <= cMin && eMin <= cMin)) {
            valid = true;
          }
        } else {
          // Spans midnight
          if (sMin >= oMin && eMin <= cMin) {
            valid = true;
          }
        }
      } else {
        // Normal day
        if (sMin >= oMin && eMin <= cMin && eMin > sMin) {
          valid = true;
        }
      }
      if (!valid) {
        setError(`Employee shift times must be within company operating hours (${openingTime} - ${closingTime}) and end after start time.`);
        return;
      }
    }
    setLoading(true);
    setMessage('');
    setError('');
    setShowNotification(false); // Close any previous notification
    try {
      let url = `${baseUrl}/api/add-employee`;
      let method = 'post';
      let dataToSend = {
        ...formData,
        phoneNumber: `${selectedISDCode}${formData.phoneNumber}` // Include ISD code in payload
      };
      if (editingId) {
        url += `/${editingId}`;
        method = 'put';
        if (!dataToSend.password) {
          delete dataToSend.password;
        }
      }
      const response = await axios({
        method,
        url,
        data: dataToSend,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      // Use notification modal for success
      const successMsg = editingId ? 'Employee updated successfully!' : 'Employee created successfully!';
      setNotificationType('success');
      setNotificationMessage(successMsg);
      setShowNotification(true);
      setFormData({
        name: '', phoneNumber: '', gender: '', dateOfBirth: '', email: '', address: '', employeeDesignation: '', employeeType: '',
        bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '', salary: '', username: '', password: '',
        startTime: '', endTime: '',
      });
      setSelectedISDCode("+971"); // Reset ISD code
      setEditingId(null);
      await fetchEmployeeDesignations(); // Refetch designations
      await fetchEmployeeTypes(); // Refetch types separately
      await fetchCompanyDetails();
      // Auto-close notification after 2 seconds and navigate if new employee
      setTimeout(() => {
        setShowNotification(false);
        if (!editingId) {
          navigate('');
        }
      }, 2000);
    } catch (err) {
      // Use notification modal for error
      const errorMsg = err.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} employee`;
      setNotificationType('error');
      setNotificationMessage(errorMsg);
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };
  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '', phoneNumber: '', gender: '', dateOfBirth: '', email: '', address: '', employeeDesignation: '', employeeType: '',
      bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '', salary: '', username: '', password: '',
      startTime: '', endTime: '',
    });
    setSelectedISDCode("+971"); // Reset ISD code
    setActiveTab('details');
  };
  const closeDesignationsModal = (e) => {
    if (e.target === e.currentTarget) {
      setShowDesignationsModal(false);
    }
  };
  const closeEmployeeTypesModal = (e) => {
    if (e.target === e.currentTarget) {
      setShowEmployeeTypesModal(false);
    }
  };
  const TabButton = ({ tabKey, label, icon }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tabKey)}
      style={{
        padding: '10px 20px',
        backgroundColor: activeTab === tabKey ? '#3498db' : '#ecf0f1',
        color: activeTab === tabKey ? '#fff' : '#2c3e50',
        border: 'none',
        borderRadius: '8px 8px 0 0',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: activeTab === tabKey ? '600' : 'normal',
        transition: 'background-color 0.3s',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
      }}
      disabled={loading}
    >
      {icon && icon} {label}
    </button>
  );
  // Conditional props for time inputs
  const getTimeInputProps = (isStart = true) => {
    if (!companyDetails || !isCompanyOvernight) {
      return isStart
        ? { min: companyDetails?.openingTime, max: companyDetails?.closingTime }
        : { min: formData.startTime || companyDetails?.openingTime, max: companyDetails?.closingTime };
    }
    return {}; // No min/max for overnight to allow flexible input
  };
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Fixed Back Button in Top-Left Corner - Matched from EmployeeList */}
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
      {/* Main Container - Matched from EmployeeList: maxWidth adjusted to 750px for form, margin 80px auto 20px */}
      <div style={{
        maxWidth: '750px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header with Title and Buttons - Matched structure from EmployeeList */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #3498db'
        }}>
          <div></div> {/* Empty left for balance - matched from EmployeeList */}
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
            {editingId ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#95a5a6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#7f8c8d')}
                disabled={loading}
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              form="employeeForm"
              disabled={loading}
              style={{
                padding: '10px 15px',
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.3s ease',
                fontWeight: '500'
              }}
              onMouseOver={(e) => !loading && (
                e.target.style.transform = 'translateY(-2px)',
                e.target.style.boxShadow = '0 6px 12px rgba(52, 152, 219, 0.4)'
              )}
              onMouseOut={(e) => !loading && (
                e.target.style.transform = 'translateY(0)',
                e.target.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.3)'
              )}
            >
              <FaSave /> {loading ? 'Processing...' : (editingId ? 'Update Employee' : 'Create Employee')}
            </button>
          </div>
        </div>
        {/* Error and Message - Matched from EmployeeList Alerts */}
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
        <form id="employeeForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '2px solid #bdc3c7' }}>
            <TabButton tabKey="details" label="Details" />
            <TabButton tabKey="salary" label="Salary" />
            <TabButton tabKey="schedule" label="Schedule" icon={<FaClock />} />
            <TabButton tabKey="credentials" label="Credentials" />
          </div>
          {/* Tab Content */}
          <div style={{ flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'details' && (
              <>
                {/* Personal Details */}
                <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px', marginBottom: '15px' }}>
                  <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Personal Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Full Name *</label>
                      <input type="text" name="name" placeholder="Full Name *" value={formData.name} onChange={handleChange} required style={{padding:'12px',border:'1px solid #bdc3c7',borderRadius:'8px',fontSize:'1rem',outline:'none',transition:'border-color 0.3s'}} onFocus={e=>e.target.style.borderColor='#3498db'} onBlur={e=>e.target.style.borderColor='#bdc3c7'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Phone Number *</label>
                      {/* Phone input with ISD dropdown */}
                      <div className="phone-input-group" style={{ display: 'flex', height: '42px', border: '1.5px solid #bdc3c7', borderRadius: '6px' }}>
                        <div className="isd-wrapper" style={{ position: 'relative' }}>
                          <button
                            className="isd-btn"
                            type="button"
                            onClick={() => setShowISDCodeDropdown(!showISDCodeDropdown)}
                            style={{
                              background: '#fff',
                              border: 'none',
                              borderRight: '1.5px solid #bdc3c7',
                              padding: '0 10px',
                              fontSize: '13px',
                              height: '100%',
                              width: '58px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            {selectedISDCode}
                          </button>
                          {showISDCodeDropdown && (
                            <ul className="isd-dropdown" style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              zIndex: 1050,
                              background: '#fff',
                              border: '1.5px solid #bdc3c7',
                              borderRadius: '6px',
                              listStyle: 'none',
                              margin: '2px 0 0',
                              padding: '6px 0',
                              minWidth: '140px',
                              maxHeight: '220px',
                              overflowY: 'auto',
                              boxShadow: '0 4px 12px rgba(0,0,0,.15)'
                            }}>
                              {isdCodes.map((c, i) => (
                                <li key={i}>
                                  <button
                                    className="dropdown-item"
                                    type="button"
                                    onClick={() => handleISDCodeSelect(c.code)}
                                    style={{
                                      width: '100%',
                                      padding: '8px 14px',
                                      border: 'none',
                                      background: 'none',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      fontSize: '13px'
                                    }}
                                  >
                                    {c.code} ({c.country})
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder={`${getMaxDigits()}-digit Phone Number`}
                          value={formData.phoneNumber}
                          onChange={handlePhoneNumberChange}
                          style={{
                            flex: 1,
                            padding: '0 12px',
                            fontSize: '13px'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} style={{padding:'12px',border:'1px solid #bdc3c7',borderRadius:'8px',fontSize:'1rem',outline:'none',backgroundColor:'#fff',transition:'border-color 0.3s'}} onFocus={e=>e.target.style.borderColor='#3498db'} onBlur={e=>e.target.style.borderColor='#bdc3c7'}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Date of Birth</label>
                      <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} style={{padding:'12px',border:'1px solid #bdc3c7',borderRadius:'8px',fontSize:'1rem',outline:'none',transition:'border-color 0.3s'}} onFocus={e=>e.target.style.borderColor='#3498db'} onBlur={e=>e.target.style.borderColor='#bdc3c7'} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
                    <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Email *</label>
                    <input type="email" name="email" placeholder="Email *" value={formData.email} onChange={handleChange} required style={{width:'100%',padding:'12px',border:'1px solid #bdc3c7',borderRadius:'8px',fontSize:'1rem',outline:'none',transition:'border-color 0.3s'}} onFocus={e=>e.target.style.borderColor='#3498db'} onBlur={e=>e.target.style.borderColor='#bdc3c7'} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
                    <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Address *</label>
                    <textarea name="address" placeholder="Address *" value={formData.address} onChange={handleChange} rows={3} required style={{width:'100%',padding:'12px',border:'1px solid #bdc3c7',borderRadius:'8px',fontSize:'1rem',outline:'none',resize:'vertical',transition:'border-color 0.3s'}} onFocus={e=>e.target.style.borderColor='#3498db'} onBlur={e=>e.target.style.borderColor='#bdc3c7'} />
                  </div>
                </div>
                {/* Employment Details */}
                <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Employment Details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Employee Designation *</label>
                    <select name="employeeDesignation" value={formData.employeeDesignation} onChange={handleDesignationChange} required style={{width:'100%',padding:'12px',border:'1px solid #bdc3c7',borderRadius:'8px',fontSize:'1rem',outline:'none',backgroundColor:'#fff',transition:'border-color 0.3s'}} onFocus={e=>e.target.style.borderColor='#3498db'} onBlur={e=>e.target.style.borderColor='#bdc3c7'}>
                      <option value="">Select Employee Designation *</option>
                      {employeeDesignations.map(designation => (<option key={designation.id} value={designation.name}>{designation.name}</option>))} {/* Only designations */}
                      <option value="create_new">+ Create New Employee Designation</option>
                    </select>
                    {showCreateDesignation && (
                      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input type="text" placeholder="New Designation Name" value={newDesignationName} onChange={(e) => setNewDesignationName(e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #bdc3c7', borderRadius: '4px' }} />
                        <button type="button" onClick={handleCreateNewDesignation} style={{ padding: '8px 12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} disabled={loading || !newDesignationName.trim()}>Save</button>
                      </div>
                    )}
                    <button type="button" onClick={openDesignationsModal} style={{ marginTop: '5px', padding: '5px 10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }} disabled={loading}>
                      Manage Designations
                    </button>
                  </div>
                  {/* Employee Type Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', marginTop: '15px' }}>
                    <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Employee Type *</label>
                    <select name="employeeType" value={formData.employeeType} onChange={handleEmployeeTypeChange} required style={{width:'100%',padding:'12px',border:'1px solid #bdc3c7',borderRadius:'8px',fontSize:'1rem',outline:'none',backgroundColor:'#fff',transition:'border-color 0.3s'}} onFocus={e=>e.target.style.borderColor='#3498db'} onBlur={e=>e.target.style.borderColor='#bdc3c7'}>
                      <option value="">Select Employee Type *</option>
                      {employeeTypes.map(typeItem => (<option key={typeItem.id} value={typeItem.name}>{typeItem.name}</option>))} {/* Only types */}
                      <option value="create_new">+ Create New Employee Type</option>
                    </select>
                    {showCreateEmployeeType && (
                      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input type="text" placeholder="New Employee Type Name" value={newEmployeeTypeName} onChange={(e) => setNewEmployeeTypeName(e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #bdc3c7', borderRadius: '4px' }} />
                        <button type="button" onClick={handleCreateNewEmployeeType} style={{ padding: '8px 12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} disabled={loading || !newEmployeeTypeName.trim()}>Save</button>
                      </div>
                    )}
                    <button type="button" onClick={openEmployeeTypesModal} style={{ marginTop: '5px', padding: '5px 10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }} disabled={loading}>
                      Manage Employee Types
                    </button>
                  </div>
                </div>
              </>
            )}
            {/* Salary Tab - Bank Details are OPTIONAL (no 'required' attribute) */}
            {activeTab === 'salary' && (
              <>
                <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px', marginBottom: '15px' }}>
                  <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Bank Details (Optional - Can be updated later)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Bank Name</label>
                      <input type="text" name="bankName" placeholder="Bank Name (Optional)" value={formData.bankName} onChange={handleChange} style={{padding:'12px',border:'1px solid #bdc3c7',borderRadius:'8px',fontSize:'1rem',outline:'none',transition:'border-color 0.3s'}} onFocus={e=>e.target.style.borderColor='#3498db'} onBlur={e=>e.target.style.borderColor='#bdc3c7'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Account Holder Name</label>
                      <input type="text" name="accountHolderName" placeholder="Account Holder Name (Optional)" value={formData.accountHolderName} onChange={handleChange} style={{padding:'12px',border:'1px solid #bdc3c7',borderRadius:'8px',fontSize:'1rem',outline:'none',transition:'border-color 0.3s'}} onFocus={e=>e.target.style.borderColor='#3498db'} onBlur={e=>e.target.style.borderColor='#bdc3c7'} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Account Number</label>
                      <input type="text" name="accountNumber" placeholder="Account Number (Optional)" value={formData.accountNumber} onChange={handleChange} style={{padding:'12px',border:'1px solid #bdc3c7',borderRadius:'8px',fontSize:'1rem',outline:'none',transition:'border-color 0.3s'}} onFocus={e=>e.target.style.borderColor='#3498db'} onBlur={e=>e.target.style.borderColor='#bdc3c7'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>IFSC Code</label>
                      <input type="text" name="ifscCode" placeholder="IFSC Code (Optional)" value={formData.ifscCode} onChange={handleChange} style={{padding:'12px',border:'1px solid #bdc3c7',borderRadius:'8px',fontSize:'1rem',outline:'none',transition:'border-color 0.3s'}} onFocus={e=>e.target.style.borderColor='#3498db'} onBlur={e=>e.target.style.borderColor='#bdc3c7'} />
                    </div>
                  </div>
                </div>
                <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Salary</h3>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Salary (Monthly) *</label>
                    <input type="number" name="salary" placeholder="Salary (Monthly) *" value={formData.salary} onChange={handleChange} min="0" step="0.01" required style={{width:'100%',padding:'12px',border:'1px solid #bdc3c7',borderRadius:'8px',fontSize:'1rem',outline:'none',transition:'border-color 0.3s'}} onFocus={e=>e.target.style.borderColor='#3498db'} onBlur={e=>e.target.style.borderColor='#bdc3c7'} />
                  </div>
                </div>
              </>
            )}
            {activeTab === 'schedule' && (
              <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px' }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Employee Schedule</h3>
                {companyDetails ? (
                  <>
                    <div style={{marginBottom:'20px',padding:'15px',backgroundColor:'#f8f9fa',borderRadius:'8px',border:'1px solid #dee2e6',textAlign:'center'}}>
                      <strong>Company Operating Hours:</strong><br />
                      {companyDetails.openingTime} - {companyDetails.closingTime}
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#6c757d' }}>
                        {isCompanyOvernight ? 'Overnight operation: Shifts can span midnight.' : 'Employee shifts must be within these hours.'}
                      </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>Start Time *</label>
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleChange}
                          {...getTimeInputProps(true)}
                          required
                          style={{width:'100%',padding:'12px',border:'1px solid #bdc3c7',borderRadius:'8px',fontSize:'1rem',outline:'none',transition:'border-color 0.3s',backgroundColor:'#fff'}}
                          onFocus={e=>e.target.style.borderColor='#3498db'}
                          onBlur={e=>e.target.style.borderColor='#bdc3c7'}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>End Time *</label>
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleChange}
                          {...getTimeInputProps(false)}
                          required
                          style={{width:'100%',padding:'12px',border:'1px solid #bdc3c7',borderRadius:'8px',fontSize:'1rem',outline:'none',transition:'border-color 0.3s',backgroundColor:'#fff'}}
                          onFocus={e=>e.target.style.borderColor='#3498db'}
                          onBlur={e=>e.target.style.borderColor='#bdc3c7'}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                    <FaClock style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.5 }} />
                    <p>Loading company schedule... Please ensure company details are configured.</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'credentials' && (
              <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px' }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Login Credentials</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Username *</label>
                    <input type="text" name="username" placeholder="Username *" value={formData.username} onChange={handleChange} required style={{padding:'12px',border:'1px solid #bdc3c7',borderRadius:'8px',fontSize:'1rem',outline:'none',transition:'border-color 0.3s'}} onFocus={e=>e.target.style.borderColor='#3498db'} onBlur={e=>e.target.style.borderColor='#bdc3c7'} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Password {editingId ? "(leave blank to keep current)" : "*" }</label>
                    <input type="password" name="password" placeholder={editingId ? "New Password (leave blank to keep current)" : "Password *"} value={formData.password} onChange={handleChange} required={!editingId} style={{padding:'12px',border:'1px solid #bdc3c7',borderRadius:'8px',fontSize:'1rem',outline:'none',transition:'border-color 0.3s'}} onFocus={e=>e.target.style.borderColor='#3498db'} onBlur={e=>e.target.style.borderColor='#bdc3c7'} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
      {/* Centered Notification Modal */}
      {showNotification && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000
          }}
          onClick={() => setShowNotification(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '30px',
              borderRadius: '15px',
              textAlign: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              maxWidth: '450px',
              width: '90%',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                color: notificationType === 'success' ? '#27ae60' : '#e74c3c',
                fontSize: '1.5rem',
                marginBottom: '15px',
                fontWeight: 'bold'
              }}
            >
              {notificationType === 'success' ? 'Success!' : 'Error!'}
            </div>
            <p style={{ margin: 0, color: '#2c3e50', fontSize: '1rem', lineHeight: '1.5' }}>
              {notificationMessage}
            </p>
            {notificationType === 'error' && (
              <button
                onClick={() => setShowNotification(false)}
                style={{
                  marginTop: '20px',
                  padding: '12px 24px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#2980b9')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#3498db')}
              >
                OK
              </button>
            )}
          </div>
        </div>
      )}
      {/* Manage Designations Modal */}
      {showDesignationsModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000}} onClick={closeDesignationsModal}>
          <div style={{backgroundColor:'#fff',padding:'20px',borderRadius:'10px',maxWidth:'400px',width:'90%',maxHeight:'80vh',overflowY:'auto',boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}>
            <h3 style={{ marginBottom: '15px' }}>Manage Employee Designations</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="text" placeholder="New Designation Name" value={newDesignationName} onChange={(e) => setNewDesignationName(e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #bdc3c7', borderRadius: '4px' }} />
              <button onClick={handleCreateNewDesignation} style={{ padding: '8px 12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} disabled={loading || !newDesignationName.trim()}>
                <FaPlus />
              </button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {employeeDesignations.map(designation => (
                <li key={designation.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
                  {editingDesignationId === designation.id ? (
                    <>
                      <input type="text" value={editDesignationName} onChange={(e) => setEditDesignationName(e.target.value)} style={{ flex: '1', padding: '5px', border: '1px solid #bdc3c7', borderRadius: '4px' }} />
                      <button onClick={handleUpdateDesignation} style={{ marginLeft: '5px', padding: '5px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px' }} disabled={!editDesignationName.trim() || loading}>Save</button>
                      <button onClick={() => { setEditingDesignationId(null); setEditDesignationName(''); }} style={{ marginLeft: '5px', padding: '5px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px' }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <span>{designation.name}</span>
                      <div>
                        <button onClick={() => handleEditDesignation(designation)} style={{ marginRight: '5px', padding: '5px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} disabled={loading}>
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDeleteDesignation(designation.id)} style={{ padding: '5px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} disabled={loading}>
                          <FaTrash />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
            {employeeDesignations.length === 0 && <p style={{ textAlign: 'center', color: '#6c757d' }}>No designations yet. Create one above.</p>}
            <button onClick={() => setShowDesignationsModal(false)} style={{ marginTop: '15px', width: '100%', padding: '10px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }} disabled={loading}>
              Close
            </button>
          </div>
        </div>
      )}
      {/* Manage Employee Types Modal */}
      {showEmployeeTypesModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000}} onClick={closeEmployeeTypesModal}>
          <div style={{backgroundColor:'#fff',padding:'20px',borderRadius:'10px',maxWidth:'400px',width:'90%',maxHeight:'80vh',overflowY:'auto',boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}>
            <h3 style={{ marginBottom: '15px' }}>Manage Employee Types</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="text" placeholder="New Employee Type Name" value={newEmployeeTypeName} onChange={(e) => setNewEmployeeTypeName(e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #bdc3c7', borderRadius: '4px' }} />
              <button onClick={handleCreateNewEmployeeType} style={{ padding: '8px 12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} disabled={loading || !newEmployeeTypeName.trim()}>
                <FaPlus />
              </button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {employeeTypes.map(typeItem => (
                <li key={typeItem.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
                  {editingEmployeeTypeId === typeItem.id ? (
                    <>
                      <input type="text" value={editEmployeeTypeName} onChange={(e) => setEditEmployeeTypeName(e.target.value)} style={{ flex: '1', padding: '5px', border: '1px solid #bdc3c7', borderRadius: '4px' }} />
                      <button onClick={handleUpdateEmployeeType} style={{ marginLeft: '5px', padding: '5px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px' }} disabled={!editEmployeeTypeName.trim() || loading}>Save</button>
                      <button onClick={() => { setEditingEmployeeTypeId(null); setEditEmployeeTypeName(''); }} style={{ marginLeft: '5px', padding: '5px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px' }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <span>{typeItem.name}</span>
                      <div>
                        <button onClick={() => handleEditEmployeeType(typeItem)} style={{ marginRight: '5px', padding: '5px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} disabled={loading}>
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDeleteEmployeeType(typeItem.id)} style={{ padding: '5px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} disabled={loading}>
                          <FaTrash />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
            {employeeTypes.length === 0 && <p style={{ textAlign: 'center', color: '#6c757d' }}>No employee types yet. Create one above.</p>}
            <button onClick={() => setShowEmployeeTypesModal(false)} style={{ marginTop: '15px', width: '100%', padding: '10px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }} disabled={loading}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddEmployee;