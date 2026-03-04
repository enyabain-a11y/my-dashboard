import { NextResponse } from "next/server";
import { setBillPaidOverride } from "@/lib/db";

export async function PATCH(request: Request) {
  const body = await request.json();
  const { bill_id, paid } = body;

  if (!bill_id || typeof paid !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  setBillPaidOverride(bill_id, paid);
  return NextResponse.json({ bill_id, paid });
}
