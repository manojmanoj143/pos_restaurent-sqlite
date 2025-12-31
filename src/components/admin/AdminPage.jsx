// src/components/admin/AdminPage.jsx
// FULLY UPDATED: Added Vehicle Management to Employee submenu (direct child, alongside Designations, Types, and Departments).
// Used FaCar icon for Vehicle Management.
// All previous features preserved, including Salary Management submenu, Leave Management, etc.
// Paths are root-level, no /admin prefix.
// All icons imported, including new FaCar for Vehicles.
// All submenus preserved.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaHome,
  FaMoneyBill,
  FaFileAlt,
  FaChartBar,
  FaDatabase,
  FaCog,
  FaUsers,
  FaBox,
  FaPlusCircle,
  FaTable,
  FaUtensils,
  FaLayerGroup,
  FaUserTie,
  FaEnvelope,
  FaShoppingCart,
  FaSearch,
  FaPrint,
  FaGift,
  FaSignOutAlt,
  FaBuilding,
  FaCamera,
  FaTrash,
  FaChartLine, // For Sales menu
  FaFileInvoiceDollar, // For Sales Invoice
  FaEyeSlash, // For Hidden Items
  FaList, // For Employee List
  FaClock, // For Attendance
  FaBriefcase, // For Employee Designations (plural)
  FaIdCard, // For Employee Types (plural)
  FaCalendar, // For Schedule Master
  FaUserPlus, // For Schedule Assign Employee
  FaEye, // For View Attendance
  FaCreditCard, // For Leave Allocation
  FaPaperPlane, // For Leave Apply
  FaMoneyCheckAlt, // For Salary Management
  FaCar, // NEW: For Vehicle Management
} from 'react-icons/fa';
function AdminPage() {
  const navigate = useNavigate();
  const [customerCount, setCustomerCount] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [backupCount, setBackupCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMasterOpen, setIsMasterOpen] = useState(true);
  const [isCustomersOpen, setIsCustomersOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [isEmployeeAppOpen, setIsEmployeeAppOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false); // State for Sales menu
  const [isScheduleOpen, setIsScheduleOpen] = useState(false); // State for Schedule submenu under Employee
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false); // State for Attendance submenu under Employee
  const [isLeaveOpen, setIsLeaveOpen] = useState(false); // State for Leave Management submenu under Employee
  const [isSalaryOpen, setIsSalaryOpen] = useState(false); // State for Salary Management submenu under Employee
  const [importFile, setImportFile] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [baseUrl, setBaseUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // State for logout modal
  // Navigation handlers
  // Updated to show confirmation modal instead of immediate logout
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };
  // Handle confirmed logout
  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    navigate('/');
  };
  // Handle canceled logout
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };
  const handleNavigation = (path) => navigate(path);
  const toggleMasterMenu = () => setIsMasterOpen(!isMasterOpen);
  // Fetch logo
  const fetchLogo = async (currentBaseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/logo`);
      if (response.data.logo) {
        setLogoUrl(currentBaseUrl + response.data.logo);
      }
    } catch (err) {
      console.error("Failed to fetch logo:", err);
    }
  };
  // Handle logo upload
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file && allowedFile(file.name)) {
      setLogoFile(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      setMessage('');
      setError(null);
      console.log('Selected logo file:', file.name);
    } else {
      setLogoFile(null);
      setPreviewUrl(null);
      setError('Please select a valid image file (PNG, JPG, JPEG, GIF, WebP)');
    }
  };
  // Check allowed file types for logo
  const allowedFile = (filename) => {
    const allowed = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'jfif','ico'];
    return allowed.some(ext => filename.toLowerCase().endsWith(`.${ext}`));
  };
  // Upload logo
  const handleUploadLogo = async () => {
    if (!logoFile) {
      setError('Please select a logo file to upload');
      return;
    }
    const formData = new FormData();
    formData.append('logo', logoFile);
    try {
      setUploadingLogo(true);
      setMessage('');
      setError(null);
      console.log('Sending POST request to /api/upload-logo with file:', logoFile.name);
      const response = await axios.post(`${baseUrl}/api/upload-logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Logo upload successful. Response:', response.data);
      setMessage(response.data.message);
      setLogoFile(null);
      setPreviewUrl(null);
      // Ensure logo URL is prefixed with baseUrl
      setLogoUrl(baseUrl + response.data.logo.replace(baseUrl, ''));
      // Reset input
      document.getElementById('logo-input').value = '';
    } catch (err) {
      console.error('Logo upload failed:', err);
      setError(
        err.response?.data?.error ||
        `Failed to upload logo: ${err.message}`
      );
    } finally {
      setUploadingLogo(false);
    }
  };
  // Delete logo
  const handleDeleteLogo = async () => {
    // Removed window.confirm - no alert, direct action with message feedback
    try {
      const response = await axios.delete(`${baseUrl}/api/delete-logo`);
      console.log('Logo delete successful:', response.data);
      setMessage(response.data.message);
      setLogoUrl(null);
      setPreviewUrl(null);
      setLogoFile(null);
    } catch (err) {
      console.error('Logo delete failed:', err);
      setError(`Failed to delete logo: ${err.message}`);
    }
  };
  // Fetch dashboard counts
  const fetchCounts = async (currentBaseUrl) => {
    try {
      setLoading(true);
      const customerResponse = await axios.get(`${currentBaseUrl}/api/customers`);
      setCustomerCount(customerResponse.data.length);
      const itemResponse = await axios.get(`${currentBaseUrl}/api/items`);
      setItemCount(itemResponse.data.length);
      const backupResponse = await axios.get(`${currentBaseUrl}/api/backup-info`).catch(() => ({ data: [] }));
      setBackupCount(Math.min(backupResponse.data.length, 5));
    } catch (err) {
      setError(`Failed to fetch dashboard data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
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
        fetchCounts(currentBaseUrl);
        fetchLogo(currentBaseUrl);
      }
    };
    fetchConfig();
  }, []);
  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  // File import handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.json')) {
      setImportFile(file);
      setMessage('');
      setError(null);
      console.log('Selected file:', file.name);
    } else {
      setImportFile(null);
      setError('Please select a valid JSON file');
    }
  };
  const handleImportMongoDB = async () => {
    if (!importFile) {
      setError('Please select a JSON file to import');
      return;
    }
    const formData = new FormData();
    formData.append('file', importFile);
    try {
      setLoading(true);
      setMessage('');
      setError(null);
      console.log('Sending POST request to /api/import-mongodb with file:', importFile.name);
      const response = await axios.post(`${baseUrl}/api/import-mongodb`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });
      console.log('Import successful. Response:', response.data);
      setMessage(response.data.message);
      setImportFile(null);
      fetchCounts(baseUrl); // Re-fetch counts after import
    } catch (err) {
      console.error('Import request failed:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers,
      });
      setError(
        err.response?.data?.error ||
        `Failed to import data: ${err.response?.status || 'Unknown'} - ${err.response?.statusText || err.message}`
      );
    } finally {
      setLoading(false);
    }
  };
  // Search handler
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  // Menu items - Added Vehicle Management as direct child under Employee
  // All submenus preserved
  const masterMenuItems = [
    {
      icon: <FaUsers />,
      text: 'Customers',
      children: [
        { icon: <FaUsers />, text: 'View All Customers', path: '/customers' },
        { icon: <FaPlusCircle />, text: 'Create Customer', path: '/create-customer' },
        { icon: <FaUsers />, text: 'Create Customer Group', path: '/create-customer-group' },
      ],
    },
    {
      icon: <FaBox />,
      text: 'Items',
      children: [
        { icon: <FaBox />, text: 'View All Items', path: '/items' },
        { icon: <FaPlusCircle />, text: 'Add New Item', path: '/create-item' },
        { icon: <FaBox />, text: 'Add Item Group', path: '/add-item-group' },
        { icon: <FaUtensils />, text: 'Add Kitchen', path: '/add-kitchen' },
        { icon: <FaUtensils />, text: 'Add Ingredient & Nutrition', path: '/add-ingredients-nutrition' },
        { icon: <FaLayerGroup />, text: 'Add Variant', path: '/create-variant' },
        { icon: <FaGift />, text: 'Combo Offer', path: '/combo-offer' },
        { icon: <FaEyeSlash />, text: 'Hidden Items', path: '/hidden-items' },
        // Vat removed from Items and placed in Settings
      ],
    },
    {
      icon: <FaUserTie />,
      text: 'Employee',
      children: [
        { icon: <FaList />, text: 'Employee List', path: '/employee-list' },
        { icon: <FaUserTie />, text: 'Delivery Person', path: '/employees' },
        { icon: <FaUsers />, text: 'Users', path: '/users' },
        { icon: <FaPlusCircle />, text: 'Add New Employee', path: '/add-employee' },
        // UPDATED: Employee Designations and Employee Types (plural paths)
        { icon: <FaBriefcase />, text: 'Employee Designations', path: '/employee-designations' },
        { icon: <FaIdCard />, text: 'Employee Types', path: '/employee-types' },
        // UPDATED: Employee Departments (direct child, plural path)
        { icon: <FaBuilding />, text: 'Employee Departments', path: '/employee-departments' },
        // NEW: Vehicle Management (direct child, plural path)
        { icon: <FaCar />, text: 'Vehicle Management', path: '/vehicle-management' },
        // NEW: Schedule submenu
        {
          icon: <FaClock />,
          text: 'Schedule',
          children: [
            { icon: <FaCalendar />, text: 'Schedule Master', path: '/schedule-master' },
            { icon: <FaCog />, text: 'Schedule Rule Master', path: '/schedule-rule-master' },
            { icon: <FaUserPlus />, text: 'Schedule Assign Employee', path: '/schedule-assign-employee' },
          ],
        },
        // NEW: Attendance submenu
        {
          icon: <FaClock />,
          text: 'Attendance Management',
          children: [
            { icon: <FaPlusCircle />, text: 'Create Attendance', path: '/attendance' },
            { icon: <FaEye />, text: 'View Attendance', path: '/attendance-view' },
          ],
        },
        // FIXED: Leave Management submenu - now with proper state handling
        {
          icon: <FaCalendar />,
          text: 'Leave Management',
          children: [
            { icon: <FaList />, text: 'Leave Types', path: '/leave-type' },
            { icon: <FaCreditCard />, text: 'Leave Allocation', path: '/leave-allocation' },
            { icon: <FaPaperPlane />, text: 'Leave Apply', path: '/leave-apply' },
          ],
        },
        // NEW: Salary Management submenu
        {
          icon: <FaMoneyCheckAlt />,
          text: 'Salary Management',
          children: [
            { icon: <FaPlusCircle />, text: 'Salary Receipt', path: '/salary-slip' },
            { icon: <FaList />, text: 'Salary Receipt List', path: '/salary-receipt-list' },
          ],
        },
      ],
    },
    { icon: <FaTable />, text: 'Add New Table', path: '/add-table' },
    {
      icon: <FaCog />,
      text: 'Settings',
      children: [
        { icon: <FaBuilding />, text: 'Company Details', path: '/company-details' },
        { icon: <FaPrint />, text: 'Print Settings', path: '/print-settings' },
        { icon: <FaEnvelope />, text: 'Email Settings', path: '/email-settings' },
        { icon: <FaDatabase />, text: 'Backups', path: '/backup' },
        { icon: <FaCog />, text: 'System Settings', path: '/system-settings' }, // System Settings added here
      ],
    },
    { icon: <FaShoppingCart />, text: 'Purchase Module', path: '/purchase' },
    // Sales Menu
    {
      icon: <FaChartLine />,
      text: 'Sales',
      children: [
        { icon: <FaFileInvoiceDollar />, text: 'Sales Invoice', path: '/salespage' },
        { icon: <FaChartBar />, text: 'Sales Report', path: '/sales-reports' },
      ],
    },
  ];
  const otherMenuItems = [
    // { icon: <FaFileAlt />, text: 'Record', path: '/record' },
    // Note: System Settings has been moved to Settings submenu under Master
  ];
  // Filter menu items based on search query
  const filterMenu = (items, query) => {
    const lowerQuery = query.toLowerCase();
    return items.reduce((acc, item) => {
      if (item.children) {
        const filteredChildren = item.children.filter(
          (child) => child.text.toLowerCase().includes(lowerQuery)
        );
        if (item.text.toLowerCase().includes(lowerQuery) || filteredChildren.length > 0) {
          acc.push({ ...item, children: filteredChildren });
        }
      } else {
        if (item.text.toLowerCase().includes(lowerQuery)) {
          acc.push(item);
        }
      }
      return acc;
    }, []);
  };
  const filteredMasterMenuItems = filterMenu(masterMenuItems, searchQuery);
  const filteredOtherMenuItems = filterMenu(otherMenuItems, searchQuery);
  // Determine if "Master" should be shown based on search
  const showMasterMenu = searchQuery ? filteredMasterMenuItems.length > 0 : true;
  // Helper to get expand state for a menu item
  const getExpandState = (itemText) => {
    switch (itemText) {
      case 'Customers': return isCustomersOpen;
      case 'Items': return isItemsOpen;
      case 'Employee': return isEmployeeAppOpen;
      case 'Settings': return isSettingsOpen;
      case 'Sales': return isSalesOpen;
      case 'Schedule': return isScheduleOpen;
      case 'Attendance Management': return isAttendanceOpen;
      case 'Leave Management': return isLeaveOpen;
      case 'Salary Management': return isSalaryOpen; // NEW: Added for Salary Management
      default: return false;
    }
  };
  // Helper to toggle expand state
  const toggleExpandState = (itemText) => {
    switch (itemText) {
      case 'Customers': setIsCustomersOpen(!isCustomersOpen); break;
      case 'Items': setIsItemsOpen(!isItemsOpen); break;
      case 'Employee': setIsEmployeeAppOpen(!isEmployeeAppOpen); break;
      case 'Settings': setIsSettingsOpen(!isSettingsOpen); break;
      case 'Sales': setIsSalesOpen(!isSalesOpen); break;
      case 'Schedule': setIsScheduleOpen(!isScheduleOpen); break;
      case 'Attendance Management': setIsAttendanceOpen(!isAttendanceOpen); break;
      case 'Leave Management': setIsLeaveOpen(!isLeaveOpen); break;
      case 'Salary Management': setIsSalaryOpen(!isSalaryOpen); break; // NEW: Added for Salary Management
    }
  };
  // Helper to set expand state
  const setExpandState = (itemText, value) => {
    switch (itemText) {
      case 'Customers': setIsCustomersOpen(value); break;
      case 'Items': setIsItemsOpen(value); break;
      case 'Employee': setIsEmployeeAppOpen(value); break;
      case 'Settings': setIsSettingsOpen(value); break;
      case 'Sales': setIsSalesOpen(value); break;
      case 'Schedule': setIsScheduleOpen(value); break;
      case 'Attendance Management': setIsAttendanceOpen(value); break;
      case 'Leave Management': setIsLeaveOpen(value); break;
      case 'Salary Management': setIsSalaryOpen(value); break; // NEW: Added for Salary Management
    }
  };
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
        padding: '20px',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
        overflowY: 'auto'
      }}>
        {/* Logo Display and Upload Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '10px'
        }}>
          {/* Logo Display - Show preview if selected, or saved logo, or placeholder */}
          {(logoUrl || previewUrl) ? (
            <img
              src={previewUrl || logoUrl}
              alt="Logo"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                objectFit: 'cover',
                marginBottom: '10px',
                border: '2px solid #3498db'
              }}
            />
          ) : (
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#ddd',
              margin: '0 auto 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: '2rem'
            }}>
              Logo
            </div>
          )}
          {/* Buttons Row - Show upload only if no logo, delete only if logo present */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '5px'
          }}>
            <input
              id="logo-input"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              style={{ display: 'none' }}
            />
            {!logoUrl && (
              <label
                htmlFor="logo-input"
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'inline-block',
                  margin: 0
                }}
              >
                <FaCamera /> Upload Logo
              </label>
            )}
            {logoUrl && (
              <button
                onClick={handleDeleteLogo}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                <FaTrash /> Delete
              </button>
            )}
          </div>
          {/* Selected File Info and Save Button - Shown if file selected (only possible when no logo) */}
          {logoFile && (
            <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#27ae60' }}>
              Selected: {logoFile.name}
              <button
                onClick={handleUploadLogo}
                disabled={uploadingLogo}
                style={{
                  marginLeft: '10px',
                  padding: '5px 10px',
                  backgroundColor: uploadingLogo ? '#bdc3c7' : '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                {uploadingLogo ? 'Uploading...' : 'Save Logo'}
              </button>
            </div>
          )}
        </div>
        {/* Search Box */}
        <div style={{
          position: 'relative',
          marginBottom: '20px'
        }}>
          <FaSearch style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#2c3e50',
            fontSize: '1rem'
          }} />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '10px 10px 10px 35px',
              backgroundColor: '#ffffff',
              color: '#2c3e50',
              border: '1px solid #bdc3c7',
              borderRadius: '15px',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.3s',
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = '#3498db';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = '#bdc3c7';
            }}
          />
        </div>
        <h2 style={{
          color: '#2c3e50',
          marginBottom: '30px',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Admin Menu
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {showMasterMenu && (
            <>
              <button
                onClick={toggleMasterMenu}
                style={{
                  padding: '12px 20px',
                  backgroundColor: isMasterOpen && filteredMasterMenuItems.length > 0 ? '#3498db' : '#ffffff',
                  color: isMasterOpen && filteredMasterMenuItems.length > 0 ? '#ffffff' : '#2c3e50',
                  border: 'none',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '1rem',
                  transition: 'background-color 0.3s, color 0.3s',
                  textAlign: 'left'
                }}
                onMouseOver={(e) => !isMasterOpen && (e.target.style.backgroundColor = '#e6f3fa')}
                onMouseOut={(e) => !isMasterOpen && (e.target.style.backgroundColor = '#ffffff')}
              >
                <FaHome /> Master
              </button>
              {isMasterOpen && filteredMasterMenuItems.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '20px' }}>
                  {filteredMasterMenuItems.map((item, index) => (
                    <React.Fragment key={index}>
                      {item.children ? (
                        <>
                          {searchQuery ? (
                            // Search mode: Show parent as non-toggleable header and always show filtered children
                            <>
                              <div
                                style={{
                                  padding: '12px 20px',
                                  backgroundColor: '#e6f3fa',
                                  color: '#2c3e50',
                                  border: 'none',
                                  borderRadius: '15px',
                                  fontSize: '1rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  textAlign: 'left',
                                  fontWeight: 'bold',
                                  cursor: 'default'
                                }}
                              >
                                {item.icon} {item.text}
                              </div>
                              {item.children.length > 0 && (
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    paddingLeft: '20px',
                                  }}
                                >
                                  {item.children.map((subItem, subIndex) => (
                                    <button
                                      key={subIndex}
                                      onClick={() => handleNavigation(subItem.path)}
                                      style={{
                                        padding: '12px 20px',
                                        backgroundColor: '#ffffff',
                                        color: '#2c3e50',
                                        border: 'none',
                                        borderRadius: '15px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '1rem',
                                        transition: 'background-color 0.3s',
                                        textAlign: 'left'
                                      }}
                                      onMouseOver={(e) => (e.target.style.backgroundColor = '#e6f3fa')}
                                      onMouseOut={(e) => (e.target.style.backgroundColor = '#ffffff')}
                                    >
                                      {subItem.icon} {subItem.text}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            // Normal mode: Toggleable parent with conditional children
                            <>
                              <button
                                onClick={() => toggleExpandState(item.text)}
                                style={{
                                  padding: '12px 20px',
                                  backgroundColor: getExpandState(item.text) && item.children.length > 0 ? '#3498db' : '#ffffff',
                                  color: getExpandState(item.text) && item.children.length > 0 ? '#ffffff' : '#2c3e50',
                                  border: 'none',
                                  borderRadius: '15px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  fontSize: '1rem',
                                  transition: 'background-color 0.3s, color 0.3s',
                                  textAlign: 'left'
                                }}
                                onMouseOver={(e) =>
                                  !getExpandState(item.text) && item.children.length > 0 && (e.target.style.backgroundColor = '#e6f3fa')
                                }
                                onMouseOut={(e) =>
                                  !getExpandState(item.text) && item.children.length > 0 && (e.target.style.backgroundColor = '#ffffff')
                                }
                              >
                                {item.icon} {item.text}
                              </button>
                              {getExpandState(item.text) && item.children.length > 0 && (
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    paddingLeft: '20px',
                                  }}
                                >
                                  {item.children.map((subItem, subIndex) => (
                                    <React.Fragment key={subIndex}>
                                      {subItem.children ? (
                                        // Handle nested children for Schedule, Attendance Management, Leave Management, Salary Management
                                        <>
                                          <button
                                            onClick={() => toggleExpandState(subItem.text)}
                                            style={{
                                              padding: '12px 20px',
                                              backgroundColor: getExpandState(subItem.text) ? '#3498db' : '#ffffff',
                                              color: getExpandState(subItem.text) ? '#ffffff' : '#2c3e50',
                                              border: 'none',
                                              borderRadius: '15px',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '10px',
                                              fontSize: '1rem',
                                              transition: 'background-color 0.3s, color 0.3s',
                                              textAlign: 'left'
                                            }}
                                            onMouseOver={(e) =>
                                              !getExpandState(subItem.text) && (e.target.style.backgroundColor = '#e6f3fa')
                                            }
                                            onMouseOut={(e) =>
                                              !getExpandState(subItem.text) && (e.target.style.backgroundColor = '#ffffff')
                                            }
                                          >
                                            {subItem.icon} {subItem.text}
                                          </button>
                                          {getExpandState(subItem.text) && subItem.children.length > 0 && (
                                            <div
                                              style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '10px',
                                                paddingLeft: '20px',
                                              }}
                                            >
                                              {subItem.children.map((grandSubItem, grandSubIndex) => (
                                                <button
                                                  key={grandSubIndex}
                                                  onClick={() => handleNavigation(grandSubItem.path)}
                                                  style={{
                                                    padding: '12px 20px',
                                                    backgroundColor: '#ffffff',
                                                    color: '#2c3e50',
                                                    border: 'none',
                                                    borderRadius: '15px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    fontSize: '1rem',
                                                    transition: 'background-color 0.3s',
                                                    textAlign: 'left'
                                                  }}
                                                  onMouseOver={(e) => (e.target.style.backgroundColor = '#e6f3fa')}
                                                  onMouseOut={(e) => (e.target.style.backgroundColor = '#ffffff')}
                                                >
                                                  {grandSubItem.icon} {grandSubItem.text}
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <button
                                          key={subIndex}
                                          onClick={() => handleNavigation(subItem.path)}
                                          style={{
                                            padding: '12px 20px',
                                            backgroundColor: '#ffffff',
                                            color: '#2c3e50',
                                            border: 'none',
                                            borderRadius: '15px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            fontSize: '1rem',
                                            transition: 'background-color 0.3s',
                                            textAlign: 'left'
                                          }}
                                          onMouseOver={(e) => (e.target.style.backgroundColor = '#e6f3fa')}
                                          onMouseOut={(e) => (e.target.style.backgroundColor = '#ffffff')}
                                        >
                                          {subItem.icon} {subItem.text}
                                        </button>
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => handleNavigation(item.path)}
                          style={{
                            padding: '12px 20px',
                            backgroundColor: '#ffffff',
                            color: '#2c3e50',
                            border: 'none',
                            borderRadius: '15px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '1rem',
                            transition: 'background-color 0.3s',
                            textAlign: 'left'
                          }}
                          onMouseOver={(e) => (e.target.style.backgroundColor = '#e6f3fa')}
                          onMouseOut={(e) => (e.target.style.backgroundColor = '#ffffff')}
                        >
                          {item.icon} {item.text}
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </>
          )}
          {filteredOtherMenuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item.path)}
              style={{
                padding: '12px 20px',
                backgroundColor: '#ffffff',
                color: '#2c3e50',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '1rem',
                transition: 'background-color 0.3s',
                textAlign: 'left',
                marginTop: '10px'
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = '#e6f3fa')}
              onMouseOut={(e) => (e.target.style.backgroundColor = '#ffffff')}
            >
              {item.icon} {item.text}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginLeft: '250px', flex: 1, padding: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '40px auto 0' }}>
          <button
            onClick={handleLogoutClick} // UPDATED: Was handleLogout
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              borderRadius: '25px',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              border: '1px solid #bdc3c7',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#3498db')}
            onMouseOut={(e) => (e.target.style.backgroundColor = '#ffffff')}
          >
            <FaSignOutAlt style={{ fontSize: '24px', color: '#2c3e50' }} />
          </button>
          <h2 style={{ textAlign: 'center', marginBottom: '40px', color: '#2c3e50', fontSize: '2rem', fontWeight: '600' }}>
            Admin Dashboard
          </h2>
          {loading && (
            <div style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '1.2rem' }}>Loading...</div>
          )}
          {error && (
            <div
              style={{
                backgroundColor: '#ffebee',
                padding: '10px',
                marginBottom: '20px',
                color: '#c0392b',
                borderRadius: '15px',
                textAlign: 'center'
              }}
            >
              {error}
            </div>
          )}
          {message && (
            <div
              style={{
                backgroundColor: message.toLowerCase().includes('success') ? '#d4edda' : '#ffebee',
                padding: '10px',
                marginBottom: '20px',
                color: message.toLowerCase().includes('success') ? '#155724' : '#c0392b',
                borderRadius: '15px',
                textAlign: 'center'
              }}
            >
              {message}
            </div>
          )}
          {!loading && !error && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div
                style={{
                  padding: '20px',
                  backgroundColor: '#fff',
                  borderRadius: '15px',
                  textAlign: 'center',
                  width: '200px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onClick={() => handleNavigation('/customers')}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <FaUsers style={{ fontSize: '2rem', color: '#3498db', marginBottom: '10px' }} />
                <h4 style={{ margin: '0', color: '#2c3e50' }}>Total Customers</h4>
                <p style={{ fontSize: '1.5rem', margin: '5px 0 0', color: '#34495e' }}>{customerCount}</p>
              </div>
              <div
                style={{
                  padding: '20px',
                  backgroundColor: '#fff',
                  borderRadius: '15px',
                  textAlign: 'center',
                  width: '200px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onClick={() => handleNavigation('/items')}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <FaBox style={{ fontSize: '2rem', color: '#3498db', marginBottom: '10px' }} />
                <h4 style={{ margin: '0', color: '#2c3e50' }}>Total Items</h4>
                <p style={{ fontSize: '1.5rem', margin: '5px 0 0', color: '#34495e' }}>{itemCount}</p>
              </div>
              <div
                style={{
                  padding: '20px',
                  backgroundColor: '#fff',
                  borderRadius: '15px',
                  textAlign: 'center',
                  width: '200px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onClick={() => handleNavigation('/backup')}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <FaDatabase style={{ fontSize: '2rem', color: '#3498db', marginBottom: '10px' }} />
                <h4 style={{ margin: '0', color: '#2c3e50' }}>Total Backups</h4>
                <p style={{ fontSize: '1.5rem', margin: '5px 0 0', color: '#34495e' }}>{backupCount}</p>
              </div>
              <div
                style={{
                  padding: '20px',
                  backgroundColor: '#fff',
                  borderRadius: '15px',
                  textAlign: 'center',
                  width: '200px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onClick={() => handleNavigation('/company-details')}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <FaBuilding style={{ fontSize: '2rem', color: '#3498db', marginBottom: '10px' }} />
                <h4 style={{ margin: '0', color: '#2c3e50' }}>Company Details</h4>
              </div>
            </div>
          )}
          <div
            style={{
              marginTop: '40px',
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '15px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '1.5rem', fontWeight: '600' }}>
              Import Data to SQL
            </h3>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{
                  padding: '10px',
                  border: '1px solid #bdc3c7',
                  borderRadius: '15px',
                  fontSize: '1rem',
                }}
              />
              <button
                onClick={handleImportMongoDB}
                disabled={loading || !importFile}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading || !importFile ? '#bdc3c7' : '#3498db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '15px',
                  cursor: loading || !importFile ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) =>
                  !loading && importFile && (e.target.style.backgroundColor = '#2980b9')
                }
                onMouseOut={(e) =>
                  !loading && importFile && (e.target.style.backgroundColor = '#3498db')
                }
              >
                {loading ? 'Importing...' : 'Import JSON'}
              </button>
            </div>
            {importFile && (
              <p style={{ marginTop: '10px', color: '#34495e' }}>Selected file: {importFile.name}</p>
            )}
          </div>
        </div>
      </div>
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
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
          zIndex: 1000 // Ensures it appears on top of other content
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            textAlign: 'center',
            maxWidth: '300px',
            width: '90%'
          }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
              Sign Out
            </h3>
            <p style={{ color: '#34495e', marginBottom: '25px', fontSize: '1rem' }}>
              Are you sure you want to sign out?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button
                onClick={cancelLogout}
                style={{
                  padding: '10px 25px',
                  backgroundColor: '#bdc3c7', // Gray
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#95a5a6')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#bdc3c7')}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                style={{
                  padding: '10px 25px',
                  backgroundColor: '#e74c3c', // Red
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#c0392b')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#e74c3c')}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      {/* End of Logout Modal */}
    </div>
  );
}
export default AdminPage;