"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";
import toast from "react-hot-toast";

interface StaffMember {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  created_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const ROLE_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  Manager:      { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  Receptionist: { color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",       dot: "bg-blue-500" },
  Waiter:       { color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     dot: "bg-amber-500" },
  Accountant:   { color: "text-purple-700",  bg: "bg-purple-50 border-purple-200",   dot: "bg-purple-500" },
};

const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

const ATTENDANCE_DATA = [
  { day: "Mon", present: 8, absent: 2 },
  { day: "Tue", present: 9, absent: 1 },
  { day: "Wed", present: 7, absent: 3 },
  { day: "Thu", present: 10, absent: 0 },
  { day: "Fri", present: 8, absent: 2 },
  { day: "Sat", present: 6, absent: 4 },
  { day: "Sun", present: 5, absent: 5 },
];

export default function StaffManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "attendance" | "performance">("list");
  const [form, setForm] = useState({
    name: "", email: "", username: "", password: "", role: "Waiter",
  });

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ["staff-users"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<StaffMember[]>>("/api/staff/users/");
      return res.data.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post("/api/staff/setup", form);
    },
    onSuccess: () => {
      toast.success("Staff member added!");
      queryClient.invalidateQueries({ queryKey: ["staff-users"] });
      setIsCreateOpen(false);
      setForm({ name: "", email: "", username: "", password: "", role: "Waiter" });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to add staff";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/staff/users/${id}/`);
    },
    onSuccess: () => {
      toast.success("Staff member deleted!");
      queryClient.invalidateQueries({ queryKey: ["staff-users"] });
    },
    onError: () => toast.error("Failed to delete staff member"),
  });

  const filtered = staffList.filter((s) => {
    const matchSearch = !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.username?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleCounts = Object.keys(ROLE_CONFIG).map((role) => ({
    role,
    count: staffList.filter((s) => s.role === role).length,
    ...ROLE_CONFIG[role],
  }));

  const performanceData = staffList.map((s) => ({
    ...s,
    tasks: Math.floor(Math.random() * 50) + 10,
    rating: (Math.random() * 2 + 3).toFixed(1),
    attendance: Math.floor(Math.random() * 20) + 80,
  }));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage staff accounts, attendance and performance.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          + Add Staff
        </button>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {roleCounts.map(({ role, count, bg, color, dot }) => (
          <div
            key={role}
            onClick={() => setRoleFilter(roleFilter === role ? "All" : role)}
            className={`rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-sm ${bg}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`h-2 w-2 rounded-full ${dot}`} />
              <span className={`text-xs font-medium ${color}`}>{role}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{count}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { key: "list", label: "👥 Staff List" },
          { key: "attendance", label: "📅 Attendance" },
          { key: "performance", label: "⭐ Performance" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === key
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Staff List */}
      {activeTab === "list" && (
        <>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, username..."
              className="flex-1 min-w-[220px] rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-500"
            >
              <option value="All">All Roles</option>
              {Object.keys(ROLE_CONFIG).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["#", "Name", "Username", "Email", "Role", "Joined", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 rounded animate-pulse w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                      No staff members found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((staff) => {
                    const roleStyle = ROLE_CONFIG[staff.role];
                    return (
                      <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-400 text-xs">{staff.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-semibold">
                              {(staff.name || staff.username || "?")[0].toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-900">{staff.name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{staff.username}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{staff.email || "—"}</td>
                        <td className="px-4 py-3">
                          {roleStyle ? (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${roleStyle.bg} ${roleStyle.color}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${roleStyle.dot}`} />
                              {staff.role}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-600">{staff.role}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(staff.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete ${staff.name || staff.username}?`)) {
                                deleteMutation.mutate(staff.id);
                              }
                            }}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Tab: Attendance */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Weekly Attendance Overview</h2>
            <div className="flex items-end gap-3 h-40">
              {ATTENDANCE_DATA.map(({ day, present, absent }) => {
                const total = present + absent;
                const presentPct = (present / total) * 100;
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-500">{present}/{total}</span>
                    <div className="w-full flex flex-col-reverse rounded-lg overflow-hidden" style={{ height: "100px" }}>
                      <div className="bg-emerald-400 transition-all" style={{ height: `${presentPct}%` }} />
                      <div className="bg-red-200 transition-all" style={{ height: `${100 - presentPct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{day}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                Present
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="h-3 w-3 rounded-full bg-red-200" />
                Absent
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Staff Member", "Role", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.slice(0, 8).map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-semibold">
                          {(staff.name || staff.username || "?")[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-slate-900">{staff.name || staff.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{staff.role}</span>
                    </td>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                      const present = Math.random() > 0.2;
                      return (
                        <td key={day} className="px-4 py-3">
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${present ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                            {present ? "✓" : "✗"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Performance */}
      {activeTab === "performance" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Staff Member", "Role", "Tasks Completed", "Rating", "Attendance %", "Performance"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {performanceData.map((staff) => {
                const perf = staff.attendance >= 90 ? "Excellent" : staff.attendance >= 75 ? "Good" : "Needs Improvement";
                const perfColor = staff.attendance >= 90 ? "bg-emerald-100 text-emerald-700" : staff.attendance >= 75 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700";
                return (
                  <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-semibold">
                          {(staff.name || staff.username || "?")[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900 text-xs">{staff.name || staff.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{staff.role}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">{staff.tasks}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-amber-600 font-medium">⭐ {staff.rating}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${staff.attendance}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600">{staff.attendance}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${perfColor}`}>
                        {perf}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Add New Staff Member</h2>
                <p className="text-xs text-slate-500 mt-0.5">Create a new staff account.</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-xs text-slate-500 hover:bg-slate-100 px-2 py-1 rounded-full">Esc</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Full Name", key: "name", type: "text", placeholder: "Kamal Perera", col: "col-span-2" },
                { label: "Email", key: "email", type: "email", placeholder: "kamal@gmail.com", col: "col-span-2" },
                { label: "Username", key: "username", type: "text", placeholder: "kamal.perera", col: "" },
                { label: "Password", key: "password", type: "password", placeholder: "••••••••", col: "" },
              ].map(({ label, key, type, placeholder, col }) => (
                <div key={key} className={`space-y-1 ${col}`}>
                  <label className="text-xs font-medium text-slate-700">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(ROLE_CONFIG).map((role) => {
                  const cfg = ROLE_CONFIG[role];
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role }))}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                        form.role === role ? `${cfg.bg} ${cfg.color} border-current` : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${cfg.dot}`} />
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                if (!form.name.trim()) return toast.error("Name required");
                if (!form.username.trim()) return toast.error("Username required");
                if (!form.password.trim()) return toast.error("Password required");
                if (!form.email.trim()) return toast.error("Email required");
                createMutation.mutate();
              }}
              disabled={createMutation.isPending}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-70 transition-colors"
            >
              {createMutation.isPending ? "Adding..." : "Add Staff Member"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}