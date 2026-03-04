"use client";

import { useState } from "react";
import { Bill } from "@/types";
import { format, parseISO, isPast } from "date-fns";

interface BillsDueProps {
  bills: Bill[];
}

type Source = "all" | "billcom" | "quest" | "labcorp";

const SOURCE_LABELS: Record<string, string> = {
  billcom: "Bill.com",
  quest: "Quest Diagnostics",
  labcorp: "LabCorp",
};

const STATUS_BADGE: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  pending_approval: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function BillsDue({ bills }: BillsDueProps) {
  const [filter, setFilter] = useState<Source>("all");

  const filtered = bills
    .filter((b) => filter === "all" || b.source === filter)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const unpaid = filtered.filter((b) => b.status !== "paid");
  const paid = filtered.filter((b) => b.status === "paid");
  const displayBills = [...unpaid, ...paid];

  const totalUnpaid = unpaid.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Bills Due</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {unpaid.length} upcoming &bull; {fmt(totalUnpaid)} total
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "billcom", "quest", "labcorp"] as Source[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "all" ? "All" : SOURCE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Vendor / Description</th>
              <th className="px-4 py-3 text-left">Due Date</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayBills.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No bills found
                </td>
              </tr>
            )}
            {displayBills.map((bill) => {
              const overdue =
                bill.status !== "paid" && isPast(parseISO(bill.due_date));
              return (
                <tr
                  key={bill.bill_id}
                  className={`${
                    bill.status === "paid" ? "opacity-50" : ""
                  } ${overdue ? "bg-red-50" : "hover:bg-gray-50"}`}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">
                    {SOURCE_LABELS[bill.source] || bill.source}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {bill.vendor_name}
                    {overdue && (
                      <span className="ml-2 text-xs text-red-600 font-normal">Overdue</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                    {bill.due_date
                      ? format(parseISO(bill.due_date), "MMM d, yyyy")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {fmt(bill.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_BADGE[bill.status] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {bill.status.replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
