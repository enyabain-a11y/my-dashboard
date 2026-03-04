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
  invoice_date?: string;        // ISO string — may be absent for some sources
  due_date: string;             // ISO string
  planned_payment_date: string; // ISO string — derived per source rules
  amount: number;
  status: "scheduled" | "paid" | "pending_approval"; // from source
  paid: boolean;                // effective paid status (source + local overrides)
  source: "billcom" | "quest" | "labcorp";
}

export interface PayrollEntry {
  id: string;            // e.g. "payroll-2026-03-10"
  tabName: string;       // e.g. "SM-10 Mar 2026"
  scheduledDate: string; // yyyy-MM-dd — the nominal 10th or 25th
  paymentDate: string;   // yyyy-MM-dd — adjusted for weekends / holidays
  amount: number;        // Pay Run Total (aggregate only — no individual salaries)
}

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  type: "checking" | "credit_card";
}

export interface BillSummary {
  thisMonthAmount: number;
  thisMonthCount: number;
  nextMonthAmount: number;
  nextMonthCount: number;
  totalOutstandingAmount: number;
  totalOutstandingCount: number;
  overdueAmount: number;
  overdueCount: number;
}

export interface CashFlowDay {
  date: string; // ISO string
  startingCash: number;
  incoming: number;
  outgoing: number;
  netChange: number;
  endingCash: number;
  bills: { bill_id: string; vendor_name: string; amount: number; source: string }[];
  payroll: { id: string; tabName: string; amount: number }[];
}

export interface Settings {
  bankAccounts: BankAccount[];
  lowCashThreshold: number;
  googleSheetsApiKey: string;
  questSpreadsheetId: string;
  labcorpSpreadsheetId: string;
  payrollSpreadsheetId: string;
}

export interface DashboardData {
  currentCash: number;
  bankAccounts: BankAccount[];
  lastUpdated: string;
  cashFlow: CashFlowDay[];
  bills: Bill[];
  billSummary: BillSummary;
  payrollEntries: PayrollEntry[];
  stripeIncome: StripeIncome[];
  settings: Settings;
}
