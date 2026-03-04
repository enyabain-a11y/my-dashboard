import { NextResponse } from "next/server";
import { getBillcomBills } from "@/lib/billcom";

export async function GET() {
  const bills = await getBillcomBills();
  return NextResponse.json(bills);
}
