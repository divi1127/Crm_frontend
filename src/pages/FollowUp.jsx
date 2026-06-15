import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, PhoneCall, Video, Mail, Clock, Plus, Edit, Trash2, X, Download } from 'lucide-react';
import axios from 'axios';
import { exportToExcel } from '../utils/exportToExcel';

const FollowUp = () => {
  const [followUps, setFollowUps] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    leadName: '',
    type: 'Call',
    date: '',
    time: '',
    notes: '',
    status: 'Scheduled'
  });
  // canWrite = Admin or Marketing can add/edit/delete follow-ups
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(true);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) {
      const role = userInfo.role;
      if (role === 'Admin' || role === 'Marketing') {
        setCanWrite(true);
      }
    }
    fetchFollowUps(userInfo);
  }, []);

  const fetchFollowUps = async (userInfo) => {
    try {
      const config = userInfo ? { headers: { Authorization: `Bearer ${userInfo.token}` } } : {};
      const { data } = await axios.get('/api/followups', config);
      setFollowUps(data);
    } catch (error) {
      console.error('Error fetching follow-ups', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFollowUp = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      if (isEdit) {
        const { data } = await axios.put(`/api/followups/${editId}`, formData, config);
        setFollowUps(followUps.map(f => f.id === editId ? data : f));
      } else {
        const { data } = await axios.post('/api/followups', formData, config);
        setFollowUps([...followUps, data]);
      }

      setShowModal(false);
      setFormData({ leadName: '', type: 'Call', date: '', time: '', notes: '', status: 'Scheduled' });
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving follow-up.');
    }
  };

  const handleEditClick = (followUp) => {
    setIsEdit(true);
    setEditId(followUp.id);
    setFormData({
      leadName: followUp.leadName || '',
      type: followUp.type || 'Call',
      date: followUp.date || '',
      time: followUp.time || '',
      notes: followUp.notes || '',
      status: followUp.status || 'Scheduled'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this follow-up schedule?')) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.delete(`/api/followups/${id}`, config);
      setFollowUps(followUps.filter(f => f.id !== id));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete follow-up.');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Call': return <PhoneCall className="w-4 h-4 text-teal-400" />;
      case 'Meeting': return <Video className="w-4 h-4 text-purple-400" />;
      case 'Email': return <Mail className="w-4 h-4 text-blue-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // Simple custom Calendar grid calculations
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const days = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Follow-Up Timeline</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">
            {canWrite ? 'Track and manage your scheduled client interactions.' : 'View all scheduled client interactions.'}
          </p>
          {!canWrite && (
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Read-only access</span>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToExcel(followUps, 'FollowUps_Data')} className="flex items-center px-4 py-2 bg-white/5 hover:bg-white/10 border border-[var(--color-border)] text-white text-sm font-medium rounded-lg transition-colors">
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
          {canWrite && (
            <button onClick={() => { setIsEdit(false); setFormData({ leadName: '', type: 'Call', date: '', time: '', notes: '', status: 'Scheduled' }); setShowModal(true); }} className="flex items-center px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(20,184,166,0.3)]">
              <Plus className="w-4 h-4 mr-2" /> Schedule Follow-up
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline View */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-[var(--color-accent)]" /> Activity Timeline</h3>

          {loading ? (
            <div className="text-center text-white py-10">Loading timeline...</div>
          ) : followUps.length === 0 ? (
            <div className="text-center text-[var(--color-text-secondary)] py-10">No follow-ups scheduled yet.</div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-5 before:w-0.5 before:bg-[var(--color-border)]">
              {followUps.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative pl-12 group flex items-start justify-between"
                >
                  {/* Timeline Node Icon */}
                  <div className="absolute left-1.5 top-0.5 w-7.5 h-7.5 rounded-full border border-[var(--color-border)] bg-[var(--color-primary-bg)] flex items-center justify-center z-10 shadow">
                    {getTypeIcon(item.type)}
                  </div>

                  {/* Card Container */}
                  <div className="flex-1 glass-card p-4 hover:border-[var(--color-accent)]/30 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-accent)] tracking-wider">
                        {item.type} • {item.date} {item.time && `at ${item.time}`}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                        item.status === 'Completed' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">{item.leadName}</h4>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-3">{item.notes}</p>

                    {canWrite && (
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditClick(item)} className="p-1 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 border border-blue-500/15 transition-all"><Edit className="w-3.5 h-3.5"/></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 border border-red-500/15 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Calendar Side Panel */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Calendar Integrator</h3>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-white">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 bg-white/5 border border-[var(--color-border)] hover:bg-white/10 rounded text-white text-xs">&lt;</button>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 bg-white/5 border border-[var(--color-border)] hover:bg-white/10 rounded text-white text-xs">&gt;</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-8"></div>
              ))}
              {days.map(day => {
                const isSelected = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();
                return (
                  <div key={day} className={`h-8 flex items-center justify-center text-xs font-medium rounded-lg border transition-all ${
                    isSelected 
                      ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white font-bold' 
                      : 'bg-white/5 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-white'
                  }`}>
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--color-text-secondary)]">Calls Completed</span>
                  <span className="text-white font-bold">
                    {followUps.filter(f => f.type === 'Call' && f.status === 'Completed').length} / {followUps.filter(f => f.type === 'Call').length || 1}
                  </span>
                </div>
                <div className="w-full bg-[var(--color-primary-bg)] rounded-full h-2">
                  <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${(followUps.filter(f => f.type === 'Call' && f.status === 'Completed').length / (followUps.filter(f => f.type === 'Call').length || 1)) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--color-text-secondary)]">Meetings Conducted</span>
                  <span className="text-white font-bold">
                    {followUps.filter(f => f.type === 'Meeting' && f.status === 'Completed').length} / {followUps.filter(f => f.type === 'Meeting').length || 1}
                  </span>
                </div>
                <div className="w-full bg-[var(--color-primary-bg)] rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(followUps.filter(f => f.type === 'Meeting' && f.status === 'Completed').length / (followUps.filter(f => f.type === 'Meeting').length || 1)) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white"><X className="w-5 h-5"/></button>
              <h2 className="text-xl font-bold text-white mb-6">{isEdit ? 'Edit Follow-up schedule' : 'Schedule New Follow-up'}</h2>
              <form onSubmit={handleSaveFollowUp} className="space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Lead / Client Name *</label>
                    <input type="text" required value={formData.leadName} onChange={e => setFormData({...formData, leadName: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>

                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Interaction Type</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]">
                      <option value="Call" className="bg-[#1E293B] text-white">Call Notes</option>
                      <option value="Meeting" className="bg-[#1E293B] text-white">Meeting Notes</option>
                      <option value="Email" className="bg-[#1E293B] text-white">Email Notes</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Follow-Up Date *</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>

                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Time Slot</label>
                    <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>

                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]">
                      <option value="Scheduled" className="bg-[#1E293B] text-white">Scheduled</option>
                      <option value="Completed" className="bg-[#1E293B] text-white">Completed</option>
                      <option value="Pending" className="bg-[#1E293B] text-white">Pending</option>
                    </select>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="text-sm text-[var(--color-text-secondary)]">Interaction Details / Notes *</label>
                    <textarea rows="4" required placeholder="Add meeting agenda, discussion topics or follow up call results..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]"></textarea>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-[var(--color-primary-bg)] text-white font-medium rounded-lg border border-[var(--color-border)]">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium rounded-lg transition-colors">{isEdit ? 'Update Schedule' : 'Schedule Action'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FollowUp;
