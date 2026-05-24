---
paths:
  - "src/**/*.tsx"
  - "src/**/*.jsx"
---

# Frontend Rules

- Use `EDITORIAL_INPUT_CLS` from `src/lib/utils.ts` on all `<Input>` components for consistent
  styling
- Components that are product tour spotlight targets must carry a `data-tour-id="..."` attribute
  (e.g. `data-tour-id="dashboard-activity"`); match step IDs in `src/components/tour/tourSteps.ts`
- Shared animation variants live in `src/lib/motionVariants.ts`; do not create one-off variants
  inline
- When adding a new `motion.X` element to a component, extend the `motion/react` vi.mock in its
  `.test.tsx` file accordingly (see `.claude/rules/testing.md` for the mock pattern)
