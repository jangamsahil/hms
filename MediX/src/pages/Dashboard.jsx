import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, AlertCircle, Server, Edit, Trash2, X, Check, AlertTriangle, Search, ChevronLeft, ChevronRight, Loader2, CalendarX } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Dashboard = () => {
    const { user, token } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Booking Form State
    const [bookingData, setBookingData] = useState({ doctor_id: '', date: '', time: '', disease: '' });
    const [unavailableTimes, setUnavailableTimes] = useState([]);
    const [isBooking, setIsBooking] = useState(false);

    // Admin Edit State
    const [editingApptId, setEditingApptId] = useState(null);
    const [editData, setEditData] = useState({ doctor_id: '', date: '', time: '', disease: '' });

    // Toast Notification State
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); // type: 'success' | 'error'

    // Custom Modal State
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null, source: null });
    const [deleteUserModal, setDeleteUserModal] = useState({ show: false, id: null });

    // Search & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        if (token) {
            fetchAppointments();
            if (user?.role === 'Patient' || user?.role === 'Admin') {
                fetchDoctors();
            }
            if (user?.role === 'Admin') {
                fetchUsersList();
            }

            const interval = setInterval(() => {
                fetchAppointments();
                if (user?.role === 'Patient' || user?.role === 'Admin') {
                    fetchDoctors();
                }
            }, 15000);
            
            return () => clearInterval(interval);
        }
    }, [token, user]);

    // Live Availability Sync
    useEffect(() => {
        if (bookingData.doctor_id && bookingData.date) {
            const fetchAvail = async () => {
                try {
                    const res = await fetch(`http://localhost:3000/api/appointments/availability?doctor_id=${bookingData.doctor_id}&date=${bookingData.date}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (res.ok) setUnavailableTimes(data.bookedTimes || []);
                } catch (err) {}
            };
            fetchAvail();
        } else {
            setUnavailableTimes([]);
        }
    }, [bookingData.doctor_id, bookingData.date, token]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchAppointments = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/appointments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (!res.ok) {
                if (res.status === 401) {
                    showToast("Session expired. Please log in again.", "error");
                    // Assuming logout is available, but we might need to import it.
                    // If not, we can just clear local storage and reload.
                    localStorage.clear();
                    window.location.href = '/auth';
                    return;
                }
                throw new Error(data.error || 'Failed to fetch appointments');
            }
            
            let myAppts = data.appointments || [];
            if (user.role === 'Doctor') myAppts = myAppts.filter(a => a.doctor_id == user.id);
            if (user.role === 'Patient') myAppts = myAppts.filter(a => a.patient_id == user.id);

            setAppointments(myAppts);
        } catch (err) {
            showToast("Failed to connect to backend: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            console.log("Executing fetchDoctors...");
            const res = await fetch(`http://localhost:3000/api/doctors?t=${new Date().getTime()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.clear();
                    window.location.href = '/auth';
                    return;
                }
                throw new Error(data.error || 'Failed to fetch doctors');
            }
            
            console.log("Fetched doctors:", data.doctors);
            setDoctors(data.doctors || []);
        } catch (err) {
            console.error("fetchDoctors error:", err);
            showToast("Failed to fetch doctor list: " + err.message, "error");
        }
    };

    const fetchUsersList = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setUsersList(data.users || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleBook = async (e) => {
        e.preventDefault();

        const isOverlapping = unavailableTimes.some(booked => {
            const [bH, bM] = booked.split(':').map(Number);
            const [cH, cM] = bookingData.time.split(':').map(Number);
            const bookedTotalMins = bH * 60 + bM;
            const currentTotalMins = cH * 60 + cM;
            return Math.abs(bookedTotalMins - currentTotalMins) < 15;
        });

        if (isOverlapping) {
             showToast('This timeframe overlaps with a booked 15-minute slot! Try adjusting the time slightly.', 'error');
             return;
        }

        setIsBooking(true);
        const start_time = `${bookingData.date}T${bookingData.time}:00`;

        try {
            const res = await fetch('http://localhost:3000/api/appointments/book', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ doctor_id: bookingData.doctor_id, start_time, disease: bookingData.disease })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Failed to book slot');
            
            showToast('Appointment locked successfully!');
            setBookingData({ doctor_id: '', date: '', time: '', disease: '' }); 
            fetchAppointments(); 
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setIsBooking(false);
        }
    };

    const initiateDelete = (id, source) => {
        setDeleteModal({ show: true, id, source });
    };

    const confirmDelete = async () => {
        const { id, source } = deleteModal;
        setDeleteModal({ show: false, id: null, source: null });

        // OPTIMISTIC UI UPDATE: Remove immediately from screen before DB confirms
        const previousAppointments = [...appointments];
        setAppointments(prev => prev.filter(appt => appt.id !== id));

        try {
            const res = await fetch(`http://localhost:3000/api/appointments/${source}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Deletion rejected by server');
            }
            
            showToast('Appointment instantly removed from schedule!');
        } catch (err) {
            // Revert state if backend fails
            setAppointments(previousAppointments);
            showToast(err.message, "error");
        }
    };

    const confirmUserDelete = async () => {
        const { id } = deleteUserModal;
        setDeleteUserModal({ show: false, id: null });

        try {
            const res = await fetch(`http://localhost:3000/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Deletion rejected by server');
            }
            
            showToast('User and all associated data have been permanently wiped!');
            fetchUsersList();
            fetchAppointments();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const startEdit = (appt) => {
        const d = new Date(appt.start_time);
        const dateStr = d.toISOString().split('T')[0];
        const timeStr = d.toTimeString().split(' ')[0].substring(0, 5); 

        setEditingApptId(appt.id);
        setEditData({
            doctor_id: appt.doctor_id,
            date: dateStr,
            time: timeStr,
            disease: appt.disease || ''
        });
    };

    const handleUpdate = async (id, source) => {
        const start_time = `${editData.date}T${editData.time}:00`;

        try {
            const res = await fetch(`http://localhost:3000/api/appointments/${source}/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ doctor_id: editData.doctor_id, start_time, disease: editData.disease })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update');
            
            showToast('Changes saved to database successfully!');
            setEditingApptId(null);
            fetchAppointments();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const getPanelTitle = () => {
        if (user?.role === 'Admin') return 'Global System Operations';
        if (user?.role === 'Doctor') return 'Incoming Patients';
        return 'Your Schedule';
    };

    // Filter and Pagination Logic
    const filteredAppointments = useMemo(() => {
        return appointments.filter(appt => {
            const dateStr = new Date(appt.start_time).toLocaleString().toLowerCase();
            const diseaseStr = (appt.disease || '').toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            return dateStr.includes(searchLower) || diseaseStr.includes(searchLower) || appt.doctor_id?.toString().includes(searchLower) || appt.patient_id?.toString().includes(searchLower);
        });
    }, [appointments, searchTerm]);

    const paginatedAppointments = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAppointments.slice(start, start + itemsPerPage);
    }, [filteredAppointments, currentPage]);

    const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

    const getChartData = () => {
        const counts = appointments.reduce((acc, appt) => {
            const date = new Date(appt.start_time).toLocaleDateString();
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(counts).map(date => ({ date, count: counts[date] }));
    };

    return (
        <div className="container animate-fade-in" style={{ position: 'relative' }}>
            
            {/* Professional Toast Notification Overlay */}
            {toast.show && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
                    background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4',
                    borderLeft: `4px solid ${toast.type === 'error' ? '#EF4444' : '#10B981'}`,
                    padding: '1rem 1.5rem', borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    color: '#0F172A', fontWeight: '500', minWidth: '300px',
                    animation: 'fadeIn 0.3s ease-out forwards'
                }}>
                    {toast.type === 'error' ? <AlertCircle color="#EF4444" /> : <Check color="#10B981" />}
                    {toast.message}
                </div>
            )}

            {/* Custom Modal Overlay */}
            {deleteModal.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                    zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{
                        background: '#FFF', padding: '2rem', borderRadius: '12px',
                        width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#EF4444', marginBottom: '1rem' }}>
                            <AlertTriangle size={32} />
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0F172A' }}>Confirm Deletion</h2>
                        </div>
                        <p style={{ color: '#64748B', marginBottom: '2rem', lineHeight: '1.5' }}>
                            Are you absolutely sure you want to permanently delete this appointment? 
                            This action will instantly free the slot for other bookings.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => setDeleteModal({show: false, id: null, source: null})} className="btn-primary" style={{ background: '#E2E8F0', color: '#0F172A', boxShadow: 'none' }}>Cancel</button>
                            <button onClick={confirmDelete} className="btn-primary" style={{ background: '#EF4444', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)' }}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete User Modal Overlay */}
            {deleteUserModal.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                    zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{
                        background: '#FFF', padding: '2rem', borderRadius: '12px',
                        width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#EF4444', marginBottom: '1rem' }}>
                            <AlertTriangle size={32} />
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0F172A' }}>Wipe System User</h2>
                        </div>
                        <p style={{ color: '#64748B', marginBottom: '2rem', lineHeight: '1.5' }}>
                            Are you absolutely sure you want to permanently delete this user? Their login history and ALL of their appointments will be instantly removed from active systems and archives.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => setDeleteUserModal({show: false, id: null})} className="btn-primary" style={{ background: '#E2E8F0', color: '#0F172A', boxShadow: 'none' }}>Cancel</button>
                            <button onClick={confirmUserDelete} className="btn-primary" style={{ background: '#EF4444', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)' }}>Yes, Wipe User</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', color: 'var(--color-text-main)' }}>Welcome, {user?.name}</h1>
                <p style={{ color: 'var(--color-text-muted)' }}>{user?.specialty ? `${user.role} - ${user.specialty}` : `${user?.role} Dashboard`}</p>
            </div>

            {user?.role === 'Admin' && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', flex: '1 1 300px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Server size={32} color="var(--color-accent)"/>
                        <div>
                            <h3 style={{ margin: 0, color: 'var(--color-text-muted)' }}>Total Appointments</h3>
                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{appointments.length}</p>
                        </div>
                    </div>
                    {appointments.length > 0 && (
                        <div className="glass-panel" style={{ padding: '1.5rem', flex: '2 1 400px', height: '150px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={getChartData()}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                    <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
                                    <YAxis allowDecimals={false} stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
                                    <Tooltip contentStyle={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
                                    <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: ['Doctor', 'Admin'].includes(user?.role) ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                
                {/* Panel 1: Appointments List */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Calendar color="var(--color-accent)" /> 
                            <h2>{getPanelTitle()}</h2>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-primary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <Search size={18} color="var(--color-text-muted)" style={{ marginRight: '8px' }} />
                            <input 
                                type="text" 
                                placeholder="Search by date, disease..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-main)', outline: 'none', width: '100%' }}
                            />
                        </div>
                    </div>
                    {loading ? (
                        <div style={{ textAlign: 'center', margin: '4rem 0', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <Loader2 className="animate-spin" size={40} color="var(--color-accent)"/>
                            <p style={{ fontWeight: '500' }}>Syncing Secure Data...</p>
                        </div>
                    ) : filteredAppointments.length === 0 ? (
                        <div style={{ textAlign: 'center', margin: '4rem 0', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', animation: 'fadeIn 0.5s ease-out' }}>
                            <CalendarX size={56} style={{ opacity: 0.3 }} />
                            <h3 style={{ margin: 0, color: 'var(--color-text-main)', fontSize: '1.2rem' }}>No appointments yet</h3>
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>Your schedule is currently clear. Bookings will seamlessly appear here.</p>
                        </div>
                    ) : (
                        <>
                        <ul style={{ listStyle: 'none' }}>
                            {paginatedAppointments.map((appt, index) => (
                                <li key={appt.id} className={`hover-lift stagger-${(index % 6) + 1}`} style={{ padding: '1.5rem', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '12px', marginBottom: '1rem', display:'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    
                                    {/* Normal View */}
                                    {editingApptId !== appt.id ? (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '1.1rem' }}>{new Date(appt.start_time).toLocaleString()}</div>
                                                <div style={{ color: 'var(--color-text-main)', marginTop: '8px', fontWeight: '500' }}>
                                                    Reason / Disease: <span style={{ color: 'var(--color-error)' }}>{appt.disease || 'Not Specified'}</span>
                                                </div>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                                                    {user?.role === 'Admin' ? `Doctor: Dr. ${appt.doctor_name || appt.doctor_id} | Patient: ${appt.patient_name || appt.patient_id}` : ''}
                                                    {user?.role === 'Doctor' ? `Patient: ${appt.patient_name || appt.patient_id}` : ''}
                                                    {user?.role === 'Patient' ? `Doctor: Dr. ${appt.doctor_name || appt.doctor_id}` : ''}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                                                <div style={{ background: appt.source === 'main' ? 'var(--color-bg-primary)' : 'var(--color-text-muted)', color: appt.source === 'main' ? 'var(--color-success)' : '#FFF', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', border: `1px solid ${appt.source === 'main' ? 'var(--color-success)' : 'transparent'}` }}>
                                                    {appt.source === 'main' ? 'ACTIVE' : 'ARCHIVED'}
                                                </div>
                                                
                                                {/* Admin Action Buttons */}
                                                {user?.role === 'Admin' && (
                                                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                                        <button onClick={() => startEdit(appt)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-accent)' }} title="Edit"><Edit size={18}/></button>
                                                        <button onClick={() => initiateDelete(appt.id, appt.source)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }} title="Delete"><Trash2 size={18}/></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Editing View */
                                        <div style={{ background: 'var(--color-bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                            <h4 style={{ marginBottom: '1rem' }}>Editing Appointment #{appt.id}</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Doctor</label>
                                                    <select className="input-field" style={{ marginBottom: 0, padding: '0.5rem' }} value={editData.doctor_id} onChange={e => setEditData({...editData, doctor_id: e.target.value})}>
                                                        {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name} {d.specialty ? `(${d.specialty})` : ''}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Disease / Reason</label>
                                                    <input className="input-field" style={{ marginBottom: 0, padding: '0.5rem' }} value={editData.disease} onChange={e => setEditData({...editData, disease: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Date</label>
                                                    <input type="date" className="input-field" style={{ marginBottom: 0, padding: '0.5rem' }} value={editData.date} onChange={e => setEditData({...editData, date: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Time</label>
                                                    <input type="time" className="input-field" style={{ marginBottom: 0, padding: '0.5rem' }} value={editData.time} onChange={e => setEditData({...editData, time: e.target.value})} />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                                <button onClick={() => setEditingApptId(null)} className="btn-primary" style={{ background: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: 'none' }}><X size={16}/> Cancel</button>
                                                <button onClick={() => handleUpdate(appt.id, appt.source)} className="btn-primary" style={{ background: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={16}/> Save Changes</button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Page {currentPage} of {totalPages}</span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                                        disabled={currentPage === 1}
                                        style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', background: currentPage === 1 ? 'transparent' : 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: 'var(--color-text-main)' }}
                                    >
                                        <ChevronLeft size={16} /> Prev
                                    </button>
                                    <button 
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                                        disabled={currentPage === totalPages}
                                        style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', background: currentPage === totalPages ? 'transparent' : 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: 'var(--color-text-main)' }}
                                    >
                                        Next <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                        </>
                    )}
                </div>

                {/* Panel 2: Booking Engine (Hidden for Doctors and Admins) */}
                {user?.role === 'Patient' && (
                    <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                            <Clock color="var(--color-accent)" /> 
                            <h2>Book a Slot</h2>
                        </div>

                        <form onSubmit={handleBook}>
                            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-muted)' }}>Select Doctor</label>
                            <select required className="input-field" value={bookingData.doctor_id} onChange={e => setBookingData({...bookingData, doctor_id: e.target.value})}>
                                <option value="" disabled>Browse available Doctors...</option>
                                {doctors.map(doc => (
                                    <option key={doc.id} value={doc.id}>
                                        Dr. {doc.name} {doc.specialty ? `— ${doc.specialty}` : ''}
                                    </option>
                                ))}
                            </select>

                            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Disease / Reason for Visit</label>
                            <input required className="input-field" type="text" placeholder="e.g. Severe Headache" value={bookingData.disease} onChange={e => setBookingData({...bookingData, disease: e.target.value})} />
                            
                            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Date</label>
                            <input required className="input-field" type="date" value={bookingData.date} onChange={e => setBookingData({...bookingData, date: e.target.value})} />
                            
                            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Time</label>
                            <select required className="input-field" value={bookingData.time} onChange={e => setBookingData({...bookingData, time: e.target.value})}>
                                <option value="" disabled>Select a 15-Minute Slot...</option>
                                {(() => {
                                    const slots = [];
                                    for (let h = 9; h <= 21; h++) {
                                        for (let m = 0; m < 60; m += 15) {
                                            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                            const isOverlapping = unavailableTimes.some(booked => {
                                                const [bH, bM] = booked.split(':').map(Number);
                                                const bookedTotalMins = bH * 60 + bM;
                                                const currentTotalMins = h * 60 + m;
                                                return Math.abs(bookedTotalMins - currentTotalMins) < 15;
                                            });
                                            slots.push({ time: timeStr, disabled: isOverlapping });
                                        }
                                    }
                                    return slots.map((slot, idx) => (
                                        <option key={idx} value={slot.time} disabled={slot.disabled}>
                                            {slot.time} {slot.disabled ? '(Booked / Unavailable)' : ''}
                                        </option>
                                    ));
                                })()}
                            </select>
                            
                            <button type="submit" disabled={isBooking} className="btn-primary" style={{ width: '100%', marginTop: '1rem', cursor: isBooking ? 'not-allowed' : 'pointer', opacity: isBooking ? 0.7 : 1 }}>
                                {isBooking ? 'Locking Slot...' : 'Book 15-Minute Slot'}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Panel 3: System Users Management (Admins Only) */}
            {user?.role === 'Admin' && (
                <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                        <Server color="var(--color-accent)" /> 
                        <h2>System Users Management</h2>
                    </div>
                    <ul style={{ listStyle: 'none' }}>
                        {usersList.map((u, index) => (
                            <li key={u.id} className={`hover-lift stagger-${(index % 6) + 1}`} style={{ padding: '1.5rem', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '12px', marginBottom: '1rem', display:'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <div>
                                    <div style={{ color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '1.1rem' }}>{u.name}</div>
                                    <div style={{ color: 'var(--color-text-main)', marginTop: '4px', fontWeight: '500' }}>
                                        Role: <span style={{ color: u.role === 'Doctor' ? '#10B981' : '#3B82F6' }}>{u.role}</span> {u.specialty ? `- ${u.specialty}` : ''}
                                    </div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                                        Email: {u.email} | Joined: {new Date(u.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <button onClick={() => setDeleteUserModal({ show: true, id: u.id })} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--color-error)', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Trash2 size={16} color="var(--color-error)" /> Wipe User
                                </button>
                            </li>
                        ))}
                        {usersList.length === 0 && !loading && (
                            <div style={{ textAlign: 'center', margin: '2rem 0', color: 'var(--color-text-muted)' }}>
                                No non-admin users found in the system.
                            </div>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
