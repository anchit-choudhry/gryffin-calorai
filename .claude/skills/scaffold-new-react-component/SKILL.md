---
name: scaffold-new-react-component
description: Scaffold a new React component + paired test file following Gryffin Calorai conventions. Pass the PascalCase component name as the argument.
disable-model-invocation: true
---

# New Component Scaffold

You are scaffolding a new React component for Gryffin Calorai. The argument is the PascalCase
component name (e.g. `MealCard`).

If no argument was given, ask the user: "What is the PascalCase name for the new component?"

## Step 1 - Determine placement

Ask if unsure, otherwise infer:

- Business-logic components with their own test: `apps/web/src/components/<Name>.tsx`
- Sub-components scoped to a page: `apps/web/src/components/<page>/<Name>.tsx`

## Step 2 - Generate the component file

Use this exact structure. Adapt props and Zustand selectors to what the user describes.

```tsx
// apps/web/src/components/<Name>.tsx
import type {FC} from "react";
import {cn, EDITORIAL_INPUT_CLS, LABEL_MONO_CLS} from "@/lib/utils";
import {useAppState} from "../state/AppState";
// Add named lucide-react icon imports here, e.g.: import { Pencil } from "lucide-react";
// Add shadcn/ui imports here, e.g.: import { Button } from "@/components/ui/button";

interface

<Name>Props {
  // define props here; use branded types from @/types for IDs
  className ? : string;
}

  const <Name>: FC
    <
    <Name>Props> = ({className}) => {
      // Pull only what you need from the store:
      // const { foo, setFoo } = useAppState();

      return (
      <div className={cn("", className)}>
      {/* component markup */}
    </div>
    );
    };

    export default <Name>;
```

**Conventions to follow (non-negotiable):**

- Never `import React from "react"` - the automatic JSX transform makes it unnecessary
- Use `import type { FC }` for type-only imports
- All styling via Tailwind only - no inline styles or CSS modules
- Use `EDITORIAL_INPUT_CLS` from `@/lib/utils` on every `<Input>` element
- Use branded ID types from `@/types` (e.g. `FoodItemId`, `UserId`) - never raw `number`/`string`
  for IDs
- Heavy sub-components (e.g. BarcodeScanner) must be wrapped in `React.lazy` + `<Suspense>`
- Never add `eslint-disable`, `@ts-ignore`, or `@ts-expect-error`
- All state goes in Zustand - no local component state except form state

## Step 3 - Generate the test file

```tsx
// apps/web/src/components/<Name>.test.tsx
import {beforeEach, describe, expect, it, vi} from "vitest";
import {render, screen} from "@testing-library/react";
import

<Name> from "./<Name>";
  import * as appState from "../state/AppState";

  vi.mock("../state/AppState");

  const mockUseAppState = vi.mocked(appState.useAppState);

  describe("<Name>", () => {
    beforeEach(() => {
      mockUseAppState.mockReturnValue({
        // spread default mock state here
      } as ReturnType<typeof appState.useAppState>);
    });

    it("renders without crashing", () => {
    render(<<Name> />);
    // add assertions
  });
  });
```

**Test conventions:**

- Mock `useAppState` via `vi.mock("../state/AppState")`
- Mock shadcn/ui primitives inline if they use Radix portals (Dialog, Tooltip, etc.)
- Target >80% coverage per CLAUDE.md
- Use `describe` + `it` blocks; no underscores in test names (camelCase only)

## Step 4 - Confirm with user

After generating both files, tell the user:

- The two file paths created
- Any Zustand slice selectors they should wire up
- Whether they need a new hook (`use<Name>.ts`) for business logic

Do NOT create the hook file automatically - ask first.
