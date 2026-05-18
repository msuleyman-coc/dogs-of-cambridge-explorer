import React, { useEffect, useState } from 'react';

// Tiny SVG dog companion with several emotional states.
export default function DogCompanion({ state = 'idle', message }) {
  const [bark, setBark] = useState(false);
  useEffect(() => {
    if (state === 'excited') {
      setBark(true);
      const t = setTimeout(() => setBark(false), 1200);
      return () => clearTimeout(t);
    }
  }, [state]);

  const eye = state === 'no-results' ? 'sad' :
              state === 'thinking'  ? 'thinking' :
              state === 'excited'   ? 'happy' : 'normal';

  return (
    <div className={`dog-companion ${state}`} aria-hidden>
      {bark && (
        <div style={{
          position: 'absolute', right: 100, bottom: 70,
          background: '#fff', color: '#1a1208', padding: '6px 10px',
          borderRadius: 14, fontSize: 12, fontWeight: 700, boxShadow: '0 6px 18px rgba(0,0,0,0.3)'
        }}>
          Woof! 🐾
        </div>
      )}
      {message && (
        <div style={{
          position: 'absolute', right: 100, bottom: 30, maxWidth: 220,
          background: 'rgba(20,30,50,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#eef2f9', padding: '8px 12px', borderRadius: 14, fontSize: 12,
          boxShadow: '0 6px 18px rgba(0,0,0,0.4)'
        }}>{message}</div>
      )}
      <svg className="dog-svg" width="110" height="100" viewBox="0 0 120 100">
        <g className="body">
          {/* tail */}
          <path className="tail" d="M80 60 Q100 40 105 25" stroke="#c98a4b" strokeWidth="7" strokeLinecap="round" fill="none"/>
          {/* body */}
          <ellipse cx="55" cy="65" rx="32" ry="22" fill="#d8a06a"/>
          {/* legs */}
          <rect x="32" y="80" width="7" height="14" rx="3" fill="#b9824c"/>
          <rect x="46" y="80" width="7" height="14" rx="3" fill="#b9824c"/>
          <rect x="62" y="80" width="7" height="14" rx="3" fill="#b9824c"/>
          <rect x="76" y="80" width="7" height="14" rx="3" fill="#b9824c"/>
          {/* head */}
          <ellipse cx="30" cy="50" rx="22" ry="20" fill="#e0a972"/>
          {/* ear */}
          <path d="M15 38 Q8 50 18 60 Z" fill="#a06b3f"/>
          {/* snout */}
          <ellipse cx="14" cy="56" rx="10" ry="6" fill="#f1c896"/>
          <circle cx="8" cy="54" r="2.5" fill="#222"/>
          {/* eye */}
          {eye === 'normal'   && <circle cx="28" cy="46" r="2.6" fill="#222"/>}
          {eye === 'happy'    && <path d="M25 46 Q28 42 31 46" stroke="#222" strokeWidth="2" fill="none"/>}
          {eye === 'sad'      && <path d="M25 48 Q28 52 31 48" stroke="#222" strokeWidth="2" fill="none"/>}
          {eye === 'thinking' && <circle cx="28" cy="46" r="2.6" fill="#222" opacity="0.6"/>}
          {/* collar */}
          <rect x="40" y="60" width="14" height="4" rx="1" fill="#ffb454"/>
          <circle cx="47" cy="64" r="2" fill="#ffd86b"/>
        </g>
      </svg>
    </div>
  );
}
