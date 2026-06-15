import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Mail, Shield, X, Edit, Trash2, Copy, CheckCircle } from 'lucide-react';
import axios from 'axios';

const EmployeeAccounts = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'Developer',
    specialization: ''
  });

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo?.role !== 'Admin') {
      window.location.href = '/login';
      return;
    }
    fetchEmployees(userInfo);
  }, []);

  const fetchEmployees = async (userInfo) => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/auth/employees', config);
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees', error);
      if (error.response?.status === 403) {
        alert('Only admins can access this page');
        window.location.href = '/dashboard';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      if (isEdit) {
        const { data } = await axios.put(`/api/auth/employees/${editId}`, formData, config);
        setEmployees(employees.map(emp => emp.id === editId ? data : emp));
        setSuccessMessage('Employee updated successfully');
      } else {
        const { data } = await axios.post('/api/auth/create-employee', formData, config);
        setEmployees([data, ...employees]);
        setSuccessMessage('Employee created successfully');
      }

      setTimeout(() => setSuccessMessage(''), 3000);
      setShowModal(false);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving employee');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee account?')) return;

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.delete(`/api/auth/employees/${id}`, config);
      setEmployees(employees.filter(emp => emp.id !== id));
      setSuccessMessage('Employee deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting employee');
    }
  };

  const handleEdit = (emp) => {
    setIsEdit(true);
    setEditId(emp.id);
    setFormData({
      name: emp.name || '',
      email: emp.email || '',
      username: emp.username || '',
      password: '',
      role: emp.role || 'Developer',
      specialization: emp.specialization || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      role: 'Developer',
      specialization: ''
    });
    setIsEdit(false);
    setEditId(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowModal(true);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Employee Login Accounts</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">Create and manage employee login credentials (Developer & Marketing roles)</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddNew}
          className="flex items-center px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(20,184,166,0.3)]"
        >
          <Plus className="w-4 h-4 mr-2" /> Create Employee Account
        </motion.button>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400"
          >
            <CheckCircle className="w-5 h-5" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
          <input
            type="text"
            placeholder="Search by name, email, username, or role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* Employees Table */}
      {loading ? (
        <div className="text-center text-white py-10">Loading employees...</div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center text-[var(--color-text-secondary)] py-10 glass-card">
          {employees.length === 0 ? 'No employee accounts created yet.' : 'No employees match your search.'}
        </div>
      ) : (
        <div className="glass-card p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-bold uppercase">
                <th className="text-left py-3 px-3">Name</th>
                <th className="text-left py-3 px-3">Email</th>
                <th className="text-left py-3 px-3">Username</th>
                <th className="text-left py-3 px-3">Role</th>
                <th className="text-left py-3 px-3">Specialization</th>
                <th className="text-center py-3 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp, idx) => (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-[var(--color-border)] hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-3 text-white font-medium">{emp.name}</td>
                  <td className="py-3 px-3 text-white flex items-center gap-2">
                    <Mail className="w-3 h-3 text-[var(--color-accent)]" />
                    {emp.email}
                    <button
                      onClick={() => copyToClipboard(emp.email, `email-${emp.id}`)}
                      className="text-[var(--color-text-secondary)] hover:text-white ml-1"
                      title="Copy email"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </td>
                  <td className="py-3 px-3 text-white font-mono text-xs bg-white/5 px-2 py-1 rounded w-fit">{emp.username || '—'}</td>
                  <td className="py-3 px-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      emp.role === 'Developer' 
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : emp.role === 'Marketing'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20'
                    }`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[var(--color-text-secondary)] text-xs">{emp.specialization || '—'}</td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex justify-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(emp)}
                        className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all"
                        title="Edit employee"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(emp.id)}
                        className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                        title="Delete employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Employee Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md p-6 relative"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--color-accent)]" />
                {isEdit ? 'Update Employee Account' : 'Create New Employee Account'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white focus:border-[var(--color-accent)] outline-none"
                    placeholder="e.g., John Developer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white focus:border-[var(--color-accent)] outline-none"
                    placeholder="e.g., john@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white focus:border-[var(--color-accent)] outline-none"
                    placeholder="e.g., john_dev"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                    Password {isEdit && '(Leave empty to keep current)'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!isEdit}
                    className="w-full px-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white focus:border-[var(--color-accent)] outline-none"
                    placeholder="Enter secure password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white focus:border-[var(--color-accent)] outline-none"
                  >
                    <option value="Developer" className="bg-[#1E293B]">Developer</option>
                    <option value="Marketing" className="bg-[#1E293B]">Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Specialization (Optional)</label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white focus:border-[var(--color-accent)] outline-none"
                    placeholder="e.g., Full Stack, SEO, Content Writing"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-white/5 border border-[var(--color-border)] text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-lg transition-colors font-medium shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                  >
                    {isEdit ? 'Update Account' : 'Create Account'}
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

export default EmployeeAccounts;
