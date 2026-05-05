import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

interface PageLoaderProps {
  isLoading: boolean;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full animate-in fade-in duration-700">
      {/* Saffron Glow Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px] animate-pulse" />
      
      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        {/* Central Unit */}
        <div className="relative scale-75">
          <div className="w-24 h-24 rounded-[2rem] bg-stone-950 dark:bg-stone-900 border border-stone-200 dark:border-white/10 flex items-center justify-center shadow-[0_50px_100px_rgba(0,0,0,0.1)] dark:shadow-[0_50px_100px_rgba(0,0,0,0.4)] animate-in zoom-in duration-1000">
            <UtensilsCrossed size={32} className="text-white" />
            <div className="absolute inset-0 bg-primary/10 rounded-[2rem] animate-pulse" />
          </div>
          {/* Orbiting Elements */}
          <div className="absolute -inset-6 border border-primary/10 rounded-[2.5rem] animate-[spin_15s_linear_infinite]" />
          <div className="absolute -inset-3 border-2 border-stone-100 dark:border-stone-800/50 rounded-[2rem] animate-[ping_5s_linear_infinite]" />
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <p className="text-[8px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.6em]">Synchronizing</p>
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent via-primary/40 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
};
