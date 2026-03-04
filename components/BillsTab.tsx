"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { Bill } from "@/types";

interface BillsTabProps {
  bills: Bill[];
  onTogglePaid: (billId: string, paid: boolean) => Promise<void>;
}

const SOURCE_LABELS: Record<string, string> = {
  billcom: "Bill.com",
  quest: "Quest",
  labcorp: "LabCorp",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

function fmtDate(d: string | undefined): string {
  if (!d) return "—";
  try {
    return format(parseISO(d), "MMM d, yyyy");
  } catch {
    return d;
  }
}

export default function BillsTab({ bills, onTogglePaid }: BillsTabProps) {
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorSelected, setVendorSelected] = useState(""); // exact match when an option is picked
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [monthFilter, setMonthFilter] = useState("all");
  const [toggling, setToggling] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Unique vendor names from all bills, sorted
  const allVendors = useMemo(() => {
    const seen = new Set<string>();
    bills.forEach((b) => seen.add(b.vendor_name));
    return [...seen].sort();
  }, [bills]);

  // Vendors shown in dropdown — filtered by current search text
  const dropdownVendors = useMemo(() => {
    if (!vendorSearch) return allVendors;
    return allVendors.filter((v) =>
      v.toLowerCase().includes(vendorSearch.toLowerCase())
    );
  }, [allVendors, vendorSearch]);

  // Unique planned-payment months across all bills
  const months = useMemo(() => {
    const seen = new Set<string>();
    bills.forEach((b) => {
      if (b.planned_payment_date) seen.add(b.planned_payment_date.slice(0, 7));
    });
    return [...seen].sort();
  }, [bills]);

  // Active vendor filter: if user picked from dropdown, use exact match; otherwise substring search
  const effectiveVendorFilter = vendorSelected || vendorSearch;

  const filtered = useMemo(() => {
    return bills
      .filter((b) => {
        if (effectiveVendorFilter) {
          if (vendorSelected) {
            if (b.vendor_name !== vendorSelected) return false;
          } else {
            if (!b.vendor_name.toLowerCase().includes(vendorSearch.toLowerCase())) return false;
          }
        }
        if (monthFilter !== "all" && !b.planned_payment_date.startsWith(monthFilter)) return false;
        return true;
      })
      .sort((a, b) => {
        const aOverdue = !a.paid && a.planned_payment_date < today;
        const bOverdue = !b.paid && b.planned_payment_date < today;
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        return a.planned_payment_date.localeCompare(b.planned_payment_date);
      });
  }, [bills, effectiveVendorFilter, vendorSelected, vendorSearch, monthFilter, today]);

  const handleSelectVendor = (vendor: string) => {
    setVendorSelected(vendor);
    setVendorSearch(vendor);
    setDropdownOpen(false);
  };

  const handleClearVendor = () => {
    setVendorSelected("");
    setVendorSearch("");
    setDropdownOpen(false);
  };

  const handleVendorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVendorSearch(e.target.value);
    setVendorSelected(""); // clear exact selection when user types
    setDropdownOpen(true);
  };

  const handleToggle = async (bill: Bill) => {
    setToggling(bill.bill_id);
    try {
      await onTogglePaid(bill.bill_id, !bill.paid);
    } finally {
      setToggling(null);
    }
  };

  const totalUnpaid = filtered.filter((b) => !b.paid).reduce((s, b) => s + b.amount, 0);
  const overdueCount = filtered.filter((b) => !b.paid && b.planned_payment_date < today).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header + filters */}
      <div className="px-6 py-4 border-b border-gray-200 space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">All Bills</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.filter((b) => !b.paid).length} unpaid &bull; {fmt(totalUnpaid)}
            {overdueCount > 0 && (
              <span className="ml-2 text-red-600 font-medium">&bull; {overdueCount} overdue</span>
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Searchable vendor dropdown */}
          <div ref={dropdownRef} className="relative flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="All vendors"
                value={vendorSearch}
                onChange={handleVendorInputChange}
                onFocus={() => setDropdownOpen(true)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {vendorSearch ? (
                <button
                  type="button"
                  onClick={handleClearVendor}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  ✕
                </button>
              ) : (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">
                  ▾
                </span>
              )}
            </div>

            {dropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                <button
                  type="button"
                  onClick={handleClearVendor}
                  className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 border-b border-gray-100"
                >
                  All vendors
                </button>
                {dropdownVendors.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-400">No vendors match</div>
                )}
                {dropdownVendors.map((vendor) => (
                  <button
                    key={vendor}
                    type="button"
                    onClick={() => handleSelectVendor(vendor)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 ${
                      vendor === vendorSelected ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                    }`}
                  >
                    {vendor}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Month filter */}
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {format(parseISO(`${m}-01`), "MMMM yyyy")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Invoice Date</th>
              <th className="px-4 py-3 text-left">Due Date</th>
              <th className="px-4 py-3 text-left">Planned Payment</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-center">Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  No bills match your filters
                </td>
              </tr>
            )}
            {filtered.map((bill) => {
              const overdue = !bill.paid && bill.planned_payment_date < today;
              return (
                <tr
                  key={bill.bill_id}
                  className={`${
                    bill.paid
                      ? "opacity-50"
                      : overdue
                      ? "bg-red-50 hover:bg-red-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {SOURCE_LABELS[bill.source] || bill.source}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <span className={bill.paid ? "line-through" : ""}>{bill.vendor_name}</span>
                    {overdue && (
                      <span className="ml-2 text-xs font-normal text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                        Overdue
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {fmtDate(bill.invoice_date)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {fmtDate(bill.due_date)}
                  </td>
                  <td
                    className={`px-4 py-3 whitespace-nowrap font-medium ${
                      overdue ? "text-red-600" : "text-gray-700"
                    }`}
                  >
                    {fmtDate(bill.planned_payment_date)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                    {fmt(bill.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(bill)}
                      disabled={toggling === bill.bill_id}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                        bill.paid
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {toggling === bill.bill_id ? "..." : bill.paid ? "Paid" : "Unpaid"}
                    </button>
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
