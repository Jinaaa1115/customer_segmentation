import { useEffect, useState } from "react";
import { CUSTOMERS_URL, CLUSTER_STYLES } from "../api";

const FILTERS = [
  { label: "All", value: null },
  { label: "Champion", value: 3 },
  { label: "Loyal", value: 0 },
  { label: "New", value: 2 },
  { label: "At risk", value: 1 },
];

export default function Explore() {
  const [customers, setCustomers] = useState([]);
  const [filter, setFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url = filter === null ? `${CUSTOMERS_URL}?limit=50` : `${CUSTOMERS_URL}?cluster=${filter}&limit=50`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setCustomers(data))
      .catch(() => setError("Couldn't load customers. Make sure the backend is running."))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={`text-xs font-body px-3 py-1.5 rounded-md border transition-colors ${
              filter === f.value
                ? "bg-newcust/15 border-newcust/40 text-newcust"
                : "border-base-border text-base-muted hover:border-base-muted/50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-atrisk text-sm bg-atrisk/10 border border-atrisk/30 rounded-lg p-4">{error}</div>
      )}

      {!error && (
        <div className="bg-base-surface border border-base-border rounded-lg overflow-hidden">
          <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="border-b border-base-border text-left">
                <th className="px-4 py-2.5 text-xs font-body text-base-muted font-medium w-24">Customer ID</th>
                <th className="px-4 py-2.5 text-xs font-body text-base-muted font-medium w-24">Recency</th>
                <th className="px-4 py-2.5 text-xs font-body text-base-muted font-medium w-24">Frequency</th>
                <th className="px-4 py-2.5 text-xs font-body text-base-muted font-medium w-28">Monetary</th>
                <th className="px-4 py-2.5 text-xs font-body text-base-muted font-medium">Segment</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-base-muted text-xs">
                    Loading...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-base-muted text-xs">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const style = CLUSTER_STYLES[c.cluster] || {};
                  return (
                    <tr key={c.customer_id} className="border-b border-base-border last:border-0">
                      <td className="px-4 py-2.5 font-mono text-xs text-base-text truncate">{c.customer_id}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-base-muted">{c.recency}d</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-base-muted">{c.frequency}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-base-muted">₹{c.monetary.toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded ${style.bg} ${style.accent}`}>
                          {c.label.split(" / ")[0]}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
