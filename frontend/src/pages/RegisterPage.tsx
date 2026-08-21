import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Command, 
  Mail, 
  KeyRound, 
  User, 
  CheckCircle, 
  ArrowLeft, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { api } from '../services/api';

const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Subtle cinematic delay
    await new Promise(r => setTimeout(r, 600));

    try {
      await api.register({
        email,
        password,
        firstName,
        lastName
      });
      setIsSuccess(true);
    } catch (err: any) {
      console.error('[REGISTRATION ERROR]', err);
      setError(err.message || 'Registration failed. Please check your credentials and try again.');
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
              <h2 className="text-xl font-black uppercase tracking-wider text-white">Verification Sent</h2>
              <p className="text-xs text-zinc-400 font-mono">A verification link has been sent to your email.</p>
            </div>

            <p className="text-zinc-500 text-[11px] leading-relaxed max-w-sm mx-auto">
              Please check your inbox and verify your email address to activate your account and set up your studio profile.
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
            <h2 className="text-xl font-black uppercase tracking-wider text-white">Create Account</h2>
            <p className="text-xs text-zinc-500 font-mono">Register to launch your creative studio workspace.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-mono leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all"
                    placeholder="John"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Last Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

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

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-zinc-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[9px] rounded-full transition-all duration-300 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
