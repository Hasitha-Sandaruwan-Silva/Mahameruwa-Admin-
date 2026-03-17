import { ReactNode } from "react";
import { AuthGuard } from "../components/AuthGuard";
import { Sidebar } from "../components/layout/Sidebar";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Navbar />
          <main className="flex-1 px-6 py-4">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
          <Footer />
        </div>
      </div>
    </AuthGuard>
  );
}

