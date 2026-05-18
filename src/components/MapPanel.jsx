import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CAMBRIDGE_CENTER, NEIGHBORHOODS } from '../data/location.js';
import { densityCells } from '../data/insights.js';

// Cap rendered markers in pinpoint mode for snappy interaction
const MARKER_CAP = 1500;

const TIER_COLOR = { common: '#67e8a4', uncommon: '#ffcf6b', rare: '#ff8aa0', unknown: '#7cc7ff' };

export default function MapPanel({ dogs, mode, colorBy = 'tier' }) {
  return (
    <div className="panel map-wrap">
      <MapContainer center={CAMBRIDGE_CENTER} zoom={13} scrollWheelZoom>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        {mode === 'pinpoint' ? <PinpointLayer dogs={dogs} colorBy={colorBy} /> : <DensityLayer dogs={dogs} />}
        <NeighborhoodAnchors />
      </MapContainer>
      {mode === 'pinpoint' && <Legend colorBy={colorBy} />}
      <div className="map-note">
        ⚠️ Approximate visualization — the public Dogs of Cambridge dataset does not include
        addresses or coordinates. Each pin is a deterministic placement inside the dog's
        likely neighborhood, intended only for exploratory visualization.
      </div>
    </div>
  );
}

function NeighborhoodAnchors() {
  return NEIGHBORHOODS.map((n) => (
    <Circle key={n.name} center={[n.lat, n.lng]} radius={50}
      pathOptions={{ color: 'rgba(255,180,84,0.4)', fillOpacity: 0.6 }} />
  ));
}

function colorFor(d, colorBy) {
  if (colorBy === 'gender') {
    if (d.gender === 'Female') return '#ff8aa0';
    if (d.gender === 'Male') return '#7cc7ff';
    return '#c39bff';
  }
  return TIER_COLOR[d.tier || 'unknown'];
}

function Legend({ colorBy }) {
  const items = colorBy === 'gender'
    ? [['Female', '#ff8aa0'], ['Male', '#7cc7ff'], ['Other/Unknown', '#c39bff']]
    : [['Common', TIER_COLOR.common], ['Uncommon', TIER_COLOR.uncommon], ['Rare', TIER_COLOR.rare]];
  return (
    <div className="map-legend">
      <div style={{ fontWeight: 600, marginBottom: 2 }}>Color: {colorBy}</div>
      {items.map(([label, color]) => (
        <div className="row" key={label}>
          <span className="swatch" style={{ background: color }} />{label}
        </div>
      ))}
    </div>
  );
}

function PinpointLayer({ dogs, colorBy }) {
  const subset = useMemo(() => dogs.slice(0, MARKER_CAP), [dogs]);
  return (
    <>
      {subset.map((d) => {
        const c = colorFor(d, colorBy);
        return (
        <CircleMarker
          key={d.id}
          center={[d.lat, d.lng]}
          radius={5}
          pathOptions={{
            color: c, weight: 1, fillColor: c, fillOpacity: 0.85
          }}
        >
          <Popup>
            <div className="popup-card">
              <div className="name">🐕 {d.name || 'Unnamed pup'}</div>
              <div className="breed">{d.breed || 'Breed unknown'}</div>
              <div style={{ marginTop: 4, fontSize: 12 }}>
                {d.gender && <span>{d.gender}</span>}
                {d.birthYear && <span> · born {d.birthYear}</span>}
              </div>
              <div className="approx">
                ~ {d.neighborhood} · approximate location
              </div>
            </div>
          </Popup>
        </CircleMarker>
      );})}
      {dogs.length > MARKER_CAP && <RenderCapBadge total={dogs.length} shown={MARKER_CAP} />}
    </>
  );
}

function RenderCapBadge({ total, shown }) {
  const map = useMap();
  const ref = useRef(null);
  useEffect(() => {
    const ctrl = L.control({ position: 'topright' });
    ctrl.onAdd = () => {
      const div = L.DomUtil.create('div');
      div.style.cssText = 'background:rgba(15,22,36,0.7);border:1px solid rgba(255,255,255,0.1);padding:6px 10px;border-radius:10px;font-size:11px;color:#cdd6e8';
      div.innerHTML = `Rendering ${shown.toLocaleString()} of ${total.toLocaleString()} pins — switch to density to see all.`;
      return div;
    };
    ctrl.addTo(map);
    ref.current = ctrl;
    return () => ctrl.remove();
  }, [map, total, shown]);
  return null;
}

function DensityLayer({ dogs }) {
  const cells = useMemo(() => densityCells(dogs, 0.003), [dogs]);
  const max = cells.reduce((m, c) => Math.max(m, c.count), 1);
  return cells.map((c, i) => {
    const t = c.count / max;
    const color = lerpColor('#7cc7ff', '#ff5c8a', t);
    return (
      <Circle key={i} center={[c.lat, c.lng]} radius={140 + t * 220}
        pathOptions={{ color, fillColor: color, fillOpacity: 0.35 + t * 0.45, weight: 0 }}>
        <Popup>{c.count} dogs near here (approx.)</Popup>
      </Circle>
    );
  });
}

function lerpColor(a, b, t) {
  const pa = hex(a), pb = hex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}
function hex(c) {
  const v = c.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
