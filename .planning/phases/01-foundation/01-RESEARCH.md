# Phase 1: Foundation - Research

**Researched:** 2026-02-28
**Domain:** Global CSS mobile foundation — overflow containment, iOS Safari zoom prevention, touch target sizing, shadcn Dialog mobile fix, financial number protection
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GLOB-01 | Layout root overflow-x: clip uygulanmali (sticky pozisyonu bozmadan tasan icerigi onler) | Critical distinction between `overflow-x: clip` vs `overflow-x: hidden` — clip does not create a new scroll container, preserving `sticky top-0` header and sidebar behavior |
| GLOB-02 | Tum input/select/textarea elementleri 16px font-size kullanmali (iOS Safari zoom onleme) | Current `text-sm` in Input, SelectTrigger, and Textarea resolves to 14px — iOS Safari triggers page zoom when focused input has font-size < 16px; fix is adding `text-base` or `!text-[16px]` to base components |
| GLOB-03 | Tum interaktif elementler (buton, tab, satir) minimum 44px touch target olmali | Button `size: default` is `h-10` (40px) — 4px short of 44px minimum. `size: sm` is `h-9` (36px). Both need to become `h-11` (44px) on mobile or a global CSS min-height rule in globals.css |
| GLOB-04 | shadcn Dialog komponenti mobilde w-full max-w-lg max-h-[90vh] overflow-y-auto olmali | Current `dialog.tsx` has `w-full max-w-lg` with no mobile width constraint — at 375px, `max-w-lg` (512px) overflows viewport. Fix: add `max-w-[calc(100vw-32px)] sm:max-w-lg max-h-[90dvh] overflow-y-auto` to DialogContent |
| GLOB-05 | Finansal rakamlar whitespace-nowrap ile korunmali, sayi ortasindan kirilmamali | `formatMoney()` produces strings like "1.234.567,89 ₺" — without `whitespace-nowrap`, these break across lines mid-number. Fix belongs in globals.css as a `.font-amount` extension and/or the shadcn table.tsx `<td>` defaults |
</phase_requirements>

---

## Summary

Phase 1 is a global CSS foundation pass — five targeted changes across four files that prevent the most severe mobile UX failures before any page-by-page work begins. All five requirements are surgical edits to shared UI primitives: the dashboard layout wrapper, `globals.css`, `dialog.tsx`, `input.tsx`/`select.tsx`/`textarea.tsx`, and `button.tsx`. No new packages are needed.

The most critical fix is GLOB-01 (`overflow-x: clip`). The current dashboard layout wrapper uses no overflow containment at all — any page content that extends beyond 375px will produce a horizontal scrollbar on the full page. The correct fix is `overflow-x: clip` (not `overflow-x: hidden`) applied to the main layout `<div>`. This value hides overflow without creating a new scroll container, so the existing `sticky top-0` desktop header and `lg:pl-64` sidebar offset continue to work correctly.

The second most impactful fix is GLOB-02 (iOS Safari zoom). The three input components (`input.tsx`, `select.tsx`, `textarea.tsx`) all use `text-sm` which renders at 14px. iOS Safari automatically zooms the viewport when focusing any input with `font-size < 16px`. This zoom is disorienting and difficult to undo. Changing to `text-base` (16px) in the three base components eliminates the trigger globally — every form across all 20+ pages benefits immediately.

**Primary recommendation:** Apply all five GLOB fixes in a single commit before beginning any page-level responsive work. These are global primitives — fixing them first means every subsequent page inherits correct behavior automatically.

---

## Standard Stack

### Core (No Changes — Already Installed)

| Library | Version | Purpose | Phase 1 Usage |
|---------|---------|---------|--------------|
| Tailwind CSS | 3.4.1 | Utility classes, breakpoints | Add `overflow-x-clip` custom utility to globals.css; use `min-h-[44px]` for touch targets |
| shadcn/ui | (current) | Dialog, Input, Select, Textarea, Button | Modify 4 component files |
| Next.js 15 | App Router | Layout system | Modify `(dashboard)/layout.tsx` wrapper div |

### No New Packages

