import { NextResponse } from "next/server";
import { getSettings } from "@/lib/db";

export async function GET() {
  const settings = getSettings();
  const total = settings.bankAccounts.reduce((sum, a) => sum + a.balance, 0);
  return NextResponse.json({ currentCashBalance: total, bankAccounts: settings.bankAccounts });
}
