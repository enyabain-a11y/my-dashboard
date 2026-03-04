"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import BillsSummary from "@/components/BillsSummary";
import CashFlowForecast from "@/components/CashFlowForecast";
import BillsTab from "@/components/BillsTab";
import IncomeExpected from "@/components/IncomeExpected";
import { DashboardData } from "@/types";

const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

type Tab = "overview" | "bills";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    timerRef.current = setInterval(fetchDashboard, REFRESH_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchDashboard]);

  const handleTogglePaid = async (billId: string, paid: boolean) => {
    await fetch("/api/bills", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bill_id: billId, paid }),
    });
    await fetchDashboard();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "bills", label: "Bills" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-base font-semibold text-gray-800">Daily Cash Tracker</h1>
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                  {tab.id === "bills" && data?.billSummary.overdueCount ? (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {data.billSummary.overdueCount}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
          <Link href="/settings" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Settings
          </Link>
        </div>
      </nav>

      {/* Header — always visible */}
      <Header
        currentCash={data?.currentCash ?? 0}
        bankAccounts={data?.bankAccounts ?? []}
        lastUpdated={data?.lastUpdated ?? ""}
        onRefresh={fetchDashboard}
        loading={loading}
      />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-24">
            <div className="text-gray-400 text-sm">Loading dashboard...</div>
          </div>
        )}

        {data && activeTab === "overview" && (
          <>
            {/* Bills summary cards */}
            <BillsSummary
              summary={data.billSummary}
              onViewBills={() => setActiveTab("bills")}
            />

            {/* Overdue alert */}
            {data.billSummary.overdueCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-red-500 text-lg">⚠</span>
                  <div>
                    <p className="text-sm font-semibold text-red-700">
                      {data.billSummary.overdueCount} overdue{" "}
                      {data.billSummary.overdueCount === 1 ? "bill" : "bills"}
                    </p>
                    <p className="text-xs text-red-500 mt-0.5">
                      {fmt(data.billSummary.overdueAmount)} in unpaid bills past their planned
                      payment date
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("bills")}
                  className="shrink-0 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                >
                  Review bills →
                </button>
              </div>
            )}

            {/* 90-day forecast */}
            <CashFlowForecast
              cashFlow={data.cashFlow}
              lowCashThreshold={data.settings.lowCashThreshold}
            />

            {/* Income */}
            <IncomeExpected income={data.stripeIncome} />
          </>
        )}

        {data && activeTab === "bills" && (
          <BillsTab bills={data.bills} onTogglePaid={handleTogglePaid} />
        )}
      </main>
    </div>
  );
}
