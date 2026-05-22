import React, { useEffect, useState } from 'react';

// Preset views used by both the Preset Views panel and the Auto-tour banner.
// Each preset mutates filters via `apply` and shows a short description.

export const CHAPTERS = [
  {
    title: 'Most common breeds',
    narration: "Cambridge's most popular dog breeds.",
    apply: (f) => ({ ...f, tiers: new Set(['common']), chartMetric: 'count' })
  },
  {
    title: 'Most common names',
    narration: 'The city\'s most popular dog names.',
    apply: (f) => ({ ...f, tiers: new Set(['common', 'uncommon', 'rare']), chartMetric: 'count' })
  },
  {
    title: 'Rare breeds',
    narration: 'Breeds with only a handful of dogs in town.',
    apply: (f) => ({ ...f, tiers: new Set(['rare']), chartMetric: 'count' })
  },
  {
    title: 'Breed diversity',
    narration: 'Breed diversity by neighborhood (Shannon index).',
    apply: (f) => ({ ...f, tiers: new Set(['common', 'uncommon', 'rare']), chartMetric: 'diversity' })
  },
  {
    title: 'Mixed-breed dogs',
    narration: 'Mixed and designer breeds.',
    apply: (f) => ({ ...f, breedSearch: 'mix' })
  },
  {
    title: 'Repeat names',
    narration: 'Dogs sharing the same name.',
    apply: (f) => ({ ...f, breedSearch: '', chartMetric: 'count' })
  },
  {
    title: 'Uncommon breeds',
    narration: 'A slice of less-common Cambridge dogs.',
    apply: (f) => ({ ...f, breedSearch: '', tiers: new Set(['uncommon']) })
  }
];

export default function StoryScrubber({ chapter, setChapter, applyChapter }) {
  return (
    <div className="panel">
      <h3>🔖 Preset views</h3>
      <div className="scrubber">
        <button className="btn" onClick={() => { const i = Math.max(0, chapter - 1); setChapter(i); applyChapter(i); }}>◀</button>
        <input
          type="range" min={0} max={CHAPTERS.length - 1} value={chapter}
          onChange={(e) => { const i = +e.target.value; setChapter(i); applyChapter(i); }}
        />
        <button className="btn" onClick={() => { const i = Math.min(CHAPTERS.length - 1, chapter + 1); setChapter(i); applyChapter(i); }}>▶</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <div className="chapter-title">View {chapter + 1} of {CHAPTERS.length}: {CHAPTERS[chapter].title}</div>
        <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 4 }}>{CHAPTERS[chapter].narration}</div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
        Each preset applies a fixed combination of filters and chart settings.
        Use the buttons above, or press “Auto-tour” in the header to step
        through them automatically.
      </div>
    </div>
  );
}

// Auto-tour: walks through the preset views on a timer.
export function useBarkMode(applyChapter, setChapter) {
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!active || paused) return;
    const ms = 7000 / speed;
    const t = setTimeout(() => {
      const next = (i + 1) % CHAPTERS.length;
      setI(next); setChapter(next); applyChapter(next);
    }, ms);
    return () => clearTimeout(t);
  }, [active, paused, speed, i, applyChapter, setChapter]);

  const start = () => { setActive(true); setPaused(false); setI(0); setChapter(0); applyChapter(0); };
  const stop  = () => { setActive(false); };

  return { active, paused, speed, i, start, stop, setPaused, setSpeed };
}

export function BarkBanner({ bark }) {
  if (!bark.active) return null;
  return (
    <div className="bark-banner">
      <span>Auto-tour · View {bark.i + 1}/{CHAPTERS.length}: {CHAPTERS[bark.i].title}</span>
      <button className="btn" onClick={() => bark.setPaused(!bark.paused)}>{bark.paused ? '▶ Resume' : '⏸ Pause'}</button>
      <button className="btn" onClick={() => bark.setSpeed(bark.speed === 1 ? 2 : bark.speed === 2 ? 0.5 : 1)}>{bark.speed}× speed</button>
      <button className="btn danger" onClick={bark.stop}>Stop</button>
    </div>
  );
}