The project constraint from PROJECT.md is explicit: only Tailwind CSS classes — no new packages. All five GLOB requirements are achievable with:
- One CSS custom utility in `globals.css`
- Inline `style` attribute for `overflow-x: clip` (Tailwind 3.4.1 does not have a built-in `overflow-x-clip` utility)
- Class additions to existing shadcn/ui component files

**Installation:** None required.

---

## Architecture Patterns

### Recommended File Change Map

```
apps/frontend/src/
├── app/(dashboard)/layout.tsx    # GLOB-01: overflow-x: clip on main wrapper div
├── styles/globals.css            # GLOB-02 (optional): 16px input rule; GLOB-05: whitespace-nowrap for .font-amount
├── components/ui/
│   ├── input.tsx                 # GLOB-02: text-sm → text-base
│   ├── select.tsx                # GLOB-02: SelectTrigger text-sm → text-base
│   ├── textarea.tsx              # GLOB-02: text-sm → text-base
│   ├── dialog.tsx                # GLOB-04: DialogContent mobile width + height + scroll
│   └── button.tsx                # GLOB-03: touch target sizing (min-h-[44px] approach)
```

### Pattern 1: GLOB-01 — overflow-x: clip on Layout Wrapper

**What:** Apply `overflow-x: clip` to the root `<div>` in dashboard layout to prevent any child content from creating page-level horizontal scroll.

**Why `clip` not `hidden`:** `overflow: hidden` creates a new scroll container, which causes `position: sticky` elements inside it to anchor relative to the container instead of the viewport. The dashboard's `sticky top-0` desktop header would stop working. `overflow: clip` hides overflow without creating a scroll container — sticky continues to work.

**Current state of layout.tsx (line 71):**
```tsx
<div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
```

**Required change:**
```tsx
// overflow-x: clip is not a Tailwind 3.4.1 utility — use inline style
<div
  className="min-h-screen bg-secondary-50 dark:bg-secondary-950"
  style={{ overflowX: "clip" }}
>
```

**Alternative — add custom Tailwind utility in globals.css:**
```css
@layer utilities {
  .overflow-x-clip {
    overflow-x: clip;
  }
}
```
Then use `className="min-h-screen bg-secondary-50 dark:bg-secondary-950 overflow-x-clip"`. This is the cleaner approach since it stays in JSX as a class.

**Verification:** After change, check that `sticky top-0` desktop header (`h-14` in layout.tsx line 76) still sticks at the top when scrolling. Check that sidebar renders correctly at `lg` and above.

---

### Pattern 2: GLOB-02 — 16px Font Size on All Inputs

**What:** iOS Safari triggers automatic viewport zoom when a user taps any `<input>`, `<select>`, or `<textarea>` with `font-size < 16px`. This is not a bug — it is Apple's UX decision to ensure readability. The fix is ensuring all form elements render at exactly 16px.

**Current state:**
- `input.tsx`: `text-sm` (14px)
- `select.tsx` SelectTrigger: `text-sm` (14px)
- `textarea.tsx`: `text-sm` (14px)

**Tailwind font-size reference (Tailwind 3.4.1):**
- `text-sm` = 14px (`0.875rem`)
- `text-base` = 16px (`1rem`) ← required minimum

**Required change in input.tsx:**
```tsx
// Before
"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ..."

// After
"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background ..."
```

Using `text-base sm:text-sm` — 16px on mobile (prevents zoom), 14px on desktop (preserves existing visual design). This is the iOS-safe pattern.

**Same change for textarea.tsx and select.tsx (SelectTrigger).**

**Important:** The visual change on desktop is minimal (14px → 16px only on mobile, sm: reverts to 14px). On desktop the design is unchanged. If visual consistency across all viewports is preferred, use `text-base` everywhere — the design difference is small and acceptable.

---

### Pattern 3: GLOB-03 — 44px Touch Targets

**What:** Apple HIG and WCAG 2.5.8 (AAA) specify minimum 44×44px touch targets for interactive elements. Current Button `default` size is `h-10` (40px), `sm` is `h-9` (36px).

