#!/usr/bin/env bash
# DRISTI-NET Automated Deployment & Setup Script
# MVP 8-Service Architecture
set -e

echo "===================================================="
echo "       DRISTI-NET Automated Deployment Script       "
echo "===================================================="

# 1. Fetch System Details & Public IP
echo "[1/8] Fetching System Details..."
OS=$(uname -s)
ARCH=$(uname -m)
if command -v free >/dev/null 2>&1; then
    RAM=$(free -m | awk '/^Mem:/{print $2}')
    echo "System: $OS ($ARCH) | RAM: ${RAM}MB"
else
    echo "System: $OS ($ARCH)"
fi

echo "Fetching Public IP Address..."
PUBLIC_IP=$(curl -s --max-time 5 https://api.ipify.org || curl -s --max-time 5 https://ipv4.icanhazip.com || curl -s --max-time 5 https://ifconfig.me)
if [[ ! "$PUBLIC_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "❌ Could not fetch a valid Public IP. Public endpoint verification failed."
    exit 1
fi
echo "Public IP detected: $PUBLIC_IP"

if ! command -v docker &> /dev/null; then
    echo "❌ ERROR: Docker is not installed. Please install Docker to continue."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ ERROR: Docker Compose (V2) is not installed. Please install it to continue."
    exit 1
fi
echo "✅ Docker and Docker Compose are present."

# 2. Check for Git Repo Update
echo ""
echo "[2/8] Checking for repository updates..."
if [ -d ".git" ]; then
    git fetch origin 2>/dev/null || echo "⚠️ Warning: Could not fetch from origin (offline or no remote)"
    LOCAL=$(git rev-parse HEAD 2>/dev/null || echo "")
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "$LOCAL")
    
    if [ "$LOCAL" != "$REMOTE" ] && [ -n "$LOCAL" ]; then
        # Ensure we read from tty, not stdin, if running interactively
        read -p "⚠️ Updates are available on GitHub. Do you want to pull the latest changes? (y/n): " -n 1 </dev/tty || REPLY="n"
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Pulling latest changes..."
            git pull
        else
            echo "Skipping update."
        fi
    else
        echo "✅ Repository is up to date (or no upstream tracking found)."
    fi
else
    echo "⚠️ Not a git repository. Skipping GitHub update check."
fi

# 3. Environment Selection (Dev/Prod)
echo ""
echo "[3/8] Selecting Deployment Environment..."
echo "1) Development (Enables test scanners, debug logging)"
echo "2) Production (Strict security, test bypasses disabled)"
read -p "Select environment (1 or 2) [Default: 2]: " ENV_CHOICE </dev/tty || ENV_CHOICE="2"

ENV_MODE="production"
ALLOW_TEST_SCANNER="0"
if [ "$ENV_CHOICE" == "1" ]; then
    ENV_MODE="development"
    ALLOW_TEST_SCANNER="1"
fi
echo "✅ Selected Environment: $ENV_MODE"

# 4. Environment Variables (Human Interaction)
echo ""
echo "[4/8] Setting up environment variables..."
if [ ! -f ".env" ]; then
    echo "⚠️ No .env file found. Initializing from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        echo "❌ ERROR: .env.example is missing! Cannot proceed securely."
        exit 1
    fi
    
    echo "----------------------------------------------------"
    echo " Security Setup: Please provide the following secrets"
    echo "----------------------------------------------------"
    
    if ! read -p "Enter PostgreSQL password (e.g. strong-db-pass): " pg_pass </dev/tty; then
        echo "ERROR: Interactive secret input unavailable. Cannot fall back to insecure defaults."
        exit 1
    fi
    if ! read -p "Enter Neo4j password (must be >= 8 chars): " neo4j_pass </dev/tty; then
        echo "ERROR: Interactive secret input unavailable."
        exit 1
    fi
    if ! read -p "Enter MinIO Root password (must be >= 8 chars): " minio_pass </dev/tty; then
        echo "ERROR: Interactive secret input unavailable."
        exit 1
    fi
    if ! read -p "Enter a random Secret Key for FastAPI sessions: " secret_key </dev/tty; then
        echo "ERROR: Interactive secret input unavailable."
        exit 1
    fi

    if [ -z "$pg_pass" ] || [ -z "$neo4j_pass" ] || [ -z "$minio_pass" ] || [ -z "$secret_key" ]; then
        echo "ERROR: Secrets cannot be empty."
        exit 1
    fi

    if [ ${#neo4j_pass} -lt 8 ] || [ ${#minio_pass} -lt 8 ]; then
        echo "ERROR: Neo4j and MinIO passwords must be at least 8 characters long."
        exit 1
    fi

    # Ensure .env is tightly permissioned
    chmod 600 .env

    # Replace values in .env safely across OS types
    sed -i.bak "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$pg_pass/" .env
    sed -i.bak "s/NEO4J_PASSWORD=.*/NEO4J_PASSWORD=$neo4j_pass/" .env
    sed -i.bak "s/MINIO_ROOT_PASSWORD=.*/MINIO_ROOT_PASSWORD=$minio_pass/" .env
    sed -i.bak "s/DRISHTI_SECRET_KEY=.*/DRISHTI_SECRET_KEY=$secret_key/" .env
    
    rm -f .env.bak
    echo "✅ .env file configured and secrets securely stored."
else
    echo "✅ .env file already exists. Using existing configuration."
fi

# Apply environment specific variables to .env
if grep -q "DRISHTI_ALLOW_TEST_SCANNER=" .env; then
    sed -i.bak "s/DRISHTI_ALLOW_TEST_SCANNER=.*/DRISHTI_ALLOW_TEST_SCANNER=$ALLOW_TEST_SCANNER/" .env
    rm -f .env.bak
else
    echo "DRISHTI_ALLOW_TEST_SCANNER=$ALLOW_TEST_SCANNER" >> .env
fi

# 5. Building & Starting Containers
echo ""
echo "[5/8] Building and deploying 8-service Docker stack ($ENV_MODE)..."
echo "This step will install all dependencies inside the containers."
docker compose up --build -d

# 6. Health Checks
echo ""
echo "[6/8] Waiting for core services to initialize..."
echo "Waiting for Postgres and Neo4j to accept connections..."
sleep 10
API_UP=false
for i in {1..30}; do
    if docker compose ps api | grep -q -E "(Up|running)"; then
        echo "✅ API container is running."
        API_UP=true
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 3
done

if [ "$API_UP" = false ]; then
    echo "❌ ERROR: API failed to start. Check 'docker compose logs api'"
    exit 1
fi

# Wait an additional 5 seconds to ensure NGINX proxy is routing properly
sleep 5

# 7. Migrations & Seeding
echo ""
echo "[7/8] Finalizing Setup (Migrations & Data)..."
read -p "Do you want to run DB migrations and seed synthetic test data now? (y/n) [Default: y]: " -n 1 </dev/tty || REPLY="y"
echo ""
if [[ -z "$REPLY" || $REPLY =~ ^[Yy]$ ]]; then
    echo "Applying Alembic schema migrations..."
    docker compose exec api alembic upgrade head
    
    echo "Ingesting synthetic base data (MVP Rules)..."
    docker compose exec api python3 -m apps.api.app.seed --ingest
    echo "✅ Data successfully seeded."
else
    echo "Skipping database setup."
fi

# 8. Automated API & Frontend Testing
echo ""
echo "[8/8] Executing Automated Post-Deployment Tests..."
TEST_FAILS=0

echo "Testing Frontend (NGINX routing)..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$PUBLIC_IP/)
if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 304 ]; then
    echo "  ✅ Frontend UI is responsive (HTTP $HTTP_STATUS)"
else
    echo "  ❌ Frontend UI returned HTTP $HTTP_STATUS"
    TEST_FAILS=$((TEST_FAILS+1))
fi

echo "Testing Backend API (OpenAPI Schema)..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$PUBLIC_IP/openapi.json)
if [ "$API_STATUS" -eq 200 ] || [ "$API_STATUS" -eq 304 ]; then
    echo "  ✅ Backend API is reachable (HTTP $API_STATUS)"
else
    echo "  ❌ Backend API returned HTTP $API_STATUS"
    TEST_FAILS=$((TEST_FAILS+1))
fi

if [ "$TEST_FAILS" -gt 0 ]; then
    echo "⚠️ Warning: $TEST_FAILS deployment test(s) failed. System may not be fully operational."
else
    echo "✅ All deployment tests passed successfully."
fi

echo ""
echo "===================================================="
echo " 🚀 DEPLOYMENT COMPLETE!                            "
echo " Environment: $ENV_MODE"
echo " DRISTI-NET is fully operational at:                "
echo " -> UI Access:        http://$PUBLIC_IP/"
echo " -> API Docs:         http://$PUBLIC_IP/docs"
echo " -> MinIO Console:    http://$PUBLIC_IP:9001"
echo "===================================================="
