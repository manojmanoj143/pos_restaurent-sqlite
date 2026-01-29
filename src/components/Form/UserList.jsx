import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUserTie, FaPlus, FaTimes, FaSearch } from 'react-icons/fa';

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    phone_number: '',
    roleProfile: 'Bearer',
    password: '',
  });
  const [warningMessage, setWarningMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [filterValue, setFilterValue] = useState('');

  // Filter options
  const filterOptions = [
    { label: 'Full Name', key: 'fullName' },
    { label: 'Status', key: 'status' },
    { label: 'User Type', key: 'userType' },
    { label: 'Phone Number', key: 'phoneNumber' },
    { label: 'ID', key: 'id' },
  ];

  // Memoized filtered users
  const filteredUsers = useMemo(() => {
    if (!selectedFilter || !filterValue.trim()) return users;
    const fieldKey = filterOptions.find(opt => opt.label === selectedFilter)?.key || '';
    if (!fieldKey) return users;
    return users.filter(user => {
      const value = user[fieldKey] || '';
      return value.toLowerCase().includes(filterValue.toLowerCase());
    });
  }, [users, selectedFilter, filterValue, filterOptions]);

  // Fetch config to determine baseUrl
  const fetchConfig = async () => {
    let currentBaseUrl = '';
    try {
      const response = await fetch('http://localhost:8000/api/network_info', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed to fetch config: ${response.statusText}`);
      const data = await response.json();
      const { config: appConfig } = data;
      if (appConfig.mode === 'client') {
        currentBaseUrl = `http://${appConfig.server_ip}:8000`;
      }
      setBaseUrl(currentBaseUrl);
    } catch (error) {
      console.error('Failed to fetch config:', error);
      setBaseUrl('');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const apiUrl = `${baseUrl}/api/users`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);
      const data = await response.json();
      setUsers(
        data.map((user) => ({
          fullName: user.firstName || 'Unknown',
          status: user.status || 'Active',
          userType: user.role || 'Bearer',
          phoneNumber: user.phone_number || 'N/A',
          id: user.email,
          isTest: user.is_test || false,
        }))
      );
    } catch (error) {
      console.error('Error fetching users:', error);
      setWarningMessage(`Failed to fetch users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Fetch users when baseUrl is set
  useEffect(() => {
    if (baseUrl !== undefined) {
      fetchUsers();
      const interval = setInterval(fetchUsers, 30000);
      return () => clearInterval(interval);
    }
  }, [baseUrl]);

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.firstName || !newUser.phone_number || !newUser.password) {
      setWarningMessage('Please fill in all required fields.');
      return;
    }
    const newUserData = {
      email: newUser.email,
      firstName: newUser.firstName,
      phone_number: newUser.phone_number,
      role: newUser.roleProfile.toLowerCase(),
      password: newUser.password,
      status: 'Active',
      company: 'POS 8',
      pos_profile: 'POS-001',
    };
    try {
      setLoading(true);
      const apiUrl = `${baseUrl}/api/register`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add user');
      }
      await fetchUsers();
      setNewUser({ email: '', firstName: '', phone_number: '', roleProfile: 'Bearer', password: '' });
      setShowAddUserForm(false);
      setWarningMessage('User added successfully! You can now login with these credentials.');
    } catch (error) {
      console.error('Error adding user:', error);
      setWarningMessage(`Failed to add user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (email) => {
    setUserToDelete(email);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      const apiUrl = `${baseUrl}/api/users/${userToDelete}`;
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      await fetchUsers();
      setWarningMessage('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      setWarningMessage(`Failed to delete user: ${error.message}`);
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      setLoading(false);
    }
  };

  const roleProfileOptions = ['Bearer', 'Admin'];

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
          <FaUserTie style={{ fontSize: '48px', marginBottom: '20px', color: '#3498db' }} />
          <p>Loading users...</p>
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
      {/* Fixed Back Button in Top-Left Corner - Matching EmployeeList */}
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

      {/* Main Container - Matching EmployeeList Card Style */}
      <div style={{
        maxWidth: '1250px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header with Title and Add New Button - Matching EmployeeList */}
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
            <FaUserTie style={{ color: '#3498db', fontSize: '2rem' }} />
            User List ({filteredUsers.length})
          </h2>
          <button
            onClick={() => setShowAddUserForm(true)}
            style={{
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
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
              boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)',
              transition: 'all 0.3s ease'
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
            <FaPlus /> Add User
          </button>
        </div>

        {/* Warning Message - Styled like EmployeeList Alerts */}
        {warningMessage && (
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
            gap: '10px',
            position: 'relative'
          }}>
            <FaSearch style={{ fontSize: '1.2rem', color: '#27ae60' }} />
            {warningMessage}
            <button
              onClick={() => setWarningMessage('')}
              style={{
                position: 'absolute',
                top: '5px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: '#27ae60',
                cursor: 'pointer'
              }}
              disabled={loading}
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* User List Layout - Sidebar and Main Content with Inline Styles Matching EmployeeList */}
        <div style={{
          display: 'flex',
          gap: '20px',
          minHeight: '600px'
        }}>
          {/* Sidebar - Filters (Updated with Field Selection Buttons and Input) */}
          <div style={{
            width: '250px',
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontWeight: '600' }}>Filters</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50', fontSize: '0.95rem' }}>Filter By</label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '5px',
                marginBottom: '10px'
              }}>
                {filterOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setSelectedFilter(option.label)}
                    disabled={loading}
                    style={{
                      padding: '6px 12px',
                      background: selectedFilter === option.label ? '#3498db' : '#ecf0f1',
                      color: selectedFilter === option.label ? '#ffffff' : '#2c3e50',
                      border: `1px solid ${selectedFilter === option.label ? '#2980b9' : '#bdc3c7'}`,
                      borderRadius: '15px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: selectedFilter === option.label ? '600' : '500',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseOver={(e) => {
                      if (selectedFilter !== option.label) {
                        e.target.style.backgroundColor = '#d6eaf8';
                        e.target.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedFilter !== option.label) {
                        e.target.style.backgroundColor = '#ecf0f1';
                        e.target.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {selectedFilter && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.9rem' }}>
                    Enter {selectedFilter}:
                  </label>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <input
                      type="text"
                      placeholder={`Search for ${selectedFilter.toLowerCase()}`}
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #3498db',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        outline: 'none',
                        background: '#ffffff',
                        transition: 'border-color 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                      onBlur={(e) => e.target.style.borderColor = '#3498db'}
                    />
                    <button
                      onClick={() => {
                        setSelectedFilter('');
                        setFilterValue('');
                      }}
                      disabled={loading}
                      style={{
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
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
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - User List Table and Form */}
          <div style={{ flex: 1 }}>
            {/* User List Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: '#2c3e50', fontWeight: '600' }}>User List</h3>
              {/* Add User button already in main header, so no duplicate */}
            </div>

            {/* Users Table - Styled like EmployeeList Table */}
            <div style={{
              overflowX: 'auto',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              marginBottom: '20px'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '800px'
              }}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                    color: '#ffffff'
                  }}>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>Full Name</th>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>Status</th>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>User Type</th>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>Phone Number</th>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      minWidth: '200px',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>ID</th>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>Test User</th>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <tr
                        key={index}
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
                          color: '#2c3e50'
                        }}>{user.fullName}</td>
                        <td style={{
                          padding: '15px 12px',
                          borderRight: '1px solid #e9ecef',
                          color: '#27ae60',
                          fontWeight: '500'
                        }}>{user.status}</td>
                        <td style={{
                          padding: '15px 12px',
                          borderRight: '1px solid #e9ecef',
                          whiteSpace: 'nowrap',
                          color: '#3498db',
                          fontWeight: '500'
                        }}>{user.userType}</td>
                        <td style={{
                          padding: '15px 12px',
                          borderRight: '1px solid #e9ecef',
                          whiteSpace: 'nowrap',
                          color: '#2c3e50'
                        }}>{user.phoneNumber}</td>
                        <td style={{
                          padding: '15px 12px',
                          borderRight: '1px solid #e9ecef',
                          color: '#2c3e50'
                        }}>{user.id}</td>
                        <td style={{
                          padding: '15px 12px',
                          borderRight: '1px solid #e9ecef',
                          whiteSpace: 'nowrap',
                          color: '#e67e22',
                          fontWeight: '500'
                        }}>{user.isTest ? 'Yes' : 'No'}</td>
                        <td style={{ padding: '15px 12px' }}>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
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
                            onMouseOver={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 8px rgba(231, 76, 60, 0.4)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 4px rgba(231, 76, 60, 0.3)';
                            }}
                            disabled={loading || user.isTest}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: '#7f8c8d',
                        fontSize: '1.1rem'
                      }}>
                        {filterValue.trim() ? `No users found matching "${filterValue}" in ${selectedFilter}.` : 'No users found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div style={{
              textAlign: 'center',
              color: '#7f8c8d',
              fontSize: '0.9rem',
              padding: '10px',
              background: '#f8f9fa',
              borderRadius: '0 0 10px 10px'
            }}>
              Showing {filteredUsers.length} of {users.length} users
            </div>

            {/* Add User Form Modal - Styled like EmployeeList Modal */}
            {showAddUserForm && (
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
                onClick={(e) => { if (e.target === e.currentTarget) setShowAddUserForm(false); }}
              >
                <div style={{
                  backgroundColor: '#ffffff',
                  padding: '30px',
                  borderRadius: '15px',
                  width: '90%',
                  maxWidth: '500px',
                  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
                  textAlign: 'center',
                  border: '1px solid #e9ecef',
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}>
                  <h3 style={{
                    color: '#2c3e50',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    margin: '0 auto'
                  }}>
                    <FaPlus style={{ color: '#3498db', fontSize: '1.5rem' }} />
                    Add New User
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        textAlign: 'left'
                      }}>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={newUser.email}
                        onChange={handleNewUserChange}
                        placeholder="e.g., test@example.com"
                        required
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #3498db',
                          borderRadius: '10px',
                          fontSize: '1rem',
                          outline: 'none',
                          background: '#f8f9fa',
                          transition: 'border-color 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                        onBlur={(e) => e.target.style.borderColor = '#3498db'}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        textAlign: 'left'
                      }}>First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={newUser.firstName}
                        onChange={handleNewUserChange}
                        placeholder="e.g., Test"
                        required
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #3498db',
                          borderRadius: '10px',
                          fontSize: '1rem',
                          outline: 'none',
                          background: '#f8f9fa',
                          transition: 'border-color 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                        onBlur={(e) => e.target.style.borderColor = '#3498db'}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        textAlign: 'left'
                      }}>Phone Number</label>
                      <input
                        type="text"
                        name="phone_number"
                        value={newUser.phone_number}
                        onChange={handleNewUserChange}
                        placeholder="e.g., 1234567890"
                        required
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #3498db',
                          borderRadius: '10px',
                          fontSize: '1rem',
                          outline: 'none',
                          background: '#f8f9fa',
                          transition: 'border-color 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                        onBlur={(e) => e.target.style.borderColor = '#3498db'}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        textAlign: 'left'
                      }}>Role Profile</label>
                      <select
                        name="roleProfile"
                        value={newUser.roleProfile}
                        onChange={handleNewUserChange}
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #3498db',
                          borderRadius: '10px',
                          fontSize: '1rem',
                          outline: 'none',
                          background: '#f8f9fa',
                          color: '#2c3e50',
                          transition: 'border-color 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                        onBlur={(e) => e.target.style.borderColor = '#3498db'}
                      >
                        {roleProfileOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        textAlign: 'left'
                      }}>Password</label>
                      <input
                        type="password"
                        name="password"
                        value={newUser.password}
                        onChange={handleNewUserChange}
                        placeholder="Enter password"
                        required
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #3498db',
                          borderRadius: '10px',
                          fontSize: '1rem',
                          outline: 'none',
                          background: '#f8f9fa',
                          transition: 'border-color 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                        onBlur={(e) => e.target.style.borderColor = '#3498db'}
                      />
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '15px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={handleAddUser}
                      disabled={loading}
                      style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        boxShadow: '0 4px 8px rgba(39, 174, 96, 0.3)',
                        transition: 'all 0.3s ease',
                        minWidth: '140px'
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
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setShowAddUserForm(false)}
                      disabled={loading}
                      style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        boxShadow: '0 4px 8px rgba(149, 165, 166, 0.3)',
                        transition: 'all 0.3s ease',
                        minWidth: '140px'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 12px rgba(149, 165, 166, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 8px rgba(149, 165, 166, 0.3)';
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal - Styled like EmployeeList */}
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
          onClick={() => setShowDeleteConfirm(false)}
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
              Confirm Delete
            </h3>
            <p style={{
              color: '#2c3e50',
              marginBottom: '25px',
              fontSize: '1.1rem',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete user <strong>{userToDelete}</strong>? This action cannot be undone.
            </p>
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
                onClick={() => setShowDeleteConfirm(false)}
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
};

export default UserList;