---
name: update-session-wiki
description: Run the session-end wiki update checklist from project-knowledge/AGENTS.md. Updates wiki pages, appends to log.md, creates a weekly summary if needed, and refreshes index.md.
disable-model-invocation: true
---

# Session Wiki Update

You are performing the session-end wiki update for Gryffin Calorai, following the checklist in
`project-knowledge/AGENTS.md`.

**Before starting:** Read `project-knowledge/AGENTS.md` and `project-knowledge/index.md` to confirm
current state.

---

## Checklist

Work through each step in order. Mark each complete before moving to the next.

### Step 1 - Identify what changed this session

Ask the user: "What did we work on this session?" if you don't have a clear picture from the
conversation context. Summarise:

- Features added or changed
- Bugs fixed
- Architecture decisions made
- CLAUDE.md changes (if any)
- New files created or deleted
- Test coverage changes

### Step 2 - Update affected wiki pages

Read each relevant wiki page in `project-knowledge/wiki/` and update it:

| If this changed...                        | Update this wiki page                      |
|-------------------------------------------|--------------------------------------------|
| Architecture, folder structure, DB schema | `systems.md`                               |
| A new architectural decision was made     | `decisions.md` - append with next D-number |
| A term was defined or renamed             | `glossary.md`                              |
| User preferences or conventions changed   | `memory.md`                                |
| A new feature shipped                     | `overview.md` (version, metrics)           |
| An incident or critical bug occurred      | `incidents.md`                             |

**Wiki page format rules (from AGENTS.md):**

- Every page needs YAML frontmatter: `title`, `summary`, `tags`, `updated`, `related`
- Use `updated: YYYY-MM-DD` with today's date
- Internal links use `[[page-name]]` (Obsidian-style, no .md extension)
- Repo file references use standard markdown: `[label](../../path/to/file.md)`
- Code locations use `file_path:line_number` format
- No en-dashes or em-dashes anywhere - use regular dash `-`
- No PII (email, phone, address, full name)

**Do NOT create a new page** for something that fits an existing one - update in place.

### Step 3 - Append to log.md

Read `project-knowledge/log.md` and append a new entry at the bottom using this format:

```markdown
## YYYY-MM-DD - <Session Title>

**Focus:** <one sentence describing the session's main theme>

**Completed:**

- <bullet per major task completed>

**Decisions:**

- <D-number if a new decision was recorded>: <brief description>

**Changed files:** <comma-separated list of key files touched>

**Tests:** <test count before> -> <test count after> (if changed)

**Next:** <what the user said comes next, or "TBD">
```

Today's date is available from the system context. Use ISO format: YYYY-MM-DD.

### Step 4 - Create weekly summary if needed

Check `project-knowledge/logs/` for a file named for the current ISO week (e.g. `2026-W23.md`).

To find the ISO week number:

```bash
python3 -c "import datetime; d = datetime.date.today(); print(f'{d.isocalendar()[0]}-W{d.isocalendar()[1]:02d}')"
```

If the file does not exist, create it:

```markdown
# Week YYYY-Www - <Theme Title>

**Sessions this week:** 1  
**Main themes:** <comma-separated>

## Session summaries

### YYYY-MM-DD

<3-5 sentence summary of this session>
```

If it does exist, append a new `### YYYY-MM-DD` section to it.

### Step 5 - Update index.md if new wiki pages were added

If a new `wiki/*.md` file was created this session, add a row to the correct table in
`project-knowledge/index.md`:

```markdown
| [[page-name]] | One-sentence summary | tag1, tag2 | YYYY-MM-DD |
```

### Step 6 - Summarise changes

Tell the user:

- Which wiki pages were updated and why
- Whether a new weekly log was created
- What was appended to log.md
- Any contradictions found between wiki pages and current code (flag these explicitly)

Do NOT suggest or create git commits. The user manages all commits.
