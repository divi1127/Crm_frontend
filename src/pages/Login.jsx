import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import FaceLoginVerify from '../components/FaceLoginVerify';
import jodLogo from '../assets/jod.jpeg';

const NO_FACE_ROLES = ['HR', 'MD'];

const slides = [
  {
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop",
    title: "Scalable Intelligence",
    subtitle: "Enterprise Infrastructure",
    description: "Empowering IT professionals with precision tools for seamless resource management."
  },
  {
    image: "https://i.pinimg.com/736x/68/59/f7/6859f7eed8ed4c097d2b29d9fc8b9d88.jpg",
    title: "Secure Future",
    subtitle: "Threat Management",
    description: "Defense-grade security protocols ensuring your data remains isolated and protected."
  },
  {
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2670&auto=format&fit=crop",
    title: "Global Connectivity",
    subtitle: "Cloud Integration",
    description: "Seamlessly integrate your local infrastructure with distributed cloud networks."
  }
];

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFaceLogin, setShowFaceLogin] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Admin');
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      if (data.role === 'Admin' || NO_FACE_ROLES.includes(data.role)) {
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
    <div className="min-h-screen flex bg-[#03060b] font-sans selection:bg-violet-500/30 selection:text-violet-200 overflow-hidden">
      
      {/* ── Left Hero Panel (Cinematic Tech Section with Carousel) ── */}
      <div className="hidden lg:flex w-[50%] relative overflow-hidden p-16 flex-col">
        {/* Carousel Background Images */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 z-0"
          >
            <img 
              src={slides[currentSlide].image} 
              alt={slides[currentSlide].title} 
              className="w-full h-full object-cover brightness-[0.4] contrast-[1.2]"
            />
          </motion.div>
        </AnimatePresence>

        {/* Global Overlays */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#03060b] via-transparent to-transparent opacity-90" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-transparent via-transparent to-[#03060b]/40" />
        <div className="absolute inset-0 z-[1] bg-violet-950/10 mix-blend-multiply" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center p-2.5 shadow-2xl overflow-hidden group">
              <img src={jodLogo} alt="Logo" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 rounded-full" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black text-2xl tracking-tighter italic leading-none">JOD TECH</span>
              <span className="text-violet-400/60 text-[10px] font-bold tracking-[0.2em] uppercase">Enterprise CRM</span>
            </div>
          </motion.div>
        </div>

        {/* Content Section (Positioned higher with more spacing from logo) */}
        <div className="relative z-10 mt-32 max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${currentSlide}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-violet-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-4 block">
                {slides[currentSlide].subtitle}
              </span>
              <h2 className="text-5xl xl:text-7xl font-bold text-white leading-[1.05] mb-6 tracking-tight">
                {slides[currentSlide].title.split(" ").map((word, i) => (
                  <span key={i} className={i === 1 ? "text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400" : ""}>
                    {word}{" "}
                  </span>
                ))},<br />
                <span className="text-white">Secure Future.</span>
              </h2>
              <p className="text-slate-400 text-lg mb-10 font-medium leading-relaxed max-w-lg">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Indicators */}
          <div className="flex items-center gap-3">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1 transition-all duration-500 rounded-full ${
                  currentSlide === i 
                    ? "w-12 bg-gradient-to-r from-violet-500 to-indigo-500 shadow-[0_0_15px_rgba(139,92,246,0.6)]" 
                    : "w-2 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form Panel (Premium Minimalist Section) ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 relative overflow-hidden bg-[#03060b]">
        {/* Dynamic Background Glows */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/5 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/5 blur-[120px] rounded-full" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[400px] relative z-10"
        >
          <header className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Account Login</h1>
            <p className="text-slate-500 text-sm font-medium">
              Enterprise access for authorized personnel only.
            </p>
          </header>

          {/* Quick Access Toggles (Centered) */}
          <div className="grid grid-cols-3 gap-2 mb-10 p-1.5 bg-white/5 rounded-2xl border border-white/5 mx-auto w-fit">
            {['Admin', 'Marketing', 'Developer', 'HR', 'MD', 'Employee'].map((label) => {
              const emailMap = { 
                Admin: 'admin@crm.io', 
                Marketing: 'marketing@crm.io', 
                Developer: 'developer@crm.io',
                HR: 'hr@crm.io',
                MD: 'md@crm.io',
                Employee: 'employee@crm.io'
              };
              const isSelected = activeTab === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => { 
                    setEmail(emailMap[label]); 
                    setPassword('password123'); 
                    setActiveTab(label); 
                  }}
                  className={`px-5 py-2 rounded-[12px] text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    isSelected 
                      ? 'bg-violet-600/20 text-violet-400 border border-violet-500/20 shadow-inner' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {error && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative group">
              <input 
                type="text" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or Username" 
                className="w-full px-5 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-all text-sm"
              />
            </div>

            <div className="relative group">
              <input 
                type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 characters)" 
                className="w-full px-5 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-all text-sm"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 hover:text-white p-2 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="remember" className="w-4 h-4 rounded-lg bg-white/5 border-white/10 text-violet-600 focus:ring-violet-500/30" />
                <label htmlFor="remember" className="text-xs text-slate-500 font-medium cursor-pointer">Remember device</label>
              </div>
              <Link to="/forgot-password" title="Recover your account" className="text-xs text-violet-400 font-bold hover:text-violet-300 transition-colors">Recovery Key?</Link>
            </div>

            <button 
              disabled={loading}
              className="w-full py-4 mt-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-[13px] rounded-2xl shadow-2xl shadow-violet-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Establish Connection <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <footer className="mt-12 pt-8 border-t border-white/5">
            <p className="text-[10px] text-slate-600 text-center uppercase tracking-widest font-bold">
              © 2026 JOD TECH • <a href="https://www.jodtech.in/" target="_blank" rel="noopener noreferrer" className="text-violet-400/80 hover:text-violet-400 hover:underline transition-all">https://www.jodtech.in/</a>
            </p>
          </footer>
        </motion.div>
      </div>

      {showFaceLogin && pendingUser && (
        <FaceLoginVerify
          userInfo={pendingUser}
          onClose={() => { setShowFaceLogin(false); setPendingUser(null); }}
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

