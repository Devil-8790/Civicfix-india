"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HardHat, MapPin, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

export default function WorkerLogin() {
  const router = useRouter();
  const [workerId, setWorkerId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId.trim()) return;
    
    setLoading(true);
    // Simulate a network request, then redirect to their jobs list
    setTimeout(() => {
      // In a real app, we'd verify the ID with the backend here
      localStorage.setItem("civicfix_worker_id", workerId.toUpperCase());
      router.push("/jobs");
    }, 800);
  };

  return (
    <main className="min-h-screen flex flex-col justify-center max-w-md mx-auto p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 animate-slide-up relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 mb-4 relative">
            <HardHat size={32} className="text-white" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
              <MapPin size={12} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">CivicFix Field Ops</h1>
          <p className="text-[14px] text-slate-500 mt-2 font-medium">Clock in to view your assigned municipal tasks.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[11px] font-extrabold tracking-[0.15em] uppercase text-slate-400 mb-2 ml-1">
              Worker ID
            </label>
            <input 
              type="text" 
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              placeholder="e.g., W-101"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[16px] font-bold text-slate-900 placeholder-slate-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all uppercase"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !workerId.trim()}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[15px] transition-all
              ${loading || !workerId.trim()
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-600/25"
              }`}
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Authenticating...</>
            ) : (
              <>Clock In & View Jobs <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        {/* Security Badge */}
        <div className="mt-8 flex items-center justify-center gap-1.5 text-slate-400">
          <ShieldCheck size={14} />
          <span className="text-[11px] font-semibold">Secure Municipal Gateway</span>
        </div>
      </div>
    </main>
  );
}