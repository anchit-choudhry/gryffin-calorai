// CSS Anchor Positioning — forward-adoption pattern
//
// Status: Chrome 125+, Edge 125+. Firefox/Safari: behind flags as of May 2026.
// Use native anchor positioning for NEW overlay work (B5 photo logging menu,
// B4 sync status popover). Do NOT refactor existing overlays to use anchors.
//
// Pattern:
//   1. Add `anchor-name: --<id>` CSS on the trigger element.
//   2. Add `position-anchor: --<id>` on the positioned overlay.
//   3. Use `anchor()` function for inset values:
//        inset-block-start: anchor(end);     /* top of overlay = bottom of anchor */
//        inset-inline-start: anchor(start);  /* left-align with anchor */
//   4. Add `@supports not (anchor-name: --x)` fallback using `position: fixed`
//      or `getBoundingClientRect()` JS positioning.
//
// Tailwind v4 does not yet have anchor-name utilities. Use arbitrary properties:
//   className="[anchor-name:--my-menu]"
//   className="[position-anchor:--my-menu]"
//
// Example (trigger + popover-native):
//   <button className="[anchor-name:--sync-chip]" popovertarget="sync-menu">...</button>
//   <div id="sync-menu" popover="auto"
//     className="[position-anchor:--sync-chip] [inset-block-start:anchor(end)] [inset-inline-start:anchor(start)]">
//     ...
//   </div>

// Typed CSS property helpers — emit the inline style object for non-Tailwind usage.
export function anchorName(name: string): Record<string, string> {
  return { anchorName: `--${name}` } as Record<string, string>;
}

export function positionAnchor(name: string): Record<string, string> {
  return { positionAnchor: `--${name}` } as Record<string, string>;
}

// Detect whether CSS anchor positioning is supported.
export function supportsAnchorPositioning(): boolean {
  return typeof CSS !== "undefined" && CSS.supports("anchor-name", "--x");
}
