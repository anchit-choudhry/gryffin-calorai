---
applyTo: "**/*.{tsx,jsx,html,css}"
---

# HTML/CSS Instructions

> Full HTML/CSS style rules: `.claude/rules/html-css.md`

Apply the Google HTML/CSS Style Guide rules documented in that file to all UI files.

Key rules:

- **Tailwind only** - no inline styles, no CSS modules, no `style=` attributes
- **Semantic HTML**: use `<main>`, `<nav>`, `<section>`, `<article>`, `<header>`, `<footer>`,
  `<aside>` over generic `<div>` wherever the element has semantic meaning
- **`type="button"`** on every `<button>` that does not submit a form; the default is
  `"submit"` which causes accidental form submissions
- **All images need `alt` text**; icon-only buttons need `aria-label` or `<span class="sr-only">`
- **`cn()` utility** from `src/lib/utils.ts` for all conditional Tailwind class composition
- **Mobile-first**: start with base (mobile) styles; use `md:`, `lg:` breakpoints to expand
- **`pointer: coarse` detection** for touch-friendly variants; 44px minimum touch targets
