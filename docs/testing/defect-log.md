# Defect log — rà frontend08/10/2026

[35ca baseline](../execution/evidence/frontend-review-2026-10-08/acceptance-2/failure-investigation.json) và [mọi lỗi diagnostic](../execution/evidence/frontend-review-2026-10-08/acceptance-2/diagnostic-investigation.json) giữ nguyên thông báo lỗi, nguyên nhân, cách sửa, expected oracle và trạng thái regression. Kết luận chỉ theo [nghiệm thu hiện hành](frontend-acceptance-report.md).

| ID | Lỗi sản phẩm phát hiện trong rà soát | Sửa và regression |
|---|---|---|
| FR-D01 | Mất entry mô phỏng thủ công sau gộp Goals | Entry kịch bản tiền hiện có; B09/B20/S6-E11 |
| FR-D02 | Mất retry completed CSV cùng request/key | Entry completed job dùng yêu cầu gốc; N03/B04 |
| FR-D03 | Mất công cụ source kế thừa | SourceControls với nhãn synthetic và preview/confirm; B04/B05/B15/B16 |
| FR-D04 | Goal UI thiếu cảnh báo backing khi actual giảm | Hiện actual.shortfall, không chặn ghi actual; B08 giữ60→50%, thiếu500k |
| FR-D05 | Cashflow/forecast/Goal/admin chữ không đủ tương phản | Sửa foreground, giữ axe nguyên; B12 vàOP06 |
| FR-D06 | Bảng kết quả kịch bản mất chi gộp/ròng lũy kế | Khôi phục trước/sau từ baseGross/baseNet + simulated delta; B09 giữ6.1m |

Test lỗi thời được sửa theo UI đã được người dùng thay đổi: nhãn, dấu chấm tiền, collapsed filters/details, catalog/profile, scoped selectors và app/navigation readiness. B02/B07 chuyển riêng oracle số đã bỏ khỏi UI sang API đọc, có ghi rõ lớp kiểm; không đổi expected balance. OP01 dùng quantities đúng DTO; không sửa contract cho hợp test. Các lỗi test không được đếm thành lỗi sản phẩm.

Môi trường diagnostic-2: 20 ca có HTTP 504 Outdated Optimize Dep do cache Vite dùng chung, một ca có ERR_NETWORK_CHANGED chưa xác định nguyên nhân mạng sâu hơn; cả 21 dừng ở auth fixture. [Điều tra từng ca](../execution/evidence/frontend-review-2026-10-08/acceptance-2/aborted-cases-investigation.json) giữ trace; đã tách cache user/admin/preview và chạy lại. Lượt bị dừng không chốt nghiệp vụ hoặc bị biến thành PASS. Ngưỡng performance, axe và0retry giữ nguyên.

## Hồ sơ Step6 ngày06/10 (lịch sử, không phải kết luận hiện hành)

# Defect Log — bước 6

TST-DEF-001 · v1.0 · 06/10/2026. Các lỗi ảnh hưởng scope frontend mock đã sửa và regression. Raw failures/ảnh trước sửa giữ nguyên. [Acceptance](frontend-acceptance-report.md) chốt gate với giới hạn nghiên cứu/security riêng.

