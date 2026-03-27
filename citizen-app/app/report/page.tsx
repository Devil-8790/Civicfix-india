"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin, Camera, Mic, MicOff, UploadCloud, X, AlertCircle,
  Loader2, CheckCircle2, ChevronRight, Navigation2, LocateFixed,
  WifiOff, Zap, ShieldCheck, ArrowLeft,
} from "lucide-react";

const LocationPicker = dynamic(() => import("../../components/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-[250px] w-full bg-slate-100 animate-pulse rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 text-sm">Loading map...</div>
});

interface ApiResponse {
  ticket_id?: number; id?: number;
  ai_analysis?: { department?: string; severity_score?: number };
  analysis?:     { department?: string; severity_score?: number; dept?: string; score?: number };
  department?: string; severity_score?: number; dept?: string; score?: number;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");
const MAX_MB   = 10;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function extractFields(d: ApiResponse) {
  return {
    ticketId: d.ticket_id ?? d.id ?? 0,
    dept:  d.ai_analysis?.department  ?? d.analysis?.department  ?? d.analysis?.dept  ?? d.department ?? d.dept ?? "General",
    score: d.ai_analysis?.severity_score ?? d.analysis?.severity_score ?? d.analysis?.score ?? d.severity_score ?? d.score ?? 0,
  };
}

type LocState = "idle" | "loading" | "success" | "error";
type MicState = "idle" | "listening" | "unsupported";

function StepBadge({ n, label, done }: { n: number; label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 transition-all duration-300 ${
        done ? "bg-emerald-500 text-white shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
             : "bg-blue-600 text-white shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
      }`}>
        {done ? <CheckCircle2 size={13} /> : n}
      </div>
      <span className="text-[13px] font-semibold text-slate-700 hidden sm:block">{label}</span>
    </div>
  );
}

function FieldCard({
  icon: Icon, title, subtitle, done, children,
}: { icon: React.ElementType; title: string; subtitle: string; done?: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(37,99,235,0.25)]">
          <Icon size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-slate-900">{title}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        {done && (
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
            <CheckCircle2 size={11} className="text-emerald-600" />
            <span className="text-[10px] font-bold text-emerald-700">Done</span>
          </div>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [file, setFile]               = useState<File | null>(null);
  const [preview, setPreview]         = useState<string | null>(null);
  const [lat, setLat]                 = useState("");
  const [lng, setLng]                 = useState("");
  const [address, setAddress]         = useState(""); 
  
  const [locState, setLocState]       = useState<LocState>("idle");
  const [micState, setMicState]       = useState<MicState>("idle");
  const [submitting, setSubmitting]   = useState(false);
  const [submitErr, setSubmitErr]     = useState<string | null>(null);
  const [fileErr, setFileErr]         = useState<string | null>(null);
  const [dragOver, setDragOver]       = useState(false);
  const [mounted, setMounted]         = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const recRef  = useRef<any>(null);

  useEffect(() => setMounted(true), []);

  const s1 = !!file;
  const s2 = description.trim().length > 5;
  const s3 = !!(lat && lng);

  const applyFile = useCallback((f: File | null) => {
    setFileErr(null);
    if (!f) return;
    if (!ACCEPTED.includes(f.type))          { setFileErr("Please upload JPEG, PNG, WEBP or GIF."); return; }
    if (f.size > MAX_MB * 1024 * 1024)       { setFileErr(`File must be under ${MAX_MB} MB.`); return; }
    setFile(f);
    const r = new FileReader();
    r.onload = (e) => setPreview(e.target?.result as string);
    r.readAsDataURL(f);
  }, []);

  const removeFile = () => { setFile(null); setPreview(null); setFileErr(null); if (fileRef.current) fileRef.current.value = ""; };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); applyFile(e.dataTransfer.files?.[0] ?? null); };

  const grabLoc = () => {
    if (!navigator.geolocation) { setLocState("error"); return; }
    setLocState("loading");
    navigator.geolocation.getCurrentPosition(
      (p) => { setLat(String(p.coords.latitude)); setLng(String(p.coords.longitude)); setLocState("success"); },
      ()  => setLocState("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapSelect = (newLat: string, newLng: string) => {
    setLat(newLat);
    setLng(newLng);
    setLocState("success");
  };

  const toggleMic = useCallback(() => {
    const SR = typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
    if (!SR) { setMicState("unsupported"); setTimeout(() => setMicState("idle"), 3000); return; }
    
    if (micState === "listening") { recRef.current?.stop(); setMicState("idle"); return; }
    
    const rec = new SR();
    rec.lang = "en-IN"; 
    rec.continuous = true; 
    rec.interimResults = true; 

    let finalTranscript = description ? description + " " : "";

    rec.onresult = (ev: any) => {
      let interim = "";
      let final = "";
      for (let i = ev.resultIndex; i < ev.results.length; ++i) {
        if (ev.results[i].isFinal) final += ev.results[i][0].transcript;
        else interim += ev.results[i][0].transcript;
      }
      setDescription((finalTranscript + final + " " + interim).trim());
      if (final) finalTranscript += final + " ";
    };

    rec.onerror = () => setMicState("idle");
    rec.onend   = () => setMicState("idle");
    recRef.current = rec; rec.start(); setMicState("listening");
  }, [micState, description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErr(null);
    if (!description.trim()) { setSubmitErr("Please describe the issue."); return; }

    const fd = new FormData();
    if (file) fd.append("file", file);
    fd.append("description", description.trim());
    fd.append("latitude",  lat || "0");
    fd.append("longitude", lng || "0");
    if (address.trim()) fd.append("reported_address", address.trim());

    setSubmitting(true);
    try {
      const res  = await fetch(`${API_BASE}/ingest/submit`, { method: "POST", body: fd });
      const text = await res.text();

      let raw: ApiResponse;
      try { raw = JSON.parse(text); }
      catch { throw new Error(`Non-JSON response (HTTP ${res.status}): ${text.slice(0, 200)}`); }

      if (!res.ok) {
        const d = (raw as any)?.detail ?? (raw as any)?.message;
        throw new Error(typeof d === "string" ? d : `HTTP ${res.status}`);
      }

      const { ticketId, dept, score } = extractFields(raw);
      router.push(`/success?ticket_id=${ticketId}&dept=${encodeURIComponent(dept)}&score=${score}`);
    } catch (err) {
      setSubmitErr(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#f8fafc] transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors">
              <ArrowLeft size={16} />
              <span className="text-[13px] font-medium hidden sm:block">Home</span>
            </Link>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
                <MapPin size={15} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[13px] font-black text-slate-900 leading-none">CivicFix</p>
                <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-blue-500 leading-none mt-0.5">India</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <StepBadge n={1} label="Photo"    done={s1} />
            <div className="w-4 sm:w-6 h-px bg-slate-200" />
            <StepBadge n={2} label="Describe" done={s2} />
            <div className="w-4 sm:w-6 h-px bg-slate-200" />
            <StepBadge n={3} label="Location" done={s3} />
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 hidden sm:block">Live</span>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-3 py-1 mb-4">
            <Zap size={11} className="text-yellow-300" />
            <span className="text-[11px] font-bold tracking-wider uppercase">AI-Powered Triage</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Report a Civic Issue
          </h1>
          <p className="text-blue-100 text-[14px] mt-2 max-w-lg leading-relaxed">
            Fill in the details below. Our AI will identify the department and severity score
            and route your complaint in under 2 seconds.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <div className="space-y-5">
            <FieldCard icon={Camera} title="Photo Evidence" subtitle="Attach a photo of the issue" done={s1}>
              <input ref={fileRef} type="file" accept={ACCEPTED.join(",")} className="hidden"
                onChange={(e) => applyFile(e.target.files?.[0] ?? null)} />

              {preview ? (
                <div className="space-y-3">
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200">
                    <img src={preview} alt="Preview" className="w-full h-52 object-cover" />
                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-1.5 bg-white text-slate-800 text-[12px] font-bold px-4 py-2 rounded-xl transition-colors hover:bg-slate-50">
                        <UploadCloud size={13} /> Replace
                      </button>
                      <button type="button" onClick={removeFile}
                        className="flex items-center gap-1.5 bg-red-500 text-white text-[12px] font-bold px-4 py-2 rounded-xl transition-colors hover:bg-red-600">
                        <X size={13} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-4 h-52 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 select-none group
                    ${dragOver ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/50"}`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${dragOver ? "bg-blue-100 scale-105" : "bg-slate-100 group-hover:bg-blue-100"}`}>
                    <UploadCloud size={28} className={`transition-colors ${dragOver ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                      {dragOver ? "Drop to attach" : "Tap to add photo"}
                    </p>
                  </div>
                </div>
              )}
            </FieldCard>

            <FieldCard icon={MapPin} title="Location" subtitle="Click map to drop pin or use GPS" done={s3}>
              <button type="button" onClick={grabLoc} disabled={locState === "loading"}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3.5 border text-[13px] font-semibold transition-all duration-200 group mb-4
                  ${locState === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : locState === "error"   ? "border-red-200 bg-red-50 text-red-600"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  }`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
                  ${locState === "success" ? "bg-emerald-100"
                  : locState === "error"   ? "bg-red-100"
                  : "bg-slate-100 group-hover:bg-blue-100"}`}>
                  {locState === "loading" ? <Loader2 size={16} className="animate-spin text-blue-600" />
                  : locState === "success" ? <LocateFixed size={16} className="text-emerald-600" />
                  : locState === "error"   ? <WifiOff size={16} className="text-red-500" />
                  : <Navigation2 size={16} className="text-slate-500 group-hover:text-blue-600 transition-colors" />}
                </div>
                <span className="flex-1 text-left">
                  {locState === "idle"    && "Use Current Location"}
                  {locState === "loading" && "Acquiring GPS signal…"}
                  {locState === "success" && `${parseFloat(lat).toFixed(5)}°N,  ${parseFloat(lng).toFixed(5)}°E`}
                  {locState === "error"   && "GPS unavailable — pick on map"}
                </span>
              </button>

