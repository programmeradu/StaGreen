# StaGreen Google Cloud Deployment Strategy

## Architecture Overview

StaGreen consists of 5 main components that need to work together:

- 3 Frontend React apps (client, wms, truck-dashboard)
- 1 Node.js backend server (main business logic)
- 1 Python FastAPI service (AI/ML operations)

## Deployment Plan

### Phase 1: Backend Services (Google Cloud Run)

#### 1. FastAPI ML Service

```bash
gcloud run deploy stagreen-ml-api \
  --source ./api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars MONGODB_URI="mongodb+srv://..." \
  --set-env-vars MAPS_API_KEY_GHANA="AIza..." \
  --set-env-vars RETRAIN_API_KEY="SDXw..."
```

#### 2. Node.js Main Server

```bash
gcloud run deploy stagreen-main-server \
  --source ./server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --set-env-vars ML_API_URL="https://stagreen-ml-api-xxx.run.app"
```

### Phase 2: Frontend Applications (Google Cloud Storage + CDN)

#### 1. Client App

```bash
cd client
npm run build
gsutil -m cp -r build/* gs://stagreen-client-app
```

#### 2. WMS Dashboard

```bash
cd wms
npm run build
gsutil -m cp -r build/* gs://stagreen-wms-dashboard
```

#### 3. Truck Dashboard

```bash
cd truck-dashboard
npm run build
gsutil -m cp -r build/* gs://stagreen-truck-dashboard
```

### Phase 3: Domain Configuration

#### Custom Domains:

- `api.stagreen.com` → ML FastAPI Service
- `server.stagreen.com` → Node.js Server
- `app.stagreen.com` → Client App
- `admin.stagreen.com` → WMS Dashboard
- `drivers.stagreen.com` → Truck Dashboard

## Required Fixes Before Deployment

### 1. API Integration Fix

The Node.js server needs to proxy ML requests to FastAPI service:

```javascript
// server/controllers/ml-controller.js
const ML_API_URL = process.env.ML_API_URL || "http://localhost:8001";

export const getWastePrediction = async (req, res) => {
  try {
    const response = await fetch(`${ML_API_URL}/predict/fill-levels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 2. Frontend API URL Configuration

Update API endpoints to use production URLs:

```javascript
// client/src/api/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const res = await fetch(`${API_BASE_URL}/add`, {
  // ... existing code
});
```

### 3. Environment Variables Setup

Each component needs production environment variables:

```bash
# Client
REACT_APP_API_URL=https://server.stagreen.com
REACT_APP_TOMTOM_API_KEY=your_tomtom_key

# WMS
REACT_APP_API_URL=https://server.stagreen.com

# Truck Dashboard
REACT_APP_API_URL=https://server.stagreen.com

# Node.js Server
ML_API_URL=https://api.stagreen.com
MONGODB_URI=mongodb+srv://...

# FastAPI
MONGODB_URI=mongodb+srv://...
MAPS_API_KEY_GHANA=AIza...
RETRAIN_API_KEY=SDXw...
```

## Benefits of This Architecture

### ✅ Scalability

- Each service can scale independently
- ML service can handle compute-intensive tasks
- Frontend served from CDN for global performance

### ✅ Cost Efficiency

- Cloud Run scales to zero when not in use
- Pay only for actual usage
- CDN reduces bandwidth costs

### ✅ Reliability

- Services isolated from each other
- Automatic health checks and restarts
- Built-in load balancing

### ✅ Development Workflow

- Deploy services independently
- Easy rollbacks
- Staging environments possible

## Next Steps

1. Fix API integration between Node.js and FastAPI
2. Update frontend environment configurations
3. Deploy backend services first
4. Deploy and configure frontends
5. Set up custom domains
6. Configure monitoring and logging
