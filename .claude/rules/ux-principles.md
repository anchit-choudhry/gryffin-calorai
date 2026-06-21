---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.html"
  - "**/*.css"
---

# UX Principles

Applied to all UI files in this project.

---

# 1. Color & Contrast

## Color Spaces: Use OKLCH

**Stop using HSL.** Use OKLCH (or LCH) instead. It's perceptually uniform, meaning equal steps in
lightness *look* equal, unlike HSL where 50% lightness in yellow looks bright while 50% in blue
looks dark.

The OKLCH function takes three components: `oklch(lightness chroma hue)` where lightness is 0-100%,
chroma is roughly 0-0.4, and hue is 0-360. To build a primary color and its lighter / darker
variants, hold the chroma+hue roughly constant and vary the lightness, but **reduce chroma as you
approach white or black**, because high chroma at extreme lightness looks garish.

The hue you pick is a brand decision and should not come from a default. Do not reach for blue (hue

250) or warm orange (hue 60) by reflex; those are the dominant AI-design defaults, not the right
     answer for any specific brand.

## Building Functional Palettes

### Tinted Neutrals

**Pure gray is dead.** A neutral with zero chroma feels lifeless next to a colored brand. Add a tiny
chroma value (0.005-0.015) to all your neutrals, hued toward whatever your brand color is. The
chroma is small enough not to read as "tinted" consciously, but it creates subconscious cohesion
between brand color and UI surfaces.

The hue you tint toward should come from THIS project's brand, not from a "warm = friendly, cool =
tech" formula.

### Palette Structure

A complete system needs:

| Role         | Purpose                       | Example                   |
|--------------|-------------------------------|---------------------------|
| **Primary**  | Brand, CTAs, key actions      | 1 color, 3-5 shades       |
| **Neutral**  | Text, backgrounds, borders    | 9-11 shade scale          |
| **Semantic** | Success, error, warning, info | 4 colors, 2-3 shades each |
| **Surface**  | Cards, modals, overlays       | 2-3 elevation levels      |

**Skip secondary/tertiary unless you need them.** Most apps work fine with one accent color.

### The 60-30-10 Rule (Applied Correctly)

- **60%**: Neutral backgrounds, white space, base surfaces
- **30%**: Secondary colors: text, borders, inactive states
- **10%**: Accent: CTAs, highlights, focus states

The common mistake: using the accent color everywhere because it's "the brand color." Accent colors
work *because* they're rare. Overuse kills their power.

## Contrast & Accessibility

### WCAG Requirements

| Content Type                    | AA Minimum | AAA Target |
|---------------------------------|------------|------------|
| Body text                       | 4.5:1      | 7:1        |
| Large text (18px+ or 14px bold) | 3:1        | 4.5:1      |
| UI components, icons            | 3:1        | 4.5:1      |
| Non-essential decorations       | None       | None       |

**The gotcha**: Placeholder text still needs 4.5:1.

### Never Use Pure Gray or Pure Black

Pure gray (`oklch(50% 0 0)`) and pure black (`#000`) don't exist in nature. Even a chroma of
0.005-0.01 is enough to feel natural without being obviously tinted.

## Theming: Light & Dark Mode

### Dark Mode Is Not Inverted Light Mode

| Light Mode         | Dark Mode                                      |
|--------------------|------------------------------------------------|
| Shadows for depth  | Lighter surfaces for depth (no shadows)        |
| Dark text on light | Light text on dark (reduce font weight)        |
| Vibrant accents    | Desaturate accents slightly                    |
| White backgrounds  | Never pure black; use dark gray (oklch 12-18%) |

In dark mode, depth comes from surface lightness, not shadow. Build a 3-step surface scale where
higher elevations are lighter (e.g. 15% / 20% / 25% lightness). Reduce body text weight slightly
(e.g. 350 instead of 400) because light text on dark reads as heavier than dark text on light.

### Token Hierarchy

Use two layers: primitive tokens (`--blue-500`) and semantic tokens
(`--color-primary: var(--blue-500)`). For dark mode, only redefine the semantic layer; primitives
stay the same.

---

# 2. Spatial Design

## Spacing Systems

### Use 4pt Base, Not 8pt

8pt systems are too coarse; you'll frequently need 12px (between 8 and 16). Use 4pt for
granularity: 4, 8, 12, 16, 24, 32, 48, 64, 96px.

Use `gap` instead of margins for sibling spacing; it eliminates margin collapse and cleanup hacks.

## Visual Hierarchy

### Hierarchy Through Multiple Dimensions

Don't rely on size alone. Combine:

| Tool         | Strong Hierarchy          | Weak Hierarchy    |
|--------------|---------------------------|-------------------|
| **Size**     | 3:1 ratio or more         | <2:1 ratio        |
| **Weight**   | Bold vs Regular           | Medium vs Regular |
| **Color**    | High contrast             | Similar tones     |
| **Position** | Top/left (primary)        | Bottom/right      |
| **Space**    | Surrounded by white space | Crowded           |

**The best hierarchy uses 2-3 dimensions at once**: A heading that's larger, bolder, AND has more
space above it.

### Cards Are Not Required

Cards are overused. Spacing and alignment create visual grouping naturally. Use cards only when
content is truly distinct and actionable, items need visual comparison in a grid, or content needs
clear interaction boundaries. **Never nest cards inside cards.**

## Container Queries

Viewport queries are for page layouts. **Container queries are for components**:

```css
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    grid-template-columns: 120px 1fr;
  }
}
```

### Touch Targets vs Visual Size

Buttons can look small but need large touch targets (44px minimum). Use padding or pseudo-elements
to expand tap targets without changing visual size.

---

# 3. Motion Design

## Duration: The 100/300/500 Rule

| Duration      | Use Case            | Examples                           |
|---------------|---------------------|------------------------------------|
| **100-150ms** | Instant feedback    | Button press, toggle, color change |
| **200-300ms** | State changes       | Menu open, tooltip, hover states   |
| **300-500ms** | Layout changes      | Accordion, modal, drawer           |
| **500-800ms** | Entrance animations | Page load, hero reveals            |

**Exit animations are faster than entrances.** Use ~75% of enter duration.

## Easing: Pick the Right Curve

**Don't use `ease`.** It's a compromise that's rarely optimal. Instead:

| Curve           | Use For                      | CSS                              |
|-----------------|------------------------------|----------------------------------|
| **ease-out**    | Elements entering            | `cubic-bezier(0.16, 1, 0.3, 1)`  |
| **ease-in**     | Elements leaving             | `cubic-bezier(0.7, 0, 0.84, 0)`  |
| **ease-in-out** | State toggles (there - back) | `cubic-bezier(0.65, 0, 0.35, 1)` |

**Avoid bounce and elastic curves.** They were trendy in 2015 but now feel tacky. Real objects
don't bounce when they stop; they decelerate smoothly.

## Premium Motion Materials

Transform and opacity are reliable defaults, not the whole palette. Premium interfaces often need:
blur reveals, backdrop-filter panels, SVG filters, masks, clip paths, gradient-position movement.

Use the right material:

- **Transform / opacity**: movement, press feedback, simple reveals, list choreography
- **Blur / filter / backdrop-filter**: focus pulls, depth, glass effects, atmospheric transitions
- **Clip path / masks**: wipes, reveals, editorial cropping
- **Shadow / glow / color filters**: energy, affordance, focus, warmth, active state

The hard rule is not "transform and opacity only." The hard rule is: avoid animating layout-driving
properties casually (`width`, `height`, `top`, `left`, margins).

## Reduced Motion

**This is not optional.** Vestibular disorders affect ~35% of adults over 40.

```css
@media (prefers-reduced-motion: reduce) {
  .card {
    animation: fade-in 200ms ease-out; /* Crossfade instead of motion */
  }
}
```

**What to preserve**: Functional animations like progress bars, loading spinners (slowed down), and
focus indicators should still work, just without spatial movement.

---

# 4. Interaction Design

## The Eight Interactive States

Every interactive element needs these states designed:

| State        | When                        | Visual Treatment            |
|--------------|-----------------------------|-----------------------------|
| **Default**  | At rest                     | Base styling                |
| **Hover**    | Pointer over (not touch)    | Subtle lift, color shift    |
| **Focus**    | Keyboard/programmatic focus | Visible ring (see below)    |
| **Active**   | Being pressed               | Pressed in, darker          |
| **Disabled** | Not interactive             | Reduced opacity, no pointer |
| **Loading**  | Processing                  | Spinner, skeleton           |
| **Error**    | Invalid state               | Red border, icon, message   |
| **Success**  | Completed                   | Green check, confirmation   |

**The common miss**: Designing hover without focus, or vice versa.

## Focus Rings: Do Them Right

**Never `outline: none` without replacement.** Use `:focus-visible` to show focus only for
keyboard users:

```css
button:focus { outline: none; }

button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

## Form Design: The Non-Obvious

**Placeholders aren't labels.** They disappear on input. Always use visible `<label>` elements.
**Validate on blur**, not on every keystroke (exception: password strength). Place errors **below**
fields with `aria-describedby` connecting them.

## Destructive Actions: Undo > Confirm

**Undo is better than confirmation dialogs.** Users click through confirmations mindlessly. Remove
from UI immediately, show undo toast, actually delete after toast expires. Use confirmation only
for truly irreversible actions (account deletion), high-cost actions, or batch operations.

## Keyboard Navigation Patterns

### Roving Tabindex

For component groups (tabs, menu items, radio groups), one item is tabbable; arrow keys move
within:

```html
<div role="tablist">
  <button role="tab" tabindex="0">Tab 1</button>
  <button role="tab" tabindex="-1">Tab 2</button>
</div>
```

### Skip Links

Provide skip links (`<a href="#main-content">Skip to main content</a>`) for keyboard users to jump
past navigation.

## Gesture Discoverability

Swipe-to-delete and similar gestures are invisible. Always provide a visible fallback (menu with
"Delete"). Don't rely on gestures as the only way to perform actions.

---

# 5. Responsive Design

## Mobile-First: Write It Right

Start with base styles for mobile, use `min-width` queries to layer complexity. Desktop-first
(`max-width`) means mobile loads unnecessary styles first.

## Detect Input Method, Not Just Screen Size

```css
@media (pointer: coarse) {
  .button { padding: 12px 20px; } /* Larger touch target */
}

@media (hover: none) {
  .card { /* No hover state - use active instead */ }
}
```

**Critical**: Don't rely on hover for functionality. Touch users can't hover.

## Safe Areas: Handle the Notch

```css
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

.footer {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
```

---

# 6. Brand Register (Almanac / Field Journal Identity)

**Applies to this project specifically.** The Phenological Ledger / Field Journal identity is the
app's strongest unfair advantage. Every competitor looks like a generic health-tech dashboard.

## The Brand Slop Test

If someone could look at this and say "AI made that" without hesitation, it's failed. The bar is
distinctiveness; a visitor should ask "how was this made?", not "which AI made this?"

## Typography (This Project)

This project uses three-voice typography:

- **Spectral serif** - display headlines, section titles, dialog headings (letterpress weight)
- **Manrope** - body text, labels, UI prose
- **JetBrains Mono** - micro-labels, eyebrow text, numeric data, monospace annotations

Use `SERIF_TITLE_CLS` for section headings. Use `EDITORIAL_INPUT_CLS` on all `<Input>` elements.

## Reflex-Reject Fonts (Do Not Use)

Training-data defaults. Look further:

Fraunces - Newsreader - Lora - Crimson Pro - Playfair Display - Cormorant - Syne - IBM Plex Mono -
IBM Plex Sans - Space Mono - Space Grotesk - Inter - DM Sans - DM Serif Display - Plus Jakarta
Sans -
Instrument Sans - Instrument Serif

## Brand Permissions

Brand can afford things product can't. Take them:

- Ambitious first-load motion. Reveals, scroll-triggered transitions, typographic choreography.
- Typographic risk. Enormous display type, unexpected italic cuts, mixed cases.
- Art direction per section. Different sections can have different visual worlds if the narrative
  demands it.

## Brand Bans (This Project)

- Monospace as lazy shorthand for "technical." If the content isn't data, mono reads as costume.
- Large rounded-corner icons above every heading. Screams template.
- Timid palettes and average layouts. Safe = invisible.
- Repeated tiny uppercase tracked labels above every section heading unless it's the deliberate
  mono-eyebrow brand system.

---

# 7. Persona-Based Design Testing

Test the interface through the eyes of 5 distinct user archetypes when reviewing UI decisions.

## 1. Impatient Power User: "Alex"

Expert with similar products. Expects efficiency, hates hand-holding.

**Red flags:** Forced tutorials, no keyboard shortcuts, slow animations, one-at-a-time workflows
where batch would be natural, redundant confirmation steps for low-risk actions.

## 2. Confused First-Timer: "Jordan"

Never used this type of product. Will abandon rather than figure it out.

**Red flags:** Icon-only navigation with no labels, technical jargon without explanation, no help
option, ambiguous next steps after completing an action, no confirmation that an action succeeded.

## 3. Accessibility-Dependent User: "Sam"

Uses screen reader, keyboard-only navigation. May have low vision or motor impairment.

**Red flags:** Click-only interactions with no keyboard alternative, missing or invisible focus
indicators, meaning conveyed by color alone, unlabeled form fields or buttons, custom components
that break screen reader flow.

## 4. Deliberate Stress Tester: "Riley"

Pushes interfaces beyond the happy path. Tests edge cases and unexpected inputs.

**Red flags:** Features that silently fail, error handling that exposes technical details, empty
states that show nothing useful, workflows that lose user data on refresh, inconsistent behavior
between similar interactions in different parts of the UI.

## 5. Distracted Mobile User: "Casey"

Using phone one-handed on the go. Frequently interrupted, possibly on a slow connection.

**Red flags:** Important actions at top of screen (unreachable by thumb), no state persistence on
tab switch, heavy assets loading without lazy loading, tiny tap targets or targets too close
together.

---

**Last Updated:** June 14, 2026
