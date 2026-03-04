import { Bill } from "@/types";
import { addDays, format } from "date-fns";

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
// Reference: https://developer.bill.com/docs/oauth-2-0

export async function getBillcomBills(): Promise<Bill[]> {
  // TODO: Replace mock data with live Bill.com API call
  // Example API call structure:
  //
  // const response = await fetch("https://gateway.bill.com/connect/v3/bills", {
  //   headers: {
  //     Authorization: `Bearer ${process.env.BILLCOM_SESSION_ID}`,
  //     "X-Bill-Org-Id": process.env.BILLCOM_ORG_ID!,
  //   },
  // });
  // const data = await response.json();
  // return data.bills.map(mapBillcomBill);

  const today = new Date();

  return [
    {
      bill_id: "bill_mock_001",
      vendor_name: "Office Supplies Co",
      due_date: format(addDays(today, 3), "yyyy-MM-dd"),
      amount: 847.5,
      status: "scheduled",
      source: "billcom",
    },
    {
      bill_id: "bill_mock_002",
      vendor_name: "Cloud Hosting Services",
      due_date: format(addDays(today, 5), "yyyy-MM-dd"),
      amount: 2340.0,
      status: "pending_approval",
      source: "billcom",
    },
    {
      bill_id: "bill_mock_003",
      vendor_name: "Marketing Agency",
      due_date: format(addDays(today, 10), "yyyy-MM-dd"),
      amount: 5000.0,
      status: "scheduled",
      source: "billcom",
    },
    {
      bill_id: "bill_mock_004",
      vendor_name: "Software Licenses",
      due_date: format(addDays(today, 15), "yyyy-MM-dd"),
      amount: 1200.0,
      status: "scheduled",
      source: "billcom",
    },
    {
      bill_id: "bill_mock_005",
      vendor_name: "Utilities",
      due_date: format(addDays(today, -2), "yyyy-MM-dd"),
      amount: 650.0,
      status: "paid",
      source: "billcom",
    },
  ];
}
