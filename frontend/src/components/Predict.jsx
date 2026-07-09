import { useState } from "react";
import { PREDICT_URL, CLUSTER_STYLES } from "../api";

const CENTROIDS = {
  recency: { min: 18.5, max: 260.2 },
  frequency: { min: 1.4, max: 15.0 },
  monetary: { min: 357, max: 6498 },
};

function clampPct(value, min, max) {
  const range = max - min || 1;
  const pct = ((value - min) / range) * 100;
  return Math.min(100, Math.max(0, pct));
}

function FingerprintBar({ label, value, unit, min, max, barColor }) {
  const pct = clampPct(value, min, max);
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-xs text-base-muted mb-1.5 font-body">
        <span>{label}</span>
        <span className="font-mono text-base-text">
          {unit === "currency" ? `₹${Math.round(value).toLocaleString()}` : Math.round(value)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-base-surface2 relative overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Predict() {
  const [form, setForm] = useState({ recency: "", frequency: "", monetary: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(PREDICT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recency: Number(form.recency),
          frequency: Number(form.frequency),
          monetary: Number(form.monetary),
        }),
      });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      setResult(await response.json());
    } catch {
      setError("Couldn't reach the prediction API. Make sure the FastAPI server is running.");
    } finally {
      setLoading(false);
    }
  };

  const style = result ? CLUSTER_STYLES[result.cluster] : null;
  const isValid = form.recency !== "" && form.frequency !== "" && form.monetary !== "";

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit} className="bg-base-surface border border-base-border rounded-lg p-5 mb-5">
        <div className="mb-4">
          <label className="block text-xs text-base-muted mb-1.5 font-body">
            Recency <span className="text-base-muted/70">(days since last purchase)</span>
          </label>
          <input
            type="number" min="0" required value={form.recency} onChange={handleChange("recency")}
            placeholder="e.g. 20"
            className="w-full bg-base-surface2 border border-base-border rounded-md px-3 py-2 text-sm font-mono text-base-text placeholder:text-base-muted/50 focus:outline-none focus:border-newcust/60"
          />
        </div>
        <div className="mb-4">
          <label className="block text-xs text-base-muted mb-1.5 font-body">
            Frequency <span className="text-base-muted/70">(number of orders)</span>
          </label>
          <input
            type="number" min="0" required value={form.frequency} onChange={handleChange("frequency")}
            placeholder="e.g. 10"
            className="w-full bg-base-surface2 border border-base-border rounded-md px-3 py-2 text-sm font-mono text-base-text placeholder:text-base-muted/50 focus:outline-none focus:border-newcust/60"
          />
        </div>
        <div className="mb-5">
          <label className="block text-xs text-base-muted mb-1.5 font-body">
            Monetary <span className="text-base-muted/70">(total amount spent)</span>
          </label>
          <input
            type="number" min="0" required value={form.monetary} onChange={handleChange("monetary")}
            placeholder="e.g. 1000"
            className="w-full bg-base-surface2 border border-base-border rounded-md px-3 py-2 text-sm font-mono text-base-text placeholder:text-base-muted/50 focus:outline-none focus:border-newcust/60"
          />
        </div>
        <button
          type="submit" disabled={!isValid || loading}
          className="w-full bg-newcust text-base-bg font-display font-medium text-sm rounded-md py-2.5 hover:bg-newcust/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Predicting..." : "Predict segment"}
        </button>
      </form>

      {error && (
        <div className="bg-atrisk/10 border border-atrisk/30 rounded-lg p-4 text-sm text-atrisk">{error}</div>
      )}

      {result && style && (
        <div className={`rounded-lg border ${style.border} ${style.bg} p-5`}>
          <p className="text-xs uppercase tracking-wider text-base-muted font-display mb-1">Predicted segment</p>
          <h2 className={`text-xl font-display font-medium ${style.accent} mb-2`}>{result.segment_label}</h2>
          <p className="text-sm text-base-muted mb-5 leading-relaxed">{result.description}</p>

          <div className="border-t border-base-border pt-4">
            <p className="text-xs text-base-muted font-display mb-3">
              RFM fingerprint <span className="text-base-muted/60">(vs. cluster range)</span>
            </p>
            <FingerprintBar label="Recency" value={Number(form.recency)} min={CENTROIDS.recency.min} max={CENTROIDS.recency.max} barColor={style.bar} />
            <FingerprintBar label="Frequency" value={Number(form.frequency)} min={CENTROIDS.frequency.min} max={CENTROIDS.frequency.max} barColor={style.bar} />
            <FingerprintBar label="Monetary" value={Number(form.monetary)} unit="currency" min={CENTROIDS.monetary.min} max={CENTROIDS.monetary.max} barColor={style.bar} />
          </div>
        </div>
      )}
    </div>
  );
}
