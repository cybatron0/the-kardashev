# THE KARDASHEV

**Planetary Energy Intelligence System**

A global energy tracker focused on oil and related energy systems — production, logistics, infrastructure, and emissions context. Interactive map with pipelines, refineries, fields and power plants. Built for continuous observation.

## Features (v0.1 MVP)

- Interactive dark-theme world map (Leaflet + CartoDB dark)
- Major oil & gas transmission pipelines with approximate routes
- Key refineries, production fields and large power plants
- Country-level oil production rankings (curated ~2025 data)
- Click any asset → capacity, operator, status + illustrative trend chart
- Layer toggles
- Kardashev civilization type estimate
- HUD-style interface

## Data Sources (current)

- Production aggregates inspired by EIA / public 2025 figures
- Pipeline routes curated from open sources (GEM-style, public maps)
- Infrastructure points from public knowledge bases

**Next upgrades**: Live EIA API, Global Energy Monitor GIS downloads, Ember electricity & emissions, satellite methane layers, tanker tracking, AI anomaly alerts.

## Tech

- Pure static frontend (HTML / CSS / JS)
- Leaflet for mapping
- Chart.js for trends
- Zero build step — deploys instantly on Vercel / Netlify / GitHub Pages

## Local Run

Just open `index.html` or serve the folder:

```bash
npx serve .
```

## Deploy

Already prepared for Vercel. Push to GitHub and connect, or use the Vercel deploy tool.

---

**THE KARDASHEV** — Understanding the energy metabolism of civilization.
