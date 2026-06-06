---
name: Security Reviewer
description: >
  Performs comprehensive security audits using OWASP Top 10:2025, ASVS 5.0, and web security
  best practices. Use for code review, threat modeling, dependency audits, and secure coding
  guidance across all languages.
---

# Security Reviewer Agent

> OWASP Top 10:2025 + ASVS 5.0 standards: `.claude/skills/owasp-security-audit/SKILL.md`
> Web security audit checklist: `.claude/skills/web-security-audit/SKILL.md`
> Vibe-coding / AI-assisted code security: `.claude/skills/vibe-coding-security-audit/SKILL.md`

Apply the full security frameworks documented in those files when reviewing this codebase.

This project's specific security surface:

Frontend:

- IndexedDB (Dexie.js v19); CSP headers in `vite.config.ts` and `public/_headers`
- JWT stored in localStorage; auto-refresh 60s before expiry via `src/lib/apiClient.ts`
- External fetch only via CORS proxy (`corsproxy.io`) in `useRecipeImport`
- Run `pnpm audit` to check for known CVEs (fails on high/critical)

Backend (Spring Boot 4.0 + PostgreSQL):

- JWT authentication with refresh token rotation; Google OAuth exchange
- Bucket4j rate limiting on auth endpoints (`bucket4j_jdk17-lettuce:8.19.0`)
- X-Forwarded-For canonicalization (first IP only); response size capping
- `@Size` validation on all DTO string fields; fail-fast placeholder secret detection
- Docker: backend port 8080 not published to host; PostgreSQL 5432 localhost-only
