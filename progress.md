# Progress
- 2026-03-10: Lazy workbook editors now render on demand, workbook items without editable pages are filtered out, and empty workbook sections no longer render.
- 2026-03-10: Navigation now only includes normalized sections so removed workbook sections no longer leave dead anchors in the menu.
- 2026-03-10: The mobile menu button now exposes aria-controls and aria-expanded, closes on Escape, and automatically clears menu-open when the viewport leaves the mobile breakpoint so desktop scrolling cannot get stuck.
- 2026-03-10: Page and keyword modals now expose dialog semantics, restore keyboard focus to a sensible trigger when they close, and let Escape close only the topmost open overlay.
- 2026-03-10: Added visible focus rings for links, buttons, summaries, and non-canvas inputs so keyboard navigation stays trackable outside the worksheet overlays.
- 2026-03-10: Reduced runtime fragility by adding requestAnimationFrame and IntersectionObserver fallbacks and by replacing Object.fromEntries and URLSearchParams usage in the viewer path.
- 2026-03-10: Verification is limited to static checks because this environment currently has no working python, py, Node, Playwright, or browser harness.
