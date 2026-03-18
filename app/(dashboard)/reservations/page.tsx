"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "../../utils/api";
import { QUERY_KEYS } from "../../utils/constants";
import { Reservation, Room } from "../../utils/types";
import { ReservationsTable } from "../../components/tables/ReservationsTable";
import { ReservationForm, ReservationFormValues } from "../../components/forms/ReservationForm";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Plus, 
  CalendarDays, 
  X, 
  Filter 
} from "lucide-react";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export default function ReservationsIndexPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Pending" | "Confirmed" | "Cancelled" | "Completed">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.reservations,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Reservation[]>>("/api/staff/reservations/");
      return res.data.data;
    },
  });

  const { data: rooms } = useQuery({
    queryKey: QUERY_KEYS.rooms,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Room[]>>("/api/staff/rooms/");
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: ReservationFormValues) => {
      await apiClient.post<ApiResponse<Reservation>>("/api/staff/reservations/", values);
    },
    onSuccess: () => {
      toast.success("Reservation created successfully");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reservations });
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Failed to create reservation");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: ReservationFormValues }) => {
      await apiClient.put<ApiResponse<Reservation>>(`/api/staff/reservations/${id}/`, values);
    },
    onSuccess: () => {
      toast.success("Reservation updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reservations });
      setEditingReservation(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Failed to update reservation");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (reservation: Reservation) => {
      await apiClient.delete(`/api/staff/reservations/${reservation.id}/`);
    },
    onSuccess: () => {
      toast.success("Reservation deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reservations });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Unable to delete reservation");
    },
  });

  const filteredReservations = useMemo(() => {
    if (!data) return [];
    return data.filter((res) => {
      const searchTerm = search.toLowerCase().trim();
      const matchesSearch = !searchTerm ||
        res.customer_name.toLowerCase().includes(searchTerm) ||
        (res.room_name?.toLowerCase().includes(searchTerm) ?? false) ||
        res.email.toLowerCase().includes(searchTerm);
      
      const matchesStatus = statusFilter === "all" ? true : res.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 bg-white min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
            <CalendarDays size={14} /> Front Desk / Bookings
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reservations</h1>
          <p className="text-slate-500 text-sm font-medium">Manage guest stays, room availability and check-ins.</p>
        </div>
        
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-xl hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <Plus size={18} /> New Reservation
        </button>
      </div>

      {/* Filters & Search Section */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
           {["all", "Pending", "Confirmed", "Cancelled", "Completed"].map((status) => (
             <button
               key={status}
               onClick={() => setStatusFilter(status as any)}
               className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border
                 ${statusFilter === status 
                   ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                   : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"}`}
             >
               {status}
             </button>
           ))}
        </div>

        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, room or email..."
            className="w-full rounded-xl border-2 border-slate-200 bg-white pl-12 pr-4 py-3 text-base font-semibold text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-950 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
        <ReservationsTable
          items={filteredReservations}
          loading={isLoading}
          onEdit={(res) => setEditingReservation(res)}
          onDelete={(res) => {
            if (window.confirm("Are you sure you want to delete this reservation?")) {
              deleteMutation.mutate(res);
            }
          }}
        />
        {!isLoading && (
          <div className="bg-slate-50/50 px-6 py-3 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>{filteredReservations.length} Reservation(s) Found</span>
          </div>
        )}
      </div>

      {/* Modals using AnimatePresence */}
      <AnimatePresence>
        {(isCreateOpen || editingReservation) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setIsCreateOpen(false); setEditingReservation(null); }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-950" />
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {editingReservation ? "Edit Reservation" : "New Reservation"}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Check availability before finalizing.
                  </p>
                </div>
                <button onClick={() => { setIsCreateOpen(false); setEditingReservation(null); }} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <ReservationForm
                  rooms={rooms ?? []}
                  existingReservations={data ?? []}
                  initialValues={editingReservation || undefined}
                  onSubmit={(values) =>
                    editingReservation 
                      ? updateMutation.mutateAsync({ id: editingReservation.id, values })
                      : createMutation.mutateAsync(values)
                  }
                  submitLabel={createMutation.isPending || updateMutation.isPending ? "Processing..." : (editingReservation ? "Save Changes" : "Create Reservation")}
                  isEdit={!!editingReservation}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}