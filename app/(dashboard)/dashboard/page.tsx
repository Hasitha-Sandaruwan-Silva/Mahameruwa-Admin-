"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";
import { QUERY_KEYS } from "../../../utils/constants";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion"; 
import { 
  BedDouble, 
  CalendarCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  ChevronRight,
  LayoutDashboard,
  Wallet,
  ArrowUpRight,
  Zap,
  Activity
} from "lucide-react"; 

interface DashboardStats {
  total_rooms: number;
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  occupancy_rate: number;
  estimated_revenue: number;
  recent_reservations: {
    id: number;
    customer_name: string;
    room_name: string;
    status: string;
    check_in: string;
  }[];
  recent_orders: {
    id: number;
    customer_name: string;
    room_name: string;
    status: string;
  }[];
}

interface ApiResponse {
  success: boolean;
  data: DashboardStats;
}

const STATUS_THEMES: Record<string, string> = {
  Pending:   "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
  Confirmed: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200",
  Cancelled: "bg-rose-50 text-rose-600 ring-1 ring-rose-200",
};

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse>("/api/staff/dashboard/");
      return res.data.data;
    },
  });

  const statCards = [
    { label: "Rooms",        value: data?.total_rooms ?? 0,          icon: BedDouble,     color: "bg-slate-50 text-slate-600", border: "border-slate-100", href: "/rooms" },
    { label: "Bookings",     value: data?.total_bookings ?? 0,       icon: CalendarCheck, color: "bg-indigo-50 text-indigo-600", border: "border-indigo-100",  href: "/reservations" },
    { label: "Pending",      value: data?.pending_bookings ?? 0,     icon: Clock,         color: "bg-amber-50 text-amber-600", border: "border-amber-100", href: "/reservations" },
    { label: "Confirmed",    value: data?.confirmed_bookings ?? 0,   icon: CheckCircle2,  color: "bg-emerald-50 text-emerald-600", border: "border-emerald-100", href: "/reservations" },
    { label: "Cancelled",    value: data?.cancelled_bookings ?? 0,   icon: XCircle,       color: "bg-rose-50 text-rose-600", border: "border-rose-100",  href: "/reservations" },
    { label: "Occupancy",    value: `${data?.occupancy_rate ?? 0}%`, icon: TrendingUp,    color: "bg-violet-50 text-violet-600", border: "border-violet-100", href: "/rooms" },
  ];

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6 bg-[#FBFCFE] min-h-screen">
      
      {/* --- Elegant Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="h-12 w-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
              <LayoutDashboard size={22} />
           </div>
           <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Mahameruwa Management Cloud</p>
           </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50/50 px-4 py-2 rounded-xl border border-emerald-100">
            <Activity size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Real-time monitoring active</span>
        </div>
      </div>

      {/* --- Revenue & Occupancy --- */}
      <div className="grid lg:grid-cols-12 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-8 relative overflow-hidden rounded-[32px] bg-slate-950 p-8 md:p-10 text-white shadow-2xl shadow-slate-300"
        >
            <div className="relative z-10 flex flex-col h-full justify-between gap-12">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-white/10 backdrop-blur-md">
                       <Zap size={12} fill="currentColor" /> Revenue Stream
                    </div>
                </div>
                <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">Estimated Net Revenue</p>
                    <div className="flex items-baseline gap-3">
                        <span className="text-slate-500 text-2xl font-bold">LKR</span>
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter">
                            {(data?.estimated_revenue ?? 0).toLocaleString()}
                        </h2>
                    </div>
                </div>
                <button 
                    onClick={() => router.push('/reservations')}
                    className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all w-fit group"
                >
                    View Analytics <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
            </div>
            {/* Design Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -ml-20 -mb-20" />
        </motion.div>
        
        <div className="lg:col-span-4 rounded-[32px] border border-white bg-white p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Global Occupancy</p>
                    <TrendingUp size={18} className="text-indigo-500" />
                </div>
                <span className="text-6xl font-black text-slate-900 tracking-tighter">{data?.occupancy_rate ?? 0}%</span>
                <div className="w-full bg-slate-100 h-3 rounded-full mt-8 overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${data?.occupancy_rate ?? 0}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.3)]"
                    />
                </div>
                <div className="grid grid-cols-2 mt-8 pt-8 border-t border-slate-50">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Status</p>
                        <p className="text-sm font-bold text-emerald-600">Optimal</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Growth</p>
                        <p className="text-sm font-bold text-slate-900">+2.4%</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- Stat Cards Grid --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => <div key={i} className="h-24 rounded-[20px] bg-white animate-pulse border border-slate-100" />)
        ) : (
          statCards.map((card, idx) => (
            <motion.div 
              whileHover={{ y: -4 }}
              key={idx}
              onClick={() => router.push(card.href)}
              className={`group p-5 rounded-[24px] border ${card.border} bg-white transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-slate-100`}
            >
              <div className={`h-8 w-8 ${card.color} rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
                 <card.icon size={16} strokeWidth={2.5} />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">{card.value}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mt-0.5">{card.label}</p>
            </motion.div>
          ))
        )}
      </div>

      {/* --- Activity Sections --- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivitySection title="Recent Reservations" onViewAll={() => router.push("/reservations")}>
          {isLoading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-2xl mb-3" />)
          ) : !data?.recent_reservations?.length ? (
            <EmptyState message="No reservations found" />
          ) : (
            <div className="space-y-1">
              {data.recent_reservations.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 uppercase group-hover:bg-white group-hover:shadow-sm transition-all">
                        {r.customer_name[0]}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 tracking-tight">{r.customer_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{r.room_name} • {r.check_in}</p>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </ActivitySection>

        <ActivitySection title="Active Service Orders" onViewAll={() => router.push("/orders")}>
          {isLoading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-2xl mb-3" />)
          ) : !data?.recent_orders?.length ? (
            <EmptyState message="No active orders" />
          ) : (
            <div className="space-y-1">
              {data.recent_orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 group">
                   <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Wallet size={16} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 tracking-tight">{o.customer_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{o.room_name}</p>
                    </div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          )}
        </ActivitySection>
      </div>
    </div>
  );
}

function ActivitySection({ title, children, onViewAll }: { title: string, children: React.ReactNode, onViewAll: () => void }) {
  return (
    <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-7 py-6 border-b border-slate-50">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">{title}</h2>
        <button onClick={onViewAll} className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-lg">
          Records <ChevronRight size={14} />
        </button>
      </div>
      <div className="p-3 flex-1">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${STATUS_THEMES[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
    return <div className="py-12 text-center text-slate-400 text-[11px] font-bold uppercase tracking-widest italic">{message}</div>;
}