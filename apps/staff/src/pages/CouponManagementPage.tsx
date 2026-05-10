import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Tag, Trash2, Plus, Percent, IndianRupee,
  Sparkles, Clock, Copy, Ticket, ChevronRight,
  TrendingUp, Calendar, Zap, AlertCircle, X
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { getCoupons, createCoupon, deleteCoupon, toggleCoupon } from '../lib/api';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { PageLoader } from '../components/PageLoader';

interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
}

export default function CouponManagementPage() {
  const queryClient = useQueryClient();
  const { restaurant } = useAuthStore();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENT',
    discountValue: '',
    minOrderValue: '0',
    maxUses: '100',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ['coupons'],
    queryFn: () => getCoupons() as Promise<Coupon[]>,
    refetchOnWindowFocus: true,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon status updated');
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon deleted');
    },
  });
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCoupon(formData);
      toast.success('Coupon created successfully');
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setIsCreating(false);
      setFormData({
        code: '', discountType: 'PERCENT', discountValue: '', minOrderValue: '0', maxUses: '100',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
      });
    } catch (err: any) {
      const message = err.details?.[0]?.message || err.message || 'Failed to create coupon';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await deleteCoupon(id);
      toast.success('Coupon deleted');
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Header Matrix */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">Marketing</p>
          </div>
          <h1 className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter uppercase leading-none">
            Discount <span className="text-stone-300 dark:text-stone-700 italic">Coupons</span>
          </h1>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="group relative px-8 py-4 bg-stone-950 dark:bg-primary text-white dark:text-stone-950 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all hover:scale-105 active:scale-95 overflow-hidden"
        >
          <div className="flex items-center gap-3 relative z-10">
            <Plus size={16} strokeWidth={3} />
            <span>Create Coupon</span>
          </div>
        </button>
      </div>

      <PageLoader isLoading={isLoading} />

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(coupons || []).map((coupon) => (
            <div key={coupon.id} className="glass-panel group relative p-6 overflow-hidden !bg-white/40 dark:!bg-stone-900/40 border-white/20 dark:border-white/5 shadow-2xl shadow-stone-200/40 dark:shadow-none transition-all duration-700 hover:scale-[1.02]">
              {/* Background Geometric Accent */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 dark:bg-primary/10 rounded-bl-[100px] -mr-16 -mt-16 transition-transform group-hover:scale-125 duration-700" />

              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-xl bg-stone-950 dark:bg-primary flex items-center justify-center text-white dark:text-stone-950 shadow-2xl transition-all duration-700 group-hover:rotate-6">
                    <Tag size={24} />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-black text-stone-950 dark:text-white tracking-tighter uppercase leading-none">{coupon.code}</h3>
                    <div 
                      onClick={() => ! (new Date(coupon.expiresAt) < new Date()) && toggleMutation.mutate(coupon.id)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-1.5 rounded-full border transition-all cursor-pointer shadow-sm",
                        new Date(coupon.expiresAt) < new Date() 
                          ? 'bg-red-500/10 text-red-500 border-red-500/20 cursor-not-allowed'
                          : coupon.isActive 
                            ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' 
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-400 border-stone-200 dark:border-white/5 hover:bg-stone-200 dark:hover:bg-stone-700'
                      )}
                    >
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all",
                        new Date(coupon.expiresAt) < new Date() ? 'bg-red-500' :
                        coupon.isActive ? 'bg-primary animate-pulse' : 'bg-stone-300 dark:bg-stone-600'
                      )} />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {new Date(coupon.expiresAt) < new Date() ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(coupon.id)}
                  className="p-3 text-stone-300 dark:text-stone-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90 border border-transparent hover:border-red-500/20"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="bg-stone-50/50 dark:bg-stone-950/40 backdrop-blur-xl rounded-3xl p-5 space-y-5 border border-stone-100 dark:border-white/5 relative z-10 group-hover:bg-white dark:group-hover:bg-stone-900 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em]">Discount</span>
                  <div className="px-4 py-1.5 bg-stone-950 dark:bg-primary rounded-xl shadow-xl">
                    <span className="font-black text-[9px] text-white dark:text-stone-950 uppercase tracking-widest">
                      {coupon.discountType === 'PERCENT' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-stone-200/50 dark:bg-white/5" />

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-stone-300 dark:text-stone-700 uppercase tracking-[0.3em]">Expires On</p>
                    <div className="flex items-center gap-3 text-[11px] font-black text-stone-950 dark:text-white uppercase tracking-tight">
                      <Clock size={12} className="text-primary" />
                      {format(new Date(coupon.expiresAt), 'dd MMM yyyy').toUpperCase()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-stone-300 dark:text-stone-700 uppercase tracking-[0.2em]">Uses</p>
                    <p className="text-xl font-black text-stone-950 dark:text-white tracking-tighter">
                      {coupon.usedCount}<span className="text-stone-300 dark:text-stone-700">/{coupon.maxUses}</span>
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => { navigator.clipboard.writeText(coupon.code); toast.success('Code copied'); }}
                className="w-full mt-6 py-4 bg-stone-50 dark:bg-stone-950/40 hover:bg-white dark:hover:bg-stone-950 border border-stone-100 dark:border-white/5 text-stone-950 dark:text-white font-black text-[9px] uppercase tracking-[0.3em] rounded-xl transition-all active:scale-95 flex items-center justify-center gap-3 group/copy shadow-sm"
              >
                <Copy size={14} className="text-stone-300 dark:text-stone-700 group-hover/copy:text-primary transition-colors" />
                Copy Code
              </button>
            </div>
          ))}

          {(!coupons || coupons.length === 0) && (
            <div className="col-span-full py-64 flex flex-col items-center justify-center text-center glass-panel !bg-white/40 dark:!bg-stone-900/40 border-dashed border-stone-200 dark:border-stone-800 rounded-[4rem]">
              <div className="w-32 h-32 bg-stone-100 dark:bg-stone-800 rounded-[3rem] flex items-center justify-center text-stone-200 dark:text-stone-900 mb-10 transition-transform hover:rotate-12 duration-1000">
                <Ticket size={64} strokeWidth={1} />
              </div>
              <div className="space-y-4 px-8">
                <h3 className="text-4xl font-black text-stone-950 dark:text-white tracking-tighter uppercase">No Coupons</h3>
                <p className="text-stone-500 dark:text-stone-400 max-w-sm mx-auto leading-relaxed font-black uppercase text-[10px] tracking-widest">
                  Create discount coupons to attract more customers.
                </p>
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="mt-12 px-12 py-5 bg-stone-950 dark:bg-primary text-white dark:text-stone-950 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-stone-950/20 dark:shadow-primary/20"
              >
                Create Coupon
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-950/40 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="glass-panel p-0 w-full max-w-md max-h-[90vh] !bg-white dark:!bg-stone-950 border-white/20 dark:border-white/10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.4)] animate-in zoom-in-95 duration-500 overflow-y-auto rounded-[2rem] scrollbar-hide relative">
            <div className="p-8 bg-stone-50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-white/5 relative overflow-hidden text-center">
              <button
                onClick={() => setIsCreating(false)}
                className="absolute top-8 right-8 p-3 text-stone-400 hover:text-stone-950 dark:hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="relative z-10 w-20 h-20 bg-white dark:bg-stone-950 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl border border-stone-100 dark:border-white/5">
                <div className="w-12 h-12 bg-stone-950 dark:bg-primary rounded-xl flex items-center justify-center text-white dark:text-stone-950 shadow-2xl">
                  <Plus size={24} strokeWidth={3} />
                </div>
              </div>
              <h3 className="text-xl font-black text-stone-950 dark:text-white tracking-tighter uppercase leading-none">New Coupon</h3>
              <p className="text-stone-400 dark:text-stone-600 text-[8px] font-black uppercase tracking-[0.4em] mt-2">Fill details</p>
            </div>

            <form onSubmit={handleCreate} className="p-6 pb-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em] ml-2">Coupon Code</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. SUMMER50"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-white/5 rounded-2xl text-stone-950 dark:text-white font-mono text-lg uppercase focus:bg-white dark:focus:bg-stone-900 focus:border-primary/50 outline-none transition-all placeholder:text-stone-200 dark:placeholder:text-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em] ml-2">Discount Type</label>
                  <div className="relative">
                    <select
                      value={formData.discountType}
                      onChange={e => setFormData({ ...formData, discountType: e.target.value as any })}
                      className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-white/5 rounded-2xl text-stone-950 dark:text-white text-[10px] font-black uppercase tracking-widest focus:bg-white dark:focus:bg-stone-900 focus:border-primary/50 outline-none appearance-none cursor-pointer"
                    >
                      <option value="PERCENT">Percentage (%)</option>
                      <option value="FLAT">Flat Amount (₹)</option>
                    </select>
                    <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 rotate-90 text-stone-400 pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em] ml-2">Discount Value</label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-700">
                      {formData.discountType === 'PERCENT' ? <Percent size={16} /> : <IndianRupee size={16} />}
                    </div>
                    <input
                      required
                      type="number"
                      min="1"
                      max={formData.discountType === 'PERCENT' ? 100 : undefined}
                      value={formData.discountValue}
                      onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                      className="w-full pl-14 pr-6 py-4 bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-white/5 rounded-2xl text-stone-950 dark:text-white font-black text-lg focus:bg-white dark:focus:bg-stone-900 focus:border-primary/50 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em] ml-2">Min Order Value</label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-700">
                      <IndianRupee size={16} />
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={formData.minOrderValue}
                      onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })}
                      className="w-full pl-14 pr-6 py-4 bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-white/5 rounded-2xl text-stone-950 dark:text-white font-black text-base focus:bg-white dark:focus:bg-stone-900 focus:border-primary/50 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em] ml-2">Max Uses</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUses}
                    onChange={e => setFormData({ ...formData, maxUses: e.target.value })}
                    className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-white/5 rounded-2xl text-stone-950 dark:text-white font-black text-base focus:bg-white dark:focus:bg-stone-900 focus:border-primary/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em] ml-2">Expiry Date</label>
                <div className="relative">
                  <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-700" size={16} />
                  <input
                    required
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full pl-14 pr-6 py-4 bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-white/5 rounded-2xl text-stone-950 dark:text-white font-black text-[10px] uppercase tracking-widest focus:bg-white dark:focus:bg-stone-900 focus:border-primary/50 outline-none transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-3 bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-xl text-[8px] font-black text-stone-500 uppercase tracking-[0.3em] transition-all border border-stone-200 dark:border-white/5"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-stone-950 dark:bg-primary text-white dark:text-stone-950 rounded-xl text-[8px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-stone-950/20 dark:shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
