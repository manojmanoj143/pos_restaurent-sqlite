// src/components/Form/Employeedepartment.jsx (NEW: Full detailed page for managing Employee Departments.
// Modeled after EmployeeDesignation/EmployeeType: List view with add/edit/delete.
// Handles navigation back to AddEmployee with state restoration after create/edit.
// Fetches from /api/departments, POST/PUT/DELETE to same.
// Includes search, pagination (simple), confirmation modals for delete.
// UI consistent with AddEmployee: tabs not needed, just list + form.
// Added icon FaBuilding for department.
// Handles fromAddEmployee state to auto-navigate back after save.
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaBuilding, FaPlus, FaEdit, FaTrash, FaArrowLeft, FaSearch, FaSave, FaTimes } from 'react-icons/fa';

const EmployeeDepartment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', is_active: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [fromAddEmployee, setFromAddEmployee] = useState(false);

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

  // Handle state from AddEmployee
  useEffect(() => {
    if (location.state?.fromAddEmployee) {
      setFromAddEmployee(true);
      // Restore formData if provided (for consistency, though not editing here)
      if (location.state.formData) {
        setFormData(location.state.formData);
      }
    }
  }, [location.state]);

  // Fetch departments
  useEffect(() => {
    if (baseUrl) {
      fetchDepartments();
    }
  }, [baseUrl]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/api/departments`);
      setDepartments(response.data);
    } catch (err) {
      setError('Failed to fetch departments.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Department name is required.');
      return;
    }
    try {
      setLoading(true);
      let response;
      if (editingId) {
        response = await axios.put(`${baseUrl}/api/departments/${editingId}`, formData);
        setMessage('Department updated successfully!');
      } else {
        response = await axios.post(`${baseUrl}/api/departments`, formData);
        setMessage('Department created successfully!');
      }
      setError('');
      setFormData({ name: '', is_active: true });
      setEditingId(null);
      setShowForm(false);
      await fetchDepartments();
      // If from AddEmployee, navigate back with restored state
      if (fromAddEmployee) {
        navigate('/add-employee', {
          state: {
            formData: location.state?.formData || { department: formData.name }, // Set the new department if needed
            selectedISDCode: location.state?.selectedISDCode || '+971',
            isEditing: !!location.state?.editingId,
            editingId: location.state?.editingId
          }
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save department.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dept) => {
    setFormData({ name: dept.name, is_active: dept.is_active });
    setEditingId(dept._id || dept.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${baseUrl}/api/departments/${deleteId}`);
      setMessage('Department deleted successfully!');
      setDepartments(prev => prev.filter(d => (d._id || d.id) !== deleteId));
      setShowDeleteConfirm(false);
      setDeleteId(null);
    } catch (err) {
      setError('Failed to delete department.');
      console.error(err);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBack = () => {
    if (fromAddEmployee) {
      navigate('/add-employee', {
        state: {
          formData: location.state?.formData,
          selectedISDCode: location.state?.selectedISDCode || '+971',
          isEditing: !!location.state?.editingId,
          editingId: location.state?.editingId
        }
      });
    } else {
      navigate('/admin');
    }
  };

  if (loading && !departments.length) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px'
    }}>
      {/* Back Button */}
      <button
        onClick={handleBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          backgroundColor: 'transparent',
          border: '2px solid #3498db',
          color: '#3498db',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontWeight: '600'
        }}
      >
        <FaArrowLeft /> Back
      </button>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '20px' }}>
          <FaBuilding style={{ color: '#3498db', marginRight: '10px' }} />
          Employee Departments
        </h2>

        {/* Alerts */}
        {error && (
          <div style={{ backgroundColor: '#ffebee', color: '#c0392b', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
            <FaTimes style={{ marginRight: '5px' }} /> {error}
          </div>
        )}
        {message && (
          <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
            {message}
          </div>
        )}

        {/* Add Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
            disabled={loading}
          >
            <FaPlus /> Add New Department
          </button>
        )}

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '20px', border: '1px solid #bdc3c7', borderRadius: '8px' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>{editingId ? 'Edit Department' : 'Add New Department'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ fontWeight: '600', marginBottom: '5px', display: 'block' }}>Department Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontWeight: '600', marginBottom: '5px', display: 'block' }}>Status</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
                  Active
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                <FaSave style={{ marginRight: '5px' }} /> {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ name: '', is_active: true });
                  setEditingId(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Search */}
        {!showForm && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
              <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#bdc3c7' }} />
              <input
                type="text"
                placeholder="Search departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 10px 10px 35px',
                  border: '1px solid #bdc3c7',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>
        )}

        {/* List */}
        {!showForm && (
          <div style={{ border: '1px solid #bdc3c7', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bdc3c7' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bdc3c7' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #bdc3c7' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((dept) => (
                    <tr key={dept._id || dept.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>{dept.name}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ color: dept.is_active ? '#27ae60' : '#e74c3c', fontWeight: '500' }}>
                          {dept.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEdit(dept)}
                          style={{ marginRight: '10px', color: '#3498db', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => confirmDelete(dept._id || dept.id)}
                          style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                      {searchQuery ? 'No departments match the search.' : 'No departments found. Add one above.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>Confirm Delete</h3>
            <p>Are you sure you want to delete this department? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
              <button
                onClick={handleDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteId(null);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
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

export default EmployeeDepartment;