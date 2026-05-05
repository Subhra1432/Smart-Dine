// ═══════════════════════════════════════════
// DineSmart — Customer Menu Page
// ═══════════════════════════════════════════

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ShoppingCart, Flame, Minus, Plus, X, Tag, User, Clock, LogOut, UtensilsCrossed, Star, Edit3, Check, ArrowRight, Scan, ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicMenu, placeOrder, validateCoupon, getRecommendations, getCustomerHistory, getAvailableCoupons } from '../lib/api';
import { useCartStore } from '../store/cart';
import { CustomerAuthModal } from '../components/CustomerAuthModal';
import { TermsModal } from '../components/TermsModal';
import { SplashLoading } from '../components/SplashLoading';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  tags: string[];
  orderCount: number;
  isPopular?: boolean;
  variants: Array<{ id: string; name: string; additionalPrice: number }>;
  addons: Array<{ id: string; name: string; price: number }>;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

interface MenuData {
  restaurant: { 
    id: string; 
    name: string; 
    logoUrl: string | null;
    bannerText: string | null;
    bannerImageUrl: string | null;
  };
  table: { id: string; number: number };
  categories: Category[];
  branch: {
    allowOrderModification: boolean;
    requireOrderVerification: boolean;
  };
}

export default function MenuPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug: pathSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const slug = pathSlug || searchParams.get('restaurant') || '';
  const tableId = searchParams.get('table') || searchParams.get('tableId') || '';

  // Auto-redirect spice-garden demo to table 1 if no tableId provided
  useEffect(() => {
    if (slug === 'spice-garden' && !tableId) {
      setSearchParams({ table: '1' });
    }
  }, [slug, tableId, setSearchParams]);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    // T&C is now compulsory on every scan/mount
    setShowTermsModal(true);
  }, []);

  useEffect(() => {
    if (showCart || showHistory || isAuthModalOpen || showCheckout || showTermsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCart, showHistory, isAuthModalOpen, showCheckout, showTermsModal]);
  const [nonVegOnly, setNonVegOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'NONE' | 'PRICE_ASC' | 'PRICE_DESC'>('NONE');

  const cart = useCartStore();

  // Set restaurant info in store
  useEffect(() => {
    if (slug && tableId) {
      cart.setRestaurantInfo(slug, tableId);
    }
  }, [slug, tableId]);

  // Auth check moved to checkout action

  // Fetch menu
  const { data: menuData, isLoading, error } = useQuery<MenuData>({
    queryKey: ['menu', slug, tableId],
    queryFn: () => getPublicMenu(slug, tableId) as Promise<MenuData>,
    enabled: !!slug && !!tableId,
  });

  if (!slug) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[#0C0A09] relative overflow-hidden font-sans">
         {/* Dynamic Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-saffron-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-saffron-600/5 rounded-full blur-[100px]" />
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="relative z-10 max-w-sm w-full space-y-10">
          <div className="space-y-4">
            <div className="w-24 h-24 bg-saffron-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-saffron-500/20 shadow-[0_20px_50px_rgba(245,158,11,0.1)] group hover:scale-110 transition-all duration-700">
              <UtensilsCrossed size={40} className="text-saffron-500" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
              DineSmart <span className="text-saffron-500 italic tracking-normal">OS</span>
            </h1>
            <div className="h-px w-12 bg-saffron-500/30 mx-auto" />
          </div>

          <div className="space-y-6">
            <p className="text-stone-400 text-base leading-relaxed font-medium px-4">
              Experience the future of dining. Please scan the QR code at your table to begin your culinary journey.
            </p>
            
            <div className="pt-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-saffron-500 animate-pulse" />
                <span className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em]">Awaiting Table Anchor</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tableId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[#0C0A09] relative overflow-hidden font-sans">
         {/* Dynamic Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-saffron-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-saffron-600/5 rounded-full blur-[100px]" />
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="relative z-10 max-w-sm w-full space-y-10">
          <div className="space-y-4">
            <div className="w-24 h-24 bg-saffron-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-saffron-500/20 shadow-[0_20px_50px_rgba(245,158,11,0.1)] group hover:scale-110 transition-all duration-700 animate-pulse">
              <Scan size={40} className="text-saffron-500" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
              Scanning <span className="text-saffron-500 italic tracking-normal">Table...</span>
            </h1>
            <div className="h-px w-12 bg-saffron-500/30 mx-auto" />
          </div>

          <div className="space-y-6">
            <p className="text-stone-400 text-base leading-relaxed font-medium px-4">
              We couldn't identify your table node. Please re-scan the QR code located on your table to sync.
            </p>
            
            {slug === 'spice-garden' && (
              <button 
                onClick={() => window.location.search = '?table=1'}
                className="px-8 py-4 bg-saffron-500 text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-saffron-500/20 hover:scale-105 transition-all"
              >
                Enter Demo Mode (Table 1)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fetch recommendations
  const cartItemIds = cart.items.map((i) => i.menuItemId);
  const { data: recommendations } = useQuery({
    queryKey: ['recommendations', slug, cartItemIds],
    queryFn: () => getRecommendations(slug, cartItemIds) as Promise<Array<{
      id: string; name: string; price: number; imageUrl: string | null; confidence: number;
    }>>,
    enabled: cartItemIds.length > 0 && !!slug,
  });

  // Fetch Order History
  const { data: history } = useQuery<any[]>({
    queryKey: ['customerHistory', slug, cart.customerPhone],
    queryFn: () => getCustomerHistory(slug, cart.customerPhone!) as Promise<Array<any>>,
    enabled: !!slug && !!cart.customerPhone && showHistory,
  });

  
  // Fetch Available Coupons
  const { data: availableCoupons } = useQuery({
    queryKey: ['availableCoupons', slug],
    queryFn: () => getAvailableCoupons(slug) as Promise<any[]>,
    enabled: !!slug,
  });

  // Filter items
  const filteredCategories = useMemo(() => {
    if (!menuData) return [];
    return menuData.categories
      .map((cat) => {
        let items = cat.items.filter((item) => {
          if (vegOnly && !item.isVeg) return false;
          if (nonVegOnly && item.isVeg) return false;
          if (search) {
            const q = search.toLowerCase();
            return item.name.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q) ||
              (item.tags || []).some((t) => t.toLowerCase().includes(q));
          }
          return true;
        });

        if (sortOrder === 'PRICE_ASC') items = items.sort((a, b) => a.price - b.price);
        if (sortOrder === 'PRICE_DESC') items = items.sort((a, b) => b.price - a.price);

        return { ...cat, items };
      })
      .filter((cat) => activeCategory === 'all' || cat.id === activeCategory)
      .filter((cat) => cat.items.length > 0);
  }, [menuData, search, vegOnly, nonVegOnly, activeCategory, sortOrder]);

  // Popular items for Chef's Special carousel
  const chefsSpecials = useMemo(() => {
    if (!menuData) return [];
    return menuData.categories
      .flatMap((cat) => cat.items)
      .filter((item) => item.isPopular && item.isAvailable)
      .slice(0, 8);
  }, [menuData]);

  // Helper: derive star rating from real orderCount — used in Chef's Special & MenuItemCard

  const canModifyOrder = useMemo(() => {
    if (!menuData?.branch) return true;
    if (!cart.sessionId) return true; // No active order, can start one
    return menuData.branch.allowOrderModification;
  }, [menuData, cart.sessionId]);

  const addToCart = useCallback((item: MenuItem, variantId?: string, selectedAddons?: string[]) => {
    const safeVariants = item.variants || [];
    const safeAddons = item.addons || [];
    const variant = variantId ? safeVariants.find((v) => v.id === variantId) : undefined;
    const addons = selectedAddons
      ? safeAddons.filter((a) => selectedAddons.includes(a.id))
      : [];

    if (!canModifyOrder) {
      toast.error('Order modification is currently disabled by the restaurant.');
      return;
    }

    cart.addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price + (variant?.additionalPrice || 0),
      quantity: 1,
      variantId: variant?.id,
      variantName: variant?.name,
      addonIds: addons.map((a) => a.id),
      addonNames: addons.map((a) => a.name),
      addonPrices: addons.map((a) => a.price),
      specialInstructions: '',
      imageUrl: item.imageUrl || undefined,
      isVeg: item.isVeg,
    });

    toast.success(`${item.name} added to cart`, { duration: 1500 });
  }, [cart]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const result = await validateCoupon(slug, couponInput, cart.getSubtotal()) as {
        valid: boolean; reason?: string; discount?: number; discountType?: string; discountValue?: number;
      };
      if (result.valid && result.discount !== undefined) {
        cart.setCoupon(couponInput.toUpperCase(), result.discount);
        toast.success(`Coupon applied! You save ₹${result.discount.toFixed(0)}`);
      } else {
        toast.error(result.reason || 'Invalid coupon');
      }
    } catch {
      toast.error('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const initiateOrder = () => {
    if (cart.items.length === 0) return;
    
    // Check if customer is identified
    if (!cart.customerPhone) {
      setIsAuthModalOpen(true);
      return;
    }

    setShowCheckout(true);
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const result = await placeOrder({
        tableId: menuData?.table.id || tableId,
        items: cart.items.map((item) => ({
          menuItemId: item.menuItemId,
          variantId: item.variantId || undefined,
          quantity: item.quantity,
          addonIds: item.addonIds,
          specialInstructions: item.specialInstructions,
        })),
        couponCode: cart.couponCode || undefined,
        customerPhone: cart.customerPhone ? cart.customerPhone.replace(/[^\d+]/g, '') : undefined,
        customerName: cart.customerName || undefined,
      }) as any;

      const sid = result?.sessionId || result?.id;
      if (!sid) {
        toast.error('Order placed but session ID missing');
        setPlacing(false);
        return;
      }

      // Invalidate the order tracking query to ensure fresh data on navigation
      queryClient.invalidateQueries({ queryKey: ['order', sid] });

      cart.setSessionId(sid);
      cart.clearCart();
      setShowCheckout(false);
      setShowCart(false);
      toast.success('Order placed successfully!');
      // Use setTimeout to ensure state updates flush before navigation
      setTimeout(() => navigate(`/track/${sid}`), 100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <SplashLoading isLoading={showSplash || isLoading || !hasHydrated} />

      {showTermsModal && hasHydrated && createPortal(
        <TermsModal 
          isOpen={showTermsModal}
          onAccept={() => {
            setShowTermsModal(false);
            toast.success('Terms accepted!');
          }}
        />,
        document.body
      )}

      {(!slug || !tableId) ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-stone-950 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-saffron-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-saffron-600/5 rounded-full blur-[100px]" />
          
          <div className="relative z-10 max-w-sm w-full space-y-10">
            <div className="space-y-4">
              <div className="w-24 h-24 bg-saffron-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-saffron-500/20 shadow-[0_20px_50px_rgba(245,158,11,0.1)] group hover:scale-110 transition-all duration-700">
                <UtensilsCrossed size={40} className="text-saffron-500" />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                DineSmart <span className="text-saffron-500 italic tracking-normal">OS</span>
              </h1>
              <div className="h-px w-12 bg-saffron-500/30 mx-auto" />
            </div>

            <div className="space-y-6">
              <p className="text-stone-400 text-base leading-relaxed font-medium px-4">
                Experience the future of dining. Please scan the QR code at your table to begin your culinary journey.
              </p>
              
              <div className="pt-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-saffron-500 animate-pulse" />
                  <span className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em]">Awaiting Table Anchor</span>
                </div>
              </div>
            </div>

            <div className="pt-12 flex justify-center gap-4">
               {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-stone-800" />
              ))}
            </div>
          </div>
        </div>
      ) : (error) ? (
        <div className="flex items-center justify-center min-h-screen p-6 text-center bg-stone-950">
          <div className="max-w-xs bg-white/[0.02] border border-white/5 p-10 rounded-[3rem] backdrop-blur-xl">
            <div className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <span className="text-5xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-black text-white mb-4 tracking-tight uppercase">Access Denied</h1>
            <p className="text-stone-500 text-sm mb-10 leading-relaxed">
              The station anchor is currently inactive or unreachable. Please notify the steward.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-5 bg-saffron-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-saffron-400 transition-all active:scale-95 shadow-[0_20px_40px_rgba(245,158,11,0.2)]"
            >
              Re-Sync
            </button>
          </div>
        </div>
      ) : !menuData ? (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950" />
      ) : (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white font-sans selection:bg-saffron-500/30 transition-colors duration-700">
      {/* ═══════════════════════════════════════════════════════
           DESKTOP LAYOUT  (lg+)  — 3-column: sidebar | menu | cart
          ═══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex h-screen overflow-hidden">

        {/* ── LEFT SIDEBAR ─────────────────────────────── */}
        <aside className="w-64 xl:w-72 flex-shrink-0 flex flex-col border-r border-white/5 bg-[#0D0D0D] overflow-y-auto">
          {/* Brand */}
          <div className="px-6 py-6 border-b border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-sm">
                {menuData.restaurant.logoUrl ? (
                  <img src={menuData.restaurant.logoUrl} alt={menuData.restaurant.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-serif font-bold text-lg text-[#D97706]">{menuData.restaurant.name.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="font-serif font-bold text-lg text-white leading-tight truncate">{menuData.restaurant.name}</h1>
                <div className="bg-[#D97706]/10 border border-[#D97706]/20 px-2 py-0.5 rounded-md inline-block mt-1">
                  <span className="font-bold text-[10px] text-[#D97706] uppercase tracking-wider">Table {menuData.table.number}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {cart.customerPhone && (
                <button onClick={() => setShowHistory(true)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white/70 border border-white/10 rounded-xl py-2 hover:bg-white/5 transition-colors">
                  <User size={13} /> Profile
                </button>
              )}
              {cart.customerPhone && (
                <button onClick={() => { cart.clearCustomerInfo(); toast.success('Signed out'); }} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-400 border border-red-500/10 rounded-xl py-2 hover:bg-red-500/5 transition-colors">
                  <LogOut size={13} /> Sign out
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="px-4 py-4 border-b border-white/5">
            <div className="relative flex items-center h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden focus-within:border-[#D97706]/50 transition-colors">
              <div className="pl-3 pr-2 text-white/40 flex items-center"><Search size={16} /></div>
              <input type="text" placeholder="Search dishes..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full h-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/30 text-sm outline-none pr-3" id="search-input-desktop" />
            </div>
          </div>

          {/* Coupons */}
          {availableCoupons && availableCoupons.length > 0 && (
            <div className="px-4 py-4 border-b border-white/5">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 px-1">Available Offers</p>
              <div className="flex flex-col gap-2">
                {availableCoupons.map((coupon: any) => (
                  <div key={coupon.id} onClick={() => { setCouponInput(coupon.code); toast.success(`${coupon.code} selected — apply in cart`); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-[#D97706]/30 bg-[#D97706]/5 cursor-pointer hover:bg-[#D97706]/10 transition-colors">
                    <Tag size={12} className="text-[#D97706] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#D97706]">{coupon.code}</p>
                      <p className="text-[10px] text-white/50 uppercase tracking-tighter">
                        {coupon.discountType === 'PERCENT' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="px-4 py-4 border-b border-white/5">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 px-1">Diet Filter</p>
            <div className="flex gap-2">
              <button onClick={() => { setVegOnly(!vegOnly); if (!vegOnly) setNonVegOnly(false); }}
                className={`flex-1 flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                  vegOnly ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-white/10 text-white/60 hover:border-white/20'
                }`}>
                <div className={`w-2 h-2 rounded-full ${vegOnly ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-white/20'}`} /> VEG
              </button>
              <button onClick={() => { setNonVegOnly(!nonVegOnly); if (!nonVegOnly) setVegOnly(false); }}
                className={`flex-1 flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                  nonVegOnly ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-white/10 text-white/60 hover:border-white/20'
                }`}>
                <div className={`w-2 h-2 rounded-full ${nonVegOnly ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-white/20'}`} /> NON-VEG
              </button>
            </div>
          </div>

          {/* Category Nav */}
          <div className="px-4 py-4 flex-1">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 px-1">Categories</p>
            <div className="flex flex-col gap-1">
              <button onClick={() => setActiveCategory('all')}
                className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeCategory === 'all' ? 'bg-[#D97706] text-black' : 'text-white/60 hover:bg-white/5'
                }`}>
                <span>All Items</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${activeCategory === 'all' ? 'bg-black/20' : 'bg-white/5'}`}>
                  {menuData.categories.reduce((s, c) => s + c.items.length, 0)}
                </span>
              </button>
              {menuData.categories.map((cat) => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeCategory === cat.id ? 'bg-[#D97706] text-black' : 'text-white/60 hover:bg-white/5'
                  }`}>
                  <span>{cat.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${activeCategory === cat.id ? 'bg-black/10' : 'bg-white/5'}`}>
                    {cat.items.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── CENTER MAIN MENU ─────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-[#0A0A0A]">
          {/* Desktop Hero */}
          <div className="relative h-72 overflow-hidden group">
            {menuData.restaurant.bannerImageUrl ? (
              <img 
                src={menuData.restaurant.bannerImageUrl} 
                alt="Restaurant Banner" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60"
              />
            ) : (
              <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80')" }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent flex items-end p-12">
              <div className="animate-fade-in-up">
                <div className="h-1 w-12 bg-[#D97706] mb-4 rounded-full" />
                <h2 className="font-serif font-bold text-5xl text-white tracking-tight mb-3">
                  {menuData.restaurant.bannerText || 'Savor the moment'}
                </h2>
                <p className="text-white/60 text-lg font-medium max-w-lg">
                  {menuData.restaurant.bannerText ? 'Specially crafted for your fine dining experience' : 'Explore our curated selection of fresh ingredients and exquisite flavours.'}
                </p>
              </div>
            </div>
            {/* Sort in hero */}
            <div className="absolute top-8 right-12">
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-black/40 backdrop-blur-xl border border-white/10 text-white px-6 py-3 rounded-2xl text-xs font-bold outline-none hover:bg-black/60 transition-all cursor-pointer shadow-2xl">
                <option value="NONE" className="bg-[#1A1A1A]">Recommended</option>
                <option value="PRICE_ASC" className="bg-[#1A1A1A]">Price: Low to High</option>
                <option value="PRICE_DESC" className="bg-[#1A1A1A]">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* ── Chef's Special Showcase ─────────────────── */}
          {chefsSpecials.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-[#D97706]/10 border border-[#D97706]/20 flex items-center justify-center">
                  <ChefHat size={18} className="text-[#D97706]" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-[#D97706] uppercase tracking-[0.4em] mb-0.5">Signature Dishes</p>
                  <h3 className="font-serif font-bold text-2xl text-white leading-tight">Chef's <em className="text-[#D97706] not-italic">Special</em></h3>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-[#D97706]/30 to-transparent" />
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{chefsSpecials.length} Signatures</span>
              </div>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {chefsSpecials.slice(0, 4).map((item) => {
                  const count = item.orderCount || 0;
                  const rating = count >= 50 ? 4.9 : count >= 20 ? 4.7 : count >= 5 ? 4.5 : count > 0 ? 4.3 : null;
                  return (
                    <div key={item.id} className="group rounded-[2rem] overflow-hidden border border-white/5 hover:border-[#D97706]/40 bg-gradient-to-b from-[#1c1917] to-[#111] transition-all duration-500 shadow-lg hover:shadow-[0_20px_40px_rgba(217,119,6,0.12)]">
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80'}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 flex items-center gap-1 bg-[#D97706] text-black px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider">
                          <ChefHat size={8} /> Chef's Pick
                        </div>
                        <div className={`absolute top-3 right-3 w-5 h-5 rounded-md flex items-center justify-center border ${item.isVeg ? 'bg-green-500/20 border-green-500/40' : 'bg-red-500/20 border-red-500/40'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                      </div>
                      <div className="p-5">
                        <h4 className="font-serif font-bold text-base text-white group-hover:text-[#D97706] transition-colors line-clamp-1 mb-1">{item.name}</h4>
                        {rating && (
                          <div className="flex items-center gap-1.5 mb-3">
                            <div className="flex text-[#D97706]">
                              {[...Array(5)].map((_, i) => <Star key={i} size={9} fill={i < Math.floor(rating) ? 'currentColor' : 'none'} className={i < Math.floor(rating) ? '' : 'opacity-20'} />)}
                            </div>
                            <span className="text-[9px] text-white/30 font-bold">{rating} · {count}+ orders</span>
                          </div>
                        )}
                        <p className="text-[10px] text-white/40 line-clamp-2 leading-relaxed mb-4">{item.description || 'A signature creation by our expert chefs.'}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-lg text-[#D97706] tracking-tighter">₹{item.price}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="flex items-center gap-1.5 bg-[#D97706]/10 hover:bg-[#D97706] text-[#D97706] hover:text-black border border-[#D97706]/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                          >
                            <Plus size={12} /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Menu Grid */}
          <div className="p-12">
            {filteredCategories.map((cat) => (
              <section key={cat.id} id={`cat-${cat.id}`} className="mb-16 animate-fade-in-up">
                <div className="flex items-center gap-4 mb-8">
                  <h3 className="font-serif font-bold text-2xl text-white tracking-tight">
                    {cat.name}
                  </h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{cat.items.length} Options</span>
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
                  {cat.items.map((item) => (
                    <MenuItemCard key={item.id} item={item} onAdd={addToCart} cart={cart} />
                  ))}
                </div>
              </section>
            ))}
            {filteredCategories.length === 0 && (
              <div className="text-center py-24 glass rounded-[3rem] border border-dashed border-white/10">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={32} className="text-white/20" />
                </div>
                <p className="text-white/40 font-medium text-lg">No dishes match your search</p>
                <button onClick={() => setSearch('')} className="mt-4 text-[#D97706] text-sm font-bold hover:underline">Clear search</button>
              </div>
            )}
          </div>
        </main>

        {/* ── RIGHT CART PANEL ─────────────────────────── */}
        <aside className="w-80 xl:w-96 flex-shrink-0 flex flex-col border-l border-white/5 bg-[#0D0D0D] overflow-y-auto">
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D97706]/10 flex items-center justify-center border border-[#D97706]/20 shadow-[0_0_20px_rgba(217,119,6,0.1)]">
                <ShoppingCart size={18} className="text-[#D97706]" />
              </div>
              Your Selection
            </h2>
            {cart.getItemCount() > 0 && (
              <span className="text-[10px] font-black bg-gradient-to-br from-[#D97706] to-[#B45309] text-white px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg shadow-[#D97706]/20">
                {cart.getItemCount()} {cart.getItemCount() > 1 ? 'items' : 'item'}
              </span>
            )}
          </div>

          {cart.items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 opacity-40">
                <ShoppingCart size={32} className="text-white" />
              </div>
              <p className="text-white/60 font-semibold text-lg">Your cart is empty</p>
              <p className="text-sm text-white/40 mt-2 max-w-[200px]">Discover our menu and start adding your favorites</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              {cart.items.map((item) => (
                <div key={`${item.menuItemId}-${item.variantId}`} className="group relative bg-white/[0.03] rounded-3xl p-5 border border-white/5 hover:border-[#D97706]/20 transition-all duration-300">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className={`w-4 h-4 rounded-sm border flex items-center justify-center ${item.isVeg ? 'border-green-500/50' : 'border-red-500/50'}`}>
                          <span className={`block w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                        </span>
                        <p className="font-black text-sm text-white tracking-tight truncate">{item.name}</p>
                      </div>
                      {item.variantName && <p className="text-[10px] text-[#D97706] font-bold uppercase tracking-[0.2em] ml-6.5">{item.variantName}</p>}
                      {item.addonNames.length > 0 && <p className="text-[10px] text-white/30 ml-6.5 italic mt-1">+ {item.addonNames.join(', ')}</p>}
                    </div>
                    <span className="text-base font-black text-white tracking-tighter">
                      ₹{((item.price + item.addonPrices.reduce((a, b) => a + b, 0)) * item.quantity).toFixed(0)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Edit3 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                      <input type="text" placeholder="Special note..." value={item.specialInstructions}
                        onChange={(e) => cart.updateSpecialInstructions(item.menuItemId, e.target.value, item.variantId)}
                        className="w-full text-[10px] bg-white/[0.05] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder:text-white/20 border border-transparent focus:border-[#D97706]/30 focus:outline-none transition-all font-medium" />
                    </div>
                    <div className="flex items-center gap-1 bg-black/40 rounded-xl p-1 border border-white/10 shadow-inner">
                      <button onClick={() => cart.updateQuantity(item.menuItemId, item.quantity - 1, item.variantId)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-white/40 hover:text-white">
                        <Minus size={14} />
                      </button>
                      <span className="text-xs font-black w-6 text-center text-white">{item.quantity}</span>
                      <button onClick={() => cart.updateQuantity(item.menuItemId, item.quantity + 1, item.variantId)}
                        className="w-8 h-8 rounded-lg bg-[#D97706]/10 text-[#D97706] flex items-center justify-center hover:bg-[#D97706] hover:text-black transition-all shadow-sm">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Recommendations */}
              {recommendations && (recommendations as Array<{id: string; name: string; price: number; confidence: number}>).length > 0 && (
                <div className="p-4 bg-[#D97706]/5 rounded-2xl border border-[#D97706]/10">
                  <p className="text-[10px] font-black text-[#D97706] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Flame size={12} fill="currentColor" /> Frequently Paired
                  </p>
                  <div className="space-y-3">
                    {(recommendations as Array<{id: string; name: string; price: number; confidence: number}>).slice(0, 2).map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between">
                        <span className="text-xs text-white/70 font-medium">{rec.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-white/90">₹{rec.price}</span>
                          <button className="text-[10px] font-black text-[#D97706] hover:underline">ADD</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <div className="flex gap-2.5">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D97706]/50" />
                    <input type="text" placeholder="PROMO CODE" value={couponInput} onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-4 bg-white/[0.03] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/5 focus:border-[#D97706]/30 focus:outline-none text-white transition-all placeholder:text-white/10" />
                  </div>
                  <button onClick={handleApplyCoupon} disabled={couponLoading}
                    className="px-6 py-4 bg-[#D97706]/10 text-[#D97706] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#D97706] hover:text-black transition-all disabled:opacity-50 border border-[#D97706]/20 shadow-sm active:scale-95">
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {cart.couponCode && (
                  <div className="flex items-center justify-between mt-3 px-2">
                    <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider flex items-center gap-1.5">
                      <Tag size={10} fill="currentColor" /> {cart.couponCode} Applied (-₹{cart.discount.toFixed(0)})
                    </span>
                    <button onClick={() => cart.clearCoupon()} className="text-[10px] font-bold text-red-400 hover:underline">Remove</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Summary + CTA */}
          <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-xl">
            {cart.items.length > 0 && (
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs text-white/40 font-medium">
                  <span>Subtotal</span><span>₹{cart.getSubtotal().toFixed(0)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-xs text-[#D97706] font-medium">
                    <span>Promo Discount</span><span>-₹{cart.discount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-white/40 font-medium">
                  <span>GST & Service Charge</span><span>₹{cart.getTax().toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-white pt-3 border-t border-white/5 mt-2">
                  <span className="font-serif">Grand Total</span><span className="text-[#D97706]">₹{cart.getTotal().toFixed(0)}</span>
                </div>
              </div>
            )}
            <button onClick={initiateOrder} disabled={placing || cart.items.length === 0}
              className="group relative w-full bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#B45309] text-black font-black py-5 rounded-[2rem] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_20px_50px_rgba(217,119,6,0.4)] overflow-hidden text-[11px] tracking-[0.3em] uppercase border-t border-white/20"
              id="place-order-button-desktop">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative flex items-center justify-center gap-2 drop-shadow-sm">
                {placing ? 'Processing...' : cart.items.length === 0 ? 'Bag is empty' : `Confirm Order — ₹${cart.getTotal().toFixed(0)}`}
              </span>
            </button>
          </div>
        </aside>
      </div>

      {/* ═══════════════════════════════════════════════════════
           MOBILE LAYOUT  (< lg) — original single-column
          ═══════════════════════════════════════════════════════ */}
      <div className="lg:hidden pb-[120px]">
      {/* ── TopAppBar (Saffron & Stone) ──────────────────── */}
      <header className="bg-[#0A0A0A]/80 backdrop-blur-xl font-serif sticky top-0 z-50 border-b border-white/10 shadow-2xl flex justify-between items-center px-6 py-4 w-full h-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center overflow-hidden p-0.5">
            {menuData.restaurant.logoUrl ? (
              <img src={menuData.restaurant.logoUrl} alt={menuData.restaurant.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="font-serif font-bold text-lg text-brand-primary">
                {menuData.restaurant.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-serif font-black text-xl text-white tracking-tight">{menuData.restaurant.name}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Table {menuData.table.number}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {cart.customerPhone && (
            <button
              onClick={() => setShowHistory(true)}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <User size={16} className="text-white/70" />
            </button>
          )}
          {cart.customerPhone && (
            <button
              onClick={() => { cart.clearCustomerInfo(); toast.success('Signed out'); }}
              className="w-10 h-10 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center hover:bg-brand-primary/20 transition-all"
            >
              <LogOut size={16} className="text-brand-primary" />
            </button>
          )}
        </div>
      </header>

      {/* ── Hero Banner ───────────────────────────────────── */}
      <section className="mt-md mx-4 relative h-44 rounded-2xl overflow-hidden bg-surface-variant shadow-lg">
        {menuData.restaurant.bannerImageUrl ? (
          <img 
            src={menuData.restaurant.bannerImageUrl} 
            alt="Banner" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80')" }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-on-background/80 via-on-background/20 to-transparent flex items-end p-5">
          <h2 className="font-serif font-semibold text-2xl text-on-primary italic drop-shadow-lg leading-tight">
            {menuData.restaurant.bannerText || 'Savor the moment'}
          </h2>
        </div>
      </section>

      {/* ── Chef's Special ─────────────────────────────── */}
      {chefsSpecials.length > 0 && (
        <div className="mt-8">
          <div className="px-6 mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 bg-[#D97706] rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-[#D97706] uppercase tracking-[0.4em]">Most Ordered</span>
              </div>
              <h2 className="font-serif font-bold text-2xl text-white leading-tight">Chef's <em className="text-[#D97706] not-italic">Special</em></h2>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D97706]/20 to-[#B45309]/10 border border-[#D97706]/20 flex items-center justify-center shadow-[0_4px_20px_rgba(217,119,6,0.15)]">
              <ChefHat size={20} className="text-[#D97706]" />
            </div>
          </div>
          <div className="overflow-x-auto flex gap-4 px-6 pb-4 no-scrollbar">
            {chefsSpecials.map((item) => {
              const count = item.orderCount || 0;
              const rating = count >= 50 ? 4.9 : count >= 20 ? 4.7 : count >= 5 ? 4.5 : count > 0 ? 4.3 : null;
              return (
                <div key={item.id} className="flex-shrink-0 w-[190px] rounded-[1.8rem] overflow-hidden border border-white/[0.07] bg-gradient-to-b from-[#1c1917] to-[#111] hover:border-[#D97706]/40 transition-all duration-500 shadow-xl group">
                  <div className="relative h-[118px] overflow-hidden">
                    <img
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80'}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#D97706] text-black px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider shadow-lg">
                      <ChefHat size={7} /> Pick
                    </div>
                    <div className={`absolute top-2 right-2 w-4 h-4 rounded-sm flex items-center justify-center border ${item.isVeg ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-serif font-bold text-[13px] text-white line-clamp-1 mb-0.5 group-hover:text-[#D97706] transition-colors">{item.name}</h4>
                    {rating && (
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex text-[#D97706]">
                          {[...Array(5)].map((_, i) => <Star key={i} size={8} fill={i < Math.floor(rating) ? 'currentColor' : 'none'} className={i < Math.floor(rating) ? '' : 'opacity-20'} />)}
                        </div>
                        <span className="text-[8px] text-white/30 font-bold">{rating} · {count}+ orders</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-black text-[#D97706] tracking-tighter">₹{item.price}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="flex items-center gap-1 bg-[#D97706]/10 hover:bg-[#D97706] text-[#D97706] hover:text-black border border-[#D97706]/30 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all active:scale-95"
                      >
                        <Plus size={10} /> Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mx-6 mt-2 h-px bg-gradient-to-r from-transparent via-[#D97706]/20 to-transparent" />
        </div>
      )}

      {/* ── Search Bar ───────────────────────────────────── */}
      <div className="px-6 mt-8">
        <div className="relative flex items-center w-full h-14 rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden focus-within:border-brand-primary/50 transition-all shadow-inner">
          <div className="pl-5 pr-3 text-white/20 flex items-center">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search our exquisite menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 text-sm font-medium outline-none px-2"
            id="search-input"
          />
        </div>
      </div>

      {/* ── Coupons Slider ────────────────────────────────── */}
      {availableCoupons && availableCoupons.length > 0 && (
        <div className="mt-6 px-6 overflow-x-auto flex gap-4 no-scrollbar pb-2">
          {availableCoupons.map((coupon: any) => (
            <div
              key={coupon.id}
              onClick={() => { setCouponInput(coupon.code); toast.success(`${coupon.code} selected — apply in cart`); }}
              className="flex-shrink-0 px-5 py-3 rounded-2xl border border-dashed border-brand-primary/30 bg-brand-primary/5 flex items-center gap-3 cursor-pointer hover:bg-brand-primary/10 transition-all group"
            >
              <Tag size={14} className="text-brand-primary" />
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-white tracking-widest uppercase">{coupon.code}</span>
                <span className="text-[9px] text-brand-primary font-bold uppercase tracking-tighter">
                  {coupon.discountType === 'PERCENT' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Category Filters ──────────────────────────────── */}
      <div className="px-6 flex items-center gap-3 overflow-x-auto no-scrollbar py-4 sticky top-20 z-30 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/5">
        {/* Veg / Non-Veg toggles */}
        <button
          onClick={() => { setVegOnly(!vegOnly); if (!vegOnly) setNonVegOnly(false); }}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black tracking-widest transition-all uppercase ${
            vegOnly ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${vegOnly ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-white/20'}`} /> VEG
        </button>
        <button
          onClick={() => { setNonVegOnly(!nonVegOnly); if (!nonVegOnly) setVegOnly(false); }}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black tracking-widest transition-all uppercase ${
            nonVegOnly ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${nonVegOnly ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-white/20'}`} /> NON-VEG
        </button>
        <div className="w-px h-6 bg-white/10 flex-shrink-0" />
        {/* Category pills */}
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex-shrink-0 px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${
            activeCategory === 'all' ? 'bg-brand-primary text-white shadow-[0_8px_20px_rgba(217,119,6,0.2)]' : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10'
          }`}
        >
          All
        </button>
        {menuData.categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap uppercase ${
              activeCategory === cat.id ? 'bg-brand-primary text-white shadow-[0_8px_20px_rgba(217,119,6,0.2)]' : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ── Menu Sections ─────────────────────────────────── */}
      <main className="max-w-[600px] mx-auto">
        {filteredCategories.map((cat) => (
          (activeCategory === 'all' || activeCategory === cat.id) && cat.items.length > 0 && (
            <section key={cat.id} id={`cat-${cat.id}`} className="mt-4 px-4 animate-fade-in-up">
              <h3 className="font-serif font-semibold text-lg text-on-background mb-3 sticky top-[106px] bg-background/95 py-1.5 z-20 backdrop-blur-sm">
                {cat.name}
                <span className="text-sm font-sans font-normal text-on-surface-variant ml-2">({cat.items.length})</span>
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {cat.items.map((item) => (
                  <MenuItemCard key={item.id} item={item} onAdd={addToCart} cart={cart} />
                ))}
              </div>
            </section>
          )
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-16 mx-4 bg-surface-container/50 rounded-xl border border-dashed border-outline-variant">
            <Search size={36} className="text-on-surface-variant mx-auto mb-3" />
            <p className="text-on-surface-variant font-medium">No dishes match your search</p>
          </div>
        )}
      </main>

      {/* ── Sticky Cart Bar (Saffron & Stone style) ──────── */}
      {cart.getItemCount() > 0 && !showCart && (
        <div className="fixed bottom-[112px] left-6 right-6 z-[45] animate-slide-up">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-brand-primary text-white rounded-[2rem] shadow-[0_20px_50px_rgba(217,119,6,0.3)] p-5 flex items-center justify-between border border-brand-primary/20"
            id="view-cart-button"
          >
            <div>
              <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em]">{cart.getItemCount()} {cart.getItemCount() > 1 ? 'Items' : 'Item'} Added</p>
              <p className="font-black text-2xl mt-0.5 tracking-tighter">₹{cart.getTotal().toFixed(0)}</p>
            </div>
            <div className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-white/90 transition-all active:scale-95">
              <ShoppingCart size={18} />
              View Cart
            </div>
          </button>
        </div>
      )}

      {/* ── Bottom Nav Bar (mobile) ───────────────────────── */}
      <nav className="lg:hidden bg-[#0A0A0A]/95 backdrop-blur-xl font-sans text-[11px] font-semibold uppercase tracking-widest fixed bottom-0 w-full z-50 rounded-t-[2.5rem] border-t border-white/10 shadow-[0_-12px_40px_rgba(0,0,0,0.8)] flex justify-around items-center h-24 pb-safe px-6">
        <button className="flex flex-col items-center justify-center text-[#D97706] gap-1.5 group">
          <div className="w-12 h-12 rounded-2xl bg-[#D97706]/10 flex items-center justify-center mb-1 group-active:scale-95 transition-all">
            <UtensilsCrossed size={22} />
          </div>
          <span className="opacity-100">Menu</span>
        </button>
        <button onClick={() => document.getElementById('search-input')?.focus()} className="flex flex-col items-center justify-center text-white/40 hover:text-white/60 gap-1.5 transition-all group">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1 group-active:scale-95 transition-all">
            <Search size={22} />
          </div>
          <span>Search</span>
        </button>
        <button onClick={() => setShowHistory(true)} className="flex flex-col items-center justify-center text-white/40 hover:text-white/60 gap-1.5 transition-all group">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1 group-active:scale-95 transition-all">
            <Clock size={22} />
          </div>
          <span>Orders</span>
        </button>
        <button onClick={() => setShowCart(true)} className="flex flex-col items-center justify-center text-white/40 hover:text-white/60 gap-1.5 relative transition-all group">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1 group-active:scale-95 transition-all">
            <ShoppingCart size={22} />
          </div>
          <span>Cart</span>
          {cart.getItemCount() > 0 && (
            <div className="absolute top-2 right-4 w-5 h-5 bg-[#D97706] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0A0A0A] shadow-lg animate-bounce">
              {cart.getItemCount()}
            </div>
          )}
        </button>
      </nav>

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCart(false)} />
          <div className="relative mt-auto bg-[#0A0A0A] rounded-t-[3rem] max-h-[90vh] flex flex-col animate-slide-up border-t border-white/10 text-white shadow-[0_-20px_60px_rgba(0,0,0,1)]">
            {/* Handle Bar */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2" />
            
            <div className="flex items-center justify-between px-8 py-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Your Order</h2>
                <p className="text-xs text-white/50 uppercase tracking-widest mt-1">{cart.getItemCount()} {cart.getItemCount() > 1 ? 'Items' : 'Item'} Selected</p>
              </div>
              <button onClick={() => setShowCart(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-4">
              {cart.items.map((item) => (
                <div key={`${item.menuItemId}-${item.variantId}`} className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-4 h-4 rounded-sm border flex items-center justify-center ${item.isVeg ? 'border-green-500/50' : 'border-red-500/50'}`}>
                          <span className={`block w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                        </span>
                        <span className="font-bold text-base">{item.name}</span>
                      </div>
                      {item.variantName && (
                        <p className="text-xs text-[#D97706] font-medium ml-5 mb-1">{item.variantName}</p>
                      )}
                      {item.addonNames.length > 0 && (
                        <p className="text-xs text-white/40 ml-5 font-medium leading-relaxed italic">{item.addonNames.join(', ')}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black tracking-tighter">
                        ₹{((item.price + item.addonPrices.reduce((a, b) => a + b, 0)) * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
                    <div className="flex-1 mr-4">
                      <div className="relative">
                        <Edit3 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                          type="text"
                          placeholder="Note for chef..."
                          value={item.specialInstructions}
                          onChange={(e) => cart.updateSpecialInstructions(item.menuItemId, e.target.value, item.variantId)}
                          className="w-full text-xs bg-white/[0.05] rounded-xl pl-8 pr-3 py-2.5 text-white placeholder:text-white/20 border-none focus:ring-1 focus:ring-[#D97706]/50 transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex items-center bg-black/40 rounded-2xl p-1 border border-white/5">
                      <button
                        onClick={() => cart.updateQuantity(item.menuItemId, item.quantity - 1, item.variantId)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-sm font-black w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => cart.updateQuantity(item.menuItemId, item.quantity + 1, item.variantId)}
                        className="w-9 h-9 rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center hover:bg-[#D97706]/20 transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Recommendations */}
              {recommendations && (recommendations as Array<{id: string; name: string; price: number; confidence: number}>).length > 0 && (
                <div className="mt-2 p-5 bg-[#D97706]/5 rounded-[2.5rem] border border-[#D97706]/10">
                  <p className="text-[10px] text-[#D97706] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#D97706] rounded-full animate-pulse" />
                    Paired Perfectly
                  </p>
                  <div className="space-y-3">
                    {(recommendations as Array<{id: string; name: string; price: number; confidence: number}>).map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between group">
                        <span className="text-sm text-white/70 group-hover:text-white transition-colors">{rec.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[#D97706]">₹{rec.price}</span>
                          <button className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 hover:bg-[#D97706] hover:text-white transition-all">
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coupon */}
              <div className="pt-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      placeholder="ENTER COUPON CODE"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-white/[0.03] rounded-[1.5rem] text-xs font-bold tracking-widest border border-white/5 focus:border-[#D97706]/50 focus:outline-none text-white placeholder:text-white/20 uppercase transition-all"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className="px-8 py-4 bg-[#D97706]/10 text-[#D97706] text-[10px] font-black rounded-[1.5rem] hover:bg-[#D97706] hover:text-black border border-[#D97706]/20 transition-all disabled:opacity-50 uppercase tracking-widest active:scale-95 shadow-sm"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {cart.couponCode && (
                  <div className="flex items-center justify-between mt-3 px-2">
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      {cart.couponCode} APPLIED (-₹{cart.discount.toFixed(0)})
                    </span>
                    <button onClick={() => cart.clearCoupon()} className="text-[10px] font-black text-white/30 hover:text-red-500 uppercase tracking-widest">Remove</button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-8 pb-12 border-t border-white/10 bg-black/40 backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-y-2 mb-8 px-2">
                <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Subtotal</span>
                <span className="text-xs text-white font-bold text-right">₹{cart.getSubtotal().toFixed(0)}</span>
                
                {cart.discount > 0 && (
                  <>
                    <span className="text-xs text-green-500/80 font-bold uppercase tracking-widest">Discount</span>
                    <span className="text-xs text-green-500 font-bold text-right">-₹{cart.discount.toFixed(0)}</span>
                  </>
                )}
                
                <span className="text-xs text-white/40 font-bold uppercase tracking-widest">GST & Service Charge</span>
                <span className="text-xs text-white font-bold text-right">₹{cart.getTax().toFixed(0)}</span>
                
                <div className="col-span-2 my-2 border-t border-white/5" />
                
                <span className="text-lg font-black tracking-tight text-white uppercase">Grand Total</span>
                <span className="text-2xl font-black tracking-tighter text-white text-right">₹{cart.getTotal().toFixed(0)}</span>
              </div>

              <button
                onClick={initiateOrder}
                disabled={placing || cart.items.length === 0}
                className="group relative w-full bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#B45309] text-black font-black py-6 rounded-[2.5rem] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_25px_60px_rgba(217,119,6,0.4)] overflow-hidden border-t border-white/20"
                id="place-order-button"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <div className="relative flex items-center justify-center gap-3">
                  <span className="uppercase tracking-[0.3em] text-[11px] drop-shadow-sm">{placing ? 'Processing Order...' : `Confirm Order — ₹${cart.getTotal().toFixed(0)}`}</span>
                  {!placing && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* end mobile layout */}
      </div>
    </div>
    )}

      {/* CustomerAuthModal is shared — works for both desktop and mobile */}
      <CustomerAuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          // Always attempt to place the order after successful authentication
          handlePlaceOrder();
        }}
        isForced={!cart.customerPhone}
        slug={slug!}
      />



      {/* ── Profile / History Drawer (shared) ─── shown on both layouts */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end lg:justify-center">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in" onClick={() => setShowHistory(false)} />
          <div className="relative bg-[#0A0A0A] rounded-t-[3.5rem] lg:rounded-[3rem] max-h-[85vh] h-[80vh] lg:h-[600px] w-full lg:w-[480px] flex flex-col animate-slide-up border-t lg:border border-white/10 shadow-[0_-20px_80px_rgba(0,0,0,1)] text-white overflow-hidden">
            {/* Decorative Saffron Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#D97706]/5 rounded-full -mt-32 blur-[100px] pointer-events-none" />

            <div className="flex items-center justify-between p-8 border-b border-white/5 bg-black/20 relative z-10">
              <div>
                <h2 className="text-2xl font-black tracking-tight mb-1">Your Profile</h2>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-[#D97706]/10 border border-[#D97706]/20 rounded-lg">
                    <span className="text-[10px] text-[#D97706] font-black uppercase tracking-widest">{cart.customerName}</span>
                  </div>
                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{cart.customerPhone}</span>
                </div>
              </div>
              <button onClick={() => setShowHistory(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors">
                <X size={20} className="text-white/60" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-1 bg-[#D97706] rounded-full" />
                <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Clock size={14} /> Order Expedition Log
                </h3>
              </div>

              {!history ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Retrieving archives...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem] p-10">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/5">
                    <Clock size={32} className="text-white/20" />
                  </div>
                  <p className="text-white/60 font-black uppercase tracking-widest text-[11px] mb-2">No past logs found</p>
                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-tighter">Your culinary journey begins here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((order: any) => (
                    <div key={order.id} className="group bg-white/[0.03] rounded-[2rem] p-6 border border-white/5 hover:border-[#D97706]/30 transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm font-black text-white mb-1">{order.branch.name}</p>
                          <p className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">
                            {new Date(order.createdAt).toLocaleDateString()} — {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border ${
                          order.status === 'COMPLETED' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                          order.status === 'CANCELLED' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                          'bg-[#D97706]/10 border-[#D97706]/20 text-[#D97706]'
                        }`}>
                          {order.status}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {order.items.slice(0, 3).map((item: any, i: number) => (
                          <div key={i} className="text-[10px] font-bold text-white/50 bg-white/[0.05] px-3 py-1 rounded-lg border border-white/5">
                            <span className="text-[#D97706] mr-1">{item.quantity}x</span> {item.menuItem.name}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="text-[10px] font-bold text-[#D97706] bg-[#D97706]/5 px-3 py-1 rounded-lg border border-[#D97706]/10 animate-pulse">
                            + {order.items.length - 3} more
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">Total Transaction</span>
                        <span className="text-lg font-black text-white tracking-tighter">₹{order.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-8 bg-black/40 border-t border-white/5 text-center">
              <p className="text-[9px] font-bold text-white/10 uppercase tracking-[0.5em]">End of session logs</p>
            </div>
          </div>
        </div>
      )}
      {/* Modern Checkout Modal (Saffron & Stone) */}
      {showCheckout && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 sm:p-0">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-fade-in" onClick={() => setShowCheckout(false)} />
          <div className="relative w-full max-w-lg bg-[#0A0A0A] rounded-[3rem] p-8 sm:p-10 animate-slide-up border border-white/10 shadow-[0_32px_100px_rgba(0,0,0,1)] text-white overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#D97706]/10 rounded-full -mt-32 blur-[100px] pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <p className="text-[10px] font-black text-[#D97706] uppercase tracking-[0.4em] mb-2">Final Protocol</p>
                <h2 className="text-3xl font-serif font-black tracking-tight">Confirm Order</h2>
              </div>
              <button onClick={() => setShowCheckout(false)} className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all">
                <X size={24} className="text-white/60" />
              </button>
            </div>

            <div className="space-y-6 mb-8 relative z-10 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-1 bg-[#D97706] rounded-full" />
                <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Itemized Manifest</p>
              </div>

              {cart.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start py-4 border-b border-white/5 last:border-0">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-[#D97706]">
                      {item.quantity}x
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-tight">{item.name}</p>
                      {(item.variantName || (item.addons && item.addons.length > 0)) && (
                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-1">
                          {item.variantName}{item.addons && item.addons.length > 0 ? ` • ${item.addons.map(a => a.name).join(', ')}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-black text-white tracking-tighter">₹{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 bg-white/[0.02] rounded-[2.5rem] p-8 border border-white/5 relative z-10">
              <div className="flex justify-between text-[11px] text-white/40 font-black uppercase tracking-widest">
                <span>Subtotal</span>
                <span>₹{cart.getSubtotal().toFixed(0)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-[11px] text-[#D97706] font-black uppercase tracking-widest">
                  <span>Promo Reduction</span>
                  <span>-₹{cart.discount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] text-white/40 font-black uppercase tracking-widest">
                <span>Regulatory Tax (GST)</span>
                <span>₹{cart.getTax().toFixed(0)}</span>
              </div>
              <div className="pt-4 border-t border-white/10 mt-2 flex justify-between items-center">
                <span className="text-sm font-black text-white uppercase tracking-[0.2em]">Grand Total</span>
                <span className="text-3xl font-black text-[#D97706] tracking-tighter shadow-orange-500/20 drop-shadow-lg">₹{cart.getTotal().toFixed(0)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="group relative w-full py-7 mt-8 bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#B45309] text-black font-black rounded-[2.5rem] transition-all active:scale-[0.98] shadow-[0_30px_70px_rgba(217,119,6,0.4)] overflow-hidden border-t border-white/20"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <div className="relative flex items-center justify-center gap-3 uppercase tracking-[0.3em] text-[11px] drop-shadow-sm">
                {placing ? 'Transmitting Data...' : 'Confirm & Place Order'}
              </div>
            </button>
            
            <p className="text-center text-[9px] text-white/20 font-bold uppercase tracking-[0.3em] mt-6 leading-relaxed">
              By confirming, you authorize this transaction protocol <br/> in accordance with restaurant guidelines.
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ── Menu Item Card Component ──────────────

function MenuItemCard({ item, onAdd, cart }: {
  item: MenuItem;
  onAdd: (item: MenuItem, variantId?: string, addonIds?: string[]) => void;
  cart: any;
}) {
  if (!item) return null;

  const [showCustomize, setShowCustomize] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const safeVariants = item.variants || [];
  const safeAddons = item.addons || [];

  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    safeVariants.length > 0 ? safeVariants[0]?.id : undefined
  );
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const cartItem = cart.items.find((i: any) => i.menuItemId === item.id);
  const hasVariants = safeVariants.length > 0;

  useEffect(() => {
    if (showCustomize || showDetails) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCustomize, showDetails]);

  const handleAdd = () => {
    if (hasVariants || safeAddons.length > 0) {
      setShowCustomize(true);
    } else {
      onAdd(item);
    }
  };

  const confirmAdd = () => {
    onAdd(item, selectedVariant, selectedAddons);
    setShowCustomize(false);
    setSelectedAddons([]);
  };

  return (
    <>
      <div className="group relative bg-[#1A1A1A] rounded-[2rem] overflow-hidden border border-white/5 hover:border-[#D97706]/30 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col">
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80'} 
            alt={item.name} 
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${!item.isAvailable ? 'grayscale opacity-50' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent opacity-60" />
          
          {!item.isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <div className="px-4 py-1.5 bg-black/90 border border-white/10 rounded-full shadow-2xl">
                <span className="text-[9px] font-black text-white/90 uppercase tracking-[0.2em]">Sold Out</span>
              </div>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            <div className={`w-5 h-5 rounded-lg backdrop-blur-md flex items-center justify-center border ${item.isVeg ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
            {item.isPopular && (
              <div className="bg-[#D97706] text-black text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-xl">
                <Flame size={9} fill="currentColor" /> Bestseller
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-serif font-bold text-lg text-white group-hover:text-[#D97706] transition-colors line-clamp-1" onClick={() => setShowDetails(true)}>{item.name}</h4>
            <span className="text-sm font-black text-white/90">₹{item.price}</span>
          </div>
          
          <p className="text-white/40 text-xs leading-relaxed line-clamp-2 mb-6 min-h-[32px]">
            {item.description || 'A masterpiece of culinary excellence, prepared with the finest seasonal ingredients.'}
          </p>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {(() => {
                const count = item.orderCount || 0;
                const r = count >= 100 ? 4.9 : count >= 50 ? 4.7 : count >= 20 ? 4.5 : count >= 5 ? 4.2 : count > 0 ? 4.0 : 0;
                if (!r) return (
                  <span className="text-[8px] font-black text-[#D97706]/60 px-2 py-0.5 bg-[#D97706]/5 rounded-md border border-[#D97706]/10 uppercase tracking-wider">New</span>
                );
                return (
                  <>
                    <div className="flex text-[#D97706]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill={i < Math.floor(r) ? 'currentColor' : 'none'} className={i < Math.floor(r) ? '' : 'opacity-20'} />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{r} ({count}+)</span>
                  </>
                );
              })()}
            </div>

            {item.isAvailable ? (
              cartItem ? (
                <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-1 border border-white/10">
                  <button onClick={() => cart.updateQuantity(item.id, cartItem.quantity - 1, cartItem.variantId)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-white/60">
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-bold text-white w-4 text-center">{cartItem.quantity}</span>
                  <button onClick={handleAdd}
                    className="w-8 h-8 rounded-xl bg-[#D97706] flex items-center justify-center hover:bg-[#B45309] transition-all text-black shadow-lg">
                    <Plus size={14} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleAdd}
                  className="flex items-center gap-2 bg-white/5 hover:bg-[#D97706] text-white hover:text-black px-6 py-2.5 rounded-2xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest border border-white/10 hover:border-[#D97706]"
                >
                  Add <Plus size={12} />
                </button>
              )
            ) : (
              <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 opacity-50 cursor-not-allowed">
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Out of Stock</span>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Item Details Info Drawer */}
      {showDetails && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in" onClick={() => setShowDetails(false)} />
          <div className="relative w-full max-w-[440px] bg-[#0A0A0A] rounded-[3rem] overflow-hidden animate-slide-up shadow-[0_32px_80px_rgba(0,0,0,1)] border border-white/10">
            {item.imageUrl ? (
               <div className="relative h-80">
                 <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
               </div>
            ) : (
               <div className="w-full h-80 bg-white/5 flex items-center justify-center text-8xl">
                  {item.isVeg ? '🥗' : '🍗'}
               </div>
            )}
            
            <button onClick={() => setShowDetails(false)} className="absolute top-6 right-6 w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all z-10">
              <X size={24} className="text-white" />
            </button>

            <div className="p-10 -mt-20 relative">
               <div className="flex items-center gap-2 mb-4">
                  <span className={`w-4 h-4 rounded-sm border flex items-center justify-center ${item.isVeg ? 'border-green-500/50' : 'border-red-500/50'}`}>
                    <span className={`block w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                  </span>
                  <span className="text-[10px] font-black text-[#D97706] uppercase tracking-[0.2em]">{item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}</span>
               </div>

               <div className="flex items-end justify-between mb-6 gap-4">
                  <h3 className="text-4xl font-serif font-black text-white tracking-tight leading-none">{item.name}</h3>
                  <span className="text-3xl font-black text-[#D97706] tracking-tighter shrink-0">₹{item.price}</span>
               </div>
               
               <p className="text-base text-white/50 leading-relaxed mb-8 font-medium">
                  {item.description || "A masterfully crafted selection featuring premium local ingredients and traditional culinary techniques."}
               </p>

               <div className="flex flex-wrap gap-2.5 mb-10">
                  {(item.tags || []).map(t => (
                     <span key={t} className="px-4 py-2 bg-white/[0.03] border border-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest">{t}</span>
                  ))}
                  {item.preparationTimeMinutes > 0 && (
                     <div className="flex items-center gap-2 px-4 py-2 bg-[#D97706]/10 border border-[#D97706]/20 text-[#D97706] rounded-xl">
                       <Clock size={12} />
                       <span className="text-[10px] font-black tracking-widest uppercase">{item.preparationTimeMinutes} Min Prep</span>
                     </div>
                  )}
               </div>

               <button
                  onClick={() => {
                     if (!item.isAvailable) return;
                     setShowDetails(false);
                     handleAdd();
                  }}
                  disabled={!item.isAvailable}
                  className={`group relative w-full py-5 ${item.isAvailable ? 'bg-gradient-to-r from-[#D97706] to-[#B45309]' : 'bg-white/5 cursor-not-allowed'} text-white font-black uppercase tracking-[0.2em] text-sm rounded-[2rem] shadow-[0_15px_40px_rgba(217,119,6,0.3)] transition-all active:scale-[0.98] overflow-hidden`}
               >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative flex items-center justify-center gap-3">
                    {item.isAvailable ? (
                      <>Add to Bag <Plus size={18} /></>
                    ) : (
                      <>Currently Unavailable</>
                    )}
                  </span>
               </button>
             </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modern Customize Sheet (Mobile Optimized) */}
      {showCustomize && createPortal(
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in" onClick={() => setShowCustomize(false)} />
          <div className="relative w-full max-w-lg bg-[#0A0A0A] rounded-t-[4rem] sm:rounded-[3.5rem] p-10 animate-slide-up border-t sm:border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,1)] text-white">
            <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-10 sm:hidden" />
            
            <div className="flex items-start justify-between mb-10">
              <div>
                <p className="text-[10px] font-black text-[#D97706] uppercase tracking-[0.3em] mb-2">Personalize Your Dish</p>
                <h3 className="text-3xl font-serif font-black tracking-tight">{item.name}</h3>
              </div>
              <button onClick={() => setShowCustomize(false)} className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all">
                <X size={24} className="text-white/60" />
              </button>
            </div>

            <div className="space-y-10 max-h-[55vh] overflow-y-auto pr-4 scrollbar-hide mb-10">
              {safeVariants.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-1 bg-[#D97706] rounded-full" />
                    <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Select Variant</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {safeVariants.map((v) => (
                      <label
                        key={v.id}
                        className={`group flex items-center justify-between p-6 rounded-[2rem] cursor-pointer transition-all border-2 ${
                          selectedVariant === v.id ? 'bg-[#D97706]/5 border-[#D97706] shadow-[0_10px_30px_rgba(217,119,6,0.1)]' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedVariant === v.id ? 'border-[#D97706]' : 'border-white/20'}`}>
                            {selectedVariant === v.id && <div className="w-2.5 h-2.5 bg-[#D97706] rounded-full shadow-[0_0_8px_rgba(217,119,6,0.5)]" />}
                          </div>
                          <span className={`text-base font-bold tracking-tight transition-colors ${selectedVariant === v.id ? 'text-[#D97706]' : 'text-white/60 group-hover:text-white'}`}>{v.name}</span>
                        </div>
                        <span className={`text-sm font-black ${selectedVariant === v.id ? 'text-[#D97706]' : 'text-white/30'}`}>
                          {v.additionalPrice > 0 ? `+₹${v.additionalPrice}` : v.additionalPrice < 0 ? `-₹${Math.abs(v.additionalPrice)}` : 'Standard'}
                        </span>
                        <input
                          type="radio"
                          className="hidden"
                          checked={selectedVariant === v.id}
                          onChange={() => setSelectedVariant(v.id)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {safeAddons.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-1 bg-[#D97706] rounded-full" />
                    <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Enhancements</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {safeAddons.map((a) => (
                      <label
                        key={a.id}
                        className={`group flex items-center justify-between p-6 rounded-[2rem] cursor-pointer transition-all border-2 ${
                          selectedAddons.includes(a.id) ? 'bg-[#D97706]/5 border-[#D97706] shadow-[0_10px_30px_rgba(217,119,6,0.1)]' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${selectedAddons.includes(a.id) ? 'bg-[#D97706] border-[#D97706] shadow-[0_0_12px_rgba(217,119,6,0.4)]' : 'border-white/20'}`}>
                            {selectedAddons.includes(a.id) && <Check size={14} className="text-black font-black" />}
                          </div>
                          <span className={`text-base font-bold tracking-tight transition-colors ${selectedAddons.includes(a.id) ? 'text-[#D97706]' : 'text-white/60 group-hover:text-white'}`}>{a.name}</span>
                        </div>
                        <span className={`text-sm font-black ${selectedAddons.includes(a.id) ? 'text-[#D97706]' : 'text-white/30'}`}>
                          {a.price > 0 ? `+₹${a.price}` : 'Free'}
                        </span>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedAddons.includes(a.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedAddons([...selectedAddons, a.id]);
                            else setSelectedAddons(selectedAddons.filter((id) => id !== a.id));
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={confirmAdd}
              className="group relative w-full py-6 bg-gradient-to-r from-[#D97706] to-[#B45309] text-white font-black rounded-[2.5rem] transition-all active:scale-[0.98] shadow-[0_20px_50px_rgba(217,119,6,0.3)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <div className="relative flex items-center justify-center gap-3">
                <span className="uppercase tracking-[0.2em] text-sm">Add Selection — ₹{(item.price + (safeVariants.find(v => v.id === selectedVariant)?.additionalPrice || 0) + safeAddons.filter(a => selectedAddons.includes(a.id)).reduce((sum, a) => sum + a.price, 0))}</span>
              </div>
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
