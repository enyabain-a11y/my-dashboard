export interface StripeIncome {
  id: string;
  date: string; // ISO string
  amount: number;
  description: string;
  status: "projected" | "received";
}

export interface Bill {
  bill_id: string;
  vendor_name: string;
  due_date: string; // ISO string
  amount: number;
  status: "scheduled" | "paid" | "pending_approval";
  source: "billcom" | "quest" | "labcorp";
}

export interface CashFlowDay {
  date: string; // ISO string
  startingCash: number;
  incoming: number;
  outgoing: number;
  netChange: number;
  endingCash: number;
}

export interface Settings {
  currentCashBalance: number;
  lowCashThreshold: number;
  googleSheetsApiKey: string;
  questSpreadsheetId: string;
  labcorpSpreadsheetId: string;
}

export interface DashboardData {
  currentCash: number;
  lastUpdated: string;
  cashFlow: CashFlowDay[];
  bills: Bill[];
  stripeIncome: StripeIncome[];
  settings: Settings;
}
