// ═══════════════════════════════════════════
// DineSmart — Order Tracking Page (Premium)
// ═══════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, Clock, ChefHat, Bell, UtensilsCrossed, Star, Printer, ChevronLeft, ShieldCheck, CreditCard, Smartphone, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrderBySession, submitReview, updatePublicOrderItem } from '../lib/api';
import { io } from 'socket.io-client';

const STATUS_STEPS = [
    { key: 'CONFIRMED', label: 'Confirmed', icon: Check, description: 'Order received' },
    { key: 'PREPARING', label: 'Preparing', icon: ChefHat, description: 'Chef is cooking' },
    { key: 'READY', label: 'Ready', icon: Bell, description: 'Ready to serve' },
    { key: 'SERVED', label: 'Served', icon: UtensilsCrossed, description: 'Meal served' },
];

const STATUS_INDEX: Record<string, number> = {
    PENDING: -1,
    CONFIRMED: 0,
    PREPARING: 1,
    READY: 2,
    SERVED: 3,
    COMPLETED: 4,
};

interface Order {
    id: string;
    sessionId: string;
    status: string;
    paymentStatus: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    createdAt: string;
    table: { id: string; number: number };
    restaurant: { slug: string; name: string };
    items: Array<{
        id: string;
        menuItem: { name: string };
        quantity: number;
        totalPrice: number;
        status: string;
        variantName?: string;
        addonNames: string[];
    }>;
    estimatedMinutes?: number;
    branch: {
        allowOrderModification: boolean;
        requireOrderVerification: boolean;
    };
}

