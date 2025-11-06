import React, { useState, useEffect } from "react";
import axios from 'axios';

const PrintSettingsPage = () => {
  const [formData, setFormData] = useState({
    restaurantName: "",
    street: "",
    city: "",
    pincode: "",
    phone: "",
    gstin: "",
    thankYouMessage: "",
    poweredBy: "",
  });
  const [settingsList, setSettingsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showList, setShowList] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [baseUrl, setBaseUrl] = useState("");

  // Fetch logo for preview
  const fetchLogo = async (currentBaseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/logo`);
      if (response.data.logo) {
        setLogoUrl(currentBaseUrl + response.data.logo);
      }
    } catch (err) {
      console.error("Failed to fetch logo for preview:", err);
    }
  };

  // Fetch all print settings
  const fetchAllSettings = async () => {
    const currentBaseUrl = baseUrl || 'http://localhost:8000';
    setLoading(true);
    try {
      const response = await fetch(`${currentBaseUrl}/api/print_settings`);
      if (!response.ok) {
        throw new Error(`Failed to fetch print settings: ${response.statusText}`);
      }
      const data = await response.json();
      setSettingsList(data);
      const activeSetting = data.find(setting => setting.active);
      if (activeSetting) {
        setSelectedId(activeSetting._id);
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a single setting for editing
  const fetchSetting = async (id) => {
    const currentBaseUrl = baseUrl || 'http://localhost:8000';
    setLoading(true);
    try {
      const response = await fetch(`${currentBaseUrl}/api/print_settings/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch print setting: ${response.statusText}`);
      }
      const data = await response.json();
      setFormData(data);
      setEditId(id);
      setShowForm(true);
      setShowList(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentBaseUrl = baseUrl || 'http://localhost:8000';
    setLoading(true);
    setMessage(null);
    try {
      let url = `${currentBaseUrl}/api/print_settings`;
      let method = "POST";
      if (editId) {
        url = `${currentBaseUrl}/api/print_settings/${editId}`;
        method = "PUT";
      }
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error(`Failed to save print settings: ${response.statusText}`);
      }
      const result = await response.json();
      setMessage({ type: 'success', text: result.message });
      resetForm();
      fetchAllSettings();
      setShowList(true);
      setShowForm(false);
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this setting?")) return;
    const currentBaseUrl = baseUrl || 'http://localhost:8000';
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${currentBaseUrl}/api/print_settings/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete print settings: ${response.statusText}`);
      }
      const result = await response.json();
      setMessage({ type: 'success', text: result.message });
      fetchAllSettings();
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleUse = async () => {
    const currentBaseUrl = baseUrl || 'http://localhost:8000';
    setLoading(true);
    setMessage(null);
    try {
      if (selectedId) {
        const response = await fetch(`${currentBaseUrl}/api/print_settings/set_active/${selectedId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to set active print setting: ${response.statusText}`);
        }
        const result = await response.json();
        setMessage({ type: 'success', text: result.message });
      } else {
        const response = await fetch(`${currentBaseUrl}/api/print_settings/deactivate_all`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to deactivate print settings: ${response.statusText}`);
        }
        const result = await response.json();
        setMessage({ type: 'success', text: result.message });
      }
      fetchAllSettings();
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      restaurantName: "",
      street: "",
      city: "",
      pincode: "",
      phone: "",
      gstin: "",
      thankYouMessage: "",
      poweredBy: "",
    });
    setEditId(null);
  };

  const toggleToList = () => {
    fetchAllSettings();
    setShowList(true);
    setShowForm(false);
  };

  const toggleToForm = () => {
    resetForm();
    setShowList(false);
    setShowForm(true);
  };

  const handleBack = () => {
    if (showList) {
      toggleToForm();
    } else {
      window.history.back();
    }
  };

  // Fetch config and set baseUrl
  const fetchConfig = async () => {
    let currentBaseUrl = 'http://localhost:8000'; // Default fallback
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
      // Use currentBaseUrl for initial fetchLogo
      fetchLogo(currentBaseUrl);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '24px' }}>Loading...</div>;
  }
  if (error) {
    return <div style={{ textAlign: 'center', padding: '24px', color: 'red' }}>Error: {error}</div>;
  }
  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', borderRadius: '8px' }}>
      <div style={{ marginBottom: '16px', textAlign: 'left' }}>
        <button
          onClick={handleBack}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: '500',
            color: '#ffffff',
            backgroundColor: '#6b7280',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          Back
        </button>
      </div>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center' }}>Print Settings</h1>
    
      {message && (
        <div style={{
          padding: '12px',
          marginBottom: '16px',
          borderRadius: '4px',
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          textAlign: 'center',
          fontSize: '16px'
        }}>
          {message.text}
        </div>
      )}
      {showForm && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #3498db',
            borderRadius: '8px',
            padding: '24px',
            width: '100%',
            maxWidth: '800px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="restaurantName" style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#000000' }}>
                  Restaurant Name:
                </label>
                <input
                  type="text"
                  id="restaurantName"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  style={{
                    marginTop: '4px',
                    display: 'block',
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #3498db',
                    borderRadius: '20px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
              <div>
                <label htmlFor="street" style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#000000' }}>
                  Street:
                </label>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  style={{
                    marginTop: '4px',
                    display: 'block',
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #3498db',
                    borderRadius: '20px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
              <div>
                <label htmlFor="city" style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#000000' }}>
                  City:
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  style={{
                    marginTop: '4px',
                    display: 'block',
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #3498db',
                    borderRadius: '20px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
              <div>
                <label htmlFor="pincode" style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#000000' }}>
                  Pincode:
                </label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  style={{
                    marginTop: '4px',
                    display: 'block',
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #3498db',
                    borderRadius: '20px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#000000' }}>
                  Phone:
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{
                    marginTop: '4px',
                    display: 'block',
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #3498db',
                    borderRadius: '20px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
              <div>
                <label htmlFor="gstin" style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#000000' }}>
                  GSTIN:
                </label>
                <input
                  type="text"
                  id="gstin"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  style={{
                    marginTop: '4px',
                    display: 'block',
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #3498db',
                    borderRadius: '20px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
              <div>
                <label htmlFor="thankYouMessage" style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#000000' }}>
                  Thank You Message:
                </label>
                <input
                  type="text"
                  id="thankYouMessage"
                  name="thankYouMessage"
                  value={formData.thankYouMessage}
                  onChange={handleChange}
                  style={{
                    marginTop: '4px',
                    display: 'block',
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #3498db',
                    borderRadius: '20px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
              <div>
                <label htmlFor="poweredBy" style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#000000' }}>
                  Powered By:
                </label>
                <input
                  type="text"
                  id="poweredBy"
                  name="poweredBy"
                  value={formData.poweredBy}
                  onChange={handleChange}
                  style={{
                    marginTop: '4px',
                    display: 'block',
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #3498db',
                    borderRadius: '20px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
              <div style={{ gridColumn: 'span 2', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 18px',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#ffffff',
                    backgroundColor: '#4f46e5',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {editId ? "Update Settings" : "Save Settings"}
                </button>
                <button
                  type="button"
                  onClick={toggleToList}
                  style={{
                    padding: '10px 18px',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#ffffff',
                    backgroundColor: '#10b981',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  View List
                </button>
              </div>
            </form>
          </div>
          <div style={{
            width: '400px',
            padding: '16px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid #3498db'
          }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>Print Preview</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Logo on the left */}
                {logoUrl && (
                  <div style={{ flex: '0 0 auto' }}>
                    <img
                      src={logoUrl}
                      alt="Logo"
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'contain',
                        borderRadius: '5px'
                      }}
                    />
                  </div>
                )}
                {/* Restaurant details on the right */}
                <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '16px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{formData.restaurantName || 'Restaurant Name'}</div>
                  <div>
                    {formData.street && formData.city
                      ? `${formData.street}, ${formData.city} ${formData.pincode ? `, ${formData.pincode}` : ''}`
                      : `${formData.street || ''} ${formData.city || ''} ${formData.pincode ? `, ${formData.pincode}` : ''}`}
                  </div>
                  <div style={{ margin: '4px 0' }}>Phone: {formData.phone || 'Phone Number'}</div>
                  <div>GSTIN: {formData.gstin || 'GSTIN Number'}</div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ textAlign: 'center', marginTop: '16px', fontWeight: 'bold', fontSize: '16px' }}>{formData.thankYouMessage || 'Thank You Message'}</div>
              <div style={{ textAlign: 'center', fontSize: '14px', marginTop: '8px' }}>Powered by {formData.poweredBy || 'Your Brand'}</div>
            </div>
          </div>
        </div>
      )}
      {showList && (
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={toggleToForm}
              style={{
                padding: '10px 18px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#ffffff',
                backgroundColor: '#3b82f6',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              Create New
            </button>
            <button
              type="button"
              onClick={handleUse}
              style={{
                padding: '10px 18px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#000000',
                backgroundColor: '#ffcc00',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              {selectedId ? 'Use Selected' : 'Use Default'}
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>No.</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}></th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Restaurant Name</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Street</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>City</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Pincode</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Phone</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>GSTIN</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Thank You Message</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Powered By</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {settingsList.map((setting, index) => (
                <tr key={setting._id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: setting.active ? '#d4edda' : undefined }}>
                  <td style={{ padding: '16px 24px', fontSize: '16px', color: '#111827', backgroundColor: '#f9fafb', whiteSpace: 'nowrap' }}>{index + 1}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    <input
                      type="radio"
                      checked={selectedId === setting._id}
                      onChange={() => selectedId === setting._id ? setSelectedId(null) : setSelectedId(setting._id)}
                    />
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '16px', color: '#111827', backgroundColor: '#f9fafb', whiteSpace: 'nowrap' }}>{setting.restaurantName}</td>
                  <td style={{ padding: '16px 24px', fontSize: '16px', color: '#111827', backgroundColor: '#f9fafb', whiteSpace: 'nowrap' }}>{setting.street}</td>
                  <td style={{ padding: '16px 24px', fontSize: '16px', color: '#111827', backgroundColor: '#f9fafb', whiteSpace: 'nowrap' }}>{setting.city}</td>
                  <td style={{ padding: '16px 24px', fontSize: '16px', color: '#111827', backgroundColor: '#f9fafb', whiteSpace: 'nowrap' }}>{setting.pincode}</td>
                  <td style={{ padding: '16px 24px', fontSize: '16px', color: '#111827', backgroundColor: '#f9fafb', whiteSpace: 'nowrap' }}>{setting.phone}</td>
                  <td style={{ padding: '16px 24px', fontSize: '16px', color: '#111827', backgroundColor: '#f9fafb', whiteSpace: 'nowrap' }}>{setting.gstin}</td>
                  <td style={{ padding: '16px 24px', fontSize: '16px', color: '#111827', backgroundColor: '#f9fafb', whiteSpace: 'nowrap' }}>{setting.thankYouMessage}</td>
                  <td style={{ padding: '16px 24px', fontSize: '16px', color: '#111827', backgroundColor: '#f9fafb', whiteSpace: 'nowrap' }}>{setting.poweredBy}</td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '16px' }}>
                    <button
                      onClick={() => fetchSetting(setting._id)}
                      style={{
                        padding: '6px 14px',
                        color: '#ffffff',
                        backgroundColor: '#4f46e5',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '8px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        fontSize: '16px'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(setting._id)}
                      style={{
                        padding: '6px 14px',
                        color: '#ffffff',
                        backgroundColor: '#ef4444',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        fontSize: '16px'
                      }}
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
    </div>
  );
};

export default PrintSettingsPage;