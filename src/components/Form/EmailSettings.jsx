// EmailSettings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';
import axios from 'axios';

function EmailSettings() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const fetchEmailSettings = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/get-email-settings');
        if (response.data.success) {
          setEmail(response.data.email || '');
          setFromEmail(response.data.from_email || '');
        }
      } catch (error) {
        setMessage(`Failed to fetch email settings: ${error.message}`);
        setMessageType('error');
      }
    };
    fetchEmailSettings();
  }, []);

  const handleGoBack = () => {
    navigate('/admin');
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleTestSettings = async () => {
    if (!email || !password) {
      setMessage('Please provide email and app password to test');
      setMessageType('error');
      return;
    }
    if (!validateEmail(email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }
    setTesting(true);
    try {
      const response = await axios.post('http://localhost:8000/api/test-email-settings', {
        email,
        password,
      });
      setMessage(response.data.message);
      setMessageType('success');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!email || !password || !fromEmail) {
      setMessage('Please provide email, app password, and from email');
      setMessageType('error');
      return;
    }
    if (!validateEmail(email) || !validateEmail(fromEmail)) {
      setMessage('Please enter valid email addresses');
      setMessageType('error');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/save-email-settings', {
        email,
        password,
        from_email: fromEmail,
      });
      setMessage(response.data.message);
      setMessageType('success');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
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
        disabled={loading || testing}
      >
        <FaArrowLeft /> Back to Admin
      </button>

      {/* Main Container - Styled like EmployeeList Card */}
      <div style={{
        maxWidth: '600px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header with Title - Styled like EmployeeList Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #3498db'
        }}>
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
            <FaEnvelope style={{ color: '#3498db', fontSize: '2rem' }} />
            Email Settings
          </h2>
        </div>

        {/* Error and Message - Styled like EmployeeList Alerts */}
        {message && (
          <div style={{
            background: messageType === 'success' 
              ? 'linear-gradient(135deg, #d4edda 0%, #c8e6c9 100%)' 
              : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            color: messageType === 'success' ? '#155724' : '#c0392b',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            border: `1px solid ${messageType === 'success' ? '#28a745' : '#e74c3c'}`,
            boxShadow: `0 2px 4px rgba(${messageType === 'success' ? '40, 167, 69' : '231, 76, 60'}, 0.2)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            {messageType === 'success' ? <FaEnvelope style={{ fontSize: '1.2rem', color: '#27ae60' }} /> : <FaEnvelope style={{ fontSize: '1.2rem' }} />}
            {message}
            <button
              onClick={() => setMessage('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                fontSize: '1.2rem',
                cursor: 'pointer',
                marginLeft: 'auto',
                padding: 0
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Settings Form - Styled like EmployeeList Card */}
        <div style={{
          background: '#ffffff',
          padding: '20px',
          borderRadius: '15px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '0.95rem',
              color: '#2c3e50'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #3498db',
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                background: '#f8f9fa'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2980b9'}
              onBlur={(e) => e.target.style.borderColor = '#3498db'}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '0.95rem',
              color: '#2c3e50'
            }}>
              From Email Address
            </label>
            <input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="Enter sender email"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #3498db',
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                background: '#f8f9fa'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2980b9'}
              onBlur={(e) => e.target.style.borderColor = '#3498db'}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '0.95rem',
              color: '#2c3e50'
            }}>
              App Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your app password"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #3498db',
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                background: '#f8f9fa'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2980b9'}
              onBlur={(e) => e.target.style.borderColor = '#3498db'}
            />
            <small style={{
              display: 'block',
              marginTop: '5px',
              fontSize: '0.8rem',
              color: '#7f8c8d',
              lineHeight: '1.4'
            }}>
              For Gmail, use an App Password from your Google Account settings.{' '}
              <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" style={{ color: '#3498db', textDecoration: 'none' }}>
                Learn more
              </a>
            </small>
          </div>
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleTestSettings}
              disabled={testing || loading}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 8px rgba(149, 165, 166, 0.3)',
                transition: 'all 0.3s ease',
                minWidth: '140px'
              }}
              onMouseOver={(e) => {
                if (!(testing || loading)) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 12px rgba(149, 165, 166, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!(testing || loading)) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 8px rgba(149, 165, 166, 0.3)';
                }
              }}
            >
              {testing ? 'Testing...' : 'Test Settings'}
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={loading || testing}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)',
                transition: 'all 0.3s ease',
                minWidth: '140px'
              }}
              onMouseOver={(e) => {
                if (!(loading || testing)) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 12px rgba(52, 152, 219, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!(loading || testing)) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.3)';
                }
              }}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailSettings;