# DRISTI-NET — evidence-linked criminal network analysis (working prototype)

Evidence-linked relationship discovery for **authorized human review**. The system proposes candidate
relationships across approved cases and shows source, time, uncertainty, missing data, access history and
human decisions. **It does not decide who is a criminal.** Everything in this repository runs on synthetic data.

> The model proposes; the investigator decides. A shared identifier is a candidate relationship, not proof of identity.
> Temporal decay changes current relevance; it does not rewrite history.

Built by **Team TechFlex**.

**Status:** working prototype. The full workflow below is implemented and covered by automated tests;
it is not a production system and carries no certification. Per-area status: `STATUS.md` and `docs/status.md`.

## What the prototype demonstrates (the one story)

```
fictional case → synthetic upload → validated + quarantined → SHA-256 manifest → scan gate (fail-closed)
→ source-linked extraction → entity & relationship candidates → human accept / reject / defer / reverse
→ approved claims projected to a bounded graph → graph + timeline + evidence drawer
→ click an edge → exact source row / page / line → masking, audited reveal, server-side denial
→ human-reviewed report export (JSON / HTML)
```

Every step above has an automated test (`make test`) and a UI screen.

## UI screens

| Screen | What it shows |
|---|---|
| Command center | Case overview, review priorities, recent activity |
| Evidence quarantine | Upload state machine: quarantined → hashed → scan gate → accepted / rejected |
| Review workspace | Candidate relationships with accept / reject / defer / reverse and rationale |
| Graph intelligence | Bounded POLE+ graph; every edge opens its exact source evidence |
| Timeline | Historical vs current view of the same case |
| Audit | Tamper-evident audit trail with integrity references (SHA-256 / Merkle) |

Screenshots live in `reports/screenshots/` in the full project archive.

## Quick start (local dev, ~3 minutes)

Requirements: Python **3.12.3** (pinned in `.python-version`), Node **24.20.0** (pinned in `.nvmrc`).
No Docker or Neo4j needed for the prototype;
a single SQLite file is the default database and the graph runs in-process. Real PostgreSQL and
Neo4j are supported, tested swaps (see below).

```bash
git clone https://github.com/MEGHSHAH4/DRISTINET.git && cd DRISTINET
python3 -m pip install -r apps/api/requirements.lock   # exact verified versions (98 packages)
# requirements.txt holds the readable ranges; the heavy ML adapters it lists
# (torch, transformers, PaddleOCR, PyMuPDF) are optional — the app import-guards
# them and falls back, so they are not in the lock.
python3 data/synthetic/generate.py            # deterministic synthetic dataset
# No ClamAV on this machine? The scan gate is fail-closed, so use testgate
# (safe substitute: flags only the EICAR test signature) or uploads stay quarantined:
export DRISHTI_SCANNER_MODE=testgate
python3 -m apps.api.app.seed --ingest         # demo users + cases, then pushes the files through the real pipeline
(cd apps/web && npm install && npm run build) # React UI → apps/web/dist (served by the API)
python3 -m uvicorn apps.api.app.main:app --port 8000
```

Open <http://localhost:8000>. Sign in as `investigator` / `investigator-demo`
(all demo users: password = `<name>-demo`).

| user           | role             | use it to show                                        |
| -------------- | ---------------- | ----------------------------------------------------- |
| `investigator` | INVESTIGATOR     | cases, graph, evidence drawer, reveal, report         |
| `officer`      | EVIDENCE_OFFICER | upload, quarantine, hash, scan gate, retry            |
| `reviewer`     | REVIEWER         | accept / reject / defer / reverse                     |
| `analyst`      | ANALYST          | analysis, timeline                                    |
| `auditor`      | AUDITOR          | global audit trail                                    |
| `admin`        | ADMIN            | tamper demo (hash mismatch), assignments              |
| `unassigned`   | INVESTIGATOR     | **denied** on CASE-0001 (not assigned)                |
| `outsider`     | INVESTIGATOR     | **denied** on CASE-0001 (jurisdiction mismatch)       |

Dev loop: `make api` (auto-reload) + `make web` (Vite on :5173 proxies `/api` to :8000).

### Or: single-container Docker image

```bash
docker build -t dristinet .
docker run --rm -p 8000:8000 dristinet    # seeds demo data on start, then serves http://localhost:8000
```

The image pins Node 24.20.0 + Python 3.12.3 and installs from `apps/api/requirements.lock`.
It is a demo image (testgate scanner, in-process graph, SQLite); for the full stack use the
Docker Compose deployment below.

## How to use (the demo walkthrough)

1. **Sign in** as `investigator` and open a seeded case from the command center.
2. **Upload evidence** (as `officer`): the file is validated, quarantined, hashed (SHA-256 manifest)
   and held at the scan gate. Only a `CLEAN` result proceeds — scan failure, timeout or an
   unavailable scanner are *not* treated as clean.
3. **Watch extraction**: accepted files produce source-linked entity and relationship *candidates*,
   each carrying its source file, page/row, method and confidence.
