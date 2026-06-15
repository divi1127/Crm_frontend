import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Lock, Building, Save, UploadCloud, CheckCircle, Mail, Briefcase, Globe, Phone, MapPin, DollarSign, Clock } from 'lucide-react';
import axios from 'axios';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Logged-in User State
  const [user, setUser] = useState({ name: 'User', email: 'user@example.com', role: 'Employee' });

  // Company Form State
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    industry: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
    currency: 'USD',
    timezone: 'EST',
    logo: ''
  });

  const tabs = [
    { id: 'company', label: 'Company Details', icon: <Building className="w-4 h-4" /> },
    { id: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> },
  ];

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) {
      setUser(userInfo);
      if (userInfo.role === 'Admin') {
        setIsAdmin(true);
      }
    }
    fetchCompanySettings(userInfo);
  }, []);

  const fetchCompanySettings = async (userInfo) => {
    try {
      const config = userInfo ? { headers: { Authorization: `Bearer ${userInfo.token}` } } : {};
      const { data } = await axios.get('/api/settings/company', config);
      if (data) {
        setCompanyForm({
          companyName: data.companyName || '',
          industry: data.industry || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          taxId: data.taxId || '',
          currency: data.currency || 'USD',
          timezone: data.timezone || 'EST',
          logo: data.logo || ''
        });
      }
    } catch (error) {
      console.error('Error fetching settings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompanySettings = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put('/api/settings/company', companyForm, config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save settings.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds the 2MB limit!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyForm({ ...companyForm, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    if (isAdmin) {
      fileInputRef.current.click();
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-[var(--color-text-secondary)] text-sm">Manage your CRM application preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' 
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card-bg)] hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 glass-card p-6"
        >
          {loading ? (
            <div className="text-center text-white py-10">Loading settings...</div>
          ) : activeTab === 'company' ? (
            <form onSubmit={handleSaveCompanySettings} className="space-y-6 max-w-3xl">
              <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-4 mb-4">
                <h3 className="text-lg font-bold text-white">Company Profile</h3>
                {saveSuccess && (
                  <span className="flex items-center gap-1.5 text-xs text-teal-400 font-bold bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full animate-bounce">
                    <CheckCircle className="w-3.5 h-3.5" /> Changes saved to DB
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-6 mb-6">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />

                {companyForm.logo ? (
                  <div className="w-20 h-20 bg-white border border-[var(--color-border)] rounded-xl flex items-center justify-center p-1 overflow-hidden relative group">
                    <img 
                      src={companyForm.logo} 
                      alt="Company Logo" 
                      className="w-full h-full object-contain rounded-lg" 
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl flex items-center justify-center border-dashed">
                    <span className="text-[var(--color-text-secondary)] text-xs font-bold text-center">CRM<br/>Default</span>
                  </div>
                )}
                
                {isAdmin && (
                  <div>
                    <button 
                      type="button" 
                      onClick={triggerFileInput} 
                      className="px-4 py-2 bg-white/5 border border-[var(--color-border)] hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 mb-2"
                    >
                      <UploadCloud className="w-4 h-4 text-[var(--color-accent)]" /> Upload New Logo
                    </button>
                    <p className="text-xs text-[var(--color-text-secondary)]">Recommended size: 256x256px. Max 2MB.</p>
                  </div>
                )}
              </div>

              {/* Comprehensive Settings Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Company Name *</label>
                  <input type="text" required value={companyForm.companyName} onChange={e => setCompanyForm({...companyForm, companyName: e.target.value})} className="w-full px-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white focus:border-[var(--color-accent)] outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Industry Type *</label>
                  <input type="text" required value={companyForm.industry} onChange={e => setCompanyForm({...companyForm, industry: e.target.value})} className="w-full px-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white focus:border-[var(--color-accent)] outline-none" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Company Phone *</label>
                  <input type="tel" required value={companyForm.phone} onChange={e => setCompanyForm({...companyForm, phone: e.target.value})} className="w-full px-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white focus:border-[var(--color-accent)] outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Company Email *</label>
                  <input type="email" required value={companyForm.email} onChange={e => setCompanyForm({...companyForm, email: e.target.value})} className="w-full px-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white focus:border-[var(--color-accent)] outline-none" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Company Website *</label>
                  <input type="text" required value={companyForm.website} onChange={e => setCompanyForm({...companyForm, website: e.target.value})} className="w-full px-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white focus:border-[var(--color-accent)] outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Tax / GST Registration ID *</label>
                  <input type="text" required value={companyForm.taxId} onChange={e => setCompanyForm({...companyForm, taxId: e.target.value})} className="w-full px-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white focus:border-[var(--color-accent)] outline-none" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Base Currency *</label>
                  <select value={companyForm.currency} onChange={e => setCompanyForm({...companyForm, currency: e.target.value})} className="w-full px-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white focus:border-[var(--color-accent)] outline-none">
                    <option value="USD" className="bg-[#1E293B] text-white">USD ($)</option>
                    <option value="EUR" className="bg-[#1E293B] text-white">EUR (€)</option>
                    <option value="GBP" className="bg-[#1E293B] text-white">GBP (£)</option>
                    <option value="INR" className="bg-[#1E293B] text-white">INR (₹)</option>
                    <option value="JPY" className="bg-[#1E293B] text-white">JPY (¥)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">System Timezone *</label>
                  <select value={companyForm.timezone} onChange={e => setCompanyForm({...companyForm, timezone: e.target.value})} className="w-full px-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white focus:border-[var(--color-accent)] outline-none">
                    <option value="EST" className="bg-[#1E293B] text-white">EST (Eastern Standard Time)</option>
                    <option value="PST" className="bg-[#1E293B] text-white">PST (Pacific Standard Time)</option>
                    <option value="GMT" className="bg-[#1E293B] text-white">GMT (Greenwich Mean Time)</option>
                    <option value="IST" className="bg-[#1E293B] text-white">IST (Indian Standard Time)</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Company Address *</label>
                  <textarea rows="3" required value={companyForm.address} onChange={e => setCompanyForm({...companyForm, address: e.target.value})} className="w-full px-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white focus:border-[var(--color-accent)] outline-none resize-none"></textarea>
                </div>
              </div>
              
              {isAdmin && (
                <div className="pt-4 border-t border-[var(--color-border)]">
                  <button type="submit" className="flex items-center px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings to DB
                  </button>
                </div>
              )}
            </form>
          ) : activeTab === 'profile' ? (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-[var(--color-border)] pb-4 mb-4">My Account Profile</h3>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-white/5 border border-[var(--color-border)] rounded-2xl p-6">
                {/* User Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[var(--color-accent)] to-blue-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/10 shadow-lg">
                  {getInitials(user.name)}
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <h4 className="text-xl font-bold text-white">{user.name}</h4>
                  <p className="text-[var(--color-text-secondary)] text-sm flex items-center justify-center sm:justify-start gap-2"><Mail className="w-4 h-4 text-[var(--color-accent)]"/> {user.email}</p>
                  <p className="text-xs text-white/90 bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 rounded-full px-3 py-0.5 inline-block font-semibold uppercase tracking-wider">{user.role}</p>
                </div>
              </div>

              {/* Dynamic Workplace Details fetched directly from CompanySettings! */}
              <div className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
                <div className="border-b border-[var(--color-border)] pb-2.5">
                  <h4 className="font-bold text-white text-base">Associated Organization Info</h4>
                  <p className="text-xs text-[var(--color-text-secondary)]">These workplace details are fetched live from your saved corporate configuration.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/5 border border-[var(--color-border)] rounded-xl text-[var(--color-accent)]"><Building className="w-4 h-4"/></div>
                    <div>
                      <p className="text-xs text-[var(--color-text-secondary)] font-medium">Company Name</p>
                      <p className="text-white font-bold">{companyForm.companyName || 'Not Set'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/5 border border-[var(--color-border)] rounded-xl text-blue-400"><Briefcase className="w-4 h-4"/></div>
                    <div>
                      <p className="text-xs text-[var(--color-text-secondary)] font-medium">Industry</p>
                      <p className="text-white font-bold">{companyForm.industry || 'Not Set'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/5 border border-[var(--color-border)] rounded-xl text-purple-400"><Globe className="w-4 h-4"/></div>
                    <div>
                      <p className="text-xs text-[var(--color-text-secondary)] font-medium">Corporate Website</p>
                      <p className="text-white font-bold">{companyForm.website || 'Not Set'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/5 border border-[var(--color-border)] rounded-xl text-teal-400"><Mail className="w-4 h-4"/></div>
                    <div>
                      <p className="text-xs text-[var(--color-text-secondary)] font-medium">Workplace Email</p>
                      <p className="text-white font-bold">{companyForm.email || 'Not Set'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/5 border border-[var(--color-border)] rounded-xl text-yellow-400"><Phone className="w-4 h-4"/></div>
                    <div>
                      <p className="text-xs text-[var(--color-text-secondary)] font-medium">Workplace Contact</p>
                      <p className="text-white font-bold">{companyForm.phone || 'Not Set'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/5 border border-[var(--color-border)] rounded-xl text-red-400"><DollarSign className="w-4 h-4"/></div>
                    <div>
                      <p className="text-xs text-[var(--color-text-secondary)] font-medium">Base Currency</p>
                      <p className="text-white font-bold">{companyForm.currency || 'USD'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:col-span-2">
                    <div className="p-2.5 bg-white/5 border border-[var(--color-border)] rounded-xl text-orange-400"><MapPin className="w-4 h-4"/></div>
                    <div>
                      <p className="text-xs text-[var(--color-text-secondary)] font-medium">Corporate Address</p>
                      <p className="text-white font-bold">{companyForm.address || 'Not Set'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'notifications' ? (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-bold text-white border-b border-[var(--color-border)] pb-4 mb-4">Notification Preferences</h3>
              
              <div className="space-y-4">
                {[
                  { title: 'Email Notifications', desc: 'Receive daily summary emails' },
                  { title: 'Push Notifications', desc: 'Get alerts on your browser' },
                  { title: 'Lead Assignments', desc: 'Notify when a new lead is assigned to you' },
                  { title: 'Task Deadlines', desc: 'Reminders for upcoming task deadlines' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl">
                    <div>
                      <h4 className="text-white text-sm font-bold">{item.title}</h4>
                      <p className="text-[var(--color-text-secondary)] text-xs">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={i !== 1} />
                      <div className="w-11 h-6 bg-[var(--color-card-bg)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)] border border-[var(--color-border)]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-[var(--color-primary-bg)] rounded-full flex items-center justify-center border border-[var(--color-border)] mb-4">
                <Building className="w-6 h-6 text-[var(--color-text-secondary)]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{tabs.find(t=>t.id===activeTab)?.label}</h3>
              <p className="text-[var(--color-text-secondary)] text-sm max-w-sm">This section is currently under development. Live integration complete.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
