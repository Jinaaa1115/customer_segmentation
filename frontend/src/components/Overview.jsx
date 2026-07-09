import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell,
} from "recharts";
import { CLUSTER_SUMMARY_URL, CLUSTER_STYLES } from "../api";

function MetricCard({ label, value }) {
  return (
    <div className="bg-base-surface2 rounded-md p-4">
      <p className="text-xs text-base-muted font-body mb-1">{label}</p>
      <p className="text-2xl font-display font-medium text-base-text">{value}</p>
    </div>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-base-surface border border-base-border rounded-md px-3 py-2 text-xs font-body">
      <p className="text-base-text font-medium mb-1">{d.label}</p>
      <p className="text-base-muted">{payload[0].name}: <span className="text-base-text font-mono">{payload[0].value}</span></p>
    </div>
  );
}

export default function Overview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(CLUSTER_SUMMARY_URL)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Couldn't load dashboard data. Make sure the backend is running."));
  }, []);

  if (error) {
    return <div className="text-atrisk text-sm bg-atrisk/10 border border-atrisk/30 rounded-lg p-4">{error}</div>;
  }

  if (!data) {
    return <div className="text-base-muted text-sm">Loading dashboard...</div>;
  }

  const barData = data.clusters.map((c) => ({
    label: c.label.split(" / ")[0],
    count: c.count,
    revenue_pct: c.pct_of_revenue,
    fill: CLUSTER_STYLES[c.cluster]?.hex || "#8B93A8",
  }));

  const scatterByCluster = data.clusters.map((c) => ({
    cluster: c.cluster,
    label: c.label,
    color: CLUSTER_STYLES[c.cluster]?.hex || "#8B93A8",
    points: [{ x: c.recency_mean, y: c.monetary_mean, z: c.frequency_mean }],
  }));

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total customers" value={data.total_customers.toLocaleString()} />
        <MetricCard label="Total revenue" value={`₹${Math.round(data.total_revenue).toLocaleString()}`} />
        <MetricCard label="Segments (K)" value={data.optimal_k} />
        <MetricCard
          label="Top segment share"
          value={`${Math.max(...data.clusters.map((c) => c.pct_of_revenue))}% revenue`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-base-surface border border-base-border rounded-lg p-4">
          <p className="text-xs text-base-muted font-display mb-3">Customers per segment</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333D57" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#8B93A8", fontSize: 11 }} axisLine={{ stroke: "#333D57" }} tickLine={false} />
              <YAxis tick={{ fill: "#8B93A8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="count" name="Customers" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-base-surface border border-base-border rounded-lg p-4">
          <p className="text-xs text-base-muted font-display mb-3">Revenue share per segment</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333D57" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#8B93A8", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <YAxis dataKey="label" type="category" tick={{ fill: "#8B93A8", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="revenue_pct" name="% of revenue" radius={[0, 4, 4, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-base-surface border border-base-border rounded-lg p-4 mb-6">
        <p className="text-xs text-base-muted font-display mb-1">Cluster centroids — Recency vs Monetary</p>
        <p className="text-xs text-base-muted/70 mb-3">Bubble size represents average purchase frequency</p>
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333D57" />
            <XAxis type="number" dataKey="x" name="Recency" unit=" days" tick={{ fill: "#8B93A8", fontSize: 11 }} axisLine={{ stroke: "#333D57" }} tickLine={false} />
            <YAxis type="number" dataKey="y" name="Monetary" unit="₹" tick={{ fill: "#8B93A8", fontSize: 11 }} axisLine={{ stroke: "#333D57" }} tickLine={false} />
            <ZAxis type="number" dataKey="z" range={[100, 900]} name="Frequency" />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload;
                return (
                  <div className="bg-base-surface border border-base-border rounded-md px-3 py-2 text-xs font-body">
                    <p className="text-base-text font-medium mb-1">{p.label}</p>
                    <p className="text-base-muted">Recency: <span className="font-mono text-base-text">{p.x}d</span></p>
                    <p className="text-base-muted">Monetary: <span className="font-mono text-base-text">₹{p.y}</span></p>
                    <p className="text-base-muted">Frequency: <span className="font-mono text-base-text">{p.z}</span></p>
                  </div>
                );
              }}
            />
            {scatterByCluster.map((s) => (
              <Scatter key={s.cluster} name={s.label} data={s.points.map(pt => ({ ...pt, label: s.label }))} fill={s.color} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {data.clusters.map((c) => {
          const style = CLUSTER_STYLES[c.cluster] || {};
          return (
            <div key={c.cluster} className={`rounded-lg border ${style.border} ${style.bg} p-4`}>
              <p className={`font-display font-medium text-sm mb-1 ${style.accent}`}>{c.label}</p>
              <p className="text-xs text-base-muted mb-2 leading-relaxed">{c.description}</p>
              <div className="flex gap-4 text-xs font-mono text-base-muted">
                <span>{c.count} customers</span>
                <span>{c.pct_of_revenue}% revenue</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
