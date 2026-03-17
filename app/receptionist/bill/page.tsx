"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "../../../utils/api";
import toast from "react-hot-toast";

// ==================== TYPES ====================

interface BillItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Bill {
  id: number;
  booking_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  room_number: string;
  room_type: string;
  check_in: string;
  check_out: string;
  nights: number;
  room_charges: number;
  additional_charges: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment_status: "pending" | "partial" | "paid";
  generated_at: string;
}

interface Booking {
  id: number;
  customer_name: string;
  room_number: string;
  room_type: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ==================== MAIN COMPONENT ====================

export default function BillPage() {
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [generatedBill, setGeneratedBill] = useState<Bill | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch bookings for dropdown
  const { data: bookings = [] } = useQuery({
    queryKey: ["billable-bookings"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Booking[]>>(
        "/api/staff/bookings/?billable=true"
      );
      return res.data.data;
    },
  });

  // Generate bill mutation
  const generateBillMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await apiClient.post<ApiResponse<Bill>>(
        `/api/staff/bookings/${bookingId}/generate-bill/`
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      setGeneratedBill(data);
      toast.success("Bill generated successfully!");
    },
    onError: () => {
      toast.error("Failed to generate bill");
    },
  });

  // Handle generate bill
  const handleGenerateBill = () => {
    if (!selectedBookingId) {
      toast.error("Please select a booking");
      return;
    }
    generateBillMutation.mutate(selectedBookingId);
  };

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
          Generate Bill
        </h2>

        <div className="flex gap-3">
          {/* Booking Selector */}
          <select
            value={selectedBookingId}
            onChange={(e) => setSelectedBookingId(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">Select a booking...</option>
            {bookings.map((booking) => (
              <option key={booking.id} value={booking.id}>
                #{booking.id} — {booking.customer_name} — Room{" "}
                {booking.room_number} —{" "}
                {new Date(booking.check_in).toLocaleDateString()} to{" "}
                {new Date(booking.check_out).toLocaleDateString()}
              </option>
            ))}
          </select>

          {/* Generate Button */}
          <button
            onClick={handleGenerateBill}
            disabled={
              !selectedBookingId || generateBillMutation.isPending
            }
            className="px-6 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generateBillMutation.isPending
              ? "Generating..."
              : "Generate Bill"}
          </button>
        </div>
      </div>

      {/* ========== GENERATED BILL ========== */}
      {generatedBill && (
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
                    #{generatedBill.id}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Date</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(
                      generatedBill.generated_at
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Customer Details */}
              <div className="section bg-slate-50 rounded-xl p-4 mb-4">
                <p className="section-title text-xs font-semibold text-slate-500 uppercase mb-2">
                  Customer Details
                </p>
                {[
                  { label: "Name", value: generatedBill.customer_name },
                  { label: "Email", value: generatedBill.customer_email },
                  { label: "Phone", value: generatedBill.customer_phone },
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
                    value: `${generatedBill.room_number} (${generatedBill.room_type})`,
                  },
                  {
                    label: "Check-in",
                    value: new Date(
                      generatedBill.check_in
                    ).toLocaleDateString(),
                  },
                  {
                    label: "Check-out",
                    value: new Date(
                      generatedBill.check_out
                    ).toLocaleDateString(),
                  },
                  {
                    label: "Nights",
                    value: generatedBill.nights.toString(),
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
                        Room Charges ({generatedBill.room_type})
                      </td>
                      <td className="py-2 text-center text-slate-700">
                        {generatedBill.nights} nights
                      </td>
                      <td className="py-2 text-right text-slate-700">
                        LKR{" "}
                        {(
                          generatedBill.room_charges /
                          generatedBill.nights
                        ).toLocaleString()}
                      </td>
                      <td className="py-2 text-right font-medium text-slate-900">
                        LKR{" "}
                        {generatedBill.room_charges.toLocaleString()}
                      </td>
                    </tr>

                    {/* Additional Charges */}
                    {generatedBill.additional_charges.map(
                      (charge, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-slate-100"
                        >
                          <td className="py-2 text-slate-700">
                            {charge.description}
                          </td>
                          <td className="py-2 text-center text-slate-700">
                            {charge.quantity}
                          </td>
                          <td className="py-2 text-right text-slate-700">
                            LKR {charge.unit_price.toLocaleString()}
                          </td>
                          <td className="py-2 text-right font-medium text-slate-900">
                            LKR {charge.total.toLocaleString()}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="total-section border-t-2 border-slate-200 pt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium text-slate-900">
                    LKR {generatedBill.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Tax (10%)</span>
                  <span className="font-medium text-slate-900">
                    LKR {generatedBill.tax.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-sm font-semibold text-slate-900">
                    Grand Total
                  </span>
                  <span className="grand-total text-xl font-bold text-blue-700">
                    LKR {generatedBill.total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Status */}
              <div className="mt-4 flex items-center justify-between bg-slate-50 rounded-xl p-3">
                <span className="text-xs text-slate-500">
                  Payment Status
                </span>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    generatedBill.payment_status === "paid"
                      ? "bg-green-100 text-green-700"
                      : generatedBill.payment_status === "partial"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {generatedBill.payment_status.toUpperCase()}
                </span>
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
      {!generatedBill && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-5xl mb-4">🧾</div>
          <p className="text-sm font-medium text-slate-900">
            No bill generated yet
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Select a booking above and click &quot;Generate Bill&quot;
          </p>
        </div>
      )}
    </div>
  );
}
