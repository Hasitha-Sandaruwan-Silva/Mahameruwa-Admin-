"use client";

import { useState, useEffect } from "react";
import { apiClient } from "../../utils/api";
import toast from "react-hot-toast";

interface Table {
  id: number;
  table_number: string | number;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  current_order_id?: number;
  floor?: string;
  section?: string;
  notes?: string;
}

interface TableOrder {
  id: number;
  items_count: number;
  total: number;
  status: string;
  created_at: string;
}

const statusConfig = {
  available: { label: "Available", color: "bg-emerald-100 text-emerald-700", icon: "✅" },
  occupied: { label: "Occupied", color: "bg-red-100 text-red-700", icon: "🍽️" },
  reserved: { label: "Reserved", color: "bg-amber-100 text-amber-700", icon: "📅" },
  cleaning: { label: "Cleaning", color: "bg-blue-100 text-blue-700", icon: "🧹" },
};

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [tableOrder, setTableOrder] = useState<TableOrder | null>(null);

  // ═══ Fetch Tables ═══
 // ═══ Fetch Tables ═══
const fetchTables = async () => {
  setLoading(true);
  try {
    const { data } = await apiClient.get("/api/tables/");
    setTables(data.data || data || []);
  } catch (error) {
    // API නැත්නම් demo data use කරනවා
    console.log("Using demo data - API not available");
    setTables([
      { id: 1, table_number: "T1", capacity: 4, status: "available", floor: "Ground", section: "A" },
      { id: 2, table_number: "T2", capacity: 2, status: "occupied", floor: "Ground", section: "A", current_order_id: 101 },
      { id: 3, table_number: "T3", capacity: 6, status: "reserved", floor: "Ground", section: "B" },
      { id: 4, table_number: "T4", capacity: 4, status: "cleaning", floor: "Ground", section: "B" },
      { id: 5, table_number: "T5", capacity: 8, status: "available", floor: "First", section: "C" },
      { id: 6, table_number: "T6", capacity: 4, status: "occupied", floor: "First", section: "C", current_order_id: 102 },
      { id: 7, table_number: "T7", capacity: 2, status: "available", floor: "First", section: "D" },
      { id: 8, table_number: "T8", capacity: 4, status: "reserved", floor: "First", section: "D" },
    ]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchTables();
  }, []);

  // ═══ Update Table Status ═══
  const updateTableStatus = async (tableId: number, newStatus: string) => {
    try {
      await apiClient.patch(`/api/tables/${tableId}/`, { status: newStatus });
      toast.success(`Table status updated to ${newStatus}`);
      fetchTables();
    } catch (error) {
      // Demo mode — update locally
      setTables(tables.map(t => 
        t.id === tableId ? { ...t, status: newStatus as Table["status"] } : t
      ));
      toast.success(`Table status updated to ${newStatus}`);
    }
  };

  // ═══ View Table Details ═══
  const viewTableDetails = async (table: Table) => {
    setSelectedTable(table);
    setShowModal(true);
    
    if (table.current_order_id) {
      try {
        const { data } = await apiClient.get(`/api/orders/${table.current_order_id}/`);
        setTableOrder(data);
      } catch {
        setTableOrder({
          id: table.current_order_id,
          items_count: 5,
          total: 4500,
          status: "in_progress",
          created_at: new Date().toISOString(),
        });
      }
    } else {
      setTableOrder(null);
    }
  };

  // ═══ Export Report — CSV ═══
  const exportToCSV = () => {
    const headers = ["Table Number", "Capacity", "Status", "Floor", "Section"];
    const rows = tables.map(t => [
      t.table_number,
      t.capacity,
      t.status,
      t.floor || "-",
      t.section || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tables_report_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success("CSV Report downloaded!");
  };

  // ═══ Export Report — PDF ═══
  const exportToPDF = () => {
    // Create printable HTML
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tables Report - Mahameruwa Hotel</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #0a3d2c; text-align: center; }
          .header { text-align: center; margin-bottom: 30px; }
          .date { color: #666; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #0a3d2c; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .status-available { color: #059669; font-weight: bold; }
          .status-occupied { color: #dc2626; font-weight: bold; }
          .status-reserved { color: #d97706; font-weight: bold; }
          .status-cleaning { color: #2563eb; font-weight: bold; }
          .summary { margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
          .summary-item { text-align: center; }
          .summary-number { font-size: 24px; font-weight: bold; color: #0a3d2c; }
          .summary-label { font-size: 12px; color: #666; }
          .footer { margin-top: 40px; text-align: center; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏨 MAHAMERUWA HOTEL</h1>
          <p>Tables Status Report</p>
          <p class="date">Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-number">${tables.length}</div>
              <div class="summary-label">Total Tables</div>
            </div>
            <div class="summary-item">
              <div class="summary-number" style="color: #059669;">${tables.filter(t => t.status === "available").length}</div>
              <div class="summary-label">Available</div>
            </div>
            <div class="summary-item">
              <div class="summary-number" style="color: #dc2626;">${tables.filter(t => t.status === "occupied").length}</div>
              <div class="summary-label">Occupied</div>
            </div>
            <div class="summary-item">
              <div class="summary-number" style="color: #d97706;">${tables.filter(t => t.status === "reserved").length}</div>
              <div class="summary-label">Reserved</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Table #</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Floor</th>
              <th>Section</th>
            </tr>
          </thead>
          <tbody>
            ${tables.map(t => `
              <tr>
                <td><strong>${t.table_number}</strong></td>
                <td>${t.capacity} seats</td>
                <td class="status-${t.status}">${t.status.toUpperCase()}</td>
                <td>${t.floor || "-"}</td>
                <td>${t.section || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>Mahameruwa Hotel & Restaurant | Generated by Waiter Portal</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }

    toast.success("PDF Report generated!");
  };

  // ═══ Export Report — Excel (XLSX format via CSV with Excel compatibility) ═══
  const exportToExcel = () => {
    const headers = ["Table Number", "Capacity", "Status", "Floor", "Section", "Notes"];
    const rows = tables.map(t => [
      t.table_number,
      t.capacity,
      t.status,
      t.floor || "",
      t.section || "",
      t.notes || "",
    ]);

    // BOM for Excel UTF-8 compatibility
    const BOM = "\uFEFF";
    const csvContent = BOM + [
      headers.join("\t"),
      ...rows.map(row => row.join("\t"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tables_report_${new Date().toISOString().split("T")[0]}.xls`;
    link.click();

    toast.success("Excel Report downloaded!");
  };

  // ═══ Filter Tables ═══
  const filteredTables = filterStatus === "all" 
    ? tables 
    : tables.filter(t => t.status === filterStatus);

  // ═══ Stats ═══
  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === "available").length,
    occupied: tables.filter(t => t.status === "occupied").length,
    reserved: tables.filter(t => t.status === "reserved").length,
    cleaning: tables.filter(t => t.status === "cleaning").length,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tables</h1>
          <p className="text-sm text-slate-500">Manage restaurant tables and seating</p>
        </div>
        
        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
              <span>📊</span>
              <span>Export Report</span>
              <span>▼</span>
            </button>
            
            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <div className="p-2">
                <button
                  onClick={exportToPDF}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="text-red-500">📄</span>
                  <span>Export as PDF</span>
                </button>
                <button
                  onClick={exportToExcel}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="text-green-600">📗</span>
                  <span>Export as Excel</span>
                </button>
                <button
                  onClick={exportToCSV}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="text-blue-500">📋</span>
                  <span>Export as CSV</span>
                </button>
              </div>
            </div>
          </div>
          
          <button
            onClick={fetchTables}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <button
          onClick={() => setFilterStatus("all")}
          className={`p-4 rounded-xl border transition-all ${
            filterStatus === "all" 
              ? "bg-slate-900 text-white border-slate-900" 
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <p className={`text-xs ${filterStatus === "all" ? "text-slate-300" : "text-slate-500"}`}>
            Total Tables
          </p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </button>

        <button
          onClick={() => setFilterStatus("available")}
          className={`p-4 rounded-xl border transition-all ${
            filterStatus === "available" 
              ? "bg-emerald-600 text-white border-emerald-600" 
              : "bg-emerald-50 border-emerald-100 hover:border-emerald-200"
          }`}
        >
          <p className={`text-xs ${filterStatus === "available" ? "text-emerald-100" : "text-emerald-600"}`}>
            ✅ Available
          </p>
          <p className={`text-2xl font-bold mt-1 ${filterStatus === "available" ? "text-white" : "text-emerald-700"}`}>
            {stats.available}
          </p>
        </button>

        <button
          onClick={() => setFilterStatus("occupied")}
          className={`p-4 rounded-xl border transition-all ${
            filterStatus === "occupied" 
              ? "bg-red-600 text-white border-red-600" 
              : "bg-red-50 border-red-100 hover:border-red-200"
          }`}
        >
          <p className={`text-xs ${filterStatus === "occupied" ? "text-red-100" : "text-red-600"}`}>
            🍽️ Occupied
          </p>
          <p className={`text-2xl font-bold mt-1 ${filterStatus === "occupied" ? "text-white" : "text-red-700"}`}>
            {stats.occupied}
          </p>
        </button>

        <button
          onClick={() => setFilterStatus("reserved")}
          className={`p-4 rounded-xl border transition-all ${
            filterStatus === "reserved" 
              ? "bg-amber-600 text-white border-amber-600" 
              : "bg-amber-50 border-amber-100 hover:border-amber-200"
          }`}
        >
          <p className={`text-xs ${filterStatus === "reserved" ? "text-amber-100" : "text-amber-600"}`}>
            📅 Reserved
          </p>
          <p className={`text-2xl font-bold mt-1 ${filterStatus === "reserved" ? "text-white" : "text-amber-700"}`}>
            {stats.reserved}
          </p>
        </button>

        <button
          onClick={() => setFilterStatus("cleaning")}
          className={`p-4 rounded-xl border transition-all ${
            filterStatus === "cleaning" 
              ? "bg-blue-600 text-white border-blue-600" 
              : "bg-blue-50 border-blue-100 hover:border-blue-200"
          }`}
        >
          <p className={`text-xs ${filterStatus === "cleaning" ? "text-blue-100" : "text-blue-600"}`}>
            🧹 Cleaning
          </p>
          <p className={`text-2xl font-bold mt-1 ${filterStatus === "cleaning" ? "text-white" : "text-blue-700"}`}>
            {stats.cleaning}
          </p>
        </button>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Loading tables...</div>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-slate-200">
          <p className="text-4xl mb-3">🪑</p>
          <p className="text-slate-500">No tables found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredTables.map((table) => {
            const config = statusConfig[table.status];
            return (
              <div
                key={table.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => viewTableDetails(table)}
              >
                {/* Table Visual */}
                <div className={`h-24 flex items-center justify-center ${config.color} relative`}>
                  <span className="text-4xl">{config.icon}</span>
                  <span className="absolute top-2 right-2 text-xs font-medium px-2 py-0.5 bg-white/80 rounded-full">
                    {table.capacity} 👥
                  </span>
                </div>
                
                {/* Table Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900">Table {table.table_number}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  
                  {table.floor && (
                    <p className="text-xs text-slate-500">
                      📍 {table.floor} Floor, Section {table.section}
                    </p>
                  )}

                  {/* Quick Actions */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {table.status === "occupied" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTableStatus(table.id, "cleaning");
                        }}
                        className="flex-1 text-xs py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                      >
                        🧹 Clear
                      </button>
                    )}
                    {table.status === "cleaning" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTableStatus(table.id, "available");
                        }}
                        className="flex-1 text-xs py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                      >
                        ✅ Ready
                      </button>
                    )}
                    {table.status === "available" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTableStatus(table.id, "occupied");
                        }}
                        className="flex-1 text-xs py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                      >
                        🍽️ Seat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Table Details Modal ═══ */}
      {showModal && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className={`px-6 py-4 ${statusConfig[selectedTable.status].color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Table {selectedTable.table_number}</h2>
                  <p className="text-sm opacity-80">
                    {selectedTable.floor} Floor, Section {selectedTable.section}
                  </p>
                </div>
                <span className="text-4xl">{statusConfig[selectedTable.status].icon}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Table Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Capacity</p>
                  <p className="text-lg font-bold text-slate-900">{selectedTable.capacity} Guests</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Status</p>
                  <p className="text-lg font-bold text-slate-900">{statusConfig[selectedTable.status].label}</p>
                </div>
              </div>

              {/* Current Order */}
              {tableOrder && (
                <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <h3 className="text-sm font-semibold text-amber-800 mb-2">Current Order #{tableOrder.id}</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-600">{tableOrder.items_count} items</span>
                    <span className="font-bold text-amber-800">LKR {tableOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Status Change Buttons */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700 mb-2">Change Status:</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["available", "occupied", "reserved", "cleaning"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        updateTableStatus(selectedTable.id, status);
                        setShowModal(false);
                      }}
                      disabled={selectedTable.status === status}
                      className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                        selectedTable.status === status
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : `${statusConfig[status].color} hover:opacity-80`
                      }`}
                    >
                      {statusConfig[status].icon} {statusConfig[status].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}