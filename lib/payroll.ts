import { addDays, format, getDay, subDays } from "date-fns";
import { PayrollEntry } from "@/types";

// ---------------------------------------------------------------------------
// US Federal Holiday computation
// ---------------------------------------------------------------------------

/** nth occurrence of weekday (0=Sun…6=Sat) in a month (0-indexed). */
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month, 1);
  const offset = (weekday - getDay(first) + 7) % 7;
  return new Date(year, month, 1 + offset + (n - 1) * 7);
}

/** Last occurrence of weekday in a month (0-indexed). */
function lastWeekday(year: number, month: number, weekday: number): Date {
  const last = new Date(year, month + 1, 0); // last day of month
  const offset = (getDay(last) - weekday + 7) % 7;
  return new Date(year, month, last.getDate() - offset);
}

/** Observed date: Sat → Fri, Sun → Mon. */
function observed(date: Date): string {
  const d = getDay(date);
  if (d === 6) return format(subDays(date, 1), "yyyy-MM-dd");
  if (d === 0) return format(addDays(date, 1), "yyyy-MM-dd");
  return format(date, "yyyy-MM-dd");
}

function usHolidaysForYear(year: number): Set<string> {
  const dates = [
    new Date(year, 0, 1),                  // New Year's Day
    nthWeekday(year, 0, 1, 3),             // MLK Day — 3rd Mon Jan
    nthWeekday(year, 1, 1, 3),             // Presidents Day — 3rd Mon Feb
    lastWeekday(year, 4, 1),               // Memorial Day — last Mon May
    new Date(year, 5, 19),                 // Juneteenth
    new Date(year, 6, 4),                  // Independence Day
    nthWeekday(year, 8, 1, 1),             // Labor Day — 1st Mon Sep
    nthWeekday(year, 9, 1, 2),             // Columbus Day — 2nd Mon Oct
    new Date(year, 10, 11),                // Veterans Day
    nthWeekday(year, 10, 4, 4),            // Thanksgiving — 4th Thu Nov
    new Date(year, 11, 25),                // Christmas
  ];
  return new Set(dates.map(observed));
}

function buildHolidaySet(years: number[]): Set<string> {
  const all = new Set<string>();
  years.forEach((y) => usHolidaysForYear(y).forEach((h) => all.add(h)));
  return all;
}

// ---------------------------------------------------------------------------
// Payroll date adjustment
// ---------------------------------------------------------------------------

/**
 * If the scheduled date falls on a weekend or US federal holiday, step
 * backwards day-by-day until we land on a working day.
 */
function adjustToWorkingDayBefore(date: Date, holidays: Set<string>): Date {
  let d = date;
  while (getDay(d) === 0 || getDay(d) === 6 || holidays.has(format(d, "yyyy-MM-dd"))) {
    d = subDays(d, 1);
  }
  return d;
}

// ---------------------------------------------------------------------------
// Sheet tab name
// ---------------------------------------------------------------------------

/** e.g. makeTabName(2026, 3, 10) → "SM-10 Mar 2026" */
function makeTabName(year: number, month: number, day: 10 | 25): string {
  return `SM-${day} ${format(new Date(year, month - 1, day), "MMM yyyy")}`;
}

// ---------------------------------------------------------------------------
// CSV parser (self-contained — mirrors googleSheets.ts)
// ---------------------------------------------------------------------------

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const fields: string[] = [];
    let field = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        fields.push(field.trim());
        field = "";
      } else {
        field += ch;
      }
    }
    fields.push(field.trim());
    rows.push(fields);
  }
  return rows;
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/[$,\s]/g, "")) || 0;
}

// ---------------------------------------------------------------------------
// Fetch Pay Run Total from a named sheet tab
// ---------------------------------------------------------------------------

