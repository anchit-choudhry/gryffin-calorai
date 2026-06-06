# Webapp Testing Skill

> Full test generation methodology: `.claude/skills/generate-vitest/SKILL.md`
> Project testing rules: `.claude/rules/testing.md`

Apply the Vitest + jsdom testing approach documented in those files when writing or reviewing tests
for this app.

## Project dev server

```bash
pnpm dev   # starts on http://localhost:5173
```

The app uses hash-based routing: `/#/` (Dashboard), `/#/recipes`, `/#/progress`, `/#/settings`.
