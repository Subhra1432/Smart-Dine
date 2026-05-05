// ═══════════════════════════════════════════
// DineSmart — Super Admin Billing & Plans Page
// ═══════════════════════════════════════════

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CreditCard, IndianRupee, TrendingUp, Building2 } from 'lucide-react';

import { fetchApi } from '../lib/api';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
  monthlyRevenue: number;
  _count: { orders: number; branches: number };
}

const PLANS = [
  { name: 'STARTER', price: 999, features: ['1 Branch', '20 Tables', 'Basic Analytics', 'QR Code Ordering', 'KDS System'] },
  { name: 'PREMIUM', price: 2499, features: ['Unlimited Branches', 'Unlimited Tables', 'AI Insights', 'Coupon & Loyalty System', 'White Label Branding'] },
];

export default function BillingPlansPage() {
  const queryClient = useQueryClient();
  const { data: restaurants } = useQuery<{ items: Restaurant[] }>({
    queryKey: ['saRestaurants'],
    queryFn: () => fetchApi('/superadmin/restaurants'),
  });

  const handlePlanChange = async (id: string, plan: string) => {
    try {
      await fetchApi(`/superadmin/restaurants/${id}/plan`, { method: 'PUT', body: JSON.stringify({ plan }) });
      queryClient.invalidateQueries({ queryKey: ['saRestaurants'] });
      toast.success(`Plan updated to ${plan}`);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  };

  const planCounts = PLANS.map(p => ({
    ...p,
    count: restaurants?.items?.filter(r => r.plan === p.name).length || 0,
  }));

  const totalMRR = planCounts.reduce((sum, p) => sum + p.price * p.count, 0);

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 p-4 lg:p-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Financial Hub</h1>
        <h2 className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter uppercase leading-none">Billing & Plans</h2>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-primary/10 shadow-sm group active:scale-95 transition-all">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:rotate-6 transition-transform">
            <IndianRupee size={22} className="text-primary" />
          </div>
          <p className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em]">Monthly Recurring Revenue</p>
          <h3 className="text-2xl font-black text-stone-950 dark:text-white mt-1 tracking-tighter">₹{totalMRR.toLocaleString()}</h3>
        </div>

        <div className="p-6 bg-stone-950 rounded-3xl shadow-2xl shadow-stone-950/20 group active:scale-95 transition-all">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-5 group-hover:-rotate-6 transition-transform">
            <Building2 size={22} className="text-white" />
          </div>
          <p className="text-[9px] font-black text-stone-500 uppercase tracking-[0.2em]">Total Subscribers</p>
          <h3 className="text-2xl font-black text-white mt-1 tracking-tighter">{restaurants?.items?.length || 0} Nodes</h3>
        </div>

        <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-primary/10 shadow-sm group active:scale-95 transition-all">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:rotate-6 transition-transform">
            <TrendingUp size={22} className="text-primary" />
          </div>
          <p className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em]">Projected ARR</p>
          <h3 className="text-2xl font-black text-stone-950 dark:text-white mt-1 tracking-tighter">₹{(totalMRR * 12).toLocaleString()}</h3>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {planCounts.map((plan) => (
          <div key={plan.name} className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-primary/10 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">{plan.name} ARCHITECTURE</h3>
              <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 whitespace-nowrap">
                {plan.count} Active Tenants
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-6">
              <h4 className="text-4xl font-black text-stone-950 dark:text-white tracking-tighter">₹{plan.price}</h4>
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">/ Month</span>
            </div>
            <ul className="space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="text-[9px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-widest flex items-center gap-2.5">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Restaurant Plan Assignments */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-primary/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 dark:border-primary/10 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-stone-950 dark:text-white uppercase tracking-tighter leading-none">Subscription Assignments</h3>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-1">Tenant plan management</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-50 dark:bg-primary/5">
                <th className="text-left py-4 px-6 text-[9px] font-black text-stone-400 uppercase tracking-[0.2em]">Restaurant Node</th>
                <th className="text-center py-4 px-6 text-[9px] font-black text-stone-400 uppercase tracking-[0.2em]">Tier Status</th>
                <th className="text-center py-4 px-6 text-[9px] font-black text-stone-400 uppercase tracking-[0.2em]">Contribution</th>
                <th className="text-right py-4 px-6 text-[9px] font-black text-stone-400 uppercase tracking-[0.2em]">Tier Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 dark:divide-primary/5">
              {restaurants?.items?.map((r) => {
                const planPrice = PLANS.find(p => p.name === r.plan)?.price || 0;
                return (
                  <tr key={r.id} className="hover:bg-stone-50/50 dark:hover:bg-primary/5 transition-colors group">
                    <td className="py-4 px-6">
                      <p className="text-xs font-black text-stone-950 dark:text-white uppercase tracking-tighter group-hover:text-primary transition-colors">{r.name}</p>
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-0.5">{r.slug}</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                        {r.plan}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center text-xs font-black text-stone-950 dark:text-white tracking-tighter group-hover:text-primary transition-colors">
                      ₹{planPrice.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <select
                        value={r.plan}
                        onChange={(e) => handlePlanChange(r.id, e.target.value)}
                        className="bg-stone-50 dark:bg-stone-800 text-[9px] font-black uppercase tracking-widest text-stone-600 dark:text-stone-300 rounded-lg px-3 py-1.5 border border-stone-200 dark:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer hover:border-primary transition-all"
                      >
                        <option value="STARTER">Starter</option>
                        <option value="PREMIUM">Premium</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
