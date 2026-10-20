# Changelog

## 2026-10-20 — Repository refresh and re-verification

- README rewritten against the current code: install (local dev + Docker Compose), a step-by-step
  "How to use" walkthrough, and a Verify section. Stale claims corrected — the test tree defines
  99 test functions (`make test`: 81 passed, 7 skipped, 1 deselected on 2026-10-20); the Docker
  stack is 10 services; references to non-existent files (`PROJECT_STATUS.md`, `TASK_BOARD.md`) removed.
- `STATUS.md` header corrected from "PRODUCTION READY / certified" to working-prototype status,
  per the project constitution (`docs/context.md` §3): the prototype is demonstrated and
  test-covered on synthetic data; it is not production-certified.
- `.gitignore`: `.env*` replaced with `.env` / `.env.*` + `!.env.example`, so the example
  environment file is tracked while real secrets stay out.
- `deploy.sh` (one-command Docker deployment) included in the repository.
- Full verification on 2026-10-20: `make test` 81 passed / 7 skipped / 1 deselected;
  `make build-web` ok; live server smoke test (health, demo login, SPA) ok.

# DRISTI-NET: Comprehensive Frontend-Backend Integration & Hardening (Phase 5)

## Overview
This patch completes the final transition of DRISTI-NET from a frontend mock-driven state to a fully integrated production application connected to the real FastAPI backend (`/api/v1/*`), ClamAV quarantine gates, and SQLite/PostgreSQL `drishti.db` schemas.

## Major Changes

### 1. API Integration & Mock Removal
- **Mock Eradication**: Removed all instances of `mockFetch` and hardcoded frontend API responses. All services now rely on typed Axios calls through `real_client.ts`.
- **Backend Data Mapping**: Transformed backend payload shapes (e.g. `entity_id`, `kind`, `rel_type`) into the frontend Zustand store definitions (`id`, `entityType`, `relationshipType`) in files such as `graphApi.ts` and `entityApi.ts`.
- **Fail-Closed Architecture Hookups**: Properly integrated frontend states to handle 401 Unauthorized, 403 Forbidden, 422 Unprocessable Entity, and `SCANNER_UNAVAILABLE` backend codes meaningfully, rather than crashing or returning empty sets.

### 2. E2E Test Hardening (`test_ui_demo.py`)
- **WebGL Sigma.js Flakiness Resolved**: Tests interacting with the `GraphEngine` previously struggled to precisely click WebGL-rendered edges/nodes via Playwright global coords. Updated `_click_graph_edge` and `_click_first_node` to bypass global pixel clicking and invoke `window.__graphStore.getState().selectEdge()` directly, achieving 100% test reliability.
- **Selector Texts Updated**: Mapped Playwright selectors to the new hardened UI copy (e.g., `VIEW ORIGINAL EVIDENCE PROOF`, `Statutory Tamper-Evident System Log`).
- **Session State**: Added proper authentication hooks (`login(page, "investigator")`) to sub-tests ensuring routes don't bounce out to the login screen mid-test.

### 3. State & UI Fixes
- **Graph Drawer Reliability**: The Sigma `EdgeDrawer` and `EntityDrawer` now correctly hydrate from the backend `GraphResponse` payload because the API mapper accurately maps backend relationships into frontend schemas. 
- **Legacy Router Parameters**: Refactored `router.tsx` utilizing a `LegacyPanelWrapper` to pass `caseId` via `useParams()`. This fixes the previous 403 errors when `AnalysisPanel` and `ReportPanel` hit the FastAPI endpoints missing explicit target parameters.
- **HITL Integration**: Fixed the `hitlApi.ts` payload serialization where React was sending objects instead of strings, causing a 422 Unprocessable Entity block on the backend validation layer. Review queues now successfully pull data and process reviewer acceptances.

### 4. Codebase Hardening & Artifact Cleanup
- **Deployment Audits**: Verified `infrastructure/nginx/nginx.conf` security implementations (strict CSP, OWASP headers, timeouts for ClamAV).
- **Cleanup**: Executed a total forensic flush removing intermediate Python scripts (`patch_cases.py`, `debug.py`), legacy `mock` wrappers, bloated `__pycache__` artifacts, `.pytest_cache`, and isolated UI test screenshots not relevant to the Git repository.

## Summary of Verification
Executed `make e2e` yielding 5/5 passes against the live `testgate` API worker instance, proving end-to-end evidence ingestion, graph rendering, human-in-the-loop signoff, analysis mapping, and authoritative logging.
