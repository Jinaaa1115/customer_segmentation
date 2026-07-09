import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
import pickle

df=pd.read_csv("data.csv",encoding="ISO-8859-1")
print(df.shape)
print(df.info())

#data cleaning

print(df.isnull().sum())
#drop rows with missing customerid
df=df.dropna(subset=["CustomerID"])

#remove cancelled orders
df=df[~df["InvoiceNo"].astype(str).str.startswith("C")]

#remove negative or zero quantity and price
df=df[(df["Quantity"]>0)& (df["UnitPrice"]>0)]

#convert invoicedate to datetime
df["InvoiceDate"]=pd.to_datetime(df["InvoiceDate"])

#create totalprice column
df["TotalPrice"]=df["Quantity"]*df["UnitPrice"]

#remove obvious outliers(top 1% of totalprice)
upper_limit=df["TotalPrice"].quantile(0.99)
df=df[df["TotalPrice"]<=upper_limit]

print("Cleaned shape:",df.shape)

#RFM feature engineering

#reference date=one day after the last transaction in the dataset
reference_date=df["InvoiceDate"].max()+ pd.Timedelta(days=1)

rfm=df.groupby("CustomerID").agg(
    Recency=("InvoiceDate",lambda x: (reference_date-x.max()).days),
    Frequency=("InvoiceNo","nunique"),
    Monetary=("TotalPrice","sum")
).reset_index()

print(rfm.describe())

#log-transform monetary and frequency to reduce skew
rfm["Monetary_log"] = np.log1p(rfm["Monetary"])
rfm["Frequency_log"] = np.log1p(rfm["Frequency"])

#Scaling

features=rfm[["Recency","Frequency_log","Monetary_log"]]

scaler=StandardScaler()
scaled_features=scaler.fit_transform(features)

#elbow method , silhouette score

inertia=[]
silhouette_scores=[]
K_range=range(2,11)

for k in K_range:
    km=KMeans(n_clusters=k,random_state=42,n_init=10)
    labels=km.fit_predict(scaled_features)
    inertia.append(km.inertia_)
    silhouette_scores.append(silhouette_score(scaled_features,labels))

#plot elbow curve
plt.figure(figsize=(12,5))

plt.subplot(1,2,1)
plt.plot(K_range,inertia,marker="o")
plt.title("Elbow Method")
plt.xlabel("NUmber of Clusters (K)")
plt.ylabel("Inertia")

plt.tight_layout()
plt.savefig("elbow_silhouette.png")
plt.show()

print("Inertia values:",inertia)
print("Silhouette scores:",silhouette_scores)

#Fit final model

OPTIMAL_K=4

final_kmeans=KMeans(n_clusters=OPTIMAL_K,random_state=42,n_init=10)
rfm["Cluster"]=final_kmeans.fit_predict(scaled_features)

#CLuster profiling

cluster_summary=rfm.groupby("Cluster").agg(
    Recency_mean=("Recency","mean"),
    Frequency_mean=("Frequency","mean"),
    Monetary_mean=("Monetary","mean"),
    Count=("CustomerID","count")
).reset_index()

print("\nCluster Profiles:")
print(cluster_summary)

# Example manual labeling (adjust based on actual output):
# Low Recency + High Frequency + High Monetary -> "Best Customers"
# High Recency + Low Frequency + Low Monetary -> "At Risk / Dormant"
# Low Recency + Low Frequency -> "New Customers"
# High Recency + High Frequency (past) -> "Churned Loyal Customers"

# Map cluster number -> label + description (UPDATE these based on your actual cluster_summary output)
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


#export dashboard data

import json

total_customers = len(rfm)
total_revenue = rfm["Monetary"].sum()

dashboard_clusters = []
for _, row in cluster_summary.iterrows():
    cluster_id = int(row["Cluster"])
    cluster_revenue = rfm[rfm["Cluster"] == cluster_id]["Monetary"].sum()
    dashboard_clusters.append({
        "cluster": cluster_id,
        "label": CLUSTER_LABELS.get(cluster_id, f"Cluster {cluster_id}"),
        "description": CLUSTER_DESCRIPTIONS.get(cluster_id, ""),
        "recency_mean": round(row["Recency_mean"], 1),
        "frequency_mean": round(row["Frequency_mean"], 1),
        "monetary_mean": round(row["Monetary_mean"], 1),
        "count": int(row["Count"]),
        "pct_of_customers": round(row["Count"] / total_customers * 100, 1),
        "revenue_total": round(cluster_revenue, 2),
        "pct_of_revenue": round(cluster_revenue / total_revenue * 100, 1),
    })

with open("cluster_summary.json", "w") as f:
    json.dump({
        "total_customers": total_customers,
        "total_revenue": round(total_revenue, 2),
        "optimal_k": OPTIMAL_K,
        "clusters": dashboard_clusters,
    }, f, indent=2)

# Small anonymized sample for the "Explore customers" table (safe to commit — no raw dataset)
sample = rfm.sample(n=min(150, len(rfm)), random_state=42)[
    ["CustomerID", "Recency", "Frequency", "Monetary", "Cluster"]
].copy()
sample["Label"] = sample["Cluster"].map(CLUSTER_LABELS)
sample.to_csv("sample_customers.csv", index=False)

print("\nExported cluster_summary.json and sample_customers.csv for the dashboard.")

#Save model , Scaler

with open("kmeans_model.pkl","wb") as f:
    pickle.dump(final_kmeans,f)

with open("scaler.pkl","wb") as f:
    pickle.dump(scaler,f)

rfm.to_csv("rfm_with_clusters.csv",index=False)

print("\nModel, scaler, and RFM data saved successfully.")