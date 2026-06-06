.PHONY: help \
        dev test lint build audit \
        be-up be-down be-logs be-restart be-build be-run be-check \
        codegen

BACKEND_DIR := apps/backend
COMPOSE     := docker compose --project-directory $(BACKEND_DIR) -f $(BACKEND_DIR)/docker-compose.yml
MVN         := mvn -f $(BACKEND_DIR)/pom.xml

# ── Help ─────────────────────────────────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── Frontend ──────────────────────────────────────────────────────────────────

dev: ## Start frontend dev server (localhost:5173)
	pnpm dev

test: ## Run all frontend tests with coverage
	pnpm test

lint: ## ESLint + Prettier fix
	pnpm lint:fix

build: ## Production frontend build
	pnpm build

audit: ## Check for known CVEs (fails on high/critical)
	pnpm audit

# ── Backend (Docker Compose) ──────────────────────────────────────────────────

be-up: ## Start postgres + pgadmin + backend (detached)
	$(COMPOSE) up -d

be-down: ## Stop all backend services
	$(COMPOSE) down

be-logs: ## Tail backend container logs
	$(COMPOSE) logs -f backend

be-restart: ## Restart backend container only
	$(COMPOSE) restart backend

# ── Backend (Maven) ───────────────────────────────────────────────────────────

be-build: ## mvn clean install (compile + test + checkstyle)
	$(MVN) clean install

be-run: ## mvn spring-boot:run (requires running PostgreSQL on 5432)
	$(MVN) spring-boot:run

be-check: ## Run Checkstyle report only (does not fail build)
	$(MVN) checkstyle:checkstyle

# ── OpenAPI Codegen ───────────────────────────────────────────────────────────

codegen: ## Regenerate TS/Kotlin/Swift SDK clients (backend must be running)
	mkdir -p $(BACKEND_DIR)/api-docs
	curl -fsS http://localhost:8080/api-docs > $(BACKEND_DIR)/api-docs/openapi.json
	cd $(BACKEND_DIR)/openapi-codegen && bash generate.sh
