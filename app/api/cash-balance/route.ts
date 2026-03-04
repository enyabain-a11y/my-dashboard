import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/db";

export async function GET() {
  const settings = getSettings();
  return NextResponse.json({ currentCashBalance: settings.currentCashBalance });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { currentCashBalance } = body;

  if (typeof currentCashBalance !== "number") {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const settings = saveSettings({ currentCashBalance });
  return NextResponse.json({ currentCashBalance: settings.currentCashBalance });
}
