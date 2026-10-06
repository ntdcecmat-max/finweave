# ADR-001 — Frontend dùng xuyên M1 → M2

ARC-ADR-001 · v0.1 · 05/10/2026 Asia/Saigon · implemented choice / in-review. Owner/reviewer: AG tự review; PO formal review pending. Requirement baseline: scope-v2/analysis-v2 (28 AC), không đổi scope. Quyền bước 3 trong chat thay giới hạn nhiệm vụ bước 2 cũ.

## Hiện trạng trước scaffold

Đã kiểm kê root nguồn, các thư mục cha và hidden files: không package.json, lockfile, app, test hoặc AGENTS.md/rules riêng; root chứa bốn tài liệu FinWeave, navigations.md, docs và 40 ảnh References. Chưa có Git repository đã xác nhận bằng kiểm kê; lệnh Git trong sandbox báo permission denied, không dùng lỗi này làm chứng cứ Git sạch. Node PATH 26.1.0/npm 11.13.0; runtime bundled Node 24.19.0. Không cài hay thay runtime hệ thống. Bộ hồ sơ v2 và 18 oracle cốt lõi giữ nguyên; 10 AC mới vẫn bắt buộc.

Workspace kiểm chứng/bàn giao: bản tại outputs/FinWeave-M1. Source project ở Downloads được đọc làm input; khi bàn giao đồng bộ code và các hồ sơ execution/design đã thay đổi về đúng project nguồn, giữ nguồn ý tưởng và archive lịch sử. Bản outputs là snapshot bàn giao cùng version, không baseline yêu cầu khác. Npm cache dùng work/, không ghi finance thật. Không clone Sure/Firefly/Ghostfolio hoặc chọn Rails/backend.

## Lựa chọn trước khi scaffold

| Lớp | Chọn / pin trực tiếp | Căn cứ và tradeoff |
|---|---|---|
| Framework/build | React/React DOM 19.3.0; Vite 8.3.2; plugin-react 6.1.2; TS 5.9.3 strict | SPA có nhiều trạng thái tương tác, không có yêu cầu SEO/SSR. Vite hỗ trợ React TS; plugin peer Vite ^8. Node24.19 thỏa engine ^20.19 hoặc >=22.12. TS5.9 đáp ứng Zod và MSW; tránh chuyển TS7 chỉ để dùng latest |
| Routing | react-router 8.4.0, declarative BrowserRouter | Năm navigation, tabs và object deep links; URL giữ period/scope/filter. Engine >=22.22 được Node24.19 đáp ứng; React >=19.2.7 được19.3 đáp ứng |
| Styling/components | CSS custom properties và CSS responsive nội bộ; Radix Dialog1.1.23, native select/table | CSS ít công cụ, tokens một nguồn; dialog trap/focus/Escape nền đã có. Chưa cần Tailwind/shadcn/TanStack Table cho dataset≤20; style tùy chỉnh FinWeave thay theme mặc định |
| Form/schema | react-hook-form7.89.0; resolvers5.9.1; Zod4.6.5 | Giữ input/field error, schema dùng lại ở demo command boundary. Resolver hỗ trợ RHF ^7.55 và Zod4. Validation client không authorization |
| Fetch/cache/state | TanStack Query5.104.1; fetch+AbortController; context cho privacy/chat; URL filters | Read/mutation cùng service boundary; commit trả snapshot mới và setQueryData, lỗi/version cần refetch/re-preview. Memory demo repository phía MSW là một nguồn; không giữ report trong global store thứ hai |
| Charts | ECharts6.1.0 modular SVG renderer, bar/pie/line | Tái dùng cho cashflow/spend/assets/forecast; bảng và buttons drill-down có keyboard. Chart bị gỡ khi mask để không lộ hình học/tooltip; không cài chart lib khác |
| Tiền/ngày | decimal.js10.6.0; decimal strings; Intl vi-VN; date-only ISO +07 | Round-half-up mỗi holding; lượng vàng canonical chỉ. Không float hạch toán; date-only không bịa timestamp. Chart boundary mới đổi number |
| Icons/assets | lucide-react1.52.0; system Segoe UI/Arial; SVG logo/linh vật tự vẽ | Một bộ line icon. System font tiếng Việt, tabular numerals; không cần download font/ảnh thương hiệu. Thần Tài concept chỉ tham chiếu, static SVG gọn; không hứa sprite/Lottie |
| Mock network | MSW3.0.2 + memory synthetic store | M1 có demo service seam để tái sử dụng; chưa hợp đồng M2 đã nghiệm thu. Không provider/LLM/key. Disable demo mode không fallback success |
| Tests | Vitest5.0.3; Playwright1.63.0; axe-core/playwright4.13.0 | Unit oracle độc lập và browser walkthrough có evidence. Không chứng nhận WCAG/user research; chưa thực hiện bước4–6 hay gateM2 |

