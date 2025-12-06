// src/components/Form/companydetails.jsx (Updated with "Company Licence" field after Owner Name, increased width, tabs in single line)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaBuilding, FaPlus, FaClock, FaGlobe, FaLink, FaTrash, FaCalendarAlt, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
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
// NEW: Country Code Selector Component (similar to AddEmployee)
const CountryCodeSelector = ({ selectedCode = '+91', onCodeChange }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const isdCodes = [
    { code: "+91", country: "India" },
    { code: "+1", country: "USA" },
    { code: "+44", country: "UK" },
    { code: "+971", country: "UAE" },
    { code: "+61", country: "Australia" },
  ];
  const handleCodeSelect = (code) => {
    onCodeChange(code);
    setShowDropdown(false);
  };
  return (
    <div className="country-code-selector" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: '#fff',
          border: '1px solid #bdc3c7',
          borderRight: 'none',
          padding: '10px 8px',
          fontSize: '1rem',
          height: '100%',
          cursor: 'pointer',
          borderRadius: '8px 0 0 8px',
        }}
      >
        {selectedCode}
      </button>
      {showDropdown && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: 100,
          background: '#fff',
          border: '1px solid #bdc3c7',
          borderRadius: '0 0 8px 8px',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          minWidth: '120px',
          boxShadow: '0 4px 12px rgba(0,0,0,.15)',
        }}>
          {isdCodes.map((c, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleCodeSelect(c.code)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                {c.code} ({c.country})
              </button>
            </li>
          ))}
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
    companyLicence: '', // NEW: Company Licence field
    businessType: '',
    otherBusinessType: '',
    taxType: '',
    taxPercentage: '',
    taxNumber: '',
    fssaiNumber: '',
    panNumber: '',
    openingTime: '',
    closingTime: '',
    totalTime: '',
    specialTimings: [], // NEW: Array for special timings {reason, date, startTime, endTime, duration}
    addresses: [{ country: '', field1: '', field2: '', field3: '', flat_villa_no: '', building_name: '' }],
    contacts: [{
      phoneCountryCode: '+91',
      phoneNumber: '',
      whatsappCountryCode: '+91',
      whatsappNumber: '',
      emailAddress: '',
      websites: [] // NEW: Array for multiple websites
    }],
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    currencyType: '', // Will be pre-filled from settings
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [warning, setWarning] = useState(''); // NEW: For warning messages
  const [activeSection, setActiveSection] = useState('basic'); // Default to 'basic' to show form first
  const [savedDetails, setSavedDetails] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null); // State for logo URL
  const [addressStructure, setAddressStructure] = useState({ countries: {} });
  const [linkedValues, setLinkedValues] = useState({});
  const [baseUrl, setBaseUrl] = useState(""); // NEW: Added baseUrl state like in AdminPage
  const [systemSettings, setSystemSettings] = useState({}); // NEW: State for system settings (for currency)
  // NEW: States for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSpecial, setEditingSpecial] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // OLD: Remove editingSpecialIndex and tempSpecialTiming for add only
  const [tempSpecialTiming, setTempSpecialTiming] = useState({ reason: '', date: '', startTime: '', endTime: '', duration: '' });
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
        fetchSystemSettings(currentBaseUrl); // NEW: Fetch settings for currency
      } else {
        // If not client mode, use empty baseUrl (local)
        fetchLogo("");
        fetchAddressStructure("");
        fetchCompanyDetails("");
        fetchSystemSettings(""); // NEW
      }
    }
  };
  // NEW: Fetch system settings for pre-filling currency
  const fetchSystemSettings = async (currentBaseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/settings`);
      if (response.data) {
        setSystemSettings(response.data);
        // Pre-fill currencyType if not already set
        if (!formData.currencyType) {
          setFormData(prev => ({ ...prev, currencyType: response.data.currency || 'INR' }));
        }
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
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
        // NEW: Ensure currencyType is set from settings if not in details
        if (!latestDetails.currencyType && systemSettings.currency) {
          setFormData(prev => ({ ...prev, currencyType: systemSettings.currency }));
        }
        console.log('Fetched details:', latestDetails); // Debug log
      } else {
        // setError('No company details found.'); // Don't show error, just means new entry
        console.log('No existing company details found. Ready for new entry.');
        // NEW: Pre-fill currency from settings for new entry
        if (systemSettings.currency) {
          setFormData(prev => ({ ...prev, currencyType: systemSettings.currency }));
        }
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
  const handleOpeningTimeChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, openingTime: value }));
    calculateTotalTime(value, formData.closingTime);
  };
  const handleClosingTimeChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, closingTime: value }));
    calculateTotalTime(formData.openingTime, value);
  };
  const calculateTotalTime = (opening, closing) => {
    if (!opening || !closing) {
      setFormData((prev) => ({ ...prev, totalTime: '' }));
      return;
    }
    const [openH, openM] = opening.split(':').map(Number);
    const [closeH, closeM] = closing.split(':').map(Number);
    let totalMin = (closeH * 60 + closeM) - (openH * 60 + openM);
    if (totalMin < 0) totalMin += 24 * 60;
    const totalH = Math.floor(totalMin / 60);
    const totalM = totalMin % 60;
    const total = `${totalH.toString().padStart(2, '0')}:${totalM.toString().padStart(2, '0')}`;
    setFormData((prev) => ({ ...prev, totalTime: total }));
  };
  // NEW: Calculate duration for special timing
  const calculateSpecialDuration = (startTime, endTime, setDuration) => {
    if (!startTime || !endTime) {
      setDuration('');
      return;
    }
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let totalMin = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMin < 0) totalMin += 24 * 60;
    const totalH = Math.floor(totalMin / 60);
    const totalM = totalMin % 60;
    const total = `${totalH.toString().padStart(2, '0')}:${totalM.toString().padStart(2, '0')}`;
    setDuration(total);
  };
  // NEW: Handle special timing changes for add
  const handleSpecialChange = (field, value) => {
    setTempSpecialTiming(prev => ({ ...prev, [field]: value }));
    if (field === 'startTime' || field === 'endTime') {
      calculateSpecialDuration(
        field === 'startTime' ? value : tempSpecialTiming.startTime,
        field === 'endTime' ? value : tempSpecialTiming.endTime,
        (duration) => setTempSpecialTiming(prev => ({ ...prev, duration }))
      );
    }
  };
  // UPDATED: Add special timing (only add, no edit here)
  const saveSpecialTiming = () => {
    if (!tempSpecialTiming.reason || !tempSpecialTiming.date || !tempSpecialTiming.startTime || !tempSpecialTiming.endTime) {
      setError('Please fill all fields for special timing.');
      return;
    }
    // Add new
    setFormData(prev => ({
      ...prev,
      specialTimings: [...prev.specialTimings, { ...tempSpecialTiming }]
    }));
    setTempSpecialTiming({ reason: '', date: '', startTime: '', endTime: '', duration: '' });
    setMessage('Special timing saved.');
    setError(null);
  };
  // NEW: Edit special timing - open modal
  const editSpecialTiming = (index) => {
    const special = formData.specialTimings[index];
    setEditingSpecial({ ...special, index });
    setShowEditModal(true);
  };
  // UPDATED: Delete special timing - no confirm, just warning message
  const deleteSpecialTiming = (index) => {
    const updatedSpecials = formData.specialTimings.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, specialTimings: updatedSpecials }));
    setWarning('Special timing deleted.');
    setError(null);
    setMessage('');
  };
  // NEW: Handle edit changes in modal
  const handleEditChange = (field, value) => {
    const newSpecial = { ...editingSpecial, [field]: value };
    setEditingSpecial(newSpecial);
    if (field === 'startTime' || field === 'endTime') {
      const startTime = field === 'startTime' ? value : editingSpecial.startTime;
      const endTime = field === 'endTime' ? value : editingSpecial.endTime;
      calculateSpecialDuration(startTime, endTime, (duration) => {
        setEditingSpecial(prev => ({ ...prev, duration }));
      });
    }
  };
  // NEW: Update special timing from modal
  const updateSpecialTiming = () => {
    if (!editingSpecial.reason || !editingSpecial.date || !editingSpecial.startTime || !editingSpecial.endTime) {
      setError('Please fill all fields for special timing.');
      return;
    }
    const updatedSpecials = [...formData.specialTimings];
    updatedSpecials[editingSpecial.index] = { ...editingSpecial };
    setFormData(prev => ({ ...prev, specialTimings: updatedSpecials }));
    setShowEditModal(false);
    setEditingSpecial(null);
    setShowDeleteConfirm(false);
    setMessage('Special timing updated.');
    setError(null);
  };
  // NEW: Cancel edit in modal
  const cancelEditSpecial = () => {
    setShowEditModal(false);
    setEditingSpecial(null);
    setShowDeleteConfirm(false);
  };
  // NEW: Confirm delete from modal
  const confirmDeleteFromModal = () => {
    deleteSpecialTiming(editingSpecial.index);
    setShowDeleteConfirm(false);
    setShowEditModal(false);
    setEditingSpecial(null);
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
    if (name.startsWith('phoneCountryCode') || name.startsWith('whatsappCountryCode')) {
      newContacts[index][name] = value;
    } else {
      newContacts[index][name] = value;
    }
    setFormData((prev) => ({ ...prev, contacts: newContacts }));
  };
  // NEW: Handle country code change for phone/whatsapp
  const handleContactCountryCodeChange = (index, field, code) => {
    const newContacts = [...formData.contacts];
    newContacts[index][`${field}CountryCode`] = code;
    setFormData((prev) => ({ ...prev, contacts: newContacts }));
  };
  // NEW: Handle multiple websites: add/remove
  const addWebsite = (contactIndex) => {
    const newContacts = [...formData.contacts];
    newContacts[contactIndex].websites.push('');
    setFormData((prev) => ({ ...prev, contacts: newContacts }));
  };
  const removeWebsite = (contactIndex, websiteIndex) => {
    const newContacts = [...formData.contacts];
    newContacts[contactIndex].websites.splice(websiteIndex, 1);
    setFormData((prev) => ({ ...prev, contacts: newContacts }));
  };
  const handleWebsiteChange = (contactIndex, websiteIndex, value) => {
    const newContacts = [...formData.contacts];
    newContacts[contactIndex].websites[websiteIndex] = value;
    setFormData((prev) => ({ ...prev, contacts: newContacts }));
  };
  // NEW: Remove entire contact (keep at least one)
  const removeContact = (index) => {
    if (formData.contacts.length > 1) {
      const newContacts = [...formData.contacts];
      newContacts.splice(index, 1);
      setFormData((prev) => ({ ...prev, contacts: newContacts }));
    }
  };
  // NEW: Remove entire address (keep at least one)
  const removeAddress = (index) => {
    if (formData.addresses.length > 1) {
      const newAddresses = [...formData.addresses];
      newAddresses.splice(index, 1);
      setFormData((prev) => ({ ...prev, addresses: newAddresses }));
    }
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
      contacts: [...prev.contacts, {
        phoneCountryCode: '+91',
        phoneNumber: '',
        whatsappCountryCode: '+91',
        whatsappNumber: '',
        emailAddress: '',
        websites: []
      }],
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
  // UPDATED: Handle submit with baseUrl and specialTimings
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setMessage('');
      setWarning('');
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
  // UPDATED: Format contact for print (include country codes and multiple websites)
  const formatContactForPrint = (contact, index) => {
    return (
      <div key={index}>
        <div className="field"><span className="centered-label">Contact {index + 1}:</span><span className="value"></span></div>
        <div className="field"><span className="label">Phone Number:</span><span className="value">{contact.phoneCountryCode}{contact.phoneNumber || 'N/A'}</span></div>
        <div className="field"><span className="label">WhatsApp Number:</span><span className="value">{contact.whatsappCountryCode}{contact.whatsappNumber || 'N/A'}</span></div>
        <div className="field"><span className="label">Email Address:</span><span className="value">{contact.emailAddress || 'N/A'}</span></div>
        {contact.websites && contact.websites.length > 0 && (
          <div className="field"><span className="label">Websites:</span><span className="value">{contact.websites.filter(w => w).join(', ') || 'N/A'}</span></div>
        )}
      </div>
    );
  };
  // NEW: Format special timing for print/display
  const formatSpecialTimingForPrint = (special, index) => {
    return (
      <div key={index} className="field" style={{ marginBottom: '5px' }}>
        <span className="label">Special {index + 1} - {special.reason} ({special.date}):</span>
        <span className="value">{special.startTime} to {special.endTime} ({special.duration})</span>
      </div>
    );
  };
  // UPDATED: Handle print with dynamic logoUrl, updated contact format, specialTimings, and NEW companyLicence
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
            .column { width: 48%; min-width: 300px; }
            .field { display: flex; align-items: baseline; margin-bottom: 8px; font-size: 14px; }
            .label { font-weight: bold; min-width: 180px; text-align: right; padding-right: 10px; color: #555; }
            .centered-label { font-weight: bold; min-width: 180px; text-align: center; color: #555; }
            .value { flex: 1; text-align: left; color: #000; }
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
                  <div class="field"><span class="label">Opening Time:</span><span class="value">${savedDetails.openingTime || 'N/A'}</span></div>
                  <div class="field"><span class="label">Total Operating Time:</span><span class="value">${savedDetails.totalTime || 'N/A'}</span></div>
                  <div class="field"><span class="label">FSSAI Number:</span><span class="value">${savedDetails.fssaiNumber || 'N/A'}</span></div>
                </div>
                <div class="column">
                  <div class="field"><span class="label">Owner/Manager Name:</span><span class="value">${savedDetails.ownerName || 'N/A'}</span></div>
                  <div class="field"><span class="label">Company Licence:</span><span class="value">${savedDetails.companyLicence || 'N/A'}</span></div>
                  <div class="field"><span class="label">${savedDetails.taxType === 'GST' ? 'GST' : 'VAT'} Number:</span><span class="value">${savedDetails.taxNumber || 'N/A'}</span></div>
                  <div class="field"><span class="label">PAN Number:</span><span class="value">${savedDetails.panNumber || 'N/A'}</span></div>
                  <div class="field"><span class="label">Closing Time:</span><span class="value">${savedDetails.closingTime || 'N/A'}</span></div>
                </div>
              </div>
            </div>
            <div class="section">
              <h3>Special Timings (Overrides)</h3>
              ${savedDetails.specialTimings && savedDetails.specialTimings.length > 0 ? savedDetails.specialTimings.map((special, index) => `
                <div class="row" style="margin-bottom: 10px;">
                  <div class="column" style="width: 100%;">
                    <div class="field"><span class="label">Reason:</span><span class="value">${special.reason}</span></div>
                    <div class="field"><span class="label">Date:</span><span class="value">${special.date}</span></div>
                    <div class="field"><span class="label">Start Time:</span><span class="value">${special.startTime}</span></div>
                    <div class="field"><span class="label">End Time:</span><span class="value">${special.endTime}</span></div>
                    <div class="field"><span class="label">Duration:</span><span class="value">${special.duration}</span></div>
                  </div>
                </div>
              `).join('') : '<div class="row"><div class="column"><div class="field"><span class="label">No special timings.</span><span class="value"></span></div></div></div>'}
            </div>
            <div class="section">
              <h3>Address Details</h3>
              ${savedDetails.addresses && savedDetails.addresses.length > 0 ? savedDetails.addresses.map((address, index) => `
                <div class="row" style="margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; justify-content: flex-start;">
                  <div class="column" style="width: 100%;">
                    <div class="field"><span class="centered-label">Address ${index + 1}:</span><span class="value"></span></div>
                    <div class="field"><span class="label">Full Address:</span><span class="value">${formatAddressForPrint(address)}</span></div>
                  </div>
                </div>
              `).join('') : '<div class="row" style="justify-content: flex-start;"><div class="column" style="width: 100%;"><div class="field"><span class="centered-label">No addresses available.</span><span class="value"></span></div></div></div>'}
            </div>
            <div class="section">
              <h3>Contact Details</h3>
              ${savedDetails.contacts && savedDetails.contacts.length > 0 ? savedDetails.contacts.map((contact, index) => `
                <div class="row" style="margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;">
                  <div class="column">
                    <div class="field"><span class="centered-label">Contact ${index + 1}:</span><span class="value"></span></div>
                    <div class="field"><span class="label">Phone Number:</span><span class="value">${contact.phoneCountryCode || ''}${contact.phoneNumber || 'N/A'}</span></div>
                    <div class="field"><span class="label">WhatsApp Number:</span><span class="value">${contact.whatsappCountryCode || ''}${contact.whatsappNumber || 'N/A'}</span></div>
                    <div class="field"><span class="label">Email Address:</span><span class="value">${contact.emailAddress || 'N/A'}</span></div>
                    ${contact.websites && contact.websites.length > 0 ? contact.websites.map((website, wIndex) => website ? `
                      <div class="field"><span class="label">Website ${wIndex + 1}:</span><span class="value">${website}</span></div>
                    ` : '').join('') : ''}
                  </div>
                </div>
              `).join('') : '<div class="row" style="justify-content: flex-start;"><div class="column" style="width: 100%;"><div class="field"><span class="centered-label">No contacts available.</span><span class="value"></span></div></div></div>'}
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Fixed Back Button in Top-Left Corner - Styled like EmployeeList */}
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
      {/* Main Container - Like EmployeeList Card - UPDATED: Increased maxWidth to 1200px */}
      <div style={{
        maxWidth: '1200px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header with Title and Working Hours Button - Styled like EmployeeList Header */}
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
            <FaBuilding style={{ color: '#3498db', fontSize: '2rem' }} />
            Company Details
          </h2>
          <button
            onClick={() => navigate('/working')}
            style={{
              background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
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
              boxShadow: '0 4px 8px rgba(39, 174, 96, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 12px rgba(39, 174, 96, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 8px rgba(39, 174, 96, 0.3)';
            }}
            disabled={loading}
          >
            <FaClock /> Working Hours
          </button>
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
            <FaClock style={{ fontSize: '1.2rem', color: '#27ae60' }} />
            {message}
          </div>
        )}
        {/* NEW: Warning Message */}
        {warning && (
          <div style={{
            background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
            color: '#856404',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            border: '1px solid #f39c12',
            boxShadow: '0 2px 4px rgba(243, 156, 18, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <FaTrash style={{ fontSize: '1.2rem', color: '#f39c12' }} />
            {warning}
          </div>
        )}
        {/* UPDATED: Tabs - flexWrap: 'nowrap' for single line */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: '#3498db', padding: '10px', borderRadius: '10px', flexWrap: 'nowrap', overflowX: 'auto' }}>
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
              whiteSpace: 'nowrap',
              flexShrink: 0,
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
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Basic Information
          </button>
          {/* NEW: Timing Tab Button */}
          <button
            onClick={() => toggleSection('timing')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeSection === 'timing' ? '#fff' : 'transparent',
              color: activeSection === 'timing' ? '#3498db' : '#fff',
              border: '1px solid #fff',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <FaClock /> Timing
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
              whiteSpace: 'nowrap',
              flexShrink: 0,
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
              whiteSpace: 'nowrap',
              flexShrink: 0,
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
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Bank Details
          </button>
        </div>
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* MODIFIED: Details section with single column for proper line display like image, added specialTimings, and NEW companyLicence */}
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
                {/* Saved Details Content - Single Column for Exact Line Display */}
                {savedDetails ? (
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {/* Basic Information - UPDATED: Added Company Licence after Owner Name */}
                    <div className="section">
                      <h4 style={{ color: '#2c3e50', fontSize: '1.3rem', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>Basic Information</h4>
                      <div style={{ width: '100%', fontSize: '0.95rem' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Restaurant Name :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.restaurantName || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Owner/Manager Name :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.ownerName || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Company Licence :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.companyLicence || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Business Type :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.businessType || 'N/A'}{savedDetails.businessType === 'Other' ? ` (${savedDetails.otherBusinessType || 'N/A'})` : ''}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Tax Type :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.taxType || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Tax Percentage :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.taxPercentage || 'N/A'}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Opening Time :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.openingTime || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Closing Time :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.closingTime || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Total Operating Time :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.totalTime || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>FSSAI Number :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.fssaiNumber || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>${savedDetails.taxType === 'GST' ? 'GST' : 'VAT'} Number :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.taxNumber || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>PAN Number :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.panNumber || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    {/* NEW: Special Timings Section */}
                    <div className="section">
                      <h4 style={{ color: '#2c3e50', fontSize: '1.3rem', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>Special Timings (Overrides)</h4>
                      {savedDetails.specialTimings && savedDetails.specialTimings.length > 0 ? savedDetails.specialTimings.map((special, index) => (
                        <div key={index} style={{ marginBottom: '15px', borderBottom: '1px dashed #ccc', paddingBottom: '10px', fontSize: '0.95rem' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                            <strong style={{ minWidth: '200px', textAlign: 'left', color: '#333', fontWeight: 'bold' }}>Special {index + 1} :</strong>
                            <span style={{ flex: 1 }}></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                            <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Reason :</strong>
                            <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{special.reason}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                            <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Date :</strong>
                            <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{special.date}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                            <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Start Time :</strong>
                            <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{special.startTime}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                            <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>End Time :</strong>
                            <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{special.endTime}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                            <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Duration :</strong>
                            <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{special.duration}</span>
                          </div>
                        </div>
                      )) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', color: '#333', fontWeight: 'bold' }}>No special timings available.</strong>
                          <span style={{ flex: 1 }}></span>
                        </div>
                      )}
                    </div>
                    {/* Address Details - UPDATED: Use formatAddressForPrint, Single Column */}
                    <div className="section">
                      <h4 style={{ color: '#2c3e50', fontSize: '1.3rem', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>Address Details</h4>
                      {savedDetails.addresses && savedDetails.addresses.length > 0 ? savedDetails.addresses.map((address, index) => (
                        <div key={index} style={{ marginBottom: '15px', borderBottom: '1px dashed #ccc', paddingBottom: '10px', fontSize: '0.95rem' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                            <strong style={{ minWidth: '200px', textAlign: 'left', color: '#333', fontWeight: 'bold' }}>Address {index + 1} :</strong>
                            <span style={{ flex: 1 }}></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                            <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Full Address :</strong>
                            <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{formatAddressForPrint(address)}</span>
                          </div>
                        </div>
                      )) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', color: '#333', fontWeight: 'bold' }}>No addresses available.</strong>
                          <span style={{ flex: 1 }}></span>
                        </div>
                      )}
                    </div>
                    {/* Contact Details - Single Column, UPDATED for country codes and multiple websites */}
                    <div className="section">
                      <h4 style={{ color: '#2c3e50', fontSize: '1.3rem', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>Contact Details</h4>
                      {savedDetails.contacts && savedDetails.contacts.length > 0 ? savedDetails.contacts.map((contact, index) => (
                        <div key={index} style={{ marginBottom: '15px', borderBottom: '1px dashed #ccc', paddingBottom: '10px', fontSize: '0.95rem' }}>
                          <div style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                              <strong style={{ minWidth: '200px', textAlign: 'left', color: '#333', fontWeight: 'bold' }}>Contact {index + 1} :</strong>
                              <span style={{ flex: 1 }}></span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                              <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Phone Number :</strong>
                              <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{contact.phoneCountryCode || ''}{contact.phoneNumber || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                              <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>WhatsApp Number :</strong>
                              <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{contact.whatsappCountryCode || ''}{contact.whatsappNumber || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                              <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Email Address :</strong>
                              <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{contact.emailAddress || 'N/A'}</span>
                            </div>
                            {contact.websites && contact.websites.length > 0 && contact.websites.map((website, wIndex) => website ? (
                              <div key={wIndex} style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                                <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Website {wIndex + 1} :</strong>
                                <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{website}</span>
                              </div>
                            ) : null)}
                          </div>
                        </div>
                      )) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', color: '#333', fontWeight: 'bold' }}>No contacts available.</strong>
                          <span style={{ flex: 1 }}></span>
                        </div>
                      )}
                    </div>
                    {/* Bank Details - Single Column */}
                    <div className="section">
                      <h4 style={{ color: '#2c3e50', fontSize: '1.3rem', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>Bank Details</h4>
                      <div style={{ width: '100%', fontSize: '0.95rem' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Bank Name :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.bankName || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Account Holder Name :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.accountHolderName || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Account Number :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.accountNumber || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>IFSC Code :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.ifscCode || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>UPI ID :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.upiId || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Currency Type :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.currencyType || 'N/A'}</span>
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
                {/* NEW: Company Licence Input after Owner Name */}
                <input
                  type="text"
                  name="companyLicence"
                  value={formData.companyLicence}
                  onChange={handleChange}
                  placeholder="Company Licence (optional)"
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
          {/* UPDATED: Timing Section - Added Special Timings sub-section */}
          {activeSection === 'timing' && (
            <div>
              <h3 style={{ color: '#2c3e50', fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>
                <FaClock style={{ marginRight: '8px' }} /> Timing Details
              </h3>
              <div style={{ display: 'grid', gap: '15px', maxWidth: '400px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', color: '#555', fontSize: '0.9rem' }}>
                  Set your business operating hours below. Total time is auto-calculated.
                </div>
                <input
                  type="time"
                  name="openingTime"
                  value={formData.openingTime}
                  onChange={handleOpeningTimeChange}
                  placeholder="Start Time"
                  style={{
                    padding: '10px',
                    border: '1px solid #bdc3c7',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}
                />
                <input
                  type="time"
                  name="closingTime"
                  value={formData.closingTime}
                  onChange={handleClosingTimeChange}
                  placeholder="End Time"
                  style={{
                    padding: '10px',
                    border: '1px solid #bdc3c7',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}
                />
                <input
                  type="text"
                  value={formData.totalTime}
                  readOnly
                  placeholder="Total Operating Time (auto-calculated)"
                  style={{
                    padding: '10px',
                    border: '1px solid #bdc3c7',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    backgroundColor: '#f8f9fa',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#3498db'
                  }}
                />
                <div style={{ textAlign: 'center', color: '#27ae60', fontSize: '0.9rem' }}>
                  <FaCalendarAlt /> Note: This applies to daily operations. Customize per day in Working Hours page if needed.
                </div>
              </div>
              {/* NEW: Special Timings Sub-Section */}
              <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #eee' }}>
                <h4 style={{ color: '#2c3e50', fontSize: '1.3rem', marginBottom: '15px', textAlign: 'center' }}>
                  Special Timings (Overrides for Specific Dates)
                </h4>
                <div style={{ textAlign: 'center', color: '#555', fontSize: '0.9rem', marginBottom: '15px' }}>
                  Add special timings for specific dates (e.g., holidays, events). These override regular hours.
                </div>
                {/* Add Form */}
                <div style={{ display: 'grid', gap: '10px', maxWidth: '400px', margin: '0 auto 20px', padding: '15px', border: '1px solid #ddd', borderRadius: '10px' }}>
                  <input
                    type="text"
                    value={tempSpecialTiming.reason}
                    onChange={(e) => handleSpecialChange('reason', e.target.value)}
                    placeholder="Reason (e.g., Holiday, Event)"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                  <input
                    type="date"
                    value={tempSpecialTiming.date}
                    onChange={(e) => handleSpecialChange('date', e.target.value)}
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                  <input
                    type="time"
                    value={tempSpecialTiming.startTime}
                    onChange={(e) => handleSpecialChange('startTime', e.target.value)}
                    placeholder="Start Time"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                  <input
                    type="time"
                    value={tempSpecialTiming.endTime}
                    onChange={(e) => handleSpecialChange('endTime', e.target.value)}
                    placeholder="End Time"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                  <input
                    type="text"
                    value={tempSpecialTiming.duration}
                    readOnly
                    placeholder="Duration (auto-calculated)"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem', backgroundColor: '#f8f9fa', fontWeight: 'bold' }}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      onClick={saveSpecialTiming}
                      style={{ padding: '10px 15px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                    >
                      <FaPlus /> Add
                    </button>
                  </div>
                </div>
                {/* List of Special Timings */}
                {formData.specialTimings.length > 0 && (
                  <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '10px' }}>
                    {formData.specialTimings.map((special, index) => (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', padding: '10px', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.9rem' }}>
                          <strong>{special.reason}</strong> - {special.date} ({special.startTime} - {special.endTime}, {special.duration})
                        </div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => editSpecialTiming(index)} style={{ padding: '5px', backgroundColor: '#f39c12', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                            <FaEdit />
                          </button>
                          <button onClick={() => deleteSpecialTiming(index)} style={{ padding: '5px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* UPDATED: Address section with dynamic fields and remove button */}
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
                  {/* NEW: Remove Address Button */}
                  {formData.addresses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAddress(index)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                      }}
                    >
                      <FaTrash /> Remove Address
                    </button>
                  )}
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
          {/* UPDATED: Contact section with country codes (no labels), multiple websites, and remove button */}
          {activeSection === 'contact' && (
            <div>
              <h3 style={{ color: '#2c3e50', fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>Contact Details</h3>
              {formData.contacts.map((contact, index) => (
                <div key={index} style={{ display: 'grid', gap: '15px', marginBottom: '15px', border: '1px solid #ddd', padding: '10px', borderRadius: '10px' }}>
                   <h4 style={{textAlign: 'center', margin: '5px 0'}}>Contact {index + 1}</h4>
                  {/* Phone Number with Country Code - UPDATED: No label */}
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <CountryCodeSelector
                      selectedCode={contact.phoneCountryCode}
                      onCodeChange={(code) => handleContactCountryCodeChange(index, 'phone', code)}
                    />
                    <input
                      type="text"
                      name={`phoneNumber_${index}`}
                      value={contact.phoneNumber}
                      onChange={(e) => handleContactChange(index, e)}
                      placeholder="Phone Number"
                      style={{ flex: 1, padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                    />
                  </div>
                  {/* WhatsApp Number with Country Code - UPDATED: No label */}
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <CountryCodeSelector
                      selectedCode={contact.whatsappCountryCode}
                      onCodeChange={(code) => handleContactCountryCodeChange(index, 'whatsapp', code)}
                    />
                    <input
                      type="text"
                      name={`whatsappNumber_${index}`}
                      value={contact.whatsappNumber}
                      onChange={(e) => handleContactChange(index, e)}
                      placeholder="WhatsApp Number (optional)"
                      style={{ flex: 1, padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                    />
                  </div>
                  <input
                    type="email"
                    name="emailAddress"
                    value={contact.emailAddress}
                    onChange={(e) => handleContactChange(index, e)}
                    placeholder="Email Address"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                  {/* Multiple Websites */}
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#555', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      Websites <FaLink />
                    </label>
                    {contact.websites.map((website, wIndex) => (
                      <div key={wIndex} style={{ display: 'flex', gap: '5px', marginBottom: '5px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={website}
                          onChange={(e) => handleWebsiteChange(index, wIndex, e.target.value)}
                          placeholder={`Website ${wIndex + 1}`}
                          style={{ flex: 1, padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeWebsite(index, wIndex)}
                          style={{ padding: '10px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addWebsite(index)}
                      style={{ padding: '8px 12px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', marginTop: '5px' }}
                    >
                      <FaPlus /> Add Website
                    </button>
                  </div>
                  {/* NEW: Remove Contact Button */}
                  {formData.contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                      }}
                    >
                      <FaTrash /> Remove Contact
                    </button>
                  )}
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
                {/* UPDATED: Currency Type - Read-only, pre-filled from settings */}
                <input
                  type="text"
                  name="currencyType"
                  value={formData.currencyType || systemSettings.currency || ''}
                  onChange={handleChange}
                  placeholder="Currency Type (e.g., INR, USD)"
                  readOnly
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem', backgroundColor: '#f8f9fa' }}
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
      {/* NEW: Edit Modal for Special Timing */}
      {showEditModal && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            zIndex: 1000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }} 
          onClick={cancelEditSpecial}
        >
          <div 
            style={{ 
              background: 'white', 
              padding: '20px', 
              borderRadius: '10px', 
              maxWidth: '500px', 
              width: '90%', 
              maxHeight: '90%', 
              overflowY: 'auto' 
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Edit Special Timing</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <input
                type="text"
                value={editingSpecial?.reason || ''}
                onChange={(e) => handleEditChange('reason', e.target.value)}
                placeholder="Reason (e.g., Holiday, Event)"
                style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
              />
              <input
                type="date"
                value={editingSpecial?.date || ''}
                onChange={(e) => handleEditChange('date', e.target.value)}
                style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
              />
              <input
                type="time"
                value={editingSpecial?.startTime || ''}
                onChange={(e) => handleEditChange('startTime', e.target.value)}
                placeholder="Start Time"
                style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
              />
              <input
                type="time"
                value={editingSpecial?.endTime || ''}
                onChange={(e) => handleEditChange('endTime', e.target.value)}
                placeholder="End Time"
                style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
              />
              <input
                type="text"
                value={editingSpecial?.duration || ''}
                readOnly
                placeholder="Duration (auto-calculated)"
                style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem', backgroundColor: '#f8f9fa', fontWeight: 'bold' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button
                onClick={updateSpecialTiming}
                style={{ padding: '10px 15px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
              >
                <FaSave /> Update
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{ padding: '10px 15px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
              >
                <FaTrash /> Delete
              </button>
              <button
                onClick={cancelEditSpecial}
                style={{ padding: '10px 15px', backgroundColor: '#bdc3c7', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
              >
                <FaTimes /> Cancel
              </button>
            </div>
            {/* NEW: Inline Delete Confirmation in Modal */}
            {showDeleteConfirm && (
              <div style={{ 
                marginTop: '20px', 
                padding: '15px', 
                background: '#fff3cd', 
                border: '1px solid #ffeaa7', 
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 15px 0', color: '#856404' }}>Are you sure you want to delete this special timing? This action cannot be undone.</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    onClick={confirmDeleteFromModal}
                    style={{ padding: '8px 12px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{ padding: '8px 12px', backgroundColor: '#bdc3c7', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                  >
                    No
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
        /* NEW: Country Code Selector Styles */
        .country-code-selector ul {
          box-shadow: 0 4px 12px rgba(0,0,0,.15);
        }
        .country-code-selector button:hover {
          background-color: #f8f9fa;
        }
      `}</style>
    </div>
  );
}
export default CompanyDetails;