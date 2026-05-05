import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

interface SplashLoadingProps {
  isLoading: boolean;
}

export const SplashLoading: React.FC<SplashLoadingProps> = ({ isLoading }) => {
  return (
    <div className={`fixed inset-0 z-[100] transition-all duration-1000 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'} flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 m-0 p-0 antialiased transition-colors duration-700`}>
      {/* Saffron Glow Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-saffron-500/10 rounded-full blur-[120px] animate-pulse" />
      
      {/* Subtle Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3F%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      
      <div className="relative z-10 flex flex-col items-center gap-8 md:gap-12 text-center w-full max-w-sm">
        {/* Central Unit */}
        <div className="relative scale-75 md:scale-100">
          <div className="w-24 md:w-32 h-24 md:h-32 rounded-[2rem] md:rounded-[2.5rem] bg-stone-950 dark:bg-stone-900 border border-stone-200 dark:border-white/10 flex items-center justify-center shadow-[0_50px_100px_rgba(0,0,0,0.3)] dark:shadow-[0_50px_100px_rgba(0,0,0,0.6)] animate-in zoom-in duration-1000">
            <UtensilsCrossed size={32} className="text-white md:hidden" />
            <UtensilsCrossed size={48} className="text-white hidden md:block" />
            <div className="absolute inset-0 bg-saffron-500/10 rounded-[2rem] md:rounded-[2.5rem] animate-pulse" />
          </div>
          {/* Orbiting Elements */}
          <div className="absolute -inset-8 md:-inset-10 border border-saffron-500/10 rounded-[2.5rem] md:rounded-[3.5rem] animate-[spin_15s_linear_infinite]" />
          <div className="absolute -inset-4 md:-inset-5 border-2 border-stone-100 dark:border-stone-800/50 rounded-[2rem] md:rounded-[3rem] animate-[ping_5s_linear_infinite]" />
        </div>

        <div className="flex flex-col items-center gap-4 md:gap-6 text-center">
          <h1 className="text-3xl md:text-5xl font-black text-stone-950 dark:text-white tracking-[-0.05em] uppercase">
            DineSmart <span className="text-saffron-500 tracking-normal italic">OS</span>
          </h1>
          <div className="flex items-center gap-4 md:gap-8">
            <div className="h-[1px] w-8 md:w-12 bg-gradient-to-r from-transparent via-saffron-500/40 to-transparent" />
            <p className="text-[8px] md:text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] md:tracking-[0.6em]">Node Activation</p>
            <div className="h-[1px] w-8 md:w-12 bg-gradient-to-l from-transparent via-saffron-500/40 to-transparent" />
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="absolute bottom-24 flex gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-saffron-500/30 animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
};
