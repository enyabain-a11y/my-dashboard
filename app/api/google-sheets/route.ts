import { NextResponse } from "next/server";
import { getGoogleSheetBills } from "@/lib/googleSheets";

export async function GET() {
  const bills = await getGoogleSheetBills();
  return NextResponse.json(bills);
}
