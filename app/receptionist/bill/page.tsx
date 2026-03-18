"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";
import toast from "react-hot-toast";
import type { Reservation, Room } from "../../../utils/types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ==================== MAIN COMPONENT ====================

export default function BillPage() {
  const [selectedReservationId, setSelectedReservationId] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: reservations = [] } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Reservation[]>>(
        "/api/staff/reservations/",
      );
      return res.data.data ?? [];
    },
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Room[]>>("/api/staff/rooms/");
      return res.data.data ?? [];
    },
  });

  const roomById = useMemo(() => {
    const map = new Map<number, Room>();
    rooms.forEach((r) => map.set(r.id, r));
    return map;
  }, [rooms]);

  const selected = useMemo(() => {
    const id = Number(selectedReservationId);
    if (!Number.isFinite(id)) return null;
    return reservations.find((r) => r.id === id) ?? null;
  }, [reservations, selectedReservationId]);

  const selectedRoom = selected ? roomById.get(selected.room) ?? null : null;

  const bill = useMemo(() => {
    if (!selected || !selectedRoom) return null;
    const start = new Date(selected.check_in);
    const end = new Date(selected.check_out);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return null;
    }
    const nights = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const pricePerNight = Number(selectedRoom.price);
    const total = nights * pricePerNight;
    return {
      nights,
      pricePerNight,
      total,
    };
  }, [selected, selectedRoom]);

  // Handle print
  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Bill - Mahameruwa Hotel</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
                .bill-container { max-width: 600px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px; }
                .hotel-name { font-size: 24px; font-weight: bold; color: #1e40af; }
                .hotel-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
                .section { margin-bottom: 16px; }
                .section-title { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
                .info-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
                .info-label { color: #64748b; }
                .info-value { font-weight: 500; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
                th { text-align: left; font-size: 11px; font-weight: 600; color: #64748b; padding: 8px; border-bottom: 2px solid #e2e8f0; }
                td { font-size: 13px; padding: 8px; border-bottom: 1px solid #f1f5f9; }
                .total-section { border-top: 2px solid #e2e8f0; padding-top: 12px; }
                .grand-total { font-size: 20px; font-weight: bold; color: #1e40af; }
                .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #94a3b8; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="space-y-5">

      {/* ========== HEADER ========== */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">🧾 Bill</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Generate bills for bookings
        </p>
      </div>

      {/* ========== GENERATE BILL FORM ========== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          Generate Bill (Reservation)
        </h2>

        <div className="flex gap-3">
          {/* Reservation Selector */}
          <select
            value={selectedReservationId}
            onChange={(e) => setSelectedReservationId(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">Select a reservation...</option>
            {reservations.map((r) => (
              <option key={r.id} value={r.id}>
                #{r.id} — {r.customer_name} — {r.check_in} to {r.check_out}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (!selectedReservationId) {
                toast.error("Please select a reservation");
                return;
              }
              if (!bill) {
                toast.error("Unable to generate bill for this reservation");
                return;
              }
              toast.success("Bill ready");
            }}
            disabled={!selectedReservationId}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Generate Bill
          </button>
        </div>
      </div>

      {/* ========== GENERATED BILL ========== */}
      {selected && selectedRoom && bill && (
        <>
          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
            >
              🖨️ Print Bill
            </button>
          </div>

          {/* Bill Preview */}
          <div
            ref={printRef}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
          >
            <div className="bill-container max-w-xl mx-auto">

              {/* Hotel Header */}
              <div className="header text-center border-b-2 border-slate-200 pb-4 mb-4">
                <p className="hotel-name text-2xl font-bold text-blue-700">
                  MAHAMERUWA HOTEL
                </p>
                <p className="hotel-sub text-xs text-slate-500 mt-1">
                  Luxury Hotel & Resort
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  📍 Mahameruwa, Sri Lanka | 📞 +94 XX XXX XXXX
                </p>
              </div>

              {/* Bill Info */}
              <div className="section flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-500">Bill No</p>
                  <p className="text-sm font-bold text-slate-900">
                    RES-{selected.id}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Date</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Customer Details */}
              <div className="section bg-slate-50 rounded-xl p-4 mb-4">
                <p className="section-title text-xs font-semibold text-slate-500 uppercase mb-2">
                  Customer Details
                </p>
                {[
                  { label: "Name", value: selected.customer_name },
                  { label: "Email", value: selected.email },
                  { label: "Phone", value: selected.phone },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="info-row flex justify-between text-xs mb-1"
                  >
                    <span className="info-label text-slate-500">
                      {item.label}
                    </span>
                    <span className="info-value font-medium text-slate-900">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Stay Details */}
              <div className="section bg-slate-50 rounded-xl p-4 mb-4">
                <p className="section-title text-xs font-semibold text-slate-500 uppercase mb-2">
                  Stay Details
                </p>
                {[
                  {
                    label: "Room",
                    value: `${selectedRoom.name} (${selectedRoom.category})`,
                  },
                  {
                    label: "Check-in",
                    value: selected.check_in,
                  },
                  {
                    label: "Check-out",
                    value: selected.check_out,
                  },
                  {
                    label: "Nights",
                    value: String(bill.nights),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="info-row flex justify-between text-xs mb-1"
                  >
                    <span className="info-label text-slate-500">
                      {item.label}
                    </span>
                    <span className="info-value font-medium text-slate-900">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Charges Table */}
              <div className="section mb-4">
                <p className="section-title text-xs font-semibold text-slate-500 uppercase mb-2">
                  Charges
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-2 font-medium text-slate-600">
                        Description
                      </th>
                      <th className="text-center py-2 font-medium text-slate-600">
                        Qty
                      </th>
                      <th className="text-right py-2 font-medium text-slate-600">
                        Unit Price
                      </th>
                      <th className="text-right py-2 font-medium text-slate-600">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Room Charges */}
                    <tr className="border-b border-slate-100">
                      <td className="py-2 text-slate-700">
                        Room Charges ({selectedRoom.category})
                      </td>
                      <td className="py-2 text-center text-slate-700">
                        {bill.nights} nights
                      </td>
                      <td className="py-2 text-right text-slate-700">
                        LKR {bill.pricePerNight.toLocaleString()}
                      </td>
                      <td className="py-2 text-right font-medium text-slate-900">
                        LKR {bill.total.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="total-section border-t-2 border-slate-200 pt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium text-slate-900">
                    LKR {bill.total.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Tax</span>
                  <span className="font-medium text-slate-900">
                    LKR 0
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-sm font-semibold text-slate-900">
                    Grand Total
                  </span>
                  <span className="grand-total text-xl font-bold text-blue-700">
                    LKR {bill.total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="footer text-center mt-6 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-400">
                  Thank you for staying at Mahameruwa Hotel!
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  This is a computer-generated bill.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========== NO BILL STATE ========== */}
      {!selectedReservationId && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-5xl mb-4">🧾</div>
          <p className="text-sm font-medium text-slate-900">
            No bill generated yet
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Select a reservation above and click &quot;Generate Bill&quot;
          </p>
        </div>
      )}
    </div>
  );
}
