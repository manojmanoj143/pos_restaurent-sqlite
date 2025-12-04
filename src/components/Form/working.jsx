// src/components/Form/working.jsx - Updated with EmployeeList-like background and fixed back button design. No functional changes.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaCalendarAlt, FaSave, FaTrash, FaEdit } from 'react-icons/fa';

function Working() {
  const navigate = useNavigate();
  const [holidays, setHolidays] = useState(new Map()); // Map of date -> reason for current month
  const [allHolidays, setAllHolidays] = useState(new Map()); // Map of all dates -> reason for year
  const [showAllLeaves, setShowAllLeaves] = useState(false); // Toggle for showing all or month
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1)); // November 2025 (month 10)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [baseUrl, setBaseUrl] = useState('http://localhost:8000'); // FIXED: Always set to backend URL for server mode to avoid 405 errors
  const [totalWorkingDays, setTotalWorkingDays] = useState(0);
  const [totalLeaves, setTotalLeaves] = useState(0); // Track total leaves (holidays) for month
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [currentReason, setCurrentReason] = useState('');
  // Leap year helper
  const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  };
  // Fetch existing working days (holidays/leaves) for current month - UPDATED: Handle objects with date/reason
  const fetchWorkingDays = async () => {
    try {
      // Reset states before fetching to avoid stale data during navigation
      setHolidays(new Map());
      setTotalWorkingDays(0);
      setTotalLeaves(0);
      setError(null);
      setMessage('');
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const response = await axios.get(`${baseUrl}/api/working-days?year=${year}&month=${month}`);
      const holidayObjects = response.data.holidays || [];
      const holidayMap = new Map(holidayObjects.map(h => [h.date, h.reason]));
      setHolidays(holidayMap);
      let mapToUse = holidayMap;
      // Pre-populate defaults ONLY if no holidays fetched AND it's November (month 10)
      if (holidayMap.size === 0 && currentDate.getMonth() === 10) {
        const defaultHolidays = new Map([
          ['2025-11-02', 'diwali'],
          ['2025-11-09', 'weekly'],
          ['2025-11-16', 'weekly'],
          ['2025-11-23', 'weekly'],
          ['2025-11-30', 'weekly']
        ]);
        setHolidays(defaultHolidays);
        mapToUse = defaultHolidays;
      }
      calculateTotalWorkingDays(mapToUse);
    } catch (err) {
      console.error('Failed to fetch working days:', err);
      setError('Failed to fetch working days: ' + err.message);
      // On error, use empty map, or defaults only for November
      let mapToUse = new Map();
      if (currentDate.getMonth() === 10) {
        const defaultHolidays = new Map([
          ['2025-11-02', 'diwali'],
          ['2025-11-09', 'weekly'],
          ['2025-11-16', 'weekly'],
          ['2025-11-23', 'weekly'],
          ['2025-11-30', 'weekly']
        ]);
        setHolidays(defaultHolidays);
        mapToUse = defaultHolidays;
      } else {
        setHolidays(new Map());
      }
      calculateTotalWorkingDays(mapToUse);
    }
  };
  // Fetch all working days for the year
  const fetchAllWorkingDays = async () => {
    try {
      setError(null);
      const year = currentDate.getFullYear();
      const response = await axios.get(`${baseUrl}/api/working-days?year=${year}`);
      const holidayObjects = response.data.holidays || [];
      const holidayMap = new Map(holidayObjects.map(h => [h.date, h.reason]));
      setAllHolidays(holidayMap);
    } catch (err) {
      console.error('Failed to fetch all working days:', err);
      setError('Failed to fetch all working days: ' + err.message);
      setAllHolidays(new Map());
    }
  };
  // Toggle show all leaves
  const toggleShowAll = () => {
    const newVal = !showAllLeaves;
    if (newVal) {
      fetchAllWorkingDays();
    }
    setShowAllLeaves(newVal);
  };
  // Calculate total working days and leaves in the month (total days - holidays = working, holidays = leaves)
  // NOTE: This assumes all days minus holidays are "working days" (including weekends). If weekends should be excluded,
  // modify to count only Mon-Fri minus holidays.
  const calculateTotalWorkingDays = (holidayMap) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leaves = holidayMap.size;
    const workingDays = daysInMonth - leaves;
    setTotalLeaves(leaves);
    setTotalWorkingDays(workingDays);
  };
  useEffect(() => {
    fetchWorkingDays();
    if (showAllLeaves) {
      fetchAllWorkingDays();
    }
  }, [currentDate]); // Re-fetch when month/year changes
  // Open modal for add/edit
  const openModal = (date) => {
    setSelectedDate(date);
    setCurrentReason(holidays.get(date) || '');
    setShowModal(true);
  };
  // Handle update in modal
  const handleUpdate = () => {
    if (!currentReason.trim()) return;
    const newHolidays = new Map(holidays);
    newHolidays.set(selectedDate, currentReason.trim());
    setHolidays(newHolidays);
    // If showAll, also update allHolidays
    if (showAllLeaves) {
      const newAll = new Map(allHolidays);
      newAll.set(selectedDate, currentReason.trim());
      setAllHolidays(newAll);
    }
    calculateTotalWorkingDays(newHolidays);
    setShowModal(false);
  };
  // Handle remove in modal
  const handleRemove = () => {
    if (!holidays.has(selectedDate)) return;
    if (window.confirm(`Remove leave for ${selectedDate}?`)) {
      const newHolidays = new Map(holidays);
      newHolidays.delete(selectedDate);
      setHolidays(newHolidays);
      // If showAll, also update allHolidays
      if (showAllLeaves) {
        const newAll = new Map(allHolidays);
        newAll.delete(selectedDate);
        setAllHolidays(newAll);
      }
      calculateTotalWorkingDays(newHolidays);
      setShowModal(false);
    }
  };
  // Generate calendar days - Only current month days, pad with empty cells
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date(); // Current date: Nov 21, 2025
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0=Sun, 1=Mon, etc.
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays = [];
    // Empty cells for previous month padding
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push({ day: '', dateStr: '', isCurrentMonth: false, isToday: false });
    }
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = today.toDateString() === new Date(dateStr).toDateString();
      calendarDays.push({ day, dateStr, isCurrentMonth: true, isToday });
    }
    // Empty cells for next month padding to fill the grid (up to 6 rows)
    const currentLength = calendarDays.length;
    const remainingDays = 42 - currentLength; // 6 rows * 7 cols = 42
    for (let i = 0; i < remainingDays; i++) {
      calendarDays.push({ day: '', dateStr: '', isCurrentMonth: false, isToday: false });
    }
    return calendarDays;
  };
  // Handle submit (save holidays/leaves) - UPDATED: Send array of {date, reason}
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setMessage('');
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const holidaysArray = Array.from(holidays.entries()).map(([date, reason]) => ({ date, reason }));
      const data = {
        year,
        month,
        holidays: holidaysArray,
        totalWorkingDays,
      };
      const response = await axios.post(`${baseUrl}/api/working-days`, data);
      setMessage(`Working days saved successfully! Total working days in ${month}/${year}: ${totalWorkingDays}, Total leaves: ${totalLeaves}`);
    } catch (err) {
      console.error('Failed to save working days:', err);
      setError('Failed to save working days: ' + err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };
  // Navigate to next/prev month
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const calendarDays = generateCalendarDays();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  const monthNum = String(currentDate.getMonth() + 1).padStart(2, '0');
  const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
  // Compute display values for summary
  const displayHolidaysMap = showAllLeaves ? allHolidays : holidays;
  const displayLeaves = displayHolidaysMap.size;
  const totalDays = showAllLeaves ? (isLeapYear(year) ? 366 : 365) : daysInMonth;
  const displayWorking = totalDays - displayLeaves;
  const period = showAllLeaves ? `Year ${year}` : `${monthName} ${year}`;
  // Display entries for table
  const displayEntries = Array.from(displayHolidaysMap.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  // Grouped leaves for table display
  const groupedLeaves = {};
  displayEntries.forEach(([date, reason]) => {
    if (!groupedLeaves[reason]) {
      groupedLeaves[reason] = { count: 0, dates: [] };
    }
    groupedLeaves[reason].count++;
    groupedLeaves[reason].dates.push(date);
  });
  const groupedArray = Object.keys(groupedLeaves).map(reason => ({
    reason,
    ...groupedLeaves[reason]
  })).sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
  // Side Panel Styles - UPDATED: A4-like paper styling, equal width to calendar (500px), no fixed positioning, height fit-content
  const sidePanelStyle = {
    width: '500px',
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '5px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    textAlign: 'left',
    border: '1px solid #ccc',
    // A4-like paper styling
    fontFamily: 'Arial, sans-serif',
    fontSize: '12px',
    lineHeight: '1.4',
    margin: '0',
    overflowY: 'auto',
    maxHeight: '80vh',
    color: '#555', // UPDATED: Lighter black/gray for text
    height: 'fit-content', // Ensure same height alignment as calendar
  };
  const headerStyle = {
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '2px solid #555', // UPDATED: Lighter border
    color: '#555', // UPDATED: Lighter color
  };
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '10px',
    fontSize: '14px', // UPDATED: Increased font size for better visibility
  };
  const thStyle = {
    border: '1px solid #555', // UPDATED: Lighter border
    padding: '10px', // UPDATED: Increased padding
    backgroundColor: '#f0f0f0',
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: '14px', // UPDATED: Increased font size
    color: '#555', // UPDATED: Lighter color
  };
  const tdStyle = {
    border: '1px solid #555', // UPDATED: Lighter border
    padding: '10px', // UPDATED: Increased padding
    verticalAlign: 'top',
    textAlign: 'left',
    fontWeight: '600', // UPDATED: Made text bolder for visibility (strong-like)
    fontSize: '14px', // UPDATED: Increased font size
    color: '#555', // UPDATED: Lighter color
  };
  const filterBtnStyle = {
    padding: '5px 10px',
    backgroundColor: showAllLeaves ? '#e74c3c' : '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '11px',
  };
  // Summary Styles - At bottom, bigger font, attractive, no colors
  const summaryStyle = {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '5px',
    textAlign: 'center',
  };
  const summaryHeaderStyle = {
    color: '#555', // UPDATED: Lighter color
    marginBottom: '15px',
    fontSize: '14px',
    fontWeight: 'bold',
  };
  const summaryTotalsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#555', // UPDATED: Lighter color
  };
  const summaryNoteStyle = {
    fontSize: '12px',
    color: '#777', // UPDATED: Even lighter for notes
  };
  // Modal Styles
  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  };
  const modalContentStyle = {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '10px',
    width: '400px',
    maxWidth: '90vw',
    textAlign: 'left',
    color: '#555', // UPDATED: Lighter color
  };
  const modalBtnStyle = {
    padding: '8px 16px',
    margin: '5px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  };
  const updateBtnStyle = { ...modalBtnStyle, backgroundColor: '#3498db', color: '#fff' };
  const removeBtnStyle = { ...modalBtnStyle, backgroundColor: '#e74c3c', color: '#fff' };
  const cancelBtnStyle = { ...modalBtnStyle, backgroundColor: '#bdc3c7', color: '#fff' };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Fixed Back Button in Top-Left Corner - Styled like EmployeeList */}
      <button
        onClick={() => navigate('/company-details')}
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
        disabled={loading}
      >
        <FaArrowLeft /> Back to Company Details
      </button>
      {/* Main Container - Like EmployeeList Card */}
      <div style={{
        maxWidth: '1020px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Centered Content Container - UPDATED: Equal widths (500px each), reduced total maxWidth to 1020px, centered with margin auto */}
        <div style={{
          display: 'flex',
          gap: '20px',
          maxWidth: '1020px', // 500 + 20 + 500 = 1020px for equal panels
          margin: '0 auto',
          width: '100%',
          flex: 1,
        }}>
          {/* Left: Calendar Container - UPDATED: Equal width maxWidth 500px, height fit-content for alignment */}
          <div style={{
            flex: 1,
            maxWidth: '500px',
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            color: '#555', // UPDATED: Lighter color for all text
            height: 'fit-content', // Ensure same height alignment with side panel
          }}>
            <h2 style={{ textAlign: 'center', color: '#555', fontSize: '2rem', fontWeight: '600', marginBottom: '30px' }}> {/* UPDATED: Lighter color */}
              <FaCalendarAlt style={{ marginRight: '10px' }} /> Company Working Days & Holidays
            </h2>
            {error && (
              <div style={{ backgroundColor: '#ffebee', padding: '10px', marginBottom: '20px', color: '#c0392b', borderRadius: '15px', textAlign: 'center' }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{ backgroundColor: '#d4edda', padding: '10px', marginBottom: '20px', color: '#155724', borderRadius: '15px', textAlign: 'center' }}>
                {message}
              </div>
            )}
            {/* Month Navigation - UPDATED: Flex layout for single horizontal line, centered */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={goToPrevMonth}
                style={{ padding: '8px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
              >
                Previous Month
              </button>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#555',paddingLeft:'15px' }}> {/* UPDATED: Lighter color */}
                {monthName} {year}
              </span>
              <button
                onClick={goToNextMonth}
                style={{ padding: '8px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
              >
                Next Month
              </button>
            </div>
            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', marginBottom: '20px' }}>
              {/* Weekday Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', padding: '10px', backgroundColor: '#ecf0f1', borderRadius: '5px', color: '#555' }}> {/* UPDATED: Lighter color */}
                  {day}
                </div>
              ))}
              {/* Calendar Days */}
              {calendarDays.map((item, index) => {
                const isHoliday = item.isCurrentMonth && holidays.has(item.dateStr);
                const isClickable = item.isCurrentMonth && item.day !== '';
                const reason = isHoliday ? holidays.get(item.dateStr) : '';
                const titleText = isClickable ? (isHoliday ? `Reason: ${reason} - Click to edit/remove` : 'Click to add leave with reason') : '';
                const dayStyle = {
                  textAlign: 'left',
                  padding: '10px 8px',
                  borderRadius: '5px',
                  cursor: isClickable ? 'pointer' : 'default',
                  border: isHoliday ? '2px solid #e74c3c' : '1px solid #ddd',
                  backgroundColor: isHoliday ? '#fdf2f2' : (item.isToday ? '#3498db' : (item.isCurrentMonth && item.day !== '' ? '#fff' : '#f8f9fa')),
                  color: item.isToday ? '#fff' : (isHoliday ? '#e74c3c' : (item.isCurrentMonth && item.day !== '' ? '#555' : 'transparent')), // UPDATED: Lighter color
                  minHeight: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                };
                return (
                  <div
                    key={index}
                    style={dayStyle}
                    onClick={() => isClickable && openModal(item.dateStr)}
                    title={titleText}
                  >
                    <span>{item.day}</span>
                    {item.isToday && <div style={{ fontSize: '0.8rem', marginTop: '2px', color: '#fff' }}>Today</div>}
                  </div>
                );
              })}
            </div>
            {/* Save Button - REMOVED: Bulk Action Button */}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: loading ? '#bdc3c7' : '#3498db',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '15px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {loading ? 'Saving...' : <><FaSave style={{ marginRight: '5px' }} />Save Holidays & Working Days</>}
                </button>
              </div>
            </form>
            {/* Instructions */}
            <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '10px', fontSize: '0.9rem', color: '#555' }}> {/* UPDATED: Lighter color */}
              <strong>Instructions:</strong> Click on any date in the current month to add/edit/remove leave with reason (e.g., festival, weekly leave). Use the right panel to view leaves grouped by type with counts. Leaves are marked with red borders. Total working days and leaves are auto-calculated. Save to update for the month. Only current month dates are displayed; previous and next month days are hidden with empty cells for alignment.
            </div>
          </div>
          {/* Right: Side Panel - A4-like Form with Month/Year Header, Filter Button, Grouped Table, Summary at Bottom - UPDATED: Equal width 500px, height fit-content for alignment */}
          <div style={sidePanelStyle}>
            {/* A4-like Header */}
            <div style={headerStyle}>
              Company Leaves Form - {monthName} {year}
            </div>
            {/* Filter Toggle Button */}
            <div style={{ textAlign: 'right', marginBottom: '10px' }}>
              <button onClick={toggleShowAll} style={filterBtnStyle}>
                {showAllLeaves ? 'Show Month Only' : 'Show All Leaves'}
              </button>
            </div>
            {/* Table Section */}
            <div style={{ width: '100%' }}>
              <h4 style={{ color: '#555', marginBottom: '10px', fontSize: '13px' }}> {/* UPDATED: Lighter color */}
                Leaves Details {showAllLeaves ? '(All Months)' : '(Current Month)'}
              </h4>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Leave Type</th>
                    <th style={thStyle}>Count</th>
                    <th style={thStyle}>Dates</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedArray.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: '#777', fontStyle: 'italic' }}> {/* UPDATED: Lighter color */}
                        No leaves {showAllLeaves ? `for ${year}` : 'added yet.'}
                      </td>
                    </tr>
                  ) : (
                    groupedArray.map(({ reason, count, dates }) => {
                      const dateStrs = dates.map(d => {
                        const dt = new Date(d);
                        return dt.getDate().toString().padStart(2, '0') + '-' + dt.toLocaleDateString('en-GB', { month: 'short' }) + '-' + dt.getFullYear();
                      }).join(', ');
                      return (
                        <tr key={reason}>
                          <td style={tdStyle}><strong>{reason} ({count})</strong></td> {/* UPDATED: Added <strong> for visibility */}
                          <td style={tdStyle}><strong>{count}</strong></td> {/* UPDATED: Added <strong> for visibility */}
                          <td style={tdStyle}><strong>{dateStrs}</strong></td> {/* UPDATED: Added <strong> for visibility */}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {/* Summary at Bottom */}
            <div style={summaryStyle}>
              <h4 style={summaryHeaderStyle}>Summary</h4>
              <div style={summaryTotalsStyle}>
                <span>Total Leaves: {displayLeaves}</span>
                <span>Working Days: {displayWorking}</span>
              </div>
              <div style={summaryNoteStyle}>
                * Total Days: {totalDays} ({period})
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal for Add/Edit Reason */}
      {showModal && (
        <div style={modalOverlayStyle} onClick={() => setShowModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#555' }}>{holidays.has(selectedDate) ? 'Edit Leave Reason' : 'Add Leave Reason'} for {selectedDate}</h3> {/* UPDATED: Lighter color */}
            <label style={{ display: 'block', margin: '10px 0 5px', color: '#555' }}>Reason (e.g., festival, weekly leave):</label> {/* UPDATED: Lighter color */}
            <input
              type="text"
              value={currentReason}
              onChange={(e) => setCurrentReason(e.target.value)}
              placeholder="Enter reason..."
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd', marginBottom: '10px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {holidays.has(selectedDate) && (
                <button onClick={handleRemove} style={removeBtnStyle}>
                  <FaTrash style={{ marginRight: '5px' }} /> Remove
                </button>
              )}
              <button onClick={handleUpdate} disabled={!currentReason.trim()} style={updateBtnStyle}>
                <FaEdit style={{ marginRight: '5px' }} /> {holidays.has(selectedDate) ? 'Update' : 'Add'}
              </button>
              <button onClick={() => setShowModal(false)} style={cancelBtnStyle}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Working;