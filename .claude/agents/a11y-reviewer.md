---
name: a11y-reviewer
description: Audit recently changed .tsx files for accessibility regressions.
  Checks reduced-motion compliance, touch target sizes, ARIA roles, focus
  management, and semantic HTML. Use after completing a UI feature.
---

# Accessibility Reviewer

Audit the files passed as input (or `git diff --name-only HEAD` if none
specified) for accessibility issues specific to this codebase.

## Checks

### 1. Reduced motion (critical)

Every `motion/react` animation must either:

- Call `useMotionPreset(name)` from `apps/web/src/lib/a11y.ts`, or
- Respect `prefers-reduced-motion` via the `motionVariants` in
  `apps/web/src/lib/motionVariants.ts`

Flag any `<motion.*>` element that sets `animate`, `initial`, or `transition`
props inline without going through `useMotionPreset` or a shared variant.

### 2. Touch targets (critical)

All interactive elements (`<button>`, `<a>`, role="button") must have a minimum
44x44px tap area. Look for:

- Missing `min-h-[44px] min-w-[44px]` or equivalent `p-*` padding that achieves
  it
- Icon-only buttons that are smaller than 44px without a transparent padding
  wrapper

### 3. ARIA and semantic HTML (high)

- Icon-only buttons must have `aria-label="..."` or a `.sr-only` `<span>`
- Live regions must use `liveRegionProps` or `assertiveRegionProps` from
  `apps/web/src/lib/a11y.ts` - flag any hand-rolled `aria-live` attributes
- Decorative SVGs must have `aria-hidden="true"`
- Interactive elements must not be `<div>` or `<span>` with click handlers -
  use semantic elements or add `role` + `tabIndex` + keyboard handlers

### 4. Focus management (high)

- Modals and sheets must trap focus while open and restore focus to the trigger
  on close
- Toast notifications (sonner) are exempt from focus trapping
- Check that `autoFocus` is not applied to elements that are always visible

### 5. Color contrast (informational)

Note any OKLCH tinted neutral (chroma 0.005-0.015) used for body text - these
need manual verification at >= 4.5:1 against the background. Flag the specific
classes used so the developer can verify.

## Output Format

Report findings as a table:

| File              | Line | Issue                                              | Severity |
|-------------------|------|----------------------------------------------------|----------|
| ComponentName.tsx | 42   | `<motion.div animate=...>` without useMotionPreset | critical |

Then a summary:

- Total issues: X (Y critical, Z high, W informational)
- Files checked: N
- Files with no issues: M

If no issues are found, say so explicitly.
