import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { fetchAllDogs } from './data/loader.js';
import { KNOWN_NEIGHBORHOODS } from './data/location.js';
import { computeStats, tierFor } from './data/insights.js';
import LoadingScreen from './components/LoadingScreen.jsx';
import SummaryHeader from './components/SummaryHeader.jsx';
import FilterDrawer from './components/FilterDrawer.jsx';
import MapPanel from './components/MapPanel.jsx';
import ChartsPanel from './components/ChartsPanel.jsx';
import StoryScrubber, { CHAPTERS, useBarkMode, BarkBanner } from './components/StoryScrubber.jsx';
import TimelinePanel from './components/TimelinePanel.jsx';

const DEFAULT_EXPIRATION_YEAR = 2027;

const initialFilters = {
  nameSearch: '',
  breedSearch: '',
  breedSet: new Set(),
  tiers: new Set(['common', 'uncommon', 'rare']),
  neighborhoods: new Set(),
  chartMetric: 'count',
  expirationYear: DEFAULT_EXPIRATION_YEAR
};

export default function App() {
  const [dogs, setDogs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [companion, setCompanion] = useState('loading');
  const [companionMsg, setCompanionMsg] = useState(null);
  const [chapter, setChapter] = useState(0);
  const [playing, setPlaying] = useState(false);

  // ---- Initial data fetch ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await fetchAllDogs((n) => !cancelled && setLoadedCount(n));
        if (cancelled) return;
        setDogs(raw);
        setLoaded(true);

        // If the default year (2027) isn't present in the data, fall back to
        // the latest available expiration year so the dashboard still shows
        // something useful on first paint.
        const years = uniqueExpirationYears(raw);
        if (years.length && !years.includes(DEFAULT_EXPIRATION_YEAR)) {
          setFilters((f) => ({ ...f, expirationYear: years[years.length - 1] }));
        }

        setCompanion('excited');
        setCompanionMsg(`Fetched ${raw.length.toLocaleString()} Cambridge dogs!`);
        setTimeout(() => { setCompanion('idle'); setCompanionMsg(null); }, 2500);
      } catch (e) {
        setError(e.message);
        setCompanion('no-results');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ---- Baseline stats over the entire fetched dataset ----
  const baselineStats = useMemo(() => computeStats(dogs), [dogs]);
  const breedList = useMemo(() => baselineStats.breedCounts.map((b) => b.label), [baselineStats]);

  // Real neighborhood names that actually appear in the data, merged with
  // the canonical seed list so chips render before data loads.
  const neighborhoodList = useMemo(() => {
    const set = new Set(KNOWN_NEIGHBORHOODS);
    for (const d of dogs) if (d.neighborhood) set.add(d.neighborhood);
    return [...set].sort();
  }, [dogs]);

  // ---- Tier-tag dogs against the baseline (rarity classification) ----
  const taggedDogs = useMemo(() => {
    if (!dogs.length) return [];
    return dogs.map((d) => ({
      ...d,
      tier: tierFor(d.breed, baselineStats.breedCounts, baselineStats.total)
    }));
  }, [dogs, baselineStats]);

  // ---- Available expiration years + per-year counts for the year picker ----
  const expirationYears = useMemo(() => uniqueExpirationYears(taggedDogs), [taggedDogs]);
  const expirationBuckets = useMemo(() => {
    if (!expirationYears.length) return [];
    const counts = new Map();
    for (const d of taggedDogs) {
      const y = d.expirationYear;
      if (y == null) continue;
      counts.set(y, (counts.get(y) || 0) + 1);
    }
    const min = expirationYears[0];
    const max = expirationYears[expirationYears.length - 1];
    const out = [];
    for (let y = min; y <= max; y++) out.push({ year: y, count: counts.get(y) || 0 });
    return out;
  }, [taggedDogs, expirationYears]);

  // ---- Apply filters ----
  const filteredDogs = useMemo(() => {
    if (!taggedDogs.length) return [];
    const ns = filters.nameSearch.trim().toLowerCase();
    const bs = filters.breedSearch.trim().toLowerCase();
    const breedSet = filters.breedSet;
    const tiers = filters.tiers;
    const nbs = filters.neighborhoods;
    const year = filters.expirationYear;
    return taggedDogs.filter((d) => {
      if (ns && (!d.name || !d.name.toLowerCase().includes(ns))) return false;
      if (bs && (!d.breed || !d.breed.toLowerCase().includes(bs))) return false;
      if (breedSet.size && (!d.breed || !breedSet.has(d.breed))) return false;
      if (nbs.size && !nbs.has(d.neighborhood)) return false;
      if (tiers.size && tiers.size < 3 && !tiers.has(d.tier)) return false;
      if (year != null && d.expirationYear !== year) return false;
      return true;
    });
  }, [taggedDogs, filters]);

  const stats = useMemo(() => computeStats(filteredDogs), [filteredDogs]);

  // ---- Companion mood reacts to filter outcome ----
  useEffect(() => {
    if (!loaded) return;
    setCompanion(stats.total === 0 ? 'no-results' : 'thinking');
    const t = setTimeout(() => setCompanion(stats.total === 0 ? 'no-results' : 'idle'), 600);
    return () => clearTimeout(t);
  }, [filters, stats.total, loaded]);

  // ---- Helpers ----
  const resetFilters = useCallback(() => setFilters({
    ...initialFilters,
    expirationYear: expirationYears.includes(DEFAULT_EXPIRATION_YEAR)
      ? DEFAULT_EXPIRATION_YEAR
      : (expirationYears[expirationYears.length - 1] ?? DEFAULT_EXPIRATION_YEAR)
  }), [expirationYears]);

  const setYear = useCallback((updater) => {
    setFilters((f) => {
      const next = typeof updater === 'function' ? updater(f.expirationYear) : updater;
      return { ...f, expirationYear: next };
    });
  }, []);

  const surprise = useCallback(() => {
    if (!baselineStats.breedCounts.length) return;
    const pool = baselineStats.breedCounts.slice(0, 30);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setFilters((f) => ({
      ...initialFilters,
      expirationYear: f.expirationYear,
      breedSet: new Set([pick.label])
    }));
    setCompanion('excited');
    setCompanionMsg(`Showing ${pick.label}s only.`);
    setTimeout(() => { setCompanion('idle'); setCompanionMsg(null); }, 2500);
  }, [baselineStats]);

  const onFetchInsights = useCallback(() => {
    setCompanion('excited');
    setCompanionMsg('Refreshed insights from the current filters.');
    setTimeout(() => { setCompanion('idle'); setCompanionMsg(null); }, 2200);
  }, []);

  const applyChapter = useCallback((idx) => {
    setFilters((f) => CHAPTERS[idx].apply(f));
    setCompanion('exploring');
    setCompanionMsg(CHAPTERS[idx].narration);
    setTimeout(() => setCompanionMsg(null), 4500);
  }, []);

  const bark = useBarkMode(applyChapter, setChapter);

  const activeFiltersLabel = useMemo(() => {
    const bits = [];
    if (filters.nameSearch) bits.push(`name~"${filters.nameSearch}"`);
    if (filters.breedSearch) bits.push(`breed~"${filters.breedSearch}"`);
    if (filters.breedSet.size) bits.push(`${filters.breedSet.size} breeds`);
    if (filters.tiers.size && filters.tiers.size < 3) bits.push([...filters.tiers].join('+'));
    if (filters.neighborhoods.size) bits.push(`${filters.neighborhoods.size} areas`);
    return bits.join(' · ');
  }, [filters]);

  // ---- Render ----
  if (error) {
    return (
      <div className="loader-screen">
        <div style={{ fontSize: 18, color: 'var(--sad)' }}>Couldn't fetch the Dogs of Cambridge data.</div>
        <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>{error}</div>
        <button className="btn primary" onClick={() => location.reload()}>Try again</button>
      </div>
    );
  }
  if (!loaded) {
    return <LoadingScreen count={loadedCount} />;
  }

  return (
    <div className="app">
      <SummaryHeader
        stats={stats}
        baseline={baselineStats}
        year={filters.expirationYear}
        activeFilters={activeFiltersLabel}
        onFetchInsights={onFetchInsights}
        onBarkMode={bark.active ? bark.stop : bark.start}
      />

      <main className="main">
        <div className="col">
          <FilterDrawer
            filters={filters}
            setFilters={setFilters}
            breeds={breedList}
            neighborhoods={neighborhoodList}
            onReset={resetFilters}
            onSurprise={surprise}
          />
          <TimelinePanel
            year={filters.expirationYear}
            setYear={setYear}
            years={expirationYears}
            playing={playing}
            setPlaying={setPlaying}
            bucketCounts={expirationBuckets}
          />
          <StoryScrubber chapter={chapter} setChapter={setChapter} applyChapter={applyChapter} />
        </div>

        <div className="col" style={{ minWidth: 0 }}>
          <MapPanel dogs={filteredDogs} />
          <ChartsPanel
            stats={stats}
            baselineStats={baselineStats}
            metric={filters.chartMetric}
            dogs={filteredDogs}
          />
        </div>
      </main>

      <BarkBanner bark={bark} setChapter={setChapter} applyChapter={applyChapter} />
    </div>
  );
}

function uniqueExpirationYears(dogs) {
  const set = new Set();
  for (const d of dogs) if (d.expirationYear != null) set.add(d.expirationYear);
  return [...set].sort((a, b) => a - b);
}
