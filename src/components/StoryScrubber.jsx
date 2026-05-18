import React, { useEffect, useState } from 'react';

// Story chapters used by both the Story Scrubber and Bark Mode.
// Each chapter mutates filters via `apply` and provides Scout narration.
export const CHAPTERS = [
  {
    title: 'Most common breeds',
    narration: "Let's start with Cambridge's most popular dog breeds — the city's bread and butter.",
    apply: (f) => ({ ...f, tiers: new Set(['common']), chartMetric: 'count', mapMode: 'pinpoint' })
  },
  {
    title: 'Most common names',
    narration: 'Now the city\'s favorite dog names — Bella, Luna, and friends.',
    apply: (f) => ({ ...f, tiers: new Set(['common', 'uncommon', 'rare']), chartMetric: 'count' })
  },
  {
    title: 'Rare breeds',
    narration: 'Let\'s sniff out the unusual — breeds with only a handful of dogs in town.',
    apply: (f) => ({ ...f, tiers: new Set(['rare']), chartMetric: 'count', mapMode: 'pinpoint' })
  },
  {
    title: 'Breed diversity',
    narration: 'How diverse is each part of town? Shannon diversity at a glance.',
    apply: (f) => ({ ...f, tiers: new Set(['common', 'uncommon', 'rare']), chartMetric: 'diversity' })
  },
  {
    title: 'Density hotspots',
    narration: 'Switching to density mode to find where Cambridge dogs cluster.',
    apply: (f) => ({ ...f, mapMode: 'density', tiers: new Set(['common', 'uncommon', 'rare']) })
  },
  {
    title: 'Mixed breed spotlight',
    narration: 'Cambridge loves a good mutt. Here are the mixed and designer breeds.',
    apply: (f) => ({ ...f, breedSearch: 'mix', mapMode: 'pinpoint' })
  },
  {
    title: 'Name twins',
    narration: 'Dogs sharing the same name — the canine namesakes.',
    apply: (f) => ({ ...f, breedSearch: '', chartMetric: 'count' })
  },
  {
    title: 'Surprise insight',
    narration: 'And finally — a surprise slice of Cambridge canine life.',
    apply: (f) => ({ ...f, breedSearch: '', tiers: new Set(['uncommon']), mapMode: 'density' })
  }
];

export default function StoryScrubber({ chapter, setChapter, applyChapter }) {
  return (
    <div className="panel">
      <h3>📖 Story Scrubber</h3>
      <div className="scrubber">
        <button className="btn" onClick={() => { const i = Math.max(0, chapter - 1); setChapter(i); applyChapter(i); }}>◀</button>
        <input
          type="range" min={0} max={CHAPTERS.length - 1} value={chapter}
          onChange={(e) => { const i = +e.target.value; setChapter(i); applyChapter(i); }}
        />
        <button className="btn" onClick={() => { const i = Math.min(CHAPTERS.length - 1, chapter + 1); setChapter(i); applyChapter(i); }}>▶</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <div className="chapter-title">Ch. {chapter + 1} · {CHAPTERS[chapter].title}</div>
        <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 4 }}>{CHAPTERS[chapter].narration}</div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
        Note: this dataset has no meaningful event date for a timeline, so chapters move
        through the data story instead.
      </div>
    </div>
  );
}

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

export function BarkBanner({ bark, setChapter, applyChapter }) {
  if (!bark.active) return null;
  return (
    <div className="bark-banner">
      <span>🎬 Bark Mode · Ch. {bark.i + 1}/{CHAPTERS.length}: {CHAPTERS[bark.i].title}</span>
      <button className="btn" onClick={() => bark.setPaused(!bark.paused)}>{bark.paused ? '▶ Resume' : '⏸ Pause'}</button>
      <button className="btn" onClick={() => bark.setSpeed(bark.speed === 1 ? 2 : bark.speed === 2 ? 0.5 : 1)}>{bark.speed}×</button>
      <button className="btn danger" onClick={bark.stop}>Exit</button>
    </div>
  );
}
