import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaBuilding, FaPlus } from 'react-icons/fa';

function CompanyDetails() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    businessType: '',
    otherBusinessType: '',
    gstNumber: '',
    fssaiNumber: '',
    panNumber: '',
    addresses: [{ addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: '' }],
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
  const [activeSection, setActiveSection] = useState('basic');
  const [savedDetails, setSavedDetails] = useState(null);

  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  const fetchCompanyDetails = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/company-details');
      if (response.data.companyDetails && response.data.companyDetails.length > 0) {
        const latestDetails = response.data.companyDetails[response.data.companyDetails.length - 1];
        setSavedDetails(latestDetails);
        setFormData(latestDetails); // Pre-fill form with the latest data
        console.log('Fetched details:', latestDetails); // Debug log
      } else {
        setError('No company details found.');
      }
    } catch (err) {
      setError('Failed to fetch company details: ' + err.message);
      console.error('Fetch error:', err);
    }
  };

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
      addresses: [...prev.addresses, { addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: '' }],
    }));
  };

  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [...prev.contacts, { phoneNumber: '', whatsappNumber: '', emailAddress: '', website: '' }],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setMessage('');
      console.log('Submitting form data:', formData); // Debug log
      const response = await axios.post('http://localhost:8000/api/company-details', formData);
      setMessage('Company details saved successfully!');
      setSavedDetails(response.data.companyDetails); // Update with the saved data
      console.log('Saved details:', response.data.companyDetails); // Debug log
      await fetchCompanyDetails(); // Refresh the displayed details
    } catch (err) {
      setError('Failed to save company details: ' + err.message);
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

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
          <title>Company Details</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #2c3e50; font-size: 24px; }
            h3 { text-align: center; color: #2c3e50; margin-top: 20px; font-size: 18px; }
            .section { margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; }
            .column { width: 48%; }
            .field { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .label { font-weight: bold; width: 40%; text-align: right; padding-right: 10px; }
            .centered-label { font-weight: bold; width: 40%; text-align: center; padding-right: 10px; }
            .value { width: 60%; text-align: left; }
            .owner-name { width: 60%; text-align: left; }
            hr { border: 0; border-top: 1px solid #2c3e50; margin: 20px 0; }
            .footer { text-align: center; font-weight: bold; color: #2c3e50; }
          </style>
        </head>
        <body>
          <h1>Company Details Application</h1>
          <div class="section">
            <h3>Basic Information</h3>
            <div class="row">
              <div class="column">
                <div class="field"><span class="label">Restaurant Name:</span><span class="value">${savedDetails.restaurantName || 'N/A'}</span></div>
                <div class="field"><span class="label">Business Type:</span><span class="value">${savedDetails.businessType || 'N/A'}${savedDetails.businessType === 'Other' ? ` (${savedDetails.otherBusinessType || 'N/A'})` : ''}</span></div>
                <div class="field"><span class="label">FSSAI Number:</span><span class="value">${savedDetails.fssaiNumber || 'N/A'}</span></div>
              </div>
              <div class="column">
                <div class="field"><span class="label">Owner/Manager Name:</span><span class="owner-name">${savedDetails.ownerName || 'N/A'}</span></div>
                <div class="field"><span class="label">GST Number:</span><span class="value">${savedDetails.gstNumber || 'N/A'}</span></div>
                <div class="field"><span class="label">PAN Number:</span><span class="value">${savedDetails.panNumber || 'N/A'}</span></div>
              </div>
            </div>
          </div>
          <div class="section">
            <h3>Address Details</h3>
            ${savedDetails.addresses && savedDetails.addresses.length > 0 ? savedDetails.addresses.map((address, index) => `
              <div class="row">
                <div class="column">
                  <div class="field"><span class="centered-label">Address ${index + 1}:</span><span class="value"></span></div>
                  <div class="field"><span class="label">Line 1:</span><span class="value">${address.addressLine1 || 'N/A'}</span></div>
                  <div class="field"><span class="label">City:</span><span class="value">${address.city || 'N/A'}</span></div>
                  <div class="field"><span class="label">Pincode:</span><span class="value">${address.pincode || 'N/A'}</span></div>
                </div>
                <div class="column">
                  <div class="field"><span class="label"></span><span class="value"></span></div>
                  <div class="field"><span class="label">Line 2:</span><span class="value">${address.addressLine2 || 'N/A'}</span></div>
                  <div class="field"><span class="label">State:</span><span class="value">${address.state || 'N/A'}</span></div>
                  <div class="field"><span class="label">Country:</span><span class="value">${address.country || 'N/A'}</span></div>
                </div>
              </div>
            `).join('') : '<div class="row"><div class="column"><div class="field"><span class="centered-label">No addresses available.</span><span class="value"></span></div></div></div>'}
          </div>
          <div class="section">
            <h3>Contact Details</h3>
            ${savedDetails.contacts && savedDetails.contacts.length > 0 ? savedDetails.contacts.map((contact, index) => `
              <div class="row">
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
            <h3>Payment Information</h3>
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
          <hr />
          <div class="footer">Company Name: ${savedDetails.restaurantName || 'N/A'}</div>
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
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: '#3498db', padding: '10px', borderRadius: '10px' }}>
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
            Payment Information
          </button>
        </div>
        <div style={{ display: 'grid', gap: '20px' }}>
          {activeSection === 'details' && (
            <div>
              <h3 style={{ color: '#2c3e50', fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>Saved Company Details</h3>
              {savedDetails ? (
                <div style={{ display: 'grid', gap: '15px' }}>
                  <div className="section">
                    <h4 style={{ color: '#2c3e50', fontSize: '1.2rem', textAlign: 'center' }}>Basic Information</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ width: '48%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>Restaurant Name:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.restaurantName || 'N/A'}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>Business Type:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.businessType || 'N/A'}{savedDetails.businessType === 'Other' ? ` (${savedDetails.otherBusinessType || 'N/A'})` : ''}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>FSSAI Number:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.fssaiNumber || 'N/A'}</span></div>
                      </div>
                      <div style={{ width: '48%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>Owner/Manager Name:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.ownerName || 'N/A'}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>GST Number:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.gstNumber || 'N/A'}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>PAN Number:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.panNumber || 'N/A'}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="section">
                    <h4 style={{ color: '#2c3e50', fontSize: '1.2rem', textAlign: 'center' }}>Address Details</h4>
                    {savedDetails.addresses && savedDetails.addresses.length > 0 ? savedDetails.addresses.map((address, index) => (
                      <div key={index} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div style={{ width: '48%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'center', paddingRight: '10px' }}>Address {index + 1}:</strong> <span style={{ width: '60%', textAlign: 'left' }}></span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>Line 1:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{address.addressLine1 || 'N/A'}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>City:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{address.city || 'N/A'}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>Pincode:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{address.pincode || 'N/A'}</span></div>
                          </div>
                          <div style={{ width: '48%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}></strong> <span style={{ width: '60%', textAlign: 'left' }}></span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>Line 2:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{address.addressLine2 || 'N/A'}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>State:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{address.state || 'N/A'}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>Country:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{address.country || 'N/A'}</span></div>
                          </div>
                        </div>
                      </div>
                    )) : <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'center', paddingRight: '10px' }}>No addresses available.</strong> <span style={{ width: '60%', textAlign: 'left' }}></span></div>}
                  </div>
                  <div className="section">
                    <h4 style={{ color: '#2c3e50', fontSize: '1.2rem', textAlign: 'center' }}>Contact Details</h4>
                    {savedDetails.contacts && savedDetails.contacts.length > 0 ? savedDetails.contacts.map((contact, index) => (
                      <div key={index} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div style={{ width: '48%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'center', paddingRight: '10px' }}>Contact {index + 1}:</strong> <span style={{ width: '60%', textAlign: 'left' }}></span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>Phone Number:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{contact.phoneNumber || 'N/A'}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>Email Address:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{contact.emailAddress || 'N/A'}</span></div>
                          </div>
                          <div style={{ width: '48%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}></strong> <span style={{ width: '60%', textAlign: 'left' }}></span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>WhatsApp Number:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{contact.whatsappNumber || 'N/A'}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>Website:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{contact.website || 'N/A'}</span></div>
                          </div>
                        </div>
                      </div>
                    )) : <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'center', paddingRight: '10px' }}>No contacts available.</strong> <span style={{ width: '60%', textAlign: 'left' }}></span></div>}
                  </div>
                  <div className="section">
                    <h4 style={{ color: '#2c3e50', fontSize: '1.2rem', textAlign: 'center' }}>Payment Information</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ width: '48%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>Bank Name:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.bankName || 'N/A'}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>Account Number:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.accountNumber || 'N/A'}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>UPI ID:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.upiId || 'N/A'}</span></div>
                      </div>
                      <div style={{ width: '48%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>Account Holder Name:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.accountHolderName || 'N/A'}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>IFSC Code:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.ifscCode || 'N/A'}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ width: '40%', textAlign: 'right', paddingRight: '10px' }}>Currency Type:</strong> <span style={{ width: '60%', textAlign: 'left' }}>{savedDetails.currencyType || 'N/A'}</span></div>
                      </div>
                    </div>
                  </div>
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
                <p>No saved details available.</p>
              )}
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
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  placeholder="GST Number (optional)"
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
          {activeSection === 'address' && (
            <div>
              <h3 style={{ color: '#2c3e50', fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>Address Details</h3>
              {formData.addresses.map((address, index) => (
                <div key={index} style={{ display: 'grid', gap: '15px', marginBottom: '15px' }}>
                  <input
                    type="text"
                    name="addressLine1"
                    value={address.addressLine1}
                    onChange={(e) => handleAddressChange(index, e)}
                    placeholder="Address Line 1"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                  <input
                    type="text"
                    name="addressLine2"
                    value={address.addressLine2}
                    onChange={(e) => handleAddressChange(index, e)}
                    placeholder="Address Line 2 (optional)"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={(e) => handleAddressChange(index, e)}
                    placeholder="City"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                  <input
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={(e) => handleAddressChange(index, e)}
                    placeholder="State"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                  <input
                    type="text"
                    name="pincode"
                    value={address.pincode}
                    onChange={(e) => handleAddressChange(index, e)}
                    placeholder="Pincode"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                  <input
                    type="text"
                    name="country"
                    value={address.country}
                    onChange={(e) => handleAddressChange(index, e)}
                    placeholder="Country"
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
                <div key={index} style={{ display: 'grid', gap: '15px', marginBottom: '15px' }}>
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
              <h3 style={{ color: '#2c3e50', fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>Payment Information (Optional)</h3>
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
                  placeholder="Currency Type"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
              </div>
            </div>
          )}
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
    </div>
  );
}

export default CompanyDetails;