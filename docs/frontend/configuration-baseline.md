> Rà frontend 08/10/2026 dùng [runner/evidence mới](../testing/integration-handover.md), catalogue50 IDs và runtime core1.1 + operational prototype2.0 khác canonical. Không chạy generator/runner Step6 dưới đây để chốt nghiệm thu hiện hành.

> Trạng thái08/10/2026: [hồ sơ bàn giao](../handover/README.md), [UI đã triển khai](../execution/ui-implementation-2026-10-08.md) và [RTM41 AC](../execution/realignment-traceability.md) là điểm vào hiện hành. Phần Step4–6 bên dưới giữ lịch sử M2; không chứng minh UI mới/backend/native/security và chưa chạy lại trong lượt bàn giao.

> Baseline v3 — 07/10/2026: phần dưới mô tả thiết kế/triển khai mock lịch sử. Phạm vi hiện hành theo [PRD](../product/prd.md), [SRS](../requirements/srs.md), [API delta](../contracts/operational-api-spec.md), [UI delta](../design/operational-design-delta.md) và [audit](../execution/product-realignment-audit.md). Chưa migrate runtime/schema; không dùng evidence cũ làm PASS cho Android/backend/Agent thật.

# Configuration Baseline — lịch sử bước 5–6

CFG-S5-001 · v0.2 · 06/10/2026 · frontend mock local. Tái dùng ADR-001…003; wiring/read-model quyết định ở ADR-004.

Node24.x (máy hiện tại bundled24.19), npm lockfile giữ SHA256 93ce8cb03f0e38b9b448de82d26af704f8d1693315dd862813599b2beffb2b95. 21 direct dependencies exact pins trong package.json; dependency/license baseline bước3–4 giữ nguyên, không cài package mới. Lockfile là manifest phân phối; không tuyên bố security audit mới/không có CVE. Local installed declarations dùng để kiểm API MSW3 và build/test thực tế. Framework React19.3/Router8.4/Vite8.3, TypeScript5.9, ReactHookForm/Zod4, Query5, ECharts6/Decimal/Lucide/MSW3; các số patch cụ thể ở package.json/lockfile.

VITE_DATA_MODE=synthetic_mock là public enum, không credential. `.env.example` có duy nhất mode; thiếu env chọn mock explicit compile default. Mode khác đóng startup và protected adapter. Không .env secret, token/key/provider credential trong bundle/localStorage. sessionStorage chỉ fake .test profile + synthetic opaque sessionId/challenge, không financial Store/password. Filters/context route ở URL chỉ chứa IDs synthetic; production protected search routing/privacy còn PoC blocked.

Dev loopback5173; bàn giao dist loopback4181 với SPA fallback + MSW worker. `Start-Prototype.cmd` dùng runtime bundled hoặc node PATH; không deploy public. Query TTL infinite until invalidation; no automatic query/mutation retries; network timeout5s; mock delay80ms; preview TTL10min; mock session30min, challenge5min; import500ms và AI650ms progressed via polling. Domain business clock31/10/2026 18:00+07, không dùng clock máy để bịa date tài chính.

Scripts: `node scripts/check.cjs build|unit|contracts|browser` từ finweave-web. Build chạy tsc-b trước Vite, dừng khi fail, ghi evidence/step5-build.log. Unit dùng one thread/TEMP work/tmp cho sandbox; browser Chrome installed, cần loopback được phép. Contracts generate + static audit current action/state/REQ. Dependency install chỉ `npm ci --ignore-scripts` nếu cần, dùng lock và policy; không cần cài để mở dist. Build warning lớn do ECharts/app/MSW được ghi đúng trong report, không production performance/SLO claim.

Files register/source checks và SHA manifest ở [Delivery checks](../execution/evidence/step5-delivery-checks.json). Step3–4 reports là lịch sử, Step5 là trạng thái wiring hiện hành; requirement numbers giữ nguyên28. Real auth/crypto/Anti-Ops code distribution/trusted runtime/provider/storage còn BLOCKED_SECURITY_POC.

History pageSize10/cursor và manual Tải thêm; import poll250ms, AI poll200ms (query xử lý còn pending250ms). Các config Playwright bước5/full, addon, context và retry giữ evidence riêng; verify-delivery.cjs nối kết quả cuối theo từng case mà không xóa failure history.

## CFG-S6-001 / M2 acceptance baseline

No dependency/stackchange. /designv0.3, appv0.2 sameproject; sixchecks via node scripts/check-step6.cjs typecheck/lint/build/unit/contracts/browser. Chrome local required, server node run-local.cjs4181 muststayalive. Dedicated playwright.step6 config1worker; FINWEAVE_URL testonly, FINWEAVE_EVIDENCE_PREFIX=step6, evidence isolated. UI/network5sdeadline, wake1.5s after20sidle, no financialpersistence. CustomAST architecturelint6rules; no ESLintinstalled. [Commands/env/auth/transport/integration](../testing/integration-handover.md), [Acceptance](../testing/frontend-acceptance-report.md), newstep6manifest. HistoricalStep5 evidence remainsunchanged.
