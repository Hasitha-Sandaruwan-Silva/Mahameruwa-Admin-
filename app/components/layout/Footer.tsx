export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/80 px-6 py-4 text-xs text-slate-500 backdrop-blur-md shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          <span className="font-medium text-slate-600">
            © {new Date().getFullYear()} Mahameruwa Hospitality System
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <span className="hidden h-4 w-px bg-slate-300 sm:block" />
          <span className="hidden sm:inline font-medium tracking-wide">
            Staff Admin Dashboard
          </span>
        </div>
      </div>
    </footer>
  );
}