**Options for implementation:**

**Option A — Global CSS rule in globals.css (broadest coverage):**
```css
@layer base {
  @media (max-width: 639px) {
    button,
    [role="tab"],
    [role="button"],
    a {
      min-height: 44px;
    }
  }
}
```
This ensures every interactive element meets the minimum without modifying individual components. However, it may conflict with layout in some cases (e.g., icon buttons in tight spaces).

**Option B — Modify button.tsx variants (targeted, predictable):**
```tsx
size: {
  default: "h-11 px-4 py-2",       // 44px (was h-10 = 40px)
  sm: "h-10 rounded-md px-3",       // 40px (was h-9 = 36px) — use sparingly
  lg: "h-12 rounded-md px-8",       // 48px (was h-11 = 44px)
  icon: "h-11 w-11",               // 44px (was h-10 = 40px)
},
```

**Recommendation:** Option B (modify button.tsx). Global CSS rules can create unexpected height changes in non-button elements. Explicit component sizing is predictable. The 1px visual difference on desktop is imperceptible.

**For tabs and interactive rows:** These are addressed at page level (Phase 3 for detail pages, Phase 4 for transactions). Foundation only fixes the Button component.

For TabsTrigger (tabs.tsx), add `min-h-[44px]` to the base class:
```tsx
// In tabs.tsx TabsTrigger
"inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 min-h-[44px] text-sm font-medium ..."
```

---

### Pattern 4: GLOB-04 — shadcn Dialog Mobile Fix

**What:** Current `dialog.tsx` DialogContent has `w-full max-w-lg` with no mobile width constraint. At 375px viewport, `max-w-lg` (512px) overflows — the dialog is wider than the screen, with the right edge and close button cut off.

**Current DialogContent classes (line 41):**
```
"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 ..."
```

**Required change:**
```tsx
"fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100vw-32px)] sm:max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 sm:p-6 shadow-lg duration-200 max-h-[90dvh] overflow-y-auto ..."
```

Key additions:
- `max-w-[calc(100vw-32px)]` — 16px margin on each side at mobile viewport
- `sm:max-w-lg` — restores original max width at 640px+
- `max-h-[90dvh]` — caps dialog height for iOS Safari (use `dvh` not `vh` — `dvh` accounts for the dynamic viewport height that changes when iOS address bar hides/shows)
- `overflow-y-auto` — enables internal scroll for tall forms
- `p-4 sm:p-6` — tighter padding on mobile to save space

**Why `dvh` not `vh`:** On iOS Safari, `100vh` is the height including the address bar. When the address bar hides during scroll, content shifts. `100dvh` is the "dynamic viewport height" — it updates as the address bar visibility changes. This prevents dialogs from being partially off-screen on iOS.

---

### Pattern 5: GLOB-05 — Financial Number Protection

**What:** `formatMoney()` produces strings like `"1.234.567,89 ₺"`. Without protection, these break across two lines: `"1.234.567,"` and `"89 ₺"`. This is confusing in financial context.

**Two locations to protect:**

**Location A — globals.css (extends existing `.font-amount` class):**
The project already has a `.font-amount` class in globals.css (line 105). Add `whitespace-nowrap`:
```css
.font-amount {
  font-family: theme("fontFamily.mono");
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.025em;
  white-space: nowrap;  /* ADD: prevents mid-number line breaks */
}
```

**Location B — table.tsx (for table cells with financial data):**
The shadcn table.tsx `<TableCell>` doesn't currently enforce `whitespace-nowrap`. For financial tables, the wrapper pattern is:
```tsx
<TableCell className="whitespace-nowrap tabular-nums text-right">
  {formatMoney(amount)}
</TableCell>
```
This is applied per-page, not in table.tsx itself (to avoid forcing nowrap on all table cells).

**In card stat displays:**
```tsx
<p className="text-2xl font-bold font-amount">
  {formatMoney(balance)}
</p>
```
If `.font-amount` gets `white-space: nowrap`, all such elements are protected immediately.

---

### Anti-Patterns to Avoid

