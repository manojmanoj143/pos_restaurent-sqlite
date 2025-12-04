import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';
import { FaArrowLeft } from 'react-icons/fa';

const CreateCustomerGroup = () => {
  const [groupName, setGroupName] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState("warning");
  const [customerGroups, setCustomerGroups] = useState([]);
  const [baseUrl, setBaseUrl] = useState("");
  const [editingGroupId, setEditingGroupId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
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
        // Pass the determined baseUrl to fetch functions
        fetchCustomerGroups(currentBaseUrl);
      }
    };
    fetchConfig();
  }, []);

  const fetchCustomerGroups = async (currentBaseUrl) => {
    try {
      const res = await axios.get(`${currentBaseUrl}/api/customer-groups`);
      setCustomerGroups(res.data);
    } catch (error) {
      console.error('Error fetching customer groups:', error);
    }
  };

  const handleCreateOrUpdateGroup = async () => {
    if (!groupName.trim()) {
      setWarningMessage("Group name is required.");
      setWarningType("warning");
      return;
    }
    try {
      const groupData = {
        group_name: groupName.trim(),
      };
      let url = `${baseUrl}/api/customer-groups`;
      let method = 'POST';
      if (editingGroupId) {
        url = `${baseUrl}/api/customer-groups/${editingGroupId}`;
        method = 'PUT';
      }
      const response = await axios({
        method,
        url,
        data: groupData,
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.status === 200 || response.status === 201) {
        const responseData = response.data;
        setWarningMessage(editingGroupId ? 'Customer group updated successfully!' : 'Customer group created successfully!');
        setWarningType("success");
        setGroupName("");
        setEditingGroupId(null);
        fetchCustomerGroups(baseUrl);
        // NEW: Pass back the formState if coming from create customer
        if (location.state?.fromCreateCustomer) {
          navigate('/create-customer', {
            state: {
              newGroupId: responseData._id || editingGroupId,
              formState: location.state.formState
            }
          });
        }
      } else {
        const errorData = response.data;
        setWarningMessage(errorData.error || (editingGroupId ? 'Failed to update customer group' : 'Failed to create customer group'));
        setWarningType("warning");
      }
    } catch (error) {
      console.error('Error:', error);
      setWarningMessage(editingGroupId ? 'Error while updating customer group' : 'Error while creating customer group');
      setWarningType("warning");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      const response = await axios.delete(`${baseUrl}/api/customer-groups/${groupId}`);
      if (response.status === 200) {
        setWarningMessage('Customer group deleted successfully!');
        setWarningType("success");
        fetchCustomerGroups(baseUrl);
      } else {
        const errorData = response.data;
        setWarningMessage(errorData.error || 'Failed to delete customer group');
        setWarningType("warning");
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      setWarningMessage('Error while deleting customer group');
      setWarningType("warning");
    }
  };

  const handleEditGroup = (group) => {
    setGroupName(group.group_name);
    setEditingGroupId(group._id);
  };

  const handleWarningOk = () => {
    setWarningMessage("");
    setWarningType("warning");
  };

  const handleBackToAdmin = () => {
    navigate('/admin');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Fixed Back Button in Top-Left Corner - Styled like EmployeeList */}
      <button
        onClick={handleBackToAdmin}
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
        <FaArrowLeft /> Back to Admin
      </button>

      {/* Main Container - Like EmployeeList Card */}
      <div style={{
        maxWidth: '900px',
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
          <h1 style={{
            textAlign: 'center',
            color: '#2c3e50',
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: '600'
          }}>
            Create a New Customer Group
          </h1>
        </div>

        {/* Warning Message - Styled like EmployeeList Alerts */}
        {warningMessage && (
          <div style={{
            background: warningType === 'success' ? 'linear-gradient(135deg, #d4edda 0%, #c8e6c9 100%)' : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            color: warningType === 'success' ? '#155724' : '#c0392b',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            border: `1px solid ${warningType === 'success' ? '#28a745' : '#e74c3c'}`,
            boxShadow: `0 2px 4px rgba(${warningType === 'success' ? '40, 167, 69' : '231, 76, 60'}, 0.2)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            {warningMessage}
            <button
              onClick={handleWarningOk}
              style={{
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(52, 152, 219, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 2px 4px rgba(52, 152, 219, 0.3)';
              }}
            >
              OK
            </button>
          </div>
        )}

        {/* Form Section - Styled like EmployeeList Form */}
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '15px',
          marginBottom: '30px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e9ecef'
        }}>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateOrUpdateGroup(); }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '1rem',
                color: '#2c3e50'
              }}>Enter Group Name:</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '1px solid #3498db',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  outline: 'none',
                  background: '#ffffff',
                  transition: 'border-color 0.3s ease',
                  boxShadow: '0 2px 4px rgba(52, 152, 219, 0.1)'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                onBlur={(e) => e.target.style.borderColor = '#3498db'}
              />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 30px',
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
              >
                {editingGroupId ? 'Update Group' : 'Save Group'}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Groups Section - Styled like EmployeeList Table/List */}
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '15px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{
            textAlign: 'center',
            color: '#2c3e50',
            margin: '0 0 20px 0',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            Existing Customer Groups
          </h2>
          {customerGroups.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#7f8c8d',
              fontSize: '1.1rem',
              padding: '40px',
              background: '#ffffff',
              borderRadius: '10px',
              border: '2px dashed #bdc3c7'
            }}>
              No customer groups found.
            </div>
          ) : (
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {customerGroups.map((group) => (
                <div
                  key={group._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#ffffff',
                    padding: '15px 20px',
                    marginBottom: '10px',
                    borderRadius: '10px',
                    border: '1px solid #e9ecef',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.05)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{
                    color: '#2c3e50',
                    fontWeight: '500',
                    fontSize: '1rem'
                  }}>
                    {group.group_name}
                  </span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleEditGroup(group)}
                      style={{
                        padding: '8px 15px',
                        background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
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
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group._id)}
                      style={{
                        padding: '8px 15px',
                        background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
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
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateCustomerGroup;