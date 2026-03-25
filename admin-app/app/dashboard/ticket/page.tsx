"use client";

import { useEffect, useState, useCallback } from "react";
import { Ticket as TicketIcon, Search, Filter, Loader2, AlertCircle, Eye, X, BrainCircuit, FileText, Image as ImageIcon, MapPin, IndianRupee, CheckCircle2 } from "lucide-react";

// Expanded interface to match your FastAPI backend response
interface TicketDetail {
  id: number;
  department: string;
  severity_score: number;
  latitude: string;
  longitude: string;
  description: string;
  ai_detailed_analysis: string;
  core_issue: string;
  estimated_cost: number;
  status: string;
  created_at: string;
  original_image_url: string;
  // --- NEW FIELDS FOR RESOLUTION ---
  resolution_image_url?: string;
  claimed_length_meters?: number;
  claimed_width_meters?: number;
  claimed_depth_meters?: number;
}

export default function TicketsListPage() {
  const [tickets, setTickets] = useState<TicketDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  
  // State to control the popup modal
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/tickets`);
      if (!res.ok) throw new Error("Failed to fetch tickets");
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = tickets.filter(t => 
    (t.department && t.department.toLowerCase().includes(search.toLowerCase())) ||
    t.id.toString().includes(search)
  );

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Master Ticket Log</h1>
          <p className="text-[13px] text-slate-500 mt-1">Comprehensive view of all ingested civic issues across the city.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by ID or Dept..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-[13px] text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
            />
          </div>
          <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 font-bold text-[13px] px-4 py-2.5 rounded-xl hover:bg-slate-50 shadow-sm transition-colors">
            <Filter size={16} /> <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-6">
          <AlertCircle size={16} className="text-red-500" />
          <p className="text-[13px] font-bold text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
            <p className="text-[13px] font-semibold text-slate-500">Fetching massive ticket log...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <TicketIcon size={48} className="text-slate-300 mb-4" />
            <p className="text-[14px] font-bold text-slate-600">No tickets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase text-slate-500">Ticket ID</th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase text-slate-500">Department</th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase text-slate-500">Severity</th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase text-slate-500">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase text-slate-500">Coordinates</th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-[14px] font-black text-slate-900">#{ticket.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[13px] font-bold text-slate-700">{ticket.department}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-[10px]
                          ${ticket.severity_score >= 8 ? 'bg-red-500' : ticket.severity_score >= 5 ? 'bg-orange-500' : 'bg-green-500'}`}>
                          {ticket.severity_score}
                        </div>
                        <span className="text-[12px] font-semibold text-slate-500">/ 10</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {/* DYNAMIC STATUS BADGE */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold
                        ${ticket.status === 'Open' || ticket.status === 'Pending' ? 'bg-blue-100 text-blue-700' : 
                          ticket.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 
                          ticket.status === 'Resolved' || ticket.status === 'Closed' ? 'bg-emerald-100 text-emerald-700' : 
                          'bg-slate-100 text-slate-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full 
                          ${ticket.status === 'Open' || ticket.status === 'Pending' ? 'bg-blue-500' : 
                            ticket.status === 'In Progress' ? 'bg-amber-500' : 
                            ticket.status === 'Resolved' || ticket.status === 'Closed' ? 'bg-emerald-500' : 
                            'bg-slate-400'}`} />
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-mono text-slate-400">
                        {parseFloat(ticket.latitude).toFixed(4)}°N, {parseFloat(ticket.longitude).toFixed(4)}°E
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedTicket(ticket)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[11px] font-bold transition-colors"
                      >
                        <Eye size={14} /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- POPUP MODAL --- */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                  <TicketIcon size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-[16px] font-black text-slate-900">Ticket #{selectedTicket.id}</h2>
                  <p className="text-[12px] font-semibold text-slate-500">{selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString() : 'Date Unknown'}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Citizen Data & Resolution Data */}
              <div className="space-y-6">
                
                {/* --- DYNAMIC BEFORE & AFTER PHOTOS --- */}
                <div>
                  <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    <ImageIcon size={14} /> Photographic Evidence
                  </h3>
                  
                  {selectedTicket.status === 'Resolved' && selectedTicket.resolution_image_url ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-md">Before</span>
                        <div className="w-full h-32 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                          <img src={selectedTicket.original_image_url} alt="Before" className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">After Repair</span>
                        <div className="w-full h-32 bg-slate-100 rounded-xl border-2 border-emerald-400 overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                          <img src={selectedTicket.resolution_image_url} alt="After" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Default Single Photo View */
                    selectedTicket.original_image_url ? (
                      <div className="w-full h-48 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                        <img src={selectedTicket.original_image_url} alt="Civic Issue" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon size={32} className="mb-2 opacity-50" />
                        <p className="text-[12px] font-semibold">No Image Provided</p>
                      </div>
                    )
                  )}
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <FileText size={14} /> Citizen Description
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[13px] text-slate-700 leading-relaxed">
                    {selectedTicket.description || "No description provided by the citizen."}
                  </div>
                </div>

                {/* --- NEW: WORKER REPAIR REPORT --- */}
                {selectedTicket.status === 'Resolved' && (
                  <div>
                    <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-2 mt-4">
                      <CheckCircle2 size={14} /> Field Worker Dimensions
                    </h3>
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600/70 uppercase">Length</p>
                        <p className="text-[15px] font-black text-emerald-900">{selectedTicket.claimed_length_meters || 0}m</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600/70 uppercase">Width</p>
                        <p className="text-[15px] font-black text-emerald-900">{selectedTicket.claimed_width_meters || 0}m</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600/70 uppercase">Depth</p>
                        <p className="text-[15px] font-black text-emerald-900">{selectedTicket.claimed_depth_meters || 0}m</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <MapPin size={14} /> Location
                  </h3>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="text-[13px] text-slate-700 font-mono">
                      {parseFloat(selectedTicket.latitude).toFixed(5)}°N, {parseFloat(selectedTicket.longitude).toFixed(5)}°E
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Analysis */}
              <div className="space-y-6">
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 h-full">
                  <h3 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-blue-800 mb-4 pb-3 border-b border-blue-200/50">
                    <BrainCircuit size={16} /> CivicFix AI Triage
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wide mb-1">Routed Department</p>
                      <p className="text-[14px] font-black text-slate-900">{selectedTicket.department}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wide mb-1">Core Issue Detected</p>
                      <p className="text-[14px] font-bold text-slate-700">{selectedTicket.core_issue || "Pending Analysis"}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wide mb-1">Detailed Analysis</p>
                      <p className="text-[13px] text-slate-600 leading-relaxed bg-white/60 p-3 rounded-xl border border-blue-100/50">
                        {selectedTicket.ai_detailed_analysis || "AI analysis not fully processed yet."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Severity</p>
                        <p className={`text-[18px] font-black ${selectedTicket.severity_score >= 8 ? 'text-red-600' : selectedTicket.severity_score >= 5 ? 'text-orange-600' : 'text-green-600'}`}>
                          {selectedTicket.severity_score} / 10
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Est. Cost</p>
                        <p className="text-[18px] font-black text-slate-900 flex items-center">
                          <IndianRupee size={16} className="mr-0.5" /> 
                          {selectedTicket.estimated_cost ? selectedTicket.estimated_cost.toLocaleString() : "---"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </main>
  );
}