- **`overflow-x: hidden` on the layout wrapper:** Breaks `position: sticky` header. Use `overflow-x: clip` only.
- **`overflow-x: hidden` on `<html>` or `<body>`:** Disables all mobile scrolling, including vertical. Never apply to document roots.
- **`text-[16px]` hardcoded on inputs (bypass approach):** Works but bypasses the Tailwind design system. Use `text-base` instead.
- **`vh` units for dialog height on iOS:** `100vh` does not account for iOS Safari's dynamic address bar. Use `dvh` units.
- **Global touch target CSS on `*` selector:** Too broad — affects layout elements. Target interactive elements specifically.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| iOS Safari zoom prevention | Custom JS focus handler to temporarily set font-size | `text-base` CSS in input component | JS approach has race conditions, doesn't work with autofocus |
| Mobile dialog | New mobile-specific dialog component | Update existing `dialog.tsx` with responsive classes | One fix, all dialogs across all pages benefit |
| Touch target enforcement | JS click target expansion (pointer-events tricks) | CSS `min-height: 44px` or increased button height | CSS approach is zero-JS, works with keyboard navigation too |
| Overflow containment | `overflow: hidden` on body tag | `overflow-x: clip` on layout div | Clip is the correct primitive for this use case |
| Financial number wrapping prevention | Custom formatter that pre-wraps in `<span>` | `white-space: nowrap` CSS rule | CSS is declarative, applies without JSX changes |

**Key insight:** Every GLOB requirement is solvable with a CSS-only primitive. No JavaScript, no new components, no new packages.

---

## Common Pitfalls

### Pitfall 1: Using `overflow-x: hidden` Instead of `overflow-x: clip`

**What goes wrong:** The sticky desktop header (`sticky top-0 z-30 hidden lg:flex h-14` in dashboard layout.tsx line 76) stops sticking and scrolls away with content. The sidebar may also be affected.

**Why it happens:** `overflow: hidden` creates a new scroll container. Elements with `position: sticky` anchor to the nearest scroll container ancestor — if that's the layout div (not the viewport), they no longer act sticky relative to the page.

**How to avoid:** Only use `overflow-x: clip`. Verify after change: scroll a long page on desktop and confirm the header stays fixed at top.

**Warning signs:** Header visible on initial load, then scrolls away after any content scroll.

---

### Pitfall 2: `text-base` Change Breaks Desktop Visual Design

**What goes wrong:** Changing inputs from `text-sm` (14px) to `text-base` (16px) uniformly makes all inputs 2px larger on desktop, slightly affecting card layouts with compact forms.

**How to avoid:** Use `text-base sm:text-sm` — 16px on mobile, 14px from 640px up. This is the iOS-safe pattern that preserves desktop appearance exactly.

**Warning signs:** Form layouts shift on desktop after the change.

---

### Pitfall 3: Dialog `max-h` Clips Content on iOS Safari

**What goes wrong:** Using `max-h-[90vh]` on the dialog — on iOS Safari, `100vh` is measured including the hidden address bar. When the user scrolls up and the address bar reappears, the dialog height recalculates and jumps.

**How to avoid:** Use `max-h-[90dvh]`. The `dvh` unit (dynamic viewport height) updates as address bar visibility changes, preventing layout jumps.

**Warning signs:** Dialog height jumps when scrolling on real iPhone (not replicable in Chrome DevTools iPhone simulation).

---

### Pitfall 4: Button Height Change Breaks Compact UI Areas

**What goes wrong:** Increasing Button `size: default` from `h-10` to `h-11` adds 4px height. In pages with multiple buttons in a row (e.g., action bars with 5 buttons), this may push a button onto a second line.

**How to avoid:** Check all pages with button rows before committing. Alternative: add `min-h-[44px]` without changing `h-10` — this expands the tap area below the visible button height without changing visual layout.

**Better approach:**
```tsx
size: {
  default: "h-10 min-h-[44px] px-4 py-2",  // visual h-10, touch area h-11
```
But note: `min-h` overrides `h` in CSS, so this actually makes it 44px visually too. The cleanest solution is `h-11` (44px) and checking affected layouts.

---

