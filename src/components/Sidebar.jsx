import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Briefcase, 
  CalendarClock, 
  CalendarCheck,
  BarChart3,
  Settings,
  LogOut,
  X,
  Building,
  FolderKanban,
  ClipboardList,
  Shield
} from 'lucide-react';

// Admin-only nav items
const adminNavItems = [
  { path: '/dashboard',         label: 'Dashboard',         icon: LayoutDashboard },
  { path: '/leads',             label: 'Leads',             icon: Users },
  { path: '/clients',           label: 'Clients',           icon: Building },
  { path: '/projects',          label: 'Projects',          icon: FolderKanban },
  { path: '/tasks',             label: 'Task Management',   icon: CheckSquare },
  { path: '/employees',         label: 'Employees',         icon: Briefcase },
  { path: '/employee-accounts', label: 'Create Login',      icon: Shield },
  { path: '/follow-up',         label: 'Follow Up',         icon: CalendarClock },
  { path: '/work-update',       label: 'Work Update',       icon: ClipboardList },
  { path: '/attendance',        label: 'Attendance',        icon: CalendarCheck },
  { path: '/reports',           label: 'Reports',           icon: BarChart3 },
  { path: '/settings',          label: 'Settings',          icon: Settings },
];

// Employee (Developer / Marketing) nav items — all employees see all modules
const employeeNavItems = [
  { path: '/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { path: '/my-tasks',    label: 'My Tasks',     icon: CheckSquare },
  { path: '/leads',       label: 'Leads',        icon: Users },
  { path: '/clients',     label: 'Clients',      icon: Building },
  { path: '/projects',    label: 'Projects',     icon: FolderKanban },
  { path: '/follow-up',   label: 'Follow Up',    icon: CalendarClock },
  { path: '/work-update', label: 'Work Update',  icon: ClipboardList },
  { path: '/attendance',  label: 'Attendance',   icon: CalendarCheck },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [user, setUser] = useState({ name: 'User', role: 'Developer' });
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  }, []);

  // Show correct nav depending on role
  const isAdmin = user.role === 'Admin';
  // All employees get all employee modules
  const filteredNavItems = isAdmin ? adminNavItems : employeeNavItems;

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  return (
    <div 
      className={`fixed md:relative z-40 flex flex-col h-full bg-[var(--color-secondary-bg)] border-r border-[var(--color-border)] transition-all duration-300 ${
        isOpen 
          ? 'translate-x-0 w-64' 
          : '-translate-x-full md:translate-x-0 w-0 md:w-20 overflow-hidden'
      }`}
    >
      <div className="flex items-center justify-between p-4 h-16 border-b border-[var(--color-border)]">
        {isOpen && (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">CRM.io</span>
            </div>
            
            {/* Close sidebar button visible on mobile when open */}
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 md:hidden text-[var(--color-text-secondary)] hover:text-white rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {!isOpen && (
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] mx-auto flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleLinkClick}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${isActive 
                ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' 
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card-bg)] hover:text-white'
              }
            `}
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 ${isOpen ? '' : 'mx-auto'}`} />
            {isOpen && <span className="font-medium">{item.label}</span>}
            
            {/* Tooltip for collapsed state */}
            {!isOpen && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}

        {/* Role Badge + Panel Label */}
        {isOpen && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <div className="px-3 py-2 bg-white/5 border border-[var(--color-border)] rounded-lg text-center">
              <p className="text-xs text-[var(--color-text-secondary)] mb-1">
                {user.role === 'Admin' ? '🛡️ Admin Panel' : '👤 Employee Panel'}
              </p>
              <p className={`text-xs font-bold px-2 py-1 rounded ${
                user.role === 'Admin'
                  ? 'bg-red-500/20 text-red-400'
                  : user.role === 'Developer'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-purple-500/20 text-purple-400'
              }`}>
                {user.role}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer User Profile & Logout */}
      <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between">
         <div className="flex items-center gap-3 flex-1 overflow-hidden">
           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-accent)] to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
             {getInitials(user.name)}
           </div>
           {isOpen && (
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-medium text-white truncate">{user.name}</p>
               <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.role}</p>
             </div>
           )}
         </div>
         {isOpen && (
           <button 
             onClick={handleLogout}
             title="Logout"
             className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-red-400 transition-colors flex-shrink-0"
           >
             <LogOut className="w-5 h-5" />
           </button>
         )}
      </div>
      {!isOpen && (
         <button 
           onClick={handleLogout}
           title="Logout"
           className="p-4 w-full border-t border-[var(--color-border)] flex justify-center text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-red-400 transition-colors"
         >
           <LogOut className="w-5 h-5" />
         </button>
      )}
    </div>
  );
};

export default Sidebar;
