// VatPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft } from 'react-icons/fa';

function VatPage() {
  const navigate = useNavigate();

  // UI States
  const [vatAmount, setVatAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // Network config
  const [baseUrl, setBaseUrl] = useState('');

  // -----------------------------------------------------------------
  // 1. FETCH NETWORK CONFIG (same as AdminPage)
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchConfig = async () => {
      let currentBaseUrl = '';
      try {
        const response = await axios.get('http://localhost:8000/api/network_info');
        const { config: appConfig } = response.data;

        if (appConfig.mode === 'client') {
          currentBaseUrl = `http://${appConfig.server_ip}:8000`;
          setBaseUrl(currentBaseUrl);
        } else {
          setBaseUrl(''); // server mode → relative URLs
        }
      } catch (err) {
        console.error('Failed to fetch network config:', err);
        setBaseUrl('');
        setError('Could not connect to server. Using local mode.');
      } finally {
        // After we know the base URL, load VAT
        if (currentBaseUrl !== undefined) {
          fetchVat(currentBaseUrl);
        }
      }
    };

    fetchConfig();
  }, []);

  // -----------------------------------------------------------------
  // 2. FETCH CURRENT VAT VALUE
  // -----------------------------------------------------------------
  const fetchVat = async (url) => {
    setLoading(true);
    setError(null);
    setMessage('');
    try {
      const response = await axios.get(`${url}/api/get-vat`);
      setVatAmount(response.data.vat?.toString() || '0');
    } catch (err) {
      console.error('Failed to fetch VAT:', err);
      setError('Failed to load VAT value.');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------
  // 3. HANDLE INPUT CHANGE
  // -----------------------------------------------------------------
  const handleVatChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setVatAmount(value);
    }
  };

  // -----------------------------------------------------------------
  // 4. SAVE VAT
  // -----------------------------------------------------------------
  const handleSaveVat = async () => {
    if (!vatAmount || isNaN(vatAmount) || Number(vatAmount) < 0) {
      setError('Please enter a valid VAT amount (≥ 0)');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage('');

    try {
      const response = await axios.post(
        `${baseUrl}/api/save-vat`,
        { vat: Number(vatAmount) },
        { headers: { 'Content-Type': 'application/json' } }
      );

      setMessage(response.data.message || 'VAT saved successfully');
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'Unknown error';
      setError(`Failed to save VAT: ${errMsg}`);
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------------------------------
  // 5. NAVIGATION
  // -----------------------------------------------------------------
  const handleGoBack = () => navigate('/admin');

  // -----------------------------------------------------------------
  // 6. RENDER
  // -----------------------------------------------------------------
  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '600px',
        margin: '0 auto',
        position: 'relative',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Back Button */}
      <button
        onClick={handleGoBack}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ecf0f1',
          border: '1px solid #bdc3c7',
          cursor: 'pointer',
          transition: 'background-color 0.3s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#3498db')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ecf0f1')}
        title="Back to Admin"
      >
        <FaArrowLeft style={{ fontSize: '24px', color: '#2c3e50' }} />
      </button>

      {/* Title */}
      <h2
        style={{
          textAlign: 'center',
          margin: '60px 0 30px',
          color: '#2c3e50',
          fontSize: '1.8rem',
          fontWeight: '600',
        }}
      >
        Set VAT Amount (%)
      </h2>

      {/* Loading */}
      {loading && (
        <div
          style={{
            textAlign: 'center',
            color: '#7f8c8d',
            fontSize: '1.1rem',
            marginBottom: '20px',
          }}
        >
          Loading VAT value...
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            backgroundColor: '#ffebee',
            color: '#c0392b',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: '500',
          }}
        >
          {error}
        </div>
      )}

      {/* Success Message */}
      {message && (
        <div
          style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: '500',
          }}
        >
          {message}
        </div>
      )}

      {/* Input + Save */}
      <div
        style={{
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <input
          type="text"
          inputMode="decimal"
          placeholder="e.g. 5.5"
          value={vatAmount}
          onChange={handleVatChange}
          disabled={loading || saving}
          style={{
            padding: '12px 16px',
            fontSize: '1.1rem',
            border: '1px solid #bdc3c7',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '220px',
            outline: 'none',
            transition: 'border-color 0.3s',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#3498db')}
          onBlur={(e) => (e.target.style.borderColor = '#bdc3c7')}
        />

        <button
          onClick={handleSaveVat}
          disabled={loading || saving || !vatAmount}
          style={{
            padding: '12px 24px',
            fontSize: '1.1rem',
            fontWeight: '500',
            backgroundColor:
              loading || saving || !vatAmount ? '#bdc3c7' : '#3498db',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor:
              loading || saving || !vatAmount ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s',
            minWidth: '120px',
          }}
          onMouseOver={(e) =>
            !(loading || saving || !vatAmount) &&
            (e.currentTarget.style.backgroundColor = '#2980b9')
          }
          onMouseOut={(e) =>
            !(loading || saving || !vatAmount) &&
            (e.currentTarget.style.backgroundColor = '#3498db')
          }
        >
          {saving ? 'Saving...' : 'Save VAT'}
        </button>
      </div>

      {/* Footer Info */}
      <div
        style={{
          marginTop: '50px',
          textAlign: 'center',
          color: '#7f8c8d',
          fontSize: '0.9rem',
        }}
      >
        VAT is applied as a percentage on taxable items.
        <br />
        Current server mode:{' '}
        <strong>{baseUrl ? 'Client (Remote)' : 'Server (Local)'}</strong>
      </div>
    </div>
  );
}

export default VatPage;