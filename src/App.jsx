import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { fetchAllDogs, isMixedBreed } from './data/loader.js';
import { placeDog, NEIGHBORHOODS } from './data/location.js';
import { computeStats, tierFor } from './data/insights.js';
import LoadingScreen from './components/LoadingScreen.jsx';
import SummaryHeader from './components/SummaryHeader.jsx';
import FilterDrawer from './components/FilterDrawer.jsx';
import MapPanel from './components/MapPanel.jsx';
import ChartsPanel from './components/ChartsPanel.jsx';
import Scout from './components/Scout.jsx';
import DogCompanion from './components/DogCompanion.jsx';
import StoryScrubber, { CHAPTERS, useBarkMode, BarkBanner } from './components/StoryScrubber.jsx';
import TimelinePanel from './components/TimelinePanel.jsx';
import { RareDogRadar, NameTwinFinder, BreedMixExplorer } from './components/Extras.jsx';

const initialFilters = {
  nameSearch: '',
  breedSearch: '',
  breedSet: new Set(),
  tiers: new Set(['common', 'uncommon', 'rare']),
  neighborhoods: new Set(),
  mapMode: 'pinpoint',
  chartMetric: 'count',
  colorBy: 'tier',
  timeField: 'birth',     // 'birth' | 'expiration'
  timeRange: null          // [from, to] years, set once data loads
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
  const [showScout, setShowScout] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  // ---- Initial data fetch ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await fetchAllDogs((n) => !cancelled && setLoadedCount(n));
        if (cancelled) return;
        const placed = raw.map((d) => ({ ...d, ...placeDog(d) }));
        setDogs(placed);
        setLoaded(true);
        // Initialize timeline window to the most recent 5 years of births available.
        const years = placed.map((d) => d.birthYear).filter((y) => y && y > 1980 && y < 2100);
        if (years.length) {
          const max = Math.max(...years);
          const min = Math.min(...years);
          const lo = Math.max(min, max - 5);
          setFilters((f) => ({ ...f, timeRange: [lo, max] }));
        }
        setCompanion('excited');
        setCompanionMsg(`Fetched ${placed.length.toLocaleString()} Cambridge dogs!`);
        setTimeout(() => { setCompanion('idle'); setCompanionMsg(null); }, 2500);
      } catch (e) {
        setError(e.message);
        setCompanion('no-results');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ---- Baseline stats (full dataset) ----
  const baselineStats = useMemo(() => computeStats(dogs), [dogs]);
  const breedList = useMemo(() => baselineStats.breedCounts.map((b) => b.label), [baselineStats]);
  const neighborhoodList = useMemo(() => NEIGHBORHOODS.map((n) => n.name), []);

  // ---- Tier-tagged dogs (computed once against the baseline) ----
  const taggedDogs = useMemo(() => {
    if (!dogs.length) return [];
    return dogs.map((d) => ({
      ...d,
      tier: tierFor(d.breed, baselineStats.breedCounts, baselineStats.total)
    }));
  }, [dogs, baselineStats]);

  // ---- Timeline bounds & per-year buckets for the sparkline ----
  const timeBounds = useMemo(() => {
    const valOf = (d) => filters.timeField === 'birth'
      ? d.birthYear
      : (d.expiration ? d.expiration.getFullYear() : null);
    const ys = taggedDogs.map(valOf).filter((y) => y && y > 1980 && y < 2100);
    if (!ys.length) return [2010, 2026];
    return [Math.min(...ys), Math.max(...ys)];
  }, [taggedDogs, filters.timeField]);

  const timeBuckets = useMemo(() => {
    const valOf = (d) => filters.timeField === 'birth'
      ? d.birthYear
      : (d.expiration ? d.expiration.getFullYear() : null);
    const counts = new Map();
    for (const d of taggedDogs) {
      const y = valOf(d);
      if (!y || y < timeBounds[0] || y > timeBounds[1]) continue;
      counts.set(y, (counts.get(y) || 0) + 1);
    }
    const out = [];
    for (let y = timeBounds[0]; y <= timeBounds[1]; y++) {
      out.push({ year: y, count: counts.get(y) || 0 });
    }
    return out;
  }, [taggedDogs, filters.timeField, timeBounds]);

  // ---- Apply filters ----
  const filteredDogs = useMemo(() => {
    if (!taggedDogs.length) return [];
    const ns = filters.nameSearch.trim().toLowerCase();
    const bs = filters.breedSearch.trim().toLowerCase();
    const breedSet = filters.breedSet;
    const tiers = filters.tiers;
    const nbs = filters.neighborhoods;
    const range = filters.timeRange;
    const tf = filters.timeField;
    return taggedDogs.filter((d) => {
      if (ns && (!d.name || !d.name.toLowerCase().includes(ns))) return false;
      if (bs && (!d.breed || !d.breed.toLowerCase().includes(bs))) return false;
      if (breedSet.size && (!d.breed || !breedSet.has(d.breed))) return false;
      if (nbs.size && !nbs.has(d.neighborhood)) return false;
      if (tiers.size && tiers.size < 3 && !tiers.has(d.tier)) return false;
      if (range) {
        const y = tf === 'birth' ? d.birthYear : (d.expiration ? d.expiration.getFullYear() : null);
        // Dogs missing the chosen date field are kept only when the window covers full bounds.
        if (y == null) {
          if (range[0] !== timeBounds[0] || range[1] !== timeBounds[1]) return false;
        } else if (y < range[0] || y > range[1]) return false;
      }
      return true;
    });
  }, [taggedDogs, filters, timeBounds]);

  const stats = useMemo(() => computeStats(filteredDogs), [filteredDogs]);

  // ---- Wag tail on filter change ----
  useEffect(() => {
    if (!loaded) return;
    setCompanion(stats.total === 0 ? 'no-results' : 'thinking');
    const t = setTimeout(() => setCompanion(stats.total === 0 ? 'no-results' : 'idle'), 600);
    return () => clearTimeout(t);
  }, [filters, stats.total, loaded]);

  // ---- Filter helpers ----
  const resetFilters = useCallback(() => setFilters(initialFilters), []);

  const surprise = useCallback(() => {
    if (!baselineStats.breedCounts.length) return;
    const pool = baselineStats.breedCounts.slice(0, 30);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setFilters({
      ...initialFilters,
      breedSet: new Set([pick.label]),
      mapMode: Math.random() > 0.5 ? 'density' : 'pinpoint'
    });
    setCompanion('excited');
    setCompanionMsg(`Surprise! Showing all the ${pick.label}s.`);
    setTimeout(() => { setCompanion('idle'); setCompanionMsg(null); }, 2500);
  }, [baselineStats]);

  const onFetchInsights = useCallback(() => {
    setCompanion('excited');
    setCompanionMsg('Bark! Recomputing fresh insights from your filters.');
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
    return (
      <>
        <LoadingScreen count={loadedCount} />
        <DogCompanion state="loading" />
      </>
    );
  }

  return (
    <div className="app">
      <SummaryHeader
        stats={stats}
        baseline={baselineStats}
        mapMode={filters.mapMode}
        activeFilters={activeFiltersLabel}
        onFetchInsights={onFetchInsights}
        onBarkMode={bark.active ? bark.stop : bark.start}
        onToggleScout={() => setShowScout((s) => !s)}
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
            field={filters.timeField}
            setField={(tf) => setFilters((f) => ({ ...f, timeField: tf, timeRange: null }))}
            range={filters.timeRange || timeBounds}
            setRange={(updater) => setFilters((f) => {
              const cur = f.timeRange || timeBounds;
              const next = typeof updater === 'function' ? updater(cur) : updater;
              return { ...f, timeRange: next };
            })}
            bounds={timeBounds}
            playing={playing}
            setPlaying={setPlaying}
            speed={speed}
            setSpeed={setSpeed}
            bucketCounts={timeBuckets}
          />
          <StoryScrubber chapter={chapter} setChapter={setChapter} applyChapter={applyChapter} />
        </div>

        <div className="col" style={{ minWidth: 0 }}>
          <div className="panel" style={{ flex: 1, padding: 0, position: 'relative', overflow: 'hidden' }}>
            <div className="map-overlay">
              <button className={filters.mapMode === 'pinpoint' ? 'active' : ''}
                onClick={() => setFilters({ ...filters, mapMode: 'pinpoint' })}>📍 Pinpoint</button>
              <button className={filters.mapMode === 'density' ? 'active' : ''}
                onClick={() => setFilters({ ...filters, mapMode: 'density' })}>🌡 Density</button>
            </div>
            <MapPanel dogs={filteredDogs} mode={filters.mapMode} colorBy={filters.colorBy} />
          </div>
          <ChartsPanel stats={stats} baselineStats={baselineStats}
            metric={filters.chartMetric} dogs={filteredDogs} />
        </div>

        <div className="col right-col">
          {showScout && (
            <Scout
              stats={stats}
              baselineStats={baselineStats}
              filters={filters}
              setFilters={setFilters}
              onReset={resetFilters}
              onSurprise={surprise}
              onAction={() => { setCompanion('excited'); setTimeout(() => setCompanion('idle'), 1200); }}
            />
          )}
          <RareDogRadar stats={stats} />
          <NameTwinFinder dogs={filteredDogs} />
          <BreedMixExplorer dogs={filteredDogs} />
        </div>
      </main>

      <DogCompanion state={companion} message={companionMsg} />
      <BarkBanner bark={bark} setChapter={setChapter} applyChapter={applyChapter} />
    </div>
  );
}
