# Pitfalls Research

**Domain:** Responsive CSS retrofit — Tailwind CSS + shadcn/ui financial dashboard
**Researched:** 2026-02-28
**Confidence:** HIGH (verified against official Tailwind docs, Radix/shadcn GitHub issues, Recharts issue tracker, and multiple community post-mortems)

---

## Critical Pitfalls

### Pitfall 1: `overflow-x: hidden` on a Container Breaks `position: sticky` and `position: fixed`

**What goes wrong:**
The reflex fix for horizontal overflow is to add `overflow-hidden` to a wrapper div (or worse, to `<html>` or `<body>`). This silences the horizontal scroll, but it silently creates a new scroll container — meaning any `sticky` or `fixed` descendant now sticks relative to *that container*, not the viewport. The dashboard's `sticky top-0` header (`z-30 hidden lg:flex`) and the sidebar stop behaving as expected on mobile.

**Why it happens:**
`overflow: hidden` (and `overflow: auto`/`scroll`) creates a new formatting context. The browser now treats that element as the scroll root. A `position: sticky` element inside it anchors to *that element's* scroll area, not the viewport. On mobile where the layout is a single column, this breaks the sticky top bar and can push the sidebar off-screen.

**How to avoid:**
Use `overflow-x: clip` instead of `overflow-x: hidden`. The `clip` value hides the overflow without creating a scroll container — `position: sticky` and `position: fixed` continue to work relative to the viewport. Tailwind does not have an `overflow-x-clip` utility by default; add it as a custom utility or use inline style `overflow-x: clip` until Tailwind adds it.

```html
<!-- WRONG — breaks sticky header -->
<div class="overflow-hidden">...</div>

<!-- CORRECT — hides overflow, preserves sticky behavior -->
<div style="overflow-x: clip">...</div>
```

**Warning signs:**
- Sticky header scrolls away on mobile
- Sidebar disappears under content when scrolling
- Fixed dialogs/toasts render off-screen on mobile
- Works fine on desktop but breaks at `<lg` breakpoints

**Phase to address:** Every page — establish `overflow-x: clip` as the project standard before touching any page. Document in a code comment.

---

### Pitfall 2: Tailwind's Mobile-First Breakpoints Applied Backwards

**What goes wrong:**
Developers treating `sm:`, `md:`, `lg:` as "apply only on small/medium/large screens" instead of "apply at this breakpoint and above". The result: styles intended for mobile accidentally apply to desktop, or desktop styles are never overridden for mobile.

Example: `<div class="hidden sm:block">` hides on mobile (correct). But `<div class="sm:hidden block">` is still visible at `md` and `lg` — the author meant "mobile only" but got "always hidden above 640px".

This project has mixed patterns already. The approvals page header uses `text-3xl` with no mobile override — it will overflow at 375px.

**Why it happens:**
Tailwind is mobile-first. Unprefixed classes apply at *all sizes*. `sm:` means "from 640px upward". Developers coming from desktop-first CSS (Bootstrap, old projects) write desktop styles without prefix and add `sm:` to override for mobile, which is the opposite of how Tailwind works.

**How to avoid:**
- Write base styles for 375px (mobile) first, then add `sm:`, `md:`, `lg:` for progressively larger screens
- Review every existing class without a breakpoint prefix — ask: "does this look good at 375px?"
- Pattern to follow: `text-lg sm:text-2xl lg:text-3xl` (small → large)
- Never pattern: `text-3xl sm:text-lg` (this reduces text size at `sm` but is still `text-3xl` above `sm` — not "mobile only")

**Warning signs:**
- Headers overflow at 375px
- Cards too wide on mobile but fine on desktop
- Grid columns render as multi-column on mobile
- "I added `sm:hidden` but it's still visible on tablet"

**Phase to address:** Foundation pass — audit all unprefixed layout-affecting classes before page-by-page work.

---

### Pitfall 3: Dynamically Constructed Tailwind Class Names Are Purged in Production

**What goes wrong:**
Tailwind's JIT engine scans source files for complete class name strings at build time. Any class assembled via string concatenation or template literals is invisible to the scanner and its CSS is never generated — styles apply in development (where all classes are available) but disappear in production builds.

