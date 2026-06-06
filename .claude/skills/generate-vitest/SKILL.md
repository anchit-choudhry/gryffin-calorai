---
name: generate-vitest
description: Generate a Vitest test file for an existing component or hook in apps/web/src/. Pass the file path or component name as the argument. Reads the source file first to produce meaningful mocks and assertions.
disable-model-invocation: true
---

# Generate Test File

You are generating a test file for an existing source file in Gryffin Calorai.

The argument is a file path relative to `apps/web/src/` (e.g. `components/FoodLogger.tsx`) or just a
name (e.g. `FoodLogger`). Resolve the full path before proceeding.

If no argument was given, ask: "Which component or hook should I write tests for?"

## Step 1 - Read the source file

Read the full source file. Identify:

- **Props interface** - what props does the component accept?
- **Zustand selectors** - what does `useAppState()` destructure?
- **External hooks used** - e.g. `useFoodForm`, `useWaterForm`, custom hooks
- **shadcn/ui or Radix primitives used** - Dialog, Tooltip, Tabs, etc. (need portal mocks)
- **Async operations** - toast calls, Dexie queries, API calls
- **User interactions** - button clicks, form submits, input changes
- **Conditional renders** - loading states, empty states, error states

## Step 2 - Determine test file path

Component `apps/web/src/components/Foo.tsx` -> test at `apps/web/src/components/Foo.test.tsx`
Hook `apps/web/src/hooks/useFoo.ts` -> test at `apps/web/src/hooks/useFoo.test.ts`

Check if the test file already exists. If it does, read it and ask the user whether to extend it or
rewrite it.

## Step 3 - Generate the test file

### For components

```tsx
import {beforeEach, describe, expect, it, vi} from "vitest";
import {act, fireEvent, render, screen} from "@testing-library/react";
import ComponentName from "./ComponentName";
import * as appState from "../state/AppState";
// Import branded types used in mock data
import {UserId, FoodItemId, ISODate} from "@/types";
// Import sonner if component uses toast
import {toast} from "sonner";

// Mock sonner if used
vi.mock("sonner");

// Mock Zustand store
vi.mock("../state/AppState");
const mockUseAppState = vi.mocked(appState.useAppState);

// Mock custom hooks the component uses
const mockSubmit = vi.hoisted(() => vi.fn().mockResolvedValue(true));
vi.mock("../hooks/useXxxForm", () => ({
  useXxxForm: () => ({
    form: {register: vi.fn().mockReturnValue({}), getValues: vi.fn()},
    isLoading: false,
    submitXxx: mockSubmit,
  }),
}));

// Mock shadcn/ui primitives that use Radix portals
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({children, open}: { children: React.ReactNode; open?: boolean }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({children}: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({children}: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({children}: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Typed mock state - fill in fields the component actually reads
const defaultState = {
  // e.g. dailyFoodItems: [],
  // e.g. addFoodItem: vi.fn(),
} as unknown as ReturnType<typeof appState.useAppState>;

describe("ComponentName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppState.mockReturnValue(defaultState);
  });

  it("renders without crashing", () => {
    render(<ComponentName/>);
    // Assert key elements are present
  });

  // Add a test per conditional render path:
  it("shows empty state when no items", () => {
  });

  // Add a test per user interaction:
  it("calls addXxx when form is submitted", async () => {
    render(<ComponentName/>);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", {name: /submit/i}));
    });
    expect(mockSubmit).toHaveBeenCalledOnce();
  });
});
```

### For hooks

```ts
import {beforeEach, describe, expect, it, vi} from "vitest";
import {act, renderHook} from "@testing-library/react";
import {useHookName} from "./useHookName";
import * as appState from "../state/AppState";

vi.mock("../state/AppState");
const mockUseAppState = vi.mocked(appState.useAppState);

describe("useHookName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppState.mockReturnValue({
      // fill in what the hook reads
    } as ReturnType<typeof appState.useAppState>);
  });

  it("returns expected initial state", () => {
    const {result} = renderHook(() => useHookName());
    expect(result.current.someField).toBeDefined();
  });
});
```

## Step 4 - Coverage rules to follow

- > 80% coverage target per CLAUDE.md (vitest.config.ts enforces 90% thresholds)
- Cover every conditional render branch (empty state, loading state, error state, filled state)
- Cover every user-facing interaction (button clicks, form submits, input changes)
- Cover async paths with `await act(async () => { ... })`
- Test method names: camelCase only, no underscores
- Use `describe` > `it` structure; no top-level `it` calls

## Step 5 - Run the tests

```bash
cd apps/web
pnpm test -- <TestFileName>
```

Verify all new tests pass. Fix any failures before reporting done.

## Step 6 - Report

Tell the user:

- Test file path written
- How many test cases were added
- Which branches/interactions are covered
- Whether any scenarios require the user's domain knowledge to complete (mark those with `// TODO:`)
