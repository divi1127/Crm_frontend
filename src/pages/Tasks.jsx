import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Calendar as CalendarIcon, User, Download, Edit, Trash2, Users } from 'lucide-react';
import axios from 'axios';
import { exportToExcel } from '../utils/exportToExcel';
import { useLocation, useNavigate } from 'react-router-dom';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]); // list of employees for assign dropdown
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', priority: 'Medium', status: 'todo',
    dueDate: '', assignedToUserId: '', assignee: '', notes: ''
  });
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const columns = [
    { id: 'todo',       title: 'To Do',      color: 'bg-blue-500' },
    { id: 'inProgress', title: 'In Progress', color: 'bg-yellow-500' },
    { id: 'review',     title: 'Review',      color: 'bg-purple-500' },
    { id: 'completed',  title: 'Completed',   color: 'bg-teal-500' },
  ];

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (location.search.includes('add=true')) {
      setShowModal(true);
      setIsEdit(false);
      navigate('/tasks', { replace: true });
    }
    fetchTasks(userInfo);
    fetchEmployees(userInfo);
  }, [location.search, navigate]);

  const fetchTasks = async (userInfo) => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/tasks', config);
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async (userInfo) => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/users', config);
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees list:', error);
    }
  };

  // When admin selects an employee from dropdown, auto-fill assignee name
  const handleEmployeeSelect = (userId) => {
    const emp = employees.find(e => String(e.id) === String(userId));
    setFormData(prev => ({
      ...prev,
      assignedToUserId: userId,
      assignee: emp ? emp.name : ''
    }));
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      // Build payload — ensure assignedToUserId is a number or null
      const payload = {
        ...formData,
        assignedToUserId: formData.assignedToUserId ? Number(formData.assignedToUserId) : null,
      };

      if (isEdit) {
        await axios.put(`/api/tasks/${editId}`, payload, config);
        fetchTasks(userInfo);
      } else {
        const { data } = await axios.post('/api/tasks', payload, config);
        setTasks(prev => [data, ...prev]);
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving task.');
    }
  };

  const handleEditClick = (task) => {
    setIsEdit(true);
    setEditId(task.id);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'Medium',
      status: task.status || 'todo',
      dueDate: task.dueDate || '',
      assignedToUserId: task.assignedToUserId || '',
      assignee: task.assignee || '',
      notes: task.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.delete(`/api/tasks/${id}`, config);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete task.');
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', priority: 'Medium', status: 'todo', dueDate: '', assignedToUserId: '', assignee: '', notes: '' });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':   return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Low':    return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default:       return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Task Management</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">Assign and track tasks across your team.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportToExcel(tasks, 'Tasks_Data')}
            className="flex items-center px-4 py-2 bg-white/5 hover:bg-white/10 border border-[var(--color-border)] text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
          <button
            onClick={() => { setIsEdit(false); resetForm(); setShowModal(true); }}
            className="flex items-center px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(20,184,166,0.3)]"
          >
            <Plus className="w-4 h-4 mr-2" /> Assign Task
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-white py-10">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center text-[var(--color-text-secondary)] py-10 glass-card">
          No tasks yet. Use "Assign Task" to create and assign tasks to employees.
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-6 h-full pb-4 items-start min-w-[1000px]">
            {columns.map(col => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card w-full flex-1 flex flex-col max-h-[75vh]"
              >
                <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <h3 className="font-bold text-white">{col.title}</h3>
                  </div>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {tasks.filter(t => t.status === col.id).length}
                  </span>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                  {tasks.filter(t => t.status === col.id).map(task => (
                    <div key={task.id} className="p-4 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl relative group">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditClick(task)} className="p-1 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20">
                            <Edit className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDelete(task.id)} className="p-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white mb-1">{task.title}</h4>
                      <p className="text-xs text-[var(--color-text-secondary)] mb-4">{task.description}</p>

                      <div className="flex flex-col gap-1.5 pt-3 border-t border-[var(--color-border)]/50">
                        {task.dueDate && (
                          <div className="flex items-center text-[10px] text-[var(--color-text-secondary)]">
                            <CalendarIcon className="w-3 h-3 mr-1 text-[var(--color-accent)]" /> Due: {task.dueDate}
                          </div>
                        )}
                        {task.assignee && (
                          <div className="flex items-center text-[10px] text-[var(--color-text-secondary)]">
                            <User className="w-3 h-3 mr-1 text-purple-400" /> Assigned to: <span className="font-semibold text-white ml-1">{task.assignee}</span>
                          </div>
                        )}
                        {task.assignedByName && (
                          <div className="flex items-center text-[10px] text-[var(--color-text-secondary)]">
                            <Users className="w-3 h-3 mr-1 text-blue-400" /> Assigned by: {task.assignedByName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Task Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => { setShowModal(false); resetForm(); }} className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-white mb-1">{isEdit ? 'Edit Task' : 'Assign Task to Employee'}</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                {isEdit ? 'Update task details below.' : 'Fill in the task details and select which employee to assign it to.'}
              </p>

              <form onSubmit={handleSaveTask} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Task Title */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-sm text-[var(--color-text-secondary)]">Task Title *</label>
                    <input
                      type="text" required value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]"
                      placeholder="e.g. Fix login page bug"
                    />
                  </div>

                  {/* Description */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-sm text-[var(--color-text-secondary)]">Task Description</label>
                    <textarea
                      rows="3" value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]"
                      placeholder="Describe what needs to be done..."
                    />
                  </div>

                  {/* Assign To Employee Dropdown */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-sm text-[var(--color-text-secondary)] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                      Assign To Employee *
                    </label>
                    <select
                      required
                      value={formData.assignedToUserId}
                      onChange={e => handleEmployeeSelect(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="" className="bg-[#1E293B] text-gray-400">— Select an employee —</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id} className="bg-[#1E293B] text-white">
                          {emp.name} ({emp.role} — {emp.department || 'No Dept'})
                        </option>
                      ))}
                    </select>
                    {employees.length === 0 && (
                      <p className="text-xs text-yellow-400 mt-1">No employees found. Add employees first via the Employees module.</p>
                    )}
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Priority Level</label>
                    <select
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="High"   className="bg-[#1E293B]">High</option>
                      <option value="Medium" className="bg-[#1E293B]">Medium</option>
                      <option value="Low"    className="bg-[#1E293B]">Low</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Initial Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="todo"       className="bg-[#1E293B]">To Do</option>
                      <option value="inProgress" className="bg-[#1E293B]">In Progress</option>
                      <option value="review"     className="bg-[#1E293B]">Review</option>
                      <option value="completed"  className="bg-[#1E293B]">Completed</option>
                    </select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Due Date</label>
                    <input
                      type="date" value={formData.dueDate}
                      onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>

                  {/* Notes */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-sm text-[var(--color-text-secondary)]">Extra Notes / Instructions</label>
                    <textarea
                      rows="2" value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]"
                      placeholder="Any additional instructions for the employee..."
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-4 py-2 bg-[var(--color-primary-bg)] text-white font-medium rounded-lg border border-[var(--color-border)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium rounded-lg transition-colors"
                  >
                    {isEdit ? 'Update Task' : 'Assign Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tasks;
