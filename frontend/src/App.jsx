import { useState } from "react";
import Overview from "./components/Overview";
import Explore from "./components/Explore";
import Predict from "./components/Predict";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "explore", label: "Explore customers" },
  { id: "predict", label: "Predict segment" },
];

export default function App() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="min-h-screen bg-base-bg text-base-text font-body py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-base-muted font-display mb-1">
            RFM + K-Means
          </p>
          <h1 className="text-2xl font-display font-medium">Customer segmentation dashboard</h1>
          <p className="text-sm text-base-muted mt-1">
            Behavioral segments derived from recency, frequency, and monetary analysis
          </p>
        </div>

        <div className="flex gap-1 mb-6 border-b border-base-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-sm font-display px-4 py-2.5 border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? "border-newcust text-newcust"
                  : "border-transparent text-base-muted hover:text-base-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <Overview />}
        {tab === "explore" && <Explore />}
        {tab === "predict" && <Predict />}
      </div>
    </div>
  );
}
