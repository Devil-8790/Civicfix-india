"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  MapPin, CheckCircle2, Navigation, Clock, LogOut, 
  Camera, AlertCircle, Loader2, ChevronRight, X, UploadCloud, Ruler 
} from "lucide-react";

// --- Types ---
interface Job {
  id: number;
  department: string;
  severity_score: number;
  latitude: string;
  longitude: string;
  description: string;
  status: string;
  created_at: string;
  original_image_url?: string;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");

export default function WorkerJobsPage() {
  const router = useRouter();
  const [workerId, setWorkerId] = useState<string>("");
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // --- NEW: Dynamic Completed Counter ---
  const [completedCount, setCompletedCount] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Action states
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [resolving, setResolving] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  
  // Dimension States
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Authenticate & Fetch Jobs
  useEffect(() => {
    const id = localStorage.getItem("civicfix_worker_id");
    if (!id) {
      router.push("/");
      return;
    }
    setWorkerId(id);
    fetchJobs();
  }, [router]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/tickets`);
      if (!res.ok) throw new Error("Failed to connect to dispatch server");
      const data = await res.json();
      
      const activeJobs = Array.isArray(data) 
        ? data.filter(t => t.status === "In Progress" || t.status === "Open")
        : [];
        
      // --- NEW: Calculate already resolved jobs from the DB ---
      const resolvedJobs = Array.isArray(data)
        ? data.filter(t => t.status === "Resolved" || t.status === "Closed")
        : [];
        
      setJobs(activeJobs);
      setCompletedCount(resolvedJobs.length);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("civicfix_worker_id");
    router.push("/");
  };

  const openGoogleMaps = (lat: string, lng: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  };

  const closeSheet = () => {
    setSelectedJob(null);
    setProofFile(null);
    setLength("");
    setWidth("");
    setDepth("");
  };

  // 3. Live API Feature: Proof of Work Resolution
  const handleResolveSubmit = async () => {
    if (!selectedJob || !proofFile) return;
    
    if (!length || !width || !depth) {
      alert("Please enter the repair dimensions.");
      return;
    }

    setResolving(true);
    
    try {
      const formData = new FormData();
      formData.append("file", proofFile); 
      formData.append("worker_id", workerId);
      formData.append("claimed_length_meters", length);
      formData.append("claimed_width_meters", width);
      formData.append("claimed_depth_meters", depth);

      const res = await fetch(`${API_BASE}/dispatch/${selectedJob.id}/resolve`, { 
        method: 'POST', 
        body: formData 
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${errorText}`);
      }
      
      setJobs(prev => prev.filter(j => j.id !== selectedJob.id));
      
      // --- NEW: Increment the counter immediately on success ---
      setCompletedCount(prev => prev + 1);
      
