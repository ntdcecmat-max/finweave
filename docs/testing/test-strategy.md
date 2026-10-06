# Test Strategy — nghiệm thu frontend M2

TST-STR-001 · v1.0 · 06/10/2026 · scope-v2/analysis-v2, 28 REQ/AC hiện hành và AUTH-UI-01…08. Gate này dành cho frontend với synthetic mock; real auth, provider, protected transport và durable backend vẫn BLOCKED_SECURITY_POC. Không thực hiện bước 7–9.

Mục tiêu là chứng minh số tiền, actions và recovery hoạt động qua hooks → services → logical API 1.1.0 → MSW → stateful repository. So sánh oracle độc lập trong operational scenarios; kiểm schema/examples không thay thế kiểm hành vi. Không nhập fixture vào production UI, không trả demo data khi request lỗi.

## Tầng kiểm tra và exit criteria

| Tầng | Phương pháp | Điều kiện chấp nhận |
|---|---|---|
| Typecheck/build | TypeScript noEmit; Vite production bundle | Exit 0; ghi warning thực tế |
| Lint | TypeScript AST + architecture rules trong scripts/lint.cjs | Syntax/import boundary/no direct UI fetch/no storage secret/no eval/public-env allowlist; không gọi đây là ESLint/style lint |
| Unit/domain | Vitest một worker, financial oracle và rollback | Sai tiền, unknown≠zero, actual/planned/simulated, duplicate/correction/FX/rounding phải qua |
| Contract/HTTP | Strict Zod requests/results; OpenAPI refs/examples; MSW fetch; độc lập làm hỏng response | Reject malformed DTO/version/requestId; ownership/version/cursor/idempotency; không fallback |
| E2E | Chrome installed, stateful worker, giả .test, fresh context mỗi case | Luồng 5 nav/auth; form validation/preview/commit/refetch; lỗi/retry/lost ack/stale response hoạt động |
| A11y/responsive | axe WCAG2 A/AA + 2.1AA; screenshots; DOM overflow; keyboard/focus/Escape/reduced motion | Không critical/serious; không page overflow 1440×900,390×844,360×844; mọi chart có bảng; whole-app masking |
| Direct review | Agent thao tác browser và nhìn render/reference | Hierarchy, font tiếng Việt, màu/icon nhất quán, drill-down và context; lưu evidence |

Mọi P0/P1/P2 ảnh hưởng số tiền, mất mock data trong cùng phiên, action/luồng chính, severe responsive/a11y phải sửa và regression. Thẩm mỹ nhỏ hoặc production optimization có thể backlog với tác động. Lượt lỗi được giữ riêng, không sửa raw result thành PASS. Kết quả gate dựa raw reports mới nhất và phạm vi kiểm, không dựa số dòng RTM.

## Môi trường và dữ liệu

Windows, Node 24.19.0, 21 exact dependency pins/lock kế thừa, Chrome local; dist tại 127.0.0.1:4181. MSW worker trong browser; Vitest MSW server cho HTTP tests. Business clock 31/10/2026 18:00+07. F-COMPLETE là baseline mỗi reload; fixtures khác qua reset explicit. Auth marker .test có hạn trong sessionStorage; financial state/jobs/chat là memory, reload không chứng minh durable backend. Không Internet/provider/LLM thật.

Test-only fault harness bao quanh fetch nhưng gọi worker thật cho delay/lost-after-commit; status faults trả error DTO, không giả success. Timeout dùng AbortSignal 5s. Query filters UI là local projection từ cùng snapshot nên đổi filter không tạo list HTTP request giả; AI captured context và import preview dùng epoch, repository cursor giữ filter/version.

## Chạy lại

Xem [Integration Handover](integration-handover.md) để mở server trước browser. Sáu mode độc lập: `node scripts/check-step6.cjs typecheck|lint|build|unit|contracts|browser` (thay một mode mỗi lệnh). FINWEAVE_URL chỉ test base URL; FINWEAVE_EVIDENCE_PREFIX=step6 được runner đặt. Không chạy verify-delivery.cjs bước 5 để ghi đè evidence lịch sử. TST-EVD-001 summary và SHA manifest mới dành riêng bước 6.

Agent tự kiểm; 0 participants research, chưa user test/UAT/PO sign-off; chưa screen reader audit, real mobile hardware hay cross-browser matrix. [Cases/data](test-cases-data.md), [defects](defect-log.md), [acceptance](frontend-acceptance-report.md).
