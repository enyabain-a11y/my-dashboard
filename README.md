# Daily Cash Tracker

A daily cash flow dashboard showing today's available cash and a 30-day projection based on incoming payments (Stripe) and outgoing bills (Bill.com, Quest Diagnostics, LabCorp).

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS**
- **Google Sheets API** — reads Quest and LabCorp bill sheets (read-only)
- **JSON file** — local persistence for settings and cash balance (`data/db.json`)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your values in `.env.local`:

| Variable | Description |
|---|---|
| `GOOGLE_SHEETS_API_KEY` | Google Cloud API key with Sheets API enabled |
| `QUEST_SPREADSHEET_ID` | Quest Diagnostics sheet ID (pre-filled) |
| `LABCORP_SPREADSHEET_ID` | LabCorp sheet ID (pre-filled) |
| `BILLCOM_CLIENT_ID` | Bill.com OAuth client ID (TODO) |
| `BILLCOM_CLIENT_SECRET` | Bill.com OAuth client secret (TODO) |
| `BILLCOM_ORG_ID` | Bill.com organization ID (TODO) |
| `BILLCOM_SESSION_ID` | Bill.com OAuth session token (TODO) |
| `STRIPE_API_KEY` | Stripe API key (TODO) |

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Set your starting cash balance

Go to **Settings** (top-right nav) and enter your current cash balance. This is the baseline for all projections.

---

## Data Sources

### Stripe Income (Projected Receivables)
- Currently using **mock/placeholder data** in `lib/stripe.ts`
- **TODO:** Replace with live Stripe API calls or Google Sheet import
- See `lib/stripe.ts` for the TODO comment with instructions

### Bill.com (Outgoing Bills)
- Currently using **mock/placeholder data** in `lib/billcom.ts`
- **TODO:** Implement OAuth 2.0 flow and live API calls
- See `lib/billcom.ts` for the full TODO with API endpoint and auth details
- Bill.com OAuth docs: https://developer.bill.com/docs/oauth-2-0

### Quest Diagnostics / LabCorp (Google Sheets)
- Reads bill data from the configured Google Sheets
- **Auto-refreshes every 15 minutes** (server-side cache)
- Column mapping is configurable in `lib/googleSheets.ts` (`SHEET_CONFIGS`)

#### Google Sheets Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable the **Google Sheets API**
3. Create an **API Key** under Credentials
4. (Optional) Restrict the key to the Sheets API and your IP
5. Add the key to `.env.local` as `GOOGLE_SHEETS_API_KEY`
6. Make sure both spreadsheets are **shared publicly** (view-only) or with a service account

#### Adding a New Sheet Source

In `lib/googleSheets.ts`, push a new entry to `SHEET_CONFIGS`:

```ts
SHEET_CONFIGS.push({
  spreadsheetId: "your-sheet-id",
  range: "Sheet1!A2:Z",
  source: "newSource",
  columnMap: {
    billDate: 0,
    amountDue: 1,
    dueDate: 2,
    status: 3,
  },
});
```

---

## Project Structure

```
├── app/
│   ├── page.tsx                  # Main dashboard
│   ├── settings/page.tsx         # Settings page
│   └── api/
│       ├── dashboard/route.ts    # Aggregated dashboard data
│       ├── cash-balance/route.ts # GET/POST cash balance
│       ├── stripe-income/route.ts
│       ├── billcom/route.ts
│       ├── google-sheets/route.ts
│       └── settings/route.ts
├── components/
│   ├── Header.tsx                # Cash display + refresh
│   ├── CashFlowTimeline.tsx      # 30-day table
│   ├── BillsDue.tsx              # Bills with filtering
│   └── IncomeExpected.tsx        # Stripe income table
├── lib/
│   ├── db.ts                     # JSON persistence
│   ├── cashflow.ts               # 30-day projection logic
│   ├── stripe.ts                 # Stripe stub (TODO)
│   ├── billcom.ts                # Bill.com stub (TODO)
│   └── googleSheets.ts           # Google Sheets reader
├── types/index.ts                # TypeScript types
├── data/db.json                  # Local settings store (auto-created)
├── .env.example                  # Environment variable template
└── .env.local                    # Your local secrets (not committed)
```

---

## Dashboard Features

- **Today's Available Cash** — large display, color-coded (green/yellow/red)
- **30-Day Cash Flow Timeline** — day-by-day table with starting cash, incoming, outgoing, net change, ending cash; rows color-coded by health
- **Bills Due** — sorted by due date, filterable by source (Bill.com / Quest / LabCorp), overdue indicator
- **Income Expected** — Stripe projected receivables table
- **Manual Refresh** — button in header, auto-refreshes every 15 minutes
- **Settings Page** — cash balance, threshold, API keys, spreadsheet IDs
