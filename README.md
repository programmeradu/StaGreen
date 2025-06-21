<h1 align="center" id="title">StaGreen: AI-Powered Urban Sustainability</h1>

<p align="center">
  <img src="https://socialify.git.ci/programmeradu/StaGreen/image?font=Jost&language=1&name=1&owner=1&stargazers=1&theme=Auto" alt="project-image">
</p>

## **Introduction**
StaGreen is an AI-powered platform designed to revolutionize urban waste management and city planning. Our mission is to leverage cutting-edge AI technologies to create sustainable, efficient, and equitable waste management solutions for cities, initially focusing on regions like Ghana. By optimizing collection routes, predicting waste generation, and providing actionable insights, StaGreen aims to improve public health, reduce operational costs, and promote environmental sustainability.

---

## **Project Overview**
StaGreen is a multi-component system designed for comprehensive waste management:
- **`client/` (Citizen Web Client)**: A React-based application for citizens to request waste pickups, track their status, and receive notifications.
- **`truck-dashboard/` (Driver Dashboard)**: A React-based application for waste collection vehicle drivers to view optimized routes, navigate, and update pickup statuses.
- **`wms/` (Admin WMS Portal)**: A React-based administrative dashboard (based on the Minimal template) for managing users, fleet, schedules, requests, and monitoring overall system analytics.
- **`server/` (Node.js Backend Server)**: An Express.js server providing core API services for user management, data handling (citizens, requests, trucks), and interfacing with other services. It uses MongoDB as its database.
- **`api/` (Python API Server)**: A FastAPI server dedicated to computationally intensive tasks, including:
    - **Waste Prediction**: Utilizing machine learning models to forecast waste generation.
    - **Route Optimization**: Employing OR-Tools to calculate efficient collection routes.
    It also uses MongoDB for relevant data.
- **`ml/` (Machine Learning Module)**: Contains Python scripts and notebooks for developing, training, and evaluating ML models for waste prediction and route optimization.
- **`cv/` (Computer Vision Module)**: Includes Python scripts for tasks like smart bin detection and potentially fill-level analysis, integrated via the Node.js backend.

These components work in concert to provide a seamless experience for all stakeholders in the waste management lifecycle.

---

## **Core Features**

*   **Waste Prediction & Trend Analysis**:
    *   Leverages ML models (e.g., time series analysis with Prophet) to forecast waste generation volumes at various granularities (e.g., per bin, per area).
    *   Provides insights into waste generation trends to aid in resource allocation and planning.
    *   *Technology*: Python, scikit-learn, Prophet, Pandas (in `ml/` & `api/`).
*   **Intelligent Route Optimization**:
    *   Calculates the most efficient waste collection routes based on real-time data (e.g., bin fill levels, traffic, truck capacity).
    *   Aims to reduce fuel consumption, collection time, and operational costs.
    *   *Technology*: Python, OR-Tools (in `ml/` & `api/`).
*   **Citizen Engagement Portal (`client/`)**:
    *   Easy-to-use interface for citizens to schedule new waste pickups.
    *   Allows tracking of pickup request status.
    *   Map integration for precise location marking.
    *   *Technology*: React, Material UI, Google Maps API / TomTom Maps.
*   **Driver Mobile Dashboard (`truck-dashboard/`)**:
    *   Displays optimized daily routes and navigation guidance.
    *   Allows drivers to update pickup status in real-time (e.g., completed, bin not accessible).
    *   Provides information on expected waste volumes or specific instructions per stop.
    *   *Technology*: React, Material UI, TomTom Maps.
*   **Comprehensive Admin WMS (`wms/`)**:
    *   Centralized dashboard for managing users (citizens, drivers, staff).
    *   Fleet management: tracking vehicles, assigning drivers, monitoring maintenance.
    *   Overseeing and managing all pickup requests and scheduling.
    *   Data visualization for key performance indicators (KPIs) like collection rates, landfill diversion, etc.
    *   *Technology*: React, Material UI, ApexCharts.
*   **Smart Bin Integration (Conceptual/CV-driven)**:
    *   Utilizes computer vision to detect bins and potentially assess fill levels or waste types from images.
    *   Data can feed into prediction models and route optimization.
    *   *Technology*: Python (e.g., OpenCV, TensorFlow/PyTorch for CV models in `cv/`), integrated via `server/`.
*   **User Management & Authentication**:
    *   Secure registration and login for all user roles across platforms.
    *   Role-based access control.
    *   *Technology*: Node.js, Express.js, MongoDB (`server/`).

---

## **Technology Stack**

