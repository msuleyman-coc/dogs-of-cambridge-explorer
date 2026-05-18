import React from 'react';

export default function SummaryHeader({ stats, baseline, mapMode, activeFilters, onFetchInsights, onBarkMode, onToggleScout }) {
  const fmt = (n) => (n == null ? '—' : n.toLocaleString());
  return (
    <header className="header">
      <h1>🐾 Dogs of Cambridge Explorer <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: 12, marginLeft: 6 }}>· Cambridge Canine Pulse</span></h1>
      <div className="pulse-stats">
        <Stat label="Visible dogs"    value={fmt(stats.total)} />
        <Stat label="Unique breeds"   value={fmt(stats.breeds)} />
        <Stat label="Top breed"       value={stats.topBreed?.label ?? '—'} />
        <Stat label="Top name"        value={stats.topName?.label ?? '—'} />
        <Stat label="Rarest breed"    value={stats.rarestBreed?.label ?? '—'} />
        <Stat label="Map mode"        value={mapMode === 'pinpoint' ? 'Pinpoint' : 'Density'} />
        <Stat label="Active filters"  value={activeFilters || 'None'} />
      </div>
      <div className="header-actions">
        <button className="btn ghost" onClick={onToggleScout}>🐶 Scout</button>
        <button className="btn" onClick={onBarkMode}>🎬 Bark Mode</button>
        <button className="btn primary" onClick={onFetchInsights}>✨ Fetch Insights</button>
      </div>
    </header>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat" title={String(value)}>
      <div className="label">{label}</div>
      <div className="value" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}
