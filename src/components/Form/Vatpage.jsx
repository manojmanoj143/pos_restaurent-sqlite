// Vatpage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft } from 'react-icons/fa';

function VatPage() {
  const navigate = useNavigate();
  const [vatAmount, setVatAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const handleGoBack = () => navigate('/admin');

  const handleVatChange = (e) => {
    setVatAmount(e.target.value);
  };

  const handleSaveVat = async () => {
    if (!vatAmount || isNaN(vatAmount)) {
      setError('Please enter a valid VAT amount');
      return;
    }
    try {
      setLoading(true);
      setMessage('');
      setError(null);
      const response = await axios.post('/api/save-vat', { vat: vatAmount });
      setMessage('VAT saved successfully');
    } catch (err) {
      setError('Failed to save VAT: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    axios.get('/api/get-vat')
      .then(response => {
        setVatAmount(response.data.vat);
      })
      .catch(error => {
        console.error('Failed to fetch VAT:', error);
      });
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
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
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = '#3498db')}
        onMouseOut={(e) => (e.target.style.backgroundColor = '#ecf0f1')}
      >
        <FaArrowLeft style={{ fontSize: '24px', color: '#2c3e50' }} />
      </button>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Set VAT Amount</h2>
      {error && (
        <div style={{ backgroundColor: '#ffebee', padding: '10px', marginBottom: '20px', color: '#c0392b', borderRadius: '5px', textAlign: 'center' }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ backgroundColor: '#d4edda', padding: '10px', marginBottom: '20px', color: '#155724', borderRadius: '5px', textAlign: 'center' }}>
          {message}
        </div>
      )}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <input
          type="number"
          placeholder="Enter VAT Amount"
          value={vatAmount}
          onChange={handleVatChange}
          style={{
            padding: '10px',
            border: '1px solid #bdc3c7',
            borderRadius: '5px',
            fontSize: '1rem',
            width: '100%',
          }}
        />
        <button
          onClick={handleSaveVat}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#bdc3c7' : '#3498db',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            transition: 'background-color 0.3s',
          }}
          onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#2980b9')}
          onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#3498db')}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
export default VatPage;