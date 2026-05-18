import React from 'react';
import { isMixedBreed } from '../data/loader.js';
import { nameTwins } from '../data/insights.js';

export function RareDogRadar({ stats }) {
  const rare = stats.breedCounts.filter((b) => b.count <= 2).slice(0, 10);
  return (
    <div className="panel">
      <h3>📡 Rare Dog Radar</h3>
      {rare.length ? (
        <div className="row-cards">
          {rare.map((b) => (
            <div className="row-card" key={b.label}>
              <span>{b.label}</span>
              <span className="tag rare">{b.count}</span>
            </div>
          ))}
        </div>
      ) : <div className="empty-state">No rare breeds in this view.</div>}
    </div>
  );
}

export function NameTwinFinder({ dogs }) {
  const twins = nameTwins(dogs, 3).slice(0, 8);
  return (
    <div className="panel">
      <h3>👯 Name Twin Finder</h3>
      {twins.length ? (
        <div className="row-cards">
          {twins.map((t) => (
            <div className="row-card" key={t.name}>
              <span><strong>{t.name}</strong> <span style={{ color: 'var(--text-dim)' }}>· {[...new Set(t.dogs.map((d) => d.breed).filter(Boolean))].slice(0, 3).join(', ') || '—'}</span></span>
              <span className="tag">{t.dogs.length}</span>
            </div>
          ))}
        </div>
      ) : <div className="empty-state">No name twins in this view.</div>}
    </div>
  );
}

export function BreedMixExplorer({ dogs }) {
  const mixed = dogs.filter((d) => isMixedBreed(d.breed));
  const counts = new Map();
  for (const d of mixed) counts.set(d.breed, (counts.get(d.breed) || 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  return (
    <div className="panel">
      <h3>🧬 Breed Mix Explorer</h3>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>
        {mixed.length.toLocaleString()} mixed / designer dogs in current view.
      </div>
      {top.length ? (
        <div className="row-cards">
          {top.map(([label, count]) => (
            <div className="row-card" key={label}>
              <span>{label}</span>
              <span className="tag uncommon">{count}</span>
            </div>
          ))}
        </div>
      ) : <div className="empty-state">No mixed breeds detected here.</div>}
    </div>
  );
}
