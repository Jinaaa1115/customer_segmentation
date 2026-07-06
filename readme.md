# Customer Segmentation using RFM Analysis & K-Means Clustering

An end-to-end machine learning project that segments e-commerce customers into behavioral groups using RFM (Recency, Frequency, Monetary) analysis and K-Means clustering — deployed as a full-stack web app with a FastAPI backend and React frontend.

**Live Demo:** [Frontend](https://customer-segmentation-frontend-d975.onrender.com) · [API Docs](https://customer-segmentation-backend-cnq8.onrender.com/docs)

---

## Overview

This project analyzes ~4,300 customers from the UCI Online Retail dataset, engineers RFM features from raw transaction data, and clusters them into four distinct segments using K-Means. The trained model is served via a REST API and paired with a React dashboard where anyone can input a customer's purchase behavior and instantly see their predicted segment.

## Problem Statement

Businesses often treat all customers the same, missing opportunities to retain high-value customers or re-engage dormant ones. This project answers: *given a customer's purchase history, which behavioral segment do they belong to, and what does that mean for how the business should treat them?*

## Dataset

- **Source:** [UCI Online Retail Dataset](https://www.kaggle.com/datasets/carrie1/ecommerce-data)
- ~540,000 transaction records from a UK-based online gift retailer (Dec 2010 – Dec 2011)
- Fields: InvoiceNo, StockCode, Description, Quantity, InvoiceDate, UnitPrice, CustomerID, Country

## Methodology

### 1. Data Cleaning
- Removed transactions with missing `CustomerID`
- Excluded cancelled orders (InvoiceNo starting with 'C')
- Filtered out negative/zero quantity and price values
- Removed top 1% outliers by transaction value

### 2. Feature Engineering (RFM)
- **Recency** — days since the customer's last purchase
- **Frequency** — number of unique orders placed
- **Monetary** — total amount spent
- Applied log-transformation to Frequency and Monetary to reduce right-skew before scaling

### 3. Modeling
- Standardized features using `StandardScaler`
- Determined optimal K using the **Elbow Method** (inertia) and **Silhouette Score**
- Selected **K = 4** — balancing cluster separation quality with business interpretability
- Fit final K-Means model and profiled each cluster's centroid behavior

### 4. Segments Identified

| Segment | Recency (avg) | Frequency (avg) | Monetary (avg) | Description |
|---|---|---|---|---|
| **Champion** | 18.5 days | 15.0 orders | ₹6,498 | Most recent, most frequent, highest-spending customers |
| **Loyal** | 46.5 days | 4.1 orders | ₹1,454 | Regular repeat buyers with solid spend |
| **New / Occasional** | 58.8 days | 1.5 orders | ₹362 | Recent but infrequent, low-spend buyers |
| **At Risk / Dormant** | 260.2 days | 1.4 orders | ₹357 | Haven't purchased in ~8-9 months; churn risk |

## Tech Stack

**Machine Learning:** Python, scikit-learn, pandas, NumPy
**Backend:** FastAPI, Pydantic, Uvicorn
**Frontend:** React, Vite, Tailwind CSS
**Deployment:** Docker, Nginx, GitHub Actions (CI/CD), Render

## Architecture

```
┌─────────────┐        POST /predict-segment       ┌──────────────────┐
│   React     │ ──────────────────────────────────▶│     FastAPI      │
│  Frontend   │                                    │     Backend      │
│  (Nginx)    │ ◀───────────────────────────────── │  (K-Means model) │
└─────────────┘        { cluster, label }          └──────────────────┘
```

Both services are containerized independently and deployed on Render. GitHub Actions builds and validates both Docker images on every push to `main`, then triggers Render deploy hooks.

## Project Structure

```
customer_segmentation/
├── customer_segmentation.py     # Data cleaning, RFM engineering, K-Means training
├── main.py                      # FastAPI app serving predictions
├── kmeans_model.pkl             # Trained K-Means model
├── scaler.pkl                   # Fitted StandardScaler
├── requirements.txt
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
├── nginx.conf
├── .github/workflows/ci-cd.yml  # CI/CD pipeline
└── frontend/
    ├── src/App.jsx              # Prediction UI + RFM fingerprint visualization
    └── ...
```

## API Reference

**POST** `/predict-segment`

Request body:
```json
{
  "recency": 20,
  "frequency": 10,
  "monetary": 1000
}
```

Response:
```json
{
  "cluster": 3,
  "segment_label": "Champion / High-Value Customer",
  "description": "Highest frequency and spend, most recent purchase. Prioritize retention and VIP treatment."
}
```

## Running Locally

**Backend:**
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```
Runs at `http://127.0.0.1:8000` — Swagger docs at `/docs`.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`.

**Or run both with Docker Compose:**
```bash
docker-compose up --build
```

## Model Evaluation

- **Silhouette Score** peaked at K=3 (0.418), but K=4 (0.380) was selected for stronger business interpretability — a deliberate trade-off between statistical optimality and practical usefulness.
- Evaluated using both the Elbow Method (compactness) and Silhouette Score (separation) rather than relying on a single metric.

 
 