# DRISTI-NET Implementation Status

**CURRENT STATUS: WORKING PROTOTYPE** — the end-to-end workflow (upload → quarantine → scan gate → extraction → human review → bounded graph → report export) is implemented and test-covered on synthetic data. It is not a production system and carries no certification. Requirement-by-requirement status: `docs/status.md`.

Re-verified 2026-10-20: `make test` — 81 passed, 7 skipped, 1 deselected; `make build-web` ok; live server smoke test (health endpoint, demo login, SPA) ok.

## Confirmed Realizations:
1. **Frontend-Backend Integration**: Frontend API wrappers successfully route to actual `fastapi` backend endpoints (`getCaseGraph`, `getHITLStats`, `getEdgeDetails`). No fallback simulated data is used.
2. **AI Extractor NLP Pipeline**: Regex-based entity extraction for Unstructured documents (PERSON/ORGANIZATION/OWNER) has been completely removed. Text documents are natively extracted using `nlp_adapter.py` connecting to `ai4bharat/IndicBERTv2-MLM-only-NER`.
3. **Regex Boundary Maintained**: Regex is strictly kept only for structured identifiers (PHONE, ACCOUNT, REGISTRATION) as bounded by the project rules.
4. **AI Evaluation Verification**: Scripts dynamically execute inference scoring against held-out validation data (`scripts/evaluate_ai.py`).
5. **Worker Orchestration**: `worker.py` orchestrates purely without recursive Kafka rebroadcasts (utilizing explicit `async_allowed=False` bounds).
6. **Infrastructure Topology**: `docker-compose.yml` mounts 10 discrete services, including Hyperledger Besu and Kafka KRaft nodes.

*Status summary maintained with the codebase; last updated 2026-10-20 (original audit 2026-09-25).*
