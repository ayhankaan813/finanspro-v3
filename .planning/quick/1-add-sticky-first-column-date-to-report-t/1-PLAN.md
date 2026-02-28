---
phase: quick-sticky-date-column
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/frontend/src/app/(dashboard)/reports/monthly/page.tsx
  - apps/frontend/src/app/(dashboard)/financiers/[id]/page.tsx
autonomous: true
requirements: [STICKY-DATE-01]

must_haves:
  truths:
    - "When user scrolls the monthly report table horizontally, the Tarih column stays pinned on the left"
    - "When user scrolls the financier detail table horizontally, the TARIH column stays pinned on the left"
    - "Sticky date column has a visible background so text behind it does not bleed through"
  artifacts:
    - path: "apps/frontend/src/app/(dashboard)/reports/monthly/page.tsx"
      provides: "Sticky first column on monthly report desktop table"
      contains: "sticky left-0"
    - path: "apps/frontend/src/app/(dashboard)/financiers/[id]/page.tsx"
      provides: "Sticky first column on financier detail table"
      contains: "sticky left-0"
  key_links:
    - from: "kasa-raporu/page.tsx sticky pattern"
      to: "monthly + financier tables"
      via: "same CSS classes: sticky left-0 z-10 bg-inherit"
      pattern: "sticky left-0 z-10"
---

<objective>
Add sticky first column (date/label) to the monthly report table and financier detail table, so the date column stays pinned when the user scrolls horizontally on narrow screens.

Purpose: On mobile or narrow viewports these wide tables scroll horizontally. Without a sticky first column the user loses context of which row they are reading. The kasa-raporu page already implements this pattern successfully.

Output: Two modified page files with sticky first column behavior matching the kasa-raporu reference.
</objective>

<execution_context>
@/Users/emreyilmaz/.claude/get-shit-done/workflows/execute-plan.md
@/Users/emreyilmaz/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
Reference pattern (kasa-raporu/page.tsx — already implements sticky first column):

```tsx
// thead th (first col):
<th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/50 px-2 sm:px-4 py-3 text-left font-semibold ...">

// tbody td (first col):
<td className="sticky left-0 z-10 bg-inherit px-2 sm:px-4 py-2.5 font-medium ...">

// tfoot td (first col):
<td className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 px-2 sm:px-4 py-3 font-bold ...">
```

Key details:
- `sticky left-0` pins the column
- `z-10` keeps it above scrolling siblings
- `bg-inherit` on tbody rows inherits the row's background (handles alternating / hover)
- thead/tfoot need explicit background color matching their section's bg
- kasa-raporu also has a sticky LAST column (KASA) with a left shadow — we do NOT need that here

NOTE: The daily report page (reports/daily/page.tsx) was reviewed and does NOT need sticky column treatment. Its transactions table only has 5 narrow columns and uses a card layout on mobile (hidden sm:table). It would not overflow horizontally.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add sticky date column to monthly report table</name>
  <files>apps/frontend/src/app/(dashboard)/reports/monthly/page.tsx</files>
  <action>
In the desktop table (the `<table className="w-full hidden sm:table">` block around line 315):

1. **thead th (Tarih column, line ~318):**
   Current: `<th className="py-4 px-4 text-sm font-semibold text-left whitespace-nowrap">Tarih</th>`
   Change to: `<th className="sticky left-0 z-10 bg-twilight-900 py-4 px-4 text-sm font-semibold text-left whitespace-nowrap">Tarih</th>`
   (Add `sticky left-0 z-10 bg-twilight-900` — the thead row uses `bg-twilight-900 text-white` so the th must match)

