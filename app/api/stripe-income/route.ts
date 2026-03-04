import { NextResponse } from "next/server";
import { getStripeIncome } from "@/lib/stripe";

export async function GET() {
  const income = await getStripeIncome();
  return NextResponse.json(income);
}
