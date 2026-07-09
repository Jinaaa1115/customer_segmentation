const RAW_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/predict-segment";

// Derive the API root regardless of whether VITE_API_URL includes /predict-segment or not
export const API_BASE = RAW_BASE.replace(/\/predict-segment\/?$/, "");
export const PREDICT_URL = `${API_BASE}/predict-segment`;
export const CLUSTER_SUMMARY_URL = `${API_BASE}/cluster-summary`;
export const CUSTOMERS_URL = `${API_BASE}/customers`;

export const CLUSTER_STYLES = {
  3: { accent: "text-champion", bg: "bg-champion/15", border: "border-champion/40", bar: "bg-champion", hex: "#D4A24C" },
  0: { accent: "text-loyal", bg: "bg-loyal/15", border: "border-loyal/40", bar: "bg-loyal", hex: "#4C9A8C" },
  2: { accent: "text-newcust", bg: "bg-newcust/15", border: "border-newcust/40", bar: "bg-newcust", hex: "#5B8DEF" },
  1: { accent: "text-atrisk", bg: "bg-atrisk/15", border: "border-atrisk/40", bar: "bg-atrisk", hex: "#E0665B" },
};
