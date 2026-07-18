# Kehra • EduBrazil Hub

A graduate program aggregator for international students to find Masters and PhD programs across 109 Brazilian universities, with live deadline tracking from SIGAA portals.

## Tech Stack

- **Frontend:** Next.js 16 (App Router, static export), React 19, TypeScript, Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL, client-side queries)
- **Scraping:** Python (BeautifulSoup, scheduled via GitHub Actions)
- **Deployment:** Netlify (static hosting)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

Static output goes to `out/`.

## Project Structure

```
web/                      # Next.js frontend
  src/
    app/                  # Routes (App Router)
    components/           # Shared UI components
    lib/                  # Utilities, hooks, types, data
  public/                 # Static assets
  scripts/                # Build/seed scripts
scraper/                  # Python scrapers
  sigaa_parser.py         # SIGAA portal parser
  wikipedia_scraper.py    # University description scraper
supabase/
  schema.sql              # Database schema
.github/workflows/        # CI/CD pipelines
```

## Environment Variables

Create `web/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

For the scraper, set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.

## License

MIT
