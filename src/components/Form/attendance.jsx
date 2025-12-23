// src/components/Form/attendance.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaSave, FaTimes, FaUser, FaCalendarAlt, FaClock, FaEdit, FaCheck, FaTimesCircle, FaStickyNote, FaEnvelope, FaIdCard } from 'react-icons/fa';

const AttendanceCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const id = searchParams.get('id');
  const paramEmployeeId = searchParams.get('employee_id');
  const paramDate = searchParams.get('date');
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [dailyRecords, setDailyRecords] = useState([]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);

  // Helper to process attendance data for form
  const processAttendanceData = (att) => {
    const data = { ...att };
    if (data.employee && data.employee._id) {
      data.employee_id = data.employee._id;
    } else if (!data.employee_id && att.employee_id) {
      data.employee_id = att.employee_id;
    }
    // Ensure numeric fields
    ['worked_minutes', 'overtime_minutes', 'late_minutes', 'early_exit_minutes'].forEach(field => {
      data[field] = Number(data[field]) || 0;
    });
    data.is_overnight = Boolean(data.is_overnight);
    return data;
  };

  const [formData, setFormData] = useState(() => {
    if (location.state?.attendance) {
      return processAttendanceData(location.state.attendance);
    }
    return {
      _id: '',
      employee_id: paramEmployeeId || '',
      attendance_date: paramDate || '',
      schedule_id: '',
      shift_id: '',
      status: 'Present',
      planned_start_time: '',
      planned_end_time: '',
      actual_check_in: '',
      actual_check_out: '',
      worked_minutes: 0,
      overtime_minutes: 0,
      late_minutes: 0,
      early_exit_minutes: 0,
      is_overnight: false,
      special_day_type: 'None',
      notes: ''
    };
  });

  // Set isEdit and autoFilled based on initial state
  useEffect(() => {
    if (location.state?.attendance) {
      // If it has an _id and is not virtual, it's an edit
      if (location.state.attendance._id && !location.state.attendance.is_virtual) {
        setIsEdit(true);
        setAutoFilled(true);
      } else {
        // Virtual record or new entry pre-filled
        setAutoFilled(true);
        if (location.state.attendance.is_virtual) {
          setFormData(prev => ({ ...prev, _id: '' })); // Ensure no ID for creation
          setIsEdit(false);
        }
      }
    }
  }, [location.state]);

  // Fetch base URL and initial data
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/network_info");
        const { config: appConfig } = response.data;
        let currentBaseUrl;
        if (appConfig.mode === "client") {
          currentBaseUrl = `http://${appConfig.server_ip}:8000`;
        } else {
          currentBaseUrl = 'http://localhost:8000';
        }
        setBaseUrl(currentBaseUrl);
        await fetchData(currentBaseUrl);
        if (id && !location.state?.attendance) {
          await fetchSingleAttendance(id, currentBaseUrl);
        } else if (!id && !location.state?.attendance && (paramEmployeeId || paramDate)) {
          // Params handled by auto-populate effect
        }
      } catch (err) {
        console.error("Failed to fetch config:", err);
        const fallbackUrl = 'http://localhost:8000';
        setBaseUrl(fallbackUrl);
        setError('Failed to load configuration. Using direct localhost:8000');
        await fetchData(fallbackUrl);
        if (id && !location.state?.attendance) {
          await fetchSingleAttendance(id, fallbackUrl);
        }
      }
    };
    fetchConfig();
  }, [id, location.state, paramEmployeeId, paramDate]);

  // Fetch employees, schedules, shifts
  const fetchData = async (currentBaseUrl) => {
    try {
      setLoading(true);
      setError(null);
      const empRes = await axios.get(`${currentBaseUrl}/api/add-employee`);
      setEmployees(empRes.data || []);
      const schedRes = await axios.get(`${currentBaseUrl}/api/schedule-rules`);
      setSchedules(schedRes.data || []);
      const shiftRes = await axios.get(`${currentBaseUrl}/api/schedules`);
      setShifts(shiftRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(`Failed to load data: ${err.response?.data?.error || err.message}`);
      setLoading(false);
    }
  };

  // Fetch single attendance for edit
  const fetchSingleAttendance = async (attendanceId, currentBaseUrl) => {
    try {
      const url = `${currentBaseUrl}/api/attendance?_id=${attendanceId}`;
      const response = await axios.get(url);
      let att = Array.isArray(response.data) ? response.data[0] : response.data;
      if (att) {
        const processed = processAttendanceData(att);
        setFormData(processed);
        setIsEdit(true);
        setAutoFilled(true);
      } else {
        setError('Attendance record not found.');
      }
    } catch (err) {
      console.error('Failed to fetch attendance for edit:', err);
      setError(`Failed to load attendance: ${err.response?.data?.error || err.message}`);
    }
  };

  // Fetch assignment for employee (no date)
  const fetchAssignment = async (employeeId) => {
    try {
      const url = `${baseUrl}/api/assignment?employee_id=${employeeId}`;
      const response = await axios.get(url);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch assignment:', err);
      setError('Failed to load schedule assignment for this employee.');
      return null;
    }
  };

  // Fetch daily schedule (with date)
  const fetchDailySchedule = async (employeeId, date) => {
    try {
      const url = `${baseUrl}/api/attendance?employee_id=${employeeId}&date=${date}`;
      const response = await axios.get(url);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch daily schedule:', err);
      setError('Failed to load daily schedule settings.');
      return null;
    }
  };

  // Helper to extract correct times from shift object
  const getShiftTimes = (shift) => {
    if (!shift) return { start: '', end: '', isOvernight: false, isSplit: false };
    if (shift.time_slots && shift.time_slots.length > 0) {
      const slots = shift.time_slots;
      const start = slots[0].start_time;
      const end = slots[slots.length - 1].end_time;
      const isOvernight = slots.some(s => s.is_overnight) || shift.is_overnight;
      return {
        start,
        end,
        isOvernight,
        isSplit: slots.length > 1,
        slots
      };
    }
    return {
      start: shift.start_time || '',
      end: shift.end_time || '',
      isOvernight: shift.is_overnight || false,
      isSplit: false
    };
  };

  // Auto-populate on employee_id or attendance_date change
  useEffect(() => {
    const { employee_id, attendance_date, _id } = formData;
    // Guard: Need employee_id
    if (!employee_id) return;
    const autoPopulate = async () => {
      let today = new Date().toISOString().split('T')[0];
      if (attendance_date) {
        // --- CASE 1: Date is selected (Create or Edit) ---
        const result = await fetchDailySchedule(employee_id, attendance_date);
        let dailyData = null;
        let existingRecs = [];
        if (Array.isArray(result)) {
          existingRecs = result;
          if (result.length > 0) dailyData = result[0];
        } else if (result && result.auto_filled) {
          dailyData = result;
        }
        setDailyRecords(existingRecs);
        // If Editing (_id exists), we just ensure DailyRecords are loaded (done above)
        // and update the selectedSlotIndex to match the current record's time.
        if (_id) {
          setAutoFilled(true);
          if (dailyData && dailyData.shift_id) {
            const shiftObj = shifts.find(s => s._id === dailyData.shift_id);
            if (shiftObj) {
              const { isSplit, slots } = getShiftTimes(shiftObj);
              if (isSplit && slots) {
                // Find the exact one by ID if possible, or fall back to time match
                const match = existingRecs.find(r => r._id === _id);
                if (match) {
                  const idx = slots.findIndex(s => s.start_time === match.planned_start_time);
                  if (idx !== -1) setSelectedSlotIndex(idx);
                }
              }
            }
          }
          return;
        }
        // If Creating (New for this date)
        if (dailyData) {
          // Check for matching existing record by ID
          const matchingRecord = existingRecs.find(r => r._id === dailyData._id);
          let isSplit = false;
          let slots = [];
          if (dailyData.shift_id) {
            const shiftObj = shifts.find(s => s._id === dailyData.shift_id);
            if (shiftObj) {
              const shiftInfo = getShiftTimes(shiftObj);
              isSplit = shiftInfo.isSplit;
              slots = shiftInfo.slots;
            }
          }
          if (matchingRecord) {
            // Record exists for this date! Load it (Switch to Edit mode)
            setFormData(processAttendanceData(matchingRecord));
            setIsEdit(true);
            setAutoFilled(true);
            if (isSplit && slots) {
              const idx = slots.findIndex(s => s.start_time === matchingRecord.planned_start_time);
              if (idx !== -1) setSelectedSlotIndex(idx);
            }
            setMessage('Loaded existing record for this date.');
            setTimeout(() => setMessage(''), 1500); // Auto clear this message
          } else {
            // New Entry (Auto-fill from dailyData)
            let notes = dailyData.notes || '';
            if (isSplit && slots) {
              const formattedSlots = slots.map(s => `${s.start_time}-${s.end_time}`).join(', ');
              if (!notes.includes('Split Shift')) {
                notes = notes ? `${notes} (Split Shift: ${formattedSlots})` : `Split Shift: ${formattedSlots}`;
              }
              // Default to first slot
              setSelectedSlotIndex(0);
              dailyData.planned_start_time = slots[0].start_time;
              dailyData.planned_end_time = slots[0].end_time;
              dailyData.is_overnight = slots[0].is_overnight;
            } else {
              setSelectedSlotIndex(null);
            }
            setAutoFilled(true);
            setFormData(prev => ({
              ...prev,
              _id: '',
              schedule_id: dailyData.schedule_id,
              shift_id: dailyData.shift_id,
              status: dailyData.status,
              special_day_type: dailyData.special_day_type,
              planned_start_time: dailyData.planned_start_time,
              planned_end_time: dailyData.planned_end_time,
              is_overnight: dailyData.is_overnight,
              actual_check_in: '',
              actual_check_out: '',
              worked_minutes: 0,
              overtime_minutes: 0,
              late_minutes: 0,
              early_exit_minutes: 0,
              notes: notes || prev.notes
            }));
            setIsEdit(false);
          }
        } else {
          // NEW: No dailyData (no record, no auto_filled), fallback to general assignment for new entry
          const assignData = await fetchAssignment(employee_id);
          if (assignData && assignData.assignment) {
            const { schedule, shift } = assignData.assignment;
            setAutoFilled(true);
            const { start, end, isOvernight, isSplit, slots } = getShiftTimes(shift);
            let initialNotes = '';
            let pStart = start;
            let pEnd = end;
            let overNight = isOvernight;
            if (isSplit && slots) {
              const formattedSlots = slots.map(s => `${s.start_time}-${s.end_time}`).join(', ');
              initialNotes = `Split Shift: ${formattedSlots}`;
              setSelectedSlotIndex(0);
              pStart = slots[0].start_time;
              pEnd = slots[0].end_time;
              overNight = slots[0].is_overnight;
            } else {
              setSelectedSlotIndex(null);
            }
            setFormData(prev => ({
              ...prev,
              _id: '',
              schedule_id: schedule._id,
              shift_id: shift._id,
              status: 'Present',
              special_day_type: 'None',
              planned_start_time: pStart,
              planned_end_time: pEnd,
              is_overnight: overNight,
              actual_check_in: '',
              actual_check_out: '',
              worked_minutes: 0,
              overtime_minutes: 0,
              late_minutes: 0,
              early_exit_minutes: 0,
              notes: initialNotes
            }));
            setIsEdit(false);
            setMessage('New entry initialized for this date.');
            setTimeout(() => setMessage(''), 1500);
          } else {
            // No assignment found, reset to basic defaults
            setFormData(prev => ({
              ...prev,
              _id: '',
              schedule_id: '',
              shift_id: '',
              status: 'Present',
              special_day_type: 'None',
              planned_start_time: '',
              planned_end_time: '',
              is_overnight: false,
              actual_check_in: '',
              actual_check_out: '',
              worked_minutes: 0,
              overtime_minutes: 0,
              late_minutes: 0,
              early_exit_minutes: 0,
              notes: ''
            }));
            setAutoFilled(true);
            setIsEdit(false);
            setSelectedSlotIndex(null);
            setMessage('New entry for this date (no schedule assigned).');
            setTimeout(() => setMessage(''), 1500);
          }
        }
      } else {
        // --- CASE 2: No Date (and No _id) - Fetch Assignment for Today ---
        // Only run if we are not editing
        if (!_id) {
          const assignData = await fetchAssignment(employee_id);
          if (assignData && assignData.assignment) {
            const { schedule, shift } = assignData.assignment;
            setAutoFilled(true);
            const { start, end, isOvernight, isSplit, slots } = getShiftTimes(shift);
            let initialNotes = '';
            let pStart = start;
            let pEnd = end;
            let overNight = isOvernight;
            if (isSplit && slots) {
              const formattedSlots = slots.map(s => `${s.start_time}-${s.end_time}`).join(', ');
              initialNotes = `Split Shift: ${formattedSlots}`;
              setSelectedSlotIndex(0);
              pStart = slots[0].start_time;
              pEnd = slots[0].end_time;
              overNight = slots[0].is_overnight;
            } else {
              setSelectedSlotIndex(null);
            }
            setFormData(prev => ({
              ...prev,
              schedule_id: schedule._id,
              shift_id: shift._id,
              status: 'Present',
              special_day_type: 'None',
              planned_start_time: pStart,
              planned_end_time: pEnd,
              is_overnight: overNight,
              attendance_date: today,
              notes: initialNotes
            }));
          }
        }
      }
    };
    autoPopulate();
  }, [formData.employee_id, formData.attendance_date, shifts]);

  // Handle manual shift change
  useEffect(() => {
    if (!autoFilled && formData.shift_id) {
      const shiftObj = shifts.find(s => s._id === formData.shift_id);
      if (shiftObj) {
        const { start, end, isOvernight, isSplit, slots } = getShiftTimes(shiftObj);
        let newNotes = formData.notes;
        if (isSplit && slots) {
          const formattedSlots = slots.map(s => `${s.start_time}-${s.end_time}`).join(', ');
          if (!newNotes.includes('Split Shift')) {
            newNotes = newNotes ? `${newNotes} (Split Shift: ${formattedSlots})` : `Split Shift: ${formattedSlots}`;
          }
        }
        setFormData(prev => ({
          ...prev,
          planned_start_time: start,
          planned_end_time: end,
          is_overnight: isOvernight,
          notes: newNotes
        }));
      }
    }
  }, [formData.shift_id, autoFilled, shifts]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const updates = { ...prev, [name]: type === 'checkbox' ? checked : value };

      // Auto-select today's date if employee is selected and date is empty
      if (name === 'employee_id' && value && !prev.attendance_date) {
        updates.attendance_date = new Date().toISOString().split('T')[0];
      }

      return updates;
    });
    setError(null);
    setMessage('');
  };

  // Auto-calculate minutes on check_in/out change
  useEffect(() => {
    const { actual_check_in, actual_check_out, planned_start_time, planned_end_time, status, is_overnight } = formData;
    if (actual_check_in && actual_check_out && planned_start_time && planned_end_time && status === 'Present') {
      const parseTimeToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
      let inMins = parseTimeToMinutes(actual_check_in);
      let outMins = parseTimeToMinutes(actual_check_out);
      let planStartMins = parseTimeToMinutes(planned_start_time);
      let planEndMins = parseTimeToMinutes(planned_end_time);
      let adjustedOut = outMins;
      if (is_overnight && outMins < inMins) {
        adjustedOut += 1440;
      }
      const worked = Math.max(0, adjustedOut - inMins);
      const late = Math.max(0, inMins - planStartMins);
      let planDuration = planEndMins - planStartMins;
      if (is_overnight && planEndMins < planStartMins) {
        planDuration = planEndMins + 1440 - planStartMins;
      }
      const overtime = Math.max(0, worked - planDuration);
      let adjustedPlanEnd = planEndMins;
      if (is_overnight && planEndMins < planStartMins) {
        adjustedPlanEnd += 1440;
      }
      const early = Math.max(0, adjustedPlanEnd - adjustedOut);
      setFormData(prev => ({
        ...prev,
        worked_minutes: worked,
        late_minutes: late,
        early_exit_minutes: early,
        overtime_minutes: overtime
      }));
    } else if (status !== 'Present') {
      setFormData(prev => ({
        ...prev,
        worked_minutes: 0,
        overtime_minutes: 0,
        late_minutes: 0,
        early_exit_minutes: 0
      }));
    }
  }, [formData.actual_check_in, formData.actual_check_out, formData.planned_start_time, formData.planned_end_time, formData.status, formData.is_overnight]);

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.attendance_date) {
      setError('Employee and date are required');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setMessage('');
    try {
      const url = `${baseUrl}/api/attendance`;
      let response;
      if (isEdit && formData._id) {
        response = await axios.put(url, formData);
        setMessage(response.data.message || 'Attendance record updated successfully!');
        // Delay navigation to show message
        setTimeout(() => {
          navigate('/attendance-view');
        }, 2000);
      } else {
        response = await axios.post(url, formData);
        setMessage(response.data.message || 'Attendance record created successfully!');
        setFormData({
          _id: '',
          employee_id: '',
          attendance_date: '',
          schedule_id: '',
          shift_id: '',
          status: 'Present',
          planned_start_time: '',
          planned_end_time: '',
          actual_check_in: '',
          actual_check_out: '',
          worked_minutes: 0,
          overtime_minutes: 0,
          late_minutes: 0,
          early_exit_minutes: 0,
          is_overnight: false,
          special_day_type: 'None',
          notes: ''
        });
        setAutoFilled(false);
        setIsEdit(false);
        // Auto clear message after delay to allow next entry
        setTimeout(() => {
          setMessage('');
        }, 2000);
      }
    } catch (err) {
      setError(`Failed to ${isEdit ? 'update' : 'create'} attendance: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Slot Selection
  const handleSlotClick = (slot, index) => {
    setSelectedSlotIndex(index);
    // Use simple time matching within the already-filtered dailyRecords
    const existing = dailyRecords.find(r => r.planned_start_time === slot.start_time);
    if (existing) {
      setFormData(processAttendanceData(existing));
      setIsEdit(true);
      setAutoFilled(true);
      setMessage('Loaded existing record for this slot.');
      setTimeout(() => setMessage(''), 1500);
    } else {
      setFormData(prev => ({
        ...prev,
        _id: '',
        planned_start_time: slot.start_time,
        planned_end_time: slot.end_time,
        is_overnight: slot.is_overnight,
        status: 'Present',
        actual_check_in: '',
        actual_check_out: '',
        worked_minutes: 0,
        overtime_minutes: 0,
        late_minutes: 0,
        early_exit_minutes: 0
      }));
      setIsEdit(false);
      setMessage('Switched to new slot. Enter details.');
      setTimeout(() => setMessage(''), 1500);
    }
  };

  const renderSplitSlots = () => {
    if (!formData.shift_id) return null;
    const shiftObj = shifts.find(s => s._id === formData.shift_id);
    if (!shiftObj) return null;
    const { isSplit, slots } = getShiftTimes(shiftObj);
    if (!isSplit || !slots) return null;
    return (
      <div style={{ marginTop: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
        <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'block' }}>
          <FaClock style={{ marginRight: '5px' }} /> Select Split Shift Slot:
        </label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {slots.map((slot, idx) => {
            const isSelected = selectedSlotIndex === idx;
            const existing = dailyRecords.find(r => r.planned_start_time === slot.start_time);
            const statusTitle = existing ? existing.status : 'Not Filled';
            const statusColor = existing ? '#27ae60' : '#95a5a6';
            return (
              <div
                key={idx}
                onClick={() => handleSlotClick(slot, idx)}
                style={{
                  padding: '10px 15px',
                  borderRadius: '20px',
                  border: `2px solid ${isSelected ? '#3498db' : '#bdc3c7'}`,
                  background: isSelected ? '#3498db' : 'white',
                  color: isSelected ? 'white' : '#2c3e50',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {slot.start_time} - {slot.end_time}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(255,255,255,0.2)' : (existing ? statusColor : '#bdc3c7'),
                  color: 'white'
                }}>
                  {statusTitle}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)' }}>
        <div style={{ textAlign: 'center', color: '#3498db' }}>
          <FaClock style={{ fontSize: '48px', marginBottom: '20px' }} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)', padding: '20px', position: 'relative' }}>
      <button onClick={() => navigate('/attendance-view')} style={{ position: 'fixed', top: '20px', left: '20px', backgroundColor: 'transparent', border: '2px solid #3498db', color: '#3498db', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '50px', fontSize: '16px', fontWeight: '600', boxShadow: '0 2px 10px rgba(52, 152, 219, 0.2)', zIndex: 1001, transition: 'all 0.3s ease' }} onMouseOver={(e) => { e.target.style.backgroundColor = '#3498db'; e.target.style.color = '#ffffff'; e.target.style.transform = 'scale(1.05)'; }} onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#3498db'; e.target.style.transform = 'scale(1)'; }}>
        <FaArrowLeft /> Back to View
      </button>
      <div style={{ maxWidth: '1200px', margin: '80px auto 20px', backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #3498db' }}>
          <h2 style={{ textAlign: 'center', color: '#2c3e50', margin: 0, fontSize: '1.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaClock style={{ color: '#3498db', fontSize: '2rem' }} />
            {isEdit ? 'Edit' : 'Create'} Attendance Record
          </h2>
        </div>
        {error && <div style={{ background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)', color: '#c0392b', padding: '15px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center', border: '1px solid #e74c3c', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><FaTimesCircle /> {error}</div>}
        {message && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}>
            <div style={{
              background: 'white',
              padding: '30px 40px',
              borderRadius: '15px',
              boxShadow: '0 5px 30px rgba(0,0,0,0.2)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '15px',
              minWidth: '300px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#2ecc71',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                color: 'white',
                marginBottom: '10px'
              }}>
                <FaCheck />
              </div>
              <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
                {message}
              </h3>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '20px', border: '1px solid #ecf0f1' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#3498db', borderBottom: '1px solid #eee', paddingBottom: '5px' }}><FaUser style={{ marginRight: '5px' }} /> Employee Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '8px', display: 'block' }}><FaIdCard style={{ marginRight: '5px', color: '#7f8c8d' }} /> Employee ID</label>
                <select name="employee_id" value={formData.employee_id} onChange={handleChange} required style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}>
                  <option value="">Select ID</option>
                  {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.employeeId || 'ID' + emp._id.slice(-4)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '8px', display: 'block' }}><FaUser style={{ marginRight: '5px', color: '#7f8c8d' }} /> Employee Name</label>
                <select name="employee_id" value={formData.employee_id} onChange={handleChange} required style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}>
                  <option value="">Select Name</option>
                  {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '8px', display: 'block' }}><FaEnvelope style={{ marginRight: '5px', color: '#7f8c8d' }} /> Employee Email</label>
                <select name="employee_id" value={formData.employee_id} onChange={handleChange} required style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}>
                  <option value="">Select Email</option>
                  {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.email}</option>)}
                </select>
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginTop: '10px', fontStyle: 'italic' }}>* Selecting any field above will automatically sync the others.</div>
          </div>
          {formData.employee_id && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><FaCalendarAlt /> Attendance Date</label>
                  <input type="date" name="attendance_date" value={formData.attendance_date} onChange={handleChange} required style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }} />
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><FaCalendarAlt style={{ marginRight: '5px' }} /> Schedule (Auto)</label>
                  <select name="schedule_id" value={formData.schedule_id} onChange={handleChange} required disabled={autoFilled} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: autoFilled ? '#ecf0f1' : 'white' }}>
                    <option value="">Auto-Selected</option>
                    {schedules.map(s => <option key={s._id} value={s._id}>{s.schedule_name || s.name}</option>)}
                  </select>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><FaCheck style={{ marginRight: '5px' }} /> Status (Auto)</label>
                  <select name="status" value={formData.status} onChange={handleChange} required disabled={autoFilled} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: autoFilled ? '#ecf0f1' : 'white' }}>
                    <option value="Present">Present</option>
                    {['Absent', 'Leave', 'Holiday', 'WeeklyOff', 'HalfDay', 'Extended', 'On Leave', 'Paid Leave'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><FaClock style={{ marginRight: '5px' }} /> Planned Start Time (Auto)</label>
                  <input type="time" name="planned_start_time" value={formData.planned_start_time} onChange={handleChange} readOnly={autoFilled} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: autoFilled ? '#ecf0f1' : 'white' }} />
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><FaEdit /> Actual Check In</label>
                  <input type="time" name="actual_check_in" value={formData.actual_check_in} onChange={handleChange} disabled={['WeeklyOff', 'Holiday', 'Absent', 'Leave', 'On Leave', 'Paid Leave'].includes(formData.status)} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: ['WeeklyOff', 'Holiday', 'Absent', 'Leave', 'On Leave', 'Paid Leave'].includes(formData.status) ? '#ecf0f1' : 'white' }} />
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px' }}>Worked Minutes (Auto)</label>
                  <input type="number" name="worked_minutes" value={formData.worked_minutes} readOnly style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: '#ecf0f1' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><FaClock style={{ marginRight: '5px' }} /> Shift (Auto)</label>
                  <select name="shift_id" value={formData.shift_id} onChange={handleChange} required disabled={autoFilled} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: autoFilled ? '#ecf0f1' : 'white' }}>
                    <option value="">Auto-Selected</option>
                    {shifts.map(s => {
                      let timeDisplay = '';
                      if (s.time_slots && s.time_slots.length > 0) {
                        timeDisplay = s.time_slots.map(ts => `${ts.start_time}-${ts.end_time}`).join(', ');
                      } else {
                        timeDisplay = `${s.start_time || ''} - ${s.end_time || ''}`;
                      }
                      return <option key={s._id} value={s._id}>{s.schedule_name || s.name} ({timeDisplay})</option>
                    })}
                  </select>
                  {renderSplitSlots()}
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><FaCalendarAlt style={{ marginRight: '5px' }} /> Special Day Type (Auto)</label>
                  <select name="special_day_type" value={formData.special_day_type} onChange={handleChange} required disabled={autoFilled} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: autoFilled ? '#ecf0f1' : 'white' }}>
                    <option value="None">None</option>
                    {['Holiday', 'Extended', 'HalfDay', 'WeeklyOff'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><FaClock style={{ marginRight: '5px' }} /> Planned End Time (Auto)</label>
                  <input type="time" name="planned_end_time" value={formData.planned_end_time} onChange={handleChange} readOnly={autoFilled} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: autoFilled ? '#ecf0f1' : 'white' }} />
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><FaEdit /> Actual Check Out</label>
                  <input type="time" name="actual_check_out" value={formData.actual_check_out} onChange={handleChange} disabled={['WeeklyOff', 'Holiday', 'Absent', 'Leave', 'On Leave'].includes(formData.status)} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: ['WeeklyOff', 'Holiday', 'Absent', 'Leave', 'On Leave'].includes(formData.status) ? '#ecf0f1' : 'white' }} />
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px' }}>Overtime Minutes (Auto)</label>
                  <input type="number" name="overtime_minutes" value={formData.overtime_minutes} readOnly style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: '#ecf0f1' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block', fontSize: '0.9rem' }}>Late Mins</label>
                    <input type="number" name="late_minutes" value={formData.late_minutes} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: '#ecf0f1' }} />
                  </div>
                  <div style={{ background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block', fontSize: '0.9rem' }}>Early Exit</label>
                    <input type="number" name="early_exit_minutes" value={formData.early_exit_minutes} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: '#ecf0f1' }} />
                  </div>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="checkbox" name="is_overnight" checked={formData.is_overnight} onChange={handleChange} disabled={autoFilled} />
                    Is Overnight (Auto)
                  </label>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><FaStickyNote style={{ marginRight: '5px' }} /> Notes (Auto)</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} readOnly={autoFilled} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: autoFilled ? '#ecf0f1' : 'white' }} />
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '15px', justifyContent: 'center', paddingTop: '20px', borderTop: '1px solid #bdc3c7', marginTop: '20px' }}>
                <button type="submit" disabled={isSubmitting} style={{ background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)', transition: 'all 0.3s ease', fontSize: '1rem' }}>
                  <FaSave /> {isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Record' : 'Create Record')}
                </button>
                <button type="button" onClick={() => navigate('/attendance-view')} style={{ background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', boxShadow: '0 4px 8px rgba(149, 165, 166, 0.3)', transition: 'all 0.3s ease', fontSize: '1rem' }}>
                  <FaTimes /> Cancel
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AttendanceCreate;