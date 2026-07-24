# EduBrazil Hub + The Kehra — Complete Build Plan

---

## 1. BRANDING

| Item | Decision |
|------|----------|
| **Name** | EduBrazil Hub + The Kehra |
| **Logo** | `kehra-edubrazil/public/logo.png` |
| **Folder** | `kehra-edubrazil/` |
| **Domain** | Netlify deployment |

---

## 2. COLOR PALETTE & DESIGN SYSTEM

| Role | Color | Hex |
|------|-------|-----|
| **Primary** | Brazilian Green | `#009739` |
| **Accent** | Gold | `#FEDD00` |
| **Secondary** | Brazilian Blue | `#002776` |
| **Background** | Dark (Cobalt-inspired) | `#0F0F0F` / `#1A1A1A` |
| **Text** | White / Light Gray | `#FFFFFF` / `#A0A0A0` |
| **Cards** | Subtle dark surfaces | `#1E1E1E` with colored accents |
| **Mode** | Dark mode default + light toggle | |

**Design references:** joincobalt.com — clean, bold typography, airy layout, smooth micro-animations, card-based grids.

---

## 3. TECH STACK

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS | Modern, fast, SSR/ISR, rich UI |
| **Database** | Supabase (PostgreSQL free tier) | Query power, realtime, auth-ready later |
| **Deployment** | Netlify | SSG, ISR, Serverless Functions, Blob storage |
| **Scraping** | Python (GitHub Actions — daily cron) | Free, automated, pushes to Supabase |
| **Maps** | Leaflet + React-Leaflet | Free, interactive Brazil map with pins |
| **Calendar** | FullCalendar | Feature-rich deadline view |
| **AI Matching** | pgvector (Supabase) + free embedding model | Semantic search, no API fees |

---

## 4. DATA STRUCTURE (Supabase Tables)

```sql
universities
  id, sno, name, acronym, region, state, type,
  sigaa_url, school_url, wikipedia_url,
  lat, lng, logo_url

programs
  id, university_id, name, level (mestrado/doutorado),
  field, deadline, status (aberto/fechado),
  edital_url, scraped_at

university_details
  id, university_id, about_text, history,
  website_description, scraped_at

study_guides
  id, state, city, content_type,
  content_json, scraped_at

scrape_logs
  id, university_id, status, programs_found, errors, scraped_at
```

---

## 5. PAGE STRUCTURE

### 5a. Home Page (`/`)
- Hero with search bar ("Find Your Graduate Program in Brazil")
- Stats: 109 Universities · 5 Regions · Live data
- Urgent deadlines banner
- Explore by Region cards
- Explore by Type (Federal/State)

### 5b. University Directory (`/universities`)
- Search with autocomplete
- Filters: Region (multi-select), State, Type (Federal/State)
- Card grid: university name, acronym, region badge, active programs count, save button
- Pagination

### 5c. University Detail (`/universities/[slug]`)
- Hero section: gradient + university name, acronym, stats bar
- Tab navigation: **Programs** | **About** | **Study Guide**
- **Programs tab:** Search, filter (MSc/PhD, Open only), program cards with:
  - Program name, level, field
  - Deadline with countdown
  - Status badge (Aberto/Fechado)
  - View Edital link, Save button, Set Reminder
- **About tab:** University description from Wikipedia, history, mini map
- **Study Guide tab:** Visa process, cost of living, housing, climate, language requirements
- Similar universities section at bottom

### 5d. Map View (`/map`)
- Full-screen interactive Brazil map
- Clustered pins by region
- Click pin → popup with university name, programs count, View Details
- Sidebar filter: region, type, active deadlines

### 5e. Program Matching (`/matching`)
- Step wizard: Field → Level → Region → Type → Results
- Free-text AI input: "Describe your ideal program..." (pgvector semantic search)
- Results with match percentage

### 5f. Application Tracker (`/tracker`)
- Kanban board: Saved → Applying → Applied
- Reminders section with countdown
- localStorage persistence (no accounts initially)

---

## 6. SCRAPER ARCHITECTURE (Python — GitHub Actions Daily Cron)

```
Daily 6 AM UTC → GitHub Actions Runner
├── SIGAA Parser (~70 universities) — JSF table parsing
├── Custom Portal Parsers (~30 universities) — one per portal
├── Wikipedia Scraper — university descriptions
├── Study Guide Scraper — Numbeo + Wikipedia city data
└── Cleanup + logging
```

---

## 7. USER SYSTEM (Phase 1 — No Accounts)

| Feature | Implementation | Persistence |
|---------|---------------|-------------|
| Bookmark universities | localStorage | Browser only |
| Save programs | localStorage | Browser only |
| Application tracker | localStorage | Browser only |
| Email alerts | Form → Resend API | Serverless function |

**Future:** Supabase Auth (Google + email/password) + migrate localStorage.

---

## 8. BUILD ORDER

| # | Phase | Key Deliverable |
|---|-------|-----------------|
| 1 | Foundation | Next.js project → Supabase setup → CSV import |
| 2 | Design System | Colors, typography, UI components |
| 3 | Home + Directory | Hero, search, filterable card grid |
| 4 | University Detail | 3-tab page with program cards |
| 5 | Calendar + Map | FullCalendar + Leaflet Brazil map |
| 6 | Program Matching | Step wizard + pgvector |
| 7 | Tracker + Alerts | Kanban board + email form |
| 8 | SIGAA Scraper | Python scraper for 70 universities |
| 9 | Wikipedia Scraper | About content for all universities |
| 10 | Custom Parsers | Remaining 30 universities |
| 11 | Study Guide | General guide + top 10 city pages |
| 12 | Polish + Deploy | Animations, SEO, Netlify |

---

## 9. EXTERNAL SETUP NEEDED

- [ ] Supabase project URL + anon key
- [ ] Resend API key (email alerts, free tier)
- [ ] Logo placement confirmation

---

*Saved on: July 17, 2026*
*Project: EduBrazil Hub + The Kehra*
