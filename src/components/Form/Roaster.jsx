// src/components/Form/Roaster.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaArrowLeft,
    FaCalendarAlt,
    FaUserClock,
    FaClock,
    FaBriefcase,
    FaChevronLeft,
    FaChevronRight,
    FaExclamationTriangle,
    FaUserEdit,
    FaCheck,
    FaTimes
} from 'react-icons/fa';

const Roaster = () => {
    const navigate = useNavigate();

    // -- State Management --
    const [employees, setEmployees] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [schedules, setSchedules] = useState([]); // Rules
    const [shifts, setShifts] = useState([]);
    const [leaves, setLeaves] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    const [selectedDate, setSelectedDate] = useState(new Date()); // Date selected for detailed view
    const [calendarMonth, setCalendarMonth] = useState(new Date()); // Month currently viewing in calendar

    const [baseUrl, setBaseUrl] = useState('');

    // -- Modal State --
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        date: '',
        employee_id: '',
        employee_name: '',
        schedule_id: '',
        substitute_employee_id: ''
    });
    const [availableSubstitutes, setAvailableSubstitutes] = useState([]);

    // -- 1. Initialization & Data Fetching --
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

    useEffect(() => {
        if (baseUrl !== undefined) {
            fetchAllData();
        }
    }, [baseUrl]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [empRes, assignRes, schedRes, shiftRes, leaveRes] = await Promise.all([
                axios.get(`${baseUrl}/api/add-employee`),
                axios.get(`${baseUrl}/api/schedule-assignments`),
                axios.get(`${baseUrl}/api/schedule-rules`),
                axios.get(`${baseUrl}/api/schedules`),
                axios.get(`${baseUrl}/api/leave-applications`)
            ]);

            setEmployees(Array.isArray(empRes.data) ? empRes.data : (empRes.data?.data || []));
            setAssignments(assignRes.data || []);
            setSchedules(schedRes.data || []);
            setShifts(shiftRes.data || []);
            setLeaves(leaveRes.data || []);
            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load roster data. Please check connection.");
        } finally {
            setLoading(false);
        }
    };

    // -- 2. Logic to Determine Employee Status for a Date --
    const getEmployeeStatusForDate = (employeeId, dateObj) => {
        const dateStr = dateObj.toISOString().split('T')[0];
        const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dateObj.getDay()];

        // A. Check for Approved Leave
        const onLeave = leaves.find(l =>
            String(l.employee_id) === String(employeeId) &&
            l.status === 'APPROVED' &&
            l.from_date <= dateStr &&
            l.to_date >= dateStr
        );

        if (onLeave) {
            // Check if there is a substitute assigned for this date
            // We look for any assignment on this date that has notes "Substitute for [EmployeeName]" 
            // OR ideally we check if there is an assignment linked (but we don't have linking ID).
            // We can search for assignment notes containing "Substitute for [Name]".
            // This is a bit loose but works based on our save logic.
            const empName = employees.find(e => String(e.id || e._id) === String(employeeId))?.name || '';
            const subAssignment = assignments.find(a =>
                a.is_active &&
                a.assigned_date === dateStr && // Exact date match for sub
                a.notes &&
                a.notes.includes(`Substitute for ${empName}`)
            );

            let details = onLeave.leave_name || 'On Leave';
            if (subAssignment) {
                const subEmp = employees.find(e => String(e.id || e._id) === String(subAssignment.employee_id));
                if (subEmp) {
                    details += ` (Covered by ${subEmp.name})`;
                }
            }

            return {
                status: 'Leave',
                details: details,
                color: '#e74c3c', // Red
                shiftName: 'On Leave',
                canSubstitute: !subAssignment // Disable button if already covered? Or allow override. Let's allow.
            };
        }

        // B. Find Active Assignment
        const assignment = assignments.find(a =>
            String(a.employee_id) === String(employeeId) &&
            a.is_active &&
            a.assigned_date <= dateStr
        );

        if (!assignment) {
            return {
                status: 'Unassigned',
                details: 'No Schedule',
                color: '#95a5a6', // Grey
                shiftName: 'Unassigned'
            };
        }

        // C. Get Rule Details
        const rule = schedules.find(s => String(s._id) === String(assignment.schedule_id));
        if (!rule) {
            return {
                status: 'Error',
                details: 'Invalid Rule',
                color: '#7f8c8d',
                shiftName: 'Configuration Error'
            };
        }

        // D. Check Special Days
        const specialDayOverride = (assignment.special_day_assignments || []).find(sd => sd.date === dateStr);
        const specialDayRule = (rule.special_days || []).find(sd => sd.date === dateStr);
        const specialDay = specialDayOverride || (specialDayRule && specialDayRule.is_observed ? specialDayRule : null);

        if (specialDay) {
            if (specialDay.type === 'Holiday') {
                return { status: 'Holiday', details: specialDay.description, color: '#e67e22', shiftName: 'Holiday' };
            }
        }

        // E. Check Weekly Off
        if (!rule.working_days.includes(dayName)) {
            return {
                status: 'Weekly Off',
                details: 'Weekly Off',
                color: '#f1c40f', // Yellow/Orange
                shiftName: 'Weekly Off'
            };
        }

        // F. Regular Shift
        const shift = shifts.find(s => String(s._id) === String(rule.shift_id));

        // CHECK RETURN DATA (Is this a substitution?)
        const isSubstitute = assignment.notes && assignment.notes.includes('Substitute for');

        return {
            status: 'Working',
            details: isSubstitute ? `Substitute: ${shift ? shift.schedule_name : 'Shift'}` : (shift ? shift.schedule_name : 'Regular Shift'),
            color: isSubstitute ? '#8e44ad' : '#27ae60', // Purple for substitute, Green for regular
            shiftName: shift ? shift.schedule_name : 'Regular Shift',
            shiftId: shift ? shift._id : 'default',
            timeSlots: shift ? shift.time_slots : [],
            specialDay,
            scheduleId: rule._id // Needed for substitution
        };
    };

    // -- 3. Substitution Logic --
    const getAvailableSubstitutes = (dateStr, originalEmployeeId) => {
        // Return ALL employees except the original one.
        // We will display their status in the dropdown.
        return employees.filter(e => {
            // Exclude Original Employee
            if (String(e.id || e._id) === String(originalEmployeeId)) return false;

            // Allow everyone else, including those on leave or assigned.
            return true;
        });
    };

    const handleSubstituteClick = (emp, statusInfo) => {
        if (!statusInfo.canSubstitute) return;

        const dateStr = selectedDate.toISOString().split('T')[0];

        const assignment = assignments.find(a =>
            String(a.employee_id) === String(emp._id || emp.id) &&
            a.is_active &&
            a.assigned_date <= dateStr
        );

        if (!assignment) {
            alert("Cannot assign substitute: Original employee has no base schedule.");
            return;
        }

        const subs = getAvailableSubstitutes(dateStr, emp._id || emp.id);
        setAvailableSubstitutes(subs);

        setModalData({
            date: dateStr,
            employee_id: emp._id || emp.id,
            employee_name: emp.name,
            schedule_id: assignment.schedule_id,
            substitute_employee_id: ''
        });
        setShowModal(true);
    };

    const handleModalSave = async () => {
        if (!modalData.substitute_employee_id) {
            alert("Please select a substitute employee.");
            return;
        }
        try {
            await axios.post(`${baseUrl}/api/schedule-assignments`, {
                employee_id: modalData.substitute_employee_id,
                schedule_id: modalData.schedule_id,
                assigned_date: modalData.date,
                is_active: true, // It's an active assignment
                notes: `Substitute for ${modalData.employee_name} on ${modalData.date}`
            });
            setMessage("Substitute assigned successfully!");
            fetchAllData();
            setShowModal(false);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            alert("Failed to assign substitute: " + (err.response?.data?.error || err.message));
        }
    };

    // -- 4. Render Functions --

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, startOffset: firstDay };
    };

    const handlePrevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
    const handleNextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
    const handleDateClick = (day) => setSelectedDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));

    const rosterData = useMemo(() => {
        const groups = {};
        employees.forEach(emp => {
            const statusObj = getEmployeeStatusForDate(emp._id || emp.id, selectedDate);
            const groupKey = statusObj.shiftName || 'Others';

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    name: groupKey,
                    color: statusObj.color,
                    type: statusObj.status,
                    employees: []
                };
            }
            groups[groupKey].employees.push({
                ...emp,
                statusInfo: statusObj
            });
        });
        return groups;
    }, [employees, selectedDate, leaves, assignments, schedules]);

    const renderCalendar = () => {
        const { days, startOffset } = getDaysInMonth(calendarMonth);
        const monthName = calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const cells = [];
        for (let i = 0; i < startOffset; i++) cells.push(<div key={`empty-${i}`} style={{ height: '40px' }}></div>);
        for (let d = 1; d <= days; d++) {
            const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === calendarMonth.getMonth() && selectedDate.getFullYear() === calendarMonth.getFullYear();
            cells.push(
                <div key={d} onClick={() => handleDateClick(d)} style={{
                    height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: isSelected ? '2px solid #3498db' : '1px solid #eee',
                    backgroundColor: isSelected ? '#ebf5fb' : '#fff',
                    borderRadius: '50%', width: '40px', margin: '0 auto', cursor: 'pointer',
                    fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? '#2980b9' : '#333', transition: 'all 0.2s'
                }}>{d}</div>
            );
        }
        return (
            <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <button onClick={handlePrevMonth} style={navButtonStyle}><FaChevronLeft /></button>
                    <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.2rem' }}>{monthName}</h3>
                    <button onClick={handleNextMonth} style={navButtonStyle}><FaChevronRight /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '10px', color: '#7f8c8d', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {dayHeaders.map(h => <div key={h}>{h}</div>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>{cells}</div>
            </div>
        );
    };

    const renderRosterDetails = () => {
        const dateStr = selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const groupKeys = Object.keys(rosterData).sort((a, b) => {
            const typeA = rosterData[a].type;
            const typeB = rosterData[b].type;
            if (typeA === 'Working' && typeB !== 'Working') return -1;
            if (typeA !== 'Working' && typeB === 'Working') return 1;
            return a.localeCompare(b);
        });

        return (
            <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
                <div style={{ marginBottom: '20px', borderBottom: '2px solid #3498db', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ color: '#2c3e50', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaCalendarAlt /> {dateStr}
                    </h2>
                    <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
                        Total Schedules: {employees.length}
                    </div>
                </div>

                {groupKeys.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#95a5a6' }}>
                        <FaExclamationTriangle style={{ fontSize: '2rem', marginBottom: '10px' }} />
                        <p>No roster data available for this date.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {groupKeys.map(key => {
                            const group = rosterData[key];
                            const isWorkingGroup = group.type === 'Working';

                            return (
                                <div key={key} style={{
                                    backgroundColor: 'white',
                                    borderRadius: '10px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    overflow: 'hidden',
                                    borderLeft: `5px solid ${group.color}`
                                }}>
                                    <div style={{
                                        padding: '15px 20px',
                                        backgroundColor: isWorkingGroup ? '#f8f9fa' : (group.type === 'Leave' ? '#fff5f5' : '#fffbf2'),
                                        borderBottom: '1px solid #eee',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2c3e50' }}>{group.name}</h3>
                                        <span style={{
                                            backgroundColor: group.color,
                                            color: 'white',
                                            padding: '4px 10px',
                                            borderRadius: '15px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold'
                                        }}>
                                            {group.employees.length} Staff
                                        </span>
                                    </div>

                                    <div style={{ padding: '0' }}>
                                        {group.employees.map((emp, idx) => {
                                            const canSub = emp.statusInfo.canSubstitute;
                                            return (
                                                <div key={emp._id || idx}
                                                    onClick={() => canSub && handleSubstituteClick(emp, emp.statusInfo)}
                                                    style={{
                                                        padding: '15px 20px',
                                                        borderBottom: idx === group.employees.length - 1 ? 'none' : '1px solid #f0f0f0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        transition: 'background-color 0.2s',
                                                        cursor: canSub ? 'pointer' : 'default',
                                                        backgroundColor: canSub ? '#fff' : 'transparent'
                                                    }}
                                                    onMouseOver={(e) => canSub && (e.currentTarget.style.backgroundColor = '#fdf2f2')}
                                                    onMouseOut={(e) => canSub && (e.currentTarget.style.backgroundColor = '#fff')}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '50%',
                                                            backgroundColor: canSub ? '#fadbd8' : '#e3f2fd',
                                                            color: canSub ? '#c0392b' : '#3498db',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '1.1rem',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {emp.name ? emp.name.charAt(0).toUpperCase() : <FaUserClock />}
                                                        </div>

                                                        <div>
                                                            <div style={{ fontWeight: '600', color: '#333' }}>{emp.name}</div>
                                                            <div style={{ fontSize: '0.85rem', color: '#7f8c8d', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                <FaBriefcase size={12} /> {emp.employeeDesignation || 'Staff'} {emp.department && ` • ${emp.department}`}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ textAlign: 'right' }}>
                                                        {isWorkingGroup ? (
                                                            <div style={{ color: '#27ae60', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                <FaClock />
                                                                {emp.statusInfo.timeSlots && emp.statusInfo.timeSlots.length > 0 ? (
                                                                    emp.statusInfo.timeSlots.map((t, i) => (
                                                                        <span key={i}>{t.start_time}-{t.end_time}{i < emp.statusInfo.timeSlots.length - 1 && ', '}</span>
                                                                    ))
                                                                ) : <span>Standard Shift</span>}
                                                            </div>
                                                        ) : (
                                                            <div style={{ color: group.color, fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                {emp.statusInfo.details}
                                                                {canSub && (
                                                                    <span style={{ fontSize: '0.7em', padding: '2px 6px', border: '1px solid #e74c3c', borderRadius: '4px', cursor: 'pointer' }}>
                                                                        <FaUserEdit /> Assign Sub
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f9' }}>
                <div style={{ textAlign: 'center', color: '#3498db' }}>
                    <FaCalendarAlt style={{ fontSize: '3rem', marginBottom: '15px', animation: 'bounce 1s infinite' }} />
                    <p>Loading Roaster...</p>
                </div>
                <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', overflowY: 'auto', backgroundColor: '#f4f6f9', padding: '20px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
                <button onClick={() => navigate('/admin')} style={{ border: 'none', background: 'none', color: '#7f8c8d', fontSize: '1.2rem', cursor: 'pointer', marginRight: '15px', padding: '5px' }}>
                    <FaArrowLeft />
                </button>
                <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '1.8rem' }}>Roaster App</h1>
            </div>

            {message && (
                <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                    {message}
                </div>
            )}
            {error && (
                <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #f5c6cb' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '25px', alignItems: 'start' }}>
                <div>
                    {renderCalendar()}
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#34495e' }}>Legend</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '15px', height: '15px', backgroundColor: '#27ae60', borderRadius: '3px' }}></div> <span>Working</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '15px', height: '15px', backgroundColor: '#8e44ad', borderRadius: '3px' }}></div> <span>Substitute</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '15px', height: '15px', backgroundColor: '#e74c3c', borderRadius: '3px' }}></div> <span>Leave / Absent</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '15px', height: '15px', backgroundColor: '#f1c40f', borderRadius: '3px' }}></div> <span>Weekly Off</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '15px', height: '15px', backgroundColor: '#e67e22', borderRadius: '3px' }}></div> <span>Holiday</span></div>
                        </div>
                    </div>
                </div>
                <div>{renderRosterDetails()}</div>
            </div>

            {/* Subtitute Assignment Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            Assign Substitute (Roaster)
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={labelStyle}>Original Employee (On Leave)</label>
                                <input type="text" readOnly value={modalData.employee_name} style={{ ...inputStyle, background: '#e9ecef' }} />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={labelStyle}>Date</label>
                                <input type="text" readOnly value={modalData.date} style={{ ...inputStyle, background: '#e9ecef' }} />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={labelStyle}>Select Substitute Employee</label>
                                <select
                                    style={inputStyle}
                                    value={modalData.substitute_employee_id}
                                    onChange={(e) => setModalData({ ...modalData, substitute_employee_id: e.target.value })}
                                >
                                    <option value="">-- Select Substitute --</option>
                                    {availableSubstitutes.map(emp => {
                                        // Calc status for this employee for the selected date
                                        const status = getEmployeeStatusForDate(emp.id || emp._id, new Date(modalData.date));
                                        return (
                                            <option key={emp.id || emp._id} value={emp.id || emp._id}>
                                                {emp.name || emp.employeeName} - {status.shiftName} ({emp.department || 'No Dept'})
                                            </option>
                                        );
                                    })}
                                </select>
                                {availableSubstitutes.length === 0 && (
                                    <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '5px' }}>No available employees found for substitution.</p>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={handleModalSave} style={{ ...buttonStyle, flex: 1, background: '#27ae60' }}>Save Assignment</button>
                                <button type="button" onClick={() => setShowModal(false)} style={{ ...buttonStyle, flex: 1, background: '#95a5a6' }}>Cancel</button>
                            </div>
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
const navButtonStyle = { background: '#f1f2f6', border: 'none', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#2c3e50', fontSize: '0.8rem' };

export default Roaster;
