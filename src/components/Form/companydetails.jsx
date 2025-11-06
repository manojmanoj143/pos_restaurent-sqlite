// src/components/CompanyDetails.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaBuilding, FaPlus } from 'react-icons/fa';

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

function CompanyDetails() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    businessType: '',
    otherBusinessType: '',
    taxType: '',
    taxPercentage: '',
    taxNumber: '',
    fssaiNumber: '',
    panNumber: '',
    addresses: [{ country: '', field1: '', field2: '', field3: '', flat_villa_no: '', building_name: '' }],
    contacts: [{ phoneNumber: '', whatsappNumber: '', emailAddress: '', website: '' }],
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    currencyType: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [activeSection, setActiveSection] = useState('basic'); // Default to 'basic' to show form first
  const [savedDetails, setSavedDetails] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null); // State for logo URL
  const [addressStructure, setAddressStructure] = useState({ countries: {} });
  const [linkedValues, setLinkedValues] = useState({});
  const [baseUrl, setBaseUrl] = useState(""); // NEW: Added baseUrl state like in AdminPage
  const countryList = Object.keys(addressStructure.countries || {});

  // NEW: Fetch config to determine baseUrl
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
      if (currentBaseUrl) {
        fetchLogo(currentBaseUrl);
        fetchAddressStructure(currentBaseUrl);
        fetchCompanyDetails(currentBaseUrl);
      } else {
        // If not client mode, use empty baseUrl (local)
        fetchLogo("");
        fetchAddressStructure("");
        fetchCompanyDetails("");
      }
    }
  };

  // UPDATED: Fetch logo with baseUrl
  const fetchLogo = async (currentBaseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/logo`);
      if (response.data.logo) {
        // Prepend the baseUrl if it's not already included
        const logoPath = response.data.logo.startsWith('http') ? response.data.logo : currentBaseUrl + response.data.logo;
        setLogoUrl(logoPath);
      }
    } catch (err) {
      console.error("Failed to fetch logo:", err);
      // Don't set a main error, just log it
    }
  };

  // UPDATED: Fetch address structure with baseUrl
  const fetchAddressStructure = async (currentBaseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/address-structures`);
      if (response.data) {
        setAddressStructure(response.data.structure || { countries: {} });
        setLinkedValues(response.data.linkedValues || {});
      }
    } catch (error) {
      console.error('Error fetching address structure:', error);
    }
  };

  // UPDATED: Fetch company details with baseUrl
  const fetchCompanyDetails = async (currentBaseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/company-details`);
      if (response.data.companyDetails && response.data.companyDetails.length > 0) {
        const latestDetails = response.data.companyDetails[response.data.companyDetails.length - 1];
        setSavedDetails(latestDetails);
        setFormData(latestDetails); // Pre-fill form with the latest data
        console.log('Fetched details:', latestDetails); // Debug log
      } else {
        // setError('No company details found.'); // Don't show error, just means new entry
        console.log('No existing company details found. Ready for new entry.');
      }
    } catch (err) {
      setError('Failed to fetch company details: ' + err.message);
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchConfig(); // UPDATED: Call fetchConfig instead of individual fetches
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (index, e) => {
    const { name, value } = e.target;
    const newAddresses = [...formData.addresses];
    newAddresses[index][name] = value;
    setFormData((prev) => ({ ...prev, addresses: newAddresses }));
  };

  const handleContactChange = (index, e) => {
    const { name, value } = e.target;
    const newContacts = [...formData.contacts];
    newContacts[index][name] = value;
    setFormData((prev) => ({ ...prev, contacts: newContacts }));
  };

  const addAddress = () => {
    setFormData((prev) => ({
      ...prev,
      addresses: [...prev.addresses, { country: '', field1: '', field2: '', field3: '', flat_villa_no: '', building_name: '' }],
    }));
  };

  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [...prev.contacts, { phoneNumber: '', whatsappNumber: '', emailAddress: '', website: '' }],
    }));
  };

  // Helper to get filtered values for field2 and field3 based on field1
  const getFilteredValues = (addressIndex, field) => {
    const address = formData.addresses[addressIndex];
    if (!address.country || !address.field1) return [];
    const links = linkedValues[address.country]?.[address.field1];
    return links?.[field] || [];
  };

  const handleAddressFieldChange = (index, field, value) => {
    const newAddresses = [...formData.addresses];
    newAddresses[index][field] = value;
    // If changing country or field1, clear dependent fields (field2, field3)
    if (field === 'country' || field === 'field1') {
      newAddresses[index].field2 = '';
      newAddresses[index].field3 = '';
    }
    setFormData((prev) => ({ ...prev, addresses: newAddresses }));
  };

  // UPDATED: Handle submit with baseUrl
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setMessage('');
      console.log('Submitting form data:', formData); // Debug log
      const response = await axios.post(`${baseUrl}/api/company-details`, formData);
      setMessage('Company details saved successfully!');
      setSavedDetails(response.data.companyDetails); // Update with the saved data
      console.log('Saved details:', response.data.companyDetails); // Debug log
      // Refresh the displayed details with baseUrl
      fetchCompanyDetails(baseUrl);
      setActiveSection('details'); // Switch to details view after saving
    } catch (err) {
      setError('Failed to save company details: ' + err.message);
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTaxLabel = () => {
    return formData.taxType === 'GST' ? 'GST Number' : 'VAT Number';
  };

  // Format address for print/display: flat_villa_no, building_name, field3, field2, field1, country
  const formatAddressForPrint = (address) => {
    const parts = [];
    if (address.flat_villa_no) parts.push(address.flat_villa_no);
    if (address.building_name) parts.push(address.building_name);
    if (address.field3) parts.push(address.field3);
    if (address.field2) parts.push(address.field2);
    if (address.field1) parts.push(address.field1);
    if (address.country) parts.push(address.country);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  // UPDATED: Handle print with dynamic logoUrl
  const handlePrint = () => {
    if (!savedDetails) {
      setError('No saved details available to print.');
      return;
    }
    console.log('Printing details:', savedDetails); // Debug log
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Company Details Application</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
            .a4-sheet {
              width: 210mm;
              min-height: 297mm;
              padding: 20mm;
              margin: 10mm auto;
              background: #fff;
              box-shadow: 0 0 5px rgba(0,0,0,0.1);
              box-sizing: border-box;
            }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .header img { width: 100px; height: 100px; object-fit: contain; border-radius: 10px; }
            .header h1 { color: #2c3e50; font-size: 24px; margin: 0; text-align: right; font-weight: 600; }
            hr.divider { border: 0; border-top: 2px solid #3498db; margin: 20px 0; }
            h3 { text-align: center; color: #2c3e50; margin-top: 20px; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .section { margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; }
            .column { width: 48%; min-width: 250px; }
            .field { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .label { font-weight: bold; width: 40%; text-align: right; padding-right: 10px; color: #555; }
            .centered-label { font-weight: bold; width: 40%; text-align: center; padding-right: 10px; }
            .value { width: 60%; text-align: left; color: #000; }
            .owner-name { width: 60%; text-align: left; }
            .footer { text-align: center; font-weight: bold; color: #2c3e50; margin-top: 30px; font-size: 12px; }
            @media print {
              body { margin: 0; background-color: #fff; }
              .a4-sheet { margin: 0; box-shadow: none; border: none; width: 100%; min-height: 0; padding: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="a4-sheet">
            <!-- MODIFIED: Header with Logo (left) and Title (right) -->
            <div class="header">
              ${logoUrl ? `
                <div>
                  <img src="${logoUrl}" alt="Company Logo" />
                </div>
              ` : '<div></div>'}
              <h1>Company Details<br/>Application</h1>
            </div>
            <!-- MODIFIED: Border Line -->
            <hr class="divider" />
            <div class="section">
              <h3>Basic Information</h3>
              <div class="row">
                <div class="column">
                  <div class="field"><span class="label">Restaurant Name:</span><span class="value">${savedDetails.restaurantName || 'N/A'}</span></div>
                  <div class="field"><span class="label">Business Type:</span><span class="value">${savedDetails.businessType || 'N/A'}${savedDetails.businessType === 'Other' ? ` (${savedDetails.otherBusinessType || 'N/A'})` : ''}</span></div>
                  <div class="field"><span class="label">Tax Type:</span><span class="value">${savedDetails.taxType || 'N/A'}</span></div>
                  <div class="field"><span class="label">Tax Percentage:</span><span class="value">${savedDetails.taxPercentage || 'N/A'}%</span></div>
                  <div class="field"><span class="label">FSSAI Number:</span><span class="value">${savedDetails.fssaiNumber || 'N/A'}</span></div>
                </div>
                <div class="column">
                  <div class="field"><span class="label">Owner/Manager Name:</span><span class="owner-name">${savedDetails.ownerName || 'N/A'}</span></div>
                  <div class="field"><span class="label">${savedDetails.taxType === 'GST' ? 'GST' : 'VAT'} Number:</span><span class="value">${savedDetails.taxNumber || 'N/A'}</span></div>
                  <div class="field"><span class="label">PAN Number:</span><span class="value">${savedDetails.panNumber || 'N/A'}</span></div>
                </div>
              </div>
            </div>
            <div class="section">
              <h3>Address Details</h3>
              ${savedDetails.addresses && savedDetails.addresses.length > 0 ? savedDetails.addresses.map((address, index) => `
                <div class="row" style="margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;">
                  <div class="column">
                    <div class="field"><span class="centered-label">Address ${index + 1}:</span><span class="value"></span></div>
                    <div class="field"><span class="label">Full Address:</span><span class="value">${formatAddressForPrint(address)}</span></div>
                  </div>
                </div>
              `).join('') : '<div class="row"><div class="column"><div class="field"><span class="centered-label">No addresses available.</span><span class="value"></span></div></div></div>'}
            </div>
            <div class="section">
              <h3>Contact Details</h3>
              ${savedDetails.contacts && savedDetails.contacts.length > 0 ? savedDetails.contacts.map((contact, index) => `
                <div class="row" style="margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;">
                  <div class="column">
                    <div class="field"><span class="centered-label">Contact ${index + 1}:</span><span class="value"></span></div>
                    <div class="field"><span class="label">Phone Number:</span><span class="value">${contact.phoneNumber || 'N/A'}</span></div>
                    <div class="field"><span class="label">Email Address:</span><span class="value">${contact.emailAddress || 'N/A'}</span></div>
                  </div>
                  <div class="column">
                    <div class="field"><span class="label"></span><span class="value"></span></div>
                    <div class="field"><span class="label">WhatsApp Number:</span><span class="value">${contact.whatsappNumber || 'N/A'}</span></div>
                    <div class="field"><span class="label">Website:</span><span class="value">${contact.website || 'N/A'}</span></div>
                  </div>
                </div>
              `).join('') : '<div class="row"><div class="column"><div class="field"><span class="centered-label">No contacts available.</span><span class="value"></span></div></div></div>'}
            </div>
            <div class="section">
              <h3>Bank Details</h3>
              <div class="row">
                <div class="column">
                  <div class="field"><span class="label">Bank Name:</span><span class="value">${savedDetails.bankName || 'N/A'}</span></div>
                  <div class="field"><span class="label">Account Number:</span><span class="value">${savedDetails.accountNumber || 'N/A'}</span></div>
                  <div class="field"><span class="label">UPI ID:</span><span class="value">${savedDetails.upiId || 'N/A'}</span></div>
                </div>
                <div class="column">
                  <div class="field"><span class="label">Account Holder Name:</span><span class="value">${savedDetails.accountHolderName || 'N/A'}</span></div>
                  <div class="field"><span class="label">IFSC Code:</span><span class="value">${savedDetails.ifscCode || 'N/A'}</span></div>
                  <div class="field"><span class="label">Currency Type:</span><span class="value">${savedDetails.currencyType || 'N/A'}</span></div>
                </div>
              </div>
            </div>
            <hr class="divider" />
            <div class="footer">Company Name: ${savedDetails.restaurantName || 'N/A'}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f9', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '40px auto', backgroundColor: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <button
          onClick={() => navigate('/admin')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: '#fff',
            border: 'none',
            borderRadius: '15px',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#2980b9')}
          onMouseOut={(e) => (e.target.style.backgroundColor = '#3498db')}
        >
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h2 style={{ textAlign: 'center', color: '#2c3e50', fontSize: '2rem', fontWeight: '600', marginBottom: '30px' }}>
          <FaBuilding style={{ marginRight: '10px' }} /> Company Details
        </h2>
        {error && (
          <div
            style={{
              backgroundColor: '#ffebee',
              padding: '10px',
              marginBottom: '20px',
              color: '#c0392b',
              borderRadius: '15px',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}
        {message && (
          <div
            style={{
              backgroundColor: '#d4edda',
              padding: '10px',
              marginBottom: '20px',
              color: '#155724',
              borderRadius: '15px',
              textAlign: 'center',
            }}
          >
            {message}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: '#3498db', padding: '10px', borderRadius: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => toggleSection('details')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeSection === 'details' ? '#fff' : 'transparent',
              color: activeSection === 'details' ? '#3498db' : '#fff',
              border: '1px solid #fff',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Details
          </button>
          <button
            onClick={() => toggleSection('basic')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeSection === 'basic' ? '#fff' : 'transparent',
              color: activeSection === 'basic' ? '#3498db' : '#fff',
              border: '1px solid #fff',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Basic Information
          </button>
          <button
            onClick={() => toggleSection('address')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeSection === 'address' ? '#fff' : 'transparent',
              color: activeSection === 'address' ? '#3498db' : '#fff',
              border: '1px solid #fff',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Address Details
          </button>
          <button
            onClick={() => toggleSection('contact')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeSection === 'contact' ? '#fff' : 'transparent',
              color: activeSection === 'contact' ? '#3498db' : '#fff',
              border: '1px solid #fff',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Contact Details
          </button>
          <button
            onClick={() => toggleSection('payment')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeSection === 'payment' ? '#fff' : 'transparent',
              color: activeSection === 'payment' ? '#3498db' : '#fff',
              border: '1px solid #fff',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Bank Details
          </button>
        </div>
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* MODIFIED: Details section with A4-sheet styling */}
          {activeSection === 'details' && (
            <div>
              {/* A4 Sheet Styled Container */}
              <div style={{
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: '25px',
                margin: '20px 0',
                borderRadius: '5px'
              }}>
                {/* Header: Logo (left) + Title (right) */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  paddingBottom: '15px',
                }}>
                  {/* Logo */}
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Company Logo"
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'contain',
                        borderRadius: '10px',
                        border: '1px solid #ddd'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100px',
                      height: '100px',
                      border: '1px dashed #ccc',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#888',
                      fontSize: '12px',
                      padding: '10px',
                      textAlign: 'center'
                    }}>
                      No Logo Uploaded
                    </div>
                  )}
                
                  {/* Title */}
                  <h3 style={{ color: '#2c3e50', fontSize: '1.8rem', margin: 0, textAlign: 'right', fontWeight: '600' }}>
                    Company Details<br/>Application
                  </h3>
                </div>
                {/* Border Line */}
                <hr style={{ border: '0', borderTop: '2px solid #3498db', marginBottom: '25px' }} />
                {/* Saved Details Content */}
                {savedDetails ? (
                  <div style={{ display: 'grid', gap: '20px' }}>
                    {/* Basic Information */}
                    <div className="section">
                      <h4 style={{ color: '#2c3e50', fontSize: '1.3rem', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>Basic Information</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem' }}>
                        <div style={{ width: '48%', minWidth: '250px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>Restaurant Name:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.restaurantName || 'N/A'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>Business Type:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.businessType || 'N/A'}{savedDetails.businessType === 'Other' ? ` (${savedDetails.otherBusinessType || 'N/A'})` : ''}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>Tax Type:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.taxType || 'N/A'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>Tax Percentage:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.taxPercentage || 'N/A'}%</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>FSSAI Number:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.fssaiNumber || 'N/A'}</span></div>
                        </div>
                        <div style={{ width: '48%', minWidth: '250px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>Owner/Manager:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.ownerName || 'N/A'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>${savedDetails.taxType === 'GST' ? 'GST' : 'VAT'} Number:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.taxNumber || 'N/A'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>PAN Number:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.panNumber || 'N/A'}</span></div>
                        </div>
                      </div>
                    </div>
                    {/* Address Details - UPDATED: Use formatAddressForPrint */}
                    <div className="section">
                      <h4 style={{ color: '#2c3e50', fontSize: '1.3rem', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>Address Details</h4>
                      {savedDetails.addresses && savedDetails.addresses.length > 0 ? savedDetails.addresses.map((address, index) => (
                        <div key={index} style={{ marginBottom: '15px', borderBottom: '1px dashed #ccc', paddingBottom: '10px', fontSize: '0.95rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <strong style={{ width: '40%', textAlign: 'center', paddingRight: '10px', color: '#333' }}>Address {index + 1}:</strong>
                            <span style={{ width: '60%', textAlign: 'left' }}>{formatAddressForPrint(address)}</span>
                          </div>
                        </div>
                      )) : <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'center', paddingRight: '10px' }}>No addresses available.</strong> <span style={{ width: '60%', textAlign: 'left' }}></span></div>}
                    </div>
                    {/* Contact Details */}
                    <div className="section">
                      <h4 style={{ color: '#2c3e50', fontSize: '1.3rem', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>Contact Details</h4>
                      {savedDetails.contacts && savedDetails.contacts.length > 0 ? savedDetails.contacts.map((contact, index) => (
                        <div key={index} style={{ marginBottom: '15px', borderBottom: '1px dashed #ccc', paddingBottom: '10px', fontSize: '0.95rem' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div style={{ width: '48%', minWidth: '250px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'center', paddingRight: '10px', color: '#333' }}>Contact {index + 1}:</strong> <span style={{ width: '60%', textAlign: 'left' }}></span></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>Phone Number:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{contact.phoneNumber || 'N/A'}</span></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>Email Address:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{contact.emailAddress || 'N/A'}</span></div>
                            </div>
                            <div style={{ width: '48%', minWidth: '250px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}></strong> <span style={{ width: '60%', textAlign: 'left' }}></span></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>WhatsApp:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{contact.whatsappNumber || 'N/A'}</span></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>Website:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{contact.website || 'N/A'}</span></div>
                            </div>
                          </div>
                        </div>
                      )) : <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'center', paddingRight: '10px' }}>No contacts available.</strong> <span style={{ width: '60%', textAlign: 'left' }}></span></div>}
                    </div>
                    {/* Bank Details */}
                    <div className="section">
                      <h4 style={{ color: '#2c3e50', fontSize: '1.3rem', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>Bank Details</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem' }}>
                        <div style={{ width: '48%', minWidth: '250px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>Bank Name:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.bankName || 'N/A'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>Account No:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.accountNumber || 'N/A'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>UPI ID:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.upiId || 'N/A'}</span></div>
                        </div>
                        <div style={{ width: '48%', minWidth: '250px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>Account Holder:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.accountHolderName || 'N/A'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>IFSC Code:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.ifscCode || 'N/A'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px', color: '#555' }}>Currency Type:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.currencyType || 'N/A'}</span></div>
                        </div>
                      </div>
                    </div>
                    {/* This print button is inside the 'details' section */}
                    <button
                      onClick={handlePrint}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#3498db',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        marginTop: '10px',
                      }}
                      onMouseOver={(e) => (e.target.style.backgroundColor = '#2980b9')}
                      onMouseOut={(e) => (e.target.style.backgroundColor = '#3498db')}
                    >
                      Print Details
                    </button>
                  </div>
                ) : (
                  <p style={{textAlign: 'center', color: '#7f8c8d', fontSize: '1.1rem'}}>No saved details available. Please fill out the form sections.</p>
                )}
              </div>
            </div>
          )}
          {activeSection === 'basic' && (
            <div>
              <h3 style={{ color: '#2c3e50', fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>Basic Information</h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                <input
                  type="text"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  placeholder="Restaurant Name"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Owner / Manager Name"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                >
                  <option value="">Select Business Type</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Café">Café</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Bar">Bar</option>
                  <option value="Other">Other</option>
                </select>
                {formData.businessType === 'Other' && (
                  <input
                    type="text"
                    name="otherBusinessType"
                    value={formData.otherBusinessType}
                    onChange={handleChange}
                    placeholder="Enter other business type"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                )}
                <select
                  name="taxType"
                  value={formData.taxType}
                  onChange={handleChange}
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                >
                  <option value="">Select Tax Type</option>
                  <option value="GST">GST</option>
                  <option value="VAT">VAT</option>
                </select>
                <input
                  type="number"
                  name="taxPercentage"
                  value={formData.taxPercentage}
                  onChange={handleChange}
                  placeholder="Tax Percentage (e.g., 18)"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  name="taxNumber"
                  value={formData.taxNumber}
                  onChange={handleChange}
                  placeholder={getTaxLabel() + " (optional)"}
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  name="fssaiNumber"
                  value={formData.fssaiNumber}
                  onChange={handleChange}
                  placeholder="FSSAI Number (optional)"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  placeholder="PAN Number (optional)"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
              </div>
            </div>
          )}
          {/* UPDATED: Address section with dynamic fields */}
          {activeSection === 'address' && (
            <div>
              <h3 style={{ color: '#2c3e50', fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>Address Details</h3>
              {formData.addresses.map((address, index) => (
                <div key={index} style={{ display: 'grid', gap: '15px', marginBottom: '15px', border: '1px solid #ddd', padding: '10px', borderRadius: '10px' }}>
                  <h4 style={{textAlign: 'center', margin: '5px 0'}}>Address {index + 1}</h4>
                  {/* Country */}
                  <SearchableSelect
                    options={countryList}
                    value={address.country}
                    onChange={(value) => handleAddressFieldChange(index, 'country', value)}
                    placeholder="Select Country"
                  />
                  {/* Field1 */}
                  {address.country && addressStructure.countries[address.country]?.field1 && (
                    <div>
                      <label style={{ fontWeight: 'bold', color: '#555', fontSize: '0.9rem' }}>
                        {addressStructure.countries[address.country].field1.label}
                      </label>
                      <SearchableSelect
                        options={addressStructure.countries[address.country].field1.values || []}
                        value={address.field1}
                        onChange={(value) => handleAddressFieldChange(index, 'field1', value)}
                        placeholder={`Select ${addressStructure.countries[address.country].field1.label}`}
                      />
                    </div>
                  )}
                  {/* Field2 */}
                  {address.country && addressStructure.countries[address.country]?.field2 && (
                    <div>
                      <label style={{ fontWeight: 'bold', color: '#555', fontSize: '0.9rem' }}>
                        {addressStructure.countries[address.country].field2.label}
                      </label>
                      <SearchableSelect
                        options={getFilteredValues(index, 'field2').length > 0
                          ? getFilteredValues(index, 'field2')
                          : (addressStructure.countries[address.country].field2.values || [])}
                        value={address.field2}
                        onChange={(value) => handleAddressFieldChange(index, 'field2', value)}
                        placeholder={`Select ${addressStructure.countries[address.country].field2.label}`}
                      />
                    </div>
                  )}
                  {/* Field3 */}
                  {address.country && addressStructure.countries[address.country]?.field3 && (
                    <div>
                      <label style={{ fontWeight: 'bold', color: '#555', fontSize: '0.9rem' }}>
                        {addressStructure.countries[address.country].field3.label}
                      </label>
                      <SearchableSelect
                        options={getFilteredValues(index, 'field3').length > 0
                          ? getFilteredValues(index, 'field3')
                          : (addressStructure.countries[address.country].field3.values || [])}
                        value={address.field3}
                        onChange={(value) => handleAddressFieldChange(index, 'field3', value)}
                        placeholder={`Select ${addressStructure.countries[address.country].field3.label}`}
                      />
                    </div>
                  )}
                  {/* Flat / Villa No */}
                  <input
                    type="text"
                    name="flat_villa_no"
                    value={address.flat_villa_no}
                    onChange={(e) => handleAddressChange(index, e)}
                    placeholder="Flat / Villa No"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                  {/* Building Name */}
                  <input
                    type="text"
                    name="building_name"
                    value={address.building_name}
                    onChange={(e) => handleAddressChange(index, e)}
                    placeholder="Building Name"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                </div>
              ))}
              <button
                onClick={addAddress}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3498db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginTop: '10px',
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#2980b9')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#3498db')}
              >
                <FaPlus /> Add Address
              </button>
            </div>
          )}
          {activeSection === 'contact' && (
            <div>
              <h3 style={{ color: '#2c3e50', fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>Contact Details</h3>
              {formData.contacts.map((contact, index) => (
                <div key={index} style={{ display: 'grid', gap: '15px', marginBottom: '15px', border: '1px solid #ddd', padding: '10px', borderRadius: '10px' }}>
                   <h4 style={{textAlign: 'center', margin: '5px 0'}}>Contact {index + 1}</h4>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={contact.phoneNumber}
                    onChange={(e) => handleContactChange(index, e)}
                    placeholder="Phone Number"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                  <input
                    type="text"
                    name="whatsappNumber"
                    value={contact.whatsappNumber}
                    onChange={(e) => handleContactChange(index, e)}
                    placeholder="WhatsApp Number (optional)"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                  <input
                    type="email"
                    name="emailAddress"
                    value={contact.emailAddress}
                    onChange={(e) => handleContactChange(index, e)}
                    placeholder="Email Address"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                  <input
                    type="text"
                    name="website"
                    value={contact.website}
                    onChange={(e) => handleContactChange(index, e)}
                    placeholder="Website / Social Media Link (optional)"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                </div>
              ))}
              <button
                onClick={addContact}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3498db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginTop: '10px',
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#2980b9')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#3498db')}
              >
                <FaPlus /> Add Contact
              </button>
            </div>
          )}
          {activeSection === 'payment' && (
            <div>
              <h3 style={{ color: '#2c3e50', fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>Bank Details</h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="Bank Name"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  placeholder="Account Holder Name"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="Account Number"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  placeholder="IFSC Code"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleChange}
                  placeholder="UPI ID"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  name="currencyType"
                  value={formData.currencyType}
                  onChange={handleChange}
                  placeholder="Currency Type (e.g., INR, USD)"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
              </div>
            </div>
          )}
          {/* Main Save/Print buttons at the bottom */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: '12px 20px',
                backgroundColor: loading ? '#bdc3c7' : '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                transition: 'background-color 0.3s',
                flex: 1,
              }}
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#2980b9')}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#3498db')}
            >
              {loading ? 'Saving...' : 'Save Details'}
            </button>
            <button
              onClick={handlePrint}
              style={{
                padding: '12px 20px',
                backgroundColor: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'background-color 0.3s',
                flex: 1,
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = '#2980b9')}
              onMouseOut={(e) => (e.target.style.backgroundColor = '#3498db')}
            >
              Print Details
            </button>
          </div>
        </div>
      </div>
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
          border: 1px solid #bdc3c7;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .searchable-select input:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
        }
        .searchable-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #fff;
          border: 1px solid #bdc3c7;
          border-top: none;
          border-radius: 0 0 10px 10px;
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
          font-size: 1rem;
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
      `}</style>
    </div>
  );
}

export default CompanyDetails;