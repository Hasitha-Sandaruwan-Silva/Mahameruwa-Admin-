"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "../../utils/api";
import { QUERY_KEYS } from "../../utils/constants";
import { Room } from "../../utils/types";
import { RoomsTable } from "../../components/tables/RoomsTable";
import { RoomForm, RoomFormValues } from "../../components/forms/RoomForm";


interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export default function RoomsIndexPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
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
      await apiClient.post<ApiResponse<Room>>("/api/staff/rooms/", values);
    },
    onSuccess: () => {
      toast.success("Room created");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rooms });
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Failed to create room");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: RoomFormValues;
    }) => {
      await apiClient.put<ApiResponse<Room>>(
        `/api/staff/rooms/${id}/`,
        values,
      );
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
      const matchesSearch =
        !search ||
        room.name.toLowerCase().includes(search.toLowerCase()) ||
        room.category.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ? true : room.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Rooms</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage all staff rooms, pricing, and capacity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:flex"
          >
            Filter
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
          >
            + Add New Room
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by room name or category..."
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | "active" | "inactive")
          }
          className="rounded-full border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <RoomsTable
        items={filteredRooms}
        loading={isLoading}
        onEdit={(room) => setEditingRoom(room)}
        onDelete={(room) => {
          const confirmed = window.confirm(
            "Are you sure you want to delete this room?",
          );
          if (confirmed) {
            deleteMutation.mutate(room);
          }
        }}
      />

      {isCreateOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Add New Room
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Create a new room available for booking.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
              >
                Esc
              </button>
            </div>
            <RoomForm
              onSubmit={(values) => createMutation.mutateAsync(values)}
              submitLabel={createMutation.isPending ? "Creating..." : "Create"}
            />
          </div>
        </div>
      )}

      {editingRoom && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Edit Room
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Update pricing, capacity, and details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="rounded-full px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
              >
                Esc
              </button>
            </div>
            <RoomForm
              initialValues={editingRoom}
              onSubmit={(values) =>
                updateMutation.mutateAsync({
                  id: editingRoom.id,
                  values,
                })
              }
              submitLabel={
                updateMutation.isPending ? "Saving..." : "Save Changes"
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

