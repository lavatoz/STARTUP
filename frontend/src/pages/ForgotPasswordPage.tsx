import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Command, 
  Mail, 
  CheckCircle, 
  ArrowLeft 
} from 'lucide-react';
import { api } from '../services/api';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    await new Promise(r => setTimeout(r, 600));

    try {
      await api.requestPasswordReset(email);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('[FORGOT PASSWORD ERROR]', err);
      setError(err.message || 'Failed to submit password reset request.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md animate-ios-slide-up relative z-10 text-center">
          <div className="glass-panel-dark border border-white/10 rounded-[2.5rem] p-8 shadow-2xl shadow-black/80 space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              <CheckCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-wider text-white">Reset Email Sent</h2>
              <p className="text-xs text-zinc-400 font-mono font-bold">Please check your inbox.</p>
            </div>

            <p className="text-zinc-500 text-[11px] leading-relaxed max-w-sm mx-auto">
              If an account is associated with that email, a password reset link has been dispatched.
            </p>

            <div className="pt-4">
              <Link 
                to="/login" 
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-[9px] rounded-full transition-all duration-300 hover:bg-zinc-200"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-ios-slide-up relative z-10">
        <div className="flex justify-between items-center mb-6 px-4">
          <Link to="/login" className="text-zinc-500 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
          <div className="flex items-center gap-2">
            <Command className="w-6 h-6 text-white" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white">Studio</span>
          </div>
        </div>

        <div className="glass-panel-dark border border-white/10 rounded-[2.5rem] p-8 shadow-2xl shadow-black/80 space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-black uppercase tracking-wider text-white">Forgot Password</h2>
            <p className="text-xs text-zinc-500 font-mono">Reset security credentials for your workspace.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-mono leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all"
                  placeholder="name@studio.com"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[9px] rounded-full transition-all duration-300 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? 'Submitting Request...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
