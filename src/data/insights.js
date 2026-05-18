// Pure deterministic insight engine — no AI calls.
import { isMixedBreed } from './loader.js';

export function computeStats(dogs) {
  if (!dogs.length) {
    return {
      total: 0, breeds: 0, names: 0,
      topBreed: null, topName: null, rarestBreed: null,
      breedCounts: [], nameCounts: [], neighborhoodCounts: [],
      mixedCount: 0, mixedPct: 0,
      diversityIndex: 0
    };
  }
  const breedMap = new Map();
  const nameMap = new Map();
  const nbMap = new Map();
  let mixed = 0;
  for (const d of dogs) {
    if (d.breed) breedMap.set(d.breed, (breedMap.get(d.breed) || 0) + 1);
    if (d.name)  nameMap.set(d.name,   (nameMap.get(d.name)   || 0) + 1);
    if (d.neighborhood) nbMap.set(d.neighborhood, (nbMap.get(d.neighborhood) || 0) + 1);
    if (isMixedBreed(d.breed)) mixed++;
  }
  const breedCounts = sortDesc(breedMap);
  const nameCounts  = sortDesc(nameMap);
  const neighborhoodCounts = sortDesc(nbMap);

  // Shannon diversity over breeds
  const total = dogs.length;
  let H = 0;
  for (const [, c] of breedMap) {
    const p = c / total;
    H -= p * Math.log(p);
  }
  // Normalize 0..1
  const maxH = Math.log(Math.max(breedMap.size, 1));
  const diversityIndex = maxH > 0 ? H / maxH : 0;

  return {
    total,
    breeds: breedMap.size,
    names: nameMap.size,
    topBreed: breedCounts[0] || null,
    topName: nameCounts[0] || null,
    rarestBreed: rarest(breedCounts),
    breedCounts,
    nameCounts,
    neighborhoodCounts,
    mixedCount: mixed,
    mixedPct: total ? mixed / total : 0,
    diversityIndex
  };
}

function sortDesc(map) {
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
function rarest(counts) {
  if (!counts.length) return null;
  return [...counts].reverse().find((c) => c.count === 1) || counts[counts.length - 1];
}

// Popularity tiers by breed share of the dataset baseline.
export function tierFor(breed, baselineBreedCounts, baselineTotal) {
  if (!breed) return 'unknown';
  const entry = baselineBreedCounts.find((c) => c.label === breed);
  if (!entry) return 'rare';
  const pct = entry.count / baselineTotal;
  if (pct >= 0.03) return 'common';
  if (pct >= 0.005) return 'uncommon';
  return 'rare';
}

// Compare filtered slice vs baseline for Scout commentary.
export function diffInsights(filteredStats, baselineStats) {
  const out = [];
  if (!filteredStats.total) {
    out.push({ tone: 'sad', text: 'No Cambridge dogs match that filter. Want me to loosen the search?' });
    return out;
  }
  if (filteredStats.total === baselineStats.total) {
    out.push({ tone: 'info', text: `You're looking at every licensed dog in Cambridge — ${baselineStats.total.toLocaleString()} pups in total.` });
  } else {
    const pct = (filteredStats.total / baselineStats.total) * 100;
    out.push({ tone: 'info', text: `Showing ${filteredStats.total.toLocaleString()} of ${baselineStats.total.toLocaleString()} dogs (${pct.toFixed(1)}% of the city).` });
  }
  if (filteredStats.topBreed) {
    out.push({ tone: 'good', text: `Most common breed here: ${filteredStats.topBreed.label} (${filteredStats.topBreed.count}).` });
  }
  if (filteredStats.topName) {
    out.push({ tone: 'good', text: `${filteredStats.topName.label} is one of the most common names in this filtered set.` });
  }
  if (filteredStats.mixedPct > 0.25) {
    out.push({ tone: 'good', text: `Lots of mixed breeds in view — about ${(filteredStats.mixedPct * 100).toFixed(0)}% of these dogs.` });
  }
  if (filteredStats.diversityIndex > 0.85) {
    out.push({ tone: 'good', text: 'Breed diversity is very high in this view — a real mutt mosaic.' });
  } else if (filteredStats.diversityIndex < 0.4 && filteredStats.total > 30) {
    out.push({ tone: 'info', text: 'This filter is dominated by just a few breeds.' });
  }
  if (filteredStats.total < 15) {
    out.push({ tone: 'warn', text: 'Only a few dogs match that filter. Try broadening it for more signal.' });
  }
  return out;
}

// Cheap hexbin for density mode: bucket by lat/lng grid.
export function densityCells(dogs, cellSize = 0.004) {
  const cells = new Map();
  for (const d of dogs) {
    if (d.lat == null || d.lng == null) continue;
    const cx = Math.round(d.lat / cellSize);
    const cy = Math.round(d.lng / cellSize);
    const key = `${cx}:${cy}`;
    if (!cells.has(key)) cells.set(key, { lat: cx * cellSize, lng: cy * cellSize, count: 0 });
    cells.get(key).count++;
  }
  return [...cells.values()];
}

export function nameTwins(dogs, min = 2) {
  const map = new Map();
  for (const d of dogs) {
    if (!d.name) continue;
    if (!map.has(d.name)) map.set(d.name, []);
    map.get(d.name).push(d);
  }
  return [...map.entries()]
    .filter(([, arr]) => arr.length >= min)
    .map(([name, arr]) => ({ name, dogs: arr }))
    .sort((a, b) => b.dogs.length - a.dogs.length);
}
