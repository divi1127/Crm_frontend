import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import FaceLoginVerify from '../components/FaceLoginVerify';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFaceLogin, setShowFaceLogin] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      if (data.role === 'Admin') {
        localStorage.setItem('userInfo', JSON.stringify(data));
        navigate('/dashboard');
        return;
      }
      setPendingUser(data);
      setShowFaceLogin(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-primary-bg)] relative overflow-hidden p-4">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[var(--color-accent)]/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 md:p-10 relative overflow-hidden z-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[var(--color-accent)] rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(20,184,166,0.4)]">
              <span className="text-white font-bold text-2xl tracking-tighter">C</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-[var(--color-text-secondary)] text-sm">Sign in to continue to your CRM dashboard.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Quick Login Options */}
          <div className="mb-6 bg-white/5 p-3 rounded-xl border border-[var(--color-border)]">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-2 text-center">
              Select User Type for Login
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@crm.io');
                  setPassword('password123');
                }}
                className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  email === 'admin@crm.io'
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-md shadow-[var(--color-accent)]/20'
                    : 'bg-white/5 text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-white/10 hover:text-white'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('marketing@crm.io');
                  setPassword('password123');
                }}
                className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  email === 'marketing@crm.io'
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-md shadow-[var(--color-accent)]/20'
                    : 'bg-white/5 text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-white/10 hover:text-white'
                }`}
              >
                Marketing Emp
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('developer@crm.io');
                  setPassword('password123');
                }}
                className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  email === 'developer@crm.io'
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-md shadow-[var(--color-accent)]/20'
                    : 'bg-white/5 text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-white/10 hover:text-white'
                }`}
              >
                Developer Emp
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white ml-1">Username or Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] pointer-events-none" />
                <input 
                  type="text" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter username or email" 
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-[var(--color-border)] rounded-xl text-white placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-white">Password</label>
                <Link to="/forgot-password" className="text-xs text-[var(--color-accent)] hover:text-white transition-colors">Forgot Password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] pointer-events-none" />
                <input 
                  type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-10 pr-10 py-3 bg-white/5 border border-[var(--color-border)] rounded-xl text-white placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-1">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded border-[var(--color-border)] bg-white/5 checked:bg-[var(--color-accent)] checked:border-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-0 focus:ring-1 transition-all" />
              <label htmlFor="remember" className="text-sm text-[var(--color-text-secondary)]">Remember me for 30 days</label>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] transition-all active:scale-[0.98] mt-2 disabled:opacity-50">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          {pendingUser && showFaceLogin && (
            <div className="mt-4 p-4 rounded-xl border border-[var(--color-border)] bg-white/5 text-sm text-[var(--color-text-secondary)]">
              Credentials accepted. Face verification is required before accessing the dashboard.
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Don't have an account? <Link to="/register" className="text-[var(--color-accent)] hover:text-white font-medium transition-colors">Register Now</Link>
            </p>
          </div>
        </div>
      </motion.div>
      {showFaceLogin && pendingUser && (
        <FaceLoginVerify
          userInfo={pendingUser}
          onClose={() => {
            setShowFaceLogin(false);
            setPendingUser(null);
          }}
          onSuccess={() => {
            localStorage.setItem('userInfo', JSON.stringify(pendingUser));
            setPendingUser(null);
            setShowFaceLogin(false);
            navigate('/dashboard');
          }}
        />
      )}
    </div>
  );
};

export default Login;
