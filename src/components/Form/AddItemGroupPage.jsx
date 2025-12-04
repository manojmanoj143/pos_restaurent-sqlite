import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaBox, FaTrash, FaCheckCircle, FaExclamationTriangle, FaSearch } from 'react-icons/fa';

function AddItemGroupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ group_name: '' });
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');

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

  // Fetch existing item groups when baseUrl is set
  useEffect(() => {
    if (baseUrl !== undefined) {
      fetchGroups();
    }
  }, [baseUrl]);

  const filteredGroups = useMemo(() => 
    groups.filter(group => 
      group.group_name.toLowerCase().includes(searchTerm.toLowerCase())
    ), 
    [groups, searchTerm]
  );

  const fetchGroups = async () => {
    try {
      const url = baseUrl ? `${baseUrl}/api/item-groups` : '/api/item-groups';
      const response = await axios.get(url);
      setGroups(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to fetch item groups. Please try again.');
    }
  };

  const handleGoBack = () => navigate('/admin');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const url = baseUrl ? `${baseUrl}/api/item-groups` : '/api/item-groups';
      const response = await axios.post(url, {
        group_name: formData.group_name.trim(),
      });
      setSuccess(response.data.message);
      setFormData({ group_name: '' });
      fetchGroups(); // Refresh the group list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create item group');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (groupId) => {
    try {
      setLoading(true);
      setError(null);
      const url = baseUrl ? `${baseUrl}/api/item-groups/${groupId}` : `/api/item-groups/${groupId}`;
      await axios.delete(url);
      setSuccess('Item group deleted successfully');
      fetchGroups(); // Refresh the group list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete item group');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setGroupToDelete(null);
    }
  };

  const openDeleteModal = (groupId) => {
    setGroupToDelete(groupId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = (e) => {
    if (e.target === e.currentTarget) {
      setShowDeleteModal(false);
      setGroupToDelete(null);
    }
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
          <FaBox style={{ fontSize: '48px', marginBottom: '20px', color: '#3498db' }} />
          <p>Loading item groups...</p>
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
        onClick={handleGoBack}
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

      {/* Main Container - Styled like EmployeeList Card */}
      <div style={{
        maxWidth: '600px',
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
            <FaBox style={{ color: '#3498db', fontSize: '2rem' }} />
            Add Item Group
          </h2>
        </div>

        {/* Error and Success Messages - Styled like EmployeeList Alerts */}
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
        {success && (
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
            <FaCheckCircle style={{ fontSize: '1.2rem', color: '#27ae60' }} />
            {success}
          </div>
        )}

        {/* Form - Styled like EmployeeList Inputs */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '0.95rem',
              color: '#2c3e50'
            }}>Group Name</label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8f9fa',
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #e9ecef'
            }}>
              <FaBox style={{ color: '#7f8c8d', fontSize: '1rem' }} />
              <input
                type="text"
                name="group_name"
                value={formData.group_name}
                onChange={handleChange}
                required
                placeholder="e.g., Burgers, Addons, Combos"
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
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#95a5a6' : 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '25px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              boxShadow: loading ? 'none' : '0 4px 8px rgba(52, 152, 219, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(52, 152, 219, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.3)';
              }
            }}
          >
            {loading ? 'Adding...' : 'Add Item Group'}
          </button>
        </form>

        {/* Display Groups List - Wrapped in a Scrollable Card */}
        <div style={{ marginTop: '20px' }}>
          <h3 style={{
            color: '#2c3e50',
            fontSize: '1.5rem',
            marginBottom: '15px',
            textAlign: 'center',
            borderBottom: '1px solid #3498db',
            paddingBottom: '10px'
          }}>
            Existing Item Groups ({filteredGroups.length})
          </h3>

          {groups.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '0.95rem',
                color: '#2c3e50'
              }}>
                Search Item Groups
              </label>
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by group name..."
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
          )}

          {filteredGroups.length === 0 ? (
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
              {groups.length === 0 ? (
                <>
                  <FaBox style={{ fontSize: '4rem', marginBottom: '20px', color: '#3498db' }} />
                  No item groups added yet.
                </>
              ) : (
                <p style={{ margin: 0 }}>No item groups found matching "{searchTerm}".</p>
              )}
            </div>
          ) : (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e9ecef',
              overflow: 'hidden',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <ul style={{
                listStyle: 'none',
                padding: '0',
                margin: '0',
                maxHeight: '100%'
              }}>
                {filteredGroups.map((group, index) => (
                  <li
                    key={group._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '15px 20px',
                      backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff',
                      borderBottom: index === filteredGroups.length - 1 ? 'none' : '1px solid #e9ecef',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minHeight: '50px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
                    }}
                  >
                    <span style={{
                      color: '#2c3e50',
                      fontWeight: '500',
                      flex: 1
                    }}>
                      {group.group_name}
                    </span>
                    <button
                      onClick={() => openDeleteModal(group._id)}
                      disabled={loading}
                      style={{
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 4px rgba(231, 76, 60, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '40px'
                      }}
                      onMouseOver={(e) => {
                        if (!loading) {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 4px 8px rgba(231, 76, 60, 0.4)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!loading) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 4px rgba(231, 76, 60, 0.3)';
                        }
                      }}
                    >
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal - Styled like EmployeeList */}
      {showDeleteModal && (
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
          onClick={closeDeleteModal}
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
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              margin: '0 auto'
            }}>
              <FaTrash style={{ fontSize: '1.5rem' }} />
              Confirm Delete
            </h3>
            <p style={{
              color: '#2c3e50',
              marginBottom: '25px',
              fontSize: '1.1rem',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete this item group? This action cannot be undone.
            </p>
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => handleDelete(groupToDelete)}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
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
                onClick={closeDeleteModal}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)',
                  transition: 'all 0.3s ease',
                  minWidth: '120px'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 12px rgba(52, 152, 219, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.3)';
                  }
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
}

export default AddItemGroupPage;