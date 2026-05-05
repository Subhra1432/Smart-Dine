import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Eye, EyeOff, Loader2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const API = import.meta.env.VITE_API_URL || '';

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    /* global google */
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });
    }
  }, []);

  const handleGoogleCallback = async (response: any) => {
    setLoading(true);
    const toastId = toast.loading('Synchronizing with Google Neural Link...');
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/superadmin/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Google Authentication Failed');

      toast.success('Access Granted. Welcome, Architect.', { id: toastId });
      setSuperAdmin(data.data.token);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google Configuration Missing');
      return;
    }
    window.google?.accounts.id.prompt(); // One Tap
    window.google?.accounts.id.requestCode(); // Or standardized button trigger
    // Since we want to use our custom button, we use the library's click trigger if possible,
    // but the easiest way is to just use the prompt or a specific button element.
    // For custom buttons, we can also use:
    // @ts-ignore
    google.accounts.id.prompt();
  };

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/superadmin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      toast.success('Welcome back, Command Center');
      onLoginSuccess();
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0C0A09] flex items-center justify-center relative overflow-hidden font-sans selection:bg-saffron-500/30 selection:text-saffron-200">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-saffron-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-saffron-600/5 rounded-full blur-[100px]" />
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-saffron-400/5 rounded-full blur-[80px] animate-pulse delay-700" />
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 w-full max-w-[440px] px-6">
        {/* Header Section */}
        <div className="mb-10 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-saffron-500/10 border border-saffron-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)] mb-4 group transition-all duration-500 hover:scale-110 hover:rotate-3">
            <Shield className="w-8 h-8 text-saffron-500 group-hover:animate-pulse" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-white flex items-center justify-center gap-3">
              Super <span className="text-saffron-500 italic">Admin</span>
            </h1>
            <p className="text-stone-400 font-medium tracking-wide text-sm uppercase">DineSmart Master Console</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-stone-900/40 backdrop-blur-3xl rounded-[32px] border border-stone-800/50 p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative group">
          {/* Internal Glow */}
          <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
          
          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            {/* Email Field */}
            <div className="space-y-2 group/field">
              <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest ml-1 transition-colors group-focus-within/field:text-saffron-500">System Identity</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-stone-600 transition-colors group-focus-within/field:text-saffron-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 bg-stone-950/50 border border-stone-800 rounded-2xl text-stone-200 placeholder:text-stone-700 focus:outline-none focus:ring-2 focus:ring-saffron-500/20 focus:border-saffron-500/50 transition-all duration-300"
                  placeholder="admin@dinesmart.ai"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2 group/field">
              <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest ml-1 transition-colors group-focus-within/field:text-saffron-500">Security Key</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-stone-600 transition-colors group-focus-within/field:text-saffron-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-4 bg-stone-950/50 border border-stone-800 rounded-2xl text-stone-200 placeholder:text-stone-700 focus:outline-none focus:ring-2 focus:ring-saffron-500/20 focus:border-saffron-500/50 transition-all duration-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-600 hover:text-stone-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group/btn overflow-hidden rounded-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-saffron-600 to-saffron-400 opacity-100 group-hover/btn:scale-105 transition-transform duration-500" />
              <div className="relative flex items-center justify-center gap-2 py-4 px-6 text-white font-bold tracking-wide">
                {loading ? (
                   <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Initialize Connection
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="h-px flex-1 bg-stone-800" />
              <span className="text-[10px] text-stone-600 font-bold uppercase tracking-widest">OR</span>
              <div className="h-px flex-1 bg-stone-800" />
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white rounded-2xl text-stone-950 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-stone-100 transition-all active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.05)] border border-white/10 group/google"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Help Text */}
            <div className="pt-4 flex items-center justify-center gap-2">
              <span className="h-[1px] w-4 bg-stone-800" />
              <p className="text-[10px] text-stone-600 font-bold uppercase tracking-tighter">Authorized Access Only</p>
              <span className="h-[1px] w-4 bg-stone-800" />
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-stone-500 text-xs font-medium tracking-wide">
          &copy; {new Date().getFullYear()} DineSmart Intelligence Platforms. 
          <br/>
          <span className="text-[10px] opacity-40">System Core v4.0.2</span>
        </p>
      </div>
    </div>
  );
}
