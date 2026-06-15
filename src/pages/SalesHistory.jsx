import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import api from '../utils/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const START_YEAR = 2026;

const SalesHistory = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() < START_YEAR ? START_YEAR : new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [clients, setClients] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - START_YEAR + 2 }, (_, i) => START_YEAR + i);

  useEffect(() => {
    fetchAll();
  }, [selectedYear]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      const [clientsRes, dealsRes] = await Promise.all([
        api.get('/api/clients', config),
        api.get('/api/salesdeals', config),
      ]);

      setClients(clientsRes.data);
      setDeals(dealsRes.data);

      // Build monthly data for selected year
      const monthly = MONTHS.map((month, i) => {
        const monthStr = String(i + 1).padStart(2, '0');
        const prefix = `${selectedYear}-${monthStr}`;

        const monthClients = clientsRes.data.filter(c =>
          c.createdAt && c.createdAt.startsWith(prefix)
        ).length;

        const monthRevenue = dealsRes.data
          .filter(d => d.createdAt && d.createdAt.startsWith(prefix))
          .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

        const monthDeals = dealsRes.data.filter(d =>
          d.createdAt && d.createdAt.startsWith(prefix)
        ).length;

        return { month, clients: monthClients, revenue: monthRevenue, deals: monthDeals };
      });
      setMonthlyData(monthly);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = monthlyData.reduce((s, d) => s + d.revenue, 0);
  const totalClients = monthlyData.reduce((s, d) => s + d.clients, 0);
  const totalDeals = monthlyData.reduce((s, d) => s + d.deals, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Sales & Client History</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">Monthly breakdown from {START_YEAR} onwards</p>
        </div>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-lg text-white text-sm outline-none focus:border-[var(--color-accent)]"
        >
          {years.map(y => <option key={y} value={y} className="bg-[#1E293B]">{y}</option>)}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: `${selectedYear} Revenue`, value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'text-teal-400' },
          { label: 'New Clients', value: totalClients, color: 'text-blue-400' },
          { label: 'Total Deals', value: totalDeals, color: 'text-purple-400' },
        ].map(({ label, value, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 sm:p-5">
            <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm mb-1">{label}</p>
            <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 sm:p-6">
        <h3 className="text-base font-bold text-white mb-4">Monthly Revenue — {selectedYear}</h3>
        {loading ? <div className="h-48 flex items-center justify-center text-[var(--color-text-secondary)]">Loading...</div> : (
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-text-secondary)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--color-text-secondary)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'white' }}
                  formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Clients & Deals Chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 sm:p-6">
        <h3 className="text-base font-bold text-white mb-4">Monthly Clients & Deals — {selectedYear}</h3>
        {loading ? <div className="h-48 flex items-center justify-center text-[var(--color-text-secondary)]">Loading...</div> : (
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-text-secondary)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--color-text-secondary)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'white' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-secondary)' }} />
                <Line type="monotone" dataKey="clients" stroke="#3B82F6" strokeWidth={2} dot={false} name="New Clients" />
                <Line type="monotone" dataKey="deals" stroke="#A855F7" strokeWidth={2} dot={false} name="Deals" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Monthly Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h3 className="text-base font-bold text-white">Monthly Breakdown — {selectedYear}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[400px]">
            <thead>
              <tr className="bg-white/5 text-[var(--color-text-secondary)] text-xs uppercase">
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">New Clients</th>
                <th className="px-4 py-3 font-medium">Deals</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {monthlyData.map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors text-sm">
                  <td className="px-4 py-3 text-white font-medium">{row.month} {selectedYear}</td>
                  <td className="px-4 py-3 text-blue-400">{row.clients}</td>
                  <td className="px-4 py-3 text-purple-400">{row.deals}</td>
                  <td className="px-4 py-3 text-teal-400 font-semibold">₹{row.revenue.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              <tr className="bg-white/5 text-sm font-bold">
                <td className="px-4 py-3 text-white">Total</td>
                <td className="px-4 py-3 text-blue-400">{totalClients}</td>
                <td className="px-4 py-3 text-purple-400">{totalDeals}</td>
                <td className="px-4 py-3 text-teal-400">₹{totalRevenue.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default SalesHistory;
