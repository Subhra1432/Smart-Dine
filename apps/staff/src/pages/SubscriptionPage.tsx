// ═══════════════════════════════════════════
// DineSmart — Subscription & Plan Page
// Only Starter (₹999) + Premium (₹2499)
// ═══════════════════════════════════════════

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth';
import {
  CreditCard, Crown, Zap, Check, X as XIcon,
  AlertTriangle, IndianRupee, Calendar, Shield, Lock, TrendingUp
} from 'lucide-react';
import { PageLoader } from '../components/PageLoader';

const API_URL = (import.meta as any).env.VITE_API_URL || '';
const API_BASE = `${API_URL}/api/v1`;

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  const data = await res.json();
  if (!data.success) {
    const err = new Error(data.error || 'API request failed') as any;
    err.reasons = data.reasons;
    throw err;
  }
  return data.data as T;
}

interface SubscriptionInfo {
  plan: string;
  planExpiresAt: string | null;
  isActive: boolean;
  daysRemaining: number;
  usage: { branches: number; tables: number; menuItems: number; orders: number };
}

const PLANS = [
  {
    name: 'STARTER',
    label: 'Starter',
    price: 999,
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    features: [
      '1 Branch location',
      'Up to 20 Tables',
      'Basic Analytics Dashboard',
      'QR Code Ordering',
      'Kitchen Display System',
      'Email Support',
    ],
    limits: { branches: 1, tables: 20 },
  },
  {
    name: 'PREMIUM',
    label: 'Premium',
    price: 2499,
    icon: Crown,
    color: 'from-emerald-500 to-emerald-700',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    popular: true,
    features: [
      'Unlimited Branches',
      'Unlimited Tables',
      'Full Analytics + AI Insights',
      'AI Demand Forecasting',
      'AI Smart Pricing',
      'Coupon & Loyalty System',
      'Inventory Management',
      'White Label Branding',
      '24/7 Priority Support',
    ],
    limits: { branches: -1, tables: -1 },
  },
];

