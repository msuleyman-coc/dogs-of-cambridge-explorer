// Data loader for the public City of Cambridge Dogs of Cambridge data.
//
// We use the "Dog per Neighborhood - Based on Dogs of Cambridge" table
// (Socrata id: h7p5-fjms), which is the same Animal Commission license data
// as the original sckh-3xyx dataset, enriched with geomasked coordinates
// (latitude_masked / longitude_masked) and a pre-computed `neighborhood`
// field. The locations are deliberately fuzzed by the City to protect
// privacy — they are real-but-approximate, not invented.
//
// Source page:   https://data.cambridgema.gov/d/kp74-tuqx
// Backing table: https://data.cambridgema.gov/resource/h7p5-fjms.json

const ENDPOINT = 'https://data.cambridgema.gov/resource/h7p5-fjms.json';
const PAGE_SIZE = 5000;

export async function fetchAllDogs(onProgress) {
  const all = [];
  let offset = 0;
  while (true) {
    const url = `${ENDPOINT}?$limit=${PAGE_SIZE}&$offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Socrata fetch failed: ${res.status}`);
    const page = await res.json();
    all.push(...page);
    onProgress?.(all.length);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
    if (offset > 200000) break; // safety stop
  }
  return all.map(normalize).filter((d) => d.name || d.breed);
}

function normalize(raw) {
  const name = clean(raw.dog_name);
  const breed = clean(raw.dog_breed);
  const gender = clean(raw.gender);
  const neighborhood = clean(raw.neighborhood);
  const birthYear = parseYear(raw.birth_year);
  const expiration = parseDate(raw.expiration_date);
  const lat = parseNum(raw.latitude_masked) ?? raw.location_masked?.coordinates?.[1] ?? null;
  const lng = parseNum(raw.longitude_masked) ?? raw.location_masked?.coordinates?.[0] ?? null;
  const isActive = raw.is_active === true || raw.is_active === 'true';
  return {
    id: `${name || '?'}::${breed || '?'}::${birthYear || '?'}::${lat || '?'}::${lng || '?'}`,
    name: name || null,
    breed: breed || null,
    breedKey: breed ? breed.toLowerCase() : null,
    gender: gender || null,
    birthYear,
    expiration,
    expirationYear: expiration ? expiration.getUTCFullYear() : null,
    isActive,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    neighborhood: neighborhood || null
  };
}

function clean(v) {
  if (v == null) return null;
  return String(v).replace(/\s+/g, ' ').trim();
}
function parseYear(v) {
  if (!v) return null;
  const m = String(v).match(/(\d{4})/);
  return m ? Number(m[1]) : null;
}
function parseNum(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function parseDate(v) {
  if (!v) return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t) : null;
}

// Mixed-breed detection heuristic. Used by Charts/insights helpers.
export const MIXED_BREED_PATTERNS = [
  /\bmix\b/i, /\/(?!\s*$)/, /\band\b/i, /\bcross\b/i, /\bmixed\b/i, /\bpoo\b/i,
  /doodle/i, /shepoo/i, /chiweenie/i, /puggle/i, /labradoodle/i, /goldendoodle/i
];
export function isMixedBreed(breed) {
  if (!breed) return false;
  return MIXED_BREED_PATTERNS.some((re) => re.test(breed));
}
