import React, { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

export default function ChartsPanel({ stats, dogs }) {
  const topBreeds = stats.breedCounts.slice(0, 12);
  const topNames  = stats.nameCounts.slice(0, 12);

  const breedData = useMemo(() => topBreeds.map((r) => ({ label: r.label, value: r.count })), [topBreeds]);
  const nameData  = useMemo(() => topNames.map((r) => ({ label: r.label, value: r.count })),  [topNames]);

  return (
    <div className="panel charts-panel">
      <h3>Charts & Insights</h3>
      <div className="scroll">
        <div className="chart-grid">
          {/* Left column: breed-focused charts */}
          <Card title="Top breeds (count)">
            <ChartBar data={breedData} dataKey="value" color="#ffb454" />
          </Card>
          {/* Right column: name-focused charts */}
          <Card title="Top dog names (count)">
            <ChartBar data={nameData} dataKey="value" color="#7cc7ff" />
          </Card>

          <Card title="Breed diversity by neighborhood">
            <DiversityBar dogs={dogs} field="breed" color="#67e8a4" />
          </Card>
          <Card title="Name diversity by neighborhood">
            <DiversityBar dogs={dogs} field="name" color="#c39bff" />
          </Card>
        </div>
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

function DiversityBar({ dogs, field, color }) {
  const data = useMemo(() => {
    const map = new Map();
    for (const d of dogs) {
      if (!d.neighborhood) continue;
      if (!map.has(d.neighborhood)) map.set(d.neighborhood, new Set());
      if (d[field]) map.get(d.neighborhood).add(d[field]);
    }
    return [...map.entries()]
      .map(([label, set]) => ({ label, value: set.size }))
      .sort((a, b) => b.value - a.value);
  }, [dogs, field]);
  if (!data.length) return <div className="empty-state">No area data available.</div>;
  return <ChartBar data={data} dataKey="value" color={color} />;
}
