import Link from "next/link";
import './globals.css';
import {
  MapPin,
  Zap,
  ShieldCheck,
  ArrowRight,
  Building2,
  Droplets,
  Lightbulb,
  Trash2,
  Construction,
  TreePine,
} from "lucide-react";

const DEPARTMENTS = [
  { icon: Trash2,        label: "Sanitation",  color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { icon: Construction,  label: "Roads",       color: "bg-amber-50 text-amber-600 border-amber-200" },
  { icon: Droplets,      label: "Drainage",    color: "bg-cyan-50 text-cyan-600 border-cyan-200" },
  { icon: Lightbulb,     label: "Electricity", color: "bg-yellow-50 text-yellow-600 border-yellow-200" },
  { icon: Building2,     label: "Water",       color: "bg-blue-50 text-blue-600 border-blue-200" },
  { icon: TreePine,      label: "Parks",       color: "bg-green-50 text-green-600 border-green-200" },
];

const STATS = [
  { value: "12,400+", label: "Issues resolved" },
  { value: "< 2s",    label: "AI triage speed" },
  { value: "18",      label: "Departments covered" },
  { value: "98%",     label: "Routing accuracy" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.35)]">
              <MapPin size={17} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[15px] font-black tracking-tight text-slate-900 leading-none">CivicFix</p>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-blue-500 leading-none mt-0.5">India</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System Online
            </span>
            <Link
              href="/report"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold px-4 py-2 rounded-xl transition-colors shadow-[0_2px_8px_rgba(37,99,235,0.3)]"
            >
              Report Issue
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white">
        {/* Geometric decoration */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-16 -right-8 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-blue-500/30" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-3 py-1.5 mb-6 backdrop-blur-sm">
              <Zap size={12} className="text-yellow-300" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-white/90">
                AI-Powered Municipal Triage
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-5">
              Your City.<br />
              <span className="text-blue-200">Your Voice.</span>
            </h1>
            <p className="text-[16px] sm:text-[18px] text-blue-100 leading-relaxed max-w-lg mb-8">
              Report civic issues — potholes, broken streetlights, drainage overflow — and
              our AI routes your complaint to the right department instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/report"
                className="inline-flex items-center justify-center gap-2.5 bg-white text-blue-700 hover:bg-blue-50 font-black text-[15px] px-7 py-3.5 rounded-2xl transition-all shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.25)] active:scale-[0.98]"
              >
                <MapPin size={17} strokeWidth={2.5} />
                Report an Issue
              </Link>
              <span className="inline-flex items-center justify-center gap-2 border border-white/30 text-white/80 hover:text-white hover:border-white/50 font-semibold text-[14px] px-6 py-3.5 rounded-2xl transition-all cursor-default">
                <ShieldCheck size={16} />
                Anonymous & Encrypted
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100">
            {STATS.map(({ value, label }) => (
              <div key={label} className="py-8 px-6 text-center">
                <p className="text-3xl font-black text-blue-600 tabular-nums">{value}</p>
                <p className="text-[12px] text-slate-500 font-medium mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-3">How It Works</p>
          <h2 className="text-3xl font-black text-slate-900">From report to resolution</h2>
          <p className="text-[15px] text-slate-500 mt-3 max-w-md mx-auto">
            Three steps. Under two seconds for AI triage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Submit Your Report",
              desc: "Photo, description, and GPS location. Takes under 60 seconds.",
              icon: MapPin,
              color: "bg-blue-600",
            },
            {
              step: "02",
              title: "AI Triage",
              desc: "Our model identifies the department and scores severity in under 2 seconds.",
              icon: Zap,
              color: "bg-blue-700",
            },
            {
              step: "03",
              title: "Dispatch & Resolve",
              desc: "A field worker is assigned and dispatched. You get a ticket ID to track.",
              icon: ShieldCheck,
              color: "bg-blue-800",
            },
          ].map(({ step, title, desc, icon: Icon, color }) => (
            <div key={step} className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(37,99,235,0.25)]`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase text-blue-400">{step}</span>
                  <h3 className="text-[16px] font-bold text-slate-900 mt-0.5">{title}</h3>
                  <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Departments ─────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-2">Coverage</p>
            <h2 className="text-2xl font-black text-slate-900">Departments we route to</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {DEPARTMENTS.map(({ icon: Icon, label, color }) => (
              <div key={label} className={`flex flex-col items-center gap-3 p-4 rounded-2xl border ${color} transition-transform hover:-translate-y-0.5`}>
                <Icon size={24} />
                <span className="text-[12px] font-bold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/8" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/8" />
          </div>
          <h2 className="relative text-3xl sm:text-4xl font-black mb-4">
            See something broken?<br />
            <span className="text-blue-200">Say something.</span>
          </h2>
          <p className="relative text-blue-100 text-[15px] mb-8 max-w-md mx-auto">
            Your report takes under a minute. Our AI handles the rest.
          </p>
          <Link
            href="/report"
            className="relative inline-flex items-center gap-2.5 bg-white text-blue-700 hover:bg-blue-50 font-black text-[15px] px-8 py-3.5 rounded-2xl transition-all shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:scale-[0.98]"
          >
            <MapPin size={17} strokeWidth={2.5} />
            Start a Report
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <MapPin size={13} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[13px] font-bold text-slate-700">CivicFix India</span>
          </div>
          <p className="text-[12px] text-slate-400 text-center">
            Data encrypted in transit · India data residency · Reports are anonymous
          </p>
        </div>
      </footer>
    </div>
  );
}