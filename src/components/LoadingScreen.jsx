import React from 'react';

export default function LoadingScreen({ count }) {
  return (
    <div className="loader-screen">
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.4 }}>
        Fetching Cambridge dogs…
      </div>
      <div className="paw-track">
        <span>🐾</span><span>🐾</span><span>🐾</span><span>🐾</span><span>🐾</span>
      </div>
      <div className="loader-bar">
        <div style={{ width: `${Math.min(100, (count / 12000) * 100)}%` }} />
      </div>
      <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>
        {count.toLocaleString()} dogs sniffed out so far…
      </div>
    </div>
  );
}
