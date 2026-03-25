"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  CheckCircle2, Hash, Building2, Flame, ArrowRight, RotateCcw,
  Copy, Check, Zap, MapPin, UserCheck, CircleCheckBig,
  ChevronRight, AlertCircle, Home,
} from "lucide-react";

// ─── Severity config ──────────────────────────────────────────────────────────

const SEV = [
  { max: 3,  label: "Low",      bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", fill: "#16a34a" },
  { max: 6,  label: "Moderate", bg: "#fffbeb", border: "#fde68a", text: "#b45309", fill: "#d97706" },
  { max: 8,  label: "High",     bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", fill: "#ea580c" },
  { max: 10, label: "Critical", bg: "#fef2f2", border: "#fecaca", text: "#b91c1c", fill: "#dc2626" },
] as const;

function getSev(score: number) { return SEV.find((s) => score <= s.max) ?? SEV[SEV.length - 1]; }

// ─── Animated counter ─────────────────────────────────────────────────────────

function Counter({ to }: { to: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 900, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{v}</>;
}

// ─── Severity bar ─────────────────────────────────────────────────────────────

function SevBar({ score, fill }: { score: number; fill: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW((score / 10) * 100), 250); return () => clearTimeout(t); }, [score]);
  return (
    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
      <div className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${w}%`, backgroundColor: fill, boxShadow: `0 0 8px ${fill}60` }} />
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2500); } catch { /* noop */ }
  };
  return (
    <button onClick={copy} type="button"
      className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all
        ${done
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
        }`}>
      {done ? <><Check size={11} />Copied!</> : <><Copy size={11} />Copy</>}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  const ticketId = params.get("ticket_id") ?? null;
  const deptRaw  = params.get("dept")      ?? null;
  const scoreRaw = params.get("score")     ?? null;
  const dept     = deptRaw  ? decodeURIComponent(deptRaw)  : null;
  const scoreN   = scoreRaw ? parseFloat(scoreRaw)         : NaN;
  const score    = isNaN(scoreN) ? null : Math.min(Math.max(scoreN, 0), 10);
  const hasData  = !!(ticketId && dept && score !== null);
  const sev      = score !== null ? getSev(score) : SEV[0];

  const steps = [
    { icon: Zap,            label: "AI analysis complete",          detail: "Department & severity assigned",        done: true  },
    { icon: UserCheck,      label: "Supervisor review pending",      detail: "Issue queued for field assignment",     done: false },
    { icon: MapPin,         label: "Worker dispatch",               detail: "Team will be en route shortly",          done: false },
    { icon: CircleCheckBig, label: "Issue resolved & ticket closed", detail: "You receive a resolution notification", done: false },
  ];

  return (
    <div className={`min-h-screen bg-[#f8fafc] transition-all duration-600 ${visible ? "opacity-100" : "opacity-0 translate-y-3"}`}>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
              <MapPin size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[13px] font-black text-slate-900 leading-none">CivicFix</p>
              <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-blue-500 leading-none mt-0.5">India</p>
            </div>
          </div>
          <span className="text-[12px] font-semibold text-slate-400">Ticket Confirmation</span>
        </div>
      </header>

      {/* Blue hero band */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 flex flex-col items-center text-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-30 scale-150" style={{ backgroundColor: "#fff" }} />
            <div className="relative w-20 h-20 rounded-full bg-white/15 border-2 border-white/40 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-white" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Report Submitted!</h1>
            <p className="text-blue-100 text-[14px] mt-2 max-w-sm mx-auto leading-relaxed">
              Your complaint is logged, AI-triaged, and queued for field dispatch.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4 pb-20">

        {/* Missing data warning */}
        {!hasData && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4">
            <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-amber-800">Response data not received</p>
              <p className="text-[12px] text-amber-600 mt-1 leading-snug">
                The backend may have returned a different response shape. Check the browser console for the
                raw API response on the report page.
              </p>
              <p className="text-[11px] text-slate-400 mt-2 font-mono">
                ticket_id={ticketId ?? "—"} · dept={dept ?? "—"} · score={scoreRaw ?? "—"}
              </p>
            </div>
          </div>
        )}

        {/* ── 2-col info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Ticket ID */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.25)]">
                <Hash size={14} className="text-white" />
              </div>
              <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-blue-500">Ticket ID</p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-4xl font-black text-slate-900 tabular-nums leading-none font-mono">
                #{ticketId ?? "—"}
              </p>
              {ticketId && <CopyBtn text={ticketId} />}
            </div>
            <p className="text-[11px] text-slate-400 mt-3">Save this to track your complaint.</p>
          </div>

          {/* Department */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.25)]">
                <Building2 size={14} className="text-white" />
              </div>
              <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-blue-500">Routed To</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                <Building2 size={22} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[20px] font-black text-slate-900 leading-tight">{dept ?? "—"}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Identified by AI</p>
              </div>
            </div>
          </div>
        </div>

        {/* Severity */}
        {score !== null && (
          <div className="rounded-2xl border p-5" style={{ backgroundColor: sev.bg, borderColor: sev.border }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${sev.fill}20` }}>
                <Flame size={15} style={{ color: sev.fill }} />
              </div>
              <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase" style={{ color: sev.text }}>
                Severity Score
              </p>
            </div>
            <div className="flex items-end justify-between mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tabular-nums leading-none font-mono" style={{ color: sev.fill }}>
                  <Counter to={score} />
                </span>
                <span className="text-xl font-semibold text-slate-400">/10</span>
              </div>
              <span className="text-[12px] font-black px-3.5 py-1.5 rounded-full border font-mono"
                style={{ color: sev.text, borderColor: sev.border, backgroundColor: `${sev.fill}15` }}>
                {sev.label}
              </span>
            </div>
            <SevBar score={score} fill={sev.fill} />
            <p className="text-[12px] mt-3 leading-snug" style={{ color: sev.text }}>
              {score >= 8  ? "⚡ Flagged as urgent — expedited dispatch."
              : score >= 6 ? "📋 Standard SLA — team notified."
              :              "🕐 Logged — team will schedule a response."}
            </p>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.25)]">
              <ChevronRight size={15} className="text-white" />
            </div>
            <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-blue-500">What Happens Next</p>
          </div>
          <div className="space-y-0">
            {steps.map(({ icon: Icon, label, detail, done }, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center z-10 transition-all
                    ${done
                      ? "bg-emerald-500 border-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                      : "bg-white border-slate-200"
                    }`}>
                    <Icon size={15} className={done ? "text-white" : "text-slate-300"} />
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-px flex-1 my-1 ${done ? "bg-emerald-200" : "bg-slate-100"}`} style={{ minHeight: "20px" }} />
                  )}
                </div>
                <div className="pb-5 min-w-0">
                  <p className={`text-[14px] font-bold leading-tight ${done ? "text-slate-900" : "text-slate-400"}`}>
                    {label}
                  </p>
                  <p className={`text-[12px] mt-0.5 leading-snug ${done ? "text-slate-500" : "text-slate-300"}`}>
                    {detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => router.push("/report")}
            className="flex items-center justify-center gap-2 rounded-2xl py-3.5 border border-slate-200 bg-white text-[13px] font-bold text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm">
            <RotateCcw size={14} /> New Report
          </button>
          <button type="button" onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 rounded-2xl py-3.5 bg-blue-600 text-[13px] font-bold text-white hover:bg-blue-700 active:scale-[0.98] transition-all shadow-[0_4px_16px_rgba(37,99,235,0.3)]">
            <Home size={14} /> Home <ArrowRight size={13} />
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-300 pt-2">
          CivicFix India · AI Triage · Encrypted · India Data Residency
        </p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-slate-400 font-medium">Loading confirmation…</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}