## Tài liệu chính thức đã kiểm tra

[React build from scratch](https://react.dev/learn/build-a-react-app-from-scratch), [Vite guide](https://vite.dev/guide/), [Router declarative installation](https://reactrouter.com/start/declarative/installation), [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog), [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview), [RHF repository](https://github.com/react-hook-form/react-hook-form) (website bị403, dùng repo chính thức), [Zod](https://zod.dev/), [ECharts modular imports](https://echarts.apache.org/handbook/en/basics/import/), [MSW](https://mswjs.io/docs/), [Vitest](https://vitest.dev/guide/), [Playwright configuration](https://playwright.dev/docs/test-configuration), [Decimal](https://github.com/MikeMcl/decimal.js), [Lucide license](https://lucide.dev/license). Đây là nguồn khả năng công cụ, không evidence app chạy.

Npm metadata đã đọc version/engines/peer/license trước cài. Direct deps MIT, trừ ECharts/TypeScript/Playwright Apache-2.0, Lucide ISC và axe wrapper MPL-2.0. Giữ license/notices dependency trong package; inventory thật sau cài nằm dependency-inventory.json. Chưa legal approval cho phát hành; không sao code/assets các app tham khảo AGPL. package.json dùng exact versions, package-lock có integrity; npm ci để tái lập. Không paid library/API/hosting.

## Kế thừa và giới hạn

Tái dùng shell/tokens/components/features/services sang M2. Bước4 cần schema/contract/auth/error/version/transport chính thức và gate boundary chống Ops; seam M1 không chứng minh yêu cầu đó. M1 là local synthetic memory, reload khôi phục fixture; không bền vững backend. Lựa chọn backend vẫn open. Không deploy public. Rollback thiết kế: tokens/layout thay độc lập domain/service; kiểm lại ảnh và 28AC sau thay đổi.

## Kiểm lại sau implementation (06/10/2026)

- 21 direct packages exact requested=installed;187 dependency entries trong lock (188 gồm root) gồm optional platform packages,162 installed packages trong inventory/notices. Build/typecheck/tests bằng Node24.19.0. npm installer đầu phiên dùng Node26.1/npm11.13, root engine24.x cảnh báo được ghi; không đổi runtime hệ thống.
- MSW3 dùng API onUnhandledFrame theo declarations đã cài; worker/public generated bằng CLI của package. Đây là seam demo3.0.2, không tự giữ hướng dẫn API v2 hay giả contractM2. Query key thực tế ['store']; URL/context boundary mô tả trong UX/UI Spec.
- Strict typecheck/build PASS,28 unit và24 browser PASS; [report](../../design/validation-report.md). ECharts SVG resolve CSS tokens tại boundary; line labels explicit trênmobile, privacy unmountcharts, reduced animation off.
- [Dependency inventory](../../../finweave-web/dependency-inventory.json), [license file inventory](../../../finweave-web/license-file-inventory.json) và [notices](../../../finweave-web/THIRD_PARTY_NOTICES.txt) giữ metadata/lock/integrity và nội dung upstream đã có. Một số transitive npm package không ship top-level license file (ghi rõ inventory); metadata MIT/parent license/official repo được tham chiếu, không là legal clearance public release.
- Vite giữ cảnh báo main chunk≈1.182MB minified/386kB gzip; MSW chunk≈416kB/160kB. Warm filter dưới target local1s có raw samples; coldstartup/bundle splitting/production latency chưa benchmark. Đây là follow-up khi được giao, không tắt cảnh báo hay suy thành production SLO.

Quyết định frontend đã thực thi và kiểm lại ở M1; frontend assets/domain/services tái dùng được sang M2. Backend, protected transport/auth/key policy/provider vẫn open. Không deploy public, không paid registration, không clone repos tham khảo.
