# Handoff
## Fixes Completed
- Removed archive/dev-oriented hero descriptions and footer notes from the live viewer output, so users now land on clean titles without “reconstructed from compressed report” style copy in either language.
- Normalized guide/workbook title presentation to the requested naming scheme and removed the guide-page “본문 바로 보기” action in favor of cleaner browse + paired-page shortcuts.
- Rebuilt the English and Korean info pages into one scrollable info page per language, each with the same top menu and three publication-info sections for AI교육 2.0, 협력 가이드(초등), 협력 가이드(중등).
- Added an explicit memo-box arrangement mode so user-created workbook note boxes can be moved or deleted only after entering layout-edit mode.
- Fixed the top-menu routing bug by deriving the three header links from each page's own `reportSwitches`, so the root archive pages and the nested report pages now point to valid relative URLs again.
- Reordered the top menu to the requested three-guide structure and made guide/workbook hero actions cross-link the matching elementary or secondary companion page.
- Removed the worksheet mail-send button and related copy, so workbook editing now stays focused on reset/download without teacher-email messaging.
- Added memo-box, freehand draw, check-mark, and clear-mark tools to workbook pages and included those marks in exported PDFs.
- Expanded elementary workbook overlays for pages 43, 44, and 55 after another visual audit so the debate worksheet, rating table, and follow-up reflection tables no longer miss core answer areas.
- Confirmed the GitHub Pages workflow rerun on `master` now finishes successfully, so the earlier Pages failure is no longer active after the branch policy/default-branch cleanup.
- Added compact choice-based workbook controls for 1-5 ratings and checkbox-style marks, so score tables and yes/no style checks stop forcing free-text input.
- Expanded secondary workbook overlays again after another visual pass, including the checkbox row on PDF 42 and separate row-by-row inputs on PDF 77.
- Lightened worksheet box borders/backgrounds and moved the choice UI into transparent shells so overlay boxes hide less of the original workbook prompts.
- Kept the earlier one-page-at-a-time workbook reader and no-class/no-name filtering intact while layering the new input controls on top.
## Tests Run
- `git diff --check` passes after the latest navigation/info/viewer cleanup.
- Visual spot checks against the source workbook art for elementary pages 43, 44, 55 and secondary page 7 still match the intended overlay structure after the UI cleanup pass.
- `gh run list --workflow "Deploy static content to Pages" --limit 5` shows the `master` Pages workflow completed successfully after rerun.
- Repeated visual checks against original workbook page images for secondary pages 8, 10, 17, 22, 24, 42, 44, 77, 82, 108 and elementary pages 17, 19, 20, 21, 43, 44, 48, 55, 62.
- Browser/build verification is still blocked here because `python`, `py`, Node, and browser automation tools are unavailable in this environment.
## Remaining Issues
- The new static info pages and viewer header links still need a live GitHub Pages/browser pass to confirm every relative path resolves correctly after deployment.
- A real browser pass is still needed to confirm exact overlay placement, memo-box sizing, and tap comfort after the new memo/draw/check tooling changes.
- Some later workbook pages may still need page-specific overlay tuning if visual review in-browser reveals any remaining missing boxes, oversized boxes, or drawing-heavy pages that need more presets.
- Search/filter interaction inside the workbook reader still lacks automated regression coverage.
## Next Recommended Improvements
1. Open both workbook bundles in a browser and do a page-by-page overlay fit check, starting with the newly updated elementary pages 43, 44, and 55 plus the secondary rating/check pages.
2. Add a few more page-specific overrides if any remaining workbook pages still miss answer areas or need better default note-box placement.
3. Once a runtime is available, run the static build/test flow and then push the verified fixes on `master`.
- Redirected the old report-specific info entry points to the shared Korean info page so duplicate stale info screens no longer remain reachable from old deep links.
- The new redirect-only legacy reports/*/info/ pages still need a live GitHub Pages/browser pass to confirm the shared info page opens immediately without cache artifacts.
