"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin, LayoutDashboard, Ticket, Users, Settings,
  ChevronRight, Shield,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/ticket",   icon: Ticket,          label: "Tickets"   },
  { href: "/workers",   icon: Users,           label: "Workers"   },
  { href: "/settings",  icon: Settings,        label: "Settings"  },
];

export default function AdminSidebar() {
  const path = usePathname();

  return (
    <>
      {/* ── Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-[#0f172a] border-r border-white/[0.06] z-40">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_16px_rgba(37,99,235,0.4)] flex-shrink-0">
            <MapPin size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[14px] font-black text-white leading-none">CivicFix</p>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-blue-400/80 leading-none mt-0.5">Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-600 px-3 mb-3">Navigation</p>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = path.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 group
                  ${active
                    ? "bg-blue-600 text-white shadow-[0_2px_12px_rgba(37,99,235,0.4)]"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  }`}>
                <Icon size={16} className={active ? "text-white" : "text-slate-500 group-hover:text-slate-300"} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={13} className="text-blue-200" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-900 border border-blue-700 flex items-center justify-center">
              <Shield size={14} className="text-blue-400" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-white leading-none">Admin User</p>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">Ops · Full access</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0f172a] border-t border-white/[0.08] flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all
                ${active ? "text-blue-400" : "text-slate-600"}`}>
              <Icon size={20} />
              <span className="text-[9px] font-bold tracking-wide uppercase">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}