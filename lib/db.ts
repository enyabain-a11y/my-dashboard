import fs from "fs";
import path from "path";
import { Settings } from "@/types";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

interface DB {
  settings: Settings;
  billPaidOverrides: Record<string, boolean>;
}

const DEFAULT_DB: DB = {
  settings: {
    bankAccounts: [{ id: "1", name: "Primary Checking", balance: 0, type: "checking" as const }],
    lowCashThreshold: 10000,
    googleSheetsApiKey: "",
    questSpreadsheetId: "1NdvISYmIBlFRpTQGnCpC8918nM7ImW3xAASgj6dBQwg",
    labcorpSpreadsheetId: "1TL-yi9u-8ktDC_b8aLZWfBy_UBm6Yuh3HEMrZga9OEo",
    payrollSpreadsheetId: "1DpbhSFoCeu0U-RQCap_qvOVhCEeyP6vwqOZDGC-Bt0c",
  },
  billPaidOverrides: {},
};

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function readDB(): DB {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2));
    return DEFAULT_DB;
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  return {
    ...DEFAULT_DB,
    ...parsed,
    settings: { ...DEFAULT_DB.settings, ...parsed.settings },
  };
}

export function writeDB(data: DB): void {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function getSettings(): Settings {
  return readDB().settings;
}

export function saveSettings(settings: Partial<Settings>): Settings {
  const db = readDB();
  db.settings = { ...db.settings, ...settings };
  writeDB(db);
  return db.settings;
}

export function getBillPaidOverrides(): Record<string, boolean> {
  return readDB().billPaidOverrides || {};
}

export function setBillPaidOverride(billId: string, paid: boolean): void {
  const db = readDB();
  db.billPaidOverrides = { ...(db.billPaidOverrides || {}), [billId]: paid };
  writeDB(db);
}
