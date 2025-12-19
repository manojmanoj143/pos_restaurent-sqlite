// src/components/Form/holidaydoctype.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalendarCheck, FaAngleLeft, FaAngleRight, FaUmbrellaBeach, FaCalendarDay } from 'react-icons/fa';

const HolidayDocType = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Retrieve assigned_schedule from state or fallback to null
  const { assigned_schedule } = location.state || {};

  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stats States
  const [stats, setStats] = useState({
    totalHolidays: 0,
    totalWeeklyOffs: 0
  });

  // Filter States
  const [filters, setFilters] = useState({
    id: '',
    date: '',
    description: ''
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Show 50 items per page

  useEffect(() => {
    if (assigned_schedule) {
      generateHolidayList();
    } else {
      setError('No schedule assigned. Please assign a schedule first.');
      setLoading(false);
    }
  }, [assigned_schedule]);

  const generateHolidayList = () => {
    if (!assigned_schedule?.start_date || !assigned_schedule?.end_date || !assigned_schedule?.weekly_off) {
      setError('Invalid schedule data.');
      setLoading(false);
      return;
    }

    const start = new Date(assigned_schedule.start_date);
    const end = new Date(assigned_schedule.end_date);
    const weeklyOffDays = assigned_schedule.weekly_off;
    const specialHolidays = assigned_schedule.special_day_assignments?.filter(sd => sd.type === 'Holiday' && sd.is_observed) || [];

    const allHolidays = [];
    let weeklyOffCount = 0;

    // 1. Generate Weekly Offs
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const dayAbbr = d.toLocaleDateString('en-US', { weekday: 'short' });
      const isWeeklyOff = weeklyOffDays.some(off => off === dayAbbr);

      if (isWeeklyOff) {
        weeklyOffCount++;
        // Format: 05-01-2025
        const formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
        allHolidays.push({
          dateObj: new Date(d),
          date: formattedDate,
          description: dayName, // "Sunday"
          type: 'Weekly Off'
        });
      }
    }

    // 2. Add Special Holidays
    const specialHolidaysCount = specialHolidays.length;
    specialHolidays.forEach(sh => {
      const d = new Date(sh.date);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
      allHolidays.push({
        dateObj: d,
        date: formattedDate,
        description: `${dayName} - ${sh.description}`,
        type: 'Holiday'
      });
    });

    // Sort by date
    allHolidays.sort((a, b) => a.dateObj - b.dateObj);

    // Add static ID for filtering
    const holidaysWithId = allHolidays.map((item, index) => ({
      ...item,
      id: index + 1
    }));

    setStats({
      totalHolidays: specialHolidaysCount,
      totalWeeklyOffs: weeklyOffCount
    });

    setHolidays(holidaysWithId);
    setLoading(false);
  };

  // Filter Logic
  const filteredHolidays = holidays.filter((item) => {
    // 1. ID Filter
    const idMatch = item.id.toString().includes(filters.id);

    // 2. Date Filter
    let dateMatch = true;
    if (filters.date) {
      // filters.date is yyyy-mm-dd
      // item.date is dd-mm-yyyy
      const [year, month, day] = filters.date.split('-');
      const formattedFilterDate = `${day}-${month}-${year}`;
      dateMatch = item.date === formattedFilterDate;
    }

    // 3. Description Filter (checks both Description and Type)
    const combinedDescription = `${item.description} ${item.type}`.toLowerCase();
    const descMatch = combinedDescription.includes(filters.description.toLowerCase());

    return idMatch && dateMatch && descMatch;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHolidays.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHolidays.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle Filter Change
  const handleFilterChange = (e, field) => {
    setFilters({
      ...filters,
      [field]: e.target.value
    });
    setCurrentPage(1); // Reset to first page on filter change
  };

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
          <p>Loading holiday list...</p>
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
        onClick={() => navigate(-1)} // Correct navigation to go back to previous page (Employee Details)
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
            <FaCalendarCheck style={{ color: '#3498db', fontSize: '2rem' }} />
            Holiday List - {assigned_schedule?.schedule_name || 'Schedule'}
          </h2>
          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>

        {/* Stats Summary Section - NEW */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
          borderBottom: '2px solid #3498db',
          paddingBottom: '20px'
        }}>
          {/* Total Holidays Card */}
          <div style={{
            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(231, 76, 60, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaUmbrellaBeach style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.9 }} />
            <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalHolidays}</h3>
            <p style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>Total Holidays</p>
          </div>

          {/* Total Weekly Offs Card */}
          <div style={{
            background: 'linear-gradient(135deg, #f39c12 0%, #d35400 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(243, 156, 18, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaCalendarDay style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.9 }} />
            <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalWeeklyOffs}</h3>
            <p style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>Weekly Offs</p>
          </div>

          {/* Combined Total Card - Optional but nice */}
          <div style={{
            background: 'linear-gradient(135deg, #27ae60 0%, #219150 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(39, 174, 96, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaCalendarCheck style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.9 }} />
            <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalHolidays + stats.totalWeeklyOffs}</h3>
            <p style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>Total Days Off</p>
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
              </tr>
              {/* Filter Row */}
              <tr style={{ backgroundColor: '#f1f8ff', borderBottom: '1px solid #dee2e6' }}>
                <th style={{ padding: '10px', textAlign: 'center' }}>
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={filters.id}
                    onChange={(e) => handleFilterChange(e, 'id')}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '5px',
                      border: '1px solid #ced4da',
                      fontSize: '0.9rem',
                      textAlign: 'center'
                    }}
                  />
                </th>
                <th style={{ padding: '10px', textAlign: 'left' }}>
                  <input
                    type="date"
                    placeholder="Select Date..."
                    value={filters.date}
                    onChange={(e) => handleFilterChange(e, 'date')}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '5px',
                      border: '1px solid #ced4da',
                      fontSize: '0.9rem'
                    }}
                  />
                </th>
                <th style={{ padding: '10px', textAlign: 'left' }}>
                  <input
                    type="text"
                    placeholder="Filter Description or Type..."
                    value={filters.description}
                    onChange={(e) => handleFilterChange(e, 'description')}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '5px',
                      border: '1px solid #ced4da',
                      fontSize: '0.9rem'
                    }}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((holiday, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e9ecef', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f8ff'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '12px 15px', textAlign: 'center', color: '#6c757d' }}>
                      {holiday.id}
                    </td>
                    <td style={{ padding: '12px 15px', color: '#2c3e50', fontWeight: '500' }}>
                      {holiday.date}
                    </td>
                    <td style={{ padding: '12px 15px', color: '#2c3e50' }}>
                      {holiday.description} <span style={{ fontSize: '0.8rem', color: holiday.type === 'Holiday' ? '#e74c3c' : '#f39c12', marginLeft: '5px' }}>({holiday.type})</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#6c757d', fontStyle: 'italic' }}>
                    No holidays found matching your filters.
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

export default HolidayDocType;