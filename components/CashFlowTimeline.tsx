"use client";

import { CashFlowDay } from "@/types";
import { format, parseISO } from "date-fns";

interface CashFlowTimelineProps {
  cashFlow: CashFlowDay[];
  lowCashThreshold: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

function rowColor(endingCash: number, threshold: number): string {
  if (endingCash < 0) return "bg-red-50 text-red-900";
  if (endingCash < threshold) return "bg-yellow-50 text-yellow-900";
  return "bg-green-50 text-green-900";
}

function rowIndicator(endingCash: number, threshold: number): string {
  if (endingCash < 0) return "bg-red-400";
  if (endingCash < threshold) return "bg-yellow-400";
  return "bg-green-400";
}

export default function CashFlowTimeline({ cashFlow, lowCashThreshold }: CashFlowTimelineProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">30-Day Cash Flow Timeline</h2>
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> Healthy
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /> Low (below threshold)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Negative
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left w-4"></th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-right">Starting Cash</th>
              <th className="px-4 py-3 text-right">Incoming</th>
              <th className="px-4 py-3 text-right">Outgoing</th>
              <th className="px-4 py-3 text-right">Net Change</th>
              <th className="px-4 py-3 text-right font-semibold">Ending Cash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cashFlow.map((day, i) => (
              <tr key={day.date} className={`${rowColor(day.endingCash, lowCashThreshold)} ${i === 0 ? "font-semibold" : ""}`}>
                <td className="pl-4 py-2">
                  <span
                    className={`w-2 h-2 rounded-full inline-block ${rowIndicator(day.endingCash, lowCashThreshold)}`}
                  />
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {format(parseISO(day.date), "EEE, MMM d")}
                  {i === 0 && <span className="ml-2 text-xs font-normal opacity-60">(today)</span>}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{fmt(day.startingCash)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-green-700">
                  {day.incoming > 0 ? `+${fmt(day.incoming)}` : "—"}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-red-700">
                  {day.outgoing > 0 ? `-${fmt(day.outgoing)}` : "—"}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  <span className={day.netChange >= 0 ? "text-green-700" : "text-red-700"}>
                    {day.netChange >= 0 ? "+" : ""}
                    {fmt(day.netChange)}
                  </span>
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-semibold">{fmt(day.endingCash)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
