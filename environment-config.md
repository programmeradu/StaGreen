# StaGreen Environment Variables Configuration

## Client React App (`client/.env`)
```bash
# API Backend URL
REACT_APP_API_URL=http://localhost:8000

# TomTom Maps API Key (for location services)  
REACT_APP_TOMTOM_API_KEY=g9V9sGqvIMdVtmAgA1gjsBcXyV7Qc1gg

# For production deployment:
# REACT_APP_API_URL=https://server.stagreen.com
```

## WMS Dashboard (`wms/.env`)
```bash
# API Backend URL
REACT_APP_API_URL=http://localhost:8000

# For production deployment:
# REACT_APP_API_URL=https://server.stagreen.com
```

## Truck Dashboard (`truck-dashboard/.env`)
```bash
# API Backend URL
REACT_APP_API_URL=http://localhost:8000

# TomTom Maps API Key
REACT_APP_TOMTOM_API_KEY=g9V9sGqvIMdVtmAgA1gjsBcXyV7Qc1gg

# For production deployment:
# REACT_APP_API_URL=https://server.stagreen.com
```

## Node.js Server (`server/.env`)
```bash
# FastAPI ML Service URL
ML_API_URL=http://localhost:8001

# MongoDB Connection
MONGODB_URI=mongodb+srv://Algorithmx:Sammyone%401@cluster0.3lja38l.mongodb.net/WMS?retryWrites=true&w=majority

# Server Port
PORT=8000

# For production deployment:
# ML_API_URL=https://api.stagreen.com
# MONGODB_URI=your_production_mongodb_uri
```

## FastAPI ML Service (`api/.env`)
```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://Algorithmx:Sammyone%401@cluster0.3lja38l.mongodb.net/WMS?retryWrites=true&w=majority

# Google Maps API Key for Ghana
MAPS_API_KEY_GHANA=AIzaSyDC_zOBfGLEFwKiFH85MhIPq2LVKyiaCfI

# Model Retraining API Key
RETRAIN_API_KEY=SDXw2fiP-10DfjgXe99AAYHLDXQjCKnabVNBENMbcXtYDnM9BdMf8hB4zVdhoT9H
```

## Google Cloud Deployment Environment Variables

### Cloud Run Services

#### FastAPI ML Service Environment Variables:
```bash
MONGODB_URI=mongodb+srv://Algorithmx:Sammyone%401@cluster0.3lja38l.mongodb.net/WMS?retryWrites=true&w=majority
MAPS_API_KEY_GHANA=AIzaSyDC_zOBfGLEFwKiFH85MhIPq2LVKyiaCfI
RETRAIN_API_KEY=SDXw2fiP-10DfjgXe99AAYHLDXQjCKnabVNBENMbcXtYDnM9BdMf8hB4zVdhoT9H
```

#### Node.js Server Environment Variables:
```bash
ML_API_URL=https://stagreen-ml-api-xxx.run.app
MONGODB_URI=mongodb+srv://Algorithmx:Sammyone%401@cluster0.3lja38l.mongodb.net/WMS?retryWrites=true&w=majority
PORT=8080
```

### Frontend Build Environment Variables

#### For all React apps during build:
```bash
REACT_APP_API_URL=https://stagreen-main-server-xxx.run.app
REACT_APP_TOMTOM_API_KEY=g9V9sGqvIMdVtmAgA1gjsBcXyV7Qc1gg
```

## Setup Instructions

### Local Development:
1. Copy the above environment variables to respective `.env` files in each component directory
2. Update API keys and URLs as needed
3. Start services in order: FastAPI → Node.js → React apps

### Production Deployment:
1. Set environment variables in Google Cloud Run console
2. Update frontend build environment variables
3. Deploy services using the deployment strategy

## Security Notes

⚠️ **Never commit `.env` files to version control**
⚠️ **Use different API keys for production and development**
⚠️ **Rotate API keys regularly**
⚠️ **Use Google Cloud Secret Manager for sensitive production values** 