4. **Review** (as `reviewer`): accept, reject, defer or reverse each candidate. A shared phone,
   device or address creates a candidate relationship only — it never merges two people automatically.
5. **Explore the graph**: approved claims appear in the bounded graph (hop and node limits are
   enforced server-side). Click any edge to open the exact source row / page / line in the evidence drawer.
6. **Check the timeline** to compare historical and current relevance; temporal decay changes
   current relevance only, never the historical record.
7. **Reveal and report**: masked identifiers can be revealed with a recorded justification;
   every reveal, denial and decision is written to the audit trail. Export the human-reviewed
   report (JSON / HTML) from the reports screen.

The click-by-click version is `docs/demo-script.md` (13 steps).

## Production deployment (Docker Compose, port 80)

The full stack runs via Docker Compose and is served by nginx on **port 80** — no `:8000` in the URL.
All containers restart automatically on crash or server reboot.

```bash
# 1. Copy .env.example → .env and fill in secrets (DRISHTI_SECRET_KEY ≥ 32 bytes)
cp .env.example .env && chmod 600 .env
# Generate secrets:
#   python3 -c "import secrets; print('DRISHTI_SECRET_KEY=' + secrets.token_hex(32))"
#   python3 -c "import secrets; print('POSTGRES_PASSWORD=' + secrets.token_hex(16))"
#   python3 -c "import secrets; print('NEO4J_PASSWORD=drishti-neo4j-' + secrets.token_hex(8))"
#   python3 -c "import secrets; print('MINIO_ROOT_PASSWORD=drishti-minio-' + secrets.token_hex(8))"

# 2. Start the full stack — 10 services: nginx, api, postgres, neo4j, minio, clamav,
#    migrations, worker, kafka, besu
make deploy          # or: docker compose up -d
#    One-command alternative: ./deploy.sh

# 3. Open http://<server-ip>  (no port suffix)
```

Sign in as `investigator` / `investigator-demo` (all demo users: password = `<name>-demo`).

### Auto-start on server reboot

The systemd unit `infrastructure/dristinet.service` can be installed at `/etc/systemd/system/dristinet.service`
and enabled on boot (the unit assumes the checkout lives at `/opt/dristinet` — edit its
`WorkingDirectory`/`EnvironmentFile` paths if yours is elsewhere). On a fresh server:

```bash
sudo cp infrastructure/dristinet.service /etc/systemd/system/dristinet.service
sudo systemctl daemon-reload
sudo systemctl enable --now dristinet.service
```

### Operator commands

```bash
make deploy-status   # show running containers + port 80 health check
make deploy-logs     # tail logs from all containers (Ctrl-C to stop)
make deploy-restart  # rolling restart without wiping data
make deploy-down     # stop all containers (data volumes preserved)
```

### Using PostgreSQL instead of SQLite

The app is DB-agnostic through `DRISHTI_DATABASE_URL`; schema is managed by real Alembic migrations
(`apps/api/migrations` — 5 revisions), not `create_all`, whenever that URL is not `sqlite:...`.

```bash
docker compose up -d postgres                 # or point at any Postgres 13+ you already run
export DRISHTI_DATABASE_URL=postgresql+psycopg2://drishti:drishti@localhost:5432/drishti
python3 -m uvicorn apps.api.app.main:app --port 8000   # applies migrations automatically on startup
```

`make db-upgrade` applies migrations by hand; `make db-revision msg="..."` autogenerates a new one after
a model change — inspect the generated diff before committing it. This swap has been run end-to-end against
a real PostgreSQL 16 instance (seed → login → upload → scan → extract → resolve → graph, plus the full
test suite with `DRISHTI_DATABASE_URL` pointed at Postgres); it is not merely a documented target.

### Using Neo4j instead of the in-process graph

`DRISHTI_NEO4J_URI` swaps the graph projection to real Neo4j; unset, an equivalent in-process build covers
the zero-install dev/test loop (same pattern as SQLite for Postgres).

```bash
docker compose up -d neo4j                    # or point at any Neo4j 5.x Community server you already run
export DRISHTI_NEO4J_URI=bolt://localhost:7687
export DRISHTI_NEO4J_PASSWORD=drishti-neo4j-demo
python3 -m uvicorn apps.api.app.main:app --port 8000   # applies graph/constraints.cypher automatically
```

`services/neo4j_store.py` writes the approved-claims projection into Neo4j via parameterized Cypher
(`MERGE`, never string-built) and serves bounded graph queries (hop/node limits) as real server-side
Cypher traversals — never exposed to the browser (design: `docs/adr/002-graph-store.md`). This has been
run end-to-end against a real Neo4j 5.26 instance (the full test suite, plus a direct query of the
resulting graph outside the test process). That verification caught and fixed a real bug: entities are
a global registry in Postgres (one entity can be referenced by claims from more than one case), so a
node's case membership had to be modeled as a set, not a field the next case's sync could silently
overwrite. NetworkX remains only as a local analysis library for degree/betweenness/community
detection on an already-bounded result set; Neo4j Community has no built-in graph algorithms without
the separately licensed GDS plugin.

