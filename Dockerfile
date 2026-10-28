# Single-container prototype image (API + built UI). Not verified on the development machine (no Docker there).
FROM node:24.20.0-slim AS web
WORKDIR /web
COPY apps/web/package*.json ./
RUN npm ci --no-audit --no-fund
COPY apps/web .
RUN npm run build

FROM python:3.12.3-slim
WORKDIR /app
COPY apps/api/requirements.txt apps/api/requirements.lock apps/api/
RUN pip install --no-cache-dir -r apps/api/requirements.lock
COPY . .
COPY --from=web /web/dist apps/web/dist
RUN python3 data/synthetic/generate.py
ENV DRISHTI_STORAGE_ROOT=/data
# Single-container demo only: no ClamAV in this image, so the scan gate uses
# testgate (flags only the EICAR test signature). The production Compose stack
# ships a real ClamAV service and does not use this image.
ENV DRISHTI_SCANNER_MODE=testgate
EXPOSE 8000
# Seed is idempotent (existing users/assignments are skipped); it creates the
# demo users and cases and pushes the synthetic files through the pipeline.
CMD ["sh", "-c", "python3 -m apps.api.app.seed --ingest && python3 -m uvicorn apps.api.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
