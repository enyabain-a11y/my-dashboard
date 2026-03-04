import { StripeIncome } from "@/types";
import { addDays, format } from "date-fns";

// TODO: Connect Stripe API or Google Sheet export once available.
// Replace this mock data with real API calls or sheet parsing.
export async function getStripeIncome(): Promise<StripeIncome[]> {
  const today = new Date();

  return [
    {
      id: "pi_mock_001",
      date: format(addDays(today, 2), "yyyy-MM-dd"),
      amount: 12500.0,
      description: "Client Payment - Acme Corp",
      status: "projected",
    },
    {
      id: "pi_mock_002",
      date: format(addDays(today, 7), "yyyy-MM-dd"),
      amount: 8750.0,
      description: "Monthly Retainer - Beta LLC",
      status: "projected",
    },
    {
      id: "pi_mock_003",
      date: format(addDays(today, 14), "yyyy-MM-dd"),
      amount: 22000.0,
      description: "Project Milestone - Gamma Inc",
      status: "projected",
    },
    {
      id: "pi_mock_004",
      date: format(addDays(today, -3), "yyyy-MM-dd"),
      amount: 5000.0,
      description: "Consulting Fee - Delta Co",
      status: "received",
    },
  ];
}
