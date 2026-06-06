---
applyTo: "src/**/*.{tsx,jsx}"
---

# Frontend Instructions

> Full React standards: `.claude/skills/reactjs-standards/SKILL.md`
> Supporting references: `.claude/skills/reactjs-standards/references/`

Apply all React 19 patterns, hooks conventions, component architecture rules, and the project's
editorial design system documented in those files to every `.tsx` file in this codebase.

Key areas covered in the source files:

- React 19 features (Server Components, `useActionState`, `use()`, asset loading)
- Hooks patterns and custom hook design
- Performance optimization (memoization, code splitting, Suspense)
- State management with Zustand
- Design system: oklch color palette, @fontsource-variable typography, editorial layout
- Motion animations via `motion/react`; shared variants in `src/lib/motionVariants.ts`
