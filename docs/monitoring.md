# Phase 17 — Monitoring Setup: AI-Powered Smart Healthcare Assistant

This document outlines the system instrumentation and metric scraper configurations for monitoring FastAPI server health, inference latencies, and database queries.

---

## 1. Monitoring Architecture Overview

We use **Prometheus** to pull metrics from our applications, and **Grafana** to display these metrics on visual dashboards.

```
[Web Client] ➔ [FastAPI Backend (/metrics)]
                     ▲
                     │ (Scrapes metrics every 15s)
               [Prometheus Server]
                     ▲
                     │ (Visualizes query rates, cpu, memory)
               [Grafana Dashboard]
```

---

## 2. FastAPI Prometheus Integration
To expose standard Prometheus metrics (HTTP requests count, response latency histograms), we integrate `prometheus-client` middlewares.

### API Metrics Endpoint
The backend exposes raw metrics under `GET /api/metrics` (or `/metrics` globally):
```python
from prometheus_client import make_asgi_app, Counter, Histogram
import time

# Create Prometheus ASGI app mount
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Custom metric tracking
INFERENCE_LATENCY = Histogram('inference_latency_seconds', 'Time spent processing symptom predictions')
```

---

## 3. Prometheus Scraper Configuration

Add a `prometheus.yml` configuration file to define scrape targets:

```yaml
# File: prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'fastapi-backend'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['backend:8000']

  - job_name: 'mongodb-exporter'
    static_configs:
      - targets: ['mongodb-exporter:9216']
```

---

## 4. Grafana Dashboards
Once Grafana connects to Prometheus as a datasource, configure dashboards tracking:
1. **Request Rates (QPS)**: Monitors API throughput.
2. **Latency (p95, p99)**: Ensures response stays under NFR boundaries (<500ms).
3. **Inference Metrics**: Visualizes prediction count by disease category.
