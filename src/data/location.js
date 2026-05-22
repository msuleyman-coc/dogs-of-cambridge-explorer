// Cambridge geography references.
//
// Dog coordinates and neighborhood assignments now come from the upstream
// dataset (see loader.js) — they are real-but-geomasked values published by
// the City. We no longer synthesize positions here.
//
// Neighborhood polygons are fetched at runtime from the City of Cambridge
// open data portal: "Cambridge Neighborhood Polygons" (Socrata id k3pi-9823).
// Dataset page: https://data.cambridgema.gov/d/k3pi-9823

export const CAMBRIDGE_CENTER = [42.3736, -71.1097];

export const NEIGHBORHOODS_GEOJSON_URL =
  'https://data.cambridgema.gov/resource/k3pi-9823.geojson?$limit=100';

// Canonical neighborhood names that appear in the dog dataset's
// `neighborhood` column. Used to seed the filter chip list before any data
// arrives; once dogs load the active list comes from the data itself.
export const KNOWN_NEIGHBORHOODS = [
  'Area 2/MIT',
  'Baldwin',
  'Cambridge Highlands',
  'Cambridgeport',
  'East Cambridge',
  'Mid-Cambridge',
  'Neighborhood Nine',
  'North Cambridge',
  'Riverside',
  'Strawberry Hill',
  'The Port',
  'Wellington-Harrington',
  'West Cambridge'
];
