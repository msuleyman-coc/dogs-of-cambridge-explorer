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
          <label>Neighborhood</label>
          <div className="chip-row">
            {neighborhoods.map((n) => (
              <span key={n}
                className={'chip chip-toggle ' + (filters.neighborhoods.has(n) ? 'active' : '')}
                onClick={() => toggleNb(n)}>{n}</span>
            ))}
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

        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button className="btn danger" onClick={onReset}>Reset filters</button>
          <button className="btn" onClick={onSurprise}>🎲 Random breed</button>
        </div>
      </div>
    </div>
  );
}
