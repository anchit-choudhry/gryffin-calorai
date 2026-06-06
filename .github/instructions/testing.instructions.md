---
applyTo: "**/*.test.{ts,tsx}"
---

# Testing Instructions

> Full test generation methodology: `.claude/skills/generate-vitest/SKILL.md`
> Project testing rules: `.claude/rules/testing.md`

Follow the Red-Green-Refactor cycle strictly as documented in those files. Never write production
code before a failing test.

Key rules:

- Write one failing test first; confirm it fails for the right reason before implementing
- Write the minimum code to make the test pass - no more
- Use Vitest 4 + jsdom + fake-indexeddb (this project's test stack)
- Coverage targets: >80% branches, statements, functions, lines for state/db/components
- Mock `motion/react` in component tests; mock `@/components/ui/form` when using `control: {}`
- Never test mock behavior - test real behavior
