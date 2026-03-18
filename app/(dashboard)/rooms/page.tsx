"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "../../utils/api";
import { QUERY_KEYS } from "../../utils/constants";
import { Room } from "../../utils/types";
import { RoomsTable } from "../../components/tables/RoomsTable";
import { RoomForm, RoomFormValues } from "../../components/forms/RoomForm";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Plus, 
  BedDouble, 
  X, 
  SlidersHorizontal 
} from "lucide-react";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export default function RoomsIndexPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.rooms,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Room[]>>("/api/staff/rooms/");
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: RoomFormValues) => {
      let body: FormData | Record<string, unknown>;
      if (values.image && values.image instanceof File) {
        const fd = new FormData();
        fd.append("name", values.name);
        fd.append("category", values.category);
        fd.append("capacity", String(values.capacity));
        fd.append("price", String(values.price));
        fd.append("status", values.status);
        if (values.description) fd.append("description", values.description);
        fd.append("image", values.image);
        body = fd;
      } else {
        const { image: _img, ...rest } = values;
        body = rest;
      }
      await apiClient.post<ApiResponse<Room>>("/api/staff/rooms/", body);
    },
    onSuccess: () => {
      toast.success("Room created successfully");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rooms });
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Failed to create room");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: RoomFormValues }) => {
      let body: FormData | Record<string, unknown>;
      if (values.image && values.image instanceof File) {
        const fd = new FormData();
        fd.append("name", values.name);
        fd.append("category", values.category);
        fd.append("capacity", String(values.capacity));
        fd.append("price", String(values.price));
        fd.append("status", values.status);
        if (values.description) fd.append("description", values.description);
        fd.append("image", values.image);
        body = fd;
      } else {
        const { image: _img, ...rest } = values;
        body = rest;
      }
      await apiClient.put<ApiResponse<Room>>(`/api/staff/rooms/${id}/`, body);
    },
    onSuccess: () => {
      toast.success("Room updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rooms });
      setEditingRoom(null);
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Failed to update room");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (room: Room) => {
      await apiClient.delete(`/api/staff/rooms/${room.id}/`);
    },
    onSuccess: () => {
      toast.success("Room deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rooms });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Unable to delete room");
    },
  });

  const filteredRooms = useMemo(() => {
    if (!data) return [];
    return data.filter((room) => {
      const searchTerm = search.toLowerCase().trim();
      const matchesSearch = !searchTerm ||
        room.name.toLowerCase().includes(searchTerm) ||
        room.category.toLowerCase().includes(searchTerm);
      
      const matchesStatus = statusFilter === "all" ? true : room.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 bg-white min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
            <BedDouble size={14} /> Property Management / Inventory
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hotel Rooms</h1>
          <p className="text-slate-500 text-sm font-medium">Manage room types, pricing, and active status.</p>
        </div>
        
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-xl hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <Plus size={18} /> Add New Room
        </button>
      </div>

      {/* Filters & Search Section */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
           <div className="flex items-center gap-2 mr-2 text-slate-400">
             <SlidersHorizontal size={16} />
             <span className="text-[10px] font-bold uppercase tracking-wider">Status:</span>
           </div>
           {["all", "active", "inactive"].map((status) => (
             <button
               key={status}
               onClick={() => setStatusFilter(status as any)}
               className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border capitalize
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
            placeholder="Search by room name or category..."
            className="w-full rounded-xl border-2 border-slate-200 bg-white pl-12 pr-4 py-3 text-base font-semibold text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-950 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
        <RoomsTable
          items={filteredRooms}
          loading={isLoading}
          onEdit={(room) => setEditingRoom(room)}
          onDelete={(room) => {
            if (window.confirm("Are you sure you want to delete this room?")) {
              deleteMutation.mutate(room);
            }
          }}
        />
        {!isLoading && (
          <div className="bg-slate-50/50 px-6 py-3 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>{filteredRooms.length} Room(s) Found</span>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(isCreateOpen || editingRoom) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setIsCreateOpen(false); setEditingRoom(null); }}
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
                    {editingRoom ? "Edit Room Details" : "Create New Room"}
                  </h2>
                </div>
                <button onClick={() => { setIsCreateOpen(false); setEditingRoom(null); }} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <RoomForm
                  initialValues={editingRoom || undefined}
                  onSubmit={(values) =>
                    editingRoom 
                      ? updateMutation.mutateAsync({ id: editingRoom.id, values })
                      : createMutation.mutateAsync(values)
                  }
                  submitLabel={createMutation.isPending || updateMutation.isPending ? "Saving..." : (editingRoom ? "Save Changes" : "Add Room")}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}