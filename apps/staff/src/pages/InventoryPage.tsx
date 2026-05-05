// ═══════════════════════════════════════════
// DineSmart — Inventory Management
// ═══════════════════════════════════════════

import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  getInventoryItems, 
  getInventoryAlerts, 
  updateStock, 
  createInventoryItem, 
  deleteInventoryItem,
  getBranches,
  getInventoryCategories,
  createInventoryCategory,
  deleteInventoryCategory
} from '../lib/api';
import toast from 'react-hot-toast';
import { 
  AlertTriangle, Package, Plus, Search, 
  History, Boxes, X, Trash2,
  FolderPlus, Layers, Zap, Edit2, Activity, Box, RefreshCw, IndianRupee
} from 'lucide-react';
import { cn } from '../lib/utils';
import { PageLoader } from '../components/PageLoader';

interface InventoryItem {
  id: string; 
  name: string; 
  unit: string; 
  currentStock: number; 
  minThreshold: number; 
  costPrice: number;
  branch: { name: string };
  branchId: string;
  categoryId: string | null;
  category: { name: string } | null;
  menuItemInventory: Array<{ menuItem: { id: string; name: string } }>;
}

interface InventoryCategory {
  id: string;
  name: string;
  _count: { inventoryItems: number };
}

interface Branch {
  id: string;
  name: string;
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [adjusting, setAdjusting] = useState<{ id: string; name: string; current: number; unit: string; qty: string; reason: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    currentStock: '',
    minThreshold: '',
    costPrice: '',
    branchId: '',
    categoryId: ''
  });

  const [catFormData, setCatFormData] = useState({ name: '' });

  // Queries
  const { data: items, isLoading: itemsLoading } = useQuery<InventoryItem[]>({ 
    queryKey: ['inventory'], 
    queryFn: () => getInventoryItems() as Promise<InventoryItem[]> 
  });
  
  const { data: alerts, isLoading: alertsLoading } = useQuery<InventoryItem[]>({ 
    queryKey: ['inventoryAlerts'], 
    queryFn: () => getInventoryAlerts() as Promise<InventoryItem[]> 
  });

  const { data: branches, isLoading: branchesLoading } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: () => getBranches() as Promise<Branch[]>
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<InventoryCategory[]>({
    queryKey: ['inventoryCategories'],
    queryFn: () => getInventoryCategories() as Promise<InventoryCategory[]>
  });

  const isLoading = itemsLoading || alertsLoading || branchesLoading || categoriesLoading;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => createInventoryItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsCreating(false);
      setFormData({ name: '', unit: 'kg', currentStock: '', minThreshold: '', costPrice: '', branchId: '', categoryId: '' });
      toast.success('New product added to inventory');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add item'),
  });

  const createCatMutation = useMutation({
    mutationFn: (data: { name: string }) => createInventoryCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryCategories'] });
      setIsCreatingCategory(false);
      setCatFormData({ name: '' });
      toast.success('Category created');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create category'),
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: string) => deleteInventoryCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryCategories'] });
      toast.success('Category removed');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete category'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInventoryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item removed');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete item'),
  });

  const handleStockUpdate = async () => {
    if (!adjusting || !adjusting.qty || !adjusting.reason) { toast.error('Fill all fields'); return; }
    try {
      await updateStock(adjusting.id, parseFloat(adjusting.qty), adjusting.reason);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] });
      setAdjusting(null);
      toast.success('Stock level optimized');
    } catch { toast.error('Failed to update stock'); }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      currentStock: parseFloat(formData.currentStock),
      minThreshold: parseFloat(formData.minThreshold),
      costPrice: parseFloat(formData.costPrice),
      categoryId: formData.categoryId || null
    });
  };

  const filteredItems = items?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = items?.filter(i => i.currentStock <= i.minThreshold).length || 0;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <PageLoader isLoading={isLoading} />
      
      {!isLoading && (
        <>
      {/* Dynamic Header Matrix */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-black text-stone-950 dark:text-white tracking-tighter uppercase leading-none">Resource <span className="text-primary italic">Manifest</span></h1>
          <p className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] ml-1">Inventory Control & Supply Chain Protocol</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCreatingCategory(true)}
            className="px-4 py-2 bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-white/5 rounded-lg text-[9px] font-black uppercase tracking-[0.3em] hover:bg-stone-100 dark:hover:bg-stone-800 transition-all active:scale-95 flex items-center gap-2"
          >
            <FolderPlus size={14} /> New Category
          </button>
          <button 
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-stone-950 dark:bg-primary text-white dark:text-stone-950 rounded-lg text-[9px] font-black uppercase tracking-[0.3em] hover:bg-primary dark:hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-stone-950/10 dark:shadow-primary/10"
          >
            <Plus size={14} /> Add Asset
          </button>
        </div>
      </div>

      {/* Stats Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Assets', val: items?.length || 0, icon: Box, color: 'text-stone-950 dark:text-white', bg: 'bg-stone-100 dark:bg-stone-800' },
          { label: 'Asset Value', val: `₹${(items?.reduce((sum, item) => sum + (item.currentStock * item.costPrice), 0) || 0).toLocaleString()}`, icon: IndianRupee, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Critical Value', val: `₹${(items?.filter(i => i.currentStock <= i.minThreshold).reduce((sum, item) => sum + (item.currentStock * item.costPrice), 0) || 0).toLocaleString()}`, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Active Clusters', val: categories?.length || 0, icon: Boxes, color: 'text-primary', bg: 'bg-primary/10' },
        ].map((stat, idx) => (
          <div key={idx} className="glass-card group relative p-4 overflow-hidden border border-stone-100 dark:border-white/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary/10 transition-all duration-1000" />
            <div className="relative z-10 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center border border-white/20 dark:border-white/5 shadow-inner`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-[8px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em]">{stat.label}</p>
                <p className="text-lg font-black text-stone-950 dark:text-white tracking-tighter leading-none mt-1">{stat.val}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Inventory Table */}
      <div className="glass-panel overflow-hidden group border border-stone-100 dark:border-white/5">
        <div className="p-4 border-b border-stone-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-50/30 dark:bg-stone-900/30">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-700" />
            <input 
              type="text" 
              placeholder="SEARCH RESOURCE ARCHIVE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-white/5 rounded-lg text-[9px] font-black uppercase tracking-[0.3em] focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-stone-950 dark:text-white placeholder:text-stone-300 dark:placeholder:text-stone-700 shadow-inner"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap ${
                categoryFilter === 'all' 
                ? 'bg-stone-950 dark:bg-primary text-white dark:text-stone-950' 
                : 'bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 border border-stone-100 dark:border-white/5'
              }`}
            >
              ALL ITEMS
            </button>
            {categories?.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap ${
                  categoryFilter === cat.id 
                  ? 'bg-stone-950 dark:bg-primary text-white dark:text-stone-950' 
                  : 'bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 border border-stone-100 dark:border-white/5'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[9px] font-black text-stone-400 dark:text-stone-500 border-b border-stone-100 dark:border-white/5 bg-stone-50/20 dark:bg-stone-900/20">
                <th className="text-left py-4 px-6 uppercase tracking-[0.3em]">Asset Metadata</th>
                <th className="text-left py-4 px-2 uppercase tracking-[0.3em]">Category</th>
                <th className="text-center py-4 px-2 uppercase tracking-[0.3em]">Quant Level</th>
                <th className="text-center py-4 px-2 uppercase tracking-[0.3em]">Threshold</th>
                <th className="text-right py-4 px-2 uppercase tracking-[0.3em]">Unit Cost</th>
                <th className="text-right py-4 px-2 uppercase tracking-[0.3em]">Total Value</th>
                <th className="text-center py-4 px-2 uppercase tracking-[0.3em]">State</th>
                <th className="text-right py-4 px-6 uppercase tracking-[0.3em]">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-white/5">
              {filteredItems?.map((item) => {
                const isLow = item.currentStock <= item.minThreshold;
                const totalValue = (item.currentStock || 0) * (item.costPrice || 0);
                return (
                  <tr key={item.id} className="hover:bg-stone-50/50 dark:hover:bg-white/5 transition-colors group/row">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center border border-stone-50 dark:border-white/5 shadow-inner transition-colors",
                          isLow ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-600"
                        )}>
                          <Package size={14} />
                        </div>
                        <div>
                          <p className="font-black text-stone-950 dark:text-white uppercase tracking-tight text-[11px]">{item.name}</p>
                          <p className="text-[8px] font-mono text-stone-300 dark:text-stone-700 tracking-tighter uppercase">ID-{item.id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-[9px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-[0.2em] px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded-md">
                        {item.category?.name || 'NONE'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-[12px] font-black tracking-tighter ${isLow ? 'text-red-500' : 'text-stone-950 dark:text-white'}`}>
                          {item.currentStock}
                        </span>
                        <span className="text-[7px] font-black text-stone-300 dark:text-stone-700 uppercase tracking-[0.2em]">{item.unit}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center text-[10px] font-black text-stone-400 dark:text-stone-600 font-mono tracking-tighter">
                      {item.minThreshold} {item.unit}
                    </td>
                    <td className="py-3 px-2 text-right font-black text-stone-950 dark:text-white text-[12px] tracking-tighter font-mono">
                      ₹{(item.costPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right font-black text-stone-950 dark:text-white text-[12px] tracking-tighter font-mono">
                      ₹{totalValue.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {isLow ? (
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded-md text-[7px] font-black uppercase tracking-[0.3em] border border-red-500/20">CRITICAL</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-md text-[7px] font-black uppercase tracking-[0.3em] border border-green-500/20">NOMINAL</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setAdjusting({ id: item.id, name: item.name, current: item.currentStock, unit: item.unit, qty: '', reason: '' })}
                          className="px-3 py-1 bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-100 dark:border-white/5 rounded-md text-[8px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-stone-950 transition-all"
                        >
                          Adjust
                        </button>
                        <button 
                          onClick={() => { if (confirm('Delete this inventory item?')) deleteMutation.mutate(item.id); }}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-stone-400 dark:text-stone-600 hover:text-red-600 dark:hover:text-red-400 transition-all shadow-sm"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isCreatingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-stone-900 rounded-[1.5rem] w-full max-w-sm overflow-hidden shadow-2xl border border-white/20 dark:border-white/5 animate-in zoom-in-95 duration-500">
            <div className="p-6 border-b border-stone-100 dark:border-white/5 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/50">
              <h3 className="text-xl font-black text-stone-950 dark:text-white uppercase tracking-tighter">New Category</h3>
              <button onClick={() => setIsCreatingCategory(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createCatMutation.mutate(catFormData); }} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] ml-1">Category Label</label>
                <input 
                  type="text"
                  required
                  autoFocus
                  value={catFormData.name}
                  onChange={e => setCatFormData({ name: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-white/5 rounded-lg text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-stone-950 dark:text-white"
                  placeholder="E.G. DAIRY / SPICES"
                />
              </div>
              <button 
                type="submit"
                disabled={createCatMutation.isPending}
                className="w-full py-4 bg-stone-950 dark:bg-primary text-white dark:text-stone-950 rounded-xl text-[11px] font-black uppercase tracking-[0.4em] hover:bg-primary dark:hover:bg-primary/90 transition-all active:scale-[0.98] mt-4 shadow-xl shadow-stone-950/10 dark:shadow-primary/10 disabled:opacity-50"
              >
                {createCatMutation.isPending ? 'PROCESSING...' : 'ESTABLISH CATEGORY'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-950/40 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-[1.5rem] w-full max-w-lg my-6 overflow-hidden shadow-2xl border border-white/20 dark:border-white/5 animate-in zoom-in-95 duration-500">
            <div className="p-6 border-b border-stone-100 dark:border-white/5 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/50">
              <h3 className="text-xl font-black text-stone-950 dark:text-white uppercase tracking-tighter">Asset Definition</h3>
              <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] ml-1">Product Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-white/5 rounded-lg text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-stone-950 dark:text-white uppercase"
                    placeholder="ENTER PRODUCT NAME"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] ml-1">Stock Unit</label>
                  <input 
                    required
                    type="text" 
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-white/5 rounded-lg text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-stone-950 dark:text-white uppercase"
                    placeholder="E.G. KG, LITER"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] ml-1">Deployment Branch</label>
                  <select 
                    required
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-white/5 rounded-lg text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-stone-950 dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-stone-900">SELECT BRANCH</option>
                    {branches?.map(b => <option key={b.id} value={b.id} className="bg-white dark:bg-stone-900">{b.name.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] ml-1">Classification</label>
                  <select 
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-white/5 rounded-lg text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-stone-950 dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-stone-900 uppercase">UNCATEGORIZED</option>
                    {categories?.map(c => <option key={c.id} value={c.id} className="bg-white dark:bg-stone-900 uppercase">{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] ml-1">Initial Reserve</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-white/5 rounded-lg text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-stone-950 dark:text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] ml-1">Critical Threshold</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formData.minThreshold}
                    onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-white/5 rounded-lg text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-stone-950 dark:text-white font-mono"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] ml-1">Unit Cost Acquisition (₹)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-white/5 rounded-lg text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-stone-950 dark:text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-white/5 rounded-xl text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] hover:bg-stone-100 dark:hover:bg-white/5 transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="flex-1 py-4 bg-stone-950 dark:bg-primary text-white dark:text-stone-950 rounded-xl text-[11px] font-black uppercase tracking-[0.4em] shadow-xl shadow-stone-950/10 dark:shadow-primary/10 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {createMutation.isPending ? 'SYNCING...' : 'REGISTER SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {adjusting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-stone-900 rounded-[1.5rem] w-full max-w-sm overflow-hidden shadow-2xl border border-white/20 dark:border-white/5 animate-in zoom-in-95 duration-500">
            <div className="p-6 border-b border-stone-100 dark:border-white/5 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/50">
              <h3 className="text-xl font-black text-stone-950 dark:text-white uppercase tracking-tighter">Stock Audit</h3>
              <button onClick={() => setAdjusting(null)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] ml-1">Correction Quantity</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="E.G. +5 OR -2"
                    value={adjusting.qty}
                    autoFocus
                    onChange={(e) => setAdjusting({ ...adjusting, qty: e.target.value })}
                    className="flex-1 px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-white/5 rounded-lg text-lg font-black focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-stone-950 dark:text-white"
                  />
                  <div className="px-3 py-3 bg-stone-100 dark:bg-stone-800 rounded-lg text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                    {adjusting.unit}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] ml-1">Audit Rationale</label>
                <select 
                  value={adjusting.reason}
                  onChange={(e) => setAdjusting({ ...adjusting, reason: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-white/5 rounded-lg text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-stone-950 dark:text-white appearance-none cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-stone-900">SELECT RATIONALE</option>
                  <option value="Restock" className="bg-white dark:bg-stone-900">RESTOCK / ACQUISITION</option>
                  <option value="Wastage" className="bg-white dark:bg-stone-900">WASTAGE / EXPIRATION</option>
                  <option value="Manual Count Fix" className="bg-white dark:bg-stone-900">MANUAL RECONCILIATION</option>
                  <option value="Return" className="bg-white dark:bg-stone-900">LOGISTICS RETURN</option>
                </select>
              </div>
              <div className="p-3 rounded-lg bg-stone-950 dark:bg-black/40 border border-stone-800 dark:border-white/5">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.5em]">
                  <span className="text-stone-500">Projected Level</span>
                  <span className="text-white dark:text-primary text-[11px]">
                    {adjusting.current + (parseFloat(adjusting.qty) || 0)} {adjusting.unit.toUpperCase()}
                  </span>
                </div>
              </div>
              <button 
                onClick={handleStockUpdate}
                className="w-full py-4 bg-stone-950 dark:bg-primary text-white dark:text-stone-950 rounded-xl text-[11px] font-black uppercase tracking-[0.4em] hover:bg-primary dark:hover:bg-primary/90 transition-all active:scale-[0.98] shadow-xl shadow-stone-950/10 dark:shadow-primary/10"
              >
                EXECUTE CORRECTION
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
