import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Eye, EyeOff, Loader2, ChevronRight, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const API = import.meta.env.VITE_API_URL || '';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

type Step = 'LOGIN' | 'SETUP_2FA' | 'VERIFY_2FA';

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { setLoggedIn } = useAuthStore();
  
  const [step, setStep] = useState<Step>('LOGIN');
  const [tempToken, setTempToken] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpCode, setTotpCode] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const initGoogle = () => {
      if (step !== 'LOGIN') return;
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false
        });
        const buttonDiv = document.getElementById('google-signin-button');
        if (buttonDiv && isMounted) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'filled_black',
            size: 'large',
            width: buttonDiv.offsetWidth || 340,
            shape: 'pill',
            text: 'continue_with'
          });
        }
      } else if (isMounted) {
        setTimeout(initGoogle, 500);
      }
    };

    initGoogle();
    return () => { isMounted = false; };
  }, [step]);

  const handleNextStep = async (data: any) => {
    if (data.requiresSetup2FA) {
      setTempToken(data.tempToken);
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/v1/auth/superadmin/2fa/setup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: data.tempToken }),
        });
        const setupData = await res.json();
        if (!setupData.success) throw new Error(setupData.error || 'Failed to setup 2FA');
        setQrCodeUrl(setupData.data.qrCodeDataUrl);
        setStep('SETUP_2FA');
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    } else if (data.requires2FA) {
      setTempToken(data.tempToken);
      setStep('VERIFY_2FA');
    } else if (data.admin) {
      toast.success('Welcome back, Command Center');
      setLoggedIn(true, data.admin);
      onLoginSuccess();
      navigate('/');
    }
  };

  const handleGoogleCallback = async (response: any) => {
    setLoading(true);
    const toastId = toast.loading('Synchronizing with Google Neural Link...');
    try {
      const res = await fetch(`${API}/api/v1/auth/superadmin/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Google Authentication Failed');

      toast.dismiss(toastId);
      await handleNextStep(data.data);
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
      setLoading(false);
    }
  };

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

      await handleNextStep(data.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Connection failed');
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length < 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Verifying identity protocol...');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${API}/api/v1/auth/superadmin/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: tempToken, 
          code: totpCode,
          isSetup: step === 'SETUP_2FA'
        }),
        credentials: 'include',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid authentication code');
      }

      toast.success('Access granted. Welcome back.', { id: toastId });
      setLoggedIn(true, data.data.admin);
      onLoginSuccess();
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Verification failed', { id: toastId });
      setLoading(false);
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
      <div className="absolute inset-0 bg-stone-950/20 opacity-20 mix-blend-overlay pointer-events-none" />
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
          
          {step === 'LOGIN' && (
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

              {/* Google Login Button Container */}
              <div className="relative group/google">
                <div className="absolute inset-0 bg-stone-100/5 dark:bg-white/5 rounded-2xl border border-stone-200/50 dark:border-white/5 group-hover/google:border-saffron-500/30 transition-all duration-500" />
                <div className="relative z-10 flex justify-center py-2 px-1">
                  <div id="google-signin-button" className="w-full flex justify-center" />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-2">
                <span className="h-[1px] w-4 bg-stone-800" />
                <p className="text-[10px] text-stone-600 font-bold uppercase tracking-tighter">Authorized Access Only</p>
                <span className="h-[1px] w-4 bg-stone-800" />
              </div>
            </form>
          )}

          {(step === 'SETUP_2FA' || step === 'VERIFY_2FA') && (
            <form onSubmit={handleVerify2FA} className="space-y-6 relative z-10">
              <div className="text-center space-y-2 mb-6">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-saffron-500/10 mb-2">
                  <QrCode className="w-6 h-6 text-saffron-500" />
                </div>
                <h2 className="text-xl font-bold text-white">Two-Factor Authentication</h2>
                <p className="text-sm text-stone-400">
                  {step === 'SETUP_2FA' 
                    ? 'Scan this QR code with your Authenticator app, then enter the 6-digit code below.' 
                    : 'Enter the 6-digit code from your Authenticator app.'}
                </p>
              </div>

              {step === 'SETUP_2FA' && qrCodeUrl && (
                <div className="flex justify-center bg-white p-4 rounded-xl mb-6">
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              )}

              <div className="space-y-2 group/field">
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest ml-1 transition-colors group-focus-within/field:text-saffron-500">Authenticator Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="block w-full px-4 py-4 text-center tracking-[0.5em] text-2xl font-mono bg-stone-950/50 border border-stone-800 rounded-2xl text-stone-200 placeholder:text-stone-700 focus:outline-none focus:ring-2 focus:ring-saffron-500/20 focus:border-saffron-500/50 transition-all duration-300"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading || totpCode.length < 6}
                className="w-full relative group/btn overflow-hidden rounded-2xl disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-saffron-600 to-saffron-400 opacity-100 group-hover/btn:scale-105 transition-transform duration-500" />
                <div className="relative flex items-center justify-center gap-2 py-4 px-6 text-white font-bold tracking-wide">
                  {loading ? (
                     <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Verify Code
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('LOGIN');
                  setTempToken('');
                  setTotpCode('');
                }}
                className="w-full text-center text-sm text-stone-500 hover:text-stone-300 transition-colors"
              >
                Cancel and return to login
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-stone-500 text-xs font-medium tracking-wide">
          &copy; {new Date().getFullYear()} DineSmart Intelligence Platforms. 
          <br/>
          <span className="text-[10px] opacity-40">System Core v4.0.2</span>
        </p>
      </div>
    </div>
  );
}