## Architecture (prototype)

```
Browser
  ──HTTP:80──▶  nginx (reverse proxy, security headers, gzip)
                  ──▶  FastAPI /api/v1  (uvicorn, port 8000, internal only)
                          │               SQLAlchemy → PostgreSQL (or SQLite for dev)
                          │               cases, users, evidence manifest, jobs, claims,
                          │               provenance, match candidates, reviews, audit, snapshots
                          ├──▶  MinIO / local object store  (quarantine/ → accepted/)
                          ├──▶  ClamAV scan gate            (fail-closed)
                          ├──▶  extraction worker           (CSV / JSON / PDF / TXT)
                          ├──▶  entity resolution           (explainable candidates; never auto-merge)
                          └──▶  Neo4j / in-process graph    (rebuildable from claims + reviews)
```

The browser never talks to the graph store, object store, or any internal service — only to the
bounded, authorized API through nginx.

## Repository layout

```
apps/api/app/           FastAPI backend (routes/, services/, models.py, auth.py, seed.py, tests/)
apps/web/               React + TypeScript UI (Vite)
workers/                extraction worker (Kafka consumer; in-process path also supported)
graph/                  POLE+ graph notes and constraints
packages/               shared schemas and event contracts
policy/                 policy configuration
data/synthetic/         generate.py + generated fixtures + truth-labels.json
docs/                   workflow, architecture, API contract, data dictionary, security, demo script, limitations
infrastructure/         nginx/nginx.conf (reverse proxy), dristinet.service (systemd auto-start)
scripts/                environment and evaluation helpers (incl. evaluate_ai.py)
deploy.sh               one-command Docker deployment
storage/                local object store (quarantine/, accepted/) + SQLite DB   [gitignored]
tests/                  integration / security / e2e
reports/                evaluation & release checklists
```

## Verify

```bash
make test      # pytest: security gate (authz, scan gate, hash, masking, audit) + full workflow
make build-web # production build of the React UI
make e2e       # Playwright walkthrough of the demo script against a running server on :8000 (5 tests)
               #   one-time: pip install playwright && playwright install chromium
```

The test tree defines 99 test functions across the API suite; `make test` runs the unit selection
(it deselects one test that needs a real ClamAV daemon).

### Verification run (2026-10-20, this working tree)

| step | command | result |
|---|---|---|
| backend tests | `make test` | **81 passed, 7 skipped, 1 deselected** |
| web build | `make build-web` | ok (chunk-size warning only) |
| server smoke | `uvicorn apps.api.app.main:app --port 8000` | `/api/v1/health` → `{"status":"ok", …}` (SQLite, in-process graph, testgate scanner) |
| demo login | `POST /api/v1/auth/login` (`investigator`) | token issued; SPA served at `/` (HTTP 200) |

### Production deployment verification (2026-09-18, historical)

Full Docker Compose stack on Linux, Docker 27, nginx 1.27:

| step | result |
|---|---|
| `docker compose up -d` | stack healthy — nginx fronts api, postgres, neo4j, minio, clamav (+ migrations, worker, kafka, besu) |
| `curl http://<ip>/api/v1/health` | `{"status":"ok","database":"postgresql+psycopg2","graph_store":"neo4j"}` |
| `curl http://<ip>/` | React SPA — `DRISTI-NET · prototype` |
| `curl http://<ip>/docs` | HTTP 200 — OpenAPI docs |
| All containers | `restart=unless-stopped` — survive crash and server reboot |
| systemd `dristinet.service` | enabled — starts stack on boot |
| JWT `SECRET_KEY` | 64 bytes — above RFC 7518 minimum of 32 |

## Safety boundary (what it is not)

No live CCTNS/ICJS, telecom, bank or surveillance connectivity. No biometrics. No automatic person-level
merging. No guilt / threat / risk scores. No autonomous alerts or interventions. Not production-certified;
a SHA-256 hash is an integrity reference, not a chain-of-custody certificate. See `docs/limitations.md`.

## Docs

- `STATUS.md` — implementation status summary
- `docs/status.md` — every blueprint requirement classified Demonstrated / MVP target / Roadmap
- `docs/context.md` — **the project constitution** (agent-ready blueprint); `AGENTS.md` tells agents how to use it
- `docs/responsible-ai.md` — commitments and where each is enforced
- `docs/workflow.md` — the eleven steps with the status machine
- `docs/architecture.md` — zero-install default vs. real backend for each component, and why
- `docs/adr/` — Architecture Decision Records: the real technology choices made and why, with what was live-verified
- `docs/contracts.md` — endpoints, IDs, states
- `docs/data-dictionary.md` — synthetic dataset and planted scenarios
- `docs/security.md` — controls and how each is demonstrated
- `docs/demo-script.md` — the 13-step demo, click by click
- `docs/limitations.md` — what is demonstrated vs roadmap
- `docs/FRONTEND_ARCHITECTURE.md`, `docs/FRONTEND_API_MAP.md` — frontend structure and API mapping
- `CHANGELOG.md` — release history