This project already has dynamic class patterns (e.g., `gradient: "from-orange-500 to-orange-600"` stored in data arrays, color strings assembled from `color` variables). If responsive variants are added the same way (`"sm:" + baseClass`), they will silently fail in production.

**Why it happens:**
Developers extract styles into data objects for DRY code, then concatenate or destructure class names at runtime. Tailwind can only detect statically analyzable strings.

**How to avoid:**
Never construct breakpoint-prefixed classes dynamically. Use complete static strings in lookup tables:

```typescript
// WRONG — sm: variant will be purged
const sizeClass = `sm:${baseSize}`;

// CORRECT — full string present in source
const mobileSizes: Record<string, string> = {
  small: "text-xs sm:text-sm lg:text-base",
  large: "text-base sm:text-lg lg:text-xl",
};
```

If a class truly must be dynamic, add it to `safelist` in `tailwind.config.js`.

**Warning signs:**
- Styles work in `npm run dev` but break in `npm run build` / production
- Cards or badges lose their colors in deployed version
- Responsive variants missing only in production

**Phase to address:** Every page — check all existing dynamic class patterns before adding responsive variants to them.

---

### Pitfall 4: Tables Without Proper Scroll Container Cause Full-Page Horizontal Scroll

**What goes wrong:**
Adding `overflow-x-auto` to a table's parent is not enough if any ancestor has `width: 100vw`, `min-width`, or conflicting `overflow` settings. The horizontal scrollbar attaches to the wrong container, or the entire page scrolls horizontally instead of just the table.

The kasa-raporu page already has a correct pattern (`<div class="overflow-x-auto">` wrapping the table), but the transaction page and site detail statistics table do not yet have this treatment. The kasa-raporu also has a sticky first column (`sticky left-0`) and sticky last column (`sticky right-0`) — these require careful z-index layering or the sticky column bleeds through other content during scroll.

**Why it happens:**
The overflow-x-auto must be on the immediate parent of the scrollable content, and no ancestor above it (up to the viewport) should have `overflow: hidden`. Missing either condition sends the overflow to the wrong scroll root.

**How to avoid:**

```html
<!-- CORRECT pattern -->
<div class="overflow-x-auto -mx-3 sm:mx-0">  <!-- negative margin to bleed to edge on mobile -->
  <table class="w-full min-w-[640px]">        <!-- min-w forces scroll before breaking -->
    ...
    <th class="sticky left-0 z-10 bg-white">  <!-- sticky column needs explicit bg -->
  </table>
</div>
```

For sticky columns, use `shadow-[4px_0_6px_-2px_rgba(0,0,0,0.1)]` (inset box-shadow) instead of `border-right` — borders do not scroll with sticky elements in Firefox.

**Warning signs:**
- Entire page has horizontal scrollbar at mobile sizes
- Sticky column "bleeds" through when scrolling (transparent background)
- Table scrolls but sticky column jumps or disappears
- iOS Safari: table doesn't scroll at all (missing `-webkit-overflow-scrolling: touch` on older iOS, or `overflow: hidden` on ancestor)

**Phase to address:** Table-containing pages — transactions, site/partner/financier detail stats, kasa-raporu sticky columns.

---

### Pitfall 5: Recharts `ResponsiveContainer` Collapses When Parent Has No Explicit Height

**What goes wrong:**
`<ResponsiveContainer width="100%" height="100%">` renders with zero dimensions when the parent container uses `height: auto`. The chart renders invisible (0px × 0px). This is already a latent issue in the `OverviewChart` component — the dashboard wraps it in `<div className="h-[220px] sm:h-[300px] w-full">`, which is correct. But if any responsive work removes or changes that wrapper (e.g., making it `h-auto` for mobile), the chart disappears.

**Why it happens:**
`height="100%"` on `ResponsiveContainer` means "100% of the parent's explicit height". If the parent is `h-auto`, 100% of auto is 0. This is a long-standing Recharts behavior documented in multiple GitHub issues.

