# Guard Makefile - run frontend commands from the repo root.
#
# Instead of:  cd apps/web && pnpm dev
# Use:         make dev        (from repo root)

ROOT := $(shell git rev-parse --show-toplevel)

.PHONY: help
.DEFAULT_GOAL := help

help:
	@echo ""
	@echo "  Run frontend commands from the repo root, not from apps/web/."
	@echo ""
	@echo "  cd $(ROOT)"
	@echo "  make <target>"
	@echo ""
	@echo "  Available frontend targets:"
	@echo "    make dev       pnpm dev  (localhost:5173)"
	@echo "    make test      pnpm test (with coverage)"
	@echo "    make lint      pnpm lint:fix"
	@echo "    make build     pnpm build"
	@echo "    make audit     pnpm audit"
	@echo ""

%:
	@echo ""
	@echo "  Run frontend commands from the repo root, not from apps/web/."
	@echo ""
	@echo "  cd $(ROOT)"
	@echo "  make $@"
	@echo ""
	@echo "  Available frontend targets:"
	@echo "    make dev       pnpm dev  (localhost:5173)"
	@echo "    make test      pnpm test (with coverage)"
	@echo "    make lint      pnpm lint:fix"
	@echo "    make build     pnpm build"
	@echo "    make audit     pnpm audit"
	@echo ""