2. **tbody td (date cell in each row, line ~332-333):**
   Current: `<td className="py-3 px-4 text-sm text-twilight-700 font-medium whitespace-nowrap">`
   Change to: `<td className="sticky left-0 z-10 bg-white py-3 px-4 text-sm text-twilight-700 font-medium whitespace-nowrap">`
   (Use `bg-white` since these rows have white background. Cannot use `bg-inherit` here because the row itself does not set an explicit bg — the hover is `hover:bg-twilight-50/50` which is a pseudo-class and won't be inherited. Use `bg-white group-hover:bg-twilight-50` to match hover state.)

   Actually, looking at the row: `<tr ... className="hover:bg-twilight-50/50 transition-colors group">` — it uses `group` class. So the td should use:
   `sticky left-0 z-10 bg-white group-hover:bg-twilight-50/50`

3. **tfoot td (TOPLAM row, line ~364):**
   Current: `<td className="py-4 px-4 text-sm text-left whitespace-nowrap">TOPLAM</td>`
   Change to: `<td className="sticky left-0 z-10 bg-twilight-900 py-4 px-4 text-sm text-left whitespace-nowrap">TOPLAM</td>`
   (Footer uses `bg-twilight-900` so the td must match)

Do NOT touch the mobile card view (`<div className="sm:hidden ...">`) — it does not use a table and does not scroll horizontally.
  </action>
  <verify>
    <automated>cd "/Users/emreyilmaz/Desktop/finanspro v3" && grep -c "sticky left-0" apps/frontend/src/app/\(dashboard\)/reports/monthly/page.tsx | grep -q "3" && echo "PASS: 3 sticky left-0 instances found" || echo "FAIL"</automated>
  </verify>
  <done>Monthly report desktop table has sticky first column (Tarih) on thead, tbody, and tfoot. Background colors match each section so no text bleed-through occurs.</done>
</task>

<task type="auto">
  <name>Task 2: Add sticky date column to financier detail table</name>
  <files>apps/frontend/src/app/(dashboard)/financiers/[id]/page.tsx</files>
  <action>
This table has nested scroll containers: `max-h-[65vh] overflow-y-auto` > `overflow-x-auto` > `table`. The thead is already `sticky top-0 z-10` and tfoot is `sticky bottom-0 z-10`. Adding `sticky left-0` to the date column creates a "corner cell" effect on the date th — it must stick both top and left simultaneously, requiring a higher z-index (z-20).

1. **thead th (TARIH column, line ~318):**
   Current: `<th className="w-[28px] sm:w-[70px] px-1 sm:px-3 py-1.5 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-twilight-600 uppercase whitespace-nowrap">TARIH</th>`
   Change to: `<th className="sticky left-0 z-20 bg-twilight-50/95 w-[28px] sm:w-[70px] px-1 sm:px-3 py-1.5 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-twilight-600 uppercase whitespace-nowrap">TARIH</th>`
   (z-20 because it is also sticky top-0 via the thead — needs to be above both scroll axes. Background must match the thead row's `bg-twilight-50/95`.)

2. **tbody td — daily rows (line ~343):**
   Current: `<td className="px-1 sm:px-3 py-1 sm:py-2.5 text-[10px] sm:text-sm font-medium text-twilight-900 whitespace-nowrap">{day.day}</td>`
   Change to: `<td className="sticky left-0 z-10 bg-white px-1 sm:px-3 py-1 sm:py-2.5 text-[10px] sm:text-sm font-medium text-twilight-900 whitespace-nowrap">{day.day}</td>`

3. **tbody td — monthly rows (line ~362):**
   Current: `<td className="px-1 sm:px-3 py-1 sm:py-2.5 text-[10px] sm:text-sm font-medium text-twilight-900 whitespace-nowrap">{row.monthName}</td>`
   Change to: `<td className="sticky left-0 z-10 bg-white px-1 sm:px-3 py-1 sm:py-2.5 text-[10px] sm:text-sm font-medium text-twilight-900 whitespace-nowrap">{row.monthName}</td>`

4. **tfoot td (TOPLAM row, line ~377):**
   Current: `<td className="px-1 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-bold whitespace-nowrap">TOPLAM</td>`
   Change to: `<td className="sticky left-0 z-20 bg-twilight-900 px-1 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-bold whitespace-nowrap">TOPLAM</td>`
   (z-20 because tfoot is also sticky bottom-0. Background matches `bg-twilight-900`.)

Note: The daily rows and monthly rows share the same tbody but are conditionally rendered (selectedMonth ternary). Both branches need the sticky treatment on their first td.
  </action>
  <verify>
    <automated>cd "/Users/emreyilmaz/Desktop/finanspro v3" && grep -c "sticky left-0" apps/frontend/src/app/\(dashboard\)/financiers/\[id\]/page.tsx | grep -q "4" && echo "PASS: 4 sticky left-0 instances found" || echo "FAIL"</automated>
  </verify>
  <done>Financier detail table has sticky first column (TARIH/day/monthName) on thead, both tbody branches (daily and monthly), and tfoot. Corner cells (thead + tfoot) use z-20 to stay above both scroll axes. Background colors are explicit to prevent bleed-through.</done>
</task>

</tasks>

<verification>
1. `grep -n "sticky left-0" apps/frontend/src/app/(dashboard)/reports/monthly/page.tsx` -- should show 3 matches (thead, tbody, tfoot)
2. `grep -n "sticky left-0" apps/frontend/src/app/(dashboard)/financiers/[id]/page.tsx` -- should show 4 matches (thead, daily tbody, monthly tbody, tfoot)
3. Visual check: Open monthly report on a narrow browser window (< 640px width), scroll table horizontally -- Tarih column should stay pinned
4. Visual check: Open financier detail page, scroll table horizontally -- TARIH column should stay pinned; scroll vertically -- both date column and header row should remain visible
</verification>

<success_criteria>
- Monthly report table: Tarih column is sticky on horizontal scroll with correct backgrounds (twilight-900 for header/footer, white for body rows)
- Financier detail table: TARIH column is sticky on horizontal scroll with correct backgrounds and z-20 on corner cells (header + footer that are also vertically sticky)
- No text bleed-through on any sticky cell
- No visual regressions on desktop (wide viewport where no scrolling occurs)
</success_criteria>

<output>
After completion, create `.planning/quick/1-add-sticky-first-column-date-to-report-t/1-SUMMARY.md`
</output>
