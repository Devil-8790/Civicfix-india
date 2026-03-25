"use client";

import { Save, User, Bell, Shield, Database, Sliders } from "lucide-react";

export default function SettingsPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-[13px] text-slate-500 mt-1">Configure your command center, AI behaviors, and notification preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation Sidebar for Settings */}
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 font-bold text-[13px] rounded-xl border border-blue-100 transition-colors">
            <Sliders size={16} /> General Preferences
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 font-semibold text-[13px] hover:bg-slate-100 rounded-xl transition-colors">
            <User size={16} /> Account Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 font-semibold text-[13px] hover:bg-slate-100 rounded-xl transition-colors">
            <Bell size={16} /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 font-semibold text-[13px] hover:bg-slate-100 rounded-xl transition-colors">
            <Shield size={16} /> Security & Access
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 font-semibold text-[13px] hover:bg-slate-100 rounded-xl transition-colors">
            <Database size={16} /> Database Backups
          </button>
        </div>

        {/* Settings Form Canvas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-[15px] font-bold text-slate-900">AI Triage & Dispatch Options</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-bold text-slate-900">Enable Auto-Dispatch for Critical Issues</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">Automatically assign workers to tickets with a severity score ≥ 8.</p>
                </div>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer shadow-inner">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100"></div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-bold text-slate-900">SMS Alerts for Dispatchers</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">Send a text message when a new high-priority issue is ingested.</p>
                </div>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer shadow-inner">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100"></div>

              <div>
                <label className="block text-[12px] font-bold tracking-wider uppercase text-slate-500 mb-2">
                  Default City Zone
                </label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-800 outline-none focus:border-blue-500">
                  <option>Secunderabad Central</option>
                  <option>Hyderabad East</option>
                  <option>Cyberabad Tech Park</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-[13px] shadow-md hover:bg-blue-700 transition-colors">
              <Save size={16} /> Save Preferences
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}