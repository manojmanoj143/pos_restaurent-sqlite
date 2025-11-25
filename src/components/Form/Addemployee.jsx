// src/components/Form/Addemployee.jsx (updated: Added Gender, Date of Birth in Personal Details; Added Bank Details in Salary tab; Employee ID generated in backend; Fixed tab content height consistency; Added Schedule tab with employee time assignment within company operating hours; Ensured startTime and endTime are saved and fetched correctly)
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
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'salary', 'schedule', 'credentials'
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [showCreateType, setShowCreateType] = useState(false);
  const [showTypesModal, setShowTypesModal] = useState(false);
  const [deletingType, setDeletingType] = useState(null); // Track if deleting type
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newTypeName, setNewTypeName] = useState('');

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

  // Handle editing from navigation state (from EmployeeList)
  useEffect(() => {
    if (location.state?.editingEmployee) {
      const emp = location.state.editingEmployee;
      setEditingId(emp._id);
      setFormData({
        ...emp,
        password: '', // Clear password for security
      });
    }
  }, [location.state]);

  // Fetch types and company details when baseUrl is set
  useEffect(() => {
    if (baseUrl !== undefined) {
      fetchEmployeeTypes();
      fetchCompanyDetails();
    }
  }, [baseUrl]);

  const fetchEmployeeTypes = async () => {
    try {
      const url = baseUrl ? `${baseUrl}/api/employee-types` : '/api/employee-types';
      const response = await axios.get(url);
      setEmployeeTypes(response.data);
    } catch (err) {
      console.error('Error fetching employee types:', err);
      setError('Failed to fetch employee types. Please try again.');
    }
  };

  const fetchCompanyDetails = async () => {
    try {
      const url = baseUrl ? `${baseUrl}/api/company-details` : '/api/company-details';
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleTypeChange = (e) => {
    const value = e.target.value;
    if (value === 'create_new') {
      setShowCreateType(true);
    } else {
      setFormData(prev => ({ ...prev, employeeType: value }));
      setShowCreateType(false);
      setNewTypeName('');
    }
  };

  const handleCreateNewType = async () => {
    if (!newTypeName.trim()) {
      setError('Please enter a type name.');
      return;
    }
    try {
      setLoading(true);
      const url = baseUrl ? `${baseUrl}/api/employee-types` : '/api/employee-types';
      const response = await axios.post(url, { name: newTypeName.trim() });
      const newType = response.data;
      setEmployeeTypes(prev => [...prev, newType]);
      setFormData(prev => ({ ...prev, employeeType: newType.name }));
      setShowCreateType(false);
      setNewTypeName('');
      setMessage('New employee type created successfully!');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create type.');
    } finally {
      setLoading(false);
    }
  };

  const openTypesModal = () => setShowTypesModal(true);

  const handleEditType = (type) => {
    setEditingTypeId(type.id);
    setEditTypeName(type.name);
  };

  const handleUpdateType = async () => {
    if (!editTypeName.trim()) {
      setError('Please enter a type name.');
      return;
    }
    try {
      setLoading(true);
      const url = baseUrl ? `${baseUrl}/api/employee-types/${editingTypeId}` : `/api/employee-types/${editingTypeId}`;
      await axios.put(url, { name: editTypeName.trim() });
      setEmployeeTypes(prev => prev.map(t => t.id === editingTypeId ? { ...t, name: editTypeName.trim() } : t));
      setEditingTypeId(null);
      setEditTypeName('');
      setMessage('Employee type updated successfully!');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update type.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteType = (typeId) => {
    setDeletingType('type');
    setEditingTypeId(typeId); // Use editingTypeId temporarily for delete ID
    setShowTypesModal(false); // Close modal temporarily
    // Note: No separate confirm modal for type delete; handle directly or adjust as needed
    // For now, assuming direct delete; if confirm needed, add state
    confirmDeleteType();
  };

  const confirmDeleteType = async () => {
    try {
      const typeId = editingTypeId;
      const url = baseUrl ? `${baseUrl}/api/employee-types/${typeId}` : `/api/employee-types/${typeId}`;
      await axios.delete(url);
      setEmployeeTypes(prev => prev.filter(t => t.id !== typeId));
      setMessage('Employee type deleted successfully!');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete type.');
    } finally {
      setEditingTypeId(null);
      setDeletingType(null);
      setShowTypesModal(true); // Reopen modal
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (baseUrl === undefined) {
      setError('Server configuration not available. Please check your connection.');
      return;
    }
    // Basic validation
    if (!formData.name || !formData.phoneNumber || !formData.email || !formData.address ||
        !formData.employeeType || !formData.salary || !formData.username || (!formData.password && !editingId) ||
        !formData.startTime || !formData.endTime) {
      setError('Please fill in all required fields.');
      return;
    }
    if (formData.salary && (isNaN(formData.salary) || parseFloat(formData.salary) < 0)) {
      setError('Salary must be a valid positive number.');
      return;
    }
    // Schedule validation
    if (companyDetails && formData.startTime && formData.endTime) {
      const openingTime = companyDetails.openingTime;
      const closingTime = companyDetails.closingTime;
      const start = formData.startTime;
      const end = formData.endTime;
      if (start < openingTime || start > closingTime || end < openingTime || end > closingTime || end <= start) {
        setError('Employee shift times must be within company operating hours (' + openingTime + ' - ' + closingTime + ') and end after start time.');
        return;
      }
    }
    setLoading(true);
    setMessage('');
    setError('');
    try {
      let url = baseUrl ? `${baseUrl}/api/add-employee` : '/api/add-employee';
      let method = 'post';
      let dataToSend = { ...formData };
      if (editingId) {
        url += `/${editingId}`;
        method = 'put';
        // If password is empty, remove it from dataToSend
        if (!dataToSend.password) {
          delete dataToSend.password;
        }
      }
      console.log('Sending request to', url, 'with method:', method, 'data:', dataToSend);
      const response = await axios({
        method,
        url,
        data: dataToSend,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      console.log('Employee operation successful. Response:', response.data);
      setMessage(editingId ? 'Employee updated successfully!' : 'Employee created successfully!');
      // Reset form
      setFormData({
        name: '',
        phoneNumber: '',
        gender: '',
        dateOfBirth: '',
        email: '',
        address: '',
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
      setEditingId(null);
      // Refetch types and company details
      await fetchEmployeeTypes();
      await fetchCompanyDetails();
      // Optionally navigate back after a delay
      if (!editingId) {
        setTimeout(() => {
          navigate('/employee-list'); // Optionally change to employee list if desired; currently to ''
        }, 2000);
      }
    } catch (err) {
      console.error('Employee operation failed:', err);
      setError(
        err.response?.data?.error ||
        `Failed to ${editingId ? 'update' : 'create'} employee: ${err.response?.status || 'Unknown'} - ${err.response?.statusText || err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      phoneNumber: '',
      gender: '',
      dateOfBirth: '',
      email: '',
      address: '',
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
    setActiveTab('details');
  };

  const closeTypesModal = (e) => {
    if (e.target === e.currentTarget) {
      setShowTypesModal(false);
    }
  };

  const TabButton = ({ tabKey, label, onClick, icon }) => (
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

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#f4f6f9',
      padding: '0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px',
        minHeight: '700px', // Fixed min-height to prevent box resizing on tab switch
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        position: 'relative'
      }}>
        {/* Header with Back, Title, and Create/Update Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
          <h2 style={{
            color: '#2c3e50',
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: '600'
          }}>
            <FaUserTie style={{ marginRight: '10px', color: '#3498db' }} />
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
                backgroundColor: loading ? '#bdc3c7' : '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'background-color 0.3s',
                fontWeight: '500'
              }}
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#2980b9')}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#3498db')}
            >
              <FaSave /> {loading ? 'Processing...' : (editingId ? 'Update Employee' : 'Create Employee')}
            </button>
          </div>
        </div>
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
        <form id="employeeForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '2px solid #bdc3c7' }}>
            <TabButton tabKey="details" label="Details" onClick={() => {}} />
            <TabButton tabKey="salary" label="Salary" onClick={() => {}} />
            <TabButton tabKey="schedule" label="Schedule" icon={<FaClock />} onClick={() => {}} />
            <TabButton tabKey="credentials" label="Credentials" onClick={() => {}} />
          </div>
          {/* Tab Content - Fixed height to prevent resizing */}
          <div style={{ flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'details' && (
              <>
                {/* Personal Details Section */}
                <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px', marginBottom: '15px' }}>
                  <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Personal Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name *"
                      value={formData.name}
                      onChange={handleChange}
                      style={{
                        padding: '12px',
                        border: '1px solid #bdc3c7',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#3498db')}
                      onBlur={(e) => (e.target.style.borderColor = '#bdc3c7')}
                      required
                    />
                    <input
                      type="tel"
                      name="phoneNumber"
                      placeholder="Phone Number *"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      style={{
                        padding: '12px',
                        border: '1px solid #bdc3c7',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#3498db')}
                      onBlur={(e) => (e.target.style.borderColor = '#bdc3c7')}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      style={{
                        padding: '12px',
                        border: '1px solid #bdc3c7',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        backgroundColor: '#fff',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#3498db')}
                      onBlur={(e) => (e.target.style.borderColor = '#bdc3c7')}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      style={{
                        padding: '12px',
                        border: '1px solid #bdc3c7',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#3498db')}
                      onBlur={(e) => (e.target.style.borderColor = '#bdc3c7')}
                    />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email *"
                    value={formData.email}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginTop: '10px',
                      border: '1px solid #bdc3c7',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#3498db')}
                    onBlur={(e) => (e.target.style.borderColor = '#bdc3c7')}
                    required
                  />
                  <textarea
                    name="address"
                    placeholder="Address *"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginTop: '10px',
                      border: '1px solid #bdc3c7',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none',
                      resize: 'vertical',
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#3498db')}
                    onBlur={(e) => (e.target.style.borderColor = '#bdc3c7')}
                    required
                  />
                </div>
                {/* Employment Details Section (Only Type) */}
                <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Employment Details</h3>
                  <div>
                    <select
                      name="employeeType"
                      value={formData.employeeType}
                      onChange={handleTypeChange}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #bdc3c7',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        backgroundColor: '#fff',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#3498db')}
                      onBlur={(e) => (e.target.style.borderColor = '#bdc3c7')}
                      required
                    >
                      <option value="">Select Employee Type *</option>
                      {employeeTypes.map(type => (
                        <option key={type.id} value={type.name}>{type.name}</option>
                      ))}
                      <option value="create_new">+ Create New Employee Type</option>
                    </select>
                    {showCreateType && (
                      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="New Type Name"
                          value={newTypeName}
                          onChange={(e) => setNewTypeName(e.target.value)}
                          style={{ flex: 1, padding: '8px', border: '1px solid #bdc3c7', borderRadius: '4px' }}
                        />
                        <button
                          type="button"
                          onClick={handleCreateNewType}
                          style={{ padding: '8px 12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          disabled={loading || !newTypeName.trim()}
                        >
                          Save
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={openTypesModal}
                      style={{ marginTop: '5px', padding: '5px 10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                      disabled={loading}
                    >
                      Manage Types
                    </button>
                  </div>
                </div>
              </>
            )}
            {activeTab === 'salary' && (
              <>
                {/* Bank Details Section */}
                <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px', marginBottom: '15px' }}>
                  <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Bank Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      name="bankName"
                      placeholder="Bank Name"
                      value={formData.bankName}
                      onChange={handleChange}
                      style={{
                        padding: '12px',
                        border: '1px solid #bdc3c7',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#3498db')}
                      onBlur={(e) => (e.target.style.borderColor = '#bdc3c7')}
                    />
                    <input
                      type="text"
                      name="accountHolderName"
                      placeholder="Account Holder Name"
                      value={formData.accountHolderName}
                      onChange={handleChange}
                      style={{
                        padding: '12px',
                        border: '1px solid #bdc3c7',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#3498db')}
                      onBlur={(e) => (e.target.style.borderColor = '#bdc3c7')}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <input
                      type="text"
                      name="accountNumber"
                      placeholder="Account Number"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      style={{
                        padding: '12px',
                        border: '1px solid #bdc3c7',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#3498db')}
                      onBlur={(e) => (e.target.style.borderColor = '#bdc3c7')}
                    />
                    <input
                      type="text"
                      name="ifscCode"
                      placeholder="IFSC Code"
                      value={formData.ifscCode}
                      onChange={handleChange}
                      style={{
                        padding: '12px',
                        border: '1px solid #bdc3c7',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#3498db')}
                      onBlur={(e) => (e.target.style.borderColor = '#bdc3c7')}
                    />
                  </div>
                </div>
                {/* Salary Section */}
                <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Salary</h3>
                  <input
                    type="number"
                    name="salary"
                    placeholder="Salary (Monthly) *"
                    value={formData.salary}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #bdc3c7',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#3498db')}
                    onBlur={(e) => (e.target.style.borderColor = '#bdc3c7')}
                    required
                  />
                </div>
              </>
            )}
            {activeTab === 'schedule' && (
              <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px' }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Employee Schedule</h3>
                {companyDetails ? (
                  <>
                    {/* Company Operating Hours Display */}
                    <div style={{
                      marginBottom: '20px',
                      padding: '15px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #dee2e6',
                      textAlign: 'center'
                    }}>
                      <strong>Company Operating Hours:</strong><br />
                      {companyDetails.openingTime} - {companyDetails.closingTime}
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#6c757d' }}>
                        Employee shifts must be within these hours.
                      </p>
                    </div>
                    {/* Employee Shift Times */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>Start Time *</label>
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleChange}
                          min={companyDetails.openingTime}
                          max={companyDetails.closingTime}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #bdc3c7',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'border-color 0.3s',
                            backgroundColor: '#fff'
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#3498db')}
                          onBlur={(e) => (e.target.style.borderColor = '#bdc3c7')}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>End Time *</label>
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleChange}
                          min={formData.startTime || companyDetails.openingTime}
                          max={companyDetails.closingTime}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #bdc3c7',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'border-color 0.3s',
                            backgroundColor: '#fff'
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#3498db')}
                          onBlur={(e) => (e.target.style.borderColor = '#bdc3c7')}
                          required
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
                  <input
                    type="text"
                    name="username"
                    placeholder="Username *"
                    value={formData.username}
                    onChange={handleChange}
                    style={{
                      padding: '12px',
                      border: '1px solid #bdc3c7',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#3498db')}
                    onBlur={(e) => (e.target.style.borderColor = '#bdc3c7')}
                    required
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder={editingId ? "New Password (leave blank to keep current)" : "Password *"}
                    value={formData.password}
                    onChange={handleChange}
                    style={{
                      padding: '12px',
                      border: '1px solid #bdc3c7',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#3498db')}
                    onBlur={(e) => (e.target.style.borderColor = '#bdc3c7')}
                    required={!editingId}
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
      {/* Manage Types Modal - Fixed centering with no blur overlay */}
      {showTypesModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'transparent', // No blur/dimming
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={closeTypesModal}
        >
          <div style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '10px',
            maxWidth: '400px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginBottom: '15px' }}>Manage Employee Types</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="New Type Name"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                style={{ flex: 1, padding: '8px', border: '1px solid #bdc3c7', borderRadius: '4px' }}
              />
              <button
                onClick={handleCreateNewType}
                style={{ padding: '8px 12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                disabled={loading || !newTypeName.trim()}
              >
                <FaPlus />
              </button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {employeeTypes.map(type => (
                <li key={type.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
                  {editingTypeId === type.id ? (
                    <>
                      <input
                        type="text"
                        value={editTypeName}
                        onChange={(e) => setEditTypeName(e.target.value)}
                        style={{ flex: 1, padding: '5px', border: '1px solid #bdc3c7', borderRadius: '4px' }}
                      />
                      <button onClick={handleUpdateType} style={{ marginLeft: '5px', padding: '5px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px' }} disabled={!editTypeName.trim() || loading}>
                        Save
                      </button>
                      <button onClick={() => { setEditingTypeId(null); setEditTypeName(''); }} style={{ marginLeft: '5px', padding: '5px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px' }}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span>{type.name}</span>
                      <div>
                        <button onClick={() => handleEditType(type)} style={{ marginRight: '5px', padding: '5px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} disabled={loading}>
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDeleteType(type.id)} style={{ padding: '5px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} disabled={loading}>
                          <FaTrash />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
            {employeeTypes.length === 0 && <p style={{ textAlign: 'center', color: '#6c757d' }}>No types yet. Create one above.</p>}
            <button onClick={() => setShowTypesModal(false)} style={{ marginTop: '15px', width: '100%', padding: '10px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }} disabled={loading}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddEmployee;