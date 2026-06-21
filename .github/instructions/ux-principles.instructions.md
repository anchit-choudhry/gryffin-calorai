---
applyTo: "**/*.{tsx,jsx,html,css}"
---

# UX and Design System Instructions

> Full UX principles and design system rules: `.claude/rules/ux-principles.md`

Apply all design standards documented in that file to every UI file in this codebase.

Key areas covered in the source file:

- **OKLCH color only** - no HSL; tinted neutrals with chroma 0.005-0.015
- **All 8 interactive states** must be designed: default, hover, focus, active, disabled,
  loading, error, success
- **Reduced motion**: every animated component must respect `prefers-reduced-motion` via
  `useMotionPreset()` from `src/lib/a11y.ts`
- **Touch targets**: 44px minimum; use `pointer: coarse` detection for coarse-pointer variants
- **Destructive actions**: undo-toast pattern only - never confirmation dialogs
- **Brand identity**: Almanac / Field Journal aesthetic - squared corners, hairline rules,
  serif display (Spectral), mono labels (JetBrains Mono), persimmon accent; never rounded-card
  generic health-tech
- **Typography classes**: `EDITORIAL_INPUT_CLS` for inputs, `SERIF_TITLE_CLS` for section
  headings (both from `src/lib/utils.ts`)
- **Motion**: shared variants in `src/lib/motionVariants.ts`; `counterPopVariants`,
  `useSectionMotion()`, `easeSpring`
