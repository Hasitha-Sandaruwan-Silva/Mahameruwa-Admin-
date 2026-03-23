"use client";

import { ReactNode, useState, useEffect } from "react";
import { AuthGuard } from "../components/AuthGuard";
import { Sidebar } from "../components/layout/Sidebar";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
        <Sidebar />

        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <Navbar />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </AuthGuard>
  );
}