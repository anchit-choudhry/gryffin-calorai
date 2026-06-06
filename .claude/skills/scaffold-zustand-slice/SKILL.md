---
name: scaffold-zustand-slice
description: Scaffold a new Zustand store slice in apps/web/src/state/slices/ and wire it into AppState.ts. Pass the slice domain name as the argument (e.g. "notifications"). Follows the existing 8-slice composition pattern exactly.
disable-model-invocation: true
---

# New Zustand Slice Scaffold

You are adding a new Zustand slice to Gryffin Calorai's composed store.

The argument is the domain name in camelCase (e.g. `notifications` -> slice file
`notificationsSlice.ts`, type `NotificationsSlice`, creator `createNotificationsSlice`).

If no argument was given, ask: "What domain should the new slice cover (e.g. 'notifications', '
achievements')?"

---

## Step 1 - Read AppState.ts first

Read `apps/web/src/state/AppState.ts` to understand current slice composition before making any
changes. There are currently 8 slices: `CoreSlice`, `FoodSlice`, `RecipeSlice`, `TrackerSlice`,
`BodySlice`, `ActivitySlice`, `SettingsSlice`, `SyncSlice`.

---

## Step 2 - Create the slice file

Output: `apps/web/src/state/slices/<domain>Slice.ts`

```ts
import type {StateCreator} from "zustand";
import type {AppState} from "../AppState";

export interface

<Domain>Slice
{
  // State fields - name them after the domain, not generic names
  <domain>Items
:
  <ItemType>[];
  <domain>IsLoading
:
  boolean;
  <domain>Error
:
  string | null;

  // Actions - verb + domain noun
  set < Domain > Items
:
  (items: <ItemType>[]) => void;
  add < Domain > Item
:
  (item: <ItemType>) => Promise<void>;
  delete <Domain>Item
:
  (id: <ItemType>Id) => Promise<void>;
  clear < Domain > Error
:
  () => void;
}

export const create
<Domain>Slice
:
StateCreator < AppState, [], [], <Domain>Slice > = (set, get) => ({
  < domain > Items
:
[],
  <domain>IsLoading
:
false,
  <domain>Error
:
null,

set < Domain > Items
:
(items) => set({ < domain > Items
:
items
}),

add < Domain > Item
:
async (item) => {
  set({ < domain > IsLoading
:
  true, <domain>Error
:
  null
})
  ;
  try {
    // await dbService.<domain>Operation(item);
    set((state) => ({
      < domain > Items
  :
    [...state. < domain > Items, item],
      <domain>IsLoading
  :
    false,
  }))
    ;
  } catch {
    set({ < domain > Error
  :
    "Failed to add <domain> item.", <domain>IsLoading
  :
    false
  })
    ;
  }
},

  delete <Domain>Item
:
async (id) => {
  set({ < domain > IsLoading
:
  true, <domain>Error
:
  null
})
  ;
  try {
    // await dbService.delete<Domain>(id);
    set((state) => ({
      < domain > Items
  :
    state. < domain > Items.filter((x) => x.id !== id),
      <domain>IsLoading
  :
    false,
  }))
    ;
  } catch {
    set({ < domain > Error
  :
    "Failed to delete <domain> item.", <domain>IsLoading
  :
    false
  })
    ;
  }
},

clear < Domain > Error
:
() => set({ < domain > Error
:
null
}),
})
;
```

**Rules:**

- Use `StateCreator<AppState, [], [], <Domain>Slice>` - always typed against the full `AppState`,
  not the slice alone
- Loading and error fields must be namespaced (e.g. `notificationsIsLoading` not `isLoading`) to
  avoid collisions across slices
- Async actions: set `isLoading: true` before await, always catch and set an error string, always
  reset `isLoading` in both branches
- Never use `get()` inside a `set()` call - use the `set((state) => ...)` updater form instead

---

## Step 3 - Wire into AppState.ts

Make two changes to `apps/web/src/state/AppState.ts`:

**Add to the imports block (maintain alphabetical order by domain):**

```ts
import {create

<Domain>Slice, type < Domain > Slice
}
from
"./slices/<domain>Slice";
```

**Extend the `AppState` type intersection:**

```ts
export type AppState = CoreSlice &
  FoodSlice &
  // ... existing slices ...
  <Domain>Slice;   // add here in alphabetical position
```

**Spread in the `create<AppState>` call:**

```ts
export const useAppState = create<AppState>((...a) => ({
  ...createCoreSlice(...a),
  // ... existing spread calls ...
  ...create < Domain > Slice(...a),   // add here in alphabetical position
}));
```

---

## Step 4 - Add initial data loading (if needed)

If the slice needs to hydrate from IndexedDB on login, check
`apps/web/src/state/slices/coreSlice.ts` for the `initializeUserData` action. Add loading your new
slice's data there alongside the existing loads.

---

## Step 5 - Run tests

```bash
cd apps/web
pnpm test
```

All existing 1796+ tests must still pass. If `AppState` type tests fail, the new slice's interface
likely has a name collision with an existing field.

---

## Step 6 - Report

Tell the user:

- Slice file created at `apps/web/src/state/slices/<domain>Slice.ts`
- AppState.ts updated (import, type, create call)
- Whether `initializeUserData` in `coreSlice.ts` needs updating
- Which `dbService.ts` functions are needed (and whether they need to be created)
- Whether a companion hook (`use<Domain>Form` or `use<Domain>Data`) should be scaffolded next via
  `/scaffold-new-react-hook`
