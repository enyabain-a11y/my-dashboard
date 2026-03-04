"use client";

import { BillSummary } from "@/types";

interface BillsSummaryProps {
  summary: BillSummary;
  onViewBills: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function BillsSummary({ summary, onViewBills }: BillsSummaryProps) {
  const cards = [
    {
      label: "Due This Month",
      amount: summary.thisMonthAmount,
      count: summary.thisMonthCount,
      color: "text-gray-900",
      bg: "bg-white",
      border: "border-gray-200",
    },
    {
      label: "Due Next Month",
      amount: summary.nextMonthAmount,
      count: summary.nextMonthCount,
      color: "text-gray-900",
      bg: "bg-white",
      border: "border-gray-200",
    },
    {
      label: "Total Outstanding",
      amount: summary.totalOutstandingAmount,
      count: summary.totalOutstandingCount,
      color: "text-gray-900",
      bg: "bg-white",
      border: "border-gray-200",
    },
    {
      label: "Overdue",
      amount: summary.overdueAmount,
      count: summary.overdueCount,
      color: summary.overdueCount > 0 ? "text-red-600" : "text-gray-400",
      bg: summary.overdueCount > 0 ? "bg-red-50" : "bg-white",
      border: summary.overdueCount > 0 ? "border-red-200" : "border-gray-200",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-700">Bills Summary</h2>
        <button
          onClick={onViewBills}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          View all bills →
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-xl border ${card.border} px-5 py-4`}
          >
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {card.label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>
              {fmt(card.amount)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {card.count} {card.count === 1 ? "bill" : "bills"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
