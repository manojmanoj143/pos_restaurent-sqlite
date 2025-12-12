// src/components/Form/scheduleassignemployee.jsx
// FULLY DETAILED: Schedule Assign Employee
// Manages "employee_schedule_assign" table via /api/schedule-assignments
// Fixed: Ensured schedule and employee name resolution by trimming IDs, handling both id/_id, and debug logs (remove in prod).
// All IDs treated as strings for comparison. Added fallback for employee structure.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaUserTag, FaSave, FaEdit, FaTrash, FaTimes, FaCheck, FaBan, FaCalendarCheck, FaGift, FaClock } from 'react-icons/fa';

const ScheduleAssignEmployee = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]); // Rules from schedule_master
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Selected Schedule Details (for checking special days)
  const [selectedScheduleDetails, setSelectedScheduleDetails] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    employee_id: '',
    schedule_id: '',
    assigned_date: '',
    is_active: true,
    notes: '',
    special_day_assignments: [] // Array of applied special days (subset of rule's special_days)
  });
  const [baseUrl, setBaseUrl] = useState(null);

  // Constants
  // Column management omitted for brevity but can be added back if essential for user experience parity
  // For now focusing on core logic and styling parity

  useEffect(() => {
    const init = async () => {
      try {
        const configRes = await axios.get("http://localhost:8000/api/network_info");
        const { config: appConfig } = configRes.data;
        setBaseUrl(appConfig.mode === "client" ? `http://${appConfig.server_ip}:8000` : '');
      } catch (error) {
        console.error("Config fetch error:", error);
        setBaseUrl('');
      }
    };
    init();
  }, []);

  const fetchData = async () => {
    if (baseUrl === null) return;
    setLoading(true);
    try {
      const [assignRes, empRes, schedRes] = await Promise.all([
        axios.get(`${baseUrl}/api/schedule-assignments`),
        axios.get(`${baseUrl}/api/add-employee`), // Corrected endpoint
        axios.get(`${baseUrl}/api/schedule-rules`)
      ]);
      setAssignments(assignRes.data || []);
      // Handle potential different response structure for employees (e.g. array of objects, or {data: []})
      const empData = Array.isArray(empRes.data) ? empRes.data : (empRes.data?.data || []);
      setEmployees(empData);
      setSchedules(schedRes.data || []);
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

  // Effect to update selectedScheduleDetails when schedule_id changes
  useEffect(() => {
    if (formData.schedule_id) {
      const rule = schedules.find(s => String(s._id) === String(formData.schedule_id));
      setSelectedScheduleDetails(rule || null);

      // If creating new assignment (not editing), auto-populate special_day_assignments based on defaults
      // BUT ONLY if we haven't already set them (to avoid overwriting user manual changes if they switch back and forth? 
      // actually, if they switch schedule, we probably SHOULD reset.
      if (!editingId) {
        // Logic: Holidays checked by default, everything else unchecked by default?
        // Or based on user request: "holiday eruntha athu enakku employeeassignla enakku checkbox tick markala erukkanum"
        if (rule && rule.special_days) {
          const initialSpecialDays = rule.special_days.map(sd => ({
            ...sd,
            is_observed: sd.type === 'Holiday' // Default true for Holiday, false for others
          })).filter(sd => sd.is_observed); // Only keep the observed ones in the list?
          // Wait, simpler to keep ALL and just toggle flag? 
          // No, backend expects a list of "special_day_assignments". 
          // It's cleaner to just store the "Active" ones. 

          setFormData(prev => ({
            ...prev,
            special_day_assignments: initialSpecialDays
          }));
        }
      }
    } else {
      setSelectedScheduleDetails(null);
    }
  }, [formData.schedule_id, schedules]); // editingId excluded intentionally so it doesn't reset on edit load

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle Special Day Checkbox Toggle
  const toggleSpecialDay = (specialDay) => {
    setFormData(prev => {
      const exists = prev.special_day_assignments.find(sd => sd.date === specialDay.date && sd.description === specialDay.description);

      let newAssignments;
      if (exists) {
        // Remove it (Uncheck)
        newAssignments = prev.special_day_assignments.filter(sd => !(sd.date === specialDay.date && sd.description === specialDay.description));
      } else {
        // Add it (Check)
        // We add the full object so we have the type/times stored in assignment too if needed later
        newAssignments = [...prev.special_day_assignments, { ...specialDay, is_observed: true }];
      }
      return { ...prev, special_day_assignments: newAssignments };
    });
  };

  const isSpecialDayChecked = (specialDay) => {
    // Check if this special day is present in formData.special_day_assignments
    return formData.special_day_assignments?.some(sd => sd.date === specialDay.date && sd.description === specialDay.description);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.schedule_id || !formData.assigned_date) {
      setError("Please fill all required fields.");
      return;
    }
    try {
      const url = `${baseUrl}/api/schedule-assignments${editingId ? `/${editingId}` : ''}`;
      const method = editingId ? 'put' : 'post';
      const submitData = { ...formData };
      await axios[method](url, submitData);
      setMessage(`Assignment ${editingId ? 'updated' : 'created'} successfully!`);
      setEditingId(null);
      setFormData({ employee_id: '', schedule_id: '', assigned_date: '', is_active: true, notes: '', special_day_assignments: [] });
      setSelectedScheduleDetails(null);
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error("Submit error:", err); // Debug log
      setError(`Failed to save: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);

    // Find the rule to set selectedScheduleDetails immediately
    const rule = schedules.find(s => String(s._id) === String(item.schedule_id));
    setSelectedScheduleDetails(rule || null);

    setFormData({
      employee_id: item.employee_id || '',
      schedule_id: item.schedule_id || '',
      assigned_date: item.assigned_date || '',
      is_active: item.is_active !== undefined ? item.is_active : true,
      notes: item.notes || '',
      special_day_assignments: item.special_day_assignments || [] // Load existing special assignments
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${baseUrl}/api/schedule-assignments/${id}`);
      setMessage("Deleted successfully!");
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error("Delete error:", err); // Debug log
      setError(`Failed to delete: ${err.message}`);
    }
  };

  // Helpers - Enhanced with string trimming and flexible ID matching
  const getEmpName = (id) => {
    if (!id) return 'Unknown Employee';
    const idStr = String(id).trim();
    const emp = employees.find(e => {
      const empId = String(e.id || e._id || '').trim();
      return empId === idStr;
    });
    if (!emp) {
      console.warn(`Employee not found for ID: ${idStr}`, { employees }); // Debug log - remove in prod
      return 'Unknown Employee';
    }
    return emp.name || emp.employeeName || 'Unnamed Employee'; // Flexible name field
  };

  const getSchedName = (id) => {
    if (!id) return 'Unknown Schedule';
    const idStr = String(id).trim();
    const sched = schedules.find(s => String(s._id).trim() === idStr);
    if (!sched) {
      console.warn(`Schedule not found for ID: ${idStr}`, { schedules }); // Debug log - remove in prod
      return 'Unknown Schedule';
    }
    return sched.schedule_name;
  };

  if (loading && !baseUrl) return <div style={{ padding: '50px', textAlign: 'center' }}>Initializing...</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0eaFC 0%, #cfdef3 100%)', padding: '20px' }}>
      <button onClick={() => navigate('/admin')} style={{ ...buttonStyle, position: 'fixed', top: '20px', left: '20px', zIndex: 100 }}>
        <FaArrowLeft /> Back
      </button>
      <div style={{ maxWidth: '1100px', margin: '60px auto', background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>

        {/* Header */}
        <div style={{ borderBottom: '2px solid #3498db', paddingBottom: '15px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#2c3e50', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaUserTag style={{ color: '#3498db' }} /> Assign Employee Schedule
          </h2>
          <span style={{ background: '#3498db', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9rem' }}>
            {assignments.length} Active Assignments
          </span>
        </div>

        {/* Alerts */}
        {error && <div style={{ background: '#ffdddd', color: '#c0392b', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}
        {message && <div style={{ background: '#ddffdd', color: '#27ae60', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>{message}</div>}

        {/* Form */}
        <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '12px', border: '1px solid #e9ecef', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0, color: '#34495e', borderBottom: '1px dashed #bdc3c7', paddingBottom: '10px', marginBottom: '20px' }}>
            {editingId ? 'Edit Assignment' : 'New Assignment'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>

            {/* Employee Selection */}
            <div>
              <label style={labelStyle}>Select Employee</label>
              <select required name="employee_id" value={formData.employee_id} onChange={handleInputChange} style={inputStyle}>
                <option value="">-- Choose Employee --</option>
                {employees.map(e => {
                  const empId = String(e.id || e._id || '').trim();
                  const empName = e.name || e.employeeName || 'Unnamed';
                  const empDes = e.employeeDesignation || e.designation || 'N/A';
                  return (
                    <option key={empId} value={empId}>{empName} ({empDes})</option>
                  );
                })}
              </select>
            </div>

            {/* Schedule Selection */}
            <div>
              <label style={labelStyle}>Select Schedule Rule</label>
              <select required name="schedule_id" value={formData.schedule_id} onChange={handleInputChange} style={inputStyle}>
                <option value="">-- Choose Schedule --</option>
                {schedules.map(s => (
                  <option key={s._id} value={s._id}>{s.schedule_name} ({s.start_date} to {s.end_date})</option>
                ))}
              </select>
            </div>

            {/* Assigned Date */}
            <div>
              <label style={labelStyle}>Assigned Date (Start)</label>
              <input required type="date" name="assigned_date" value={formData.assigned_date} onChange={handleInputChange} style={inputStyle} />
            </div>

            {/* Active Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '30px' }}>
              <label style={{ ...labelStyle, marginBottom: 0, marginRight: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} style={{ width: '18px', height: '18px', marginRight: '8px' }} />
                Active Assignment
              </label>
            </div>

            {/* Special Days Section (Conditionally Rendered) */}
            {selectedScheduleDetails && selectedScheduleDetails.special_days && selectedScheduleDetails.special_days.length > 0 && (
              <div style={{ gridColumn: '1 / -1', background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #dcdcdc' }}>
                <h4 style={{ marginTop: 0, color: '#e67e22', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaGift /> Special Days & Exceptions
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#7f8c8d', fontStyle: 'italic' }}>
                  Check the box to apply the special day/holiday to this employee. Unchecked days will be treated as normal working days (or default schedule).
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '10px' }}>
                  {selectedScheduleDetails.special_days.map((sd, idx) => {
                    const isChecked = isSpecialDayChecked(sd);
                    return (
                      <div key={idx}
                        onClick={() => toggleSpecialDay(sd)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px',
                          borderRadius: '6px',
                          border: isChecked ? '1px solid #2ecc71' : '1px solid #ecf0f1',
                          background: isChecked ? '#f0fff4' : '#fcfcfc',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: isChecked ? 'none' : '2px solid #bdc3c7',
                          background: isChecked ? '#2ecc71' : 'white',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: '10px',
                          color: 'white',
                          fontSize: '12px'
                        }}>
                          {isChecked && <FaCheck />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '0.9rem' }}>
                            {sd.date} <span style={{ fontWeight: 'normal', color: '#7f8c8d' }}>({sd.type})</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#34495e' }}>{sd.description}</div>
                          {/* Display Extra Info based on type */}
                          {sd.type === 'Half-Day' && <div style={{ fontSize: '0.8rem', color: '#8e44ad' }}><FaClock style={{ fontSize: '0.7rem' }} /> {sd.start_time} - {sd.end_time}</div>}
                          {sd.type === 'Extended' && <div style={{ fontSize: '0.8rem', color: '#e67e22' }}><FaClock style={{ fontSize: '0.7rem' }} /> Ext: {sd.extended_start} - {sd.extended_end}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Notes (Optional)</label>
              <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Additional details..." style={{ ...inputStyle, minHeight: '80px' }} />
            </div>

            {/* Buttons */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '15px' }}>
              <button type="submit" style={{ ...buttonStyle, flex: 1, background: '#27ae60' }}>
                <FaSave /> {editingId ? 'Update Assignment' : 'Assign Schedule'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setFormData({ employee_id: '', schedule_id: '', assigned_date: '', is_active: true, notes: '', special_day_assignments: [] }); setSelectedScheduleDetails(null); }} style={{ ...buttonStyle, background: '#95a5a6' }}>
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
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Schedule Rule</th>
                <th style={thStyle}>Assigned On</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>No assignments yet.</td>
                </tr>
              ) : assignments.map((a, i) => (
                <tr key={a._id} style={{ background: i % 2 === 0 ? 'white' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{getEmpName(a.employee_id)}</td>
                  <td style={tdStyle}>{getSchedName(a.schedule_id)}</td>
                  <td style={tdStyle}>{a.assigned_date}</td>
                  <td style={tdStyle}>
                    {a.is_active ?
                      <span style={{ color: '#27ae60', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><FaCheck /> Active</span> :
                      <span style={{ color: '#e74c3c', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><FaBan /> Inactive</span>
                    }
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button onClick={() => handleEdit(a)} style={iconBtnStyle} title="Edit"><FaEdit /></button>
                    <button onClick={() => handleDelete(a._id)} style={{ ...iconBtnStyle, color: '#e74c3c' }} title="Delete"><FaTrash /></button>
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

export default ScheduleAssignEmployee;
