import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  Command, 
  KeyRound, 
  CheckCircle, 
  Eye, 
  EyeOff,
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';

const ResetPasswordPage: React.FC = () => {
  const { token: routeToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const activeToken = routeToken || searchParams.get('token') || '';
    setToken(activeToken);
  }, [routeToken, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const tokenToSubmit = token.trim();
    if (!tokenToSubmit) {
      setError('Password reset token is missing.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    await new Promise(r => setTimeout(r, 600));

    try {
      await api.confirmPasswordReset({
        token: tokenToSubmit,
        newPassword: password
      });
      setIsSuccess(true);
    } catch (err: any) {
      console.error('[RESET PASSWORD CONFIRM ERROR]', err);
      setError(err.message || 'Failed to update your password. The token may be invalid or expired.');
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
              <h2 className="text-xl font-black uppercase tracking-wider text-white">Password Updated</h2>
              <p className="text-xs text-zinc-400 font-mono font-bold">Security update complete.</p>
            </div>

            <p className="text-zinc-500 text-[11px] leading-relaxed max-w-sm mx-auto">
              Your password has been successfully modified. All other active sessions have been securely terminated.
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
            <ArrowLeft className="w-4 h-4" /> Cancel
          </Link>
          <div className="flex items-center gap-2">
            <Command className="w-6 h-6 text-white" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white">Studio</span>
          </div>
        </div>

        <div className="glass-panel-dark border border-white/10 rounded-[2.5rem] p-8 shadow-2xl shadow-black/80 space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-black uppercase tracking-wider text-white">Reset Password</h2>
            <p className="text-xs text-zinc-500 font-mono">Create a strong new password for your account.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-mono leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!routeToken && !searchParams.get('token') && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Reset Token</label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all font-mono"
                  placeholder="Paste token here..."
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">New Password</label>
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

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Confirm Password</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[9px] rounded-full transition-all duration-300 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
