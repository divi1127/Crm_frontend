import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Mail, Phone, MapPin, X, Calendar, Download, Edit, Trash2, Scan, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { exportToExcel } from '../utils/exportToExcel';
import { useLocation, useNavigate } from 'react-router-dom';
import FaceRegister from '../components/FaceRegister';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', role: '', department: '', email: '', username: '', phone: '', address: '', joiningDate: '', status: 'Active', password: '' 
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // Face registration
  const [faceRegTarget, setFaceRegTarget] = useState(null); // { userId, userName }
  const [userFaceMap, setUserFaceMap]     = useState({});   // userId -> hasFace
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.role === 'Admin') {
      setIsAdmin(true);
      if (location.search.includes('add=true')) {
        setShowModal(true);
        setIsEdit(false);
        navigate('/employees', { replace: true });
      }
      // fetch face registration status for all users
      fetchFaceStatus(userInfo);
    }
    fetchEmployees(userInfo);
  }, [location.search, navigate]);

  const fetchFaceStatus = async (userInfo) => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/users/faces', config);
      const map = {};
      data.forEach(u => { map[u.id] = !!u.faceDescriptor; });
      setUserFaceMap(map);
    } catch (e) {
      console.error('Face status fetch failed', e);
    }
  };

  const fetchEmployees = async (userInfo) => {
    try {
      const config = userInfo ? { headers: { Authorization: `Bearer ${userInfo.token}` } } : {};
      const { data } = await axios.get('/api/employees', config);
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      if (isEdit) {
        const { data } = await axios.put(`/api/employees/${editId}`, formData, config);
        setEmployees(employees.map(emp => emp.id === editId ? data : emp));
      } else {
        const { data } = await axios.post('/api/employees', formData, config);
        setEmployees([data.employee, ...employees]);
      }
      
      setShowModal(false);
      setFormData({ name: '', role: '', department: '', email: '', username: '', phone: '', address: '', joiningDate: '', status: 'Active', password: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving employee.');
    }
  };

  const handleEditClick = (emp) => {
    setIsEdit(true);
    setEditId(emp.id);
    setFormData({
      name: emp.name || '',
      role: emp.role || '',
      department: emp.department || '',
      email: emp.email || '',
      username: emp.username || '',
      phone: emp.phone || '',
      address: emp.address || '',
      joiningDate: emp.joiningDate || '',
      status: emp.status || 'Active',
      password: '' // Keep empty on edit unless reset
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee? (This will also delete their login account)')) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.delete(`/api/employees/${id}`, config);
      setEmployees(employees.filter(emp => emp.id !== id));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete employee.');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'On Leave': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Offline': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Employee Management</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">Manage team members and roles.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToExcel(employees, 'Employees_Data')} className="flex items-center px-4 py-2 bg-white/5 hover:bg-white/10 border border-[var(--color-border)] text-white text-sm font-medium rounded-lg transition-colors">
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
          {isAdmin && (
            <button onClick={() => { setIsEdit(false); setFormData({ name: '', role: '', department: '', email: '', username: '', phone: '', address: '', joiningDate: '', status: 'Active', password: '' }); setShowModal(true); }} className="flex items-center px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(20,184,166,0.3)]">
              <Plus className="w-4 h-4 mr-2" /> Add Employee
            </button>
          )}
        </div>
      </div>

      <div className="glass-card p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
            <input 
              type="text" 
              placeholder="Search employees..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--color-accent)]" 
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-white py-10">Loading employees...</div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center text-[var(--color-text-secondary)] py-10 glass-card">No employees found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEmployees.map((emp, idx) => (
            <motion.div key={emp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="glass-card p-6 relative overflow-hidden group hover:border-[var(--color-accent)]/30 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-teal-400 p-[2px]">
                  <div className="w-full h-full bg-[var(--color-card-bg)] rounded-full flex items-center justify-center overflow-hidden">
                    <span className="text-xl font-bold text-white">{emp.name.charAt(0)}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-[var(--color-accent)] transition-colors">{emp.name}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">{emp.role}</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Register Face button */}
                    <button
                      title="Register Face for Attendance"
                      onClick={() => {
                        // find User ID by email match from faces endpoint
                        // We pass email to look up userId
                        setFaceRegTarget({ userEmail: emp.email, userName: emp.name });
                      }}
                      className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-all"
                    >
                      <Scan className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleEditClick(emp)} className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all"><Edit className="w-3.5 h-3.5"/></button>
                    <button onClick={() => handleDelete(emp.id)} className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                )}
              </div>
              <div className="space-y-2 mb-4 text-sm text-[var(--color-text-secondary)]">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> <span className="truncate">{emp.email}</span></div>
                {emp.username && <div className="flex items-center gap-2"><span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-white">@username</span> <span className="truncate font-mono">{emp.username}</span></div>}
                {emp.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> <span>{emp.phone}</span></div>}
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> <span>{emp.department} Dept</span></div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(emp.status)}`}>{emp.status}</span>
                <div className="flex items-center gap-2">
                  {emp.joiningDate && <span className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1"><Calendar className="w-3 h-3"/> {emp.joiningDate}</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Face Registration Modal */}
      <AnimatePresence>
        {faceRegTarget && (
          <FaceRegisterByEmail
            userEmail={faceRegTarget.userEmail}
            userName={faceRegTarget.userName}
            onClose={() => setFaceRegTarget(null)}
            onSuccess={() => {
              const userInfo = JSON.parse(localStorage.getItem('userInfo'));
              fetchFaceStatus(userInfo);
            }}
          />
        )}
      </AnimatePresence>

      {/* Comprehensive Add/Edit Employee Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white"><X className="w-5 h-5"/></button>
              <h2 className="text-xl font-bold text-white mb-6">{isEdit ? 'Edit Employee Profile' : 'Add Detailed Employee Profile'}</h2>
              <form onSubmit={handleSaveEmployee} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Info */}
                  <div className="col-span-1 md:col-span-2 border-b border-[var(--color-border)] pb-2 mb-2">
                    <h3 className="text-sm font-bold text-[var(--color-accent)]">Personal Details</h3>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Full Name *</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Email Address *</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Username *</label>
                    <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  
                  {!isEdit && (
                    <div>
                      <label className="text-sm text-[var(--color-text-secondary)]">Login Password *</label>
                      <input type="text" required placeholder="Set a password for them" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Phone Number</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  <div className={isEdit ? "col-span-1 md:col-span-2" : "col-span-1"}>
                    <label className="text-sm text-[var(--color-text-secondary)]">Home Address</label>
                    <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>

                  {/* Company Info */}
                  <div className="col-span-1 md:col-span-2 border-b border-[var(--color-border)] pb-2 mb-2 mt-2">
                    <h3 className="text-sm font-bold text-[var(--color-accent)]">Employment Details</h3>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Job Role *</label>
                    <input type="text" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Department *</label>
                    <input type="text" required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Joining Date</label>
                    <input type="date" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Current Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]">
                      <option value="Active" className="bg-[#1E293B] text-white">Active</option>
                      <option value="On Leave" className="bg-[#1E293B] text-white">On Leave</option>
                      <option value="Offline" className="bg-[#1E293B] text-white">Offline</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-[var(--color-primary-bg)] text-white font-medium rounded-lg border border-[var(--color-border)]">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium rounded-lg transition-colors">{isEdit ? 'Update Employee' : 'Save Employee Data'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {faceRegTarget && (
          <FaceRegisterByEmail
            userEmail={faceRegTarget.userEmail}
            userName={faceRegTarget.userName}
            onClose={() => setFaceRegTarget(null)}
            onSuccess={() => {
              const userInfo = JSON.parse(localStorage.getItem('userInfo'));
              fetchFaceStatus(userInfo);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const FaceRegisterByEmail = ({ userEmail, userName, onClose, onSuccess }) => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.token) {
          setError('Please login as Admin to register faces.');
          return;
        }
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get('/api/users/faces', config);
        const match = data.find(u => u.email === userEmail);
        if (!match) {
          setError('No associated login user found for this employee email. Ensure the employee has a user account.');
          return;
        }
        setUserId(match.id);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to fetch face registration details.');
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) {
      setLoading(true);
      setError('');
      fetchUserId();
    }
  }, [userEmail]);

  if (!userEmail) return null;

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card p-6 text-center">
            <p className="text-white">Loading face registration details...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card p-6 max-w-md text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={onClose} className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg">Close</button>
          </div>
        </div>
      )}
      {!loading && !error && userId && (
        <FaceRegister
          userId={userId}
          userName={userName}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
};

export default Employees;
