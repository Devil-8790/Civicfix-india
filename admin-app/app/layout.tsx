import type { Metadata, Viewport } from "next";
import "./globals.css";
import AdminSidebar from "@/components/AdminSidebar";

export const metadata: Metadata = {
  title: "CivicFix Admin — Operations Dashboard",
  description: "Municipal operations dashboard — ticket triage, worker dispatch, and live field map.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans antialiased bg-[#f8fafc] text-[#0f172a] flex min-h-screen">
        {/* Fixed sidebar */}
        <AdminSidebar />
        {/* Main content — offset by sidebar width on md+ */}
        <div className="flex-1 md:ml-60 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}