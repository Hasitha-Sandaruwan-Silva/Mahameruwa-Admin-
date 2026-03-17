"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "../../utils/api";
import { QUERY_KEYS } from "../../utils/constants";
import { authStorage, StaffUser, StaffRole } from "../../utils/auth";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

function unwrap<T>(res: { data: T | ApiResponse<T> }): T {
  const d = res.data as ApiResponse<T>;
  if (d && typeof d === "object" && "data" in d && d.data !== undefined) {
    return d.data;
  }
  return res.data as T;
}

const ROLE_OPTIONS: StaffRole[] = ["Manager", "Receptionist", "Waiter", "Accountant"];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createRole, setCreateRole] = useState<StaffRole>("Receptionist");
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");

  const storedUser = typeof window !== "undefined" ? authStorage.getUser() : null;
  const isManager = storedUser?.role === "Manager";

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: async () => {
      try {
        const res = await apiClient.get<StaffUser | ApiResponse<StaffUser>>(
          "/api/staff/profile/",
        );
        return unwrap(res);
      } catch {
        return storedUser;
      }
    },
    enabled: !!storedUser,
    initialData: storedUser ?? undefined,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: QUERY_KEYS.users,
    queryFn: async () => {
      try {
        const res = await apiClient.get<StaffUser[] | ApiResponse<StaffUser[]>>(
          "/api/staff/users/",
        );
        const out = unwrap(res);
        return Array.isArray(out) ? out : [];
      } catch {
        return storedUser ? [storedUser] : [];
      }
    },
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setEmail(profile.email ?? "");
      setUsername(profile.username ?? "");
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (values: {
      name: string;
      email: string;
      username: string;
      password?: string;
    }) => {
      const payload: Record<string, string> = {
        name: values.name,
        email: values.email,
        username: values.username,
      };
      if (values.password?.trim()) {
        payload.password = values.password;
      }
      const res = await apiClient.put<StaffUser | ApiResponse<StaffUser>>(
        "/api/staff/profile/",
        payload,
      );
      return unwrap(res);
    },
    onSuccess: (data) => {
      toast.success("Profile updated");
      if (data) {
        const access = authStorage.getToken();
        if (access) {
          authStorage.save({ access, user: data });
        }
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      setPassword("");
    },
    onError: (error: unknown) => {
      toast.error(
        (error as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ??
          (error as { message?: string })?.message ??
          "Failed to update profile",
      );
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !username.trim()) {
      toast.error("Name, email, and username are required");
      return;
    }
    updateMutation.mutate({ name: name.trim(), email: email.trim(), username: username.trim(), password: password.trim() || undefined });
  };

  useEffect(() => {
    if (editingUser) {
      setEditName(editingUser.name ?? "");
      setEditEmail(editingUser.email ?? "");
      setEditUsername(editingUser.username ?? "");
      setEditPassword("");
    }
  }, [editingUser]);

  const createUserMutation = useMutation({
    mutationFn: async (values: { role: StaffRole; name?: string; email?: string; username: string; password: string }) => {
      const res = await apiClient.post<ApiResponse<StaffUser>>("/api/staff/setup/", {
        role: values.role,
        name: values.name?.trim() || undefined,
        email: values.email?.trim() || undefined,
        username: values.username.trim(),
        password: values.password,
      });
      return unwrap(res);
    },
    onSuccess: () => {
      toast.success("User created");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      setCreateOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreateUsername("");
      setCreatePassword("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? err.message ?? "Failed to create user");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...values }: { id: number; name?: string; email?: string; username?: string; password?: string }) => {
      const res = await apiClient.put<ApiResponse<StaffUser>>(`/api/staff/users/${id}/`, values);
      return unwrap(res);
    },
    onSuccess: () => {
      toast.success("User updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      setEditingUser(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? err.message ?? "Failed to update user");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/staff/users/${id}/`);
    },
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? err.message ?? "Failed to delete user");
    },
  });

  const handleCreateUser = (e: FormEvent) => {
    e.preventDefault();
    if (!createUsername.trim() || !createPassword) {
      toast.error("Username and password are required");
      return;
    }
    createUserMutation.mutate({
      role: createRole,
      name: createName.trim() || undefined,
      email: createEmail.trim() || undefined,
      username: createUsername.trim(),
      password: createPassword,
    });
  };

  const handleUpdateUser = (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editUsername.trim()) {
      toast.error("Username is required");
      return;
    }
    updateUserMutation.mutate({
      id: editingUser.id,
      name: editName.trim() || undefined,
      email: editEmail.trim() || undefined,
      username: editUsername.trim(),
      password: editPassword.trim() || undefined,
    });
  };

  const currentUser = profile ?? storedUser;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your profile and view staff members.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Update Profile */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Update Profile
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            Update your name, email, and username. Leave password blank to keep
            the current one.
          </p>
          {profileLoading && !currentUser ? (
            <div className="space-y-4">
              <div className="h-10 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  New Password (optional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Other Users */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Staff Members
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                All staff users with access to this portal.
              </p>
            </div>
            {isManager && (
              <button
                type="button"
                onClick={() => setCreateOpen((o) => !o)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                {createOpen ? "Cancel" : "Create User"}
              </button>
            )}
          </div>
          {isManager && createOpen && (
            <form onSubmit={handleCreateUser} className="mb-4 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-700">Role</label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as StaffRole)}
                  className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Name</label>
                <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Email</label>
                <input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Username *</label>
                <input type="text" value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} required className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Password *</label>
                <input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} required className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button type="submit" disabled={createUserMutation.isPending} className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-800 disabled:opacity-70">
                  {createUserMutation.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          )}
          <div className="max-h-[320px] overflow-auto">
            {usersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-center gap-3 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <div className="h-9 w-9 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-24 rounded bg-slate-200" />
                      <div className="h-2 w-32 rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users && users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                      currentUser?.id === user.id
                        ? "bg-emerald-50 ring-1 ring-emerald-200"
                        : "bg-slate-50"
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                      {user.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {user.name || user.username}
                        {currentUser?.id === user.id && (
                          <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                            You
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {[user.email, user.username].filter(Boolean).join(" · ") || user.username}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        user.role === "Manager"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      {user.role}
                    </span>
                    {isManager && currentUser?.id !== user.id && (
                      <span className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingUser(user)}
                          className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete user ${user.username}?`)) deleteUserMutation.mutate(user.id);
                          }}
                          className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-slate-500">
                No other staff members found.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit user modal */}
      {editingUser && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4" onClick={() => setEditingUser(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Edit User</h3>
            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Email</label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Username *</label>
                <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} required className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">New password (leave blank to keep)</label>
                <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingUser(null)} className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={updateUserMutation.isPending} className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-800 disabled:opacity-70">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
