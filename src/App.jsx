import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Leads from './pages/Leads';
import Tasks from './pages/Tasks';
import MyTasks from './pages/MyTasks';
import Employees from './pages/Employees';
import EmployeeAccounts from './pages/EmployeeAccounts';
import FollowUp from './pages/FollowUp';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import WorkUpdate from './pages/WorkUpdate';
import SalesHistory from './pages/SalesHistory';

// Protected Route Component to enforce login
const ProtectedRoute = ({ children }) => {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Protected Route for Admin only
const AdminProtectedRoute = ({ children }) => {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }
  try {
    const user = JSON.parse(userInfo);
    if (user.role !== 'Admin') {
      return <Navigate to="/dashboard" replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Protected Route for Leads access (Admin or Marketing)
const MarketingProtectedRoute = ({ children }) => {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }
  try {
    const user = JSON.parse(userInfo);
    const hasLeadsAccess = user.role === 'Admin' || user.role === 'Marketing';
    if (!hasLeadsAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Protected Route for Developer access
const DeveloperProtectedRoute = ({ children }) => {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }
  try {
    const user = JSON.parse(userInfo);
    const hasDeveloperAccess = user.role === 'Admin' || user.role === 'Developer';
    if (!hasDeveloperAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// If already logged in, prevent accessing auth pages
const PublicRoute = ({ children }) => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Modules visible to ALL logged-in employees */}
          <Route path="leads"       element={<ProtectedRoute><Leads /></ProtectedRoute>} />
          <Route path="clients"     element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="projects"    element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="follow-up"   element={<ProtectedRoute><FollowUp /></ProtectedRoute>} />
          <Route path="work-update" element={<ProtectedRoute><WorkUpdate /></ProtectedRoute>} />
          <Route path="attendance"  element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="my-tasks"    element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
          <Route path="employees"   element={<ProtectedRoute><Employees /></ProtectedRoute>} />

          {/* Admin-only modules */}
          <Route path="history"           element={<AdminProtectedRoute><SalesHistory /></AdminProtectedRoute>} />
          <Route path="tasks"             element={<AdminProtectedRoute><Tasks /></AdminProtectedRoute>} />
          <Route path="employee-accounts" element={<AdminProtectedRoute><EmployeeAccounts /></AdminProtectedRoute>} />
          <Route path="reports"           element={<AdminProtectedRoute><Reports /></AdminProtectedRoute>} />
          <Route path="settings"          element={<AdminProtectedRoute><Settings /></AdminProtectedRoute>} />
        </Route>

        {/* Catch all route - redirect to login if not found */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
