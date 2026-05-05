// ═══════════════════════════════════════════
// DineSmart — Restaurant Registration Page
// ═══════════════════════════════════════════

import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UtensilsCrossed, Building2, Mail, Lock, User, ArrowRight, Upload, FileCheck, Phone, MapPin, CreditCard, Receipt, FileText, CheckCircle, Zap, TrendingUp, Crown, ArrowLeft, QrCode, ShieldCheck } from 'lucide-react';

const API_URL = (import.meta as any).env.VITE_API_URL || '';
const API_BASE = `${API_URL}/api/v1`;

interface DocUpload {
  file: File | null;
  preview: string;
  url: string;
  uploading: boolean;
}

const PLANS = [
  {
    id: 'STARTER' as const,
    name: 'Starter Node',
    price: 999,
    description: 'Perfect for small cafes & standalone outlets.',
    features: ['Single Branch', 'Digital Menu', 'Basic Analytics', 'Standard Support'],
    icon: Zap,
    color: 'stone'
  },
  {
    id: 'PREMIUM' as const,
    name: 'Premium Nexus',
    price: 2499,
    description: 'Full ecosystem for restaurant chains.',
    features: [
      'Unlimited Branches',
      'Full Analytics + AI',
      'Inventory Management',
      'White Label Branding',
    ],
    icon: Crown,
    color: 'emerald'
  }
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Details, 2: Plans, 3: Payment
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    panCard: '',
    gstBill: '',
    password: '',
    confirmPassword: '',
    plan: 'STARTER' as 'STARTER' | 'PREMIUM'
  });
  const [loading, setLoading] = useState(false);

  const [panCardDoc, setPanCardDoc] = useState<DocUpload>({ file: null, preview: '', url: '', uploading: false });
  const [gstBillDoc, setGstBillDoc] = useState<DocUpload>({ file: null, preview: '', url: '', uploading: false });
  const [regCertDoc, setRegCertDoc] = useState<DocUpload>({ file: null, preview: '', url: '', uploading: false });

  const panRef = useRef<HTMLInputElement>(null);
  const gstRef = useRef<HTMLInputElement>(null);
  const regRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (
    file: File,
    setter: React.Dispatch<React.SetStateAction<DocUpload>>
  ): Promise<string> => {
    setter((prev) => ({ ...prev, file, preview: URL.createObjectURL(file), uploading: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/auth/upload-document`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');
      setter((prev) => ({ ...prev, url: data.data.url, uploading: false }));
      return data.data.url;
    } catch (err) {
      setter((prev) => ({ ...prev, uploading: false }));
      toast.error(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return '';
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<DocUpload>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }
    await uploadFile(file, setter);
  };

  const validateStep1 = () => {
    if (!formData.restaurantName || !formData.ownerName || !formData.email || !formData.phone || !formData.address || !formData.panCard || !formData.gstBill || !formData.password) {
      toast.error('Please fill all required fields');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return false;
    }
    if (!panCardDoc.url || !gstBillDoc.url) {
      toast.error('Please upload required documents');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: formData.restaurantName,
          ownerName: formData.ownerName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          panCard: formData.panCard,
          panCardUrl: panCardDoc.url || undefined,
          gstBill: formData.gstBill,
          gstBillUrl: gstBillDoc.url || undefined,
          registrationCertUrl: regCertDoc.url || undefined,
          password: formData.password,
          plan: formData.plan
        })
      });
      const data = await res.json();
      if (!data.success) {
        if (data.details && Array.isArray(data.details)) {
          throw new Error(data.details.map((d: any) => d.message).join(', '));
        }
        throw new Error(data.error || 'Registration failed');
      }
      setShowSuccessModal(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const DocUploadBox = ({ label, icon: Icon, docState, inputRef, onChange }: {
    label: string;
    icon: any;
    docState: DocUpload;
    inputRef: React.RefObject<HTMLInputElement>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div className="relative group/doc">
      <input
        ref={inputRef as any}
        type="file"
        accept="image/*,.pdf"
        onChange={onChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => (inputRef.current as any)?.click()}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed transition-all duration-300 ${
          docState.url
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : docState.uploading
            ? 'border-saffron-500/30 bg-saffron-500/5 animate-pulse'
            : 'border-white/10 bg-white/[0.02] hover:border-saffron-500/30 hover:bg-white/[0.04]'
        }`}
      >
        {docState.preview ? (
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
            <img src={docState.preview} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            docState.url ? 'bg-emerald-500/10' : 'bg-white/5'
          }`}>
            {docState.url ? (
              <FileCheck size={20} className="text-emerald-400" />
            ) : (
              <Icon size={20} className="text-stone-600 group-hover/doc:text-saffron-500 transition-colors" />
            )}
          </div>
        )}
        <div className="flex-1 text-left">
          <p className={`text-[9px] font-black uppercase tracking-widest ${
            docState.url ? 'text-emerald-400' : 'text-stone-400'
          }`}>
            {docState.uploading ? 'Uploading...' : docState.url ? 'Uploaded ✓' : label}
          </p>
          <p className="text-[8px] font-bold text-stone-500 uppercase tracking-wider mt-0.5">
            {docState.file ? docState.file.name.substring(0, 25) : 'Tap to upload (JPG, PNG, PDF — Max 5MB)'}
          </p>
        </div>
        {!docState.url && !docState.uploading && (
          <Upload size={14} className="text-stone-500 group-hover/doc:text-saffron-500 transition-colors" />
        )}
      </button>
    </div>
  );

  const selectedPlan = PLANS.find(p => p.id === formData.plan)!;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-stone-50 dark:bg-stone-950 relative overflow-hidden font-outfit transition-colors duration-500">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(245,158,11,0.05),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(245,158,11,0.05),transparent_50%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-saffron-500/5 blur-[120px] rounded-full animate-pulse" />
      </div>

      <div className="w-full max-w-4xl relative group">
        {/* Card Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-saffron-500/20 to-stone-500/20 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-75 transition duration-1000" />
        
        <div className="relative glass-card rounded-[3rem] border border-stone-200 dark:border-white/10 bg-white/80 dark:bg-stone-900/40 backdrop-blur-3xl overflow-hidden shadow-2xl">
          <div className="grid md:grid-cols-[300px_1fr] h-[85vh]">
            {/* Sidebar Status */}
            <div className="bg-white/[0.02] border-r border-white/5 p-10 flex flex-col justify-between hidden md:flex">
              <div className="space-y-8">
                <div className="w-16 h-16 bg-saffron-500/10 border border-saffron-500/20 rounded-2xl flex items-center justify-center shadow-xl">
                  <UtensilsCrossed size={32} className="text-saffron-500" />
                </div>
                
                <div className="space-y-6">
                  {[
                    { s: 1, label: 'Identity Node', desc: 'Personal & Business Details' },
                    { s: 2, label: 'Tier Selection', desc: 'Choose Deployment Plan' },
                    { s: 3, label: 'Secure Payment', desc: 'Finalize Initialization' }
                  ].map((item) => (
                    <div key={item.s} className={`flex gap-4 items-start transition-all duration-500 ${step >= item.s ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${
                        step === item.s ? 'bg-saffron-500 border-saffron-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 
                        step > item.s ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-white/10 text-stone-400'
                      }`}>
                        {step > item.s ? '✓' : item.s}
                      </div>
                      <div className="space-y-1">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${step === item.s ? 'text-white' : 'text-stone-400'}`}>{item.label}</p>
                        <p className="text-[8px] text-stone-500 font-bold uppercase">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5 space-y-3">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest text-center italic">"The Future of Dining is Decentralized"</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[8px] font-black text-emerald-500 uppercase">Protocol Secure</span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex flex-col">
              {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-stone-950 dark:text-white uppercase tracking-tighter">Vault <span className="text-saffron-500">Initiation</span></h2>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-[0.4em]">Establish New Restaurant Node</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-[8px] font-black text-saffron-500/60 uppercase tracking-[0.4em] ml-2">Identity Protocol</p>
                      <div className="grid gap-4">
                        <div className="relative group/field">
                          <Building2 size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within/field:text-saffron-500 transition-colors" />
                             <input
                            type="text"
                            required
                            value={formData.restaurantName}
                            onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                            placeholder="RESTAURANT IDENTITY"
                            className="w-full pl-14 pr-6 py-5 bg-stone-100/50 dark:bg-white/[0.05] border border-stone-200 dark:border-white/10 rounded-2xl text-xs font-black text-stone-950 dark:text-white uppercase tracking-widest placeholder:text-stone-500 focus:border-saffron-500/50 focus:bg-white dark:focus:bg-white/[0.08] focus:outline-none transition-all"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="relative group/field">
                            <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within/field:text-saffron-500 transition-colors" />
                            <input
                              type="text"
                              required
                              value={formData.ownerName}
                              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                              placeholder="OWNER NAME"
                              className="w-full pl-14 pr-6 py-5 bg-white/[0.05] border border-white/10 rounded-2xl text-xs font-black text-white uppercase tracking-widest placeholder:text-stone-500 focus:border-saffron-500/50 focus:bg-white/[0.08] focus:outline-none transition-all"
                            />
                          </div>
                          <div className="relative group/field">
                            <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within/field:text-saffron-500 transition-colors" />
                             <input
                              type="text"
                              required
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="PHONE (+91XXXXXXXXXX)"
                              className="w-full pl-14 pr-6 py-5 bg-stone-100/50 dark:bg-white/[0.05] border border-stone-200 dark:border-white/10 rounded-2xl text-xs font-black text-stone-950 dark:text-white uppercase tracking-widest placeholder:text-stone-500 focus:border-saffron-500/50 focus:bg-white dark:focus:bg-white/[0.08] focus:outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="relative group/field">
                          <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within/field:text-saffron-500 transition-colors" />
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="OWNER AUTHENTICATION EMAIL"
                            className="w-full pl-14 pr-6 py-5 bg-white/[0.05] border border-white/10 rounded-2xl text-xs font-black text-white uppercase tracking-widest placeholder:text-stone-500 focus:border-saffron-500/50 focus:bg-white/[0.08] focus:outline-none transition-all"
                          />
                        </div>

                        <div className="relative group/field">
                          <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within/field:text-saffron-500 transition-colors" />
                          <input
                            type="text"
                            required
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="RESTAURANT HQ ADDRESS"
                            className="w-full pl-14 pr-6 py-5 bg-white/[0.05] border border-white/10 rounded-2xl text-xs font-black text-white uppercase tracking-widest placeholder:text-stone-500 focus:border-saffron-500/50 focus:bg-white/[0.08] focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[8px] font-black text-saffron-500/60 uppercase tracking-[0.4em] ml-2">Verification Documents</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="relative group/field">
                          <CreditCard size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within/field:text-saffron-500 transition-colors" />
                          <input
                            type="text"
                            required
                            value={formData.panCard}
                            onChange={(e) => setFormData({ ...formData, panCard: e.target.value })}
                            placeholder="PAN CARD NUMBER"
                            className="w-full pl-14 pr-6 py-5 bg-white/[0.05] border border-white/10 rounded-2xl text-xs font-black text-white uppercase tracking-widest placeholder:text-stone-500 focus:border-saffron-500/50 focus:bg-white/[0.08] focus:outline-none transition-all"
                          />
                        </div>
                        <div className="relative group/field">
                          <Receipt size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within/field:text-saffron-500 transition-colors" />
                          <input
                            type="text"
                            required
                            value={formData.gstBill}
                            onChange={(e) => setFormData({ ...formData, gstBill: e.target.value })}
                            placeholder="GST / REGISTRATION NO."
                            className="w-full pl-14 pr-6 py-5 bg-white/[0.05] border border-white/10 rounded-2xl text-xs font-black text-white uppercase tracking-widest placeholder:text-stone-500 focus:border-saffron-500/50 focus:bg-white/[0.08] focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 pt-2">
                        <DocUploadBox label="PAN Card Photo" icon={CreditCard} docState={panCardDoc} inputRef={panRef} onChange={(e) => handleFileChange(e, setPanCardDoc)} />
                        <DocUploadBox label="GST Bill / Certificate" icon={Receipt} docState={gstBillDoc} inputRef={gstRef} onChange={(e) => handleFileChange(e, setGstBillDoc)} />
                        <DocUploadBox label="Registration Cert" icon={FileText} docState={regCertDoc} inputRef={regRef} onChange={(e) => handleFileChange(e, setRegCertDoc)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[8px] font-black text-saffron-500/60 uppercase tracking-[0.4em] ml-2">Access Key</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="relative group/field">
                          <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within/field:text-saffron-500 transition-colors" />
                          <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="ACCESS KEY"
                            className="w-full pl-14 pr-6 py-5 bg-white/[0.05] border border-white/10 rounded-2xl text-xs font-black text-white uppercase tracking-widest placeholder:text-stone-500 focus:border-saffron-500/50 focus:bg-white/[0.08] focus:outline-none transition-all"
                          />
                        </div>
                        <div className="relative group/field">
                          <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within/field:text-saffron-500 transition-colors" />
                          <input
                            type="password"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="CONFIRM KEY"
                            className="w-full pl-14 pr-6 py-5 bg-white/[0.05] border border-white/10 rounded-2xl text-xs font-black text-white uppercase tracking-widest placeholder:text-stone-500 focus:border-saffron-500/50 focus:bg-white/[0.08] focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => validateStep1() && setStep(2)}
                      className="w-full py-6 bg-white text-black hover:bg-saffron-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group/btn"
                    >
                      Configure Subscription <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setStep(1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                      <ArrowLeft size={18} className="text-white" />
                    </button>
                    <div className="space-y-1">
                      <h2 className="text-3xl font-black text-stone-950 dark:text-white uppercase tracking-tighter">Tier <span className="text-saffron-500">Selection</span></h2>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-[0.4em]">Select Your Operational Scale</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {PLANS.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setFormData({ ...formData, plan: plan.id })}
                        className={`p-6 rounded-[2rem] border-2 text-left transition-all duration-300 relative overflow-hidden group/plan ${
                          formData.plan === plan.id ? 'border-saffron-500 bg-saffron-500/5' : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        {formData.plan === plan.id && (
                          <div className="absolute top-6 right-6">
                            <CheckCircle size={20} className="text-saffron-500" />
                          </div>
                        )}
                        <div className="flex items-start gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-transform group-hover/plan:rotate-3 ${
                            formData.plan === plan.id ? 'bg-saffron-500 text-black' : 'bg-white/5 text-stone-500'
                          }`}>
                            <plan.icon size={28} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                             <h4 className="text-xl font-black text-stone-950 dark:text-white uppercase tracking-tight">{plan.name}</h4>
                              <p className="text-xl font-black text-stone-950 dark:text-white tracking-tighter">₹{plan.price}<span className="text-[10px] text-stone-500">/mo</span></p>
                            </div>
                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wide">{plan.description}</p>
                            <div className="flex flex-wrap gap-2 pt-3">
                              {plan.features.map(f => (
                                <span key={f} className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-stone-400 group-hover/plan:text-white group-hover/plan:border-saffron-500/30 transition-all uppercase tracking-widest">{f}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-6 bg-white text-black hover:bg-saffron-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group/btn"
                  >
                    Proceed to Payment <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 flex-1 flex flex-col">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setStep(2)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                      <ArrowLeft size={18} className="text-white" />
                    </button>
                    <div className="space-y-1">
                      <h2 className="text-3xl font-black text-stone-950 dark:text-white uppercase tracking-tighter">Secure <span className="text-saffron-500">Payment</span></h2>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-[0.4em]">Complete Node Deployment</p>
                    </div>
                  </div>

                  <div className="flex-1 grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-6">
                      <div className="p-8 bg-white/[0.03] rounded-[2.5rem] border border-white/10 space-y-6 relative overflow-hidden group/order">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/order:opacity-10 transition-opacity">
                          <selectedPlan.icon size={120} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-saffron-500 uppercase tracking-widest">Order Summary</p>
                          <h4 className="text-2xl font-black text-white uppercase tracking-tight">{selectedPlan.name}</h4>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-white/5">
                          <div className="flex justify-between text-[10px] font-black text-stone-500 uppercase">
                            <span>Platform Subscription</span>
                            <span>₹{selectedPlan.price}.00</span>
                          </div>
                          <div className="flex justify-between text-[10px] font-black text-stone-500 uppercase">
                            <span>One-time Setup Fee</span>
                            <span className="text-emerald-400">FREE</span>
                          </div>
                          <div className="flex justify-between text-2xl font-black text-white uppercase tracking-tighter pt-4 border-t border-white/10">
                            <span>Total Payable</span>
                            <span className="text-saffron-500">₹{selectedPlan.price}.00</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                        <ShieldCheck size={24} className="text-emerald-500 flex-shrink-0 mt-1" />
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">Encrypted Uplink</p>
                          <p className="text-[8px] text-stone-500 font-bold uppercase">Payment is processed through our secure gateway and is refundable if verification fails.</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 flex flex-col items-center justify-center text-center">
                      <div className="w-full aspect-square max-w-[240px] bg-white rounded-3xl p-6 shadow-2xl relative group/qr">
                        <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm rounded-3xl opacity-0 group-hover/qr:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 gap-3 text-white">
                          <QrCode size={48} className="animate-pulse" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Scan with Any UPI App</p>
                        </div>
                        <img 
                          src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=dinesmart@upi&pn=DineSmart%20OS&am=999&cu=INR" 
                          alt="Payment QR" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Merchant: <span className="text-saffron-500">DineSmart Technologies</span></p>
                        <p className="text-[8px] text-stone-600 font-bold uppercase tracking-[0.2em]">Transaction ID: DS-{Math.random().toString(36).substring(7).toUpperCase()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={handleRegister}
                      disabled={loading}
                      className="w-full py-6 bg-white text-black hover:bg-saffron-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group/btn disabled:opacity-50"
                    >
                      {loading ? 'Initializing Protocol...' : 'Complete Payment & Deploy'} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-[8px] text-stone-700 font-bold uppercase tracking-widest text-center mt-4">
                      By clicking complete, you authorize the charge and acknowledge the terms of service.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom Security Banner */}
          <div className="bg-saffron-500/5 border-t border-white/5 px-10 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-saffron-500 animate-pulse" />
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Secure Uplink Active</span>
            </div>
            <div className="flex gap-6">
              <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Step {step} / 3</span>
              <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">v2.4.0-STABLE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-500">
          <div className="w-full max-w-md glass-card rounded-[2.5rem] border border-white/10 bg-stone-900 p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl mx-auto flex items-center justify-center shadow-2xl rotate-3">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Node Deployed Successfully</h3>
              <p className="text-[10px] text-stone-400 font-black uppercase tracking-[0.2em]">Tier: {selectedPlan.name} Activated</p>
            </div>

            <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5">
              <p className="text-xs text-stone-300 font-medium leading-relaxed">
                Payment received. Your restaurant node is now in the <span className="text-saffron-500 font-bold underline">Final Verification Hub</span>. 
                Our team will confirm your documents within 24 hours.
              </p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-5 bg-white text-black hover:bg-saffron-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] transition-all active:scale-95 shadow-xl"
            >
              OK — EXIT TO LOGIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

