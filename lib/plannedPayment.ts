import { addMonths, getDay, addDays, format, parseISO } from "date-fns";

/** Returns the first Monday of the given year/month (month is 1-indexed). */
function firstMondayOfMonth(year: number, month: number): Date {
  const first = new Date(year, month - 1, 1);
  // getDay: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
  // (8 - dayOfWeek) % 7 gives days until next Monday (0 if already Monday)
  const daysToMonday = (8 - getDay(first)) % 7;
  return addDays(first, daysToMonday);
}

/**
 * Computes the Planned Payment Date for a bill.
 *
 * - billcom:  the Process Date field from the data (processDate arg), fallback to dueDate
 * - quest:    first Monday of the 2nd calendar month after dueDate
 *             e.g. due in January → first Monday of March
 * - labcorp:  first Monday of the 3rd calendar month after dueDate
 *             e.g. due in January → first Monday of April
 */
export function computePlannedPaymentDate(
  source: "billcom" | "quest" | "labcorp",
  dueDate: string,
  processDate?: string
): string {
  if (!dueDate) return "";

  if (source === "billcom") {
    return processDate || dueDate;
  }

  const due = parseISO(dueDate);
  const monthsToAdd = source === "quest" ? 2 : 3;
  const target = addMonths(due, monthsToAdd);
  const firstMonday = firstMondayOfMonth(target.getFullYear(), target.getMonth() + 1);
  return format(firstMonday, "yyyy-MM-dd");
}
