# ⚽ World Cup 2026 Pool

A production-ready Next.js 15 web app where participants predict group-stage outcomes for the 2026 FIFA World Cup. Users rank teams within each of the 12 groups and select exactly 8 third-place teams they believe will advance to the knockout stage.

## Features

- 🏆 12 group cards (A–L) with drag-and-drop team reordering
- ✅ Select exactly 8 third-place teams to advance
- 📊 Live side panel showing current selections
- 📬 Submit predictions with name (and optional email)
- 🔗 Forwards submissions to a Google Apps Script webhook
- 📱 Fully responsive (mobile-first)

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **@dnd-kit** for drag-and-drop

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description | Required |
|---|---|---|
| `APPS_SCRIPT_URL` | Google Apps Script web app URL to receive submissions | No (dev skips forwarding) |
| `SUBMISSION_SECRET` | Secret token sent with each submission for verification | No |

If `APPS_SCRIPT_URL` is not set, the API route returns success without forwarding (useful for local development).

---

## Vercel Deployment

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. In **Project Settings → Environment Variables**, add:
   - `APPS_SCRIPT_URL` → your Google Apps Script deployment URL
   - `SUBMISSION_SECRET` → a random secret string
4. Deploy — Vercel auto-detects Next.js and configures everything

---

## Google Apps Script Integration

The app POSTs a JSON payload to `APPS_SCRIPT_URL` on submission:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "groups": {
    "A": ["Mexico", "South Korea", "South Africa", "Czechia"],
    "...": "..."
  },
  "thirdPlaceAdvances": {
    "A": true,
    "B": false,
    "...": "..."
  },
  "submittedAt": "2026-06-01T12:00:00.000Z",
  "secret": "your-secret-here"
}
```

### Example Apps Script

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  
  // Verify secret
  if (data.secret !== 'your-secret-here') {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.appendRow([
    data.submittedAt,
    data.name,
    data.email || '',
    JSON.stringify(data.groups),
    JSON.stringify(data.thirdPlaceAdvances),
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Deploy the script as a **Web App** (execute as yourself, accessible to anyone).
