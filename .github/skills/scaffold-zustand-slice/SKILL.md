# Scaffold Zustand Slice Skill

> Full scaffold instructions: `.claude/skills/scaffold-zustand-slice/SKILL.md`

Follow the scaffold process documented in that file to add a new Zustand slice and wire it into
`AppState.ts`.

## Store architecture

- Store file: `apps/web/src/state/AppState.ts` (composed from 9 slices)
- Slices directory: `apps/web/src/state/slices/`
- Naming: `<domain>Slice.ts`, type `<Domain>Slice`, creator `create<Domain>Slice`

## Steps (summary)

1. Read `AppState.ts` first to understand the composition pattern before writing anything
2. Create `apps/web/src/state/slices/<domain>Slice.ts` following the existing slice structure
3. Add the slice type to the `AppState` intersection type in `AppState.ts`
4. Spread the creator into the `create(...)` call in `AppState.ts`
5. Add a paired test: `apps/web/src/state/slices/<domain>Slice.test.ts`

## Key constraints

- All async operations must have corresponding `loading` and `error` fields in the slice state
- Persisted fields use `localStorage` keys prefixed `gc_` (see existing slices for examples)
- Never add a 10th slice without first confirming with the user that a new slice is needed
  (consider extending an existing slice instead)
