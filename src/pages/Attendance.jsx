import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, CheckCircle2, XCircle, AlertCircle, Download, Plus, X, Trash2, Edit, Scan } from 'lucide-react';
import api from '../utils/api';
import { exportToExcel } from '../utils/exportToExcel';
import FaceCheckIn from '../components/FaceCheckIn';

const Attendance = () => {
  const [attendances, setAttendances] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  
  // Forms state
  const [attendanceForm, setAttendanceForm] = useState({
    employeeName: '', date: '', checkIn: '', checkOut: '', type: 'Office', status: 'Present'
  });
  const [leaveForm, setLeaveForm] = useState({
    employeeName: '', department: '', type: 'Sick', startDate: '', endDate: '', reason: '', status: 'Pending'
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [isHRorMD, setIsHRorMD] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFaceCheckIn, setShowFaceCheckIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo?.role === 'Admin') setIsAdmin(true);
    if (userInfo?.role === 'HR' || userInfo?.role === 'MD') setIsHRorMD(true);
    fetchData(userInfo);
  }, []);

  // Auto-fill forms with current user info when available
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) {
      setAttendanceForm(prev => ({ ...prev, employeeName: userInfo.name || '' }));
      setLeaveForm(prev => ({ ...prev, employeeName: userInfo.name || '', department: userInfo.department || '' }));
    }
  }, []);

  const fetchData = async (userInfo) => {
    try {
      const config = userInfo ? { headers: { Authorization: `Bearer ${userInfo.token}` } } : {};
      const resAttendance = await api.get('/api/attendances', config);
      const resLeave = await api.get('/api/leaverequests', config);
      // Deduplicate by id to prevent any visual duplicate rows
      const seen = new Set();
      const unique = resAttendance.data.filter(a => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
      setAttendances(unique);
      setLeaveRequests(resLeave.data);
    } catch (error) {
      console.error('Error fetching attendance data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await api.post('/api/attendances', attendanceForm, config);
      setAttendances([data, ...attendances]);
      setShowAddModal(false);
      setAttendanceForm({ employeeName: '', date: '', checkIn: '', checkOut: '', type: 'Office', status: 'Present' });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save attendance.');
    }
  };

  const handleSaveLeave = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await api.post('/api/leaverequests', leaveForm, config);
      setLeaveRequests([data, ...leaveRequests]);
      setShowLeaveModal(false);
      setLeaveForm({ employeeName: '', department: '', type: 'Sick', startDate: '', endDate: '', reason: '', status: 'Pending' });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to request leave.');
    }
  };

  const handleCheckIn = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo) return alert('Please login first');
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await api.post('/api/attendances/checkin', {}, config);
      setAttendances(prev => {
        const exists = prev.some(a => a.id === data.id);
        if (exists) return prev.map(a => a.id === data.id ? data : a);
        return [data, ...prev];
      });
      setCheckInMessage('');
      alert('✓ Checked in at ' + data.checkIn + ' (IST)');
    } catch (error) {
      const msg = error.response?.data?.message || '';
      if (msg === 'Already checked in for today') {
        setCheckInMessage('Already checked in today');
      } else {
        alert(msg || 'Failed to check in.');
      }
    }
  };

  const handleCheckOut = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo) return alert('Please login first');
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await api.post('/api/attendances/checkout', {}, config);
      setAttendances(attendances.map(a => (a.employeeName === data.employeeName && a.date === data.date) ? data : a));
      alert('✓ Checked out at ' + data.checkOut + ' (IST)');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to check out.');
    }
  };

  const handleApproveLeave = async (id, status) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await api.put(`/api/leaverequests/${id}`, { status }, config);
      setLeaveRequests(leaveRequests.map(r => r.id === id ? data : r));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update leave request.');
    }
  };

  const handleDeleteAttendance = async (id) => {
    if (!window.confirm('Delete this attendance log?')) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await api.delete(`/api/attendances/${id}`, config);
      setAttendances(attendances.filter(a => a.id !== id));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete attendance log.');
    }
  };

  const handleDeleteLeave = async (id) => {
    if (!window.confirm('Delete this leave request?')) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await api.delete(`/api/leaverequests/${id}`, config);
      setLeaveRequests(leaveRequests.filter(l => l.id !== id));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete leave request.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present': return <span className="flex items-center gap-1 text-teal-400 bg-teal-400/10 px-2 py-1 rounded text-xs border border-teal-400/20"><CheckCircle2 className="w-3 h-3"/> Present</span>;
      case 'Late': return <span className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded text-xs border border-yellow-400/20"><AlertCircle className="w-3 h-3"/> Late</span>;
      case 'Absent': return <span className="flex items-center gap-1 text-red-400 bg-red-400/10 px-2 py-1 rounded text-xs border border-red-400/20"><XCircle className="w-3 h-3"/> Absent</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Attendance Management</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">Monitor employee attendance and leave requests.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToExcel(attendances, 'Attendance_Data')} className="flex items-center px-4 py-2 bg-white/5 border border-[var(--color-border)] hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors">
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
          {/* Show check-in/out and apply leave to authenticated users; admin keeps manual log button */}
          {localStorage.getItem('userInfo') && (
            <>
              {/* Face Check-In only for non-HR/MD roles */}
              {!isHRorMD && (
                <button
                  onClick={() => setShowFaceCheckIn(true)}
                  className="flex items-center px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/25 hover:bg-purple-500/20 text-sm font-medium rounded-lg transition-colors"
                >
                  <Scan className="w-4 h-4 mr-2" /> Face Check-In
                </button>
              )}
              <button onClick={async () => { await handleCheckIn(); }} className="flex items-center px-4 py-2 bg-teal-500/10 text-teal-400 border border-teal-500/25 hover:bg-teal-500/20 text-sm font-medium rounded-lg transition-colors">
                <Plus className="w-4 h-4 mr-2" /> Check In
              </button>
              {checkInMessage && (
                <span className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-3 py-2 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4" /> {checkInMessage}
                </span>
              )}
              <button onClick={async () => { await handleCheckOut(); }} className="flex items-center px-4 py-2 bg-white/5 border border-[var(--color-border)] hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors">
                <Clock className="w-4 h-4 mr-2" /> Check Out
              </button>
              <button onClick={() => setShowLeaveModal(true)} className="flex items-center px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                <Calendar className="w-4 h-4 mr-2" /> Apply Leave
              </button>
            </>
          )}
          {(isAdmin || isHRorMD) && (
            <>
              <button onClick={() => setShowAddModal(true)} className="flex items-center px-4 py-2 bg-teal-500/10 text-teal-400 border border-teal-500/25 hover:bg-teal-500/20 text-sm font-medium rounded-lg transition-colors">
                <Plus className="w-4 h-4 mr-2" /> Log Attendance
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Logged Records', value: attendances.length, icon: <Clock className="w-5 h-5 text-blue-400" /> },
          { label: 'Present Logged', value: attendances.filter(a => a.status === 'Present').length, icon: <CheckCircle2 className="w-5 h-5 text-teal-400" /> },
          { label: 'Late Logged', value: attendances.filter(a => a.status === 'Late').length, icon: <AlertCircle className="w-5 h-5 text-yellow-400" /> },
          { label: 'Pending Leaves', value: leaveRequests.filter(l => l.status === 'Pending').length, icon: <XCircle className="w-5 h-5 text-red-400" /> },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
            </div>
            <div className="p-3 bg-[var(--color-primary-bg)] rounded-xl border border-[var(--color-border)]">
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-card-bg)]">
            <h3 className="font-bold text-white">Daily Attendance Log</h3>
          </div>
          {loading ? (
            <div className="p-6 text-center text-white">Loading log...</div>
          ) : attendances.length === 0 ? (
            <div className="p-6 text-center text-[var(--color-text-secondary)]">No attendance records logged yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-[var(--color-text-secondary)] text-xs uppercase tracking-wider border-b border-[var(--color-border)]">
                    <th className="px-6 py-4 font-medium">Employee</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Check In</th>
                    <th className="px-6 py-4 font-medium">Check Out</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    {(isAdmin || isHRorMD) && <th className="px-6 py-4 font-medium text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[var(--color-border)]">
                  {attendances.map((row) => (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 text-white font-medium">{row.employeeName}</td>
                      <td className="px-6 py-4 text-[var(--color-text-secondary)]">{row.date}</td>
                      <td className="px-6 py-4 text-white">{row.checkIn || '-'}</td>
                      <td className="px-6 py-4 text-white">{row.checkOut || '-'}</td>
                      <td className="px-6 py-4 text-[var(--color-text-secondary)]">{row.type}</td>
                      <td className="px-6 py-4">{getStatusBadge(row.status)}</td>
                      {(isAdmin || isHRorMD) && (
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDeleteAttendance(row.id)} className="p-1.5 bg-red-500/10 text-red-400 rounded-lg border border-red-500/15 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="glass-card p-6 flex flex-col max-h-[70vh]">
          <h3 className="font-bold text-white mb-4">Pending Leave Requests</h3>
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {leaveRequests.length === 0 ? (
              <div className="text-center text-[var(--color-text-secondary)] py-10 text-sm">No leave requests found.</div>
            ) : (
              leaveRequests.map((req) => (
                <div key={req.id} className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl p-4 relative group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-white text-sm">{req.employeeName}</span>
                    <span className={`text-[10px] border px-2 py-0.5 rounded uppercase font-bold ${
                      req.status === 'Approved' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : req.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>{req.status}</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-1">{req.type} Leave ({req.reason})</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-3">{req.startDate} to {req.endDate}</p>
                  
                  {req.status === 'Pending' && (isAdmin || isHRorMD) && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleApproveLeave(req.id, 'Approved')} className="flex-1 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 text-xs font-medium rounded border border-teal-500/20 transition-colors">Approve</button>
                      <button onClick={() => handleApproveLeave(req.id, 'Rejected')} className="flex-1 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded border border-red-500/20 transition-colors">Reject</button>
                    </div>
                  )}

                  {(isAdmin || isHRorMD) && (
                    <button onClick={() => handleDeleteLeave(req.id)} className="absolute right-2 bottom-2 p-1.5 text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5"/></button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Log Attendance Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-md p-6 relative">
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white"><X className="w-5 h-5"/></button>
              <h2 className="text-xl font-bold text-white mb-6">Log Employee Attendance</h2>
              <form onSubmit={handleSaveAttendance} className="space-y-4">
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)] font-medium">Employee Name *</label>
                  <input type="text" required value={attendanceForm.employeeName} onChange={e => setAttendanceForm({...attendanceForm, employeeName: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                </div>
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)] font-medium">Date *</label>
                  <input type="date" required value={attendanceForm.date} onChange={e => setAttendanceForm({...attendanceForm, date: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)] font-medium">Check In</label>
                    <input type="time" value={attendanceForm.checkIn} onChange={e => setAttendanceForm({...attendanceForm, checkIn: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)] font-medium">Check Out</label>
                    <input type="time" value={attendanceForm.checkOut} onChange={e => setAttendanceForm({...attendanceForm, checkOut: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)] font-medium">Type</label>
                    <select value={attendanceForm.type} onChange={e => setAttendanceForm({...attendanceForm, type: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]">
                      <option value="Office" className="bg-[#1E293B] text-white">Office</option>
                      <option value="Remote" className="bg-[#1E293B] text-white">Remote</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)] font-medium">Status</label>
                    <select value={attendanceForm.status} onChange={e => setAttendanceForm({...attendanceForm, status: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]">
                      <option value="Present" className="bg-[#1E293B] text-white">Present</option>
                      <option value="Late" className="bg-[#1E293B] text-white">Late</option>
                      <option value="Absent" className="bg-[#1E293B] text-white">Absent</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-[var(--color-primary-bg)] text-white font-medium rounded-lg border border-[var(--color-border)]">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium rounded-lg transition-colors">Log Data</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Apply Leave Modal */}
      <AnimatePresence>
        {showLeaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-md p-6 relative">
              <button onClick={() => setShowLeaveModal(false)} className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white"><X className="w-5 h-5"/></button>
              <h2 className="text-xl font-bold text-white mb-6">Apply Leave Request</h2>
              <form onSubmit={handleSaveLeave} className="space-y-4">
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)] font-medium">Employee Name *</label>
                  <input type="text" required value={leaveForm.employeeName} onChange={e => setLeaveForm({...leaveForm, employeeName: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                </div>
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)] font-medium">Department *</label>
                  <input type="text" required value={leaveForm.department} onChange={e => setLeaveForm({...leaveForm, department: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                </div>
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)] font-medium">Leave Type</label>
                  <select value={leaveForm.type} onChange={e => setLeaveForm({...leaveForm, type: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]">
                    <option value="Sick" className="bg-[#1E293B] text-white">Sick Leave</option>
                    <option value="Casual" className="bg-[#1E293B] text-white">Casual Leave</option>
                    <option value="Annual" className="bg-[#1E293B] text-white">Annual Leave</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)] font-medium">Start Date *</label>
                    <input type="date" required value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)] font-medium">End Date *</label>
                    <input type="date" required value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)] font-medium">Reason *</label>
                  <textarea rows="3" required value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]"></textarea>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowLeaveModal(false)} className="px-4 py-2 bg-[var(--color-primary-bg)] text-white font-medium rounded-lg border border-[var(--color-border)]">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium rounded-lg transition-colors">Submit Request</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ── Face Check-In Modal ── */}
      <AnimatePresence>
        {showFaceCheckIn && (
          <FaceCheckIn
            onClose={() => setShowFaceCheckIn(false)}
            onSuccess={(record, name) => {
              // Refresh list — fetchData already deduplicates
              const userInfo = JSON.parse(localStorage.getItem('userInfo'));
              fetchData(userInfo);
              // Small delay so DB write completes before re-fetch
              setTimeout(() => fetchData(userInfo), 1500);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default Attendance;
