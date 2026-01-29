// src/components/Form/schedulerulemaster.jsx
// FULLY DETAILED: Schedule Rule Master (Rule Master)
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaCalendarAlt, FaSave, FaEdit, FaTrash, FaTimes, FaPlus, FaCheckCircle, FaClock, FaMoon, FaExclamationTriangle } from 'react-icons/fa';

// --- Helper Functions for Format Conversion ---
const to12h = (h, m) => {
  let hour = parseInt(h);
  const minute = m.toString().padStart(2, '0');
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12; // 0 becomes 12
  return `${hour.toString().padStart(2, '0')}:${minute} ${period}`;
};

const to24h = (h, m, p) => {
  let hour = parseInt(h);
  if (p === 'PM' && hour !== 12) hour += 12;
  if (p === 'AM' && hour === 12) hour = 0;
  return { h: hour.toString().padStart(2, '0'), m: m.toString().padStart(2, '0') };
};

// --- Custom Time Picker Component ---
const CustomTimePicker = ({ value, onChange, format24, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const pickerId = useRef(Math.random().toString(36).substr(2, 9));

  // Internal state is separate from "value" prop logic to support smooth typing
  const [h, setH] = useState('');
  const [m, setM] = useState('');
  const [p, setP] = useState('AM');

  // Sync internal state with external value AND current format mode
  useEffect(() => {
    if (!value) {
      setH(''); setM(''); setP('AM');
      return;
    }
    const match = value.match(/^(\d{1,2})[:.]?(\d{0,2})\s*([AP]M)?$/i);
    if (match) {
      let hour = match[1];
      let minute = match[2] || '00';
      let period = match[3] ? match[3].toUpperCase() : 'AM';

      if (format24) {
        // Convert incoming 12h string to 24h parts for display
        const { h: h24, m: m24 } = to24h(hour, minute, period);
        setH(h24);
        setM(m24);
        setP(''); // Not used in 24h
      } else {
        // Use 12h parts directly
        setH(hour.toString().padStart(2, '0'));
        setM(minute.toString().padStart(2, '0'));
        setP(period);
      }
    }
  }, [value, format24]);

  // Scroll to selection
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const hElem = document.getElementById(`h-${pickerId.current}-${parseInt(h)}`);
        const mElem = document.getElementById(`m-${pickerId.current}-${parseInt(m)}`);
        const pElem = document.getElementById(`p-${pickerId.current}-${p}`); // Only exists in 12h

        if (hElem) hElem.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (mElem) mElem.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (pElem) pElem.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, h, m, p]);

  const notifyChange = (newH, newM, newP) => {
    // ALWAYS emit "HH:MM AM/PM" (12h format) back to parent
    // If in 24h mode, we must convert internal 24h parts -> 12h string first
    if (format24) {
      if (newH !== '' && newM !== '') {
        // Treat newH as 0-23
        const val12 = to12h(newH, newM);
        onChange(val12);
      } else {
        // Partial inputs? Hard to represent in strict 12h format parent expects
        // We just won't update parent until valid, or clear it.
        if (newH === '' && newM === '') onChange('');
      }
    } else {
      // 12h mode: just emit what we have
      const hh = newH.padStart(2, '0');
      const mm = newM.padStart(2, '0');
      if (newH && newM) onChange(`${hh}:${mm} ${newP}`);
      else if (!newH && !newM) onChange('');
    }
  };

  const handleHChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(-2);
    setH(val);
    notifyChange(val, m, p);
    setIsOpen(true);
  };

  const handleMChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(-2);
    setM(val);
    notifyChange(h, val, p);
    setIsOpen(true);
  };

  const handlePChange = (e) => {
    if (format24) return;
    let val = e.target.value.toUpperCase();
    if (val.length > 2) val = val.slice(-2);
    let nextP = p;
    if (val.includes('A')) nextP = 'AM';
    else if (val.includes('P')) nextP = 'PM';
    setP(nextP);
    notifyChange(h, m, nextP);
  };

  const handleSelect = (type, val) => {
    let newH = h;
    let newM = m;
    let newP = p;

    if (type === 'h') newH = val.toString().padStart(2, '0');
    if (type === 'm') newM = val.toString().padStart(2, '0');
    if (type === 'p') newP = val;

    setH(newH);
    setM(newM);
    setP(newP);
    notifyChange(newH, newM, newP);
  };

  const handleFocus = (e) => e.target.select();

  // Close logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Dropdown data generation
  const hours = format24
    ? Array.from({ length: 24 }, (_, i) => i) // 0-23
    : Array.from({ length: 12 }, (_, i) => i + 1); // 1-12

  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods = ['AM', 'PM'];

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          border: isOpen ? '1px solid #3498db' : '1px solid #bdc3c7',
          borderRadius: '8px',
          padding: '10px 10px',
          backgroundColor: '#fff',
          cursor: 'text',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(52, 152, 219, 0.2)' : 'none',
          width: '100%',
          justifyContent: 'space-between'
        }}
        onClick={() => setIsOpen(true)}
      >
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <input
            type="text"
            placeholder="HH"
            value={h}
            onChange={handleHChange}
            onFocus={handleFocus}
            onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
            style={{ border: 'none', width: '30px', textAlign: 'center', fontSize: '0.95rem', outline: 'none', color: '#2c3e50', background: 'transparent', fontWeight: '500' }}
          />
          <span style={{ fontWeight: 'bold', userSelect: 'none', color: '#95a5a6', margin: '0 2px' }}>:</span>
          <input
            type="text"
            placeholder="MM"
            value={m}
            onChange={handleMChange}
            onFocus={handleFocus}
            onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
            style={{ border: 'none', width: '30px', textAlign: 'center', fontSize: '0.95rem', outline: 'none', color: '#2c3e50', background: 'transparent', fontWeight: '500' }}
          />
          {!format24 && (
            <input
              type="text"
              value={p}
              onChange={handlePChange}
              onFocus={handleFocus}
              onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
              style={{ border: 'none', width: '40px', textAlign: 'center', fontSize: '0.85rem', marginLeft: 'auto', outline: 'none', color: '#fff', background: p === 'AM' ? '#f1c40f' : '#34495e', borderRadius: '4px', cursor: 'pointer', padding: '2px 0', fontWeight: 'bold' }}
            />
          )}
        </div>
        <FaClock style={{ color: isOpen ? '#3498db' : '#95a5a6', cursor: 'pointer', marginLeft: '10px' }} onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '110%',
          left: 0,
          zIndex: 1500, // Higher than modal backdrop
          backgroundColor: '#fff',
          border: '1px solid #eee',
          borderRadius: '8px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          display: 'flex',
          height: '220px',
          overflow: 'hidden',
          width: '100%',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #f0f0f0', scrollbarWidth: 'thin' }}>
            <div style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', background: '#f8f9fa', borderBottom: '1px solid #eee', color: '#7f8c8d', fontSize: '0.8rem' }}>HH</div>
            {hours.map(hr => (
              <div
                key={hr}
                id={`h-${pickerId.current}-${hr}`}
                onClick={() => handleSelect('h', hr)}
                style={{
                  padding: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  backgroundColor: parseInt(h) === hr ? '#ebf5fb' : 'transparent',
                  color: parseInt(h) === hr ? '#3498db' : '#333',
                  fontWeight: parseInt(h) === hr ? 'bold' : 'normal'
                }}
              >
                {hr.toString().padStart(2, '0')}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', borderRight: format24 ? 'none' : '1px solid #f0f0f0', scrollbarWidth: 'thin' }}>
            <div style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', background: '#f8f9fa', borderBottom: '1px solid #eee', color: '#7f8c8d', fontSize: '0.8rem' }}>MM</div>
            {minutes.map(mn => (
              <div
                key={mn}
                id={`m-${pickerId.current}-${mn}`}
                onClick={() => handleSelect('m', mn)}
                style={{
                  padding: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  backgroundColor: parseInt(m) === mn ? '#ebf5fb' : 'transparent',
                  color: parseInt(m) === mn ? '#3498db' : '#333',
                  fontWeight: parseInt(m) === mn ? 'bold' : 'normal'
                }}
              >
                {mn.toString().padStart(2, '0')}
              </div>
            ))}
          </div>

          {!format24 && (
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
              <div style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', background: '#f8f9fa', borderBottom: '1px solid #eee', color: '#7f8c8d', fontSize: '0.8rem' }}>AM/PM</div>
              {periods.map(per => (
                <div
                  key={per}
                  id={`p-${pickerId.current}-${per}`}
                  onClick={() => handleSelect('p', per)}
                  style={{
                    padding: '10px 8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    backgroundColor: p === per ? '#ebf5fb' : 'transparent',
                    color: p === per ? '#3498db' : '#333',
                    fontWeight: p === per ? 'bold' : 'normal'
                  }}
                >
                  {per}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ScheduleRuleMaster = () => {
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [shifts, setShifts] = useState([]); // For Shift Dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Toggle for 12h/24h format
  const [use24Hour, setUse24Hour] = useState(false);

  // Delete Modal State
  const [deleteId, setDeleteId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    schedule_name: '',
    start_date: '',
    end_date: '',
    shift_id: '',
    working_days: [],
    weekly_off: [],
    special_days: []
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
      console.error("Fetch error:", err);
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
      special_days: [...prev.special_days, { date: '', type: '', description: '', start_time: '', end_time: '', extended_start: '', extended_end: '', shift_id: '', is_observed: false }]
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
      // UPDATED: Auto-set is_observed true for 'Holiday' type
      if (field === 'type' && value === 'Holiday') {
        newSpecial[index].is_observed = true;
      }
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
              <label style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Start {use24Hour ? '(24h)' : '(12h)'}</label>
              <CustomTimePicker
                value={item.start_time}
                onChange={(val) => updateSpecialDay(index, 'start_time', val)}
                format24={use24Hour}
                placeholder="Start"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>End {use24Hour ? '(24h)' : '(12h)'}</label>
              <CustomTimePicker
                value={item.end_time}
                onChange={(val) => updateSpecialDay(index, 'end_time', val)}
                format24={use24Hour}
                placeholder="End"
              />
            </div>
          </>
        );
      case 'Extended':
        return (
          <>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Extended Start {use24Hour ? '(24h)' : '(12h)'}</label>
              <CustomTimePicker
                value={item.extended_start}
                onChange={(val) => updateSpecialDay(index, 'extended_start', val)}
                format24={use24Hour}
                placeholder="Start"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Extended End {use24Hour ? '(24h)' : '(12h)'}</label>
              <CustomTimePicker
                value={item.extended_end}
                onChange={(val) => updateSpecialDay(index, 'extended_end', val)}
                format24={use24Hour}
                placeholder="End"
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
              {shifts.map(s => {
                const slotsStr = s.time_slots ? s.time_slots.map(t => `${t.start_time}-${t.end_time}${t.is_overnight ? ' (O)' : ''}`).join(', ') : '';
                return <option key={s._id} value={s._id}>{s.schedule_name} ({slotsStr})</option>;
              })}
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  // Helper to get shift name with slots
  const getShiftName = (shiftId) => {
    if (!shiftId) return 'No Shift Assigned';
    const idStr = String(shiftId).trim();
    const shift = shifts.find(s => String(s._id).trim() === idStr);
    if (!shift) {
      return 'Unknown Shift';
    }
    const slotsStr = shift.time_slots ? shift.time_slots.map(t => `${t.start_time}-${t.end_time}${t.is_overnight ? ' (O)' : ''}`).join(', ') : '';
    return `${shift.schedule_name} (${slotsStr})`;
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
      const submitData = { ...formData }; // Ensure all fields are sent, including is_observed
      await axios[method](url, submitData);
      setMessage(`Schedule Rule ${editingId ? 'updated' : 'added'} successfully!`);
      setEditingId(null);
      setFormData({ schedule_name: '', start_date: '', end_date: '', shift_id: '', working_days: [], weekly_off: [], special_days: [] });
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
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
      special_days: (rule.special_days || []).map(sd => ({ ...sd, is_observed: sd.is_observed ?? (sd.type === 'Holiday') })) // Ensure is_observed
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Trigger Confirmation
  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  // Execute Deletion
  const handleExecuteDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${baseUrl}/api/schedule-rules/${deleteId}`);
      setMessage("Rule deleted!");
      setDeleteId(null);
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(`Failed to delete: ${err.message}`);
      setDeleteId(null);
    }
  };

  // Helper for special days summary in table
  const getSpecialDaysSummary = (specialDays) => {
    if (!specialDays || specialDays.length === 0) return 'None';
    return specialDays.map(sd => `${sd.type}: ${sd.description.substring(0, 20)}${sd.description.length > 20 ? '...' : ''}`).join('; ');
  };

  if (loading && !baseUrl) return <div style={{ padding: '50px', textAlign: 'center' }}>Initializing...</div>;

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', padding: '20px' }}>
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
        <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '12px', border: '1px solid #e9ecef', marginBottom: '30px', position: 'relative' }}>

          {/* Format Toggle Button - Absolute positioned top-left of this section */}
          <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '4px', background: '#e0e0e0', borderRadius: '8px', display: 'flex', gap: '4px', zIndex: 10 }}>
            <button
              type="button"
              onClick={() => setUse24Hour(false)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                cursor: 'pointer',
                background: !use24Hour ? '#3498db' : 'transparent',
                color: !use24Hour ? '#fff' : '#7f8c8d',
                transition: 'all 0.2s'
              }}
            >
              12 Hour
            </button>
            <button
              type="button"
              onClick={() => setUse24Hour(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                cursor: 'pointer',
                background: use24Hour ? '#3498db' : 'transparent',
                color: use24Hour ? '#fff' : '#7f8c8d',
                transition: 'all 0.2s'
              }}
            >
              24 Hour
            </button>
          </div>

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
                  {shifts.map(s => {
                    const slotsStr = s.time_slots ? s.time_slots.map(t => `${t.start_time}-${t.end_time}${t.is_overnight ? ' (O)' : ''}`).join(', ') : '';
                    return <option key={s._id} value={s._id}>{s.schedule_name} ({slotsStr})</option>;
                  })}
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
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      {getConditionalFields(item, idx)}
                    </div>
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
                    <button onClick={() => confirmDelete(r._id)} style={{ ...iconBtnStyle, color: '#e74c3c' }} title="Delete"><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Warning Modal */}
      {deleteId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <FaExclamationTriangle style={{ fontSize: '3rem', color: '#e74c3c', marginBottom: '20px' }} />
            <h3 style={{ color: '#2c3e50', margin: '0 0 15px 0' }}>Confirm Deletion</h3>
            <p style={{ color: '#7f8c8d', marginBottom: '25px' }}>Are you sure you want to delete this rule? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={handleExecuteDelete}
                style={{ padding: '10px 25px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteId(null)}
                style={{ padding: '10px 25px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles (unchanged)
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