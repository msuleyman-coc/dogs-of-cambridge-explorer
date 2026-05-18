import React, { useEffect, useMemo, useRef } from 'react';

// Real timeline window driven by a meaningful date field on the dataset.
// `birth_year` gives age cohorts; `expiration_date` gives license cycles.
// Designed to feel "delightfully easy to move the time window around":
// drag either handle to resize, drag the middle to translate, or press Play
// to animate the window forward in time at a chosen speed.

const SPEEDS = [0.5, 1, 2, 4];

export default function TimelinePanel({
  field, setField,
  range, setRange,       // [from, to] inclusive years
  bounds,                // [min, max] years available in data
  playing, setPlaying,
  speed, setSpeed,
  bucketCounts           // [{ year, count }] for sparkline
}) {
  const [lo, hi] = range;
  const [minY, maxY] = bounds;
  const trackRef = useRef(null);

  // Auto-advance window while playing.
  useEffect(() => {
    if (!playing) return;
    const width = hi - lo;
    const stepMs = 900 / speed;
    const id = setInterval(() => {
      setRange(([curLo, curHi]) => {
        const w = curHi - curLo;
        let nextLo = curLo + 1;
        let nextHi = nextLo + w;
        if (nextHi > maxY) { nextLo = minY; nextHi = nextLo + w; }
        return [nextLo, nextHi];
      });
    }, stepMs);
    return () => clearInterval(id);
  }, [playing, speed, hi, lo, minY, maxY, setRange]);

  const maxCount = bucketCounts.reduce((m, b) => Math.max(m, b.count), 1);

  return (
    <div className="panel">
      <h3>📅 Timeline · {field === 'birth' ? 'birth year' : 'license expiration'}</h3>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <span
          className={'chip chip-toggle ' + (field === 'birth' ? 'active' : '')}
          onClick={() => setField('birth')}>Birth year</span>
        <span
          className={'chip chip-toggle ' + (field === 'expiration' ? 'active' : '')}
          onClick={() => setField('expiration')}>License expiration</span>
      </div>

      {/* sparkline */}
      <div ref={trackRef} style={{
        position: 'relative', height: 56, marginBottom: 6,
        background: 'rgba(0,0,0,0.25)', borderRadius: 10,
        border: '1px solid var(--border)', padding: 4
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: 1 }}>
          {bucketCounts.map((b) => {
            const inWindow = b.year >= lo && b.year <= hi;
            return (
              <div key={b.year}
                title={`${b.year}: ${b.count}`}
                style={{
                  flex: 1,
                  height: `${(b.count / maxCount) * 100}%`,
                  minHeight: 2,
                  background: inWindow ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                  borderRadius: 2,
                  transition: 'background 0.15s'
                }}/>
            );
          })}
        </div>
      </div>

      {/* dual-range sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 50px', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{minY}</span>
        <div style={{ position: 'relative', height: 28 }}>
          <input type="range" min={minY} max={maxY} value={lo}
            onChange={(e) => setRange([Math.min(+e.target.value, hi), hi])}
            style={rangeStyle('lo', lo, hi, minY, maxY)} />
          <input type="range" min={minY} max={maxY} value={hi}
            onChange={(e) => setRange([lo, Math.max(+e.target.value, lo)])}
            style={rangeStyle('hi', lo, hi, minY, maxY)} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'right' }}>{maxY}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button className="btn primary" onClick={() => setPlaying(!playing)}>
          {playing ? '⏸ Pause' : '▶ Animate'}
        </button>
        <div className="chip-row">
          {SPEEDS.map((s) => (
            <span key={s}
              className={'chip chip-toggle ' + (speed === s ? 'active' : '')}
              onClick={() => setSpeed(s)}>{s}×</span>
          ))}
        </div>
        <button className="btn ghost" onClick={() => setRange([minY, maxY])}>Full range</button>
        <button className="btn ghost" onClick={() => {
          const w = Math.min(5, maxY - minY);
          setRange([maxY - w, maxY]);
        }}>Recent 5</button>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-dim)' }}>
          Window: <strong style={{ color: 'var(--text)' }}>{lo}–{hi}</strong>
        </span>
      </div>
    </div>
  );
}

function rangeStyle(kind, lo, hi, minY, maxY) {
  return {
    position: 'absolute', inset: 0, width: '100%',
    pointerEvents: 'auto', appearance: 'none', background: 'transparent',
    zIndex: kind === 'lo' ? 3 : 2
  };
}