### Pitfall 5: `white-space: nowrap` on `.font-amount` Breaks Card Overflow

**What goes wrong:** If `.font-amount` gets `white-space: nowrap` and it's used inside a flex container without `min-w-0` on the parent, long financial numbers push the container wider than the card.

**How to avoid:** Wherever `.font-amount` is used in a flex/grid child, ensure the parent has `min-w-0`:
```tsx
<div className="min-w-0">  {/* prevents overflow from expanding card */}
  <p className="font-amount truncate">{formatMoney(balance)}</p>
</div>
```
`min-w-0` + `truncate` on the number element = number stays within card bounds.

---

## Code Examples

Verified patterns from official sources and codebase analysis:

### GLOB-01: Layout Wrapper (layout.tsx)

```tsx
// Source: PITFALLS.md (position:sticky + overflow:clip research)
// File: apps/frontend/src/app/(dashboard)/layout.tsx

// Option A: Custom utility in globals.css (recommended)
// First add to globals.css:
// @layer utilities { .overflow-x-clip { overflow-x: clip; } }

<div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 overflow-x-clip">

// Option B: Inline style (no globals.css change required)
<div
  className="min-h-screen bg-secondary-50 dark:bg-secondary-950"
  style={{ overflowX: "clip" }}
>
```

### GLOB-02: Input Component (input.tsx)

```tsx
// Source: iOS Safari behavior — text-sm = 14px triggers zoom, text-base = 16px does not
// File: apps/frontend/src/components/ui/input.tsx
"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
```

### GLOB-02: SelectTrigger (select.tsx)

```tsx
// File: apps/frontend/src/components/ui/select.tsx
"flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
```

### GLOB-02: Textarea (textarea.tsx)

```tsx
// File: apps/frontend/src/components/ui/textarea.tsx
"flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
```

### GLOB-03: Button Sizes (button.tsx)

```tsx
// File: apps/frontend/src/components/ui/button.tsx
size: {
  default: "h-11 px-4 py-2",       // 44px — was h-10 (40px)
  sm: "h-9 rounded-md px-3",        // 36px — leave as-is, use sparingly on mobile
  lg: "h-11 rounded-md px-8",       // 44px — same as default touch minimum
  icon: "h-11 w-11",               // 44px — was h-10 w-10 (40px)
},
```

### GLOB-04: DialogContent (dialog.tsx)

```tsx
// Source: PITFALLS.md — shadcn/ui Dialog GitHub Issue #8098, #6538
// File: apps/frontend/src/components/ui/dialog.tsx
"fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100vw-32px)] sm:max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 sm:p-6 shadow-lg duration-200 max-h-[90dvh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
```

### GLOB-05: globals.css Financial Number Protection

```css
/* File: apps/frontend/src/styles/globals.css */
/* Money amounts with monospace font */
.font-amount {
  font-family: theme("fontFamily.mono");
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.025em;
  white-space: nowrap;  /* ADD: prevents mid-number line breaks at 375px */
}
```

### GLOB-01: Custom Tailwind Utility (globals.css)

```css
/* File: apps/frontend/src/styles/globals.css */
@layer utilities {
  /* overflow-x: clip hides horizontal overflow WITHOUT creating a new scroll context.
     Use this instead of overflow-x: hidden on any container with sticky/fixed descendants. */
  .overflow-x-clip {
    overflow-x: clip;
  }
}
```

### Touch Target Pattern for TabsTrigger (tabs.tsx)

```tsx
// File: apps/frontend/src/components/ui/tabs.tsx
// Add min-h-[44px] to TabsTrigger base classes
const TabsTrigger = React.forwardRef<...>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 min-h-[44px] text-sm font-medium ring-offset-background ...",
        className
      )}
      {...props}
    />
  )
)
```

---

## State of the Art

