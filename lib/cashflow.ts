import { addDays, format, startOfDay } from "date-fns";
import { Bill, CashFlowDay, PayrollEntry, StripeIncome } from "@/types";

export function buildCashFlow(
  startingCash: number,
  stripeIncome: StripeIncome[],
  bills: Bill[],
  payrollEntries: PayrollEntry[],
  days = 30
): CashFlowDay[] {
  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");
  const cashFlow: CashFlowDay[] = [];
  let runningBalance = startingCash;

  const projectedIncome = stripeIncome.filter((s) => s.status === "projected");

  // Only unpaid bills with a planned payment date on or after today
  const scheduledBills = bills.filter(
    (b) => !b.paid && b.planned_payment_date && b.planned_payment_date >= todayStr
  );

  for (let i = 0; i < days; i++) {
    const date = addDays(today, i);
    const dateStr = format(date, "yyyy-MM-dd");

    const dayIncoming = projectedIncome
      .filter((s) => s.date.startsWith(dateStr))
      .reduce((sum, s) => sum + s.amount, 0);

    const dayBills = scheduledBills.filter((b) => b.planned_payment_date.startsWith(dateStr));
    const dayPayroll = payrollEntries.filter((p) => p.paymentDate.startsWith(dateStr));

    const dayOutgoing =
      dayBills.reduce((sum, b) => sum + b.amount, 0) +
      dayPayroll.reduce((sum, p) => sum + p.amount, 0);

    const netChange = dayIncoming - dayOutgoing;
    const endingCash = runningBalance + netChange;

    cashFlow.push({
      date: dateStr,
      startingCash: runningBalance,
      incoming: dayIncoming,
      outgoing: dayOutgoing,
      netChange,
      endingCash,
      bills: dayBills.map((b) => ({
        bill_id: b.bill_id,
        vendor_name: b.vendor_name,
        amount: b.amount,
        source: b.source,
      })),
      payroll: dayPayroll.map((p) => ({
        id: p.id,
        tabName: p.tabName,
        amount: p.amount,
      })),
    });

    runningBalance = endingCash;
  }

  return cashFlow;
}