      closeSheet();
      alert("Job marked as resolved! Dispatch has been notified.");
      
    } catch (err) {
      console.error(err);
      alert("Failed to resolve job. Check console for details.");
    } finally {
      setResolving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 pb-24 font-sans animate-slide-up">
      
      {/* App Header */}
      <header className="bg-blue-600 text-white pt-12 pb-6 px-6 rounded-b-3xl shadow-lg sticky top-0 z-30">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[12px] font-bold tracking-widest uppercase text-blue-200 mb-1">Active Duty</p>
            <h1 className="text-2xl font-black tracking-tight">{workerId || "Worker"}</h1>
            <p className="text-[13px] text-blue-100 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online & Tracking
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 bg-blue-700/50 hover:bg-blue-800 rounded-full flex items-center justify-center transition-colors"
          >
            <LogOut size={18} className="text-blue-100" />
          </button>
        </div>
      </header>

      {/* KPI Row */}
      <div className="flex gap-4 px-6 mt-6">
        <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Jobs</p>
          <p className="text-3xl font-black text-slate-800">{jobs.length}</p>
        </div>
        <div className="flex-1 bg-emerald-500 rounded-2xl p-4 shadow-sm shadow-emerald-500/20 text-white">
          <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider mb-1">Completed</p>
          {/* --- NEW: Dynamic variable injected here --- */}
          <p className="text-3xl font-black">{completedCount}</p>
        </div>
      </div>

      {/* Jobs List */}
      <div className="px-6 mt-8 space-y-4">
        <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
          <Clock size={16} className="text-blue-500" /> Current Assignments
        </h2>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 size={32} className="animate-spin text-blue-500 mb-3" />
            <p className="text-slate-500 text-sm font-medium">Syncing with Dispatch...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-red-700">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-800">Queue Clear!</h3>
            <p className="text-sm text-slate-500 mt-2">Take a break. Dispatch will notify you when a new issue arises.</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div 
              key={job.id} 
              onClick={() => setSelectedJob(job)}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                    ${job.severity_score >= 8 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    Priority {job.severity_score}/10
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">#{job.id}</span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </div>
              
              <h3 className="text-[16px] font-bold text-slate-900 leading-tight mb-2">{job.department} Issue</h3>
              
              <div className="flex items-center gap-4 text-[12px] font-semibold text-slate-500">
                <span className="flex items-center gap-1"><MapPin size={14} className="text-slate-400" /> {parseFloat(job.latitude).toFixed(3)}°N</span>
                <span className="flex items-center gap-1"><Clock size={14} className="text-slate-400" /> {job.status}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- SLIDE-UP BOTTOM SHEET (Job Details) --- */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up flex flex-col">
            
            {/* Sheet Handle */}
            <div className="w-full flex justify-center pt-3 pb-2" onClick={closeSheet}>
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>

            <div className="px-6 pb-8 pt-2">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Ticket #{selectedJob.id}</h2>
                  <p className="text-[14px] text-blue-600 font-bold mt-1">{selectedJob.department}</p>
                </div>
                <button onClick={closeSheet} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-8">
                <button 
                  onClick={() => openGoogleMaps(selectedJob.latitude, selectedJob.longitude)}
                  className="flex-1 bg-slate-900 text-white flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[14px] active:scale-95 transition-transform"
                >
                  <Navigation size={18} /> Navigate
                </button>
              </div>

              {/* Issue Details */}
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Citizen Report</p>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[14px] text-slate-700 leading-relaxed">
                    {selectedJob.description || "No description provided."}
                  </div>
                </div>

                {selectedJob.original_image_url && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Attached Photo</p>
                    <img src={selectedJob.original_image_url} alt="Issue" className="w-full h-48 object-cover rounded-2xl border border-slate-200" />
                  </div>
                )}

                {/* Resolution Zone */}
                <div className="border-t border-slate-200 pt-6 mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Ruler size={18} className="text-blue-500" />
                    <h3 className="text-lg font-black text-slate-900">Repair Dimensions</h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Length (m)</label>
                      <input 
                        type="number" step="0.1" value={length} onChange={(e) => setLength(e.target.value)} placeholder="0.0"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-[14px] font-bold text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Width (m)</label>
                      <input 
                        type="number" step="0.1" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="0.0"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-[14px] font-bold text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Depth (m)</label>
                      <input 
                        type="number" step="0.1" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="0.0"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-[14px] font-bold text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  />

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full flex items-center justify-center gap-2 py-5 border-2 border-dashed rounded-2xl transition-colors mb-4
                      ${proofFile ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                  >
                    {proofFile ? (
                      <><CheckCircle2 size={24} /> <span className="font-bold text-[15px]">Photo Attached</span></>
                    ) : (
                      <><Camera size={24} /> <span className="font-bold text-[15px]">Take Proof Photo</span></>
                    )}
                  </button>

                  <button 
                    disabled={resolving || !proofFile || !length || !width || !depth}
                    onClick={handleResolveSubmit}
                    className={`w-full py-4 rounded-2xl font-black text-[15px] flex items-center justify-center gap-2 transition-all
                      ${(!proofFile || !length || !width || !depth)
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-emerald-500 text-white active:scale-95 shadow-lg shadow-emerald-500/30'}`}
                  >
                    {resolving ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                    {resolving ? "Updating Dispatch..." : "Submit Resolution"}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </main>
  );
}