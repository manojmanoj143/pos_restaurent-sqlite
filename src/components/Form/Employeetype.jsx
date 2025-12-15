import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaArrowLeft, FaUsersCog } from 'react-icons/fa';
const EmployeeType = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', salaryRange: '', designation: '', reportTo: '', grade: '', branch: '' });
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
  // Fetch types
  const fetchTypes = async () => {
    if (!baseUrl) return;
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/api/employee-types`);
      setTypes(response.data);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch types: ${err.response?.data?.error || err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (baseUrl) {
      fetchTypes();
    }
  }, [baseUrl]);
  // Handle search - shows all when empty, filters on name/description/salaryRange (case-insensitive); dynamic on every enter/keypress
  const filteredTypes = types.filter(type =>
    searchQuery === '' ||
    type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    type.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    type.salaryRange.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Handle form change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  // Validate form
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Type name is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.salaryRange.trim()) {
      setError('Salary range is required (e.g., 20000-50000)');
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
        response = await axios.put(`${baseUrl}/api/employee-types/${editingId}`, formData);
        setMessage('Type updated successfully');
      } else {
        response = await axios.post(`${baseUrl}/api/employee-types`, formData);
        setMessage('Type added successfully');
      }
      // If from AddEmployee, navigate back with preserved formData
      if (location.state?.fromAddEmployee) {
        navigate('/add-employee', { state: { formData: location.state.formData } });
        return;
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '', salaryRange: '', designation: '', reportTo: '', grade: '', branch: '' });
      fetchTypes();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${editingId ? 'update' : 'add'} type: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  // Handle edit
  const handleEdit = (type) => {
    setFormData({ name: type.name, description: type.description, salaryRange: type.salaryRange, designation: type.designation || '', reportTo: type.reportTo || '', grade: type.grade || '', branch: type.branch || '' });
    setEditingId(type.id);
    setShowForm(true);
    setError(null);
    setMessage('');
  };
  // Handle delete - No confirmation popup; direct action with warning via error message on failure
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${baseUrl}/api/employee-types/${id}`);
      setMessage('Type deleted successfully');
      fetchTypes();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to delete type: ${err.message}`);
    }
  };
  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', salaryRange: '', designation: '', reportTo: '', grade: '', branch: '' });
    setError(null);
    setMessage('');
    // If from AddEmployee, navigate back with preserved formData
    if (location.state?.fromAddEmployee) {
      navigate('/add-employee', { state: { formData: location.state.formData } });
    }
  };
  if (loading && types.length === 0) {
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
            Employee Types
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
                <FaPlus /> Add New Type
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
        {/* Search - Enhanced styling; shows all on empty input, filters dynamically on every character/enter */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block', width: '300px' }}>
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#bdc3c7', fontSize: '1rem' }} />
            <input
              type="text"
              placeholder="Search types..."
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
              {editingId ? 'Edit Type' : 'Add New Type'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Department / Type *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Department / Type (e.g., IT, Sales, Full-time)"
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
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Designation / Job Title (Optional)</label>
                <input
                  type="text"
                  name="designation"
                  placeholder="Designation/Job Title"
                  value={formData.designation}
                  onChange={handleInputChange}
                  style={{ padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s' }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Reports To (Manager/Supervisor) (Optional)</label>
                <input
                  type="text"
                  name="reportTo"
                  placeholder="Reports To"
                  value={formData.reportTo}
                  onChange={handleInputChange}
                  style={{ padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s' }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Employee Grade/Level (Optional)</label>
                <input
                  type="text"
                  name="grade"
                  placeholder="Grade/Level"
                  value={formData.grade}
                  onChange={handleInputChange}
                  style={{ padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s' }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Branch/Location (Optional)</label>
                <input
                  type="text"
                  name="branch"
                  placeholder="Branch/Location"
                  value={formData.branch}
                  onChange={handleInputChange}
                  style={{ padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s' }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>Salary Range * (e.g., 20000-50000)</label>
                <input
                  type="text"
                  name="salaryRange"
                  placeholder="Salary Range (e.g., 20000-50000)"
                  value={formData.salaryRange}
                  onChange={handleInputChange}
                  style={{ padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s' }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
                  required
                />
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
        {/* Table - Enhanced styling; small table okay, shows all filtered results; Added Grade and Branch columns for all fields */}
        <div style={{
          backgroundColor: '#fff',
          padding: '0',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #dee2e6' }}>
            <h3 style={{ color: '#2c3e50', margin: 0, fontSize: '1.2rem' }}>Types List ({filteredTypes.length})</h3>
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>Loading...</div>
          ) : filteredTypes.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>No types found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '15px 10px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Dept / Type</th>
                    <th style={{ padding: '15px 10px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Description</th>
                    <th style={{ padding: '15px 10px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Designation</th>
                    <th style={{ padding: '15px 10px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Reports To</th>
                    <th style={{ padding: '15px 10px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Grade</th>
                    <th style={{ padding: '15px 10px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Branch</th>
                    <th style={{ padding: '15px 10px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Salary Range</th>
                    <th style={{ padding: '15px 10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: '600', color: '#2c3e50' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTypes.map((type) => (
                    <tr key={type.id} style={{ backgroundColor: '#fff' }}>
                      <td style={{ padding: '15px 10px', border: '1px solid #dee2e6' }}>{type.name}</td>
                      <td style={{ padding: '15px 10px', border: '1px solid #dee2e6' }}>{type.description}</td>
                      <td style={{ padding: '15px 10px', border: '1px solid #dee2e6' }}>{type.designation || '-'}</td>
                      <td style={{ padding: '15px 10px', border: '1px solid #dee2e6' }}>{type.reportTo || '-'}</td>
                      <td style={{ padding: '15px 10px', border: '1px solid #dee2e6' }}>{type.grade || '-'}</td>
                      <td style={{ padding: '15px 10px', border: '1px solid #dee2e6' }}>{type.branch || '-'}</td>
                      <td style={{ padding: '15px 10px', border: '1px solid #dee2e6' }}>{type.salaryRange}</td>
                      <td style={{
                        padding: '15px 10px',
                        border: '1px solid #dee2e6',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <button
                          onClick={() => handleEdit(type)}
                          style={{
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
                          onClick={() => handleDelete(type.id)}
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
export default EmployeeType;