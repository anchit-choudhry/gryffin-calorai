#!/usr/bin/env bash
# Regenerate API clients from the OpenAPI spec.
# Prerequisites: openapi-generator-cli installed (npm i -g @openapitools/openapi-generator-cli)
# Run after the backend is up and the spec has been exported:
#   curl http://localhost:8080/api-docs > ../api-docs/openapi.json

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Generating TypeScript (axios) client..."
openapi-generator-cli generate \
  -c "${SCRIPT_DIR}/typescript-config.json"

echo "Generating Kotlin (retrofit2 + coroutines) client..."
openapi-generator-cli generate \
  -c "${SCRIPT_DIR}/kotlin-config.json"

echo "Generating Swift 5 client..."
openapi-generator-cli generate \
  -c "${SCRIPT_DIR}/swift-config.json"

echo "Done. SDK sources written to:"
echo "  TypeScript: ../../src/api/generated"
echo "  Kotlin:     $(dirname "${SCRIPT_DIR}")/kotlin-sdk"
echo "  Swift:      $(dirname "${SCRIPT_DIR}")/swift-sdk"
