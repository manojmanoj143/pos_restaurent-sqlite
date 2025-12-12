// src/components/Form/schedulerulemaster.jsx
// FULLY DETAILED: Schedule Rule Master (Rule Master)
// Manages "schedule_master" table via /api/schedule-rules
// Key requirement: Define weekly working days, weekly offs, date range, and shift.
// Enhanced: Special Days now support types (Holiday, Half-Day, Extended, Special-Shift) with conditional fields.
// Fixed: Ensured shift name resolution by trimming IDs and logging for debug (remove logs in prod).
// All IDs treated as strings for comparison.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaCalendarAlt, FaSave, FaEdit, FaTrash, FaTimes, FaPlus, FaCheckCircle, FaCalendarPlus } from 'react-icons/fa';

const ScheduleRuleMaster = () => {
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [shifts, setShifts] = useState([]); // For Shift Dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  // Form State
  const [formData, setFormData] = useState({
    schedule_name: '',
    start_date: '',
    end_date: '',
    shift_id: '',
    working_days: [], // Array of day strings ["Mon", "Tue"...]
    weekly_off: [], // Derived or explicit, we'll auto-derive for simplicity or allow manual toggle
    special_days: [] // Array of { date: '', type: '', description: '', ...conditional fields }
  });
  const [baseUrl, setBaseUrl] = useState(null);
  // Constants
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const specialDayTypes = [
    { value: 'Holiday', label: 'Holiday (Full Leave)' },
    { value: 'Half-Day', label: 'Half Day (Custom Timing)' },
    { value: 'Extended', label: 'Extended Hours' },
    { value: 'Special-Shift', label: 'Special Shift (Replace with Another Shift)' }
  ];
  // Column management
  const [columnOrder, setColumnOrder] = useState([
    { key: "scheduleName", label: "Schedule Name", align: "left" },
    { key: "dateRange", label: "Date Range", align: "left" },
    { key: "workingDays", label: "Working Days", align: "left" },
    { key: "shiftName", label: "Shift", align: "left" },
    { key: "specialDaysSummary", label: "Special Days", align: "left" },
    { key: "actions", label: "Actions", align: "center" },
  ]);
  const [showColumnModal, setShowColumnModal] = useState(false);
  // ... (Simplifying column management for brevity in this complex form, but providing core functionality)
  // Fetch base URL & Data
  useEffect(() => {
    const init = async () => {
      try {
        const configRes = await axios.get("http://localhost:8000/api/network_info");
        const { config: appConfig } = configRes.data;
        const url = appConfig.mode === "client" ? `http://${appConfig.server_ip}:8000` : '';
        setBaseUrl(url);
      } catch (error) {
        console.error("Failed to fetch config:", error);
        setBaseUrl('');
      }
    };
    init();
  }, []);
  const fetchData = async () => {
    if (baseUrl === null) return;
    setLoading(true);
    try {
      const [rulesRes, shiftsRes] = await Promise.all([
        axios.get(`${baseUrl}/api/schedule-rules`),
        axios.get(`${baseUrl}/api/schedules`) // Fetching Shifts for dropdown
      ]);
      setRules(rulesRes.data || []);
      setShifts(shiftsRes.data || []);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err); // Debug log
      setError(`Failed to fetch data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [baseUrl]);
  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  // Toggle Day Selection
  const toggleDay = (day) => {
    setFormData(prev => {
      const currentWorking = prev.working_days || [];
      const newWorking = currentWorking.includes(day)
        ? currentWorking.filter(d => d !== day)
        : [...currentWorking, day];
      // Auto-update weekly off (days not in newWorking)
      const newOff = daysOfWeek.filter(d => !newWorking.includes(d));
      return { ...prev, working_days: newWorking, weekly_off: newOff };
    });
  };
  // Special Days Logic
  const addSpecialDay = () => {
    setFormData(prev => ({
      ...prev,
      special_days: [...prev.special_days, { date: '', type: '', description: '', start_time: '', end_time: '', extended_start: '', extended_end: '', shift_id: '' }]
    }));
  };
  const removeSpecialDay = (index) => {
    setFormData(prev => ({
      ...prev,
      special_days: prev.special_days.filter((_, i) => i !== index)
    }));
  };
  const updateSpecialDay = (index, field, value) => {
    setFormData(prev => {
      const newSpecial = [...prev.special_days];
      newSpecial[index][field] = value;
      return { ...prev, special_days: newSpecial };
    });
  };
  // Helper to get conditional fields for a special day
  const getConditionalFields = (item, index) => {
    switch (item.type) {
      case 'Holiday':
        return null; // No extra fields
      case 'Half-Day':
        return (
          <>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Start Time</label>
              <input
                type="time"
                value={item.start_time}
                onChange={(e) => updateSpecialDay(index, 'start_time', e.target.value)}
                style={{ ...inputStyle, width: '100px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>End Time</label>
              <input
                type="time"
                value={item.end_time}
                onChange={(e) => updateSpecialDay(index, 'end_time', e.target.value)}
                style={{ ...inputStyle, width: '100px' }}
              />
            </div>
          </>
        );
      case 'Extended':
        return (
          <>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Extended Start</label>
              <input
                type="time"
                value={item.extended_start}
                onChange={(e) => updateSpecialDay(index, 'extended_start', e.target.value)}
                style={{ ...inputStyle, width: '100px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Extended End</label>
              <input
                type="time"
                value={item.extended_end}
                onChange={(e) => updateSpecialDay(index, 'extended_end', e.target.value)}
                style={{ ...inputStyle, width: '100px' }}
              />
            </div>
          </>
        );
      case 'Special-Shift':
        return (
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Replacement Shift</label>
            <select
              value={item.shift_id}
              onChange={(e) => updateSpecialDay(index, 'shift_id', e.target.value)}
              style={inputStyle}
            >
              <option value="">-- Select Shift --</option>
              {shifts.map(s => (
                <option key={s._id} value={s._id}>{s.schedule_name} ({s.start_time} - {s.end_time})</option>
              ))}
            </select>
          </div>
        );
      default:
        return null;
    }
  };
  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.working_days.length === 0) {
      setError("Please select at least one working day.");
      return;
    }
    if (!formData.start_date || !formData.end_date || formData.start_date > formData.end_date) {
      setError("Please provide a valid date range.");
      return;
    }
    // Validate special days
    for (const sd of formData.special_days) {
      if (!sd.date || !sd.description || !sd.type) {
        setError("All special days must have date, type, and description.");
        return;
      }
      if (sd.type === 'Half-Day' && (!sd.start_time || !sd.end_time)) {
        setError("Half-Day requires start and end times.");
        return;
      }
      if (sd.type === 'Extended' && (!sd.extended_start || !sd.extended_end)) {
        setError("Extended Hours requires extended start and end times.");
        return;
      }
      if (sd.type === 'Special-Shift' && !sd.shift_id) {
        setError("Special Shift requires a replacement shift.");
        return;
      }
    }
    try {
      const url = `${baseUrl}/api/schedule-rules${editingId ? `/${editingId}` : ''}`;
      const method = editingId ? 'put' : 'post';
      const submitData = { ...formData }; // Ensure all fields are sent
      await axios[method](url, submitData);
      setMessage(`Schedule Rule ${editingId ? 'updated' : 'added'} successfully!`);
      setEditingId(null);
      setFormData({ schedule_name: '', start_date: '', end_date: '', shift_id: '', working_days: [], weekly_off: [], special_days: [] });
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error("Submit error:", err); // Debug log
      setError(`Failed to save rule: ${err.response?.data?.error || err.message}`);
    }
  };
  const handleEdit = (rule) => {
    setEditingId(rule._id);
    setFormData({
      schedule_name: rule.schedule_name || '',
      start_date: rule.start_date || '',
      end_date: rule.end_date || '',
      shift_id: rule.shift_id || '',
      working_days: rule.working_days || [],
      weekly_off: rule.weekly_off || [],
      special_days: rule.special_days || [] // Already has type and conditional fields
    });
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${baseUrl}/api/schedule-rules/${id}`);
      setMessage("Rule deleted!");
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error("Delete error:", err); // Debug log
      setError(`Failed to delete: ${err.message}`);
    }
  };
  // Helper to get shift name - Enhanced with string trimming and debug
  const getShiftName = (shiftId) => {
    if (!shiftId) return 'No Shift Assigned';
    const idStr = String(shiftId).trim();
    const shift = shifts.find(s => String(s._id).trim() === idStr);
    if (!shift) {
      console.warn(`Shift not found for ID: ${idStr}`, { shifts }); // Debug log - remove in prod
      return 'Unknown Shift';
    }
    return shift.schedule_name;
  };
  // Helper for special days summary in table
  const getSpecialDaysSummary = (specialDays) => {
    if (!specialDays || specialDays.length === 0) return 'None';
    return specialDays.map(sd => `${sd.type}: ${sd.description.substring(0, 20)}${sd.description.length > 20 ? '...' : ''}`).join('; ');
  };
  if (loading && !baseUrl) return <div style={{ padding: '50px', textAlign: 'center' }}>Initializing...</div>;
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', padding: '20px' }}>
      <button onClick={() => navigate('/admin')} style={{ ...buttonStyle, position: 'fixed', top: '20px', left: '20px', zIndex: 100 }}>
        <FaArrowLeft /> Back
      </button>
      <div style={{ maxWidth: '1200px', margin: '60px auto', background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        {/* Header */}
        <div style={{ borderBottom: '2px solid #3498db', paddingBottom: '15px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#2c3e50', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaCalendarAlt style={{ color: '#3498db' }} /> Schedule Master (Rules)
          </h2>
          <span style={{ background: '#3498db', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9rem' }}>
            {rules.length} Rules Defined
          </span>
        </div>
        {/* Alerts */}
        {error && <div style={{ background: '#ffdddd', color: '#c0392b', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}
        {message && <div style={{ background: '#ddffdd', color: '#27ae60', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>{message}</div>}
        {/* Form */}
        <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '12px', border: '1px solid #e9ecef', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0, color: '#34495e', borderBottom: '1px dashed #bdc3c7', paddingBottom: '10px', marginBottom: '20px' }}>
            {editingId ? 'Edit Schedule Rule' : 'Create New Schedule Rule'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              {/* Basic Info */}
              <div>
                <label style={labelStyle}>Schedule Name</label>
                <input required type="text" name="schedule_name" value={formData.schedule_name} onChange={handleInputChange} placeholder="e.g., General Shift 2025" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Date Range</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input required type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} style={inputStyle} title="Start Date" />
                  <span style={{ alignSelf: 'center' }}>to</span>
                  <input required type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} style={inputStyle} title="End Date" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Assign Shift</label>
                <select required name="shift_id" value={formData.shift_id} onChange={handleInputChange} style={inputStyle}>
                  <option value="">-- Select Shift --</option>
                  {shifts.map(s => (
                    <option key={s._id} value={s._id}>{s.schedule_name} ({s.start_time} - {s.end_time})</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Working Days Selector */}
            <div style={{ marginBottom: '25px' }}>
              <label style={labelStyle}>Set Working Days (Unselected days become Weekly Offs)</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                {daysOfWeek.map(day => {
                  const isSelected = formData.working_days.includes(day);
                  return (
                    <div
                      key={day}
                      onClick={() => toggleDay(day)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s',
                        background: isSelected ? 'linear-gradient(135deg, #2ecc71, #27ae60)' : '#ecf0f1',
                        color: isSelected ? 'white' : '#7f8c8d',
                        boxShadow: isSelected ? '0 3px 6px rgba(46, 204, 113, 0.3)' : 'none',
                        border: isSelected ? 'none' : '1px solid #bdc3c7'
                      }}
                    >
                      {day} {isSelected && <FaCheckCircle style={{ marginLeft: '5px', fontSize: '0.8rem' }} />}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#7f8c8d' }}>
                <strong>Weekly Offs:</strong> {formData.weekly_off.length > 0 ? formData.weekly_off.join(", ") : "None (7 days working)"}
              </div>
            </div>
            {/* Special Days Section */}
            <div style={{ marginBottom: '25px', border: '1px dashed #bdc3c7', padding: '15px', borderRadius: '10px', background: 'white' }}>
              <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                <span>Special Days (Holidays / Exceptions)</span>
                <button type="button" onClick={addSpecialDay} style={{ ...buttonStyle, padding: '5px 12px', fontSize: '0.8rem', background: '#e67e22' }}>
                  <FaPlus /> Add Date
                </button>
              </label>
              {formData.special_days.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: '10px', marginTop: '10px', alignItems: 'center', padding: '10px', border: '1px solid #eee', borderRadius: '8px' }}>
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) => updateSpecialDay(idx, 'date', e.target.value)}
                    style={{ ...inputStyle, width: '150px' }}
                    required
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <select
                      value={item.type}
                      onChange={(e) => updateSpecialDay(idx, 'type', e.target.value)}
                      style={inputStyle}
                      required
                    >
                      <option value="">-- Select Type --</option>
                      {specialDayTypes.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Occasion / Reason"
                      value={item.description}
                      onChange={(e) => updateSpecialDay(idx, 'description', e.target.value)}
                      style={{ ...inputStyle, marginTop: '5px' }}
                      required
                    />
                    {getConditionalFields(item, idx)}
                  </div>
                  <button type="button" onClick={() => removeSpecialDay(idx)} style={{ color: '#e74c3c', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                    <FaTimes />
                  </button>
                </div>
              ))}
              {formData.special_days.length === 0 && <span style={{ color: '#bdc3c7', fontStyle: 'italic', fontSize: '0.9rem' }}>No special days added.</span>}
            </div>
            {/* Actions */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <button type="submit" style={{ ...buttonStyle, flex: 1, background: '#3498db' }}>
                <FaSave /> {editingId ? 'Update Rule' : 'Save Rule'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setFormData({ schedule_name: '', start_date: '', end_date: '', shift_id: '', working_days: [], weekly_off: [], special_days: [] }); }} style={{ ...buttonStyle, background: '#95a5a6' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        {/* List */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <thead>
              <tr style={{ background: '#34495e', color: 'white' }}>
                <th style={thStyle}>Schedule Name</th>
                <th style={thStyle}>Date Range</th>
                <th style={thStyle}>Working Days</th>
                <th style={thStyle}>Shift</th>
                <th style={thStyle}>Special Days</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>No Rules Found.</td>
                </tr>
              ) : rules.map((r, i) => (
                <tr key={r._id} style={{ background: i % 2 === 0 ? 'white' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{r.schedule_name}</td>
                  <td style={tdStyle}>{r.start_date} to {r.end_date}</td>
                  <td style={tdStyle}>
                    <div style={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                      {r.working_days?.join(", ") || 'None'}
                    </div>
                  </td>
                  <td style={tdStyle}>{getShiftName(r.shift_id)}</td>
                  <td style={tdStyle}>
                    <div style={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                      {getSpecialDaysSummary(r.special_days)}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button onClick={() => handleEdit(r)} style={iconBtnStyle} title="Edit"><FaEdit /></button>
                    <button onClick={() => handleDelete(r._id)} style={{ ...iconBtnStyle, color: '#e74c3c' }} title="Delete"><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
// Styles
const inputStyle = {
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #bdc3c7',
  width: '100%',
  fontSize: '0.95rem'
};
const labelStyle = {
  display: 'block',
  marginBottom: '5px',
  fontWeight: '600',
  color: '#2c3e50',
  fontSize: '0.9rem'
};
const buttonStyle = {
  padding: '10px 20px',
  borderRadius: '50px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  transition: 'transform 0.2s',
  background: '#3498db'
};
const thStyle = {
  padding: '12px 15px',
  textAlign: 'left',
  fontWeight: '600'
};
const tdStyle = {
  padding: '12px 15px',
  color: '#2c3e50'
};
const iconBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#3498db',
  fontSize: '1.1rem',
  margin: '0 5px'
};
export default ScheduleRuleMaster;