**How to avoid:**
Always wrap charts in a div with an explicit pixel height (or aspect-ratio with explicit width):

```tsx
{/* CORRECT — explicit px height, responsive via breakpoints */}
<div className="h-[200px] sm:h-[280px] lg:h-[320px] w-full">
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart ...>
```

Never use `h-full` or `h-auto` as the chart wrapper on mobile without a parent that also has explicit height.

Also watch YAxis `width` (currently hardcoded `width={45}`) — large financial numbers in TL (e.g., "₺1.250k") need wider YAxis or text gets clipped. Make it dynamic or increase to 60px.

**Warning signs:**
- Chart area is blank on mobile but visible on desktop
- `[Recharts] The width(0) and height(0) of chart should be greater than 0` warning in browser console
- Chart appears after window resize but not on initial load

**Phase to address:** Dashboard and organization analytics pages (both use Recharts).

---

### Pitfall 6: shadcn/ui Dialog Does Not Restrict to Viewport on Mobile

**What goes wrong:**
The default shadcn/ui `DialogContent` has `max-w-lg` fixed — no mobile override. On a 375px screen, the dialog is wider than the viewport, causing horizontal overflow and cutoff. Additionally, when dialog content is taller than the screen, there is no internal scroll — the content is clipped at the bottom and the close button may be unreachable.

The transaction page uses `Dialog` extensively for forms (deposit, withdrawal, delivery, etc.). On mobile these dialogs will overflow unless fixed.

**Why it happens:**
shadcn/ui ships a minimal base — responsive width and scrollable body are left to the implementer. The default class `max-w-lg` becomes `100vw` at `lg` but does nothing at `sm`.

**How to avoid:**
Update `dialog.tsx` in the ui components to add mobile-safe sizing:

```typescript
// In dialog.tsx — update DialogContent className
"fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100vw-32px)] sm:max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 sm:p-6 shadow-lg max-h-[90dvh] overflow-y-auto"
```

Key additions:
- `max-w-[calc(100vw-32px)]` — 16px margin each side on mobile
- `max-h-[90dvh]` — caps height so content stays in viewport (use `dvh` for iOS Safari address bar)
- `overflow-y-auto` — enables scroll inside the dialog instead of clipping

**Warning signs:**
- Dialog has horizontal scrollbar at 375px
- Form fields below the fold are unreachable on mobile
- Close (X) button is off-screen
- Dialog content jumps when scrolling inside on iOS

**Phase to address:** Foundation pass on dialog.tsx before working on transaction and approval pages.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Adding `overflow-hidden` to silence horizontal scroll | Quick fix, no layout thought required | Breaks sticky header, sidebar on mobile | Never — use `overflow-x: clip` |
| Hiding content with `hidden sm:block` instead of responsive layout | Simpler code, less work | Important data unavailable on mobile; creates two code paths to maintain | Only for truly desktop-only affordances (keyboard shortcuts, etc.) |
| Hardcoding pixel heights for chart wrappers | Works today | Charts look cramped on 375px if not updated with responsive breakpoints | Acceptable if breakpoint variants are added simultaneously |
| Concatenating Tailwind breakpoint classes dynamically | DRY code | Classes purged in production | Never — use complete static strings in lookup tables |
| Skipping test on real device, testing only in browser DevTools | Faster development | iOS Safari has known scroll bugs not replicated in DevTools | Development only — test on real device before marking page done |

---

## Integration Gotchas

Common mistakes when working with the specific libraries in this stack.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Recharts `ResponsiveContainer` | Wrapping in `h-auto` div on mobile | Always use explicit pixel height: `h-[200px] sm:h-[280px]` |
| shadcn/ui `Dialog` | Using default `max-w-lg` on mobile | Override with `max-w-[calc(100vw-32px)] sm:max-w-lg max-h-[90dvh] overflow-y-auto` |
| shadcn/ui `Sheet` (mobile sidebar) | Not testing Sheet open state with sticky header present | Sheet uses `z-50`; ensure z-index stack does not conflict with sticky header `z-30` |
| Radix UI scroll-body removal | Dialog opening causes layout shift (scrollbar disappears) | Add `scrollbar-gutter: stable` to `html` in global CSS |
| Tailwind `sticky` class | Any ancestor has `overflow-hidden` | Audit ancestor chain; replace `overflow-hidden` with `overflow-clip` |
| Tailwind `truncate` class | Truncates with `overflow: hidden` which can break sticky in ancestor role | Use on leaf text nodes only, never on containers that have sticky descendants |

