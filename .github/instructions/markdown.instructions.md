---
applyTo: "**/*.md"
---

# Markdown Instructions

> Full Markdown style rules: `.claude/rules/markdown.md`

Apply the Google Markdown Style Guide rules documented in that file to all `.md` files.

Key rules:

- **80-character line limit** for prose; URLs and table cells may exceed it
- **ATX headings only** (`#` prefix); never underline-style (`===`, `---`)
- **One `# H1`** per document (the title); all subsequent headings are `##` or deeper
- **Sentence case** for headings; preserve product name capitalization (React, TypeScript)
- **No HTML** in Markdown files
- **No en-dashes or em-dashes** - always use a plain dash (`-`)
- **No PII** in any file (no email addresses, phone numbers, addresses)
- **Fenced code blocks** with a declared language for all multi-line code; never 4-space indent
- **Informative link titles**: never "here", "link", or a bare URL as the title text
- **`Last Updated` footer** format: `**Last Updated:** Month DD, YYYY | **Current release:**
  vX.Y.Z | **In progress:** description`
