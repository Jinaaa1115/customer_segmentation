import pickle
import json
import csv

import numpy as np
from fastapi import FastAPI,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel,Field
from typing import Optional,List

#load model & scaler

with open("kmeans_model.pkl","rb") as f:
    kmeans_model=pickle.load(f)

with open("scaler.pkl","rb") as f:
    scaler=pickle.load(f)

#load- dashboard data

try:
    with open("cluster_summary.json", "r") as f:
        CLUSTER_DATA = json.load(f)
except FileNotFoundError:
    CLUSTER_DATA = {"total_customers": 0, "total_revenue": 0, "optimal_k": 0, "clusters": []}
 
try:
    with open("sample_customers.csv", "r") as f:
        SAMPLE_CUSTOMERS = list(csv.DictReader(f))
except FileNotFoundError:
    SAMPLE_CUSTOMERS = []
 
CLUSTER_COLORS = {
    0: "#4C9A8C",  # Loyal - teal
    1: "#E0665B",  # At Risk - coral
    2: "#5B8DEF",  # New - sky blue
    3: "#D4A24C",  # Champion - amber
}
 
# Fallback labels used only if cluster_summary.json isn't present yet
_DEFAULT_LABELS = {
    0: "Loyal / Regular Customer",
    1: "At Risk / Dormant Customer",
    2: "New / Occasional Customer",
    3: "Champion / High-Value Customer",
}
_DEFAULT_DESCRIPTIONS = {
    0: "Buys fairly regularly with solid spend. Reward with loyalty perks.",
    1: "Hasn't purchased in a long time. Target with re-engagement campaigns/discounts.",
    2: "Newer or occasional buyer with low spend so far. Nurture towards repeat purchases.",
    3: "Highest frequency and spend, most recent purchase. Prioritize retention and VIP treatment.",
}

CLUSTER_LABELS = {c["cluster"]: c["label"] for c in CLUSTER_DATA["clusters"]} or _DEFAULT_LABELS
CLUSTER_DESCRIPTIONS = {
    c["cluster"]: c["description"] for c in CLUSTER_DATA["clusters"]
} or _DEFAULT_DESCRIPTIONS
 
 

#FastAPI app

app=FastAPI(title="Customer Segmentation API", version="1.0")

# Allow frontend (React/Vite) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict this to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CustomerRFM(BaseModel):
    recency: float = Field(..., description="Days since last purchase", ge=0)
    frequency: int = Field(..., description="Number of purchases/orders", ge=0)
    monetary: float = Field(..., description="Total amount spent", ge=0)
 

class SegmentResponse(BaseModel):
    cluster: int
    segment_label: str
    description: str
 
class ClusterSummary(BaseModel):
    cluster: int
    label: str
    description: str
    color: str
    count: int
    pct_of_customers: float
    recency_mean: float
    frequency_mean: float
    monetary_mean: float
    revenue_total: float
    pct_of_revenue: float

class DashboardOverview(BaseModel):
    total_customers: int
    total_revenue: float
    optimal_k: int
    clusters: List[ClusterSummary]
 
 
class CustomerRecord(BaseModel):
    customer_id: str
    recency: float
    frequency: int
    monetary: float
    cluster: int
    label: str


@app.get("/")
def root():
    return {"message": "Customer Segmentation API is running"}
 
@app.get("/cluster-summary", response_model=DashboardOverview)
def cluster_summary():
    """Aggregated stats per cluster - powers the dashboard overview charts."""
    clusters = [
        ClusterSummary(**c, color=CLUSTER_COLORS.get(c["cluster"], "#8B93A8"))
        for c in CLUSTER_DATA["clusters"]
    ]
    return DashboardOverview(
        total_customers=CLUSTER_DATA["total_customers"],
        total_revenue=CLUSTER_DATA["total_revenue"],
        optimal_k=CLUSTER_DATA["optimal_k"],
        clusters=clusters,
    )

@app.get("/customers", response_model=List[CustomerRecord])
def get_customers(cluster: Optional[int] = None, limit: int = 50):
    """Sample customer list with RFM values and segment - powers the explorer table."""
    records = SAMPLE_CUSTOMERS
 
    if cluster is not None:
        records = [r for r in records if int(r["Cluster"]) == cluster]
        if not records and cluster not in CLUSTER_LABELS:
            raise HTTPException(status_code=404, detail=f"Cluster {cluster} not found")
 
    limit = min(limit, 150)
    records = records[:limit]
 
    return [
        CustomerRecord(
            customer_id=str(r["CustomerID"]),
            recency=round(float(r["Recency"]), 1),
            frequency=int(float(r["Frequency"])),
            monetary=round(float(r["Monetary"]), 2),
            cluster=int(r["Cluster"]),
            label=r["Label"],
        )
        for r in records
    ]
 
@app.post("/predict-segment", response_model=SegmentResponse)
def predict_segment(customer: CustomerRFM):
    # Apply same log-transform used during training
    frequency_log = np.log1p(customer.frequency)
    monetary_log = np.log1p(customer.monetary)
 
    # Build feature array in the same order used during training: [Recency, Frequency_log, Monetary_log]
    features = np.array([[customer.recency, frequency_log, monetary_log]])
 
    # Scale using the saved scaler
    scaled_features = scaler.transform(features)
 
    # Predict cluster
    cluster = int(kmeans_model.predict(scaled_features)[0])
 
    return SegmentResponse(
        cluster=cluster,
        segment_label=CLUSTER_LABELS.get(cluster, "Unknown"),
        description=CLUSTER_DESCRIPTIONS.get(cluster, ""),
    )