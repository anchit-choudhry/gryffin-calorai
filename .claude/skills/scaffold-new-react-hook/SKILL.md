---
name: scaffold-new-react-hook
description: Scaffold a new custom React hook in apps/web/src/hooks/ with a paired test file. Pass the hook name as the argument (e.g. "useActivitySummary"). Supports two patterns - form hooks and data hooks.
disable-model-invocation: true
---

# New Custom Hook Scaffold

You are scaffolding a new custom hook for Gryffin Calorai. The argument is the camelCase hook name
starting with `use` (e.g. `useActivitySummary`).

If no argument was given, ask: "What is the hook name (e.g. useActivitySummary)?"

## Step 1 - Identify the hook variant

Ask the user which pattern applies, or infer from the name:

| Variant       | Use when                                                                 | Examples                                               |
|---------------|--------------------------------------------------------------------------|--------------------------------------------------------|
| **Form hook** | The hook wraps a user-facing form with submission and validation         | `useWaterForm`, `useFoodForm`, `useBodyForm`           |
| **Data hook** | The hook reads from IndexedDB or Zustand and transforms data for display | `useWaterHistoryData`, `useProgressData`, `useStreaks` |

---

## Variant A: Form Hook

Output file: `apps/web/src/hooks/<hookName>.ts`

```ts
import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "sonner";
import {useAppState} from "../state/AppState";
import {type

<FormValues>, <Schema>
}
from
"../forms/schemas";

export function <hookName>(): {
  form: ReturnType<typeof useForm<<FormValues>>>;
  isLoading: boolean;
  submit<Entity>: () => Promise<boolean>;
} {
  const {
  <action>
}
  = useAppState();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm < <FormValues> > ({
    resolver: zodResolver(<Schema>),
    mode: "onBlur",
    defaultValues: { /* fill in */},
  });

  const submit
  <Entity> = (): Promise<boolean> =>
    new Promise((resolve) => {
      form.handleSubmit(
        async (data) => {
          setIsLoading(true);
          try {
            await <action>(data);
            toast.success("<Success message>");
            form.reset();
            resolve(true);
          } catch {
            toast.error("Failed to <action>. Please try again.");
            resolve(false);
          } finally {
            setIsLoading(false);
          }
        },
        () => resolve(false)
      )();
    });

  return {form, isLoading, submit<Entity>};
}
```

**Also add the Zod schema to `apps/web/src/forms/schemas.ts`:**

```ts
export const <
Name > Schema = z.object({
  // fields matching the form
});
export type
<Name>FormValues = z.infer < typeof <Name>Schema >;
```

---

## Variant B: Data Hook

Output file: `apps/web/src/hooks/<hookName>.ts`

```ts
import {useEffect, useState} from "react";
import {toast} from "sonner";
import {useAppState} from "../state/AppState";
import {

<dbQuery>
}
from
"../db/dbService";
import {todayISO} from "@/types";

export function <hookName>(

<params>
)
{
  const {userId} = useAppState();
  const [data, setData] = useState</* type */>(/* initial */);
  const [isLoading, setIsLoading] = useState(!userId);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    setIsLoading(true);
    <dbQuery>(userId)
    .then((rows) => {
      if (cancelled) return;
      // transform rows -> data
      setData(/* transformed */);
    })
    .catch(() => {
      if (!cancelled) toast.error("Failed to load <data>.");
    })
    .finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, /* other deps */]);

  return {data, isLoading};
}
```

**Key rules for data hooks:**

- Always guard on `userId` before querying - unauthed state returns early
- Always use a `cancelled` flag in `useEffect` to prevent state updates after unmount
- Always use `toast.error` in the catch block
- Query via indexed methods from `dbService.ts` - never `db.table().toArray()` (no full-table scans)

---

## Step 2 - Generate the test file

Output file: `apps/web/src/hooks/<hookName>.test.ts`

```ts
import {beforeEach, describe, expect, it, vi} from "vitest";
import {act, renderHook} from "@testing-library/react";
import {

<hookName>
}
from
"./<hookName>";
import * as appState from "../state/AppState";

vi.mock("../state/AppState");
vi.mock("sonner");

const mockUseAppState = vi.mocked(appState.useAppState);

// For form hooks: hoist the submit mock so it's available in vi.mock factories
// const mockAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

describe("<hookName>", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppState.mockReturnValue({
      userId: "user-1" as UserId,
      // fill in other fields the hook reads
    } as ReturnType<typeof appState.useAppState>);
  });

  it("returns initial state", () => {
    const {result} = renderHook(() => <hookName>());
    expect(result.current.isLoading).toBe(false);
    // assert other initial values
  });

  // For data hooks: test that useEffect fires correctly
  it("loads data on mount", async () => {
    await act(async () => {
      renderHook(() => <hookName>());
    });
    // assert data was set
  });
});
```

## Step 3 - Run the tests

```bash
cd apps/web
pnpm test -- <hookName>
```

All new tests must pass before reporting done.

## Step 4 - Report

Tell the user:

- Hook file path created
- Test file path created
- For form hooks: whether a new Zod schema was needed in `forms/schemas.ts`
- For data hooks: which `dbService.ts` query function was used and whether a new one is needed