export default function OrderTracking() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const [currentStatus, setCurrentStatus] = useState('PENDING');
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [itemRatings, setItemRatings] = useState<Record<string, number>>({});
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const [updatingItem, setUpdatingItem] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editTimeLeft, setEditTimeLeft] = useState(0);



    const navigate = useNavigate();
    const { data: orders, refetch, error, isLoading } = useQuery<Order[]>({
        queryKey: ['order', sessionId],
        queryFn: () => getOrderBySession(sessionId!) as Promise<Order[]>,
        enabled: !!sessionId,
        retry: 1,
        refetchInterval: 5000,
    });

    const order = orders?.[0];

    useEffect(() => {
        if (!order) return;

        const socket = io('/restaurant', {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            auth: { role: 'customer' }
        });

        socket.on('connect', () => {
            console.log('✅ Tracking: Socket connected (ID:', socket.id, ')');
            socket.emit('join:table', order.table.id);
        });

        socket.on('order:status_updated', (data: { id: string; status: string }) => {
            if (data.id === order.id) {
                setCurrentStatus(data.status);
                refetch();
                toast(`Order status: ${data.status}`, {
                    icon: '🍽️',
                    style: {
                        background: '#1A1A1A',
                        color: '#D97706',
                        borderRadius: '12px',
                        border: '1px solid rgba(217, 119, 6, 0.2)',
                        fontWeight: 'bold'
                    }
                });
            }
        });

        socket.on('order:item_status_updated', (data: { orderId: string }) => {
            if (data.orderId === order.id) {
                refetch();
            }
        });



        return () => {
            socket.disconnect();
        };
    }, [order?.id]);

    useEffect(() => {
        if (order) {
            setCurrentStatus(order.status);
        }
    }, [order?.status]);

    const handleSubmitReview = async () => {
        if (!order || rating === 0) return;
        try {
            await submitReview(order.id, rating, comment, itemRatings);
            setReviewSubmitted(true);
            toast.success('Thank you for your feedback!');
        } catch {
            toast.error('Failed to submit review');
        }
    };

    const handleUpdateQuantity = async (itemId: string, currentQuantity: number, delta: number) => {
        if (!order) return;
        const newQuantity = currentQuantity + delta;
        if (newQuantity < 0) return;
        
        setUpdatingItem(itemId);
        try {
            await updatePublicOrderItem(order.id, itemId, { quantity: newQuantity });
            toast.success(newQuantity === 0 ? 'Item removed' : 'Quantity updated');
            refetch();
        } catch (err: any) {
            toast.error(err.message || 'Failed to update item');
        } finally {
            setUpdatingItem(null);
        }
    };

    // Compute edit state (safe for when order is null)
    const statusIdx = STATUS_INDEX[currentStatus] ?? -1;
    const isCompleted = currentStatus === 'COMPLETED' || currentStatus === 'SERVED';
    const orderAgeMs = order ? new Date().getTime() - new Date(order.createdAt).getTime() : 0;
    const editWindowMs = 10 * 60 * 1000;
    const isEditable = !!(order && order.branch?.allowOrderModification && orderAgeMs <= editWindowMs && !isCompleted && statusIdx < STATUS_INDEX['READY']);
    const remainingEditMs = Math.max(0, editWindowMs - orderAgeMs);

    // Update countdown timer — MUST be before any early returns (Rules of Hooks)
    useEffect(() => {
        if (!isEditable || !order) { setIsEditMode(false); return; }
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const age = now - new Date(order.createdAt).getTime();
            const left = Math.max(0, editWindowMs - age);
            setEditTimeLeft(left);
            if (left <= 0) setIsEditMode(false);
        }, 1000);
        setEditTimeLeft(remainingEditMs);
        return () => clearInterval(timer);
    }, [order?.createdAt, isEditable]);

    if (error || (orders && orders.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0A] text-white p-6 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mb-8 border border-red-500/20">
                    <span className="text-4xl">🔍</span>
                </div>
                <h1 className="text-2xl font-black text-white mb-4 tracking-tight uppercase">Session Not Found</h1>
                <p className="text-white/40 text-sm mb-10 leading-relaxed max-w-xs">
                    This order session may have been completed, archived, or the link is invalid.
                </p>
                <button 
                    onClick={() => navigate('/')}
                    className="w-full max-w-xs py-5 bg-brand-primary text-black font-black uppercase tracking-widest rounded-2xl hover:bg-brand-primary/90 transition-all active:scale-95 shadow-[0_20px_40px_rgba(245,158,11,0.2)]"
                >
                    Back to Menu
                </button>
            </div>
        );
    }

    if (isLoading || !order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0A] text-white">
                <div className="w-12 h-12 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4" />
                <p className="text-sm text-white/50 tracking-widest uppercase animate-pulse">Syncing Order Details...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-brand-primary/30 pb-20">
            {/* Background Accents */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-brand-primary/5 blur-[120px] pointer-events-none" />

            {/* Top Header */}
            <nav className="relative z-10 px-6 py-6 flex items-center justify-between backdrop-blur-md sticky top-0 border-b border-white/5 bg-black/20">
                <button onClick={() => window.history.back()} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    <ChevronLeft size={20} className="text-white/70" />
                </button>
                <div className="text-center">
                    <h1 className="text-[10px] font-bold text-brand-primary tracking-[0.3em] uppercase">Live Tracking</h1>
                    <p className="text-xs font-medium text-white/40 tracking-widest mt-0.5">#{order.id.slice(-6).toUpperCase()}</p>
                </div>
                <div className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full">
                    <span className="text-xs font-bold text-brand-primary">{order.table.number}</span>
                </div>
            </nav>

            <main className="relative z-10 max-w-xl mx-auto px-6 py-8 space-y-8">

                {/* Status Hero Card */}
                <div className="glass p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 blur-3xl -mr-16 -mt-16 group-hover:bg-brand-primary/20 transition-all" />

                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className="w-24 h-24 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-brand-primary flex items-center justify-center shadow-[0_0_30px_rgba(217,119,6,0.5)]">
                                    <ChefHat size={32} className="text-white" />
                                </div>
                            </div>
                            {/* Animated circles */}
                            <div className="absolute inset-0 rounded-full border-2 border-brand-primary/30 animate-ping-slow scale-125 pointer-events-none" />
                        </div>

                        <h2 className="text-2xl font-bold mb-2">
                            {currentStatus === 'PENDING' && order.branch.requireOrderVerification ? 'Awaiting Verification' :
                                currentStatus === 'CONFIRMED' ? 'Order Confirmed' :
                                    currentStatus === 'PREPARING' ? 'Cooking in Progress' :
                                        currentStatus === 'READY' ? 'Ready to Serve' :
                                            currentStatus === 'SERVED' ? 'Enjoy your Meal' : 'Processing...'}
                        </h2>
                        <p className="text-sm text-white/50 max-w-[240px] leading-relaxed">
                            {currentStatus === 'PENDING' && order.branch.requireOrderVerification
                                ? 'The restaurant is verifying your order before sending it to the kitchen.'
                                : `Preparing your exquisite meal at ${order.restaurant.name}`}
                        </p>

                        {order.estimatedMinutes && order.estimatedMinutes > 0 && !isCompleted && (
                            <div className="mt-8 flex items-center gap-6 px-8 py-4 bg-white/5 rounded-2xl border border-white/10">
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">Estimated Arrival</p>
                                    <p className="text-2xl font-bold">~{order.estimatedMinutes} Mins</p>
                                </div>
                                <div className="w-px h-10 bg-white/10" />
                                <Clock size={24} className="text-brand-primary opacity-80" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Vertical Stepper */}
                <div className="glass p-8 rounded-[2.5rem] border border-white/10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-1.5 h-6 bg-brand-primary rounded-full shadow-[0_0_10px_rgba(217,119,6,0.5)]" />
                        <h3 className="text-xs font-bold text-white/70 uppercase tracking-[0.2em]">Live Timeline</h3>
                    </div>

                    <div className="space-y-12 relative">
                        <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-white/5" />

                        {STATUS_STEPS.map((step, idx) => {
                            const isActive = idx === statusIdx;
                            const isComplete = idx < statusIdx;
                            const Icon = step.icon;

                            return (
                                <div key={step.key} className={`flex items-start gap-6 relative transition-all duration-500 ${!isActive && !isComplete ? 'opacity-30 grayscale' : ''}`}>
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center z-10 border transition-all duration-500 ${isComplete ? 'bg-green-500/20 border-green-500/40 text-green-500' :
                                            isActive ? 'bg-brand-primary border-brand-primary text-white shadow-[0_0_20px_rgba(217,119,6,0.4)] scale-110' :
                                                'bg-white/5 border-white/10 text-white/40'
                                        }`}>
                                        <Icon size={18} strokeWidth={isComplete || isActive ? 3 : 2} />
                                    </div>

                                    <div className="flex-1 pt-1">
                                        <h4 className={`text-sm font-bold tracking-wide transition-colors ${isActive ? 'text-white' : isComplete ? 'text-green-500' : 'text-white/40'
                                            }`}>
                                            {step.label}
                                        </h4>
                                        <p className="text-[11px] text-white/40 font-medium mt-0.5">
                                            {step.description}
                                        </p>
                                    </div>

                                    {isActive && (
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                                            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Active</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Order Details Accordion/List */}
                <div className="glass rounded-[2.5rem] border border-white/10 overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-bold text-white/70 uppercase tracking-[0.2em] mb-1">Order Summary</h3>
                            <p className="text-[10px] text-white/40 font-medium tracking-widest uppercase">Table No. {order.table.number}</p>
                        </div>
                        <UtensilsCrossed size={20} className="text-brand-primary/50" />
                    </div>

                    {/* Edit Mode Timer Banner */}
                    {isEditMode && isEditable && (
                        <div className="px-8 py-3 bg-brand-primary/5 border-b border-brand-primary/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock size={12} className="text-brand-primary" />
                                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Edit window</span>
                            </div>
                            <span className="text-[11px] font-bold text-brand-primary tabular-nums">
                                {Math.floor(editTimeLeft / 60000)}:{String(Math.floor((editTimeLeft % 60000) / 1000)).padStart(2, '0')} remaining
                            </span>
                        </div>
                    )}

                    <div className="p-8 space-y-6">
                        {order.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="flex items-center bg-brand-primary/10 rounded-lg overflow-hidden border border-brand-primary/20">
                                            {isEditMode && isEditable && (
                                                <button 
                                                    disabled={updatingItem === item.id}
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                                                    className="px-2.5 py-1 text-brand-primary hover:bg-brand-primary/20 transition-colors disabled:opacity-50 font-bold"
                                                >-</button>
                                            )}
                                            <span className="text-xs font-bold px-2 py-0.5 text-brand-primary">
                                                {item.quantity}x
                                            </span>
                                            {isEditMode && isEditable && (
                                                <button 
                                                    disabled={updatingItem === item.id}
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                                                    className="px-2.5 py-1 text-brand-primary hover:bg-brand-primary/20 transition-colors disabled:opacity-50 font-bold"
                                                >+</button>
                                            )}
                                        </div>
                                        <span className="text-sm font-bold text-white/90">{item.menuItem.name}</span>
                                    </div>
                                    {(item.variantName || item.addonNames?.length > 0) && (
                                        <p className="text-[10px] text-white/40 ml-[4.5rem]">
                                            {item.variantName}{item.addonNames?.length > 0 ? ` + ${item.addonNames.join(', ')}` : ''}
                                        </p>
                                    )}
                                </div>
                                <span className="text-sm font-bold pt-1">₹{item.totalPrice}</span>
                            </div>
                        ))}

                        {order.items.length > 3 && (
                            <div className="flex items-center gap-3 py-2 px-4 bg-white/5 rounded-xl border border-dashed border-white/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                                    + {order.items.length - 3} more items in this order
                                </span>
                            </div>
                        )}

                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <div className="flex justify-between text-xs font-medium text-white/40">
                                <span>Subtotal</span>
                                <span>₹{order.subtotal}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-xs font-medium text-green-500">
                                    <span>Exclusive Reward</span>
                                    <span>-₹{order.discount}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xs font-medium text-white/40">
                                <span>GST (5%)</span>
                                <span>₹{order.tax.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-sm font-bold text-white uppercase tracking-widest">Total Payable</span>
                                <span className="text-3xl font-bold text-brand-primary tracking-tighter">₹{order.total.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>
                </div>



                {/* Review Section */}
                {isCompleted && !reviewSubmitted && (
                    <div className="glass p-8 rounded-[2.5rem] border border-white/10 animate-fade-in-up">
                        <div className="text-center mb-8">
                            <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Star size={24} className="text-brand-primary" fill="currentColor" />
                            </div>
                            <h3 className="text-lg font-bold mb-1">Rate the Experience</h3>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Share your feedback to help us grow</p>
                        </div>

                        <div className="flex items-center justify-center gap-4 mb-8">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button key={s} onClick={() => setRating(s)} className="group">
                                    <Star
                                        size={36}
                                        fill={s <= rating ? '#D97706' : 'none'}
                                        className={`transition-all duration-300 ${s <= rating ? 'text-brand-primary scale-110 drop-shadow-[0_0_10px_rgba(217,119,6,0.5)]' : 'text-white/20 group-hover:text-white/40'}`}
                                    />
                                </button>
                            ))}
                        </div>

                        <textarea
                            placeholder="Tell us about the flavors, service, or anything else..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full bg-white/5 rounded-2xl p-5 text-sm font-medium text-white border border-white/10 focus:border-brand-primary/50 focus:outline-none transition-all resize-none h-32 mb-6 placeholder:text-white/20"
                        />

                        <button
                            onClick={handleSubmitReview}
                            disabled={rating === 0}
                            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-white/90 active:scale-95 transition-all disabled:opacity-20"
                        >
                            Submit Review
                        </button>
                    </div>
                )}

                {/* Success Review State */}
                {reviewSubmitted && (
                    <div className="p-8 rounded-[2.5rem] border border-green-500/20 bg-green-500/5 text-center animate-fade-in-up">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                            <Check size={24} className="text-green-500" />
                        </div>
                        <h3 className="text-lg font-bold text-green-500 mb-1">Feedback Received</h3>
                        <p className="text-xs text-white/40">Thank you for helping us improve!</p>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="pb-12 grid grid-cols-2 gap-4">
                    <Link
                        to={`/menu/${order.restaurant.slug}?table=${order.table.id}`}
                        className="p-6 bg-brand-primary/10 border border-brand-primary/20 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:bg-brand-primary/20 transition-all"
                    >
                        <UtensilsCrossed size={20} className="text-brand-primary" />
                        <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest text-center">Order More</span>
                    </Link>

                    {isEditable && (
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all border ${isEditMode
                                    ? 'bg-brand-primary border-brand-primary text-black'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <Edit3 size={20} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-center">
                                {isEditMode ? 'Exit Edit' : 'Edit Order'}
                            </span>
                        </button>
                    )}
                </div>
            </main>



        </div>
    );
}