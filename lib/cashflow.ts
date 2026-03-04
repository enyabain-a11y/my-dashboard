import { addDays, format, parseISO, startOfDay } from "date-fns";
import { Bill, CashFlowDay, StripeIncome } from "@/types";

export function buildCashFlow(
  startingCash: number,
  stripeIncome: StripeIncome[],
  bills: Bill[],
  days = 30
): CashFlowDay[] {
  const today = startOfDay(new Date());
  const cashFlow: CashFlowDay[] = [];
  let runningBalance = startingCash;

  // Only include projected/upcoming items (not paid/received in the past)
  const projectedIncome = stripeIncome.filter((s) => s.status === "projected");
  const unpaidBills = bills.filter((b) => b.status !== "paid");

  for (let i = 0; i < days; i++) {
    const date = addDays(today, i);
    const dateStr = format(date, "yyyy-MM-dd");

    const dayIncoming = projectedIncome
      .filter((s) => s.date.startsWith(dateStr))
      .reduce((sum, s) => sum + s.amount, 0);

    const dayOutgoing = unpaidBills
      .filter((b) => b.due_date.startsWith(dateStr))
      .reduce((sum, b) => sum + b.amount, 0);

    const netChange = dayIncoming - dayOutgoing;
    const endingCash = runningBalance + netChange;

    cashFlow.push({
      date: dateStr,
      startingCash: runningBalance,
      incoming: dayIncoming,
      outgoing: dayOutgoing,
      netChange,
      endingCash,
    });

    runningBalance = endingCash;
  }

  return cashFlow;
}
