"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import CashFlowTimeline from "@/components/CashFlowTimeline";
import BillsDue from "@/components/BillsDue";
import IncomeExpected from "@/components/IncomeExpected";
import { DashboardData } from "@/types";

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setData(json);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-800">Daily Cash Tracker</h1>
          <Link
            href="/settings"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Settings
          </Link>
        </div>
      </nav>

      {/* Header */}
      <Header
        currentCash={data?.currentCash ?? 0}
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

        {data && (
          <>
            <CashFlowTimeline
              cashFlow={data.cashFlow}
              lowCashThreshold={data.settings.lowCashThreshold}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BillsDue bills={data.bills} />
              <IncomeExpected income={data.stripeIncome} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
