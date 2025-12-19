// src/components/Form/extendeddoctype.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaClock, FaCalendarCheck, FaAngleLeft, FaAngleRight, FaHistory } from 'react-icons/fa';

const ExtendedDocType = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Retrieve assigned_schedule and employee from state or fallback to null
  const { assigned_schedule, employee } = location.state || {};

  const [extendeds, setExtendeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stats States
  const [stats, setStats] = useState({
    totalExtendedDays: 0
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Show 50 items per page

  useEffect(() => {
    if (assigned_schedule) {
      generateExtendedList();
    } else {
      setError('No schedule assigned. Please assign a schedule first.');
      setLoading(false);
    }
  }, [assigned_schedule]);

  const generateExtendedList = () => {
    if (!assigned_schedule?.start_date || !assigned_schedule?.end_date) {
      setError('Invalid schedule data.');
      setLoading(false);
      return;
    }

    const specialExtendeds = assigned_schedule.special_day_assignments?.filter(sd => sd.type === 'Extended' && sd.is_observed) || [];
    const allExtendeds = [];

    // Process Special Extended Days
    specialExtendeds.forEach(se => {
      const d = new Date(se.date);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      // Format: 05-01-2025
      const formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

      const extendedStart = se.extended_start || 'N/A';
      const extendedEnd = se.extended_end || 'N/A';

      allExtendeds.push({
        dateObj: d,
        date: formattedDate,
        dayName: dayName,
        description: se.description || 'Extended Shift',
        extendedTime: `${extendedStart} - ${extendedEnd}`
      });
    });

    // Sort by date
    allExtendeds.sort((a, b) => a.dateObj - b.dateObj);

    setStats({
      totalExtendedDays: allExtendeds.length
    });

    setExtendeds(allExtendeds);
    setLoading(false);
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = extendeds.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(extendeds.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Generate Page Numbers for Pagination Control
  const getPageNumbers = () => {
    const pageNumbers = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      // Logic for "First 1 2 ... Last" style simplified
      if (currentPage <= 3) {
        pageNumbers.push(1, 2, 3, 4, 5);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pageNumbers.push(currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2);
      }
    }
    return pageNumbers;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)'
      }}>
        <div style={{ textAlign: 'center', color: '#3498db', fontSize: '18px' }}>
          <FaCalendarCheck style={{ fontSize: '48px', marginBottom: '20px' }} />
          <p>Loading extended hours list...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative',
      fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Fixed Back Button */}
      <button
        onClick={() => navigate(-1)} // Navigates back to Employee Details
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
          transition: 'all 0.3s ease',
          background: 'white' // Added white background for visibility on gradient
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#3498db';
          e.target.style.color = '#ffffff';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'white';
          e.target.style.color = '#3498db';
        }}
      >
        <FaArrowLeft /> Back
      </button>

      {/* Main Container */}
      <div style={{
        maxWidth: '1000px', // Adjusted width
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h2 style={{
            color: '#2c3e50',
            margin: '0 0 10px 0',
            fontSize: '1.8rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <FaClock style={{ color: '#3498db', fontSize: '2rem' }} />
            Extended Hours List - {assigned_schedule?.schedule_name || 'Schedule'}
          </h2>
          {employee && <p style={{ color: '#7f8c8d', margin: '5px 0' }}>Employee: {employee.name}</p>}
          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>

        {/* Stats Summary Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #3498db',
          paddingBottom: '20px'
        }}>
          {/* Total Extended Days Card */}
          <div style={{
            background: 'linear-gradient(135deg, #27ae60 0%, #219150 100%)', // Distinct green theme for Extended
            color: 'white',
            padding: '20px 40px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(39, 174, 96, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '200px'
          }}>
            <FaHistory style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.9 }} />
            <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalExtendedDays}</h3>
            <p style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>Total Extended Days</p>
          </div>
        </div>

        {/* Table Section */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '15px', textAlign: 'center', color: '#495057', fontWeight: '600', width: '80px' }}>No.</th>
                <th style={{ padding: '15px', textAlign: 'left', color: '#495057', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '15px', textAlign: 'left', color: '#495057', fontWeight: '600' }}>Description</th>
                <th style={{ padding: '15px', textAlign: 'left', color: '#495057', fontWeight: '600' }}>Extended Time</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e9ecef', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f8ff'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '12px 15px', textAlign: 'center', color: '#6c757d' }}>
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td style={{ padding: '12px 15px', color: '#2c3e50', fontWeight: '500' }}>
                      {item.date} <span style={{ fontSize: '0.85rem', color: '#7f8c8d', marginLeft: '5px' }}>({item.dayName})</span>
                    </td>
                    <td style={{ padding: '12px 15px', color: '#2c3e50' }}>
                      {item.description}
                    </td>
                    <td style={{ padding: '12px 15px', color: '#27ae60', fontWeight: 'bold' }}>
                      {item.extendedTime}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#6c757d', fontStyle: 'italic' }}>
                    No extended hours found for this schedule.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '30px',
            gap: '5px'
          }}>
            <button
              onClick={() => paginate(1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                border: '1px solid #dee2e6',
                background: currentPage === 1 ? '#e9ecef' : 'white',
                color: currentPage === 1 ? '#6c757d' : '#3498db',
                borderRadius: '5px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              First
            </button>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                border: '1px solid #dee2e6',
                background: currentPage === 1 ? '#e9ecef' : 'white',
                color: currentPage === 1 ? '#6c757d' : '#3498db',
                borderRadius: '5px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <FaAngleLeft />
            </button>

            {getPageNumbers().map((number) => (
              <button
                key={number}
                onClick={() => paginate(number)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #dee2e6',
                  background: currentPage === number ? '#3498db' : 'white',
                  color: currentPage === number ? 'white' : '#3498db',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {number}
              </button>
            ))}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                border: '1px solid #dee2e6',
                background: currentPage === totalPages ? '#e9ecef' : 'white',
                color: currentPage === totalPages ? '#6c757d' : '#3498db',
                borderRadius: '5px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <FaAngleRight />
            </button>
            <button
              onClick={() => paginate(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                border: '1px solid #dee2e6',
                background: currentPage === totalPages ? '#e9ecef' : 'white',
                color: currentPage === totalPages ? '#6c757d' : '#3498db',
                borderRadius: '5px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Last
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ExtendedDocType;