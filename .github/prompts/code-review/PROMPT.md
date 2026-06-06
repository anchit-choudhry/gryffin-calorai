# Code Review Prompt

> OWASP Top 10:2025 + ASVS 5.0 checklist: `.claude/skills/owasp-security-audit/SKILL.md`
> Web security audit checklist: `.claude/skills/web-security-audit/SKILL.md`
> React standards: `.claude/skills/reactjs-standards/SKILL.md`
> TypeScript standards: `.claude/skills/typescript-standards/SKILL.md`
> TDD / test quality: `.claude/skills/test-driven-development/SKILL.md`

## Review checklist

Apply the standards from the files above and check:

**Correctness**

- [ ] Logic matches the intended behavior; edge cases handled
- [ ] Branded types used for all entity IDs; no raw `number` or `string` for IDs
- [ ] IndexedDB queries use compound indices; no full-table scans

**Security** (see owasp + web-security-audit skills)

- [ ] No XSS vectors (unsanitized HTML rendered via `dangerouslySetInnerHTML`)
- [ ] CSP headers not weakened in `vite.config.ts`
- [ ] External URLs (e.g., CORS proxy) validated before fetch
- [ ] No secrets, credentials, or PII logged or stored in localStorage

**Code quality**

- [ ] No `eslint-disable`, `@ts-ignore`, `@ts-expect-error`
- [ ] `import type` used for type-only imports
- [ ] No inline styles; Tailwind only
- [ ] `EDITORIAL_INPUT_CLS` used on `<Input>` components

**Tests**

- [ ] New code has accompanying `.test.ts` file
- [ ] Tests cover happy path + error states + edge cases
- [ ] No tests that only verify mock behavior
