"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react"; // 1. useState සහ useEffect එකතු කරන්න
import toast from "react-hot-toast";
import { authStorage } from "../../../utils/auth";

export function Navbar() {
  const router = useRouter();
  
  // 2. Client-side එකේ mount වුණාද කියලා බලන්න state එකක්
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 3. User logic එක ඒ විදියටම තියන්න (හැබැයි mounted වුණාම විතරක් පාවිච්චි කරන්න)
  const user = typeof window !== "undefined" ? authStorage.getUser() : null;

  const handleLogout = () => {
    authStorage.clear();
    toast.success("Signed out");
    router.push("/auth/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white/70 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="font-medium text-slate-800">Staff Portal</span>
      </div>
      <div className="flex items-center gap-4">
        {/* 4. Mounted නම් විතරක් User details පෙන්වන්න (Hydration error එක නවත්වන්නේ මෙතනින්) */}
        {mounted && user && (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
              {user.name?.[0]?.toUpperCase() ?? "S"}
            </div>
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="font-medium text-slate-900">{user.name}</span>
              <span className="text-xs text-slate-500">{user.role}</span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Sign out
        </button>
        <Link
          href="/settings"
          className="hidden text-xs font-medium text-slate-500 hover:text-slate-900 sm:inline"
        >
          Settings
        </Link>
      </div>
    </header>
  );
}