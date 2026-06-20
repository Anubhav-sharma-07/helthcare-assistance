# Phase 1 — Requirement Analysis: AI-Powered Smart Healthcare Assistant

This document details the functional and non-functional requirements, user stories, use cases, user journeys, feature prioritization, and scope definition for the AI-Powered Smart Healthcare Assistant.

---

## 1. Functional Requirements (FR)

### FR-1: User Management & Authentication
* **Registration**: Users can sign up with email, username, password, and basic demographic data (age, gender).
* **Login**: Secure token-based authentication (JWT) with password hashing.
* **Profile Management**: Profile updating, including chronic conditions, medications, allergies, and contact details.

### FR-2: Symptom Analyzer & Disease Prediction
* **Symptom Selection**: Multi-select interface for choosing active symptoms.
* **Prediction Model**: backend uses Machine Learning to predict top possible diseases with confidence scores.
* **Actionable Guidance**: Primary care level advice based on predicted conditions (e.g., "consult GP within 24h", "emergency care needed").

### FR-3: Medical Report OCR & NLP Analysis
* **Report Upload**: Support uploading PDFs or images (PNG/JPEG) of lab results.
* **Text Extraction (OCR)**: Extract raw text from lab reports.
* **Entity Extraction (NER)**: Identify vital metrics, markers, and reference range deviations (e.g., High Cholesterol, Low Iron).
* **Summary & Recommendations**: Plain-text summary translating medical jargon into friendly insights.

### FR-4: AI Health Recommendations
* **Contextual Suggestions**: Generate lifestyle, dietary, and next-step recommendations using symptom profiles and extracted report entities.
* **Emergency Routing**: Flag critical metrics and advise immediate professional clinical care.

### FR-5: Dashboard & Analytics
* **Vitals Dashboard**: Interactive graphs plotting metrics over time (Heart Rate, Blood Pressure, Blood Sugar, BMI).
* **History Log**: Searchable logs of past symptom inputs, medical predictions, and uploaded report summaries.

---

## 2. Non-Functional Requirements (NFR)

### NFR-1: Security & Compliance
* **Encryption**: Data-at-rest encryption for sensitive medical details; HTTPS/TLS for all API calls.
* **Credential Protection**: bcrypt hashing for passwords; JWT expiry times.
* **HIPAA/GDPR Guidance**: Separating PII (Personally Identifiable Information) from medical data where possible, keeping audit logs.

### NFR-2: Performance & Latency
* **API Response Time**: Auth endpoints < 200ms; prediction models < 500ms.
* **OCR Processing**: OCR reading and text extraction completed under 5 seconds.

### NFR-3: Reliability & Availability
* **Uptime**: Target 99.9% availability using containerized instances.
* **Resiliency**: Database connection pooling, automated connection retries.

### NFR-4: Usability
* **Responsiveness**: Mobile-first design adapting seamlessly from 320px width up to desktop screens.
* **Accessibility**: Contrast-compliant text, readable fonts, and descriptive labels.

---

## 3. User Stories

1. **As a registered user**, I want to securely log in and view my dashboard, so that I can see my vitals history and medical recommendation logs at a glance.
2. **As a patient experiencing mild fever and joint pain**, I want to enter my symptoms, so that I can receive a list of likely conditions and decide if I need to see a physician immediately.
3. **As a patient who just received blood test results**, I want to upload a PDF or image of the document, so that the tool can highlight which indicators are outside the normal range.
4. **As a user seeking to improve my health**, I want the tool to suggest personalized lifestyle tips based on my clinical history and reports.

---

## 4. Use Cases

### Use Case 1: Analyze Symptoms & Predict Disease
* **Actor**: Patient
* **Preconditions**: Patient is authenticated.
* **Flow**:
  1. Patient navigates to "Disease Predictor" page.
  2. Patient selects symptoms from an autocompleting list (e.g., *headache, fatigue, nausea*).
  3. Patient clicks "Analyze".
  4. Backend runs ML model using the selected symptom vector.
  5. UI displays predicted conditions with probability values and severity flags.

### Use Case 2: Upload and Summarize Medical Report
* **Actor**: Patient
* **Preconditions**: Patient has a lab report file.
* **Flow**:
  1. Patient goes to the "Report Upload" portal.
  2. Patient uploads a PDF or image file.
  3. Server runs OCR extraction and matches clinical entities against BioBERT embeddings / regex patterns.
  4. Server generates summary, highlighting flag parameters (e.g. *LDL Cholesterol: 160mg/dL [High]*).
  5. Patient reviews summary and adds it to their medical archive history.

---

## 5. User Journey
```
[Landing Page] ➔ [Register/Login] ➔ [Dashboard Hub]
                                           │
       ┌───────────────────────────────────┼──────────────────────────────────┐
       ▼                                   ▼                                  ▼
[Symptom Predictor]               [Upload Lab Report]               [Analytics & History]
  - Multi-select symptoms           - Upload PDF/JPEG                 - Graph visual graphs
  - Get ML Predictions             - Extraction OCR summary          - History of predictions
  - Check caution levels            - Review flags                    - Read recommendation logs
```

---

## 6. Feature Prioritization & MVP Scope

We group features using the MoSCoW method:

| Feature Area | Must Have (MVP) | Should Have | Could Have | Won't Have (Next Phase) |
|---|---|---|---|---|
| **Auth** | JWT Register/Login | Password Reset | OAuth2 (Google/Apple) | Biometric Login |
| **Symptom Predictor**| XGBoost/Random Forest | Confidence scores | Interactive body map | Multi-language support |
| **Report Processing**| PDF text extraction | Highlight anomaly markers | BioBERT Medical NER | Real-time EHR integration |
| **Recommendations** | Rule/LLM template suggestions | Actionable doctor links | Direct booking hooks | Remote diagnosis |
| **Dashboard & Vitals**| Static chart logs | Live blood pressure graphs| Wearable syncing (Fitbit) | Automated clinic report exports |

---

## 7. MVP Scope
* Email-Password signup & login.
* Vitals recording (Heart rate, Blood pressure, Sugar, BMI) and viewing.
* Symptom checker with predictive machine learning model.
* PDF/Image medical report uploader with textual OCR summary.
* Actionable, structured recommendations.
* History page listing past predictions and reports.

---

## 8. Future Scope
* **Direct EHR/FHIR Integrations**: Seamless connections with hospital networks.
* **Real-time Wearable Syncing**: Support for continuous streams of vitals (Apple HealthKit / Google Fit).
* **Telehealth Booking**: Direct scheduling links to specialists depending on symptom check severity.
