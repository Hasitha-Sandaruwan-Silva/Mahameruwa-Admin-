"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "../../utils/api";
import { QUERY_KEYS } from "../../utils/constants";
import { authStorage, StaffUser } from "../../utils/auth";

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

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const storedUser = typeof window !== "undefined" ? authStorage.getUser() : null;

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
        const token = authStorage.getToken();
        if (token) {
          authStorage.save({ token, user: data });
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
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Staff Members
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            All staff users with access to this portal.
          </p>
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
                        {user.name}
                        {currentUser?.id === user.id && (
                          <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                            You
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {user.email} · {user.username}
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
    </div>
  );
}
