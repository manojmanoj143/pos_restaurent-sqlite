// src/components/Form/schedulemaster.jsx
// FULLY DETAILED: Shift Master page (Renamed internally from Schedule Master but file remains schedulemaster.jsx for now or can rely on user preference for filenames)
// Manages "shift_master" table via /api/schedules endpoint (as per plan backend mapping)
// UPDATED: Support multiple time slots per shift. Shift has schedule_name, time_slots array [{start_time, end_time, is_overnight}], description.
// Form allows adding/removing slots. Table displays time slots in a new column.
// Column management updated: removed startTime, endTime, isOvernight; added timeSlots.
// Validation ensures at least one valid slot.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaClock, FaSave, FaEdit, FaTrash, FaTimes, FaPlus, FaMoon, FaSun, FaExclamationTriangle } from 'react-icons/fa';

const ScheduleMaster = () => {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    schedule_name: '',
    time_slots: [{ start_time: '', end_time: '', is_overnight: false }],
    description: '',
  });
  const [baseUrl, setBaseUrl] = useState(null);

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState(null);

  // Column management states
  const [columnOrder, setColumnOrder] = useState([
    { key: "scheduleName", label: "Shift Name", align: "left" },
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
    { key: "timeSlots", label: "Time Slots", align: "left" },
    { key: "description", label: "Description", align: "left" },
    { key: "created_at", label: "Created At", align: "left" },
  ];

  // Fetch base URL
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

  // Fetch shifts
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
    }
  }, [baseUrl]);

  // Handle input change for non-array fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Time slots handlers
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

  // Add shift
  const handleAddShift = async (e) => {
    e.preventDefault();
    // Validate slots
    if (formData.time_slots.length === 0 || !formData.time_slots.every(slot => slot.start_time && slot.end_time)) {
      setError('Each time slot must have start and end time.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (!formData.schedule_name.trim()) {
      setError('Shift name is required.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    try {
      const url = baseUrl ? `${baseUrl}/api/schedules` : '/api/schedules';
      await axios.post(url, formData);
      setMessage('Shift added successfully!');
      setFormData({
        schedule_name: '',
        time_slots: [{ start_time: '', end_time: '', is_overnight: false }],
        description: '',
      });
      fetchShifts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(`Failed to add shift: ${err.response?.data?.error || err.message}`);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Edit shift
  const handleEditShift = (shift) => {
    setFormData({
      schedule_name: shift.schedule_name || '',
      time_slots: shift.time_slots || [{ start_time: '', end_time: '', is_overnight: false }],
      description: shift.description || '',
    });
    setEditingId(shift.id || shift._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update shift
  const handleUpdateShift = async (e) => {
    e.preventDefault();
    // Validate slots
    if (formData.time_slots.length === 0 || !formData.time_slots.every(slot => slot.start_time && slot.end_time)) {
      setError('Each time slot must have start and end time.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (!formData.schedule_name.trim()) {
      setError('Shift name is required.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    try {
      const url = baseUrl ? `${baseUrl}/api/schedules/${editingId}` : `/api/schedules/${editingId}`;
      await axios.put(url, formData);
      setMessage('Shift updated successfully!');
      setEditingId(null);
      setFormData({
        schedule_name: '',
        time_slots: [{ start_time: '', end_time: '', is_overnight: false }],
        description: '',
      });
      fetchShifts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(`Failed to update shift: ${err.response?.data?.error || err.message}`);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Trigger Delete flow
  const confirmDeleteShift = (id) => {
    setDeleteId(id);
  };

  // Execute Delete
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

  // Column management logic
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
      case 'timeSlots':
        if (!shift.time_slots || shift.time_slots.length === 0) return 'N/A';
        return (
          <div style={{ whiteSpace: 'pre-line', lineHeight: '1.4' }}>
            {shift.time_slots.map((slot, i) => `${slot.start_time} - ${slot.end_time}${slot.is_overnight ? ' (Overnight)' : ''}`).join('\n')}
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

        <div style={{ background: '#ffffff', padding: '30px', borderRadius: '15px', marginBottom: '30px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: '1px solid #e9ecef' }}>
          <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '25px', fontSize: '1.5rem', fontWeight: '600' }}>{editingId ? 'Edit Shift' : 'Add New Shift'}</h2>
          <form onSubmit={editingId ? handleUpdateShift : handleAddShift} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Shift Name</label>
              <input type="text" name="schedule_name" placeholder="e.g. Morning Shift" value={formData.schedule_name} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #3498db', borderRadius: '10px', background: '#f8f9fa' }} required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Time Slots (Add multiple for multi-shift days)</label>
              {formData.time_slots.map((slot, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', background: '#f8f9fa' }}>
                  <input
                    type="time"
                    placeholder="Start Time"
                    value={slot.start_time}
                    onChange={(e) => updateSlot(index, 'start_time', e.target.value)}
                    style={{ flex: 1, padding: '8px', border: '1px solid #3498db', borderRadius: '5px' }}
                    required
                  />
                  <input
                    type="time"
                    placeholder="End Time"
                    value={slot.end_time}
                    onChange={(e) => updateSlot(index, 'end_time', e.target.value)}
                    style={{ flex: 1, padding: '8px', border: '1px solid #3498db', borderRadius: '5px' }}
                    required
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: 0, fontSize: '0.9rem' }}>
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
                      style={{ padding: '8px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
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