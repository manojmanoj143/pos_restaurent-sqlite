import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaSave, FaTimes, FaUser, FaCalendarAlt, FaClock, FaEdit, FaCheck, FaTimesCircle, FaStickyNote, FaEnvelope, FaIdCard } from 'react-icons/fa';

const AttendanceCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false); // Track if auto-filled to disable fields
  const [formData, setFormData] = useState({
    _id: '', // Added for edit
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
        // If edit mode, fetch single after data loaded
        if (id) {
          await fetchSingleAttendance(id, currentBaseUrl);
        }
      } catch (err) {
        console.error("Failed to fetch config:", err);
        const fallbackUrl = 'http://localhost:8000';
        setBaseUrl(fallbackUrl);
        setError('Failed to load configuration. Using direct localhost:8000');
        await fetchData(fallbackUrl);
        if (id) {
          await fetchSingleAttendance(id, fallbackUrl);
        }
      }
    };
    fetchConfig();
  }, [id]);

  // Fetch employees, schedules, shifts
  const fetchData = async (currentBaseUrl) => {
    try {
      setLoading(true);
      setError(null);
      // Fetch employees from /api/add-employee (GET)
      const empUrl = `${currentBaseUrl}/api/add-employee`;
      const empRes = await axios.get(empUrl);
      setEmployees(empRes.data || []);
      // Fetch schedules from /api/schedule-rules
      const schedUrl = `${currentBaseUrl}/api/schedule-rules`;
      const schedRes = await axios.get(schedUrl);
      setSchedules(schedRes.data || []);
      // Fetch shifts from /api/schedules
      const shiftUrl = `${currentBaseUrl}/api/schedules`;
      const shiftRes = await axios.get(shiftUrl);
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
        // Process data: Extract employee_id, delete employee object, ensure numbers
        const processedData = { ...att };
        if (processedData.employee && processedData.employee._id) {
          processedData.employee_id = processedData.employee._id;
          delete processedData.employee;
        } else if (!processedData.employee_id) {
          processedData.employee_id = att.employee_id; // Fallback
        }
        // Ensure numeric fields
        ['worked_minutes', 'overtime_minutes', 'late_minutes', 'early_exit_minutes'].forEach(field => {
          processedData[field] = Number(processedData[field]) || 0;
        });
        processedData.is_overnight = Boolean(processedData.is_overnight);
        setFormData(processedData);
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
      const url = `${baseUrl}/api/attendance?employee_id=${employeeId}`;
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

  // Auto-populate on employee_id or attendance_date change
  useEffect(() => {
    const { employee_id, attendance_date, _id } = formData;
    if (!employee_id || _id) { // Skip if no employee or editing
      if (_id) setAutoFilled(true); // Ensure disabled in edit
      return;
    }
    const autoPopulate = async () => {
      let today = new Date().toISOString().split('T')[0];
      if (attendance_date) {
        // Fetch daily (with date)
        const dailyData = await fetchDailySchedule(employee_id, attendance_date);
        if (dailyData && dailyData.auto_filled) {
          setAutoFilled(true);
          setFormData(prev => ({
            ...prev,
            schedule_id: dailyData.schedule_id,
            shift_id: dailyData.shift_id,
            status: dailyData.status,
            special_day_type: dailyData.special_day_type,
            planned_start_time: dailyData.planned_start_time,
            planned_end_time: dailyData.planned_end_time,
            is_overnight: dailyData.is_overnight,
            notes: dailyData.notes || prev.notes
          }));
          // Reset times/worked if off/holiday
          if (['WeeklyOff', 'Holiday', 'Absent', 'Leave'].includes(dailyData.status)) {
            setFormData(prev => ({
              ...prev,
              actual_check_in: '',
              actual_check_out: '',
              worked_minutes: 0,
              overtime_minutes: 0,
              late_minutes: 0,
              early_exit_minutes: 0
            }));
          }
        }
      } else {
        // No date: Fetch assignment, set today, populate
        const assignData = await fetchAssignment(employee_id);
        if (assignData && assignData.assignment) {
          const { schedule, shift } = assignData;
          setAutoFilled(true);
          setFormData(prev => ({
            ...prev,
            schedule_id: schedule._id,
            shift_id: shift._id,
            status: 'Present',
            special_day_type: 'None',
            planned_start_time: shift.start_time,
            planned_end_time: shift.end_time,
            is_overnight: shift.is_overnight || false,
            attendance_date: today // Auto-set today
          }));
        }
      }
    };
    autoPopulate();
  }, [formData.employee_id, formData.attendance_date]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
      // Adjust out for overnight
      let adjustedOut = outMins;
      if (is_overnight && outMins < inMins) {
        adjustedOut += 1440;
      }
      const worked = Math.max(0, adjustedOut - inMins);
      const late = Math.max(0, inMins - planStartMins);
      // Planned duration
      let planDuration = planEndMins - planStartMins;
      if (is_overnight && planEndMins < planStartMins) {
        planDuration = planEndMins + 1440 - planStartMins;
      }
      const overtime = Math.max(0, worked - planDuration);
      // Early: adjust plan_end
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
        navigate('/attendance-view');
      } else {
        response = await axios.post(url, formData);
        setMessage(response.data.message || 'Attendance record created successfully!');
        // Reset form
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
      }
    } catch (err) {
      setError(`Failed to ${isEdit ? 'update' : 'create'} attendance: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)'
      }}>
        <div style={{ textAlign: 'center', color: '#3498db' }}>
          <FaClock style={{ fontSize: '48px', marginBottom: '20px' }} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Fixed Back Button */}
      <button
        onClick={() => navigate('/attendance-view')}
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
      >
        <FaArrowLeft /> Back to View
      </button>

      {/* Main Container */}
      <div style={{
        maxWidth: '1200px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #3498db'
        }}>
          <h2 style={{
            textAlign: 'center',
            color: '#2c3e50',
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FaClock style={{ color: '#3498db', fontSize: '2rem' }} />
            {isEdit ? 'Edit' : 'Create'} Attendance Record
          </h2>
        </div>

        {/* Notifications */}
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            color: '#c0392b',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            border: '1px solid #e74c3c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <FaTimesCircle /> {error}
          </div>
        )}
        {message && (
          <div style={{
            background: 'linear-gradient(135deg, #d4edda 0%, #c8e6c9 100%)',
            color: '#155724',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            border: '1px solid #28a745',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <FaCheck /> {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Employee Selection Row - 3 Separate Fields */}
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '10px', 
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            marginBottom: '20px',
            border: '1px solid #ecf0f1'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#3498db', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
              <FaUser style={{ marginRight: '5px' }}/> Employee Details
            </h4>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
              gap: '20px'
            }}>
              {/* Field 1: Employee ID */}
              <div>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '8px', display: 'block' }}>
                  <FaIdCard style={{ marginRight: '5px', color: '#7f8c8d' }}/> Employee ID
                </label>
                <select 
                  name="employee_id" 
                  value={formData.employee_id} 
                  onChange={handleChange} 
                  required 
                  style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
                >
                  <option value="">Select ID</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.employeeId || 'ID' + emp._id.slice(-4)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 2: Employee Name */}
              <div>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '8px', display: 'block' }}>
                  <FaUser style={{ marginRight: '5px', color: '#7f8c8d' }}/> Employee Name
                </label>
                <select 
                  name="employee_id" 
                  value={formData.employee_id} 
                  onChange={handleChange} 
                  required 
                  style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
                >
                  <option value="">Select Name</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 3: Employee Email */}
              <div>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '8px', display: 'block' }}>
                  <FaEnvelope style={{ marginRight: '5px', color: '#7f8c8d' }}/> Employee Email
                </label>
                <select 
                  name="employee_id" 
                  value={formData.employee_id} 
                  onChange={handleChange} 
                  required 
                  style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
                >
                  <option value="">Select Email</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginTop: '10px', fontStyle: 'italic' }}>
              * Selecting any field above will automatically sync the others.
            </div>
          </div>

          {/* Main Form Grid - Left and Right Columns */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px',
            alignItems: 'start' 
          }}>
            {/* Left Column */}
            <div style={{ display: 'grid', gap: '20px' }}>
              
              {/* Attendance Date */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaCalendarAlt /> Attendance Date
                </label>
                <input type="date" name="attendance_date" value={formData.attendance_date} onChange={handleChange} required style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }} />
              </div>

              {/* Schedule ID */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaCalendarAlt style={{ marginRight: '5px' }} /> Schedule (Auto)
                </label>
                <select name="schedule_id" value={formData.schedule_id} onChange={handleChange} required disabled={autoFilled} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: autoFilled ? '#ecf0f1' : 'white' }}>
                  <option value="">Auto-Selected</option>
                  {schedules.map(s => <option key={s._id} value={s._id}>{s.schedule_name || s.name}</option>)}
                </select>
              </div>

              {/* Status */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaCheck style={{ marginRight: '5px' }} /> Status (Auto)
                </label>
                <select name="status" value={formData.status} onChange={handleChange} required disabled={autoFilled} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: autoFilled ? '#ecf0f1' : 'white' }}>
                  <option value="Present">Present</option>
                  {['Absent', 'Leave', 'Holiday', 'WeeklyOff', 'HalfDay', 'Extended'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Planned Start Time */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaClock style={{ marginRight: '5px' }} /> Planned Start Time (Auto)
                </label>
                <input type="time" name="planned_start_time" value={formData.planned_start_time} onChange={handleChange} readOnly={autoFilled} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: autoFilled ? '#ecf0f1' : 'white' }} />
              </div>

              {/* Actual Check In */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><FaEdit /> Actual Check In</label>
                <input type="time" name="actual_check_in" value={formData.actual_check_in} onChange={handleChange} disabled={['WeeklyOff', 'Holiday', 'Absent', 'Leave'].includes(formData.status)} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: ['WeeklyOff', 'Holiday', 'Absent', 'Leave'].includes(formData.status) ? '#ecf0f1' : 'white' }} />
              </div>

              {/* Worked Minutes */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px' }}>Worked Minutes (Auto)</label>
                <input type="number" name="worked_minutes" value={formData.worked_minutes} readOnly style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: '#ecf0f1' }} />
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Shift ID */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaClock style={{ marginRight: '5px' }} /> Shift (Auto)
                </label>
                <select name="shift_id" value={formData.shift_id} onChange={handleChange} required disabled={autoFilled} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: autoFilled ? '#ecf0f1' : 'white' }}>
                  <option value="">Auto-Selected</option>
                  {shifts.map(s => <option key={s._id} value={s._id}>{s.schedule_name || s.name} ({s.start_time} - {s.end_time})</option>)}
                </select>
              </div>

              {/* Special Day Type */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaCalendarAlt style={{ marginRight: '5px' }} /> Special Day Type (Auto)
                </label>
                <select name="special_day_type" value={formData.special_day_type} onChange={handleChange} required disabled={autoFilled} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: autoFilled ? '#ecf0f1' : 'white' }}>
                  <option value="None">None</option>
                  {['Holiday', 'Extended', 'HalfDay', 'WeeklyOff'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Planned End Time */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaClock style={{ marginRight: '5px' }} /> Planned End Time (Auto)
                </label>
                <input type="time" name="planned_end_time" value={formData.planned_end_time} onChange={handleChange} readOnly={autoFilled} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: autoFilled ? '#ecf0f1' : 'white' }} />
              </div>

              {/* Actual Check Out */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><FaEdit /> Actual Check Out</label>
                <input type="time" name="actual_check_out" value={formData.actual_check_out} onChange={handleChange} disabled={['WeeklyOff', 'Holiday', 'Absent', 'Leave'].includes(formData.status)} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: ['WeeklyOff', 'Holiday', 'Absent', 'Leave'].includes(formData.status) ? '#ecf0f1' : 'white' }} />
              </div>

              {/* Overtime Minutes */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px' }}>Overtime Minutes (Auto)</label>
                <input type="number" name="overtime_minutes" value={formData.overtime_minutes} readOnly style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: '#ecf0f1' }} />
              </div>

              {/* Late/Early/Overnight/Notes Container */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                 {/* Late Minutes */}
                <div style={{ background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block', fontSize: '0.9rem' }}>Late Mins</label>
                  <input type="number" name="late_minutes" value={formData.late_minutes} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: '#ecf0f1' }} />
                </div>
                 {/* Early Exit */}
                <div style={{ background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px', display: 'block', fontSize: '0.9rem' }}>Early Exit</label>
                  <input type="number" name="early_exit_minutes" value={formData.early_exit_minutes} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: '#ecf0f1' }} />
                </div>
              </div>

               {/* Is Overnight */}
              <div style={{ background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" name="is_overnight" checked={formData.is_overnight} onChange={handleChange} disabled={autoFilled} />
                  Is Overnight (Auto)
                </label>
              </div>

              {/* Notes */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaStickyNote style={{ marginRight: '5px' }} /> Notes (Auto)
                </label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} readOnly={autoFilled} style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '5px', backgroundColor: autoFilled ? '#ecf0f1' : 'white' }} />
              </div>
            </div>

            {/* Submit Buttons */}
            <div style={{ 
              gridColumn: '1 / -1', 
              display: 'flex', 
              gap: '15px', 
              justifyContent: 'center',
              paddingTop: '20px',
              borderTop: '1px solid #bdc3c7',
              marginTop: '20px'
            }}>
              <button type="submit" disabled={isSubmitting} style={{ background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)', transition: 'all 0.3s ease', fontSize: '1rem' }}>
                <FaSave />
                {isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Record' : 'Create Record')}
              </button>
              <button type="button" onClick={() => navigate('/attendance-view')} style={{ background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', boxShadow: '0 4px 8px rgba(149, 165, 166, 0.3)', transition: 'all 0.3s ease', fontSize: '1rem' }}>
                <FaTimes />
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceCreate;