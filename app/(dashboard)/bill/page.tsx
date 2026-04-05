"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../../utils/api";
import toast from "react-hot-toast";

interface BillItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface BillRequest {
  id: number;
  table_number: string | null;
  room: string | null;
  customer_name: string;
  items: BillItem[];
  subtotal: number;
  service_charge: number;
  total: number;
  status: string;
  created_at: string;
}

export default function ManagerBillsPage() {
  const queryClient = useQueryClient();
  const [selectedBill, setSelectedBill] = useState<BillRequest | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [amountReceived, setAmountReceived] = useState("");

  // Fetch bill requests
  const { data: bills = [], isLoading } = useQuery<BillRequest[]>({
    queryKey: ["manager-bills"],
    queryFn: async () => {
      const res = await apiClient.get("/api/staff/manager/bills/");
      return res.data.data || [];
    },
    refetchInterval: 5000,
  });

  // Process payment
  const payMutation = useMutation({
    mutationFn: (data: { orderId: number; payment_method: string; amount_received: number }) =>
      apiClient.post(`/api/staff/manager/bills/${data.orderId}/pay/`, {
        payment_method: data.payment_method,
        amount_received: data.amount_received,
      }),
    onSuccess: (res) => {
      const data = res.data.data;
      toast.success(`Payment processed! Change: LKR ${data.change.toLocaleString()}`);
      queryClient.invalidateQueries({ queryKey: ["manager-bills"] });
      setSelectedBill(null);
      setAmountReceived("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Payment failed");
    },
  });

  const handlePayment = () => {
    if (!selectedBill) return;
    
    const amount = parseFloat(amountReceived) || 0;
    
    if (paymentMethod === "cash" && amount < selectedBill.total) {
      toast.error(`Insufficient amount. Need LKR ${selectedBill.total.toLocaleString()}`);
      return;
    }

    payMutation.mutate({
      orderId: selectedBill.id,
      payment_method: paymentMethod,
      amount_received: paymentMethod === "cash" ? amount : selectedBill.total,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">💳 Bill Management</h1>
        <p className="text-gray-600">Process customer bills</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Pending Bills</p>
          <p className="text-3xl font-bold text-orange-600">{bills.length}</p>
        </div>
      </div>

      {/* Bills List */}
      {bills.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow">
          <span className="text-6xl">✅</span>
          <p className="mt-4 text-lg text-gray-500">No pending bills</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className="rounded-xl bg-white p-4 shadow-md transition hover:shadow-lg"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{bill.table_number ? "🪑" : "🏨"}</span>
                  <div>
                    <p className="font-bold">
                      {bill.table_number ? `Table ${bill.table_number}` : `Room ${bill.room}`}
                    </p>
                    <p className="text-xs text-gray-500">{bill.customer_name}</p>
                  </div>
                </div>
                <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-800">
                  Bill Requested
                </span>
              </div>

              {/* Items */}
              <div className="mb-3 space-y-1 border-t border-b py-2">
                {bill.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span className="font-medium">{item.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{bill.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Service (10%)</span>
                  <span>{bill.service_charge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-1 text-lg font-bold">
                  <span>Total</span>
                  <span className="text-indigo-600">LKR {bill.total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedBill(bill);
                  setAmountReceived("");
                }}
                className="mt-4 w-full rounded-lg bg-indigo-500 py-2 font-bold text-white hover:bg-indigo-600"
              >
                💳 Process Payment
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold">💳 Process Payment</h2>

            {/* Bill Summary */}
            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <p className="font-bold">
                {selectedBill.table_number
                  ? `Table ${selectedBill.table_number}`
                  : `Room ${selectedBill.room}`}
              </p>
              <p className="mt-2 text-3xl font-bold text-indigo-600">
                LKR {selectedBill.total.toLocaleString()}
              </p>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-gray-600">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`rounded-lg p-3 text-center font-bold transition ${
                    paymentMethod === "cash"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  💵 Cash
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`rounded-lg p-3 text-center font-bold transition ${
                    paymentMethod === "card"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  💳 Card
                </button>
              </div>
            </div>

            {/* Cash Amount */}
            {paymentMethod === "cash" && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-semibold text-gray-600">Amount Received</p>
                <input
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full rounded-lg border-2 border-gray-200 p-3 text-xl font-bold outline-none focus:border-indigo-400"
                />
                {amountReceived && parseFloat(amountReceived) >= selectedBill.total && (
                  <p className="mt-2 text-lg font-bold text-green-600">
                    Change: LKR {(parseFloat(amountReceived) - selectedBill.total).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Quick Amount Buttons */}
            {paymentMethod === "cash" && (
              <div className="mb-4 grid grid-cols-4 gap-2">
                {[1000, 2000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmountReceived(String(amt))}
                    className="rounded-lg bg-gray-100 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedBill(null)}
                className="flex-1 rounded-xl bg-gray-100 py-3 font-semibold text-gray-600 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={payMutation.isPending}
                className="flex-1 rounded-xl bg-green-500 py-3 font-semibold text-white hover:bg-green-600 disabled:opacity-50"
              >
                {payMutation.isPending ? "Processing..." : "✓ Complete Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}