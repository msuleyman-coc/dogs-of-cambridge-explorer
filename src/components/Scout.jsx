import React, { useEffect, useState } from 'react';
import { diffInsights } from '../data/insights.js';

// Scout — local rules-based assistant. No external AI.
export default function Scout({ stats, baselineStats, filters, setFilters, onReset, onSurprise, onAction }) {
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    const next = diffInsights(stats, baselineStats);
    setBubbles(next.slice(0, 4));
  }, [stats, baselineStats]);

  const ask = (kind) => {
    switch (kind) {
      case 'common':
        setFilters((f) => ({ ...f, tiers: new Set(['common']) }));
        break;
      case 'rare':
        setFilters((f) => ({ ...f, tiers: new Set(['rare']) }));
        break;
      case 'name-trends':
        setFilters((f) => ({ ...f, chartMetric: 'percent' }));
        break;
      case 'mixed':
        setFilters((f) => ({ ...f, breedSearch: 'mix' }));
        break;
      case 'density':
        setFilters((f) => ({ ...f, mapMode: 'density' }));
        break;
      case 'clear':
        onReset();
        break;
      case 'surprise':
        onSurprise();
        break;
    }
    onAction?.(kind);
  };

  return (
    <div className="panel" style={{ flex: 1 }}>
      <h3>🐶 Scout — your data sidekick</h3>
      <div className="scout scroll">
        {bubbles.map((b, i) => (
          <div key={i} className={`scout-bubble ${b.tone}`}>{b.text}</div>
        ))}
        <div className="scout-actions">
          <button className="btn" onClick={() => ask('common')}>Most common breeds</button>
          <button className="btn" onClick={() => ask('rare')}>Find rare dogs</button>
          <button className="btn" onClick={() => ask('name-trends')}>Show name trends</button>
          <button className="btn" onClick={() => ask('mixed')}>Where are the mixed breeds?</button>
          <button className="btn" onClick={() => ask('density')}>Switch to density</button>
          <button className="btn" onClick={() => ask('surprise')}>🎲 Surprise me</button>
          <button className="btn danger" onClick={() => ask('clear')}>Clear filters</button>
        </div>
      </div>
    </div>
  );
}
