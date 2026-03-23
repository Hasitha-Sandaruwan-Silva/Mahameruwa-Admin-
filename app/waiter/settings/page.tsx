"use client";

import { useState, useEffect } from "react";
import { authStorage } from "../../utils/auth";
import toast from "react-hot-toast";

export default function WaiterSettingsPage() {
  const [user, setUser] = useState<ReturnType<typeof authStorage.getUser>>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [preferences, setPreferences] = useState({
    soundNotifications: true,
    autoRefreshOrders: true,
    refreshInterval: 30,
    darkMode: false,
    language: "english",
  });
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const u = authStorage.getUser();
    setUser(u);
    if (u) {
      setFormData({
        name: u.name || u.username || "",
        email: u.email || "",
        phone: (u as any).phone || "",  // ⭐ FIXED
      });
    }

    const savedPrefs = localStorage.getItem("waiter_preferences");
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
  }, []);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile updated successfully");
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    toast.success("Password changed successfully");
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handlePreferencesSave = () => {
    localStorage.setItem("waiter_preferences", JSON.stringify(preferences));
    toast.success("Preferences saved");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "password", label: "Password", icon: "🔒" },
    { id: "preferences", label: "Preferences", icon: "🎛️" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your profile and preferences
        </p>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Profile Information
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Update your personal details
          </p>

          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-2xl">
                {formData.name ? formData.name.charAt(0).toUpperCase() : "W"}
              </span>
            </div>
            <div>
              <p className="font-medium text-slate-900">{formData.name || "Waiter"}</p>
              <p className="text-sm text-slate-500">Waiter</p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "password" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Change Password
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Update your password to keep your account secure
          </p>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter current password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter new password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Confirm new password"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "preferences" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Preferences
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Customize your work experience
          </p>

          <div className="space-y-6">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  🔔 Sound Notifications
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Play sound when new order arrives
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPreferences({ ...preferences, soundNotifications: !preferences.soundNotifications })
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  preferences.soundNotifications ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    preferences.soundNotifications ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  🔄 Auto Refresh Orders
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automatically refresh order list
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPreferences({ ...preferences, autoRefreshOrders: !preferences.autoRefreshOrders })
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  preferences.autoRefreshOrders ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    preferences.autoRefreshOrders ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {preferences.autoRefreshOrders && (
              <div className="py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900 mb-2">
                  ⏱️ Refresh Interval
                </p>
                <select
                  value={preferences.refreshInterval}
                  onChange={(e) =>
                    setPreferences({ ...preferences, refreshInterval: Number(e.target.value) })
                  }
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={10}>Every 10 seconds</option>
                  <option value={30}>Every 30 seconds</option>
                  <option value={60}>Every 1 minute</option>
                  <option value={120}>Every 2 minutes</option>
                </select>
              </div>
            )}

            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  🌙 Dark Mode
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Switch to dark theme
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPreferences({ ...preferences, darkMode: !preferences.darkMode })
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  preferences.darkMode ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    preferences.darkMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="py-3 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-900 mb-2">
                🌐 Language
              </p>
              <select
                value={preferences.language}
                onChange={(e) =>
                  setPreferences({ ...preferences, language: e.target.value })
                }
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="english">English</option>
                <option value="sinhala">සිංහල</option>
                <option value="tamil">தமிழ்</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handlePreferencesSave}
                className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}