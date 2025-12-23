// src/components/Form/attendanceview.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaArrowLeft, FaUser, FaCalendarAlt, FaClock, FaCheck, FaTimes,
  FaEdit, FaTrash, FaEye, FaSearch, FaFilter, FaBriefcase, FaBed,
  FaStar, FaExclamationTriangle
} from 'react-icons/fa';

const AttendanceView = () => {
  const navigate = useNavigate();
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]); // Add logic to fetch shifts
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [baseUrl, setBaseUrl] = useState('http://localhost:8000');

  // Modal States
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null); // Stores ID of record to delete

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Initial Fetch: Config & Employees & Shifts
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Get Config
        const confRes = await axios.get("http://localhost:8000/api/network_info");
        const { config: appConfig } = confRes.data;
        const currentBaseUrl = appConfig.mode === "client" ? `http://${appConfig.server_ip}:8000` : 'http://localhost:8000';
        setBaseUrl(currentBaseUrl);

        // 2. Get Employees
        const empRes = await axios.get(`${currentBaseUrl}/api/add-employee`);
        setEmployees(empRes.data || []);

        // 3. Get Shifts (to display split details)
        const shiftRes = await axios.get(`${currentBaseUrl}/api/schedules`);
        setShifts(shiftRes.data || []);

      } catch (err) {
        console.error("Init Error:", err);
        setError("Failed to initialize. Ensure server is running.");
      }
    };
    init();
  }, []);

  // Fetch Attendance when filters change
  useEffect(() => {
    if (baseUrl && selectedEmployee && selectedMonth) {
      fetchData();
    } else {
      setAttendances([]);
      setSummary(null);
    }
  }, [baseUrl, selectedEmployee, selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${baseUrl}/api/attendance?employee_id=${selectedEmployee}&month=${selectedMonth}`;
      const response = await axios.get(url);

      let data = [];
      if (response.data.summary && response.data.records) {
        data = response.data.records;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data.records) {
        data = response.data.records;
      }

      setAttendances(data);
      calculateSummary(data);

      setLoading(false);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(`Failed to fetch data: ${err.response?.data?.error || err.message}`);
      setLoading(false);
    }
  };

  // Helper to get planned time display - MOVED UP
  const getPlannedTimeDisplay = (att) => {
    // Return only the record's specific time. 
    // DO NOT look up the entire shift definition here, because we want to show 
    // ONLY what is actually existent in the record.
    return `${att.planned_start_time} - ${att.planned_end_time}`;
  };

  // Group records by Employee + Date
  const getGroupedAttendances = () => {
    const groups = {};
    attendances.forEach(att => {
      const key = `${att.attendance_date}_${att.employee_id}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(att);
    });

    // Convert groups to array of singular display items
    return Object.values(groups).map(group => {
      const base = { ...group[0] }; // Clone first record as base
      if (group.length > 1) {
        // It's a split shift day with multiple EXISTING records
        // Sort by time
        group.sort((a, b) => (a.planned_start_time || '').localeCompare(b.planned_start_time || ''));

        // Merge Fields
        base.planned_time_display = group.map(g => `${g.planned_start_time}-${g.planned_end_time}`).join(', ');
        base.actual_time_display = group.map(g => `${g.actual_check_in || 'N/A'}-${g.actual_check_out || 'N/A'}`).join(', ');
        base.worked_minutes = group.reduce((sum, g) => sum + (Number(g.worked_minutes) || 0), 0);

        // Combine unique notes
        const allNotes = [...new Set(group.map(g => g.notes).filter(n => n))].join('; ');
        base.notes = allNotes;

        // Mark as merged
        base.isMerged = true;
        base.relatedRecords = group;
      } else {
        // Single record (Even if part of a split shift, if only one exists, we show only one)
        // If it's a virtual record (projected), getPlannedTimeDisplay will show its scheduled time.
        // If it's a real record, it shows its stored planned time.
        base.planned_time_display = getPlannedTimeDisplay(base);
        base.actual_time_display = `${base.actual_check_in || 'N/A'} - ${base.actual_check_out || 'N/A'}`;
      }
      return base;
    }).sort((a, b) => b.attendance_date.localeCompare(a.attendance_date)); // Sort by date desc
  };

  const groupedAttendances = getGroupedAttendances();

  const calculateSummary = (data) => {
    const stats = {
      total_days: 0, // Unique days
      working_days: 0,
      weekly_offs: 0,
      holidays: 0, // Now counts based on special_day_type too
      extended_days: 0,
      special_shifts: 0,
      on_leave: 0
    };

    // Use a Set to track unique (employee + date) to count distinct days
    const uniqueDays = new Set();

    data.forEach(att => {
      const key = `${att.attendance_date}_${att.employee_id}`;
      // We process every unique day. 
      // Note: If multiple records exist for one day (split), we only count day-level stats once.
      if (!uniqueDays.has(key)) {
        uniqueDays.add(key);
        stats.total_days++;

        const status = att.status;
        const specialType = att.special_day_type;

        // 1. Weekly Offs
        if (status === 'WeeklyOff' || specialType === 'WeeklyOff') {
          stats.weekly_offs++;
        }

        // 2. Holidays (Prioritize Special Type)
        else if (status === 'Holiday' || specialType === 'Holiday') {
          stats.holidays++;
        }

        // 3. On Leave (Count as leave only if NOT a Holiday/WeeklyOff)
        else if (status === 'On Leave' || status === 'Leave' || status === 'Paid Leave') {
          stats.on_leave++;
        }

        // 4. Extended (Can overlap with Working Day, so separate check often preferred, 
        // but if mutually exclusive in user model, keep structure. 
        // Usually Extended is a type of working day or special day.)
        if (status === 'Extended' || specialType === 'Extended') {
          stats.extended_days++;
        }

        // 5. Special Shifts
        if (specialType && !['None', 'WeeklyOff', 'Holiday', 'Extended'].includes(specialType)) {
          stats.special_shifts++;
        }

        // 6. Working Days
        // Statuses that imply work: Present, HalfDay, Extended
        // Statuses that imply NO work: Absent, On Leave, Leave, WeeklyOff, Holiday
        const nonWorkingStatuses = ['Absent', 'On Leave', 'Leave', 'WeeklyOff', 'Holiday'];
        if (!nonWorkingStatuses.includes(status)) {
          // If it's a Holiday date but status is Present, it IS a working day (worked on holiday)
          stats.working_days++;
        }
      }
    });

    setSummary(stats);
  };

  // --- DELETE HANDLERS ---

  // 1. Triggered when trash icon is clicked (opens modal)
  const initiateDelete = (id) => {
    setItemToDelete(id);
  };

  // 2. Triggered when "Yes, Delete" is clicked in the modal
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await axios.delete(`${baseUrl}/api/attendance`, { data: { _id: itemToDelete } });
      setMessage('Record deleted successfully');
      fetchData(); // Refresh table
    } catch (err) {
      setError(`Delete failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setItemToDelete(null); // Close modal
    }
  };

  // 3. Triggered when "Cancel" is clicked
  const cancelDelete = () => {
    setItemToDelete(null);
  };

  // --- END DELETE HANDLERS ---

  const handleEdit = (rec) => {
    // Navigate by Employee & Date so form loads all records for that day (split slots)
    // Pass the record in state just in case, but form should rely on fetching by date
    navigate(`/attendance?employee_id=${rec.employee_id}&date=${rec.attendance_date}`, {
      state: { attendance: rec.isMerged ? rec.relatedRecords[0] : rec }
    });
  };

  // Helper to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return '#27ae60';
      case 'Absent': return '#e74c3c';
      case 'WeeklyOff': return '#95a5a6';
      case 'Holiday': return '#8e44ad';
      case 'Extended': return '#f39c12';
      case 'HalfDay': return '#d35400';
      case 'On Leave': return '#e67e22';
      case 'Paid Leave': return '#16a085';
      default: return '#2c3e50';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin')}
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
          background: 'white'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#3498db';
          e.currentTarget.style.color = '#ffffff';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.color = '#3498db';
        }}
      >
        <FaArrowLeft /> Back to Admin
      </button>

      {/* Main Content */}
      <div style={{
        maxWidth: '1300px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>

        {/* Header & Controls */}
        <div style={{ borderBottom: '2px solid #f0f2f5', paddingBottom: '20px', marginBottom: '30px' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaClock style={{ color: '#3498db' }} /> Monthly Attendance View
          </h2>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'end' }}>
            <div style={{ flex: '1', minWidth: '250px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#34495e' }}>Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #bdc3c7',
                  fontSize: '1rem', outline: 'none', transition: 'border 0.3s'
                }}
              />
            </div>

            <div style={{ flex: '1', minWidth: '250px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#34495e' }}>Select Employee</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                style={{
                  width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #bdc3c7',
                  fontSize: '1rem', outline: 'none', background: 'white'
                }}
              >
                <option value="">-- Choose Employee --</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId || 'N/A'})</option>
                ))}
              </select>
            </div>

            <div style={{ paddingBottom: '2px' }}>
              <button
                onClick={() => navigate('/attendance')}
                style={{
                  padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none',
                  borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <FaEdit /> Manual Entry
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ef9a9a' }}>{error}</div>}
        {message && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #a5d6a7' }}>{message}</div>}

        {/* Summary Cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <SummaryCard title="Total Days" value={summary.total_days} icon={<FaCalendarAlt />} color="#3498db" />
            <SummaryCard title="Total Working Days" value={summary.working_days} icon={<FaBriefcase />} color="#27ae60" />
            <SummaryCard title="Total Extended" value={summary.extended_days} icon={<FaClock />} color="#f39c12" />
            <SummaryCard title="Total Special Shifts" value={summary.special_shifts} icon={<FaFilter />} color="#d35400" />
          </div>
        )}

        {/* Data Table */}
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e0e0e0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(to right, #3498db, #2980b9)', color: 'white' }}>
                <th style={{ padding: '15px', textAlign: 'left' }}>Employee</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Planned Time</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Actual Time</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Worked (Min)</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Notes</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>Loading data...</td></tr>
              ) : groupedAttendances.length > 0 ? (
                groupedAttendances.map((att, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                    <td style={{ padding: '12px 15px', color: '#2c3e50' }}>
                      {att.employee?.name || (employees.find(e => e._id === selectedEmployee)?.name)} <br />
                      <small style={{ color: '#7f8c8d' }}>{att.employee?.employeeId || 'N/A'}</small>
                    </td>
                    <td style={{ padding: '12px 15px', fontWeight: '500' }}>{att.attendance_date}</td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{
                        padding: '5px 10px', borderRadius: '15px', fontSize: '0.85rem', fontWeight: '600',
                        backgroundColor: getStatusColor(att.status) + '20',
                        color: getStatusColor(att.status)
                      }}>
                        {att.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      {att.planned_time_display}
                    </td>
                    <td style={{ padding: '12px 15px' }}>{att.actual_time_display}</td>
                    <td style={{ padding: '12px 15px' }}>{att.worked_minutes}</td>
                    <td style={{ padding: '12px 15px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.notes || 'N/A'}</td>
                    <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <ActionButton icon={<FaEye />} color="#3498db" onClick={() => setSelectedAttendance(att)} />
                        {!att.is_virtual && <ActionButton icon={<FaEdit />} color="#f39c12" onClick={() => handleEdit(att)} />}
                        {!att.is_virtual && (
                          <ActionButton
                            icon={<FaTrash />}
                            color="#e74c3c"
                            onClick={() => {
                              // If merged, we might need to delete all or ask user. For now, delete the primary/first ID or handle bulk delete?
                              // Simplified: Delete the first one or primary one using _id.
                              initiateDelete(att._id);
                            }}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="8" style={{ padding: '30px', textAlign: 'center', fontStyle: 'italic', color: '#95a5a6' }}>
                  {selectedEmployee ? "No data found for this period." : "Select an employee and month to view details."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Detail Modal */}
      {selectedAttendance && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)'
        }} onClick={() => setSelectedAttendance(null)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '30px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', color: '#2c3e50', marginTop: 0 }}>
              Attendance Details <span style={{ fontSize: '0.8em', fontWeight: 'normal', color: '#7f8c8d' }}>({selectedAttendance.attendance_date})</span>
            </h3>
            <div style={{ display: 'grid', gap: '12px', color: '#34495e' }}>
              <DetailRow label="Employee" value={`${selectedAttendance.employee?.name || ''} (${selectedAttendance.employee?.employeeId || ''})`} />
              <DetailRow label="Status" value={selectedAttendance.status} strong color={getStatusColor(selectedAttendance.status)} />
              <DetailRow label="Special Type" value={selectedAttendance.special_day_type} />
              <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '8px', marginTop: '5px' }}>
                <DetailRow label="Planned" value={selectedAttendance.planned_time_display || getPlannedTimeDisplay(selectedAttendance)} />
                <DetailRow label="Actual" value={selectedAttendance.actual_time_display || `${selectedAttendance.actual_check_in || '---'} - ${selectedAttendance.actual_check_out || '---'}`} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <DetailRow label="Worked" value={`${selectedAttendance.worked_minutes} min`} />
                <DetailRow label="Overtime" value={`${selectedAttendance.overtime_minutes} min`} />
                <DetailRow label="Late" value={`${selectedAttendance.late_minutes} min`} />
                <DetailRow label="Early Exit" value={`${selectedAttendance.early_exit_minutes} min`} />
              </div>
              <DetailRow label="Notes" value={selectedAttendance.notes || 'N/A'} />
              {selectedAttendance.is_virtual && <div style={{ color: '#e67e22', fontStyle: 'italic', fontSize: '0.9rem', marginTop: '10px' }}>* This is a projected schedule record.</div>}
            </div>
            <button onClick={() => setSelectedAttendance(null)} style={{
              width: '100%', marginTop: '20px', padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
            }}>Close</button>
          </div>
        </div>
      )}

      {/* --- NEW DELETE CONFIRMATION MODAL --- */}
      {itemToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2100, backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            <div style={{
              width: '60px', height: '60px', background: '#ffebee', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
            }}>
              <FaExclamationTriangle style={{ color: '#e74c3c', fontSize: '28px' }} />
            </div>

            <h3 style={{ margin: '0 0 10px', color: '#2c3e50', fontSize: '1.4rem' }}>Are you sure?</h3>
            <p style={{ color: '#7f8c8d', margin: '0 0 25px', lineHeight: '1.5' }}>
              Do you really want to delete this attendance record? This process cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ecf0f1',
                  color: '#7f8c8d',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#e74c3c',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: 1,
                  boxShadow: '0 4px 10px rgba(231, 76, 60, 0.3)'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Sub-components
const SummaryCard = ({ title, value, icon, color }) => (
  <div style={{
    background: 'white', padding: '20px', borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderLeft: `5px solid ${color}`,
    display: 'flex', alignItems: 'center', gap: '15px', transition: 'transform 0.2s'
  }}>
    <div style={{ fontSize: '2rem', color: color, opacity: 0.8 }}>{icon}</div>
    <div>
      <div style={{ fontSize: '0.85rem', color: '#7f8c8d', fontWeight: '600', textTransform: 'uppercase' }}>{title}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2c3e50' }}>{value}</div>
    </div>
  </div>
);

const ActionButton = ({ icon, color, onClick }) => (
  <button onClick={onClick} style={{
    background: 'white', color: color, border: `1px solid ${color}`,
    width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.2s'
  }}
    onMouseOver={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = 'white'; }}
    onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = color; }}
  >
    {icon}
  </button>
);

const DetailRow = ({ label, value, strong, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
    <span style={{ fontWeight: '600', color: '#7f8c8d' }}>{label}:</span>
    <span style={{ fontWeight: strong ? '700' : '400', color: color || 'inherit' }}>{value}</span>
  </div>
);

export default AttendanceView;