| Old Approach | Current Approach | Impact for Phase 1 |
|--------------|------------------|-------------------|
| `overflow: hidden` to suppress scroll | `overflow-x: clip` (no scroll container created) | GLOB-01: use clip, not hidden |
| `100vh` for full-height mobile elements | `100dvh` (dynamic viewport height) | GLOB-04: use `90dvh` for dialog max-height |
| Fixed font sizes on all inputs | `text-base sm:text-sm` (16px mobile, 14px desktop) | GLOB-02: iOS zoom prevention pattern |
| Separate mobile component | Responsive classes on existing component | All GLOB: no new components needed |

**Deprecated/outdated approaches:**
- `font-size: 16px !important` on inputs via `@media`: Works but bypasses Tailwind design system. Use `text-base sm:text-sm` instead.
- `touch-action: manipulation` for zoom prevention: Suppresses double-tap zoom but does not prevent focus zoom — not sufficient for GLOB-02.

---

## Open Questions

1. **Button height increase may affect compact button rows**
   - What we know: `h-10` → `h-11` change adds 4px; some pages have multiple buttons in a row
   - What's unclear: Which pages use compact button rows that would be affected — not audited yet
   - Recommendation: After changing button.tsx, open each page at 375px in browser DevTools and scan for visual regressions. Revert to `h-10 min-h-[44px]` if any page breaks.

2. **tabs.tsx TabsTrigger height — may affect existing tab layouts**
   - What we know: TabsTrigger at `py-1.5` (padding only, no explicit height) may be under 44px
   - What's unclear: Whether the rendered height from padding alone already meets 44px in context
   - Recommendation: Inspect actual rendered height in browser before adding `min-h-[44px]` to tabs.tsx. If already >= 44px in practice, skip the tabs.tsx change for Phase 1.

3. **`sm:text-sm` desktop reversion — does it affect placeholder and file input text**
   - What we know: Input has `file:text-sm` as a separate class for file upload text
   - What's unclear: Whether `sm:text-sm` on the outer input also resets file input text on desktop
   - Recommendation: Keep `file:text-sm` unchanged; test file input appearance on desktop after change.

---

## Sources

### Primary (HIGH confidence)
- `apps/frontend/src/components/ui/input.tsx` — current `text-sm` class confirmed, no 16px override
- `apps/frontend/src/components/ui/select.tsx` — SelectTrigger `text-sm` confirmed
- `apps/frontend/src/components/ui/textarea.tsx` — `text-sm` confirmed
- `apps/frontend/src/components/ui/dialog.tsx` — `max-w-lg` without mobile constraint confirmed
- `apps/frontend/src/components/ui/button.tsx` — `h-10` default, `h-9` sm confirmed
- `apps/frontend/src/app/(dashboard)/layout.tsx` — no overflow containment on wrapper div confirmed
- `apps/frontend/src/styles/globals.css` — `.font-amount` class exists, no `white-space: nowrap`
- `.planning/research/PITFALLS.md` — overflow-x:clip, iOS zoom, dialog fix research (HIGH)
- `.planning/research/STACK.md` — Tailwind 3.4.1 patterns, shadcn/ui patterns (HIGH)

### Secondary (MEDIUM confidence)
- [shadcn/ui GitHub Issue #8098](https://github.com/shadcn-ui/ui/issues/8098) — Dialog responsive width
- [shadcn/ui GitHub Issue #6538](https://github.com/shadcn-ui/ui/issues/6538) — Dialog overflow on mobile
- [Tailwind CSS Responsive Design docs](https://tailwindcss.com/docs/responsive-design) — breakpoint mobile-first system
- [position:sticky + overflow:clip — Terluin Web Design](https://www.terluinwebdesign.nl/en/blog/position-sticky-not-working-try-overflow-clip-not-overflow-hidden/) — sticky + clip interaction

### Tertiary (LOW — needs validation)
- iOS Safari behavior: `font-size < 16px` triggers zoom — widely documented community finding, verified by multiple sources but not iOS official documentation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all files read directly from codebase; no assumptions
- Architecture: HIGH — exact class strings identified from source files; changes are targeted
- Pitfalls: HIGH — sourced from project PITFALLS.md (pre-researched with official sources) + direct codebase audit

**Research date:** 2026-02-28
**Valid until:** 2026-03-28 (stable CSS/Tailwind domain — 30-day confidence window)
