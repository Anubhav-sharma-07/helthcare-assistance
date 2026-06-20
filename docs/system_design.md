# Phase 2 — System Design: AI-Powered Smart Healthcare Assistant

This document outlines the architecture, component interaction, data flows, and security guidelines for the Smart Healthcare Assistant.

---

## 1. High-Level Architecture

The platform uses a classic 3-tier client-server structure: a Single Page Application (SPA) client, a FastAPI gateway serving APIs, and a MongoDB database, with external containerized modules for OCR and ML inference tasks.

```mermaid
graph TD
    User([User Client])
    Nginx[Nginx Reverse Proxy]
    Frontend[React Frontend SPA]
    Backend[FastAPI Application Backend]
    Database[(MongoDB Instance)]
    ML_Pipeline[ML Inference Pipeline Scikit-learn/XGBoost]
    OCR_Module[OCR Engine Tesseract/EasyOCR]

    User <-->|HTTPS| Nginx
    Nginx <-->|Serve Static Assets| Frontend
    Nginx <-->|API Routing / JSON| Backend
    Backend <-->|Retrieve/Store Data| Database
    Backend <-->|Predict Disease| ML_Pipeline
    Backend <-->|Extract Text & Clinical Entities| OCR_Module
```

---

## 2. Low-Level Architecture

The FastAPI backend is structured modularly following clean code guidelines:

```mermaid
graph LR
    API[API Routes / Controllers] -->|Request Validation / DTOs| Service[Services Layer / Business Logic]
    Service -->|Entities & Queries| Repository[Repository Layer / Beanie ODM]
    Repository -->|Driver/Connection| MongoDB[(MongoDB DB)]
    Service -->|Inference Query| ModelEngine[Model Inference Engine]
    Service -->|Extract Text| OCREngine[OCR/NER Engine]
```

---

## 3. Component Diagram

```mermaid
classDiagram
    class ReactClient {
        +AuthContext
        +VitalsDashboard
        +SymptomChecker
        +ReportUploader
    }
    class FastAPIBackend {
        +auth_router
        +prediction_router
        +report_router
        +user_router
    }
    class DatabaseAdapter {
        +get_db_session()
        +UserDocument
        +PredictionDocument
        +ReportDocument
    }
    class MLInferenceEngine {
        +load_models()
        +predict_symptoms(symptoms)
    }
    class OCRExtractor {
        +extract_text(file_bytes)
        +extract_entities(text)
    }

    ReactClient --> FastAPIBackend : HTTP Requests (JSON/Files)
    FastAPIBackend --> DatabaseAdapter : Read/Write
    FastAPIBackend --> MLInferenceEngine : Predict Disease
    FastAPIBackend --> OCRExtractor : Analyze Reports
```

---

## 4. Data Flow Diagram

This diagram displays the process when a user inputs symptoms to receive a disease prediction:

```mermaid
flowchart TD
    A[User Inputs Symptoms on Frontend] --> B[Frontend serializes symptoms array]
    B -->|POST /api/predict| C[FastAPI route validation Pydantic]
    C --> D[Service layer loads ML mapping parameters]
    D --> E[Symptom vector parsed into model binary format]
    E --> F[ML Model Predicts Disease probabilities]
    F --> G[Service formats top predictions & care actions]
    G --> H[Repository saves prediction to user history]
    H --> I[FastAPI returns results JSON]
    I --> J[Frontend renders results & dashboard updates]
```

---

## 5. Sequence Diagram

This sequence diagram illustrates the user registration and JWT authentication loop:

```mermaid
sequenceDiagram
    autonumber
    actor User as Patient Client
    participant FE as React Frontend
    participant API as FastAPI Backend
    participant DB as MongoDB Atlas

    User->>FE: Input Register Form details
    FE->>API: POST /api/auth/register (payload)
    API->>DB: Check if Email exists
    DB-->>API: Email Available
    API->>API: Hash password (bcrypt)
    API->>DB: Insert User Document
    DB-->>API: Document Inserted
    API-->>FE: User Created (201 Created)
    
    User->>FE: Input Credentials (Login)
    FE->>API: POST /api/auth/login
    API->>DB: Find User by Email
    DB-->>API: User details + Hashed Password
    API->>API: Verify Password Hash matches
    API->>API: Sign Access JWT (expires in 1hr)
    API-->>FE: JWT access_token + user summary
    FE->>FE: Save token to localStorage / cookies
```

---

## 6. Service Communication
* **Frontend-to-Backend**: Communicates exclusively through synchronous REST APIs over HTTPS.
* **Backend-to-DB**: Uses asynchronous drivers (Motor) via Beanie ODM.
* **Internal ML/OCR engines**: Processed in a blocking or asynchronous ThreadPool executor inside FastAPI to ensure the event loop is never blocked by compute-heavy task evaluations.

---

## 7. Authentication Flow
Authentication is managed via HTTP Bearer tokens.
1. Frontend attaches the token in request headers: `Authorization: Bearer <JWT_TOKEN>`.
2. Backend middleware validates token signature using the HS256 algorithm and a shared `SECRET_KEY`.
3. If token is invalid or expired, backend answers with a `401 Unauthorized` response code, and the frontend redirects the user to the login screen.

---

## 8. Security Architecture
* **Transport Layer Security**: HTTPS enforced for all client-server communication.
* **Cross-Origin Resource Sharing (CORS)**: backend strictly restricts origins to trusted client hosts.
* **Password Security**: Standard bcrypt hashing algorithm.
* **Pydantic Validation**: Strips extra payload elements to prevent parameter pollution or injection issues.

---

## 9. Scalability Design
* **Stateless API Services**: The FastAPI containers are stateless, allowing for simple horizontal load balancing (via AWS ECS or Kubernetes).
* **Connection Pooling**: Reuses MongoDB connections to avoid handshake costs on each API call.
* **ML Serving Isolation**: Machine learning tasks can be isolated into dedicated Docker containers running Celery tasks or TorchServe instances when scale demands.

---

## 10. Deployment Architecture

```mermaid
graph TD
    Client([Web User]) -->|HTTPS| Route53[AWS Route 53 / DNS]
    Route53 --> NginxProxy[Nginx / SSL Termination]
    NginxProxy --> AppService[FastAPI App Docker Containers]
    AppService --> MongoAtlas[(MongoDB Atlas Cloud)]
```
