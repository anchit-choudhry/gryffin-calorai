---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.html"
  - "**/*.css"
---

# HTML/CSS Style Rules

Source: Google HTML/CSS Style Guide (google.github.io/styleguide/htmlcssguide.html).
Adapted for this project's JSX + Tailwind CSS 4 stack.

---

## HTML / JSX semantics

### Use semantic elements

Choose the element that best describes the content's role, not just its appearance:

| Purpose                   | Correct element           | Avoid                          |
|---------------------------|---------------------------|--------------------------------|
| Primary page content      | `<main>`                  | `<div id="main">`              |
| Navigation                | `<nav>`                   | `<div class="nav">`            |
| Page section with heading | `<section>`               | `<div>`                        |
| Self-contained article    | `<article>`               | `<div>`                        |
| Site header/footer        | `<header>`, `<footer>`    | `<div>`                        |
| Supplementary content     | `<aside>`                 | `<div class="sidebar">`        |
| Data tables               | `<table>`, `<th>`, `<td>` | `<div>` grid                   |
| Interactive trigger       | `<button>`                | `<div onClick>`, `<a onClick>` |
| External link             | `<a href="...">`          | `<button onClick={navigate}>`  |

### Button type attribute

Always specify `type` on `<button>` elements. The default is `"submit"`, which submits
the nearest form unintentionally:

```tsx
// Good
<button type="button" onClick={handleClick}>Add food</button>
<button type="submit">Save</button>
<button type="reset">Clear</button>

// Bad - accidentally submits the form
<button onClick={handleClick}>Add food</button>
```

### Avoid `role` when a semantic element exists

Only use `role` to override semantics when no semantic element is available:

```tsx
// Good - semantic element
<nav aria-label="Main navigation">...</nav>

// Avoid - redundant role
<nav role="navigation" aria-label="Main navigation">...</nav>

// Acceptable - non-semantic element needs a role
<div role="alert" aria-live="assertive">{errorMessage}</div>
```

### Separation of concerns

Keep structure, presentation, and behavior separate:

- **Structure:** JSX/HTML elements and attributes
- **Presentation:** Tailwind utility classes only (no inline `style` props)
- **Behavior:** event handlers and hooks

```tsx
// Good
<button
  type="button"
  className="rounded-lg bg-amber-600 px-4 py-2 text-white"
  onClick={handleAdd}
>
  Add food
</button>

// Bad - mixes presentation into structure
<button
  type="button"
  style={{borderRadius: "8px", backgroundColor: "#d97706"}}
  onClick={handleAdd}
>
  Add food
</button>
```

---

## Accessibility

### Images must have alt text

Every `<img>` must have `alt`. Use `alt=""` for purely decorative images:

```tsx
// Good - meaningful image
<img src={recipe.photo} alt={`Photo of ${recipe.name}`}/>

// Good - decorative image
<img src="/logo-mark.svg" alt="" aria-hidden="true"/>

// Bad - missing alt
<img src={recipe.photo}/>
```

Add `loading="lazy"` on all images that are not in the initial viewport:

```tsx
// Good - hero image, above fold
<img src={recipe.photo} alt={`Photo of ${recipe.name}`}/>

// Good - list item image, below fold
<img src={recipe.photo} alt={`Photo of ${recipe.name}`} loading="lazy"/>
```

### Icon-only buttons need a label

Buttons with only an icon must have an accessible label via `aria-label` or a
visually hidden `<span>`:

```tsx
// Good
<button type="button" aria-label="Delete food entry">
  <Trash2 className="size-4" aria-hidden="true"/>
</button>

// Also good - visually hidden text
<button type="button">
  <Trash2 className="size-4" aria-hidden="true"/>
  <span className="sr-only">Delete food entry</span>
</button>

// Bad - no label for screen readers
<button type="button">
  <Trash2 className="size-4"/>
</button>
```

### Form labels

Every form input must have an associated `<label>` via `htmlFor`/`id` or by wrapping:

```tsx
// Good - associated via htmlFor/id
<label htmlFor="calories">Calories (kcal)</label>
<input id="calories" type="number" ...
/>

// Good - wrapped label
<label>
  Calories (kcal)
  <input type="number" ... />
</label>

// Bad - no label
<input type="number" placeholder="Calories" ...
/>
```

### Keyboard navigation

All interactive elements must be keyboard-accessible:

