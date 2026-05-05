import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Ban, Play, Plus, X, Trash2, ShieldCheck, FileText, ExternalLink, CreditCard, AlertTriangle } from 'lucide-react';

import { fetchApi } from '../lib/api';

interface Restaurant { 
  id: string; 
  name: string; 
  slug: string; 
  plan: 'STARTER' | 'GROWTH' | 'PREMIUM'; 
  isActive: boolean; 
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';
  createdAt: string; 
  monthlyRevenue: number; 
  ownerName?: string;
  phone?: string;
  address?: string;
  panCard?: string;
  panCardUrl?: string;
  gstBill?: string;
  gstBillUrl?: string;
  registrationCertUrl?: string;
  hasPaid: boolean;
  notificationSoundUrl?: string;
  _count: { orders: number; branches: number } 
}

export default function RestaurantsPage() {
  const queryClient = useQueryClient();
  const { data: restaurants } = useQuery<{ items: Restaurant[] }>({ queryKey: ['saRestaurants'], queryFn: () => fetchApi('/superadmin/restaurants') });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRest, setSelectedRest] = useState<Restaurant | null>(null);
  const [newRest, setNewRest] = useState({ name: '', slug: '', ownerEmail: '', ownerPassword: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/superadmin/restaurants', { method: 'POST', body: JSON.stringify(newRest) });
      toast.success('Restaurant created successfully!');
      setIsModalOpen(false);
      setNewRest({ name: '', slug: '', ownerEmail: '', ownerPassword: '' });
      queryClient.invalidateQueries({ queryKey: ['saRestaurants'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create restaurant');
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      await fetchApi(`/superadmin/restaurants/${id}/suspend`, { method: 'PUT' });
      queryClient.invalidateQueries({ queryKey: ['saRestaurants'] });
      toast.success('Restaurant status updated');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`CAUTION: Are you sure you want to PERMANENTLY DELETE "${name}"? This will erase all branches, orders, and data associated with this restaurant. This action cannot be undone.`)) return;
    
    const doubleCheck = prompt('To confirm deletion, please type the restaurant name exactly:');
    if (doubleCheck !== name) {
      toast.error('Name mismatch. Deletion cancelled.');
      return;
    }

    try {
      await fetchApi(`/superadmin/restaurants/${id}`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: ['saRestaurants'] });
      toast.success('Restaurant deleted permanently');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to delete'); }
  };

  const handleApprove = async (id: string) => {
    try {
      await fetchApi(`/superadmin/restaurants/${id}/approve`, { method: 'PUT' });
      queryClient.invalidateQueries({ queryKey: ['saRestaurants'] });
      toast.success('Restaurant approved. Documents cleared for security.');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  };

  const handlePlanChange = async (id: string, plan: string) => {
    try {
      await fetchApi(`/superadmin/restaurants/${id}/plan`, { method: 'PUT', body: JSON.stringify({ plan }) });
      queryClient.invalidateQueries({ queryKey: ['saRestaurants'] });
      toast.success(`Plan updated to ${plan}`);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleUpdateDetails = async (id: string, data: { name?: string, notificationSoundUrl?: string }) => {
    setIsUpdating(true);
    try {
      await fetchApi(`/superadmin/restaurants/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      queryClient.invalidateQueries({ queryKey: ['saRestaurants'] });
      toast.success('Restaurant details updated');
    } catch (err) { 
      toast.error(err instanceof Error ? err.message : 'Failed'); 
    } finally {
      setIsUpdating(false);
    }
  };

  const [notificationSoundUrl, setNotificationSoundUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelectRest = (r: Restaurant) => {
    setSelectedRest(r);
    setNotificationSoundUrl(r.notificationSoundUrl || '');
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 p-4 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Fleet Management</h1>
          <h2 className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter uppercase leading-none">Restaurants</h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2.5 px-6 py-3 bg-primary text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl hover:shadow-2xl hover:shadow-primary/20 transition-all active:scale-95"
        >
          <Plus size={14} /> New Restaurant
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-stone-100 dark:border-primary/10 flex items-center justify-between bg-stone-50/50 dark:bg-primary/5">
          <h3 className="text-[9px] font-black text-stone-950 dark:text-white uppercase tracking-[0.2em]">Active Nodes</h3>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <div className="w-3 h-3 rounded-full bg-stone-200" />
            <div className="w-3 h-3 rounded-full bg-stone-200" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[9px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 dark:border-primary/10 bg-stone-50/30 dark:bg-primary/5">
                <th className="text-left py-4 px-6">Node Identifier</th>
                <th className="text-center py-4 px-3">Joined Date</th>
                <th className="text-center py-4 px-3">Tier Plan</th>
                <th className="text-center py-4 px-3">Cluster</th>
                <th className="text-center py-4 px-3">Revenue (30D)</th>
                <th className="text-center py-4 px-3">Traffic</th>
                <th className="text-center py-4 px-3">Connectivity</th>
                <th className="text-right py-4 px-6">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 dark:divide-primary/5">
              {restaurants?.items?.map((r) => (
                <tr key={r.id} className="group hover:bg-stone-50/50 dark:hover:bg-primary/5 transition-all">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-primary/10 flex items-center justify-center font-black text-stone-400 group-hover:text-primary transition-colors uppercase text-[11px]">
                        {r.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-stone-950 dark:text-white uppercase tracking-tighter group-hover:text-primary transition-colors">{r.name}</p>
                        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-0.5">{r.slug}.dinesmart.app</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <p className="text-[10px] font-black text-stone-950 dark:text-white uppercase tracking-tighter">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mt-1">{new Date(r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <select
                      value={r.plan}
                      onChange={(e) => handlePlanChange(r.id, e.target.value)}
                      className="bg-stone-100 dark:bg-primary/10 text-[9px] font-black text-stone-950 dark:text-white uppercase tracking-widest rounded-lg px-3 py-1.5 border-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                    >
                      <option value="STARTER">Starter</option>
                      <option value="PREMIUM">Premium</option>
                    </select>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <p className="text-[9px] font-black text-stone-950 dark:text-white uppercase tracking-widest bg-stone-100 dark:bg-primary/10 px-2.5 py-1 rounded-lg inline-block">
                      {r._count.branches} Nodes
                    </p>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <p className="text-[13px] font-black text-primary tracking-tighter">₹{r.monthlyRevenue?.toLocaleString() || '0'}</p>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <p className="text-[9px] font-black text-stone-950 dark:text-white uppercase tracking-widest">{r._count.orders} TX</p>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${r.hasPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${
                        r.hasPaid ? 'text-emerald-500' : 'text-amber-500'
                      }`}>{r.hasPaid ? 'Paid' : 'Unpaid'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => handleSelectRest(r)}
                        className={`px-3 py-1.5 flex items-center gap-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                          r.status === 'PENDING_VERIFICATION' 
                            ? 'bg-amber-500 text-white hover:bg-amber-600' 
                            : 'bg-stone-950 text-white hover:bg-stone-800'
                        }`}
                      >
                        {r.status === 'PENDING_VERIFICATION' ? <ShieldCheck size={12} /> : <FileText size={12} />}
                        {r.status === 'PENDING_VERIFICATION' ? 'Verify' : 'Intel'}
                      </button>
                      
                      <button
                        onClick={() => handleSuspend(r.id)}
                        title={r.isActive ? 'Suspend' : 'Activate'}
                        className={`p-1.5 rounded-lg transition-all active:scale-90 ${
                          r.isActive 
                            ? 'bg-stone-100 text-stone-400 hover:bg-amber-50 hover:text-amber-500' 
                            : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                        }`}
                      >
                        {r.isActive ? <Ban size={14} /> : <Play size={14} />}
                      </button>

                      <button
                        onClick={() => handleDelete(r.id, r.name)}
                        title="Delete Restaurant"
                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-stone-100 dark:border-primary/10">
              <div>
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1">Authorization</h3>
                <h4 className="text-xl font-black text-stone-950 dark:text-white uppercase tracking-tighter">Deploy New Node</h4>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2.5 bg-stone-50 dark:bg-primary/5 rounded-xl text-stone-400 hover:text-stone-950 dark:hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Entity Name</label>
                  <input required value={newRest.name} onChange={e => setNewRest({...newRest, name: e.target.value})} className="w-full bg-stone-50 dark:bg-primary/5 border-none rounded-xl px-5 py-3 text-xs font-black text-stone-950 dark:text-white uppercase tracking-tight focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5 ml-1">System Slug</label>
                  <input type="text" required value={newRest.slug} onChange={e => setNewRest({...newRest, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})} className="w-full bg-stone-50 dark:bg-primary/5 border-none rounded-xl px-5 py-3 text-xs font-black text-stone-950 dark:text-white uppercase tracking-tight focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Root Admin Email</label>
                  <input type="email" required value={newRest.ownerEmail} onChange={e => setNewRest({...newRest, ownerEmail: e.target.value})} className="w-full bg-stone-50 dark:bg-primary/5 border-none rounded-xl px-5 py-3 text-xs font-black text-stone-950 dark:text-white uppercase tracking-tight focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Access Protocol</label>
                  <input type="password" required value={newRest.ownerPassword} onChange={e => setNewRest({...newRest, ownerPassword: e.target.value})} className="w-full bg-stone-50 dark:bg-primary/5 border-none rounded-xl px-5 py-3 text-xs font-black text-stone-950 dark:text-white uppercase tracking-tight focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-primary text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-xl mt-2 hover:shadow-2xl hover:shadow-primary/20 transition-all active:scale-95">
                Initialize Deployment
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedRest && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between p-8 border-b border-stone-100 dark:border-primary/10 bg-stone-50/50 dark:bg-primary/5">
              <div>
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1">
                  {selectedRest.status === 'PENDING_VERIFICATION' ? 'Verification Hub' : 'Intelligence Report'}
                </h3>
                <h4 className="text-2xl font-black text-stone-950 dark:text-white uppercase tracking-tighter">{selectedRest.name}</h4>
              </div>
              <button 
                onClick={() => {
                  setSelectedRest(null);
                  setNotificationSoundUrl('');
                }} 
                className="p-3 bg-stone-950 text-white rounded-xl hover:bg-stone-800 transition-all active:scale-90 shadow-xl shadow-stone-950/20"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Payment & Plan Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
                  selectedRest.hasPaid ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-amber-500/5 border-amber-500/10'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedRest.hasPaid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest">Payment Status</p>
                    <p className={`text-[11px] font-black uppercase tracking-tight ${
                      selectedRest.hasPaid ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {selectedRest.hasPaid ? 'Verified Complete' : 'Pending Transaction'}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                    {selectedRest.plan.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest">Subscription</p>
                    <p className="text-[11px] font-black text-white uppercase tracking-tight">
                      {selectedRest.plan} Tier
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">Entity Head</label>
                  <p className="text-xs font-black text-stone-950 dark:text-white uppercase tracking-tight">{selectedRest.ownerName || 'PENDING'}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">Comms Channel</label>
                  <p className="text-xs font-black text-stone-950 dark:text-white uppercase tracking-tight">{selectedRest.phone || 'DISCONNECTED'}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">Target Plan</label>
                  <span className="px-3 py-1 bg-primary text-white text-[9px] font-black rounded-lg uppercase tracking-widest">{selectedRest.plan}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-stone-100 dark:border-primary/5">
                <label className="block text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">Geo Location</label>
                <p className="text-xs font-black text-stone-950 dark:text-white uppercase tracking-tight leading-relaxed">{selectedRest.address || 'UNDEFINED'}</p>
              </div>

              <div className="pt-6 border-t border-stone-100 dark:border-primary/5">
                <label className="block text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">Protocol Audio (Custom Notification URL)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="https://example.com/sound.mp3"
                    value={notificationSoundUrl}
                    onChange={(e) => setNotificationSoundUrl(e.target.value)}
                    className="flex-1 bg-stone-50 dark:bg-primary/5 border border-stone-100 dark:border-primary/10 rounded-xl px-4 py-2.5 text-[10px] font-black text-stone-950 dark:text-white uppercase tracking-tight focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <button
                    disabled={isUpdating}
                    onClick={() => {
                      handleUpdateDetails(selectedRest.id, { notificationSoundUrl });
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                  >
                    {isUpdating ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Save Tone'
                    )}
                  </button>
                </div>
                {(notificationSoundUrl || selectedRest.notificationSoundUrl) && (
                  <button 
                    onClick={() => new Audio(notificationSoundUrl || selectedRest.notificationSoundUrl).play()}
                    className="px-4 py-2 bg-stone-100 dark:bg-primary/10 rounded-xl text-stone-400 hover:text-primary transition-all active:scale-95 mt-2"
                  >
                    <Play size={14} />
                  </button>
                )}
                <p className="text-[7px] font-bold text-stone-400 uppercase tracking-widest mt-2 leading-tight">
                  ANYHOW OVERRIDE: IF EMPTY, THE SYSTEM FALLBACKS TO THE PREMIUM EMBEDDED NOTIFICATION SOUND.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-stone-100 dark:border-primary/5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Identification (PAN)</label>
                    <span className="text-[10px] font-mono text-stone-950 dark:text-white font-bold">{selectedRest.panCard || 'N/A'}</span>
                  </div>
                  {selectedRest.panCardUrl ? (
                    <div className="group relative rounded-2xl overflow-hidden border-2 border-stone-100 dark:border-primary/10 aspect-video">
                      <img src={selectedRest.panCardUrl} alt="PAN Card" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <a href={selectedRest.panCardUrl} target="_blank" rel="noreferrer" className="p-2.5 bg-white text-stone-950 rounded-xl hover:bg-primary hover:text-white transition-all shadow-xl">
                          <ExternalLink size={18} />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 rounded-2xl bg-stone-50 dark:bg-primary/5 border-2 border-dashed border-stone-100 dark:border-primary/10 flex flex-col items-center justify-center gap-2 text-stone-300">
                      {selectedRest.status === 'ACTIVE' ? <ShieldCheck size={24} className="text-emerald-500" /> : <FileText size={24} />}
                      <span className={`text-[8px] font-black uppercase tracking-widest ${selectedRest.status === 'ACTIVE' ? 'text-emerald-500' : ''}`}>
                        {selectedRest.status === 'ACTIVE' ? 'Verified Document' : 'No Document'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Fiscal ID (GST)</label>
                    <span className="text-[10px] font-mono text-stone-950 dark:text-white font-bold">{selectedRest.gstBill || 'N/A'}</span>
                  </div>
                  {selectedRest.gstBillUrl ? (
                    <div className="group relative rounded-2xl overflow-hidden border-2 border-stone-100 dark:border-primary/10 aspect-video">
                      <img src={selectedRest.gstBillUrl} alt="GST Bill" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <a href={selectedRest.gstBillUrl} target="_blank" rel="noreferrer" className="p-2.5 bg-white text-stone-950 rounded-xl hover:bg-primary hover:text-white transition-all shadow-xl">
                          <ExternalLink size={18} />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 rounded-2xl bg-stone-50 dark:bg-primary/5 border-2 border-dashed border-stone-100 dark:border-primary/10 flex flex-col items-center justify-center gap-2 text-stone-300">
                      {selectedRest.status === 'ACTIVE' ? <ShieldCheck size={24} className="text-emerald-500" /> : <FileText size={24} />}
                      <span className={`text-[8px] font-black uppercase tracking-widest ${selectedRest.status === 'ACTIVE' ? 'text-emerald-500' : ''}`}>
                        {selectedRest.status === 'ACTIVE' ? 'Verified Document' : 'No Document'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-stone-100 dark:border-primary/5">
                <label className="block text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-3">Registration Certificate</label>
                {selectedRest.registrationCertUrl ? (
                  <div className="group relative rounded-2xl overflow-hidden border-2 border-stone-100 dark:border-primary/10 aspect-[21/9]">
                    <img src={selectedRest.registrationCertUrl} alt="Certificate" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a href={selectedRest.registrationCertUrl} target="_blank" rel="noreferrer" className="p-3 bg-white text-stone-950 rounded-xl hover:bg-primary hover:text-white transition-all shadow-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        <ExternalLink size={16} /> Open Full Document
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 rounded-2xl bg-stone-50 dark:bg-primary/5 border-2 border-dashed border-stone-100 dark:border-primary/10 flex flex-col items-center justify-center gap-2 text-stone-300">
                    {selectedRest.status === 'ACTIVE' ? <ShieldCheck size={24} className="text-emerald-500" /> : <FileText size={24} />}
                    <span className={`text-[8px] font-black uppercase tracking-widest ${selectedRest.status === 'ACTIVE' ? 'text-emerald-500' : ''}`}>
                      {selectedRest.status === 'ACTIVE' ? 'Verified Document' : 'No Certificate Uploaded'}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-8">
                {selectedRest.status === 'PENDING_VERIFICATION' ? (
                  <div className="space-y-4">
                    <button 
                      onClick={() => {
                        handleApprove(selectedRest.id);
                        setSelectedRest(null);
                      }}
                      className="w-full py-5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <ShieldCheck size={18} /> Approve & Clear Documents
                    </button>
                    <p className="text-center text-[9px] font-medium text-stone-400 uppercase tracking-widest italic">
                      Notice: Approving will wipe document URLs from database as requested for security.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-6 bg-stone-50 dark:bg-primary/5 rounded-2xl border border-stone-100 dark:border-primary/10">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-center p-4">
                        {selectedRest.status === 'ACTIVE' ? (
                          <>
                            <ShieldCheck className="mx-auto mb-2 text-green-500" size={24} />
                            <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Verified Document</span>
                          </>
                        ) : (
                          <>
                            <FileText className="mx-auto mb-2 text-stone-300" size={24} />
                            <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">No Document</span>
                          </>
                        )}
                      </div>
                      <p className="text-[8px] font-black text-stone-400 uppercase tracking-[0.2em]">All documents cleared from system records</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

