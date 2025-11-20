import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaPlusCircle, FaUsers, FaEdit, FaTrash, FaKey, FaCheck, FaTimes } from 'react-icons/fa';

function EmployeePage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    countryCode: '+91', // Default to India
    phoneNumber: '',
    vehicleNumber: '',
    role: 'Delivery Boy',
    email: '',
    secretKey: '', // Manual 6-digit input
  });
  const [editMode, setEditMode] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [baseUrl, setBaseUrl] = useState(""); // Added baseUrl state similar to AdminPage
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

  // Fetch config to determine baseUrl (similar to AdminPage)
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
        // Fetch employees after config is loaded
        fetchEmployees(currentBaseUrl);
      }
    };
    fetchConfig();
  }, []);

  // Fetch employees (updated to use baseUrl)
  const fetchEmployees = async (currentBaseUrl = baseUrl) => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = currentBaseUrl ? `${currentBaseUrl}/api/employees` : '/api/employees'; // FIXED: Use relative if no baseUrl
      const response = await axios.get(apiUrl);
      const data = Array.isArray(response.data) ? response.data : [];
      setEmployees(data);
    } catch (err) {
      setError(`Failed to fetch employees: ${err.message}`);
      setEmployees([]);
    } finally {
      setLoading(false);
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

  // Handle employee creation (updated to use baseUrl, manual secret key)
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    const fullPhoneNumber = `${formData.countryCode}${formData.phoneNumber}`;
    if (!formData.name || !formData.phoneNumber || !formData.vehicleNumber || !formData.email || !formData.secretKey) {
      setError('Please fill in all fields, including a 6-digit secret key');
      return;
    }
    if (!validateSecretKey(formData.secretKey)) {
      setError('Secret key must be exactly 6 digits');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setMessage('');
      const apiUrl = baseUrl ? `${baseUrl}/api/employees` : '/api/employees'; // FIXED: Use relative if no baseUrl
      const response = await axios.post(apiUrl, {
        name: formData.name,
        phoneNumber: fullPhoneNumber,
        vehicleNumber: formData.vehicleNumber,
        role: formData.role,
        email: formData.email,
        secretKey: formData.secretKey,
      });
      const newEmployee = response.data.employee; // Backend returns the created employee with secretKey
      setMessage(`Employee created successfully! Secret Key: ${newEmployee.secretKey}`);
      setFormData({ name: '', countryCode: '+91', phoneNumber: '', vehicleNumber: '', role: 'Delivery Boy', email: '', secretKey: '' });
      fetchEmployees();
    } catch (err) {
      console.error("Backend Error Details:", err.response?.data); // FIXED: Better logging for debugging
      setError(`Failed to create employee: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle employee edit
  const handleEditEmployee = (employee) => {
    setEditMode(true);
    setEditEmployeeId(employee.employeeId);
    const countryCode = countryCodes.find(code => employee.phoneNumber.startsWith(code.code))?.code || '+91';
    const phoneNumber = employee.phoneNumber.slice(countryCode.length);
    setFormData({
      name: employee.name,
      countryCode,
      phoneNumber,
      vehicleNumber: employee.vehicleNumber,
      role: employee.role,
      email: employee.email || '',
      secretKey: employee.secretKey || '', // Load existing secret key for editing
    });
    setSelectedEmployee(employee);
  };

  // Handle employee update (updated to use baseUrl, manual secret key)
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    const fullPhoneNumber = `${formData.countryCode}${formData.phoneNumber}`;
    if (!formData.name || !formData.phoneNumber || !formData.vehicleNumber || !formData.email || !formData.secretKey) {
      setError('Please fill in all fields, including a 6-digit secret key');
      return;
    }
    if (!validateSecretKey(formData.secretKey)) {
      setError('Secret key must be exactly 6 digits');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setMessage('');
      const apiUrl = baseUrl ? `${baseUrl}/api/employees/${editEmployeeId}` : `/api/employees/${editEmployeeId}`; // FIXED: Use relative if no baseUrl
      const response = await axios.put(apiUrl, {
        name: formData.name,
        phoneNumber: fullPhoneNumber,
        vehicleNumber: formData.vehicleNumber,
        role: formData.role,
        email: formData.email,
        secretKey: formData.secretKey, // Manual update of secret key
      });
      const updatedEmployee = response.data.employee; // Backend returns updated with secretKey
      setMessage(`Employee updated successfully! Secret Key: ${updatedEmployee.secretKey}`);
      setFormData({ name: '', countryCode: '+91', phoneNumber: '', vehicleNumber: '', role: 'Delivery Boy', email: '', secretKey: '' });
      setEditMode(false);
      setEditEmployeeId(null);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (err) {
      // IMPROVED: Better logging to show exact backend error
      console.error("Backend Error Details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      setError(`Failed to update employee: ${err.response?.data?.error || err.message}`);
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
      const apiUrl = baseUrl ? `${baseUrl}/api/employees/${employeeToDelete}` : `/api/employees/${employeeToDelete}`; // FIXED: Use relative if no baseUrl
      await axios.delete(apiUrl);
      setMessage('Employee deleted successfully');
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (err) {
      console.error("Backend Error Details:", err.response?.data); // FIXED: Better logging
      setError(`Failed to delete employee: ${err.response?.data?.error || err.message}`);
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

  // Handle employee selection
  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEditMode(false);
    setFormData({ name: '', countryCode: '+91', phoneNumber: '', vehicleNumber: '', role: 'Delivery Boy', email: '', secretKey: '' });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f6fa', padding: '20px', marginLeft: '250px' }}>
      <div style={{ maxWidth: '1200px', margin: '40px auto 0' }}>
        <button
          onClick={() => navigate('/admin')}
          style={{
            position: 'fixed',
            top: '20px',
            left: '270px',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
            zIndex: 1000,
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#3498db')}
          onMouseOut={(e) => (e.target.style.backgroundColor = '#f0f0f0')}
        >
          <FaArrowLeft style={{ fontSize: '24px', color: '#333' }} />
        </button>
        <h2 style={{ textAlign: 'center', marginBottom: '40px', color: '#333', fontSize: '2rem', fontWeight: '600' }}>
          Employee Management
        </h2>
        {loading && (
          <div style={{ textAlign: 'center', color: '#666', fontSize: '1.2rem' }}>Loading...</div>
        )}
        {error && (
          <div
            style={{
              backgroundColor: '#ffebee',
              padding: '10px',
              marginBottom: '20px',
              color: '#c0392b',
              borderRadius: '5px',
            }}
          >
            {error}
          </div>
        )}
        {message && (
          <div
            style={{
              backgroundColor: message.includes('success') ? '#d4edda' : '#ffebee',
              padding: '10px',
              marginBottom: '20px',
              color: message.includes('success') ? '#155724' : '#c0392b',
              borderRadius: '5px',
            }}
          >
            {message}
          </div>
        )}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Create/Edit Employee Form */}
          <div
            style={{
              flex: '1',
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              minWidth: '300px',
            }}
          >
            <h3 style={{ marginBottom: '20px', color: '#333', fontSize: '1.5rem', fontWeight: '600' }}>
              {editMode ? 'Edit Employee' : 'Create Delivery Boy'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Employee Name"
                style={{
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  outline: 'none',
                }}
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email Address"
                style={{
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleInputChange}
                  style={{
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    fontSize: '1rem',
                    outline: 'none',
                    width: '150px',
                  }}
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
                  placeholder="Phone Number"
                  style={{
                    flex: '1',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                />
              </div>
              <input
                type="text"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleInputChange}
                placeholder="Vehicle Number"
                style={{
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  outline: 'none',
                }}
              />
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                style={{
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  outline: 'none',
                }}
              >
                <option value="Delivery Boy">Delivery Boy</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaKey style={{ color: '#f39c12' }} />
                <input
                  type="text"
                  name="secretKey"
                  value={formData.secretKey}
                  onChange={handleInputChange}
                  placeholder="6-Digit Secret Key"
                  maxLength={6}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    fontSize: '1rem',
                    outline: 'none',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                />
              </div>
              <button
                onClick={editMode ? handleUpdateEmployee : handleCreateEmployee}
                disabled={loading || !validateSecretKey(formData.secretKey)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading || !validateSecretKey(formData.secretKey) ? '#ccc' : '#3498db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading || !validateSecretKey(formData.secretKey) ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseOver={(e) => !loading && validateSecretKey(formData.secretKey) && (e.target.style.backgroundColor = '#2980b9')}
                onMouseOut={(e) => !loading && validateSecretKey(formData.secretKey) && (e.target.style.backgroundColor = '#3498db')}
              >
                <FaPlusCircle style={{ marginRight: '5px' }} />
                {loading ? 'Processing...' : editMode ? 'Update Employee' : 'Create Employee'}
              </button>
              {editMode && (
                <button
                  onClick={() => {
                    setEditMode(false);
                    setFormData({ name: '', countryCode: '+91', phoneNumber: '', vehicleNumber: '', role: 'Delivery Boy', email: '', secretKey: '' });
                    setEditEmployeeId(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ccc',
                    color: '#333',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s',
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = '#bbb')}
                  onMouseOut={(e) => (e.target.style.backgroundColor = '#ccc')}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
          {/* Employee List */}
          <div
            style={{
              flex: '1',
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              minWidth: '300px',
            }}
          >
            <h3 style={{ marginBottom: '20px', color: '#333', fontSize: '1.5rem', fontWeight: '600' }}>
              Employee List
            </h3>
            {employees.length === 0 ? (
              <p style={{ color: '#555' }}>No employees found</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: '0' }}>
                {employees.map((employee) => (
                  <li
                    key={employee.employeeId}
                    style={{
                      padding: '10px',
                      borderBottom: '1px solid #eee',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                  >
                    <div
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      onClick={() => handleSelectEmployee(employee)}
                    >
                      <FaUsers style={{ marginRight: '10px', color: '#3498db' }} />
                      <span>{employee.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#f1c40f',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onMouseOver={(e) => (e.target.style.backgroundColor = '#d4ac0d')}
                        onMouseOut={(e) => (e.target.style.backgroundColor = '#f1c40f')}
                      >
                        <FaEdit style={{ marginRight: '5px' }} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.employeeId)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#e74c3c',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onMouseOver={(e) => (e.target.style.backgroundColor = '#c0392b')}
                        onMouseOut={(e) => (e.target.style.backgroundColor = '#e74c3c')}
                      >
                        <FaTrash style={{ marginRight: '5px' }} />
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* Employee Details */}
        {selectedEmployee && (
          <div
            style={{
              marginTop: '20px',
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ marginBottom: '20px', color: '#333', fontSize: '1.5rem', fontWeight: '600' }}>
              Employee Details
            </h3>
            <p style={{ margin: '5px 0' }}><strong>Name:</strong> {selectedEmployee.name}</p>
            <p style={{ margin: '5px 0' }}><strong>Email:</strong> {selectedEmployee.email || 'N/A'}</p>
            <p style={{ margin: '5px 0' }}><strong>Phone Number:</strong> {selectedEmployee.phoneNumber}</p>
            <p style={{ margin: '5px 0' }}><strong>Vehicle Number:</strong> {selectedEmployee.vehicleNumber}</p>
            <p style={{ margin: '5px 0' }}><strong>Role:</strong> {selectedEmployee.role}</p>
            <p style={{ margin: '5px 0' }}><strong>Secret Key:</strong> {selectedEmployee.secretKey || 'N/A'}</p>
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Dialog */}
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
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '30px',
              borderRadius: '8px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              maxWidth: '400px',
              textAlign: 'center',
              minWidth: '300px',
            }}
          >
            <FaTrash style={{ fontSize: '48px', color: '#e74c3c', marginBottom: '15px' }} />
            <h3 style={{ color: '#333', marginBottom: '10px', fontSize: '1.4rem' }}>Confirm Deletion</h3>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '1rem' }}>
              Are you sure you want to delete this employee? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={confirmDelete}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading ? '#ccc' : '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#c0392b')}
                onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#e74c3c')}
              >
                <FaCheck />
                Yes, Delete
              </button>
              <button
                onClick={cancelDelete}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading ? '#ccc' : '#95a5a6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#7f8c8d')}
                onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#95a5a6')}
              >
                <FaTimes />
                Cancel
              </button>
            </div>
            {loading && (
              <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '10px' }}>Deleting...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeePage;