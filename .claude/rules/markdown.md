# Markdown Style Rules

Source: Google Markdown Style Guide (google.github.io/styleguide/docguide/style.html).
Applied to all `.md` files in this project.

---

## Document Layout

Every document follows this structure:

```markdown
# Document Title

Short introduction (1-3 sentences).

## First Topic

Content.

## See also

- https://link-to-more-info
```

Rules:

- One `# H1` only - the document title; matches or approximates the filename
- 1-3 sentence intro immediately after the title
- All subsequent headings start at `##`
- Put miscellaneous links in a `## See also` section at the bottom

**`[TOC]` directive:** Do not use in this project. GitHub renders its own collapsible
table of contents in the sidebar automatically. The `[TOC]` directive only works on
platforms like Gitiles and produces nothing on GitHub.

---

## Headings

**Use ATX-style only** (`#` prefix). Never use `===` or `---` as heading underlines:

```markdown
# Good heading

Bad heading      <- DO NOT DO THIS
-----------
```

Note: a standalone `---` line (no text above it) is a **thematic break** (horizontal
rule), not a heading underline - that is valid and used throughout this project as a
visual section separator.

**Add a blank line before and after every heading**, and a space after `#`:

```markdown
...previous text.

## My Heading

Next text...
```

**Use unique, fully descriptive heading names** - even subsections. Anchor links are
auto-generated from heading text, so vague names (`### Summary`, `### Example`) produce
ambiguous anchors. Prefer:

```markdown
## Foo

### Foo summary

### Foo example
```

**Single H1 per document.** All subsequent headings are H2 or deeper.

**Capitalization:** Sentence case for headings (capitalize first word and proper nouns only).
Preserve original capitalization for product/tool names (e.g. `React`, `TypeScript`, `Dexie.js`).

---

## Character Line Limit

Wrap prose at **80 characters**.

Exceptions (allowed to exceed 80 chars):

- URLs and Markdown links (the link portion only - wrap surrounding text normally)
- Table rows
- Headings
- Code blocks

---

## Trailing Whitespace

**Never** leave trailing whitespace. Do not use two trailing spaces for line breaks.
Use a trailing backslash (`\`) sparingly when a hard line break is truly needed:

```markdown
First line.\
Second line on a new line.
```

Prefer two newlines (a paragraph break) over any forced line break.

---

## Lists

**Numbered lists - use lazy numbering for long or frequently-changing lists:**

```markdown
1. First item.
1. Second item.
1. Third item.
```

For short, stable lists, use sequential numbers (easier to read in source):

```markdown
1. First item.
2. Second item.
3. Third item.
```

**Nested list indentation - 4 spaces for all list types:**

```markdown
1. Top-level item. (2 spaces after number = 4 chars total before text)
   Wrapped continuation uses 4-space indent.
2. Next item.

- Bullet item. (3 spaces after bullet = 4 chars total before text)
  Wrapped continuation uses 4-space indent.
  1. Nested numbered item.
     Wrapped text inside nested list uses 8-space indent.
```

For small, non-nested, single-line lists, one space after the marker is fine:

```markdown
- Foo
- Bar
- Baz
```

---

## Code

**Inline code** - backticks for: commands, field names, file types, short code snippets:

```markdown
Run `pnpm test` before committing.
Update your `README.md`.
Pay attention to the `userId` field.
```

**Use backtick spans to escape** paths or URLs that should not be auto-linked:

```markdown
An example path: `apps/web/src/state/AppState.ts`
```

**Fenced code blocks** for anything longer than one line. Always declare the language:

```typescript
const userId = useAppState((s) => s.userId);
```

Never use 4-space-indented code blocks - they are ambiguous and unsearchable.

**Escape newlines** in shell commands intended for copy-paste:

```shell
pnpm test --reporter=verbose \
  --coverage
```

**Nest code blocks inside lists** with proper indentation so the list is not broken:

```markdown
- Step one.

    ```bash
    pnpm install
    ```

- Step two.
```

---

## Links

**Use explicit paths** for internal Markdown links; omit the full qualified URL:

```markdown
See [architecture](docs/specifications/architecture.md).
```

**Avoid `../` relative paths** - use root-relative paths instead:

```markdown
[AppState](apps/web/src/state/AppState.ts)
```

**Use informative link titles.** Never use "here", "link", or a bare URL as title text:

```markdown
# Bad

See the docs [here](ROADMAP.md).

# Good

See the [roadmap](ROADMAP.md) for planned work.
```

**Reference links** for long URLs or repeated links - improves source readability and
keeps table cells short:

```markdown
See the [sync architecture][sync-doc] for details.

[sync-doc]: docs/specifications/architecture.md#cloud-sync
```

Place reference link definitions just before the next heading (end of the section where
they are first used). If a reference is used across multiple sections, define it at the
bottom of the document.

---

## Images

Use images sparingly. Prefer plain text. When an image is necessary:

- Use it when showing a UI is clearer than describing it.
- Always provide descriptive alt text: `![Alt text describing the image](path/to/img.png)`

---

## Tables

Use tables only for **tabular data** with uniform distribution across two dimensions and
multiple parallel items with distinct attributes.

Prefer a list + subheadings when:

- Some columns are empty in many rows.
- The row/column ratio is unbalanced.
- Cells contain rambling prose.

Use **reference links in table cells** to keep line lengths manageable:

```markdown
| Transport | Favored by | Advantages               |
| --------- | ---------- | ------------------------ |
| Swallow   | Coconuts   | [Fast when unladen][spd] |

[spd]: path/to/airspeed-docs.md
```

---

## HTML

**Do not use HTML in Markdown files.** Every HTML element reduces readability and
portability. Standard Markdown syntax covers almost all cases.

If something feels impossible in Markdown, reconsider whether it is actually needed.

---

## Project-Specific Overrides

These rules take precedence over the Google style guide:

- **No en-dashes or em-dashes** (`-` only; never `--` typographic dash).
- **No PII** in any file (no email addresses, phone numbers, addresses).
- **`Last Updated` footer** format: `**Last Updated:** Month DD, YYYY | **Current
  release:** vX.Y.Z | **In progress:** description`

**YAML frontmatter** (`.claude/` skill and agent files only): files may open with a
`---` frontmatter block before the first heading. This is not standard Markdown prose
but is required by the Claude Code skill/agent format:

```markdown
---
name: my-skill
description: What it does.
disable-model-invocation: true
---

# Skill Title
```

**`@@` cross-reference syntax** (AI-facing docs only - CLAUDE.md, AGENTS.md, skill
files): use `@@path/to/file.md` to tell Claude Code to load a file into context. This
is a Claude Code `@file` shorthand, not standard Markdown. Only use it in documents
that AI agents read, never in user-facing docs like README.md or release notes:

```markdown
For architecture details, see @@docs/specifications/architecture.md
```

---

**Last Updated:** June 6, 2026 | **Source:** Google Markdown Style Guide
