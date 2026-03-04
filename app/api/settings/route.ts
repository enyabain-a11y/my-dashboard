import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/db";

export async function GET() {
  const settings = getSettings();
  // Never return the raw API key — mask it
  return NextResponse.json({
    ...settings,
    googleSheetsApiKey: settings.googleSheetsApiKey ? "***" : "",
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const updated = saveSettings(body);
  return NextResponse.json({
    ...updated,
    googleSheetsApiKey: updated.googleSheetsApiKey ? "***" : "",
  });
}
