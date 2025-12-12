import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaUserTie, FaArrowLeft, FaSave, FaPlus, FaTimes, FaUsersCog, FaUpload, FaUser, FaIdCard, FaBriefcase, FaGraduationCap, FaStethoscope, FaUsers } from 'react-icons/fa';

const AddEmployee = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    dateOfJoining: '',
    company: 'POS 8',
    status: 'Active',
    salutation: '',
    maritalStatus: '',
    idNumber: '',
    idExpiry: '',
    address: '',
    employeeDesignation: '',
    employeeType: '',
    basicSalary: '',
    hra: '',
    ta: '',
    oa: '',
    totalSalary: '',
    username: '',
    password: '',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    nationality: '',
    education: '',
    previousExperience: '',
    skills: '',
    healthInfo: '',
    familyDetails: '',
    profileImage: '',
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
    '+91': 10,
    '+1': 10,
    '+44': 10,
    '+971': 9,
    '+61': 9,
  };
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'personal', 'employment', 'salary', 'professional', 'other', 'credentials'
  const [employeeDesignations, setEmployeeDesignations] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  // New states for centered notification modal
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  // NEW: Confirmation modal before submit
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [editingId, setEditingId] = useState(null);
  // NEW: For image upload
  const [imagePreview, setImagePreview] = useState(null);
  const [isEditingDraft, setIsEditingDraft] = useState(false); // Fix for ReferenceError
  // Company options (for multi-company; can fetch from API if needed)
  const companyOptions = ['POS 8', 'POS 9', 'Company A', 'Company B']; // Example
  // Status options
  const statusOptions = ['Active', 'Inactive'];
  // Salutation options
  const salutationOptions = ['', 'Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];
  // Marital Status options
  const maritalOptions = ['', 'Single', 'Married', 'Divorced', 'Widowed'];
  // Nationality options (example; can be select or text)
  const nationalityOptions = ['', 'Indian', 'American', 'British', 'Emirati', 'Australian', 'Other'];
  // Gender options
  const genderOptions = ['', 'Male', 'Female', 'Other'];
  // NEW: Compute total salary when components change
  useEffect(() => {
    const basic = parseFloat(formData.basicSalary) || 0;
    const hra = parseFloat(formData.hra) || 0;
    const ta = parseFloat(formData.ta) || 0;
    const oa = parseFloat(formData.oa) || 0;
    const total = basic + hra + ta + oa;
    setFormData(prev => ({ ...prev, totalSalary: total.toFixed(2) }));
  }, [formData.basicSalary, formData.hra, formData.ta, formData.oa]);
  // Fetch baseUrl on component mount - NEW: Consistent with EmployeeList.jsx
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/network_info");
        const { config: appConfig } = response.data;
        if (appConfig.mode === "client") {
          setBaseUrl(`http://${appConfig.server_ip}:8000`);
        } else {
          setBaseUrl(`http://localhost:8000`);
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
        setBaseUrl(`http://localhost:8000`);
      }
    };
    fetchConfig();
  }, []);
  // Fetch employee designations and types when baseUrl changes
  useEffect(() => {
    if (baseUrl) {
      fetchEmployeeDesignations();
      fetchEmployeeTypes();
    }
  }, [baseUrl]);
  // Handle editing from navigation state (for finalized employees)
  useEffect(() => {
    if (location.state?.editingEmployee) {
      const emp = location.state.editingEmployee;
      setEditingId(emp._id);
      setIsEditingDraft(false);
      setFormData({
        ...emp,
        password: '',
        // Parse phone if needed
      });
      // Set image preview
      if (emp.profileImage) {
        setImagePreview(emp.profileImage.startsWith('data:') ? emp.profileImage : null);
      }
      // Parse phone
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
  const fetchEmployeeDesignations = async () => {
    try {
      const url = `${baseUrl}/api/employee-designations`;
      const response = await axios.get(url);
      setEmployeeDesignations(response.data);
    } catch (err) {
      console.error('Error fetching employee designations:', err);
      setError('Failed to fetch employee designations. Please try again.');
    }
  };
  const fetchEmployeeTypes = async () => {
    try {
      const url = `${baseUrl}/api/employee-types`;
      const response = await axios.get(url);
      setEmployeeTypes(response.data);
    } catch (err) {
      console.error('Error fetching employee types:', err);
      setError('Failed to fetch employee types. Please try again.');
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };
  // NEW: Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profileImage: reader.result })); // Base64
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleISDCodeSelect = (code) => {
    setSelectedISDCode(code);
    setShowISDCodeDropdown(false);
  };
  const handlePhoneNumberChange = (e) => {
    const v = e.target.value.replace(/\D/g, "");
    const maxDigits = digitLengths[selectedISDCode] || 10;
    if (v.length <= maxDigits) {
      setFormData(prev => ({ ...prev, phoneNumber: v }));
    }
  };
  const getMaxDigits = () => digitLengths[selectedISDCode] || 10;
  const handleDesignationChange = (e) => {
    const value = e.target.value;
    if (value === 'create_new') {
      navigate('/employee-designations');
    } else {
      setFormData(prev => ({ ...prev, employeeDesignation: value }));
    }
  };
  const handleEmployeeTypeChange = (e) => {
    const value = e.target.value;
    if (value === 'create_new') {
      navigate('/employee-types');
    } else {
      setFormData(prev => ({ ...prev, employeeType: value }));
    }
  };
  // Validation - Full for submit
  const validateForm = () => {
    if (!baseUrl || baseUrl === '') {
      setError('Server configuration not available. Please check your connection.');
      return false;
    }
    // Minimal required fields
    const required = ['name', 'phoneNumber', 'email', 'address', 'employeeDesignation', 'employeeType', 'username'];
    if (editingId) {
      // For edit finalized, password optional
    } else {
      required.push('password');
    }
    if (!required.every(field => formData[field])) {
      setError('Please fill in all required fields: Name, Phone, Email, Address, Designation, Type, Username' + (required.includes('password') ? ', Password' : '') + '.');
      return false;
    }
    // Validate salary fields only if provided (optional now)
    const salaryFields = ['basicSalary', 'hra', 'ta', 'oa'];
    for (const field of salaryFields) {
      if (formData[field] && (isNaN(formData[field]) || parseFloat(formData[field]) < 0)) {
        setError(`${field.replace(/([A-Z])/g, ' $1').toUpperCase()} must be a valid positive number if provided.`);
        return false;
      }
    }
    const phoneMaxDigits = getMaxDigits();
    if (formData.phoneNumber.length !== phoneMaxDigits) {
      setError(`Phone number must be exactly ${phoneMaxDigits} digits.`);
      return false;
    }
    // Date validations only if provided
    const dates = ['dateOfBirth', 'dateOfJoining', 'idExpiry'];
    for (const dateField of dates) {
      if (formData[dateField]) {
        const date = new Date(formData[dateField]);
        if (isNaN(date.getTime())) {
          setError(`Invalid date format for ${dateField.replace(/([A-Z])/g, ' $1').toLowerCase()}. Use YYYY-MM-DD.`);
          return false;
        }
      }
    }
    // Email validation (always required)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    return true;
  };
  // Handle confirmation submit
  const handleConfirmSubmit = async () => {
    setShowConfirmation(false);
    if (!validateForm()) return;
    setLoading(true);
    setMessage('');
    setError('');
    setShowNotification(false);
    try {
      let url, method, dataToSend;
      // Normal create/update
      url = `${baseUrl}/api/add-employee`;
      method = editingId ? 'put' : 'post';
      if (editingId) url += `/${editingId}`;
      dataToSend = {
        ...formData,
        phoneNumber: `${selectedISDCode}${formData.phoneNumber}`,
        hra: formData.hra || '',
        ta: formData.ta || '',
        oa: formData.oa || '',
        basicSalary: formData.basicSalary || '',
      };
      if (editingId && !dataToSend.password) {
        delete dataToSend.password;
      }
      const response = await axios({
        method,
        url,
        data: dataToSend,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      const successMsg = editingId ? 'Employee updated successfully!' : 'Employee created successfully!';
      setNotificationType('success');
      setNotificationMessage(successMsg);
      setShowNotification(true);
      // Reset form
      setFormData({
        name: '', phoneNumber: '', email: '', gender: '', dateOfBirth: '', dateOfJoining: '', company: 'POS 8', status: 'Active', salutation: '', maritalStatus: '', idNumber: '', idExpiry: '', address: '', employeeDesignation: '', employeeType: '',
        basicSalary: '', hra: '', ta: '', oa: '', totalSalary: '', username: '', password: '', bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '',
        nationality: '', education: '', previousExperience: '', skills: '', healthInfo: '', familyDetails: '', profileImage: '',
      });
      setImagePreview(null);
      setSelectedISDCode("+971");
      setEditingId(null);
      await fetchEmployeeDesignations();
      await fetchEmployeeTypes();
      setTimeout(() => {
        setShowNotification(false);
        navigate('/admin'); // Navigate to employee list page on success
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} employee`;
      setNotificationType('error');
      setNotificationMessage(errorMsg);
      setShowNotification(true);
      // If error, do not navigate, stay on form
      console.error('Error details:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowConfirmation(true);
  };
  const cancelEdit = () => {
    setEditingId(null);
    // Reset form (as above)
    setFormData({
      name: '', phoneNumber: '', email: '', gender: '', dateOfBirth: '', dateOfJoining: '', company: 'POS 8', status: 'Active', salutation: '', maritalStatus: '', idNumber: '', idExpiry: '', address: '', employeeDesignation: '', employeeType: '',
      basicSalary: '', hra: '', ta: '', oa: '', totalSalary: '', username: '', password: '', bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '',
      nationality: '', education: '', previousExperience: '', skills: '', healthInfo: '', familyDetails: '', profileImage: '',
    });
    setImagePreview(null);
    setSelectedISDCode("+971");
    setActiveTab('details');
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
  // Render selects for enums
  const renderSelect = (name, options, label, required = false, icon = null) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>
        {icon && <span style={{ marginRight: '5px' }}>{icon}</span>}{label} {required ? '*' : ''}
      </label>
      <select name={name} value={formData[name]} onChange={handleChange} required={required} style={{ padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '1rem', outline: 'none', backgroundColor: '#fff', transition: 'border-color 0.3s' }} onFocus={e => e.target.style.borderColor = '#3498db'} onBlur={e => e.target.style.borderColor = '#bdc3c7'}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
  const renderTextarea = (name, label, rows = 3, required = false, placeholder = '') => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>{label} {required ? '*' : ''}</label>
      <textarea name={name} placeholder={placeholder} value={formData[name]} onChange={handleChange} rows={rows} required={required} style={{ width: '100%', padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '1rem', outline: 'none', resize: 'vertical', transition: 'border-color 0.3s' }} onFocus={e => e.target.style.borderColor = '#3498db'} onBlur={e => e.target.style.borderColor = '#bdc3c7'} />
    </div>
  );
  const renderInput = (type, name, label, required = false, placeholder = '', min = null, step = null) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>{label} {required ? '*' : ''}</label>
      <input type={type} name={name} placeholder={placeholder} value={formData[name]} onChange={handleChange} required={required} min={min} step={step} style={{ padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s' }} onFocus={e => e.target.style.borderColor = '#3498db'} onBlur={e => e.target.style.borderColor = '#bdc3c7'} />
    </div>
  );
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden' // Remove scrollbars
    }}>
      {/* Fixed Back Button */}
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
      {/* Main Container - Increased width to 1200px */}
      <div style={{
        maxWidth: '1200px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden' // No scrollbars
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #3498db'
        }}>
          <div></div>
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
              <FaSave /> {loading ? 'Processing...' : (editingId ? 'Update Employee' : 'Save Employee')}
            </button>
          </div>
        </div>
        {/* Alerts */}
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
          {/* Tab Navigation - Expanded, no overflow */}
          <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '2px solid #bdc3c7', overflow: 'hidden' }}>
            <TabButton tabKey="details" label="Basic Details" />
            <TabButton tabKey="personal" label="Personal Info" icon={<FaUser />} />
            <TabButton tabKey="employment" label="Employment" icon={<FaIdCard />} />
            <TabButton tabKey="salary" label="Salary" />
            <TabButton tabKey="professional" label="Professional" icon={<FaBriefcase />} />
            <TabButton tabKey="other" label="Other Details" icon={<FaUsers />} />
            <TabButton tabKey="credentials" label="Credentials" />
          </div>
          {/* Tab Content */}
          <div style={{ flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {activeTab === 'details' && (
              <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px' }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Basic Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  {renderInput('text', 'name', 'Full Name', true, 'Full Name *')}
                  {/* Phone with ISD */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Phone Number *</label>
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
                  {renderSelect('gender', genderOptions, 'Gender')}
                  {renderInput('date', 'dateOfBirth', 'Date of Birth')}
                </div>
                {renderInput('email', 'email', 'Email', true, 'Email *')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                  {renderInput('text', 'idNumber', 'ID Number', false, 'ID Number (e.g., Aadhaar/License)')}
                  {renderInput('date', 'idExpiry', 'ID Expiry Date')}
                </div>
                {renderTextarea('address', 'Address', 3, true, 'Address *')}
              </div>
            )}
            {activeTab === 'personal' && (
              <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px' }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Personal Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  {renderSelect('salutation', salutationOptions, 'Salutation/Title')}
                  {renderSelect('maritalStatus', maritalOptions, 'Marital Status')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                  {renderSelect('nationality', nationalityOptions, 'Nationality')}
                  {renderInput('date', 'dateOfJoining', 'Date of Joining')}
                </div>
                {renderSelect('status', statusOptions, 'Status')}
                {renderSelect('company', companyOptions, 'Company (Multi-Company Setup)')}
              </div>
            )}
            {activeTab === 'employment' && (
              <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px' }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Employment Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Employee Designation (FK) *</label>
                  <select name="employeeDesignation" value={formData.employeeDesignation} onChange={handleDesignationChange} required style={{ width: '100%', padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '1rem', outline: 'none', backgroundColor: '#fff', transition: 'border-color 0.3s' }} onFocus={e => e.target.style.borderColor = '#3498db'} onBlur={e => e.target.style.borderColor = '#bdc3c7'}>
                    <option value="">Select Employee Designation *</option>
                    {employeeDesignations.map(designation => (<option key={designation.id} value={designation.name}>{designation.name}</option>))}
                    <option value="create_new">+ Create New Employee Designation</option>
                  </select>
                  {/* Removed Manage Designations button */}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: '15px' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Employee Type (FK) *</label>
                  <select name="employeeType" value={formData.employeeType} onChange={handleEmployeeTypeChange} required style={{ width: '100%', padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '1rem', outline: 'none', backgroundColor: '#fff', transition: 'border-color 0.3s' }} onFocus={e => e.target.style.borderColor = '#3498db'} onBlur={e => e.target.style.borderColor = '#bdc3c7'}>
                    <option value="">Select Employee Type *</option>
                    {employeeTypes.map(typeItem => (<option key={typeItem.id} value={typeItem.name}>{typeItem.name}</option>))}
                    <option value="create_new">+ Create New Employee Type</option>
                  </select>
                  {/* Removed Manage Employee Types button */}
                </div>
              </div>
            )}
            {activeTab === 'salary' && (
              <>
                <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px', marginBottom: '15px' }}>
                  <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Salary Components (Optional)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '10px' }}>
                    {renderInput('number', 'basicSalary', 'Basic Salary', false, 'Basic Salary (Optional)', 0, 0.01)}
                    {renderInput('number', 'hra', 'HRA', false, 'HRA (Optional)', 0, 0.01)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '10px' }}>
                    {renderInput('number', 'ta', 'TA', false, 'TA (Optional)', 0, 0.01)}
                    {renderInput('number', 'oa', 'OA', false, 'OA (Optional)', 0, 0.01)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Total Salary (Computed)</label>
                    <input type="text" value={formData.totalSalary} readOnly style={{ width: '100%', padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '1rem', outline: 'none', backgroundColor: '#f8f9fa', color: '#27ae60', fontWeight: '600' }} />
                  </div>
                </div>
                <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Bank Details (Optional)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '10px' }}>
                    {renderInput('text', 'bankName', 'Bank Name', false, 'Bank Name (Optional)')}
                    {renderInput('text', 'accountHolderName', 'Account Holder Name', false, 'Account Holder Name (Optional)')}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {renderInput('text', 'accountNumber', 'Account Number', false, 'Account Number (Optional)')}
                    {renderInput('text', 'ifscCode', 'IFSC Code', false, 'IFSC Code (Optional)')}
                  </div>
                </div>
              </>
            )}
            {activeTab === 'professional' && (
              <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px' }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Professional Details (Optional)</h3>
                {renderTextarea('education', 'Education/Qualifications', 4, false, 'Enter education and qualifications...')}
                {renderTextarea('previousExperience', 'Previous Experience', 4, false, 'Enter previous work experience...')}
                {renderTextarea('skills', 'Skills/Certifications', 4, false, 'Enter skills and certifications...')}
              </div>
            )}
            {activeTab === 'other' && (
              <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px' }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Other Details (Optional)</h3>
                {/* Health - Confidential */}
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
                  <label style={{ fontWeight: '600', color: '#856404', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FaStethoscope /> Health/Medical Information (Confidential)
                  </label>
                  <p style={{ fontSize: '0.9rem', color: '#856404', marginBottom: '10px' }}>This information is kept confidential and used only for internal HR purposes.</p>
                  {renderTextarea('healthInfo', '', 3, false, 'Enter health/medical information (optional)...')}
                </div>
                {/* Family */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FaUsers /> Family/Dependents Details
                  </label>
                  {renderTextarea('familyDetails', '', 3, false, 'Enter family and dependents details...')}
                </div>
                {/* Photo/Image */}
                <div>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FaUpload /> Photo/Image (for ID cards or profiles)
                  </label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ marginBottom: '10px' }} />
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #bdc3c7' }} />
                  )}
                  <p style={{ fontSize: '0.8rem', color: '#6c757d' }}>Upload a profile photo (optional).</p>
                </div>
              </div>
            )}
            {activeTab === 'credentials' && (
              <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px' }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem' }}>Login Credentials</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  {renderInput('text', 'username', 'Username (Login User)', true, 'Username *')}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Password {editingId ? "(leave blank to keep current, optional)" : "*"}</label>
                    <input type="password" name="password" placeholder={editingId ? "New Password (leave blank to keep current, optional)" : "Password *"} value={formData.password} onChange={handleChange} required={!editingId} style={{ padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s' }} onFocus={e => e.target.style.borderColor = '#3498db'} onBlur={e => e.target.style.borderColor = '#bdc3c7'} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
      {/* Confirmation Modal - Warning before submit */}
      {showConfirmation && (
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
          onClick={() => setShowConfirmation(false)}
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
                color: '#f39c12',
                fontSize: '1.5rem',
                marginBottom: '15px',
                fontWeight: 'bold'
              }}
            >
              Confirm Action
            </div>
            <p style={{ margin: 0, color: '#2c3e50', fontSize: '1rem', lineHeight: '1.5' }}>
              Are you sure you want to {editingId ? 'update' : 'save'} this employee? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
              <button
                onClick={handleConfirmSubmit}
                style={{
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
                Submit
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#7f8c8d')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#95a5a6')}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Notification Modal */}
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
    </div>
  );
};
export default AddEmployee;