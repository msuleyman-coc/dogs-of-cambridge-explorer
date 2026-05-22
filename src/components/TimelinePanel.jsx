import React, { useEffect, useMemo } from 'react';

// Single-year selector driven by license expiration year.
// Birth year is no longer used as the timeline driver — license
// expiration is the most actionable "currently-in-effect" signal.

const ANIMATE_MS = 1100;

export default function TimelinePanel({
  year, setYear,
  years,                 // sorted list of available expiration years
  playing, setPlaying,
  bucketCounts           // [{ year, count }] across the full range
}) {
  // Auto-advance through years while playing.
  useEffect(() => {
    if (!playing || !years.length) return;
    const id = setInterval(() => {
      setYear((cur) => {
        const idx = years.indexOf(cur);
        const next = idx < 0 || idx === years.length - 1 ? years[0] : years[idx + 1];
        return next;
      });
    }, ANIMATE_MS);
    return () => clearInterval(id);
  }, [playing, years, setYear]);

  const maxCount = useMemo(
    () => bucketCounts.reduce((m, b) => Math.max(m, b.count), 1),
    [bucketCounts]
  );
  const currentCount = bucketCounts.find((b) => b.year === year)?.count ?? 0;

  const idx = years.indexOf(year);
  const prev = () => idx > 0 && setYear(years[idx - 1]);
  const next = () => idx >= 0 && idx < years.length - 1 && setYear(years[idx + 1]);

  return (
    <div className="panel">
      <h3>📅 License expiration year</h3>

      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 10,
        marginBottom: 10, flexWrap: 'wrap'
      }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
          {year ?? '—'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          {currentCount.toLocaleString()} dogs with licenses expiring this year
        </div>
      </div>

      {/* Year bar histogram */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 2,
        height: 64, padding: 4, marginBottom: 10,
        background: 'rgba(0,0,0,0.25)', borderRadius: 10,
        border: '1px solid var(--border)'
      }}>
        {bucketCounts.map((b) => {
          const active = b.year === year;
          return (
            <button
              key={b.year}
              type="button"
              onClick={() => setYear(b.year)}
              title={`${b.year}: ${b.count.toLocaleString()}`}
              style={{
                flex: 1, minWidth: 6,
                height: `${(b.count / maxCount) * 100}%`,
                minHeight: 3,
                background: active ? 'var(--accent)' : 'rgba(255,255,255,0.18)',
                border: 'none', borderRadius: 2, padding: 0, cursor: 'pointer'
              }}
            />
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn" onClick={prev} disabled={idx <= 0}>◀</button>
        <button className="btn primary" onClick={() => setPlaying(!playing)}>
          {playing ? '⏸ Pause' : '▶ Animate'}
        </button>
        <button className="btn" onClick={next} disabled={idx < 0 || idx >= years.length - 1}>▶</button>

        <select
          value={year ?? ''}
          onChange={(e) => setYear(Number(e.target.value))}
          style={{
            background: 'rgba(0,0,0,0.25)', color: 'var(--text)',
            border: '1px solid var(--border)', borderRadius: 10,
            padding: '6px 10px', font: 'inherit'
          }}
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-dim)' }}>
          Default: 2027
        </span>
      </div>
    </div>
  );
}
