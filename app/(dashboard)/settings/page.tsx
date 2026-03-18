"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "../../utils/api";
import { QUERY_KEYS } from "../../utils/constants";
import { authStorage, StaffUser, StaffRole } from "../../utils/auth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Settings as SettingsIcon, 
  Users, 
  Plus, 
  Mail, 
  AtSign, 
  Key, 
  Trash2, 
  Edit3,
  X,
  ShieldCheck,
  Activity,
  ShieldAlert,
  Fingerprint,
  Zap
} from "lucide-react";

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
        const res = await apiClient.get<StaffUser | ApiResponse<StaffUser>>("/api/staff/profile/");
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
        const res = await apiClient.get<StaffUser[] | ApiResponse<StaffUser[]>>("/api/staff/users/");
        const out = unwrap(res);
        return Array.isArray(out) ? out : [];
      } catch {
        return storedUser ? [storedUser] : [];
      }
    },
  });

  const stats = useMemo(() => {
    if (!users) return { total: 0, managers: 0, others: 0 };
    return {
      total: users.length,
      managers: users.filter(u => u.role === "Manager").length,
      others: users.filter(u => u.role !== "Manager").length
    };
  }, [users]);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setEmail(profile.email ?? "");
      setUsername(profile.username ?? "");
    }
  }, [profile]);

  // Mutations (No changes to logic)
  const updateMutation = useMutation({
    mutationFn: async (values: { name: string; email: string; username: string; password?: string }) => {
      const payload: Record<string, string> = { name: values.name, email: values.email, username: values.username };
      if (values.password?.trim()) payload.password = values.password;
      const res = await apiClient.put<StaffUser | ApiResponse<StaffUser>>("/api/staff/profile/", payload);
      return unwrap(res);
    },
    onSuccess: (data) => {
      toast.success("Profile updated");
      if (data) {
        const access = authStorage.getToken();
        if (access) authStorage.save({ access, user: data });
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      setPassword("");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Failed to update profile");
    },
  });

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
      setCreateName(""); setCreateEmail(""); setCreateUsername(""); setCreatePassword("");
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ name: name.trim(), email: email.trim(), username: username.trim(), password: password.trim() || undefined });
  };

  const handleCreateUser = (e: FormEvent) => {
    e.preventDefault();
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
    <div className="max-w-[1200px] mx-auto p-4 md:p-6 space-y-6 bg-[#fcfcfd] min-h-screen">
      
      {/* Top Navigation Bar Style Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-100 shadow-lg">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Server: Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
          <div className="px-3 py-1.5 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center gap-2">
            <Activity size={14} className="text-indigo-500" />
            <span className="text-[11px] font-bold text-slate-600 uppercase">Status OK</span>
          </div>
        </div>
      </div>

      {/* Stats Cards - Smaller & Colorful */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-indigo-50/50 p-4 rounded-[20px] border border-indigo-100/50 shadow-sm">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Admins</p>
          <p className="text-2xl font-black text-indigo-700 mt-1">{stats.managers}</p>
        </div>
        <div className="bg-emerald-50/50 p-4 rounded-[20px] border border-emerald-100/50 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Active</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.others}</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-[20px] shadow-lg">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tier</p>
          <p className="text-lg font-bold text-white mt-1 truncate">{currentUser?.role}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Left: My Account */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[28px] border border-slate-100 p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-5">
              <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                <Fingerprint size={18} />
              </div>
              <h2 className="text-base font-bold text-slate-900">My Identity</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-slate-50 border-none rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-slate-50 border-none rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 ml-1">Username</label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full bg-slate-50 border-none rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 ml-1">Password</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border-none rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={updateMutation.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-xs font-bold shadow-lg shadow-indigo-100 transition-all mt-4 flex items-center justify-center gap-2">
                <Zap size={14} />
                {updateMutation.isPending ? "Updating..." : "Update Account"}
              </button>
            </form>
          </div>

          <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 flex gap-3">
            <ShieldAlert size={18} className="text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-700 font-bold leading-relaxed">Security policy: All administrative changes are tracked and logged to your profile session.</p>
          </div>
        </div>

        {/* Right: Staff List */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-[28px] border border-slate-100 p-7 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                  <Users size={18} />
                </div>
                <h2 className="text-base font-bold text-slate-900">Staff Directory</h2>
              </div>
              {isManager && (
                <button onClick={() => setCreateOpen(!createOpen)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${createOpen ? 'bg-slate-100 text-slate-500' : 'bg-slate-900 text-white shadow-lg'}`}>
                  {createOpen ? <X size={14} /> : <Plus size={14} />}
                  {createOpen ? "Close" : "Add New"}
                </button>
              )}
            </div>

            <AnimatePresence>
              {isManager && createOpen && (
                <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={handleCreateUser} className="mb-6 grid grid-cols-2 gap-3 bg-slate-50 p-5 rounded-2xl overflow-hidden">
                  <div className="col-span-2">
                    <select value={createRole} onChange={(e) => setCreateRole(e.target.value as StaffRole)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none">
                      {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <input placeholder="Name" value={createName} onChange={(e) => setCreateName(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium" />
                  <input placeholder="Email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium" />
                  <input placeholder="Username" value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium" />
                  <input placeholder="Password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium" />
                  <button type="submit" className="col-span-2 bg-indigo-600 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-md">Create Account</button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="space-y-2 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {usersLoading ? (
                [1,2,3].map(i => <div key={i} className="h-16 animate-pulse bg-slate-50 rounded-2xl" />)
              ) : users?.map((user) => (
                <div key={user.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${currentUser?.id === user.id ? 'bg-indigo-600 border-indigo-600 shadow-indigo-100 shadow-lg' : 'bg-white border-slate-50 hover:border-slate-200'}`}>
                  <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-xs font-black ${currentUser?.id === user.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {user.name?.[0] || user.username[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${currentUser?.id === user.id ? 'text-white' : 'text-slate-900'}`}>{user.name || user.username}</p>
                    <p className={`text-[10px] font-medium uppercase tracking-tighter truncate ${currentUser?.id === user.id ? 'text-indigo-100' : 'text-slate-400'}`}>{user.role} • {user.email || 'System'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {isManager && currentUser?.id !== user.id ? (
                      <>
                        <button onClick={() => setEditingUser(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                        <button onClick={() => { if(window.confirm('Delete?')) deleteUserMutation.mutate(user.id) }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </>
                    ) : (
                      <ShieldCheck size={16} className={currentUser?.id === user.id ? 'text-white' : 'text-emerald-500'} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal - Compact */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingUser(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Edit User</h3>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full Name" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-semibold outline-none" />
                <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-semibold outline-none" />
                <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="Username" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-semibold outline-none" />
                <input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="New Password (optional)" type="password" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-semibold outline-none" />
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-3 text-xs font-bold text-slate-400 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-indigo-100">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}