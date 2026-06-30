import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, DollarSign, Briefcase, CheckSquare, 
  ArrowUpRight, MoreHorizontal, Plus, Edit, Trash2, X,
  Building, FolderKanban, ClipboardList, ArrowRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import api from '../utils/api';
import { exportToExcel } from '../utils/exportToExcel';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, increase, icon: Icon, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="glass-card p-4 relative overflow-hidden group hover:border-[var(--color-accent)]/50 transition-colors"
  >
    <div className="absolute -right-4 -top-4 w-20 h-20 bg-[var(--color-accent)]/10 rounded-full blur-2xl group-hover:bg-[var(--color-accent)]/20 transition-all"></div>
    <div className="flex items-start justify-between gap-2 mb-3">
      <div className="flex-1 min-w-0">
        <p className="text-[var(--color-text-secondary)] text-xs font-medium mb-1 truncate">{title}</p>
        <h3 className="text-2xl font-bold text-white leading-none">{value}</h3>
      </div>
      <div className="p-2 rounded-xl bg-white/5 text-[var(--color-accent)] group-hover:scale-110 transition-transform flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="flex items-center gap-1 text-xs">
      <ArrowUpRight className="w-3 h-3 text-[var(--color-accent)]" />
      <span className="text-[var(--color-accent)] font-semibold">{increase}</span>
      <span className="text-[var(--color-text-secondary)]">vs last month</span>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: { totalLeads: 0, salesRevenue: 0, employeeCount: 0, pendingTasks: 0, totalClients: 0, totalProjects: 0 },
    chartData: [],
    recentActivities: [],
    salesDeals: []
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('Developer');
  const [userName, setUserName] = useState('User');

  // Roles with full admin-level access
  const isAdminRole = ['Admin', 'HR', 'MD'].includes(userRole);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    client: '', amount: '', stage: 'Negotiation', probability: 50
  });
  // For employee dashboard: their own tasks
  const [myTasks, setMyTasks] = useState([]);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', company: '', email: '', phone: '', leadSource: 'Organic', status: 'New' });
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = userInfo ? { headers: { Authorization: `Bearer ${userInfo.token}` } } : {};
      
      const { data } = await api.get('/api/dashboard', config);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) {
      setUserRole(userInfo.role);
      setUserName(userInfo.name);
      // For non-admin-role users, also fetch their tasks
      if (!['Admin', 'HR', 'MD'].includes(userInfo.role)) {
        fetchMyTasks(userInfo);
      }
    }
    fetchDashboardData();
  }, []);

  const fetchMyTasks = async (userInfo) => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await api.get('/api/tasks', config);
      setMyTasks(data);
    } catch (err) {
      console.error('Failed to fetch my tasks', err);
    }
  };

  const handleSaveDeal = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      if (isEdit) {
        await api.put(`/api/salesdeals/${editId}`, formData, config);
      } else {
        await api.post('/api/salesdeals', formData, config);
      }
      
      setShowModal(false);
      setFormData({ client: '', amount: '', stage: 'Negotiation', probability: 50 });
      fetchDashboardData(); // Refresh everything to update stats and deals!
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving sales deal.');
    }
  };

  const handleEditClick = (deal) => {
    setIsEdit(true);
    setEditId(deal.id);
    setFormData({
      client: deal.client || '',
      amount: deal.amount || '',
      stage: deal.stage || 'Negotiation',
      probability: deal.probability || 50
    });
    setShowModal(true);
  };

  const handleDeleteDeal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sales deal?')) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await api.delete(`/api/salesdeals/${id}`, config);
      fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete sales deal.');
    }
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await api.post('/api/leads', leadForm, config);
      setShowLeadModal(false);
      setLeadForm({ name: '', company: '', email: '', phone: '', leadSource: 'Organic', status: 'New' });
      fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving lead.');
    }
  };

  const { stats, chartData, recentActivities, salesDeals } = dashboardData;

  if (loading) {
    return <div className="flex items-center justify-center h-full text-white">Loading Dashboard...</div>;
  }

  // Get role-appropriate welcome message and visible modules
  const getRoleMessage = () => {
    switch(userRole) {
      case 'Admin': return `Welcome back, ${userName}! You have full access to all CRM modules.`;
      case 'HR':    return `Welcome back, ${userName}! Here's your HR dashboard with full data access.`;
      case 'MD':    return `Welcome back, ${userName}! Here's your management dashboard with full data access.`;
      case 'Developer': return `Welcome back, ${userName}! Here's your development dashboard with projects and tasks.`;
      case 'Marketing': return `Welcome back, ${userName}! Here's your marketing dashboard with leads and follow-ups.`;
      default: return `Welcome back, ${userName}!`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Dashboard Overview</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">{getRoleMessage()}</p>
        </div>
        <div className="flex gap-2">
          {(isAdminRole || userRole === 'Marketing') && (
            <button onClick={() => setShowLeadModal(true)} className="flex items-center px-3 py-2 text-xs sm:text-sm bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-lg transition-colors whitespace-nowrap">
              <Plus className="w-4 h-4 mr-1" /> Add Lead
            </button>
          )}
          <button onClick={() => exportToExcel(recentActivities, 'Recent_Activities')} className="px-3 py-2 text-xs sm:text-sm bg-white/5 text-white rounded-lg border border-[var(--color-border)] hover:bg-white/10 transition-colors whitespace-nowrap">
            Export to Excel
          </button>
        </div>
      </div>

      {/* Top Stats — all shown for Admin/HR/MD, partial for others */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {(isAdminRole || userRole === 'Marketing') && <StatCard title="Total Leads" value={stats.totalLeads} increase="12.5%" icon={Users} delay={0.1} />}
        {(isAdminRole || userRole !== 'Developer') && <StatCard title="Total Clients" value={stats.totalClients || 0} increase="4.8%" icon={Building} delay={0.15} />}
        <StatCard title="Active Projects" value={stats.totalProjects || 0} increase="10.2%" icon={FolderKanban} delay={0.2} />
        {(isAdminRole || userRole === 'Marketing') && <StatCard title="Sales Revenue" value={`₹${Number(stats.salesRevenue||0).toLocaleString('en-IN')}`} increase="8.2%" icon={DollarSign} delay={0.25} />}
        {isAdminRole && <StatCard title="Employees" value={stats.employeeCount} increase="2.1%" icon={Briefcase} delay={0.3} />}
        <StatCard title="Pending Tasks" value={stats.pendingTasks} increase="18.3%" icon={CheckSquare} delay={0.35} />
      </div>

      {/* My Tasks panel — only for non-admin roles */}
      {!isAdminRole && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="glass-card overflow-hidden border border-[var(--color-accent)]/20"
        >
          <div className="p-5 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-accent)]/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">My Assigned Tasks</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {myTasks.length} task{myTasks.length !== 1 ? 's' : ''} assigned to you
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/my-tasks')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-semibold rounded-lg transition-all"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {myTasks.length === 0 ? (
            <div className="p-8 text-center text-[var(--color-text-secondary)] text-sm">
              No tasks assigned yet. Check back later or contact your admin.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {myTasks.slice(0, 5).map(task => {
                const statusColors = {
                  todo: 'text-blue-400 bg-blue-400/10',
                  inProgress: 'text-yellow-400 bg-yellow-400/10',
                  review: 'text-purple-400 bg-purple-400/10',
                  completed: 'text-teal-400 bg-teal-400/10'
                };
                const priorityColors = {
                  High: 'text-red-400', Medium: 'text-yellow-400', Low: 'text-blue-400'
                };
                return (
                  <div key={task.id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <CheckSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${priorityColors[task.priority] || 'text-gray-400'}`} />
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${task.status === 'completed' ? 'line-through text-[var(--color-text-secondary)]' : 'text-white'}`}>
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Due: {task.dueDate}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusColors[task.status] || 'text-gray-400 bg-gray-400/10'}`}>
                      {task.status === 'inProgress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </div>
                );
              })}
              {myTasks.length > 5 && (
                <div className="px-5 py-3 text-center">
                  <button onClick={() => navigate('/my-tasks')} className="text-xs text-[var(--color-accent)] font-semibold hover:underline">
                    +{myTasks.length - 5} more tasks — View All
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className={`glass-card p-4 sm:p-6 ${(isAdminRole || userRole === 'Marketing') ? 'lg:col-span-2' : 'lg:col-span-3'}`}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Revenue & Leads</h3>
          </div>
          <div className="h-52 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--color-text-secondary)" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'white' }}
                  itemStyle={{ color: 'var(--color-accent)' }}
                />
                <Area type="monotone" dataKey="sales" stroke="var(--color-accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Lead Conversion chart — admin roles + marketing */}
        {(isAdminRole || userRole === 'Marketing') && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="glass-card p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Lead Conversion</h3>
            </div>
            <div className="h-52 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--color-text-secondary)" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="leads" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>

      {/* Sales Management Module */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.65 }}
        className="glass-card overflow-hidden mt-6"
      >
        <div className="p-4 sm:p-6 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-card-bg)]/80">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Sales Pipeline</h3>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Active deals and revenue forecasting</p>
          </div>
          {isAdminRole && (
            <button onClick={() => { setIsEdit(false); setFormData({ client: '', amount: '', stage: 'Negotiation', probability: 50 }); setShowModal(true); }} className="flex items-center px-3 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-semibold rounded-lg transition-all">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Deal
            </button>
          )}
        </div>
        
        {salesDeals && salesDeals.length === 0 ? (
          <div className="p-10 text-center text-[var(--color-text-secondary)]">No active deals found.</div>
        ) : (
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {salesDeals && salesDeals.map((deal) => (
              <div key={deal.id} className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-accent)]/50 transition-colors relative group">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-white pr-6 truncate">{deal.client}</h4>
                  <span className="text-xs font-medium px-2 py-0.5 bg-white/5 rounded-md text-[var(--color-text-secondary)]">{deal.stage}</span>
                </div>
                <p className="text-xl font-bold text-[var(--color-accent)] mb-3">₹{deal.amount.toLocaleString('en-IN')}</p>
                
                {/* Probability Progress Bar */}
                <div className="w-full bg-white/5 rounded-full h-1.5 mb-1">
                  <div className={`h-1.5 rounded-full ${deal.probability >= 80 ? 'bg-teal-400' : deal.probability >= 50 ? 'bg-blue-400' : 'bg-yellow-400'}`} style={{ width: `${deal.probability}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
                  <span>Probability</span>
                  <span>{deal.probability}%</span>
                </div>

                {isAdminRole && (
                  <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-[var(--color-border)]/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditClick(deal)} className="p-1 text-blue-400 hover:text-blue-500 hover:bg-blue-500/10 rounded transition-colors"><Edit className="w-3.5 h-3.5"/></button>
                    <button onClick={() => handleDeleteDeal(deal.id)} className="p-1 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Leads Table — admin roles + marketing */}
      {(isAdminRole || userRole === 'Marketing') && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="glass-card overflow-hidden"
        >
          <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Recent Leads</h3>
          </div>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-left border-collapse min-w-[400px]">
              <thead>
                <tr className="bg-white/5 text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Company</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-[var(--color-border)]">
                {recentActivities.map((lead, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{lead.name}</td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)]">{lead.company}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        lead.status === 'New' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                        lead.status === 'Qualified' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        lead.status === 'Closed Won' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                        'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)]">{new Date(lead.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {recentActivities.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-[var(--color-text-secondary)]">No recent leads found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Quick Add Lead Modal (Marketing) */}
      <AnimatePresence>
        {showLeadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-md p-6 relative">
              <button onClick={() => setShowLeadModal(false)} className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white"><X className="w-5 h-5"/></button>
              <h2 className="text-xl font-bold text-white mb-6">Add New Lead</h2>
              <form onSubmit={handleSaveLead} className="space-y-4">
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)]">Full Name *</label>
                  <input type="text" required value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                </div>
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)]">Email *</label>
                  <input type="email" required value={leadForm.email} onChange={e => setLeadForm({...leadForm, email: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                </div>
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)]">Company</label>
                  <input type="text" value={leadForm.company} onChange={e => setLeadForm({...leadForm, company: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                </div>
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)]">Phone</label>
                  <input type="tel" value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Source</label>
                    <select value={leadForm.leadSource} onChange={e => setLeadForm({...leadForm, leadSource: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]">
                      <option value="Organic" className="bg-[#1E293B]">Organic</option>
                      <option value="Social" className="bg-[#1E293B]">Social</option>
                      <option value="Referral" className="bg-[#1E293B]">Referral</option>
                      <option value="Direct" className="bg-[#1E293B]">Direct</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Status</label>
                    <select value={leadForm.status} onChange={e => setLeadForm({...leadForm, status: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]">
                      <option value="New" className="bg-[#1E293B]">New</option>
                      <option value="Contacted" className="bg-[#1E293B]">Contacted</option>
                      <option value="Qualified" className="bg-[#1E293B]">Qualified</option>
                    </select>
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowLeadModal(false)} className="px-4 py-2 bg-[var(--color-primary-bg)] text-white font-medium rounded-lg border border-[var(--color-border)]">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium rounded-lg transition-colors">Save Lead</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Deal Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-md p-6 relative">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white"><X className="w-5 h-5"/></button>
              <h2 className="text-xl font-bold text-white mb-6">{isEdit ? 'Edit Sales Deal' : 'Add Sales Deal'}</h2>
              <form onSubmit={handleSaveDeal} className="space-y-4">
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)]">Client Name *</label>
                  <input type="text" required value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                </div>
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)]">Deal Amount (₹) *</label>
                  <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                </div>
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)]">Stage</label>
                  <select value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]">
                    <option value="Negotiation" className="bg-[#1E293B] text-white">Negotiation</option>
                    <option value="Proposal" className="bg-[#1E293B] text-white">Proposal</option>
                    <option value="Qualified" className="bg-[#1E293B] text-white">Qualified</option>
                    <option value="Closed Won" className="bg-[#1E293B] text-white">Closed Won</option>
                    <option value="Closed Lost" className="bg-[#1E293B] text-white">Closed Lost</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)]">Probability (%) *</label>
                  <input type="number" min="0" max="100" required value={formData.probability} onChange={e => setFormData({...formData, probability: e.target.value})} className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-[var(--color-primary-bg)] text-white font-medium rounded-lg border border-[var(--color-border)]">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium rounded-lg transition-colors">{isEdit ? 'Update Deal' : 'Save Deal'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
