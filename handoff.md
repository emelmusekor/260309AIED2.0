# Handoff
## Fixes Completed
- Renamed the publishable site folder from aied-web to docs so GitHub Pages can deploy the static archive from a conventional docs root.
- Updated .github/workflows/static.yml to upload docs/ instead of aied-web/ and to trigger on master, main, and the current working branch.
- Added docs/.nojekyll and stopped tracking Python __pycache__ output so deployment artifacts stay focused on the actual static site.
- Workbook source-page previews now lazy-render only when opened, which removes a large block of hidden thumbnail DOM from every report card and directly targets the scroll-freeze issue on long subpages.
- Workbook sections now behave like a one-page-at-a-time interactive reader with previous/next controls and page chips instead of dumping the whole workbook into one long scroll.
- Workbook source-page access is removed from the header PDF shortcut and per-workbook cards, and the workbook cover no longer opens the original page.
- Shared workbook inputs for class/name are removed by filtering student_class and student_name fields before pages render.
- Secondary workbook page 7 now includes six added boxes covering the improved-prompt rows plus the two lower reflection areas.
## Tests Run
- git diff --check passes aside from Git's LF-to-CRLF warnings on docs/shared/viewer.css, docs/shared/viewer.js, and the updated text files.
- Static inspection confirmed the site entry HTML files now live under docs/ and the Pages workflow artifact path also points at docs/.
- Attempted python build_report_site.py previously, but python and py are unavailable in this environment.
## Remaining Issues
- GitHub repository Pages settings may still need to point at GitHub Actions or the docs folder, depending on how the repository is configured today.
- Browser-based verification is still needed for the new workbook reader flow, page-switch behavior, long-scroll smoothness, and the exact fit of every workbook input overlay.
- Additional workbook pages may still need manual overlay adjustments after visual review, especially in the elementary bundle and later secondary pages.
- Search/filter interaction inside the new workbook reader still lacks automated regression coverage.
## Next Recommended Improvements
1. Push this docs-based restructure and verify the live Pages URL resolves docs/index.html at the repository root.
2. Open both workbook bundles in a browser and visually audit page-by-page overlay fit, starting with elementary early pages and later secondary activity pages.
