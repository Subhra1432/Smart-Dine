// ═══════════════════════════════════════════
// DineSmart — Menu Management Page
// Design System: Saffron & Stone (Industrial)
// ═══════════════════════════════════════════

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  getCategories,
  getMenuItems,
  toggleAvailability,
  createCategory,
  updateCategory,
  deleteCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  uploadMenuImage,
  getAddons,
  createAddon,
  deleteAddon
} from '../lib/api';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Leaf, Eye, EyeOff, Search, ImagePlus, X as XIcon,
  Pencil, Plus, Trash2, Clock, ChevronRight, LayoutGrid,
  MoreVertical, Check, AlertCircle, UtensilsCrossed, Sparkles, Settings2, ListPlus,
  ChefHat
} from 'lucide-react';
import { cn } from '../lib/utils';

interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  orderCount: number;
  category: { name: string };
  variants: Array<{ id: string; name: string; additionalPrice: number }>;
  menuItemAddons: Array<{ addon: { name: string; price: number } }>;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  _count: { menuItems: number }
}

export default function MenuManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals state
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [isManagingAddons, setIsManagingAddons] = useState(false);

  // Form states
  const [itemFormData, setItemFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isVeg: true,
    preparationTimeMinutes: '15',
    imageUrl: '',
    variants: [] as Array<{ name: string; additionalPrice: string }>,
    addonIds: [] as string[],
  });

  const [addonFormData, setAddonFormData] = useState({
    name: '',
    price: '',
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => getCategories() as Promise<Category[]>,
  });

  const { data: items } = useQuery<MenuItem[]>({
    queryKey: ['menuItems'],
    queryFn: () => getMenuItems() as Promise<MenuItem[]>,
  });

  const { data: addons } = useQuery<any[]>({
    queryKey: ['addons'],
    queryFn: () => getAddons() as Promise<any[]>,
  });

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleAvailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast.success('Availability Updated');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast.success('Item Decommissioned');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category Purged');
    },
    onError: (err: any) => toast.error(err.message || 'Purge failed: Active links detected'),
  });

  const deleteAddonMutation = useMutation({
    mutationFn: (id: string) => deleteAddon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addons'] });
      toast.success('Addon Registry Purged');
    },
  });


  const handleImageSelect = async (file: File) => {
    try {
      setUploadingImage(true);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      const result = await uploadMenuImage(file);
      const url = typeof result === 'string' ? result : (result as any).secure_url;
      setItemFormData(prev => ({ ...prev, imageUrl: url }));
      toast.success('Visual Asset Cached');
    } catch (error) {
      toast.error('Asset Cache Failed');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...itemFormData,
        price: parseFloat(itemFormData.price),
        preparationTimeMinutes: parseInt(itemFormData.preparationTimeMinutes),
        variants: itemFormData.variants.map(v => ({
          ...v,
          additionalPrice: parseFloat(v.additionalPrice)
        }))
      };

      if (editItemId) {
        await updateMenuItem(editItemId, data);
        toast.success('Inventory Entry Modified');
      } else {
        await createMenuItem(data);
        toast.success('New Culinary Asset Initialized');
      }
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreatingItem(false);
      setEditItemId(null);
      setItemFormData({ 
        name: '', 
        description: '', 
        price: '', 
        categoryId: '', 
        isVeg: true, 
        preparationTimeMinutes: '15', 
        imageUrl: '',
        variants: [],
        addonIds: []
      });
      setImagePreview(null);
    } catch (err: any) {
      toast.error(err.message || 'Operation Conflict');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editCategoryId) {
        await updateCategory(editCategoryId, categoryFormData);
        toast.success('Category Taxonomy Updated');
      } else {
        await createCategory(categoryFormData);
        toast.success('New Classification Created');
      }
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreatingCategory(false);
      setEditCategoryId(null);
      setCategoryFormData({ name: '', description: '', isActive: true });
    } catch (err: any) {
      toast.error(err.message || 'Classification Error');
    }
  };

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAddon({ ...addonFormData, price: parseFloat(addonFormData.price) });
      toast.success('Addon Registry Updated');
      queryClient.invalidateQueries({ queryKey: ['addons'] });
      setAddonFormData({ name: '', price: '' });
    } catch (err: any) {
      toast.error(err.message || 'Registry Conflict');
    }
  };

  const filteredItems = items?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">Inventory Architecture</p>
          </div>
          <h1 className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter uppercase leading-none">
            Catalog <span className="text-stone-300 dark:text-stone-700 italic">Control</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsManagingAddons(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2.5 bg-white/60 dark:bg-stone-900/60 backdrop-blur-xl border border-white dark:border-white/5 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-950 dark:text-white px-6 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm group"
          >
            <Sparkles size={16} className="text-stone-300 dark:text-stone-700 group-hover:text-primary transition-colors" />
            Registry Manager
          </button>
          <button
            onClick={() => {
              setEditCategoryId(null);
              setCategoryFormData({ name: '', description: '', isActive: true });
              setIsCreatingCategory(true);
            }}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2.5 bg-white/60 dark:bg-stone-900/60 backdrop-blur-xl border border-white dark:border-white/5 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-950 dark:text-white px-6 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm group"
          >
            <Plus size={16} className="text-stone-300 dark:text-stone-700 group-hover:text-primary transition-colors" />
            Add Classification
          </button>
          <button
            onClick={() => {
              setEditItemId(null);
              setItemFormData({ 
                name: '', 
                description: '', 
                price: '', 
                categoryId: '', 
                isVeg: true, 
                preparationTimeMinutes: '15', 
                imageUrl: '',
                variants: [],
                addonIds: []
              });
              setImagePreview(null);
              setIsCreatingItem(true);
            }}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2.5 bg-stone-950 dark:bg-primary text-white dark:text-stone-950 px-8 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-stone-950/20 dark:shadow-primary/20 transition-all active:scale-95 group"
          >
            <ChefHat size={16} className="text-primary dark:text-stone-950 group-hover:rotate-12 transition-transform duration-300" />
            Initialize Asset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 space-y-5">
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setCategoryFilter('all')}
              className={cn(
                "px-6 py-3 rounded-xl text-[9px] font-black whitespace-nowrap transition-all border uppercase tracking-[0.2em]",
                categoryFilter === 'all'
                  ? 'bg-stone-950 dark:bg-primary border-stone-950 dark:border-primary text-white dark:text-stone-950 shadow-xl shadow-stone-950/20 dark:shadow-primary/20'
                  : 'bg-white/60 dark:bg-stone-900/60 border-white dark:border-white/5 text-stone-400 dark:text-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white'
              )}
            >
              All Assets ({items?.length || 0})
            </button>
            {categories?.map((cat) => (
              <div key={cat.id} className="relative group">
                <button
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    "px-6 py-3 rounded-xl text-[9px] font-black whitespace-nowrap transition-all border uppercase tracking-[0.2em] pr-10",
                    categoryFilter === cat.id
                      ? 'bg-stone-950 dark:bg-primary border-stone-950 dark:border-primary text-white dark:text-stone-950 shadow-xl shadow-stone-950/20 dark:shadow-primary/20'
                      : 'bg-white/60 dark:bg-stone-900/60 border-white dark:border-white/5 text-stone-400 dark:text-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white'
                  )}
                >
                  {cat.name}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditCategoryId(cat.id);
                    setCategoryFormData({ 
                      name: cat.name, 
                      description: cat.description || '',
                      isActive: cat.isActive
                    });
                    setIsCreatingCategory(true);
                  }}
                  className={cn(
                    "absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all",
                    categoryFilter === cat.id ? "text-primary dark:text-stone-950 hover:bg-white/10" : "text-stone-300 dark:text-stone-700 hover:text-stone-950 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
                  )}
                >
                  <Pencil size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="relative group">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-700 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="QUERIES: NAME, FLAVOR, INGREDIENT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-900 backdrop-blur-xl rounded-2xl text-[13px] text-stone-950 dark:text-white border border-white dark:border-white/5 focus:border-primary/50 focus:outline-none transition-all placeholder:text-stone-300 dark:placeholder:text-stone-700 font-black uppercase tracking-[0.05em] shadow-sm"
            />
          </div>
        </div>

        <div className="md:col-span-4 glass-card p-6 flex flex-col justify-center border-white/20 dark:border-white/5 shadow-2xl shadow-stone-200/40 dark:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em]">System Vital</p>
            <div className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[8px] font-black uppercase tracking-[0.1em] border border-primary/10">Active</div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter leading-none">
                {items?.filter(i => i.isAvailable).length || 0}
              </p>
              <p className="text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.2em] mt-1.5">Operational</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-red-500 tracking-tighter leading-none">
                {items?.filter(i => !i.isAvailable).length || 0}
              </p>
              <p className="text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.2em] mt-1.5">Suspended</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden border-white/20 dark:border-white/5 shadow-2xl shadow-stone-200/50 dark:shadow-none !bg-white/40 dark:!bg-stone-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 dark:border-white/5 bg-stone-50/30 dark:bg-stone-950/30">
                <th className="py-5 px-6 text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 dark:text-stone-600">Culinary Asset</th>
                <th className="py-5 px-4 text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 dark:text-stone-600">Classification</th>
                <th className="py-5 px-4 text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 dark:text-stone-600 text-center">Valuation</th>
                <th className="py-5 px-4 text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 dark:text-stone-600 text-center">Process Time</th>
                <th className="py-5 px-4 text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 dark:text-stone-600 text-center">Customer Visibility</th>
                <th className="py-5 px-6 text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 dark:text-stone-600 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-white/5">
              {filteredItems?.map((item) => (
                <tr key={item.id} className="group hover:bg-white/80 dark:hover:bg-white/5 transition-all duration-500">
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-700">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-xl opacity-20">{item.isVeg ? '🥗' : '🍗'}</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 mb-0.5">
                          <span className="text-[15px] font-black text-stone-950 dark:text-white uppercase tracking-tight group-hover:text-primary transition-colors">{item.name}</span>
                          {item.isVeg && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
                        </div>
                        <p className="text-[10px] text-stone-400 dark:text-stone-600 font-black uppercase tracking-[0.05em] truncate max-w-[280px]">{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <span className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-[8px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-[0.1em] border border-stone-200/50 dark:border-white/5">
                      {item.category.name}
                    </span>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <span className="text-[15px] font-black text-stone-950 dark:text-white tracking-tighter">₹{item.price}</span>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-stone-400 dark:text-stone-600">
                      <Clock size={14} />
                      <span className="text-[11px] font-black uppercase tracking-widest">{item.preparationTimeMinutes}M</span>
                    </div>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative inline-flex items-center cursor-pointer group/toggle" onClick={() => toggleMutation.mutate(item.id)}>
                        <input type="checkbox" checked={item.isAvailable} readOnly className="sr-only peer" />
                        <div className="premium-toggle"></div>
                      </div>
                      <span className={cn("text-[7px] font-black uppercase tracking-[0.2em] transition-colors", item.isAvailable ? "text-primary" : "text-stone-400 dark:text-stone-600")}>
                        {item.isAvailable ? 'Operational' : 'Suspended'}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-right">
                    <div className="flex items-center justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button
                        onClick={() => {
                          setEditItemId(item.id);
                          setItemFormData({
                            name: item.name,
                            description: item.description,
                            price: item.price.toString(),
                            categoryId: item.categoryId,
                            isVeg: item.isVeg,
                            preparationTimeMinutes: item.preparationTimeMinutes.toString(),
                            imageUrl: item.imageUrl || '',
                            variants: item.variants.map(v => ({ name: v.name, additionalPrice: v.additionalPrice.toString() })),
                            addonIds: item.menuItemAddons.map(a => (a as any).addonId),
                          });
                          setImagePreview(item.imageUrl);
                          setIsCreatingItem(true);
                        }}
                        className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-100 dark:border-white/5 text-stone-400 dark:text-stone-600 hover:text-stone-950 dark:hover:text-white hover:border-stone-200 dark:hover:border-white/20 transition-all active:scale-90 shadow-sm"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('DECOMMISSION ASSET: Permanent removal from operational matrix. Proceed?')) {
                            deleteItemMutation.mutate(item.id);
                          }
                        }}
                        className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-500 hover:text-white text-red-300 dark:text-red-900 border border-red-100 dark:border-red-900/20 hover:border-red-400 transition-all active:scale-90 shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!filteredItems || filteredItems.length === 0) && (
          <div className="py-40 flex flex-col items-center justify-center text-stone-200 dark:text-stone-800">
            <div className="w-24 h-24 rounded-[2rem] bg-stone-50 dark:bg-stone-800 flex items-center justify-center mb-8 border border-stone-100 dark:border-white/5">
              <Search size={40} strokeWidth={1} className="text-stone-200 dark:text-stone-800" />
            </div>
            <p className="text-2xl font-black text-stone-950 dark:text-white uppercase tracking-tighter">Asset Search Terminal</p>
            <p className="text-[10px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.5em] mt-3">Zero matches detected in local registry</p>
          </div>
        )}
      </div>

      {/* Item Modal */}
      {isCreatingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-950/40 dark:bg-black/60 backdrop-blur-md" onClick={() => setIsCreatingItem(false)} />
          <div className="glass-card !bg-white dark:!bg-stone-900 rounded-3xl p-10 w-full max-w-4xl relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">Command Input</p>
                </div>
                <h3 className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter uppercase">{editItemId ? 'Modify' : 'Initialize'} Asset</h3>
              </div>
              <button onClick={() => setIsCreatingItem(false)} className="w-12 h-12 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-300 dark:text-stone-700 hover:text-stone-950 dark:hover:text-white transition-all border border-stone-100 dark:border-white/5">
                <XIcon size={22} className="mx-auto" />
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em] ml-1.5">Asset Identity</label>
                  <input required type="text" placeholder="e.g. CORE.SIGNATURE_DISH" value={itemFormData.name} onChange={e => setItemFormData({ ...itemFormData, name: e.target.value })} className="w-full px-6 py-3.5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-white/5 rounded-xl text-stone-950 dark:text-white focus:border-primary/50 focus:bg-white dark:focus:bg-stone-950 transition-all font-black uppercase tracking-[0.1em] text-[13px]" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em] ml-1.5">Specifications</label>
                  <textarea placeholder="INPUT SENSORY PROFILE..." value={itemFormData.description} onChange={e => setItemFormData({ ...itemFormData, description: e.target.value })} className="w-full px-6 py-3.5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-white/5 rounded-xl text-stone-950 dark:text-white focus:border-primary/50 focus:bg-white dark:focus:bg-stone-950 transition-all font-black uppercase tracking-[0.05em] text-[13px] resize-none" rows={3} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em] ml-1.5">Valuation (₹)</label>
                    <input required type="number" min="0" step="0.01" value={itemFormData.price} onChange={e => setItemFormData({ ...itemFormData, price: e.target.value })} className="w-full px-6 py-3.5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-white/5 rounded-xl text-stone-950 dark:text-white focus:border-primary/50 focus:bg-white dark:focus:bg-stone-950 transition-all font-black text-[13px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em] ml-1.5">Latency (M)</label>
                    <input required type="number" min="1" value={itemFormData.preparationTimeMinutes} onChange={e => setItemFormData({ ...itemFormData, preparationTimeMinutes: e.target.value })} className="w-full px-6 py-3.5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-white/5 rounded-xl text-stone-950 dark:text-white focus:border-primary/50 focus:bg-white dark:focus:bg-stone-950 transition-all font-black text-[13px]" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em] ml-1.5">Classification</label>
                  <select required value={itemFormData.categoryId} onChange={e => setItemFormData({ ...itemFormData, categoryId: e.target.value })} className="w-full px-6 py-3.5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-white/5 rounded-xl text-stone-950 dark:text-white focus:border-primary/50 focus:bg-white dark:focus:bg-stone-950 transition-all font-black uppercase tracking-[0.1em] text-[13px] appearance-none cursor-pointer">
                    <option value="" disabled>Select Classification</option>
                    {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em] ml-1.5">Visual Manifest</label>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageSelect(e.target.files[0])} />
                  {imagePreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-stone-100 dark:border-white/5 aspect-video group">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black text-white text-[9px] uppercase tracking-[0.2em]">Replace Image</button>
                      {uploadingImage && <div className="absolute inset-0 bg-white/60 dark:bg-stone-900/60 flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" /></div>}
                      <button type="button" onClick={() => { setImagePreview(null); setItemFormData(p => ({ ...p, imageUrl: '' })); }} className="absolute top-4 right-4 w-8 h-8 bg-red-500 rounded-xl text-white flex items-center justify-center shadow-lg active:scale-90"><XIcon size={16} /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full aspect-video border-2 border-dashed border-stone-100 dark:border-white/10 hover:border-primary/40 rounded-2xl flex flex-col items-center justify-center gap-3 text-stone-400 dark:text-stone-500 hover:text-primary hover:bg-primary/5 transition-all group active:scale-[0.98]">
                      <ImagePlus size={32} strokeWidth={1} className="group-hover:scale-110 transition-transform duration-700" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">Load Image Asset</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between p-5 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-white/5">
                  <div className="space-y-0.5">
                    <p className="text-[13px] font-black text-stone-950 dark:text-white uppercase tracking-tight leading-none">Dietary Classification</p>
                    <p className="text-[8px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-[0.1em] mt-1">Type: {itemFormData.isVeg ? 'Veg' : 'Non-Veg'}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={itemFormData.isVeg}
                      onChange={e => setItemFormData({ ...itemFormData, isVeg: e.target.checked })}
                    />
                    <div className="premium-toggle"></div>
                  </label>
                </div>
              </div>

              {/* Variants & Addons Matrix */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-stone-50 dark:border-white/5">
                {/* Variants Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black text-stone-950 dark:text-white uppercase tracking-wider">Variants & Sizing</p>
                      <p className="text-[8px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-[0.2em]">Multi-tier pricing architecture</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setItemFormData(prev => ({ ...prev, variants: [...prev.variants, { name: '', additionalPrice: '0' }] }))}
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all active:scale-90"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {itemFormData.variants.map((v, i) => (
                      <div key={i} className="flex gap-3 animate-in slide-in-from-right-4 duration-300">
                        <input
                          placeholder="e.g. LARGE"
                          value={v.name}
                          onChange={e => {
                            const nv = [...itemFormData.variants];
                            nv[i].name = e.target.value;
                            setItemFormData({ ...itemFormData, variants: nv });
                          }}
                          className="flex-1 px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-white/5 rounded-xl text-[11px] font-black uppercase tracking-wider"
                        />
                        <div className="relative w-24">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-stone-400">₹</span>
                          <input
                            type="number"
                            placeholder="PRICE"
                            value={v.additionalPrice}
                            onChange={e => {
                              const nv = [...itemFormData.variants];
                              nv[i].additionalPrice = e.target.value;
                              setItemFormData({ ...itemFormData, variants: nv });
                            }}
                            className="w-full pl-6 pr-3 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-white/5 rounded-xl text-[11px] font-black"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nv = itemFormData.variants.filter((_, idx) => idx !== i);
                            setItemFormData({ ...itemFormData, variants: nv });
                          }}
                          className="p-2.5 text-stone-300 hover:text-red-500 transition-colors"
                        >
                          <XIcon size={16} />
                        </button>
                      </div>
                    ))}
                    {itemFormData.variants.length === 0 && (
                      <div className="py-8 border-2 border-dashed border-stone-50 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center text-stone-300 dark:text-stone-700">
                        <Settings2 size={24} strokeWidth={1} className="mb-2 opacity-20" />
                        <p className="text-[8px] font-black uppercase tracking-[0.2em]">No variants configured</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Addons Section */}
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-stone-950 dark:text-white uppercase tracking-wider">Custom Add-ons</p>
                    <p className="text-[8px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.2em]">Peripheral flavor enhancements</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {addons?.map(addon => (
                      <label key={addon.id} className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-white/5 cursor-pointer group hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={itemFormData.addonIds.includes(addon.id)}
                            onChange={e => {
                              const nIds = e.target.checked 
                                ? [...itemFormData.addonIds, addon.id]
                                : itemFormData.addonIds.filter(id => id !== addon.id);
                              setItemFormData({ ...itemFormData, addonIds: nIds });
                            }}
                            className="w-4 h-4 rounded border-stone-300 text-primary focus:ring-primary dark:bg-stone-900 dark:border-white/10"
                          />
                          <span className="text-[11px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-tight group-hover:text-stone-950 dark:group-hover:text-white transition-colors">{addon.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-primary">₹{addon.price}</span>
                      </label>
                    ))}
                    {(!addons || addons.length === 0) && (
                      <div className="py-8 border-2 border-dashed border-stone-50 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center text-stone-300 dark:text-stone-700">
                        <ListPlus size={24} strokeWidth={1} className="mb-2 opacity-20" />
                        <p className="text-[8px] font-black uppercase tracking-[0.2em]">No addons defined in registry</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex gap-4 pt-8 border-t border-stone-50 dark:border-white/5">
                <button type="button" onClick={() => setIsCreatingItem(false)} className="flex-1 py-4 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-2xl text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em] transition-all active:scale-95 border border-stone-100 dark:border-white/5">Abort</button>
                <button type="submit" className="flex-[2] py-4 bg-stone-950 dark:bg-primary text-white dark:text-stone-950 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-stone-950/30 dark:shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-3">
                  <Sparkles size={16} className="text-primary dark:text-stone-950" />
                  {editItemId ? 'Commit Changes' : 'Finalize Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Classification Modal (Category) */}
      {isCreatingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-950/40 dark:bg-black/60 backdrop-blur-md" onClick={() => setIsCreatingCategory(false)} />
          <div className="glass-card !bg-white dark:!bg-stone-900 border-white dark:border-white/10 rounded-3xl p-10 w-full max-w-lg relative z-10 shadow-2xl transform animate-in zoom-in-95 duration-700">
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">Taxonomy Entry</p>
                </div>
                <h3 className="text-2xl font-black text-stone-950 dark:text-white tracking-tighter uppercase">
                  {editCategoryId ? 'Update' : 'New'} <span className="text-stone-300 dark:text-stone-700">Class</span>
                </h3>
              </div>
              <button onClick={() => setIsCreatingCategory(false)} className="w-12 h-12 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-300 dark:text-stone-700 hover:text-stone-950 dark:hover:text-white transition-all flex items-center justify-center border border-stone-100 dark:border-white/5">
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em] ml-1.5">Class Identity</label>
                <input required type="text" placeholder="e.g. SIGNATURE_COLLECTION" value={categoryFormData.name} onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })} className="w-full px-6 py-3.5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-white/5 rounded-2xl text-stone-950 dark:text-white focus:border-primary/50 focus:bg-white dark:focus:bg-stone-950 transition-all font-black uppercase tracking-[0.1em] text-[13px]" />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em] ml-1.5">Metadata Context</label>
                <textarea placeholder="OPTIONAL SYSTEM TAGS..." value={categoryFormData.description} onChange={e => setCategoryFormData({ ...categoryFormData, description: e.target.value })} className="w-full px-6 py-3.5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-white/5 rounded-2xl text-stone-950 dark:text-white focus:border-primary/50 focus:bg-white dark:focus:bg-stone-950 transition-all font-black uppercase tracking-[0.05em] text-[13px] resize-none" rows={3} />
              </div>

              <div className="flex items-center justify-between p-5 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-white/5">
                <div className="flex-1">
                  <p className="text-[13px] font-black text-stone-950 dark:text-white uppercase tracking-tight leading-none">Customer Visibility</p>
                  <p className="text-[8px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.1em] mt-1">Status: {categoryFormData.isActive ? 'Active' : 'Hidden'}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={categoryFormData.isActive}
                    onChange={e => setCategoryFormData({ ...categoryFormData, isActive: e.target.checked })}
                  />
                  <div className="premium-toggle"></div>
                </label>
              </div>

              <div className="flex flex-col gap-4 pt-6 border-t border-stone-50 dark:border-white/5">
                <button type="submit" className="w-full py-4 bg-stone-950 dark:bg-primary text-white dark:text-stone-950 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-stone-950/20 dark:shadow-primary/20 transition-all active:scale-95">
                  {editCategoryId ? 'Synchronize' : 'Initialize'}
                </button>
                {editCategoryId && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('DESTRUCTIVE ACTION: Permanent classification purge. Proceed?')) {
                        deleteCategoryMutation.mutate(editCategoryId);
                        setIsCreatingCategory(false);
                      }
                    }}
                    className="w-full py-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-500 hover:text-white border border-red-100 dark:border-red-900/20 hover:border-red-400 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] transition-all active:scale-95"
                  >
                    Purge classification
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Addon Registry Modal */}
      {isManagingAddons && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-950/40 dark:bg-black/60 backdrop-blur-md" onClick={() => setIsManagingAddons(false)} />
          <div className="glass-card !bg-white dark:!bg-stone-900 rounded-3xl p-10 w-full max-w-xl relative z-10 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={14} className="text-primary" />
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">Global Registry</p>
                </div>
                <h3 className="text-2xl font-black text-stone-950 dark:text-white tracking-tighter uppercase">Addon <span className="text-stone-300 dark:text-stone-700">Manager</span></h3>
              </div>
              <button onClick={() => setIsManagingAddons(false)} className="p-3 hover:bg-stone-100 dark:hover:bg-white/5 rounded-2xl transition-all text-stone-300 hover:text-stone-950 dark:hover:text-white">
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAddon} className="flex gap-3 mb-8">
              <input required type="text" placeholder="ADDON IDENTITY" value={addonFormData.name} onChange={e => setAddonFormData({ ...addonFormData, name: e.target.value })} className="flex-[2] px-6 py-3.5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-stone-950 dark:text-white" />
              <input required type="number" step="0.01" placeholder="PRICE" value={addonFormData.price} onChange={e => setAddonFormData({ ...addonFormData, price: e.target.value })} className="flex-1 px-6 py-3.5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-stone-950 dark:text-white" />
              <button type="submit" className="px-6 py-3.5 bg-primary text-stone-950 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">Add</button>
            </form>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {addons?.map(addon => (
                <div key={addon.id} className="flex items-center justify-between p-4 bg-stone-50/50 dark:bg-stone-800/50 border border-stone-100 dark:border-white/5 rounded-2xl group">
                  <div>
                    <p className="text-[11px] font-black text-stone-950 dark:text-white uppercase tracking-wider">{addon.name}</p>
                    <p className="text-[9px] font-black text-primary">₹{addon.price}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Permanently remove this addon from the global registry?')) {
                        deleteAddonMutation.mutate(addon.id);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