---

## Performance Traps

Patterns that cause visual or interaction degradation at mobile scale.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| All 20+ pages share a single `use-api.ts` with no code splitting | Slow initial load on mobile (slow 4G) | Use `next/dynamic` for page-specific heavy components; already done for `OverviewChart` — extend pattern | When bundle grows; already borderline |
| Large financial tables rendered fully client-side with no virtualization | 300-row table freeze on low-end Android | Use pagination (already exists in transactions page); confirm other tables are also paginated | Tables exceeding ~100 rendered rows |
| Recharts rendering all data points at 375px with tiny chart width | Overlapping X-axis labels, illegible chart | Reduce tick count at mobile breakpoints: `<XAxis tick={{ fontSize: 9 }} interval={1}>` | Any chart with >7 data points at <640px |

---

## UX Pitfalls

Common user experience mistakes specific to mobile financial dashboards.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing all table columns on mobile (site detail stats has 8+ columns) | User cannot read any column; table is a blur of numbers | Hide low-priority columns on mobile (`hidden sm:table-cell`) or replace table with a card list at mobile |
| Financial numbers without `min-w` on mobile in flex row | Numbers wrap to two lines mid-number ("1.250" / "TL") or get truncated | Use `shrink-0` and `min-w-0` correctly on flex children; financial amounts: `flex-shrink-0 tabular-nums` |
| Touch targets under 44px on mobile (compact buttons in site detail header) | Mis-taps, frustration | Ensure `h-8` buttons become `h-10 sm:h-8` — 44px minimum at mobile |
| Long Turkish financial labels without wrapping (e.g., "Tes.Kom." in 8-column table) | Header and cell misalign at mobile widths | Abbreviate in mobile headers, show full label at `sm:` and above |
| Form dialogs with many fields scrolled off screen | User submits incomplete form without realizing | `max-h-[90dvh] overflow-y-auto` on dialog + sticky footer with submit button |

---

## "Looks Done But Isn't" Checklist

Things that appear complete during desktop browser testing but are missing critical pieces.

