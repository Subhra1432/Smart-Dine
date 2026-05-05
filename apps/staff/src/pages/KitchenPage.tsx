// ═══════════════════════════════════════════
// DineSmart — Kitchen Display System (KDS)
// Design System: Saffron & Stone (Industrial)
// ═══════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKitchenOrders, updateItemStatus } from '../lib/api';
import { useAuthStore } from '../store/auth';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { NOTIFICATION_SOUND } from '../assets/audio';
import { Clock, ChefHat, Check, LogOut, Volume2, VolumeX, ShieldCheck, Flame, Timer, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageLoader } from '../components/PageLoader';

interface KitchenOrder {
  id: string;
  createdAt: string;
  table: { number: number };
  branch: { name: string };
  items: Array<{
    id: string;
    menuItem: { name: string; preparationTimeMinutes: number };
    quantity: number;
    status: string;
    specialInstructions: string;
    variant?: { name: string } | null;
  }>;
}

export default function KitchenPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { clearAuth, user } = useAuthStore();
  const isKitchenStaff = user?.role === 'KITCHEN_STAFF';
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioContextUnlocked, setAudioContextUnlocked] = useState(() => sessionStorage.getItem('kds_audio_unlocked') === 'true');
  const audioContextRef = useRef<AudioContext | null>(null);

  // Auto-determine branch from login credentials
  const selectedBranchId = user?.branchId || '';

  const { data: orders, isLoading: ordersLoading } = useQuery<KitchenOrder[]>({
    queryKey: ['kitchenOrders', selectedBranchId],
    queryFn: () => getKitchenOrders(selectedBranchId) as Promise<KitchenOrder[]>,
    refetchInterval: 10000,
  });

  const isLoading = ordersLoading || !orders;

  const statusMutation = useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: string }) => updateItemStatus(itemId, status),
    onMutate: async ({ itemId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['kitchenOrders'] });
      const previousOrders = queryClient.getQueryData<KitchenOrder[]>(['kitchenOrders']);

      if (previousOrders) {
        const nextOrders = previousOrders.map(order => ({
          ...order,
          items: order.items.map(item => 
            item.id === itemId ? { ...item, status } : item
          )
        }));
        queryClient.setQueryData(['kitchenOrders'], nextOrders);
      }

      return { previousOrders };
    },
    onError: (err, _, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['kitchenOrders'], context.previousOrders);
      }
      toast.error(err instanceof Error ? err.message : 'Failed to update item');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
    }
  });

  const playNotificationSound = async () => {
    if (!audioEnabledRef.current) return;
    
    try {
      const audioUrl = useAuthStore.getState().restaurant?.notificationSoundUrl || NOTIFICATION_SOUND;
      const dingAudio = new Audio(audioUrl);
      await dingAudio.play();
    } catch (err) {
      console.error('KDS Audio Playback failed:', err);
    }
  };


  const unlockAudio = async () => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      await audioContextRef.current.resume();
      sessionStorage.setItem('kds_audio_unlocked', 'true');
      setAudioContextUnlocked(true);
      playNotificationSound();
      toast.success('Audio Intelligence Synchronized');
    } catch (err) {
      console.error('Failed to unlock audio:', err);
    }
  };

  const audioEnabledRef = useRef(audioEnabled);
  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  // Socket.io Integration
  useEffect(() => {
    const socket = io('/restaurant', {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('✅ KDS: Socket connected (ID:', socket.id, ')');
      socket.emit('join:kitchen');
    });

    socket.on('connect_error', (err) => {
      console.error('❌ KDS: Socket connection error:', err.message);
    });

    socket.on('order:new', (order) => {
      console.log('🔔 KDS: New order event received!', order);
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
      toast('🍳 NEW ORDER RECEIVED', { 
        icon: '🔥', 
        style: { background: '#0c0a09', color: '#fff', fontWeight: 'bold' } 
      });
      
      if (audioEnabledRef.current) {
        console.log('🔊 KDS: Triggering synthesized notification sound');
        playNotificationSound();
      }
    });

    socket.on('payment:request_at_desk', (data: { tableNumber: number }) => {
      console.log('💳 KDS: Payment attention requested for table', data.tableNumber);
      toast(`💳 TABLE #${data.tableNumber} REQUESTED CHECK`, { icon: '💰', duration: 10000 });
      if (audioEnabledRef.current) {
        playNotificationSound();
      }
    });

    socket.on('order:item_status_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
    });

    return () => {
      socket.off('order:new');
      socket.off('payment:request_at_desk');
      socket.off('order:item_status_updated');
      socket.disconnect();
    };
  }, [queryClient]); // Stable dependencies

  const playTestSound = () => {
    playNotificationSound();
    toast.success('Audio system active');
  };

  const handleItemStatus = (itemIds: string[], status: string) => {
    itemIds.forEach(itemId => {
      statusMutation.mutate({ itemId, status }, {
        onSuccess: () => {
          if (status === 'READY') toast.success('ITEM PREPARED');
        }
      });
    });
  };

  const handleOrderAction = (order: KitchenOrder, action: 'START' | 'DONE') => {
    order.items.forEach(item => {
        if (action === 'START' && item.status === 'PENDING') {
            handleItemStatus([item.id], 'PREPARING');
        } else if (action === 'DONE' && (item.status === 'PREPARING' || item.status === 'PENDING')) {
            handleItemStatus([item.id], 'READY');
        }
    });
    toast.success(action === 'START' ? 'ALL ITEMS INITIALIZED' : 'BATCH COMPLETED');
  };

  const groupKitchenItems = (items: any[]) => {
    const map: Record<string, any> = {};
    items.forEach(item => {
      const key = `${item.menuItem.name}-${item.status}-${item.specialInstructions || ''}-${item.variant?.name || ''}`;
      if (map[key]) {
        map[key].quantity += item.quantity;
        map[key].ids.push(item.id);
      } else {
        map[key] = { ...item, ids: [item.id] };
      }
    });
    return Object.values(map);
  };

  const handleLogout = () => { clearAuth(); navigate('/login'); };

  const getElapsedMinutes = (createdAt: string) => {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  };

  return (
    <div className="min-h-screen bg-transparent p-6 relative overflow-hidden flex flex-col font-sans transition-colors duration-700">
      <PageLoader isLoading={isLoading} />
      {/* Header Matrix */}
      <header className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-stone-950 dark:bg-primary shadow-2xl border border-white/10 dark:border-stone-950/20 group overflow-hidden relative flex items-center justify-center">
            <ChefHat size={28} className="text-white dark:text-stone-950 relative z-10 group-hover:rotate-12 transition-transform duration-500" />
            <div className="absolute inset-0 bg-primary/20 dark:bg-stone-950/20 scale-0 group-hover:scale-100 transition-transform duration-700" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5 mb-1">
               <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
               <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">Live Operations Control</p>
            </div>
            <h1 className="text-3xl font-black text-stone-950 dark:text-white tracking-tighter uppercase leading-none">
              Kitchen <span className="text-stone-300 dark:text-stone-700 font-black italic">Matrix</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-6 px-6 py-3.5 rounded-2xl glass dark:bg-stone-900/40 border border-white dark:border-white/5 shadow-sm mr-2">
            <div className="text-right">
              <p className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] mb-0.5">System Load</p>
              <p className="text-lg font-black text-stone-950 dark:text-white uppercase tracking-tight flex items-center justify-end gap-2.5">
                <Activity size={16} className="text-primary" />
                {orders?.length || 0} Tasks
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={playTestSound}
              className="p-4 rounded-xl bg-white/60 dark:bg-stone-800 text-stone-400 hover:text-amber-500 transition-all active:scale-90 border border-white dark:border-white/5"
              title="Test Sound"
            >
              <Activity size={20} />
            </button>
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-4 rounded-xl transition-all duration-500 active:scale-90 ${audioEnabled ? 'bg-stone-950 dark:bg-primary text-white dark:text-stone-950 shadow-2xl shadow-stone-950/20 dark:shadow-primary/20' : 'bg-white/60 dark:bg-stone-800 text-stone-300 dark:text-stone-600 border border-white dark:border-white/5'}`}
            >
              {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Grid Matrix */}
      <div className="relative z-10 flex-1">
        {orders && orders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
            {orders.map((order) => {
              const elapsed = getElapsedMinutes(order.createdAt);
              const isUrgent = elapsed > 15;

              return (
                <div
                  key={order.id}
                  className={`rounded-3xl p-6 border transition-all duration-700 flex flex-col h-full group ${
                    isUrgent 
                      ? 'border-red-500 bg-red-500/[0.03] shadow-[0_20px_60px_rgba(239,68,68,0.15)] ring-2 ring-red-500/20' 
                      : 'glass-panel dark:bg-stone-900/40 border-stone-200/50 dark:border-white/5 bg-white/50 backdrop-blur-3xl shadow-xl shadow-stone-200/40 dark:shadow-black/50 hover:shadow-stone-200 dark:hover:shadow-primary/10 hover:scale-[1.02]'
                  }`}
                >
                  {/* Card ID Header */}
                  <div className="flex items-center justify-between mb-6 pb-5 border-b border-stone-200/30 dark:border-white/5">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${isUrgent ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-stone-950 dark:bg-primary text-white dark:text-stone-950 shadow-lg shadow-stone-950/20 dark:shadow-primary/20'}`}>
                        {order.table.number}
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] mb-0.5">Index</p>
                        <p className="text-xs font-black text-stone-950 dark:text-white uppercase tracking-[0.2em]">Table Order</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] ${
                      isUrgent ? 'bg-red-500 text-white animate-pulse' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                    }`}>
                      <Timer size={12} />
                      {elapsed} MINS
                    </div>
                  </div>

                  {/* Order Items Matrix */}
                  <div className="space-y-4 flex-1">
                    {groupKitchenItems(order.items).map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`rounded-2xl p-4 border transition-all duration-500 ${
                          item.status === 'READY' 
                            ? 'bg-primary/[0.03] border-primary/10 opacity-50' 
                            : item.status === 'PREPARING'
                            ? 'bg-primary/[0.08] border-primary/30 ring-1 ring-primary/10'
                            : 'bg-white/80 dark:bg-stone-800/40 border-white dark:border-white/5 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`text-[10px] font-black w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${item.status === 'READY' ? 'bg-primary text-stone-950' : 'bg-stone-950 dark:bg-stone-700 text-white'}`}>
                                {item.quantity}
                              </span>
                              <p className="text-[13px] font-black text-stone-950 dark:text-white uppercase tracking-tight truncate leading-tight">
                                {item.menuItem.name}
                              </p>
                            </div>
                            
                            {item.variant && (
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-stone-100/80 dark:bg-white/5 mb-2 border border-stone-200/50 dark:border-white/5">
                                <span className="text-[7px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-[0.2em]">{item.variant.name}</span>
                              </div>
                            )}

                            {item.specialInstructions && (
                              <div className="p-2.5 bg-primary/[0.05] border border-primary/10 rounded-xl mb-2">
                                <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                  <Flame size={12} className="text-primary" /> {item.specialInstructions}
                                </p>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 mt-3">
                               <div className="flex items-center gap-1.5">
                                 <Clock size={10} className="text-stone-300 dark:text-stone-600" />
                                 <span className="text-[8px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-[0.2em]">{item.menuItem.preparationTimeMinutes}M EST</span>
                               </div>
                               <div className="flex items-center gap-2">
                                 <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'READY' ? 'bg-primary shadow-[0_0_6px_rgba(245,158,11,0.5)]' : item.status === 'PREPARING' ? 'bg-primary animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-stone-200 dark:bg-stone-700'}`} />
                                 <span className="text-[8px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-[0.2em]">{item.status}</span>
                               </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            {isKitchenStaff && item.status === 'PENDING' && (
                              <button
                                onClick={() => handleItemStatus(item.ids, 'PREPARING')}
                                className="w-10 h-10 rounded-xl bg-white dark:bg-stone-800 hover:bg-primary dark:hover:bg-primary hover:text-white dark:hover:text-stone-950 text-stone-300 dark:text-stone-600 border border-stone-100 dark:border-white/5 hover:border-primary transition-all duration-500 flex items-center justify-center shadow-sm active:scale-90"
                              >
                                <Flame size={18} />
                              </button>
                            )}
                            {isKitchenStaff && item.status === 'PREPARING' && (
                              <button
                                onClick={() => handleItemStatus(item.ids, 'READY')}
                                className="w-10 h-10 rounded-xl bg-primary text-stone-950 dark:text-stone-950 hover:bg-primary/90 transition-all duration-500 flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90"
                              >
                                <Check size={20} strokeWidth={3} />
                              </button>
                            )}
                            {item.status === 'READY' && (
                              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                                <Check size={20} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Batch Controls */}
                  {isKitchenStaff && (
                    <div className="mt-8 pt-6 border-t border-stone-200/30 dark:border-white/5 grid grid-cols-2 gap-3.5">
                      <button
                        onClick={() => handleOrderAction(order, 'START')}
                        className="py-4 bg-stone-950 dark:bg-stone-800 hover:bg-stone-900 dark:hover:bg-stone-700 text-white font-black text-[8px] rounded-2xl transition-all duration-500 uppercase tracking-[0.4em] active:scale-95 shadow-xl shadow-stone-950/20"
                      >
                        Batch Start
                      </button>
                      <button
                        onClick={() => handleOrderAction(order, 'DONE')}
                        className="py-4 bg-primary hover:bg-primary/90 text-stone-950 font-black text-[8px] rounded-2xl transition-all duration-500 uppercase tracking-[0.4em] active:scale-95 shadow-xl shadow-primary/30"
                      >
                        Batch Done
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-1000">
            <div className="relative mb-12">
              <div className="absolute -inset-16 bg-primary/10 blur-[100px] rounded-full opacity-50" />
              <div className="relative w-28 h-28 rounded-3xl bg-white/60 dark:bg-stone-900/60 backdrop-blur-xl flex items-center justify-center border border-white dark:border-white/5 shadow-2xl">
                <ChefHat size={48} strokeWidth={1} className="text-stone-300 dark:text-stone-700" />
              </div>
            </div>
            <p className="text-2xl font-black text-stone-950 dark:text-white uppercase tracking-tighter mb-3">Quiescent state</p>
            <p className="text-[9px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-[0.5em] text-center">Awaiting incoming transmissions</p>
          </div>
        )}
      </div>

      {/* Footer Identity */}
      <footer className="relative z-10 pt-8 mt-auto border-t border-stone-200/30 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(245,158,11,0.8)] animate-pulse" />
          <span className="text-[8px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em]">DS-KDS OPERATIONAL CORE V2.4 // SYNCED</span>
        </div>
        <div className="flex items-center gap-5">
          <ShieldCheck size={16} className="text-primary" />
          <div className="h-5 w-[1px] bg-stone-200 dark:bg-white/5" />
          <span className="text-[9px] font-black text-stone-950 dark:text-white uppercase tracking-[0.3em]">{user?.email}</span>
        </div>
      </footer>

      {/* Audio Activation Overlay */}
      {!audioContextUnlocked && (
        <div className="fixed inset-0 z-[100] bg-stone-950/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-700">
          <div className="glass-card max-w-sm p-10 text-center space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl relative">
              <Volume2 size={32} className="text-primary animate-bounce" />
              <div className="absolute inset-0 bg-primary/20 rounded-[2rem] animate-ping opacity-20" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Audio Link Required</h3>
              <p className="text-[9px] text-stone-500 font-black uppercase tracking-[0.2em] leading-relaxed">
                Browser security protocols have throttled audio output. Initialize manual uplink to enable order chimes.
              </p>
            </div>
            <button
              onClick={unlockAudio}
              className="w-full py-5 bg-white text-black hover:bg-primary rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] transition-all active:scale-95 shadow-xl shadow-white/5"
            >
              Initialize Uplink
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

