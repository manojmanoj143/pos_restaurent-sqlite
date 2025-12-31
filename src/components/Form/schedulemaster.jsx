// src/components/Form/schedulemaster.jsx
// FULLY DETAILED: Shift Master page
// Manages "shift_master" table via /api/schedules endpoint
// UPDATED: Table Display respects 12/24h toggle.
// Data is ALWAYS stored as "HH:MM AM/PM" (12h format) for backend consistency.
// The UI (both Inputs and Table) handles conversions dynamically based on toggle state.
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaClock, FaSave, FaEdit, FaTrash, FaTimes, FaPlus, FaMoon, FaSun, FaExclamationTriangle } from 'react-icons/fa';

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
const CustomTimePicker = ({ value, onChange, format24 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const pickerId = useRef(Math.random().toString(36).substr(2, 9));

  // Internal state is separate from "value" prop logic to support smooth typing
  // We keep 'h', 'm', 'p' purely for the UI fields.
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
    // Simple push logic: typing '3' -> '3', then '6' -> '36'
    // 24h mode limits: 0-23. 12h mode limits: 1-12.
    // We let user type freely, validation/clamping happens visually or on blur if needed.
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
    <div ref={wrapperRef} style={{ position: 'relative', width: 'fit-content' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          border: isOpen ? '1px solid #3498db' : '1px solid #bdc3c7',
          borderRadius: '8px',
          padding: '6px 10px',
          backgroundColor: '#fff',
          cursor: 'text',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(52, 152, 219, 0.2)' : '0 2px 5px rgba(0,0,0,0.05)',
          width: format24 ? '135px' : '180px', // Smaller width for 24h mode
          justifyContent: 'space-between'
        }}
        onClick={() => setIsOpen(true)}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="HH"
            value={h}
            onChange={handleHChange}
            onFocus={handleFocus}
            onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
            style={{ border: 'none', width: '24px', textAlign: 'center', fontSize: '0.95rem', outline: 'none', color: '#2c3e50', background: 'transparent', fontWeight: '500' }}
          />
          <span style={{ fontWeight: 'bold', userSelect: 'none', color: '#95a5a6', margin: '0 2px' }}>:</span>
          <input
            type="text"
            placeholder="MM"
            value={m}
            onChange={handleMChange}
            onFocus={handleFocus}
            onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
            style={{ border: 'none', width: '24px', textAlign: 'center', fontSize: '0.95rem', outline: 'none', color: '#2c3e50', background: 'transparent', fontWeight: '500' }}
          />
          {!format24 && (
            <input
              type="text"
              value={p}
              onChange={handlePChange}
              onFocus={handleFocus}
              onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
              style={{ border: 'none', width: '35px', textAlign: 'center', fontSize: '0.85rem', marginLeft: '8px', outline: 'none', color: '#fff', background: p === 'AM' ? '#f1c40f' : '#34495e', borderRadius: '4px', cursor: 'pointer', padding: '2px 0', fontWeight: 'bold' }}
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
          zIndex: 1000,
          backgroundColor: '#fff',
          border: '1px solid #eee',
          borderRadius: '8px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          display: 'flex',
          height: '220px',
          overflow: 'hidden',
          width: format24 ? '150px' : '240px', // Adapt dropdown width too
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

// --- Main Component ---
const ScheduleMaster = () => {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [departments, setDepartments] = useState([]); // NEW: Departments state

  // Format Toggle State
  const [use24Hour, setUse24Hour] = useState(false); // Default to 12h

  const [formData, setFormData] = useState({
    schedule_name: '',
    time_slots: [{ start_time: '', end_time: '', is_overnight: false }],
    description: '',
    department: '', // NEW: Department field
  });
  const [baseUrl, setBaseUrl] = useState(null);

  const [deleteId, setDeleteId] = useState(null);

  const [columnOrder, setColumnOrder] = useState([
    { key: "scheduleName", label: "Shift Name", align: "left" },
    { key: "department", label: "Department", align: "left" }, // NEW: Default column
    { key: "timeSlots", label: "Time Slots", align: "left" },
    { key: "description", label: "Description", align: "left" },
    { key: "actions", label: "Actions", align: "center" },
  ]);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [selectedFieldToAdd, setSelectedFieldToAdd] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(0);
  const possibleColumns = [
    { key: "id", label: "ID", align: "left" },
    { key: "scheduleName", label: "Shift Name", align: "left" },
    { key: "department", label: "Department", align: "left" },
    { key: "timeSlots", label: "Time Slots", align: "left" },
    { key: "description", label: "Description", align: "left" },
    { key: "created_at", label: "Created At", align: "left" },
  ];

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/network_info");
        const { config: appConfig } = response.data;
        if (appConfig.mode === "client") {
          setBaseUrl(`http://${appConfig.server_ip}:8000`);
        } else {
          setBaseUrl('');
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
        setBaseUrl('');
      }
    };
    fetchConfig();
  }, []);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const url = baseUrl ? `${baseUrl}/api/schedules` : '/api/schedules';
      const response = await axios.get(url);
      setShifts(response.data);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch shifts: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (baseUrl !== null) {
      fetchShifts();
      // Fetch departments
      axios.get(`${baseUrl}/api/departments`).then(res => setDepartments(res.data)).catch(err => console.error(err));
    }
  }, [baseUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addSlot = () => {
    setFormData(prev => ({
      ...prev,
      time_slots: [...prev.time_slots, { start_time: '', end_time: '', is_overnight: false }]
    }));
  };

  const removeSlot = (index) => {
    if (formData.time_slots.length > 1) {
      setFormData(prev => ({
        ...prev,
        time_slots: prev.time_slots.filter((_, i) => i !== index)
      }));
    }
  };

  const updateSlot = (index, field, value) => {
    setFormData(prev => {
      const newSlots = [...prev.time_slots];
      newSlots[index][field] = value;
      return { ...prev, time_slots: newSlots };
    });
  };

  const handleAddShift = async (e) => {
    e.preventDefault();
    const validFormatRegex = /^([1-9]|0[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/i;

    if (formData.time_slots.length === 0) {
      setError('At least one time slot is required.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    for (const slot of formData.time_slots) {
      if (!validFormatRegex.test(slot.start_time)) {
        setError(`Invalid Start Time: "${slot.start_time}". Use HH:MM AM/PM`);
        setTimeout(() => setError(null), 3000);
        return;
      }
      if (!validFormatRegex.test(slot.end_time)) {
        setError(`Invalid End Time: "${slot.end_time}". Use HH:MM AM/PM`);
        setTimeout(() => setError(null), 3000);
        return;
      }
    }

    if (!formData.schedule_name.trim()) {
      setError('Shift name is required.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const cleanedSlots = formData.time_slots.map(slot => ({
      ...slot,
      start_time: slot.start_time.toUpperCase(),
      end_time: slot.end_time.toUpperCase()
    }));
    const payload = { ...formData, time_slots: cleanedSlots };

    try {
      const url = baseUrl ? `${baseUrl}/api/schedules` : '/api/schedules';
      await axios.post(url, payload);
      setMessage('Shift added successfully!');
      setFormData({
        schedule_name: '',
        time_slots: [{ start_time: '', end_time: '', is_overnight: false }],
        description: '',
        department: '',
      });
      fetchShifts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(`Failed to add shift: ${err.response?.data?.error || err.message}`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEditShift = (shift) => {
    setFormData({
      schedule_name: shift.schedule_name || '',
      time_slots: shift.time_slots || [{ start_time: '', end_time: '', is_overnight: false }],
      description: shift.description || '',
      department: shift.department || '',
    });
    setEditingId(shift.id || shift._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateShift = async (e) => {
    e.preventDefault();
    const validFormatRegex = /^([1-9]|0[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/i;

    if (formData.time_slots.length === 0) {
      setError('At least one time slot is required.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    for (const slot of formData.time_slots) {
      if (!validFormatRegex.test(slot.start_time)) {
        setError(`Invalid Start Time: "${slot.start_time}". Use HH:MM AM/PM`);
        setTimeout(() => setError(null), 3000);
        return;
      }
      if (!validFormatRegex.test(slot.end_time)) {
        setError(`Invalid End Time: "${slot.end_time}". Use HH:MM AM/PM`);
        setTimeout(() => setError(null), 3000);
        return;
      }
    }

    if (!formData.schedule_name.trim()) {
      setError('Shift name is required.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const cleanedSlots = formData.time_slots.map(slot => ({
      ...slot,
      start_time: slot.start_time.toUpperCase(),
      end_time: slot.end_time.toUpperCase()
    }));
    const payload = { ...formData, time_slots: cleanedSlots };

    try {
      const url = baseUrl ? `${baseUrl}/api/schedules/${editingId}` : `/api/schedules/${editingId}`;
      await axios.put(url, payload);
      setMessage('Shift updated successfully!');
      setEditingId(null);
      setFormData({
        schedule_name: '',
        time_slots: [{ start_time: '', end_time: '', is_overnight: false }],
        description: '',
        department: '',
      });
      fetchShifts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(`Failed to update shift: ${err.response?.data?.error || err.message}`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const confirmDeleteShift = (id) => {
    setDeleteId(id);
  };

  const handleExecuteDelete = async () => {
    if (!deleteId) return;
    try {
      const url = baseUrl ? `${baseUrl}/api/schedules/${deleteId}` : `/api/schedules/${deleteId}`;
      await axios.delete(url);
      setMessage('Shift deleted successfully!');
      setDeleteId(null);
      fetchShifts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(`Failed to delete shift: ${err.response?.data?.error || err.message}`);
      setTimeout(() => setError(null), 3000);
      setDeleteId(null);
    }
  };

  const addColumn = () => {
    const fieldKey = selectedFieldToAdd;
    if (!fieldKey) return;
    const field = possibleColumns.find(p => p.key === fieldKey);
    if (!field || columnOrder.some(c => c.key === field.key)) return;
    const pos = parseInt(selectedPosition);
    const newOrder = [...columnOrder];
    newOrder.splice(pos, 0, field);
    setColumnOrder(newOrder);
    setSelectedFieldToAdd('');
    setSelectedPosition(0);
  };

  const removeColumn = (index) => {
    const newOrder = [...columnOrder];
    const removed = newOrder.splice(index, 1)[0];
    if (removed && removed.key === "actions") {
      newOrder.push(removed);
    }
    setColumnOrder(newOrder);
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", index);
    e.target.style.backgroundColor = 'rgba(52, 152, 219, 0.2)';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.target.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    const newOrder = [...columnOrder];
    const [draggedColumn] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);
    setColumnOrder(newOrder);
    document.querySelectorAll('table th').forEach(th => {
      th.style.backgroundColor = '';
    });
  };

  // Convert 12h string -> 24h string for display only
  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '';
    if (!use24Hour) return timeStr; // Return 12h as is

    // Match "06:18 PM"
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
    if (match) {
      let h = parseInt(match[1]);
      let m = match[2];
      let p = match[3].toUpperCase();

      let { h: h24, m: m24 } = to24h(h, m, p);
      return `${h24}:${m24}`;
    }
    return timeStr;
  };

  const thStyle = {
    padding: '15px 12px',
    border: 'none',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    fontWeight: '600',
    fontSize: '0.95rem'
  };

  const tdStyle = {
    padding: '15px 12px',
    borderRight: '1px solid #e9ecef',
    whiteSpace: 'normal',
    color: '#2c3e50'
  };

  const getCellContent = (shift, col) => {
    switch (col.key) {
      case 'scheduleName':
        return shift.schedule_name;
      case 'department':
        return shift.department || '-';
      case 'timeSlots':
        if (!shift.time_slots || shift.time_slots.length === 0) return 'N/A';
        return (
          <div style={{ whiteSpace: 'pre-line', lineHeight: '1.4' }}>
            {shift.time_slots.map((slot, i) => `${formatTimeDisplay(slot.start_time)} - ${formatTimeDisplay(slot.end_time)}${slot.is_overnight ? ' (Overnight)' : ''}`).join('\n')}
          </div>
        );
      case 'description':
        return shift.description || 'N/A';
      case 'created_at':
        return shift.created_at ? new Date(shift.created_at).toLocaleString() : '';
      case 'actions':
        return (
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleEditShift(shift); }}
              style={{ padding: '6px 10px', background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem' }}
              title="Edit"
            >
              <FaEdit />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); confirmDeleteShift(shift.id || shift._id); }}
              style={{ padding: '6px 10px', background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem' }}
              title="Delete"
            >
              <FaTrash />
            </button>
          </div>
        );
      default:
        return shift[col.key] || 'N/A';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)' }}>
        <div style={{ textAlign: 'center', color: '#3498db', fontSize: '18px' }}>
          <FaClock style={{ fontSize: '48px', marginBottom: '20px' }} />
          <p>Loading shifts...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)', padding: '20px', position: 'relative' }}>
      <button onClick={() => navigate('/admin')} style={{ position: 'fixed', top: '20px', left: '20px', backgroundColor: 'transparent', border: '2px solid #3498db', color: '#3498db', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '50px', fontSize: '16px', fontWeight: '600', zIndex: 1001 }}>
        <FaArrowLeft /> Back to Admin
      </button>

      <div style={{ maxWidth: '1250px', margin: '80px auto 20px', backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #3498db' }}>
          <h2 style={{ textAlign: 'center', color: '#2c3e50', margin: 0, fontSize: '1.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaClock style={{ color: '#3498db', fontSize: '2rem' }} /> Shift Master ({shifts.length})
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/schedule-rule-master')} style={{ background: 'linear-gradient(135deg, #8e44ad, #9b59b6)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '50px', fontSize: '1rem', fontWeight: '600', boxShadow: '0 4px 8px rgba(142, 68, 173, 0.3)' }}>
              Manage Schedule Rules <FaArrowLeft style={{ transform: 'rotate(180deg)' }} />
            </button>
            <button onClick={() => setShowColumnModal(true)} style={{ background: 'linear-gradient(135deg, #95a5a6, #7f8c8d)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '50px', fontSize: '1rem', fontWeight: '600' }}>
              Manage Columns
            </button>
          </div>
        </div>

        {error && <div style={{ background: '#ffebee', color: '#c0392b', padding: '15px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center', border: '1px solid #e74c3c' }}><FaTimes /> {error}</div>}
        {message && <div style={{ background: '#d4edda', color: '#155724', padding: '15px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center', border: '1px solid #28a745' }}><FaSave /> {message}</div>}

        <div style={{ background: '#ffffff', padding: '30px', borderRadius: '15px', marginBottom: '30px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: '1px solid #e9ecef', position: 'relative' }}>

          {/* Format Toggle Button - Absolute positioned top-left of this section */}
          <div style={{ position: 'absolute', top: '30px', left: '30px', padding: '4px', background: '#f1f2f6', borderRadius: '8px', display: 'flex', gap: '4px' }}>
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

          <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '25px', fontSize: '1.5rem', fontWeight: '600' }}>{editingId ? 'Edit Shift' : 'Add New Shift'}</h2>

          <form onSubmit={editingId ? handleUpdateShift : handleAddShift} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '40px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Shift Name</label>
              <input type="text" name="schedule_name" placeholder="e.g. Morning Shift" value={formData.schedule_name} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #3498db', borderRadius: '10px', background: '#f8f9fa' }} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Department</label>
              <select name="department" value={formData.department} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #3498db', borderRadius: '10px', background: '#f8f9fa' }}>
                <option value="">All Departments (Global)</option>
                {departments.map(d => <option key={d.id || d._id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Time Slots (Add multiple for multi-shift days)</label>

              {formData.time_slots.map((slot, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', background: '#f8f9fa' }}>

                  <div style={{ flex: 1, maxWidth: use24Hour ? '140px' : '200px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#7f8c8d', marginBottom: '4px', display: 'block' }}>Start Time {use24Hour ? '(24h)' : '(12h)'}</label>
                    <CustomTimePicker
                      placeholder="Start"
                      value={slot.start_time}
                      onChange={(val) => updateSlot(index, 'start_time', val)}
                      format24={use24Hour}
                      required
                    />
                  </div>

                  <div style={{ flex: 1, maxWidth: use24Hour ? '140px' : '200px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#7f8c8d', marginBottom: '4px', display: 'block' }}>End Time {use24Hour ? '(24h)' : '(12h)'}</label>
                    <CustomTimePicker
                      placeholder="End"
                      value={slot.end_time}
                      onChange={(val) => updateSlot(index, 'end_time', val)}
                      format24={use24Hour}
                      required
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: 0, fontSize: '0.9rem', height: '40px', marginTop: '18px' }}>
                    <input
                      type="checkbox"
                      checked={slot.is_overnight}
                      onChange={(e) => updateSlot(index, 'is_overnight', e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Overnight
                    {slot.is_overnight ? <FaMoon style={{ color: '#8e44ad', fontSize: '1rem' }} /> : <FaSun style={{ color: '#f39c12', fontSize: '1rem' }} />}
                  </label>
                  {formData.time_slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      style={{ padding: '8px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', height: '40px', marginTop: '18px' }}
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSlot}
                style={{ background: 'linear-gradient(135deg, #27ae60, #2ecc71)', color: 'white', border: 'none', cursor: 'pointer', padding: '10px 20px', borderRadius: '25px', fontSize: '0.95rem', fontWeight: '600' }}
              >
                <FaPlus /> Add Time Slot
              </button>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Description</label>
              <textarea name="description" placeholder="Optional description" value={formData.description} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #3498db', borderRadius: '10px', background: '#f8f9fa', minHeight: '80px' }} />
            </div>

            <button type="submit" style={{ background: 'linear-gradient(135deg, #3498db, #2980b9)', color: 'white', border: 'none', cursor: 'pointer', padding: '12px 24px', borderRadius: '50px', fontSize: '1rem', fontWeight: '600', gridColumn: '1 / -1', boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)' }}>
              <FaSave /> {editingId ? 'Update Shift' : 'Add Shift'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setFormData({ schedule_name: '', time_slots: [{ start_time: '', end_time: '', is_overnight: false }], description: '' }); }} style={{ background: '#95a5a6', color: 'white', border: 'none', cursor: 'pointer', padding: '12px 24px', borderRadius: '50px', fontSize: '1rem', fontWeight: '600', gridColumn: '1 / -1' }}>
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {shifts.length > 0 ? (
          <div style={{ overflowX: 'auto', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #3498db, #2980b9)', color: '#ffffff' }}>
                  {columnOrder.map((col, index) => (
                    <th key={col.key} style={{ ...thStyle, textAlign: col.align }} draggable={col.key !== "actions"} onDragStart={(e) => col.key !== "actions" && handleDragStart(e, index)} onDragOver={(e) => col.key !== "actions" && handleDragOver(e)} onDrop={(e) => col.key !== "actions" && handleDrop(e, index)} onDoubleClick={(e) => { e.stopPropagation(); if (col.key !== "actions") removeColumn(index); }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift, index) => (
                  <tr key={shift.id || shift._id} style={{ borderBottom: '1px solid #e9ecef', backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff' }}>
                    {columnOrder.map((col) => (
                      <td key={col.key} style={{ ...tdStyle, textAlign: col.align }}>{getCellContent(shift, col)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '1.2rem', marginTop: '50px', padding: '40px', background: '#f8f9fa', borderRadius: '10px', border: '2px dashed #bdc3c7' }}>
            <FaClock style={{ fontSize: '4rem', marginBottom: '20px', color: '#3498db' }} /> No shifts found. Add one above!
          </div>
        )}
      </div>

      {/* Column Management Modal */}
      {showColumnModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '15px', width: '90%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', background: '#95a5a6', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Manage Table Columns</h4>
              <button onClick={() => setShowColumnModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}><FaTimes /></button>
            </div>
            <div style={{ padding: '25px', overflowY: 'auto', flex: 1 }}>
              <select value={selectedFieldToAdd} onChange={(e) => setSelectedFieldToAdd(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #3498db' }}>
                <option value="">Choose a field...</option>
                {possibleColumns.filter(p => !columnOrder.some(c => c.key === p.key)).map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
              <select value={selectedPosition} onChange={(e) => setSelectedPosition(Number(e.target.value))} style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #3498db' }}>
                {Array.from({ length: columnOrder.length + 1 }, (_, i) => (
                  <option key={i} value={i}>{i === columnOrder.length ? 'At the end' : `Before "${columnOrder[i].label}"`}</option>
                ))}
              </select>
              <button onClick={addColumn} disabled={!selectedFieldToAdd} style={{ width: '100%', padding: '10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Add Column</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Warning Modal */}
      {deleteId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <FaExclamationTriangle style={{ fontSize: '3rem', color: '#e74c3c', marginBottom: '20px' }} />
            <h3 style={{ color: '#2c3e50', margin: '0 0 15px 0' }}>Confirm Deletion</h3>
            <p style={{ color: '#7f8c8d', marginBottom: '25px' }}>Are you sure you want to delete this shift? This action cannot be undone.</p>
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

export default ScheduleMaster;