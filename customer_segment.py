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

#Save model , Scaler

with open("kmeans_model.pkl","wb") as f:
    pickle.dump(final_kmeans,f)

with open("scaler.pkl","wb") as f:
    pickle.dump(scaler,f)

rfm.to_csv("rfm_with_clusters.csv",index=False)

print("\nModel, scaler, and RFM data saved successfully.")