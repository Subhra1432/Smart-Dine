import { useQuery } from '@tanstack/react-query';
import { getMenuPerformance, getPeakHours, getTablePerformance, getRevenue, getDemandForecast, getPricingSuggestions } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  TrendingUp, TrendingDown, Crown, Sparkles, 
  BrainCircuit, ArrowUpRight, IndianRupee, AlertCircle,
  BarChart3, Activity, Zap, Layers, Clock, ShoppingBag, UtensilsCrossed, X
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import { PageLoader } from '../components/PageLoader';

interface MenuPerf { bestSellers: Array<{ name: string; orderCount: number; revenue: number }>; slowMoving: Array<{ name: string; orderCount: number; revenue: number }> }
interface PeakHour { hour: number; dayOfWeek: number; orderCount: number }
interface TablePerf { tableNumber: number; totalOrders: number; avgRevenue: number; totalRevenue: number; avgSessionMinutes: number }
interface RevenueData { dataPoints: Array<{ date: string; revenue: number; orders: number }>; summary: { totalRevenue: number; totalOrders: number; avgOrderValue: number } }
interface DemandForecast { menuItemId: string; name: string; expectedOrders: number; isHighDemand: boolean }
interface PricingSuggestion { menuItemId: string; name: string; currentPrice: number; suggestedPrice: number; reason: string }

