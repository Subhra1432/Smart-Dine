// DineSmart — Billing Page
// Design System: Saffron & Stone (Industrial)
// ═══════════════════════════════════════════

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {
  getBillingTables, getBillingOrders, updateOrderStatus,
  updatePaymentStatus, printBill, printCustomerSummary, printTableSummary,
  getBranches, getMenuItems, addItemToOrder, createOrder,
  updateOrderItem
} from '../lib/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { NOTIFICATION_SOUND } from '../assets/audio';
import { useAuthStore } from '../store/auth';
import {
  DollarSign, Clock, CheckCircle, X, Printer, CreditCard,
  Circle, AlertCircle, User, Phone, Plus, Search, ChevronRight, Trash2, Check, Volume2
} from 'lucide-react';
import { PageLoader } from '../components/PageLoader';

interface BillingTable {
  id: string;
  number: number;
  capacity: number;
  branch: { name: string };
  status: 'FREE' | 'OCCUPIED' | 'DELAYED';
  activeOrders: any[];
  activeOrder: {
    id: string;
    sessionId: string;
    items: any[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    status: string;
    paymentStatus?: string;
    createdAt: string;
    customer?: {
      id: string;
      name: string;
      phone: string;
    };
    orderIds: string[];
  } | null;
}

export default function BillingPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [audioContextUnlocked, setAudioContextUnlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioUrl = useAuthStore.getState().restaurant?.notificationSoundUrl || NOTIFICATION_SOUND;
    audioRef.current = new Audio(audioUrl);
    audioRef.current.load();
  }, [user]);

  const playNotificationSound = async () => {
    if (!audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (err: any) {
      console.error('Billing Audio Playback failed:', err);
      if (err.name === 'NotAllowedError') {
        setAudioContextUnlocked(false);
      }
    }
  };

  const unlockAudio = async () => {
    try {
      if (audioRef.current) {
        audioRef.current.muted = true;
        await audioRef.current.play();
        audioRef.current.muted = false;
        audioRef.current.currentTime = 0;
      }
      setAudioContextUnlocked(true);
      playNotificationSound();
      toast.success('Audio Intelligence Synchronized');
    } catch (err) {
      console.error('Failed to unlock audio:', err);
    }
  };
  const [tableFilter, setTableFilter] = useState<'ALL' | 'PENDING' | 'UNPAID' | 'HISTORY'>('ALL');
  const [pendingStatus, setPendingStatus] = useState<{ orderId: string; status: string } | null>(null);
  const [addingItemToOrderId, setAddingItemToOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingItemLoading, setAddingItemLoading] = useState(false);
  const [clearedAt, setClearedAt] = useState<number>(0);
  const [collectionPopup, setCollectionPopup] = useState<{ method: string; amount: number; orderIds: string[] } | null>(null);
  const [collectingOrderId, setCollectingOrderId] = useState<string | null>(null);
  const location = useLocation();

  const isReadOnly = user?.role === 'OWNER';

  useEffect(() => {
    if (location.state?.autoSelectTableId) {
      setSelectedTableId(location.state.autoSelectTableId);
    }
  }, [location.state]);

  const groupItems = (items: any[]) => {
    const map: Record<string, any> = {};
    items.forEach(item => {
      const key = `${item.menuItem.name}-${item.status}`;
      if (map[key]) {
        map[key].quantity += item.quantity;
        if (item.totalPrice) map[key].totalPrice += item.totalPrice;
      } else {
        map[key] = { ...item };
      }
    });
    return Object.values(map);
  };

  const { data: tables } = useQuery<BillingTable[]>({
    queryKey: ['billingTables'],
    queryFn: () => getBillingTables() as Promise<BillingTable[]>,
    refetchInterval: 10000,
  });

  const { data: historyOrders } = useQuery({
    queryKey: ['billingHistory'],
    queryFn: () => getBillingOrders('status=COMPLETED') as Promise<{ items: any[]; total: number }>,
    enabled: tableFilter === 'HISTORY',
  });

  const { data: branches, isLoading: branchesLoading } = useQuery<any[]>({
    queryKey: ['branches'],
    queryFn: () => getBranches() as Promise<any[]>,
  });

  const isLoading = !tables || branchesLoading;

  const branchSettings = useMemo(() =>
    branches?.find((b: any) => b.id === user?.branchId) || branches?.[0],
    [branches, user]
  );

  const handleStartOrder = async (tableId: string) => {
    try {
      await createOrder({
        tableId,
        items: [],
        notes: 'Started by staff'
      });
      queryClient.invalidateQueries({ queryKey: ['billingTables'] });
      toast.success('Order started for table');
    } catch (err: any) {
      toast.error(err.message || 'Failed to start order');
    }
  };

  const filteredTables = useMemo(() => {
    if (!tables) return [];
    let result = tables;
    if (tableFilter === 'PENDING') {
      result = tables.filter(t => t.activeOrders?.some(o => o.status === 'PENDING'));
    }
    else if (tableFilter === 'UNPAID') {
      result = tables.filter(t => t.activeOrder?.paymentStatus === 'UNPAID');
    }

    return [...result].sort((a, b) => a.number - b.number);
  }, [tables, tableFilter]);

  const selectedTable = useMemo(() =>
    tables?.find(t => t.id === selectedTableId) || null,
    [tables, selectedTableId]
  );

  const tableGrandTotal = useMemo(() => {
    if (!selectedTable?.activeOrders) return 0;
    return selectedTable.activeOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  }, [selectedTable]);

  const { data: menuItems } = useQuery<any[]>({
    queryKey: ['menuItems'],
    queryFn: () => getMenuItems() as Promise<any[]>,
    enabled: !!addingItemToOrderId,
  });

  const filteredMenuItems = useMemo(() => {
    if (!menuItems) return [];
    if (!searchQuery) return menuItems;
    return menuItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [menuItems, searchQuery]);

  const handleAddItem = async (menuItemId: string) => {
    if (!addingItemToOrderId) return;
    setAddingItemLoading(true);
    try {
      await addItemToOrder(addingItemToOrderId, { menuItemId, quantity: 1 });
      queryClient.invalidateQueries({ queryKey: ['billingTables'] });
      toast.success('Item added to order');
      setAddingItemToOrderId(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add item');
    } finally {
      setAddingItemLoading(false);
    }
  };

  const handleUpdateItemQuantity = async (orderId: string, itemId: string, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity <= 0) {
      if (currentQuantity === 1 && delta === -1) {
         toast.error("Cannot reduce below 1. Cancel order instead.");
         return;
      }
    }
    try {
      await updateOrderItem(orderId, itemId, { quantity: newQuantity });
      queryClient.invalidateQueries({ queryKey: ['billingTables'] });
      toast.success('Item quantity updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update item');
    }
  };

  useEffect(() => {
    const socket = io('/restaurant', { 
      transports: ['websocket', 'polling'],
      withCredentials: true 
    });
    socket.on('connect', () => {
      socket.emit('join:billing');
    });
    socket.on('order:new', () => { 
      queryClient.invalidateQueries({ queryKey: ['billingTables'] }); 
      toast.success('🔔 New order received!'); 
      playNotificationSound(); 
    });
    socket.on('order:status_updated', () => { queryClient.invalidateQueries({ queryKey: ['billingTables'] }); });
    socket.on('payment:confirmed', () => { queryClient.invalidateQueries({ queryKey: ['billingTables'] }); toast.success('💰 Payment received!'); });
    socket.on('order:item_status_updated', () => { queryClient.invalidateQueries({ queryKey: ['billingTables'] }); });
    socket.on('payment:request_at_desk', (data: { tableNumber: number, total: number }) => { 
      queryClient.invalidateQueries({ queryKey: ['billingTables'] }); 
      toast.error(`💳 Table #${data.tableNumber} requested check: ₹${data.total}`, { duration: 10000 }); 
      playNotificationSound(); 
    });
    return () => { socket.disconnect(); };
  }, [queryClient]);

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      queryClient.invalidateQueries({ queryKey: ['billingTables'] });
      toast.success(`Order marked as ${status}`);
      if (status === 'COMPLETED') setPendingStatus({ orderId, status });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handlePayment = async (orderId: string, method: string) => {
    try {
      await updatePaymentStatus(orderId, 'PAID', method);
      queryClient.invalidateQueries({ queryKey: ['billingTables'] });
      setPendingStatus(null);
      toast.success(`Payment recorded via ${method}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handlePrintBill = async (orderId: string) => {
    try {
      const res = await printBill(orderId);
      const html = await res.text();
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.print(); }
    } catch { toast.error('Failed to print bill'); }
  };

  const handlePrintSummary = async (customerId: string) => {
    try {
      const res = await printCustomerSummary(customerId);
      if (!res.ok) { const error = await res.json(); throw new Error(error.message || 'Failed to generate summary'); }
      const html = await res.text();
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.print(); }
    } catch (err: any) {
      toast.error(err.message || 'Failed to print summary');
    }
  };

  const handlePrintTableSummary = async (tableId: string) => {
    try {
      const res = await printTableSummary(tableId);
      if (!res.ok) { const error = await res.json(); throw new Error(error.message || 'Failed to generate summary'); }
      const html = await res.text();
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.print(); }
    } catch (err: any) {
      toast.error(err.message || 'Failed to print summary');
    }
  };

  if (isLoading) {
    return <PageLoader isLoading={true} />;
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Header Matrix */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-black text-stone-950 dark:text-white tracking-tighter uppercase leading-none">Billing Desk</h1>
          <p className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] ml-1">Order Settlement & Financial Reconciliation</p>
        </div>

        <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-md p-1 rounded-xl flex gap-1 border border-white dark:border-white/5 shadow-sm">
          {['ALL', 'PENDING', 'UNPAID', 'HISTORY'].map(f => (
            <button
              key={f}
              onClick={() => setTableFilter(f as any)}
              className={`px-3 py-1.5 rounded-lg text-[8px] font-black transition-all uppercase tracking-[0.4em] ${tableFilter === f ? 'bg-stone-950 dark:bg-primary text-white dark:text-stone-950 shadow-xl scale-105' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {tableFilter === 'HISTORY' ? (
        <div className="glass-panel overflow-hidden group">
          <div className="p-4 border-b border-stone-100 dark:border-white/5 flex justify-between items-center bg-stone-50/30 dark:bg-stone-900/30">
            <div>
              <h2 className="text-[9px] font-black text-stone-400 dark:text-stone-500 flex items-center gap-2 uppercase tracking-[0.4em]">
                <Clock size={12} className="text-primary" /> Archive Log
              </h2>
              <p className="text-[8px] font-black text-stone-300 dark:text-stone-600 mt-1 uppercase tracking-[0.4em] ml-5">Recently Finalized Transactions</p>
            </div>
            <button
              onClick={() => setClearedAt(Date.now())}
              className="text-[8px] px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 font-black hover:bg-red-500 hover:text-white rounded-lg transition-all border border-red-500/20 dark:border-red-500/10 uppercase tracking-[0.3em] active:scale-95 shadow-lg shadow-red-500/5"
            >
              Purge Logs
            </button>
          </div>
          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-stone-400 dark:text-stone-500 font-black uppercase tracking-[0.3em] text-[9px]">
                <tr>
                  <th className="px-4 py-4">ID Hash</th>
                  <th className="px-4 py-4">Node</th>
                  <th className="px-4 py-4">Subject</th>
                  <th className="px-4 py-4">Composition</th>
                  <th className="px-4 py-4 text-right">Value</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-4 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                {historyOrders?.items?.filter(o => new Date(o.createdAt).getTime() > clearedAt).map(o => (
                  <tr key={o.id} className="hover:bg-stone-50/50 dark:hover:bg-white/5 transition-colors group/row">
                    <td className="px-4 py-4 text-[10px] font-mono text-stone-400 dark:text-stone-600 group-hover:text-primary transition-colors">#{o.id.slice(-6).toUpperCase()}</td>
                    <td className="px-4 py-4 font-black text-stone-950 dark:text-white uppercase tracking-tight text-[11px]">Table {o.table?.number || '-'}</td>
                    <td className="px-4 py-4">
                      {o.customer ? (
                        <div className="flex flex-col">
                          <span className="font-black text-stone-950 dark:text-white text-[10px] uppercase">{o.customer.name || 'Anonymous'}</span>
                          <span className="text-[9px] text-stone-400 dark:text-stone-500 font-mono tracking-[0.3em]">{o.customer.phone}</span>
                        </div>
                      ) : <span className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em]">Guest Node</span>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[250px]">
                        {o.items.slice(0, 3).map((i: any, idx: number) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-[7px] font-black text-stone-600 dark:text-stone-400 uppercase">
                            {i.quantity}x {i.menuItem?.name || 'Item'}
                          </span>
                        ))}
                        {o.items.length > 3 && <span className="text-[7px] font-black text-stone-400 dark:text-stone-600">+{o.items.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-black text-stone-950 dark:text-white text-right text-[13px] tracking-tighter">₹{(o.total || 0).toFixed(2)}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="px-2 py-0.5 bg-primary text-stone-950 rounded-full font-black text-[7px] uppercase tracking-[0.3em] shadow-lg shadow-primary/20">{o.paymentMethod || 'PAID'}</span>
                    </td>
                    <td className="px-4 py-4 text-right text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.3em]">{new Date(o.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {filteredTables?.map((table) => (
            <button
              key={table.id}
              onClick={() => setSelectedTableId(table.id)}
              className={`glass-card group relative p-4 flex flex-col min-h-[13rem] h-full overflow-hidden border ${table.status === 'FREE' ? 'border-white/20 dark:border-white/5' :
                table.status === 'DELAYED' ? 'border-red-200/50 dark:border-red-900/20 bg-red-50/20 dark:bg-red-900/10' :
                  'border-primary/20 dark:border-primary/10 bg-primary/5 dark:bg-primary/5'
                }`}
            >
              {/* Background Accent */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 blur-[30px] transition-all duration-1000 ${table.status === 'FREE' ? 'bg-primary/5 dark:bg-primary/10 group-hover:bg-primary/10 dark:group-hover:bg-primary/20' :
                table.status === 'DELAYED' ? 'bg-red-500/10 dark:bg-red-500/20 group-hover:bg-red-500/20 dark:group-hover:bg-red-500/30' :
                  'bg-primary/10 dark:bg-primary/20 group-hover:bg-primary/20 dark:group-hover:bg-primary/30'
                }`} />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-2xl font-black text-stone-950 dark:text-white tracking-tighter leading-none">#{table.number}</p>
                    <p className="text-[8px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em]">{table.branch.name}</p>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full animate-pulse-slow ${table.status === 'FREE' ? 'bg-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                    table.status === 'DELAYED' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                      'bg-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    }`} />
                </div>

                <div className="flex-1">
                  {table.activeOrder ? (
                    <div className="space-y-2 py-4 border-t border-stone-200/30 dark:border-white/10">
                      {groupItems(table.activeOrder.items).slice(0, 2).map((item, idx) => (
                        <p key={idx} className="text-[10px] text-stone-600 dark:text-stone-400 font-black uppercase tracking-tight truncate flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          <span>{item.quantity}x {item.menuItem.name}</span>
                        </p>
                      ))}
                      {table.activeOrder.items.length > 2 && (
                        <p className="text-[8px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em] pl-2.5">+{table.activeOrder.items.length - 2} more protocols</p>
                      )}
                    </div>
                  ) : (
                    <div className="py-3 border-t border-stone-200/30 dark:border-white/10 opacity-30">
                      <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em]">Station Idle</p>
                    </div>
                  )}
                </div>

                <div className="mt-auto">
                  {table.activeOrder ? (
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-stone-950 dark:text-white tracking-tighter">₹{table.activeOrder.total.toFixed(2)}</span>
                      <ChevronRight size={16} className="text-stone-300 dark:text-stone-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (table.status === 'FREE') handleStartOrder(table.id);
                        else setSelectedTableId(table.id);
                      }}
                      className="w-full py-2 bg-stone-950 dark:bg-primary text-white dark:text-stone-950 rounded-lg text-[8px] font-black uppercase tracking-[0.3em] hover:bg-primary dark:hover:bg-primary/90 transition-all active:scale-95 shadow-xl shadow-stone-950/10 dark:shadow-primary/10"
                    >
                      {table.status === 'FREE' ? 'Initialize' : 'Engage'}
                    </button>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Table Sidebar Matrix */}
      {selectedTable && (
        <div className="fixed inset-y-4 right-4 w-full sm:w-[400px] bg-white/40 dark:bg-stone-950/60 border border-white/30 dark:border-white/10 z-50 overflow-hidden animate-in slide-in-from-right duration-500 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col rounded-[2.5rem] backdrop-blur-[40px]">
          <div className="p-6 border-b border-stone-200/30 dark:border-white/10 flex items-center justify-between sticky top-0 z-10 bg-transparent">
            <div>
              <h2 className="text-xl font-black text-stone-950 dark:text-white tracking-tighter uppercase leading-none">Table #{selectedTable.number}</h2>
              <p className="text-[9px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-[0.4em] mt-2">Active Protocol Management</p>
            </div>
            <button
              onClick={() => setSelectedTableId(null)}
              className="p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 hover:text-stone-950 dark:text-stone-400 dark:hover:text-white transition-all active:scale-95 duration-300 shadow-sm"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {selectedTable.activeOrders && selectedTable.activeOrders.length > 0 ? (
              <div className="space-y-6">
                {selectedTable.activeOrders.map((order) => (
                  <div key={order.id} className="relative group/order overflow-hidden p-5 rounded-[2rem] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-stone-900/40 backdrop-blur-2xl shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-[40px] pointer-events-none" />

                    <div className="relative z-10 flex justify-between items-start mb-4">
                      <div>
                        {order.customer && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <User className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-black text-stone-700 dark:text-stone-300 uppercase tracking-[0.15em]">{order.customer.name || 'Guest'}</span>
                          </div>
                        )}
                        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Protocol #{order.id.slice(-6).toUpperCase()}</h3>
                        <p className="text-[8px] font-black text-stone-400 dark:text-stone-600 mt-0.5 uppercase tracking-[0.3em]">{new Date(order.createdAt).toLocaleTimeString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-[0.3em] shadow-sm ${order.status === 'READY' ? 'bg-primary text-stone-950' :
                        order.status === 'COMPLETED' ? 'bg-stone-950 dark:bg-stone-800 text-white' :
                          'bg-primary text-stone-950'
                        }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="relative z-10 space-y-3">
                      {order.items?.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between group/item">
                          <div className="flex items-center gap-2">
                            {(order.status === 'PENDING' || order.status === 'UNCONFIRMED') ? (
                              <div className="flex items-center gap-1 bg-white dark:bg-stone-800 rounded-lg border border-stone-100 dark:border-white/5 p-0.5 shadow-sm">
                                <button onClick={() => handleUpdateItemQuantity(order.id, item.id, item.quantity, -1)} className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-stone-950 dark:hover:text-white transition-colors">-</button>
                                <span className="w-4 text-center text-[9px] font-black text-stone-950 dark:text-white">{item.quantity}</span>
                                <button onClick={() => handleUpdateItemQuantity(order.id, item.id, item.quantity, 1)} className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-stone-950 dark:hover:text-white transition-colors">+</button>
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-white dark:bg-stone-800 flex items-center justify-center text-[9px] font-black text-stone-950 dark:text-white border border-stone-100 dark:border-white/5 shadow-sm">
                                {item.quantity}x
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-[12px] font-black text-stone-950 dark:text-white uppercase tracking-tight">{item.menuItem.name}</span>
                              {item.variant && <span className="text-[7px] text-primary font-black uppercase tracking-[0.3em] mt-0.5">{item.variant.name}</span>}
                            </div>
                          </div>
                          <span className="text-[12px] font-black text-stone-950 dark:text-white tabular-nums">₹{item.totalPrice.toFixed(2)}</span>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-tight italic mt-2">
                          more {order.items.length - 3} items
                        </div>
                      )}
                    </div>

                    <div className="relative z-10 pt-4 mt-4 border-t border-white/50 dark:border-white/5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[7px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.3em]">Order Total</span>
                        <span className="text-xl font-black text-stone-950 dark:text-white tracking-tighter">₹{order.total.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintBill(order.id)}
                          className="px-2 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-white/5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-all active:scale-95 flex items-center justify-center"
                          title="Print Protocol"
                        >
                          <Printer className="w-3 h-3" />
                        </button>
                        {order.status === 'READY' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'SERVED')}
                            className="px-3 py-1.5 bg-green-500/20 text-green-500 border border-green-500/30 rounded-lg hover:bg-green-500 hover:text-white transition-all active:scale-95 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.3em]"
                          >
                            <Check className="w-3 h-3" /> Served
                          </button>
                        )}
                        {(order.status === 'PENDING' || order.status === 'UNCONFIRMED') && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')}
                            className="px-3 py-1.5 bg-primary text-stone-950 rounded-lg hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20"
                          >
                            <Check className="w-3 h-3" /> Confirm
                          </button>
                        )}

                        {branchSettings?.allowOrderModification && (
                          <button
                            onClick={() => setAddingItemToOrderId(order.id)}
                            className="p-2 bg-stone-950 dark:bg-stone-800 text-white rounded-lg hover:bg-primary dark:hover:bg-primary dark:hover:text-stone-950 transition-all active:scale-95 shadow-xl shadow-stone-950/10"
                            title="Append Item"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Per-order payment status & collect */}
                    {order.paymentStatus === 'PAID' ? (
                      <div className="relative z-10 pt-3 mt-3 border-t border-green-500/10 flex items-center justify-center gap-2">
                        <CheckCircle size={12} className="text-green-500" />
                        <span className="text-[8px] font-black text-green-500 uppercase tracking-[0.3em]">Paid</span>
                      </div>
                    ) : (
                      <div className="relative z-10 pt-3 mt-3 border-t border-white/50 dark:border-white/5">
                        {collectingOrderId === order.id ? (
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { m: 'CASH', icon: '💵' },
                              { m: 'UPI', icon: '📱' },
                              { m: 'CARD', icon: '💳' },
                              { m: 'FREE', icon: '🎁' }
                            ].map(({ m, icon }) => (
                              <button
                                key={m}
                                onClick={() => {
                                  setCollectionPopup({ method: m, amount: order.total, orderIds: [order.id] });
                                  setCollectingOrderId(null);
                                }}
                                className="flex flex-col items-center gap-1 py-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-100 dark:border-white/5 hover:border-primary/40 transition-all active:scale-95 text-center"
                              >
                                <span className="text-sm">{icon}</span>
                                <span className="text-[6px] font-black text-stone-950 dark:text-white uppercase tracking-[0.2em]">{m}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => setCollectingOrderId(order.id)}
                            disabled={isReadOnly}
                            className="w-full py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[8px] font-black uppercase tracking-[0.3em] hover:bg-primary hover:text-stone-950 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <DollarSign size={10} /> Collect ₹{order.total.toFixed(0)}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Table Settlement Control */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-300 dark:via-white/20 to-transparent" />
                    <p className="text-[9px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-[0.4em]">Settlement Matrix</p>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-300 dark:via-white/20 to-transparent" />
                  </div>
                  {selectedTable.activeOrders.every(o => o.paymentStatus === 'PAID') ? (
                    <div className="p-8 bg-green-500/10 border border-green-500/20 rounded-[2rem] flex flex-col items-center justify-center gap-4 text-center animate-in fade-in zoom-in duration-500 backdrop-blur-md">
                      <div className="w-16 h-16 rounded-3xl bg-green-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                        <CheckCircle size={24} className="text-green-500" />
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-green-500 uppercase tracking-[0.3em]">All Payments Done</p>
                        <p className="text-[9px] font-bold text-green-500/70 uppercase tracking-widest mt-1">Awaiting table clear</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[8px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] text-center">Collect All Unpaid Orders</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { m: 'CASH', icon: '💵', label: 'Cash Flow' },
                          { m: 'UPI', icon: '📱', label: 'Digital Node' },
                          { m: 'CARD', icon: '💳', label: 'Credit Link' },
                          { m: 'FREE', icon: '🎁', label: 'Grant Void' }
                        ].map(({ m, icon, label }) => (
                          <button
                            key={m}
                            onClick={() => {
                              if (isReadOnly) return;
                              const unpaidOrders = selectedTable.activeOrders.filter((o: any) => o.paymentStatus !== 'PAID');
                              const totalAmount = unpaidOrders.reduce((sum: number, o: any) => sum + o.total, 0);
                              setCollectionPopup({ method: m, amount: totalAmount, orderIds: unpaidOrders.map((o: any) => o.id) });
                            }}
                            disabled={isReadOnly}
                            className={`group relative flex flex-col items-center gap-1.5 py-4 rounded-xl border transition-all duration-300 ${isReadOnly
                              ? 'opacity-50 cursor-not-allowed bg-stone-50 dark:bg-stone-900 text-stone-300 dark:text-stone-700 border-stone-100 dark:border-white/5'
                              : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-white/5 hover:border-primary/40 dark:hover:border-primary/40 hover:bg-stone-50 dark:hover:bg-stone-800 hover:scale-[1.02] active:scale-95 shadow-sm'
                              }`}
                          >
                            <span className="text-xl filter grayscale group-hover:grayscale-0 transition-all duration-500">{icon}</span>
                            <div className="text-center">
                              <p className="text-[8px] font-black text-stone-950 dark:text-white uppercase tracking-[0.3em]">{m}</p>
                              <p className="text-[7px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.3em] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">{label}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={async () => {
                      if (isReadOnly) return;
                      if (window.confirm('Are you sure you want to clear this table? All active orders will be marked as completed.')) {
                        try {
                          for (const order of selectedTable.activeOrders) {
                            await updateOrderStatus(order.id, 'COMPLETED');
                          }
                          queryClient.invalidateQueries({ queryKey: ['billingTables'] });
                          toast.success('Table freed');
                          setSelectedTableId(null);
                        } catch (err: any) {
                          toast.error(err.message || 'Failed to free table');
                        }
                      }
                    }}
                    className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all active:scale-95"
                  >
                    Force Free Table
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handlePrintTableSummary(selectedTable.id)}
                    className="glass-button w-full flex items-center justify-center gap-3 !rounded-2xl !py-4"
                  >
                    <Printer size={18} /> Print Table Summary
                  </button>
                  {selectedTable.activeOrder?.customer && (
                    <button
                      onClick={() => handlePrintSummary(selectedTable.activeOrder!.customer!.id)}
                      className="glass-button w-full flex items-center justify-center gap-3 !rounded-2xl !py-4 opacity-70 hover:opacity-100"
                    >
                      <CheckCircle size={18} /> Consolidate Customer Session
                    </button>
                  )}
                </div>
              </div>

            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-8 animate-in fade-in duration-1000">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full scale-150" />
                  <div className="relative w-32 h-32 bg-white dark:bg-stone-900 rounded-full flex items-center justify-center shadow-2xl border border-stone-100 dark:border-white/5">
                    <CheckCircle size={56} className="text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-stone-950 dark:text-white uppercase tracking-tighter">Station Optimized</h3>
                  <p className="text-[12px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.5em] mt-4 max-w-[200px] leading-relaxed">All active protocols have been finalized. Node is in standby.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Confirmation Matrix */}
      {pendingStatus && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-stone-900 rounded-[2rem] w-full max-w-md overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/5">
            <div className="p-6 text-center bg-stone-50/50 dark:bg-stone-950/50 border-b border-stone-100 dark:border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/5 rounded-full -mt-24 blur-[60px]" />
              <div className="relative z-10 w-12 h-12 bg-white dark:bg-stone-800 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-stone-100 dark:border-white/5">
                <CreditCard size={24} className="text-primary" />
              </div>
              <h3 className="relative z-10 text-xl font-black text-stone-950 dark:text-white mb-2 uppercase tracking-tighter leading-none">Settlement Hub</h3>
              <p className="relative z-10 text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] leading-relaxed">
                Protocol <span className="text-primary">#{pendingStatus.orderId.slice(-6).toUpperCase()}</span> Complete.
                <br />Identify Tender Instrument.
              </p>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              {[
                { method: 'CASH', icon: '💵', label: 'Physical Tender', desc: 'Fiat Currency' },
                { method: 'UPI', icon: '📱', label: 'Digital Node', desc: 'Secure Mobile Link' },
                { method: 'CARD', icon: '💳', label: 'Chip & Pin', desc: 'Credit / Debit Vector' },
                { method: 'FREE', icon: '🎁', label: 'Grant Access', desc: 'Void Value Protocol' },
              ].map(({ method, icon, label, desc }) => (
                <button
                  key={method}
                  onClick={() => handlePayment(pendingStatus.orderId, method)}
                  className="group flex flex-col gap-2 p-4 bg-stone-50/50 dark:bg-stone-800/50 hover:bg-white dark:hover:bg-stone-800 border border-stone-100 dark:border-white/5 hover:border-primary/30 dark:hover:border-primary/30 rounded-xl transition-all text-left shadow-sm hover:shadow-xl hover:scale-[1.02]"
                >
                  <span className="text-xl bg-white dark:bg-stone-900 w-10 h-10 flex items-center justify-center rounded-lg shadow-sm border border-stone-100 dark:border-white/5 group-hover:scale-110 transition-transform duration-500">{icon}</span>
                  <div>
                    <p className="font-black text-stone-950 dark:text-white text-[9px] uppercase tracking-[0.3em] group-hover:text-primary transition-colors">{label}</p>
                    <p className="text-[7px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.3em] mt-1 opacity-60">{desc}</p>
                  </div>
                </button>
              ))}
              <div className="col-span-2 pt-6">
                <button
                  onClick={() => setPendingStatus(null)}
                  className="w-full py-4 text-[10px] font-black text-stone-400 dark:text-stone-600 hover:text-stone-950 dark:hover:text-white uppercase tracking-[0.5em] transition-all"
                >
                  Postpone Reconciliation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Appendment Matrix */}
      {addingItemToOrderId && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xl flex items-center justify-end z-[100] animate-in fade-in duration-500">
          <div className="bg-white dark:bg-stone-950 w-full max-w-xl h-full flex flex-col shadow-[-40px_0_100px_rgba(0,0,0,0.1)] border-l border-white dark:border-white/5 animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-stone-100 dark:border-white/5 flex items-center justify-between bg-stone-50/30 dark:bg-stone-900/30">
              <div>
                <h3 className="text-2xl font-black text-stone-950 dark:text-white tracking-tighter uppercase leading-none">Append Module</h3>
                <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] mt-2">Injecting Nodes into Protocol #{addingItemToOrderId.slice(-6).toUpperCase()}</p>
              </div>
              <button
                onClick={() => setAddingItemToOrderId(null)}
                className="p-3 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all text-stone-400 dark:text-stone-600 hover:text-stone-950 dark:hover:text-white active:rotate-90 duration-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="relative group">
                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-700 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="QUERY COMPONENT ARCHIVE..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all text-stone-950 dark:text-white placeholder:text-stone-300 dark:placeholder:text-stone-700 shadow-inner"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {filteredMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item.id)}
                  disabled={addingItemLoading}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-2xl border border-stone-100 dark:border-white/5 hover:border-primary/20 transition-all text-left group disabled:opacity-50 shadow-sm hover:shadow-md hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-300 dark:text-stone-700 border border-stone-50 dark:border-white/5 overflow-hidden shadow-inner group-hover:border-primary/20 transition-all">
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <Plus size={20} />}
                    </div>
                    <div>
                      <p className="font-black text-sm text-stone-950 dark:text-white uppercase tracking-tight group-hover:text-primary transition-colors">{item.name}</p>
                      <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] mt-1">{item.category?.name || 'GENERIC UNIT'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-black text-stone-950 dark:text-white tracking-tighter tabular-nums">₹{item.price}</span>
                    <div className="p-3 bg-stone-950 dark:bg-stone-800 text-white dark:text-primary rounded-lg group-hover:bg-primary dark:group-hover:bg-primary dark:group-hover:text-stone-950 transition-all shadow-xl shadow-stone-950/10">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </button>
              ))}
              {filteredMenuItems.length === 0 && (
                <div className="text-center py-32 opacity-20 flex flex-col items-center">
                  <Search size={64} className="mb-6 text-stone-300 dark:text-stone-700" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 dark:text-stone-600">Zero Results Matched</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Collection Popup */}
      {collectionPopup && selectedTable && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-stone-900 rounded-[2rem] w-full max-w-sm overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/5 animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-6 text-center bg-stone-50/50 dark:bg-stone-950/50 border-b border-stone-100 dark:border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/5 rounded-full -mt-24 blur-[60px]" />
              <div className="relative z-10 w-14 h-14 bg-white dark:bg-stone-800 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-stone-100 dark:border-white/5">
                <DollarSign size={28} className="text-primary" />
              </div>
              <h3 className="relative z-10 text-lg font-black text-stone-950 dark:text-white mb-1 uppercase tracking-tighter leading-none">Collect Payment</h3>
              <p className="relative z-10 text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em]">
                Via <span className="text-primary">{collectionPopup.method}</span>
                {collectionPopup.orderIds.length === 1 && (
                  <span> • Order #{collectionPopup.orderIds[0].slice(-6).toUpperCase()}</span>
                )}
                {collectionPopup.orderIds.length > 1 && (
                  <span> • {collectionPopup.orderIds.length} orders</span>
                )}
              </p>
            </div>

            {/* Amount */}
            <div className="p-8 text-center">
              <p className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] mb-2">Amount to Collect</p>
              <p className="text-5xl font-black text-stone-950 dark:text-white tracking-tighter">
                ₹{collectionPopup.amount.toFixed(2)}
              </p>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 flex flex-col gap-3">
              <button
                onClick={async () => {
                  try {
                    for (const orderId of collectionPopup.orderIds) {
                      await updatePaymentStatus(orderId, 'PAID', collectionPopup.method);
                    }
                    queryClient.invalidateQueries({ queryKey: ['billingTables'] });
                    toast.success(`₹${collectionPopup.amount.toFixed(2)} collected via ${collectionPopup.method}`);
                    setCollectionPopup(null);
                  } catch (err: any) {
                    toast.error(err.message || 'Settlement protocol failed');
                  }
                }}
                className="w-full py-4 bg-primary text-stone-950 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-primary/90 transition-all active:scale-95 shadow-xl shadow-primary/20"
              >
                <CheckCircle size={16} className="inline mr-2" />
                Collected
              </button>
              <button
                onClick={() => setCollectionPopup(null)}
                className="w-full py-3 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] hover:bg-stone-200 dark:hover:bg-stone-700 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Unlock Overlay */}
      {!audioContextUnlocked && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500">
          <button
            onClick={unlockAudio}
            className="group relative flex items-center gap-3 px-6 py-4 bg-stone-900 dark:bg-white rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-stone-800 dark:bg-stone-100 text-primary animate-pulse">
              <Volume2 size={20} />
            </div>
            <div className="relative text-left">
              <p className="text-sm font-black text-white dark:text-stone-900 uppercase tracking-wider">Initialize Audio</p>
              <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Required for Alerts</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
