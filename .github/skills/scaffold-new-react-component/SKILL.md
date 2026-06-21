# Scaffold New React Component Skill

> Full scaffold instructions: `.claude/skills/scaffold-new-react-component/SKILL.md`
> React standards: `.claude/skills/reactjs-standards/SKILL.md`
> UX and design system: `.claude/rules/ux-principles.md`

Follow the scaffold process documented in those files to generate a new component and its paired
test file.

## Placement

- Standalone component: `apps/web/src/components/<Name>.tsx`
- Page-scoped component: `apps/web/src/components/<page>/<Name>.tsx`

## Required conventions

- Named export only; never `export default`
- Props typed with a local `interface <Name>Props`; never inline object type
- `type FC` import from `"react"`; never `import React`
- `cn()` from `@/lib/utils` for conditional classes; `EDITORIAL_INPUT_CLS` on all `<Input>`
- Zustand selectors via `useAppState` from `../state/AppState`; no local state except forms
- Paired test file: `<Name>.test.tsx` alongside the component

## Quick commands

```bash
pnpm test --watch   # run tests in watch mode while building
pnpm lint:fix       # run after generating to auto-fix style issues
```
