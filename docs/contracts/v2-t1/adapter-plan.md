# Kế hoạch consumer adapters — không sửa frontend trong lượt này

08/10/2026 · source observation mới tại [AST](../../execution/evidence/arch-05-t1-2026-10-08/consumer-ast.json).70 v1 business declarations +6 identity +18 operational prototype,449 AST entries gồm dynamic/local calls. Số declaration không là số buttons hoặc số runtime tests. [Mapping145 dòng](consumer-operation-mapping.csv), [field differences](../../execution/evidence/arch-05-t1-2026-10-08/consumer-field-differences.json) là đầu vào implementation, không compatibility PASS.

| Consumer | Chuyển đổi đã chốt | Điểm kiểm |
| --- | --- | --- |
| User web/core1.1.0 | Named adapter→canonical2.0.0 revision/hash, envelopes/errors/null/decimal/time/page; query read model→selectors ở một version | Không đổi URL mock bằng search-replace; createHolding phải resolve catalogue/profile; rawEvidence/rawText loại khỏi API view; report redirect vẫn giữ nghiệp vụ |
| Operational mock2.0.0 | getState tách paginated status APIs; fixtures registerExampleDevice/testCollector không server endpoints; workers tiến trạng thái | 18 prototype operations chưa canonical; answer text/run continuation thay full draft; manual/plan-only/multi-goal bundle giữ đủ |
| Admin memory gateway | Separate Ops cookie/MFA transport; credential form; preview/confirm expectedOpsVersion/digest/reason code; safe refetch | No user store/finance imports; adminSignIn mock không credentials không phải authenticated real; Ops timeout dùng opsGetCommandOutcome |
| Android UI shell | OwnerBearer cho human UI, cùng adapter/business requirements như web; native token bridge chỉ allowlisted typed API calls | WebView không nhận refresh/access/collector secrets hoặc generic arbitrary URL bearer injection |
| Kotlin collector | Enrollment + collector challenge/proof → DeviceBearer; epoch/batch ACK/reconcile + encrypted outbox | DeviceBearer chỉ2 operations; bridge settings/consent/quarantine local không là HTTP endpoint; mock status không proof OS permission |
| Backend/worker | OpenAPI request/reply strict dialect, per-actor policies, typed domain mapping/transactions; import worker contract thêm | Internal endpoints private roots; test direct roles/auth rather than trusting caller role/context |

## Transformation policy

Required context phải lấy từ authorized server/query/explicit owner input; adapter không fabricate field, currency, product profile, event/Plan version, empty default income hoặc confirmed simulation. Unknown/null khác0; unsupported target values phải reject hoặc hiện rõ chưa hỗ trợ, không silently drop. Output projections không được UI ghi ngược làm ledger authority.

Source hiện tại có các khoảng cách ở [transport review](../../execution/evidence/arch-05-t1-2026-10-08/transport-source-review.json): LogicalTransport.mode chỉ có synthetic_mock/protected, network() chặn mode khác synthetic_mock, BlockedProtectedTransport luôn throw; queryOptions gắn W-DEMO và mock session/synthetic headers. Khi tích hợp phải có transport trusted_server riêng và context từ session/workspace thật đã authorize; không tắt guard hoặc đổi URL để lách. Mock wakeup/reset/fault headers không sang production.

HttpSyntheticTransport hiện yêu cầu workspaceVersion là number>=1; target identity/admin/collector/internal envelopes có null. Adapter phải xử lý theo actor, không ép null thành0. ApiError cần giữ outcome/resultRef/itemErrors/retry metadata; abort/timeout/malformed response vẫn có thể là unknown outcome, không được đánh mất original command/key. Đây là việc tương lai khi tích hợp frontend, không thay frontend trong lượt này.

[Field handling](field-handling.csv) inventories9686 schema paths/branches (không phải9686 business fields độc lập), có owner/dependencies.38 baseline explicit storage rules +3 D1/J2 rules thành41 reviewed transformations; phần còn lại là service parameters/projections, **chưa có SQL/query mapping implementation**. Nested payload rule có thể dẫn parent object.content, không nghĩa mỗi JSON leaf là một cột. Storage column tồn tại không chứng minh đủ quyền/validation/business correctness.

Fresh field diff dùng observed schemas/current source, giữ union branches/required/null/enums/bounds; không copy r1 diff làm hiện trạng. Source rows cho target-only operations ghi MISSING; các method local/synthetic ghi riêng. New native authentication/server capabilities chưa tồn tại trong TypeScript bridge/Kotlin: phải mở rộng adapter/bridge khi sang implementation, không đánh dấu đã xong từ docs.

## Cutover

1. Implement DB/role/Engine/backend synthetic với exact contract revision+hash, request **và reply** conformance, negative auth/domain/concurrency tests.
2. User read/history adapters, rồi financial mutations/preview/replay/import/planning; preserve oracle behavior và current frontend checked scope. Operational/catalogue/Agent/draft states tiếp nối, không feature cut.
3. Admin transport/session/MFA và safe commands/outcome; Android owner API bridge rồi collector native credentials/outbox/reconcile/device tests.
4. Mỗi consumer build pin revision/hash; feature flag cuts over whole named contract capability, không implicit fallback sangmock hoặc trộn hai authorities. Runtime regression/evidence mới trước nhận integration.

Không đổi scripts/evidence/frontend đã nghiệm thu để làm schema PASS. Mock-first tests không là native/network/DB/security acceptance. Source snapshots giữ nguyên.
