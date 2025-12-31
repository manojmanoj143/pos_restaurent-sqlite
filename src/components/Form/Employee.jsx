// src/pages/EmployeePage.jsx
// EmployeePage.jsx - Updated: Integrated dropdown for selecting existing employees from /api/add-employee.
// Now fetches general employees and allows assigning delivery-specific details (vehicleNumber, secretKey, role).
// Removed manual name input; name is selected from dropdown. On selection, pre-populate if possible.
// Backend assumes PUT to /api/employees/<employeeId> updates or creates delivery profile linked to main employee ID.
// Enhanced with better error handling, loading states, and UI consistency with EmployeeList.
// FIXED: Include 'name' from selected general employee in POST/PUT payload to match backend requirements.
// NEW: Added dropdown for vehicleNumber fetched from /api/vechile/management. Pre-populates on edit.
//      Vehicle selection populates vehicleNumber in formData. Sends vehicleNumber as string in payload.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaPlusCircle, FaUsers, FaEdit, FaTrash, FaKey, FaCheck, FaTimes, FaUserTie, FaSearch, FaCar } from 'react-icons/fa';

function EmployeePage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]); // Delivery employees (from /api/employees)
  const [generalEmployees, setGeneralEmployees] = useState([]); // Main employees from /api/add-employee for dropdown
  const [vehicles, setVehicles] = useState([]); // Vehicles from /api/vechile/management for vehicle dropdown
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    selectedGeneralEmployeeId: '', // Dropdown selection
    name: '', // NEW: Store selected name for payload
    countryCode: '+91', // Default to India
    phoneNumber: '',
    vehicleNumber: '', // Now selected from dropdown
    role: 'Delivery Boy',
    email: '',
    secretKey: '', // Manual 6-digit input
  });
  const [editMode, setEditMode] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [baseUrl, setBaseUrl] = useState(""); // baseUrl state similar to EmployeeList
  // New states for custom delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  // List of country codes for dropdown
  const countryCodes = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA' },
    { code: '+971', country: 'UAE (Dubai)' },
    { code: '+44', country: 'UK' },
    { code: '+61', country: 'Australia' },
  ];
  // Fetch config to determine baseUrl (similar to EmployeeList)
  useEffect(() => {
    const fetchConfig = async () => {
      let currentBaseUrl = "";
      try {
        const response = await axios.get("/api/network_info");
        const { config: appConfig } = response.data;
        if (appConfig.mode === "client") {
          currentBaseUrl = `http://${appConfig.server_ip}:8000`;
          setBaseUrl(currentBaseUrl);
        } else {
          setBaseUrl("");
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
        setBaseUrl("");
      } finally {
        // Fetch both lists after config is loaded
        fetchDeliveryEmployees(currentBaseUrl);
        fetchGeneralEmployees(currentBaseUrl);
        fetchVehicles(currentBaseUrl); // NEW: Fetch vehicles for dropdown
      }
    };
    fetchConfig();
  }, []);
  // Fetch delivery employees (from /api/employees)
  const fetchDeliveryEmployees = async (currentBaseUrl = baseUrl) => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = currentBaseUrl ? `${currentBaseUrl}/api/employees` : '/api/employees';
      const response = await axios.get(apiUrl);
      const data = Array.isArray(response.data) ? response.data : [];
      setEmployees(data);
    } catch (err) {
      setError(`Failed to fetch delivery employees: ${err.message}`);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };
  // NEW: Fetch general employees for dropdown (from /api/add-employee)
  const fetchGeneralEmployees = async (currentBaseUrl = baseUrl) => {
    try {
      const apiUrl = currentBaseUrl ? `${currentBaseUrl}/api/add-employee` : '/api/add-employee';
      const response = await axios.get(apiUrl);
      console.log("FETCHED GENERAL EMPLOYEES FOR DROPDOWN:", response.data);
      if (Array.isArray(response.data)) {
        const validEmployees = response.data
          .map(emp => ({
            ...emp,
            id: emp._id || emp.id // Ensure ID is accessible
          }))
          .filter(emp => !emp.isDraft);
        setGeneralEmployees(validEmployees);
      } else {
        console.error("Unexpected API response format:", response.data);
        setGeneralEmployees([]);
      }
    } catch (err) {
      console.error('Error fetching general employees:', err);
      setError('Failed to fetch employees for dropdown. Please try again.');
      setGeneralEmployees([]);
    }
  };
  // NEW: Fetch vehicles for vehicleNumber dropdown (from /api/vechile/management)
  const fetchVehicles = async (currentBaseUrl = baseUrl) => {
    try {
      const apiUrl = currentBaseUrl ? `${currentBaseUrl}/api/vechile/management` : '/api/vechile/management';
      const response = await axios.get(apiUrl);
      console.log("FETCHED VEHICLES FOR DROPDOWN:", response.data);
      if (Array.isArray(response.data)) {
        const validVehicles = response.data.filter(v => v.vehicle_number && v.status === 'ACTIVE'); // Only active vehicles
        setVehicles(validVehicles);
      } else {
        console.error("Unexpected API response format for vehicles:", response.data);
        setVehicles([]);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('Failed to fetch vehicles for dropdown. Please try again.');
      setVehicles([]);
    }
  };
  // Validate 6-digit secret key
  const validateSecretKey = (key) => {
    return key.length === 6 && /^\d+$/.test(key);
  };
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing secret key
    if (name === 'secretKey' && error && error.includes('Secret key')) {
      setError(null);
    }
  };
  // NEW: Handle dropdown selection - Populate form with selected employee's details
  const handleGeneralEmployeeSelect = (e) => {
    const selectedId = e.target.value;
    setFormData(prev => ({ ...prev, selectedGeneralEmployeeId: selectedId }));
    if (selectedId) {
      const selectedEmp = generalEmployees.find(emp => String(emp._id) === String(selectedId));
      if (selectedEmp) {
        // Pre-populate name, email and phone if available
        setFormData(prev => ({
          ...prev,
          selectedGeneralEmployeeId: selectedId,
          name: selectedEmp.name || '', // FIXED: Include name for payload
          email: selectedEmp.email || '',
          phoneNumber: selectedEmp.phoneNumber?.replace(/\D/g, '') || '', // Extract digits for phone input
          // Note: Vehicle and secret key remain manual as they are delivery-specific
        }));
      }
    }
  };
  // NEW: Handle vehicle dropdown selection
  const handleVehicleSelect = (e) => {
    const selectedVehicleNumber = e.target.value;
    setFormData(prev => ({ ...prev, vehicleNumber: selectedVehicleNumber }));
  };
  // Handle employee creation/assignment (updated: uses selected general employee)
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!formData.selectedGeneralEmployeeId || !formData.name || !formData.phoneNumber || !formData.vehicleNumber || !formData.email || !formData.secretKey) {
      setError('Please select an employee, vehicle, and fill in all delivery fields, including a 6-digit secret key');
      return;
    }
    if (!validateSecretKey(formData.secretKey)) {
      setError('Secret key must be exactly 6 digits');
      return;
    }
    const fullPhoneNumber = `${formData.countryCode}${formData.phoneNumber}`;
    try {
      setLoading(true);
      setError(null);
      setMessage('');
      const apiUrl = baseUrl ? `${baseUrl}/api/employees` : '/api/employees';
      const response = await axios.post(apiUrl, {
        name: formData.name, // FIXED: Include name from selected general employee
        generalEmployeeId: formData.selectedGeneralEmployeeId, // Link to main employee
        phoneNumber: fullPhoneNumber,
        vehicleNumber: formData.vehicleNumber, // From dropdown
        role: formData.role,
        email: formData.email,
        secretKey: formData.secretKey,
      });
      const newEmployee = response.data.employee; // Backend returns the created delivery employee
      setMessage(`Delivery profile assigned successfully! Secret Key: ${newEmployee.secretKey}`);
      // Reset form except role
      setFormData({
        selectedGeneralEmployeeId: '',
        name: '',
        countryCode: '+91',
        phoneNumber: '',
        vehicleNumber: '',
        role: 'Delivery Boy',
        email: '',
        secretKey: ''
      });
      fetchDeliveryEmployees();
      fetchGeneralEmployees(); // Refresh to update any linked status if needed
      fetchVehicles(); // Refresh vehicles if needed
    } catch (err) {
      console.error("Backend Error Details:", err.response?.data);
      setError(`Failed to assign delivery profile: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };
  // Handle employee edit (updated for delivery profile)
  const handleEditEmployee = (employee) => {
    setEditMode(true);
    setEditEmployeeId(employee.employeeId);
    const countryCode = countryCodes.find(code => employee.phoneNumber.startsWith(code.code))?.code || '+91';
    const phoneNumber = employee.phoneNumber.slice(countryCode.length);
    // Find general employee for name
    const generalEmp = generalEmployees.find(emp => String(emp._id) === String(employee.generalEmployeeId));
    setFormData({
      selectedGeneralEmployeeId: employee.generalEmployeeId || '',
      name: generalEmp ? generalEmp.name : employee.name || '', // FIXED: Ensure name is set
      countryCode,
      phoneNumber,
      vehicleNumber: employee.vehicleNumber || '', // Pre-populate from existing
      role: employee.role,
      email: employee.email || '',
      secretKey: employee.secretKey || '', // Load existing
    });
    setSelectedEmployee(employee);
  };
  // Handle employee update (updated: uses selected general employee)
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!formData.selectedGeneralEmployeeId || !formData.name || !formData.phoneNumber || !formData.vehicleNumber || !formData.email || !formData.secretKey) {
      setError('Please select an employee, vehicle, and fill in all delivery fields, including a 6-digit secret key');
      return;
    }
    if (!validateSecretKey(formData.secretKey)) {
      setError('Secret key must be exactly 6 digits');
      return;
    }
    const fullPhoneNumber = `${formData.countryCode}${formData.phoneNumber}`;
    try {
      setLoading(true);
      setError(null);
      setMessage('');
      const apiUrl = baseUrl ? `${baseUrl}/api/employees/${editEmployeeId}` : `/api/employees/${editEmployeeId}`;
      const response = await axios.put(apiUrl, {
        name: formData.name, // FIXED: Include name
        generalEmployeeId: formData.selectedGeneralEmployeeId,
        phoneNumber: fullPhoneNumber,
        vehicleNumber: formData.vehicleNumber, // From dropdown
        role: formData.role,
        email: formData.email,
        secretKey: formData.secretKey,
      });
      const updatedEmployee = response.data.employee;
      setMessage(`Delivery profile updated successfully! Secret Key: ${updatedEmployee.secretKey}`);
      // Reset form
      setFormData({
        selectedGeneralEmployeeId: '',
        name: '',
        countryCode: '+91',
        phoneNumber: '',
        vehicleNumber: '',
        role: 'Delivery Boy',
        email: '',
        secretKey: ''
      });
      setEditMode(false);
      setEditEmployeeId(null);
      setSelectedEmployee(null);
      fetchDeliveryEmployees();
      fetchVehicles(); // Refresh vehicles if needed
    } catch (err) {
      console.error("Backend Error Details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      setError(`Failed to update delivery profile: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };
  // Updated handle employee deletion to trigger custom confirmation
  const handleDeleteEmployee = (employeeId) => {
    setEmployeeToDelete(employeeId);
    setShowDeleteConfirm(true);
  };
  // Proceed with deletion after confirmation
  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      setLoading(true);
      setError(null);
      setMessage('');
      const apiUrl = baseUrl ? `${baseUrl}/api/employees/${employeeToDelete}` : `/api/employees/${employeeToDelete}`;
      await axios.delete(apiUrl);
      setMessage('Delivery profile deleted successfully');
      setSelectedEmployee(null);
      fetchDeliveryEmployees();
    } catch (err) {
      console.error("Backend Error Details:", err.response?.data);
      setError(`Failed to delete delivery profile: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
    }
  };
  // Cancel deletion
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setEmployeeToDelete(null);
  };
  // Handle employee selection (for details view)
  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEditMode(false);
    // Reset form on selection
    setFormData({
      selectedGeneralEmployeeId: '',
      name: '',
      countryCode: '+91',
      phoneNumber: '',
      vehicleNumber: '',
      role: 'Delivery Boy',
      email: '',
      secretKey: ''
    });
  };
  if (loading && employees.length === 0 && generalEmployees.length === 0 && vehicles.length === 0) {
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
          <FaUsers style={{ fontSize: '48px', marginBottom: '20px', color: '#3498db' }} />
          <p>Loading delivery employees...</p>
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
        disabled={loading}
      >
        <FaArrowLeft /> Back to Admin
      </button>
      {/* Main Container - Like EmployeeList Card */}
      <div style={{
        maxWidth: '1250px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header with Title */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #3498db'
        }}>
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
            <FaUsers style={{ color: '#3498db', fontSize: '2rem' }} />
            Delivery Employee Management
          </h2>
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
            <FaCheck style={{ fontSize: '1.2rem', color: '#27ae60' }} />
            {message}
          </div>
        )}
        {/* Main Content - Flex Layout for Form and List */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Create/Edit Delivery Profile Form - Updated with Dropdown for Employee Selection and Vehicle */}
          <div
            style={{
              flex: '1',
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              minWidth: '300px',
              border: '1px solid #e9ecef'
            }}
          >
            <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '1.3rem', fontWeight: '600', textAlign: 'center' }}>
              {editMode ? 'Edit Delivery Profile' : 'Assign Delivery Profile'}
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); editMode ? handleUpdateEmployee(e) : handleCreateEmployee(e); }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* NEW: Dropdown for selecting existing general employee */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Select Employee</label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #3498db'
                }}>
                  <FaUserTie style={{ color: '#3498db', fontSize: '1rem' }} />
                  <FaSearch style={{ color: '#7f8c8d', fontSize: '1rem' }} />
                  <select
                    name="selectedGeneralEmployeeId"
                    value={formData.selectedGeneralEmployeeId}
                    onChange={handleGeneralEmployeeSelect}
                    required
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
                    <option value="">Search and Select Employee...</option>
                    {generalEmployees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.employeeId} - {emp.employeeDesignation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email Address (Auto-filled if available)"
                required
                style={{
                  padding: '12px',
                  border: '1px solid #3498db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  background: '#ffffff',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                onBlur={(e) => e.target.style.borderColor = '#3498db'}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleInputChange}
                  style={{
                    padding: '12px',
                    border: '1px solid #3498db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    background: '#ffffff',
                    width: '150px',
                    transition: 'border-color 0.3s ease',
                    color: '#2c3e50'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                  onBlur={(e) => e.target.style.borderColor = '#3498db'}
                >
                  {countryCodes.map(({ code, country }) => (
                    <option key={code} value={code}>
                      {`${country} (${code})`}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Phone Number (Auto-filled if available)"
                  required
                  style={{
                    flex: '1',
                    padding: '12px',
                    border: '1px solid #3498db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    background: '#ffffff',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                  onBlur={(e) => e.target.style.borderColor = '#3498db'}
                />
              </div>
              {/* NEW: Dropdown for Vehicle Number */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Select Vehicle</label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #3498db'
                }}>
                  <FaCar style={{ color: '#3498db', fontSize: '1rem' }} />
                  <FaSearch style={{ color: '#7f8c8d', fontSize: '1rem' }} />
                  <select
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleVehicleSelect}
                    required
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
                    <option value="">Search and Select Vehicle...</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle.vehicle_number}>
                        {vehicle.vehicle_number} ({vehicle.brand} {vehicle.model} - {vehicle.vehicle_type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                style={{
                  padding: '12px',
                  border: '1px solid #3498db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  background: '#ffffff',
                  color: '#2c3e50',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                onBlur={(e) => e.target.style.borderColor = '#3498db'}
              >
                <option value="Delivery Boy">Delivery Boy</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaKey style={{ color: '#f39c12', fontSize: '1.2rem' }} />
                <input
                  type="text"
                  name="secretKey"
                  value={formData.secretKey}
                  onChange={handleInputChange}
                  placeholder="6-Digit Secret Key"
                  maxLength={6}
                  required
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #3498db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    background: '#ffffff',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                  onBlur={(e) => e.target.style.borderColor = '#3498db'}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !validateSecretKey(formData.secretKey) || !formData.selectedGeneralEmployeeId || !formData.vehicleNumber}
                style={{
                  padding: '12px 24px',
                  background: loading || !validateSecretKey(formData.secretKey) || !formData.selectedGeneralEmployeeId || !formData.vehicleNumber ? 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)' : 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50px',
                  cursor: loading || !validateSecretKey(formData.secretKey) || !formData.selectedGeneralEmployeeId || !formData.vehicleNumber ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: loading || !validateSecretKey(formData.secretKey) || !formData.selectedGeneralEmployeeId || !formData.vehicleNumber ? '0 2px 4px rgba(149, 165, 166, 0.3)' : '0 4px 8px rgba(52, 152, 219, 0.3)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  if (!loading && validateSecretKey(formData.secretKey) && formData.selectedGeneralEmployeeId && formData.vehicleNumber) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 12px rgba(52, 152, 219, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading && validateSecretKey(formData.secretKey) && formData.selectedGeneralEmployeeId && formData.vehicleNumber) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.3)';
                  }
                }}
              >
                <FaPlusCircle />
                {loading ? 'Processing...' : editMode ? 'Update Profile' : 'Assign Profile'}
              </button>
              {editMode && (
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setFormData({
                      selectedGeneralEmployeeId: '',
                      name: '',
                      countryCode: '+91',
                      phoneNumber: '',
                      vehicleNumber: '',
                      role: 'Delivery Boy',
                      email: '',
                      secretKey: ''
                    });
                    setEditEmployeeId(null);
                  }}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(149, 165, 166, 0.3)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(149, 165, 166, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(149, 165, 166, 0.3)';
                  }}
                >
                  Cancel
                </button>
              )}
            </form>
          </div>
          {/* Delivery Employee List - Styled like a Card */}
          <div
            style={{
              flex: '1',
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              minWidth: '300px',
              border: '1px solid #e9ecef',
              maxHeight: '500px',
              overflowY: 'auto'
            }}
          >
            <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '1.3rem', fontWeight: '600', textAlign: 'center' }}>
              Delivery Profiles ({employees.length})
            </h3>
            {employees.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '1rem' }}>
                No delivery profiles assigned.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: '0', margin: 0 }}>
                {employees.map((employee) => (
                  <li
                    key={employee.employeeId}
                    style={{
                      padding: '15px',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => handleSelectEmployee(employee)}
                    >
                      <FaUsers style={{ marginRight: '10px', color: '#3498db', fontSize: '1.2rem' }} />
                      <div>
                        <span style={{ fontWeight: '500', color: '#2c3e50', display: 'block' }}>{employee.name}</span>
                        <small style={{ color: '#7f8c8d' }}>Vehicle: {employee.vehicleNumber}</small>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        style={{
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.9rem',
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
                        onClick={() => handleDeleteEmployee(employee.employeeId)}
                        style={{
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.9rem',
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
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* Employee Details - Updated to show linked general employee info */}
        {selectedEmployee && (
          <div
            style={{
              marginTop: '20px',
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              border: '1px solid #e9ecef'
            }}
          >
            <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '1.3rem', fontWeight: '600', textAlign: 'center' }}>
              Delivery Profile Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <p style={{ margin: 0, color: '#2c3e50' }}><strong>Linked Employee:</strong> {selectedEmployee.name}</p>
              <p style={{ margin: 0, color: '#2c3e50' }}><strong>Email:</strong> {selectedEmployee.email || 'N/A'}</p>
              <p style={{ margin: 0, color: '#2c3e50' }}><strong>Phone Number:</strong> {selectedEmployee.phoneNumber}</p>
              <p style={{ margin: 0, color: '#2c3e50' }}><strong>Vehicle Number:</strong> {selectedEmployee.vehicleNumber}</p>
              <p style={{ margin: 0, color: '#2c3e50' }}><strong>Role:</strong> {selectedEmployee.role}</p>
              <p style={{ margin: 0, color: '#2c3e50' }}><strong>Secret Key:</strong> {selectedEmployee.secretKey || 'N/A'}</p>
              {selectedEmployee.generalEmployeeId && (
                <p style={{ margin: 0, color: '#2c3e50', gridColumn: '1 / -1' }}><strong>General Employee ID:</strong> {selectedEmployee.generalEmployeeId}</p>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Custom Delete Confirmation Dialog - Styled like EmployeeList */}
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
          onClick={(e) => { if (e.target === e.currentTarget) cancelDelete(); }}
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
            }}>Are you sure you want to delete this delivery profile? This action cannot be undone.</p>
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={confirmDelete}
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
                onClick={cancelDelete}
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
}

export default EmployeePage;