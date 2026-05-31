# Gryffin Calorai - API SDK

Auto-generated OpenAPI clients for all platforms. Do not edit manually.

To regenerate after backend changes:

```bash
# 1. Export spec from the running backend
curl http://localhost:8080/api-docs > openapi.json

# 2. Run the generator
cd apps/backend/openapi-codegen
bash generate.sh
```

Generated outputs:

- `typescript/` - axios client (used by apps/web)
- `kotlin/`     - retrofit2 + coroutines client (used by apps/android)
- `swift/`      - Swift 5 async/await client (used by apps/ios)
