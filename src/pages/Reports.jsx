import React from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

const Reports = () => {
  const revData = [
    { name: 'Jan', revenue: 4000 }, { name: 'Feb', revenue: 3000 }, { name: 'Mar', revenue: 2000 },
    { name: 'Apr', revenue: 2780 }, { name: 'May', revenue: 1890 }, { name: 'Jun', revenue: 2390 },
  ];

  const leadData = [
    { name: 'Q1', converted: 40, lost: 24 }, { name: 'Q2', converted: 30, lost: 13 },
    { name: 'Q3', converted: 20, lost: 48 }, { name: 'Q4', converted: 27, lost: 39 },
  ];

  const sourceData = [
    { name: 'Organic', value: 400 }, { name: 'Social', value: 300 },
    { name: 'Referral', value: 300 }, { name: 'Direct', value: 200 },
  ];
  const COLORS = ['#14B8A6', '#3B82F6', '#8B5CF6', '#F59E0B'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Reports & Analytics</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">Detailed performance metrics and data exports.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center px-4 py-2 bg-white/5 border border-[var(--color-border)] hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Filter Data
          </button>
          <button className="flex items-center px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(20,184,166,0.3)]">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Area Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-6">Revenue Overview</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{fontSize: 12}} />
                <YAxis stroke="var(--color-text-secondary)" tick={{fontSize: 12}} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-accent)" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Lead Conversion Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-6">Lead Conversion (Quarterly)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{fontSize: 12}} />
                <YAxis stroke="var(--color-text-secondary)" tick={{fontSize: 12}} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }} />
                <Legend />
                <Bar dataKey="converted" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lost" fill="#EF4444" radius={[4, 4, 0, 0]} />
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
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Sales Growth Line Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-6">Sales Growth Projection</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{fontSize: 12}} />
                <YAxis stroke="var(--color-text-secondary)" tick={{fontSize: 12}} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }} />
                <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;
