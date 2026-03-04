import { NextResponse } from "next/server";
import { getSettings } from "@/lib/db";
import { getStripeIncome } from "@/lib/stripe";
import { getBillcomBills } from "@/lib/billcom";
import { getGoogleSheetBills } from "@/lib/googleSheets";
import { buildCashFlow } from "@/lib/cashflow";
import { DashboardData } from "@/types";

export async function GET() {
  const settings = getSettings();

  const [stripeIncome, billcomBills, sheetBills] = await Promise.all([
    getStripeIncome(),
    getBillcomBills(),
    getGoogleSheetBills(),
  ]);

  const allBills = [...billcomBills, ...sheetBills];
  const cashFlow = buildCashFlow(settings.currentCashBalance, stripeIncome, allBills);

  const data: DashboardData = {
    currentCash: settings.currentCashBalance,
    lastUpdated: new Date().toISOString(),
    cashFlow,
    bills: allBills,
    stripeIncome,
    settings,
  };

  return NextResponse.json(data);
}