/**
 * Fetches the sheet tab and extracts the Pay Run Total.
 *
 * Sheet structure:
 * - Row 1: column headers, one of which is "Pay run total"
 * - Employee rows: individual pay amounts in the "Pay run total" column
 * - Subtotal rows labelled "Total per employee", "Total per Domestic contractor", etc.
 * - Grand-total row labelled "Full Total" — this is the value we want
 *
 * Strategy:
 * 1. Locate the "Pay run total" column index from the header row.
 * 2. Find the row where any cell contains "full total" and return its
 *    value from the "Pay run total" column.
 * 3. Fallback: find any row containing "total" and return the first
 *    positive number from the "Pay run total" column in that row.
 *
 * Returns null if the tab doesn't exist or no amount can be found.
 *
 * NOTE: The spreadsheet must be shared publicly (anyone with the link can view).
 */
async function fetchPayRunTotal(spreadsheetId: string, tab: string): Promise<number | null> {
  const url =
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}` +
    `/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;

  let text: string;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    text = await res.text();
  } catch {
    return null;
  }

  // gviz returns HTML on error (e.g. sheet not found)
  if (!text || text.trimStart().startsWith("<")) return null;

  const rows = parseCSV(text);
  if (rows.length < 2) return null;

  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

  // Find the "Pay run total" column index
  const headerRow = rows[0];
  const payColIdx = headerRow.findIndex((cell) => norm(cell) === "pay run total");
  if (payColIdx < 0) return null;

  // Strategy 1: find the "Full Total" row
  for (const row of rows.slice(1)) {
    if (row.some((cell) => norm(cell) === "full total")) {
      const n = parseAmount(row[payColIdx] ?? "");
      if (n > 0) return n;
    }
  }

  // Strategy 2 fallback: any row whose first non-empty cell contains "total"
  for (const row of rows.slice(1)) {
    const label = row.find((cell) => cell.trim() !== "");
    if (label && norm(label).includes("total")) {
      const n = parseAmount(row[payColIdx] ?? "");
      if (n > 0) return n;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  amount: number;
  fetchedAt: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns payroll entries whose scheduled date (10th or 25th) falls within
 * the next `days` days. Each entry's paymentDate is adjusted for weekends
 * and US federal holidays (moved to the nearest working day before).
 *
 * Only entries whose sheet tab exists and contains a Pay Run Total are returned.
 */
export async function getPayrollEntries(
  spreadsheetId: string,
  days = 90
): Promise<PayrollEntry[]> {
  if (!spreadsheetId) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = format(today, "yyyy-MM-dd");
  const endDate = addDays(today, days);
  const endStr = format(endDate, "yyyy-MM-dd");

  // Build holiday set for relevant years (include neighbours to handle boundary adjustments)
  const startYear = today.getFullYear();
  const endYear = endDate.getFullYear();
  const years: number[] = [];
  for (let y = startYear - 1; y <= endYear + 1; y++) years.push(y);
  const holidays = buildHolidaySet(years);

  const entries: PayrollEntry[] = [];

  // Walk month by month through the forecast window
  let year = today.getFullYear();
  let month = today.getMonth() + 1; // 1-indexed
  const finalYear = endDate.getFullYear();
  const finalMonth = endDate.getMonth() + 1;

  while (year < finalYear || (year === finalYear && month <= finalMonth)) {
    for (const day of [10, 25] as const) {
      const scheduled = new Date(year, month - 1, day);
      const scheduledStr = format(scheduled, "yyyy-MM-dd");

      if (scheduledStr < todayStr || scheduledStr > endStr) continue;

      const adjusted = adjustToWorkingDayBefore(scheduled, holidays);
      const paymentDate = format(adjusted, "yyyy-MM-dd");
      const tab = makeTabName(year, month, day);
      const cacheKey = `${spreadsheetId}:${tab}`;

      let amount: number | null;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        amount = cached.amount;
      } else {
        amount = await fetchPayRunTotal(spreadsheetId, tab);
        if (amount !== null) {
          cache.set(cacheKey, { amount, fetchedAt: Date.now() });
        }
      }

      if (amount !== null) {
        entries.push({
          id: `payroll-${scheduledStr}`,
          tabName: tab,
          scheduledDate: scheduledStr,
          paymentDate,
          amount,
        });
      }
    }

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return entries;
}