| ID / severity | Trigger, ảnh hưởng | Sửa | Verification / trạng thái |
|---|---|---|---|
| S6-D01 / P1 | Worker đã commit nhưng ACK mất; tạo key mới khi retry có thể ghi tiền hai lần | Giữ exact operation/input/options theo key đến refetch thành công; unknown outcome chỉ retry cùng request | S6-RETRY unit lost ACK + intervening mutation; E03 exact body/single event; PASS |
| S6-D02 / P2 | HTTP500 HTML bị hiểu là OFFLINE | Classify theo HTTP status, malformed success502, retry metadata đúng | S6-HTTP HTML500 + 6 statuses; PASS |
| S6-D03 / P2 | Invalid DTO/version/requestId/wsVersion thành opaque ZodError | Reject localized ApiError502 trước cache; không fallback/snapshot hỏng | 4 corruptions độc lập; PASS |
| S6-D04 / P2 | Đổi amount/account trong lúc preview pending | Disable form fields, confirmation immutable | E06 pending lock và amount/cash; PASS |
| S6-D05 / P2 | CSV preview/error cũ trả sau khi input đổi | Epoch bỏ cả success/error cũ | E05 delayed preview PASS; error branch source-reviewed |
| S6-D06 / P2 | Cancel AI500 bị nuốt lỗi; UI giả đã hủy, queued request có thể gửi tiếp | ACK/error/retry, giữ pending khi cancel chưa xác nhận, queued cancel và epoch guard | E07, E09, B18/N04 full + final AI regression PASS |
| S6-D07 / P2 financial copy | Food/Shopping cùng net400k nhưng insight chỉ nói Food lớn nhất | All leaders đồng hạng theo cùng snapshot | E08 baseline tie và Food450k sau mutation; PASS |
| S6-D08 / P2 | Initial CSV template pending; clear textarea vốn rỗng không phát change, late template refill | Khóa textarea/restore đến template settle; giữ explicit empty draft | Run1 N05 FAIL; pilot và full N05 PASS |
| S6-D09 / P2 | IAB sau idle có GETmodel không được worker intercept; Data flow lỗi HTML | Serialized public MSW stop/start trước request sau idle>20s, deadline1.5s; cùng repository/auth, không reset/fallback | E10 thực chờ21s, ledger31.05→31.03 không reload; pilot/full PASS; direct before/after screenshots |
| S6-D10 / P2 | AI câu explicit mô phỏng chứa “tài sản/mục tiêu” chọn tool khác; report tie chỉ nói một nhóm | Ưu tiên explicit simulation intent sau denial/fault guards; report nêu mọi leader | 2 scripted-acceptance units + E11 simulation26.1m/classification và tie400k PASS; 8 final AI regression PASS |
| S6-ENV01 / environment | Run0 thiếu server4181, ERR_CONNECTION_REFUSED | Restart same run-local.cjs, rerun | Interrupted history giữ nguyên, không dùng làm PASS |
| S6-TOOL01 / harness | Portable audit copy sai baseline path → ENOENT | Đọc immutable checked-in Step5 input hashes, bỏ external M1 dependency | Initial failure log; contract audit final exit0 |
| S6-TOOL02 / harness | Test mới đọc Metric.value.classification thay root Metric.classification; 2 assertion và build lỗi | Sửa oracle đọc đúng DTO, không đổi contract để hợp test | Initial failure JSON/log retained; final unit99/99 và build exit0 |
| S6-BL01 / P3 backlog | App chunk≈1.262MB/gzip≈411KB; mock chunk≈469KB/gzip≈177KB | Route/chart lazy loading và production bundling sau secure adapter policy | Build PASS có warning; local warm filter không cold-start/production SLO |
| SEC-REAL / integration blocker | Trusted client/keys/identity/Anti-Ops protected transport chưa PoC | Candidate adapter fail closed; dữ liệu thật chưa được tích hợp | Negative unit chỉ chứng minh refusal, chưa đạt security gate |

Không hoãn lỗi sai tiền, action chính hỏng, mất dữ liệu mock trong phiên hoặc severe responsive/a11y. Không còn blocker như vậy đã biết trong scope frontend mock. Chưa user research/UAT/PO sign-off, chưa backend durable/security/provider thật. [Raw summary](../execution/evidence/step6-acceptance-summary.json) ghi các lượt pass; [Acceptance](frontend-acceptance-report.md) giữ failure history.

D09: quan sát trực tiếp chứng minh idle interception mất và hồi phục. Việc hệ điều hành/browser chấm dứt service worker là suy luận phù hợp triệu chứng, chưa đo nguyên nhân OS; không tuyên bố lifecycle wake giải quyết mọi browser/provider.