              <div className="mb-4">
                <label className="block text-[10px] font-extrabold tracking-[0.18em] uppercase text-slate-400 mb-1.5">
                  Street Address / Landmark (Optional)
                </label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., Near SVIT College Main Gate"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <LocationPicker lat={lat} lng={lng} onLocationSelect={handleMapSelect} />
            </FieldCard>
          </div>

          <div className="space-y-5">
            <FieldCard icon={Mic} title="Describe the Issue" subtitle="Type or use voice input" done={s2}>
              <div className="relative border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the problem clearly — what it is, exactly where, how long it has been there, and how it is affecting people…"
                  rows={6}
                  maxLength={500}
                  required
                  className="w-full bg-slate-50 p-4 pr-16 text-[14px] text-slate-800 placeholder-slate-400 resize-none outline-none leading-relaxed font-sans"
                />
                <button type="button" onClick={toggleMic}
                  className={`absolute right-3 top-3 w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200
                    ${micState === "listening" ? "bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse"
                    : micState === "unsupported" ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300"
                    }`}>
                  {micState === "listening" ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>
              <div className="flex items-center justify-between pt-3">
                <div className="text-[11px]">
                  {micState === "listening"   && <span className="text-red-500 font-bold tracking-wide uppercase">Listening... speak now</span>}
                  {micState === "unsupported" && <span className="text-slate-400">Voice not supported here</span>}
                  {micState === "idle"        && <span className="text-slate-400 flex items-center gap-1.5"><Mic size={11} />Tap mic to dictate</span>}
                </div>
                <span className={`text-[11px] tabular-nums font-semibold ${description.length > 450 ? "text-amber-500" : "text-slate-300"}`}>
                  {description.length}/500
                </span>
              </div>
            </FieldCard>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Zap size={13} className="text-white" />
                </div>
                <p className="text-[12px] font-extrabold tracking-[0.16em] uppercase text-blue-700">How AI Triage Works</p>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Camera,      text: "Photo & text analysed by AI model" },
                  { icon: MapPin,      text: "Department automatically identified" },
                  { icon: Zap,         text: "Severity scored 1–10 for priority" },
                  { icon: ShieldCheck, text: "Routed to the right field supervisor" },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={13} className="text-blue-600" />
                    </div>
                    <p className="text-[13px] text-blue-800 leading-snug pt-1">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {submitErr && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-4">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={15} className="text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-red-700">Submission Failed</p>
                  <p className="text-[12px] text-red-500 mt-1 leading-snug break-words font-mono">{submitErr}</p>
                </div>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className={`relative w-full flex items-center justify-center gap-3 rounded-2xl py-4 font-black text-[15px] tracking-wide transition-all duration-200 overflow-hidden
                ${submitting
                  ? "bg-blue-200 text-blue-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-[0_4px_20px_rgba(37,99,235,0.35)]"
                }`}>
              {submitting
                ? <><Loader2 size={18} className="animate-spin" /><span>Sending to AI Triage…</span></>
                : <><span>Submit Report</span><div className="w-7 h-7 rounded-xl bg-blue-500/50 flex items-center justify-center"><ChevronRight size={15} /></div></>
              }
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}