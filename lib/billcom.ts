import { Bill } from "@/types";
import { addDays, subDays, format } from "date-fns";
import { computePlannedPaymentDate } from "@/lib/plannedPayment";

// TODO: Connect Bill.com API
// Bill.com uses OAuth 2.0. You will need:
//   - BILLCOM_CLIENT_ID (from .env)
//   - BILLCOM_CLIENT_SECRET (from .env)
//   - BILLCOM_ORG_ID (from .env)
//   - BILLCOM_SESSION_ID (obtained via OAuth token exchange)
//
// OAuth flow:
//   POST https://gateway.bill.com/connect/oauth2/token
//   with client_id, client_secret, grant_type=client_credentials
//
// Then use the session token to call:
//   GET https://gateway.bill.com/connect/v3/bills
//
// Each bill in the response includes a processDate field — use that as the
// Planned Payment Date via computePlannedPaymentDate("billcom", due_date, process_date).
//
// Reference: https://developer.bill.com/docs/oauth-2-0

export async function getBillcomBills(): Promise<Bill[]> {
  // TODO: Replace mock data with live Bill.com API call
  const today = new Date();

  const mocks: Array<{
    bill_id: string;
    vendor_name: string;
    invoice_date: string;
    due_date: string;
    process_date: string;
    amount: number;
    status: Bill["status"];
  }> = [
    {
      bill_id: "bill_mock_001",
      vendor_name: "Office Supplies Co",
      invoice_date: format(subDays(today, 27), "yyyy-MM-dd"),
      due_date: format(addDays(today, 3), "yyyy-MM-dd"),
      process_date: format(addDays(today, 1), "yyyy-MM-dd"),
      amount: 847.5,
      status: "scheduled",
    },
    {
      bill_id: "bill_mock_002",
      vendor_name: "Cloud Hosting Services",
      invoice_date: format(subDays(today, 25), "yyyy-MM-dd"),
      due_date: format(addDays(today, 5), "yyyy-MM-dd"),
      process_date: format(addDays(today, 3), "yyyy-MM-dd"),
      amount: 2340.0,
      status: "pending_approval",
    },
    {
      bill_id: "bill_mock_003",
      vendor_name: "Marketing Agency",
      invoice_date: format(subDays(today, 20), "yyyy-MM-dd"),
      due_date: format(addDays(today, 10), "yyyy-MM-dd"),
      process_date: format(addDays(today, 8), "yyyy-MM-dd"),
      amount: 5000.0,
      status: "scheduled",
    },
    {
      bill_id: "bill_mock_004",
      vendor_name: "Software Licenses",
      invoice_date: format(subDays(today, 15), "yyyy-MM-dd"),
      due_date: format(addDays(today, 15), "yyyy-MM-dd"),
      process_date: format(addDays(today, 13), "yyyy-MM-dd"),
      amount: 1200.0,
      status: "scheduled",
    },
    {
      bill_id: "bill_mock_005",
      vendor_name: "Utilities",
      invoice_date: format(subDays(today, 35), "yyyy-MM-dd"),
      due_date: format(subDays(today, 5), "yyyy-MM-dd"),
      process_date: format(subDays(today, 7), "yyyy-MM-dd"),
      amount: 650.0,
      status: "paid",
    },
    {
      bill_id: "bill_mock_006",
      vendor_name: "Insurance Premium",
      invoice_date: format(subDays(today, 45), "yyyy-MM-dd"),
      due_date: format(subDays(today, 10), "yyyy-MM-dd"),
      process_date: format(subDays(today, 12), "yyyy-MM-dd"),
      amount: 3200.0,
      status: "scheduled", // overdue and unpaid — for testing overdue indicator
    },
  ];

  return mocks.map((m) => ({
    bill_id: m.bill_id,
    vendor_name: m.vendor_name,
    invoice_date: m.invoice_date,
    due_date: m.due_date,
    planned_payment_date: computePlannedPaymentDate("billcom", m.due_date, m.process_date),
    amount: m.amount,
    status: m.status,
    paid: m.status === "paid",
    source: "billcom" as const,
  }));
}