- [ ] **overflow-x fix:** Added `overflow-x-auto` to table wrapper — verify no ancestor has `overflow-hidden` breaking scroll; test on actual iOS Safari, not just Chrome DevTools
- [ ] **Sticky sidebar:** Hamburger menu works on desktop — verify Sheet open/close on 375px iOS; confirm sidebar does not render underneath content at `md` breakpoint
- [ ] **Dialog on mobile:** Transaction forms open — verify they do not overflow viewport horizontally; confirm scroll inside tall forms works; test that close button is reachable
- [ ] **Chart on mobile:** Chart visible in development — verify height > 0 at 375px in production build; check Y-axis number labels not clipped
- [ ] **Financial numbers:** Numbers display on desktop — verify they do not wrap or truncate mid-value on 375px (especially TL amounts with thousands separators like "1.234.567,89")
- [ ] **Responsive breakpoints:** Classes added — verify in actual browser at 375px, 768px, 1024px widths (not just desktop viewport scaled down)
- [ ] **Touch targets:** Buttons visible on mobile — verify minimum 44×44px tap area for all interactive elements at 375px
- [ ] **Dark mode compatibility:** Responsive classes added — verify sticky column backgrounds use dark mode variants (`bg-white dark:bg-slate-900`) not just `bg-white`

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| `overflow-hidden` deployed to production breaking sticky header | LOW | Replace `overflow-hidden` → `overflow-x-clip` on the one offending ancestor; no other changes needed |
| Dynamic Tailwind class purged in production | LOW | Add class to `safelist` array in `tailwind.config.js` or rewrite as static string; rebuild |
| Dialog overflow discovered after page "done" | MEDIUM | Update `dialog.tsx` once — fix applies to all dialogs across all pages |
| Recharts chart invisible on mobile in production | LOW | Ensure explicit pixel height on wrapper div; single component change |
| Full table horizontal scroll on wrong container | LOW-MEDIUM | Move `overflow-x-auto` to correct ancestor; add `min-w-[Xpx]` to table; test sticky columns |
| Sticky column backgrounds missing dark mode | LOW | Add `dark:bg-slate-800` (or appropriate token) to all sticky cells; grep for `sticky left-0` or `sticky right-0` to find all instances |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| `overflow-hidden` breaks sticky | Phase 1 (Foundation) — establish `overflow-x: clip` rule before any page work | grep codebase for `overflow-hidden` on containers; confirm sticky header still works after |
| Backwards breakpoint usage | Phase 1 (Foundation) — audit all unprefixed layout classes | Manually resize browser to 375px on each page as first check |
| Dynamic class purge | Every phase — code review step before marking page done | Run `npm run build` and test in production mode before closing any page |
| Dialog mobile overflow | Phase 1 (Foundation) — update `dialog.tsx` once | Test transaction form dialog at 375px before any transaction page work |
| Table without scroll container | Phase for each table-containing page (transactions, site detail, kasa-raporu sticky) | Horizontal scroll test on each table at 375px |
| Recharts collapse on mobile | Phase for dashboard and organization pages | Check browser console for Recharts width/height warnings at 375px |
| Financial number wrapping | Phase for each data-displaying page | Test `formatMoney()` output of a 7-digit number (e.g., 1234567.89 → "1.234.567,89 TL") at 375px |
| Touch target size | Final QA phase | Touch every interactive element on real device or DevTools touch mode |

---

## Sources

- [Tailwind CSS Responsive Design — Official Docs](https://tailwindcss.com/docs/responsive-design) (HIGH confidence)
- [position:sticky not working? Try overflow:clip — Terluin Web Design](https://www.terluinwebdesign.nl/en/blog/position-sticky-not-working-try-overflow-clip-not-overflow-hidden/) (MEDIUM confidence — widely cited, cross-verified with MDN)
- [Getting stuck: all the ways position:sticky can fail — Polypane](https://polypane.app/blog/getting-stuck-all-the-ways-position-sticky-can-fail/) (MEDIUM confidence)
- [shadcn/ui Dialog overflow issues — GitHub Issue #8098](https://github.com/shadcn-ui/ui/issues/8098) (HIGH confidence — official issue tracker)
- [shadcn/ui Dialog responsive width — GitHub Issue #6538](https://github.com/shadcn-ui/ui/issues/6538) (HIGH confidence — official issue tracker)
- [shadcn/ui Tabs mobile overflow — GitHub Issue #2740](https://github.com/shadcn-ui/ui/issues/2740) (HIGH confidence — official issue tracker)
- [Recharts ResponsiveContainer not filling height — GitHub Issue #1545](https://github.com/recharts/recharts/issues/1545) (HIGH confidence — official issue tracker)
- [Tailwind dynamic class names — GitHub Discussion #6763](https://github.com/tailwindlabs/tailwindcss/discussions/6763) (HIGH confidence — Tailwind Labs official response)
- [Horizontal scrolling on iOS Safari bug — tailwindlabs/discuss #384](https://github.com/tailwindlabs/discuss/issues/384) (MEDIUM confidence)
- [Radix UI scrollbar layout shift — GitHub Discussion #1100](https://github.com/radix-ui/primitives/discussions/1100) (HIGH confidence — Radix official repo)
- [Sticky column implementation in Tailwind — CSS-Tricks](https://css-tricks.com/a-table-with-both-a-sticky-header-and-a-sticky-first-column/) (MEDIUM confidence)

---

*Pitfalls research for: Responsive CSS retrofit of FinansPro v3 (Tailwind CSS 3.4.1 + shadcn/ui + Recharts + Next.js 15)*
*Researched: 2026-02-28*
