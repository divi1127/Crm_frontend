import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import api from '../utils/api';

const COLORS = ['#14B8A6', '#3B82F6', '#8B5CF6', '#F59E0B'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [clients, setClients] = useState([]);
  const [attendances, setAttendances] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const [leadsRes, dealsRes, clientsRes, attendanceRes] = await Promise.all([
          api.get('/api/leads', config),
          api.get('/api/salesdeals', config),
          api.get('/api/clients', config),
          api.get('/api/attendances', config),
        ]);
        setLeads(leadsRes.data);
        setDeals(dealsRes.data);
        setClients(clientsRes.data);
        setAttendances(attendanceRes.data);
      } catch (err) {
        console.error('Reports fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // --- Build last 6 months revenue chart data ---
  const revenueData = (() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const label = MONTHS[d.getMonth()];
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const revenue = deals
        .filter(dl => dl.createdAt && dl.createdAt.startsWith(prefix))
        .reduce((sum, dl) => sum + (Number(dl.amount) || 0), 0);
      result.push({ name: label, revenue });
    }
    return result;
  })();

  // --- Lead conversion quarterly ---
  const leadConversionData = (() => {
    const quarters = [
      { name: 'Q1', months: [0, 1, 2] },
      { name: 'Q2', months: [3, 4, 5] },
      { name: 'Q3', months: [6, 7, 8] },
      { name: 'Q4', months: [9, 10, 11] },
    ];
    const year = new Date().getFullYear();
    return quarters.map(({ name, months }) => {
      const prefixes = months.map(m => `${year}-${String(m + 1).padStart(2, '0')}`);
      const quarterLeads = leads.filter(l => prefixes.some(p => l.createdAt && l.createdAt.startsWith(p)));
      const converted = quarterLeads.filter(l => l.status === 'Closed Won').length;
      const lost = quarterLeads.filter(l => l.status === 'Closed Lost').length;
      return { name, converted, lost };
    });
  })();

  // --- Lead source pie chart ---
  const sourceMap = {};
  leads.forEach(l => {
    const src = l.leadSource || 'Organic';
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  });
  const sourceData = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));
  const finalSourceData = sourceData.length > 0 ? sourceData : [
    { name: 'Organic', value: 0 }, { name: 'Social', value: 0 },
    { name: 'Referral', value: 0 }, { name: 'Direct', value: 0 },
  ];

  // --- Attendance summary ---
  const attendanceSummary = (() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const label = MONTHS[d.getMonth()];
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthRecords = attendances.filter(a => a.date && a.date.startsWith(prefix));
      const present = monthRecords.filter(a => a.status === 'Present').length;
      const late = monthRecords.filter(a => a.status === 'Late').length;
      const absent = monthRecords.filter(a => a.status === 'Absent').length;
      result.push({ name: label, present, late, absent });
    }
    return result;
  })();

  // --- Summary stat cards ---
  const totalRevenue = deals.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const closedWon = leads.filter(l => l.status === 'Closed Won').length;
  const conversionRate = leads.length > 0 ? ((closedWon / leads.length) * 100).toFixed(1) : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-full text-white">Loading Reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Reports & Analytics</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">Live performance metrics from real CRM data.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center px-4 py-2 bg-white/5 border border-[var(--color-border)] hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors">
            <Filter className="w-4 h-4 mr-2" /> Filter Data
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: leads.length, color: 'text-blue-400' },
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'text-teal-400' },
          { label: 'Total Clients', value: clients.length, color: 'text-purple-400' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, color: 'text-yellow-400' },
        ].map(({ label, value, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
            <p className="text-[var(--color-text-secondary)] text-xs mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Area Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-6">Revenue (Last 6 Months)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--color-text-secondary)" tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)', borderRadius: '8px' }} formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-accent)" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Lead Conversion Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-6">Lead Conversion (Quarterly)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadConversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--color-text-secondary)" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-secondary)' }} />
                <Bar dataKey="converted" name="Closed Won" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lost" name="Closed Lost" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Lead Source Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-6">Lead Sources</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={finalSourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {finalSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Attendance Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-6">Attendance Overview (Last 6 Months)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceSummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--color-text-secondary)" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-secondary)' }} />
                <Line type="monotone" dataKey="present" name="Present" stroke="#14B8A6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="late" name="Late" stroke="#F59E0B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="absent" name="Absent" stroke="#EF4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Lead Status Breakdown Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="p-5 border-b border-[var(--color-border)]">
          <h3 className="text-base font-bold text-white">Lead Status Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5 text-[var(--color-text-secondary)] text-xs uppercase">
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Count</th>
                <th className="px-5 py-3 font-medium">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {['New','Contacted','Qualified','Proposal Sent','Closed Won','Closed Lost'].map(status => {
                const count = leads.filter(l => l.status === status).length;
                const pct = leads.length > 0 ? ((count / leads.length) * 100).toFixed(1) : '0.0';
                const colors = {
                  'New': 'text-blue-400', 'Contacted': 'text-yellow-400', 'Qualified': 'text-purple-400',
                  'Proposal Sent': 'text-indigo-400', 'Closed Won': 'text-teal-400', 'Closed Lost': 'text-red-400'
                };
                return (
                  <tr key={status} className="hover:bg-white/5 transition-colors">
                    <td className={`px-5 py-3 font-medium ${colors[status]}`}>{status}</td>
                    <td className="px-5 py-3 text-white">{count}</td>
                    <td className="px-5 py-3 text-[var(--color-text-secondary)]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/5 rounded-full h-1.5 max-w-[100px]">
                          <div className="h-1.5 rounded-full bg-[var(--color-accent)]" style={{ width: `${pct}%` }} />
                        </div>
                        <span>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Reports;