export default function AnalyticsPage() {
  const { restaurant } = useAuthStore();
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [showAllSlowMoving, setShowAllSlowMoving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  
  const plan = restaurant?.plan || 'STARTER';
  const hasProAnalytics = plan === 'PREMIUM';
  const hasDemandForecast = plan === 'PREMIUM';
  const hasSmartPricing = plan === 'PREMIUM';

  const { data: menuPerf, isLoading: menuLoading } = useQuery<MenuPerf>({ queryKey: ['menuPerformance'], queryFn: () => getMenuPerformance() as Promise<MenuPerf>, enabled: hasProAnalytics });
  const { data: peakHours, isLoading: peakLoading } = useQuery<PeakHour[]>({ queryKey: ['peakHours'], queryFn: () => getPeakHours() as Promise<PeakHour[]>, enabled: hasProAnalytics });
  const { data: tablePerf, isLoading: tableLoading } = useQuery<TablePerf[]>({ queryKey: ['tablePerformance'], queryFn: () => getTablePerformance() as Promise<TablePerf[]>, enabled: hasProAnalytics });
  const { data: revenue, isLoading: revenueLoading } = useQuery<RevenueData>({ queryKey: ['revenueAnalytics'], queryFn: () => getRevenue() as Promise<RevenueData> });
  
  const { data: demandForecast, isLoading: demandLoading } = useQuery<DemandForecast[]>({ 
    queryKey: ['demandForecast'], 
    queryFn: () => getDemandForecast() as Promise<DemandForecast[]>,
    enabled: hasDemandForecast 
  });
  
  const { data: pricingSuggestions, isLoading: pricingLoading } = useQuery<PricingSuggestion[]>({ 
    queryKey: ['pricingSuggestions'], 
    queryFn: () => getPricingSuggestions() as Promise<PricingSuggestion[]>,
    enabled: hasSmartPricing 
  });

  const isLoading = menuLoading || peakLoading || tableLoading || revenueLoading || demandLoading || pricingLoading;

  const peakHoursByHour = peakHours?.reduce<Record<number, number>>((acc, p) => {
    acc[p.hour] = (acc[p.hour] || 0) + p.orderCount;
    return acc;
  }, {});

  const hourlyData = peakHoursByHour ? Object.entries(peakHoursByHour).map(([hour, count]) => ({
    hour: `${hour}:00`,
    orders: count,
  })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour)) : [];

  const chartColors = {
    grid: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    text: isDarkMode ? '#78716c' : '#a8a29e',
    tooltipBg: isDarkMode ? '#1c1917' : '#ffffff',
    tooltipBorder: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e7e5e4',
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative">
      <PageLoader isLoading={isLoading} />
      
      {!isLoading && (
        <>
      {/* Header Matrix */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-black text-stone-950 dark:text-white tracking-tighter uppercase leading-none">Analytics <span className="text-primary italic">Hub</span></h1>
          <p className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] ml-1">Sales Reports</p>
        </div>
        
        <div className="flex items-center gap-3 px-4 py-2 bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl border border-white dark:border-white/5 rounded-lg shadow-sm">
          <Activity size={14} className="text-primary animate-pulse" />
          <span className="text-[9px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-[0.3em]">Live Data Connected</span>
        </div>
      </div>

      {/* Upgrade Interface Overlay */}
      {!hasProAnalytics && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-stone-50/10 dark:bg-stone-950/20 backdrop-blur-md rounded-[3rem]">
            <div className="glass-panel p-16 border-white/40 dark:border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] max-w-xl text-center transform scale-110 !bg-white/80 dark:!bg-stone-900/80">
                <div className="w-32 h-32 bg-stone-950 dark:bg-primary rounded-[3rem] flex items-center justify-center mx-auto mb-12 border border-white/10 shadow-2xl relative group overflow-hidden transition-all duration-700 hover:scale-110">
                    <Crown size={64} className="text-white dark:text-stone-950 relative z-10 transition-transform group-hover:rotate-12" />
                    <div className="absolute inset-0 bg-primary/20 scale-0 group-hover:scale-100 transition-transform duration-1000" />
                </div>
                <h2 className="text-5xl font-black text-stone-950 dark:text-white mb-6 tracking-tighter uppercase leading-none">Unlock <span className="text-stone-300 dark:text-stone-700">Pro Features</span></h2>
                <p className="text-xs text-stone-400 dark:text-stone-500 mb-12 leading-relaxed font-black uppercase tracking-[0.15em]">Get demand forecasts, smart pricing suggestions, and table performance stats. Upgrade your plan today.</p>
                <button className="w-full py-6 bg-stone-950 dark:bg-primary text-white dark:text-stone-950 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-stone-950/20 dark:shadow-primary/20 transition-all active:scale-95">
                   Upgrade Plan
                </button>
            </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Gross Revenue (30d)', value: `₹${(revenue?.summary.totalRevenue || 0).toLocaleString()}`, icon: IndianRupee },
          { label: 'Order Volume (30d)', value: revenue?.summary.totalOrders || 0, icon: TrendingUp },
          { label: 'Average Ticket Size', value: `₹${(revenue?.summary.avgOrderValue || 0).toFixed(0)}`, icon: Activity }
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-4 flex items-center gap-5 group !bg-white/40 dark:!bg-stone-900/40 border-white/20 dark:border-white/5 shadow-2xl shadow-stone-200/40 dark:shadow-none">
            <div className="w-12 h-12 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center transition-all duration-700 group-hover:scale-105 border border-stone-200 dark:border-white/5 shadow-inner">
              <stat.icon className="text-stone-950 dark:text-white" size={20} />
            </div>
            <div>
              <p className="text-[8px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.3em] mb-1">{stat.label}</p>
              <p className="text-xl font-black text-stone-950 dark:text-white tracking-tighter leading-none">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Order Type Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-6 border-white/20 dark:border-white/5 !bg-white/40 dark:!bg-stone-900/40 shadow-2xl shadow-stone-200/40 dark:shadow-none">
          <h2 className="text-[10px] font-black text-stone-400 dark:text-stone-600 tracking-[0.3em] uppercase flex items-center gap-3 mb-4">
            <ShoppingBag size={18} className="text-stone-950 dark:text-white" /> Take Away Stats
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/40 dark:bg-stone-800/40 p-4 rounded-xl">
              <p className="text-[8px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.3em] mb-1">Revenue</p>
              <p className="text-xl font-black text-stone-950 dark:text-white tracking-tighter">₹{(revenue?.summary.takeAwayRevenue || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white/40 dark:bg-stone-800/40 p-4 rounded-xl">
              <p className="text-[8px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.3em] mb-1">Orders</p>
              <p className="text-xl font-black text-stone-950 dark:text-white tracking-tighter">{revenue?.summary.takeAwayOrders || 0}</p>
            </div>
          </div>
        </div>
        <div className="glass-panel p-6 border-white/20 dark:border-white/5 !bg-white/40 dark:!bg-stone-900/40 shadow-2xl shadow-stone-200/40 dark:shadow-none">
          <h2 className="text-[10px] font-black text-stone-400 dark:text-stone-600 tracking-[0.3em] uppercase flex items-center gap-3 mb-4">
            <UtensilsCrossed size={18} className="text-stone-950 dark:text-white" /> Dine In Stats
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/40 dark:bg-stone-800/40 p-4 rounded-xl">
              <p className="text-[8px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.3em] mb-1">Revenue</p>
              <p className="text-xl font-black text-stone-950 dark:text-white tracking-tighter">₹{(revenue?.summary.dineInRevenue || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white/40 dark:bg-stone-800/40 p-4 rounded-xl">
              <p className="text-[8px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.3em] mb-1">Orders</p>
              <p className="text-xl font-black text-stone-950 dark:text-white tracking-tighter">{revenue?.summary.dineInOrders || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Intelligence Sector */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Predictive Demand Matrix */}
        <div className={cn(
          "col-span-2 glass-panel p-6 relative overflow-hidden group transition-all duration-700 !bg-white/40 dark:!bg-stone-900/40 border-white/20 dark:border-white/5 shadow-2xl shadow-stone-200/40 dark:shadow-none",
          !hasDemandForecast && "opacity-50 blur-[1px] pointer-events-none"
        )}>
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.08] transition-opacity">
            <BrainCircuit size={150} className="text-stone-900 dark:text-white" />
          </div>
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-stone-950 dark:bg-primary flex items-center justify-center text-white dark:text-stone-950 shadow-xl shadow-stone-950/20 dark:shadow-primary/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-950 dark:text-white tracking-tighter uppercase">Demand Forecast</h2>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-0.5">Forecast • Next 3 Hours</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 relative z-10">
             {demandForecast?.slice(0, 3).map((item, idx) => (
               <div key={idx} className="bg-white/40 dark:bg-stone-800/40 border border-white/60 dark:border-white/5 p-4 rounded-xl group/item transition-all duration-500 hover:bg-white dark:hover:bg-stone-800 shadow-sm">
                  <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Zap size={8} className="fill-primary" /> High Confidence
                  </p>
                  <h4 className="font-black text-stone-900 dark:text-white truncate text-sm mb-4 group-hover/item:text-primary transition-colors uppercase tracking-tight">{item.name}</h4>
                  <div className="flex items-end justify-between">
                     <span className="text-2xl font-black text-stone-950 dark:text-white tracking-tighter">~{item.expectedOrders}</span>
                     <span className="text-[8px] font-black text-stone-400 dark:text-stone-600 uppercase mb-1 tracking-widest">Expected Orders</span>
                  </div>
               </div>
             ))}
             {(!demandForecast || demandForecast.length === 0) && hasDemandForecast && (
               <div className="col-span-3 text-center py-12 text-stone-400 dark:text-stone-600 font-black uppercase text-[9px] tracking-[0.4em] bg-stone-50/50 dark:bg-stone-950/50 rounded-2xl border border-dashed border-stone-200 dark:border-white/5">
                 Analyzing patterns...
               </div>
             )}
          </div>
        </div>

        {/* Smart Pricing Optimization */}
        <div className={cn(
          "glass-panel p-6 relative overflow-hidden group transition-all duration-700 !bg-white/40 dark:!bg-stone-900/40 border-white/20 dark:border-white/5 shadow-2xl shadow-stone-200/40 dark:shadow-none",
          !hasSmartPricing && "opacity-50 blur-[1px] pointer-events-none"
        )}>
           <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-stone-950 dark:bg-primary flex items-center justify-center text-white dark:text-stone-950 shadow-xl shadow-stone-950/20 dark:shadow-primary/20">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-950 dark:text-white tracking-tighter uppercase">Smart Pricing</h2>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-0.5">Price Suggestions</p>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            {pricingSuggestions?.slice(0, 2).map((s, idx) => (
              <div key={idx} className="bg-white/40 dark:bg-stone-800/40 border border-white/60 dark:border-white/5 p-4 rounded-xl group/item transition-all duration-500 hover:bg-white dark:hover:bg-stone-800 shadow-sm">
                 <div className="flex justify-between items-start mb-3">
                   <span className="text-[9px] font-black text-stone-500 dark:text-stone-400 uppercase truncate max-w-[150px] tracking-widest">{s.name}</span>
                   <div className="px-2 py-1 rounded-md bg-stone-950 dark:bg-primary text-white dark:text-stone-950 shadow-lg">
                    <span className="text-[8px] font-black uppercase tracking-widest">-₹{(s.currentPrice - s.suggestedPrice).toFixed(0)}</span>
                   </div>
                 </div>
                 <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm text-stone-300 dark:text-stone-700 line-through font-black">₹{s.currentPrice}</span>
                    <ArrowUpRight size={16} className="text-primary" />
                    <span className="text-2xl font-black text-stone-950 dark:text-white tracking-tighter">₹{s.suggestedPrice}</span>
                 </div>
                 <div className="flex gap-2 items-start opacity-40 group-hover/item:opacity-100 transition-opacity p-2 bg-stone-50 dark:bg-stone-950 rounded-lg">
                   <AlertCircle size={10} className="text-primary mt-1 shrink-0" />
                   <p className="text-[9px] text-stone-500 dark:text-stone-400 leading-tight font-black uppercase tracking-tight">"{s.reason.split('.')[0]}."</p>
                 </div>
              </div>
            ))}
            {(!pricingSuggestions || pricingSuggestions.length === 0) && hasSmartPricing && (
               <div className="text-center py-12 text-stone-400 dark:text-stone-600 font-black uppercase text-[9px] tracking-[0.4em] bg-stone-50/50 dark:bg-stone-950/50 rounded-2xl border border-dashed border-stone-200 dark:border-white/5">
                 Pricing optimized
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Operational Visualization Matrix */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Velocity Distribution (Best Sellers) */}
        <div className="glass-panel p-6 border-white/20 dark:border-white/5 !bg-white/40 dark:!bg-stone-900/40 shadow-2xl shadow-stone-200/40 dark:shadow-none">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[10px] font-black text-stone-400 dark:text-stone-600 tracking-[0.3em] uppercase flex items-center gap-3">
              <TrendingUp size={18} className="text-stone-950 dark:text-white" /> Best Selling Items
            </h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={menuPerf?.bestSellers || []} layout="vertical" margin={{ left: 20 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.05}/>
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fill: chartColors.text, fontSize: 8, fontWeight: 900 }} width={120} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '16px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)', padding: '12px' }}
                  itemStyle={{ color: isDarkMode ? '#fff' : '#0c0a09', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}
                  labelStyle={{ color: '#f59e0b', fontSize: '9px', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Bar dataKey="orderCount" fill="url(#barGradient)" radius={[0, 8, 8, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temporal Load Density (Peak Hours) */}
        <div className="glass-panel p-6 border-white/20 dark:border-white/5 !bg-white/40 dark:!bg-stone-900/40 shadow-2xl shadow-stone-200/40 dark:shadow-none">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[10px] font-black text-stone-400 dark:text-stone-600 tracking-[0.3em] uppercase flex items-center gap-3">
              <Clock size={18} className="text-stone-950 dark:text-white" /> Peak Hours
            </h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: chartColors.text, fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: chartColors.text, fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '16px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)', padding: '12px' }}
                  itemStyle={{ color: '#f59e0b', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}
                  labelStyle={{ color: isDarkMode ? '#fff' : '#0c0a09', fontSize: '9px', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Area type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#areaGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attention Nodes (Slow Moving) */}
        <div className="glass-panel p-6 space-y-6 border-white/20 dark:border-white/5 !bg-white/40 dark:!bg-stone-900/40 shadow-2xl shadow-stone-200/40 dark:shadow-none h-fit">
          <h2 className="text-[10px] font-black text-stone-400 dark:text-stone-600 tracking-[0.3em] uppercase flex items-center gap-3">
            <TrendingDown size={18} className="text-stone-950 dark:text-white" /> Slow Moving Items
          </h2>
          <div className="grid gap-3">
            {menuPerf?.slowMoving?.slice(0, showAllSlowMoving ? undefined : 3).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-950/40 border border-stone-100 dark:border-white/5 rounded-2xl group hover:bg-white dark:hover:bg-stone-950 transition-all duration-700 hover:scale-[1.01]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/5 flex items-center justify-center text-red-500 border border-red-500/10 transition-transform group-hover:rotate-6">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <p className="font-black text-stone-950 dark:text-white uppercase tracking-tight group-hover:text-red-500 transition-colors text-sm">{item.name}</p>
                    <p className="text-[8px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-widest mt-1">
                      {item.orderCount} orders • ₹{item.revenue.toFixed(0)} Revenue
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-red-500/10 rounded-md border border-red-500/10">
                   <span className="text-[8px] font-black text-red-500 uppercase tracking-[0.2em]">Low Volume</span>
                </div>
              </div>
            ))}
            {menuPerf?.slowMoving && menuPerf.slowMoving.length > 3 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-2 bg-stone-100 dark:bg-stone-800 text-stone-950 dark:text-white rounded-lg text-[9px] font-black uppercase tracking-[0.2em] hover:bg-stone-200 dark:hover:bg-stone-700 transition-all mt-2"
              >
                See More
              </button>
            )}
            {(!menuPerf?.slowMoving || menuPerf.slowMoving.length === 0) && (
              <div className="py-12 text-center text-stone-300 dark:text-stone-700 font-black text-[9px] uppercase tracking-[0.4em] bg-stone-50/50 dark:bg-stone-950/50 rounded-2xl border border-dashed border-stone-200 dark:border-white/5">
                All items are performing well
              </div>
            )}
          </div>
        </div>

        {/* Spatial Efficiency Matrix (Table Performance) */}
        <div className="glass-panel p-6 flex flex-col border-white/20 dark:border-white/5 !bg-white/40 dark:!bg-stone-900/40 shadow-2xl shadow-stone-200/40 dark:shadow-none">
          <h2 className="text-[10px] font-black text-stone-400 dark:text-stone-600 tracking-[0.3em] uppercase flex items-center gap-3 mb-8">
            <Layers size={18} className="text-stone-950 dark:text-white" /> Table Performance
          </h2>
          <div className="overflow-x-auto overflow-y-auto max-h-[400px] flex-grow scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[9px] font-black text-stone-300 dark:text-stone-700 uppercase tracking-[0.2em] border-b border-stone-100 dark:border-white/5">
                  <th className="pb-4 min-w-[100px]">Table No.</th>
                  <th className="text-center pb-4 min-w-[80px]">Orders</th>
                  <th className="text-center pb-4 min-w-[100px]">Total Revenue</th>
                  <th className="text-center pb-4 min-w-[100px]">Avg Bill</th>
                  <th className="text-right pb-4 min-w-[80px]">Avg Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-white/5">
                {tablePerf?.map((t) => (
                  <tr key={t.tableNumber} className="group hover:bg-stone-50/50 dark:hover:bg-white/5 transition-all duration-500">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-white/5 flex items-center justify-center font-black text-stone-950 dark:text-white group-hover:bg-stone-950 dark:group-hover:bg-primary group-hover:text-white dark:group-hover:text-stone-950 transition-all duration-700 shadow-sm text-xs">
                          {t.tableNumber}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="font-black text-stone-950 dark:text-white text-sm">{t.totalOrders}</span>
                    </td>
                    <td className="py-3 text-center font-black text-stone-950 dark:text-white text-sm">₹{t.totalRevenue.toLocaleString()}</td>
                    <td className="py-3 text-center text-stone-400 dark:text-stone-600 font-black text-xs">₹{t.avgRevenue}</td>
                    <td className="py-3 text-right">
                       <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-[9px] font-black text-stone-950 dark:text-white uppercase tracking-widest border border-stone-200/50 dark:border-white/5 shadow-sm">{t.avgSessionMinutes}m</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
        </>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-lg w-full !bg-white dark:!bg-stone-900 border-white/20 dark:border-white/5 shadow-2xl rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-stone-950 dark:text-white tracking-tighter uppercase">All Slow Moving Items</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-500 hover:text-stone-700 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
              {menuPerf?.slowMoving?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-950/40 border border-stone-100 dark:border-white/5 rounded-xl group hover:bg-white dark:hover:bg-stone-950 transition-all duration-700">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-500/5 flex items-center justify-center text-red-500 border border-red-500/10 transition-transform group-hover:rotate-6">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <p className="font-black text-stone-950 dark:text-white uppercase tracking-tight group-hover:text-red-500 transition-colors text-sm">{item.name}</p>
                      <p className="text-[8px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-widest mt-1">
                        {item.orderCount} orders • ₹{item.revenue.toFixed(0)} Revenue
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-red-500/10 rounded-md border border-red-500/10">
                     <span className="text-[8px] font-black text-red-500 uppercase tracking-[0.2em]">Low Volume</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
