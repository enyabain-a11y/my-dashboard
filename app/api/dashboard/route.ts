import { NextResponse } from "next/server";
import { format, addMonths } from "date-fns";
import { getSettings, getBillPaidOverrides } from "@/lib/db";
import { getStripeIncome } from "@/lib/stripe";
import { getBillcomBills } from "@/lib/billcom";
import { getGoogleSheetBills } from "@/lib/googleSheets";
import { getPayrollEntries } from "@/lib/payroll";
import { buildCashFlow } from "@/lib/cashflow";
import { BillSummary, DashboardData } from "@/types";

export async function GET() {
  const settings = getSettings();
  const overrides = getBillPaidOverrides();

  const [stripeIncome, billcomBills, sheetBills, payrollEntries] = await Promise.all([
    getStripeIncome(),
    getBillcomBills(),
    getGoogleSheetBills(),
    getPayrollEntries(settings.payrollSpreadsheetId, 30),
  ]);

  // Merge local paid overrides into all bills
  const allBills = [...billcomBills, ...sheetBills].map((b) => ({
    ...b,
    paid: overrides[b.bill_id] !== undefined ? overrides[b.bill_id] : b.paid,
  }));

  const totalCash = settings.bankAccounts.reduce(
    (sum, a) => sum + (a.type === "credit_card" ? -a.balance : a.balance),
    0
  );

  const cashFlow = buildCashFlow(totalCash, stripeIncome, allBills, payrollEntries, 30);

  // Bill summary
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const thisMonthPrefix = format(today, "yyyy-MM");
  const nextMonthPrefix = format(addMonths(today, 1), "yyyy-MM");

  const unpaidBills = allBills.filter((b) => !b.paid);

  const billSummary: BillSummary = {
    thisMonthAmount: unpaidBills
      .filter((b) => b.planned_payment_date.startsWith(thisMonthPrefix))
      .reduce((s, b) => s + b.amount, 0),
    thisMonthCount: unpaidBills.filter((b) =>
      b.planned_payment_date.startsWith(thisMonthPrefix)
    ).length,
    nextMonthAmount: unpaidBills
      .filter((b) => b.planned_payment_date.startsWith(nextMonthPrefix))
      .reduce((s, b) => s + b.amount, 0),
    nextMonthCount: unpaidBills.filter((b) =>
      b.planned_payment_date.startsWith(nextMonthPrefix)
    ).length,
    totalOutstandingAmount: unpaidBills.reduce((s, b) => s + b.amount, 0),
    totalOutstandingCount: unpaidBills.length,
    overdueAmount: unpaidBills
      .filter((b) => b.planned_payment_date && b.planned_payment_date < todayStr)
      .reduce((s, b) => s + b.amount, 0),
    overdueCount: unpaidBills.filter(
      (b) => b.planned_payment_date && b.planned_payment_date < todayStr
    ).length,
  };

  const data: DashboardData = {
    currentCash: totalCash,
    bankAccounts: settings.bankAccounts,
    lastUpdated: new Date().toISOString(),
    cashFlow,
    bills: allBills,
    billSummary,
    payrollEntries,
    stripeIncome,
    settings,
  };

  return NextResponse.json(data);
}
