import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicFix Field Ops",
  description: "Mobile command center for municipal field workers.",
};

// 🚨 CRITICAL FOR MOBILE UX: 
// maximumScale: 1 prevents the annoying auto-zoom on iOS/Android text inputs
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
  userScalable: false,
  themeColor: "#2563eb", // Matches the blue header for a seamless status bar
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-100 text-slate-900 selection:bg-blue-200 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}