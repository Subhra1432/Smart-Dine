import { useQuery } from '@tanstack/react-query';
import { Star, MessageSquare, Quote, User, Hash, Calendar } from 'lucide-react';
import { getReviews } from '../lib/api';
import { cn } from '../lib/utils';
import { PageLoader } from '../components/PageLoader';

export default function FeedbackPage() {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => getReviews() as Promise<Array<any>>,
  });

  if (isLoading) return <PageLoader />;

  const averageRating = reviews?.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Header Matrix */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-black text-stone-950 dark:text-white tracking-tighter uppercase leading-none">Customer <span className="text-primary italic">Feedback</span></h1>
          <p className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] ml-1">Customer reviews</p>
        </div>
        
        <div className="glass-panel flex items-center gap-5 px-4 py-2 !bg-white/40 dark:!bg-stone-900/40 border-white/20 dark:border-white/5 shadow-2xl shadow-stone-200/40 dark:shadow-none">
           <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 relative group">
              <Star className="text-primary fill-primary transition-transform group-hover:scale-110" size={18} />
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-700" />
           </div>
           <div>
              <p className="text-[8px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.3em] mb-0.5">Average Rating</p>
              <div className="flex items-baseline gap-1.5">
                 <p className="text-xl font-black text-stone-950 dark:text-white tracking-tighter leading-none">{averageRating}</p>
                 <p className="text-[9px] text-stone-400 dark:text-stone-700 font-black uppercase tracking-widest">/ 5.0</p>
              </div>
           </div>
        </div>
      </div>

      {reviews?.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center py-48 text-center !bg-white/40 dark:!bg-stone-900/40 border-white/20 dark:border-white/5 shadow-2xl shadow-stone-200/40 dark:shadow-none">
          <div className="w-32 h-32 bg-stone-50 dark:bg-stone-950/40 rounded-[3rem] border border-stone-100 dark:border-white/5 flex items-center justify-center mb-10 shadow-sm relative group overflow-hidden">
            <MessageSquare size={48} className="text-stone-300 dark:text-stone-800 transition-transform group-hover:-rotate-12 duration-700" />
            <div className="absolute inset-0 bg-primary/5 scale-0 group-hover:scale-100 transition-transform duration-700" />
          </div>
          <h2 className="text-3xl font-black text-stone-950 dark:text-white mb-4 uppercase tracking-tighter">No reviews yet</h2>
          <p className="text-stone-400 dark:text-stone-600 font-black uppercase text-[10px] tracking-[0.2em] max-w-md leading-relaxed">Customer reviews will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews?.map((review) => (
            <div key={review.id} className="glass-panel p-6 flex flex-col group transition-all duration-700 hover:scale-[1.01] !bg-white/40 dark:!bg-stone-900/40 border-white/20 dark:border-white/5 shadow-2xl shadow-stone-200/40 dark:shadow-none">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                    <div className="flex gap-1 p-2 bg-stone-50 dark:bg-stone-950/40 rounded-lg border border-stone-100 dark:border-white/5">
                       {[...Array(5)].map((_, i) => (
                           <Star key={i} size={10} className={cn("transition-all duration-500", i < review.rating ? "text-primary fill-primary" : "text-stone-200 dark:text-stone-800")} />
                       ))}
                    </div>
                 </div>
                 <div className="flex items-center gap-2 text-[8px] font-black text-stone-300 dark:text-stone-700 uppercase tracking-widest">
                    <Calendar size={10} />
                    {new Date(review.createdAt).toLocaleDateString()}
                 </div>
              </div>
              
              <div className="flex-grow mb-6 relative">
                <Quote className="absolute -top-3 -left-3 text-stone-100 dark:text-stone-800/20 w-10 h-10 pointer-events-none" />
                {review.comment ? (
                  <p className="text-stone-700 dark:text-stone-300 text-sm font-black leading-relaxed italic relative z-10 tracking-tight">
                    "{review.comment}"
                  </p>
                ) : (
                  <div className="h-16 flex items-center justify-center text-[8px] font-black text-stone-300 dark:text-stone-800 uppercase tracking-[0.4em] border border-dashed border-stone-100 dark:border-white/5 rounded-xl">
                    No comment
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-stone-100 dark:border-white/5 mt-auto">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-stone-300 dark:text-stone-700 uppercase tracking-[0.2em] flex items-center gap-1.5">
                         <User size={8} /> Customer
                       </p>
                       <p className="text-[11px] font-black text-stone-950 dark:text-white uppercase tracking-tight truncate">
                         {review.order.customer?.name || review.order.customer?.phone || 'Guest'}
                       </p>
                    </div>
                    <div className="space-y-1 text-right">
                       <p className="text-[9px] font-black text-stone-300 dark:text-stone-700 uppercase tracking-[0.2em] flex items-center justify-end gap-1.5">
                         <Hash size={8} /> Order
                       </p>
                       <p className="text-[11px] font-black text-primary uppercase tracking-tight group-hover:tracking-widest transition-all duration-700">
                         #{review.order.id.slice(-6)}
                       </p>
                    </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
