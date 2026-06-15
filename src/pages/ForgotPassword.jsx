import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call for reset password
    setTimeout(() => {
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-primary-bg)] relative overflow-hidden p-4">
      {/* Background decorations */}
      <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-[var(--color-accent)]/20 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 md:p-10 relative z-10">
          {!submitted ? (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-white/5 border border-[var(--color-border)] rounded-2xl mx-auto flex items-center justify-center mb-4">
                  <LockIcon className="w-6 h-6 text-[var(--color-accent)]" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-[var(--color-text-secondary)] text-sm">Enter your email address and we'll send you a link to reset your password.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] pointer-events-none" />
                    <input 
                      type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com" 
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-[var(--color-border)] rounded-xl text-white placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-3 px-4 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all active:scale-[0.98]">
                  Send Reset Link
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-500/20 border border-teal-500/30 rounded-full mx-auto flex items-center justify-center mb-6">
                <Mail className="w-8 h-8 text-teal-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Check Your Email</h2>
              <p className="text-[var(--color-text-secondary)] text-sm mb-8">
                We've sent a password reset link to <br/>
                <span className="text-white font-medium">{email}</span>
              </p>
              <button onClick={() => setSubmitted(false)} className="text-sm text-[var(--color-accent)] hover:text-white transition-colors">
                Didn't receive the email? Click to resend.
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link to="/login" className="inline-flex items-center text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Simple lock icon for this component
const LockIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

export default ForgotPassword;
