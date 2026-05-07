// ═══════════════════════════════════════════
// DineSmart — Settings Page
// ═══════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getProfile, updateProfile, getBranches, getTables, getUsers, getCoupons, updateUser, deleteUser, clearOrderHistory } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { Building, Users, QrCode, Tag, Settings, Trash2, Pencil, Plus, X, Lock, AlertTriangle } from 'lucide-react';
import { TableQRCode } from '../components/TableQRCode';
import { PageLoader } from '../components/PageLoader';

export default function SettingsPage() {
  const { restaurant, user } = useAuthStore();
  const isOwner = user?.role === 'OWNER';
  const isManager = user?.role === 'MANAGER';
  const isStarterPlan = restaurant?.plan === 'STARTER';
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({ queryKey: ['profile'], queryFn: () => getProfile() });
  const { data: branches, isLoading: branchesLoading } = useQuery({ queryKey: ['branches'], queryFn: () => getBranches() });
  const { data: tables, isLoading: tablesLoading } = useQuery({ queryKey: ['tables'], queryFn: () => getTables() });

  const isLoading = profileLoading || branchesLoading || tablesLoading;
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
    enabled: isOwner || isManager, // Enable for both OWNER and MANAGER
  });
  const { data: coupons } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => getCoupons(),
    enabled: isOwner || isManager, // Enable for both OWNER and MANAGER
  });

  const [creatingType, setCreatingType] = useState<'table' | 'user' | null>(null);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', address: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [editingUser, setEditingUser] = useState<{ id: string; email: string; role: string; isActive: boolean } | null>(null);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'tables' | 'team' | 'coupons' | 'security'>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tableFormData, setTableFormData] = useState({ number: '', capacity: '', branchId: '' });
  const [userFormData, setUserFormData] = useState({ email: '', password: '', role: 'CASHIER', branchId: '' });
  const [brandingFormData, setBrandingFormData] = useState({ bannerText: '', bannerImageUrl: '' });

  // Sync profile data to branding form
  useEffect(() => {
    if (profile) {
      setBrandingFormData({
        bannerText: (profile as any).bannerText || 'WELCOME TO DINESMART — SAVOR THE EXPERIENCE',
        bannerImageUrl: (profile as any).bannerImageUrl || ''
      });
    }
  }, [profile]);


  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => updateProfile(data),
    onSuccess: () => {
      toast.success('Experience protocols updated');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err: any) => toast.error(err.message || 'Update failed')
  });

  if (isLoading) return <PageLoader />;

  const handleUpdateBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(brandingFormData);
  };

  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const toastId = toast.loading('Uploading matrix assets...');
    try {
      const res = await uploadMenuImage(formData);
      setBrandingFormData(prev => ({ ...prev, bannerImageUrl: res.url }));
      toast.success('Matrix assets synchronized', { id: toastId });
    } catch (err) {
      toast.error('Synchronization failed', { id: toastId });
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/restaurant/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBranch),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Branch added successfully');
        setShowAddBranch(false);
        setNewBranch({ name: '', address: '', phone: '' });
        queryClient.invalidateQueries({ queryKey: ['branches'] });
      } else {
        throw new Error(data.error || 'Failed to add branch');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableFormData.branchId) {
      toast.error('Please select a branch');
      return;
    }
    if (!tableFormData.number || parseInt(tableFormData.number) <= 0) {
      toast.error('Please enter a valid table number');
      return;
    }
    if (!tableFormData.capacity || parseInt(tableFormData.capacity) <= 0) {
      toast.error('Please enter a valid capacity');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/restaurant/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          number: parseInt(tableFormData.number),
          capacity: parseInt(tableFormData.capacity),
          branchId: tableFormData.branchId
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to create table');
      toast.success(`Table #${tableFormData.number} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setCreatingType(null);
      setTableFormData({ number: '', capacity: '', branchId: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create table');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTable = async (tableId: string, tableNumber: number) => {
    if (!confirm(`Delete Table #${tableNumber}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/v1/restaurant/tables/${tableId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`Table #${tableNumber} deleted`);
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete table');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.email || !userFormData.password) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/restaurant/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...userFormData,
          branchId: userFormData.branchId || undefined
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to invite user');
      toast.success('User invited successfully!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreatingType(null);
      setUserFormData({ email: '', password: '', role: 'CASHIER', branchId: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to invite user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Remove team member ${userEmail}? This cannot be undone.`)) return;
    try {
      await deleteUser(userId);
      toast.success(`${userEmail} removed from team`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove user');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      await updateUser(editingUser.id, { role: editingUser.role as any, isActive: editingUser.isActive });
      toast.success('Team member updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearHistory = async () => {
    setClearingHistory(true);
    try {
      const result = await clearOrderHistory() as any;
      toast.success(`${result.archivedCount} orders cleared successfully`);
      queryClient.invalidateQueries({ queryKey: ['overview'] });
      setConfirmClear(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear order history');
    } finally {
      setClearingHistory(false);
    }
  };

  // Build the QR menu URL for a table using slug + table ID
  const getMenuUrl = (tableId: string) => {
    let base = testUrl || (import.meta as any).env.VITE_CUSTOMER_URL;
    if (!base) {
      const { origin, hostname } = window.location;
      if (hostname.includes('staff')) {
        base = origin.replace('staff', 'customer');
      } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        base = origin.replace(/:\d+$/, ':5173');
      } else {
        base = origin;
      }
    }
    return `${base}/menu/${restaurant?.slug}?tableId=${tableId}`;
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-saffron-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <p className="text-[9px] font-black text-saffron-500 uppercase tracking-[0.4em]">Operational Matrix</p>
          </div>
          <h1 className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter uppercase leading-none">
            Systems <span className="text-stone-300 dark:text-stone-700 italic">Settings</span>
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-stone-100/50 dark:bg-stone-900/50 p-1.5 rounded-[2.5rem] border border-stone-200/50 dark:border-white/5 backdrop-blur-xl shadow-inner">
          {[
            { id: 'general', label: 'General', icon: Settings, roles: ['OWNER', 'MANAGER'] },
            { id: 'tables', label: 'Tables', icon: QrCode, roles: ['OWNER', 'MANAGER'] },
            { id: 'team', label: 'Team', icon: Users, roles: ['OWNER', 'MANAGER'] },
            { id: 'coupons', label: 'Incentives', icon: Tag, roles: ['OWNER', 'MANAGER'] },
            { id: 'security', label: 'Security', icon: AlertTriangle, roles: ['OWNER', 'MANAGER'], color: 'text-red-500' }
          ].filter(t => t.roles.includes(user?.role || '')).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                activeTab === tab.id
                  ? 'bg-stone-950 dark:bg-white text-white dark:text-stone-950 shadow-xl scale-105'
                  : `text-stone-400 hover:text-stone-950 dark:hover:text-white ${tab.color || ''}`
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden md:block">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative min-h-[600px]">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start animate-in fade-in zoom-in-95 duration-700">
            <div className="lg:col-span-8 space-y-8">
              <div className="glass-card p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-saffron-500/5 rounded-full -mr-48 -mt-48 blur-[120px]" />
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-[11px] font-black text-stone-400 dark:text-stone-500 flex items-center gap-4 uppercase tracking-[0.6em]">
                    <Building size={16} className="text-saffron-500" /> Identity Core
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] ml-1">Entity Designation</label>
                    <div className="p-5 bg-stone-50/50 dark:bg-stone-900/50 rounded-2xl border border-stone-100 dark:border-white/5 font-black text-xl text-stone-950 dark:text-white tracking-tight uppercase">{restaurant?.name}</div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] ml-1">Spatial Slug</label>
                    <div className="p-5 bg-stone-50/50 dark:bg-stone-900/50 rounded-2xl border border-stone-100 dark:border-white/5 font-mono text-xs text-saffron-500 font-black tracking-widest">{restaurant?.slug}</div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] ml-1">Service Tier</label>
                    <div className="flex items-center gap-4 p-5 bg-stone-950 dark:bg-white text-white dark:text-stone-950 rounded-2xl font-black text-xs uppercase tracking-widest">{restaurant?.plan}</div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] ml-1">Access Protocol</label>
                    <div className="p-5 bg-saffron-500/10 text-saffron-500 rounded-2xl border border-saffron-500/20 font-black text-xs uppercase tracking-widest">{user?.role}</div>
                  </div>
                </div>
              </div>

              {/* Experience Branding (Only for Owner/Manager) */}
              {(isOwner || isManager) && (
                <div className="glass-card p-10 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-64 h-64 bg-saffron-500/5 rounded-full -ml-32 -mt-32 blur-[80px]" />
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-[11px] font-black text-stone-400 dark:text-stone-500 flex items-center gap-4 uppercase tracking-[0.6em]">
                      <Tag size={16} className="text-saffron-500" /> Experience Branding
                    </h2>
                  </div>
                  
                  <form onSubmit={handleUpdateBranding} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] ml-1">Top Banner Text</label>
                        <input 
                          type="text" 
                          value={brandingFormData.bannerText}
                          onChange={e => setBrandingFormData({ ...brandingFormData, bannerText: e.target.value })}
                          placeholder="e.g. FLAT 20% OFF ON ALL ORDERS"
                          className="w-full px-6 py-4 bg-stone-50/50 dark:bg-stone-900/50 border border-stone-100 dark:border-white/5 rounded-2xl text-stone-950 dark:text-white focus:border-saffron-500/50 transition-all font-black uppercase tracking-widest text-xs"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] ml-1">Visual Branding Asset</label>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleBannerSelect}
                          accept="image/*"
                          className="hidden"
                        />
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="relative aspect-[21/9] rounded-3xl border-2 border-dashed border-stone-200 dark:border-white/10 overflow-hidden cursor-pointer group/upload hover:border-saffron-500/50 transition-all bg-stone-50/50 dark:bg-stone-900/50"
                        >
                          {brandingFormData.bannerImageUrl ? (
                            <>
                              <img 
                                src={brandingFormData.bannerImageUrl} 
                                alt="Banner Preview" 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/upload:scale-110"
                              />
                              <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <div className="flex flex-col items-center gap-2">
                                  <Pencil size={24} className="text-white" />
                                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Replace Asset</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBrandingFormData(prev => ({ ...prev, bannerImageUrl: '' }));
                                }}
                                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover/upload:opacity-100 transition-opacity hover:bg-red-600 shadow-xl"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                              <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-white/5 flex items-center justify-center text-stone-400 group-hover/upload:scale-110 group-hover/upload:text-saffron-500 transition-all">
                                <Plus size={24} />
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] font-black text-stone-950 dark:text-white uppercase tracking-widest">Deploy Banner Asset</p>
                                <p className="text-[8px] text-stone-400 font-bold uppercase tracking-[0.2em] mt-1">Recommended: 21:9 Aspect Ratio</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                        className="glass-button px-10 py-4 text-[10px] font-black uppercase tracking-[0.4em] disabled:opacity-50"
                      >
                        {updateProfileMutation.isPending ? 'Syncing...' : 'Update Branding Matrix'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Branch Network (Inside General for Owner/Manager) */}
              {(isOwner || isManager) && (
                <div className="glass-card p-10">
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-[11px] font-black text-stone-400 dark:text-stone-500 flex items-center gap-4 uppercase tracking-[0.6em]">
                      <Building size={16} className="text-saffron-500" /> Branch Network
                    </h2>
                    {isOwner && (
                      <button onClick={() => setShowAddBranch(true)} className="glass-button px-6 py-3 text-[10px]">+ Deploy Node</button>
                    )}
                  </div>
                  <div className="space-y-6">
                    {(branches as any[])?.filter(br => {
                      if (isManager && user?.branchId && br.id !== user.branchId) return false;
                      return true;
                    }).map((br) => (
                      <div key={br.id} className="p-8 bg-stone-50/50 dark:bg-stone-900/50 rounded-[3rem] border border-stone-100 dark:border-white/5">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                          <div className="flex-1 text-center md:text-left">
                            <h3 className="text-2xl font-black text-stone-950 dark:text-white uppercase tracking-tight mb-2">{br.name}</h3>
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">{br.address}</p>
                          </div>
                          <div className="flex flex-wrap justify-center gap-8 bg-white/50 dark:bg-stone-800/50 p-6 rounded-3xl border border-white/80 dark:border-white/5">
                            {[
                              { label: 'Verify', key: 'requireOrderVerification' },
                              { label: 'Modify', key: 'allowOrderModification' }
                            ].map((toggle) => (
                              <label key={toggle.key} className="flex flex-col items-center gap-3 cursor-pointer group/toggle">
                                <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">{toggle.label}</span>
                                <div className="relative inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={(br as any)[toggle.key]}
                                    onChange={async (e) => {
                                      try {
                                        await fetch(`/api/v1/restaurant/branches/${br.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ [toggle.key]: e.target.checked }),
                                          credentials: 'include'
                                        });
                                        toast.success('Sync Complete');
                                        queryClient.invalidateQueries({ queryKey: ['branches'] });
                                      } catch (err) { toast.error('Sync Failed'); }
                                    }}
                                    className="sr-only peer"
                                  />
                                  <div className="premium-toggle"></div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              <div className="glass-card p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-saffron-500/10 rounded-full -mr-16 -mt-16 blur-[60px]" />
                <div className="relative z-10">
                  <h2 className="text-[11px] font-black text-stone-400 dark:text-stone-500 flex items-center gap-3 uppercase tracking-[0.4em] mb-8">
                    <Settings size={14} className="text-saffron-500" /> System Info
                  </h2>
                  <div className="space-y-6">
                    <div className="p-5 bg-stone-50/50 dark:bg-stone-900/50 rounded-2xl border border-stone-100 dark:border-white/5">
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">Operator</p>
                      <p className="text-sm font-black text-stone-950 dark:text-white tracking-tight truncate">{user?.email}</p>
                    </div>
                    <div className="p-5 bg-stone-50/50 dark:bg-stone-900/50 rounded-2xl border border-stone-100 dark:border-white/5">
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">Branches</p>
                      <p className="text-2xl font-black text-saffron-500 tracking-tighter">{(branches as any[])?.length || 0}</p>
                    </div>
                    <div className="p-5 bg-stone-50/50 dark:bg-stone-900/50 rounded-2xl border border-stone-100 dark:border-white/5">
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">Tables</p>
                      <p className="text-2xl font-black text-saffron-500 tracking-tighter">{(tables as any[])?.length || 0}</p>
                    </div>
                    <div className="p-5 bg-stone-50/50 dark:bg-stone-900/50 rounded-2xl border border-stone-100 dark:border-white/5">
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">Team</p>
                      <p className="text-2xl font-black text-saffron-500 tracking-tighter">{(users as any[])?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="glass-card p-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                <div>
                  <h2 className="text-[11px] font-black text-stone-400 dark:text-stone-500 flex items-center gap-4 uppercase tracking-[0.6em]">
                    <QrCode size={16} className="text-saffron-500" /> Spatial Grid
                  </h2>
                  <p className="text-[9px] font-black text-stone-300 dark:text-stone-600 mt-2 uppercase tracking-[0.2em] ml-8">QR Matrix Synchronization</p>
                </div>
                <div className="flex items-center gap-6">
                  {isOwner && (
                    <div className="relative group/override">
                      <input
                        type="text"
                        placeholder="NETWORK OVERRIDE URL"
                        value={testUrl}
                        onChange={(e) => setTestUrl(e.target.value)}
                        className="px-8 py-4 bg-stone-50 dark:bg-stone-900/50 rounded-2xl text-[10px] border border-stone-100 dark:border-white/5 outline-none focus:border-saffron-500 font-black tracking-[0.2em] w-80 shadow-inner"
                      />
                    </div>
                  )}
                  <button onClick={() => setCreatingType('table')} className="glass-button px-8 py-4 text-[10px] font-black">+ Add Anchor</button>
                </div>
              </div>

              {tablesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-96 bg-stone-100 dark:bg-white/5 rounded-[3rem] animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 justify-items-center">
                  {(tables as any[])?.sort((a, b) => a.number - b.number).map((t) => (
                    <div key={t.id} className="relative group/table w-full flex justify-center">
                      {(isOwner || isManager) && (
                        <button
                          onClick={() => handleDeleteTable(t.id, t.number)}
                          className="absolute top-6 right-6 z-20 p-3 rounded-xl bg-white dark:bg-stone-900 text-stone-300 dark:text-stone-700 hover:text-red-500 transition-all opacity-0 group-hover/table:opacity-100 shadow-xl border border-stone-100 dark:border-white/5"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <TableQRCode
                        tableNumber={t.number}
                        qrCodeUrl={getMenuUrl(t.id)}
                        baseUrlOverride={testUrl || undefined}
                      />
                    </div>
                  ))}
                  {(!tables || (tables as any[]).length === 0) && (
                    <div className="col-span-full text-center py-40 border-2 border-dashed border-stone-200 dark:border-white/5 rounded-[4rem]">
                      <QrCode size={64} className="text-stone-200 dark:text-stone-800 mx-auto mb-6" />
                      <p className="text-xs font-black text-stone-400 uppercase tracking-[0.5em]">No Spatial Anchors Found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (isOwner || isManager) && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="glass-card p-10">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-[11px] font-black text-stone-400 dark:text-stone-500 flex items-center gap-4 uppercase tracking-[0.6em]">
                  <Users size={16} className="text-saffron-500" /> Personnel Matrix
                </h2>
                <button onClick={() => setCreatingType('user')} className="glass-button px-8 py-4 text-[10px] font-black">+ Onboard Team Member</button>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {(users as any[])?.filter(u => {
                  // If manager, hide all owners ("admin details")
                  if (isManager && u.role === 'OWNER') return false;
                  return true;
                }).map((u) => (
                  <div key={u.id} className="p-8 bg-stone-50/50 dark:bg-stone-900/50 rounded-[2.5rem] border border-stone-100 dark:border-white/5 group/user relative">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-stone-950 dark:bg-white flex items-center justify-center text-white dark:text-stone-950 text-2xl font-black shadow-2xl">
                        {u.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-right">
                        <span className="px-4 py-1.5 rounded-full text-[9px] font-black bg-saffron-500 text-white uppercase tracking-widest">{u.role}</span>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-3">{u.branch?.name || 'GLOBAL'}</p>
                      </div>
                    </div>
                    <p className="text-lg font-black text-stone-950 dark:text-white uppercase tracking-tight mb-8 truncate">{u.email}</p>
                    <div className="flex items-center gap-4">
                      {u.email !== user?.email && (isOwner || (isManager && u.role !== 'MANAGER' && u.role !== 'OWNER')) && (
                        <>
                          <button onClick={() => setEditingUser({ id: u.id, email: u.email, role: u.role, isActive: u.isActive })} className="flex-1 py-4 bg-stone-100 dark:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-white/10 transition-all">Edit Clearance</button>
                          <button onClick={() => handleDeleteUser(u.id, u.email)} className="p-4 text-stone-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Incentives Tab */}
        {activeTab === 'coupons' && (isOwner || isManager) && (
          <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-700">
            <div className="glass-card p-10">
              <h2 className="text-[11px] font-black text-stone-400 dark:text-stone-500 mb-12 flex items-center gap-4 uppercase tracking-[0.6em]">
                <Tag size={16} className="text-saffron-500" /> Reward Protocols
              </h2>
              <div className="grid gap-6">
                {(coupons as any[])?.map((c) => (
                  <div key={c.id} className="p-8 bg-stone-50/50 dark:bg-stone-900/50 rounded-[2.5rem] border border-stone-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <div className="w-16 h-16 rounded-2xl bg-saffron-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-saffron-500/20">
                        {c.discountType === 'PERCENT' ? '%' : '₹'}
                      </div>
                      <div>
                        <p className="text-2xl font-black text-stone-950 dark:text-white tracking-tighter uppercase">{c.code}</p>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{c.discountValue}{c.discountType === 'PERCENT' ? '%' : ' OFF'} • ACTIVE ON {c.usedCount}/{c.maxUses}</p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${c.isActive ? 'bg-saffron-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-stone-300 dark:bg-stone-700'}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (isOwner || isManager) && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="glass-card p-12 border-red-500/20 bg-red-500/[0.02]">
              <div className="flex flex-col items-center text-center space-y-8">
                <div className="w-24 h-24 rounded-[2.5rem] bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner">
                  <AlertTriangle size={48} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-stone-950 dark:text-white uppercase tracking-tighter mb-4">Total Wipe Protocol</h2>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-widest leading-loose max-w-md">This action initiates a permanent erasure of all operational logs and historical data nodes. This protocol is absolute and cannot be reversed.</p>
                </div>

                {!confirmClear ? (
                  <button onClick={() => setConfirmClear(true)} className="w-full py-8 bg-red-500 text-white rounded-[2.5rem] text-xs font-black uppercase tracking-[0.4em] hover:bg-red-600 shadow-2xl shadow-red-500/20 transition-all active:scale-95">Initialize Protocol</button>
                ) : (
                  <div className="w-full grid grid-cols-2 gap-6 animate-in zoom-in-95">
                    <button onClick={handleClearHistory} className="py-8 bg-red-600 text-white rounded-[2.5rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-red-700">CONFIRM WIPE</button>
                    <button onClick={() => setConfirmClear(false)} className="py-8 bg-stone-100 dark:bg-stone-800 text-stone-500 rounded-[2.5rem] text-xs font-black uppercase tracking-[0.2em]">ABORT</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Infrastructure ──────────────────────────────── */}

      {(creatingType || editingUser || showAddBranch) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-950/20 backdrop-blur-md animate-in fade-in duration-700">
          <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-3xl rounded-[4rem] p-16 w-full max-w-xl border border-white dark:border-white/5 shadow-2xl animate-in zoom-in-95 duration-1000 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-saffron-500/5 rounded-full -mr-32 -mt-32 blur-[100px]" />

            <div className="flex items-center justify-between mb-12 relative z-10">
              <h3 className="text-3xl font-black text-stone-950 dark:text-white uppercase tracking-tighter leading-none">
                {creatingType === 'table' ? 'Spatial Anchor' :
                  creatingType === 'user' ? 'Team Onboard' :
                    editingUser ? 'Clearance Protocol' : 'Node Deployment'}
              </h3>
              <button
                onClick={() => { setCreatingType(null); setEditingUser(null); setShowAddBranch(false); }}
                className="w-12 h-12 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-white/5 rounded-full transition-all text-stone-300 dark:text-stone-700 hover:text-stone-900 dark:hover:text-white active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            <div className="relative z-10">
              {creatingType === 'table' && (
                <form onSubmit={handleCreateTable} className="space-y-10">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] ml-3">Deployment Node</label>
                    <select
                      required
                      value={tableFormData.branchId}
                      onChange={e => setTableFormData({ ...tableFormData, branchId: e.target.value })}
                      className="w-full px-10 py-6 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-white/5 rounded-[2rem] text-stone-950 dark:text-white font-black outline-none focus:border-saffron-500 shadow-inner appearance-none transition-all"
                    >
                      <option value="">Select Target Branch</option>
                      {(branches as any[])?.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] ml-3">Unit ID</label>
                      <input required type="number" min="1" placeholder="01" value={tableFormData.number} onChange={e => setTableFormData({ ...tableFormData, number: e.target.value })} className="w-full px-10 py-6 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-white/5 rounded-[2rem] text-stone-950 dark:text-white font-black outline-none focus:border-saffron-500 shadow-inner transition-all" />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] ml-3">Capacity</label>
                      <input required type="number" min="1" placeholder="04" value={tableFormData.capacity} onChange={e => setTableFormData({ ...tableFormData, capacity: e.target.value })} className="w-full px-10 py-6 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-white/5 rounded-[2rem] text-stone-950 dark:text-white font-black outline-none focus:border-saffron-500 shadow-inner transition-all" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-saffron-500 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-amber-600 shadow-2xl shadow-saffron-500/20 transition-all active:scale-95 mt-4">
                    Synchronize Anchor
                  </button>
                </form>
              )}

              {creatingType === 'user' && (
                <form onSubmit={handleCreateUser} className="space-y-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] ml-3">Access Node</label>
                    <select
                      value={userFormData.branchId}
                      onChange={e => setUserFormData({ ...userFormData, branchId: e.target.value })}
                      className="w-full px-10 py-6 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-white/5 rounded-[2rem] text-stone-950 dark:text-white font-black outline-none focus:border-saffron-500 shadow-inner transition-all"
                    >
                      <option value="">Global Network Access</option>
                      {(branches as any[])?.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] ml-3">Identifier</label>
                    <input required type="email" placeholder="operator@dinesmart.ai" value={userFormData.email} onChange={e => setUserFormData({ ...userFormData, email: e.target.value })} className="w-full px-10 py-6 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-white/5 rounded-[2rem] text-stone-950 dark:text-white font-black outline-none focus:border-saffron-500 shadow-inner transition-all" />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] ml-3">Security Key</label>
                    <input required type="password" placeholder="••••••••" value={userFormData.password} onChange={e => setUserFormData({ ...userFormData, password: e.target.value })} className="w-full px-10 py-6 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-white/5 rounded-[2rem] text-stone-950 dark:text-white font-black outline-none focus:border-saffron-500 shadow-inner transition-all" />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] ml-3">Clearance Protocol</label>
                    <select value={userFormData.role} onChange={e => setUserFormData({ ...userFormData, role: e.target.value })} className="w-full px-10 py-6 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-white/5 rounded-[2rem] text-stone-950 dark:text-white font-black outline-none focus:border-saffron-500 shadow-inner transition-all">
                      {isOwner && <option value="MANAGER">Manager</option>}
                      <option value="CASHIER">Cashier</option>
                      <option value="KITCHEN_STAFF">Kitchen Staff</option>
                    </select>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="glass-button w-full py-6 mt-6">
                    Authorize Operator
                  </button>
                </form>
              )}

              {editingUser && (
                <form onSubmit={handleEditUser} className="space-y-10">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] ml-3">Identity Matrix</label>
                    <p className="px-10 py-6 bg-stone-100/50 dark:bg-stone-950 rounded-[2rem] text-stone-950 dark:text-white text-sm font-black border border-stone-100 dark:border-white/5 shadow-inner tracking-tight">{editingUser.email}</p>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] ml-3">Clearance Level</label>
                    <select
                      value={editingUser.role}
                      onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full px-10 py-6 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-white/5 rounded-[2rem] text-stone-950 dark:text-white font-black outline-none focus:border-saffron-500 shadow-inner transition-all"
                    >
                      {(isOwner || (isManager && editingUser.role === 'MANAGER')) && <option value="MANAGER">Manager</option>}
                      <option value="CASHIER">Cashier</option>
                      <option value="KITCHEN_STAFF">Kitchen Staff</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] ml-3">Network State</label>
                    <select
                      value={editingUser.isActive ? 'active' : 'inactive'}
                      onChange={e => setEditingUser({ ...editingUser, isActive: e.target.value === 'active' })}
                      className="w-full px-10 py-6 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-white/5 rounded-[2rem] text-stone-950 dark:text-white font-black outline-none focus:border-saffron-500 shadow-inner transition-all"
                    >
                      <option value="active">Operational</option>
                      <option value="inactive">Deactivated</option>
                    </select>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="glass-button w-full py-6 mt-6">
                    Commit Protocol
                  </button>
                </form>
              )}

              {showAddBranch && (
                <form onSubmit={handleAddBranch} className="space-y-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] ml-3">Node Designation</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nexus Prime"
                      value={newBranch.name}
                      onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                      className="w-full px-10 py-6 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-white/5 rounded-[2rem] text-stone-950 dark:text-white font-black outline-none focus:border-saffron-500 shadow-inner transition-all placeholder:text-stone-200 dark:placeholder:text-stone-800"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] ml-3">Spatial Address</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Coordinates / Street Address"
                      value={newBranch.address}
                      onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                      className="w-full px-10 py-6 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-white/5 rounded-[2rem] text-stone-950 dark:text-white font-black outline-none focus:border-saffron-500 shadow-inner transition-all placeholder:text-stone-200 dark:placeholder:text-stone-800 resize-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] ml-3">Communications Link</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 000 000 0000"
                      value={newBranch.phone}
                      onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                      className="w-full px-10 py-6 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-white/5 rounded-[2rem] text-stone-950 dark:text-white font-black outline-none focus:border-saffron-500 shadow-inner transition-all placeholder:text-stone-200 dark:placeholder:text-stone-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-6 bg-saffron-500 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-amber-600 shadow-2xl shadow-saffron-500/20 transition-all active:scale-95 mt-8"
                  >
                    Authorize Node Deployment
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}