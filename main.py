import pickle
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel,Field

#load model & scaler

with open("kmeans_model.pkl","rb") as f:
    kmeans_model=pickle.load(f)

with open("scaler.pkl","rb") as f:
    scaler=pickle.load(f)

#Cluster - label mapping

# Based on cluster_summary output from training:
# Cluster 3: Recency=18.5,  Freq=15.0, Monetary=6498  -> Champions
# Cluster 0: Recency=46.5,  Freq=4.1,  Monetary=1454  -> Loyal / Regular Customers
# Cluster 2: Recency=58.8,  Freq=1.5,  Monetary=362   -> New / Occasional Customers
# Cluster 1: Recency=260.2, Freq=1.4,  Monetary=357   -> At Risk / Dormant
 
CLUSTER_LABELS = {
    0: "Loyal / Regular Customer",
    1: "At Risk / Dormant Customer",
    2: "New / Occasional Customer",
    3: "Champion / High-Value Customer",
}

CLUSTER_DESCRIPTIONS = {
    0: "Buys fairly regularly with solid spend. Reward with loyalty perks.",
    1: "Hasn't purchased in a long time. Target with re-engagement campaigns/discounts.",
    2: "Newer or occasional buyer with low spend so far. Nurture towards repeat purchases.",
    3: "Highest frequency and spend, most recent purchase. Prioritize retention and VIP treatment.",
}

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
 

@app.get("/")
def root():
    return {"message": "Customer Segmentation API is running"}
 
 
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