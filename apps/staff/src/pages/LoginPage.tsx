// ═══════════════════════════════════════════
// DineSmart — Staff Login Terminal (Saffron & Stone)
// Design System: Industrial Intelligence / Stone Neutral
// ═══════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { login } from '../lib/api';
import toast from 'react-hot-toast';
import { UtensilsCrossed, Mail, Lock, LogIn, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react';
import { PageLoader } from '../components/PageLoader';



export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data: any = await login(email, password);
      setAuth(data.user, data.restaurant);
      toast.success('System Authenticated. Redirecting to Dashboard.');
      navigate('/admin');
    } catch (error: any) {
      toast.error(error.message || 'Authentication Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden bg-stone-950">
      <PageLoader isLoading={loading} />
      {!loading && (
        <>
          {/* ── Full-bleed Background (Left atmosphere) ───────── */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 scale-110 animate-ken-burns opacity-70"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2048")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Gradient: clear on left, dark overlay toward right */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/30 via-stone-950/60 to-stone-950 z-10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.07] mix-blend-overlay z-20" />
      </div>

      {/* ── Brand Text — Floating left overlay ───────────── */}
      <div className="relative z-20 flex-1 hidden lg:flex flex-col justify-center px-16 py-20 pointer-events-none select-none">
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-10 w-fit">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.5em]">System Node Active</span>
        </div>

        <h1 className="text-[7rem] xl:text-[9rem] font-black text-white tracking-tighter leading-[0.82] uppercase drop-shadow-2xl">
          Saffron<br />
          <span className="text-primary">& </span>Stone
        </h1>
        <p className="mt-8 text-xl text-stone-400 font-medium max-w-sm leading-relaxed">
          Precision-engineered industrial OS for elite hospitality networks.
        </p>

        <div className="flex items-center gap-12 mt-16 pt-10 border-t border-white/10 w-fit">
          <div>
            <p className="text-[9px] font-black text-stone-500 uppercase tracking-[0.4em] mb-2">Integrity</p>
            <p className="text-2xl font-black text-white">100<span className="text-primary">%</span></p>
          </div>
          <div>
            <p className="text-[9px] font-black text-stone-500 uppercase tracking-[0.4em] mb-2">Throughput</p>
            <p className="text-2xl font-black text-white">4.2<span className="text-primary">Gbps</span></p>
          </div>
          <div>
            <p className="text-[9px] font-black text-stone-500 uppercase tracking-[0.4em] mb-2">Node ID</p>
            <p className="text-2xl font-black text-primary">DS-ALPHA</p>
          </div>
        </div>
      </div>

      {/* ── Login Section — Glassmorphic Container ─────────── */}
      <div className="relative z-30 w-full lg:w-[600px] min-h-screen flex items-center justify-center p-6 lg:p-12 animate-in slide-in-from-right-16 duration-700">

        {/* Glassmorphic Card */}
        <div className="relative w-full max-w-[440px] bg-stone-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col p-8 lg:p-10">

          {/* Subtle Neumorphic Inner Highlight */}
          <div className="absolute inset-0 rounded-[2.5rem] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.1)] pointer-events-none" />

          {/* Accent Line (Glass Highlight) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          {/* Header */}
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-6 shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <ShieldCheck size={32} className="text-primary relative z-10" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-tight mb-2">
              Identity<br />Authorization
            </h2>
            <p className="text-stone-500 text-[9px] font-black uppercase tracking-[0.4em]">Biometric or Key Access Required</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-stone-500 uppercase tracking-[0.4em] ml-1">Access Registry</label>
              <div className="relative group/input">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within/input:text-primary transition-colors duration-300" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl py-4 pl-14 pr-5 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-sm font-bold"
                  placeholder="operator@dinesmart.ai"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-stone-500 uppercase tracking-[0.4em] ml-1">Security Token</label>
              <div className="relative group/input">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within/input:text-primary transition-colors duration-300" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl py-4 pl-14 pr-5 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-sm font-bold"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-primary hover:bg-primary/90 text-stone-950 font-black py-4 rounded-2xl transition-all duration-500 shadow-[0_20px_50px_-12px_rgba(245,158,11,0.4)] hover:shadow-[0_25px_60px_-10px_rgba(245,158,11,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.4em] text-[10px] flex items-center justify-center gap-3 group/btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" />
              ) : (
                <>
                  Initialize Link
                  <ChevronRight size={16} className="group-hover/btn:translate-x-2 transition-transform duration-300" />
                </>
              )}
            </button>
            <div className="mt-4 text-center">
              <button 
                type="button" 
                onClick={() => navigate('/register')} 
                className="text-[10px] text-stone-500 hover:text-primary transition-colors uppercase tracking-[0.2em] font-black w-full py-2 border border-transparent hover:border-white/10 rounded-2xl"
              >
                New Node Registration
              </button>
            </div>
          </form>

          {/* Rapid Override */}
          <div className="mt-8 pt-8 border-t border-white/[0.06]">
            <div className="flex items-center gap-4 mb-5">
              <div className="h-px flex-1 bg-white/[0.04]" />
              <span className="text-[9px] font-black text-stone-700 uppercase tracking-[0.6em]">Rapid Override</span>
              <div className="h-px flex-1 bg-white/[0.04]" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'OWNER', email: 'owner@spicegarden.com', pass: 'owner123' },
                { label: 'CASHIER', email: 'cashier@spicegarden.com', pass: 'cashier123' },
                { label: 'KITCHEN', email: 'kitchen@spicegarden.com', pass: 'kitchen123' },
              ].map((staff) => (
                <button
                  key={staff.label}
                  type="button"
                  className="flex flex-col items-center justify-center py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 border border-transparent hover:border-white/10 active:scale-95"
                  onClick={() => { setEmail(staff.email); setPassword(staff.pass); }}
                >
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-[0.2em] mb-1 group-hover:text-primary transition-colors">{staff.label}</span>
                  <span className="text-[9px] text-stone-500 font-bold uppercase">{staff.pass}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-4 flex items-center justify-between border-t border-white/5">
            <span className="text-[9px] font-black text-stone-500 uppercase tracking-[0.4em]">v4.2.0-STABLE</span>
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-stone-800" />
              <div className="w-1.5 h-1.5 rounded-full bg-stone-800" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Corner accents */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-white/[0.04] rounded-tl-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-20 h-20 border-b-2 border-l-2 border-white/[0.04] rounded-bl-3xl pointer-events-none" />
        </>
      )}
    </div>
  );
}

