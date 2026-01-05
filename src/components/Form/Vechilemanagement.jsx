// src/components/Form/VehicleManagement.jsx
// UPDATED: Full detailed Vehicle Management component aligned to schema with File Uploads.
// Manages vehicles with all specified fields + Insurance/Pollution file uploads.
// Fields: vehicle_number, vehicle_type, brand, model, fuel_type, is_company_owned, rc_number, rc_expiry,
// insurance_number, insurance_expiry (with file), pollution_expiry (with file), status.
// Uses FormData for API calls to support file uploads.
// Expiry Dates are positioned ABOVE the file upload fields.
// ALL FIELDS ARE OPTIONAL (Removed 'required' attribute).
// STYLE UPDATE: Matched EmployeeList styling - gradient background, fixed back button, main container, styled alerts, filters/search, table, modals.
// IMAGE UPDATE: Displaying uploaded documents as images in the table (Thumbnail preview).

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  FaCar,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaArrowLeft,
  FaSave,
  FaTimes,
  FaSpinner,
  FaCheck,
  FaExclamationTriangle,
  FaBuilding,
  FaUser,
  FaFileUpload,
  FaFileAlt,
  FaEye,
  FaFilter,
  FaCheckCircle
} from 'react-icons/fa';

const VehicleManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [vehicles, setVehicles] = useState([]);

  // NEW: specific effect to handle auto-open add modal from navigation state
  useEffect(() => {
    if (location.state && (location.state.action === 'create' || location.state.openAddModal)) {
      setShowAddModal(true);
    }
  }, [location.state]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [vehiclesPerPage] = useState(5);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: '',
    brand: '',
    model: '',
    fuel_type: '',
    is_company_owned: true,
    rc_number: '',
    rc_expiry: '',
    insurance_number: '',
    insurance_expiry: '',
    insurance_doc: null, // File object
    pollution_expiry: '',
    pollution_doc: null, // File object
    status: 'ACTIVE',
  });

  const [baseUrl, setBaseUrl] = useState('');

  // Fetch base URL from config
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
        setBaseUrl('');
      } finally {
        fetchVehicles();
      }
    };
    fetchConfig();
  }, []);

  // Fetch all vehicles
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${baseUrl}/api/vechile/management`);
      setVehicles(response.data);
    } catch (err) {
      setError(`Failed to fetch vehicles: ${err.message}`);
      console.error('Fetch vehicles error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] // Store only the first file
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Helper to append form data
  const createFormData = (data) => {
    const form = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== '') {
        form.append(key, data[key]);
      }
    });
    return form;
  }

  // Add new vehicle
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = createFormData(formData);
      await axios.post(`${baseUrl}/api/vechile/management`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage('Vehicle added successfully!');

      // NEW: Check for returnTo state
      if (location.state && location.state.returnTo) {
        navigate(location.state.returnTo, {
          state: {
            newVehicleNumber: formData.vehicle_number,
            preservedState: location.state.preservedState
          }
        });
        return; // Skip the rest as we are navigating away
      }

      setShowAddModal(false);
      resetForm();
      fetchVehicles();
    } catch (err) {
      setError(`Failed to add vehicle: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Edit vehicle
  const handleEditVehicle = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      setLoading(true);
      const data = createFormData(formData);
      await axios.put(`${baseUrl}/api/vechile/management/${selectedVehicle._id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage('Vehicle updated successfully!');
      setShowEditModal(false);
      setSelectedVehicle(null);
      fetchVehicles();
    } catch (err) {
      setError(`Failed to update vehicle: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete vehicle
  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return;
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/api/vechile/management/${selectedVehicle._id}`);
      setMessage('Vehicle deleted successfully!');
      setShowDeleteConfirm(false);
      setSelectedVehicle(null);
      fetchVehicles();
    } catch (err) {
      setError(`Failed to delete vehicle: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_number: '',
      vehicle_type: '',
      brand: '',
      model: '',
      fuel_type: '',
      is_company_owned: true,
      rc_number: '',
      rc_expiry: '',
      insurance_number: '',
      insurance_expiry: '',
      insurance_doc: null,
      pollution_expiry: '',
      pollution_doc: null,
      status: 'ACTIVE',
    });
  }

  // Open add modal
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
    setError(null);
    setMessage('');
  };

  // Open edit modal
  const openEditModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      vehicle_number: vehicle.vehicle_number || '',
      vehicle_type: vehicle.vehicle_type || '',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      fuel_type: vehicle.fuel_type || '',
      is_company_owned: vehicle.is_company_owned,
      rc_number: vehicle.rc_number || '',
      rc_expiry: vehicle.rc_expiry ? vehicle.rc_expiry.split('T')[0] : '',
      insurance_number: vehicle.insurance_number || '',
      insurance_expiry: vehicle.insurance_expiry ? vehicle.insurance_expiry.split('T')[0] : '',
      insurance_doc: vehicle.insurance_doc || null,
      pollution_expiry: vehicle.pollution_expiry ? vehicle.pollution_expiry.split('T')[0] : '',
      pollution_doc: vehicle.pollution_doc || null,
      status: vehicle.status || 'ACTIVE',
    });
    setShowEditModal(true);
    setError(null);
    setMessage('');
  };

  // Open delete confirmation
  const openDeleteConfirm = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDeleteConfirm(true);
  };

  // Close modals
  const closeModal = (modal) => {
    if (modal === 'add') setShowAddModal(false);
    if (modal === 'edit') {
      setShowEditModal(false);
      setSelectedVehicle(null);
    }
    if (modal === 'delete') setShowDeleteConfirm(false);
    setError(null);
    setMessage('');
  };

  // Filtered vehicles based on search
  const filteredVehicles = vehicles.filter(vehicle =>
    (vehicle.vehicle_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (vehicle.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (vehicle.model || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const indexOfLastVehicle = currentPage * vehiclesPerPage;
  const indexOfFirstVehicle = indexOfLastVehicle - vehiclesPerPage;
  const currentVehicles = filteredVehicles.slice(indexOfFirstVehicle, indexOfLastVehicle);
  const totalPages = Math.ceil(filteredVehicles.length / vehiclesPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Status badge style
  const getStatusBadge = (status) => {
    const colors = {
      ACTIVE: { bg: '#d4edda', color: '#155724' },
      INACTIVE: { bg: '#f8d7da', color: '#721c24' },
      IN_MAINTENANCE: { bg: '#fff3cd', color: '#856404' },
    };
    return colors[status] || colors.ACTIVE;
  };

  const getOwnedBadge = (isCompanyOwned) => {
    return isCompanyOwned ? <><FaBuilding /> Company</> : <><FaUser /> Employee</>;
  };

  // Helper for rendering file link (Text) - Used in Edit Modal fallback
  const renderFileLink = (path, label) => {
    if (!path) return <span style={{ color: '#95a5a6', fontSize: '0.8rem' }}>No file</span>;
    return (
      <a href={`${baseUrl}/api/images/${path}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#3498db', textDecoration: 'none' }}>
        <FaEye /> View {label}
      </a>
    );
  };

  // NEW: Helper for rendering file IMAGE PREVIEW - Used in Table
  const renderFilePreview = (path, label) => {
    if (!path) return <span style={{ color: '#95a5a6', fontSize: '0.8rem' }}>No file</span>;

    const isImage = (fileName) => /\.(jpg|jpeg|png|gif|webp|jfif|ico|svg)$/i.test(fileName);
    const isPdf = (fileName) => /\.pdf$/i.test(fileName);

    const previewStyle = {
      width: '50px',
      height: '50px',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #dfe6e9',
      cursor: 'pointer',
      backgroundColor: '#f1f2f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      color: '#7f8c8d'
    };

    if (isImage(path)) {
      return (
        <div
          style={previewStyle}
          onClick={() => window.open(`${baseUrl}/api/images/${path}`, '_blank')}
          title={`View ${label}`}
        >
          <img
            src={`${baseUrl}/api/images/${path}`}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.style.display = 'none';
              // Fallback to generic icon if image fails
              e.target.parentNode.children[1].style.display = 'block';
            }}
          />
          <FaFileAlt style={{ display: 'none' }} />
        </div>
      );
    } else {
      return (
        <div
          style={previewStyle}
          onClick={() => window.open(`${baseUrl}/api/images/${path}`, '_blank')}
          title={`View ${label}`}
        >
          {isPdf(path) ? <FaFileAlt style={{ color: '#e74c3c' }} /> : <FaFileAlt style={{ color: '#3498db' }} />}
        </div>
      );
    }
  };

  if (loading && vehicles.length === 0) {
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
          <FaCar style={{ fontSize: '48px', marginBottom: '20px', color: '#3498db' }} />
          <p>Loading vehicles...</p>
        </div>
      </div>
    );
  }

  // Common Form Content - UPDATED: No required attributes
  const renderFormContent = () => (
    <>
      <input
        type="text"
        name="vehicle_number"
        placeholder="Vehicle Number (e.g., TN60X1234)"
        value={formData.vehicle_number}
        onChange={handleInputChange}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
      />
      <select
        name="vehicle_type"
        value={formData.vehicle_type}
        onChange={handleInputChange}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
      >
        <option value="">Select Vehicle Type</option>
        <option value="BIKE">BIKE</option>
        <option value="SCOOTER">SCOOTER</option>
        <option value="CAR">CAR</option>
        <option value="VAN">VAN</option>
      </select>
      <input
        type="text"
        name="brand"
        placeholder="Brand (e.g., Honda)"
        value={formData.brand}
        onChange={handleInputChange}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
      />
      <input
        type="text"
        name="model"
        placeholder="Model (e.g., Activa)"
        value={formData.model}
        onChange={handleInputChange}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
      />
      <select
        name="fuel_type"
        value={formData.fuel_type}
        onChange={handleInputChange}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
      >
        <option value="">Select Fuel Type</option>
        <option value="PETROL">PETROL</option>
        <option value="DIESEL">DIESEL</option>
        <option value="ELECTRIC">ELECTRIC</option>
      </select>
      <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        <input
          type="checkbox"
          name="is_company_owned"
          checked={formData.is_company_owned}
          onChange={handleInputChange}
          style={{ marginRight: '10px' }}
        />
        Company Owned
      </label>
      <input
        type="text"
        name="rc_number"
        placeholder="RC Number"
        value={formData.rc_number}
        onChange={handleInputChange}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
      />
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>RC Expiry Date:</label>
      <input
        type="date"
        name="rc_expiry"
        value={formData.rc_expiry}
        onChange={handleInputChange}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
      />

      <input
        type="text"
        name="insurance_number"
        placeholder="Insurance Number"
        value={formData.insurance_number}
        onChange={handleInputChange}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
      />
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Insurance Expiry Date:</label>
      <input
        type="date"
        name="insurance_expiry"
        value={formData.insurance_expiry}
        onChange={handleInputChange}
        style={{ width: '100%', padding: '10px', marginBottom: '5px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
      />
      <div style={{ marginBottom: '15px', padding: '10px', border: '1px dashed #bdc3c7', borderRadius: '5px', backgroundColor: '#fafafa' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', fontSize: '0.9rem', color: '#555' }}>
          <FaFileUpload /> Upload Insurance Document
        </label>
        {formData.insurance_doc && typeof formData.insurance_doc === 'string' ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px',
            background: '#f1f2f6',
            borderRadius: '5px',
            border: '1px solid #dfe6e9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <FaFileAlt style={{ color: '#3498db' }} />
              <a
                href={`${baseUrl}/api/images/${formData.insurance_doc}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', color: '#2980b9', fontSize: '0.9rem', whiteWhiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}
              >
                View Existing Document
              </a>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, insurance_doc: null, delete_insurance_doc: true })}
              style={{
                border: 'none',
                background: '#e74c3c',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <FaTrash /> Delete
            </button>
          </div>
        ) : (
          <>
            <input
              type="file"
              name="insurance_doc"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.svg"
              onChange={handleInputChange}
              style={{ width: '100%' }}
            />
            {formData.insurance_doc && typeof formData.insurance_doc === 'object' && (
              <div style={{ fontSize: '0.8rem', color: '#27ae60', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FaCheckCircle /> Selected: {formData.insurance_doc.name}
              </div>
            )}
          </>
        )}
      </div>

      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Pollution (PUC) Expiry Date:</label>
      <input
        type="date"
        name="pollution_expiry"
        value={formData.pollution_expiry}
        onChange={handleInputChange}
        style={{ width: '100%', padding: '10px', marginBottom: '5px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
      />
      <div style={{ marginBottom: '15px', padding: '10px', border: '1px dashed #bdc3c7', borderRadius: '5px', backgroundColor: '#fafafa' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', fontSize: '0.9rem', color: '#555' }}>
          <FaFileUpload /> Upload Pollution Document
        </label>
        {formData.pollution_doc && typeof formData.pollution_doc === 'string' ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px',
            background: '#f1f2f6',
            borderRadius: '5px',
            border: '1px solid #dfe6e9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <FaFileAlt style={{ color: '#3498db' }} />
              <a
                href={`${baseUrl}/api/images/${formData.pollution_doc}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', color: '#2980b9', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}
              >
                View Existing Document
              </a>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, pollution_doc: null, delete_pollution_doc: true })}
              style={{
                border: 'none',
                background: '#e74c3c',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <FaTrash /> Delete
            </button>
          </div>
        ) : (
          <>
            <input
              type="file"
              name="pollution_doc"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.svg"
              onChange={handleInputChange}
              style={{ width: '100%' }}
            />
            {formData.pollution_doc && typeof formData.pollution_doc === 'object' && (
              <div style={{ fontSize: '0.8rem', color: '#27ae60', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FaCheckCircle /> Selected: {formData.pollution_doc.name}
              </div>
            )}
          </>
        )}
      </div>

      <select
        name="status"
        value={formData.status}
        onChange={handleInputChange}
        style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
      >
        <option value="ACTIVE">ACTIVE</option>
        <option value="IN_MAINTENANCE">IN_MAINTENANCE</option>
        <option value="INACTIVE">INACTIVE</option>
      </select>
    </>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Fixed Back Button in Top-Left Corner - Styled like EmployeeList */}
      <button
        onClick={() => {
          if (location.state && location.state.returnTo) {
            navigate(location.state.returnTo, { state: { preservedState: location.state.preservedState } });
          } else {
            navigate('/admin');
          }
        }}
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
            <FaCar style={{ color: '#3498db', fontSize: '2rem' }} />
            Vehicle Management ({filteredVehicles.length})
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={openAddModal}
              style={{
                background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
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
                boxShadow: '0 4px 8px rgba(39, 174, 96, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(39, 174, 96, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(39, 174, 96, 0.3)';
              }}
              disabled={loading}
            >
              <FaPlus /> Add New Vehicle
            </button>
          </div>
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
            <FaExclamationTriangle style={{ fontSize: '1.2rem' }} />
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

        {/* Search/Filter Section - Styled like EmployeeList Filter Group */}
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
            <h4 style={{ margin: 0, color: '#2c3e50', fontWeight: '600' }}>Filter Vehicles</h4>
            <button
              onClick={() => setSearchQuery('')}
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
              Clear Search
            </button>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '15px'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '0.95rem',
                color: '#2c3e50'
              }}>Search Vehicles</label>
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
                  placeholder="Search by vehicle number, brand, or model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Vehicles Table - Styled like EmployeeList Table */}
        <div style={{
          overflowX: 'auto',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          marginBottom: '20px'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', color: 'white' }}>
                <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Vehicle Number</th>
                <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Type</th>
                <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Brand</th>
                <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Model</th>
                <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Owned</th>
                <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>RC Expiry</th>
                <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Insurance</th>
                <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Pollution</th>
                <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Status</th>
                <th style={{ padding: '15px 12px', border: 'none', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentVehicles.length > 0 ? (
                currentVehicles.map((vehicle, index) => (
                  <tr key={vehicle._id} style={{
                    borderBottom: '1px solid #e9ecef',
                    transition: 'all 0.2s ease',
                    backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff',
                    cursor: 'pointer'
                  }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
                    }}
                  >
                    <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', whiteSpace: 'nowrap', color: '#2c3e50' }}>{vehicle.vehicle_number}</td>
                    <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', whiteSpace: 'nowrap', color: '#2c3e50' }}>{vehicle.vehicle_type}</td>
                    <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', whiteSpace: 'nowrap', color: '#2c3e50' }}>{vehicle.brand}</td>
                    <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', whiteSpace: 'nowrap', color: '#2c3e50' }}>{vehicle.model}</td>
                    <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', whiteSpace: 'nowrap', color: '#2c3e50' }}>
                      <span style={{
                        padding: '5px 10px',
                        borderRadius: '15px',
                        fontSize: '0.8rem',
                        backgroundColor: vehicle.is_company_owned ? '#d1ecf1' : '#f8d7da',
                        color: vehicle.is_company_owned ? '#0c5460' : '#721c24',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}>
                        {getOwnedBadge(vehicle.is_company_owned)}
                      </span>
                    </td>
                    <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', whiteSpace: 'nowrap', color: '#2c3e50' }}>{vehicle.rc_expiry ? new Date(vehicle.rc_expiry).toLocaleDateString() : 'N/A'}</td>
                    {/* Insurance & Pollution Columns with Image Previews */}
                    <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', whiteSpace: 'normal', color: '#2c3e50' }}>
                      <div style={{ fontSize: '0.9rem', marginBottom: '5px' }}>{vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString() : 'N/A'}</div>
                      {renderFilePreview(vehicle.insurance_doc, 'Doc')}
                    </td>
                    <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', whiteSpace: 'normal', color: '#2c3e50' }}>
                      <div style={{ fontSize: '0.9rem', marginBottom: '5px' }}>{vehicle.pollution_expiry ? new Date(vehicle.pollution_expiry).toLocaleDateString() : 'N/A'}</div>
                      {renderFilePreview(vehicle.pollution_doc, 'Doc')}
                    </td>
                    <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', whiteSpace: 'nowrap', color: '#2c3e50', textAlign: 'center' }}>
                      <span style={{
                        padding: '5px 10px',
                        borderRadius: '15px',
                        fontSize: '0.8rem',
                        backgroundColor: getStatusBadge(vehicle.status).bg,
                        color: getStatusBadge(vehicle.status).color,
                      }}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => openEditModal(vehicle)}
                        style={{
                          marginRight: '10px',
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
                        onClick={() => openDeleteConfirm(vehicle)}
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
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
                    {loading ? 'Loading vehicles...' : 'No vehicles found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Styled like EmployeeList */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '5px' }}>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                style={{
                  padding: '8px 12px',
                  border: currentPage === index + 1 ? '2px solid #3498db' : '1px solid #bdc3c7',
                  backgroundColor: currentPage === index + 1 ? '#3498db' : 'white',
                  color: currentPage === index + 1 ? 'white' : '#2c3e50',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  if (currentPage !== index + 1) {
                    e.target.style.backgroundColor = '#ecf0f1';
                  }
                }}
                onMouseOut={(e) => {
                  if (currentPage !== index + 1) {
                    e.target.style.backgroundColor = 'white';
                  }
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal - Styled like EmployeeList Modals */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(3px)'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal('add'); }}
        >
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '15px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 15px 30px rgba(0, 0, 0, 0.3)',
            animation: 'fadeIn 0.3s'
          }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#2c3e50' }}>
              <FaPlus /> Add New Vehicle
            </h2>
            <form onSubmit={handleAddVehicle}>
              {renderFormContent()}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => closeModal('add')}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <FaTimes /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    background: loading ? 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)' : 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaSave />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal - Styled like EmployeeList Modals */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(3px)'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal('edit'); }}
        >
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '15px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 15px 30px rgba(0, 0, 0, 0.3)',
            animation: 'fadeIn 0.3s'
          }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#2c3e50' }}>
              <FaEdit /> Edit Vehicle
            </h2>
            <form onSubmit={handleEditVehicle}>
              {renderFormContent()}
              {/* Show Existing Files in Edit Mode */}
              {selectedVehicle && (
                <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#eef2f7', borderRadius: '5px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Current Documents:</p>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div>
                      <span style={{ fontSize: '0.9rem', color: '#555' }}>Insurance:</span>
                      {renderFileLink(selectedVehicle.insurance_doc, 'Insurance')}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.9rem', color: '#555' }}>Pollution:</span>
                      {renderFileLink(selectedVehicle.pollution_doc, 'Pollution')}
                    </div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => closeModal('edit')}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <FaTimes /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    background: loading ? 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)' : 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaSave />} Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Styled like EmployeeList */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(3px)'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal('delete'); }}
        >
          <div style={{
            backgroundColor: '#ffffff',
            padding: '30px',
            borderRadius: '15px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
            textAlign: 'center',
            border: '1px solid #e9ecef',
            animation: 'fadeIn 0.3s'
          }}>
            <FaExclamationTriangle style={{ fontSize: '3rem', color: '#f39c12', marginBottom: '20px' }} />
            <h3 style={{ color: '#e74c3c', marginBottom: '15px' }}>Delete Vehicle?</h3>
            <p style={{ color: '#2c3e50', marginBottom: '25px' }}>Are you sure you want to delete <strong>{selectedVehicle?.vehicle_number}</strong>? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleDeleteVehicle}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: loading ? 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)' : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 8px rgba(231, 76, 60, 0.3)',
                  transition: 'all 0.3s ease',
                  minWidth: '120px'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 12px rgba(231, 76, 60, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 8px rgba(231, 76, 60, 0.3)';
                  }
                }}
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => closeModal('delete')}
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

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default VehicleManagement;