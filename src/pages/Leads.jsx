import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Edit, Trash2, X, Phone, Mail, MapPin, Download } from 'lucide-react';
import axios from 'axios';
import { exportToExcel } from '../utils/exportToExcel';
import { useLocation, useNavigate } from 'react-router-dom';

const Leads = () => {
  const [view, setView] = useState('table');
  const [leads, setLeads] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', company: '', email: '', phone: '', address: '', leadSource: 'Organic', status: 'New', notes: '' 
  });
  const [loading, setLoading] = useState(true);
  // canWrite = Admin or Marketing can add/edit/delete leads
  const [canWrite, setCanWrite] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) {
      const role = userInfo.role;
      setUserRole(role);
      // Admin and Marketing can create/edit/delete leads
      if (role === 'Admin' || role === 'Marketing') {
        setCanWrite(true);
        if (location.search.includes('add=true')) {
          setShowModal(true);
          setIsEdit(false);
          navigate('/leads', { replace: true });
        }
      }
    }
    fetchLeads(userInfo);
  }, [location.search, navigate]);


  const fetchLeads = async (userInfo) => {
    try {
      const config = userInfo ? { headers: { Authorization: `Bearer ${userInfo.token}` } } : {};
      const { data } = await axios.get('/api/leads', config);
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      if (isEdit) {
        // Edit flow
        const { data } = await axios.put(`/api/leads/${editId}`, formData, config);
        setLeads(leads.map(l => l.id === editId ? data : l));
      } else {
        // Add flow
        const { data } = await axios.post('/api/leads', formData, config);
        setLeads([data, ...leads]);
      }
      
      setShowModal(false);
      setFormData({ name: '', company: '', email: '', phone: '', address: '', leadSource: 'Organic', status: 'New', notes: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving lead data.');
    }
  };

  const handleEditClick = (lead) => {
    setIsEdit(true);
    setEditId(lead.id);
    setFormData({
      name: lead.name || '',
      company: lead.company || '',
      email: lead.email || '',
      phone: lead.phone || '',
      address: lead.address || '',
      leadSource: lead.leadSource || 'Organic',
      status: lead.status || 'New',
      notes: lead.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.delete(`/api/leads/${id}`, config);
      setLeads(leads.filter(l => l.id !== id));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete lead.');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'New': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Contacted': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Qualified': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Proposal Sent': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Closed Won': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'Closed Lost': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lead.company && lead.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Lead Management</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">
            {canWrite ? 'Manage and track your sales pipeline.' : 'View leads and sales pipeline. Contact Marketing team to make changes.'}
          </p>
          {!canWrite && (
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Read-only access</span>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToExcel(leads, 'Leads_Data')} className="flex items-center px-4 py-2 bg-white/5 hover:bg-white/10 border border-[var(--color-border)] text-white text-sm font-medium rounded-lg transition-colors">
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
          {canWrite && (
            <button onClick={() => { setIsEdit(false); setFormData({ name: '', company: '', email: '', phone: '', address: '', leadSource: 'Organic', status: 'New', notes: '' }); setShowModal(true); }} className="flex items-center px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(20,184,166,0.3)]">
              <Plus className="w-4 h-4 mr-2" /> Add New Lead
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
              placeholder="Search leads..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--color-accent)]" 
            />
          </div>
        </div>
        <div className="flex bg-[var(--color-primary-bg)] rounded-lg p-1 border border-[var(--color-border)]">
          <button onClick={() => setView('table')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${view === 'table' ? 'bg-[var(--color-card-bg)] text-white shadow' : 'text-[var(--color-text-secondary)] hover:text-white'}`}>Table</button>
          <button onClick={() => setView('kanban')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${view === 'kanban' ? 'bg-[var(--color-card-bg)] text-white shadow' : 'text-[var(--color-text-secondary)] hover:text-white'}`}>Kanban</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-white py-10">Loading leads...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center text-[var(--color-text-secondary)] py-10 glass-card">No leads found. Add a lead to get started.</div>
      ) : view === 'table' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-[var(--color-text-secondary)] text-xs uppercase tracking-wider border-b border-[var(--color-border)]">
                  <th className="px-6 py-4 font-medium">Lead Name</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Company</th>
                  <th className="px-6 py-4 font-medium">Source</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  {canWrite && <th className="px-6 py-4 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-[var(--color-border)]">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-white font-medium">{lead.name}</td>
                    <td className="px-6 py-4">
                      <div className="text-[var(--color-text-secondary)] flex flex-col gap-1 text-xs">
                        {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {lead.email}</span>}
                        {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {lead.phone}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)]">{lead.company}</td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)]">{lead.leadSource}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>{lead.status}</span>
                    </td>
                    {canWrite && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditClick(lead)} className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 transition-all"><Edit className="w-4 h-4"/></button>
                          <button onClick={() => handleDelete(lead.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-all"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed Won'].map(status => (
            <div key={status} className="glass-card min-w-[280px] flex-shrink-0 flex flex-col max-h-[70vh]">
              <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-card-bg)]/90 rounded-t-2xl">
                <h3 className="font-bold text-white text-sm">{status}</h3>
                <span className="text-xs text-[var(--color-text-secondary)]">{filteredLeads.filter(l => l.status === status).length}</span>
              </div>
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {filteredLeads.filter(l => l.status === status).map(lead => (
                  <div key={lead.id} className="p-3 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl relative group">
                    <h4 className="text-sm font-bold text-white mb-1">{lead.name}</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] mb-2">{lead.company}</p>
                    {lead.phone && <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 mb-2"><Phone className="w-3 h-3"/> {lead.phone}</p>}
                    {canWrite && (
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditClick(lead)} className="p-1 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors"><Edit className="w-3 h-3"/></button>
                        <button onClick={() => handleDelete(lead.id)} className="p-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors"><Trash2 className="w-3 h-3"/></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comprehensive Add/Edit Lead Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white"><X className="w-5 h-5"/></button>
              <h2 className="text-xl font-bold text-white mb-6">{isEdit ? 'Edit Lead Details' : 'Add Detailed Lead'}</h2>
              <form onSubmit={handleSaveLead} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Details */}
                  <div className="col-span-1 md:col-span-2 border-b border-[var(--color-border)] pb-2 mb-2">
                    <h3 className="text-sm font-bold text-[var(--color-accent)]">Basic Details</h3>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Full Name *</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Company Name</label>
                    <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>

                  {/* Contact Info */}
                  <div className="col-span-1 md:col-span-2 border-b border-[var(--color-border)] pb-2 mb-2 mt-2">
                    <h3 className="text-sm font-bold text-[var(--color-accent)]">Contact Info</h3>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Email Address *</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Phone Number</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-sm text-[var(--color-text-secondary)]">Physical Address</label>
                    <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                  </div>

                  {/* CRM Info */}
                  <div className="col-span-1 md:col-span-2 border-b border-[var(--color-border)] pb-2 mb-2 mt-2">
                    <h3 className="text-sm font-bold text-[var(--color-accent)]">CRM Data</h3>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Lead Source</label>
                    <select value={formData.leadSource} onChange={e => setFormData({...formData, leadSource: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]">
                      <option value="Organic" className="bg-[#1E293B] text-white">Organic Search</option>
                      <option value="Social" className="bg-[#1E293B] text-white">Social Media</option>
                      <option value="Referral" className="bg-[#1E293B] text-white">Referral</option>
                      <option value="Direct" className="bg-[#1E293B] text-white">Direct Contact</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Current Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]">
                      <option value="New" className="bg-[#1E293B] text-white">New</option>
                      <option value="Contacted" className="bg-[#1E293B] text-white">Contacted</option>
                      <option value="Qualified" className="bg-[#1E293B] text-white">Qualified</option>
                      <option value="Proposal Sent" className="bg-[#1E293B] text-white">Proposal Sent</option>
                      <option value="Closed Won" className="bg-[#1E293B] text-white">Closed Won</option>
                      <option value="Closed Lost" className="bg-[#1E293B] text-white">Closed Lost</option>
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-sm text-[var(--color-text-secondary)]">Initial Notes</label>
                    <textarea rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]"></textarea>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-[var(--color-primary-bg)] text-white font-medium rounded-lg border border-[var(--color-border)]">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium rounded-lg transition-colors">{isEdit ? 'Update Lead' : 'Save Lead Data'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Leads;
