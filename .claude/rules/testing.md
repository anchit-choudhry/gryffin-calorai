---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
---

# Testing Rules

- Framework: Vitest 4 + `@testing-library/react` + jsdom + `fake-indexeddb/auto`
- TDD: write a failing test first; confirm the failure reason before implementing
- Coverage targets: statements 90%, functions 90%, branches 80%, lines 90%
- Place test files alongside source: `Foo.tsx` -> `Foo.test.tsx`

## motion/react mock pattern

When a component uses `motion.X` (e.g. `motion.header`), add that element to the vi.mock.
Existing mocks only cover `motion.main`, `motion.section`, etc. - extend as needed:

```typescript
vi.mock("motion/react", () => ({
  motion: {
    main: ({children}: { children: React.ReactNode }) => <main>{children} < /main>,
    section: ({children}: { children: React.ReactNode }) => <section>{children} < /section>,
    // add motion.header, motion.div, etc. here if the component uses them
  },
  AnimatePresence: ({children}: { children: React.ReactNode }) => <>{children} < />,
}));
```

## shadcn Form mock pattern

Required when a component renders `FormField`/`Form` and the hook is mocked with `control: {}`:

```typescript
vi.mock("@/components/ui/form", () => ({
  Form: ({children}: { children: React.ReactNode }) => <>{children} < />,
  FormField: ({render}: { render: (p: { field: Record<string, unknown> }) => React.ReactNode }) =>
    render({field: {value: "", onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn()}}),
  FormItem: ({children}: { children: React.ReactNode }) => <>{children} < />,
  FormLabel: ({children}: { children: React.ReactNode }) => <label>{children} < /label>,
  FormControl: ({children}: { children: React.ReactNode }) => <>{children} < />,
  FormMessage: () => null,
}));
```

## Radix UI jsdom limitation

`fireEvent.click` does NOT trigger `onValueChange` for Radix Tabs/Select in jsdom.
Remove or rewrite tests that rely on Radix UI state changes triggered by click events.

## vi.hoisted() for per-test-controllable mocks

Use `vi.hoisted()` when a mock variable must be both accessible inside `vi.mock()` factory
functions AND reassignable per-test via `mockImplementation` / `mockReturnValue`:

```typescript
const mockWatch = vi.hoisted(() =>
  vi.fn((field: string): string | string[] => (field === "preset" ? "generic" : [])),
);

vi.mock("../hooks/useFoo", () => ({
  useFoo: () => ({watch: mockWatch}),
}));

beforeEach(() => {
  mockWatch.mockImplementation((field: string): string | string[] =>
    field === "preset" ? "generic" : [],
  );
});
```

Always annotate the return type explicitly (e.g. `: string | string[]`) to prevent TypeScript
from narrowing the inferred type to `never[]` or a union that is too narrow for
`mockImplementation` to accept.

## Mock functions with static properties

When a global constructor (e.g. `Notification`) needs both call tracking and a static property
(e.g. `.permission`), use `Object.assign` instead of direct property assignment:

```typescript
// Wrong - TypeScript error: property does not exist on Mock<Procedure>
const MockNotification = vi.fn();
MockNotification.permission = "granted";

// Correct
const MockNotification = Object.assign(vi.fn(), {permission: "granted"});
vi.stubGlobal("Notification", MockNotification);
```

## Prefer toStrictEqual over toEqual

`toEqual` is banned by ESLint (`vitest/prefer-strict-equal` is set to `"error"`). Always use
`toStrictEqual` for deep equality checks on objects and arrays.

## Dexie / fake-indexeddb

`fake-indexeddb/auto` is registered globally in `vitest.config.ts` via `setupFiles` - do NOT
import it manually in individual test files. Dexie tables are available out-of-the-box in all
tests. Reset between tests by calling `dbService` delete helpers or by re-initialising the
relevant state.

## App routes (hash-based)

The app uses `window.location.hash` routing with no router library. The four pages are:

| Hash          | Page      |
|---------------|-----------|
| `/#/`         | Dashboard |
| `/#/recipes`  | Recipes   |
| `/#/progress` | Progress  |
| `/#/settings` | Settings  |

Dev server: `pnpm dev` starts at `http://localhost:5173`.
