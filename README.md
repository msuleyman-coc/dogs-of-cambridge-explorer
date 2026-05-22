# Dogs of Cambridge Explorer 🐾

A local React dashboard for exploring the City of Cambridge's public
**Dogs of Cambridge** dataset, fetched live from the Cambridge Open Data
Portal and visualised as a neighborhood heatmap.

## Data sources

| Layer | Dataset | Endpoint |
| --- | --- | --- |
| Dogs | [Dog per Neighborhood — Based on Dogs of Cambridge](https://data.cambridgema.gov/d/kp74-tuqx) (chart `kp74-tuqx`, backing table `h7p5-fjms`) | `https://data.cambridgema.gov/resource/h7p5-fjms.json` |
| Neighborhood polygons | [Cambridge Neighborhood Polygons](https://data.cambridgema.gov/d/k3pi-9823) (`k3pi-9823`) | `https://data.cambridgema.gov/resource/k3pi-9823.geojson` |

The dog dataset is the same Animal Commission license data as the original
`sckh-3xyx` "Dogs of Cambridge" table, enriched by the City with
**geomasked** `latitude_masked` / `longitude_masked` coordinates and a
pre-assigned `neighborhood` field. The locations are deliberately fuzzed by
the City to protect privacy — they are real but approximate, not invented.

## Run

```bash
npm install
npm run dev   # http://localhost:5173
npm run build # production bundle in dist/
```

The app fetches the entire dataset on first load (paged through Socrata),
then keeps all filtering, charts, and map interactions local.

## What's on screen

- **Sticky header** with the currently selected expiration year and live
  summary stats (visible dogs, unique breeds, top breed/name).
- **Filters** panel: name, breed search, breed multi-select, popularity tier,
  neighborhood, chart metric, reset, and "surprise me".
- **License expiration year** selector — single year, defaults to **2027**,
  with a per-year histogram, prev/next buttons, dropdown, and an animate
  button that steps through years.
- **Story Scrubber** with optional **Bark Mode** auto-tour.
- **Neighborhood heatmap** (choropleth) — each Cambridge neighborhood
  polygon is shaded by the count of currently filtered dogs whose
  `neighborhood` field matches that polygon. Hover any polygon for the
  exact count.
- **Charts** for top breeds, top names, distribution, neighborhood diversity,
  name wall, and the kennel view summary.

## Implementation notes

- Dog → neighborhood join is a direct field equality on `neighborhood`
  (published per-row by the City). No spatial join, no synthesized data.
- Neighborhood polygons are fetched at runtime from `k3pi-9823.geojson` and
  rendered via `react-leaflet`'s `<GeoJSON>` with a sequential
  blue → amber → red color ramp scaled to the current max count.
- License expiration year drives the timeline; birth year is no longer used
  as a timeline filter (it's still present per dog for stats).

## Known limitations

- A small number of dog records have a null `neighborhood` value upstream;
  they are excluded from the choropleth counts but still appear in the other
  stats.
- The neighborhood polygon names from `k3pi-9823` and the dog dataset's
  `neighborhood` values agree on the standard CDD names, but if the City
  renames a neighborhood on one side and not the other, that polygon will
  shade as zero until the names line up again.
- All dog coordinates are City-geomasked; do not treat them as real homes.

## No AI calls

The insight engine is entirely local and deterministic. No external AI
requests are made.
