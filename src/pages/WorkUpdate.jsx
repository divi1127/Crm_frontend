import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, 
  CloudSun, 
  Moon, 
  Calendar, 
  RotateCcw, 
  Send, 
  Users, 
  User as UserIcon,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import axios from 'axios';

const WorkUpdate = () => {
  const [user, setUser] = useState(null);
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeTab, setActiveTab] = useState('11am'); // '11am', '3pm', '630pm'
  
  // Admin/Manager views
  const [viewMode, setViewMode] = useState('my'); // 'my' or 'team'
  const [teamUpdates, setTeamUpdates] = useState([]);
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    update11AM: '',
    update3PM: '',
    update630PM_completed: '',
    update630PM_pending: '',
    update630PM_tomorrow: '',
    update630PM_issues: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Refs for scrolling if user clicks tabs in "show all" mode
  const ref11am = useRef(null);
  const ref3pm = useRef(null);
  const ref630pm = useRef(null);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      setUser(parsed);
      // Non-admin employees are always forced to today
      const isAdminOrManager = parsed.role === 'Admin' || parsed.role === 'Manager';
      if (!isAdminOrManager) {
        setSelectedDate(today);
      }
    }
  }, []);

  // Fetch my updates when date changes
  const fetchMyUpdate = async (date) => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = userInfo ? { headers: { Authorization: `Bearer ${userInfo.token}` } } : {};
      const { data } = await axios.get(`/api/work-updates/my?date=${date}`, config);
      
      if (data) {
        setFormData({
          update11AM: data.update11AM || '',
          update3PM: data.update3PM || '',
          update630PM_completed: data.update630PM_completed || '',
          update630PM_pending: data.update630PM_pending || '',
          update630PM_tomorrow: data.update630PM_tomorrow || '',
          update630PM_issues: data.update630PM_issues || ''
        });
      } else {
        setFormData({
          update11AM: '',
          update3PM: '',
          update630PM_completed: '',
          update630PM_pending: '',
          update630PM_tomorrow: '',
          update630PM_issues: ''
        });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load daily work update.' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch team updates for Admin/Manager
  const fetchTeamUpdates = async (date) => {
    setTeamLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = userInfo ? { headers: { Authorization: `Bearer ${userInfo.token}` } } : {};
      const { data } = await axios.get(`/api/work-updates/team?date=${date}`, config);
      setTeamUpdates(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (viewMode === 'my') {
        fetchMyUpdate(selectedDate);
      } else {
        fetchTeamUpdates(selectedDate);
      }
    }
  }, [selectedDate, viewMode, user]);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear this form?')) {
      setFormData({
        update11AM: '',
        update3PM: '',
        update630PM_completed: '',
        update630PM_pending: '',
        update630PM_tomorrow: '',
        update630PM_issues: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = userInfo ? { headers: { Authorization: `Bearer ${userInfo.token}` } } : {};
      
      const payload = {
        date: selectedDate,
        ...formData
      };

      await axios.post('/api/work-updates/my', payload, config);
      setMessage({ type: 'success', text: 'Daily work update submitted successfully!' });
      
      // Auto dismiss success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit update.' });
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (section, tabName) => {
    setActiveTab(tabName);
    if (section && section.current) {
      section.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const toggleEmployeeRow = (empId) => {
    if (expandedEmployee === empId) {
      setExpandedEmployee(null);
    } else {
      setExpandedEmployee(empId);
    }
  };

  const getStatusColor = (userItem) => {
    const update = userItem.workUpdates?.[0];
    if (!update) return 'bg-red-500/10 text-red-400 border-red-500/20';
    
    // Check if partial or fully updated
    const hasMorning = !!update.update11AM;
    const hasAfternoon = !!update.update3PM;
    const hasFinal = !!update.update630PM_completed;

    if (hasMorning && hasAfternoon && hasFinal) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  };

  const getStatusLabel = (userItem) => {
    const update = userItem.workUpdates?.[0];
    if (!update) return 'Not Submitted';
    
    const hasMorning = !!update.update11AM;
    const hasAfternoon = !!update.update3PM;
    const hasFinal = !!update.update630PM_completed;

    if (hasMorning && hasAfternoon && hasFinal) return 'Fully Submitted';
    if (hasFinal) return 'End of Day Submitted';
    if (hasAfternoon) return 'Afternoon Submitted';
    if (hasMorning) return 'Morning Submitted';
    return 'Started Draft';
  };

  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';

  const handleDateChange = (e) => {
    // Only admins/managers can change the date
    if (!isAdminOrManager) return;
    setSelectedDate(e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* Header and Toggle Mode */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Daily Work Update</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">
            {viewMode === 'my' 
              ? 'Update the work you have completed today' 
              : 'Monitor daily updates submitted by your team members'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {isAdminOrManager && (
            <div className="flex bg-white/5 p-1 rounded-xl border border-[var(--color-border)]">
              <button
                onClick={() => setViewMode('my')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'my'
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:text-white'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                My Updates
              </button>
              <button
                onClick={() => setViewMode('team')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'team'
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                Team Updates
              </button>
            </div>
          )}

          {/* Date Picker */}
          <div className={`relative flex items-center bg-white/5 border rounded-xl px-3 py-2 text-white ${
            isAdminOrManager ? 'border-[var(--color-border)]' : 'border-[var(--color-border)] opacity-90'
          }`}>
            <Calendar className="w-4 h-4 text-[var(--color-text-secondary)] mr-2" />
            <span className="text-sm font-semibold mr-3">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={!isAdminOrManager ? today : undefined}
              max={!isAdminOrManager ? today : undefined}
              readOnly={!isAdminOrManager}
              className={`bg-transparent border-none text-white text-sm font-semibold outline-none focus:ring-0 ${
                isAdminOrManager ? 'cursor-pointer' : 'cursor-not-allowed pointer-events-none'
              }`}
            />
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Locked-to-today notice for regular employees */}
      {!isAdminOrManager && viewMode === 'my' && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
          <Calendar className="w-4 h-4 flex-shrink-0 text-blue-400" />
          <span>
            You can only submit your daily work update for <strong className="text-white">today ({today})</strong>. Past and future dates are not accessible.
          </span>
        </div>
      )}

      {/* RENDER VIEW MODE: MY UPDATES */}
      {viewMode === 'my' && (
        <div className="space-y-6">
          {/* Tabs Indicators matching the Mockup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => scrollToSection(ref11am, '11am')}
              className={`glass-card p-4 text-left border flex items-center justify-between transition-all cursor-pointer ${
                activeTab === '11am'
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                  : 'hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <CloudSun className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">11:00 AM Update</h4>
                  <p className="text-xs text-[var(--color-text-secondary)]">Morning Update</p>
                </div>
              </div>
              {formData.update11AM && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>}
            </button>

            <button
              onClick={() => scrollToSection(ref3pm, '3pm')}
              className={`glass-card p-4 text-left border flex items-center justify-between transition-all cursor-pointer ${
                activeTab === '3pm'
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                  : 'hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">03:00 PM Update</h4>
                  <p className="text-xs text-[var(--color-text-secondary)]">Afternoon Update</p>
                </div>
              </div>
              {formData.update3PM && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>}
            </button>

            <button
              onClick={() => scrollToSection(ref630pm, '630pm')}
              className={`glass-card p-4 text-left border flex items-center justify-between transition-all cursor-pointer ${
                activeTab === '630pm'
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                  : 'hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">06:30 PM Update</h4>
                  <p className="text-xs text-[var(--color-text-secondary)]">End of Day Update</p>
                </div>
              </div>
              {formData.update630PM_completed && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>}
            </button>
          </div>

          {/* Form container */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 11:00 AM Update Card (Blue Theme) */}
            <div 
              ref={ref11am} 
              onClick={() => setActiveTab('11am')}
              className={`glass-card p-6 border-l-4 transition-all ${
                activeTab === '11am' ? 'border-l-blue-500 scale-[1.005] bg-blue-500/[0.02]' : 'border-l-blue-500/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                  <CloudSun className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">11:00 AM Update</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">What work completed from morning till now</p>
                </div>
              </div>
              <textarea
                value={formData.update11AM}
                onChange={(e) => setFormData({ ...formData, update11AM: e.target.value })}
                placeholder="Write the work you have completed..."
                rows={4}
                className="w-full p-3 bg-white/5 border border-[var(--color-border)] rounded-xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm resize-y"
              />
              <p className="text-xs text-[var(--color-text-secondary)] mt-2 font-medium">
                Example: Login page UI completed, Database connection done
              </p>
            </div>

            {/* 03:00 PM Update Card (Yellow/Orange Theme) */}
            <div 
              ref={ref3pm} 
              onClick={() => setActiveTab('3pm')}
              className={`glass-card p-6 border-l-4 transition-all ${
                activeTab === '3pm' ? 'border-l-amber-500 scale-[1.005] bg-amber-500/[0.02]' : 'border-l-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">03:00 PM Update</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">What work completed after morning update</p>
                </div>
              </div>
              <textarea
                value={formData.update3PM}
                onChange={(e) => setFormData({ ...formData, update3PM: e.target.value })}
                placeholder="Write the work you have completed..."
                rows={4}
                className="w-full p-3 bg-white/5 border border-[var(--color-border)] rounded-xl text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm resize-y"
              />
              <p className="text-xs text-[var(--color-text-secondary)] mt-2 font-medium">
                Example: Dashboard API integrated, Fixed sidebar responsive issue
              </p>
            </div>

            {/* 06:30 PM Final Update Card (Green Theme) */}
            <div 
              ref={ref630pm} 
              onClick={() => setActiveTab('630pm')}
              className={`glass-card p-6 border-l-4 transition-all ${
                activeTab === '630pm' ? 'border-l-emerald-500 scale-[1.005] bg-emerald-500/[0.02]' : 'border-l-emerald-500/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">06:30 PM Final Update</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">Total completed works for today</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Completed Work</label>
                  <textarea
                    value={formData.update630PM_completed}
                    onChange={(e) => setFormData({ ...formData, update630PM_completed: e.target.value })}
                    placeholder="Write the work you have completed today..."
                    rows={3}
                    className="w-full p-3 bg-white/5 border border-[var(--color-border)] rounded-xl text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Pending Work</label>
                    <textarea
                      value={formData.update630PM_pending}
                      onChange={(e) => setFormData({ ...formData, update630PM_pending: e.target.value })}
                      placeholder="Write the pending work..."
                      rows={3}
                      className="w-full p-3 bg-white/5 border border-[var(--color-border)] rounded-xl text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Tomorrow Plan</label>
                    <textarea
                      value={formData.update630PM_tomorrow}
                      onChange={(e) => setFormData({ ...formData, update630PM_tomorrow: e.target.value })}
                      placeholder="Write tomorrow continuation work..."
                      rows={3}
                      className="w-full p-3 bg-white/5 border border-[var(--color-border)] rounded-xl text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm resize-y"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Issues / Blockers (if any)</label>
                  <textarea
                    value={formData.update630PM_issues}
                    onChange={(e) => setFormData({ ...formData, update630PM_issues: e.target.value })}
                    placeholder="Write any issues or blockers faced..."
                    rows={3}
                    className="w-full p-3 bg-white/5 border border-[var(--color-border)] rounded-xl text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-[var(--color-border)] transition-all cursor-pointer active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Submitting...' : 'Submit Update'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* RENDER VIEW MODE: TEAM UPDATES */}
      {viewMode === 'team' && (
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-card-bg)]/80">
            <h3 className="text-lg font-bold text-white">Employee Submissions for {formatDateLabel(selectedDate)}</h3>
            <span className="text-xs text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded-md border border-[var(--color-border)]">
              {teamUpdates.length} Total Employees
            </span>
          </div>

          {teamLoading ? (
            <div className="p-12 text-center text-white">Loading team updates...</div>
          ) : teamUpdates.length === 0 ? (
            <div className="p-12 text-center text-[var(--color-text-secondary)]">No employee accounts found in database.</div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {teamUpdates.map((item) => {
                const isExpanded = expandedEmployee === item.id;
                const update = item.workUpdates?.[0];
                return (
                  <div key={item.id} className="transition-all hover:bg-white/[0.01]">
                    
                    {/* Collapsible Header Row */}
                    <div 
                      onClick={() => toggleEmployeeRow(item.id)}
                      className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-accent)] to-blue-500 flex items-center justify-center text-white font-bold">
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--color-text-secondary)]">
                            <span className="font-medium text-[var(--color-accent)]">{item.department || 'No Dept'}</span>
                            <span>•</span>
                            <span>{item.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item)}`}>
                          {getStatusLabel(item)}
                        </span>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-[var(--color-text-secondary)]" /> : <ChevronDown className="w-5 h-5 text-[var(--color-text-secondary)]" />}
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {isExpanded && (
                      <div className="px-5 pb-6 pt-2 bg-black/15 border-t border-[var(--color-border)]/50 space-y-4">
                        {!update ? (
                          <div className="p-6 text-center rounded-xl bg-white/5 border border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm">
                            No daily update logs found for {item.name} on this date.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            
                            {/* 11:00 AM Update */}
                            <div className="bg-blue-500/[0.02] border border-blue-500/20 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-3 text-blue-400">
                                <CloudSun className="w-4.5 h-4.5" />
                                <h5 className="font-bold text-sm">11:00 AM Update</h5>
                              </div>
                              <p className="text-sm text-white whitespace-pre-line leading-relaxed min-h-[60px]">
                                {update.update11AM || <span className="text-[var(--color-text-secondary)] italic text-xs">No entry</span>}
                              </p>
                            </div>

                            {/* 03:00 PM Update */}
                            <div className="bg-amber-500/[0.02] border border-amber-500/20 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-3 text-amber-400">
                                <Sun className="w-4.5 h-4.5" />
                                <h5 className="font-bold text-sm">03:00 PM Update</h5>
                              </div>
                              <p className="text-sm text-white whitespace-pre-line leading-relaxed min-h-[60px]">
                                {update.update3PM || <span className="text-[var(--color-text-secondary)] italic text-xs">No entry</span>}
                              </p>
                            </div>

                            {/* 06:30 PM Final Update */}
                            <div className="bg-emerald-500/[0.02] border border-emerald-500/20 rounded-xl p-4 lg:col-span-3 space-y-4">
                              <div className="flex items-center gap-2 text-emerald-400 border-b border-emerald-500/10 pb-2">
                                <Moon className="w-4.5 h-4.5" />
                                <h5 className="font-bold text-sm">06:30 PM Final Update Summary</h5>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Completed Work</span>
                                  <p className="text-sm text-white whitespace-pre-line leading-relaxed">
                                    {update.update630PM_completed || <span className="text-[var(--color-text-secondary)] italic text-xs">No entry</span>}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Pending Work</span>
                                  <p className="text-sm text-white whitespace-pre-line leading-relaxed">
                                    {update.update630PM_pending || <span className="text-[var(--color-text-secondary)] italic text-xs">None</span>}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Tomorrow Plan</span>
                                  <p className="text-sm text-white whitespace-pre-line leading-relaxed">
                                    {update.update630PM_tomorrow || <span className="text-[var(--color-text-secondary)] italic text-xs">None</span>}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Issues & Blockers</span>
                                  <p className="text-sm text-white whitespace-pre-line leading-relaxed">
                                    {update.update630PM_issues || <span className="text-[var(--color-text-secondary)] italic text-xs">None</span>}
                                  </p>
                                </div>
                              </div>
                            </div>

                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default WorkUpdate;
