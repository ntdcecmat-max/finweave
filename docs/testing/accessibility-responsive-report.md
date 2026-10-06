# Accessibility, Responsive và Visual Report — M2

TST-ACC-001 · v1.0 · 06/10/2026. Agent review + Chrome automation; không WCAG certification/screen reader audit, không thiết bị mobile thật hay participant research. Kết quả cuối phải đọc cùng [Acceptance](frontend-acceptance-report.md); reports/screenshot lịch sử không bị thay thành PASS.

## Phạm vi đo và evidence

B12 mở đủ16 tab nghiệp vụ + `/design` ×3 viewports =51 render; AUTH-UI07 mở7 auth views ×3 =21 render. Total72 representative page renders; không nói mọi dialog/state được axe. Lượt full cuối kiểm lại 72 render, 0 violations và không page overflow; reports theo width: [1440](../execution/evidence/step6-accessibility-1440.json), [390](../execution/evidence/step6-accessibility-390.json), [360](../execution/evidence/step6-accessibility-360.json), [auth](../execution/evidence/step6-auth-accessibility.json). Gate assertion chặn critical/serious; report đếm cả moderate/minor thực tế.

Automated B11: keyboard dialog trap/Escape/focus return; B13 mobile form/preview/error/sharedpanel +headerhitarea; B19 contextual entry across widths; B21 reduced motion; B12 chart table fallback and privacy masking at every route. Source code chart has keyboard buttons/table alternatives, VND và nhãn **tr=triệu VND**, source/asOf and known-only partial-asset label. Tokens Segoe/system Vietnamese fallback, tabular numerals, body16/24, secondary14, meta12/18; layout cards2columns desktop/1mobile, mobile5nav fixed bottom plus contentpadding, table scroll inside card. No hidden SVG/chart or unmasked money retained when masked in tested renders.

Direct in-app browser: 1440×900 Home cashform via Enter, snapshot1→2 cash31.1m→31.05m; Food450k and drill-down retains period/scope; 390×844 transaction responsive cards/detail with ledger−50k/source/date/versions/history, Escape returns to original transaction button; 360×844 Data/source/cards/importpreview202job/Review evidence with overflowfalse. Reload is intentional F-COMPLETE reset, not durablebackend. Additional final Plan/Goals/simulation and AI/history/panel screenshots are indexed in [manual browser record](../execution/evidence/step6-manual-review.json). Initial IAB idle-interception error is retained in defectlog, then recovery checked without a page reload. Manual AI mixed simulation/goal prompt exposed intent priority; corrected final-build E11 screenshots were viewed directly: simulated cash26.1m/assets71.1m and actual unchanged; report names Food/Shopping tied400k. Before-fix manual AI images remain labelled as historical findings. Full-page captures may repeat fixed chrome during stitching; viewport screenshots are the layout proof.

## Visual comparison with references

40 reference images were directly inspected/catalogued at Step3 ([catalogue](../design/reference-catalogue.md)). Step6 directly re-opened the following8; comparisons are agent judgement from screenshots, not perceptual-diff algorithm or user preference result. No concept screenshot is a UI component/asset; no copied logos, billing, dollar figures, marketing probabilities, foreign features or full mascot concept image.

| Reference file within References | Render/component comparison | Chosen adjustment / evidence |
|---|---|---|
| Khung ứng dụng dùng chung/00-01-app-shell-sidebar.jpg | Lucide outline functionalicons, whitespace, selectednav; five primary groups | Utility auth/design/demo separate; no billing/upgrade; B12 allroute screenshots |
| Home - Tổng quan & Báo cáo/01-02-money-summary.jpg | Large money hierarchy, grouped summary, quietcards | Greenhero VND/cash and separate trackedassets; sources/time/formula; manual-home/cash screenshots |
| Home - Tổng quan & Báo cáo/01-06-expense-category-chart.png | Ranked category values/percent and green semantics | Bars+fullVNDtable for net spending; gross/refunddrilldown and tiedleaderlabels; B02/E08 |
| Transaction 02.png | Filters and visible list state | Human labels insteadofrawIDchips; local search/account/category/posting/recon; desktoptable/mobilecards with accessibleeventbuttons; B06/B12/mobile screenshot |
| 03-02-plan-cash-forecast.png | Baseline/conditional forecast | Finite explicit assumptions/dated steps, actual unchanged; no MonteCarlo/successprobability; B07/B09/B20 |
| Goal 03.jpg | Readable progress/card grouping on smallscreen | Cash-backed allocated/funded/remaining/shortfall instead of health/gamification score; B08/goals screenshots |
| AI Agent 06.png | Composer, contextual panel and history | Own small codeSVG mascot sharedheader, read-onlyscripted result/evidence, sharedfull/panelstate; no borrowedlogo/image/advice; B10/N04/S6E04/E07 |
| Khung ứng dụng dùng chung/00-07-privacy-mask.jpg | Clear privacy state affordance | Wholeapp amount/quantity/chart/text masking; no fakebiometric/securityfeature; B12/B10/B21 |

Dữ liệu/Review has no matching dedicatedreference screen; business source/evidence/preview/raw-normalized/error/job requirements define the layout, using same cards/badges/form/table/focus tokens. Auth also derived from agreed session flows and same typography; no realOAuth/billing added. These assumptions were already declared in design specification, kept consistent.

## Limits/backlog

Semantic colors match the rendered tokens: actual/income green, expense warm red, refund blue, planned purple (#6654a4), simulated gold/brown (#88601a), unknown gray-green (#60716b), warning amber. Charts use matching labelled series; color alone never defines money classification. Images have known reference-rights limits; actual brand/mascot SVG repo-authored. Dense evidence UUID/meta wraps; small type is metadata, money/controls remain prominent. Bundle optimization P3 recorded; no production cold-start claim. Research0 participants; no actual user test or PO external sign-off.
