# Phase 13 — Testing Strategy: AI-Powered Smart Healthcare Assistant

This document outlines the testing strategy, tools, and execution processes for ensuring backend API reliability, frontend layout correctness, and ML vector sanity.

---

## 1. Testing Frameworks & Setup

### Backend (Python / FastAPI)
* **Framework**: `pytest`
* **Coverage tool**: `pytest-cov`
* **Scope**:
  * Unit test security functions (password hash matching, token sign/decode).
  * API route integration testing using FastAPI's standard `TestClient`.
  * ML inference fallback checks and error handler assertions.

### Frontend (React.js / Vite)
* **Framework**: `Vitest` + `@testing-library/react` + `jsdom`
* **Scope**:
  * Assert authorization forms correctly dispatch state adjustments.
  * Verify vital cards render normal/optimal indicator highlights based on inputs.

---

## 2. Test Commands Execution

### Running Backend Tests
1. Navigate to the backend directory: `cd backend`
2. Run pytest suite:
   ```bash
   pytest app/tests/ -v --cov=app
   ```

### Running Frontend Tests
1. Navigate to the frontend directory: `cd frontend`
2. Run Vitest suite:
   ```bash
   npm run test
   ```
