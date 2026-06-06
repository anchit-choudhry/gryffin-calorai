# Guard Makefile - run all commands from the repo root.
#
# cd $(shell git rev-parse --show-toplevel)
# make help

ROOT := $(shell git rev-parse --show-toplevel)

.PHONY: help
.DEFAULT_GOAL := help

help:
	@echo ""
	@echo "  Run commands from the repo root, not from apps/."
	@echo ""
	@echo "  cd $(ROOT) && make help"
	@echo ""

%:
	@echo ""
	@echo "  Run commands from the repo root, not from apps/."
	@echo ""
	@echo "  cd $(ROOT) && make help"
	@echo ""
