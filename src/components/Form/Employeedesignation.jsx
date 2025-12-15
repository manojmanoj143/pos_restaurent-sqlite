import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaArrowLeft, FaUsersCog } from 'react-icons/fa';
const EmployeeDesignation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', reportTo: '' });
  const [baseUrl, setBaseUrl] = useState('');
  // Check if coming from AddEmployee to show form by default
  useEffect(() => {
    if (location.state?.fromAddEmployee) {
      setShowForm(true);
      setEditingId(null); // Ensure create mode
    }
  }, [location.state]);
  // Fetch baseUrl
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
  // Fetch designations
  const fetchDesignations = async () => {
    if (!baseUrl) return;
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/api/employee-designations`);
      setDesignations(response.data);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch designations: ${err.response?.data?.error || err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (baseUrl) {
      fetchDesignations();
    }
  }, [baseUrl]);
  // Handle search - shows all when empty, filters on name/description (case-insensitive)
  const filteredDesignations = designations.filter(designation =>
    searchQuery === '' ||
    designation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    designation.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Handle form change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  // Validate form
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Designation name is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    setError(null);
    return true;
  };
  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      let response;
      if (editingId) {
        response = await axios.put(`${baseUrl}/api/employee-designations/${editingId}`, formData);
        setMessage('Designation updated successfully');
      } else {
        response = await axios.post(`${baseUrl}/api/employee-designations`, formData);
        setMessage('Designation added successfully');
      }
      // If from AddEmployee, navigate back with preserved formData
      if (location.state?.fromAddEmployee) {
        navigate('/add-employee', { state: { formData: location.state.formData } });
        return;
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '', reportTo: '' });
      fetchDesignations();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${editingId ? 'update' : 'add'} designation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  // Handle edit
  const handleEdit = (designation) => {
    setFormData({ name: designation.name, description: designation.description, reportTo: designation.reportTo || '' });
    setEditingId(designation.id);
    setShowForm(true);
    setError(null);
    setMessage('');
  };
  // Handle delete - No confirmation popup; direct action with warning via error message on failure
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${baseUrl}/api/employee-designations/${id}`);
      setMessage('Designation deleted successfully');
      fetchDesignations();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to delete designation: ${err.message}`);
    }
  };
  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', reportTo: '' });
    setError(null);
    setMessage('');
    // If from AddEmployee, navigate back with preserved formData
    if (location.state?.fromAddEmployee) {
      navigate('/add-employee', { state: { formData: location.state.formData } });
    }
  };
  if (loading && designations.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>Loading...</div>
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
      {/* Fixed Back Button - Matched from AddEmployee */}
      <button
        onClick={() => {
          if (location.state?.fromAddEmployee) {
            navigate('/add-employee', { state: { formData: location.state.formData } });
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
      >
        <FaArrowLeft /> {location.state?.fromAddEmployee ? 'Back to Add Employee' : 'Back to Admin'}
      </button>
      {/* Main Container - Adjusted maxWidth to 1000px for table */}
      <div style={{
        maxWidth: '1000px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header - Matched structure from AddEmployee */}
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
            <FaUsersCog style={{ color: '#3498db', fontSize: '2rem' }} />
            Employee Designations
          </h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {!showForm && !location.state?.fromAddEmployee && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                style={{
                  padding: '10px 15px',
                  background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.3s ease',
                  fontWeight: '500'
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
                <FaPlus /> Add New Designation
              </button>
            )}
          </div>
        </div>
        {/* Error and Message - Matched from AddEmployee; Warning messages only via these */}
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
            <FaTrash style={{ fontSize: '1.2rem' }} />
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
            <FaPlus style={{ fontSize: '1.2rem', color: '#27ae60' }} />
            {message}
          </div>
        )}
        {/* Search - Enhanced styling; shows all on empty input */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block', width: '300px' }}>
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#bdc3c7', fontSize: '1rem' }} />
            <input
              type="text"
              placeholder="Search designations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '1px solid #bdc3c7',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
            />
          </div>
        </div>
        {/* Form for Add/Edit - Enhanced styling */}
        {showForm && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            marginBottom: '25px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.3rem', textAlign: 'center' }}>
              {editingId ? 'Edit Designation' : 'Add New Designation'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Designation Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Designation Name (e.g., Manager)"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={{ padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s' }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Description *</label>
                <textarea
                  name="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={{ padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '1rem', outline: 'none', resize: 'vertical', minHeight: '100px', transition: 'border-color 0.3s' }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Report To</label>
                <select
                  name="reportTo"
                  value={formData.reportTo}
                  onChange={handleInputChange}
                  style={{ padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s', backgroundColor: 'white' }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
                >
                  <option value="">Select Manager/Supervisor</option>
                  {designations
                    .filter(d => !editingId || d.id !== editingId) // Exclude self
                    .map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 6px 12px rgba(52, 152, 219, 0.4)')}
                  onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.3)')}
                >
                  {loading ? 'Saving...' : (editingId ? 'Update' : 'Add')}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
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
                  onMouseOver={(e) => e.target.style.backgroundColor = '#7f8c8d'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#95a5a6'}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        {/* Table - Enhanced styling; small table okay, shows all filtered results */}
        <div style={{
          backgroundColor: '#fff',
          padding: '0',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #dee2e6' }}>
            <h3 style={{ color: '#2c3e50', margin: 0, fontSize: '1.2rem' }}>Designations List ({filteredDesignations.length})</h3>
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>Loading...</div>
          ) : filteredDesignations.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>No designations found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '15px 10px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Name</th>
                    <th style={{ padding: '15px 10px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Description</th>
                    <th style={{ padding: '15px 10px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Report To</th>
                    <th style={{ padding: '15px 10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: '600', color: '#2c3e50' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDesignations.map((designation) => (
                    <tr key={designation.id} style={{ backgroundColor: '#fff' }}>
                      <td style={{ padding: '15px 10px', border: '1px solid #dee2e6' }}>{designation.name}</td>
                      <td style={{ padding: '15px 10px', border: '1px solid #dee2e6' }}>{designation.description}</td>
                      <td style={{ padding: '15px 10px', border: '1px solid #dee2e6' }}>{designation.reportTo || '-'}</td>
                      <td style={{ padding: '15px 10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEdit(designation)}
                          style={{
                            marginRight: '10px',
                            padding: '8px 12px',
                            background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.9rem'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.boxShadow = '0 4px 8px rgba(243, 156, 18, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(designation.id)}
                          style={{
                            padding: '8px 12px',
                            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.9rem'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.boxShadow = '0 4px 8px rgba(231, 76, 60, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default EmployeeDesignation;