export default function SubscriptionPage() {
  const { restaurant, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [downgradeBlock, setDowngradeBlock] = useState<{ reasons: string[] } | null>(null);

  const { data: subscription, isLoading } = useQuery<SubscriptionInfo>({
    queryKey: ['subscription'],
    queryFn: () => fetchApi<SubscriptionInfo>('/restaurant/subscription'),
  });

  const { data: payments } = useQuery<any[]>({
    queryKey: ['subscriptionPayments'],
    queryFn: () => fetchApi<any[]>('/restaurant/subscription/payments'),
  });

  const activePlan = subscription?.plan || restaurant?.plan || 'STARTER';
  const currentPlan = PLANS.find(p => p.name === activePlan) || PLANS.find(p => activePlan.includes(p.name));
  const isExpired = subscription?.daysRemaining !== undefined && subscription.daysRemaining <= 0;
  const isExpiringSoon = subscription?.daysRemaining !== undefined && subscription.daysRemaining > 0 && subscription.daysRemaining <= 7;

  const handleSubscribe = (planName: string) => {
    setDowngradeBlock(null);
    setSelectedPlan(planName);
    setShowPaymentModal(true);
  };

  const handlePayment = async (method: string) => {
    if (!selectedPlan || !selectedPlanInfo) return;
    setProcessing(true);

    try {
      // API will be updated later to generate real order_id. 
      // Using standard checkout integration for now.
      if (!(window as any).Razorpay) {
        throw new Error('Payment gateway failed to load. Please check your connection.');
      }

      const options = {
        key: (import.meta as any).env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummy_key', // Fallback for UI testing
        amount: Math.round(selectedPlanInfo.price * 1.18 * 100), // paise
        currency: 'INR',
        name: 'DineSmart OS',
        description: `${selectedPlanInfo.label} Subscription`,
        image: '/favicon.svg',
        // order_id: 'order_dummy', // Will be fetched from backend later
        handler: function (response: any) {
          // Backend verification will go here
          toast.success(`💳 Payment successful!`);
          toast.success('🎉 Subscription activated successfully!');
          
          queryClient.setQueryData(['subscription'], (old: any) => ({
            ...old,
            plan: selectedPlan,
            isActive: true,
            daysRemaining: 30,
            planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }));
          
          setShowPaymentModal(false);
          setProcessing(false);
          setSelectedPlan(null);
        },
        prefill: {
          name: user?.email?.split('@')[0] || 'Admin',
          email: user?.email || '',
          contact: '9999999999' // Placeholder
        },
        theme: {
          color: '#f59e0b' // saffron-500
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
            toast.error('Payment cancelled by user');
          }
        }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        toast.error(`Payment Failed: ${response.error.description}`);
        setProcessing(false);
      });
      
      rzp1.open();

    } catch (error: any) {
      toast.error(error.message || 'Payment initialization failed');
      setProcessing(false);
    }
  };

  const selectedPlanInfo = PLANS.find(p => p.name === selectedPlan);

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-12">
      {/* Header Section */}
      <div className="relative group">
        <div className="absolute -inset-x-8 -top-8 h-64 bg-gradient-to-b from-saffron-500/5 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-saffron-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              <p className="text-[9px] font-black text-saffron-500 uppercase tracking-[0.4em]">Subscription</p>
            </div>
            <h1 className="text-2xl font-black text-stone-950 dark:text-white tracking-tighter uppercase leading-none">
              Subscription
            </h1>
            <p className="text-stone-500 dark:text-stone-400 font-black uppercase text-[9px] tracking-widest max-w-md">
              Manage your subscription and billing.
            </p>
          </div>
        </div>
      </div>

      {/* Warnings & Intel */}
      <div className="space-y-4">
        {/* Expiry Warning */}
        {(isExpired || isExpiringSoon) && (
          <div className={`p-6 rounded-[2.5rem] border backdrop-blur-3xl flex items-start gap-4 transition-all duration-500 hover:scale-[1.01] ${isExpired
              ? 'bg-red-500/10 border-red-500/20 shadow-[0_0_40px_-10px_rgba(239,68,68,0.2)]'
              : 'bg-saffron-500/10 border-saffron-500/20 shadow-[0_0_40px_-10px_rgba(245,158,11,0.2)]'
            }`}>
            <div className={`p-3 rounded-2xl ${isExpired ? 'bg-red-500/20' : 'bg-saffron-500/20'}`}>
              <AlertTriangle size={24} className={isExpired ? 'text-red-400' : 'text-saffron-500'} />
            </div>
            <div className="flex-1">
              <p className={`text-lg font-black uppercase tracking-widest ${isExpired ? 'text-red-400' : 'text-saffron-500'}`}>
                {isExpired ? 'Subscription Expired' : 'Subscription Expiring Soon'}
              </p>
              <p className="text-sm text-stone-400 mt-1 font-medium">
                {isExpired
                  ? 'Your subscription has expired. Please renew to continue using all features.'
                  : `Your subscription expires in ${subscription?.daysRemaining} days. Renew now to avoid interruption.`
                }
              </p>
            </div>
          </div>
        )}

        {/* Downgrade Block Warning */}
        {downgradeBlock && (
          <div className="p-8 rounded-[2.5rem] border border-red-500/30 bg-red-500/10 backdrop-blur-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Lock size={120} className="text-red-500" />
            </div>
            <div className="relative flex flex-col md:flex-row items-start gap-6">
              <div className="p-4 rounded-3xl bg-red-500/20 border border-red-500/30">
                <Lock size={32} className="text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-black text-white uppercase tracking-tighter mb-2">Cannot Downgrade</p>
                <p className="text-sm text-stone-400 mb-6 font-medium max-w-xl">
                  You have more branches or tables than the Starter plan allows. Please remove some before downgrading.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {downgradeBlock.reasons.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                        <XIcon size={12} className="text-red-400" />
                      </div>
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setDowngradeBlock(null)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-all border border-white/10"
              >
                <XIcon size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Current Plan Status */}
      <div className="glass-card rounded-[2.5rem] p-6 border border-white/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
          {currentPlan ? <currentPlan.icon size={200} className="text-stone-950 dark:text-white" /> : <Zap size={200} className="text-stone-950 dark:text-white" />}
        </div>

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentPlan?.color || 'from-stone-500 to-stone-700'} flex items-center justify-center shadow-2xl border-4 border-white/10`}>
              {currentPlan ? <currentPlan.icon size={32} className="text-white" /> : <Zap size={32} className="text-white" />}
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isExpired ? 'bg-red-500' : 'bg-saffron-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 dark:text-white/50">
                  {isExpired ? 'Expired' : 'Active'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-stone-950 dark:text-white uppercase tracking-tighter">{currentPlan?.label || activePlan}</h2>
              <div className="flex items-center gap-4 text-stone-500 dark:text-stone-400">
                <span className="text-lg font-bold tracking-tight">₹{(currentPlan?.price || 0).toLocaleString()}<span className="text-sm font-medium opacity-50">/MO</span></span>
                {subscription?.planExpiresAt && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10">
                    <Calendar size={14} className="text-saffron-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-white/40">
                      {new Date(subscription.planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:min-w-[400px]">
            {[
              { label: 'Branches', value: subscription?.usage?.branches, icon: Zap },
              { label: 'Tables', value: subscription?.usage?.tables, icon: CreditCard },
              { label: 'Menu Items', value: subscription?.usage?.menuItems, icon: Shield },
              { label: 'Orders', value: subscription?.usage?.orders, icon: IndianRupee },
            ].map(stat => (
              <div key={stat.label} className="group/stat relative p-3 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 hover:border-saffron-500/30 transition-all duration-500">
                <p className="text-lg font-black text-stone-950 dark:text-white group-hover/stat:text-saffron-500 transition-colors">{stat.value || 0}</p>
                <p className="text-[8px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-[0.2em] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <h2 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.5em] whitespace-nowrap">
            {isExpired || isExpiringSoon ? 'Renew Plan' : 'Available Plans'}
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {PLANS.map((plan) => {
            const isCurrent = plan.name === activePlan;
            const isDowngrade = plan.name === 'STARTER' && activePlan === 'PREMIUM';

            return (
              <div
                key={plan.id}
                className={`relative group p-8 rounded-[2.5rem] border transition-all duration-700 hover:scale-[1.02] flex flex-col ${
                  isCurrent 
                    ? 'bg-white/95 dark:bg-stone-900/90 border-saffron-500 shadow-[0_20px_80px_rgba(245,158,11,0.2)]' 
                    : 'bg-white/90 dark:bg-stone-900/80 border-stone-200 dark:border-white/10 hover:border-saffron-500/30 shadow-2xl'
                }`}
              >
                {/* Decorative Background Icon */}
                <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700 pointer-events-none">
                  <plan.icon size={280} className="text-stone-950 dark:text-white" />
                </div>

                {plan.popular && !isCurrent && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 px-8 py-2 bg-saffron-500 text-black text-[10px] font-black rounded-b-3xl uppercase tracking-[0.3em] shadow-2xl">
                    ✦ Most Popular ✦
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute top-0 right-10 px-6 py-2 bg-stone-950/10 dark:bg-white/10 border border-t-0 border-stone-200 dark:border-white/20 text-stone-950 dark:text-white text-[10px] font-black rounded-b-2xl uppercase tracking-widest">
                    Current Plan
                  </div>
                )}

                <div className="relative space-y-8 flex flex-col flex-1">
                  <div className="flex items-start justify-between">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-2xl border-4 border-white/10 group-hover:scale-110 transition-transform duration-500`}>
                      <plan.icon size={32} className="text-white" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-sm font-black text-stone-500 dark:text-stone-400 mt-2">₹</span>
                        <p className="text-4xl font-black text-stone-950 dark:text-white tracking-tighter">{plan.price.toLocaleString()}</p>
                      </div>
                      <p className="text-[9px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-[0.2em]">Per Month</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-stone-950 dark:text-white uppercase tracking-tighter mb-2">{plan.label}</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 font-medium leading-relaxed max-w-[280px]">
                      {plan.name === 'STARTER'
                        ? 'Best for single location restaurants.'
                        : 'Best for multi-branch restaurant chains.'}
                    </p>
                  </div>

                  <div className="grid gap-3 flex-grow">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-3 group/feat">
                        <div className="w-5 h-5 rounded-lg bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 flex items-center justify-center group-hover/feat:border-saffron-500/50 transition-colors">
                          <Check size={12} className="text-saffron-500" />
                        </div>
                        <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider group-hover/feat:text-stone-950 dark:group-hover/feat:text-white transition-colors">{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={isCurrent && !isExpired && !isExpiringSoon}
                    className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 relative overflow-hidden group/btn ${isCurrent && !isExpired && !isExpiringSoon
                        ? 'bg-white/5 text-stone-500 cursor-not-allowed border border-white/5'
                        : `bg-white text-black hover:bg-saffron-500 hover:scale-[1.02] active:scale-95 shadow-2xl`
                      }`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isCurrent && !isExpired && !isExpiringSoon
                        ? 'Current Plan'
                        : isCurrent
                          ? `Renew Now`
                          : `Subscribe to ${plan.label}`
                      }
                      {!isCurrent && <Zap size={14} className="fill-current" />}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      <div className="glass-card rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.5em] flex items-center gap-2">
            <CreditCard size={14} className="text-saffron-500" />
            Payment History
          </h2>
        </div>

        {!payments?.length ? (
          <div className="text-center py-20 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/10">
            <Shield size={48} className="text-stone-600 mx-auto mb-4" />
            <p className="text-sm font-black text-stone-400 uppercase tracking-widest">No payments found</p>
            <p className="text-xs text-stone-500 mt-2">Your payment history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.slice(0, 3).map((p: any) => (
              <div key={p.id} className="group flex items-center justify-between p-6 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-saffron-500/10 flex items-center justify-center border border-saffron-500/20 group-hover:scale-110 transition-transform">
                    <Check size={20} className="text-saffron-500" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-stone-950 dark:text-white uppercase tracking-wider">{p.plan} Subscription</p>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest mt-0.5">{p.method}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-saffron-500">₹{p.amount?.toLocaleString()}</p>
                  <p className="text-[10px] text-stone-500 font-black uppercase tracking-tighter mt-1">{new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            ))}
            
            {payments.length > 3 && (
              <button
                onClick={() => setShowAllPayments(true)}
                className="w-full py-4 mt-2 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 text-[10px] font-black text-stone-400 hover:text-white uppercase tracking-[0.2em] transition-all"
              >
                View All Transactions ({payments.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* All Payments Modal */}
      {showAllPayments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="glass-card rounded-[3rem] p-8 w-full max-w-2xl border border-white/10 shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                  <CreditCard size={20} className="text-saffron-500" />
                  Payment History
                </h3>
                <p className="text-[10px] text-stone-500 font-black uppercase tracking-[0.2em]">
                  Full Payment History
                </p>
              </div>
              <button
                onClick={() => setShowAllPayments(false)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-all border border-white/10"
              >
                <XIcon size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-1">
              {payments.map((p: any) => (
                <div key={p.id} className="group flex items-center justify-between p-6 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-saffron-500/10 flex items-center justify-center border border-saffron-500/20 group-hover:scale-110 transition-transform">
                      <Check size={20} className="text-saffron-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-wider">{p.plan} Subscription</p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">{p.method}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-saffron-500">₹{p.amount?.toLocaleString()}</p>
                    <p className="text-[10px] text-stone-500 font-black uppercase tracking-tighter mt-1">{new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPlanInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="glass-card rounded-[3rem] p-10 w-full max-w-xl border border-white/10 shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-saffron-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative flex items-center justify-between mb-10">
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Upgrade Plan</h3>
                <p className="text-[10px] text-stone-500 font-black uppercase tracking-[0.2em]">
                  Plan: <span className="text-saffron-500">{selectedPlanInfo.label}</span>
                </p>
              </div>
              <button
                onClick={() => { setShowPaymentModal(false); setSelectedPlan(null); }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-all border border-white/10"
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="relative grid md:grid-cols-2 gap-8 mb-10">
              {/* Summary Section */}
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Base Rate</span>
                    <span className="text-sm font-black text-white">₹{selectedPlanInfo.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Tax (GST 18%)</span>
                    <span className="text-sm font-black text-white">₹{Math.round(selectedPlanInfo.price * 0.18).toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-black text-saffron-500 uppercase tracking-[0.2em]">Total Amount</span>
                    <span className="text-2xl font-black text-white">₹{Math.round(selectedPlanInfo.price * 1.18).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-saffron-500/5 border border-saffron-500/10">
                  <Shield size={16} className="text-saffron-500" />
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-wider leading-relaxed">
                    Secure payment via Razorpay.
                  </p>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em] mb-4 ml-1">Select Payment Method</p>
                {[
                  { id: 'UPI', label: 'UPI', sub: 'Fast', icon: Zap },
                  { id: 'CARD', label: 'Card', sub: 'Visa, Mastercard, etc.', icon: CreditCard },
                  { id: 'BANK_TRANSFER', label: 'Net Banking', sub: 'All Indian Banks', icon: Shield },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => handlePayment(m.id)}
                    disabled={processing}
                    className="w-full flex items-center gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-saffron-500/40 hover:bg-white/[0.06] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left group/method"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover/method:bg-saffron-500/20 transition-colors">
                      <m.icon size={18} className="text-stone-400 group-hover/method:text-saffron-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wider">{m.label}</p>
                      <p className="text-[9px] text-stone-500 font-bold uppercase tracking-tighter">{m.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {processing && (
              <div className="flex items-center gap-3 justify-center py-4 bg-saffron-500/10 border border-saffron-500/20 rounded-2xl mb-6">
                <div className="w-4 h-4 border-2 border-saffron-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-saffron-500 uppercase tracking-[0.2em]">Processing payment...</p>
              </div>
            )}

            <div className="text-center">
              <p className="text-[9px] text-stone-500 font-black uppercase tracking-[0.2em]">
                By proceeding, you agree to the terms and conditions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
