"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Ticket as TicketIcon,   // ← renamed — "Ticket" would clash with our data type below
  Users,
  Flame,
  RefreshCw,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  MapPin,
  ChevronDown,
  Building2,
  UserCheck,
} from "lucide-react";

// Import shared Ticket data type from TicketMap
import type { Ticket } from "@/components/TicketMap";

// ─── Leaflet loaded client-side only ─────────────────────────────────────────

const TicketMap = dynamic(() => import("@/components/TicketMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-xl">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={24} className="animate-spin text-blue-500" />
        <p className="text-[12px] text-slate-400 font-medium">Loading map…</p>
      </div>
    </div>
  ),
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface Worker {
  worker_id: string;
  name: string;
  department: string;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");

// ─── Severity helpers ─────────────────────────────────────────────────────────

function sevBadge(score: number) {
  if (score >= 9) return { label: "Critical", bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500"    };
  if (score >= 7) return { label: "High",     bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" };
  if (score >= 4) return { label: "Moderate", bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-500"  };
  return               { label: "Low",       bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500"  };
}

function scoreRingColor(score: number) {
  if (score >= 9) return "bg-red-500";
  if (score >= 7) return "bg-orange-500";
  if (score >= 4) return "bg-amber-500";
  return "bg-emerald-500";
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = "blue" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  const palette: Record<string, string> = {
    blue:   "bg-blue-600   shadow-[0_4px_14px_rgba(37,99,235,0.28)]",
    green:  "bg-emerald-600 shadow-[0_4px_14px_rgba(5,150,105,0.28)]",
    orange: "bg-orange-500 shadow-[0_4px_14px_rgba(234,88,12,0.28)]",
    red:    "bg-red-500    shadow-[0_4px_14px_rgba(220,38,38,0.28)]",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${palette[color] ?? palette.blue}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-slate-400 leading-none">{label}</p>
        <p className="text-3xl font-black text-slate-900 tabular-nums leading-tight mt-1">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Assign modal ─────────────────────────────────────────────────────────────

function AssignModal({ ticket, workers, onClose, onAssigned }: {
  ticket: Ticket;
  workers: Worker[];
  onClose: () => void;
  onAssigned: (ticketId: number) => void;
}) {
  const [selected, setSelected] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const sev = sevBadge(ticket.severity_score);

  const doAssign = async () => {
    if (!selected) { setError("Please select a worker first."); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dispatch/${ticket.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worker_id: selected }),
      });
      const text = await res.text();
      console.log("[CivicFix Admin] Assign →", res.status, text);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 140)}`);
      onAssigned(ticket.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assignment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-start gap-4 p-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-[0_2px_10px_rgba(37,99,235,0.3)]">
            <UserCheck size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-slate-900">Assign Worker</p>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Ticket #{ticket.id} · {ticket.department}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0">
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        {/* Ticket meta strip */}
        <div className="flex items-center gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2">
            <Building2 size={13} className="text-slate-400" />
            <span className="text-[12px] font-semibold text-slate-600">{ticket.department}</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame size={13} className="text-slate-400" />
            <span className="text-[12px] font-semibold text-slate-600">Score {ticket.severity_score}</span>
          </div>
          <div className={`ml-auto flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${sev.bg} ${sev.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
            {sev.label}
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Worker dropdown */}
          <div>
            <label className="block text-[11px] font-bold tracking-[0.15em] uppercase text-slate-500 mb-2">
              Select Field Worker
            </label>
            {workers.length === 0 ? (
              <p className="text-[13px] text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                No workers available.
              </p>
            ) : (
              <div className="relative">
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-[14px] text-slate-800 font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                >
                  <option value="">Choose a worker…</option>
                  {workers.map((w) => (
                    <option key={w.worker_id} value={w.worker_id}>
                      {w.name} — {w.department}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-600 leading-snug">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-500 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={doAssign} disabled={loading || !selected}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold transition-all
                ${loading || !selected
                  ? "bg-blue-200 text-blue-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-[0_2px_12px_rgba(37,99,235,0.3)]"
                }`}>
              {loading
                ? <><Loader2 size={14} className="animate-spin" />Assigning…</>
                : <><UserCheck size={14} />Assign</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [tickets,     setTickets]     = useState<Ticket[]>([]);
  const [workers,     setWorkers]     = useState<Worker[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [selected,    setSelected]    = useState<Ticket | null>(null);
  const [assigned,    setAssigned]    = useState<Set<number>>(new Set());
  const [deptFilter,  setDeptFilter]  = useState("All");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, wRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard/tickets`),
        fetch(`${API_BASE}/dispatch/workers`),
      ]);

      const tText = await tRes.text();
      const wText = await wRes.text();

      const t = JSON.parse(tText);
      const w = JSON.parse(wText);

      const allTickets = Array.isArray(t) ? t : [];
      
      // 🔥 THE FIX: Strictly filter out tickets that are already assigned
      const actionableTickets = allTickets.filter(
        (ticket) => ticket.status === "Open" || ticket.status === "Pending"
      );

      setTickets(actionableTickets);
      setWorkers(Array.isArray(w) ? w : []);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAssigned = (ticketId: number) => {
    setAssigned((prev) => new Set([...prev, ticketId]));
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setSelected(null);
  };

  const depts    = ["All", ...Array.from(new Set(tickets.map((t) => t.department)))];
  const filtered = deptFilter === "All" ? tickets : tickets.filter((t) => t.department === deptFilter);
  const critical = tickets.filter((t) => t.severity_score >= 8).length;
  const avgScore = tickets.length
    ? (tickets.reduce((s, t) => s + t.severity_score, 0) / tickets.length).toFixed(1)
    : "—";

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
            Live ticket triage · worker dispatch · field map
            {lastRefresh && (
              <span className="text-slate-300">
                · Refreshed {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-600 text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-blue-500" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-4 mb-6">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-red-700">Failed to load data</p>
            <p className="text-[12px] text-red-500 mt-0.5 font-mono break-all">{error}</p>
          </div>
          <button onClick={fetchAll}
            className="text-[12px] font-bold text-red-600 hover:text-red-700 underline flex-shrink-0">
            Retry
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={TicketIcon}   label="Open Tickets" value={loading ? "—" : tickets.length} sub="Awaiting dispatch" color="blue"   />
        <StatCard icon={Users}        label="Workers"      value={loading ? "—" : workers.length} sub="Available"        color="green"  />
        <StatCard icon={Flame}        label="Critical"     value={loading ? "—" : critical}       sub="Score ≥ 8"        color="red"    />
        <StatCard icon={CheckCircle2} label="Avg Score"    value={loading ? "—" : avgScore}       sub="Severity mean"    color="orange" />
      </div>

      {/* Map + list */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5 items-start">

        {/* Map card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.25)]">
              <MapPin size={15} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-slate-900">Live Incident Map</p>
              <p className="text-[11px] text-slate-400">{tickets.length} active tickets plotted</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold text-emerald-600">Live</span>
            </div>
          </div>
          <div className="h-[400px] sm:h-[480px]">
            {/* Only render map after initial load to avoid empty-bounds flash */}
            {!loading && (
              <TicketMap
                tickets={tickets}
                onSelect={(t) => setSelected(t)}
              />
            )}
          </div>
        </div>

        {/* Ticket list card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.25)]">
              <TicketIcon size={15} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-slate-900">Open Tickets</p>
              <p className="text-[11px] text-slate-400">{filtered.length} shown</p>
            </div>
          </div>

          {/* Department filter pills */}
          <div className="flex gap-1.5 px-4 py-3 border-b border-slate-100 overflow-x-auto">
            {depts.map((d) => (
              <button key={d} onClick={() => setDeptFilter(d)}
                className={`flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all
                  ${deptFilter === d
                    ? "bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}>
                {d}
              </button>
            ))}
          </div>

          {/* Ticket rows */}
          <div className="overflow-y-auto max-h-[420px] divide-y divide-slate-50">
            {loading ? (
              <div className="flex items-center justify-center py-14">
                <Loader2 size={22} className="animate-spin text-blue-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-14">
                <CheckCircle2 size={28} className="text-emerald-400" />
                <p className="text-[13px] font-semibold text-slate-500">All clear!</p>
                <p className="text-[11px] text-slate-300">No open tickets for this filter.</p>
              </div>
            ) : (
              [...filtered]
                .sort((a, b) => b.severity_score - a.severity_score)
                .map((ticket) => {
                  const sev  = sevBadge(ticket.severity_score);
                  const done = assigned.has(ticket.id);
                  const isActive = selected?.id === ticket.id;

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelected(isActive ? null : ticket)}
                      className={`px-4 py-3.5 cursor-pointer transition-colors
                        ${isActive ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-slate-50 border-l-2 border-l-transparent"}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Score ring */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-black text-[11px] mt-0.5 ${scoreRingColor(ticket.severity_score)}`}>
                          {ticket.severity_score}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[13px] font-bold text-slate-900">#{ticket.id}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sev.bg} ${sev.text}`}>
                              {sev.label}
                            </span>
                            {done && <CheckCircle2 size={12} className="text-emerald-500 ml-auto" />}
                          </div>
                          <p className="text-[12px] text-slate-500 font-medium mt-0.5 truncate">
                            {ticket.department}
                          </p>
                          <p className="text-[11px] text-slate-300 mt-0.5 font-mono truncate">
                            {parseFloat(ticket.latitude).toFixed(4)}°N,&nbsp;
                            {parseFloat(ticket.longitude).toFixed(4)}°E
                          </p>
                        </div>

                        {!done && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelected(ticket); }}
                            className="flex-shrink-0 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors shadow-sm"
                          >
                            <UserCheck size={11} /> Assign
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Assign modal */}
      {selected && !assigned.has(selected.id) && (
        <AssignModal
          ticket={selected}
          workers={workers}
          onClose={() => setSelected(null)}
          onAssigned={handleAssigned}
        />
      )}
    </main>
  );
}