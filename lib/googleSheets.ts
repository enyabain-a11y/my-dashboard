import { Bill } from "@/types";
import { computePlannedPaymentDate } from "@/lib/plannedPayment";

// Fetches publicly-shared Google Sheets as CSV — no API key required.
// To add a new sheet source, add an entry to SHEET_CONFIGS below.

interface SheetConfig {
  spreadsheetId: string;
  gid: string;
  source: "quest" | "labcorp";
  vendorPrefix: string;
  columnMap: {
    billId: number;
    amountDue: number;    // "current balance" or "balance due"
    dueDate: number;
    invoiceDate?: number; // optional — invoice/bill date column
    status?: number;      // optional — defaults to "scheduled" if missing
    labCode?: number;     // appended to vendorPrefix as "Prefix - CODE"
  };
}

const SHEET_CONFIGS: SheetConfig[] = [
  {
    spreadsheetId: process.env.QUEST_SPREADSHEET_ID || "1NdvISYmIBlFRpTQGnCpC8918nM7ImW3xAASgj6dBQwg",
    gid: "0",
    source: "quest",
    vendorPrefix: "Quest Diagnostics",
    columnMap: {
      billId: 3,      // Invoice Number
      amountDue: 7,   // Current Balance
      dueDate: 5,     // Due Date
      invoiceDate: 4, // Invoice Date (if present)
      status: 8,      // Status ("Open")
      // labCode omitted — all Quest bills show as "Quest Diagnostics" regardless of location
    },
  },
  {
    spreadsheetId: process.env.LABCORP_SPREADSHEET_ID || "1TL-yi9u-8ktDC_b8aLZWfBy_UBm6Yuh3HEMrZga9OEo",
    gid: "0",
    source: "labcorp",
    vendorPrefix: "LabCorp",
    columnMap: {
      billId: 0,      // Bill Number
      amountDue: 6,   // Balance Due
      dueDate: 4,     // Due
      invoiceDate: 3, // Invoice Date (if present)
    },
  },
];

function parseAmount(raw: string): number {
  if (!raw) return 0;
  return parseFloat(raw.replace(/[$,\s]/g, "")) || 0;
}

// Normalizes M/D/YYYY or MM/DD/YYYY → YYYY-MM-DD
function parseDate(raw: string): string {
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, m, d, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return raw;
}

function parseStatus(raw: string | undefined): Bill["status"] {
  if (!raw) return "scheduled";
  const val = raw.toLowerCase();
  if (val.includes("paid")) return "paid";
  if (val.includes("pending") || val.includes("approval")) return "pending_approval";
  return "scheduled";
}

// Minimal CSV parser that handles quoted fields with embedded commas
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const fields: string[] = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
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

async function fetchSheetBills(config: SheetConfig): Promise<Bill[]> {
  const url = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/export?format=csv&gid=${config.gid}`;

  let text: string;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
  } catch (err) {
    console.error(`Failed to fetch ${config.source} sheet:`, err);
    return [];
  }

  const rows = parseCSV(text);
  const dataRows = rows.slice(1); // skip header

  const bills: Bill[] = dataRows
    .map((row, i) => {
      const { columnMap, source, vendorPrefix } = config;

      const billId = row[columnMap.billId] || `${source}_${i}`;
      const amountRaw = row[columnMap.amountDue] || "0";
      const dueDateRaw = row[columnMap.dueDate] || "";
      const invoiceDateRaw = columnMap.invoiceDate !== undefined ? row[columnMap.invoiceDate] : undefined;
      const statusRaw = columnMap.status !== undefined ? row[columnMap.status] : undefined;
      const labCode = columnMap.labCode !== undefined ? row[columnMap.labCode] : undefined;

      const vendorName = labCode ? `${vendorPrefix} - ${labCode}` : vendorPrefix;
      const dueDate = parseDate(dueDateRaw);
      const invoiceDate = invoiceDateRaw ? parseDate(invoiceDateRaw) : undefined;
      const status = parseStatus(statusRaw);

      return {
        bill_id: `${source}_${billId}`,
        vendor_name: vendorName,
        invoice_date: invoiceDate || undefined,
        due_date: dueDate,
        planned_payment_date: computePlannedPaymentDate(source, dueDate),
        amount: parseAmount(amountRaw),
        status,
        paid: status === "paid",
        source,
      } as Bill;
    })
    .filter((b) => b.amount > 0 && b.due_date);

  return bills;
}

// In-memory cache — 15-minute TTL
interface CacheEntry {
  data: Bill[];
  fetchedAt: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function getGoogleSheetBills(): Promise<Bill[]> {
  const allBills: Bill[] = [];

  for (const config of SHEET_CONFIGS) {
    const cacheKey = `${config.source}:${config.spreadsheetId}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      allBills.push(...cached.data);
      continue;
    }

    const bills = await fetchSheetBills(config);
    cache.set(cacheKey, { data: bills, fetchedAt: Date.now() });
    allBills.push(...bills);
  }

  return allBills;
}
