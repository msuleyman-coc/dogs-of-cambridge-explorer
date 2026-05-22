import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Tooltip as LTooltip } from 'react-leaflet';
import { CAMBRIDGE_CENTER, NEIGHBORHOODS_GEOJSON_URL } from '../data/location.js';

// Choropleth map: shade each Cambridge neighborhood polygon by the count
// of filtered dogs whose `neighborhood` field matches the polygon's name.
//
// Polygons come from the City of Cambridge open data portal at runtime.
// Counts come directly from filtered Dogs of Cambridge records; no values
// are synthesized.

export default function MapPanel({ dogs }) {
  const [geo, setGeo] = useState(null);
  const [geoError, setGeoError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(NEIGHBORHOODS_GEOJSON_URL);
        if (!res.ok) throw new Error(`Neighborhood polygons fetch failed: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setGeo(toFeatureCollection(data));
      } catch (e) {
        if (!cancelled) setGeoError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Count dogs per neighborhood from the filtered set.
  const counts = useMemo(() => {
    const m = new Map();
    for (const d of dogs) {
      if (!d.neighborhood) continue;
      m.set(d.neighborhood, (m.get(d.neighborhood) || 0) + 1);
    }
    return m;
  }, [dogs]);

  const maxCount = useMemo(
    () => [...counts.values()].reduce((m, v) => Math.max(m, v), 0),
    [counts]
  );

  const style = (feature) => {
    const name = neighborhoodName(feature);
    const c = counts.get(name) || 0;
    const t = maxCount > 0 ? c / maxCount : 0;
    return {
      color: '#3b0a0a',
      weight: 2,
      opacity: 0.9,
      fillColor: shade(t),
      // Opacity scales with density too, so high-count areas read as a
      // clearly darker red against the light basemap.
      fillOpacity: c > 0 ? 0.55 + t * 0.40 : 0.05
    };
  };

  const onEachFeature = (feature, layer) => {
    const name = neighborhoodName(feature) || 'Unknown';
    const c = counts.get(name) || 0;
    // Always-visible name label, centered on each polygon.
    layer.bindTooltip(name, {
      permanent: true,
      direction: 'center',
      className: 'nb-label',
      opacity: 1
    });
    // Hover tooltip with the count.
    layer.bindPopup(
      `<div style="font-weight:600">${name}</div>
       <div>${c.toLocaleString()} matching dog${c === 1 ? '' : 's'}</div>`
    );
    layer.on('mouseover', (e) => e.target.setStyle({ weight: 3, color: '#1a0303' }));
    layer.on('mouseout',  (e) => e.target.setStyle({ weight: 2, color: '#3b0a0a' }));
  };

  return (
    <div className="panel map-wrap">
      <MapContainer center={CAMBRIDGE_CENTER} zoom={13} scrollWheelZoom>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        {geo && (
          <GeoJSON
            // Re-render when counts change so style() picks up new values.
            key={`geo-${maxCount}-${counts.size}-${dogs.length}`}
            data={geo}
            style={style}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      <ChoroplethLegend max={maxCount} />

      {geoError && (
        <div className="map-note" style={{ color: 'var(--sad)' }}>
          Couldn’t load Cambridge neighborhood polygons ({geoError}). The base
          map is still shown; reload to retry.
        </div>
      )}
      {!geoError && (
        <div className="map-note">
          Neighborhood polygons: City of Cambridge open data
          (<code>k3pi-9823</code>). Counts: filtered Dogs of Cambridge records
          (<code>h7p5-fjms</code>); coordinates are city-published geomasked
          approximations.
        </div>
      )}
    </div>
  );
}

function ChoroplethLegend({ max }) {
  if (!max) {
    return (
      <div className="map-legend">
        <div style={{ fontWeight: 600 }}>Dogs per neighborhood</div>
        <div style={{ color: 'var(--text-dim)' }}>No dogs match the current filters.</div>
      </div>
    );
  }
  const stops = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div className="map-legend">
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Dogs per neighborhood</div>
      <div style={{
        display: 'flex', height: 10, borderRadius: 4, overflow: 'hidden',
        background: 'linear-gradient(90deg,' +
          stops.map((s) => shade(s)).join(',') + ')'
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)' }}>
        <span>0</span>
        <span>{Math.round(max / 2).toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

// Cambridge neighborhood polygons expose the name under one of a few
// property keys depending on which extract is served. Try them all.
function neighborhoodName(feature) {
  const p = feature.properties || {};
  return p.name || p.neighborhood_name || p.neighborhood || p.NAME || p.NBHD || null;
}

// Socrata's `.geojson` endpoint returns a FeatureCollection directly, but
// some legacy backends return a bare array of features.
function toFeatureCollection(data) {
  if (data && data.type === 'FeatureCollection') return data;
  if (Array.isArray(data)) return { type: 'FeatureCollection', features: data };
  return { type: 'FeatureCollection', features: [] };
}

// Sequential white → deep red density ramp (ColorBrewer Reds), t in [0, 1].
// One continuous hue so the only visual variable is lightness/saturation
// driven by density.
function shade(t) {
  const stops = [
    [0.00, [255, 245, 240]], // near-white
    [0.25, [252, 187, 161]],
    [0.50, [251, 106,  74]],
    [0.75, [222,  45,  38]],
    [1.00, [127,   0,  18]]  // deep red
  ];
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i - 1];
    const [t2, c2] = stops[i];
    if (t <= t2) {
      const f = (t - t1) / (t2 - t1 || 1);
      const r = Math.round(c1[0] + (c2[0] - c1[0]) * f);
      const g = Math.round(c1[1] + (c2[1] - c1[1]) * f);
      const b = Math.round(c1[2] + (c2[2] - c1[2]) * f);
      return `rgb(${r},${g},${b})`;
    }
  }
  const [, c] = stops[stops.length - 1];
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
