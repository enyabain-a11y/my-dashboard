"use client";

import { StripeIncome } from "@/types";
import { format, parseISO } from "date-fns";

interface IncomeExpectedProps {
  income: StripeIncome[];
}

const STATUS_BADGE: Record<string, string> = {
  projected: "bg-blue-100 text-blue-700",
  received: "bg-green-100 text-green-700",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function IncomeExpected({ income }: IncomeExpectedProps) {
  const sorted = [...income].sort((a, b) => a.date.localeCompare(b.date));
  const totalProjected = income
    .filter((i) => i.status === "projected")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Income Expected</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Stripe projected receivables &bull;{" "}
              <span className="text-green-700 font-medium">{fmt(totalProjected)} incoming</span>
            </p>
          </div>
          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md font-medium">
            Stripe placeholder
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Expected Date</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No income data available
                </td>
              </tr>
            )}
            {sorted.map((item) => (
              <tr
                key={item.id}
                className={`hover:bg-gray-50 ${item.status === "received" ? "opacity-60" : ""}`}
              >
                <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                  {format(parseISO(item.date), "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{item.description}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-green-700">
                  +{fmt(item.amount)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_BADGE[item.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          {/* TODO: Connect Stripe API or Google Sheet import to populate live data */}
          Placeholder data — connect Stripe API or import from Google Sheet to show live receivables
        </p>
      </div>
    </div>
  );
}
