# FinWeave frontend

**Hiện hành 03/11/2026:** hỗ trợ backend local API005, admin và Android native bridge003. Chạy `Start-FinWeave.cmd` từ root; xem [hướng dẫn](../docs/LOCAL-QUICKSTART.md) và [kết quả nghiệm thu local](../docs/execution/completion-2026-11-03.md). APK minh họa và APK debug nối local được bàn giao riêng. Không bật nguồn tài chính thật.

## Lịch sử M2 synthetic mock

Cùng app React/Router/Vite/TypeScript bước3–5; 21 exact pins giữ lock. Gate bước6 **PASS_FRONTEND_SYNTHETIC_MOCK**, real-data integration **BLOCKED_SECURITY_POC**. Không backend/provider/real keys.

Từ root chạy Start-Prototype.cmd, hoặc tại thư mục này: node run-local.cjs 4181. Mở [Home](http://127.0.0.1:4181/home), [login](http://127.0.0.1:4181/auth/login), [design](http://127.0.0.1:4181/design). Điền mẫu → đăng nhập → 123456. Baseline cash31.1m/assets76.1m; reload reset financial memory. Năm navigation giữ Plan/Goals/simulation và AI/history/shared panel; auth mock qua network.

Node24, từng lệnh riêng: node scripts/check-step6.cjs typecheck, lint, build, unit, contracts, browser. Giữ server4181 trước browser. node scripts/verify-step6.cjs kiểm raw evidence/hashes/liên kết và tạo manifest riêng Step6; không ghi đè report Step3–5. npm aliases check:m2:* dùng cùng runner; npm run dev cho loopback5173. [Lệnh chính xác và tích hợp](../docs/testing/integration-handover.md).

Kết quả: 99/99 unit, full54/54 + AI regression8/8 =55 distinct PASS; 72 axe renders 0 violations. Custom AST/architecture lint không phải ESLint; bundle warning P3 backlog. [Acceptance](../docs/testing/frontend-acceptance-report.md), [raw summary](../docs/execution/evidence/step6-acceptance-summary.json), [manifest](../step6-manifest-sha256.json).

Source app/context → services/presentation/command-adapter → api → mocks/browser → repository → domain. UI chỉ đọc strict readonly DTO/selectors và gọi hooks/services; không import fixture hoặc fallback khi lỗi API. Mutations có preview/version/idempotency; lost ACK giữ exact request đến refetch thành công. Mock idle wake giữ repository/auth, không reload/reset. Contract exact1.1.0.

.env.example chỉ public mode synthetic_mock. Đặt protected trước build để tắt worker: startup/adapter fail closed trước fetch; chưa tích hợp dữ liệu thật. Financial store/jobs/chat memory, auth marker synthetic sessionStorage có hạn; không localStorage secrets/durable backend. AI scripted read-only.

[Mock](../docs/frontend/mock-implementation.md), [Configuration](../docs/frontend/configuration-baseline.md), [ADR004](../docs/architecture/adr/ADR-004-stateful-mock-and-read-model.md). Agent tự walkthrough; không user test/UAT/security certification. Dừng M2.
