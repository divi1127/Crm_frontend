import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, Calendar, User, AlertCircle, ChevronDown,
  ClipboardList, Clock, CheckCircle2, ArrowRight, RefreshCw
} from 'lucide-react';
import api from '../utils/api';

const STATUS_OPTIONS = [
  { value: 'todo',       label: 'To Do',      color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { value: 'inProgress', label: 'In Progress', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  { value: 'review',     label: 'Review',      color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { value: 'completed',  label: 'Completed',   color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' },
];

const PRIORITY_COLOR = {
  High:   'text-red-400 bg-red-400/10 border-red-400/20',
  Medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Low:    'text-blue-400 bg-blue-400/10 border-blue-400/20',
};

const MyTasks = () => {
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState(null); // task id being updated
  const [filter, setFilter]       = useState('all');
  const [user, setUser]           = useState(null);

  useEffect(() => {
    const info = JSON.parse(localStorage.getItem('userInfo'));
    setUser(info);
    fetchMyTasks(info);
  }, []);

  const fetchMyTasks = async (info) => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${info.token}` } };
      const { data } = await api.get('/api/tasks', config);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdating(taskId);
    try {
      const info = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${info.token}` } };
      const { data } = await api.put(`/api/tasks/${taskId}`, { status: newStatus }, config);
      setTasks(prev => prev.map(t => t.id === taskId ? data : t));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusObj = (val) => STATUS_OPTIONS.find(s => s.value === val) || STATUS_OPTIONS[0];

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const stats = {
    total:      tasks.length,
    todo:       tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'inProgress').length,
    completed:  tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Assigned Tasks</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">
            Tasks assigned to you by your Admin — update your progress below.
          </p>
        </div>
        <button
          onClick={() => fetchMyTasks(user)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-[var(--color-border)] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks',  value: stats.total,      icon: ClipboardList,  color: 'from-blue-500/20 to-blue-600/10',    border: 'border-blue-500/20',   text: 'text-blue-400' },
          { label: 'To Do',        value: stats.todo,       icon: Clock,          color: 'from-slate-500/20 to-slate-600/10',  border: 'border-slate-500/20',  text: 'text-slate-400' },
          { label: 'In Progress',  value: stats.inProgress, icon: ArrowRight,     color: 'from-yellow-500/20 to-yellow-600/10',border: 'border-yellow-500/20', text: 'text-yellow-400' },
          { label: 'Completed',    value: stats.completed,  icon: CheckCircle2,   color: 'from-teal-500/20 to-teal-600/10',    border: 'border-teal-500/20',   text: 'text-teal-400' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass-card p-5 bg-gradient-to-br ${s.color} border ${s.border}`}
          >
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`w-5 h-5 ${s.text}`} />
              <span className={`text-2xl font-bold ${s.text}`}>{s.value}</span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] font-medium">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[{ val: 'all', label: 'All Tasks' }, ...STATUS_OPTIONS.map(s => ({ val: s.value, label: s.label }))].map(f => (
          <button
            key={f.val}
            onClick={() => setFilter(f.val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filter === f.val
                ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                : 'bg-white/5 text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-white'
            }`}
          >
            {f.label}
            {f.val !== 'all' && (
              <span className="ml-1.5 opacity-70">{tasks.filter(t => t.status === f.val).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="text-center text-white py-16 glass-card">
          <RefreshCw className="w-6 h-6 mx-auto mb-3 animate-spin text-[var(--color-accent)]" />
          Loading your tasks...
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 glass-card"
        >
          <CheckSquare className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-secondary)] opacity-40" />
          <p className="text-[var(--color-text-secondary)] font-medium">
            {filter === 'all'
              ? 'No tasks have been assigned to you yet.'
              : `No tasks in "${getStatusObj(filter).label}" status.`}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 opacity-60">
            Check back later or contact your admin.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((task, idx) => {
              const statusObj = getStatusObj(task.status);
              const isUpdating = updating === task.id;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`glass-card p-5 border transition-all ${
                    task.status === 'completed'
                      ? 'border-teal-500/20 bg-teal-500/[0.02]'
                      : task.status === 'inProgress'
                      ? 'border-yellow-500/20 bg-yellow-500/[0.02]'
                      : 'border-[var(--color-border)]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    {/* Left - Task Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.Medium}`}>
                          {task.priority}
                        </span>
                        {task.status === 'completed' && (
                          <span className="flex items-center gap-1 text-teal-400 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                          </span>
                        )}
                      </div>

                      <h3 className={`text-base font-bold mb-1 ${task.status === 'completed' ? 'line-through text-[var(--color-text-secondary)]' : 'text-white'}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-[var(--color-text-secondary)] mb-3 leading-relaxed">{task.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs text-[var(--color-text-secondary)]">
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                            Due: <strong className="text-white ml-0.5">{task.dueDate}</strong>
                          </span>
                        )}
                        {task.assignedByName && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-purple-400" />
                            Assigned by: <strong className="text-white ml-0.5">{task.assignedByName}</strong>
                          </span>
                        )}
                      </div>

                      {task.notes && (
                        <div className="mt-3 px-3 py-2 rounded-lg bg-white/5 border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                          <AlertCircle className="w-3 h-3 inline mr-1 text-yellow-400" />
                          {task.notes}
                        </div>
                      )}
                    </div>

                    {/* Right - Status Updater */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="text-xs text-[var(--color-text-secondary)] font-medium mb-1">Update Status:</p>
                      <div className="relative">
                        <select
                          value={task.status}
                          onChange={e => handleStatusChange(task.id, e.target.value)}
                          disabled={isUpdating}
                          className={`appearance-none pr-8 pl-3 py-2 rounded-lg text-sm font-semibold border cursor-pointer transition-all bg-[var(--color-primary-bg)] outline-none focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-50 ${statusObj.color}`}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value} className="bg-[#1E293B] text-white">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" />
                      </div>
                      {isUpdating && (
                        <p className="text-xs text-[var(--color-accent)] flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default MyTasks;
