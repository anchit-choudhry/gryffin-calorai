---
name: release-notes
description: Generate or update a release notes file for Gryffin Calorai following the established format. Pass the version number as the argument (e.g. "0.9.0"). Reads git history and ROADMAP.md to populate content.
disable-model-invocation: true
---

# Release Notes Generator

You are generating or updating a release notes file for Gryffin Calorai.

The argument is the version number (e.g. `0.9.0`). If no argument was given, ask: "Which version are
you documenting?"

---

## Step 1 - Gather context

Run these in parallel to understand what shipped:

```bash
# Commits since the previous version tag (or last N commits if no tag)
git log --oneline --no-merges -50

# Files changed since last tag
git diff --stat HEAD~20

# Current ROADMAP.md for feature list
cat ROADMAP.md | head -100
```

Also read:

- `release-notes/<previous-version>.md` to understand the format in depth
- `CLAUDE.md` for current DB schema version and stack versions
- `TODO.md` for features marked done this cycle

---

## Step 2 - Determine file path and status

- File: `release-notes/<version>.md`
- If the file already exists, read it and extend it - do not overwrite existing content
- Status line options: `In Progress`, `Major Release`, `Minor Release`, `Patch Release`

---

## Step 3 - Write the release notes

Use this exact structure:

```markdown
# v<version> Release Notes

**Release Date:** <Month DD, YYYY or "Q? YYYY (planned)">
**Database Schema:** v<N> (frontend IndexedDB) + v<M> (backend PostgreSQL via Flyway)
**Status:** <In Progress | Major Release | Minor Release | Patch Release>

---

## Overview

<2-4 sentences describing the main themes of this release. Name the milestone codes (e.g. B5, M1) if
applicable.>

---

## <Feature Group Name> (<Milestone Code if applicable>)

### Backend - <Complete | In Progress | Planned> (<Month DD, YYYY>)

**<Subsystem name (e.g. Flyway migration `V5__...`)>**

- <bullet describing the change>
- <bullet describing the change>

**<Next subsystem>**

- <bullet>

### Frontend - <Complete | In Progress | Planned> (<Month DD, YYYY>)

**`<key file path>`**

- <bullet>
- <bullet>

---

## Bug Fixes

- <bullet per fix, format: `Component: description of fix`>

---

## Breaking Changes

- <bullet per breaking change, or omit section if none>

---

## Technical Debt / Cleanup

- <bullet per cleanup item, or omit section if none>

---

## Test Coverage

- <N> test files, <N> tests total
- Coverage: lines <N>%, functions <N>%, branches <N>%

---

## Upgrade Notes

<Any steps a developer needs to take when pulling this version. Include DB migration steps, env var
changes, etc. Omit section if none.>
```

---

## Formatting rules (must follow exactly)

- No en-dashes or em-dashes - use regular dash `-`
- No PII (email, phone, address)
- Dates: `Month DD, YYYY` (e.g. `May 26, 2026`) or `Q? YYYY` for planned
- DB schema line always has both frontend (IndexedDB v) and backend (Flyway migration v)
- Milestone codes (B1-B5, M0-M2, W1-W3, F14, etc.) appear in headers when applicable
- File paths in backticks: `` `apps/web/src/lib/apiClient.ts` ``
- Backend Flyway migration names in backticks: `` `V5__feature_name.sql` ``
- Status fields are exactly one of: `In Progress`, `Major Release`, `Minor Release`, `Patch Release`
- Feature sub-sections use `### Backend` / `### Frontend` when both are present

---

## Step 4 - Update ROADMAP.md

Add or update the entry for this version in `ROADMAP.md` under `## Release Overview`. Use a one-line
summary: `**v<version>** - <theme>`.

---

## Step 5 - Confirm

Tell the user:

- File written to `release-notes/<version>.md`
- Whether ROADMAP.md was updated
- Any sections left as placeholder because the work is still in progress
- Whether the version should be referenced in CLAUDE.md "Last Updated" line
