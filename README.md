# AI-Powered Smart Healthcare Assistant

A secure, modular, production-ready healthcare platform that allows users to record vitals, analyze symptom check profiles via Machine Learning (Random Forest & XGBoost classifiers), upload medical report panels with automatic OCR text extraction, and view personalized healthcare recommendations.

Designed with premium, responsive glassmorphic interfaces following clinical visual systems.

---

## Folder Structure

```text
healthcare-assistant/
├── docs/                     # Architectural design artifacts
│   ├── requirements_analysis.md
│   ├── system_design.md
│   ├── database_design.md
│   ├── ml_pipeline.md
│   ├── dataset_strategy.md
│   ├── ocr_nlp_design.md
│   ├── testing_strategy.md
│   ├── deployment_guide.md
│   └── monitoring.md
├── backend/                  # FastAPI Backend Services
│   ├── app/
│   │   ├── api/              # Controllers and HTTP endpoints
│   │   ├── core/             # Database connection, JWT authorization, and configs
│   │   ├── schemas/          # Pydantic DTO models
│   │   ├── services/         # ML inference classifiers & OCR report parsers
│   │   ├── tests/            # Pytest test cases
│   │   ├── train_model.py    # Symptom disease model training script
│   │   └── main.py           # FastAPI entrypoint
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # React.js + Tailwind CSS Client
│   ├── src/
│   │   ├── context/          # Auth Context (JWT cache & HTTP states)
│   │   ├── App.jsx           # Views, charts, dashboards, and uploader forms
│   │   ├── index.css         # Styling directive presets
│   │   └── main.jsx          # SPA entrymount
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml        # Multi-container local orchestra file
```

---

## Tech Stack
* **Frontend**: React.js, Tailwind CSS (v4), Lucide Icons
* **Backend**: FastAPI (Python), Motor (async MongoDB client), PyJWT, pdfplumber
* **Database**: MongoDB (Local / Docker / Atlas Cluster)
* **Machine Learning**: Scikit-learn, Random Forest Classifiers

---

## Local Development Execution

### Prerequisites
* Python 3.10+
* Node.js 18+
* MongoDB running on local port `27017` (or configured via environment)

### 1. Compile ML Model Binaries
The FastAPI application queries ML model binaries. You can compile using default synthetic data or **pass your own custom CSV dataset**!

#### Option A: Train with Default Synthetic Data
```bash
cd backend
python app/train_model.py
```

#### Option B: Train with Your Own Custom Dataset
You can load a CSV dataset formatted either as:
1. **Wide Binary Format**: Columns represent individual symptoms (having `0` or `1` values) along with a target column named `disease`.
2. **Sequential Format**: A target column named `disease` along with columns named `symptom_1`, `symptom_2`, ..., `symptom_n` (commonly found in symptom checking datasets on Kaggle).

Run the script by providing the path to your CSV:
```bash
cd backend
python app/train_model.py --dataset-path "/absolute/path/to/your_dataset.csv"
```
This writes the trained model binary `symptom_model.pkl` and features index mapper `symptom_features.pkl` to `backend/app/models_bin/`.

### 2. Launch FastAPI Backend
```bash
uvicorn app.main:app --reload --port 8000
```
* **Swagger API Documentation**: Visit `http://localhost:8000/docs` to inspect, try out, and validate endpoints.

### 3. Launch React Client
Open a separate terminal shell:
```bash
cd frontend
npm install
npm run dev
```
* **Client access**: Open `http://localhost:5173` in your browser.

---

## Running with Docker Compose

To spin up MongoDB, the API server, and the static Nginx React client together inside container networks, run:
```bash
docker-compose up --build
```
* **Frontend Web Access**: `http://localhost`
* **API Documentation**: `http://localhost:8000/docs`

---

## Running Test Cases
Verify endpoint routing, authentication tokens, and hashing methods:
```bash
cd backend
pytest app/tests/ -v
```
