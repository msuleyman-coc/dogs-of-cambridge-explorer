import React, { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#ffb454', '#7cc7ff', '#67e8a4', '#ff8aa0', '#c39bff', '#ffd86b', '#5ad6c5'];

export default function ChartsPanel({ stats, baselineStats, metric, dogs }) {
  const topBreeds = stats.breedCounts.slice(0, 12);
  const topNames  = stats.nameCounts.slice(0, 12);
  const breedPie  = stats.breedCounts.slice(0, 6);
  const nbCounts  = stats.neighborhoodCounts;

  const data = useMemo(() => transform(topBreeds, metric, stats.total, baselineStats), [topBreeds, metric, stats.total, baselineStats]);
  const dataNames = useMemo(() => transform(topNames, metric, stats.total, baselineStats, 'name'), [topNames, metric, stats.total, baselineStats]);

  return (
    <div className="panel charts-panel">
      <h3>Charts & Insights</h3>
      <div className="scroll">
        <div className="chart-grid">
          <Card title={`Top breeds (${metric})`}>
            <ChartBar data={data} dataKey="value" />
          </Card>
          <Card title={`Top dog names (${metric})`}>
            <ChartBar data={dataNames} dataKey="value" color="#7cc7ff" />
          </Card>
          <Card title="Breed distribution (top 6)">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={breedPie} dataKey="count" nameKey="label" outerRadius={80} innerRadius={40}>
                  {breedPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Breed diversity by neighborhood">
            <NeighborhoodDiversity dogs={dogs} />
          </Card>
        </div>

        <Card title="Top dog names (top 40)" style={{ marginTop: 12 }}>
          <div className="name-wall">
            {stats.nameCounts.slice(0, 40).map((n) => (
              <span className="nm" key={n.label}>{n.label}<strong>{n.count}</strong></span>
            ))}
            {!stats.nameCounts.length && <span style={{ color: 'var(--text-dim)' }}>No names yet.</span>}
          </div>
        </Card>

        <Card title="Breed summary" style={{ marginTop: 12 }}>
          <div className="row-cards">
            {stats.breedCounts.slice(0, 8).map((b) => (
              <div className="row-card" key={b.label}>
                <span>{b.label}</span>
                <span style={{ color: 'var(--text-dim)' }}>{b.count} dogs · {((b.count / Math.max(stats.total, 1)) * 100).toFixed(1)}%</span>
              </div>
            ))}
            {!stats.breedCounts.length && <div className="empty-state">No dogs to group.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children, style }) {
  return (
    <div className="chart-card" style={style}>
      <h4>{title}</h4>
      {children}
    </div>
  );
}

const tooltipStyle = {
  background: '#101a2d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#eef2f9'
};

function ChartBar({ data, dataKey, color = '#ffb454' }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 30 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a9b6cf' }} angle={-30} textAnchor="end" interval={0} height={50} />
        <YAxis tick={{ fontSize: 10, fill: '#a9b6cf' }} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function transform(rows, metric, total, baselineStats, kind = 'breed') {
  if (!rows.length) return [];
  return rows.map((r) => {
    let value = r.count;
    if (metric === 'percent') value = total ? +(r.count / total * 100).toFixed(2) : 0;
    else if (metric === 'rarity') {
      const baseList = kind === 'breed' ? baselineStats.breedCounts : baselineStats.nameCounts;
      const baseEntry = baseList.find((b) => b.label === r.label);
      const baseCount = baseEntry?.count || 1;
      value = +(r.count / baseCount * 100).toFixed(1); // representation strength
    } else if (metric === 'diversity') {
      value = +(r.count / Math.max(total, 1) * 100).toFixed(2);
    }
    return { label: r.label, value, count: r.count };
  });
}

function NeighborhoodDiversity({ dogs }) {
  const data = useMemo(() => {
    const map = new Map();
    for (const d of dogs) {
      if (!d.neighborhood) continue;
      if (!map.has(d.neighborhood)) map.set(d.neighborhood, new Set());
      if (d.breed) map.get(d.neighborhood).add(d.breed);
    }
    return [...map.entries()]
      .map(([label, set]) => ({ label, value: set.size }))
      .sort((a, b) => b.value - a.value);
  }, [dogs]);
  if (!data.length) return <div className="empty-state">No area data available.</div>;
  return <ChartBar data={data} dataKey="value" color="#67e8a4" />;
}
