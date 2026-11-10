# API004 / DB005 addendum

**DESIGN / NOT INTEGRATED.** [Bundle pins](implementation-bundle.json). [API004](../contracts/v2-t1-r4/README.md) có **153 operations / 634 schemas**; API003 giữ nguyên byte/hash. Hai schema sửa có wire delta rõ, hai queries mới xử lý coverage phân trang; exact header004 bắt buộc, không suy tương thích từ body2.0.0. Phần execution-semantic không tự nhận consumers đã migrate.

| Contract/port | Nghĩa đã chốt ở ARCH-09 |
| --- | --- |
| ingestNotifications/reconcileReceipts | Exact immutable batch pairing/digest; durable khác posted; missing sau restore không auto repost; không thêm recoveryReplay=true ngầm |
| dispatchJobs | Counts-only; batch≤20, lease request30…120 là ceiling, server clamp xuống profile/active cap/deadline; có slots mới claim |
| processIngestionReceipt | Một typed receipt ticket; domain effect+marker+job success atomic hoặc marker-first ACK; không post lại khi queue ACK mất |
| requestPriceRefresh/getRefreshJob/executePriceRefresh | Exact frozen selection/coalesce, parent-child manifests dùng existing typed payload; partial/rate_limited khác queue state; Retry-After date mapping rõ |
| confirmImport/executeImportJob/getImportJob | Confirm pins selected rows; atomic selected bundle; completed có thể có Review; không thêm cancelled vào enum |
| send/get/cancelAssistantMessage | Chat cũ có assistant_message typed local worker port, không ép startAgentRun.intent thành chat |
| start/answer/cancel/getAgentRun, executeAgentStep | Answer CAS/continuation; release awaiting-user lease; global run counters không reset qua retries |
| start/get/cancel/executeForecastRun | 202 enqueue; completed=false chỉ chunk; compute riêng loop, fence checkpoint/publish; no partial trial probability |
| getSyncState/getCommandOutcome | Recovery/session generation precedence, financial vs control versions, exact same-key retry, committed≠task done |
| opsPreviewAction/opsConfirmAction | Safe control request khác private action completion; retry không bypass current permission/budget |
| purgeExpiredData | Global bounded maintenance, policy cutoff/pins; không full finance erasure |

Private helper ports claim/heartbeat/checkpoint/quota-reserve/Assistant-message completion là application/DB ports trên P2 codebase; không tự expose public routes. Profile logical names trong registry phải map exact principal/SQL grants khi implement; tests không nhận khớp chữ là đã enforce permission.

DB005 bổ sung `jobs.policy_version/deadline_at`, `refresh_jobs.request_payload_id` và `provider_quota_buckets`. [Migration plan](../data/target-t1-async/migration-plan.md) mô tả constraints/typed payload/request-intent CAS; chưa executable SQL. Existing table columns vẫn giữ trong expand model, legacy dispatch columns/indexes không là active authority.

## Wire findings và disposition

| ID | Quan sát nguồn đã pin | Cách xử lý hiện hành / gate |
| --- | --- | --- |
| GAP-ASY-01 | API003 previewImport.mapping.date có format=date và amount có money pattern dù mapping là tên cột CSV | DESIGN RESOLVED ở API004: bounded column-name selectors; signed mode cần amount, debit-credit mode cần cả debit/credit; schema tests không thay runtime parsing tests |
| GAP-ASY-02 | API003 getSyncState coverage/deviceIds/gaps≤100, input không scope/cursor | DESIGN RESOLVED ở API004: explicit completeness flags + listCoverage/listCoverageGaps với snapshot paging; giữ listDevices paging; không giới hạn tổng account/gaps |
| GAP-ASY-03 | API003 không có authorized recovery replay operation giữ original capture provenance | Safe default missing→investigation/Review/manual proof; không auto resend after restore. Tự phục hồi receipt cần contract+security review riêng, không claim hiện đã có |

GAP-ASY-01/02 đã sửa thiết kế, **IMPLEMENTATION/CONSUMER MIGRATION NOT RUN**. ARCH-09 lưu cả source evidence003 và disposition004; chưa tuyên bố hồ sơ toàn product sẵn sàng production. GAP-ASY-03 là lựa chọn fail-closed, không requirement zero-loss.

Source hiện tại vẫn hybrid prototype1.1.0/operational2.0.0 và mock/local forecast. Mapping ở đây là planned consumer work, không chứng cứ API thật/native đã chạy. Các lỗi wire có evidence trong research/source observations; không thay r1/r2 hoặc đánh dấu frontend acceptance failed chỉ vì target backend chưa tích hợp.
