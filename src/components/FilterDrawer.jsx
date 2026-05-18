import React, { useMemo } from 'react';

const TIERS = ['common', 'uncommon', 'rare'];

export default function FilterDrawer({ filters, setFilters, breeds, neighborhoods, onSurprise, onReset }) {
  const breedQuery = filters.breedSearch.toLowerCase();
  const visibleBreeds = useMemo(
    () => breeds.filter((b) => !breedQuery || b.toLowerCase().includes(breedQuery)).slice(0, 80),
    [breeds, breedQuery]
  );

  const toggleBreed = (b) => {
    const set = new Set(filters.breedSet);
    set.has(b) ? set.delete(b) : set.add(b);
    setFilters({ ...filters, breedSet: set });
  };
  const toggleTier = (t) => {
    const set = new Set(filters.tiers);
    set.has(t) ? set.delete(t) : set.add(t);
    setFilters({ ...filters, tiers: set });
  };
  const toggleNb = (n) => {
    const set = new Set(filters.neighborhoods);
    set.has(n) ? set.delete(n) : set.add(n);
    setFilters({ ...filters, neighborhoods: set });
  };

  return (
    <div className="panel" style={{ flex: 1 }}>
      <h3>Filters</h3>
      <div className="scroll">
        <div className="filter-group">
          <label>Dog name</label>
          <input type="text" placeholder="e.g. Bella" value={filters.nameSearch}
            onChange={(e) => setFilters({ ...filters, nameSearch: e.target.value })}/>
        </div>

        <div className="filter-group">
          <label>Breed search</label>
          <input type="text" placeholder="e.g. doodle" value={filters.breedSearch}
            onChange={(e) => setFilters({ ...filters, breedSearch: e.target.value })}/>
        </div>

        <div className="filter-group">
          <label>Breeds ({filters.breedSet.size} selected)</label>
          <div className="breed-multi">
            {visibleBreeds.map((b) => (
              <span key={b}
                className={'chip chip-toggle ' + (filters.breedSet.has(b) ? 'active' : '')}
                onClick={() => toggleBreed(b)}>{b}</span>
            ))}
            {!visibleBreeds.length && <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>No breeds match.</span>}
          </div>
        </div>

        <div className="filter-group">
          <label>Popularity tier</label>
          <div className="chip-row">
            {TIERS.map((t) => (
              <span key={t}
                className={'chip chip-toggle ' + (filters.tiers.has(t) ? 'active' : '')}
                onClick={() => toggleTier(t)}>{t}</span>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Area (approx. neighborhood)</label>
          <div className="chip-row">
            {neighborhoods.map((n) => (
              <span key={n}
                className={'chip chip-toggle ' + (filters.neighborhoods.has(n) ? 'active' : '')}
                onClick={() => toggleNb(n)}>{n}</span>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Map mode</label>
          <div className="chip-row">
            <span className={'chip chip-toggle ' + (filters.mapMode === 'pinpoint' ? 'active' : '')}
                  onClick={() => setFilters({ ...filters, mapMode: 'pinpoint' })}>📍 Pinpoint</span>
            <span className={'chip chip-toggle ' + (filters.mapMode === 'density' ? 'active' : '')}
                  onClick={() => setFilters({ ...filters, mapMode: 'density' })}>🌡 Density</span>
          </div>
        </div>

        <div className="filter-group">
          <label>Chart metric</label>
          <div className="chip-row">
            {['count', 'percent', 'rarity', 'diversity'].map((m) => (
              <span key={m}
                className={'chip chip-toggle ' + (filters.chartMetric === m ? 'active' : '')}
                onClick={() => setFilters({ ...filters, chartMetric: m })}>{m}</span>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Color markers by</label>
          <div className="chip-row">
            {['tier', 'gender'].map((m) => (
              <span key={m}
                className={'chip chip-toggle ' + (filters.colorBy === m ? 'active' : '')}
                onClick={() => setFilters({ ...filters, colorBy: m })}>{m}</span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button className="btn danger" onClick={onReset}>Reset</button>
          <button className="btn" onClick={onSurprise}>🎲 Surprise me</button>
        </div>
      </div>
    </div>
  );
}
