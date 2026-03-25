import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicFix India — Report a Civic Issue",
  description:
    "Submit municipal complaints instantly. AI-powered triage routes your report to the right department in under 2 seconds.",
  keywords: ["civic", "india", "municipal", "complaint", "grievance", "AI"],
  authors: [{ name: "CivicFix India" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans antialiased bg-[#f8fafc] text-[#0f172a]">
        {children}
      </body>
    </html>
  );
}