import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Plus, Users, CheckSquare, Briefcase, Sun, Moon, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const Navbar = ({ onMenuClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isAdmin, setIsAdmin] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo?.role === 'Admin') setIsAdmin(true);
  }, []);

  // Apply theme to document element
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch data to build dynamic notifications based on live DB state!
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = userInfo ? { headers: { Authorization: `Bearer ${userInfo.token}` } } : {};
        
        // Fetch dashboard metrics & recent items
        const { data } = await api.get('/api/dashboard', config);
        
        const list = [];
        
        // 1. Generate alerts for recent leads
        if (data.recentActivities && data.recentActivities.length > 0) {
          data.recentActivities.slice(0, 3).forEach((lead, i) => {
            list.push({
              id: `lead-${lead.id}-${i}`,
              text: `New Lead: "${lead.name}" registered from ${lead.leadSource || 'Organic'}.`,
              time: 'Just now',
              read: false,
              type: 'lead'
            });
          });
        }

        // 2. Generate alerts for high/todo tasks
        if (data.stats && data.stats.pendingTasks > 0) {
          list.push({
            id: 'task-pending',
            text: `You have ${data.stats.pendingTasks} pending tasks in your To-Do column.`,
            time: '1h ago',
            read: false,
            type: 'task'
          });
        }

        // 3. Fallback alerts if system is brand new
        if (list.length === 0) {
          list.push({
            id: 'welcome',
            text: 'Welcome to JOD Tech CRM! Monitor your pipeline, tasks and employee roles.',
            time: '1d ago',
            read: false,
            type: 'system'
          });
        }

        // Check if there's any saved read status in localStorage to avoid resetting
        const savedReads = JSON.parse(localStorage.getItem('readNotifications') || '[]');
        const updatedList = list.map(item => ({
          ...item,
          read: savedReads.includes(item.id)
        }));

        setNotifications(updatedList);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    fetchNotifications();
    // Refresh notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickAdd = (path) => {
    setShowDropdown(false);
    navigate(`${path}?add=true`);
  };

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('readNotifications', JSON.stringify(allIds));
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif) => {
    // Mark as read
    const savedReads = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    if (!savedReads.includes(notif.id)) {
      savedReads.push(notif.id);
      localStorage.setItem('readNotifications', JSON.stringify(savedReads));
    }
    setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
    
    // Navigate appropriately
    setShowNotifDropdown(false);
    if (notif.type === 'lead') navigate('/leads');
    if (notif.type === 'task') navigate('/tasks');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-[var(--color-border)] bg-[var(--color-secondary-bg)] z-10 sticky top-0 transition-colors duration-300">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar */}
        <div className="hidden md:flex relative group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-accent)] transition-colors" />
          <input 
            type="text" 
            placeholder="Search leads, tasks, reports..." 
            className="pl-9 pr-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-full text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] w-56 lg:w-80 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-colors"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-teal-600" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2 rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[var(--color-secondary-bg)] animate-pulse"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifDropdown && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-80 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden z-50 max-h-96 flex flex-col"
              >
                <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between bg-white/5">
                  <span className="font-bold text-[var(--color-text-primary)] text-xs">Notifications ({unreadCount} unread)</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-[var(--color-accent)] hover:text-[var(--color-text-primary)] transition-colors">Mark all read</button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]/60">
                  {notifications.map((notif) => (
                    <button 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full p-3 text-left hover:bg-white/5 transition-colors flex gap-2.5 items-start ${!notif.read ? 'bg-teal-500/5' : ''}`}
                    >
                      <div className="mt-0.5">
                        {notif.type === 'lead' ? <Users className="w-4 h-4 text-teal-400" /> : <CheckSquare className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs text-[var(--color-text-primary)] ${!notif.read ? 'font-semibold' : ''}`}>{notif.text}</p>
                        <span className="text-[10px] text-[var(--color-text-secondary)] block mt-1">{notif.time}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Add Dropdown - Admin only */}
        {isAdmin && (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="hidden sm:flex items-center justify-center px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(20,184,166,0.3)]"
            >
              <Plus className="w-4 h-4 mr-2" /> Quick Add
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <div className="py-1">
                    <button onClick={() => handleQuickAdd('/leads')} className="w-full px-4 py-2.5 text-sm text-left text-[var(--color-text-primary)] hover:bg-[var(--color-primary-bg)] flex items-center transition-colors">
                      <Users className="w-4 h-4 mr-3 text-[var(--color-accent)]" /> Add New Lead
                    </button>
                    <button onClick={() => handleQuickAdd('/tasks')} className="w-full px-4 py-2.5 text-sm text-left text-[var(--color-text-primary)] hover:bg-[var(--color-primary-bg)] flex items-center transition-colors">
                      <CheckSquare className="w-4 h-4 mr-3 text-blue-400" /> Create Task
                    </button>
                    <button onClick={() => handleQuickAdd('/employees')} className="w-full px-4 py-2.5 text-sm text-left text-[var(--color-text-primary)] hover:bg-[var(--color-primary-bg)] flex items-center transition-colors">
                      <Briefcase className="w-4 h-4 mr-3 text-purple-400" /> Add Employee
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
