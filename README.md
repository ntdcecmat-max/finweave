# FinWeave — frontend M2 đã kiểm thử và bàn giao

Gate bước 6: **PASS_FRONTEND_SYNTHETIC_MOCK**. Scope-v2/analysis-v2 giữ 28 REQ/AC, 13 module, 5 navigation và authentication. Đây là cùng app/design/stack từ bước 3–5; AI scripted, không backend thật.

## Mở và thử

[Home](http://127.0.0.1:4181/home), [Đăng nhập](http://127.0.0.1:4181/auth/login), [Design gallery](http://127.0.0.1:4181/design). Nếu server dừng, chạy Start-Prototype.cmd và giữ cửa sổ server. Dist có sẵn; Node24 bundled hoặc trong PATH, không cần Internet để xem.

Đăng nhập: **Điền thông tin mẫu → Đăng nhập demo → 123456**. Chỉ dùng dummy .test và dữ liệu giả. Baseline cash31.100.000₫ = bank26.500.000 + wallet1.750.000 + cash2.850.000; assets76.100.000₫ gồm stock5m/gold40m. Ăn uống và Mua sắm cùng chi ròng400k; Mua sắm gross600k/refund200k. Bấm chart/metric/account/holding để thấy giao dịch, nguồn, ngày, đơn vị và lịch sử.

Ghi chi50k từ Tiền mặt qua form → preview → xác nhận: cash31.050.000₫, assets76.050.000₫, ăn uống450k. Cards/charts/details cùng snapshot. Dữ liệu: CSV mẫu/file/paste → mapping/subset preview → confirm job → Review. Plan: planned items/actual links, Goals/allocation, frozen simulation. AI: chat/history/panel dùng cùng context, source và kết quả đọc; không ghi tiền qua chat. Settings có fixture/reset/offline/timeout/conflict/quota; lỗi giữ input và retry rõ ràng. Mask áp dụng toàn app, chart có bảng thay thế.

Tiền/jobs/chat là memory trong phiên; reload trở về F-COMPLETE. Auth marker synthetic còn hạn có thể tồn tại qua reload cùng tab. Reset xóa dữ liệu/drafts/filter/chat; logout xóa session/cache. Đây không phải persistence backend.

## Kết quả và hồ sơ

- Typecheck/lint/build/contracts exit0; **99/99 unit**, **55 browser case khác nhau PASS** qua full54 + final AI regression8 (7 trùng,1 mới).
- **72 render, 0 axe violations** ở 1440×900,390×844,360×844; keyboard/direct browser/visual review có evidence.
- [Acceptance Report](docs/testing/frontend-acceptance-report.md), [machine summary](docs/execution/evidence/step6-acceptance-summary.json), [Defect Log](docs/testing/defect-log.md), [SHA manifest](step6-manifest-sha256.json).
- [Test Strategy](docs/testing/test-strategy.md), [Cases/Data](docs/testing/test-cases-data.md), [Contract Results](docs/testing/contract-test-results.md), [A11y/Responsive/Visual](docs/testing/accessibility-responsive-report.md).
- [Integration Handover](docs/testing/integration-handover.md): base URL/auth/env/version/adapters, cách tắt mock, lệnh chạy lại thực tế.
- [Module/interface/action/state catalogue](docs/execution/evidence/step6-action-coverage.md), [28 REQ/AC runtime matrix](docs/execution/evidence/step6-runtime-coverage.md), [RTM](docs/execution/traceability.md), [Register](docs/governance/artifact-register.md).
- [Components](docs/design/component-specifications.md), [Patterns](docs/design/pattern-library.md), [UX/UI](docs/design/ux-ui-specification.md), [Mock](docs/frontend/mock-implementation.md), [Configuration](docs/frontend/configuration-baseline.md), [Contracts1.1](docs/contracts/README.md).

Từ finweave-web, Node24: chạy riêng từng mode của scripts/check-step6.cjs: typecheck, lint, build, unit, contracts, browser; mở server4181 trước browser. Sau đó scripts/verify-step6.cjs kiểm raw results/liên kết/hashes và tạo manifest. Lệnh đầy đủ trong handover. 21 exact dependency pins/lock giữ nguyên. Lint là custom AST/architecture rules, không phải ESLint. Raw failure history bước3–6 được giữ nguyên.

Agent tự kiểm; chưa user research/UAT/PO sign-off. Backlog P3 bundle/cold-start; **real-data integration BLOCKED_SECURITY_POC**, protected mode fail closed trước fetch. Không tài chính thật, real LLM/provider, public deploy hoặc paid account. Dừng ở M2. Original inputs/References giữ nguyên; ảnh concept không nhúng thay UI, mascotSVG tự vẽ.