- Use `<button>` and `<a>` (natively focusable), not `<div onClick>`.
- Tab order must be logical; avoid `tabIndex > 0`.
- Visible focus rings must not be removed; use Tailwind's `focus-visible:` variant.

```tsx
// Good - visible focus ring preserved
<button
  type="button"
  className="... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
>
  Log food
</button>

// Bad - removes focus ring entirely
<button type="button" className="outline-none focus:outline-none">
  Log food
</button>
```

### `aria-live` for dynamic content

Use `aria-live` regions for content that updates without a page reload (e.g., toasts,
error messages, loading states). Prefer the `liveRegionProps` / `assertiveRegionProps`
helpers from `src/lib/a11y.ts`:

```tsx
import {liveRegionProps} from "@/lib/a11y";

// Good
<div {...liveRegionProps}>{statusMessage}</div>

// Manual equivalent
<div aria-live="polite" aria-atomic="true">{statusMessage}</div>
```

### Color contrast

Do not use color alone to convey meaning. Pair color with text, icons, or patterns.
Maintain WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text).

---

## CSS / Tailwind

### Tailwind only; no inline styles or CSS modules

```tsx
// Good
<div className="flex items-center gap-3 rounded-xl bg-stone-900 p-4">

  // Bad - inline style
  <div style={{display: "flex", alignItems: "center", gap: "12px"}}>

    // Bad - CSS module
    import styles from "./FoodLogger.module.css";
    <div className={styles.wrapper}>
```

### Class merging with `cn()`

Use `cn()` from `@/lib/utils` (a `clsx` + `tailwind-merge` wrapper) for all
conditional or merged class strings:

```tsx
import {cn} from "@/lib/utils";

// Good
<div className={cn("rounded-lg px-4", isActive && "bg-amber-600", className)}>

  // Bad - string concatenation breaks tailwind-merge deduplication
  <div className={`rounded-lg px-4 ${isActive ? "bg-amber-600" : ""} ${className}`}>
```

### Class ordering

Order Tailwind classes in this sequence (enforced by `prettier-plugin-tailwindcss`):

1. Layout and display (`flex`, `grid`, `hidden`, `block`, `inline-*`)
2. Position and z-index (`relative`, `absolute`, `inset-*`, `z-*`)
3. Box model (`w-*`, `h-*`, `min-*`, `max-*`, `p-*`, `m-*`, `gap-*`)
4. Border and radius (`border`, `border-*`, `rounded-*`, `outline-*`)
5. Typography (`text-*`, `font-*`, `leading-*`, `tracking-*`, `truncate`)
6. Colors and backgrounds (`bg-*`, `text-stone-*`, `fill-*`, `stroke-*`)
7. Effects and decoration (`shadow-*`, `opacity-*`, `ring-*`)
8. Motion and transitions (`transition-*`, `duration-*`, `ease-*`, `animate-*`)
9. State variants (`hover:`, `focus-visible:`, `active:`, `disabled:`)
10. Dark mode (`dark:`)
11. Responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`)

Run `pnpm lint:fix` to auto-sort via `prettier-plugin-tailwindcss`.

### Dark mode

Use the `dark:` Tailwind variant. Dark mode is class-based (`darkMode: "class"` in
`tailwind.config.ts`); the class is toggled on `<html>` by the settings slice:

```tsx
// Good
<div className="bg-white text-stone-900 dark:bg-stone-950 dark:text-stone-100">

  // Bad - no dark mode variant
  <div className="bg-white text-stone-900">
```

### Responsive design (mobile-first)

Write base styles for mobile, then layer upward breakpoints:

```tsx
// Good - mobile base, then larger screens
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

  // Bad - desktop base with overrides
  <div className="grid grid-cols-3 sm:grid-cols-2 grid-cols-1">
```

### No arbitrary values for design tokens

Use Tailwind's configured scale; avoid `[]` arbitrary values for anything in the
design token set (spacing, colors, font sizes):

```tsx
// Good
<div className="gap-4 text-sm text-stone-600">

  // Avoid - bypasses the design system
  <div className="gap-[18px] text-[13px] text-[#6b6b6b]">
