"use client";

import { format } from "date-fns";

interface HeaderProps {
  currentCash: number;
  lastUpdated: string;
  onRefresh: () => void;
  loading: boolean;
}

export default function Header({ currentCash, lastUpdated, onRefresh, loading }: HeaderProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(currentCash);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Today&apos;s Available Cash
          </p>
          <p
            className={`text-5xl font-bold mt-1 ${
              currentCash < 0
                ? "text-red-600"
                : currentCash < 10000
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {formatted}
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          {lastUpdated && (
            <p className="text-xs text-gray-400">
              Last updated:{" "}
              {format(new Date(lastUpdated), "MMM d, yyyy h:mm:ss a")}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
