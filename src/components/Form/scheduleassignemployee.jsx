// src/components/Form/scheduleassignemployee.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaUserTag, FaSave, FaEdit, FaTrash, FaTimes, FaCheck, FaBan, FaCalendarCheck, FaGift, FaClock, FaMoon, FaExclamationTriangle, FaChevronLeft, FaChevronRight, FaPlus, FaSun } from 'react-icons/fa';

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

  const [h, setH] = useState('');
  const [m, setM] = useState('');
  const [p, setP] = useState('AM');

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
        const { h: h24, m: m24 } = to24h(hour, minute, period);
        setH(h24);
        setM(m24);
        setP('');
      } else {
        setH(hour.toString().padStart(2, '0'));
        setM(minute.toString().padStart(2, '0'));
        setP(period);
      }
    }
  }, [value, format24]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const hElem = document.getElementById(`h-${pickerId.current}-${parseInt(h)}`);
        const mElem = document.getElementById(`m-${pickerId.current}-${parseInt(m)}`);
        const pElem = document.getElementById(`p-${pickerId.current}-${p}`);
        if (hElem) hElem.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (mElem) mElem.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (pElem) pElem.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, h, m, p]);

  const notifyChange = (newH, newM, newP) => {
    if (format24) {
      if (newH !== '' && newM !== '') {
        const val12 = to12h(newH, newM);
        onChange(val12);
      } else {
        if (newH === '' && newM === '') onChange('');
      }
    } else {
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const hours = format24
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i + 1);
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
          zIndex: 1500,
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

// --- Main Component ---
const ScheduleAssignEmployee = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [leaves, setLeaves] = useState([]); // NEW: Leaves state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const editingIdRef = useRef(null);
  const [use24Hour, setUse24Hour] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    date: '',
    type: 'Holiday',
    description: '',
    scope: 'employee',
    start_time: '',
    end_time: '',
    extended_start: '',
    extended_end: '',
    extended_start: '',
    extended_end: '',
    shift_id: '',
    // NEW: Substitute Fields
    substitute_employee_id: '',
  });

  // NEW: State for available substitutes
  const [availableSubstitutes, setAvailableSubstitutes] = useState([]);

  const [selectedScheduleDetails, setSelectedScheduleDetails] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    schedule_id: '',
    assigned_date: '',
    is_active: true,
    notes: '',
    special_day_assignments: []
  });

  const [calendarMonth, setCalendarMonth] = useState(new Date());
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
      const [assignRes, empRes, schedRes, shiftsRes, leavesRes] = await Promise.all([
        axios.get(`${baseUrl}/api/schedule-assignments`),
        axios.get(`${baseUrl}/api/add-employee`),
        axios.get(`${baseUrl}/api/schedule-rules`),
        axios.get(`${baseUrl}/api/schedules`),
        axios.get(`${baseUrl}/api/leave-applications`) // NEW: Fetch leaves
      ]);
      setAssignments(assignRes.data || []);
      const empData = Array.isArray(empRes.data) ? empRes.data : (empRes.data?.data || []);
      setEmployees(empData);
      setSchedules(schedRes.data || []);
      setShifts(shiftsRes.data || []);
      setLeaves(leavesRes.data || []); // Store leaves
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

  useEffect(() => {
    const { employee_id, schedule_id } = formData;
    let currentRule = null;

    if (schedule_id) {
      currentRule = schedules.find(s => String(s._id) === String(schedule_id));
      if (!selectedScheduleDetails || String(selectedScheduleDetails._id) !== String(schedule_id)) {
        setSelectedScheduleDetails(currentRule || null);
      }
    } else {
      setSelectedScheduleDetails(null);
    }

    if (employee_id && schedule_id) {
      const existing = assignments.find(a =>
        String(a.employee_id) === String(employee_id) &&
        String(a.schedule_id) === String(schedule_id)
      );
      if (existing) {
        if (editingId !== existing._id) {
          setEditingId(existing._id);
          editingIdRef.current = existing._id;
          setFormData(prev => ({
            ...prev,
            assigned_date: existing.assigned_date,
            is_active: existing.is_active !== undefined ? existing.is_active : true,
            notes: existing.notes || '',
            special_day_assignments: existing.special_day_assignments || []
          }));
        }
        return;
      }
    }

    if (editingId) {
      setEditingId(null);
      editingIdRef.current = null;
    }

    if (schedule_id && currentRule) {
      if (currentRule.special_days) {
        const initialSpecialDays = currentRule.special_days.map(sd => ({
          ...sd,
          is_observed: sd.type === 'Holiday' || sd.is_observed === true
        })).filter(sd => sd.is_observed);
        setFormData(prev => ({
          ...prev,
          special_day_assignments: initialSpecialDays,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          special_day_assignments: []
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, special_day_assignments: [] }));
    }
  }, [formData.employee_id, formData.schedule_id, assignments, schedules]);

  const displayedSpecialDays = useMemo(() => {
    const combined = new Map();
    if (selectedScheduleDetails && selectedScheduleDetails.special_days) {
      selectedScheduleDetails.special_days.forEach(sd => {
        const key = `${sd.date}-${sd.description}`;
        combined.set(key, { ...sd, source: 'rule' });
      });
    }
    if (formData.special_day_assignments) {
      formData.special_day_assignments.forEach(sd => {
        const key = `${sd.date}-${sd.description}`;
        const existing = combined.get(key) || {};
        combined.set(key, { ...existing, ...sd, source: 'assignment' });
      });
    }
    return Array.from(combined.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [selectedScheduleDetails, formData.special_day_assignments]);

  // NEW: Filter Logic
  const filteredEmployees = useMemo(() => {
    // If a schedule is selected, filter employees by that schedule's shift department
    if (formData.schedule_id) {
      const rule = schedules.find(s => String(s._id) === String(formData.schedule_id));
      if (rule) {
        const shift = shifts.find(s => String(s._id) === String(rule.shift_id));
        if (shift && shift.department) {
          return employees.filter(e => e.department === shift.department);
        }
      }
    }
    return employees;
  }, [employees, formData.schedule_id, schedules, shifts]);

  const filteredSchedules = useMemo(() => {
    // If an employee is selected, filter schedules by that employee's department
    if (formData.employee_id) {
      const empId = String(formData.employee_id).trim();
      const emp = employees.find(e => String(e.id || e._id || '').trim() === empId);
      if (emp && emp.department) {
        return schedules.filter(s => {
          const shift = shifts.find(sh => String(sh._id) === String(s.shift_id));
          // Show if shift has NO department (Global) or MATCHES employee department
          return !shift || !shift.department || shift.department === emp.department;
        });
      }
    }
    return schedules;
  }, [schedules, formData.employee_id, employees, shifts]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleSpecialDay = (specialDay) => {
    setFormData(prev => {
      const exists = prev.special_day_assignments.find(sd => sd.date === specialDay.date && sd.description === specialDay.description);
      let newAssignments;
      if (exists) {
        newAssignments = prev.special_day_assignments.filter(sd => !(sd.date === specialDay.date && sd.description === specialDay.description));
      } else {
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
      await axios[method](url, formData);
      setMessage(`Assignment ${editingId ? 'updated' : 'created'} successfully!`);
      resetForm();
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  const handleExecuteDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${baseUrl}/api/schedule-assignments/${deleteId}`);
      setMessage("Deleted successfully!");
      setDeleteId(null);
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(`Failed to delete: ${err.message}`);
      setDeleteId(null);
    }
  };

  const getEmpName = (id) => {
    if (!id) return 'Unknown Employee';
    const idStr = String(id).trim();
    const emp = employees.find(e => String(e.id || e._id || '').trim() === idStr);
    return emp ? (emp.name || emp.employeeName) : 'Unknown Employee';
  };

  const getShiftName = (shiftId) => {
    if (!shiftId) return 'No Shift';
    const idStr = String(shiftId).trim();
    const shift = shifts.find(s => String(s._id).trim() === idStr);
    if (!shift) return 'Unknown Shift';
    const slotsStr = shift.time_slots ? shift.time_slots.map(t => `${t.start_time}-${t.end_time}${t.is_overnight ? ' (O)' : ''}`).join(', ') : '';
    const deptStr = shift.department ? ` [${shift.department}]` : '';
    return `${shift.schedule_name} (${slotsStr})${deptStr}`;
  };

  const getRuleName = (ruleId) => {
    if (!ruleId) return 'Unknown Schedule';
    const idStr = String(ruleId).trim();
    const rule = schedules.find(s => String(s._id).trim() === idStr);
    if (!rule) return 'Unknown Schedule';
    const shiftStr = getShiftName(rule.shift_id);
    return `${rule.schedule_name} (${rule.start_date} to ${rule.end_date}) - ${shiftStr}`;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    return { days, startOffset };
  };

  const handlePrevMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getDayStatus = (day) => {
    if (!selectedScheduleDetails) return null;
    const year = calendarMonth.getFullYear();
    const month = String(calendarMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    const dateObj = new Date(year, calendarMonth.getMonth(), day);
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dateObj.getDay()];

    const special = displayedSpecialDays.find(sd => sd.date === dateStr);

    // Check for Approved Leave
    if (formData.employee_id) {
      const approvedLeave = leaves.find(l =>
        l.employee_id === formData.employee_id &&
        l.status === 'APPROVED' &&
        l.from_date <= dateStr && // Assuming single date or range logic
        l.to_date >= dateStr
      );
      if (approvedLeave) {
        return { type: 'Leave', color: '#f39c12', tooltip: `On Leave: ${approvedLeave.leave_name || 'Approved Leave'}` };
      }
    }

    if (special) {
      if (special.type === 'Holiday') {
        return { type: 'Holiday', color: '#e74c3c', tooltip: `Holiday: ${special.description}` };
      }
      if (special.type === 'Extended') {
        return { type: 'Extended', color: '#e67e22', tooltip: `Extended: ${special.extended_start} - ${special.extended_end} (${special.description})` };
      }
      if (special.type === 'Half-Day') {
        return { type: 'Half-Day', color: '#9b59b6', tooltip: `Half-Day: ${special.start_time} - ${special.end_time}` };
      }
      if (special.type === 'Special-Shift') {
        return { type: 'Special-Shift', color: '#3498db', tooltip: `Special Shift: ${special.description}` };
      }
    }

    if (!selectedScheduleDetails.working_days.includes(dayName)) {
      return { type: 'Weekly Off', color: '#e74c3c', tooltip: 'Weekly Off' };
    }

    return { type: 'Working', color: '#2ecc71', tooltip: 'Regular Shift' };
  };

  const getAvailableSubstitutes = (dateStr, department) => {
    return employees.filter(e => {
      // 1. Same Department
      if (e.department !== department) return false;
      // 2. Exclude Current Employee
      if (String(e.id || e._id) === String(formData.employee_id)) return false;
      // 3. Exclude On Leave
      const onLeave = leaves.some(l =>
        l.employee_id === (e.id || e._id) &&
        l.status === 'APPROVED' &&
        l.from_date <= dateStr &&
        l.to_date >= dateStr
      );
      if (onLeave) return false;
      // 4. Exclude Already Assigned (Basic Check: Has any active assignment covering this date?)
      // Note: This is strict. It excludes anyone with an active assignment, even if it's their Off day.
      // User requested: "Exclude employees already assigned"
      const isAssigned = assignments.some(a =>
        String(a.employee_id) === String(e.id || e._id) &&
        a.is_active &&
        a.assigned_date <= dateStr
      );
      if (isAssigned) return false;

      return true;
    });
  };

  const handleDayClick = (day) => {
    const year = calendarMonth.getFullYear();
    const month = String(calendarMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const fullDate = `${year}-${month}-${dayStr}`;

    const status = getDayStatus(day);

    if (status && status.type === 'Leave') {
      // Substitute Mode
      const currentEmp = employees.find(e => String(e.id || e._id) === String(formData.employee_id));
      const dept = currentEmp ? currentEmp.department : '';
      const subs = getAvailableSubstitutes(fullDate, dept);

      setAvailableSubstitutes(subs);
      setModalData({
        date: fullDate,
        type: 'Substitute',
        description: `Substitution for ${currentEmp ? currentEmp.name : 'Employee'}`,
        scope: 'employee',
        start_time: '',
        end_time: '',
        extended_start: '',
        extended_end: '',
        shift_id: '',
        substitute_employee_id: ''
      });
      setShowModal(true);
      return;
    }

    setModalData({
      date: fullDate,
      type: 'Holiday',
      description: '',
      scope: 'employee',
      start_time: '',
      end_time: '',
      extended_start: '',
      extended_end: '',
      shift_id: '',
      substitute_employee_id: ''
    });
    setShowModal(true);
  };

  const handleModalSave = async () => {
    if (!modalData.description) {
      alert("Please enter a description/reason.");
      return;
    }

    const newSpecialDay = {
      date: modalData.date,
      type: modalData.type,
      description: modalData.description,
      is_observed: true
    };

    if (modalData.type === 'Extended') {
      newSpecialDay.extended_start = modalData.extended_start;
      newSpecialDay.extended_end = modalData.extended_end;
    } else if (modalData.type === 'Half-Day') {
      newSpecialDay.start_time = modalData.start_time;
      newSpecialDay.end_time = modalData.end_time;
    } else if (modalData.type === 'Special-Shift') {
      newSpecialDay.shift_id = modalData.shift_id;
    } else if (modalData.type === 'Substitute') {
      // Handle Substitute Assignment
      if (!modalData.substitute_employee_id) {
        alert("Please select a substitute employee.");
        return;
      }
      try {
        // Create NEW Assignment for Substitute
        await axios.post(`${baseUrl}/api/schedule-assignments`, {
          employee_id: modalData.substitute_employee_id,
          schedule_id: formData.schedule_id, // Assign same schedule
          assigned_date: modalData.date, // Start from this date
          is_active: true,
          notes: `Substitute for ${getEmpName(formData.employee_id)} on ${modalData.date}`
        });
        setMessage(`Substitute Assigned Successfully!`);
        fetchData();
      } catch (err) {
        setError("Failed to assign substitute: " + err.message);
      }
      setShowModal(false);
      return;
    }

    if (modalData.scope === 'master') {
      if (!selectedScheduleDetails) return;
      try {
        const ruleId = selectedScheduleDetails._id;
        const updatedSpecialDays = [...(selectedScheduleDetails.special_days || []), newSpecialDay];
        await axios.put(`${baseUrl}/api/schedule-rules/${ruleId}`, {
          ...selectedScheduleDetails,
          special_days: updatedSpecialDays
        });
        setMessage("Master Schedule Updated Successfully!");
        fetchData();
      } catch (err) {
        setError("Failed to update Master Schedule: " + err.message);
      }
    } else {
      setFormData(prev => {
        const others = prev.special_day_assignments.filter(sd => sd.date !== newSpecialDay.date);
        return {
          ...prev,
          special_day_assignments: [...others, newSpecialDay]
        };
      });
    }
    setShowModal(false);
  };

  const renderCalendar = () => {
    if (!selectedScheduleDetails) return <div style={{ padding: '20px', color: '#7f8c8d', textAlign: 'center' }}>Select a schedule to view calendar</div>;
    const { days, startOffset } = getDaysInMonth(calendarMonth);
    const monthName = calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    const grid = [];

    for (let i = 0; i < startOffset; i++) {
      grid.push(<div key={`empty-${i}`} style={{ background: '#f8f9fa' }}></div>);
    }

    for (let d = 1; d <= days; d++) {
      const status = getDayStatus(d);
      const isToday = new Date().toDateString() === new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d).toDateString();
      grid.push(
        <div
          key={d}
          title={status?.tooltip}
          onClick={() => handleDayClick(d)}
          style={{
            height: '40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: status?.color || 'white',
            color: status?.color ? 'white' : '#2c3e50',
            borderRadius: '4px',
            fontWeight: isToday ? 'bold' : 'normal',
            border: isToday ? '2px solid #34495e' : 'none',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'transform 0.1s',
            position: 'relative'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {d}
        </div>
      );
    }

    return (
      <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <button type="button" onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3498db' }}><FaChevronLeft /></button>
          <h4 style={{ margin: 0, color: '#2c3e50' }}>{monthName}</h4>
          <button type="button" onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3498db' }}><FaChevronRight /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center', marginBottom: '5px' }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => <div key={i} style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#7f8c8d' }}>{day}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
          {grid}
        </div>
        <div style={{ marginTop: '10px', display: 'flex', gap: '15px', fontSize: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#f39c12', borderRadius: '50%' }}></div> On Leave</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#e74c3c', borderRadius: '50%' }}></div> Off/Holiday</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#e67e22', borderRadius: '50%' }}></div> Extended</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#9b59b6', borderRadius: '50%' }}></div> Half-Day</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#3498db', borderRadius: '50%' }}></div> Special Shift</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#2ecc71', borderRadius: '50%' }}></div> Working</div>
        </div>
      </div>
    );
  };

  if (loading && !baseUrl) return <div style={{ padding: '50px', textAlign: 'center' }}>Initializing...</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0eaFC 0%, #cfdef3 100%)', padding: '20px' }}>
      <button onClick={() => navigate('/admin')} style={{ ...buttonStyle, position: 'fixed', top: '20px', left: '20px', zIndex: 100 }}>
        <FaArrowLeft /> Back
      </button>
      <div style={{ maxWidth: '1200px', margin: '60px auto', background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <div style={{ borderBottom: '2px solid #3498db', paddingBottom: '15px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#2c3e50', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaUserTag style={{ color: '#3498db' }} /> Assign Employee Schedule
          </h2>
          <span style={{ background: '#3498db', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9rem' }}>
            {assignments.length} Active Assignments
          </span>
        </div>

        {error && <div style={{ background: '#ffdddd', color: '#c0392b', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}
        {message && <div style={{ background: '#ddffdd', color: '#27ae60', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>{message}</div>}

        <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '12px', border: '1px solid #e9ecef', marginBottom: '30px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '4px', background: '#e0e0e0', borderRadius: '8px', display: 'flex', gap: '4px', zIndex: 10 }}>
            <button type="button" onClick={() => setUse24Hour(false)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', background: !use24Hour ? '#3498db' : 'transparent', color: !use24Hour ? '#fff' : '#7f8c8d', transition: 'all 0.2s' }}>
              12 Hour
            </button>
            <button type="button" onClick={() => setUse24Hour(true)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', background: use24Hour ? '#3498db' : 'transparent', color: use24Hour ? '#fff' : '#7f8c8d', transition: 'all 0.2s' }}>
              24 Hour
            </button>
          </div>

          <h3 style={{ marginTop: 0, color: '#34495e', borderBottom: '1px dashed #bdc3c7', paddingBottom: '10px', marginBottom: '20px' }}>
            {editingId ? 'Edit Assignment' : 'New Assignment'}
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 350px', gap: '30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', alignContent: 'start' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Select Employee</label>
                  <select required name="employee_id" value={formData.employee_id} onChange={handleInputChange} style={inputStyle}>
                    <option value="">-- Choose Employee --</option>
                    {filteredEmployees.map(e => {
                      const empId = String(e.id || e._id || '').trim();
                      return <option key={empId} value={empId}>{e.name || e.employeeName || 'Unnamed'} ({e.employeeDesignation || 'N/A'}) {e.department ? `- ${e.department}` : ''}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Select Schedule Rule</label>
                  <select required name="schedule_id" value={formData.schedule_id} onChange={handleInputChange} style={inputStyle}>
                    <option value="">-- Choose Schedule --</option>
                    {filteredSchedules.map(s => (
                      <option key={s._id} value={s._id}>{getRuleName(s._id)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Assigned Date (Start)</label>
                <input required type="date" name="assigned_date" value={formData.assigned_date} onChange={handleInputChange} style={inputStyle} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ ...labelStyle, marginBottom: 0, marginRight: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} style={{ width: '18px', height: '18px', marginRight: '8px' }} />
                  Active Assignment
                </label>
              </div>

              {displayedSpecialDays.length > 0 && (
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #dcdcdc' }}>
                  <h4 style={{ marginTop: 0, color: '#e67e22', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaGift /> Special Days & Exceptions
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#7f8c8d', fontStyle: 'italic' }}>
                    Showing special days for the selected rule. Check to apply.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginTop: '10px', maxHeight: '200px', overflowY: 'auto' }}>
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label style={labelStyle}>Notes (Optional)</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Additional details..." style={{ ...inputStyle, minHeight: '80px' }} />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button type="submit" style={{ ...buttonStyle, flex: 1, background: '#27ae60' }}>
                  <FaSave /> {editingId ? 'Update Assignment' : 'Assign Schedule'}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} style={{ ...buttonStyle, background: '#95a5a6' }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Schedule Preview</label>
              {renderCalendar()}
              <div style={{ marginTop: '20px', padding: '15px', background: '#ecf0f1', borderRadius: '8px', fontSize: '0.85rem', color: '#7f8c8d' }}>
                <p><strong>Interactive Calendar:</strong> Click on any date to add a Holiday, Extended Hour, Half-Day, or Special Shift. You can apply it to this employee only or update the master schedule.</p>
              </div>
            </div>
          </form>
        </div>

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
                  <td style={tdStyle}>{getRuleName(a.schedule_id)}</td>
                  <td style={tdStyle}>{a.assigned_date}</td>
                  <td style={tdStyle}>
                    {a.is_active ?
                      <span style={{ color: '#27ae60', fontWeight: 'bold' }}><FaCheck /> Active</span> :
                      <span style={{ color: '#e74c3c', fontWeight: 'bold' }}><FaBan /> Inactive</span>
                    }
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button onClick={() => handleEdit(a)} style={iconBtnStyle} title="Edit"><FaEdit /></button>
                    <button onClick={() => confirmDelete(a._id)} style={{ ...iconBtnStyle, color: '#e74c3c' }} title="Delete"><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Special Day Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              Add Exception for {modalData.date}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <div style={{ background: '#f0f8ff', padding: '10px', borderRadius: '8px', border: '1px solid #bddeff' }}>
                <label style={labelStyle}>Apply Changes To:</label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <input type="radio" name="scope" value="employee" checked={modalData.scope === 'employee'} onChange={(e) => setModalData({ ...modalData, scope: e.target.value })} style={{ marginRight: '5px' }} />
                    Current Employee Only
                  </label>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <input type="radio" name="scope" value="master" checked={modalData.scope === 'master'} onChange={(e) => setModalData({ ...modalData, scope: e.target.value })} style={{ marginRight: '5px' }} />
                    Master Schedule (All)
                  </label>
                </div>
              </div>

              {modalData.type === 'Substitute' && (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Original Employee</label>
                    <input type="text" readOnly value={modalData.description.replace('Substitution for ', '')} style={{ ...inputStyle, background: '#e9ecef' }} />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Department</label>
                    <input type="text" readOnly value={employees.find(e => String(e.id || e._id) === String(formData.employee_id))?.department || 'N/A'} style={{ ...inputStyle, background: '#e9ecef' }} />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Assign Substitute</label>
                    <select
                      style={inputStyle}
                      value={modalData.substitute_employee_id}
                      onChange={(e) => setModalData({ ...modalData, substitute_employee_id: e.target.value })}
                    >
                      <option value="">-- Select Substitute --</option>
                      {availableSubstitutes.map(emp => (
                        <option key={emp.id || emp._id} value={emp.id || emp._id}>
                          {emp.name || emp.employeeName}
                        </option>
                      ))}
                    </select>
                    {availableSubstitutes.length === 0 && (
                      <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '5px' }}>No available employees found in this department.</p>
                    )}
                  </div>
                </>
              )}

              {modalData.type !== 'Substitute' && (
                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={modalData.type} onChange={(e) => setModalData({ ...modalData, type: e.target.value })} style={inputStyle}>
                    <option value="Holiday">Holiday</option>
                    <option value="Extended">Extended Hours</option>
                    <option value="Half-Day">Half Day</option>
                    <option value="Special-Shift">Special Shift</option>
                  </select>
                </div>
              )}

              <div>
                <label style={labelStyle}>Description / Reason</label>
                <input type="text" value={modalData.description} onChange={(e) => setModalData({ ...modalData, description: e.target.value })} placeholder="e.g. Festival, Extra Work" style={inputStyle} />
              </div>

              {modalData.type === 'Extended' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Start {use24Hour ? '(24h)' : '(12h)'}</label>
                    <CustomTimePicker value={modalData.extended_start} onChange={(val) => setModalData({ ...modalData, extended_start: val })} format24={use24Hour} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>End {use24Hour ? '(24h)' : '(12h)'}</label>
                    <CustomTimePicker value={modalData.extended_end} onChange={(val) => setModalData({ ...modalData, extended_end: val })} format24={use24Hour} />
                  </div>
                </div>
              )}

              {modalData.type === 'Half-Day' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Start {use24Hour ? '(24h)' : '(12h)'}</label>
                    <CustomTimePicker value={modalData.start_time} onChange={(val) => setModalData({ ...modalData, start_time: val })} format24={use24Hour} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>End {use24Hour ? '(24h)' : '(12h)'}</label>
                    <CustomTimePicker value={modalData.end_time} onChange={(val) => setModalData({ ...modalData, end_time: val })} format24={use24Hour} />
                  </div>
                </div>
              )}

              {modalData.type === 'Special-Shift' && (
                <div>
                  <label style={labelStyle}>Replacement Shift</label>
                  <select value={modalData.shift_id} onChange={(e) => setModalData({ ...modalData, shift_id: e.target.value })} style={inputStyle}>
                    <option value="">-- Select Shift --</option>
                    {shifts.map(s => <option key={s._id} value={s._id}>{s.schedule_name}</option>)}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={handleModalSave} style={{ ...buttonStyle, flex: 1, background: '#27ae60' }}>Save Exception</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ ...buttonStyle, flex: 1, background: '#95a5a6' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <FaExclamationTriangle style={{ fontSize: '3rem', color: '#e74c3c', marginBottom: '20px' }} />
            <h3 style={{ color: '#2c3e50', margin: '0 0 15px 0' }}>Confirm Deletion</h3>
            <p style={{ color: '#7f8c8d', marginBottom: '25px' }}>Are you sure you want to delete this assignment? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button onClick={handleExecuteDelete} style={{ padding: '10px 25px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}>
                Yes, Delete
              </button>
              <button onClick={() => setDeleteId(null)} style={{ padding: '10px 25px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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