# Dogs of Cambridge Explorer 🐾

A polished local React dashboard for exploring the City of Cambridge's public
**Dogs of Cambridge** dataset, fetched live from the Cambridge Open Data Portal.

- Source: https://data.cambridgema.gov/General-Government/Dogs-of-Cambridge/sckh-3xyx
- Endpoint: https://data.cambridgema.gov/resource/sckh-3xyx.json
- Story:  https://data.cambridgema.gov/stories/s/Dogs-of-Cambridge-Data-Story/qjvj-bebc/

## Run

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

The app fetches the entire dataset from Socrata on first load (paged), caches it
in memory for the session, and then keeps all filtering, charts, and map
interactions local and fast.

## What's inside

- **Cambridge Canine Pulse** sticky header with live summary stats
- **Map** with Pinpoint and Density modes (Leaflet + CARTO dark tiles)
- **Filter drawer**: name, breed, breed multi-select, popularity tier, area,
  map mode, chart metric, surprise me, reset
- **Charts**: top breeds, top names, distribution, neighborhood diversity, name wall
- **Scout** — a local rules-based assistant (no AI API) that narrates the visible data
- **Animated dog companion** with loading/idle/thinking/excited/no-results/exploring states
- **Story Scrubber** through 8 data-story chapters
- **Bark Mode** — an auto-advancing guided cinematic tour
- **Rare Dog Radar**, **Name Twin Finder**, **Kennel View**, **Breed Mix Explorer**

## Important note about locations

The public Dogs of Cambridge dataset **does not include addresses or
coordinates** — only `dog_name`, `dog_breed`, `birth_year`, `gender`,
`expiration_date`, and `is_active`. To still provide a useful map view the
app assigns each dog a **deterministic approximate placement** inside a
weighted set of Cambridge neighborhood anchors (see
[src/data/location.js](src/data/location.js)). These pins are clearly
labeled in the UI as approximate visualization and must not be interpreted
as real homes.

All other features (breeds, names, mixed-breed detection, popularity tiers,
rarity, diversity) come straight from the real fetched data.

## No AI calls

Scout and the insight engine are entirely local and deterministic. No
OpenAI / Claude / external AI requests are made.
