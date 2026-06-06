# Guard Makefile - run backend commands from the repo root instead.
#
# Instead of:  cd apps/backend && mvn clean install
# Use:         make be-build      (from repo root)
#
# All targets are defined in the root Makefile.

ROOT := $(shell git rev-parse --show-toplevel)

.PHONY: help install build run clean test up down logs restart codegen

help build install run clean test up down logs restart codegen:
	@echo ""
	@echo "  Run backend commands from the repo root, not from apps/backend/."
	@echo ""
	@echo "  cd $(ROOT)"
	@echo "  make $@"
	@echo ""
	@echo "  Available backend targets:"
	@echo "    make be-build      mvn clean install"
	@echo "    make be-run        mvn spring-boot:run"
	@echo "    make be-check      checkstyle report"
	@echo "    make be-up         docker compose up -d"
	@echo "    make be-down       docker compose down"
	@echo "    make be-logs       docker compose logs -f backend"
	@echo "    make be-restart    docker compose restart backend"
	@echo "    make codegen       regenerate TS/Kotlin/Swift SDKs"
	@echo ""
