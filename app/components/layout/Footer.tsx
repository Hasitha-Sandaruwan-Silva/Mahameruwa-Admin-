export function Footer() {
  return (
    <footer className="border-t bg-white/70 px-6 py-3 text-xs text-slate-500 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span>© {new Date().getFullYear()} Mahameruwa Hospitality System</span>
        <span className="hidden sm:inline">Staff Admin Dashboard</span>
      </div>
    </footer>
  );
}

