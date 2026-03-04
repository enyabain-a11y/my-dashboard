"use client";

import { format } from "date-fns";
import { BankAccount } from "@/types";

interface HeaderProps {
  currentCash: number;
  bankAccounts: BankAccount[];
  lastUpdated: string;
  onRefresh: () => void;
  loading: boolean;
}

export default function Header({ currentCash, bankAccounts, lastUpdated, onRefresh, loading }: HeaderProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const checking = bankAccounts.filter((a) => a.type === "checking");
  const creditCards = bankAccounts.filter((a) => a.type === "credit_card");

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">

        {/* Net Cash */}
        <div className="shrink-0">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Net Cash Balance
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
            {fmt(currentCash)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Checking − Credit Cards</p>
        </div>

        {/* Account breakdown */}
        <div className="flex flex-col sm:flex-row gap-6 flex-1">
          {checking.length > 0 && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Checking Accounts
              </p>
              <div className="space-y-1">
                {checking.map((a) => (
                  <div key={a.id} className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-gray-600 truncate">{a.name}</span>
                    <span className="text-sm font-medium text-gray-800 tabular-nums shrink-0">
                      {fmt(a.balance)}
                    </span>
                  </div>
                ))}
                {checking.length > 1 && (
                  <div className="flex items-baseline justify-between gap-4 pt-1 border-t border-gray-100">
                    <span className="text-xs text-gray-400">Total</span>
                    <span className="text-xs font-semibold text-gray-600 tabular-nums">
                      {fmt(checking.reduce((s, a) => s + a.balance, 0))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {creditCards.length > 0 && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Credit Cards
              </p>
              <div className="space-y-1">
                {creditCards.map((a) => (
                  <div key={a.id} className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-gray-600 truncate">{a.name}</span>
                    <span className="text-sm font-medium text-red-600 tabular-nums shrink-0">
                      ({fmt(a.balance)})
                    </span>
                  </div>
                ))}
                {creditCards.length > 1 && (
                  <div className="flex items-baseline justify-between gap-4 pt-1 border-t border-gray-100">
                    <span className="text-xs text-gray-400">Total</span>
                    <span className="text-xs font-semibold text-red-500 tabular-nums">
                      ({fmt(creditCards.reduce((s, a) => s + a.balance, 0))})
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Refresh */}
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
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
