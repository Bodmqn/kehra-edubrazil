# Contributing

## Setup

1. Clone the repo
2. `cd web && npm install`
3. Copy `web/.env.example` to `web/.env.local` and fill in your Supabase keys
4. `npm run dev` to start the dev server at http://localhost:3000

## Project structure

```
web/                          # Next.js frontend
  src/
    app/                      # App Router pages
    components/               # Reusable UI components
    lib/                      # Hooks, utilities, types, data
  public/                     # Static assets
  scripts/                    # Build/seed scripts
scraper/                      # Python scrapers
supabase/
  schema.sql                  # Database schema + RLS policies
.github/workflows/            # CI/CD
```

## Running tests

```bash
npm run test        # Run once
npm run test:watch  # Watch mode
```

## Building

```bash
npm run build       # Static export to out/
```

## Scraping

```bash
cd scraper
pip install -r requirements.txt
python sigaa_parser.py          # SIGAA universities
python wikipedia_scraper.py      # University descriptions
```

Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` environment variables or create a `.env` file in `scraper/`.

## Code style

- TypeScript strict mode
- Tailwind CSS for styling
- `'use client'` for interactive pages
- Server components where possible
- No comments in code (self-documenting)
- PascalCase for components, camelCase for utilities