```

Arbitrary values are acceptable for one-off values not in the Tailwind scale (e.g.,
`w-[200px]` for a fixed sidebar width that has no scale equivalent).

### No `!important`

Never use `!important` in CSS. In Tailwind, never prefix a class with `!` (the
important modifier) - it breaks the cascade and makes overrides impossible:

```tsx
// Bad - Tailwind important modifier
<div className="!bg-red-500 !text-white">

  // Bad - arbitrary important in CSS value
  <div className="[background:red!important]">

    // Good - resolve specificity conflicts by restructuring, not forcing
    <div className={cn("bg-red-500 text-white", override)}>
```

If you feel you need `!important`, the real fix is to reduce CSS specificity elsewhere
or restructure which component owns the style.

### Prefer shorthand utilities

Use Tailwind shorthand classes over specifying each side individually:

```tsx
// Good - shorthand
<div className="p-4">          {/* all sides */}
  <div className="px-4 py-2">   {/* axis shorthand */}
    <div className="m-0">

      // Avoid - verbose per-side
      <div className="pt-4 pr-4 pb-4 pl-4">
        <div className="mt-0 mr-0 mb-0 ml-0">
```

This applies to all box-model utilities: `p`, `m`, `border`, `rounded`, `inset`.

### SVG conventions

Decorative SVGs (icons, illustrations) must be hidden from screen readers with
`aria-hidden="true"`. Size icons with `size-*` (sets both `width` and `height`):

```tsx
// Good - icon from lucide-react
<Trash2 className="size-4" aria-hidden="true"/>

// Good - inline SVG illustration
<svg aria-hidden="true" className="size-8 stroke-stone-400" ...>
...
</svg>

// Bad - no aria-hidden; screen reader reads meaningless path data
<Trash2 className="w-4 h-4"/>

// Bad - w-4 h-4 separately instead of size-4
<Trash2 className="w-4 h-4" aria-hidden="true"/>
```

When an SVG is meaningful (not decorative), use `<title>` inside the SVG and
`role="img"` on the element instead of `aria-hidden`.

### `EDITORIAL_INPUT_CLS` for form inputs

Always use the `EDITORIAL_INPUT_CLS` constant from `@/lib/utils` on all `<Input>`
components to maintain consistent editorial styling:

```tsx
import {EDITORIAL_INPUT_CLS} from "@/lib/utils";

// Good
<Input className={cn(EDITORIAL_INPUT_CLS, "w-full")} ...
/>

// Bad - ad-hoc input classes
<Input className="border border-stone-700 bg-stone-900 px-3 py-2" ...
/>
```

---

## HTML document conventions

### Character encoding

Always declare UTF-8 in the document `<head>`:

```html

<meta charset="UTF-8"/>
```

### Viewport

Always include the viewport meta tag for responsive layouts:

```html

<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
```

### Protocol

Use HTTPS for all embedded external resources (scripts, fonts, images):

```html
<!-- Good -->
<link rel="preconnect" href="https://fonts.googleapis.com"/>

<!-- Bad -->
<link rel="preconnect" href="http://fonts.googleapis.com"/>
```

### Omit `type` for CSS and JS

The `type` attribute on `<link rel="stylesheet">` and `<script>` is optional in
HTML5 and should be omitted:

```html
<!-- Good -->
<script src="/main.js"></script>
<link rel="stylesheet" href="/styles.css"/>

<!-- Unnecessary -->
<script type="text/javascript" src="/main.js"></script>
<link type="text/css" rel="stylesheet" href="/styles.css"/>
```

---

## Attribute conventions

### `data-*` attributes

Use `data-*` attributes for:

- Test selectors: `data-testid="food-entry-row"`
- Product tour targets: `data-tour-id="dashboard-activity"` (see `frontend.md`)
- JS hooks that are not semantic: `data-action="delete"`

Do not use `id` attributes for CSS styling; prefer classes.

### Quotation marks

Always use double quotes for HTML attribute values in `.html` files. In JSX, use
double quotes for string literals, curly braces for expressions:

```tsx
// Good JSX
<input type="text" placeholder="Search foods..." className="w-full"/>

// Bad JSX - single quotes
<input type='text' placeholder='Search foods...' className='w-full'/>
```

### Boolean attributes in JSX

Use the explicit `={true}` / `={false}` form in JSX for clarity; never pass a bare
boolean attribute name:

```tsx
// Good JSX
<input disabled={isSubmitting} readOnly={!isEditable}/>

// Avoid - HTML shorthand does not map cleanly to JSX semantics
<input disabled readOnly/>
```

---

**Last Updated:** June 6, 2026 | **Source:** Google HTML/CSS Style Guide
