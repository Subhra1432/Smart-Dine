// ═══════════════════════════════════════════
// DineSmart — Admin Overview Page
// ═══════════════════════════════════════════

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getOverview, getRevenue } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { IndianRupee, ShoppingBag, TrendingUp, Clock, CreditCard, LayoutGrid, ArrowRight, Activity, Zap, Star, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { PageLoader } from '../components/PageLoader';

interface OverviewData {
  todayRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  pendingPayments: number;
  tableTurnoverRate: number;
  activeOrdersCount: number;
  popularItem: string;
  paymentSplit: Array<{ paymentMethod: string; _count: number; _sum: { total: number } }>;
  orderTypeSplit: Array<{ type: string; _count: number }>;
  recentOrders: Array<{
    id: string;
    tableId: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    table: { id: string; number: number };
    items: Array<{ menuItem: { name: string }; quantity: number }>;
  }>;
}

interface RevenueData {
  dataPoints: Array<{ date: string; revenue: number; orders: number }>;
  summary: { totalRevenue: number; totalOrders: number; avgOrderValue: number };
}

const COLORS = ['#f59e0b', '#1c1917', '#78716c', '#fbbf24'];

export default function OverviewPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isOwner = user?.role === 'OWNER';
  const isDark = document.documentElement.classList.contains('dark');

  const { data: overview } = useQuery<OverviewData>({
    queryKey: ['overview'],
    queryFn: () => getOverview() as Promise<OverviewData>,
    refetchInterval: 60000,
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery<RevenueData>({
    queryKey: ['revenue'],
    queryFn: () => getRevenue() as Promise<RevenueData>,
  });

  const isLoading = !overview || revenueLoading;

  useEffect(() => {
    const socket = io('/restaurant', { 
      transports: ['websocket', 'polling'],
      withCredentials: true 
    });
    socket.on('connect', () => {
      socket.emit('join:billing');
    });

    socket.on('order:new', (order) => {
      queryClient.invalidateQueries({ queryKey: ['overview'] });
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      toast.success(`🎉 New Order! Table #${order.table?.number || '?'} placed an order.`);
    });

    socket.on('payment:confirmed', () => {
      queryClient.invalidateQueries({ queryKey: ['overview'] });
    });

    socket.on('order:status_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['overview'] });
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
    });

    return () => { socket.disconnect(); };
  }, [queryClient]);

  const statCards = [
    { label: "Today's Revenue", value: `₹${(overview?.todayRevenue || 0).toLocaleString()}`, icon: IndianRupee, color: 'text-primary', bg: 'bg-primary/10', path: '/admin/analytics' },
    { label: 'Active Orders', value: overview?.activeOrdersCount || 0, icon: ShoppingBag, color: 'text-stone-950 dark:text-white', bg: 'bg-stone-100 dark:bg-stone-800', path: '/billing' },
    { label: 'Avg Order Value', value: `₹${(overview?.avgOrderValue || 0).toFixed(0)}`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', path: '/admin/analytics' },
    { label: 'Popular Item', value: overview?.popularItem || 'N/A', icon: Star, color: 'text-stone-950 dark:text-white', bg: 'bg-stone-100 dark:bg-stone-800', path: '/admin/analytics' },
    { label: 'Pending Payments', value: overview?.pendingPayments || 0, icon: CreditCard, color: 'text-primary', bg: 'bg-primary/10', path: '/billing' },
    { label: 'Projected Loss', value: `₹${((overview?.totalOrders || 0) * 0.05 * (overview?.avgOrderValue || 0)).toLocaleString()}`, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', path: '/admin/analytics' },
    { label: 'Active Sessions', value: overview?.activeOrdersCount || 0, icon: Clock, color: 'text-primary', bg: 'bg-primary/10', path: '/billing' },
    { label: 'Take Away Orders', value: overview?.orderTypeSplit?.find(p => p.type === 'TAKE_AWAY')?._count || 0, icon: ShoppingBag, color: 'text-amber-500', bg: 'bg-amber-500/10', path: '/billing', state: { autoSelectOrderType: 'TAKE_AWAY' } },
  ];

  if (isLoading) {
    return <PageLoader isLoading={true} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-xl font-black text-stone-950 dark:text-white tracking-tighter uppercase leading-none mb-1">
            Business <span className="text-primary italic">Overview</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
              <span className="text-[8px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em]">System Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <button
            key={idx}
            onClick={() => stat.path && navigate(stat.path, { state: (stat as any).state })}
            className="glass-card group relative p-4 overflow-hidden border border-stone-100/50 dark:border-white/5 hover:border-primary/20 transition-all duration-700 text-left w-full"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary/10 transition-all duration-1000" />

            <div className="relative z-10 flex flex-col h-full">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-700 shadow-inner border border-white/20 dark:border-white/5`}>
                <stat.icon size={16} className={stat.color} />
              </div>

              <p className="text-xl font-black text-stone-950 dark:text-white mb-1 tracking-tighter leading-none">{stat.value}</p>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500">{stat.label}</p>
            </div>
          </button>
        ))}
      </div>

      {isOwner && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue Trajectory */}
          <div className="lg:col-span-2 glass-card p-6 overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-stone-950 dark:text-white flex items-center gap-2.5 uppercase tracking-tighter">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                    <TrendingUp size={14} className="text-primary" />
                  </div>
                  Revenue Growth
                </h3>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 mt-1.5 ml-9.5">Last 30 Days Revenue</p>
              </div>
            </div>

            <div className="h-64 -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData?.dataPoints || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#292524' : '#e7e5e4'} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#57534e' : '#a8a29e', fontSize: 10, fontWeight: 900 }} tickFormatter={(d) => d.slice(5)} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#57534e' : '#a8a29e', fontSize: 10, fontWeight: 900 }} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(12, 10, 9, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(20px)',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e7e5e4',
                      borderRadius: '24px',
                      padding: '16px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}
                    itemStyle={{ color: '#f59e0b', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5em' }}
                    labelStyle={{ color: '#a8a29e', fontWeight: '900', fontSize: '10px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5em' }}
                    formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={5} fillOpacity={1} fill="url(#colorRevenues)" animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Allocation Distribution */}
          <div className="glass-card p-6 group">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-stone-950 dark:text-white flex items-center gap-2.5 uppercase tracking-tighter">
                  <div className="w-7 h-7 rounded-lg bg-stone-950/10 dark:bg-white/5 flex items-center justify-center border border-stone-950/10 dark:border-white/5">
                    <Activity size={14} className="text-stone-950 dark:text-white" />
                  </div>
                  Payment Methods
                </h3>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 mt-1.5 ml-9.5">How customers pay</p>
              </div>
            </div>

            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overview?.paymentSplit?.map((p) => ({
                      name: p.paymentMethod || 'Unknown',
                      value: p._count,
                    })) || []}
                    cx="50%" cy="50%"
                    innerRadius={80} outerRadius={110}
                    paddingAngle={10}
                    dataKey="value"
                    stroke="none"
                    animationDuration={1500}
                  >
                    {overview?.paymentSplit?.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} className="outline-none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(12, 10, 9, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(20px)',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e7e5e4',
                      borderRadius: '24px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              {overview?.paymentSplit?.map((p, i) => (
                <div key={p.paymentMethod} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-[0.3em]">{p.paymentMethod}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manifest Feed */}
      <div className="glass-panel overflow-hidden group">
        <div className="p-5 border-b border-stone-100 dark:border-white/5 flex justify-between items-center bg-white/20 dark:bg-stone-900/20">
          <h3 className="text-lg font-black text-stone-950 dark:text-white flex items-center gap-2.5 uppercase tracking-tighter">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
              <Zap size={14} className="text-primary" />
            </div>
            Recent Orders
          </h3>
          <button
            onClick={() => navigate('/billing')}
            className="px-4 py-2 bg-stone-950 dark:bg-primary text-white dark:text-stone-950 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] hover:bg-primary dark:hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-stone-950/10 dark:shadow-primary/10"
          >
            View All Orders
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[9px] font-black text-stone-400 dark:text-stone-500 border-b border-stone-100 dark:border-white/5 bg-stone-50/30 dark:bg-stone-900/30">
                <th className="text-left py-3 px-4 uppercase tracking-[0.3em]">Order ID</th>
                <th className="text-center py-3 px-4 uppercase tracking-[0.3em]">Table</th>
                <th className="text-left py-3 px-4 uppercase tracking-[0.3em]">Items Ordered</th>
                <th className="text-right py-3 px-4 uppercase tracking-[0.3em]">Total</th>
                <th className="text-center py-3 px-4 uppercase tracking-[0.3em]">Order Status</th>
                <th className="text-center py-3 px-4 uppercase tracking-[0.3em]">Payment</th>
                <th className="text-right py-3 px-4 uppercase tracking-[0.3em]">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100/50 dark:divide-white/5">
              {overview?.recentOrders?.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => navigate('/billing', { state: { autoSelectTableId: order.tableId } })}
                  className="hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group/row"
                >
                  <td className="py-3 px-4">
                    <p className="text-[12px] font-black text-stone-950 dark:text-white font-mono tracking-tighter uppercase">#{order.id.slice(-8)}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="mx-auto w-8 h-8 rounded-lg bg-stone-950 dark:bg-stone-800 text-white flex items-center justify-center font-black text-[10px] shadow-lg group-hover/row:scale-110 transition-all duration-500 group-hover/row:bg-primary group-hover/row:text-stone-950">
                      <ShoppingBag size={14} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {order.items.slice(0, 3).map((i: any, idx: number) => (
                        <div key={idx} className="text-[9px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-tight flex items-center gap-1.5">
                          <span className="text-primary font-black uppercase">{i.quantity}x</span> {i.menuItem.name}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-tight italic mt-1">
                          more {order.items.length - 3} items
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-[13px] font-black text-stone-950 dark:text-white tracking-tight">₹{order.total.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-[7px] font-black uppercase tracking-[0.3em] border ${order.status === 'COMPLETED' ? 'bg-primary/10 text-primary border-primary/20' :
                        order.status === 'READY' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                          'bg-stone-900 dark:bg-stone-800 text-white border-transparent shadow-lg shadow-stone-950/20'
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-[7px] font-black uppercase tracking-[0.3em] shadow-sm border ${order.paymentStatus === 'PAID' ? 'bg-stone-950 dark:bg-primary text-white dark:text-stone-950 border-transparent' : 'bg-white dark:bg-stone-900 text-stone-400 dark:text-stone-600 border-stone-200 dark:border-white/5'
                      }`}>{order.paymentStatus}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em]">
                    {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </td>
                </tr>
              ))}
              {(!overview?.recentOrders || overview.recentOrders.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-10 dark:opacity-20">
                      <ShoppingBag size={80} strokeWidth={1} />
                      <p className="text-[12px] font-black uppercase tracking-[0.5em]">No Active Orders</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
