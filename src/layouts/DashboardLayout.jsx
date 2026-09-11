import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Clock, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const AUTO_LOGOUT_HOUR = 18;
const AUTO_LOGOUT_MINUTE = 30;

const getIST = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 60 * 60 * 1000);
};

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const doAutoLogout = useCallback(async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (userInfo && userInfo.role !== 'Admin' && userInfo.role !== 'HR' && userInfo.role !== 'MD') {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await api.post('/api/attendances/checkout', {}, config);
      }
    } catch {
      // No check-in exists today or an error occurred — proceed with logout
    }
    localStorage.removeItem('userInfo');
    navigate('/login');
  }, [navigate]);

  // Auto-logout timer for 6:30 PM IST
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo) return;
    if (['Admin', 'HR', 'MD'].includes(userInfo.role)) return;

    const calcMsUntil = (targetHour, targetMin) => {
      const ist = getIST();
      const target = new Date(ist);
      target.setHours(targetHour, targetMin, 0, 0);
      let diff = target.getTime() - ist.getTime();
      if (diff <= 0) {
        diff += 24 * 60 * 60 * 1000;
      }
      return diff;
    };

    const msUntilLogout = calcMsUntil(AUTO_LOGOUT_HOUR, AUTO_LOGOUT_MINUTE);
    const logoutTimer = setTimeout(doAutoLogout, msUntilLogout);

    const msUntilWarning = calcMsUntil(AUTO_LOGOUT_HOUR, AUTO_LOGOUT_MINUTE - 5);
    const warningTimer = setTimeout(() => {
      setToast('Session ends at 6:30 PM. Please save your work.');
    }, msUntilWarning);

    return () => {
      clearTimeout(logoutTimer);
      clearTimeout(warningTimer);
    };
  }, [doAutoLogout]);

  // Check-in alert toast — show when the user already checked in today
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo) return;
    if (['Admin', 'HR', 'MD'].includes(userInfo.role)) return;

    // Skip alert on the very first check-in of this session (fresh login)
    if (sessionStorage.getItem('skipCheckinAlert')) {
      sessionStorage.removeItem('skipCheckinAlert');
      return;
    }

    const fetchCheckIn = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await api.get('/api/attendances', config);
        const today = getIST().toISOString().slice(0, 10);
        const todayRecord = data.find(a => a.date === today && a.checkIn);
        if (todayRecord) {
          setToast(`Already checked in today at ${todayRecord.checkIn} IST`);
        }
      } catch {
        // Ignore fetch errors — the alert is non-critical
      }
    };
    fetchCheckIn();
  }, []);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-primary-bg)]">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[var(--color-secondary-bg)] border border-[var(--color-accent)]/30 rounded-xl shadow-2xl shadow-black/40 max-w-sm">
          <div className="p-2 rounded-lg bg-[var(--color-accent)]/10">
            <Clock className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
          <p className="text-sm text-white font-medium flex-1">{toast}</p>
          <button onClick={() => setToast(null)} className="p-1 text-[var(--color-text-secondary)] hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
