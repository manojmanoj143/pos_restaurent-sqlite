import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import './SystemSettings.css';

const SystemSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Details');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    phoneNumber: '',
    roleProfile: 'User',
    password: '',
  });

  const [settings, setSettings] = useState({
    country: 'India', // Updated: Default to India
    language: 'English',
    timeZone: 'Asia/Dubai',
    currency: 'INR', // Updated: Default to INR (Indian Rupee)
    dateFormat: 'yyyy/mm/dd',
    timeFormat: 'HH:mm:ss',
    numberFormat: '#,##,###.##',
    useNumberFormatFromCurrency: false,
    firstDayOfWeek: 'Monday',
    floatPrecision: 3,
    currencyPrecision: 4,
    useCurrencySymbol: false, // NEW: Toggle between Symbol and Code
    sessionExpiry: '',
    documentShareKeyExpiry: '',
    denyMultipleSessions: false,
    disableUserPassLogin: false,
    allowLoginUsingMobileNumber: false,
    allowLoginUsingUserName: false,
    loginWithEmailLink: false,
    allowConsecutiveLoginAttempts: 0,
    allowLoginAfterFail: 0,
    enableTwoFactorAuth: false,
    totalWorkingDays: 30, // NEW: Default total working days per month (kept for backend compatibility, but input removed)
    applyCompanyLeaves: false, // NEW: Checkbox to apply company leaves deduction
  });

  const [clickCount, setClickCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState('');
  const [isSuccessMessage, setIsSuccessMessage] = useState(false); // NEW: To distinguish success vs error messages
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [baseUrl, setBaseUrl] = useState("");

  // Fetch config to determine baseUrl
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
      // Fetch users and settings after determining baseUrl
      if (currentBaseUrl) {
        fetchUsers(currentBaseUrl);
        fetchSettings(currentBaseUrl);
      } else {
        fetchUsers("");
        fetchSettings("");
      }
    }
  };

  const fetchUsers = async (currentBaseUrl) => {
    try {
      const url = currentBaseUrl ? `${currentBaseUrl}/api/users` : 'http://localhost:8000/api/users';
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(
        data.map((user) => ({
          fullName: user.firstName || 'Unknown',
          status: user.status || 'Active',
          userType: user.role,
          phoneNumber: user.phone_number || 'N/A',
          id: user.email,
        }))
      );
    } catch (error) {
      console.error('Error fetching users:', error);
      setWarningMessage('Failed to fetch users');
      setIsSuccessMessage(false);
    }
  };

  const fetchSettings = async (currentBaseUrl) => {
    try {
      const url = currentBaseUrl ? `${currentBaseUrl}/api/settings` : 'http://localhost:8000/api/settings';
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings((prev) => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error fetching settings:', error);
      setWarningMessage('Failed to fetch settings');
      setIsSuccessMessage(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    const storedSettings = JSON.parse(localStorage.getItem('systemSettings'));
    if (storedSettings) setSettings((prev) => ({ ...prev, ...storedSettings }));

    // Set up interval for fetching users after baseUrl is set
    const interval = setInterval(() => {
      if (baseUrl) {
        fetchUsers(baseUrl);
      } else {
        fetchUsers("");
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [baseUrl]); // Depend on baseUrl to ensure it runs after baseUrl is set

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleGoBack = () => navigate('/admin');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = baseUrl ? `${baseUrl}/api/settings` : 'http://localhost:8000/api/settings';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      setWarningMessage('Settings saved successfully!');
      setIsSuccessMessage(true); // NEW: Mark as success
    } catch (error) {
      console.error('Error saving settings:', error);
      setWarningMessage(`Failed to save settings: ${error.message}`);
      setIsSuccessMessage(false); // NEW: Mark as error
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(value.length > 0);
  };

  const handleDropdownClick = () => {
    setShowUserList(true);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async () => {
    if (newUser.email && newUser.firstName && newUser.phoneNumber && newUser.password) {
      const newUserData = {
        email: newUser.email,
        firstName: newUser.firstName,
        phoneNumber: newUser.phoneNumber,
        role: newUser.roleProfile.toLowerCase(),
        password: newUser.password,
        status: 'Active',
        company: 'POS 8',
        pos_profile: 'POS-001',
      };

      try {
        const url = baseUrl ? `${baseUrl}/api/register` : 'http://localhost:8000/api/register';
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUserData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add user');
        }

        await fetchUsers(baseUrl);
        setNewUser({ email: '', firstName: '', phoneNumber: '', roleProfile: 'User', password: '' });
        setShowAddUserForm(false);
        setWarningMessage('User added successfully! You can now login with these credentials.');
        setIsSuccessMessage(true); // NEW: Mark as success
      } catch (error) {
        console.error('Error adding user:', error);
        setWarningMessage(`Failed to add user: ${error.message}`);
        setIsSuccessMessage(false); // NEW: Mark as error
      }
    } else {
      setWarningMessage('Please fill in all required fields.');
      setIsSuccessMessage(false); // NEW: Mark as error
    }
  };

  const handleDeleteUser = (email) => {
    setUserToDelete(email);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const url = baseUrl ? `${baseUrl}/api/users/${userToDelete}` : `http://localhost:8000/api/users/${userToDelete}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      await fetchUsers(baseUrl);
      setWarningMessage('User deleted successfully!');
      setIsSuccessMessage(true); // NEW: Mark as success
    } catch (error) {
      console.error('Error deleting user:', error);
      setWarningMessage(`Failed to delete user: ${error.message}`);
      setIsSuccessMessage(false); // NEW: Mark as error
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const dateFormatOptions = [
    'dd-mm-yyyy',
    'mm-dd-yyyy',
    'yyyy-mm-dd',
    'dd/mm/yyyy',
    'mm/dd/yyyy',
    'yyyy/mm/dd',
    'yyyy-long-mm-dd' // New: yyyy longmonth dd, e.g., 2025 October 29
  ];

  const timeFormatOptions = [
    'HH:mm:ss', // 24-hour with seconds
    'hh:mm:ss a', // 12-hour with seconds and AM/PM
    'HH:mm', // 24-hour without seconds
    'hh:mm a' // 12-hour without seconds and AM/PM
  ];

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const roleProfileOptions = ['User', 'Admin', 'Bearer'];

  const renderUserList = () => (
    <div className="user-list-container">
      <div className="sidebar">
        <h3>Filters</h3>
        <div>
          <label>Filter By</label>
          <input type="text" placeholder="Begin typing" />
        </div>
        <button className="edit-filters-btn">Edit Filters</button>
        <label>
          <input type="checkbox" /> Show Tags
        </label>
        <div>
          <label>Save Filter</label>
          <input type="text" placeholder="Filter Name" />
        </div>
      </div>
      <div className="main-content">
        <div className="user-list-header">
          <h3>User List</h3>
          <button className="add-user-btn" onClick={() => setShowAddUserForm(true)}>Add User</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Status</th>
              <th>User Type</th>
              <th>Phone Number</th>
              <th>ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={index}>
                <td>{user.fullName}</td>
                <td>{user.status}</td>
                <td>{user.userType}</td>
                <td>{user.phoneNumber}</td>
                <td>{user.id}</td>
                <td>
                  <button className="delete-btn" onClick={() => handleDeleteUser(user.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">{users.length} of {users.length}</div>

        {showAddUserForm && (
          <div className="add-user-form">
            <h3>Add New User</h3>
            <div className="form-content">
              <div>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleNewUserChange}
                  placeholder="e.g., test@example.com"
                  required
                />
              </div>
              <div>
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={newUser.firstName}
                  onChange={handleNewUserChange}
                  placeholder="e.g., Test"
                  required
                />
              </div>
              <div>
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={newUser.phoneNumber}
                  onChange={handleNewUserChange}
                  placeholder="e.g., 1234567890"
                  required
                />
              </div>
              <div>
                <label>Role Profile</label>
                <select name="roleProfile" value={newUser.roleProfile} onChange={handleNewUserChange}>
                  {roleProfileOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleNewUserChange}
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>
            <div className="form-buttons">
              <button className="cancel-btn" onClick={() => setShowAddUserForm(false)}>Cancel</button>
              <button className="save-btn" onClick={handleAddUser}>Save</button>
            </div>
          </div>
        )}

        <button className="back-btn" onClick={() => setShowUserList(false)}>Back to Settings</button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (showUserList) return renderUserList();
    switch (activeTab) {
      case 'Details':
        return (
          <form onSubmit={handleSubmit} className="settings-form">
            <div>
              <label htmlFor="country">Country</label>
              <input type="text" id="country" name="country" value={settings.country} onChange={handleInputChange} />
            </div>
            <div>
              <label htmlFor="language">Language</label>
              <input type="text" id="language" name="language" value={settings.language} onChange={handleInputChange} />
            </div>
            <div>
              <label htmlFor="timeZone">Time Zone</label>
              <input type="text" id="timeZone" name="timeZone" value={settings.timeZone} onChange={handleInputChange} />
            </div>
            <div>
              <label htmlFor="currency">Currency</label>
              <select id="currency" name="currency" value={settings.currency} onChange={handleInputChange}>
                <option value="INR">INR (₹) - India</option>
                <option value="USD">USD ($) - USA</option>
                <option value="EUR">EUR (€) - Eurozone</option>
                <option value="GBP">GBP (£) - UK</option>
                <option value="AED">AED (د.إ) - UAE</option>
                <option value="JPY">JPY (¥) - Japan</option>
                <option value="CNY">CNY (¥) - China</option>
                <option value="SGD">SGD ($) - Singapore</option>
                <option value="MYR">MYR (RM) - Malaysia</option>
                <option value="THB">THB (฿) - Thailand</option>
                <option value="IDR">IDR (Rp) - Indonesia</option>
                <option value="KRW">KRW (₩) - South Korea</option>
                <option value="PHP">PHP (₱) - Philippines</option>
                <option value="SAR">SAR (﷼) - Saudi Arabia</option>
                <option value="QAR">QAR (﷼) - Qatar</option>
                <option value="KWD">KWD (د.ك) - Kuwait</option>
                <option value="OMR">OMR (﷼) - Oman</option>
                <option value="BHD">BHD (.د.ب) - Bahrain</option>
                <option value="CAD">CAD ($) - Canada</option>
                <option value="AUD">AUD ($) - Australia</option>
                <option value="NZD">NZD ($) - New Zealand</option>
                <option value="CHF">CHF (CHF) - Switzerland</option>
                <option value="ZAR">ZAR (R) - South Africa</option>
                <option value="BRL">BRL (R$) - Brazil</option>
                <option value="PKR">PKR (₨) - Pakistan</option>
                <option value="LKR">LKR (Rs) - Sri Lanka</option>
                <option value="NGN">NGN (₦) - Nigeria</option>
              </select>
            </div>
            <div>
              <label>
                <input type="checkbox" name="useCurrencySymbol" checked={settings.useCurrencySymbol} onChange={handleInputChange} />
                Display Currency directly as Symbol (e.g. ₹ instead of INR)
              </label>
            </div>
            <div>
              <label htmlFor="dateFormat">Date Format</label>
              <select id="dateFormat" name="dateFormat" value={settings.dateFormat} onChange={handleInputChange}>
                {dateFormatOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="timeFormat">Time Format</label>
              <select id="timeFormat" name="timeFormat" value={settings.timeFormat} onChange={handleInputChange}>
                {timeFormatOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="numberFormat">Number Format</label>
              <input type="text" id="numberFormat" name="numberFormat" value={settings.numberFormat} onChange={handleInputChange} />
            </div>
            <div>
              <label>
                <input type="checkbox" name="useNumberFormatFromCurrency" checked={settings.useNumberFormatFromCurrency} onChange={handleInputChange} />
                Use Number Format from Currency
              </label>
            </div>
            <div>
              <label htmlFor="firstDayOfWeek">First Day of the Week</label>
              <select id="firstDayOfWeek" name="firstDayOfWeek" value={settings.firstDayOfWeek} onChange={handleInputChange}>
                {daysOfWeek.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="floatPrecision">Float Precision</label>
              <input type="number" id="floatPrecision" name="floatPrecision" value={settings.floatPrecision} onChange={handleInputChange} min="1" max="10" />
            </div>
            <div>
              <label htmlFor="currencyPrecision">Currency Precision</label>
              <input type="number" id="currencyPrecision" name="currencyPrecision" value={settings.currencyPrecision} onChange={handleInputChange} placeholder="Depends on number format" />
            </div>
            <button type="submit" className="save-settings-btn">Save Settings</button>
          </form>
        );
      case 'Login':
        return (
          <form onSubmit={handleSubmit} className="settings-form">
            <div>
              <label htmlFor="sessionExpiry">Session Expiry (HH:MM)</label>
              <input type="text" id="sessionExpiry" name="sessionExpiry" value={settings.sessionExpiry} onChange={handleInputChange} placeholder="e.g., 24:00" />
              <small>Example: 24:00 logs out after 24 hours of inactivity</small>
            </div>
            <div>
              <label htmlFor="documentShareKeyExpiry">Document Share Key Expiry (Days)</label>
              <input type="number" id="documentShareKeyExpiry" name="documentShareKeyExpiry" value={settings.documentShareKeyExpiry} onChange={handleInputChange} min="1" />
              <small>Days until Web View link expires</small>
            </div>
            <div>
              <label>
                <input type="checkbox" name="denyMultipleSessions" checked={settings.denyMultipleSessions} onChange={handleInputChange} />
                Allow Only One Session Per User
              </label>
              <small>Multiple sessions allowed on mobile</small>
            </div>
            <div>
              <label>
                <input type="checkbox" name="disableUserPassLogin" checked={settings.disableUserPassLogin} onChange={handleInputChange} />
                Disable Username/Password Login
              </label>
              <small>Configure Social Login first</small>
            </div>
            <div>
              <label>
                <input type="checkbox" name="allowLoginUsingMobileNumber" checked={settings.allowLoginUsingMobileNumber} onChange={handleInputChange} />
                Allow Login Using Mobile Number
              </label>
            </div>
            <div>
              <label>
                <input type="checkbox" name="allowLoginUsingUserName" checked={settings.allowLoginUsingUserName} onChange={handleInputChange} />
                Allow Login Using User Name
              </label>
            </div>
            <div>
              <label>
                <input type="checkbox" name="loginWithEmailLink" checked={settings.loginWithEmailLink} onChange={handleInputChange} />
                Login with Email Link
              </label>
              <small>Passwordless login via email</small>
            </div>
            <div>
              <label htmlFor="allowConsecutiveLoginAttempts">Allow Consecutive Login Attempts</label>
              <input type="number" id="allowConsecutiveLoginAttempts" name="allowConsecutiveLoginAttempts" value={settings.allowConsecutiveLoginAttempts} onChange={handleInputChange} min="0" />
            </div>
            <div>
              <label htmlFor="allowLoginAfterFail">Allow Login After Fail (Seconds)</label>
              <input type="number" id="allowLoginAfterFail" name="allowLoginAfterFail" value={settings.allowLoginAfterFail} onChange={handleInputChange} min="0" />
            </div>
            <div>
              <label>
                <input type="checkbox" name="enableTwoFactorAuth" checked={settings.enableTwoFactorAuth} onChange={handleInputChange} />
                Enable Two Factor Authentication
              </label>
            </div>
            <button type="submit" className="save-settings-btn">Save Settings</button>
          </form>
        );
      case 'Working Days': // NEW: Working Days tab (Total Working Days input removed)
        return (
          <form onSubmit={handleSubmit} className="settings-form">
            <div>
              <label>
                <input
                  type="checkbox"
                  name="applyCompanyLeaves"
                  checked={settings.applyCompanyLeaves}
                  onChange={handleInputChange}
                />
                Apply Company Leaves (Deduct from Total Working Days)
              </label>
            </div>
            <button type="submit" className="save-settings-btn">Save Settings</button>
          </form>
        );
      default:
        return <div className="coming-soon">Coming soon...</div>;
    }
  };

  const tabs = ['Details', 'Login', 'Working Days']; // UPDATED: Added 'Working Days' tab

  return (
    <div style={{
      height: '100vh',
      overflowY: 'auto',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Fixed Back Button - Styled like EmployeeList */}
      <button
        onClick={handleGoBack}
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

      {/* Main Container - Styled like EmployeeList Card */}
      <div style={{
        maxWidth: '1250px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        // overflow: 'hidden' - REMOVED to allow scrolling
      }}>
        {/* Header with Title - Styled like EmployeeList */}
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
            System Settings
          </h2>
          <div></div> {/* Empty right for balance */}
        </div>

        {/* Search Container */}
        <div className="search-container">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search (e.g., userlist)"
          />
          {showDropdown && (
            <div className="dropdown">
              <div className="dropdown-item" onClick={handleDropdownClick}>User List</div>
            </div>
          )}
        </div>

        {warningMessage && (
          <div
            className={`message-overlay ${isSuccessMessage ? 'success-overlay' : 'error-overlay'}`}
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
              zIndex: 1000,
            }}
          >
            <div
              className={`message-box ${isSuccessMessage ? 'success-box' : 'error-box'}`}
              style={{
                backgroundColor: isSuccessMessage ? '#4CAF50' : '#f44336',
                color: 'white',
                padding: '20px',
                borderRadius: '8px',
                maxWidth: '400px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                position: 'relative',
              }}
            >
              <p className="message-text" style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                {warningMessage}
              </p>
              <button
                className="close-message"
                onClick={() => setWarningMessage('')}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '15px',
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {!showUserList && (
          <div className="tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? 'active-tab' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        <div className="content">{renderTabContent()}</div>

        {showDeleteConfirm && (
          <>
            <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)} />
            <div className="confirm-modal">
              <p className="confirm-text">Are you sure you want to delete user {userToDelete}?</p>
              <div className="modal-button-group">
                <button className="confirm-delete-btn" onClick={confirmDelete}>
                  Yes, Delete
                </button>
                <button className="cancel-delete-btn" onClick={() => setShowDeleteConfirm(false)}>
                  No, Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;