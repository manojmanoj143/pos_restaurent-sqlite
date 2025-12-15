// src/components/Form/scheduleassignemployee.jsx
// FULLY DETAILED: Schedule Assign Employee
// Manages "employee_schedule_assign" table via /api/schedule-assignments
// Fixed: Ensured schedule and employee name resolution by trimming IDs.
// Enhanced: All special days (both from Rule AND previously Assigned) are displayed.
// This prevents "hidden" assigned days if the rule changes or if they differ.
// Logic:
// 1. Get days from selected Schedule Rule.
// 2. Get days from current Assignment (formData).
// 3. Merge them based on unique date+description.
// 4. Display all. Checked = in formData. Unchecked = only in Rule (or removed from formData).

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const editingIdRef = useRef(null);

  // Selected Schedule Details (for checking special days)
  const [selectedScheduleDetails, setSelectedScheduleDetails] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    employee_id: '',
    schedule_id: '',
    assigned_date: '',
    is_active: true,
    notes: '',
    special_day_assignments: [] // Array of applied special days 
  });

  const [baseUrl, setBaseUrl] = useState(null);

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
        axios.get(`${baseUrl}/api/add-employee`),
        axios.get(`${baseUrl}/api/schedule-rules`)
      ]);

      setAssignments(assignRes.data || []);
      const empData = Array.isArray(empRes.data) ? empRes.data : (empRes.data?.data || []);
      setEmployees(empData);
      setSchedules(schedRes.data || []);
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

  // Effect to update selectedScheduleDetails when schedule_id changes
  useEffect(() => {
    if (formData.schedule_id) {
      const rule = schedules.find(s => String(s._id) === String(formData.schedule_id));
      setSelectedScheduleDetails(rule || null);

      // If creating NEW assignment (not editing), auto-populate defaults from rule
      if (!editingIdRef.current && rule && rule.special_days) {
        const initialSpecialDays = rule.special_days
          .map(sd => ({
            ...sd,
            is_observed: sd.type === 'Holiday' // Default true for Holiday
          }))
          .filter(sd => sd.is_observed);

        setFormData(prev => ({
          ...prev,
          special_day_assignments: initialSpecialDays
        }));
      }
    } else {
      setSelectedScheduleDetails(null);
      if (!editingIdRef.current) {
        setFormData(prev => ({ ...prev, special_day_assignments: [] }));
      }
    }
  }, [formData.schedule_id, schedules]);

  // MEMOIZED SPECIAL DAYS: Merge Rule Days + Assigned Days
  // This ensures we show EVERYTHING that is relevant
  const displayedSpecialDays = useMemo(() => {
    const combined = new Map();

    // 1. Add days from the Rule
    if (selectedScheduleDetails && selectedScheduleDetails.special_days) {
      selectedScheduleDetails.special_days.forEach(sd => {
        const key = `${sd.date}-${sd.description}`;
        combined.set(key, { ...sd, source: 'rule' });
      });
    }

    // 2. Add days from the Assignment (overrides rule if same, adds if new)
    if (formData.special_day_assignments) {
      formData.special_day_assignments.forEach(sd => {
        const key = `${sd.date}-${sd.description}`;
        // If it exists from rule, we prefer the 'assignment' version status, but keep metadata if needed.
        // Actually, we just need to ensure it's in the list.
        const existing = combined.get(key) || {};
        combined.set(key, { ...existing, ...sd, source: 'assignment' });
      });
    }

    // Convert to array and sort by date
    return Array.from(combined.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [selectedScheduleDetails, formData.special_day_assignments]);


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleSpecialDay = (specialDay) => {
    setFormData(prev => {
      // Check if currently assigned/observed
      const exists = prev.special_day_assignments.find(sd => sd.date === specialDay.date && sd.description === specialDay.description);

      let newAssignments;
      if (exists) {
        // Remove it
        newAssignments = prev.special_day_assignments.filter(sd => !(sd.date === specialDay.date && sd.description === specialDay.description));
      } else {
        // Add it
        newAssignments = [...prev.special_day_assignments, { ...specialDay, is_observed: true }];
      }
      return { ...prev, special_day_assignments: newAssignments };
    });
  };

  const isSpecialDayChecked = (specialDay) => {
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
      resetForm();
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error("Submit error:", err);
      setError(`Failed to save: ${err.response?.data?.error || err.message}`);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    editingIdRef.current = null;
    setFormData({ employee_id: '', schedule_id: '', assigned_date: '', is_active: true, notes: '', special_day_assignments: [] });
    setSelectedScheduleDetails(null);
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    editingIdRef.current = item._id;

    // Find rule
    const rule = schedules.find(s => String(s._id) === String(item.schedule_id));
    setSelectedScheduleDetails(rule || null);

    setFormData({
      employee_id: item.employee_id || '',
      schedule_id: item.schedule_id || '',
      assigned_date: item.assigned_date || '',
      is_active: item.is_active !== undefined ? item.is_active : true,
      notes: item.notes || '',
      special_day_assignments: item.special_day_assignments || []
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
      console.error("Delete error:", err);
      setError(`Failed to delete: ${err.message}`);
    }
  };

  const getEmpName = (id) => {
    if (!id) return 'Unknown Employee';
    const idStr = String(id).trim();
    const emp = employees.find(e => String(e.id || e._id || '').trim() === idStr);
    return emp ? (emp.name || emp.employeeName) : 'Unknown Employee';
  };

  const getSchedName = (id) => {
    if (!id) return 'Unknown Schedule';
    const idStr = String(id).trim();
    const sched = schedules.find(s => String(s._id).trim() === idStr);
    return sched ? sched.schedule_name : 'Unknown Schedule';
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
                  return <option key={empId} value={empId}>{e.name || e.employeeName || 'Unnamed'} ({e.employeeDesignation || 'N/A'})</option>;
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

            {/* Special Days Section - MERGED DISPLAY */}
            {displayedSpecialDays.length > 0 && (
              <div style={{ gridColumn: '1 / -1', background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #dcdcdc' }}>
                <h4 style={{ marginTop: 0, color: '#e67e22', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaGift /> Special Days & Exceptions
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#7f8c8d', fontStyle: 'italic' }}>
                  Showing all special days defined in the schedule rule AND any manually assigned exceptions. Check to apply/observe.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '10px' }}>
                  {displayedSpecialDays.map((sd, idx) => {
                    const isChecked = isSpecialDayChecked(sd);
                    return (
                      <div key={idx}
                        onClick={() => toggleSpecialDay(sd)}
                        style={{
                          display: 'flex', alignItems: 'center', padding: '10px', borderRadius: '6px',
                          border: isChecked ? '1px solid #2ecc71' : '1px solid #ecf0f1',
                          background: isChecked ? '#f0fff4' : '#fcfcfc',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}>
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '4px',
                          border: isChecked ? 'none' : '2px solid #bdc3c7',
                          background: isChecked ? '#2ecc71' : 'white',
                          display: 'flex', justifyContent: 'center', alignItems: 'center',
                          marginRight: '10px', color: 'white', fontSize: '12px'
                        }}>
                          {isChecked && <FaCheck />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '0.9rem' }}>
                            {sd.date} <span style={{ fontWeight: 'normal', color: '#7f8c8d' }}>({sd.type})</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#34495e' }}>{sd.description}</div>
                          {sd.type === 'Half-Day' && <div style={{ fontSize: '0.8rem', color: '#8e44ad' }}><FaClock style={{ fontSize: '0.7rem' }} /> {sd.start_time} - {sd.end_time}</div>}
                          {sd.type === 'Extended' && <div style={{ fontSize: '0.8rem', color: '#e67e22' }}><FaClock style={{ fontSize: '0.7rem' }} /> Ext: {sd.extended_start} - {sd.extended_end}</div>}
                          {sd.type === 'Special-Shift' && <div style={{ fontSize: '0.8rem', color: '#9b59b6' }}>Shift ID: {sd.shift_id}</div>}
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
                <button type="button" onClick={resetForm} style={{ ...buttonStyle, background: '#95a5a6' }}>
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
                <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>No assignments yet.</td></tr>
              ) : assignments.map((a, i) => (
                <tr key={a._id} style={{ background: i % 2 === 0 ? 'white' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{getEmpName(a.employee_id)}</td>
                  <td style={tdStyle}>{getSchedName(a.schedule_id)}</td>
                  <td style={tdStyle}>{a.assigned_date}</td>
                  <td style={tdStyle}>
                    {a.is_active ?
                      <span style={{ color: '#27ae60', fontWeight: 'bold' }}><FaCheck /> Active</span> :
                      <span style={{ color: '#e74c3c', fontWeight: 'bold' }}><FaBan /> Inactive</span>
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

const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #bdc3c7', width: '100%', fontSize: '0.95rem' };
const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50', fontSize: '0.9rem' };
const buttonStyle = { padding: '10px 20px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'transform 0.2s', background: '#3498db' };
const thStyle = { padding: '12px 15px', textAlign: 'left', fontWeight: '600' };
const tdStyle = { padding: '12px 15px', color: '#2c3e50' };
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#3498db', fontSize: '1.1rem', margin: '0 5px' };

export default ScheduleAssignEmployee;