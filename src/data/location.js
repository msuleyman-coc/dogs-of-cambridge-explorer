// Deterministic approximate location placement.
// The Dogs of Cambridge dataset does NOT include addresses or coordinates.
// To satisfy the map visualization requirement WITHOUT inventing addresses,
// each dog is assigned a stable pseudo-random point inside a coarse polygon
// of Cambridge MA neighborhoods. These points are clearly labeled in the UI
// as "approximate visualization" and should not be interpreted as real homes.

// Approximate Cambridge neighborhood centers (lat, lng) — public knowledge,
// used only as anchor points for jittered visualization.
export const NEIGHBORHOODS = [
  { name: 'East Cambridge',       lat: 42.3725, lng: -71.0780, weight: 1.0 },
  { name: 'Wellington-Harrington',lat: 42.3735, lng: -71.0925, weight: 0.7 },
  { name: 'The Port',             lat: 42.3660, lng: -71.0930, weight: 0.8 },
  { name: 'Cambridgeport',        lat: 42.3580, lng: -71.1050, weight: 1.0 },
  { name: 'MIT/Area 2',           lat: 42.3610, lng: -71.0890, weight: 0.5 },
  { name: 'Riverside',            lat: 42.3640, lng: -71.1100, weight: 0.9 },
  { name: 'Mid-Cambridge',        lat: 42.3720, lng: -71.1080, weight: 1.1 },
  { name: 'Agassiz',              lat: 42.3810, lng: -71.1180, weight: 0.8 },
  { name: 'Neighborhood Nine',    lat: 42.3830, lng: -71.1280, weight: 0.7 },
  { name: 'West Cambridge',       lat: 42.3780, lng: -71.1420, weight: 1.0 },
  { name: 'Strawberry Hill',      lat: 42.3850, lng: -71.1500, weight: 0.4 },
  { name: 'North Cambridge',      lat: 42.3950, lng: -71.1380, weight: 1.2 }
];

// Stable string hash → uniform float in [0,1)
function hash01(str, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

// Choose a neighborhood by weighted hash, then jitter inside a small radius.
export function placeDog(dog) {
  const key = dog.id || `${dog.name}|${dog.breed}`;
  const r1 = hash01(key, 1);
  const r2 = hash01(key, 2);
  const r3 = hash01(key, 3);

  const totalWeight = NEIGHBORHOODS.reduce((s, n) => s + n.weight, 0);
  let pick = r1 * totalWeight;
  let nb = NEIGHBORHOODS[0];
  for (const n of NEIGHBORHOODS) {
    pick -= n.weight;
    if (pick <= 0) { nb = n; break; }
  }
  // jitter within roughly ~400m
  const radius = 0.004;
  const angle = r2 * Math.PI * 2;
  const rad = Math.sqrt(r3) * radius;
  return {
    lat: nb.lat + Math.cos(angle) * rad,
    lng: nb.lng + Math.sin(angle) * rad / Math.cos(nb.lat * Math.PI / 180),
    neighborhood: nb.name
  };
}

export const CAMBRIDGE_CENTER = [42.3736, -71.1097];
