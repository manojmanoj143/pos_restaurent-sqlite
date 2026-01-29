import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUtensils, FaSave, FaPlus, FaTrash, FaTimes, FaClock, FaSearch } from 'react-icons/fa';

function AddKitchenPage() {
  const navigate = useNavigate();
  const [kitchenName, setKitchenName] = useState('');
  const [kitchens, setKitchens] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // NEW: Added searchTerm state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [kitchenToDelete, setKitchenToDelete] = useState(null);
  const [baseUrl, setBaseUrl] = useState(""); // NEW: Added baseUrl state like in AdminPage

  // NEW: Fetch config to determine baseUrl (similar to AdminPage)
  const fetchConfig = async () => {
    let currentBaseUrl = "";
    try {
      const response = await axios.get("http://localhost:8000/api/network_info");
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
      // Pass the determined baseUrl to fetchKitchens
      fetchKitchens(currentBaseUrl);
    }
  };

  // UPDATED: Fetch existing kitchens with baseUrl parameter
  const fetchKitchens = async (currentBaseUrl = "") => {
    try {
      setLoading(true);
      const response = await axios.get(`${currentBaseUrl}/api/kitchens`);
      setKitchens(response.data);
    } catch (err) {
      setError(`Failed to fetch kitchens: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: useEffect to fetch config and kitchens
  useEffect(() => {
    fetchConfig();
  }, []);

  // NEW: Memoized filtered kitchens based on search term
  const filteredKitchens = useMemo(() =>
    kitchens.filter(kitchen =>
      kitchen.kitchen_name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [kitchens, searchTerm]
  );

  // UPDATED: Handle form submission to save kitchen with baseUrl
  const handleSaveKitchen = async (e) => {
    e.preventDefault();
    if (!kitchenName.trim()) {
      setError('Kitchen name is required');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setMessage('');
      const response = await axios.post(`${baseUrl}/api/kitchens`, { kitchen_name: kitchenName });
      setMessage(response.data.message);
      setKitchenName(''); // Clear input
      fetchKitchens(baseUrl); // Refresh kitchen list with baseUrl
    } catch (err) {
      setError(`Failed to save kitchen: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Handle kitchen deletion with baseUrl
  const handleDeleteKitchen = async (kitchenId) => {
    try {
      setLoading(true);
      setError(null);
      setMessage('');
      const response = await axios.delete(`${baseUrl}/api/kitchens/${kitchenId}`);
      setMessage(response.data.message);
      fetchKitchens(baseUrl); // Refresh kitchen list with baseUrl
    } catch (err) {
      setError(`Failed to delete kitchen: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setKitchenToDelete(null);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (kitchenId) => {
    setKitchenToDelete(kitchenId);
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setKitchenToDelete(null);
  };

  // Navigation handler
  const handleGoBack = () => navigate('/admin');

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
          <FaUtensils style={{ fontSize: '48px', marginBottom: '20px', color: '#3498db' }} />
          <p>Loading kitchens...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      overflowY: 'auto',
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

      {/* Main Container - Like EmployeeList Card */}
      <div style={{
        maxWidth: '1250px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header with Title */}
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
            <FaUtensils style={{ color: '#3498db', fontSize: '2rem' }} />
            Add Kitchen ({filteredKitchens.length}) {/* UPDATED: Use filteredKitchens.length */}
          </h2>
          <div></div> {/* Empty right for balance */}
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
            <FaClock style={{ fontSize: '1.2rem', color: '#27ae60' }} />
            {message}
          </div>
        )}

        {/* Kitchen Form - Styled like EmployeeList Card */}
        <div style={{
          background: '#ffffff',
          padding: '20px',
          borderRadius: '15px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontWeight: '600', textAlign: 'center' }}>Add New Kitchen</h3>
          <form onSubmit={handleSaveKitchen}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <input
                type="text"
                value={kitchenName}
                onChange={(e) => setKitchenName(e.target.value)}
                placeholder="Enter Kitchen Name"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid #3498db',
                  fontSize: '1rem',
                  outline: 'none',
                  background: '#f8f9fa',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                onBlur={(e) => e.target.style.borderColor = '#3498db'}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)',
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
                <FaSave /> {loading ? 'Saving...' : 'Save Kitchen'}
              </button>
            </div>
          </form>
        </div>

        {/* UPDATED: Kitchen List Section with Search and Scrollable Table */}
        <div style={{
          background: '#ffffff',
          padding: '20px',
          borderRadius: '15px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{
            color: '#2c3e50',
            fontWeight: '600',
            marginBottom: '15px',
            textAlign: 'center',
            borderBottom: '1px solid #3498db',
            paddingBottom: '10px'
          }}>
            Kitchen Details ({filteredKitchens.length})
          </h3>
          {/* NEW: Search Input if kitchens exist */}
          {kitchens.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '0.95rem',
                color: '#2c3e50'
              }}>
                Search Kitchens
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Trigger filter on Enter (though onChange already filters real-time)
                      setSearchTerm(e.target.value.trim());
                    }
                  }}
                  placeholder="Search by kitchen name..."
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
          {filteredKitchens.length === 0 ? (
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
              {kitchens.length === 0 ? (
                <>
                  <FaUtensils style={{ fontSize: '4rem', marginBottom: '20px', color: '#3498db' }} />
                  No kitchens added yet.
                </>
              ) : (
                <p style={{ margin: 0 }}>No kitchens found matching "{searchTerm}".</p>
              )}
            </div>
          ) : (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e9ecef',
              overflow: 'hidden',
              maxHeight: '400px', // NEW: Added maxHeight for vertical scroll
              overflowY: 'auto' // NEW: Added overflowY for scrollbar
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '800px'
              }}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                    color: '#ffffff',
                    position: 'sticky', // NEW: Sticky header for scroll
                    top: 0,
                    zIndex: 10
                  }}>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>Kitchen Name</th>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>Added On</th>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKitchens.map((kitchen, index) => (
                    <tr
                      key={kitchen._id}
                      style={{
                        borderBottom: '1px solid #e9ecef',
                        transition: 'all 0.2s ease',
                        backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
                      }}
                    >
                      <td style={{
                        padding: '15px 12px',
                        borderRight: '1px solid #e9ecef',
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <FaUtensils style={{ color: '#3498db', fontSize: '1.2rem' }} />
                        {kitchen.kitchen_name}
                      </td>
                      <td style={{
                        padding: '15px 12px',
                        borderRight: '1px solid #e9ecef',
                        whiteSpace: 'nowrap',
                        color: '#2c3e50'
                      }}>
                        {new Date(kitchen.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '15px 12px', textAlign: 'center' }}>
                        <button
                          onClick={() => openDeleteModal(kitchen._id)}
                          disabled={loading}
                          style={{
                            padding: '6px 10px',
                            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '0.85rem',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 4px rgba(231, 76, 60, 0.3)'
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          onClick={(e) => { if (e.target === e.currentTarget) closeDeleteModal(); }}
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
            }}>Are you sure you want to delete this kitchen? This action cannot be undone.</p>
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => handleDeleteKitchen(kitchenToDelete)}
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

export default AddKitchenPage;