"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SettingsForm {
  currentCashBalance: string;
  lowCashThreshold: string;
  googleSheetsApiKey: string;
  questSpreadsheetId: string;
  labcorpSpreadsheetId: string;
}

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>({
    currentCashBalance: "",
    lowCashThreshold: "10000",
    googleSheetsApiKey: "",
    questSpreadsheetId: "1NdvISYmIBlFRpTQGnCpC8918nM7ImW3xAASgj6dBQwg",
    labcorpSpreadsheetId: "1TL-yi9u-8ktDC_b8aLZWfBy_UBm6Yuh3HEMrZga9OEo",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          currentCashBalance: String(data.currentCashBalance ?? 0),
          lowCashThreshold: String(data.lowCashThreshold ?? 10000),
          googleSheetsApiKey: data.googleSheetsApiKey === "***" ? "" : data.googleSheetsApiKey,
          questSpreadsheetId: data.questSpreadsheetId ?? "",
          labcorpSpreadsheetId: data.labcorpSpreadsheetId ?? "",
        });
      })
      .catch(() => setError("Failed to load settings"));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentCashBalance: parseFloat(form.currentCashBalance) || 0,
          lowCashThreshold: parseFloat(form.lowCashThreshold) || 10000,
          googleSheetsApiKey: form.googleSheetsApiKey,
          questSpreadsheetId: form.questSpreadsheetId,
          labcorpSpreadsheetId: form.labcorpSpreadsheetId,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SettingsForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-800">Daily Cash Tracker</h1>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            ← Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Cash Balance */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Cash Balance</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Cash Balance ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.currentCashBalance}
                onChange={handleChange("currentCashBalance")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 50000"
              />
              <p className="text-xs text-gray-500 mt-1">
                This is the baseline from which all 30-day projections are calculated.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Low Cash Warning Threshold ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.lowCashThreshold}
                onChange={handleChange("lowCashThreshold")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Days below this amount are highlighted yellow on the timeline.
              </p>
            </div>
          </section>

          {/* Google Sheets */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Google Sheets API</h3>
            <p className="text-sm text-gray-500">
              Connects to Quest Diagnostics and LabCorp bill sheets. Data refreshes every 15
              minutes.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Sheets API Key
              </label>
              <input
                type="password"
                value={form.googleSheetsApiKey}
                onChange={handleChange("googleSheetsApiKey")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="AIza..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Can also be set via <code className="bg-gray-100 px-1 rounded">GOOGLE_SHEETS_API_KEY</code> in{" "}
                <code className="bg-gray-100 px-1 rounded">.env.local</code> (takes precedence).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quest Diagnostics Spreadsheet ID
              </label>
              <input
                type="text"
                value={form.questSpreadsheetId}
                onChange={handleChange("questSpreadsheetId")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LabCorp Spreadsheet ID
              </label>
              <input
                type="text"
                value={form.labcorpSpreadsheetId}
                onChange={handleChange("labcorpSpreadsheetId")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </section>

          {/* Bill.com */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">Bill.com API</h3>
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-md font-medium">
                TODO
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Bill.com uses OAuth 2.0. Set these credentials in{" "}
              <code className="bg-gray-100 px-1 rounded">.env.local</code> — they are not stored in
              the database.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-xs font-mono text-gray-600 space-y-1">
              <p>BILLCOM_CLIENT_ID=your_client_id</p>
              <p>BILLCOM_CLIENT_SECRET=your_client_secret</p>
              <p>BILLCOM_ORG_ID=your_org_id</p>
              <p>BILLCOM_SESSION_ID=obtained_via_oauth</p>
            </div>
            <p className="text-xs text-gray-500">
              See <code className="bg-gray-100 px-1 rounded">lib/billcom.ts</code> for the TODO
              comment with implementation instructions.
            </p>
          </section>

          {/* Stripe */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">Stripe Income</h3>
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-md font-medium">
                TODO
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Stripe income will be connected via a Google Sheet export. Set in{" "}
              <code className="bg-gray-100 px-1 rounded">.env.local</code>:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-xs font-mono text-gray-600">
              <p>STRIPE_API_KEY=sk_live_...</p>
            </div>
            <p className="text-xs text-gray-500">
              See <code className="bg-gray-100 px-1 rounded">lib/stripe.ts</code> for the TODO
              comment.
            </p>
          </section>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
            {saved && (
              <span className="text-sm text-green-600 font-medium">Settings saved!</span>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
