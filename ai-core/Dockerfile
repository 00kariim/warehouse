# ── Build stage ───────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build
COPY requirements.txt .
# Install to default site-packages so seed_model.py can import numpy/sklearn
RUN pip install --no-cache-dir -r requirements.txt

# Pre-train the Isolation Forest — packages are on Python's default path now
COPY seed_model.py .
RUN python seed_model.py

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Fresh install for the runtime image
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy pre-trained model from builder
COPY --from=builder /build/models /app/models

# Copy application source
COPY src/ /app/src/

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
