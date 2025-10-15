import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

// Utility function to normalize MongoDB Extended JSON
const normalizeMongoDBData = (value) => {
  if (value && typeof value === 'object' && '$numberLong' in value) {
    return String(value.$numberLong); // Convert $numberLong to string
  }
  return value || 'N/A'; // Return value or fallback to 'N/A'
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px 20px',
          borderRadius: '8px',
          maxWidth: '600px',
          margin: '20px auto',
          textAlign: 'center'
        }}>
          <p>Something went wrong: {this.state.error?.message}</p>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const CustomerListPage = () => {
  const [customerList, setCustomerList] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [customerGroups, setCustomerGroups] = useState([]);
  const [showEditGroupDropdown, setShowEditGroupDropdown] = useState(false);
  const navigate = useNavigate();

  // Fetch all customers from the backend
  const handleViewCustomers = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/customers");
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }
      const data = await response.json();
      // Ensure data is an array and normalize phone numbers
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format: Expected an array");
      }
      const normalizedData = data.map(customer => ({
        ...customer,
        phone_number: normalizeMongoDBData(customer.phone_number),
        whatsapp_number: normalizeMongoDBData(customer.whatsapp_number)
      }));
      setCustomerList(normalizedData);
      setFilteredCustomers(normalizedData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer groups
  const fetchCustomerGroups = async () => {
    try {
      const response = await fetch('/api/customer-groups');
      if (!response.ok) {
        throw new Error("Failed to fetch customer groups");
      }
      const data = await response.json();
      setCustomerGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching customer groups:', error);
      setCustomerGroups([]);
    }
  };

  useEffect(() => {
    handleViewCustomers();
    fetchCustomerGroups();
  }, []);

  // Search functionality
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.trim() === "") {
      setFilteredCustomers(customerList);
    } else {
      const filtered = customerList.filter((customer) =>
        String(customer.phone_number).toLowerCase().includes(term.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  };

  const goToAdminPage = () => navigate("/admin");

  // Delete customer
  const handleDeleteCustomer = (customerId) => {
    if (!customerId || customerId === "undefined") {
      setWarningMessage("Invalid customer ID. Please try again.");
      return;
    }
    setCustomerToDelete(customerId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/customers/${customerToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete customer");
      }
      setCustomerList((prev) => prev.filter((customer) => customer._id !== customerToDelete));
      setFilteredCustomers((prev) => prev.filter((customer) => customer._id !== customerToDelete));
      setWarningMessage("Customer deleted successfully!");
    } catch (error) {
      setWarningMessage(`Error: ${error.message}`);
    } finally {
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
    }
  };

  // Edit customer
  const handleEditCustomer = (customer) => {
    setSelectedCustomer({
      ...customer,
      phone_number: normalizeMongoDBData(customer.phone_number),
      whatsapp_number: normalizeMongoDBData(customer.whatsapp_number)
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveCustomer = async () => {
    if (!selectedCustomer?._id) {
      setWarningMessage("Invalid customer ID. Cannot save changes.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/customers/${selectedCustomer._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedCustomer),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update customer");
      }
      const updatedCustomer = await response.json();
      // Normalize updated customer data
      const normalizedCustomer = {
        ...updatedCustomer,
        phone_number: normalizeMongoDBData(updatedCustomer.phone_number),
        whatsapp_number: normalizeMongoDBData(updatedCustomer.whatsapp_number)
      };
      setCustomerList((prev) =>
        prev.map((customer) =>
          customer._id === selectedCustomer._id ? normalizedCustomer : customer
        )
      );
      setFilteredCustomers((prev) =>
        prev.map((customer) =>
          customer._id === selectedCustomer._id ? normalizedCustomer : customer
        )
      );
      setShowModal(false);
      setWarningMessage("Customer updated successfully!");
    } catch (error) {
      setWarningMessage(`Error: ${error.message}`);
    }
  };

  return (
    <ErrorBoundary>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e3e7eb 0%, #b8c6db 100%)',
        padding: '40px 20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          padding: '30px'
        }}>
          <button
            onClick={goToAdminPage}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#f8f9fa',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              color: '#333',
              transition: 'background-color 0.3s ease',
              marginBottom: '20px'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
          >
            <FaArrowLeft /> Back to Admin
          </button>

          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1a3c34',
            borderBottom: '3px solid #1a73e8',
            paddingBottom: '12px',
            marginBottom: '25px',
            width: 'fit-content'
          }}>
            Customer Management
          </h2>

          {warningMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fff3cd',
              color: '#856404',
              padding: '15px 20px',
              borderRadius: '8px',
              marginBottom: '20px',
              maxWidth: '600px',
              margin: '0 auto',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <span>{warningMessage}</span>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#856404'
                }}
                onClick={() => setWarningMessage("")}
              >
                &times;
              </button>
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '25px'
          }}>
            <input
              type="text"
              placeholder="Search by phone number..."
              value={searchTerm}
              onChange={handleSearch}
              style={{
                padding: '12px 20px',
                borderRadius: '25px',
                border: '1px solid #ced4da',
                fontSize: '16px',
                width: '300px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#1a73e8';
                e.currentTarget.style.boxShadow = '0 0 8px rgba(26, 115, 232, 0.3)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#ced4da';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
              }}
            />
          </div>

          {loading && (
            <div style={{
              textAlign: 'center',
              color: '#6c757d',
              fontSize: '18px',
              padding: '20px'
            }}>
              <p>Loading customers...</p>
            </div>
          )}
          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '15px 20px',
              borderRadius: '8px',
              marginBottom: '20px',
              maxWidth: '600px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <span>{error}</span>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#721c24'
                }}
                onClick={() => setError("")}
              >
                &times;
              </button>
            </div>
          )}
          {!loading && !error && filteredCustomers.length === 0 && (
            <div style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#6c757d',
              fontSize: '18px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              No customers found
            </div>
          )}

          {!loading && !error && filteredCustomers.length > 0 && (
            <div style={{
              overflowX: 'auto',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                backgroundColor: '#ffffff'
              }}>
                <thead style={{
                  backgroundColor: '#1a73e8',
                  color: '#ffffff',
                  fontWeight: '600'
                }}>
                  <tr>
                    {[
                      'ID',
                      'Name',
                      'Phone',
                      'Building',
                      'Flat/Villa',
                      'Location',
                      'WhatsApp',
                      'Email',
                      'Group',
                      'Actions'
                    ].map((header, index) => (
                      <th key={index} style={{
                        padding: '15px',
                        fontSize: '16px',
                        textAlign: 'left',
                        borderBottom: '2px solid #e9ecef',
                        ...(index === 0 && { borderTopLeftRadius: '8px' }),
                        ...(index === 9 && { borderTopRightRadius: '8px' })
                      }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer, index) => (
                    <tr key={customer._id} style={{
                      backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e8f0fe'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff'}
                    >
                      <td style={{ padding: '15px', fontSize: '15px', color: '#333' }}>{customer._id}</td>
                      <td style={{ padding: '15px', fontSize: '15px', color: '#333' }}>{normalizeMongoDBData(customer.customer_name)}</td>
                      <td style={{ padding: '15px', fontSize: '15px', color: '#333' }}>{normalizeMongoDBData(customer.phone_number)}</td>
                      <td style={{ padding: '15px', fontSize: '15px', color: '#333' }}>{normalizeMongoDBData(customer.building_name)}</td>
                      <td style={{ padding: '15px', fontSize: '15px', color: '#333' }}>{normalizeMongoDBData(customer.flat_villa_no)}</td>
                      <td style={{ padding: '15px', fontSize: '15px', color: '#333' }}>{normalizeMongoDBData(customer.location)}</td>
                      <td style={{ padding: '15px', fontSize: '15px', color: '#333' }}>{normalizeMongoDBData(customer.whatsapp_number)}</td>
                      <td style={{ padding: '15px', fontSize: '15px', color: '#333' }}>{normalizeMongoDBData(customer.email)}</td>
                      <td style={{ padding: '15px', fontSize: '15px', color: '#333' }}>
                        {customer.customer_group
                          ? customerGroups.find(g => g._id === customer.customer_group)?.group_name || 'N/A'
                          : 'N/A'}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#28a745',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '20px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            marginRight: '10px',
                            transition: 'background-color 0.3s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer._id)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc3545',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '20px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showModal && selectedCustomer && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid #e9ecef',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h5 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1a3c34',
                    margin: 0
                  }}>
                    Edit Customer
                  </h5>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#6c757d'
                    }}
                  >
                    &times;
                  </button>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1a3c34',
                      marginBottom: '8px'
                    }}>
                      Customer Group
                    </label>
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid #ced4da',
                          backgroundColor: '#fff',
                          textAlign: 'left',
                          fontSize: '15px',
                          cursor: 'pointer',
                          transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                        }}
                        onClick={() => setShowEditGroupDropdown(!showEditGroupDropdown)}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#1a73e8';
                          e.currentTarget.style.boxShadow = '0 0 8px rgba(26, 115, 232, 0.3)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#ced4da';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {selectedCustomer.customer_group
                          ? customerGroups.find(g => g._id === selectedCustomer.customer_group)?.group_name || 'Select Group'
                          : 'Select Group'}
                        <span style={{ float: 'right' }}>▼</span>
                      </button>
                      {showEditGroupDropdown && (
                        <ul style={{
                          position: 'absolute',
                          zIndex: 1000,
                          backgroundColor: '#ffffff',
                          listStyle: 'none',
                          padding: 0,
                          margin: 0,
                          border: '1px solid #ced4da',
                          borderRadius: '8px',
                          width: '100%',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                        }}>
                          <li
                            style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #e9ecef' }}
                            onClick={() => {
                              setSelectedCustomer(prev => ({ ...prev, customer_group: '' }));
                              setShowEditGroupDropdown(false);
                            }}
                          >
                            All
                          </li>
                          <li
                            style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #e9ecef' }}
                            onClick={() => {
                              setSelectedCustomer(prev => ({ ...prev, customer_group: '' }));
                              setShowEditGroupDropdown(false);
                            }}
                          >
                            None
                          </li>
                          {customerGroups.map((group) => (
                            <li
                              key={group._id}
                              style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #e9ecef' }}
                              onClick={() => {
                                setSelectedCustomer(prev => ({ ...prev, customer_group: group._id }));
                                setShowEditGroupDropdown(false);
                              }}
                            >
                              {group.group_name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  {[
                    { label: "Name", name: "customer_name" },
                    { label: "Phone", name: "phone_number" },
                    { label: "Building", name: "building_name" },
                    { label: "Flat/Villa No", name: "flat_villa_no" },
                    { label: "Location", name: "location" },
                    { label: "WhatsApp", name: "whatsapp_number" },
                    { label: "Email", name: "email", type: "email" },
                  ].map((field) => (
                    <div key={field.name} style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '15px',
                        fontWeight: '500',
                        color: '#1a3c34',
                        marginBottom: '8px'
                      }}>
                        {field.label}
                      </label>
                      <input
                        type={field.type || "text"}
                        name={field.name}
                        value={selectedCustomer[field.name] || ""}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid #ced4da',
                          fontSize: '15px',
                          transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#1a73e8';
                          e.currentTarget.style.boxShadow = '0 0 8px rgba(26, 115, 232, 0.3)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#ced4da';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{
                  padding: '20px',
                  borderTop: '1px solid #e9ecef',
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={handleSaveCustomer}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '15px',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#6c757d',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '15px',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5c636a'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {showDeleteConfirm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                padding: '20px',
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: '16px',
                  color: '#1a3c34',
                  marginBottom: '20px'
                }}>
                  Are you sure you want to delete this customer?
                </p>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={confirmDelete}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#dc3545',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '15px',
                      cursor: 'pointer',
                      flex: 1,
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#6c757d',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '15px',
                      cursor: 'pointer',
                      flex: 1,
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5c636a'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
                  >
                    No, Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CustomerListPage;