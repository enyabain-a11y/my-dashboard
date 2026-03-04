"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { CashFlowDay } from "@/types";

interface CashFlowForecastProps {
  cashFlow: CashFlowDay[];
  lowCashThreshold: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

function fmtAxis(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function rowColor(endingCash: number, threshold: number): string {
  if (endingCash < 0) return "bg-red-50";
  if (endingCash < threshold) return "bg-yellow-50";
  return "";
}

function balanceColor(endingCash: number, threshold: number): string {
  if (endingCash < 0) return "text-red-600";
  if (endingCash < threshold) return "text-yellow-600";
  return "text-gray-900";
}

export default function CashFlowForecast({ cashFlow, lowCashThreshold }: CashFlowForecastProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">30-Day Cash Flow Forecast</h2>
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Below threshold
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Negative
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 pt-4 pb-2" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cashFlow} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => format(parseISO(d), "MMM d")}
              interval={13}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmtAxis}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={68}
            />
            <Tooltip
              formatter={(value: number | undefined) => [value != null ? fmt(value) : "—", "Balance"]}
              labelFormatter={(d: unknown) => {
                try { return format(parseISO(String(d)), "MMMM d, yyyy"); } catch { return String(d); }
              }}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1} />
            {lowCashThreshold > 0 && (
              <ReferenceLine
                y={lowCashThreshold}
                stroke="#f59e0b"
                strokeDasharray="4 2"
                strokeWidth={1}
                label={{ value: "Threshold", position: "insideTopRight", fontSize: 10, fill: "#f59e0b" }}
              />
            )}
            <Area
              type="monotone"
              dataKey="endingCash"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#cashGrad)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Table — scrollable, shows all 90 days */}
      <div className="border-t border-gray-100 overflow-x-auto">
        <div className="overflow-y-auto max-h-80">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-2 text-left font-medium">Date</th>
                <th className="px-4 py-2 text-left font-medium">Payments Due</th>
                <th className="px-4 py-2 text-right font-medium">Outgoing</th>
                <th className="px-4 py-2 text-right font-medium">Incoming</th>
                <th className="px-4 py-2 text-right font-medium">Ending Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cashFlow.map((day, i) => {
                const hasActivity = day.outgoing > 0 || day.incoming > 0;
                return (
                  <tr
                    key={day.date}
                    className={`${rowColor(day.endingCash, lowCashThreshold)} ${
                      !hasActivity && i > 0 ? "opacity-40" : ""
                    }`}
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                      {format(parseISO(day.date), "EEE, MMM d")}
                      {i === 0 && (
                        <span className="ml-1 text-blue-500 text-xs">(today)</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600 max-w-xs">
                      {day.bills.length === 0 && day.payroll.length === 0 && "—"}
                      {day.bills.map((b) => (
                        <span key={b.bill_id} className="inline-block mr-2">
                          {b.vendor_name}{" "}
                          <span className="text-red-500">({fmt(b.amount)})</span>
                        </span>
                      ))}
                      {day.payroll.map((p) => (
                        <span key={p.id} className="inline-block mr-2">
                          <span className="text-purple-600 font-medium">Payroll</span>{" "}
                          <span className="text-gray-400 text-xs">{p.tabName}</span>{" "}
                          <span className="text-red-500">({fmt(p.amount)})</span>
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-red-600">
                      {day.outgoing > 0 ? `−${fmt(day.outgoing)}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-green-600">
                      {day.incoming > 0 ? `+${fmt(day.incoming)}` : "—"}
                    </td>
                    <td
                      className={`px-4 py-2 text-right tabular-nums font-semibold ${balanceColor(
                        day.endingCash,
                        lowCashThreshold
                      )}`}
                    >
                      {fmt(day.endingCash)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