*   **Backend**:
    *   Node.js with Express.js (`server/`)
    *   Python with FastAPI (`api/`)
*   **Frontend**:
    *   React.js (for `client/`, `truck-dashboard/`, `wms/`)
    *   Material UI (common UI library)
    *   HTML5, CSS3
*   **Database**:
    *   MongoDB
*   **Machine Learning**:
    *   Python, Pandas, NumPy, Scikit-learn, Prophet, OR-Tools
*   **Computer Vision**:
    *   Python, OpenCV (and other relevant CV libraries)
*   **DevOps & Deployment**:
    *   Git, GitHub Actions (CI/CD)
    *   Docker (Note: No Dockerfiles were found at the root or immediate subdirectories. If specific services use Docker, their respective READMEs or setup instructions should be consulted.)
    *   Vercel (for frontend deployments, as per `vercel.json`)
    *   Google Cloud Platform (for backend/API, as per `cloudbuild.yaml`)
*   **Mapping Services**:
    *   Google Maps API
    *   TomTom Maps SDK

---

## **Directory Structure**

```
StaGreen/
├── .github/            # GitHub Actions CI/CD workflows
├── api/                # Python FastAPI backend (ML predictions, routing)
│   ├── routers/
│   ├── services/
│   ├── requirements.txt
│   └── index.py
├── client/             # React frontend for citizens
│   ├── public/
│   ├── src/
│   └── package.json
├── cv/                 # Computer Vision scripts (e.g., bin detection)
│   └── bin_detector.py
├── ml/                 # Machine Learning models, training scripts, data
│   ├── data/
│   ├── models/
│   ├── simulators/
│   ├── requirements.txt
│   └── ... (training & prediction scripts)
├── server/             # Node.js Express backend (core APIs, user mgmt)
│   ├── controllers/
│   ├── database/
│   ├── models/
│   ├── Router/
│   ├── package.json
│   └── index.js
├── truck-dashboard/    # React frontend for truck drivers
│   ├── public/
│   ├── src/
│   └── package.json
├── wms/                # React frontend for Admin Waste Management System
│   ├── public/
│   ├── src/
│   └── package.json
├── .deepsource.toml    # DeepSource configuration
├── cloudbuild.yaml     # Google Cloud Build configuration
├── deploy-frontends.yaml # Frontend deployment script (likely GCP related)
├── vercel.json         # Vercel deployment configuration
└── README.md           # This file
```

---

## **Getting Started**

### **Prerequisites**

*   **Node.js**: Version 16.x to 18.x recommended (CI uses 18.x; `wms/` template originally suggested 14.x/16.x. Aim for LTS versions).
*   **npm** (usually comes with Node.js) or **Yarn** (some projects like `wms/` might favor Yarn).
*   **Python**: Version 3.10 recommended (as per CI setup).
*   **pip** (Python package installer).
*   **MongoDB**: Ensure you have a running MongoDB instance (local or cloud-based like MongoDB Atlas) and its connection URI.
*   **Git**: For cloning the repository.
*   **(Optional) Docker**: If Docker configurations are provided for specific services, refer to their documentation.

### **1. Clone the Repository**
```bash
git clone https://github.com/programmeradu/StaGreen.git
cd StaGreen
```

### **2. Setup Environment Variables**

Several components rely on environment variables. Look for `.env.example` files in the component directories (e.g., `api/`, `server/`). Copy these to a new `.env` file in the same directory and fill in your specific configurations (database URIs, API keys, secrets, etc.). **Important: Do not commit `.env` files to version control.**

*   **`api/`**: Needs `MONGODB_URI` and other potential settings.
    *   `cp api/.env.example api/.env` (if example exists)
    *   Edit `api/.env`.
*   **`server/`**: Needs `MONGODB_URI`, `PORT`, `JWT_SECRET_KEY`, etc.
    *   `cp server/.env.example server/.env` (if example exists, or create one with necessary variables)
    *   Edit `server/.env`.
*   **Frontend Applications (`client/`, `truck-dashboard/`, `wms/`)**:
    *   These often require `REACT_APP_...` variables to specify backend API endpoints. Create `.env` files in their respective root directories if needed. Example:
    *   `echo "REACT_APP_NODE_SERVER_URL=http://localhost:8000" > client/.env`
    *   `echo "REACT_APP_PYTHON_API_URL=http://localhost:8080" >> client/.env` (use `>>` to append or edit the file directly)

### **3. Install Dependencies & Run Each Component**

Open separate terminal windows for each component you want to run.

#### **a. Node.js Backend Server (`server/`)**
```bash
cd server
npm install
# Ensure .env file is configured (see step 2)
npm start
```
Typically starts on `http://localhost:8000` (or as configured).

