# Update Dependencies Skill

> Full skill instructions: `.claude/skills/update-dependencies/SKILL.md`

Apply the dependency update workflow documented in that file.

## Project package manager: pnpm

```bash
pnpm outdated          # check outdated packages
pnpm update --latest   # update all to latest (use carefully)
pnpm audit             # check for CVEs (fails on high/critical)
pnpm lint:fix          # run after updates before committing
pnpm test              # verify all tests still pass after updates
pnpm build             # verify production build succeeds
```

Key constraints:

- Vite 8 (Rolldown-based) - `manualChunks` must use function form, not object form
- Dexie 4 - schema version is currently v13; bumping Dexie major requires migration testing
- motion 12 (`motion/react` import) - not `framer-motion`
- zod imported via `zod/v3` (not bare `zod`) - check after any zod update
