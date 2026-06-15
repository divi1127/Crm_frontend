import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit, Trash2, X, Phone, Mail, 
  Briefcase, Activity, CheckCircle2, ChevronRight, ShoppingBag, 
  AlertTriangle, Truck, Download
} from 'lucide-react';
import axios from 'axios';
import { exportToExcel } from '../utils/exportToExcel';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    company: '', 
    email: '', 
    phone: '', 
    orderDetail: '', 
    implementationStatus: 'Planning', 
    changes: '', 
    deliveryStatus: 'Pending' 
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.role === 'Admin') {
      setIsAdmin(true);
    }
    fetchClients(userInfo);
  }, []);

  const fetchClients = async (userInfo) => {
    try {
      const config = userInfo ? { headers: { Authorization: `Bearer ${userInfo.token}` } } : {};
      const { data } = await axios.get('/api/clients', config);
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      if (isEdit) {
        const { data } = await axios.put(`/api/clients/${editId}`, formData, config);
        setClients(clients.map(c => c.id === editId ? data : c));
      } else {
        const { data } = await axios.post('/api/clients', formData, config);
        setClients([data, ...clients]);
      }
      
      setShowModal(false);
      setFormData({ 
        name: '', 
        company: '', 
        email: '', 
        phone: '', 
        orderDetail: '', 
        implementationStatus: 'Planning', 
        changes: '', 
        deliveryStatus: 'Pending' 
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving client data.');
    }
  };

  const handleEditClick = (client) => {
    setIsEdit(true);
    setEditId(client.id);
    setFormData({
      name: client.name || '',
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      orderDetail: client.orderDetail || '',
      implementationStatus: client.implementationStatus || 'Planning',
      changes: client.changes || '',
      deliveryStatus: client.deliveryStatus || 'Pending'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client? All associated projects will lose their link.')) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.delete(`/api/clients/${id}`, config);
      setClients(clients.filter(c => c.id !== id));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete client.');
    }
  };

  const getImplementationColor = (status) => {
    switch(status) {
      case 'Planning': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Development': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Testing': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Completed': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getDeliveryColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Shipped': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Delivered': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Client Management</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">Monitor orders, implementation phases, changes, and delivery status.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => exportToExcel(clients, 'Clients_Data')} 
            className="flex items-center px-4 py-2 bg-white/5 hover:bg-white/10 border border-[var(--color-border)] text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
          {isAdmin && (
            <button 
              onClick={() => { 
                setIsEdit(false); 
                setFormData({ 
                  name: '', 
                  company: '', 
                  email: '', 
                  phone: '', 
                  orderDetail: '', 
                  implementationStatus: 'Planning', 
                  changes: '', 
                  deliveryStatus: 'Pending' 
                }); 
                setShowModal(true); 
              }} 
              className="flex items-center px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(20,184,166,0.3)]"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Client
            </button>
          )}
        </div>
      </div>

      <div className="glass-card p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
          <input 
            type="text" 
            placeholder="Search clients by name, company, or email..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--color-accent)]" 
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-white py-10">Loading clients...</div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center text-[var(--color-text-secondary)] py-10 glass-card">No clients found. Click Add Client to get started.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredClients.map((client) => (
            <motion.div 
              key={client.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-0.5">{client.name}</h3>
                    {client.company && (
                      <p className="text-sm text-[var(--color-accent)] font-medium">{client.company}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <>
                        <button 
                          onClick={() => handleEditClick(client)} 
                          className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 transition-all cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(client.id)} 
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[var(--color-border)]/40 text-xs">
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <Mail className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                      <Phone className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4">
                  {/* Order detail */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1.5 uppercase tracking-wider">
                      <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                      <span>Order Description</span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] bg-white/3 p-3 rounded-lg border border-[var(--color-border)]/20 leading-relaxed max-h-24 overflow-y-auto">
                      {client.orderDetail || 'No order details available.'}
                    </p>
                  </div>

                  {/* Changes requested */}
                  {client.changes && (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1.5 uppercase tracking-wider">
                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Changes Requested</span>
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)] bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10 leading-relaxed max-h-24 overflow-y-auto">
                        {client.changes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Section */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-[var(--color-border)]/40">
                <div>
                  <span className="text-[var(--color-text-secondary)] text-[10px] uppercase font-bold tracking-wider block mb-1">Implementation</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getImplementationColor(client.implementationStatus)}`}>
                    <Activity className="w-3 h-3" />
                    {client.implementationStatus}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-secondary)] text-[10px] uppercase font-bold tracking-wider block mb-1">Delivery Status</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getDeliveryColor(client.deliveryStatus)}`}>
                    <Truck className="w-3 h-3" />
                    {client.deliveryStatus}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Client Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="glass-card w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowModal(false)} 
                className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-white mb-6">{isEdit ? 'Edit Client Profile' : 'Add New Client'}</h2>
              
              <form onSubmit={handleSaveClient} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Details */}
                  <div className="col-span-1 md:col-span-2 border-b border-[var(--color-border)]/40 pb-1 mb-2">
                    <h3 className="text-sm font-bold text-[var(--color-accent)]">Basic Info</h3>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Client Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" 
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Company Name</label>
                    <input 
                      type="text" 
                      value={formData.company} 
                      onChange={e => setFormData({...formData, company: e.target.value})} 
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" 
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Email Address *</label>
                    <input 
                      type="email" 
                      required 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" 
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Phone Number</label>
                    <input 
                      type="tel" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" 
                    />
                  </div>

                  {/* Statuses */}
                  <div className="col-span-1 md:col-span-2 border-b border-[var(--color-border)]/40 pb-1 mb-2 mt-2">
                    <h3 className="text-sm font-bold text-[var(--color-accent)]">Project Statuses</h3>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Implementation Phase</label>
                    <select 
                      value={formData.implementationStatus} 
                      onChange={e => setFormData({...formData, implementationStatus: e.target.value})} 
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="Planning" className="bg-[#1E293B] text-white">Planning</option>
                      <option value="Development" className="bg-[#1E293B] text-white">Development</option>
                      <option value="Testing" className="bg-[#1E293B] text-white">Testing</option>
                      <option value="Completed" className="bg-[#1E293B] text-white">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Delivery Status</label>
                    <select 
                      value={formData.deliveryStatus} 
                      onChange={e => setFormData({...formData, deliveryStatus: e.target.value})} 
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="Pending" className="bg-[#1E293B] text-white">Pending</option>
                      <option value="Shipped" className="bg-[#1E293B] text-white">Shipped</option>
                      <option value="Delivered" className="bg-[#1E293B] text-white">Delivered</option>
                    </select>
                  </div>

                  {/* Order Detail & Changes */}
                  <div className="col-span-1 md:col-span-2 border-b border-[var(--color-border)]/40 pb-1 mb-2 mt-2">
                    <h3 className="text-sm font-bold text-[var(--color-accent)]">Order details & Requests</h3>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-sm text-[var(--color-text-secondary)]">Order Description (Order Detail)</label>
                    <textarea 
                      rows="3" 
                      value={formData.orderDetail} 
                      onChange={e => setFormData({...formData, orderDetail: e.target.value})} 
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]"
                      placeholder="Specify order details..."
                    ></textarea>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-sm text-[var(--color-text-secondary)]">Changes Requested</label>
                    <textarea 
                      rows="2" 
                      value={formData.changes} 
                      onChange={e => setFormData({...formData, changes: e.target.value})} 
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]"
                      placeholder="Specify requested changes or revisions..."
                    ></textarea>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="px-4 py-2 bg-[var(--color-primary-bg)] text-white font-medium rounded-lg border border-[var(--color-border)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    {isEdit ? 'Update Profile' : 'Save Client'}
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

export default Clients;
