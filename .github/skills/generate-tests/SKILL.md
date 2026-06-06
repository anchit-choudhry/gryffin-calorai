# Generate Tests Skill

> Full test generation methodology: `.claude/skills/generate-vitest/SKILL.md`
> Project testing rules: `.claude/rules/testing.md`

Follow the Red-Green-Refactor cycle documented in those files.

## Project-specific test setup

- Framework: Vitest 4 + `@testing-library/react` + jsdom + fake-indexeddb
- Run tests: `pnpm test` (includes coverage) | `pnpm test --watch` | `pnpm test --ui`
- Coverage thresholds: statements 90%, functions 90%, branches 80%, lines 90%
- Place test files alongside source: `Foo.tsx` -> `Foo.test.tsx`

## Common mocks for this project

```typescript
// motion/react (extend as needed for motion.header, motion.div, etc.)
vi.mock("motion/react", () => ({
  motion: {
    main: ({children}) => <main>{children} < /main>, section: ... },
    AnimatePresence: ({children}) => <>{children} < />,
  }));

// shadcn Form (when hook has control: {})
vi.mock("@/components/ui/form", () => ({
  Form: ({children}) => <>{children} < />,
  FormField: ({render}) => render({
    field: {
      value: "",
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn()
    }
  }),
  FormItem: ({children}) => <>{children} < />,
  FormLabel: ({children}) => <label>{children} < /label>,
  FormControl: ({children}) => <>{children} < />,
  FormMessage: () => null,
}));

// Dexie (fake-indexeddb is auto-configured in vitest.config.ts)
import "fake-indexeddb/auto";
```
