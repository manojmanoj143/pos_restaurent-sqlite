import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { FaArrowLeft } from "react-icons/fa";
// Utility function to parse MongoDB Extended JSON (only for numbers, no 'N/A')
const parseMongoValue = (value) => {
  if (value && typeof value === 'object' && '$numberLong' in value) {
    return String(value.$numberLong);
  }
  return value;
};
// Display helper: returns value or 'N/A'
const displayValue = (value) => {
  return value ? String(value).trim() : 'N/A';
};
// Default address structure
const defaultStructure = {
  countries: {},
};
// SearchableSelect Component (copied from CreateCustomerPage for consistency)
const SearchableSelect = ({ options = [], value = '', onChange, placeholder }) => {
  const [search, setSearch] = useState(value || '');
  const [showList, setShowList] = useState(false);
  useEffect(() => {
    setSearch(value || '');
  }, [value]);
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(search.toLowerCase())
  );
  const handleInputChange = (e) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    if (!showList) {
      setShowList(true);
    }
  };
  const handleSelectOption = (option) => {
    setSearch(option);
    if (onChange) {
      onChange(option);
    }
    setShowList(false);
  };
  const handleFocus = () => {
    setShowList(true);
  };
  const handleBlur = () => {
    setTimeout(() => {
      setShowList(false);
    }, 200);
  };
  return (
    <div className="searchable-select">
      <input
        type="text"
        value={search}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
      />
      {showList && (
        <ul className="searchable-list">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={index}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectOption(option);
                }}
              >
                {option}
              </li>
            ))
          ) : (
            <li className="no-options">No matching options</li>
          )}
        </ul>
      )}
    </div>
  );
};
// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
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
  const [addressStructure, setAddressStructure] = useState(defaultStructure);
  const [linkedValues, setLinkedValues] = useState({});
  const [showEditGroupDropdown, setShowEditGroupDropdown] = useState(false);
  const [showISDCodeDropdown, setShowISDCodeDropdown] = useState(false);
  const [showWhatsappISDCodeDropdown, setShowWhatsappISDCodeDropdown] = useState(false);
  const [selectedISDCode, setSelectedISDCode] = useState("+971");
  const [selectedWhatsappISDCode, setSelectedWhatsappISDCode] = useState("+971");
  const [baseUrl, setBaseUrl] = useState(""); // NEW: Added baseUrl state like in AdminPage
  // Filter states for dynamic fields
  const [filterCountry, setFilterCountry] = useState("");
  const [filterField1, setFilterField1] = useState("");
  const [filterField2, setFilterField2] = useState("");
  const [filterField3, setFilterField3] = useState("");
  const navigate = useNavigate();
  const isdCodes = [
    { code: "+91", country: "India" },
    { code: "+1", country: "USA" },
    { code: "+44", country: "UK" },
    { code: "+971", country: "UAE" },
    { code: "+61", country: "Australia" },
  ];
  // Dynamic field labels based on address structure and filterCountry
  const field1Label = useMemo(() => {
    if (filterCountry && addressStructure.countries[filterCountry]?.field1) {
      return addressStructure.countries[filterCountry].field1.label;
    }
    const firstCountryWithField1 = Object.values(addressStructure.countries).find(c => c.field1);
    return firstCountryWithField1?.field1?.label || 'Emirate/State';
  }, [addressStructure, filterCountry]);
  const field2Label = useMemo(() => {
    if (filterCountry && addressStructure.countries[filterCountry]?.field2) {
      return addressStructure.countries[filterCountry].field2.label;
    }
    const firstCountryWithField2 = Object.values(addressStructure.countries).find(c => c.field2);
    return firstCountryWithField2?.field2?.label || 'City/District';
  }, [addressStructure, filterCountry]);
  const field3Label = useMemo(() => {
    if (filterCountry && addressStructure.countries[filterCountry]?.field3) {
      return addressStructure.countries[filterCountry].field3.label;
    }
    const firstCountryWithField3 = Object.values(addressStructure.countries).find(c => c.field3);
    return firstCountryWithField3?.field3?.label || 'Area/Village';
  }, [addressStructure, filterCountry]);
  // Whether to show field columns based on structure (dynamic per filterCountry)
  const hasField1 = useMemo(() => {
    if (filterCountry) {
      return !!addressStructure.countries[filterCountry]?.field1;
    }
    return Object.values(addressStructure.countries).some(c => c.field1);
  }, [addressStructure, filterCountry]);
  const hasField2 = useMemo(() => {
    if (filterCountry) {
      return !!addressStructure.countries[filterCountry]?.field2;
    }
    return Object.values(addressStructure.countries).some(c => c.field2);
  }, [addressStructure, filterCountry]);
  const hasField3 = useMemo(() => {
    if (filterCountry) {
      return !!addressStructure.countries[filterCountry]?.field3;
    }
    return Object.values(addressStructure.countries).some(c => c.field3);
  }, [addressStructure, filterCountry]);
  // Fetch config to determine baseUrl (like in AdminPage)
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
      if (currentBaseUrl || baseUrl === "") {
        handleViewCustomers(currentBaseUrl || baseUrl);
        fetchCustomerGroups(currentBaseUrl || baseUrl);
        fetchAddressStructure(currentBaseUrl || baseUrl);
      }
    }
  };
  // Fetch all customers from the backend (updated to use axios and baseUrl)
  const handleViewCustomers = async (currentBaseUrl = baseUrl) => {
    try {
      setLoading(true);
      const response = await axios.get(`${currentBaseUrl}/api/customers`);
      const data = response.data;
      // Ensure data is an array and parse any MongoDB extended JSON
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format: Expected an array");
      }
      const parsedData = data.map(customer =>
        ({
          ...customer,
          phone_number: parseMongoValue(customer.phone_number),
          whatsapp_number: parseMongoValue(customer.whatsapp_number),
          email: parseMongoValue(customer.email),
          customer_name: parseMongoValue(customer.customer_name),
          building_name: parseMongoValue(customer.building_name),
          flat_villa_no: parseMongoValue(customer.flat_villa_no),
          country: parseMongoValue(customer.country),
          field1: parseMongoValue(customer.field1),
          field2: parseMongoValue(customer.field2),
          field3: parseMongoValue(customer.field3),
        })
      );
      setCustomerList(parsedData);
      setFilteredCustomers(parsedData);
      setError(null);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError(error.response?.data?.error || error.message || `Failed to fetch customers: ${error.status || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  // Fetch customer groups (updated to use axios and baseUrl)
  const fetchCustomerGroups = async (currentBaseUrl = baseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/customer-groups`);
      const data = response.data;
      setCustomerGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching customer groups:', error);
      setCustomerGroups([]);
    }
  };
  // Fetch address structure (updated to use axios and baseUrl)
  const fetchAddressStructure = async (currentBaseUrl = baseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/address-structures`);
      const data = response.data;
      setAddressStructure(data.structure || defaultStructure);
      setLinkedValues(data.linkedValues || {});
    } catch (error) {
      console.error('Error fetching address structure:', error);
    }
  };
  useEffect(() => {
    fetchConfig();
  }, []);
  // Compute unique values for filters (dynamic based on filterCountry)
  const uniqueCountries = useMemo(() =>
    [...new Set(customerList.map(c => c.country).filter(Boolean))].sort(),
    [customerList]
  );
  const uniqueField1 = useMemo(() => {
    let fields = customerList.map(c => c.field1).filter(Boolean);
    if (filterCountry) {
      fields = customerList
        .filter(c => c.country === filterCountry)
        .map(c => c.field1)
        .filter(Boolean);
    }
    return [...new Set(fields)].sort();
  }, [customerList, filterCountry]);
  const uniqueField2 = useMemo(() => {
    let fields = customerList.map(c => c.field2).filter(Boolean);
    if (filterCountry) {
      fields = customerList
        .filter(c => c.country === filterCountry)
        .map(c => c.field2)
        .filter(Boolean);
    }
    return [...new Set(fields)].sort();
  }, [customerList, filterCountry]);
  const uniqueField3 = useMemo(() => {
    let fields = customerList.map(c => c.field3).filter(Boolean);
    if (filterCountry) {
      fields = customerList
        .filter(c => c.country === filterCountry)
        .map(c => c.field3)
        .filter(Boolean);
    }
    return [...new Set(fields)].sort();
  }, [customerList, filterCountry]);
  // Enhanced filtering including search and dynamic field filters
  useEffect(() => {
    let filtered = customerList;
    // Search filter
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((customer) =>
        String(customer.phone_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(customer.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Country filter
    if (filterCountry) {
      filtered = filtered.filter((customer) => customer.country === filterCountry);
    }
    // Field1 filter
    if (filterField1) {
      filtered = filtered.filter((customer) => customer.field1 === filterField1);
    }
    // Field2 filter
    if (filterField2) {
      filtered = filtered.filter((customer) => customer.field2 === filterField2);
    }
    // Field3 filter
    if (filterField3) {
      filtered = filtered.filter((customer) => customer.field3 === filterField3);
    }
    setFilteredCustomers(filtered);
  }, [searchTerm, filterCountry, filterField1, filterField2, filterField3, customerList]);
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  const goToAdminPage = () => navigate("/admin");
  // Delete customer (updated to use axios and baseUrl)
  const handleDeleteCustomer = (customerId) => {
    if (!customerId || customerId === "undefined") {
      setWarningMessage("Invalid customer ID. Please try again.");
      return;
    }
    setCustomerToDelete(customerId);
    setShowDeleteConfirm(true);
  };
  const confirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      await axios.delete(`${baseUrl}/api/customers/${customerToDelete}`);
      setCustomerList((prev) => prev.filter((customer) => customer._id !== customerToDelete));
      setFilteredCustomers((prev) => prev.filter((customer) => customer._id !== customerToDelete));
      setWarningMessage("Customer deleted successfully!");
    } catch (error) {
      console.error('Delete error:', error);
      setWarningMessage(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
    }
  };
  // Edit customer
  const handleEditCustomer = (customer) => {
    const parsedCustomer = {
      ...customer,
      phone_number: parseMongoValue(customer.phone_number),
      whatsapp_number: parseMongoValue(customer.whatsapp_number),
      email: parseMongoValue(customer.email),
      customer_name: parseMongoValue(customer.customer_name),
      building_name: parseMongoValue(customer.building_name),
      flat_villa_no: parseMongoValue(customer.flat_villa_no),
      country: parseMongoValue(customer.country),
      field1: parseMongoValue(customer.field1),
      field2: parseMongoValue(customer.field2),
      field3: parseMongoValue(customer.field3),
    };
    // Extract ISD code for phone and whatsapp if needed (assuming full number, default to +971)
    const phoneMatch = parsedCustomer.phone_number ? parsedCustomer.phone_number.match(/^\+(\d{2,3})(\d+)$/) : null;
    if (phoneMatch) {
      setSelectedISDCode(`+${phoneMatch[1]}`);
      parsedCustomer.phone_number = phoneMatch[2]; // Set local number
    }
    const whatsappMatch = parsedCustomer.whatsapp_number ? parsedCustomer.whatsapp_number.match(/^\+(\d{2,3})(\d+)$/) : null;
    if (whatsappMatch) {
      setSelectedWhatsappISDCode(`+${whatsappMatch[1]}`);
      parsedCustomer.whatsapp_number = whatsappMatch[2]; // Set local number
    }
    setSelectedCustomer(parsedCustomer);
    setShowModal(true);
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedCustomer((prev) => ({ ...prev, [name]: value }));
  };
  const handleGroupSelect = (groupId) => {
    setSelectedCustomer(prev => ({ ...prev, customer_group: groupId }));
    setShowEditGroupDropdown(false);
  };
  const handleISDCodeSelect = (code) => {
    setSelectedISDCode(code);
    setShowISDCodeDropdown(false);
  };
  const handleWhatsappISDCodeSelect = (code) => {
    setSelectedWhatsappISDCode(code);
    setShowWhatsappISDCodeDropdown(false);
  };
  const handleDeliveryAddressChange = (field, value) => {
    setSelectedCustomer((prev) => ({ ...prev, [field]: value }));
    // If changing country or field1, clear dependent fields
    if (field === 'country') {
      setSelectedCustomer((prev) => ({ ...prev, field1: '', field2: '', field3: '' }));
    }
    if (field === 'field1') {
      setSelectedCustomer((prev) => ({ ...prev, field2: '', field3: '' }));
    }
  };
  // Helper to get filtered values
  const getFilteredValues = (field) => {
    if (!selectedCustomer.country || !selectedCustomer.field1) return [];
    const links = linkedValues[selectedCustomer.country]?.[selectedCustomer.field1];
    return links?.[field] || [];
  };
  const countryList = Object.keys(addressStructure.countries || {});
  // Save customer (updated to use axios and baseUrl)
  const handleSaveCustomer = async () => {
    if (!selectedCustomer?._id) {
      setWarningMessage("Invalid customer ID. Cannot save changes.");
      return;
    }
    // Reconstruct full phone and whatsapp
    const fullPhone = `${selectedISDCode}${selectedCustomer.phone_number}`;
    const fullWhatsapp = selectedCustomer.whatsapp_number ? `${selectedWhatsappISDCode}${selectedCustomer.whatsapp_number}` : '';
    const payload = {
      ...selectedCustomer,
      phone_number: fullPhone,
      whatsapp_number: fullWhatsapp,
    };
    try {
      const response = await axios.put(`${baseUrl}/api/customers/${selectedCustomer._id}`, payload);
      const updatedCustomer = response.data;
      // Parse updated customer data (no 'N/A' injection)
      const parsedCustomer = {
        ...updatedCustomer,
        phone_number: parseMongoValue(updatedCustomer.phone_number),
        whatsapp_number: parseMongoValue(updatedCustomer.whatsapp_number),
        email: parseMongoValue(updatedCustomer.email),
        customer_name: parseMongoValue(updatedCustomer.customer_name),
        building_name: parseMongoValue(updatedCustomer.building_name),
        flat_villa_no: parseMongoValue(updatedCustomer.flat_villa_no),
        country: parseMongoValue(updatedCustomer.country),
        field1: parseMongoValue(updatedCustomer.field1),
        field2: parseMongoValue(updatedCustomer.field2),
        field3: parseMongoValue(updatedCustomer.field3),
      };
      setCustomerList((prev) =>
        prev.map((customer) =>
          customer._id === selectedCustomer._id ? parsedCustomer : customer
        )
      );
      setFilteredCustomers((prev) =>
        prev.map((customer) =>
          customer._id === selectedCustomer._id ? parsedCustomer : customer
        )
      );
      setShowModal(false);
      setWarningMessage("Customer updated successfully!");
    } catch (error) {
      console.error('Update error:', error);
      setWarningMessage(`Error: ${error.response?.data?.error || error.message}`);
    }
  };
  // Clear warning after 5 seconds
  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => setWarningMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);
  // Filter clear handlers
  const clearFilter = (setter) => setter("");
  // Calculate total field columns for radius adjustment
  const totalFieldColumns = (hasField1 ? 1 : 0) + (hasField2 ? 1 : 0) + (hasField3 ? 1 : 0);
  const lastHeaderIndex = 4 + totalFieldColumns + 2; // Country (4), fields, WhatsApp+Email (2), before Actions
  return (
    <ErrorBoundary>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e3e7eb 0%, #b8c6db 100%)',
        padding: '40px 20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>
        <div style={{
          maxWidth: '1600px', // Increased from 1400px for wider table
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
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '15px 20px',
              borderRadius: '8px',
              marginBottom: '20px',
              maxWidth: '600px',
              margin: '0 auto',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid #c3e6cb'
            }}>
              <span>{warningMessage}</span>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#155724'
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
              placeholder="Search by phone number or name..."
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
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid #f5c6cb'
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
              padding: '40px 20px',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#6c757d',
              fontSize: '18px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <p>No customers found</p>
              <button
                onClick={() => handleViewCustomers(baseUrl)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1a73e8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Refresh
              </button>
            </div>
          )}
          {!loading && !error && filteredCustomers.length > 0 && (
            <div style={{
              maxHeight: '70vh', // Added for vertical scroll
              overflowY: 'auto', // Vertical scroll on right
              overflowX: 'hidden',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              width: '100%'
            }}>
              <table style={{
                width: '100%',
                tableLayout: 'fixed', // Fixed layout to fit columns
                borderCollapse: 'separate',
                borderSpacing: 0,
                backgroundColor: '#ffffff'
              }}>
                <thead style={{
                  background: 'linear-gradient(135deg, rgb(161, 196, 253) 0%, rgb(194, 233, 251) 100%)',
                  color: '#333333',
                  fontWeight: '600'
                }}>
                  <tr>
                    {[
                      { label: 'Name', key: 'name', width: '10%' }, // Adjusted widths
                      { label: 'Phone Number', key: 'phone', width: '12%' },
                      { label: 'Flat No', key: 'flatNo', width: '6%' }, // Reduced
                      { label: 'Building Name', key: 'buildingName', width: '10%' }, // Adjusted
                      {
                        label: 'Country',
                        key: 'country',
                        width: '8%', // Adjusted
                        filter: (
                          <select
                            value={filterCountry}
                            onChange={(e) => setFilterCountry(e.target.value)}
                            style={{
                              padding: '2px 4px',
                              borderRadius: '3px',
                              border: '1px solid #a1c4fd',
                              background: '#ffffff',
                              color: '#333',
                              fontSize: '11px',
                              minWidth: '80px'
                            }}
                          >
                            <option value="">All</option>
                            {uniqueCountries.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        )
                      },
                      ...(hasField1 ? [{
                        label: field1Label,
                        key: 'field1',
                        width: '8%', // Adjusted for better fit
                        filter: (
                          <select
                            value={filterField1}
                            onChange={(e) => setFilterField1(e.target.value)}
                            style={{
                              padding: '2px 4px',
                              borderRadius: '3px',
                              border: '1px solid #a1c4fd',
                              background: '#ffffff',
                              color: '#333',
                              fontSize: '11px',
                              minWidth: '80px'
                            }}
                          >
                            <option value="">All</option>
                            {uniqueField1.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        )
                      }] : []),
                      ...(hasField2 ? [{
                        label: field2Label,
                        key: 'field2',
                        width: '8%', // Adjusted
                        filter: (
                          <select
                            value={filterField2}
                            onChange={(e) => setFilterField2(e.target.value)}
                            style={{
                              padding: '2px 4px',
                              borderRadius: '3px',
                              border: '1px solid #a1c4fd',
                              background: '#ffffff',
                              color: '#333',
                              fontSize: '11px',
                              minWidth: '80px'
                            }}
                          >
                            <option value="">All</option>
                            {uniqueField2.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        )
                      }] : []),
                      ...(hasField3 ? [{
                        label: field3Label,
                        key: 'field3',
                        width: '8%', // Adjusted
                        filter: (
                          <select
                            value={filterField3}
                            onChange={(e) => setFilterField3(e.target.value)}
                            style={{
                              padding: '2px 4px',
                              borderRadius: '3px',
                              border: '1px solid #a1c4fd',
                              background: '#ffffff',
                              color: '#333',
                              fontSize: '11px',
                              minWidth: '80px'
                            }}
                          >
                            <option value="">All</option>
                            {uniqueField3.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        )
                      }] : []),
                      { label: 'WhatsApp Number', key: 'whatsapp', width: '12%' },
                      { label: 'Email', key: 'email', width: '10%' },
                      { label: 'Actions', key: 'actions', width: '8%' } // Increased from 4%
                    ].map((header, index) => {
                      let isLastHeader = false;
                      if (header.key === 'actions') {
                        isLastHeader = true;
                      } else if (header.key === 'country') {
                        isLastHeader = totalFieldColumns === 0;
                      } else if (['field1', 'field2', 'field3'].includes(header.key)) {
                        // Logic to check if this is the last field header
                        const fieldOrder = ['field1', 'field2', 'field3'];
                        const currentFieldIndex = fieldOrder.indexOf(header.key);
                        const activeFields = [hasField1, hasField2, hasField3].filter(Boolean);
                        if (filterCountry) {
                          // When filtered, check structure order
                          const countryFields = [addressStructure.countries[filterCountry]?.field1, addressStructure.countries[filterCountry]?.field2, addressStructure.countries[filterCountry]?.field3].filter(Boolean);
                          isLastHeader = currentFieldIndex === countryFields.length - 1;
                        } else {
                          isLastHeader = currentFieldIndex === activeFields.length - 1;
                        }
                      }
                      return (
                        <th
                          key={header.key}
                          style={{
                            padding: '10px 6px', // Slightly increased padding for better visibility
                            fontSize: '14px', // Slightly larger font for headers
                            textAlign: 'left',
                            borderBottom: '2px solid #e9ecef',
                            position: 'sticky', // Sticky header
                            top: 0,
                            zIndex: 10,
                            background: 'linear-gradient(135deg, rgb(161, 196, 253) 0%, rgb(194, 233, 251) 100%)', // Ensure background for sticky
                            width: header.width,
                            color: '#333333',
                            ...(index === 0 && { borderTopLeftRadius: '8px' }),
                            // Adjust last column radius dynamically based on fields
                            ...(isLastHeader && { borderTopRightRadius: '8px' })
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '500' }}>{header.label}</span>
                            {header.filter && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {header.filter}
                                <button
                                  onClick={() => {
                                    if (header.key === 'country') setFilterCountry('');
                                    if (header.key === 'field1') setFilterField1('');
                                    if (header.key === 'field2') setFilterField2('');
                                    if (header.key === 'field3') setFilterField3('');
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '12px',
                                    color: '#333',
                                    cursor: 'pointer',
                                    padding: '1px',
                                    lineHeight: '1'
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer, index) => {
                    // Dynamic td based on fields
                    const cells = [
                      <td key="name" style={{ padding: '10px 6px', fontSize: '13px', color: '#333' }}>{displayValue(customer.customer_name)}</td>,
                      <td key="phone" style={{ padding: '10px 6px', fontSize: '13px', color: '#333' }}>{displayValue(customer.phone_number)}</td>,
                      <td key="flatNo" style={{ padding: '10px 6px', fontSize: '13px', color: '#333' }}>{displayValue(customer.flat_villa_no)}</td>,
                      <td key="buildingName" style={{ padding: '10px 6px', fontSize: '13px', color: '#333' }}>{displayValue(customer.building_name)}</td>,
                      <td key="country" style={{ padding: '10px 6px', fontSize: '13px', color: '#333' }}>{displayValue(customer.country)}</td>
                    ];
                    if (hasField1) cells.push(<td key="field1" style={{ padding: '10px 6px', fontSize: '13px', color: '#333' }}>{displayValue(customer.field1)}</td>);
                    if (hasField2) cells.push(<td key="field2" style={{ padding: '10px 6px', fontSize: '13px', color: '#333' }}>{displayValue(customer.field2)}</td>);
                    if (hasField3) cells.push(<td key="field3" style={{ padding: '10px 6px', fontSize: '13px', color: '#333' }}>{displayValue(customer.field3)}</td>);
                    cells.push(
                      <td key="whatsapp" style={{ padding: '10px 6px', fontSize: '13px', color: '#333' }}>{displayValue(customer.whatsapp_number)}</td>,
                      <td key="email" style={{ padding: '10px 6px', fontSize: '13px', color: '#333' }}>{displayValue(customer.email)}</td>,
                      <td key="actions" style={{ padding: '10px 6px' }}>
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          style={{
                            padding: '6px 10px', // Slightly larger for better visibility
                            backgroundColor: '#28a745',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            marginRight: '5px',
                            transition: 'background-color 0.3s ease',
                            whiteSpace: 'nowrap' // Ensure no wrap
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer._id)}
                          style={{
                            padding: '6px 10px', // Slightly larger for better visibility
                            backgroundColor: '#dc3545',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease',
                            whiteSpace: 'nowrap' // Ensure no wrap
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                        >
                          Delete
                        </button>
                      </td>
                    );
                    return (
                      <tr key={customer._id} style={{
                        backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e8f0fe'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff'}
                      >
                        {cells}
                      </tr>
                    );
                  })}
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
                maxWidth: '600px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
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
                            onClick={() => handleGroupSelect('')}
                          >
                            None
                          </li>
                          {customerGroups.map((group) => (
                            <li
                              key={group._id}
                              style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #e9ecef' }}
                              onClick={() => handleGroupSelect(group._id)}
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
                          e.currentTarget.style.borderColor = '#1a73e8ff';
                          e.currentTarget.style.boxShadow = '0 0 8px rgba(26, 115, 232, 0.3)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#ced4da';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  ))}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1a3c34',
                      marginBottom: '8px'
                    }}>
                      Phone Number
                    </label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <div style={{ position: 'relative', flex: '0 0 80px' }}>
                        <button
                          type="button"
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #ced4da',
                            backgroundColor: '#fff',
                            fontSize: '15px',
                            cursor: 'pointer',
                            width: '100%'
                          }}
                          onClick={() => setShowISDCodeDropdown(!showISDCodeDropdown)}
                        >
                          {selectedISDCode}
                        </button>
                        {showISDCodeDropdown && (
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
                            {isdCodes.map((isd) => (
                              <li
                                key={isd.code}
                                style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #e9ecef' }}
                                onClick={() => handleISDCodeSelect(isd.code)}
                              >
                                {isd.code} ({isd.country})
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <input
                        type="text"
                        name="phone_number"
                        value={selectedCustomer.phone_number || ""}
                        onChange={handleInputChange}
                        placeholder="10-digit number"
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid #ced4da',
                          fontSize: '15px'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1a3c34',
                      marginBottom: '8px'
                    }}>
                      WhatsApp Number
                    </label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <div style={{ position: 'relative', flex: '0 0 80px' }}>
                        <button
                          type="button"
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #ced4da',
                            backgroundColor: '#fff',
                            fontSize: '15px',
                            cursor: 'pointer',
                            width: '100%'
                          }}
                          onClick={() => setShowWhatsappISDCodeDropdown(!showWhatsappISDCodeDropdown)}
                        >
                          {selectedWhatsappISDCode}
                        </button>
                        {showWhatsappISDCodeDropdown && (
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
                            {isdCodes.map((isd) => (
                              <li
                                key={isd.code}
                                style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #e9ecef' }}
                                onClick={() => handleWhatsappISDCodeSelect(isd.code)}
                              >
                                {isd.code} ({isd.country})
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <input
                        type="text"
                        name="whatsapp_number"
                        value={selectedCustomer.whatsapp_number || ""}
                        onChange={handleInputChange}
                        placeholder="10-digit number"
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid #ced4da',
                          fontSize: '15px'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1a3c34',
                      marginBottom: '8px'
                    }}>
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={selectedCustomer.email || ""}
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
                  <h6 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3c34', marginBottom: '10px' }}>Address</h6>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1a3c34',
                      marginBottom: '8px'
                    }}>
                      Country
                    </label>
                    <SearchableSelect
                      options={countryList}
                      value={selectedCustomer.country || ''}
                      onChange={(value) => {
                        handleDeliveryAddressChange("country", value);
                      }}
                      placeholder="Select Country"
                    />
                  </div>
                  {/* FIELD 1 */}
                  {selectedCustomer.country && addressStructure.countries[selectedCustomer.country]?.field1 && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '15px',
                        fontWeight: '500',
                        color: '#1a3c34',
                        marginBottom: '8px'
                      }}>
                        {addressStructure.countries[selectedCustomer.country].field1.label}
                      </label>
                      <SearchableSelect
                        options={addressStructure.countries[selectedCustomer.country].field1.values || []}
                        value={selectedCustomer.field1 || ''}
                        onChange={(value) => {
                          handleDeliveryAddressChange("field1", value);
                        }}
                        placeholder={`Select ${addressStructure.countries[selectedCustomer.country].field1.label}`}
                      />
                    </div>
                  )}
                  {/* FIELD 2 (filtered by selected Field1) */}
                  {selectedCustomer.country && addressStructure.countries[selectedCustomer.country]?.field2 && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '15px',
                        fontWeight: '500',
                        color: '#1a3c34',
                        marginBottom: '8px'
                      }}>
                        {addressStructure.countries[selectedCustomer.country].field2.label}
                      </label>
                      <SearchableSelect
                        options={getFilteredValues("field2").length > 0
                          ? getFilteredValues("field2")
                          : (addressStructure.countries[selectedCustomer.country].field2.values || [])}
                        value={selectedCustomer.field2 || ''}
                        onChange={(value) => handleDeliveryAddressChange("field2", value)}
                        placeholder={`Select ${addressStructure.countries[selectedCustomer.country].field2.label}`}
                      />
                    </div>
                  )}
                  {/* FIELD 3 (shown always if defined) */}
                  {selectedCustomer.country && addressStructure.countries[selectedCustomer.country]?.field3 && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '15px',
                        fontWeight: '500',
                        color: '#1a3c34',
                        marginBottom: '8px'
                      }}>
                        {addressStructure.countries[selectedCustomer.country].field3.label}
                      </label>
                      <SearchableSelect
                        options={getFilteredValues("field3").length > 0
                          ? getFilteredValues("field3")
                          : (addressStructure.countries[selectedCustomer.country].field3.values || [])}
                        value={selectedCustomer.field3 || ''}
                        onChange={(value) => handleDeliveryAddressChange("field3", value)}
                        placeholder={`Select ${addressStructure.countries[selectedCustomer.country].field3.label}`}
                      />
                    </div>
                  )}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1a3c34',
                      marginBottom: '8px'
                    }}>
                      Building Name
                    </label>
                    <input
                      type="text"
                      name="building_name"
                      value={selectedCustomer.building_name || ""}
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
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#1a3c34',
                      marginBottom: '8px'
                    }}>
                      Flat / Villa No
                    </label>
                    <input
                      type="text"
                      name="flat_villa_no"
                      value={selectedCustomer.flat_villa_no || ""}
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
                  Are you sure you want to delete this customer? This action cannot be undone.
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
        {/* Inline Styles for SearchableSelect (adapted from CreateCustomerPage) */}
        <style>{`
          /* Searchable Select */
          .searchable-select {
            position: relative;
            width: 100%;
          }
          .searchable-select input {
            width: 100%;
            height: 42px;
            padding: 0 12px;
            border: 1.5px solid #ced4da;
            border-radius: 8px;
            font-size: 15px;
            transition: all 0.3s ease;
            box-sizing: border-box;
          }
          .searchable-select input:focus {
            outline: none;
            border-color: #1a73e8;
            box-shadow: 0 0 8px rgba(26, 115, 232, 0.3);
          }
          .searchable-list {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #fff;
            border: 1.5px solid #ced4da;
            border-top: none;
            border-radius: 0 0 8px 8px;
            max-height: 200px;
            overflow-y: auto;
            list-style: none;
            margin: 0;
            padding: 0;
            z-index: 100;
            box-shadow: 0 4px 12px rgba(0,0,0,.15);
          }
          .searchable-list li {
            padding: 8px 12px;
            cursor: pointer;
            font-size: 15px;
            border-bottom: 1px solid #f0f0f0;
          }
          .searchable-list li:hover {
            background: #f8f9fa;
          }
          .searchable-list .no-options {
            color: #6c757d;
            font-style: italic;
            cursor: default;
            padding: 12px;
            text-align: center;
          }
          /* Responsive adjustments for small screens */
          @media (max-width: 768px) {
            table { font-size: 11px; }
            th, td { padding: 6px 4px !important; } /* Adjusted padding */
            .header-filter select { min-width: 60px !important; font-size: 10px !important; }
            .actions button {
              padding: 4px 6px !important;
              font-size: 11px !important;
              margin-right: 2px !important;
              display: inline-block !important; /* Ensure inline display */
            }
            .searchable-select input { font-size: 14px; height: 38px; }
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
};
export default CustomerListPage;