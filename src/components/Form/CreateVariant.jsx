import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import axios from 'axios';
import { FaArrowLeft, FaTrash } from 'react-icons/fa'; // Import FaArrowLeft for back button and FaTrash for delete
const CreateVariant = () => {
  const [variantName, setVariantName] = useState('');
  const [types, setTypes] = useState([]);
  const [newType, setNewType] = useState('');
  const [prices, setPrices] = useState({});
  const [images, setImages] = useState({});
  const [activeSection, setActiveSection] = useState(null);
  const [variants, setVariants] = useState([]);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [showList, setShowList] = useState(false);
  const [warning, setWarning] = useState(null);
  const [loading, setLoading] = useState(true); // NEW: Loading state for initial fetch
  const [error, setError] = useState(null); // NEW: Error state for network/config issues
  const [showConfirm, setShowConfirm] = useState(false); // NEW: Confirmation dialog state
  const [confirmVariant, setConfirmVariant] = useState(null); // NEW: Variant to confirm delete
  const navigate = useNavigate(); // Initialize useNavigate hook
  const [baseUrl, setBaseUrl] = useState(""); // NEW: baseUrl state like in AdminPage
  // NEW: Fetch config to determine baseUrl (same logic as AdminPage)
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
        setError("Failed to connect to server. Using local mode.");
      } finally {
        setLoading(false);
        // If not loading, fetch variants after config
        if (!currentBaseUrl) {
          fetchVariants("");
        }
      }
    };
    fetchConfig();
  }, []);
  // Clear warning after 3 seconds
  useEffect(() => {
    if (warning) {
      const timer = setTimeout(() => setWarning(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [warning]);
  // UPDATED: Fetch all variants for the list (use baseUrl)
  const fetchVariants = async (currentBaseUrl) => {
    try {
      const apiUrl = currentBaseUrl || 'http://localhost:8000';
      const response = await axios.get(`${apiUrl}/api/variants`);
      setVariants(response.data);
    } catch (error) {
      setWarning({ type: 'error', message: 'Failed to fetch variants' });
      console.error('Error fetching variants:', error);
    }
  };
  // UPDATED: Fetch a specific variant for editing (use baseUrl)
  const fetchVariant = async (id, currentBaseUrl) => {
    try {
      const apiUrl = currentBaseUrl || 'http://localhost:8000';
      const response = await axios.get(`${apiUrl}/api/variants/${id}`);
      const variant = response.data;
      setVariantName(variant.heading);
      setTypes(variant.subheadings.map((sub) => sub.name));
      setPrices(
        variant.subheadings.reduce((acc, sub) => ({
          ...acc,
          [sub.name]: sub.price || '',
        }), {})
      );
      setImages(
        variant.subheadings.reduce((acc, sub) => ({
          ...acc,
          [sub.name]: sub.image || '',
        }), {})
      );
      setActiveSection(variant.activeSection || 'price');
      setEditingVariantId(id);
      setShowList(false);
    } catch (error) {
      setWarning({ type: 'error', message: 'Failed to fetch variant' });
      console.error('Error fetching variant:', error);
    }
  };
  // UPDATED: Handle delete variant - Show confirmation dialog instead of window.confirm
  const handleDeleteVariant = (id, heading) => {
    setConfirmVariant({ id, heading });
    setShowConfirm(true);
  };
  // NEW: Confirm delete action
  const confirmDelete = async () => {
    if (!confirmVariant) return;
    try {
      const apiUrl = baseUrl || 'http://localhost:8000';
      await axios.delete(`${apiUrl}/api/variants/${confirmVariant.id}`);
      setWarning({ type: 'success', message: 'Variant deleted successfully' });
      // If editing this variant, reset form
      if (editingVariantId === confirmVariant.id) {
        resetForm();
      }
      fetchVariants(baseUrl); // Re-fetch after delete
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to delete variant';
      setWarning({ type: 'error', message: errorMsg });
      console.error('Error deleting variant:', error);
    } finally {
      setShowConfirm(false);
      setConfirmVariant(null);
    }
  };
  // NEW: Cancel delete
  const cancelDelete = () => {
    setShowConfirm(false);
    setConfirmVariant(null);
  };
  // NEW: Helper to reset form
  const resetForm = () => {
    setVariantName('');
    setTypes([]);
    setNewType('');
    setPrices({});
    setImages({});
    setActiveSection(null);
    setEditingVariantId(null);
  };
  // UPDATED: Handle saving variant (use baseUrl)
  const handleSave = async () => {
    try {
      if (!variantName.trim()) {
        setWarning({ type: 'error', message: 'Variant name is required' });
        return;
      }
      if (types.length === 0) {
        setWarning({ type: 'error', message: 'At least one type is required' });
        return;
      }
      const variantData = {
        heading: variantName,
        subheadings: types.map((type) => {
          const subheading = { name: type };
          if (activeSection === 'price' || activeSection === 'priceAndImage') {
            subheading.price = prices[type] ? parseFloat(prices[type]) : null;
          }
          if (activeSection === 'priceAndImage') {
            subheading.image = images[type] || null;
          }
          if (activeSection === 'dropdown') {
            subheading.dropdown = true;
          }
          return subheading;
        }),
        activeSection,
      };
      const apiUrl = baseUrl || 'http://localhost:8000';
      if (editingVariantId) {
        await axios.put(`${apiUrl}/api/variants/${editingVariantId}`, variantData);
        setWarning({ type: 'success', message: 'Variant updated successfully' });
      } else {
        await axios.delete(`${apiUrl}/api/variants/heading/${variantName}`);
        await axios.post(`${apiUrl}/api/variants`, variantData);
        setWarning({ type: 'success', message: 'Variant saved successfully' });
      }
      resetForm();
      fetchVariants(baseUrl); // Re-fetch after save
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to save variant';
      setWarning({ type: 'error', message: errorMsg });
      console.error('Error saving variant:', error);
    }
  };
  // Handle adding a new type
  const handleAddType = () => {
    if (newType.trim() && !types.includes(newType.trim())) {
      setTypes([...types, newType.trim()]);
      setNewType('');
    }
  };
  // Handle price input for a specific type
  const handlePriceChange = (type, value) => {
    setPrices({ ...prices, [type]: value });
  };
  // Handle image upload for a specific type
  const handleImageUpload = (type, event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImages({ ...images, [type]: imageUrl });
    }
  };
  // Render price fields
  const renderPriceFields = () => {
    return types.map((type) => (
      <div key={type} style={{
        marginBottom: '15px'
      }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: '600',
          fontSize: '0.95rem',
          color: '#2c3e50'
        }}>{`${type} Price`}</label>
        <input
          type="number"
          value={prices[type] || ''}
          onChange={(e) => handlePriceChange(type, e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #3498db',
            borderRadius: '10px',
            fontSize: '1rem',
            outline: 'none',
            background: '#f8f9fa'
          }}
          placeholder="Enter price"
        />
      </div>
    ));
  };
  // Render price and image fields together
  const renderPriceAndImageFields = () => {
    return types.map((type) => (
      <div key={type} style={{
        marginBottom: '15px'
      }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: '600',
          fontSize: '0.95rem',
          color: '#2c3e50'
        }}>{`${type} Price`}</label>
        <input
          type="number"
          value={prices[type] || ''}
          onChange={(e) => handlePriceChange(type, e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #3498db',
            borderRadius: '10px',
            fontSize: '1rem',
            outline: 'none',
            background: '#f8f9fa',
            marginBottom: '10px'
          }}
          placeholder="Enter price"
        />
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: '600',
          fontSize: '0.95rem',
          color: '#2c3e50'
        }}>{`${type} Image`}</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(type, e)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #3498db',
            borderRadius: '10px',
            fontSize: '1rem',
            outline: 'none',
            background: '#f8f9fa',
            marginBottom: '10px'
          }}
        />
        {images[type] && (
          <img
            src={images[type]}
            alt={`${type} preview`}
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '10px',
              marginTop: '10px'
            }}
          />
        )}
      </div>
    ));
  };
  // Render dropdown
  const renderDropdown = () => {
    return (
      <div style={{
        marginBottom: '15px'
      }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: '600',
          fontSize: '0.95rem',
          color: '#2c3e50'
        }}>Select Type</label>
        <select style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #3498db',
          borderRadius: '10px',
          fontSize: '1rem',
          outline: 'none',
          background: '#f8f9fa',
          color: '#2c3e50'
        }}>
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
    );
  };
  // Handle button clicks to toggle sections
  const handleShowSection = (section) => {
    setActiveSection(section);
  };
  // UPDATED: Toggle variant list visibility (fetch with baseUrl)
  const handleShowList = () => {
    setShowList(!showList);
    if (!showList) fetchVariants(baseUrl);
  };
  // Handle back navigation
  const handleBack = () => {
    navigate('/admin'); // Adjust the path as needed (e.g., '/dashboard')
  };
  // UPDATED: If loading, show loader; if error, show error
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
          Loading configuration...
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
        padding: '20px',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '1250px',
          margin: '80px auto 20px',
          backgroundColor: '#ffffff',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
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
            {error}
          </div>
          <button
            onClick={handleBack}
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
              transition: 'all 0.3s ease',
              margin: '0 auto'
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
            ← Back
          </button>
        </div>
      </div>
    );
  }
  // NEW: Confirmation Dialog Overlay
  if (showConfirm && confirmVariant) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center'
        }}>
          <h3 style={{
            color: '#c0392b',
            marginBottom: '15px',
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            Confirm Delete
          </h3>
          <p style={{
            color: '#2c3e50',
            marginBottom: '25px',
            lineHeight: '1.5'
          }}>
            Are you sure you want to delete the variant "{confirmVariant.heading}"? This action cannot be undone.
          </p>
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center'
          }}>
            <button
              onClick={confirmDelete}
              style={{
                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                padding: '12px 25px',
                borderRadius: '50px',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 8px rgba(231, 76, 60, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(231, 76, 60, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(231, 76, 60, 0.3)';
              }}
            >
              Yes, Delete
            </button>
            <button
              onClick={cancelDelete}
              style={{
                background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                padding: '12px 25px',
                borderRadius: '50px',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 8px rgba(149, 165, 166, 0.3)',
                transition: 'all 0.3s ease'
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
        onClick={handleBack}
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
        maxWidth: '1250px',
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
            Create Variant
          </h2>
          <div></div> {/* Empty right for balance */}
        </div>
        {/* Warning Message - Styled like EmployeeList Alerts */}
        {warning && (
          <div style={{
            background: warning.type === 'success' ? 'linear-gradient(135deg, #d4edda 0%, #c8e6c9 100%)' : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            color: warning.type === 'success' ? '#155724' : '#c0392b',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            border: `1px solid ${warning.type === 'success' ? '#28a745' : '#e74c3c'}`,
            boxShadow: `0 2px 4px rgba(${warning.type === 'success' ? '40, 167, 69' : '231, 76, 60'}, 0.2)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            {warning.message}
          </div>
        )}
        {/* Variant Name Input */}
        <div style={{
          marginBottom: '20px'
        }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            fontSize: '0.95rem',
            color: '#2c3e50'
          }}>Variant Name</label>
          <input
            type="text"
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #3498db',
              borderRadius: '10px',
              fontSize: '1rem',
              outline: 'none',
              background: '#f8f9fa'
            }}
            placeholder="e.g., Size"
          />
        </div>
        {/* Type Input */}
        <div style={{
          marginBottom: '20px'
        }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            fontSize: '0.95rem',
            color: '#2c3e50'
          }}>Add Type</label>
          <div style={{
            display: 'flex',
            gap: '10px'
          }}>
            <input
              type="text"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #3498db',
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none',
                background: '#f8f9fa'
              }}
              placeholder="e.g., Small, Medium, Large"
            />
            <button
              onClick={handleAddType}
              style={{
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                padding: '10px 20px',
                borderRadius: '10px',
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
              Add Type
            </button>
          </div>
        </div>
        {/* Display Added Types */}
        {types.length > 0 && (
          <div style={{
            marginBottom: '20px',
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '10px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{
              margin: '0 0 10px 0',
              color: '#2c3e50',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}>Added Types:</h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              {types.map((type) => (
                <li key={type} style={{
                  background: '#3498db',
                  color: '#ffffff',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.9rem'
                }}>{type}</li>
              ))}
            </ul>
          </div>
        )}
        {/* Action Buttons - Styled like EmployeeList */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '30px'
        }}>
          <button
            onClick={() => handleShowSection('price')}
            style={{
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
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
          >
            Add Price
          </button>
          <button
            onClick={() => handleShowSection('priceAndImage')}
            style={{
              background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
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
          >
            Add Image
          </button>
          <button
            onClick={() => handleShowSection('dropdown')}
            style={{
              background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              padding: '10px 20px',
              borderRadius: '50px',
              fontSize: '1rem',
              fontWeight: '600',
              boxShadow: '0 4px 8px rgba(243, 156, 18, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 12px rgba(243, 156, 18, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 8px rgba(243, 156, 18, 0.3)';
            }}
          >
            Add Dropdown
          </button>
          <button
            onClick={handleSave}
            style={{
              background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
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
          >
            {editingVariantId ? 'Update' : 'Save'} ✓
          </button>
          <button
            onClick={handleShowList}
            style={{
              background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              padding: '10px 20px',
              borderRadius: '50px',
              fontSize: '1rem',
              fontWeight: '600',
              boxShadow: '0 4px 8px rgba(149, 165, 166, 0.3)',
              transition: 'all 0.3s ease'
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
            {showList ? 'Hide List' : 'List'}
          </button>
        </div>
        {/* Conditionally Render Sections */}
        {types.length > 0 && activeSection === 'price' && (
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #e9ecef'
          }}>
            {renderPriceFields()}
          </div>
        )}
        {types.length > 0 && activeSection === 'priceAndImage' && (
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #e9ecef'
          }}>
            {renderPriceAndImageFields()}
          </div>
        )}
        {types.length > 0 && activeSection === 'dropdown' && (
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #e9ecef'
          }}>
            {renderDropdown()}
          </div>
        )}
        {/* Variant List - UPDATED with Delete Button */}
        {showList && (
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #e9ecef',
            marginTop: '20px'
          }}>
            <h3 style={{
              margin: '0 0 15px 0',
              color: '#2c3e50',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}>Variants:</h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {variants.map((variant) => (
                <li key={variant._id} style={{
                  background: '#ffffff',
                  color: '#2c3e50',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #e9ecef',
                  transition: 'all 0.2s ease',
                  fontWeight: '500',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div
                    onClick={() => fetchVariant(variant._id, baseUrl)}
                    style={{
                      flex: 1,
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.parentElement.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                      e.currentTarget.parentElement.style.borderColor = '#3498db';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.parentElement.style.backgroundColor = '#ffffff';
                      e.currentTarget.parentElement.style.borderColor = '#e9ecef';
                    }}
                  >
                    {variant.heading}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVariant(variant._id, variant.heading);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      boxShadow: '0 2px 4px rgba(231, 76, 60, 0.3)',
                      transition: 'all 0.3s ease',
                      marginLeft: '10px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 8px rgba(231, 76, 60, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 4px rgba(231, 76, 60, 0.3)';
                    }}
                  >
                    <FaTrash /> Delete
                  </button>
                </li>
              ))}
            </ul>
            {variants.length === 0 && (
              <p style={{ textAlign: 'center', color: '#7f8c8d', fontStyle: 'italic', marginTop: '10px' }}>
                No variants found.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default CreateVariant;