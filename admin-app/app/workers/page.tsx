"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Search, MapPin, Briefcase, Star, Loader2, AlertCircle } from "lucide-react";

interface Worker {
  worker_id: string;
  name: string;
  phone: string;
  department: string;
  rating: number;
  active_jobs: number;
  status: string;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dispatch/workers`);
      if (!res.ok) throw new Error("Failed to fetch workers");
      const data = await res.json();
      setWorkers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) || 
    w.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Field Workforce</h1>
          <p className="text-[13px] text-slate-500 mt-1">Manage municipal staff, view availability, and track active dispatch jobs.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search workers or departments..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-[13px] text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-6">
          <AlertCircle size={16} className="text-red-500" />
          <p className="text-[13px] font-bold text-red-700">{error}</p>
        </div>
      )}

      {/* Workers Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
            <p className="text-[13px] font-semibold text-slate-500">Loading workforce data...</p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users size={48} className="text-slate-300 mb-4" />
            <p className="text-[14px] font-bold text-slate-600">No workers found</p>
            <p className="text-[12px] text-slate-400 mt-1">Try adjusting your search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase text-slate-500">Worker</th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase text-slate-500">Department</th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase text-slate-500">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase text-slate-500">Active Jobs</th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase text-slate-500">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorkers.map((worker) => (
                  <tr key={worker.worker_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[13px]">
                          {worker.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-slate-900">{worker.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{worker.worker_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
                        <Briefcase size={14} className="text-slate-400" />
                        {worker.department}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold
                        ${worker.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 
                          worker.status === 'BUSY' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full 
                          ${worker.status === 'AVAILABLE' ? 'bg-emerald-500' : 
                            worker.status === 'BUSY' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                        {worker.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700">
                        <MapPin size={14} className="text-blue-500" />
                        {worker.active_jobs}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-[13px] font-bold text-slate-700">
                        <Star size={14} className="text-orange-400 fill-orange-400" />
                        {worker.rating.toFixed(1)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}