// Data loader for the public City of Cambridge "Dogs of Cambridge" dataset.
// Socrata endpoint: https://data.cambridgema.gov/resource/sckh-3xyx.json
// Observed fields: dog_name, dog_breed, birth_year, gender, expiration_date, is_active.
// No address/coordinate fields exist on this dataset — see src/data/location.js for
// the deterministic approximate placement used purely for visualization.

const ENDPOINT = 'https://data.cambridgema.gov/resource/sckh-3xyx.json';
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
  const birthYear = parseYear(raw.birth_year);
  const expiration = parseDate(raw.expiration_date);
  const isActive = raw.is_active === true || raw.is_active === 'true';
  return {
    id: `${name || '?'}::${breed || '?'}::${birthYear || '?'}::${Math.random().toString(36).slice(2, 7)}`,
    name: name || null,
    breed: breed || null,
    breedKey: breed ? breed.toLowerCase() : null,
    gender: gender || null,
    birthYear,
    expiration,
    isActive
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
function parseDate(v) {
  if (!v) return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t) : null;
}

// Mixed-breed detection heuristic. Used by Breed Mix Explorer and Scout.
export const MIXED_BREED_PATTERNS = [
  /\bmix\b/i, /\/(?!\s*$)/, /\band\b/i, /\bcross\b/i, /\bmixed\b/i, /\bpoo\b/i,
  /doodle/i, /shepoo/i, /chiweenie/i, /puggle/i, /labradoodle/i, /goldendoodle/i
];
export function isMixedBreed(breed) {
  if (!breed) return false;
  return MIXED_BREED_PATTERNS.some((re) => re.test(breed));
}
