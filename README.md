# Gryffin Calorai

Offline-first calorie tracking app with activity logging, intermittent fasting, recipe management,
and comprehensive progress analytics. Designed with an **Almanac / Field Journal** aesthetic -
persimmon ink, cream paper, hairline rules, Tufte-style charts, and hand-drawn SVG illustrations.

**Frontend:** React 19 • Vite 8 • TypeScript 6 • Recharts 3 • Zustand 5 (9 slices) • Dexie.js 4 (
schema v20) • Tailwind CSS 4 • shadcn/ui • Radix UI • react-hook-form 7 • zod 4 • motion 12 •
lucide-react • sonner • fflate (ZIP) • vite-plugin-pwa  
**Backend:** Spring Boot 4.0 • Java 25 • PostgreSQL 18 • Flyway • Spring Security • JJWT •
Bucket4j + Valkey (rate limiting)

**Status:** v0.15.0 released (June 2026) • 135 test files, 2484 tests

[![Apache License 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://github.com/anchit-choudhry/gryffin-calorai/blob/main/LICENSE)
[![CodeQL Advanced](https://github.com/anchit-choudhry/gryffin-calorai/actions/workflows/codeql.yml/badge.svg)](https://github.com/anchit-choudhry/gryffin-calorai/actions/workflows/codeql.yml)
[![Dependabot Updates](https://github.com/anchit-choudhry/gryffin-calorai/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/anchit-choudhry/gryffin-calorai/actions/workflows/dependabot/dependabot-updates)
[![Dependency review](https://github.com/anchit-choudhry/gryffin-calorai/actions/workflows/dependency-review.yml/badge.svg)](https://github.com/anchit-choudhry/gryffin-calorai/actions/workflows/dependency-review.yml)
[![Deploy static content to Pages](https://github.com/anchit-choudhry/gryffin-calorai/actions/workflows/static.yml/badge.svg)](https://github.com/anchit-choudhry/gryffin-calorai/actions/workflows/static.yml)
[![DevSkim](https://github.com/anchit-choudhry/gryffin-calorai/actions/workflows/devskim.yml/badge.svg)](https://github.com/anchit-choudhry/gryffin-calorai/actions/workflows/devskim.yml)
[![Lint Code Base](https://github.com/anchit-choudhry/gryffin-calorai/actions/workflows/super-linter.yml/badge.svg)](https://github.com/anchit-choudhry/gryffin-calorai/actions/workflows/super-linter.yml)
[![OSV-Scanner](https://github.com/anchit-choudhry/gryffin-calorai/actions/workflows/osv-scanner.yml/badge.svg)](https://github.com/anchit-choudhry/gryffin-calorai/actions/workflows/osv-scanner.yml)

## Getting Started

### Prerequisites

- Node.js 24+ and [pnpm](https://pnpm.io)
- Java 25+ and Maven 3.9.16+ (for backend)
- Docker + Docker Compose (recommended for backend)

### Repository layout

```
gryffin-calorai/
├── apps/
│   ├── web/        React + Vite + TypeScript (this app)
│   └── backend/    Spring Boot 4.0 + PostgreSQL
└── packages/
    └── api-sdk/    Auto-generated OpenAPI clients
```

### Frontend

```bash
pnpm install              # install all workspace packages
pnpm dev                  # http://localhost:5173
pnpm test                 # run all tests with coverage
pnpm build                # production build (output: apps/web/dist/)
```

### Backend

**Secret management:** `apps/backend/.env` is gitignored and must never be committed. All other
backend config files (`application.yml`, `docker-compose.yml`, `application-test.yml`) are safe to
commit - they contain no real secrets; every secret is read from environment variables using
`${ENV_VAR}` substitution. Copy `.env.example` to create your local `.env`.

**With Docker Compose (recommended):**

```bash
cd apps/backend
cp .env.example .env
# Open .env and fill in the required values:
#   POSTGRES_PASSWORD=<any local password you choose>
#   JWT_SECRET=<output of: openssl rand -hex 32>
#   PGADMIN_DEFAULT_PASSWORD=<any local password you choose>
docker compose up -d    # starts all three services in the background
```

Services started:

| Service  | URL                   | Notes                                                                            |
|----------|-----------------------|----------------------------------------------------------------------------------|
| Backend  | http://localhost:8080 | API base: `/gryffin/calorai/api`; health: `/gryffin/calorai/api/actuator/health` |
| pgAdmin  | http://localhost:5050 | DB browser (log in with your .env credentials)                                   |
| Postgres | localhost:5432        | DB name / user: `gcalorai`; password: from `.env`                                |
| Valkey   | localhost:6379        | Redis-compatible store used for rate-limit buckets (internal only)               |

```bash
docker compose logs -f backend   # tail backend logs
docker compose down              # stop all services (data volumes preserved)
docker compose down -v           # stop and delete all data volumes
```

> `docker compose up` will fail with a clear error if `POSTGRES_PASSWORD` or `JWT_SECRET`
> is missing from `.env` - this is intentional. The backend also refuses to start with a
> known-placeholder secret. Swagger UI is disabled by default; set `SWAGGER_ENABLED=true` in
> `.env` to enable it at http://localhost:8080/gryffin/calorai/api/swagger-ui/index.html.

**With Maven only (requires PostgreSQL running locally):**

```bash
# 1. Create the database (first time only - substitute your chosen password):
createdb -U postgres gcalorai
psql -U postgres -c "CREATE USER gcalorai WITH PASSWORD '<your-password>';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE gcalorai TO gcalorai;"

# 2. Set required environment variables:
cd apps/backend
export DATABASE_URL=jdbc:postgresql://localhost:5432/gcalorai
export DATABASE_USER=gcalorai
export DATABASE_PASSWORD=<your-password>
export JWT_SECRET=$(openssl rand -hex 32)   # must be a real random value
export CORS_ALLOWED_ORIGINS=http://localhost:5173
export SWAGGER_ENABLED=true                 # optional: enables Swagger UI at /gryffin/calorai/api/swagger-ui/index.html

# 3. Start the backend:
mvn spring-boot:run     # http://localhost:8080
```

API base path: `http://localhost:8080/gryffin/calorai/api`  
Health check: `curl http://localhost:8080/gryffin/calorai/api/actuator/health`

### OpenAPI codegen

```bash
# Export spec from running backend (SWAGGER_ENABLED=true required), then regenerate SDK clients:
curl http://localhost:8080/gryffin/calorai/api/api-docs > apps/backend/api-docs/openapi.json
cd apps/backend/openapi-codegen && bash generate.sh
```

---

Powered by

[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://react.dev)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000?logo=shadcnui&logoColor=fff)](https://ui.shadcn.com)
[![Recharts](https://img.shields.io/badge/Recharts-FF7300?logo=recharts&logoColor=fff)](https://recharts.org)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=fff)](https://vitest.dev)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-%2338B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Github Pages](https://img.shields.io/badge/github%20pages-121013?style=for-the-badge&logo=github&logoColor=white)](https://pages.github.com)
[![Claude Code](https://img.shields.io/badge/Claude-D97757?logo=claude&logoColor=fff)](https://claude.com/product/claude-code)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-886FBF?logo=googlegemini&logoColor=fff)](https://geminicli.com)
[![Hugging Face](https://img.shields.io/badge/Hugging%20Face-FFD21E?logo=huggingface&logoColor=000)](https://huggingface.co)
[![Ollama](https://img.shields.io/badge/Ollama-fff?logo=ollama&logoColor=000)](https://ollama.com)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=fff)](https://pnpm.io)
