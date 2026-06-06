---
name: dexie-migration
description: Safely bump the Dexie IndexedDB schema version in apps/web/src/db/dbService.ts. Guides through adding tables/columns, upgrade callbacks, TypeScript interfaces, and table exports.
disable-model-invocation: true
---

# Dexie Schema Migration

You are performing a Dexie IndexedDB schema migration for Gryffin Calorai.

**STOP before starting:** confirm the user knows that IndexedDB migrations are irreversible in
production. Once a version ships, that version number can never be reused.

## Step 1 - Gather requirements

Ask the user:

1. What is being added? (new table / new column on existing table / new index)
2. Does the change require an upgrade callback? (yes if existing rows need backfilling)
3. What TypeScript interface change is needed? (new field, new table type)

## Step 2 - Determine new version number

Read `apps/web/src/db/dbService.ts` and find the highest `db.version(N)` call. The new version is
N+1.

Current schema is v19 (B4 Cloud Sync baseline). Update the `DB_SCHEMA_VERSION` constant if one
exists; otherwise track manually.

## Step 3 - Copy the full stores schema

**CRITICAL:** Dexie requires EVERY table to be listed in EVERY `db.version().stores({})` call, even
if unchanged. Omitting a table from a version block drops it.

Copy the full stores object from the previous version block and add your changes on top.

**Schema syntax reminders:**

- `++id` = auto-increment integer PK
- `&field` = unique index
- `[a+b]` = compound index (required for `userId+dateLogged` query pattern)
- Listing a field adds an index; omitting it still stores the field, just unindexed
- Only index fields you will actually query by

## Step 4 - Write the version block

**Without upgrade callback (new table, or new indexed column with acceptable null default):**

```typescript
// 20. Version 20: <brief description>
db.version(20).stores({
  // ... full schema identical to v19, with your additions
  newTable: "++id, userId, createdAt",
});
```

**With upgrade callback (backfilling existing rows):**

```typescript
// 20. Version 20: add <field> to <table>
db.version(20)
.stores({
  // ... full schema
})
.upgrade((tx) => {
  return tx
  .table("<tableName>")
  .toCollection()
  .modify((record) => {
    if (record.<field> === undefined) record.<field> = <defaultValue>;
  });
});
```

Place the new block immediately after the last `db.version()` block, before the
`// Define table references AFTER schema is set` comment.

## Step 5 - Update TypeScript interfaces

In `dbService.ts`, find the TypeScript interface or type for the affected table and add the new
field:

```typescript
export interface

<TableName>{
  // existing fields...
  newField? : string; // optional until backfill completes, then required
}
```

If adding a new table, define its full interface above the `db.version()` calls.

## Step 6 - Add table export (new tables only)

After the existing table export block:

```typescript
export const <
newTable >
:
Table < <NewTableType> > = db.table("<newTable>");
```

## Step 7 - Update CLAUDE.md

In `CLAUDE.md`, find the line:

```
**DB:** Dexie.js tables with compound indices; currently at **schema version 19**
```

Update the version number to match.

Also update the `DB` row in the Critical File Locations table if a new table was added.

## Step 8 - Run tests

```bash
cd apps/web
pnpm test
```

All 1796+ existing tests must still pass. If fake-indexeddb throws a version error in tests, check
that `vitest.setup.ts` resets the DB correctly between tests.

## Step 9 - Confirm summary

Tell the user:

- New version number applied
- Tables/fields changed
- Whether an upgrade callback was needed
- TypeScript interfaces updated
- Whether CLAUDE.md was updated
