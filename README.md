# Polygon View

Minimal Next.js dashboard for monitoring strategy performance from Supabase via the REST API.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Server-side Supabase REST GET requests
- Vercel-ready deployment shape

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Fill in the Supabase REST URL and API key.
3. Start the app:

```bash
npm run dev
```

If no database credentials are present, the dashboard falls back to demo data so the UI still renders.

## Environment variables

```bash
SUPABASE_REST_URL=https://your-project.supabase.co/rest/v1/
SUPABASE_API_KEY=your-publishable-or-service-role-key
```

Only the server accesses Supabase. The current app does not expose the API key to the browser bundle.

## Deploying to Vercel

Add the same environment variables in your Vercel project settings, then deploy normally.

This app is built as a server-rendered dashboard and aggregates the REST responses in Next.js before rendering.

## Notes

- The dashboard is now driven primarily by `strategy_bet_performance`.
- Current live metrics focus on signals, pending bets, settled win rate, execution count, and recent outcomes.
- Supabase REST is used for GET requests only; the dashboard computes summaries in the app layer.