#### **b. Python API Server (`api/`)**
```bash
cd api
python -m venv venv # Create a virtual environment (recommended)
source venv/bin/activate # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Ensure .env file is configured (see step 2)
uvicorn api.index:app --reload --host 0.0.0.0 --port 8080
```
Typically starts on `http://localhost:8080`.

#### **c. Client Application (`client/`)**
```bash
cd client
npm install
# Ensure .env file for API URLs is configured (see step 2)
npm start
```
Typically starts on `http://localhost:3000`. If port 3000 is in use, Create React App may offer to run it on another port.

#### **d. Truck Dashboard Application (`truck-dashboard/`)**
```bash
cd truck-dashboard
npm install
# Ensure .env file for API URLs is configured (see step 2)
npm start
```
Typically starts on a port like `http://localhost:3001` (auto-selected if 3000 is busy).

#### **e. WMS Admin Portal (`wms/`)**
```bash
cd wms
npm install # or yarn install, as per its package.json
# Ensure .env file for API URLs is configured (see step 2)
npm start # or yarn start
```
Typically starts on a port like `http://localhost:3002`.

#### **f. Machine Learning & CV Scripts (`ml/`, `cv/`)**
These are not persistent servers. Run scripts as needed for training, processing, etc.
For `ml/`:
```bash
cd ml
python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Example: python train_waste_predictor.py
```
For `cv/`:
```bash
cd cv
# Setup venv and install dependencies if it has its own requirements.txt
# Example: python bin_detector.py
```

---

## **Running Tests**

*   **Frontend Apps (`client/`, `truck-dashboard/`, `wms/`):**
    ```bash
    cd <app_directory> # e.g., client
    npm test
    ```
*   **API Server (`api/` - Python):**
    *   Uses `pytest`. Ensure development dependencies are installed (e.g., from `requirements-dev.txt` if it exists).
    ```bash
    cd api
    # pip install pytest # or from requirements-dev.txt
    pytest tests/
    ```
    (Assuming tests are in `api/tests/`)
*   **Node.js Server (`server/`):**
    *   The `package.json` currently shows: `"test": "echo \"Error: no test specified\" && exit 1"`.
    *   If tests are added, update this script and run `npm test`.
*   **ML/CV Scripts (`ml/`, `cv/`):**
    *   Follow specific instructions if available within these directories. Tests might use `pytest`.

---

## **Deployment**
This project is configured for deployment on multiple platforms:
- **Frontend Applications (`client`, `truck-dashboard`, `wms`):**
  - Deployed via [Vercel](https://vercel.com/) (see `vercel.json`).
  - `deploy-frontends.yaml` may also be used for GCP-based deployments.
- **Backend APIs (`api/`, `server/`):**
  - The Python FastAPI (`api/`) is configured for Google Cloud Run (see `cloudbuild.yaml`).
  - The Node.js server (`server/`) can be deployed to platforms like Google Cloud (App Engine, Cloud Run), Heroku, etc. (`cloudbuild.yaml` may include it).
- **CI/CD**:
  - GitHub Actions are used for Continuous Integration (linting, building), defined in `.github/workflows/`.

Refer to `cloudbuild.yaml`, `deploy-frontends.yaml`, `vercel.json`, and project documents like `environment-config.md` and `deployment-strategy.md` for more details.

---

## **Contributing**
We welcome contributions! Please:
1.  Fork the repository.
2.  Create a feature or bugfix branch: `git checkout -b feature/my-new-feature` or `bugfix/issue-fix`.
3.  Commit your changes with clear messages.
4.  Adhere to linting standards (`npm run lint` for JS, `flake8` for Python).
5.  Add tests for new features.
6.  Push to your fork and submit a pull request to the `main` branch of this repository.

Please check for a `CONTRIBUTING.md` file in the repository for more detailed guidelines (if one exists).

---

## **Roadmap**
(This section can be updated based on current project status)
1. **Phase 1 (Completed/Ongoing)**: Core AI model development, initial versions of web portals.
2. **Phase 2**: Enhanced CV, integration of further services/partners (e.g., "CleanSweep"), decentralized storage exploration.
3. **Phase 3**: MVP testing and pilot deployment in target regions.
4. **Future**: Real-time citizen tracking of drivers, advanced analytics, gamification.

---

## **License**
This project is licensed under the MIT License. See the `LICENSE` file in the root directory. (The `wms/` component is based on a template also under an MIT License, see `wms/LICENSE.md`).

---

## **Contact**
For inquiries, contact project maintainers at **samuel@stanetwork.live**.

---
